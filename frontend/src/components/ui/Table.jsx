import React from 'react';

export const Table = ({ children, className = '' }) => (
  <div className="overflow-x-auto">
    <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
      {children}
    </table>
  </div>
);

export const TableHead = ({ children, className = '' }) => (
  <thead className={`bg-gray-50 ${className}`}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '' }) => (
  <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '', hover = true, onClick }) => {
  const hoverClasses = hover ? 'hover:bg-gray-50' : '';
  const cursorClasses = onClick ? 'cursor-pointer' : '';
  
  return (
    <tr 
      className={`${hoverClasses} ${cursorClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

export const TableHeader = ({ children, className = '', sortable = false, onSort }) => {
  const sortableClasses = sortable ? 'cursor-pointer select-none hover:bg-gray-100' : '';
  
  return (
    <th 
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${sortableClasses} ${className}`}
      onClick={sortable ? onSort : undefined}
    >
      {children}
    </th>
  );
};

export const TableCell = ({ children, className = '' }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm ${className}`}>
    {children}
  </td>
);

const TableComponent = {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell
};

export default TableComponent;
