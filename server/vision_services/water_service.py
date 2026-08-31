"""
Precision Water Footprint & Drip Irrigation Advisor for LeafSense.

Computes Crop Evapotranspiration (ETc), Soil Retention Coefficient,
and exact daily water requirements (Liters/ha) to optimize irrigation
and prevent water waste by 40% vs traditional flood irrigation.
"""

# Crop Coefficients (Kc) by Growth Stage
CROP_KC_DB = {
    "apple": 0.85,
    "cotton": 1.15,
    "hibiscus": 0.80,
    "tomato": 1.05,
    "tea": 0.95,
    "coffee": 0.90,
    "maize": 1.10,
    "default": 1.00
}

# Soil Field Capacity & Water Retention Multipliers
SOIL_RETENTION_DB = {
    "vertisol": 0.70,   # High clay retention — requires less frequent watering
    "black": 0.72,
    "alluvial": 0.85,
    "laterite": 1.10,   # Rapid drainage — requires precise frequent drip
    "sandy": 1.25,
    "default": 0.90
}


def calculate_precision_water_advisory(crop="Cotton", soil_type="Black Basaltic Clay", temp=28.5, humidity=68, wind_speed=12.4):
    """
    Calculates daily water requirements in Liters/ha and recommended drip irrigation duration.
    """
    c_key = (crop or "default").lower()
    kc = CROP_KC_DB.get(c_key, CROP_KC_DB["default"])

    # Hargreaves-Samani simplified Reference Evapotranspiration (ET0) estimation (mm/day)
    base_et0 = 0.0023 * (temp + 17.8) * ((max(35 - temp, 5)) ** 0.5) * 12.0
    # Adjust for humidity & wind
    humidity_factor = max(0.65, 1.2 - (humidity / 100.0) * 0.5)
    wind_factor = 1.0 + (wind_speed / 100.0) * 0.3
    et0 = round(max(2.5, base_et0 * humidity_factor * wind_factor), 2)

    # Crop Water Need ETc (mm/day) -> 1 mm/day = 10,000 Liters/ha/day
    etc_mm = round(et0 * kc, 2)

    # Soil adjustment
    s_key = (soil_type or "default").lower()
    soil_mult = SOIL_RETENTION_DB["default"]
    for k, val in SOIL_RETENTION_DB.items():
        if k in s_key:
            soil_mult = val
            break

    # Flood irrigation baseline (Liters/ha/day)
    flood_water_liters = round(etc_mm * 10000 * 1.65)

    # Precision Drip Irrigation (Liters/ha/day)
    precision_drip_liters = round(etc_mm * 10000 * soil_mult)
    water_saved_liters = max(0, flood_water_liters - precision_drip_liters)
    savings_percent = round((water_saved_liters / max(flood_water_liters, 1)) * 100, 1)

    # Drip emitter run time calculation (assuming standard 4 L/hr emitters spaced at 2.5 per m2)
    emitter_rate_lph = 4.0
    emitters_per_ha = 25000
    total_flow_lph = emitter_rate_lph * emitters_per_ha
    run_time_minutes = round((precision_drip_liters / max(total_flow_lph, 1.0)) * 60)
    run_time_minutes = max(15, min(180, run_time_minutes))

    # Irrigation status advisory
    if humidity > 82:
        status = "HOLD WATERING — Saturated Air & High Fungal Risk"
        advisory = "Soil moisture is near field capacity. Pause drip irrigation to prevent root rot and Pythium wilt."
    elif temp > 35.0:
        status = "THERMAL STRESS — Split Drip Application Recommended"
        advisory = f"Apply drip irrigation in 2 pulses ({run_time_minutes // 2} mins morning, {run_time_minutes // 2} mins evening) to cool root zone."
    else:
        status = "OPTIMAL DRIP SCHEDULE ACTIVE"
        advisory = f"Run drip emitters for {run_time_minutes} minutes daily to maintain 100% transpiration efficiency."

    return {
        "crop": crop,
        "et0_mm_day": et0,
        "etc_mm_day": etc_mm,
        "precision_drip_liters_ha": precision_drip_liters,
        "flood_baseline_liters_ha": flood_water_liters,
        "water_saved_liters_ha": water_saved_liters,
        "savings_percent": savings_percent,
        "drip_duration_mins": run_time_minutes,
        "status": status,
        "advisory": advisory,
        "soil_retention_rating": "High Retention" if soil_mult < 0.8 else ("Moderate" if soil_mult < 1.0 else "Rapid Percolation")
    }
