import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FormModal } from '@/components/ui/form-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Edit, FileText, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DispenserReading {
    id: number;
    dispenser_id: number;
    product_id: number;
    item_rate: number;
    start_reading: number;
    end_reading: number;
    meter_test: number;
    net_reading: number;
    total_sale: number;
    dispenser?: {
        id: number;
        dispenser_name: string;
    };
    product?: {
        id: number;
        product_name: string;
        sales_price: number;
    };
}

interface Shift {
    id: number;
    name: string;
}

interface ClosedShift {
    close_date: string;
    shift_id: number;
}

interface ProductWiseData {
    [key: number]: {
        net_reading: number;
        total_sale: number;
        credit_sales: number;
        cash_sales: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Product', href: '#' },
    { title: 'Dispensers Reading', href: '/product/dispensers-reading' },
];

interface Product {
    id: number;
    product_name: string;
    product_code: string;
    sales_price: number;
    unit?: { name: string };
    stock?: { current_stock: number };
}

interface Customer {
    id: number;
    name: string;
}

interface Vehicle {
    id: number;
    vehicle_number: string;
    customer_id: number;
    product_id: number;
}

interface Account {
    id: number;
    name: string;
    ac_number: string;
}

interface Employee {
    id: number;
    employee_name: string;
}

interface DispenserReadingProps {
    dispenserReading: DispenserReading[];
    shifts: Shift[];
    closedShifts: ClosedShift[];
    products?: Product[];
    customers?: Customer[];
    vehicles?: Vehicle[];
    accounts?: Account[];
    groupedAccounts?: Record<string, Account[]>;
    employees?: Employee[];
}

export default function DispenserReading({ dispenserReading = [], shifts = [], closedShifts = [], products = [], customers = [], vehicles = [], accounts = [], groupedAccounts = {}, employees = [] }: DispenserReadingProps) {
    const [productWiseData, setProductWiseData] = useState<ProductWiseData>({});
    const [totalSalesSum, setTotalSalesSum] = useState(0);
    const [availableShifts, setAvailableShifts] = useState<Shift[]>([]);
    const [isCreditSalesOpen, setIsCreditSalesOpen] = useState(false);
    const [isBankSalesOpen, setIsBankSalesOpen] = useState(false);
    const [isCashReceiveOpen, setIsCashReceiveOpen] = useState(false);
    const [isCashPaymentOpen, setIsCashPaymentOpen] = useState(false);
    const [isOfficePaymentOpen, setIsOfficePaymentOpen] = useState(false);
    const [creditSalesData, setCreditSalesData] = useState({
        sale_date: '',
        invoice_no: '',
        shift_id: '',
        remarks: '',
        products: [{
            product_id: '',
            customer_id: '',
            vehicle_id: '',
            quantity: '',
            amount: '',
            discount: '',
            due_amount: '',
        }]
    });
    const [creditProcessing, setCreditProcessing] = useState(false);
    const [bankSalesData, setBankSalesData] = useState({
        sale_date: '',
        invoice_no: '',
        shift_id: '',
        remarks: '',
        products: [{
            product_id: '',
            customer: '',
            vehicle_no: '',
            quantity: '',
            amount: '',
            discount_type: 'Fixed',
            discount: '',
            payment_type: 'Bank',
            to_account_id: '',
            paid_amount: '',
            due_amount: '',
            bank_type: '',
            bank_name: '',
            cheque_no: '',
            cheque_date: '',
            branch_name: '',
            account_no: '',
            mobile_bank: '',
            mobile_number: '',
        }]
    });
    const [bankProcessing, setBankProcessing] = useState(false);
    const [cashReceiveData, setCashReceiveData] = useState({
        date: '',
        shift_id: '',
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
        remarks: '',
    });
    const [cashReceiveProcessing, setCashReceiveProcessing] = useState(false);
    const [cashPaymentData, setCashPaymentData] = useState({
        date: '',
        shift_id: '',
        from_account_id: '',
        to_account_id: '',
        amount: '',
        payment_type: 'Cash',
        bank_type: '',
        bank_name: '',
        cheque_no: '',
        cheque_date: '',
        account_no: '',
        branch_name: '',
        mobile_bank: '',
        mobile_number: '',
        remarks: '',
    });
    const [cashPaymentProcessing, setCashPaymentProcessing] = useState(false);
    const [officePaymentData, setOfficePaymentData] = useState({
        date: '',
        shift_id: '',
        from_account_id: '',
        to_account_id: '',
        amount: '',
        payment_type: 'Cash',
        bank_type: '',
        bank_name: '',
        cheque_no: '',
        cheque_date: '',
        account_no: '',
        branch_name: '',
        mobile_bank: '',
        mobile_number: '',
        remarks: '',
    });
    const [officePaymentProcessing, setOfficePaymentProcessing] = useState(false);

    const { data, setData, post, processing } = useForm({
        transaction_date: '',
        shift_id: '',
        credit_sales: '0',
        bank_sales: '0',
        cash_sales: '0',
        cash_receive: '0',
        total_cash: '0',
        cash_payment: '0',
        office_payment: '0',
        final_due_amount: '0',
        dispenser_readings: dispenserReading.map(reading => ({
            dispenser_id: reading.dispenser_id,
            product_id: reading.product_id,
            item_rate: reading.item_rate,
            start_reading: reading.start_reading,
            end_reading: reading.end_reading || reading.start_reading,
            meter_test: reading.meter_test || 0,
            reading_by: '',
            net_reading: 0,
            total_sale: 0,
        })),
    });

    const shiftOptions = availableShifts.map(shift => ({ value: shift.id.toString(), label: shift.name }));

    const calculateReading = (index: number, field: string, value: string) => {
        const newReadings = [...data.dispenser_readings];
        newReadings[index] = { ...newReadings[index], [field]: parseFloat(value) || 0 };
        const reading = newReadings[index];
        const netReading = Math.max(0, (reading.end_reading - reading.start_reading) - reading.meter_test);
        const totalSale = netReading * reading.item_rate;
        newReadings[index].net_reading = netReading;
        newReadings[index].total_sale = totalSale;
        setData('dispenser_readings', newReadings);
        updateTotals(newReadings, data.office_payment, data.credit_sales);
    };

    const updateTotals = (readings = data.dispenser_readings, officePaymentValue?: string, creditSalesValue?: string) => {
        const totalSales = readings.reduce((sum, reading) => sum + reading.total_sale, 0);
        setTotalSalesSum(totalSales);
        const creditSales = parseFloat(creditSalesValue !== undefined ? creditSalesValue : data.credit_sales) || 0;
        const cashSales = totalSales - creditSales;
        const cashReceive = parseFloat(data.cash_receive) || 0;
        const totalCash = cashSales + cashReceive;
        const cashPayment = parseFloat(data.cash_payment) || 0;
        const officePayment = parseFloat(officePaymentValue !== undefined ? officePaymentValue : data.office_payment) || 0;
        const finalDueAmount = (totalCash - cashPayment) - officePayment;
        setData(prev => ({
            ...prev,
            cash_sales: cashSales.toFixed(2),
            total_cash: totalCash.toFixed(2),
            final_due_amount: finalDueAmount.toFixed(2),
        }));
        setProductWiseData(prev => {
            const productWise: ProductWiseData = {};
            readings.forEach(reading => {
                if (!productWise[reading.product_id]) {
                    const existingCreditSales = prev[reading.product_id]?.credit_sales || 0;
                    productWise[reading.product_id] = { net_reading: 0, total_sale: 0, credit_sales: existingCreditSales, cash_sales: 0 };
                }
                productWise[reading.product_id].net_reading += reading.net_reading;
                productWise[reading.product_id].total_sale += reading.total_sale;
            });
            return productWise;
        });
    };

    const fetchShiftData = async (shiftDate: string, shiftId: string) => {
        if (!shiftDate || !shiftId) return;
        console.log('Fetching shift data for:', shiftDate, shiftId);
        try {
            const response = await fetch(`/product/get-shift-closing-data/${shiftDate}/${shiftId}`);
            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('API Result:', result);
            const summaryData = result?.getTotalSummeryReport?.[0] || {};
            console.log('Summary Data:', summaryData);
            const productWiseCreditSalesData = result?.getCreditSalesDetailsReport || [];
            const creditSalesByProduct: { [key: number]: number } = {};
            productWiseCreditSalesData.forEach((item: any) => {
                const productId = parseInt(item.product_id);
                const creditSales = parseFloat(item.product_wise_credit_sales) || 0;
                creditSalesByProduct[productId] = (creditSalesByProduct[productId] || 0) + creditSales;
            });
            setProductWiseData(prev => {
                const updated = { ...prev };
                Object.keys(creditSalesByProduct).forEach(productIdStr => {
                    const productId = parseInt(productIdStr);
                    if (updated[productId]) {
                        updated[productId].credit_sales = creditSalesByProduct[productId];
                    } else {
                        updated[productId] = { net_reading: 0, total_sale: 0, credit_sales: creditSalesByProduct[productId], cash_sales: 0 };
                    }
                });
                return updated;
            });
            setData(prev => {
                const newData = {
                    ...prev,
                    credit_sales: (summaryData.total_credit_sales_amount || 0).toString(),
                    bank_sales: (summaryData.total_bank_sale_amount || 0).toString(),
                    cash_receive: (summaryData.total_cash_receive_amount || 0).toString(),
                    cash_payment: (summaryData.total_cash_payment_amount || 0).toString(),
                    office_payment: (summaryData.total_office_payment_amount || 0).toString(),
                };
                console.log('Updated data:', newData);
                setTimeout(() => updateTotals(prev.dispenser_readings, newData.office_payment, newData.credit_sales), 0);
                return newData;
            });
        } catch (error) {
            console.error('Error fetching shift data:', error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (window.confirm('Are you sure you want to close this shift?')) {
            router.post('/product/dispensers-reading', data, {
                onSuccess: () => {
                    alert('Shift closed successfully.');
                    window.location.reload();
                },
                onError: () => {
                    alert('Failed to close shift.');
                }
            });
        }
    };

    const getAvailableShifts = (selectedDate: string) => {
        if (!selectedDate) return [];
        
        const closedShiftIds = closedShifts
            .filter(cs => cs.close_date === selectedDate)
            .map(cs => cs.shift_id);
        
        return shifts.filter(shift => !closedShiftIds.includes(shift.id));
    };

    const handleDateChange = async (date: string) => {
        setData('transaction_date', date);
        setData('shift_id', '');
        if (date) {
            setAvailableShifts(getAvailableShifts(date));
        } else {
            setAvailableShifts([]);
        }
    };

    useEffect(() => {
        updateTotals();
    }, []);

    useEffect(() => {
        console.log('useEffect triggered - Date:', data.transaction_date, 'Shift:', data.shift_id);
        if (data.transaction_date && data.shift_id) {
            fetchShiftData(data.transaction_date, data.shift_id);
        }
    }, [data.transaction_date, data.shift_id]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dispensers Reading" />
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dispensers Calculation</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Manage dispenser readings and shift closing</p>
                </div>
                <Card className="shadow-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                    <form onSubmit={handleSubmit}>
                        <CardHeader className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Transaction Date <span className="text-red-500">*</span></Label>
                                    <Input type="date" value={data.transaction_date} onChange={(e) => handleDateChange(e.target.value)} className="w-full dark:border-gray-600 dark:bg-gray-700 dark:text-white" required />
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Select Shift <span className="text-red-500">*</span></Label>
                                    <SearchableSelect options={shiftOptions} value={data.shift_id} onValueChange={(value) => setData('shift_id', value)} placeholder={data.transaction_date ? "Select shift" : "Select date first"} className="w-full" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Credit Sales</Label>
                                    <div className="relative">
                                        <Input value={data.credit_sales} readOnly className="w-full bg-gray-50 dark:border-gray-600 dark:bg-gray-600 dark:text-white pr-10" />
                                        <Button type="button" variant="secondary" size="sm" className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => { setCreditSalesData(prev => ({ ...prev, sale_date: data.transaction_date, shift_id: data.shift_id })); setIsCreditSalesOpen(true); }}>
                                            <FileText className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Bank Sales</Label>
                                    <div className="relative">
                                        <Input value={data.bank_sales} readOnly className="w-full bg-gray-50 dark:border-gray-600 dark:bg-gray-600 dark:text-white pr-10" />
                                        <Button type="button" variant="secondary" size="sm" className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => { setBankSalesData(prev => ({ ...prev, sale_date: data.transaction_date, shift_id: data.shift_id })); setIsBankSalesOpen(true); }}>
                                            <FileText className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Cash Sales</Label>
                                    <Input value={data.cash_sales} readOnly className="w-full bg-gray-50 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Cash Receive</Label>
                                    <div className="relative">
                                        <Input value={data.cash_receive} readOnly className="w-full bg-gray-50 dark:border-gray-600 dark:bg-gray-600 dark:text-white pr-10" />
                                        <Button type="button" variant="secondary" size="sm" className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => { setCashReceiveData(prev => ({ ...prev, date: data.transaction_date, shift_id: data.shift_id })); setIsCashReceiveOpen(true); }}>
                                            <FileText className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Total Cash</Label>
                                    <Input value={data.total_cash} readOnly className="w-full bg-gray-50 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Cash Payment</Label>
                                    <div className="relative">
                                        <Input value={data.cash_payment} readOnly className="w-full bg-gray-50 dark:border-gray-600 dark:bg-gray-600 dark:text-white pr-10" />
                                        <Button type="button" variant="secondary" size="sm" className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => { setCashPaymentData(prev => ({ ...prev, date: data.transaction_date, shift_id: data.shift_id })); setIsCashPaymentOpen(true); }}>
                                            <FileText className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Office Payment</Label>
                                    <div className="relative">
                                        <Input type="number" step="0.01" value={data.office_payment} onChange={(e) => { setData('office_payment', e.target.value); updateTotals(data.dispenser_readings, e.target.value); }} className="w-full dark:border-gray-600 dark:bg-gray-700 dark:text-white pr-10" />
                                        <Button type="button" variant="secondary" size="sm" className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => { setOfficePaymentData(prev => ({ ...prev, date: data.transaction_date, shift_id: data.shift_id })); setIsOfficePaymentOpen(true); }}>
                                            <FileText className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <Label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Final Due Amount</Label>
                                    <Input value={data.final_due_amount} readOnly className="w-full bg-gray-50 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 py-6">
                            <div className="mb-10 overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-200 dark:border-gray-600">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-700">
                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">SL</th>
                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Dispenser Name</th>
                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Product ID</th>
                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Product Name</th>
                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Item Rate</th>
                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Old Reading</th>
                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">New Reading</th>
                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Meter Test</th>
                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Reading By</th>
                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Net Reading</th>
                                            <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Total Sales</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.dispenser_readings.map((reading, index) => {
                                            const dispenserInfo = dispenserReading.find(d => d.dispenser_id === reading.dispenser_id);
                                            return (
                                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                                                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-blue-600 dark:text-blue-400">{dispenserInfo?.dispenser?.dispenser_name || 'Unknown'}</td>
                                                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">{reading.product_id || 'N/A'}</td>
                                                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">{dispenserInfo?.product?.product_name || 'No Product Assigned'}</td>
                                                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">{reading.item_rate}</td>
                                                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">{reading.start_reading}</td>
                                                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                                                        <Input type="number" step="0.01" value={reading.end_reading} onChange={(e) => calculateReading(index, 'end_reading', e.target.value)} className="w-32 h-8 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                                    </td>
                                                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                                                        <Input type="number" step="0.01" value={reading.meter_test} onChange={(e) => calculateReading(index, 'meter_test', e.target.value)} className="w-20 h-8 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                                    </td>
                                                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2">
                                                        <Select value={reading.reading_by} onValueChange={(value) => {
                                                            const newReadings = [...data.dispenser_readings];
                                                            newReadings[index] = { ...newReadings[index], reading_by: value };
                                                            setData('dispenser_readings', newReadings);
                                                        }}>
                                                            <SelectTrigger className="w-32 h-8 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                                                            <SelectContent>{employees.map((emp) => (<SelectItem key={emp.id} value={emp.id.toString()}>{emp.employee_name}</SelectItem>))}</SelectContent>
                                                        </Select>
                                                    </td>
                                                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">{reading.net_reading.toFixed(2)}</td>
                                                    <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">{reading.total_sale.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-50 dark:bg-gray-700 font-semibold">
                                            <td colSpan={10} className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-right text-sm text-gray-900 dark:text-white">Total Sales:</td>
                                            <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">{totalSalesSum.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="mb-10">
                                <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Product-wise Summary</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-gray-200 dark:border-gray-600">
                                        <thead>
                                            <tr className="bg-gray-50 dark:bg-gray-700">
                                                <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Product ID</th>
                                                <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Product Name</th>
                                                <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Rate</th>
                                                <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Reading</th>
                                                <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Total Sale</th>
                                                <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Credit Sales</th>
                                                <th className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200">Cash Sales</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(productWiseData).map(([productId, productData]) => {
                                                const productInfo = dispenserReading.find(d => d.product_id?.toString() === productId);
                                                const cashSales = productData.total_sale - productData.credit_sales;
                                                return (
                                                    <tr key={productId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">{productId}</td>
                                                        <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">{productInfo?.product?.product_name || 'No Product Assigned'}</td>
                                                        <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">{productInfo?.product?.sales_price || 0}</td>
                                                        <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">{productData.net_reading.toFixed(2)}</td>
                                                        <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">{productData.total_sale.toFixed(2)}</td>
                                                        <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">{productData.credit_sales.toFixed(2)}</td>
                                                        <td className="border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-900 dark:text-white">{cashSales.toFixed(2)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                                <Button type="submit" disabled={processing} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md">
                                    {processing ? 'Processing...' : 'Close Shift'}
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                </Card>

                <FormModal
                    isOpen={isCreditSalesOpen}
                    onClose={() => {
                        setIsCreditSalesOpen(false);
                        setCreditSalesData({
                            sale_date: '',
                            invoice_no: '',
                            shift_id: '',
                            remarks: '',
                            products: [{ product_id: '', customer_id: '', vehicle_id: '', quantity: '', amount: '', discount: '', due_amount: '' }]
                        });
                    }}
                    title="Credit Sales"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const validProducts = creditSalesData.products.filter(p => p.product_id && p.customer_id && p.vehicle_id && p.quantity);
                        if (validProducts.length === 0) {
                            alert('Please add at least one product to cart');
                            return;
                        }
                        setCreditProcessing(true);
                        router.post('/credit-sales', { ...creditSalesData, products: validProducts }, {
                            onSuccess: () => {
                                setIsCreditSalesOpen(false);
                                setCreditSalesData({ sale_date: '', invoice_no: '', shift_id: '', remarks: '', products: [{ product_id: '', customer_id: '', vehicle_id: '', quantity: '', amount: '', discount: '', due_amount: '' }] });
                                setCreditProcessing(false);
                                if (data.transaction_date && data.shift_id) {
                                    fetchShiftData(data.transaction_date, data.shift_id);
                                }
                            },
                            onError: () => setCreditProcessing(false)
                        });
                    }}
                    processing={creditProcessing}
                    submitText="Create Sale"
                    className="max-w-[80vw]"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-8 gap-4">
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Sale Date <span className="text-red-500">*</span></Label>
                                <Input type="date" value={creditSalesData.sale_date} onChange={(e) => setCreditSalesData(prev => ({ ...prev, sale_date: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Invoice No <span className="text-red-500">*</span></Label>
                                <Input value={creditSalesData.invoice_no} onChange={(e) => setCreditSalesData(prev => ({ ...prev, invoice_no: e.target.value }))} placeholder="Enter invoice number" className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Shift <span className="text-red-500">*</span></Label>
                                <Select value={creditSalesData.shift_id} onValueChange={(value) => setCreditSalesData(prev => ({ ...prev, shift_id: value }))}>
                                    <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                                    <SelectContent>{availableShifts.map((shift) => (<SelectItem key={shift.id} value={shift.id.toString()}>{shift.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Customer <span className="text-red-500">*</span></Label>
                                <Select value={creditSalesData.products[0]?.customer_id || ''} onValueChange={(value) => {
                                    const newProducts = [...creditSalesData.products];
                                    newProducts[0] = { ...newProducts[0], customer_id: value };
                                    setCreditSalesData(prev => ({ ...prev, products: newProducts }));
                                }}>
                                    <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                                    <SelectContent>{customers.map((customer) => (<SelectItem key={customer.id} value={customer.id.toString()}>{customer.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Vehicle <span className="text-red-500">*</span></Label>
                                <Select value={creditSalesData.products[0]?.vehicle_id || ''} onValueChange={(value) => {
                                    const selectedVehicle = vehicles.find(v => v.id.toString() === value);
                                    const newProducts = [...creditSalesData.products];
                                    newProducts[0] = { ...newProducts[0], vehicle_id: value, customer_id: selectedVehicle?.customer_id.toString() || '', product_id: selectedVehicle?.product_id.toString() || '' };
                                    setCreditSalesData(prev => ({ ...prev, products: newProducts }));
                                }}>
                                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                                    <SelectContent>{vehicles.filter(v => !creditSalesData.products[0]?.customer_id || v.customer_id.toString() === creditSalesData.products[0]?.customer_id).map((vehicle) => (<SelectItem key={vehicle.id} value={vehicle.id.toString()}>{vehicle.vehicle_number}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Product</Label>
                                <Select value={creditSalesData.products[0]?.product_id || ''} onValueChange={(value) => {
                                    const selectedProduct = products.find(p => p.id.toString() === value);
                                    const quantity = parseFloat(creditSalesData.products[0]?.quantity) || 0;
                                    const amount = (selectedProduct?.sales_price || 0) * quantity;
                                    const discount = parseFloat(creditSalesData.products[0]?.discount) || 0;
                                    const newProducts = [...creditSalesData.products];
                                    newProducts[0] = { ...newProducts[0], product_id: value, amount: amount.toString(), due_amount: (amount - discount).toFixed(2) };
                                    setCreditSalesData(prev => ({ ...prev, products: newProducts }));
                                }}>
                                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                                    <SelectContent>{products.map((product) => (<SelectItem key={product.id} value={product.id.toString()}>{product.product_name} ({product.product_code})</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Present Stock</Label>
                                <Input type="number" value={products.find(p => p.id.toString() === creditSalesData.products[0]?.product_id)?.stock?.current_stock || '0'} readOnly className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Code</Label>
                                <Input value={products.find(p => p.id.toString() === creditSalesData.products[0]?.product_id)?.product_code || ''} readOnly className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-8 gap-4">
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Unit Name</Label>
                                <Input value={products.find(p => p.id.toString() === creditSalesData.products[0]?.product_id)?.unit?.name || ''} readOnly className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Sales Price</Label>
                                <Input type="number" step="0.01" value={products.find(p => p.id.toString() === creditSalesData.products[0]?.product_id)?.sales_price || ''} readOnly className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Quantity</Label>
                                <Input type="number" step="0.01" value={creditSalesData.products[0]?.quantity || ''} onChange={(e) => {
                                    const selectedProduct = products.find(p => p.id.toString() === creditSalesData.products[0]?.product_id);
                                    const quantity = parseFloat(e.target.value) || 0;
                                    const amount = (selectedProduct?.sales_price || 0) * quantity;
                                    const discount = parseFloat(creditSalesData.products[0]?.discount) || 0;
                                    const newProducts = [...creditSalesData.products];
                                    newProducts[0] = { ...newProducts[0], quantity: e.target.value, amount: amount.toString(), due_amount: (amount - discount).toFixed(2) };
                                    setCreditSalesData(prev => ({ ...prev, products: newProducts }));
                                }} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Amount</Label>
                                <Input type="number" step="0.01" value={creditSalesData.products[0]?.amount || ''} onChange={(e) => {
                                    const selectedProduct = products.find(p => p.id.toString() === creditSalesData.products[0]?.product_id);
                                    const amount = parseFloat(e.target.value) || 0;
                                    const quantity = (selectedProduct?.sales_price || 0) > 0 ? amount / (selectedProduct?.sales_price || 1) : 0;
                                    const discount = parseFloat(creditSalesData.products[0]?.discount) || 0;
                                    const newProducts = [...creditSalesData.products];
                                    newProducts[0] = { ...newProducts[0], amount: e.target.value, quantity: quantity.toFixed(2), due_amount: (amount - discount).toFixed(2) };
                                    setCreditSalesData(prev => ({ ...prev, products: newProducts }));
                                }} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Discount Type</Label>
                                <Select value="Fixed"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Fixed">Fixed</SelectItem></SelectContent></Select>
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Percentage</Label>
                                <Input type="number" value="0" readOnly className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Discount</Label>
                                <Input type="number" step="0.01" value={creditSalesData.products[0]?.discount || ''} onChange={(e) => {
                                    const amount = parseFloat(creditSalesData.products[0]?.amount) || 0;
                                    const discount = parseFloat(e.target.value) || 0;
                                    const newProducts = [...creditSalesData.products];
                                    newProducts[0] = { ...newProducts[0], discount: e.target.value, due_amount: (amount - discount).toFixed(2) };
                                    setCreditSalesData(prev => ({ ...prev, products: newProducts }));
                                }} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Total Amount</Label>
                                <Input type="number" step="0.01" value={creditSalesData.products[0]?.due_amount || ''} readOnly className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-10">
                                <Label className="text-sm font-medium dark:text-gray-200">Remarks</Label>
                                <Input value={creditSalesData.remarks} onChange={(e) => setCreditSalesData(prev => ({ ...prev, remarks: e.target.value }))} placeholder="Enter any remarks" className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="col-span-2 flex flex-col justify-end">
                                <Button type="button" onClick={() => {
                                    const firstProduct = creditSalesData.products[0];
                                    if (!firstProduct.product_id || !firstProduct.customer_id || !firstProduct.vehicle_id || !firstProduct.quantity) {
                                        alert('Please fill product, customer, vehicle and quantity');
                                        return;
                                    }
                                    setCreditSalesData(prev => ({ ...prev, products: [{ product_id: '', customer_id: '', vehicle_id: '', quantity: '', amount: '', discount: '', due_amount: '' }, ...prev.products] }));
                                }} className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="h-4 w-4 mr-1" />Add to Cart
                                </Button>
                            </div>
                        </div>
                        <div className="mt-6">
                            <table className="w-full border border-gray-300 dark:border-gray-600">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">SL</th>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Customer</th>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Vehicle</th>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Product Name</th>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Quantity</th>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Discount</th>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Total</th>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {creditSalesData.products.slice(1).filter(p => p.product_id).map((product, index) => {
                                        const selectedProduct = products.find(p => p.id.toString() === product.product_id);
                                        const selectedCustomer = customers.find(c => c.id.toString() === product.customer_id);
                                        const selectedVehicle = vehicles.find(v => v.id.toString() === product.vehicle_id);
                                        return (
                                            <tr key={index} className="border-t dark:border-gray-600">
                                                <td className="p-2 text-sm dark:text-white">{index + 1}</td>
                                                <td className="p-2 text-sm dark:text-white">{selectedCustomer?.name || '-'}</td>
                                                <td className="p-2 text-sm dark:text-white">{selectedVehicle?.vehicle_number || '-'}</td>
                                                <td className="p-2 text-sm dark:text-white">{selectedProduct?.product_name}</td>
                                                <td className="p-2 text-sm dark:text-white">{product.quantity}</td>
                                                <td className="p-2 text-sm dark:text-white">{product.discount || '0'}</td>
                                                <td className="p-2 text-sm dark:text-white">{product.due_amount || '0'}</td>
                                                <td className="p-2">
                                                    <div className="flex gap-2">
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => {
                                                            const editProduct = creditSalesData.products[index + 1];
                                                            const newProducts = creditSalesData.products.filter((_, i) => i !== index + 1);
                                                            newProducts[0] = editProduct;
                                                            setCreditSalesData(prev => ({ ...prev, products: newProducts }));
                                                        }} className="text-indigo-600 hover:text-indigo-800">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button type="button" variant="destructive" size="sm" onClick={() => {
                                                            const newProducts = creditSalesData.products.filter((_, i) => i !== index + 1);
                                                            setCreditSalesData(prev => ({ ...prev, products: newProducts }));
                                                        }}>
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

                <FormModal
                    isOpen={isBankSalesOpen}
                    onClose={() => {
                        setIsBankSalesOpen(false);
                        setBankSalesData({
                            sale_date: '',
                            invoice_no: '',
                            shift_id: '',
                            remarks: '',
                            products: [{ product_id: '', customer: '', vehicle_no: '', quantity: '', amount: '', discount_type: 'Fixed', discount: '', payment_type: 'Bank', to_account_id: '', paid_amount: '', due_amount: '', bank_type: '', bank_name: '', cheque_no: '', cheque_date: '', branch_name: '', account_no: '', mobile_bank: '', mobile_number: '' }]
                        });
                    }}
                    title="Bank Sales"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const validProducts = bankSalesData.products.filter(p => p.product_id && p.customer && p.vehicle_no && p.quantity);
                        if (validProducts.length === 0) {
                            alert('Please add at least one product to cart');
                            return;
                        }
                        setBankProcessing(true);
                        router.post('/sales', { ...bankSalesData, products: validProducts }, {
                            onSuccess: () => {
                                setIsBankSalesOpen(false);
                                setBankSalesData({ sale_date: '', invoice_no: '', shift_id: '', remarks: '', products: [{ product_id: '', customer: '', vehicle_no: '', quantity: '', amount: '', discount_type: 'Fixed', discount: '', payment_type: 'Bank', to_account_id: '', paid_amount: '', due_amount: '', bank_type: '', bank_name: '', cheque_no: '', cheque_date: '', branch_name: '', account_no: '', mobile_bank: '', mobile_number: '' }] });
                                setBankProcessing(false);
                                if (data.transaction_date && data.shift_id) {
                                    fetchShiftData(data.transaction_date, data.shift_id);
                                }
                            },
                            onError: () => setBankProcessing(false)
                        });
                    }}
                    processing={bankProcessing}
                    submitText="Create Sale"
                    className="max-w-[80vw]"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-8 gap-4">
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Sale Date <span className="text-red-500">*</span></Label>
                                <Input type="date" value={bankSalesData.sale_date} onChange={(e) => setBankSalesData(prev => ({ ...prev, sale_date: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Invoice No <span className="text-red-500">*</span></Label>
                                <Input value={bankSalesData.invoice_no} onChange={(e) => setBankSalesData(prev => ({ ...prev, invoice_no: e.target.value }))} placeholder="Enter invoice number" className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Shift <span className="text-red-500">*</span></Label>
                                <Select value={bankSalesData.shift_id} onValueChange={(value) => setBankSalesData(prev => ({ ...prev, shift_id: value }))}>
                                    <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                                    <SelectContent>{availableShifts.map((shift) => (<SelectItem key={shift.id} value={shift.id.toString()}>{shift.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Customer <span className="text-red-500">*</span></Label>
                                <Input list="bank-customers-list" value={bankSalesData.products[0]?.customer || ''} onChange={(e) => {
                                    const newProducts = [...bankSalesData.products];
                                    newProducts[0] = { ...newProducts[0], customer: e.target.value };
                                    setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                }} placeholder="Type customer name" className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                <datalist id="bank-customers-list">
                                    {customers.map((customer) => (<option key={customer.id} value={customer.name} />))}
                                </datalist>
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Vehicle <span className="text-red-500">*</span></Label>
                                <Input list="bank-vehicles-list" value={bankSalesData.products[0]?.vehicle_no || ''} onChange={(e) => {
                                    const newProducts = [...bankSalesData.products];
                                    newProducts[0] = { ...newProducts[0], vehicle_no: e.target.value };
                                    setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                }} onBlur={(e) => {
                                    const vehicle = vehicles.find(v => v.vehicle_number === e.target.value);
                                    if (vehicle) {
                                        const customer = customers.find(c => c.id === vehicle.customer_id);
                                        const newProducts = [...bankSalesData.products];
                                        newProducts[0].customer = customer?.name || '';
                                        if (vehicle.product_id) {
                                            newProducts[0].product_id = vehicle.product_id.toString();
                                            const selectedProduct = products.find(p => p.id === vehicle.product_id);
                                            if (selectedProduct && selectedProduct.sales_price) {
                                                const quantity = parseFloat(newProducts[0].quantity) || 0;
                                                newProducts[0].amount = (selectedProduct.sales_price * quantity).toString();
                                            }
                                        }
                                        setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                    }
                                }} placeholder="Type vehicle number" className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                <datalist id="bank-vehicles-list">
                                    {vehicles.map((vehicle) => (<option key={vehicle.id} value={vehicle.vehicle_number} />))}
                                </datalist>
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Product</Label>
                                <Select value={bankSalesData.products[0]?.product_id || ''} onValueChange={(value) => {
                                    const selectedProduct = products.find(p => p.id.toString() === value);
                                    const quantity = parseFloat(bankSalesData.products[0]?.quantity) || 0;
                                    const amount = (selectedProduct?.sales_price || 0) * quantity;
                                    const discount = parseFloat(bankSalesData.products[0]?.discount) || 0;
                                    const newProducts = [...bankSalesData.products];
                                    newProducts[0] = { ...newProducts[0], product_id: value, amount: amount.toString(), paid_amount: (amount - discount).toFixed(2), due_amount: '0.00' };
                                    setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                }}>
                                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                                    <SelectContent>{products.map((product) => (<SelectItem key={product.id} value={product.id.toString()}>{product.product_name} ({product.product_code})</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Present Stock</Label>
                                <Input type="number" value={products.find(p => p.id.toString() === bankSalesData.products[0]?.product_id)?.stock?.current_stock || '0'} readOnly className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Code</Label>
                                <Input value={products.find(p => p.id.toString() === bankSalesData.products[0]?.product_id)?.product_code || ''} readOnly className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-4">
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Unit Name</Label>
                                <Input value={products.find(p => p.id.toString() === bankSalesData.products[0]?.product_id)?.unit?.name || ''} readOnly className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Sales Price</Label>
                                <Input type="number" step="0.01" value={products.find(p => p.id.toString() === bankSalesData.products[0]?.product_id)?.sales_price || ''} readOnly className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Quantity</Label>
                                <Input type="number" step="0.01" value={bankSalesData.products[0]?.quantity || ''} onChange={(e) => {
                                    const selectedProduct = products.find(p => p.id.toString() === bankSalesData.products[0]?.product_id);
                                    const quantity = parseFloat(e.target.value) || 0;
                                    const amount = (selectedProduct?.sales_price || 0) * quantity;
                                    const discount = parseFloat(bankSalesData.products[0]?.discount) || 0;
                                    const newProducts = [...bankSalesData.products];
                                    newProducts[0] = { ...newProducts[0], quantity: e.target.value, amount: amount.toString(), paid_amount: (amount - discount).toFixed(2), due_amount: '0.00' };
                                    setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                }} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Amount</Label>
                                <Input type="number" step="0.01" value={bankSalesData.products[0]?.amount || ''} onChange={(e) => {
                                    const selectedProduct = products.find(p => p.id.toString() === bankSalesData.products[0]?.product_id);
                                    const amount = parseFloat(e.target.value) || 0;
                                    const quantity = (selectedProduct?.sales_price || 0) > 0 ? amount / (selectedProduct?.sales_price || 1) : 0;
                                    const discount = parseFloat(bankSalesData.products[0]?.discount) || 0;
                                    const newProducts = [...bankSalesData.products];
                                    newProducts[0] = { ...newProducts[0], amount: e.target.value, quantity: quantity.toFixed(2), paid_amount: (amount - discount).toFixed(2), due_amount: '0.00' };
                                    setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                }} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Discount Type</Label>
                                <Select value={bankSalesData.products[0]?.discount_type || 'Fixed'} onValueChange={(value) => {
                                    const newProducts = [...bankSalesData.products];
                                    newProducts[0] = { ...newProducts[0], discount_type: value };
                                    setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                }}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent><SelectItem value="Fixed">Fixed</SelectItem><SelectItem value="Percentage">Percentage</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Percentage</Label>
                                <Input type="number" value="0" readOnly className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Discount</Label>
                                <Input type="number" step="0.01" value={bankSalesData.products[0]?.discount || ''} onChange={(e) => {
                                    const amount = parseFloat(bankSalesData.products[0]?.amount) || 0;
                                    const discount = parseFloat(e.target.value) || 0;
                                    const newProducts = [...bankSalesData.products];
                                    newProducts[0] = { ...newProducts[0], discount: e.target.value, paid_amount: (amount - discount).toFixed(2), due_amount: '0.00' };
                                    setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                }} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                        </div>
                        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${bankSalesData.products[0]?.payment_type === 'Bank' ? (bankSalesData.products[0]?.bank_type === 'Cheque' ? 6 : 5) : bankSalesData.products[0]?.payment_type === 'Mobile Bank' ? 5 : 3}, minmax(0, 1fr))` }}>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Payment Method</Label>
                                <Select value={bankSalesData.products[0]?.payment_type || 'Bank'} onValueChange={(value) => {
                                    const newProducts = [...bankSalesData.products];
                                    newProducts[0] = { ...newProducts[0], payment_type: value, to_account_id: '' };
                                    setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                }}>
                                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Select payment method" /></SelectTrigger>
                                    <SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Bank">Bank</SelectItem><SelectItem value="Mobile Bank">Mobile Bank</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">To Account</Label>
                                <Select value={bankSalesData.products[0]?.to_account_id || ''} onValueChange={(value) => {
                                    const newProducts = [...bankSalesData.products];
                                    newProducts[0] = { ...newProducts[0], to_account_id: value };
                                    setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                }}>
                                    <SelectTrigger><SelectValue placeholder="Select payment account" /></SelectTrigger>
                                    <SelectContent>{(bankSalesData.products[0]?.payment_type === 'Cash' ? (groupedAccounts['Cash in hand'] || groupedAccounts['Cash'] || []) : bankSalesData.products[0]?.payment_type === 'Bank' ? (groupedAccounts['Bank Account'] || groupedAccounts['Bank'] || []) : bankSalesData.products[0]?.payment_type === 'Mobile Bank' ? (groupedAccounts['Mobile Bank'] || []) : []).map((account) => (<SelectItem key={account.id} value={account.id.toString()}>{account.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            {bankSalesData.products[0]?.payment_type === 'Bank' && (
                                <>
                                    <div>
                                        <Label className="text-sm font-medium dark:text-gray-200">Bank Type</Label>
                                        <Select value={bankSalesData.products[0]?.bank_type || ''} onValueChange={(value) => {
                                            const newProducts = [...bankSalesData.products];
                                            newProducts[0] = { ...newProducts[0], bank_type: value };
                                            setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                        }}>
                                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                            <SelectContent><SelectItem value="Cheque">Cheque</SelectItem><SelectItem value="Cash Deposit">Cash Deposit</SelectItem><SelectItem value="Online">Online</SelectItem><SelectItem value="CHT">CHT</SelectItem><SelectItem value="RTGS">RTGS</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium dark:text-gray-200">Bank Name</Label>
                                        <Input value={bankSalesData.products[0]?.bank_name || ''} onChange={(e) => {
                                            const newProducts = [...bankSalesData.products];
                                            newProducts[0] = { ...newProducts[0], bank_name: e.target.value };
                                            setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                        }} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                    </div>
                                    {bankSalesData.products[0]?.bank_type === 'Cheque' && (
                                        <div>
                                            <Label className="text-sm font-medium dark:text-gray-200">Cheque No</Label>
                                            <Input value={bankSalesData.products[0]?.cheque_no || ''} onChange={(e) => {
                                                const newProducts = [...bankSalesData.products];
                                                newProducts[0] = { ...newProducts[0], cheque_no: e.target.value };
                                                setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                            }} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                        </div>
                                    )}
                                </>
                            )}
                            {bankSalesData.products[0]?.payment_type === 'Mobile Bank' && (
                                <>
                                    <div>
                                        <Label className="text-sm font-medium dark:text-gray-200">Mobile Bank</Label>
                                        <Select value={bankSalesData.products[0]?.mobile_bank || ''} onValueChange={(value) => {
                                            const newProducts = [...bankSalesData.products];
                                            newProducts[0] = { ...newProducts[0], mobile_bank: value };
                                            setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                        }}>
                                            <SelectTrigger><SelectValue placeholder="Select mobile bank" /></SelectTrigger>
                                            <SelectContent><SelectItem value="bKash">bKash</SelectItem><SelectItem value="Nagad">Nagad</SelectItem><SelectItem value="Rocket">Rocket</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium dark:text-gray-200">Mobile Number</Label>
                                        <Input value={bankSalesData.products[0]?.mobile_number || ''} onChange={(e) => {
                                            const newProducts = [...bankSalesData.products];
                                            newProducts[0] = { ...newProducts[0], mobile_number: e.target.value };
                                            setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                        }} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                    </div>
                                </>
                            )}
                            <div>
                                <Label className="text-sm font-medium dark:text-gray-200">Paid Amount <span className="text-red-500">*</span></Label>
                                <Input type="number" step="0.01" value={bankSalesData.products[0]?.paid_amount || ''} readOnly className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-10">
                                <Label className="text-sm font-medium dark:text-gray-200">Remarks</Label>
                                <Input value={bankSalesData.remarks} onChange={(e) => setBankSalesData(prev => ({ ...prev, remarks: e.target.value }))} placeholder="Enter any remarks" className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </div>
                            <div className="col-span-2 flex flex-col justify-end">
                                <Button type="button" onClick={() => {
                                    const firstProduct = bankSalesData.products[0];
                                    if (!firstProduct.product_id || !firstProduct.customer || !firstProduct.vehicle_no || !firstProduct.quantity) {
                                        alert('Please fill product, customer, vehicle and quantity');
                                        return;
                                    }
                                    setBankSalesData(prev => ({ ...prev, products: [{ product_id: '', customer: '', vehicle_no: '', quantity: '', amount: '', discount_type: 'Fixed', discount: '', payment_type: 'Bank', to_account_id: '', paid_amount: '', due_amount: '', bank_type: '', bank_name: '', cheque_no: '', cheque_date: '', branch_name: '', account_no: '', mobile_bank: '', mobile_number: '' }, ...prev.products] }));
                                }} className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="h-4 w-4 mr-1" />Add to Cart
                                </Button>
                            </div>
                        </div>
                        <div className="mt-6">
                            <table className="w-full border border-gray-300 dark:border-gray-600">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">SL</th>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Customer</th>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Vehicle</th>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Product Name</th>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Quantity</th>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Discount</th>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Total</th>
                                        <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bankSalesData.products.slice(1).filter(p => p.product_id).map((product, index) => {
                                        const selectedProduct = products.find(p => p.id.toString() === product.product_id);
                                        return (
                                            <tr key={index} className="border-t dark:border-gray-600">
                                                <td className="p-2 text-sm dark:text-white">{index + 1}</td>
                                                <td className="p-2 text-sm dark:text-white">{product.customer || '-'}</td>
                                                <td className="p-2 text-sm dark:text-white">{product.vehicle_no || '-'}</td>
                                                <td className="p-2 text-sm dark:text-white">{selectedProduct?.product_name}</td>
                                                <td className="p-2 text-sm dark:text-white">{product.quantity}</td>
                                                <td className="p-2 text-sm dark:text-white">{product.discount || '0'}</td>
                                                <td className="p-2 text-sm dark:text-white">{product.paid_amount || '0'}</td>
                                                <td className="p-2">
                                                    <div className="flex gap-2">
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => {
                                                            const editProduct = bankSalesData.products[index + 1];
                                                            const newProducts = bankSalesData.products.filter((_, i) => i !== index + 1);
                                                            newProducts[0] = editProduct;
                                                            setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                                        }} className="text-indigo-600 hover:text-indigo-800">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button type="button" variant="destructive" size="sm" onClick={() => {
                                                            const newProducts = bankSalesData.products.filter((_, i) => i !== index + 1);
                                                            setBankSalesData(prev => ({ ...prev, products: newProducts }));
                                                        }}>
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

                <FormModal
                    isOpen={isCashReceiveOpen}
                    onClose={() => {
                        setIsCashReceiveOpen(false);
                        setCashReceiveData({ date: '', shift_id: '', from_account_id: '', to_account_id: '', amount: '', payment_type: 'Cash', bank_type: '', cheque_no: '', cheque_date: '', bank_name: '', branch_name: '', account_no: '', mobile_bank: '', mobile_number: '', remarks: '' });
                    }}
                    title="Cash Receive"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setCashReceiveProcessing(true);
                        router.post('/vouchers/received', cashReceiveData, {
                            onSuccess: () => {
                                setIsCashReceiveOpen(false);
                                setCashReceiveData({ date: '', shift_id: '', from_account_id: '', to_account_id: '', amount: '', payment_type: 'Cash', bank_type: '', cheque_no: '', cheque_date: '', bank_name: '', branch_name: '', account_no: '', mobile_bank: '', mobile_number: '', remarks: '' });
                                setCashReceiveProcessing(false);
                                if (data.transaction_date && data.shift_id) {
                                    fetchShiftData(data.transaction_date, data.shift_id);
                                }
                            },
                            onError: () => setCashReceiveProcessing(false)
                        });
                    }}
                    processing={cashReceiveProcessing}
                    submitText="Create"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="date" className="dark:text-gray-200">Date</Label>
                            <Input id="date" type="date" value={cashReceiveData.date} onChange={(e) => setCashReceiveData(prev => ({ ...prev, date: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div>
                            <Label htmlFor="shift_id" className="dark:text-gray-200">Shift</Label>
                            <Select value={cashReceiveData.shift_id} onValueChange={(value) => setCashReceiveData(prev => ({ ...prev, shift_id: value }))}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Choose shift" /></SelectTrigger>
                                <SelectContent>{availableShifts.map((shift) => (<SelectItem key={shift.id} value={shift.id.toString()}>{shift.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="payment_type" className="dark:text-gray-200">Payment Type</Label>
                        <Select value={cashReceiveData.payment_type} onValueChange={(value) => setCashReceiveData(prev => ({ ...prev, payment_type: value, from_account_id: '' }))}>
                            <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Choose payment method" /></SelectTrigger>
                            <SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Bank">Bank</SelectItem><SelectItem value="Mobile Bank">Mobile Bank</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="to_account_id" className="dark:text-gray-200">Received From</Label>
                            <Select value={cashReceiveData.to_account_id} onValueChange={(value) => setCashReceiveData(prev => ({ ...prev, to_account_id: value }))}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Choose received from account" /></SelectTrigger>
                                <SelectContent>{accounts.map((account) => (<SelectItem key={account.id} value={account.id.toString()}>{account.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="from_account_id" className="dark:text-gray-200">To Account</Label>
                            <Select value={cashReceiveData.from_account_id} onValueChange={(value) => setCashReceiveData(prev => ({ ...prev, from_account_id: value }))}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Choose destination account" /></SelectTrigger>
                                <SelectContent>{(cashReceiveData.payment_type === 'Cash' ? (groupedAccounts['Cash in hand'] || groupedAccounts['Cash'] || []) : cashReceiveData.payment_type === 'Bank' ? (groupedAccounts['Bank Account'] || groupedAccounts['Bank'] || []) : cashReceiveData.payment_type === 'Mobile Bank' ? (groupedAccounts['Mobile Bank'] || []) : []).map((account) => (<SelectItem key={account.id} value={account.id.toString()}>{account.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    {cashReceiveData.payment_type === 'Bank' && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium dark:text-white">Bank Payment Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="bank_type" className="dark:text-gray-200">Bank Type</Label>
                                    <Select value={cashReceiveData.bank_type} onValueChange={(value) => setCashReceiveData(prev => ({ ...prev, bank_type: value }))}>
                                        <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent><SelectItem value="Cheque">Cheque</SelectItem><SelectItem value="Cash Deposit">Cash Deposit</SelectItem><SelectItem value="Online">Online</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="bank_name" className="dark:text-gray-200">Bank Name</Label>
                                    <Input id="bank_name" value={cashReceiveData.bank_name} onChange={(e) => setCashReceiveData(prev => ({ ...prev, bank_name: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                </div>
                            </div>
                            {cashReceiveData.bank_type === 'Cheque' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="cheque_no" className="dark:text-gray-200">Cheque No</Label>
                                        <Input id="cheque_no" value={cashReceiveData.cheque_no} onChange={(e) => setCashReceiveData(prev => ({ ...prev, cheque_no: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                    </div>
                                    <div>
                                        <Label htmlFor="cheque_date" className="dark:text-gray-200">Cheque Date</Label>
                                        <Input id="cheque_date" type="date" value={cashReceiveData.cheque_date} onChange={(e) => setCashReceiveData(prev => ({ ...prev, cheque_date: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {cashReceiveData.payment_type === 'Mobile Bank' && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium dark:text-white">Mobile Bank Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="mobile_bank" className="dark:text-gray-200">Mobile Bank</Label>
                                    <Select value={cashReceiveData.mobile_bank} onValueChange={(value) => setCashReceiveData(prev => ({ ...prev, mobile_bank: value }))}>
                                        <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Select mobile bank" /></SelectTrigger>
                                        <SelectContent><SelectItem value="bKash">bKash</SelectItem><SelectItem value="Nagad">Nagad</SelectItem><SelectItem value="Rocket">Rocket</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="mobile_number" className="dark:text-gray-200">Mobile Number</Label>
                                    <Input id="mobile_number" value={cashReceiveData.mobile_number} onChange={(e) => setCashReceiveData(prev => ({ ...prev, mobile_number: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div>
                        <Label htmlFor="amount" className="dark:text-gray-200">Amount</Label>
                        <Input id="amount" type="number" step="0.01" placeholder="Enter amount" value={cashReceiveData.amount} onChange={(e) => setCashReceiveData(prev => ({ ...prev, amount: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                        <Label htmlFor="remarks" className="dark:text-gray-200">Remarks</Label>
                        <Input id="remarks" placeholder="Enter remarks (optional)" value={cashReceiveData.remarks} onChange={(e) => setCashReceiveData(prev => ({ ...prev, remarks: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    </div>
                </FormModal>

                <FormModal
                    isOpen={isCashPaymentOpen}
                    onClose={() => {
                        setIsCashPaymentOpen(false);
                        setCashPaymentData({ date: '', shift_id: '', from_account_id: '', to_account_id: '', amount: '', payment_type: 'Cash', bank_type: '', bank_name: '', cheque_no: '', cheque_date: '', account_no: '', branch_name: '', mobile_bank: '', mobile_number: '', remarks: '' });
                    }}
                    title="Cash Payment"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setCashPaymentProcessing(true);
                        router.post('/vouchers/payment', cashPaymentData, {
                            onSuccess: () => {
                                setIsCashPaymentOpen(false);
                                setCashPaymentData({ date: '', shift_id: '', from_account_id: '', to_account_id: '', amount: '', payment_type: 'Cash', bank_type: '', bank_name: '', cheque_no: '', cheque_date: '', account_no: '', branch_name: '', mobile_bank: '', mobile_number: '', remarks: '' });
                                setCashPaymentProcessing(false);
                                if (data.transaction_date && data.shift_id) {
                                    fetchShiftData(data.transaction_date, data.shift_id);
                                }
                            },
                            onError: () => setCashPaymentProcessing(false)
                        });
                    }}
                    processing={cashPaymentProcessing}
                    submitText="Create"
                    className="max-w-lg"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="date" className="dark:text-gray-200">Date</Label>
                            <Input id="date" type="date" value={cashPaymentData.date} onChange={(e) => setCashPaymentData(prev => ({ ...prev, date: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div>
                            <Label htmlFor="shift_id" className="dark:text-gray-200">Shift</Label>
                            <Select value={cashPaymentData.shift_id} onValueChange={(value) => setCashPaymentData(prev => ({ ...prev, shift_id: value }))}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Choose shift" /></SelectTrigger>
                                <SelectContent>{availableShifts.map((shift) => (<SelectItem key={shift.id} value={shift.id.toString()}>{shift.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="payment_type" className="dark:text-gray-200">Payment Type</Label>
                        <Select value={cashPaymentData.payment_type} onValueChange={(value) => setCashPaymentData(prev => ({ ...prev, payment_type: value, from_account_id: '' }))}>
                            <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Choose payment method" /></SelectTrigger>
                            <SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Bank">Bank</SelectItem><SelectItem value="Mobile Bank">Mobile Bank</SelectItem></SelectContent>
                        </Select>
                    </div>
                    {cashPaymentData.payment_type === 'Bank' && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium dark:text-white">Bank Payment Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="bank_type" className="dark:text-gray-200">Bank Type</Label>
                                    <Select value={cashPaymentData.bank_type} onValueChange={(value) => setCashPaymentData(prev => ({ ...prev, bank_type: value }))}>
                                        <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Choose bank type" /></SelectTrigger>
                                        <SelectContent><SelectItem value="Cheque">Cheque</SelectItem><SelectItem value="Cash Deposit">Cash Deposit</SelectItem><SelectItem value="Online">Online</SelectItem><SelectItem value="CHT">CHT</SelectItem><SelectItem value="RTGS">RTGS</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="bank_name" className="dark:text-gray-200">Bank Name</Label>
                                    <Input id="bank_name" placeholder="Enter bank name" value={cashPaymentData.bank_name} onChange={(e) => setCashPaymentData(prev => ({ ...prev, bank_name: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="branch_name" className="dark:text-gray-200">Branch Name</Label>
                                    <Input id="branch_name" placeholder="Enter branch name" value={cashPaymentData.branch_name} onChange={(e) => setCashPaymentData(prev => ({ ...prev, branch_name: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <Label htmlFor="account_no" className="dark:text-gray-200">Account Number</Label>
                                    <Input id="account_no" placeholder="Enter account number" value={cashPaymentData.account_no} onChange={(e) => setCashPaymentData(prev => ({ ...prev, account_no: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                </div>
                            </div>
                            {cashPaymentData.bank_type === 'Cheque' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="cheque_no" className="dark:text-gray-200">Cheque Number</Label>
                                        <Input id="cheque_no" placeholder="Enter cheque number" value={cashPaymentData.cheque_no} onChange={(e) => setCashPaymentData(prev => ({ ...prev, cheque_no: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                    </div>
                                    <div>
                                        <Label htmlFor="cheque_date" className="dark:text-gray-200">Cheque Date</Label>
                                        <Input id="cheque_date" type="date" value={cashPaymentData.cheque_date} onChange={(e) => setCashPaymentData(prev => ({ ...prev, cheque_date: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {cashPaymentData.payment_type === 'Mobile Bank' && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium dark:text-white">Mobile Bank Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="mobile_bank" className="dark:text-gray-200">Mobile Bank</Label>
                                    <Select value={cashPaymentData.mobile_bank} onValueChange={(value) => setCashPaymentData(prev => ({ ...prev, mobile_bank: value }))}>
                                        <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Choose mobile bank" /></SelectTrigger>
                                        <SelectContent><SelectItem value="bKash">bKash</SelectItem><SelectItem value="Nagad">Nagad</SelectItem><SelectItem value="Rocket">Rocket</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="mobile_number" className="dark:text-gray-200">Mobile Number</Label>
                                    <Input id="mobile_number" placeholder="Enter mobile number" value={cashPaymentData.mobile_number} onChange={(e) => setCashPaymentData(prev => ({ ...prev, mobile_number: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="from_account_id" className="dark:text-gray-200">From Account</Label>
                            <Select value={cashPaymentData.from_account_id} onValueChange={(value) => setCashPaymentData(prev => ({ ...prev, from_account_id: value }))}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Choose source account" /></SelectTrigger>
                                <SelectContent>{(cashPaymentData.payment_type === 'Cash' ? (groupedAccounts['Cash in hand'] || groupedAccounts['Cash'] || []) : cashPaymentData.payment_type === 'Bank' ? (groupedAccounts['Bank Account'] || groupedAccounts['Bank'] || []) : cashPaymentData.payment_type === 'Mobile Bank' ? (groupedAccounts['Mobile Bank'] || []) : []).map((account) => (<SelectItem key={account.id} value={account.id.toString()}>{account.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="to_account_id" className="dark:text-gray-200">To Account</Label>
                            <Select value={cashPaymentData.to_account_id} onValueChange={(value) => setCashPaymentData(prev => ({ ...prev, to_account_id: value }))}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Choose destination account" /></SelectTrigger>
                                <SelectContent>{accounts.map((account) => (<SelectItem key={account.id} value={account.id.toString()}>{account.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="amount" className="dark:text-gray-200">Amount</Label>
                        <Input id="amount" type="number" step="0.01" placeholder="Enter amount" value={cashPaymentData.amount} onChange={(e) => setCashPaymentData(prev => ({ ...prev, amount: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                        <Label htmlFor="remarks" className="dark:text-gray-200">Remarks</Label>
                        <Input id="remarks" placeholder="Enter remarks (optional)" value={cashPaymentData.remarks} onChange={(e) => setCashPaymentData(prev => ({ ...prev, remarks: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    </div>
                </FormModal>

                <FormModal
                    isOpen={isOfficePaymentOpen}
                    onClose={() => {
                        setIsOfficePaymentOpen(false);
                        setOfficePaymentData({ date: '', shift_id: '', from_account_id: '', to_account_id: '', amount: '', payment_type: 'Cash', bank_type: '', bank_name: '', cheque_no: '', cheque_date: '', account_no: '', branch_name: '', mobile_bank: '', mobile_number: '', remarks: '' });
                    }}
                    title="Office Payment"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setOfficePaymentProcessing(true);
                        router.post('/office-payments', officePaymentData, {
                            onSuccess: () => {
                                setIsOfficePaymentOpen(false);
                                setOfficePaymentData({ date: '', shift_id: '', from_account_id: '', to_account_id: '', amount: '', payment_type: 'Cash', bank_type: '', bank_name: '', cheque_no: '', cheque_date: '', account_no: '', branch_name: '', mobile_bank: '', mobile_number: '', remarks: '' });
                                setOfficePaymentProcessing(false);
                                if (data.transaction_date && data.shift_id) {
                                    fetchShiftData(data.transaction_date, data.shift_id);
                                }
                            },
                            onError: () => setOfficePaymentProcessing(false)
                        });
                    }}
                    processing={officePaymentProcessing}
                    submitText="Create"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="date" className="dark:text-gray-200">Date</Label>
                            <Input id="date" type="date" value={officePaymentData.date} onChange={(e) => setOfficePaymentData(prev => ({ ...prev, date: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </div>
                        <div>
                            <Label htmlFor="shift_id" className="dark:text-gray-200">Shift</Label>
                            <Select value={officePaymentData.shift_id} onValueChange={(value) => setOfficePaymentData(prev => ({ ...prev, shift_id: value }))}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Select shift" /></SelectTrigger>
                                <SelectContent>{availableShifts.map((shift) => (<SelectItem key={shift.id} value={shift.id.toString()}>{shift.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="payment_type" className="dark:text-gray-200">Payment Type</Label>
                        <Select value={officePaymentData.payment_type} onValueChange={(value) => setOfficePaymentData(prev => ({ ...prev, payment_type: value, to_account_id: '' }))}>
                            <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Select payment type" /></SelectTrigger>
                            <SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Bank Account">Bank Account</SelectItem><SelectItem value="Mobile Bank">Mobile Bank</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="from_account_id" className="dark:text-gray-200">From Account</Label>
                            <Select value={officePaymentData.from_account_id} onValueChange={(value) => setOfficePaymentData(prev => ({ ...prev, from_account_id: value }))}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Select from account" /></SelectTrigger>
                                <SelectContent>{accounts.map((account) => (<SelectItem key={account.id} value={account.id.toString()}>{account.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="to_account_id" className="dark:text-gray-200">To Account (Office)</Label>
                            <Select value={officePaymentData.to_account_id} onValueChange={(value) => setOfficePaymentData(prev => ({ ...prev, to_account_id: value }))}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Select office account" /></SelectTrigger>
                                <SelectContent>{(officePaymentData.payment_type === 'Cash' ? (groupedAccounts['Cash in hand'] || groupedAccounts['Cash'] || []) : officePaymentData.payment_type === 'Bank Account' ? (groupedAccounts['Bank Account'] || groupedAccounts['Bank'] || []) : officePaymentData.payment_type === 'Mobile Bank' ? (groupedAccounts['Mobile Bank'] || []) : []).map((account) => (<SelectItem key={account.id} value={account.id.toString()}>{account.name}</SelectItem>))}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    {officePaymentData.payment_type === 'Bank Account' && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium dark:text-white">Bank Payment Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="bank_type" className="dark:text-gray-200">Bank Type</Label>
                                    <Select value={officePaymentData.bank_type} onValueChange={(value) => setOfficePaymentData(prev => ({ ...prev, bank_type: value }))}>
                                        <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Select type" /></SelectTrigger>
                                        <SelectContent><SelectItem value="Cheque">Cheque</SelectItem><SelectItem value="Cash Deposit">Cash Deposit</SelectItem><SelectItem value="Online">Online</SelectItem><SelectItem value="CHT">CHT</SelectItem><SelectItem value="RTGS">RTGS</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="bank_name" className="dark:text-gray-200">Bank Name</Label>
                                    <Input id="bank_name" value={officePaymentData.bank_name} onChange={(e) => setOfficePaymentData(prev => ({ ...prev, bank_name: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                </div>
                            </div>
                            {officePaymentData.bank_type === 'Cheque' && (
                                <div>
                                    <Label htmlFor="cheque_no" className="dark:text-gray-200">Cheque Number</Label>
                                    <Input id="cheque_no" value={officePaymentData.cheque_no} onChange={(e) => setOfficePaymentData(prev => ({ ...prev, cheque_no: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                </div>
                            )}
                        </div>
                    )}
                    {officePaymentData.payment_type === 'Mobile Bank' && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium dark:text-white">Mobile Bank Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="mobile_bank" className="dark:text-gray-200">Mobile Bank</Label>
                                    <Select value={officePaymentData.mobile_bank} onValueChange={(value) => setOfficePaymentData(prev => ({ ...prev, mobile_bank: value }))}>
                                        <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"><SelectValue placeholder="Select mobile bank" /></SelectTrigger>
                                        <SelectContent><SelectItem value="bKash">bKash</SelectItem><SelectItem value="Nagad">Nagad</SelectItem><SelectItem value="Rocket">Rocket</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="mobile_number" className="dark:text-gray-200">Mobile Number</Label>
                                    <Input id="mobile_number" value={officePaymentData.mobile_number} onChange={(e) => setOfficePaymentData(prev => ({ ...prev, mobile_number: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div>
                        <Label htmlFor="amount" className="dark:text-gray-200">Amount</Label>
                        <Input id="amount" type="number" step="0.01" value={officePaymentData.amount} onChange={(e) => setOfficePaymentData(prev => ({ ...prev, amount: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                        <Label htmlFor="remarks" className="dark:text-gray-200">Remarks</Label>
                        <Input id="remarks" value={officePaymentData.remarks} onChange={(e) => setOfficePaymentData(prev => ({ ...prev, remarks: e.target.value }))} className="dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    </div>
                </FormModal>
            </div>
        </AppLayout>
    );
}
