<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->string('ac_number', 150);
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_price', 18, 2);
            $table->decimal('total_amount', 18, 2);
            $table->decimal('paid_amount', 18, 2)->default(0.00);
            $table->decimal('due_amount', 18, 2);
            $table->enum('payment_method', ['cash', 'bank', 'credit'])->default('cash');
            $table->date('purchase_date');
            $table->time('purchase_time');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->foreign('ac_number')->references('ac_number')->on('accounts')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};