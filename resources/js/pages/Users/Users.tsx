import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { FormModal } from '@/components/ui/form-modal';
import { DeleteModal } from '@/components/ui/delete-modal';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Edit, Trash2, Users as UsersIcon, ChevronUp, ChevronDown, Filter, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    status: string;
    roles_count: number;
    roles: string;
    created_at: string;
}

interface Role {
    id: number;
    name: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Users',
        href: '/users',
    },
];

interface UsersProps {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: {
        search?: string;
        status?: string;
        sort_by?: string;
        sort_order?: string;
        per_page?: number;
    };
    roles: Role[];
}

export default function Users({ users, filters, roles }: UsersProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || 'all');
    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'name');
    const [sortOrder, setSortOrder] = useState(filters?.sort_order || 'asc');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        roles: [] as number[]
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            put(`/users/${editingUser.id}`, {
                onSuccess: () => {
                    setEditingUser(null);
                    reset();
                }
            });
        } else {
            post('/users', {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                }
            });
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setData({
            name: user.name,
            email: user.email,
            password: '',
            roles: []
        });
    };

    const handleDelete = (user: User) => {
        setDeletingUser(user);
    };

    const confirmDelete = () => {
        if (deletingUser) {
            router.delete(`/users/${deletingUser.id}`, {
                onSuccess: () => setDeletingUser(null)
            });
        }
    };

    const handleBulkDelete = () => {
        setIsBulkDeleting(true);
    };

    const confirmBulkDelete = () => {
        router.delete('/users/bulk/delete', {
            data: { ids: selectedUsers },
            onSuccess: () => {
                setSelectedUsers([]);
                setIsBulkDeleting(false);
            }
        });
    };

    const applyFilters = () => {
        router.get('/users', {
            search: search || undefined,
            status: status === 'all' ? undefined : status,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            sort_by: sortBy,
            sort_order: sortOrder,
            per_page: perPage,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('all');
        setStartDate('');
        setEndDate('');
        router.get('/users', {
            sort_by: sortBy,
            sort_order: sortOrder,
            per_page: perPage,
        }, { preserveState: true });
    };

    const handleSort = (column: string) => {
        const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(column);
        setSortOrder(newOrder);
        router.get('/users', {
            search: search || undefined,
            status: status === 'all' ? undefined : status,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            sort_by: column,
            sort_order: newOrder,
            per_page: perPage,
        }, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/users', {
            search: search || undefined,
            status: status === 'all' ? undefined : status,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            sort_by: sortBy,
            sort_order: sortOrder,
            per_page: perPage,
            page,
        }, { preserveState: true });
    };

    const toggleSelectAll = () => {
        if (selectedUsers.length === users.data.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.data.map(user => user.id));
        }
    };

    const toggleSelectUser = (userId: number) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
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
            <Head title="Users" />
            
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold dark:text-white">Users</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage system users and their roles</p>
                    </div>
                    <div className="flex gap-2">
                        {selectedUsers.length > 0 && (
                            <Button 
                                variant="destructive" 
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="h-5 w-5 mr-2" />
                                Delete Selected ({selectedUsers.length})
                            </Button>
                        )}
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="h-5 w-5 mr-2" />
                            Add User
                        </Button>
                    </div>
                </div>

                {/* Filter Card */}
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="dark:text-white flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <Label className="text-sm dark:text-gray-200">Search</Label>
                                <Input
                                    placeholder="Search users..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <Label className="text-sm dark:text-gray-200">Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <SelectValue placeholder="All status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-sm dark:text-gray-200">Start Date</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <Label className="text-sm dark:text-gray-200">End Date</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={applyFilters} className="flex-1">
                                    Apply Filters
                                </Button>
                                <Button onClick={clearFilters} variant="outline" className="flex-1">
                                    <X className="h-4 w-4 mr-2" />
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="dark:text-white">User Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={selectedUsers.length === users.data.length && users.data.length > 0}
                                                onChange={toggleSelectAll}
                                                className="rounded border-gray-300 dark:border-gray-600"
                                            />
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer" onClick={() => handleSort('name')}>
                                            <div className="flex items-center gap-1">
                                                Name
                                                {sortBy === 'name' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                                            </div>
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer" onClick={() => handleSort('email')}>
                                            <div className="flex items-center gap-1">
                                                Email
                                                {sortBy === 'email' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                                            </div>
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Roles</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer" onClick={() => handleSort('created_at')}>
                                            <div className="flex items-center gap-1">
                                                Created At
                                                {sortBy === 'created_at' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                                            </div>
                                        </th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.length > 0 ? users.data.map((user) => (
                                        <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="py-3 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={() => toggleSelectUser(user.id)}
                                                    className="rounded border-gray-300 dark:border-gray-600"
                                                />
                                            </td>
                                            <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</td>
                                            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{user.email}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 text-sm font-semibold rounded-full ${
                                                    user.status === 'Active' 
                                                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{user.roles || 'No roles'}</td>
                                            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{new Date(user.created_at).toLocaleDateString()}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => handleEdit(user)}
                                                        className="text-indigo-600 hover:text-indigo-800"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => handleDelete(user)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">
                                                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                No users found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        <Pagination
                            currentPage={users.current_page}
                            lastPage={users.last_page}
                            from={users.from}
                            to={users.to}
                            total={users.total}
                            perPage={perPage}
                            onPageChange={handlePageChange}
                            onPerPageChange={(newPerPage) => {
                                setPerPage(newPerPage);
                                router.get('/users', {
                                    search: search || undefined,
                                    status: status === 'all' ? undefined : status,
                                    start_date: startDate || undefined,
                                    end_date: endDate || undefined,
                                    sort_by: sortBy,
                                    sort_order: sortOrder,
                                    per_page: newPerPage,
                                }, { preserveState: true });
                            }}
                        />
                    </CardContent>
                </Card>

                <FormModal
                    isOpen={isCreateOpen}
                    onClose={() => setIsCreateOpen(false)}
                    title="Create User"
                    onSubmit={handleSubmit}
                    processing={processing}
                    submitText="Create"
                >
                    <div>
                        <Label htmlFor="name" className="dark:text-gray-200">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Enter user name"
                        />
                        {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                    </div>
                    <div>
                        <Label htmlFor="email" className="dark:text-gray-200">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Enter email address"
                        />
                        {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
                    </div>
                    <div>
                        <Label htmlFor="password" className="dark:text-gray-200">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Enter password"
                        />
                        {errors.password && <span className="text-red-500 text-sm">{errors.password}</span>}
                    </div>
                </FormModal>

                <FormModal
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    title="Edit User"
                    onSubmit={handleSubmit}
                    processing={processing}
                    submitText="Update"
                >
                    <div>
                        <Label htmlFor="edit-name" className="dark:text-gray-200">Name</Label>
                        <Input
                            id="edit-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                    </div>
                    <div>
                        <Label htmlFor="edit-email" className="dark:text-gray-200">Email</Label>
                        <Input
                            id="edit-email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
                    </div>
                    <div>
                        <Label htmlFor="edit-password" className="dark:text-gray-200">Password (leave blank to keep current)</Label>
                        <Input
                            id="edit-password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Enter new password"
                        />
                        {errors.password && <span className="text-red-500 text-sm">{errors.password}</span>}
                    </div>
                </FormModal>

                <DeleteModal
                    isOpen={!!deletingUser}
                    onClose={() => setDeletingUser(null)}
                    onConfirm={confirmDelete}
                    title="Delete User"
                    message={`Are you sure you want to delete the user "${deletingUser?.name}"? This action cannot be undone.`}
                />

                <DeleteModal
                    isOpen={isBulkDeleting}
                    onClose={() => setIsBulkDeleting(false)}
                    onConfirm={confirmBulkDelete}
                    title="Delete Selected Users"
                    message={`Are you sure you want to delete ${selectedUsers.length} selected users? This action cannot be undone.`}
                />
            </div>
        </AppLayout>
    );
}