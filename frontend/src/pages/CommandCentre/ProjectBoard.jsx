import React, { useState, useEffect } from 'react';
import {
  Calendar, Users, DollarSign, Clock, CheckCircle,
  AlertCircle, Plus, Edit2, Trash2, ChevronRight,
  Building2, Wrench, Monitor, Package, TrendingUp,
  Target, BarChart3, FileText, Download, Filter
} from 'lucide-react';

const ProjectBoard = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'

  // Mock projects data
  const mockProjects = [
    {
      id: 'proj-001',
      name: 'Emergency Ward Expansion',
      description: 'Expand emergency department capacity by 50% to handle increased patient load',
      type: 'expansion',
      hospital: 'Lagos University Teaching Hospital',
      budget: 75000000,
      spent: 20250000,
      startDate: '2025-10-01',
      endDate: '2026-03-31',
      status: 'in_progress',
      priority: 'high',
      progress: 27,
      manager: 'Dr. Adebayo Ogunlana',
      team: ['Arch. Bola Tinubu', 'Eng. Funke Adeyemi', 'Mr. John Doe'],
      tasks: {
        total: 45,
        completed: 12,
        inProgress: 8,
        pending: 25
      },
      milestones: [
        { name: 'Planning & Design', status: 'completed', date: '2025-10-15' },
        { name: 'Foundation Work', status: 'in_progress', date: '2025-11-30' },
        { name: 'Structure Construction', status: 'pending', date: '2026-01-31' },
        { name: 'Interior & Finishing', status: 'pending', date: '2026-03-15' }
      ]
    },
    {
      id: 'proj-002',
      name: 'Digital X-Ray System Upgrade',
      description: 'Replace analog X-ray systems with digital radiography equipment',
      type: 'equipment',
      hospital: 'St. Nicholas Hospital',
      budget: 25000000,
      spent: 16000000,
      startDate: '2025-09-15',
      endDate: '2025-12-15',
      status: 'in_progress',
      priority: 'medium',
      progress: 64,
      manager: 'Eng. Funke Adeyemi',
      team: ['Tech. Ibrahim Musa', 'Dr. Sarah Johnson'],
      tasks: {
        total: 28,
        completed: 18,
        inProgress: 5,
        pending: 5
      },
      milestones: [
        { name: 'Equipment Procurement', status: 'completed', date: '2025-09-30' },
        { name: 'Site Preparation', status: 'completed', date: '2025-10-15' },
        { name: 'Installation', status: 'in_progress', date: '2025-11-15' },
        { name: 'Training & Go-Live', status: 'pending', date: '2025-12-10' }
      ]
    },
    {
      id: 'proj-003',
      name: 'Patient Records Digitization',
      description: 'Convert paper records to electronic medical records system',
      type: 'it_upgrade',
      hospital: 'National Hospital Abuja',
      budget: 15000000,
      spent: 10950000,
      startDate: '2025-08-01',
      endDate: '2025-11-30',
      status: 'in_progress',
      priority: 'high',
      progress: 73,
      manager: 'Mr. Ibrahim Musa',
      team: ['IT Team Lead', 'Data Analysts', 'Training Coordinator'],
      tasks: {
        total: 52,
        completed: 38,
        inProgress: 10,
        pending: 4
      },
      milestones: [
        { name: 'System Setup', status: 'completed', date: '2025-08-31' },
        { name: 'Data Migration Phase 1', status: 'completed', date: '2025-09-30' },
        { name: 'Data Migration Phase 2', status: 'in_progress', date: '2025-10-31' },
        { name: 'User Training', status: 'pending', date: '2025-11-20' }
      ]
    },
    {
      id: 'proj-004',
      name: 'Pediatric Wing Renovation',
      description: 'Complete renovation of pediatric department including play areas',
      type: 'renovation',
      hospital: 'Federal Medical Centre Owerri',
      budget: 35000000,
      spent: 5250000,
      startDate: '2025-11-01',
      endDate: '2026-02-28',
      status: 'planning',
      priority: 'medium',
      progress: 15,
      manager: 'Arch. Chioma Okafor',
      team: ['Construction Team', 'Interior Designer'],
      tasks: {
        total: 38,
        completed: 6,
        inProgress: 3,
        pending: 29
      },
      milestones: [
        { name: 'Design Approval', status: 'in_progress', date: '2025-11-15' },
        { name: 'Demolition', status: 'pending', date: '2025-12-01' },
        { name: 'Construction', status: 'pending', date: '2026-01-15' },
        { name: 'Completion', status: 'pending', date: '2026-02-28' }
      ]
    },
    {
      id: 'proj-005',
      name: 'Generator Maintenance',
      description: 'Annual maintenance of backup power systems',
      type: 'maintenance',
      hospital: 'University College Hospital Ibadan',
      budget: 5000000,
      spent: 4500000,
      startDate: '2025-09-20',
      endDate: '2025-10-05',
      status: 'completed',
      priority: 'low',
      progress: 100,
      manager: 'Eng. Tunde Bakare',
      team: ['Maintenance Team'],
      tasks: {
        total: 12,
        completed: 12,
        inProgress: 0,
        pending: 0
      },
      milestones: [
        { name: 'Initial Assessment', status: 'completed', date: '2025-09-22' },
        { name: 'Parts Replacement', status: 'completed', date: '2025-09-28' },
        { name: 'Testing', status: 'completed', date: '2025-10-03' },
        { name: 'Sign-off', status: 'completed', date: '2025-10-05' }
      ]
    }
  ];

  useEffect(() => {
    setProjects(mockProjects);
  }, []);

  const getTypeIcon = (type) => {
    switch(type) {
      case 'expansion': return <Building2 className="h-5 w-5" />;
      case 'renovation': return <Wrench className="h-5 w-5" />;
      case 'equipment': return <Package className="h-5 w-5" />;
      case 'it_upgrade': return <Monitor className="h-5 w-5" />;
      case 'maintenance': return <Wrench className="h-5 w-5" />;
      default: return <Building2 className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredProjects = projects.filter(project => {
    if (filterStatus !== 'all' && project.status !== filterStatus) return false;
    if (filterType !== 'all' && project.type !== filterType) return false;
    return true;
  });

  const projectsByStatus = {
    planning: filteredProjects.filter(p => p.status === 'planning'),
    in_progress: filteredProjects.filter(p => p.status === 'in_progress'),
    on_hold: filteredProjects.filter(p => p.status === 'on_hold'),
    completed: filteredProjects.filter(p => p.status === 'completed')
  };

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
    totalSpent: projects.reduce((sum, p) => sum + p.spent, 0)
  };

  const ProjectCard = ({ project }) => (
    <div 
      className="bg-white rounded-lg shadow-sm p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setSelectedProject(project)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getTypeIcon(project.type)}
          <span className={`text-xs font-semibold ${getPriorityColor(project.priority)}`}>
            {project.priority.toUpperCase()}
          </span>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
          {project.status.replace('_', ' ')}
        </span>
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
      <p className="text-sm text-gray-600 mb-2">{project.hospital}</p>
      
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Budget Info */}
      <div className="flex justify-between text-xs text-gray-600 mb-2">
        <span>Budget</span>
        <span>₦{(project.budget / 1000000).toFixed(1)}M</span>
      </div>

      {/* Timeline */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span>{new Date(project.endDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Users className="h-3 w-3" />
          <span>{project.team.length}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Management Board</h1>
            <p className="text-gray-600 mt-1">Track hospital expansion and renovation projects</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowNewProjectModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">₦{(stats.totalBudget / 1000000).toFixed(0)}M</p>
            </div>
            <DollarSign className="h-8 w-8 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Budget Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                {((stats.totalSpent / stats.totalBudget) * 100).toFixed(0)}%
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-500" />
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="expansion">Expansion</option>
              <option value="renovation">Renovation</option>
              <option value="equipment">Equipment</option>
              <option value="it_upgrade">IT Upgrade</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-2 rounded-lg ${viewMode === 'kanban' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Project Board */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Planning Column */}
          <div>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">Planning</h3>
                <span className="bg-gray-600 text-white text-xs rounded-full px-2 py-1">
                  {projectsByStatus.planning.length}
                </span>
              </div>
              <div className="space-y-3">
                {projectsByStatus.planning.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          </div>

          {/* In Progress Column */}
          <div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-blue-700">In Progress</h3>
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                  {projectsByStatus.in_progress.length}
                </span>
              </div>
              <div className="space-y-3">
                {projectsByStatus.in_progress.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          </div>

          {/* On Hold Column */}
          <div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-yellow-700">On Hold</h3>
                <span className="bg-yellow-600 text-white text-xs rounded-full px-2 py-1">
                  {projectsByStatus.on_hold.length}
                </span>
              </div>
              <div className="space-y-3">
                {projectsByStatus.on_hold.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          </div>

          {/* Completed Column */}
          <div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-green-700">Completed</h3>
                <span className="bg-green-600 text-white text-xs rounded-full px-2 py-1">
                  {projectsByStatus.completed.length}
                </span>
              </div>
              <div className="space-y-3">
                {projectsByStatus.completed.map(project => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hospital
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr 
                    key={project.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedProject(project)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500">{project.manager}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.hospital}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(project.type)}
                        <span className="text-sm text-gray-900 capitalize">
                          {project.type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-24">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="text-gray-900">₦{(project.budget / 1000000).toFixed(1)}M</p>
                        <p className="text-xs text-gray-500">
                          Spent: {((project.spent / project.budget) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="text-gray-900">{new Date(project.endDate).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">
                          {Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24))} days left
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(selectedProject.type)}
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Project Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Hospital:</span>
                        <span className="text-sm font-medium">{selectedProject.hospital}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Manager:</span>
                        <span className="text-sm font-medium">{selectedProject.manager}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Priority:</span>
                        <span className={`text-sm font-medium ${getPriorityColor(selectedProject.priority)}`}>
                          {selectedProject.priority.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedProject.status)}`}>
                          {selectedProject.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Budget */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Budget</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Budget:</span>
                        <span className="text-sm font-medium">₦{selectedProject.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Spent:</span>
                        <span className="text-sm font-medium">₦{selectedProject.spent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Remaining:</span>
                        <span className="text-sm font-medium">
                          ₦{(selectedProject.budget - selectedProject.spent).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(selectedProject.spent / selectedProject.budget) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Team */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Team Members</h3>
                    <div className="space-y-2">
                      {selectedProject.team.map((member, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-sm text-gray-700">{member}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Timeline */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Start Date:</span>
                        <span className="text-sm font-medium">
                          {new Date(selectedProject.startDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">End Date:</span>
                        <span className="text-sm font-medium">
                          {new Date(selectedProject.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Days Remaining:</span>
                        <span className="text-sm font-medium">
                          {Math.ceil((new Date(selectedProject.endDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Milestones</h3>
                    <div className="space-y-3">
                      {selectedProject.milestones.map((milestone, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {milestone.status === 'completed' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : milestone.status === 'in_progress' ? (
                              <Clock className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Target className="h-5 w-5 text-gray-400" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{milestone.name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(milestone.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                            milestone.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {milestone.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tasks Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Tasks Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-gray-900">{selectedProject.tasks.total}</p>
                        <p className="text-sm text-gray-600">Total Tasks</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-green-600">{selectedProject.tasks.completed}</p>
                        <p className="text-sm text-gray-600">Completed</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-blue-600">{selectedProject.tasks.inProgress}</p>
                        <p className="text-sm text-gray-600">In Progress</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-3">
                        <p className="text-2xl font-bold text-yellow-600">{selectedProject.tasks.pending}</p>
                        <p className="text-sm text-gray-600">Pending</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Edit Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectBoard;
