import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Activity, ChevronDown, ChevronUp, AlertTriangle, Info, Coffee } from 'lucide-react';

export default function PregnancyTimeline() {
  const [expandedMonth, setExpandedMonth] = useState(null);

  // MOCK DATA: Perfectly mimics what the AI will return when activated
  const mockTimelineData = Array.from({ length: 9 }, (_, i) => {
    const monthNumber = i + 1;
    // Let's set Month 5 as the "current" active month for this demo
    const currentMockMonth = 5;
    const isLocked = monthNumber > currentMockMonth;
    const isCurrent = monthNumber === currentMockMonth;
    const isCompleted = monthNumber < currentMockMonth;

    return {
      monthNumber,
      isLocked,
      isCurrent,
      isCompleted,
      monthlySummary: isLocked 
        ? "Future growth tracking locked until this milestone."
        : `Maternal and fetal development for Month ${monthNumber}. Important organ systems are developing.`,
      weeks: [
        {
          weekLabel: `Week ${(monthNumber - 1) * 4 + 1}`,
          expectedSymptoms: "Mild nausea, fatigue.",
          dietaryAdvice: "Increase folic acid and iron intake. Small frequent meals.",
          redFlags: "Severe abdominal pain or heavy spotting.",
        },
        {
          weekLabel: `Week ${(monthNumber - 1) * 4 + 2}`,
          expectedSymptoms: "Breast tenderness, occasional dizziness.",
          dietaryAdvice: "Stay hydrated. Avoid spicy foods if heartburn occurs.",
          redFlags: "Fever above 101°F or severe headaches.",
        },
        {
           weekLabel: `Week ${(monthNumber - 1) * 4 + 3}`,
           expectedSymptoms: "Food aversions, slight weight gain.",
           dietaryAdvice: "Incorporate more leafy greens and protein.",
           redFlags: "Extreme swelling of hands or face.",
        },
        {
           weekLabel: `Week ${(monthNumber - 1) * 4 + 4}`,
           expectedSymptoms: "Mood swings, frequent urination.",
           dietaryAdvice: "Avoid caffeine. Eat iron-rich foods.",
           redFlags: "Persistent vomiting unable to keep liquids down.",
        }
      ]
    };
  });

  const toggleMonth = (monthNum, isLocked) => {
    if (isLocked) return;
    setExpandedMonth(prev => prev === monthNum ? null : monthNum);
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Activity size={20} className="text-emerald-500" /> AI Pregnancy Timeline
        </h3>
        <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          Smart Path Active
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8">
        <p className="text-slate-500 font-medium mb-6 text-sm">
          A personalized 9-month clinical foresight model generated for this patient's specific health profile.
        </p>

        <div className="relative border-l-2 border-slate-100 pl-6 ml-4 space-y-8">
          {mockTimelineData.map((month) => {
            const isExpanded = expandedMonth === month.monthNumber;
            
            // Dynamic styling based on the state of the month
            let pulseBorder = "";
            let iconBg = "";
            let iconComponent = null;

            if (month.isCurrent) {
              pulseBorder = "border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-2 ring-emerald-50";
              iconBg = "bg-emerald-500 text-white animate-pulse shadow-lg shadow-emerald-200";
              iconComponent = <Activity size={16} />;
            } else if (month.isLocked) {
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
                {/* Timeline Axis Node (The Circle Icon on the line) */}
                <div className={`absolute -left-[37px] top-4 w-7 h-7 rounded-full flex items-center justify-center z-10 ${iconBg}`}>
                  {iconComponent}
                </div>

                {/* The Month Card */}
                <div 
                  onClick={() => toggleMonth(month.monthNumber, month.isLocked)}
                  className={`relative p-5 rounded-xl border transition-all duration-300 ${pulseBorder} ${!month.isLocked ? 'cursor-pointer hover:bg-slate-50/30' : 'cursor-not-allowed'}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <h4 className={`font-black text-lg ${month.isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
                        Month {month.monthNumber}
                      </h4>
                      <p className={`text-sm mt-1 font-medium ${month.isLocked ? 'text-slate-400' : 'text-slate-500'}`}>
                        {month.monthlySummary}
                      </p>
                    </div>
                    
                    {!month.isLocked && (
                      <div className="p-2 text-slate-400 shrink-0">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    )}
                  </div>

                  {/* Expandable Weeks Content (Using Framer Motion for buttery smooth dropdown) */}
                  <AnimatePresence>
                    {isExpanded && !month.isLocked && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {month.weeks.map((week, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-emerald-200 transition-colors">
                              <h5 className="font-bold text-slate-800 text-sm mb-3 pb-2 border-b border-slate-200">
                                {week.weekLabel}
                              </h5>
                              
                              <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                  <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                                  <p className="text-xs font-medium text-slate-600"><span className="font-bold">Symptoms:</span> {week.expectedSymptoms}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <Coffee size={14} className="text-amber-500 mt-0.5 shrink-0" />
                                  <p className="text-xs font-medium text-slate-600"><span className="font-bold">Diet:</span> {week.dietaryAdvice}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                  <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                  <p className="text-xs font-medium text-slate-600"><span className="font-bold">Red Flags:</span> {week.redFlags}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
