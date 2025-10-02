import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import OwnerDashboard from './pages/owner/Dashboard';
import PayoutHistory from './pages/owner/PayoutHistory';
import ContractStatus from './pages/owner/ContractStatus';
import PatientPortal from './pages/patient/Portal';
import Appointments from './pages/patient/Appointments';
import Feedback from './pages/patient/Feedback';
import LoyaltyRewards from './pages/patient/LoyaltyRewards';

function App() {
  const { isAuthenticated, role } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        {/* Owner Routes */}
        <Route path="owner">
          <Route index element={
            <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
              <OwnerDashboard />
            </ProtectedRoute>
          } />
          <Route path="payouts" element={
            <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
              <PayoutHistory />
            </ProtectedRoute>
          } />
          <Route path="contracts" element={
            <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
              <ContractStatus />
            </ProtectedRoute>
          } />
        </Route>

        {/* Patient Routes */}
        <Route path="patient">
          <Route index element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientPortal />
            </ProtectedRoute>
          } />
          <Route path="appointments" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <Appointments />
            </ProtectedRoute>
          } />
          <Route path="feedback" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <Feedback />
            </ProtectedRoute>
          } />
          <Route path="rewards" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <LoyaltyRewards />
            </ProtectedRoute>
          } />
        </Route>

        {/* Default redirect based on role */}
        <Route index element={
          isAuthenticated ? (
            role === 'OWNER' || role === 'ADMIN' ? 
              <Navigate to="/owner" replace /> : 
              <Navigate to="/patient" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Route>
    </Routes>
  );
}

export default App;
