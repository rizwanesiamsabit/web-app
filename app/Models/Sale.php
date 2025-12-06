<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $fillable = [
        'sale_date',
        'sale_time',
        'memo_no',
        'invoice_no',
        'delivery_challan_no',
        'shift_id',
        'transaction_id',
        'customer',
        'vehicle_no',
        'product_id',
        'purchase_price',
        'quantity',
        'amount',
        'discount',
        'total_amount',
        'paid_amount',
        'due_amount',
        'is_cash_sale',
        'remarks',
        'status'
    ];

    protected $casts = [
        'sale_date' => 'date',
        'purchase_price' => 'decimal:2',
        'quantity' => 'decimal:2',
        'amount' => 'decimal:2',
        'discount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
        'is_cash_sale' => 'integer',
        'status' => 'boolean'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}