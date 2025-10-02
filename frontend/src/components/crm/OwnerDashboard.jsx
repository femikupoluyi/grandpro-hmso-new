import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  IconButton,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  Tab,
  Tabs
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  Hospital,
  Payment,
  Description,
  NotificationsActive,
  Email,
  Phone,
  WhatsApp,
  Schedule,
  CheckCircle,
  Warning,
  AttachMoney,
  BarChart,
  Timeline
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import crmService from '../../services/crm.service';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`owner-tabpanel-${index}`}
      aria-labelledby={`owner-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [ownerData, setOwnerData] = useState({
    profile: null,
    contracts: [],
    payouts: [],
    hospitals: [],
    communications: [],
    satisfaction: null
  });
  const [stats, setStats] = useState({
    totalHospitals: 0,
    activeContracts: 0,
    totalRevenue: 0,
    pendingPayouts: 0,
    satisfactionScore: 0
  });

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      
      // Fetch owner profile
      const profileRes = await crmService.getOwnerProfile(user.id);
      
      // Fetch contracts
      const contractsRes = await crmService.getOwnerContracts(user.id);
      
      // Fetch payouts
      const payoutsRes = await crmService.getOwnerPayouts(user.id);
      
      // Fetch hospitals
      const hospitalsRes = await crmService.getOwnerHospitals(user.id);
      
      // Fetch communications
      const commsRes = await crmService.getOwnerCommunications(user.id);
      
      // Fetch satisfaction metrics
      const satisfactionRes = await crmService.getOwnerSatisfaction(user.id);

      setOwnerData({
        profile: profileRes.data,
        contracts: contractsRes.data || [],
        payouts: payoutsRes.data || [],
        hospitals: hospitalsRes.data || [],
        communications: commsRes.data || [],
        satisfaction: satisfactionRes.data
      });

      // Calculate stats
      const activeContracts = contractsRes.data?.filter(c => c.status === 'ACTIVE').length || 0;
      const totalRevenue = payoutsRes.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const pendingPayouts = payoutsRes.data?.filter(p => p.status === 'PENDING').length || 0;

      setStats({
        totalHospitals: hospitalsRes.data?.length || 0,
        activeContracts,
        totalRevenue,
        pendingPayouts,
        satisfactionScore: satisfactionRes.data?.score || 0
      });

    } catch (error) {
      console.error('Error fetching owner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      'ACTIVE': 'success',
      'PENDING': 'warning',
      'COMPLETED': 'primary',
      'EXPIRED': 'error',
      'DRAFT': 'default'
    };
    return colors[status] || 'default';
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
          Hospital Owner Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {ownerData.profile?.name || user.name}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Hospital color="primary" sx={{ mr: 2 }} />
                <Typography color="text.secondary" variant="body2">
                  Total Hospitals
                </Typography>
              </Box>
              <Typography variant="h4">{stats.totalHospitals}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Description color="success" sx={{ mr: 2 }} />
                <Typography color="text.secondary" variant="body2">
                  Active Contracts
                </Typography>
              </Box>
              <Typography variant="h4">{stats.activeContracts}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney color="warning" sx={{ mr: 2 }} />
                <Typography color="text.secondary" variant="body2">
                  Total Revenue
                </Typography>
              </Box>
              <Typography variant="h5">{formatCurrency(stats.totalRevenue)}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="info" sx={{ mr: 2 }} />
                <Typography color="text.secondary" variant="body2">
                  Satisfaction Score
                </Typography>
              </Box>
              <Typography variant="h4">{stats.satisfactionScore}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="owner dashboard tabs">
          <Tab label="Contracts" />
          <Tab label="Payouts" />
          <Tab label="Hospitals" />
          <Tab label="Communications" />
        </Tabs>

        {/* Contracts Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contract ID</TableCell>
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
                {ownerData.contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>{contract.id}</TableCell>
                    <TableCell>{contract.hospitalName}</TableCell>
                    <TableCell>{contract.contractType}</TableCell>
                    <TableCell>{new Date(contract.startDate).toLocaleDateString('en-NG')}</TableCell>
                    <TableCell>{new Date(contract.endDate).toLocaleDateString('en-NG')}</TableCell>
                    <TableCell>{contract.revenueShare}%</TableCell>
                    <TableCell>
                      <Chip 
                        label={contract.status} 
                        color={getStatusColor(contract.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <Description />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {ownerData.contracts.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No contracts found</Typography>
            </Box>
          )}
        </TabPanel>

        {/* Payouts Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payout ID</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Hospital</TableCell>
                  <TableCell>Revenue</TableCell>
                  <TableCell>Your Share</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ownerData.payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>{payout.id}</TableCell>
                    <TableCell>{payout.period}</TableCell>
                    <TableCell>{payout.hospitalName}</TableCell>
                    <TableCell>{formatCurrency(payout.totalRevenue)}</TableCell>
                    <TableCell>{formatCurrency(payout.amount)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={payout.status} 
                        color={getStatusColor(payout.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {payout.paymentDate 
                        ? new Date(payout.paymentDate).toLocaleDateString('en-NG')
                        : 'Pending'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {ownerData.payouts.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No payouts found</Typography>
            </Box>
          )}
        </TabPanel>

        {/* Hospitals Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {ownerData.hospitals.map((hospital) => (
              <Grid item xs={12} md={6} key={hospital.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{hospital.name}</Typography>
                      <Chip 
                        label={hospital.status} 
                        color={getStatusColor(hospital.status)}
                        size="small"
                      />
                    </Box>
                    <Typography color="text.secondary" gutterBottom>
                      {hospital.address}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Monthly Revenue
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(hospital.monthlyRevenue)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Patient Count
                        </Typography>
                        <Typography variant="h6">
                          {hospital.patientCount || 0}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2 }}>
                      <Button variant="outlined" fullWidth>
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {ownerData.hospitals.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No hospitals found</Typography>
              <Button variant="contained" sx={{ mt: 2 }} href="/onboarding/application">
                Add Hospital
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Communications Tab */}
        <TabPanel value={tabValue} index={3}>
          <List>
            {ownerData.communications.map((comm) => (
              <React.Fragment key={comm.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>
                      {comm.channel === 'EMAIL' && <Email />}
                      {comm.channel === 'SMS' && <Phone />}
                      {comm.channel === 'WHATSAPP' && <WhatsApp />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>{comm.subject || comm.type}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(comm.sentAt).toLocaleDateString('en-NG')}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {comm.message}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label={comm.status} 
                            size="small"
                            color={comm.status === 'DELIVERED' ? 'success' : 'default'}
                          />
                        </Box>
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
          {ownerData.communications.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No communications found</Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Pending Actions Alert */}
      {stats.pendingPayouts > 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          You have {stats.pendingPayouts} pending payout(s). They will be processed by the end of the month.
        </Alert>
      )}
    </Container>
  );
};

export default OwnerDashboard;
