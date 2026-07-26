"""
Plant AI Vision - Smart N-P-K Fertilizer & Soil Nutrient Recommender
Calculates exact Nitrogen (N), Phosphorus (P), Potassium (K) ratios,
organic compost formulas, and chemical dosages based on leaf symptoms and soil type.
Supports Apple, Cotton, and Hibiscus datasets.
"""

class FertilizerRecommenderService:
    """Nutrient & Fertilizer Calculation Engine."""

    @staticmethod
    def calculate_npk_recommendation(disease_name, soil_info):
        """
        Calculate customized N-P-K nutrient breakdown and fertilizer advice.
        """
        soil_type = soil_info.get("soil_type", "Loamy Soil") if soil_info else "Loamy Soil"
        dis_lower = disease_name.lower()

        # Default Balanced
        npk_ratio = "10 - 10 - 10 (Balanced)"
        nitrogen_advice = "Normal Nitrogen (N) maintenance."
        phosphorus_advice = "Normal Phosphorus (P) for root development."
        potassium_advice = "Normal Potassium (K) for disease immunity."
        organic_formula = "Apply 2kg Vermicompost per plant every 30 days."
        chemical_dosage = "Apply 50g N-P-K 19-19-19 water soluble spray per acre."
        schedule = "Apply every 2-3 weeks during active growth season."

        # Apple specific N-P-K & Micronutrient advice
        if "apple" in dis_lower or "scab" in dis_lower or "rust" in dis_lower:
            if "scab" in dis_lower or "rot" in dis_lower:
                npk_ratio = "12 - 15 - 20 + Calcium & Boron"
                nitrogen_advice = "Controlled Nitrogen (N) to avoid tender leaf surge."
                phosphorus_advice = "High Phosphorus (P) for bud spur vigor."
                potassium_advice = "High Potassium (K) + Calcium Nitrate (15.5-0-0 + 18.8% Ca) for leaf cell wall strength."
                organic_formula = "Bone Meal (200g/tree) + Aged Farmyard Manure (5kg) + Seaweed extract."
                chemical_dosage = "Foliar Calcium Nitrate (5g/L) + Solubor Boron (1g/L) at petal fall stage."
                schedule = "Apply at 14-day intervals from green tip to pink bud stage."
            elif "rust" in dis_lower:
                npk_ratio = "10 - 20 - 20 (High Potassium & Phosphorus)"
                nitrogen_advice = "Low Nitrogen to prevent rust spore proliferation."
                phosphorus_advice = "Enhanced Phosphorus for mycorrhizal root colonization."
                potassium_advice = "High Potassium (K) to improve stomatal closure during spore humidity spikes."
                organic_formula = "Wood Ash (100g) + Compost Tea foliar drench."
                chemical_dosage = "Potassium Sulfate (K2SO4 0-0-50) 3g/L spray."
                schedule = "Apply weekly during peak spring rust spore releases."

        # Fungal / Necrotic spot infection
        elif "fungal" in dis_lower or "spot" in dis_lower or "blight" in dis_lower or "rot" in dis_lower:
            npk_ratio = "5 - 10 - 20 (High Potassium Defense)"
            nitrogen_advice = "Reduce synthetic Nitrogen (N) to prevent soft, succulent tissue vulnerable to fungal hyphae."
            phosphorus_advice = "Moderate Phosphorus (P) to strengthen secondary root branching."
            potassium_advice = "Increase Potassium (K) & Sulphur to thicken leaf epidermal cells."
            organic_formula = "Mix Neem Cake Powder (100g) + Wood Ash (50g) + Bio-potash into root zone."
            chemical_dosage = "Muriate of Potash (MOP) 2g/L water foliar spray + Potassium Nitrate (13-0-45)."
            schedule = "Apply bi-weekly until new healthy leaf flushes appear."

        # Yellowing / Senescent / Chlorosis
        elif "senescent" in dis_lower or "yellow" in dis_lower or "chlorosis" in dis_lower:
            npk_ratio = "20 - 10 - 10 (High Nitrogen Chlorophyll Boost)"
            nitrogen_advice = "Increase Nitrogen (N) and Iron chelates to restore lost chlorophyll synthesis."
            phosphorus_advice = "Standard Phosphorus (P) maintenance."
            potassium_advice = "Standard Potassium (K) maintenance."
            organic_formula = "Well-rotted Cow Dung manure / Mustard Cake liquid tea (10% solution)."
            chemical_dosage = "Urea (46% N) 5g/L water foliar spray + Magnesium Sulphate (Epsom salt) 2g/L."
            schedule = "Apply weekly for 3 consecutive weeks."

        # Distorted / Wrinkled / Pest vector
        elif "wrinkled" in dis_lower or "curl" in dis_lower or "edge" in dis_lower:
            npk_ratio = "10 - 15 - 15 + Micronutrients (Zn, B, Fe)"
            nitrogen_advice = "Balanced Nitrogen to support steady recovery."
            phosphorus_advice = "Enhanced Phosphorus (P) for vascular recovery."
            potassium_advice = "High Potassium (K) for stomatal regulation."
            organic_formula = "Enriched Compost + Seaweed Kelp extract spray (2ml/L)."
            chemical_dosage = "Chelated Zinc (12% Zn) 1g/L + Boron (20% B) 0.5g/L spray."
            schedule = "Apply foliar spray early morning every 10 days."

        # Healthy
        elif "healthy" in dis_lower:
            npk_ratio = "10 - 10 - 10 (Optimal Maintenance)"
            nitrogen_advice = "Maintain balanced Nitrogen for steady foliage expansion."
            organic_formula = "Apply 1-2 kg organic Vermicompost + Bone Meal once per month."
            chemical_dosage = "N-P-K 19-19-19 balanced spray (1g/L) monthly."
            schedule = "Apply monthly during growing season."

        # Soil specific adjustments
        if "Black Cotton" in soil_type or "Clay" in soil_type:
            soil_tip = "Clay soil retains nutrients well but requires aeration. Avoid heavy irrigation right after fertilizing."
        elif "Sandy" in soil_type:
            soil_tip = "Sandy soil leaches nutrients rapidly. Apply smaller fertilizer doses more frequently."
        else:
            soil_tip = "Loamy soil provides excellent nutrient uptake efficiency for fruit and crop foliage."

        return {
            "target_npk_ratio": npk_ratio,
            "nitrogen_advice": nitrogen_advice,
            "phosphorus_advice": phosphorus_advice,
            "potassium_advice": potassium_advice,
            "organic_formula": organic_formula,
            "chemical_dosage": chemical_dosage,
            "application_schedule": schedule,
            "soil_tip": soil_tip
        }
