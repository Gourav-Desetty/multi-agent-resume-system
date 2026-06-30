FROM python:3.12-slim

WORKDIR /app

# Install system dependencies needed for libraries (e.g. gcc for pymupdf or docx parsing)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
RUN mkdir -p data/resumes data/job_descriptions

ENV PYTHONPATH=/app
ENV HOST=0.0.0.0
ENV PORT=8000

EXPOSE 8000

CMD ["python", "backend/main.py"]
