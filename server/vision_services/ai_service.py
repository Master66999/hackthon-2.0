"""
AI Intelligence & Q&A Service for LeafSense.

Provides multimodal visual diagnostic correction and agronomic advice using Google Gemini 1.5 Flash
or OpenAI GPT-4o Vision API (with a robust rule-based fallback).
Also provides an agronomic Q&A Chatbot helper.
"""

import os
import json
import base64

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


def generate_llm_expert_analysis(image_b64, crop, ml_disease, confidence, weather_info, user_api_key=None, provider="auto"):
    """
    Sends the leaf image & diagnosis details to OpenAI or Gemini for multimodal verification
    or falls back to a rule-based expert summary.
    """
    api_key = user_api_key or os.environ.get("OPENAI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    
    if api_key:
        is_openai_key = api_key.startswith("sk-")
        use_openai = OPENAI_AVAILABLE and (provider == "openai" or is_openai_key or not GEMINI_AVAILABLE)
        
        try:
            prompt_text = f"""
            You are LeafSense's Climate & Agronomic AI Specialist.
            Analyze this leaf image.
            The computer vision model predicted:
            - Crop: {crop}
            - Detected Pathological Category: {ml_disease}
            - ML Confidence: {confidence}%
            - Field Weather: {weather_info.get('temperature')}°C, Humidity: {weather_info.get('humidity')}%, Location: {weather_info.get('location')}
            
            Task:
            1. Verify or correct crop type and disease identification with a focus on climate stress adaptation.
            2. Provide a concise 2-sentence expert agronomic and climate resiliency summary.
            3. Recommend 2 organic/sustainable control methods and 2 targeted chemical control methods.
            4. Return valid JSON only with keys: "verified_crop", "verified_disease", "expert_quote", "organic_controls", "chemical_controls".
            """
            
            if use_openai:
                client = openai.OpenAI(api_key=api_key)
                pure_b64 = image_b64.split(",")[-1] if "," in image_b64 else image_b64
                res = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[{
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt_text},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{pure_b64}"}}
                        ]
                    }],
                    max_tokens=400,
                    response_format={"type": "json_object"}
                )
                parsed = json.loads(res.choices[0].message.content)
                return {
                    "verified_crop": parsed.get("verified_crop", crop),
                    "verified_disease": parsed.get("verified_disease", ml_disease),
                    "expert_quote": parsed.get("expert_quote", f"Field scan confirms {ml_disease} on {crop} leaf under {weather_info.get('humidity')}% relative humidity."),
                    "organic_controls": parsed.get("organic_controls", ["Neem Oil Spray 5ml/L", "Bio-fungicide Trichoderma viride"]),
                    "chemical_controls": parsed.get("chemical_controls", ["Copper Oxychloride 50 WP", "Mancozeb 75 WP"]),
                    "llm_used": "OpenAI GPT-4o-mini (Climate Vision AI)"
                }
            elif GEMINI_AVAILABLE:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                pure_b64 = image_b64.split(",")[-1] if "," in image_b64 else image_b64
                img_data = base64.b64decode(pure_b64)
                
                response = model.generate_content([
                    prompt_text,
                    {"mime_type": "image/jpeg", "data": img_data}
                ])
                text = response.text
                if "{" in text and "}" in text:
                    json_str = text[text.find("{"):text.rfind("}")+1]
                    parsed = json.loads(json_str)
                    return {
                        "verified_crop": parsed.get("verified_crop", crop),
                        "verified_disease": parsed.get("verified_disease", ml_disease),
                        "expert_quote": parsed.get("expert_quote", f"Multimodal vision scan confirms {ml_disease}."),
                        "organic_controls": parsed.get("organic_controls", ["Neem Oil 5ml/L", "Sour Buttermilk 10%"]),
                        "chemical_controls": parsed.get("chemical_controls", ["Copper Oxychloride 3g/L", "Propiconazole 1ml/L"]),
                        "llm_used": "Google Gemini 1.5 Flash"
                    }
        except Exception as e:
            print(f"[LeafSense AI] LLM Vision API Exception: {e}")

    # Fallback Rule-Based Expert Summary
    if "healthy" in ml_disease.lower():
        quote = f"The {crop} leaf demonstrates prime physiological health with vibrant chlorophyll distribution and no active pathogen lesions."
        organic = ["Maintain regular bio-compost top-dressing", "Foliar spray with Panchagavya 3%"]
        chemical = ["No chemical intervention required", "Optional micronutrient prophylactic spray"]
    elif "blight" in ml_disease.lower():
        quote = f"Active lesion propagation identified on {crop} tissue. Elevated humidity ({weather_info.get('humidity', 68)}%) accelerates spore germination."
        organic = ["Apply Fermented Sour Buttermilk (10% solution)", "Spray Neem Seed Kernel Extract (NSKE 5%)"]
        chemical = ["Copper Oxychloride 50% WP @ 3g/L water", "Streptocycline 6g per 60 liters water"]
    elif "scab" in ml_disease.lower() or "rot" in ml_disease.lower():
        quote = f"Fungal infection detected on {crop} surface. Immediate canopy thinning and protective copper sprays recommended."
        organic = ["Apply Horsetail herb decoction", "Prune lower infected leaves and burn"]
        chemical = ["Mancozeb 75% WP @ 2.5g/L water", "Tebuconazole 25.9% EC @ 1ml/L"]
    else:
        quote = f"{ml_disease} symptoms detected on {crop} foliage. Immediate remedial action is recommended to protect yield."
        organic = ["Neem Oil 5ml/L + Potassium soap emulsifier", "Bio-control Trichoderma viride 5g/L"]
        chemical = ["Carbendazim 50% WP @ 1g/L", "Chlorothalonil 75% WP @ 2g/L"]

    return {
        "verified_crop": crop,
        "verified_disease": ml_disease,
        "expert_quote": quote,
        "organic_controls": organic,
        "chemical_controls": chemical,
        "llm_used": "Rule-Based Agronomic Intelligence Engine"
    }


