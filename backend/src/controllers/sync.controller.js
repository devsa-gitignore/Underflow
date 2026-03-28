import * as syncService from '../services/sync.service.js';

/**
 * Handle POST /sync/upload
 * Processes a batch of actions from the offline ASHA worker client
 */
export const uploadSync = async (req, res, next) => {
  try {
    const { ashaId, actions } = req.body;

    if (!ashaId) {
      return res.status(400).json({ success: false, message: 'ashaId is required' });
    }

    if (!actions || !Array.isArray(actions)) {
      return res.status(400).json({ success: false, message: 'actions array is required' });
    }

    if (actions.length === 0) {
      return res.json({ success: true, processed: 0, message: 'No actions to process' });
    }

    const result = await syncService.processSyncUpload(ashaId, actions);

    res.json({
      success: true,
      processed: result.processedCount,
      failed: result.failedCount,
      errors: result.errorDetails
    });
  } catch (error) {
    console.error('Error in uploadSync controller:', error);
    next(error);
  }
};

/**
 * Handle GET /sync/download
 * Returns latest data relevant for the ASHA worker
 */
export const downloadSync = async (req, res, next) => {
  try {
    // ashaId might come from query, params, or req.user if authenticated
    // User request: Filter by ashaId if applicable
    const ashaId = req.query.ashaId || (req.user && req.user._id);

    if (!ashaId) {
      return res.status(400).json({ success: false, message: 'ashaId is required' });
    }

    const data = await syncService.getLatestAshaData(ashaId);

    res.json(data);
  } catch (error) {
    console.error('Error in downloadSync controller:', error);
    next(error);
  }
};
