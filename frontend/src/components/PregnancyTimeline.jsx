import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Activity, ChevronDown, ChevronUp, AlertTriangle, Info, Coffee } from 'lucide-react';
import { getStoredToken } from '../auth-utils';

export default function PregnancyTimeline({ patient }) {
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTimeline = async (isRegenerating = false) => {
    try {
      setLoading(true);
      setError(null);
      const token = await getStoredToken();
      
      let currentMonth = 1; // Default to Month 1 if no date
      const lmpSource = patient?.pregnancyStartDate || patient?.lmp;
      
      if (lmpSource) {
        const lmpDate = new Date(lmpSource);
        const now = new Date();
        const diffInMonths = (now.getFullYear() - lmpDate.getFullYear()) * 12 + now.getMonth() - lmpDate.getMonth();
        // Shift by 1 since Month 1 starts from day 0
        const calculatedMonth = diffInMonths + 1;
        if (calculatedMonth >= 1 && calculatedMonth <= 9) currentMonth = calculatedMonth;
        else if (calculatedMonth > 9) currentMonth = 9;
      }

      const response = await fetch('http://localhost:5000/ai/timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          age: patient?.age || 25,
          conditions: patient?.conditions || "None",
          currentMonth: currentMonth,
          forceRefresh: isRegenerating
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI timeline');
      }

      const result = await response.json();
      setTimelineData(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [patient]);

  const toggleMonth = (monthNum, isLocked) => {
    if (isLocked) return;
    setExpandedMonth(prev => prev === monthNum ? null : monthNum);
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Activity size={20} className="text-emerald-500" /> AI Growth Timeline
        </h3>
        <button 
          onClick={() => fetchTimeline(true)}
          disabled={loading}
          className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Re-generate Roadmap'}
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden p-6 sm:p-8 min-h-[200px] relative">
        <p className="text-slate-500 font-medium mb-6 text-sm">
          A personalized clinical foresight model generated for this patient by Gemini 2.5 Flash.
        </p>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-emerald-600 font-medium animate-pulse">Running AI Analysis...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 font-medium flex gap-2">
            <AlertTriangle/> {error}
          </div>
        ) : (
          <motion.div 
            initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="relative border-l-2 border-slate-200/60 pl-6 ml-4 space-y-8"
          >
            {timelineData.map((month, idx) => {
              const isExpanded = expandedMonth === month.monthNumber;
              const isLocked = !month.isCurrent && !month.isCompleted;
              
              let pulseBorder = "";
              let iconBg = "";
              let iconComponent = null;

              if (month.isCurrent) {
                pulseBorder = "ring-4 ring-emerald-500/20 bg-white border-emerald-500 scale-105 shadow-lg shadow-emerald-500/10";
                iconBg = "bg-emerald-500 text-white shadow-md shadow-emerald-500/20";
                iconComponent = <Activity size={18} />;
              } else if (month.isCompleted) {
                pulseBorder = "bg-white border-emerald-200 opacity-90";
                iconBg = "bg-emerald-50 text-emerald-600 border border-emerald-200";
                iconComponent = <CheckCircle size={18} />;
              } else {
                pulseBorder = "bg-slate-50/50 border-slate-200/60 grayscale-[0.8]";
                iconBg = "bg-slate-200 text-slate-400";
                iconComponent = <Lock size={16} />;
              }

              return (
                <motion.div 
                  variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                  key={month.monthNumber} className="relative"
                >
                  <div className={`absolute -left-[37px] top-4 w-7 h-7 rounded-full flex items-center justify-center z-10 ${iconBg}`}>
                    {iconComponent}
                  </div>

                  <div 
                    onClick={() => toggleMonth(month.monthNumber, isLocked)}
                    className={`relative p-5 rounded-2xl border transition-all duration-300 backdrop-blur-md ${pulseBorder} ${!isLocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <h4 className={`font-black text-lg ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
                          {month.title} <span className="text-sm font-medium ml-2 opacity-70">(Month {month.monthNumber})</span>
                        </h4>
                        <p className={`text-sm mt-1 font-medium ${isLocked ? 'text-slate-400' : 'text-slate-600'}`}>
                          {month.summary}
                        </p>
                      </div>
                      
                      {!isLocked && (
                        <div className="p-2 text-slate-400 shrink-0">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && !isLocked && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-6 pt-5 border-t border-slate-200/50 flex flex-col gap-4">
                            <div className="bg-white/60 backdrop-blur-sm shadow-inner rounded-xl p-5 border border-white/80">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-emerald-50 rounded-xl">
                                  <Coffee size={18} className="text-emerald-500" />
                                </div>
                                <h4 className="text-sm font-bold text-emerald-900">Health Guidelines</h4>
                              </div>
                              <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                  <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                  <div>
                                    <h5 className="text-xs font-bold text-slate-500 uppercase">Expected Symptoms</h5>
                                    <p className="text-sm font-medium text-slate-700 mt-1">{month.symptoms}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <Coffee size={16} className="text-amber-500 mt-0.5 shrink-0" />
                                  <div>
                                    <h5 className="text-xs font-bold text-slate-500 uppercase">Dietary Advice</h5>
                                    <p className="text-sm font-medium text-slate-700 mt-1">{month.dietaryAdvice}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                                  <div>
                                    <h5 className="text-xs font-bold text-slate-500 uppercase">Red Flags to Watch</h5>
                                    <p className="text-sm font-medium text-slate-700 mt-1">{month.warnings}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
