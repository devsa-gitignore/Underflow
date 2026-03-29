import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Activity, CheckCircle2, ChevronDown,
  ArrowUpRight, Clock, ShieldAlert, Zap, Heart, Thermometer,
} from 'lucide-react';

// ── helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_META = {
  HIGH_BP_ALERT:        { label: 'Blood Pressure',    icon: Heart,        tag: '#B91C1C' },
  HIGH_RISK_VISIT:      { label: 'Risk Visit',         icon: Activity,     tag: '#D97706' },
  HIGH_RISK_ALERT:      { label: 'AI Risk Alert',      icon: ShieldAlert,  tag: '#7C3AED' },
  MODERATE_RISK_ALERT:  { label: 'Monitor',            icon: Thermometer,  tag: '#0891B2' },
  EPIDEMIC_OUTBREAK:    { label: 'Epidemic',           icon: Zap,          tag: '#DC2626' },
  MISSED_FOLLOWUP:      { label: 'Missed Follow-up',   icon: Clock,        tag: '#B45309' },
};

const SEVERITY_CONFIG = {
  HIGH: {
    barColor: 'bg-red-500',
    glowClass: 'shadow-red-100',
    badgeBg: 'bg-red-50 text-red-700 border-red-200',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    cardBg: 'bg-white',
    border: 'border-slate-200',
    pulseColor: 'bg-red-400',
    dot: '🔴',
  },
  MEDIUM: {
    barColor: 'bg-amber-400',
    glowClass: 'shadow-amber-50',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    cardBg: 'bg-white',
    border: 'border-slate-200',
    pulseColor: 'bg-amber-300',
    dot: '🟡',
  },
  LOW: {
    barColor: 'bg-emerald-400',
    glowClass: 'shadow-slate-100',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    cardBg: 'bg-white',
    border: 'border-slate-200',
    pulseColor: 'bg-emerald-400',
    dot: '🟢',
  },
};

// ── parse message into structured data ─────────────────────────────────────

function parseAlertMessage(message = '') {
  // Strip emoji prefixes
  const clean = message.replace(/^[⚠️🚨\s]+/, '').trim();

  // Try to split "Condition: X. Advice: Y"
  const conditionMatch = clean.match(/Condition:\s*([^.]+)/i);
  const adviceMatch    = clean.match(/Advice:\s*(.+)/i);
  const symptomsMatch  = clean.match(/Symptoms?:\s*([^.]+)/i);

  const condition = conditionMatch?.[1]?.trim();
  const advice    = adviceMatch?.[1]?.trim();
  const symptoms  = symptomsMatch?.[1]?.trim();

  // Build a short summary (≤ 12 words max)
  let summary = condition || clean.split('.')[0].replace(/\bAI ALERT:\s*/i, '').trim();
  if (summary.length > 90) summary = summary.slice(0, 90) + '…';

  // Build recommended actions
  const actions = [];
  if (advice) {
    advice.split(/[.,;]/).forEach(s => { if (s.trim()) actions.push(s.trim()); });
  }
  // Generic fallback actions per type
  if (actions.length === 0) {
    if (/bp|blood pressure/i.test(clean)) {
      actions.push('Monitor BP daily', 'Refer to PHC if BP > 160/110', 'Limit salt intake');
    } else if (/pregnancy|preeclampsia|anemia/i.test(clean)) {
      actions.push('Visit PHC immediately', 'Refer to hospital if condition worsens', 'Ensure iron & folic acid supplementation');
    } else if (/missed|follow.?up/i.test(clean)) {
      actions.push('Contact patient immediately', 'Reschedule follow-up within 24 hours', 'Log visit in system');
    } else {
      actions.push('Follow up with patient', 'Record vitals on next visit');
    }
  }

  return { summary, condition, symptoms, advice, actions, fullMessage: clean };
}

// ── AlertCard ───────────────────────────────────────────────────────────────

