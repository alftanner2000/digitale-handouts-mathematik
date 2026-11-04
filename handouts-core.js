/* Data and prompts are independent of DOM, numbering and external services. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HandoutCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'digitale-handouts-v2';
  const LEGACY_KEY = 'digitale-handouts-foerderbaustein';
  const ALIASES = {station1:'bibliothek', station2:'hypothesen', station3:'foerderbaustein'};
  const cases = [
    {id:'zehner', title:'Zehnerübergang', grade:'1', task:'15 − 7 = ?', solution:'15 − 7 = 12', goal:'15 − 7 durch Zerlegen oder Ergänzen lösen und den Weg erklären.'},
    {id:'zahlwort', title:'Stellenwert und Zahlwort', grade:'2', task:'Schreibe die Zahl „sechzehn“.', solution:'61', goal:'Das Zahlwort sechzehn als Zahl notieren und Zehner sowie Einer zuordnen.'},
    {id:'entbuendeln', title:'Entbündeln', grade:'3', task:'503 − 78 = ?', solution:'503 − 78 = 575', goal:'503 − 78 stellenwertgerecht berechnen und das Entbündeln erklären.'},
    {id:'multiplikation', title:'Operationsverständnis', grade:'4', task:'6 · 7 = ?', solution:'6 · 7 = 13', goal:'6 · 7 als gleich große Gruppen darstellen und berechnen.'},
    {id:'brueche', title:'Bruchaddition', grade:'6', task:'1/2 + 1/3 = ?', solution:'1/2 + 1/3 = 2/5', goal:'Zwei ungleichnamige Brüche addieren und mit gleich großen Teilen desselben Ganzen erklären.'},
    {id:'dezimal', title:'Dezimalzahlen', grade:'5', task:'3,5 + 12 = ?', solution:'3,5 + 12 = 4,7', goal:'Dezimalzahlen stellenwertgerecht addieren und die Zuordnung der Stellen erklären.'}
  ];
  function uid() { return 'fall-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10); }
  function diagnostic(item) {
    return {id:uid(),title:item?.title || 'Eigener Fall',grade:item?.grade || '',task:item?.task || '',solution:item?.solution || '',goal:item?.goal || '',known:'',observation:'',hypothesis1:'',hypothesis2:'',check:'',missing:'',prompt:'',promptSource:''};
  }
  function builder(source) {
    return {id:uid(),title:source?.title || 'Neuer Förderentwurf',grade:source?.grade || '',topic:'',task:source?.task || '',observation:source ? [source.solution, source.observation].filter(Boolean).join('\n') : '',known:source?.known || '',taskGoal:source?.goal || '',hypotheses:source ? [source.hypothesis1,source.hypothesis2].filter(Boolean).join('\n') : '',plannedCheck:source?.check || '',missing:source?.missing || '',evidenceStatus:'open',evidence:'',assumption:'',conception:'',goal:'',focus:'A',format:'',draft:'',adjustments:'',final:'',use:'',success:'',checks:[],prompt:'',promptSource:''};
  }
  function empty() { const d=diagnostic(cases[0]); return {version:2,diagnostics:[d],builders:[],activeDiagnosticId:d.id,activeBuilderId:'',library:{mode:'blank',grade:'',task:'',goal:'',baseline:'',drafts:{}},legacy:{},updatedAt:''}; }
  function migrateLegacy(raw) {
    const old=JSON.parse(raw);
    if (!old || typeof old!=='object' || Array.isArray(old) || !Object.keys(old).some(k=>k.startsWith('build'))) throw new Error('Unbekanntes altes Speicherformat.');
    const state=empty(), b=builder();
    const map={buildClass:'grade',buildTopic:'topic',buildObservation:'observation',buildTaskGoal:'taskGoal',buildError:'hypotheses',buildConception:'conception',buildDraft:'draft',buildAdjustments:'adjustments',buildFinal:'final',buildUse:'use',buildSuccess:'success'};
    Object.entries(map).forEach(([oldKey,newKey])=>{if(typeof old[oldKey]==='string') b[newKey]=old[oldKey];});
    b.goal=[old.buildGoal1,old.buildGoal2].filter(x=>typeof x==='string'&&x).join('\n');
    b.title='Übernommener Förderbaustein – Ziel bitte eingrenzen';
    b.legacyOriginal=old; // includes old module edits and unknown fields, never discard
    state.builders.push(b); state.activeBuilderId=b.id;
    state.legacy={migratedFrom:LEGACY_KEY,original:old};
    return state;
  }
  function validate(state) {
    if (!state || state.version!==2 || !Array.isArray(state.diagnostics) || !Array.isArray(state.builders) || !state.library || typeof state.library!=='object') throw new Error('Keine unterstützte Handout-Datei (Version 2).');
    const seen=new Set();
    for(const kind of ['diagnostics','builders']) {
      if (state[kind].length>500) throw new Error('Zu viele Entwürfe.');
      for(const item of state[kind]) {
        if(!item || typeof item.id!=='string' || !item.id || typeof item.title!=='string' || seen.has(item.id)) throw new Error('Ungültiger oder doppelter Entwurf.');
        seen.add(item.id);
        const allowed = Object.keys(kind==='diagnostics'?diagnostic():builder());
        for(const key of allowed) if(key!=='checks' && item[key]!==undefined && typeof item[key]!=='string') throw new Error('Ungültiges Textfeld: '+key);
        if(kind==='builders' && item.checks!==undefined && (!Array.isArray(item.checks)||item.checks.some(x=>typeof x!=='string'))) throw new Error('Ungültige Prüfliste.');
      }
    }
    function validLibrary(lib) {
      if(!lib || typeof lib!=='object' || Array.isArray(lib))throw new Error('Ungültige Bibliothek.');
      if (lib.drafts!==undefined && (!lib.drafts || typeof lib.drafts!=='object' || Array.isArray(lib.drafts))) throw new Error('Ungültige Bibliothek.');
      for(const [key,v] of Object.entries(lib.drafts||{})) if(!v || typeof v.text!=='string' || typeof v.source!=='string' || ['__proto__','constructor','prototype'].includes(key)) throw new Error('Ungültiger Bibliothekseintrag.');
      for(const key of ['mode','grade','task','goal','baseline']) if(lib[key]!==undefined&&typeof lib[key]!=='string') throw new Error('Ungültiger Bibliothekskontext.');
      if(lib.mode && !['blank','diagnostic','builder','own'].includes(lib.mode))throw new Error('Unbekannter Bibliothekskontext.');
    }
    validLibrary(state.library);
    if(state.importedLibraries!==undefined){if(!Array.isArray(state.importedLibraries)||state.importedLibraries.length>500)throw new Error('Ungültiges Bibliotheksarchiv.');state.importedLibraries.forEach(validLibrary);}
    if(state.recoveredOriginals!==undefined&&(!Array.isArray(state.recoveredOriginals)||state.recoveredOriginals.some(v=>typeof v!=='string')))throw new Error('Ungültiger Rückfallstand.');
    if(state.recoveryRaw!==undefined&&typeof state.recoveryRaw!=='string')throw new Error('Ungültiger Originaltext.');
    if(state.legacyImports!==undefined&&!Array.isArray(state.legacyImports))throw new Error('Ungültiges Altarchiv.');
    return state;
  }
  function mergeImport(current, incoming) {
    validate(current);validate(incoming);
    for(const kind of ['diagnostics','builders']) if(current[kind].length+incoming[kind].length>500)throw new Error('Der Import würde die Grenze von 500 Entwürfen je Handout überschreiten.');
    if((current.importedLibraries?.length||0)+(incoming.importedLibraries?.length||0)+1>500)throw new Error('Zu viele Bibliotheksarchive.');
    const next=JSON.parse(JSON.stringify(current));
    for(const kind of ['diagnostics','builders']) for(const original of incoming[kind]) {
      const copy={...(kind==='diagnostics'?diagnostic():builder()),...JSON.parse(JSON.stringify(original))}; copy.id=uid(); copy.title+=' (importiert)'; next[kind].push(copy);
    }
    if(incoming.diagnostics.length) next.activeDiagnosticId=next.diagnostics.at(-1).id;
    if(incoming.builders.length) next.activeBuilderId=next.builders.at(-1).id;
    // Preserve the existing library and retain imported edits separately on conflicts.
    next.importedLibraries=next.importedLibraries||[];
    next.importedLibraries.push(JSON.parse(JSON.stringify(incoming.library)));
    if(Array.isArray(incoming.importedLibraries)) next.importedLibraries.push(...JSON.parse(JSON.stringify(incoming.importedLibraries)));
    next.legacyImports=next.legacyImports||[];
    if(incoming.legacy) next.legacyImports.push(incoming.legacy);
    if(Array.isArray(incoming.legacyImports)) next.legacyImports.push(...incoming.legacyImports);
    if(incoming.recoveryRaw) { next.recoveredOriginals=next.recoveredOriginals||[];next.recoveredOriginals.push(incoming.recoveryRaw); }
    if(Array.isArray(incoming.recoveredOriginals)) { next.recoveredOriginals=next.recoveredOriginals||[];next.recoveredOriginals.push(...incoming.recoveredOriginals); }
    return validate(next);
  }
  const val=(s,fallback='nicht angegeben')=>s?.trim() || fallback;
  function diagnosticPrompt(d) {
    return `Unterstütze mich bei der Vorbereitung einer förderorientierten mathematischen Diagnose.
Klasse / Stufe: ${val(d.grade)}
Aufgabe: ${val(d.task)}
Aufgabenziel: ${val(d.goal)}
Vorliegende Schülerlösung beziehungsweise Äußerung: ${val(d.solution)}
Weitere tatsächlich bekannte Informationen: ${val(d.known,'keine')}

Beschreibe zunächst ausschließlich, was an der vorliegenden Lösung beobachtbar ist. Formuliere danach höchstens zwei unterschiedliche, vorsichtige Diagnosehypothesen. Begründe ihre Plausibilität anhand der vorhandenen Hinweise, ohne einen Denkweg oder eine Äußerung des Kindes zu erfinden.
Nenne zu jeder Hypothese eine offene Rückfrage oder eine kurze Kontrastaufgabe. Beschreibe knapp, welche mögliche Antwort die Vermutung stützen beziehungsweise infrage stellen würde; kennzeichne diese Antworten ausdrücklich als hypothetisch. Benenne fehlende Informationen.
Stelle keine gesicherte Diagnose und leite keine dauerhafte Eigenschaft des Kindes aus einem Einzelfehler ab. Erstelle jetzt keine Förderübungen, keinen Förderplan und keine Unterrichtsreihe. Eine wissenschaftliche Kompetenzzuordnung ist keine Voraussetzung.

Nutze zum Kopieren in Handout 1 genau diese Überschriften:
AUFGABENZIEL
BEOBACHTUNG
HYPOTHESE 1
HYPOTHESE 2 (nur wenn begründet)
AUSGEWÄHLTE PRÜFFRAGE ODER KONTRASTAUFGABE
OFFENE INFORMATIONEN
Die Hypothesen bleiben bis zu tatsächlichen weiteren Antworten offen.`;
  }
  function contextForBuilder(b) {
    const status = b.evidenceStatus==='observed' ? `Tatsächlich beobachtete weitere Antwort: ${val(b.evidence)}. Auch diese erlaubt keine pauschale Diagnose.` : b.evidenceStatus==='assumed' ? `Ausdrückliche Arbeitsannahme für die Planung: ${val(b.assumption)}. Nicht als tatsächliche Kinderantwort ausgeben.` : `Ausgangslage noch ungeklärt. Unter der Annahme, dass ${val(b.assumption,'[eine begründete Arbeitsannahme noch festzulegen ist]')}, kann nur bedingt geplant werden. Erfinde keine Bestätigung.`;
    return `Klasse / Stufe: ${val(b.grade)}
Thema / Leitidee: ${val(b.topic)}
Aufgabe: ${val(b.task)}
Aufgabe und beobachtete Schülerlösung: ${val(b.observation)}
Weitere tatsächlich bekannte Informationen: ${val(b.known,'keine')}
Konkretes Aufgabenziel: ${val(b.taskGoal)}
Offene Hypothesen: ${val(b.hypotheses,'keine formuliert')}
Geplanter Prüfschritt: ${val(b.plannedCheck)}
Fehlende Informationen: ${val(b.missing)}
Stand der Ausgangslage: ${status}
Möglicher fachlicher Bezug (optional, vorläufig): ${val(b.conception,'offen')}
Ein enges, beobachtbares Förderziel: ${val(b.goal)}`;
  }
  function fillTemplate(text, context) {
    const map={klasse:context.grade||'[Klasse / Stufe ergänzen]',aufgabe:context.task||'[Aufgabe ergänzen]',ziel:context.goal||'[konkretes Ziel ergänzen]',ausgangslage:context.baseline||'[Ausgangslage / Arbeitsannahme ergänzen]'};
    return text.replace(/\{\{(klasse|aufgabe|ziel|ausgangslage)\}\}/g,(_,key)=>map[key]);
  }
  function builderPrompt(b, format) {
    const context=contextForBuilder(b);
    const specific=format ? fillTemplate(format.prompt,{grade:b.grade,task:b.task,goal:b.goal,baseline:context}) : '[Genau ein Format auswählen]';
    return `Entwirf einen kleinen Förderbaustein für den Mathematikunterricht, keine Unterrichtsreihe.
${context}

Gewählter Schwerpunkt: ${format?.title || 'noch offen'}
Formatspezifischer Auftrag:
${specific}

Halte genau ein Förderziel ein. Der gemeinsame Ergebnisrahmen hat Vorrang vor einer größeren Aufgabenmenge aus der Formatvorlage. Liefere:
1. Konkretes beobachtbares Lernziel.
2. Ausgangslage: beobachtete Angaben und ausdrücklich gewählte Annahmen getrennt. Bei Unsicherheit formuliere ausdrücklich „Unter der Annahme, dass …“. Fehlende Angaben als offen kennzeichnen und keine Kinderantwort erfinden.
3. Eine kurze passende Erklärung oder Darstellung mit nachvollziehbarer Verbindung zur Rechnung.
4. In der Regel drei bis fünf aufeinander bezogene Aufgaben zum gewählten Schwerpunkt.
5. Mindestens eine gestufte Hilfe vom offenen Impuls zum konkreteren Hinweis, getrennt von der vollständigen Lösung.
6. Eine neue Aufgabe zur selbstständigen Erfolgskontrolle ohne KI mit kurzer Begründungsfrage.
7. Separat: Lösungen mit nachvollziehbarer Prüfung sowie kurze beobachtbare Kriterien für die Lehrkraft.
Ein guter Materialentwurf belegt weder die Diagnose noch eine Lernwirkung. Behaupte keine Prüfung durch die Lehrkraft. Kennzeichne nötige fachliche Kontrollen.`;
  }
  return {KEY,LEGACY_KEY,ALIASES,cases,uid,diagnostic,builder,empty,migrateLegacy,validate,mergeImport,diagnosticPrompt,contextForBuilder,fillTemplate,builderPrompt};
});
