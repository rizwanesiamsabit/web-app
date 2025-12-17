<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use App\Models\Account;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\CompanySetting;
use App\Helpers\TransactionHelper;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class ReceivedVoucherController extends Controller
{
    public function index(Request $request)
    {
        $query = Voucher::with(['shift', 'fromAccount', 'toAccount', 'fromTransaction', 'toTransaction'])
            ->where('voucher_type', 'Received');

        if ($request->search && is_string($request->search)) {
            $searchTerm = trim($request->search);
            if (strlen($searchTerm) > 0 && strlen($searchTerm) <= 100) {
                $query->where(function($q) use ($searchTerm) {
                    $q->orWhereHas('fromAccount', function($q) use ($searchTerm) {
                          $q->where('name', 'like', '%' . $searchTerm . '%');
                      })
                      ->orWhereHas('toAccount', function($q) use ($searchTerm) {
                          $q->where('name', 'like', '%' . $searchTerm . '%');
                      });
                });
            }
        }

        if ($request->shift && $request->shift !== 'all' && is_string($request->shift)) {
            $query->whereHas('shift', function($q) use ($request) {
                $q->where('name', $request->shift);
            });
        }

        if ($request->payment_type && $request->payment_type !== 'all' && in_array($request->payment_type, ['Cash', 'Bank', 'Mobile Bank', 'cash', 'bank', 'mobile bank'])) {
            $query->whereHas('fromTransaction', function($q) use ($request) {
                $q->where('payment_type', strtolower($request->payment_type));
            });
        }

        if ($request->start_date && preg_match('/^\d{4}-\d{2}-\d{2}$/', $request->start_date)) {
            $query->where('date', '>=', $request->start_date);
        }

        if ($request->end_date && preg_match('/^\d{4}-\d{2}-\d{2}$/', $request->end_date)) {
            $query->where('date', '<=', $request->end_date);
        }

        $allowedSorts = ['created_at', 'date', 'id'];
        $sortBy = in_array($request->sort_by, $allowedSorts) ? $request->sort_by : 'created_at';
        $sortOrder = $request->sort_order === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $vouchers = $query->paginate($request->per_page ?? 10);

        $vouchers->getCollection()->transform(function ($voucher) {
            $paymentType = $voucher->fromTransaction->payment_type ?? 'cash';
            $voucher->payment_type = $paymentType === 'mobile bank' ? 'Mobile Bank' : ucfirst($paymentType);
            $voucher->amount = $voucher->toTransaction->amount ?? 0;
            
            if ($voucher->fromTransaction) {
                $voucher->bank_name = $voucher->fromTransaction->bank_name;
                $voucher->branch_name = $voucher->fromTransaction->branch_name;
                $voucher->account_no = $voucher->fromTransaction->account_number;
                $voucher->bank_type = $voucher->fromTransaction->cheque_type;
                $voucher->cheque_no = $voucher->fromTransaction->cheque_no;
                $voucher->cheque_date = $voucher->fromTransaction->cheque_date;
                $voucher->mobile_bank = $voucher->fromTransaction->mobile_bank_name;
                $voucher->mobile_number = $voucher->fromTransaction->mobile_number;
            }
            
            return $voucher;
        });

        $accounts = Account::select('id', 'name', 'ac_number')->get();
        $groupedAccounts = Account::with('group')
            ->select('id', 'name', 'ac_number', 'group_code')
            ->get()
            ->groupBy(function ($account) {
                return $account->group ? $account->group->name : 'Other';
            });

        return Inertia::render('Vouchers/ReceivedVoucher', [
            'vouchers' => $vouchers,
            'accounts' => $accounts,
            'groupedAccounts' => $groupedAccounts,
            'shifts' => Shift::select('id', 'name')->where('status', '=', true)->get(),
            'filters' => $request->only(['search', 'shift', 'payment_type', 'start_date', 'end_date', 'sort_by', 'sort_order', 'per_page'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'shift_id' => 'required|exists:shifts,id',
            'from_account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'required|exists:accounts,id',
            'amount' => 'required|numeric|min:0',
            'payment_type' => 'required|in:Cash,Bank,Mobile Bank',
            'bank_name' => 'required_if:payment_type,Bank',
            'mobile_bank' => 'required_if:payment_type,Mobile Bank',
            'remarks' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request) {
            $fromAccount = Account::findOrFail($request->from_account_id);
            $toAccount = Account::findOrFail($request->to_account_id);

            $creditTransaction = Transaction::create([
                'transaction_id' => TransactionHelper::generateTransactionId(),
                'ac_number' => $fromAccount->ac_number,
                'transaction_type' => 'Cr',
                'amount' => $request->amount,
                'description' => 'Payment received from ' . $toAccount->name,
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

            $debitTransaction = Transaction::create([
                'transaction_id' => TransactionHelper::generateTransactionId(),
                'ac_number' => $toAccount->ac_number,
                'transaction_type' => 'Dr',
                'amount' => $request->amount,
                'description' => 'Payment sent to ' . $fromAccount->name,
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

            Voucher::create([
                'voucher_type' => 'Received',
                'date' => $request->date,
                'shift_id' => $request->shift_id,
                'from_account_id' => $request->from_account_id,
                'to_account_id' => $request->to_account_id,
                'from_transaction_id' => $creditTransaction->id,
                'to_transaction_id' => $debitTransaction->id,
                'remarks' => $request->remarks,
            ]);

            $toAccount->decrement('total_amount', $request->amount);
            $fromAccount->increment('total_amount', $request->amount);
        });

        return redirect()->back()->with('success', 'Received voucher created successfully.');
    }

    public function update(Request $request, Voucher $voucher)
    {
        $request->validate([
            'date' => 'required|date',
            'shift_id' => 'required|exists:shifts,id',
            'from_account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'required|exists:accounts,id',
            'amount' => 'required|numeric|min:0',
            'payment_type' => 'required|in:Cash,Bank,Mobile Bank',
            'bank_name' => 'required_if:payment_type,Bank',
            'mobile_bank' => 'required_if:payment_type,Mobile Bank',
            'remarks' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $voucher) {
            $voucher->update([
                'date' => $request->date,
                'shift_id' => $request->shift_id,
                'from_account_id' => $request->from_account_id,
                'to_account_id' => $request->to_account_id,
                'remarks' => $request->remarks,
            ]);

            $fromAccount = Account::findOrFail($request->from_account_id);
            $toAccount = Account::findOrFail($request->to_account_id);

            $voucher->fromTransaction->update([
                'ac_number' => $fromAccount->ac_number,
                'amount' => $request->amount,
                'description' => 'Payment received from ' . $toAccount->name,
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
            ]);

            $voucher->toTransaction->update([
                'ac_number' => $toAccount->ac_number,
                'amount' => $request->amount,
                'description' => 'Payment sent to ' . $fromAccount->name,
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
            ]);

            $oldAmount = $voucher->toTransaction->amount;
            
            $oldFromAccount = $fromAccount->id === $voucher->from_account_id ? $fromAccount : Account::findOrFail($voucher->from_account_id);
            $oldToAccount = $toAccount->id === $voucher->to_account_id ? $toAccount : Account::findOrFail($voucher->to_account_id);
            
            $oldToAccount->increment('total_amount', $oldAmount);
            $oldFromAccount->decrement('total_amount', $oldAmount);
            
            $toAccount->decrement('total_amount', $request->amount);
            $fromAccount->increment('total_amount', $request->amount);
        });

        return redirect()->back()->with('success', 'Received voucher updated successfully.');
    }

    public function destroy(Voucher $voucher)
    {
        DB::transaction(function () use ($voucher) {
            $fromAccount = Account::findOrFail($voucher->from_account_id);
            $toAccount = Account::findOrFail($voucher->to_account_id);
            $amount = $voucher->toTransaction?->amount ?? 0;
            
            $toAccount->increment('total_amount', $amount);
            $fromAccount->decrement('total_amount', $amount);
            
            $fromTransactionId = $voucher->from_transaction_id;
            $toTransactionId = $voucher->to_transaction_id;
            
            $voucher->delete();
            
            if ($fromTransactionId) {
                Transaction::where('id', $fromTransactionId)->delete();
            }
            if ($toTransactionId) {
                Transaction::where('id', $toTransactionId)->delete();
            }
        });

        return redirect()->back()->with('success', 'Received voucher deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:vouchers,id'
        ]);

        DB::transaction(function () use ($request) {
            $vouchers = Voucher::whereIn('id', $request->ids)
                ->with(['fromTransaction', 'toTransaction', 'fromAccount', 'toAccount'])
                ->get();
            
            foreach ($vouchers as $voucher) {
                $amount = $voucher->toTransaction?->amount ?? 0;
                
                $voucher->toAccount->increment('total_amount', $amount);
                $voucher->fromAccount->decrement('total_amount', $amount);
                
                $fromTransactionId = $voucher->from_transaction_id;
                $toTransactionId = $voucher->to_transaction_id;
                
                $voucher->delete();
                
                if ($fromTransactionId) {
                    Transaction::where('id', $fromTransactionId)->delete();
                }
                if ($toTransactionId) {
                    Transaction::where('id', $toTransactionId)->delete();
                }
            }
        });

        return redirect()->back()->with('success', 'Received vouchers deleted successfully.');
    }

    public function downloadPdf(Request $request)
    {
        $query = Voucher::with(['shift', 'fromAccount', 'toAccount', 'fromTransaction', 'toTransaction'])
            ->where('voucher_type', 'Received');

        if ($request->search && is_string($request->search)) {
            $searchTerm = trim($request->search);
            if (strlen($searchTerm) > 0 && strlen($searchTerm) <= 100) {
                $query->where(function($q) use ($searchTerm) {
                    $q->orWhereHas('fromAccount', function($q) use ($searchTerm) {
                          $q->where('name', 'like', '%' . $searchTerm . '%');
                      })
                      ->orWhereHas('toAccount', function($q) use ($searchTerm) {
                          $q->where('name', 'like', '%' . $searchTerm . '%');
                      });
                });
            }
        }

        if ($request->payment_type && $request->payment_type !== 'all' && in_array($request->payment_type, ['Cash', 'Bank', 'Mobile Bank', 'cash', 'bank', 'mobile bank'])) {
            $query->whereHas('fromTransaction', function($q) use ($request) {
                $q->where('payment_type', strtolower($request->payment_type));
            });
        }

        if ($request->start_date && preg_match('/^\d{4}-\d{2}-\d{2}$/', $request->start_date)) {
            $query->where('date', '>=', $request->start_date);
        }

        if ($request->end_date && preg_match('/^\d{4}-\d{2}-\d{2}$/', $request->end_date)) {
            $query->where('date', '<=', $request->end_date);
        }

        $allowedSorts = ['created_at', 'date', 'id'];
        $sortBy = in_array($request->sort_by, $allowedSorts) ? $request->sort_by : 'created_at';
        $sortOrder = $request->sort_order === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $vouchers = $query->get();
        $companySetting = CompanySetting::first();

        $pdf = Pdf::loadView('pdf.received-vouchers', compact('vouchers', 'companySetting'));
        return $pdf->stream('received-vouchers.pdf');
    }
}