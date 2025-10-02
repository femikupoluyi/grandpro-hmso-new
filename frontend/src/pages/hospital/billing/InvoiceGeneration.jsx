import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Receipt, 
  User, 
  Plus, 
  Trash2, 
  Calculator,
  CreditCard,
  Save,
  Send,
  AlertCircle,
  Check,
  Printer
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const InvoiceGeneration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const encounterId = searchParams.get('encounterId');

  const [patient, setPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [billItems, setBillItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [insuranceDetails, setInsuranceDetails] = useState({
    provider: '',
    policyNumber: '',
    coveragePercentage: 0
  });
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    fetchServicesAndMedications();
    if (patientId) {
      fetchPatientDetails(patientId);
    }
    if (encounterId) {
      fetchEncounterServices(encounterId);
    }
  }, [patientId, encounterId]);

  const fetchServicesAndMedications = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [servicesRes, medicationsRes] = await Promise.all([
        axios.get(`${API_URL}/hospital/billing/services`, { headers }),
        axios.get(`${API_URL}/hospital/inventory/medications`, { headers })
      ]);

      setServices(servicesRes.data.services || []);
      setMedications(medicationsRes.data.items || []);
    } catch (error) {
      console.error('Error fetching services and medications:', error);
    }
  };

  const fetchPatientDetails = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/hospital/emr/patients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const patientData = response.data.patient;
      setPatient(patientData);
      
      // Auto-populate insurance details if available
      if (patientData.insurance_provider) {
        setPaymentMethod(patientData.insurance_type || 'insurance');
        setInsuranceDetails({
          provider: patientData.insurance_provider,
          policyNumber: patientData.insurance_id,
          coveragePercentage: patientData.insurance_type === 'nhis' ? 70 : 
                             patientData.insurance_type === 'hmo' ? 80 : 0
        });
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const fetchEncounterServices = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/hospital/billing/encounter/${id}/services`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.services) {
        const items = response.data.services.map(service => ({
          id: Date.now() + Math.random(),
          type: service.type || 'service',
          description: service.description,
          quantity: service.quantity || 1,
          unitPrice: service.price || 0,
          total: (service.quantity || 1) * (service.price || 0)
        }));
        setBillItems(items);
      }
    } catch (error) {
      console.error('Error fetching encounter services:', error);
    }
  };

  const searchPatient = async () => {
    if (!patientSearch) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/hospital/emr/patients/search`, {
        params: { query: patientSearch },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.patients && response.data.patients.length > 0) {
        fetchPatientDetails(response.data.patients[0].id);
      } else {
        alert('No patient found');
      }
    } catch (error) {
      console.error('Error searching patient:', error);
    }
  };

  const addBillItem = () => {
    setBillItems([
      ...billItems,
      {
        id: Date.now(),
        type: 'service',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }
    ]);
  };

  const updateBillItem = (id, field, value) => {
    setBillItems(billItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const removeBillItem = (id) => {
    setBillItems(billItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return billItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateDiscount = () => {
    return (calculateSubtotal() * discountPercentage) / 100;
  };

  const calculateInsuranceCoverage = () => {
    if (paymentMethod === 'nhis' || paymentMethod === 'hmo' || paymentMethod === 'insurance') {
      const subtotal = calculateSubtotal() - calculateDiscount();
      return (subtotal * insuranceDetails.coveragePercentage) / 100;
    }
    return 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const insuranceCoverage = calculateInsuranceCoverage();
    return subtotal - discount - insuranceCoverage;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const generateInvoice = async (action = 'save') => {
    if (!patient) {
      alert('Please select a patient');
      return;
    }

    if (billItems.length === 0) {
      alert('Please add at least one item to the bill');
      return;
    }

    const invalidItems = billItems.filter(item => !item.description || item.unitPrice <= 0);
    if (invalidItems.length > 0) {
      alert('Please complete all bill items with valid descriptions and prices');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const billData = {
        patient_id: patient.id,
        encounter_id: encounterId,
        items: billItems.map(item => ({
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total
        })),
        subtotal: calculateSubtotal(),
        discount_percentage: discountPercentage,
        discount_amount: calculateDiscount(),
        payment_method: paymentMethod,
        insurance_details: paymentMethod !== 'cash' ? insuranceDetails : null,
        insurance_coverage: calculateInsuranceCoverage(),
        total_amount: calculateTotal(),
        patient_amount: calculateTotal(),
        notes: notes,
        status: action === 'send' ? 'sent' : 'draft'
      };

      const response = await axios.post(
        `${API_URL}/hospital/billing/bills/create`,
        billData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert(`Invoice ${action === 'send' ? 'sent' : 'saved'} successfully!`);
        navigate(`/hospital/billing/bill/${response.data.bill.id}`);
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Generate Invoice</h1>
        <p className="text-gray-600 mt-2">Create a new bill for patient services</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Selection */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </h2>
            
            {!patient ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by patient ID or name..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPatient()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={searchPatient}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{patient.full_name}</p>
                    <p className="text-sm text-gray-600">{patient.registration_number}</p>
                    <p className="text-sm text-gray-600">{patient.phone_number}</p>
                  </div>
                  <button
                    onClick={() => {
                      setPatient(null);
                      setPatientSearch('');
                      setBillItems([]);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bill Items */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Bill Items
              </h2>
              <button
                onClick={addBillItem}
                className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>

            {billItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No items added yet</p>
                <button
                  onClick={addBillItem}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Add your first item
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {billItems.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-xs text-gray-600 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateBillItem(item.id, 'description', e.target.value)}
                            placeholder="Service or medication"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateBillItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Unit Price (₦)
                          </label>
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateBillItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Total
                          </label>
                          <div className="px-3 py-2 bg-gray-50 rounded font-semibold text-gray-900">
                            {formatCurrency(item.total)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeBillItem(item.id)}
                        className="text-red-600 hover:text-red-700 mt-6"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method & Insurance */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    // Auto-set coverage percentages
                    if (e.target.value === 'nhis') {
                      setInsuranceDetails({...insuranceDetails, coveragePercentage: 70});
                    } else if (e.target.value === 'hmo') {
                      setInsuranceDetails({...insuranceDetails, coveragePercentage: 80});
                    } else if (e.target.value === 'cash') {
                      setDiscountPercentage(5); // 5% cash discount
                      setInsuranceDetails({...insuranceDetails, coveragePercentage: 0});
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="nhis">NHIS</option>
                  <option value="hmo">HMO</option>
                  <option value="insurance">Private Insurance</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (%)
                </label>
                <input
                  type="number"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {(paymentMethod === 'nhis' || paymentMethod === 'hmo' || paymentMethod === 'insurance') && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Insurance Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Provider
                    </label>
                    <input
                      type="text"
                      value={insuranceDetails.provider}
                      onChange={(e) => setInsuranceDetails({...insuranceDetails, provider: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Policy Number
                    </label>
                    <input
                      type="text"
                      value={insuranceDetails.policyNumber}
                      onChange={(e) => setInsuranceDetails({...insuranceDetails, policyNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Coverage (%)
                    </label>
                    <input
                      type="number"
                      value={insuranceDetails.coveragePercentage}
                      onChange={(e) => setInsuranceDetails({...insuranceDetails, coveragePercentage: parseFloat(e.target.value) || 0})}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                placeholder="Additional notes or instructions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Bill Summary
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
              </div>

              {discountPercentage > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount ({discountPercentage}%)</span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(calculateDiscount())}
                  </span>
                </div>
              )}

              {calculateInsuranceCoverage() > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Insurance Coverage ({insuranceDetails.coveragePercentage}%)
                  </span>
                  <span className="font-medium text-blue-600">
                    -{formatCurrency(calculateInsuranceCoverage())}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Patient Amount</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-800">
                  <Check className="h-3 w-3 inline mr-1" />
                  5% cash discount applied
                </p>
              </div>
            )}

            {(paymentMethod === 'nhis' || paymentMethod === 'hmo') && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  Insurance will cover {insuranceDetails.coveragePercentage}% of the bill
                </p>
              </div>
            )}

            <div className="mt-6 space-y-2">
              <button
                onClick={() => generateInvoice('save')}
                disabled={loading || !patient || billItems.length === 0}
                className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                <Save className="h-5 w-5" />
                Save as Draft
              </button>
              
              <button
                onClick={() => generateInvoice('send')}
                disabled={loading || !patient || billItems.length === 0}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Generate & Send
                  </>
                )}
              </button>

              <button
                onClick={() => navigate('/hospital/billing')}
                className="w-full bg-white text-gray-700 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGeneration;
