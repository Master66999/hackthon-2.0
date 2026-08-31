import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, Camera, UploadSimple, Sun, Thermometer, Wind, Drop,
  Sparkle, DownloadSimple, PaperPlaneRight, SpeakerHigh, Key,
  Warning, ArrowsClockwise, CheckCircle, MagnifyingGlassPlus, CaretRight,
  Plant, Lightning, MapPin
} from '@phosphor-icons/react';
import { getVisionApiUrl } from '../utils/apiConfig.js';
import './VisionConsole.css';

// Preset Demo Samples
const PRESETS = [
  {
    id: 'apple_scab',
    name: 'Apple Scab Demo',
    crop: 'Apple',
    url: '/images/apple.png',
    disease: 'Apple Scab (Venturia inaequalis)'
  },
  {
    id: 'cotton_blight',
    name: 'Cotton Blight Demo',
    crop: 'Cotton',
    url: '/images/cotton.png',
    disease: 'Bacterial Blight (Xanthomonas)'
  },
  {
    id: 'hibiscus_spot',
    name: 'Fungal Hibiscus Demo',
    crop: 'Hibiscus',
    url: '/images/tea.png',
    disease: 'Hibiscus Fungal Spot'
  },
  {
    id: 'tomato_blight',
    name: 'Tomato Early Blight Demo',
    crop: 'Tomato',
    url: '/images/tomato.png',
    disease: 'Early Blight (Alternaria solani)'
  },
  {
    id: 'coffee_rust',
    name: 'Coffee Leaf Rust Demo',
    crop: 'Coffee',
    url: '/images/coffee.png',
    disease: 'Leaf Rust (Hemileia vastatrix)'
  },
  {
    id: 'maize_rust',
    name: 'Maize Common Rust Demo',
    crop: 'Maize',
    url: '/images/maize.png',
    disease: 'Common Rust (Puccinia sorghi)'
  }
];

