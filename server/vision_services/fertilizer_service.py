"""
Fertilizer & Micronutrient Recommendation Builder for LeafSense.

Calculates Nitrogen (N), Phosphorus (P), and Potassium (K) requirement percentages
based on crop, disease severity, and soil moisture conditions.
"""

def calculate_fertilizer_npk(crop, disease, spot_ratio=0.0):
    """
    Returns N-P-K requirement percentages (0-100 gauge values)
    and custom dosage schedules.
    """
    disease_lower = disease.lower()
    
    if "healthy" in disease_lower:
        return {
            "n_ratio": 45,
            "p_ratio": 30,
            "k_ratio": 25,
            "formula": "Balanced Maintenance NPK 19-19-19",
            "dosage": "5g per liter every 14 days",
            "micronutrients": "Zinc EDTA 0.5g/L + Magnesium Sulphate 1g/L",
            "schedule": "Early Morning Foliar Spray"
        }
    
    if "blight" in disease_lower or "scab" in disease_lower or "rot" in disease_lower:
        # Fungal / Bacterial Blight requires higher Potassium for systemic defense
        n = max(20, 45 - int(spot_ratio * 3))
        p = 35
        k = min(85, 40 + int(spot_ratio * 4))
        return {
            "n_ratio": n,
            "p_ratio": p,
            "k_ratio": k,
            "formula": "Potassium-Rich Recovery Blend NPK 00-52-34",
            "dosage": "3g/L Copper Oxychloride + Potassium Nitrate 4g/L",
            "micronutrients": "Boron 0.2% + Chelated Iron 0.5g/L",
            "schedule": "Apply immediately; repeat in 7 days after leaf drying"
        }

    if "rust" in disease_lower or "citruspot" in disease_lower or "spot" in disease_lower:
        return {
            "n_ratio": 30,
            "p_ratio": 45,
            "k_ratio": 50,
            "formula": "Immunity Booster NPK 12-61-00 (MAP)",
            "dosage": "Mono Ammonium Phosphate 4g/L + Mancozeb 2.5g/L",
            "micronutrients": "Zinc Oxide 1g/L + Bio-Fulvic Acid",
            "schedule": "Foliar application twice weekly"
        }
        
    # Default for mild / senescent / damage
    return {
        "n_ratio": 35,
        "p_ratio": 35,
        "k_ratio": 40,
        "formula": "Organic Revitalization Mix 10-26-26",
        "dosage": "Neem Cake Extract 10g/L + Humic Acid 3ml/L",
        "micronutrients": "Seaweed Extract 2ml/L",
        "schedule": "Apply to root zone weekly"
    }
