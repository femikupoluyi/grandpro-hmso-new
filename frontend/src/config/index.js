const config = {
  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'GrandPro HMSO',
    version: '1.0.0',
    description: 'Hospital Management System for Nigeria',
    currency: import.meta.env.VITE_CURRENCY || 'NGN',
    currencySymbol: '₦',
    timezone: import.meta.env.VITE_TIMEZONE || 'Africa/Lagos',
    country: import.meta.env.VITE_COUNTRY || 'Nigeria',
    locale: 'en-NG'
  },

  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    timeout: 30000,
    retryAttempts: 3
  },

  // Feature Flags
  features: {
    enableTelemedicine: false,
    enableWhatsApp: false,
    enableSMS: false,
    enablePayments: false,
    enableAnalytics: true,
    enableNotifications: true
  },

  // Storage Keys
  storage: {
    tokenKey: 'token',
    userKey: 'user',
    settingsKey: 'settings',
    themeKey: 'theme'
  },

  // Routes
  routes: {
    public: ['/login', '/register', '/apply', '/forgot-password'],
    private: ['/dashboard', '/hospitals', '/contracts', '/applications'],
    adminOnly: ['/settings', '/users', '/reports']
  },

  // Theme
  theme: {
    primaryColor: '#22c55e',
    secondaryColor: '#64748b',
    dangerColor: '#ef4444',
    warningColor: '#f59e0b',
    infoColor: '#3b82f6',
    successColor: '#22c55e'
  }
};

export default config;
