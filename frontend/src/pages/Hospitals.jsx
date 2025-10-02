import { useState, useEffect } from 'react';
import axios from 'axios';
import { Hospital, MapPin, Phone, Mail, Users, Bed } from 'lucide-react';

const Hospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('');

  const nigerianStates = [
    'All States', 'Lagos', 'FCT', 'Kano', 'Rivers', 'Oyo', 'Kaduna', 
    'Enugu', 'Delta', 'Edo', 'Anambra', 'Imo', 'Ogun'
  ];

  useEffect(() => {
    fetchHospitals();
  }, [selectedState]);

  const fetchHospitals = async () => {
    try {
      const params = selectedState && selectedState !== 'All States' 
        ? { state: selectedState } 
        : {};
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/hospitals`, { params });
      setHospitals(response.data.hospitals);
    } catch (error) {
      console.error('Failed to fetch hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospitals</h1>
          <p className="text-sm text-gray-500">Manage and monitor hospital partners</p>
        </div>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
          Add New Hospital
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-4">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            {nigerianStates.map(state => (
              <option key={state} value={state === 'All States' ? '' : state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hospital Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {hospitals.map((hospital) => (
          <div key={hospital.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <Hospital className="h-10 w-10 text-primary-600" />
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {hospital.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Reg. No: {hospital.registration_number || 'Pending'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(hospital.status)}`}>
                  {hospital.status}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  {hospital.city}, {hospital.state}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {hospital.phone_number}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {hospital.email}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Bed className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Beds</p>
                      <p className="text-sm font-medium text-gray-900">
                        {hospital.bed_capacity || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Staff</p>
                      <p className="text-sm font-medium text-gray-900">
                        {hospital.staff_count || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {hospital.specialties && hospital.specialties.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Specialties</p>
                  <div className="flex flex-wrap gap-1">
                    {hospital.specialties.slice(0, 3).map((specialty, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex space-x-2">
                <button className="flex-1 px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700">
                  View Details
                </button>
                <button className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hospitals.length === 0 && (
        <div className="text-center py-12">
          <Hospital className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">No hospitals found</p>
        </div>
      )}
    </div>
  );
};

export default Hospitals;
