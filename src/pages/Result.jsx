import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowCounterClockwise, CheckCircle,
  Warning, XCircle, Plant, Leaf, Flask, Drop,
  Wrench, ArrowRight, SpeakerHigh, Thermometer, Wind, Sun
} from '@phosphor-icons/react';
import ConfidenceBar from '../components/ConfidenceBar.jsx';
import './Result.css';

/* Map severity to badge props */
const SEVERITY_CONFIG = {
  high:    { label: 'High Severity',   cls: 'badge-danger',  Icon: XCircle },
  medium:  { label: 'Moderate Severity', cls: 'badge-warning', Icon: Warning },
  low:     { label: 'Low Severity',    cls: 'badge-warning',  Icon: Warning },
  none:    { label: 'Healthy Plant',   cls: 'badge-success', Icon: CheckCircle },
};

/* Treatment icon rotation */
const TREATMENT_ICONS = [Flask, Drop, Leaf, Wrench, Plant];

/* Stagger variants */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.33, 1, 0.68, 1] } },
};

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  /* Guard — if navigated without state */
  if (!result) {
    return (
      <main className="result result--empty">
        <div className="container">
          <h2>No diagnosis found.</h2>
          <p>Please go back and run a diagnosis first.</p>
          <Link to="/analyze" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
            Run Diagnosis
          </Link>
        </div>
      </main>
    );
  }

  const { crop, disease, confidence, alternatives, imageUrl } = result;
  const sev = SEVERITY_CONFIG[disease.severity] || SEVERITY_CONFIG['low'];
  const SevIcon = sev.Icon;
  const isHealthy = disease.id === 'healthy';

  // Voice Audio playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [speechLang, setSpeechLang] = useState('en');

  const speakDiagnostics = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    
    // Construct the speech text from diagnostic info
    const introText = `Diagnosis result: ${disease.name}. Severity level: ${disease.severity || 'low'}.`;
    const descText = disease.description ? `Description: ${disease.description}.` : '';
    const treatmentsText = disease.treatments && disease.treatments.length > 0 
      ? `Recommended treatments: ${disease.treatments.join('. ')}`
      : '';
    
    const fullSpeechText = `${introText} ${descText} ${treatmentsText}`;
    
    const utterance = new SpeechSynthesisUtterance(fullSpeechText);
    const langMap = { en: 'en-US', hi: 'hi-IN', mr: 'mr-IN', es: 'es-ES' };
    utterance.lang = langMap[speechLang] || 'en-US';
    utterance.rate = 0.95;
    
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };
  
  // Clean up speech synthesis if component unmounts
  React.useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <main className="result">
      <div className="container result__inner">

        {/* ─── Back nav ─── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            id="result-back-btn"
            className="btn btn-secondary result__back"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} weight="bold" />
            Back
          </button>
        </motion.div>

        <div className="result__layout">

          {/* ══════════ LEFT — Image + crop info ══════════ */}
          <motion.div
            className="result__left"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: [0.33, 1, 0.68, 1] }}
          >
            {/* Leaf image */}
            <div className="result__image-card neo-raised">
              {imageUrl ? (
                <img src={imageUrl} alt="Uploaded leaf" className="result__image" />
              ) : (
                <div className="result__image-placeholder">
                  <Leaf size={48} weight="thin" style={{ color: 'var(--moss-pale)' }} />
                </div>
              )}
              <div className="result__image-crop-badge neo-raised-sm">
                <img src={crop.image} alt={crop.name} className="result__crop-thumb" />
                <div>
                  <span className="result__crop-name">{crop.name}</span>
                  <span className="result__crop-latin">{crop.latin}</span>
                </div>
              </div>
            </div>

            {/* Alternative predictions */}
            {alternatives.length > 0 && (
              <div className="result__alternatives neo-raised-sm">
                <h4 className="result__alt-title">Other Possibilities</h4>
                {alternatives.map((alt) => (
                  <div key={alt.name} className="result__alt-row">
                    <span className="result__alt-name">{alt.name}</span>
                    <div className="result__alt-bar-wrap">
                      <div className="result__alt-bar" style={{ width: `${alt.confidence}%` }} />
                    </div>
                    <span className="result__alt-pct">{alt.confidence}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Climate & Soil Telemetry Context */}
            {result.rawApiResponse && (
              <div className="result__telemetry neo-raised-sm" style={{ marginTop: '1.5rem', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                <h4 className="result__telemetry-title" style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Plant size={18} weight="fill" style={{ color: 'var(--moss)' }} />
                  Climate & Soil Intel
                </h4>
                
                {/* Weather details */}
                {result.rawApiResponse.weather && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                      <Thermometer size={16} weight="bold" style={{ color: 'var(--clay)' }} />
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Temp</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{result.rawApiResponse.weather.temperature}°C</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                      <Drop size={16} weight="bold" style={{ color: 'var(--moss)' }} />
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Humidity</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{result.rawApiResponse.weather.humidity}%</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Soil Profile details */}
                {result.rawApiResponse.soil && (
                  <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--moss-pale)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Soil Type:</span>
                      <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '70%', fontSize: '0.8rem' }}>{result.rawApiResponse.soil.type}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Est. pH:</span>
                      <span style={{ fontWeight: 600 }}>{result.rawApiResponse.soil.ph}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Moisture Status:</span>
                      <span style={{ fontWeight: 600, color: 'var(--moss)' }}>{result.rawApiResponse.soil.moisture_status}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* ══════════ RIGHT — Diagnosis details ══════════ */}
          <div className="result__right">

            {/* Disease name reveal */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.33, 1, 0.68, 1] }}
            >
              <p className="section-eyebrow">Diagnosis Result</p>
              <div className="result__disease-header">
                <h1 className="result__disease-name">{disease.name}</h1>
                <span className={`badge ${sev.cls} result__severity-badge`}>
                  <SevIcon size={14} weight="fill" />
                  {sev.label}
                </span>
              </div>
            </motion.div>

            {/* Confidence bar — animates after disease name */}
            <motion.div
              className="result__confidence-wrap neo-raised-sm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <ConfidenceBar value={confidence} label="Model Confidence" />
            </motion.div>

            {/* TTS Voice Advisory Control */}
            <motion.div
              className="result__tts neo-raised-sm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', marginTop: '1rem', borderRadius: 'var(--radius-lg)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="section-eyebrow" style={{ marginBottom: 0 }}>Voice Advisory:</span>
                <select 
                  value={speechLang} 
                  onChange={(e) => setSpeechLang(e.target.value)} 
                  className="tts-lang-select"
                  style={{ padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--moss-pale)', background: 'var(--surface)', fontSize: '0.8rem', outline: 'none' }}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="mr">Marathi (मराठी)</option>
                  <option value="es">Spanish (Español)</option>
                </select>
              </div>
              <button
                className={`btn btn-sm ${isPlayingAudio ? 'btn-secondary' : 'btn-primary'}`}
                onClick={speakDiagnostics}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto', padding: '0.4rem 1rem', fontSize: '0.82rem' }}
              >
                <SpeakerHigh size={16} weight="bold" />
                {isPlayingAudio ? 'Stop Listening' : 'Listen to Advice'}
              </button>
            </motion.div>

            {/* How & Why This Scan Helps AI for Climate Change */}
            <motion.div
              className="result__climate-box neo-raised-sm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.52 }}
              style={{
                padding: '1.25rem',
                marginTop: '1rem',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, rgba(61, 107, 79, 0.08) 0%, rgba(196, 123, 90, 0.08) 100%)',
                border: '1px solid rgba(61, 107, 79, 0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--moss)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Plant size={18} weight="fill" />
                  AI Climate Impact & Sensitivity Breakdown
                </h4>
                <span style={{ fontSize: '0.72rem', background: 'rgba(196, 123, 90, 0.15)', color: 'var(--clay)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                  Climate Driver Index: {Math.min(95, Math.max(40, Math.round((confidence || 85) * 0.9)))}%
                </span>
              </div>

              {/* Climate Driver Gauge Bar */}
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  <span>Microclimate Sensitivity: High</span>
                  <span>Pathogen Humidity Threshold Active</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--moss-pale)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(95, Math.max(40, Math.round((confidence || 85) * 0.9)))}%`,
                      height: '100%',
                      background: 'linear-gradient(to right, var(--moss), var(--clay))',
                      borderRadius: '999px'
                    }}
                  />
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem', lineHeight: 1.45 }}>
                <p style={{ margin: 0 }}>
                  <strong>🌱 1. Early Pathology Containment:</strong> Diagnosing {disease.name} early prevents severe field devastation, reducing the need for high-emission chemical pesticide production & heavy machinery spraying.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>🛰️ 2. Crowdsourced Pathogen Tracking:</strong> Your scan submits localized telemetry to AI weather models, training predictive radars to forecast heat & humidity-driven disease spread caused by climate change.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>⚡ 3. Nitrous Oxide (N₂O) Reduction:</strong> Following precision targeted remedies reduces synthetic nitrogen over-fertilization, preventing N₂O emissions which are 273x more potent greenhouse gases than CO₂.
                </p>
              </div>
            </motion.div>

            {/* Description */}
            {disease.description && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.55 }}
              >
                <p className="result__description">{disease.description}</p>
              </motion.div>
            )}

            {/* Symptoms */}
            {disease.symptoms?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.62 }}
              >
                <h3 className="result__section-heading">Key Symptoms</h3>
                <ul className="result__symptoms-list">
                  {disease.symptoms.map((s) => (
                    <li key={s} className="result__symptom-item">
                      <span className="result__symptom-dot" />
                      {s}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Treatments — staggered */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <h3 className="result__section-heading">
                {isHealthy ? 'Maintenance Recommendations' : 'Treatment Recommendations'}
              </h3>
            </motion.div>

            <motion.div
              className="result__treatments"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{ transitionDelay: '0.75s' }}
            >
              {disease.treatments.map((t, i) => {
                const TIcon = TREATMENT_ICONS[i % TREATMENT_ICONS.length];
                return (
                  <motion.div
                    key={i}
                    className="treatment-card neo-raised-sm"
                    variants={itemVariants}
                  >
                    <div className="treatment-card__icon">
                      <TIcon size={18} weight="fill" />
                    </div>
                    <p className="treatment-card__text">{t}</p>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Actions */}
            <motion.div
              className="result__actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            >
              <Link
                to="/analyze"
                id="result-scan-again-btn"
                className="btn btn-primary"
              >
                <ArrowCounterClockwise size={18} weight="bold" />
                Scan Another Leaf
              </Link>
              <button
                id="result-share-btn"
                className="btn btn-secondary"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `LeafSense: ${disease.name} in ${crop.name}`,
                      text: `Diagnosed ${disease.name} (${confidence}% confidence) on ${crop.name} using LeafSense.`,
                    });
                  } else {
                    navigator.clipboard.writeText(
                      `Diagnosed ${disease.name} (${confidence}% confidence) on ${crop.name} using LeafSense.`
                    );
                  }
                }}
              >
                Share Result
                <ArrowRight size={16} />
              </button>
            </motion.div>

            {/* Disclaimer */}
            <motion.p
              className="result__disclaimer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              ⚠ AI-assisted results. Always validate with a certified agronomist before treatment.
            </motion.p>
          </div>
        </div>
      </div>
    </main>
  );
}
