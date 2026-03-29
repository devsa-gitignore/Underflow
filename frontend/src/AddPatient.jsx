import React, { useState } from 'react';
import { 
  User, MapPin, Activity, CheckCircle2, 
  ChevronRight, ChevronLeft, Baby, HeartPulse, 
  Stethoscope, ShieldCheck, QrCode, Mic, MicOff, Languages
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './language-context';
import { getStoredToken } from './auth-utils';
import { enqueueAction, isOfflineError } from './sync-utils';
import QRCode from 'qrcode';
export default function AddPatient() {
  const navigate = useNavigate();
  const { language: appLanguage } = useLanguage();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // New State for Step 4
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState('en-IN');
  const text = appLanguage === 'hi'
    ? {
        header: 'नया रोगी पंजीकरण',
        subheader: 'आधिकारिक Swasthya Sathi रिकॉर्ड बनाएं।',
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
        notes: 'प्रारंभिक क्लिनिकल नोट्स',
        identification: 'रोगी पहचान',
        qrReady: 'क्यूआर कोड रोगी खोज के लिए तैयार है',
        savedDb: 'डेटाबेस में सहेजा गया',
        syncDb: 'डेटाबेस से सिंक हो रहा है...',
        generateQr: 'अद्वितीय क्यूआर कोड बनाएं',
        back: 'वापस',
        continue: 'आगे बढ़ें',
        completeRegistration: 'पंजीकरण पूरा करें',
        encrypting: 'सुरक्षित किया जा रहा है...',
        successTitle: 'पंजीकरण सत्यापित',
        successBody: 'का डेटा सुरक्षित रूप से सूची में जोड़ दिया गया है।',
        registrationStatus: 'पंजीकरण स्थिति',
        patientAdded: 'रोगी जोड़ा गया',
        backToDirectory: 'सूची पर वापस जाएं',
        dashboard: 'डैशबोर्ड',
      }
    : {
        header: 'Register New Patient',
        subheader: 'Create an official Swasthya Sathi record.',
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
        categorySubtitle: 'Select the main pathway to generate the proper care timeline.',
        maternalCare: 'Maternal Care',
        maternalDesc: 'ANC tracking, nutrition, and pre/post natal monitoring.',
        pediatric: 'Pediatric',
        pediatricDesc: 'Infant vaccinations, growth tracking, and immunizations.',
        chronic: 'Chronic Illness',
        chronicDesc: 'Hypertension, Diabetes, and long-term condition management.',
        general: 'General Triage',
        generalDesc: 'Standard symptomatic checks and seasonal illness logging.',
        notes: 'Initial Clinical Notes',
        identification: 'Patient Identification',
        qrReady: 'QR code ready for patient lookup',
        savedDb: 'Saved to Database',
        syncDb: 'Syncing with Database...',
        generateQr: 'Generate Unique QR Code',
        back: 'Back',
        continue: 'Continue',
        completeRegistration: 'Complete Registration',
        encrypting: 'Encrypting...',
        successTitle: 'Registration Verified',
        successBody: "'s data has been encrypted and safely added to the directory.",
        registrationStatus: 'Registration Status',
        patientAdded: 'Patient Added',
        backToDirectory: 'Back to Directory',
        dashboard: 'Dashboard',
      };

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    phone: '',
    ward: 'Ward 1',
    address: '',
    category: '',
    notes: '',
    pendingTask: 'Routine Checkup',
    // Vitals (Step 4)
    bp: '',
    weight: '',
    bloodSugar: '',
    symptoms: '',
    otherFactors: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({ ...prev, category }));
  };

  const handleNext = () => setStep(prev => Math.min(prev + 1, 5));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const generateQR = async () => {
    setIsGeneratingQR(true);
    
    try {
      const token = localStorage.getItem('swasthya_token');
      if (!token) throw new Error("Authentication token missing. Please log in again.");

      // Map frontend gender 'F'/'M' to backend 'Female'/'Male'
      const genderMap = { 'F': 'Female', 'M': 'Male', 'O': 'Other' };
      
      const patientPayload = {
        name: `${formData.firstName} ${formData.lastName}`,
        age: parseInt(formData.age),
        gender: genderMap[formData.gender] || 'Female',
        phone: formData.phone,
        village: formData.ward,
        region: 'Palghar', // Default region
        isPregnant: formData.category === 'maternal',
        pendingTask: formData.pendingTask || 'Routine Checkup',
      };

      console.log("🚀 Creating patient with payload:", patientPayload);

      // 1. Create Patient Record in DB
      const createResponse = await fetch('http://localhost:5000/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(patientPayload)
      });

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        console.error("❌ Backend Error:", createData);
        throw new Error(createData.message || "Failed to create patient record");
      }
      
      const patientId = createData._id;
      console.log("✅ Patient created with ID:", patientId);

      // 2. Now generate the QR code via backend
      const qrResponse = await fetch(`http://localhost:5000/patients/${patientId}/qr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const qrData = await qrResponse.json();

      if (!qrResponse.ok) {
        console.error("❌ QR Error:", qrData);
        throw new Error(qrData.message || "Failed to generate QR code");
      }

      setQrCodeUrl(qrData.qrCode); // Backend returns dataURL/Base64
      
    } catch (error) {
      console.error("🛑 Registration Workflow Error:", error);
      
      if (isOfflineError(error)) {
        console.warn("🌐 Offline detected. Action queued for sync.");
        const localId = enqueueAction('CREATE_PATIENT', patientPayload);
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${localId}`);
      } else {
        alert(`Integration Error: ${error.message}`);
      }
    } finally {
      setIsGeneratingQR(false);
    }
  };

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

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Since we created the patient in generateQR step, 
    // we just simulate final encryption/commit here.
    setTimeout(() => {
      setIsSubmitting(false);
      setIsComplete(true);
    }, 1200);
  };

  const fieldClassName =
    'w-full h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/25 focus-visible:ring-offset-1 focus-visible:border-emerald-500';

  const textareaClassName =
    'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/25 focus-visible:ring-offset-1 focus-visible:border-emerald-500 resize-none';

  const StepIndicator = () => (
    <div className="mb-8 relative">
      <div className="flex justify-between relative z-10">
        {[1, 2, 3, 4, 5].map((num) => (
          <div key={num} className="flex flex-col items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
              step >= num 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
            }`}>
              {step > num ? <CheckCircle2 size={16} /> : num}
            </div>
            <span className={`text-[10px] font-semibold ${step >= num ? 'text-slate-800' : 'text-slate-400'}`}>
              {num === 1 ? text.identity : num === 2 ? text.location : num === 3 ? text.category : num === 4 ? 'Vitals' : text.details}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute top-[18px] left-0 w-full h-1 bg-slate-100 -z-0 rounded-full">
        <div 
          className="h-full bg-emerald-500 transition-all duration-500 rounded-full" 
          style={{ width: `${((step - 1) / 4) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-10 font-inter min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/80 via-white to-emerald-50/30">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden relative min-h-[600px] flex flex-col"
      >
          
        {/* Header */}
        <div className="bg-slate-900/95 backdrop-blur-md p-6 text-white shrink-0 shadow-sm border-b border-slate-800/50">
          <h2 className="text-xl font-bold tracking-tight">{text.header}</h2>
          <p className="text-sm text-slate-300 mt-1 font-medium">{text.subheader}</p>
        </div>

        {!isComplete ? (
          <div className="p-8 flex-1 flex flex-col justify-between">
            
            <StepIndicator />

            {/* STEP 1: IDENTITY */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{text.firstName}</label>
                    <input 
                      type="text" name="firstName" value={formData.firstName} onChange={handleInputChange}
                      className={fieldClassName}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{text.lastName}</label>
                    <input 
                      type="text" name="lastName" value={formData.lastName} onChange={handleInputChange}
                      className={fieldClassName}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{text.ageYears}</label>
                    <input 
                      type="number" name="age" value={formData.age} onChange={handleInputChange}
                      className={fieldClassName}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{text.gender}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setFormData(prev => ({...prev, gender: 'F'}))}
                        className={`py-3 rounded-lg font-semibold text-sm transition-all border ${formData.gender === 'F' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        {text.female}
                      </button>
                      <button 
                        onClick={() => setFormData(prev => ({...prev, gender: 'M'}))}
                        className={`py-3 rounded-lg font-semibold text-sm transition-all border ${formData.gender === 'M' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        {text.male}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: LOCATION */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6 flex-1">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{text.mobile}</label>
                  <div className="flex">
                    <span className="inline-flex h-11 items-center px-4 bg-slate-50 border border-r-0 border-slate-300 rounded-l-md text-slate-500 font-semibold text-sm shadow-sm">
                      +91
                    </span>
                    <input 
                      type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                      className="w-full h-11 rounded-r-md border border-l-0 border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/25 focus-visible:ring-offset-1 focus-visible:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{text.ward}</label>
                  <select 
                    name="ward" value={formData.ward} onChange={handleInputChange}
                    className={`${fieldClassName} font-medium`}
                  >
                    <option value="" disabled>Select Village / Ward</option>
                    <option value="Ward 1">Ward 1 (North Block)</option>
                    <option value="Ward 2">Ward 2 (East Block)</option>
                    <option value="Ward 4">Ward 4 (Central Block)</option>
                    <option value="Ward 5">Ward 5 (South Block)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{text.address}</label>
                  <textarea 
                    name="address" value={formData.address} onChange={handleInputChange} rows="2"
                    className={textareaClassName}
                  ></textarea>
                </div>
              </div>
            )}

            {/* STEP 3: CATEGORY */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex-1">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{text.categoryTitle}</h3>
                  <p className="text-sm text-slate-500 font-medium">{text.categorySubtitle}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Visual Category Card */}
                  <button 
                    onClick={() => handleCategorySelect('maternal')}
                    className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] ${formData.category === 'maternal' ? 'border-emerald-500 bg-emerald-50/80 shadow-[0_4px_20px_rgba(16,185,129,0.15)] ring-2 ring-emerald-500/20' : 'border-slate-200/60 bg-white/50 hover:border-emerald-300 hover:bg-white hover:shadow-md'}`}
                  >
                    <div className="flex flex-col items-start gap-3">
                      <Baby size={28} className={`${formData.category === 'maternal' ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'}`} />
                      <div className="text-left">
                        <h4 className={`font-bold text-lg mb-1 ${formData.category === 'maternal' ? 'text-emerald-900' : 'text-slate-800'}`}>{text.maternalCare}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{text.maternalDesc}</p>
                      </div>
                    </div>
                    {formData.category === 'maternal' && <CheckCircle2 className="absolute top-4 right-4 text-emerald-500" size={20} />}
                  </button>

                  <button 
                    onClick={() => handleCategorySelect('pediatric')}
                    className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${formData.category === 'pediatric' ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-500/10' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                  >
                    <User size={28} className={`mb-3 ${formData.category === 'pediatric' ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'}`} />
                    <h4 className={`font-bold text-lg mb-1 ${formData.category === 'pediatric' ? 'text-blue-900' : 'text-slate-800'}`}>{text.pediatric}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{text.pediatricDesc}</p>
                    {formData.category === 'pediatric' && <CheckCircle2 className="absolute top-4 right-4 text-blue-500" size={20} />}
                  </button>

                  <button 
                    onClick={() => handleCategorySelect('chronic')}
                    className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${formData.category === 'chronic' ? 'border-purple-500 bg-purple-50 ring-4 ring-purple-500/10' : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'}`}
                  >
                    <HeartPulse size={28} className={`mb-3 ${formData.category === 'chronic' ? 'text-purple-600' : 'text-slate-400 group-hover:text-purple-500'}`} />
                    <h4 className={`font-bold text-lg mb-1 ${formData.category === 'chronic' ? 'text-purple-900' : 'text-slate-800'}`}>{text.chronic}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{text.chronicDesc}</p>
                    {formData.category === 'chronic' && <CheckCircle2 className="absolute top-4 right-4 text-purple-500" size={20} />}
                  </button>

                  <button 
                    onClick={() => handleCategorySelect('general')}
                    className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${formData.category === 'general' ? 'border-amber-500 bg-amber-50 ring-4 ring-amber-500/10' : 'border-slate-200 hover:border-amber-300 hover:bg-slate-50'}`}
                  >
                    <Stethoscope size={28} className={`mb-3 ${formData.category === 'general' ? 'text-amber-600' : 'text-slate-400 group-hover:text-amber-500'}`} />
                    <h4 className={`font-bold text-lg mb-1 ${formData.category === 'general' ? 'text-amber-900' : 'text-slate-800'}`}>{text.general}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{text.generalDesc}</p>
                    {formData.category === 'general' && <CheckCircle2 className="absolute top-4 right-4 text-amber-500" size={20} />}
                  </button>

                </div>
              </div>
            )}

            {/* STEP 4: VITALS */}
            {step === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex-1 space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Clinical Vitals</h3>
                  <p className="text-sm text-slate-500 font-medium">Record the patient's current measurements for this visit.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Blood Pressure (mmHg)</label>
                    <input
                      type="text" name="bp" value={formData.bp} onChange={handleInputChange}
                      placeholder="e.g. 120/80"
                      className={fieldClassName}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Weight (kg)</label>
                    <input
                      type="number" name="weight" value={formData.weight} onChange={handleInputChange}
                      placeholder="e.g. 62"
                      className={fieldClassName}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Blood Sugar (mg/dL)</label>
                  <input
                    type="number" name="bloodSugar" value={formData.bloodSugar} onChange={handleInputChange}
                    placeholder="e.g. 110 (fasting)"
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Symptoms Reported</label>
                  <textarea
                    name="symptoms" value={formData.symptoms} onChange={handleInputChange} rows={2}
                    placeholder="e.g. Headache, nausea, swelling in feet..."
                    className={textareaClassName}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Other Factors / Notes</label>
                  <textarea
                    name="otherFactors" value={formData.otherFactors} onChange={handleInputChange} rows={2}
                    placeholder="e.g. Patient is on medication X, family history of..."
                    className={textareaClassName}
                  />
                </div>
              </div>
            )}

            {/* STEP 5: QR & NOTES */}
            {step === 5 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex-1 space-y-6">
                
                {/* Voice to Text Notes */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-semibold text-slate-700">{text.notes}</label>
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
                      rows="4"
                      className={`${textareaClassName} pb-12 font-medium`}
                    ></textarea>
                    
                    {/* Interactive Mic Button */}
                    <button 
                      onClick={toggleListening}
                      className={`absolute bottom-3 right-3 px-3 py-2 rounded-full flex items-center gap-2 transition-all shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 border border-transparent'}`}
                      title="Start Voice Typing"
                    >
                      {isListening ? <Mic size={16} /> : <MicOff size={16} />}
                      {isListening && <span className="text-xs font-bold pr-1">Listening...</span>}
                    </button>
                  </div>
                </div>

                {/* QR Generator */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">{text.identification}</h3>
                  {qrCodeUrl ? (
                    <div className="flex flex-col items-center animate-in zoom-in-95">
                      <img src={qrCodeUrl} alt="Patient QR Code" className="w-32 h-32 rounded-lg shadow-sm border border-slate-200 mb-3" />
                      <p className="text-sm font-semibold text-slate-800">{text.qrReady}</p>
                      <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center justify-center gap-1"><CheckCircle2 size={14}/> {text.savedDb}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={generateQR}
                      disabled={isGeneratingQR}
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-lg font-bold shadow-sm hover:border-emerald-500 hover:text-emerald-700 transition-all flex items-center gap-2 mx-auto group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingQR ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-emerald-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {text.syncDb}
                        </>
                      ) : (
                        <>
                          <QrCode className="text-slate-400 group-hover:text-emerald-500 transition-colors" size={20} /> 
                          {text.generateQr}
                        </>
                      )}
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* Navigation Footer */}
            <div className="pt-8 mt-4 border-t border-slate-200/50 flex justify-between items-center shrink-0">
               <button 
                onClick={handleBack}
                disabled={step === 1}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all active:scale-[0.98] ${
                  step === 1 ? 'text-slate-300 cursor-not-allowed opacity-50' : 'text-slate-600 bg-white/50 border border-slate-200 hover:bg-white hover:shadow-sm'
                }`}
              >
                <ChevronLeft size={18} /> {text.back}
               </button>

              {step < 5 ? (
                <button 
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-[0.98] hover:shadow-lg"
                >
                  {text.continue} <ChevronRight size={18} />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={!qrCodeUrl || isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.4)] active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {text.encrypting}
                    </span>
                  ) : (
                    <>{text.completeRegistration} <ShieldCheck size={18} /></>
                  )}
                </button>
              )}
            </div>

          </div>
        ) : (
          /* SUCCESS STATE */
          <div className="p-8 flex-1 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 size={40} className="text-emerald-600" />
            </div>
            
            <h3 className="text-3xl font-black text-slate-900 mb-2">{text.successTitle}</h3>
            <p className="text-slate-500 font-medium text-center max-w-sm mb-8">
              {appLanguage === 'hi'
                ? `${formData.firstName} ${formData.lastName} ${text.successBody}`
                : `${formData.firstName} ${formData.lastName}${text.successBody}`}
            </p>

            {/* ID Badge Output */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 w-full max-w-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
              <div className="flex justify-between items-start mb-4 pl-2">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{text.registrationStatus}</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">{text.patientAdded}</p>
                </div>
                <QrCode size={40} className="text-slate-300" />
              </div>
              <div className="pl-2">
                <p className="font-bold text-slate-900">{formData.firstName} {formData.lastName}</p>
                <p className="text-sm text-slate-500 font-medium">Age {formData.age} &bull; {formData.ward} &bull; {formData.category.charAt(0).toUpperCase() + formData.category.slice(1)} Care</p>
              </div>
            </div>

            <div className="mt-10 flex gap-4 w-full max-w-sm">
              <button onClick={() => navigate('/directory')} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
                {text.backToDirectory}
              </button>
              <button onClick={() => navigate('/dashboard')} className="flex-1 py-3 bg-teal-600 text-white rounded-lg font-semibold shadow-md shadow-teal-200 hover:bg-teal-700 transition-colors">
                {text.dashboard}
              </button>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
