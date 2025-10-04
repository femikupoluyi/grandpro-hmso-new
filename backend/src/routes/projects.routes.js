const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Simple auth middleware for now
const authenticateToken = (req, res, next) => {
  req.user = { id: 1, role: 'admin' };
  next();
};

/**
 * Project Management API
 * Manages hospital expansion, renovation, and development projects
 */

// Get all projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, hospital_id, type } = req.query;

    let query = `
      SELECT 
        p.*,
        h.name as hospital_name,
        u.first_name || ' ' || u.last_name as project_manager_name,
        (SELECT COUNT(*) FROM project_tasks WHERE project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM project_tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks,
        (SELECT json_agg(row_to_json(t)) 
         FROM (
           SELECT id, name, status, priority, due_date 
           FROM project_tasks 
           WHERE project_id = p.id 
           ORDER BY priority DESC, due_date ASC 
           LIMIT 5
         ) t
        ) as recent_tasks
      FROM projects p
      LEFT JOIN hospitals h ON p.hospital_id = h.id
      LEFT JOIN users u ON p.project_manager_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
    }

    if (hospital_id) {
      paramCount++;
      query += ` AND p.hospital_id = $${paramCount}`;
      params.push(hospital_id);
    }

    if (type) {
      paramCount++;
      query += ` AND p.type = $${paramCount}`;
      params.push(type);
    }

    query += ` ORDER BY p.priority DESC, p.start_date ASC`;

    const result = await pool.query(query, params);

    // Calculate project progress for each project
    const projects = result.rows.map(project => ({
      ...project,
      progress: project.total_tasks > 0 
        ? Math.round((project.completed_tasks / project.total_tasks) * 100)
        : 0,
      is_overdue: project.end_date && new Date(project.end_date) < new Date() && project.status !== 'completed',
      days_remaining: project.end_date 
        ? Math.ceil((new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24))
        : null
    }));

    res.json({
      status: 'success',
      total_projects: projects.length,
      projects: projects
    });

  } catch (error) {
    console.error('Get Projects Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
});

// Create new project
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      hospital_id,
      budget,
      start_date,
      end_date,
      project_manager_id,
      priority,
      objectives,
      deliverables
    } = req.body;

    const query = `
      INSERT INTO projects (
        name, description, type, hospital_id, budget,
        start_date, end_date, project_manager_id, priority,
        objectives, deliverables, status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'planning', $12
      ) RETURNING *
    `;

    const result = await pool.query(query, [
      name,
      description,
      type || 'expansion',
      hospital_id,
      budget,
      start_date,
      end_date,
      project_manager_id || req.user.id,
      priority || 'medium',
      objectives || [],
      deliverables || [],
      req.user.id
    ]);

    const project = result.rows[0];

    // Create default milestones based on project type
    const milestones = getDefaultMilestones(type, project.id, start_date, end_date);
    
    if (milestones.length > 0) {
      const milestoneQuery = `
        INSERT INTO project_milestones (project_id, name, description, target_date, status)
        VALUES ${milestones.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(', ')}
      `;

      const milestoneParams = [];
      milestones.forEach(milestone => {
        milestoneParams.push(
          project.id,
          milestone.name,
          milestone.description,
          milestone.target_date,
          'pending'
        );
      });

      await pool.query(milestoneQuery, milestoneParams);
    }

    res.status(201).json({
      status: 'success',
      message: 'Project created successfully',
      project: project
    });

  } catch (error) {
    console.error('Create Project Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create project',
      error: error.message
    });
  }
});

// Get project details
router.get('/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    const projectQuery = `
      SELECT 
        p.*,
        h.name as hospital_name,
        h.state as hospital_state,
        h.city as hospital_city,
        u.first_name || ' ' || u.last_name as project_manager_name,
        u.email as project_manager_email
      FROM projects p
      LEFT JOIN hospitals h ON p.hospital_id = h.id
      LEFT JOIN users u ON p.project_manager_id = u.id
      WHERE p.id = $1
    `;

    const projectResult = await pool.query(projectQuery, [projectId]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    const project = projectResult.rows[0];

    // Get tasks
    const tasksQuery = `
      SELECT 
        t.*,
        u.first_name || ' ' || u.last_name as assigned_to_name
      FROM project_tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = $1
      ORDER BY t.priority DESC, t.due_date ASC
    `;

    const tasks = await pool.query(tasksQuery, [projectId]);

    // Get milestones
    const milestonesQuery = `
      SELECT * FROM project_milestones
      WHERE project_id = $1
      ORDER BY target_date ASC
    `;

    const milestones = await pool.query(milestonesQuery, [projectId]);

    // Get team members
    const teamQuery = `
      SELECT 
        pt.*,
        u.first_name || ' ' || u.last_name as member_name,
        u.email as member_email
      FROM project_team pt
      JOIN users u ON pt.user_id = u.id
      WHERE pt.project_id = $1
    `;

    const team = await pool.query(teamQuery, [projectId]);

    // Get budget tracking
    const budgetQuery = `
      SELECT 
        SUM(amount) as total_spent,
        COUNT(*) as total_expenses,
        MAX(expense_date) as last_expense_date
      FROM project_expenses
      WHERE project_id = $1
    `;

    const budgetTracking = await pool.query(budgetQuery, [projectId]);

    // Calculate project metrics
    const completedTasks = tasks.rows.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.rows.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const completedMilestones = milestones.rows.filter(m => m.status === 'completed').length;
    const totalMilestones = milestones.rows.length;
    const milestoneProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    res.json({
      status: 'success',
      project: {
        ...project,
        progress: progress,
        milestone_progress: milestoneProgress,
        budget_utilized: budgetTracking.rows[0]?.total_spent || 0,
        budget_remaining: project.budget - (budgetTracking.rows[0]?.total_spent || 0),
        days_elapsed: Math.ceil((new Date() - new Date(project.start_date)) / (1000 * 60 * 60 * 24)),
        days_remaining: project.end_date 
          ? Math.ceil((new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24))
          : null
      },
      tasks: tasks.rows,
      milestones: milestones.rows,
      team: team.rows,
      statistics: {
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        pending_tasks: tasks.rows.filter(t => t.status === 'pending').length,
        overdue_tasks: tasks.rows.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed').length,
        total_milestones: totalMilestones,
        completed_milestones: completedMilestones
      }
    });

  } catch (error) {
    console.error('Get Project Details Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch project details',
      error: error.message
    });
  }
});

// Update project
router.put('/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const updates = req.body;

    const allowedFields = [
      'name', 'description', 'status', 'budget', 
      'end_date', 'priority', 'objectives', 'deliverables'
    ];

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields to update'
      });
    }

    values.push(projectId);

    const query = `
      UPDATE projects
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Project not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Project updated successfully',
      project: result.rows[0]
    });

  } catch (error) {
    console.error('Update Project Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update project',
      error: error.message
    });
  }
});

