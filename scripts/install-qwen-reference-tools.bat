@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-qwen-reference-tools.ps1" %*
set "task_exit=%ERRORLEVEL%"
if not "%task_exit%"=="0" echo Installation did not complete. Read the error above.
pause
exit /b %task_exit%
