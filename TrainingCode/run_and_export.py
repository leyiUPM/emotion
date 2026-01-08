from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
)
import torch
from datasets import load_dataset
import numpy as np
import csv
import argparse
import os
import json

DATASET_NAME = "google-research-datasets/go_emotions"
MODEL_NAME = "google/electra-small-discriminator"

dataset = load_dataset(DATASET_NAME, "simplified")
label_names = dataset["train"].features["labels"].feature.names
num_labels = len(label_names)

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)


def multi_hot_encode(samples):
    multi_hot = np.zeros(num_labels)

    for label in samples["labels"]:
        multi_hot[label] = 1

    return {"labels": multi_hot.tolist()}


dataset = dataset.map(multi_hot_encode)


def tokenize(examples):
    return tokenizer(
        examples["text"], padding="max_length", truncation=True, max_length=128
    )


tokenized_dataset = dataset.map(tokenize, batched=True)
tokenized_dataset.set_format("torch")

""" 
NOTE
just want to check the result without running whole 30 minutes, 
please comment out these two lines when you do the training,
you can also use this to make sure the code works
"""
# tokenized_dataset["train"] = tokenized_dataset["train"].select(range(10))
# tokenized_dataset["test"] = tokenized_dataset["test"].select(range(10))

convert_to_float = lambda sample: {"float_labels": sample["labels"].to(torch.float)}
tokenized_dataset = tokenized_dataset.map(
    convert_to_float, remove_columns=["labels"]
).rename_column("float_labels", "labels")

from sklearn.metrics import f1_score


def compute_metrics(eval_pred):
    logits, labels = eval_pred

    probs = torch.sigmoid(torch.as_tensor(logits))
    preds = (probs > 0.5).int().numpy()
    labels = labels.astype(int)

    f1_macro = f1_score(labels, preds, average="macro")
    f1_micro = f1_score(labels, preds, average="micro")

    hamming_accuracy = (
        preds == labels
    ).mean()  # per-label accuracy instead of exact-match

    exact_match_accuracy = (preds == labels).all(axis=1).mean()

    return {
        "hamming_accuracy": hamming_accuracy,
        "f1_macro": f1_macro,
        "f1_micro": f1_micro,
        "exact_match_accuracy": exact_match_accuracy,
    }


# returns metrics hamming accuracy, f1_macro, f1_micro
def run(
    learning_rate=1e-4, batch_size=32, epoches=2, export_dir="./exported_emotion_model"
):
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME, num_labels=num_labels, problem_type="multi_label_classification"
    )
    seed = np.random.randint(0, 1_000_000)
    args = TrainingArguments(
        output_dir=f"./runs",
        learning_rate=learning_rate,
        per_device_train_batch_size=batch_size,
        num_train_epochs=epoches,
        eval_strategy="epoch",
        save_strategy="no",  # to manual save
        fp16=torch.cuda.is_available(),  # change to True if you have GPU
    )
    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=tokenized_dataset["train"],
        eval_dataset=tokenized_dataset["validation"],
        compute_metrics=compute_metrics,
    )
    trainer.train()
    trainer.save_model(export_dir)
    tokenizer.save_pretrained(export_dir)
    with open(f"{export_dir}/label_names.json", "w") as f:
        json.dump(label_names, f)
    return export_dir


if __name__ == "__main__":
    run()
