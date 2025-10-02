/**
 * Telemedicine Integration Routes
 */

const express = require('express');
const router = express.Router();
const TelemedicineIntegration = require('../integrations/telemedicineIntegration');
const crypto = require('crypto');

// Initialize telemedicine integration
const telemedicine = new TelemedicineIntegration();

// Schedule consultation
router.post('/consultations/schedule', async (req, res) => {
  try {
    const { patientId, doctorId, dateTime, type, reason } = req.body;
    
    // Mock consultation scheduling for demo
    const consultation = {
      consultationId: `CONS-${Date.now()}`,
      patientId,
      doctorId: doctorId || 'DOC001',
      doctorName: 'Dr. Adebayo Williams',
      dateTime: dateTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
      type: type || 'video',
      reason: reason || 'General Consultation',
      status: 'scheduled',
      duration: 30,
      meetingUrl: `https://meet.wellahealth.ng/room/${crypto.randomBytes(8).toString('hex')}`,
      accessCode: Math.floor(100000 + Math.random() * 900000).toString(),
      provider: 'WellaHealth',
      estimatedCost: 5000
    };
    
    res.json({
      success: true,
      ...consultation,
      message: 'Consultation scheduled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start video session
router.post('/sessions/start', async (req, res) => {
  try {
    const { consultationId, patientId, doctorId } = req.body;
    
    // Mock session start for demo
    const session = {
      sessionId: `SESS-${Date.now()}`,
      consultationId: consultationId || `CONS-${Date.now()}`,
      patientId,
      doctorId,
      status: 'active',
      startedAt: new Date(),
      videoUrl: `https://meet.wellahealth.ng/room/${crypto.randomBytes(8).toString('hex')}`,
      chatEnabled: true,
      screenShareEnabled: true,
      recordingEnabled: false,
      sessionToken: crypto.randomBytes(32).toString('hex'),
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };
    
    res.json({
      success: true,
      ...session,
      message: 'Video session started successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// End session
router.post('/sessions/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { notes, prescription, followUp } = req.body;
    
    // Mock session end for demo
    const endedSession = {
      sessionId,
      endedAt: new Date(),
      duration: Math.floor(Math.random() * 30) + 10,
      notes: notes || 'Patient consulted for general checkup',
      prescription: prescription || [],
      followUp: followUp || null,
      recordingUrl: null,
      status: 'completed'
    };
    
    res.json({
      success: true,
      ...endedSession,
      message: 'Session ended successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get available doctors
router.get('/doctors/available', async (req, res) => {
  try {
    const { specialty, date } = req.query;
    
    // Mock available doctors for demo
    const doctors = [
      {
        doctorId: 'DOC001',
        name: 'Dr. Adebayo Williams',
        specialty: 'General Practice',
        rating: 4.8,
        consultationFee: 5000,
        availability: ['09:00', '10:00', '14:00', '15:00'],
        languages: ['English', 'Yoruba']
      },
      {
        doctorId: 'DOC002',
        name: 'Dr. Ngozi Okafor',
        specialty: 'Pediatrics',
        rating: 4.9,
        consultationFee: 6000,
        availability: ['11:00', '13:00', '16:00'],
        languages: ['English', 'Igbo']
      },
      {
        doctorId: 'DOC003',
        name: 'Dr. Ibrahim Musa',
        specialty: 'Internal Medicine',
        rating: 4.7,
        consultationFee: 7000,
        availability: ['08:00', '12:00', '17:00'],
        languages: ['English', 'Hausa']
      }
    ];
    
    const filtered = specialty 
      ? doctors.filter(doc => doc.specialty === specialty)
      : doctors;
    
    res.json({
      success: true,
      date: date || new Date().toISOString().split('T')[0],
      doctors: filtered,
      totalAvailable: filtered.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Submit prescription
router.post('/prescriptions', async (req, res) => {
  try {
    const { consultationId, patientId, doctorId, medications } = req.body;
    
    // Mock prescription submission for demo
    const prescription = {
      prescriptionId: `RX-${Date.now()}`,
      consultationId,
      patientId,
      doctorId,
      doctorName: 'Dr. Adebayo Williams',
      date: new Date(),
      medications: medications || [
        {
          name: 'Paracetamol 500mg',
          dosage: '1 tablet',
          frequency: 'Three times daily',
          duration: '5 days',
          instructions: 'Take after meals'
        }
      ],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      qrCode: `data:image/png;base64,${Buffer.from(`RX-${Date.now()}`).toString('base64')}`,
      digitalSignature: crypto.randomBytes(64).toString('hex')
    };
    
    res.json({
      success: true,
      ...prescription,
      message: 'Prescription created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get consultation history
router.get('/consultations/history/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Mock consultation history for demo
    const history = [
      {
        consultationId: 'CONS-001',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        doctorName: 'Dr. Adebayo Williams',
        type: 'video',
        duration: 25,
        diagnosis: 'Common cold',
        status: 'completed'
      },
      {
        consultationId: 'CONS-002',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        doctorName: 'Dr. Ngozi Okafor',
        type: 'chat',
        duration: 15,
        diagnosis: 'Follow-up consultation',
        status: 'completed'
      }
    ];
    
    res.json({
      success: true,
      patientId,
      consultations: history,
      totalConsultations: history.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
