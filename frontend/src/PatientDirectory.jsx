import {
  Search,
  Filter,
  AlertTriangle,
  Baby,
  Syringe,
  ChevronRight,
  Clock,
  MoreVertical,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLanguage } from './language-context';
import { translatePersonName, translateWardLabel } from './text-utils';
import { getStoredToken } from './auth-utils';

const hindiText = {
  title: 'रोगी सूची',
  subtitle: 'अपने पंजीकृत रोगियों को देखें और ट्रैक करें।',
  totalRecords: 'कुल रिकॉर्ड',
  searchPlaceholder: 'नाम से खोजें...',
  filters: 'फ़िल्टर',
  all: 'सभी',
  critical: 'गंभीर',
  maternal: 'मातृ',
  vaccinations: 'टीकाकरण',
  patientProfile: 'रोगी प्रोफ़ाइल',
  clinicalTag: 'क्लिनिकल टैग',
  statusNextStep: 'स्थिति और अगला कदम',
  action: 'कार्य',
  loading: 'रोगी रिकॉर्ड लाए जा रहे हैं...',
  noPatients: 'इस फ़िल्टर में कोई रोगी नहीं मिला।',
  age: 'आयु',
  lastUpdated: 'अंतिम अपडेट',
  general: 'सामान्य',
  highRisk: 'उच्च जोखिम',
  medium: 'मध्यम',
  low: 'कम',
  criticalTag: 'गंभीर',
  routineCheckup: 'नियमित जांच',
  pregnancyTracking: 'गर्भावस्था ट्रैकिंग',
  missedAnc: 'एएनसी जांच छूटी',
  polioDue: 'पोलियो लंबित',
  standardCheck: 'सामान्य जांच',
  daysAgo: 'दिन पहले',
  monthsAgo: 'महीने पहले',
  awaitingAssessment: 'मूल्यांकन लंबित',
  ward: 'वार्ड',
};

const englishText = {
  title: 'Patient Directory',
  subtitle: 'Manage and track your assigned demographic.',
  totalRecords: 'Total Records',
  searchPlaceholder: 'Search by name...',
  filters: 'Filters',
  all: 'All',
  critical: 'Critical',
  maternal: 'Maternal',
  vaccinations: 'Vaccinations',
  patientProfile: 'Patient Profile',
  clinicalTag: 'Clinical Tag',
  statusNextStep: 'Status & Next Step',
  action: 'Action',
  loading: 'Retrieving patient records...',
  noPatients: 'No patients found matching this criteria.',
  age: 'Age',
  lastUpdated: 'Last updated',
  general: 'general',
  highRisk: 'high-risk',
  medium: 'medium',
  low: 'low',
  criticalTag: 'critical',
  routineCheckup: 'Routine Checkup',
  pregnancyTracking: 'Pregnancy Tracking',
  missedAnc: 'Missed ANC',
  polioDue: 'Polio Due',
  standardCheck: 'Standard Check',
  daysAgo: 'days ago',
  monthsAgo: 'months ago',
  awaitingAssessment: 'Awaiting Assessment',
  ward: 'Ward',
};

function translateTag(tag, language, text) {
  if (language !== 'hi') return tag;
  if (tag === 'maternal') return text.maternal;
  if (tag === 'general') return text.general;
  if (tag === 'high-risk') return text.highRisk;
  if (tag === 'critical') return text.criticalTag;
  if (tag === 'medium') return text.medium;
  if (tag === 'low') return text.low;
  if (tag === 'vaccine') return 'टीका';
  if (tag === 'pediatric') return 'बाल';
  if (tag === 'routine') return 'नियमित';
  return tag;
}

function translateIssue(issue, language, text) {
  if (language !== 'hi') return issue;
  if (issue === 'Routine Checkup') return text.routineCheckup;
  if (issue === 'Polio Due') return text.polioDue;
  if (issue === 'Standard Check') return text.standardCheck;
  if (issue === 'Maternal Follow-up') return 'मातृ अनुवर्ती';
  if (issue === 'High Risk monitoring') return 'उच्च जोखिम निगरानी';
  if (issue === 'Vaccination') return 'टीकाकरण';
  if (issue === 'Awaiting Assessment') return text.awaitingAssessment;
  return issue;
}

