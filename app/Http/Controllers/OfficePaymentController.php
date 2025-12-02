<?php

namespace App\Http\Controllers;

use App\Models\OfficePayment;
use App\Models\Employee;
use App\Models\Account;
use App\Models\Shift;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class OfficePaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = OfficePayment::with(['shift', 'employee', 'fromAccount', 'toAccount', 'transaction']);

        // Apply filters
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->whereHas('employee', function($q) use ($request) {
                    $q->where('employee_name', 'like', '%' . $request->search . '%')
                      ->orWhere('employee_code', 'like', '%' . $request->search . '%');
                })
                ->orWhereHas('fromAccount', function($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%');
                })
                ->orWhereHas('toAccount', function($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%');
                });
            });
        }

        if ($request->employee && $request->employee !== 'all') {
            $query->whereHas('employee', function($q) use ($request) {
                $q->where('employee_name', $request->employee);
            });
        }

        if ($request->shift && $request->shift !== 'all') {
            $query->whereHas('shift', function($q) use ($request) {
                $q->where('name', $request->shift);
            });
        }

        if ($request->start_date) {
            $query->where('date', '>=', $request->start_date);
        }

        if ($request->end_date) {
            $query->where('date', '<=', $request->end_date);
        }

        // Apply sorting
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $officePayments = $query->paginate($request->per_page ?? 10);

        // Add payment_type and amount from transaction
        $officePayments->getCollection()->transform(function ($payment) {
            $payment->payment_type = $payment->transaction->payment_type ?? 'N/A';
            $payment->amount = $payment->transaction->amount ?? 0;
            return $payment;
        });

        return Inertia::render('OfficePayments/Index', [
            'officePayments' => $officePayments,
            'employees' => Employee::select('id', 'employee_name', 'employee_code')->where('status', true)->get(),
            'accounts' => Account::select('id', 'name', 'ac_number')->get(),
            'shifts' => Shift::select('id', 'name')->where('status', true)->get(),
            'filters' => $request->only(['search', 'employee', 'shift', 'start_date', 'end_date', 'sort_by', 'sort_order', 'per_page'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'shift_id' => 'required|exists:shifts,id',
            'employee_id' => 'required|exists:employees,id',
            'from_account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'required|exists:accounts,id',
            'amount' => 'required|numeric|min:0',
            'payment_type' => 'required|in:Cash,Bank,Mobile Bank',
            'remarks' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request) {
            // Get account numbers
            $fromAccount = Account::find($request->from_account_id);
            $toAccount = Account::find($request->to_account_id);
            $employee = Employee::find($request->employee_id);

            // Create debit transaction (from account - employee)
            $debitTransaction = Transaction::create([
                'ac_number' => $fromAccount->ac_number,
                'transaction_type' => 'Dr',
                'amount' => $request->amount,
                'description' => 'Office deposit by ' . $employee->employee_name,
                'payment_type' => strtolower($request->payment_type),
                'bank_name' => $request->bank_name,
                'branch_name' => $request->branch_name,
                'account_number' => $request->account_no,
                'cheque_type' => $request->bank_type,
                'cheque_no' => $request->cheque_no,
                'cheque_date' => $request->cheque_date,
                'mobile_bank_name' => $request->mobile_bank,
                'mobile_number' => $request->mobile_number,
                'transaction_date' => $request->date,
                'transaction_time' => now()->format('H:i:s'),
            ]);

            // Create credit transaction (to account - office)
            $creditTransaction = Transaction::create([
                'ac_number' => $toAccount->ac_number,
                'transaction_type' => 'Cr',
                'amount' => $request->amount,
                'description' => 'Office deposit received from ' . $employee->employee_name,
                'payment_type' => strtolower($request->payment_type),
                'bank_name' => $request->bank_name,
                'branch_name' => $request->branch_name,
                'account_number' => $request->account_no,
                'cheque_type' => $request->bank_type,
                'cheque_no' => $request->cheque_no,
                'cheque_date' => $request->cheque_date,
                'mobile_bank_name' => $request->mobile_bank,
                'mobile_number' => $request->mobile_number,
                'transaction_date' => $request->date,
                'transaction_time' => now()->format('H:i:s'),
            ]);

            // Create office payment record
            OfficePayment::create([
                'date' => $request->date,
                'shift_id' => $request->shift_id,
                'employee_id' => $request->employee_id,
                'transaction_id' => $debitTransaction->id,
                'from_account_id' => $request->from_account_id,
                'to_account_id' => $request->to_account_id,
                'remarks' => $request->remarks,
            ]);
        });

        return redirect()->back()->with('success', 'Office payment created successfully.');
    }

    public function update(Request $request, OfficePayment $officePayment)
    {
        $request->validate([
            'date' => 'required|date',
            'shift_id' => 'required|exists:shifts,id',
            'employee_id' => 'required|exists:employees,id',
            'from_account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'required|exists:accounts,id',
            'amount' => 'required|numeric|min:0',
            'payment_type' => 'required|in:Cash,Bank,Mobile Bank',
            'remarks' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $officePayment) {
            // Update office payment
            $officePayment->update([
                'date' => $request->date,
                'shift_id' => $request->shift_id,
                'employee_id' => $request->employee_id,
                'from_account_id' => $request->from_account_id,
                'to_account_id' => $request->to_account_id,
                'remarks' => $request->remarks,
            ]);

            // Update main transaction
            $fromAccount = Account::find($request->from_account_id);
            $toAccount = Account::find($request->to_account_id);
            $employee = Employee::find($request->employee_id);

            $officePayment->transaction->update([
                'ac_number' => $fromAccount->ac_number,
                'amount' => $request->amount,
                'description' => 'Office deposit by ' . $employee->employee_name,
                'payment_type' => strtolower($request->payment_type),
                'transaction_date' => $request->date,
            ]);

            // Find and update corresponding credit transaction
            $creditTransaction = Transaction::where('ac_number', $toAccount->ac_number)
                ->where('transaction_type', 'Cr')
                ->where('transaction_date', $officePayment->getOriginal('date'))
                ->where('description', 'like', '%' . $employee->employee_name . '%')
                ->first();

            if ($creditTransaction) {
                $creditTransaction->update([
                    'ac_number' => $toAccount->ac_number,
                    'amount' => $request->amount,
                    'description' => 'Office deposit received from ' . $employee->employee_name,
                    'payment_type' => strtolower($request->payment_type),
                    'transaction_date' => $request->date,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Office payment updated successfully.');
    }

    public function destroy(OfficePayment $officePayment)
    {
        DB::transaction(function () use ($officePayment) {
            // Find and delete corresponding credit transaction
            $employee = $officePayment->employee;
            $creditTransaction = Transaction::where('transaction_type', 'Cr')
                ->where('transaction_date', $officePayment->date)
                ->where('description', 'like', '%' . $employee->employee_name . '%')
                ->first();

            // Delete related transactions
            $officePayment->transaction?->delete();
            $creditTransaction?->delete();
            
            // Delete office payment
            $officePayment->delete();
        });

        return redirect()->back()->with('success', 'Office payment deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:office_payments,id'
        ]);

        DB::transaction(function () use ($request) {
            $officePayments = OfficePayment::with('employee')->whereIn('id', $request->ids)->get();
            
            foreach ($officePayments as $payment) {
                // Find and delete corresponding credit transaction
                $creditTransaction = Transaction::where('transaction_type', 'Cr')
                    ->where('transaction_date', $payment->date)
                    ->where('description', 'like', '%' . $payment->employee->employee_name . '%')
                    ->first();

                $payment->transaction?->delete();
                $creditTransaction?->delete();
                $payment->delete();
            }
        });

        return redirect()->back()->with('success', 'Office payments deleted successfully.');
    }
}