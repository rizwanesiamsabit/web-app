<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Permissions Report</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .company-name { font-size: 18px; font-weight: bold; }
        .report-title { font-size: 16px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .text-center { text-align: center; }
        .badge { padding: 2px 6px; border-radius: 3px; font-size: 10px; }
        .badge-blue { background-color: #e3f2fd; color: #1976d2; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ $companySetting->company_name ?? 'Company Name' }}</div>
        <div class="report-title">Permissions Report</div>
        <div>Generated on: {{ date('Y-m-d H:i:s') }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Module</th>
                <th>Description</th>
                <th>Roles Count</th>
                <th>Created Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach($permissions as $permission)
            <tr>
                <td>{{ $permission->name }}</td>
                <td>
                    <span class="badge badge-blue">
                        {{ ucfirst(explode(' ', $permission->name)[1] ?? 'General') }}
                    </span>
                </td>
                <td>Permission to {{ $permission->name }}</td>
                <td class="text-center">{{ $permission->roles_count }}</td>
                <td>{{ $permission->created_at->format('Y-m-d') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div style="margin-top: 20px; font-size: 10px; color: #666;">
        Total Permissions: {{ count($permissions) }}
    </div>
</body>
</html>