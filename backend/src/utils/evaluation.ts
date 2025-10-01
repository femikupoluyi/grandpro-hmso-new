// Evaluation utilities for scoring applications

// Calculate weighted evaluation score
export function calculateEvaluationScore(scores: {
  facilityScore: number;
  staffingScore: number;
  equipmentScore: number;
  complianceScore: number;
  financialScore: number;
  locationScore: number;
  servicesScore: number;
  reputationScore: number;
}): number {
  // Define weights for each category (total = 1.0)
  const weights = {
    facility: 0.15,
    staffing: 0.15,
    equipment: 0.15,
    compliance: 0.20,
    financial: 0.10,
    location: 0.10,
    services: 0.10,
    reputation: 0.05,
  };

  // Calculate weighted score
  const weightedScore =
    scores.facilityScore * weights.facility +
    scores.staffingScore * weights.staffing +
    scores.equipmentScore * weights.equipment +
    scores.complianceScore * weights.compliance +
    scores.financialScore * weights.financial +
    scores.locationScore * weights.location +
    scores.servicesScore * weights.services +
    scores.reputationScore * weights.reputation;

  // Round to 2 decimal places
  return Math.round(weightedScore * 100) / 100;
}

// Get recommendation based on score
export function getRecommendation(score: number): string {
  if (score >= 80) return 'HIGHLY_RECOMMENDED';
  if (score >= 65) return 'RECOMMENDED';
  if (score >= 50) return 'CONDITIONAL';
  if (score >= 35) return 'NOT_RECOMMENDED';
  return 'REJECTED';
}

// Get risk level based on score
export function getRiskLevel(score: number): string {
  if (score >= 75) return 'LOW';
  if (score >= 50) return 'MEDIUM';
  if (score >= 25) return 'HIGH';
  return 'CRITICAL';
}

// Calculate facility score based on criteria
export function calculateFacilityScore(criteria: {
  bedCapacity?: number;
  hasEmergencyServices?: boolean;
  hasPharmacy?: boolean;
  hasLaboratory?: boolean;
  hasImaging?: boolean;
  buildingAge?: number;
  lastRenovation?: string;
  parkingSpaces?: number;
}): number {
  let score = 0;

  // Bed capacity scoring (max 30 points)
  if (criteria.bedCapacity) {
    if (criteria.bedCapacity >= 200) score += 30;
    else if (criteria.bedCapacity >= 100) score += 25;
    else if (criteria.bedCapacity >= 50) score += 20;
    else if (criteria.bedCapacity >= 20) score += 15;
    else score += 10;
  }

  // Essential services (max 40 points)
  if (criteria.hasEmergencyServices) score += 15;
  if (criteria.hasPharmacy) score += 10;
  if (criteria.hasLaboratory) score += 10;
  if (criteria.hasImaging) score += 5;

  // Building condition (max 20 points)
  if (criteria.buildingAge) {
    if (criteria.buildingAge <= 5) score += 20;
    else if (criteria.buildingAge <= 10) score += 15;
    else if (criteria.buildingAge <= 20) score += 10;
    else score += 5;
  }

  // Additional amenities (max 10 points)
  if (criteria.parkingSpaces) {
    if (criteria.parkingSpaces >= 50) score += 10;
    else if (criteria.parkingSpaces >= 20) score += 5;
  }

  return Math.min(score, 100);
}

// Calculate staffing score
export function calculateStaffingScore(criteria: {
  totalStaff?: number;
  doctors?: number;
  nurses?: number;
  specialists?: number;
  supportStaff?: number;
  bedCapacity?: number;
}): number {
  let score = 0;

  // Total staff count (max 30 points)
  if (criteria.totalStaff) {
    if (criteria.totalStaff >= 100) score += 30;
    else if (criteria.totalStaff >= 50) score += 25;
    else if (criteria.totalStaff >= 25) score += 20;
    else if (criteria.totalStaff >= 10) score += 15;
    else score += 10;
  }

  // Medical staff composition (max 40 points)
  if (criteria.doctors) {
    if (criteria.doctors >= 20) score += 20;
    else if (criteria.doctors >= 10) score += 15;
    else if (criteria.doctors >= 5) score += 10;
    else score += 5;
  }

  if (criteria.nurses) {
    if (criteria.nurses >= 30) score += 20;
    else if (criteria.nurses >= 15) score += 15;
    else if (criteria.nurses >= 8) score += 10;
    else score += 5;
  }

  // Staff to bed ratio (max 30 points)
  if (criteria.totalStaff && criteria.bedCapacity) {
    const ratio = criteria.totalStaff / criteria.bedCapacity;
    if (ratio >= 3) score += 30;
    else if (ratio >= 2) score += 20;
    else if (ratio >= 1) score += 10;
  }

  return Math.min(score, 100);
}

