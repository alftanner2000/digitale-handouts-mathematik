# Testbericht der Entwicklungsfassung

Datum: 2026-11-04. Branch: `codex/handouts-praxisphasen`. Ausschließlich fiktive Testeingaben. Keine Übermittlung von Schülerdaten oder Prompts an einen KI-Anbieter. Die Veröffentlichung wurde vom Nutzer ausdrücklich freigegeben; technischer Status siehe unten.

## Ergebnis

Die drei Praxisphasen, die 22 Aufgabenformate, sechs zusätzliche Bibliotheksangebote, die Datenübernahme und die drei neuen Word-Handouts sind umgesetzt. Einschließlich der Zielhilfe, des optionalen Aufgabenziels, des H2-Diagnosewegs und der H3-Format-Erprobungen mit acht konkreten Beispielen bestehen 60 automatisierte Tests. Die folgenden Browserprüfungen wurden zusätzlich tatsächlich durchgeführt; sie sind keine Behauptung einer vollständigen Geräte- oder Unterrichtsvalidierung.

## Automatisierte Prüfungen

`node --test tests/core.test.cjs`: **60 bestanden, 0 fehlgeschlagen**, am 2026-11-04 erneut ausgeführt.

- Sechs unterschiedliche Beispielaufgaben und unabhängige neue Fälle mit eigenen Kennungen.
- Umlaute, Brüche, Anführungszeichen und mehrzeilige Texte in Speicherung und Prompts.
- Handout 1: Aufgabenziel optional; ein fehlendes Ziel wird nur als aufgabenbezogener Vorschlag angefordert, nicht als Lernstand behauptet. Höchstens zwei Hypothesen, fehlende Informationen und geplanter Prüfschritt; ausdrücklicher Ausschluss von Förderübungen.
- Handout 2: eigenständiger Einstieg, Diagnosehilfe ohne vorab formulierte Hypothesen, Ziele oder Format, gemeinsamer Ergebnisrahmen und vollständige Übernahme bekannter Informationen aus Handout 1; offene, beobachtete und ausdrücklich angenommene Ausgangslagen getrennt.
- Ursprüngliche Schülerlösung und festgehaltene Beobachtung werden bei neuer H1-Übernahme getrennt gespeichert. Ältere kombinierte Ausgangslagentexte bleiben unverändert erhalten; die neuen optionalen Felder überstehen wiederholte JSON-Importe.
- Ein ausgewähltes Format statt aller Formate im Förderprompt.
- Nicht destruktive Altdatenmigration einschließlich beider früheren Zielfelder und unbekannter Originalfelder.
- Ablehnung beschädigter und ungültiger Importe; Normalisierung minimaler gültiger Datensätze.
- Import ergänzt statt zu ersetzen; aktuelle und frühere Bibliotheksbearbeitungen, Originale und nicht lesbare Rückfalltexte bleiben beim erneuten Export erhalten.
- Grenzen von 500 Fällen, Förderentwürfen beziehungsweise Bibliotheksarchiven geprüft; Überschreitungen ändern die bestehenden Daten nicht.
- Genau 22 verlangte Formate und sechs vollständige Ergänzungen mit Zweck, Einsatz, Ausgabe, Prüffrage und bearbeitbarem Prompt.
- Acht konkrete Beispiele mit getrennten Feldern für Kontext, Aufgabe, Lösung, Beobachtungskriterium und Aussagegrenze; der fiktive Beispielkontext und der Modus `sample` sind mit Speicherversion 2 kompatibel.
- Ergebnisse und Anmerkungen je Format, unveränderte Alt-Drafts, Archivierung beim Kontextwechsel sowie Rückimport einer vollen Sammlung mit 500 Bibliotheksarchiven. Bestehende Kontext-/Materialfelder verhindern ein Ersetzen der aktiven Bibliothek.
- Historische Anker behalten ihre Bedeutung. Eindeutige HTML-IDs, vorhandene lokale Assets und Downloads, identische HTML-Einstiegsdateien.
- Speicherhinweise, Datei-Export/-Import und manueller Kopierdialog sind vorhanden.

