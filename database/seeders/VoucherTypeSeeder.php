<?php

namespace Database\Seeders;

use App\Models\VoucherType;
use Illuminate\Database\Seeder;

class VoucherTypeSeeder extends Seeder
{
    public function run(): void
    {
        $voucherTypes = [
            [
                'name' => 'Payment',
                'description' => 'Money going out from company'
            ],
            [
                'name' => 'Receipt', 
                'description' => 'Money coming into company'
            ]
        ];

        foreach ($voucherTypes as $type) {
            VoucherType::create($type);
        }
    }
}
