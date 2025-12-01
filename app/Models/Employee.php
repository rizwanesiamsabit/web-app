<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'user_id',
        'account_id',
        'employee_code',
        'employee_name',
        'email',
        'dob',
        'gender',
        'blood_group',
        'marital_status',
        'religion',
        'nid',
        'mobile',
        'mobile_two',
        'emergency_contact_person',
        'emergency_contact_number',
        'father_name',
        'mother_name',
        'present_address',
        'permanent_address',
        'job_status',
        'joining_date',
        'status',
        'status_date',
        'photo',
        'signature',
        'highest_education',
        'reference_one_name',
        'reference_one_phone',
        'reference_one_address',
        'reference_two_name',
        'reference_two_phone',
        'reference_two_address'
    ];

    protected $casts = [
        'dob' => 'date',
        'joining_date' => 'date',
        'status_date' => 'date',
        'status' => 'boolean'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}
