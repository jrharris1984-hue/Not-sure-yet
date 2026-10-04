@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Ultra Studio - Gemma prompt assistants
rem Sources: author GGUF and community Ollama package, both Q4_K_M.
set "tiger=hf.co/TheDrummer/Big-Tiger-Gemma-27B-v3-GGUF:Q4_K_M"
set "abliterated=mdq100/Gemma3-Instruct-Abliterated:27b"
set "failed=0"
where ollama >nul 2>&1
if errorlevel 1 (
  echo Install or update Ollama from https://ollama.com/download/windows first.
  goto :error
)
echo Each model downloads about 17 GB. Both need about 35 GB of disk space.
echo Ollama stores the weights; aliases reuse them without another copy.
echo A 27B model may use system RAM and respond slowly on smaller GPUs.
echo.
if /i "%~1"=="--tiger" goto :tiger
if /i "%~1"=="--abliterated" goto :abliterated
if /i "%~1"=="--both" goto :both
if not "%~1"=="" (
  echo Usage: %~nx0 [--tiger ^| --abliterated ^| --both]
  goto :error
)
echo 1. TheDrummer Big Tiger Gemma 27B v3
echo 2. Gemma 3 27B Instruct Abliterated - mdq100
echo 3. Download both
echo 4. Exit
choice /c 1234 /n /m "Select 1, 2, 3, or 4: "
if errorlevel 4 exit /b 0
if errorlevel 3 goto :both
if errorlevel 2 goto :abliterated
if errorlevel 1 goto :tiger
:tiger
call :install "%tiger%" "ultra-big-tiger-gemma:27b"
goto :finish
:abliterated
call :install "%abliterated%" "ultra-gemma3-abliterated:27b"
goto :finish
:both
call :install "%tiger%" "ultra-big-tiger-gemma:27b"
call :install "%abliterated%" "ultra-gemma3-abliterated:27b"
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
set "modelFile=%TEMP%\ultra-gemma-%RANDOM%-%RANDOM%.Modelfile"
>"%modelFile%" echo FROM %~1
>>"%modelFile%" echo PARAMETER num_ctx 8192
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
