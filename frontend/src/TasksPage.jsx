import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, CalendarX2, CheckCircle2, RotateCw, Activity, Syringe, Stethoscope, AlertTriangle, History, X, Plus, ChevronDown, Trash2, Edit3 } from 'lucide-react';
import { getStoredToken } from './auth-utils';
import { useLanguage } from './language-context';

const typeIcons = {
  VACCINATION: Syringe,
  CHECKUP: Stethoscope,
  MEDICATION: Activity
};

const mockTasks = [
  {
    _id: `m-1`,
    patientId: { _id: 'mock-1', name: 'Aarti Sharma' },
    type: 'VACCINATION',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Missed Tetanus Toxoid Booster dose scheduled on Monday.'
  },
  {
    _id: `m-2`,
    patientId: { _id: 'mock-2', name: 'Rahul Kumar' },
    type: 'CHECKUP',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Did not arrive for scheduled routine pediatric assessment.'
  }
];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  
  // History Modal States
  const [historyPatient, setHistoryPatient] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  
  // New Log & Globals Modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [showPatientListModal, setShowPatientListModal] = useState(false);
  const [allPatients, setAllPatients] = useState([]);
  const [logForm, setLogForm] = useState({ patientId: '', type: 'VACCINATION', status: 'PENDING', notes: '' });

  const navigate = useNavigate();
  const { language } = useLanguage();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getStoredToken();
      const res = await fetch('http://localhost:5000/compliance/missed', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Uses missedActions as returned by controller
        setTasks((data.missedActions && data.missedActions.length > 0) ? data.missedActions : mockTasks);
      } else {
        setTasks(mockTasks);
      }
    } catch (err) {
      console.error("Failed to fetch missed tasks, rendering mock demo data:", err);
      setTasks(mockTasks);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleLogCompliance = async (task, status) => {
    setUpdatingId(task._id);
    try {
      const token = await getStoredToken();
      const payload = {
        notes: `Marked as ${status} from Tasks Dashboard.`
      };

      const res = await fetch(`http://localhost:5000/compliance/${task._id}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setTasks(prev => prev.filter(t => t._id !== task._id));
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      // In demo mode for mock data, just visually remove it
      if (task._id.startsWith('m-')) {
        setTasks(prev => prev.filter(t => t._id !== task._id));
      } else {
        alert("Error saving compliance action.");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const fetchHistory = async (patientId, patientName) => {
    setHistoryPatient({ id: patientId, name: patientName, loading: true });
    try {
      const token = await getStoredToken();
      const res = await fetch(`http://localhost:5000/patients/${patientId}/compliance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setHistoryData([]);
    } finally {
      setHistoryPatient(prev => ({ ...prev, loading: false }));
    }
  };

  const handleOpenPatientListModal = async () => {
    setShowPatientListModal(true);
    try {
      const token = await getStoredToken();
      const res = await fetch('http://localhost:5000/patients/search?assigned=true', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setAllPatients(await res.json());
      }
    } catch {}
  };

  const handleOpenLogModal = async () => {
    setShowLogModal(true);
    try {
      const token = await getStoredToken();
      // Using the correct backend route to fetch patients explicitly locked to this user
      const res = await fetch('http://localhost:5000/patients/search?assigned=true', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const pData = await res.json();
        setAllPatients(pData);
        if (pData.length > 0) {
          setLogForm(f => ({ ...f, patientId: pData[0]._id }));
        }
      }
    } catch {}
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdatingId('new');
      const token = await getStoredToken();
      const res = await fetch('http://localhost:5000/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(logForm)
      });
      if (res.ok) {
        setShowLogModal(false);
        fetchTasks();
      } else {
        alert("Failed to create log.");
      }
    } catch {
      alert("Error submitting.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteTask = async (taskId, isHistory = false) => {
    if (!window.confirm("Are you sure you want to permanently delete this task?")) return;
    setUpdatingId(taskId);
    try {
      const token = await getStoredToken();
      const res = await fetch(`http://localhost:5000/compliance/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        if (isHistory) {
          setHistoryData(prev => prev.filter(t => t._id !== taskId));
        } else {
          setTasks(prev => prev.filter(t => t._id !== taskId));
        }
      } else {
        alert("Failed to delete record.");
      }
    } catch {
      alert("Error deleting record.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditNote = async (taskId, currentNotes, isHistory = false) => {
    const newNotes = window.prompt("Edit Note:", currentNotes || "");
    if (newNotes === null) return; // User cancelled

    setUpdatingId(taskId);
    try {
      const token = await getStoredToken();
      const res = await fetch(`http://localhost:5000/compliance/${taskId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: newNotes })
      });
      if (res.ok) {
        if (isHistory) {
          setHistoryData(prev => prev.map(t => t._id === taskId ? { ...t, notes: newNotes } : t));
        } else {
          setTasks(prev => prev.map(t => t._id === taskId ? { ...t, notes: newNotes } : t));
        }
      } else {
        alert("Failed to update note.");
      }
    } catch {
      alert("Error updating note.");
    } finally {
      setUpdatingId(null);
    }
  };

  const validTasks = tasks.filter(t => t && t.patientId);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 font-inter">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <ClipboardList className="text-emerald-600" size={28} /> 
              Pending & Missed Tasks
            </h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight mt-1">Review and log pending compliance actions for your assigned patients.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleOpenPatientListModal}
              className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition shadow-sm text-sm flex items-center gap-2"
            >
              <History size={16} /> View History
            </button>
            <button 
              onClick={handleOpenLogModal}
              className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition shadow-sm text-sm flex items-center gap-2"
            >
              <Plus size={16} /> New Task
            </button>
            <button 
              onClick={fetchTasks}
              className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition shadow-sm text-slate-600"
            >
              <RotateCw size={18} className={loading && "animate-spin"} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <RotateCw size={32} className="text-emerald-500 animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-500">Scanning registry for tasks...</p>
          </div>
        ) : validTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200 rounded-3xl text-center shadow-sm">
            <CheckCircle2 size={48} className="text-emerald-400 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">All caught up!</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">There are no missed compliance actions for your patients at this time.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {validTasks.map(task => {
                const Icon = typeIcons[task.type] || Activity;
                return (
                  <motion.div 
                    key={task._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <Icon size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 
                            className="font-bold text-slate-900 text-lg hover:text-emerald-600 cursor-pointer transition-colors"
                            onClick={() => fetchHistory(task.patientId._id || task.patientId, task.patientId.name)}
                          >
                            {task.patientId.name}
                          </h3>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-[10px] uppercase font-bold tracking-wider rounded-md">
                            {task.type}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-600 flex items-center gap-1.5 mt-1">
                          <CalendarX2 size={16} className={task.status === 'PENDING' ? 'text-blue-400' : 'text-slate-400'} />
                          {task.status === 'PENDING' ? 'Scheduled for:' : 'Missed since:'} <span className="font-semibold text-slate-700">{new Date(task.date).toLocaleDateString()}</span>
                        </p>
                        <div className="flex items-start gap-2 mt-2">
                          {task.notes ? (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex-1 relative pr-8">
                              "{task.notes}"
                              <button onClick={() => handleEditNote(task._id, task.notes)} className="absolute right-2 top-2 text-slate-400 hover:text-blue-500 transition-colors bg-slate-50 pl-1"><Edit3 size={14}/></button>
                            </p>
                          ) : (
                            <button onClick={() => handleEditNote(task._id, "")} className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:underline"><Plus size={12}/> Add Note</button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0 items-center">
                      <button 
                        onClick={() => handleDeleteTask(task._id)}
                        disabled={updatingId === task._id}
                        className="p-2.5 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all disabled:opacity-50"
                        title="Delete Task"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleLogCompliance(task, 'COMPLETED')}
                        disabled={updatingId === task._id}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-[0_4px_15px_rgba(16,185,129,0.2)] hover:bg-emerald-500 hover:-translate-y-0.5 transition-all text-center flex justify-center items-center gap-2"
                      >
                        {updatingId === task._id ? <RotateCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 
                        Resolved
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {historyPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setHistoryPatient(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[80vh]"
            >
              <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2"><History size={20} className="text-emerald-400"/> Compliance History</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{historyPatient.name}</p>
                </div>
                <button onClick={() => setHistoryPatient(null)} className="p-2 rounded-xl hover:bg-slate-800 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1">
                {historyPatient.loading ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <RotateCw size={24} className="text-emerald-500 animate-spin mb-3" />
                    <p className="text-sm text-slate-500 font-medium">Fetching records...</p>
                  </div>
                ) : historyData.length === 0 ? (
                  <div className="text-center py-10">
                    <History size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No previous compliance records found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historyData.map((log) => {
                      const LIcon = typeIcons[log.type] || Activity;
                      return (
                        <div key={log._id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${log.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                            <LIcon size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-900">{log.type}</span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${log.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                {log.status}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">{new Date(log.date).toLocaleString()}</p>
                            <div className="flex items-start gap-2 mt-1 w-full">
                              {log.notes ? (
                                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex-1 relative pr-8">
                                  "{log.notes}"
                                  <button onClick={() => handleEditNote(log._id, log.notes, true)} className="absolute right-2 top-2 text-slate-400 hover:text-blue-500 transition-colors bg-slate-50 pl-1"><Edit3 size={14}/></button>
                                </p>
                              ) : (
                                <button onClick={() => handleEditNote(log._id, "", true)} className="text-xs text-blue-500 font-medium flex items-center gap-1 hover:underline"><Plus size={12}/> Add Note</button>
                              )}
                            </div>
                          </div>
                          <button  
                            onClick={() => handleDeleteTask(log._id, true)}
                            disabled={updatingId === log._id}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-auto disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Log Modal */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col"
            >
              <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
                <h3 className="font-bold text-lg flex items-center gap-2"><ClipboardList size={20} className="text-emerald-400"/> Create Task</h3>
                <button onClick={() => setShowLogModal(false)} className="p-2 rounded-xl hover:bg-slate-800 transition-colors"><X size={20} /></button>
              </div>
              <form className="p-6 space-y-5" onSubmit={handleLogSubmit}>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Assigned Patient</label>
                  <div className="relative">
                    <select 
                      className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all hover:bg-white"
                      value={logForm.patientId} 
                      onChange={e => setLogForm({...logForm, patientId: e.target.value})} 
                      required
                    >
                      <option value="" disabled>-- Select Patient --</option>
                      {allPatients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Task Category</label>
                  <div className="relative">
                    <select 
                      className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all hover:bg-white" 
                      value={logForm.type} 
                      onChange={e => setLogForm({...logForm, type: e.target.value})} 
                      required
                    >
                      <option value="VACCINATION">Vaccination</option>
                      <option value="CHECKUP">Checkup</option>
                      <option value="MEDICATION">Medication</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Completion Status</label>
                  <div className="relative">
                    <select 
                      className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all hover:bg-white" 
                      value={logForm.status} 
                      onChange={e => setLogForm({...logForm, status: e.target.value})} 
                      required
                    >
                      <option value="PENDING">Pending (Scheduled)</option>
                      <option value="MISSED">Missed</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Optional Notes</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all focus:bg-white hover:bg-white" 
                    placeholder="Enter context or details..." 
                    value={logForm.notes} 
                    onChange={e => setLogForm({...logForm, notes: e.target.value})} 
                  />
                </div>
                <button type="submit" disabled={updatingId === 'new' || !logForm.patientId} className="w-full mt-4 px-6 py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-500 transition-all shadow-[0_4px_15px_rgba(16,185,129,0.2)] flex justify-center items-center gap-2 disabled:opacity-50">
                  {updatingId === 'new' ? <RotateCw size={18} className="animate-spin" /> : <Plus size={18} />} Save Record
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Select Patient for History Modal */}
      <AnimatePresence>
        {showPatientListModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowPatientListModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col max-h-[70vh]"
            >
              <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
                <h3 className="font-bold text-lg flex items-center gap-2"><History size={20} className="text-blue-400"/> Patient Directory</h3>
                <button onClick={() => setShowPatientListModal(false)} className="p-2 rounded-xl hover:bg-slate-800 transition-colors"><X size={20} /></button>
              </div>
              <div className="p-4 overflow-y-auto space-y-2 bg-slate-50/50 flex-1">
                {allPatients.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 font-medium py-10">Searching for assigned patients...</p>
                ) : (
                  allPatients.map(p => (
                    <button 
                      key={p._id}
                      onClick={() => {
                        setShowPatientListModal(false);
                        fetchHistory(p._id, p.name);
                      }}
                      className="w-full text-left bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex justify-between items-center group"
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{p.name}</h4>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">{p.village}</p>
                      </div>
                      <History size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
