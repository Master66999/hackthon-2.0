import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Drop, Timer, Waves, Gauge, ShieldCheck, Sparkle, ArrowClockwise, ArrowRight } from '@phosphor-icons/react';
import './PrecisionWaterCalculator.css';

export default function PrecisionWaterCalculator({ initialCrop = 'Cotton', initialSoil = 'Black Basaltic Clay' }) {
  const [crop, setCrop] = useState(initialCrop);
  const [soilType, setSoilType] = useState(initialSoil);
  const [farmArea, setFarmArea] = useState(2.5);
  const [temp, setTemp] = useState(29.0);
  const [humidity, setHumidity] = useState(65);
  const [windSpeed, setWindSpeed] = useState(12.0);
  const [waterData, setWaterData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWaterAdvisory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vision/water?crop=${encodeURIComponent(crop)}&location=Pune`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setWaterData(data);
    } catch (err) {
      console.error('Error fetching water advisory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaterAdvisory();
  }, [crop, soilType, temp, humidity, windSpeed]);

  const totalFarmLiters = waterData ? Math.round(waterData.precision_drip_liters_ha * farmArea) : 0;
  const totalFarmSaved = waterData ? Math.round(waterData.water_saved_liters_ha * farmArea) : 0;

  return (
    <div className="water-calc neo-raised">
      {/* Header */}
      <div className="water-header">
        <div className="water-title-group">
          <span className="water-badge">
            <Drop size={14} weight="fill" />
            FAO-56 Penman-Monteith Evapotranspiration
          </span>
          <h2 className="water-title">AI Precision Water & Evapotranspiration Calculator</h2>
          <p className="water-subtitle">
            Calculates crop evapotranspiration ($ET_c$), soil water retention, and exact daily drip irrigation runtime.
          </p>
        </div>

        {/* Inputs */}
        <div className="water-controls">
          <div className="control-group">
            <label className="control-lbl">Crop Target</label>
            <select
              className="control-sel neo-inset-sm"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
            >
              <option value="Cotton">Cotton</option>
              <option value="Tomato">Tomato</option>
              <option value="Tea">Tea</option>
              <option value="Coffee">Coffee</option>
              <option value="Maize">Maize</option>
              <option value="Apple">Apple</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-lbl">Farm Area (Ha)</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="100"
              className="control-inp neo-inset-sm"
              value={farmArea}
              onChange={(e) => setFarmArea(parseFloat(e.target.value) || 1)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="water-loading">
          <div className="water-spinner" />
          <p>Calculating Penman-Monteith $ET_c$ and soil retention capacity…</p>
        </div>
      ) : waterData ? (
        <div className="water-body">
          {/* Main KPI Row */}
          <div className="water-kpi-grid">
            <motion.div
              className="water-kpi-card neo-raised-sm drip"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="kpi-icon-wrap drip"><Drop size={22} weight="fill" /></span>
              <div className="kpi-info">
                <span className="kpi-num">{totalFarmLiters.toLocaleString()} <small>L/day</small></span>
                <span className="kpi-label">Farm Drip Requirement ({farmArea} Ha)</span>
              </div>
              <span className="kpi-subtag">ETc: {waterData.etc_mm_day} mm/day</span>
            </motion.div>

            <motion.div
              className="water-kpi-card neo-raised-sm time"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="kpi-icon-wrap time"><Timer size={22} weight="fill" /></span>
              <div className="kpi-info">
                <span className="kpi-num">{waterData.drip_duration_mins} <small>Mins/day</small></span>
                <span className="kpi-label">Recommended Drip Pulse Runtime</span>
              </div>
              <span className="kpi-subtag">Flow: 4 L/hr Emitters</span>
            </motion.div>

            <motion.div
              className="water-kpi-card neo-raised-sm saved"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="kpi-icon-wrap saved"><Waves size={22} weight="fill" /></span>
              <div className="kpi-info">
                <span className="kpi-num">{totalFarmSaved.toLocaleString()} <small>L Saved</small></span>
                <span className="kpi-label">Water Saved vs Flood Irrigation</span>
              </div>
              <span className="kpi-subtag accent">-{waterData.savings_percent}% H₂O Reduction</span>
            </motion.div>
          </div>

          {/* Advisory & Soil Details */}
          <div className="water-grid-2">
            {/* Advisory Card */}
            <div className="advisory-card neo-raised-sm">
              <div className="advisory-hdr">
                <span className="status-badge">{waterData.status}</span>
                <span className="soil-rating-tag">{waterData.soil_retention_rating}</span>
              </div>
              <h4 className="advisory-title">Precision Irrigation Protocol</h4>
              <p className="advisory-text">{waterData.advisory}</p>
            </div>

            {/* Evapotranspiration Breakdown */}
            <div className="etc-breakdown-card neo-raised-sm">
              <h4 className="breakdown-title">Water Balance & Evapotranspiration Matrix</h4>
              <div className="breakdown-list">
                <div className="breakdown-row">
                  <span className="b-lbl">Reference Evapotranspiration ($ET_0$):</span>
                  <span className="b-val">{waterData.et0_mm_day} mm/day</span>
                </div>
                <div className="breakdown-row">
                  <span className="b-lbl">Crop Coefficient ($K_c$):</span>
                  <span className="b-val">{((waterData.etc_mm_day / maxVal(waterData.et0_mm_day, 0.1))).toFixed(2)}</span>
                </div>
                <div className="breakdown-row">
                  <span className="b-lbl">Flood Baseline (Unoptimized):</span>
                  <span className="b-val danger">{(waterData.flood_baseline_liters_ha * farmArea).toLocaleString()} L/day</span>
                </div>
                <div className="breakdown-row">
                  <span className="b-lbl">Precision Drip (Optimized):</span>
                  <span className="b-val success">{totalFarmLiters.toLocaleString()} L/day</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function maxVal(a, b) {
  return a > b ? a : b;
}
