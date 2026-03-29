import React, { useEffect, useState } from 'react';
import { 
  Plus, Users, Baby, RefreshCw, 
  ChevronRight, AlertCircle, Activity, CheckCircle2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import MagicBento from './MagicBento';
import { useLanguage } from './language-context';
import { translatePersonName, translateWardLabel } from './text-utils';
import { getStoredToken } from './auth-utils';

const hindiText = {
  scanRedirect: 'क्यूआर मिला: रोगी प्रोफाइल पर भेजा जा रहा है...',
  invalidQr: 'डिकोड किया गया क्यूआर उपयोगी रोगी आईडी नहीं रखता।',
  noQr: 'इस चित्र में मान्य रोगी क्यूआर कोड नहीं मिला। कृपया साफ और अच्छी रोशनी वाला क्यूआर उपयोग करें।',
  imageError: 'चुनी गई छवि को क्यूआर स्कैन के लिए प्रोसेस नहीं किया जा सका।',
  fileError: 'चुनी गई फाइल पढ़ी नहीं जा सकी।',
  overview: 'सारांश',
  overviewSubtitle: 'आज के लिए आपकी प्राथमिक स्वास्थ्य कार्यसूची।',
  alertTitle: 'तत्कल कार्रवाई: क्लिनिकल अलर्ट',
  alertBodyPrefix: ' के नवीनतम vitals में जोखिम दिख रहा है। प्रोटोकॉल के अनुसार प्राथमिक केंद्र रेफरल की सलाह दी जाती है।',
  viewProtocol: 'प्रोटोकॉल देखें',
  pendingVisits: 'लंबित विजिट',
  families: 'परिवार',
  highRisk: 'उच्च जोखिम',
  attentionRequired: 'ध्यान आवश्यक',
  maternalTracks: 'मातृ ट्रैक',
  active: 'सक्रिय',
  weeklyGoal: 'साप्ताहिक लक्ष्य',
  completed: 'पूर्ण',
  priorityQueue: 'प्राथमिक कतार',
  seeAll: 'सभी देखें',
  urgent: 'अति आवश्यक',
  monitor: 'निगरानी',
  routine: 'नियमित',
  ageLabel: 'आयु',
  actions: 'कार्य',
  decodingPhoto: 'फोटो डिकोड हो रही है...',
  scanQr: 'रोगी क्यूआर स्कैन करें (फोटो)',
  registerPatient: 'नया रोगी दर्ज करें',
  logMaternal: 'मातृ जांच दर्ज करें',
  findRecord: 'पुराना रिकॉर्ड खोजें',
  schedule: 'कार्यसूची',
  polioVaccination: 'पोलियो टीकाकरण',
  scheduleMeta: 'वार्ड 4 प्राथमिक विद्यालय • 08:00 AM',
  participants: 'भागीदार सूची देखें (45)',
  noPatients: 'अभी कोई रोगी रिकॉर्ड उपलब्ध नहीं है।',
};

const englishText = {
  scanRedirect: 'QR Detected: Redirecting to Patient Profile...',
  invalidQr: "The QR code was decoded, but it doesn't contain a usable patient ID.",
  noQr: 'Could not find a valid Patient QR code in this image. Please ensure the QR is clear and well-lit.',
  imageError: 'The selected image could not be processed for QR scanning.',
  fileError: 'The selected file could not be read.',
  overview: 'Overview',
  overviewSubtitle: 'Your prioritized operational tasks for today.',
  alertTitle: 'Action Required: Clinical Alert',
  alertBodyPrefix: "'s latest vitals show elevated risk. Referral to the Primary Health Center is highly advised.",
  viewProtocol: 'View Protocol',
  pendingVisits: 'Pending Visits',
  families: 'families',
  highRisk: 'High Risk',
  attentionRequired: 'attention required',
  maternalTracks: 'Maternal Tracks',
  active: 'active',
  weeklyGoal: 'Weekly Goal',
  completed: 'completed',
  priorityQueue: 'Priority Queue',
  seeAll: 'See all',
  urgent: 'Urgent',
  monitor: 'Monitor',
  routine: 'Routine',
  ageLabel: 'Age',
  actions: 'Actions',
  decodingPhoto: 'Decoding Photo...',
  scanQr: 'Scan Patient QR (Photo)',
  registerPatient: 'Register New Patient',
  logMaternal: 'Log Maternal Checkup',
  findRecord: 'Find Previous Record',
  schedule: 'Schedule',
  polioVaccination: 'Polio Vaccination',
  scheduleMeta: 'Ward 4 Primary School • 08:00 AM',
  participants: 'View Participant List (45)',
  noPatients: 'No patient records available yet.',
};

function mapPatients(data) {
  return data.map((patient) => {
    const riskLower = (patient.currentRiskLevel || 'LOW').toLowerCase();
    const risk = (riskLower === 'critical' || riskLower === 'high') ? 'red' : riskLower === 'medium' ? 'yellow' : 'green';
    return {
      id: patient._id,
      name: patient.name,
      age: patient.age,
      village: patient.village || 'Unassigned',
      isPregnant: patient.isPregnant,
      pendingTask: patient.pendingTask || 'Awaiting Assessment',
      lastVisitedAt: patient.lastVisitedAt || null,
      risk,
      issue: patient.pendingTask || (patient.isPregnant ? 'Pregnancy Tracking' : 'Routine Checkup'),
      time: risk === 'red' ? 'Overdue' : risk === 'yellow' ? 'Today' : 'On Track',
    };
  });
}

function getAssignedAshaId(patient) {
  if (!patient?.ashaId) return null;
  if (typeof patient.ashaId === 'string') return patient.ashaId;
  return patient.ashaId._id || null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [patients, setPatients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showAllFollowups, setShowAllFollowups] = useState(false);
  const [hiddenCards, setHiddenCards] = useState(() => {
    return JSON.parse(sessionStorage.getItem('hiddenCards') || '[]');
  });
  const { language } = useLanguage();
  const text = language === 'hi' ? hindiText : englishText;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = await getStoredToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [patientsRes, tasksRes, alertsRes] = await Promise.all([
          fetch('http://localhost:5000/patients/search?assigned=true', { headers }).catch(() => ({ ok: false })),
          fetch('http://localhost:5000/asha/me/tasks', { headers }).catch(() => ({ ok: false })),
          fetch('http://localhost:5000/alerts', { headers }).catch(() => ({ ok: false }))
        ]);

        if (patientsRes.ok) {
          const data = await patientsRes.json();
          const storedUser = JSON.parse(localStorage.getItem('swasthya_user') || 'null');
          const currentUserId = storedUser?._id || null;
          const assignedPatients = currentUserId
            ? data.filter((patient) => String(getAssignedAshaId(patient)) === String(currentUserId))
            : data;
          setPatients(mapPatients(assignedPatients));
        } else {
          // Fallback mock data for hackathon demo
          setPatients([
            { id: 'mock-1', name: 'Aarti Sharma', age: 28, risk: 'red', issue: 'Severe Anemia - BP 160/100', time: 'Overdue', village: 'Ward 4', isPregnant: true },
            { id: 'mock-2', name: 'Pooja Patel', age: 24, risk: 'yellow', issue: 'Missed ANC Checkup', time: 'Today', village: 'Ward 4', isPregnant: true },
            { id: 'mock-3', name: 'Sunita Devi', age: 34, risk: 'green', issue: 'Routine Checkup', time: 'On Track', village: 'Ward 5', isPregnant: false },
            { id: 'mock-4', name: 'Rahul Kumar', age: 2, risk: 'green', issue: 'Vaccination', time: 'Done', village: 'Ward 2', isPregnant: false },
            { id: 'mock-5', name: 'Meena Kumari', age: 22, risk: 'yellow', issue: 'Maternal Follow-up', time: 'Tomorrow', village: 'Ward 5', isPregnant: true },
          ]);
        }
        
        if (tasksRes.ok) {
          const data = await tasksRes.json();
          setTasks(data.tasks || []);
        }

        if (alertsRes.ok) {
          const data = await alertsRes.json();
          setAlerts(data.alerts || []);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCompleteTask = async (taskId, e) => {
    e.stopPropagation();
    try {
      const token = await getStoredToken();
      const res = await fetch(`http://localhost:5000/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: 'COMPLETED' } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCardClick = (id, targetUrl) => {
    const newHidden = [...hiddenCards, id];
    setHiddenCards(newHidden);
    sessionStorage.setItem('hiddenCards', JSON.stringify(newHidden));
    navigate(targetUrl);
  };


  const handlePhotoScan = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const input = e.target;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          let patientId = code.data;
          try {
            const parsed = JSON.parse(code.data);
            if (parsed._id || parsed.id) {
              patientId = parsed._id || parsed.id;
            }
          } catch {
            // Raw string
          }

          if (typeof patientId === 'string' && patientId.trim()) {
            alert(text.scanRedirect);
            navigate(`/patient/${encodeURIComponent(patientId.trim())}`);
          } else {
            alert(text.invalidQr);
          }
        } else {
          alert(text.noQr);
        }
        setIsScanning(false);
        input.value = '';
      };
      img.onerror = () => {
        alert(text.imageError);
        setIsScanning(false);
        input.value = '';
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      alert(text.fileError);
      setIsScanning(false);
      input.value = '';
    };
    reader.readAsDataURL(file);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const queuePatients = patients.filter((patient) => {
    if (patient.pendingTask === 'Completed Today' && patient.lastVisitedAt) {
      const visitDate = new Date(patient.lastVisitedAt);
      visitDate.setHours(0, 0, 0, 0);
      return visitDate.getTime() !== today.getTime();
    }
    return patient.pendingTask !== 'Completed Today';
  });

  const sortedPatients = [...queuePatients].sort((a, b) => {
    const rank = { red: 0, yellow: 1, green: 2 };
    return rank[a.risk] - rank[b.risk];
  });
  
  const reds = sortedPatients.filter((p) => p.risk === 'red').slice(0, 2);
  const yellows = sortedPatients.filter((p) => p.risk === 'yellow').slice(0, 2);
  const greens = sortedPatients.filter((p) => p.risk === 'green').slice(0, 2);
  let balancedPriority = [...reds, ...yellows, ...greens];
  
  if (balancedPriority.length < 6) {
    const assignedIds = new Set(balancedPriority.map((p) => p.id));
    const remaining = sortedPatients.filter((p) => !assignedIds.has(p.id));
    balancedPriority = [...balancedPriority, ...remaining.slice(0, 6 - balancedPriority.length)];
  }
  
  balancedPriority.sort((a, b) => {
    const rank = { red: 0, yellow: 1, green: 2 };
    return rank[a.risk] - rank[b.risk];
  });

  const priorityPatients = balancedPriority;
  const highRiskCount = patients.filter((patient) => patient.risk === 'red').length;
  const maternalCount = patients.filter((patient) => patient.isPregnant).length;
  const weeklyCompletion = patients.length ? Math.min(100, Math.round(((patients.length - highRiskCount) / patients.length) * 100)) : 0;
  const featuredPatient = priorityPatients.find(p => p.risk === 'red') || priorityPatients[0];

  const getCardStyles = (risk) => {
    switch (risk) {
      case 'red':
        return 'bg-white/80 backdrop-blur-xl border-l-4 border-l-red-500 border-white/60 shadow-[0_4px_24px_rgba(239,68,68,0.15)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_12px_36px_rgba(239,68,68,0.25)]';
      case 'yellow':
        return 'bg-white/80 backdrop-blur-xl border-l-4 border-l-amber-400 border-white/60 shadow-sm group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]';
      case 'green':
        return 'bg-white/80 backdrop-blur-xl border-white/60 border-l-4 border-l-teal-400 shadow-sm group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]';
      default:
        return 'bg-white/80 backdrop-blur-xl border-white/60 shadow-sm group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]';
    }
  };

  const getBadgeStyles = (risk) => {
    switch (risk) {
      case 'red': return 'bg-red-500 text-white shadow-sm';
      case 'yellow': return 'bg-amber-400 text-white shadow-sm';
      case 'green': return 'bg-teal-500 text-white shadow-sm';
      default: return 'bg-slate-200 text-slate-700 shadow-sm';
    }
  };

  const translateIssue = (issue) => {
    if (language !== 'hi') return issue;
    if (issue === 'Pregnancy Tracking') return 'गर्भावस्था ट्रैकिंग';
    if (issue === 'Routine Checkup') return 'नियमित जांच';
    if (issue === 'Maternal Follow-up') return 'मातृ अनुवर्ती';
    if (issue === 'High Risk monitoring') return 'उच्च जोखिम निगरानी';
    if (issue === 'Vaccination') return 'टीकाकरण';
    return issue;
  };

  const translateTime = (risk) => {
    if (language !== 'hi') {
      return risk === 'red' ? 'Overdue' : risk === 'yellow' ? 'Today' : 'Done';
    }
    return risk === 'red' ? 'देरी' : risk === 'yellow' ? 'आज' : 'पूर्ण';
  };

  return (
    <div className="p-6 lg:p-10 font-inter min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/80 via-white to-emerald-50/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-7xl mx-auto space-y-8"
      >
        
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-1">{text.overview}</h2>
            <p className="text-sm text-slate-500">{text.overviewSubtitle}</p>
          </div>
          <Link to="/add-patient" className="sm:hidden flex items-center justify-center w-10 h-10 bg-teal-600 text-white rounded-full shadow-md">
            <Plus size={20} />
          </Link>
        </div>

        {(() => {
          const missedFollowups = alerts.filter(a => a.status === 'ACTIVE' && a.type === 'MISSED_FOLLOWUP' && !hiddenCards.includes(a._id));
          if (missedFollowups.length === 0) return null;
          
          const displayed = showAllFollowups ? missedFollowups : missedFollowups.slice(0, 1);
          const hiddenCount = missedFollowups.length - 1;

          return (
            <div className="space-y-4 mb-4">
              {displayed.map((alert, idx) => (
                <div key={alert._id} className="relative bg-red-50 border-l-4 border-l-red-600 rounded-xl p-4 flex items-start sm:items-center justify-between gap-4 shadow-[0_4px_24px_rgba(239,68,68,0.15)] transition-all">
                  {/* The +N Pill on the first item if not expanded */}
                  {!showAllFollowups && idx === 0 && hiddenCount > 0 && (
                    <button 
                      onClick={() => setShowAllFollowups(true)}
                      className="absolute -top-3 -right-2 bg-red-600 border-2 border-white text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-lg hover:bg-red-700 hover:scale-110 transition-all z-10 flex items-center justify-center cursor-pointer"
                      title={`View ${hiddenCount} more missed follow-ups`}
                    >
                      +{hiddenCount} More
                    </button>
                  )}

                  <div className="flex items-start gap-3 w-full">
                    <AlertCircle size={20} className="text-red-600 mt-0.5 shrink-0 animate-pulse" />
                    <div className="flex-1 pr-6 sm:pr-0">
                      <h3 className="font-bold text-red-800 text-sm flex items-center gap-2">
                        Missed Follow-up (HIGH PRIORITY)
                      </h3>
                      <p className="text-red-700/90 text-sm mt-1 max-w-2xl font-medium">
                        {alert.message} - {alert.patientId?.name || "Patient"} missed their scheduled appointment.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    {alert.patientId && (
                      <button
                        onClick={() => handleCardClick(alert._id, `/patient/${alert.patientId._id || alert.patientId}`)}
                        className="hidden sm:block px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm whitespace-nowrap"
                      >
                        View Patient
                      </button>
                    )}
                    
                    {/* Collapse Button if expanded and on the last item */}
                    {showAllFollowups && idx === displayed.length - 1 && (
                      <button 
                        onClick={() => setShowAllFollowups(false)} 
                        className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Collapse
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {featuredPatient && featuredPatient.risk === 'red' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 text-sm flex items-center gap-2">
                  {text.alertTitle}
                </h3>
                <p className="text-red-700/90 text-sm mt-1 max-w-2xl">
                  <span className="font-semibold">{translatePersonName(featuredPatient.name, language)}</span>
                  {text.alertBodyPrefix}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/patient/${featuredPatient.id}`)}
              className="hidden sm:block px-4 py-2 bg-white border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              {text.viewProtocol}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MagicBento glowColor="14, 165, 233" className="p-6 cursor-default">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-semibold text-slate-600">{text.pendingVisits}</span>
              <div className="w-10 h-10 rounded-xl bg-sky-50/50 flex items-center justify-center shadow-sm border border-sky-100/50">
                <Activity size={18} className="text-sky-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600">{patients.length}</span>
              <span className="text-sm font-medium text-slate-500">{text.families}</span>
            </div>
          </MagicBento>

          <MagicBento glowColor="239, 68, 68" className="p-6 cursor-default">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-semibold text-slate-600">{text.highRisk}</span>
              <div className="w-10 h-10 rounded-xl bg-red-50/50 flex items-center justify-center shadow-sm border border-red-100/50">
                <AlertCircle size={18} className="text-red-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-red-600 to-rose-400">{highRiskCount}</span>
              <span className="text-sm font-medium text-slate-500">{text.attentionRequired}</span>
            </div>
          </MagicBento>

          <MagicBento glowColor="168, 85, 247" className="p-6 cursor-default">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-semibold text-slate-600">{text.maternalTracks}</span>
              <div className="w-10 h-10 rounded-xl bg-purple-50/50 flex items-center justify-center shadow-sm border border-purple-100/50">
                <Baby size={18} className="text-purple-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-purple-700 to-fuchsia-500">{maternalCount}</span>
              <span className="text-sm font-medium text-slate-500">{text.active}</span>
            </div>
          </MagicBento>

          <MagicBento glowColor="16, 185, 129" className="p-6 cursor-default bg-white/95 shadow-sm border border-emerald-100/50">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-semibold text-slate-600">{text.weeklyGoal}</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shadow-sm border border-emerald-100">
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-emerald-600 to-green-400">{weeklyCompletion}%</span>
              <span className="text-sm font-medium text-slate-500">{text.completed}</span>
            </div>
          </MagicBento>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4 mt-2">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                Pending Tasks & Priority Queue
              </h2>
              <button onClick={() => navigate('/directory')} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                {text.seeAll}
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {tasks.filter(t => t.status !== 'COMPLETED' && !hiddenCards.includes(t._id)).map(task => (
                <div key={task._id} 
                     onClick={() => task.patientId?._id && handleCardClick(task._id, `/patient/${task.patientId._id}`)}
                     className={`cursor-pointer p-4 rounded-xl flex justify-between items-center border shadow-sm transition-all hover:-translate-y-1 ${task.status === 'MISSED' ? 'bg-red-50/80 border-red-200 shadow-[0_4px_16px_rgba(239,68,68,0.1)]' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${task.status === 'MISSED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                      {task.patientId?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        {task.patientId?.name || 'Unknown Patient'}
                        {task.status === 'MISSED' && <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-red-500 text-white">MISSED</span>}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">{task.type} &bull; Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={(e) => handleCompleteTask(task._id, e)} className="px-3 py-1.5 bg-emerald-100/80 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xs font-bold transition-colors shadow-sm">
                    Mark Done
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {priorityPatients.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-500">
                  {text.noPatients}
                </div>
              ) : (
                priorityPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => navigate(`/patient/${patient.id}`)}
                    className={`p-3 rounded-xl transition-all cursor-pointer relative group ${getCardStyles(patient.risk)}`}
                  >
                    {patient.risk === 'red' && (
                      <div className="absolute top-0 right-0 w-8 h-8 bg-red-50/80 flex items-center justify-center rounded-bl-xl rounded-tr-xl">
                        <AlertCircle size={14} className="text-red-500" />
                      </div>
                    )}

                    <div className="flex justify-between items-center pr-6">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm hidden sm:flex shrink-0 border border-white/50 shadow-inner ${
                            patient.risk === 'red'
                              ? 'bg-red-100 text-red-700'
                              : patient.risk === 'yellow'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {translatePersonName(patient.name, language)
                            .split(' ')
                            .map((part) => part[0] || '')
                            .join('')}
                        </div>

                        <div className="flex flex-col justify-center">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                            <h3 className="font-bold text-slate-900 text-sm">
                              {translatePersonName(patient.name, language)}
                            </h3>
                            <div className="h-4 w-px bg-slate-300 hidden sm:block ml-1 mr-1"></div>
                            <span className="text-[13px] text-slate-700 font-semibold mr-1">
                              {translateIssue(patient.issue)}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${getBadgeStyles(patient.risk)}`}>
                              {patient.risk === 'red' ? text.urgent : patient.risk === 'yellow' ? text.monitor : text.routine}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {text.ageLabel} {patient.age} &bull; {translateWardLabel(patient.village, language)} &bull; {translateTime(patient.risk)}
                          </p>
                        </div>
                      </div>

                      <div className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between mb-4 mt-2">
              <h2 className="text-base font-semibold text-slate-900">{text.actions}</h2>
            </div>

            <MagicBento glowColor="203, 213, 225" className="p-2">
              <input type="file" id="qr-upload" className="hidden" accept="image/*" onChange={handlePhotoScan} />

              <button
                onClick={() => document.getElementById('qr-upload').click()}
                disabled={isScanning}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left group border border-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm border ${isScanning ? 'bg-slate-100' : 'bg-emerald-50 border-emerald-100/50'}`}>
                    <RefreshCw size={16} className={`${isScanning ? 'animate-spin text-slate-400' : 'text-emerald-600'}`} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {isScanning ? text.decodingPhoto : text.scanQr}
                  </span>
                </div>
              </button>

              <div className="h-px w-full bg-slate-100" />

              <Link to="/add-patient" className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left group border border-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center shadow-sm border border-teal-100/50">
                    <Plus size={16} className="text-teal-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{text.registerPatient}</span>
                </div>
              </Link>

              <div className="h-px w-full bg-slate-100" />

              

              <div className="h-px w-full bg-slate-100" />

              <button
                onClick={() => navigate('/directory')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-white hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left group border border-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shadow-sm border border-blue-100/50">
                    <Users size={16} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{text.findRecord}</span>
                </div>
              </button>
            </MagicBento>

            <h2 className="text-base font-semibold text-slate-900 mt-8 mb-3">{text.schedule}</h2>
            <div className="bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 min-w-[3rem]">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Oct</span>
                  <span className="text-lg font-bold text-slate-800">14</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm mb-0.5">{text.polioVaccination}</h4>
                  <p className="text-xs text-slate-500 mb-2">{text.scheduleMeta}</p>
                  <a href="#" className="text-xs font-medium text-teal-600 hover:text-teal-700">{text.participants}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
