# Instrukcje dla Agentów i Orkiestratora Swarm

Niniejszy dokument przedstawia kluczowe zasady operacyjne oraz architektoniczne, które muszą być ściśle przestrzegane przez wszystkich agentów AI wchodzących w skład roju (Swarm) oraz przez sam Orkiestrator/Supervisor.

## 1. Optymalizacja Okna Kontekstu i Przetwarzanie Logów

### Problem Przelania Okna Kontekstowego (Context Window Clogging)
Zwracanie pełnych, surowych logów konsolowych z procesów tła (np. z **ComfyUI**, silników renderowania klatek, **FFmpeg** przedstawiających postęp klatka po klatce itp.) generuje setki linijek niepotrzebnego tekstu. Taki śmietnik systemowy w ciągu kilku kroków zapełni całe dostępne okno kontekstowe Supervisora, powodując utratę spójności, zapominanie celu nadrzędnego oraz drastyczne obniżenie jakości działania agentów.

### Rozwiązanie i Obowiązkowa Reguła:
- **Lakoniczność Wyników dla LLM (Maksymalna Synteza):** Wszystkie narzędzia CLI, skrypty wykonawcze oraz integracje backendowe (w tym PowerShell, bash, webhooki) zwracające rezultaty do agenta/orkiestratora **MUSZĄ** filtrować wyjście.
- **Forma Zwracanego Komunikatu:** Narzędzie zwraca wyłącznie esencjonalną informację zwrotną o statusie końcowym, np.:
  > `Sukces: Plik wideo został pomyślnie zmontowany i zapisany jako uploads/animacja_01.mp4`
- **Przekierowanie Surowych Logów (Log Offloading):** Pełny strumień diagnostyczny (`stdout` i `stderr`) z takich narzędzi jak FFmpeg czy ComfyUI musi być przekierowywany do dedykowanych plików logów w bezpiecznym katalogu, np. `uploads/logs/render.log`. Agent w ogóle nie powinien ich bezpośrednio parsować, chyba że poprosi o to użytkownik w celach szczegółowego debugowania błędu.

---

## 2. Architektura i Trwałość Danych

- **Lokalne Przechowywanie:** Wszystkie pliki wynikowe z generatorów multimediów, pliki wideo, audio oraz kompilacje powinny być zapisywane w katalogu `uploads/` i zarządzane przez System Management Hub.
- **Bezpieczeństwo Wykonywania Kodów:** Wszelkie operacje bazodanowe z poziomu konsoli MCP powinny unikać destrukcyjnych instrukcji typu `DROP` i `ALTER`, o ile nie są one niezbędne i potwierdzone bezpośrednio.
