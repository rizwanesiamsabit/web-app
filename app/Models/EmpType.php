<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmpType extends Model
{
    protected $fillable = [
        'name',
        'status'
    ];

    protected $casts = [
        'status' => 'boolean'
    ];
}
