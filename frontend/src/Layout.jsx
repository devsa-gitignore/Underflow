import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Menu, Bell, CloudOff, Plus, 
  Search, LayoutDashboard, Users, Baby, RefreshCw, 
  Settings, LogOut 
} from 'lucide-react';

export default function Layout() {
  const [isOffline, setIsOffline] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

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
          <p className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Workspace</p>
          
          <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard') ? 'bg-teal-900/40 text-teal-400' : 'text-slate-400 hover:text-white'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          <Link to="/directory" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/directory') ? 'bg-teal-900/40 text-teal-400' : 'text-slate-400 hover:text-white'}`}>
            <Users size={18} /> Patient Directory
          </Link>
          <Link to="/add-patient" className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/add-patient') ? 'bg-teal-900/40 text-teal-400' : 'text-slate-400 hover:text-white'}`}>
            <Plus size={18} /> Add Patient
          </Link>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white rounded-md text-sm font-medium transition-colors">
            <Baby size={18} /> Maternal Care
          </a>
          
          <p className="px-3 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 mt-8">System</p>
          
          <button 
            onClick={() => setIsOffline(!isOffline)}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white rounded-md text-sm font-medium transition-colors"
          >
            <div className="flex items-center gap-3">
              <RefreshCw size={18} /> Offline Mode
            </div>
            <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-400' : 'bg-teal-400'}`} />
          </button>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white rounded-md text-sm font-medium transition-colors">
            <Settings size={18} /> Preferences
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link to="/" className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors text-white">
            <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs font-medium">
              AS
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">Aarti Sharma</p>
              <p className="text-xs text-slate-400 truncate">AW-7782</p>
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
              placeholder="Search registry..." 
              className="w-full bg-slate-50 focus:bg-white border border-transparent focus:border-slate-300 pl-9 pr-4 py-2 rounded-lg text-sm transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <div className="hidden lg:flex items-center gap-2 cursor-pointer" onClick={() => setIsOffline(!isOffline)}>
              <span className="text-xs font-medium text-slate-500">{isOffline ? 'Working Offline' : 'Synced'}</span>
              <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-500' : 'bg-teal-500'}`} />
            </div>
            
            <div className="h-6 w-px bg-slate-200 hidden lg:block mx-1"></div>
            
            <button className="relative text-slate-500 hover:text-slate-800 transition-colors p-1">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            <Link to="/add-patient" className="hidden sm:flex items-center gap-1.5 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors ml-2">
              <Plus size={16} /> New Visit
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
