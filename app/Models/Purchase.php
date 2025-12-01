<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    protected $fillable = [
        'ac_number',
        'product_id',
        'quantity',
        'unit_price',
        'total_amount',
        'paid_amount',
        'due_amount',
        'payment_method',
        'purchase_date',
        'purchase_time',
        'notes'
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
        'purchase_date' => 'date',
        'purchase_time' => 'datetime:H:i:s'
    ];

    public function account()
    {
        return $this->belongsTo(Account::class, 'ac_number', 'ac_number');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}