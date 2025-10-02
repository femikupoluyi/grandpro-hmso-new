// Currency formatter for Nigerian Naira
export const formatCurrency = (amount, showSymbol = true) => {
  const formatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount || 0);
  
  return showSymbol ? formatted : formatted.replace('₦', '').trim();
};

// Date formatter
export const formatDate = (date, format = 'default') => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  const formats = {
    default: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit', hour12: true },
    datetime: { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    }
  };

  return dateObj.toLocaleDateString('en-NG', formats[format] || formats.default);
};

// Phone number formatter for Nigerian numbers
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as Nigerian phone number
  if (cleaned.startsWith('234')) {
    // International format
    const number = cleaned.substring(3);
    return `+234 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
  } else if (cleaned.startsWith('0')) {
    // Local format
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
};

// Number formatter with abbreviations
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Status badge color helper
export const getStatusColor = (status) => {
  const statusColors = {
    active: 'success',
    approved: 'success',
    completed: 'success',
    pending: 'warning',
    submitted: 'warning',
    under_review: 'info',
    draft: 'default',
    inactive: 'default',
    suspended: 'danger',
    rejected: 'danger',
    cancelled: 'danger',
    expired: 'danger'
  };
  
  return statusColors[status?.toLowerCase()] || 'default';
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
