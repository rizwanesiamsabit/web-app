<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfficePayment extends Model
{
    protected $fillable = [
        'date',
        'shift_id',
        'employee_id',
        'transaction_id',
        'from_account_id',
        'to_account_id',
        'remarks',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
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
}