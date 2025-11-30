<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emp_departments', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('emp_type_id')->nullable();
            $table->foreign('emp_type_id')->references('id')->on('emp_types')->onDelete('cascade');
            $table->string('name');
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emp_departments');
    }
};
