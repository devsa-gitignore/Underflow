import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  HeartPulse,
  MapPin,
  Phone,
  Pill,
  Plus,
  Thermometer,
  User,
  Weight,
} from 'lucide-react';
import { useLanguage } from './language-context';
import { translatePersonName, translateWardLabel } from './text-utils';

export default function PatientProfile() {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const { language } = useLanguage();
  // State to track which visit in the history list is currently expanded
  const [expandedVisitId, setExpandedVisitId] = useState(null); 
  const [, setIsLoading] = useState(true);
  const text = language === 'hi'
    ? {
        patientRecord: 'रोगी रिकॉर्ड',
        editDetails: 'रोगी विवरण संपादित करें',
        criticalRisk: 'गंभीर जोखिम',
        elevatedRisk: 'मध्यम जोखिम',
        normal: 'सामान्य',
        registered: 'पंजीकृत',
        years: 'वर्ष',
        logVisit: 'नई विजिट दर्ज करें',
        clinicalHistory: 'क्लिनिकल इतिहास',
        records: 'रिकॉर्ड',
        recordedVitals: 'दर्ज vitals',
        bloodPressure: 'ब्लड प्रेशर',
        temperature: 'तापमान',
        weight: 'वजन',
        pulse: 'नाड़ी',
        symptomsNoted: 'लक्षण',
        actionPrescription: 'कार्रवाई / दवा',
        clinicalNotes: 'क्लिनिकल वॉइस नोट्स',
      }
    : {
        patientRecord: 'Patient Record',
        editDetails: 'Edit Patient Details',
        criticalRisk: 'Critical Risk',
        elevatedRisk: 'Elevated Risk',
        normal: 'Normal',
        registered: 'Registered',
        years: 'yrs',
        logVisit: 'Log New Visit',
        clinicalHistory: 'Clinical History',
        records: 'Records',
        recordedVitals: 'Recorded Vitals',
        bloodPressure: 'Blood Pressure',
        temperature: 'Temperature',
        weight: 'Weight',
        pulse: 'Pulse',
        symptomsNoted: 'Symptoms Noted',
        actionPrescription: 'Action / Prescription',
        clinicalNotes: 'Clinical Voice Notes',
      };
  
  // Dynamic Patient Data 
  const [patient, setPatient] = useState({
    id: routeId,
    firstName: 'Loading',
    lastName: '...',
    age: '--',
    gender: '...',
    phone: '...',
    ward: '...',
    category: 'General',
    riskStatus: 'green',
    registrationDate: '...'
  });

  useEffect(() => {
    const fetchPatient = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('swasthya_token');
        const response = await fetch(`http://localhost:5000/patients/${routeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const p = await response.json();
          const nameParts = p.name.split(' ');
          setPatient({
            id: p._id,
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' ') || '',
            age: p.age,
            gender: p.gender,
            phone: p.phone || 'N/A',
            ward: p.village,
            category: p.isPregnant ? 'Maternal' : 'General',
            riskStatus: p.currentRiskLevel.toLowerCase() === 'critical' || p.currentRiskLevel.toLowerCase() === 'high' ? 'red' : 
                        p.currentRiskLevel.toLowerCase() === 'medium' ? 'yellow' : 'green',
            registrationDate: new Date(p.createdAt).toLocaleDateString()
          });
        }
      } catch {
        console.error("Patient fetch failed.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatient();
  }, [routeId]);

  // Mock Visit History Data
  const visits = [
    {
      id: 'v1',
      date: 'Oct 12, 2025',
      time: '09:30 AM',
      type: 'Emergency ANC Checkup',
      risk: 'red',
      vitals: { bp: '160/100', temp: '98.6°F', weight: '68 kg', pulse: '92 bpm' },
      symptoms: ['Severe Headaches', 'Swelling in hands/face', 'Blurred vision'],
      notes: "Patient complained of severe throbbing headaches starting last night. Noticeable edema in lower extremities and hands. Blood pressure is critically high indicating severe risk of pre-eclampsia.",
      action: "Immediate referral to District Hospital. Administered first dose of emergency medication as per protocol.",
      worker: "Jash Nikombhe (AW-1029)"
    },
    {
      id: 'v2',
      date: 'Sep 28, 2025',
      time: '11:15 AM',
      type: 'Routine ANC (Month 7)',
      risk: 'yellow',
      vitals: { bp: '135/85', temp: '98.4°F', weight: '65 kg', pulse: '84 bpm' },
      symptoms: ['Mild fatigue', 'Occasional backache'],
      notes: "Routine 7th-month checkup. BP is slightly elevated but below danger threshold. Fetal heart rate is normal. Advised strict rest and low-sodium diet.",
      action: "Provided 30 days supply of Iron and Folic Acid (IFA) tablets. Scheduled follow-up in 14 days.",
      worker: "Jash Nikombhe (AW-1029)"
    },
    {
      id: 'v3',
      date: 'Aug 20, 2025',
      time: '10:00 AM',
      type: 'Routine ANC (Month 6)',
      risk: 'green',
      vitals: { bp: '120/80', temp: '98.2°F', weight: '63 kg', pulse: '78 bpm' },
      symptoms: ['None'],
      notes: "Routine 6th-month checkup. Mother and fetus are healthy. No concerning symptoms reported.",
      action: "Administered Tetanus Toxoid (TT) dose 2. General nutritional counseling provided.",
      worker: "Jash Nikombhe (AW-1029)"
    }
  ];

  const toggleVisit = (id) => {
    setExpandedVisitId(prev => prev === id ? null : id);
  };

  const getRiskColor = (risk) => {
    if (risk === 'red') return 'bg-red-600 text-white border-red-500 animate-severe-glow';
    if (risk === 'yellow') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  const getRiskDot = (risk) => {
    if (risk === 'red') return 'bg-red-500 animate-severe-glow';
    if (risk === 'yellow') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="p-6 lg:p-10 font-inter">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Navigation Bar */}
        <header className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-slate-800">{text.patientRecord}</h1>
          </div>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm hidden sm:block">
            {text.editDetails}
          </button>
        </header>

        {/* PATIENT IDENTITY CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:items-center justify-between">
            
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner border-2 ${
                patient.riskStatus === 'red' ? 'bg-red-100 text-red-700 border-red-200' : 
                patient.riskStatus === 'yellow' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                'bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}>
                {translatePersonName(`${patient.firstName} ${patient.lastName}`.trim(), language)
                  .split(' ')
                  .map((part) => part[0] || '')
                  .join('')}
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {translatePersonName(`${patient.firstName} ${patient.lastName}`.trim(), language)}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${getRiskColor(patient.riskStatus)}`}>
                    {patient.riskStatus === 'red' ? text.criticalRisk : patient.riskStatus === 'yellow' ? text.elevatedRisk : text.normal}
                  </span>
                </div>
                <p className="text-slate-500 font-medium text-sm mb-2">{text.registered} {patient.registrationDate}</p>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm font-medium text-slate-600">
                  <span className="flex items-center gap-1.5"><User size={16} className="text-slate-400"/> {patient.age} {text.years}, {patient.gender}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={16} className="text-slate-400"/> {translateWardLabel(patient.ward, language)}</span>
                  <span className="flex items-center gap-1.5"><Phone size={16} className="text-slate-400"/> {patient.phone}</span>
                </div>
              </div>
            </div>

            {/* Action Button - Mobile friendly */}
            <button className="w-full md:w-auto mt-4 md:mt-0 px-6 py-3.5 bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors shadow-md shadow-teal-200 group">
              <Plus size={20} className="group-hover:scale-110 transition-transform" />
              {text.logVisit}
            </button>

          </div>
        </div>

        {/* VISIT HISTORY SECTION */}
        <div>
          <div className="flex items-center justify-between mb-4 mt-8 px-1">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={20} className="text-slate-400" /> {text.clinicalHistory}
            </h3>
            <span className="text-sm font-semibold text-slate-500 bg-slate-200 px-3 py-1 rounded-full">{visits.length} {text.records}</span>
          </div>

          <div className="space-y-4">
            {visits.map((visit) => {
              const isExpanded = expandedVisitId === visit.id;
              
              return (
                <div key={visit.id} className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-slate-300 shadow-md' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                  
                  {/* ACCORDION HEADER (Clickable) */}
                  <div 
                    onClick={() => toggleVisit(visit.id)}
                    className="w-full px-6 py-5 flex items-center justify-between bg-white cursor-pointer hover:bg-slate-50/50"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${getRiskDot(visit.risk)}`} />
                      <div>
                        <p className="text-sm font-bold text-slate-900 mb-0.5">{visit.type}</p>
                        <p className="text-xs font-medium text-slate-500">{visit.date} at {visit.time} &bull; by {visit.worker}</p>
                      </div>
                    </div>
                    <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {/* ACCORDION BODY (Expanded Content) */}
                  <div className={`transition-all duration-300 ease-in-out origin-top ${isExpanded ? 'max-h-[1000px] opacity-100 border-t border-slate-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                    <div className="p-6 bg-slate-50/50">
                      
                      {/* Grid for Vitals */}
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Activity size={14}/> {text.recordedVitals}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-white border border-slate-200 p-3 rounded-lg">
                            <p className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1"><HeartPulse size={12}/> {text.bloodPressure}</p>
                            <p className={`font-bold text-lg ${visit.vitals.bp === '160/100' ? 'text-red-600' : 'text-slate-800'}`}>{visit.vitals.bp}</p>
                          </div>
                          <div className="bg-white border border-slate-200 p-3 rounded-lg">
                            <p className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1"><Thermometer size={12}/> {text.temperature}</p>
                            <p className="font-bold text-lg text-slate-800">{visit.vitals.temp}</p>
                          </div>
                          <div className="bg-white border border-slate-200 p-3 rounded-lg">
                            <p className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1"><Weight size={12}/> {text.weight}</p>
                            <p className="font-bold text-lg text-slate-800">{visit.vitals.weight}</p>
                          </div>
                          <div className="bg-white border border-slate-200 p-3 rounded-lg">
                            <p className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1"><Activity size={12}/> {text.pulse}</p>
                            <p className="font-bold text-lg text-slate-800">{visit.vitals.pulse}</p>
                          </div>
                        </div>
                      </div>

                      {/* Two column layout for Symptoms and Notes on larger screens */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Symptoms List */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><AlertTriangle size={14}/> {text.symptomsNoted}</h4>
                          <div className="flex flex-wrap gap-2">
                            {visit.symptoms.map((sym, i) => (
                              <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-md shadow-sm">
                                {sym}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Action Taken */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Pill size={14}/> {text.actionPrescription}</h4>
                          <div className="bg-white border border-slate-200 p-4 rounded-lg text-sm text-slate-700 font-medium leading-relaxed">
                            {visit.action}
                          </div>
                        </div>

                      </div>

                      {/* Full width Clinical Notes */}
                      <div className="mt-6 pt-6 border-t border-slate-200">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><FileText size={14}/> {text.clinicalNotes}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium bg-white p-4 rounded-lg border border-slate-200 italic">
                          "{visit.notes}"
                        </p>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
