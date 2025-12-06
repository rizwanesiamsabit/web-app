import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FileText, Filter, X } from 'lucide-react';
import { useState } from 'react';

interface Transaction {
    date: string;
    shift: string;
    transaction_id: string;
    debit: number;
    credit: number;
    due: number;
}

interface Ledger {
    customer_name: string;
    ac_number: string;
    transactions: Transaction[];
    total_debit: number;
    total_credit: number;
    total_due: number;
}

interface Customer {
    id: number;
    name: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Customer Ledger Details', href: '/customer-ledger-details' },
];

interface CustomerLedgerDetailsProps {
    ledgers: Ledger[];
    customers: Customer[];
    filters: {
        customer_id?: string;
        start_date?: string;
        end_date?: string;
    };
}

export default function CustomerLedgerDetails({ ledgers = [], customers = [], filters = {} }: CustomerLedgerDetailsProps) {
    const [customerId, setCustomerId] = useState(filters.customer_id || '');
    const [startDate, setStartDate] = useState(filters.start_date || new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(filters.end_date || new Date().toISOString().split('T')[0]);

    const applyFilters = () => {
        if (!customerId) return;
        router.get('/customer-ledger-details', {
            customer_id: customerId,
            start_date: startDate,
            end_date: endDate,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        const today = new Date().toISOString().split('T')[0];
        setCustomerId('');
        setStartDate(today);
        setEndDate(today);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customer Ledger Details" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">Customer Ledger Details</h1>
                        <p className="text-gray-600 dark:text-gray-400">View customer wise ledger details</p>
                    </div>
                    <Button
                        variant="success"
                        onClick={() => {
                            if (!customerId) return;
                            const params = new URLSearchParams();
                            params.append('customer_id', customerId);
                            params.append('start_date', startDate);
                            params.append('end_date', endDate);
                            window.location.href = `/customer-ledger-details/download-pdf?${params.toString()}`;
                        }}
                    >
                        <FileText className="mr-2 h-4 w-4" />Download
                    </Button>
                </div>

                <Card className="dark:border-gray-700 dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 dark:text-white">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                            <div>
                                <Label className="dark:text-gray-200">Customer</Label>
                                <Select value={customerId} onValueChange={setCustomerId}>
                                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                        <SelectValue placeholder="Select customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map((customer) => (
                                            <SelectItem key={customer.id} value={customer.id.toString()}>
                                                {customer.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="dark:text-gray-200">Start Date</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <Label className="dark:text-gray-200">End Date</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="flex items-end gap-2 md:col-span-2">
                                <Button onClick={applyFilters} className="flex-1">Apply Filters</Button>
                                <Button onClick={clearFilters} variant="secondary" className="flex-1">
                                    <X className="mr-2 h-4 w-4" />Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {ledgers.length > 0 ? (
                        ledgers.map((ledger, ledgerIndex) => (
                            <Card key={ledgerIndex} className="dark:border-gray-700 dark:bg-gray-800">
                                <CardHeader className="bg-gray-50 dark:bg-gray-700">
                                    <div className="space-y-1">
                                        <p className="text-[14px] font-bold dark:text-white">Customer: {ledger.customer_name}</p>
                                        <p className="text-[13px] dark:text-gray-300">Account Number: {ledger.ac_number}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b dark:border-gray-700">
                                                    <th className="p-2 text-left text-[13px] font-medium dark:text-gray-300">Date</th>
                                                    <th className="p-2 text-left text-[13px] font-medium dark:text-gray-300">Shift</th>
                                                    <th className="p-2 text-left text-[13px] font-medium dark:text-gray-300">Invoice/Transaction ID</th>
                                                    <th className="p-2 text-right text-[13px] font-medium dark:text-gray-300">Debit</th>
                                                    <th className="p-2 text-right text-[13px] font-medium dark:text-gray-300">Credit</th>
                                                    <th className="p-2 text-right text-[13px] font-medium dark:text-gray-300">Due</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ledger.transactions.map((transaction, transactionIndex) => (
                                                    <tr key={transactionIndex} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                                        <td className="p-2 text-[13px] dark:text-white">{transaction.date}</td>
                                                        <td className="p-2 text-[13px] dark:text-gray-300">{transaction.shift}</td>
                                                        <td className="p-2 text-[13px] dark:text-gray-300">{transaction.transaction_id}</td>
                                                        <td className="p-2 text-right text-[13px] dark:text-gray-300">{Number(transaction.debit).toFixed(2)}</td>
                                                        <td className="p-2 text-right text-[13px] dark:text-gray-300">{Number(transaction.credit).toFixed(2)}</td>
                                                        <td className="p-2 text-right text-[13px] dark:text-gray-300">{Number(transaction.due).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="border-b font-bold bg-gray-50 dark:bg-gray-700 dark:border-gray-700">
                                                    <td colSpan={3} className="p-2 text-[13px] dark:text-white">Total:</td>
                                                    <td className="p-2 text-right text-[13px] dark:text-white">{Number(ledger.total_debit).toFixed(2)}</td>
                                                    <td className="p-2 text-right text-[13px] dark:text-white">{Number(ledger.total_credit).toFixed(2)}</td>
                                                    <td className="p-2 text-right text-[13px] dark:text-white">{Number(ledger.total_due).toFixed(2)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card className="dark:border-gray-700 dark:bg-gray-800">
                            <CardContent>
                                <p className="p-4 text-center text-[13px] text-gray-500 dark:text-gray-400">No records</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
