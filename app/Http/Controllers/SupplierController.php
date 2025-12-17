<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\Account;
use App\Models\Group;
use App\Helpers\AccountHelper;
use App\Models\CompanySetting;
use App\Models\Voucher;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::with('account.group');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('mobile', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status === 'active');
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 10);
        $suppliers = $query->paginate($perPage)->withQueryString()->through(function ($supplier) {
            return [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'mobile' => $supplier->mobile,
                'email' => $supplier->email,
                'address' => $supplier->address,
                'proprietor_name' => $supplier->proprietor_name,
                'group_id' => $supplier->account->group_id ?? null,
                'group_code' => $supplier->account->group->code ?? null,
                'status' => $supplier->status,
                'created_at' => $supplier->created_at->format('Y-m-d'),
            ];
        });

        $groups = Group::where('status', true)->get(['id', 'code', 'name']);

        // Get last supplier's group for auto selection
        $lastSupplierGroup = null;
        $lastSupplier = Supplier::with('account.group')->latest()->first();
        if ($lastSupplier && $lastSupplier->account && $lastSupplier->account->group) {
            $lastSupplierGroup = [
                'id' => $lastSupplier->account->group->id,
                'code' => $lastSupplier->account->group->code
            ];
        }

        return Inertia::render('Suppliers/Suppliers', [
            'suppliers' => $suppliers,
            'groups' => $groups,
            'lastSupplierGroup' => $lastSupplierGroup,
            'filters' => $request->only(['search', 'status', 'sort_by', 'sort_order', 'per_page'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:255',
            'proprietor_name' => 'nullable|string|max:255',
            'status' => 'boolean'
        ]);

        // Create account first
        $account = Account::create([
            'name' => $request->name,
            'ac_number' => AccountHelper::generateAccountNumber(),
            'group_id' => 11,
            'group_code' => '400010001',
            'due_amount' => 0,
            'paid_amount' => 0,
            'total_amount' => 0,
            'status' => $request->status ?? true,
        ]);

        // Create supplier with account_id
        Supplier::create([
            'account_id' => $account->id,
            'name' => $request->name,
            'mobile' => $request->mobile,
            'email' => $request->email,
            'address' => $request->address,
            'proprietor_name' => $request->proprietor_name,
            'status' => $request->status ?? true,
        ]);

        return redirect()->back()->with('success', 'Supplier created successfully.');
    }

    public function update(Request $request, Supplier $supplier)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:255',
            'proprietor_name' => 'nullable|string|max:255',
            'status' => 'boolean'
        ]);

        $supplier->account->update([
            'name' => $request->name,
            'status' => $request->status ?? true,
        ]);

        $supplier->update([
            'name' => $request->name,
            'mobile' => $request->mobile,
            'email' => $request->email,
            'address' => $request->address,
            'proprietor_name' => $request->proprietor_name,
            'status' => $request->status ?? true,
        ]);

        return redirect()->back()->with('success', 'Supplier updated successfully.');
    }

    public function show(Supplier $supplier)
    {
        $supplier->load('account');

        // Get recent purchases
        $recentPurchases = $supplier->purchases()
            ->latest('purchase_date')
            ->take(5)
            ->get(['id', 'purchase_date as date', 'net_total_amount as total_amount', 'paid_amount', 'due_amount', 'invoice_no', 'status']);

        // Get recent payments (from vouchers)
        $recentPayments = \App\Models\Voucher::where('to_account_id', $supplier->account_id)
            ->where('voucher_type', 'payment')
            ->with('toTransaction')
            ->latest('date')
            ->take(5)
            ->get()
            ->map(function($voucher) {
                return [
                    'id' => $voucher->id,
                    'date' => $voucher->date,
                    'amount' => $voucher->toTransaction->amount ?? 0,
                    'remarks' => $voucher->remarks,
                ];
            });

        // Calculate totals
        $totalPurchases = $supplier->purchases()->sum('net_total_amount');
        $purchaseCount = $supplier->purchases()->count();
        
        // Total paid = purchase paid_amount + voucher payments
        $purchasePaid = $supplier->purchases()->sum('paid_amount');
        $voucherPayments = \App\Models\Voucher::where('to_account_id', $supplier->account_id)
            ->where('voucher_type', 'payment')
            ->with('toTransaction')
            ->get()
            ->sum(function($voucher) {
                return $voucher->toTransaction->amount ?? 0;
            });
        $totalPaid = $purchasePaid + $voucherPayments;
        $paymentCount = \App\Models\Voucher::where('to_account_id', $supplier->account_id)
            ->where('voucher_type', 'payment')
            ->count();
        $currentDue = $totalPurchases - $totalPaid;

        return Inertia::render('Suppliers/SupplierDetails', [
            'supplier' => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'mobile' => $supplier->mobile,
                'email' => $supplier->email,
                'address' => $supplier->address,
                'proprietor_name' => $supplier->proprietor_name,
                'status' => $supplier->status,
                'created_at' => $supplier->created_at->format('Y-m-d'),
                'account' => $supplier->account ? [
                    'id' => $supplier->account->id,
                    'name' => $supplier->account->name,
                    'ac_number' => $supplier->account->ac_number,
                ] : null,
            ],
            'recentPurchases' => $recentPurchases,
            'recentPayments' => $recentPayments,
            'totalPurchases' => $totalPurchases,
            'purchaseCount' => $purchaseCount,
            'totalPaid' => $totalPaid,
            'paymentCount' => $paymentCount,
            'currentDue' => $currentDue,
        ]);
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();
        return redirect()->back()->with('success', 'Supplier deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:suppliers,id'
        ]);

        Supplier::whereIn('id', $request->ids)->delete();

        return redirect()->back()->with('success', count($request->ids) . ' suppliers deleted successfully.');
    }

    public function statement(Request $request, Supplier $supplier)
    {
        $supplier->load('account:id,name,ac_number');

        // Get all purchases for this supplier
        $purchases = $supplier->purchases()
            ->orderBy('purchase_date', 'desc')
            ->get()
            ->map(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'date' => $purchase->purchase_date,
                    'type' => 'Purchase',
                    'description' => 'Purchase - ' . ($purchase->invoice_no ?? 'N/A'),
                    'debit' => $purchase->net_total_amount,
                    'credit' => 0,
                    'invoice_no' => $purchase->invoice_no,
                ];
            });

        // Get all payments for this supplier
        $payments = [];
        if ($supplier->account) {
            $payments = Voucher::where('voucher_type', 'payment')
                ->where('to_account_id', $supplier->account->id)
                ->with('toTransaction:id,amount')
                ->orderBy('date', 'desc')
                ->get()
                ->map(function ($voucher) {
                    return [
                        'id' => $voucher->id,
                        'date' => $voucher->date,
                        'type' => 'Payment',
                        'description' => 'Payment Made - ' . ($voucher->remarks ?? 'N/A'),
                        'debit' => 0,
                        'credit' => $voucher->toTransaction->amount ?? 0,
                        'voucher_no' => $voucher->voucher_no ?? 'N/A',
                    ];
                });
        }

        // Merge and sort transactions by date
        $transactions = collect($purchases)->merge($payments)->sortByDesc('date')->values();

        // Calculate running balance
        $balance = 0;
        $transactions = $transactions->map(function ($transaction) use (&$balance) {
            $balance += $transaction['debit'] - $transaction['credit'];
            $transaction['balance'] = $balance;
            return $transaction;
        });

        // Calculate current balance same as details page
        $totalPurchases = $supplier->purchases()->sum('net_total_amount');
        $purchasePaid = $supplier->purchases()->sum('paid_amount');
        $voucherPayments = Voucher::where('to_account_id', $supplier->account_id)
            ->where('voucher_type', 'payment')
            ->with('toTransaction')
            ->get()
            ->sum(function($voucher) {
                return $voucher->toTransaction->amount ?? 0;
            });
        $totalPaid = $purchasePaid + $voucherPayments;
        $currentBalance = $totalPurchases - $totalPaid;

        // Get all purchases with date filter
        $purchaseQuery = $supplier->purchases();
        
        if ($request->start_date) {
            $purchaseQuery->whereDate('purchase_date', '>=', $request->start_date);
        }
        if ($request->end_date) {
            $purchaseQuery->whereDate('purchase_date', '<=', $request->end_date);
        }
        
        $allPurchases = $purchaseQuery->orderBy('purchase_date', 'desc')
            ->get(['id', 'purchase_date as date', 'invoice_no', 'net_total_amount as total', 'paid_amount', 'due_amount'])
            ->map(function ($purchase) {
                return [
                    'date' => $purchase->date,
                    'invoice_no' => $purchase->invoice_no,
                    'total' => $purchase->total,
                    'paid' => $purchase->paid_amount,
                    'due' => $purchase->due_amount
                ];
            });

        // Get recent payments with pagination and date filter
        $recentPayments = collect([]);
        if ($supplier->account) {
            $query = Voucher::where('voucher_type', 'payment')
                ->where('to_account_id', $supplier->account->id)
                ->with('toTransaction:id,amount');
            
            if ($request->start_date) {
                $query->whereDate('date', '>=', $request->start_date);
            }
            if ($request->end_date) {
                $query->whereDate('date', '<=', $request->end_date);
            }
            
            $recentPayments = $query->orderBy('date', 'desc')
                ->paginate(10)
                ->withQueryString()
                ->through(function ($voucher) {
                    return [
                        'id' => $voucher->id,
                        'date' => $voucher->date,
                        'amount' => $voucher->toTransaction->amount ?? 0,
                        'remarks' => $voucher->remarks,
                    ];
                });
        }

        return Inertia::render('Suppliers/SupplierStatement', [
            'supplier' => [
                'id' => $supplier->id,
                'name' => $supplier->name,
                'mobile' => $supplier->mobile,
                'address' => $supplier->address,
                'account' => $supplier->account,
            ],
            'transactions' => $transactions,
            'currentBalance' => $currentBalance,
            'allPurchases' => $allPurchases,
            'recentPayments' => $recentPayments
        ]);
    }

    public function downloadPdf(Request $request)
    {
        $query = Supplier::query();

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('mobile', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status === 'active');
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $suppliers = $query->get();
        $companySetting = CompanySetting::first();

        $pdf = Pdf::loadView('pdf.suppliers', compact('suppliers', 'companySetting'));
        $filename = 'suppliers_' . date('Y-m-d_H-i-s') . '.pdf';
        return $pdf->download($filename);
    }
}
