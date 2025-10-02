import React, { useState, useEffect } from 'react';
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
  IconButton,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Delete,
  CheckCircle,
  Warning,
  Info,
  PictureAsPdf,
  Image,
  Article,
  Download,
  Visibility
} from '@mui/icons-material';
import { uploadDocuments, updateOnboardingProgress, getHospitalDetails } from '../../services/onboarding.service';

const requiredDocuments = [
  { 
    type: 'license', 
    name: 'Hospital Operating License',
    description: 'Valid operating license from regulatory body',
    required: true,
    accepted: '.pdf, .jpg, .png'
  },
  {
    type: 'registration',
    name: 'Business Registration Certificate',
    description: 'CAC registration certificate',
    required: true,
    accepted: '.pdf, .jpg, .png'
  },
  {
    type: 'tax',
    name: 'Tax Clearance Certificate',
    description: 'Latest tax clearance certificate',
    required: true,
    accepted: '.pdf, .jpg, .png'
  },
  {
    type: 'insurance',
    name: 'Professional Indemnity Insurance',
    description: 'Valid professional insurance document',
    required: false,
    accepted: '.pdf'
  },
  {
    type: 'facility',
    name: 'Facility Photos',
    description: 'Photos of hospital facilities',
    required: false,
    accepted: '.jpg, .png'
  },
  {
    type: 'accreditation',
    name: 'Accreditation Certificates',
    description: 'Any relevant accreditation documents',
    required: false,
    accepted: '.pdf, .jpg, .png'
  }
];

function DocumentUpload() {
  const navigate = useNavigate();
  const [hospitalData, setHospitalData] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewDialog, setPreviewDialog] = useState({ open: false, file: null });
  
  const hospitalId = localStorage.getItem('currentHospitalId');
  const hospitalName = localStorage.getItem('currentHospitalName');

  useEffect(() => {
    if (!hospitalId) {
      navigate('/onboarding/application');
    } else {
      fetchHospitalDetails();
    }
  }, [hospitalId]);

  const fetchHospitalDetails = async () => {
    try {
      const response = await getHospitalDetails(hospitalId);
      if (response.success) {
        setHospitalData(response.hospital);
      }
    } catch (err) {
      console.error('Failed to fetch hospital details:', err);
    }
  };

  const handleFileSelect = (docType, event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const acceptedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
      
      if (!acceptedExtensions.includes(fileExtension)) {
        setError('Invalid file type. Please upload PDF, JPG, PNG, or DOC files.');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size too large. Maximum size is 10MB.');
        return;
      }
      
      setUploadedFiles(prev => ({
        ...prev,
        [docType]: file
      }));
      setError('');
    }
  };

  const handleRemoveFile = (docType) => {
    setUploadedFiles(prev => {
      const updated = { ...prev };
      delete updated[docType];
      return updated;
    });
  };

  const handlePreviewFile = (file) => {
    const fileUrl = URL.createObjectURL(file);
    setPreviewDialog({ open: true, file, url: fileUrl });
  };

  const handleClosePreview = () => {
    if (previewDialog.url) {
      URL.revokeObjectURL(previewDialog.url);
    }
    setPreviewDialog({ open: false, file: null, url: null });
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <PictureAsPdf color="error" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image color="primary" />;
      default:
        return <Article color="action" />;
    }
  };

  const handleUploadAll = async () => {
    // Check if all required documents are uploaded
    const requiredDocs = requiredDocuments.filter(doc => doc.required);
    const missingDocs = requiredDocs.filter(doc => !uploadedFiles[doc.type]);
    
    if (missingDocs.length > 0) {
      setError(`Please upload all required documents: ${missingDocs.map(d => d.name).join(', ')}`);
      return;
    }
    
    setUploading(true);
    setError('');
    setSuccess('');
    
    try {
      // Prepare files for upload
      const filesToUpload = Object.entries(uploadedFiles).map(([type, file]) => {
        file.type = type; // Add type to file object
        return file;
      });
      
      // Upload documents
      const result = await uploadDocuments(hospitalId, filesToUpload);
      
      if (result.success) {
        // Update onboarding progress
        await updateOnboardingProgress(hospitalId, 'documents', true);
        
        setSuccess('Documents uploaded successfully!');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/onboarding/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const calculateProgress = () => {
    const requiredCount = requiredDocuments.filter(d => d.required).length;
    const uploadedRequired = requiredDocuments
      .filter(d => d.required && uploadedFiles[d.type])
      .length;
    return (uploadedRequired / requiredCount) * 100;
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            <CloudUpload sx={{ mr: 1, verticalAlign: 'middle' }} />
            Document Upload
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Upload required documents for {hospitalName || 'your hospital'}
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Upload Progress
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={calculateProgress()} 
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="caption" color="textSecondary">
              {Object.keys(uploadedFiles).length} of {requiredDocuments.length} documents uploaded
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {requiredDocuments.map(doc => (
            <Grid item xs={12} md={6} key={doc.type}>
              <Card 
                variant="outlined" 
                sx={{ 
                  height: '100%',
                  borderColor: uploadedFiles[doc.type] ? 'success.main' : 'divider'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {doc.name}
                        {doc.required && (
                          <Chip 
                            label="Required" 
                            size="small" 
                            color="error" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {doc.description}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Accepted formats: {doc.accepted}
                      </Typography>
                    </Box>
                    {uploadedFiles[doc.type] && (
                      <CheckCircle color="success" />
                    )}
                  </Box>

                  {uploadedFiles[doc.type] ? (
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getFileIcon(uploadedFiles[doc.type].name)}
                        <Box sx={{ ml: 2, flexGrow: 1 }}>
                          <Typography variant="body2">
                            {uploadedFiles[doc.type].name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {(uploadedFiles[doc.type].size / 1024).toFixed(2)} KB
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handlePreviewFile(uploadedFiles[doc.type])}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveFile(doc.type)}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Paper>
                  ) : (
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<CloudUpload />}
                      sx={{ mt: 2 }}
                    >
                      Select File
                      <input
                        type="file"
                        hidden
                        accept={doc.accepted}
                        onChange={(e) => handleFileSelect(doc.type, e)}
                      />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 3 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/onboarding/application')}
          >
            Back to Application
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleUploadAll}
            disabled={uploading || Object.keys(uploadedFiles).length === 0}
            startIcon={uploading ? null : <CloudUpload />}
          >
            {uploading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Uploading...
              </>
            ) : (
              'Upload All Documents'
            )}
          </Button>
        </Box>
      </Paper>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog.open}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Preview Document
        </DialogTitle>
        <DialogContent>
          {previewDialog.file && (
            <Box sx={{ textAlign: 'center' }}>
              {previewDialog.file.type.startsWith('image/') ? (
                <img 
                  src={previewDialog.url} 
                  alt="Preview" 
                  style={{ maxWidth: '100%', maxHeight: '500px' }}
                />
              ) : (
                <Box sx={{ p: 4 }}>
                  {getFileIcon(previewDialog.file.name)}
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    {previewDialog.file.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Size: {(previewDialog.file.size / 1024).toFixed(2)} KB
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Type: {previewDialog.file.type}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default DocumentUpload;
