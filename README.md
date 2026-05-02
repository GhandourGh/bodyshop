# Bodyshop AI — Car Bodyshop Management System

A full-stack AI-powered car bodyshop management platform built as part of a 3-person internship project.

**Team:**
- **Dowr (Ghandour)** — AI Engineer (FastAPI microservice, 7 ML models)
- **Samer** — Backend Engineer (Next.js API, Prisma, PostgreSQL)
- **Mohamad** — Frontend Engineer (React/Vite UI)

---

## Architecture Overview

```
autoforge-frontend/    → React + Vite + TypeScript (port 5173)
intern-db/             → Next.js + Prisma + Neon PostgreSQL (port 3000)
main.py                → FastAPI AI Microservice (port 8000)
```

The frontend proxies `/backend/*` to the Next.js server and calls the FastAPI service directly at `http://localhost:8000`.

---

## AI Microservice (FastAPI) — `main.py`

### Models

| Model | File | Technology | Performance |
|-------|------|------------|-------------|
| Damage Detection | `app/models/best.pt` | YOLOv8n (Roboflow dataset) | 5 damage classes |
| Repair Time | `app/models/time_model.pkl` | XGBoost | MAE 0.679 hrs |
| Repair Cost | `app/models/cost_model.pkl` | XGBoost | MAE $128 |
| Mechanic Ranker | `app/models/ranker.pkl` | XGBoost LambdaRank | Spearman 0.846 |
| Inventory Forecast | `app/models/prophet_*.pkl` ×5 | Facebook Prophet | 5 part categories |
| Customer Messages | Groq API | LLaMA-3.1-8b | EN + AR |
| Sentiment Analysis | `GhandourGh/bodyshop-sentiment` | Fine-tuned DistilBERT | amazon_polarity |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/health` | Scheduler + model status |
| POST | `/predict-damage` | YOLOv8 damage detection from car photo |
| POST | `/predict-time` | XGBoost repair time prediction (hours) |
| POST | `/predict-cost` | XGBoost repair cost prediction (USD) |
| POST | `/assign-mechanic` | LambdaRank mechanic recommendation |
| GET | `/forecast-inventory` | Prophet 30/60/90-day parts forecast |
| POST | `/generate-message` | AI customer message (EN/AR) |
| POST | `/analyze-sentiment` | DistilBERT sentiment analysis |
| POST | `/retrain-inventory` | Manual Prophet model retrain |

### Auto-Retraining

Prophet inventory models retrain **nightly at 02:00** via APScheduler, pulling live usage data from the Neon PostgreSQL database. A manual retrain is also available via `POST /retrain-inventory`.

### Run the AI Service

```bash
cd bodyshop-ai
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Run with Docker

```bash
docker build -t bodyshop-ai .
docker run -p 8000:8000 \
  -e GROQ_API_KEY=your_key \
  -e DATABASE_URL=your_neon_url \
  -e HF_TOKEN=your_hf_token \
  bodyshop-ai
```

### Environment Variables

```env
GROQ_API_KEY=       # Groq API key for LLaMA
DATABASE_URL=       # Neon PostgreSQL connection string
HF_TOKEN=           # HuggingFace token (for DistilBERT)
```

---

## Backend API (Next.js + Prisma) — `intern-db/`

Built on Next.js App Router with Prisma ORM and Neon PostgreSQL.

### API Routes

| Resource | Endpoints |
|----------|-----------|
| Auth | `POST /api/auth/login`, `POST /api/auth/register` |
| Jobs | `GET/POST /api/jobs`, `GET/PUT /api/jobs/[id]`, `/api/jobs/[id]/status`, `/api/jobs/[id]/assign-mechanic` |
| Customers | `GET/POST /api/customers`, `GET/PUT /api/customers/[id]` |
| Vehicles | `GET/POST /api/vehicles`, `GET/PUT /api/vehicles/[id]` |
| Mechanics | `GET/POST /api/mechanics`, `GET/PUT /api/mechanics/[id]` |
| Parts | `GET/POST /api/parts`, `GET/PUT /api/parts/[id]`, `PUT /api/parts/[id]/stock` |
| Messages | `GET/POST /api/messages`, `GET /api/messages/[jobId]` |
| Damage Reports | `GET/POST /api/damage-reports` |
| AI | `POST /api/ai/trigger`, `GET /api/ai/predictions`, `GET /api/ai/predictions/[jobId]` |
| Analytics | `GET /api/analytics/overview` |
| Users | `GET /api/users/me`, `GET/PUT /api/users/[id]` |

### Database Schema

9 Prisma models: `User`, `Customer`, `Vehicle`, `Job`, `Mechanic`, `Part`, `Message`, `DamageReport`, `AiPrediction`

### Run the Backend

```bash
cd intern-db
npm install
npx prisma generate
npm run dev
```

---

## Frontend (React + Vite) — `autoforge-frontend/`

Dark glassmorphism UI with Space Grotesk display font, electric blue + neon orange accent palette.

### Pages

| Route | Page |
|-------|------|
| `/` | Landing page (public) |
| `/ai-demo` | Interactive AI demo — all 7 endpoints |
| `/login` | Admin login |
| `/forgot-password` | Password reset |
| `/admin/dashboard` | Metrics, charts, recent jobs |
| `/admin/jobs` | Jobs table, New Job modal, Excel export |
| `/admin/customers` | Customer management |
| `/admin/vehicles` | Vehicle registry + damage upload |
| `/admin/mechanics` | Mechanic roster with skill ratings |
| `/admin/inventory` | Parts stock + Prophet forecast charts |
| `/admin/ai` | Full AI control panel |
| `/admin/messages` | AI message generator (EN/AR) |
| `/admin/finance` | Revenue, invoices, Excel export |
| `/admin/audit` | System audit log |
| `/admin/integrations` | Service health + API status |
| `/admin/settings` | Configuration |

### Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui
- Framer Motion (scroll-triggered animations)
- TanStack React Query
- Recharts (line, area, pie charts)
- Axios
- Playwright (52 automated tests, all passing)

### Run the Frontend

```bash
cd autoforge-frontend
npm install
npm run dev
```

Open `http://localhost:5173`

**Demo login:** `admin@autoforge.com` / `password123`

---

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/seed_and_retrain_inventory.py` | Seed 6 months of parts usage data + retrain Prophet |
| `scripts/finetune_sentiment.py` | Fine-tune DistilBERT + push to HuggingFace Hub |
| `scripts/train_repair_models.py` | Train XGBoost repair time + cost models |
| `scripts/train_ranker.py` | Train LambdaRank mechanic ranker |

---

## Start All Servers

Open 3 terminals:

```bash
# Terminal 1 — FastAPI AI
cd bodyshop-ai && source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2 — Next.js Backend
cd bodyshop-ai/intern-db
npm run dev

# Terminal 3 — React Frontend
cd bodyshop-ai/autoforge-frontend
npm run dev
```

Then open `http://localhost:5173`

---

## API Contract

See [API_CONTRACT.md](./API_CONTRACT.md) for full request/response examples for all 7 AI endpoints.
