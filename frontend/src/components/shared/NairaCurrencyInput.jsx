import React, { useState, useEffect } from 'react';

const NairaCurrencyInput = ({ 
  value, 
  onChange, 
  placeholder = 'Enter amount', 
  required = false,
  min = 0,
  className = '' 
}) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) {
      const formatted = formatNaira(value);
      setDisplayValue(formatted);
    }
  }, [value]);

  const formatNaira = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  };

  const handleChange = (e) => {
    const input = e.target.value.replace(/[^0-9.]/g, '');
    const numValue = parseFloat(input) || 0;
    
    if (numValue >= min) {
      onChange(numValue);
      setDisplayValue(formatNaira(numValue));
    }
  };

  const handleFocus = (e) => {
    const numValue = parseFloat(value) || 0;
    e.target.value = numValue > 0 ? numValue.toString() : '';
  };

  const handleBlur = (e) => {
    const numValue = parseFloat(e.target.value) || 0;
    setDisplayValue(formatNaira(numValue));
  };

  return (
    <div className={`form-group ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Amount (NGN) {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          ₦
        </span>
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default NairaCurrencyInput;
