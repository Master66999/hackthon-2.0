import React from 'react';
import { motion } from 'framer-motion';
import './CropCard.css';

/**
 * Neomorphic crop selection card with spring-based hover animation.
 */
export default function CropCard({ crop, isSelected, onClick }) {
  return (
    <motion.button
      id={`crop-card-${crop.id}`}
      className={`crop-card ${isSelected ? 'crop-card--selected' : ''}`}
      onClick={() => onClick(crop.id)}
      aria-pressed={isSelected}
      aria-label={`Select ${crop.name}`}
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
    >
      <div className="crop-card__image-wrap">
        <img
          src={crop.image}
          alt={`${crop.name} plant`}
          className="crop-card__image"
          loading="lazy"
        />
        <div
          className="crop-card__image-overlay"
          style={{ background: `linear-gradient(to top, ${crop.accent}cc, transparent)` }}
        />
      </div>

      <div className="crop-card__body">
        <h3 className="crop-card__name">{crop.name}</h3>
        <p className="crop-card__latin">{crop.latin}</p>
        <p className="crop-card__count">
          {crop.diseases.filter(d => d.id !== 'healthy').length} diseases tracked
        </p>
      </div>

      {isSelected && (
        <motion.div
          className="crop-card__selected-badge"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          ✓
        </motion.div>
      )}
    </motion.button>
  );
}
