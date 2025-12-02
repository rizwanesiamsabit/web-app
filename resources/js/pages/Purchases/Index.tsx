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
    ShoppingCart,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Purchase {
    id: number;
    purchase_date: string;
    supplier: { name: string };
    supplier_invoice_no: string;
    from_account: { name: string };
    net_total_amount: number;
    paid_amount: number;
    due_amount: number;
    payment_type: string;
    remarks: string;
    created_at: string;
}

interface Supplier {
    id: number;
    name: string;
}

interface Account {
    id: number;
    name: string;
    ac_number: string;
}

interface Product {
    id: number;
    product_name: string;
    product_code: string;
    unit: { name: string };
    purchase_price: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Purchases',
        href: '/purchases',
    },
];

interface PurchasesProps {
    purchases: {
        data: Purchase[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    suppliers: Supplier[];
    accounts: Account[];
    products: Product[];
    filters: {
        search?: string;
        supplier?: string;
        payment_status?: string;
        start_date?: string;
        end_date?: string;
        sort_by?: string;
        sort_order?: string;
        per_page?: number;
    };
}

export default function Purchases({ purchases, suppliers = [], accounts = [], products = [], filters }: PurchasesProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
    const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null);
    const [selectedPurchases, setSelectedPurchases] = useState<number[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');
    const [supplier, setSupplier] = useState(filters?.supplier || 'all');
    const [paymentStatus, setPaymentStatus] = useState(filters?.payment_status || 'all');
    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'created_at');
    const [sortOrder, setSortOrder] = useState(filters?.sort_order || 'desc');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        purchase_date: '',
        supplier_id: '',
        supplier_invoice_no: '',
        from_account_id: '',
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
        net_total_amount: '',
        paid_amount: '',
        due_amount: '',
        remarks: '',
        products: [
            {
                product_id: '',
                unit_price: '',
                quantity: '',
                amount: '',
                discount_type: 'Fixed',
                discount: '',
            }
        ],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPurchase) {
            put(`/purchases/${editingPurchase.id}`, {
                onSuccess: () => {
                    setEditingPurchase(null);
                    reset();
                },
            });
        } else {
            post('/purchases', {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                },
            });
        }
    };

    const handleEdit = (purchase: Purchase) => {
        setEditingPurchase(purchase);
        setData({
            purchase_date: purchase.purchase_date,
            supplier_id: purchase.supplier.name,
            supplier_invoice_no: purchase.supplier_invoice_no,
            from_account_id: purchase.from_account.name,
            payment_type: purchase.payment_type,
            bank_type: '',
            cheque_no: '',
            cheque_date: '',
            bank_name: '',
            branch_name: '',
            account_no: '',
            mobile_bank: '',
            mobile_number: '',
            mobile_transaction_id: '',
            net_total_amount: purchase.net_total_amount.toString(),
            paid_amount: purchase.paid_amount.toString(),
            due_amount: purchase.due_amount.toString(),
            remarks: purchase.remarks || '',
            products: [
                {
                    product_id: '',
                    unit_price: '',
                    quantity: '',
                    amount: '',
                    discount_type: 'Fixed',
                    discount: '',
                }
            ],
        });
    };

    const handleDelete = (purchase: Purchase) => {
        setDeletingPurchase(purchase);
    };

    const confirmDelete = () => {
        if (deletingPurchase) {
            router.delete(`/purchases/${deletingPurchase.id}`, {
                onSuccess: () => setDeletingPurchase(null),
            });
        }
    };

    const handleBulkDelete = () => {
        setIsBulkDeleting(true);
    };

    const confirmBulkDelete = () => {
        router.delete('/purchases/bulk/delete', {
            data: { ids: selectedPurchases },
            onSuccess: () => {
                setSelectedPurchases([]);
                setIsBulkDeleting(false);
            },
        });
    };

    const applyFilters = () => {
        router.get(
            '/purchases',
            {
                search: search || undefined,
                supplier: supplier === 'all' ? undefined : supplier,
                payment_status: paymentStatus === 'all' ? undefined : paymentStatus,
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
        setSupplier('all');
        setPaymentStatus('all');
        setStartDate('');
        setEndDate('');
        router.get(
            '/purchases',
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
            '/purchases',
            {
                search: search || undefined,
                supplier: supplier === 'all' ? undefined : supplier,
                payment_status: paymentStatus === 'all' ? undefined : paymentStatus,
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
            '/purchases',
            {
                search: search || undefined,
                supplier: supplier === 'all' ? undefined : supplier,
                payment_status: paymentStatus === 'all' ? undefined : paymentStatus,
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
        if (selectedPurchases.length === purchases.data.length) {
            setSelectedPurchases([]);
        } else {
            setSelectedPurchases(purchases.data.map((purchase) => purchase.id));
        }
    };

    const toggleSelectPurchase = (purchaseId: number) => {
        if (selectedPurchases.includes(purchaseId)) {
            setSelectedPurchases(selectedPurchases.filter((id) => id !== purchaseId));
        } else {
            setSelectedPurchases([...selectedPurchases, purchaseId]);
        }
    };

    const addProduct = () => {
        setData('products', [
            ...data.products,
            {
                product_id: '',
                unit_price: '',
                quantity: '',
                amount: '',
                discount_type: 'Fixed',
                discount: '',
            }
        ]);
    };

    const removeProduct = (index: number) => {
        const newProducts = data.products.filter((_, i) => i !== index);
        setData('products', newProducts);
    };

    const updateProduct = (index: number, field: string, value: string) => {
        const newProducts = [...data.products];
        newProducts[index] = { ...newProducts[index], [field]: value };
        
        // Calculate amount if unit_price and quantity are provided
        if (field === 'unit_price' || field === 'quantity') {
            const unitPrice = parseFloat(newProducts[index].unit_price) || 0;
            const quantity = parseFloat(newProducts[index].quantity) || 0;
            newProducts[index].amount = (unitPrice * quantity).toString();
        }
        
        setData('products', newProducts);
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
            <Head title="Purchases" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">
                            Purchases
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage purchase orders and supplier transactions
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {selectedPurchases.length > 0 && (
                            <Button
                                variant="destructive"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected ({selectedPurchases.length})
                            </Button>
                        )}
                        <Button
                            variant="success"
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (search) params.append('search', search);
                                if (supplier !== 'all') params.append('supplier', supplier);
                                if (paymentStatus !== 'all') params.append('payment_status', paymentStatus);
                                if (startDate) params.append('start_date', startDate);
                                if (endDate) params.append('end_date', endDate);
                                if (sortBy) params.append('sort_by', sortBy);
                                if (sortOrder) params.append('sort_order', sortOrder);
                                window.location.href = `/purchases/download-pdf?${params.toString()}`;
                            }}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Purchase
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
                                    placeholder="Search purchases..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <Label className="dark:text-gray-200">Supplier</Label>
                                <Select
                                    value={supplier}
                                    onValueChange={(value) => {
                                        setSupplier(value);
                                        applyFilters();
                                    }}
                                >
                                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                        <SelectValue placeholder="All suppliers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All suppliers</SelectItem>
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={s.name}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="dark:text-gray-200">Payment Status</Label>
                                <Select
                                    value={paymentStatus}
                                    onValueChange={(value) => {
                                        setPaymentStatus(value);
                                        applyFilters();
                                    }}
                                >
                                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                        <SelectValue placeholder="All status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All status</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="partial">Partial</SelectItem>
                                        <SelectItem value="due">Due</SelectItem>
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
                                                checked={selectedPurchases.length === purchases.data.length && purchases.data.length > 0}
                                                onChange={toggleSelectAll}
                                                className="rounded border-gray-300 dark:border-gray-600"
                                            />
                                        </th>
                                        <th
                                            className="cursor-pointer p-4 text-left text-[13px] font-medium dark:text-gray-300"
                                            onClick={() => handleSort('purchase_date')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Date
                                                {sortBy === 'purchase_date' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                                            </div>
                                        </th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">Supplier</th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">Invoice No</th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">Total Amount</th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">Paid Amount</th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">Due Amount</th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">Status</th>
                                        <th className="p-4 text-left font-medium dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchases.data.length > 0 ? (
                                        purchases.data.map((purchase) => (
                                            <tr key={purchase.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPurchases.includes(purchase.id)}
                                                        onChange={() => toggleSelectPurchase(purchase.id)}
                                                        className="rounded border-gray-300 dark:border-gray-600"
                                                    />
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-white">{purchase.purchase_date}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{purchase.supplier.name}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{purchase.supplier_invoice_no}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">৳{purchase.net_total_amount.toLocaleString()}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">৳{purchase.paid_amount.toLocaleString()}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">৳{purchase.due_amount.toLocaleString()}</td>
                                                <td className="p-4">
                                                    <span className={`rounded px-2 py-1 text-xs ${
                                                        purchase.due_amount === 0 
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : purchase.paid_amount > 0
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    }`}>
                                                        {purchase.due_amount === 0 ? 'Paid' : purchase.paid_amount > 0 ? 'Partial' : 'Due'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(purchase)}
                                                            className="text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(purchase)}
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
                                            <td colSpan={9} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                                No purchases found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={purchases.current_page}
                            lastPage={purchases.last_page}
                            from={purchases.from}
                            to={purchases.to}
                            total={purchases.total}
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
                    title="Create Purchase"
                    onSubmit={handleSubmit}
                    processing={processing}
                    submitText="Create"
                    size="large"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="purchase_date" className="dark:text-gray-200">Purchase Date</Label>
                            <Input
                                id="purchase_date"
                                type="date"
                                value={data.purchase_date}
                                onChange={(e) => setData('purchase_date', e.target.value)}
                                className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            {errors.purchase_date && <span className="text-sm text-red-500">{errors.purchase_date}</span>}
                        </div>
                        <div>
                            <Label htmlFor="supplier_id" className="dark:text-gray-200">Supplier</Label>
                            <Select value={data.supplier_id} onValueChange={(value) => setData('supplier_id', value)}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                    <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                            {supplier.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.supplier_id && <span className="text-sm text-red-500">{errors.supplier_id}</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="supplier_invoice_no" className="dark:text-gray-200">Supplier Invoice No</Label>
                            <Input
                                id="supplier_invoice_no"
                                value={data.supplier_invoice_no}
                                onChange={(e) => setData('supplier_invoice_no', e.target.value)}
                                className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            {errors.supplier_invoice_no && <span className="text-sm text-red-500">{errors.supplier_invoice_no}</span>}
                        </div>
                        <div>
                            <Label htmlFor="from_account_id" className="dark:text-gray-200">From Account</Label>
                            <Select value={data.from_account_id} onValueChange={(value) => setData('from_account_id', value)}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                    <SelectValue placeholder="Select account" />
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
                    </div>

                    {/* Product Selection */}
                    <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium dark:text-white">Product Selection</h4>
                            <Button type="button" onClick={addProduct} size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Product
                            </Button>
                        </div>
                        
                        {data.products.map((product, index) => (
                            <div key={index} className="grid grid-cols-6 gap-2 items-end border rounded p-3">
                                <div>
                                    <Label className="dark:text-gray-200">Product</Label>
                                    <Select 
                                        value={product.product_id} 
                                        onValueChange={(value) => updateProduct(index, 'product_id', value)}
                                    >
                                        <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((p) => (
                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                    {p.product_name} ({p.product_code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="dark:text-gray-200">Unit Price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={product.unit_price}
                                        onChange={(e) => updateProduct(index, 'unit_price', e.target.value)}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="dark:text-gray-200">Quantity</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={product.quantity}
                                        onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="dark:text-gray-200">Amount</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={product.amount}
                                        readOnly
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white bg-gray-100"
                                    />
                                </div>
                                <div>
                                    <Label className="dark:text-gray-200">Discount</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={product.discount}
                                        onChange={(e) => updateProduct(index, 'discount', e.target.value)}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    {data.products.length > 1 && (
                                        <Button 
                                            type="button" 
                                            variant="destructive" 
                                            size="sm"
                                            onClick={() => removeProduct(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Payment Method */}
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

                    {/* Summary Fields */}
                    <div className="grid grid-cols-3 gap-4 border-t pt-4">
                        <div>
                            <Label htmlFor="net_total_amount" className="dark:text-gray-200">Net Total Amount</Label>
                            <Input
                                id="net_total_amount"
                                type="number"
                                step="0.01"
                                value={data.net_total_amount}
                                onChange={(e) => setData('net_total_amount', e.target.value)}
                                className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            {errors.net_total_amount && <span className="text-sm text-red-500">{errors.net_total_amount}</span>}
                        </div>
                        <div>
                            <Label htmlFor="paid_amount" className="dark:text-gray-200">Paid Amount</Label>
                            <Input
                                id="paid_amount"
                                type="number"
                                step="0.01"
                                value={data.paid_amount}
                                onChange={(e) => {
                                    const paid = parseFloat(e.target.value) || 0;
                                    const total = parseFloat(data.net_total_amount) || 0;
                                    setData({
                                        ...data,
                                        paid_amount: e.target.value,
                                        due_amount: (total - paid).toString()
                                    });
                                }}
                                className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            {errors.paid_amount && <span className="text-sm text-red-500">{errors.paid_amount}</span>}
                        </div>
                        <div>
                            <Label htmlFor="due_amount" className="dark:text-gray-200">Due Amount</Label>
                            <Input
                                id="due_amount"
                                type="number"
                                step="0.01"
                                value={data.due_amount}
                                readOnly
                                className="dark:border-gray-600 dark:bg-gray-700 dark:text-white bg-gray-100"
                            />
                        </div>
                    </div>

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
                    isOpen={!!deletingPurchase}
                    onClose={() => setDeletingPurchase(null)}
                    onConfirm={confirmDelete}
                    title="Delete Purchase"
                    message={`Are you sure you want to delete this purchase? This action cannot be undone.`}
                />

                <DeleteModal
                    isOpen={isBulkDeleting}
                    onClose={() => setIsBulkDeleting(false)}
                    onConfirm={confirmBulkDelete}
                    title="Delete Selected Purchases"
                    message={`Are you sure you want to delete ${selectedPurchases.length} selected purchases? This action cannot be undone.`}
                />
            </div>
        </AppLayout>
    );
}