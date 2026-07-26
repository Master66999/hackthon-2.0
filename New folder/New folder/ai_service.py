"""
Plant AI Vision - AI Service Layer
Integrates Google Gemini / OpenAI API Key support to generate complete image intelligence,
incorporating live OpenWeather climate metrics and soil profile intelligence.
"""

import os
import json
import base64
import requests

class PlantAIService:
    """LLM Integration Service for Vision & Text Agronomic Intelligence."""

    @staticmethod
    def encode_image_base64(image_path):
        """Helper to convert image to base64 string."""
        with open(image_path, "rb") as img_file:
            return base64.b64encode(img_file.read()).decode("utf-8")

    @staticmethod
    def _clean_json_response(raw_text):
        """Clean markdown code fences from LLM text responses for reliable JSON parsing."""
        if not raw_text:
            return "{}"
        raw_text = raw_text.strip()
        first_brace = raw_text.find("{")
        last_brace = raw_text.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            return raw_text[first_brace:last_brace + 1].strip()
        return raw_text


    @classmethod
    def generate_image_intelligence(cls, image_path, cnn_results, context_params, weather_data=None, api_key=None, provider="gemini"):
        """
        Generate full AI intelligence report using Gemini API or OpenAI API key.
        Includes live OpenWeather environmental factors & inferred soil profile.
        """
        effective_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")
        
        if effective_key:
            if effective_key.startswith("sk-"):
                provider = "openai"
            elif effective_key.startswith("AIza") or len(effective_key) > 30:
                provider = "gemini"

        if effective_key and provider == "gemini":
            try:
                return cls._call_gemini_vision_api(image_path, cnn_results, context_params, weather_data, effective_key)
            except Exception as e:
                print(f"[AIService] Gemini API error: {e}. Falling back to rule engine.")

        if effective_key and provider == "openai":
            try:
                return cls._call_openai_vision_api(image_path, cnn_results, context_params, weather_data, effective_key)
            except Exception as e:
                print(f"[AIService] OpenAI API error: {e}. Falling back to rule engine.")

        return cls._generate_structured_fallback(cnn_results, context_params, weather_data)

    @classmethod
    def answer_followup_question(cls, question, image_path, previous_analysis, api_key=None):
        """Answer user's follow-up question regarding the analyzed image."""
        effective_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")
        
        if effective_key:
            if effective_key.startswith("sk-"):
                return cls._call_openai_qa(question, previous_analysis, effective_key)
            else:
                return cls._call_gemini_qa(question, previous_analysis, effective_key)

        return cls._generate_fallback_qa(question, previous_analysis)

    @classmethod
    def _call_gemini_vision_api(cls, image_path, cnn_results, context, weather, api_key):
        """Call Google Gemini 1.5 API with image, climate, and soil prompt."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        img_b64 = cls.encode_image_base64(image_path)
        
        crop = context.get("crop_type", "Plant/Leaf")
        loc_name = weather.get("location_name", context.get("location", "Standard Region")) if weather else context.get("location")
        temp = weather.get("temperature_c") if weather else "N/A"
        humidity = weather.get("humidity_pct") if weather else "N/A"
        condition = weather.get("description") if weather else "N/A"
        
        soil_type = weather.get("soil", {}).get("soil_type", "Loamy Soil") if weather else "Loamy Soil"
        soil_moisture = weather.get("soil", {}).get("moisture_status", "Moist") if weather else "Moist"

        prompt = f"""
You are an expert plant pathologist, agronomist, and soil scientist.
Analyze this plant leaf image alongside real-time live weather & soil data.

Trained PyTorch Model Output:
- Primary Prediction: {cnn_results.get('display_name')}
- Model Confidence: {cnn_results.get('confidence')}%
- Crop Category: {crop}

