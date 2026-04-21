FROM python:3.10-slim

WORKDIR /app

# Install critical system libraries for OpenCV and Tesseract Engine
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY ai_engine/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ai_engine/ .

# Ensure upload directory exists internally
RUN mkdir -p uploads

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
