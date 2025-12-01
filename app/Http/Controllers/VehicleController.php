<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        $query = Vehicle::select('id', 'customer_id', 'product_id', 'vehicle_type', 'vehicle_name', 'vehicle_number', 'reg_date', 'status', 'created_at')
            ->with('customer:id,name', 'product:id,product_name');

        // Apply filters
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('vehicle_name', 'like', '%' . $request->search . '%')
                  ->orWhere('vehicle_number', 'like', '%' . $request->search . '%')
                  ->orWhere('vehicle_type', 'like', '%' . $request->search . '%')
                  ->orWhereHas('customer', function($subQ) use ($request) {
                      $subQ->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        if ($request->customer && $request->customer !== 'all') {
            $query->where('customer_id', $request->customer);
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status === 'active');
        }

        // Apply sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginate
        $perPage = $request->get('per_page', 10);
        $vehicles = $query->paginate($perPage)->withQueryString()->through(function ($vehicle) {
            return [
                'id' => $vehicle->id,
                'customer_id' => $vehicle->customer_id,
                'product_id' => $vehicle->product_id,
                'vehicle_type' => $vehicle->vehicle_type,
                'vehicle_name' => $vehicle->vehicle_name,
                'vehicle_number' => $vehicle->vehicle_number,
                'reg_date' => $vehicle->reg_date?->format('Y-m-d'),
                'status' => $vehicle->status,
                'customer' => $vehicle->customer,
                'product' => $vehicle->product,
                'created_at' => $vehicle->created_at->format('Y-m-d'),
            ];
        });

        $customers = Customer::where('status', true)->get(['id', 'name']);
        $products = Product::where('status', 1)->get(['id', 'product_name as name']);

        return Inertia::render('Vehicles/Vehicles', [
            'vehicles' => $vehicles,
            'customers' => $customers,
            'products' => $products,
            'filters' => $request->only(['search', 'customer', 'status', 'sort_by', 'sort_order', 'per_page'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'product_id' => 'nullable|exists:products,id',
            'vehicle_type' => 'nullable|string|max:150',
            'vehicle_name' => 'nullable|string|max:150',
            'vehicle_number' => 'nullable|string|max:50',
            'reg_date' => 'nullable|date',
            'status' => 'boolean'
        ]);

        Vehicle::create([
            'customer_id' => $request->customer_id,
            'product_id' => $request->product_id,
            'vehicle_type' => $request->vehicle_type,
            'vehicle_name' => $request->vehicle_name,
            'vehicle_number' => $request->vehicle_number,
            'reg_date' => $request->reg_date,
            'status' => $request->status ?? true,
        ]);

        return redirect()->back()->with('success', 'Vehicle created successfully.');
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'product_id' => 'nullable|exists:products,id',
            'vehicle_type' => 'nullable|string|max:150',
            'vehicle_name' => 'nullable|string|max:150',
            'vehicle_number' => 'nullable|string|max:50',
            'reg_date' => 'nullable|date',
            'status' => 'boolean'
        ]);

        $vehicle->update([
            'customer_id' => $request->customer_id,
            'product_id' => $request->product_id,
            'vehicle_type' => $request->vehicle_type,
            'vehicle_name' => $request->vehicle_name,
            'vehicle_number' => $request->vehicle_number,
            'reg_date' => $request->reg_date,
            'status' => $request->status ?? true,
        ]);

        return redirect()->back()->with('success', 'Vehicle updated successfully.');
    }

    public function destroy(Vehicle $vehicle)
    {
        $vehicle->delete();
        return redirect()->back()->with('success', 'Vehicle deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:vehicles,id'
        ]);

        Vehicle::whereIn('id', $request->ids)->delete();

        return redirect()->back()->with('success', count($request->ids) . ' vehicles deleted successfully.');
    }

    public function downloadPdf(Request $request)
    {
        $query = Vehicle::select('id', 'customer_id', 'product_id', 'vehicle_type', 'vehicle_name', 'vehicle_number', 'reg_date', 'status', 'created_at')
            ->with('customer:id,name', 'product:id,product_name');

        // Apply same filters as index method
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('vehicle_name', 'like', '%' . $request->search . '%')
                  ->orWhere('vehicle_number', 'like', '%' . $request->search . '%')
                  ->orWhere('vehicle_type', 'like', '%' . $request->search . '%')
                  ->orWhereHas('customer', function($subQ) use ($request) {
                      $subQ->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        if ($request->customer && $request->customer !== 'all') {
            $query->where('customer_id', $request->customer);
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status === 'active');
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $vehicles = $query->get();
        $companySetting = \App\Models\CompanySetting::first();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.vehicles', compact('vehicles', 'companySetting'));
        $filename = 'vehicles_' . date('Y-m-d_H-i-s') . '.pdf';
        return $pdf->download($filename);
    }
}