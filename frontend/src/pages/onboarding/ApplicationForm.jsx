import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../services/api.config';
import NigerianStateSelect from '../../components/shared/NigerianStateSelect';

const steps = ['Basic Information', 'Hospital Details', 'Compliance', 'Facilities'];

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Information
    owner_first_name: '',
    owner_last_name: '',
    owner_email: '',
    owner_phone: '',
    owner_nin: '',
    
    // Hospital Details
    hospital_name: '',
    hospital_type: 'General',
    hospital_address: '',
    hospital_city: '',
    hospital_state: '',
    hospital_lga: '',
    postal_code: '',
    
    // Compliance
    cac_registration_number: '',
    tax_identification_number: '',
    nhis_number: '',
    years_in_operation: '',
    number_of_staff: '',
    bed_capacity: '',
    
    // Facilities
    specialties: [],
    has_emergency_unit: false,
    has_laboratory: false,
    has_pharmacy: false,
    has_radiology: false
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Basic Information
        if (!formData.owner_first_name) newErrors.owner_first_name = 'First name is required';
        if (!formData.owner_last_name) newErrors.owner_last_name = 'Last name is required';
        if (!formData.owner_email) newErrors.owner_email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.owner_email)) newErrors.owner_email = 'Invalid email format';
        if (!formData.owner_phone) newErrors.owner_phone = 'Phone number is required';
        else if (!/^(\+234|0)[789]\d{9}$/.test(formData.owner_phone.replace(/\s/g, ''))) {
          newErrors.owner_phone = 'Invalid Nigerian phone number';
        }
        break;
        
      case 1: // Hospital Details
        if (!formData.hospital_name) newErrors.hospital_name = 'Hospital name is required';
        if (!formData.hospital_address) newErrors.hospital_address = 'Address is required';
        if (!formData.hospital_city) newErrors.hospital_city = 'City is required';
        if (!formData.hospital_state) newErrors.hospital_state = 'State is required';
        break;
        
      case 2: // Compliance
        if (!formData.cac_registration_number) newErrors.cac_registration_number = 'CAC registration is required';
        if (!formData.tax_identification_number) newErrors.tax_identification_number = 'TIN is required';
        if (!formData.years_in_operation) newErrors.years_in_operation = 'Years in operation is required';
        if (!formData.number_of_staff) newErrors.number_of_staff = 'Number of staff is required';
        if (!formData.bed_capacity) newErrors.bed_capacity = 'Bed capacity is required';
        break;
        
      case 3: // Facilities
        // Optional, no required fields
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSpecialtyChange = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;
    
    setLoading(true);
    
    try {
      // Format phone number
      const formattedPhone = formData.owner_phone.startsWith('+') 
        ? formData.owner_phone 
        : formData.owner_phone.startsWith('0')
          ? '+234' + formData.owner_phone.substring(1)
          : '+234' + formData.owner_phone;
      
      const submitData = {
        ...formData,
        owner_phone: formattedPhone,
        years_in_operation: parseInt(formData.years_in_operation),
        number_of_staff: parseInt(formData.number_of_staff),
        bed_capacity: parseInt(formData.bed_capacity)
      };
      
      const response = await api.post('/onboarding/register', submitData);
      
      if (response.data.success) {
        toast.success('Application submitted successfully!');
        localStorage.setItem('onboarding_application_id', response.data.data.id);
        navigate('/onboarding/documents');
      } else {
        toast.error('Failed to submit application');
      }
    } catch (error) {
      console.error('Submission error:', error);
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(err.msg);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to submit application');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Owner Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                name="owner_first_name"
                value={formData.owner_first_name}
                onChange={handleChange}
                error={!!errors.owner_first_name}
                helperText={errors.owner_first_name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="owner_last_name"
                value={formData.owner_last_name}
                onChange={handleChange}
                error={!!errors.owner_last_name}
                helperText={errors.owner_last_name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                name="owner_email"
                type="email"
                value={formData.owner_email}
                onChange={handleChange}
                error={!!errors.owner_email}
                helperText={errors.owner_email}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="owner_phone"
                placeholder="+234 XXX XXX XXXX"
                value={formData.owner_phone}
                onChange={handleChange}
                error={!!errors.owner_phone}
                helperText={errors.owner_phone || "Nigerian format: +234 or 0XXX"}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="National Identification Number (NIN)"
                name="owner_nin"
                value={formData.owner_nin}
                onChange={handleChange}
                helperText="11-digit NIN (optional)"
              />
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Hospital Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hospital Name"
                name="hospital_name"
                value={formData.hospital_name}
                onChange={handleChange}
                error={!!errors.hospital_name}
                helperText={errors.hospital_name}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Hospital Type</InputLabel>
                <Select
                  name="hospital_type"
                  value={formData.hospital_type}
                  onChange={handleChange}
                  label="Hospital Type"
                >
                  <MenuItem value="General">General Hospital</MenuItem>
                  <MenuItem value="Specialist">Specialist Hospital</MenuItem>
                  <MenuItem value="Teaching">Teaching Hospital</MenuItem>
                  <MenuItem value="Private">Private Hospital</MenuItem>
                  <MenuItem value="Clinic">Clinic</MenuItem>
                  <MenuItem value="Diagnostic">Diagnostic Center</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hospital Address"
                name="hospital_address"
                multiline
                rows={2}
                value={formData.hospital_address}
                onChange={handleChange}
                error={!!errors.hospital_address}
                helperText={errors.hospital_address}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                name="hospital_city"
                value={formData.hospital_city}
                onChange={handleChange}
                error={!!errors.hospital_city}
                helperText={errors.hospital_city}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <NigerianStateSelect
                value={formData.hospital_state}
                onChange={(e) => handleChange({ target: { name: 'hospital_state', value: e.target.value }})}
                error={!!errors.hospital_state}
                helperText={errors.hospital_state}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Local Government Area (LGA)"
                name="hospital_lga"
                value={formData.hospital_lga}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Postal Code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        );
        
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Compliance & Operations
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CAC Registration Number"
                name="cac_registration_number"
                value={formData.cac_registration_number}
                onChange={handleChange}
                error={!!errors.cac_registration_number}
                helperText={errors.cac_registration_number || "Corporate Affairs Commission number"}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tax Identification Number (TIN)"
                name="tax_identification_number"
                value={formData.tax_identification_number}
                onChange={handleChange}
                error={!!errors.tax_identification_number}
                helperText={errors.tax_identification_number}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="NHIS Number"
                name="nhis_number"
                value={formData.nhis_number}
                onChange={handleChange}
                helperText="National Health Insurance Scheme number (optional)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Years in Operation"
                name="years_in_operation"
                type="number"
                value={formData.years_in_operation}
                onChange={handleChange}
                error={!!errors.years_in_operation}
                helperText={errors.years_in_operation}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Number of Staff"
                name="number_of_staff"
                type="number"
                value={formData.number_of_staff}
                onChange={handleChange}
                error={!!errors.number_of_staff}
                helperText={errors.number_of_staff}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Bed Capacity"
                name="bed_capacity"
                type="number"
                value={formData.bed_capacity}
                onChange={handleChange}
                error={!!errors.bed_capacity}
                helperText={errors.bed_capacity}
                required
              />
            </Grid>
          </Grid>
        );
        
      case 3:
        const specialtiesList = [
          'General Medicine', 'Surgery', 'Pediatrics', 'Obstetrics & Gynecology',
          'Cardiology', 'Neurology', 'Orthopedics', 'Radiology',
          'Oncology', 'Psychiatry', 'Dermatology', 'Ophthalmology'
        ];
        
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Facilities & Services
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Available Facilities
              </Typography>
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="has_emergency_unit"
                      checked={formData.has_emergency_unit}
                      onChange={handleChange}
                    />
                  }
                  label="24/7 Emergency Unit"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="has_laboratory"
                      checked={formData.has_laboratory}
                      onChange={handleChange}
                    />
                  }
                  label="Laboratory Services"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="has_pharmacy"
                      checked={formData.has_pharmacy}
                      onChange={handleChange}
                    />
                  }
                  label="In-house Pharmacy"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      name="has_radiology"
                      checked={formData.has_radiology}
                      onChange={handleChange}
                    />
                  }
                  label="Radiology/Imaging Services"
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Medical Specialties
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {specialtiesList.map((specialty) => (
                  <Chip
                    key={specialty}
                    label={specialty}
                    onClick={() => handleSpecialtyChange(specialty)}
                    color={formData.specialties.includes(specialty) ? 'primary' : 'default'}
                    variant={formData.specialties.includes(specialty) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        );
        
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Hospital Partner Application
        </Typography>
        <Typography variant="body1" color="textSecondary" align="center" sx={{ mb: 4 }}>
          Join GrandPro HMSO network of quality healthcare providers
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 3 }}>
          {activeStep === steps.length ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                Application Submitted Successfully!
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Your application has been received. Please proceed to upload required documents.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/onboarding/documents')}
                sx={{ mt: 3 }}
              >
                Upload Documents
              </Button>
            </Box>
          ) : (
            <>
              {renderStepContent(activeStep)}
              
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
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Submit Application'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default ApplicationForm;
