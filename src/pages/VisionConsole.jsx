import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, Camera, UploadSimple, Sun, Thermometer, Wind, Drop,
  Sparkle, DownloadSimple, PaperPlaneRight, SpeakerHigh, Key,
  Warning, ArrowsClockwise, CheckCircle, MagnifyingGlassPlus, CaretRight
} from '@phosphor-icons/react';
import './VisionConsole.css';

// Preset Demo Samples
const PRESETS = [
  {
    id: 'apple_scab',
    name: 'Apple Scab Demo',
    crop: 'Apple',
    url: '/images/apple_crop.png',
    disease: 'Apple Scab (Venturia inaequalis)'
  },
  {
    id: 'cotton_blight',
    name: 'Cotton Blight Demo',
    crop: 'Cotton',
    url: '/images/cotton_crop.png',
    disease: 'Bacterial Blight (Xanthomonas)'
  },
  {
    id: 'hibiscus_spot',
    name: 'Fungal Hibiscus Demo',
    crop: 'Hibiscus',
    url: '/images/tea_crop.png',
    disease: 'Hibiscus Fungal Spot'
  }
];

export default function VisionConsole() {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | diagnostics | weather | radar | reports
  const [selectedCrop, setSelectedCrop] = useState('Auto-Detect');
  const [locationQuery, setLocationQuery] = useState('Nagpur');
  const [apiKey, setApiKey] = useState(localStorage.getItem('leafsense_ai_key') || '');
  const [showKeyModal, setShowKeyModal] = useState(false);

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

  // Load Initial Weather & Default Analysis
  useEffect(() => {
    fetchInitialWeather();
  }, []);

  const fetchInitialWeather = async () => {
    try {
      const res = await fetch(`/api/vision/weather?location=${encodeURIComponent(locationQuery)}`);
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
    try {
      const formData = new FormData();
      if (fileToUpload) {
        formData.append('image', fileToUpload);
      }
      formData.append('crop', selectedCrop);
      formData.append('location', locationQuery);
      if (apiKey) formData.append('api_key', apiKey);

      const res = await fetch('/api/vision/analyze', {
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
      alert(`Analysis error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Preset Selector
  const handlePresetSelect = async (preset) => {
    setSelectedCrop(preset.crop);
    setImagePreview(preset.url);
    try {
      const response = await fetch(preset.url);
      const blob = await response.blob();
      const file = new File([blob], `${preset.id}.png`, { type: 'image/png' });
      setImageFile(file);
      runVisionAnalysis(file);
    } catch (err) {
      console.error('Preset select error:', err);
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
      const res = await fetch('/api/vision/chat', {
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
    if (!telemetry) return;
    try {
      const res = await fetch('/api/vision/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diag: {
            crop: telemetry.crop,
            disease: telemetry.disease,
            confidence: telemetry.confidence,
            expert_quote: telemetry.expert_quote,
            annotated_b64: telemetry.annotated_b64
          },
          weather: telemetry.weather || {},
          fertilizer: telemetry.fertilizer || {},
          organic: telemetry.organic || {}
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LeafSense_${telemetry.crop}_Report.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert('Failed to generate PDF report.');
      }
    } catch (err) {
      alert('PDF generation error: ' + err.message);
    }
  };

  // Save API Key
  const saveApiKey = () => {
    localStorage.setItem('leafsense_ai_key', apiKey.trim());
    setShowKeyModal(false);
  };

  return (
    <main className="vision-console container">
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
                      placeholder="e.g. Nagpur"
                    />
                    <button className="btn btn-secondary btn-icon" onClick={fetchInitialWeather}>
                      <ArrowsClockwise size={16} />
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
                        <p>Processing CLAHE & ML Models…</p>
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
          </div>

          {/* Right Column — Vitals & Diagnosis Telemetry */}
          <div className="vc-col vc-col--right">
            {/* Primary Diagnosis Header */}
            <div className="vc-card neo-raised vc-diag-header-card">
              <span className="vc-diag-eyebrow">DIAGNOSTIC STATUS</span>
              <h2 className="vc-diag-title">
                {telemetry?.disease || 'Ready for Scanning'}
              </h2>

              <div className="vc-diag-metrics">
                <div className="vc-metric-pill">
                  <span className="vc-metric-label">Detected Crop</span>
                  <span className="vc-metric-val">{telemetry?.crop || selectedCrop}</span>
                </div>
                <div className="vc-metric-pill">
                  <span className="vc-metric-label">Confidence</span>
                  <span className="vc-metric-val vc-metric-val--green">{telemetry?.confidence ? `${telemetry.confidence}%` : '--'}</span>
                </div>
                <div className="vc-metric-pill">
                  <span className="vc-metric-label">Lesion Count</span>
                  <span className="vc-metric-val">{telemetry?.spot_count ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Field Climate Vitals */}
            <div className="vc-card neo-raised">
              <h3 className="vc-card__title">
                <Sun size={20} className="vc-icon-terracotta" />
                Field Climate & Soil Vitals
              </h3>

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

              <div className="vc-soil-summary">
                <strong>Soil Type:</strong> {telemetry?.soil?.type || 'Vertisol Black Cotton Soil'} (pH {telemetry?.soil?.ph || 7.8})
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
        </div>
      )}

      {/* ═════════════════════ TAB 5: REPORTS & API DEMOS ═════════════════════ */}
      {activeTab === 'reports' && (
        <div className="vc-tab-content">
          <div className="vc-grid vc-grid--equal">
            {/* Download PDF Card */}
            <div className="vc-card neo-raised">
              <h3 className="vc-card__title">Download PDF Diagnostic Report</h3>
              <p className="vc-card__subtitle">Compiles analysis results, weather conditions, N-P-K ratios, and leaf photographs into an A4 print-ready PDF document.</p>

              <button className="btn btn-primary vc-download-report-btn" onClick={downloadPdfReport}>
                <DownloadSimple size={20} />
                Download Diagnostic PDF Report
              </button>
            </div>

            {/* Presets Demo Card */}
            <div className="vc-card neo-raised">
              <h3 className="vc-card__title">Preset Leaf Demo Samples</h3>
              <p className="vc-card__subtitle">Select a pre-configured leaf sample for instant testing of CLAHE, ResNet-18, and YOLO models.</p>

              <div className="vc-presets-list">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    className="vc-preset-btn neo-raised-sm"
                    onClick={() => handlePresetSelect(preset)}
                  >
                    <div>
                      <strong>{preset.name}</strong>
                      <span>{preset.disease}</span>
                    </div>
                    <CaretRight size={16} />
                  </button>
                ))}
              </div>
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
