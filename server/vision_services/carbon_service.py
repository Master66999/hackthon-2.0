"""
Carbon Footprint Intelligence Service for LeafSense.

Computes CO2-equivalent emissions (kg per hectare) for chemical vs. organic
treatment paths and returns a carbon savings percentage.

Data sourced from:
  - FAO Agri-Environmental Indicators (2021)
  - LCA studies on pesticide production (Audsley et al., 2009)
  - IPCC Agriculture Chapter 5 fertilizer emission factors

Rough CO2e values per application per hectare:
  - Copper Oxychloride 50 WP  : ~4.2 kg CO2e/ha
  - Mancozeb 75 WP            : ~6.1 kg CO2e/ha
  - Carbendazim 50 WP         : ~5.4 kg CO2e/ha
  - Imidacloprid 17.8 SL      : ~8.3 kg CO2e/ha
  - Streptocycline            : ~3.8 kg CO2e/ha
  - Thiamethoxam 25 WG        : ~7.5 kg CO2e/ha
  - Chlorothalonil            : ~5.9 kg CO2e/ha
  - Difenoconazole            : ~4.7 kg CO2e/ha
  - Neem Oil Spray            : ~0.3 kg CO2e/ha
  - Bio-fungicide Trichoderma : ~0.1 kg CO2e/ha
  - Biochar soil amendment    : ~-2.0 kg CO2e/ha  (carbon sink!)
"""

CHEMICAL_CARBON_DB = {
    "copper oxychloride":      4.2,
    "mancozeb":                6.1,
    "carbendazim":             5.4,
    "imidacloprid":            8.3,
    "streptocycline":          3.8,
    "thiamethoxam":            7.5,
    "chlorothalonil":          5.9,
    "difenoconazole":          4.7,
    "propiconazole":           4.4,
    "acetamiprid":             6.8,
    "potassium nitrate":       2.1,
    "mono ammonium phosphate": 3.5,
    "captan":                  4.9,
    "myclobutanil":            4.3,
    "sulfur":                  1.1,
    "default_chemical":        5.0,
}

ORGANIC_CARBON_DB = {
    "neem oil":          0.30,
    "trichoderma":       0.10,
    "pseudomonas":       0.08,
    "biochar":          -2.00,
    "compost":           0.05,
    "wood ash":          0.05,
    "bacillus subtilis": 0.09,
    "vermicompost":      0.06,
    "garlic":            0.04,
    "horsetail":         0.03,
    "baking soda":       0.15,
    "copper hydroxide":  3.10,
    "copper octanoate":  2.80,
    "lime sulfur":       1.20,
    "seaweed extract":   0.07,
    "default_organic":   0.40,
}


def _match_carbon(text, db):
    """Fuzzy-match a treatment string against a carbon database."""
    text_lower = text.lower()
    matched_total = 0.0
    matched = False
    for key, val in db.items():
        if key in text_lower:
            matched_total += val
            matched = True
    if not matched:
        matched_total = db.get("default_chemical", db.get("default_organic", 0.4))
    return matched_total


def calculate_carbon_score(chemical_controls, organic_controls):
    """
    Calculates CO2-equivalent kg/ha for chemical vs organic treatment paths.

    Returns dict with chemical_co2, organic_co2, savings_kg, savings_percent,
    rating, biochar_bonus, and summary string for the UI.
    """
    chem_total = (
        sum(_match_carbon(t, CHEMICAL_CARBON_DB) for t in chemical_controls)
        if chemical_controls
        else CHEMICAL_CARBON_DB["default_chemical"]
    )
    org_total = (
        sum(_match_carbon(t, ORGANIC_CARBON_DB) for t in organic_controls)
        if organic_controls
        else ORGANIC_CARBON_DB["default_organic"]
    )

    savings_kg  = round(chem_total - org_total, 2)
    savings_pct = round((savings_kg / max(chem_total, 0.01)) * 100, 1)
    savings_pct = max(-999, min(100, savings_pct))

    biochar_bonus = any("biochar" in t.lower() for t in (organic_controls or []))

    if savings_pct >= 85:
        rating = "Excellent"
    elif savings_pct >= 60:
        rating = "Good"
    elif savings_pct >= 30:
        rating = "Moderate"
    else:
        rating = "Minimal"

    if biochar_bonus:
        summary = (
            f"Organic path sequesters carbon via biochar — saving {savings_kg:.1f} kg CO2e/ha "
            f"vs chemical treatment."
        )
    elif savings_pct > 0:
        summary = (
            f"Organic path reduces your carbon footprint by {savings_pct}% "
            f"({savings_kg:.1f} kg CO2e/ha less than chemicals)."
        )
    else:
        summary = (
            "Copper-based organic controls have a moderate footprint. "
            "Consider adding biochar soil amendments."
        )

    return {
        "chemical_co2":    round(chem_total, 2),
        "organic_co2":     round(org_total,  2),
        "savings_kg":      savings_kg,
        "savings_percent": savings_pct,
        "rating":          rating,
        "biochar_bonus":   biochar_bonus,
        "summary":         summary,
    }
