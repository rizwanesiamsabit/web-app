import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
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
}

interface Props {
    employee: Employee;
}

export default function Update({ employee }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        employee_code: employee.employee_code || '',
        employee_name: employee.employee_name || '',
        email: employee.email || '',
        dob: employee.dob || '',
        gender: employee.gender || '',
        blood_group: employee.blood_group || '',
        marital_status: employee.marital_status || '',
        religion: employee.religion || '',
        nid: employee.nid || '',
        mobile: employee.mobile || '',
        mobile_two: employee.mobile_two || '',
        emergency_contact_person: employee.emergency_contact_person || '',
        emergency_contact_number: employee.emergency_contact_number || '',
        father_name: employee.father_name || '',
        mother_name: employee.mother_name || '',
        present_address: employee.present_address || '',
        permanent_address: employee.permanent_address || '',
        job_status: employee.job_status || '',
        joining_date: employee.joining_date || '',
        highest_education: employee.highest_education || '',
        status: employee.status
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/employees/${employee.id}`);
    };

    return (
        <AppLayout>
            <Head title="Update Employee" />
            
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/employees">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">Update Employee</h1>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Employee Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="employee_code">Employee Code</Label>
                                    <Input
                                        id="employee_code"
                                        value={data.employee_code}
                                        onChange={(e) => setData('employee_code', e.target.value)}
                                        error={errors.employee_code}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="employee_name">Employee Name *</Label>
                                    <Input
                                        id="employee_name"
                                        value={data.employee_name}
                                        onChange={(e) => setData('employee_name', e.target.value)}
                                        error={errors.employee_name}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        error={errors.email}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="mobile">Mobile</Label>
                                    <Input
                                        id="mobile"
                                        value={data.mobile}
                                        onChange={(e) => setData('mobile', e.target.value)}
                                        error={errors.mobile}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="dob">Date of Birth</Label>
                                    <Input
                                        id="dob"
                                        type="date"
                                        value={data.dob}
                                        onChange={(e) => setData('dob', e.target.value)}
                                        error={errors.dob}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select value={data.gender} onValueChange={(value) => setData('gender', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="joining_date">Joining Date</Label>
                                    <Input
                                        id="joining_date"
                                        type="date"
                                        value={data.joining_date}
                                        onChange={(e) => setData('joining_date', e.target.value)}
                                        error={errors.joining_date}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="job_status">Job Status</Label>
                                    <Input
                                        id="job_status"
                                        value={data.job_status}
                                        onChange={(e) => setData('job_status', e.target.value)}
                                        error={errors.job_status}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="nid">NID</Label>
                                    <Input
                                        id="nid"
                                        value={data.nid}
                                        onChange={(e) => setData('nid', e.target.value)}
                                        error={errors.nid}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="father_name">Father's Name</Label>
                                    <Input
                                        id="father_name"
                                        value={data.father_name}
                                        onChange={(e) => setData('father_name', e.target.value)}
                                        error={errors.father_name}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="mother_name">Mother's Name</Label>
                                    <Input
                                        id="mother_name"
                                        value={data.mother_name}
                                        onChange={(e) => setData('mother_name', e.target.value)}
                                        error={errors.mother_name}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="emergency_contact_person">Emergency Contact Person</Label>
                                    <Input
                                        id="emergency_contact_person"
                                        value={data.emergency_contact_person}
                                        onChange={(e) => setData('emergency_contact_person', e.target.value)}
                                        error={errors.emergency_contact_person}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="present_address">Present Address</Label>
                                    <Textarea
                                        id="present_address"
                                        value={data.present_address}
                                        onChange={(e) => setData('present_address', e.target.value)}
                                        error={errors.present_address}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="permanent_address">Permanent Address</Label>
                                    <Textarea
                                        id="permanent_address"
                                        value={data.permanent_address}
                                        onChange={(e) => setData('permanent_address', e.target.value)}
                                        error={errors.permanent_address}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-4">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/employees">Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Updating...' : 'Update Employee'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}