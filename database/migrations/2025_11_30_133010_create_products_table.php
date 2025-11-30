<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('category_id');
            $table->unsignedInteger('unit_id');
            $table->string('product_code')->nullable();
            $table->string('product_name');
            $table->string('product_slug')->nullable();
            $table->string('country_Of_origin')->nullable();
            $table->decimal('purchase_price', 18, 2)->nullable();
            $table->decimal('sales_price', 18, 2)->nullable();
            $table->longText('remarks')->nullable();
            $table->integer('status')->default(0);
            $table->timestamps();
            
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('cascade');
            $table->foreign('unit_id')->references('id')->on('units')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
