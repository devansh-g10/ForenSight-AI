@echo off
echo.
echo  ============================================
echo   ForenSight AI - System Launcher
echo  ============================================
echo.

echo  [1/2] Starting FastAPI Backend on port 8000...
start cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak > nul

echo  [2/2] Starting React Frontend on port 5173...
start cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo  ============================================
echo   Both servers starting...
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo  ============================================
echo.
pause
