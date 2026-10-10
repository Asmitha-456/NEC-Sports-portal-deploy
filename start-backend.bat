@echo off
title NEC Sports Portal - National Engineering College
echo ====================================================================
echo   NEC Sports Event Management & Automatic OD Generation Engine
echo   National Engineering College (Autonomous), Kovilpatti
echo ====================================================================
echo.

cd /d "%~dp0\backend"

IF NOT EXIST "node_modules" (
    echo [1/3] Installing backend dependencies...
    call npm install
)

echo [2/3] Opening browser at http://localhost:5000 ...
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:5000"

echo [3/3] Starting backend server on http://localhost:5000 ...
node server.js

pause
