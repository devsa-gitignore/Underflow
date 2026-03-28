import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PregnancyTimeline from './components/PregnancyTimeline';

export default function TimelinePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="p-6 lg:p-10 font-inter">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation Bar */}
        <header className="mb-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-slate-800">Maternal Flow Tracker</h1>
          </div>
          <button 
            onClick={() => navigate(`/patient/${id}`)}
            className="text-teal-600 bg-teal-50 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-100 transition-colors shadow-sm border border-teal-200"
          >
            View Full Clinical Record
          </button>
        </header>

        {/* Note: In a real app we'd fetch patient details here to pass to PregnancyTimeline, but we use mock data for the demo */}
        <PregnancyTimeline />
        
      </div>
    </div>
  );
}
