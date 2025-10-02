import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Calendar,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  TrendingUp,
  FileText,
  MoreVertical,
  Filter,
  Search
} from 'lucide-react';
import api from '../../services/api';

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  const fetchProjects = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/operations/projects', { params });
      if (response.data.success) {
        setProjects(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetails = async (projectId) => {
    try {
      const response = await api.get(`/operations/projects/${projectId}`);
      if (response.data.success) {
        setSelectedProject(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  };

  const updateProjectStatus = async (projectId, newStatus) => {
    try {
      await api.put(`/operations/projects/${projectId}/status`, {
        status: newStatus,
        updatedBy: 'Admin User'
      });
      fetchProjects();
      if (selectedProject?.id === projectId) {
        fetchProjectDetails(projectId);
      }
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'planning': return 'bg-gray-100 text-gray-700';
      case 'approved': return 'bg-blue-100 text-blue-700';
      case 'active': return 'bg-green-100 text-green-700';
      case 'on_hold': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-purple-100 text-purple-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getScheduleStatus = (project) => {
    if (!project.end_date) return 'on-track';
    const daysRemaining = Math.floor((new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0 && project.status !== 'completed') return 'overdue';
    if (daysRemaining < 7) return 'at-risk';
    return 'on-track';
  };

  const filteredProjects = projects.filter(project => 
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
                <p className="text-sm text-gray-500">Hospital expansion and renovation projects</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-2">
              {['all', 'planning', 'active', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 text-sm rounded-lg capitalize ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {filteredProjects.length} projects
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredProjects.map((project) => {
              const scheduleStatus = getScheduleStatus(project);
              return (
                <div
                  key={project.id}
                  onClick={() => fetchProjectDetails(project.id)}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{project.hospital_name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                      </span>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">
                        {project.completed_milestones || 0}/{project.total_milestones || 0} milestones
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${project.total_milestones > 0 
                            ? (project.completed_milestones / project.total_milestones * 100) 
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Budget</p>
                      <p className="font-medium">₦{((project.budget || 0) / 1000000).toFixed(1)}M</p>
                      <p className="text-xs text-gray-500">
                        {project.budget_utilization?.toFixed(0) || 0}% used
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Timeline</p>
                      <p className="font-medium">
                        {project.days_remaining > 0 
                          ? `${project.days_remaining} days left`
                          : project.days_remaining < 0
                          ? `${Math.abs(project.days_remaining)} days overdue`
                          : 'Completed'}
                      </p>
                      <p className={`text-xs font-medium ${
                        scheduleStatus === 'overdue' ? 'text-red-600' :
                        scheduleStatus === 'at-risk' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {scheduleStatus === 'overdue' ? 'Overdue' :
                         scheduleStatus === 'at-risk' ? 'At Risk' :
                         'On Track'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Team</p>
                      <p className="font-medium">{project.team_size || 0} members</p>
                      <p className="text-xs text-gray-500">
                        {project.completed_tasks || 0}/{project.total_tasks || 0} tasks
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProjects.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No projects found</p>
              </div>
            )}
          </div>

          {/* Project Details Sidebar */}
          <div className="space-y-6">
            {selectedProject ? (
              <>
                {/* Project Summary */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Project Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Project Manager</p>
                      <p className="font-medium">{selectedProject.project_manager_name || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">
                        {selectedProject.start_date 
                          ? new Date(selectedProject.start_date).toLocaleDateString()
                          : 'TBD'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">End Date</p>
                      <p className="font-medium">
                        {selectedProject.end_date 
                          ? new Date(selectedProject.end_date).toLocaleDateString()
                          : 'TBD'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Health Score</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              selectedProject.healthScore > 80 ? 'bg-green-600' :
                              selectedProject.healthScore > 60 ? 'bg-yellow-600' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${selectedProject.healthScore || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{selectedProject.healthScore || 0}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <label className="text-sm text-gray-500">Update Status</label>
                    <select
                      value={selectedProject.status}
                      onChange={(e) => updateProjectStatus(selectedProject.id, e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="planning">Planning</option>
                      <option value="approved">Approved</option>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Milestones */}
                {selectedProject.milestones && selectedProject.milestones.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Milestones</h3>
                    <div className="space-y-3">
                      {selectedProject.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-start space-x-3">
                          <div className={`mt-1 h-5 w-5 rounded-full border-2 ${
                            milestone.status === 'completed' 
                              ? 'bg-green-600 border-green-600' 
                              : 'border-gray-300'
                          }`}>
                            {milestone.status === 'completed' && (
                              <CheckCircle className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium text-sm ${
                              milestone.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                            }`}>
                              {milestone.title}
                            </p>
                            {milestone.due_date && (
                              <p className="text-xs text-gray-500 mt-1">
                                Due: {new Date(milestone.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risks */}
                {selectedProject.risks && selectedProject.risks.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Active Risks</h3>
                    <div className="space-y-2">
                      {selectedProject.risks
                        .filter(risk => risk.status === 'active')
                        .map((risk) => (
                          <div key={risk.id} className="flex items-start space-x-2">
                            <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                              risk.severity === 'high' ? 'text-red-600' :
                              risk.severity === 'medium' ? 'text-yellow-600' :
                              'text-gray-600'
                            }`} />
                            <p className="text-sm text-gray-700">{risk.description}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <p className="text-gray-500 text-center">Select a project to view details</p>
              </div>
            )}

            {/* Project Statistics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Overall Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Projects</span>
                  <span className="font-semibold">
                    {projects.filter(p => p.status === 'active').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Budget</span>
                  <span className="font-semibold">
                    ₦{(projects.reduce((sum, p) => sum + (p.budget || 0), 0) / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Completion</span>
                  <span className="font-semibold">
                    {projects.length > 0 
                      ? Math.round(
                          projects.reduce((sum, p) => {
                            const progress = p.total_milestones > 0 
                              ? (p.completed_milestones / p.total_milestones * 100)
                              : 0;
                            return sum + progress;
                          }, 0) / projects.length
                        )
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">At Risk</span>
                  <span className="font-semibold text-yellow-600">
                    {projects.filter(p => getScheduleStatus(p) === 'at-risk').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Overdue</span>
                  <span className="font-semibold text-red-600">
                    {projects.filter(p => getScheduleStatus(p) === 'overdue').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectManagement;
