import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Description,
  Download,
  Draw,
  CheckCircle,
  Warning,
  PictureAsPdf,
  Visibility,
  Edit,
  Business,
  CalendarToday,
  AttachMoney,
  Schedule,
  Gavel,
  Print
} from '@mui/icons-material';
import SignatureCanvas from 'react-signature-canvas';
import onboardingService from '../../services/onboarding.service';

const contractSteps = ['Generate Contract', 'Review Terms', 'Digital Signature'];

function ContractReview() {
  const navigate = useNavigate();
  const signaturePad = useRef(null);
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hospital, setHospital] = useState(null);
  const [contract, setContract] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signatureDialog, setSignatureDialog] = useState(false);
  const [agreementChecked, setAgreementChecked] = useState(false);
  
  const [contractForm, setContractForm] = useState({
    commissionRate: 15,
    contractDuration: 12,
    signerName: '',
    signerRole: '',
    signerEmail: ''
  });
  
  const hospitalId = localStorage.getItem('currentHospitalId');
  const hospitalName = localStorage.getItem('currentHospitalName');

  useEffect(() => {
    if (!hospitalId) {
      navigate('/onboarding/application');
    } else {
      fetchInitialData();
    }
  }, [hospitalId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch hospital details
      const hospitalResponse = await getHospitalDetails(hospitalId);
      if (hospitalResponse.success) {
        setHospital(hospitalResponse.hospital);
        
        // Pre-fill signer information if owner exists
        if (hospitalResponse.hospital.owner) {
          setContractForm(prev => ({
            ...prev,
            signerName: hospitalResponse.hospital.owner.owner_name || '',
            signerEmail: hospitalResponse.hospital.owner.owner_email || '',
            signerRole: 'Hospital Director'
          }));
        }
      }

      // Check for existing contracts
      const contractsResponse = await getAllContracts();
      if (contractsResponse.success) {
        setContracts(contractsResponse.contracts);
        
        // Find contract for this hospital
        const existingContract = contractsResponse.contracts.find(
          c => c.hospital_id === hospitalId
        );
        
        if (existingContract) {
          setContract(existingContract);
          
          // Set step based on contract status
          if (existingContract.status === 'DRAFT') {
            setActiveStep(1); // Review stage
          } else if (existingContract.status === 'signed') {
            setActiveStep(2); // Already signed
          }
        }
      }
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Initial data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContract = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const contractData = {
        hospitalId: hospitalId,
        hospitalName: hospital?.name || hospitalName,
        ownerName: contractForm.signerName,
        ownerEmail: contractForm.signerEmail,
        commissionRate: contractForm.commissionRate,
        contractDuration: contractForm.contractDuration,
        contractTerms: `
          This Service Agreement is entered into between GrandPro HMSO and ${hospital?.name || hospitalName}.
          
          Terms and Conditions:
          1. Service Duration: ${contractForm.contractDuration} months
          2. Commission Rate: ${contractForm.commissionRate}% on monthly revenue
          3. Services Provided: Complete hospital management system including EMR, billing, inventory, and analytics
          4. Support: 24/7 technical support and regular system updates
          5. Data Security: End-to-end encryption and HIPAA compliance
          6. Payment Terms: Monthly invoicing with NET 30 payment terms
          7. Termination: Either party may terminate with 30 days written notice
          8. Governing Law: Laws of the Federal Republic of Nigeria
        `
      };
      
      const result = await onboardingService.generateContract(contractData);
      
      if (result.success) {
        setContract(result.contract);
        await updateOnboardingProgress(hospitalId, 'contract_generation', true);
        setSuccess('Contract generated successfully!');
        setActiveStep(1);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async () => {
    if (!signaturePad.current || signaturePad.current.isEmpty()) {
      setError('Please provide your signature');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const signatureData = signaturePad.current.toDataURL();
      
      const result = await onboardingService.signContract(contract.id, {
        signatureData,
        signerName: contractForm.signerName,
        signerRole: contractForm.signerRole
      });
      
      if (result.success) {
        await updateOnboardingProgress(hospitalId, 'contract_signing', true);
        setContract(result.contract);
        setSuccess('Contract signed successfully!');
        setSignatureDialog(false);
        setActiveStep(2);
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/onboarding/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearSignature = () => {
    if (signaturePad.current) {
      signaturePad.current.clear();
    }
  };

  const downloadContract = () => {
    if (contract?.pdf_url) {
      const link = document.createElement('a');
      link.href = `http://localhost:5001${contract.pdf_url}`;
      link.download = `Contract_${contract.contract_number}.pdf`;
      link.click();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !contract) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
          Service Contract
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {contractSteps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 1: Generate Contract */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Contract Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      <Business /> Hospital Details
                    </Typography>
                    <Typography variant="body2">
                      {hospital?.name || hospitalName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {hospital?.address}, {hospital?.city}, {hospital?.state}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Commission Rate (%)"
                  type="number"
                  value={contractForm.commissionRate}
                  onChange={(e) => setContractForm(prev => ({ ...prev, commissionRate: e.target.value }))}
                  InputProps={{
                    endAdornment: '%'
                  }}
                  helperText="Percentage of monthly revenue"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contract Duration (months)"
                  type="number"
                  value={contractForm.contractDuration}
                  onChange={(e) => setContractForm(prev => ({ ...prev, contractDuration: e.target.value }))}
                  helperText="Length of service agreement"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Authorized Signer Name"
                  value={contractForm.signerName}
                  onChange={(e) => setContractForm(prev => ({ ...prev, signerName: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Signer Role/Title"
                  value={contractForm.signerRole}
                  onChange={(e) => setContractForm(prev => ({ ...prev, signerRole: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Signer Email"
                  type="email"
                  value={contractForm.signerEmail}
                  onChange={(e) => setContractForm(prev => ({ ...prev, signerEmail: e.target.value }))}
                  required
                />
              </Grid>
            </Grid>

            {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 3 }}>{success}</Alert>}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleGenerateContract}
                disabled={loading || !contractForm.signerName || !contractForm.signerEmail}
                startIcon={loading ? <CircularProgress size={20} /> : <Description />}
              >
                {loading ? 'Generating...' : 'Generate Contract'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 2: Review Contract */}
        {activeStep === 1 && contract && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Contract Terms
            </Typography>

            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Description color="primary" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Contract Number
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {contract.contract_number}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarToday color="primary" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Contract Period
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <AttachMoney color="primary" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Commission Rate
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {contract.commission_rate || contract.revenue_share_percentage}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Schedule color="primary" sx={{ mr: 1 }} />
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Duration
                        </Typography>
                        <Typography variant="body1">
                          {contract.duration_months} months
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" gutterBottom>
                <Gavel sx={{ mr: 1, verticalAlign: 'middle' }} />
                Contract Terms
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {contract.contract_terms || 'Standard GrandPro HMSO Terms and Conditions'}
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              {contract.pdf_url && (
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={downloadContract}
                >
                  Download PDF
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<Print />}
                onClick={() => window.print()}
              >
                Print Contract
              </Button>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                />
              }
              label="I have read and agree to the terms and conditions"
            />

            {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mt: 3 }}>{success}</Alert>}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
              >
                Back
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => setSignatureDialog(true)}
                disabled={!agreementChecked}
                startIcon={<Draw />}
              >
                Proceed to Sign
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 3: Contract Signed */}
        {activeStep === 2 && contract && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Contract Signed Successfully! 
              </Typography>
              <Typography variant="body2">
                Your service agreement has been executed and is now active.
              </Typography>
            </Alert>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contract Summary
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Contract Number"
                      secondary={contract.contract_number}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Status"
                      secondary={
                        <Chip
                          label={contract.status}
                          color="success"
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Signed By"
                      secondary={contract.signer_name || contractForm.signerName}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Signed Date"
                      secondary={formatDate(contract.signed_date)}
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {contract.pdf_url && (
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={downloadContract}
                    >
                      Download Signed Contract
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/onboarding/dashboard')}
                  >
                    Continue to Dashboard
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </Paper>

      {/* Signature Dialog */}
      <Dialog
        open={signatureDialog}
        onClose={() => setSignatureDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Digital Signature
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Please sign below to execute the contract
          </Typography>
          
          <Box sx={{ border: '1px solid #ddd', borderRadius: 1, mt: 2 }}>
            <SignatureCanvas
              ref={signaturePad}
              canvasProps={{
                width: 500,
                height: 200,
                className: 'signature-canvas'
              }}
            />
          </Box>
          
          <Button
            size="small"
            onClick={clearSignature}
            sx={{ mt: 1 }}
          >
            Clear Signature
          </Button>
          
          <TextField
            fullWidth
            label="Full Name"
            value={contractForm.signerName}
            onChange={(e) => setContractForm(prev => ({ ...prev, signerName: e.target.value }))}
            sx={{ mt: 2 }}
            disabled
          />
          
          <TextField
            fullWidth
            label="Title"
            value={contractForm.signerRole}
            onChange={(e) => setContractForm(prev => ({ ...prev, signerRole: e.target.value }))}
            sx={{ mt: 2 }}
            disabled
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignatureDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSignContract}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {loading ? 'Signing...' : 'Sign Contract'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ContractReview;
