@echo off
setlocal EnableDelayedExpansion
title AI Swarm OS v3.2 - Smart Offline Installer (Hardware Aware)
color 0B
cls

echo ======================================================================
echo    ______          __  ___        __  ___      ____  _____
echo   / ____/_  ______/  ^|/  /___ _  /  ^|/  /___ _/ __ \/ ___/
echo  / /_  / / / / ___/ /^|_/ / __ `/ / /^|_/ / __ `/ / / /\__ \ 
echo / __/ / /_/ (__  ) /  / / /_/ / / /  / / /_/ / /_/ /___/ / 
echo/_/    \__,_/____/_/  /_/\__,_/ /_/  /_/\__,_/\____//____/  
echo ======================================================================
echo      SMART INSTALLER v3.2: HARDWARE DETECTION ^& MDM HUB
echo ======================================================================
echo.
echo [SYSTEM] Gwarantowana praca OFFLINE. Sprawdzanie srodowiska...
ping -n 1 google.com >nul 2>&1
if !errorlevel! neq 0 (
    set INTERNET=0
    echo [UWAGA] Brak polaczenia z internetem. Uruchamianie w trybie STRICT OFFLINE.
) else (
    set INTERNET=1
    echo [OK] Aktywne polaczenie z siecia (do weryfikacji paczek).
)

:: 1. HARDWARE DETECTION (RAM & GPU)
echo.
echo [SPRZET] Analiza zasobow komputera (dobor LLA modelu)...

:: RAM Check
set RAM_GB=8
for /f "skip=1" %%p in ('wmic os get totalvisiblememorysize 2^>nul') do (
    set /a RAM_KB=%%p 2>nul
    if defined RAM_KB (
        set /a RAM_GB=!RAM_KB! / 1048576
        goto :ram_done
    )
)
:ram_done
echo [SPRZET] Pamiec operacyjna (RAM): !RAM_GB! GB

:: GPU Check
set GPU_MODEL=Brak dedykowanego GPU NVIDIA
set VRAM_GB=0
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader > gpu_info.txt 2>nul
if !errorlevel! equ 0 (
    for /f "tokens=1,2 delims=," %%A in (gpu_info.txt) do (
        set GPU_MODEL=%%A
        set VRAM_MB=%%B
        set VRAM_MB=!VRAM_MB: MiB=!
        set /a VRAM_GB=!VRAM_MB! / 1024
    )
)
if exist gpu_info.txt del gpu_info.txt

echo [SPRZET] Karta graficzna (GPU): !GPU_MODEL!
echo [SPRZET] Pamiec graficzna (VRAM): !VRAM_GB! GB

echo.
echo [AI] =====================================================================
echo [AI] === REKOMENDACJA LOKALNEGO MODELU (DLA LM STUDIO) ===

if !VRAM_GB! GEQ 16 (
    echo [AI] Potezne GPU. Optymalny model: Llama-3.1-8B-Instruct (Szybki) lub Qwen2.5-14B (GGUF).
    echo [AI] Skopiuj i wklej w szukarce LM Studio: QuantFactory/Meta-Llama-3-8B-Instruct-GGUF
) else if !VRAM_GB! GEQ 8 (
    echo [AI] Dobre GPU. Optymalny model: Llama-3.1-8B-Instruct (Q4/Q5kwantyzacja).
    echo [AI] Skopiuj i wklej w szukarce LM Studio: QuantFactory/Meta-Llama-3-8B-Instruct-GGUF
) else if !VRAM_GB! GEQ 4 (
    echo [AI] Niske VRAM. Optymalny model: Phi-3-Mini-4k-Instruct (Q4) lub Llama-3.2-3B.
    echo [AI] Skopiuj i wklej w szukarce LM Studio: microsoft/Phi-3-mini-4k-instruct-gguf
) else if !RAM_GB! GEQ 16 (
    echo [AI] Brak VRAM; duzo RAM (Praca na procesorze CPU bazowym). 
    echo [AI] Optymalny model: Llama-3.2-3B-Instruct (Q4).
    echo [AI] Skopiuj i wklej w szukarce LM Studio: QuantFactory/Llama-3.2-3B-Instruct-GGUF
) else (
    echo [AI] Slabe zasoby. Model bedzie dosc wolny. Optymalny model: Qwen2.5-0.5B (GGUF).
    echo [AI] Skopiuj i wklej w szukarce LM Studio: Qwen/Qwen2.5-0.5B-Instruct-GGUF
)
echo [AI] =====================================================================

:: 2. WINGET DEPENDENCY CHECKS
echo.
echo [SYSTEM] Sprawdzanie systemowych zaleznosci (weryfikacja auto-instalatora)...

