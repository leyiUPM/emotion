# Emotion Feedback
This project uses a Deep Neural Network (DNN) to label text based on a sentiment analysis, classifying which emotions are present. It is part of our Emotion Insight project, which is a larger system to aid in analyzing and filtering customer feedback on a large scale.

This repo contains:
- `backend/` FastAPI server that loads a local fine-tuned ELECTRA model from `backend/model/`
- `web/` Next.js frontend
- `run_and_export.py` Training script used to traing and export model
---

# Model Used
ELECTRA-Small discriminator: https://huggingface.co/google/electra-small-discriminator

GoEmotions Training Dataset: https://huggingface.co/papers/2005.00547

## Train Model
Simply run `run_and_export.py` and it will export to folder `exported_emotion_model` in the working directory.

# A) Run with Docker

## Prereq
Install and make sure Docker is up and running.

## Run
From the project root, run:

```bash
docker compose up --build
```

Open the app:
- http://localhost:3000

## Stop
```bash
docker compose down
```

---

# B) Run on local dev

## 1) Start backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

## 2) Start frontend
Open a new terminal:

```bash
cd web
npm install
npm run dev
```

Open the app:
- http://localhost:3000
