import React, { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { CROPS } from '../data/crops.js';
import './Crop3DCarousel.css';

/*
  3D fan carousel — 5 cards visible at once.
  Centre card faces viewer; side cards rotate on Y-axis
  with perspective to create the Diamond-Gallery style depth effect.

  Slot positions (relative offset from active card):
    -2 → far-left   · rotateY(+52deg) · dimmed heavily
    -1 → left       · rotateY(+36deg) · dimmed slightly
     0 → center     · rotateY(0)      · full opacity + CTA
    +1 → right      · rotateY(-36deg) · dimmed slightly
    +2 → far-right  · rotateY(-52deg) · dimmed heavily
*/
const SLOTS = [
  { offset: -2, x: -520, ry:  52, scale: 0.60, op: 0.28, zi: 1 },
  { offset: -1, x: -278, ry:  36, scale: 0.80, op: 0.65, zi: 2 },
  { offset:  0, x:    0, ry:   0, scale: 1.00, op: 1.00, zi: 5 },
  { offset:  1, x:  278, ry: -36, scale: 0.80, op: 0.65, zi: 2 },
  { offset:  2, x:  520, ry: -52, scale: 0.60, op: 0.28, zi: 1 },
];

function getSlot(offset) {
  return SLOTS.find((s) => s.offset === offset) ?? null;
}

export default function Crop3DCarousel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const touchStartX = useRef(null);
  const N = CROPS.length; // 6

  const go = useCallback(
    (dir) => setActiveIdx((i) => (i + dir + N) % N),
    [N]
  );

  /* Touch / swipe */
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  /* Keyboard navigation */
  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft')  go(-1);
    if (e.key === 'ArrowRight') go(1);
  };

  return (
    <div
      className="c3d"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Supported crop carousel"
    >
      {/* ── 3-D Stage ── */}
      <div className="c3d__stage">
        {/* Ambient glow ring on the "floor" */}
        <div className="c3d__ring" />

        {CROPS.map((crop, idx) => {
          /* Compute normalized offset */
          let offset = idx - activeIdx;
          if (offset >  N / 2) offset -= N;
          if (offset < -N / 2) offset += N;

          const slot    = getSlot(offset);
          if (!slot) return null;           // hide cards beyond ±2

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
                  {/* Colour-matched gradient from crop accent */}
                  <div
                    className="c3d__img-gradient"
                    style={{
                      background: `linear-gradient(to top, ${crop.accent}d9 0%, ${crop.accent}55 42%, transparent 72%)`,
                    }}
                  />
                  {/* Holographic foil sheen — visible on hover */}
                  <div className="c3d__foil" />
                </div>

                {/* Content */}
                <div className="c3d__content">
                  <p className="c3d__latin">{crop.latin}</p>
                  <h3 className="c3d__name">{crop.name}</h3>
                  <p className="c3d__count">
                    {crop.diseases.filter((d) => d.id !== 'healthy').length}&nbsp;diseases tracked
                  </p>
                  {/* CTA slides in only for the active card */}
                  <div className={`c3d__cta${isActive ? ' c3d__cta--show' : ''}`}>
                    <Link
                      to="/analyze"
                      state={{ cropId: crop.id }}
                      className="btn btn-secondary c3d__cta-btn"
                      id={`c3d-cta-${crop.id}`}
                      tabIndex={isActive ? 0 : -1}
                    >
                      Analyze {crop.name}
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Per-card ground shadow */}
              {isActive && <div className="c3d__card-shadow" />}
            </div>
          );
        })}
      </div>

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

        {/* Pill-dots */}
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
