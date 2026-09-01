"""
Flask Web Application & API Entrypoint for LeafSense Plant AI Vision & Soil Intelligence Console.
Runs on Port 5001 (proxied via Vite dev server at /api/vision).
"""

import os
import io
import json
import requests
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    load_dotenv(dotenv_path=env_path)
except Exception as e:
    print(f"[LeafSense] Dotenv loading notice: {e}")


from vision_services.model_engine import get_model_engine
from vision_services.weather_service import fetch_weather_and_soil
from vision_services.fertilizer_service import calculate_fertilizer_npk
from vision_services.organic_service import get_organic_remedies
from vision_services.outbreak_radar import calculate_outbreak_risk
from vision_services.ai_service import generate_llm_expert_analysis, answer_agronomic_chat_question
from vision_services.pdf_generator import generate_diagnostic_pdf
from vision_services.carbon_service import calculate_carbon_score
from vision_services.weather_service import fetch_7day_forecast
from vision_services.water_service import calculate_precision_water_advisory
from vision_services.crop_recommender import recommend_climate_resilient_crops

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-AI-API-Key"
    return response

# Ensure reports directory exists
REPORTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "reports"))
os.makedirs(REPORTS_DIR, exist_ok=True)


@app.route("/api/vision/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "LeafSense Plant AI Vision & Soil Intelligence Backend",
        "port": 5001
    })


@app.route("/api/vision/analyze", methods=["POST"])
def analyze_leaf_image():
    """
    Primary Diagnostic Endpoint.
    Accepts form-data:
      - image: image file (JPG/PNG)
      - crop: 'Auto-Detect', 'Apple', 'Cotton', 'Hibiscus'
      - location: 'Nagpur', 'Assam', Coords, etc.
      - api_key: optional Gemini/OpenAI API key
    """
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided in request."}), 400

        img_file = request.files['image']
        crop_override = request.form.get('crop', 'Auto-Detect')
        location = request.form.get('location', 'Pune')
        user_api_key = request.form.get('api_key') or request.headers.get('X-AI-API-Key')
        
        image_bytes = img_file.read()
        if len(image_bytes) == 0:
            return jsonify({"error": "Uploaded image file is empty."}), 400

        # 1. Run Unified Model Engine (CLAHE + Crop Detection + Model Predictor)
        engine = get_model_engine()
        engine_res = engine.process_and_analyze(image_bytes, crop_override=crop_override)

        # 2. Fetch Live Climate & Soil Profile
        weather_res = fetch_weather_and_soil(location)
        weather_info = weather_res["weather"]
        soil_info = weather_res["soil"]

        # 3. Calculate N-P-K & Fertilizer Recommendations
        fertilizer_info = calculate_fertilizer_npk(
            engine_res["crop"],
            engine_res["disease"],
            spot_ratio=engine_res.get("spot_ratio", 0.0)
        )

        # 4. Get Organic Remedies
        organic_info = get_organic_remedies(engine_res["disease"])

        # 5. Outbreak Risk Radar Scores
        radar_info = calculate_outbreak_risk(
            engine_res["disease"],
            humidity=weather_info.get("humidity", 68),
            temp=weather_info.get("temperature", 28.5),
            wind_speed=weather_info.get("wind_speed", 12.4),
            precip_risk=weather_info.get("precipitation_risk", 15)
        )

        # 6. LLM Multimodal Vision Analysis / Self-Correction
        ai_expert_res = generate_llm_expert_analysis(
            engine_res["annotated_b64"],
            engine_res["crop"],
            engine_res["disease"],
            engine_res["confidence"],
            weather_info,
            user_api_key=user_api_key
        )

        # 7. Carbon Footprint Score
        carbon_info = calculate_carbon_score(
            ai_expert_res.get("chemical_controls", []),
            ai_expert_res.get("organic_controls", []),
            crop=ai_expert_res.get("verified_crop", engine_res["crop"]),
            disease=ai_expert_res.get("verified_disease", engine_res["disease"])
        )

        # 8. Precision Water & Irrigation Advisory
        water_info = calculate_precision_water_advisory(
            crop=ai_expert_res.get("verified_crop", engine_res["crop"]),
            soil_type=soil_info.get("type", "Black Basaltic Clay"),
            temp=weather_info.get("temperature", 28.5),
            humidity=weather_info.get("humidity", 68),
            wind_speed=weather_info.get("wind_speed", 12.4)
        )

        # 9. Climate-Resilient Crop Diversification
        diversification_info = recommend_climate_resilient_crops(
            current_crop=ai_expert_res.get("verified_crop", engine_res["crop"]),
            temp=weather_info.get("temperature", 28.5),
            humidity=weather_info.get("humidity", 68),
            disease=ai_expert_res.get("verified_disease", engine_res["disease"])
        )

        # Combine payload
        final_payload = {
            "crop": ai_expert_res.get("verified_crop", engine_res["crop"]),
            "disease": ai_expert_res.get("verified_disease", engine_res["disease"]),
            "confidence": engine_res["confidence"],
            "contour_stats": engine_res["contour_stats"],
            "spot_count": engine_res.get("spot_count", 0),
            "spot_ratio": engine_res.get("spot_ratio", 0.0),
            "original_b64": engine_res["original_b64"],
            "clahe_b64": engine_res["clahe_b64"],
            "annotated_b64": engine_res["annotated_b64"],
            "expert_quote": ai_expert_res.get("expert_quote"),
            "organic_controls": ai_expert_res.get("organic_controls"),
            "chemical_controls": ai_expert_res.get("chemical_controls"),
            "llm_used": ai_expert_res.get("llm_used"),
            "weather": weather_info,
            "soil": soil_info,
            "fertilizer": fertilizer_info,
            "organic": organic_info,
            "radar": radar_info,
            "carbon": carbon_info,
            "water": water_info,
            "diversification": diversification_info
        }

        return jsonify(final_payload)
    except Exception as e:
        print(f"Error in /api/vision/analyze: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/vision/chat", methods=["POST"])
