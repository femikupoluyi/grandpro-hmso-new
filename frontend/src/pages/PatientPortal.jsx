import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Rating,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  LinearProgress,
  Badge,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  TextareaAutosize
} from '@mui/material';
import {
  Event,
  LocalHospital,
  Star,
  CardGiftcard,
  Notifications,
  Schedule,
  Message,
  Feedback,
  EmojiEvents,
  CheckCircle,
  Cancel,
  AccessTime,
  CalendarToday,
  LocationOn,
  Person,
  Phone,
  Email,
  Redeem,
  TrendingUp,
  History
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../services/api.config';
import { toast } from 'react-toastify';

const PatientPortal = () => {
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loyaltyData, setLoyaltyData] = useState({
    points: 0,
    tier: 'bronze',
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Appointment form data
  const [appointmentForm, setAppointmentForm] = useState({
    hospital_id: '',
    department: '',
    doctor_id: '',
    appointment_date: null,
    appointment_time: null,
    type: 'consultation',
    reason: ''
  });

  // Feedback form data
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'feedback',
    category: '',
    rating: 0,
    subject: '',
    message: ''
  });

  // Available rewards
  const rewards = [
    { id: 1, name: 'Free Consultation', points: 500, icon: <LocalHospital /> },
    { id: 2, name: '20% Discount on Lab Tests', points: 300, icon: <LocalHospital /> },
    { id: 3, name: 'Free Health Checkup', points: 1000, icon: <CheckCircle /> },
    { id: 4, name: 'Priority Appointment', points: 200, icon: <Schedule /> },
    { id: 5, name: '50% Off Pharmacy', points: 400, icon: <LocalHospital /> }
  ];

  useEffect(() => {
    fetchPatientData();
    fetchAppointments();
    fetchLoyaltyData();
  }, []);

  const fetchPatientData = async () => {
    try {
      const patientId = localStorage.getItem('patientId') || 1;
      const response = await api.get(`/api/crm-v2/patients/${patientId}`);
      setPatientData(response.data.data);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      // Use mock data
      setPatientData({
        id: 1,
        patient_code: 'PAT-001',
        first_name: 'Chioma',
        last_name: 'Okafor',
        email: 'chioma.okafor@email.com',
        phone: '+2348045678901',
        date_of_birth: '1990-05-15',
        gender: 'female',
        blood_group: 'O+',
        address: '15 Victoria Island, Lagos',
        city: 'Lagos',
        state: 'Lagos',
        emergency_contact_name: 'John Okafor',
        emergency_contact_phone: '+2348012345678'
      });
    }
  };

  const fetchAppointments = async () => {
    try {
      const patientId = localStorage.getItem('patientId') || 1;
      const response = await api.get(`/api/crm-v2/appointments?patient_id=${patientId}`);
      setAppointments(response.data.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      // Use mock data
      setAppointments([
        {
          id: 1,
          appointment_code: 'APT-001',
          hospital_name: 'Lagos Premier Hospital',
          department: 'General Medicine',
          doctor_name: 'Dr. Adebayo',
          appointment_date: '2025-10-15',
          appointment_time: '10:00:00',
          type: 'consultation',
          status: 'scheduled',
          reason: 'General checkup'
        },
        {
          id: 2,
          appointment_code: 'APT-002',
          hospital_name: 'Victoria Medical Center',
          department: 'Cardiology',
          doctor_name: 'Dr. Ibrahim',
          appointment_date: '2025-10-08',
          appointment_time: '14:30:00',
          type: 'follow_up',
          status: 'completed',
          reason: 'Follow-up visit'
        }
      ]);
    }
  };

  const fetchLoyaltyData = async () => {
    try {
      const patientId = localStorage.getItem('patientId') || 1;
      // Fetch loyalty data from API
      setLoyaltyData({
        points: 850,
        tier: 'silver',
        transactions: [
          { id: 1, type: 'earned', points: 100, description: 'Appointment completion', date: '2025-10-01' },
          { id: 2, type: 'earned', points: 200, description: 'Referral bonus', date: '2025-09-28' },
          { id: 3, type: 'redeemed', points: -300, description: 'Lab test discount', date: '2025-09-25' },
          { id: 4, type: 'earned', points: 100, description: 'Health survey', date: '2025-09-20' }
        ]
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      setLoading(false);
    }
  };

  const handleScheduleAppointment = async () => {
    try {
      const patientId = localStorage.getItem('patientId') || 1;
      const appointmentData = {
        patient_id: patientId,
        ...appointmentForm,
        appointment_date: appointmentForm.appointment_date?.toISOString().split('T')[0],
        appointment_time: appointmentForm.appointment_time?.toTimeString().slice(0, 5)
      };

      await api.post('/api/crm-v2/appointments', appointmentData);
      toast.success('Appointment scheduled successfully!');
      setAppointmentDialogOpen(false);
      fetchAppointments();
      
      // Award loyalty points
      setLoyaltyData(prev => ({
        ...prev,
        points: prev.points + 50
      }));
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast.error('Failed to schedule appointment');
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      const patientId = localStorage.getItem('patientId') || 1;
      const feedbackData = {
        source_type: 'patient',
        source_id: patientId,
        ...feedbackForm
      };

      await api.post('/api/crm-v2/feedback', feedbackData);
      toast.success('Thank you for your feedback!');
      setFeedbackDialogOpen(false);
      
      // Award loyalty points for feedback
      setLoyaltyData(prev => ({
        ...prev,
        points: prev.points + 25
      }));
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  const handleRedeemReward = (reward) => {
    if (loyaltyData.points >= reward.points) {
      setLoyaltyData(prev => ({
        ...prev,
        points: prev.points - reward.points,
        transactions: [
          {
            id: Date.now(),
            type: 'redeemed',
            points: -reward.points,
            description: reward.name,
            date: new Date().toISOString()
          },
          ...prev.transactions
        ]
      }));
      toast.success(`Successfully redeemed ${reward.name}!`);
      setRedeemDialogOpen(false);
    } else {
      toast.error('Insufficient points for this reward');
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      case 'platinum': return '#E5E4E2';
      default: return '#757575';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'confirmed': return 'success';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Patient Portal
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Welcome back, {patientData?.first_name}!
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<Event />}
            onClick={() => setAppointmentDialogOpen(true)}
          >
            Book Appointment
          </Button>
          <IconButton color="primary">
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box sx={{ color: 'white' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CardGiftcard sx={{ mr: 1 }} />
                  <Typography variant="h6">Loyalty Points</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                  {loyaltyData.points}
                </Typography>
                <Chip
                  label={`${loyaltyData.tier.toUpperCase()} TIER`}
                  sx={{
                    mt: 1,
                    backgroundColor: getTierColor(loyaltyData.tier),
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Event sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Upcoming</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {appointments.filter(a => a.status === 'scheduled').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Appointments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Completed</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                {appointments.filter(a => a.status === 'completed').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                This month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Star sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Next Reward</Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                {200 - (loyaltyData.points % 200)} points
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(loyaltyData.points % 200) / 2} 
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Appointments" icon={<Event />} />
          <Tab label="Medical Records" icon={<LocalHospital />} />
          <Tab label="Loyalty & Rewards" icon={<CardGiftcard />} />
          <Tab label="Messages" icon={<Message />} />
        </Tabs>

        {/* Appointments Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Appointments
            </Typography>
            <List>
              {appointments.map((appointment) => (
                <React.Fragment key={appointment.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <LocalHospital />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {appointment.hospital_name}
                          </Typography>
                          <Chip
                            label={appointment.status}
                            size="small"
                            color={getStatusColor(appointment.status)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {appointment.department} • {appointment.doctor_name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarToday fontSize="small" />
                              <Typography variant="caption">
                                {formatDate(appointment.appointment_date)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTime fontSize="small" />
                              <Typography variant="caption">
                                {appointment.appointment_time}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {appointment.status === 'scheduled' && (
                        <>
                          <IconButton edge="end" color="primary">
                            <CheckCircle />
                          </IconButton>
                          <IconButton edge="end" color="error">
                            <Cancel />
                          </IconButton>
                        </>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        {/* Medical Records Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Your medical records are securely stored and only accessible by authorized healthcare providers.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Personal Information
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Blood Group:</strong> {patientData?.blood_group}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Date of Birth:</strong> {formatDate(patientData?.date_of_birth)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Gender:</strong> {patientData?.gender}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Emergency Contact:</strong> {patientData?.emergency_contact_name}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Emergency Phone:</strong> {patientData?.emergency_contact_phone}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Visits
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="General Checkup"
                          secondary="Oct 1, 2025 - Dr. Adebayo"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Blood Test"
                          secondary="Sep 15, 2025 - Lagos Lab"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Vaccination"
                          secondary="Aug 20, 2025 - Dr. Ibrahim"
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Loyalty & Rewards Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Loyalty Program
              </Typography>
              <Button
                variant="contained"
                startIcon={<Redeem />}
                onClick={() => setRedeemDialogOpen(true)}
              >
                Redeem Points
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Points History
                    </Typography>
                    <List dense>
                      {loyaltyData.transactions.map((transaction) => (
                        <ListItem key={transaction.id}>
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              bgcolor: transaction.type === 'earned' ? 'success.light' : 'warning.light',
                              width: 32, 
                              height: 32 
                            }}>
                              {transaction.type === 'earned' ? '+' : '-'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={transaction.description}
                            secondary={formatDate(transaction.date)}
                          />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: transaction.type === 'earned' ? 'success.main' : 'warning.main',
                              fontWeight: 'bold' 
                            }}
                          >
                            {transaction.type === 'earned' ? '+' : ''}{transaction.points}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Tier Benefits
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmojiEvents sx={{ color: '#CD7F32' }} />
                        <Box>
                          <Typography variant="subtitle2">Bronze (0-499 points)</Typography>
                          <Typography variant="caption">5% discount on consultations</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmojiEvents sx={{ color: '#C0C0C0' }} />
                        <Box>
                          <Typography variant="subtitle2">Silver (500-999 points)</Typography>
                          <Typography variant="caption">10% discount + priority booking</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmojiEvents sx={{ color: '#FFD700' }} />
                        <Box>
                          <Typography variant="subtitle2">Gold (1000-2499 points)</Typography>
                          <Typography variant="caption">15% discount + free health checkup</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmojiEvents sx={{ color: '#E5E4E2' }} />
                        <Box>
                          <Typography variant="subtitle2">Platinum (2500+ points)</Typography>
                          <Typography variant="caption">20% discount + VIP services</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Messages Tab */}
        {activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Messages & Reminders
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Feedback />}
                onClick={() => setFeedbackDialogOpen(true)}
              >
                Send Feedback
              </Button>
            </Box>
            <List>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <Notifications />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Appointment Reminder"
                  secondary="Your appointment with Dr. Adebayo is tomorrow at 10:00 AM"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <CheckCircle />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Lab Results Available"
                  secondary="Your blood test results from Sep 15 are now available"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <Star />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Loyalty Points Earned"
                  secondary="You've earned 100 points for your recent visit!"
                />
              </ListItem>
            </List>
          </Box>
        )}
      </Paper>

      {/* Schedule Appointment Dialog */}
      <Dialog open={appointmentDialogOpen} onClose={() => setAppointmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule New Appointment</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Hospital"
              select
              value={appointmentForm.hospital_id}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, hospital_id: e.target.value })}
            >
              <MenuItem value="1">Lagos Premier Hospital</MenuItem>
              <MenuItem value="2">Victoria Medical Center</MenuItem>
              <MenuItem value="3">Abuja General Hospital</MenuItem>
            </TextField>
            
            <TextField
              fullWidth
              label="Department"
              select
              value={appointmentForm.department}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, department: e.target.value })}
            >
              <MenuItem value="general">General Medicine</MenuItem>
              <MenuItem value="cardiology">Cardiology</MenuItem>
              <MenuItem value="pediatrics">Pediatrics</MenuItem>
              <MenuItem value="orthopedics">Orthopedics</MenuItem>
            </TextField>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Appointment Date"
                value={appointmentForm.appointment_date}
                onChange={(newValue) => setAppointmentForm({ ...appointmentForm, appointment_date: newValue })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
            
            <TextField
              fullWidth
              label="Type"
              select
              value={appointmentForm.type}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, type: e.target.value })}
            >
              <MenuItem value="consultation">Consultation</MenuItem>
              <MenuItem value="follow_up">Follow-up</MenuItem>
              <MenuItem value="procedure">Procedure</MenuItem>
              <MenuItem value="emergency">Emergency</MenuItem>
            </TextField>
            
            <TextField
              fullWidth
              label="Reason for Visit"
              multiline
              rows={3}
              value={appointmentForm.reason}
              onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppointmentDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleScheduleAppointment}>Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Type"
              select
              value={feedbackForm.type}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, type: e.target.value })}
            >
              <MenuItem value="complaint">Complaint</MenuItem>
              <MenuItem value="suggestion">Suggestion</MenuItem>
              <MenuItem value="compliment">Compliment</MenuItem>
            </TextField>
            
            <TextField
              fullWidth
              label="Category"
              select
              value={feedbackForm.category}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
            >
              <MenuItem value="service">Service Quality</MenuItem>
              <MenuItem value="wait_time">Wait Time</MenuItem>
              <MenuItem value="staff">Staff Behavior</MenuItem>
              <MenuItem value="facility">Facility</MenuItem>
              <MenuItem value="billing">Billing</MenuItem>
            </TextField>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Rating
              </Typography>
              <Rating
                value={feedbackForm.rating}
                onChange={(e, newValue) => setFeedbackForm({ ...feedbackForm, rating: newValue })}
                size="large"
              />
            </Box>
            
            <TextField
              fullWidth
              label="Subject"
              value={feedbackForm.subject}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
            />
            
            <TextField
              fullWidth
              label="Message"
              multiline
              rows={4}
              value={feedbackForm.message}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitFeedback}>Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Redeem Rewards Dialog */}
      <Dialog open={redeemDialogOpen} onClose={() => setRedeemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Redeem Rewards</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            You have {loyaltyData.points} points available
          </Alert>
          <List>
            {rewards.map((reward) => (
              <ListItem key={reward.id}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: loyaltyData.points >= reward.points ? 'primary.main' : 'grey.400' }}>
                    {reward.icon}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={reward.name}
                  secondary={`${reward.points} points`}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={loyaltyData.points < reward.points}
                    onClick={() => handleRedeemReward(reward)}
                  >
                    Redeem
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRedeemDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PatientPortal;
