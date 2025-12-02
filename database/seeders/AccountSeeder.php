<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Account;
use App\Models\Group;

class AccountSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            [
                'name' => 'Office Cash',
                'group_code' => '100020002',
                'group_id' => 13,
            ],
            [
                'name' => 'Cash',
                'group_code' => '100020002',
                'group_id' => 13,
            ],
            [
                'name' => 'bKash : 01755-683388',
                'group_code' => '100020003',
                'group_id' => 14,
            ],
            [
                'name' => 'Exaim Bank PLC',
                'group_code' => '100020004',
                'group_id' => 15,
            ],
            [
                'name' => 'Dutch Bangla Bank A/C: 123456',
                'group_code' => '100020004',
                'group_id' => 15,
            ],
        ];

        foreach ($accounts as $accountData) {
            // Generate dynamic account number
            $lastAccount = Account::orderBy('ac_number', 'desc')->first();
            if ($lastAccount) {
                $ac_number = str_pad((int)$lastAccount->ac_number + 1, 13, '0', STR_PAD_LEFT);
            } else {
                $ac_number = '1000000000001';
            }

            Account::create([
                'name' => $accountData['name'],
                'ac_number' => $ac_number,
                'group_id' => $accountData['group_id'],
                'group_code' => $accountData['group_code'],
                'due_amount' => 0,
                'paid_amount' => 0,
                'total_amount' => 0,
                'status' => true,
            ]);
        }
    }
}