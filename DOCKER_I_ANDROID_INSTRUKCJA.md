# 🤖 AI Swarm OS - Podręcznik Uruchomienia (Docker, Linux, Termux & Android Native)

Niniejszy podręcznik opisuje proces konfiguracji i uruchomienia systemu **AI Swarm OS** w różnych środowiskach: od zaawansowanych kontenerów Docker, przez system Termux na Androidzie, aż po zoptymalizowane rozwiązania dla urządzeń mobilnych **bez użycia Dockera i Termuxa**.

---

## 📌 Spis Treści
1. [🐳 Docker Desktop na Windows](#-docker-desktop-na-windows)
2. [🐧 Docker na systemie Linux](#-docker-na-systemie-linux)
3. [📲 Termux & Nandroid (Docker-like na Androidzie)](#-termux--nandroid-docker-like-na-androidzie)
4. [📱 Android BEZ Termux i BEZ Dockera (Natywny Dostęp & PWA)](#-android-bez-termux-i-bez-dockera-natywny-dostęp--pwa)
5. [🔗 Bezprzewodowa integracja MDM (ADB over Wi-Fi)](#-bezprzewodowa-integracja-mdm-adb-over-wi-fi)

---

## 🐳 Docker Desktop na Windows

Uruchomienie aplikacji w Docker Desktop na Windows pozwala na pełną izolację środowiska bez zaśmiecania systemu operacyjnego lokalnymi bibliotekami Node.js.

### Instrukcja szybkiego startu:
1. **Pobierz i zainstaluj Docker Desktop**:
   - Pobierz instalator z oficjalnej strony i upewnij się, że zaznaczysz opcję **WSL 2 Backend** (zapewnia to maksymalną wydajność).
2. **Klonowanie/Pobranie katalogu**:
   - Otwórz terminal (PowerShell lub CMD) w folderze z projektem Swarm OS.
3. **Konfiguracja trybu offline i LM Studio**:
   - Jeśli korzystasz z lokalnego generatora modeli **LM Studio** na tym samym komputerze, adres serwera musi wskazywać na bramę hosta dla Dockera.
   - W ustawieniach Swarm OS (ikona zębatki) ustaw adres LLM na: `http://host.docker.internal:1234`.
4. **Uruchomienie kontenera**:
   - Wykonaj polecenie, które automatycznie skompiluje aplikację i uruchomi serwer:
     ```bash
     docker-compose up --build -d
     ```
5. **Dostęp**:
   - Po pomyślnym uruchomieniu wejdź na: `http://localhost:3000`.
   - Plik bazy danych `agents.db` oraz załączniki w `/uploads` będą synchronizowane na bieżąco w katalogu głównym (dane nie znikną przy restarcie kontenera).

---

## 🐧 Docker na systemie Linux

Wersja dla systemów z rodziny Linux (np. Ubuntu, Debian, Arch).

### Krok po kroku:
1. **Instalacja Docker Engie i Docker Compose**:
   ```bash
   sudo apt-get update
   sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
   ```
2. **Dodanie użytkownika do grupy Docker** (aby uniknąć ciągłego wpisywania `sudo`):
   ```bash
   sudo usermod -aG docker $USER
   # Zresetuj terminal lub wyloguj się i zaloguj ponownie
   ```
3. **Uruchomienie**:
   - Przejdź do katalogu aplikacji i wpisz:
     ```bash
     docker compose up --build -d
     ```
4. **Łączność z lokalnymi usługami na hoście**:
   - Dzięki dyrektywie `extra_hosts` w pliku `docker-compose.yml`, bez problemu połączysz się z usługą np. Ollama lub LM Studio zainstalowaną bezpośrednio na Linuxie za pomocą adresu IP: `http://host.docker.internal:11434` lub `http://172.17.0.1:1234`.

---

## 📲 Termux & Nandroid (Docker-like na Androidzie)

Jeśli chcesz uruchomić serwer roju bezpośrednio na telefonie z Androidem za pomocą emulacji środowiska Linux w **Termux**:

1. **Instalacja Termux**:
   - Pobierz Termux ze sprawdzonych źródeł (najlepiej z F-Droid, nie ze sklepu Google Play, ponieważ wersja w Play jest nieaktualna).
2. **Przygotowanie środowiska deweloperskiego**:
   - Uruchom Termux i wpisz następujące polecenia, by zaktualizować pakiety i zainstalować wymagany rdzeń Node.js:
     ```bash
     apt update && apt upgrade -y
     pkg install git nodejs openssl -y
     ```
3. **Konfiguracja środowiska kontenerowego (Nandroid / PRoot / Alpine)**:
   - Jeżeli chcesz pełnej izolacji i emulacji systemu Linux wewnątrz Termux (podobnie do systemu Docker):
     ```bash
     pkg install proot-distro -y
     # Instalacja wirtualnej dystrybucji Alpine (super lekki kontener)
     proot-distro install alpine
     # Uruchomienie "kontenera"
     proot-distro login alpine
     ```
   - *Wewnątrz zalogowanego kontenera Alpine*:
     ```bash
     apk update && apk add nodejs npm git
     ```
4. **Uruchomienie projektu**:
   - Pobierz paczkę kodu lub po prostu skopiuj aplikację, a następnie wykonaj klasyczne:
     ```bash
     npm install
     npm run build
     npm start
     ```
   - Serwer będzie dostępny pod adresem IP telefonu (np. `http://192.168.1.100:3000`).

---

## 📱 Android BEZ Termux i BEZ Dockera (Natywny Dostęp & PWA)

Wydajne urządzenia mobilne można zmienić w pełni funkcjonalne pulpity nadrzędne i konsole operacyjne **bez instalowania jakichkolwiek emulatorów**, bez obciążania baterii procesami serwerowymi i bez pisania linijek kodu w Termuxie.

W tym podejściu silnik (Cylon Core) uruchamiasz na komputerze PC / Mac / serwerze VPS, a telefon działa jako fizyczna konsola kontrolna z bezpośrednim dostępem do sprzętu (mikrofon, kamera, GPS).

### 1. Instalacja jako aplikacja PWA (Progressive Web App)
Aplikacja została wyposażona w manifest PWA, co pozwala przekształcić ją w pełnoprawną aplikację mobilną z własną ikoną na pulpicie i bez widocznych pasków przeglądarki.

* **Krok 1**: Uruchom AI Swarm OS na swoim komputerze/serwerze.
* **Krok 2**: Sprawdź lokalne IP swojego komputera w sieci Wi-Fi:
  - Na **Windows**: wpisz `ipconfig` w terminalu (szukaj linijki `IPv4 Address`, np. `192.168.1.25`).
  - Na **Linux/Mac**: wpisz `ip a` lub `ifconfig`.
* **Krok 3**: Otwórz przeglądarkę **Google Chrome** lub **Microsoft Edge** na swoim smartfonie z Androidem.
* **Krok 4**: Wpisz w pasek adresu: `http://<IP_TWOJEGO_KOMPUTERA>:3000`.
* **Krok 5**: Kliknij ikonę menu przeglądarki (trzy pionowe kropki w prawym górnym rogu).
* **Krok 6**: Wybierz opcję **"Dodaj do ekranu głównego"** (lub **"Zainstaluj aplikację"**).

> 🎉 **Rezultat**: Na pulpicie Twojego telefonu pojawi się ikona **AI Swarm OS**. Kliknięcie jej uruchomi aplikację w trybie pełnoekranowym bez interfejsu przeglądarki. Aplikacja zyskuje szybsze renderowanie i bezproblemowy dostęp do pamięci podręcznej.

### 2. Dostęp do sprzętu telefonu z pozycji klastra
Dzięki uruchomieniu jako PWA, przeglądarka udziela bezpiecznego dostępu do funkcji fizycznych telefonu. Kiedy wejdziesz do konsoli głosowej:
- **Mikrofon**: Możesz wydawać polecenia głosowe roju na żywo, leżąc na kanapie z telefonem.
- **Kamera**: Panel analizy wizualnej (Computer Vision) pozwoli Ci przesłać zdjęcie bezpośrednio z aparatu na żądanie.
- **Geolokacja**: Współrzędne GPS mogą być użyte przez agentów do automatyzacji zadań zależnych od lokalizacji.

---

## 🔗 Bezprzewodowa integracja MDM (ADB over Wi-Fi)

Chcesz, aby system operacyjny roju na PC kontrolował fizycznie Twój telefon z Androidem bez kabla (np. wysyłał powiadomienia, blokował, odtwarzał dźwięki alarmowe czy zarządzał aplikacjami)?

### Konfiguracja połączenia bezprzewodowego (Wireless Debugging):
1. **Aktywacja Opcji Programistycznych**:
   - Wejdź w telefonie w **Ustawienia > Informacje o telefonie**.
   - Klikaj **Numer kompilacji** (Build Number) szybko 7 razy, aż zobaczysz komunikat "Jesteś teraz programistą!".
2. **Włączenie debugowania**:
   - Przejdź do **Ustawienia > System > Opcje programistyczne**.
   - Włącz **Debugowanie USB**.
   - Włącz **Debugowanie bezprzewodowe** (Wireless Debugging) - upewnij się, że telefon jest połączony z tą samą siecią Wi-Fi co komputer.
3. **Parowanie bezprzewodowe**:
   - Kliknij na napis "Debugowanie bezprzewodowe", aby wejść w szczegóły, a następnie wybierz "Sparuj urządzenie za pomocą kodu parowania".
   - Telefon pokaże adres IP, port oraz kod parowania.
4. **Połączenie z komputera**:
   - Na komputerze, gdzie działa serwer Swarm OS, otwórz terminal i wpisz:
     ```bash
     adb pair <IP_TELEFONU>:<PORT_PAROWANIA>
     # Podaj wyświetlony kod parowania
     ```
   - Po pomyślnym sparowaniu połącz się na stałe:
     ```bash
     adb connect <IP_TELEFONU>:<PORT_DOROCZNY_Z_EKRANU_DEBUGOWANIA>
     ```
5. **Autoryzacja w Swarm OS**:
   - Twój Swarm OS automatycznie wykryje urządzenie jako aktywny węzeł w zakładce **Device Manager** lub **Mobile MDM** i będzie mógł wysyłać polecenia bezpośrednio do telefonu!
