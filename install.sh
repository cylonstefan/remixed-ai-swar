#!/bin/bash
# ==============================================================================
#                  AI SWARM OS v3.2 - UNIX/MAC INSTALLER
# ==============================================================================

# Set beautiful console colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

clear
echo -e "${PURPLE}==============================================================================${NC}"
echo -e "${PURPLE}                 ┌──────────────────────────────────────────┐                 ${NC}"
echo -e "${PURPLE}                 │      AI SWARM OS v3.2 INSTALLER PRO      │                 ${NC}"
echo -e "${PURPLE}                 └──────────────────────────────────────────┘                 ${NC}"
echo -e "${PURPLE}==============================================================================${NC}"
echo -e "[${CYAN}PROCESS${NC}] Inicjalizacja protokołu instalacji dla Linux/Android/Hosting..."
echo -e "[${CYAN}SYSTEM ${NC}] Zarzadca: CYLON | Moduly: MDM, Vision UI, Scheduler"
echo -e "${PURPLE}==============================================================================${NC}"
echo ""

# 1. Check Node.js
echo -e "${YELLOW}[1/6] Sprawdzanie srodowiska uruchomieniowego Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Srodowisko Node.js NIE zostalo znalezione.${NC}"
    echo ""
    echo "Aby uruchomic AI Swarm OS, wymagany jest Node.js w wersji 18 lub wyzszej."
    echo "Pobierz i zainstaluj Node.js ze strony: https://nodejs.org/"
    echo ""
    exit 1
else
    echo -e "${GREEN}[OK] Node.js zainstalowany pomyślnie. Wersja: $(node -v)${NC}"
fi
echo ""

# 2. Check ADB for Android MDM (New v3.2 feature)
echo -e "${YELLOW}[2/6] Sprawdzanie modułów Android MDM (ADB)...${NC}"
if ! command -v adb &> /dev/null; then
    echo -e "${CYAN}[INFO] Narzedzie ADB nie zostalo znalezione. Moduly Mobile Remote beda ograniczone.${NC}"
    echo -e "${CYAN}Wskazowka: Zainstaluj 'android-tools-adb' dla pelnej kontroli smartfona.${NC}"
else
    echo -e "${GREEN}[OK] Wykryto Android Debug Bridge (ADB). Funkcje Mobile MDM aktywne.${NC}"
fi
echo ""

# 3. Create Files and Folders
echo -e "${YELLOW}[3/6] Przygotowanie struktury plikowej systemu...${NC}"
if [ ! -f "agents.db" ]; then
    echo -e "[INFO] Tworzenie czystego pliku bazy SQLite (agents.db)..."
    touch "agents.db"
    chmod 666 "agents.db"
    echo -e "${GREEN}[OK] agents.db zainicjalizowany.${NC}"
fi

if [ ! -d "uploads" ]; then
    echo -e "[INFO] Tworzenie systemowego katalogu uploads/ dla multimediow..."
    mkdir -p "uploads"
    chmod 777 "uploads"
    echo -e "${GREEN}[OK] Katalog uploads/ utworzony.${NC}"
fi

# Environment Setup
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp ".env.example" ".env"
        echo -e "${GREEN}[OK] .env wygenerowany z szablonu.${NC}"
    else
        echo "PORT=3000" > .env
        echo "NODE_ENV=production" >> .env
        echo -e "${GREEN}[OK] Nowy plik .env utworzony.${NC}"
    fi
fi
echo ""

# 4. Install Dependencies
echo -e "${YELLOW}[4/6] Sprawdzanie i przygotowanie zaleznosci systemowych offline...${NC}"
if [ -f /etc/debian_version ] && command -v apt-get &> /dev/null; then
    echo -e "[SYSTEM] Wykryto srodowisko oparte o Debian/Ubuntu."
    echo -e "Zalecane pakiety do natywnego działania canvas, sqlite i nagrywania wideo/metryk:"
    echo -e "${CYAN}sudo apt-get update && sudo apt-get install -y build-essential python3 make g++ libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev ffmpeg sqlite3 curl${NC}"
    echo ""
elif command -v brew &> /dev/null; then
    echo -e "[SYSTEM] Wykryto macOS z Homebrew."
    echo -e "Zalecane pakiety do natywnego kompilowania canvas, sqlite oraz ffmpeg:"
    echo -e "${CYAN}brew install pkg-config cairo pango libpng jpeg giflib librsvg ffmpeg sqlite${NC}"
    echo ""
fi

echo -e "${YELLOW}[4/6] Instalacja pakietow NPM i kompilacja modulow binarnych...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Blad npm install.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Pakiety zainstalowane.${NC}"
echo ""

# 5. Compile & Build
echo -e "${YELLOW}[5/6] Kompilacja Vite + Backend Bundle...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Blad npm run build.${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Build zakonczony sukcesem!${NC}"
echo ""

# 6. Hosting & Cloud Readiness Check
echo -e "${YELLOW}[6/6] Sprawdzanie gotowości do Hostingu (Cloud Run/Docker)...${NC}"
if [ -f "Dockerfile" ]; then
    echo -e "${GREEN}[OK] Kontener Docker gotowy do wdrozenia.${NC}"
else
    echo -e "${RED}[WARN] Brak Dockerfile. Hosting kontenerowy moze nie dzialac.${NC}"
fi
echo ""

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}             SWARM OS v3.2 GOTOWY DO OPERACJI!                                ${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo "Zaimplementowano: MDM Distribution, Media Vision AI, Chronos Scheduler."
echo ""
echo "URUCHOMIENIE:"
echo "1) Wpisz './start.sh' aby wystartowac."
echo "2) Dostep: http://localhost:3000"
echo ""
echo -e "${GREEN}==============================================================================${NC}"
echo ""

read -p "Czy chcesz uruchomic srodowisko teraz? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm start
fi
