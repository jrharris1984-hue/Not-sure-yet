@echo off
REM Native (no-Docker) dev launcher for Windows.
REM Assumes MongoDB is running as a service.

cd /d "%~dp0\.."

if not exist backend\.env (
  copy backend\.env.example backend\.env
  echo Created backend\.env from example
)
if not exist frontend\.env (
  copy frontend\.env.example frontend\.env
  echo Created frontend\.env from example
)

start "Ultra Studio Backend" cmd /k "cd backend && if not exist .venv (python -m venv .venv) && .venv\Scripts\activate && pip install -q -r requirements.txt && uvicorn server:app --host 0.0.0.0 --port 8001 --reload"

start "Ultra Studio Frontend" cmd /k "cd frontend && if not exist node_modules (yarn install) && yarn start"

echo.
echo Backend  -^> http://localhost:8001
echo Frontend -^> http://localhost:3000
echo.
echo Close the two terminal windows to stop.
