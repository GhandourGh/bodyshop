import pandas as pd
import joblib
from prophet import Prophet

df = pd.read_csv("data/inventory_history.csv")
CATEGORIES = df["category"].unique()

for cat in CATEGORIES:
    sub = df[df["category"] == cat][["ds", "y"]].copy()
    sub["ds"] = pd.to_datetime(sub["ds"])

    m = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        changepoint_prior_scale=0.1,
        seasonality_prior_scale=5.0,
    )
    m.fit(sub)

    path = f"app/models/prophet_{cat}.pkl"
    joblib.dump(m, path)
    print(f"Saved {path}")

print("All Prophet models saved.")
