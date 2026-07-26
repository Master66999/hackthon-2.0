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


def generate_llm_expert_analysis(image_b64, crop, ml_disease, confidence, weather_info, user_api_key=None, provider="gemini"):
    """
    Sends the leaf image & diagnosis details to Gemini / OpenAI for multimodal verification
    or falls back to a rule-based expert summary.
    """
    api_key = user_api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")
    
    if api_key and (GEMINI_AVAILABLE or OPENAI_AVAILABLE):
        try:
            prompt_text = f"""
            You are an expert plant pathologist and agronomist for LeafSense.
            Analyze this leaf image.
            The computer vision model predicted:
            - Crop: {crop}
            - Detected Pathological Category: {ml_disease}
            - ML Confidence: {confidence}%
            - Field Weather: {weather_info.get('temperature')}°C, Humidity: {weather_info.get('humidity')}%, Location: {weather_info.get('location')}
            
            Task:
            1. Verify or correct the crop type and disease identification.
            2. Provide a 2-sentence expert agronomic summary.
            3. Recommend 2 organic control methods and 2 chemical control methods.
            4. Return valid JSON only with keys: "verified_crop", "verified_disease", "expert_quote", "organic_controls", "chemical_controls".
            """
            
            if provider == "openai" or (not GEMINI_AVAILABLE and OPENAI_AVAILABLE):
                client = openai.OpenAI(api_key=api_key)
                # Clean base64 string
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
                    max_tokens=350,
                    response_format={"type": "json_object"}
                )
                parsed = json.loads(res.choices[0].message.content)
                return {
                    "verified_crop": parsed.get("verified_crop", crop),
                    "verified_disease": parsed.get("verified_disease", ml_disease),
                    "expert_quote": parsed.get("expert_quote", f"Field analysis confirms {ml_disease} on {crop} leaf under {weather_info.get('humidity')}% relative humidity."),
                    "organic_controls": parsed.get("organic_controls", ["Neem Oil Spray", "Bio-fungicide Trichoderma"]),
                    "chemical_controls": parsed.get("chemical_controls", ["Copper Oxychloride 50 WP", "Mancozeb 75 WP"]),
                    "llm_used": "OpenAI GPT-4o"
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
            print(f"LLM Vision API Notice: {e}")

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


def answer_agronomic_chat_question(user_question, context_data, user_api_key=None):
    """
    Answers user follow-up questions using Gemini/OpenAI or intelligent fallback.
    """
    crop = context_data.get("crop", "Crop")
    disease = context_data.get("disease", "Condition")
    
    api_key = user_api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")
    
    if api_key and GEMINI_AVAILABLE:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            You are LeafSense Agronomic Assistant.
            Context: Farmer is diagnosing a {crop} plant showing '{disease}'.
            User Question: "{user_question}"
            Provide a helpful, concise, 3-sentence action-oriented response.
            """
            res = model.generate_content(prompt)
            return res.text.strip()
        except Exception as e:
            print(f"Chat API error: {e}")

    # Fallback Chat Responses
    q_low = user_question.lower()
    if "water" in q_low or "irrigate" in q_low:
        return f"For {crop} affected by {disease}, avoid overhead sprinkler watering as surface moisture spreads spores. Drip irrigation at the base early in the morning is highly recommended."
    elif "spray" in q_low or "when" in q_low:
        return f"Spray organic or chemical remedies early in the morning before 9 AM or after 4 PM when temperatures cool down. Ensure thorough coverage on both upper and lower leaf surfaces."
    elif "fertilizer" in q_low or "npk" in q_low:
        return f"Increase Potassium (K) application to strengthen leaf cell walls against {disease}. Reduce high-nitrogen fertilizers temporarily to prevent tender new growth vulnerable to infection."
    else:
        return f"To effectively manage {disease} on {crop}, isolate heavily infected leaves, ensure adequate field drainage, and follow the organic/chemical treatment schedule detailed in your diagnostics tab."
