import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  Phone, 
  MapPin, 
  Heart,
  Activity,
  FileText,
  Pill,
  AlertCircle,
  Clock,
  ChevronRight,
  Edit,
  Plus
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const PatientRecord = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [encounters, setEncounters] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [patientRes, encountersRes, prescriptionsRes, labsRes] = await Promise.all([
        axios.get(`${API_URL}/hospital/emr/patients/${patientId}`, { headers }),
        axios.get(`${API_URL}/hospital/emr/patients/${patientId}/encounters`, { headers }),
        axios.get(`${API_URL}/hospital/emr/patients/${patientId}/prescriptions`, { headers }),
        axios.get(`${API_URL}/hospital/emr/patients/${patientId}/lab-results`, { headers })
      ]);

      setPatient(patientRes.data.patient);
      setEncounters(encountersRes.data.encounters || []);
      setPrescriptions(prescriptionsRes.data.prescriptions || []);
      setLabResults(labsRes.data.results || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setLoading(false);
    }
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient record...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Patient not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Patient Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 rounded-full p-4">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.full_name}</h1>
              <p className="text-gray-600">{patient.registration_number}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {calculateAge(patient.date_of_birth)} years • {patient.gender}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {patient.phone_number}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {patient.address}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/hospital/emr/patient/${patientId}/edit`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
        </div>

        {/* Medical Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Blood Group</p>
            <p className="font-semibold text-lg text-gray-900">{patient.blood_group || 'Unknown'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Genotype</p>
            <p className="font-semibold text-lg text-gray-900">{patient.genotype || 'Unknown'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">NHIS Number</p>
            <p className="font-semibold text-lg text-gray-900">{patient.insurance_id || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">HMO Provider</p>
            <p className="font-semibold text-lg text-gray-900">{patient.insurance_provider || 'N/A'}</p>
          </div>
        </div>

        {/* Alerts */}
        {(patient.allergies || patient.chronic_conditions) && (
          <div className="mt-4 space-y-2">
            {patient.allergies && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Allergies</p>
                  <p className="text-sm text-yellow-700">{patient.allergies}</p>
                </div>
              </div>
            )}
            {patient.chronic_conditions && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                <Heart className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">Chronic Conditions</p>
                  <p className="text-sm text-orange-700">{patient.chronic_conditions}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <div className="flex">
            {['overview', 'encounters', 'prescriptions', 'lab-results', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Recent Encounters */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Encounters</h3>
                  <button
                    onClick={() => navigate(`/hospital/emr/encounter/new?patientId=${patientId}`)}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    New Encounter
                  </button>
                </div>
                {encounters.length === 0 ? (
                  <p className="text-gray-500">No encounters recorded</p>
                ) : (
                  <div className="space-y-3">
                    {encounters.slice(0, 3).map((encounter) => (
                      <div 
                        key={encounter.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/hospital/emr/encounter/${encounter.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {encounter.encounter_type} - {encounter.chief_complaint}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(encounter.encounter_date).toLocaleDateString('en-NG')}
                              {encounter.attending_physician && ` • Dr. ${encounter.attending_physician}`}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Prescriptions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Prescriptions</h3>
                {prescriptions.filter(p => p.status === 'active').length === 0 ? (
                  <p className="text-gray-500">No active prescriptions</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {prescriptions
                      .filter(p => p.status === 'active')
                      .slice(0, 4)
                      .map((prescription) => (
                        <div key={prescription.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{prescription.medication_name}</p>
                              <p className="text-sm text-gray-600">
                                {prescription.dosage} • {prescription.frequency}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {prescription.duration} • Started {new Date(prescription.start_date).toLocaleDateString('en-NG')}
                              </p>
                            </div>
                            <Pill className="h-5 w-5 text-blue-500" />
                          </div>
                        </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Lab Results */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Lab Results</h3>
                {labResults.length === 0 ? (
                  <p className="text-gray-500">No lab results available</p>
                ) : (
                  <div className="space-y-3">
                    {labResults.slice(0, 3).map((result) => (
                      <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{result.test_name}</p>
                            <p className="text-sm text-gray-600">
                              Result: {result.result_value} {result.unit}
                              {result.reference_range && (
                                <span className="text-gray-500"> (Ref: {result.reference_range})</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(result.result_date).toLocaleDateString('en-NG')}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.status === 'critical' ? 'bg-red-100 text-red-800' :
                            result.status === 'abnormal' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {result.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Encounters Tab */}
          {activeTab === 'encounters' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">All Encounters</h3>
                <button
                  onClick={() => navigate(`/hospital/emr/encounter/new?patientId=${patientId}`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Encounter
                </button>
              </div>
              {encounters.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No encounters recorded</p>
              ) : (
                <div className="space-y-3">
                  {encounters.map((encounter) => (
                    <div 
                      key={encounter.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/hospital/emr/encounter/${encounter.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              encounter.encounter_type === 'emergency' ? 'bg-red-100 text-red-800' :
                              encounter.encounter_type === 'inpatient' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {encounter.encounter_type}
                            </span>
                            <span className="text-sm text-gray-600">
                              {new Date(encounter.encounter_date).toLocaleDateString('en-NG')}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900">{encounter.chief_complaint}</p>
                          {encounter.diagnosis && (
                            <p className="text-sm text-gray-600 mt-1">
                              Diagnosis: {encounter.diagnosis}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 mt-2">
                            Dr. {encounter.attending_physician || 'Not assigned'}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Prescriptions</h3>
              {prescriptions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No prescriptions recorded</p>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((prescription) => (
                    <div key={prescription.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-medium text-gray-900">{prescription.medication_name}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              prescription.status === 'active' ? 'bg-green-100 text-green-800' :
                              prescription.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {prescription.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                            <p>Dosage: {prescription.dosage}</p>
                            <p>Frequency: {prescription.frequency}</p>
                            <p>Duration: {prescription.duration}</p>
                          </div>
                          {prescription.instructions && (
                            <p className="text-sm text-gray-600 mt-2">
                              Instructions: {prescription.instructions}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Prescribed on {new Date(prescription.start_date).toLocaleDateString('en-NG')}
                            {prescription.prescribed_by && ` by Dr. ${prescription.prescribed_by}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lab Results Tab */}
          {activeTab === 'lab-results' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">All Lab Results</h3>
              {labResults.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No lab results available</p>
              ) : (
                <div className="space-y-3">
                  {labResults.map((result) => (
                    <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-medium text-gray-900">{result.test_name}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              result.status === 'critical' ? 'bg-red-100 text-red-800' :
                              result.status === 'abnormal' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {result.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">
                                Result: <span className="font-medium text-gray-900">
                                  {result.result_value} {result.unit}
                                </span>
                              </p>
                              {result.reference_range && (
                                <p className="text-gray-600">
                                  Reference: {result.reference_range}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-gray-600">
                                Date: {new Date(result.result_date).toLocaleDateString('en-NG')}
                              </p>
                              {result.performed_by && (
                                <p className="text-gray-600">
                                  Performed by: {result.performed_by}
                                </p>
                              )}
                            </div>
                          </div>
                          {result.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              Notes: {result.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>
              <div className="space-y-6">
                {/* Past Medical History */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Past Medical History</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {patient.medical_history ? (
                      <p className="text-gray-700">{patient.medical_history}</p>
                    ) : (
                      <p className="text-gray-500">No past medical history recorded</p>
                    )}
                  </div>
                </div>

                {/* Family History */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Family History</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {patient.family_history ? (
                      <p className="text-gray-700">{patient.family_history}</p>
                    ) : (
                      <p className="text-gray-500">No family history recorded</p>
                    )}
                  </div>
                </div>

                {/* Social History */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Social History</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {patient.social_history ? (
                      <p className="text-gray-700">{patient.social_history}</p>
                    ) : (
                      <p className="text-gray-500">No social history recorded</p>
                    )}
                  </div>
                </div>

                {/* Immunization History */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Immunization History</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {patient.immunization_history ? (
                      <p className="text-gray-700">{patient.immunization_history}</p>
                    ) : (
                      <p className="text-gray-500">No immunization history recorded</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientRecord;
