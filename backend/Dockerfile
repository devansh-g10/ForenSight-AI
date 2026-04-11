# Use Python 3.12 slim image to keep size manageable
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
# - tesseract-ocr: For OCR Agent
# - libgl1-mesa-glx: For OpenCV (cv2)
# - libglib2.0-0: For various libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Expose port (Render uses 10000 by default or looks at $PORT, but we'll expose 8000)
# We will use the $PORT env var set by Render/Cloud platforms
EXPOSE 8000

# Start command (using gunicorn with uvicorn workers for production)
# Note: $PORT is a shell variable, so we use a shell form for CMD or a simple uvicorn start
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
