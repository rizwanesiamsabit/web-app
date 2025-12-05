import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteModal } from '@/components/ui/delete-modal';
import { FormModal } from '@/components/ui/form-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronUp,
    Edit,
    FileText,
    Filter,
    Plus,
    Trash2,
    Receipt,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface PaymentVoucher {
    id: number;
    voucher_type: string;
    date: string;
    from_account: { name: string };
    to_account: { name: string };
    amount: number;
    payment_type: string;
    remarks: string;
    created_at: string;
}

interface Account {
    id: number;
    name: string;
    ac_number: string;
}

interface Shift {
    id: number;
    name: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Payment Voucher',
        href: '/vouchers/payment',
    },
];

interface PaymentVoucherProps {
    vouchers: {
        data: PaymentVoucher[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    accounts: Account[];
    groupedAccounts: Record<string, Account[]>;
    shifts: Shift[];
    filters: {
        search?: string;

        payment_type?: string;
        start_date?: string;
        end_date?: string;
        sort_by?: string;
        sort_order?: string;
        per_page?: number;
    };
}

export default function PaymentVoucher({ vouchers, accounts = [], groupedAccounts = {}, shifts = [], filters }: PaymentVoucherProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<PaymentVoucher | null>(null);
    const [deletingVoucher, setDeletingVoucher] = useState<PaymentVoucher | null>(null);
    const [selectedVouchers, setSelectedVouchers] = useState<number[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');

    const [paymentType, setPaymentType] = useState(filters?.payment_type || 'all');
    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'created_at');
    const [sortOrder, setSortOrder] = useState(filters?.sort_order || 'desc');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        date: '',
        shift_id: '',
        from_account_id: '',
        to_account_id: '',
        amount: '',
        payment_type: 'Cash',
        bank_type: '',
        bank_name: '',
        cheque_no: '',
        mobile_bank: '',
        mobile_number: '',
        remarks: '',
    });

