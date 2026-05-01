import pandas as pd
import numpy as np

np.random.seed(42)

JOB_TYPES = ["body_repair", "paint", "engine", "electrical", "glass", "suspension"]
SPECIALTIES = ["body_repair", "paint", "engine", "electrical", "glass", "suspension"]
SKILL_LEVELS = [1, 2, 3, 4, 5]

N_JOBS = 5000
CANDIDATES_PER_JOB = 5

rows = []
for job_id in range(N_JOBS):
    job_type = np.random.choice(JOB_TYPES)
    required_skill = np.random.randint(1, 6)
    estimated_hours = round(np.random.uniform(1, 20), 1)

    for rank in range(CANDIDATES_PER_JOB):
        mechanic_skill = np.random.randint(1, 6)
        mechanic_workload = round(np.random.uniform(0, 1), 2)  # 0=free, 1=fully loaded
        specialty_match = int(np.random.choice(SPECIALTIES) == job_type)

        # relevance: higher is better candidate
        relevance = (
            2.0 * int(mechanic_skill >= required_skill)
            + 1.5 * specialty_match
            + 1.0 * (1 - mechanic_workload)
            + 0.5 * (mechanic_skill / 5.0)
            + np.random.normal(0, 0.2)  # noise
        )
        relevance = int(np.clip(round(relevance), 0, 4))  # 0-4 graded relevance

        rows.append({
            "job_id": job_id,
            "job_type": job_type,
            "required_skill": required_skill,
            "estimated_hours": estimated_hours,
            "mechanic_skill": mechanic_skill,
            "mechanic_workload": mechanic_workload,
            "specialty_match": specialty_match,
            "relevance": relevance,
        })

df = pd.DataFrame(rows)
df.to_csv("data/mechanic_data.csv", index=False)
print(f"Saved data/mechanic_data.csv — {len(df)} rows")
print(df.head())
