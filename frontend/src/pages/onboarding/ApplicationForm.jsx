import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Stepper, 
  Step, 
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import { 
  Business, 
  Person, 
  Phone, 
  Email, 
  LocationOn,
  LocalHospital,
  MedicalServices,
  CheckCircle
} from '@mui/icons-material';
import { submitHospitalApplication, updateOnboardingProgress } from '../../services/onboarding.service';

const steps = ['Hospital Information', 'Owner Details', 'Services & Facilities', 'Review & Submit'];

const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara', 'FCT'
];

const hospitalTypes = [
  'General Hospital',
  'Teaching Hospital',
  'Specialist Hospital',
  'Private Hospital',
  'Primary Health Center',
  'Clinic',
  'Medical Center'
];

const services = [
  'Emergency Services',
  'Surgery',
  'Maternity',
  'Pediatrics',
  'Internal Medicine',
  'Orthopedics',
  'Radiology',
  'Laboratory',
  'Pharmacy',
  'Intensive Care',
  'Outpatient',
  'Dental'
];

function ApplicationForm() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    // Hospital Information
    name: '',
    address: '',
    city: '',
    state: 'Lagos',
    phoneNumber: '',
    email: '',
    type: 'General Hospital',
    bedCapacity: '',
    yearsInOperation: '',
    licenseNumber: '',
    
    // Owner Details
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerTitle: '',
    
    // Services & Facilities
    servicesOffered: [],
    hasEmergency: false,
    hasPharmacy: false,
    hasLab: false,
    hasXray: false,
    hasAmbulance: false,
    hasICU: false,
    
    // Additional Information
    staffCount: '',
    doctorCount: '',
    nurseCount: '',
    monthlyPatientVolume: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleServicesChange = (service) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(service)
        ? prev.servicesOffered.filter(s => s !== service)
        : [...prev.servicesOffered, service]
    }));
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Submit hospital application
      const result = await submitHospitalApplication(formData);
      
      if (result.success) {
        // Update onboarding progress
        await updateOnboardingProgress(result.hospital.id, 'application', true);
        
        setSuccess(true);
        
        // Store hospital ID for next steps
        localStorage.setItem('currentHospitalId', result.hospital.id);
        localStorage.setItem('currentHospitalName', result.hospital.name);
        
        // Redirect to document upload after 2 seconds
        setTimeout(() => {
          navigate('/onboarding/documents');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <Business /> Hospital Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Hospital Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Lagos General Hospital"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 123 Victoria Island, Lagos"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>State</InputLabel>
                  <Select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    label="State"
                  >
                    {nigerianStates.map(state => (
                      <MenuItem key={state} value={state}>{state}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder="+234XXXXXXXXXX"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Hospital Type</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    label="Hospital Type"
                  >
                    {hospitalTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bed Capacity"
                  name="bedCapacity"
                  type="number"
                  value={formData.bedCapacity}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Years in Operation"
                  name="yearsInOperation"
                  type="number"
                  value={formData.yearsInOperation}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="License Number"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <Person /> Hospital Owner Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Owner Full Name"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Dr. Adebayo Johnson"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Owner Email"
                  name="ownerEmail"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Owner Phone"
                  name="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={handleChange}
                  required
                  placeholder="+234XXXXXXXXXX"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title/Position"
                  name="ownerTitle"
                  value={formData.ownerTitle}
                  onChange={handleChange}
                  placeholder="e.g., Chief Medical Director"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider />
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 2 }}>
                  Staff Information
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Total Staff Count"
                  name="staffCount"
                  type="number"
                  value={formData.staffCount}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Number of Doctors"
                  name="doctorCount"
                  type="number"
                  value={formData.doctorCount}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Number of Nurses"
                  name="nurseCount"
                  type="number"
                  value={formData.nurseCount}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Average Monthly Patient Volume"
                  name="monthlyPatientVolume"
                  type="number"
                  value={formData.monthlyPatientVolume}
                  onChange={handleChange}
                  helperText="Approximate number of patients served per month"
                />
              </Grid>
            </Grid>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <MedicalServices /> Services & Facilities
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Services Offered
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {services.map(service => (
                    <Chip
                      key={service}
                      label={service}
                      onClick={() => handleServicesChange(service)}
                      color={formData.servicesOffered.includes(service) ? 'primary' : 'default'}
                      variant={formData.servicesOffered.includes(service) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Available Facilities
                </Typography>
                <FormGroup>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="hasEmergency"
                            checked={formData.hasEmergency}
                            onChange={handleChange}
                          />
                        }
                        label="Emergency Department"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="hasPharmacy"
                            checked={formData.hasPharmacy}
                            onChange={handleChange}
                          />
                        }
                        label="Pharmacy"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="hasLab"
                            checked={formData.hasLab}
                            onChange={handleChange}
                          />
                        }
                        label="Laboratory"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="hasXray"
                            checked={formData.hasXray}
                            onChange={handleChange}
                          />
                        }
                        label="X-Ray/Radiology"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="hasAmbulance"
                            checked={formData.hasAmbulance}
                            onChange={handleChange}
                          />
                        }
                        label="Ambulance Service"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            name="hasICU"
                            checked={formData.hasICU}
                            onChange={handleChange}
                          />
                        }
                        label="ICU/Critical Care"
                      />
                    </Grid>
                  </Grid>
                </FormGroup>
              </Grid>
            </Grid>
          </Box>
        );
      
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <CheckCircle /> Review Your Application
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Hospital Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Name:</Typography>
                  <Typography variant="body1">{formData.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Type:</Typography>
                  <Typography variant="body1">{formData.type}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">Address:</Typography>
                  <Typography variant="body1">{formData.address}, {formData.city}, {formData.state}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Phone:</Typography>
                  <Typography variant="body1">{formData.phoneNumber}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Email:</Typography>
                  <Typography variant="body1">{formData.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Bed Capacity:</Typography>
                  <Typography variant="body1">{formData.bedCapacity}</Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Owner Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Name:</Typography>
                  <Typography variant="body1">{formData.ownerName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Title:</Typography>
                  <Typography variant="body1">{formData.ownerTitle || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Email:</Typography>
                  <Typography variant="body1">{formData.ownerEmail}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">Phone:</Typography>
                  <Typography variant="body1">{formData.ownerPhone}</Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Services & Facilities
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>Services:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.servicesOffered.map(service => (
                    <Chip key={service} label={service} size="small" color="primary" />
                  ))}
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>Facilities:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.hasEmergency && <Chip label="Emergency" size="small" color="success" />}
                  {formData.hasPharmacy && <Chip label="Pharmacy" size="small" color="success" />}
                  {formData.hasLab && <Chip label="Laboratory" size="small" color="success" />}
                  {formData.hasXray && <Chip label="X-Ray" size="small" color="success" />}
                  {formData.hasAmbulance && <Chip label="Ambulance" size="small" color="success" />}
                  {formData.hasICU && <Chip label="ICU" size="small" color="success" />}
                </Box>
              </Box>
            </Paper>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Application submitted successfully! Redirecting to document upload...
              </Alert>
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
          Hospital Onboarding Application
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary" paragraph>
          Join GrandPro HMSO - Nigeria's Leading Hospital Management Platform
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ minHeight: 400 }}>
          {renderStepContent(activeStep)}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading || success}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default ApplicationForm;
