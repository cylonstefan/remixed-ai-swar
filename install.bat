@echo off
:: ==============================================================================
::                  AI SWARM OS v3.2 - WINDOWS ADVANCED LAUNCHER
:: ==============================================================================
TITLE AI Swarm OS Installer Bootstrapper
COLOR 0B
cls

echo ==============================================================================
echo                AI SWARM OS v3.2 - WINDOWS BOOTSTRAP PROTOCOL
echo ==============================================================================
echo [INFO] Inicializacja instalatora graficznego...
echo [INFO] Zarzadca centralny: CYLON | Status: AKTYWNY
echo ==============================================================================
echo.

:: Sprawdzanie uprawnien Administratora
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Uprawnienia administratora sa obecne.
    goto :RunInstaller
) else (
    echo [WARNING] Blad: Brak uprawnien administratora do opcjonalnej instalacji modulow.
    echo [INFO] Proba automatycznego podniesienia uprawnien (UAC)...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

:RunInstaller
echo [LAUNCH] Uruchamianie zaawansowanego instalatora graficznego (WPF GUI)...
echo [INFO] Poczekaj, az otworzy sie okno instalacyjne...
echo.

:: Uruchomienie skryptu PowerShell Bypass
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Wystapil blad podczas uruchamiania instalatora GUI.
    echo [INFO] Proba uruchomienia w trybie awaryjnym / tekstowym.
    pause
)
exit /b
