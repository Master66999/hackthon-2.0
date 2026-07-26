"""
Agricultural Risk Radar Calculator for LeafSense.

Computes vulnerability scores (0-100) for SVG Diamond Risk Radar:
  - Fungal Blight Risk
  - Bacterial Spot Risk
  - Pest Vector Risk
  - Nutrient Deficit Risk
"""

def calculate_outbreak_risk(disease, humidity=68, temp=28.5):
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

    return {
        "fungal_blight": min(100, fungal),
        "bacterial_spot": min(100, bacterial),
        "pest_vector": min(100, pest),
        "nutrient_deficit": min(100, nutrient),
        "overall_risk_level": "High Risk" if max(fungal, bacterial, pest) > 70 else ("Moderate Risk" if max(fungal, bacterial, pest) > 40 else "Low Risk")
    }
