import React, { useState } from 'react';
import { 
  LayoutDashboard, AlertCircle, Briefcase, 
  ChevronRight, Home, Settings
} from 'lucide-react';
import CommandCentreDashboard from './Dashboard';
import AlertsManagement from './AlertsManagement';
import ProjectBoard from './ProjectBoard';

const CommandCentre = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      component: <CommandCentreDashboard />
    },
    {
      id: 'alerts',
      name: 'Alerts Management',
      icon: <AlertCircle className="h-5 w-5" />,
      component: <AlertsManagement />
    },
    {
      id: 'projects',
      name: 'Project Board',
      icon: <Briefcase className="h-5 w-5" />,
      component: <ProjectBoard />
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm">
              <Home className="h-4 w-4 text-gray-500" />
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Operations</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">Command Centre</span>
            </div>

            {/* Settings */}
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTabData?.component}
      </div>
    </div>
  );
};

export default CommandCentre;
