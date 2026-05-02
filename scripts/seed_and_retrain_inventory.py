"""
Seed Neon DB with 6 months of realistic parts usage history,
then retrain Prophet models on that real data.
"""
import psycopg2
import uuid
import random
import joblib
import pandas as pd
import numpy as np
from datetime import date, timedelta
from prophet import Prophet
import warnings
warnings.filterwarnings("ignore")

DB_URL = "postgresql://neondb_owner:npg_NXYP1TAfi2ah@ep-frosty-math-anpkorcc.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"
MODEL_DIR = "app/models"

# ── Part categories and their realistic weekly usage rates ──────────────────
CATEGORIES = {
    "bumpers":     {"mean": 4.5, "std": 1.5, "seasonal_peak": [1, 2, 11, 12]},
    "headlights":  {"mean": 3.0, "std": 1.2, "seasonal_peak": [10, 11, 12, 1]},
    "body-panels": {"mean": 5.5, "std": 2.0, "seasonal_peak": [3, 4, 5, 6]},
    "mirrors":     {"mean": 2.5, "std": 1.0, "seasonal_peak": [6, 7, 8]},
    "windshields": {"mean": 2.0, "std": 0.8, "seasonal_peak": [1, 2, 12]},
}

# Map categories to the actual parts in the DB (or create new ones)
CATEGORY_PARTS = {
    "bumpers":     ("Front Bumper (OEM)",      350.00),
    "headlights":  ("Headlight Unit (Left)",   280.00),
    "body-panels": ("Door Panel (Front Right)", 340.00),
    "mirrors":     ("Side Mirror Assembly",     95.00),
    "windshields": ("Windshield (OEM)",         650.00),
}

def generate_daily_usage(category: str, start: date, end: date) -> list[tuple[date, int]]:
    """Generate realistic daily parts usage with trend + seasonality + noise."""
    cfg = CATEGORIES[category]
    records = []
    day = start
    while day <= end:
        # Seasonal multiplier
        month = day.month
        seasonal = 1.3 if month in cfg["seasonal_peak"] else 1.0
        # Weekend dip
        weekend = 0.3 if day.weekday() >= 5 else 1.0
        # Gradual growth trend (business growing over 6 months)
        days_elapsed = (day - start).days
        trend = 1.0 + (days_elapsed / 180) * 0.15
        # Final usage
        mean = cfg["mean"] / 7 * seasonal * weekend * trend
        usage = max(0, int(np.random.poisson(max(0.1, mean))))
        if usage > 0:
            records.append((day, usage))
        day += timedelta(days=1)
    return records

def main():
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()

    print("── Step 1: Ensure parts exist with correct categories ──")

    # Add category column if not there (safe to ignore if exists)
    try:
        cur.execute("ALTER TABLE parts ADD COLUMN IF NOT EXISTS category VARCHAR(50)")
        conn.commit()
        print("  Added 'category' column to parts table")
    except Exception as e:
        conn.rollback()
        print(f"  category column already exists or error: {e}")

    # Upsert one part per category
    part_ids = {}
    for cat, (name, price) in CATEGORY_PARTS.items():
        cur.execute("SELECT id FROM parts WHERE name = %s", (name,))
        row = cur.fetchone()
        if row:
            pid = row[0]
            cur.execute("UPDATE parts SET category = %s WHERE id = %s", (cat, pid))
        else:
            pid = str(uuid.uuid4())
            cur.execute(
                "INSERT INTO parts (id, name, stock, price, category) VALUES (%s, %s, %s, %s, %s)",
                (pid, name, random.randint(3, 15), price, cat)
            )
        part_ids[cat] = pid
        print(f"  {cat}: part_id = {pid}")
    conn.commit()

    print("\n── Step 2: Create parts_usage table if not exists ──")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS parts_usage (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            part_id    UUID REFERENCES parts(id),
            category   VARCHAR(50),
            used_on    DATE NOT NULL,
            quantity   INT NOT NULL
        )
    """)
    # Clear old seeded data to allow re-runs
    cur.execute("DELETE FROM parts_usage WHERE used_on < CURRENT_DATE")
    conn.commit()
    print("  parts_usage table ready")

    print("\n── Step 3: Seed 6 months of daily usage data ──")
    end_date   = date.today() - timedelta(days=1)
    start_date = end_date - timedelta(days=180)
    total_rows = 0

    for cat, pid in part_ids.items():
        daily = generate_daily_usage(cat, start_date, end_date)
        for (day, qty) in daily:
            cur.execute(
                "INSERT INTO parts_usage (part_id, category, used_on, quantity) VALUES (%s, %s, %s, %s)",
                (pid, cat, day, qty)
            )
        total_rows += len(daily)
        print(f"  {cat}: {len(daily)} daily records inserted")

    conn.commit()
    print(f"  Total rows inserted: {total_rows}")

    print("\n── Step 4: Pull data back and retrain Prophet models ──")
    for cat in CATEGORIES:
        cur.execute("""
            SELECT used_on, SUM(quantity) as total
            FROM parts_usage
            WHERE category = %s
            GROUP BY used_on
            ORDER BY used_on
        """, (cat,))
        rows = cur.fetchall()

        df = pd.DataFrame(rows, columns=["ds", "y"])
        df["ds"] = pd.to_datetime(df["ds"])
        df["y"]  = df["y"].astype(float)

        print(f"  Training {cat}: {len(df)} days of data, avg {df['y'].mean():.2f}/day")

        model = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=True,
            daily_seasonality=False,
            seasonality_mode="multiplicative",
            changepoint_prior_scale=0.05,
        )
        model.fit(df)

        out_path = f"{MODEL_DIR}/prophet_{cat}.pkl"
        joblib.dump(model, out_path)
        print(f"  Saved → {out_path}")

    cur.close()
    conn.close()

    print("\n── Step 5: Verify new models work ──")
    for cat in CATEGORIES:
        model = joblib.load(f"{MODEL_DIR}/prophet_{cat}.pkl")
        future = model.make_future_dataframe(periods=30)
        forecast = model.predict(future)
        predicted = forecast["yhat"].tail(30).clip(lower=0).sum()
        print(f"  {cat}: 30-day forecast = {predicted:.0f} units")

    print("\n✅ Done — Prophet models retrained on real Neon DB data!")

if __name__ == "__main__":
    random.seed(42)
    np.random.seed(42)
    main()
