import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  CircularProgress,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Dashboard,
  CheckCircle,
  RadioButtonUnchecked,
  Assignment,
  CloudUpload,
  Description,
  Draw,
  Settings,
  School,
  Refresh,
  ArrowForward,
  Business,
  Schedule,
  TrendingUp,
  Warning,
  Info,
  LocalHospital,
  CalendarToday
} from '@mui/icons-material';
import {
  getOnboardingStatus,
  getOnboardingChecklist,
  getAllHospitals,
  getAllContracts
} from '../../services/onboarding.service';

const onboardingSteps = [
  {
    label: 'Application Submission',
    description: 'Complete and submit hospital application form',
    icon: <Assignment />,
    route: '/onboarding/application',
    field: 'application_submitted'
  },
  {
    label: 'Document Upload',
    description: 'Upload required documents and certificates',
    icon: <CloudUpload />,
    route: '/onboarding/documents',
    field: 'documents_uploaded'
  },
  {
    label: 'Evaluation & Review',
    description: 'Application review and scoring by our team',
    icon: <TrendingUp />,
    route: null,
    field: 'evaluation_completed'
  },
  {
    label: 'Contract Generation',
    description: 'Review and accept service agreement',
    icon: <Description />,
    route: '/onboarding/contract-review',
    field: 'contract_generated'
  },
  {
    label: 'Contract Signing',
    description: 'Digitally sign the service contract',
    icon: <Draw />,
    route: '/onboarding/contract-sign',
    field: 'contract_signed'
  },
  {
    label: 'System Setup',
    description: 'Configure hospital settings and user accounts',
    icon: <Settings />,
    route: null,
    field: 'setup_completed'
  }
];

function OnboardingDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch all data in parallel
      const [statusResponse, hospitalsResponse, contractsResponse] = await Promise.all([
        getOnboardingStatus(),
        getAllHospitals(),
        getAllContracts()
      ]);

      if (statusResponse.success) {
        setOnboardingData(statusResponse.onboardingStatuses);
      }

      if (hospitalsResponse.success) {
        setHospitals(hospitalsResponse.hospitals);
        
        // Set the most recent hospital as selected if available
        if (hospitalsResponse.hospitals.length > 0) {
          const currentHospitalId = localStorage.getItem('currentHospitalId');
          const hospital = hospitalsResponse.hospitals.find(h => h.id === currentHospitalId) 
            || hospitalsResponse.hospitals[0];
          setSelectedHospital(hospital);
        }
      }

      if (contractsResponse.success) {
        setContracts(contractsResponse.contracts);
      }
    } catch (err) {
      setError('Failed to load dashboard data. Please refresh the page.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const getStepStatus = (stepField) => {
    if (!selectedHospital || !onboardingData) return false;
    
    const hospitalStatus = onboardingData.find(
      status => status.hospital_id === selectedHospital.id
    );
    
    return hospitalStatus ? hospitalStatus[stepField] : false;
  };

  const calculateProgress = () => {
    if (!selectedHospital || !onboardingData) return 0;
    
    const hospitalStatus = onboardingData.find(
      status => status.hospital_id === selectedHospital.id
    );
    
    return hospitalStatus ? hospitalStatus.completion_percentage : 0;
  };

  const getCurrentStep = () => {
    for (let i = 0; i < onboardingSteps.length; i++) {
      if (!getStepStatus(onboardingSteps[i].field)) {
        return i;
      }
    }
    return onboardingSteps.length;
  };

  const getHospitalContract = () => {
    if (!selectedHospital) return null;
    return contracts.find(c => c.hospital_id === selectedHospital.id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            <Dashboard sx={{ mr: 1, verticalAlign: 'middle' }} />
            Onboarding Dashboard
          </Typography>
          <Button
            startIcon={refreshing ? <CircularProgress size={20} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Hospital Selector */}
        {hospitals.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Hospital
            </Typography>
            <Grid container spacing={2}>
              {hospitals.map(hospital => (
                <Grid item xs={12} sm={6} md={4} key={hospital.id}>
                  <Card
                    variant={selectedHospital?.id === hospital.id ? 'elevation' : 'outlined'}
                    sx={{
                      cursor: 'pointer',
                      borderColor: selectedHospital?.id === hospital.id ? 'primary.main' : 'divider',
                      borderWidth: selectedHospital?.id === hospital.id ? 2 : 1
                    }}
                    onClick={() => setSelectedHospital(hospital)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <LocalHospital />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" noWrap>
                            {hospital.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {hospital.code}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {hospital.city}, {hospital.state}
                      </Typography>
                      <Chip
                        label={hospital.status || 'Active'}
                        size="small"
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {selectedHospital ? (
          <Grid container spacing={3}>
            {/* Progress Overview */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Overall Progress
                  </Typography>
                  <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center', my: 3 }}>
                    <CircularProgress
                      variant="determinate"
                      value={calculateProgress()}
                      size={120}
                      thickness={4}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h4" component="div" color="text.secondary">
                        {calculateProgress()}%
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" align="center" color="textSecondary">
                    {getCurrentStep()} of {onboardingSteps.length} steps completed
                  </Typography>
                </CardContent>
              </Card>

              {/* Hospital Info */}
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Hospital Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Business />
                      </ListItemIcon>
                      <ListItemText
                        primary="Name"
                        secondary={selectedHospital.name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Info />
                      </ListItemIcon>
                      <ListItemText
                        primary="Code"
                        secondary={selectedHospital.code}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CalendarToday />
                      </ListItemIcon>
                      <ListItemText
                        primary="Applied On"
                        secondary={formatDate(selectedHospital.created_at)}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              {/* Contract Info */}
              {getHospitalContract() && (
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Contract Details
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Contract Number"
                          secondary={getHospitalContract().contract_number}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Status"
                          secondary={
                            <Chip
                              label={getHospitalContract().status}
                              size="small"
                              color={getHospitalContract().status === 'signed' ? 'success' : 'warning'}
                            />
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Commission Rate"
                          secondary={`${getHospitalContract().commission_rate || 15}%`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              )}
            </Grid>

            {/* Onboarding Steps */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Onboarding Steps
                </Typography>
                
                <Stepper activeStep={getCurrentStep()} orientation="vertical">
                  {onboardingSteps.map((step, index) => {
                    const completed = getStepStatus(step.field);
                    const active = index === getCurrentStep();
                    
                    return (
                      <Step key={step.label} completed={completed}>
                        <StepLabel
                          StepIconComponent={() => (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {completed ? (
                                <CheckCircle color="success" />
                              ) : active ? (
                                <RadioButtonUnchecked color="primary" />
                              ) : (
                                <RadioButtonUnchecked color="disabled" />
                              )}
                            </Box>
                          )}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {step.icon}
                            <Box sx={{ ml: 2 }}>
                              <Typography variant="subtitle1">
                                {step.label}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {step.description}
                              </Typography>
                            </Box>
                          </Box>
                        </StepLabel>
                        <StepContent>
                          <Box sx={{ mb: 2 }}>
                            {active && step.route && (
                              <Button
                                variant="contained"
                                size="small"
                                endIcon={<ArrowForward />}
                                onClick={() => navigate(step.route)}
                                sx={{ mt: 1 }}
                              >
                                Continue
                              </Button>
                            )}
                            {active && !step.route && (
                              <Alert severity="info" sx={{ mt: 1 }}>
                                This step will be completed by our team. We'll notify you once it's done.
                              </Alert>
                            )}
                            {completed && (
                              <Chip
                                label="Completed"
                                size="small"
                                color="success"
                                sx={{ mt: 1 }}
                              />
                            )}
                          </Box>
                        </StepContent>
                      </Step>
                    );
                  })}
                </Stepper>

                {getCurrentStep() === onboardingSteps.length && (
                  <Alert severity="success" sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Congratulations! 🎉
                    </Typography>
                    <Typography variant="body2">
                      Your hospital onboarding is complete. You now have full access to the GrandPro HMSO platform.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{ mt: 2 }}
                      onClick={() => navigate('/dashboard')}
                    >
                      Go to Main Dashboard
                    </Button>
                  </Alert>
                )}
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No Hospitals Found
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Start by submitting a hospital application to begin the onboarding process.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Assignment />}
              onClick={() => navigate('/onboarding/application')}
            >
              Start New Application
            </Button>
          </Paper>
        )}
      </Box>
    </Container>
  );
}

export default OnboardingDashboard;
