import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  LinearProgress,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  AlertTitle,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Rating,
  Paper,
  Badge,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import {
  CalendarToday,
  NotificationsActive,
  Star,
  CardGiftcard,
  LocalHospital,
  AccessTime,
  CheckCircle,
  Schedule,
  Feedback,
  EmojiEvents,
  Phone,
  Email,
  LocationOn,
  FavoriteBorder,
  Medication,
  Description,
  Send,
  Cancel,
  Edit,
  Delete,
  Redeem
} from '@mui/icons-material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays, parseISO } from 'date-fns';
import { api } from '../../../services/api.config';

const EnhancedPatientPortal = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [openBooking, setOpenBooking] = useState(false);
  const [openFeedback, setOpenFeedback] = useState(false);
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [newAppointment, setNewAppointment] = useState({
    hospital: '',
    department: '',
    doctor: '',
    date: new Date(),
    time: new Date(),
    reason: '',
    type: 'consultation'
  });
  const [newFeedback, setNewFeedback] = useState({
    appointmentId: '',
    rating: 5,
    doctorRating: 5,
    facilityRating: 5,
    serviceRating: 5,
    comment: '',
    wouldRecommend: true
  });

  useEffect(() => {
    fetchPatientData();
    fetchAppointments();
    fetchReminders();
    fetchLoyaltyData();
    fetchFeedbackHistory();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      // Get patient data from localStorage or API
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Mock data for demonstration
      const mockPatientData = {
        id: user.id || 1,
        patientId: 'PAT2025001',
        name: user.name || 'Kemi Adewale',
        email: user.email || 'kemi.adewale@example.ng',
        phone: '+234 805 555 1234',
        dateOfBirth: '1990-05-15',
        bloodGroup: 'B+',
        genotype: 'AA',
        address: '25 Marina Road, Lagos Island',
        emergencyContact: {
          name: 'James Adewale',
          phone: '+234 805 555 1235',
          relationship: 'Husband'
        },
        allergies: ['Penicillin', 'Dust'],
        chronicConditions: ['Mild Asthma'],
        profileImage: null
      };
      
      setPatientData(mockPatientData);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      // Mock appointment data
      const mockAppointments = [
        {
          id: 1,
          appointmentId: 'APT-2025-10-001',
          date: '2025-11-05',
          time: '10:00 AM',
          hospital: 'Victoria Medical Centre',
          department: 'General Medicine',
          doctor: 'Dr. Sarah Johnson',
          status: 'confirmed',
          type: 'Follow-up',
          notes: 'Blood test results review'
        },
        {
          id: 2,
          appointmentId: 'APT-2025-09-045',
          date: '2025-09-20',
          time: '2:30 PM',
          hospital: 'Victoria Medical Centre',
          department: 'Cardiology',
          doctor: 'Dr. Michael Chen',
          status: 'completed',
          type: 'Consultation',
          notes: 'Annual checkup'
        },
        {
          id: 3,
          appointmentId: 'APT-2025-11-015',
          date: '2025-11-15',
          time: '9:00 AM',
          hospital: 'Sunshine Healthcare',
          department: 'Dental',
          doctor: 'Dr. Emily Brown',
          status: 'pending',
          type: 'Routine Checkup',
          notes: 'Dental cleaning'
        }
      ];
      
      setAppointments(mockAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      // Mock reminder data
      const mockReminders = [
        {
          id: 1,
          type: 'appointment',
          title: 'Upcoming Appointment',
          message: 'You have an appointment with Dr. Sarah Johnson tomorrow at 10:00 AM',
          date: '2025-11-04',
          priority: 'high',
          read: false
        },
        {
          id: 2,
          type: 'medication',
          title: 'Medication Reminder',
          message: 'Time to take your evening medication (Vitamin D)',
          date: '2025-10-03',
          priority: 'medium',
          read: false
        },
        {
          id: 3,
          type: 'health_tip',
          title: 'Health Tip',
          message: 'Remember to stay hydrated! Aim for 8 glasses of water daily.',
          date: '2025-10-03',
          priority: 'low',
          read: true
        },
        {
          id: 4,
          type: 'vaccination',
          title: 'Vaccination Due',
          message: 'Your annual flu vaccination is due. Schedule an appointment.',
          date: '2025-10-01',
          priority: 'medium',
          read: false
        }
      ];
      
      setReminders(mockReminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const fetchLoyaltyData = async () => {
    try {
      // Mock loyalty data
      const mockLoyaltyData = {
        points: 2500,
        tier: 'Silver',
        nextTier: 'Gold',
        pointsToNextTier: 500,
        expiringPoints: 200,
        expiryDate: '2025-12-31',
        rewards: [
          {
            id: 1,
            name: 'Free Health Checkup',
            pointsCost: 1000,
            description: 'Complete health screening package',
            available: true
          },
          {
            id: 2,
            name: '20% Discount on Lab Tests',
            pointsCost: 500,
            description: 'Valid for all laboratory tests',
            available: true
          },
          {
            id: 3,
            name: 'Free Consultation',
            pointsCost: 1500,
            description: 'One free consultation with specialist',
            available: true
          },
          {
            id: 4,
            name: 'Pharmacy Discount 15%',
            pointsCost: 300,
            description: 'Discount on all pharmacy purchases',
            available: true
          }
        ],
        history: [
          {
            id: 1,
            date: '2025-09-20',
            points: 100,
            type: 'earned',
            description: 'Appointment completed'
          },
          {
            id: 2,
            date: '2025-09-15',
            points: 500,
            type: 'redeemed',
            description: 'Lab test discount'
          },
          {
            id: 3,
            date: '2025-08-10',
            points: 200,
            type: 'earned',
            description: 'Feedback submitted'
          }
        ]
      };
      
      setLoyaltyData(mockLoyaltyData);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    }
  };

  const fetchFeedbackHistory = async () => {
    try {
      // Mock feedback history
      const mockFeedback = [
        {
          id: 1,
          date: '2025-09-20',
          appointment: 'APT-2025-09-045',
          doctor: 'Dr. Michael Chen',
          rating: 5,
          status: 'submitted',
          pointsEarned: 100
        },
        {
          id: 2,
          date: '2025-08-15',
          appointment: 'APT-2025-08-032',
          doctor: 'Dr. Sarah Johnson',
          rating: 4,
          status: 'submitted',
          pointsEarned: 100
        }
      ];
      
      setFeedbackHistory(mockFeedback);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBookAppointment = () => {
    setOpenBooking(true);
    setBookingStep(0);
  };

  const handleCloseBooking = () => {
    setOpenBooking(false);
    setBookingStep(0);
    setNewAppointment({
      hospital: '',
      department: '',
      doctor: '',
      date: new Date(),
      time: new Date(),
      reason: '',
      type: 'consultation'
    });
  };

  const handleSubmitAppointment = async () => {
    try {
      // Submit appointment booking
      console.log('Booking appointment:', newAppointment);
      // API call would go here
      handleCloseBooking();
      // Refresh appointments
      fetchAppointments();
    } catch (error) {
      console.error('Error booking appointment:', error);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      // Cancel appointment
      console.log('Cancelling appointment:', appointmentId);
      // API call would go here
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const handleRescheduleAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setNewAppointment({
      ...appointment,
      date: parseISO(appointment.date),
      time: new Date()
    });
    setOpenBooking(true);
    setBookingStep(2); // Jump to date/time selection
  };

  const handleSubmitFeedback = async () => {
    try {
      // Submit feedback
      console.log('Submitting feedback:', newFeedback);
      // API call would go here
      setOpenFeedback(false);
      // Reset form
      setNewFeedback({
        appointmentId: '',
        rating: 5,
        doctorRating: 5,
        facilityRating: 5,
        serviceRating: 5,
        comment: '',
        wouldRecommend: true
      });
      // Refresh feedback history
      fetchFeedbackHistory();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleRedeemReward = async (rewardId, pointsCost) => {
    try {
      // Redeem reward
      console.log('Redeeming reward:', rewardId);
      // API call would go here
      fetchLoyaltyData();
    } catch (error) {
      console.error('Error redeeming reward:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getReminderIcon = (type) => {
    switch (type) {
      case 'appointment':
        return <CalendarToday />;
      case 'medication':
        return <Medication />;
      case 'health_tip':
        return <FavoriteBorder />;
      case 'vaccination':
        return <LocalHospital />;
      default:
        return <NotificationsActive />;
    }
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
      <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Typography variant="h4" gutterBottom>
            Welcome, {patientData?.name}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Patient ID: {patientData?.patientId} | Blood Group: {patientData?.bloodGroup}
          </Typography>
        </Grid>
        <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
          <Badge badgeContent={reminders.filter(r => !r.read).length} color="error">
            <IconButton>
              <NotificationsActive />
            </IconButton>
          </Badge>
        </Grid>
      </Grid>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Next Appointment
                  </Typography>
                  <Typography variant="h6">
                    Nov 5, 2025
                  </Typography>
                  <Typography variant="body2">
                    10:00 AM
                  </Typography>
                </Box>
                <CalendarToday color="primary" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Loyalty Points
                  </Typography>
                  <Typography variant="h6">
                    {loyaltyData?.points}
                  </Typography>
                  <Chip label={loyaltyData?.tier} size="small" color="primary" />
                </Box>
                <CardGiftcard color="warning" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Reminders
                  </Typography>
                  <Typography variant="h6">
                    {reminders.filter(r => !r.read).length}
                  </Typography>
                  <Typography variant="body2">
                    Pending
                  </Typography>
                </Box>
                <NotificationsActive color="info" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Health Score
                  </Typography>
                  <Typography variant="h6">
                    Good
                  </Typography>
                  <Rating value={4} readOnly size="small" />
                </Box>
                <FavoriteBorder color="success" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Appointments" />
          <Tab label="Reminders" />
          <Tab label="Loyalty & Rewards" />
          <Tab label="Feedback" />
        </Tabs>

        {/* Appointments Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6">My Appointments</Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CalendarToday />}
                onClick={handleBookAppointment}
              >
                Book New Appointment
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Hospital</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {appointment.date}
                        </Typography>
                        <Typography variant="body2">
                          {appointment.time}
                        </Typography>
                      </TableCell>
                      <TableCell>{appointment.hospital}</TableCell>
                      <TableCell>{appointment.department}</TableCell>
                      <TableCell>{appointment.doctor}</TableCell>
                      <TableCell>{appointment.type}</TableCell>
                      <TableCell>
                        <Chip
                          label={appointment.status}
                          color={getStatusColor(appointment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {appointment.status === 'confirmed' && (
                          <>
                            <Tooltip title="Reschedule">
                              <IconButton
                                size="small"
                                onClick={() => handleRescheduleAppointment(appointment)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancel">
                              <IconButton
                                size="small"
                                onClick={() => handleCancelAppointment(appointment.id)}
                              >
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {appointment.status === 'completed' && (
                          <Button
                            size="small"
                            onClick={() => {
                              setNewFeedback({ ...newFeedback, appointmentId: appointment.id });
                              setOpenFeedback(true);
                            }}
                          >
                            Give Feedback
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Reminders Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Health Reminders</Typography>
            <List>
              {reminders.map((reminder, index) => (
                <React.Fragment key={reminder.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: reminder.read ? 'grey.300' : 'primary.main' }}>
                        {getReminderIcon(reminder.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography fontWeight={reminder.read ? 'normal' : 'bold'}>
                            {reminder.title}
                          </Typography>
                          <Chip
                            label={reminder.priority}
                            size="small"
                            color={
                              reminder.priority === 'high' ? 'error' :
                              reminder.priority === 'medium' ? 'warning' : 'default'
                            }
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="textSecondary">
                            {reminder.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {reminder.date}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < reminders.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        {/* Loyalty & Rewards Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            {/* Loyalty Status */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Loyalty Status</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h3" color="primary">
                        {loyaltyData?.points}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Points
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Chip label={loyaltyData?.tier} color="primary" />
                      <Typography variant="body2">
                        {loyaltyData?.pointsToNextTier} points to {loyaltyData?.nextTier}
                      </Typography>
                    </Box>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      {loyaltyData?.expiringPoints} points expiring on {loyaltyData?.expiryDate}
                    </Alert>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Points History</Typography>
                    <List dense>
                      {loyaltyData?.history.slice(0, 3).map((item) => (
                        <ListItem key={item.id}>
                          <ListItemText
                            primary={
                              <Box display="flex" justifyContent="space-between">
                                <Typography variant="body2">{item.description}</Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight="bold"
                                  color={item.type === 'earned' ? 'success.main' : 'error.main'}
                                >
                                  {item.type === 'earned' ? '+' : '-'}{item.points}
                                </Typography>
                              </Box>
                            }
                            secondary={item.date}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Available Rewards */}
            <Typography variant="h6" sx={{ mb: 2 }}>Available Rewards</Typography>
            <Grid container spacing={2}>
              {loyaltyData?.rewards.map((reward) => (
                <Grid item xs={12} md={6} key={reward.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="start">
                        <Box>
                          <Typography variant="h6">{reward.name}</Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            {reward.description}
                          </Typography>
                          <Chip label={`${reward.pointsCost} points`} size="small" />
                        </Box>
                        <Button
                          variant="contained"
                          size="small"
                          disabled={loyaltyData.points < reward.pointsCost}
                          onClick={() => handleRedeemReward(reward.id, reward.pointsCost)}
                          startIcon={<Redeem />}
                        >
                          Redeem
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Feedback Tab */}
        {tabValue === 3 && (
          <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6">Feedback History</Typography>
              <Typography variant="body2" color="textSecondary">
                Earn 100 points for each feedback!
              </Typography>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Appointment</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell align="center">Rating</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Points Earned</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feedbackHistory.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>{feedback.date}</TableCell>
                      <TableCell>{feedback.appointment}</TableCell>
                      <TableCell>{feedback.doctor}</TableCell>
                      <TableCell align="center">
                        <Rating value={feedback.rating} readOnly size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={feedback.status} color="success" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`+${feedback.pointsEarned}`} color="primary" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {appointments.filter(a => a.status === 'completed').length > feedbackHistory.length && (
              <Alert severity="info" sx={{ mt: 2 }}>
                You have {appointments.filter(a => a.status === 'completed').length - feedbackHistory.length} completed appointments pending feedback. Share your experience and earn loyalty points!
              </Alert>
            )}
          </Box>
        )}
      </Paper>

      {/* Appointment Booking Dialog */}
      <Dialog open={openBooking} onClose={handleCloseBooking} maxWidth="md" fullWidth>
        <DialogTitle>Book New Appointment</DialogTitle>
        <DialogContent>
          <Stepper activeStep={bookingStep} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>Select Hospital</StepLabel>
            </Step>
            <Step>
              <StepLabel>Choose Department & Doctor</StepLabel>
            </Step>
            <Step>
              <StepLabel>Pick Date & Time</StepLabel>
            </Step>
            <Step>
              <StepLabel>Confirm Details</StepLabel>
            </Step>
          </Stepper>

          {bookingStep === 0 && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Hospital</InputLabel>
              <Select
                value={newAppointment.hospital}
                onChange={(e) => setNewAppointment({ ...newAppointment, hospital: e.target.value })}
              >
                <MenuItem value="Victoria Medical Centre">Victoria Medical Centre</MenuItem>
                <MenuItem value="Sunshine Healthcare">Sunshine Healthcare</MenuItem>
                <MenuItem value="Royal Crown Hospital">Royal Crown Hospital</MenuItem>
              </Select>
            </FormControl>
          )}

          {bookingStep === 1 && (
            <>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={newAppointment.department}
                  onChange={(e) => setNewAppointment({ ...newAppointment, department: e.target.value })}
                >
                  <MenuItem value="General Medicine">General Medicine</MenuItem>
                  <MenuItem value="Cardiology">Cardiology</MenuItem>
                  <MenuItem value="Dental">Dental</MenuItem>
                  <MenuItem value="Orthopedics">Orthopedics</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Doctor</InputLabel>
                <Select
                  value={newAppointment.doctor}
                  onChange={(e) => setNewAppointment({ ...newAppointment, doctor: e.target.value })}
                >
                  <MenuItem value="Dr. Sarah Johnson">Dr. Sarah Johnson</MenuItem>
                  <MenuItem value="Dr. Michael Chen">Dr. Michael Chen</MenuItem>
                  <MenuItem value="Dr. Emily Brown">Dr. Emily Brown</MenuItem>
                </Select>
              </FormControl>
            </>
          )}

          {bookingStep === 2 && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <DatePicker
                    label="Appointment Date"
                    value={newAppointment.date}
                    onChange={(date) => setNewAppointment({ ...newAppointment, date })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    minDate={addDays(new Date(), 1)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TimePicker
                    label="Appointment Time"
                    value={newAppointment.time}
                    onChange={(time) => setNewAppointment({ ...newAppointment, time })}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reason for Visit"
                    multiline
                    rows={3}
                    value={newAppointment.reason}
                    onChange={(e) => setNewAppointment({ ...newAppointment, reason: e.target.value })}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          )}

          {bookingStep === 3 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>Confirm Appointment Details</Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Hospital" secondary={newAppointment.hospital} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Department" secondary={newAppointment.department} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Doctor" secondary={newAppointment.doctor} />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Date & Time"
                    secondary={`${format(newAppointment.date, 'MMM dd, yyyy')} at ${format(newAppointment.time, 'hh:mm a')}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Reason" secondary={newAppointment.reason || 'General Consultation'} />
                </ListItem>
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBooking}>Cancel</Button>
          {bookingStep > 0 && (
            <Button onClick={() => setBookingStep(bookingStep - 1)}>Back</Button>
          )}
          {bookingStep < 3 ? (
            <Button
              variant="contained"
              onClick={() => setBookingStep(bookingStep + 1)}
              disabled={
                (bookingStep === 0 && !newAppointment.hospital) ||
                (bookingStep === 1 && (!newAppointment.department || !newAppointment.doctor))
              }
            >
              Next
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={handleSubmitAppointment}>
              Confirm Booking
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={openFeedback} onClose={() => setOpenFeedback(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Your Experience</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>Overall Experience</Typography>
            <Rating
              value={newFeedback.rating}
              onChange={(e, value) => setNewFeedback({ ...newFeedback, rating: value })}
              size="large"
            />
            
            <Typography gutterBottom sx={{ mt: 2 }}>Doctor Rating</Typography>
            <Rating
              value={newFeedback.doctorRating}
              onChange={(e, value) => setNewFeedback({ ...newFeedback, doctorRating: value })}
            />
            
            <Typography gutterBottom sx={{ mt: 2 }}>Facility Rating</Typography>
            <Rating
              value={newFeedback.facilityRating}
              onChange={(e, value) => setNewFeedback({ ...newFeedback, facilityRating: value })}
            />
            
            <Typography gutterBottom sx={{ mt: 2 }}>Service Rating</Typography>
            <Rating
              value={newFeedback.serviceRating}
              onChange={(e, value) => setNewFeedback({ ...newFeedback, serviceRating: value })}
            />
            
            <TextField
              fullWidth
              label="Comments (Optional)"
              multiline
              rows={4}
              value={newFeedback.comment}
              onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
              sx={{ mt: 2 }}
            />
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Would you recommend us?</InputLabel>
              <Select
                value={newFeedback.wouldRecommend}
                onChange={(e) => setNewFeedback({ ...newFeedback, wouldRecommend: e.target.value })}
              >
                <MenuItem value={true}>Yes</MenuItem>
                <MenuItem value={false}>No</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFeedback(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSubmitFeedback}>
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EnhancedPatientPortal;
