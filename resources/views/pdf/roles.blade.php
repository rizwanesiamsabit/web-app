<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Roles Report</title>
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
        .badge-green { background-color: #e8f5e8; color: #2e7d32; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ $companySetting->company_name ?? 'Company Name' }}</div>
        <div class="report-title">Roles Report</div>
        <div>Generated on: {{ date('Y-m-d H:i:s') }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Role Name</th>
                <th>Guard Name</th>
                <th>Permissions Count</th>
                <th>Users Count</th>
                <th>Created Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach($roles as $role)
            <tr>
                <td>
                    <span class="badge badge-green">{{ $role->name }}</span>
                </td>
                <td>{{ $role->guard_name }}</td>
                <td class="text-center">{{ $role->permissions_count }}</td>
                <td class="text-center">{{ $role->users_count }}</td>
                <td>{{ $role->created_at->format('Y-m-d') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div style="margin-top: 20px; font-size: 10px; color: #666;">
        Total Roles: {{ count($roles) }}
    </div>
</body>
</html>