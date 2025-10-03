import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@mui/material';
import { Hospital, User, Phone, Mail, MapPin, Bed, Users, Calendar, DollarSign } from 'lucide-react';
import NigerianStateSelector from '../../components/shared/NigerianStateSelector';
import PhoneNumberInput from '../../components/shared/PhoneNumberInput';
import NairaCurrencyInput from '../../components/shared/NairaCurrencyInput';
import onboardingService from '../../services/onboarding.service';
import { toast } from 'react-toastify';

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    // Hospital Information
    hospital_name: '',
    registration_number: '',
    state: '',
    city: '',
    address: '',
    phone_number: '',
    email: '',
    
    // Owner Information
    owner_first_name: '',
    owner_last_name: '',
    owner_email: '',
    owner_phone: '',
    
    // Hospital Capacity
    bed_capacity: '',
    staff_count: '',
    years_in_operation: '',
    annual_revenue: '',
    specialties: []
  });

  const specialtyOptions = [
    'General Medicine', 'Surgery', 'Pediatrics', 'Obstetrics & Gynecology',
    'Cardiology', 'Oncology', 'Neurology', 'Orthopedics', 'Emergency Medicine',
    'Internal Medicine', 'Psychiatry', 'Radiology', 'Anesthesiology',
    'Ophthalmology', 'ENT', 'Dermatology', 'Pathology', 'Nephrology'
  ];

  const validateStep = (step) => {
    const newErrors = {};
    
    switch(step) {
      case 1: // Hospital Information
        if (!formData.hospital_name) newErrors.hospital_name = 'Hospital name is required';
        if (!formData.registration_number) newErrors.registration_number = 'Registration number is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (!formData.city) newErrors.city = 'City is required';
        if (!formData.address) newErrors.address = 'Address is required';
        if (!formData.phone_number) newErrors.phone_number = 'Phone number is required';
        if (!formData.email) newErrors.email = 'Email is required';
        break;
        
      case 2: // Owner Information
        if (!formData.owner_first_name) newErrors.owner_first_name = 'First name is required';
        if (!formData.owner_last_name) newErrors.owner_last_name = 'Last name is required';
        if (!formData.owner_email) newErrors.owner_email = 'Owner email is required';
        if (!formData.owner_phone) newErrors.owner_phone = 'Owner phone is required';
        break;
        
      case 3: // Hospital Capacity
        if (!formData.bed_capacity) newErrors.bed_capacity = 'Bed capacity is required';
        if (!formData.staff_count) newErrors.staff_count = 'Staff count is required';
        if (!formData.years_in_operation) newErrors.years_in_operation = 'Years in operation is required';
        if (!formData.annual_revenue) newErrors.annual_revenue = 'Annual revenue is required';
        if (formData.specialties.length === 0) newErrors.specialties = 'Select at least one specialty';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSpecialtyToggle = (specialty) => {
    const updated = formData.specialties.includes(specialty)
      ? formData.specialties.filter(s => s !== specialty)
      : [...formData.specialties, specialty];
    setFormData({ ...formData, specialties: updated });
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setLoading(true);
    try {
      const result = await onboardingService.submitApplication(formData);
      
      if (result.success) {
        toast.success('Application submitted successfully!');
        // Store application ID for tracking
        localStorage.setItem('applicationId', result.application.application_id);
        navigate('/onboarding/dashboard');
      } else {
        toast.error(result.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('An error occurred while submitting your application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Hospital Onboarding Application
          </h1>
          <p className="text-lg text-gray-600">
            Join the GrandPro HMSO Network
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center ${step < 3 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                    currentStep >= step
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm font-medium">Hospital Info</span>
            <span className="text-sm font-medium">Owner Details</span>
            <span className="text-sm font-medium">Capacity & Specialties</span>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6">
            <h2 className="text-2xl font-bold">
              {currentStep === 1 && 'Hospital Information'}
              {currentStep === 2 && 'Owner Details'}
              {currentStep === 3 && 'Hospital Capacity & Specialties'}
            </h2>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Step 1: Hospital Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hospital Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Hospital className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="hospital_name"
                        value={formData.hospital_name}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.hospital_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter hospital name"
                      />
                    </div>
                    {errors.hospital_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.hospital_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="registration_number"
                      value={formData.registration_number}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.registration_number ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="CAC/Medical License Number"
                    />
                    {errors.registration_number && (
                      <p className="text-red-500 text-sm mt-1">{errors.registration_number}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <NigerianStateSelector
                    value={formData.state}
                    onChange={(e) => handleInputChange({ target: { name: 'state', value: e.target.value }})}
                    required={true}
                    className={errors.state ? 'error' : ''}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter city"
                      />
                    </div>
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter full hospital address"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <PhoneNumberInput
                    value={formData.phone_number}
                    onChange={(value) => setFormData({ ...formData, phone_number: value })}
                    required={true}
                    className={errors.phone_number ? 'error' : ''}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="hospital@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Owner Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="owner_first_name"
                        value={formData.owner_first_name}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.owner_first_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="First name"
                      />
                    </div>
                    {errors.owner_first_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.owner_first_name}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Last Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="owner_last_name"
                        value={formData.owner_last_name}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.owner_last_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Last name"
                      />
                    </div>
                    {errors.owner_last_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.owner_last_name}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        name="owner_email"
                        value={formData.owner_email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.owner_email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="owner@example.com"
                      />
                    </div>
                    {errors.owner_email && (
                      <p className="text-red-500 text-sm mt-1">{errors.owner_email}</p>
                    )}
                  </div>
                  
                  <PhoneNumberInput
                    value={formData.owner_phone}
                    onChange={(value) => setFormData({ ...formData, owner_phone: value })}
                    required={true}
                    className={errors.owner_phone ? 'error' : ''}
                  />
                </div>

                {/* Additional Owner Information Section */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Owner Verification</h3>
                  <p className="text-sm text-gray-600">
                    The owner information provided will be used for contract signing and 
                    official correspondence. Please ensure all details are accurate.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Hospital Capacity & Specialties */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bed Capacity <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Bed className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        name="bed_capacity"
                        value={formData.bed_capacity}
                        onChange={handleInputChange}
                        min="1"
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.bed_capacity ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Number of beds"
                      />
                    </div>
                    {errors.bed_capacity && (
                      <p className="text-red-500 text-sm mt-1">{errors.bed_capacity}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Staff Count <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        name="staff_count"
                        value={formData.staff_count}
                        onChange={handleInputChange}
                        min="1"
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.staff_count ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Total staff"
                      />
                    </div>
                    {errors.staff_count && (
                      <p className="text-red-500 text-sm mt-1">{errors.staff_count}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years in Operation <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        name="years_in_operation"
                        value={formData.years_in_operation}
                        onChange={handleInputChange}
                        min="0"
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.years_in_operation ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Years"
                      />
                    </div>
                    {errors.years_in_operation && (
                      <p className="text-red-500 text-sm mt-1">{errors.years_in_operation}</p>
                    )}
                  </div>
                  
                  <NairaCurrencyInput
                    value={formData.annual_revenue}
                    onChange={(value) => setFormData({ ...formData, annual_revenue: value })}
                    placeholder="Annual revenue"
                    required={true}
                    className={errors.annual_revenue ? 'error' : ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Specialties <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {specialtyOptions.map((specialty) => (
                      <label
                        key={specialty}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.specialties.includes(specialty)}
                          onChange={() => handleSpecialtyToggle(specialty)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{specialty}</span>
                      </label>
                    ))}
                  </div>
                  {errors.specialties && (
                    <p className="text-red-500 text-sm mt-1">{errors.specialties}</p>
                  )}
                </div>

                {/* Summary Section */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">Application Summary</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-600">Hospital:</span>
                    <span className="font-medium">{formData.hospital_name}</span>
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{formData.city}, {formData.state}</span>
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{formData.bed_capacity} beds, {formData.staff_count} staff</span>
                    <span className="text-gray-600">Specialties:</span>
                    <span className="font-medium">{formData.specialties.length} selected</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`px-6 py-2 rounded-lg font-medium ${
                  currentStep === 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                Previous
              </button>
              
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`px-6 py-2 rounded-lg font-medium ${
                    loading
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer Information */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>By submitting this application, you agree to our terms and conditions.</p>
          <p className="mt-2">
            Need help? Contact us at{' '}
            <a href="mailto:support@grandpro.ng" className="text-blue-600 hover:underline">
              support@grandpro.ng
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
