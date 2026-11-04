# Linkcheck der Tool-Übersicht und Individualisierungs-Vertiefung

Stand: 2026-11-04. Geprüft im Entwicklungsworktree auf Branch `codex/handouts-praxisphasen`. Keine Veröffentlichung, kein Anbieterlogin und keine Eingabe von Zugangsdaten.

## Umfang und Methode

- 45 unterschiedliche öffentliche Zieladressen aus dem bisherigen Bestand von `tools.html` und `individualisierung.html` per echtem HTTP-GET mit `curl` geprüft.
- Weiterleitungen verfolgt, höchstens 5 je Adresse. Verbindungsfrist 10 Sekunden, Gesamtdauer höchstens 25 Sekunden je Abruf. Die Antwortkörper wurden verworfen. Keine Anbieterfunktionen, Accounts oder Tarife getestet.
- Der erste Versuch innerhalb der Netzwerk-Sandbox scheiterte bei allen Adressen an der DNS-Auflösung (curl-Code 6, HTTP 000). Dieser Umgebungsfehler ist kein Linkbefund. Die unten aufgeführten Ergebnisse stammen ausschließlich aus dem anschließend freigegebenen Netzwerkzugriff.
- Sechs vorhandene statische Prompt-Links wurden nicht einschließlich des Prompt-Inhalts abgerufen. Geprüft wurden nur ihre Anbieter-Basisadressen. Die vollständige Übergabefunktion solcher Links ist damit nicht bestätigt. Änderungen in den Textfeldern werden nicht an diese statischen URLs angehängt.
- Zwei vorher externe Links zur veröffentlichten Handout-Seite und Tool-Sammlung wurden zusätzlich geprüft, dann aber in der Vertiefung durch lokale Navigation ersetzt. Lokale Entwicklungsstände sollen nicht unbeabsichtigt auf den alten Produktionsstand zurückspringen.

## Einordnung

- **HTTP 200:** Ziel lieferte eine Antwort. Das bestätigt weder fachliche Qualität noch aktuelle Funktionen, Kosten, Altersbedingungen, Datenschutz oder schulische Freigabe. Es erfolgte kein vollständiger Inhalts- oder Soft-404-Test.
- **HTTP 403:** Der Server verweigerte diesen automatisierten Abruf. Der Link gilt hier ausdrücklich **nicht als tot**. Eine manuelle Prüfung kann erforderlich sein.
- **HTTP 302 mit curl-Code 47:** Weiterleitungsgrenze bei Springer erreicht. DOI beibehalten, vollständige Erreichbarkeit nicht bestätigt.
- Es gab **keinen HTTP-404-/410-Befund**. Deshalb wurde kein Tool aufgrund dieses Checks entfernt.

Ergebnis: 31 × HTTP 200, 12 × HTTP 403, 2 × HTTP 302 nach erreichter Weiterleitungsgrenze.

## Einzelbefunde

