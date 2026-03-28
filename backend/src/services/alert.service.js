import Alert from '../models/Alert.js';
import { STATUS, SEVERITY } from '../config/constants.js';

/**
 * Service to handle alert-related operations.
 */

export const createAlert = async (alertData) => {
  return await Alert.create(alertData);
};

export const getAlerts = async (filters = {}) => {
  // Can filter by status, severity, ashaId, patientId, etc.
  return await Alert.find(filters).populate('patientId', 'name village').populate('ashaId', 'name');
};

export const updateAlertStatus = async (id, status) => {
  if (!Object.values(STATUS).includes(status)) {
    throw new Error('Invalid alert status');
  }
  return await Alert.findByIdAndUpdate(id, { status }, { new: true });
};

export const escalateAlert = async (id) => {
  return await Alert.findByIdAndUpdate(
    id,
    { status: STATUS.ESCALATED, severity: SEVERITY.HIGH },
    { new: true }
  );
};

export const assignAlert = async (id, ashaId) => {
  return await Alert.findByIdAndUpdate(
    id,
    { ashaId },
    { new: true }
  );
};
