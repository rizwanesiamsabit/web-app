<!DOCTYPE html>
<html>
<head>
    <title>Company Settings Report</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #333; }
        .header p { margin: 5px 0; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .status-active { color: green; font-weight: bold; }
        .status-inactive { color: red; font-weight: bold; }
        .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Company Settings Report</h1>
        <p>Generated on: {{ date('F d, Y') }}</p>
        <p>Total Records: {{ count($companySettings) }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Company Name</th>
                <th>Proprietor</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Status</th>
                <th>Created</th>
            </tr>
        </thead>
        <tbody>
            @foreach($companySettings as $setting)
            <tr>
                <td>{{ $setting->company_name }}</td>
                <td>{{ $setting->proprietor_name ?? 'N/A' }}</td>
                <td>{{ $setting->company_email ?? 'N/A' }}</td>
                <td>{{ $setting->company_phone ?? $setting->company_mobile ?? 'N/A' }}</td>
                <td>{{ $setting->company_address ?? 'N/A' }}</td>
                <td class="{{ $setting->status ? 'status-active' : 'status-inactive' }}">
                    {{ $setting->status ? 'Active' : 'Inactive' }}
                </td>
                <td>{{ $setting->created_at->format('M d, Y') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>This report was generated automatically by the system.</p>
    </div>
</body>
</html>