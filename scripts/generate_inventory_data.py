import pandas as pd
import numpy as np
from datetime import date, timedelta

np.random.seed(42)

CATEGORIES = ["bumpers", "headlights", "body-panels", "mirrors", "windshields"]
START = date(2024, 1, 1)
DAYS = 548  # ~18 months

BASE_DEMAND = {"bumpers": 6, "headlights": 4, "body-panels": 8, "mirrors": 3, "windshields": 2}

rows = []
for cat in CATEGORIES:
    base = BASE_DEMAND[cat]
    for i in range(DAYS):
        d = START + timedelta(days=i)
        weekly  = 1.3 if d.weekday() < 5 else 0.4          # weekday spike
        monthly = 1.2 if d.day <= 10 else (0.9 if d.day <= 20 else 1.1)
        noise   = np.random.poisson(base * weekly * monthly)
        rows.append({"ds": d.isoformat(), "y": max(0, noise), "category": cat})

df = pd.DataFrame(rows)
df.to_csv("data/inventory_history.csv", index=False)
print(f"Saved data/inventory_history.csv — {len(df)} rows")
print(df.groupby("category")["y"].describe().round(1))
