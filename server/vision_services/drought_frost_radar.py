"""
AI Microclimate Drought & Frost Early Warning Radar Service for LeafSense.
Analyzes temperature extremes, humidity drops, wind speed vectors, and precipitation history
to calculate Flash Drought Risk and Frost / Chilling Stress Warnings.
"""

import math
from vision_services.weather_service import fetch_weather_and_soil, fetch_7day_forecast

# Crop-specific temperature & moisture vulnerability thresholds
CROP_CLIMATE_THRESHOLDS = {
    "cotton": {
        "heat_stress_temp": 38.0,
        "drought_humidity_limit": 40.0,
        "frost_temp_limit": 10.0,
        "optimal_temp_range": [21.0, 35.0]
    },
    "tomato": {
        "heat_stress_temp": 35.0,
        "drought_humidity_limit": 45.0,
        "frost_temp_limit": 6.0,
        "optimal_temp_range": [18.0, 30.0]
    },
    "tea": {
        "heat_stress_temp": 33.0,
        "drought_humidity_limit": 55.0,
        "frost_temp_limit": 4.0,
        "optimal_temp_range": [15.0, 28.0]
    },
    "coffee": {
        "heat_stress_temp": 32.0,
        "drought_humidity_limit": 50.0,
        "frost_temp_limit": 5.0,
        "optimal_temp_range": [15.0, 26.0]
    },
    "maize": {
        "heat_stress_temp": 36.0,
        "drought_humidity_limit": 40.0,
        "frost_temp_limit": 8.0,
        "optimal_temp_range": [18.0, 32.0]
    },
    "apple": {
        "heat_stress_temp": 30.0,
        "drought_humidity_limit": 45.0,
        "frost_temp_limit": -2.0,
        "optimal_temp_range": [12.0, 24.0]
    },
    "default": {
        "heat_stress_temp": 36.0,
        "drought_humidity_limit": 45.0,
        "frost_temp_limit": 6.0,
        "optimal_temp_range": [18.0, 32.0]
    }
}

