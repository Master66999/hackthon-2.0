import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadSimple, Image, X, ArrowRight, Warning, Camera } from '@phosphor-icons/react';
import { CROPS } from '../data/crops.js';
import { useDiagnosis } from '../hooks/useDiagnosis.js';
import CropCard from '../components/CropCard.jsx';
import LeafLoader from '../components/LeafLoader.jsx';
import Toast from '../components/Toast.jsx';
import './Analyze.css';

export default function Analyze() {
  const navigate = useNavigate();
  const location = useLocation();

  /* Pre-select crop if navigated from landing gallery */
  const [selectedCrop, setSelectedCrop] = useState(location.state?.cropId || null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  // Camera scanner state & refs
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    return () => {
      // Clean up camera stream on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = (e) => {
    e.stopPropagation();
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    })
    .then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    })
    .catch((err) => {
      console.error('Camera access error:', err);
      setToast({ message: 'Unable to access camera. Check device permissions.', type: 'error' });
    });
  };

  const stopCamera = useCallback((e) => {
    if (e) e.stopPropagation();
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const capFile = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' });
          setFile(capFile);
          setPreview(URL.createObjectURL(blob));
          stopCamera();
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const { state: diagState, diagnose } = useDiagnosis();

  /* ─── File handling ─────────────── */
  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setToast({ message: 'Please upload an image file (JPG, PNG, WEBP)', type: 'error' });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setToast({ message: 'File too large — maximum 10 MB', type: 'warning' });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  }, [handleFile]);

  const handleInputChange = useCallback((e) => {
    handleFile(e.target.files?.[0]);
  }, [handleFile]);

  const clearFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  /* ─── Submit ─────────────────────── */
  const handleSubmit = async () => {
    if (!selectedCrop) {
      setToast({ message: 'Please select a crop first', type: 'warning' });
      return;
    }
    if (!file) {
      setToast({ message: 'Please upload a leaf photo', type: 'warning' });
      return;
    }

    const result = await diagnose(selectedCrop, file);
    if (result) {
      navigate('/result', { state: { result } });
    } else {
      setToast({ message: 'Diagnosis failed. Please try again.', type: 'error' });
    }
  };

  const isLoading = diagState === 'loading';

  return (
    <main className="analyze">
      <div className="container analyze__inner">

        {/* ─── Header ─── */}
        <motion.div
          className="analyze__header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
        >
          <p className="section-eyebrow">Step 1 of 2</p>
          <h1 className="analyze__title">Select your crop</h1>
          <p className="analyze__subtitle">
            Choose the crop you want to diagnose. Our models are optimized per-crop for best accuracy.
          </p>
        </motion.div>

        {/* ─── Crop Grid ─── */}
        <motion.div
          className="crop-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {CROPS.map((crop, i) => (
            <motion.div
              key={crop.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12 + i * 0.06, ease: [0.33, 1, 0.68, 1] }}
            >
              <CropCard
                crop={crop}
                isSelected={selectedCrop === crop.id}
                onClick={setSelectedCrop}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* ─── Divider ─── */}
        <AnimatePresence>
          {selectedCrop && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
            >
              <div className="analyze__step-divider">
                <div className="divider" />
                <div className="analyze__step-label">
                  <p className="section-eyebrow" style={{ marginBottom: 0 }}>Step 2 of 2</p>
                  <h2 className="analyze__upload-title">Upload a leaf photo</h2>
                  <p className="analyze__upload-subtitle">
                    Take a clear, well-lit photo of a single affected leaf. Avoid shadows and blurring.
                  </p>
                </div>
              </div>

              {/* ─── Upload Zone ─── */}
              <motion.div
                className={`upload-zone neo-raised ${dragOver ? 'upload-zone--dragover' : ''} ${preview ? 'upload-zone--has-preview' : ''} ${cameraActive ? 'upload-zone--camera-active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !preview && !cameraActive && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Upload leaf photo"
                onKeyDown={(e) => e.key === 'Enter' && !preview && !cameraActive && fileInputRef.current?.click()}
                animate={{
                  boxShadow: dragOver
                    ? '0 0 0 3px var(--moss), var(--neo-raised-lg)'
                    : undefined,
                }}
                transition={{ duration: 0.25 }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="upload-zone__input"
                  id="leaf-upload-input"
                  aria-label="Choose leaf image file"
                />

                <AnimatePresence mode="wait">
                  {cameraActive ? (
                    <motion.div
                      key="camera"
                      className="camera-scanner"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}
                    >
                      <video ref={videoRef} className="camera-scanner__video" autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }} />
                      <div className="camera-scanner__actions" style={{ position: 'absolute', bottom: '1.25rem', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '1rem', padding: '0 1rem', zIndex: 10 }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={stopCamera} style={{ background: 'rgba(30, 41, 59, 0.8)', color: 'white', backdropFilter: 'blur(4px)' }}>
                          Cancel
                        </button>
                        <button type="button" className="btn btn-primary btn-sm" onClick={capturePhoto}>
                          Capture Photo
                        </button>
                      </div>
                    </motion.div>
                  ) : preview ? (
                    <motion.div
                      key="preview"
                      className="upload-preview"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img src={preview} alt="Uploaded leaf preview" className="upload-preview__img" />
                      <button
                        className="upload-preview__remove"
                        onClick={(e) => { e.stopPropagation(); clearFile(); }}
                        aria-label="Remove uploaded image"
                      >
                        <X size={16} weight="bold" />
                      </button>
                      <div className="upload-preview__overlay">
                        <Image size={20} />
                        <span>{file?.name}</span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="prompt"
                      className="upload-zone__prompt"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className={`upload-zone__icon ${dragOver ? 'upload-zone__icon--active' : ''}`}>
                        <UploadSimple size={36} weight="light" />
                      </div>
                      <p className="upload-zone__title">
                        {dragOver ? 'Drop your leaf photo here' : 'Drag & drop a leaf photo'}
                      </p>
                      <p className="upload-zone__hint">
                        or <span className="upload-zone__hint-link">click to browse</span>
                      </p>
                      <p className="upload-zone__formats">JPG, PNG, WEBP — max 10 MB</p>
                      
                      <div className="upload-zone__camera-trigger-wrap" style={{ marginTop: '1.25rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm upload-zone__camera-btn"
                          onClick={startCamera}
                          style={{ gap: '0.5rem', display: 'inline-flex', alignItems: 'center' }}
                        >
                          <Camera size={16} weight="bold" />
                          Use Camera
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* ─── Tips ─── */}
              <div className="upload-tips">
                <div className="upload-tip">
                  <Warning size={16} weight="fill" style={{ color: 'var(--clay)', flexShrink: 0 }} />
                  <p>Use natural daylight. Avoid flash which washes out lesion details.</p>
                </div>
                <div className="upload-tip">
                  <Warning size={16} weight="fill" style={{ color: 'var(--clay)', flexShrink: 0 }} />
                  <p>Keep the leaf as flat as possible and fill the frame with one leaf.</p>
                </div>
              </div>

              {/* ─── Submit ─── */}
              <div className="analyze__submit-row">
                <motion.button
                  id="analyze-submit-btn"
                  className="btn btn-primary analyze__submit-btn"
                  onClick={handleSubmit}
                  disabled={isLoading || !file || !selectedCrop}
                  whileTap={{ scale: isLoading ? 1 : 0.97 }}
                >
                  {isLoading ? 'Analyzing…' : 'Run Diagnosis'}
                  {!isLoading && <ArrowRight size={18} weight="bold" />}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Loading Overlay ─── */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="analyze__loading-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="analyze__loading-card neo-raised">
                <LeafLoader label="Analyzing your leaf…" />
                <p className="analyze__loading-sub">
                  Running AI pathology model on your upload.<br />This takes 3–5 seconds.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </main>
  );
}
