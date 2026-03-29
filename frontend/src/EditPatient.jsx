import React, { useState, useEffect } from 'react';
import { 
  User, MapPin, Activity, CheckCircle2, 
  ChevronRight, ChevronLeft, Baby, HeartPulse, 
  Stethoscope, ShieldCheck, QrCode, Mic, MicOff, Languages
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from './language-context';
import { getStoredToken } from './auth-utils';

export default function EditPatient() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language: appLanguage } = useLanguage();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState('en-IN');

  const text = appLanguage === 'hi'
    ? {
        header: 'रोगी विवरण संपादित करें',
        subheader: 'विद्यमान Swasthya Sathi रिकॉर्ड अपडेट करें।',
        identity: 'पहचान',
        location: 'स्थान',
        category: 'श्रेणी',
        details: 'विवरण',
        firstName: 'पहला नाम',
        lastName: 'उपनाम',
        ageYears: 'आयु (वर्ष)',
        gender: 'लिंग',
        female: 'महिला',
        male: 'पुरुष',
        mobile: 'मोबाइल नंबर',
        ward: 'गांव / वार्ड',
        address: 'पता विवरण',
        categoryTitle: 'मुख्य क्लिनिकल ट्रैक',
        categorySubtitle: 'उचित देखभाल समयरेखा के लिए मुख्य श्रेणी चुनें।',
        maternalCare: 'मातृ देखभाल',
        maternalDesc: 'ANC ट्रैकिंग, पोषण और प्रसव पूर्व/पश्चात निगरानी।',
        pediatric: 'बाल देखभाल',
        pediatricDesc: 'टीकाकरण, वृद्धि ट्रैकिंग और इम्यूनाइजेशन।',
        chronic: 'दीर्घकालिक बीमारी',
        chronicDesc: 'हाइपरटेंशन, डायबिटीज और लंबी अवधि की निगरानी।',
        general: 'सामान्य ट्रायेज',
        generalDesc: 'सामान्य लक्षण जांच और मौसमी बीमारी रिकॉर्ड।',
        back: 'वापस',
        continue: 'आगे बढ़ें',
        completeUpdate: 'रिकॉर्ड अपडेट करें',
        saveChanges: 'परिवर्तन सहेजें',
        encrypting: 'सुरक्षित किया जा रहा है...',
        successTitle: 'अपडेट सफल',
        successBody: 'का डेटा सुरक्षित रूप से अपडेट कर दिया गया है।',
        registrationStatus: 'पंजीकरण स्थिति',
        patientUpdated: 'रोगी अपडेटेड',
        backToProfile: 'प्रोफ़ाइल पर वापस जाएं',
      }
    : {
        header: 'Edit Patient Details',
        subheader: 'Update an existing Swasthya Sathi record.',
        identity: 'Identity',
        location: 'Location',
        category: 'Category',
        details: 'Details',
        firstName: 'First Name',
        lastName: 'Last Name',
        ageYears: 'Age (Years)',
        gender: 'Gender',
        female: 'Female',
        male: 'Male',
        mobile: 'Mobile Number',
        ward: 'Village / Ward Assignment',
        address: 'Specific Address Details',
        categoryTitle: 'Primary Clinical Track',
        categorySubtitle: 'Update the main pathway to ensure accurate AI monitoring.',
        maternalCare: 'Maternal Care',
        maternalDesc: 'ANC tracking, nutrition, and pre/post natal monitoring.',
        pediatric: 'Pediatric',
        pediatricDesc: 'Infant vaccinations, growth tracking, and immunizations.',
        chronic: 'Chronic Illness',
        chronicDesc: 'Hypertension, Diabetes, and long-term condition management.',
        general: 'General Triage',
        generalDesc: 'Standard symptomatic checks and seasonal illness logging.',
        back: 'Back',
        continue: 'Continue',
        completeUpdate: 'Complete Update',
        saveChanges: 'Save Changes',
        encrypting: 'Syncing...',
        successTitle: 'Record Updated',
        successBody: "'s clinical records have been synchronized with the central database.",
        registrationStatus: 'Update Status',
        patientUpdated: 'Patient Updated',
        backToProfile: 'Back to Profile',
      };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    phone: '',
    ward: '',
    address: '',
    category: '',
    notes: '',
    bp: '',
    weight: '',
    bloodSugar: '',
    symptoms: '',
    otherFactors: '',
    lmp: '',
  });

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const token = await getStoredToken();
        const response = await fetch(`http://localhost:5000/patients/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch patient');
        const p = await response.json();
        
        const nameParts = (p.name || '').split(' ');
        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          age: p.age || '',
          gender: p.gender === 'Female' ? 'F' : p.gender === 'Male' ? 'M' : '',
          phone: p.phone || '',
          ward: p.village || '',
          address: p.address || '',
          category: p.isPregnant ? 'maternal' : 'general',
          notes: p.notes || '',
          lmp: p.pregnancyStartDate ? new Date(p.pregnancyStartDate).toISOString().split('T')[0] : '',
          // Vitals will be fetched from visits if needed, or left blank for new entries
          bp: '', 
          weight: '',
          bloodSugar: '',
          symptoms: '',
          otherFactors: ''
        });
      } catch (err) {
        console.error("Error loading patient:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatientData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({ ...prev, category }));
  };

  const handleNext = () => setStep(prev => Math.min(prev + 1, 5));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const toggleListening = () => {
    if (isListening) return; 
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your current browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechLanguage;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setFormData(prev => ({ 
        ...prev, 
        notes: prev.notes + (prev.notes ? ' ' : '') + transcript 
      }));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = await getStoredToken();
      
      const genderMap = { 'F': 'Female', 'M': 'Male', 'O': 'Other' };
      const patientPayload = {
        name: `${formData.firstName} ${formData.lastName}`,
        age: parseInt(formData.age),
        gender: genderMap[formData.gender] || 'Female',
        phone: formData.phone,
        village: formData.ward,
        isPregnant: formData.category === 'maternal',
        pregnancyStartDate: formData.category === 'maternal' ? formData.lmp : null,
      };

      // 1. Update Patient Data
      const updateRes = await fetch(`http://localhost:5000/patients/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(patientPayload)
      });

      if (!updateRes.ok) throw new Error("Update failed");

      // 2. If vitals are entered, log a visit
      if (formData.bp || formData.weight || formData.symptoms) {
        await fetch(`http://localhost:5000/patients/${id}/visits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            patientId: id,
            vitals: { bloodPressure: formData.bp, weight: parseFloat(formData.weight) || undefined },
            symptoms: formData.symptoms ? formData.symptoms.split(',').map(s => s.trim()) : [],
            notes: formData.notes
          })
        });
      }

      setIsComplete(true);
    } catch (err) {
      alert(`Update Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClassName = 'w-full h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none transition-all';
  const textareaClassName = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 outline-none transition-all resize-none';

  if (isLoading) return <div className="p-10 text-center">Loading patient data...</div>;

  return (
    <div className="p-6 lg:p-10 font-inter min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/80 via-white to-emerald-50/30">
      <motion.div 
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 overflow-hidden min-h-[600px] flex flex-col"
      >
        <div className="bg-slate-900/95 backdrop-blur-md p-6 text-white shrink-0 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight">{text.header}</h2>
          <p className="text-sm text-slate-300 mt-1 font-medium">{text.subheader}</p>
        </div>

        {!isComplete ? (
          <div className="p-8 flex-1 flex flex-col justify-between">
            
            {/* Steps Indicator */}
            <div className="mb-8 relative">
              <div className="flex justify-between relative z-10">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div key={num} className="flex flex-col items-center gap-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= num ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 border-2 border-slate-200'}`}>
                      {step > num ? <CheckCircle2 size={16} /> : num}
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute top-[18px] left-0 w-full h-1 bg-slate-100 -z-0 rounded-full">
                <div className="h-full bg-emerald-500 transition-all duration-500 rounded-full" style={{ width: `${((step - 1) / 4) * 100}%` }} />
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">{text.firstName}</label>
                      <input name="firstName" value={formData.firstName} onChange={handleInputChange} className={fieldClassName} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">{text.lastName}</label>
                      <input name="lastName" value={formData.lastName} onChange={handleInputChange} className={fieldClassName} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{text.ageYears}</label>
                    <input type="number" name="age" value={formData.age} onChange={handleInputChange} className={fieldClassName} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{text.mobile}</label>
                    <input name="phone" value={formData.phone} onChange={handleInputChange} className={fieldClassName} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{text.ward}</label>
                    <input name="ward" value={formData.ward} onChange={handleInputChange} className={fieldClassName} placeholder="e.g. Ward 4" />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900">{text.categoryTitle}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => handleCategorySelect('maternal')} className={`p-4 rounded-xl border-2 text-left ${formData.category === 'maternal' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}>
                      <Baby size={24} className="mb-2 text-emerald-600" />
                      <h4 className="font-bold">{text.maternalCare}</h4>
                    </button>
                    <button onClick={() => handleCategorySelect('general')} className={`p-4 rounded-xl border-2 text-left ${formData.category === 'general' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}>
                      <Stethoscope size={24} className="mb-2 text-blue-600" />
                      <h4 className="font-bold">General Care</h4>
                    </button>
                  </div>
                  {formData.category === 'maternal' && (
                    <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                      <label className="block text-sm font-bold text-emerald-900 mb-2">LMP (Last Menstrual Period) Date</label>
                      <input type="date" name="lmp" value={formData.lmp} onChange={handleInputChange} className={fieldClassName} />
                    </div>
                  )}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <h3 className="text-lg font-black text-slate-900">Clinical Checkup & AI Update</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input name="bp" placeholder="BP (e.g. 120/80)" value={formData.bp} onChange={handleInputChange} className={fieldClassName} />
                    <input name="weight" placeholder="Weight (kg)" value={formData.weight} onChange={handleInputChange} className={fieldClassName} />
                  </div>
                  <textarea name="symptoms" placeholder="Symptoms..." value={formData.symptoms} onChange={handleInputChange} rows={3} className={textareaClassName} />
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-end mb-2">
                    <h3 className="text-lg font-bold text-slate-900">Final Notes</h3>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-sm">
                      <Languages size={14} className="text-slate-400" />
                      <select 
                        value={speechLanguage}
                        onChange={(e) => setSpeechLanguage(e.target.value)}
                        className="text-xs font-medium text-slate-600 bg-transparent focus:outline-none cursor-pointer"
                      >
                        <option value="en-IN">English (India)</option>
                        <option value="hi-IN">Hindi</option>
                        <option value="mr-IN">Marathi</option>
                        <option value="bn-IN">Bengali</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <textarea 
                      name="notes" 
                      value={formData.notes} 
                      onChange={handleInputChange} 
                      rows={6} 
                      className={`${textareaClassName} pb-20 font-medium`}
                    ></textarea>
                    
                    {/* Interactive Mic Button (Enlarged) */}
                    <button 
                      onClick={toggleListening}
                      className={`absolute bottom-4 right-4 px-6 py-3 rounded-full flex items-center gap-3 transition-all shadow-lg active:scale-95 ${
                        isListening 
                          ? 'bg-red-500 text-white animate-pulse shadow-red-500/40 ring-4 ring-red-500/20' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/30 hover:shadow-emerald-500/50'
                      }`}
                      title="Start Voice Typing"
                    >
                      {isListening ? <Mic size={24} /> : <Mic size={24} />}
                      <span className="text-sm font-extrabold tracking-wide">
                        {isListening ? 'Listening...' : 'Dictate'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-8 border-t border-slate-100 flex justify-between">
              <button onClick={handleBack} disabled={step === 1} className="px-5 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl font-semibold disabled:opacity-30">
                {text.back}
              </button>
              {step < 5 ? (
                <button onClick={handleNext} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-lg">
                  {text.continue} <ChevronRight size={18} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg active:scale-95">
                  {isSubmitting ? text.encrypting : text.completeUpdate} <ShieldCheck size={18} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-10 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
            <CheckCircle2 size={80} className="text-emerald-500 mb-6" />
            <h3 className="text-3xl font-black text-slate-900 mb-2">{text.successTitle}</h3>
            <p className="text-slate-500 max-w-sm mb-10">{formData.firstName}{text.successBody}</p>
            <button onClick={() => navigate(`/patient/${id}`)} className="px-8 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg hover:bg-teal-700 transition-all">
              {text.backToProfile}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
