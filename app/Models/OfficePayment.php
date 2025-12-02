<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfficePayment extends Model
{
    protected $fillable = [
        'date',
        'shift_id',
        'transaction_id',
        'from_account_id',
        'to_account_id',
        'type',
        'remarks',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function fromAccount()
    {
        return $this->belongsTo(Account::class, 'from_account_id');
    }

    public function toAccount()
    {
        return $this->belongsTo(Account::class, 'to_account_id');
    }

    public function from_account()
    {
        return $this->belongsTo(Account::class, 'from_account_id');
    }

    public function to_account()
    {
        return $this->belongsTo(Account::class, 'to_account_id');
    }
}