def calculate_drought_frost_radar(location="Pune", lat=18.5204, lng=73.8567, crop="cotton"):
    """
    Computes microclimate early warning indicators for Flash Drought & Frost / Chilling Stress.
    """
    crop_key = str(crop).lower().strip()
    thresholds = CROP_CLIMATE_THRESHOLDS.get(crop_key, CROP_CLIMATE_THRESHOLDS["default"])

    # Fetch live weather and 7-day forecast
    weather_info = fetch_weather_and_soil(location)
    weather = weather_info.get("weather", {})
    soil = weather_info.get("soil", {})
    forecast = fetch_7day_forecast(lat, lng)

    curr_temp = weather.get("temperature", 28.5)
    curr_humidity = weather.get("humidity", 65)
    wind_speed = weather.get("wind_speed", 12.0)
    precip = weather.get("precipitation_risk", 10)

    # 1. Compute Flash Drought Index (0 - 100)
    # High temp + Low humidity + High wind speed + Zero rain = Severe drought stress
    temp_factor = max(0, (curr_temp - 25.0) * 3.5)
    humidity_factor = max(0, (65.0 - curr_humidity) * 1.8)
    wind_factor = max(0, (wind_speed - 10.0) * 1.5)
    precip_factor = max(0, (20.0 - precip) * 1.2)

    drought_score = round(min(100, temp_factor + humidity_factor + wind_factor + precip_factor))

    # Determine Drought Level
    if drought_score >= 75:
        drought_level = "Severe Flash Drought Risk"
        drought_status = "CRITICAL"
    elif drought_score >= 45:
        drought_level = "Moderate Moisture Stress"
        drought_status = "WARNING"
    else:
        drought_level = "Low Drought Risk"
        drought_status = "STABLE"

    # 2. Compute Frost & Chilling Risk (0 - 100)
    min_forecast_temp = min([d.get("temp_min", curr_temp) for d in forecast]) if forecast else curr_temp
    
    frost_score = 0
    if min_forecast_temp <= 2.0:
        frost_score = 95
        frost_level = "Severe Frost Warning (Ice Formation Expected)"
        frost_status = "CRITICAL"
    elif min_forecast_temp <= thresholds["frost_temp_limit"]:
        frost_score = 70
        frost_level = "Chilling Stress Alert (Plant Growth Stunted)"
        frost_status = "WARNING"
    elif min_forecast_temp <= 12.0:
        frost_score = 30
        frost_level = "Mild Nighttime Chill"
        frost_status = "MONITOR"
    else:
        frost_score = 5
        frost_level = "No Frost Risk"
        frost_status = "SAFE"

    # 3. Compute Heatwave Stress (0 - 100)
    max_forecast_temp = max([d.get("temp_max", curr_temp) for d in forecast]) if forecast else curr_temp
    heatwave_score = min(100, round(max(0, (max_forecast_temp - thresholds["heat_stress_temp"] + 5) * 10)))

    # 4. Generate 7-Day Timeline Risk Profile
    timeline = []
    for day in forecast:
        d_temp = day.get("temp_max", 28)
        d_min = day.get("temp_min", 20)
        d_hum = day.get("humidity_avg", 65)
        d_precip = day.get("precip_max", 0)

        day_drought = min(100, round(max(0, (d_temp - 25) * 3 + (65 - d_hum) * 1.5 - d_precip * 0.8)))
        day_frost = 90 if d_min <= 2 else (65 if d_min <= thresholds["frost_temp_limit"] else 5)

        timeline.append({
            "day": day.get("day", "N/A"),
            "temp_max": d_temp,
            "temp_min": d_min,
            "humidity": d_hum,
            "drought_risk": day_drought,
            "frost_risk": day_frost,
        })

    # 5. Protective Mitigation Measures
    mitigations = []
    if drought_score >= 45:
        mitigations.append({
            "title": "Apply Organic Straw / Leaves Mulch",
            "desc": "Layer 3-4 inches of organic straw around root zones to cut soil evaporation by up to 45%.",
            "urgency": "High",
            "category": "Moisture Conservation"
        })
        mitigations.append({
            "title": "Schedule Pulse Drip Irrigation",
            "desc": "Irrigate during late evening (8 PM - 10 PM) to maximize soil absorption and prevent evaporative loss.",
            "urgency": "High",
            "category": "Irrigation"
        })
        mitigations.append({
            "title": "Apply Anti-Transpirant Foliar Spray",
            "desc": "Foliar spray of 1% Kaolin clay or potassium silicate creates a reflective barrier against leaf sunburn.",
            "urgency": "Medium",
            "category": "Foliar Protection"
        })

    if frost_score >= 30:
        mitigations.append({
            "title": "Evening Micro-Sprinkling / Irrigation",
            "desc": "Light evening irrigation releases latent heat of fusion into soil, warming the microclimate by 1-2°C.",
            "urgency": "Critical" if frost_score >= 70 else "High",
            "category": "Frost Protection"
        })
        mitigations.append({
            "title": "Deploy Thermal Agro-Textile Shade Nets",
            "desc": "Cover delicate canopy overnight to trap ground heat radiation.",
            "urgency": "High",
            "category": "Canopy Protection"
        })

    if not mitigations:
        mitigations.append({
            "title": "Optimal Microclimate Conditions",
            "desc": "Current temperature and moisture levels are within optimal range for this crop.",
            "urgency": "Normal",
            "category": "Maintenance"
        })

    return {
        "location": location,
        "crop": crop.capitalize(),
        "current_conditions": {
            "temperature": curr_temp,
            "humidity": curr_humidity,
            "wind_speed": wind_speed,
            "soil_type": soil.get("type", "Loam"),
            "soil_moisture": soil.get("moisture_status", "Optimal")
        },
        "drought_radar": {
            "score": drought_score,
            "level": drought_level,
            "status": drought_status
        },
        "frost_radar": {
            "score": frost_score,
            "level": frost_level,
            "status": frost_status,
            "min_forecast_temp": min_forecast_temp
        },
        "heatwave_radar": {
            "score": heatwave_score,
            "max_forecast_temp": max_forecast_temp
        },
        "timeline": timeline,
        "mitigations": mitigations
    }
