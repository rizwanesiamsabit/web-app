<?php

namespace Database\Seeders;

use App\Models\PaymentSubType;
use App\Models\VoucherCategory;
use Illuminate\Database\Seeder;

class PaymentSubTypeSeeder extends Seeder
{
    public function run(): void
    {
        $employeeCategory = VoucherCategory::where('name', 'Employee')->first();
        $supplierCategory = VoucherCategory::where('name', 'Supplier')->first();
        $customerCategory = VoucherCategory::where('name', 'Customer')->first();
        $officeCategory = VoucherCategory::where('name', 'Office')->first();
        $generalCategory = VoucherCategory::where('name', 'General')->first();

        $paymentSubTypes = [
            // Employee Sub-types
            ['name' => 'Monthly Salary', 'voucher_category_id' => $employeeCategory->id, 'type' => 'payment'],
            ['name' => 'Salary Advance', 'voucher_category_id' => $employeeCategory->id, 'type' => 'payment'],
            ['name' => 'Personal Loan', 'voucher_category_id' => $employeeCategory->id, 'type' => 'payment'],
            ['name' => 'Bonus', 'voucher_category_id' => $employeeCategory->id, 'type' => 'payment'],
            ['name' => 'Overtime Payment', 'voucher_category_id' => $employeeCategory->id, 'type' => 'payment'],
            ['name' => 'Medical Allowance', 'voucher_category_id' => $employeeCategory->id, 'type' => 'payment'],
            ['name' => 'Travel Allowance', 'voucher_category_id' => $employeeCategory->id, 'type' => 'payment'],
            ['name' => 'Advance Return', 'voucher_category_id' => $employeeCategory->id, 'type' => 'receipt'],
            ['name' => 'Loan Recovery', 'voucher_category_id' => $employeeCategory->id, 'type' => 'receipt'],
            ['name' => 'Salary Deduction', 'voucher_category_id' => $employeeCategory->id, 'type' => 'receipt'],

            // Supplier Sub-types
            ['name' => 'Cash Purchase', 'voucher_category_id' => $supplierCategory->id, 'type' => 'payment'],
            ['name' => 'Credit Payment', 'voucher_category_id' => $supplierCategory->id, 'type' => 'payment'],
            ['name' => 'Advance Payment', 'voucher_category_id' => $supplierCategory->id, 'type' => 'payment'],
            ['name' => 'Security Deposit', 'voucher_category_id' => $supplierCategory->id, 'type' => 'payment'],
            ['name' => 'Transportation Cost', 'voucher_category_id' => $supplierCategory->id, 'type' => 'payment'],
            ['name' => 'Refund Received', 'voucher_category_id' => $supplierCategory->id, 'type' => 'receipt'],
            ['name' => 'Discount Received', 'voucher_category_id' => $supplierCategory->id, 'type' => 'receipt'],

            // Customer Sub-types
            ['name' => 'Cash Sale', 'voucher_category_id' => $customerCategory->id, 'type' => 'receipt'],
            ['name' => 'Credit Payment', 'voucher_category_id' => $customerCategory->id, 'type' => 'receipt'],
            ['name' => 'Advance Received', 'voucher_category_id' => $customerCategory->id, 'type' => 'receipt'],
            ['name' => 'Security Deposit', 'voucher_category_id' => $customerCategory->id, 'type' => 'receipt'],
            ['name' => 'Refund Given', 'voucher_category_id' => $customerCategory->id, 'type' => 'payment'],
            ['name' => 'Discount Given', 'voucher_category_id' => $customerCategory->id, 'type' => 'payment'],

            // Office Sub-types
            ['name' => 'Utility Bills', 'voucher_category_id' => $officeCategory->id, 'type' => 'payment'],
            ['name' => 'Rent Payment', 'voucher_category_id' => $officeCategory->id, 'type' => 'payment'],
            ['name' => 'Internet/Phone Bill', 'voucher_category_id' => $officeCategory->id, 'type' => 'payment'],
            ['name' => 'Office Supplies', 'voucher_category_id' => $officeCategory->id, 'type' => 'payment'],
            ['name' => 'Equipment Purchase', 'voucher_category_id' => $officeCategory->id, 'type' => 'payment'],
            ['name' => 'Maintenance Cost', 'voucher_category_id' => $officeCategory->id, 'type' => 'payment'],
            ['name' => 'Insurance Premium', 'voucher_category_id' => $officeCategory->id, 'type' => 'payment'],
            ['name' => 'Tax Payment', 'voucher_category_id' => $officeCategory->id, 'type' => 'payment'],
            ['name' => 'Bank Charges', 'voucher_category_id' => $officeCategory->id, 'type' => 'payment'],
            ['name' => 'Rent Income', 'voucher_category_id' => $officeCategory->id, 'type' => 'receipt'],
            ['name' => 'Interest Income', 'voucher_category_id' => $officeCategory->id, 'type' => 'receipt'],
            ['name' => 'Service Income', 'voucher_category_id' => $officeCategory->id, 'type' => 'receipt'],

            // General Sub-types
            ['name' => 'Account Transfer', 'voucher_category_id' => $generalCategory->id, 'type' => 'both'],
            ['name' => 'Opening Balance', 'voucher_category_id' => $generalCategory->id, 'type' => 'both'],
            ['name' => 'Adjustment', 'voucher_category_id' => $generalCategory->id, 'type' => 'both']
        ];

        foreach ($paymentSubTypes as $subType) {
            PaymentSubType::create($subType);
        }
    }
}
