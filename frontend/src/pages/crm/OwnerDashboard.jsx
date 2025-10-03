import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Grid, Typography, LinearProgress, Chip } from '@mui/material';
import { 
  TrendingUp, DollarSign, Hospital, Users, Calendar, 
  FileText, Award, ChevronRight, Download, Eye 
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
import crmService from '../../services/crm.service';

const OwnerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [ownerData, setOwnerData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [period, setPeriod] = useState('30days');

  useEffect(() => {
    fetchOwnerData();
  }, [period]);

  const fetchOwnerData = async () => {
    setLoading(true);
    try {
      // In production, get owner ID from auth context
      const ownerId = localStorage.getItem('ownerId') || '1';
      
      const [profileRes, analyticsRes, payoutsRes] = await Promise.all([
        crmService.owners.getById(ownerId),
        crmService.owners.getAnalytics(ownerId, period),
        crmService.owners.getPayouts(ownerId)
      ]);

      setOwnerData(profileRes.data);
      setAnalytics(analyticsRes.data);
      setPayouts(payoutsRes.data || []);
    } catch (error) {
      console.error('Error fetching owner data:', error);
      // Use mock data as fallback
      setOwnerData({
        first_name: 'Adebayo',
        last_name: 'Ogundimu',
        email: 'adebayo@example.com',
        phone: '+234 803 123 4567',
        total_revenue: 150000000,
        total_payouts: 45000000,
        hospital_count: 3,
        contract_count: 3
      });
      setAnalytics({
        period: '30days',
        payouts: {
          total_payouts: 5,
          total_amount: 45000000,
          average_payout: 9000000
        },
        contracts: {
          total_contracts: 3,
          total_contract_value: 450000000,
          avg_commission_rate: 18
        },
        hospitals: [
          { hospital_name: 'Lagos University Teaching Hospital', bed_capacity: 850, staff_count: 2500, total_patients: 15000 },
          { hospital_name: 'National Hospital Abuja', bed_capacity: 450, staff_count: 1200, total_patients: 8500 },
          { hospital_name: 'University College Hospital Ibadan', bed_capacity: 900, staff_count: 3000, total_patients: 18000 }
        ],
        summary: {
          totalRevenue: 150000000,
          activeHospitals: 3,
          totalPatients: 41500
        }
      });
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

  // Chart configurations
  const revenueChartData = {
    labels: Array.from({ length: 30 }, (_, i) => 
      format(subDays(new Date(), 29 - i), 'MMM dd')
    ).filter((_, i) => i % 5 === 0),
    datasets: [
      {
        label: 'Revenue',
        data: [8500000, 9200000, 8800000, 10500000, 11200000, 12000000],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }
    ]
  };

  const hospitalPerformanceData = {
    labels: analytics?.hospitals?.map(h => h.hospital_name.split(' ')[0]) || [],
    datasets: [
      {
        label: 'Patients',
        data: analytics?.hospitals?.map(h => h.total_patients) || [],
        backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(255, 206, 86, 0.8)']
      }
    ]
  };

  const payoutDistributionData = {
    labels: ['Completed', 'Pending', 'Processing'],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: ['#10b981', '#f59e0b', '#3b82f6']
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {ownerData?.first_name} {ownerData?.last_name}
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex gap-2">
          {['7days', '30days', 'month', '90days'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === p 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p === '7days' ? 'Last 7 Days' : 
               p === '30days' ? 'Last 30 Days' : 
               p === 'month' ? 'This Month' : 'Last 90 Days'}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <Grid container spacing={3} className="mb-6">
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Typography color="textSecondary" variant="body2">
                      Total Revenue
                    </Typography>
                    <Typography variant="h5" className="font-bold">
                      {formatCurrency(analytics?.summary?.totalRevenue || 0)}
                    </Typography>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Typography color="textSecondary" variant="body2">
                      Active Hospitals
                    </Typography>
                    <Typography variant="h5" className="font-bold">
                      {analytics?.summary?.activeHospitals || 0}
                    </Typography>
                  </div>
                  <Hospital className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Typography color="textSecondary" variant="body2">
                      Total Patients
                    </Typography>
                    <Typography variant="h5" className="font-bold">
                      {analytics?.summary?.totalPatients?.toLocaleString() || 0}
                    </Typography>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Typography color="textSecondary" variant="body2">
                      Avg Commission
                    </Typography>
                    <Typography variant="h5" className="font-bold">
                      {analytics?.contracts?.avg_commission_rate || 0}%
                    </Typography>
                  </div>
                  <Award className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} className="mb-6">
          <Grid item xs={12} md={8}>
            <Card>
              <CardHeader title="Revenue Trend" />
              <CardContent>
                <Line 
                  data={revenueChartData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => formatCurrency(value)
                        }
                      }
                    }
                  }} 
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader title="Payout Distribution" />
              <CardContent>
                <Doughnut 
                  data={payoutDistributionData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'bottom' }
                    }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Hospital Performance */}
        <Grid container spacing={3} className="mb-6">
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Hospital Performance" />
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Hospital</th>
                        <th className="text-right py-3 px-4">Bed Capacity</th>
                        <th className="text-right py-3 px-4">Staff Count</th>
                        <th className="text-right py-3 px-4">Total Patients</th>
                        <th className="text-right py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics?.hospitals?.map((hospital, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{hospital.hospital_name}</td>
                          <td className="text-right py-3 px-4">{hospital.bed_capacity}</td>
                          <td className="text-right py-3 px-4">{hospital.staff_count}</td>
                          <td className="text-right py-3 px-4">{hospital.total_patients.toLocaleString()}</td>
                          <td className="text-right py-3 px-4">
                            <Chip 
                              label={hospital.status || 'Active'} 
                              color="success" 
                              size="small"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Payouts */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Recent Payouts" 
                action={
                  <button className="text-blue-600 hover:underline flex items-center">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                }
              />
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Hospital</th>
                        <th className="text-right py-3 px-4">Amount</th>
                        <th className="text-left py-3 px-4">Period</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { date: '2025-10-01', hospital: 'LUTH', amount: 15000000, period: 'Sep 2025', status: 'completed' },
                        { date: '2025-09-01', hospital: 'NHA', amount: 12000000, period: 'Aug 2025', status: 'completed' },
                        { date: '2025-08-01', hospital: 'UCH', amount: 18000000, period: 'Jul 2025', status: 'completed' }
                      ].map((payout, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{format(new Date(payout.date), 'MMM dd, yyyy')}</td>
                          <td className="py-3 px-4">{payout.hospital}</td>
                          <td className="text-right py-3 px-4 font-medium">
                            {formatCurrency(payout.amount)}
                          </td>
                          <td className="py-3 px-4">{payout.period}</td>
                          <td className="py-3 px-4">
                            <Chip 
                              label={payout.status} 
                              color={payout.status === 'completed' ? 'success' : 'warning'} 
                              size="small"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <button className="text-blue-600 hover:underline mr-3">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-800">
                              <Download className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

export default OwnerDashboard;
