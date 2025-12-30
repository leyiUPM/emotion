FROM python:3.11-slim

# Avoid Python buffering so logs show up immediately
ENV PYTHONUNBUFFERED=1         PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install deps
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy app code and model artifacts
COPY app.py /app/app.py
COPY model /app/model

EXPOSE 8000

# Run the API
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