Zusätzlich: JavaScript-Syntaxprüfung, `git diff --check`, Prüfung der neuen Word-Dateien sowie Bytegleichheit der drei erhaltenen alten DOCX-Dateien gegenüber dem Ausgangsstand.

### Ergänzung: neuer Diagnoseweg und optionale Aufgabenziele

Gegenüber dem 32-Test-Stand kamen zehn automatisierte Prüfungen hinzu: zwei zum optionalen H1-Aufgabenziel, fünf zur H2-Diagnosehilfe und drei zur getrennten Schülerlösung/Beobachtung. Der zwischenzeitliche 39-Test-Stand ist dadurch überholt. Geprüft werden unter anderem die fünf Antwortüberschriften, höchstens zwei offene Hypothesen, fehlende Ausgangsdaten ohne erfundene Kinderantwort, unveränderte Ergebnisfelder bei Prompterzeugung sowie die Kompatibilität älterer Speicherstände.

Der neue H2-Weg lautet: Aufgabe und vorliegende oder ausdrücklich fiktive Schülerlösung → optionaler Diagnoseprompt → externe Antwort fachlich prüfen und passende Aussagen selbst in die fünf Ergebnisfelder kopieren → Ausgangslage beziehungsweise Arbeitsannahme kennzeichnen → optional Zielvorschläge prüfen und genau ein Förderziel wählen → Format und Förderprompt. Eine bereits geklärte Ausgangslage muss nicht erneut durch die Diagnosehilfe geführt werden. Der Aufgabenzielvorschlag beschreibt die mathematische Anforderung, keine bestätigte Eigenschaft des Kindes.

Die Kernlogikprüfung wird durch den unten gesondert dokumentierten Browsercheck des neuen Diagnosewegs ergänzt. Keine externe KI-Antwort oder Lernwirkung wurde damit validiert.

### Ergänzung: acht Beispiele und eigene Format-Erprobungen

Zum 42-Test-Stand kamen 18 Prüfungen hinzu: vier zu den optionalen Ergebnis-/Anmerkungsfeldern, sechs zum sicheren Neubefüllen, vier zur Importgrenze und Erhaltung vorhandener Bibliotheken sowie vier zu Beispielstruktur und Beispielmodus. Der unabhängige Gegencheck fand den Grenzfall, dass 500 Archive zuzüglich einer aktiven Bibliothek zunächst nicht zurückimportierbar waren. Der korrigierte Import übernimmt die aktive Bibliothek nur in eine wirklich unberührte neutrale Zielbibliothek und zählt ausschließlich den tatsächlichen Archivzuwachs. Unbekannte Materialfelder werden dabei nicht übergangen.

Die acht Mini-Beispiele wurden unabhängig mathematisch und didaktisch gelesen. Rechnungen, gleich großes Bezugs-Ganzes und Teilgrößen sind stimmig. Die Diagnose-Kontrastaufgabe wartet den eigenen Versuch ab und gibt zuvor weder Sechstel noch Ergebnis vor. Förderbeispiele kennzeichnen Arbeitsannahmen und Hilfenutzung; das Exit-Ticket behauptet keine dauerhafte Kompetenz oder gesicherte Lernwirkung. Dies ist eine fachliche Inhaltsprüfung, keine empirische Validierung.

Die neue H3-Ergebnis-/Archivoberfläche wurde zusätzlich im integrierten Browser geprüft: Übergang aus H2 übernimmt den ausgewählten Förderentwurf, Auswahl der fiktiven Bruchauswertung erzeugt einen passenden vollständigen Prompt, der Acht-Beispiele-Filter zeigt 8 von 28 Angeboten. Der Prompt wurde erfolgreich in die Zwischenablage kopiert. Ergebnis und Prüfanmerkung blieben nach Neuladen erhalten. Ein Kontextwechsel ließ den vorhandenen Prompt und seine Ergebnisse zunächst unverändert und zeigte eine Warnung. Bewusstes Neubefüllen mit Bestätigung erzeugte den neuen Prompt; das alte Ergebnis und die Anmerkung wurden anschließend im gesonderten Bibliotheksarchiv vollständig wiedergefunden. Ausschließlich fiktive Prüfeingaben.

