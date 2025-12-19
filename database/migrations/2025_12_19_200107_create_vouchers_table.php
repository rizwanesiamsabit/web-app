<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            
            // Basic Info
            $table->date('date');
            $table->string('voucher_no')->unique(); // Auto generated
            $table->foreignId('shift_id')->constrained('shifts');
            
            // Voucher Classification
            $table->foreignId('voucher_type_id')->constrained('voucher_types');
            $table->foreignId('voucher_category_id')->constrained('voucher_categories');
            $table->foreignId('payment_sub_type_id')->constrained('payment_sub_types');
            
            // Payment Method
            $table->enum('payment_method', ['Cash', 'Bank', 'Mobile Bank']);
            
            // Reference Links - REMOVED (handled by payment_sub_type)
            // $table->unsignedBigInteger('reference_id')->nullable();
            // $table->string('reference_type')->nullable();
            // $table->foreignId('purchase_id')->nullable()->constrained('purchases');
            // $table->foreignId('sale_id')->nullable()->constrained('sales');
            
            // Account & Transaction
            $table->foreignId('from_account_id')->constrained('accounts');
            $table->foreignId('to_account_id')->constrained('accounts');
            $table->string('transaction_id'); // Same ID for both Dr/Cr entries
            
            // Amount & Details
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->text('remarks')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
