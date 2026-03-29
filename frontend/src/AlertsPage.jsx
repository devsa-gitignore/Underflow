import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, RefreshCw, Bell, SlidersHorizontal,
  AlertTriangle, Activity, CheckCircle2, Zap,
} from 'lucide-react';
import { useLanguage } from './language-context';
import { getStoredToken } from './auth-utils';
import AlertCard from './components/AlertCard';

// ── i18n ────────────────────────────────────────────────────────────────────
const T = {
  en: {
    title: 'Health Alerts',
    subtitle: 'AI-generated risk notifications for your patient roster',
    all: 'All',
    high: 'High',
    medium: 'Medium',
    active: 'Active',
    resolved: 'Resolved',
    loading: 'Loading alerts…',
    noAlerts: 'No alerts match the current filter.',
    total: 'Total',
  },
  hi: {
    title: 'स्वास्थ्य अलर्ट',
    subtitle: 'एआई-जनित जोखिम सूचनाएं',
    all: 'सभी',
    high: 'उच्च',
    medium: 'मध्यम',
    active: 'सक्रिय',
    resolved: 'हल किया',
    loading: 'लोड हो रहा है…',
    noAlerts: 'कोई अलर्ट नहीं मिला।',
    total: 'कुल',
  },
};

// ── Mock data (fallback) ─────────────────────────────────────────────────────
const MOCK_ALERTS = [
  {
    _id: 'mock-a1', type: 'HIGH_BP_ALERT', severity: 'HIGH', status: 'ACTIVE',
    message: '⚠️ High blood pressure detected (160/100) for Aarti Sharma. Condition: Severe hypertension. Advice: Refer to PHC immediately. Monitor BP daily.',
    patientId: { _id: 'mock-1', name: 'Aarti Sharma', village: 'Ward 4' },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'mock-a2', type: 'HIGH_RISK_VISIT', severity: 'MEDIUM', status: 'ACTIVE',
    message: '⚠️ MEDIUM risk visit recorded for Pooja Patel. Symptoms: Mild fatigue, Occasional backache. Advice: Schedule follow-up within 48 hours.',
    patientId: { _id: 'mock-2', name: 'Pooja Patel', village: 'Ward 4' },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'mock-a3', type: 'HIGH_RISK_ALERT', severity: 'HIGH', status: 'ACTIVE',
    message: '⚠️ AI ALERT: HIGH detected! Condition: Pre-eclampsia risk. Symptoms: Severe headache, swelling in hands and feet. Advice: Refer to Primary Health Center immediately.',
    patientId: { _id: 'mock-3', name: 'Sunita Devi', village: 'Ward 5' },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'mock-a4', type: 'HIGH_BP_ALERT', severity: 'MEDIUM', status: 'RESOLVED',
    message: '⚠️ High blood pressure detected (140/92) for Meena Kumari. Advice: Schedule follow-up within 48 hours, limit salt intake.',
    patientId: { _id: 'mock-5', name: 'Meena Kumari', village: 'Ward 5' },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: 'mock-a5', type: 'MISSED_FOLLOWUP', severity: 'HIGH', status: 'ACTIVE',
    message: '⚠️ Patient missed follow-up. Condition: Overdue vaccination check. Advice: Contact patient immediately and reschedule within 24 hours.',
    patientId: { _id: 'mock-4', name: 'Rahul Kumar', village: 'Ward 2' },
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

// ── Filter config ────────────────────────────────────────────────────────────
const FILTERS = [
  { key: 'all',      labelKey: 'all',      Icon: Bell,          color: 'bg-slate-800 text-white border-slate-800' },
  { key: 'high',     labelKey: 'high',     Icon: AlertTriangle, color: 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-200' },
  { key: 'medium',   labelKey: 'medium',   Icon: Activity,      color: 'bg-amber-400 text-white border-amber-400 shadow-sm shadow-amber-200' },
  { key: 'active',   labelKey: 'active',   Icon: Zap,           color: 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200' },
  { key: 'resolved', labelKey: 'resolved', Icon: CheckCircle2,  color: 'bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-200' },
];

// ── Summary pills ────────────────────────────────────────────────────────────
function SummaryPill({ count, label, color }) {
  return (
    <div className={`flex flex-col items-center px-5 py-3 rounded-2xl border ${color}`}>
      <span className="text-2xl font-black leading-none">{count}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-80">{label}</span>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AlertsPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = T[language] || T.en;

  const [alerts, setAlerts]         = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [activeFilter, setFilter]   = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getStoredToken();
      const res = await fetch('http://localhost:5000/alerts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      } else {
        setAlerts(MOCK_ALERTS);
      }
    } catch {
      setAlerts(MOCK_ALERTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleResolve = async (id) => {
    setUpdatingId(id);
    try {
      const token = await getStoredToken();
      await fetch(`http://localhost:5000/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, status: 'RESOLVED' } : a));
    } catch {
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, status: 'RESOLVED' } : a));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEscalate = async (id) => {
    setUpdatingId(id);
    try {
      const token = await getStoredToken();
      await fetch(`http://localhost:5000/alerts/${id}/escalate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, status: 'ESCALATED', severity: 'HIGH' } : a));
    } catch {
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, status: 'ESCALATED', severity: 'HIGH' } : a));
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredAlerts = alerts.filter(a => {
    if (activeFilter === 'high')     return a.severity === 'HIGH';
    if (activeFilter === 'medium')   return a.severity === 'MEDIUM' || a.severity === 'LOW';
    if (activeFilter === 'active')   return a.status === 'ACTIVE';
    if (activeFilter === 'resolved') return a.status === 'RESOLVED' || a.status === 'ESCALATED';
    return true;
  });

  // ── Counts for summary ────────────────────────────────────────────────────
  const countHigh    = alerts.filter(a => a.severity === 'HIGH' && a.status === 'ACTIVE').length;
  const countActive  = alerts.filter(a => a.status === 'ACTIVE').length;
  const countResolved = alerts.filter(a => a.status === 'RESOLVED' || a.status === 'ESCALATED').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/20 p-5 lg:p-10 font-inter">
      <div className="max-w-3xl mx-auto">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between mb-8 gap-4"
        >
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-red-500 flex items-center justify-center shadow-sm shadow-red-200">
                <ShieldAlert size={17} className="text-white" />
              </div>
              {t.title}
            </h1>
            <p className="text-sm text-slate-500 font-medium">{t.subtitle}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAlerts}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={16} className={`text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </motion.div>

        {/* ── Summary row ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="grid grid-cols-3 gap-3 mb-7"
        >
          <SummaryPill count={countHigh}    label="Critical"  color="bg-red-50 border-red-200 text-red-700" />
          <SummaryPill count={countActive}  label="Active"    color="bg-amber-50 border-amber-200 text-amber-700" />
          <SummaryPill count={countResolved} label="Resolved" color="bg-slate-100 border-slate-200 text-slate-600" />
        </motion.div>

        {/* ── Filter pills ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none"
        >
          <SlidersHorizontal size={15} className="text-slate-400 shrink-0" />
          {FILTERS.map(f => {
            const FIcon = f.Icon;
            const isActive = activeFilter === f.key;
            return (
              <motion.button
                key={f.key}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border whitespace-nowrap transition-all duration-200 ${
                  isActive ? f.color : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FIcon size={12} />
                {t[f.labelKey]}
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── Alert list ──────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <RefreshCw size={28} className="text-red-400 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">{t.loading}</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-3"
          >
            <Bell size={40} className="text-slate-300" />
            <p className="text-sm text-slate-400 font-semibold">{t.noAlerts}</p>
          </motion.div>
        ) : (
          <motion.div className="space-y-4" layout>
            <AnimatePresence mode="popLayout">
              {filteredAlerts.map(alert => (
                <AlertCard
                  key={alert._id}
                  alert={alert}
                  language={language}
                  isUpdating={updatingId === alert._id}
                  onResolve={handleResolve}
                  onEscalate={handleEscalate}
                  onViewPatient={id => navigate(`/patient/${id}`)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
