<?php

namespace App\Http\Controllers;

use App\Models\DispenserReading;
use App\Models\Shift;
use App\Models\Product;
use App\Models\Account;
use App\Models\Employee;
use App\Models\Vehicle;
use App\Models\Customer;
use App\Models\IsShiftClose;
use App\Models\DailyReading;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DispenserReadingController extends Controller
{
    public function index()
    {
        $dispenserReading = DispenserReading::with(['product', 'dispenser'])
            ->orderBy('dispenser_id')
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('dispenser_id')
            ->map(function ($items) {
                $latest = $items->first();
                $latest->start_reading = $latest->end_reading;
                $latest->end_reading = $latest->end_reading;
                $latest->meter_test = 0;
                return $latest;
            })
            ->values();

        $shifts = Shift::where('status', 1)->get();
        $products = Product::with(['unit', 'stock', 'activeRate'])->where('status', 1)->get()->map(function ($product) {
            $product->sales_price = $product->activeRate ? $product->activeRate->sales_price : 0;
            return $product;
        });
        $customers = \App\Models\Customer::where('status', true)->select('id', 'name')->get();
        $vehicles = Vehicle::with('customer:id,name')->select('id', 'vehicle_number', 'customer_id', 'product_id')->get();
        $accounts = Account::with('group')->select('id', 'name', 'ac_number', 'group_id', 'group_code')->get();
        $groupedAccounts = $accounts->groupBy(function ($account) {
            return $account->group ? $account->group->name : 'Other';
        });

        $uniqueCustomers = DB::table('sales')
            ->select('customer')
            ->distinct()
            ->whereNotNull('customer')
            ->pluck('customer')
            ->merge(
                DB::table('credit_sales')
                    ->join('accounts', 'credit_sales.customer_id', '=', 'accounts.id')
                    ->select('accounts.name as customer')
                    ->distinct()
                    ->pluck('customer')
            )
            ->unique()
            ->values();

        $uniqueVehicles = DB::table('sales')
            ->select('vehicle_no')
            ->distinct()
            ->whereNotNull('vehicle_no')
            ->pluck('vehicle_no')
            ->merge(
                DB::table('credit_sales')
                    ->join('vehicles', 'credit_sales.vehicle_id', '=', 'vehicles.id')
                    ->select('vehicles.vehicle_number as vehicle_no')
                    ->distinct()
                    ->pluck('vehicle_no')
            )
            ->unique()
            ->values();

        $closedShifts = IsShiftClose::select('close_date', 'shift_id')->get();
        $employees = Employee::select('id', 'employee_name')->get();

        return Inertia::render('Dispensers/DispensersReading', [
            'dispenserReading' => $dispenserReading,
            'shifts' => $shifts,
            'closedShifts' => $closedShifts,
            'products' => $products,
            'customers' => $customers,
            'vehicles' => $vehicles,
            'accounts' => $accounts,
            'groupedAccounts' => $groupedAccounts,
            'employees' => $employees,
            'uniqueCustomers' => $uniqueCustomers,
            'uniqueVehicles' => $uniqueVehicles,
        ]);
    }

    public function getShiftsByDate($date)
    {
        $shifts = Shift::where('status', 1)->get();
        return response()->json($shifts);
    }

    public function getShiftClosingData($date, $shiftId)
    {
        $creditSales = DB::table('credit_sales')
            ->where('sale_date', $date)
            ->where('shift_id', $shiftId)
            ->sum('total_amount');

        $bankSales = DB::table('sales')
            ->join('transactions', 'sales.transaction_id', '=', 'transactions.id')
            ->where('sale_date', $date)
            ->where('shift_id', $shiftId)
            ->whereIn('transactions.payment_type', ['bank', 'mobile bank'])
            ->sum('sales.total_amount');

        $cashReceive = DB::table('vouchers')
            ->where('date', $date)
            ->where('shift_id', $shiftId)
            ->where('voucher_type', 'Received')
            ->join('transactions', 'vouchers.to_transaction_id', '=', 'transactions.id')
            ->sum('transactions.amount');

        $cashPayment = DB::table('vouchers')
            ->where('date', $date)
            ->where('shift_id', $shiftId)
            ->where('voucher_type', 'Payment')
            ->join('transactions', 'vouchers.from_transaction_id', '=', 'transactions.id')
            ->sum('transactions.amount');

        $officePayment = DB::table('office_payments')
            ->where('date', $date)
            ->where('shift_id', $shiftId)
            ->join('transactions', 'office_payments.transaction_id', '=', 'transactions.id')
            ->sum('transactions.amount');

        $creditSalesDetails = DB::table('credit_sales')
            ->where('sale_date', $date)
            ->where('shift_id', $shiftId)
            ->select(
                'product_id',
                DB::raw('SUM(total_amount) as product_wise_credit_sales')
            )
            ->groupBy('product_id')
            ->get();

        return response()->json([
            'getTotalSummeryReport' => [[
                'total_credit_sales_amount' => $creditSales,
                'total_bank_sale_amount' => $bankSales,
                'total_cash_receive_amount' => $cashReceive,
                'total_cash_payment_amount' => $cashPayment,
                'total_office_payment_amount' => $officePayment,
            ]],
            'getCreditSalesDetailsReport' => $creditSalesDetails
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'transaction_date' => 'required|date',
            'shift_id' => 'required|exists:shifts,id',
            'dispenser_readings' => 'required|array',
        ]);

        DB::beginTransaction();
        try {
            foreach ($request->dispenser_readings as $reading) {
                DispenserReading::create([
                    'transaction_date' => $request->transaction_date,
                    'shift_id' => $request->shift_id,
                    'employee_id' => $reading['reading_by'] ?? Auth::id(),
                    'dispenser_id' => $reading['dispenser_id'],
                    'product_id' => $reading['product_id'],
                    'start_reading' => $reading['start_reading'],
                    'end_reading' => $reading['end_reading'],
                    'meter_test' => $reading['meter_test'],
                    'net_reading' => $reading['net_reading'],
                    'item_rate' => $reading['item_rate'],
                    'total_sale' => $reading['total_sale'],
                ]);
            }

            DailyReading::create([
                'shift_id' => $request->shift_id,
                'employee_id' => Auth::id(),
                'credit_sales' => $request->credit_sales ?? 0,
                'bank_sales' => $request->bank_sales ?? 0,
                'cash_sales' => $request->cash_sales ?? 0,
                'cash_receive' => $request->cash_receive ?? 0,
                'bank_receive' => 0,
                'total_cash' => $request->total_cash ?? 0,
                'cash_payment' => $request->cash_payment ?? 0,
                'bank_payment' => 0,
                'office_payment' => $request->office_payment ?? 0,
                'final_due_amount' => $request->final_due_amount ?? 0,
            ]);

            IsShiftClose::create([
                'close_date' => $request->transaction_date,
                'shift_id' => $request->shift_id,
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'Shift closed successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to close shift.');
        }
    }
}
