import { useState, useEffect } from 'react';
import { BellIcon, CheckIcon, XMarkIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { format, addDays, isPast, isToday, isTomorrow } from 'date-fns';

// Mock reminders data with Nigerian context
const mockReminders = [
  {
    id: 1,
    type: 'APPOINTMENT',
    title: 'Upcoming Appointment',
    message: 'Appointment with Dr. Adewale Ogundimu tomorrow at 10:00 AM',
    date: addDays(new Date(), 1),
    time: '10:00',
    priority: 'HIGH',
    status: 'PENDING',
    actions: ['CONFIRM', 'RESCHEDULE'],
    doctor: 'Dr. Adewale Ogundimu',
    department: 'General Medicine',
    location: 'Lagos Central Hospital, Block B, Room 204'
  },
  {
    id: 2,
    type: 'MEDICATION',
    title: 'Medication Reminder',
    message: 'Time to take your Amlodipine 5mg',
    date: new Date(),
    time: '08:00',
    priority: 'MEDIUM',
    status: 'PENDING',
    recurring: true,
    frequency: 'DAILY',
    medication: 'Amlodipine 5mg',
    instructions: 'Take 1 tablet with water after breakfast'
  },
  {
    id: 3,
    type: 'LAB_RESULT',
    title: 'Lab Results Available',
    message: 'Your blood test results from October 10 are now available',
    date: new Date(),
    priority: 'LOW',
    status: 'UNREAD',
    actions: ['VIEW', 'DOWNLOAD'],
    testType: 'Full Blood Count',
    orderDate: '2025-10-10'
  },
  {
    id: 4,
    type: 'VACCINATION',
    title: 'Vaccination Due',
    message: 'Your Hepatitis B booster shot is due',
    date: addDays(new Date(), 7),
    priority: 'MEDIUM',
    status: 'PENDING',
    actions: ['SCHEDULE'],
    vaccine: 'Hepatitis B Booster',
    dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd')
  },
  {
    id: 5,
    type: 'INSURANCE',
    title: 'Insurance Renewal',
    message: 'Your NHIS insurance expires in 30 days',
    date: addDays(new Date(), 30),
    priority: 'LOW',
    status: 'PENDING',
    provider: 'NHIS',
    policyNumber: 'NHIS987654',
    expiryDate: format(addDays(new Date(), 30), 'yyyy-MM-dd')
  },
  {
    id: 6,
    type: 'FOLLOW_UP',
    title: 'Follow-up Required',
    message: 'Schedule follow-up for hypertension management',
    date: addDays(new Date(), 3),
    priority: 'HIGH',
    status: 'PENDING',
    condition: 'Hypertension',
    lastVisit: '2025-09-15',
    recommendedTimeframe: 'Within 1 week'
  }
];

function Reminders() {
  const [reminders, setReminders] = useState(mockReminders);
  const [filter, setFilter] = useState('ALL');
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [preferences, setPreferences] = useState({
    sms: true,
    email: true,
    whatsapp: true,
    push: false
  });

  const getReminderIcon = (type) => {
    switch (type) {
      case 'APPOINTMENT':
        return <ClockIcon className="h-5 w-5" />;
      case 'MEDICATION':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      default:
        return <BellIcon className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600 bg-red-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'LOW':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTimeLabel = (date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(date)) return 'Overdue';
    return format(date, 'MMM dd, yyyy');
  };

  const handleMarkAsRead = (id) => {
    setReminders(prev => 
      prev.map(r => r.id === id ? { ...r, status: 'READ' } : r)
    );
  };

  const handleDismiss = (id) => {
    setReminders(prev => 
      prev.filter(r => r.id !== id)
    );
  };

  const handleAction = (reminder, action) => {
    switch (action) {
      case 'CONFIRM':
        alert(`Appointment confirmed with ${reminder.doctor}`);
        handleMarkAsRead(reminder.id);
        break;
      case 'RESCHEDULE':
        alert('Opening appointment rescheduling...');
        break;
      case 'VIEW':
        alert(`Viewing ${reminder.testType} results...`);
        break;
      case 'DOWNLOAD':
        alert(`Downloading ${reminder.testType} results...`);
        break;
      case 'SCHEDULE':
        alert(`Scheduling ${reminder.vaccine}...`);
        break;
      default:
        break;
    }
  };

  const filteredReminders = reminders.filter(reminder => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return reminder.status === 'PENDING' || reminder.status === 'UNREAD';
    return reminder.type === filter;
  });

  const reminderCounts = {
    all: reminders.length,
    unread: reminders.filter(r => r.status === 'PENDING' || r.status === 'UNREAD').length,
    appointments: reminders.filter(r => r.type === 'APPOINTMENT').length,
    medications: reminders.filter(r => r.type === 'MEDICATION').length,
    results: reminders.filter(r => r.type === 'LAB_RESULT').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Health Reminders</h1>
            <p className="text-gray-600 mt-1">Stay on top of your health with timely notifications</p>
          </div>
          <div className="flex items-center space-x-2">
            <BellIcon className="h-6 w-6 text-indigo-600" />
            <span className="text-lg font-semibold text-indigo-600">{reminderCounts.unread}</span>
            <span className="text-gray-500">New</span>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Notification Channels</h3>
          <div className="flex space-x-6">
            {Object.entries(preferences).map(([channel, enabled]) => (
              <label key={channel} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setPreferences({ ...preferences, [channel]: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm capitalize text-gray-700">{channel === 'sms' ? 'SMS' : channel}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="border-b">
          <nav className="flex -mb-px">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-6 py-3 text-sm font-medium ${
                filter === 'ALL'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All ({reminderCounts.all})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-6 py-3 text-sm font-medium ${
                filter === 'UNREAD'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Unread ({reminderCounts.unread})
            </button>
            <button
              onClick={() => setFilter('APPOINTMENT')}
              className={`px-6 py-3 text-sm font-medium ${
                filter === 'APPOINTMENT'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Appointments ({reminderCounts.appointments})
            </button>
            <button
              onClick={() => setFilter('MEDICATION')}
              className={`px-6 py-3 text-sm font-medium ${
                filter === 'MEDICATION'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Medications ({reminderCounts.medications})
            </button>
            <button
              onClick={() => setFilter('LAB_RESULT')}
              className={`px-6 py-3 text-sm font-medium ${
                filter === 'LAB_RESULT'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Lab Results ({reminderCounts.results})
            </button>
          </nav>
        </div>

        {/* Reminders List */}
        <div className="divide-y">
          {filteredReminders.length === 0 ? (
            <div className="p-12 text-center">
              <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No reminders to display</p>
            </div>
          ) : (
            filteredReminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  reminder.status === 'READ' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`mt-1 p-2 rounded-lg ${getPriorityColor(reminder.priority)}`}>
                    {getReminderIcon(reminder.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {reminder.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {reminder.message}
                        </p>
                        {reminder.location && (
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {reminder.location}
                          </p>
                        )}
                        {reminder.instructions && (
                          <p className="text-xs text-gray-500 mt-1">
                            💊 {reminder.instructions}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-gray-500">
                            {getTimeLabel(reminder.date)}
                            {reminder.time && ` at ${reminder.time}`}
                          </span>
                          {reminder.recurring && (
                            <span className="text-xs text-indigo-600 font-medium">
                              🔄 {reminder.frequency}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {reminder.actions?.map((action) => (
                          <button
                            key={action}
                            onClick={() => handleAction(reminder, action)}
                            className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-md hover:bg-indigo-100"
                          >
                            {action}
                          </button>
                        ))}
                        {reminder.status !== 'READ' && (
                          <button
                            onClick={() => handleMarkAsRead(reminder.id)}
                            className="text-gray-400 hover:text-green-600"
                            title="Mark as read"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(reminder.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Dismiss"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <ClockIcon className="h-6 w-6 text-indigo-600 mb-2" />
            <h4 className="font-medium text-gray-900">Schedule Appointment</h4>
            <p className="text-sm text-gray-500 mt-1">Book your next visit</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <BellIcon className="h-6 w-6 text-indigo-600 mb-2" />
            <h4 className="font-medium text-gray-900">Set Medication Reminder</h4>
            <p className="text-sm text-gray-500 mt-1">Never miss a dose</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <ExclamationTriangleIcon className="h-6 w-6 text-indigo-600 mb-2" />
            <h4 className="font-medium text-gray-900">Update Preferences</h4>
            <p className="text-sm text-gray-500 mt-1">Customize notifications</p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Reminders;
