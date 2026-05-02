"""
Fine-tune DistilBERT on amazon_polarity (small subset) for sentiment analysis.
Pushes the trained model to HuggingFace Hub as GhandourGh/bodyshop-sentiment.
"""
import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from datasets import load_dataset
from transformers import (
    DistilBertTokenizerFast,
    DistilBertForSequenceClassification,
    Trainer,
    TrainingArguments,
)
from huggingface_hub import HfApi
import numpy as np
import torch

HF_TOKEN    = os.getenv("HF_TOKEN", "")  # set in .env
HF_REPO     = "GhandourGh/bodyshop-sentiment"
MODEL_NAME  = "distilbert-base-uncased"
TRAIN_N     = 800   # small — runs in ~3–5 min on CPU
EVAL_N      = 200

print("── Step 1: Load dataset (amazon_polarity subset) ──")
raw = load_dataset("amazon_polarity", split="train", streaming=True)
rows = []
for item in raw:
    rows.append(item)
    if len(rows) >= TRAIN_N + EVAL_N:
        break

from datasets import Dataset
full = Dataset.from_list(rows)
split = full.train_test_split(test_size=EVAL_N, seed=42)
train_ds, eval_ds = split["train"], split["test"]
print(f"  Train: {len(train_ds)}, Eval: {len(eval_ds)}")

print("\n── Step 2: Tokenize ──")
tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_NAME)

def tokenize(batch):
    return tokenizer(batch["content"], truncation=True, padding="max_length", max_length=128)

train_ds = train_ds.map(tokenize, batched=True)
eval_ds  = eval_ds.map(tokenize, batched=True)

train_ds = train_ds.rename_column("label", "labels")
eval_ds  = eval_ds.rename_column("label", "labels")
train_ds.set_format("torch", columns=["input_ids", "attention_mask", "labels"])
eval_ds.set_format("torch",  columns=["input_ids", "attention_mask", "labels"])

print("\n── Step 3: Load model ──")
model = DistilBertForSequenceClassification.from_pretrained(
    MODEL_NAME,
    num_labels=2,
    id2label={0: "negative", 1: "positive"},
    label2id={"negative": 0, "positive": 1},
)

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    acc = (preds == labels).mean()
    return {"accuracy": float(acc)}

print("\n── Step 4: Train (1 epoch on CPU) ──")
args = TrainingArguments(
    output_dir="./tmp_sentiment",
    num_train_epochs=1,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=32,
    eval_strategy="epoch",
    save_strategy="no",
    logging_steps=50,
    report_to="none",
    push_to_hub=False,
    use_cpu=True,
)

trainer = Trainer(
    model=model,
    args=args,
    train_dataset=train_ds,
    eval_dataset=eval_ds,
    compute_metrics=compute_metrics,
)
trainer.train()

print("\n── Step 5: Push to HuggingFace Hub ──")
api = HfApi()
api.create_repo(repo_id=HF_REPO, token=HF_TOKEN, exist_ok=True, private=False)

model.push_to_hub(HF_REPO, token=HF_TOKEN)
tokenizer.push_to_hub(HF_REPO, token=HF_TOKEN)
print(f"  ✅ Pushed to https://huggingface.co/{HF_REPO}")

print("\n── Step 6: Quick smoke test ──")
from transformers import pipeline
clf = pipeline("text-classification", model=HF_REPO, token=HF_TOKEN)
tests = [
    "The repair was done perfectly, very happy!",
    "Terrible service, took 3 weeks and still broken.",
    "It was okay, nothing special.",
]
for t in tests:
    r = clf(t)[0]
    print(f"  [{r['label']} {r['score']:.2f}]  {t}")

print("\n✅ Done — DistilBERT sentiment model live on HF Hub!")
