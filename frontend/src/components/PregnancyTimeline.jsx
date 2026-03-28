import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Activity, ChevronDown, ChevronUp, AlertTriangle, Info, Coffee } from 'lucide-react';
import { getStoredToken } from '../auth-utils';

export default function PregnancyTimeline({ patient }) {
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const token = await getStoredToken();
        
        // Calculate rough current month from LMP if available, else default to 5
        let currentMonth = 5;
        if (patient?.lmp) {
          const lmpDate = new Date(patient.lmp);
          const now = new Date();
          const diffInMonths = (now.getFullYear() - lmpDate.getFullYear()) * 12 + now.getMonth() - lmpDate.getMonth();
          if (diffInMonths > 0 && diffInMonths <= 9) currentMonth = diffInMonths;
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
            currentMonth: currentMonth
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
        <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          Smart Path Active
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 min-h-[200px] relative">
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
          <div className="relative border-l-2 border-slate-100 pl-6 ml-4 space-y-8">
            {timelineData.map((month) => {
              const isExpanded = expandedMonth === month.monthNumber;
              const isLocked = !month.isCurrent && month.monthNumber > 1 && !timelineData.find(m => m.isCurrent && m.monthNumber >= month.monthNumber); // simplified lock logic
              
              // Dynamic styling based on the state of the month
              let pulseBorder = "";
              let iconBg = "";
              let iconComponent = null;

              if (month.isCurrent) {
                pulseBorder = "border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-2 ring-emerald-50";
                iconBg = "bg-emerald-500 text-white animate-pulse shadow-lg shadow-emerald-200";
                iconComponent = <Activity size={16} />;
              } else if (isLocked) {
                pulseBorder = "border-slate-200 bg-slate-50/50 opacity-70";
                iconBg = "bg-slate-200 text-slate-400";
                iconComponent = <Lock size={16} />;
              } else {
                pulseBorder = "border-slate-200 hover:border-slate-300 shadow-sm hover:shadow";
                iconBg = "bg-blue-500 text-white shadow-md shadow-blue-200";
                iconComponent = <CheckCircle size={16} />;
              }

              return (
                <div key={month.monthNumber} className="relative">
                  <div className={`absolute -left-[37px] top-4 w-7 h-7 rounded-full flex items-center justify-center z-10 ${iconBg}`}>
                    {iconComponent}
                  </div>

                  <div 
                    onClick={() => toggleMonth(month.monthNumber, isLocked)}
                    className={`relative p-5 rounded-xl border transition-all duration-300 ${pulseBorder} ${!isLocked ? 'cursor-pointer hover:bg-slate-50/30' : 'cursor-not-allowed'}`}
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
                          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-4">
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
