<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    // Permission routes
    Route::resource('permissions', \App\Http\Controllers\PermissionController::class);
    Route::delete('permissions/bulk/delete', [\App\Http\Controllers\PermissionController::class, 'bulkDelete'])->name('permissions.bulk.delete');
    Route::get('permissions/download-pdf', [\App\Http\Controllers\PermissionController::class, 'downloadPdf'])->name('permissions.download.pdf');
});

require __DIR__.'/settings.php';
