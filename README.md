# Digitale Handouts Mathematik und KI

Begleitmaterial für die Praxisphasen einer Lehrkräftefortbildung. Die Veröffentlichung dieser Überarbeitung wurde am 2026-11-04 ausdrücklich freigegeben. Technischer Prüfstand: [Testbericht](docs/TESTBERICHT.md).

1. **Handout 1 – Hypothesenbildung · Praxisphase 1:** mit Aufgabe und vorliegender oder ausdrücklich fiktiver Schülerlösung beginnen. Das Aufgabenziel darf zunächst offenbleiben; der Prompt bittet dann um einen Zielvorschlag. Beobachtung von Deutung trennen, höchstens zwei vorläufige Hypothesen und einen Prüfschritt sichern. Keine Förderübungen in dieser Phase.
2. **Handout 2 – Förderbaustein entwickeln · Praxisphase 2:** einen Fall übernehmen oder unabhängig mit Aufgabe und Schülerlösung neu beginnen, bei Bedarf zunächst die KI-Diagnosehilfe nutzen. Geprüfte Ausgangslage beziehungsweise Arbeitsannahme kennzeichnen, ein enges Förderziel und ein Format wählen, Material fachlich prüfen.
3. **Handout 3 – Tool- und Promptbibliothek · offene Vertiefung:** 22 Aufgabenformate und sechs ergänzende Angebote mit vollständigen bearbeitbaren Prompts, Zweck, Einsatz, erwarteter Ausgabe und Prüffrage. Acht konkrete Bruchbeispiele zeigen Aufgaben, Lösungen, Beobachtungskriterien und Grenzen der Aussagekraft. Eigene KI-Ergebnisse und fachliche Anmerkungen lassen sich getrennt je Format festhalten. Verweise zur Tool-Übersicht und zur erhaltenen Individualisierungs-Vertiefung.

In Handout 2 benennt der Einstieg ausdrücklich, ob ein leerer eigener Fall angelegt oder ein vorbereitetes Beispiel übernommen wird. Die Auswahl allein verändert den bestehenden Entwurf nicht. Unter „1 · Ausgangslage klären“ erzeugt **Neuen Fall mit KI erschließen · wie in Phase 1** aus Aufgabe und Schülerlösung einen Diagnoseprompt. Eigene Hypothesen, Fachbegriffe, Aufgabenziel und Förderziel sind dafür keine Voraussetzung. Die Lehrkraft prüft die externe KI-Antwort und kopiert passende Aussagen selbst in die fünf Ergebnisfelder: Aufgabenziel, Beobachtung, offene Hypothesen, Prüfschritt und fehlende Informationen. Die ursprüngliche Schülerlösung bleibt getrennt von der festgehaltenen Beobachtung erhalten. Nichts gilt automatisch als bestätigt oder wird automatisch übernommen.

Erst danach kann unter „2 · Ein enges Ziel“ die optionale Hilfe **Förderziel mit KI formulieren** einen kopierbaren Prompt aus der Ausgangslage erzeugen – auch ohne vorhandenes Förderziel. Die Lehrkraft prüft die Zielvorschläge und übernimmt genau einen bewusst in das Zielfeld. Ein bereits vorhandenes Ziel wird nur nach Bestätigung ersetzt. Das gewählte Ziel fließt anschließend mit genau einem Format in den Förderprompt ein; bestehende Prompts werden nicht stillschweigend überschrieben. Die Diagnosehilfe ist kein verpflichtender Zusatzschritt, wenn die Ausgangslage bereits geklärt ist.

Für die Erprobung in Handout 3 kann der aktuelle Förderentwurf oder eine ausdrücklich fiktive Bruchauswertung als Kontext gewählt werden. Die acht festen Beispiele bleiben als Orientierung separat vom bearbeitbaren Prompt. Bei bewusstem Neubefüllen mit gleichem Kontext bleiben Ergebnis und Anmerkungen erhalten. Bei einem anderen Kontext wird eine vorhandene Erprobung zuvor als eigener Bibliotheksstand gesichert. Alle Stände sind im JSON-Export enthalten; eine volle Sammlung mit 500 Archiven lässt sich in eine unberührte Bibliothek zurückimportieren.

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
- Die neuen Word-Handouts enthalten auch das optionale H1-Aufgabenziel und die H2-Diagnose-/Zielhilfe. Umfang und Prüfgrenzen stehen im [Testbericht](docs/TESTBERICHT.md#word-handouts).

## Sicherung und Freigabe

Vor dem Umbau wurde der veröffentlichte Commit `d25d1e184d6f71e3228391b3fc682dd15fed6c20` auf GitHub unter `backup/vor-handout-umbau-2026-11-04` gesichert und überprüft. Entwicklungsbranch: `codex/handouts-praxisphasen`. GitHub Pages veröffentlicht weiterhin ausschließlich `main` im Repositorywurzelverzeichnis. Keine automatische Veröffentlichung dieser Arbeitskopie.

Die Freigabe „Neue Handouts veröffentlichen“ liegt vor. Weitere Veröffentlichungen nur im Rahmen eines entsprechenden Auftrags. [Rückkehranleitung](docs/SICHERUNG-UND-RUECKKEHR.md), [Testbericht](docs/TESTBERICHT.md), [Folienzuordnung](docs/FOLIENANPASSUNGEN.md).

## Prüfungen und Pflege

```sh
node --test tests/core.test.cjs
node --check handouts.js
node --check handouts-core.js
node --check library-data.js
```

Prüfstand 2026-11-04: 60 automatisierte Tests bestanden, einschließlich optionalem Aufgabenziel, H2-Diagnosehilfe, getrennter Speicherung von Schülerlösung und Beobachtung sowie Ergebnissen, Anmerkungen und Archiven der H3-Erprobung. Die Tests benötigen nur Node-Bordmittel. Sie ersetzen keine vollständige Browser-, Datenschutz- oder didaktische Validierung. [Tool-Linkcheck](docs/TOOL-LINKCHECK.md) dokumentiert Erreichbarkeit und Prüfgrenzen; historische Kostenangaben sind keine aktuelle Tarif- oder Schulfreigabe.

Nach Änderungen an `index.html` den kompatiblen Dateieinstieg `Digitale Handouts Mathematik.html` identisch halten. Word-Handouts werden mit `scripts/build_word_handouts.py` aus den erhaltenen Originalen und der Bibliothek erzeugt; nach Änderungen erneut rendern und prüfen. QA-Dateien und Teilnehmerdaten gehören nicht ins Repository.
