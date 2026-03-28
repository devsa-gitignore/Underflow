import React, { useState, useEffect } from 'react';
import { 
  Users, Map, AlertTriangle, TrendingUp, Download, 
  Activity, Clock, Shield, Search, Bell, Settings, 
  LogOut, ChevronRight, UserCheck, MapPin, MoreVertical, CheckCircle2, RefreshCw
} from 'lucide-react';

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
  const [aiAlerts, setAiAlerts] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await fetch('http://localhost:5000/auth/workers');
        if (response.ok) {
          const result = await response.json();
          if (result.success && Array.isArray(result.data)) {
             const mapped = result.data.map((w, idx) => ({
                id: w._id || `AW-77${idx}`,
                name: w.name,
                ward: w.region || "Ward 4",
                status: Math.random() > 0.3 ? "online" : "offline",
                lastSync: Math.random() > 0.3 ? "Just now" : "2 hrs ago",
                cases: Math.floor(Math.random() * 200) + 50,
                critical: Math.floor(Math.random() * 10)
             }));
             setFieldWorkers(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to fetch workers", err);
      }
    };
    fetchWorkers();
  }, []);

  const runEpidemicAlert = async () => {
    setIsAiLoading(true);
    try {
      const simulatedData = "Past 7 days across Wards 1-5: 45 cases of sudden high fever, 12 isolated cases of severe diarrhea in Ward 4, infant malnutrition reported in Ward 2.";
      const res = await fetch('http://localhost:5000/ai/epidemic-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aggregatedDataText: simulatedData })
      });
      const data = await res.json();
      setAiAlerts(data.data);
    } catch(err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

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

      <div className="h-screen bg-slate-50 flex font-inter text-slate-900 overflow-hidden w-full">
        
        {/* DARK ENTERPRISE SIDEBAR */}
        <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 shadow-2xl z-20 border-r border-slate-800">
          <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-900/50">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3 shadow-lg shadow-blue-900/50">
              <Shield size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Swasthya<span className="font-normal text-slate-400">Admin</span>
            </h1>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            <button 
              onClick={() => setActiveView('commandCenter')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                activeView === 'commandCenter' 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm' 
                  : 'hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <Activity size={18} /> Command Center
            </button>
            <button 
              onClick={() => setActiveView('fieldWorkers')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                activeView === 'fieldWorkers' 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm' 
                  : 'hover:bg-slate-800 hover:text-white border border-transparent'
              }`}
            >
              <Users size={18} /> Field Workers (ASHA)
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
              <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-md flex items-center justify-center text-white font-bold">
                DR
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">Dr. R. Menon</p>
                <p className="text-xs text-slate-500 truncate">Chief Medical Officer</p>
              </div>
              <LogOut size={16} className="text-slate-500" />
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* TOP HEADER */}
          <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
            <div className="flex-1 max-w-xl flex items-center relative">
              <Search className="absolute left-3 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search districts, wards, or specific SS-IDs..." 
                className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 pl-10 pr-4 py-2 rounded-lg text-sm font-medium transition-all"
              />
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <button className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                <Download size={16} /> Export Report
              </button>
              <div className="w-px h-6 bg-slate-200 mx-2"></div>
              <button className="relative text-slate-500 hover:text-slate-800 transition-colors p-2">
                <Bell size={22} />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-severe-glow"></span>
              </button>
            </div>
          </header>

          {/* SCROLLABLE DASHBOARD CONTENT */}
          <main className="flex-1 overflow-y-auto p-8 bg-slate-50">
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* --- VIEW: COMMAND CENTER --- */}
              {activeView === 'commandCenter' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-1">District Overview: North Zone</h2>
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
                        <span className="text-3xl font-black text-slate-900">14,289</span>
                        <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1"><TrendingUp size={12}/> +124 this week</p>
                      </div>
                    </MagicBento>

                    <MagicBento glowColor="239, 68, 68" className="bg-white p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Triage</span>
                        <div className="p-1.5 bg-red-50 text-red-600 rounded-md"><AlertTriangle size={16} /></div>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-red-600">84</span>
                        <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1"><TrendingUp size={12}/> +12 requiring transfer</p>
                      </div>
                    </MagicBento>

                    <MagicBento glowColor="168, 85, 247" className="bg-white p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Maternal Tracks</span>
                        <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md"><Activity size={16} /></div>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-900">1,402</span>
                        <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1">89% ANC compliance</p>
                      </div>
                    </MagicBento>

                    <MagicBento glowColor="16, 185, 129" className="bg-white p-5 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Worker Status</span>
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md"><UserCheck size={16} /></div>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-900">42<span className="text-lg text-slate-400 font-medium">/45</span></span>
                        <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center gap-1"><Clock size={12}/> Synced in last 24h</p>
                      </div>
                    </MagicBento>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Ward Breakdown Table */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-800">Ward Triage Breakdown</h3>
                        <button className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">Export CSV</button>
                      </div>
                      <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-white text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                              <th className="px-6 py-4 font-semibold">Location</th>
                              <th className="px-6 py-4 font-semibold">Total Cases</th>
                              <th className="px-6 py-4 font-semibold text-red-600">Critical (Red)</th>
                              <th className="px-6 py-4 font-semibold">ASHA Assigned</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-sm font-bold text-slate-800">Ward 5 (South)</td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600">3,402</td>
                              <td className="px-6 py-4"><span className="px-2.5 py-1 bg-red-100 text-red-700 font-bold rounded text-xs border border-red-200">42 Cases</span></td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600">12 Workers</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-sm font-bold text-slate-800">Ward 4 (Central)</td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600">2,891</td>
                              <td className="px-6 py-4"><span className="px-2.5 py-1 bg-amber-100 text-amber-700 font-bold rounded text-xs border border-amber-200">18 Cases</span></td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600">10 Workers</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-sm font-bold text-slate-800">Ward 2 (East)</td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600">4,105</td>
                              <td className="px-6 py-4"><span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold rounded text-xs border border-emerald-200">5 Cases</span></td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600">15 Workers</td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-sm font-bold text-slate-800">Ward 1 (North)</td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600">1,200</td>
                              <td className="px-6 py-4"><span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold rounded text-xs border border-emerald-200">1 Case</span></td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-600">5 Workers</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Field Worker Fleet Status (Preview) */}
                    <div className="lg:col-span-1">
                      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                          <div>
                            <h3 className="font-bold text-slate-800">Fleet Quick View</h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time sync status</p>
                          </div>
                          <span className="p-2 bg-slate-200 rounded-md text-slate-600"><Users size={16}/></span>
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-10">
                    
                    {/* Geographic Map Placeholder */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative min-h-[340px]">
                      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 relative z-10">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <Map size={18} className="text-blue-600" /> Live Geographic Heatmap
                        </h3>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> GPS Active
                        </span>
                      </div>
                      
                      <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #0f172a 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                        <div className="absolute top-10 left-16 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl mix-blend-multiply"></div>
                        <div className="absolute bottom-6 right-24 w-64 h-64 bg-red-500/10 rounded-full blur-3xl mix-blend-multiply animate-pulse"></div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-3 text-blue-600 animate-bounce">
                            <MapPin size={32} />
                          </div>
                          <h4 className="font-bold text-slate-800 text-lg">Interactive Map View</h4>
                          <p className="text-sm text-slate-500 font-medium max-w-xs text-center mt-1">
                            GIS mapping of active cases across Ward 4 and Ward 5.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Case Trend Line Graph */}
                    <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <TrendingUp size={18} className="text-blue-600"/> 7-Day Case Trend
                        </h3>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-end mb-6">
                          <div>
                            <p className="text-3xl font-black text-slate-900">428</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Total Active Cases</p>
                          </div>
                          <div className="text-emerald-700 text-sm font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded">
                            ↓ 12%
                          </div>
                        </div>
                        
                        {/* Pure SVG Line Chart */}
                        <div className="flex-1 w-full relative mt-auto h-32">
                          <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgba(37, 99, 235, 0.4)" />
                                <stop offset="100%" stopColor="rgba(37, 99, 235, 0)" />
                              </linearGradient>
                            </defs>
                            <line x1="0" y1="10" x2="100" y2="10" stroke="#f1f5f9" strokeWidth="0.5" />
                            <line x1="0" y1="20" x2="100" y2="20" stroke="#f1f5f9" strokeWidth="0.5" />
                            <line x1="0" y1="30" x2="100" y2="30" stroke="#f1f5f9" strokeWidth="0.5" />
                            <path d="M0 40 L0 28 Q 15 15, 30 22 T 60 12 T 80 18 T 100 5 L 100 40 Z" fill="url(#chart-gradient)" />
                            <path d="M0 28 Q 15 15, 30 22 T 60 12 T 80 18 T 100 5" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="30" cy="22" r="1.5" fill="white" stroke="#2563eb" strokeWidth="1" />
                            <circle cx="60" cy="12" r="1.5" fill="white" stroke="#2563eb" strokeWidth="1" />
                            <circle cx="80" cy="18" r="1.5" fill="white" stroke="#2563eb" strokeWidth="1" />
                            <circle cx="100" cy="5" r="1.5" fill="white" stroke="#2563eb" strokeWidth="1.5" className="animate-pulse" />
                          </svg>
                        </div>
                        
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-4">
                          <span>Mon</span>
                          <span>Wed</span>
                          <span>Fri</span>
                          <span>Today</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI EPIDEMIC INSIGHTS */}
                  <div className="mt-8 mb-10 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Activity size={18} className="text-purple-600" /> AI Epidemic & Outbreak Analysis
                      </h3>
                      <button onClick={runEpidemicAlert} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
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
                        <div className="text-center py-12 text-purple-600 animate-pulse font-medium">
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
                      <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
                        Filter by Ward
                      </button>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                        + Add Worker
                      </button>
                    </div>
                  </div>

                  {/* Clean Data Table for Field Workers */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Users size={18} className="text-blue-600" /> Active Roster
                      </h3>
                      <span className="text-xs font-bold text-slate-500 uppercase bg-slate-200 px-2 py-1 rounded">Total: {fieldWorkers.length}</span>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                            <th className="px-6 py-4 font-semibold">Worker Details</th>
                            <th className="px-6 py-4 font-semibold">Assigned Ward</th>
                            <th className="px-6 py-4 font-semibold">Network Status</th>
                            <th className="px-6 py-4 font-semibold">Patient Load</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {fieldWorkers.map((worker) => (
                            <tr key={worker.id} className="hover:bg-slate-50 transition-colors group">
                              {/* Worker Details Column */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center">
                                    {worker.name.split(' ').map(n=>n[0]).join('')}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">{worker.name}</p>
                                    <p className="text-xs font-medium text-slate-500">ID: {worker.id}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Ward Column */}
                              <td className="px-6 py-4">
                                <span className="text-sm font-semibold text-slate-700">{worker.ward}</span>
                              </td>

                              {/* Status Column */}
                              <td className="px-6 py-4">
                                <div>
                                  {worker.status === 'online' ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                                      <span className="w-2 h-2 rounded-full bg-slate-400"></span> Offline
                                    </span>
                                  )}
                                  <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                                    <Clock size={10} /> Sync: {worker.lastSync}
                                  </p>
                                </div>
                              </td>

                              {/* Patient Load Column */}
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-semibold text-slate-700">
                                    {worker.cases} Total Managed
                                  </span>
                                  {worker.critical > 0 ? (
                                    <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                                      <AlertTriangle size={12} /> {worker.critical} High Risk
                                    </span>
                                  ) : (
                                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                                      <CheckCircle2 size={12} /> No critical cases
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Actions Column */}
                              <td className="px-6 py-4 text-right">
                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                  <MoreVertical size={20} />
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
    </>
  );
}
