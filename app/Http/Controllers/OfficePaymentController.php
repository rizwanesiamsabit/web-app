<?php

namespace App\Http\Controllers;

use App\Models\OfficePayment;
use App\Models\Employee;
use App\Models\Account;
use App\Models\Shift;
use App\Models\Group;
use App\Models\Transaction;
use App\Helpers\TransactionHelper;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OfficePaymentController extends Controller
{
    public function index(Request $request)
    {
        Log::info('OfficePayment Index - Start');
        
        $query = OfficePayment::with(['shift', 'from_account', 'to_account', 'transaction']);
        
        Log::info('Query created with relationships');

        // Apply filters
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->whereHas('from_account', function($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%');
                })
                ->orWhereHas('to_account', function($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%');
                });
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
        
        Log::info('Office payments paginated', ['count' => $officePayments->count()]);

        // Add payment_type and amount from transaction
        $officePayments->getCollection()->transform(function ($payment) {
            $payment->payment_type = $payment->transaction?->payment_type ?? 'Cash';
            $payment->amount = $payment->transaction?->amount ?? 0;
            return $payment;
        });
        
        Log::info('Payments transformed with transaction data');


        $accounts = Account::select('id', 'name', 'ac_number')->get() ?: collect([]);
        $groupedAccounts = Account::with('group')
            ->select('id', 'name', 'ac_number', 'group_code')
            ->get()
            ->groupBy(function($account) {
                return $account->group ? $account->group->name : 'Other';
            }) ?: collect([]);
        $shifts = Shift::select('id', 'name')->where('status', true)->get() ?: collect([]);
        
        // Get payment types from specific groups only
        $paymentTypes = Group::whereIn('code', ['100020002', '100020003', '100020004'])
            ->whereHas('accounts')
            ->select('code', 'name')
            ->get()
            ->map(function($group) {
                $type = $group->name === 'Cash in hand' ? 'Cash' : $group->name;
                return ['code' => $group->code, 'name' => $group->name, 'type' => $type];
            });
        $filters = $request->only(['search', 'start_date', 'end_date', 'sort_by', 'sort_order', 'per_page']) ?: [];
        
        Log::info('Data prepared for frontend', [
            'officePayments_count' => $officePayments->count(),
            'accounts_count' => $accounts->count(),
            'shifts_count' => $shifts->count(),
            'filters' => $filters,
            'officePayments_structure' => $officePayments->toArray()
        ]);
        
        return Inertia::render('OfficePayments/Index', [
            'officePayments' => $officePayments ?: ['data' => [], 'current_page' => 1, 'last_page' => 1, 'per_page' => 10, 'total' => 0, 'from' => 0, 'to' => 0],

            'accounts' => $accounts,
            'groupedAccounts' => $groupedAccounts,
            'shifts' => $shifts,
            'paymentTypes' => $paymentTypes,
            'filters' => $filters
        ]);
    }

    public function store(Request $request)
    {
        $validPaymentTypes = Group::whereIn('code', ['100020002', '100020003', '100020004'])
            ->whereHas('accounts')
            ->get()
            ->map(function($group) {
                return $group->name === 'Cash in hand' ? 'Cash' : $group->name;
            })
            ->toArray();
        
        $request->validate([
            'date' => 'required|date',
            'shift_id' => 'required|exists:shifts,id',
            'from_account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'required|exists:accounts,id',
            'amount' => 'required|numeric|min:0',
            'payment_type' => 'required|in:' . implode(',', $validPaymentTypes),
            'remarks' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request) {
            // Get account numbers
            $fromAccount = Account::find($request->from_account_id);
            $toAccount = Account::find($request->to_account_id);

            // Generate unique transaction ID
            $transactionId = TransactionHelper::generateTransactionId();
            
            // Create debit transaction (from account)
            $debitTransaction = Transaction::create([
                'transaction_id' => $transactionId,
                'ac_number' => $fromAccount->ac_number,
                'transaction_type' => 'Dr',
                'amount' => $request->amount,
                'description' => 'Office deposit from ' . $fromAccount->name,
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
                'transaction_id' => $transactionId,
                'ac_number' => $toAccount->ac_number,
                'transaction_type' => 'Cr',
                'amount' => $request->amount,
                'description' => 'Office deposit received from ' . $fromAccount->name,
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

            // Update account balances
            $fromAccount->decrement('total_amount', $request->amount);
            $toAccount->increment('total_amount', $request->amount);

            // Create office payment record
            OfficePayment::create([
                'date' => $request->date,
                'shift_id' => $request->shift_id,
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
        $validPaymentTypes = Group::whereIn('code', ['100020002', '100020003', '100020004'])
            ->whereHas('accounts')
            ->get()
            ->map(function($group) {
                return $group->name === 'Cash in hand' ? 'Cash' : $group->name;
            })
            ->toArray();
        
        $request->validate([
            'date' => 'required|date',
            'shift_id' => 'required|exists:shifts,id',
            'from_account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'required|exists:accounts,id',
            'amount' => 'required|numeric|min:0',
            'payment_type' => 'required|in:' . implode(',', $validPaymentTypes),
            'remarks' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $officePayment) {
            // Get original accounts and amount for balance reversal
            $originalFromAccount = $officePayment->from_account;
            $originalToAccount = $officePayment->to_account;
            $originalAmount = $officePayment->transaction->amount;
            
            // Reverse original account balances
            $originalFromAccount->increment('total_amount', $originalAmount); // Add back
            $originalToAccount->decrement('total_amount', $originalAmount);   // Subtract back
            
            // Get new account details
            $fromAccount = Account::find($request->from_account_id);
            $toAccount = Account::find($request->to_account_id);
            
            // Generate new unique transaction ID
            $newTransactionId = TransactionHelper::generateTransactionId();
            
            // Update existing debit transaction
            $officePayment->transaction->update([
                'transaction_id' => $newTransactionId,
                'ac_number' => $fromAccount->ac_number,
                'amount' => $request->amount,
                'description' => 'Office deposit from ' . $fromAccount->name,
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
            
            // Find and update existing credit transaction
            $originalCreditTransaction = Transaction::where('transaction_type', 'Cr')
                ->where('transaction_date', $officePayment->date)
                ->where('ac_number', $originalToAccount->ac_number)
                ->where('amount', $originalAmount)
                ->first();
                
            if ($originalCreditTransaction) {
                $originalCreditTransaction->update([
                    'transaction_id' => $newTransactionId,
                    'ac_number' => $toAccount->ac_number,
                    'amount' => $request->amount,
                    'description' => 'Office deposit received from ' . $fromAccount->name,
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
            }
            
            // Update new account balances
            $fromAccount->decrement('total_amount', $request->amount);
            $toAccount->increment('total_amount', $request->amount);
            
            // Update office payment
            $officePayment->update([
                'date' => $request->date,
                'shift_id' => $request->shift_id,
                'from_account_id' => $request->from_account_id,
                'to_account_id' => $request->to_account_id,
                'remarks' => $request->remarks,
            ]);
        });

        return redirect()->back()->with('success', 'Office payment updated successfully.');
    }

    public function destroy(OfficePayment $officePayment)
    {
        DB::transaction(function () use ($officePayment) {
            // Reverse account balances
            $amount = $officePayment->transaction->amount;
            $officePayment->from_account->increment('total_amount', $amount); // Add back
            $officePayment->to_account->decrement('total_amount', $amount);   // Subtract back
            
            // Find and delete corresponding credit transaction
            $creditTransaction = Transaction::where('transaction_type', 'Cr')
                ->where('transaction_date', $officePayment->date)
                ->where('ac_number', $officePayment->to_account->ac_number)
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
            $officePayments = OfficePayment::with(['to_account'])->whereIn('id', $request->ids)->get();
            
            foreach ($officePayments as $payment) {
                // Find and delete corresponding credit transaction
                $creditTransaction = Transaction::where('transaction_type', 'Cr')
                    ->where('transaction_date', $payment->date)
                    ->where('ac_number', $payment->to_account->ac_number)
                    ->first();

                $payment->transaction?->delete();
                $creditTransaction?->delete();
                $payment->delete();
            }
        });

        return redirect()->back()->with('success', 'Office payments deleted successfully.');
    }
}