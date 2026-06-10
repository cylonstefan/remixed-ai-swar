# 🤖 AI Swarm OS - Instrukcja Produkcyjna (Docker + Windows + LM Studio)

Niniejsza instrukcja przeprowadzi Cię przez proces konfiguracji i uruchomienia **AI Swarm OS** w środowisku produkcyjnym, zarówno przy użyciu kontenerów Docker (na systemach Linux oraz Windows), jak i instalacji natywnej na systemie Windows. 

Dokument kładzie szczególny nacisk na **integrację z LM Studio** (lokalne wykonywanie LLM), omijając całkowicie potrzebę korzystania z oprogramowania Ollama.

---

## 🚀 Spis Treści
1. [Wymagania Wstępne](#-wymagania-wstępne)
2. [Integracja z LM Studio (Zamiast Ollama)](#-integracja-z-lm-studio-zamiast-ollama)
3. [Uruchomienie w Docker (Linux & Windows Docker)](#-uruchomienie-w-docker-linux--windows-docker)
4. [Natywny Instalator Windows (`install-windows.bat`)](#-natywny-instalator-windows-install-windowsbat)
5. [Struktura Trwałości i Baza Danych (SQLite)](#%EF%B8%8F-struktura-trwałości-i-baza-danych-sqlite)

---

## 📋 Wymagania Wstępne

Zależnie od wybranej metody uruchomienia przygotuj:
- **Dla kontenerów**: Zainstalowany Docker i Docker Compose (np. Docker Desktop na Windows lub natywny Docker Engine na Linux).
- **Dla instalacji natywnej**: Node.js (zalecana wersja LTS 20+) zainstalowany w systemie hosta.

---

## 💻 Integracja z LM Studio (Zamiast Ollama)

AI Swarm OS został w pełni przystosowany do natywnej, bezproblemowej współpracy z oprogramowaniem **LM Studio** na porcie `1234`. Aby skonfigurować komunikację lokalną:

1. **Uruchomienie LM Studio**:
   - Pobierz i włącz aplikację LM Studio na swoim komputerze.
   - Wybierz i pobierz dowolny model (np. `Llama-3`, `Mistral` lub `Qwen`).
   - Przejdź do ikony **Developer / Local Server** (oznaczonej symbolem dwukropka `<->` lub ikony serwera po lewej stronie).
   - Wybierz pobrany model z rozwijanej listy na górze ekranu.
   - Kliknij zielony przycisk **Start Server** na porcie `1234`.

2. **Połączenie ze Swarm OS**:
   - Uruchom Swarm OS i przejdź do **Wizualna Modyfikacja / Ustawienia** (Ikona zębatego koła na górnym pasku).
   - Włącz przełącznik **"Tryb Lokalnego LLM (Pełna Izolacja)"** - odetnie to wszelkie zewnętrzne zapytania do chmury Google/Gemini.
   - Skonfiguruj następujące parametry:
     - **Adres serwera LLM**: 
       * Jeśli Swarm OS działa **natywnie**: `http://localhost:1234` (Możesz kliknąć skrót *LM Studio (Port 1234)*).
       * Jeśli Swarm OS działa **w Dockerze**: `http://host.docker.internal:1234` (Kliknij dedykowany skrót *Docker Host (LM Studio)*).
     - **Nazwa modelu (Model ID)**: Wpisz nazwę załadowanego modelu w LM Studio (np. `lm-studio` lub nazwę pliku `.gguf`, jeśli serwer LM Studio tego wymaga).

*Dzięki specjalnemu mapowaniu portów w Swarm OS, zapytania będą błyskawicznie delegowane bezpośrednio do silnika LM Studio, a wszelkie operacje zapisane zostaną w lokalnym rejestrze logów.*

---

## 🐳 Uruchomienie w Docker (Linux & Windows Docker)

Pliki `Dockerfile` oraz `docker-compose.yml` zostały w pełni zoptymalizowane pod kątem automatycznego mapowania domen wewnątrz sieci kontenerowej.

### Szybki start (Krok po kroku):

1. Otwórz terminal (lub PowerShell) w głównym katalogu aplikacji Swarm OS.
2. Zbuduj i uruchom kontener poleceniem:
   ```bash
   docker-compose up --build -d
   ```
3. Docker automatycznie:
   - Skompiluje kod klienta (Vite React) przy użyciu produkcyjnego modułu bundlera.
   - Zainstaluje natywne pakiety `better-sqlite3` oraz `canvas` bezpośrednio w kontenerze.
   - Przekieruje host-gateway `host.docker.internal` dla systemów Linux i Windows, umożliwiając komunikację z aplikacjami zewnętrznymi (w tym LM Studio).
4. Otwórz przeglądarkę i wejdź na adres:
   ```
   http://localhost:3000
   ```
5. Aby zatrzymać aplikację:
   ```bash
   docker-compose down
   ```

---

## 🪟 Natywny Instalator Windows (`install-windows.bat`)

Jeżeli wolisz uruchomić aplikację bez Dockera, przygotowaliśmy w pełni zautomatyzowany skrypt instalacyjny dedykowany dla systemu Windows.

### Szybki start:

1. Upewnij się, że masz zainstalowany Node.js na swoim komputerze.
2. Kliknij dwukrotnie plik **`install-windows.bat`** w katalogu głównym projektu.
3. Skrypt automatycznie:
   - Zweryfikuje obecność środowiska Node.js w systemie.
   - Poczyni krok instalacji zależności (`npm install`), jeśli to pierwsze uruchomienie.
   - Przeprowadzi dynamiczną kompilację projektu (`npm run build`) do zoptymalizowanej wersji produkcyjnej.
   - Uruchomi serwer Swarm OS pod adresem `http://localhost:3000` i otworzy bezpieczną łączność z lokalnym rdzeniem.
4. Zamknięcie okna konsoli bezpiecznie zatrzymuje cały system.

---

## 📂 Struktura Trwałości i Baza Danych (SQLite)

Wszystkie dane agentów, historia interakcji, konfiguracje systemowe, logi i wgrane pliki są bezpiecznie przechowywane w katalogu aplikacji:

- **`agents.db`**: Plik bazy danych SQLite.
- **`/uploads/`**: Katalog przechowujący przesłane załączniki i wygenerowane multimedia.

Zarówno skrypt Windows, jak i konfiguracja Docker-Compose automatycznie mapują te pliki (jako wolumeny), dzięki czemu **Twoje dane nigdy nie zostaną utracone** podczas restartów kontenerów lub aktualizacji oprogramowania.
