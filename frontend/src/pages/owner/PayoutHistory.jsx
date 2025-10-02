import { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';

// Mock data for demo
const mockPayouts = [
  {
    id: 1,
    payout_number: 'PAY202510001',
    payout_period: '2025-10',
    amount_naira: 750000,
    revenue_share_amount: 500000,
    fixed_fee_amount: 250000,
    deductions: 0,
    net_amount: 750000,
    payment_method: 'BANK_TRANSFER',
    bank_name: 'First Bank Nigeria',
    account_number: '******7890',
    status: 'COMPLETED',
    scheduled_date: '2025-10-01',
    paid_date: '2025-10-05'
  },
  {
    id: 2,
    payout_number: 'PAY202509001',
    payout_period: '2025-09',
    amount_naira: 680000,
    revenue_share_amount: 450000,
    fixed_fee_amount: 230000,
    deductions: 0,
    net_amount: 680000,
    payment_method: 'BANK_TRANSFER',
    bank_name: 'First Bank Nigeria',
    account_number: '******7890',
    status: 'COMPLETED',
    scheduled_date: '2025-09-01',
    paid_date: '2025-09-05'
  },
  {
    id: 3,
    payout_number: 'PAY202508001',
    payout_period: '2025-08',
    amount_naira: 820000,
    revenue_share_amount: 570000,
    fixed_fee_amount: 250000,
    deductions: 20000,
    net_amount: 800000,
    payment_method: 'BANK_TRANSFER',
    bank_name: 'First Bank Nigeria',
    account_number: '******7890',
    status: 'COMPLETED',
    scheduled_date: '2025-08-01',
    paid_date: '2025-08-05'
  },
  {
    id: 4,
    payout_number: 'PAY202511001',
    payout_period: '2025-11',
    amount_naira: 900000,
    revenue_share_amount: 650000,
    fixed_fee_amount: 250000,
    deductions: 0,
    net_amount: 900000,
    payment_method: 'BANK_TRANSFER',
    status: 'PENDING',
    scheduled_date: '2025-11-01',
    paid_date: null
  },
  {
    id: 5,
    payout_number: 'PAY202507001',
    payout_period: '2025-07',
    amount_naira: 720000,
    revenue_share_amount: 470000,
    fixed_fee_amount: 250000,
    deductions: 0,
    net_amount: 720000,
    payment_method: 'BANK_TRANSFER',
    bank_name: 'First Bank Nigeria',
    account_number: '******7890',
    status: 'COMPLETED',
    scheduled_date: '2025-07-01',
    paid_date: '2025-07-05'
  }
];

export default function PayoutHistory() {
  const [payouts] = useState(mockPayouts);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPayouts = payouts.filter(payout => {
    if (statusFilter === 'ALL') return true;
    return payout.status === statusFilter;
  });

  const sortedPayouts = [...filteredPayouts].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.scheduled_date) - new Date(a.scheduled_date);
    }
    if (sortBy === 'amount') {
      return b.amount_naira - a.amount_naira;
    }
    return 0;
  });

  const totalPaid = payouts
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.net_amount, 0);

  const totalPending = payouts
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.net_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Payout History</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track all your payment transactions and revenue sharing details
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <dt className="text-sm font-medium text-gray-500">Total Received</dt>
          <dd className="mt-2 text-3xl font-semibold text-green-600">
            {formatCurrency(totalPaid)}
          </dd>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <dt className="text-sm font-medium text-gray-500">Pending Payouts</dt>
          <dd className="mt-2 text-3xl font-semibold text-yellow-600">
            {formatCurrency(totalPending)}
          </dd>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <dt className="text-sm font-medium text-gray-500">Total Transactions</dt>
          <dd className="mt-2 text-3xl font-semibold text-primary-600">
            {payouts.length}
          </dd>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="status-filter" className="sr-only">
                Filter by status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div>
              <label htmlFor="sort-by" className="sr-only">
                Sort by
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <FunnelIcon className="h-5 w-5" />
            <span>Showing {sortedPayouts.length} of {payouts.length} payouts</span>
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payout Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Breakdown
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPayouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {payout.payout_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        Period: {payout.payout_period}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(payout.net_amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Revenue: {formatCurrency(payout.revenue_share_amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Fixed: {formatCurrency(payout.fixed_fee_amount)}
                      </div>
                      {payout.deductions > 0 && (
                        <div className="text-xs text-red-500">
                          Deductions: -{formatCurrency(payout.deductions)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        {payout.payment_method?.replace('_', ' ')}
                      </div>
                      {payout.bank_name && (
                        <>
                          <div className="text-xs text-gray-500">
                            {payout.bank_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {payout.account_number}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div className="text-sm text-gray-900">
                        Scheduled: {format(new Date(payout.scheduled_date), 'MMM dd, yyyy')}
                      </div>
                      {payout.paid_date && (
                        <div className="text-xs text-green-600">
                          Paid: {format(new Date(payout.paid_date), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
