import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  Tab,
  Tabs,
  Badge
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  Description,
  Payment,
  Visibility,
  Download,
  Email,
  Phone,
  WhatsApp,
  CheckCircle,
  Warning,
  Schedule,
  AttachMoney,
  Business,
  CalendarToday,
  Refresh
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [contracts, setContracts] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    activeContracts: 0,
    pendingPayouts: 0,
    satisfactionScore: 0,
    monthlyGrowth: 0
  });
  const [selectedContract, setSelectedContract] = useState(null);
  const [contractDialog, setContractDialog] = useState(false);
  const [communicationDialog, setCommunicationDialog] = useState(false);
  const [newMessage, setNewMessage] = useState({ subject: '', message: '', type: 'email' });

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    setLoading(true);
    try {
      // Fetch owner metrics
      const metricsResponse = await api.get(`/api/crm/owners/metrics/${user.id}`);
      setMetrics(metricsResponse.data);

      // Fetch contracts
      const contractsResponse = await api.get(`/api/crm/owners/${user.id}/contracts`);
      setContracts(contractsResponse.data.contracts || []);

      // Fetch payouts
      const payoutsResponse = await api.get(`/api/crm/owners/${user.id}/payouts`);
      setPayouts(payoutsResponse.data.payouts || []);

      // Fetch communications
      const commsResponse = await api.get(`/api/crm/owners/${user.id}/communications`);
      setCommunications(commsResponse.data.communications || []);
    } catch (error) {
      console.error('Error fetching owner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'signed':
        return 'success';
      case 'pending':
      case 'draft':
        return 'warning';
      case 'expired':
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleSendMessage = async () => {
    try {
      await api.post('/api/crm/communications/send', {
        ...newMessage,
        ownerId: user.id,
        timestamp: new Date().toISOString()
      });
      setCommunicationDialog(false);
      setNewMessage({ subject: '', message: '', type: 'email' });
      fetchOwnerData();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Sample revenue data for chart
  const revenueData = [
    { month: 'Jul', revenue: 12500000 },
    { month: 'Aug', revenue: 13200000 },
    { month: 'Sep', revenue: 14100000 },
    { month: 'Oct', revenue: 15200000 },
    { month: 'Nov', revenue: 14800000 },
    { month: 'Dec', revenue: 16500000 }
  ];

  // Sample hospital performance data
  const hospitalPerformance = [
    { name: 'Occupancy Rate', value: 78, color: '#0088FE' },
    { name: 'Patient Satisfaction', value: 92, color: '#00C49F' },
    { name: 'Revenue Target', value: 85, color: '#FFBB28' }
  ];

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
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Owner Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Welcome back, {user?.firstName} {user?.lastName}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchOwnerData}
        >
          Refresh Data
        </Button>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Revenue
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(metrics.totalRevenue || 15200000)}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +12% vs last month
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Description />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Active Contracts
                  </Typography>
                  <Typography variant="h5">
                    {metrics.activeContracts || contracts.length}
                  </Typography>
                  <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Payment />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Pending Payouts
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(metrics.pendingPayouts || 2500000)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    3 payments pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Satisfaction Score
                  </Typography>
                  <Typography variant="h5">
                    {metrics.satisfactionScore || 4.5}/5.0
                  </Typography>
                  <Typography variant="body2" color="info.main">
                    +5% improvement
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
          <Tab label="Contracts" />
          <Tab label="Payouts" />
          <Tab label="Analytics" />
          <Tab label="Communications" />
        </Tabs>
      </Paper>

      {/* Contracts Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Active Contracts</Typography>
                  <Button variant="contained" startIcon={<Description />}>
                    New Contract
                  </Button>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Contract #</TableCell>
                        <TableCell>Hospital</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Start Date</TableCell>
                        <TableCell>End Date</TableCell>
                        <TableCell>Revenue Share</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        {
                          id: 'CTR202500123',
                          hospital: 'Lagos Premier Hospital',
                          type: 'Management',
                          startDate: '2025-01-01',
                          endDate: '2025-12-31',
                          revenueShare: '15%',
                          status: 'Active',
                          value: 5000000
                        },
                        {
                          id: 'CTR202500124',
                          hospital: 'Victoria Medical Centre',
                          type: 'Partnership',
                          startDate: '2025-02-01',
                          endDate: '2026-01-31',
                          revenueShare: '20%',
                          status: 'Active',
                          value: 7500000
                        }
                      ].map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell>{contract.id}</TableCell>
                          <TableCell>{contract.hospital}</TableCell>
                          <TableCell>{contract.type}</TableCell>
                          <TableCell>{contract.startDate}</TableCell>
                          <TableCell>{contract.endDate}</TableCell>
                          <TableCell>{contract.revenueShare}</TableCell>
                          <TableCell>
                            <Chip 
                              label={contract.status} 
                              color={getStatusColor(contract.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => {
                              setSelectedContract(contract);
                              setContractDialog(true);
                            }}>
                              <Visibility />
                            </IconButton>
                            <IconButton size="small">
                              <Download />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Payouts Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Payout History</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Payment ID</TableCell>
                        <TableCell>Period</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        { id: 'PAY202510001', period: '2025-10', amount: 750000, status: 'Completed', date: '2025-10-05' },
                        { id: 'PAY202509001', period: '2025-09', amount: 680000, status: 'Completed', date: '2025-09-05' },
                        { id: 'PAY202508001', period: '2025-08', amount: 720000, status: 'Completed', date: '2025-08-05' },
                        { id: 'PAY202507001', period: '2025-07', amount: 650000, status: 'Completed', date: '2025-07-05' }
                      ].map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>{payout.id}</TableCell>
                          <TableCell>{payout.period}</TableCell>
                          <TableCell>{formatCurrency(payout.amount)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={payout.status} 
                              color={getStatusColor(payout.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{payout.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Payout Summary</Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Total Payouts (YTD)" secondary={formatCurrency(2800000)} />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText primary="Average Monthly" secondary={formatCurrency(700000)} />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText primary="Next Payout" secondary="November 5, 2025" />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText primary="Payment Method" secondary="Bank Transfer - First Bank" />
                  </ListItem>
                </List>
                <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                  Update Banking Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Analytics Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Revenue Trends</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={hospitalPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {hospitalPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Communications Tab */}
      {tabValue === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Communications</Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<Email />}
                    onClick={() => setCommunicationDialog(true)}
                  >
                    New Message
                  </Button>
                </Box>
                <List>
                  {[
                    { 
                      id: 1, 
                      subject: 'Monthly Performance Report', 
                      message: 'Your hospital performance for October 2025...', 
                      type: 'email',
                      date: '2025-10-01',
                      status: 'sent'
                    },
                    {
                      id: 2,
                      subject: 'Contract Renewal Reminder',
                      message: 'Your contract is due for renewal...',
                      type: 'sms',
                      date: '2025-09-28',
                      status: 'sent'
                    },
                    {
                      id: 3,
                      subject: 'Payment Processed',
                      message: 'Your payment of ₦750,000 has been processed...',
                      type: 'whatsapp',
                      date: '2025-09-05',
                      status: 'delivered'
                    }
                  ].map((comm) => (
                    <React.Fragment key={comm.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            {comm.type === 'email' && <Email />}
                            {comm.type === 'sms' && <Phone />}
                            {comm.type === 'whatsapp' && <WhatsApp />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={comm.subject}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                {comm.message}
                              </Typography>
                              <br />
                              <Typography variant="caption" color="textSecondary">
                                {comm.date} • {comm.status}
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

      {/* Contract Details Dialog */}
      <Dialog open={contractDialog} onClose={() => setContractDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Contract Details</DialogTitle>
        <DialogContent>
          {selectedContract && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Contract Number:</strong> {selectedContract.id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Hospital:</strong> {selectedContract.hospital}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Type:</strong> {selectedContract.type}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Duration:</strong> {selectedContract.startDate} to {selectedContract.endDate}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Revenue Share:</strong> {selectedContract.revenueShare}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Estimated Value:</strong> {formatCurrency(selectedContract.value)}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Status:</strong> <Chip label={selectedContract.status} color="success" size="small" />
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContractDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<Download />}>
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Message Dialog */}
      <Dialog open={communicationDialog} onClose={() => setCommunicationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Message</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Subject"
            value={newMessage.subject}
            onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Message"
            value={newMessage.message}
            onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
            multiline
            rows={4}
            margin="normal"
          />
          <TextField
            fullWidth
            select
            label="Send via"
            value={newMessage.type}
            onChange={(e) => setNewMessage({ ...newMessage, type: e.target.value })}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommunicationDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSendMessage}>
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OwnerDashboard;
