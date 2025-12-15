<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Account;
use App\Models\Group;
use App\Models\Vehicle;
use App\Models\Product;
use App\Helpers\AccountHelper;
use App\Models\CreditSale;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::select('id', 'account_id', 'code', 'name', 'mobile', 'email', 'nid_number', 'vat_reg_no', 'tin_no', 'trade_license', 'discount_rate', 'security_deposit', 'credit_limit', 'address', 'status', 'created_at')
            ->with('account:id,name,ac_number,group_id', 'account.group:id,code,name');

        // Apply filters
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('code', 'like', '%' . $request->search . '%')
                    ->orWhere('mobile', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status === 'active');
        }

        // Apply sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginate
        $perPage = $request->get('per_page', 10);
        $customers = $query->paginate($perPage)->withQueryString()->through(function ($customer) {
            return [
                'id' => $customer->id,
                'account_id' => $customer->account_id,
                'code' => $customer->code,
                'name' => $customer->name,
                'mobile' => $customer->mobile,
                'email' => $customer->email,
                'nid_number' => $customer->nid_number,
                'vat_reg_no' => $customer->vat_reg_no,
                'tin_no' => $customer->tin_no,
                'trade_license' => $customer->trade_license,
                'discount_rate' => $customer->discount_rate,
                'security_deposit' => $customer->security_deposit,
                'credit_limit' => $customer->credit_limit,
                'address' => $customer->address,
                'status' => $customer->status,
                'account' => $customer->account,
                'created_at' => $customer->created_at->format('Y-m-d'),
            ];
        });

        $groups = Group::where('status', true)->get(['id', 'code', 'name']);
        $products = Product::where('status', 1)->get(['id', 'product_name as name']);

        // Get last customer's group for auto selection
        $lastCustomerGroup = null;
        $lastCustomer = Customer::with('account.group')->latest()->first();
        if ($lastCustomer && $lastCustomer->account && $lastCustomer->account->group) {
            $lastCustomerGroup = [
                'id' => $lastCustomer->account->group->id,
                'code' => $lastCustomer->account->group->code
            ];
        }

        return Inertia::render('Customers/Customers', [
            'customers' => $customers,
            'groups' => $groups,
            'products' => $products,
            'lastCustomerGroup' => $lastCustomerGroup,
            'filters' => $request->only(['search', 'status', 'sort_by', 'sort_order', 'per_page'])
        ]);
    }

    public function store(Request $request)
    {

        $request->validate([
            'code' => 'nullable|string|max:150',
            'name' => 'required|string|max:150',
            'mobile' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:50',
            'nid_number' => 'nullable|string|max:100',
            'vat_reg_no' => 'nullable|string|max:100',
            'tin_no' => 'nullable|string|max:100',
            'trade_license' => 'nullable|string|max:100',
            'discount_rate' => 'nullable|numeric|min:0',
            'security_deposit' => 'nullable|numeric|min:0',
            'credit_limit' => 'nullable|numeric|min:0',
            'address' => 'nullable|string',
            'status' => 'boolean',
            // Vehicle validation
            'product_id' => 'nullable|exists:products,id',
            'vehicle_type' => 'nullable|string|max:150',
            'vehicle_name' => 'nullable|string|max:150',
            'vehicle_number' => 'nullable|string|max:50',
            'reg_date' => 'nullable|date'
        ]);

        // Create account first
        $account = Account::create([
            'name' => $request->name,
            'ac_number' => AccountHelper::generateAccountNumber(),
            'group_id' => 7,
            'group_code' => '100020001',
            'due_amount' => 0,
            'paid_amount' => 0,
            'status' => $request->status ?? true,
        ]);

        // Create customer with account_id
        $customer = Customer::create([
            'account_id' => $account->id,
            'code' => $request->code,
            'name' => $request->name,
            'mobile' => $request->mobile,
            'email' => $request->email,
            'nid_number' => $request->nid_number,
            'vat_reg_no' => $request->vat_reg_no,
            'tin_no' => $request->tin_no,
            'trade_license' => $request->trade_license,
            'discount_rate' => $request->discount_rate ?? 0,
            'security_deposit' => $request->security_deposit ?? 0,
            'credit_limit' => $request->credit_limit ?? 0,
            'address' => $request->address,
            'status' => $request->status ?? true,
        ]);

        // Create vehicle if vehicle data provided
        if ($request->product_id || $request->vehicle_type || $request->vehicle_name || $request->vehicle_number) {
            Vehicle::create([
                'customer_id' => $customer->id,
                'product_id' => $request->product_id,
                'vehicle_type' => $request->vehicle_type,
                'vehicle_name' => $request->vehicle_name,
                'vehicle_number' => $request->vehicle_number,
                'reg_date' => $request->reg_date,
                'status' => $request->status ?? true,
            ]);
        }

        return redirect()->back()->with('success', 'Customer created successfully.');
    }

    public function show(Customer $customer)
    {
        $customer->load([
            'account:id,name,ac_number',
            'vehicles:id,customer_id,product_id,vehicle_number,vehicle_name,vehicle_type,reg_date',
            'vehicles.product:id,product_name'
        ]);

        $recentPayments = [];
        if ($customer->account) {
            $recentPayments = Voucher::where('voucher_type', 'Received')
                ->where('to_account_id', $customer->account->id)
                ->with(['fromTransaction:id,amount', 'toTransaction:id,amount'])
                ->orderBy('date', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($voucher) {
                    return [
                        'id' => $voucher->id,
                        'date' => $voucher->date,
                        'amount' => $voucher->toTransaction->amount ?? 0,
                        'remarks' => $voucher->remarks,
                    ];
                });
        }

        // Get recent credit sales for this customer
        $recentSales = CreditSale::where('customer_id', $customer->id)
            ->with('vehicle:id,vehicle_number')
            ->orderBy('sale_date', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'date' => $sale->sale_date,
                    'amount' => $sale->total_amount,
                    'quantity' => $sale->quantity,
                    'vehicle_number' => $sale->vehicle->vehicle_number ?? 'N/A',
                    'invoice_no' => $sale->invoice_no,
                    'status' => $sale->status,
                ];
            });

        // Calculate total sales for this customer
        $totalSales = CreditSale::where('customer_id', $customer->id)
            ->sum('total_amount');
        
        $salesCount = CreditSale::where('customer_id', $customer->id)
            ->count();

        // Calculate total paid for this customer
        $totalPaid = 0;
        $paymentCount = 0;
        if ($customer->account) {
            $payments = Voucher::where('voucher_type', 'Received')
                ->where('to_account_id', $customer->account->id)
                ->with('toTransaction:id,amount')
                ->get();
            
            $totalPaid = $payments->sum(function ($voucher) {
                return $voucher->toTransaction->amount ?? 0;
            });
            
            $paymentCount = $payments->count();
        }
        
        // Calculate current due/advanced (Total Sales - Total Paid)
        $currentDue = $totalSales - $totalPaid;

        return Inertia::render('Customers/CustomerDetails', [
            'customer' => [
                'id' => $customer->id,
                'code' => $customer->code,
                'name' => $customer->name,
                'mobile' => $customer->mobile,
                'email' => $customer->email,
                'nid_number' => $customer->nid_number,
                'vat_reg_no' => $customer->vat_reg_no,
                'tin_no' => $customer->tin_no,
                'trade_license' => $customer->trade_license,
                'discount_rate' => $customer->discount_rate,
                'security_deposit' => $customer->security_deposit,
                'credit_limit' => $customer->credit_limit,
                'address' => $customer->address,
                'status' => $customer->status,
                'account' => $customer->account,
                'vehicles' => $customer->vehicles,
                'created_at' => $customer->created_at->format('Y-m-d H:i:s'),
            ],
            'recentPayments' => $recentPayments,
            'recentSales' => $recentSales,
            'totalSales' => $totalSales,
            'salesCount' => $salesCount,
            'totalPaid' => $totalPaid,
            'paymentCount' => $paymentCount,
            'currentDue' => $currentDue
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $request->validate([
            'code' => 'nullable|string|max:150',
            'name' => 'required|string|max:150',
            'mobile' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:50',
            'nid_number' => 'nullable|string|max:100',
            'vat_reg_no' => 'nullable|string|max:100',
            'tin_no' => 'nullable|string|max:100',
            'trade_license' => 'nullable|string|max:100',
            'discount_rate' => 'nullable|numeric|min:0',
            'security_deposit' => 'nullable|numeric|min:0',
            'credit_limit' => 'nullable|numeric|min:0',
            'address' => 'nullable|string',
            'status' => 'boolean'
        ]);

        // Update associated account if exists
        if ($customer->account) {
            $customer->account->update([
                'name' => $request->name,
                'status' => $request->status ?? true,
            ]);
        }

        $customer->update([
            'code' => $request->code,
            'name' => $request->name,
            'mobile' => $request->mobile,
            'email' => $request->email,
            'nid_number' => $request->nid_number,
            'vat_reg_no' => $request->vat_reg_no,
            'tin_no' => $request->tin_no,
            'trade_license' => $request->trade_license,
            'discount_rate' => $request->discount_rate ?? 0,
            'security_deposit' => $request->security_deposit ?? 0,
            'credit_limit' => $request->credit_limit ?? 0,
            'address' => $request->address,
            'status' => $request->status ?? true,
        ]);

        return redirect()->back()->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();
        return redirect()->back()->with('success', 'Customer deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:customers,id'
        ]);

        Customer::whereIn('id', $request->ids)->delete();

        return redirect()->back()->with('success', count($request->ids) . ' customers deleted successfully.');
    }

    public function downloadPdf(Request $request)
    {
        $query = Customer::select('id', 'code', 'name', 'mobile', 'email', 'status', 'created_at');

        // Apply same filters as index method
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('code', 'like', '%' . $request->search . '%')
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

        $customers = $query->get();
        $companySetting = \App\Models\CompanySetting::first();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.customers', compact('customers', 'companySetting'));
        $filename = 'customers_' . date('Y-m-d_H-i-s') . '.pdf';
        return $pdf->download($filename);
    }
}
