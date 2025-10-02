import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Rating,
  Alert,
  Tab,
  Tabs,
  Divider,
  LinearProgress,
  Badge
} from '@mui/material';
import {
  CalendarToday,
  LocalHospital,
  Notifications,
  Star,
  CardGiftcard,
  History,
  Add,
  Edit,
  Delete,
  AccessTime,
  Person,
  Phone,
  Email,
  LocationOn,
  Favorite,
  MedicalServices,
  Description,
  CheckCircle,
  Schedule,
  NotificationsActive
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { useAuth } from '../../hooks/useAuth';
import crmService from '../../services/crm.service';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PatientPortal = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [patientData, setPatientData] = useState({
    profile: null,
    appointments: [],
    reminders: [],
    feedback: [],
    loyaltyPoints: 0,
    rewards: [],
    medicalHistory: []
  });
  const [openAppointmentDialog, setOpenAppointmentDialog] = useState(false);
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newAppointment, setNewAppointment] = useState({
    hospitalId: '',
    doctorId: '',
    date: new Date(),
    time: new Date(),
    reason: '',
    type: 'CONSULTATION'
  });
  const [newFeedback, setNewFeedback] = useState({
    appointmentId: '',
    rating: 0,
    comment: '',
    wouldRecommend: true
  });
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetchPatientData();
    fetchHospitals();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      // Fetch patient profile
      const profileRes = await crmService.getPatientProfile(user.id);
      
      // Fetch appointments
      const appointmentsRes = await crmService.getPatientAppointments(user.id);
      
      // Fetch reminders
      const remindersRes = await crmService.getPatientReminders(user.id);
      
      // Fetch feedback history
      const feedbackRes = await crmService.getPatientFeedback(user.id);
      
      // Fetch loyalty points and rewards
      const loyaltyRes = await crmService.getPatientLoyalty(user.id);
      
      // Fetch medical history
      const historyRes = await crmService.getPatientMedicalHistory(user.id);

      setPatientData({
        profile: profileRes.data,
        appointments: appointmentsRes.data || [],
        reminders: remindersRes.data || [],
        feedback: feedbackRes.data || [],
        loyaltyPoints: loyaltyRes.data?.points || 0,
        rewards: loyaltyRes.data?.rewards || [],
        medicalHistory: historyRes.data || []
      });

    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await crmService.getHospitals();
      setHospitals(res.data || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const fetchDoctors = async (hospitalId) => {
    try {
      const res = await crmService.getDoctorsByHospital(hospitalId);
      setDoctors(res.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBookAppointment = () => {
    setSelectedAppointment(null);
    setNewAppointment({
      hospitalId: '',
      doctorId: '',
      date: new Date(),
      time: new Date(),
      reason: '',
      type: 'CONSULTATION'
    });
    setOpenAppointmentDialog(true);
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setNewAppointment({
      ...appointment,
      date: new Date(appointment.date),
      time: new Date(appointment.time)
    });
    setOpenAppointmentDialog(true);
  };

  const handleSaveAppointment = async () => {
    try {
      if (selectedAppointment) {
        await crmService.updateAppointment(selectedAppointment.id, newAppointment);
      } else {
        await crmService.createAppointment({
          ...newAppointment,
          patientId: user.id
        });
      }
      setOpenAppointmentDialog(false);
      fetchPatientData();
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await crmService.cancelAppointment(appointmentId);
      fetchPatientData();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      await crmService.submitFeedback({
        ...newFeedback,
        patientId: user.id
      });
      setOpenFeedbackDialog(false);
      setNewFeedback({
        appointmentId: '',
        rating: 0,
        comment: '',
        wouldRecommend: true
      });
      fetchPatientData();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const getAppointmentStatusColor = (status) => {
    const colors = {
      'SCHEDULED': 'primary',
      'CONFIRMED': 'success',
      'IN_PROGRESS': 'warning',
      'COMPLETED': 'default',
      'CANCELLED': 'error',
      'NO_SHOW': 'error'
    };
    return colors[status] || 'default';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit'
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Patient Portal
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {patientData.profile?.name || user.name}
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarToday color="primary" sx={{ mr: 2 }} />
                <Typography color="text.secondary" variant="body2">
                  Upcoming Appointments
                </Typography>
              </Box>
              <Typography variant="h4">
                {patientData.appointments.filter(a => 
                  a.status === 'SCHEDULED' || a.status === 'CONFIRMED'
                ).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsActive color="warning" sx={{ mr: 2 }} />
                <Typography color="text.secondary" variant="body2">
                  Active Reminders
                </Typography>
              </Box>
              <Typography variant="h4">
                {patientData.reminders.filter(r => r.active).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CardGiftcard color="success" sx={{ mr: 2 }} />
                <Typography color="text.secondary" variant="body2">
                  Loyalty Points
                </Typography>
              </Box>
              <Typography variant="h4">{patientData.loyaltyPoints}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Star color="info" sx={{ mr: 2 }} />
                <Typography color="text.secondary" variant="body2">
                  Feedback Given
                </Typography>
              </Box>
              <Typography variant="h4">{patientData.feedback.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Appointments" />
          <Tab label="Reminders" />
          <Tab label="Medical History" />
          <Tab label="Feedback" />
          <Tab label="Rewards" />
        </Tabs>

        {/* Appointments Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={handleBookAppointment}
            >
              Book New Appointment
            </Button>
          </Box>

          <List>
            {patientData.appointments.map((appointment) => (
              <React.Fragment key={appointment.id}>
                <ListItem>
                  <ListItemIcon>
                    <Avatar>
                      <LocalHospital />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6">
                          {appointment.hospitalName}
                        </Typography>
                        <Chip 
                          label={appointment.status}
                          color={getAppointmentStatusColor(appointment.status)}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          <Person sx={{ fontSize: 16, mr: 1 }} />
                          Dr. {appointment.doctorName}
                        </Typography>
                        <Typography variant="body2">
                          <CalendarToday sx={{ fontSize: 16, mr: 1 }} />
                          {formatDate(appointment.date)}
                        </Typography>
                        <Typography variant="body2">
                          <AccessTime sx={{ fontSize: 16, mr: 1 }} />
                          {formatTime(appointment.time)}
                        </Typography>
                        <Typography variant="body2">
                          <MedicalServices sx={{ fontSize: 16, mr: 1 }} />
                          {appointment.reason}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {(appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED') && (
                      <>
                        <IconButton onClick={() => handleEditAppointment(appointment)}>
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleCancelAppointment(appointment.id)}>
                          <Delete />
                        </IconButton>
                      </>
                    )}
                    {appointment.status === 'COMPLETED' && !appointment.feedbackGiven && (
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => {
                          setNewFeedback({ ...newFeedback, appointmentId: appointment.id });
                          setOpenFeedbackDialog(true);
                        }}
                      >
                        Give Feedback
                      </Button>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
          
          {patientData.appointments.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No appointments scheduled
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Reminders Tab */}
        <TabPanel value={tabValue} index={1}>
          <List>
            {patientData.reminders.map((reminder) => (
              <React.Fragment key={reminder.id}>
                <ListItem>
                  <ListItemIcon>
                    <Badge 
                      color={reminder.priority === 'HIGH' ? 'error' : 'primary'} 
                      variant="dot"
                    >
                      <NotificationsActive />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText
                    primary={reminder.title}
                    secondary={
                      <Box>
                        <Typography variant="body2">{reminder.message}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {reminder.frequency} • Next: {formatDate(reminder.nextReminder)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip 
                      label={reminder.active ? 'Active' : 'Inactive'}
                      color={reminder.active ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
          
          {patientData.reminders.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No reminders set
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Medical History Tab */}
        <TabPanel value={tabValue} index={2}>
          <List>
            {patientData.medicalHistory.map((record) => (
              <React.Fragment key={record.id}>
                <ListItem>
                  <ListItemIcon>
                    <Description />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6">{record.visitType}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(record.date)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          <strong>Hospital:</strong> {record.hospitalName}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Doctor:</strong> {record.doctorName}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Diagnosis:</strong> {record.diagnosis}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Treatment:</strong> {record.treatment}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
          
          {patientData.medicalHistory.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No medical history available
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Feedback Tab */}
        <TabPanel value={tabValue} index={3}>
          <List>
            {patientData.feedback.map((feedback) => (
              <React.Fragment key={feedback.id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6">{feedback.hospitalName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(feedback.date)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Rating value={feedback.rating} readOnly size="small" />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {feedback.comment}
                        </Typography>
                        {feedback.wouldRecommend && (
                          <Chip 
                            label="Would Recommend" 
                            color="success" 
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
          
          {patientData.feedback.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No feedback given yet
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Rewards Tab */}
        <TabPanel value={tabValue} index={4}>
          <Alert severity="info" sx={{ mb: 3 }}>
            You have <strong>{patientData.loyaltyPoints}</strong> loyalty points
          </Alert>

          <Grid container spacing={3}>
            {patientData.rewards.map((reward) => (
              <Grid item xs={12} sm={6} md={4} key={reward.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <CardGiftcard color="primary" />
                      <Chip 
                        label={`${reward.pointsRequired} pts`}
                        color="primary"
                        size="small"
                      />
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {reward.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {reward.description}
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth
                      disabled={patientData.loyaltyPoints < reward.pointsRequired}
                      sx={{ mt: 2 }}
                    >
                      Redeem
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {patientData.rewards.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No rewards available
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Appointment Dialog */}
      <Dialog open={openAppointmentDialog} onClose={() => setOpenAppointmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedAppointment ? 'Edit Appointment' : 'Book New Appointment'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Hospital</InputLabel>
                <Select
                  value={newAppointment.hospitalId}
                  onChange={(e) => {
                    setNewAppointment({ ...newAppointment, hospitalId: e.target.value });
                    fetchDoctors(e.target.value);
                  }}
                  label="Hospital"
                >
                  {hospitals.map((hospital) => (
                    <MenuItem key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Doctor</InputLabel>
                <Select
                  value={newAppointment.doctorId}
                  onChange={(e) => setNewAppointment({ ...newAppointment, doctorId: e.target.value })}
                  label="Doctor"
                  disabled={!newAppointment.hospitalId}
                >
                  {doctors.map((doctor) => (
                    <MenuItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.name} - {doctor.specialization}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DatePicker
                label="Date"
                value={newAppointment.date}
                onChange={(date) => setNewAppointment({ ...newAppointment, date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
                minDate={new Date()}
              />

              <TimePicker
                label="Time"
                value={newAppointment.time}
                onChange={(time) => setNewAppointment({ ...newAppointment, time })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />

              <FormControl fullWidth>
                <InputLabel>Appointment Type</InputLabel>
                <Select
                  value={newAppointment.type}
                  onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
                  label="Appointment Type"
                >
                  <MenuItem value="CONSULTATION">Consultation</MenuItem>
                  <MenuItem value="FOLLOW_UP">Follow-up</MenuItem>
                  <MenuItem value="EMERGENCY">Emergency</MenuItem>
                  <MenuItem value="ROUTINE_CHECKUP">Routine Checkup</MenuItem>
                  <MenuItem value="VACCINATION">Vaccination</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Reason for Visit"
                multiline
                rows={3}
                value={newAppointment.reason}
                onChange={(e) => setNewAppointment({ ...newAppointment, reason: e.target.value })}
                fullWidth
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAppointmentDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveAppointment} variant="contained">
            {selectedAppointment ? 'Update' : 'Book'} Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={openFeedbackDialog} onClose={() => setOpenFeedbackDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Give Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box>
              <Typography component="legend">How would you rate your experience?</Typography>
              <Rating
                value={newFeedback.rating}
                onChange={(event, value) => setNewFeedback({ ...newFeedback, rating: value })}
                size="large"
              />
            </Box>

            <TextField
              label="Comments"
              multiline
              rows={4}
              value={newFeedback.comment}
              onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Would you recommend us?</InputLabel>
              <Select
                value={newFeedback.wouldRecommend}
                onChange={(e) => setNewFeedback({ ...newFeedback, wouldRecommend: e.target.value })}
                label="Would you recommend us?"
              >
                <MenuItem value={true}>Yes</MenuItem>
                <MenuItem value={false}>No</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFeedbackDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitFeedback} variant="contained">
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PatientPortal;
