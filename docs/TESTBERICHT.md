# Testbericht der Entwicklungsfassung

Datum: 2026-11-04. Branch: `codex/handouts-praxisphasen`. Ausschließlich fiktive Testeingaben. Keine Veröffentlichung und keine Übermittlung von Schülerdaten oder Prompts an einen KI-Anbieter.

## Ergebnis

Die drei Praxisphasen, die 22 Aufgabenformate, sechs zusätzliche Bibliotheksangebote, die Datenübernahme und die drei neuen Word-Handouts sind umgesetzt. 25 automatisierte Tests bestehen. Die folgenden Browserprüfungen wurden zusätzlich tatsächlich durchgeführt; sie sind keine Behauptung einer vollständigen Geräte- oder Unterrichtsvalidierung.

## Automatisierte Prüfungen

`node --test tests/core.test.cjs`: **25 bestanden, 0 fehlgeschlagen**.

- Sechs unterschiedliche Beispielaufgaben und unabhängige neue Fälle mit eigenen Kennungen.
- Umlaute, Brüche, Anführungszeichen und mehrzeilige Texte in Speicherung und Prompts.
- Handout 1: höchstens zwei Hypothesen, fehlende Informationen und geplanter Prüfschritt; ausdrücklicher Ausschluss von Förderübungen.
- Handout 2: eigenständiger Einstieg, gemeinsamer Ergebnisrahmen, vollständige Übernahme bekannter Informationen aus Handout 1; offene, beobachtete und ausdrücklich angenommene Ausgangslagen getrennt.
- Ein ausgewähltes Format statt aller Formate im Förderprompt.
- Nicht destruktive Altdatenmigration einschließlich beider früheren Zielfelder und unbekannter Originalfelder.
- Ablehnung beschädigter und ungültiger Importe; Normalisierung minimaler gültiger Datensätze.
- Import ergänzt statt zu ersetzen; aktuelle und frühere Bibliotheksbearbeitungen, Originale und nicht lesbare Rückfalltexte bleiben beim erneuten Export erhalten.
- Grenzen von 500 Fällen, Förderentwürfen beziehungsweise Bibliotheksarchiven geprüft; Überschreitungen ändern die bestehenden Daten nicht.
- Genau 22 verlangte Formate und sechs vollständige Ergänzungen mit Zweck, Einsatz, Ausgabe, Prüffrage und bearbeitbarem Prompt.
- Historische Anker behalten ihre Bedeutung. Eindeutige HTML-IDs, vorhandene lokale Assets und Downloads, identische HTML-Einstiegsdateien.
- Speicherhinweise, Datei-Export/-Import und manueller Kopierdialog sind vorhanden.

Zusätzlich: JavaScript-Syntaxprüfung, `git diff --check`, Prüfung der neuen Word-Dateien sowie Bytegleichheit der drei erhaltenen alten DOCX-Dateien gegenüber dem Ausgangsstand.

## Tatsächlich geprüfte Browserabläufe

Lokale HTTP-Vorschau auf `127.0.0.1:4186`, hauptsächlich in DuckDuckGo auf macOS; ergänzende Layout- und DOM-Prüfung im integrierten Chromium-Browser.

| Ablauf | Beobachtetes Ergebnis |
| --- | --- |
| Beispiel und Diagnoseprompt | Bruchaddition auswählbar, Prompt mit den Fallangaben erzeugt; freie mehrzeilige Texte mit Umlauten und ½ / ⅓ erhalten |
| Übergang Handout 1 → 2 | Bestätigter Übergang erzeugt zusätzlichen Entwurf; weitere bekannte Informationen werden mitgenommen, Hypothesen bleiben offen |
| Förderprompt | Enges Ziel und ein Format ausgewählt; Kontext, bedingte Planung, Materialrahmen und Erfolgskontrolle enthalten |
| Neuladen | Fall, Förderziel, Prompt und Material wiederhergestellt |
| Eigenständiger Förderentwurf | Neuer leerer Entwurf ohne Handout-1-Übernahme angelegt; Rückwechsel zum ersten Entwurf erhält dessen Texte |
| Export und Import | JSON tatsächlich heruntergeladen, Inhalt strukturell geprüft und über Dateiauswahl wieder importiert; Original und zusätzlicher Import nebeneinander erhalten |
| Bibliothek | Suche „sprachsens“ ergibt einen Treffer; vollständige Vorlage geöffnet, bearbeitet und kopiert; erfolgreiche Kopierrückmeldung |
| Tastatur | Eingaben und Auswahl über Tastatur, Fokuswechsel und Cmd+P geprüft; keine vollständige Screenreader-Prüfung |
| Browserkonsole | Bei abschließendem Laden und Navigation im integrierten Browser keine erfassten Fehler oder Warnungen |
| Schmale Ansichten | 390 × 844 und 820 × 1180 als Browser-Viewport geprüft; Inhaltsbreiten 375 bzw. 805 px ohne horizontales Überlaufen; kein Test an physischen iPhones/iPads |

### Druck

