"""
Bodyshop AI Microservice
Owner: Dowr (AI Engineer)
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Security, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.api_key import APIKeyHeader
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os
import io
import logging
from datetime import datetime
from PIL import Image
from ultralytics import YOLO
from dotenv import load_dotenv
from groq import Groq
from transformers import pipeline as hf_pipeline
import psycopg2
from apscheduler.schedulers.background import BackgroundScheduler

load_dotenv()

logger = logging.getLogger("inventory_retrain")

# ── Rate limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── API Key auth ─────────────────────────────────────────────────────────────
_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(key: str = Security(_api_key_header)):
    expected = os.getenv("AI_API_KEY", "")
    if not expected:
        return  # no key configured → open (dev mode)
    if key != expected:
        raise HTTPException(status_code=403, detail="Invalid or missing API key")

# ── Auto-retrain Prophet models from real DB data ────────────────────────────
def retrain_prophet_models():
    """Pull fresh parts_usage data from Neon and retrain all Prophet models."""
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        logger.warning("DATABASE_URL not set — skipping retrain")
        return

    try:
        from prophet import Prophet
        import warnings
        warnings.filterwarnings("ignore")

        conn = psycopg2.connect(db_url)
        cur  = conn.cursor()

        retrained = 0
        for cat in PROPHET_CATEGORIES:
            cur.execute("""
                SELECT used_on, SUM(quantity) AS total
                FROM parts_usage
                WHERE category = %s
                GROUP BY used_on
                ORDER BY used_on
            """, (cat,))
            rows = cur.fetchall()

            if len(rows) < 14:
                logger.info("Not enough data for %s (%d rows) — skipping", cat, len(rows))
                continue

            df = pd.DataFrame(rows, columns=["ds", "y"])
            df["ds"] = pd.to_datetime(df["ds"])
            df["y"]  = df["y"].astype(float)

            model = Prophet(
                yearly_seasonality=False,
                weekly_seasonality=True,
                daily_seasonality=False,
                seasonality_mode="multiplicative",
                changepoint_prior_scale=0.05,
            )
            model.fit(df)

            # Hot-swap in memory + persist to disk
            prophet_models[cat] = model
            joblib.dump(model, os.path.join(MODEL_DIR, f"prophet_{cat}.pkl"))
            retrained += 1
            logger.info("Retrained prophet_%s on %d days of data", cat, len(df))

        cur.close()
        conn.close()
        logger.info("Retrain complete at %s — %d/%d models updated",
                    datetime.now().strftime("%Y-%m-%d %H:%M"), retrained, len(PROPHET_CATEGORIES))

    except Exception as e:
        logger.error("Retrain failed: %s", e)


scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run once at startup so models are fresh immediately
    retrain_prophet_models()
    # Then retrain every night at 02:00
    scheduler.add_job(retrain_prophet_models, "cron", hour=2, minute=0, id="nightly_retrain")
    scheduler.start()
    logger.info("Nightly Prophet retrain scheduled at 02:00")
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="Bodyshop AI Service",
    description="7 ML endpoints powering the Car Bodyshop Management System",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = [o.strip() for o in os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:4173"
).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)

# ============================================================
# Load models at startup
# ============================================================
MODEL_DIR = "app/models"

yolo_model = YOLO(os.path.join(MODEL_DIR, "best.pt"))

# severity weight per damage class (higher = more severe)
SEVERITY_WEIGHTS = {
    "major-dent": 0.9, "minor-dent": 0.4, "dent": 0.6,
    "major-scratch": 0.8, "minor-scratch": 0.3, "scratch": 0.5,
    "crack": 0.85, "broken-glass": 0.95, "glass-crack": 0.8,
    "broken-lamp": 0.75, "flat-tire": 0.7, "rust": 0.6,
    "paint-damage": 0.5, "bumper-damage": 0.7, "door-damage": 0.65,
    "hood-damage": 0.7, "windshield-damage": 0.9, "multiple": 0.85,
}

time_model = joblib.load(os.path.join(MODEL_DIR, "time_model.pkl"))
cost_model = joblib.load(os.path.join(MODEL_DIR, "cost_model.pkl"))
feature_columns = joblib.load(os.path.join(MODEL_DIR, "feature_columns.pkl"))

ranker = joblib.load(os.path.join(MODEL_DIR, "ranker.pkl"))
ranker_feature_columns = joblib.load(os.path.join(MODEL_DIR, "ranker_feature_columns.pkl"))
mechanics_df = pd.read_csv("data/mechanics.csv")

PROPHET_CATEGORIES = ["bumpers", "headlights", "body-panels", "mirrors", "windshields"]
prophet_models = {
    cat: joblib.load(os.path.join(MODEL_DIR, f"prophet_{cat}.pkl"))
    for cat in PROPHET_CATEGORIES
}
LOW_STOCK_THRESHOLD = {"bumpers": 50, "headlights": 35, "body-panels": 70, "mirrors": 25, "windshields": 18}
DB_URL = os.getenv("DATABASE_URL", "")

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# DistilBERT sentiment model (fine-tuned on amazon_polarity, pushed to HF Hub)
HF_SENTIMENT_MODEL = "GhandourGh/bodyshop-sentiment"
try:
    sentiment_classifier = hf_pipeline(
        "text-classification",
        model=HF_SENTIMENT_MODEL,
        token=os.getenv("HF_TOKEN", ""),
    )
    logger.info("DistilBERT sentiment model loaded from HF Hub")
except Exception as e:
    sentiment_classifier = None
    logger.warning(f"Could not load DistilBERT model, falling back to Groq: {e}")


PROMPTS = {
    "status_update": {
        "en": "You are a professional car bodyshop service agent. Write a brief, friendly status update message to the customer named {name} about their vehicle repair. Job details: {details}. Keep it under 80 words.",
        "ar": "أنت موظف خدمة في ورشة سيارات محترفة. اكتب رسالة تحديث حالة موجزة وودية باللغة العربية للعميل {name} حول إصلاح سيارته. تفاصيل العمل: {details}. اجعلها أقل من 80 كلمة.",
    },
    "delay": {
        "en": "You are a professional car bodyshop service agent. Apologize politely and inform the customer named {name} about a delay in their repair. Job details: {details}. Be empathetic and provide reassurance. Keep it under 80 words.",
        "ar": "أنت موظف خدمة في ورشة سيارات محترفة. اعتذر بأدب وأخبر العميل {name} عن تأخير في إصلاح سيارته باللغة العربية. تفاصيل العمل: {details}. كن متعاطفاً. أقل من 80 كلمة.",
    },
    "completion": {
        "en": "You are a professional car bodyshop service agent. Notify the customer named {name} that their vehicle repair is complete and ready for pickup. Job details: {details}. Be warm and professional. Keep it under 80 words.",
        "ar": "أنت موظف خدمة في ورشة سيارات محترفة. أخبر العميل {name} باللغة العربية أن إصلاح سيارته اكتمل وهي جاهزة للاستلام. تفاصيل العمل: {details}. كن ودوداً ومهنياً. أقل من 80 كلمة.",
    },
    "follow_up": {
        "en": "You are a professional car bodyshop service agent. Write a friendly follow-up message to the customer named {name} to check if they are satisfied with their recent repair. Job details: {details}. Keep it under 80 words.",
        "ar": "أنت موظف خدمة في ورشة سيارات محترفة. اكتب رسالة متابعة ودية باللغة العربية للعميل {name} للتحقق من رضاه عن الإصلاح الأخير. تفاصيل العمل: {details}. أقل من 80 كلمة.",
    },
}


# ============================================================
# Health check
# ============================================================
@app.get("/")
def root():
    return {"service": "bodyshop-ai", "status": "ok", "version": "0.1.0"}


@app.get("/health")
def health():
    next_run = None
    job = scheduler.get_job("nightly_retrain")
    if job and job.next_run_time:
        next_run = job.next_run_time.strftime("%Y-%m-%d %H:%M:%S")
    return {"status": "healthy", "next_retrain": next_run}


@app.post("/retrain-inventory", dependencies=[Depends(verify_api_key)])
def trigger_retrain():
    """Manually trigger a Prophet retrain from the latest DB data."""
    try:
        retrain_prophet_models()
        return {"status": "ok", "message": "Prophet models retrained from latest DB data"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# 1. Damage Detection (YOLOv8) — TASK D
# ============================================================
@app.post("/predict-damage", dependencies=[Depends(verify_api_key)])
@limiter.limit("30/minute")
async def predict_damage(request: Request, image: UploadFile = File(...)):
    """Upload a car photo, get detected damage boxes + classes + severity score."""
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await image.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Cannot read image — unsupported format or corrupted file")

    results = yolo_model(img, verbose=False)[0]

    detections = []
    for box in results.boxes:
        cls_name = yolo_model.names[int(box.cls)]
        confidence = float(box.conf)
        x1, y1, x2, y2 = [round(float(v), 1) for v in box.xyxy[0]]
        detections.append({
            "class": cls_name,
            "confidence": round(confidence, 4),
            "bbox": [x1, y1, x2, y2],
        })

    # severity: weighted average of (class_weight * confidence), capped 0-1
    if detections:
        score_sum = sum(
            SEVERITY_WEIGHTS.get(d["class"], 0.5) * d["confidence"]
            for d in detections
        )
        count_penalty = min(len(detections) * 0.05, 0.2)  # more boxes = more severe
        severity = round(min(score_sum / len(detections) + count_penalty, 1.0), 3)
    else:
        severity = 0.0

    return {
        "filename": image.filename,
        "detections": detections,
        "detection_count": len(detections),
        "severity_score": severity,
    }


# ============================================================
# 2. Repair Time Prediction (XGBoost)
# ============================================================
class RepairFeatures(BaseModel):
    vehicle_type: str
    damage_type: str
    severity: float
    parts_count: int
    mechanic_skill: int


@app.post("/predict-time", dependencies=[Depends(verify_api_key)])
def predict_time(features: RepairFeatures):
    """Predict repair time in hours."""
    row = {"severity": features.severity,
           "parts_count": features.parts_count,
           "mechanic_skill": features.mechanic_skill,
           f"vehicle_type_{features.vehicle_type}": 1,
           f"damage_type_{features.damage_type}": 1}
    df = pd.DataFrame([row])
    for col in feature_columns:
        if col not in df.columns:
            df[col] = 0
    df = df[feature_columns]
    hours = float(time_model.predict(df)[0])
    return {"predicted_hours": round(hours, 2)}


# ============================================================
# 3. Repair Cost Prediction (XGBoost)
# ============================================================
@app.post("/predict-cost", dependencies=[Depends(verify_api_key)])
def predict_cost(features: RepairFeatures):
    """Predict repair cost in USD."""
    row = {"severity": features.severity,
           "parts_count": features.parts_count,
           "mechanic_skill": features.mechanic_skill,
           f"vehicle_type_{features.vehicle_type}": 1,
           f"damage_type_{features.damage_type}": 1}
    df = pd.DataFrame([row])
    for col in feature_columns:
        if col not in df.columns:
            df[col] = 0
    df = df[feature_columns]
    cost = float(cost_model.predict(df)[0])
    return {"predicted_cost_usd": round(cost, 2)}


# ============================================================
# 4. Mechanic Assignment (XGBoost LambdaRank) — TASK C
# ============================================================
class JobContext(BaseModel):
    job_type: str
    required_skill: int
    estimated_hours: float


@app.post("/assign-mechanic", dependencies=[Depends(verify_api_key)])
def assign_mechanic(job: JobContext):
    """Return top-3 ranked mechanics for the job."""
    rows = []
    for _, mech in mechanics_df.iterrows():
        specialty_match = int(mech["specialty"] == job.job_type)
        row = {
            "required_skill": job.required_skill,
            "estimated_hours": job.estimated_hours,
            "mechanic_skill": mech["skill_level"],
            "mechanic_workload": mech["workload"],
            "specialty_match": specialty_match,
            f"job_type_{job.job_type}": 1,
        }
        rows.append(row)

    df = pd.DataFrame(rows)
    for col in ranker_feature_columns:
        if col not in df.columns:
            df[col] = 0
    df = df[ranker_feature_columns].astype(float)

    scores = ranker.predict(df)
    mechanics_df_copy = mechanics_df.copy()
    mechanics_df_copy["score"] = scores
    top3 = mechanics_df_copy.nlargest(3, "score")

    return {
        "ranked_mechanics": [
            {
                "mechanic_id": int(row["mechanic_id"]),
                "name": row["name"],
                "specialty": row["specialty"],
                "skill_level": int(row["skill_level"]),
                "workload": float(row["workload"]),
                "score": round(float(row["score"]), 4),
            }
            for _, row in top3.iterrows()
        ]
    }


# ============================================================
# 5. Inventory Forecast (Prophet) — TASK E
# ============================================================
@app.get("/forecast-inventory", dependencies=[Depends(verify_api_key)])
def forecast_inventory(part_category: str, days: int = 30):
    """Forecast part demand for the next N days using models trained on real DB data."""
    if part_category not in prophet_models:
        raise HTTPException(status_code=400, detail=f"Unknown category. Choose from: {PROPHET_CATEGORIES}")

    model = prophet_models[part_category]
    future = model.make_future_dataframe(periods=days, freq="D")
    forecast = model.predict(future)
    total = int(forecast.tail(days)["yhat"].clip(lower=0).sum().round())

    # Pull real current stock from Neon DB
    current_stock = None
    try:
        conn = psycopg2.connect(DB_URL)
        cur  = conn.cursor()
        cur.execute("SELECT SUM(stock) FROM parts WHERE category = %s", (part_category,))
        row = cur.fetchone()
        current_stock = int(row[0]) if row and row[0] is not None else None
        cur.close()
        conn.close()
    except Exception:
        pass  # DB unavailable — fall back to threshold only

    # Low-stock: forecast demand exceeds current stock, or exceeds historical threshold
    threshold = LOW_STOCK_THRESHOLD[part_category] * days / 30
    if current_stock is not None:
        low_stock = total > current_stock
    else:
        low_stock = total > threshold

    response = {
        "part_category": part_category,
        "days": days,
        "forecast_units": total,
        "daily_avg": round(total / days, 1),
        "low_stock_alert": low_stock,
    }
    if current_stock is not None:
        response["current_stock"] = current_stock

    return response


# ============================================================
# 6. Customer Messages (Groq LLaMA) — TASK G
# ============================================================
class MessageContext(BaseModel):
    message_type: str  # "status_update", "delay", "completion", "follow_up"
    customer_name: str
    job_details: str
    language: str = "en"  # "en" or "ar"


@app.post("/generate-message", dependencies=[Depends(verify_api_key)])
@limiter.limit("20/minute")
def generate_message(request: Request, ctx: MessageContext):
    """Generate a customer message via Groq LLaMA."""
    lang = ctx.language if ctx.language in ("en", "ar") else "en"
    msg_type = ctx.message_type if ctx.message_type in PROMPTS else "status_update"

    prompt = PROMPTS[msg_type][lang].format(
        name=ctx.customer_name,
        details=ctx.job_details,
    )

    completion = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
        temperature=0.7,
    )
    message = completion.choices[0].message.content.strip()
    return {"message": message, "language": lang, "message_type": msg_type}


# ============================================================
# 7. Sentiment Analysis (DistilBERT) — TASK F
# ============================================================
class ReviewInput(BaseModel):
    text: str


@app.post("/analyze-sentiment", dependencies=[Depends(verify_api_key)])
@limiter.limit("30/minute")
def analyze_sentiment(request: Request, review: ReviewInput):
    """Analyze sentiment using fine-tuned DistilBERT (GhandourGh/bodyshop-sentiment)."""
    if sentiment_classifier is not None:
        result = sentiment_classifier(review.text[:512])[0]
        label = result["label"].lower()       # "positive" or "negative"
        score = round(float(result["score"]), 4)
        # Map to 3-class: low-confidence negative → neutral
        if label == "negative" and score < 0.65:
            label = "neutral"
        return {"sentiment": label, "confidence": score, "model": "distilbert"}

    # Fallback: Groq LLaMA if DistilBERT failed to load
    prompt = (
        f"Classify the sentiment of this customer review as exactly one word: positive, negative, or neutral.\n"
        f"Then on a new line give a confidence score between 0.0 and 1.0.\n"
        f"Reply in this exact format:\n"
        f"SENTIMENT: <word>\nCONFIDENCE: <score>\n\n"
        f"Review: {review.text}"
    )
    completion = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=20,
        temperature=0.0,
    )
    raw = completion.choices[0].message.content.strip()
    sentiment, confidence = "neutral", 0.5
    for line in raw.splitlines():
        if line.upper().startswith("SENTIMENT:"):
            sentiment = line.split(":", 1)[1].strip().lower()
        elif line.upper().startswith("CONFIDENCE:"):
            try:
                confidence = float(line.split(":", 1)[1].strip())
            except ValueError:
                pass
    return {"sentiment": sentiment, "confidence": round(confidence, 4), "model": "groq-fallback"}
