"""
Climate-Resilient Crop Diversification Engine for LeafSense.

Recommends heat/drought hardy alternative crops when climate telemetry
shows thermal stress, water deficit, or heavy pathogen risk.
"""

DIVERSIFICATION_DATABASE = {
    "cotton": [
        {
            "crop": "Sorghum (Jowar / Great Millet)",
            "type": "C4 Climate Resilient Cereal",
            "water_savings_pct": 72,
            "heat_tolerance_c": "Up to 44°C",
            "yield_potential": "High (3.8 Tons/ha)",
            "climate_benefit": "Deep fibrous root system sequesters SOC while consuming 72% less water than cotton under heat stress."
        },
        {
            "crop": "Pigeon Pea (Tur / Arhar)",
            "type": "Leguminous Nitrogen Fixer",
            "water_savings_pct": 65,
            "heat_tolerance_c": "Up to 42°C",
            "yield_potential": "High (2.4 Tons/ha)",
            "climate_benefit": "Fixes 40-90 kg N/ha naturally, eliminating chemical N2O emissions while thriving in drought-prone Vertisol clay."
        },
        {
            "crop": "Pearl Millet (Bajra)",
            "type": "Arid Drought-Resistant Cereal",
            "water_savings_pct": 80,
            "heat_tolerance_c": "Up to 46°C",
            "yield_potential": "Medium-High (3.2 Tons/ha)",
            "climate_benefit": "Zero vulnerability to bacterial blight with extreme heat tolerance in dry sandy-clay soils."
        }
    ],
    "apple": [
        {
            "crop": "Pomegranate (Bhagwa Variety)",
            "type": "Arid Sub-Tropical Fruit",
            "water_savings_pct": 55,
            "heat_tolerance_c": "Up to 43°C",
            "yield_potential": "Very High (18 Tons/ha)",
            "climate_benefit": "Does not require low chilling hours; highly resilient against warming sub-Himalayan temperatures."
        },
        {
            "crop": "Dragon Fruit (Pitaya)",
            "type": "Xerophytic Drought Fruit",
            "water_savings_pct": 85,
            "heat_tolerance_c": "Up to 45°C",
            "yield_potential": "High (15 Tons/ha)",
            "climate_benefit": "CAM photosynthesis mechanism requires minimal irrigation, thriving in degraded soils."
        }
    ],
    "default": [
        {
            "crop": "Finger Millet (Ragi / Nachni)",
            "type": "Nutri-Cereal Superfood",
            "water_savings_pct": 70,
            "heat_tolerance_c": "Up to 42°C",
            "yield_potential": "High (3.5 Tons/ha)",
            "climate_benefit": "Thrives in shallow acidic/alkaline soils with zero synthetic pesticide dependence."
        },
        {
            "crop": "Chickpea (Desi Chana)",
            "type": "Drought-Hardy Legume",
            "water_savings_pct": 68,
            "heat_tolerance_c": "Up to 40°C",
            "yield_potential": "High (2.8 Tons/ha)",
            "climate_benefit": "Restores soil fertility naturally through symbiotic nitrogen fixation."
        },
        {
            "crop": "Sesame (Til)",
            "type": "Oilseed Climate Champion",
            "water_savings_pct": 75,
            "heat_tolerance_c": "Up to 45°C",
            "yield_potential": "Medium (1.2 Tons/ha)",
            "climate_benefit": "High oil content yield with minimal moisture intake and excellent drought recovery."
        }
    ]
}


def recommend_climate_resilient_crops(current_crop="Cotton", temp=28.5, humidity=68, disease="Condition"):
    """
    Returns climate-hardy alternative crop recommendations for farmer diversification.
    """
    key = (current_crop or "default").lower()
    alternatives = DIVERSIFICATION_DATABASE.get(key, DIVERSIFICATION_DATABASE["default"])

    # Determine climate stress trigger
    if temp >= 34.0 or humidity < 40:
        stress_level = "High Thermal & Moisture Deficit Stress"
        recommendation_reason = f"Current temperature ({temp}°C) indicates severe evapotranspiration loss. Diversifying into C4 millets or legumes safeguards farm revenue."
    elif humidity >= 80:
        stress_level = "High Pathogen Humidity Saturation Stress"
        recommendation_reason = f"High humidity ({humidity}%) accelerates foliar disease spread. Inter-cropping or shifting to fungal-resistant cereals breaks disease cycles."
    else:
        stress_level = "Moderate Climate Adaptation Recommended"
        recommendation_reason = f"Incorporating climate-hardy cover crops increases soil organic carbon (SOC) and improves field drought resilience."

    return {
        "current_crop": current_crop,
        "stress_level": stress_level,
        "recommendation_reason": recommendation_reason,
        "alternative_crops": alternatives
    }
