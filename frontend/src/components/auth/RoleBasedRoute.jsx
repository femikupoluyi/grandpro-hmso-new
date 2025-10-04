import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Block, Home } from '@mui/icons-material';

const RoleBasedRoute = ({ children, allowedRoles = [], userRole }) => {
  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentRole = userRole || user.role;

  // Check if user is authenticated
  if (!user || !user.id) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Block color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            You don't have permission to access this page. This area is restricted to {allowedRoles.join(', ')} users only.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Your current role: <strong>{currentRole}</strong>
          </Typography>
          <Button
            variant="contained"
            startIcon={<Home />}
            onClick={() => {
              // Redirect based on user role
              switch(currentRole) {
                case 'owner':
                  window.location.href = '/owner/dashboard';
                  break;
                case 'patient':
                  window.location.href = '/patient/portal';
                  break;
                case 'admin':
                  window.location.href = '/admin/dashboard';
                  break;
                case 'doctor':
                case 'staff':
                  window.location.href = '/hospital/dashboard';
                  break;
                default:
                  window.location.href = '/';
              }
            }}
          >
            Go to Your Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  // User has the required role, render the children
  return children;
};

export default RoleBasedRoute;
