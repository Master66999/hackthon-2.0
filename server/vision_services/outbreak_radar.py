"""
Agricultural Risk Radar Calculator for LeafSense.

Computes vulnerability scores (0-100) for SVG Diamond Risk Radar:
  - Fungal Blight Risk
  - Bacterial Spot Risk
  - Pest Vector Risk
  - Nutrient Deficit Risk
"""

def detect_climate_anomaly_radar(disease, humidity=68, temp=28.5, wind_speed=12.4, precip_risk=15):
    """
    Predicts 48-72h extreme climate anomalies and pathogen vector surges based on live climate telemetry.
    """
    alerts = []
    alert_level = "STABLE"
    primary_threat = "Normal Environmental Dynamics"
    actionable_mitigation = "Maintain standard bio-protection spray schedule."
    trigger_condition = f"Temp {temp}°C • RH {humidity}% • Wind {wind_speed}km/h"

    if temp >= 34.0 and humidity >= 70:
        alert_level = "HIGH"
        primary_threat = "🔥 Extreme Heatwave & Humidity Pathogen Spike"
        trigger_condition = f"Extreme Thermal Surge ({temp}°C) + High Humidity ({humidity}%)"
        actionable_mitigation = "Spray Trichoderma viride 5g/L + Kaolin clay heat shield before 48h outbreak window."
        alerts.append("Heatwave & High Relative Humidity combined spike.")
    elif humidity >= 80:
        alert_level = "HIGH"
        primary_threat = "🌧️ Severe Humidity & Fungal Spore Germination Surge"
        trigger_condition = f"Excessive Relative Humidity ({humidity}%) + Rain Risk ({precip_risk}%)"
        actionable_mitigation = "Apply Potassium Bicarbonate 4g/L + Neem Oil 5ml/L preventative bio-barrier."
        alerts.append("Humidity saturation >80% triggers rapid fungal sporangia germination.")
    elif temp >= 36.0:
        alert_level = "MODERATE"
        primary_threat = "🌵 Thermal Heat Stress & Mite Vector Invasion"
        trigger_condition = f"High Temperature Anomaly ({temp}°C)"
        actionable_mitigation = "Apply Biochar mulch + Drip irrigation to prevent root desiccation and spider mite colonization."
        alerts.append("High heat stress weakens plant cell walls.")
    elif wind_speed >= 20.0:
        alert_level = "MODERATE"
        primary_threat = "💨 Wind-Dispersed Spore Transport Alert"
        trigger_condition = f"High Wind Speed ({wind_speed} km/h)"
        actionable_mitigation = "Install windbreak barriers and spray Bacillus subtilis 3g/L to protect foliage."
        alerts.append("High wind velocities accelerate airborne spore travel across regional fields.")
    elif humidity >= 70:
        alert_level = "MODERATE"
        primary_threat = "⚠️ Elevated Humidity & Mildew Vulnerability"
        trigger_condition = f"Elevated Relative Humidity ({humidity}%)"
        actionable_mitigation = "Ensure proper row spacing and apply Neem oil spray 5ml/L."
        alerts.append("Elevated humidity levels create favorable conditions for foliar pathogens.")

    return {
        "alert_level": alert_level,
        "primary_threat": primary_threat,
        "timeframe": "48–72 Hours Advance Warning",
        "trigger_condition": trigger_condition,
        "actionable_mitigation": actionable_mitigation,
        "anomalies_detected": alerts if alerts else ["No acute climate anomaly detected."]
    }


def calculate_outbreak_risk(disease, humidity=68, temp=28.5, wind_speed=12.4, precip_risk=15):
    """Calculates risk vector scores based on disease and environment."""
    d_lower = disease.lower()
    
    fungal = 25
    bacterial = 20
    pest = 30
    nutrient = 20
    
    # Humidity impact
    if humidity > 75:
        fungal += 35
        bacterial += 30
    elif humidity > 60:
        fungal += 20

    # Temperature impact
    if 24 <= temp <= 32:
        pest += 25
        bacterial += 15

    # Disease specific adjustments
    if "fungal" in d_lower or "scab" in d_lower or "rust" in d_lower:
        fungal = max(fungal, 85)
    elif "bacterial" in d_lower or "blight" in d_lower:
        bacterial = max(bacterial, 88)
    elif "spot" in d_lower or "damage" in d_lower:
        pest = max(pest, 72)
        nutrient = max(nutrient, 65)

    anomaly_radar = detect_climate_anomaly_radar(disease, humidity, temp, wind_speed, precip_risk)

    return {
        "fungal_blight": min(100, fungal),
        "bacterial_spot": min(100, bacterial),
        "pest_vector": min(100, pest),
        "nutrient_deficit": min(100, nutrient),
        "overall_risk_level": "High Risk" if max(fungal, bacterial, pest) > 70 else ("Moderate Risk" if max(fungal, bacterial, pest) > 40 else "Low Risk"),
        "anomaly_radar": anomaly_radar
    }
