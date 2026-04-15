# GreenPoint Mumbai Prototype

FastAPI + React prototype for GreenPoint Mumbai civic reward/penalty workflow.

## Prerequisites

- Python 3.13+
- Node.js 23+ and npm

## Project Structure

- `backend` - FastAPI API and SQLite data
- `frontend` - React + Vite UI

## 1) Backend Setup and Run

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Backend runs at: `http://127.0.0.1:8000`

Useful endpoint check:

```bash
curl http://127.0.0.1:8000/health
```

## 2) Frontend Setup and Run

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

## 3) Build (Frontend)

```bash
cd frontend
npm run build
```

Build output is generated in `frontend/dist`.

## 4) Quick Local Workflow

1. Start backend (`uvicorn`) in terminal 1.
2. Start frontend (`vite`) in terminal 2.
3. Open `http://localhost:5173`.
4. Use `/citizen` and `/collector` views to test reward and violation flows.