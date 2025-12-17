<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Summary - {{ $supplier->name }}</title>
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
        .text-green { color: green; }
        .text-red { color: red; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ $companySetting->company_name ?? 'Company Name' }}</div>
        <div class="report-title">Purchase Summary</div>
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
                <th>Invoice No</th>
                <th class="text-right">Paid</th>
                <th class="text-right">Due</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($purchases as $index => $purchase)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ \Carbon\Carbon::parse($purchase['date'])->format('d/m/Y') }}</td>
                <td>{{ $purchase['invoice_no'] }}</td>
                <td class="text-right text-green">{{ number_format($purchase['paid'], 2) }}</td>
                <td class="text-right text-red">{{ number_format($purchase['due'], 2) }}</td>
                <td class="text-right">{{ number_format($purchase['total'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #666;">
        Total Purchases: {{ count($purchases) }}
    </div>
</body>
</html>
