/**
 * CRM Tables Migration
 * Creates all tables for Owner and Patient CRM
 */

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create CRM Owners table
    await queryInterface.createTable('crm_owners', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      owner_code: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      nin: {
        type: DataTypes.STRING(11),
        comment: 'National Identification Number'
      },
      hospital_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'hospitals',
          key: 'id'
        }
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
      },
      onboarding_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      last_contact_date: {
        type: DataTypes.DATE
      },
      satisfaction_score: {
        type: DataTypes.DECIMAL(3, 2)
      },
      lifetime_value: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
      },
      payment_status: {
        type: DataTypes.ENUM('current', 'overdue', 'pending'),
        defaultValue: 'current'
      },
      notes: {
        type: DataTypes.TEXT
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Create CRM Patients table
    await queryInterface.createTable('crm_patients', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      patient_code: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      middle_name: {
        type: DataTypes.STRING(100)
      },
      email: {
        type: DataTypes.STRING(255),
        unique: true
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      alternate_phone: {
        type: DataTypes.STRING(20)
      },
      date_of_birth: {
        type: DataTypes.DATE,
        allowNull: false
      },
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: false
      },
      blood_group: {
        type: DataTypes.STRING(10)
      },
      genotype: {
        type: DataTypes.STRING(10)
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      state: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      lga: {
        type: DataTypes.STRING(100)
      },
      nin: {
        type: DataTypes.STRING(11)
      },
      registration_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      last_visit_date: {
        type: DataTypes.DATE
      },
      visit_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      loyalty_points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      loyalty_tier: {
        type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
        defaultValue: 'bronze'
      },
      preferred_hospital_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'hospitals',
          key: 'id'
        }
      },
      emergency_contact_name: {
        type: DataTypes.STRING(200)
      },
      emergency_contact_phone: {
        type: DataTypes.STRING(20)
      },
      emergency_contact_relationship: {
        type: DataTypes.STRING(50)
      },
      allergies: {
        type: DataTypes.JSON,
        defaultValue: []
      },
      chronic_conditions: {
        type: DataTypes.JSON,
        defaultValue: []
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'deceased'),
        defaultValue: 'active'
      },
      communication_preferences: {
        type: DataTypes.JSON,
        defaultValue: {
          sms: true,
          email: true,
          whatsapp: true,
          push: false
        }
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Create CRM Campaigns table
    await queryInterface.createTable('crm_campaigns', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT
      },
      type: {
        type: DataTypes.ENUM('promotional', 'educational', 'reminder', 'follow_up', 'survey'),
        allowNull: false
      },
      target_audience: {
        type: DataTypes.ENUM('all_patients', 'all_owners', 'specific_segment', 'custom'),
        allowNull: false
      },
      segment_criteria: {
        type: DataTypes.JSON
      },
      channels: {
        type: DataTypes.JSON,
        defaultValue: ['sms', 'email']
      },
      message_template: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('draft', 'scheduled', 'active', 'paused', 'completed'),
        defaultValue: 'draft'
      },
      scheduled_date: {
        type: DataTypes.DATE
      },
      start_date: {
        type: DataTypes.DATE
      },
      end_date: {
        type: DataTypes.DATE
      },
      total_recipients: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      messages_sent: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      messages_delivered: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      messages_read: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      response_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
      },
      created_by: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Create CRM Communication Logs table
    await queryInterface.createTable('crm_communication_logs', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      recipient_type: {
        type: DataTypes.ENUM('owner', 'patient', 'staff'),
        allowNull: false
      },
      recipient_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      campaign_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'crm_campaigns',
          key: 'id'
        }
      },
      channel: {
        type: DataTypes.ENUM('sms', 'email', 'whatsapp', 'push', 'call'),
        allowNull: false
      },
      message_type: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      subject: {
        type: DataTypes.STRING(255)
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'sent', 'delivered', 'failed', 'read'),
        defaultValue: 'pending'
      },
      sent_at: {
        type: DataTypes.DATE
      },
      delivered_at: {
        type: DataTypes.DATE
      },
      read_at: {
        type: DataTypes.DATE
      },
      error_message: {
        type: DataTypes.TEXT
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Create CRM Appointments table
    await queryInterface.createTable('crm_appointments', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      appointment_code: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
      },
      patient_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'crm_patients',
          key: 'id'
        },
        allowNull: false
      },
      hospital_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'hospitals',
          key: 'id'
        },
        allowNull: false
      },
      department_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'departments',
          key: 'id'
        }
      },
      doctor_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'staff',
          key: 'id'
        }
      },
      appointment_date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      appointment_time: {
        type: DataTypes.TIME,
        allowNull: false
      },
      duration_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 30
      },
      type: {
        type: DataTypes.ENUM('consultation', 'follow_up', 'procedure', 'emergency', 'telemedicine'),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('scheduled', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show'),
        defaultValue: 'scheduled'
      },
      reason: {
        type: DataTypes.TEXT
      },
      notes: {
        type: DataTypes.TEXT
      },
      reminder_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      reminder_sent_at: {
        type: DataTypes.DATE
      },
      checked_in_at: {
        type: DataTypes.DATE
      },
      started_at: {
        type: DataTypes.DATE
      },
      completed_at: {
        type: DataTypes.DATE
      },
      cancelled_at: {
        type: DataTypes.DATE
      },
      cancellation_reason: {
        type: DataTypes.TEXT
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Create CRM Feedback table
    await queryInterface.createTable('crm_feedback', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      source_type: {
        type: DataTypes.ENUM('patient', 'owner', 'staff'),
        allowNull: false
      },
      source_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      hospital_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'hospitals',
          key: 'id'
        }
      },
      type: {
        type: DataTypes.ENUM('complaint', 'suggestion', 'compliment', 'survey_response'),
        allowNull: false
      },
      category: {
        type: DataTypes.STRING(100)
      },
      rating: {
        type: DataTypes.INTEGER
      },
      subject: {
        type: DataTypes.STRING(255)
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('new', 'acknowledged', 'in_progress', 'resolved', 'closed'),
        defaultValue: 'new'
      },
      priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        defaultValue: 'medium'
      },
      assigned_to: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      resolution: {
        type: DataTypes.TEXT
      },
      resolved_at: {
        type: DataTypes.DATE
      },
      satisfaction_rating: {
        type: DataTypes.INTEGER
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Create CRM Loyalty Transactions table
    await queryInterface.createTable('crm_loyalty_transactions', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      patient_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'crm_patients',
          key: 'id'
        },
        allowNull: false
      },
      transaction_type: {
        type: DataTypes.ENUM('earned', 'redeemed', 'expired', 'adjusted'),
        allowNull: false
      },
      points: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      balance_after: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      reference_type: {
        type: DataTypes.STRING(50)
      },
      reference_id: {
        type: DataTypes.INTEGER
      },
      expiry_date: {
        type: DataTypes.DATE
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Create CRM Payouts table
    await queryInterface.createTable('crm_payouts', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      payout_code: {
        type: DataTypes.STRING(50),
        unique: true,
        allowNull: false
      },
      owner_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'crm_owners',
          key: 'id'
        },
        allowNull: false
      },
      contract_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'contracts',
          key: 'id'
        }
      },
      period_start: {
        type: DataTypes.DATE,
        allowNull: false
      },
      period_end: {
        type: DataTypes.DATE,
        allowNull: false
      },
      gross_revenue: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
      },
      deductions: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0
      },
      net_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'processing', 'paid', 'failed', 'cancelled'),
        defaultValue: 'pending'
      },
      payment_method: {
        type: DataTypes.ENUM('bank_transfer', 'cheque', 'mobile_money'),
        defaultValue: 'bank_transfer'
      },
      payment_reference: {
        type: DataTypes.STRING(100)
      },
      bank_name: {
        type: DataTypes.STRING(100)
      },
      account_number: {
        type: DataTypes.STRING(20)
      },
      account_name: {
        type: DataTypes.STRING(200)
      },
      approved_by: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      approved_at: {
        type: DataTypes.DATE
      },
      paid_at: {
        type: DataTypes.DATE
      },
      notes: {
        type: DataTypes.TEXT
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('crm_owners', ['email']);
    await queryInterface.addIndex('crm_owners', ['hospital_id']);
    await queryInterface.addIndex('crm_owners', ['status']);
    
    await queryInterface.addIndex('crm_patients', ['email']);
    await queryInterface.addIndex('crm_patients', ['phone']);
    await queryInterface.addIndex('crm_patients', ['status']);
    await queryInterface.addIndex('crm_patients', ['loyalty_tier']);
    
    await queryInterface.addIndex('crm_appointments', ['patient_id']);
    await queryInterface.addIndex('crm_appointments', ['hospital_id']);
    await queryInterface.addIndex('crm_appointments', ['appointment_date']);
    await queryInterface.addIndex('crm_appointments', ['status']);
    
    await queryInterface.addIndex('crm_communication_logs', ['recipient_type', 'recipient_id']);
    await queryInterface.addIndex('crm_communication_logs', ['campaign_id']);
    await queryInterface.addIndex('crm_communication_logs', ['status']);
    
    await queryInterface.addIndex('crm_payouts', ['owner_id']);
    await queryInterface.addIndex('crm_payouts', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('crm_payouts');
    await queryInterface.dropTable('crm_loyalty_transactions');
    await queryInterface.dropTable('crm_feedback');
    await queryInterface.dropTable('crm_appointments');
    await queryInterface.dropTable('crm_communication_logs');
    await queryInterface.dropTable('crm_campaigns');
    await queryInterface.dropTable('crm_patients');
    await queryInterface.dropTable('crm_owners');
  }
};
