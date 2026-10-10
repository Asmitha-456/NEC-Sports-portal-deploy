@echo off
title Push to GitHub - NEC Sports Portal
echo ====================================================================
echo   Pushing NEC Sports Portal to GitHub
echo   Target: https://github.com/Asmitha-456/NEC-Sports-portal-deploy.git
echo ====================================================================
echo.

cd /d "%~dp0"

echo [1/5] Checking Git installation...
where git >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Git is not installed or not found in your PATH.
    echo Please download and install Git from https://git-scm.com/
    pause
    exit /b 1
)

echo [2/5] Initializing local repository...
if not exist ".git" (
    git init
)

echo [3/5] Configuring remote origin...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/Asmitha-456/NEC-Sports-portal-deploy.git

echo [4/5] Staging files (protected by .gitignore)...
git add .
git commit -m "Initial commit: NEC Sports Portal"

echo [5/5] Pushing to branch main...
git branch -M main
git push -u origin main

if %ERRORLEVEL% neq 0 (
    echo.
    echo --------------------------------------------------------------------
    echo [NOTICE] If GitHub rejected the push because the remote repository
    echo already has initial files (like a README.md or License created on GitHub),
    echo you can force push or pull first.
    echo --------------------------------------------------------------------
    set /p FORCE_CHOICE="Would you like to force push to overwrite? (Y/N): "
    if /i "%FORCE_CHOICE%"=="Y" (
        git push -u origin main --force
    )
)

echo.
echo Process complete.
pause
