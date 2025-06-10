# Multi-stage build for LeetEase

# Stage 1: build React frontend
FROM node:20 AS frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci --omit=dev
COPY frontend ./
RUN npm run build

# Stage 2: install Python dependencies
FROM python:3.11-slim AS backend
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Final stage: runtime image
FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
COPY --from=backend /usr/local /usr/local
COPY backend ./backend
COPY --from=frontend /frontend/build ./frontend/build
COPY --from=frontend /frontend/public ./frontend/public
EXPOSE 5000
CMD ["python", "backend/app.py"]
