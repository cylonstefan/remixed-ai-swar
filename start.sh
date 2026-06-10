#!/bin/bash
# ==============================================================================
#                  AI SWARM OS v3.0 - UNIX/MAC LAUNCHER
# ==============================================================================

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${CYAN}==============================================================================${NC}"
echo -e "${CYAN}                 AI SWARM OS v3.0 - ROZRUCH CENTRALNY                         ${NC}"
echo -e "${CYAN}==============================================================================${NC}"
echo -e "[INFO] Inicjalizacja srodowiska produkcyjnego..."
echo -e "[INFO] Dowodca: CYLON | Status sieci: AKTYWNY"
echo -e "${CYAN}==============================================================================${NC}"
echo ""

# Ensure .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[WARNING] Brak pliku konfiguracyjnego .env.${NC}"
    echo "Kopiowanie szablonu srodowiskowego..."
    if [ -f ".env.example" ]; then
        cp ".env.example" ".env"
        echo -e "${GREEN}[OK] .env zostal utworzony. Skonfiguruj go przed uruchomieniem!${NC}"
    else
        echo "PORT=3000" > .env
        echo "NODE_ENV=production" >> .env
        echo "# GEMINI_API_KEY=" >> .env
        echo -e "${GREEN}[OK] Nowy pusty .env zostal wygenerowany.${NC}"
    fi
fi

# Ensure build exists
if [ ! -f "dist/server.cjs" ]; then
    echo -e "${YELLOW}[WARNING] Brak skompilowanej bazy produkcyjnej (dist/server.cjs).${NC}"
    echo "[INFO] Uruchamianie procedury budowania..."
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR] Budowanie bazy produkcyjnej nie powiodlo sie. Powtorz instalacje './install.sh'.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}[LAUNCH] Uruchamianie serwerów AI Swarm OS...${NC}"
echo -e "${GREEN}[INFO] Otwórz przegladarke i wejdz na strone: http://localhost:3000${NC}"
echo -e "${YELLOW}[INFO] Nacisnij Ctrl+C aby bezpiecznie zatrzymac sesje.${NC}"
echo ""

npm start