export default function AlertCard({
  alert,
  onResolve,
  onEscalate,
  onViewPatient,
  isUpdating = false,
  language = 'en',
}) {
  const [expanded, setExpanded] = useState(false);

  const severity = alert.severity || 'LOW';
  const cfg      = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.LOW;
  const meta     = TYPE_META[alert.type] || { label: alert.type, icon: Activity, tag: '#64748B' };
  const TypeIcon = meta.icon;

  const isResolved  = alert.status === 'RESOLVED' || alert.status === 'ESCALATED';
  const isEscalated = alert.status === 'ESCALATED';
  const isHigh      = severity === 'HIGH' && !isResolved;

  const parsed = parseAlertMessage(alert.message);
  const patientName = alert.patientId?.name || 'Unknown Patient';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: isResolved ? 0.65 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -8 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`relative rounded-2xl border ${cfg.border} ${cfg.cardBg} shadow-md ${cfg.glowClass} overflow-hidden`}
    >
      {/* ── Left severity bar ─────────────────────────────────── */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${cfg.barColor} rounded-l-2xl`} />

      {/* ── HIGH pulse ring ───────────────────────────────────── */}
      {isHigh && (
        <span className="absolute left-0 top-4 w-1.5 h-1.5 rounded-full">
          <span className={`absolute inset-0 rounded-full ${cfg.pulseColor} animate-ping opacity-75`} />
        </span>
      )}

      {/* ── Card body ─────────────────────────────────────────── */}
      <div className="pl-5 pr-5 pt-5 pb-4">

        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Icon + title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
              <TypeIcon size={18} className={cfg.iconColor} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm leading-tight">
                {meta.label}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                <Clock size={10} />
                {timeAgo(alert.createdAt)}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider border ${cfg.badgeBg}`}>
              {severity}
            </span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider border ${
              isEscalated ? 'bg-purple-50 text-purple-700 border-purple-200' :
              isResolved  ? 'bg-slate-100 text-slate-500 border-slate-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {alert.status}
            </span>
          </div>
        </div>

        {/* Patient tag */}
        {alert.patientId?.name && (
          <div className="mb-3">
            <button
              onClick={() => onViewPatient?.(alert.patientId._id)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full hover:bg-teal-100 transition-colors"
            >
              {patientName}
              <ArrowUpRight size={11} />
            </button>
          </div>
        )}

        {/* Summary */}
        <p className="text-sm text-slate-700 font-medium leading-relaxed mb-4 max-w-prose">
          {parsed.summary}
        </p>

        {/* ── Recommended Actions box ─────────────────────────── */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={11} className="text-emerald-500" />
            Recommended Actions
          </p>
          <ul className="space-y-1.5">
            {parsed.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {action}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Expandable Details ──────────────────────────────── */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors mb-3"
        >
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} />
          </motion.span>
          {expanded ? 'Hide Details' : 'View Details'}
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="details"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="bg-white border border-slate-100 rounded-xl p-4 mb-4 text-xs text-slate-600 leading-relaxed space-y-2">
                {parsed.condition && (
                  <p><span className="font-semibold text-slate-800">Condition: </span>{parsed.condition}</p>
                )}
                {parsed.symptoms && (
                  <p><span className="font-semibold text-slate-800">Symptoms: </span>{parsed.symptoms}</p>
                )}
                <p><span className="font-semibold text-slate-800">Full note: </span>{parsed.fullMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action buttons ──────────────────────────────────── */}
        {!isResolved && (
          <div className="flex items-center gap-2 flex-wrap">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onResolve?.(alert._id)}
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm shadow-emerald-200 hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={13} />
              Resolve
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onEscalate?.(alert._id)}
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 border border-red-300 text-xs font-bold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <AlertTriangle size={13} />
              Escalate
            </motion.button>
          </div>
        )}

        {isResolved && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
            isEscalated ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
          }`}>
            <CheckCircle2 size={12} />
            {isEscalated ? 'Escalated to PHC' : 'Resolved'}
          </div>
        )}
      </div>
    </motion.div>
  );
}
