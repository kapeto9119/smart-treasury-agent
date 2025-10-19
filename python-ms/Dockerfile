FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Environment variables (can be overridden at runtime)
ENV PORT=8000 \
    LOG_LEVEL=INFO \
    SIMULATION_TIMEOUT=240 \
    AUTO_CLEANUP=true \
    DAYTONA_API_URL=https://app.daytona.io/api \
    DAYTONA_TARGET=us \
    DAYTONA_AUTOSTOP_MINUTES=10

# These should be set at runtime via docker-compose or -e flags
# ENV DAYTONA_API_KEY=
# ENV ANTHROPIC_API_KEY=

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Run application
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
