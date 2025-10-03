import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Theme and configuration
import theme from './theme';
import { config } from './services/api.config';

// Components
import ErrorBoundary from './components/shared/ErrorBoundary';
import LoadingState from './components/shared/LoadingState';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Route configuration
import { publicRoutes, protectedRoutes } from './router/routes';

// Store
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  // Log app initialization
  React.useEffect(() => {
    console.log(`🏥 ${config.APP_NAME} v${config.APP_VERSION}`);
    console.log(`📍 Environment: ${config.ENVIRONMENT}`);
    console.log(`🌍 Timezone: ${config.TIMEZONE}`);
    console.log(`💵 Currency: ${config.CURRENCY}`);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        
        <Suspense fallback={<LoadingState fullScreen message="Loading application..." />}>
          <Routes>
            {/* Public Routes */}
            {publicRoutes.map((route) => (
              <Route 
                key={route.path} 
                path={route.path} 
                element={route.element} 
              />
            ))}

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {protectedRoutes.map((section) => (
                  <Route key={section.path} path={section.path}>
                    {section.children ? (
                      section.children.map((child) => (
                        <Route
                          key={child.path}
                          path={child.path}
                          element={child.element}
                        />
                      ))
                    ) : (
                      <Route index element={section.element} />
                    )}
                  </Route>
                ))}
              </Route>
            </Route>

            {/* Default redirect */}
            <Route 
              path="*" 
              element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} 
            />
          </Routes>
        </Suspense>

        {/* Global Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
