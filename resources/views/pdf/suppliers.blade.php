<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Suppliers Report</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .company-name { font-size: 18px; font-weight: bold; }
        .report-title { font-size: 16px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .text-center { text-align: center; }
        .status-active { color: green; }
        .status-inactive { color: red; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ $companySetting->company_name ?? 'Company Name' }}</div>
        <div class="report-title">Suppliers Report</div>
        <div>Generated on: {{ date('Y-m-d H:i:s') }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>SL</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Address</th>
                <th>Proprietor</th>
                <th>Created</th>
            </tr>
        </thead>
        <tbody>
            @foreach($suppliers as $index => $supplier)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ $supplier->name }}</td>
                <td>{{ $supplier->mobile ?? 'N/A' }}</td>
                <td>{{ $supplier->email ?? 'N/A' }}</td>
                <td>{{ $supplier->address ?? 'N/A' }}</td>
                <td>{{ $supplier->proprietor_name ?? 'N/A' }}</td>
                <td>{{ $supplier->created_at->format('Y-m-d') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #666;">
        Total Suppliers: {{ count($suppliers) }}
    </div>
</body>
</html>