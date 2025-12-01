<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Vehicle;
use App\Models\Customer;
use App\Models\Product;

class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        $customers = Customer::all();
        $products = Product::all();

        $vehicles = [
            [
                'customer_id' => $customers->first()->id ?? 1,
                'product_id' => $products->where('product_name', 'Petrol')->first()->id ?? 1,
                'vehicle_type' => 'Car',
                'vehicle_name' => 'Toyota Corolla',
                'vehicle_number' => 'DHK-1234',
                'reg_date' => '2020-01-15',
                'status' => true
            ],
            [
                'customer_id' => $customers->skip(1)->first()->id ?? 2,
                'product_id' => $products->where('product_name', 'Diesel')->first()->id ?? 4,
                'vehicle_type' => 'Truck',
                'vehicle_name' => 'Tata 407',
                'vehicle_number' => 'DHK-5678',
                'reg_date' => '2019-05-20',
                'status' => true
            ],
            [
                'customer_id' => $customers->skip(2)->first()->id ?? 3,
                'product_id' => $products->where('product_name', 'CNG')->first()->id ?? 2,
                'vehicle_type' => 'Bus',
                'vehicle_name' => 'Ashok Leyland',
                'vehicle_number' => 'DHK-9012',
                'reg_date' => '2021-03-10',
                'status' => true
            ],
            [
                'customer_id' => $customers->skip(3)->first()->id ?? 4,
                'product_id' => $products->where('product_name', 'Octane')->first()->id ?? 3,
                'vehicle_type' => 'Motorcycle',
                'vehicle_name' => 'Honda CBR',
                'vehicle_number' => 'DHK-3456',
                'reg_date' => '2022-07-25',
                'status' => true
            ],
            [
                'customer_id' => $customers->skip(4)->first()->id ?? 5,
                'product_id' => $products->where('product_name', 'Diesel')->first()->id ?? 4,
                'vehicle_type' => 'Pickup',
                'vehicle_name' => 'Mahindra Bolero',
                'vehicle_number' => 'DHK-7890',
                'reg_date' => '2020-11-30',
                'status' => true
            ]
        ];

        foreach ($vehicles as $vehicle) {
            Vehicle::create($vehicle);
        }
    }
}