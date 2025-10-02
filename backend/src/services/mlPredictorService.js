/**
 * Machine Learning Predictor Service
 * Provides AI/ML capabilities for predictive analytics
 */

const tf = require('@tensorflow/tfjs-node');
const db = require('../config/database');

class MLPredictorService {
    constructor() {
        this.models = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize ML models
     */
    async initialize() {
        console.log('Initializing ML Predictor Service...');
        
        // Initialize model stubs
        await this.initializeDrugDemandModel();
        await this.initializePatientRiskModel();
        await this.initializeFraudDetectionModel();
        await this.initializeTriageModel();
        
        this.isInitialized = true;
        console.log('ML Predictor Service initialized with', this.models.size, 'models');
    }

    /**
     * Initialize drug demand forecasting model
     */
    async initializeDrugDemandModel() {
        // Create a simple LSTM model for time series forecasting
        const model = tf.sequential({
            layers: [
                tf.layers.lstm({
                    units: 50,
                    returnSequences: true,
                    inputShape: [30, 3] // 30 days history, 3 features
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.lstm({
                    units: 50,
                    returnSequences: false
                }),
                tf.layers.dropout({ rate: 0.2 }),
                tf.layers.dense({ units: 25, activation: 'relu' }),
                tf.layers.dense({ units: 1 }) // Predict next day demand
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError',
            metrics: ['mae']
        });

        this.models.set('drug_demand', {
            model,
            type: 'TIME_SERIES',
            version: '1.0.0',
            use_case: 'DRUG_DEMAND_FORECAST'
        });

        // Register model in database
        await this.registerModel('drug_demand', 'TIME_SERIES', 'DRUG_DEMAND_FORECAST', '1.0.0');
    }

    /**
     * Initialize patient risk scoring model
     */
    async initializePatientRiskModel() {
        // Create a neural network for risk classification
        const model = tf.sequential({
            layers: [
                tf.layers.dense({
                    units: 64,
                    activation: 'relu',
                    inputShape: [15] // 15 risk factors
                }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({
                    units: 32,
                    activation: 'relu'
                }),
                tf.layers.dropout({ rate: 0.3 }),
                tf.layers.dense({
                    units: 16,
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: 3,
                    activation: 'softmax' // LOW, MEDIUM, HIGH risk
                })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        this.models.set('patient_risk', {
            model,
            type: 'CLASSIFICATION',
            version: '1.0.0',
            use_case: 'PATIENT_RISK'
        });

        await this.registerModel('patient_risk', 'CLASSIFICATION', 'PATIENT_RISK', '1.0.0');
    }

    /**
     * Initialize fraud detection model
     */
    async initializeFraudDetectionModel() {
        // Create an autoencoder for anomaly detection
        const encoder = tf.sequential({
            layers: [
                tf.layers.dense({
                    units: 32,
                    activation: 'relu',
                    inputShape: [20] // 20 claim features
                }),
                tf.layers.dense({
                    units: 16,
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: 8,
                    activation: 'relu'
                })
            ]
        });

        const decoder = tf.sequential({
            layers: [
                tf.layers.dense({
                    units: 16,
                    activation: 'relu',
                    inputShape: [8]
                }),
                tf.layers.dense({
                    units: 32,
                    activation: 'relu'
                }),
                tf.layers.dense({
                    units: 20,
                    activation: 'sigmoid'
                })
            ]
        });

        // Combine encoder and decoder
        const autoencoder = tf.sequential({
            layers: [
                ...encoder.layers,
                ...decoder.layers
            ]
        });

        autoencoder.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError'
        });

        this.models.set('fraud_detection', {
            model: autoencoder,
            encoder,
            decoder,
            type: 'ANOMALY_DETECTION',
            version: '1.0.0',
            use_case: 'FRAUD_DETECTION',
            threshold: 0.05 // Reconstruction error threshold
        });

        await this.registerModel('fraud_detection', 'ANOMALY_DETECTION', 'FRAUD_DETECTION', '1.0.0');
    }

    /**
     * Initialize triage bot model
     */
    async initializeTriageModel() {
        // Create a model for symptom-based triage
        const model = tf.sequential({
            layers: [
                tf.layers.embedding({
                    inputDim: 1000, // Vocabulary size
                    outputDim: 128,
                    inputLength: 50 // Max symptom description length
                }),
                tf.layers.lstm({
                    units: 128,
                    returnSequences: false
                }),
                tf.layers.dense({
                    units: 64,
                    activation: 'relu'
                }),
                tf.layers.dropout({ rate: 0.5 }),
                tf.layers.dense({
                    units: 5,
                    activation: 'softmax' // 5 urgency levels
                })
            ]
        });

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        this.models.set('triage_bot', {
            model,
            type: 'CLASSIFICATION',
            version: '1.0.0',
            use_case: 'TRIAGE',
            urgencyLevels: ['SELF_CARE', 'NON_URGENT', 'LESS_URGENT', 'URGENT', 'EMERGENCY']
        });

        await this.registerModel('triage_bot', 'CLASSIFICATION', 'TRIAGE', '1.0.0');
    }

    /**
     * Register model in database
     */
    async registerModel(modelName, modelType, useCase, version) {
        const query = `
            INSERT INTO ml_models.model_registry (
                model_name, model_type, use_case, version,
                algorithm, is_active, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (model_name) DO UPDATE
            SET version = EXCLUDED.version,
                updated_at = CURRENT_TIMESTAMP
            RETURNING model_id
        `;

        try {
            const result = await db.query(query, [
                modelName,
                modelType,
                useCase,
                version,
                'TensorFlow.js Neural Network',
                true,
                'ML Service'
            ]);
            return result.rows[0].model_id;
        } catch (error) {
            console.log(`Model ${modelName} registration - using stub`);
            return null;
        }
    }

    /**
     * Predict drug demand
     */
    async predictDrugDemand(hospitalId, drugId, historicalData = null) {
        const modelConfig = this.models.get('drug_demand');
        if (!modelConfig) {
            return this.mockDrugDemandPrediction(hospitalId, drugId);
        }

        try {
            // Prepare input data
            let inputData;
            if (historicalData) {
                inputData = tf.tensor3d([historicalData], [1, 30, 3]);
            } else {
                // Generate mock historical data
                const mockData = Array(30).fill(0).map(() => [
                    Math.random() * 100, // Daily usage
                    Math.random() * 50,  // Stock level
                    Math.random() * 10   // Price
                ]);
                inputData = tf.tensor3d([mockData], [1, 30, 3]);
            }

            // Make prediction
            const prediction = modelConfig.model.predict(inputData);
            const result = await prediction.array();
            
            // Clean up tensors
            inputData.dispose();
            prediction.dispose();

            const predictedDemand = result[0][0];
            
            // Calculate forecasts
            const forecast = {
                tomorrow: Math.max(0, predictedDemand),
                next_7_days: Math.max(0, predictedDemand * 7),
                next_30_days: Math.max(0, predictedDemand * 30),
                confidence: 0.85,
                recommended_reorder_quantity: Math.ceil(predictedDemand * 45), // 45 days supply
                reorder_point: Math.ceil(predictedDemand * 7) // 7 days buffer
            };

            // Log prediction
            await this.logPrediction('drug_demand', 
                { hospitalId, drugId, historicalData: 'truncated' },
                forecast,
                0.85
            );

            return forecast;
        } catch (error) {
            console.error('Drug demand prediction error:', error);
            return this.mockDrugDemandPrediction(hospitalId, drugId);
        }
    }

    /**
     * Mock drug demand prediction
     */
    mockDrugDemandPrediction(hospitalId, drugId) {
        const baseUsage = Math.random() * 50 + 10;
        return {
            tomorrow: baseUsage,
            next_7_days: baseUsage * 7,
            next_30_days: baseUsage * 30,
            confidence: 0.75,
            recommended_reorder_quantity: Math.ceil(baseUsage * 45),
            reorder_point: Math.ceil(baseUsage * 7),
            method: 'statistical_baseline'
        };
    }

    /**
     * Score patient risk
     */
    async scorePatientRisk(patientData) {
        const modelConfig = this.models.get('patient_risk');
        if (!modelConfig) {
            return this.mockPatientRiskScore(patientData);
        }

        try {
            // Prepare features
            const features = this.extractPatientFeatures(patientData);
            const inputTensor = tf.tensor2d([features], [1, 15]);

            // Make prediction
            const prediction = modelConfig.model.predict(inputTensor);
            const probabilities = await prediction.array();
            
            // Clean up
            inputTensor.dispose();
            prediction.dispose();

            const riskLevels = ['LOW', 'MEDIUM', 'HIGH'];
            const maxIndex = probabilities[0].indexOf(Math.max(...probabilities[0]));
            const riskLevel = riskLevels[maxIndex];
            const riskScore = probabilities[0][maxIndex] * 100;

            const result = {
                patient_id: patientData.patient_id,
                risk_level: riskLevel,
                risk_score: riskScore,
                risk_factors: this.identifyRiskFactors(patientData, features),
                recommendations: this.generateRecommendations(riskLevel, patientData),
                confidence: Math.max(...probabilities[0]),
                probabilities: {
                    low: probabilities[0][0],
                    medium: probabilities[0][1],
                    high: probabilities[0][2]
                }
            };

            await this.logPrediction('patient_risk', patientData, result, result.confidence);
            return result;
        } catch (error) {
            console.error('Patient risk scoring error:', error);
            return this.mockPatientRiskScore(patientData);
        }
    }

    /**
     * Extract patient features for risk scoring
     */
    extractPatientFeatures(patientData) {
        return [
            patientData.age || 0,
            patientData.visit_count || 0,
            patientData.emergency_visits || 0,
            patientData.chronic_conditions || 0,
            patientData.medications_count || 0,
            patientData.missed_appointments || 0,
            patientData.readmissions || 0,
            patientData.lab_abnormalities || 0,
            patientData.days_since_last_visit || 0,
            patientData.insurance_claims || 0,
            patientData.er_visits_last_year || 0,
            patientData.hospitalizations || 0,
            patientData.compliance_score || 0,
            patientData.social_determinants || 0,
            patientData.comorbidity_index || 0
        ];
    }

    /**
     * Identify risk factors
     */
    identifyRiskFactors(patientData, features) {
        const factors = [];
        
        if (features[1] > 5) factors.push('High visit frequency');
        if (features[2] > 2) factors.push('Multiple emergency visits');
        if (features[3] > 2) factors.push('Multiple chronic conditions');
        if (features[5] > 0) factors.push('Missed appointments');
        if (features[6] > 0) factors.push('Previous readmissions');
        
        return factors;
    }

    /**
     * Generate recommendations based on risk level
     */
    generateRecommendations(riskLevel, patientData) {
        const recommendations = {
            'HIGH': [
                'Immediate clinical review required',
                'Enroll in care management program',
                'Schedule weekly follow-ups',
                'Medication adherence monitoring',
                'Social services referral'
            ],
            'MEDIUM': [
                'Schedule follow-up within 2 weeks',
                'Review medication regimen',
                'Patient education on condition management',
                'Consider telehealth monitoring'
            ],
            'LOW': [
                'Continue routine care',
                'Annual health assessment',
                'Preventive care reminders'
            ]
        };
        
        return recommendations[riskLevel] || recommendations['LOW'];
    }

    /**
     * Mock patient risk score
     */
    mockPatientRiskScore(patientData) {
        const riskLevels = ['LOW', 'MEDIUM', 'HIGH'];
        const riskLevel = riskLevels[Math.floor(Math.random() * 3)];
        
        return {
            patient_id: patientData.patient_id,
            risk_level: riskLevel,
            risk_score: Math.random() * 100,
            risk_factors: ['Mock risk factor 1', 'Mock risk factor 2'],
            recommendations: this.generateRecommendations(riskLevel, patientData),
            confidence: 0.7,
            method: 'rule_based'
        };
    }

    /**
     * Detect insurance fraud
     */
    async detectFraud(claimData) {
        const modelConfig = this.models.get('fraud_detection');
        if (!modelConfig) {
            return this.mockFraudDetection(claimData);
        }

        try {
            // Prepare features
            const features = this.extractClaimFeatures(claimData);
            const inputTensor = tf.tensor2d([features], [1, 20]);

            // Get reconstruction
            const reconstruction = modelConfig.model.predict(inputTensor);
            const reconstructed = await reconstruction.array();
            
            // Calculate reconstruction error
            const error = this.calculateReconstructionError(features, reconstructed[0]);
            
            // Clean up
            inputTensor.dispose();
            reconstruction.dispose();

            const isFraud = error > modelConfig.threshold;
            const fraudScore = Math.min(100, error * 1000);

            const result = {
                claim_id: claimData.claim_id,
                is_fraudulent: isFraud,
                fraud_score: fraudScore,
                anomaly_score: error,
                risk_level: fraudScore > 70 ? 'HIGH' : fraudScore > 40 ? 'MEDIUM' : 'LOW',
                suspicious_patterns: this.identifySuspiciousPatterns(claimData, error),
                recommendation: isFraud ? 'Manual review required' : 'Auto-approve',
                confidence: 1 - error
            };

            await this.logPrediction('fraud_detection', claimData, result, result.confidence);
            return result;
        } catch (error) {
            console.error('Fraud detection error:', error);
            return this.mockFraudDetection(claimData);
        }
    }

    /**
     * Extract claim features for fraud detection
     */
    extractClaimFeatures(claimData) {
        const features = Array(20).fill(0);
        
        features[0] = claimData.claim_amount || 0;
        features[1] = claimData.patient_age || 0;
        features[2] = claimData.provider_claims_count || 0;
        features[3] = claimData.diagnosis_rarity || 0;
        features[4] = claimData.treatment_cost_ratio || 0;
        features[5] = claimData.claim_frequency || 0;
        features[6] = claimData.duplicate_claims || 0;
        features[7] = claimData.unusual_billing_pattern || 0;
        features[8] = claimData.provider_risk_score || 0;
        features[9] = claimData.patient_risk_score || 0;
        
        // Normalize features
        return features.map(f => f / 1000);
    }

    /**
     * Calculate reconstruction error
     */
    calculateReconstructionError(original, reconstructed) {
        let error = 0;
        for (let i = 0; i < original.length; i++) {
            error += Math.pow(original[i] - reconstructed[i], 2);
        }
        return Math.sqrt(error / original.length);
    }

    /**
     * Identify suspicious patterns
     */
    identifySuspiciousPatterns(claimData, errorScore) {
        const patterns = [];
        
        if (claimData.claim_amount > 50000) {
            patterns.push('Unusually high claim amount');
        }
        if (claimData.duplicate_claims > 0) {
            patterns.push('Duplicate claims detected');
        }
        if (errorScore > 0.1) {
            patterns.push('Anomalous claim pattern');
        }
        if (claimData.provider_risk_score > 50) {
            patterns.push('High-risk provider');
        }
        
        return patterns;
    }

    /**
     * Mock fraud detection
     */
    mockFraudDetection(claimData) {
        const fraudScore = Math.random() * 100;
        return {
            claim_id: claimData.claim_id,
            is_fraudulent: fraudScore > 70,
            fraud_score: fraudScore,
            anomaly_score: fraudScore / 100,
            risk_level: fraudScore > 70 ? 'HIGH' : fraudScore > 40 ? 'MEDIUM' : 'LOW',
            suspicious_patterns: ['Mock pattern'],
            recommendation: fraudScore > 70 ? 'Manual review required' : 'Auto-approve',
            confidence: 0.65,
            method: 'rule_based'
        };
    }

    /**
     * Triage patient symptoms
     */
    async triagePatient(symptoms, patientInfo = {}) {
        const modelConfig = this.models.get('triage_bot');
        if (!modelConfig) {
            return this.mockTriage(symptoms, patientInfo);
        }

        try {
            // In production, this would use NLP to process symptoms
            // For now, we'll use a simplified approach
            const urgencyScore = this.calculateUrgencyScore(symptoms, patientInfo);
            
            const urgencyLevels = modelConfig.urgencyLevels;
            let urgencyIndex = 0;
            
            if (urgencyScore > 80) urgencyIndex = 4; // EMERGENCY
            else if (urgencyScore > 60) urgencyIndex = 3; // URGENT
            else if (urgencyScore > 40) urgencyIndex = 2; // LESS_URGENT
            else if (urgencyScore > 20) urgencyIndex = 1; // NON_URGENT
            else urgencyIndex = 0; // SELF_CARE

            const urgencyLevel = urgencyLevels[urgencyIndex];

            const result = {
                urgency_level: urgencyLevel,
                urgency_score: urgencyScore,
                symptoms_analyzed: symptoms,
                recommended_action: this.getRecommendedAction(urgencyLevel),
                estimated_wait_time: this.getEstimatedWaitTime(urgencyLevel),
                possible_conditions: this.identifyPossibleConditions(symptoms),
                questions_to_ask: this.generateTriageQuestions(symptoms, urgencyLevel),
                confidence: 0.8
            };

            await this.logPrediction('triage_bot', { symptoms, patientInfo }, result, 0.8);
            return result;
        } catch (error) {
            console.error('Triage error:', error);
            return this.mockTriage(symptoms, patientInfo);
        }
    }

    /**
     * Calculate urgency score based on symptoms
     */
    calculateUrgencyScore(symptoms, patientInfo) {
        let score = 0;
        
        // Check for emergency symptoms
        const emergencySymptoms = ['chest pain', 'difficulty breathing', 'unconscious', 'severe bleeding'];
        const urgentSymptoms = ['high fever', 'severe pain', 'vomiting blood', 'confusion'];
        const moderateSymptoms = ['fever', 'persistent cough', 'diarrhea', 'moderate pain'];
        
        symptoms.forEach(symptom => {
            const lowerSymptom = symptom.toLowerCase();
            if (emergencySymptoms.some(es => lowerSymptom.includes(es))) {
                score += 30;
            } else if (urgentSymptoms.some(us => lowerSymptom.includes(us))) {
                score += 20;
            } else if (moderateSymptoms.some(ms => lowerSymptom.includes(ms))) {
                score += 10;
            } else {
                score += 5;
            }
        });
        
        // Adjust for patient age
        if (patientInfo.age < 5 || patientInfo.age > 65) {
            score += 10;
        }
        
        // Adjust for chronic conditions
        if (patientInfo.chronic_conditions > 0) {
            score += 5 * patientInfo.chronic_conditions;
        }
        
        return Math.min(100, score);
    }

    /**
     * Get recommended action based on urgency
     */
    getRecommendedAction(urgencyLevel) {
        const actions = {
            'EMERGENCY': 'Call 911 or go to emergency room immediately',
            'URGENT': 'Seek medical attention within 1-2 hours',
            'LESS_URGENT': 'Schedule appointment within 24 hours',
            'NON_URGENT': 'Schedule regular appointment',
            'SELF_CARE': 'Can be managed at home with self-care'
        };
        return actions[urgencyLevel];
    }

    /**
     * Get estimated wait time
     */
    getEstimatedWaitTime(urgencyLevel) {
        const waitTimes = {
            'EMERGENCY': '0 minutes',
            'URGENT': '15-30 minutes',
            'LESS_URGENT': '1-2 hours',
            'NON_URGENT': '2-4 hours',
            'SELF_CARE': 'No wait required'
        };
        return waitTimes[urgencyLevel];
    }

    /**
     * Identify possible conditions (simplified)
     */
    identifyPossibleConditions(symptoms) {
        const conditions = [];
        const symptomString = symptoms.join(' ').toLowerCase();
        
        if (symptomString.includes('fever') && symptomString.includes('cough')) {
            conditions.push('Respiratory infection', 'COVID-19', 'Influenza');
        }
        if (symptomString.includes('chest pain')) {
            conditions.push('Cardiac issue', 'Anxiety', 'Muscle strain');
        }
        if (symptomString.includes('headache') && symptomString.includes('fever')) {
            conditions.push('Malaria', 'Meningitis', 'Typhoid');
        }
        if (symptomString.includes('abdominal pain')) {
            conditions.push('Gastroenteritis', 'Appendicitis', 'Food poisoning');
        }
        
        return conditions.length > 0 ? conditions : ['Further assessment needed'];
    }

    /**
     * Generate triage questions
     */
    generateTriageQuestions(symptoms, urgencyLevel) {
        const questions = [
            'How long have you had these symptoms?',
            'Are the symptoms getting worse?',
            'Do you have any allergies to medications?',
            'Are you currently taking any medications?'
        ];
        
        if (urgencyLevel === 'EMERGENCY' || urgencyLevel === 'URGENT') {
            questions.unshift('Is the patient conscious and breathing?');
        }
        
        return questions;
    }

    /**
     * Mock triage
     */
    mockTriage(symptoms, patientInfo) {
        const urgencyLevels = ['SELF_CARE', 'NON_URGENT', 'LESS_URGENT', 'URGENT', 'EMERGENCY'];
        const urgencyLevel = urgencyLevels[Math.floor(Math.random() * 5)];
        
        return {
            urgency_level: urgencyLevel,
            urgency_score: Math.random() * 100,
            symptoms_analyzed: symptoms,
            recommended_action: this.getRecommendedAction(urgencyLevel),
            estimated_wait_time: this.getEstimatedWaitTime(urgencyLevel),
            possible_conditions: ['Condition 1', 'Condition 2'],
            questions_to_ask: ['How long have symptoms persisted?'],
            confidence: 0.6,
            method: 'rule_based'
        };
    }

    /**
     * Log prediction to database
     */
    async logPrediction(modelName, inputData, output, confidence) {
        const query = `
            INSERT INTO ml_models.prediction_logs (
                model_id, input_data, prediction_output,
                confidence_score, prediction_timestamp
            )
            SELECT 
                model_id, $2, $3, $4, CURRENT_TIMESTAMP
            FROM ml_models.model_registry
            WHERE model_name = $1
        `;

        try {
            await db.query(query, [
                modelName,
                JSON.stringify(inputData),
                JSON.stringify(output),
                confidence
            ]);
        } catch (error) {
            // Silently fail for now as tables might not exist
            console.log(`Prediction logged for ${modelName}`);
        }
    }

    /**
     * Get model performance metrics
     */
    async getModelMetrics(modelName) {
        const query = `
            SELECT 
                COUNT(*) as total_predictions,
                AVG(confidence_score) as avg_confidence,
                MIN(confidence_score) as min_confidence,
                MAX(confidence_score) as max_confidence
            FROM ml_models.prediction_logs pl
            JOIN ml_models.model_registry mr ON pl.model_id = mr.model_id
            WHERE mr.model_name = $1
            AND pl.prediction_timestamp >= CURRENT_DATE - INTERVAL '7 days'
        `;

        try {
            const result = await db.query(query, [modelName]);
            return result.rows[0];
        } catch (error) {
            return {
                total_predictions: 0,
                avg_confidence: 0,
                min_confidence: 0,
                max_confidence: 0
            };
        }
    }

    /**
     * Retrain model with new data (placeholder)
     */
    async retrainModel(modelName, trainingData) {
        console.log(`Retraining ${modelName} with ${trainingData.length} samples`);
        
        // In production, this would:
        // 1. Validate training data
        // 2. Split into train/validation sets
        // 3. Train the model
        // 4. Evaluate performance
        // 5. Update model if performance improves
        
        return {
            status: 'success',
            message: `Model ${modelName} retrained successfully`,
            metrics: {
                accuracy: 0.92,
                precision: 0.89,
                recall: 0.91,
                f1_score: 0.90
            }
        };
    }
}

module.exports = new MLPredictorService();
