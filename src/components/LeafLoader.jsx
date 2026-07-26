import React from 'react';
import './LeafLoader.css';

/**
 * Organic "breathing" leaf loader — replaces generic spinner.
 * Uses pure CSS animation with an SVG leaf path.
 */
export default function LeafLoader({ size = 80, label = 'Analyzing leaf...' }) {
  return (
    <div className="leaf-loader" role="status" aria-label={label}>
      <div className="leaf-loader__orbit">
        <svg
          className="leaf-loader__leaf"
          width={size}
          height={size}
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main leaf shape */}
          <path
            d="M40 72 C40 72 8 58 8 30 C8 14 22 6 40 8 C58 6 72 14 72 30 C72 58 40 72 40 72Z"
            fill="var(--moss)"
            opacity="0.9"
          />
          {/* Central vein */}
          <path
            d="M40 72 L40 12"
            stroke="var(--moss-pale)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Left veins */}
          <path d="M40 30 C34 26 24 24 16 24" stroke="var(--moss-pale)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <path d="M40 42 C32 38 22 36 14 38" stroke="var(--moss-pale)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <path d="M40 54 C34 52 26 52 20 54" stroke="var(--moss-pale)" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          {/* Right veins */}
          <path d="M40 30 C46 26 56 24 64 24" stroke="var(--moss-pale)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <path d="M40 42 C48 38 58 36 66 38" stroke="var(--moss-pale)" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <path d="M40 54 C46 52 54 52 60 54" stroke="var(--moss-pale)" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        </svg>

        {/* Orbiting dots */}
        <div className="leaf-loader__dot leaf-loader__dot--1" />
        <div className="leaf-loader__dot leaf-loader__dot--2" />
        <div className="leaf-loader__dot leaf-loader__dot--3" />
      </div>

      {label && <p className="leaf-loader__label">{label}</p>}
    </div>
  );
}
