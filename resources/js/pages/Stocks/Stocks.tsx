import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteModal } from '@/components/ui/delete-modal';
import { FormModal } from '@/components/ui/form-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Edit, Filter, Package, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Stock {
    id: number;
    product: {
        id: number;
        product_name: string;
        product_code: string;
        unit: { name: string };
        category: { name: string };
    };
    current_stock: number;
    available_stock: number;
    created_at: string;
}

interface Product {
    id: number;
    product_name: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Stocks', href: '/stocks' },
];

interface StocksProps {
    stocks: {
        data: Stock[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    products: Product[];
    filters: {
        search?: string;
        per_page?: number;
    };
}

export default function Stocks({ stocks, products = [], filters = {} }: StocksProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingStock, setEditingStock] = useState<Stock | null>(null);
    const [deletingStock, setDeletingStock] = useState<Stock | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [perPage, setPerPage] = useState(filters.per_page || 10);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        product_id: '',
        current_stock: '',
        available_stock: '',
    });

    const handleCreate = () => {
        reset();
        setIsCreateOpen(true);
    };

    const applyFilters = () => {
        router.get('/stocks', {
            search: search || undefined,
            per_page: perPage,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        router.get('/stocks', {
            per_page: perPage,
        }, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/stocks', {
            search: search || undefined,
            per_page: perPage,
            page,
        }, { preserveState: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingStock) {
            put(`/stocks/${editingStock.id}`, {
                onSuccess: () => {
                    setEditingStock(null);
                    reset();
                },
            });
        } else {
            post('/stocks', {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                },
            });
        }
    };

    const handleEdit = (stock: Stock) => {
        setEditingStock(stock);
        setData({
            product_id: stock.product.id.toString(),
            current_stock: stock.current_stock.toString(),
            available_stock: stock.available_stock.toString(),
        });
    };

    const handleDelete = (stock: Stock) => {
        setDeletingStock(stock);
    };

    const confirmDelete = () => {
        if (deletingStock) {
            router.delete(`/stocks/${deletingStock.id}`, {
                onSuccess: () => setDeletingStock(null),
            });
        }
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
            <Head title="Stocks" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">Stocks</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage stock levels</p>
                    </div>
                    <Button onClick={handleCreate} variant="success">
                        <Plus className="mr-2 h-4 w-4" />Add Stock
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
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <Label className="dark:text-gray-200">Search</Label>
                                <Input
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={applyFilters} className="px-4">Apply Filters</Button>
                                <Button onClick={clearFilters} variant="secondary" className="px-4">
                                    <X className="mr-2 h-4 w-4" />Clear
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
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Product Code</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Product Name</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Category</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Unit</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Current Stock</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Available Stock</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stocks.data.length > 0 ? (
                                        stocks.data.map((stock) => (
                                            <tr key={stock.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                                <td className="p-4 text-[13px] dark:text-white">{stock.product.product_code}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{stock.product.product_name}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{stock.product.category.name}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{stock.product.unit.name}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{stock.current_stock.toLocaleString()}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{stock.available_stock.toLocaleString()}</td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(stock)}
                                                            className="text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(stock)}
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
                                                <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                                No stocks found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={stocks.current_page}
                            lastPage={stocks.last_page}
                            from={stocks.from}
                            to={stocks.to}
                            total={stocks.total}
                            perPage={perPage}
                            onPageChange={handlePageChange}
                            onPerPageChange={(newPerPage) => { setPerPage(newPerPage); applyFilters(); }}
                        />
                    </CardContent>
                </Card>

                <FormModal
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    title="Create Stock"
                    onSubmit={handleSubmit}
                    processing={processing}
                    submitText="Create"
                >
                    <div>
                        <Label htmlFor="product_id" className="dark:text-gray-200">Product</Label>
                        <Select value={data.product_id} onValueChange={(value) => setData('product_id', value)}>
                            <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id.toString()}>
                                        {product.product_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.product_id && (
                            <span className="text-sm text-red-500">{errors.product_id}</span>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="current_stock" className="dark:text-gray-200">Current Stock</Label>
                        <Input
                            id="current_stock"
                            type="number"
                            step="0.01"
                            value={data.current_stock}
                            onChange={(e) => setData('current_stock', e.target.value)}
                            className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        {errors.current_stock && (
                            <span className="text-sm text-red-500">{errors.current_stock}</span>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="available_stock" className="dark:text-gray-200">Available Stock</Label>
                        <Input
                            id="available_stock"
                            type="number"
                            step="0.01"
                            value={data.available_stock}
                            onChange={(e) => setData('available_stock', e.target.value)}
                            className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        {errors.available_stock && (
                            <span className="text-sm text-red-500">{errors.available_stock}</span>
                        )}
                    </div>
                </FormModal>

                <FormModal
                    isOpen={!!editingStock}
                    onClose={() => setEditingStock(null)}
                    title="Edit Stock"
                    onSubmit={handleSubmit}
                    processing={processing}
                    submitText="Update"
                >
                    <div>
                        <Label htmlFor="edit_product_id" className="dark:text-gray-200">Product</Label>
                        <Select value={data.product_id} onValueChange={(value) => setData('product_id', value)}>
                            <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((product) => (
                                    <SelectItem key={product.id} value={product.id.toString()}>
                                        {product.product_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.product_id && (
                            <span className="text-sm text-red-500">{errors.product_id}</span>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="edit_current_stock" className="dark:text-gray-200">Current Stock</Label>
                        <Input
                            id="edit_current_stock"
                            type="number"
                            step="0.01"
                            value={data.current_stock}
                            onChange={(e) => setData('current_stock', e.target.value)}
                            className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        {errors.current_stock && (
                            <span className="text-sm text-red-500">{errors.current_stock}</span>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="edit_available_stock" className="dark:text-gray-200">Available Stock</Label>
                        <Input
                            id="edit_available_stock"
                            type="number"
                            step="0.01"
                            value={data.available_stock}
                            onChange={(e) => setData('available_stock', e.target.value)}
                            className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        {errors.available_stock && (
                            <span className="text-sm text-red-500">{errors.available_stock}</span>
                        )}
                    </div>
                </FormModal>

                <DeleteModal
                    isOpen={!!deletingStock}
                    onClose={() => setDeletingStock(null)}
                    onConfirm={confirmDelete}
                    title="Delete Stock"
                    message={`Are you sure you want to delete the stock for "${deletingStock?.product.product_name}"? This action cannot be undone.`}
                />
            </div>
        </AppLayout>
    );
}