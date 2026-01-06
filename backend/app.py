import os
import time
import json
from typing import Optional, List, Dict, Any

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification

DEFAULT_MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
MODEL_DIR = os.environ.get("MODEL_DIR", DEFAULT_MODEL_DIR)

app = FastAPI(title="Emotion Model API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_tokenizer: Optional[AutoTokenizer] = None
_model: Optional[AutoModelForSequenceClassification] = None
_label_names: Optional[List[str]] = None


def _load() -> None:
    """Load tokenizer/model/labels once."""
    global _tokenizer, _model, _label_names
    if _tokenizer is not None and _model is not None and _label_names is not None:
        return

    if not os.path.isdir(MODEL_DIR):
        raise RuntimeError(
            f"MODEL_DIR does not exist: {MODEL_DIR}. Copy your exported model folder into backend/model or set MODEL_DIR env var."
        )

    label_path = os.path.join(MODEL_DIR, "label_names.json")
    if not os.path.isfile(label_path):
        raise RuntimeError(
            f"Missing label_names.json in {MODEL_DIR}. Make sure you exported it from training."
        )

    with open(label_path, "r", encoding="utf-8") as f:
        _label_names = json.load(f)

    _tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    _model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    _model.eval()


class PredictIn(BaseModel):
    text: str
    threshold: Optional[float] = 0.2
    top_k: Optional[int] = 5


@app.get("/health")
def health() -> Dict[str, Any]:
    try:
        _load()
        return {"ok": True, "model_dir": MODEL_DIR, "labels": len(_label_names or [])}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.post("/predict")
def predict(inp: PredictIn) -> Dict[str, Any]:
    try:
        _load()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    threshold = float(inp.threshold) if inp.threshold is not None else 0.5
    top_k = int(inp.top_k or 5)
    top_k = max(1, min(20, top_k))

    start = time.perf_counter()
    inputs = _tokenizer(
        inp.text,
        return_tensors="pt",
        truncation=True,
        max_length=128,
    )

    with torch.no_grad():
        logits = _model(**inputs).logits[0]
        probs = torch.sigmoid(logits).tolist()

    latency_ms = (time.perf_counter() - start) * 1000.0

    assert _label_names is not None
    scored = [
        {"label": _label_names[i], "score": float(probs[i])} for i in range(len(probs))
    ]
    scored_sorted = sorted(scored, key=lambda x: x["score"], reverse=True)

    over = [x for x in scored_sorted if x["score"] >= threshold]
    top = scored_sorted[:top_k]

    return {
        "text": inp.text,
        "threshold": threshold,
        "labels_over_threshold": over,
        "top": top,
        "latency_ms": round(latency_ms, 2),
    }
