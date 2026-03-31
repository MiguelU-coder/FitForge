# ai-service/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# The PORT environment variable is automatically injected by Railway
ENV PORT=8000
EXPOSE ${PORT}

CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT}"