def answer_agronomic_chat_question(user_question, context_data=None, user_api_key=None):
    """
    Answers user agronomic and climate questions using OpenAI, Gemini, or intelligent fallback.
    """
    if context_data is None:
        context_data = {}
    
    crop = context_data.get("crop", "Crop")
    disease = context_data.get("disease", "Condition")
    
    api_key = user_api_key or os.environ.get("OPENAI_API_KEY") or os.environ.get("GEMINI_API_KEY")
    
    if api_key:
        is_openai_key = api_key.startswith("sk-")
        
        # 1. Try OpenAI GPT-4o-mini if key is OpenAI key or OPENAI_AVAILABLE
        if OPENAI_AVAILABLE and (is_openai_key or not GEMINI_AVAILABLE):
            try:
                client = openai.OpenAI(api_key=api_key)
                system_prompt = (
                    "You are LeafSense Climate & Agronomic AI Specialist. "
                    "Provide expert, practical advice for farmers on plant diseases, sustainable organic remedies, "
                    "climate-resilient crop selection, carbon footprint management, precision drip irrigation, "
                    "and micro-climate risk mitigation. Keep responses concise, clear, and actionable (2 to 4 sentences)."
                )
                user_msg = (
                    f"Context: Target Crop = '{crop}', Diagnostic Condition = '{disease}'.\n"
                    f"Farmer/User Question: \"{user_question}\""
                )
                res = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg}
                    ],
                    max_tokens=300,
                    temperature=0.7
                )
                answer = res.choices[0].message.content.strip()
                if answer:
                    return answer
            except Exception as e:
                print(f"[LeafSense Chat API] OpenAI Exception: {e}")

        # 2. Try Gemini 1.5 Flash if Gemini available
        if GEMINI_AVAILABLE and not is_openai_key:
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                prompt = f"""
                You are LeafSense Climate & Agronomic AI Assistant.
                Context: Farmer is asking about {crop} showing condition '{disease}'.
                User Question: "{user_question}"
                Provide a helpful, concise, 3-sentence action-oriented response covering climate resilience, organic treatment, or irrigation advice.
                """
                res = model.generate_content(prompt)
                if res.text:
                    return res.text.strip()
            except Exception as e:
                print(f"[LeafSense Chat API] Gemini Exception: {e}")

    # 3. Fallback Smart Rule-Based Chat Responses
    q_low = user_question.lower()
    if "water" in q_low or "irrigate" in q_low or "drip" in q_low:
        return f"For {crop} management under current weather conditions, avoid overhead sprinkler watering to prevent moisture-borne spore spread. Implement base drip irrigation early in the morning for optimal moisture efficiency."
    elif "climate" in q_low or "heat" in q_low or "weather" in q_low or "temperature" in q_low:
        return f"Climate stress like high heat and relative humidity increases pathogen incubation for {disease}. Shading net coverings, mulching, and potassium-enriched bio-fertilizers strengthen plant cell stress resilience."
    elif "carbon" in q_low or "emission" in q_low or "organic" in q_low:
        return f"Replacing synthetic nitrogen fertilizers with organic bio-compost and Neem oil reduces soil nitrous oxide emissions and cuts farm carbon footprint by up to 35% while suppressing {disease} spores."
    elif "spray" in q_low or "when" in q_low or "apply" in q_low:
        return f"Spray bio-fungicides like Trichoderma or organic Neem oil early before 9 AM or after 4 PM. Avoid middle-of-the-day application under harsh sunlight to prevent leaf scorch."
    elif "fertilizer" in q_low or "npk" in q_low or "nutrient" in q_low:
        return f"Apply a balanced N-P-K ratio with enhanced Potassium (K) to bolster leaf epidermal density against {disease}. Limit excess raw Nitrogen to curb vulnerable soft growth."
    else:
        return f"To protect your {crop} against {disease}, isolate affected foliage, maintain canopy ventilation, ensure clean field drainage, and follow the personalized organic & carbon-smart treatment schedule."
