import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import OwnerDashboard from './pages/owner/Dashboard';
import PayoutHistory from './pages/owner/PayoutHistory';
import ContractStatus from './pages/owner/ContractStatus';
import OwnerAnalytics from './pages/owner/Analytics';
import PatientPortal from './pages/patient/Portal';
import Appointments from './pages/patient/Appointments';
import Feedback from './pages/patient/Feedback';
import LoyaltyRewards from './pages/patient/LoyaltyRewards';
import Reminders from './pages/patient/Reminders';

// Onboarding Pages
import ApplicationForm from './pages/onboarding/ApplicationForm';
import DocumentUpload from './pages/onboarding/DocumentUpload';
import OnboardingDashboard from './pages/onboarding/OnboardingDashboard';
import ContractReview from './pages/onboarding/ContractReview';
import Landing from './pages/Landing';

// CRM Pages
import OwnerManagement from './pages/crm/OwnerManagement';
import PatientManagement from './pages/crm/PatientManagement';
import CommunicationCampaigns from './pages/crm/CommunicationCampaigns';

// Hospital Management Pages
import HospitalDashboard from './pages/hospital/dashboard/HospitalDashboard';
import PatientRegistration from './pages/hospital/emr/PatientRegistration';
// EMR Components
import ClinicianDashboard from './pages/hospital/emr/ClinicianDashboard';
import PatientRecord from './pages/hospital/emr/PatientRecord';
// Billing Components
import BillingDashboard from './pages/hospital/billing/BillingDashboard';
import InvoiceGeneration from './pages/hospital/billing/InvoiceGeneration';
// Inventory Components
import InventoryDashboard from './pages/hospital/inventory/InventoryDashboard';
// HR Components
import HRDashboard from './pages/hospital/hr/HRDashboard';
import PayrollManagement from './pages/hospital/hr/PayrollManagement';

// Operations Pages
import CommandCentre from './pages/operations/CommandCentre';
import ProjectManagement from './pages/operations/ProjectManagement';

function App() {
  const { isAuthenticated, role } = useAuthStore();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      
      {/* Onboarding Routes - Public */}
      <Route path="/onboarding">
        <Route path="application" element={<ApplicationForm />} />
        <Route path="documents" element={<DocumentUpload />} />
        <Route path="dashboard" element={<OnboardingDashboard />} />
        <Route path="contract-review" element={<ContractReview />} />
        <Route path="contract-sign" element={<ContractReview />} />
        <Route index element={<OnboardingDashboard />} />
      </Route>
      
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
          <Route path="analytics" element={
            <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
              <OwnerAnalytics />
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
          <Route path="reminders" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <Reminders />
            </ProtectedRoute>
          } />
        </Route>

        {/* Hospital Management Routes */}
        <Route path="hospital">
          <Route index element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <HospitalDashboard />
            </ProtectedRoute>
          } />
          
          {/* EMR Routes */}
          <Route path="emr">
            <Route index element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'DOCTOR', 'NURSE', 'CLINICIAN']}>
                <ClinicianDashboard />
              </ProtectedRoute>
            } />
            <Route path="register" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
                <PatientRegistration />
              </ProtectedRoute>
            } />
            <Route path="patient/:patientId" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'DOCTOR', 'NURSE', 'CLINICIAN']}>
                <PatientRecord />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Billing Routes */}
          <Route path="billing">
            <Route index element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'BILLING', 'ACCOUNTANT']}>
                <BillingDashboard />
              </ProtectedRoute>
            } />
            <Route path="invoice/new" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'BILLING', 'ACCOUNTANT']}>
                <InvoiceGeneration />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Inventory Routes */}
          <Route path="inventory">
            <Route index element={
              <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'PHARMACIST', 'STOREKEEPER']}>
                <InventoryDashboard />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* HR Routes */}
          <Route path="hr">
            <Route index element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <HRDashboard />
              </ProtectedRoute>
            } />
            <Route path="payroll" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <PayrollManagement />
              </ProtectedRoute>
            } />
          </Route>
        </Route>

        {/* CRM Routes */}
        <Route path="crm">
          <Route path="owners" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <OwnerManagement />
            </ProtectedRoute>
          } />
          <Route path="patients" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <PatientManagement />
            </ProtectedRoute>
          } />
          <Route path="campaigns" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <CommunicationCampaigns />
            </ProtectedRoute>
          } />
        </Route>

        {/* Operations Management Routes */}
        <Route path="operations">
          <Route index element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <CommandCentre />
            </ProtectedRoute>
          } />
          <Route path="projects" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <ProjectManagement />
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
