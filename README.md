# AI SWARM OS v3.0 • INSTALACJA & URUCHOMIENIE

Witaj w centrum instalacyjnym **AI Swarm OS** – nowoczesnego, wieloagentowego srodowiska orkiestracyjnego zarzadzanego przez jednostke centralna **CYLON**.

Niniejszy instalator zostal zaprojektowany tak, aby dac Ci maksymalna elastycznosc uruchomieniowa. Mozesz uruchomic system lokalnie na swoim komputerze (Windows/macOS/Linux) lub w kontenerze **Docker**.

---

## 🚀 OPCJA 1: INSTALACJA LOKALNA (AUTOMATYCZNA)

Zapewniamy w pelni autonomiczne skrypty instalacyjne, ktore zainicjalizuja baze danych, utworza potrzebne struktury katalogow, strobia plik konfiguracyjny, zainstaluja paczki NPM oraz skompiluja aplikacje (Vite + backend bundle).

### 🪟 Srodowisko Windows (Wiersz Polecen)
1. Upewnij sie, ze posiadasz zainstalowany **Node.js v18+**.
2. Kliknij dwukrotnie na plik **`install.bat`** lub uruchom go w konsoli CMD:
   ```cmd
   install.bat
   ```
3. Po pomyslnej instalacji, uruchamiaj aplikacje jednym kliknieciem za pomoca:
   ```cmd
   start.bat
   ```

### 🍎 Srodowisko macOS / Linux
1. Nadaj uprawnienia wykonywania dla skryptow instalacyjnych:
   ```bash
   chmod +x install.sh start.sh
   ```
2. Uruchom skrypt instalatora:
   ```bash
   ./install.sh
   ```
3. Po pomyslnej instalacji, uruchamiaj platforme komenda:
   ```bash
   ./start.sh
   ```

---

## 🐳 OPCJA 2: INSTALACJA W DOCKERZE (ZALECANA)

Jesli chcesz odizolowac aplikacje od lokalnego srodowiska, zalecanym rozwiadowaniem jest konteneryzacja. Dzieki przygotowanemu obrazowi bazujacemu na `Node-Bookworm` oraz automatycznym zaleznosciom kompilacyjnym (np. biblioteki dla `better-sqlite3` oraz `canvas`), instalacja bedzie stabilna i bezbledna.

### Szybki start za pomoca Docker Compose (Zalecane)
1. Upewnij sie, ze Twoj silnik Docker oraz Docker Compose sa uruchomione.
2. Skonfiguruj swoj klucz API w pliku `.env` lub przekaz go w terminalu:
   ```bash
   # Linux/macOS
   export GEMINI_API_KEY="twój_klucz_api"
   
   # Windows PowerShell
   $env:GEMINI_API_KEY="twój_klucz_api"
   ```
3. Kompiluj i uruchom caly stos za pomoca pojedynczej komendy:
   ```bash
   docker compose up --build -d
   ```
4. Aplikacja bedzie dostepna pod adresem: **http://localhost:3000**
5. Obiekt bazy danych (`agents.db`) oraz wyslane multimedia generowane przez Twoj roj beda trwale zapisywane na dysku hosta dzieki mapowanym wolumenom.

### Klasyczna kompilacja Docker CLI (Opcjonalnie)
Jesli wolisz recznie wystawiac obraz:
```bash
# 1. Zbuduj obraz kontenera o nazwie ai-swarm-os
docker build -t ai-swarm-os .

# 2. Uruchom kontener mapujac port, baze i pliki uploads
docker run -d \
  -p 3000:3000 \
  -e GEMINI_API_KEY="twój-klucz" \
  -v "$(pwd)/agents.db:/app/agents.db" \
  -v "$(pwd)/uploads:/app/uploads" \
  --name ai_swarm_os_container \
  ai-swarm-os
```

---

## ⚙️ KONFIGURACJA KLUCZY API

Aby w pelni wybudzic swiadomosc wieloagentowa Twoich rojow i pozwolic im pracowac autonomicznie (wyszukiwanie informacji, pisanie kodu, ewaluacje):
1. Otworz nowo utworzony plik **`.env`** w glownym katalogu aplikacji.
2. Uzupelnij wartosc zmiennej **`GEMINI_API_KEY`**:
   ```env
   GEMINI_API_KEY=AIzaSyD_TwojKluczZGoogleAIStudio...
   ```
3. Zapisz plik i zrestartuj serwer/kontener.

---

## 📂 PRZEKAZYWANIE PLIKÓW I ARTEFAKTY
* Wszystkie pliki generowane dynamicznie przez caly sztab agentów (PDFy, Excel, dokumenty Word) oraz przesylane materialy beda archiwizowane w bezpiecznym i trwalym wolumenie sieciowym w folderze `/uploads/` oraz rejestrowane w bazie danych SQLite.

*Wydajne orkiestrowanie, mnostwo zabawy i stabilnych dyskusji!*
**Twoj Dowodca Centralny: CYLON**
