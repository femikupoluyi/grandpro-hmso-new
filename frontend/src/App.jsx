import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
// Updated CRM Components
import OwnerDashboard from './components/crm/OwnerDashboard';
import PatientPortal from './components/crm/PatientPortal';
// Enhanced CRM Components
import EnhancedOwnerDashboard from './pages/crm/owner/EnhancedOwnerDashboard';
import EnhancedPatientPortal from './pages/crm/patient/EnhancedPatientPortal';
import RoleBasedRoute from './components/auth/RoleBasedRoute';
// Legacy owner pages (fallback)
import PayoutHistory from './pages/owner/PayoutHistory';
import ContractStatus from './pages/owner/ContractStatus';
import OwnerAnalytics from './pages/owner/Analytics';
// Legacy patient pages (fallback)
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
import CommandCentre from './pages/CommandCentre';
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
            <RoleBasedRoute allowedRoles={['owner', 'OWNER', 'ADMIN']}>
              <EnhancedOwnerDashboard />
            </RoleBasedRoute>
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
            <RoleBasedRoute allowedRoles={['patient', 'PATIENT']}>
              <EnhancedPatientPortal />
            </RoleBasedRoute>
          } />
          <Route path="portal" element={
            <RoleBasedRoute allowedRoles={['patient', 'PATIENT']}>
              <EnhancedPatientPortal />
            </RoleBasedRoute>
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

        {/* Demo Routes - No Authentication Required */}
        <Route path="demo">
          <Route path="command-centre" element={<CommandCentre />} />
          <Route path="projects" element={<ProjectManagement />} />
        </Route>

        {/* Staff Routes */}
        <Route path="staff" element={
          <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
            <HospitalDashboard />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <CommandCentre />
          </ProtectedRoute>
        } />

        {/* Default redirect based on role */}
        <Route index element={
          isAuthenticated ? (
            role === 'OWNER' ? 
              <Navigate to="/owner" replace /> : 
            role === 'PATIENT' ?
              <Navigate to="/patient" replace /> :
            role === 'STAFF' ?
              <Navigate to="/staff" replace /> :
            role === 'ADMIN' ?
              <Navigate to="/admin" replace /> :
              <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Route>
    </Routes>
  );
}

export default App;
