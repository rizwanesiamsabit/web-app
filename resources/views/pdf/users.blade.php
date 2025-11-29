<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Users Report</title>
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
        .badge-green { background-color: #e8f5e8; color: #2e7d32; }
        .badge-red { background-color: #ffebee; color: #c62828; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ $companySetting->company_name ?? 'Company Name' }}</div>
        <div class="report-title">Users Report</div>
        <div>Generated on: {{ date('Y-m-d H:i:s') }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Status</th>
                <th>Created Date</th>
            </tr>
        </thead>
        <tbody>
            @foreach($users as $user)
            <tr>
                <td>{{ $user->name }}</td>
                <td>{{ $user->email }}</td>
                <td>
                    @if($user->roles->count() > 0)
                        @foreach($user->roles as $role)
                            <span class="badge badge-blue">{{ $role->name }}</span>
                        @endforeach
                    @else
                        <span class="badge badge-red">No Role</span>
                    @endif
                </td>
                <td class="text-center">
                    <span class="badge {{ $user->email_verified_at ? 'badge-green' : 'badge-red' }}">
                        {{ $user->email_verified_at ? 'Verified' : 'Unverified' }}
                    </span>
                </td>
                <td class="text-center">
                    <span class="badge {{ $user->banned ? 'badge-red' : 'badge-green' }}">
                        {{ $user->banned ? 'Banned' : 'Active' }}
                    </span>
                </td>
                <td>{{ $user->created_at->format('Y-m-d') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div style="margin-top: 20px; font-size: 10px; color: #666;">
        Total Users: {{ count($users) }}
    </div>
</body>
</html>