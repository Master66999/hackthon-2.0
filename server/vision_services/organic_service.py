"""
Eco-Friendly Remedies & Companion Planting Preparer for LeafSense.
"""

def get_organic_remedies(disease):
    """Returns bio-pesticide recipes and companion planting guidelines."""
    d_lower = disease.lower()
    
    if "healthy" in d_lower:
        return {
            "biopesticide": "Preventive Neem Oil Emulsion (5ml/L + 1ml liquid soap)",
            "recipe": "Mix 50ml Cold-pressed Neem Oil with 10L water. Spray bi-weekly to deter pests.",
            "companion_plants": "Marigold & Basil (Repels thrips, aphids, and whiteflies)",
            "soil_amendment": "Vermicompost 200g/plant + Trichoderma viride bio-fungicide"
        }
        
    if "blight" in d_lower or "bacterial" in d_lower:
        return {
            "biopesticide": "Fermented Sour Buttermilk (Khasti Chaas) Spray 10%",
            "recipe": "Ferment 1L sour curd in a copper vessel for 10 days. Dilute with 10L water and spray.",
            "companion_plants": "Garlic & Allium species (Natural anti-bacterial exudates)",
            "soil_amendment": "Pseudomonas fluorescens 10g/kg soil"
        }

    if "fungal" in d_lower or "scab" in d_lower or "rust" in d_lower:
        return {
            "biopesticide": "Neem Seed Kernel Extract (NSKE 5%) + Baking Soda",
            "recipe": "Soak 500g crushed neem seeds in 10L water overnight. Strain, add 5g baking soda.",
            "companion_plants": "Chives & Mint (Inhibits fungal spore germination)",
            "soil_amendment": "Wood Ash + Biochar for silica strengthening"
        }

    return {
        "biopesticide": "Horsetail Decoction & Milk Whey Spray (1:9 ratio)",
        "recipe": "Boil 100g dried horsetail in 1L water for 30 mins. Dilute 1L decoction in 9L fresh milk whey.",
        "companion_plants": "Nasturtiums & Coriander",
        "soil_amendment": "Compost Tea + Panchagavya 3%"
    }
