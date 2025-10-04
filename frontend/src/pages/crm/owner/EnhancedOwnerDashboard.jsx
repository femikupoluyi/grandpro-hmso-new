import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
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
  Tooltip,
  Badge
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
  Assessment,
  AttachMoney,
  Star,
  NotificationsActive,
  Download,
  Visibility,
  CheckCircle,
  Warning,
  Schedule,
  Description,
  CalendarToday,
  PictureAsPdf,
  Email,
  Phone,
  LocationOn
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api.config';

const EnhancedOwnerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [ownerData, setOwnerData] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeContracts: 0,
    pendingPayouts: 0,
    satisfactionScore: 0,
    totalHospitals: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    fetchOwnerData();
    fetchContracts();
    fetchPayouts();
    fetchNotifications();
  }, []);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      // Get owner profile from localStorage or API
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Mock data for demonstration
      const mockOwnerData = {
        id: user.id || 1,
        name: user.name || 'Dr. Victoria Adeleke',
        email: user.email || 'victoria@vmc.ng',
        phone: '+234 803 456 7890',
        hospitalCount: 3,
        joinDate: '2023-01-15',
        tier: 'Gold Partner',
        profileImage: null
      };
      
      setOwnerData(mockOwnerData);
      
      // Set stats
      setStats({
        totalRevenue: 45000000, // ₦45M
        activeContracts: 3,
        pendingPayouts: 2500000, // ₦2.5M
        satisfactionScore: 4.6,
        totalHospitals: 3,
        monthlyRevenue: 15000000 // ₦15M
      });
    } catch (error) {
      console.error('Error fetching owner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      // Mock contract data
      const mockContracts = [
        {
          id: 1,
          contractNumber: 'CONT-2024-001',
          hospitalName: 'Victoria Medical Centre',
          startDate: '2024-01-01',
          endDate: '2026-12-31',
          status: 'Active',
          value: 15000000,
          revenueShare: 15,
          lastPayout: '2025-09-30',
          nextPayout: '2025-10-31',
          performance: 'Excellent'
        },
        {
          id: 2,
          contractNumber: 'CONT-2024-002',
          hospitalName: 'Sunshine Healthcare',
          startDate: '2024-03-15',
          endDate: '2027-03-14',
          status: 'Active',
          value: 10000000,
          revenueShare: 12,
          lastPayout: '2025-09-30',
          nextPayout: '2025-10-31',
          performance: 'Good'
        },
        {
          id: 3,
          contractNumber: 'CONT-2023-015',
          hospitalName: 'Royal Crown Hospital',
          startDate: '2023-06-01',
          endDate: '2025-05-31',
          status: 'Renewal Pending',
          value: 20000000,
          revenueShare: 18,
          lastPayout: '2025-09-30',
          nextPayout: '2025-10-31',
          performance: 'Excellent'
        }
      ];
      
      setContracts(mockContracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const fetchPayouts = async () => {
    try {
      // Mock payout history
      const mockPayouts = [
        {
          id: 1,
          payoutId: 'PAY-2025-09-001',
          date: '2025-09-30',
          amount: 2500000,
          status: 'Completed',
          method: 'Bank Transfer',
          hospital: 'Victoria Medical Centre',
          period: 'September 2025',
          breakdown: {
            revenue: 16666667,
            share: 15,
            deductions: 0,
            net: 2500000
          }
        },
        {
          id: 2,
          payoutId: 'PAY-2025-09-002',
          date: '2025-09-30',
          amount: 1200000,
          status: 'Completed',
          method: 'Bank Transfer',
          hospital: 'Sunshine Healthcare',
          period: 'September 2025',
          breakdown: {
            revenue: 10000000,
            share: 12,
            deductions: 0,
            net: 1200000
          }
        },
        {
          id: 3,
          payoutId: 'PAY-2025-10-001',
          date: '2025-10-31',
          amount: 2500000,
          status: 'Pending',
          method: 'Bank Transfer',
          hospital: 'Victoria Medical Centre',
          period: 'October 2025',
          breakdown: {
            revenue: 16666667,
            share: 15,
            deductions: 0,
            net: 2500000
          }
        },
        {
          id: 4,
          payoutId: 'PAY-2025-08-001',
          date: '2025-08-31',
          amount: 2450000,
          status: 'Completed',
          method: 'Bank Transfer',
          hospital: 'Victoria Medical Centre',
          period: 'August 2025',
          breakdown: {
            revenue: 16333333,
            share: 15,
            deductions: 0,
            net: 2450000
          }
        }
      ];
      
      setPayouts(mockPayouts);
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      // Mock notifications
      const mockNotifications = [
        {
          id: 1,
          type: 'payout',
          title: 'October Payout Ready',
          message: 'Your October 2025 payout of ₦2,500,000 will be processed on Oct 31',
          date: '2025-10-25',
          read: false
        },
        {
          id: 2,
          type: 'contract',
          title: 'Contract Renewal Required',
          message: 'Royal Crown Hospital contract expires in 6 months. Start renewal process.',
          date: '2025-10-20',
          read: false
        },
        {
          id: 3,
          type: 'performance',
          title: 'Performance Report Available',
          message: 'Q3 2025 performance report for all hospitals is ready for review',
          date: '2025-10-15',
          read: true
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
        return 'success';
      case 'pending':
      case 'renewal pending':
        return 'warning';
      case 'expired':
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const downloadPayout = (payoutId) => {
    // Implement payout receipt download
    console.log('Downloading payout receipt:', payoutId);
  };

  const viewContract = (contractId) => {
    navigate(`/owner/contracts/${contractId}`);
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
            Welcome back, {ownerData?.name}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Partner Tier: <Chip label={ownerData?.tier} color="primary" size="small" />
          </Typography>
        </Grid>
        <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
          <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
            <IconButton>
              <NotificationsActive />
            </IconButton>
          </Badge>
        </Grid>
      </Grid>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h5" component="div">
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                  <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                    <TrendingUp color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +12% from last year
                    </Typography>
                  </Box>
                </Box>
                <AttachMoney color="primary" fontSize="large" />
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
                    Active Contracts
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.activeContracts}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {stats.totalHospitals} hospitals
                  </Typography>
                </Box>
                <Description color="primary" fontSize="large" />
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
                    Pending Payouts
                  </Typography>
                  <Typography variant="h5" component="div">
                    {formatCurrency(stats.pendingPayouts)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Next: Oct 31, 2025
                  </Typography>
                </Box>
                <Schedule color="warning" fontSize="large" />
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
                    Satisfaction Score
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stats.satisfactionScore}/5.0
                  </Typography>
                  <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                    <Star color="warning" fontSize="small" />
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      Excellent Rating
                    </Typography>
                  </Box>
                </Box>
                <Star color="warning" fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for Contract Status and Payout History */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Contract Status" />
          <Tab label="Payout History" />
          <Tab label="Notifications" />
        </Tabs>

        {/* Contract Status Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Contract Number</TableCell>
                    <TableCell>Hospital</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Contract Value</TableCell>
                    <TableCell align="center">Revenue Share</TableCell>
                    <TableCell>Next Payout</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>{contract.contractNumber}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {contract.hospitalName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {contract.startDate} - {contract.endDate}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={contract.status}
                          color={getStatusColor(contract.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(contract.value)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`${contract.revenueShare}%`} size="small" />
                      </TableCell>
                      <TableCell>{contract.nextPayout}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Contract">
                          <IconButton
                            size="small"
                            onClick={() => viewContract(contract.id)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download PDF">
                          <IconButton size="small">
                            <PictureAsPdf />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Payout History Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Payout ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Hospital</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell align="right">Gross Revenue</TableCell>
                    <TableCell align="center">Share %</TableCell>
                    <TableCell align="right">Net Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>{payout.payoutId}</TableCell>
                      <TableCell>{payout.date}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {payout.hospital}
                        </Typography>
                      </TableCell>
                      <TableCell>{payout.period}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(payout.breakdown.revenue)}
                      </TableCell>
                      <TableCell align="center">
                        {payout.breakdown.share}%
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">
                          {formatCurrency(payout.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payout.status}
                          color={getStatusColor(payout.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Download Receipt">
                          <IconButton
                            size="small"
                            onClick={() => downloadPayout(payout.payoutId)}
                          >
                            <Download />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Payout Summary */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Total Payouts (2025)
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(payouts.reduce((sum, p) => 
                      p.status === 'Completed' ? sum + p.amount : sum, 0
                    ))}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Pending Payouts
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(payouts.reduce((sum, p) => 
                      p.status === 'Pending' ? sum + p.amount : sum, 0
                    ))}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Average Monthly
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(stats.monthlyRevenue * 0.15)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="textSecondary">
                    Next Payout Date
                  </Typography>
                  <Typography variant="h6">
                    Oct 31, 2025
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}

        {/* Notifications Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <List>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: notification.read ? 'grey.300' : 'primary.main' }}>
                        {notification.type === 'payout' && <AttachMoney />}
                        {notification.type === 'contract' && <Description />}
                        {notification.type === 'performance' && <Assessment />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography fontWeight={notification.read ? 'normal' : 'bold'}>
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="textSecondary">
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {notification.date}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default EnhancedOwnerDashboard;
