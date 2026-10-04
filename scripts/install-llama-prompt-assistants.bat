@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Ultra Studio - Llama prompt assistants
rem Sources: DavidAU Dark Champion and QuantFactory NeuralDaredevil, Q4_K_M.
set "champion=hf.co/DavidAU/Llama-3.2-8X3B-MOE-Dark-Champion-Instruct-uncensored-abliterated-18.4B-GGUF:Q4_K_M"
set "daredevil=hf.co/QuantFactory/NeuralDaredevil-8B-abliterated-GGUF:Q4_K_M"
set "failed=0"
where ollama >nul 2>&1
if errorlevel 1 (
  echo Install or update Ollama from https://ollama.com/download/windows first.
  goto :error
)
echo NeuralDaredevil 8B: about 4.9 GB. Dark Champion 18.4B MoE: about 11.3 GB.
echo Allow about 17 GB of disk space for both.
echo Ollama stores the weights; aliases reuse them without another copy.
echo Dark Champion is NOT an 8B model and may need RAM offload.
echo NeuralDaredevil is the lighter choice. Neither deletes existing Gemma models.
echo.
if /i "%~1"=="--champion" goto :champion
if /i "%~1"=="--daredevil" goto :daredevil
if /i "%~1"=="--both" goto :both
if not "%~1"=="" (
  echo Usage: %~nx0 [--champion ^| --daredevil ^| --both]
  goto :error
)
echo 1. Llama 3.2 Dark Champion 8x3B MoE - 18.4B total
echo 2. NeuralDaredevil 8B Abliterated
echo 3. Download both
echo 4. Exit
choice /c 1234 /n /m "Select 1, 2, 3, or 4: "
if errorlevel 4 exit /b 0
if errorlevel 3 goto :both
if errorlevel 2 goto :daredevil
if errorlevel 1 goto :champion
:champion
call :install "%champion%" "ultra-dark-champion:18.4b"
goto :finish
:daredevil
call :install "%daredevil%" "ultra-neuraldaredevil:8b"
goto :finish
:both
call :install "%champion%" "ultra-dark-champion:18.4b"
call :install "%daredevil%" "ultra-neuraldaredevil:8b"
goto :finish
:install
ollama list >nul 2>&1
if errorlevel 1 (
  echo Cannot reach Ollama. Open the Ollama Windows app, then rerun this file.
  echo If OLLAMA_HOST is configured, check that server instead.
  set "failed=1"
  exit /b 1
)
echo Downloading %~1 ...
ollama pull "%~1"
if errorlevel 1 (
  echo Download failed. Rerun to resume; update Ollama if the format is unsupported.
  set "failed=1"
  exit /b 1
)
set "modelFile=%TEMP%\ultra-llama-%RANDOM%-%RANDOM%.Modelfile"
>"%modelFile%" echo FROM %~1
>>"%modelFile%" echo PARAMETER num_ctx 4096
ollama create "%~2" -f "%modelFile%"
if errorlevel 1 (
  del /q "%modelFile%" >nul 2>&1
  echo Could not create the Ultra Studio model alias.
  set "failed=1"
  exit /b 1
)
del /q "%modelFile%" >nul 2>&1
echo Installed %~2.
exit /b 0
:finish
if "%failed%"=="1" goto :error
echo.
echo In Ultra Studio: Settings - Local Ollama - Check again.
echo Select a Prompt assistant model, then Save AI settings.
echo Keep your Image review model selected separately.
if "%~1"=="" pause
exit /b 0
:error
if "%~1"=="" pause
exit /b 1
