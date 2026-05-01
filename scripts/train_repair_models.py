import pandas as pd
import numpy as np
import joblib
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

DATA_PATH = "data/repair_data.csv"
MODEL_DIR = "app/models"

df = pd.read_csv(DATA_PATH)

df = pd.get_dummies(df, columns=["vehicle_type", "damage_type"])

feature_cols = [c for c in df.columns if c not in ("hours", "cost_usd")]

X = df[feature_cols]
y_time = df["hours"]
y_cost = df["cost_usd"]

X_train, X_test, yt_train, yt_test, yc_train, yc_test = train_test_split(
    X, y_time, y_cost, test_size=0.15, random_state=42
)

time_model = XGBRegressor(n_estimators=300, max_depth=6, learning_rate=0.05,
                           subsample=0.8, colsample_bytree=0.8, random_state=42)
time_model.fit(X_train, yt_train)
mae_time = mean_absolute_error(yt_test, time_model.predict(X_test))
print(f"Time MAE: {mae_time:.3f} hours")

cost_model = XGBRegressor(n_estimators=300, max_depth=6, learning_rate=0.05,
                           subsample=0.8, colsample_bytree=0.8, random_state=42)
cost_model.fit(X_train, yc_train)
mae_cost = mean_absolute_error(yc_test, cost_model.predict(X_test))
print(f"Cost MAE: ${mae_cost:.2f}")

joblib.dump(time_model, f"{MODEL_DIR}/time_model.pkl")
joblib.dump(cost_model, f"{MODEL_DIR}/cost_model.pkl")
joblib.dump(feature_cols, f"{MODEL_DIR}/feature_columns.pkl")

print("Saved: time_model.pkl, cost_model.pkl, feature_columns.pkl")