function translateLastVisit(lastVisit, language, text) {
  if (language !== 'hi') return lastVisit;
  return lastVisit
    .replace(' days ago', ` ${text.daysAgo}`)
    .replace(' day ago', ` ${text.daysAgo}`)
    .replace(' months ago', ` ${text.monthsAgo}`)
    .replace(' month ago', ` ${text.monthsAgo}`);
}

function getAssignedAshaId(patient) {
  if (!patient?.ashaId) return null;
  if (typeof patient.ashaId === 'string') return patient.ashaId;
  return patient.ashaId._id || null;
}

export default function PatientDirectory() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const text = language === 'hi' ? hindiText : englishText;

  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true);
      try {
        const token = await getStoredToken();
        const response = await fetch('http://localhost:5000/patients/search?assigned=true', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const storedUser = JSON.parse(localStorage.getItem('swasthya_user') || 'null');
          const currentUserId = storedUser?._id || null;
          const assignedPatients = currentUserId
            ? data.filter((patient) => String(getAssignedAshaId(patient)) === String(currentUserId))
            : data;
          const mapped = assignedPatients.map((p) => {
            const riskLower = (p.currentRiskLevel || 'low').toLowerCase();
            const riskColor = (riskLower === 'critical' || riskLower === 'high') ? 'red' : riskLower === 'medium' ? 'yellow' : 'green';
            const tags = [];
            if (p.isPregnant) tags.push('maternal');
            if (riskLower === 'critical' || riskLower === 'high') tags.push('high-risk');
            if (p.age < 15) tags.push('vaccine');
            if (tags.length === 0) tags.push('general');
            tags.push(riskLower);
            return {
              id: p._id,
              name: p.name,
              age: p.age,
              ward: p.village || 'Unassigned',
              risk: riskColor,
              tags,
              issue: p.pendingTask || (p.isPregnant ? 'Pregnancy Tracking' : 'Routine Checkup'),
              lastVisit: new Date(p.updatedAt).toLocaleDateString(),
            };
          });
          setPatients(mapped);
        }
      } catch {
        console.error('Backend fetch failed, using fallback mock data.');
        setPatients([
          { id: 'mock-1', name: 'Aarti Sharma', age: 28, ward: 'Ward 4', risk: 'red', tags: ['maternal', 'high-risk'], issue: 'Maternal Follow-up', lastVisit: new Date().toLocaleDateString() },
          { id: 'mock-2', name: 'Pooja Patel', age: 24, ward: 'Ward 4', risk: 'yellow', tags: ['maternal', 'medium'], issue: 'Pregnancy Tracking', lastVisit: new Date().toLocaleDateString() },
          { id: 'mock-3', name: 'Rahul Kumar', age: 3, ward: 'Ward 2', risk: 'green', tags: ['vaccine', 'low'], issue: 'Vaccination', lastVisit: new Date().toLocaleDateString() },
          { id: 'mock-4', name: 'Sunita Devi', age: 34, ward: 'Ward 5', risk: 'green', tags: ['general', 'low'], issue: 'Routine Checkup', lastVisit: new Date().toLocaleDateString() },
          { id: 'mock-5', name: 'Kishan Joshi', age: 22, ward: 'Ward 1', risk: 'red', tags: ['high-risk', 'critical'], issue: 'High Risk monitoring', lastVisit: new Date().toLocaleDateString() },
          { id: 'mock-6', name: 'Anil Devi', age: 5, ward: 'Ward 1', risk: 'green', tags: ['vaccine', 'low'], issue: 'Vaccination', lastVisit: new Date().toLocaleDateString() },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      translatePersonName(patient.name, language).toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === 'red') return patient.risk === 'red';
    if (activeFilter === 'maternal') return patient.tags.includes('maternal');
    if (activeFilter === 'vaccine') return patient.tags.includes('vaccine');
    return true;
  });

  return (
    <div className="p-6 lg:p-10 font-inter min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/80 via-white to-emerald-50/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", staggerChildren: 0.1 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-700 to-slate-600 mb-1">{text.title}</h2>
            <p className="text-sm text-slate-500 font-medium">{text.subtitle}</p>
          </div>
          <div className="text-sm font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm">
            {text.totalRecords}: {patients.length}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-t-2xl border border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row gap-4 justify-between items-center z-10 relative">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={text.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/50 backdrop-blur-md border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center gap-2 pr-4 border-r border-slate-200/50">
              <Filter size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase">{text.filters}</span>
            </div>

            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap active:scale-[0.98] ${activeFilter === 'all' ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20' : 'bg-transparent text-slate-600 hover:bg-white hover:shadow-sm'}`}
            >
              {text.all}
            </button>
            <button
              onClick={() => setActiveFilter('red')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap active:scale-[0.98] ${activeFilter === 'red' ? 'bg-red-500 text-white shadow-md shadow-red-500/25' : 'bg-transparent text-slate-600 hover:bg-white hover:text-red-600 hover:shadow-sm'}`}
            >
              <AlertTriangle size={14} className={activeFilter === 'red' ? 'text-white' : 'text-slate-400'} />
              {text.critical}
            </button>
            <button
              onClick={() => setActiveFilter('maternal')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap active:scale-[0.98] ${activeFilter === 'maternal' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25' : 'bg-transparent text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm'}`}
            >
              <Baby size={14} className={activeFilter === 'maternal' ? 'text-white' : 'text-slate-400'} />
              {text.maternal}
            </button>
            <button
              onClick={() => setActiveFilter('vaccine')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap active:scale-[0.98] ${activeFilter === 'vaccine' ? 'bg-purple-500 text-white shadow-md shadow-purple-500/25' : 'bg-transparent text-slate-600 hover:bg-white hover:text-purple-600 hover:shadow-sm'}`}
            >
              <Syringe size={14} className={activeFilter === 'vaccine' ? 'text-white' : 'text-slate-400'} />
              {text.vaccinations}
            </button>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-2xl border border-white/80 rounded-b-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-5 border-b border-slate-200/50 bg-slate-50/30 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-4 pl-2">{text.patientProfile}</div>
            <div className="col-span-3">{text.clinicalTag}</div>
            <div className="col-span-4">{text.statusNextStep}</div>
            <div className="col-span-1 text-right pr-2">{text.action}</div>
          </div>

          <div className="divide-y divide-slate-100/50 p-2">
            {isLoading ? (
              <div className="p-12 text-center">
                <RefreshCw size={24} className="text-emerald-500 animate-spin mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-500">{text.loading}</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm font-semibold">
                {text.noPatients}
              </div>
            ) : (
              filteredPatients.map((patient, idx) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 + 0.2 }}
                  onClick={() => navigate(`/patient/${patient.id}`)}
                  className="grid grid-cols-12 gap-4 p-4 items-center bg-transparent hover:bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer rounded-2xl mx-1 my-1 border border-transparent hover:border-slate-100"
                >
                  <div className="col-span-4 flex items-center gap-3 pl-2">
                    <div className="w-11 h-11 rounded-xl bg-slate-100/80 flex items-center justify-center font-bold text-slate-600 text-sm shadow-sm border border-slate-200/50 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      {translatePersonName(patient.name, language)
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{translatePersonName(patient.name, language)}</p>
                      <p className="text-xs text-slate-500 font-medium">
                        {text.age} {patient.age} &bull; {translateWardLabel(patient.ward, language)}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-3 flex gap-2 flex-wrap">
                    {patient.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 bg-slate-100/80 text-slate-600 border border-slate-200/50 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        {translateTag(tag, language, text)}
                      </span>
                    ))}
                  </div>

                  <div className="col-span-4 flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                      {patient.risk === 'red' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${patient.risk === 'red' ? 'bg-red-500' : patient.risk === 'yellow' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        {translateIssue(patient.issue, language, text)}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <Clock size={12} /> {text.lastUpdated}: {translateLastVisit(patient.lastVisit, language, text)}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-1 flex justify-end pr-2">
                    <button className="p-2 text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 group-hover:scale-110 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                      <ChevronRight size={20} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition-colors sm:hidden">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
