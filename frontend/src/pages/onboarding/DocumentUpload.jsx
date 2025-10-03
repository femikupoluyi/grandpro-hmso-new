import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CloudUpload,
  Description,
  CheckCircle,
  Warning,
  Delete,
  Visibility,
  FilePresent
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../services/api.config';

const DocumentUpload = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const applicationId = localStorage.getItem('onboarding_application_id');

  useEffect(() => {
    if (!applicationId) {
      toast.error('No application found. Please submit an application first.');
      navigate('/onboarding/application');
      return;
    }
    
    fetchDocumentTypes();
    fetchUploadedDocuments();
  }, [applicationId]);

  const fetchDocumentTypes = async () => {
    try {
      const response = await api.get('/onboarding/document-types');
      if (response.data.success) {
        setDocumentTypes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching document types:', error);
      toast.error('Failed to load document types');
    }
  };

  const fetchUploadedDocuments = async () => {
    try {
      // For now, we'll track uploaded documents in state
      // In production, you'd fetch from the backend
      const stored = localStorage.getItem(`uploaded_docs_${applicationId}`);
      if (stored) {
        setUploadedDocuments(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error fetching uploaded documents:', error);
    }
  };

  const handleFileSelect = (docType) => {
    setSelectedDocType(docType);
    setUploadDialogOpen(true);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const maxSize = (selectedDocType?.max_file_size_mb || 10) * 1024 * 1024;
      
      if (file.size > maxSize) {
        toast.error(`File size exceeds ${selectedDocType?.max_file_size_mb || 10}MB limit`);
        return;
      }
      
      const allowedFormats = (selectedDocType?.allowed_formats || 'pdf,jpg,png,doc,docx').split(',');
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (!allowedFormats.includes(fileExtension)) {
        toast.error(`Invalid file format. Allowed: ${allowedFormats.join(', ')}`);
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) return;
    
    setLoading(true);
    const progressKey = `${selectedDocType.id}_${Date.now()}`;
    
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('document_type_id', selectedDocType.id);
      formData.append('document_name', selectedDocType.name);
      
      // Simulate upload progress
      setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[progressKey] || 0;
          if (current < 90) {
            return { ...prev, [progressKey]: current + 10 };
          }
          return prev;
        });
      }, 200);
      
      const response = await api.upload(
        `/onboarding/applications/${applicationId}/documents`,
        formData,
        (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [progressKey]: percentCompleted }));
        }
      );
      
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
      
      if (response.data.success) {
        const newDoc = {
          id: response.data.data.id,
          document_type_id: selectedDocType.id,
          document_name: selectedDocType.name,
          original_filename: selectedFile.name,
          file_size: selectedFile.size,
          upload_date: new Date().toISOString(),
          is_verified: false
        };
        
        const updated = [...uploadedDocuments, newDoc];
        setUploadedDocuments(updated);
        localStorage.setItem(`uploaded_docs_${applicationId}`, JSON.stringify(updated));
        
        toast.success(`${selectedDocType.name} uploaded successfully!`);
        setUploadDialogOpen(false);
        setSelectedFile(null);
        
        // Remove progress after 2 seconds
        setTimeout(() => {
          setUploadProgress(prev => {
            const { [progressKey]: _, ...rest } = prev;
            return rest;
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
      setUploadProgress(prev => {
        const { [progressKey]: _, ...rest } = prev;
        return rest;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (docId) => {
    const updated = uploadedDocuments.filter(doc => doc.id !== docId);
    setUploadedDocuments(updated);
    localStorage.setItem(`uploaded_docs_${applicationId}`, JSON.stringify(updated));
    toast.info('Document removed');
  };

  const getUploadedDoc = (typeId) => {
    return uploadedDocuments.find(doc => doc.document_type_id === typeId);
  };

  const getRequiredDocsCount = () => {
    const required = documentTypes.filter(dt => dt.is_required);
    const uploaded = required.filter(dt => getUploadedDoc(dt.id));
    return { uploaded: uploaded.length, total: required.length };
  };

  const canProceed = () => {
    const { uploaded, total } = getRequiredDocsCount();
    return uploaded === total;
  };

  const handleProceedToReview = () => {
    if (canProceed()) {
      navigate('/onboarding/dashboard');
    } else {
      toast.warning('Please upload all required documents');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const { uploaded, total } = getRequiredDocsCount();
  const progress = total > 0 ? (uploaded / total) * 100 : 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Document Upload
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Upload required documents for your hospital partnership application
        </Typography>
        
        <Box sx={{ mt: 3, mb: 3 }}>
          <Alert severity="info">
            Please upload clear, legible copies of all required documents. Files must be in PDF, JPG, PNG, DOC, or DOCX format.
          </Alert>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Progress: {uploaded} of {total} required documents uploaded
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Required Documents
            </Typography>
            <List>
              {documentTypes.filter(dt => dt.is_required).map((docType) => {
                const uploadedDoc = getUploadedDoc(docType.id);
                const progressValue = uploadProgress[`${docType.id}_${Date.now()}`];
                
                return (
                  <ListItem key={docType.id} sx={{ mb: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <ListItemIcon>
                      {uploadedDoc ? (
                        <CheckCircle color="success" />
                      ) : (
                        <Warning color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={docType.name}
                      secondary={
                        <>
                          <Typography variant="caption" display="block">
                            {docType.description}
                          </Typography>
                          {uploadedDoc && (
                            <Typography variant="caption" color="success.main">
                              Uploaded: {uploadedDoc.original_filename}
                            </Typography>
                          )}
                          {progressValue !== undefined && (
                            <LinearProgress 
                              variant="determinate" 
                              value={progressValue} 
                              sx={{ mt: 1 }}
                            />
                          )}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      {uploadedDoc ? (
                        <>
                          <IconButton edge="end" aria-label="view">
                            <Visibility />
                          </IconButton>
                          <IconButton 
                            edge="end" 
                            aria-label="delete"
                            onClick={() => handleDelete(uploadedDoc.id)}
                          >
                            <Delete />
                          </IconButton>
                        </>
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<CloudUpload />}
                          onClick={() => handleFileSelect(docType)}
                        >
                          Upload
                        </Button>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Optional Documents
            </Typography>
            <List>
              {documentTypes.filter(dt => !dt.is_required).map((docType) => {
                const uploadedDoc = getUploadedDoc(docType.id);
                
                return (
                  <ListItem key={docType.id} sx={{ mb: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <ListItemIcon>
                      {uploadedDoc ? (
                        <CheckCircle color="success" />
                      ) : (
                        <Description />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={docType.name}
                      secondary={
                        <>
                          <Typography variant="caption" display="block">
                            {docType.description}
                          </Typography>
                          {uploadedDoc && (
                            <Typography variant="caption" color="success.main">
                              Uploaded: {uploadedDoc.original_filename}
                            </Typography>
                          )}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      {uploadedDoc ? (
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleDelete(uploadedDoc.id)}
                        >
                          <Delete />
                        </IconButton>
                      ) : (
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<CloudUpload />}
                          onClick={() => handleFileSelect(docType)}
                        >
                          Upload
                        </Button>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              })}
            </List>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/onboarding/application')}
          >
            Back to Application
          </Button>
          <Button
            variant="contained"
            onClick={handleProceedToReview}
            disabled={!canProceed()}
            endIcon={canProceed() ? <CheckCircle /> : <Warning />}
          >
            {canProceed() ? 'Proceed to Review' : `Upload ${total - uploaded} more required document(s)`}
          </Button>
        </Box>
      </Paper>
      
      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Upload {selectedDocType?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Accepted formats: {selectedDocType?.allowed_formats || 'PDF, JPG, PNG, DOC, DOCX'}
                <br />
                Maximum file size: {selectedDocType?.max_file_size_mb || 10}MB
              </Typography>
            </Alert>
            
            <input
              accept={selectedDocType?.allowed_formats?.split(',').map(f => `.${f}`).join(',') || '.pdf,.jpg,.png,.doc,.docx'}
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                startIcon={<CloudUpload />}
                sx={{ py: 2 }}
              >
                {selectedFile ? selectedFile.name : 'Choose File'}
              </Button>
            </label>
            
            {selectedFile && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  File: {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Size: {formatFileSize(selectedFile.size)}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DocumentUpload;
