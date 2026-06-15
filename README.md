# System Operacyjny Roju (Cylon Core)

Centrum zarządzania rojem autonomicznych agentów AI.

## Funkcjonalności
- **Zarządzanie Plikami:** Interakcja z systemem plików (listowanie, usuwanie).
- **Orkiestracja Roju:** Automatyczna dekompozycja zadań (Swarm Command) na mniejsze sub-zadania z przypisaniem LLM.
- **Pamięć Agenta:** Śledzenie doświadczeń (sukcesy/porażki), optymalizacja promptów.
- **Diagnostyka:** Wykrywanie zatorów w łańcuchu zadań.

## Instalacja / Uruchomienie
Projekt jest w pełni kontenerowany i przystosowany do pracy wieloplatformowej.

- **Instalkacja lokalna (Szybka):**
  1. Upewnij się, że zależności zostały zainstalowane: `npm install`
  2. Uruchom deweloperski serwer: `npm run dev`
  3. Zbuduj do produkcji: `npm run build`

- **Podręczniki i szczegółowe przewodniki:**
  * 🖥️ [Podręcznik Docker, Linux, Termux & Android Native](DOCKER_I_ANDROID_INSTRUKCJA.md) - Kompleksowy przewodnik mobilny i sieciowy.
  * 🤖 [Instrukcja Produkcyjna Docker + Windows + LM Studio](DOCKER_I_WINDOWS_INSTRUKCJA.md) - Przewodnik lokalnego LLM.
  * 📱 [Android & Hosting Deployment Guide](INSTALL-ANDROID-HOSTING.md) - Rozwinięcie m.in. chmury i VPS.

## Dokumentacja API
- `/api/fs/list` (POST): Listowanie plików
- `/api/fs/delete` (POST): Usuwanie plików

## Wsparcie
W razie problemów użyj panelu diagnostycznego lub funkcji "Autonaprawy" w panelu LLM Core.
