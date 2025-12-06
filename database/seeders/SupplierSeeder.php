<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;
use App\Models\Account;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            ['name' => 'ABC Traders', 'mobile' => '01711111111', 'email' => 'abc@example.com', 'address' => 'Dhaka'],
            ['name' => 'XYZ Suppliers', 'mobile' => '01722222222', 'email' => 'xyz@example.com', 'address' => 'Chittagong'],
            ['name' => 'Global Imports', 'mobile' => '01733333333', 'email' => 'global@example.com', 'address' => 'Sylhet'],
        ];

        foreach ($suppliers as $supplierData) {
            $lastAccount = Account::orderBy('ac_number', 'desc')->first();
            if ($lastAccount) {
                $ac_number = str_pad((int)$lastAccount->ac_number + 1, 13, '0', STR_PAD_LEFT);
            } else {
                $ac_number = '1000000000001';
            }

            $account = Account::create([
                'name' => $supplierData['name'],
                'ac_number' => $ac_number,
                'group_id' => 11,
                'group_code' => '400010001',
                'due_amount' => 0,
                'paid_amount' => 0,
                'total_amount' => 0,
                'status' => true,
            ]);

            Supplier::create([
                'account_id' => $account->id,
                'name' => $supplierData['name'],
                'mobile' => $supplierData['mobile'],
                'email' => $supplierData['email'],
                'address' => $supplierData['address'],
                'status' => true,
            ]);
        }
    }
}
