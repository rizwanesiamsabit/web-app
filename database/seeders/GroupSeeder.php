<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Group;

class GroupSeeder extends Seeder
{
    public function run(): void
    {
        $groups = [
            [1, '1', 'Assets', 'ROOT', 1],
            [2, '2', 'Expenses', 'ROOT', 1],
            [3, '3', 'Income', 'ROOT', 1],
            [4, '4', 'Liabilities', 'ROOT', 1],
            [5, '10001', 'Fixed Asset', '1', 1],
            [6, '10002', 'Current Asset', '1', 1],
            [7, '100020001', 'Account Receivable', '10002', 1],
            [9, '100010001', 'Land', '10001', 1],
            [10, '40001', 'Current Liabilities', '4', 1],
            [11, '400010001', 'Account Payable', '40001', 1],
            [13, '100020002', 'Cash in hand', '10002', 1],
            [14, '100020003', 'Mobile Bank', '10002', 1],
            [15, '100020004', 'Bank Account', '10002', 1],
            [16, '40002', 'Employee Management', '4', 1]
        ];

        foreach ($groups as $group) {
            Group::create([
                'id' => $group[0],
                'code' => $group[1],
                'name' => $group[2],
                'parents' => $group[3],
                'status' => $group[4],
            ]);
        }
    }
}