Der ausgefüllte Förderbaustein wurde sowohl über die Druckschaltfläche als auch mit Cmd+P in der macOS-Druckvorschau geprüft. Bei **A4 und 100 %** enthält der Test drei Seiten: vollständige Dokumentation und anschließend das separat beginnende Material mit Rohentwurf und überarbeiteter Fassung. Es wurde kein Auftrag an den Drucker gesendet.

Bei der vorgefundenen Skalierung von 95 % verschob DuckDuckGo die Umbrüche ungünstig. Daher enthält die Bedienhilfe den Hinweis auf A4, 100 % und Vorschaukontrolle. Seitenzahl und Umbrüche können bei anderen Browsern, Druckeinstellungen und erheblich längeren KI-Texten abweichen. Der große Materialblock darf sich über mehrere Seiten verteilen. Ohne vorhandenen Förderentwurf zeigt der Druck nun einen passenden Hinweis für Handout 2, nicht versehentlich Handout 1.

### Word-Handouts

- Handout 1 – Hypothesenbildung: 2 Seiten.
- Handout 2 – Förderbaustein entwickeln: 4 Seiten, einschließlich Material zum Weiterarbeiten.
- Handout 3 – Tool- und Promptbibliothek: 16 Seiten, alle 22 Formate und sechs Ergänzungen.

Alle 22 gerenderten Seiten visuell geprüft; keine abgeschnittenen Inhalte, überlaufenden Tabellen oder unerwünschten Leerseiten im geprüften Renderer. DOCX-Paket-/Strukturprüfungen und automatischer Barrierefreiheitscheck ohne Befund. Die drei bisherigen Downloads bleiben unverändert erhalten. Die neuen Dateien sind gewöhnlich bearbeitbare Word-Dokumente, keine gesperrten Formularmasken. Desktop-Microsoft-Word wurde nicht durchgetestet; dessen Umbrüche und automatische Seitenfelder können nach Aktualisierung abweichen.

### Erhaltene Zusatzseiten und externe Links

Alle 23 Tool-Einträge und die vorhandene Individualisierungs-Vertiefung bleiben erhalten. 45 externe Adressen geprüft: 31 HTTP 200, 12 HTTP 403, zwei Weiterleitungsgrenzen. Kein 404-/410-Befund. Details und methodische Grenzen: [TOOL-LINKCHECK.md](TOOL-LINKCHECK.md). Tarife, Datenschutz, Altersbedingungen und schulische Freigaben sind damit ausdrücklich nicht bestätigt.

## Grenzen und vor einer Veröffentlichung noch sinnvoll

- Keine reale Kinderdiagnostik, Unterrichtserprobung oder empirische Prüfung der Lernwirkung. Gute Promptvorgaben garantieren keine fachlich richtige KI-Antwort.
- Die Migration wurde automatisiert mit konstruierten Altständen geprüft, nicht durch Eingriffe in den persönlichen Produktionsspeicher des Nutzers. Die lokale Vorschau und GitHub Pages sind getrennte Speicherorte.
- Der manuelle Clipboard-Ausweichdialog und beschädigte Browser-Speicherstände sind im Code beziehungsweise in Kernlogiktests berücksichtigt; eine reale Clipboard-Verweigerung und alle Browser-Speicherausfälle wurden nicht durchgängig im UI provoziert.
- Konkurrierende Tabs, große Langzeitbestände und sehr lange KI-Ausgaben sind nicht als vollständiger Last-/Dauertest abgedeckt.
- Im integrierten Browser waren einzelne native Dialog-/Klickabläufe unzuverlässig. Die wesentlichen Interaktionen wurden deshalb zusätzlich im vom Nutzer genannten DuckDuckGo getestet; eine reine DOM-Prüfung wurde nicht als Klicktest ausgegeben.
- Physisches iPhone/iPad, Screenreader und schulspezifisch administrierte Browser noch nicht geprüft.
- Lokale HTML-Dateien lassen sich vom Nutzer direkt öffnen. Die automatisierte Vorschauprüfung erfolgte über HTTP; direktes `file:` wurde nicht als erfolgreich getestet. Für verlässliche Speicherung und Zwischenablage empfiehlt die README den lokalen HTTP-Server.
- Vor Freigabe die neue Reihenfolge und die Word-Handouts gemeinsam fachlich abnehmen; die in [FOLIENANPASSUNGEN.md](FOLIENANPASSUNGEN.md) genannten Präsentationstitel anpassen. Die Präsentation selbst wurde in diesem Auftrag nicht verändert.

## Veröffentlichung und Rückkehr

Der Produktionsbranch und die geprüfte Sicherungsreferenz bleiben beim Ausgangs-Commit `d25d1e184d6f71e3228391b3fc682dd15fed6c20`. Diese Entwicklungsfassung wurde nicht nach `main` übernommen, nicht auf GitHub Pages veröffentlicht und nicht als Entwicklungsbranch gepusht. Sicherung, Prüfsummen und nicht destruktive Rückkehr: [SICHERUNG-UND-RUECKKEHR.md](SICHERUNG-UND-RUECKKEHR.md).
