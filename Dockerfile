# ==============================================================
# 🧠 Lua TTS System - Kokoro TTS (PT-BR) - FIXED
# Compatible with Windows, Linux and Docker Desktop
# ==============================================================

FROM python:3.11-slim

# Working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    libsndfile1-dev \
    espeak-ng \
    libespeak-ng-dev \
    portaudio19-dev \
    build-essential \
    curl \
    wget \
    locales \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configure environment and locale
RUN sed -i '/pt_BR.UTF-8/s/^# //g' /etc/locale.gen && locale-gen
ENV LANG=pt_BR.UTF-8 \
    LC_ALL=pt_BR.UTF-8 \
    TZ=America/Sao_Paulo \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app

# Copy dependency list
COPY requirements_fixed.txt /app/requirements.txt

# Install Python dependencies
RUN python -m pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt && \
    pip cache purge || true

# Copy application code
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/

# Create necessary directories
RUN mkdir -p /app/backend/{logs,temp,models,voices,cache} && \
    mkdir -p /app/frontend/public/videos && \
    mkdir -p /app/output

# Create default environment configuration
RUN echo "API_HOST=0.0.0.0" > /app/backend/.env && \
    echo "API_PORT=8000" >> /app/backend/.env && \
    echo "USE_GPU=false" >> /app/backend/.env && \
    echo "LOG_LEVEL=INFO" >> /app/backend/.env && \
    echo "KOKORO_MODEL=hexgrad/Kokoro-82M" >> /app/backend/.env && \
    echo "KOKORO_LANGUAGE=pt" >> /app/backend/.env && \
    echo "KOKORO_VOICE=af_heart" >> /app/backend/.env && \
    echo "REDIS_URL=redis://redis:6379" >> /app/backend/.env && \
    echo "DATABASE_URL=sqlite:///./lua_system.db" >> /app/backend/.env

# Expose API port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start FastAPI server
CMD ["python", "-m", "uvicorn", "backend.main_fixed:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--reload"]