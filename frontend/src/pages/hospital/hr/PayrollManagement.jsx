import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Users, 
  Calculator,
  FileText,
  Download,
  Send,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Printer,
  Mail
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const PayrollManagement = () => {
  const navigate = useNavigate();
  const [payrollPeriod, setPayrollPeriod] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [payrollData, setPayrollData] = useState([]);
  const [payrollSummary, setPayrollSummary] = useState({
    totalStaff: 0,
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    totalPAYE: 0,
    totalPension: 0,
    totalNHIS: 0,
    totalOtherDeductions: 0
  });
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('draft');

  useEffect(() => {
    fetchPayrollData();
  }, [payrollPeriod, filterDepartment]);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/hospital/hr/payroll/calculate`, {
        params: {
          month: payrollPeriod.month,
          year: payrollPeriod.year,
          department: filterDepartment !== 'all' ? filterDepartment : undefined
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      setPayrollData(response.data.payroll || []);
      setPayrollSummary(response.data.summary || {
        totalStaff: 0,
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        totalPAYE: 0,
        totalPension: 0,
        totalNHIS: 0,
        totalOtherDeductions: 0
      });
      setProcessingStatus(response.data.status || 'draft');
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      setLoading(false);
    }
  };

  const calculatePAYE = (grossSalary) => {
    // Nigerian PAYE calculation (simplified)
    // First ₦300,000 per annum = 7%
    // Next ₦300,000 = 11%
    // Next ₦500,000 = 15%
    // Next ₦500,000 = 19%
    // Next ₦1,600,000 = 21%
    // Above ₦3,200,000 = 24%
    
    const annualGross = grossSalary * 12;
    let tax = 0;

    if (annualGross > 300000) {
      tax += Math.min(annualGross - 300000, 300000) * 0.07;
    }
    if (annualGross > 600000) {
      tax += Math.min(annualGross - 600000, 500000) * 0.11;
    }
    if (annualGross > 1100000) {
      tax += Math.min(annualGross - 1100000, 500000) * 0.15;
    }
    if (annualGross > 1600000) {
      tax += Math.min(annualGross - 1600000, 1600000) * 0.19;
    }
    if (annualGross > 3200000) {
      tax += (annualGross - 3200000) * 0.21;
    }

    // Add 1% consolidated relief allowance
    const consolidatedRelief = Math.max(200000 * 0.01, annualGross * 0.01);
    tax = Math.max(0, tax - consolidatedRelief);

    return tax / 12; // Monthly PAYE
  };

  const calculateDeductions = (grossSalary) => {
    const pension = grossSalary * 0.08; // 8% employee contribution
    const nhis = grossSalary * 0.01; // 1% NHIS
    const paye = calculatePAYE(grossSalary);
    
    return {
      pension,
      nhis,
      paye,
      total: pension + nhis + paye
    };
  };

  const processPayroll = async () => {
    if (selectedStaff.length === 0 && !window.confirm('Process payroll for all staff?')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/hospital/hr/payroll/process`,
        {
          month: payrollPeriod.month,
          year: payrollPeriod.year,
          staffIds: selectedStaff.length > 0 ? selectedStaff : null,
          action: 'process'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Payroll processed successfully!');
        fetchPayrollData();
      }
    } catch (error) {
      console.error('Error processing payroll:', error);
      alert('Error processing payroll');
    } finally {
      setLoading(false);
    }
  };

  const approvePayroll = async () => {
    if (!window.confirm('Approve this payroll for payment?')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/hospital/hr/payroll/approve`,
        {
          month: payrollPeriod.month,
          year: payrollPeriod.year
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Payroll approved successfully!');
        setProcessingStatus('approved');
      }
    } catch (error) {
      console.error('Error approving payroll:', error);
      alert('Error approving payroll');
    } finally {
      setLoading(false);
    }
  };

  const exportPayroll = async (format = 'excel') => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/hospital/hr/payroll/export`,
        {
          params: {
            month: payrollPeriod.month,
            year: payrollPeriod.year,
            format
          },
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payroll_${payrollPeriod.year}_${payrollPeriod.month}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
    } catch (error) {
      console.error('Error exporting payroll:', error);
      alert('Error exporting payroll');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const filteredPayrollData = payrollData.filter(staff => {
    if (!searchTerm) return true;
    return staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           staff.staff_id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
        <p className="text-gray-600 mt-2">Process monthly salaries and manage deductions</p>
      </div>

      {/* Period Selection and Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={payrollPeriod.month}
                onChange={(e) => setPayrollPeriod({...payrollPeriod, month: parseInt(e.target.value)})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i, 1).toLocaleString('en-NG', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={payrollPeriod.year}
                onChange={(e) => setPayrollPeriod({...payrollPeriod, year: parseInt(e.target.value)})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[2023, 2024, 2025].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="mt-6">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                processingStatus === 'draft' ? 'bg-gray-100 text-gray-800' :
                processingStatus === 'processed' ? 'bg-yellow-100 text-yellow-800' :
                processingStatus === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {processingStatus.charAt(0).toUpperCase() + processingStatus.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={processPayroll}
              disabled={loading || processingStatus === 'approved'}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 flex items-center gap-2"
            >
              <Calculator className="h-5 w-5" />
              Process Payroll
            </button>
            {processingStatus === 'processed' && (
              <button
                onClick={approvePayroll}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center gap-2"
              >
                <CheckCircle className="h-5 w-5" />
                Approve
              </button>
            )}
            <button
              onClick={() => exportPayroll('excel')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="h-5 w-5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Payroll Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{payrollSummary.totalStaff}</p>
            </div>
            <Users className="h-10 w-10 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Gross Salary</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatCurrency(payrollSummary.totalGross)}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Deductions</p>
              <p className="text-xl font-bold text-red-600 mt-1">
                {formatCurrency(payrollSummary.totalDeductions)}
              </p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Net Payroll</p>
              <p className="text-xl font-bold text-green-600 mt-1">
                {formatCurrency(payrollSummary.totalNet)}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-green-500" />
          </div>
        </div>
      </div>

      {/* Deductions Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Deductions Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">PAYE Tax</p>
            <p className="text-lg font-bold text-yellow-700">
              {formatCurrency(payrollSummary.totalPAYE)}
            </p>
            <p className="text-xs text-gray-500 mt-1">7.5% - 24% Progressive</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Pension</p>
            <p className="text-lg font-bold text-blue-700">
              {formatCurrency(payrollSummary.totalPension)}
            </p>
            <p className="text-xs text-gray-500 mt-1">8% Employee Contribution</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">NHIS</p>
            <p className="text-lg font-bold text-green-700">
              {formatCurrency(payrollSummary.totalNHIS)}
            </p>
            <p className="text-xs text-gray-500 mt-1">1% of Gross Salary</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Other Deductions</p>
            <p className="text-lg font-bold text-purple-700">
              {formatCurrency(payrollSummary.totalOtherDeductions)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Loans, Advances, etc.</p>
          </div>
        </div>
      </div>

      {/* Payroll Details Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Payroll Details</h2>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Departments</option>
                <option value="medical">Medical</option>
                <option value="nursing">Nursing</option>
                <option value="admin">Administration</option>
                <option value="support">Support</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="lab">Laboratory</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStaff(payrollData.map(s => s.staff_id));
                      } else {
                        setSelectedStaff([]);
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Staff ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Allowances
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Gross
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  PAYE
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Pension
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  NHIS
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Total Deductions
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Net Pay
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="14" className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading payroll data...</p>
                  </td>
                </tr>
              ) : filteredPayrollData.length === 0 ? (
                <tr>
                  <td colSpan="14" className="px-4 py-8 text-center text-gray-500">
                    No payroll data available
                  </td>
                </tr>
              ) : (
                filteredPayrollData.map((staff) => {
                  const deductions = calculateDeductions(staff.gross_salary);
                  return (
                    <tr key={staff.staff_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedStaff.includes(staff.staff_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStaff([...selectedStaff, staff.staff_id]);
                            } else {
                              setSelectedStaff(selectedStaff.filter(id => id !== staff.staff_id));
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {staff.staff_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {staff.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {staff.department}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {staff.position}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(staff.basic_salary)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(staff.allowances || 0)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {formatCurrency(staff.gross_salary)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-yellow-600">
                        {formatCurrency(deductions.paye)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600">
                        {formatCurrency(deductions.pension)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">
                        {formatCurrency(deductions.nhis)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                        {formatCurrency(deductions.total + (staff.other_deductions || 0))}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-700">
                        {formatCurrency(staff.gross_salary - deductions.total - (staff.other_deductions || 0))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => navigate(`/hospital/hr/payslip/${staff.staff_id}?month=${payrollPeriod.month}&year=${payrollPeriod.year}`)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          View Slip
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions Footer */}
      {processingStatus === 'approved' && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-800">
                Payroll for {new Date(payrollPeriod.year, payrollPeriod.month - 1).toLocaleString('en-NG', { month: 'long', year: 'numeric' })} has been approved
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {/* Send payslips logic */}}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Send Payslips
              </button>
              <button
                onClick={() => {/* Print payslips logic */}}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollManagement;
