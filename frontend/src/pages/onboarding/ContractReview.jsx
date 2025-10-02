import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ClockIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline';

const ContractReview = () => {
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signatureData, setSignatureData] = useState({
    fullName: '',
    designation: '',
    agreementAccepted: false,
    signatureCode: ''
  });
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  useEffect(() => {
    fetchContract();
  }, []);

  const fetchContract = async () => {
    try {
      const applicationId = localStorage.getItem('applicationId');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/onboarding/contract/${applicationId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setContract(data);
      }
    } catch (error) {
      console.error('Failed to fetch contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContract = async () => {
    setLoading(true);
    try {
      const applicationId = localStorage.getItem('applicationId');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/onboarding/contract/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ applicationId })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setContract(data);
      }
    } catch (error) {
      console.error('Failed to generate contract:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!signatureData.agreementAccepted) {
      alert('Please accept the terms and conditions');
      return;
    }

    if (!signatureData.fullName || !signatureData.designation) {
      alert('Please provide your full name and designation');
      return;
    }

    setSigning(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/onboarding/contract/sign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            contractId: contract.id,
            applicationId: localStorage.getItem('applicationId'),
            signatureData: {
              signerName: signatureData.fullName,
              signerDesignation: signatureData.designation,
              signatureHash: btoa(signatureData.fullName + Date.now()),
              ipAddress: 'Client IP',
              userAgent: navigator.userAgent
            }
          })
        }
      );

      if (response.ok) {
        alert('Contract signed successfully!');
        navigate('/onboarding/status');
      }
    } catch (error) {
      console.error('Failed to sign contract:', error);
      alert('Failed to sign contract. Please try again.');
    } finally {
      setSigning(false);
      setShowSignatureModal(false);
    }
  };

  const downloadContract = () => {
    window.open(
      `${import.meta.env.VITE_API_URL}/onboarding/contract/download/${contract.id}`,
      '_blank'
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClockIcon className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Contract Not Ready
            </h2>
            <p className="text-gray-600 mb-6">
              Your contract is being prepared. Please check back later.
            </p>
            <button
              onClick={handleGenerateContract}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Generate Contract
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Contract Review & Signature
          </h1>
          <p className="text-gray-600 mt-2">
            Review the partnership agreement terms and sign digitally
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contract Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg">
              {/* Contract Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Partnership Agreement
                      </h2>
                      <p className="text-sm text-gray-500">
                        Contract ID: {contract.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={downloadContract}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Contract Content */}
              <div className="p-6">
                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Contract Terms Summary
                  </h3>

                  {/* Key Terms */}
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <BuildingOfficeIcon className="h-5 w-5 text-gray-600" />
                        <h4 className="font-medium text-gray-900">Hospital Details</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>Name:</strong> {contract.hospitalName}<br />
                        <strong>Address:</strong> {contract.hospitalAddress}<br />
                        <strong>Registration:</strong> {contract.registrationNumber}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <CalendarIcon className="h-5 w-5 text-gray-600" />
                        <h4 className="font-medium text-gray-900">Contract Duration</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>Start Date:</strong> {new Date(contract.startDate).toLocaleDateString('en-NG')}<br />
                        <strong>End Date:</strong> {new Date(contract.endDate).toLocaleDateString('en-NG')}<br />
                        <strong>Duration:</strong> {contract.duration || '2 years'}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <CurrencyDollarIcon className="h-5 w-5 text-gray-600" />
                        <h4 className="font-medium text-gray-900">Financial Terms</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>Revenue Share:</strong> {contract.revenueShare || '70-30'}%<br />
                        <strong>Payment Terms:</strong> {contract.paymentTerms || 'Net 30 days'}<br />
                        <strong>Minimum Guarantee:</strong> ₦{contract.minimumGuarantee || '0'}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <UserGroupIcon className="h-5 w-5 text-gray-600" />
                        <h4 className="font-medium text-gray-900">Service Obligations</h4>
                      </div>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        <li>Maintain minimum bed capacity of {contract.minBedCapacity || 50} beds</li>
                        <li>Provide 24/7 emergency services</li>
                        <li>Maintain valid medical practice licenses</li>
                        <li>Submit monthly performance reports</li>
                        <li>Participate in quality improvement programs</li>
                      </ul>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Standard Terms & Conditions
                    </h3>
                    <div className="h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                      <p className="mb-4">
                        This Partnership Agreement ("Agreement") is entered into between GrandPro HMSO
                        ("Company") and {contract.hospitalName} ("Partner") on the terms and conditions
                        set forth below.
                      </p>
                      
                      <h4 className="font-semibold mb-2">1. Services</h4>
                      <p className="mb-4">
                        Partner agrees to provide healthcare services in accordance with the standards
                        and protocols established by the Company...
                      </p>

                      <h4 className="font-semibold mb-2">2. Compensation</h4>
                      <p className="mb-4">
                        Company shall compensate Partner based on the revenue sharing model outlined
                        in the financial terms section...
                      </p>

                      <h4 className="font-semibold mb-2">3. Compliance</h4>
                      <p className="mb-4">
                        Partner shall comply with all applicable laws, regulations, and professional
                        standards in the provision of healthcare services...
                      </p>

                      <h4 className="font-semibold mb-2">4. Confidentiality</h4>
                      <p className="mb-4">
                        Both parties agree to maintain the confidentiality of proprietary information
                        and patient records in accordance with applicable laws...
                      </p>

                      <h4 className="font-semibold mb-2">5. Termination</h4>
                      <p className="mb-4">
                        This Agreement may be terminated by either party upon 90 days written notice...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Signature Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Digital Signature
              </h3>

              {contract.signed ? (
                <div className="text-center">
                  <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-green-600 font-medium mb-2">
                    Contract Signed Successfully
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Signed on: {new Date(contract.signedAt).toLocaleDateString('en-NG')}
                  </p>
                  <div className="p-3 bg-gray-50 rounded-lg mb-4">
                    <p className="text-xs text-gray-500">Signature Hash</p>
                    <p className="text-xs font-mono text-gray-700 break-all">
                      {contract.signatureHash}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/onboarding/status')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Back to Dashboard
                  </button>
                </div>
              ) : (
                <div>
                  {/* QR Code */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                    <QrCodeIcon className="h-32 w-32 mx-auto text-gray-400" />
                    <p className="text-xs text-gray-500 mt-2">
                      QR Code for mobile signing
                    </p>
                  </div>

                  {/* Security Notice */}
                  <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <ShieldCheckIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-xs text-blue-800">
                        <p className="font-semibold mb-1">Secure Digital Signature</p>
                        <p>Your signature is encrypted and legally binding.</p>
                      </div>
                    </div>
                  </div>

                  {/* Sign Button */}
                  <button
                    onClick={() => setShowSignatureModal(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                    <span>Sign Contract</span>
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    By signing, you agree to the terms and conditions
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Digital Signature
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={signatureData.fullName}
                  onChange={(e) => setSignatureData(prev => ({
                    ...prev,
                    fullName: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Dr. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={signatureData.designation}
                  onChange={(e) => setSignatureData(prev => ({
                    ...prev,
                    designation: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Medical Director"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={signatureData.agreementAccepted}
                    onChange={(e) => setSignatureData(prev => ({
                      ...prev,
                      agreementAccepted: e.target.checked
                    }))}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    I have read and agree to all terms and conditions
                  </span>
                </label>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Signing from</p>
                <p className="text-xs text-gray-700">
                  IP: {window.location.hostname}<br />
                  Time: {new Date().toLocaleString('en-NG')}
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSignatureModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                disabled={signing || !signatureData.agreementAccepted}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  signing || !signatureData.agreementAccepted
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {signing ? 'Signing...' : 'Confirm Signature'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractReview;
