/**
 * OfflineSyncContext.jsx
 *
 * Central brain for offline-first sync. Wraps the whole app.
 *
 * What it does:
 *  - Tracks online/offline state in real time
 *  - Exposes addToQueue() so any page can enqueue an action
 *  - Auto-syncs when the device comes back online
 *  - Exposes syncNow() for the manual Sync button
 *  - Fires toast-style notifications so the user always knows the status
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getStoredToken } from './auth-utils';
import { getQueue, clearQueue, enqueueAction } from './sync-utils';

// ── Context ──────────────────────────────────────────────────────────────────
const OfflineSyncContext = createContext(null);

export function useOfflineSync() {
  return useContext(OfflineSyncContext);
}

// ── Toast notification (internal) ────────────────────────────────────────────
// We keep them minimal to avoid adding a full toast library.
const TOAST_DURATION = 4000; // ms

export function OfflineSyncProvider({ children }) {
  const [isOnline, setIsOnline]         = useState(navigator.onLine);
  const [queueLength, setQueueLength]   = useState(0);
  const [isSyncing, setIsSyncing]       = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [toast, setToast]               = useState(null); // { type, message }
  const toastTimer = useRef(null);

  // ── Toast helpers ───────────────────────────────────────────────────────
  const showToast = useCallback((type, message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION);
  }, []);

  // ── Queue helpers ───────────────────────────────────────────────────────
  const refreshQueueLength = useCallback(() => {
    setQueueLength(getQueue().length);
  }, []);

  // Exposed to other components: add an action to the offline queue
  const addToQueue = useCallback((type, data) => {
    const tempId = enqueueAction(type, data);
    refreshQueueLength();
    showToast('offline', `Saved locally (${type}). Will sync when online.`);
    return tempId;
  }, [refreshQueueLength, showToast]);

  // ── Core sync logic ─────────────────────────────────────────────────────
  const syncNow = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;

    const actions = getQueue();
    if (actions.length === 0) {
      showToast('info', 'Nothing to sync — you are up to date.');
      return;
    }

    setIsSyncing(true);
    showToast('syncing', `Uploading ${actions.length} pending record(s)…`);

    try {
      const token = await getStoredToken();

      // ── POST /sync/upload ─────────────────────────────────────────────
      const userId = token
        ? JSON.parse(atob(token.split('.')[1]))?.id || 'AW-1029'
        : 'AW-1029';

      const uploadRes = await fetch('http://localhost:5000/sync/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ ashaId: userId, actions }),
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.message || `Upload failed (${uploadRes.status})`);
      }

      const uploadResult = await uploadRes.json();

      // ── GET /sync/download ────────────────────────────────────────────
      // Re-fetch latest data so the UI is fresh. We don't store it here
      // (pages use their own fetch), but we fire the request so backend
      // can update caches/followups. Pages will reload on navigation.
      await fetch(`http://localhost:5000/sync/download?ashaId=${userId}`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      }).catch(() => {}); // non-fatal

      // ── Clear queue ───────────────────────────────────────────────────
      clearQueue();
      refreshQueueLength();
      setLastSyncTime(new Date());

      // Dispatch custom event so Layout can update its counter independently
      window.dispatchEvent(new Event('syncComplete'));

      showToast(
        'success',
        `Synced! ${uploadResult.processed} record(s) saved to server.`
      );
    } catch (error) {
      console.error('[Sync] Upload failed:', error.message);
      showToast('error', `Sync failed: ${error.message}. Will retry when online.`);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshQueueLength, showToast]);

  // ── Network event listeners ─────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('online', 'You are back online! Syncing pending records…');
      // Small delay so the toast is readable before sync starts
      setTimeout(() => syncNow(), 1200);
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('offline', 'You are offline. Changes will be saved locally.');
    };

    const handleSyncUpdate = () => refreshQueueLength();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('syncUpdate', handleSyncUpdate);

    // Initial queue count
    refreshQueueLength();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('syncUpdate', handleSyncUpdate);
    };
  }, [syncNow, refreshQueueLength, showToast]);

  // ── Context value ───────────────────────────────────────────────────────
  const value = {
    isOnline,
    queueLength,
    isSyncing,
    lastSyncTime,
    syncNow,
    addToQueue,
  };

  return (
    <OfflineSyncContext.Provider value={value}>
      {children}

      {/* ── Global Toast Notification ──────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl font-inter text-sm font-semibold border transition-all animate-in slide-in-from-bottom-4 duration-300 ${
            toast.type === 'success'  ? 'bg-emerald-600 text-white border-emerald-500' :
            toast.type === 'error'    ? 'bg-red-600 text-white border-red-500' :
            toast.type === 'syncing'  ? 'bg-indigo-600 text-white border-indigo-500' :
            toast.type === 'online'   ? 'bg-teal-600 text-white border-teal-500' :
            toast.type === 'offline'  ? 'bg-amber-500 text-white border-amber-400' :
                                        'bg-slate-800 text-white border-slate-700'
          }`}
        >
          {/* Icon */}
          <span className="text-base">
            {toast.type === 'success'  ? '✅' :
             toast.type === 'error'    ? '❌' :
             toast.type === 'syncing'  ? '🔄' :
             toast.type === 'online'   ? '🟢' :
             toast.type === 'offline'  ? '🟡' : 'ℹ️'}
          </span>
          {toast.message}
          <button
            onClick={() => setToast(null)}
            className="ml-2 opacity-70 hover:opacity-100 transition-opacity text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}
    </OfflineSyncContext.Provider>
  );
}
