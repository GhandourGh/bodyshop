import pandas as pd
import numpy as np
import joblib
from xgboost import XGBRanker
from sklearn.model_selection import GroupShuffleSplit

df = pd.read_csv("data/mechanic_data.csv")

FEATURE_COLS = ["required_skill", "estimated_hours", "mechanic_skill",
                "mechanic_workload", "specialty_match"]

# one-hot job_type
df = pd.get_dummies(df, columns=["job_type"])
feature_cols = FEATURE_COLS + [c for c in df.columns if c.startswith("job_type_")]

X = df[feature_cols].values
y = df["relevance"].values
groups = df["job_id"].values

# train/test split by job_id group
gss = GroupShuffleSplit(n_splits=1, test_size=0.15, random_state=42)
train_idx, test_idx = next(gss.split(X, y, groups))

X_train, X_test = X[train_idx], X[test_idx]
y_train, y_test = y[train_idx], y[test_idx]
groups_train = groups[train_idx]

# XGBoost requires group sizes (number of docs per query) sorted by group
train_df = df.iloc[train_idx].copy()
group_sizes = train_df.groupby("job_id").size().values

ranker = XGBRanker(
    objective="rank:ndcg",
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
)
ranker.fit(X_train, y_train, group=group_sizes)

# quick eval: ndcg proxy — check rank correlation on test jobs
test_df = df.iloc[test_idx].copy()
test_df["score"] = ranker.predict(X_test)
ndcg_list = []
for job_id, grp in test_df.groupby("job_id"):
    pred_rank = grp["score"].rank(ascending=False)
    true_rank = grp["relevance"].rank(ascending=False)
    corr = pred_rank.corr(true_rank, method="spearman")
    if not np.isnan(corr):
        ndcg_list.append(corr)
print(f"Mean Spearman rank corr on test jobs: {np.mean(ndcg_list):.3f}")

joblib.dump(ranker, "app/models/ranker.pkl")
joblib.dump(feature_cols, "app/models/ranker_feature_columns.pkl")
print("Saved: ranker.pkl, ranker_feature_columns.pkl")
