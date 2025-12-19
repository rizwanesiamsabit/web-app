<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    protected $fillable = [
        'date',
        'voucher_no',
        'shift_id',
        'voucher_type_id',
        'voucher_category_id',
        'payment_sub_type_id',
        'payment_method',
        // 'reference_id', // REMOVED
        // 'reference_type', // REMOVED  
        // 'purchase_id', // REMOVED
        // 'sale_id', // REMOVED
        'from_account_id',
        'to_account_id',
        'transaction_id',
        'amount',
        'description',
        'remarks'
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2'
    ];

    // Relationships
    public function voucherType()
    {
        return $this->belongsTo(VoucherType::class);
    }

    public function voucherCategory()
    {
        return $this->belongsTo(VoucherCategory::class);
    }

    public function paymentSubType()
    {
        return $this->belongsTo(PaymentSubType::class);
    }

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

    // REMOVED - handled by payment_sub_type
    // public function purchase()
    // {
    //     return $this->belongsTo(Purchase::class);
    // }

    // public function sale()
    // {
    //     return $this->belongsTo(Sale::class);
    // }

    // public function reference()
    // {
    //     return $this->morphTo('reference', 'reference_type', 'reference_id');
    // }

    // Get transactions by transaction_id
    public function transactions()
    {
        return Transaction::where('transaction_id', $this->transaction_id)->get();
    }

    // Get single transaction relationship
    public function transaction()
    {
        return $this->belongsTo(Transaction::class, 'transaction_id', 'transaction_id');
    }
}