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
        'purchase_price',
        'vehicle_number',
        'paid_amount',
        'due_amount',
        'is_cash_sale',
        'remarks',
        'status',
        'transaction_id',
        'shift_id',
        'product_id',
        'customer_id',
        'vehicle_id'
    ];

    protected $casts = [
        'sale_date' => 'date',
        'sale_time' => 'datetime:H:i:s',
        'purchase_price' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
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

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class, 'transaction_id', 'transaction_id');
    }
}