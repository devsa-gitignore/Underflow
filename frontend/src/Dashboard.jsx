import React, { useEffect, useState } from 'react';
import { 
  Plus, Users, Baby, RefreshCw, 
  ChevronRight, AlertCircle, Activity, CheckCircle2 
} from 'lucide-react';
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
      risk,
      issue: patient.pendingTask || (patient.isPregnant ? 'Pregnancy Tracking' : 'Routine Checkup'),
      time: risk === 'red' ? 'Overdue' : risk === 'yellow' ? 'Today' : 'On Track',
    };
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [patients, setPatients] = useState([]);
  const { language } = useLanguage();
  const text = language === 'hi' ? hindiText : englishText;

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = await getStoredToken();
        const response = await fetch('http://localhost:5000/patients/search', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch patients');

        const data = await response.json();
        setPatients(mapPatients(data));
      } catch {
        // Fallback mock data for hackathon demo
        setPatients([
          { id: 'mock-1', name: 'Aarti Sharma', age: 28, risk: 'red', issue: 'Severe Anemia - BP 160/100', time: 'Overdue', village: 'Ward 4', isPregnant: true },
          { id: 'mock-2', name: 'Pooja Patel', age: 24, risk: 'yellow', issue: 'Missed ANC Checkup', time: 'Today', village: 'Ward 4', isPregnant: true },
          { id: 'mock-3', name: 'Sunita Devi', age: 34, risk: 'green', issue: 'Routine Checkup', time: 'On Track', village: 'Ward 5', isPregnant: false },
          { id: 'mock-4', name: 'Rahul Kumar', age: 2, risk: 'green', issue: 'Vaccination', time: 'Done', village: 'Ward 2', isPregnant: false },
          { id: 'mock-5', name: 'Meena Kumari', age: 22, risk: 'yellow', issue: 'Maternal Follow-up', time: 'Tomorrow', village: 'Ward 5', isPregnant: true },
        ]);
      }
    };

    fetchPatients();
  }, []);


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

  const sortedPatients = [...patients].sort((a, b) => {
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
        return 'bg-red-50 border-l-[3px] border-red-500 shadow-sm relative overflow-hidden group';
      case 'yellow':
        return 'bg-yellow-50/50 border-l-[3px] border-yellow-400 group';
      case 'green':
        return 'bg-white border border-slate-200 group';
      default:
        return 'bg-white border border-slate-200 group';
    }
  };

  const getBadgeStyles = (risk) => {
    switch (risk) {
      case 'red': return 'bg-red-100 text-red-700';
      case 'yellow': return 'bg-yellow-100 text-yellow-700';
      case 'green': return 'bg-teal-50 text-teal-700';
      default: return 'bg-slate-100 text-slate-700';
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
    <div className="p-6 lg:p-10 font-inter">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-1">{text.overview}</h2>
            <p className="text-sm text-slate-500">{text.overviewSubtitle}</p>
          </div>
          <Link to="/add-patient" className="sm:hidden flex items-center justify-center w-10 h-10 bg-teal-600 text-white rounded-full shadow-md">
            <Plus size={20} />
          </Link>
        </div>

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
          <MagicBento glowColor="14, 165, 233" className="bg-white p-5 cursor-default">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-medium text-slate-500">{text.pendingVisits}</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                <Activity size={16} className="text-sky-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-slate-900">{patients.length}</span>
              <span className="text-sm text-slate-500">{text.families}</span>
            </div>
          </MagicBento>

          <MagicBento glowColor="239, 68, 68" className="bg-white p-5 cursor-default">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-medium text-slate-500">{text.highRisk}</span>
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertCircle size={16} className="text-red-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-slate-900">{highRiskCount}</span>
              <span className="text-sm text-slate-500">{text.attentionRequired}</span>
            </div>
          </MagicBento>

          <MagicBento glowColor="168, 85, 247" className="bg-white p-5 cursor-default">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-medium text-slate-500">{text.maternalTracks}</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Baby size={16} className="text-purple-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-slate-900">{maternalCount}</span>
              <span className="text-sm text-slate-500">{text.active}</span>
            </div>
          </MagicBento>

          <MagicBento glowColor="20, 184, 166" className="bg-white p-5 cursor-default">
            <div className="flex justify-between items-start mb-6">
              <span className="text-sm font-medium text-slate-500">{text.weeklyGoal}</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-teal-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-slate-900">{weeklyCompletion}%</span>
              <span className="text-sm text-slate-500">{text.completed}</span>
            </div>
          </MagicBento>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4 mt-2">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                {text.priorityQueue}
              </h2>
              <button onClick={() => navigate('/directory')} className="text-sm font-medium text-teal-600 hover:text-teal-700">
                {text.seeAll}
              </button>
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
                    className={`p-4 rounded-xl transition-all cursor-pointer ${getCardStyles(patient.risk)}`}
                  >
                    {patient.risk === 'red' && (
                      <div className="absolute top-0 right-0 w-8 h-8 bg-red-50 flex items-center justify-center rounded-bl-xl">
                        <AlertCircle size={14} className="text-red-500" />
                      </div>
                    )}

                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm hidden sm:flex shrink-0 ${
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

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 text-sm">
                              {translatePersonName(patient.name, language)}
                            </h3>
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wider ${getBadgeStyles(patient.risk)}`}>
                              {patient.risk === 'red' ? text.urgent : patient.risk === 'yellow' ? text.monitor : text.routine}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mb-2">
                            {text.ageLabel} {patient.age} • {translateWardLabel(patient.village, language)} • {translateTime(patient.risk)}
                          </p>

                          <div className="text-sm text-slate-700 flex items-center gap-2">
                            {translateIssue(patient.issue)}
                          </div>
                        </div>
                      </div>

                      <div className="hidden sm:flex self-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={18} className="text-slate-400" />
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

            <MagicBento glowColor="203, 213, 225" className="bg-white p-1">
              <input type="file" id="qr-upload" className="hidden" accept="image/*" onChange={handlePhotoScan} />

              <button
                onClick={() => document.getElementById('qr-upload').click()}
                disabled={isScanning}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors text-left group border border-transparent"
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

              <Link to="/add-patient" className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors text-left group border border-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center shadow-sm border border-teal-100/50">
                    <Plus size={16} className="text-teal-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{text.registerPatient}</span>
                </div>
              </Link>

              <div className="h-px w-full bg-slate-100" />

              <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors text-left group border border-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center shadow-sm border border-purple-100/50">
                    <Baby size={16} className="text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{text.logMaternal}</span>
                </div>
              </button>

              <div className="h-px w-full bg-slate-100" />

              <button
                onClick={() => navigate('/directory')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors text-left group border border-transparent"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shadow-sm border border-blue-100/50">
                    <Users size={16} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{text.findRecord}</span>
                </div>
              </button>
            </MagicBento>

            <h2 className="text-base font-semibold text-slate-900 mt-6 mb-3">{text.schedule}</h2>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
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
      </div>
    </div>
  );
}
