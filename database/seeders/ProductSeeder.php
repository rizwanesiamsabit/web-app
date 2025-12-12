<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductRate;
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
                'status' => 1,
                'purchase_price' => 70.00,
                'sales_price' => 75.00,
            ],
            [
                'category_id' => $category->id,
                'unit_id' => $unit->id,
                'product_code' => 'PC02',
                'product_name' => 'CNG',
                'status' => 1,
                'purchase_price' => 60.00,
                'sales_price' => 65.00,
            ],
            [
                'category_id' => $category->id,
                'unit_id' => $unit->id,
                'product_code' => 'PC03',
                'product_name' => 'Octane',
                'status' => 1,
                'purchase_price' => 118.02,
                'sales_price' => 122.00,
            ],
            [
                'category_id' => $category->id,
                'unit_id' => $unit->id,
                'product_code' => 'PC04',
                'product_name' => 'Diesel',
                'status' => 1,
                'purchase_price' => 101.25,
                'sales_price' => 102.00,
            ]
        ];

        foreach ($products as $productData) {
            $purchasePrice = $productData['purchase_price'];
            $salesPrice = $productData['sales_price'];
            unset($productData['purchase_price'], $productData['sales_price']);
            
            $product = Product::create($productData);
            
            ProductRate::create([
                'product_id' => $product->id,
                'purchase_price' => $purchasePrice,
                'sales_price' => $salesPrice,
                'effective_date' => now(),
                'status' => true
            ]);
        }
    }
}