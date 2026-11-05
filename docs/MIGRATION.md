# Speicher und Linkkompatibilität

## Inhaltliche Zuordnung

| Früher | Jetzt | Alte Adresse bleibt inhaltlich gleich |
| --- | --- | --- |
| Handout 1 Promptbibliothek | Handout 3 Tool- und Promptbibliothek | `#station1` → `#bibliothek` |
| Handout 2 Fehleranalyse | Handout 1 Hypothesenbildung | `#station2` → `#hypothesen` |
| Handout 3 Förderbaustein | Handout 2 Förderbaustein entwickeln | `#station3` → `#foerderbaustein` |

Beide HTML-Einstiege bleiben vorhanden. Weiterleitungen ändern nur das Fragment; keine Eingaben werden in URLs geschrieben. Tools und Individualisierung verweisen lokal auf die semantischen Ziele. Bestehende externe Anbieter- und statische Vorlagenlinks wurden nicht um persönliche Eingaben ergänzt.

## Vorhandene Daten

Die bisherige Fassung speicherte manuell die Inputs/Textareas aus dem Förderbaustein unter `digitale-handouts-foerderbaustein`. Diagnosefelder und Bibliotheksbearbeitungen waren dort nicht gespeichert. Nicht gespeicherte alte Browserpuffer lassen sich nicht nachträglich aus Git rekonstruieren.

Die neue Version schreibt ausschließlich `digitale-handouts-v2`. Beim ersten Start ohne V2-Stand wird ein gültiger alter Förderbaustein als eigener Entwurf in Handout 2 übernommen:

| Alter Feldname | Neues Feld |
| --- | --- |
| buildClass / buildTopic | grade / topic |
| buildObservation / buildTaskGoal | observation / taskGoal |
| buildError / buildConception | hypotheses / conception |
| buildGoal1 + buildGoal2 | goal, beide Texte erhalten; anschließend auf ein Ziel eingrenzen |
| buildDraft / buildAdjustments / buildFinal | draft / adjustments / final |
| buildUse / buildSuccess | use / success |

Alle alten Werte, auch unbekannte Felder, Modultexte und Modulhäkchen, bleiben zusätzlich in `legacyOriginal` und `legacy.original` enthalten. Sie sind im Förderentwurf aufklappbar. Der alte Schlüssel wird weder verändert noch gelöscht. Frühere Prüfcheckboxen ohne ID wurden schon durch die alte Website nicht persistiert und können nicht wiederhergestellt werden.

Die alte Maske erfasste Aufgabe und Schülerlösung gemeinsam. Dieser Text bleibt vollständig im neuen Ausgangslagenfeld; eine eigene Aufgabe wird nicht automatisch aus dem Fehlertext geraten. Für die Diagnosehilfe Aufgabe und vorliegende beziehungsweise ausdrücklich fiktive Schülerlösung bereitstellen. Ein Aufgabenziel oder Förderziel ist dafür keine Voraussetzung. Erst für den späteren Förderprompt werden ein gewähltes Förderziel und genau ein Format benötigt.

## Optionale Diagnose- und Zielhilfe innerhalb von Version 2

Die Speicherversion bleibt 2. Ältere gültige V2-Stände und alte Förderbausteine erhalten fehlende optionale Felder als leere Texte; bestehende Angaben werden nicht ersetzt:

- `hypothesisPrompt` und `hypothesisPromptSource`: bearbeitbarer H2-Diagnoseprompt und sein Ausgangskontext.
- `goalPrompt`, `goalPromptSource` und `goalCandidate`: bearbeitbarer Zielprompt, sein Ausgangskontext und ein noch nicht übernommener Zielvorschlag.
- `noticed`: getrennt festgehaltene Beobachtung an der Lösung. Das bestehende Feld `observation` enthält weiterhin die ursprüngliche Schülerlösung beziehungsweise ältere kombinierte Ausgangslagentexte. Solche Alttexte bleiben unverändert; eine automatische Aufteilung wird nicht versucht.

Bei einer neuen Übernahme aus Handout 1 wird `solution` nach `observation` und die dort getrennte `observation` nach `noticed` übertragen. Das Aufgabenziel (`goal` in Handout 1) wird zu `taskGoal`; das spätere Förderziel in Handout 2 heißt weiterhin `goal`. Ein zunächst fehlendes Aufgabenziel ist zulässig und wird nicht automatisch ergänzt.

Die Diagnosehilfe kann ohne eigene Hypothesen oder Ziele starten. Sie verlangt von der KI höchstens zwei vorläufige Hypothesen sowie einen Prüfschritt, keine Förderübungen. Die fünf Ergebnisabschnitte werden erst nach fachlicher Prüfung von der Lehrkraft selbst in die Maske kopiert. Die spätere Zielhilfe lässt bewusst genau ein Förderziel übernehmen. Beide Hilfen verändern weder eine ursprüngliche Schülerlösung noch Ergebnisfelder oder Fördermaterial automatisch. Alle neuen Textfelder bleiben in Speicherung und JSON-Export/-Import erhalten.

## Format-Erprobungen in Handout 3

`library.drafts[id]` enthält weiterhin `text` und `source`. Hinzu kommen die optionalen Textfelder `result` (KI-Ergebnis oder eigene Ausarbeitung) und `notes` (fachliche Prüfung und Anpassungen). Alte Drafts ohne diese Felder bleiben unverändert gültig. Aktuelle Einträge und importierte Bibliotheksarchive prüfen beide Felder auf Textwerte. Der zusätzliche Kontextmodus `sample` bezeichnet die ausdrücklich fiktive Bruchauswertung; die Speicherversion bleibt 2.