Live OpenWeather & Environmental Profile:
- Location: {loc_name}
- Temperature: {temp}°C | Ambient Humidity: {humidity}%
- Weather Condition: {condition}
- Soil Classification: {soil_type}
- Inferred Soil Moisture Status: {soil_moisture}

Provide a comprehensive json report with the following structure:
{{
  "ai_diagnosis": "Detailed visual pathology summary including observed symptoms and how the current weather/soil condition affects this specific disease",
  "pathogen_type": "Fungal / Bacterial / Viral / Environmental / Healthy",
  "severity_index": "Low / Medium / High / Critical",
  "organic_remedies": ["Step 1...", "Step 2...", "Step 3..."],
  "chemical_treatments": ["Chemical 1 with dosage...", "Chemical 2..."],
  "preventive_advisory": ["Watering advisory based on live weather...", "Soil amendment tip for {soil_type}...", "Sunlight/Humidity control..."],
  "climate_risk": "Assessment of current live weather ({temp}°C, {humidity}% humidity, {condition}) on disease spread",
  "yield_impact_risk": "High / Moderate / Minimal risk to harvest",
  "expert_quote": "A 1-sentence actionable advice tailored for this crop in {loc_name}",
  "detected_crop_override": "If the model says the crop is {crop} but you visually identify this leaf is actually Apple, Cotton, or Hibiscus, write the correct crop name here. Otherwise, write null.",
  "detected_disease_override": "If the model prediction is wrong and you visually identify a different disease, write the correct disease name here. Otherwise, write null."
}}
Return ONLY valid JSON.
"""

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": img_b64
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        }

        resp = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=20)
        if resp.status_code == 200:
            data = resp.json()
            raw_text = data['candidates'][0]['content']['parts'][0]['text']
            clean_text = cls._clean_json_response(raw_text)
            parsed = json.loads(clean_text)
            parsed["ai_provider_used"] = f"Google Gemini 1.5 Vision + OpenWeather ({loc_name})"
            return parsed
        else:
            raise Exception(f"Gemini API returned code {resp.status_code}: {resp.text}")

    @classmethod
    def _call_openai_vision_api(cls, image_path, cnn_results, context, weather, api_key):
        """Call OpenAI GPT-4o vision API with weather & soil context."""
        url = "https://api.openai.com/v1/chat/completions"
        img_b64 = cls.encode_image_base64(image_path)
        
        loc_name = weather.get("location_name") if weather else context.get("location")
        soil_type = weather.get("soil", {}).get("soil_type", "Loamy Soil") if weather else "Loamy Soil"

        prompt = f"""
Analyze this leaf image. Trained CNN: {cnn_results.get('display_name')} ({cnn_results.get('confidence')}%).
Context: Crop={context.get('crop_type')}, Location={loc_name}, Temp={weather.get('temperature_c')}°C, Humidity={weather.get('humidity_pct')}%, Soil={soil_type}.

