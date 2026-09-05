import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plant, CurrencyDollar, ShieldCheck, Tree, CheckCircle, Sparkle, SealCheck, Recycle } from '@phosphor-icons/react';
import './RegenerativeCarbonDashboard.css';

const AVAILABLE_PRACTICES = [
  { id: 'cover_cropping', name: 'Leguminous Cover Cropping', rate: 1.45, tag: '+1.45 t CO₂/ha' },
  { id: 'biochar_amendment', name: 'Biochar Pyrolysis Amendment', rate: 2.20, tag: '+2.20 t CO₂/ha' },
  { id: 'zero_tillage', name: 'No-Till / Minimum Tillage', rate: 0.95, tag: '+0.95 t CO₂/ha' },
  { id: 'compost_vermicompost', name: 'Organic Vermicomposting', rate: 0.80, tag: '+0.80 t CO₂/ha' },
  { id: 'agroforestry', name: 'Agroforestry Boundary Trees', rate: 1.80, tag: '+1.80 t CO₂/ha' },
];

export default function RegenerativeCarbonDashboard({ initialCrop = 'Cotton' }) {
  const [crop, setCrop] = useState(initialCrop);
  const [farmSize, setFarmSize] = useState(2.5);
  const [selectedPractices, setSelectedPractices] = useState(['cover_cropping', 'biochar_amendment', 'zero_tillage']);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const practicesQuery = selectedPractices.join(',');
      const res = await fetch(`/api/vision/climate/regenerative-carbon?crop=${encodeURIComponent(crop)}&farm_size_ha=${farmSize}&practices=${practicesQuery}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching carbon dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [crop, farmSize, selectedPractices]);

  const togglePractice = (id) => {
    setSelectedPractices((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="carbon-dashboard neo-raised">
      {/* Header */}
      <div className="carbon-header">
        <div className="carbon-title-group">
          <span className="carbon-badge">
            <Recycle size={14} weight="bold" />
            AI Soil Carbon Protocol
          </span>
          <h2 className="carbon-title">AI Regenerative Agriculture & Carbon Sequestration Dashboard</h2>
          <p className="carbon-subtitle">
            Model soil organic carbon (SOC) sequestration, earn verified carbon credits, and monitor 5-year SOM % growth.
          </p>
        </div>

        {/* Inputs */}
        <div className="carbon-inputs">
          <div className="input-box">
            <label className="input-lbl">Farm Area (Hectares)</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="50"
              className="input-ctrl neo-inset-sm"
              value={farmSize}
              onChange={(e) => setFarmSize(parseFloat(e.target.value) || 1)}
            />
          </div>
          <div className="input-box">
            <label className="input-lbl">Crop Type</label>
            <select
              className="input-ctrl neo-inset-sm"
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

      {/* Practice Selectors */}
      <div className="practices-selector-card neo-raised-sm">
        <h4 className="selector-title">Select Active Regenerative Farming Practices:</h4>
        <div className="practices-pills">
          {AVAILABLE_PRACTICES.map((p) => {
            const isActive = selectedPractices.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                className={`practice-pill ${isActive ? 'active' : ''}`}
                onClick={() => togglePractice(p.id)}
              >
                <CheckCircle size={16} weight={isActive ? 'fill' : 'regular'} />
                <span>{p.name}</span>
                <span className="pill-rate">{p.tag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="carbon-loading">
          <div className="carbon-spinner" />
          <p>Calculating Soil Organic Carbon (SOC) sequestration rate…</p>
        </div>
      ) : dashboardData ? (
        <div className="carbon-body">
          {/* KPI Cards */}
          <div className="kpi-grid">
            <motion.div
              className="kpi-card neo-raised-sm primary"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="kpi-icon"><Tree size={24} weight="fill" /></span>
              <div className="kpi-data">
                <span className="kpi-val">{dashboardData.annual_co2_sequestered_tons} <small>Tons CO₂e/yr</small></span>
                <span className="kpi-lbl">Annual Carbon Sequestration</span>
              </div>
              <span className="kpi-badge">{dashboardData.carbon_rating}</span>
            </motion.div>

            <motion.div
              className="kpi-card neo-raised-sm success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="kpi-icon"><CurrencyDollar size={24} weight="fill" /></span>
              <div className="kpi-data">
                <span className="kpi-val">${dashboardData.annual_revenue_usd} <small>USD</small></span>
                <span className="kpi-subval">≈ ₹{dashboardData.annual_revenue_inr.toLocaleString()} INR / Year</span>
              </div>
              <span className="kpi-lbl">Carbon Credit Offset Revenue</span>
            </motion.div>

            <motion.div
              className="kpi-card neo-raised-sm cert"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="kpi-icon"><SealCheck size={24} weight="fill" /></span>
              <div className="kpi-data">
                <span className="kpi-cert-id">{dashboardData.certificate.id}</span>
                <span className="kpi-lbl">{dashboardData.certificate.status}</span>
              </div>
              <span className="kpi-subtext">{dashboardData.certificate.issuer}</span>
            </motion.div>
          </div>

          {/* Practice Breakdown & 5-Year Trajectory */}
          <div className="carbon-grid-2">
            {/* Practice Details */}
            <div className="practice-details-card neo-raised-sm">
              <h3 className="section-title">Active Regenerative Protocol Details</h3>
              <div className="practices-list">
                {dashboardData.active_practices.map((prac, idx) => (
                  <div key={idx} className="practice-item">
                    <div className="practice-item-hdr">
                      <strong className="practice-item-name">{prac.name}</strong>
                      <span className="practice-item-rate">+{prac.soc_rate_tons_ha} t CO₂/ha</span>
                    </div>
                    <p className="practice-item-desc">{prac.desc}</p>
                    <span className="n2o-badge">-{prac.n2o_reduction_pct}% N₂O Emissions</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5-Year SOM Trajectory */}
            <div className="trajectory-card neo-raised-sm">
              <h3 className="section-title">5-Year Soil Organic Matter (SOM %) Trajectory</h3>
              <div className="trajectory-list">
                {dashboardData.trajectory_5yr.map((yr, idx) => (
                  <div key={idx} className="trajectory-row">
                    <span className="yr-lbl">{yr.year}</span>
                    <div className="som-bar-wrap">
                      <div className="som-bar" style={{ width: `${Math.min(100, yr.som_percent * 18)}%` }} />
                    </div>
                    <span className="som-val">{yr.som_percent}% SOM</span>
                    <span className="revenue-val">+${yr.cumulative_revenue_usd}</span>
                  </div>
                ))}
              </div>
              <p className="trajectory-note">
                💡 Every +1% SOM increase boosts soil water holding capacity by ~20,000 gallons/acre.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
