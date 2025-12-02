<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Account;
use App\Models\Product;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $query = Purchase::with(['supplier', 'fromAccount', 'transaction']);

        // Apply filters
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('supplier_invoice_no', 'like', '%' . $request->search . '%')
                  ->orWhereHas('supplier', function($q) use ($request) {
                      $q->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        if ($request->supplier && $request->supplier !== 'all') {
            $query->whereHas('supplier', function($q) use ($request) {
                $q->where('name', $request->supplier);
            });
        }

        if ($request->payment_status && $request->payment_status !== 'all') {
            if ($request->payment_status === 'paid') {
                $query->where('due_amount', 0);
            } elseif ($request->payment_status === 'partial') {
                $query->where('paid_amount', '>', 0)->where('due_amount', '>', 0);
            } elseif ($request->payment_status === 'due') {
                $query->where('paid_amount', 0);
            }
        }

        if ($request->start_date) {
            $query->where('purchase_date', '>=', $request->start_date);
        }

        if ($request->end_date) {
            $query->where('purchase_date', '<=', $request->end_date);
        }

        // Apply sorting
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $purchases = $query->paginate($request->per_page ?? 10);

        // Add payment_type from transaction
        $purchases->getCollection()->transform(function ($purchase) {
            $purchase->payment_type = $purchase->transaction->payment_type ?? 'N/A';
            return $purchase;
        });

        return Inertia::render('Purchases/Index', [
            'purchases' => $purchases,
            'suppliers' => Supplier::select('id', 'name')->get(),
            'accounts' => Account::select('id', 'name', 'ac_number')->get(),
            'products' => Product::with('unit')->select('id', 'product_name', 'product_code', 'unit_id', 'purchase_price')->get(),
            'filters' => $request->only(['search', 'supplier', 'payment_status', 'start_date', 'end_date', 'sort_by', 'sort_order', 'per_page'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'purchase_date' => 'required|date',
            'supplier_id' => 'required|exists:suppliers,id',
            'supplier_invoice_no' => 'required|string|max:255',
            'from_account_id' => 'required|exists:accounts,id',
            'payment_type' => 'required|in:Cash,Bank,Mobile Bank',
            'net_total_amount' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'due_amount' => 'required|numeric|min:0',
            'remarks' => 'nullable|string',
            'products' => 'required|array|min:1',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.unit_price' => 'required|numeric|min:0',
            'products.*.quantity' => 'required|numeric|min:0',
            'products.*.amount' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($request) {
            // Get account numbers
            $fromAccount = Account::find($request->from_account_id);
            $supplier = Supplier::with('account')->find($request->supplier_id);

            // Create transaction for payment
            $transaction = Transaction::create([
                'ac_number' => $fromAccount->ac_number,
                'transaction_type' => 'Dr',
                'amount' => $request->paid_amount,
                'description' => 'Purchase from ' . $supplier->name . ' - Invoice: ' . $request->supplier_invoice_no,
                'payment_type' => strtolower($request->payment_type),
                'bank_name' => $request->bank_name,
                'branch_name' => $request->branch_name,
                'account_number' => $request->account_no,
                'cheque_type' => $request->bank_type,
                'cheque_no' => $request->cheque_no,
                'cheque_date' => $request->cheque_date,
                'mobile_bank_name' => $request->mobile_bank,
                'mobile_number' => $request->mobile_number,
                'transaction_date' => $request->purchase_date,
                'transaction_time' => now()->format('H:i:s'),
            ]);

            // Create supplier credit transaction if paid amount > 0
            if ($request->paid_amount > 0) {
                Transaction::create([
                    'ac_number' => $supplier->account->ac_number,
                    'transaction_type' => 'Cr',
                    'amount' => $request->paid_amount,
                    'description' => 'Payment received for Invoice: ' . $request->supplier_invoice_no,
                    'payment_type' => strtolower($request->payment_type),
                    'transaction_date' => $request->purchase_date,
                    'transaction_time' => now()->format('H:i:s'),
                ]);
            }

            // Create accounts payable entry if due amount > 0
            if ($request->due_amount > 0) {
                // Find or create accounts payable account
                $payableAccount = Account::where('name', 'Accounts Payable')->first();
                if ($payableAccount) {
                    Transaction::create([
                        'ac_number' => $payableAccount->ac_number,
                        'transaction_type' => 'Cr',
                        'amount' => $request->due_amount,
                        'description' => 'Due amount for Invoice: ' . $request->supplier_invoice_no,
                        'payment_type' => 'credit',
                        'transaction_date' => $request->purchase_date,
                        'transaction_time' => now()->format('H:i:s'),
                    ]);
                }
            }

            // Create purchase record
            Purchase::create([
                'purchase_date' => $request->purchase_date,
                'supplier_id' => $request->supplier_id,
                'transaction_id' => $transaction->id,
                'supplier_invoice_no' => $request->supplier_invoice_no,
                'from_account_id' => $request->from_account_id,
                'net_total_amount' => $request->net_total_amount,
                'paid_amount' => $request->paid_amount,
                'due_amount' => $request->due_amount,
                'remarks' => $request->remarks,
            ]);
        });

        return redirect()->back()->with('success', 'Purchase created successfully.');
    }

    public function update(Request $request, Purchase $purchase)
    {
        $request->validate([
            'purchase_date' => 'required|date',
            'supplier_id' => 'required|exists:suppliers,id',
            'supplier_invoice_no' => 'required|string|max:255',
            'from_account_id' => 'required|exists:accounts,id',
            'payment_type' => 'required|in:Cash,Bank,Mobile Bank',
            'net_total_amount' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'due_amount' => 'required|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $purchase) {
            // Update purchase
            $purchase->update([
                'purchase_date' => $request->purchase_date,
                'supplier_id' => $request->supplier_id,
                'supplier_invoice_no' => $request->supplier_invoice_no,
                'from_account_id' => $request->from_account_id,
                'net_total_amount' => $request->net_total_amount,
                'paid_amount' => $request->paid_amount,
                'due_amount' => $request->due_amount,
                'remarks' => $request->remarks,
            ]);

            // Update main transaction
            $fromAccount = Account::find($request->from_account_id);
            $supplier = Supplier::with('account')->find($request->supplier_id);

            $purchase->transaction->update([
                'ac_number' => $fromAccount->ac_number,
                'amount' => $request->paid_amount,
                'description' => 'Purchase from ' . $supplier->name . ' - Invoice: ' . $request->supplier_invoice_no,
                'payment_type' => strtolower($request->payment_type),
                'transaction_date' => $request->purchase_date,
            ]);
        });

        return redirect()->back()->with('success', 'Purchase updated successfully.');
    }

    public function destroy(Purchase $purchase)
    {
        DB::transaction(function () use ($purchase) {
            // Delete related transaction
            $purchase->transaction?->delete();
            
            // Delete purchase
            $purchase->delete();
        });

        return redirect()->back()->with('success', 'Purchase deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:purchases,id'
        ]);

        DB::transaction(function () use ($request) {
            $purchases = Purchase::whereIn('id', $request->ids)->get();
            
            foreach ($purchases as $purchase) {
                $purchase->transaction?->delete();
                $purchase->delete();
            }
        });

        return redirect()->back()->with('success', 'Purchases deleted successfully.');
    }
}