Return JSON:
{{
  "ai_diagnosis": "Visual pathology incorporating weather & soil factors",
  "pathogen_type": "Fungal/Bacterial/Viral/Environmental/Healthy",
  "severity_index": "Low/Medium/High/Critical",
  "organic_remedies": ["Remedy 1", "Remedy 2"],
  "chemical_treatments": ["Treatment 1", "Treatment 2"],
  "preventive_advisory": ["Weather-based advisory", "Soil tip"],
  "climate_risk": "Climate risk analysis",
  "yield_impact_risk": "Moderate/High/Low",
  "expert_quote": "Key recommendation",
  "detected_crop_override": "Write 'Apple', 'Cotton', or 'Hibiscus' if the model misidentified the leaf, else null",
  "detected_disease_override": "Correct disease name if model was wrong, else null"
}}
"""

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}
                        }
                    ]
                }
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        resp = requests.post(url, json=payload, headers=headers, timeout=20)
        if resp.status_code == 200:
            data = resp.json()
            raw_text = data['choices'][0]['message']['content']
            clean_text = cls._clean_json_response(raw_text)
            parsed = json.loads(clean_text)
            parsed["ai_provider_used"] = f"OpenAI GPT-4o Vision + OpenWeather ({loc_name})"
            return parsed
        else:
            raise Exception(f"OpenAI API error {resp.status_code}: {resp.text}")

    @classmethod
    def _call_gemini_qa(cls, question, analysis, api_key):
        """Call Gemini API for interactive Q&A."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        weather = analysis.get("weather_data", {})
        prompt = f"""
You are a senior botanist and soil expert.
Analysis Context:
- Primary Condition: {analysis.get('cnn_prediction', {}).get('display_name')}
- Location: {weather.get('location_name')} ({weather.get('temperature_c')}°C, {weather.get('humidity_pct')}% humidity)
- Soil Type: {weather.get('soil', {}).get('soil_type')}

User Question: "{question}"
Provide a concise, practical answer for gardeners/farmers.
"""
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        resp = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=15)
        if resp.status_code == 200:
            data = resp.json()
            answer = data['candidates'][0]['content']['parts'][0]['text']
            return {"answer": answer, "provider": "Google Gemini AI"}
        return cls._generate_fallback_qa(question, analysis)

    @classmethod
    def _call_openai_qa(cls, question, analysis, api_key):
        """Call OpenAI API for interactive Q&A."""
        url = "https://api.openai.com/v1/chat/completions"
        weather = analysis.get("weather_data", {})
        prompt = f"Leaf diagnosis: {analysis.get('cnn_prediction', {}).get('display_name')} at {weather.get('location_name')}. User asks: {question}"
        payload = {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}]
        }
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        if resp.status_code == 200:
            answer = resp.json()['choices'][0]['message']['content']
            return {"answer": answer, "provider": "OpenAI GPT-4o"}
        return cls._generate_fallback_qa(question, analysis)

    @classmethod
    def _generate_structured_fallback(cls, cnn_results, context, weather=None):
        """Generate high-precision structured intelligence when no external LLM API key is present."""
        disease = cnn_results.get("prediction", "Hibiscus Healthy")
        display_name = cnn_results.get("display_name", "Plant Condition")
        meta = cnn_results.get("metadata", {})

        crop = context.get("crop_type", "Hibiscus/Plant")
        
        loc_name = weather.get("location_name", context.get("location", "Regional Zone")) if weather else context.get("location", "Regional Zone")
        temp = weather.get("temperature_c", 28.0) if weather else 28.0
        humidity = weather.get("humidity_pct", 65) if weather else 65
        condition = weather.get("description", "Partly Cloudy") if weather else "Partly Cloudy"
        
        soil_type = weather.get("soil", {}).get("soil_type", "Loamy Soil") if weather else "Loamy Soil"
        soil_moisture = weather.get("soil", {}).get("moisture_status", "Moist") if weather else "Moist"
        ph_est = weather.get("soil", {}).get("estimated_ph", "6.5 - 7.2") if weather else "6.5 - 7.2"

        if "Healthy" in disease:
            pathogen = "None (Healthy Tissue)"
            severity = "Low / Normal"
            diagnosis = f"In {loc_name} ({temp}°C, {humidity}% humidity, {soil_type}), the {crop} foliage displays robust green tissue and healthy cellular structure. Local soil pH ({ph_est}) and moisture status ({soil_moisture}) provide ideal growing conditions."
            organic = ["Maintain regular irrigation schedule.", f"Mulch around base to protect {soil_type} structure.", "Provide 6+ hours of full sun."]
            chemical = ["No chemical treatments required."]
            advisory = [f"Live weather ({temp}°C, {humidity}% humidity) is favorable. Monitor soil moisture during dry spells.", f"Keep organic compost levels balanced in {soil_type}."]
            climate_risk = f"Low risk under current weather conditions in {loc_name}."
            yield_risk = "Minimal - Crop growth rate is optimal."
            quote = f"Your plant is thriving in {loc_name}'s current climate! Continue standard care."
        else:
            pathogen = "Fungal / Pathogenic Microorganism" if "Fungal" in disease or "Spot" in disease else "Environmental / Vector Stress"
            severity = meta.get("severity", "Medium")
            diagnosis = f"Deep vision analysis detects symptoms of {display_name}. Ambient weather in {loc_name} ({temp}°C with {humidity}% humidity under {condition}) combined with {soil_type} ({soil_moisture}) creates micro-climate conditions that influence symptom progression."
            organic = [meta.get("organic_treatment", "Apply cold-pressed Neem oil spray (2%)."), f"Improve drainage in {soil_type} to prevent stagnant moisture.", "Prune lower infected leaves to enhance foliage airflow."]
            chemical = [meta.get("chemical_treatment", "Apply copper oxychloride fungicide (2g/L water)."), "Apply in early morning when ambient temperature is cooler."]
            advisory = [f"Humidity level of {humidity}% in {loc_name} accelerates fungal spore germination. Avoid evening overhead leaf watering.", f"For {soil_type}, monitor pH ({ph_est}) to ensure nutrient availability."]
            climate_risk = f"High humidity ({humidity}%) and temperature ({temp}°C) increase disease propagation risk in {loc_name}."
            yield_risk = "Moderate - Timely intervention prevents leaf canopy damage."
            quote = f"Live weather data for {loc_name} indicates high humidity—apply protective Neem/copper spray to protect non-infected foliage."

        return {
            "ai_diagnosis": diagnosis,
            "pathogen_type": pathogen,
            "severity_index": severity,
            "organic_remedies": organic,
            "chemical_treatments": chemical,
            "preventive_advisory": advisory,
            "climate_risk": climate_risk,
            "yield_impact_risk": yield_risk,
            "expert_quote": quote,
            "ai_provider_used": f"Built-in Agronomic Engine + Live OpenWeather ({loc_name})"
        }

    @classmethod
    def _generate_fallback_qa(cls, question, analysis):
        """Intelligent fallback Q&A based on query keywords and weather context."""
        q_lower = question.lower()
        condition = analysis.get('cnn_prediction', {}).get('display_name', 'plant condition')
        weather = analysis.get('weather_data', {})
        loc = weather.get('location_name', 'your area')
        soil = weather.get('soil', {}).get('soil_type', 'soil')

        if "weather" in q_lower or "humidity" in q_lower or "temp" in q_lower:
            ans = f"In {loc}, current weather is {weather.get('temperature_c')}°C with {weather.get('humidity_pct')}% humidity ({weather.get('description')}). High humidity can accelerate fungal spore germination for {condition}, so keep foliage dry."
        elif "soil" in q_lower or "dirt" in q_lower or "ph" in q_lower:
            ans = f"The regional soil profile in {loc} is identified as {soil} (pH: {weather.get('soil', {}).get('estimated_ph', 'neutral')}). Ensure good aeration and avoid over-compacting clay layers during rainy periods."
        elif "water" in q_lower or "irrigation" in q_lower:
            ans = f"Given {loc}'s current humidity ({weather.get('humidity_pct')}%) and soil moisture status ({weather.get('soil', {}).get('moisture_status', 'moist')}), water directly at the root base in early morning."
        elif "fertilizer" in q_lower or "feed" in q_lower or "n-p-k" in q_lower:
            ans = f"When managing {condition} in {soil}, avoid heavy synthetic nitrogen applications which cause soft succulent growth easily attacked by pathogens. Use organic compost or slow-release 10-10-10."
        else:
            ans = f"Regarding {condition} in {loc}: Monitor leaves weekly, ensure proper plant spacing for airflow, and apply Neem oil or copper fungicide if spots expand."

        return {"answer": ans, "provider": f"Agronomic Assistant ({loc} Climate Engine)"}
