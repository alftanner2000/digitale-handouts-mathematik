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

Die alte Maske erfasste Aufgabe und Schülerlösung gemeinsam. Dieser Text bleibt vollständig im neuen Ausgangslagenfeld; eine eigene Aufgabe wird nicht automatisch aus dem Fehlertext geraten. Vor neuer Prompterzeugung das separate Aufgabenfeld und ein enges Ziel ergänzen.

## Fehler und Zusammenführung

- Ein beschädigter Altstand wird nicht gelöscht; sein Rohtext wird im neuen Zustand als Rückfallstand erhalten und exportiert.
- Ein beschädigter V2-Stand wird nicht überschrieben. Die Sitzung arbeitet vorläufig ohne dauerhafte Speicherung und exportiert den Originalrohtext zusätzlich. Die Warnung bleibt sichtbar.
- Ein Import wird vollständig geprüft, bevor er den Arbeitsstand verändert. Entwürfe erhalten neue Kennungen; frühere und aktuelle Bearbeitungen werden nicht ersetzt.
- Importierte Bibliotheksbearbeitungen bleiben separat aufklappbar, damit gleichnamige aktuelle Vorlagen nicht überschrieben werden. Auch mehrfach importierte Archive bleiben beim erneuten Export erhalten.
- Bis zu 500 Diagnosefälle und 500 Förderentwürfe je Speicherstand; darüber wird eine weitere Anlage beziehungsweise Zusammenführung abgelehnt. Vorhandene Daten bleiben erhalten.
- Bei Speicherfehlern, fehlenden Rechten oder einer Änderung in einem anderen Tab wird die automatische Speicherung gestoppt und zum Datei-Export aufgefordert.
- Kein pauschales `localStorage.clear()`, keine automatische Löschung und keine Zurücksetzen-Funktion.

## Prompts

Geänderte Fallangaben überschreiben bearbeitete Prompts nicht. Ein Kontextvergleich warnt vor früheren Falltexten. Neuerzeugung fragt nach, sofern ein Prompt vorhanden ist. Vor dem Kopieren wird bei veraltetem Kontext oder verbliebenen Platzhaltern ausdrücklich bestätigt. Der manuelle Kopierdialog ist die Ausweichmöglichkeit, falls die Clipboard-API nicht verfügbar ist.

## Sicherungen sind unterschiedlich

Git-Sicherung: Website-Dateien und veröffentlichte Vorlagen. JSON-Export: persönliche lokale Arbeitsstände. Word/Text/Druck: lesbare Dokumentation, kein vollständiges Rückimportformat. JSON-Dateien mit Teilnehmereingaben nicht ins öffentliche Repository laden.
