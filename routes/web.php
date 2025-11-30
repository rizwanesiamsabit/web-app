<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\ShiftController;

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
    Route::get('permissions', [PermissionController::class, 'index'])->name('permissions.index');
    Route::post('permissions', [PermissionController::class, 'store'])->name('permissions.store');
    Route::put('permissions/{permission}', [PermissionController::class, 'update'])->name('permissions.update');
    Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])->name('permissions.destroy');
    Route::delete('permissions/bulk/delete', [PermissionController::class, 'bulkDelete'])->name('permissions.bulk.delete');
    Route::get('permissions/download-pdf', [PermissionController::class, 'downloadPdf'])->name('permissions.download.pdf');
    
    // Role routes
    Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
    Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit');
    Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
    Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
    Route::delete('roles/bulk/delete', [RoleController::class, 'bulkDelete'])->name('roles.bulk.delete');
    Route::get('roles/download-pdf', [RoleController::class, 'downloadPdf'])->name('roles.download.pdf');
    
    // User routes
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
    Route::post('users', [UserController::class, 'store'])->name('users.store');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    Route::delete('users/bulk/delete', [UserController::class, 'bulkDelete'])->name('users.bulk.delete');
    Route::get('users/download-pdf', [UserController::class, 'downloadPdf'])->name('users.download.pdf');
    
    // Company Setting Routes
    Route::get('company-settings', [CompanySettingController::class, 'index'])->name('company-settings.index');
    Route::get('company-settings/create', [CompanySettingController::class, 'create'])->name('company-settings.create');
    Route::get('company-settings/download-pdf', [CompanySettingController::class, 'downloadPdf'])->name('company-settings.download.pdf');
    Route::delete('company-settings/bulk/delete', [CompanySettingController::class, 'bulkDelete'])->name('company-settings.bulk.delete');
    Route::post('company-settings', [CompanySettingController::class, 'store'])->name('company-settings.store');
    Route::get('company-settings/{companySetting}', [CompanySettingController::class, 'show'])->name('company-settings.show');
    Route::get('company-settings/{companySetting}/edit', [CompanySettingController::class, 'edit'])->name('company-settings.edit');
    Route::put('company-settings/{companySetting}', [CompanySettingController::class, 'update'])->name('company-settings.update');
    Route::delete('company-settings/{companySetting}', [CompanySettingController::class, 'destroy'])->name('company-settings.destroy');
    
    // Shift routes
    Route::get('shifts', [ShiftController::class, 'index'])->name('shifts.index');
    Route::get('shifts/download-pdf', [ShiftController::class, 'downloadPdf'])->name('shifts.download.pdf');
    Route::delete('shifts/bulk/delete', [ShiftController::class, 'bulkDelete'])->name('shifts.bulk.delete');
    Route::post('shifts', [ShiftController::class, 'store'])->name('shifts.store');
    Route::put('shifts/{shift}', [ShiftController::class, 'update'])->name('shifts.update');
    Route::delete('shifts/{shift}', [ShiftController::class, 'destroy'])->name('shifts.destroy');
});

require __DIR__.'/settings.php';
