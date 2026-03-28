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
  if (issue === 'Pregnancy Tracking') return text.pregnancyTracking;
  if (issue === 'Missed ANC') return text.missedAnc;
  if (issue === 'Polio Due') return text.polioDue;
  if (issue === 'Standard Check') return text.standardCheck;
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
        const response = await fetch('http://localhost:5000/patients/search', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const mapped = data.map((p) => ({
            id: p._id,
            name: p.name,
            age: p.age,
            ward: p.village,
            risk:
              p.currentRiskLevel.toLowerCase() === 'critical'
                ? 'red'
                : p.currentRiskLevel.toLowerCase() === 'high'
                  ? 'red'
                  : p.currentRiskLevel.toLowerCase() === 'medium'
                    ? 'yellow'
                    : 'green',
            tags: [p.isPregnant ? 'maternal' : 'general', p.currentRiskLevel.toLowerCase()],
            issue: p.isPregnant ? 'Pregnancy Tracking' : 'Routine Checkup',
            lastVisit: new Date(p.updatedAt).toLocaleDateString(),
          }));
          setPatients(mapped);
        }
      } catch {
        console.error('Backend fetch failed, using fallback mock data.');
      setPatients([
          { id: 'SS-8829', name: 'Aarti Sharma', age: 28, ward: 'Ward 4', risk: 'red', tags: ['maternal', 'high-risk'], issue: 'BP 160/100', lastVisit: '2 days ago' },
          { id: 'SS-8830', name: 'Pooja Patel', age: 24, ward: 'Ward 4', risk: 'yellow', tags: ['maternal'], issue: 'Missed ANC', lastVisit: '14 days ago' },
          { id: 'SS-8831', name: 'Rahul Kumar', age: 2, ward: 'Ward 2', risk: 'green', tags: ['pediatric', 'vaccine'], issue: 'Polio Due', lastVisit: '2 months ago' },
          { id: 'SS-8832', name: 'Sunita Devi', age: 34, ward: 'Ward 5', risk: 'green', tags: ['routine'], issue: 'Standard Check', lastVisit: '1 month ago' },
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
    <div className="p-6 lg:p-10 font-inter">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">{text.title}</h2>
            <p className="text-sm text-slate-500 font-medium">{text.subtitle}</p>
          </div>
          <div className="text-sm font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm">
            {text.totalRecords}: {patients.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-t-xl border border-slate-200 border-b-0 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={text.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
              <Filter size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase">{text.filters}</span>
            </div>

            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {text.all}
            </button>
            <button
              onClick={() => setActiveFilter('red')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${activeFilter === 'red' ? 'bg-red-600 text-white shadow-sm shadow-red-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <AlertTriangle size={14} className={activeFilter === 'red' ? 'text-white' : 'text-red-500'} />
              {text.critical}
            </button>
            <button
              onClick={() => setActiveFilter('maternal')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${activeFilter === 'maternal' ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <Baby size={14} className={activeFilter === 'maternal' ? 'text-white' : 'text-blue-500'} />
              {text.maternal}
            </button>
            <button
              onClick={() => setActiveFilter('vaccine')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${activeFilter === 'vaccine' ? 'bg-purple-600 text-white shadow-sm shadow-purple-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <Syringe size={14} className={activeFilter === 'vaccine' ? 'text-white' : 'text-purple-500'} />
              {text.vaccinations}
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-4 pl-2">{text.patientProfile}</div>
            <div className="col-span-3">{text.clinicalTag}</div>
            <div className="col-span-4">{text.statusNextStep}</div>
            <div className="col-span-1 text-right pr-2">{text.action}</div>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-12 text-center">
                <RefreshCw size={24} className="text-teal-500 animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-500">{text.loading}</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm font-medium">
                {text.noPatients}
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/patient/${patient.id}`)}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <div className="col-span-4 flex items-center gap-3 pl-2">
                    <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                      {translatePersonName(patient.name, language)
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{translatePersonName(patient.name, language)}</p>
                      <p className="text-xs text-slate-500 font-medium">
                        {text.age} {patient.age} &bull; {translateWardLabel(patient.ward, language)}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-3 flex gap-2 flex-wrap">
                    {patient.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wider">
                        {translateTag(tag, language, text)}
                      </span>
                    ))}
                  </div>

                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${patient.risk === 'red' ? 'bg-red-500 animate-pulse' : patient.risk === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        {translateIssue(patient.issue, language, text)}
                      </p>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                        <Clock size={12} /> {text.lastUpdated}: {translateLastVisit(patient.lastVisit, language, text)}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-1 flex justify-end pr-2">
                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors opacity-0 group-hover:opacity-100">
                      <ChevronRight size={20} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-slate-700 rounded transition-colors sm:hidden">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
