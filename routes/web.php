<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\EmpDesignationController;
use App\Http\Controllers\EmpTypeController;
use App\Http\Controllers\EmpDepartmentController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\VehicleController;

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
    
    // Employee Designation routes
    Route::get('emp-designations', [EmpDesignationController::class, 'index'])->name('emp-designations.index');
    Route::get('emp-designations/download-pdf', [EmpDesignationController::class, 'downloadPdf'])->name('emp-designations.download.pdf');
    Route::delete('emp-designations/bulk/delete', [EmpDesignationController::class, 'bulkDelete'])->name('emp-designations.bulk.delete');
    Route::post('emp-designations', [EmpDesignationController::class, 'store'])->name('emp-designations.store');
    Route::put('emp-designations/{empDesignation}', [EmpDesignationController::class, 'update'])->name('emp-designations.update');
    Route::delete('emp-designations/{empDesignation}', [EmpDesignationController::class, 'destroy'])->name('emp-designations.destroy');
    
    // Employee Type routes
    Route::get('emp-types', [EmpTypeController::class, 'index'])->name('emp-types.index');
    Route::get('emp-types/download-pdf', [EmpTypeController::class, 'downloadPdf'])->name('emp-types.download.pdf');
    Route::delete('emp-types/bulk/delete', [EmpTypeController::class, 'bulkDelete'])->name('emp-types.bulk.delete');
    Route::post('emp-types', [EmpTypeController::class, 'store'])->name('emp-types.store');
    Route::put('emp-types/{empType}', [EmpTypeController::class, 'update'])->name('emp-types.update');
    Route::delete('emp-types/{empType}', [EmpTypeController::class, 'destroy'])->name('emp-types.destroy');
    
    // Employee Department routes
    Route::get('emp-departments', [EmpDepartmentController::class, 'index'])->name('emp-departments.index');
    Route::get('emp-departments/download-pdf', [EmpDepartmentController::class, 'downloadPdf'])->name('emp-departments.download.pdf');
    Route::delete('emp-departments/bulk/delete', [EmpDepartmentController::class, 'bulkDelete'])->name('emp-departments.bulk.delete');
    Route::post('emp-departments', [EmpDepartmentController::class, 'store'])->name('emp-departments.store');
    Route::put('emp-departments/{empDepartment}', [EmpDepartmentController::class, 'update'])->name('emp-departments.update');
    Route::delete('emp-departments/{empDepartment}', [EmpDepartmentController::class, 'destroy'])->name('emp-departments.destroy');
    
    // Unit routes
    Route::get('units', [UnitController::class, 'index'])->name('units.index');
    Route::get('units/download-pdf', [UnitController::class, 'downloadPdf'])->name('units.download.pdf');
    Route::delete('units/bulk/delete', [UnitController::class, 'bulkDelete'])->name('units.bulk.delete');
    Route::post('units', [UnitController::class, 'store'])->name('units.store');
    Route::put('units/{unit}', [UnitController::class, 'update'])->name('units.update');
    Route::delete('units/{unit}', [UnitController::class, 'destroy'])->name('units.destroy');
    
    // Category routes
    Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::get('categories/download-pdf', [CategoryController::class, 'downloadPdf'])->name('categories.download.pdf');
    Route::delete('categories/bulk/delete', [CategoryController::class, 'bulkDelete'])->name('categories.bulk.delete');
    Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::put('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
    
    // Product routes
    Route::get('products', [ProductController::class, 'index'])->name('products.index');
    Route::get('products/download-pdf', [ProductController::class, 'downloadPdf'])->name('products.download.pdf');
    Route::delete('products/bulk/delete', [ProductController::class, 'bulkDelete'])->name('products.bulk.delete');
    Route::post('products', [ProductController::class, 'store'])->name('products.store');
    Route::put('products/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');
    
    // Group routes
    Route::get('groups', [GroupController::class, 'index'])->name('groups.index');
    Route::get('groups/get-parentchild/{code}', [GroupController::class, 'getParentChild'])->name('groups.get-parentchild');
    Route::get('groups/download-pdf', [GroupController::class, 'downloadPdf'])->name('groups.download.pdf');
    Route::delete('groups/bulk/delete', [GroupController::class, 'bulkDelete'])->name('groups.bulk.delete');
    Route::post('groups', [GroupController::class, 'store'])->name('groups.store');
    Route::put('groups/{group}', [GroupController::class, 'update'])->name('groups.update');
    Route::delete('groups/{group}', [GroupController::class, 'destroy'])->name('groups.destroy');
    
    // Account routes
    Route::get('accounts', [AccountController::class, 'index'])->name('accounts.index');
    Route::get('accounts/create', [AccountController::class, 'create'])->name('accounts.create');
    Route::post('accounts', [AccountController::class, 'store'])->name('accounts.store');
    Route::get('accounts/{account}', [AccountController::class, 'show'])->name('accounts.show');
    Route::get('accounts/{account}/edit', [AccountController::class, 'edit'])->name('accounts.edit');
    Route::put('accounts/{account}', [AccountController::class, 'update'])->name('accounts.update');
    Route::delete('accounts/{account}', [AccountController::class, 'destroy'])->name('accounts.destroy');
    
    // Customer routes
    Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::get('customers/download-pdf', [CustomerController::class, 'downloadPdf'])->name('customers.download.pdf');
    Route::delete('customers/bulk/delete', [CustomerController::class, 'bulkDelete'])->name('customers.bulk.delete');
    Route::post('customers', [CustomerController::class, 'store'])->name('customers.store');
    Route::put('customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
    Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
    
    // Vehicle routes
    Route::get('vehicles', [VehicleController::class, 'index'])->name('vehicles.index');
    Route::get('vehicles/download-pdf', [VehicleController::class, 'downloadPdf'])->name('vehicles.download.pdf');
    Route::delete('vehicles/bulk/delete', [VehicleController::class, 'bulkDelete'])->name('vehicles.bulk.delete');
    Route::post('vehicles', [VehicleController::class, 'store'])->name('vehicles.store');
    Route::put('vehicles/{vehicle}', [VehicleController::class, 'update'])->name('vehicles.update');
    Route::delete('vehicles/{vehicle}', [VehicleController::class, 'destroy'])->name('vehicles.destroy');
});

require __DIR__.'/settings.php';