// Calculate equipment score
export function calculateEquipmentScore(criteria: {
  hasXRay?: boolean;
  hasCTScan?: boolean;
  hasMRI?: boolean;
  hasUltrasound?: boolean;
  hasECG?: boolean;
  hasVentilator?: boolean;
  hasDialysis?: boolean;
  hasICU?: boolean;
  equipmentAge?: number;
}): number {
  let score = 0;

  // Basic equipment (max 40 points)
  if (criteria.hasXRay) score += 10;
  if (criteria.hasUltrasound) score += 10;
  if (criteria.hasECG) score += 10;
  if (criteria.hasVentilator) score += 10;

  // Advanced equipment (max 40 points)
  if (criteria.hasCTScan) score += 15;
  if (criteria.hasMRI) score += 15;
  if (criteria.hasDialysis) score += 10;

  // Critical care capabilities (max 20 points)
  if (criteria.hasICU) score += 20;

  // Equipment age penalty
  if (criteria.equipmentAge && criteria.equipmentAge > 10) {
    score = Math.max(0, score - 10);
  }

  return Math.min(score, 100);
}

// Calculate compliance score
export function calculateComplianceScore(criteria: {
  hasCAC?: boolean;
  hasTaxClearance?: boolean;
  hasMedicalLicense?: boolean;
  hasFacilityLicense?: boolean;
  hasFireSafety?: boolean;
  hasEnvironmentalPermit?: boolean;
  hasInsurance?: boolean;
  hasNHISRegistration?: boolean;
  documentsVerified?: number;
  totalDocuments?: number;
}): number {
  let score = 0;

  // Critical documents (max 60 points)
  if (criteria.hasCAC) score += 15;
  if (criteria.hasTaxClearance) score += 15;
  if (criteria.hasMedicalLicense) score += 15;
  if (criteria.hasFacilityLicense) score += 15;

  // Additional compliance (max 40 points)
  if (criteria.hasFireSafety) score += 10;
  if (criteria.hasEnvironmentalPermit) score += 10;
  if (criteria.hasInsurance) score += 10;
  if (criteria.hasNHISRegistration) score += 10;

  // Document verification rate bonus
  if (criteria.documentsVerified && criteria.totalDocuments) {
    const verificationRate = criteria.documentsVerified / criteria.totalDocuments;
    if (verificationRate === 1) score += 10;
    else if (verificationRate >= 0.8) score += 5;
  }

  return Math.min(score, 100);
}

