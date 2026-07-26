"""
Plant AI Vision - Main Flask Application Server
Web server handling image uploads, PyTorch CNN model inference,
OpenWeather/Open-Meteo climate & soil intelligence, LLM AI analysis,
PDF generation, Smart N-P-K fertilizer calculation, and Outbreak Risk Radar.
"""

import os
import cv2
import json
import base64
import time
from flask import Flask, render_template, request, jsonify, send_file, send_from_directory, flash

# Import local modules
from model_engine import PlantDiseaseClassifier
from ai_service import PlantAIService
from weather_service import WeatherSoilService
from pdf_generator import generate_pdf_report
from fertilizer_service import FertilizerRecommenderService
from outbreak_radar import OutbreakRadarService
from organic_service import OrganicAdvisoryService

app = Flask(__name__)
app.secret_key = "plant-ai-vision-app-secret-key"

# Configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
REPORTS_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")
SAMPLES_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "samples")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORTS_FOLDER, exist_ok=True)
os.makedirs(SAMPLES_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['REPORTS_FOLDER'] = REPORTS_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB max upload

# Initialize Classifier Instance
print("[App] Initializing PyTorch Plant Classifier...")
classifier = PlantDiseaseClassifier()

# Global memory storage mapping analysis_id -> analysis data (for concurrent PDF generation)
last_analysis_store = {}

def numpy_bgr_to_base64(img_bgr):
    _, buffer = cv2.imencode('.jpg', img_bgr)
    return base64.b64encode(buffer).decode('utf-8')

@app.route('/')
def index():
    """Render main application UI."""
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze_image():
    """
    Handle leaf image upload, fetch weather & soil data, execute PyTorch CNN inference,
    compute N-P-K fertilizer recommendations & Outbreak Radar, and query LLM AI service.
    """
    global last_analysis_store
    try:
        file_path = None
        
        # Check if file uploaded or sample image selected
        if 'file' in request.files and request.files['file'].filename != '':
            file = request.files['file']
            filename = f"{int(time.time())}_{file.filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
        elif 'sample_path' in request.form and request.form['sample_path']:
            sample_rel = request.form['sample_path']
            file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), sample_rel.lstrip("/"))

        if not file_path or not os.path.exists(file_path):
            return jsonify({"status": "error", "message": "No valid image provided."}), 400

        # Location parameters
        location = request.form.get("location", "Nagpur").strip()
        lat_val = request.form.get("lat")
        lon_val = request.form.get("lon")
        
        api_key = request.form.get("api_key", "").strip()
        provider = request.form.get("provider", "gemini").lower()
        apply_shadow = request.form.get("apply_shadow", "true").lower() == "true"
        crop_type = request.form.get("crop_type", "").strip()

        # 1. Fetch Live Weather & Soil Intelligence
        weather_data = None
        if lat_val and lon_val and lat_val != "null" and lon_val != "null":
            try:
                lat = float(lat_val)
                lon = float(lon_val)
                weather_data = WeatherSoilService.get_weather_by_coords(lat, lon)
            except ValueError:
                weather_data = WeatherSoilService.get_weather_by_city(location)
        else:
            weather_data = WeatherSoilService.get_weather_by_city(location)

        context_params = {
            "location": weather_data.get("location_name", location) if weather_data else location
        }

        # 2. Run PyTorch CNN Inference & CLAHE Shadow Removal
        cnn_results = classifier.predict(file_path, apply_shadow_removal=apply_shadow, crop_type=crop_type)
        
        # Convert images to Base64
        with open(file_path, "rb") as f:
            original_b64 = base64.b64encode(f.read()).decode('utf-8')
        
        clahe_b64 = numpy_bgr_to_base64(cnn_results["clahe_bgr"])
        yolo_b64 = numpy_bgr_to_base64(cnn_results["yolo_bgr"])

        # 3. Calculate Smart N-P-K Fertilizer Advice & Regional Outbreak Radar
        fertilizer_advice = FertilizerRecommenderService.calculate_npk_recommendation(
            disease_name=cnn_results["prediction"],
            soil_info=weather_data.get("soil", {}) if weather_data else {}
        )

        outbreak_radar = OutbreakRadarService.get_regional_radar(user_weather=weather_data)
        natural_advisory = OrganicAdvisoryService.get_natural_advisory(cnn_results["prediction"])

        # 4. Query LLM AI Service using API Key (or rule fallback)
        ai_insights = PlantAIService.generate_image_intelligence(
            image_path=file_path,
            cnn_results=cnn_results,
            context_params=context_params,
            weather_data=weather_data,
            api_key=api_key if api_key else None,
            provider=provider
        )

        # Dynamic LLM visual override self-correction
        if ai_insights:
            override_crop = ai_insights.get("detected_crop_override")
            override_disease = ai_insights.get("detected_disease_override")
            
            if override_crop and str(override_crop).strip().lower() != "null" and str(override_crop).strip() != "":
                detected_crop = str(override_crop).strip().title()
                if detected_crop in ["Apple", "Cotton", "Hibiscus"]:
                    cnn_results["crop_type"] = detected_crop
                    
            if override_disease and str(override_disease).strip().lower() != "null" and str(override_disease).strip() != "":
                detected_disease = str(override_disease).strip()
                cnn_results["prediction"] = detected_disease
                cnn_results["display_name"] = detected_disease
                cnn_results["confidence"] = 99.0
                
                # Recalculate smart advisors for the corrected disease
                fertilizer_advice = FertilizerRecommenderService.calculate_npk_recommendation(
                    disease_name=detected_disease,
                    soil_info=weather_data.get("soil", {}) if weather_data else {}
                )
                natural_advisory = OrganicAdvisoryService.get_natural_advisory(detected_disease)

        response_data = {
            "status": "success",
            "analysis_id": str(int(time.time())),
            "image_path": file_path,
            "original_b64": original_b64,
            "clahe_b64": clahe_b64,
            "yolo_b64": yolo_b64,
            "weather_data": weather_data,
            "fertilizer_advice": fertilizer_advice,
            "outbreak_radar": outbreak_radar,
            "natural_advisory": natural_advisory,
            "cnn_prediction": {
                "crop_type": cnn_results.get("crop_type", crop_type),
                "disease_name": cnn_results["prediction"],
                "display_name": cnn_results["display_name"],
                "confidence": cnn_results["confidence"],
                "top_3": cnn_results["top_3"],
                "metadata": cnn_results.get("metadata", {})
            },
            "ai_insights": ai_insights,
            "context": context_params
        }

        # Store for PDF generation (keyed by analysis_id)
        last_analysis_store[response_data["analysis_id"]] = response_data
        
        # Manage memory usage by retaining only the last 50 analyses
        if len(last_analysis_store) > 50:
            oldest_key = next(iter(last_analysis_store))
            last_analysis_store.pop(oldest_key, None)

        return jsonify(response_data)

    except Exception as e:
        print(f"[App Error] Analysis error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/generate-pdf', methods=['GET', 'POST'])
def handle_generate_pdf():
    """Generate and return downloadable PDF diagnostic report."""
    try:
        analysis_id = request.args.get("analysis_id") or request.form.get("analysis_id")
        
        if analysis_id and analysis_id in last_analysis_store:
            data = last_analysis_store[analysis_id]
        elif last_analysis_store:
            # Fallback to the latest analysis
            latest_id = list(last_analysis_store.keys())[-1]
            data = last_analysis_store[latest_id]
            analysis_id = latest_id
        else:
            return "No analysis data available to generate PDF.", 400

        pdf_filename = f"plant_vision_report_{analysis_id}.pdf"
        pdf_path = os.path.join(app.config['REPORTS_FOLDER'], pdf_filename)

        generate_pdf_report(data, pdf_path)

        return send_file(pdf_path, as_attachment=True, download_name=pdf_filename)

    except Exception as e:
        print(f"[App Error] PDF generation error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/llm-query', methods=['POST'])
def handle_llm_query():
    """Handle interactive user Q&A follow-up questions."""
    try:
        data = request.json or {}
        question = data.get("question", "")
        analysis = data.get("analysis", {})
        analysis_id = data.get("analysis_id")
        api_key = data.get("api_key", "").strip()

        # Fallback to memory store if analysis payload is not fully sent but ID is present
        if not analysis and analysis_id:
            analysis = last_analysis_store.get(analysis_id, {})

        if not question:
            return jsonify({"status": "error", "message": "Question cannot be empty."}), 400

        result = PlantAIService.answer_followup_question(
            question=question,
            image_path=analysis.get("image_path"),
            previous_analysis=analysis,
            api_key=api_key if api_key else None
        )

        return jsonify({"status": "success", "response": result})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/sample-images', methods=['GET'])
def get_sample_images():
    """Return available sample images for demo testing."""
    samples = []
    if os.path.exists(SAMPLES_FOLDER):
        for f in os.listdir(SAMPLES_FOLDER):
            if f.lower().endswith(('.png', '.jpg', '.jpeg')):
                samples.append({
                    "name": f.split('.')[0].replace('_', ' ').title(),
                    "path": f"/static/samples/{f}"
                })
    return jsonify({"samples": samples})

if __name__ == '__main__':
    print("\n" + "="*60)
    print(" 🌿 Plant AI Vision & Diagnostic Application Server")
    print(" All 5 Features Active: PDF, N-P-K, Camera, Radar, Voice")
    print(" Running at: http://127.0.0.1:5000")
    print("="*60 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
