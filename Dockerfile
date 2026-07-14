# Stage 1: Build the frontend React app
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup Python environment and serve everything
FROM python:3.11-slim
WORKDIR /app

# Install build dependencies for pip packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend

# Copy built frontend assets to the FastAPI static folder
COPY --from=frontend-builder /app/frontend/dist ./backend/static

EXPOSE 8000
ENV PORT=8000

# Run uvicorn server
WORKDIR /app/backend
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
