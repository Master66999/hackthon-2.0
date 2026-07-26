"""
PDF Diagnostic Report Builder for LeafSense using FPDF2.

Generates print-ready A4 PDF reports with custom tables, N-P-K ratios,
live weather stats, soil profile, and leaf image thumbnails.
"""

import os
import tempfile
import base64
from fpdf import FPDF


class LeafSensePDF(FPDF):
    def header(self):
        # Header banner
        self.set_fill_color(61, 107, 79)  # LeafSense Moss Green (#3D6B4F)
        self.rect(0, 0, 210, 24, 'F')
        
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(245, 240, 232)  # Cream (#F5F0E8)
        self.set_xy(10, 5)
        self.cell(0, 14, "LeafSense -- Plant AI Vision & Soil Intelligence Report", 0, 0, 'L')
        
        self.set_font("Helvetica", "I", 9)
        self.set_xy(150, 6)
        self.cell(50, 14, "Official Pathology Document", 0, 0, 'R')
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 114, 104)
        self.cell(0, 10, f"Page {self.page_no()} | LeafSense Agronomic AI Platform -- Confidential Field Report", 0, 0, 'C')


def generate_diagnostic_pdf(diag_data, weather_data, fertilizer_data, organic_data, filename_out=None):
    """
    Builds and saves an A4 PDF report.
    Returns path to generated PDF file.
    """
    pdf = LeafSensePDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Title Section
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(30, 42, 31)  # Deep text primary
    pdf.cell(0, 8, f"Crop Pathology Analysis: {diag_data.get('crop', 'Crop')}", 0, 1, 'L')
    
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(74, 92, 77)
    pdf.cell(0, 5, f"Location: {weather_data.get('location', 'Field Station')} | Date: Real-Time Field Telemetry", 0, 1, 'L')
    pdf.ln(4)

    # Diagnostic Summary Box
    pdf.set_fill_color(245, 240, 232)  # Cream
    pdf.set_draw_color(168, 197, 176)  # Moss pale border
    pdf.rect(10, 42, 190, 32, 'DF')
    
    pdf.set_xy(14, 45)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(61, 107, 79)
    pdf.cell(90, 6, f"Primary Diagnosis: {diag_data.get('disease', 'Detected Condition')}", 0, 1)
    
    pdf.set_xy(14, 52)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(196, 123, 90)  # Terracotta
    pdf.cell(90, 6, f"Confidence Score: {diag_data.get('confidence')}%", 0, 1)
    
    pdf.set_xy(14, 59)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(30, 42, 31)
    pdf.multi_cell(180, 4.5, f"AI Expert Summary: {diag_data.get('expert_quote', 'Analysis verified.')}")

    pdf.set_y(78)

    # Weather & Soil Table
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(61, 107, 79)
    pdf.cell(0, 7, "1. Climate Vitals & Soil Profile", 0, 1)
    
    pdf.set_font("Helvetica", "", 9)
    pdf.set_fill_color(237, 232, 220)
    pdf.cell(47, 7, f" Temperature: {weather_data.get('temperature')} C", 1, 0, 'L', True)
    pdf.cell(47, 7, f" Humidity: {weather_data.get('humidity')}%", 1, 0, 'L', True)
    pdf.cell(47, 7, f" Wind: {weather_data.get('wind_speed')} km/h", 1, 0, 'L', True)
    pdf.cell(49, 7, f" Rain Risk: {weather_data.get('precipitation_risk')}%", 1, 1, 'L', True)

    soil = weather_data.get('soil', {})
    pdf.cell(94, 7, f" Soil Classification: {soil.get('type', 'Vertisol Clay')}", 1, 0, 'L')
    pdf.cell(96, 7, f" Soil pH: {soil.get('ph', 6.8)} | Organic Matter: {soil.get('organic_matter', '1.5%')}", 1, 1, 'L')
    pdf.ln(5)

    # N-P-K & Fertilizer Recommendations Table
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(61, 107, 79)
    pdf.cell(0, 7, "2. N-P-K Fertilizer & Nutrient Prescription", 0, 1)
    
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(63, 7, f" Nitrogen (N): {fertilizer_data.get('n_ratio')}%", 1, 0, 'L')
    pdf.cell(63, 7, f" Phosphorus (P): {fertilizer_data.get('p_ratio')}%", 1, 0, 'L')
    pdf.cell(64, 7, f" Potassium (K): {fertilizer_data.get('k_ratio')}%", 1, 1, 'L')
    
    pdf.cell(190, 7, f" Formula: {fertilizer_data.get('formula')}", 1, 1, 'L')
    pdf.cell(190, 7, f" Dosage & Schedule: {fertilizer_data.get('dosage')} ({fertilizer_data.get('schedule')})", 1, 1, 'L')
    pdf.ln(5)

    # Organic Remediation & Biopesticide
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(61, 107, 79)
    pdf.cell(0, 7, "3. Eco-Friendly Organic Remedies & Companion Planting", 0, 1)
    
    pdf.set_font("Helvetica", "", 9)
    pdf.multi_cell(190, 5, f" Biopesticide: {organic_data.get('biopesticide')}\n Recipe: {organic_data.get('recipe')}\n Companion Plants: {organic_data.get('companion_plants')}", 1, 'L')

    # Embedded Image if base64 provided
    img_b64 = diag_data.get("annotated_b64") or diag_data.get("original_b64")
    if img_b64:
        try:
            pure_b64 = img_b64.split(",")[-1]
            img_bytes = base64.b64decode(pure_b64)
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                tmp.write(img_bytes)
                tmp_path = tmp.name
            
            pdf.ln(5)
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(61, 107, 79)
            pdf.cell(0, 6, "4. Processed Visual Image Telemetry", 0, 1)
            pdf.image(tmp_path, x=10, y=pdf.get_y(), w=65)
            
            # Clean temp file
            os.remove(tmp_path)
        except Exception as e:
            print(f"PDF Image insert notice: {e}")

    # Output file
    if not filename_out:
        reports_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "reports"))
        os.makedirs(reports_dir, exist_ok=True)
        filename_out = os.path.join(reports_dir, f"LeafSense_Report_{diag_data.get('crop', 'Crop')}.pdf")

    pdf.output(filename_out)
    return filename_out