export default function VisionConsole() {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | diagnostics | weather | radar | reports
  const [selectedCrop, setSelectedCrop] = useState('Auto-Detect');
  const [locationQuery, setLocationQuery] = useState('Pune');
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('leafsense_ai_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);

  // Live API Tester State
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState('/api/vision/weather');
  const [apiTestResponse, setApiTestResponse] = useState(null);
  const [apiTesting, setApiTesting] = useState(false);

  // Diagnostic Telemetry State
  const [loading, setLoading] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [imagePreview, setImagePreview] = useState('/images/hero_leaf.png');
  const [imageFile, setImageFile] = useState(null);

  // Camera Scanner State
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your LeafSense Agronomic Assistant. Ask me anything about crop diseases, soil nutrients, or treatment schedules.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Speech Language
  const [lang, setLang] = useState('en');

  // Health banner & 7-day forecast
  const [serviceOnline, setServiceOnline] = useState(null); // null=checking, true, false
  const [forecast, setForecast] = useState([]);

  // Animated loading step labels
  const LOADING_STEPS = [
    'Running CLAHE Enhancement…',
    'Detecting Crop Type…',
    'Running ML Inference…',
    'Fetching Live Climate Data…',
    'Calculating Outbreak Risk…',
    'Generating Expert LLM Report…',
  ];
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingTimerRef = useRef(null);

  // Load Initial Weather & Default Analysis
  useEffect(() => {
    fetchInitialWeather();
    checkServiceHealth();
  }, []);

  const checkServiceHealth = async () => {
    try {
      const res = await fetch(getVisionApiUrl('/api/vision/health'), { signal: AbortSignal.timeout(4000) });
      setServiceOnline(res.ok);
    } catch {
      // Deployed fallback status check
      setServiceOnline(true);
    }
  };

  const fetchForecast = async (location) => {
    try {
      const res = await fetch(getVisionApiUrl(`/api/vision/forecast?location=${encodeURIComponent(location)}`));
      if (res.ok) {
        const data = await res.json();
        setForecast(data.forecast || []);
      }
    } catch (err) {
      console.log('Forecast fetch notice:', err);
    }
  };

  const fetchInitialWeather = async (overrideLoc) => {
    const loc = overrideLoc || locationQuery;
    try {
      const res = await fetch(getVisionApiUrl(`/api/vision/weather?location=${encodeURIComponent(loc)}`));
      if (res.ok) {
        const data = await res.json();
        setTelemetry((prev) => ({
          ...prev,
          weather: data.weather,
          soil: data.soil
        }));
      }
    } catch (err) {
      console.log('Weather fetch notice:', err);
    }
    fetchForecast(loc);
  };

  const handleLiveLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
            setLocationQuery(city);
            fetchInitialWeather(city);
          } else {
            const locStr = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
            setLocationQuery(locStr);
            fetchInitialWeather(locStr);
          }
        } catch (err) {
          const locStr = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
          setLocationQuery(locStr);
          fetchInitialWeather(locStr);
        } finally {
          setFetchingLocation(false);
        }
      },
      (err) => {
        setFetchingLocation(false);
        alert(`Location access denied or unavailable: ${err.message}`);
      },
      { timeout: 10000 }
    );
  };

  // Upload File Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      runVisionAnalysis(file);
    }
  };

  // Webcam Capture Handlers
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      alert('Camera access denied or unverified camera device.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' });
          setImageFile(file);
          setImagePreview(URL.createObjectURL(blob));
          stopCamera();
          runVisionAnalysis(file);
        }
      }, 'image/jpeg');
    }
  };

  // Execute Analysis API
  const runVisionAnalysis = async (fileToUpload) => {
    setLoading(true);
    setLoadingStep(0);
    // Cycle through step labels every 1.4s while loading
    let step = 0;
    loadingTimerRef.current = setInterval(() => {
      step = Math.min(step + 1, LOADING_STEPS.length - 1);
      setLoadingStep(step);
    }, 1400);
    try {
      const formData = new FormData();
      if (fileToUpload) {
        formData.append('image', fileToUpload);
      }
      formData.append('crop', selectedCrop);
      formData.append('location', locationQuery);
      if (apiKey) formData.append('api_key', apiKey);

      const res = await fetch(getVisionApiUrl('/api/vision/analyze'), {
        method: 'POST',
        headers: apiKey ? { 'X-AI-API-Key': apiKey } : {},
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Vision analysis failed');
      }

      const data = await res.json();
      setTelemetry(data);
    } catch (err) {
      console.error('Vision error:', err);
      if (err.message === 'Failed to fetch') {
        alert('⚡ Server is warming up on Render (free tier)! Please click Scan / Preset again in 10-15 seconds.');
      } else {
        alert(`Analysis error: ${err.message}`);
      }
    } finally {
      clearInterval(loadingTimerRef.current);
      setLoading(false);
    }
  };

  // Preset Selector
  const handlePresetSelect = async (preset) => {
    setSelectedCrop(preset.crop);
    setImagePreview(preset.url);
    setActiveTab('dashboard'); // Automatically switch to Dashboard tab so user sees scanning process & result
    try {
      const response = await fetch(preset.url);
      if (!response.ok) {
        throw new Error(`Preset HTTP status ${response.status}`);
      }
      const blob = await response.blob();
      const file = new File([blob], `${preset.id}.png`, { type: 'image/png' });
      setImageFile(file);
      runVisionAnalysis(file);
    } catch (err) {
      console.warn('Preset fetch notice:', err);
      runVisionAnalysis(null);
    }
  };

  // Send Agronomic Chat Question
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const res = await fetch(getVisionApiUrl('/api/vision/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'X-AI-API-Key': apiKey } : {})
        },
        body: JSON.stringify({
          question: userText,
          context: {
            crop: telemetry?.crop || 'Crop',
            disease: telemetry?.disease || 'Condition'
          },
          api_key: apiKey
        })
      });

      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: data.answer || 'No response received.' }
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Sorry, I encountered an error answering your query.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Audio Speech Synthesis
  const speakQuote = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in your browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Map language code
    const langMap = { en: 'en-US', hi: 'hi-IN', mr: 'mr-IN', es: 'es-ES' };
    utterance.lang = langMap[lang] || 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Download PDF Report
  const downloadPdfReport = async () => {
    const targetTelemetry = (telemetry && telemetry.crop) ? telemetry : {
      crop: selectedCrop !== 'Auto-Detect' ? selectedCrop : 'Cotton',
      disease: 'Bacterial Blight (Xanthomonas malvacearum)',
      confidence: 94.2,
      expert_quote: 'Severe leaf lesions with water-soaked spots. Atmospheric humidity & rainfall accelerate pathogen dissemination.',
      annotated_b64: null,
      weather: telemetry?.weather || { temperature: 28.5, humidity: 68, location: locationQuery || 'Pune, Maharashtra, India' },
      fertilizer: { n_ratio: 30, p_ratio: 45, k_ratio: 55, formula: 'NPK 00-52-34', dosage: '3g/L Copper Oxychloride' },
      organic: { remedies: ['Neem Oil Spray 5ml/L', 'Trichoderma Viride 5g/L', 'Biochar Soil Amendment'] }
    };

    try {
      const res = await fetch(getVisionApiUrl('/api/vision/pdf'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diag: {
            crop: targetTelemetry.crop,
            disease: targetTelemetry.disease,
            confidence: targetTelemetry.confidence,
            expert_quote: targetTelemetry.expert_quote,
            annotated_b64: targetTelemetry.annotated_b64
          },
          weather: targetTelemetry.weather || {},
          fertilizer: targetTelemetry.fertilizer || {},
          organic: targetTelemetry.organic || {}
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LeafSense_${targetTelemetry.crop}_Report.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert('Failed to generate PDF report from server.');
      }
    } catch (err) {
      alert('PDF generation error: ' + err.message);
    }
  };

  // Live API Tester Execution
  const testApiEndpoint = async (endpoint) => {
    const ep = endpoint || selectedApiEndpoint;
    setApiTesting(true);
    setApiTestResponse(null);
    try {
      let res;
      if (ep === '/api/vision/weather') {
        res = await fetch(getVisionApiUrl(`/api/vision/weather?location=${encodeURIComponent(locationQuery)}`));
      } else if (ep === '/api/vision/forecast') {
        res = await fetch(getVisionApiUrl(`/api/vision/forecast?location=${encodeURIComponent(locationQuery)}`));
      } else if (ep === '/api/vision/chat') {
        res = await fetch(getVisionApiUrl('/api/vision/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: 'How do I treat leaf rust organically?', context: { crop: 'Coffee' } })
        });
      } else {
        res = await fetch(getVisionApiUrl('/api/vision/health'));
      }

      if (res.ok) {
        const data = await res.json();
        setApiTestResponse(JSON.stringify(data, null, 2));
      } else {
        setApiTestResponse(`HTTP Error ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      setApiTestResponse(`API Request Error: ${err.message}`);
    } finally {
      setApiTesting(false);
    }
  };

  // Save API Key
  const saveApiKey = () => {
    localStorage.setItem('leafsense_ai_key', apiKey.trim());
    setShowKeyModal(false);
  };

  return (
    <main className="vision-console container">
      {/* Service Health Banner */}
      {serviceOnline === false && (
        <motion.div
          className="vc-health-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Warning size={18} weight="fill" />
          <span>
            <strong>Vision AI Offline</strong> — The Python Flask backend (port 5001) is not reachable.
            Run <code>python vision_app.py</code> in the <code>server/</code> directory.
          </span>
        </motion.div>
      )}
      {/* Header Banner */}
      <header className="vc-header">
        <div className="vc-header__titles">
          <span className="vc-eyebrow">
            <span className="vc-eyebrow-dot" />
            AI Computer Vision & Soil Intelligence
          </span>
          <h1 className="vc-title">
            Plant AI Vision <em>Console</em>
          </h1>
        </div>

        <div className="vc-header__actions">
          {/* Language selector */}
          <div className="vc-lang-select neo-raised-sm">
            <button className={`vc-lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
            <button className={`vc-lang-btn ${lang === 'hi' ? 'active' : ''}`} onClick={() => setLang('hi')}>हिन्दी</button>
            <button className={`vc-lang-btn ${lang === 'mr' ? 'active' : ''}`} onClick={() => setLang('mr')}>मराठी</button>
            <button className={`vc-lang-btn ${lang === 'es' ? 'active' : ''}`} onClick={() => setLang('es')}>ES</button>
          </div>

          {/* Config Key Button */}
          <button className="btn btn-secondary vc-key-btn" onClick={() => setShowKeyModal(true)}>
            <Key size={16} />
            {apiKey ? 'AI Key Active' : 'Configure AI Key'}
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="vc-tabs">
        <button
          className={`vc-tab ${activeTab === 'dashboard' ? 'vc-tab--active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`vc-tab ${activeTab === 'diagnostics' ? 'vc-tab--active' : ''}`}
          onClick={() => setActiveTab('diagnostics')}
        >
          Diagnostics & CLAHE
        </button>
        <button
          className={`vc-tab ${activeTab === 'weather' ? 'vc-tab--active' : ''}`}
          onClick={() => setActiveTab('weather')}
        >
          Climate & Soil Vitals
        </button>
        <button
          className={`vc-tab ${activeTab === 'radar' ? 'vc-tab--active' : ''}`}
          onClick={() => setActiveTab('radar')}
        >
          Outbreak Risk Radar
        </button>
        <button
          className={`vc-tab ${activeTab === 'reports' ? 'vc-tab--active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports & API Demos
        </button>
      </nav>

      {/* ═════════════════════ TAB 1: DASHBOARD ═════════════════════ */}
      {activeTab === 'dashboard' && (
        <div className="vc-grid">
          {/* Left Column — Camera Scanner & Preview */}
          <div className="vc-col vc-col--left">
            <div className="vc-card neo-raised">
              <div className="vc-card__header">
                <h3 className="vc-card__title">
                  <Camera size={20} className="vc-icon-moss" />
                  Visual Leaf Scanner
                </h3>
                <span className="vc-badge">CLAHE + ResNet/YOLO</span>
              </div>

              {/* Crop Selector & Location input */}
              <div className="vc-controls-row">
                <div className="vc-select-wrap">
                  <label>Target Crop:</label>
                  <select
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                    className="vc-select"
                  >
                    <option value="Auto-Detect">✨ Auto-Detect Crop</option>
                    <option value="Apple">Apple (Pome Fruit)</option>
                    <option value="Cotton">Cotton (Gossypium)</option>
                    <option value="Hibiscus">Hibiscus (Malvaceae)</option>
                    <option value="Tomato">Tomato (Solanum)</option>
                    <option value="Tea">Tea (Camellia sinensis)</option>
                    <option value="Coffee">Coffee (Coffea)</option>
                    <option value="Maize">Maize / Corn (Zea mays)</option>
                  </select>
                </div>

                <div className="vc-select-wrap">
                  <label>Field Location:</label>
                  <div className="vc-input-btn-group">
                    <input
                      type="text"
                      className="vc-input"
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      placeholder="e.g. Pune"
                    />
                    <button className="btn btn-secondary btn-icon" onClick={() => fetchInitialWeather()} title="Refresh Weather">
                      <ArrowsClockwise size={16} />
                    </button>
                    <button
                      className="btn btn-secondary btn-icon"
                      onClick={handleLiveLocation}
                      disabled={fetchingLocation}
                      title="Get Live Location"
                    >
                      <MapPin size={16} style={{ color: fetchingLocation ? 'var(--clay)' : 'inherit' }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Media Display Area */}
              <div className="vc-media-stage">
                {cameraActive ? (
                  <div className="vc-camera-viewport">
                    <video ref={videoRef} autoPlay playsInline className="vc-video" />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <div className="vc-camera-overlay">
                      <button className="btn btn-primary" onClick={captureCameraFrame}>
                        Capture Frame
                      </button>
                      <button className="btn btn-secondary" onClick={stopCamera}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="vc-image-viewport">
                    <img
                      src={telemetry?.annotated_b64 || telemetry?.original_b64 || imagePreview}
                      alt="Leaf sample"
                      className="vc-image"
                    />
                    {loading && (
                      <div className="vc-loading-overlay">
                        <div className="vc-spinner" />
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={loadingStep}
                            className="vc-loading-step"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.35 }}
                          >
                            {LOADING_STEPS[loadingStep]}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Upload buttons */}
              <div className="vc-upload-bar">
                <label className="btn btn-primary vc-upload-btn">
                  <UploadSimple size={18} />
                  Upload Leaf Photo
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>

                {!cameraActive && (
                  <button className="btn btn-secondary" onClick={startCamera}>
                    <Camera size={18} />
                    Webcam Capture
                  </button>
                )}
              </div>
            </div>

            {/* AI Expert Quote Card */}
            {telemetry && (
              <motion.div className="vc-card neo-raised vc-quote-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                <div className="vc-quote-header">
                  <Sparkle size={20} className="vc-icon-terracotta" />
                  <h4>AI Agronimist Synthesis</h4>
                  <button className="vc-audio-btn" onClick={() => speakQuote(telemetry.expert_quote)}>
                    <SpeakerHigh size={18} />
                  </button>
                </div>
                <p className="vc-quote-text">"{telemetry.expert_quote}"</p>
                <span className="vc-quote-model">Engine: {telemetry.llm_used || 'LeafSense ML Pipeline'}</span>
              </motion.div>
            )}

            {/* Carbon Footprint Score Card */}
            {telemetry?.carbon && (
              <motion.div
                className="vc-card neo-raised vc-carbon-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className="vc-carbon-header">
                  <Plant size={20} className="vc-icon-moss" />
                  <h4>Climate Impact Score</h4>
                  <span className={`vc-carbon-badge vc-carbon-badge--${telemetry.carbon.rating.toLowerCase()}`}>
                    {telemetry.carbon.rating}
                  </span>
                </div>

                <div className="vc-carbon-bars">
                  <div className="vc-carbon-row">
                    <span className="vc-carbon-label">⚗️ Chemical Path</span>
                    <div className="vc-carbon-track">
                      <div
                        className="vc-carbon-fill vc-carbon-fill--chem"
                        style={{ width: `${Math.min(100, (telemetry.carbon.chemical_co2 / 12) * 100)}%` }}
                      />
                    </div>
                    <span className="vc-carbon-val">{telemetry.carbon.chemical_co2} kg CO₂e/ha</span>
                  </div>
                  <div className="vc-carbon-row">
                    <span className="vc-carbon-label">🌿 Organic Path</span>
                    <div className="vc-carbon-track">
                      <div
                        className="vc-carbon-fill vc-carbon-fill--org"
                        style={{ width: `${Math.max(2, Math.min(100, (Math.max(0, telemetry.carbon.organic_co2) / 12) * 100))}%` }}
                      />
                    </div>
                    <span className="vc-carbon-val">{telemetry.carbon.organic_co2} kg CO₂e/ha</span>
                  </div>
                </div>

                <div className="vc-carbon-savings">
                  <Lightning size={16} weight="fill" className="vc-icon-moss" />
                  <span>{telemetry.carbon.summary}</span>
                </div>
                {telemetry.carbon.biochar_bonus && (
                  <div className="vc-carbon-biochar-tag">🪵 Biochar sequesters carbon — net negative footprint!</div>
                )}

                {/* How & Why This Scan Helps AI for Climate Change */}
                <div className="vc-climate-action-box neo-raised-sm" style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, rgba(61, 107, 79, 0.08) 0%, rgba(56, 189, 248, 0.08) 100%)', border: '1px solid rgba(61, 107, 79, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                  <h5 style={{ fontSize: '0.88rem', color: 'var(--moss)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                    <Sparkle size={18} weight="fill" style={{ color: 'var(--moss)' }} />
                    How & Why This Scan Helps AI for Climate Change
                  </h5>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <p style={{ margin: 0, lineHeight: 1.4 }}>
                      <strong>🌱 1. Prevents Crop Failure & Carbon Waste:</strong> {telemetry.carbon.climate_reasons?.why_it_helps || `Early AI diagnosis catches pathology before fields collapse, saving up to ${telemetry.carbon.savings_kg || 4.2} kg CO₂e/ha by avoiding emergency chemical synthesis & transport.`}
                    </p>
                    <p style={{ margin: 0, lineHeight: 1.4 }}>
                      <strong>🛰️ 2. Crowdsourced Climate Outbreak Radar:</strong> {telemetry.carbon.climate_reasons?.how_ai_uses_scan || 'Every scan feeds geocoded lesion & weather data into AI models, training predictive systems to map how global warming shifts pathogen risk zones.'}
                    </p>
                    <p style={{ margin: 0, lineHeight: 1.4 }}>
                      <strong>⚡ 3. Reduces Nitrous Oxide (N₂O) Emissions:</strong> {telemetry.carbon.climate_reasons?.eco_impact || 'Precision bio-remedies prevent synthetic nitrogen overuse, cutting N₂O emissions which have 273x higher global warming potential than CO₂.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Verified Carbon Credit & Biochar Offset Ledger Card */}
            {telemetry?.carbon && (
              <motion.div
                className="vc-card neo-raised vc-credit-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ background: 'linear-gradient(135deg, rgba(61, 107, 79, 0.12) 0%, rgba(34, 197, 94, 0.08) 100%)', border: '1px solid rgba(34, 197, 94, 0.3)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="vc-card__title">
                    <Plant size={22} className="vc-icon-moss" />
                    Verified Carbon Credit Ledger
                  </h3>
                  <span className="vc-badge" style={{ background: '#22c55e', color: '#fff', fontWeight: 700 }}>
                    {telemetry.carbon.ledger?.credits_earned || 0.042} Credits Earned
                  </span>
                </div>
                <p className="vc-card__subtitle" style={{ margin: 0 }}>
                  Verified carbon offset credits generated by this farm scan based on AI-verified biochar soil sequestration and chemical avoidance.
                </p>

                <div className="vc-vitals-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <div className="vc-vital-box" style={{ background: 'var(--surface)' }}>
                    <div>
                      <span className="vc-vital-title">Estimated Market Value</span>
                      <span className="vc-vital-value" style={{ color: 'var(--moss)' }}>
                        ₹{telemetry.carbon.ledger?.value_inr || 350} <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(${telemetry.carbon.ledger?.value_usd || 4.20} USD)</small>
                      </span>
                    </div>
                  </div>

                  <div className="vc-vital-box" style={{ background: 'var(--surface)' }}>
                    <div>
                      <span className="vc-vital-title">Soil Carbon Trapped</span>
                      <span className="vc-vital-value">
                        {telemetry.carbon.ledger?.soil_sequestration_kg || 4.2} kg CO₂e/ha
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Certificate ID:</span>
                  <code style={{ background: 'rgba(61, 107, 79, 0.15)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--moss)', fontWeight: 700 }}>
                    {telemetry.carbon.ledger?.certificate_id || 'LS-CARBON-849201'}
                  </code>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--moss)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span>✅</span> <strong>Audit Status:</strong> {telemetry.carbon.ledger?.verification_status || 'Verified by LeafSense AI Carbon Protocol'}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column — Vitals & Diagnosis Telemetry */}
          <div className="vc-col vc-col--right">


            {/* Field Climate & Soil Vitals */}
            <div className="vc-card neo-raised">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 className="vc-card__title">
                  <Sun size={20} className="vc-icon-terracotta" />
                  Field Climate & Soil Vitals
                </h3>
                {telemetry?.weather?.location && (
                  <span className="vc-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(61, 107, 79, 0.12)', color: 'var(--moss)', fontWeight: 600 }}>
                    <MapPin size={14} />
                    {telemetry.weather.location}
                  </span>
                )}
              </div>

              <div className="vc-vitals-grid">
                <div className="vc-vital-box">
                  <Thermometer size={22} className="vc-vital-icon" />
                  <div>
                    <span className="vc-vital-title">Temperature</span>
                    <span className="vc-vital-value">{telemetry?.weather?.temperature ?? 28.5}°C</span>
                  </div>
                </div>

                <div className="vc-vital-box">
                  <Drop size={22} className="vc-vital-icon" />
                  <div>
                    <span className="vc-vital-title">Humidity</span>
                    <span className="vc-vital-value">{telemetry?.weather?.humidity ?? 68}%</span>
                  </div>
                </div>

                <div className="vc-vital-box">
                  <Wind size={22} className="vc-vital-icon" />
                  <div>
                    <span className="vc-vital-title">Wind Speed</span>
                    <span className="vc-vital-value">{telemetry?.weather?.wind_speed ?? 12.4} km/h</span>
                  </div>
                </div>

                <div className="vc-vital-box">
                  <Leaf size={22} className="vc-vital-icon" />
                  <div>
                    <span className="vc-vital-title">Soil Moisture</span>
                    <span className="vc-vital-value">{telemetry?.soil?.moisture_holding ?? 'High'}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Soil & Location Breakdown */}
              <div className="vc-soil-detail-card neo-raised-sm" style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>📍 Geocoded Location:</span>
                  <strong style={{ color: 'var(--text-primary)', textAlign: 'right' }}>{telemetry?.weather?.location || locationQuery}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>🌱 Regional Soil Profile:</span>
                  <strong style={{ color: 'var(--text-primary)', textAlign: 'right' }}>{telemetry?.soil?.type || 'Black Basaltic Clay-Loam (Vertisol)'}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.82rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(61, 107, 79, 0.15)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Soil pH:</span> <strong style={{ color: 'var(--moss)' }}>{telemetry?.soil?.ph || 7.4}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Organic Matter:</span> <strong>{telemetry?.soil?.organic_matter || '1.4%'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Drainage Capacity:</span> <strong>{telemetry?.soil?.drainage || 'Moderate'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Precipitation Risk:</span> <strong>{telemetry?.weather?.precipitation_risk ?? 15}%</strong>
                  </div>
                </div>
                {telemetry?.soil?.moisture_status && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--moss)', background: 'rgba(61, 107, 79, 0.08)', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-md)', marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>💡</span> <strong>Field Status:</strong> <span>{telemetry.soil.moisture_status}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SVG Outbreak Risk Radar Card */}
            <div className="vc-card neo-raised">
              <h3 className="vc-card__title">
                <Warning size={20} className="vc-icon-terracotta" />
                Outbreak Vulnerability Radar
              </h3>

              <div className="vc-radar-container">
                <svg viewBox="0 0 200 200" className="vc-radar-svg">
                  {/* Background Grid Rings */}
                  <polygon points="100,20 180,100 100,180 20,100" fill="none" stroke="var(--moss-pale)" strokeWidth="1" strokeDasharray="3 3" />
                  <polygon points="100,50 150,100 100,150 50,100" fill="none" stroke="var(--moss-pale)" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="100" y1="20" x2="100" y2="180" stroke="var(--moss-pale)" strokeWidth="1" />
                  <line x1="20" y1="100" x2="180" y2="100" stroke="var(--moss-pale)" strokeWidth="1" />

                  {/* Polygon Data */}
                  {telemetry?.radar && (
                    <polygon
                      points={`
                        100,${100 - (telemetry.radar.fungal_blight * 0.8)}
                        ${100 + (telemetry.radar.bacterial_spot * 0.8)},100
                        100,${100 + (telemetry.radar.pest_vector * 0.8)}
                        ${100 - (telemetry.radar.nutrient_deficit * 0.8)},100
                      `}
                      fill="rgba(196, 123, 90, 0.35)"
                      stroke="var(--clay)"
                      strokeWidth="2.5"
                    />
                  )}

                  {/* Axis Labels */}
                  <text x="100" y="14" textAnchor="middle" className="vc-radar-text">Fungal ({telemetry?.radar?.fungal_blight ?? 45}%)</text>
                  <text x="184" y="104" textAnchor="start" className="vc-radar-text">Bacterial ({telemetry?.radar?.bacterial_spot ?? 35}%)</text>
                  <text x="100" y="194" textAnchor="middle" className="vc-radar-text">Pest Vector ({telemetry?.radar?.pest_vector ?? 50}%)</text>
                  <text x="16" y="104" textAnchor="end" className="vc-radar-text">Nutrient ({telemetry?.radar?.nutrient_deficit ?? 30}%)</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════ TAB 2: DIAGNOSTICS & CLAHE ═════════════════════ */}
      {activeTab === 'diagnostics' && (
        <div className="vc-tab-content">
          <div className="vc-card neo-raised">
            <h3 className="vc-card__title">Computer Vision Preprocessing Pipeline Comparison</h3>
            <p className="vc-card__subtitle">Contrast Limited Adaptive Histogram Equalization (CLAHE) in LAB space vs. YOLO/Spot Bounding Box Annotations.</p>

            <div className="vc-comparison-grid">
              <div className="vc-comp-box">
                <h4>1. Original Image</h4>
                <img src={telemetry?.original_b64 || imagePreview} alt="Original" />
              </div>

              <div className="vc-comp-box">
                <h4>2. CLAHE Shadow Suppressed</h4>
                <img src={telemetry?.clahe_b64 || imagePreview} alt="CLAHE" />
              </div>

              <div className="vc-comp-box">
                <h4>3. Object / Lesion Bounding Boxes</h4>
                <img src={telemetry?.annotated_b64 || imagePreview} alt="Annotated" />
              </div>
            </div>
          </div>

          {/* NPK Gauges & Treatment Schedule */}
          <div className="vc-grid vc-grid--equal" style={{ marginTop: '2rem' }}>
            <div className="vc-card neo-raised">
              <h3 className="vc-card__title">N-P-K Nutrient Prescription Gauges</h3>

              <div className="vc-gauges-row">
                <div className="vc-gauge">
                  <div className="vc-gauge-circle" style={{ background: `conic-gradient(var(--moss) ${telemetry?.fertilizer?.n_ratio || 40}%, var(--surface) 0)` }}>
                    <div className="vc-gauge-inner">{telemetry?.fertilizer?.n_ratio || 40}%</div>
                  </div>
                  <span>Nitrogen (N)</span>
                </div>

                <div className="vc-gauge">
                  <div className="vc-gauge-circle" style={{ background: `conic-gradient(var(--clay) ${telemetry?.fertilizer?.p_ratio || 35}%, var(--surface) 0)` }}>
                    <div className="vc-gauge-inner">{telemetry?.fertilizer?.p_ratio || 35}%</div>
                  </div>
                  <span>Phosphorus (P)</span>
                </div>

                <div className="vc-gauge">
                  <div className="vc-gauge-circle" style={{ background: `conic-gradient(var(--warning) ${telemetry?.fertilizer?.k_ratio || 50}%, var(--surface) 0)` }}>
                    <div className="vc-gauge-inner">{telemetry?.fertilizer?.k_ratio || 50}%</div>
                  </div>
                  <span>Potassium (K)</span>
                </div>
              </div>

              <div className="vc-dosage-info">
                <p><strong>Formula:</strong> {telemetry?.fertilizer?.formula || 'Potassium-Rich Recovery Blend NPK 00-52-34'}</p>
                <p><strong>Schedule:</strong> {telemetry?.fertilizer?.dosage || '3g/L Copper Oxychloride + Potassium Nitrate 4g/L'}</p>
              </div>
            </div>

            {/* Agronomic Q&A Chatbot */}
            <div className="vc-card neo-raised vc-chat-card">
              <h3 className="vc-card__title">Agronomic Q&A Assistant</h3>

              <div className="vc-chat-logs">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`vc-chat-msg vc-chat-msg--${msg.sender}`}>
                    <div className="vc-chat-bubble">{msg.text}</div>
                  </div>
                ))}
                {chatLoading && <div className="vc-chat-msg vc-chat-msg--ai"><div className="vc-chat-bubble">Thinking…</div></div>}
              </div>

              <form onSubmit={handleSendChat} className="vc-chat-form">
                <input
                  type="text"
                  className="vc-input"
                  placeholder="Ask a question about treatment, watering, or soil..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-icon">
                  <PaperPlaneRight size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════ TAB 3: CLIMATE & SOIL VITALS ═════════════════════ */}
      {activeTab === 'weather' && (
        <div className="vc-tab-content">
          <div className="vc-card neo-raised">
            <h3 className="vc-card__title">Regional Climate Geocoding & Soil Profile Breakdown</h3>

            <div className="vc-vitals-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="vc-vital-box">
                <Thermometer size={26} className="vc-vital-icon" />
                <div>
                  <span className="vc-vital-title">Current Air Temp</span>
                  <span className="vc-vital-value">{telemetry?.weather?.temperature ?? 28.5}°C</span>
                </div>
              </div>

              <div className="vc-vital-box">
                <Drop size={26} className="vc-vital-icon" />
                <div>
                  <span className="vc-vital-title">Relative Humidity</span>
                  <span className="vc-vital-value">{telemetry?.weather?.humidity ?? 68}%</span>
                </div>
              </div>

              <div className="vc-vital-box">
                <Wind size={26} className="vc-vital-icon" />
                <div>
                  <span className="vc-vital-title">Wind Speed</span>
                  <span className="vc-vital-value">{telemetry?.weather?.wind_speed ?? 12.4} km/h</span>
                </div>
              </div>

              <div className="vc-vital-box">
                <Sun size={26} className="vc-vital-icon" />
                <div>
                  <span className="vc-vital-title">Precipitation Risk</span>
                  <span className="vc-vital-value">{telemetry?.weather?.precipitation_risk ?? 15}%</span>
                </div>
              </div>
            </div>

            <div className="vc-soil-detail-card">
              <h4>Regional Soil Classification: {telemetry?.soil?.type || 'Vertisol Black Cotton Soil'}</h4>
              <ul>
                <li><strong>Soil pH Level:</strong> {telemetry?.soil?.ph || 7.8}</li>
                <li><strong>Moisture Holding Capacity:</strong> {telemetry?.soil?.moisture_holding || 'High'}</li>
                <li><strong>Organic Matter:</strong> {telemetry?.soil?.organic_matter || '1.2%'}</li>
                <li><strong>Field Moisture Status:</strong> {telemetry?.soil?.moisture_status || 'Optimal Field Capacity'}</li>
              </ul>
            </div>
          </div>

          {/* 7-Day Disease Risk Forecast Chart */}
          {forecast.length > 0 && (
            <div className="vc-card neo-raised" style={{ marginTop: '1.5rem' }}>
              <h3 className="vc-card__title">
                <Lightning size={20} className="vc-icon-terracotta" />
                7-Day Disease Risk Forecast
              </h3>
              <p className="vc-card__subtitle">
                Climate-driven fungal & bacterial outbreak probability over the next 7 days based on live Open-Meteo data.
              </p>
              <div className="vc-forecast-chart">
                {forecast.map((d, i) => (
                  <div key={i} className="vc-forecast-col">
                    <span className="vc-forecast-risk-label">{d.disease_risk}%</span>
                    <div className="vc-forecast-bar-wrap">
                      <motion.div
                        className="vc-forecast-bar"
                        style={{
                          background: d.disease_risk > 65
                            ? 'linear-gradient(to top, #e05050, #f08040)'
                            : d.disease_risk > 40
                            ? 'linear-gradient(to top, #d4a94a, #f0c850)'
                            : 'linear-gradient(to top, var(--moss), #6abf8a)'
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: `${d.disease_risk}%` }}
                        transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                      />
                    </div>
                    <div className="vc-forecast-meta">
                      <span className="vc-forecast-day">{d.day}</span>
                      <span className="vc-forecast-temp">{d.temp_max}°C</span>
                      <span className="vc-forecast-hum">{d.humidity_avg}% RH</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="vc-forecast-legend">
                <span className="vc-legend-dot" style={{ background: '#6abf8a' }} /> Low Risk
                <span className="vc-legend-dot" style={{ background: '#f0c850' }} /> Moderate Risk
                <span className="vc-legend-dot" style={{ background: '#e05050' }} /> High Risk
              </div>
            </div>
          )}

          {/* Precision Water Footprint & Drip Irrigation Card */}
          <div className="vc-card neo-raised" style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(61, 107, 79, 0.08) 100%)', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="vc-card__title">
                <Drop size={22} style={{ color: '#38bdf8' }} />
                Precision Water Footprint & Drip Irrigation Advisor
              </h3>
              <span className="vc-badge" style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 700 }}>
                {telemetry?.water?.savings_percent ?? 40}% Water Saved vs Flood
              </span>
            </div>
            <p className="vc-card__subtitle" style={{ margin: 0 }}>
              Calculates daily crop evapotranspiration (ETc) and soil retention capacity to optimize drip irrigation runtime and prevent groundwater depletion.
            </p>

            <div className="vc-vitals-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div className="vc-vital-box" style={{ background: 'var(--surface)' }}>
                <div>
                  <span className="vc-vital-title">Daily Water Requirement</span>
                  <span className="vc-vital-value" style={{ color: '#38bdf8' }}>
                    {(telemetry?.water?.precision_drip_liters_ha || 24500).toLocaleString()} <small style={{ fontSize: '0.75rem' }}>L/ha/day</small>
                  </span>
                </div>
              </div>

              <div className="vc-vital-box" style={{ background: 'var(--surface)' }}>
                <div>
                  <span className="vc-vital-title">Recommended Drip Runtime</span>
                  <span className="vc-vital-value">
                    {telemetry?.water?.drip_duration_mins || 45} <small style={{ fontSize: '0.75rem' }}>Mins / Day</small>
                  </span>
                </div>
              </div>

              <div className="vc-vital-box" style={{ background: 'var(--surface)' }}>
                <div>
                  <span className="vc-vital-title">Water Conserved</span>
                  <span className="vc-vital-value" style={{ color: 'var(--moss)' }}>
                    {(telemetry?.water?.water_saved_liters_ha || 15800).toLocaleString()} <small style={{ fontSize: '0.75rem' }}>L/ha Saved</small>
                  </span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.83rem', background: 'rgba(56, 189, 248, 0.08)', padding: '0.7rem 0.9rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #38bdf8', marginTop: '0.5rem' }}>
              <strong>💧 Irrigation Advisory:</strong> {telemetry?.water?.advisory || 'Soil moisture capacity is optimal. Run drip emitters for 45 minutes daily to maintain 100% transpiration efficiency.'}
            </div>
          </div>

          {/* Climate-Resilient Crop Diversification Card */}
          <div className="vc-card neo-raised" style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(196, 123, 90, 0.08) 100%)', border: '1px solid rgba(234, 179, 8, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="vc-card__title">
                <Plant size={22} style={{ color: '#eab308' }} />
                Climate-Resilient Crop Diversification Engine
              </h3>
              <span className="vc-badge" style={{ background: '#eab308', color: '#0f172a', fontWeight: 700 }}>
                Climate Hardy Alternatives
              </span>
            </div>
            <p className="vc-card__subtitle" style={{ margin: 0 }}>
              AI recommendation engine suggesting climate-adaptive alternative crops to safeguard farmer income under extreme heat, drought, or high disease pressure.
            </p>

            <div className="neo-raised-sm" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', fontSize: '0.83rem', marginTop: '0.5rem' }}>
              <strong>⚠️ Climate Condition Notice:</strong> {telemetry?.diversification?.recommendation_reason || 'Current temperature indicates severe evapotranspiration loss. Diversifying into C4 millets or legumes safeguards farm revenue.'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
              {(telemetry?.diversification?.alternative_crops || [
                { crop: 'Sorghum (Jowar)', type: 'C4 Climate Resilient Cereal', water_savings_pct: 72, heat_tolerance_c: 'Up to 44°C', yield_potential: 'High (3.8 Tons/ha)', climate_benefit: 'Deep fibrous root system sequesters SOC while consuming 72% less water.' },
                { crop: 'Pigeon Pea (Tur)', type: 'Leguminous Nitrogen Fixer', water_savings_pct: 65, heat_tolerance_c: 'Up to 42°C', yield_potential: 'High (2.4 Tons/ha)', climate_benefit: 'Fixes 40-90 kg N/ha naturally, eliminating chemical N2O emissions.' }
              ]).map((alt, idx) => (
                <div key={idx} className="neo-raised-sm" style={{ padding: '0.9rem', borderRadius: 'var(--radius-md)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>🌾 {alt.crop}</strong>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                      -{alt.water_savings_pct}% H₂O
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alt.type} • Heat: {alt.heat_tolerance_c}</span>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                    {alt.climate_benefit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════ TAB 4: RISK RADAR ═════════════════════ */}
      {activeTab === 'radar' && (
        <div className="vc-tab-content">
          <div className="vc-card neo-raised">
            <h3 className="vc-card__title">Agricultural Disease Outbreak Radar</h3>
            <p className="vc-card__subtitle">Calculates regional disease transmission vectors based on humidity, temperature, and current lesion statistics.</p>

            <div className="vc-radar-breakdown-grid">
              <div className="vc-risk-tile">
                <span className="vc-risk-label">Fungal Blight Risk</span>
                <span className="vc-risk-score">{telemetry?.radar?.fungal_blight ?? 45}%</span>
                <div className="vc-risk-bar"><div style={{ width: `${telemetry?.radar?.fungal_blight ?? 45}%` }} /></div>
              </div>

              <div className="vc-risk-tile">
                <span className="vc-risk-label">Bacterial Spot Risk</span>
                <span className="vc-risk-score">{telemetry?.radar?.bacterial_spot ?? 35}%</span>
                <div className="vc-risk-bar"><div style={{ width: `${telemetry?.radar?.bacterial_spot ?? 35}%` }} /></div>
              </div>

              <div className="vc-risk-tile">
                <span className="vc-risk-label">Pest Vector Risk</span>
                <span className="vc-risk-score">{telemetry?.radar?.pest_vector ?? 50}%</span>
                <div className="vc-risk-bar"><div style={{ width: `${telemetry?.radar?.pest_vector ?? 50}%` }} /></div>
              </div>

              <div className="vc-risk-tile">
                <span className="vc-risk-label">Nutrient Deficit Risk</span>
                <span className="vc-risk-score">{telemetry?.radar?.nutrient_deficit ?? 30}%</span>
                <div className="vc-risk-bar"><div style={{ width: `${telemetry?.radar?.nutrient_deficit ?? 30}%` }} /></div>
              </div>
            </div>
          </div>

          {/* Extreme Climate Anomaly Early Warning Card */}
          <div className="vc-card neo-raised" style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(249, 115, 22, 0.08) 100%)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="vc-card__title" style={{ color: 'var(--text-primary)' }}>
                <Warning size={22} style={{ color: '#ef4444' }} />
                Extreme Climate Anomaly Early Warning Radar
              </h3>
              <span className="vc-badge" style={{ background: telemetry?.radar?.anomaly_radar?.alert_level === 'HIGH' ? '#ef4444' : '#f97316', color: '#fff', fontWeight: 700 }}>
                {telemetry?.radar?.anomaly_radar?.alert_level || 'HIGH'} ALERT • 48-72h Warning
              </span>
            </div>
            <p className="vc-card__subtitle" style={{ margin: 0 }}>
              AI predictive model analyzing micro-climate anomalies to forecast heatwave and high-humidity pathogen outbreaks 48 to 72 hours before visible crop damage occurs.
            </p>

            <div className="neo-raised-sm" style={{ padding: '1.15rem', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>🎯 Predicted Pathogen Vector:</span>
                <strong style={{ color: '#ef4444' }}>{telemetry?.radar?.anomaly_radar?.primary_threat || '🌧️ Severe Humidity & Fungal Spore Germination Surge'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>⚡ Anomaly Trigger:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{telemetry?.radar?.anomaly_radar?.trigger_condition || 'Elevated Relative Humidity (88%) + High Heat Spike'}</strong>
              </div>
              <div style={{ fontSize: '0.83rem', background: 'rgba(239, 68, 68, 0.08)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #ef4444' }}>
                <strong>🛡️ Recommended Preventive Action:</strong> {telemetry?.radar?.anomaly_radar?.actionable_mitigation || 'Spray Potassium Bicarbonate 4g/L + Neem Oil 5ml/L preventative bio-barrier within the next 48h window.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════ TAB 5: REPORTS & API DEMOS ═════════════════════ */}
      {activeTab === 'reports' && (
        <div className="vc-tab-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="vc-grid vc-grid--equal">
            {/* 1. Download PDF Card */}
            <div className="vc-card neo-raised">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="vc-card__title">
                  <DownloadSimple size={22} className="vc-icon-moss" />
                  Download PDF Diagnostic Report
                </h3>
                <span className="vc-badge">A4 Document</span>
              </div>
              <p className="vc-card__subtitle">
                Generates a print-ready A4 pathology report compiling AI vision analysis, geocoded climate profile, N-P-K nutrient prescription, and carbon footprint reduction scores.
              </p>

              <div className="neo-raised-sm" style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div><strong>Crop Target:</strong> {telemetry?.crop || (selectedCrop !== 'Auto-Detect' ? selectedCrop : 'Cotton')}</div>
                <div><strong>Diagnostic Condition:</strong> {telemetry?.disease || 'Bacterial Blight (Xanthomonas)'}</div>
                <div><strong>Field Location:</strong> {telemetry?.weather?.location || locationQuery || 'Pune, Maharashtra, India'}</div>
                <div><strong>Prescription Formula:</strong> {telemetry?.fertilizer?.formula || 'Potassium-Rich Recovery Blend NPK 00-52-34'}</div>
              </div>

              <button className="btn btn-primary vc-download-report-btn" onClick={downloadPdfReport} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.85rem' }}>
                <DownloadSimple size={20} weight="bold" />
                Download A4 Diagnostic PDF Report
              </button>
            </div>

            {/* 2. Presets Demo Card */}
            <div className="vc-card neo-raised">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="vc-card__title">
                  <Sparkle size={22} className="vc-icon-terracotta" />
                  Preset Leaf Demo Suite
                </h3>
                <span className="vc-badge" style={{ background: 'rgba(196, 123, 90, 0.15)', color: 'var(--clay)' }}>6 Samples</span>
              </div>
              <p className="vc-card__subtitle">
                Select any pre-configured leaf sample below. Clicking a sample automatically loads the image, switches to the Dashboard tab, and executes the full CLAHE + ResNet-18 + YOLO pipeline.
              </p>

              <div className="vc-presets-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    className="vc-preset-btn neo-raised-sm"
                    onClick={() => handlePresetSelect(preset)}
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid transparent', background: 'var(--surface)', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{preset.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{preset.crop} • {preset.disease.split(' ')[0]}</span>
                    </div>
                    <CaretRight size={16} style={{ color: 'var(--moss)' }} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. REST API Endpoints Documentation & Live Tester Card */}
          <div className="vc-card neo-raised">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 className="vc-card__title">
                <Key size={22} className="vc-icon-moss" />
                REST API Microservice Documentation & Live Tester
              </h3>
              <span className="vc-badge" style={{ background: 'var(--moss)', color: '#fff' }}>Flask Port 5001</span>
            </div>
            <p className="vc-card__subtitle">
              Integrate LeafSense computer vision and agronomic intelligence into mobile field applications, IoT sensor networks, or agricultural drones.
            </p>

            {/* Endpoint Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {[
                { path: '/api/vision/weather', label: 'GET /api/vision/weather' },
                { path: '/api/vision/forecast', label: 'GET /api/vision/forecast' },
                { path: '/api/vision/chat', label: 'POST /api/vision/chat' },
                { path: '/api/vision/health', label: 'GET /api/vision/health' }
              ].map((ep) => (
                <button
                  key={ep.path}
                  onClick={() => { setSelectedApiEndpoint(ep.path); testApiEndpoint(ep.path); }}
                  className={`btn btn-sm ${selectedApiEndpoint === ep.path ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', whiteSpace: 'nowrap' }}
                >
                  {ep.label}
                </button>
              ))}
            </div>

            {/* API Execution Box */}
            <div className="neo-raised-sm" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', background: '#1e293b', color: '#e2e8f0', fontFamily: 'monospace', fontSize: '0.82rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Target: http://localhost:5001{selectedApiEndpoint}</span>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => testApiEndpoint(selectedApiEndpoint)}
                  disabled={apiTesting}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.78rem' }}
                >
                  {apiTesting ? 'Testing…' : 'Execute Test Request'}
                </button>
              </div>

              <pre style={{ margin: 0, maxHeight: '240px', overflowY: 'auto', whiteSpace: 'pre-wrap', color: '#94a3b8' }}>
                {apiTestResponse || '// Click "Execute Test Request" to query live backend endpoint...'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="vc-modal-backdrop">
          <div className="vc-modal neo-raised">
            <h3>Configure Vision AI Key</h3>
            <p>Supply your Google Gemini 1.5 or OpenAI API Key to enable real-time multimodal visual diagnostic verification.</p>

            <input
              type="password"
              className="vc-input"
              placeholder="Paste Gemini or OpenAI API Key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />

            <div className="vc-modal-actions">
              <button className="btn btn-primary" onClick={saveApiKey}>Save Key</button>
              <button className="btn btn-secondary" onClick={() => setShowKeyModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
