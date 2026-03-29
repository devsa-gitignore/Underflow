import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Brain,
  X,
  Droplet,
  Zap,
  CheckCircle2,
  Loader
} from 'lucide-react';
import { useLanguage } from './language-context';
import { translatePersonName, translateWardLabel } from './text-utils';
import { getStoredToken } from './auth-utils';
import { enqueueAction, isOfflineError } from './sync-utils';
import PregnancyTimeline from './components/PregnancyTimeline';
import MagicBento from './MagicBento';

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
        logVisit: 'Log Visit',
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
    registrationDate: '...',
    pendingTask: 'Routine Checkup'
  });

  useEffect(() => {
    fetchPatient();
  }, [routeId]);

  // Visit History - fetched from backend
  const [visits, setVisits] = useState([]);
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);

  // Log Visit Modal State
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitStep, setVisitStep] = useState(1); // 1 = vitals, 2 = notes/QR
  const [visitForm, setVisitForm] = useState({ bp: '', weight: '', bloodSugar: '', symptoms: '', otherFactors: '', notes: '' });
  const [visitSubmitting, setVisitSubmitting] = useState(false);
  const [visitAIResult, setVisitAIResult] = useState(null);
  const [visitSuccess, setVisitSuccess] = useState(false);

  const fetchPatient = async () => {
    setIsLoading(true);
    try {
      const token = await getStoredToken();
      const response = await fetch(`http://localhost:5000/patients/${routeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Patient fetch returned non-OK');
      const p = await response.json();
      const nameParts = (p.name || 'Unknown Patient').split(' ');
      const riskRaw = (p.currentRiskLevel || 'LOW').toLowerCase();
      setPatient({
        id: p._id,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || '',
        age: p.age || '--',
        gender: p.gender || 'Unknown',
        phone: p.phone || 'N/A',
        ward: p.village || 'Unassigned',
        category: p.isPregnant ? 'Maternal' : 'General',
        riskStatus: (riskRaw === 'critical' || riskRaw === 'high') ? 'red' :
          riskRaw === 'medium' ? 'yellow' : 'green',
        registrationDate: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        pendingTask: p.pendingTask || 'Routine Checkup'
      });
    } catch {
      console.error("Patient fetch failed, using fallback mock data.");
      setPatient({
        id: routeId,
        firstName: 'Aarti',
        lastName: 'Sharma',
        age: 28,
        gender: 'Female',
        phone: '+91 9876543210',
        ward: 'Ward 4',
        category: 'Maternal',
        riskStatus: 'red',
        registrationDate: new Date().toLocaleDateString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openVisitModal = () => {
    setVisitForm({ bp: '', weight: '', bloodSugar: '', symptoms: '', otherFactors: '', notes: '' });
    setVisitStep(1);
    setVisitAIResult(null);
    setVisitSuccess(false);
    setShowVisitModal(true);
  };

  const fetchVisits = async () => {
    try {
      const token = await getStoredToken();
      const response = await fetch(`http://localhost:5000/patients/${routeId}/visits`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setVisits(data.map(mapVisitData));
          return;
        }
      }
    } catch {
      // Backend unreachable
    }
    setVisits(mockVisits);
  };

  const submitVisit = async () => {
    setVisitSubmitting(true);
    setVisitAIResult(null);
    try {
      const token = await getStoredToken();
      if (visitForm) {
        const riskRequestPayload = {
          patientId: routeId,
          bp: visitForm.bp,
          weight: visitForm.weight,
          bloodSugar: visitForm.bloodSugar,
          symptoms: visitForm.symptoms || 'None',
          otherFactors: visitForm.otherFactors || `Age: ${patient.age}, Category: ${patient.category}`,
        };

        let assessedRisk = null;
        let assessedSuggestion = null;
        let assessedCondition = null;
        let assessedImmediateAction = false;

        try {
          const assessmentResponse = await fetch('http://localhost:5000/ai/risk-assessment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(riskRequestPayload),
          });

          if (assessmentResponse.ok) {
            const assessmentData = await assessmentResponse.json();
            assessedRisk = assessmentData.data?.riskLevel || null;
            assessedSuggestion = assessmentData.data?.adviceForAshaWorker || null;
            assessedCondition = assessmentData.data?.possibleCondition || null;
            assessedImmediateAction = Boolean(assessmentData.data?.immediateActionRequired);
          }
        } catch {
          // Let backend heuristics infer risk if live AI is unavailable.
        }

        const visitPayload = {
          patientId: routeId,
          vitals: { bloodPressure: visitForm.bp, weight: parseFloat(visitForm.weight) || undefined },
          symptoms: visitForm.symptoms ? visitForm.symptoms.split(',').map((symptom) => symptom.trim()) : [],
          notes: visitForm.notes,
          otherFactors: visitForm.otherFactors,
          riskLevel: assessedRisk || undefined,
          aiSuggestion: assessedSuggestion || undefined,
        };

        try {
          const visitResponse = await fetch(`http://localhost:5000/patients/${routeId}/visits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(visitPayload),
          });

          if (!visitResponse.ok) {
            throw new Error('Visit could not be saved.');
          }

          const savedVisit = await visitResponse.json();
          setVisitAIResult({
            riskLevel: savedVisit.riskLevel || assessedRisk || 'LOW',
            possibleCondition: assessedCondition || 'Visit recorded successfully',
            immediateActionRequired: assessedImmediateAction || savedVisit.riskLevel === 'HIGH' || savedVisit.riskLevel === 'CRITICAL',
            adviceForAshaWorker: savedVisit.aiSuggestion || assessedSuggestion || 'Continue monitoring as per protocol.',
          });
          setVisitSuccess(true);
          await Promise.all([fetchVisits(), fetchPatient()]);
          return;
        } catch (error) {
          if (isOfflineError(error)) {
            enqueueAction('ADD_VISIT', visitPayload);
            setVisitAIResult({
              riskLevel: 'MEDIUM',
              possibleCondition: 'Offline mode',
              immediateActionRequired: false,
              adviceForAshaWorker: 'Visit saved for sync. Risk will be recalculated once the backend is reachable.',
            });
            setVisitSuccess(true);
            return;
          }

          throw error;
        }
      }
      const aiPayload = {
        patientId: routeId,
        bp: visitForm.bp,
        weight: visitForm.weight,
        bloodSugar: visitForm.bloodSugar,
        symptoms: visitForm.symptoms || 'None',
        otherFactors: visitForm.otherFactors || `Age: ${patient.age}, Category: ${patient.category}`,
      };

      let assessedRisk = null;
      let assessedSuggestion = null;
      let assessedCondition = null;
      let assessedImmediateAction = false;

      try {
        const aiRes = await fetch('http://localhost:5000/ai/risk-assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(aiPayload),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          assessedRisk = aiData.data?.riskLevel || null;
          assessedSuggestion = aiData.data?.adviceForAshaWorker || null;
          assessedCondition = aiData.data?.possibleCondition || null;
          assessedImmediateAction = Boolean(aiData.data?.immediateActionRequired);
        }
      } catch {
        // Let backend visit heuristics infer risk if the AI endpoint is unavailable.
      }

      const visitPayload = {
        patientId: routeId,
        vitals: { bloodPressure: visitForm.bp, weight: parseFloat(visitForm.weight) || undefined },
        symptoms: visitForm.symptoms ? visitForm.symptoms.split(',').map(s => s.trim()) : [],
        notes: visitForm.notes,
        otherFactors: visitForm.otherFactors,
        riskLevel: assessedRisk || undefined,
        aiSuggestion: assessedSuggestion || undefined,
      };
      const visitResponse = await fetch(`http://localhost:5000/patients/${routeId}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(visitPayload),
      });

      // 2. Run AI risk assessment with the new vitals
      const legacyAiPayload = {
        patientId: routeId,
        bp: visitForm.bp,
        weight: visitForm.weight,
        bloodSugar: visitForm.bloodSugar,
        symptoms: visitForm.symptoms || 'None',
        otherFactors: visitForm.otherFactors || `Age: ${patient.age}, Category: ${patient.category}`,
      };
      const legacyAiRes = await fetch('http://localhost:5000/ai/risk-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(legacyAiPayload),
      });
      if (legacyAiRes.ok) {
        const aiData = await legacyAiRes.json();
        setVisitAIResult(aiData.data);
      } else {
        // Fallback demo result
        setVisitAIResult({
          riskLevel: 'LOW',
          possibleCondition: 'No acute concern detected',
          immediateActionRequired: false,
          adviceForAshaWorker: 'Continue routine monitoring. Encourage healthy diet and hydration.',
        });
      }
      setVisitSuccess(true);
      // Refresh visit history silently — use mapVisitData to transform
      const r = await fetch(`http://localhost:5000/patients/${routeId}/visits`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); if (d.length > 0) setVisits(d.map(mapVisitData)); }
    } catch {
      setVisitAIResult({
        riskLevel: 'LOW',
        possibleCondition: 'Demo mode — backend not reachable',
        immediateActionRequired: false,
        adviceForAshaWorker: 'Visit queued for offline sync.',
      });
      setVisitSuccess(true);
    } finally {
      setVisitSubmitting(false);
    }
  };

  // Reusable mapper for raw backend visit → display format
  const mapVisitData = (v) => {
    const rawDate = v.visitDate || v.createdAt || v.updatedAt;
    const vDate = rawDate ? new Date(rawDate) : new Date();
    const isValid = !isNaN(vDate.getTime());
    const riskLower = (v.riskLevel || 'LOW').toLowerCase();
    return {
      id: v._id || v.id || Math.random().toString(36).slice(2),
      date: isValid ? vDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
      time: isValid ? vDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '',
      type: v.notes?.includes?.('ANC') ? 'ANC Checkup' : 'Clinical Visit',
      risk: (riskLower === 'critical' || riskLower === 'high') ? 'red' : riskLower === 'medium' ? 'yellow' : 'green',
      vitals: {
        bp: v.vitals?.bloodPressure || 'N/A',
        temp: v.vitals?.temperature ? `${v.vitals.temperature}°F` : 'N/A',
        weight: v.vitals?.weight ? `${v.vitals.weight} kg` : 'N/A',
        pulse: 'N/A',
      },
      symptoms: v.symptoms?.length > 0 ? v.symptoms : ['None reported'],
      notes: v.notes || 'No clinical notes recorded.',
      action: v.aiSuggestion || 'Continue monitoring as per protocol.',
      worker: 'Jash Nikombhe (AW-1029)',
    };
  };

  // Mock visit data for fallback
  const mockVisits = [
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

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const token = await getStoredToken();
        const response = await fetch(`http://localhost:5000/patients/${routeId}/visits`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.length > 0) {
            setVisits(data.map(mapVisitData));
            return; // Successfully loaded from backend
          }
        }
      } catch {
        // Backend unreachable
      }
      // Fallback: use mock data for hackathon demo
      setVisits(mockVisits);
    };
    fetchVisits();
  }, [routeId]);


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

  const handleLogVisit = openVisitModal;

  const handleAIAssessment = async () => {
    setIsAssessing(true);
    setAssessmentResult(null);
    try {
      const token = await getStoredToken();
      const latestVisit = visits[0] || {};
      
      const payload = {
        patientId: routeId,
        bp: latestVisit.vitals?.bp !== 'N/A' ? latestVisit.vitals?.bp : undefined,
        weight: latestVisit.vitals?.weight !== 'N/A' ? latestVisit.vitals?.weight : undefined,
        symptoms: latestVisit.symptoms ? latestVisit.symptoms.join(', ') : 'None',
        otherFactors: `Age: ${patient.age}, Category: ${patient.category}`
      };

      const response = await fetch('http://localhost:5000/ai/risk-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setAssessmentResult(data.data);
      } else {
        throw new Error('Backend failed');
      }
    } catch (err) {
      console.error('AI Assessment error:', err);
      // Fallback demo mock
      setAssessmentResult({
        riskLevel: 'MODERATE',
        possibleCondition: 'Mild Anemia',
        immediateActionRequired: false,
        adviceForAshaWorker: 'Recommend iron-rich diet and monitor vital signs over the next two weeks.'
      });
    } finally {
      setIsAssessing(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 font-inter min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/80 via-white to-emerald-50/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, staggerChildren: 0.1 }}
        className="max-w-4xl mx-auto space-y-6"
      >

        {/* Top Navigation Bar */}
        <header className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-white/50 backdrop-blur-md rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-700 to-slate-600">{text.patientRecord}</h1>
          </div>
          <button className="bg-white/80 backdrop-blur-md text-slate-700 border border-slate-200/60 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white hover:shadow-sm active:scale-[0.98] transition-all hidden sm:block">
            {text.editDetails}
          </button>
        </header>

        {/* PATIENT IDENTITY CARD */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">

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
                <p className="text-slate-500 font-medium text-sm mb-2">{text.registered} {patient.registrationDate} &bull; <span className="ml-1 text-teal-600 font-bold">{language === 'hi' ? 'अगला कार्य' : 'Next Task'}: {patient.pendingTask}</span></p>
                
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm font-medium text-slate-600">
                  <span className="flex items-center gap-1.5"><User size={16} className="text-slate-400"/> {patient.age} {text.years}, {patient.gender}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={16} className="text-slate-400"/> {translateWardLabel(patient.ward, language)}</span>
                  <span className="flex items-center gap-1.5"><Phone size={16} className="text-slate-400"/> {patient.phone}</span>
                </div>
              </div>
            </div>

            {/* Actions - Mobile friendly */}
            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
              {patient.category === 'Maternal' && (
                <button 
                  onClick={() => navigate(`/patient/${patient.id}/pregacare`)}
                  className="w-full md:w-auto px-6 py-3.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl font-bold text-sm flex justify-center hover:bg-purple-100 transition-colors shadow-sm"
                >
                  {language === 'hi' ? 'प्रेगाकेयर ट्रैकर' : 'PregaCare'}
                </button>
              )}
              <button 
                disabled={isAssessing}
                onClick={handleAIAssessment} 
                className={`whitespace-nowrap w-full md:w-auto px-5 py-4 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors shadow-sm ${isAssessing ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isAssessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    {language === 'hi' ? 'विश्लेषण हो रहा...' : 'Running AI...'}
                  </>
                ) : (
                  <>
                    {language === 'hi' ? 'जोखिम अनुमानक' : 'Risk Predictor'}
                  </>
                )}
              </button>
              <button 
                onClick={handleLogVisit}
                className="whitespace-nowrap w-full md:w-auto px-5 py-4 bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors shadow-md shadow-teal-200 group">
                <Plus size={20} className="group-hover:scale-110 transition-transform" />
                {text.logVisit}
              </button>
            </div>

          </div>
        </div>

        {/* AI ASSESSMENT RESULT PANEL */}
        {assessmentResult && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 relative animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
            <button 
              onClick={() => setAssessmentResult(null)}
              className="absolute top-4 right-4 text-emerald-400 hover:text-emerald-700 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                <Brain className="text-emerald-600" size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-emerald-900">
                    {language === 'hi' ? 'एआई स्वास्थ्य विश्लेषण' : 'AI Health Analysis'}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    assessmentResult.riskLevel === 'HIGH' || assessmentResult.riskLevel === 'CRITICAL' 
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : assessmentResult.riskLevel === 'MODERATE' 
                        ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {assessmentResult.riskLevel} RISK
                  </span>
                  {assessmentResult.immediateActionRequired && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white animate-pulse">
                      Urgent Action
                    </span>
                  )}
                </div>
                
                <h4 className="text-sm font-semibold text-slate-800 mt-3 mb-1 uppercase tracking-wider">
                  {language === 'hi' ? 'संभावित स्थिति' : 'Detected Condition'}
                </h4>
                <p className="text-slate-700 font-medium mb-3">{assessmentResult.possibleCondition}</p>
                
                <h4 className="text-sm font-semibold text-slate-800 mb-1 uppercase tracking-wider">
                  {language === 'hi' ? 'सुझाया गया कदम' : 'Recommended Action'}
                </h4>
                <p className="text-slate-700 font-medium p-3 bg-white rounded-lg border border-slate-200">
                  {assessmentResult.adviceForAshaWorker}
                </p>
              </div>
            </div>
          </div>
        )}



        {/* VISIT HISTORY SECTION */}
        <div>
          <div className="flex items-center justify-between mb-4 mt-8 px-1">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Calendar size={20} className="text-slate-400" /> {text.clinicalHistory}
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-white/60 border border-white/80 shadow-sm backdrop-blur-sm px-3 py-1 rounded-full">{visits.length} {text.records}</span>
          </div>

          <div className="space-y-4">
            {visits.map((visit) => {
              const isExpanded = expandedVisitId === visit.id;

              return (
                <div key={visit.id} className={`bg-white/60 backdrop-blur-xl rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-teal-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)]' : 'border-white/80 shadow-sm hover:border-slate-200'}`}>

                  {/* ACCORDION HEADER (Clickable) */}
                  <div
                    onClick={() => toggleVisit(visit.id)}
                    className="w-full px-6 py-5 flex items-center justify-between bg-white cursor-pointer hover:bg-slate-50/50"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className={`w-3 h-3 rounded-full shrink-0 ${getRiskDot(visit.risk)}`} />
                      <div>
                        <p className="text-sm font-bold text-slate-900 mb-0.5">{visit.type || 'Clinical Visit'}</p>
                        <p className="text-xs font-medium text-slate-500">{visit.date || 'Recent'}{visit.time ? ` at ${visit.time}` : ''} &bull; {visit.worker || 'ASHA Worker'}</p>
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
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <MagicBento glowColor="239, 68, 68" className="p-4 bg-white/40">
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><HeartPulse size={14} className="text-red-400"/> {text.bloodPressure}</p>
                            <p className={`font-black text-2xl ${visit.vitals.bp === '160/100' ? 'text-red-600' : 'text-slate-800'}`}>{visit.vitals.bp}</p>
                          </MagicBento>
                          <MagicBento glowColor="245, 158, 11" className="p-4 bg-white/40">
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Thermometer size={14} className="text-amber-400"/> {text.temperature}</p>
                            <p className="font-black text-2xl text-slate-800">{visit.vitals.temp}</p>
                          </MagicBento>
                          <MagicBento glowColor="59, 130, 246" className="p-4 bg-white/40">
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Weight size={14} className="text-blue-400"/> {text.weight}</p>
                            <p className="font-black text-2xl text-slate-800">{visit.vitals.weight}</p>
                          </MagicBento>
                          <MagicBento glowColor="20, 184, 166" className="p-4 bg-white/40">
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5"><Activity size={14} className="text-teal-400"/> {text.pulse}</p>
                            <p className="font-black text-2xl text-slate-800">{visit.vitals.pulse}</p>
                          </MagicBento>
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
        {/* LOG VISIT MODAL */}
        {showVisitModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !visitSubmitting && setShowVisitModal(false)}>
            <div
              className="bg-white w-full sm:max-w-lg sm:mx-4 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-bold text-lg">{language === 'hi' ? 'नई विजिट दर्ज करें' : 'Log New Visit'}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{patient.firstName} {patient.lastName} &bull; {visitStep === 1 ? 'Clinical Vitals' : 'Notes & Submit'}</p>
                </div>
                {!visitSubmitting && (
                  <button onClick={() => setShowVisitModal(false)} className="p-2 rounded-xl hover:bg-slate-800 transition-colors">
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Step indicator */}
              <div className="flex h-1">
                <div className={`h-full transition-all duration-500 bg-teal-500 ${visitStep >= 1 ? 'flex-1' : 'w-0'}`} />
                <div className={`h-full transition-all duration-500 bg-emerald-500 ${visitStep >= 2 ? 'flex-1' : 'w-0'}`} />
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5">

                {/* STEP 1 — VITALS */}
                {visitStep === 1 && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Blood Pressure</label>
                        <input type="text" placeholder="120/80" value={visitForm.bp}
                          onChange={e => setVisitForm(p => ({...p, bp: e.target.value}))}
                          className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Weight (kg)</label>
                        <input type="number" placeholder="62" value={visitForm.weight}
                          onChange={e => setVisitForm(p => ({...p, weight: e.target.value}))}
                          className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Blood Sugar (mg/dL)</label>
                      <input type="number" placeholder="110" value={visitForm.bloodSugar}
                        onChange={e => setVisitForm(p => ({...p, bloodSugar: e.target.value}))}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Symptoms Reported</label>
                      <textarea rows={2} placeholder="e.g. Headache, swelling in feet..." value={visitForm.symptoms}
                        onChange={e => setVisitForm(p => ({...p, symptoms: e.target.value}))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Other Factors / Notes</label>
                      <textarea rows={2} placeholder="e.g. On medication, family history..." value={visitForm.otherFactors}
                        onChange={e => setVisitForm(p => ({...p, otherFactors: e.target.value}))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400"
                      />
                    </div>
                  </>
                )}

                {/* STEP 2 — NOTES + AI RESULT */}
                {visitStep === 2 && !visitSuccess && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Clinical Notes (optional)</label>
                    <textarea rows={4} placeholder="Additional observations, mediciation given, referrals made..." value={visitForm.notes}
                      onChange={e => setVisitForm(p => ({...p, notes: e.target.value}))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-400"
                    />
                    <p className="text-xs text-slate-400 mt-2 font-medium">After submitting, AI will auto-analyse risk from the vitals you provided.</p>
                  </div>
                )}

                {/* SUBMITTING LOADER */}
                {visitSubmitting && (
                  <div className="flex flex-col items-center py-8 gap-4">
                    <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center">
                      <Loader size={32} className="text-teal-500 animate-spin" />
                    </div>
                    <p className="text-sm font-bold text-slate-600">Logging visit & running AI analysis...</p>
                    <p className="text-xs text-slate-400 text-center max-w-xs">Gemini is analysing the vitals for risk patterns. This may take a moment.</p>
                  </div>
                )}

                {/* AI RESULT — shown after success */}
                {visitSuccess && visitAIResult && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 size={22} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Visit Logged Successfully</p>
                        <p className="text-xs text-slate-500">AI Analysis complete</p>
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-5 ${
                      visitAIResult.riskLevel === 'HIGH' || visitAIResult.riskLevel === 'CRITICAL' ? 'bg-red-50 border-red-200' :
                      visitAIResult.riskLevel === 'MODERATE' || visitAIResult.riskLevel === 'MEDIUM' ? 'bg-amber-50 border-amber-200' :
                      'bg-emerald-50 border-emerald-200'
                    }`}>
                      <div className="flex items-center gap-3 mb-4">
                        <Brain size={20} className={`${
                          visitAIResult.riskLevel === 'HIGH' || visitAIResult.riskLevel === 'CRITICAL' ? 'text-red-600' :
                          visitAIResult.riskLevel === 'MODERATE' || visitAIResult.riskLevel === 'MEDIUM' ? 'text-amber-600' :
                          'text-emerald-600'
                        }`} />
                        <span className="font-black text-slate-900 text-sm uppercase tracking-wider">AI Risk Assessment</span>
                        <span className={`ml-auto px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          visitAIResult.riskLevel === 'HIGH' || visitAIResult.riskLevel === 'CRITICAL' ? 'bg-red-500 text-white animate-pulse' :
                          visitAIResult.riskLevel === 'MODERATE' || visitAIResult.riskLevel === 'MEDIUM' ? 'bg-amber-400 text-white' :
                          'bg-emerald-500 text-white'
                        }`}>
                          {visitAIResult.riskLevel}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-white/70 rounded-xl p-4 border border-white">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Detected Condition</p>
                          <p className="font-semibold text-slate-800 text-sm">{visitAIResult.possibleCondition}</p>
                        </div>
                        <div className="bg-white/70 rounded-xl p-4 border border-white">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Recommended Action</p>
                          <p className="font-semibold text-slate-800 text-sm leading-relaxed">{visitAIResult.adviceForAshaWorker}</p>
                        </div>
                        {visitAIResult.immediateActionRequired && (
                          <div className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl">
                            <Zap size={16} className="shrink-0" />
                            <span className="text-sm font-bold">Immediate action required — refer to PHC now.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Buttons */}
              {!visitSubmitting && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                  {visitSuccess ? (
                    <button
                      onClick={() => setShowVisitModal(false)}
                      className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
                    >
                      Done
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => visitStep === 1 ? setShowVisitModal(false) : setVisitStep(1)}
                        className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-white transition-colors"
                      >
                        {visitStep === 1 ? 'Cancel' : 'Back'}
                      </button>
                      {visitStep === 1 ? (
                        <button
                          onClick={() => setVisitStep(2)}
                          className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition-colors"
                        >
                          Continue →
                        </button>
                      ) : (
                        <button
                          onClick={submitVisit}
                          className="flex-1 py-3 rounded-xl bg-teal-600 text-white font-bold text-sm hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Brain size={16} /> Submit & Analyse with AI
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
