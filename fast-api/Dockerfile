FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libsndfile1 ffmpeg && rm -rf /var/lib/apt/lists/*
COPY pyproject.toml ./
RUN pip install --no-cache-dir . librosa python-multipart
COPY fastapi_server ./fastapi_server
EXPOSE 8000
CMD ["uvicorn", "fastapi_server.main:app", "--host", "0.0.0.0", "--port", "8000"]
