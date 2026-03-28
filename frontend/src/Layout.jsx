import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Menu, Bell, CloudOff, Plus, Languages,
  Search, LayoutDashboard, Users, Baby, RefreshCw, 
  Settings, LogOut 
} from 'lucide-react';
import { useLanguage } from './language-context';

export default function Layout() {
  const [isOffline, setIsOffline] = useState(false);
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();

  const isActive = (path) => location.pathname === path;
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
        search: 'Search registry...',
        offlineStatus: 'Working Offline',
        syncedStatus: 'Synced',
        newVisit: 'New Visit',
        switchToHindi: 'हिंदी',
        switchToEnglish: 'English',
      };

  return (
    <div className="h-screen bg-slate-50/50 flex font-inter text-slate-900 overflow-hidden w-full">
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className="w-64 bg-slate-900 flex flex-col hidden md:flex shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-teal-500 rounded-md flex items-center justify-center mr-3">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-5A1.5 1.5 0 0112.5 10h1a1.5 1.5 0 011.5 1.5v5a1.5 1.5 0 01-1.5 1.5h-1a1.5 1.5 0 01-1.5-1.5zm1-8.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Swasthya<span className="font-normal text-slate-400">Sathi</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{text.workspace}</p>
          
          <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard') ? 'bg-teal-900/40 text-teal-400' : 'text-slate-400 hover:text-white'}`}>
            <LayoutDashboard size={18} /> {text.dashboard}
          </Link>
          <Link to="/directory" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/directory') ? 'bg-teal-900/40 text-teal-400' : 'text-slate-400 hover:text-white'}`}>
            <Users size={18} /> {text.directory}
          </Link>
          <Link to="/add-patient" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/add-patient') ? 'bg-teal-900/40 text-teal-400' : 'text-slate-400 hover:text-white'}`}>
            <Plus size={18} /> {text.addPatient}
          </Link>
          
          <p className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 mt-8">{text.system}</p>
          
          <button 
            onClick={() => setIsOffline(!isOffline)}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white rounded-md text-sm font-medium transition-colors"
          >
            <div className="flex items-center gap-3">
              <RefreshCw size={18} /> {text.offlineMode}
            </div>
            <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-400' : 'bg-teal-400'}`} />
          </button>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white rounded-md text-sm font-medium transition-colors">
            <Settings size={18} /> {text.preferences}
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link to="/" className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors text-white">
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-xs font-semibold">
              JN
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">Jash Nikombhe</p>
              <p className="text-xs text-slate-400 truncate">AW-1029</p>
            </div>
            <LogOut size={16} className="text-slate-500 hover:text-white" />
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 transition-all">
          <button className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors mr-3">
            <Menu size={20} />
          </button>

          <div className="flex-1 max-w-md flex items-center relative hidden sm:flex">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={text.search}
              className="w-full bg-slate-50 focus:bg-white border border-transparent focus:border-slate-300 pl-9 pr-4 py-2 rounded-lg text-sm transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-2 border border-slate-200 bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Languages size={16} />
              {language === 'en' ? text.switchToHindi : text.switchToEnglish}
            </button>
            <div className="hidden lg:flex items-center gap-2 cursor-pointer" onClick={() => setIsOffline(!isOffline)}>
              <span className="text-xs font-medium text-slate-500">{isOffline ? text.offlineStatus : text.syncedStatus}</span>
              <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-500' : 'bg-teal-500'}`} />
            </div>
            
            <div className="h-6 w-px bg-slate-200 hidden lg:block mx-1"></div>
            
            <button className="relative text-slate-500 hover:text-slate-800 transition-colors p-1">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            <Link to="/add-patient" className="hidden sm:flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors ml-2">
              <Plus size={16} /> {text.newVisit}
            </Link>
          </div>
        </header>

        {/* SCROLLABLE CONTENT RENDERED VIA OUTLET */}
        <main className="flex-1 overflow-y-auto w-full max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
