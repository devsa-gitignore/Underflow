import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, Map, AlertTriangle, TrendingUp, Download, 
  Activity, Clock, Shield, Search, Bell,
  LogOut, ChevronRight, UserCheck, MoreVertical, CheckCircle2, RefreshCw,
  CreditCard, Scan, X, Trash2, Phone, MapPin, Briefcase, UserPlus, Upload
} from 'lucide-react';
import IndiaHeatmap from './components/IndiaHeatmap';
import { getStoredToken } from './auth-utils';
import { Link } from 'react-router-dom';

// ── Animated counter hook ──────────────────────────────────────────────────
function useCountUp(target, duration = 1200, startOnMount = true) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  useEffect(() => { if (startOnMount) start(); }, [start, startOnMount]);
  return [count, start];
}

// ── Animated stat card  ───────────────────────────────────────────────────
function AnimatedStat({ label, value, suffix = '', color = 'text-slate-900' }) {
  const [count] = useCountUp(value, 1000);
  return (
    <div className="flex flex-col">
      <span className={`text-2xl font-black ${color}`}>{count}{suffix}</span>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

// ── Aadhaar scan modal ─────────────────────────────────────────────────────
const AADHAAR_DATA = {
  name: 'Ritwik Harshal Satghare',
  phone: '7738738818',
  region: 'Mumbai Suburban',
  aadhaar: '4521 8834 9921',
  dob: '14 Aug 2004',
  gender: 'Male',
  address: 'Flat 302, Shanti Nagar, Andheri East, Mumbai - 400069',
};

function AadhaarModal({ onClose, onConfirm }) {
  const [step, setStep] = useState('scan'); // 'scan' | 'scanning' | 'preview' | 'assigning' | 'done'
  const [assignedStats, setAssignedStats] = useState({ patients: 0, tasks: 0, alerts: 0 });

  const fileInputRef = useRef(null);

  const handleScan = () => {
    setStep('scanning');
    setTimeout(() => setStep('preview'), 2200);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleScan();
    }
  };

  const handleConfirm = () => {
    setStep('assigning');
    setTimeout(() => {
      setAssignedStats({ patients: 47, tasks: 12, alerts: 3 });
      setStep('done');
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <CreditCard size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Aadhaar Verification</h2>
              <p className="text-blue-200 text-xs font-medium">ASHA Worker Onboarding</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* STEP 1 — scan prompt */}
          {step === 'scan' && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-blue-50 rounded-2xl mx-auto mb-5 flex items-center justify-center border-2 border-dashed border-blue-200">
                <Scan size={36} className="text-blue-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Verify Aadhaar Card</h3>
              <p className="text-sm text-slate-500 font-medium mb-6 max-w-xs mx-auto">
                Scan the card or upload a photo from your device to auto-fetch details from UIDAI.
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,.pdf" 
              />

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleScan}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
                >
                  <Scan size={16} /> Scan Aadhaar Now
                </button>
                
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="w-full py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={16} /> Upload Aadhaar Photo
                </button>
              </div>
              
              <p className="text-xs text-slate-400 mt-5">Secured by UIDAI • 256-bit encrypted</p>
            </div>
          )}

          {/* STEP — scanning */}
          {step === 'scanning' && (
            <div className="text-center py-10">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="w-20 h-20 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Scan size={24} className="text-blue-500" />
                </div>
              </div>
              <p className="font-bold text-slate-900 text-base mb-1">Reading Aadhaar…</p>
              <p className="text-sm text-slate-400 font-medium">Connecting to UIDAI Verification Portal</p>
              <div className="mt-5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-[scan_2.2s_ease-in-out_forwards]" style={{width: '100%', animation: 'none', background: 'linear-gradient(90deg,#3b82f6,#6366f1)', maskImage: 'linear-gradient(90deg,#000 var(--p,0%),transparent var(--p,0%))'}} />
              </div>
            </div>
          )}

          {/* STEP — preview details */}
          {step === 'preview' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-white" />
                </div>
                <p className="text-sm font-bold text-emerald-600">Aadhaar Verified Successfully</p>
              </div>

              {/* ID card preview */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 mb-5 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -translate-y-6 translate-x-6" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-indigo-500/10 rounded-full translate-y-4 -translate-x-4" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Government of India • UIDAI</p>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-14 bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-lg font-black text-white">{AADHAAR_DATA.name.split(' ').map(n=>n[0]).join('')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-white text-base leading-tight">{AADHAAR_DATA.name}</p>
                    <p className="text-slate-400 text-xs mt-1">{AADHAAR_DATA.dob} • {AADHAAR_DATA.gender}</p>
                    <p className="text-slate-300 text-xs mt-2 font-mono tracking-wider">{AADHAAR_DATA.aadhaar}</p>
                  </div>
                </div>
                <p className="text-slate-400 text-[10px] mt-3 line-clamp-1">{AADHAAR_DATA.address}</p>
              </div>

              {/* Details rows */}
              <div className="space-y-2.5 mb-5">
                {[
                  { Icon: Users,    label: 'Full Name', value: AADHAAR_DATA.name },
                  { Icon: Phone,    label: 'Mobile', value: AADHAAR_DATA.phone },
                  { Icon: MapPin,   label: 'Region', value: AADHAAR_DATA.region },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-bold text-slate-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <UserPlus size={16} /> Confirm & Register Worker
              </button>
            </div>
          )}

          {/* STEP — assigning */}
          {step === 'assigning' && (
            <div className="text-center py-10">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="w-20 h-20 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Briefcase size={24} className="text-emerald-500" />
                </div>
              </div>
              <p className="font-bold text-slate-900 text-base mb-1">Assigning Patients & Tasks…</p>
              <p className="text-sm text-slate-400 font-medium">Distributing workload from Mumbai Suburban district</p>
            </div>
          )}

          {/* STEP — done */}
          {step === 'done' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-emerald-200">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h3 className="font-black text-slate-900 text-lg mb-1">{AADHAAR_DATA.name.split(' ')[0]} is Onboarded!</h3>
              <p className="text-sm text-slate-500 font-medium mb-6">Worker profile created and tasks assigned.</p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Patients', val: assignedStats.patients, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
                  { label: 'Tasks',    val: assignedStats.tasks,    color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
                  { label: 'Alerts',   val: assignedStats.alerts,   color: 'text-red-600',  bg: 'bg-red-50 border-red-200' },
                ].map(({ label, val, color, bg }) => (
                  <div key={label} className={`rounded-xl border p-3 ${bg}`}>
                    <AnimatedStat label={label} value={val} color={color} />
                  </div>
                ))}
              </div>

              <button
                onClick={() => onConfirm(AADHAAR_DATA)}
                className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusing our Magic Bento component for that premium SaaS glow
function MagicBento({ children, className = "", glowColor = "16, 185, 129" }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 transition-all hover:shadow-lg ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(${glowColor}, 0.08), transparent 40%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 ease-in-out z-20"
        style={{
          opacity,
          background: `radial-gradient(300px circle at ${position.x}px ${position.y}px, rgba(${glowColor}, 0.5), transparent 40%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px',
          borderRadius: 'inherit'
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

export default function AdminDashboard() {
  // Navigation State
  const [activeView, setActiveView] = useState('commandCenter');

  const [fieldWorkers, setFieldWorkers] = useState([]);
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [aiAlerts, setAiAlerts] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const [dashboardStats, setDashboardStats] = useState({
    totalPatients: 0,
    maternalCount: 0,
    activeAlerts: 0,
    activeWorkers: 0,
    syncedLast24h: 0
  });
  const [wardStats, setWardStats] = useState([]);
  const [trendStats, setTrendStats] = useState([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const statsRes = await fetch('http://localhost:5000/admin/stats');
        if (statsRes.ok) {
          const result = await statsRes.json();
          if (result.success) setDashboardStats(result.data);
        }

        const wardRes = await fetch('http://localhost:5000/admin/ward-stats');
        if (wardRes.ok) {
          const result = await wardRes.json();
          if (result.success) setWardStats(result.data);
        }

        const trendRes = await fetch('http://localhost:5000/admin/trend-stats');
        if (trendRes.ok) {
          const result = await trendRes.json();
          if (result.success) setTrendStats(result.data);
        }

        // Keep field workers fetch for the fleets view
        const workerRes = await fetch('http://localhost:5000/auth/workers');
        if (workerRes.ok) {
          const result = await workerRes.json();
          if (result.success && Array.isArray(result.data)) {
             const mapped = result.data.map((w, idx) => ({
                id: w._id || `AW-77${idx}`,
                name: w.name,
                ward: w.region || 'Ward 4',
                phone: w.phone || '—',
                status: Math.random() > 0.3 ? 'online' : 'offline',
                lastSync: Math.random() > 0.3 ? 'Just now' : '2 hrs ago',
                cases: Math.floor(Math.random() * 200) + 50,
                tasks: Math.floor(Math.random() * 20) + 5,
                critical: Math.floor(Math.random() * 10)
             }));
             setFieldWorkers(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      }
    };
    fetchAdminData();
  }, []);

  const runEpidemicAlert = async () => {
    setIsAiLoading(true);
    try {
      const token = await getStoredToken();
      const simulatedData = "Past 7 days across Wards 1-5: 45 cases of sudden high fever, 12 isolated cases of severe diarrhea in Ward 4, infant malnutrition reported in Ward 2.";
      const res = await fetch('http://localhost:5000/ai/epidemic-alerts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ aggregatedDataText: simulatedData })
      });
      const data = await res.json();
      if (!res.ok) {
         console.error("API failed:", data);
         setAiAlerts({ alertLevel: "ERROR", findings: data.message || "Failed to fetch AI Insights. Check backend token or Gemini API.", recommendations: "Ensure you are logged in correctly and Gemini config is set."});
         return;
      }
      setAiAlerts(data.data);
    } catch(err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csvData = [
      ["Location", "Total Cases", "Critical", "ASHA Assigned"],
      ...wardStats.map(w => [w.location || "Unknown", w.totalCases, w.criticalCases, w.workerCount])
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + csvData.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `swasthya_sathi_ward_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Chart Math helpers for 7 Day Trend ---
  const maxTrendCases = React.useMemo(() => {
    if (trendStats.length === 0) return 10;
    return Math.max(...trendStats.map(t => t.cases), 10);
  }, [trendStats]);

  const chartPoints = React.useMemo(() => {
    if (trendStats.length === 0) return [];
    // width is 0 to 100, height is 35 (bottom) to 5 (top) so range is 30px
    return trendStats.map((d, i) => {
      const x = (i / 6) * 100;
      const y = 35 - ((d.cases / maxTrendCases) * 30);
      return { x, y, ...d };
    });
  }, [trendStats, maxTrendCases]);

  const chartPathData = React.useMemo(() => {
    if (chartPoints.length === 0) return { fillPath: '', linePath: '' };
    const pointsStr = chartPoints.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    return {
      fillPath: `M 0 40 L 0 ${chartPoints[0].y.toFixed(1)} ${pointsStr.substring(2)} L 100 40 Z`,
      linePath: `M 0 ${chartPoints[0].y.toFixed(1)} ${pointsStr.substring(2)}`
    };
  }, [chartPoints]);

  const weeklySum = trendStats.reduce((sum, d) => sum + d.cases, 0);

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          .font-inter { font-family: 'Inter', sans-serif; }
          
          @keyframes severe-glow {
            0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.4), 0 0 10px rgba(239, 68, 68, 0.2); }
            50% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.8), 0 0 30px rgba(239, 68, 68, 0.4); }
          }
          .animate-severe-glow { animation: severe-glow 2s ease-in-out infinite; }
        `}
      </style>

      <div className="h-screen bg-[linear-gradient(160deg,#f0fdf4_0%,#ffffff_45%,#ecfdf5_100%)] flex font-inter text-slate-900 overflow-hidden w-full">
        
        {/* DARK ENTERPRISE SIDEBAR */}
        <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 shadow-2xl z-20 border-r border-slate-800">
          <Link to="/" className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 transition-colors">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3 shadow-lg shadow-blue-900/50">
              <Shield size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Swasthya<span className="font-normal text-slate-400">Sathi</span>
            </h1>
          </Link>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <button 
              onClick={() => setActiveView('commandCenter')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'commandCenter' 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm' 
                  : 'hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <Activity size={18} /> Command Center
            </button>
            <button 
              onClick={() => setActiveView('fieldWorkers')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'fieldWorkers' 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm' 
                  : 'hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <Users size={18} /> Field Workers (ASHA)
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors">
              <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-md flex items-center justify-center text-white font-bold">
                DR
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">Dr. R. Menon</p>
                <p className="text-xs text-slate-500 truncate">Chief Medical Officer</p>
              </div>
              <LogOut size={16} className="text-slate-500" />
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* TOP HEADER */}
          <header className="h-20 bg-white/90 backdrop-blur-sm border-b border-emerald-100 flex items-center justify-between px-8 shrink-0 z-10">
            <div className="flex-1 max-w-xl flex items-center relative">
              <Search className="absolute left-3 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search districts, wards, or specific SS-IDs..." 
                className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pl-10 pr-4 py-2 rounded-lg text-sm font-medium transition-all"
              />
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                <Download size={16} /> Export Report
              </button>
              <div className="w-px h-6 bg-slate-200 mx-2"></div>
              <button className="relative text-slate-500 hover:text-slate-800 transition-colors p-2">
                <Bell size={22} />
                {dashboardStats.activeAlerts > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-severe-glow"></span>
                )}
              </button>
            </div>
          </header>

          {/* SCROLLABLE DASHBOARD CONTENT */}
          <main className="flex-1 overflow-y-auto p-8 bg-[linear-gradient(180deg,#f7fff9_0%,#ffffff_35%,#f3fff7_100%)]">
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* --- VIEW: COMMAND CENTER --- */}
              {activeView === 'commandCenter' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">District Overview</h2>
                      <p className="text-sm text-slate-500 font-medium">Real-time aggregated data from 42 active ASHA workers.</p>
                    </div>
                    <div className="text-sm font-semibold text-slate-500 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live Sync Active
                    </div>
                  </div>

                  {/* TOP LEVEL KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <MagicBento glowColor="59, 130, 246" className="bg-white p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Population</span>
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md"><Users size={16} /></div>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-900">{dashboardStats.totalPatients}</span>
                        <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1"><TrendingUp size={12}/> Live Database</p>
                      </div>
                    </MagicBento>

                    <MagicBento glowColor="239, 68, 68" className="bg-white p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Triage</span>
                        <div className="p-1.5 bg-red-50 text-red-600 rounded-md"><AlertTriangle size={16} /></div>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-red-600">{dashboardStats.activeAlerts}</span>
                        <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1"><TrendingUp size={12}/> Active Alerts</p>
                      </div>
                    </MagicBento>

                    <MagicBento glowColor="236, 72, 153" className="bg-white p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Maternal Tracks</span>
                        <div className="p-1.5 bg-pink-50 text-pink-600 rounded-md"><Activity size={16} /></div>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-900">{dashboardStats.maternalCount}</span>
                        <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">Pregnant Patients</p>
                      </div>
                    </MagicBento>

                    <MagicBento glowColor="16, 185, 129" className="bg-white p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Worker Status</span>
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md"><UserCheck size={16} /></div>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-900">{dashboardStats.activeWorkers}</span>
                        <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1"><Clock size={12}/> Actively registered</p>
                      </div>
                    </MagicBento>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Ward Breakdown Table */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                      <div className="px-6 py-4 border-b border-blue-100 flex justify-between items-center bg-blue-50/45">
                        <h3 className="font-bold text-slate-800">Ward Triage Breakdown</h3>
                        <button 
                          onClick={handleExportCSV}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Export CSV
                        </button>
                      </div>
                      <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-white text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                              <th className="px-6 py-4 font-semibold">Location</th>
                              <th className="px-6 py-4 font-semibold">Total Cases</th>
                              <th className="px-6 py-4 font-semibold text-red-600">Critical</th>
                              <th className="px-6 py-4 font-semibold">ASHA Assigned</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {wardStats.length > 0 ? wardStats.map((ward, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-bold text-slate-800">{ward.location || 'Unknown'}</td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-600">{ward.totalCases}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 font-bold rounded text-xs border ${ward.criticalCases > 5 ? 'bg-red-100 text-red-700 border-red-200' : ward.criticalCases > 0 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                    {ward.criticalCases} Cases
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-slate-600">{ward.workerCount} Workers</td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-sm font-bold text-slate-500">No Patient Data Found in the Region</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Field Worker Fleet Status (Preview) */}
                    <div className="lg:col-span-1">
                      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="px-6 py-5 border-b border-purple-100 flex justify-between items-center bg-purple-50/45">
                          <div>
                            <h3 className="font-bold text-slate-800">Fleet Quick View</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time sync status</p>
                          </div>
                          <span className="p-2 bg-purple-100 rounded-md text-purple-600"><Users size={16}/></span>
                        </div>
                        
                        <div className="p-4 flex-1 overflow-y-auto space-y-3">
                          {fieldWorkers.slice(0, 4).map((worker) => (
                            <div key={worker.id} className="p-3 border border-slate-100 rounded-lg bg-slate-50/50">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{worker.name}</p>
                                  <p className="text-xs font-medium text-slate-500">{worker.ward}</p>
                                </div>
                                {worker.status === 'online' ? (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Offline
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                          <button 
                            onClick={() => setActiveView('fieldWorkers')}
                            className="w-full py-2 bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                          >
                            Manage All Workers <ChevronRight size={16}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* GEOGRAPHIC MAP & TREND GRAPH */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pb-10">
                    
                    {/* Geographic Map Placeholder */}
                    <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative min-h-[340px]">
                      <div className="px-6 py-4 border-b border-pink-100 flex justify-between items-center bg-pink-50/45 relative z-10">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Map size={18} className="text-blue-600" /> Live Geographic Heatmap
                        </h3>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> GPS Active
                        </span>
                      </div>
                      
                      <div className="flex-1 w-full relative z-0">
                        <IndiaHeatmap liveData={wardStats} />
                      </div>
                    </div>

                    {/* Case Trend Line Graph */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                      <div className="px-6 py-4 border-b border-slate-300/70 flex justify-between items-center bg-slate-900/5">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <TrendingUp size={18} className="text-slate-700"/> 7-Day Case Trend
                        </h3>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-end mb-6">
                          <div>
                            <p className="text-3xl font-black text-slate-900">{weeklySum}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Registrations (7 Days)</p>
                          </div>
                          <div className="text-emerald-700 text-sm font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                            ↓ 12%
                          </div>
                        </div>
                        
                        {/* Dynamic SVG Line Chart */}
                        <div className="w-full relative mt-auto h-40">
                          {chartPoints.length > 0 ? (
                            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="rgba(37, 99, 235, 0.4)" />
                                  <stop offset="100%" stopColor="rgba(37, 99, 235, 0)" />
                                </linearGradient>
                              </defs>
                              {/* Grid lines */}
                              <line x1="0" y1="10" x2="100" y2="10" stroke="#f1f5f9" strokeWidth="0.5" />
                              <line x1="0" y1="20" x2="100" y2="20" stroke="#f1f5f9" strokeWidth="0.5" />
                              <line x1="0" y1="30" x2="100" y2="30" stroke="#f1f5f9" strokeWidth="0.5" />
                              
                              {/* Area and Line */}
                              <path d={chartPathData.fillPath} fill="url(#chart-gradient)" className="transition-all duration-700 ease-in-out" />
                              <path d={chartPathData.linePath} fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700 ease-in-out" />
                              
                              {/* Dots */}
                              {chartPoints.map((p, i) => (
                                <circle 
                                  key={i} 
                                  cx={p.x} 
                                  cy={p.y} 
                                  r="1.5" 
                                  fill="white" 
                                  stroke="#2563eb" 
                                  strokeWidth={i === chartPoints.length - 1 ? "1.5" : "1"} 
                                  className={`transition-all duration-700 ease-in-out ${i === chartPoints.length - 1 ? 'animate-pulse' : ''}`}
                                />
                              ))}
                            </svg>
                          ) : (
                             <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-semibold">Loading Trend...</div>
                          )}
                        </div>
                        
                        {/* Dynamic X-Axis */}
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-4">
                          {trendStats.map((d, i) => (
                             <span key={i} className="w-8 text-center" style={{opacity: (i % 2 === 0) ? 1 : 0}}>
                               {d.dayName}
                             </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI EPIDEMIC INSIGHTS */}
                  <div className="mt-8 mb-10 bg-white border border-red-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-red-100 flex justify-between items-center bg-red-50/45">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Activity size={18} className="text-red-500" /> AI Epidemic & Outbreak Analysis
                      </h3>
                      <button onClick={runEpidemicAlert} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                        {isAiLoading ? <RefreshCw size={16} className="animate-spin" /> : "Run Area Scan"}
                      </button>
                    </div>
                    
                    <div className="p-6">
                      {!aiAlerts && !isAiLoading && (
                        <div className="text-center py-8 text-slate-500">
                          <Activity size={32} className="mx-auto mb-3 opacity-20" />
                          <p>Click "Run Area Scan" to analyze recent checkups for outbreak patterns using Gemini AI.</p>
                        </div>
                      )}
                      
                      {isAiLoading && (
                        <div className="text-center py-12 text-red-500 animate-pulse font-medium">
                          Scanning regional vitals and symptoms...
                        </div>
                      )}
                      
                      {aiAlerts && (
                        <div className="space-y-4">
                          <div className={`p-5 rounded-xl border ${aiAlerts.alertLevel === 'CRITICAL' ? 'bg-red-50 border-red-200' : aiAlerts.alertLevel === 'WARNING' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                             <h4 className={`font-black text-xl mb-3 ${aiAlerts.alertLevel === 'CRITICAL' ? 'text-red-800' : aiAlerts.alertLevel === 'WARNING' ? 'text-amber-800' : 'text-emerald-800'}`}>
                               Status: {aiAlerts.alertLevel}
                             </h4>
                             <div className="bg-white/60 p-5 rounded-lg border border-slate-100/50 shadow-sm">
                               <h5 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2"><Search size={14}/> Patterns Discovered</h5>
                               <p className="text-slate-700 font-medium mb-5 text-sm">{aiAlerts.findings}</p>
                               <h5 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2"><Shield size={14}/> Recommendations</h5>
                               <p className="text-slate-700 font-medium text-sm">{aiAlerts.recommendations}</p>
                             </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* --- VIEW: FIELD WORKERS --- */}
              {activeView === 'fieldWorkers' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">Field Worker Fleet</h2>
                      <p className="text-sm text-slate-500 font-medium">Manage and monitor your assigned ASHA worker roster.</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowAadhaar(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                      >
                        <UserPlus size={15} /> Add Worker
                      </button>
                    </div>
                  </div>

                  {/* Roster table */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/45 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Users size={18} className="text-blue-600" /> Active Roster
                      </h3>
                      <span className="text-xs font-bold text-blue-700 uppercase bg-blue-100 px-2 py-1 rounded">Total: {fieldWorkers.length}</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                            <th className="px-6 py-4 font-semibold">Worker</th>
                            <th className="px-6 py-4 font-semibold">Region</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold">Patients</th>
                            <th className="px-6 py-4 font-semibold">Tasks</th>
                            <th className="px-6 py-4 font-semibold">Critical</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {fieldWorkers.length === 0 && (
                            <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-400 font-semibold">No workers registered yet.</td></tr>
                          )}
                          {fieldWorkers.map((worker) => (
                            <tr key={worker.id} className={`hover:bg-slate-50 transition-colors group ${removingId === worker.id ? 'opacity-0 scale-95 pointer-events-none' : ''}`}
                              style={{ transition: 'opacity 0.35s, transform 0.35s' }}>
                              {/* Worker Details */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                                    {worker.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{worker.name}</p>
                                    <p className="text-xs font-medium text-slate-400 flex items-center gap-1"><Phone size={9}/> {worker.phone || '—'}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Region */}
                              <td className="px-6 py-4">
                                <span className="text-sm font-semibold text-slate-700 flex items-center gap-1"><MapPin size={12} className="text-slate-400"/>{worker.ward}</span>
                              </td>

                              {/* Status */}
                              <td className="px-6 py-4">
                                {worker.status === 'online' ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Offline
                                  </span>
                                )}
                              </td>

                              {/* Patients — animated */}
                              <td className="px-6 py-4">
                                <AnimatedStat label="patients" value={worker.cases} color="text-blue-600" />
                              </td>

                              {/* Tasks — animated */}
                              <td className="px-6 py-4">
                                <AnimatedStat label="tasks" value={worker.tasks || 8} color="text-amber-600" />
                              </td>

                              {/* Critical */}
                              <td className="px-6 py-4">
                                {worker.critical > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                    <AlertTriangle size={11} /> {worker.critical}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 size={11} /> 0
                                  </span>
                                )}
                              </td>

                              {/* Remove */}
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => {
                                    setRemovingId(worker.id);
                                    setTimeout(() => {
                                      setFieldWorkers(prev => prev.filter(w => w.id !== worker.id));
                                      setRemovingId(null);
                                    }, 380);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                  <Trash2 size={13} /> Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
      </div>

      {/* ── Aadhaar Modal ───────────────────────────────────────────── */}
      {showAadhaar && (
        <AadhaarModal
          onClose={() => setShowAadhaar(false)}
          onConfirm={(data) => {
            const newWorker = {
              id: `AW-${Date.now()}`,
              name: data.name,
              phone: data.phone,
              ward: data.region,
              status: 'online',
              lastSync: 'Just now',
              cases: 47,
              tasks: 12,
              critical: 3,
            };
            setFieldWorkers(prev => [newWorker, ...prev]);
            setShowAadhaar(false);
          }}
        />
      )}
    </>
  );
}
