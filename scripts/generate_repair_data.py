"""
Synthetic data generator for repair time + cost prediction.
Generates 10,000 realistic-looking rows based on industry patterns.

Why synthetic? No public bodyshop dataset exists for free.
Production would retrain on real shop data.
"""

import numpy as np
import pandas as pd
from pathlib import Path

np.random.seed(42)  # reproducible

N_ROWS = 10_000

# --- Categorical features ---
VEHICLE_TYPES = ["sedan", "suv", "truck", "hatchback", "luxury"]
DAMAGE_TYPES = ["dent", "scratch", "broken", "multiple"]

# Base hours and cost multipliers per vehicle type
VEHICLE_FACTOR = {
    "sedan": 1.0,
    "suv": 1.2,
    "truck": 1.3,
    "hatchback": 0.9,
    "luxury": 1.8,  # luxury = expensive parts + careful work
}

DAMAGE_FACTOR = {
    "dent": 1.0,
    "scratch": 0.6,    # easier
    "broken": 1.8,     # harder, needs replacement
    "multiple": 2.4,   # multiple issues
}


def generate():
    rows = []
    for _ in range(N_ROWS):
        vehicle_type = np.random.choice(VEHICLE_TYPES)
        damage_type = np.random.choice(DAMAGE_TYPES)
        severity = np.round(np.random.uniform(0.1, 1.0), 2)  # 0.1-1.0
        parts_count = np.random.randint(1, 8)
        mechanic_skill = np.random.randint(1, 6)  # 1-5

        # Base time = function of all features + noise
        base_hours = (
            2.0
            * VEHICLE_FACTOR[vehicle_type]
            * DAMAGE_FACTOR[damage_type]
            * (0.5 + severity)
            * (1 + 0.3 * parts_count)
            / (0.7 + 0.1 * mechanic_skill)
        )
        hours = max(0.5, base_hours + np.random.normal(0, 0.8))

        # Cost = parts + labor (labor = $40/hr base, scaled by skill)
        labor_rate = 40 + 8 * mechanic_skill
        parts_cost = parts_count * np.random.uniform(30, 120) * VEHICLE_FACTOR[vehicle_type]
        cost = labor_rate * hours + parts_cost + np.random.normal(0, 25)
        cost = max(50, cost)

        rows.append({
            "vehicle_type": vehicle_type,
            "damage_type": damage_type,
            "severity": severity,
            "parts_count": parts_count,
            "mechanic_skill": mechanic_skill,
            "hours": round(hours, 2),
            "cost_usd": round(cost, 2),
        })

    df = pd.DataFrame(rows)

    # Save to data folder
    out_path = Path(__file__).parent.parent / "data" / "repair_data.csv"
    out_path.parent.mkdir(exist_ok=True)
    df.to_csv(out_path, index=False)

    print(f"✅ Generated {len(df)} rows → {out_path}")
    print("\nSample:")
    print(df.head())
    print("\nStats:")
    print(df.describe())


if __name__ == "__main__":
    generate()