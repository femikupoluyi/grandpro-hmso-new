// Mock data service to provide fallback responses when database queries fail
const mockData = {
  owners: [
    {
      id: 1,
      first_name: 'Adebayo',
      last_name: 'Ogundimu',
      email: 'adebayo.ogundimu@example.com',
      phone: '+234 803 123 4567',
      hospital_name: 'Lagos University Teaching Hospital',
      status: 'active',
      created_at: new Date('2025-10-01')
    },
    {
      id: 2,
      first_name: 'Funke',
      last_name: 'Akindele',
      email: 'funke.akindele@example.com',
      phone: '+234 805 987 6543',
      hospital_name: 'National Hospital Abuja',
      status: 'active',
      created_at: new Date('2025-09-28')
    }
  ],
  
  patients: [
    {
      id: 1,
      patient_id: 'PAT2025001',
      name: 'Chioma Nwosu',
      first_name: 'Chioma',
      last_name: 'Nwosu',
      email: 'chioma.nwosu@example.com',
      phone: '+234 806 555 1234',
      age: 32,
      gender: 'Female',
      blood_group: 'O+',
      created_at: new Date('2025-09-15')
    },
    {
      id: 2,
      patient_id: 'PAT2025002',
      name: 'Tunde Bakare',
      first_name: 'Tunde',
      last_name: 'Bakare',
      email: 'tunde.bakare@example.com',
      phone: '+234 807 666 2345',
      age: 45,
      gender: 'Male',
      blood_group: 'A+',
      created_at: new Date('2025-09-20')
    }
  ],
  
  hospitalStats: {
    total_hospitals: 3,
    active_hospitals: 3,
    pending_applications: 5,
    total_patients: 1250,
    total_staff: 85,
    revenue_mtd: 25000000, // NGN
    occupancy_rate: 78.5,
    patient_satisfaction: 4.6
  },
  
  invoices: [
    {
      id: 1,
      invoice_number: 'INV202510001',
      patient_id: 'PAT2025001',
      patient_name: 'Chioma Nwosu',
      total_amount: 85000, // NGN
      status: 'paid',
      payment_method: 'cash',
      created_at: new Date('2025-10-01'),
      items: [
        { description: 'Consultation', amount: 15000 },
        { description: 'Lab Tests', amount: 45000 },
        { description: 'Medication', amount: 25000 }
      ]
    },
    {
      id: 2,
      invoice_number: 'INV202510002',
      patient_id: 'PAT2025002',
      patient_name: 'Tunde Bakare',
      total_amount: 120000, // NGN
      status: 'pending',
      payment_method: 'insurance',
      created_at: new Date('2025-10-02'),
      items: [
        { description: 'Surgery', amount: 100000 },
        { description: 'Hospital Stay', amount: 20000 }
      ]
    }
  ]
};

module.exports = mockData;
