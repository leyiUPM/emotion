# Emotion Feedback

This repo contains:
- `backend/` FastAPI server that loads a local fine-tuned ELECTRA model from `backend/model/`
- `web/` Next.js frontend

---

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
