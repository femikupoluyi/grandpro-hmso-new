import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Receipt, 
  CreditCard, 
  TrendingUp,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Plus
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const BillingDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    todayCollections: 0,
    insuranceClaims: 0,
    overdueBills: 0
  });
  const [recentBills, setRecentBills] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
    const interval = setInterval(fetchBillingData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [filterStatus]);

  const fetchBillingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, billsRes, claimsRes] = await Promise.all([
        axios.get(`${API_URL}/hospital/billing/stats`, { headers }),
        axios.get(`${API_URL}/hospital/billing/bills/recent`, { 
          headers,
          params: { status: filterStatus !== 'all' ? filterStatus : undefined }
        }),
        axios.get(`${API_URL}/hospital/billing/insurance-claims/pending`, { headers })
      ]);

      setStats(statsRes.data.stats || {
        totalRevenue: 0,
        pendingPayments: 0,
        todayCollections: 0,
        insuranceClaims: 0,
        overdueBills: 0
      });
      setRecentBills(billsRes.data.bills || []);
      setPendingClaims(claimsRes.data.claims || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setLoading(false);
    }
  };

  const handleSearchBill = async () => {
    if (!searchTerm) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/hospital/billing/bills/search`, {
        params: { query: searchTerm },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.bills && response.data.bills.length > 0) {
        setRecentBills(response.data.bills);
      } else {
        alert('No bills found');
      }
    } catch (error) {
      console.error('Error searching bills:', error);
      alert('Error searching for bills');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentTypeIcon = (type) => {
    switch(type) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'insurance': return '🏥';
      case 'nhis': return '🏛️';
      case 'hmo': return '🔖';
      case 'bank_transfer': return '🏦';
      default: return '💰';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading billing dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Billing & Revenue Management</h1>
        <p className="text-gray-600 mt-2">Manage invoices, payments, and insurance claims</p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by bill ID, patient name, or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchBill()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Bills</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="partial">Partial</option>
          </select>
          <button
            onClick={() => navigate('/hospital/billing/invoice/new')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            New Invoice
          </button>
          <button
            onClick={() => navigate('/hospital/billing/payment')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <CreditCard className="h-5 w-5" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today's Collections</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(stats.todayCollections)}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Payments</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {formatCurrency(stats.pendingPayments)}
              </p>
            </div>
            <Clock className="h-10 w-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Insurance Claims</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.insuranceClaims}
              </p>
            </div>
            <FileText className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Overdue Bills</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.overdueBills}
              </p>
            </div>
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bills */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Bills
            </h2>
            <button
              onClick={() => navigate('/hospital/billing/bills')}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Bill ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBills.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                      No bills found
                    </td>
                  </tr>
                ) : (
                  recentBills.slice(0, 10).map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {bill.bill_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>
                          <p className="font-medium">{bill.patient_name}</p>
                          <p className="text-xs text-gray-500">{bill.patient_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {formatCurrency(bill.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="text-lg" title={bill.payment_method}>
                          {getPaymentTypeIcon(bill.payment_method)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bill.status)}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/hospital/billing/bill/${bill.id}`)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            View
                          </button>
                          {bill.status === 'pending' && (
                            <button
                              onClick={() => navigate(`/hospital/billing/payment?billId=${bill.id}`)}
                              className="text-green-600 hover:text-green-700"
                            >
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Insurance Claims */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pending Insurance Claims
            </h2>
          </div>
          <div className="p-4">
            {pendingClaims.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending claims</p>
            ) : (
              <div className="space-y-3">
                {pendingClaims.slice(0, 5).map((claim) => (
                  <div 
                    key={claim.id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/hospital/billing/claim/${claim.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {claim.claim_number}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        claim.provider_type === 'nhis' ? 'bg-blue-100 text-blue-800' :
                        claim.provider_type === 'hmo' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {claim.provider_type?.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-600">{claim.patient_name}</p>
                      <p className="font-semibold text-gray-900 mt-1">
                        {formatCurrency(claim.claim_amount)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Submitted: {new Date(claim.submission_date).toLocaleDateString('en-NG')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {pendingClaims.length > 5 && (
              <button
                onClick={() => navigate('/hospital/billing/claims')}
                className="w-full mt-4 text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All Claims →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Methods Distribution */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { method: 'Cash', icon: '💵', amount: stats.cashPayments || 0, color: 'green' },
            { method: 'Card', icon: '💳', amount: stats.cardPayments || 0, color: 'blue' },
            { method: 'NHIS', icon: '🏛️', amount: stats.nhisPayments || 0, color: 'indigo' },
            { method: 'HMO', icon: '🔖', amount: stats.hmoPayments || 0, color: 'purple' },
            { method: 'Insurance', icon: '🏥', amount: stats.insurancePayments || 0, color: 'pink' },
            { method: 'Transfer', icon: '🏦', amount: stats.transferPayments || 0, color: 'yellow' }
          ].map((method) => (
            <div key={method.method} className={`bg-${method.color}-50 rounded-lg p-4 text-center`}>
              <div className="text-2xl mb-2">{method.icon}</div>
              <p className="text-sm text-gray-600">{method.method}</p>
              <p className={`font-bold text-${method.color}-700 mt-1`}>
                {formatCurrency(method.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate('/hospital/billing/reports')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <TrendingUp className="h-5 w-5" />
            Revenue Reports
          </button>
          <button
            onClick={() => navigate('/hospital/billing/reconciliation')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <CheckCircle className="h-5 w-5" />
            Reconciliation
          </button>
          <button
            onClick={() => navigate('/hospital/billing/export')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <Download className="h-5 w-5" />
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;
