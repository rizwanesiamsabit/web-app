<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    protected $fillable = [
        'voucher_type',
        'date',
        'shift_id',
        'from_account_id',
        'to_account_id',
        'from_transaction_id',
        'to_transaction_id',
        'party_name',
        'remarks',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function fromAccount()
    {
        return $this->belongsTo(Account::class, 'from_account_id');
    }

    public function toAccount()
    {
        return $this->belongsTo(Account::class, 'to_account_id');
    }

    public function fromTransaction()
    {
        return $this->belongsTo(Transaction::class, 'from_transaction_id');
    }

    public function toTransaction()
    {
        return $this->belongsTo(Transaction::class, 'to_transaction_id');
    }
}