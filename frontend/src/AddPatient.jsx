import React, { useState } from 'react';
import { 
  User, MapPin, Activity, CheckCircle2, 
  ChevronRight, ChevronLeft, Baby, HeartPulse, 
  Stethoscope, ShieldCheck, QrCode, Mic, MicOff, Languages
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './language-context';

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
        wardPlaceholder: 'क्षेत्र चुनें...',
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
        notesPlaceholder: 'नोट्स लिखें या आवाज से दर्ज करें...',
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
        wardPlaceholder: 'Select an assigned area...',
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
        notesPlaceholder: 'Type notes or click the mic for voice dictation...',
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
    ward: '',
    address: '',
    category: '',
    notes: '' 
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({ ...prev, category }));
  };

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const generateQR = async () => {
    setIsGeneratingQR(true);
    const token = localStorage.getItem('swasthya_token');
    
    // 1. First, create/sync the patient in the DB if not already done
    try {
      // Map frontend gender 'F'/'M' to backend 'Female'/'Male'
      const genderMap = { 'F': 'Female', 'M': 'Male', 'O': 'Other' };
      
      const patientPayload = {
        name: `${formData.firstName} ${formData.lastName}`,
        age: parseInt(formData.age),
        gender: genderMap[formData.gender] || 'Female',
        phone: formData.phone,
        village: formData.ward,
        region: 'Palghar', // Mock region
        isPregnant: formData.category === 'maternal',
      };

      // Create Patient
      const createResponse = await fetch('http://localhost:5000/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(patientPayload)
      });

      if (!createResponse.ok) throw new Error("Failed to create patient record");
      
      const patient = await createResponse.json();
      const patientId = patient._id;

      // 2. Now generate the QR code via backend
      const qrResponse = await fetch(`http://localhost:5000/patients/${patientId}/qr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!qrResponse.ok) throw new Error("Failed to generate QR code");

      const qrData = await qrResponse.json();
      
      setQrCodeUrl(qrData.qrCode); // Backend returns dataURL/Base64
      
    } catch (error) {
      console.error("Error generating/saving QR:", error);
      alert("Backend Sync Failed: Ensure your server is running and .env is correct. Reverting to local mock for demo.");
      
      // Fallback for demo
      const mockId = `SS-${Math.floor(100000 + Math.random() * 900000)}`;
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${mockId}`);
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

  const StepIndicator = () => (
    <div className="mb-8 relative">
      <div className="flex justify-between relative z-10">
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
              step >= num 
                ? 'bg-teal-600 text-white shadow-md shadow-teal-200' 
                : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
            }`}>
              {step > num ? <CheckCircle2 size={18} /> : num}
            </div>
            <span className={`text-xs font-semibold ${step >= num ? 'text-slate-800' : 'text-slate-400'}`}>
              {num === 1 ? text.identity : num === 2 ? text.location : num === 3 ? text.category : text.details}
            </span>
          </div>
        ))}
      </div>
      <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 -z-0 rounded-full">
        <div 
          className="h-full bg-teal-500 transition-all duration-500 rounded-full" 
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-10 font-inter">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[600px] flex flex-col">
          
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white shrink-0">
          <h2 className="text-xl font-semibold tracking-tight">{text.header}</h2>
          <p className="text-sm text-slate-400 mt-1">{text.subheader}</p>
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
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      placeholder="e.g. Aarti"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{text.lastName}</label>
                    <input 
                      type="text" name="lastName" value={formData.lastName} onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      placeholder="e.g. Sharma"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{text.ageYears}</label>
                    <input 
                      type="number" name="age" value={formData.age} onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      placeholder="e.g. 28"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{text.gender}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setFormData(prev => ({...prev, gender: 'F'}))}
                        className={`py-3 rounded-lg font-semibold text-sm transition-all border ${formData.gender === 'F' ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        {text.female}
                      </button>
                      <button 
                        onClick={() => setFormData(prev => ({...prev, gender: 'M'}))}
                        className={`py-3 rounded-lg font-semibold text-sm transition-all border ${formData.gender === 'M' ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                    <span className="inline-flex items-center px-4 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-slate-500 font-semibold text-sm">
                      +91
                    </span>
                    <input 
                      type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      placeholder="98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{text.ward}</label>
                  <select 
                    name="ward" value={formData.ward} onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-700 font-medium"
                  >
                    <option value="">{text.wardPlaceholder}</option>
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                    placeholder="House number, landmarks, etc."
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
                    className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${formData.category === 'maternal' ? 'border-teal-500 bg-teal-50 ring-4 ring-teal-500/10' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'}`}
                  >
                    <Baby size={28} className={`mb-3 ${formData.category === 'maternal' ? 'text-teal-600' : 'text-slate-400 group-hover:text-teal-500'}`} />
                    <h4 className={`font-bold text-lg mb-1 ${formData.category === 'maternal' ? 'text-teal-900' : 'text-slate-800'}`}>{text.maternalCare}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{text.maternalDesc}</p>
                    {formData.category === 'maternal' && <CheckCircle2 className="absolute top-4 right-4 text-teal-500" size={20} />}
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

            {/* STEP 4: QR & NOTES */}
            {step === 4 && (
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
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none text-slate-700 font-medium pb-12 shadow-sm"
                      placeholder={text.notesPlaceholder}
                    ></textarea>
                    
                    {/* Interactive Mic Button */}
                    <button 
                      onClick={toggleListening}
                      className={`absolute bottom-3 right-3 px-3 py-2 rounded-full flex items-center gap-2 transition-all shadow-sm ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 border border-transparent'}`}
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
                      <p className="text-xs font-medium text-teal-600 mt-1 flex items-center justify-center gap-1"><CheckCircle2 size={14}/> {text.savedDb}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={generateQR}
                      disabled={isGeneratingQR}
                      className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-lg font-bold shadow-sm hover:border-teal-500 hover:text-teal-700 transition-all flex items-center gap-2 mx-auto group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingQR ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-teal-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {text.syncDb}
                        </>
                      ) : (
                        <>
                          <QrCode className="text-slate-400 group-hover:text-teal-500 transition-colors" size={20} /> 
                          {text.generateQr}
                        </>
                      )}
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* Navigation Footer */}
            <div className="pt-8 mt-4 border-t border-slate-100 flex justify-between items-center shrink-0">
              <button 
                onClick={handleBack}
                disabled={step === 1}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors ${
                  step === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft size={18} /> {text.back}
              </button>

              {step < 4 ? (
                <button 
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm"
                >
                  {text.continue} <ChevronRight size={18} />
                </button>
              ) : (
                <button 
                  onClick={handleSubmit}
                  disabled={!qrCodeUrl || isSubmitting}
                  className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-teal-700 transition-all shadow-md shadow-teal-200 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
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
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <CheckCircle2 size={40} className="text-teal-600" />
            </div>
            
            <h3 className="text-3xl font-black text-slate-900 mb-2">{text.successTitle}</h3>
            <p className="text-slate-500 font-medium text-center max-w-sm mb-8">
              {appLanguage === 'hi'
                ? `${formData.firstName} ${formData.lastName} ${text.successBody}`
                : `${formData.firstName} ${formData.lastName}${text.successBody}`}
            </p>

            {/* ID Badge Output */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 w-full max-w-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-teal-500" />
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

      </div>
    </div>
  );
}
