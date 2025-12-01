import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { 
    ArrowLeft, 
    Edit, 
    Mail, 
    Phone, 
    MapPin, 
    Calendar, 
    DollarSign,
    Building,
    User,
    Clock,
    FileText
} from 'lucide-react';

interface Employee {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    department: {
        id: number;
        name: string;
    };
    designation: {
        id: number;
        name: string;
    };
    empType: {
        id: number;
        name: string;
    };
    shift: {
        id: number;
        name: string;
        start_time: string;
        end_time: string;
    };
    salary: string;
    joining_date: string;
    status: string;
    notes: string;
    created_at: string;
    updated_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Employees',
        href: '/employees',
    },
    {
        title: 'Details',
        href: '#',
    },
];

interface ShowEmployeeProps {
    employee: Employee;
}

export default function ShowEmployee({ employee }: ShowEmployeeProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(parseFloat(amount));
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'inactive':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'terminated':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Employee - ${employee.name}`} />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">
                            Employee Details
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            View employee information and details
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.get('/employees')}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Employees
                        </Button>
                        <Button
                            onClick={() => router.get(`/employees/${employee.id}/edit`)}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Employee
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Employee Basic Info */}
                    <div className="lg:col-span-2">
                        <Card className="dark:border-gray-700 dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 dark:text-white">
                                    <User className="h-5 w-5" />
                                    Personal Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Full Name
                                        </label>
                                        <p className="mt-1 text-lg font-semibold dark:text-white">
                                            {employee.name}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Status
                                        </label>
                                        <div className="mt-1">
                                            <Badge className={getStatusColor(employee.status)}>
                                                {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Email
                                            </label>
                                            <p className="dark:text-white">{employee.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Phone
                                            </label>
                                            <p className="dark:text-white">{employee.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                {employee.address && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Address
                                            </label>
                                            <p className="dark:text-white">{employee.address}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Employee Status & Quick Info */}
                    <div>
                        <Card className="dark:border-gray-700 dark:bg-gray-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 dark:text-white">
                                    <Building className="h-5 w-5" />
                                    Quick Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Employee ID
                                    </label>
                                    <p className="font-semibold dark:text-white">#{employee.id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Joining Date
                                    </label>
                                    <p className="flex items-center gap-2 dark:text-white">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(employee.joining_date)}
                                    </p>
                                </div>
                                {employee.salary && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Salary
                                        </label>
                                        <p className="flex items-center gap-2 font-semibold text-green-600 dark:text-green-400">
                                            <DollarSign className="h-4 w-4" />
                                            {formatCurrency(employee.salary)}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Work Information */}
                <Card className="dark:border-gray-700 dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 dark:text-white">
                            <Building className="h-5 w-5" />
                            Work Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Department
                                </label>
                                <p className="mt-1 font-semibold dark:text-white">
                                    {employee.department.name}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Designation
                                </label>
                                <p className="mt-1 font-semibold dark:text-white">
                                    {employee.designation.name}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Employee Type
                                </label>
                                <p className="mt-1 font-semibold dark:text-white">
                                    {employee.empType.name}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Shift
                                </label>
                                <div className="mt-1">
                                    <p className="font-semibold dark:text-white">
                                        {employee.shift.name}
                                    </p>
                                    <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                        <Clock className="h-3 w-3" />
                                        {employee.shift.start_time} - {employee.shift.end_time}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                {employee.notes && (
                    <Card className="dark:border-gray-700 dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 dark:text-white">
                                <FileText className="h-5 w-5" />
                                Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {employee.notes}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* System Information */}
                <Card className="dark:border-gray-700 dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="dark:text-white">System Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Created At
                                </label>
                                <p className="dark:text-white">{formatDate(employee.created_at)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Last Updated
                                </label>
                                <p className="dark:text-white">{formatDate(employee.updated_at)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}