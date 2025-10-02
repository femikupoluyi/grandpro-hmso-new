import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Chip,
  Rating,
  Paper,
  Divider,
  Alert,
  LinearProgress,
  Tab,
  Tabs,
  Badge,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Snackbar
} from '@mui/material';
import {
  CalendarMonth,
  AccessTime,
  LocalHospital,
  Feedback,
  CardGiftcard,
  Notifications,
  Delete,
  Edit,
  CheckCircle,
  Schedule,
  Cancel,
  Person,
  Phone,
  Email,
  WhatsApp,
  EmojiEvents,
  Star,
  TrendingUp,
  MedicalServices,
  NotificationsActive,
  History
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { format, addDays, isAfter } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const PatientPortal = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentDialog, setAppointmentDialog] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [rescheduleDialog, setRescheduleDialog] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: true,
    whatsapp: false,
    reminderTime: 24
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [activeStep, setActiveStep] = useState(0);

  // New appointment form state
  const [newAppointment, setNewAppointment] = useState({
    department: '',
    doctor: '',
    date: null,
    time: null,
    reason: '',
    urgency: 'routine'
  });

  // Feedback form state
  const [feedback, setFeedback] = useState({
    appointmentId: '',
    rating: 5,
    doctorRating: 5,
    facilityRating: 5,
    category: 'general',
    comments: '',
    wouldRecommend: true
  });

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      // Fetch appointments
      const appointmentsRes = await api.get(`/api/crm/patients/${user.id}/appointments`);
      setAppointments(appointmentsRes.data.appointments || []);

      // Fetch loyalty points
      const loyaltyRes = await api.get(`/api/crm/patients/${user.id}/loyalty`);
      setLoyaltyPoints(loyaltyRes.data.points || 0);

      // Fetch notifications
      const notificationsRes = await api.get(`/api/crm/patients/${user.id}/notifications`);
      setNotifications(notificationsRes.data.notifications || []);

      // Fetch feedback history
      const feedbackRes = await api.get(`/api/crm/patients/${user.id}/feedback`);
      setFeedbackHistory(feedbackRes.data.feedback || []);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      // Use sample data if API fails
      setSampleData();
    } finally {
      setLoading(false);
    }
  };

  const setSampleData = () => {
    // Sample appointments
    setAppointments([
      {
        id: 1,
        date: '2025-10-15',
        time: '10:00 AM',
        doctor: 'Dr. Adebayo Williams',
        department: 'Cardiology',
        status: 'confirmed',
        hospital: 'Lagos Premier Hospital'
      },
      {
        id: 2,
        date: '2025-10-08',
        time: '2:30 PM',
        doctor: 'Dr. Funke Okonkwo',
        department: 'General Medicine',
        status: 'completed',
        hospital: 'Victoria Medical Centre'
      },
      {
        id: 3,
        date: '2025-11-02',
        time: '11:00 AM',
        doctor: 'Dr. Ibrahim Sani',
        department: 'Orthopedics',
        status: 'scheduled',
        hospital: 'Lagos Premier Hospital'
      }
    ]);

    // Sample loyalty points
    setLoyaltyPoints(1250);

    // Sample notifications
    setNotifications([
      {
        id: 1,
        type: 'reminder',
        message: 'Appointment reminder: Tomorrow at 10:00 AM with Dr. Williams',
        date: '2025-10-14',
        read: false
      },
      {
        id: 2,
        type: 'reward',
        message: 'You earned 50 loyalty points for your recent visit!',
        date: '2025-10-08',
        read: true
      }
    ]);

    // Sample feedback
    setFeedbackHistory([
      {
        id: 1,
        date: '2025-10-08',
        doctor: 'Dr. Funke Okonkwo',
        rating: 5,
        comments: 'Excellent service and care'
      },
      {
        id: 2,
        date: '2025-09-20',
        doctor: 'Dr. Adebayo Williams',
        rating: 4,
        comments: 'Very professional, minimal wait time'
      }
    ]);
  };

  const handleBookAppointment = async () => {
    try {
      const appointmentData = {
        ...newAppointment,
        patientId: user.id,
        patientName: `${user.firstName} ${user.lastName}`,
        patientEmail: user.email,
        patientPhone: user.phone,
        hospitalId: 1,
        sendReminder: true,
        reminderType: notificationSettings.sms ? 'sms' : 'email'
      };

      await api.post('/api/crm/patients/appointments', appointmentData);
      setSnackbar({ open: true, message: 'Appointment booked successfully!', severity: 'success' });
      setAppointmentDialog(false);
      fetchPatientData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to book appointment', severity: 'error' });
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      await api.post('/api/crm/patients/feedback', {
        ...feedback,
        patientId: user.id
      });
      
      // Award loyalty points for feedback
      await api.post('/api/crm/patients/loyalty/add', {
        patientId: user.id,
        points: 25,
        reason: 'Feedback submission'
      });

      setSnackbar({ open: true, message: 'Thank you for your feedback! You earned 25 points!', severity: 'success' });
      setFeedbackDialog(false);
      fetchPatientData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to submit feedback', severity: 'error' });
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await api.post(`/api/crm/patients/appointments/${appointmentId}/cancel`);
      setSnackbar({ open: true, message: 'Appointment cancelled successfully', severity: 'success' });
      fetchPatientData();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to cancel appointment', severity: 'error' });
    }
  };

  const handleUpdateNotificationSettings = async () => {
    try {
      await api.put(`/api/crm/patients/${user.id}/notification-settings`, notificationSettings);
      setSnackbar({ open: true, message: 'Notification settings updated', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update settings', severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'success';
      case 'scheduled':
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const appointmentSteps = ['Select Department', 'Choose Doctor', 'Pick Date & Time', 'Confirm'];

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Patient Portal
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Welcome back, {user?.firstName} {user?.lastName}
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <CalendarMonth />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {appointments.filter(a => a.status !== 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Upcoming Appointments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {appointments.filter(a => a.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Completed Visits
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <CardGiftcard />
                </Avatar>
                <Box>
                  <Typography variant="h6">{loyaltyPoints}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Loyalty Points
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h6">4.8</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Average Rating Given
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Appointments" />
          <Tab label="Medical History" />
          <Tab label="Feedback" />
          <Tab label="Loyalty Rewards" />
          <Tab label="Notifications" />
        </Tabs>
      </Paper>

      {/* Appointments Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">My Appointments</Typography>
                  <Button
                    variant="contained"
                    startIcon={<CalendarMonth />}
                    onClick={() => setAppointmentDialog(true)}
                  >
                    Book Appointment
                  </Button>
                </Box>

                <List>
                  {appointments.map((appointment) => (
                    <React.Fragment key={appointment.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>
                            <LocalHospital />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                {appointment.doctor}
                              </Typography>
                              <Chip 
                                label={appointment.status} 
                                size="small" 
                                color={getStatusColor(appointment.status)}
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2">
                                {appointment.department} • {appointment.hospital}
                              </Typography>
                              <Typography variant="body2" color="primary">
                                {appointment.date} at {appointment.time}
                              </Typography>
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          {appointment.status === 'scheduled' && (
                            <>
                              <IconButton edge="end" onClick={() => {
                                setSelectedAppointment(appointment);
                                setRescheduleDialog(true);
                              }}>
                                <Edit />
                              </IconButton>
                              <IconButton 
                                edge="end" 
                                onClick={() => handleCancelAppointment(appointment.id)}
                              >
                                <Cancel />
                              </IconButton>
                            </>
                          )}
                          {appointment.status === 'completed' && (
                            <Button
                              size="small"
                              startIcon={<Feedback />}
                              onClick={() => {
                                setFeedback({ ...feedback, appointmentId: appointment.id });
                                setFeedbackDialog(true);
                              }}
                            >
                              Give Feedback
                            </Button>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Medical History Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Medical History</Typography>
                <List>
                  {appointments.filter(a => a.status === 'completed').map((visit) => (
                    <React.Fragment key={visit.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <History />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`Visit to ${visit.department}`}
                          secondary={
                            <>
                              <Typography variant="body2">
                                Doctor: {visit.doctor}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                Date: {visit.date} • Hospital: {visit.hospital}
                              </Typography>
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Button size="small" variant="outlined">
                            View Details
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Feedback Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">Feedback History</Typography>
                  <Button
                    variant="contained"
                    startIcon={<Feedback />}
                    onClick={() => setFeedbackDialog(true)}
                  >
                    Submit Feedback
                  </Button>
                </Box>

                <List>
                  {feedbackHistory.map((item) => (
                    <React.Fragment key={item.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <Star />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                {item.doctor}
                              </Typography>
                              <Rating value={item.rating} readOnly size="small" />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2">
                                {item.comments}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Submitted on {item.date}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Loyalty Rewards Tab */}
      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Loyalty Program</Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h3" color="primary">
                    {loyaltyPoints}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Available Points
                  </Typography>
                </Box>

                <Typography variant="subtitle1" gutterBottom>
                  How to Earn Points
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Complete an appointment" 
                      secondary="+100 points"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Submit feedback" 
                      secondary="+25 points"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Refer a friend" 
                      secondary="+200 points"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Annual health checkup" 
                      secondary="+150 points"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Available Rewards</Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Free Health Checkup"
                      secondary="1,000 points"
                    />
                    <Button size="small" disabled={loyaltyPoints < 1000}>
                      Redeem
                    </Button>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="10% Discount on Services"
                      secondary="500 points"
                    />
                    <Button size="small" disabled={loyaltyPoints < 500}>
                      Redeem
                    </Button>
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Priority Appointment"
                      secondary="300 points"
                    />
                    <Button size="small" disabled={loyaltyPoints < 300}>
                      Redeem
                    </Button>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Notifications Tab */}
      {tabValue === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Notifications</Typography>
                <List>
                  {notifications.map((notification) => (
                    <React.Fragment key={notification.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: notification.read ? 'grey.400' : 'primary.main' }}>
                            {notification.type === 'reminder' ? <Schedule /> : <NotificationsActive />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={notification.message}
                          secondary={notification.date}
                        />
                        <ListItemSecondaryAction>
                          {!notification.read && (
                            <Chip label="New" color="primary" size="small" />
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Notification Settings</Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Email Notifications" />
                    <Switch
                      checked={notificationSettings.email}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        email: e.target.checked
                      })}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="SMS Notifications" />
                    <Switch
                      checked={notificationSettings.sms}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        sms: e.target.checked
                      })}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="WhatsApp Notifications" />
                    <Switch
                      checked={notificationSettings.whatsapp}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        whatsapp: e.target.checked
                      })}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Reminder Time" secondary={`${notificationSettings.reminderTime} hours before`} />
                  </ListItem>
                </List>
                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={handleUpdateNotificationSettings}
                  sx={{ mt: 2 }}
                >
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Book Appointment Dialog */}
      <Dialog open={appointmentDialog} onClose={() => setAppointmentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Book New Appointment</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {appointmentSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <FormControl fullWidth>
              <InputLabel>Select Department</InputLabel>
              <Select
                value={newAppointment.department}
                onChange={(e) => setNewAppointment({ ...newAppointment, department: e.target.value })}
              >
                <MenuItem value="cardiology">Cardiology</MenuItem>
                <MenuItem value="orthopedics">Orthopedics</MenuItem>
                <MenuItem value="general">General Medicine</MenuItem>
                <MenuItem value="pediatrics">Pediatrics</MenuItem>
                <MenuItem value="gynecology">Gynecology</MenuItem>
              </Select>
            </FormControl>
          )}

          {activeStep === 1 && (
            <FormControl fullWidth>
              <InputLabel>Select Doctor</InputLabel>
              <Select
                value={newAppointment.doctor}
                onChange={(e) => setNewAppointment({ ...newAppointment, doctor: e.target.value })}
              >
                <MenuItem value="Dr. Adebayo Williams">Dr. Adebayo Williams</MenuItem>
                <MenuItem value="Dr. Funke Okonkwo">Dr. Funke Okonkwo</MenuItem>
                <MenuItem value="Dr. Ibrahim Sani">Dr. Ibrahim Sani</MenuItem>
              </Select>
            </FormControl>
          )}

          {activeStep === 2 && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DatePicker
                    label="Select Date"
                    value={newAppointment.date}
                    onChange={(newValue) => setNewAppointment({ ...newAppointment, date: newValue })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    minDate={new Date()}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TimePicker
                    label="Select Time"
                    value={newAppointment.time}
                    onChange={(newValue) => setNewAppointment({ ...newAppointment, time: newValue })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reason for Visit"
                    value={newAppointment.reason}
                    onChange={(e) => setNewAppointment({ ...newAppointment, reason: e.target.value })}
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          )}

          {activeStep === 3 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Please confirm your appointment details
              </Alert>
              <Typography variant="body1" gutterBottom>
                <strong>Department:</strong> {newAppointment.department}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Doctor:</strong> {newAppointment.doctor}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Date:</strong> {newAppointment.date ? format(new Date(newAppointment.date), 'PPP') : ''}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Time:</strong> {newAppointment.time ? format(new Date(newAppointment.time), 'p') : ''}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Reason:</strong> {newAppointment.reason}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAppointmentDialog(false)}>Cancel</Button>
          {activeStep > 0 && (
            <Button onClick={() => setActiveStep(activeStep - 1)}>Back</Button>
          )}
          {activeStep < appointmentSteps.length - 1 && (
            <Button variant="contained" onClick={() => setActiveStep(activeStep + 1)}>
              Next
            </Button>
          )}
          {activeStep === appointmentSteps.length - 1 && (
            <Button variant="contained" onClick={handleBookAppointment}>
              Confirm Booking
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialog} onClose={() => setFeedbackDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>Overall Experience</Typography>
            <Rating
              value={feedback.rating}
              onChange={(e, newValue) => setFeedback({ ...feedback, rating: newValue })}
              size="large"
            />

            <Typography gutterBottom sx={{ mt: 2 }}>Doctor Rating</Typography>
            <Rating
              value={feedback.doctorRating}
              onChange={(e, newValue) => setFeedback({ ...feedback, doctorRating: newValue })}
            />

            <Typography gutterBottom sx={{ mt: 2 }}>Facility Rating</Typography>
            <Rating
              value={feedback.facilityRating}
              onChange={(e, newValue) => setFeedback({ ...feedback, facilityRating: newValue })}
            />

            <TextField
              fullWidth
              label="Comments"
              value={feedback.comments}
              onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
              multiline
              rows={4}
              margin="normal"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={feedback.wouldRecommend}
                  onChange={(e) => setFeedback({ ...feedback, wouldRecommend: e.target.checked })}
                />
              }
              label="Would you recommend this hospital to others?"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitFeedback}>
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PatientPortal;