winget --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [OSTRZEZENIE] Brak natywnego 'Winget'. Automatyczna instalacja aplikacji globalnych Windows pomoze byc utrudniona.
) else (
    :: VERIFY NODE.JS
    node -v >nul 2>&1
    if !errorlevel! neq 0 (
        echo [INSTALATOR] Brak srodowiska Node.js (Rdzen systemu). Rozpoczynam instalacje w tle...
        if !INTERNET! equ 1 (
            winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
            echo [UWAGA] Instalacja pomyslna! Musisz zrestartowac plik 'install-windows.bat', aby system zauwazyl zmiany.
            pause
            exit /b 0
        ) else (
            echo [BLAD] Brak Node.js i brak internetu. System offline nie mozna pozyskac pakietu.
            pause
            exit /b 1
        )
    ) else (
        for /f %%i in ('node -v') do set NODE_VER=%%i
        echo [OK] Srodowisko Node.js na pokladzie (!NODE_VER!).
    )

    :: VERIFY LM STUDIO
    if exist "%LOCALAPPDATA%\LM-Studio\LM Studio.exe" (
        echo [OK] Silnik LM Studio zostal wykryty na dysku.
    ) else (
        echo [INSTALATOR] LM Studio nie jest obecnie zainstalowane. Brak menedzera OFFLINE LLaMA.
        if !INTERNET! equ 1 (
            echo [INSTALATOR] Rozpoczynam automatyczna instalacje lokalnego silnika LM Studio...
            winget install --id LMStudio.LMStudio -e --accept-source-agreements --accept-package-agreements
            if !errorlevel! neq 0 (
                echo [UWAGA] Winget nie mogl ukonczyc instalacji. Mozesz go pobrac recznie z: https://lmstudio.ai/
            ) else (
                echo [OK] LM Studio pomyslnie zainicjowane z repozytoriow!
            )
        ) else (
            echo [INFO] Brak internetu, zainstaluj LM Studio manualnie z instalatora, by wpelni obsłużyć swiadomosc LLaMA.
        )
    )
)

:: 3. NPM DEPS CHECK
echo.
echo [NPM] Weryfikacja paczek kodowych rdzenia Swarm OS...
if not exist node_modules (
    echo [INSTALATOR] Wykryto brak 'node_modules'. Brak zaleznosci rdzenia...
    if !INTERNET! equ 1 (
        echo [NPM] Uruchamianie instalacji pelnych paczek ^(moze potrwac ok. minuty^)...
        call npm install
        if !errorlevel! neq 0 (
            echo [BLAD] Brakujace elementy kompilacji natywnych ^(najpewniej SQLite^). Sprobuj zainstalowac BuildTools Microsoft.
            pause
            exit /b 1
        )
    ) else (
        echo [BLAD] System calkowicie offline bez wstepnych paczek npm. Niemozliwe kontynuowanie uruchomienia.
        pause
        exit /b 1
    )
) else (
    echo [OK] Wszystkie zaleznosci Node (node_modules) znajduja sie w systemie!
)

:: 4. BUILD PROCESS
echo.
echo [BUILD] Walidacja plikow produkcyjnych...
if not exist dist (
    echo [INSTALATOR] Brak skompilowanej struktury wejsciowej klienta ^(dist^).
    if !INTERNET! equ 1 (
        echo [BUILD] Rozpoczynam budowanie zasobow silnika web (Vite)...
        call npm run build
        if !errorlevel! neq 0 (
            echo [BLAD] Uszkodzenie builda paczki NPM! Sprawdz zaleznosci systemu!
            pause
            exit /b 1
        )
    ) else (
        echo [OSTRZEZENIE] Brak skompilowanego rdzenia UI. Bez dostepu do sieci zbudowanie go z repozytoriow jest zablokowane.
    )
) else (
    echo [OK] Gotowe pliki kompilacji UI (Tzw. dist). Moduly gotowe.
)

:: 5. START SYSTEM
echo.
echo ======================================================================
echo            WSZYSTKIE SYSTEMY W GOTOWOSCI - LOKALNY ZAPLON 
echo ======================================================================
echo [SYSTEM] Rdzen CYLON startuje na http://localhost:3000
echo. 
echo [!] INSTUKCJA UROCHOMIENIA W PELNYM OFFLINE Z LM STUDIO:
echo   1. Uruchom aplikacje "LM Studio", ktora powinna u Ciebie byc
echo   2. Uzyj paska wyszukiwania i skopiuj/wklej "Optymalny Model" z raportu wyzej
echo   3. Kliknij lewy pasek menu - ikona '<->' by uruchomic tryb (Developer/Local Server)
echo   4. Wejdz na "http://localhost:3000" do Swarm OS - kliknij Ustawienia (Zebatke po prawej)
echo   5. Zaznacz "Tryb Lokalnego LLM (Pełna Izolacja)" i pozostaw standardowe "localhost:1234"
echo.
echo ======================================================================
echo [SYSTEM START] ...Aby wejsc w stan uspienia i wylaczyc serwer - po prostu zamknij to czarne okno.

call npm start

pause
