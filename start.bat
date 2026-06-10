@echo off
:: ==============================================================================
::                  AI SWARM OS v3.0 - WINDOWS LAUNCHER
:: ==============================================================================
TITLE AI Swarm OS Launcher
COLOR 0A
cls

echo ==============================================================================
echo                 AI SWARM OS v3.0 - ROZRUCH CENTRALNY
echo ==============================================================================
echo [INFO] Inicjalizacja srodowiska produkcyjnego...
echo [INFO] Dowodca: CYLON | Status sieci: AKTYWNY
echo ==============================================================================
echo.

:: Check env
if not exist ".env" (
    echo [WARNING] Brak pliku konfiguracyjnego .env.
    echo Kopiowanie szablonu srodowiskowego...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [OK] .env zostal utworzony. Skonfiguruj go przed uruchomieniem!
    ) else (
        echo PORT=3000 > .env
        echo NODE_ENV=production >> .env
        echo # GEMINI_API_KEY= >> .env
        echo [OK] Nowy pusty .env zostal wygenerowany.
    )
)

:: Check build
if not exist "dist\server.cjs" (
    echo [WARNING] Brak skompilowanej bazy produkcyjnej (dist/server.cjs).
    echo [INFO] Uruchamianie procedury budowania...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Budowanie nie powiodlo sie. Sprobuj uruchomic "install.bat" ponownie.
        pause
        exit /b 1
    )
)

echo [LAUNCH] Uruchamianie serwerów AI Swarm OS...
echo [INFO] Otwórz przegladarke i wejdz na strone: http://localhost:3000
echo [INFO] Nacisnij Ctrl+C aby bezpiecznie zatrzymac sesje.
echo.

call npm start
pause
