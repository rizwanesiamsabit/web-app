<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    protected $fillable = [
        'purchase_date',
        'supplier_id',
        'transaction_id',
        'supplier_invoice_no',
        'remarks',
        'from_account_id',
        'net_total_amount',
        'paid_amount',
        'due_amount'
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'net_total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2'
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function fromAccount()
    {
        return $this->belongsTo(Account::class, 'from_account_id');
    }
}