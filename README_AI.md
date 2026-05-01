# Bodyshop AI — Summary of AI Work

**Engineer:** Dowr (AI/ML)  
**Stack:** FastAPI · Python 3.12 · Docker

---

## What I Built

A standalone AI microservice exposing 7 endpoints, each backed by a real trained ML model.
The backend team consumes these endpoints via REST. No rule-based logic anywhere.

---

## The 7 Models

### 1. Damage Detection — YOLOv8n
- **Endpoint:** `POST /predict-damage`
- **Input:** Car photo (upload)
- **Output:** List of detected damage classes + bounding boxes + severity score (0–1)
- **Model:** YOLOv8n fine-tuned on Roboflow car damage dataset (18 classes, ~3072 images, 30 epochs on Colab T4 GPU)
- **Result:** Detects bonnet dents, bumper damage, headlight damage, scratches, etc.

### 2. Repair Time Prediction — XGBoost Regressor
- **Endpoint:** `POST /predict-time`
- **Input:** Vehicle type, damage type, severity, parts count, mechanic skill
- **Output:** Predicted repair time in hours
- **Model:** XGBoost regressor trained on 10,000 synthetic rows — MAE: 0.679 hours
- **Note:** Trained on simulated data; production would retrain on real shop records

### 3. Repair Cost Prediction — XGBoost Regressor
- **Endpoint:** `POST /predict-cost`
- **Input:** Same as repair time
- **Output:** Predicted repair cost in USD
- **Model:** XGBoost regressor — MAE: $128
- **Note:** Trained on simulated data; production would retrain on real invoices

### 4. Mechanic Assignment — XGBoost LambdaRank
- **Endpoint:** `POST /assign-mechanic`
- **Input:** Job type, required skill level, estimated hours
- **Output:** Top-3 ranked mechanics with scores
- **Model:** XGBoost learning-to-rank (objective: rank:ndcg) on 25,000 synthetic job-mechanic pairs — Spearman rank correlation: 0.846
- **Roster:** 20 mechanics with specialties, skill levels, and current workload

### 5. Inventory Forecast — Prophet
- **Endpoint:** `GET /forecast-inventory`
- **Input:** Part category, forecast horizon (days)
- **Output:** Predicted demand units + low-stock alert
- **Model:** One Facebook Prophet model per part category (5 categories), trained on 18 months of synthetic daily usage data with weekly + monthly seasonality
- **Note:** Trained on simulated data; production would use real shop inventory logs

### 6. Customer Messages — LLaMA 3.1 (Groq)
- **Endpoint:** `POST /generate-message`
- **Input:** Message type, customer name, job details, language (EN/AR)
- **Output:** AI-generated customer message
- **Model:** LLaMA 3.1 8B Instant via Groq free API
- **Supports:** English and Arabic output

### 7. Sentiment Analysis — LLaMA 3.1 (Groq)
- **Endpoint:** `POST /analyze-sentiment`
- **Input:** Customer review text
- **Output:** Sentiment label (positive / negative / neutral) + confidence score
- **Model:** LLaMA 3.1 8B Instant via Groq free API (zero-shot classification)

---

## Tech Stack

| Component | Tool |
|-----------|------|
| API framework | FastAPI + uvicorn |
| Object detection | Ultralytics YOLOv8 |
| Tabular ML | XGBoost + scikit-learn |
| Time series | Prophet (Meta) |
| LLM inference | Groq (free tier) — LLaMA 3.1 8B |
| Dataset labeling | Roboflow (free) |
| Training GPU | Google Colab T4 (free) |
| Containerization | Docker |

---

## Data Disclosure

Models 2, 3, 4, and 5 were trained on **synthetically generated data** due to the absence of real shop records.
In production, these models would be retrained on actual repair invoices, mechanic logs, and inventory history.
Model 1 (YOLOv8) was trained on a real labeled car damage image dataset from Roboflow.
Models 6 and 7 use a pre-trained LLM with no fine-tuning required.

---

## Delivery

- Docker image: `bodyshop-ai` — run with `docker run -p 8000:8000 -e GROQ_API_KEY=... bodyshop-ai`
- Full API contract: see `API_CONTRACT.md`
- Interactive test UI: `ui/dashboard.html` (open in browser, requires uvicorn running)