    const getFilteredAccounts = () => {
        const groupName = data.payment_type === 'Cash' ? 'Cash in hand' : 
                         data.payment_type === 'Bank' ? 'Bank Account' :
                         data.payment_type === 'Mobile Bank' ? 'Mobile Bank' : 'Other';
        return groupedAccounts[groupName] || [];
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingVoucher) {
            put(`/vouchers/payment/${editingVoucher.id}`, {
                onSuccess: () => {
                    setEditingVoucher(null);
                    reset();
                },
            });
        } else {
            post('/vouchers/payment', {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                },
            });
        }
    };

    const handleEdit = (voucher: PaymentVoucher) => {
        setEditingVoucher(voucher);
        setData({
            date: voucher.date || '',
            shift_id: '',
            from_account_id: voucher.from_account?.name || '',
            to_account_id: voucher.to_account?.name || '',
            amount: voucher.amount?.toString() || '',
            payment_type: voucher.payment_type || 'Cash',
            remarks: voucher.remarks || '',
        });
    };

    const handleDelete = (voucher: PaymentVoucher) => {
        setDeletingVoucher(voucher);
    };

    const confirmDelete = () => {
        if (deletingVoucher) {
            router.delete(`/vouchers/payment/${deletingVoucher.id}`, {
                onSuccess: () => setDeletingVoucher(null),
            });
        }
    };

    const handleBulkDelete = () => {
        setIsBulkDeleting(true);
    };

    const confirmBulkDelete = () => {
        router.delete('/vouchers/payment/bulk/delete', {
            data: { ids: selectedVouchers },
            onSuccess: () => {
                setSelectedVouchers([]);
                setIsBulkDeleting(false);
            },
        });
    };

    const applyFilters = () => {
        router.get(
            '/vouchers/payment',
            {
                search: search || undefined,
                payment_type: paymentType === 'all' ? undefined : paymentType,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                sort_by: sortBy,
                sort_order: sortOrder,
                per_page: perPage,
            },
            { preserveState: true },
        );
    };

    const clearFilters = () => {
        setSearch('');

        setPaymentType('all');
        setStartDate('');
        setEndDate('');
        router.get(
            '/vouchers/payment',
            {
                sort_by: sortBy,
                sort_order: sortOrder,
                per_page: perPage,
            },
            { preserveState: true },
        );
    };

    const handleSort = (column: string) => {
        const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(column);
        setSortOrder(newOrder);
        router.get(
            '/vouchers/payment',
            {
                search: search || undefined,
                payment_type: paymentType === 'all' ? undefined : paymentType,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                sort_by: column,
                sort_order: newOrder,
                per_page: perPage,
            },
            { preserveState: true },
        );
    };

    const handlePageChange = (page: number) => {
        router.get(
            '/vouchers/payment',
            {
                search: search || undefined,
                payment_type: paymentType === 'all' ? undefined : paymentType,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                sort_by: sortBy,
                sort_order: sortOrder,
                per_page: perPage,
                page,
            },
            { preserveState: true },
        );
    };

    const toggleSelectAll = () => {
        if (selectedVouchers.length === vouchers.data.length) {
            setSelectedVouchers([]);
        } else {
            setSelectedVouchers(vouchers.data.map((voucher) => voucher.id));
        }
    };

    const toggleSelectVoucher = (voucherId: number) => {
        if (selectedVouchers.includes(voucherId)) {
            setSelectedVouchers(selectedVouchers.filter((id) => id !== voucherId));
        } else {
            setSelectedVouchers([...selectedVouchers, voucherId]);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters?.search || '')) {
                applyFilters();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment Voucher" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">
                            Payment Voucher
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage payment vouchers and transactions
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {selectedVouchers.length > 0 && (
                            <Button
                                variant="destructive"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected ({selectedVouchers.length})
                            </Button>
                        )}
                        <Button
                            variant="success"
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (search) params.append('search', search);
                
                                if (paymentType !== 'all') params.append('payment_type', paymentType);
                                if (startDate) params.append('start_date', startDate);
                                if (endDate) params.append('end_date', endDate);
                                if (sortBy) params.append('sort_by', sortBy);
                                if (sortOrder) params.append('sort_order', sortOrder);
                                window.location.href = `/vouchers/payment/download-pdf?${params.toString()}`;
                            }}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Payment Voucher
                        </Button>
                    </div>
                </div>

                {/* Filter Card */}
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
                                <Label className="dark:text-gray-200">Search</Label>
                                <Input
                                    placeholder="Search vouchers..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <Label className="dark:text-gray-200">Payment Type</Label>
                                <Select
                                    value={paymentType}
                                    onValueChange={(value) => {
                                        setPaymentType(value);
                                        applyFilters();
                                    }}
                                >
                                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                        <SelectValue placeholder="Choose payment type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All types</SelectItem>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Bank">Bank</SelectItem>
                                        <SelectItem value="Mobile Bank">Mobile Bank</SelectItem>
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
                            <div className="flex items-end gap-2">
                                <Button onClick={applyFilters} className="flex-1">
                                    Apply Filters
                                </Button>
                                <Button onClick={clearFilters} variant="secondary" className="flex-1">
                                    <X className="mr-2 h-4 w-4" />
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:border-gray-700 dark:bg-gray-800">
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b dark:border-gray-700">
                                        <th className="p-4 text-left font-medium dark:text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={selectedVouchers.length === vouchers.data.length && vouchers.data.length > 0}
                                                onChange={toggleSelectAll}
                                                className="rounded border-gray-300 dark:border-gray-600"
                                            />
                                        </th>
                                        <th
                                            className="cursor-pointer p-4 text-left text-[13px] font-medium dark:text-gray-300"
                                            onClick={() => handleSort('date')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Date
                                                {sortBy === 'date' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                                            </div>
                                        </th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">From Account</th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">To Account</th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">Amount</th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">Payment Type</th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vouchers.data.length > 0 ? (
                                        vouchers.data.map((voucher) => (
                                            <tr key={voucher.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedVouchers.includes(voucher.id)}
                                                        onChange={() => toggleSelectVoucher(voucher.id)}
                                                        className="rounded border-gray-300 dark:border-gray-600"
                                                    />
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-white">{voucher.date}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{voucher.from_account?.name || 'N/A'}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{voucher.to_account?.name || 'N/A'}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">৳{voucher.amount?.toLocaleString() || '0'}</td>
                                                <td className="p-4">
                                                    <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                        {voucher.payment_type}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(voucher)}
                                                            className="text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(voucher)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                <Receipt className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                                No payment vouchers found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={vouchers.current_page}
                            lastPage={vouchers.last_page}
                            from={vouchers.from}
                            to={vouchers.to}
                            total={vouchers.total}
                            perPage={perPage}
                            onPageChange={handlePageChange}
                            onPerPageChange={(newPerPage) => {
                                setPerPage(newPerPage);
                                applyFilters();
                            }}
                        />
                    </CardContent>
                </Card>

                <FormModal
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    title="Create Payment Voucher"
                    onSubmit={handleSubmit}
                    processing={processing}
                    submitText="Create"
                    className="max-w-lg"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="date" className="dark:text-gray-200">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            {errors.date && <span className="text-sm text-red-500">{errors.date}</span>}
                        </div>
                        <div>
                            <Label htmlFor="shift_id" className="dark:text-gray-200">Shift</Label>
                            <Select value={data.shift_id} onValueChange={(value) => setData('shift_id', value)}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                    <SelectValue placeholder="Choose shift" />
                                </SelectTrigger>
                                <SelectContent>
                                    {shifts.map((shift) => (
                                        <SelectItem key={shift.id} value={shift.id.toString()}>
                                            {shift.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.shift_id && <span className="text-sm text-red-500">{errors.shift_id}</span>}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="payment_type" className="dark:text-gray-200">Payment Type</Label>
                        <Select value={data.payment_type} onValueChange={(value) => {
                            setData('payment_type', value);
                            setData('from_account_id', ''); // Reset account when payment type changes
                        }}>
                            <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                <SelectValue placeholder="Choose payment method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Bank">Bank</SelectItem>
                                <SelectItem value="Mobile Bank">Mobile Bank</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.payment_type && <span className="text-sm text-red-500">{errors.payment_type}</span>}
                    </div>

                    {data.payment_type === 'Bank' && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium dark:text-white">Bank Payment Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="bank_type" className="dark:text-gray-200">Bank Type</Label>
                                    <Select value={data.bank_type} onValueChange={(value) => setData('bank_type', value)}>
                                        <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                            <SelectValue placeholder="Choose bank type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cheque">Cheque</SelectItem>
                                            <SelectItem value="Cash Deposit">Cash Deposit</SelectItem>
                                            <SelectItem value="Online">Online</SelectItem>
                                            <SelectItem value="CHT">CHT</SelectItem>
                                            <SelectItem value="RTGS">RTGS</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="bank_name" className="dark:text-gray-200">Bank Name</Label>
                                    <Input
                                        id="bank_name"
                                        placeholder="Enter bank name"
                                        value={data.bank_name}
                                        onChange={(e) => setData('bank_name', e.target.value)}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            {data.bank_type === 'Cheque' && (
                                <div>
                                    <Label htmlFor="cheque_no" className="dark:text-gray-200">Cheque Number</Label>
                                    <Input
                                        id="cheque_no"
                                        placeholder="Enter cheque number"
                                        value={data.cheque_no}
                                        onChange={(e) => setData('cheque_no', e.target.value)}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {data.payment_type === 'Mobile Bank' && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium dark:text-white">Mobile Bank Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="mobile_bank" className="dark:text-gray-200">Mobile Bank</Label>
                                    <Select value={data.mobile_bank} onValueChange={(value) => setData('mobile_bank', value)}>
                                        <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                            <SelectValue placeholder="Choose mobile bank" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bKash">bKash</SelectItem>
                                            <SelectItem value="Nagad">Nagad</SelectItem>
                                            <SelectItem value="Rocket">Rocket</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="mobile_number" className="dark:text-gray-200">Mobile Number</Label>
                                    <Input
                                        id="mobile_number"
                                        placeholder="Enter mobile number"
                                        value={data.mobile_number}
                                        onChange={(e) => setData('mobile_number', e.target.value)}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="from_account_id" className="dark:text-gray-200">From Account</Label>
                            <Select value={data.from_account_id} onValueChange={(value) => setData('from_account_id', value)}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                    <SelectValue placeholder="Choose source account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getFilteredAccounts().map((account) => (
                                        <SelectItem key={account.id} value={account.id.toString()}>
                                            {account.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.from_account_id && <span className="text-sm text-red-500">{errors.from_account_id}</span>}
                        </div>
                        <div>
                            <Label htmlFor="to_account_id" className="dark:text-gray-200">To Account</Label>
                            <Select value={data.to_account_id} onValueChange={(value) => setData('to_account_id', value)}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                    <SelectValue placeholder="Choose destination account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id.toString()}>
                                            {account.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.to_account_id && <span className="text-sm text-red-500">{errors.to_account_id}</span>}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="amount" className="dark:text-gray-200">Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="Enter amount"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        {errors.amount && <span className="text-sm text-red-500">{errors.amount}</span>}
                    </div>

                    <div>
                        <Label htmlFor="remarks" className="dark:text-gray-200">Remarks</Label>
                        <Input
                            id="remarks"
                            placeholder="Enter remarks (optional)"
                            value={data.remarks}
                            onChange={(e) => setData('remarks', e.target.value)}
                            className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </FormModal>

                <DeleteModal
                    isOpen={!!deletingVoucher}
                    onClose={() => setDeletingVoucher(null)}
                    onConfirm={confirmDelete}
                    title="Delete Payment Voucher"
                    message={`Are you sure you want to delete this payment voucher? This action cannot be undone.`}
                />

                <DeleteModal
                    isOpen={isBulkDeleting}
                    onClose={() => setIsBulkDeleting(false)}
                    onConfirm={confirmBulkDelete}
                    title="Delete Selected Vouchers"
                    message={`Are you sure you want to delete ${selectedVouchers.length} selected vouchers? This action cannot be undone.`}
                />
            </div>
        </AppLayout>
    );
}