# Sicherung und sichere Rückkehr

## Vor dem Umbau überprüft

- Repository: `alftanner2000/digitale-handouts-mathematik`
- Lokaler main, GitHub main und letzter erfolgreicher Pages-Build: `d25d1e184d6f71e3228391b3fc682dd15fed6c20`
- Sicherungsreferenz: `backup/vor-handout-umbau-2026-11-04`
- Annotiertes Tagobjekt auf GitHub: `086a57501e1a84e06611b2a3b78a7846783097b8`
- Aufgelöstes Tagziel mit GitHub API und `git ls-remote` überprüft: exakt der oben genannte Commit.
- URL: https://github.com/alftanner2000/digitale-handouts-mathematik/tree/backup/vor-handout-umbau-2026-11-04

Vor der Sicherung keine uncommitteten Änderungen an versionierten Dateien. Die pauschale Ignore-Regel wurde berücksichtigt. Zwei ignorierte Word-Bearbeitungsskripte zusätzlich lokal gesichert; keine fremden Projekte, Teilnehmerdaten oder temporären Renderdateien öffentlich aufgenommen. Kein geöffneter Code-Editor oder ungespeichertes Word-Handout in der zugänglichen App-Prüfung erkennbar. Nicht zugängliche Editorpuffer können nicht vollständig ausgeschlossen werden.

Zusätzlich existieren lokal eine Dateikopie der neun Projektdateien plus zwei Bearbeitungsskripten und ein geprüftes Git-Bundle. Das private Sicherungsprotokoll im ursprünglichen Projektverzeichnis dokumentiert Pfad, Umfang und SHA-256-Prüfsummen. Browser-Eingaben sind darin nicht enthalten.

## Getrennte Entwicklung

Branch: `codex/handouts-praxisphasen`, eigener Worktree. Das ursprüngliche main-Arbeitsverzeichnis wurde nicht umgebaut. Pages verwendet Legacy-Build aus `main`, Pfad `/`; keine benutzerdefinierten Workflows. Der Backup-Tag löste keinen neuen Produktionsstand aus.

## Alten Stand ansehen

Auf GitHub die obige Tag-Adresse öffnen. Für eine unabhängige lokale Wiederherstellung den Tag in ein **neues, leeres Verzeichnis** klonen, zum Beispiel:

```sh
git clone --branch backup/vor-handout-umbau-2026-11-04 --single-branch https://github.com/alftanner2000/digitale-handouts-mathematik.git handouts-gesicherter-stand
```

Keine bestehenden Dateien überschreiben, keinen Force-Push und kein `reset --hard` verwenden. Die neue Entwicklungsfassung kann parallel erhalten bleiben. Die Veröffentlichung wurde am 2026-11-04 ausdrücklich freigegeben („Neue Handouts veröffentlichen“). Der Sicherungstag bleibt davon unverändert; den technischen Veröffentlichungsstand dokumentiert der Testbericht.
