import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowsLeftRight } from '@phosphor-icons/react';
import { CROPS } from '../data/crops.js';
import './Crop3DCarousel.css';

/*
  Reconstructed 3D Fan & Mobile Touch Carousel.
  Dynamically adapts perspective offsets for mobile screens (< 768px)
  to ensure full card readability, touch responsiveness, and zero overflow.
*/

const DESKTOP_SLOTS = [
  { offset: -2, x: -520, ry:  52, scale: 0.60, op: 0.28, zi: 1 },
  { offset: -1, x: -278, ry:  36, scale: 0.80, op: 0.65, zi: 2 },
  { offset:  0, x:    0, ry:   0, scale: 1.00, op: 1.00, zi: 5 },
  { offset:  1, x:  278, ry: -36, scale: 0.80, op: 0.65, zi: 2 },
  { offset:  2, x:  520, ry: -52, scale: 0.60, op: 0.28, zi: 1 },
];

const MOBILE_SLOTS = [
  { offset: -2, x: -240, ry:  30, scale: 0.50, op: 0.00, zi: 1 },
  { offset: -1, x: -145, ry:  20, scale: 0.84, op: 0.48, zi: 2 },
  { offset:  0, x:    0, ry:   0, scale: 1.00, op: 1.00, zi: 5 },
  { offset:  1, x:  145, ry: -20, scale: 0.84, op: 0.48, zi: 2 },
  { offset:  2, x:  240, ry: -30, scale: 0.50, op: 0.00, zi: 1 },
];

export default function Crop3DCarousel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const N = CROPS.length; // 6

  // Track window resize for responsive slot positioning
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const go = useCallback(
    (dir) => setActiveIdx((i) => (i + dir + N) % N),
    [N]
  );

  /* Touch & swipe navigation */
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const dx = touchEndX.current - touchStartX.current;
    if (Math.abs(dx) > 35) {
      go(dx < 0 ? 1 : -1);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  /* Keyboard navigation */
  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft')  go(-1);
    if (e.key === 'ArrowRight') go(1);
  };

  const currentSlots = isMobile ? MOBILE_SLOTS : DESKTOP_SLOTS;

  return (
    <div
      className="c3d"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Supported crop carousel"
    >
      {/* ── 3-D Stage ── */}
      <div className="c3d__stage">
        {/* Ambient glow floor ring */}
        <div className="c3d__ring" />

        {CROPS.map((crop, idx) => {
          let offset = idx - activeIdx;
          if (offset >  N / 2) offset -= N;
          if (offset < -N / 2) offset += N;

          const slot = currentSlots.find((s) => s.offset === offset);
          if (!slot) return null;

          const isActive = offset === 0;

          return (
            <div
              key={crop.id}
              className={`c3d__card-wrap${isActive ? ' is-active' : ''}`}
              style={{
                '--tx': `${slot.x}px`,
                '--ry': `${slot.ry}deg`,
                '--sc': slot.scale,
                '--op': slot.op,
                '--zi': slot.zi,
              }}
              onClick={() => {
                if (!isActive) go(slot.offset > 0 ? 1 : -1);
              }}
              aria-label={isActive ? undefined : `View ${crop.name}`}
            >
              <div className="c3d__card neo-raised">
                {/* Image */}
                <div className="c3d__img-wrap">
                  <img
                    src={crop.image}
                    alt={`${crop.name} plant`}
                    className="c3d__img"
                    loading="lazy"
                  />
                  <div
                    className="c3d__img-gradient"
                    style={{
                      background: `linear-gradient(to top, ${crop.accent}e6 0%, ${crop.accent}66 45%, transparent 75%)`,
                    }}
                  />
                  <div className="c3d__foil" />
                </div>

                {/* Content */}
                <div className="c3d__content">
                  <span className="c3d__latin">{crop.latin}</span>
                  <h3 className="c3d__name">{crop.name}</h3>
                  <p className="c3d__count">
                    {crop.diseases.filter((d) => d.id !== 'healthy').length}&nbsp;diseases tracked
                  </p>
                  
                  {/* CTA button (visible always on active card) */}
                  <div className={`c3d__cta${isActive ? ' c3d__cta--show' : ''}`}>
                    <Link
                      to="/analyze"
                      state={{ cropId: crop.id }}
                      className="btn btn-secondary c3d__cta-btn"
                      id={`c3d-cta-${crop.id}`}
                      tabIndex={isActive ? 0 : -1}
                    >
                      Analyze {crop.name}
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  </div>
                </div>
              </div>

              {isActive && <div className="c3d__card-shadow" />}
            </div>
          );
        })}
      </div>

      {/* ── Mobile Swipe Hint ── */}
      {isMobile && (
        <div className="c3d__mobile-swipe-hint">
          <ArrowsLeftRight size={16} weight="bold" className="c3d__swipe-icon" />
          <span>Swipe cards left or right</span>
        </div>
      )}

      {/* ── Controls ── */}
      <div className="c3d__controls">
        <button
          id="c3d-prev"
          className="c3d__nav-btn neo-raised-sm"
          onClick={() => go(-1)}
          aria-label="Previous crop"
        >
          <ArrowLeft size={18} weight="bold" />
        </button>

        {/* Pill dots */}
        <div className="c3d__dots" role="tablist" aria-label="Select crop">
          {CROPS.map((crop, i) => (
            <button
              key={crop.id}
              id={`c3d-dot-${crop.id}`}
              className={`c3d__dot${i === activeIdx ? ' c3d__dot--active' : ''}`}
              onClick={() => setActiveIdx(i)}
              aria-label={`View ${crop.name}`}
              role="tab"
              aria-selected={i === activeIdx}
            />
          ))}
        </div>

        <button
          id="c3d-next"
          className="c3d__nav-btn neo-raised-sm"
          onClick={() => go(1)}
          aria-label="Next crop"
        >
          <ArrowRight size={18} weight="bold" />
        </button>
      </div>

      {/* Active crop label strip */}
      <p className="c3d__label-strip">
        <span className="c3d__label-num">{String(activeIdx + 1).padStart(2, '0')}</span>
        <span className="c3d__label-sep">—</span>
        <span className="c3d__label-name">{CROPS[activeIdx].name}</span>
        <span className="c3d__label-total">/ {String(N).padStart(2, '0')}</span>
      </p>
    </div>
  );
}
