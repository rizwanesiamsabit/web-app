<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->date('sale_date')->nullable();
            $table->time('sale_time')->nullable();
            $table->foreignId('shift_id')->nullable()->constrained()->onDelete('set null');
            $table->string('memo_no', 50)->nullable();
            $table->string('invoice_no')->nullable();
            $table->string('delivery_challan_no', 200)->nullable();
            $table->foreignId('product_id')->nullable()->constrained()->onDelete('set null');
            $table->decimal('purchase_price', 18, 2)->default(0.00);
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
            $table->unsignedBigInteger('vehicle_id')->nullable();
            $table->string('vehicle_number', 50)->nullable();
            $table->decimal('paid_amount', 20, 2)->default(0.00);
            $table->decimal('due_amount', 20, 2)->default(0.00);
            $table->string('payment_type', 50)->nullable();
            $table->unsignedBigInteger('payment_account_id')->nullable();
            $table->string('cheque_type')->nullable();
            $table->string('cheque_no')->nullable();
            $table->date('cheque_date')->nullable();
            $table->string('mobile_bank_name')->nullable();
            $table->string('mobile_number')->nullable();
            $table->string('transaction_id')->nullable();
            $table->integer('is_cash_sale')->default(0);
            $table->string('remarks')->nullable();
            $table->json('items')->nullable();
            $table->tinyInteger('status')->default(0);
            $table->string('done_by', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};