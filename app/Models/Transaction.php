<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'ac_number',
        'transaction_type',
        'reference_type',
        'reference_id',
        'amount',
        'description',
        'transaction_date',
        'transaction_time'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'transaction_date' => 'date',
        'transaction_time' => 'datetime:H:i:s'
    ];

    public function account()
    {
        return $this->belongsTo(Account::class, 'ac_number', 'ac_number');
    }
}