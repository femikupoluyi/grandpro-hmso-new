/**
 * Project Management Service for Hospital Expansion and Development
 */

const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class ProjectManagementService {
  /**
   * Create a new project
   */
  async createProject(projectData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const {
        hospitalId,
        name,
        description,
        type,
        priority,
        budget,
        startDate,
        endDate,
        managerId,
        team,
        objectives
      } = projectData;
      
      // Create main project
      const projectId = uuidv4();
      const projectQuery = `
        INSERT INTO hospital_projects (
          id, hospital_id, name, description, type, 
          priority, status, budget, allocated_budget,
          start_date, end_date, project_manager_id,
          created_at, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'planning', $7, 0,
          $8, $9, $10, NOW(), $11
        ) RETURNING *
      `;
      
      const projectValues = [
        projectId,
        hospitalId,
        name,
        description,
        type || 'expansion',
        priority || 'medium',
        budget || 0,
        startDate || new Date(),
        endDate,
        managerId,
        managerId
      ];
      
      const projectResult = await client.query(projectQuery, projectValues);
      
      // Add team members
      if (team && team.length > 0) {
        for (const member of team) {
          await client.query(`
            INSERT INTO project_team_members (
              id, project_id, staff_id, role, allocation_percentage
            ) VALUES ($1, $2, $3, $4, $5)
          `, [uuidv4(), projectId, member.staffId, member.role, member.allocation || 100]);
        }
      }
      
      // Add objectives/milestones
      if (objectives && objectives.length > 0) {
        for (const objective of objectives) {
          await client.query(`
            INSERT INTO project_milestones (
              id, project_id, title, description, 
              due_date, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
          `, [
            uuidv4(),
            projectId,
            objective.title,
            objective.description,
            objective.dueDate
          ]);
        }
      }
      
      // Create initial timeline entry
      await client.query(`
        INSERT INTO project_timeline (
          id, project_id, event_type, title, 
          description, created_by, created_at
        ) VALUES ($1, $2, 'project_created', $3, $4, $5, NOW())
      `, [
        uuidv4(),
        projectId,
        'Project Initiated',
        `Project "${name}" has been created`,
        managerId
      ]);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        data: projectResult.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating project:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  /**
   * Get all projects with filters
   */
  async getProjects(filters = {}) {
    try {
      const { hospitalId, status, type, priority, managerId } = filters;
      
      let query = `
        SELECT 
          p.*,
          h.name as hospital_name,
          s.first_name || ' ' || s.last_name as project_manager_name,
          COUNT(DISTINCT tm.id) as team_size,
          COUNT(DISTINCT m.id) as total_milestones,
          COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as completed_milestones,
          COUNT(DISTINCT t.id) as total_tasks,
          COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
          (p.spent_budget::float / NULLIF(p.budget, 0) * 100) as budget_utilization,
          CASE 
            WHEN p.end_date < CURRENT_DATE AND p.status != 'completed' THEN 'overdue'
            WHEN p.end_date < CURRENT_DATE + INTERVAL '7 days' THEN 'at_risk'
            ELSE 'on_track'
          END as schedule_status
        FROM hospital_projects p
        LEFT JOIN hospitals h ON p.hospital_id = h.id
        LEFT JOIN staff s ON p.project_manager_id = s.id
        LEFT JOIN project_team_members tm ON p.id = tm.project_id
        LEFT JOIN project_milestones m ON p.id = m.project_id
        LEFT JOIN project_tasks t ON p.id = t.project_id
        WHERE 1=1
      `;
      
      const params = [];
      let paramCount = 0;
      
      if (hospitalId) {
        params.push(hospitalId);
        query += ` AND p.hospital_id = $${++paramCount}`;
      }
      
      if (status) {
        params.push(status);
        query += ` AND p.status = $${++paramCount}`;
      }
      
      if (type) {
        params.push(type);
        query += ` AND p.type = $${++paramCount}`;
      }
      
      if (priority) {
        params.push(priority);
        query += ` AND p.priority = $${++paramCount}`;
      }
      
      if (managerId) {
        params.push(managerId);
        query += ` AND p.project_manager_id = $${++paramCount}`;
      }
      
      query += `
        GROUP BY p.id, h.name, s.first_name, s.last_name
        ORDER BY 
          CASE p.priority 
            WHEN 'critical' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            ELSE 4 
          END,
          p.created_at DESC
      `;
      
      const result = await pool.query(query, params);
      
      return {
        success: true,
        data: result.rows,
        total: result.rowCount
      };
    } catch (error) {
      console.error('Error getting projects:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get detailed project information
   */
  async getProjectDetails(projectId) {
    try {
      // Get project basic info
      const projectQuery = `
        SELECT 
          p.*,
          h.name as hospital_name,
          s.first_name || ' ' || s.last_name as project_manager_name,
          (p.spent_budget::float / NULLIF(p.budget, 0) * 100) as budget_utilization,
          EXTRACT(day FROM (CURRENT_DATE - p.start_date)) as days_elapsed,
          EXTRACT(day FROM (p.end_date - CURRENT_DATE)) as days_remaining
        FROM hospital_projects p
        LEFT JOIN hospitals h ON p.hospital_id = h.id
        LEFT JOIN staff s ON p.project_manager_id = s.id
        WHERE p.id = $1
      `;
      
      const projectResult = await pool.query(projectQuery, [projectId]);
      
      if (projectResult.rows.length === 0) {
        return { success: false, error: 'Project not found' };
      }
      
      const project = projectResult.rows[0];
      
      // Get team members
      const teamQuery = `
        SELECT 
          tm.*,
          s.first_name,
          s.last_name,
          s.role as staff_role,
          s.department
        FROM project_team_members tm
        JOIN staff s ON tm.staff_id = s.id
        WHERE tm.project_id = $1
      `;
      
      const teamResult = await pool.query(teamQuery, [projectId]);
      project.team = teamResult.rows;
      
      // Get milestones
      const milestonesQuery = `
        SELECT 
          m.*,
          COUNT(t.id) as task_count,
          COUNT(CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks
        FROM project_milestones m
        LEFT JOIN project_tasks t ON m.id = t.milestone_id
        WHERE m.project_id = $1
        GROUP BY m.id
        ORDER BY m.due_date
      `;
      
      const milestonesResult = await pool.query(milestonesQuery, [projectId]);
      project.milestones = milestonesResult.rows;
      
      // Get recent activities
      const timelineQuery = `
        SELECT 
          tl.*,
          s.first_name || ' ' || s.last_name as created_by_name
        FROM project_timeline tl
        LEFT JOIN staff s ON tl.created_by = s.id
        WHERE tl.project_id = $1
        ORDER BY tl.created_at DESC
        LIMIT 20
      `;
      
      const timelineResult = await pool.query(timelineQuery, [projectId]);
      project.timeline = timelineResult.rows;
      
      // Get risks
      const risksQuery = `
        SELECT * FROM project_risks
        WHERE project_id = $1
        ORDER BY 
          CASE severity 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            ELSE 3 
          END
      `;
      
      const risksResult = await pool.query(risksQuery, [projectId]);
      project.risks = risksResult.rows;
      
      // Calculate project health score
      project.healthScore = this.calculateProjectHealth(project);
      
      return {
        success: true,
        data: project
      };
    } catch (error) {
      console.error('Error getting project details:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update project status
   */
  async updateProjectStatus(projectId, status, updatedBy, notes = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update project status
      const updateQuery = `
        UPDATE hospital_projects
        SET 
          status = $2,
          updated_at = NOW(),
          updated_by = $3
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [projectId, status, updatedBy]);
      
      // Add timeline entry
      await client.query(`
        INSERT INTO project_timeline (
          id, project_id, event_type, title, 
          description, created_by, created_at
        ) VALUES ($1, $2, 'status_change', $3, $4, $5, NOW())
      `, [
        uuidv4(),
        projectId,
        `Status changed to ${status}`,
        notes || `Project status updated to ${status}`,
        updatedBy
      ]);
      
      // If project is completed, update completion date
      if (status === 'completed') {
        await client.query(`
          UPDATE hospital_projects
          SET completion_date = NOW()
          WHERE id = $1
        `, [projectId]);
      }
      
      await client.query('COMMIT');
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating project status:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  /**
   * Create project task
   */
  async createTask(taskData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const {
        projectId,
        milestoneId,
        title,
        description,
        assignedTo,
        priority,
        dueDate,
        estimatedHours,
        createdBy
      } = taskData;
      
      const taskId = uuidv4();
      const taskQuery = `
        INSERT INTO project_tasks (
          id, project_id, milestone_id, title, description,
          assigned_to, priority, status, due_date,
          estimated_hours, created_at, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, NOW(), $10
        ) RETURNING *
      `;
      
      const taskValues = [
        taskId,
        projectId,
        milestoneId,
        title,
        description,
        assignedTo,
        priority || 'medium',
        dueDate,
        estimatedHours || 0,
        createdBy
      ];
      
      const result = await client.query(taskQuery, taskValues);
      
      // Add timeline entry
      await client.query(`
        INSERT INTO project_timeline (
          id, project_id, event_type, title, 
          description, created_by, created_at
        ) VALUES ($1, $2, 'task_created', $3, $4, $5, NOW())
      `, [
        uuidv4(),
        projectId,
        'New task created',
        `Task "${title}" has been created`,
        createdBy
      ]);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating task:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId, status, updatedBy, actualHours = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get task details
      const taskQuery = await client.query('SELECT * FROM project_tasks WHERE id = $1', [taskId]);
      const task = taskQuery.rows[0];
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Update task
      const updateQuery = `
        UPDATE project_tasks
        SET 
          status = $2,
          actual_hours = COALESCE($3, actual_hours),
          completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE completed_at END,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [taskId, status, actualHours]);
      
      // Add timeline entry
      await client.query(`
        INSERT INTO project_timeline (
          id, project_id, event_type, title, 
          description, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        uuidv4(),
        task.project_id,
        `task_${status}`,
        `Task status changed`,
        `Task "${task.title}" marked as ${status}`,
        updatedBy
      ]);
      
      // Check if milestone is complete
      if (status === 'completed' && task.milestone_id) {
        await this.checkMilestoneCompletion(task.milestone_id);
      }
      
      await client.query('COMMIT');
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating task status:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  /**
   * Add project expense
   */
  async addExpense(expenseData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const {
        projectId,
        category,
        description,
        amount,
        vendor,
        invoiceNumber,
        approvedBy,
        createdBy
      } = expenseData;
      
      // Add expense
      const expenseQuery = `
        INSERT INTO project_expenses (
          id, project_id, category, description, amount,
          vendor, invoice_number, status, approved_by,
          created_at, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW(), $9
        ) RETURNING *
      `;
      
      const expenseValues = [
        uuidv4(),
        projectId,
        category,
        description,
        amount,
        vendor,
        invoiceNumber,
        approvedBy,
        createdBy
      ];
      
      const result = await client.query(expenseQuery, expenseValues);
      
      // Update project spent budget
      await client.query(`
        UPDATE hospital_projects
        SET 
          spent_budget = spent_budget + $2,
          updated_at = NOW()
        WHERE id = $1
      `, [projectId, amount]);
      
      // Add timeline entry
      await client.query(`
        INSERT INTO project_timeline (
          id, project_id, event_type, title, 
          description, created_by, created_at
        ) VALUES ($1, $2, 'expense_added', $3, $4, $5, NOW())
      `, [
        uuidv4(),
        projectId,
        'Expense recorded',
        `₦${amount.toLocaleString()} expense for ${category}`,
        createdBy
      ]);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding expense:', error);
      return { success: false, error: error.message };
    } finally {
      client.release();
    }
  }

  /**
   * Get project analytics
   */
  async getProjectAnalytics(projectId = null) {
    try {
      let baseCondition = projectId ? 'WHERE p.id = $1' : 'WHERE 1=1';
      const params = projectId ? [projectId] : [];
      
      // Overall project statistics
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT p.id) as total_projects,
          COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id END) as active_projects,
          COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN p.id END) as completed_projects,
          COUNT(DISTINCT CASE WHEN p.status = 'on_hold' THEN p.id END) as on_hold_projects,
          SUM(p.budget) as total_budget,
          SUM(p.spent_budget) as total_spent,
          AVG(p.spent_budget::float / NULLIF(p.budget, 0) * 100) as avg_budget_utilization,
          AVG(CASE WHEN p.status = 'completed' 
            THEN EXTRACT(day FROM (p.completion_date - p.start_date))
            END) as avg_completion_days
        FROM hospital_projects p
        ${baseCondition}
      `;
      
      const statsResult = await pool.query(statsQuery, params);
      
      // Task completion rates
      const taskQuery = `
        SELECT 
          COUNT(t.id) as total_tasks,
          COUNT(CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
          COUNT(CASE WHEN t.status = 'in_progress' THEN t.id END) as in_progress_tasks,
          COUNT(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN t.id END) as overdue_tasks,
          AVG(t.actual_hours - t.estimated_hours) as avg_hour_variance
        FROM project_tasks t
        JOIN hospital_projects p ON t.project_id = p.id
        ${baseCondition}
      `;
      
      const taskResult = await pool.query(taskQuery, params);
      
      // Milestone progress
      const milestoneQuery = `
        SELECT 
          COUNT(m.id) as total_milestones,
          COUNT(CASE WHEN m.status = 'completed' THEN m.id END) as completed_milestones,
          COUNT(CASE WHEN m.due_date < CURRENT_DATE AND m.status != 'completed' THEN m.id END) as overdue_milestones
        FROM project_milestones m
        JOIN hospital_projects p ON m.project_id = p.id
        ${baseCondition}
      `;
      
      const milestoneResult = await pool.query(milestoneQuery, params);
      
      // Risk analysis
      const riskQuery = `
        SELECT 
          COUNT(r.id) as total_risks,
          COUNT(CASE WHEN r.severity = 'high' THEN r.id END) as high_risks,
          COUNT(CASE WHEN r.status = 'mitigated' THEN r.id END) as mitigated_risks
        FROM project_risks r
        JOIN hospital_projects p ON r.project_id = p.id
        ${baseCondition}
      `;
      
      const riskResult = await pool.query(riskQuery, params);
      
      return {
        success: true,
        data: {
          projects: statsResult.rows[0],
          tasks: taskResult.rows[0],
          milestones: milestoneResult.rows[0],
          risks: riskResult.rows[0],
          summary: {
            overallHealth: this.calculateOverallProjectHealth(
              statsResult.rows[0],
              taskResult.rows[0],
              milestoneResult.rows[0]
            ),
            recommendations: this.generateProjectRecommendations(
              statsResult.rows[0],
              taskResult.rows[0]
            )
          }
        }
      };
    } catch (error) {
      console.error('Error getting project analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get expansion opportunities
   */
  async getExpansionOpportunities(hospitalId = null) {
    try {
      let query = `
        WITH hospital_metrics AS (
          SELECT 
            h.id,
            h.name,
            h.total_beds,
            COUNT(DISTINCT p.id) as patient_count,
            COUNT(DISTINCT s.id) as staff_count,
            AVG(CASE WHEN mr.discharge_date IS NULL AND mr.admission_date IS NOT NULL THEN 1 ELSE 0 END) * 100 as occupancy_rate,
            SUM(i.total_amount) as monthly_revenue
          FROM hospitals h
          LEFT JOIN patients p ON h.id = p.hospital_id
          LEFT JOIN staff s ON h.id = s.hospital_id
          LEFT JOIN medical_records mr ON h.id = mr.hospital_id
          LEFT JOIN invoices i ON h.id = i.hospital_id AND i.created_at >= CURRENT_DATE - INTERVAL '30 days'
      `;
      
      const params = [];
      if (hospitalId) {
        query += ' WHERE h.id = $1';
        params.push(hospitalId);
      }
      
      query += `
          GROUP BY h.id, h.name, h.total_beds
        )
        SELECT 
          *,
          CASE 
            WHEN occupancy_rate > 85 THEN 'Bed Capacity Expansion Recommended'
            WHEN patient_count / NULLIF(staff_count, 0) > 50 THEN 'Staff Expansion Needed'
            WHEN monthly_revenue > 10000000 THEN 'Department Expansion Opportunity'
            ELSE 'Monitor Growth'
          END as recommendation,
          CASE 
            WHEN occupancy_rate > 85 THEN 'high'
            WHEN occupancy_rate > 70 THEN 'medium'
            ELSE 'low'
          END as expansion_priority
        FROM hospital_metrics
        ORDER BY expansion_priority, monthly_revenue DESC
      `;
      
      const result = await pool.query(query, params);
      
      const opportunities = result.rows.map(hospital => ({
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        metrics: {
          occupancyRate: parseFloat(hospital.occupancy_rate) || 0,
          patientCount: parseInt(hospital.patient_count) || 0,
          staffCount: parseInt(hospital.staff_count) || 0,
          monthlyRevenue: parseFloat(hospital.monthly_revenue) || 0,
          bedCapacity: parseInt(hospital.total_beds) || 0
        },
        recommendation: hospital.recommendation,
        priority: hospital.expansion_priority,
        suggestedProjects: this.generateExpansionProjects(hospital)
      }));
      
      return {
        success: true,
        data: opportunities
      };
    } catch (error) {
      console.error('Error getting expansion opportunities:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Helper methods
  calculateProjectHealth(project) {
    let score = 100;
    
    // Budget health
    if (project.budget_utilization > 100) score -= 20;
    else if (project.budget_utilization > 90) score -= 10;
    
    // Schedule health
    if (project.days_remaining < 0) score -= 30;
    else if (project.days_remaining < 7) score -= 15;
    
    // Milestone completion
    const milestoneCompletion = project.milestones?.filter(m => m.status === 'completed').length / 
                               (project.milestones?.length || 1);
    score -= (1 - milestoneCompletion) * 20;
    
    // Risk factors
    const highRisks = project.risks?.filter(r => r.severity === 'high' && r.status === 'active').length || 0;
    score -= highRisks * 10;
    
    return Math.max(0, Math.min(100, score));
  }

  async checkMilestoneCompletion(milestoneId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks
        FROM project_tasks
        WHERE milestone_id = $1
      `;
      
      const result = await pool.query(query, [milestoneId]);
      const { total_tasks, completed_tasks } = result.rows[0];
      
      if (total_tasks > 0 && total_tasks === completed_tasks) {
        await pool.query(`
          UPDATE project_milestones
          SET 
            status = 'completed',
            completed_at = NOW()
          WHERE id = $1
        `, [milestoneId]);
      }
    } catch (error) {
      console.error('Error checking milestone completion:', error);
    }
  }

  calculateOverallProjectHealth(projects, tasks, milestones) {
    const budgetHealth = 100 - (projects.avg_budget_utilization || 0);
    const taskHealth = (tasks.completed_tasks / (tasks.total_tasks || 1)) * 100;
    const milestoneHealth = (milestones.completed_milestones / (milestones.total_milestones || 1)) * 100;
    
    const overallHealth = (budgetHealth + taskHealth + milestoneHealth) / 3;
    
    if (overallHealth > 80) return 'excellent';
    if (overallHealth > 60) return 'good';
    if (overallHealth > 40) return 'fair';
    return 'needs attention';
  }

  generateProjectRecommendations(projects, tasks) {
    const recommendations = [];
    
    if (projects.avg_budget_utilization > 90) {
      recommendations.push('Review budget allocations for active projects');
    }
    
    if (tasks.overdue_tasks > tasks.total_tasks * 0.2) {
      recommendations.push('Address overdue tasks to improve project timelines');
    }
    
    if (projects.on_hold_projects > projects.active_projects) {
      recommendations.push('Review on-hold projects and determine next steps');
    }
    
    if (tasks.avg_hour_variance > 10) {
      recommendations.push('Improve task estimation accuracy for better planning');
    }
    
    return recommendations;
  }

  generateExpansionProjects(hospital) {
    const projects = [];
    
    if (hospital.occupancy_rate > 85) {
      projects.push({
        type: 'capacity_expansion',
        title: 'Bed Capacity Expansion',
        description: 'Add 20-30 additional beds to meet demand',
        estimatedBudget: 50000000,
        estimatedDuration: '6 months'
      });
    }
    
    if (hospital.patient_count / hospital.staff_count > 50) {
      projects.push({
        type: 'staff_expansion',
        title: 'Staff Recruitment Drive',
        description: 'Hire additional medical and support staff',
        estimatedBudget: 10000000,
        estimatedDuration: '3 months'
      });
    }
    
    if (hospital.monthly_revenue > 10000000) {
      projects.push({
        type: 'department_expansion',
        title: 'New Department Setup',
        description: 'Establish specialized department (e.g., ICU, NICU)',
        estimatedBudget: 75000000,
        estimatedDuration: '9 months'
      });
    }
    
    return projects;
  }
}

module.exports = new ProjectManagementService();