| Adresse aus dem Bestand | HTTP | Weiterleitungen | Endziel / Befund |
| --- | ---: | ---: | --- |
| https://chatgpt.com/ | 403 | 0 | Automatisierter Zugriff verweigert; nicht als tot gewertet |
| https://claude.ai/ | 403 | 0 | Automatisierter Zugriff verweigert; nicht als tot gewertet |
| https://www.perplexity.ai/ | 403 | 0 | Automatisierter Zugriff verweigert; nicht als tot gewertet |
| https://theresanaiforthat.com/ | 403 | 0 | Automatisierter Zugriff verweigert; nicht als tot gewertet |
| https://www.magicschool.ai/ | 200 | 0 | Antwort erhalten |
| https://www.eduaide.ai/ | 200 | 0 | Antwort erhalten |
| https://gemini.google.com/ | 200 | 0 | Antwort erhalten |
| https://fobizz.com/de/ | 200 | 0 | Antwort erhalten |
| https://copilot.microsoft.com/ | 200 | 1 | https://copilot.com/ |
| https://to-teach.ai/ | 200 | 0 | Antwort erhalten |
| https://web.diffit.me/ | 200 | 0 | Antwort erhalten |
| https://web.diffit.me/pricing | 200 | 0 | Antwort erhalten |
| https://notebooklm.google.com/ | 200 | 1 | https://notebook.google.com/ |
| https://schulki.de/documentation/abonnements-und-einzelkaufpaket | 200 | 0 | Antwort erhalten |
| https://schulki.de/ | 200 | 0 | Antwort erhalten |
| https://www.geogebra.org/ | 200 | 0 | Antwort erhalten |
| https://de.bettermarks.com/ | 200 | 0 | Antwort erhalten |
| https://www.desmos.com/ | 200 | 0 | Antwort erhalten |
| https://support.deepl.com/hc/en-us/articles/6318834492700-About-DeepL-Write | 403 | 0 | Automatisierter Zugriff verweigert; nicht als tot gewertet |
| https://photomath.com/ | 200 | 0 | Antwort erhalten |
| https://www.deepl.com/write | 200 | 1 | https://www.deepl.com/en/write |
| https://www.fellofish.com/pricing | 200 | 0 | Antwort erhalten |
| https://www.fellofish.com/ | 200 | 0 | Antwort erhalten |
| https://www.canva.com/education/ | 403 | 0 | Automatisierter Zugriff verweigert; nicht als tot gewertet |
| https://gamma.app/pricing | 403 | 0 | Automatisierter Zugriff verweigert; nicht als tot gewertet |
| https://gamma.app/ | 403 | 0 | Automatisierter Zugriff verweigert; nicht als tot gewertet |
| https://help.wayground.com/support/solutions/articles/158000404038-wayground-starter-basic-plan | 200 | 0 | Antwort erhalten |
| https://alftanner2000.github.io/Selbsteinsch-tzungsbogen/ | 200 | 0 | Antwort erhalten |
| https://alftanner2000.github.io/Beispiel_Selbsteinsch-tzungsbogen/ | 200 | 0 | Antwort erhalten |
| https://chat.openai.com/ | 403 | 1 | Automatisierter Zugriff verweigert; nicht als tot gewertet: https://chatgpt.com/ |
| https://wayground.com/ | 200 | 0 | Antwort erhalten |
| https://www.wolframalpha.com/ | 200 | 0 | Antwort erhalten |
| https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition | 403 | 0 | Automatisierter Zugriff verweigert; nicht als tot gewertet |
| https://alftanner2000.github.io/Lernprompt/ | 200 | 0 | Antwort erhalten |
| https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/feedback/ | 403 | 0 | Automatisierter Zugriff verweigert; nicht als tot gewertet |
| https://doi.org/10.1007/s11092-008-9068-5 | 302 | 5 | Weiterleitungsgrenze erreicht: https://idp.springer.com/transit (Abfrageparameter nicht protokolliert) |
| https://doi.org/10.1007/s10648-010-9127-6 | 302 | 5 | Weiterleitungsgrenze erreicht: https://idp.springer.com/transit (Abfrageparameter nicht protokolliert) |
| https://doi.org/10.1177/1529100612453266 | 403 | 1 | Automatisierter Zugriff verweigert; nicht als tot gewertet: https://journals.sagepub.com/doi/10.1177/1529100612453266 |
| https://alftanner2000.github.io/Aufgabenpool/ | 200 | 0 | Antwort erhalten |
| https://arxiv.org/abs/2505.23405 | 200 | 0 | Antwort erhalten |
| https://exorciser.ch/p/ki/lernpartner_gym | 200 | 0 | Antwort erhalten |
| https://doi.org/10.3389/fpsyg.2019.03087 | 200 | 3 | https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2019.03087/full |
| https://alftanner2000.github.io/digitale-handouts-mathematik/Digitale%20Handouts%20Mathematik.html | 200 | 0 | Antwort erhalten |
| https://doi.org/10.3389/fpsyg.2017.00422 | 200 | 4 | https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2017.00422/full |
| https://alftanner2000.github.io/digitale-handouts-mathematik/tools.html | 200 | 0 | Antwort erhalten |

## Inhaltliche und lokale Anpassungen

- Alle 23 Tool-Einträge erhalten. Gliederung und Filter nach Unterrichtszweck, dazu je eine konkrete Lehrkraft-Prüffrage.
- Kostenlabels und sieben ausführlichere Zugangsnotizen aus September 2026 sind ausdrücklich historisch und aktuell zu prüfen. Anbieterlinks bleiben als Ausgangspunkt erhalten. Ein HTTP-200-Ergebnis wurde nicht als aktuelle Tarifprüfung ausgegeben. Keine neuen Datenschutz-, Alters- oder Freigabeversprechen ergänzt.
- Navigation: Handout 1 = `index.html#hypothesen`, Handout 2 = `index.html#foerderbaustein`, Handout 3 = `index.html#bibliothek`.
- `individualisierung.html` bleibt eine optionale Vertiefung zu Handout 3. Die bestehenden 41 Karten, 14 aufklappbaren Mathematik-Originalprompts und 8 Forschungsquellen bleiben erhalten.
- Keine neuen API-Aufrufe oder automatische Übermittlung an KI-Anbieter. Vorhandene statische Prompt-Links sind als solche kenntlich gemacht. Die manuelle Kopierfunktion verwendet weiterhin den aktuell bearbeiteten Text.

## Lokale Struktur- und Funktionsprüfungen

- JavaScript beider Seiten syntaktisch geprüft. Alle 23 Tool-Namen stimmen mit dem Ausgangsstand überein; jede Karte enthält eine Lehrkraft-Prüffrage und ein historisch gekennzeichnetes Kostenlabel.
- Filterlogik in einer isolierten DOM-Simulation ausgeführt: insgesamt 23 Einträge, Zweckgruppen mit 7 / 6 / 5 / 3 / 2 Einträgen. Kombination mit der Suche, leeres Ergebnis und jeweils genau ein aktives `aria-pressed` erfolgreich geprüft.
- Beide Seiten enthalten die drei semantischen Handout-Einstiege. Keine alten `station1`-/`station2`-/`station3`-Links in diesen beiden Dateien.
- `git diff --check` für die bearbeiteten Dateien ohne Befund. Keine Browser-, Druck- oder mobile Sichtprüfung durch diese Teilaufgabe.

## Grenzen der Prüfung

Die externen Anbieteroberflächen wurden nicht durchgeklickt, schulische Zulässigkeit und Nutzerverträge nicht geprüft. Browserprüfung der lokalen Seiten erfolgt separat im Gesamtprojekt; dieser Bericht dokumentiert HTTP-Erreichbarkeit und die genannten strukturellen Kontrollen, nicht einen erfolgreichen Unterrichtseinsatz. Die DOI-/Forschungsangaben wurden bewahrt, aber in diesem Auftrag nicht neu wissenschaftlich bewertet.
