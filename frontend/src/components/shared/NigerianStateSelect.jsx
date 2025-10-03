import React from 'react';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const NigerianStateSelect = ({ 
  value, 
  onChange, 
  label = 'State',
  required = false,
  error = false,
  helperText = '',
  fullWidth = true,
  includeFC = true,
  className = ''
}) => {
  const states = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
    'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
    'Ekiti', 'Enugu', 'Gombe', 'Imo', 'Jigawa', 'Kaduna',
    'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
    'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];

  if (includeFC) {
    states.unshift('FCT'); // Federal Capital Territory
  }

  return (
    <FormControl 
      fullWidth={fullWidth} 
      error={error}
      required={required}
      className={className}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''}
        onChange={onChange}
        label={label}
      >
        <MenuItem value="">
          <em>Select State</em>
        </MenuItem>
        {states.map((state) => (
          <MenuItem key={state} value={state}>
            {state}
          </MenuItem>
        ))}
      </Select>
      {helperText && (
        <span className={`text-sm mt-1 ${error ? 'text-red-500' : 'text-gray-600'}`}>
          {helperText}
        </span>
      )}
    </FormControl>
  );
};

export default NigerianStateSelect;
