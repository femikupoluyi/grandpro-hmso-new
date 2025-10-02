import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FolderIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/operations'
});

export default function ProjectManagement() {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const hospitalId = localStorage.getItem('hospitalId') || 'default';

  // Fetch projects
  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['projects', hospitalId, selectedStatus],
    queryFn: async () => {
      const params = { hospital_id: hospitalId };
      if (selectedStatus !== 'all') params.status = selectedStatus;
      
      const response = await api.get('/projects', { params });
      return response.data.data;
    }
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PLANNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      case 'ON_HOLD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'INFRASTRUCTURE':
        return '🏗️';
      case 'IT':
        return '💻';
      case 'RENOVATION':
        return '🔨';
      case 'EQUIPMENT':
        return '🏥';
      case 'TRAINING':
        return '📚';
      default:
        return '📁';
    }
  };

  const calculateDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = {
    total: projects?.length || 0,
    in_progress: projects?.filter(p => p.status === 'IN_PROGRESS').length || 0,
    planning: projects?.filter(p => p.status === 'PLANNING').length || 0,
    completed: projects?.filter(p => p.status === 'COMPLETED').length || 0,
    total_budget: projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0,
    total_spent: projects?.reduce((sum, p) => sum + (p.spent || 0), 0) || 0
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              Hospital expansion, renovation, and IT projects
            </p>
          </div>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            New Project
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Projects</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">In Progress</div>
          <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Planning</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.planning}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Budget</div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(stats.total_budget)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Spent</div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(stats.total_spent)}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="all">All Projects</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PLANNING">Planning</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects?.map((project) => {
          const daysRemaining = calculateDaysRemaining(project.end_date);
          const budgetUtilization = (project.spent / project.budget) * 100;
          
          return (
            <div key={project.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getTypeIcon(project.type)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.name}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Progress</span>
                    <span className="text-xs font-semibold text-gray-900">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Duration
                    </div>
                    <span className="text-gray-900">
                      {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      Time Remaining
                    </div>
                    <span className={`font-medium ${daysRemaining < 30 ? 'text-red-600' : 'text-gray-900'}`}>
                      {daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-500">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                      Budget
                    </div>
                    <span className="text-gray-900">
                      {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-500">
                      <UserIcon className="h-4 w-4 mr-1" />
                      Manager
                    </div>
                    <span className="text-gray-900">{project.manager}</span>
                  </div>
                </div>

                {/* Budget Utilization Bar */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Budget Utilization</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {Math.round(budgetUtilization)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        budgetUtilization > 90 ? 'bg-red-600' :
                        budgetUtilization > 75 ? 'bg-yellow-600' :
                        'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(100, budgetUtilization)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Milestones */}
                {project.milestones && project.milestones.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Milestones
                    </h4>
                    <div className="space-y-1">
                      {project.milestones.slice(0, 3).map((milestone, index) => (
                        <div key={index} className="flex items-center text-xs">
                          {milestone.status === 'COMPLETED' ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                          ) : milestone.status === 'IN_PROGRESS' ? (
                            <ClockIcon className="h-4 w-4 text-blue-500 mr-1" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 text-gray-400 mr-1" />
                          )}
                          <span className={`${
                            milestone.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-700'
                          }`}>
                            {milestone.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                  <button className="text-sm text-primary-600 hover:text-primary-900 font-medium">
                    View Details
                  </button>
                  <button className="text-sm text-blue-600 hover:text-blue-900 font-medium">
                    Update Progress
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {(!projects || projects.length === 0) && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">
            {selectedStatus === 'all' 
              ? 'Get started by creating your first project'
              : `No projects with status: ${selectedStatus}`}
          </p>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Create New Project
          </button>
        </div>
      )}
    </div>
  );
}
