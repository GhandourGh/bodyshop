import pandas as pd
import numpy as np

np.random.seed(7)

SPECIALTIES = ["body_repair", "paint", "engine", "electrical", "glass", "suspension"]
NAMES = [
    "Ali Hassan", "Karim Nasser", "Hassan Faour", "Omar Khalil", "Samir Khoury",
    "Rami Aziz", "Tarek Mansour", "Bilal Haddad", "Jad Saad", "Nabil Frem",
    "Wissam Bou Malhab", "Elias Geagea", "Georges Abi Nader", "Fadi Karam", "Michel Hayek",
    "Antoine Gemayel", "Rabih Sleiman", "Charbel Murr", "Pierre Nasr", "Maroun Azar",
]

mechanics = []
for i, name in enumerate(NAMES):
    mechanics.append({
        "mechanic_id": i + 1,
        "name": name,
        "skill_level": np.random.randint(2, 6),
        "specialty": np.random.choice(SPECIALTIES),
        "workload": round(np.random.uniform(0.1, 0.8), 2),
    })

df = pd.DataFrame(mechanics)
df.to_csv("data/mechanics.csv", index=False)
print(f"Saved data/mechanics.csv — {len(df)} mechanics")
print(df.to_string(index=False))
