FROM python:3.11-slim

WORKDIR /app

# system deps required by prophet and opencv
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libgomp1 libglib2.0-0 libgl1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .
COPY app/ app/
COPY data/mechanics.csv data/mechanics.csv

ENV GROQ_API_KEY=""

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
