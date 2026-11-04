/* Vollständige, lokal bearbeitbare Vorlagen. Keine Übermittlung an KI-Anbieter. */
(function () {
  "use strict";

  const context = `Klasse / Lerngruppe: {{klasse}}
Aufgabe oder mathematischer Gegenstand: {{aufgabe}}
Konkretes Aufgabenziel / Lernziel: {{ziel}}
Ausgangslage (beobachtete Lösung oder Äußerung, offene Vermutungen und ausdrücklich gesetzte Arbeitsannahmen): {{ausgangslage}}`;

  const safeguards = `Arbeite nur am ausgewählten Format und am genannten Lernziel. Verwende ausschließlich fiktive oder vollständig anonymisierte Angaben. Trenne tatsächliche Beobachtungen, vorläufige Deutungen und Arbeitsannahmen. Erfinde keine Äußerungen oder Bearbeitungen des Kindes. Benenne fehlende Angaben. Wenn du eine ungesicherte Ausgangslage für die Materialplanung annimmst, schreibe ausdrücklich: „Unter der Annahme, dass …“. Eine einzelne Lösung belegt weder eine gesicherte Diagnose noch eine dauerhafte Eigenschaft des Kindes. Ein Materialentwurf belegt keine Lernwirkung. Prüfe Rechnungen, Einheiten, Darstellungen und Lösungen auf Konsistenz. Kennzeichne, was die Lehrkraft vor dem Einsatz noch fachlich oder hinsichtlich der Passung prüfen muss.`;

  const prompt = (instruction) => `${context}\n\n${instruction}\n\n${safeguards}`;
  const fractionCase = "Fiktiver Ausgangsfall, Klasse 6: Zu ½ + ⅓ wurde ⅖ notiert. Der Denkweg ist unbekannt.";
  window.HANDOUT_TRIAL_EXAMPLE = {
    grade: "6",
    task: "1/2 + 1/3 = ?",
    goal: "Das Kind stellt zwei ungleichnamige Brüche am selben Bezugs-Ganzen als gleich große Teile dar, berechnet ihre Summe und erklärt an einer eigenen Skizze oder in Worten, warum das Erweitern die Anteile nicht verändert.",
    baseline: "Fiktive notierte Lösung: 1/2 + 1/3 = 2/5. Offene Vermutung: Möglicherweise werden Zähler und Nenner getrennt addiert; der Denkweg ist unbekannt. Ausdrücklich gewählte Arbeitsannahme für Förderbeispiele: Die gemeinsame Teilgröße soll geklärt werden. Keine weitere Kinderantwort bekannt."
  };

  window.HANDOUT_FORMATS = [
    {
      id: "handlung-bild-symbol",
      example: {
        context: `${fractionCase} Förderbeispiel unter der Arbeitsannahme, dass die gemeinsame Teilgröße noch geklärt werden muss.`,
        task: "Nimm drei gleich lange Papierstreifen; jeder steht für dasselbe Ganze. Markiere auf dem ersten ½, auf dem zweiten ⅓. Unterteile beide in je sechs gleich große Teile. Übertrage die markierten Längen hintereinander auf den dritten Streifen. Beschrifte deine Darstellung und erkläre: Was verändert sich beim Unterteilen, was bleibt gleich?",
        solution: "Die Hälfte umfasst 3 von 6 Teilen, das Drittel 2 von 6. Zusammen sind 5 von 6 gleich großen Teilen markiert: ½ + ⅓ = 3/6 + 2/6 = 5/6. Die Unterteilung verändert weder die markierte Länge noch das Bezugs-Ganze.",
        criterion: "Das Kind verbindet 3/6 und 2/6 mit den markierten Längen, erklärt die gleiche Teilgröße und begründet, warum der Anteil beim Unterteilen gleich bleibt.",
        limit: "Die Darstellung ist eine Erklärhilfe nach einem eigenen Versuch, kein unbeeinflusster Diagnosenachweis. Die Arbeitsannahme bleibt zu prüfen."
      },
      category: "A",
      title: "Handlung – Bild – Symbol",
      purpose: "Eine mathematische Beziehung in unterschiedlichen Darstellungen erkennen und die Verbindungen erklären.",
      when: "Wenn ein Verfahren gelingt oder geübt wird, seine Bedeutung aber noch erklärt oder überprüft werden soll.",
      output: "Ein zusammenhängendes Beispiel mit Handlung, Bildbeschreibung, Rechnung und zwei Verbindungsfragen; getrennte Hinweise für die Lehrkraft.",
      check: "Bleiben dieselbe Menge, dasselbe Ganze und dieselbe Beziehung beim Darstellungswechsel erhalten?",
      prompt: prompt(`Entwirf zu genau einer passenden Beispielaufgabe eine handelnde, eine bildliche und eine symbolische Darstellung. Beschreibe die konkrete Handlung mit leicht verfügbarem Material so genau, dass sie ausgeführt werden kann. Beschreibe das Bild einschließlich Einheiten, gleicher Teilgrößen oder Skalierung. Notiere die dazugehörige Rechnung.
Erkläre ausdrücklich, welches Element der Handlung zu welchem Bildelement und welchem Bestandteil des Terms gehört. Gib zwei offene Fragen, mit denen das Kind diese Verbindungen selbst erläutert. Ein Wechsel zurück vom Term zur Handlung oder zum Bild soll möglich sein. Stelle E-I-S nicht als starre Reihenfolge dar.
Gib eine kleine neue Aufgabe zum selbstständigen Übertragen und eine gestufte Hilfe an. Trenne die Materialien für das Kind von Lösung und Beobachtungshinweisen für die Lehrkraft. Eine genaue Bildbeschreibung genügt, wenn du kein mathematisch korrektes Bild erstellen kannst.`)
    },
    {
      id: "darstellungen-zuordnen",
      example: {
        context: `${fractionCase} Förderbeispiel unter der Arbeitsannahme, dass Term und Bruchdarstellung verbunden werden sollen.`,
        task: "Erstelle fünf Karten: A ½ + ⅓; B 3/6 + 2/6; C ein Streifen mit sechs gleich großen Feldern, davon fünf markiert; D 5/6; E ein gleich langer Streifen mit fünf gleich großen Feldern, davon zwei markiert. Auftrag: Welche Karten zeigen denselben Wert? Begründe an den Teilgrößen, warum eine Karte nicht passt. Alle Streifen stehen für dasselbe Ganze.",
        solution: "A, B, C und D zeigen 5/6. Karte E zeigt 2/5 und gehört nicht dazu. Bei B und C werden Sechstel gezählt; das markierte Stück auf E besteht aus zwei Fünfteln. 2/5 ist kleiner als ½ und kann daher nicht die Summe ½ + ⅓ sein.",
        criterion: "Das Kind begründet mindestens eine Zuordnung zwischen Term und Streifen und die Ablehnung von E über Teilgröße und Anteil, nicht nur über ähnliche Ziffern.",
        limit: "Die Karten liefern bereits mögliche Ergebnisse. Richtiges Zuordnen allein belegt weder selbstständiges Addieren noch eine gesicherte Diagnose."
      },
      category: "A",
      title: "Darstellungen zuordnen",
      purpose: "Gleichwertige Darstellungen unterscheiden und Zuordnungen mathematisch begründen.",
      when: "Wenn Beziehungen zwischen Material, Bild, Sprache und Term sichtbar werden sollen.",
      output: "Vier bis sechs Karten, ein begründeter Zuordnungsauftrag und eine getrennte Lösung mit Erklärung der unpassenden Karten.",
      check: "Sind Bezugs-Ganzes, Einheit und Skalierung angegeben, sodass eine Zuordnung eindeutig begründbar ist?",
      prompt: prompt(`Erstelle vier bis sechs Zuordnungskarten zu einer mathematischen Beziehung aus der Aufgabe. Verbinde mindestens zwei Darstellungsarten, etwa Term, Bildbeschreibung, Materialhandlung oder kurze Sachsituation. Mindestens zwei Karten passen zusammen. Ergänze ein bis zwei gezielt nicht passende Karten, deren Unterschied mathematisch bedeutsam ist.
Beschrifte alle Karten eindeutig. Gib bei Brüchen das Bezugs-Ganze und gleich große Teile, bei Größen die Einheiten und bei Zahlenstrahlen die Skalierung an. Vermeide eine Lösung allein über Farben, gleiche Wörter oder die Anordnung.
Der Auftrag lautet sinngemäß: „Welche Karten passen zusammen? Begründe eine Zuordnung und erkläre, warum eine andere Karte nicht passt.“ Ergänze einen Hinweis für den Einstieg. Liefere separat die zulässigen Zuordnungen mit Begründung und eine Beobachtungsfrage zum genannten Lernziel. Wenn mehrere Zuordnungen fachlich möglich sind, benenne sie.`)
    },
    {
      id: "beispiele-gegenbeispiele",
      category: "A",
      title: "Beispiele und Gegenbeispiele",
      purpose: "Ein Begriffsmerkmal erkennen und von oberflächlichen Eigenschaften unterscheiden.",
      when: "Wenn Kinder einen Begriff oder eine mathematische Bedingung begründet erkennen sollen.",
      output: "Ein Sortierauftrag mit vier Beispielen, darunter passende und nicht passende Fälle; Begründungen und eine Vertiefungsfrage.",
      check: "Unterscheiden sich die Fälle am entscheidenden Merkmal und nicht bloß an Aussehen oder Wortwahl?",
      prompt: prompt(`Wähle einen eng umrissenen Begriff oder eine Bedingung, die zum Lernziel gehört. Benenne das entscheidende Merkmal in einfacher, fachlich korrekter Sprache. Erstelle zwei passende Beispiele und zwei gezielte Gegenbeispiele. Mindestens ein Gegenbeispiel soll ähnlich aussehen, aber das entscheidende Merkmal verletzen.
Formuliere einen Sortierauftrag: „Was gehört dazu? Was gehört nicht dazu? Begründe mit dem Merkmal.“ Lass das Kind anschließend ein eigenes Beispiel oder Gegenbeispiel verändern oder erfinden. Gib bei Bedarf eine gestufte Hilfe, die auf das Merkmal lenkt, ohne die Zuordnung vorwegzunehmen.
Stelle die Begründungen getrennt für die Lehrkraft bereit. Erläutere, welche Eigenschaften zufällig sind und welche für die Zuordnung notwendig sind. Mache den betrachteten Zahlenbereich oder andere Voraussetzungen ausdrücklich. Eine einzelne falsche Zuordnung darf nicht als gesicherte Begriffsdiagnose behandelt werden.`)
    },
    {
      id: "rechenwege-vergleichen",
      category: "A",
      title: "Rechenwege vergleichen",
      purpose: "Rechengesetze und Aufgabenbeziehungen durch den Vergleich zweier korrekter Wege verstehen.",
      when: "Wenn ein Kind mehrere Wege kennenlernen oder einen passenden Weg begründet auswählen soll.",
      output: "Zwei korrekte Wege zur selben Aufgabe, Vergleichsfragen und eine neue Aufgabe zur begründeten Wegwahl.",
      check: "Sind beide Wege korrekt und werden Voraussetzungen sowie Zweckmäßigkeit statt nur der Länge verglichen?",
      prompt: prompt(`Zeige zur Ausgangsaufgabe zwei unterschiedliche fachlich richtige Rechenwege, die zum Lernziel und zur Klasse passen. Stelle die Schritte so dar, dass dieselben Ausgangswerte und Teilrechnungen verglichen werden können. Erkläre knapp die genutzten Rechengesetze oder Beziehungen.
Formuliere drei Fragen: Was bleibt in beiden Wegen gleich? Worin unterscheiden sich die Zwischenschritte? Bei welchen Zahlen oder Voraussetzungen ist welcher Weg besonders übersichtlich? Vermeide pauschale Urteile wie „Der kürzeste Weg ist immer der beste“.
Gib eine neue passende Aufgabe, bei der das Kind einen Weg auswählt und die Wahl begründet, sowie einen orientierenden Hinweis. Liefere die Lösungen getrennt. Benenne in den Lehrkrafthinweisen, woran eine begründete Wegwahl und ein bloßes Nachahmen unterscheidbar sein könnten, ohne daraus allein eine gesicherte Diagnose abzuleiten.`)
    },
    {
      id: "teilweise-ausgearbeitete-loesungen",
      category: "A",
      title: "Teilweise ausgearbeitete Lösungen",
      purpose: "Bedeutsame Lösungsschritte ergänzen, begründen und zunehmend selbstständig ausführen.",
      when: "Wenn eine vollständige Musterlösung zunächst unterstützt, danach aber mehr Eigenleistung nötig ist.",
      output: "Drei verwandte Aufgaben mit abnehmender Unterstützung, Begründungsaufträgen und vollständigen Lehrkraftlösungen.",
      check: "Betreffen die Lücken mathematische Entscheidungen statt bloßes Abschreiben, und nimmt die Unterstützung nachvollziehbar ab?",
      prompt: prompt(`Entwirf drei verwandte Aufgaben zum Lernziel mit schrittweise abnehmender Unterstützung. In Aufgabe 1 ist ein wichtiger Schritt ausgearbeitet, ein weiterer muss ergänzt und begründet werden. In Aufgabe 2 fehlen mehr zusammenhängende Schritte. Aufgabe 3 wird ohne vorgegebenen Lösungsweg bearbeitet.
Wähle Lücken an fachlich bedeutsamen Stellen, beispielsweise beim Zerlegen, Entbündeln, Herstellen einer gemeinsamen Einheit oder Begründen einer Umformung. Verlange an mindestens einer Stelle ausdrücklich eine Erklärung. Bloß fehlende Ergebnisziffern reichen nicht aus.
Gib für jede Aufgabe einen optionalen Hinweis, ohne die Lücke sofort zu füllen. Halte den mathematischen Kern und den Zahlenraum möglichst vergleichbar. Liefere separat vollständige Lösungen und erläutere, welche Unterstützung reduziert wurde. Benenne Anzeichen, bei denen die Lehrkraft einen Zwischenschritt wieder stärker stützen sollte.`)
    },
    {
      id: "gestufte-hilfekarten",
      example: {
        context: `${fractionCase} Unter der Arbeitsannahme eines Klärungsbedarfs zur gemeinsamen Einheit werden Hilfen erst nach dem eigenen Versuch angeboten.`,
        task: "Aufgabe: Berechne ½ + ⅓ und erkläre deine Rechnung. Hilfe 1: Was bedeuten die beiden Brüche, wenn sie sich auf dasselbe Ganze beziehen? Hilfe 2: Zeichne zwei gleich lange Streifen mit je sechs gleich großen Teilen. Markiere jeweils den geforderten Anteil. Hilfe 3: ½ = 3/6. Wie viele Sechstel sind ⅓? Wie viele Sechstel sind es zusammen? Nur die nächste benötigte Hilfe aufdecken.",
        solution: "⅓ = 2/6; daher ½ + ⅓ = 3/6 + 2/6 = 5/6. Der Nenner 6 benennt die gemeinsame Teilgröße, die Zähler zählen diese Teile.",
        criterion: "Festhalten, welche Hilfe verwendet wurde und welchen Schritt das Kind anschließend selbst erklärt. Das Kind muss Anteil, gemeinsame Einheit und Summe verbinden.",
        limit: "Eine Lösung nach Hilfe 3 ist keine selbstständige Ausgangsleistung. Danach eine neue Aufgabe ohne dieselbe Hilfe prüfen; nicht aus dem Hilfebedarf etikettieren."
      },
      category: "B",
      title: "Gestufte Hilfekarten",
      purpose: "Hilfe dosieren, damit der nächste Denkschritt möglichst selbstständig bleibt.",
      when: "Wenn zu einer konkreten Aufgabe passende Unterstützung bereitliegen soll, ohne sofort die Lösung zu zeigen.",
      output: "Drei einzeln nutzbare Hilfekarten und eine getrennte Lösung mit Einsatzhinweisen.",
      check: "Gibt jede Karte nur die nächste benötigte Unterstützung, statt die vollständige Lösung vorwegzunehmen?",
      prompt: prompt(`Erstelle zu der Aufgabe drei aufeinander abgestimmte Hilfekarten. Karte 1 stellt eine offene Orientierungsfrage zur Bedeutung oder zur bekannten Information. Karte 2 bietet einen passenden Darstellungs- oder Strukturhinweis. Karte 3 gibt einen konkreteren Teilimpuls, lässt aber einen wesentlichen Schritt beim Kind.
Beschrifte jede Karte einzeln. Die Karten sollen nacheinander bei Bedarf genutzt werden können. Zeige auf den Karten weder sofort das Endergebnis noch den vollständigen Rechenweg. Falls eine weitere Hilfe nötig wird, schlage eine Rückfrage der Lehrkraft vor, statt weitere Lösungen anzuhängen.
Ergänze getrennt die vollständige Lösung und Hinweise: Woran könnte die Lehrkraft erkennen, dass eine Karte genügt? Welche Äußerung würde eine andere Hilfe nahelegen? Kennzeichne alle erwarteten Kinderreaktionen als hypothetisch. Wenn der Denkweg unbekannt ist, biete keine scheinbar passgenaue Diagnose an.`)
    },
    {
      id: "differenzierung-gemeinsames-lernziel",
      example: {
        context: `${fractionCase} Gemeinsames Förderziel unter einer Arbeitsannahme: die Summe mithilfe gleich großer Teile darstellen und begründen.`,
        task: "Alle bearbeiten ½ + ⅓ und erklären, warum eine gemeinsame Teilgröße benötigt wird. Variante A: drei gleich lange, bereits in Sechstel geteilte Streifen; Anteile markieren und zusammenführen. Variante B: drei gleich lange leere Streifen; eine passende gemeinsame Unterteilung selbst einzeichnen. Variante C: ohne vorgegebene Streifen eine eigene Darstellung entwickeln und mit der Rechnung verbinden. Unterstützung nach tatsächlichem Bedarf wählen.",
        solution: "In allen Varianten gilt ½ + ⅓ = 3/6 + 2/6 = 5/6. Entscheidend ist dieselbe Erklärung: Die Anteile beziehen sich auf dasselbe Ganze; erst gleich große Teilstücke werden zusammengezählt. Die Unterstützung ändert sich, nicht das Ziel.",
        criterion: "Für alle Varianten dieselben Kriterien: gleiche Bezugsgröße, gleich große Teile, richtige Summe und passende Begründung. Verwendete Hilfe getrennt dokumentieren.",
        limit: "A, B und C sind Unterstützungsangebote, keine festen Leistungsgruppen. Erfolg mit vorgegebener Unterteilung zeigt noch nicht, dass das Kind sie selbst wählen kann."
      },
      category: "B",
      title: "Differenzierung am gemeinsamen Lernziel",
      purpose: "Dasselbe mathematische Ziel über unterschiedliche Hilfen und Darstellungen zugänglich machen.",
      when: "Wenn Lernende bei gemeinsamem Ziel unterschiedliche Unterstützung benötigen.",
      output: "Drei Varianten einer Kernaufgabe, eine gemeinsame Kontrollaufgabe und eine Übersicht der veränderten Unterstützung.",
      check: "Bleibt das Lernziel in allen Varianten gleich, oder verändert sich unbemerkt die mathematische Anforderung?",
      prompt: prompt(`Entwirf drei Varianten einer Kernaufgabe zum selben konkreten Lernziel. Variante A bietet anschauliche oder sprachliche Unterstützung. Variante B enthält nur einen gezielten Hinweis. Variante C verlangt eine weiterführende Begründung oder eine bewusst gewählte Variation. Vermeide feste Etiketten für vermeintlich starke oder schwache Kinder.
Variiere sinnvoll Darstellung, Hilfen, sprachliche Belastung oder die Zahl der Zwischenschritte. Beschränke die Differenzierung nicht auf kleinere und größere Zahlen. Beschreibe für jede Variante, was gleich bleibt und was sich ändert. Wenn eine Variante tatsächlich ein anderes Ziel verfolgt, kennzeichne das ausdrücklich und passe sie möglichst an das gemeinsame Ziel an.
Gib eine kurze gemeinsame Kontrollaufgabe ohne KI, getrennte Lösungen und Beobachtungskriterien an. Empfiehl Varianten nur bedingt auf Grundlage der angegebenen Beobachtungen. Erfinde keine Einteilung der Lerngruppe.`)
    },
    {
      id: "strukturierte-rechenpaeckchen",
      example: {
        context: `${fractionCase} Nach der Klärung wird unter der Arbeitsannahme weitergeübt, dass Aufgabenbeziehungen das Verständnis gleicher Teile festigen können.`,
        task: "Bearbeite ½ + 1/6, ½ + 2/6, ½ + 3/6 und ½ + 4/6. Nutze bei Bedarf gleich lange, in Sechstel unterteilte Streifen. Erkläre, was von Zeile zu Zeile gleich bleibt und warum die Summe jeweils um 1/6 wächst. Ergänze eine weitere Aufgabe nach dieser ausdrücklich vereinbarten Veränderung. Welche Zeile entspricht ½ + ⅓?",
        solution: "Die Summen sind 4/6 = 2/3, 5/6, 6/6 = 1 und 7/6 = 1⅙. Die Fortsetzung lautet ½ + 5/6 = 8/6 = 4/3. Der erste Summand bleibt 3/6, der zweite wächst um 1/6. Die zweite Zeile entspricht der Ausgangsaufgabe, weil ⅓ = 2/6.",
        criterion: "Das Kind erklärt die Ergebnisänderung über den unveränderten ersten Summanden und den Zuwachs eines Sechstels; es verbindet die zweite Zeile mit der Ausgangsaufgabe.",
        limit: "Bloßes Fortsetzen oder Ablesen genügt nicht als Verständnisbeleg. Bei Ergebnissen über 1 braucht die Darstellung ein zweites gleich großes Bezugs-Ganzes."
      },
      category: "B",
      title: "Strukturierte Rechenpäckchen",
      purpose: "Aufgabenbeziehungen entdecken und zum Rechnen oder Begründen nutzen.",
      when: "Wenn eine Aufgabenserie eine bestimmte Beziehung sichtbar machen soll statt nur Rechenmenge zu erhöhen.",
      output: "Ein Päckchen mit vier bis fünf Aufgaben, Entdeckungsauftrag, Fortsetzungsaufgabe und getrennten Lösungen.",
      check: "Verändert sich gezielt ein Merkmal, und lässt sich die daraus folgende Beziehung mathematisch erklären?",
      prompt: prompt(`Erstelle ein strukturiertes Rechenpäckchen mit vier bis fünf Aufgaben zum Lernziel. Verändere gezielt genau ein relevantes Merkmal und halte die übrigen Merkmale zunächst konstant. Benenne für die Lehrkraft, welche Beziehung dadurch sichtbar werden soll.
Lass das Kind zunächst rechnen oder darstellen, anschließend die Veränderung beschreiben und eine weitere passende Aufgabe selbst ergänzen. Formuliere eine Begründungsfrage wie „Warum verändert sich das Ergebnis auf diese Weise?“ statt nur „Wie geht die Reihe weiter?“ Gib eine gestufte Hilfe, die zum Vergleich zweier Aufgaben anregt.
Liefere ein getrenntes Lösungsblatt mit der Beziehung und ihrer Begründung. Prüfe, ob die Serie das beabsichtigte Muster durchgehend trägt. Falls es mehrere sinnvolle Fortsetzungen gibt, benenne sie. Eine passende Fortsetzung allein ist noch kein Beleg dafür, dass die Beziehung verstanden wurde.`)
    },
    {
      id: "umkehr-ergaenzungsaufgaben",
      category: "B",
      title: "Umkehr- und Ergänzungsaufgaben",
      purpose: "Zusammenhänge zwischen Operationen und unbekannten Größen nutzen.",
      when: "Wenn eine Operation nicht isoliert, sondern in Beziehung zu ihrer Umkehrung verstanden werden soll.",
      output: "Drei bis fünf zusammengehörige Aufgaben mit Erklärung der Beziehungen und einer neuen Kontrollaufgabe.",
      check: "Wird die Umkehrbeziehung sinnvoll genutzt, und bleiben Reihenfolge, Einheiten und Bedingungen korrekt?",
      prompt: prompt(`Entwirf drei bis fünf zusammengehörige Umkehr- und Ergänzungsaufgaben zum Lernziel. Nutze eine passende Aufgabenfamilie, eine fehlende Größe oder eine kurze Situation. Zeige nicht nur dieselbe Rechnung in anderer Reihenfolge, sondern mache die Beziehung der Operationen sichtbar.
Formuliere eine Frage, die das Kind zum Begründen der Beziehung auffordert, und eine Darstellungshilfe. Beachte bei Subtraktion und Division die Reihenfolge sowie die Bedingungen der Umkehroperation. Erkläre bei Division, welche Größen und Einheiten jeweils gemeint sind.
Ergänze eine neue Aufgabe zur selbstständigen Kontrolle und getrennte Lösungen. Benenne für die Lehrkraft, welche Antwort auf ein Nutzen der Beziehung hindeuten könnte und welche Rückfrage bei einer bloß auswendig reproduzierten Aufgabenfamilie hilfreich wäre.`)
    },
    {
      id: "offene-aufgaben-vertiefung",
      category: "B",
      title: "Offene Aufgaben mit Vertiefung",
      purpose: "Einen gemeinsamen Einstieg mit unterschiedlichen Lösungswegen und weiterführenden Begründungen verbinden.",
      when: "Wenn Lernende am selben Gegenstand arbeiten und unterschiedliche mathematische Tiefe erreichen sollen.",
      output: "Eine offene Kernaufgabe, zwei Vertiefungsfragen, Einstiegshilfe und beispielhafter Erwartungshorizont.",
      check: "Ist der Einstieg erreichbar, während die Vertiefung den mathematischen Kern erweitert statt nur mehr Rechnungen verlangt?",
      prompt: prompt(`Entwirf eine offene Aufgabe mit einem zugänglichen gemeinsamen Einstieg zum Lernziel. Mehrere passende Lösungen oder Wege sollen möglich sein. Lege die Bedingungen klar fest, damit Offenheit nicht durch unklare Formulierungen entsteht.
Ergänze zwei Vertiefungen: eine Frage nach weiteren Möglichkeiten oder systematischem Vorgehen und eine Frage nach Begründung oder Verallgemeinerung. Gib eine Einstiegshilfe, die die Lösungsvielfalt erhält. Verlange nicht nur eine größere Anzahl gleichartiger Rechnungen.
Liefere getrennt mehrere mögliche Lösungen und einen Erwartungshorizont: Was genügt für das gemeinsame Ziel? Woran wäre eine weiterführende Begründung erkennbar? Falls sich eine vollständige Aufzählung nicht leisten lässt, kennzeichne die Beispiele ausdrücklich als Auswahl. Verknüpfe unterschiedliche Bearbeitungen nicht mit festen Fähigkeitszuschreibungen.`)
    },
    {
      id: "sprachsensibles-aufgabenpaar",
      category: "B",
      title: "Sprachsensibles Aufgabenpaar",
      purpose: "Sprachliche Hürden gezielt verändern und den mathematischen Anspruch erhalten.",
      when: "Wenn unbekannte Wörter oder komplexe Satzstrukturen die Bearbeitung erschweren könnten.",
      output: "Originalnahe und sprachlich entlastete Fassung, transparente Änderungsliste und gemeinsame Lösung.",
      check: "Bleiben Informationen, Operationen und Begründungsanforderungen erhalten, ohne die Lösung sprachlich zu verraten?",
      prompt: prompt(`Erstelle zur angegebenen Aufgabe ein sprachsensibles Aufgabenpaar. Zeige zunächst die Ausgangsfassung und danach eine sprachlich entlastete Fassung. Falls noch kein vollständiger Aufgabentext vorliegt, kennzeichne die Ausgangsfassung als neu entworfenes Beispiel.
Reduziere unnötig komplexe Satzstrukturen und erkläre unverzichtbare Wörter knapp. Erhalte mathematisch relevante Bedingungen, Größen, Beziehungen und die Anforderung an eine Begründung. Verwandle eine offene Entscheidung nicht unbemerkt in einen vorgegebenen Rechenweg. Nutze keine bloßen Schlüsselwortregeln wie „mehr bedeutet immer plus“.
Liste die sprachlichen Änderungen auf und prüfe ausdrücklich, ob sich die mathematische Anforderung verändert hat. Ergänze bei Bedarf einen neutralen Satzanfang oder eine Begriffshilfe. Gib die gemeinsame Lösung und eine Frage an, mit der die Lehrkraft zwischen sprachlichem Missverständnis und mathematischer Unsicherheit weiter unterscheiden könnte.`)
    },
    {
      id: "verteilte-wiederaufnahme",
      category: "B",
      title: "Verteilte Wiederaufnahme",
      purpose: "Eine mathematische Idee zu mehreren Zeitpunkten kurz aufgreifen und erneut erklären lassen.",
      when: "Wenn ein bereits behandeltes Ziel über mehrere Unterrichtstage wiederkehren soll.",
      output: "Vier kurze Wiederaufnahmen mit Aufgaben, Selbstkontrolle und Hinweisen zur Anpassung.",
      check: "Wird die gleiche Idee zeitversetzt geprüft, ohne Verständnis durch bloßes Wiedererkennen identischer Aufgaben zu ersetzen?",
      prompt: prompt(`Entwirf einen kurzen Wiederholungsplan mit vier zeitversetzten Wiederaufnahmen für das genannte Lernziel. Schlage Abstände in Unterrichtstagen vor und kennzeichne sie als anpassbaren Plan, nicht als wissenschaftlich optimale Zeitfolge.
Jede Wiederaufnahme enthält eine kurze Aufgabe, eine knappe Begründungs- oder Darstellungsfrage und eine separat einsehbare Selbstkontrolle. Variiere Zahlen oder Darstellung behutsam, sodass die mathematische Idee erkennbar dieselbe bleibt. Mindestens eine Aufgabe soll eine kleine Übertragung verlangen.
Schlage vor, wie die Lehrkraft nach tatsächlich beobachteten Schwierigkeiten Unterstützung ergänzen kann. Leite aus einem einzelnen richtigen Ergebnis keine sichere Beherrschung ab. Gib alle Lösungen getrennt an und mache keine unbelegten Versprechen über Lernzuwachs oder dauerhafte Speicherung.`)
    },
    {
      id: "fehlerdetektiv",
      example: {
        context: `${fractionCase} Die notierte Fehlantwort wird als ausdrücklich fiktiver Lösungsweg untersucht, nicht als festgestellter Denkweg eines Kindes.`,
        task: "Prüfe diesen fiktiven Weg: ½ + ⅓ = (1 + 1)/(2 + 3) = 2/5. Markiere das erste unzulässige Gleichheitszeichen. Erkläre den Fehler mit gleich großen Teilen, korrigiere den Weg und prüfe zusätzlich: Kann die Summe kleiner als ½ sein, wenn ⅓ hinzugefügt wird?",
        solution: "Bereits die erste Gleichsetzung ist unzulässig. Hälften und Drittel sind verschieden große Teile; durch Addieren der Nenner entstehen keine passenden Fünftel. Richtig: ½ + ⅓ = 3/6 + 2/6 = 5/6. Zudem ist 2/5 kleiner als ½, während die gesuchte Summe größer sein muss.",
        criterion: "Das Kind lokalisiert den ersten Fehler, begründet ihn über Teilgrößen und nutzt die Größenkontrolle zusätzlich zur korrekten Rechnung.",
        limit: "Das Aufdecken dieses vorgegebenen Fehlers beweist nicht, dass derselbe Fehler selbstständig vermieden wird. Keine Ursache einem realen Kind zuschreiben."
      },
      category: "C",
      title: "Fehlerdetektiv",
      purpose: "Einen fiktiven Lösungsweg prüfen, eine fehlerhafte Stelle lokalisieren und die Korrektur begründen.",
      when: "Wenn ein Fehler als Lerngegenstand untersucht werden soll, ohne einem realen Kind eine Ursache zuzuschreiben.",
      output: "Ein ausdrücklich fiktiver Lösungsweg, Prüfauftrag, Hilfestufe und getrennte begründete Korrektur.",
      check: "Ist klar, welcher Schritt falsch ist und warum, ohne die fiktive Fehleridee als tatsächliche Denkweise eines Kindes auszugeben?",
      prompt: prompt(`Erstelle zu einer passenden Aufgabe einen kurzen, ausdrücklich fiktiven Lösungsweg mit genau einer fachlich bedeutsamen Fehlerstelle. Die übrigen Schritte sollen nachvollziehbar sein. Wähle einen Fehler, an dem die zum Lernziel gehörende Beziehung erklärt werden kann.
Der Auftrag soll verlangen: den ersten unzulässigen Schritt markieren, seine Unzulässigkeit erklären, den Weg korrigieren und die Korrektur durch Darstellung, Gegenprobe oder Plausibilität prüfen. Gib einen Hinweis, der auf die Beziehung lenkt, ohne sofort die Fehlerstelle zu nennen.
Liefere getrennt die korrekte Lösung und Begründung. Als optionale Auswahlvariante darfst du drei plausible Ergebnisse mit der Aufforderung zur Begründung anbieten. Eine angekreuzte Antwort erlaubt keine gesicherte Diagnose der tatsächlichen Denkweise. Beschreibe Fehlerursachen allenfalls als mögliche Deutungen, niemals als feststehende Eigenschaften realer Kinder.`)
    },
    {
      id: "immer-manchmal-nie",
      category: "C",
      title: "Immer – manchmal – nie",
      purpose: "Aussagen unter klaren Voraussetzungen prüfen und die Einstufung begründen.",
      when: "Wenn eine Regel, Beziehung oder Verallgemeinerung genauer untersucht werden soll.",
      output: "Drei Aussagen mit klaren Voraussetzungen, Begründungsauftrag und getrennten Beispielen beziehungsweise Gegenbeispielen.",
      check: "Ist der betrachtete Zahlenbereich eindeutig, und reichen die angegebenen Begründungen für die Einstufung aus?",
      prompt: prompt(`Formuliere drei kurze mathematische Aussagen zum Lernziel, die als immer, manchmal oder nie zutreffend untersucht werden können. Gib den betrachteten Zahlenbereich und nötige Voraussetzungen ausdrücklich an. Vermeide sprachliche Mehrdeutigkeit.
Fordere zu jeder Einstufung eine Begründung: Für „manchmal“ braucht es einen passenden Fall und einen Gegenfall. Für eine allgemeine Aussage genügt eine Liste einzelner Beispiele nicht als Beweis. Wähle eine altersangemessene Begründung oder Darstellung, mit der die Gültigkeit beziehungsweise Unmöglichkeit nachvollzogen werden kann.
Ergänze einen Hinweis zu einer anspruchsvollen Aussage. Gib separat Einstufung, Beispiele, Gegenbeispiele und Begründung an. Falls eine Aussage für die Lerngruppe nur experimentell untersucht werden kann, kennzeichne diese Grenze ausdrücklich.`)
    },
    {
      id: "schaetzen-plausibilitaet",
      category: "C",
      title: "Schätzen und Plausibilität prüfen",
      purpose: "Ergebnisse anhand von Größenordnung, Einheiten und Sachzusammenhang beurteilen.",
      when: "Wenn Rechnen durch eine begründete Erwartung und eine unabhängige Plausibilitätskontrolle ergänzt werden soll.",
      output: "Drei bis vier kurze Prüfaufgaben mit Überschlag, Rechenergebnis und begründeten Prüfkriterien.",
      check: "Passt die Kontrolle zur Größenordnung, zur Einheit und zum Kontext, statt nur dieselbe Rechnung zu wiederholen?",
      prompt: prompt(`Entwirf drei bis vier kurze Aufgaben zum Lernziel, bei denen Schätzen oder Plausibilitätsprüfung einen erkennbaren Zweck hat. Mindestens eine Aufgabe soll eine Erwartung vor dem Rechnen verlangen. Eine weitere soll ein vorgegebenes, ausdrücklich fiktives Ergebnis im Sachkontext beurteilen lassen, zum Beispiel bei Mengen, Preisen oder benötigten Behältern.
Lass jeweils Größenordnung, sinnvolle Einheit und relevante Grenzen nennen. Unterscheide ein ungefähres Ergebnis von einem exakten Ergebnis. Wenn der Kontext Auf- oder Abrunden verlangt, begründe die Entscheidung anhand der Situation.
Gib einen orientierenden Hinweis und getrennt die Rechnungen sowie angemessene Schätzbereiche mit Begründung an. Eine Plausibilitätsprüfung kann einen Fehler aufdecken, garantiert aber nicht die Richtigkeit jeder einzelnen Rechnung. Benenne diese Grenze in den Lehrkrafthinweisen.`)
    },
    {
      id: "sachkontexte-operation",
      category: "C",
      title: "Sachkontexte zu einer Operation",
      purpose: "Die Bedeutung einer Operation in unterschiedlichen Situationen erkennen und begründen.",
      when: "Wenn Terme und Situationen verbunden werden sollen, ohne sich auf einzelne Signalwörter zu verlassen.",
      output: "Drei kurze Sachsituationen zu einer Operation, Zuordnungs- und Begründungsfragen sowie getrennte Lösungen.",
      check: "Passt die Operation zur Beziehung der Größen, und werden unterschiedliche Operationsbedeutungen erkennbar?",
      prompt: prompt(`Wähle die zum Lernziel gehörende Operation und entwirf drei kurze, altersangemessene Sachsituationen. Zeige möglichst unterschiedliche Bedeutungen derselben Operation, etwa bei Subtraktion Wegnehmen, Ergänzen und Vergleichen oder bei Division Verteilen und Aufteilen. Wähle nur fachlich passende Bedeutungen.
Lass die jeweilige Situation mit einem Term und einer Handlung oder Skizze verbinden. Fordere eine Begründung, welche Größen bekannt und welche gesucht sind. Verwende keine Regel, die allein aus Wörtern wie „mehr“, „übrig“ oder „verteilen“ auf die Rechenart schließen lässt.
Ergänze eine Frage zum Vergleich zweier Situationen und einen Darstellungshinweis. Gib getrennt Terme, Lösungen mit Einheiten und die jeweilige Operationsbedeutung an. Prüfe, ob zusätzliche Lese- oder Sachanforderungen das eigentliche mathematische Ziel verdecken.`)
    },
    {
      id: "transfer-gleicher-kern",
      category: "C",
      title: "Transfer mit gleichem mathematischem Kern",
      purpose: "Eine tragende Beziehung in verändertem Kontext oder anderer Darstellung wiedererkennen und nutzen.",
      when: "Wenn geprüft werden soll, ob eine Erklärung über die geübte Beispielaufgabe hinaus trägt.",
      output: "Zwei neue Transferaufgaben, Erklärung des gemeinsamen Kerns und getrennte Lösungen mit Beobachtungshinweisen.",
      check: "Bleibt der mathematische Kern gleich, und sind zusätzliche Sprach-, Sach- oder Darstellungsanforderungen kenntlich?",
      prompt: prompt(`Benenne zunächst die mathematische Beziehung, die beim Lernziel erhalten bleiben soll. Entwirf dazu zwei neue Aufgaben: eine mit verändertem Kontext und eine mit veränderter Darstellung. Ändere nicht gleichzeitig unnötig viele Merkmale.
Lass das Kind erklären, was zur Ausgangsaufgabe gleich geblieben ist und was sich verändert hat. Ergänze einen optionalen Hinweis, der den gemeinsamen Kern anspricht, ohne die vollständige Lösung zu zeigen.
Gib getrennt Lösungen und eine Übersicht der Veränderungen an. Benenne zusätzliche Anforderungen wie Lesen, neue Einheiten oder das Verstehen einer ungewohnten Darstellung. Schlage bei Bedarf eine einfachere Zwischenaufgabe vor. Misslingender Transfer belegt nicht automatisch ein fehlendes Verständnis des ursprünglichen mathematischen Kerns.`)
    },
    {
      id: "eigene-aufgabe-erfinden",
      category: "C",
      title: "Eigene Aufgabe erfinden",
      purpose: "Strukturverständnis durch das Erstellen und Begründen einer passenden Aufgabe sichtbar machen.",
      when: "Wenn Lernende eine mathematische Beziehung selbst gestalten statt nur vorgegebene Aufgaben lösen sollen.",
      output: "Ein Erfindungsauftrag mit klaren Bedingungen, Lösungspflicht, Prüffragen und einem getrennten Lehrkraftbeispiel.",
      check: "Erfordern die Bedingungen die beabsichtigte Beziehung, und kann das Kind erklären, warum seine Aufgabe dazu passt?",
      prompt: prompt(`Formuliere einen Auftrag, bei dem das Kind selbst eine Aufgabe zum Lernziel erfindet. Lege zwei bis drei klare mathematische Bedingungen fest. Beispielsweise soll ein bestimmter Rechenweg sinnvoll sein, eine Darstellung passen oder eine vorgegebene Beziehung vorkommen. Vermeide eine reine Abschreibaufgabe mit ausgetauschten Zahlen.
Das Kind soll seine Aufgabe lösen, einen Denkweg oder eine Darstellung ergänzen und erklären, wie die Bedingungen erfüllt sind. Gib eine Einstiegshilfe und drei kurze Fragen zur Selbstprüfung.
Liefere getrennt ein mögliches Lehrkraftbeispiel mit Lösung sowie Kriterien für weitere gültige Aufgaben. Das Beispiel soll nicht von Beginn an die Eigenleistung ersetzen. Wenn die Bedingungen mehrere Aufgaben zulassen, mache diese Offenheit ausdrücklich.`)
    },
    {
      id: "verstaendnisorientierte-rueckmeldung",
      category: "D",
      title: "Verständnisorientierte Rückmeldung",
      purpose: "An einer tatsächlichen Bearbeitung anknüpfen und einen nächsten selbstständigen Denkschritt ermöglichen.",
      when: "Wenn eine Lösung oder Äußerung vorliegt und eine kurze passende Rückmeldung benötigt wird.",
      output: "Eine sachliche Beobachtung, eine offene Rückfrage und ein optionaler konkreterer Hinweis; getrennte Lehrkraftlösung.",
      check: "Bezieht sich die Rückmeldung auf das tatsächlich Gezeigte und lässt sie einen sinnvollen Denkschritt offen?",
      prompt: prompt(`Formuliere eine kurze Rückmeldung zur tatsächlich angegebenen Lösung oder Äußerung. Benenne zuerst sachlich einen beobachtbaren Aspekt, ohne eine nicht gezeigte Strategie oder Fähigkeit zuzuschreiben. Stelle anschließend genau eine offene Rückfrage, die zum Lernziel passt und den nächsten Denkschritt ermöglichen könnte.
Ergänze einen optionalen konkreteren Hinweis für den Fall, dass die erste Frage nicht weiterhilft. Gib in der Rückmeldung weder sofort das Endergebnis noch den vollständigen Lösungsweg vor. Vermeide pauschales Lob, Defizitetiketten oder Aussagen über die Persönlichkeit.
Falls keine Bearbeitung vorliegt, kennzeichne die Rückmeldung als Beispiel und erfrage die fehlende Information. Liefere getrennt die fachliche Lösung und erläutere, welche tatsächliche Antwort der Lehrkraft bei der Wahl der nächsten Hilfe helfen würde.`)
    },
    {
      id: "exit-ticket-ohne-ki",
      example: {
        context: `${fractionCase} Nach einer Förderung zur gemeinsamen Einheit folgt eine neue selbstständige Prüfung; daraus wird keine Lernwirkungsgarantie abgeleitet.`,
        task: "Ohne KI und ohne die zuvor genutzte Hilfe: Berechne 2/3 + 1/4. Erkläre mit einer eigenen Skizze oder in Worten, warum deine Teile zusammengezählt werden dürfen. Nenne außerdem eine einfache Größenkontrolle. Die Lösung erst nach dem eigenen Versuch ansehen.",
        solution: "2/3 + 1/4 = 8/12 + 3/12 = 11/12. Beide Anteile beziehen sich auf dasselbe Ganze; Zwölftel sind gleich große Teile. Die Summe ist größer als 2/3 und kleiner als 1, denn 1/4 ist kleiner als das zu 1 fehlende Drittel.",
        criterion: "Beobachten: wertgleiches Umformen, gemeinsame Einheit, richtige Summe und dazu passende Erklärung oder Skizze. Ein richtiges Ergebnis ohne Begründung lässt das Verständnis noch offen.",
        limit: "Eine einzelne neue Aufgabe liefert einen Hinweis auf selbstständige Anwendung, keinen Beleg dauerhafter Kompetenz. Bei Unklarheit später mit einer weiteren Variation nachfragen."
      },
      category: "D",
      title: "Exit-Ticket ohne KI",
      purpose: "Am Ende einer Lernphase eine neue eigenständige Bearbeitung zum konkreten Ziel erhalten.",
      when: "Wenn geprüft werden soll, was nach einer Erklärung oder Übung ohne KI gelingt.",
      output: "Eine neue kurze Aufgabe mit Begründungsimpuls, Lösung und zwei bis drei Beobachtungskriterien.",
      check: "Prüft die neue Aufgabe das konkrete Lernziel und verlangt sie mehr als das Wiedergeben des gezeigten Beispiels?",
      prompt: prompt(`Entwirf ein kurzes Exit-Ticket mit genau einer neuen Aufgabe zum Lernziel. Sie soll ohne KI und ohne eingeblendete Musterlösung bearbeitet werden. Verändere Zahlen oder Darstellung so, dass eine eigenständige Anwendung nötig ist, ohne unbeabsichtigt ein anderes Ziel zu prüfen.
Ergänze einen knappen Begründungs- oder Darstellungsimpuls. Gib getrennt die Lösung und zwei bis drei beobachtbare Kriterien für die Lehrkraft an, etwa Bezug zur Einheit, nachvollziehbare Umformung oder passende Darstellung. Keine scheinpräzisen Punktgrenzen für eine gesicherte Diagnose festlegen.
Schlage eine Rückfrage vor, falls Ergebnis und Erklärung nicht zusammenpassen. Ein einzelnes Ticket liefert Hinweise für die nächste Unterrichtsentscheidung und ist kein vollständiger Nachweis dauerhafter Kompetenz.`)
    },
    {
      id: "verzweigte-anschlussaufgaben",
      category: "D",
      title: "Verzweigte Anschlussaufgaben",
      purpose: "Mögliche nächste Aufgaben an konkrete Antworten knüpfen und die Auswahl begründen.",
      when: "Wenn die Lehrkraft für unterschiedliche Bearbeitungen passende Anschlussmöglichkeiten vorbereiten will.",
      output: "Eine Ausgangsfrage und höchstens drei klar bedingte Anschlusswege mit Aufgaben, Hilfen und Lösungen.",
      check: "Hängt jeder Zweig an einer tatsächlich beobachtbaren Antwort, und bleibt die Zuordnung eine überprüfbare Planung?",
      prompt: prompt(`Entwirf eine kleine geplante Verzweigung zum Lernziel: eine Ausgangsfrage und höchstens drei mögliche Anschlusswege. Beschreibe für jeden Zweig zunächst eine konkrete beobachtbare Antwort oder Handlung. Wenn diese Antwort nicht vorliegt, kennzeichne sie ausdrücklich als hypothetische Bedingung.
Ordne jedem Zweig eine kurze Anschlussaufgabe oder Hilfe zu und begründe die Auswahl. Berücksichtige auch den Fall einer unklaren Antwort: Dann folgt zunächst eine klärende Rückfrage statt einer vorschnellen Zuordnung. Halte das gemeinsame Ziel erkennbar bei.
Gib getrennt die Lösungen und Kriterien zur erneuten Prüfung an. Nenne das Ergebnis einen Verzweigungsplan, keine automatisch validierte adaptive Diagnose. Eine tatsächlich gegebene Kinderantwort muss die Lehrkraft weiterhin fachlich beurteilen, bevor sie einen Zweig auswählt.`)
    },
    {
      id: "partnerdialog",
      category: "D",
      title: "Partnerdialog / Erklären und Nachfragen",
      purpose: "Mathematische Erklärungen durch gezielte Rückfragen prüfen und präzisieren.",
      when: "Wenn ein kurzer Austausch möglich ist; alternativ als Einzelaufgabe mit schriftlicher Erklärung und Selbstprüfung.",
      output: "Zwei Rollen, ein gemeinsamer Auftrag, drei gezielte Rückfragen und fachliche Prüfkriterien; gleichwertige Einzelvariante.",
      check: "Verlangen die Rückfragen eine mathematische Verbindung, statt nur mehr Gespräch oder gegenseitige Zustimmung zu erzeugen?",
      prompt: prompt(`Entwirf einen kurzen Partnerdialog zu einer Aufgabe zum Lernziel. Rolle A erklärt den eigenen Weg mit Rechnung oder Darstellung. Rolle B fragt gezielt nach einer mathematischen Bedeutung, einem unklaren Schritt und einer möglichen Übertragung. Danach werden die Rollen an einer kleinen Variation getauscht.
Formuliere drei passende Rückfragen und zwei bis drei fachliche Prüfkriterien. Die Beteiligten sollen Aussagen anhand von Rechnung, Darstellung oder Beispiel prüfen, nicht lediglich zustimmen. Gib keine fertigen Kinderantworten vor, die nur vorgelesen werden.
Ergänze eine gleichwertige Einzelvariante für eine Online-Fortbildung ohne Partnerarbeit: schriftliche Erklärung, anschließende Prüfung anhand derselben Fragen und eine Überarbeitung. Gib getrennt eine mögliche Lösung und Hinweise für die Lehrkraft. Der Dialog ist ein Lern- und Beobachtungsanlass, kein standardisierter Kompetenztest.`)
    }
  ];

  window.HANDOUT_EXTRAS = [
    {
      id: "dateiexport",
      category: "B",
      title: "Geprüftes Arbeitsblatt als Datei",
      purpose: "Bereits ausgewähltes Material übersichtlich für Druck oder Weiterbearbeitung aufbereiten.",
      when: "Nach der fachlichen Prüfung, wenn Aufgaben und Lösungen in einer eigenen Datei benötigt werden.",
      output: "Ein Arbeitsblatt und ein getrenntes Lösungsblatt; bei fehlender Dateifunktion eine direkt kopierbare Fassung.",
      check: "Enthält die Datei das geprüfte Material vollständig, und sind Lösungen sowie persönliche Angaben angemessen getrennt?",
      prompt: prompt(`Bereite die in den Angaben enthaltenen, bereits ausgewählten Aufgaben als übersichtliches Arbeitsblatt auf. Verändere den mathematischen Inhalt nicht stillschweigend und erfinde keine fehlenden Aufgaben. Wenn das vollständige Material noch fehlt, frage gezielt danach.
Verwende gut lesbare Schrift, ausreichend Platz zum Rechnen oder Zeichnen und klare Aufgabenkennzeichnungen. Kopfzeilen dürfen leere Felder für Klasse, Datum oder Namen enthalten, aber keine erfundenen personenbezogenen Einträge. Erstelle ein getrenntes Lösungsblatt mit kurzen Hinweisen für die Lehrkraft.
Wenn deine aktuelle Umgebung echte Word- oder PDF-Dateien erzeugen kann, liefere diese Dateien und prüfe deren Inhalt. Falls keine solche Funktion verfügbar ist, sage das ausdrücklich und gib eine sauber strukturierte, direkt in Word kopierbare Textfassung aus. Erfinde keine Downloadlinks. Benenne abschließend, welche Formatierungs- oder Darstellungsdetails nach dem Öffnen noch zu kontrollieren sind.`)
    },
    {
      id: "diagnoseinterview",
      category: "D",
      title: "Leitfaden für ein mathematisches Gespräch",
      purpose: "Denkwege durch offene Fragen und passende Darstellungsaufträge genauer erkunden.",
      when: "Für die Vorbereitung eines kurzen Gesprächs, wenn eine einzelne Lösung noch mehrere Deutungen zulässt.",
      output: "Vier bis sechs offene Fragen mit jeweiligem Beobachtungszweck und optionaler Nachfrage.",
      check: "Erkundet die Frage den Denkweg offen, ohne eine gewünschte Antwort oder vermeintliche Fehlvorstellung vorzugeben?",
      prompt: prompt(`Entwirf einen kurzen Gesprächsleitfaden mit vier bis sechs offenen Fragen zum konkreten Lernziel. Beginne bei der tatsächlich vorliegenden Bearbeitung oder einer klar bezeichneten Ausgangsaufgabe. Nutze bei Bedarf einen Darstellungsauftrag oder eine kurze Kontrastaufgabe.
Nenne zu jeder Frage ihren Beobachtungszweck und eine mögliche Nachfrage bei einer unklaren Antwort. Achte auf nicht suggestive Formulierungen. Sage nicht vor, welche Strategie das Kind vermeintlich benutzt hat. Trenne eine Frage zur Klärung von einer erklärenden Hilfe, die das spätere Antwortverhalten bereits beeinflussen kann.
Beschreibe unterschiedliche mögliche Antworten nur als hypothetische Beispiele. Liefere keine gesicherte Diagnose, keine Benotung und keine Förderreihe. Die Lehrkraft dokumentiert die wirklichen Antworten, bevor sie daraus einen nächsten Prüfschritt oder eine Förderung ableitet.`)
    },
    {
      id: "standortbestimmung",
      category: "D",
      title: "Standortbestimmung zum Lernziel",
      purpose: "Mehrere gezielte Bearbeitungen als Grundlage für weitere Beobachtung und Unterrichtsplanung sammeln.",
      when: "Vor einer Lernphase, wenn zu einem eng umrissenen Ziel noch wenig bekannt ist.",
      output: "Vier bis sechs kurze Aufgaben, getrennte Lösungen und ein qualitativer Beobachtungsbogen.",
      check: "Machen die Aufgaben unterschiedliche relevante Aspekte sichtbar, ohne aus einer Punktzahl eine gesicherte Diagnose abzuleiten?",
      prompt: prompt(`Entwirf eine kleine Standortbestimmung mit vier bis sechs Aufgaben zum genannten Lernziel. Berücksichtige, soweit passend, eine Rechnung, eine Darstellung, eine Begründung und eine leicht veränderte Anwendung. Benenne jeweils, welche konkrete Handlung oder Beziehung beobachtet werden soll.
Vermeide unnötige Zusatzanforderungen durch Sprache, unpassende Zahlen oder ungewohnte Kontexte. Gib an, welche Hilfsmittel vorgesehen sind. Liefere getrennt Lösungen und einen qualitativen Beobachtungsbogen, der tatsächliche Antworten und offene Fragen festhält.
Bezeichne die Sammlung als unterrichtliche Orientierung, nicht als normierten oder validierten Test. Vergib keine ungeprüften Schwellenwerte für Kompetenzstufen oder Rechenstörungen. Nenne passende klärende Rückfragen bei widersprüchlichen Bearbeitungen. Eine Förderung wird erst auf Grundlage der tatsächlich beobachteten Antworten geplant.`)
    },
    {
      id: "elternhinweise",
      category: "B",
      title: "Kurze Übungshinweise für zu Hause",
      purpose: "Ein konkretes Unterrichtsziel in eine verständliche, kurze gemeinsame Aktivität übertragen.",
      when: "Wenn die Lehrkraft passende Hinweise für freiwilliges Üben zu Hause bereitstellen möchte.",
      output: "Zwei kurze Aktivitäten mit Alltagsmaterial, hilfreichen Fragen und Hinweisen zum Beenden oder Nachfragen.",
      check: "Passen die Hinweise zum Lernziel und vermeiden sie Druck, Fachjargon oder unbelegte Aussagen über das Kind?",
      prompt: prompt(`Formuliere zwei kurze, alltagstaugliche Übungsideen für Eltern oder andere Bezugspersonen zum konkreten Lernziel. Jede Idee soll in wenigen Minuten mit leicht verfügbarem Material möglich sein. Nutze einfache Sprache und erkläre unverzichtbare mathematische Wörter.
Beschreibe jeweils den Ablauf, eine offene Frage an das Kind und eine kleine Darstellung oder Handlung. Eltern sollen zuhören und nachfragen können, ohne einen bestimmten Rechenweg erzwingen zu müssen. Gib ein fiktives Beispiel und die fachliche Lösung getrennt an.
Ergänze einen Hinweis, wann die Aktivität beendet werden sollte und welche konkrete Beobachtung an die Lehrkraft zurückgemeldet werden kann. Erfinde keine Diagnose und formuliere keine Defizitzuschreibung aus ungesicherten Angaben. Die Hinweise ersetzen weder Unterricht noch eine individuelle fachliche Abklärung.`)
    },
    {
      id: "werkzeugpruefung",
      category: "C",
      title: "Rechenweg und Ergebnis mit Werkzeug prüfen",
      purpose: "Ergebnisprüfung, sichtbaren Werkzeugeinsatz und didaktische Erklärung auseinanderhalten.",
      when: "Wenn eine Musterlösung oder KI-Rechnung unabhängig kontrolliert werden soll.",
      output: "Nachvollziehbarer Rechenweg, getrennte Kontrolle, Kontextprüfung und kurze didaktische Erklärung.",
      check: "Ist der Werkzeugeinsatz tatsächlich nachvollziehbar, und werden Ergebnisrichtigkeit und verständliche Erklärung getrennt geprüft?",
      prompt: prompt(`Löse die angegebene Aufgabe mit nachvollziehbaren Rechenschritten. Prüfe das Ergebnis anschließend durch einen unabhängigen zweiten Weg, etwa Umkehroperation, geeigneten Überschlag oder ein tatsächlich verfügbares Rechenwerkzeug.
Falls du ein Werkzeug ausführst, dokumentiere Werkzeugart, Eingabe und erhaltene Ausgabe getrennt vom erklärenden Text. Behaupte keinen Werkzeugeinsatz, wenn du ihn nicht ausführen kannst. Wenn kein Werkzeug verfügbar ist, sage dies ausdrücklich und zeige einen geeigneten zweiten mathematischen Prüfweg. Deine bloße Selbstauskunft ist kein unabhängiger Beleg für eine Werkzeugausführung.
Prüfe zusätzlich Einheit, Definitionsbedingungen und Sachkontext. Ein rechnerischer Quotient kann beispielsweise anders zu interpretieren sein als die Anzahl benötigter ganzer Behälter. Gib zum Schluss eine kurze Erklärung zum Lernziel. Ein richtiges Ergebnis belegt weder einen bestimmten internen KI-Mechanismus noch automatisch eine lernwirksame Erklärung.`)
    },
    {
      id: "hypothesenbildung",
      example: {
        context: `${fractionCase} Diagnose vor Förderung: mögliche Deutungen und eine offene Kontrastaufgabe, noch keine Erklärhilfe.`,
        task: "Lege zwei gleich lange, ungeteilte Papierstreifen vor. Frage: Zeige ½ + ½ und ½ + ⅓ an den Streifen und erkläre deinen Weg. Was ist an beiden Aufgaben gleich, was ist verschieden? Erst den eigenen Versuch abwarten; nicht vorher Sechstel oder das Ergebnis nennen. Die Lehrkraft dokumentiert die tatsächlichen Aussagen.",
        solution: "Fachlich: ½ + ½ = 1; ½ + ⅓ = 5/6. Hypothese 1: Verschieden große Teile werden ohne gemeinsame Einheit gezählt. Eine hypothetische Aussage wie „zwei Stücke, also 2/5“ könnte dies stützen. Hypothese 2: Die Bedeutung ist verfügbar, die symbolische Regel wurde verwechselt. Eine selbstständig passende Darstellung samt begründeter Korrektur könnte eher dazu passen. Keine dieser Antworten liegt im Ausgangsfall bereits vor.",
        criterion: "Beobachten, wie das Kind Bezugs-Ganzes, Teilgröße und Zählen verbindet. Passende selbstständige Darstellung und Erklärung würden Hypothese 1 schwächen; anhaltend unpassende Zuordnungen würden Hypothese 2 infrage stellen. Unklare Aussagen offen nachfragen.",
        limit: "Beide Hypothesen bleiben vorläufig. Der Kontrast beweist keine Ursache; auch Sprache oder ungewohntes Material können die Antwort beeinflussen. Erklärhilfen erst danach gezielt einsetzen."
      },
      category: "D",
      title: "Beobachtung und vorläufige Hypothesen",
      purpose: "Eine vorliegende Lösung vorsichtig deuten und einen nächsten Prüfschritt vorbereiten.",
      when: "Für Praxisphase 1 oder eine eigenständige erste Fehleranalyse ohne anschließende Übungsproduktion.",
      output: "Aufgabenziel, Beobachtung, höchstens zwei Hypothesen, passende Prüffragen und offene Informationen.",
      check: "Sind beobachtbare Angaben und Deutungen getrennt und alle erwarteten Kinderantworten ausdrücklich hypothetisch?",
      prompt: prompt(`Unterstütze mich bei der Vorbereitung einer förderorientierten mathematischen Diagnose. Entnimm Aufgabe, vorliegende Lösung oder Äußerung und tatsächlich bekannte Zusatzinformationen ausschließlich den Angaben oben. Wenn die Aufgabe oder die beobachtete Lösung fehlt, frage danach, statt sie zu erfinden. Ein Aufgabenziel ist keine Voraussetzung: Fehlt es, schlage ein enges aufgabenbezogenes Ziel vor, ohne damit einen Lernstand des Kindes zu behaupten. Behalte ein passendes vorhandenes Ziel bei oder präzisiere es.
Beschreibe zunächst ausschließlich, was beobachtbar ist. Formuliere danach höchstens zwei unterschiedliche, vorsichtige Diagnosehypothesen. Begründe ihre Plausibilität anhand vorhandener Hinweise, ohne einen Denkweg oder eine Kinderäußerung als Tatsache zu ergänzen. Alltagssprachliche Vermutungen sind zulässig. Eine wissenschaftliche Kompetenzzuordnung ist keine Voraussetzung.
Nenne zu jeder Hypothese eine offene Rückfrage oder kurze Kontrastaufgabe. Beschreibe knapp, welche mögliche Antwort die Vermutung stützen beziehungsweise infrage stellen würde, und kennzeichne diese Antworten ausdrücklich als hypothetisch. Benenne offene Informationen. Stelle keine gesicherte Diagnose. Erstelle jetzt keine Förderübungen, keinen Förderplan und keine Unterrichtsreihe. Ohne tatsächliche weitere Kinderantwort bleibt die Hypothese offen.`)
    }
  ];
}());
