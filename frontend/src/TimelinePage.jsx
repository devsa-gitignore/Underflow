import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PregnancyTimeline from './components/PregnancyTimeline';
import { getStoredToken } from './auth-utils';
import { useLanguage } from './language-context';

export default function TimelinePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useLanguage();
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const token = await getStoredToken();
        const response = await fetch(`http://localhost:5000/patients/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPatient(data);
        }
      } catch {
        // Fallback mock patient for demo
        setPatient({
          age: 26,
          name: 'Patient',
          isPregnant: true,
          conditions: 'None',
        });
      }
    };
    fetchPatient();
  }, [id]);

  return (
    <div className="p-6 lg:p-10 font-inter min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-50/60 via-slate-50 to-white">
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
            <h1 className="text-xl font-bold text-slate-800">
              {language === 'hi' ? 'प्रेगाकेयर ट्रैकर' : 'PregaCare Tracker'}
            </h1>
          </div>
          <button 
            onClick={() => navigate(`/patient/${id}`)}
            className="text-teal-600 bg-teal-50 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-100 transition-colors shadow-sm border border-teal-200"
          >
            {language === 'hi' ? 'पूरा क्लिनिकल रिकॉर्ड देखें' : 'View Full Clinical Record'}
          </button>
        </header>

        {patient && <PregnancyTimeline patient={patient} />}
        
      </div>
    </div>
  );
}
