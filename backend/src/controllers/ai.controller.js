import asyncHandler from 'express-async-handler';
import { evaluateRisk, generateTimeline, detectEpidemic } from '../services/ai.service.js';
import * as alertService from '../services/alert.service.js';
import Patient from '../models/Patient.js';
import { SEVERITY } from '../config/constants.js';

/**
 * @desc    Analyze patient symptoms and checkup data using AI
 * @route   POST /ai/risk-assessment
 * @access  Public (in hackathon context)
 */
export const analyzeRisk = asyncHandler(async (req, res) => {
    const { bp, weight, bloodSugar, symptoms, otherFactors, patientId } = req.body;

    console.log(`[DEBUG] analyzeRisk - Body:`, req.body);

    // Call the AI Service
    const aiResult = await evaluateRisk({ bp, weight, bloodSugar, symptoms, otherFactors });

    console.log(`[DEBUG] analyzeRisk - AI Result:`, aiResult);

    let updatedPatientMsg = null;
    let alertCreatedMsg = null;

    // Normalize risk level check (ULTRA Case insensitive + TRIM)
    const riskRaw = String(aiResult.riskLevel || 'LOW');
    const risk = riskRaw.toUpperCase().trim();
    
    // We trigger alerts for HIGH, CRITICAL, MODERATE, or MEDIUM
    const isHigh = risk.includes('HIGH') || risk.includes('CRITICAL');
    const isModerate = risk.includes('MODERATE') || risk.includes('MEDIUM');

    console.log(`[DEBUG] Final Normalized Risk: "${risk}" | isHigh: ${isHigh} | isModerate: ${isModerate}`);

    // Update patient if patientId exists
    if (patientId && patientId !== null && patientId !== '') {
        try {
            const patient = await Patient.findById(patientId);
            if (patient) {
                patient.currentRiskLevel = aiResult.riskLevel; 
                await patient.save();
                updatedPatientMsg = `Patient ${patient.name}'s risk level updated to ${patient.currentRiskLevel}.`;
            }
        } catch (e) {
            console.error(`[DEBUG] Error updating patient risk: ${e.message}`);
        }
    }

    // CREATE ALERT CORE LOGIC
    if (isHigh || isModerate) {
        try {
            console.log(`[DEBUG] Triggering Alert Generation for ${risk}...`);
            const alertData = {
                ashaId: req.user?._id,
                type: isHigh ? 'HIGH_RISK_ALERT' : 'MODERATE_RISK_ALERT',
                message: `⚠️ AI ALERT: ${risk} detected! Condition: ${aiResult.possibleCondition}. Advice: ${aiResult.adviceForAshaWorker}`,
                severity: isHigh ? SEVERITY.HIGH : SEVERITY.MEDIUM,
            };

            // If we have a patient, link it
            if (patientId) alertData.patientId = patientId;

            const newAlert = await alertService.createAlert(alertData);
            alertCreatedMsg = `Successfully saved ${alertData.type} (ID: ${newAlert._id})`;
            console.log(`[DEBUG] Alert Created: ${newAlert._id}`);
        } catch (alertError) {
            console.error(`[DEBUG] FAILED to create alert:`, alertError);
            alertCreatedMsg = `Alert creation failed: ${alertError.message}`;
        }
    }

    if (!alertCreatedMsg) {
        console.log(`[DEBUG] Logic finished. No alert created. (isHigh: ${isHigh}, isMod: ${isModerate})`);
        alertCreatedMsg = `No alert triggered (Risk: ${risk})`;
    }

    res.status(200).json({
        success: true,
        data: aiResult,
        message: updatedPatientMsg,
        alert: alertCreatedMsg
    });
});

/**
 * @desc    Generate a pregnancy timeline based on patient age and conditions
 * @route   POST /ai/timeline
 * @access  Public (in hackathon context)
 */
export const getTimeline = asyncHandler(async (req, res) => {
    const { age, lmp, conditions, currentMonth } = req.body;

    if (!age && !currentMonth) {
        res.status(400);
        throw new Error("Please provide at least age and currentMonth for a timeline.");
    }

    const timelineData = await generateTimeline({ age, lmp, conditions, currentMonth });

    res.status(200).json({
        success: true,
        data: timelineData
    });
});

/**
 * @desc    Analyze aggregated region data for epidemics or malnutrition
 * @route   POST /ai/epidemic-alerts
 * @access  Public (in hackathon context)
 */
export const getEpidemicAlerts = asyncHandler(async (req, res) => {
    const { aggregatedDataText } = req.body;

    if (!aggregatedDataText) {
        res.status(400);
        throw new Error("Please provide 'aggregatedDataText' representing recent health checkups.");
    }

    const alertResult = await detectEpidemic(aggregatedDataText);
    console.log(`[AI SERVICE] Epidemic detection result:`, alertResult);

    let dbAlertMsg = null;

    // Normalize alert/warning casing
    const level = String(alertResult.alertLevel || 'NORMAL').toUpperCase();

    // Create DB Alert if the AI detects a WARNING or CRITICAL epidemic state
    if (level === 'WARNING' || level === 'CRITICAL') {
        const alert = await alertService.createAlert({
            ashaId: req.user._id,
            type: 'EPIDEMIC_OUTBREAK', 
            message: `🌆 REIONAL ${level}: ${alertResult.findings}! Advice: ${alertResult.recommendations}`,
            severity: level === 'CRITICAL' ? SEVERITY.HIGH : SEVERITY.MEDIUM,
        });
        dbAlertMsg = `Regional epidemic alert ${alert._id} saved to database.`;
    }

    res.status(200).json({
        success: true,
        data: alertResult,
        message: dbAlertMsg
    });
});
