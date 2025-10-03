import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'

// Set application metadata from environment variables
document.title = import.meta.env.VITE_APP_NAME || 'GrandPro HMSO';

// Log environment info in development
if (import.meta.env.MODE === 'development') {
  console.log('🏥 GrandPro HMSO Frontend Initialized');
  console.log('🌍 Environment:', import.meta.env.MODE);
  console.log('🌍 Timezone:', import.meta.env.VITE_TIMEZONE || 'Africa/Lagos');
  console.log('💵 Currency:', import.meta.env.VITE_CURRENCY || 'NGN');
  console.log('🔗 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:5001/api');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

const AppWithAuth = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AppWithAuth />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
