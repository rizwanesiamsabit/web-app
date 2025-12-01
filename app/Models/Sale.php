<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $fillable = [
        'sale_date',
        'sale_time',
        'shift_id',
        'memo_no',
        'invoice_no',
        'delivery_challan_no',
        'product_id',
        'purchase_price',
        'customer_id',
        'vehicle_id',
        'vehicle_number',
        'paid_amount',
        'due_amount',
        'payment_type',
        'payment_account_id',
        'cheque_type',
        'cheque_no',
        'cheque_date',
        'mobile_bank_name',
        'mobile_number',
        'transaction_id',
        'is_cash_sale',
        'remarks',
        'items',
        'status',
        'done_by'
    ];

    protected $casts = [
        'sale_date' => 'date',
        'sale_time' => 'datetime:H:i:s',
        'purchase_price' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
        'cheque_date' => 'date',
        'items' => 'array',
        'is_cash_sale' => 'boolean',
        'status' => 'boolean'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}