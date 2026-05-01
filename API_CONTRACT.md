# Bodyshop AI — API Contract

**Base URL:** `http://localhost:8000` (dev) / `http://<docker-host>:8000` (prod)  
**Format:** All requests and responses are JSON unless noted.  
**Owner:** Dowr (AI Engineer)

---

## Endpoints

### 1. `POST /predict-damage`
Detects damage in a car photo using YOLOv8.

**Request:** `multipart/form-data`
| Field | Type | Description |
|-------|------|-------------|
| image | file | Car photo (jpg, png, webp) |

**Response:**
```json
{
  "filename": "car.jpg",
  "detections": [
    { "class": "bonnet-dent", "confidence": 0.931, "bbox": [36.7, 45.4, 231.0, 93.1] },
    { "class": "front-bumper-dent", "confidence": 0.544, "bbox": [84.1, 102.2, 226.5, 158.6] }
  ],
  "detection_count": 2,
  "severity_score": 0.48
}
```

**Notes:**
- `bbox` format: `[x1, y1, x2, y2]` in pixels
- `severity_score`: 0.0 (none) → 1.0 (critical)
- Returns empty `detections` array if no damage found

**Errors:**
| Code | Reason |
|------|--------|
| 400 | File is not an image |
| 422 | No file uploaded |

---

### 2. `POST /predict-time`
Predicts repair time in hours using XGBoost.

**Request:**
```json
{
  "vehicle_type": "sedan",
  "damage_type": "dent",
  "severity": 0.4,
  "parts_count": 3,
  "mechanic_skill": 4
}
```

| Field | Type | Values |
|-------|------|--------|
| vehicle_type | string | `sedan`, `suv`, `truck`, `hatchback`, `luxury`, `van` |
| damage_type | string | `dent`, `scratch`, `crack`, `paint`, `multiple` |
| severity | float | 0.0 – 1.0 |
| parts_count | int | 1 – 20 |
| mechanic_skill | int | 1 – 5 |

**Response:**
```json
{ "predicted_hours": 3.75 }
```

**Errors:**
| Code | Reason |
|------|--------|
| 422 | Missing or invalid field |

---

### 3. `POST /predict-cost`
Predicts repair cost in USD using XGBoost.

**Request:** Same schema as `/predict-time`

**Response:**
```json
{ "predicted_cost_usd": 412.50 }
```

---

### 4. `POST /assign-mechanic`
Returns top-3 ranked mechanics for a job using XGBoost LambdaRank.

**Request:**
```json
{
  "job_type": "paint",
  "required_skill": 4,
  "estimated_hours": 6.0
}
```

| Field | Type | Values |
|-------|------|--------|
| job_type | string | `body_repair`, `paint`, `engine`, `electrical`, `glass`, `suspension` |
| required_skill | int | 1 – 5 |
| estimated_hours | float | any positive number |

**Response:**
```json
{
  "ranked_mechanics": [
    {
      "mechanic_id": 14,
      "name": "Fadi Karam",
      "specialty": "body_repair",
      "skill_level": 5,
      "workload": 0.24,
      "score": 0.6314
    },
    { "mechanic_id": 19, "name": "Pierre Nasr", "specialty": "paint", "skill_level": 5, "workload": 0.35, "score": 0.5901 },
    { "mechanic_id": 20, "name": "Maroun Azar", "specialty": "paint", "skill_level": 5, "workload": 0.36, "score": 0.5744 }
  ]
}
```

**Notes:**
- `score` is a relative ranking score, not a probability
- Always returns exactly 3 mechanics

---

### 5. `GET /forecast-inventory`
Forecasts part demand for the next N days using Prophet.

**Query Parameters:**
| Param | Type | Required | Values |
|-------|------|----------|--------|
| part_category | string | yes | `bumpers`, `headlights`, `body-panels`, `mirrors`, `windshields` |
| days | int | no (default: 30) | `30`, `60`, `90` |

**Example:** `GET /forecast-inventory?part_category=bumpers&days=30`

**Response:**
```json
{
  "part_category": "bumpers",
  "days": 30,
  "forecast_units": 200,
  "daily_avg": 6.7,
  "low_stock_alert": true
}
```

**Errors:**
| Code | Reason |
|------|--------|
| 400 | Unknown part_category |

---

### 6. `POST /generate-message`
Generates a customer-facing message using LLaMA 3.1 via Groq.

**Request:**
```json
{
  "message_type": "status_update",
  "customer_name": "Ahmad Khalil",
  "job_details": "2022 BMW X5, front bumper dent, estimated 3 days",
  "language": "en"
}
```

| Field | Type | Values |
|-------|------|--------|
| message_type | string | `status_update`, `delay`, `completion`, `follow_up` |
| customer_name | string | any |
| job_details | string | any |
| language | string | `en` (English), `ar` (Arabic) |

**Response:**
```json
{
  "message": "Hi Ahmad, just a quick update on your BMW X5...",
  "language": "en",
  "message_type": "status_update"
}
```

---

### 7. `POST /analyze-sentiment`
Classifies sentiment of a customer review using LLaMA 3.1 via Groq.

**Request:**
```json
{ "text": "The repair was done perfectly and ahead of schedule. Very happy!" }
```

**Response:**
```json
{
  "sentiment": "positive",
  "confidence": 0.97
}
```

**Notes:**
- `sentiment` values: `positive`, `negative`, `neutral`
- `confidence`: 0.0 – 1.0

---

## Health Check

`GET /` → `{ "service": "bodyshop-ai", "status": "ok", "version": "0.1.0" }`  
`GET /health` → `{ "status": "healthy" }`

---

## Running Locally

```bash
uvicorn main:app --reload --port 8000
```

## Running via Docker

```bash
docker run -p 8000:8000 -e GROQ_API_KEY=your_key bodyshop-ai
```
