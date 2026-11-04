# Digitale Handouts Mathematik und KI

Begleitmaterial für die Praxisphasen einer Lehrkräftefortbildung. Diese Entwicklungsfassung ist noch nicht veröffentlicht.

1. **Handout 1 – Hypothesenbildung · Praxisphase 1:** einen Fall und ein konkretes Aufgabenziel wählen, Beobachtung von Deutung trennen, höchstens zwei vorläufige Hypothesen und einen Prüfschritt sichern. Keine Förderübungen in dieser Phase.
2. **Handout 2 – Förderbaustein entwickeln · Praxisphase 2:** einen Fall übernehmen oder unabhängig neu beginnen, Ausgangslage beziehungsweise Arbeitsannahme kennzeichnen, ein enges Ziel und ein Format wählen, Material fachlich prüfen.
3. **Handout 3 – Tool- und Promptbibliothek · offene Vertiefung:** 22 Aufgabenformate und sechs ergänzende Angebote mit vollständigen bearbeitbaren Prompts, Zweck, Einsatz, erwarteter Ausgabe und Prüffrage. Verweise zur Tool-Übersicht und zur erhaltenen Individualisierungs-Vertiefung.

## Lokal öffnen

`index.html` oder `Digitale Handouts Mathematik.html` im Browser öffnen. Beide Einstiege sind identisch und verwenden dieselben lokalen Dateien: `handouts.css`, `handouts-core.js`, `library-data.js`, `handouts.js`. Deshalb das gesamte Projekt herunterladen, nicht nur eine einzelne HTML-Datei. Kein Framework und keine Installation erforderlich. Für zuverlässige Browser-Speicherung und Zwischenablage ist ein lokaler HTTP-Server empfehlenswert:

```sh
python3 -m http.server 4186 --bind 127.0.0.1
```

Dann `http://127.0.0.1:4186/` öffnen. Die Vorschau ist nur auf diesem Rechner erreichbar. Eine lokale Vorschau und GitHub Pages besitzen getrennte Browser-Speicher.

## Daten und alte Links

- Speicherung erfolgt nur im Browser. Keine automatische Übermittlung an KI-Anbieter, keine Telemetrie, keine Zugangsdaten.
- „Alle Arbeitsstände als Datei sichern“ exportiert die Fälle, Förderentwürfe, bearbeiteten Bibliotheksvorlagen und erhaltenen Rückfallstände als JSON. Import ergänzt vorhandene Arbeitsstände; er ersetzt sie nicht.
- Originale des bisherigen Schlüssels `digitale-handouts-foerderbaustein` bleiben unverändert. Die neue Version verwendet `digitale-handouts-v2`. Zuordnung und Grenzen sind in [MIGRATION.md](docs/MIGRATION.md) beschrieben.
- Bei blockierter Speicherung oder konkurrierenden Änderungen aus einem anderen Tab wird gewarnt. Dann vor dem Schließen exportieren. Browserbereinigung kann lokale Daten entfernen.
- `#station1` bleibt Bibliothek, `#station2` bleibt Hypothesenbildung/Fehleranalyse und `#station3` bleibt Förderbaustein. Neue Links heißen `#bibliothek`, `#hypothesen`, `#foerderbaustein`.
- Word-Downloads tragen die neuen Handoutnummern. Die drei alten Dateinamen bleiben zur Kompatibilität erhalten; ihre unveränderten Inhalte zeigen den früheren Stand.

## Sicherung und Freigabe

Vor dem Umbau wurde der veröffentlichte Commit `d25d1e184d6f71e3228391b3fc682dd15fed6c20` auf GitHub unter `backup/vor-handout-umbau-2026-11-04` gesichert und überprüft. Entwicklungsbranch: `codex/handouts-praxisphasen`. GitHub Pages veröffentlicht weiterhin ausschließlich `main` im Repositorywurzelverzeichnis. Keine automatische Veröffentlichung dieser Arbeitskopie.

Nicht ohne ausdrückliche Abnahme nach `main` übernehmen oder veröffentlichen. [Rückkehranleitung](docs/SICHERUNG-UND-RUECKKEHR.md), [Testbericht](docs/TESTBERICHT.md), [notwendige Folienanpassungen](docs/FOLIENANPASSUNGEN.md).

## Prüfungen und Pflege

```sh
node --test tests/core.test.cjs
node --check handouts.js
node --check handouts-core.js
node --check library-data.js
```

Die Tests benötigen nur Node-Bordmittel. Sie ersetzen keine vollständige Browser-, Datenschutz- oder didaktische Validierung. [Tool-Linkcheck](docs/TOOL-LINKCHECK.md) dokumentiert Erreichbarkeit und Prüfgrenzen; historische Kostenangaben sind keine aktuelle Tarif- oder Schulfreigabe.

Nach Änderungen an `index.html` den kompatiblen Dateieinstieg `Digitale Handouts Mathematik.html` identisch halten. Word-Handouts werden mit `scripts/build_word_handouts.py` aus den erhaltenen Originalen und der Bibliothek erzeugt; nach Änderungen erneut rendern und prüfen. QA-Dateien und Teilnehmerdaten gehören nicht ins Repository.
