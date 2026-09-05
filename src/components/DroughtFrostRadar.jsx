import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SunDim, ThermometerCold, Drop, Wind, ShieldWarning, CheckCircle, Warning, CaretRight, Sparkle } from '@phosphor-icons/react';
import './DroughtFrostRadar.css';

export default function DroughtFrostRadar({ initialLocation = 'Pune', initialCrop = 'Cotton' }) {
  const [location, setLocation] = useState(initialLocation);
  const [crop, setCrop] = useState(initialCrop);
  const [radarData, setRadarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRadar = async (loc, crp) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vision/climate/drought-frost-radar?location=${encodeURIComponent(loc)}&crop=${encodeURIComponent(crp)}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setRadarData(data);
    } catch (err) {
      console.error('Error fetching drought/frost radar:', err);
      setError('Unable to fetch live microclimate radar. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadar(location, crop);
  }, [location, crop]);

  return (
    <div className="radar-container neo-raised">
      {/* Header */}
      <div className="radar-header">
        <div className="radar-title-group">
          <span className="radar-badge">
            <Sparkle size={14} weight="fill" />
            AI Climate Intelligence
          </span>
          <h2 className="radar-title">Microclimate Drought & Frost Early Warning Radar</h2>
          <p className="radar-subtitle">
            7-day predictive risk modeling for flash droughts, cold snaps, and extreme heatwaves.
          </p>
        </div>

        {/* Location & Crop Selectors */}
        <div className="radar-controls">
          <div className="control-field">
            <label className="control-label">Location</label>
            <input
              type="text"
              className="control-input neo-inset-sm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Pune, Nagpur"
            />
          </div>
          <div className="control-field">
            <label className="control-label">Target Crop</label>
            <select
              className="control-select neo-inset-sm"
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
        </div>
      </div>

      {loading ? (
        <div className="radar-loading">
          <div className="radar-spinner" />
          <p>Analyzing satellite weather anomalies & soil moisture loss…</p>
        </div>
      ) : error ? (
        <div className="radar-error">
          <Warning size={20} weight="fill" />
          <span>{error}</span>
        </div>
      ) : radarData ? (
        <div className="radar-body">
          {/* Top Threat Gauges */}
          <div className="radar-gauges-grid">
            {/* Flash Drought Card */}
            <motion.div
              className={`radar-gauge-card neo-raised-sm ${radarData.drought_radar.status.toLowerCase()}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="gauge-header">
                <span className="gauge-icon drought">
                  <SunDim size={22} weight="fill" />
                </span>
                <span className={`status-pill ${radarData.drought_radar.status.toLowerCase()}`}>
                  {radarData.drought_radar.status}
                </span>
              </div>
              <div className="gauge-metric">
                <span className="metric-score">{radarData.drought_radar.score}%</span>
                <span className="metric-name">Flash Drought Risk</span>
              </div>
              <p className="gauge-desc">{radarData.drought_radar.level}</p>
              <div className="gauge-bar-bg">
                <div
                  className="gauge-bar-fill drought"
                  style={{ width: `${radarData.drought_radar.score}%` }}
                />
              </div>
            </motion.div>

            {/* Frost & Chilling Card */}
            <motion.div
              className={`radar-gauge-card neo-raised-sm ${radarData.frost_radar.status.toLowerCase()}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="gauge-header">
                <span className="gauge-icon frost">
                  <ThermometerCold size={22} weight="fill" />
                </span>
                <span className={`status-pill ${radarData.frost_radar.status.toLowerCase()}`}>
                  {radarData.frost_radar.status}
                </span>
              </div>
              <div className="gauge-metric">
                <span className="metric-score">{radarData.frost_radar.score}%</span>
                <span className="metric-name">Frost & Chill Warning</span>
              </div>
              <p className="gauge-desc">Min forecast: {radarData.frost_radar.min_forecast_temp}°C</p>
              <div className="gauge-bar-bg">
                <div
                  className="gauge-bar-fill frost"
                  style={{ width: `${radarData.frost_radar.score}%` }}
                />
              </div>
            </motion.div>

            {/* Live Microclimate Stats */}
            <motion.div
              className="radar-gauge-card neo-raised-sm stats"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <h4 className="stats-title">Live Station Metrics</h4>
              <div className="stats-list">
                <div className="stat-item">
                  <Drop size={16} className="stat-ic" />
                  <span className="stat-lbl">Air Humidity:</span>
                  <span className="stat-val">{radarData.current_conditions.humidity}%</span>
                </div>
                <div className="stat-item">
                  <Wind size={16} className="stat-ic" />
                  <span className="stat-lbl">Wind Vector:</span>
                  <span className="stat-val">{radarData.current_conditions.wind_speed} km/h</span>
                </div>
                <div className="stat-item">
                  <ShieldWarning size={16} className="stat-ic" />
                  <span className="stat-lbl">Soil Status:</span>
                  <span className="stat-val accent">{radarData.current_conditions.soil_moisture}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 7-Day Risk Timeline */}
          <div className="radar-timeline-section">
            <h3 className="section-heading">7-Day Microclimate Risk Progression</h3>
            <div className="timeline-grid">
              {radarData.timeline.map((item, idx) => (
                <div key={idx} className="timeline-card neo-raised-sm">
                  <span className="timeline-day">{item.day}</span>
                  <div className="timeline-temp">
                    <span className="t-max">{item.temp_max}°</span>
                    <span className="t-min">{item.temp_min}°</span>
                  </div>
                  <div className="timeline-bars">
                    <div className="timeline-bar-group">
                      <span className="bar-label">Drought</span>
                      <div className="mini-bar-bg">
                        <div className="mini-bar-fill drought" style={{ width: `${item.drought_risk}%` }} />
                      </div>
                    </div>
                    <div className="timeline-bar-group">
                      <span className="bar-label">Frost</span>
                      <div className="mini-bar-bg">
                        <div className="mini-bar-fill frost" style={{ width: `${item.frost_risk}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Protective Mitigation Actions */}
          <div className="radar-mitigations-section">
            <h3 className="section-heading">Actionable Climate Mitigation Measures</h3>
            <div className="mitigations-grid">
              {radarData.mitigations.map((action, idx) => (
                <motion.div
                  key={idx}
                  className="mitigation-card neo-raised-sm"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                >
                  <div className="mitigation-header">
                    <span className={`urgency-tag ${action.urgency.toLowerCase()}`}>
                      {action.urgency} Urgency
                    </span>
                    <span className="category-tag">{action.category}</span>
                  </div>
                  <h4 className="mitigation-title">{action.title}</h4>
                  <p className="mitigation-desc">{action.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
