@echo off
setlocal EnableExtensions

rem Local Ollama + Aider coding workspace for Ultra Studio.
rem Override the model before launching: set ULTRA_CODER_MODEL=your-model:tag
set "REPO=%USERPROFILE%\Not-sure-yet"
set "WORKTREE=%USERPROFILE%\UltraStudio-AI"
set "VENV=%LOCALAPPDATA%\UltraStudioCoder\.venv"
set "BRANCH=ai/local-coder"
if not defined ULTRA_CODER_MODEL set "ULTRA_CODER_MODEL=qwen2.5-coder:14b"
set "OLLAMA_API_BASE=http://127.0.0.1:11434"
set "OLLAMA_CONTEXT_LENGTH=8192"

where git >nul 2>&1 || (echo Git is required. & goto :failed)
where ollama >nul 2>&1 || (echo Ollama is required. & goto :failed)
where py >nul 2>&1 || (echo Python 3.12 with the Windows py launcher is required. & goto :failed)
py -3.12 --version >nul 2>&1 || (echo Install Python 3.12, then run this file again. & goto :failed)
if not exist "%REPO%\.git" (echo Repository not found at "%REPO%". & goto :failed)
git -C "%REPO%" remote get-url origin 2>nul | findstr /I /C:"jrharris1984-hue/Not-sure-yet" >nul
if errorlevel 1 (echo The repository origin does not match Ultra Studio. & goto :failed)

curl.exe -fsS "%OLLAMA_API_BASE%/api/tags" >nul 2>&1
if errorlevel 1 (
  echo Starting Ollama...
  start "Ollama" /min ollama serve
  timeout /t 5 /nobreak >nul
  curl.exe -fsS "%OLLAMA_API_BASE%/api/tags" >nul 2>&1
  if errorlevel 1 (echo Ollama is unavailable at %OLLAMA_API_BASE%. & goto :failed)
)

ollama show "%ULTRA_CODER_MODEL%" >nul 2>&1
if errorlevel 1 (
  echo Downloading %ULTRA_CODER_MODEL%...
  ollama pull "%ULTRA_CODER_MODEL%"
  if errorlevel 1 goto :failed
)

if not exist "%VENV%\Scripts\aider.exe" (
  echo Installing Aider in a separate Python environment...
  py -3.12 -m venv "%VENV%"
  if errorlevel 1 goto :failed
  "%VENV%\Scripts\python.exe" -m pip install -U pip aider-chat
  if errorlevel 1 goto :failed
)

if not exist "%WORKTREE%\.git" (
  echo Fetching GitHub main and creating a separate AI worktree...
  git -C "%REPO%" fetch origin main
  if errorlevel 1 goto :failed
  git -C "%REPO%" worktree add -b "%BRANCH%" "%WORKTREE%" origin/main
  if errorlevel 1 goto :failed
)

echo.
echo AI workspace: %WORKTREE%
echo Branch: %BRANCH%
echo Model: %ULTRA_CODER_MODEL%
echo Your running Ultra Studio folder is separate.
echo.
cd /d "%WORKTREE%" || goto :failed
"%VENV%\Scripts\aider.exe" --model "ollama_chat/%ULTRA_CODER_MODEL%" --no-auto-commits --no-gitignore
echo.
echo Review changes: git -C "%WORKTREE%" status -sb
echo Review diff:    git -C "%WORKTREE%" diff
echo When ready, commit and push the AI branch from that folder.
pause
exit /b 0

:failed
echo Setup stopped. Existing projects and Docker containers were not changed.
pause
exit /b 1
