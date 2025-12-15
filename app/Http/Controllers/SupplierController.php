<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\Account;
use App\Models\Group;
use App\Helpers\AccountHelper;
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
            'group_id' => 'required|exists:groups,id',
            'group_code' => 'nullable|exists:groups,code',
            'mobile' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:255',
            'proprietor_name' => 'nullable|string|max:255',
            'status' => 'boolean'
        ]);

        // Get group_code from request or find it
        $groupCode = $request->group_code;
        if (!$groupCode && $request->group_id) {
            $group = Group::find($request->group_id);
            $groupCode = $group ? $group->code : null;
        }

        // Create account first
        $account = Account::create([
            'name' => $request->name,
            'ac_number' => AccountHelper::generateAccountNumber(),
            'group_id' => $request->group_id,
            'group_code' => $groupCode,
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
        $companySetting = \App\Models\CompanySetting::first();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.suppliers', compact('suppliers', 'companySetting'));
        $filename = 'suppliers_' . date('Y-m-d_H-i-s') . '.pdf';
        return $pdf->download($filename);
    }
}
