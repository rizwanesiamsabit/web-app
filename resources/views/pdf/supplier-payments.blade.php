<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Summary - {{ $supplier->name }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .company-name { font-size: 18px; font-weight: bold; }
        .report-title { font-size: 16px; margin: 10px 0; }
        .supplier-info { margin: 20px 0; }
        .supplier-info table { width: 100%; border: none; }
        .supplier-info td { padding: 5px; border: none; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ $companySetting->company_name ?? 'Company Name' }}</div>
        <div class="report-title">Payment Summary</div>
        <div>Generated on: {{ date('Y-m-d H:i:s') }}</div>
    </div>

    <div class="supplier-info">
        <table>
            <tr>
                <td><strong>Supplier Name:</strong> {{ $supplier->name }}</td>
                <td><strong>Mobile:</strong> {{ $supplier->mobile ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td><strong>Address:</strong> {{ $supplier->address ?? 'N/A' }}</td>
                <td><strong>Account Number:</strong> {{ $supplier->account->ac_number ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>

    <table>
        <thead>
            <tr>
                <th class="text-center">SL</th>
                <th>Date</th>
                <th class="text-right">Amount</th>
                <th>Remark</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payments as $index => $payment)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ \Carbon\Carbon::parse($payment['date'])->format('d/m/Y') }}</td>
                <td class="text-right">{{ number_format($payment['amount'], 2) }}</td>
                <td>{{ $payment['remarks'] ?? 'N/A' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #666;">
        Total Payments: {{ count($payments) }}
    </div>
</body>
</html>
