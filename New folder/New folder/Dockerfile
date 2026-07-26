FROM python:3.9-slim

# Install system dependencies needed for OpenCV and rendering
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files into the container
COPY . .

# Set environment variables
ENV FLASK_APP=plant_ai_vision_webapp/app.py
ENV PYTHONPATH=/app/plant_ai_vision_webapp
ENV PORT=7860

# Expose the default port Hugging Face Spaces uses
EXPOSE 7860

# Start the application using Gunicorn (production WSGI server)
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:$PORT app:app"]
