<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CreditSale extends Model
{
    protected $fillable = [
        'sale_date',
        'sale_time',
        'invoice_no',
        'shift_id',
        'transaction_id',
        'customer_id',
        'vehicle_id',
        'product_id',
        'purchase_price',
        'quantity',
        'amount',
        'discount',
        'total_amount',
        'paid_amount',
        'due_amount',
        'remarks',
        'status',
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

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
