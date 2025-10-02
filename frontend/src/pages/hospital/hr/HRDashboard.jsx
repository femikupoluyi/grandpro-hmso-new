import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Clock,
  UserCheck,
  UserX,
  Award,
  AlertCircle,
  TrendingUp,
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  ChevronRight,
  Briefcase,
  MapPin
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const HRDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStaff: 0,
    onDuty: 0,
    onLeave: 0,
    todayAttendance: 0,
    monthlyPayroll: 0,
    pendingLeaveRequests: 0
  });
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [upcomingPayroll, setUpcomingPayroll] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHRData();
    const interval = setInterval(fetchHRData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [filterDepartment]);

  const fetchHRData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, scheduleRes, leaveRes, attendanceRes, payrollRes] = await Promise.all([
        axios.get(`${API_URL}/hospital/hr/stats`, { headers }),
        axios.get(`${API_URL}/hospital/hr/schedule/today`, { headers }),
        axios.get(`${API_URL}/hospital/hr/leaves/pending`, { headers }),
        axios.get(`${API_URL}/hospital/hr/attendance/today`, { headers }),
        axios.get(`${API_URL}/hospital/hr/payroll/upcoming`, { headers })
      ]);

      setStats(statsRes.data.stats || {
        totalStaff: 0,
        onDuty: 0,
        onLeave: 0,
        todayAttendance: 0,
        monthlyPayroll: 0,
        pendingLeaveRequests: 0
      });
      setTodaySchedule(scheduleRes.data.schedule || []);
      setLeaveRequests(leaveRes.data.requests || []);
      setAttendanceSummary(attendanceRes.data.summary || []);
      setUpcomingPayroll(payrollRes.data.payroll || null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching HR data:', error);
      setLoading(false);
    }
  };

  const handleSearchStaff = async () => {
    if (!searchTerm) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/hospital/hr/staff/search`, {
        params: { query: searchTerm },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.staff && response.data.staff.length > 0) {
        navigate(`/hospital/hr/staff/${response.data.staff[0].id}`);
      } else {
        alert('No staff member found');
      }
    } catch (error) {
      console.error('Error searching staff:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getShiftColor = (shift) => {
    switch(shift) {
      case 'morning': return 'bg-yellow-100 text-yellow-800';
      case 'afternoon': return 'bg-orange-100 text-orange-800';
      case 'night': return 'bg-indigo-100 text-indigo-800';
      case 'on_call': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAttendanceColor = (status) => {
    switch(status) {
      case 'present': return 'text-green-600';
      case 'late': return 'text-yellow-600';
      case 'absent': return 'text-red-600';
      case 'on_leave': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading HR dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">HR Management Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage staff, schedules, attendance, and payroll</p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search staff by name, ID, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchStaff()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Departments</option>
            <option value="medical">Medical</option>
            <option value="nursing">Nursing</option>
            <option value="admin">Administration</option>
            <option value="support">Support Staff</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="lab">Laboratory</option>
          </select>
          <button
            onClick={() => navigate('/hospital/hr/staff/add')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Staff
          </button>
          <button
            onClick={() => navigate('/hospital/hr/schedule')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Calendar className="h-5 w-5" />
            Schedule
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Staff</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalStaff}</p>
            </div>
            <Users className="h-10 w-10 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">On Duty</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.onDuty}</p>
            </div>
            <UserCheck className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">On Leave</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.onLeave}</p>
            </div>
            <UserX className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Attendance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.todayAttendance}%
              </p>
            </div>
            <Clock className="h-10 w-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Leave Requests</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {stats.pendingLeaveRequests}
              </p>
            </div>
            <AlertCircle className="h-10 w-10 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Monthly Payroll</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {formatCurrency(stats.monthlyPayroll)}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-green-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedule
            </h2>
            <button
              onClick={() => navigate('/hospital/hr/schedule')}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              View Full Schedule →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Shift
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todaySchedule.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No schedules for today
                    </td>
                  </tr>
                ) : (
                  todaySchedule.slice(0, 8).map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {schedule.staff_name}
                          </p>
                          <p className="text-xs text-gray-500">{schedule.staff_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {schedule.department}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getShiftColor(schedule.shift_type)}`}>
                          {schedule.shift_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {schedule.start_time} - {schedule.end_time}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-medium text-sm ${getAttendanceColor(schedule.attendance_status)}`}>
                          {schedule.attendance_status || 'Not Marked'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Leave Requests
            </h2>
            <button
              onClick={() => navigate('/hospital/hr/leaves')}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              View All →
            </button>
          </div>
          <div className="p-4">
            {leaveRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No pending leave requests</p>
            ) : (
              <div className="space-y-3">
                {leaveRequests.slice(0, 5).map((request) => (
                  <div 
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/hospital/hr/leave/${request.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {request.staff_name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {request.leave_type} Leave
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.start_date).toLocaleDateString('en-NG')} - 
                          {new Date(request.end_date).toLocaleDateString('en-NG')}
                          {' '}({request.days} days)
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle approve
                          }}
                          className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle reject
                          }}
                          className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Today's Attendance
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Present</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(attendanceSummary.present || 0) / (stats.totalStaff || 1) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {attendanceSummary.present || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Late</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full" 
                      style={{ width: `${(attendanceSummary.late || 0) / (stats.totalStaff || 1) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {attendanceSummary.late || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Absent</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${(attendanceSummary.absent || 0) / (stats.totalStaff || 1) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {attendanceSummary.absent || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">On Leave</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(attendanceSummary.on_leave || 0) / (stats.totalStaff || 1) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {attendanceSummary.on_leave || 0}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/hospital/hr/attendance')}
              className="w-full mt-4 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            >
              Mark Attendance
            </button>
          </div>
        </div>

        {/* Upcoming Payroll */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Upcoming Payroll
            </h2>
          </div>
          <div className="p-4">
            {upcomingPayroll ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Pay Period</p>
                  <p className="font-medium text-gray-900">
                    {upcomingPayroll.period}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Processing Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(upcomingPayroll.process_date).toLocaleDateString('en-NG')}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Gross Salary</span>
                      <span className="font-medium">
                        {formatCurrency(upcomingPayroll.total_gross || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Deductions</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(upcomingPayroll.total_deductions || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                      <span>Net Payroll</span>
                      <span>{formatCurrency(upcomingPayroll.total_net || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-600">
                  <p>• PAYE Tax: {formatCurrency(upcomingPayroll.total_tax || 0)}</p>
                  <p>• Pension: {formatCurrency(upcomingPayroll.total_pension || 0)}</p>
                  <p>• NHIS: {formatCurrency(upcomingPayroll.total_nhis || 0)}</p>
                </div>

                <button
                  onClick={() => navigate('/hospital/hr/payroll')}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Process Payroll
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">No upcoming payroll</p>
                <button
                  onClick={() => navigate('/hospital/hr/payroll/new')}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Create Payroll
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Department Distribution */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Staff by Department</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'Medical', count: stats.medicalStaff || 0, icon: '👨‍⚕️', color: 'blue' },
            { name: 'Nursing', count: stats.nursingStaff || 0, icon: '👩‍⚕️', color: 'pink' },
            { name: 'Admin', count: stats.adminStaff || 0, icon: '👔', color: 'gray' },
            { name: 'Pharmacy', count: stats.pharmacyStaff || 0, icon: '💊', color: 'green' },
            { name: 'Lab', count: stats.labStaff || 0, icon: '🔬', color: 'purple' },
            { name: 'Support', count: stats.supportStaff || 0, icon: '🧹', color: 'yellow' }
          ].map((dept) => (
            <div key={dept.name} className={`bg-${dept.color}-50 rounded-lg p-4 text-center`}>
              <div className="text-2xl mb-2">{dept.icon}</div>
              <p className="text-sm text-gray-600">{dept.name}</p>
              <p className={`text-xl font-bold text-${dept.color}-700 mt-1`}>
                {dept.count}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate('/hospital/hr/roster')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <Calendar className="h-5 w-5" />
            Duty Roster
          </button>
          <button
            onClick={() => navigate('/hospital/hr/training')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <Award className="h-5 w-5" />
            Training & Development
          </button>
          <button
            onClick={() => navigate('/hospital/hr/performance')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <TrendingUp className="h-5 w-5" />
            Performance Reviews
          </button>
          <button
            onClick={() => navigate('/hospital/hr/reports')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <FileText className="h-5 w-5" />
            HR Reports
          </button>
          <button
            onClick={() => navigate('/hospital/hr/export')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <Download className="h-5 w-5" />
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
