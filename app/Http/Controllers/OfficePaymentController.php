<?php

namespace App\Http\Controllers;

use App\Models\OfficePayment;
use App\Models\Account;
use App\Models\Shift;
use App\Models\Group;
use App\Models\Transaction;
use App\Helpers\TransactionHelper;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class OfficePaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = OfficePayment::with(['shift', 'from_account', 'to_account', 'transaction']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('from_account', function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%');
                })
                    ->orWhereHas('to_account', function ($q) use ($request) {
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

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->shift_id) {
            $query->where('shift_id', $request->shift_id);
        }

        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $officePayments = $query->paginate($request->per_page ?? 10);

        $officePayments->getCollection()->transform(function ($payment) {
            $payment->payment_type = $payment->transaction?->payment_type ?? 'Cash';
            $payment->amount = $payment->transaction?->amount ?? 0;
            return $payment;
        });

        $accounts = Account::select('id', 'name', 'ac_number')->get();
        $groupedAccounts = Account::with('group')
            ->select('id', 'name', 'ac_number', 'group_code')
            ->get()
            ->groupBy(function ($account) {
                return $account->group ? $account->group->name : 'Other';
            });
        $shifts = Shift::select('id', 'name')->where('status', true)->get();

        $paymentTypes = Group::whereIn('code', ['100020002', '100020003', '100020004'])
            ->whereHas('accounts')
            ->select('code', 'name')
            ->get()
            ->map(function ($group) {
                return ['code' => $group->code, 'name' => $group->name, 'type' => $group->name === 'Cash in hand' ? 'Cash' : $group->name];
            });
        $filters = $request->only(['search', 'start_date', 'end_date', 'type', 'shift_id', 'sort_by', 'sort_order', 'per_page']);
        $types = [
            ['value' => 'cash', 'label' => 'Cash'],
            ['value' => 'bank', 'label' => 'Bank']
        ];

        return Inertia::render('OfficePayments/Index', [
            'officePayments' => $officePayments,
            'accounts' => $accounts,
            'groupedAccounts' => $groupedAccounts,
            'shifts' => $shifts,
            'paymentTypes' => $paymentTypes,
            'types' => $types,
            'filters' => $filters
        ]);
    }

    public function store(Request $request)
    {
        $validPaymentTypes = Group::whereIn('code', ['100020002', '100020003', '100020004'])
            ->whereHas('accounts')
            ->get()
            ->map(function ($group) {
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
            $fromAccount = Account::find($request->from_account_id);
            $toAccount = Account::find($request->to_account_id);
            $transactionId = TransactionHelper::generateTransactionId();

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

            Transaction::create([
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

            $fromAccount->decrement('total_amount', $request->amount);
            $toAccount->increment('total_amount', $request->amount);

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
            ->map(function ($group) {
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
            $originalFromAccount = $officePayment->from_account;
            $originalToAccount = $officePayment->to_account;
            $originalAmount = $officePayment->transaction->amount;

            $originalFromAccount->increment('total_amount', $originalAmount);
            $originalToAccount->decrement('total_amount', $originalAmount);

            $fromAccount = Account::find($request->from_account_id);
            $toAccount = Account::find($request->to_account_id);
            $newTransactionId = TransactionHelper::generateTransactionId();

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

            $fromAccount->decrement('total_amount', $request->amount);
            $toAccount->increment('total_amount', $request->amount);

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
            $amount = $officePayment->transaction->amount;
            $officePayment->from_account->increment('total_amount', $amount);
            $officePayment->to_account->decrement('total_amount', $amount);

            $creditTransaction = Transaction::where('transaction_type', 'Cr')
                ->where('transaction_date', $officePayment->date)
                ->where('ac_number', $officePayment->to_account->ac_number)
                ->first();

            $officePayment->transaction?->delete();
            $creditTransaction?->delete();
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