// Calculate financial score
export function calculateFinancialScore(criteria: {
  expectedRevenue?: number;
  yearsInOperation?: number;
  hasBankAccount?: boolean;
  hasFinancialStatements?: boolean;
  hasBusinessPlan?: boolean;
  debtToEquityRatio?: number;
  profitMargin?: number;
}): number {
  let score = 0;

  // Revenue expectations (max 30 points)
  if (criteria.expectedRevenue) {
    const revenue = criteria.expectedRevenue;
    if (revenue >= 500000000) score += 30; // 500M+ NGN
    else if (revenue >= 200000000) score += 25; // 200M+ NGN
    else if (revenue >= 100000000) score += 20; // 100M+ NGN
    else if (revenue >= 50000000) score += 15; // 50M+ NGN
    else if (revenue >= 10000000) score += 10; // 10M+ NGN
    else score += 5;
  }

  // Experience (max 20 points)
  if (criteria.yearsInOperation) {
    if (criteria.yearsInOperation >= 10) score += 20;
    else if (criteria.yearsInOperation >= 5) score += 15;
    else if (criteria.yearsInOperation >= 3) score += 10;
    else if (criteria.yearsInOperation >= 1) score += 5;
  }

  // Financial documentation (max 30 points)
  if (criteria.hasBankAccount) score += 10;
  if (criteria.hasFinancialStatements) score += 10;
  if (criteria.hasBusinessPlan) score += 10;

  // Financial health indicators (max 20 points)
  if (criteria.profitMargin) {
    if (criteria.profitMargin >= 20) score += 10;
    else if (criteria.profitMargin >= 10) score += 5;
  }

  if (criteria.debtToEquityRatio) {
    if (criteria.debtToEquityRatio <= 0.5) score += 10;
    else if (criteria.debtToEquityRatio <= 1) score += 5;
  }

  return Math.min(score, 100);
}

// Calculate location score
export function calculateLocationScore(criteria: {
  state?: string;
  isUrban?: boolean;
  populationDensity?: number;
  nearestHospitalDistance?: number;
  accessibilityScore?: number;
}): number {
  let score = 0;

  // Priority states (underserved areas get higher scores)
  const priorityStates = ['Borno', 'Yobe', 'Adamawa', 'Zamfara', 'Katsina', 'Sokoto'];
  const highDemandStates = ['Lagos', 'FCT', 'Rivers', 'Kano', 'Ogun', 'Kaduna'];
  const moderateStates = ['Oyo', 'Edo', 'Delta', 'Anambra', 'Imo', 'Enugu'];

  if (criteria.state) {
    if (priorityStates.includes(criteria.state)) {
      score += 40; // Highest priority for underserved areas
    } else if (highDemandStates.includes(criteria.state)) {
      score += 30;
    } else if (moderateStates.includes(criteria.state)) {
      score += 20;
    } else {
      score += 25; // Other states
    }
  }

  // Urban vs Rural (max 20 points)
  if (criteria.isUrban !== undefined) {
    score += criteria.isUrban ? 10 : 20; // Rural areas get more points
  }

  // Population density consideration (max 20 points)
  if (criteria.populationDensity) {
    if (criteria.populationDensity >= 1000) score += 20;
    else if (criteria.populationDensity >= 500) score += 15;
    else if (criteria.populationDensity >= 200) score += 10;
    else score += 5;
  }

  // Distance from nearest hospital (max 20 points)
  if (criteria.nearestHospitalDistance) {
    if (criteria.nearestHospitalDistance >= 20) score += 20; // 20+ km away
    else if (criteria.nearestHospitalDistance >= 10) score += 15;
    else if (criteria.nearestHospitalDistance >= 5) score += 10;
    else score += 5;
  }

  return Math.min(score, 100);
}

// Calculate services score
export function calculateServicesScore(criteria: {
  specializations?: string[];
  hasEmergency?: boolean;
  hasMaternity?: boolean;
  hasPediatrics?: boolean;
  hasSurgery?: boolean;
  hasICU?: boolean;
  hasOutpatient?: boolean;
  hasInpatient?: boolean;
  hasTelemedicine?: boolean;
}): number {
  let score = 0;

  // Specialization diversity (max 40 points)
  if (criteria.specializations) {
    const count = criteria.specializations.length;
    if (count >= 10) score += 40;
    else if (count >= 7) score += 30;
    else if (count >= 5) score += 20;
    else if (count >= 3) score += 10;
    else if (count >= 1) score += 5;
  }

  // Essential services (max 60 points)
  if (criteria.hasEmergency) score += 15;
  if (criteria.hasMaternity) score += 10;
  if (criteria.hasPediatrics) score += 10;
  if (criteria.hasSurgery) score += 10;
  if (criteria.hasICU) score += 10;
  if (criteria.hasOutpatient) score += 5;
  if (criteria.hasInpatient) score += 5;

  // Modern services bonus
  if (criteria.hasTelemedicine) score += 5;

  return Math.min(score, 100);
}
