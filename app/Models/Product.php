<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'unit_id',
        'product_code',
        'product_name',
        'product_slug',
        'country_Of_origin',
        'purchase_price',
        'sales_price',
        'remarks',
        'status'
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'sales_price' => 'decimal:2',
        'status' => 'integer'
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class);
    }
}
