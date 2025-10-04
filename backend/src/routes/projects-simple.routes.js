const express = require('express');
const router = express.Router();

/**
 * Simplified Project Management API
 */

// Get all projects
router.get('/', (req, res) => {
  const { status, hospital_id, type } = req.query;

  let projects = [
    {
      id: 'proj-001',
      name: 'Emergency Ward Expansion',
      description: 'Expand emergency department capacity by 50% to handle increased patient load',
      type: 'expansion',
      hospital_id: 'hosp-lagos-001',
      hospital_name: 'Lagos University Teaching Hospital',
      budget: 75000000,
      start_date: '2025-10-01',
      end_date: '2026-03-31',
      status: 'in_progress',
      priority: 'high',
      project_manager_name: 'Dr. Adebayo Ogunlana',
      total_tasks: 45,
      completed_tasks: 12,
      recent_tasks: [
        { id: 'task-001', name: 'Complete architectural drawings', status: 'completed', priority: 'high', due_date: '2025-10-15' },
        { id: 'task-002', name: 'Obtain building permits', status: 'in_progress', priority: 'high', due_date: '2025-10-20' },
        { id: 'task-003', name: 'Contractor selection', status: 'pending', priority: 'medium', due_date: '2025-10-25' }
      ],
      progress: 27,
      is_overdue: false,
      days_remaining: 178
    },
    {
      id: 'proj-002',
      name: 'Digital X-Ray System Upgrade',
      description: 'Replace analog X-ray systems with digital radiography equipment',
      type: 'equipment',
      hospital_id: 'hosp-lagos-002',
      hospital_name: 'St. Nicholas Hospital',
      budget: 25000000,
      start_date: '2025-09-15',
      end_date: '2025-12-15',
      status: 'in_progress',
      priority: 'medium',
      project_manager_name: 'Eng. Funke Adeyemi',
      total_tasks: 28,
      completed_tasks: 18,
      recent_tasks: [
        { id: 'task-004', name: 'Equipment procurement', status: 'completed', priority: 'high', due_date: '2025-09-30' },
        { id: 'task-005', name: 'Site preparation', status: 'completed', priority: 'medium', due_date: '2025-10-05' },
        { id: 'task-006', name: 'Equipment installation', status: 'in_progress', priority: 'high', due_date: '2025-10-10' }
      ],
      progress: 64,
      is_overdue: false,
      days_remaining: 72
    },
    {
      id: 'proj-003',
      name: 'Patient Records Digitization',
      description: 'Convert paper records to electronic medical records system',
      type: 'it_upgrade',
      hospital_id: 'hosp-abuja-001',
      hospital_name: 'National Hospital Abuja',
      budget: 15000000,
      start_date: '2025-08-01',
      end_date: '2025-11-30',
      status: 'in_progress',
      priority: 'high',
      project_manager_name: 'Mr. Ibrahim Musa',
      total_tasks: 52,
      completed_tasks: 38,
      recent_tasks: [
        { id: 'task-007', name: 'Database setup', status: 'completed', priority: 'high', due_date: '2025-09-15' },
        { id: 'task-008', name: 'Data migration - Phase 1', status: 'completed', priority: 'high', due_date: '2025-09-30' },
        { id: 'task-009', name: 'Staff training', status: 'in_progress', priority: 'medium', due_date: '2025-10-15' }
      ],
      progress: 73,
      is_overdue: false,
      days_remaining: 57
    }
  ];

  // Filter based on query parameters
  if (status) {
    projects = projects.filter(p => p.status === status);
  }
  if (hospital_id) {
    projects = projects.filter(p => p.hospital_id === hospital_id);
  }
  if (type) {
    projects = projects.filter(p => p.type === type);
  }

  res.json({
    status: 'success',
    total_projects: projects.length,
    projects: projects
  });
});

