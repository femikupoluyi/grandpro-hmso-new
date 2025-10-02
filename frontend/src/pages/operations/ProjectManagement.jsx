import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Filter,
  Target,
  TrendingUp,
  Building,
  MapPin,
  Flag,
  BarChart3,
  Edit,
  Trash2,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ProjectManagement = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewProject, setShowNewProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalBudget: 0,
    budgetUtilized: 0
  });

  const [newProject, setNewProject] = useState({
    hospital_id: '',
    project_name: '',
    project_type: 'expansion',
    description: '',
    budget: 0,
    start_date: '',
    end_date: '',
    priority: 'medium',
    project_manager: ''
  });

  useEffect(() => {
    fetchProjects();
  }, [filterStatus]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/operations/projects`, {
        params: { status: filterStatus !== 'all' ? filterStatus : undefined },
        headers: { Authorization: `Bearer ${token}` }
      });

      const projectData = response.data.projects || [];
      setProjects(projectData);

      // Calculate stats
      const stats = {
        totalProjects: projectData.length,
        activeProjects: projectData.filter(p => p.status === 'active').length,
        completedProjects: projectData.filter(p => p.status === 'completed').length,
        totalBudget: projectData.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0),
        budgetUtilized: projectData.reduce((sum, p) => sum + (parseFloat(p.budget_spent) || 0), 0)
      };
      setStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/operations/projects`,
        newProject,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowNewProject(false);
      setNewProject({
        hospital_id: '',
        project_name: '',
        project_type: 'expansion',
        description: '',
        budget: 0,
        start_date: '',
        end_date: '',
        priority: 'medium',
        project_manager: ''
      });
      fetchProjects();
      alert('Project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'critical': return <Flag className="h-4 w-4 text-red-600" />;
      case 'high': return <Flag className="h-4 w-4 text-orange-600" />;
      case 'medium': return <Flag className="h-4 w-4 text-yellow-600" />;
      case 'low': return <Flag className="h-4 w-4 text-gray-600" />;
      default: return <Flag className="h-4 w-4 text-gray-400" />;
    }
  };

  const getProjectTypeIcon = (type) => {
    switch(type) {
      case 'expansion': return <Building className="h-5 w-5 text-blue-500" />;
      case 'renovation': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'equipment': return <Target className="h-5 w-5 text-purple-500" />;
      case 'it_upgrade': return <BarChart3 className="h-5 w-5 text-indigo-500" />;
      default: return <Briefcase className="h-5 w-5 text-gray-500" />;
    }
  };

  const calculateDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hospital Expansion Projects</h1>
        <p className="text-gray-600 mt-2">Manage development and expansion initiatives across facilities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProjects}</p>
            </div>
            <Briefcase className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Active</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.activeProjects}</p>
            </div>
            <Clock className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completedProjects}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Budget</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.totalBudget)}
              </p>
            </div>
            <DollarSign className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Budget Used</p>
              <p className="text-xl font-bold text-orange-600 mt-1">
                {((stats.budgetUtilized / stats.totalBudget) * 100).toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            New Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-2 bg-white rounded-lg shadow-md p-12 text-center">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No projects found</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Create your first project
            </button>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {getProjectTypeIcon(project.project_type)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.project_name}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {project.hospital_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(project.priority)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                </div>

                {/* Project Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{project.progress?.toFixed(0) || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Project Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600">Budget</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(project.budget)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(project.budget_spent || 0)} spent
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Timeline</p>
                    <p className="font-semibold text-gray-900">
                      {calculateDaysRemaining(project.end_date)} days
                    </p>
                    <p className="text-xs text-gray-500">
                      Due {new Date(project.end_date).toLocaleDateString('en-NG')}
                    </p>
                  </div>
                </div>

                {/* Tasks Summary */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600">
                        {project.completed_tasks || 0}/{project.total_tasks || 0} tasks
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span className="text-gray-600">
                        {project.team_size || 0} members
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View Details
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Project Manager */}
                {project.project_manager && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-600">
                      Project Manager: <span className="font-medium">{project.project_manager}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProject.project_name}
                    onChange={(e) => setNewProject({...newProject, project_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Lagos Hospital Wing B Expansion"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital
                  </label>
                  <select
                    value={newProject.hospital_id}
                    onChange={(e) => setNewProject({...newProject, hospital_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Hospital</option>
                    <option value="h1">Lagos General Hospital</option>
                    <option value="h2">Abuja Medical Centre</option>
                    <option value="h3">Port Harcourt Specialist Hospital</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type
                  </label>
                  <select
                    value={newProject.project_type}
                    onChange={(e) => setNewProject({...newProject, project_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="expansion">Expansion</option>
                    <option value="renovation">Renovation</option>
                    <option value="equipment">Equipment Upgrade</option>
                    <option value="it_upgrade">IT Upgrade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={newProject.priority}
                    onChange={(e) => setNewProject({...newProject, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (₦)
                  </label>
                  <input
                    type="number"
                    value={newProject.budget}
                    onChange={(e) => setNewProject({...newProject, budget: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Manager
                  </label>
                  <input
                    type="text"
                    value={newProject.project_manager}
                    onChange={(e) => setNewProject({...newProject, project_manager: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Dr. Adebayo Okonkwo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject({...newProject, start_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newProject.end_date}
                    onChange={(e) => setNewProject({...newProject, end_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the project objectives and scope..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowNewProject(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
