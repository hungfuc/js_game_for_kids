@echo off
REM Double-click this file on Windows to start the local Game Lab.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed yet.
  echo A parent, teacher, or other adult can install the LTS version from:
  echo https://nodejs.org/en/download
  start "" "https://nodejs.org/en/download"
  echo After installation, close this window and double-click this file again.
  pause
  exit /b 1
)

set "OPEN_GAME_LAB=1"
node scripts\serve.mjs
echo.
echo The Game Lab has stopped.
pause
