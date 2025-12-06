<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\CreditSale;
use App\Models\Customer;
use App\Models\Transaction;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class DailyStatementController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->start_date ?? date('Y-m-d');
        $endDate = $request->end_date ?? date('Y-m-d');

        // 1. Sales Summary (Product Wise) - All sales
        $productWiseSales = DB::table('sales')
            ->join('products', 'sales.product_id', '=', 'products.id')
            ->join('units', 'products.unit_id', '=', 'units.id')
            ->whereBetween('sales.sale_date', [$startDate, $endDate])
            ->select(
                'products.product_name',
                'units.name as unit_name',
                'products.sales_price as unit_price',
                DB::raw('SUM(sales.quantity) as total_quantity'),
                DB::raw('SUM(sales.total_amount) as total_amount')
            )
            ->groupBy('products.id', 'products.product_name', 'units.name', 'products.sales_price')
            ->get();

        $creditProductWiseSales = DB::table('credit_sales')
            ->join('products', 'credit_sales.product_id', '=', 'products.id')
            ->join('units', 'products.unit_id', '=', 'units.id')
            ->whereBetween('credit_sales.sale_date', [$startDate, $endDate])
            ->select(
                'products.product_name',
                'units.name as unit_name',
                'products.sales_price as unit_price',
                DB::raw('SUM(credit_sales.quantity) as total_quantity'),
                DB::raw('SUM(credit_sales.total_amount) as total_amount')
            )
            ->groupBy('products.id', 'products.product_name', 'units.name', 'products.sales_price')
            ->get();

        $allProductSales = $productWiseSales->concat($creditProductWiseSales)
            ->groupBy('product_name')
            ->map(function($items) {
                return [
                    'product_name' => $items->first()->product_name,
                    'unit_name' => $items->first()->unit_name,
                    'unit_price' => $items->first()->unit_price,
                    'total_quantity' => $items->sum('total_quantity'),
                    'total_amount' => $items->sum('total_amount'),
                ];
            })->values();

        // 2. Sales Summary Cash & Bank - Only cash sales
        $cashBankSales = DB::table('sales')
            ->join('products', 'sales.product_id', '=', 'products.id')
            ->join('units', 'products.unit_id', '=', 'units.id')
            ->whereBetween('sales.sale_date', [$startDate, $endDate])
            ->select(
                'products.product_name',
                'units.name as unit_name',
                DB::raw('SUM(sales.quantity) as total_quantity'),
                DB::raw('SUM(sales.total_amount) as total_amount')
            )
            ->groupBy('products.id', 'products.product_name', 'units.name')
            ->get();

        // 3. Sales Summary Credit - Only credit sales
        $creditSales = DB::table('credit_sales')
            ->join('products', 'credit_sales.product_id', '=', 'products.id')
            ->join('units', 'products.unit_id', '=', 'units.id')
            ->whereBetween('credit_sales.sale_date', [$startDate, $endDate])
            ->select(
                'products.product_name',
                'units.name as unit_name',
                DB::raw('SUM(credit_sales.quantity) as total_quantity'),
                DB::raw('SUM(credit_sales.due_amount) as total_amount')
            )
            ->groupBy('products.id', 'products.product_name', 'units.name')
            ->get();

        // 4. Customer Wise Sales Summary (Credit)
        $customerWiseSales = DB::table('credit_sales')
            ->join('customers', 'credit_sales.customer_id', '=', 'customers.id')
            ->whereBetween('credit_sales.sale_date', [$startDate, $endDate])
            ->select(
                'customers.name as customer_name',
                DB::raw('SUM(credit_sales.due_amount) as total_amount')
            )
            ->groupBy('customers.id', 'customers.name')
            ->get();

        // 5. Cash Received Summary
        $cashReceived = DB::table('transactions')
            ->join('accounts', 'transactions.ac_number', '=', 'accounts.ac_number')
            ->where('transactions.transaction_type', 'Cr')
            ->whereBetween('transactions.transaction_date', [$startDate, $endDate])
            ->select(
                'accounts.name as account_name',
                'transactions.amount',
                'transactions.description'
            )
            ->get();

        // 6. Cash Payment Summary
        $cashPayment = DB::table('transactions')
            ->join('accounts', 'transactions.ac_number', '=', 'accounts.ac_number')
            ->where('transactions.transaction_type', 'Dr')
            ->whereBetween('transactions.transaction_date', [$startDate, $endDate])
            ->select(
                'accounts.name as account_name',
                'transactions.amount',
                'transactions.description'
            )
            ->get();

        return Inertia::render('DailyStatement/Index', [
            'productWiseSales' => $allProductSales,
            'cashBankSales' => $cashBankSales,
            'creditSales' => $creditSales,
            'customerWiseSales' => $customerWiseSales,
            'cashReceived' => $cashReceived,
            'cashPayment' => $cashPayment,
            'customers' => Customer::select('id', 'name')->get(),
            'filters' => $request->only(['search', 'customer_id', 'start_date', 'end_date'])
        ]);
    }

    public function downloadPdf(Request $request)
    {
        $query = CreditSale::with(['customer', 'vehicle', 'product.unit', 'shift']);

        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->whereHas('customer', function($cq) use ($request) {
                    $cq->where('name', 'like', '%' . $request->search . '%');
                })->orWhereHas('vehicle', function($vq) use ($request) {
                    $vq->where('vehicle_no', 'like', '%' . $request->search . '%');
                })->orWhere('invoice_no', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->start_date) {
            $query->whereDate('sale_date', '>=', $request->start_date);
        }

        if ($request->end_date) {
            $query->whereDate('sale_date', '<=', $request->end_date);
        }

        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $statements = $query->get();
        $companySetting = \App\Models\CompanySetting::first();

        $pdf = Pdf::loadView('pdf.daily-statement', compact('statements', 'companySetting'));
        return $pdf->download('daily-statement-' . date('Y-m-d') . '.pdf');
    }
}
