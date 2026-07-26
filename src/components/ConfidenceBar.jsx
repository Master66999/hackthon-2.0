import React, { useEffect, useRef, useState } from 'react';
import './ConfidenceBar.css';

/**
 * Animates from 0 → value over ~800ms with easeOutCubic.
 * Displays a color-coded confidence level bar.
 */
export default function ConfidenceBar({ value, label = 'Confidence' }) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const duration = 800;
    const startTime = performance.now();
    const startVal = 0;
    const endVal = value;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = startVal + (endVal - startVal) * easeOutCubic(progress);
      setDisplayed(Math.round(current));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  const colorClass =
    value >= 85 ? 'confidence-bar--high'
    : value >= 70 ? 'confidence-bar--medium'
    : 'confidence-bar--low';

  return (
    <div className={`confidence-bar ${colorClass}`}>
      <div className="confidence-bar__header">
        <span className="confidence-bar__label">{label}</span>
        <span className="confidence-bar__value">{displayed}%</span>
      </div>
      <div className="confidence-bar__track" role="progressbar" aria-valuenow={displayed} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="confidence-bar__fill"
          style={{ width: `${displayed}%` }}
        />
      </div>
    </div>
  );
}