Statisch bekannte Druckgrenze: Sind mehrere H3-Formate gleichzeitig geöffnet, bereitet Cmd+P das erste sichtbare geöffnete Format in der Seitenreihenfolge vor, nicht zwingend das zuletzt bearbeitete. Für eine eindeutige Auswahl die Schaltfläche „Prompt und Erprobung drucken“ direkt beim gewünschten Format verwenden. Ihr Aufruf blockierte im integrierten Browser die weitere Browsersteuerung am System-Druckdialog. Deshalb ist der neue H3-Druck noch nicht visuell als erfolgreich bestätigt; die frühere H2-Druckprüfung bleibt davon getrennt. Kein Druckauftrag wurde ausgelöst.

## Tatsächlich geprüfte Browserabläufe

Lokale HTTP-Vorschau auf `127.0.0.1:4186`, hauptsächlich in DuckDuckGo auf macOS; ergänzende Layout- und DOM-Prüfung im integrierten Chromium-Browser.

### Ergänzung: H1 ohne Aufgabenziel und neuer H2-Diagnoseweg

Nach der Trennung von Schülerlösung und Beobachtung im integrierten Chromium-Browser auf `127.0.0.1:4186` tatsächlich durchgeführt:

- In Handout 2 einen zusätzlichen leeren eigenen Entwurf angelegt; der bisherige Fall blieb erhalten. Nur die Aufgabe `3,5 + 12` und die ausdrücklich fiktive Lösung `4,7` eingegeben, ohne Aufgabenziel, Förderziel oder eigene Hypothesen.
- Die Diagnosehilfe geöffnet und den Prompt erfolgreich erzeugt: 3039 Zeichen mit den fünf vorgesehenen Überschriften. Das Aufgabenziel blieb optional.
- Eine Beobachtung manuell im getrennten Feld `noticed` festgehalten. Nach Neuladen waren die ursprüngliche Lösung (`observation`), die Beobachtung und der vollständige Diagnoseprompt erhalten.
- In Handout 1 einen zusätzlichen fiktiven Fall `6 × 7 = 13` ohne Aufgabenziel angelegt. Die Diagnoseprompterzeugung funktionierte und forderte bei Bedarf einen Zielvorschlag an.
- Diesen H1-Fall nach Bestätigung als dritten Förderentwurf übernommen. Schülerlösung und Beobachtung blieben getrennt, das Aufgabenziel leer und die beiden bisherigen Entwürfe erhalten.
- Aus dem übernommenen Fall anschließend die Zielhilfe ohne vorhandenes Förderziel erfolgreich erzeugt.

Diese Schritte prüfen Bedienung und Erhaltung der Eingaben. Es wurde keine reale KI-Antwort eingeholt oder als fachlich richtig bestätigt.

### Ergänzung: Einstieg und KI-Zielhilfe

Am selben Tag nach dem ersten Entwicklungscommit ergänzt und in DuckDuckGo geprüft:

- Auswahl „Eigenes neues Beispiel · mit leeren Feldern beginnen“ lässt den aktuellen Entwurf unverändert. Erst „Leeren Förderentwurf anlegen“ erzeugt einen weiteren leeren Entwurf; vorherige bleiben auswählbar.
- Ein eigener fiktiver Bruchfall wurde eingegeben. Der Zielprompt ließ sich ohne vorhandenes Förderziel und ohne ausgewähltes Format erzeugen.
- Ein fiktiver Zielvorschlag wurde bewusst ins Hauptzielfeld übernommen. Bei einem zweiten Vorschlag erschien eine Ersetzen-Bestätigung; Abbrechen erhielt das erste Ziel.
- Nach Neuladen waren der Fall und das gewählte Ziel weiterhin vorhanden. Ein Förderprompt ließ sich danach mit einem ausgewählten Format erzeugen.
- Die optionalen Felder `goalPrompt`, `goalPromptSource` und `goalCandidate` werden mit dem jeweiligen Förderentwurf gespeichert und exportiert. Die Speicherversion bleibt 2; fehlende Felder älterer Stände werden mit leeren Werten ergänzt.
- Sieben zusätzliche Kernlogiktests prüfen die neue Zielhilfe, alle drei Ausgangslagen, die fehlende Ziel-/Formatvoraussetzung, das unveränderte ursprüngliche Ziel und die Kompatibilität mit älteren Importen.

