import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,
      
      login: async (credentials) => {
        try {
          const response = await axios.post('/api/auth/login', credentials);
          const { user, token } = response.data;
          
          set({
            user,
            token,
            role: user.role,
            isAuthenticated: true
          });
          
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return { success: true };
        } catch (error) {
          console.error('Login error:', error);
          return { 
            success: false, 
            error: error.response?.data?.message || 'Login failed' 
          };
        }
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          role: null,
          isAuthenticated: false
        });
        
        delete axios.defaults.headers.common['Authorization'];
      },
      
      checkRole: (allowedRoles) => {
        const currentRole = get().role;
        if (!currentRole) return false;
        
        if (Array.isArray(allowedRoles)) {
          return allowedRoles.includes(currentRole);
        }
        return allowedRoles === currentRole;
      },
      
      // For demo purposes - simulate login
      mockLogin: (role) => {
        const mockUsers = {
          OWNER: {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'owner@grandpro.ng',
            role: 'OWNER',
            hospitalId: 'hosp-001',
            ownerId: 'owner-001'
          },
          PATIENT: {
            id: '2',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'patient@example.com',
            role: 'PATIENT',
            patientId: 'patient-001'
          },
          ADMIN: {
            id: '3',
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@grandpro.ng',
            role: 'ADMIN'
          }
        };
        
        const user = mockUsers[role];
        if (user) {
          set({
            user,
            token: 'mock-token-' + role,
            role: user.role,
            isAuthenticated: true
          });
          return { success: true };
        }
        return { success: false, error: 'Invalid role' };
      }
    }),
    {
      name: 'auth-storage'
    }
  )
);

export default useAuthStore;
