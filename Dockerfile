# Build stage
FROM python:3.14-slim AS builder

# Verhindert, dass Python .pyc Dateien schreibt und sorgt für sofortige Log-Ausgabe
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies in a virtual environment
COPY requirements.txt .
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir --only-binary=:all: -r requirements.txt

# Runtime stage
FROM python:3.14-slim

# Umgebungsvariablen übernehmen
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser -u 1000 appuser

# Copy application files
COPY --chown=appuser:appuser main.py /app/
COPY --chown=appuser:appuser static/ /app/static/

# Use non-root user (numerisch, damit runAsNonRoot im Pod das prüfen kann)
USER 1000:1000

EXPOSE 2000

# Kein "server: uvicorn"-Header, ab 64 offenen Verbindungen antwortet Uvicorn mit 503
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "2000", "--no-server-header", "--limit-concurrency", "64"]
