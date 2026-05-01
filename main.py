"""
Bodyshop AI Microservice
Owner: Dowr (AI Engineer)
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import os
import io
from PIL import Image
from ultralytics import YOLO
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = FastAPI(
    title="Bodyshop AI Service",
    description="7 ML endpoints powering the Car Bodyshop Management System",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


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
    return {"status": "healthy"}


# ============================================================
# 1. Damage Detection (YOLOv8) — TASK D
# ============================================================
@app.post("/predict-damage")
async def predict_damage(image: UploadFile = File(...)):
    """Upload a car photo, get detected damage boxes + classes + severity score."""
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await image.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")

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


@app.post("/predict-time")
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
@app.post("/predict-cost")
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


@app.post("/assign-mechanic")
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
@app.get("/forecast-inventory")
def forecast_inventory(part_category: str, days: int = 30):
    """Forecast part demand for the next N days."""
    if part_category not in prophet_models:
        raise HTTPException(status_code=400, detail=f"Unknown category. Choose from: {PROPHET_CATEGORIES}")

    model = prophet_models[part_category]
    future = model.make_future_dataframe(periods=days, freq="D")
    forecast = model.predict(future)
    total = int(forecast.tail(days)["yhat"].clip(lower=0).sum().round())
    low_stock = total > LOW_STOCK_THRESHOLD[part_category] * days / 30

    return {
        "part_category": part_category,
        "days": days,
        "forecast_units": total,
        "daily_avg": round(total / days, 1),
        "low_stock_alert": low_stock,
    }


# ============================================================
# 6. Customer Messages (Groq LLaMA) — TASK G
# ============================================================
class MessageContext(BaseModel):
    message_type: str  # "status_update", "delay", "completion", "follow_up"
    customer_name: str
    job_details: str
    language: str = "en"  # "en" or "ar"


@app.post("/generate-message")
def generate_message(ctx: MessageContext):
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


@app.post("/analyze-sentiment")
def analyze_sentiment(review: ReviewInput):
    """Analyze sentiment of a customer review via LLaMA."""
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
    return {"sentiment": sentiment, "confidence": round(confidence, 4)}
