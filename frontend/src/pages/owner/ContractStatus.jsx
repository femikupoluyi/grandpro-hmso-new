import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { DocumentTextIcon, CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

// Mock data for demo
const mockContracts = [
  {
    id: 'contract-001',
    contractNumber: 'CTR202500123',
    title: 'Hospital Management Agreement',
    description: 'Comprehensive hospital management and operation services agreement',
    type: 'SERVICE',
    status: 'ACTIVE',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    contractValue: 5000000,
    revenueShareRate: 15,
    commissionRate: 5,
    signedByHospital: true,
    signedByGrandPro: true,
    hospitalSignDate: '2024-12-20',
    grandProSignDate: '2024-12-21',
    paymentTerms: 'Monthly payment on 5th of each month',
    terminationClause: '90 days notice required for termination',
    attachments: [
      { name: 'Contract_Document.pdf', size: '2.3 MB' },
      { name: 'Terms_and_Conditions.pdf', size: '1.1 MB' }
    ]
  },
  {
    id: 'contract-002',
    contractNumber: 'CTR202400089',
    title: 'Equipment Lease Agreement',
    description: 'Medical equipment lease and maintenance agreement',
    type: 'LEASE',
    status: 'EXPIRED',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    contractValue: 2400000,
    revenueShareRate: 0,
    commissionRate: 10,
    signedByHospital: true,
    signedByGrandPro: true,
    hospitalSignDate: '2023-12-15',
    grandProSignDate: '2023-12-16',
    paymentTerms: 'Quarterly payment',
    attachments: [
      { name: 'Lease_Agreement.pdf', size: '1.8 MB' }
    ]
  }
];

export default function ContractStatus() {
  const [contracts] = useState(mockContracts);
  const [selectedContract, setSelectedContract] = useState(contracts[0]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'TERMINATED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDaysRemaining = (endDate) => {
    const days = differenceInDays(new Date(endDate), new Date());
    return days > 0 ? days : 0;
  };

  const getContractProgress = (startDate, endDate) => {
    const total = differenceInDays(new Date(endDate), new Date(startDate));
    const elapsed = differenceInDays(new Date(), new Date(startDate));
    const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);
    return progress;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Contract Status</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your hospital management contracts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract List */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Your Contracts</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {contracts.map((contract) => (
                <button
                  key={contract.id}
                  onClick={() => setSelectedContract(contract)}
                  className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedContract?.id === contract.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {contract.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {contract.contractNumber}
                      </p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                          {contract.status}
                        </span>
                      </div>
                    </div>
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 ml-2" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contract Details */}
        <div className="lg:col-span-2">
          {selectedContract && (
            <div className="space-y-6">
              {/* Contract Overview */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedContract.title}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Contract #{selectedContract.contractNumber}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedContract.status)}`}>
                      {selectedContract.status}
                    </span>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <p className="text-gray-600">
                    {selectedContract.description}
                  </p>
                  
                  {/* Contract Timeline */}
                  {selectedContract.status === 'ACTIVE' && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span>Contract Progress</span>
                        <span>{getDaysRemaining(selectedContract.endDate)} days remaining</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${getContractProgress(selectedContract.startDate, selectedContract.endDate)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Financial Terms */}
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <CurrencyDollarIcon className="h-6 w-6 text-primary-600" />
                    <h3 className="ml-2 text-lg font-medium text-gray-900">Financial Terms</h3>
                  </div>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-gray-500">Contract Value</dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {formatCurrency(selectedContract.contractValue)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Revenue Share</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {selectedContract.revenueShareRate}%
                      </dd>
                    </div>
                    {selectedContract.commissionRate > 0 && (
                      <div>
                        <dt className="text-sm text-gray-500">Commission Rate</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {selectedContract.commissionRate}%
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm text-gray-500">Payment Terms</dt>
                      <dd className="text-sm text-gray-700">
                        {selectedContract.paymentTerms}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Contract Duration */}
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <CalendarIcon className="h-6 w-6 text-primary-600" />
                    <h3 className="ml-2 text-lg font-medium text-gray-900">Contract Period</h3>
                  </div>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-gray-500">Start Date</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {format(new Date(selectedContract.startDate), 'MMMM d, yyyy')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">End Date</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {format(new Date(selectedContract.endDate), 'MMMM d, yyyy')}
                      </dd>
                    </div>
                    {selectedContract.terminationClause && (
                      <div>
                        <dt className="text-sm text-gray-500">Termination Clause</dt>
                        <dd className="text-sm text-gray-700">
                          {selectedContract.terminationClause}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Signatures */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contract Signatures</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Hospital Signature</span>
                      {selectedContract.signedByHospital ? (
                        <span className="text-green-600">✓ Signed</span>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                    </div>
                    {selectedContract.hospitalSignDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(selectedContract.hospitalSignDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">GrandPro Signature</span>
                      {selectedContract.signedByGrandPro ? (
                        <span className="text-green-600">✓ Signed</span>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                    </div>
                    {selectedContract.grandProSignDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(selectedContract.grandProSignDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Attachments */}
              {selectedContract.attachments && selectedContract.attachments.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contract Documents</h3>
                  <ul className="divide-y divide-gray-200">
                    {selectedContract.attachments.map((attachment, index) => (
                      <li key={index} className="py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                          <span className="ml-2 text-sm text-gray-900">{attachment.name}</span>
                          <span className="ml-2 text-xs text-gray-500">({attachment.size})</span>
                        </div>
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          Download
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
