# 🌿 Plant AI Vision & Soil Intelligence System

A premium, state-of-the-art agronomic diagnostic platform that combines **Deep Learning computer vision** (PyTorch CNN & YOLOv8 object detection), **real-time climate geocoding**, **regional soil profile inference**, and **LLM visual intelligence** (Gemini & OpenAI) to provide real-time diagnosis, N-P-K fertilization calculations, localized audio advisories, and downloadable PDF reports for farmers and agronomists.

---

## 🚀 Key Features

*   **Multi-Crop Disease Diagnostics:**
    *   **Cotton Leaf Disease (YOLOv8):** Direct object detection that highlights localized infections (e.g. *Bacterial Blight*, *Leaf Curl Virus*, *Fusarium Wilt*) with active bounding box drawings.
    *   **Hibiscus Leaf Disease (PyTorch ResNet-18):** Classified into 8 levels (e.g. *Senescent*, *Citruspot*, *Early/Mild Spotting*, *Fungal*, *Mild Edge Damage*, *Wrinkled Leaf*).
    *   **Apple Leaf Disease (Feature Classifier):** Detects major pathologies (*Apple Scab*, *Black Rot*, *Cedar Apple Rust*, *Healthy*).
*   **Shadow Removal Preprocessing Pipeline:**
    *   Integrates **CLAHE (Contrast Limited Adaptive Histogram Equalization)** on the L-channel in LAB space followed by **Gamma Correction** to neutralize field-level lighting shadows and highlight subtle symptoms.
*   **Live Climate & Soil Profiling:**
    *   Resolves coordinates via free Geocoding and retrieves live weather data (temperature, humidity, wind speed) from the **Open-Meteo API** (with OpenWeatherMap API fallback).
    *   Infers soil classifications (*Black Cotton Vertisol Clay, Laterite Tropical Red, Sandy Loam*) and moisture holding status based on geographic latitude/longitude and real-time environment metrics.
*   **Smart N-P-K & Micronutrient Advice:**
    *   Formulates precise Nitrogen (N), Phosphorus (P), and Potassium (K) ratios, organic compost formulas, chemical dosages, and schedules tailored to leaf symptoms and soil type.
*   **Outbreak Risk Radar:**
    *   Calculates real-time agricultural vulnerability scores (Fungal Blight, Bacterial Spot, and Pest Vector risk) for surrounding farming hubs.
*   **Eco-Friendly Remedies & Companion Planting:**
    *   Generates custom biological recipes (e.g., *Sour Buttermilk*, *NSKE 5%*, *Horsetail decoction*) and companion planting guidelines.
*   **Vision LLM Expert & Q&A Chatbot:**
    *   Integrates **Google Gemini 1.5** & **OpenAI GPT-4o** APIs for in-depth agronomic analysis.
    *   Provides an interactive agricultural Q&A helper for customized follow-up questions.
*   **Client-Side Audio Advisories & Localization:**
    *   Speech Synthesis readouts of diagnostics and expert quotes in four languages: **English**, **Hindi (हिन्दी)**, **Marathi (मराठी)**, and **Spanish (Español)**.
*   **Downloadable PDF Diagnostic Reports:**
    *   Compiles analysis results, weather conditions, N-P-K ratios, and leaf photographs into print-ready PDF reports.

---

## 📁 Repository Directory Structure

```
.
├── Apple/
│   └── preprocessed_dataset/         # Apple disease dataset for validation
├── cotton/
│   └── cotton/                       # Cotton disease dataset folder
├── yolo_training/
│   └── cotton_disease_detection/     # Trained YOLO weights & metrics
│       ├── weights/
│       │   ├── best.pt               # YOLOv8 cotton model weights
│       │   └── last.pt
│       └── confusion_matrix.png, ... # Training validation curves
├── plant_ai_vision_webapp/           # Core Flask web application
│   ├── static/                       # Client assets (CSS, JS, Preset Samples)
│   │   ├── css/
│   │   │   └── styles.css            # Custom CSS styling (glassmorphism/dark mode)
│   │   ├── js/
│   │   │   └── main.js                # Dashboard controller (Camera, TTS, charts)
│   │   └── samples/                  # Default preset leaf images for demo
│   ├── templates/
│   │   └── index.html                # Premium UI Dashboard layout
│   ├── uploads/                      # Temp store for uploaded analysis images
│   ├── reports/                      # Generated PDF diagnostic reports
│   ├── app.py                        # Entrypoint Flask application
│   ├── model_engine.py               # CNN, YOLO & Feature prediction classifiers
│   ├── weather_service.py            # Free weather/soil API service integration
│   ├── ai_service.py                 # LLM API (Gemini/OpenAI) prompt generator
│   ├── fertilizer_service.py         # Smart N-P-K recommendation builder
│   ├── outbreak_radar.py             # Agricultural risk radar calculator
│   └── organic_service.py            # Eco-friendly remedy preparer
├── hibiscus_cnn_model.pth            # Trained PyTorch ResNet-18 Hibiscus model
├── requirements.txt                  # Python package requirements
├── Dockerfile                        # Docker deployment container
└── README.md                         # Project documentation
```

---

## 🛠️ Setup & Installation

### 1. Prerequisites
Ensure you have the following installed:
*   Python 3.9+
*   Pip
*   (Optional) Docker

### 2. Local Environment Setup
Clone the repository and navigate into the workspace:
```bash
git clone https://github.com/Master66999/Hackthon-pccoe.git
cd Hackthon-pccoe
```

Install the python dependencies:
```bash
pip install -r requirements.txt
```

> **Note:** PyTorch and Torchvision are configured to use CPU-compiled wheels in `requirements.txt` to keep build times fast and compatible across hosting spaces.

### 3. Execution
Start the local development server:
```bash
python plant_ai_vision_webapp/app.py
```
Open your browser and navigate to **`http://127.0.0.1:5000`** to interact with the system.

---

## 🐳 Docker Deployment

The project is packaged with a multi-platform ready `Dockerfile` configured for containerized deployments (such as Hugging Face Spaces or AWS ECS).

To build and run the Docker container locally:

```bash
# Build the Docker image
docker build -t plant-ai-vision .

# Run the container
docker run -p 7860:7860 -e PORT=7860 plant-ai-vision
```
The application will be accessible at **`http://localhost:7860`**.

---

## 🔑 Environment & LLM Key Setup

To enable the advanced Vision AI expert diagnosis and chat features, obtain API keys from Gemini or OpenAI.

*   Set keys as environment variables:
    ```bash
    export GEMINI_API_KEY="your_gemini_key_here"
    export OPENAI_API_KEY="your_openai_key_here"
    export OPENWEATHER_API_KEY="your_openweather_key_here"
    ```
*   Alternatively, configure the API Key directly in the web dashboard by clicking the **Configure AI Key** button in the top navigation bar (stored securely on the client-side using local storage).

---

## 📈 Model Performance & Validation
Trained model validation results and evaluation curves (for the Cotton YOLO model) are located under the `yolo_training/cotton_disease_detection/` directory, including:
*   `confusion_matrix_normalized.png`: Normalized classification accuracy details.
*   `BoxF1_curve.png` & `BoxPR_curve.png`: Intersection-over-Union bounding box metrics.
*   `results.png`: Training loss vs validation metrics over training epochs.
