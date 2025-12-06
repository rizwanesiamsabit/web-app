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
    stock?: {
        current_stock: number;
        available_stock: number;
    };
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
    groupedAccounts: Record<string, Account[]>;
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

export default function Purchases({ purchases, suppliers = [], accounts = [], groupedAccounts = {}, products = [], filters = {} }: PurchasesProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
    const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(null);
    const [selectedPurchases, setSelectedPurchases] = useState<number[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [supplier, setSupplier] = useState(filters.supplier || 'all');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'created_at');
    const [sortOrder, setSortOrder] = useState(filters.sort_order || 'desc');
    const [perPage, setPerPage] = useState(filters.per_page || 10);

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
        // Check if first product has required fields
        const firstProduct = data.products[0];
        if (!firstProduct.product_id || !firstProduct.quantity || !firstProduct.unit_price) {
            alert('Please fill product, quantity and unit price');
            return;
        }

        // Add current product to cart and reset first product
        const newProducts = [
            {
                product_id: '',
                unit_price: '',
                quantity: '',
                amount: '',
                discount_type: 'Fixed',
                discount: '',
            },
            ...data.products
        ];

        // Calculate net total from all products except first one (which is empty)
        const total = newProducts.slice(1).reduce((sum, p) => {
            if (p.product_id) {
                const amount = parseFloat(p.amount) || 0;
                const discount = parseFloat(p.discount) || 0;
                return sum + (amount - discount);
            }
            return sum;
        }, 0);

        setData({
            ...data,
            products: newProducts,
            net_total_amount: total.toFixed(2),
            due_amount: (total - (parseFloat(data.paid_amount) || 0)).toFixed(2)
        });
    };

    const removeProduct = (index: number) => {
        const newProducts = data.products.filter((_, i) => i !== index);
        
        // Calculate net total after removing product
        const total = newProducts.slice(1).reduce((sum, p) => {
            if (p.product_id) {
                const amount = parseFloat(p.amount) || 0;
                const discount = parseFloat(p.discount) || 0;
                return sum + (amount - discount);
            }
            return sum;
        }, 0);

        setData({
            ...data,
            products: newProducts,
            net_total_amount: total.toFixed(2),
            due_amount: (total - (parseFloat(data.paid_amount) || 0)).toFixed(2)
        });
    };

    const getFilteredAccounts = () => {
        const groupName = data.payment_type === 'Cash' ? 'Cash in hand' : data.payment_type === 'Bank' ? 'Bank Account' : data.payment_type;
        return groupedAccounts[groupName] || [];
    };

    const updateProduct = (index: number, field: string, value: string) => {
        const newProducts = [...data.products];
        newProducts[index] = { ...newProducts[index], [field]: value };
        
        // Auto-fill unit price when product is selected
        if (field === 'product_id' && value) {
            const selectedProduct = products.find(p => p.id.toString() === value);
            if (selectedProduct && selectedProduct.purchase_price) {
                newProducts[index].unit_price = selectedProduct.purchase_price.toString();
            }
        }
        
        // Calculate amount if unit_price and quantity are provided
        if (field === 'unit_price' || field === 'quantity' || field === 'product_id') {
            const unitPrice = parseFloat(newProducts[index].unit_price) || 0;
            const quantity = parseFloat(newProducts[index].quantity) || 0;
            newProducts[index].amount = (unitPrice * quantity).toString();
        }
        
        setData('products', newProducts);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
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
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
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
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Supplier</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Invoice No</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Total Amount</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Paid Amount</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Due Amount</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Status</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Actions</th>
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
                    submitText="Create Purchase..."
                    className="max-w-7xl"
                >
                    <div className="space-y-4">
                            {/* Row 1: Purchase Date | Supplier | Supplier Invoice No | Product | Present Stock | Product Name | Code */}
                            <div className="grid grid-cols-7 gap-4">
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">
                                        Purchase Date <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={data.purchase_date}
                                        onChange={(e) => setData('purchase_date', e.target.value)}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                    {errors.purchase_date && (
                                        <p className="text-sm text-red-500">{errors.purchase_date}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">
                                        Supplier <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={data.supplier_id} onValueChange={(value) => setData('supplier_id', value)}>
                                        <SelectTrigger className={errors.supplier_id ? 'border-red-500' : ''}>
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
                                    {errors.supplier_id && (
                                        <p className="text-sm text-red-500">{errors.supplier_id}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Supplier Invoice No</Label>
                                    <Input
                                        value={data.supplier_invoice_no}
                                        onChange={(e) => setData('supplier_invoice_no', e.target.value)}
                                        placeholder="Enter supplier invoice number"
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Product</Label>
                                    <Select value={data.products[0]?.product_id || ''} onValueChange={(value) => updateProduct(0, 'product_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((product) => (
                                                <SelectItem key={product.id} value={product.id.toString()}>
                                                    {product.product_name} ({product.product_code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Present Stock</Label>
                                    <Input
                                        type="number"
                                        value={products.find(p => p.id.toString() === data.products[0]?.product_id)?.stock?.current_stock || '0'}
                                        readOnly
                                        className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Product Name</Label>
                                    <Input
                                        value={products.find(p => p.id.toString() === data.products[0]?.product_id)?.product_name || ''}
                                        readOnly
                                        className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Code</Label>
                                    <Input
                                        value={products.find(p => p.id.toString() === data.products[0]?.product_id)?.product_code || ''}
                                        readOnly
                                        className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Unit Name | Unit Price | Quantity | Amount | Discount Type | Percentage | Discount */}
                            <div className="grid grid-cols-7 gap-4">
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Unit Name</Label>
                                    <Input
                                        value={products.find(p => p.id.toString() === data.products[0]?.product_id)?.unit?.name || ''}
                                        readOnly
                                        className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Unit Price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.products[0]?.unit_price || ''}
                                        onChange={(e) => updateProduct(0, 'unit_price', e.target.value)}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Quantity</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.products[0]?.quantity || ''}
                                        onChange={(e) => updateProduct(0, 'quantity', e.target.value)}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Amount</Label>
                                    <Input
                                        type="number"
                                        value={data.products[0]?.amount || '0.00'}
                                        readOnly
                                        className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Discount Type</Label>
                                    <Select value={data.products[0]?.discount_type || 'Fixed'} onValueChange={(value) => updateProduct(0, 'discount_type', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Fixed">Fixed</SelectItem>
                                            <SelectItem value="Percentage">Percentage</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Percentage</Label>
                                    <Input
                                        type="number"
                                        value="0"
                                        readOnly
                                        className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Discount</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.products[0]?.discount || ''}
                                        onChange={(e) => updateProduct(0, 'discount', e.target.value)}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Payment Method | From Account | Bank/Mobile Bank Details | Paid Amount | Due Amount */}
                            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${data.payment_type === 'Bank' ? (data.bank_type === 'Cheque' ? 7 : 6) : data.payment_type === 'Mobile Bank' ? 6 : 4}, minmax(0, 1fr))` }}>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Payment Method</Label>
                                    <Select value={data.payment_type} onValueChange={(value) => {
                                        setData('payment_type', value);
                                        setData('from_account_id', ''); // Reset account when payment type changes
                                    }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select payment method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Bank">Bank</SelectItem>
                                            <SelectItem value="Mobile Bank">Mobile Bank</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">From Account</Label>
                                    <Select value={data.from_account_id} onValueChange={(value) => setData('from_account_id', value)}>
                                        <SelectTrigger className={errors.from_account_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select payment account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getFilteredAccounts().map((account) => (
                                                <SelectItem key={account.id} value={account.id.toString()}>
                                                    {account.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.from_account_id && (
                                        <p className="text-sm text-red-500">{errors.from_account_id}</p>
                                    )}
                                </div>
                                {data.payment_type === 'Bank' && (
                                    <>
                                        <div>
                                            <Label className="text-sm font-medium dark:text-gray-200">Bank Type</Label>
                                            <Select value={data.bank_type} onValueChange={(value) => setData('bank_type', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
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
                                            <Label className="text-sm font-medium dark:text-gray-200">Bank Name</Label>
                                            <Input
                                                value={data.bank_name}
                                                onChange={(e) => setData('bank_name', e.target.value)}
                                                className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                        {data.bank_type === 'Cheque' && (
                                            <div>
                                                <Label className="text-sm font-medium dark:text-gray-200">Cheque No</Label>
                                                <Input
                                                    value={data.cheque_no}
                                                    onChange={(e) => setData('cheque_no', e.target.value)}
                                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                                {data.payment_type === 'Mobile Bank' && (
                                    <>
                                        <div>
                                            <Label className="text-sm font-medium dark:text-gray-200">Mobile Bank</Label>
                                            <Select value={data.mobile_bank} onValueChange={(value) => setData('mobile_bank', value)}>
                                                <SelectTrigger>
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
                                            <Label className="text-sm font-medium dark:text-gray-200">Mobile Number</Label>
                                            <Input
                                                value={data.mobile_number}
                                                onChange={(e) => setData('mobile_number', e.target.value)}
                                                className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Paid Amount</Label>
                                    <Input
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
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Due Amount</Label>
                                    <Input
                                        type="number"
                                        value={data.due_amount || '0.00'}
                                        readOnly
                                        className="bg-gray-100 dark:bg-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Row 4: Remarks | Add Button */}
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-10">
                                    <Label className="text-sm font-medium dark:text-gray-200">Remarks</Label>
                                    <Input
                                        value={data.remarks}
                                        onChange={(e) => setData('remarks', e.target.value)}
                                        placeholder="Enter any remarks"
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div className="col-span-2 flex flex-col justify-end">
                                    <Button
                                        type="button"
                                        onClick={addProduct}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add to Cart
                                    </Button>
                                </div>
                            </div>

                            {/* Row 5: Cart Table */}
                            <div className="mt-6">
                                <table className="w-full border border-gray-300 dark:border-gray-600">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="p-2 text-left text-sm font-medium dark:text-gray-200">SL</th>
                                            <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Supplier</th>
                                            <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Product Name</th>
                                            <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Quantity</th>
                                            <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Unit Price</th>
                                            <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Discount</th>
                                            <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Total</th>
                                            <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.products.slice(1).filter(p => p.product_id).map((product, index) => {
                                            const selectedProduct = products.find(p => p.id.toString() === product.product_id);
                                            const selectedSupplier = suppliers.find(s => s.id.toString() === data.supplier_id);
                                            const actualIndex = index + 1; // Actual index in data.products array
                                            return (
                                                <tr key={actualIndex} className="border-t dark:border-gray-600">
                                                    <td className="p-2 text-sm dark:text-white">{index + 1}</td>
                                                    <td className="p-2 text-sm dark:text-white">{selectedSupplier?.name || '-'}</td>
                                                    <td className="p-2 text-sm dark:text-white">{selectedProduct?.product_name}</td>
                                                    <td className="p-2 text-sm dark:text-white">{product.quantity}</td>
                                                    <td className="p-2 text-sm dark:text-white">{product.unit_price}</td>
                                                    <td className="p-2 text-sm dark:text-white">{product.discount || '0'}</td>
                                                    <td className="p-2 text-sm dark:text-white">{product.amount}</td>
                                                    <td className="p-2">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    // Move product back to first position for editing
                                                                    const editProduct = data.products[actualIndex];
                                                                    const newProducts = data.products.filter((_, i) => i !== actualIndex);
                                                                    newProducts[0] = editProduct;
                                                                    setData('products', newProducts);
                                                                }}
                                                                className="text-indigo-600 hover:text-indigo-800"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => removeProduct(actualIndex)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
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