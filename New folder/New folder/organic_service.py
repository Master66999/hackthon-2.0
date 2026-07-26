"""
Plant AI Vision - Eco-Friendly & Natural Prevention Service
Generates homemade organic remedies, step-by-step preparation guidelines,
and biological companion plant advice based on leaf pathology.
"""

class OrganicAdvisoryService:
    """Service generating organic pesticide/fungicide recipes and companion planting rules."""

    @staticmethod
    def get_natural_advisory(disease_name):
        dis_lower = disease_name.lower()

        # Default fallback
        remedy_name = "Cold-Pressed Neem Oil Spray"
        description = "Broad-spectrum organic insecticide and fungicide."
        recipe = "20ml Neem Oil + 2ml Liquid Soap + 1 Liter Water"
        steps = [
            "Mix cold-pressed Neem oil with organic liquid soap to emulsify.",
            "Pour into spray bottle and shake thoroughly.",
            "Spray directly on leaves early morning or late evening."
        ]
        companion = "Marigold (repels common sucking pests)."

        # Apple Diseases
        if "apple" in dis_lower or "scab" in dis_lower or "rust" in dis_lower:
            if "scab" in dis_lower or "rot" in dis_lower:
                remedy_name = "Equisetum (Horsetail) Foliar Decoction"
                description = "Silicon-rich herbal spray that strengthens plant cell walls against fungal hyphae."
                recipe = "100g Dried Horsetail Herb + 5 Liters Water"
                steps = [
                    "Boil dried Horsetail herb in water for 30-40 minutes.",
                    "Let it cool down and strain using a muslin cloth.",
                    "Dilute 1 part decoction with 5 parts water and spray buds weekly."
                ]
                companion = "Garlic or Chives (planting around tree base inhibits scab spores)."
            elif "rust" in dis_lower:
                remedy_name = "Baking Soda & Seaweed Extract Foliar Shield"
                description = "Changes leaf surface pH to inhibit rust spore germination."
                recipe = "5g Sodium Bicarbonate + 2ml Liquid Kelp + 1 Liter Water"
                steps = [
                    "Dissolve baking soda and liquid seaweed extract in lukewarm water.",
                    "Spray leaves thoroughly, ensuring coverage of lower surface.",
                    "Apply weekly during damp spring periods."
                ]
                companion = "Isolate Apple trees from Juniper bushes (rust host) by 50 meters."

        # Cotton Diseases
        elif "cotton" in dis_lower or "blight" in dis_lower or "wilt" in dis_lower:
            if "blight" in dis_lower:
                remedy_name = "Fermented Sour Buttermilk Spray"
                description = "Lactic acid bacteria act as bio-agents to suppress Xanthomonas bacteria."
                recipe = "1 Liter Sour Buttermilk + 10 Liters Water + 50g Turmeric"
                steps = [
                    "Ferment fresh buttermilk in a shaded plastic container for 4-5 days.",
                    "Add turmeric powder and dilute with 10 liters of clean water.",
                    "Spray infected crop canopy immediately at first sign of spots."
                ]
                companion = "Cowpea (acts as a cover crop and nitrogen fixer)."
            elif "curl" in dis_lower:
                remedy_name = "Neem Seed Kernel Extract (5% NSKE)"
                description = "Natural anti-feedant that disrupts whitefly reproduction cycle."
                recipe = "50g Neem Seed Powder + 1 Liter Water + 1ml Liquid Soap"
                steps = [
                    "Soak neem seed powder in water overnight (12 hours).",
                    "Filter the milky extract through clean cotton fabric.",
                    "Mix in liquid soap and spray on leaf undersides where whiteflies gather."
                ]
                companion = "Plant Maize or Sorghum as border crops to block vector migration."
            elif "wilt" in dis_lower:
                remedy_name = "Trichoderma Enriched Farmyard Compost"
                description = "Beneficial fungi that colonize roots and kill soil-borne Fusarium spores."
                recipe = "100g Trichoderma viride + 5kg Well-decomposed Manure"
                steps = [
                    "Mix Trichoderma powder thoroughly with moist organic manure.",
                    "Cover with broad leaves and keep in shade for 7 days to let spores multiply.",
                    "Apply around the root zone of wilt-susceptible plants during soil turning."
                ]
                companion = "Marigold or Mustard rotation (creates natural soil bio-fumigation)."

        # Hibiscus Diseases
        elif "hibiscus" in dis_lower or "fungal" in dis_lower or "spotting" in dis_lower:
            if "fungal" in dis_lower or "spot" in dis_lower:
                remedy_name = "Organic Baking Soda & Horticultural Emulsion"
                description = "Disrupts fungal spore walls and stops early leaf spot spreads."
                recipe = "1 Teaspoon Baking Soda + 1/2 Teaspoon Horticultural Oil + 1 Liter Water"
                steps = [
                    "Dissolve baking soda completely in water, then stir in the oil.",
                    "Spray leaves until run-off, targeting both top and bottom.",
                    "Avoid spraying in hot noon sunlight to prevent leaf burn."
                ]
                companion = "Garlic or Sweet Basil (natural airborne insect deterrent)."
            elif "wrinkled" in dis_lower or "edge" in dis_lower:
                remedy_name = "Chili-Garlic Insecticidal Soap"
                description = "Spicy deterrent spray that kills thrips, aphids, and mites on contact."
                recipe = "2 Garlic Bulbs + 4 Hot Chilies + 1 Liter Water + 5ml Soap"
                steps = [
                    "Blend garlic and hot chilies with water into a smooth paste.",
                    "Let it steep for 24 hours, then strain using a fine filter.",
                    "Mix with soap and spray infested growth zones every 5 days."
                ]
                companion = "Plant Dill or Fennel (attracts ladybugs which eat vector pests)."

        return {
            "remedy_name": remedy_name,
            "description": description,
            "recipe": recipe,
            "steps": steps,
            "companion_plant": companion
        }