`refillLibraryDraft` erzeugt einen neuen Zustand, ohne den bisherigen zu verändern. Bei gleicher `source` ersetzt es bewusst den Prompt und erhält Ergebnis und Anmerkungen. Bei geänderter `source` und mindestens einem nichtleeren Ergebnis-/Anmerkungsfeld sichert es zuerst den vollständigen alten Draft in `importedLibraries`, einschließlich seines ursprünglichen Prompts und Kontexts. Nur das betroffene Format kommt in dieses Archiv; andere Formate bleiben unverändert. Der neue aktive Draft beginnt mit leeren Ergebnisfeldern. Reine alte Prompts ohne Erprobung behalten das bisherige Ersetzungsverhalten. Rein aus Leerraum bestehende Ergebnisfelder gelten dabei als leer.

Vor dem Archivieren wird die Grenze von 500 Bibliotheksarchiven geprüft. Bei Überschreitung bleiben alle Eingaben erhalten. Für einen Rückimport übernimmt ausschließlich eine wirklich unberührte neutrale Zielbibliothek die eingehende aktive Bibliothek direkt: `mode` ist `blank`, alle bekannten Kontextfelder fehlen oder sind leer, keine Drafts und keine unbekannten Materialfelder sind vorhanden. Andernfalls bleibt die aktuelle Bibliothek aktiv und die eingehende wird zusätzlich archiviert. Bereits vorhandene Archive bleiben in beiden Fällen erhalten; die Grenze richtet sich nach dem tatsächlichen Zuwachs. Damit ist auch ein Export mit 500 Archiven in eine unberührte Bibliothek zurückimportierbar.

## Fehler und Zusammenführung

- Ein beschädigter Altstand wird nicht gelöscht; sein Rohtext wird im neuen Zustand als Rückfallstand erhalten und exportiert.
- Ein beschädigter V2-Stand wird nicht überschrieben. Die Sitzung arbeitet vorläufig ohne dauerhafte Speicherung und exportiert den Originalrohtext zusätzlich. Die Warnung bleibt sichtbar.
- Ein Import wird vollständig geprüft, bevor er den Arbeitsstand verändert. Entwürfe erhalten neue Kennungen; frühere und aktuelle Bearbeitungen werden nicht ersetzt.
- Importierte Bibliotheksbearbeitungen bleiben bei vorhandenen aktuellen Angaben separat aufklappbar, damit gleichnamige Vorlagen nicht überschrieben werden. Nur die oben beschriebene unberührte Zielbibliothek kann die eingehende aktive Bibliothek direkt übernehmen. Auch mehrfach importierte Archive bleiben beim erneuten Export erhalten.
- Bis zu 500 Diagnosefälle und 500 Förderentwürfe je Speicherstand; darüber wird eine weitere Anlage beziehungsweise Zusammenführung abgelehnt. Vorhandene Daten bleiben erhalten.
- Bei Speicherfehlern, fehlenden Rechten oder einer Änderung in einem anderen Tab wird die automatische Speicherung gestoppt und zum Datei-Export aufgefordert.
- Kein pauschales `localStorage.clear()`, keine automatische Löschung und keine Zurücksetzen-Funktion.

## Prompts

Geänderte Fallangaben überschreiben bearbeitete Prompts nicht. Ein Kontextvergleich warnt vor früheren Falltexten. Neuerzeugung fragt nach, sofern ein Prompt vorhanden ist. Vor dem Kopieren wird bei veraltetem Kontext oder verbliebenen Platzhaltern ausdrücklich bestätigt. Der manuelle Kopierdialog ist die Ausweichmöglichkeit, falls die Clipboard-API nicht verfügbar ist.

## Sicherungen sind unterschiedlich

Git-Sicherung: Website-Dateien und veröffentlichte Vorlagen. JSON-Export: persönliche lokale Arbeitsstände. Word/Text/Druck: lesbare Dokumentation, kein vollständiges Rückimportformat. JSON-Dateien mit Teilnehmereingaben nicht ins öffentliche Repository laden.

## Ergänzung 2026-11-05: Auswahlhilfe und Sicherungsgrenzen

Die sechs neuen Auswahlrouten sind statische Inhalte und benötigen keine neue Speicherversion. Das Öffnen eines Formats aus der Auswahlhilfe verändert weder Fall noch gewählten Kontext und ersetzt keine schon bearbeitete Vorlage. Die bestehenden 28 Vorlagen und acht Formatbeispiele bleiben erhalten.

Eine frische Sitzung enthält automatisch einen vorbereiteten Diagnosefall. Beim Import wird nur dieser exakt unveränderte einzelne Startfall ersetzt, sofern tatsächlich neue Diagnosefälle eintreffen. Jede geänderte oder zusätzliche Eigenschaft schützt ihn als eigene Bearbeitung. Dadurch kann eine Sicherung mit 500 Fällen in eine frische Sitzung zurückgelesen werden.

`MAX_BACKUP_BYTES` begrenzt Import und Export auf 10.000.000 Byte. `serializeBackup` prüft die tatsächliche UTF-8-Größe einschließlich JSON-Formatierung und Rückfalltexten. Bei Überschreitung wird keine vermeintlich rückimportierbare Sicherung erzeugt; Eingaben bleiben erhalten. Sehr große Texte dann zunächst separat sichern und den Arbeitsstand bewusst reduzieren. Es gibt weiterhin keine automatische Löschung.
