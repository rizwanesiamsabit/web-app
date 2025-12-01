import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit } from 'lucide-react';
import AppLayout from '@/layouts/app/app-layout';

interface Employee {
    id: number;
    employee_code: string;
    employee_name: string;
    email: string;
    dob: string;
    gender: string;
    blood_group: string;
    marital_status: string;
    religion: string;
    nid: string;
    mobile: string;
    mobile_two: string;
    emergency_contact_person: string;
    emergency_contact_number: string;
    father_name: string;
    mother_name: string;
    present_address: string;
    permanent_address: string;
    job_status: string;
    joining_date: string;
    highest_education: string;
    status: boolean;
    created_at: string;
}

interface Props {
    employee: Employee;
}

export default function Show({ employee }: Props) {
    return (
        <AppLayout>
            <Head title={`Employee - ${employee.employee_name}`} />
            
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" asChild>
                            <Link href="/employees">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Link>
                        </Button>
                        <h1 className="text-2xl font-bold">Employee Details</h1>
                    </div>
                    <Button asChild>
                        <Link href={`/employees/${employee.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Employee Code</label>
                                    <p className="text-sm">{employee.employee_code || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Employee Name</label>
                                    <p className="text-sm font-medium">{employee.employee_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                    <p className="text-sm">{employee.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Mobile</label>
                                    <p className="text-sm">{employee.mobile || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                                    <p className="text-sm">{employee.dob || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Gender</label>
                                    <p className="text-sm">{employee.gender || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">NID</label>
                                    <p className="text-sm">{employee.nid || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <Badge variant={employee.status ? 'default' : 'secondary'}>
                                        {employee.status ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Job Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Joining Date</label>
                                    <p className="text-sm">{employee.joining_date || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Job Status</label>
                                    <p className="text-sm">{employee.job_status || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Education</label>
                                    <p className="text-sm">{employee.highest_education || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Blood Group</label>
                                    <p className="text-sm">{employee.blood_group || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Family Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Father's Name</label>
                                    <p className="text-sm">{employee.father_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Mother's Name</label>
                                    <p className="text-sm">{employee.mother_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Marital Status</label>
                                    <p className="text-sm">{employee.marital_status || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Religion</label>
                                    <p className="text-sm">{employee.religion || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Emergency Contact Person</label>
                                    <p className="text-sm">{employee.emergency_contact_person || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Emergency Contact Number</label>
                                    <p className="text-sm">{employee.emergency_contact_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Present Address</label>
                                    <p className="text-sm">{employee.present_address || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Permanent Address</label>
                                    <p className="text-sm">{employee.permanent_address || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}