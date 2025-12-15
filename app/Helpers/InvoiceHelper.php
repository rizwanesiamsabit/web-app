<?php

namespace App\Helpers;

use App\Models\Transaction;

class InvoiceHelper
{
    public static function generateInvoiceId(): string
    {
        do {
            $invoiceId = self::generateRandomString(9);
            $exists = Transaction::where('invoice_id', $invoiceId)->exists();
        } while ($exists);

        return $invoiceId;
    }

    private static function generateRandomString(int $length): string
    {
        $characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $randomString = '';
        
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, strlen($characters) - 1)];
        }
        
        return $randomString;
    }
}