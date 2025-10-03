import React, { useState } from 'react';

const PhoneNumberInput = ({ 
  value, 
  onChange, 
  required = false,
  className = '' 
}) => {
  const [error, setError] = useState('');

  const formatPhoneNumber = (input) => {
    // Remove all non-digits
    const digits = input.replace(/\D/g, '');
    
    // Handle Nigerian phone numbers
    if (digits.startsWith('234')) {
      // International format: +234
      const match = digits.match(/^(234)(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `+234 ${match[2]} ${match[3]} ${match[4]}`;
      }
    } else if (digits.startsWith('0')) {
      // Local format: 0803 123 4567
      const match = digits.match(/^(0)(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `${match[1]}${match[2]} ${match[3]} ${match[4]}`;
      }
    } else if (digits.length === 10) {
      // Without prefix: 803 123 4567
      const match = digits.match(/^(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `0${match[1]} ${match[2]} ${match[3]}`;
      }
    }
    
    return digits;
  };

  const validatePhoneNumber = (phone) => {
    const digits = phone.replace(/\D/g, '');
    
    // Nigerian phone number validation
    if (digits.startsWith('234') && digits.length === 13) {
      return true;
    } else if (digits.startsWith('0') && digits.length === 11) {
      return true;
    } else if (!digits.startsWith('0') && !digits.startsWith('234') && digits.length === 10) {
      return true;
    }
    
    return false;
  };

  const handleChange = (e) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input);
    
    if (input.length > 0 && !validatePhoneNumber(input)) {
      setError('Please enter a valid Nigerian phone number');
    } else {
      setError('');
    }
    
    onChange(formatted);
  };

  return (
    <div className={`form-group ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Phone Number {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 sm:text-sm">🇳🇬</span>
        </div>
        <input
          type="tel"
          value={value}
          onChange={handleChange}
          placeholder="0803 123 4567"
          required={required}
          className={`w-full pl-10 pr-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      <p className="mt-1 text-xs text-gray-500">
        Format: 0803 123 4567 or +234 803 123 4567
      </p>
    </div>
  );
};

export default PhoneNumberInput;
