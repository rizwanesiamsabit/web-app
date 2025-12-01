<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;
use App\Models\Unit;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Create Category
        $category = Category::create([
            'name' => 'Oil',
            'status' => true
        ]);

        // Create Unit
        $unit = Unit::create([
            'name' => 'Litter',
            'value' => 'ltr',
            'status' => true
        ]);

        $products = [
            [
                'category_id' => $category->id,
                'unit_id' => $unit->id,
                'product_code' => 'PC01',
                'product_name' => 'Petrol',
                'purchase_price' => 70.00,
                'sales_price' => 75.00,
                'status' => 1
            ],
            [
                'category_id' => $category->id,
                'unit_id' => $unit->id,
                'product_code' => 'PC02',
                'product_name' => 'CNG',
                'purchase_price' => 60.00,
                'sales_price' => 65.00,
                'status' => 1
            ],
            [
                'category_id' => $category->id,
                'unit_id' => $unit->id,
                'product_code' => 'PC03',
                'product_name' => 'Octane',
                'purchase_price' => 118.02,
                'sales_price' => 122.00,
                'status' => 1
            ],
            [
                'category_id' => $category->id,
                'unit_id' => $unit->id,
                'product_code' => 'PC04',
                'product_name' => 'Diesel',
                'purchase_price' => 101.25,
                'sales_price' => 102.00,
                'status' => 1
            ]
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}