// Get project details
router.get('/:projectId', (req, res) => {
  const { projectId } = req.params;

  const project = {
    id: projectId,
    name: 'Emergency Ward Expansion',
    description: 'Expand emergency department capacity by 50% to handle increased patient load',
    type: 'expansion',
    hospital_id: 'hosp-lagos-001',
    hospital_name: 'Lagos University Teaching Hospital',
    hospital_state: 'Lagos',
    hospital_city: 'Ikeja',
    budget: 75000000,
    start_date: '2025-10-01',
    end_date: '2026-03-31',
    status: 'in_progress',
    priority: 'high',
    project_manager_name: 'Dr. Adebayo Ogunlana',
    project_manager_email: 'adebayo.ogunlana@luth.ng',
    objectives: [
      'Increase emergency capacity by 50%',
      'Reduce patient wait times',
      'Improve emergency response capabilities'
    ],
    deliverables: [
      '20 new emergency beds',
      '2 new trauma rooms',
      'Updated triage area',
      'New medical equipment'
    ],
    progress: 27,
    milestone_progress: 25,
    budget_utilized: 20250000,
    budget_remaining: 54750000,
    days_elapsed: 3,
    days_remaining: 178
  };

  const tasks = [
    { id: 'task-001', name: 'Complete architectural drawings', status: 'completed', priority: 'high', due_date: '2025-10-15', assigned_to_name: 'Arch. Bola Tinubu' },
    { id: 'task-002', name: 'Obtain building permits', status: 'in_progress', priority: 'high', due_date: '2025-10-20', assigned_to_name: 'Mr. John Doe' },
    { id: 'task-003', name: 'Contractor selection', status: 'pending', priority: 'medium', due_date: '2025-10-25', assigned_to_name: 'Eng. Jane Smith' },
    { id: 'task-004', name: 'Site preparation', status: 'pending', priority: 'medium', due_date: '2025-11-01', assigned_to_name: null },
    { id: 'task-005', name: 'Foundation work', status: 'pending', priority: 'high', due_date: '2025-11-15', assigned_to_name: null }
  ];

  const milestones = [
    { name: 'Planning & Design Complete', target_date: '2025-11-15', status: 'in_progress', description: 'Architectural plans and regulatory approvals' },
    { name: 'Foundation & Structure', target_date: '2026-01-15', status: 'pending', description: 'Foundation laid and main structure erected' },
    { name: 'Interior & Systems', target_date: '2026-02-28', status: 'pending', description: 'Interior work and system installations complete' },
    { name: 'Testing & Commissioning', target_date: '2026-03-25', status: 'pending', description: 'All systems tested and operational' }
  ];

  const team = [
    { user_id: 1, member_name: 'Dr. Adebayo Ogunlana', member_email: 'adebayo@luth.ng', role: 'Project Manager' },
    { user_id: 2, member_name: 'Arch. Bola Tinubu', member_email: 'bola@design.ng', role: 'Lead Architect' },
    { user_id: 3, member_name: 'Eng. Funke Adeyemi', member_email: 'funke@eng.ng', role: 'Construction Manager' }
  ];

  res.json({
    status: 'success',
    project: project,
    tasks: tasks,
    milestones: milestones,
    team: team,
    statistics: {
      total_tasks: tasks.length,
      completed_tasks: tasks.filter(t => t.status === 'completed').length,
      pending_tasks: tasks.filter(t => t.status === 'pending').length,
      overdue_tasks: 0,
      total_milestones: milestones.length,
      completed_milestones: milestones.filter(m => m.status === 'completed').length
    }
  });
});

// Create new project
router.post('/', (req, res) => {
  const { name, description, type, hospital_id, budget, start_date, end_date, priority } = req.body;

  res.status(201).json({
    status: 'success',
    message: 'Project created successfully',
    project: {
      id: 'proj-' + Date.now(),
      name,
      description,
      type: type || 'expansion',
      hospital_id,
      budget,
      start_date,
      end_date,
      status: 'planning',
      priority: priority || 'medium',
      created_at: new Date().toISOString()
    }
  });
});

// Get project dashboard
router.get('/dashboard/overview', (req, res) => {
  res.json({
    status: 'success',
    dashboard: {
      summary: {
        total_projects: 15,
        planning_projects: 3,
        active_projects: 8,
        completed_projects: 3,
        on_hold_projects: 1,
        total_budget: 450000000,
        overdue_projects: 2
      },
      recent_activities: [
        {
          activity_type: 'task_completed',
          description: 'Task completed: Equipment procurement',
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
          project_id: 'proj-002'
        },
        {
          activity_type: 'milestone_reached',
          description: 'Milestone reached: Planning Phase Complete',
          timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
          project_id: 'proj-001'
        },
        {
          activity_type: 'task_completed',
          description: 'Task completed: Database migration',
          timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
          project_id: 'proj-003'
        }
      ],
      projects_by_type: [
        { type: 'expansion', count: 5, avg_progress: 35 },
        { type: 'equipment', count: 4, avg_progress: 58 },
        { type: 'it_upgrade', count: 3, avg_progress: 72 },
        { type: 'renovation', count: 2, avg_progress: 45 },
        { type: 'maintenance', count: 1, avg_progress: 90 }
      ],
      last_updated: new Date().toISOString()
    }
  });
});

module.exports = router;