Die KI-Hilfe erzeugt lediglich einen Prompt. Es wurde kein externer KI-Dienst aufgerufen und keine reale KI-Antwort auf ihre Qualität geprüft. Die manuelle Übernahme wurde mit ausdrücklich fiktivem Text getestet. Die vorhandene Kopierfunktion wird wiederverwendet; in diesem Ergänzungstest wurde sie nicht separat erneut getestet. Die spätere Synchronisierung der Word-Handouts ist unten gesondert dokumentiert.

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
- Handout 2 – Förderbaustein entwickeln: 5 Seiten, einschließlich Diagnose-/Zielhilfe und Material zum Weiterarbeiten.
- Handout 3 – Tool- und Promptbibliothek: 20 Seiten, alle 22 Formate und sechs Ergänzungen auf den Seiten 1–16, acht konkrete Beispiele auf den Seiten 17–20.

Die synchronisierten Handouts 1 und 2 sowie alle 20 Seiten der zuletzt erweiterten H3-Datei wurden visuell geprüft, insgesamt 27 Seiten. Keine abgeschnittenen Inhalte, überlaufenden Tabellen oder unerwünschten Leerseiten im geprüften Renderer. Die vorherigen DOCX-Paket-/Strukturprüfungen und der automatische Barrierefreiheitscheck waren ohne Befund; diese Befunde beziehen sich auf den damaligen Dateistand. Die drei bisherigen Downloads bleiben unverändert erhalten. Die neuen Dateien sind gewöhnlich bearbeitbare Word-Dokumente, keine gesperrten Formularmasken. Desktop-Microsoft-Word wurde nicht durchgetestet; dessen Umbrüche und automatische Seitenfelder können nach Aktualisierung abweichen.

Der zunächst rein lesende Inhaltsabgleich zeigte abweichende Einstiegsanweisungen. Diese wurden anschließend in einem gesonderten Arbeitsschritt im Word-Generator und in den drei neuen DOCX synchronisiert:

- Handout 1 beginnt mit Aufgabe und vorliegender beziehungsweise ausdrücklich fiktiver Lösung. Das Aufgabenziel ist optional; die Diagnosehilfe verwendet die sechs vorgesehenen Ausgabeüberschriften.
- Handout 2 führt den neuen Fall über die optionale Diagnosehilfe und fachlich geprüfte Ergebnisfelder zur optionalen Zielhilfe und genau einem bewusst gewählten Förderziel. Ursprüngliche Lösung und festgehaltene Beobachtung bleiben getrennt. Fördermaterial und neue Erfolgskontrolle ohne KI sind weiterhin enthalten.
- Handout 3 ergänzt die Einstiegshilfe für ein noch fehlendes Ziel. Diagnosevorlage 28 erlaubt einen vorsichtigen, aufgabenbezogenen Zielvorschlag, ohne einen Lernstand zu behaupten. Alle 28 Promptkörper und die 40 Textwerte der acht ergänzten Beispiele wurden vollständig mit `library-data.js` abgeglichen.

Die finalen Renderprüfungen dieses Stands umfassen 2, 5 und 20 Seiten. Sie belegen die geprüfte Darstellung und die genannten inhaltlichen Anpassungen, keine Unterrichtserprobung oder allgemeine Freigabe für schulische KI-Nutzung.

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
- Die zugehörige Präsentation „Mathematische Basiskompetenzen Stand 03.11“ wurde über Firefox an die neue Zuordnung angepasst. Einzelheiten und verbleibende Prüfpunkte: [FOLIENANPASSUNGEN.md](FOLIENANPASSUNGEN.md).

## Veröffentlichung und Rückkehr

Der Produktionsbranch und die geprüfte Sicherungsreferenz bleiben beim Ausgangs-Commit `d25d1e184d6f71e3228391b3fc682dd15fed6c20`. Diese Entwicklungsfassung wurde nicht nach `main` übernommen, nicht auf GitHub Pages veröffentlicht und nicht als Entwicklungsbranch gepusht. Sicherung, Prüfsummen und nicht destruktive Rückkehr: [SICHERUNG-UND-RUECKKEHR.md](SICHERUNG-UND-RUECKKEHR.md).
