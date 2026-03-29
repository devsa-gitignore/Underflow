import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, Bell, CloudOff, Plus, Languages, ChevronRight,
  Search, LayoutDashboard, Users, Baby, RefreshCw, 
  Settings, LogOut, ShieldAlert, UploadCloud, ClipboardList
} from 'lucide-react';
import { useLanguage } from './language-context';
import { getStoredToken } from './auth-utils';
import { getQueue } from './sync-utils';
import { useOfflineSync } from './OfflineSyncContext';

export default function Layout() {
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();

  const isActive = (path) => {
    if (path === '/directory' && location.pathname.startsWith('/patient')) return true;
    return location.pathname === path;
  };
  const text = language === 'hi'
    ? {
        workspace: 'कार्यस्थान',
        dashboard: 'डैशबोर्ड',
        directory: 'रोगी सूची',
        addPatient: 'रोगी जोड़ें',
        maternalCare: 'मातृ देखभाल',
        system: 'सिस्टम',
        offlineMode: 'ऑफलाइन मोड',
        preferences: 'प्राथमिकताएं',
        alerts: 'अलर्ट',
        tasks: 'लंबित कार्य',
        search: 'रजिस्ट्री खोजें...',
        offlineStatus: 'ऑफलाइन कार्यरत',
        syncedStatus: 'सिंक हो गया',
        newVisit: 'नई विजिट',
        switchToHindi: 'हिंदी',
        switchToEnglish: 'English',
      }
    : {
        workspace: 'Workspace',
        dashboard: 'Dashboard',
        directory: 'Patient Directory',
        addPatient: 'Add Patient',
        maternalCare: 'Maternal Care',
        system: 'System',
        offlineMode: 'Offline Mode',
        preferences: 'Preferences',
        alerts: 'Health Alerts',
        tasks: 'Compliance Tasks',
        search: 'Search registry...',
        offlineStatus: 'Working Offline',
        syncedStatus: 'Synced',
        newVisit: 'New Visit',
        switchToHindi: 'हिंदी',
        switchToEnglish: 'English',
        syncNow: 'Sync Now',
        syncing: 'Syncing Data...',
      };

  const [queueLength, setQueueLength]   = useState(0);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitSearch, setVisitSearch]     = useState('');
  const [visitPatients, setVisitPatients] = useState([]);
  const [visitLoading, setVisitLoading]   = useState(false);
  const navigate = useNavigate();

  // Pull live sync state from the global context
  const { isOnline, isSyncing, syncNow, queueLength: ctxQueueLength } = useOfflineSync();
  const isOffline = !isOnline;

  // Hook to track real network status and queue items
  useEffect(() => {
    const updateQueueSize = () => setQueueLength(getQueue().length);
    updateQueueSize();
    window.addEventListener('syncUpdate', updateQueueSize);
    window.addEventListener('syncComplete', updateQueueSize);
    const interval = setInterval(updateQueueSize, 2000);
    return () => {
      window.removeEventListener('syncUpdate', updateQueueSize);
      window.removeEventListener('syncComplete', updateQueueSize);
      clearInterval(interval);
    };
  }, []);

  const openVisitModal = async () => {
    setShowVisitModal(true);
    setVisitSearch('');
    setVisitLoading(true);
    try {
      const token = await getStoredToken();
      const res = await fetch('http://localhost:5000/patients/search', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setVisitPatients(data);
    } catch {
      setVisitPatients([]);
    } finally {
      setVisitLoading(false);
    }
  };

  const filteredVisitPatients = visitPatients.filter(p =>
    p.name?.toLowerCase().includes(visitSearch.toLowerCase()) ||
    p.village?.toLowerCase().includes(visitSearch.toLowerCase())
  );

  // handleManualSync is now provided by OfflineSyncContext (syncNow)
  // Kept as alias for the button onClick below
  const handleManualSync = syncNow;

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('swasthya_user');
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('swasthya_token');
    localStorage.removeItem('swasthya_user');
    navigate('/login');
  };

  return (
    <div className="h-screen bg-slate-50/50 flex font-inter text-slate-900 overflow-hidden w-full">
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className="w-64 bg-slate-900 flex flex-col hidden md:flex shrink-0 z-20">
        <Link to="/dashboard" className="h-16 flex items-center px-6 border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer">
          <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center mr-3">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-5A1.5 1.5 0 0112.5 10h1a1.5 1.5 0 011.5 1.5v5a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5zm1-8.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Swasthya<span className="font-normal text-slate-400">Sathi</span>
          </h1>
        </Link>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{text.workspace}</p>
          
          <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard') ? 'bg-emerald-900/40 text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
            <LayoutDashboard size={18} /> {text.dashboard}
          </Link>
          <Link to="/directory" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/directory') ? 'bg-emerald-900/40 text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
            <Users size={18} /> {text.directory}
          </Link>
          <Link to="/add-patient" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/add-patient') ? 'bg-emerald-900/40 text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
            <Plus size={18} /> {text.addPatient}
          </Link>
          <Link to="/tasks" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/tasks') ? 'bg-emerald-900/40 text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
            <ClipboardList size={18} /> {text.tasks}
          </Link>

          
          <p className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 mt-8">{text.system}</p>
          
          <div className="px-3 py-2">
            <div className="w-full flex items-center justify-between text-slate-400 rounded-md text-sm font-medium transition-colors cursor-default mb-2">
              <div className="flex items-center gap-3">
                <RefreshCw size={18} /> {text.offlineMode}
              </div>
              <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-400' : 'bg-teal-400'}`} />
            </div>
            
            {queueLength > 0 && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing || isOffline}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 rounded-md text-sm font-medium transition-colors ${
                  isOffline || isSyncing 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'
                }`}
              >
                <UploadCloud size={16} className={isSyncing ? "animate-bounce" : ""} />
                {isSyncing ? text.syncing : `${text.syncNow} (${queueLength})`}
              </button>
            )}
          </div>

        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg group transition-colors text-white">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-xs font-semibold shadow-inner">
              {currentUser ? currentUser.name.split(' ').map(n => n[0]).join('') : 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{currentUser ? currentUser.name : 'Guest User'}</p>
              <p className="text-[10px] text-slate-500 font-bold tracking-tight truncate uppercase">{currentUser ? (currentUser.region || 'Village Worker') : 'Access Pending'}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 hover:bg-slate-700 rounded-md text-slate-500 hover:text-white transition-all"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 transition-all">
          <button className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors mr-3">
            <Menu size={20} />
          </button>

          {/* <div className="flex-1 max-w-md flex items-center relative hidden sm:flex">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={text.search}
              className="w-full bg-slate-50 focus:bg-white border border-transparent focus:border-slate-300 pl-9 pr-4 py-2 rounded-lg text-sm transition-all outline-none"
            />
          </div> */}

          <div className="flex items-center gap-4 ml-auto">
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Languages size={16} />
              {language === 'en' ? text.switchToHindi : text.switchToEnglish}
            </button>
            <div className="hidden lg:flex items-center gap-2">
              {queueLength > 0 ? (
                <button 
                  onClick={handleManualSync}
                  disabled={isSyncing || isOffline}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                    isOffline || isSyncing 
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <UploadCloud size={14} className={isSyncing ? "animate-bounce" : ""} />
                  {isSyncing ? text.syncing : `${text.syncNow} (${queueLength})`}
                </button>
              ) : (
                <div className="flex items-center gap-2 px-2">
                  <span className="text-xs font-medium text-slate-500">{isOffline ? text.offlineStatus : text.syncedStatus}</span>
                  <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-500' : 'bg-teal-500'}`} />
                </div>
              )}
            </div>
            
            <div className="h-6 w-px bg-slate-200 hidden lg:block mx-1"></div>
            
            <Link to="/alerts" className={`relative transition-colors p-1 ${isActive('/alerts') ? 'text-red-500' : 'text-slate-500 hover:text-slate-800'}`}>
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </Link>

            <button onClick={openVisitModal} className="hidden sm:flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors ml-2">
              <Plus size={16} /> {text.newVisit}
            </button>
          </div>
        </header>

        {/* SCROLLABLE CONTENT RENDERED VIA OUTLET */}
        <main className="flex-1 overflow-y-auto w-full max-w-full">
          <Outlet />
        </main>
      </div>

      {/* NEW VISIT — PATIENT PICKER MODAL */}
      {showVisitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowVisitModal(false)}>
          <div className="bg-white w-full max-w-md mx-4 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">New Visit</h3>
                <p className="text-sm text-slate-400 mt-0.5">Select a patient to log a visit</p>
              </div>
              <button onClick={() => setShowVisitModal(false)} className="p-2 rounded-xl hover:bg-slate-800 transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by name or village..."
                  value={visitSearch}
                  onChange={e => setVisitSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-400 bg-slate-50"
                />
              </div>
            </div>

            {/* Patient List */}
            <div className="overflow-y-auto max-h-80">
              {visitLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Loading patients...
                </div>
              ) : filteredVisitPatients.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">No patients found.</div>
              ) : (
                filteredVisitPatients.map(p => (
                  <button
                    key={p._id}
                    onClick={() => { setShowVisitModal(false); navigate(`/patient/${p._id}`); }}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-emerald-50 transition-colors border-b border-slate-50 text-left group"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      p.currentRiskLevel === 'CRITICAL' || p.currentRiskLevel === 'HIGH' ? 'bg-red-100 text-red-700' :
                      p.currentRiskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">Age {p.age} &bull; {p.village || 'Unassigned'}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                  </button>
                ))
              )}
            </div>

            {/* Add new patient footer */}
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => { setShowVisitModal(false); navigate('/add-patient'); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition-all shadow-sm"
              >
                <Plus size={16} /> Register New Patient Instead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
