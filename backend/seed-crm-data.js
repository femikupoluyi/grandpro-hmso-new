/**
 * Seed CRM Data
 * Populates CRM tables with Nigerian sample data
 */

const pg = require('pg');
require('dotenv').config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedCRMData() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Seed Owners
    const owners = [
      {
        owner_code: 'OWN-001',
        first_name: 'Adebayo',
        last_name: 'Ogundimu',
        email: 'adebayo.ogundimu@lagoshospital.ng',
        phone: '+2348012345678',
        nin: '12345678901',
        hospital_id: 1,
        status: 'active',
        satisfaction_score: 4.5,
        lifetime_value: 50000000,
        payment_status: 'current'
      },
      {
        owner_code: 'OWN-002',
        first_name: 'Fatima',
        last_name: 'Abdullahi',
        email: 'fatima.abdullahi@abujamed.ng',
        phone: '+2348023456789',
        nin: '98765432101',
        hospital_id: 2,
        status: 'active',
        satisfaction_score: 4.8,
        lifetime_value: 75000000,
        payment_status: 'current'
      },
      {
        owner_code: 'OWN-003',
        first_name: 'Emeka',
        last_name: 'Nwankwo',
        email: 'emeka.nwankwo@portharcourt.ng',
        phone: '+2348034567890',
        nin: '45678901234',
        hospital_id: 3,
        status: 'active',
        satisfaction_score: 4.2,
        lifetime_value: 35000000,
        payment_status: 'overdue'
      }
    ];

    for (const owner of owners) {
      await client.query(`
        INSERT INTO crm_owners (
          owner_code, first_name, last_name, email, phone, nin, 
          hospital_id, status, satisfaction_score, lifetime_value, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (owner_code) DO NOTHING
      `, [
        owner.owner_code, owner.first_name, owner.last_name, owner.email,
        owner.phone, owner.nin, owner.hospital_id, owner.status,
        owner.satisfaction_score, owner.lifetime_value, owner.payment_status
      ]);
    }
    console.log('✅ Owners seeded');

    // Seed Patients
    const patients = [
      {
        patient_code: 'PAT-001',
        first_name: 'Chioma',
        last_name: 'Okafor',
        email: 'chioma.okafor@email.com',
        phone: '+2348045678901',
        date_of_birth: '1990-05-15',
        gender: 'female',
        blood_group: 'O+',
        genotype: 'AA',
        address: '15 Victoria Island, Lagos',
        city: 'Lagos',
        state: 'Lagos',
        lga: 'Eti-Osa',
        loyalty_points: 500,
        loyalty_tier: 'silver'
      },
      {
        patient_code: 'PAT-002',
        first_name: 'Ibrahim',
        last_name: 'Musa',
        email: 'ibrahim.musa@email.com',
        phone: '+2348056789012',
        date_of_birth: '1985-08-22',
        gender: 'male',
        blood_group: 'A+',
        genotype: 'AS',
        address: '23 Garki District, Abuja',
        city: 'Abuja',
        state: 'FCT',
        lga: 'Garki',
        loyalty_points: 1200,
        loyalty_tier: 'gold'
      },
      {
        patient_code: 'PAT-003',
        first_name: 'Ngozi',
        last_name: 'Eze',
        email: 'ngozi.eze@email.com',
        phone: '+2348067890123',
        date_of_birth: '1995-12-10',
        gender: 'female',
        blood_group: 'B+',
        genotype: 'AA',
        address: '45 New Layout, Enugu',
        city: 'Enugu',
        state: 'Enugu',
        lga: 'Enugu North',
        loyalty_points: 200,
        loyalty_tier: 'bronze'
      },
      {
        patient_code: 'PAT-004',
        first_name: 'Yusuf',
        last_name: 'Abubakar',
        email: 'yusuf.abubakar@email.com',
        phone: '+2348078901234',
        date_of_birth: '1988-03-28',
        gender: 'male',
        blood_group: 'AB+',
        genotype: 'AA',
        address: '12 Sabon Gari, Kano',
        city: 'Kano',
        state: 'Kano',
        lga: 'Kano Municipal',
        loyalty_points: 800,
        loyalty_tier: 'silver'
      },
      {
        patient_code: 'PAT-005',
        first_name: 'Blessing',
        last_name: 'Okoro',
        email: 'blessing.okoro@email.com',
        phone: '+2348089012345',
        date_of_birth: '1992-07-19',
        gender: 'female',
        blood_group: 'O-',
        genotype: 'AS',
        address: '78 Old GRA, Port Harcourt',
        city: 'Port Harcourt',
        state: 'Rivers',
        lga: 'Port Harcourt',
        loyalty_points: 2500,
        loyalty_tier: 'platinum'
      }
    ];

    for (const patient of patients) {
      await client.query(`
        INSERT INTO crm_patients (
          patient_code, first_name, last_name, email, phone, date_of_birth,
          gender, blood_group, genotype, address, city, state, lga,
          loyalty_points, loyalty_tier
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (patient_code) DO NOTHING
      `, [
        patient.patient_code, patient.first_name, patient.last_name, patient.email,
        patient.phone, patient.date_of_birth, patient.gender, patient.blood_group,
        patient.genotype, patient.address, patient.city, patient.state, patient.lga,
        patient.loyalty_points, patient.loyalty_tier
      ]);
    }
    console.log('✅ Patients seeded');

    // Seed Campaigns
    const campaigns = [
      {
        name: 'World Malaria Day Awareness',
        description: 'Educational campaign about malaria prevention',
        type: 'educational',
        target_audience: 'all_patients',
        message_template: 'Dear {name}, April 25th is World Malaria Day. Remember to sleep under treated mosquito nets and keep your environment clean. Visit our hospital for free malaria testing.',
        status: 'active',
        total_recipients: 100,
        messages_sent: 100,
        messages_delivered: 95
      },
      {
        name: 'Free Health Screening',
        description: 'Promotional campaign for free health checks',
        type: 'promotional',
        target_audience: 'all_patients',
        message_template: 'Hello {name}, enjoy FREE health screening this month at GrandPro HMSO partner hospitals. Check your BP, sugar level, and BMI. Book now!',
        status: 'scheduled',
        total_recipients: 150,
        messages_sent: 0
      },
      {
        name: 'Appointment Reminder System',
        description: 'Automated appointment reminders',
        type: 'reminder',
        target_audience: 'specific_segment',
        message_template: 'Dear {name}, this is a reminder for your appointment tomorrow at {time}. Reply YES to confirm or NO to reschedule.',
        status: 'active',
        total_recipients: 50,
        messages_sent: 50,
        messages_delivered: 48
      }
    ];

    for (const campaign of campaigns) {
      await client.query(`
        INSERT INTO crm_campaigns (
          name, description, type, target_audience, message_template,
          status, total_recipients, messages_sent, messages_delivered
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `, [
        campaign.name, campaign.description, campaign.type, campaign.target_audience,
        campaign.message_template, campaign.status, campaign.total_recipients,
        campaign.messages_sent, campaign.messages_delivered
      ]);
    }
    console.log('✅ Campaigns seeded');

    // Seed Appointments
    const appointments = [
      {
        appointment_code: 'APT-001',
        patient_id: 1,
        hospital_id: 1,
        appointment_date: '2025-10-10',
        appointment_time: '10:00:00',
        type: 'consultation',
        status: 'scheduled',
        reason: 'General checkup'
      },
      {
        appointment_code: 'APT-002',
        patient_id: 2,
        hospital_id: 2,
        appointment_date: '2025-10-11',
        appointment_time: '14:30:00',
        type: 'follow_up',
        status: 'confirmed',
        reason: 'Post-surgery follow-up'
      },
      {
        appointment_code: 'APT-003',
        patient_id: 3,
        hospital_id: 1,
        appointment_date: '2025-10-12',
        appointment_time: '09:00:00',
        type: 'procedure',
        status: 'scheduled',
        reason: 'Blood test'
      }
    ];

    for (const apt of appointments) {
      await client.query(`
        INSERT INTO crm_appointments (
          appointment_code, patient_id, hospital_id, appointment_date,
          appointment_time, type, status, reason
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (appointment_code) DO NOTHING
      `, [
        apt.appointment_code, apt.patient_id, apt.hospital_id, apt.appointment_date,
        apt.appointment_time, apt.type, apt.status, apt.reason
      ]);
    }
    console.log('✅ Appointments seeded');

    // Seed Feedback
    const feedback = [
      {
        source_type: 'patient',
        source_id: 1,
        hospital_id: 1,
        type: 'compliment',
        category: 'Service',
        rating: 5,
        subject: 'Excellent Service',
        message: 'The doctors and nurses were very professional and caring. Thank you!',
        status: 'acknowledged'
      },
      {
        source_type: 'patient',
        source_id: 2,
        hospital_id: 2,
        type: 'complaint',
        category: 'Wait Time',
        rating: 2,
        subject: 'Long waiting time',
        message: 'I had to wait for 3 hours before seeing the doctor despite having an appointment.',
        status: 'in_progress',
        priority: 'high'
      },
      {
        source_type: 'owner',
        source_id: 1,
        type: 'suggestion',
        category: 'System',
        subject: 'Mobile app needed',
        message: 'It would be great to have a mobile app for easier patient management.',
        status: 'new',
        priority: 'medium'
      }
    ];

    for (const fb of feedback) {
      await client.query(`
        INSERT INTO crm_feedback (
          source_type, source_id, hospital_id, type, category, rating,
          subject, message, status, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
      `, [
        fb.source_type, fb.source_id, fb.hospital_id, fb.type, fb.category,
        fb.rating, fb.subject, fb.message, fb.status, fb.priority
      ]);
    }
    console.log('✅ Feedback seeded');

    // Seed Payouts
    const payouts = [
      {
        payout_code: 'PAY-001',
        owner_id: 1,
        period_start: '2025-09-01',
        period_end: '2025-09-30',
        gross_revenue: 5000000,
        deductions: 500000,
        net_amount: 4500000,
        status: 'paid',
        payment_method: 'bank_transfer',
        bank_name: 'First Bank of Nigeria',
        account_number: '3012345678',
        account_name: 'Adebayo Ogundimu'
      },
      {
        payout_code: 'PAY-002',
        owner_id: 2,
        period_start: '2025-09-01',
        period_end: '2025-09-30',
        gross_revenue: 7500000,
        deductions: 750000,
        net_amount: 6750000,
        status: 'approved',
        payment_method: 'bank_transfer',
        bank_name: 'GTBank',
        account_number: '0123456789',
        account_name: 'Fatima Abdullahi'
      },
      {
        payout_code: 'PAY-003',
        owner_id: 3,
        period_start: '2025-09-01',
        period_end: '2025-09-30',
        gross_revenue: 3500000,
        deductions: 350000,
        net_amount: 3150000,
        status: 'pending',
        payment_method: 'bank_transfer'
      }
    ];

    for (const payout of payouts) {
      await client.query(`
        INSERT INTO crm_payouts (
          payout_code, owner_id, period_start, period_end, gross_revenue,
          deductions, net_amount, status, payment_method, bank_name,
          account_number, account_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (payout_code) DO NOTHING
      `, [
        payout.payout_code, payout.owner_id, payout.period_start, payout.period_end,
        payout.gross_revenue, payout.deductions, payout.net_amount, payout.status,
        payout.payment_method, payout.bank_name, payout.account_number, payout.account_name
      ]);
    }
    console.log('✅ Payouts seeded');

    // Seed Loyalty Transactions
    const loyaltyTxns = [
      {
        patient_id: 1,
        transaction_type: 'earned',
        points: 100,
        balance_after: 600,
        description: 'Points for appointment completion'
      },
      {
        patient_id: 2,
        transaction_type: 'earned',
        points: 200,
        balance_after: 1400,
        description: 'Referral bonus'
      },
      {
        patient_id: 5,
        transaction_type: 'redeemed',
        points: -500,
        balance_after: 2000,
        description: 'Redeemed for free consultation'
      }
    ];

    for (const txn of loyaltyTxns) {
      await client.query(`
        INSERT INTO crm_loyalty_transactions (
          patient_id, transaction_type, points, balance_after, description
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        txn.patient_id, txn.transaction_type, txn.points, 
        txn.balance_after, txn.description
      ]);
    }
    console.log('✅ Loyalty transactions seeded');

    console.log('\n✅ All CRM data seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding CRM data:', error);
  } finally {
    await client.end();
  }
}

seedCRMData();
