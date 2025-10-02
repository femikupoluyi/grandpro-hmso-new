import React from 'react';

const badgeVariants = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-primary-100 text-primary-800',
  secondary: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  danger: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800'
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-base'
};

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  rounded = 'full',
  className = '' 
}) => {
  const variantClasses = badgeVariants[variant];
  const sizeClasses = badgeSizes[size];
  const roundedClasses = rounded === 'full' ? 'rounded-full' : 'rounded-md';
  
  const classes = `inline-flex items-center font-medium ${roundedClasses} ${variantClasses} ${sizeClasses} ${className}`;

  return (
    <span className={classes}>
      {children}
    </span>
  );
};

export default Badge;