def agronomic_chat():
    """Q&A Chatbot assistant endpoint."""
    try:
        data = request.get_json() or {}
        user_question = data.get("question", "")
        context_data = data.get("context", {})
        user_api_key = data.get("api_key") or request.headers.get("X-AI-API-Key")

        if not user_question:
            return jsonify({"answer": "Please ask a question regarding your crop pathology or soil requirements."})

        answer = answer_agronomic_chat_question(user_question, context_data, user_api_key=user_api_key)
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/vision/weather", methods=["GET"])
def get_weather():
    """Live climate endpoint."""
    location = request.args.get("location", "Pune")
    data = fetch_weather_and_soil(location)
    return jsonify(data)


@app.route("/api/vision/forecast", methods=["GET"])
def get_forecast():
    """7-Day disease risk forecast endpoint."""
    location = request.args.get("location", "Pune")
    # Geocode the location to lat/lng first
    lat, lng = 18.5204, 73.8567  # default Pune
    try:
        geo_res = requests.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": location, "count": 1, "language": "en", "format": "json"},
            timeout=4
        )
        if geo_res.status_code == 200 and "results" in geo_res.json():
            res0 = geo_res.json()["results"][0]
            lat, lng = res0["latitude"], res0["longitude"]
    except Exception as e:
        print(f"[forecast] Geocoding error: {e}")
    forecast = fetch_7day_forecast(lat, lng)
    return jsonify({"forecast": forecast})


@app.route("/api/vision/pdf", methods=["POST"])
def generate_pdf_report():
    """Generates downloadable A4 PDF diagnostic report."""
    try:
        data = request.get_json() or {}
        diag = data.get("diag", {})
        weather = data.get("weather", {})
        fertilizer = data.get("fertilizer", {})
        organic = data.get("organic", {})

        pdf_path = generate_diagnostic_pdf(diag, weather, fertilizer, organic)
        return send_file(pdf_path, as_attachment=True, download_name=f"LeafSense_Pathology_Report.pdf")
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/vision/water", methods=["GET"])
def get_water_advisory():
    """GET endpoint for precision water footprint & drip irrigation advice."""
    crop = request.args.get("crop", "Cotton")
    location = request.args.get("location", "Pune")
    weather_res = fetch_weather_and_soil(location)
    weather_info = weather_res.get("weather", {}) if isinstance(weather_res, dict) else {}
    soil_info = weather_res.get("soil", {}) if isinstance(weather_res, dict) else {}
    soil_type_name = soil_info.get("type", "Black Basaltic Clay") if isinstance(soil_info, dict) else str(soil_info)
    water_data = calculate_precision_water_advisory(
        crop=crop,
        soil_type=soil_type_name,
        temp=weather_info.get("temperature", 28.5),
        humidity=weather_info.get("humidity", 68),
        wind_speed=weather_info.get("wind_speed", 12.4)
    )
    return jsonify(water_data)


@app.route("/api/vision/crop-recommend", methods=["GET"])
def get_crop_recommendation():
    """GET endpoint for climate-resilient crop diversification recommendations."""
    crop = request.args.get("crop", "Cotton")
    location = request.args.get("location", "Pune")
    weather_res = fetch_weather_and_soil(location)
    weather_info = weather_res.get("weather", {}) if isinstance(weather_res, dict) else {}
    crop_data = recommend_climate_resilient_crops(
        current_crop=crop,
        temp=weather_info.get("temperature", 28.5),
        humidity=weather_info.get("humidity", 68)
    )
    return jsonify(crop_data)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    is_prod = os.environ.get("RENDER") is not None or os.environ.get("NODE_ENV") == "production"
    print(f"\n[LeafSense] Plant AI Vision & Soil Intelligence Console running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=not is_prod)
