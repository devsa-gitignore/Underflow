import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ShieldAlert, Activity, CheckCircle2, Clock,
  ChevronRight, RefreshCw, Filter, Bell, ArrowUpRight,
} from 'lucide-react';
import { useLanguage } from './language-context';
import { getStoredToken } from './auth-utils';
import { translatePersonName } from './text-utils';

const hindiText = {
  title: 'स्वास्थ्य अलर्ट',
  subtitle: 'एआई-जनित स्वास्थ्य चेतावनियाँ और जोखिम सूचनाएं',
  totalAlerts: 'कुल अलर्ट',
  filters: 'फ़िल्टर',
  all: 'सभी',
  high: 'उच्च',
  medium: 'मध्यम',
  active: 'सक्रिय',
  resolved: 'हल किया गया',
  loading: 'अलर्ट लाए जा रहे हैं...',
  noAlerts: 'कोई अलर्ट नहीं मिला।',
  severity: 'गंभीरता',
  status: 'स्थिति',
  resolve: 'हल करें',
  escalate: 'आगे भेजें',
  viewPatient: 'रोगी देखें',
  timeAgo: 'पहले',
};

const englishText = {
  title: 'Health Alerts',
  subtitle: 'AI-generated health warnings and risk notifications',
  totalAlerts: 'Total Alerts',
  filters: 'Filters',
  all: 'All',
  high: 'High',
  medium: 'Medium',
  active: 'Active',
  resolved: 'Resolved',
  loading: 'Retrieving alerts...',
  noAlerts: 'No alerts found.',
  severity: 'Severity',
  status: 'Status',
  resolve: 'Resolve',
  escalate: 'Escalate',
  viewPatient: 'View Patient',
  timeAgo: 'ago',
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d`;
}

export default function AlertsPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const text = language === 'hi' ? hindiText : englishText;
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const token = await getStoredToken();
      const response = await fetch('http://localhost:5000/alerts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch {
      // Fallback mock alerts for demo
      setAlerts([
        {
          _id: 'mock-a1', type: 'HIGH_BP_ALERT', severity: 'HIGH', status: 'ACTIVE',
          message: '⚠️ High blood pressure detected (160/100) for Aarti Sharma. CRITICAL: Refer to PHC immediately.',
          patientId: { _id: 'mock-1', name: 'Aarti Sharma', village: 'Ward 4' },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          _id: 'mock-a2', type: 'HIGH_RISK_VISIT', severity: 'MEDIUM', status: 'ACTIVE',
          message: '⚠️ MEDIUM risk visit recorded for Pooja Patel. Symptoms: Mild fatigue, Occasional backache.',
          patientId: { _id: 'mock-2', name: 'Pooja Patel', village: 'Ward 4' },
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          _id: 'mock-a3', type: 'HIGH_RISK_ALERT', severity: 'HIGH', status: 'ACTIVE',
          message: '⚠️ AI ALERT: HIGH detected! Condition: Pre-eclampsia risk. Advice: Refer to Primary Health Center.',
          patientId: { _id: 'mock-3', name: 'Sunita Devi', village: 'Ward 5' },
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          _id: 'mock-a4', type: 'HIGH_BP_ALERT', severity: 'MEDIUM', status: 'RESOLVED',
          message: '⚠️ High blood pressure detected (140/92) for Meena Kumari. Schedule follow-up within 48 hours.',
          patientId: { _id: 'mock-5', name: 'Meena Kumari', village: 'Ward 5' },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleResolve = async (alertId) => {
    setUpdatingId(alertId);
    try {
      const token = await getStoredToken();
      await fetch(`http://localhost:5000/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, status: 'RESOLVED' } : a));
    } catch { /* demo mode */ }
    setUpdatingId(null);
  };

  const handleEscalate = async (alertId) => {
    setUpdatingId(alertId);
    try {
      const token = await getStoredToken();
      await fetch(`http://localhost:5000/alerts/${alertId}/escalate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, status: 'ESCALATED', severity: 'HIGH' } : a));
    } catch { /* demo mode */ }
    setUpdatingId(null);
  };

  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === 'high') return alert.severity === 'HIGH';
    if (activeFilter === 'medium') return alert.severity === 'MEDIUM' || alert.severity === 'LOW';
    if (activeFilter === 'active') return alert.status === 'ACTIVE';
    if (activeFilter === 'resolved') return alert.status === 'RESOLVED' || alert.status === 'ESCALATED';
    return true;
  });

  const getSeverityStyles = (severity) => {
    if (severity === 'HIGH') return { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700 border-red-200', icon: 'text-red-500', dot: 'bg-red-500' };
    if (severity === 'MEDIUM') return { bg: 'bg-amber-50/50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700 border-amber-200', icon: 'text-amber-500', dot: 'bg-amber-500' };
    return { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'text-slate-400', dot: 'bg-slate-400' };
  };

  const getTypeLabel = (type) => {
    const map = {
      'HIGH_BP_ALERT': 'Blood Pressure',
      'HIGH_RISK_VISIT': 'Risk Visit',
      'HIGH_RISK_ALERT': 'AI Risk Alert',
      'MODERATE_RISK_ALERT': 'AI Monitor',
      'EPIDEMIC_OUTBREAK': 'Epidemic',
    };
    return map[type] || type;
  };

  return (
    <div className="p-6 lg:p-10 font-inter">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ShieldAlert size={24} className="text-red-500" /> {text.title}
            </h2>
            <p className="text-sm text-slate-500 font-medium">{text.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm">
              {text.totalAlerts}: {alerts.length}
            </div>
            <button onClick={fetchAlerts} className="p-2 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
              <RefreshCw size={16} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-t-xl border border-slate-200 border-b-0 flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
            <Filter size={16} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase">{text.filters}</span>
          </div>
          {[
            { key: 'all', label: text.all, color: 'bg-slate-800 text-white' },
            { key: 'high', label: text.high, color: 'bg-red-600 text-white shadow-sm shadow-red-200' },
            { key: 'medium', label: text.medium, color: 'bg-amber-500 text-white shadow-sm shadow-amber-200' },
            { key: 'active', label: text.active, color: 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' },
            { key: 'resolved', label: text.resolved, color: 'bg-blue-600 text-white shadow-sm shadow-blue-200' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === f.key ? f.color : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Alert Cards */}
        <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <RefreshCw size={24} className="text-red-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500">{text.loading}</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm font-medium">
              <Bell size={32} className="mx-auto text-slate-300 mb-3" />
              {text.noAlerts}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAlerts.map((alert) => {
                const s = getSeverityStyles(alert.severity);
                const isResolved = alert.status === 'RESOLVED' || alert.status === 'ESCALATED';
                const patientName = alert.patientId?.name || 'Unknown Patient';

                return (
                  <div key={alert._id} className={`p-5 transition-colors ${isResolved ? 'bg-slate-50/50 opacity-70' : 'hover:bg-slate-50/30'}`}>
                    <div className="flex items-start gap-4">
                      {/* Severity icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg} border ${s.border}`}>
                        {alert.severity === 'HIGH'
                          ? <AlertTriangle size={18} className={s.icon} />
                          : <Activity size={18} className={s.icon} />
                        }
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider border ${s.badge}`}>
                            {getTypeLabel(alert.type)}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                            isResolved ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-green-50 text-green-600 border border-green-200'
                          }`}>
                            {alert.status}
                          </span>
                          <span className="text-xs text-slate-400 font-medium flex items-center gap-1 ml-auto">
                            <Clock size={12} /> {timeAgo(alert.createdAt)} {text.timeAgo}
                          </span>
                        </div>

                        <p className="text-sm text-slate-700 font-medium leading-relaxed mb-2">
                          {alert.message}
                        </p>

                        {/* Patient link + Actions */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {alert.patientId?._id && (
                            <button
                              onClick={() => navigate(`/patient/${alert.patientId._id}`)}
                              className="text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1"
                            >
                              {translatePersonName(patientName, language)}
                              <ArrowUpRight size={12} />
                            </button>
                          )}

                          {!isResolved && (
                            <>
                              <button
                                onClick={() => handleResolve(alert._id)}
                                disabled={updatingId === alert._id}
                                className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                              >
                                <CheckCircle2 size={12} /> {text.resolve}
                              </button>
                              <button
                                onClick={() => handleEscalate(alert._id)}
                                disabled={updatingId === alert._id}
                                className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                              >
                                <AlertTriangle size={12} /> {text.escalate}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
