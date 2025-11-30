<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            ['name' => 'litter', 'value' => '1', 'status' => true],
            ['name' => 'ml', 'value' => '1', 'status' => true],
        ];

        foreach ($units as $unit) {
            Unit::create($unit);
        }
    }
}
