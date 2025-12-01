import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Edit, Trash2, Plus, Download, Search } from 'lucide-react';
import AppLayout from '@/layouts/app/app-layout';

interface Employee {
    id: number;
    employee_code: string;
    employee_name: string;
    email: string;
    mobile: string;
    joining_date: string;
    job_status: string;
    status: boolean;
}

interface Props {
    employees: {
        data: Employee[];
        links: any[];
        meta: any;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function Index({ employees, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const handleSearch = () => {
        router.get('/employees', { search }, { preserveState: true });
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure?')) {
            router.delete(`/employees/${id}`);
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.length && confirm('Delete selected employees?')) {
            router.post('/employees/bulk-delete', { ids: selectedIds });
        }
    };

    return (
        <AppLayout>
            <Head title="Employees" />
            
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Employees</h1>
                    <div className="flex gap-2">
                        <Button asChild>
                            <Link href="/employees/create">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Employee
                            </Link>
                        </Button>
                        <Button variant="outline" onClick={() => window.open('/employees/download-pdf')}>
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search employees..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <Button onClick={handleSearch}>
                                <Search className="w-4 h-4" />
                            </Button>
                        </div>
                        {selectedIds.length > 0 && (
                            <Button variant="destructive" onClick={handleBulkDelete}>
                                Delete Selected ({selectedIds.length})
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">
                                            <input
                                                type="checkbox"
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(employees.data.map(emp => emp.id));
                                                    } else {
                                                        setSelectedIds([]);
                                                    }
                                                }}
                                            />
                                        </th>
                                        <th className="text-left p-2">Code</th>
                                        <th className="text-left p-2">Name</th>
                                        <th className="text-left p-2">Email</th>
                                        <th className="text-left p-2">Mobile</th>
                                        <th className="text-left p-2">Joining Date</th>
                                        <th className="text-left p-2">Job Status</th>
                                        <th className="text-left p-2">Status</th>
                                        <th className="text-left p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.data.map((employee) => (
                                        <tr key={employee.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(employee.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedIds([...selectedIds, employee.id]);
                                                        } else {
                                                            setSelectedIds(selectedIds.filter(id => id !== employee.id));
                                                        }
                                                    }}
                                                />
                                            </td>
                                            <td className="p-2">{employee.employee_code}</td>
                                            <td className="p-2">{employee.employee_name}</td>
                                            <td className="p-2">{employee.email}</td>
                                            <td className="p-2">{employee.mobile}</td>
                                            <td className="p-2">{employee.joining_date}</td>
                                            <td className="p-2">{employee.job_status}</td>
                                            <td className="p-2">
                                                <Badge variant={employee.status ? 'default' : 'secondary'}>
                                                    {employee.status ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="p-2">
                                                <div className="flex gap-1">
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/employees/${employee.id}`}>
                                                            <Eye className="w-4 h-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button size="sm" variant="outline" asChild>
                                                        <Link href={`/employees/${employee.id}/edit`}>
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="destructive"
                                                        onClick={() => handleDelete(employee.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}