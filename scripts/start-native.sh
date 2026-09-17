#!/usr/bin/env bash
# Native (no-Docker) dev launcher. Assumes MongoDB is already running.
# Starts backend on :8001 and frontend on :3000, tails both.

set -e
cd "$(dirname "$0")/.."

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "Created backend/.env from example"
fi
if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  echo "Created frontend/.env from example"
fi

# Backend
(
  cd backend
  if [ ! -d .venv ]; then
    python3 -m venv .venv
  fi
  # shellcheck disable=SC1091
  source .venv/bin/activate
  pip install -q -r requirements.txt
  echo "-> Backend on http://localhost:8001"
  exec uvicorn server:app --host 0.0.0.0 --port 8001 --reload
) &
BACKEND_PID=$!

# Frontend
(
  cd frontend
  if [ ! -d node_modules ]; then
    yarn install
  fi
  echo "-> Frontend on http://localhost:3000"
  exec yarn start
) &
FRONTEND_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT TERM
wait