// Create project task
router.post('/:projectId/tasks', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      name,
      description,
      assigned_to,
      due_date,
      priority,
      dependencies
    } = req.body;

    const query = `
      INSERT INTO project_tasks (
        project_id, name, description, assigned_to,
        due_date, priority, dependencies, status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, 'pending', $8
      ) RETURNING *
    `;

    const result = await pool.query(query, [
      projectId,
      name,
      description,
      assigned_to,
      due_date,
      priority || 'medium',
      dependencies || [],
      req.user.id
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Task created successfully',
      task: result.rows[0]
    });

  } catch (error) {
    console.error('Create Task Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create task',
      error: error.message
    });
  }
});

// Update task status
router.put('/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, progress, notes } = req.body;

    const query = `
      UPDATE project_tasks
      SET 
        status = COALESCE($1, status),
        progress = COALESCE($2, progress),
        notes = COALESCE($3, notes),
        updated_at = NOW(),
        completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END
      WHERE id = $4
      RETURNING *
    `;

    const result = await pool.query(query, [status, progress, notes, taskId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Task updated successfully',
      task: result.rows[0]
    });

  } catch (error) {
    console.error('Update Task Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update task',
      error: error.message
    });
  }
});

// Get project timeline
router.get('/:projectId/timeline', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    const timelineQuery = `
      SELECT 
        'milestone' as type,
        name,
        description,
        target_date as date,
        status,
        NULL as assigned_to
      FROM project_milestones
      WHERE project_id = $1
      
      UNION ALL
      
      SELECT 
        'task' as type,
        name,
        description,
        due_date as date,
        status,
        assigned_to
      FROM project_tasks
      WHERE project_id = $1
      
      ORDER BY date ASC
    `;

    const result = await pool.query(timelineQuery, [projectId]);

    res.json({
      status: 'success',
      timeline: result.rows
    });

  } catch (error) {
    console.error('Get Timeline Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch project timeline',
      error: error.message
    });
  }
});

