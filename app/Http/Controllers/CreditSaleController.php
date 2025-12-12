<?php

namespace App\Http\Controllers;

use App\Models\CreditSale;
use App\Models\Product;
use App\Models\Shift;
use App\Models\Stock;
use App\Models\Vehicle;
use App\Models\Customer;
use App\Models\Account;
use App\Models\Transaction;
use App\Models\IsShiftClose;
use App\Helpers\TransactionHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CreditSaleController extends Controller
{
    public function index(Request $request)
    {
        $query = CreditSale::with(['product', 'shift', 'customer', 'vehicle']);

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('invoice_no', 'like', '%' . $request->search . '%')
                  ->orWhereHas('customer', function($q) use ($request) {
                      $q->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        if ($request->customer && $request->customer !== 'all') {
            $query->where('customer_id', $request->customer);
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
            $query->where('sale_date', '>=', $request->start_date);
        }

        if ($request->end_date) {
            $query->where('sale_date', '<=', $request->end_date);
        }

        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $creditSales = $query->paginate($request->per_page ?? 10);

        $accounts = Account::with('group')
            ->select('id', 'name', 'ac_number', 'group_id', 'group_code')
            ->get();

        $groupedAccounts = $accounts->groupBy(function ($account) {
            return $account->group ? $account->group->name : 'Other';
        });

        $closedShifts = IsShiftClose::select('close_date', 'shift_id')->get();

        return Inertia::render('CreditSales/Index', [
            'creditSales' => $creditSales,
            'accounts' => $accounts,
            'groupedAccounts' => $groupedAccounts,
            'vehicles' => Vehicle::with(['customer:id,name', 'product:id,product_name'])->select('id', 'vehicle_number', 'customer_id', 'product_id')->get(),
            'customers' => Customer::where('status', true)->select('id', 'name')->get(),
            'products' => Product::select('id', 'product_name', 'sales_price')->get(),
            'shifts' => Shift::where('status', true)->select('id', 'name')->get(),
            'closedShifts' => $closedShifts,
            'filters' => $request->only(['search', 'customer', 'payment_status', 'start_date', 'end_date', 'sort_by', 'sort_order', 'per_page'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'sale_date' => 'required|date',
            'invoice_no' => 'required|string|max:255',
            'shift_id' => 'required|exists:shifts,id',
            'remarks' => 'nullable|string',
            'products' => 'required|array|min:1',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.customer_id' => 'required|exists:customers,id',
            'products.*.vehicle_id' => 'required|exists:vehicles,id',
            'products.*.quantity' => 'required|numeric|min:0',
            'products.*.amount' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->products as $productData) {
                if (!isset($productData['product_id']) || !$productData['product_id']) {
                    continue;
                }

                $product = Product::find($productData['product_id']);
                $amount = $productData['amount'];
                $discount = $productData['discount'] ?? 0;
                $totalAmount = $amount - $discount;
                $paidAmount = 0;
                $dueAmount = $totalAmount;

                CreditSale::create([
                    'sale_date' => $request->sale_date,
                    'sale_time' => now()->format('H:i:s'),
                    'invoice_no' => $request->invoice_no,
                    'shift_id' => $request->shift_id,
                    'transaction_id' => null,
                    'customer_id' => $productData['customer_id'],
                    'vehicle_id' => $productData['vehicle_id'],
                    'product_id' => $productData['product_id'],
                    'purchase_price' => $product->purchase_price ?? 0,
                    'quantity' => $productData['quantity'],
                    'amount' => $amount,
                    'discount' => $discount,
                    'total_amount' => $totalAmount,
                    'paid_amount' => $paidAmount,
                    'due_amount' => $dueAmount,
                    'remarks' => $request->remarks,
                ]);

                $stock = Stock::where('product_id', $productData['product_id'])->first();
                if ($stock) {
                    $stock->decrement('current_stock', $productData['quantity']);
                    $stock->decrement('available_stock', $productData['quantity']);
                }
            }
        });

        return redirect()->back()->with('success', 'Credit sale created successfully.');
    }

    public function edit(CreditSale $creditSale)
    {
        $creditSale->load(['product', 'shift', 'customer', 'vehicle', 'transaction']);
        return response()->json(['creditSale' => $creditSale]);
    }

    public function update(Request $request, CreditSale $creditSale)
    {
        $request->validate([
            'sale_date' => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'vehicle_id' => 'required|exists:vehicles,id',
            'product_id' => 'required|exists:products,id',
            'shift_id' => 'required|exists:shifts,id',
            'invoice_no' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $creditSale) {
            if ($creditSale->transaction) {
                $oldAccount = Account::where('ac_number', $creditSale->transaction->ac_number)->first();
                if ($oldAccount) {
                    $oldAccount->decrement('total_amount', $creditSale->paid_amount);
                }
            }

            $oldStock = Stock::where('product_id', $creditSale->product_id)->first();
            if ($oldStock) {
                $oldStock->increment('current_stock', $creditSale->quantity);
                $oldStock->increment('available_stock', $creditSale->quantity);
            }

            $product = Product::find($request->product_id);
            $totalAmount = ($product->sales_price * $request->quantity) - ($request->discount ?? 0);
            $paidAmount = $request->paid_amount;
            $dueAmount = $totalAmount - $paidAmount;

            $transaction = null;
            if ($paidAmount > 0 && $request->to_account_id) {
                $toAccount = Account::find($request->to_account_id);
                $transactionId = TransactionHelper::generateTransactionId();

                $transaction = Transaction::create([
                    'transaction_id' => $transactionId,
                    'ac_number' => $toAccount->ac_number,
                    'transaction_type' => 'Cr',
                    'amount' => $paidAmount,
                    'description' => 'Credit Sale ' . $product->product_name . ' - Invoice: ' . $request->invoice_no,
                    'payment_type' => strtolower($request->payment_type ?? 'cash'),
                    'bank_name' => $request->bank_name ?? null,
                    'branch_name' => $request->branch_name ?? null,
                    'account_number' => $request->account_no ?? null,
                    'cheque_type' => $request->bank_type ?? null,
                    'cheque_no' => $request->cheque_no ?? null,
                    'cheque_date' => $request->cheque_date ?? null,
                    'mobile_bank_name' => $request->mobile_bank ?? null,
                    'mobile_number' => $request->mobile_number ?? null,
                    'transaction_date' => $request->sale_date,
                    'transaction_time' => now()->format('H:i:s'),
                ]);

                $toAccount->increment('total_amount', $paidAmount);
            }

            $creditSale->update([
                'sale_date' => $request->sale_date,
                'customer_id' => $request->customer_id,
                'vehicle_id' => $request->vehicle_id,
                'product_id' => $request->product_id,
                'shift_id' => $request->shift_id,
                'transaction_id' => $transaction ? $transaction->id : null,
                'invoice_no' => $request->invoice_no,
                'quantity' => $request->quantity,
                'amount' => $product->sales_price * $request->quantity,
                'discount' => $request->discount ?? 0,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'remarks' => $request->remarks,
            ]);

            if ($creditSale->transaction) {
                $oldTransactionId = $creditSale->transaction->transaction_id;
                Transaction::where('transaction_id', $oldTransactionId)->delete();
            }

            $newStock = Stock::where('product_id', $request->product_id)->first();
            if ($newStock) {
                $newStock->decrement('current_stock', $request->quantity);
                $newStock->decrement('available_stock', $request->quantity);
            }
        });

        return redirect()->back()->with('success', 'Credit sale updated successfully.');
    }

    public function destroy(CreditSale $creditSale)
    {
        DB::transaction(function () use ($creditSale) {
            if ($creditSale->transaction) {
                $account = Account::where('ac_number', $creditSale->transaction->ac_number)->first();
                if ($account) {
                    $account->decrement('total_amount', $creditSale->paid_amount);
                }
                $transactionId = $creditSale->transaction->transaction_id;
            }

            $stock = Stock::where('product_id', $creditSale->product_id)->first();
            if ($stock) {
                $stock->increment('current_stock', $creditSale->quantity);
                $stock->increment('available_stock', $creditSale->quantity);
            }

            $creditSale->delete();

            if (isset($transactionId)) {
                Transaction::where('transaction_id', $transactionId)->delete();
            }
        });

        return redirect()->back()->with('success', 'Credit sale deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:credit_sales,id'
        ]);

        DB::transaction(function () use ($request) {
            $creditSales = CreditSale::with('transaction')->whereIn('id', $request->ids)->get();

            foreach ($creditSales as $creditSale) {
                if ($creditSale->transaction) {
                    $account = Account::where('ac_number', $creditSale->transaction->ac_number)->first();
                    if ($account) {
                        $account->decrement('total_amount', $creditSale->paid_amount);
                    }
                    $transactionId = $creditSale->transaction->transaction_id;
                }

                $stock = Stock::where('product_id', $creditSale->product_id)->first();
                if ($stock) {
                    $stock->increment('current_stock', $creditSale->quantity);
                    $stock->increment('available_stock', $creditSale->quantity);
                }

                $creditSale->delete();

                if (isset($transactionId)) {
                    Transaction::where('transaction_id', $transactionId)->delete();
                }
            }
        });

        return redirect()->back()->with('success', 'Credit sales deleted successfully.');
    }
}
