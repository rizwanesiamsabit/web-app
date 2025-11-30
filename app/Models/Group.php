<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    protected $fillable = [
        'code',
        'name',
        'parents',
        'status'
    ];

    protected $casts = [
        'status' => 'boolean'
    ];
}