// Add team member
router.post('/:projectId/team', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { user_id, role, responsibilities } = req.body;

    const query = `
      INSERT INTO project_team (
        project_id, user_id, role, responsibilities, joined_date
      ) VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (project_id, user_id) 
      DO UPDATE SET role = EXCLUDED.role, responsibilities = EXCLUDED.responsibilities
      RETURNING *
    `;

    const result = await pool.query(query, [
      projectId,
      user_id,
      role,
      responsibilities || []
    ]);

    res.json({
      status: 'success',
      message: 'Team member added successfully',
      member: result.rows[0]
    });

  } catch (error) {
    console.error('Add Team Member Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add team member',
      error: error.message
    });
  }
});

// Record project expense
router.post('/:projectId/expenses', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      category,
      description,
      amount,
      expense_date,
      vendor,
      receipt_url
    } = req.body;

    const query = `
      INSERT INTO project_expenses (
        project_id, category, description, amount,
        expense_date, vendor, receipt_url, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      projectId,
      category,
      description,
      amount,
      expense_date || new Date(),
      vendor,
      receipt_url,
      req.user.id
    ]);

    res.status(201).json({
      status: 'success',
      message: 'Expense recorded successfully',
      expense: result.rows[0]
    });

  } catch (error) {
    console.error('Record Expense Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to record expense',
      error: error.message
    });
  }
});

// Get project dashboard
router.get('/dashboard/overview', authenticateToken, async (req, res) => {
  try {
    const overviewQuery = `
      WITH project_summary AS (
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status = 'planning' THEN 1 END) as planning_projects,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_projects,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
          COUNT(CASE WHEN status = 'on_hold' THEN 1 END) as on_hold_projects,
          SUM(budget) as total_budget,
          COUNT(CASE WHEN end_date < CURRENT_DATE AND status != 'completed' THEN 1 END) as overdue_projects
        FROM projects
      ),
      recent_activities AS (
        SELECT 
          'task_completed' as activity_type,
          'Task completed: ' || name as description,
          completed_at as timestamp,
          project_id
        FROM project_tasks
        WHERE completed_at IS NOT NULL
        AND completed_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
        
        UNION ALL
        
        SELECT 
          'milestone_reached' as activity_type,
          'Milestone reached: ' || name as description,
          completed_date as timestamp,
          project_id
        FROM project_milestones
        WHERE status = 'completed'
        AND completed_date >= CURRENT_TIMESTAMP - INTERVAL '7 days'
        
        ORDER BY timestamp DESC
        LIMIT 10
      )
      SELECT 
        (SELECT row_to_json(project_summary) FROM project_summary) as summary,
        (SELECT json_agg(row_to_json(recent_activities)) FROM recent_activities) as recent_activities
    `;

    const result = await pool.query(overviewQuery);
    const data = result.rows[0];

    // Get projects by type
    const typeQuery = `
      SELECT 
        type,
        COUNT(*) as count,
        AVG(
          CASE 
            WHEN total_tasks > 0 
            THEN (completed_tasks::numeric / total_tasks * 100)
            ELSE 0 
          END
        ) as avg_progress
      FROM (
        SELECT 
          p.type,
          (SELECT COUNT(*) FROM project_tasks WHERE project_id = p.id) as total_tasks,
          (SELECT COUNT(*) FROM project_tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks
        FROM projects p
      ) project_stats
      GROUP BY type
    `;

    const projectTypes = await pool.query(typeQuery);

    res.json({
      status: 'success',
      dashboard: {
        summary: data.summary,
        recent_activities: data.recent_activities || [],
        projects_by_type: projectTypes.rows,
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Project Dashboard Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch project dashboard',
      error: error.message
    });
  }
});

// Helper function to generate default milestones
function getDefaultMilestones(projectType, projectId, startDate, endDate) {
  const milestones = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const duration = (end - start) / (1000 * 60 * 60 * 24); // Duration in days

  switch(projectType) {
    case 'expansion':
      milestones.push(
        {
          name: 'Planning & Design Complete',
          description: 'Architectural plans and regulatory approvals',
          target_date: new Date(start.getTime() + duration * 0.2 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Foundation & Structure',
          description: 'Foundation laid and main structure erected',
          target_date: new Date(start.getTime() + duration * 0.4 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Interior & Systems',
          description: 'Interior work and system installations complete',
          target_date: new Date(start.getTime() + duration * 0.7 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Testing & Commissioning',
          description: 'All systems tested and operational',
          target_date: new Date(start.getTime() + duration * 0.9 * 24 * 60 * 60 * 1000)
        }
      );
      break;

    case 'renovation':
      milestones.push(
        {
          name: 'Assessment & Planning',
          description: 'Current state assessment and renovation plan',
          target_date: new Date(start.getTime() + duration * 0.15 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Demolition & Prep',
          description: 'Removal of old fixtures and preparation',
          target_date: new Date(start.getTime() + duration * 0.3 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Construction & Installation',
          description: 'New construction and equipment installation',
          target_date: new Date(start.getTime() + duration * 0.75 * 24 * 60 * 60 * 1000)
        }
      );
      break;

    case 'equipment':
      milestones.push(
        {
          name: 'Procurement Complete',
          description: 'Equipment ordered and delivery scheduled',
          target_date: new Date(start.getTime() + duration * 0.3 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Installation & Setup',
          description: 'Equipment installed and configured',
          target_date: new Date(start.getTime() + duration * 0.7 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Training & Go-Live',
          description: 'Staff trained and equipment operational',
          target_date: new Date(start.getTime() + duration * 0.95 * 24 * 60 * 60 * 1000)
        }
      );
      break;

    case 'it_upgrade':
      milestones.push(
        {
          name: 'Requirements Gathered',
          description: 'System requirements documented and approved',
          target_date: new Date(start.getTime() + duration * 0.2 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Development Complete',
          description: 'System developed/configured and tested',
          target_date: new Date(start.getTime() + duration * 0.6 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Deployment & Training',
          description: 'System deployed and users trained',
          target_date: new Date(start.getTime() + duration * 0.9 * 24 * 60 * 60 * 1000)
        }
      );
      break;

    default:
      // Generic milestones
      milestones.push(
        {
          name: 'Project Kickoff',
          description: 'Project initiated and team assembled',
          target_date: new Date(start.getTime() + duration * 0.05 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Mid-Project Review',
          description: 'Progress review and adjustments',
          target_date: new Date(start.getTime() + duration * 0.5 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Project Completion',
          description: 'All deliverables completed',
          target_date: new Date(start.getTime() + duration * 0.95 * 24 * 60 * 60 * 1000)
        }
      );
  }

  return milestones;
}

module.exports = router;
