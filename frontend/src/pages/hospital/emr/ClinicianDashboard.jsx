import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  UserPlus, 
  Activity, 
  Calendar,
  FileText,
  AlertCircle,
  Clock,
  Users,
  TrendingUp,
  Heart,
  Pill
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ClinicianDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayPatients: 0,
    pendingEncounters: 0,
    criticalAlerts: 0,
    labResultsPending: 0
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [criticalLabs, setCriticalLabs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [patientsRes, encountersRes, labsRes] = await Promise.all([
        axios.get(`${API_URL}/hospital/emr/patients/recent`, { headers }),
        axios.get(`${API_URL}/hospital/emr/encounters/today`, { headers }),
        axios.get(`${API_URL}/hospital/emr/lab-results/critical`, { headers })
      ]);

      setRecentPatients(patientsRes.data.patients || []);
      setEncounters(encountersRes.data.encounters || []);
      setCriticalLabs(labsRes.data.results || []);

      setStats({
        todayPatients: encountersRes.data.encounters?.length || 0,
        pendingEncounters: encountersRes.data.encounters?.filter(e => e.status === 'in_progress').length || 0,
        criticalAlerts: labsRes.data.results?.length || 0,
        labResultsPending: labsRes.data.pending || 0
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handlePatientSearch = async () => {
    if (!searchTerm) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/hospital/emr/patients/search`, {
        params: { query: searchTerm },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.patients && response.data.patients.length > 0) {
        navigate(`/hospital/emr/patient/${response.data.patients[0].id}`);
      } else {
        alert('No patient found with that ID or name');
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      alert('Error searching for patient');
    }
  };

  const getEncounterTypeColor = (type) => {
    switch(type) {
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'inpatient': return 'bg-blue-100 text-blue-800';
      case 'outpatient': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'critical': return 'text-red-600';
      case 'abnormal': return 'text-yellow-600';
      case 'normal': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clinician dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Clinician Dashboard</h1>
        <p className="text-gray-600 mt-2">Electronic Medical Records System</p>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search patient by ID or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePatientSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <button
            onClick={() => navigate('/hospital/emr/patient/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <UserPlus className="h-5 w-5" />
            Register Patient
          </button>
          <button
            onClick={() => navigate('/hospital/emr/encounter/new')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Activity className="h-5 w-5" />
            New Encounter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today's Patients</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.todayPatients}</p>
            </div>
            <Users className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active Encounters</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingEncounters}</p>
            </div>
            <Clock className="h-10 w-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.criticalAlerts}</p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Lab Results</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.labResultsPending}</p>
            </div>
            <FileText className="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Encounters */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Today's Encounters
            </h2>
          </div>
          <div className="p-4">
            {encounters.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No encounters today</p>
            ) : (
              <div className="space-y-3">
                {encounters.slice(0, 5).map((encounter) => (
                  <div 
                    key={encounter.id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/hospital/emr/encounter/${encounter.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {encounter.patient_name}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({encounter.patient_id})
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEncounterTypeColor(encounter.encounter_type)}`}>
                        {encounter.encounter_type}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {encounter.chief_complaint}
                      </span>
                      <span className="text-gray-500">
                        {new Date(encounter.encounter_date).toLocaleTimeString('en-NG', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {encounters.length > 5 && (
              <button 
                onClick={() => navigate('/hospital/emr/encounters')}
                className="w-full mt-4 text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All Encounters →
              </button>
            )}
          </div>
        </div>

        {/* Critical Lab Results */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Critical Lab Results
            </h2>
          </div>
          <div className="p-4">
            {criticalLabs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No critical results</p>
            ) : (
              <div className="space-y-3">
                {criticalLabs.slice(0, 5).map((lab) => (
                  <div 
                    key={lab.id}
                    className="border border-red-200 rounded-lg p-3 bg-red-50 cursor-pointer"
                    onClick={() => navigate(`/hospital/emr/lab-result/${lab.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {lab.patient_name}
                      </span>
                      <span className={`font-semibold ${getStatusColor(lab.status)}`}>
                        {lab.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-700 font-medium">{lab.test_name}</p>
                      <p className="text-gray-600">
                        Result: <span className="font-semibold">{lab.result_value}</span> {lab.unit}
                        {lab.reference_range && (
                          <span className="text-gray-500"> (Ref: {lab.reference_range})</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {criticalLabs.length > 5 && (
              <button 
                onClick={() => navigate('/hospital/emr/lab-results/critical')}
                className="w-full mt-4 text-center text-red-600 hover:text-red-700 text-sm font-medium"
              >
                View All Critical Results →
              </button>
            )}
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-lg shadow-md lg:col-span-2">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Recent Patients
            </h2>
          </div>
          <div className="p-4">
            {recentPatients.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent patients</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentPatients.slice(0, 6).map((patient) => (
                  <div 
                    key={patient.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/hospital/emr/patient/${patient.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{patient.full_name}</p>
                        <p className="text-sm text-gray-500">{patient.registration_number}</p>
                      </div>
                      {patient.has_allergies && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Allergies
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{patient.age} years • {patient.gender}</p>
                      <p>Blood: {patient.blood_group || 'Unknown'}</p>
                      {patient.chronic_conditions && (
                        <p className="text-orange-600 mt-1">
                          {patient.chronic_conditions}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate('/hospital/emr/prescriptions')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <Pill className="h-5 w-5" />
            Prescriptions
          </button>
          <button
            onClick={() => navigate('/hospital/emr/appointments')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <Calendar className="h-5 w-5" />
            Appointments
          </button>
          <button
            onClick={() => navigate('/hospital/emr/reports')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <TrendingUp className="h-5 w-5" />
            Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicianDashboard;
