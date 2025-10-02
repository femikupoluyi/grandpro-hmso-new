import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, ClockIcon, UserIcon, PlusIcon } from '@heroicons/react/24/outline';

const mockAppointments = [
  {
    id: 1,
    doctor_name: 'Dr. Adewale Ogundimu',
    department: 'General Medicine',
    appointmentDate: '2025-10-15',
    appointmentTime: '10:00',
    status: 'SCHEDULED',
    reason: 'Regular checkup'
  },
  {
    id: 2,
    doctor_name: 'Dr. Fatima Abdullahi',
    department: 'Cardiology', 
    appointmentDate: '2025-10-20',
    appointmentTime: '14:30',
    status: 'SCHEDULED',
    reason: 'Follow-up consultation'
  },
  {
    id: 3,
    doctor_name: 'Dr. Chinedu Okafor',
    department: 'Dermatology',
    appointmentDate: '2025-09-10',
    appointmentTime: '11:00',
    status: 'COMPLETED',
    reason: 'Skin examination'
  }
];

export default function Appointments() {
  const [appointments] = useState(mockAppointments);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Appointments</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your medical appointments</p>
          </div>
          <button 
            onClick={() => setShowScheduleModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Schedule Appointment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Appointments</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            {appointments
              .filter(apt => apt.status === 'SCHEDULED')
              .map(appointment => (
                <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{appointment.doctor_name}</h3>
                      <p className="text-sm text-gray-500">{appointment.department}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {format(new Date(appointment.appointmentDate), 'EEEE, MMMM d, yyyy')}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {appointment.appointmentTime}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Reason: {appointment.reason}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {appointment.status}
                      </span>
                      <button className="text-sm text-primary-600 hover:text-primary-700">
                        Reschedule
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Past Appointments */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Past Appointments</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            {appointments
              .filter(apt => apt.status === 'COMPLETED')
              .map(appointment => (
                <div key={appointment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{appointment.doctor_name}</h3>
                      <p className="text-sm text-gray-500">{appointment.department}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(appointment.appointmentDate), 'MMM d, yyyy')} at {appointment.appointmentTime}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {appointment.reason}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Reminders Section */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Appointment Reminders:</strong> You will receive SMS and Email reminders 24 hours and 1 hour before your appointments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
