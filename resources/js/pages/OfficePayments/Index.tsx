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
    Building,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface OfficePayment {
    id: number;
    date: string;
    shift: { name: string };
    employee: { employee_name: string };
    from_account: { name: string };
    to_account: { name: string };
    amount: number;
    payment_type: string;
    remarks: string;
    created_at: string;
}

interface Employee {
    id: number;
    employee_name: string;
    employee_code: string;
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
        title: 'Office Payments',
        href: '/office-payments',
    },
];

interface OfficePaymentsProps {
    officePayments: {
        data: OfficePayment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    employees: Employee[];
    accounts: Account[];
    shifts: Shift[];
    filters: {
        search?: string;
        employee?: string;
        shift?: string;
        start_date?: string;
        end_date?: string;
        sort_by?: string;
        sort_order?: string;
        per_page?: number;
    };
}

export default function OfficePayments({ officePayments, employees = [], accounts = [], shifts = [], filters }: OfficePaymentsProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<OfficePayment | null>(null);
    const [deletingPayment, setDeletingPayment] = useState<OfficePayment | null>(null);
    const [selectedPayments, setSelectedPayments] = useState<number[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');
    const [employee, setEmployee] = useState(filters?.employee || 'all');
    const [shift, setShift] = useState(filters?.shift || 'all');
    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'created_at');
    const [sortOrder, setSortOrder] = useState(filters?.sort_order || 'desc');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        date: '',
        shift_id: '',
        employee_id: '',
        from_account_id: '',
        to_account_id: '',
        amount: '',
        payment_type: 'Cash',
        bank_type: '',
        cheque_no: '',
        cheque_date: '',
        bank_name: '',
        branch_name: '',
        account_no: '',
        mobile_bank: '',
        mobile_number: '',
        mobile_transaction_id: '',
        remarks: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPayment) {
            put(`/office-payments/${editingPayment.id}`, {
                onSuccess: () => {
                    setEditingPayment(null);
                    reset();
                },
            });
        } else {
            post('/office-payments', {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                },
            });
        }
    };

    const handleEdit = (payment: OfficePayment) => {
        setEditingPayment(payment);
        setData({
            date: payment.date,
            shift_id: payment.shift.name,
            employee_id: payment.employee.employee_name,
            from_account_id: payment.from_account.name,
            to_account_id: payment.to_account.name,
            amount: payment.amount.toString(),
            payment_type: payment.payment_type,
            bank_type: '',
            cheque_no: '',
            cheque_date: '',
            bank_name: '',
            branch_name: '',
            account_no: '',
            mobile_bank: '',
            mobile_number: '',
            mobile_transaction_id: '',
            remarks: payment.remarks || '',
        });
    };

    const handleDelete = (payment: OfficePayment) => {
        setDeletingPayment(payment);
    };

    const confirmDelete = () => {
        if (deletingPayment) {
            router.delete(`/office-payments/${deletingPayment.id}`, {
                onSuccess: () => setDeletingPayment(null),
            });
        }
    };

    const handleBulkDelete = () => {
        setIsBulkDeleting(true);
    };

    const confirmBulkDelete = () => {
        router.delete('/office-payments/bulk/delete', {
            data: { ids: selectedPayments },
            onSuccess: () => {
                setSelectedPayments([]);
                setIsBulkDeleting(false);
            },
        });
    };

    const applyFilters = () => {
        router.get(
            '/office-payments',
            {
                search: search || undefined,
                employee: employee === 'all' ? undefined : employee,
                shift: shift === 'all' ? undefined : shift,
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
        setEmployee('all');
        setShift('all');
        setStartDate('');
        setEndDate('');
        router.get(
            '/office-payments',
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
            '/office-payments',
            {
                search: search || undefined,
                employee: employee === 'all' ? undefined : employee,
                shift: shift === 'all' ? undefined : shift,
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
            '/office-payments',
            {
                search: search || undefined,
                employee: employee === 'all' ? undefined : employee,
                shift: shift === 'all' ? undefined : shift,
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
        if (selectedPayments.length === officePayments.data.length) {
            setSelectedPayments([]);
        } else {
            setSelectedPayments(officePayments.data.map((payment) => payment.id));
        }
    };

    const toggleSelectPayment = (paymentId: number) => {
        if (selectedPayments.includes(paymentId)) {
            setSelectedPayments(selectedPayments.filter((id) => id !== paymentId));
        } else {
            setSelectedPayments([...selectedPayments, paymentId]);
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
            <Head title="Office Payments" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">
                            Office Payments
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage shift end deposits and office payments
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {selectedPayments.length > 0 && (
                            <Button
                                variant="destructive"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected ({selectedPayments.length})
                            </Button>
                        )}
                        <Button
                            variant="success"
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (search) params.append('search', search);
                                if (employee !== 'all') params.append('employee', employee);
                                if (shift !== 'all') params.append('shift', shift);
                                if (startDate) params.append('start_date', startDate);
                                if (endDate) params.append('end_date', endDate);
                                if (sortBy) params.append('sort_by', sortBy);
                                if (sortOrder) params.append('sort_order', sortOrder);
                                window.location.href = `/office-payments/download-pdf?${params.toString()}`;
                            }}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Office Payment
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
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                            <div>
                                <Label className="dark:text-gray-200">Search</Label>
                                <Input
                                    placeholder="Search payments..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <Label className="dark:text-gray-200">Employee</Label>
                                <Select
                                    value={employee}
                                    onValueChange={(value) => {
                                        setEmployee(value);
                                        applyFilters();
                                    }}
                                >
                                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                        <SelectValue placeholder="All employees" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All employees</SelectItem>
                                        {employees.map((e) => (
                                            <SelectItem key={e.id} value={e.employee_name}>
                                                {e.employee_name} ({e.employee_code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="dark:text-gray-200">Shift</Label>
                                <Select
                                    value={shift}
                                    onValueChange={(value) => {
                                        setShift(value);
                                        applyFilters();
                                    }}
                                >
                                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                        <SelectValue placeholder="All shifts" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All shifts</SelectItem>
                                        {shifts.map((s) => (
                                            <SelectItem key={s.id} value={s.name}>
                                                {s.name}
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
                                                checked={selectedPayments.length === officePayments.data.length && officePayments.data.length > 0}
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
                                        <th className="p-4 text-left font-medium dark:text-gray-300">Employee</th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">Shift</th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">From Account</th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">To Account</th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">Amount</th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {officePayments.data.length > 0 ? (
                                        officePayments.data.map((payment) => (
                                            <tr key={payment.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPayments.includes(payment.id)}
                                                        onChange={() => toggleSelectPayment(payment.id)}
                                                        className="rounded border-gray-300 dark:border-gray-600"
                                                    />
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-white">{payment.date}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{payment.employee.employee_name}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{payment.shift.name}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{payment.from_account.name}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{payment.to_account.name}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">৳{payment.amount.toLocaleString()}</td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(payment)}
                                                            className="text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(payment)}
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
                                            <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                <Building className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                                No office payments found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={officePayments.current_page}
                            lastPage={officePayments.last_page}
                            from={officePayments.from}
                            to={officePayments.to}
                            total={officePayments.total}
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
                    title="Create Office Payment"
                    onSubmit={handleSubmit}
                    processing={processing}
                    submitText="Create"
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
                                    <SelectValue placeholder="Select shift" />
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
                        <Label htmlFor="employee_id" className="dark:text-gray-200">Employee</Label>
                        <Select value={data.employee_id} onValueChange={(value) => setData('employee_id', value)}>
                            <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map((employee) => (
                                    <SelectItem key={employee.id} value={employee.id.toString()}>
                                        {employee.employee_name} ({employee.employee_code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.employee_id && <span className="text-sm text-red-500">{errors.employee_id}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="from_account_id" className="dark:text-gray-200">From Account</Label>
                            <Select value={data.from_account_id} onValueChange={(value) => setData('from_account_id', value)}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                    <SelectValue placeholder="Select from account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id.toString()}>
                                            {account.name} ({account.ac_number})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.from_account_id && <span className="text-sm text-red-500">{errors.from_account_id}</span>}
                        </div>
                        <div>
                            <Label htmlFor="to_account_id" className="dark:text-gray-200">To Account (Office)</Label>
                            <Select value={data.to_account_id} onValueChange={(value) => setData('to_account_id', value)}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                    <SelectValue placeholder="Select office account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id.toString()}>
                                            {account.name} ({account.ac_number})
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
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        {errors.amount && <span className="text-sm text-red-500">{errors.amount}</span>}
                    </div>

                    <div>
                        <Label htmlFor="payment_type" className="dark:text-gray-200">Payment Type</Label>
                        <Select value={data.payment_type} onValueChange={(value) => setData('payment_type', value)}>
                            <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                <SelectValue placeholder="Select payment type" />
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
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cash Deposit">Cash Deposit</SelectItem>
                                            <SelectItem value="Online">Online</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="bank_name" className="dark:text-gray-200">Bank Name</Label>
                                    <Input
                                        id="bank_name"
                                        value={data.bank_name}
                                        onChange={(e) => setData('bank_name', e.target.value)}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
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
                                            <SelectValue placeholder="Select mobile bank" />
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
                                        value={data.mobile_number}
                                        onChange={(e) => setData('mobile_number', e.target.value)}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="mobile_transaction_id" className="dark:text-gray-200">Transaction ID</Label>
                                <Input
                                    id="mobile_transaction_id"
                                    value={data.mobile_transaction_id}
                                    onChange={(e) => setData('mobile_transaction_id', e.target.value)}
                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <Label htmlFor="remarks" className="dark:text-gray-200">Remarks</Label>
                        <Input
                            id="remarks"
                            value={data.remarks}
                            onChange={(e) => setData('remarks', e.target.value)}
                            className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </FormModal>

                <DeleteModal
                    isOpen={!!deletingPayment}
                    onClose={() => setDeletingPayment(null)}
                    onConfirm={confirmDelete}
                    title="Delete Office Payment"
                    message={`Are you sure you want to delete this office payment? This action cannot be undone.`}
                />

                <DeleteModal
                    isOpen={isBulkDeleting}
                    onClose={() => setIsBulkDeleting(false)}
                    onConfirm={confirmBulkDelete}
                    title="Delete Selected Payments"
                    message={`Are you sure you want to delete ${selectedPayments.length} selected payments? This action cannot be undone.`}
                />
            </div>
        </AppLayout>
    );
}