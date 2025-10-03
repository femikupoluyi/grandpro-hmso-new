import React from 'react';

const NigerianCurrencyDisplay = ({ 
  amount, 
  showSymbol = true, 
  showCode = false,
  decimals = 2,
  className = '',
  size = 'medium'
}) => {
  const formatAmount = (value) => {
    if (value === null || value === undefined) return '0.00';
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Format with thousands separator
    return numValue.toLocaleString('en-NG', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const sizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-2xl font-semibold'
  };

  const symbol = '₦';
  const code = 'NGN';

  return (
    <span className={`${sizes[size]} ${className}`}>
      {showSymbol && <span className="mr-0.5">{symbol}</span>}
      {formatAmount(amount)}
      {showCode && <span className="ml-1 text-gray-500">{code}</span>}
    </span>
  );
};

export default NigerianCurrencyDisplay;
