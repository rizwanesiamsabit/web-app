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
import { Plus, Edit, Trash2, Shield, ChevronUp, ChevronDown, Filter, X, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Role {
    id: number;
    name: string;
    guard_name: string;
    permissions_count: number;
    created_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Roles',
        href: '/roles',
    },
];

interface RolesProps {
    roles: {
        data: Role[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: {
        search?: string;
        guard_name?: string;
        sort_by?: string;
        sort_order?: string;
        per_page?: number;
    };
}

export default function Roles({ roles, filters }: RolesProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [deletingRole, setDeletingRole] = useState<Role | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');
    const [guardName, setGuardName] = useState(filters?.guard_name || 'all');
    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'name');
    const [sortOrder, setSortOrder] = useState(filters?.sort_order || 'asc');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        guard_name: 'web'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRole) {
            put(`/roles/${editingRole.id}`, {
                onSuccess: () => {
                    setEditingRole(null);
                    reset();
                }
            });
        } else {
            post('/roles', {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                }
            });
        }
    };

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setData({
            name: role.name,
            guard_name: role.guard_name
        });
    };

    const handleDelete = (role: Role) => {
        setDeletingRole(role);
    };

    const confirmDelete = () => {
        if (deletingRole) {
            router.delete(`/roles/${deletingRole.id}`, {
                onSuccess: () => setDeletingRole(null)
            });
        }
    };

    const handleBulkDelete = () => {
        setIsBulkDeleting(true);
    };

    const confirmBulkDelete = () => {
        router.delete('/roles/bulk/delete', {
            data: { ids: selectedRoles },
            onSuccess: () => {
                setSelectedRoles([]);
                setIsBulkDeleting(false);
            }
        });
    };

    const applyFilters = () => {
        router.get('/roles', {
            search: search || undefined,
            guard_name: guardName === 'all' ? undefined : guardName,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            sort_by: sortBy,
            sort_order: sortOrder,
            per_page: perPage,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setSearch('');
        setGuardName('all');
        setStartDate('');
        setEndDate('');
        router.get('/roles', {
            sort_by: sortBy,
            sort_order: sortOrder,
            per_page: perPage,
        }, { preserveState: true });
    };

    const handleSort = (column: string) => {
        const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(column);
        setSortOrder(newOrder);
        router.get('/roles', {
            search: search || undefined,
            guard_name: guardName === 'all' ? undefined : guardName,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            sort_by: column,
            sort_order: newOrder,
            per_page: perPage,
        }, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get('/roles', {
            search: search || undefined,
            guard_name: guardName === 'all' ? undefined : guardName,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            sort_by: sortBy,
            sort_order: sortOrder,
            per_page: perPage,
            page,
        }, { preserveState: true });
    };

    const toggleSelectAll = () => {
        if (selectedRoles.length === roles.data.length) {
            setSelectedRoles([]);
        } else {
            setSelectedRoles(roles.data.map(role => role.id));
        }
    };

    const toggleSelectRole = (roleId: number) => {
        if (selectedRoles.includes(roleId)) {
            setSelectedRoles(selectedRoles.filter(id => id !== roleId));
        } else {
            setSelectedRoles([...selectedRoles, roleId]);
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
            <Head title="Roles" />
            
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold dark:text-white">Roles</h1>
                        <p className="text-gray-600 dark:text-gray-400">Manage user roles and permissions</p>
                    </div>
                    <div className="flex gap-2">
                        {selectedRoles.length > 0 && (
                            <Button 
                                variant="destructive" 
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="h-5 w-5 mr-2" />
                                Delete Selected ({selectedRoles.length})
                            </Button>
                        )}
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="h-5 w-5 mr-2" />
                            Add Role
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
                                    placeholder="Search roles..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <Label className="text-sm dark:text-gray-200">Guard Name</Label>
                                <Select value={guardName} onValueChange={setGuardName}>
                                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                        <SelectValue placeholder="All guards" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All guards</SelectItem>
                                        <SelectItem value="web">Web</SelectItem>
                                        <SelectItem value="api">API</SelectItem>
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
                        <CardTitle className="dark:text-white">Role Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={selectedRoles.length === roles.data.length && roles.data.length > 0}
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
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Guard Name</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer" onClick={() => handleSort('permissions_count')}>
                                            <div className="flex items-center gap-1">
                                                Permissions
                                                {sortBy === 'permissions_count' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                                            </div>
                                        </th>
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
                                    {roles.data.length > 0 ? roles.data.map((role) => (
                                        <tr key={role.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="py-3 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRoles.includes(role.id)}
                                                    onChange={() => toggleSelectRole(role.id)}
                                                    className="rounded border-gray-300 dark:border-gray-600"
                                                />
                                            </td>
                                            <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">{role.name}</td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-1 text-sm font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                                    {role.guard_name}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{role.permissions_count} permissions</td>
                                            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{new Date(role.created_at).toLocaleDateString()}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => handleEdit(role)}
                                                        className="text-indigo-600 hover:text-indigo-800"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => handleDelete(role)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400">
                                                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                No roles found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        <Pagination
                            currentPage={roles.current_page}
                            lastPage={roles.last_page}
                            from={roles.from}
                            to={roles.to}
                            total={roles.total}
                            perPage={perPage}
                            onPageChange={handlePageChange}
                            onPerPageChange={(newPerPage) => {
                                setPerPage(newPerPage);
                                router.get('/roles', {
                                    search: search || undefined,
                                    guard_name: guardName === 'all' ? undefined : guardName,
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
                    title="Create Role"
                    onSubmit={handleSubmit}
                    processing={processing}
                    submitText="Create"
                >
                    <div>
                        <Label htmlFor="name" className="dark:text-gray-200">Role Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="e.g., admin, editor"
                        />
                        {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                    </div>
                    <div>
                        <Label htmlFor="guard_name" className="dark:text-gray-200">Guard Name</Label>
                        <Select value={data.guard_name} onValueChange={(value) => setData('guard_name', value)}>
                            <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="web">Web</SelectItem>
                                <SelectItem value="api">API</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.guard_name && <span className="text-red-500 text-sm">{errors.guard_name}</span>}
                    </div>
                </FormModal>

                <FormModal
                    isOpen={!!editingRole}
                    onClose={() => setEditingRole(null)}
                    title="Edit Role"
                    onSubmit={handleSubmit}
                    processing={processing}
                    submitText="Update"
                >
                    <div>
                        <Label htmlFor="edit-name" className="dark:text-gray-200">Role Name</Label>
                        <Input
                            id="edit-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
                    </div>
                    <div>
                        <Label htmlFor="edit-guard_name" className="dark:text-gray-200">Guard Name</Label>
                        <Select value={data.guard_name} onValueChange={(value) => setData('guard_name', value)}>
                            <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="web">Web</SelectItem>
                                <SelectItem value="api">API</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.guard_name && <span className="text-red-500 text-sm">{errors.guard_name}</span>}
                    </div>
                </FormModal>

                <DeleteModal
                    isOpen={!!deletingRole}
                    onClose={() => setDeletingRole(null)}
                    onConfirm={confirmDelete}
                    title="Delete Role"
                    message={`Are you sure you want to delete the role "${deletingRole?.name}"? This action cannot be undone.`}
                />

                <DeleteModal
                    isOpen={isBulkDeleting}
                    onClose={() => setIsBulkDeleting(false)}
                    onConfirm={confirmBulkDelete}
                    title="Delete Selected Roles"
                    message={`Are you sure you want to delete ${selectedRoles.length} selected roles? This action cannot be undone.`}
                />
            </div>
        </AppLayout>
    );
}