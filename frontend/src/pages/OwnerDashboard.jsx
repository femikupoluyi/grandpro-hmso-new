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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Receipt,
  Assessment,
  People,
  AttachMoney,
  Star,
  NotificationsActive,
  Download,
  Visibility,
  CheckCircle,
  Warning,
  Schedule
} from '@mui/icons-material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../services/api.config';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const OwnerDashboard = () => {
  const [ownerData, setOwnerData] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeContracts: 0,
    pendingPayouts: 0,
    satisfactionScore: 0
  });
  const [selectedContract, setSelectedContract] = useState(null);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);

  useEffect(() => {
    fetchOwnerData();
    fetchContracts();
    fetchPayouts();
    fetchStats();
  }, []);

  const fetchOwnerData = async () => {
    try {
      // In production, get owner ID from auth context
      const ownerId = localStorage.getItem('ownerId') || 1;
      const response = await api.get(`/api/crm-v2/owners/${ownerId}`);
      setOwnerData(response.data.data);
    } catch (error) {
      console.error('Error fetching owner data:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      // Mock data for contracts
      const mockContracts = [
        {
          id: 1,
          contract_number: 'GMHS-2025-001',
          hospital_name: 'Lagos Premier Hospital',
          type: 'Partnership',
          start_date: '2025-01-01',
          end_date: '2026-12-31',
          status: 'active',
          revenue_share: '70-30',
          monthly_revenue: 5000000
        },
        {
          id: 2,
          contract_number: 'GMHS-2025-002',
          hospital_name: 'Victoria Medical Center',
          type: 'Management',
          start_date: '2025-03-01',
          end_date: '2027-02-28',
          status: 'active',
          revenue_share: '60-40',
          monthly_revenue: 3500000
        }
      ];
      setContracts(mockContracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const fetchPayouts = async () => {
    try {
      const ownerId = localStorage.getItem('ownerId') || 1;
      const response = await api.get(`/api/crm-v2/owners/${ownerId}/payouts`);
      setPayouts(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      // Use mock data if API fails
      const mockPayouts = [
        {
          id: 1,
          payout_code: 'PAY-001',
          period_start: '2025-09-01',
          period_end: '2025-09-30',
          gross_revenue: 5000000,
          deductions: 500000,
          net_amount: 4500000,
          status: 'paid',
          payment_method: 'bank_transfer',
          paid_at: '2025-10-05'
        },
        {
          id: 2,
          payout_code: 'PAY-002',
          period_start: '2025-10-01',
          period_end: '2025-10-31',
          gross_revenue: 5500000,
          deductions: 550000,
          net_amount: 4950000,
          status: 'pending',
          payment_method: 'bank_transfer'
        }
      ];
      setPayouts(mockPayouts);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/crm-v2/owners/stats');
      if (response.data.success) {
        setStats({
          totalRevenue: response.data.data.totalLifetimeValue || 15200000,
          activeContracts: 2,
          pendingPayouts: 2500000,
          satisfactionScore: response.data.data.averageSatisfaction || 4.5
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Use default stats
      setStats({
        totalRevenue: 15200000,
        activeContracts: 2,
        pendingPayouts: 2500000,
        satisfactionScore: 4.5
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  // Chart data for revenue trend
  const revenueChartData = {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Revenue (₦)',
        data: [4200000, 4500000, 5000000, 5500000, 4800000, 5200000],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      }
    ]
  };

  // Chart data for payout distribution
  const payoutChartData = {
    labels: ['Paid', 'Pending', 'Processing'],
    datasets: [
      {
        data: [12, 3, 1],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(54, 162, 235, 0.8)'
        ]
      }
    ]
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
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Owner Dashboard
      </Typography>

      {/* Welcome Message */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Welcome back! Your hospitals are performing well this month.
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Revenue
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUp fontSize="small" />
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      +12% vs last month
                    </Typography>
                  </Box>
                </Box>
                <AttachMoney sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Active Contracts
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {stats.activeContracts}
                  </Typography>
                  <Chip
                    label="Active"
                    size="small"
                    sx={{ mt: 1, backgroundColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                  />
                </Box>
                <Receipt sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Pending Payouts
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(stats.pendingPayouts)}
                  </Typography>
                  <Typography variant="caption">
                    3 payments pending
                  </Typography>
                </Box>
                <AccountBalance sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Satisfaction Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {stats.satisfactionScore}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      /5.0
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUp fontSize="small" />
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      +5% improvement
                    </Typography>
                  </Box>
                </Box>
                <Star sx={{ fontSize: 40, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue Trend
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line 
                  data={revenueChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '₦' + value.toLocaleString();
                          }
                        }
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payout Status
              </Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut 
                  data={payoutChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Contracts Table */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Active Contracts
            </Typography>
            <Button variant="contained" startIcon={<Receipt />}>
              New Contract
            </Button>
          </Box>
          <TableContainer component={Paper} variant="outlined">
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
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>{contract.contract_number}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {contract.hospital_name}
                      </Typography>
                    </TableCell>
                    <TableCell>{contract.type}</TableCell>
                    <TableCell>{formatDate(contract.start_date)}</TableCell>
                    <TableCell>{formatDate(contract.end_date)}</TableCell>
                    <TableCell>
                      <Chip label={contract.revenue_share} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={contract.status}
                        color={getStatusColor(contract.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => setSelectedContract(contract)}>
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

      {/* Payouts Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Payout History
            </Typography>
            <Button variant="outlined" startIcon={<Download />}>
              Export
            </Button>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payout ID</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Gross Revenue</TableCell>
                  <TableCell>Deductions</TableCell>
                  <TableCell>Net Amount</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>{payout.payout_code}</TableCell>
                    <TableCell>
                      {formatDate(payout.period_start)} - {formatDate(payout.period_end)}
                    </TableCell>
                    <TableCell>{formatCurrency(payout.gross_revenue)}</TableCell>
                    <TableCell>{formatCurrency(payout.deductions)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(payout.net_amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={payout.payment_method} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={payout.status}
                        color={getStatusColor(payout.status)}
                        size="small"
                        icon={payout.status === 'paid' ? <CheckCircle /> : <Schedule />}
                      />
                    </TableCell>
                    <TableCell>
                      {payout.paid_at ? formatDate(payout.paid_at) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Contract Details Dialog */}
      <Dialog
        open={Boolean(selectedContract)}
        onClose={() => setSelectedContract(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Contract Details</DialogTitle>
        <DialogContent>
          {selectedContract && (
            <Box>
              <Typography variant="subtitle2" color="textSecondary">
                Contract Number
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedContract.contract_number}
              </Typography>
              
              <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>
                Hospital
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedContract.hospital_name}
              </Typography>
              
              <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>
                Monthly Revenue
              </Typography>
              <Typography variant="body1" gutterBottom>
                {formatCurrency(selectedContract.monthly_revenue)}
              </Typography>
              
              <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>
                Revenue Share
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedContract.revenue_share}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedContract(null)}>Close</Button>
          <Button variant="contained">Download Contract</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OwnerDashboard;
