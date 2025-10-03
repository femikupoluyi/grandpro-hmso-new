import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

// Lazy load pages for better performance
const Login = lazy(() => import('../pages/Login'));
const Landing = lazy(() => import('../pages/Landing'));
const ApplicationForm = lazy(() => import('../pages/onboarding/ApplicationForm'));
const OnboardingDashboard = lazy(() => import('../pages/onboarding/OnboardingDashboard'));
const DocumentUpload = lazy(() => import('../pages/onboarding/DocumentUpload'));
const ContractReview = lazy(() => import('../pages/onboarding/ContractReview'));

// CRM Pages
const OwnerDashboard = lazy(() => import('../components/crm/OwnerDashboard'));
const PatientPortal = lazy(() => import('../components/crm/PatientPortal'));
const OwnerManagement = lazy(() => import('../pages/crm/OwnerManagement'));
const PatientManagement = lazy(() => import('../pages/crm/PatientManagement'));
const CommunicationCampaigns = lazy(() => import('../pages/crm/CommunicationCampaigns'));

// Hospital Management Pages
const HospitalDashboard = lazy(() => import('../pages/hospital/dashboard/HospitalDashboard'));
const PatientRegistration = lazy(() => import('../pages/hospital/emr/PatientRegistration'));
const ClinicianDashboard = lazy(() => import('../pages/hospital/emr/ClinicianDashboard'));
const PatientRecord = lazy(() => import('../pages/hospital/emr/PatientRecord'));
const BillingDashboard = lazy(() => import('../pages/hospital/billing/BillingDashboard'));
const InvoiceGeneration = lazy(() => import('../pages/hospital/billing/InvoiceGeneration'));
const InventoryDashboard = lazy(() => import('../pages/hospital/inventory/InventoryDashboard'));
const HRDashboard = lazy(() => import('../pages/hospital/hr/HRDashboard'));

// Operations Pages
const CommandCentre = lazy(() => import('../pages/CommandCentre'));
const ProjectManagement = lazy(() => import('../pages/operations/ProjectManagement'));

// Route configuration
export const publicRoutes = [
  {
    path: '/',
    element: <Landing />,
    title: 'Home'
  },
  {
    path: '/login',
    element: <Login />,
    title: 'Login'
  },
  {
    path: '/apply',
    element: <ApplicationForm />,
    title: 'Apply to Join'
  }
];

export const protectedRoutes = [
  // Onboarding Routes
  {
    path: '/onboarding',
    title: 'Onboarding',
    children: [
      {
        path: '',
        element: <OnboardingDashboard />,
        title: 'Dashboard'
      },
      {
        path: 'application',
        element: <ApplicationForm />,
        title: 'Application'
      },
      {
        path: 'documents',
        element: <DocumentUpload />,
        title: 'Documents'
      },
      {
        path: 'contract',
        element: <ContractReview />,
        title: 'Contract Review'
      }
    ]
  },
  
  // CRM Routes
  {
    path: '/crm',
    title: 'CRM',
    children: [
      {
        path: 'owner',
        element: <OwnerDashboard />,
        title: 'Owner Dashboard'
      },
      {
        path: 'patient',
        element: <PatientPortal />,
        title: 'Patient Portal'
      },
      {
        path: 'owners',
        element: <OwnerManagement />,
        title: 'Manage Owners'
      },
      {
        path: 'patients',
        element: <PatientManagement />,
        title: 'Manage Patients'
      },
      {
        path: 'campaigns',
        element: <CommunicationCampaigns />,
        title: 'Communication'
      }
    ]
  },

  // Hospital Management Routes
  {
    path: '/hospital',
    title: 'Hospital',
    children: [
      {
        path: 'dashboard',
        element: <HospitalDashboard />,
        title: 'Dashboard'
      },
      {
        path: 'emr/register',
        element: <PatientRegistration />,
        title: 'Register Patient'
      },
      {
        path: 'emr/clinician',
        element: <ClinicianDashboard />,
        title: 'Clinician Dashboard'
      },
      {
        path: 'emr/patient/:id',
        element: <PatientRecord />,
        title: 'Patient Record'
      },
      {
        path: 'billing',
        element: <BillingDashboard />,
        title: 'Billing'
      },
      {
        path: 'billing/invoice',
        element: <InvoiceGeneration />,
        title: 'Create Invoice'
      },
      {
        path: 'inventory',
        element: <InventoryDashboard />,
        title: 'Inventory'
      },
      {
        path: 'hr',
        element: <HRDashboard />,
        title: 'Human Resources'
      }
    ]
  },

  // Operations Routes
  {
    path: '/operations',
    title: 'Operations',
    children: [
      {
        path: 'command-centre',
        element: <CommandCentre />,
        title: 'Command Centre'
      },
      {
        path: 'projects',
        element: <ProjectManagement />,
        title: 'Project Management'
      }
    ]
  }
];

// Role-based route access configuration
export const roleAccess = {
  admin: ['*'], // Access to all routes
  hospital_owner: ['/crm/owner', '/hospital/*', '/operations/*'],
  doctor: ['/hospital/emr/*', '/hospital/dashboard'],
  nurse: ['/hospital/emr/*', '/hospital/dashboard'],
  billing_clerk: ['/hospital/billing/*'],
  inventory_manager: ['/hospital/inventory'],
  hr_manager: ['/hospital/hr'],
  patient: ['/crm/patient'],
  operations_manager: ['/operations/*']
};

// Navigation menu structure
export const navigationMenu = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'Dashboard',
    roles: ['*']
  },
  {
    title: 'Onboarding',
    path: '/onboarding',
    icon: 'Assignment',
    roles: ['admin', 'operations_manager']
  },
  {
    title: 'CRM',
    icon: 'People',
    roles: ['admin', 'hospital_owner', 'operations_manager'],
    children: [
      { title: 'Owner Dashboard', path: '/crm/owner', roles: ['hospital_owner'] },
      { title: 'Patient Portal', path: '/crm/patient', roles: ['patient'] },
      { title: 'Manage Owners', path: '/crm/owners', roles: ['admin'] },
      { title: 'Manage Patients', path: '/crm/patients', roles: ['admin', 'hospital_owner'] },
      { title: 'Campaigns', path: '/crm/campaigns', roles: ['admin', 'hospital_owner'] }
    ]
  },
  {
    title: 'Hospital',
    icon: 'LocalHospital',
    roles: ['admin', 'hospital_owner', 'doctor', 'nurse'],
    children: [
      { title: 'Dashboard', path: '/hospital/dashboard' },
      { title: 'Patient Registration', path: '/hospital/emr/register' },
      { title: 'Clinical', path: '/hospital/emr/clinician' },
      { title: 'Billing', path: '/hospital/billing' },
      { title: 'Inventory', path: '/hospital/inventory' },
      { title: 'HR', path: '/hospital/hr' }
    ]
  },
  {
    title: 'Operations',
    icon: 'Analytics',
    path: '/operations/command-centre',
    roles: ['admin', 'operations_manager']
  }
];
