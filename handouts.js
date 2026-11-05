(function () {
  'use strict';
  const C=window.HandoutCore, $=id=>document.getElementById(id), all=s=>[...document.querySelectorAll(s)];
  const formats=window.HANDOUT_FORMATS||[], extras=window.HANDOUT_EXTRAS||[], library=[...formats,...extras];
  const freeIdeas=window.HANDOUT_FREE_IDEAS;
  const lookupFormat=id=>library.find(f=>f.id===id)||(id===freeIdeas?.id?freeIdeas:undefined);
  const checks=['Rechenergebnisse und Lösungen unabhängig geprüft.','Darstellungen, Einheiten und das gemeinsame Ganze stimmen.','Genau ein Förderziel ist erkennbar; Aufgaben und Hilfen passen dazu.','Beobachtungen und Arbeitsannahmen bleiben getrennt.','Neue Abschlussaufgabe ist ohne KI lösbar; Beobachtungskriterien sind festgehalten.','Keine identifizierbaren Schülerdaten enthalten.'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state=C.empty(), storageBlocked=false, recoveryRaw='', lastSaved='', toastTimer;
  const notice=message=>{ $('migrationNotice').hidden=false; $('migrationNotice').textContent=message; };
  function announce(message) { $('globalStatus').textContent=message; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('globalStatus').textContent='',6500); }
  function load() {
    try {
      const raw=localStorage.getItem(C.KEY), old=localStorage.getItem(C.LEGACY_KEY);
      $('recoveryBox').hidden=!old;
      if(raw) {
        try { state=C.validate(JSON.parse(raw)); lastSaved=raw; }
        catch { recoveryRaw=raw; storageBlocked=true; notice('Der bisherige neue Speicherstand ist nicht lesbar. Er bleibt unverändert. Sichern Sie die Arbeitsstände als Datei; darin wird auch der unlesbare Originaltext erhalten. Neue Eingaben sind zunächst nur in dieser Sitzung verfügbar.'); }
      } else if(old) {
        try { state=C.migrateLegacy(old); notice('Ihr bisheriger Förderbaustein wurde Handout 2 zugeordnet. Alle alten Felder bleiben zusätzlich im unveränderten Original erhalten. Bitte das Förderziel auf einen Schwerpunkt eingrenzen.'); }
        catch { recoveryRaw=old; state.recoveredOriginals=[old];notice('Der alte Förderbaustein konnte nicht zugeordnet werden. Der Originalspeicher bleibt unverändert; der Datei-Export erhält zusätzlich seinen Rohtext.'); }
      }
    } catch { storageBlocked=true; notice('Der Browser erlaubt keinen Zugriff auf lokale Speicherung. Arbeiten ist möglich; sichern Sie Ihre Ergebnisse vor dem Schließen als Datei.'); }
    state.diagnostics=state.diagnostics.map(d=>({...C.diagnostic(),...d}));
    state.builders=state.builders.map(b=>({...C.builder(),...b}));
    if(!state.diagnostics.length) { const d=C.diagnostic(); state.diagnostics.push(d);state.activeDiagnosticId=d.id; }
    if(!state.diagnostics.some(x=>x.id===state.activeDiagnosticId))state.activeDiagnosticId=state.diagnostics[0].id;
    if(!state.builders.some(x=>x.id===state.activeBuilderId))state.activeBuilderId=state.builders[0]?.id||'';
    state.library={mode:'blank',grade:'',task:'',goal:'',baseline:'',drafts:{},...state.library};
  }
  function save(explicit=false) {
    state.updatedAt=new Date().toISOString();
    syncPrintPage();
    if(storageBlocked) { $('storageStatus').textContent='Nicht dauerhaft gespeichert – bitte als Datei sichern.'; if(explicit) announce('Speicherung ist gesperrt oder nicht verfügbar. Bitte die Dateisicherung nutzen; vorhandene Daten werden nicht überschrieben.');return false; }
    try {
      const current=localStorage.getItem(C.KEY);
      if(lastSaved && current!==lastSaved) { storageBlocked=true;notice('Der Speicher wurde in einem anderen Fenster verändert. Zum Schutz beider Stände wurde automatisches Speichern angehalten. Diese Sitzung als Datei sichern und nach Neuladen zusätzlich importieren.');return false; }
      const raw=JSON.stringify(state); localStorage.setItem(C.KEY,raw); lastSaved=raw;
      $('storageStatus').textContent='Auf diesem Gerät gespeichert · '+new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
      if(explicit)announce('Alle aktuellen Arbeitsstände im Browser gespeichert.'); return true;
    } catch { storageBlocked=true; $('storageStatus').textContent='Browser-Speicherung fehlgeschlagen – bitte als Datei sichern.';return false; }
  }
  const diag=()=>state.diagnostics.find(x=>x.id===state.activeDiagnosticId);
  const build=()=>state.builders.find(x=>x.id===state.activeBuilderId);
  const option=(value,label)=>`<option value="${esc(value)}">${esc(label)}</option>`;
  const promptSelector='#diagnosisPrompt,#hypothesisPrompt,#goalPrompt,#formatIdeasPrompt,#builderPrompt,#independentPrompt,[data-library-prompt]';
  function resizeOpenPrompts(){all(promptSelector).forEach(el=>{if(el.dataset.expanded==='true'&&el.getClientRects().length){el.style.height='auto';el.style.height=(el.scrollHeight+4)+'px';}});}
  function installPromptTools(){all(promptSelector).forEach(el=>{if(el.dataset.toolsReady)return;el.dataset.toolsReady='true';const row=document.createElement('div');row.className='prompt-tools';row.innerHTML=`<button type="button" class="button" data-expand-prompt="${esc(el.id)}" aria-controls="${esc(el.id)}" aria-expanded="false">Vollständigen Prompt anzeigen</button><button type="button" class="button" data-save-prompt="${esc(el.id)}">Prompt als Textdatei speichern</button>`;el.after(row);});}
  function selectors() {
    const options=state.diagnostics.map((d,i)=>option(d.id,`${i+1} · ${d.title || 'Unbenannter Fall'}`)).join('');
    $('diagnosticSelect').innerHTML=options; $('diagnosticSelect').value=state.activeDiagnosticId;
    $('transferSelect').innerHTML=options; $('transferSelect').value=state.activeDiagnosticId;
    $('builderSelect').innerHTML=state.builders.length?state.builders.map((b,i)=>option(b.id,`${i+1} · ${b.title||'Unbenannter Entwurf'}`)).join(''):option('','Noch kein Förderentwurf');
    $('builderSelect').value=state.activeBuilderId;
  }
  function diagSource() { const d=diag();return JSON.stringify([d.grade,d.task,d.solution,d.goal,d.known]); }
  function buildSource() { const b=build();return b?JSON.stringify([C.contextForBuilder(b),b.focus,b.format,...(b.format==='custom'?[b.customFormat||'']:[])]):''; }
  function formatIdeasSource() { const b=build();return b?JSON.stringify([C.contextForBuilder(b),b.customFormat||'']):''; }
  function goalSource() { const b=build();return b?C.contextForBuilder(b):''; }
  function hypothesisSource() { const b=build();return b?C.contextForBuilder(b):''; }
  function promptStatus() {
    const d=diag(),b=build();
    $('diagnosisPromptStatus').textContent=!d.prompt?'Noch kein Prompt erzeugt.':d.promptSource!==diagSource()?'Angaben geändert: Der Prompt gehört noch zum früheren Stand. Bitte bewusst neu erzeugen.':'Prompt gehört zu den aktuellen Angaben; eigene Änderungen bleiben erhalten.';
    $('builderPromptStatus').textContent=!b?.prompt?'Noch kein Förderprompt erzeugt.':b.promptSource!==buildSource()?'Angaben oder Format geändert: Der Prompt ist noch nicht aktualisiert. Bitte bewusst neu erzeugen.':'Förderprompt gehört zu den aktuellen Angaben; eigene Änderungen bleiben erhalten.';
    $('goalPromptStatus').textContent=!b?.goalPrompt?'Noch kein Prompt für Zielvorschläge erzeugt.':b.goalPromptSource!==goalSource()?'Ausgangslage oder bisheriger Zielentwurf geändert: Dieser Prompt gehört noch zum früheren Stand. Bei Bedarf neu erzeugen.':'Prompt gehört zu den aktuellen Angaben; eigene Änderungen bleiben erhalten.';
    $('hypothesisPromptStatus').textContent=!b?.hypothesisPrompt?'Noch kein Diagnoseprompt für diesen Entwurf erzeugt.':b.hypothesisPromptSource!==hypothesisSource()?'Angaben seit der Prompt-Erstellung geändert. Für eine erneute KI-Befragung bei Bedarf bewusst neu erzeugen.':'Diagnoseprompt gehört zu den aktuellen Angaben; eigene Änderungen bleiben erhalten.';
    $('formatIdeasPromptStatus').textContent=!b?.formatIdeasPrompt?'Noch kein Ideenprompt erzeugt.':b.formatIdeasPromptSource!==formatIdeasSource()?'Ausgangslage oder eigene Idee geändert: Diesen Prompt bei Bedarf bewusst neu erzeugen.':'Ideenprompt gehört zu den aktuellen Angaben; kein Vorschlag wird automatisch gewählt.';
    resizeOpenPrompts();
  }
  function renderDiag() { all('[data-diag]').forEach(el=>el.value=diag()[el.dataset.diag]||'');selectors();promptStatus();updateLibraryContext(); }
  function renderFormat() {
    const b=build();if(!b)return;
    const choices=b.focus==='all'?formats:formats.filter(f=>f.category===b.focus);
    $('build-format').innerHTML=option('','Bitte Vorgehensweise wählen')+option('custom','Eigene Idee / ausgewählter KI-Vorschlag')+choices.map(f=>option(f.id,f.title)).join('');
    $('build-format').value=b.format||'';
    const f=formats.find(x=>x.id===b.format);
    $('formatGuidance').textContent=b.format==='custom'?'Die unten beschriebene eigene Vorgehensweise fließt in den Förderprompt ein. Sie darf Angebote sinnvoll kombinieren.':f?`${f.purpose} Prüffrage: ${f.check}`:'Die Vorlagen sind Beispiele. Sie können alle anzeigen oder eine eigene beziehungsweise von der KI vorgeschlagene Vorgehensweise verwenden.';
  }
  function evidenceVisibility() { const b=build();if(!b)return;$('evidenceLabel').hidden=b.evidenceStatus!=='observed';$('assumptionLabel').hidden=b.evidenceStatus==='observed'; }
  function renderBuilder() {
    const b=build();selectors();$('builderFields').hidden=!b;$('noBuilder').hidden=Boolean(b);
    if(b) {
      all('[data-build]').forEach(el=>el.value=b[el.dataset.build]||'');renderFormat();evidenceVisibility();
      $('builderChecks').innerHTML=checks.map((label,i)=>`<label><input type="checkbox" data-check="${i}" ${b.checks?.includes(String(i))?'checked':''}>${esc(label)}</label>`).join('');
      $('legacyBuilder').hidden=!b.legacyOriginal;$('legacyBuilderText').textContent=b.legacyOriginal?JSON.stringify(b.legacyOriginal,null,2):'';
    }
    promptStatus();updateLibraryContext();
  }
  function addBuilder(source) {
    if(state.builders.length>=500){announce('Grenze von 500 Förderentwürfen erreicht. Bitte vorhandene Entwürfe nutzen und als Datei sichern.');return;}
    const b=C.builder(source);state.builders.push(b);state.activeBuilderId=b.id;save();renderBuilder();
    go('foerderbaustein',true); announce(source?'Zusätzlicher Förderentwurf mit den vorhandenen Fallangaben angelegt. Bitte offene Angaben ergänzen.':'Neuer eigener Förderentwurf angelegt. Die inhaltlichen Felder sind leer; bisherige Entwürfe bleiben erhalten.');
  }
  function updateBuilderEntry() {
    const sample=C.cases.find(c=>c.id===$('builderCaseChoice').value);
    $('newBuilder').textContent=sample?'Beispiel als neuen Entwurf anlegen':'Leeren Förderentwurf anlegen';
    $('builderEntryHint').textContent=sample?`„${sample.title}“: Beim Anlegen werden Klasse, Aufgabe, fiktive Schülerlösung und Aufgabenziel übernommen. Hypothesen und Förderziel bleiben offen.`:'Erst „Leeren Förderentwurf anlegen“ öffnet einen neuen eigenen Fall. Die inhaltlichen Felder der Ausgangslage sind dann leer.';
  }
  function ask(message) {
    return new Promise(resolve=>{
      const dialog=$('confirmDialog');$('confirmMessage').textContent=message;
      dialog.returnValue='cancel';
      dialog.addEventListener('close',()=>resolve(dialog.returnValue==='ok'),{once:true});dialog.showModal();$('confirmCancel').focus();
    });
  }
  async function transfer(id) {
    const d=state.diagnostics.find(x=>x.id===id);if(!d)return;
    if(!d.task.trim()||!d.solution.trim()){announce('Bitte zuerst Aufgabe und vorliegende oder fiktive Schülerlösung ergänzen. Weitere Felder dürfen noch offenbleiben.');return;}
    if(!await ask('Den Arbeitsstand als zusätzlichen Förderentwurf für Praxisphase 2 bereitstellen? Bestehende Entwürfe bleiben unverändert. Offene Hypothesen werden nicht als bestätigt übernommen.'))return;
    addBuilder(d);
  }
  async function regenerate(kind) {
    const d=kind==='diagnostic'?diag():build();if(!d)return;
    if(kind==='diagnostic'&&(!d.task.trim()||!d.solution.trim())) {announce('Bitte Aufgabe und vorliegende oder ausdrücklich fiktive Lösung ergänzen. Ein Aufgabenziel kann die KI anschließend vorschlagen.');return;}
    if(kind==='builder') {
      if(!d.task.trim()||!d.goal.trim()||!d.format){announce('Bitte Aufgabe, ein Förderziel und eine Vorgehensweise wählen – aus den Beispielen oder als eigene Idee.');return;}
      if(d.format==='custom'&&!d.customFormat.trim()){announce('Bitte die eigene Vorgehensweise beziehungsweise den ausgewählten KI-Vorschlag kurz beschreiben.');$('build-customFormat').focus();return;}
      if(d.evidenceStatus==='observed'&&!d.evidence.trim()){announce('Bitte die tatsächliche weitere Antwort eintragen oder den Stand auf „noch offen“ setzen.');return;}
      if(d.evidenceStatus==='assumed'&&!d.assumption.trim()){announce('Bitte die ausdrücklich gewählte Arbeitsannahme eintragen.');return;}
    }
    if(d.prompt&&!await ask('Den vorhandenen Prompt durch einen neuen aus den aktuellen Angaben ersetzen? Eigene Bearbeitungen am Prompt werden dabei ersetzt.'))return;
    d.prompt=kind==='diagnostic'?C.diagnosticPrompt(d):C.builderPrompt(d,formats.find(f=>f.id===d.format));d.promptSource=kind==='diagnostic'?diagSource():buildSource();
    $(kind==='diagnostic'?'diagnosisPrompt':'builderPrompt').value=d.prompt;save();promptStatus();announce('Prompt mit den aktuellen Angaben erzeugt. Vor dem Kopieren prüfen.');
  }
  async function regenerateGoal() {
    const b=build();if(!b)return;
    if(!b.task.trim()){announce('Bitte zuerst die Aufgabe unter „1 · Ausgangslage“ eintragen. Ein Förderziel ist für diesen Prompt noch nicht erforderlich.');$('build-task').focus();return;}
    if(b.evidenceStatus==='observed'&&!b.evidence.trim()){announce('Bitte die tatsächliche weitere Antwort eintragen oder den Stand auf „noch offen“ setzen.');return;}
    if(b.evidenceStatus==='assumed'&&!b.assumption.trim()){announce('Bitte die ausdrücklich gewählte Arbeitsannahme eintragen.');return;}
    if(b.goalPrompt&&!await ask('Den bearbeiteten Ziel-Prompt durch einen neuen aus den aktuellen Angaben ersetzen? Das gewählte Förderziel bleibt erhalten.'))return;
    b.goalPrompt=C.goalPrompt(b);b.goalPromptSource=goalSource();$('goalPrompt').value=b.goalPrompt;save();promptStatus();announce('Prompt für Zielvorschläge erzeugt. In einer freigegebenen KI verwenden und genau ein passendes Ziel auswählen.');
  }
  async function regenerateFormatIdeas() {
    const b=build();if(!b)return;
    if(!b.task.trim()){announce('Bitte zunächst die Aufgabe eintragen. Ein bestimmtes Format ist nicht nötig.');$('build-task').focus();return;}
    if(b.evidenceStatus==='observed'&&!b.evidence.trim()){announce('Bitte die tatsächliche weitere Antwort ergänzen oder die Ausgangslage als noch offen kennzeichnen.');return;}
    if(b.evidenceStatus==='assumed'&&!b.assumption.trim()){announce('Bitte die gewählte Arbeitsannahme ergänzen.');return;}
    if(b.formatIdeasPrompt&&!await ask('Den bearbeiteten Ideenprompt aus den aktuellen Angaben neu erzeugen? Gespeicherte Vorschläge und Ihre gewählte Vorgehensweise bleiben erhalten.'))return;
    b.formatIdeasPrompt=C.fillTemplate(freeIdeas.prompt,{grade:b.grade,task:b.task,goal:b.goal,baseline:C.contextForBuilder(b)})+'\n\nEigene Idee oder Wünsche, falls vorhanden:\n'+(b.customFormat||'Noch keine eigene Idee. Bitte offen passende Alternativen vorschlagen.');
    b.formatIdeasPromptSource=formatIdeasSource();$('formatIdeasPrompt').value=b.formatIdeasPrompt;save();promptStatus();announce('Ideenprompt erzeugt. Vorschläge prüfen und selbst auswählen; nichts wird automatisch übernommen.');
  }
  async function chooseCustomFormat() {
    const b=build();if(!b)return;
    if(!b.customFormat.trim()){announce('Bitte zuerst Ihre Idee oder einen fachlich geprüften Vorschlag eintragen.');$('build-customFormat').focus();return;}
    if(b.format&&b.format!=='custom'&&!await ask('Die ausgewählte Formatvorlage durch Ihre eigene Vorgehensweise ersetzen? Vorhandene Prompts und Materialien bleiben unverändert.'))return;
    b.format='custom';save();renderFormat();promptStatus();announce('Eigene Vorgehensweise gewählt. Den Förderprompt bei Bedarf bewusst neu erzeugen.');
  }
  async function regenerateHypotheses() {
    const b=build();if(!b)return;
    if(!b.task.trim()||!b.observation.trim()){announce('Bitte zunächst Aufgabe und vorliegende oder ausdrücklich fiktive Schülerlösung eintragen. Hypothesen und Aufgabenziel dürfen leer bleiben.');(!b.task.trim()?$('build-task'):$('build-observation')).focus();return;}
    if(b.hypothesisPrompt&&!await ask('Den bisherigen Diagnoseprompt durch einen neuen aus den aktuellen Fallangaben ersetzen? Ihre Ergebnisfelder bleiben unverändert.'))return;
    b.hypothesisPrompt=C.builderHypothesisPrompt(b);b.hypothesisPromptSource=hypothesisSource();$('hypothesisPrompt').value=b.hypothesisPrompt;save();promptStatus();announce('Diagnoseprompt erzeugt. Nach der KI-Arbeit die Antwort prüfen und erst dann die passenden Ergebnisfelder ergänzen.');
  }
  async function applyGoal() {
    const b=build();if(!b)return;const candidate=(b.goalCandidate||'').trim();
    if(!candidate){announce('Bitte zuerst genau einen ausgewählten Zielvorschlag einfügen und fachlich prüfen.');$('build-goalCandidate').focus();return;}
    if(b.goal.trim()&&b.goal.trim()!==candidate&&!await ask('Das bisherige Förderziel durch den ausgewählten Vorschlag ersetzen? Bereits erzeugte Förderprompts werden nicht automatisch geändert.'))return;
    b.goal=candidate;$('build-goal').value=candidate;save();promptStatus();updateLibraryContext();$('build-goal').focus();announce('Ausgewähltes Ziel übernommen. Es bleibt bearbeitbar; einen vorhandenen Förderprompt bitte bewusst neu erzeugen.');
  }
  function libraryContext() {
    const l=state.library;
    if(l.mode==='diagnostic'){const d=diag();return {grade:d.grade,task:d.task,goal:d.goal,baseline:`Vorliegende Lösung: ${d.solution}\nWeitere tatsächlich bekannte Informationen: ${d.known||'keine'}\nBeobachtung: ${d.observation}\nOffene Hypothesen: ${[d.hypothesis1,d.hypothesis2].filter(Boolean).join('; ')}\nDie aufgeführten Angaben sind keine automatisch bestätigte Diagnose.`,label:'Handout 1 · '+d.title};}
    if(l.mode==='builder'){const b=build();return b?{grade:b.grade,task:b.task,goal:b.goal,baseline:C.contextForBuilder(b),label:'Handout 2 · '+b.title}:{grade:'',task:'',goal:'',baseline:'',label:'Kein Förderentwurf vorhanden – Platzhalter ergänzen'};}
    if(l.mode==='sample')return {...window.HANDOUT_TRIAL_EXAMPLE,label:'Fiktive Bruchauswertung · gemeinsame Erprobung'};
    if(l.mode==='own')return {grade:l.grade,task:l.task,goal:l.goal,baseline:l.baseline,label:'Unabhängiger Bibliotheksfall'};
    return {grade:'',task:'',goal:'',baseline:'',label:'Neutrale Vorlage mit Platzhaltern'};
  }
  function librarySource(){return JSON.stringify(libraryContext());}
  function updateLibraryContext(){const l=state.library;$('libraryMode').value=l.mode;$('libraryOwn').hidden=l.mode!=='own';$('libraryContext').textContent='Aktueller Kontext: '+libraryContext().label;$('trialContextSummary').textContent='Aktueller Kontext für die Erprobung: '+libraryContext().label;all('[data-library]').forEach(el=>el.value=l[el.dataset.library]||'');all('.library-warning').forEach(el=>{const draft=l.drafts[el.dataset.format];el.textContent=draft&&draft.source!==librarySource()?'Kontext geändert: Dieser Prompt und seine Erprobung gehören noch zum früheren Fall. Zum Wechsel bewusst neu befüllen; vorhandene Ergebnisse werden dabei getrennt archiviert.':'Fallangaben und alle Platzhalter vor dem Kopieren prüfen. Ein KI-Ergebnis bleibt bis zu Ihrer Prüfung ein Entwurf.';});}
  async function trialContext(kind) {
    if(kind==='builder') {
      if(!build()){announce('Bitte zuerst in Handout 2 einen Förderentwurf anlegen oder die fiktive Beispielauswertung wählen.');return;}
      state.library.mode='builder';
    } else {
      const sample=window.HANDOUT_TRIAL_EXAMPLE;
      if(!sample){announce('Die Beispielauswertung ist nicht verfügbar. Bitte die Seite vollständig neu laden.');return;}
      if(!await ask('Die fiktive Bruchauswertung als Bibliothekskontext verwenden? Eigene Kontextfelder bleiben gespeichert. Bereits bearbeitete Prompts und Ergebnisse werden nicht überschrieben.'))return;
      state.library.mode='sample';
    }
    $('libraryFilter').value='examples';$('promptSearch').value='';updateLibraryContext();filterLibrary();save();go('bibliothek',true);
    announce('Ausgangslage für die Erprobung gewählt. Öffnen Sie ein Format. Bereits bearbeitete Prompts bei Bedarf bewusst neu befüllen.');
  }
  function exampleMarkup(f) {
    if(!f.example)return '';
    const e=f.example;
    return `<details class="format-example"><summary>Konkretes Beispiel zur Bruchaddition</summary><dl><dt>Ausgangslage und Zweck</dt><dd>${esc(e.context)}</dd><dt>Aufgabe beziehungsweise Impuls</dt><dd>${esc(e.task)}</dd></dl><details class="example-solution"><summary>Lösung und didaktische Prüfung</summary><dl><dt>Lösung beziehungsweise erwartbare Antwort</dt><dd>${esc(e.solution)}</dd><dt>Beobachtungskriterium</dt><dd>${esc(e.criterion)}</dd><dt>Was daraus noch nicht folgt</dt><dd>${esc(e.limit)}</dd></dl></details><p class="field-hint">Dieses feste Beispiel dient der Orientierung. Der folgende Prompt verwendet den oben gewählten Kontext, nicht automatisch den Beispielfall.</p></details>`;
  }
  function renderVariantRoutes() {
    const sources=window.HANDOUT_VARIANT_SOURCES||[];
    $('variantRoutes').innerHTML=(window.HANDOUT_VARIANT_ROUTES||[]).map(route=>`<details class="variant-route"><summary><span class="route-phase">${esc(route.phase)}</span>${esc(route.title)}</summary><div class="route-detail"><p><strong>Wann passend?</strong> ${esc(route.condition)}</p><p><strong>Didaktischer Zweck:</strong> ${esc(route.purpose)}</p>${route.examples.map(e=>`<section class="route-example"><h4>${esc(e.title)}</h4><p class="preserve-lines">${esc(e.task)}</p><details><summary>Lösung, Beobachtung und Grenze</summary><p><strong>Fachliche Lösung:</strong> ${esc(e.solution)}</p><p><strong>Worauf achten?</strong> ${esc(e.criterion)}</p><p><strong>Was daraus noch nicht folgt:</strong> ${esc(e.limit)}</p></details></section>`).join('')}<p class="field-hint">Passende Prompts für Ihren ausgewählten Kontext – das Beispiel oben wird nicht übernommen:</p><div class="button-row">${route.formats.map(id=>{const f=library.find(item=>item.id===id);return f?`<button class="button" type="button" data-open-format="${esc(id)}">${esc(f.title)}</button>`:'';}).join('')}</div><p class="route-reference">Prinzipien: ${route.sources.map(i=>`<a href="${esc(sources[i].url)}" target="_blank" rel="noopener noreferrer">${esc(sources[i].title)}</a>`).join(' · ')}</p></div></details>`).join('');
    $('variantSources').innerHTML=sources.map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></p>`).join('');
    $('moreExamples').innerHTML=(window.HANDOUT_MORE_EXAMPLES||[]).map(e=>`<details class="route-example"><summary>${esc(e.title)}</summary><p>${esc(e.condition)}</p><p>${esc(e.task)}</p><details><summary>Lösung, Beobachtung und Grenze</summary><p><strong>Lösung:</strong> ${esc(e.solution)}</p><p><strong>Beobachtungskriterium:</strong> ${esc(e.criterion)}</p><p><strong>Grenze:</strong> ${esc(e.limit)}</p></details><div class="button-row">${e.formats.map(id=>`<button class="button" type="button" data-open-format="${esc(id)}">${esc(lookupFormat(id)?.title||id)}</button>`).join('')}</div><p class="route-reference">Grundlage: ${e.sources.map(i=>`<a href="${esc(sources[i].url)}" target="_blank" rel="noopener noreferrer">${esc(sources[i].title)}</a>`).join(' · ')}</p></details>`).join('');
  }
  function openFormat(id) {
    const item=all('.prompt-item').find(el=>el.dataset.format===id);if(!item)return;
    $('libraryFilter').value='all';$('promptSearch').value='';filterLibrary();
    item.open=true;ensureLibrary(id);item.querySelector('summary').focus();item.scrollIntoView({block:'start',behavior:'smooth'});
    announce('Format geöffnet. Der Prompt verwendet den gewählten Kontext; ein bereits bearbeiteter Prompt bleibt erhalten.');
  }
  function renderLibrary() {
    $('promptList').innerHTML=library.map((f,i)=>`<details class="prompt-item" data-format="${esc(f.id)}" data-category="${i<formats.length?f.category:'extra'}"><summary>${String(i+1).padStart(2,'0')} · ${esc(f.title)}${f.example?' · mit Aufgabenbeispiel':''}</summary><div class="prompt-detail"><dl><dt>Didaktischer Zweck</dt><dd>${esc(f.purpose)}</dd><dt>Geeigneter Einsatz</dt><dd>${esc(f.when)}</dd><dt>Gewünschte Ausgabe</dt><dd>${esc(f.output)}</dd><dt>Fachliche Prüffrage</dt><dd>${esc(f.check)}</dd></dl>${exampleMarkup(f)}<label for="library-${esc(f.id)}">Bearbeitbarer Prompt</label><textarea id="library-${esc(f.id)}" data-library-prompt="${esc(f.id)}"></textarea><p class="library-warning context-alert" data-format="${esc(f.id)}"></p><div class="button-row"><button class="button" type="button" data-refill="${esc(f.id)}">Mit aktuellem Kontext neu befüllen</button><button class="button primary" type="button" data-copy="library-${esc(f.id)}">Prompt kopieren</button></div><p>Den angezeigten Prompt prüfen, bei Bedarf ändern und in ein freigegebenes KI-System kopieren. Dort absenden und die Antwort fachlich prüfen. Wenn Sie hier dokumentieren möchten, den Entwurf unten einfügen und Ihre Prüfung festhalten. Ein eigenes Dokument oder eine eigene Ausarbeitung ohne KI ist ebenso möglich.</p><div class="trial-inputs"><label for="trial-result-${esc(f.id)}">KI-Ergebnis oder eigene Ausarbeitung · ${esc(f.title)}</label><textarea id="trial-result-${esc(f.id)}" data-library-result="${esc(f.id)}" class="library-result" placeholder="Aufgaben, Darstellungen oder Hinweise einfügen. Noch ungeprüfte Aussagen als Entwurf behandeln."></textarea><label for="trial-notes-${esc(f.id)}">Meine fachliche Prüfung und Anpassungen · ${esc(f.title)}</label><textarea id="trial-notes-${esc(f.id)}" data-library-notes="${esc(f.id)}" placeholder="Was passt zum Ziel? Welche Rechnung, Darstellung oder Hilfe muss geändert werden?"></textarea></div><div class="button-row"><button class="button" type="button" data-print-format="${esc(f.id)}">Prompt und Erprobung drucken</button></div></div></details>`).join('');
    all('.prompt-item').forEach(item=>item.addEventListener('toggle',()=>{if(item.open)ensureLibrary(item.dataset.format);syncPrintPage();}));
    all('[data-library-prompt]').forEach(el=>{const d=state.library.drafts[el.dataset.libraryPrompt];if(d)el.value=d.text;});
    all('[data-library-result]').forEach(el=>el.value=state.library.drafts[el.dataset.libraryResult]?.result||'');
    all('[data-library-notes]').forEach(el=>el.value=state.library.drafts[el.dataset.libraryNotes]?.notes||'');
    filterLibrary();updateLibraryContext();renderImportedLibraries();installPromptTools();
  }
  async function ensureLibrary(id,force=false) {
    const f=lookupFormat(id);if(!f)return;
    if(force&&state.library.drafts[id]&&!await ask('Diesen Prompt aus dem aktuellen Kontext neu erzeugen? Eigene Promptänderungen werden ersetzt. Ergebnisse und Anmerkungen bleiben bei gleichem Kontext erhalten; bei einem neuen Kontext werden sie vorher getrennt archiviert.'))return;
    if(!state.library.drafts[id]||force){try{state=C.refillLibraryDraft(state,id,C.fillTemplate(f.prompt,libraryContext()),librarySource());save();}catch(error){announce('Neu befüllen nicht möglich: '+error.message);return;}}
    $('library-'+id).value=state.library.drafts[id].text;$('trial-result-'+id).value=state.library.drafts[id].result||'';$('trial-notes-'+id).value=state.library.drafts[id].notes||'';updateLibraryContext();renderImportedLibraries();
    resizeOpenPrompts();
  }
  function filterLibrary() {
    const q=$('promptSearch').value.toLocaleLowerCase('de').trim(),filter=$('libraryFilter').value;let count=0;
    all('.prompt-item').forEach(item=>{const f=library.find(x=>x.id===item.dataset.format);item.hidden=!(filter==='all'||item.dataset.category===filter||(filter==='examples'&&f.example))||!JSON.stringify(f).toLocaleLowerCase('de').includes(q);if(!item.hidden)count++;});
    $('libraryCount').textContent=count+' von '+library.length+' Angeboten · 22 Aufgabenformate und 6 Ergänzungen';syncPrintPage();
  }
  function renderImportedLibraries(){const saved=state.importedLibraries||[];$('importedLibraries').hidden=!saved.length;$('importedLibraryList').innerHTML=saved.map((l,i)=>`<details><summary>Gesicherter Bibliotheksstand ${i+1}</summary>${Object.entries(l.drafts||{}).map(([id,d])=>`<label>${esc(lookupFormat(id)?.title||id)} · gespeicherter Prompt<textarea readonly>${esc(d.text)}</textarea></label>${d.result?`<label>Gespeichertes Ergebnis<textarea readonly>${esc(d.result)}</textarea></label>`:''}${d.notes?`<label>Gespeicherte Prüfung und Anmerkungen<textarea readonly>${esc(d.notes)}</textarea></label>`:''}`).join('')||'<p>Keine bearbeiteten Vorlagen in dieser Sicherung.</p>'}</details>`).join('');}
  async function copy(id) {
    const el=$(id);if(!el?.value.trim()){announce('Bitte zuerst den Prompt erzeugen oder Text eintragen.');return;}
    let stale=id==='diagnosisPrompt'?diag().promptSource!==diagSource():id==='builderPrompt'?build()?.promptSource!==buildSource():id==='goalPrompt'?build()?.goalPromptSource!==goalSource():id==='hypothesisPrompt'?build()?.hypothesisPromptSource!==hypothesisSource():id==='formatIdeasPrompt'?build()?.formatIdeasPromptSource!==formatIdeasSource():false;
    if(id.startsWith('library-'))stale=state.library.drafts[id.slice(8)]?.source!==librarySource();
    if(stale&&!await ask('Dieser Prompt stammt noch aus einem früheren Kontext. Trotzdem genau diesen Text kopieren? Mit Abbrechen können Sie ihn zuerst neu befüllen.'))return;
    if(/\[[^\]\n]+\]|\{\{[^}]+\}\}/.test(el.value)&&!await ask('Der Prompt enthält noch Platzhalter in Klammern. Trotzdem als Vorlage kopieren? Ersetzen Sie diese vor der Verwendung.'))return;
    try {if(!navigator.clipboard?.writeText)throw new Error('clipboard');await navigator.clipboard.writeText(el.value);announce('Prompt kopiert. Jetzt in einem freigegebenen KI-System einfügen und dort absenden. Anschließend die Antwort prüfen.');}
    catch {$('fallbackText').value=el.value;$('copyFallback').showModal();$('fallbackText').focus();$('fallbackText').select();}
  }
  function download(filename,text,type='text/plain;charset=utf-8') {const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function exportAll(){save();try{const output=JSON.parse(JSON.stringify(state));if(recoveryRaw)output.recoveryRaw=recoveryRaw;const text=C.serializeBackup(output);download('Mathematik-Handouts-Arbeitsstaende.json',text,'application/json');announce('Dateisicherung erstellt. Sie enthält Ihre lokalen Eingaben – nicht öffentlich weitergeben.');}catch(error){announce('Keine Dateisicherung erstellt: '+error.message+' Ihre Arbeitsstände wurden nicht entfernt.');}}
  async function importFile(file) {
    if(!file)return;if(file.size>C.MAX_BACKUP_BYTES){announce('Datei ist größer als 10 MB. Import nicht ausgeführt.');return;}
    try {const data=C.validate(JSON.parse(await file.text()));const merged=C.mergeImport(state,data);if(!await ask(`${data.diagnostics.length} Fälle und ${data.builders.length} Förderentwürfe zusätzlich importieren? Bestehende Arbeitsstände bleiben erhalten.`))return;state=merged;save();renderDiag();renderBuilder();renderLibrary();announce('Arbeitsstände übernommen. Vorhandene Bearbeitungen bleiben erhalten. Bibliotheksstände finden Sie in Handout 3.');}
    catch(error){announce('Import nicht möglich: '+error.message+' Vorhandene Daten bleiben unverändert.');}
    finally{$('importFile').value='';}
  }
  const entry=(name,value)=>`${name}\n${value||'—'}\n`;
  function diagText(){const d=diag();return 'HANDOUT 1 – HYPOTHESENBILDUNG · PRAXISPHASE 1\n\n'+[['Fall',d.title],['Klasse / Stufe',d.grade],['Aufgabe',d.task],['Vorliegende Lösung',d.solution],['Weitere bekannte Informationen',d.known],['Aufgabenziel',d.goal],['Beobachtung',d.observation],['Hypothese 1',d.hypothesis1],['Hypothese 2',d.hypothesis2],['Ausgewählte Prüffrage oder Kontrastaufgabe',d.check],['Offene Informationen',d.missing]].map(x=>entry(...x)).join('\n')+'\nOhne weitere tatsächliche Antwort bleibt die Hypothese offen.';}
  function builderText(){const b=build();if(!b)return '';return 'HANDOUT 2 – FÖRDERBAUSTEIN ENTWICKELN · PRAXISPHASE 2\n\n'+entry('Entwurf',b.title)+'\n'+C.contextForBuilder(b)+'\n\n'+[['Gewählte Vorgehensweise',b.format==='custom'?b.customFormat:formats.find(f=>f.id===b.format)?.title],['Weitere eigene Idee / Wunsch, nicht automatisch ausgewählt',b.format!=='custom'?b.customFormat:''],['Ideenprompt',b.formatIdeasPrompt],['Vorschläge zum Vergleichen, noch keine Auswahl',b.formatIdeasResult],['KI-Entwurf oder eigene Ausarbeitung',b.draft],['Meine Anpassungen',b.adjustments],['Überarbeitete Fassung',b.final],['Fachliche Prüfung',checks.map((v,i)=>(b.checks?.includes(String(i))?'☑ ':'☐ ')+v).join('\n')],['Einsatz',b.use],['Erfolgskontrolle ohne KI',b.success]].map(x=>entry(...x)).join('\n');}
  function preparePrint(kind,id) {
    let title='',text='';if(kind==='diagnostic'){title='Handout 1 · Hypothesenbildung';text=diagText();}else if(kind==='builder'){title='Handout 2 · Förderbaustein entwickeln';text=build()?builderText():'Noch kein Förderentwurf angelegt. Bitte einen Fall übernehmen oder einen neuen Entwurf beginnen.';}else {const f=lookupFormat(id);if(!f)return false;const d=state.library.drafts[id];title='Handout 3 · Tool- und Promptbibliothek';text=f.title+'\n\n'+entry('Zweck',f.purpose)+entry('Einsatz',f.when)+entry('Erwartete Ausgabe',f.output)+entry('Prüffrage',f.check)+'\n'+(d?.text??C.fillTemplate(f.prompt,libraryContext()))+'\n\n'+entry('KI-Ergebnis oder eigene Ausarbeitung – Prüfung unten dokumentieren',d?.result)+entry('Meine fachliche Prüfung und Anpassungen',d?.notes);}
    $('printSummary').innerHTML=`<h1>${esc(title)}</h1><div class="print-preserve">${esc(text)}</div>`;
    if(kind==='builder'&&build()){const b=build();$('printSummary').innerHTML+=`<section class="print-material"><h1>Handout 2 · Material zum Weiterarbeiten</h1><h2>KI-Entwurf oder eigene Ausarbeitung · Prüfung dokumentieren</h2><div class="print-preserve">${esc(b.draft||'Kein Entwurf eingetragen.')}</div><h2>Überarbeitete Fassung</h2><div class="print-preserve">${esc(b.final||'Noch keine überarbeitete Fassung eingetragen. Der Entwurf ist nicht automatisch einsatzbereit.')}</div></section>`;}
    return true;
  }
  async function print(kind,id) {if(await preparePrint(kind,id))window.print();}
  // Keep print content ready before the print dialog opens (also for WebKit Cmd+P).
  // Building a large print DOM only in beforeprint can produce incorrect pagination.
  function syncPrintPage() {
    const page=C.ALIASES[location.hash.slice(1)]||location.hash.slice(1);
    if(page==='foerderbaustein')preparePrint('builder');
    else if(page==='bibliothek') {
      const open=all('.prompt-item[open]').find(x=>!x.hidden);
      if($('freeIdeasPanel').open)preparePrint('library',freeIdeas.id);
      else if(open)preparePrint('library',open.dataset.format);
      else $('printSummary').innerHTML='<h1>Handout 3 · Tool- und Promptbibliothek</h1><p>Bitte eine Vorlage öffnen und dort „Vorlage drucken“ wählen.</p>';
    } else if(diag())preparePrint('diagnostic');
  }
  function go(hash,focus=false) {let target=C.ALIASES[hash]||hash;if(!['hypothesen','foerderbaustein','bibliothek'].includes(target))target='hypothesen';all('.station-panel').forEach(el=>{el.hidden=el.id!==target;el.classList.toggle('active',el.id===target);});all('[data-nav]').forEach(el=>{el.classList.toggle('active',el.dataset.nav===target);if(el.dataset.nav===target)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});history.replaceState(null,'','#'+target);syncPrintPage();if(focus){$(target+'-title').focus({preventScroll:true});$(target).scrollIntoView({behavior:'smooth'});} }
  load();
  $('caseChoice').innerHTML=C.cases.map(c=>option(c.id,`Klasse ${c.grade} · ${c.title}`)).join('');
  $('builderCaseChoice').insertAdjacentHTML('beforeend',C.cases.map(c=>option(c.id,`Fiktives Beispiel · ${c.title}`)).join(''));
  all('[data-diag]').forEach(el=>el.addEventListener('input',()=>{diag()[el.dataset.diag]=el.value;save();promptStatus();if(el.dataset.diag==='title')selectors();updateLibraryContext();}));
  all('[data-build]').forEach(el=>el.addEventListener('input',()=>{const b=build();if(!b)return;b[el.dataset.build]=el.value;if(el.dataset.build==='focus'){if(b.format!=='custom'&&b.focus!=='all'&&!formats.some(f=>f.id===b.format&&f.category===b.focus))b.format='';renderFormat();}if(el.dataset.build==='format')renderFormat();if(el.dataset.build==='evidenceStatus')evidenceVisibility();if(el.dataset.build==='title')selectors();save();promptStatus();updateLibraryContext();}));
  $('builderChecks').addEventListener('change',()=>{build().checks=all('[data-check]:checked').map(x=>x.dataset.check);save();});
  $('diagnosticSelect').addEventListener('change',e=>{state.activeDiagnosticId=e.target.value;save();renderDiag();});
  $('builderSelect').addEventListener('change',e=>{state.activeBuilderId=e.target.value;save();renderBuilder();});
  function newDiagnostic(item){if(state.diagnostics.length>=500){announce('Grenze von 500 Fällen erreicht. Bitte vorhandene Fälle nutzen und als Datei sichern.');return;}const d=C.diagnostic(item);state.diagnostics.push(d);state.activeDiagnosticId=d.id;save();renderDiag();$('diag-title').focus();announce('Neuer Fall angelegt; bisherige Fälle bleiben erhalten.');}
  $('addPrepared').addEventListener('click',()=>newDiagnostic(C.cases.find(x=>x.id===$('caseChoice').value)));
  $('addOwn').addEventListener('click',()=>newDiagnostic());
  $('transferDiagnostic').addEventListener('click',()=>transfer(state.activeDiagnosticId));
  $('transferSelected').addEventListener('click',()=>transfer($('transferSelect').value));
  $('newBuilder').addEventListener('click',()=>{const c=C.cases.find(x=>x.id===$('builderCaseChoice').value);addBuilder(c);});
  $('builderCaseChoice').addEventListener('change',updateBuilderEntry);
  $('generateGoal').addEventListener('click',regenerateGoal);
  $('generateHypotheses').addEventListener('click',regenerateHypotheses);
  $('generateFormatIdeas').addEventListener('click',regenerateFormatIdeas);
  $('chooseCustomFormat').addEventListener('click',chooseCustomFormat);
  $('generateFreeIdeas').addEventListener('click',()=>ensureLibrary(freeIdeas.id,true));
  $('freeIdeasPanel').addEventListener('toggle',syncPrintPage);
  $('applyGoal').addEventListener('click',applyGoal);
  $('exploreVariants').addEventListener('click',()=>trialContext('builder'));
  $('trialFromBuilder').addEventListener('click',()=>trialContext('builder'));
  $('trialFromExample').addEventListener('click',()=>trialContext('sample'));
  $('generateDiagnosis').addEventListener('click',()=>regenerate('diagnostic'));
  $('generateBuilder').addEventListener('click',()=>regenerate('builder'));
  $('saveAll').addEventListener('click',()=>save(true));$('exportAll').addEventListener('click',exportAll);
  $('importFile').addEventListener('change',e=>importFile(e.target.files[0]));
  $('downloadBuilder').addEventListener('click',()=>{if(!build())return;download('Handout-2-Foerderbaustein.txt',builderText()+'\n\nMATERIAL ZUM WEITERARBEITEN\n\n'+entry('KI-Rohentwurf',build().draft)+entry('Überarbeitete Fassung',build().final));});
  $('recoverLegacy').addEventListener('click',async()=>{try {if(state.builders.length>=500){announce('Grenze von 500 Förderentwürfen erreicht.');return;}const old=localStorage.getItem(C.LEGACY_KEY);const migrated=C.migrateLegacy(old);if(!await ask('Alten Förderbaustein zusätzlich übernehmen? Der aktuelle Stand und der Originalspeicher bleiben bestehen.'))return;const b=migrated.builders[0];state.builders.push(b);state.activeBuilderId=b.id;save();renderBuilder();go('foerderbaustein',true);}catch{announce('Alter Stand nicht lesbar. Es wurde nichts überschrieben.');}});
  $('libraryMode').addEventListener('change',e=>{state.library.mode=e.target.value;save();updateLibraryContext();});
  all('[data-library]').forEach(el=>el.addEventListener('input',()=>{state.library[el.dataset.library]=el.value;save();updateLibraryContext();}));
  function saveLibraryInput(e){const el=e.target,id=el.dataset.libraryPrompt||el.dataset.libraryResult||el.dataset.libraryNotes;if(!id)return;const key=el.dataset.libraryPrompt?'text':el.dataset.libraryResult?'result':'notes';const d=state.library.drafts[id]||{text:$('library-'+id).value,source:librarySource()};d[key]=el.value;state.library.drafts[id]=d;save();updateLibraryContext();}
  $('promptList').addEventListener('input',saveLibraryInput);
  $('freeIdeasPanel').addEventListener('input',saveLibraryInput);
  $('promptSearch').addEventListener('input',filterLibrary);$('libraryFilter').addEventListener('change',filterLibrary);
  $('variantRoutes').addEventListener('click',e=>{const button=e.target.closest('[data-open-format]');if(button)openFormat(button.dataset.openFormat);});
  $('moreExamples').addEventListener('click',e=>{const button=e.target.closest('[data-open-format]');if(button)openFormat(button.dataset.openFormat);});
  document.addEventListener('click',e=>{const a=e.target.closest('[data-nav]');if(a){e.preventDefault();go(a.dataset.nav,true);}const c=e.target.closest('[data-copy]');if(c)copy(c.dataset.copy);const r=e.target.closest('[data-refill]');if(r)ensureLibrary(r.dataset.refill,true);const p=e.target.closest('[data-print]');if(p)print(p.dataset.print);const pf=e.target.closest('[data-print-format]');if(pf)print('library',pf.dataset.printFormat);});
  $('closeFallback').addEventListener('click',()=>$('copyFallback').close());
  document.addEventListener('click',e=>{const toggle=e.target.closest('[data-expand-prompt]');if(toggle){const el=$(toggle.dataset.expandPrompt),expanded=el.dataset.expanded!=='true';el.dataset.expanded=String(expanded);toggle.setAttribute('aria-expanded',String(expanded));toggle.textContent=expanded?'Kompakte Promptansicht':'Vollständigen Prompt anzeigen';if(expanded)resizeOpenPrompts();else el.style.height='';}const output=e.target.closest('[data-save-prompt]');if(output){const el=$(output.dataset.savePrompt);if(!el.value.trim()){announce('Bitte zunächst einen Prompt erzeugen oder eintragen.');return;}download('Mathematik-'+el.id+'-Prompt.txt',el.value);announce('Der angezeigte Prompt wurde als Textdatei gespeichert. Vor der nächsten Verwendung Fallangaben und Platzhalter anpassen.');}});
  document.addEventListener('input',e=>{if(e.target.matches(promptSelector))resizeOpenPrompts();});
  window.addEventListener('hashchange',()=>go(location.hash.slice(1),true));
  window.addEventListener('storage',e=>{if(e.key===C.KEY&&e.newValue!==lastSaved){storageBlocked=true;notice('Ein anderes Fenster hat die Arbeitsstände geändert. Zum Schutz Ihrer Eingaben bitte diese Sitzung als Datei sichern, neu laden und die Datei zusätzlich importieren.');save();}});
  window.addEventListener('beforeunload',e=>{if(storageBlocked){e.preventDefault();e.returnValue='';}});
  window.addEventListener('beforeprint',()=>{if(!$('printSummary').textContent.trim())syncPrintPage();});
  window.addEventListener('afterprint',syncPrintPage);
  const discussions=[
    'Bei 15 − 7 = 12 ist nur die notierte Gleichung sicher sichtbar. Eine mögliche Erklärung wäre, dass 7 − 5 gerechnet und die Zehnerziffer beibehalten wurde. Lassen Sie den Rechenweg beschreiben oder 15 − 7 mit Material zeigen; auch ein Versehen bleibt möglich.',
    'Bei sechzehn → 61 könnten Zahlwortreihenfolge und Stellenwertzuordnung verwechselt worden sein. Lassen Sie sechzehn mit Zehnern und Einern legen und der Schreibweise zuordnen. Erst dann lässt sich die Vermutung besser beurteilen.',
    '503 − 78 = 575 passt zur Vermutung, dass stellenweise die kleinere von der größeren Ziffer abgezogen wird. Prüfen Sie das Entbündeln beispielsweise an einer Materialdarstellung und einer passend variierten Aufgabe.',
    '6 · 7 = 13 passt zur Addition 6 + 7. Ob das Zeichen verwechselt wurde oder die Operationsbedeutung unklar ist, bleibt offen. Lassen Sie sechs Gruppen mit je sieben Elementen darstellen und mit dem Term verbinden.',
    'Bei 1/2 + 1/3 = 2/5 ist das Ergebnis sichtbar; eine getrennte Addition von Zählern und Nennern ist eine mögliche Deutung. Prüfen Sie gleich große Teile desselben Ganzen, etwa an Bruchstreifen. Fragen Sie auch, ob die Summe kleiner als 1/2 sein kann.',
    '3,5 + 12 = 4,7 passt zur Vermutung, dass 12 wie 1,2 verarbeitet wurde. Prüfen Sie die Zuordnung von Einern und Zehnteln und lassen Sie eine stellenwertgerechte Darstellung erklären. Der Einzelfehler allein entscheidet nicht zwischen Versehen und Verständnisproblem.'
  ];
  $('caseDiscussion').innerHTML=C.cases.map((c,i)=>`<h3>${esc(c.title)}</h3><p>${esc(discussions[i])}</p>`).join('');
  renderDiag();renderBuilder();renderLibrary();renderVariantRoutes();updateBuilderEntry();go(location.hash.slice(1));save();
})();
