export const SYNC_QUEUE_KEY = 'swasthya_sync_queue';

/**
 * Adds an action to the local storage sync queue
 * @param {string} type - 'CREATE_PATIENT' or 'ADD_VISIT'
 * @param {object} data - Payload of the action
 */
export const enqueueAction = (type, data) => {
  try {
    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    
    // Assign a temporary ID if one isn't provided for patient creation
    if (type === 'CREATE_PATIENT' && !data.id && !data.tempId) {
      data.tempId = `temp_${Date.now()}`;
    }

    queue.push({
      id: Date.now().toString(),
      type,
      data,
      timestamp: new Date().toISOString()
    });
    
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    
    // Trigger custom event so UI (Layout navbar) can update badge count immediately
    window.dispatchEvent(new Event('syncUpdate'));
    
    return data.tempId || data.id; // Return temp ID so caller can navigate/reference it
  } catch (error) {
    console.error('Failed to enqueue sync action:', error);
  }
};

/**
 * Retrieves the current sync queue
 * @returns {Array} Array of queued actions
 */
export const getQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

/**
 * Clears the sync queue after successful upload
 */
export const clearQueue = () => {
  localStorage.removeItem(SYNC_QUEUE_KEY);
  window.dispatchEvent(new Event('syncUpdate'));
};

/**
 * Removes only specific actions from queue by action IDs
 */
export const removeQueueActionsByIds = (actionIds = []) => {
  if (!Array.isArray(actionIds) || actionIds.length === 0) return;
  try {
    const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    const idSet = new Set(actionIds);
    const filtered = queue.filter((action) => !idSet.has(action.id));
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('syncUpdate'));
  } catch (error) {
    console.error('Failed to remove synced queue actions:', error);
  }
};

/**
 * Checks if a fetch error is a network failure (Offline)
 */
export const isOfflineError = (error) => {
  return error instanceof TypeError && error.message.includes('Failed to fetch');
};
