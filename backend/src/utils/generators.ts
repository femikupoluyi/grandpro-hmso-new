import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate application number (APP-YYYY-MM-XXXXXX)
export async function generateApplicationNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Get the count of applications for this month
  const startOfMonth = new Date(year, date.getMonth(), 1);
  const endOfMonth = new Date(year, date.getMonth() + 1, 0);
  
  const count = await prisma.onboardingApplication.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
  
  const sequence = String(count + 1).padStart(6, '0');
  return `APP-${year}-${month}-${sequence}`;
}

// Generate contract number (CON-YYYY-MM-XXXXXX)
export async function generateContractNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Get the count of contracts for this month
  const startOfMonth = new Date(year, date.getMonth(), 1);
  const endOfMonth = new Date(year, date.getMonth() + 1, 0);
  
  const count = await prisma.onboardingContract.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
  
  const sequence = String(count + 1).padStart(6, '0');
  return `CON-${year}-${month}-${sequence}`;
}

// Generate hospital code (HOS-STATE-XXXXX)
export async function generateHospitalCode(state: string): Promise<string> {
  const stateCode = getStateCode(state);
  
  const count = await prisma.hospital.count({
    where: {
      state: state,
    },
  });
  
  const sequence = String(count + 1).padStart(5, '0');
  return `HOS-${stateCode}-${sequence}`;
}

// Generate patient number (PAT-YYYY-XXXXXXXX)
export async function generatePatientNumber(): Promise<string> {
  const year = new Date().getFullYear();
  
  const count = await prisma.patient.count({
    where: {
      registeredAt: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
  });
  
  const sequence = String(count + 1).padStart(8, '0');
  return `PAT-${year}-${sequence}`;
}

// Generate appointment number (APT-YYYYMMDD-XXXXX)
export async function generateAppointmentNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  const startOfDay = new Date(year, date.getMonth(), date.getDate());
  const endOfDay = new Date(year, date.getMonth(), date.getDate() + 1);
  
  const count = await prisma.appointment.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });
  
  const sequence = String(count + 1).padStart(5, '0');
  return `APT-${dateStr}-${sequence}`;
}

// Generate invoice number (INV-YYYY-MM-XXXXXX)
export async function generateInvoiceNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const startOfMonth = new Date(year, date.getMonth(), 1);
  const endOfMonth = new Date(year, date.getMonth() + 1, 0);
  
  const count = await prisma.invoice.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });
  
  const sequence = String(count + 1).padStart(6, '0');
  return `INV-${year}-${month}-${sequence}`;
}

// Generate payment number (PAY-YYYYMMDD-XXXXX)
export async function generatePaymentNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  const startOfDay = new Date(year, date.getMonth(), date.getDate());
  const endOfDay = new Date(year, date.getMonth(), date.getDate() + 1);
  
  const count = await prisma.payment.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });
  
  const sequence = String(count + 1).padStart(5, '0');
  return `PAY-${dateStr}-${sequence}`;
}

// Generate medical record number (MED-YYYY-XXXXXXXX)
export async function generateMedicalRecordNumber(): Promise<string> {
  const year = new Date().getFullYear();
  
  const count = await prisma.medicalRecord.count({
    where: {
      createdAt: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
  });
  
  const sequence = String(count + 1).padStart(8, '0');
  return `MED-${year}-${sequence}`;
}

// Generate prescription number (RX-YYYYMMDD-XXXXX)
export async function generatePrescriptionNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  const startOfDay = new Date(year, date.getMonth(), date.getDate());
  const endOfDay = new Date(year, date.getMonth(), date.getDate() + 1);
  
  const count = await prisma.prescription.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });
  
  const sequence = String(count + 1).padStart(5, '0');
  return `RX-${dateStr}-${sequence}`;
}

// Generate lab result number (LAB-YYYYMMDD-XXXXX)
export async function generateLabNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  const startOfDay = new Date(year, date.getMonth(), date.getDate());
  const endOfDay = new Date(year, date.getMonth(), date.getDate() + 1);
  
  const count = await prisma.labResult.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });
  
  const sequence = String(count + 1).padStart(5, '0');
  return `LAB-${dateStr}-${sequence}`;
}

// Generate staff number (STF-YYYY-XXXXX)
export async function generateStaffNumber(): Promise<string> {
  const year = new Date().getFullYear();
  
  const count = await prisma.staffMember.count({
    where: {
      createdAt: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
  });
  
  const sequence = String(count + 1).padStart(5, '0');
  return `STF-${year}-${sequence}`;
}

// Helper function to get state code
function getStateCode(state: string): string {
  const stateCodes: { [key: string]: string } = {
    'Abia': 'AB',
    'Adamawa': 'AD',
    'Akwa Ibom': 'AK',
    'Anambra': 'AN',
    'Bauchi': 'BA',
    'Bayelsa': 'BY',
    'Benue': 'BN',
    'Borno': 'BO',
    'Cross River': 'CR',
    'Delta': 'DT',
    'Ebonyi': 'EB',
    'Edo': 'ED',
    'Ekiti': 'EK',
    'Enugu': 'EN',
    'FCT': 'FC',
    'Gombe': 'GM',
    'Imo': 'IM',
    'Jigawa': 'JG',
    'Kaduna': 'KD',
    'Kano': 'KN',
    'Katsina': 'KT',
    'Kebbi': 'KB',
    'Kogi': 'KG',
    'Kwara': 'KW',
    'Lagos': 'LG',
    'Nasarawa': 'NS',
    'Niger': 'NG',
    'Ogun': 'OG',
    'Ondo': 'ON',
    'Osun': 'OS',
    'Oyo': 'OY',
    'Plateau': 'PL',
    'Rivers': 'RV',
    'Sokoto': 'SK',
    'Taraba': 'TR',
    'Yobe': 'YB',
    'Zamfara': 'ZM',
  };
  
  return stateCodes[state] || 'XX';
}

// Generate random alphanumeric string
export function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Generate OTP (6-digit number)
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate secure token
export function generateSecureToken(length: number = 32): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

// Generate session ID
export function generateSessionId(): string {
  return `sess_${generateSecureToken(16)}`;
}

// Generate transaction reference
export function generateTransactionRef(): string {
  const timestamp = Date.now();
  const random = generateRandomString(6);
  return `TXN${timestamp}${random}`;
}

// Generate verification code (4-digit)
export function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
