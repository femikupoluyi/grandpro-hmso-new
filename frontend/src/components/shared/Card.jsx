import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle,
  headerAction,
  footer,
  padding = true,
  shadow = true,
  border = true,
  className = '',
  onClick,
  hoverable = false
}) => {
  const baseClasses = 'bg-white rounded-lg overflow-hidden';
  const shadowClass = shadow ? 'shadow-md' : '';
  const borderClass = border ? 'border border-gray-200' : '';
  const paddingClass = padding ? 'p-6' : '';
  const hoverableClass = hoverable ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : '';
  
  return (
    <div 
      className={`${baseClasses} ${shadowClass} ${borderClass} ${hoverableClass} ${className}`}
      onClick={onClick}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
            {headerAction && (
              <div className="ml-4 flex-shrink-0">{headerAction}</div>
            )}
          </div>
        </div>
      )}
      
      <div className={paddingClass}>
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
