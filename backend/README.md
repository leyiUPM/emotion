Backend (Python) - Local Emotion Inference API

1) Copy your exported model folder into this directory as:
   backend/model/
   The folder should contain:
   - config.json
   - model.safetensors (or pytorch_model.bin)
   - tokenizer.json / vocab files
   - label_names.json

2) Create venv + install deps:
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt

3) Run:
   uvicorn app:app --reload --port 8000

4) Quick test:
   curl -X POST http://127.0.0.1:8000/predict \
     -H "Content-Type: application/json" \
     -d '{"text":"I love this product but the shipping was late","threshold":0.5,"top_k":5}'
