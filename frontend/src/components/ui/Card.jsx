import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = true,
  shadow = true,
  hover = false,
  onClick 
}) => {
  const baseClasses = 'bg-white rounded-lg';
  const shadowClasses = shadow ? 'shadow' : '';
  const hoverClasses = hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : '';
  const paddingClasses = padding ? 'p-6' : '';
  
  const classes = `${baseClasses} ${shadowClasses} ${hoverClasses} ${paddingClasses} ${className}`;

  if (onClick) {
    return (
      <div className={classes} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-medium text-gray-900 ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`mt-1 text-sm text-gray-500 ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-gray-200 ${className}`}>
    {children}
  </div>
);

export default Card;
