import Patient from '../models/Patient.js';
import Alert from '../models/Alert.js';
import FollowUp from '../models/FollowUp.js';
import SyncLog from '../models/SyncLog.js';
import { createPatient } from './patient.service.js';
import { createVisit } from './visit.service.js';

/**
 * Process a batch of sync actions
 * @param {string} ashaId - The ID of the ASHA worker
 * @param {Array} actions - Array of action objects
 * @returns {Promise<Object>} - Summary of processed actions
 */
export const processSyncUpload = async (ashaId, actions) => {
  // In-memory mapping for the scope of this request
  const idMap = {};
  let processedCount = 0;
  const errorDetails = [];

  console.log(`[Sync] Starting batch upload for ASHA: ${ashaId} with ${actions.length} actions`);

  for (const action of actions) {
    const tempId = action.id;
    try {
      const { type, data } = action;
      
      if (type === 'CREATE_PATIENT') {
        const patientData = { ...data };
        delete patientData.id;
        delete patientData.tempId;

        console.log(`[Sync] Processing CREATE_PATIENT for tempId: ${tempId}`);
        const patient = await createPatient(patientData, ashaId);
        
        if (tempId) {
          idMap[tempId] = patient._id.toString();
          console.log(`[Sync] Mapped ${tempId} -> ${patient._id}`);
        }
        processedCount++;
      } 
      else if (type === 'ADD_VISIT') {
        let patientId = data.patientId;
        if (idMap[patientId]) {
          console.log(`[Sync] Resolved tempId ${patientId} to ${idMap[patientId]}`);
          patientId = idMap[patientId];
        }

        const visitData = { ...data };
        delete visitData.patientId;

        console.log(`[Sync] Processing ADD_VISIT for patient: ${patientId}`);
        await createVisit(patientId, ashaId, visitData);
        processedCount++;
      } 
      else {
        console.warn(`[Sync] Unknown action type: ${type}`);
        errorDetails.push({ action: type, tempId, error: `Unknown action type: ${type}` });
      }
    } catch (error) {
      console.error(`[Sync] Error processing action:`, error.message);
      errorDetails.push({ 
        action: action.type, 
        tempId,
        error: error.message 
      });
    }
  }

  console.log(`[Sync] Batch upload complete. Processed: ${processedCount}, Failed: ${errorDetails.length}`);

  // PERSIST SYNC LOG
  try {
    await SyncLog.create({
      ashaId,
      actionsProcessed: processedCount,
      status: errorDetails.length === 0 ? 'SUCCESS' : processedCount > 0 ? 'PARTIAL' : 'FAILED',
      actionTypes: [...new Set(actions.map(a => a.type))],
      details: actions.map(a => ({
        actionType: a.type,
        data: a.data,
        success: !errorDetails.some(e => e.tempId === a.id),
        error: errorDetails.find(e => e.tempId === a.id)?.error
      }))
    });
  } catch (logError) {
    console.error('[Sync] Failed to save sync log:', logError.message);
  }

  return { processedCount, failedCount: errorDetails.length, errorDetails };
};

/**
 * Fetch latest data for an ASHA worker
 * @param {string} ashaId - The ID of the ASHA worker
 * @returns {Promise<Object>} - Latest patients, alerts, and followups
 */
export const getLatestAshaData = async (ashaId) => {
  console.log(`[Sync] Preparing download data for ASHA: ${ashaId}`);
  
  const [patients, alerts, followups] = await Promise.all([
    Patient.find({ ashaId, isDeleted: false }).sort({ updatedAt: -1 }),
    Alert.find({ ashaId }).sort({ createdAt: -1 }),
    FollowUp.find({ ashaId }).sort({ dueDate: 1 })
  ]);

  return {
    patients,
    alerts,
    followups
  };
};
