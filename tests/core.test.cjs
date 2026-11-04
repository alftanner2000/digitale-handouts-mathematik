'use strict';

// Run: node --test tests/core.test.cjs
// Pure data/prompt and static HTML checks. No browser, storage, network or writes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'handouts-core.js'));
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const sandbox = {window: {}};
vm.runInNewContext(read('library-data.js'), sandbox, {filename: 'library-data.js', timeout: 1000});
const formats = clone(sandbox.window.HANDOUT_FORMATS);
const extras = clone(sandbox.window.HANDOUT_EXTRAS);
const html = read('index.html');
const unicode = 'Äußere Größe: ½ + ⅓ = ⅚\n„Zähler“, € 3,50, <Bild> & Erklärung\nZweite Zeile – ohne Namen.';

function populatedDiagnostic() {
  const d = C.diagnostic(C.cases[4]);
  Object.assign(d, {
    title: 'Fiktiver Bruchfall', known: unicode,
    observation: 'Notiert wurde 2/5.\nKein weiterer Denkweg liegt vor.',
    hypothesis1: 'Möglicherweise werden die beiden Nenner addiert.',
    hypothesis2: 'Möglicherweise wurde eine Regel verwechselt.',
    check: 'Zeige 1/2 und 1/3 an gleich langen Streifen.',
    missing: 'Die Antwort auf die Prüffrage liegt noch nicht vor.'
  });
  return d;
}

function stateWithCount(kind, count) {
  const s = C.empty();
  s[kind] = Array.from({length: count}, () => kind === 'diagnostics' ? C.diagnostic() : C.builder());
  if (kind === 'diagnostics') s.activeDiagnosticId = s.diagnostics[0]?.id || '';
  else s.activeBuilderId = s.builders[0]?.id || '';
  return s;
}

test('six distinct prepared cases, including fifth case Bruchaddition', () => {
  assert.equal(C.cases.length, 6);
  assert.equal(new Set(C.cases.map(x => x.id)).size, 6);
  assert.equal(C.cases[4].id, 'brueche');
  assert.equal(C.cases[4].grade, '6');
  assert.equal(C.cases[4].task, '1/2 + 1/3 = ?');
  assert.equal(C.cases[4].solution, '1/2 + 1/3 = 2/5');
  for (const item of C.cases) for (const key of ['title', 'task', 'solution', 'goal']) assert.ok(item[key].trim());
});

test('new independent cases receive distinct IDs and remain independent', () => {
  const first = C.diagnostic();
  const second = C.diagnostic();
  assert.notEqual(first.id, second.id);
  first.observation = unicode;
  assert.equal(second.observation, '');
  assert.equal(second.task, '');
  assert.equal(C.builder().task, '');
});

test('Unicode, fractions, quotes and line breaks survive JSON and prompt generation', () => {
  const state = C.empty();
  const d = populatedDiagnostic();
  d.solution = unicode;
  state.diagnostics = [d];
  state.activeDiagnosticId = d.id;
  const restored = C.validate(clone(state));
  assert.equal(restored.diagnostics[0].solution, unicode);
  assert.equal(restored.diagnostics[0].known, unicode);
  assert.ok(C.diagnosticPrompt(restored.diagnostics[0]).includes(unicode));
});

test('H1 prompt explicitly limits hypotheses and excludes all promotion products', () => {
  const p = C.diagnosticPrompt(populatedDiagnostic());
  assert.match(p, /höchstens zwei/);
  assert.match(p, /ausdrücklich als hypothetisch/);
  assert.match(p, /keine gesicherte Diagnose/);
  assert.match(p, /keine Förderübungen, keinen Förderplan und keine Unterrichtsreihe/);
  assert.match(p, /wissenschaftliche Kompetenzzuordnung ist keine Voraussetzung/);
  assert.equal((p.match(/^HYPOTHESE 1$/gm) || []).length, 1);
  assert.equal((p.match(/^HYPOTHESE 2/gm) || []).length, 1);
  assert.doesNotMatch(p, /^HYPOTHESE [3-9]/m);
  for (const label of ['AUFGABENZIEL', 'BEOBACHTUNG', 'AUSGEWÄHLTE PRÜFFRAGE ODER KONTRASTAUFGABE', 'OFFENE INFORMATIONEN']) assert.ok(p.includes(label));
});

test('H2 works independently and keeps the common outcome contract', () => {
  const b = C.builder();
  Object.assign(b, {grade: '6', task: '1/2 + 1/3', goal: 'Gleich große Teile am Streifen begründen.', evidenceStatus: 'assumed', assumption: 'Ungleich große Teile werden noch zusammengezählt.', format: formats[0].id});
  const p = C.builderPrompt(b, formats[0]);
  for (const phrase of ['genau ein Förderziel', 'drei bis fünf', 'gestufte Hilfe', 'Erfolgskontrolle ohne KI', 'Lösungen', 'beobachtbare Kriterien', 'Unter der Annahme']) assert.ok(p.includes(phrase), phrase);
  assert.ok(p.includes(formats[0].title));
  assert.doesNotMatch(p, /\{\{(?:klasse|aufgabe|ziel|ausgangslage)\}\}/);
  assert.match(p, /belegt weder die Diagnose noch eine Lernwirkung/);
});

test('H1 transfer preserves known observations and keeps hypotheses open', () => {
  const d = populatedDiagnostic();
  const before = clone(d);
  const b = C.builder(d);
  const context = C.contextForBuilder(b);
  assert.notEqual(b.id, d.id);
  assert.equal(b.evidenceStatus, 'open');
  assert.equal(b.evidence, '');
  for (const value of [d.task, d.solution, d.observation, d.known, d.goal, d.hypothesis1, d.hypothesis2, d.check, d.missing]) assert.ok(context.includes(value), value);
  assert.match(context, /Ausgangslage noch ungeklärt/);
  assert.deepEqual(d, before);
});

test('observed, assumed and open planning conditions remain distinct', () => {
  const b = C.builder();
  b.assumption = 'ANNAHME: Teilgrößen werden nicht unterschieden.';
  b.evidence = 'BEOBACHTUNG: Das Kind zeichnet unterschiedlich große Hälften.';
  b.evidenceStatus = 'assumed';
  let context = C.contextForBuilder(b);
  assert.ok(context.includes(b.assumption));
  assert.match(context, /Nicht als tatsächliche Kinderantwort ausgeben/);
  assert.ok(!context.includes(b.evidence));
  b.evidenceStatus = 'observed';
  context = C.contextForBuilder(b);
  assert.ok(context.includes(b.evidence));
  assert.ok(!context.includes(b.assumption));
  assert.match(context, /keine pauschale Diagnose/);
  b.evidenceStatus = 'open';
  b.assumption = '';
  context = C.contextForBuilder(b);
  assert.match(context, /noch ungeklärt/);
  assert.match(context, /noch festzulegen/);
  assert.match(context, /Erfinde keine Bestätigung/);
});

test('legacy migration retains mapped fields, both goals and every unmapped original field', () => {
  const mapping = {buildClass: 'grade', buildTopic: 'topic', buildObservation: 'observation', buildTaskGoal: 'taskGoal', buildError: 'hypotheses', buildConception: 'conception', buildDraft: 'draft', buildAdjustments: 'adjustments', buildFinal: 'final', buildUse: 'use', buildSuccess: 'success'};
  const old = Object.fromEntries(Object.keys(mapping).map(key => [key, key + '\n' + unicode]));
  Object.assign(old, {buildGoal1: 'Ziel 1\nErste Begründung', buildGoal2: 'Ziel 2', 'module-explanation': true, 'module-text-explanation': 'Bearbeiteter Alt-Prompt\n' + unicode, unknownOldField: {preserve: ['ja', false]}});
  const raw = JSON.stringify(old);
  const migrated = C.migrateLegacy(raw);
  const b = migrated.builders[0];
  C.validate(migrated);
  for (const [oldKey, newKey] of Object.entries(mapping)) assert.equal(b[newKey], old[oldKey]);
  assert.equal(b.goal, old.buildGoal1 + '\n' + old.buildGoal2);
  assert.deepEqual(b.legacyOriginal, old);
  assert.deepEqual(migrated.legacy.original, old);
  assert.equal(migrated.legacy.migratedFrom, C.LEGACY_KEY);
  assert.equal(migrated.activeBuilderId, b.id);
  assert.equal(raw, JSON.stringify(old));
});

test('unsupported or damaged legacy data fail explicitly', () => {
  for (const raw of ['not JSON', 'null', '[]', '{}', '{"unrelated":"value"}']) assert.throws(() => C.migrateLegacy(raw), raw);
});

test('invalid root state, versions, field types and duplicate IDs are rejected', () => {
  for (const value of [null, [], {}, {...C.empty(), version: 1}, {...C.empty(), version: 3}, {...C.empty(), library: []}]) assert.throws(() => C.validate(value));
  const mutations = [
    s => {s.diagnostics = {};},
    s => {s.builders = null;},
    s => {s.diagnostics[0].task = 42;},
    s => {s.diagnostics.push(clone(s.diagnostics[0]));},
    s => {const b = C.builder(); b.id = s.diagnostics[0].id; s.builders.push(b);},
    s => {const b = C.builder(); b.checks = [true]; s.builders.push(b);},
    s => {s.library.drafts = [];},
    s => {s.library.mode = 'unknown';},
    s => {s.library.drafts = {example: {text: 12, source: 'x'}};},
    s => {s.library.drafts = JSON.parse('{"__proto__":{"text":"x","source":"y"}}');}
  ];
  for (const mutate of mutations) {const s = C.empty(); mutate(s); assert.throws(() => C.validate(s), String(mutate));}
});

test('malformed imported library archives and recovery fields are rejected recursively', () => {
  const mutations = [
    s => {s.importedLibraries = [null];},
    s => {s.importedLibraries = 'not an array';},
    s => {s.importedLibraries = [{drafts: {x: null}}];},
    s => {s.importedLibraries = [{drafts: {x: {text: 'x', source: 1}}}];},
    s => {s.importedLibraries = [{mode: 'unknown', drafts: {}}];},
    s => {s.recoveredOriginals = [null];},
    s => {s.recoveryRaw = {};},
    s => {s.legacyImports = 'not an array';}
  ];
  for (const mutate of mutations) {
    const incoming = C.empty(); mutate(incoming);
    const current = C.empty(), before = JSON.stringify(current);
    assert.throws(() => C.validate(incoming), String(mutate));
    assert.throws(() => C.mergeImport(current, incoming), String(mutate));
    assert.equal(JSON.stringify(current), before);
  }
});

test('import normalizes minimal valid entries before any UI trim calls', () => {
  const incoming = C.empty();
  incoming.diagnostics = [{id: 'minimum-diagnostic', title: 'Minimaler Fall'}];
  incoming.builders = [{id: 'minimum-builder', title: 'Minimaler Entwurf'}];
  const merged = C.mergeImport(C.empty(), incoming);
  for (const [actual, defaults] of [[merged.diagnostics.at(-1), C.diagnostic()], [merged.builders.at(-1), C.builder()]]) {
    for (const [key, value] of Object.entries(defaults)) assert.equal(typeof actual[key], typeof value, key);
    assert.doesNotThrow(() => actual.task.trim());
    assert.doesNotThrow(() => actual.goal.trim());
  }
  assert.doesNotThrow(() => C.validate(clone(merged)));
});

test('import appends cases and builders without mutating either input or overwriting existing work', () => {
  const current = C.empty(), incoming = C.empty();
  current.diagnostics[0].observation = 'Bestehende Beobachtung';
  current.builders.push(Object.assign(C.builder(), {draft: 'Vorhandener Förderentwurf'}));
  incoming.diagnostics[0].observation = unicode;
  incoming.builders.push(Object.assign(C.builder(), {draft: 'Importierter Entwurf\n' + unicode}));
  const beforeCurrent = clone(current), beforeIncoming = clone(incoming);
  const merged = C.mergeImport(current, incoming);
  assert.deepEqual(current, beforeCurrent);
  assert.deepEqual(incoming, beforeIncoming);
  assert.deepEqual(merged.diagnostics[0], current.diagnostics[0]);
  assert.deepEqual(merged.builders[0], current.builders[0]);
  assert.equal(merged.diagnostics.at(-1).observation, unicode);
  assert.equal(merged.builders.at(-1).draft, incoming.builders[0].draft);
  assert.notEqual(merged.diagnostics.at(-1).id, incoming.diagnostics[0].id);
  assert.equal(merged.activeDiagnosticId, merged.diagnostics.at(-1).id);
  assert.equal(merged.activeBuilderId, merged.builders.at(-1).id);
  assert.doesNotThrow(() => C.validate(clone(merged)));
});

test('500 cases are valid; merging past the limit fails without changing the current state', () => {
  for (const kind of ['diagnostics', 'builders']) {
    const atLimit = stateWithCount(kind, 500);
    C.validate(atLimit);
    const incoming = C.empty();
    if (kind === 'builders') incoming.builders.push(C.builder());
    const before = JSON.stringify(atLimit);
    assert.throws(() => C.mergeImport(atLimit, incoming), /500|Grenze|Entwürfe/);
    assert.equal(JSON.stringify(atLimit), before);
    assert.throws(() => C.validate(stateWithCount(kind, 501)));
  }
  assert.equal(C.mergeImport(stateWithCount('diagnostics', 499), C.empty()).diagnostics.length, 500);
});

test('library archive limit is checked before adding another imported archive', () => {
  const current = C.empty();
  current.importedLibraries = Array.from({length: 500}, () => ({mode: 'blank', drafts: {}}));
  const before = JSON.stringify(current);
  C.validate(current);
  assert.throws(() => C.mergeImport(current, C.empty()));
  assert.equal(JSON.stringify(current), before);
});

test('export/import roundtrip retains current and prior libraries, legacy originals and recovery text', () => {
  const current = C.empty(), incoming = C.empty();
  current.library.drafts['handlung-bild-symbol'] = {text: 'CURRENT LIBRARY\n' + unicode, source: 'current context'};
  incoming.library.drafts['handlung-bild-symbol'] = {text: 'INCOMING LIBRARY\n' + unicode, source: 'incoming context'};
  incoming.importedLibraries = [{mode: 'own', grade: '6', task: 'Archivaufgabe', goal: 'Archivziel', baseline: 'offen', drafts: {fehlerdetektiv: {text: 'EARLIER LIBRARY', source: 'earlier context'}}}];
  incoming.legacy = {original: {buildDraft: 'LEGACY ORIGINAL', unknown: true}};
  incoming.legacyImports = [{original: {buildDraft: 'EARLIER LEGACY'}}];
  incoming.recoveryRaw = '{damaged raw: RAW RECOVERY';
  incoming.recoveredOriginals = ['EARLIER RECOVERY'];
  incoming.diagnostics[0].prompt = 'Bearbeiteter Diagnoseprompt\n' + unicode;
  incoming.builders.push(Object.assign(C.builder(), {draft: unicode, final: 'Geprüfte Fassung\n' + unicode, legacyOriginal: {originalCheckbox: true}}));
  const first = C.mergeImport(current, incoming);
  assert.deepEqual(first.library, current.library);
  const second = C.mergeImport(C.empty(), clone(C.validate(first)));
  const third = C.mergeImport(C.empty(), clone(C.validate(second)));
  const serialized = JSON.stringify(third);
  for (const marker of ['CURRENT LIBRARY', 'INCOMING LIBRARY', 'EARLIER LIBRARY', 'LEGACY ORIGINAL', 'EARLIER LEGACY', 'RAW RECOVERY', 'EARLIER RECOVERY', 'Bearbeiteter Diagnoseprompt', 'Geprüfte Fassung', 'originalCheckbox']) assert.ok(serialized.includes(marker), marker);
  assert.ok(third.builders.some(b => b.draft === unicode));
  assert.doesNotThrow(() => C.validate(clone(third)));
});

test('exactly 22 requested formats in the required order and categories', () => {
  const ids = ['handlung-bild-symbol','darstellungen-zuordnen','beispiele-gegenbeispiele','rechenwege-vergleichen','teilweise-ausgearbeitete-loesungen','gestufte-hilfekarten','differenzierung-gemeinsames-lernziel','strukturierte-rechenpaeckchen','umkehr-ergaenzungsaufgaben','offene-aufgaben-vertiefung','sprachsensibles-aufgabenpaar','verteilte-wiederaufnahme','fehlerdetektiv','immer-manchmal-nie','schaetzen-plausibilitaet','sachkontexte-operation','transfer-gleicher-kern','eigene-aufgabe-erfinden','verstaendnisorientierte-rueckmeldung','exit-ticket-ohne-ki','verzweigte-anschlussaufgaben','partnerdialog'];
  assert.equal(formats.length, 22);
  assert.deepEqual(formats.map(x => x.id), ids);
  assert.deepEqual(formats.map(x => x.category), [...Array(5).fill('A'), ...Array(7).fill('B'), ...Array(6).fill('C'), ...Array(4).fill('D')]);
  assert.deepEqual(extras.map(x => x.id), ['dateiexport','diagnoseinterview','standortbestimmung','elternhinweise','werkzeugpruefung','hypothesenbildung']);
  assert.equal(new Set([...formats, ...extras].map(x => x.id)).size, 28);
});

test('every library entry is complete, specific and uses only the four common placeholders', () => {
  for (const f of [...formats, ...extras]) {
    assert.match(f.id, /^[a-z0-9-]+$/);
    for (const key of ['id','category','title','purpose','when','output','check','prompt']) assert.ok(typeof f[key] === 'string' && f[key].trim(), f.id + ': ' + key);
    assert.ok(f.prompt.length > 500, f.id);
    const placeholders = f.prompt.match(/\{\{[^}]+\}\}/g) || [];
    assert.deepEqual(placeholders.sort(), ['{{klasse}}','{{aufgabe}}','{{ziel}}','{{ausgangslage}}'].sort(), f.id);
    assert.match(f.prompt, /keine Äußerungen oder Bearbeitungen des Kindes/);
    assert.match(f.prompt, /keine Lernwirkung/);
  }
});

test('template filling preserves literal dollars, Unicode and multiple lines, with visible fallbacks', () => {
  const context = {grade: '6/7', task: unicode + '\n$& $$ $1', goal: 'Gleichwertigkeit erklären', baseline: 'Nur eine Annahme\nKeine weitere Antwort'};
  for (const f of [...formats, ...extras]) {
    const filled = C.fillTemplate(f.prompt, context);
    assert.doesNotMatch(filled, /\{\{[^}]+\}\}/, f.id);
    for (const value of Object.values(context)) assert.ok(filled.includes(value), f.id);
  }
  const neutral = C.fillTemplate(formats[0].prompt, {});
  for (const text of ['[Klasse / Stufe ergänzen]', '[Aufgabe ergänzen]', '[konkretes Ziel ergänzen]', '[Ausgangslage / Arbeitsannahme ergänzen]']) assert.ok(neutral.includes(text));
});

test('planner includes exactly the selected format rather than all library instructions', () => {
  const b = Object.assign(C.builder(C.cases[4]), {goal: 'Bruchteile begründen.', assumption: 'Teilgrößen werden verwechselt.'});
  const chosen = formats.find(x => x.id === 'gestufte-hilfekarten');
  const other = formats.find(x => x.id === 'verteilte-wiederaufnahme');
  const p = C.builderPrompt(b, chosen);
  assert.ok(p.includes(chosen.prompt.split('\n\n')[1]));
  assert.ok(!p.includes(other.prompt.split('\n\n')[1]));
  assert.equal((p.match(/Gewählter Schwerpunkt:/g) || []).length, 1);
});

test('old numeric anchors retain their original meanings', () => {
  assert.deepEqual(C.ALIASES, {station1: 'bibliothek', station2: 'hypothesen', station3: 'foerderbaustein'});
  assert.notEqual(C.KEY, C.LEGACY_KEY);
  assert.equal(C.LEGACY_KEY, 'digitale-handouts-foerderbaustein');
});

test('HTML navigation follows new phases and H1 contains exactly two hypothesis fields', () => {
  assert.deepEqual([...html.matchAll(/data-nav="([^"]+)"/g)].map(m => m[1]), ['hypothesen','foerderbaustein','bibliothek']);
  const first = html.slice(html.indexOf('id="hypothesen"'), html.indexOf('id="foerderbaustein"'));
  assert.deepEqual([...first.matchAll(/data-diag="(hypothesis\d+)"/g)].map(m => m[1]), ['hypothesis1','hypothesis2']);
  assert.ok(first.includes('keine Förderübungen'));
  assert.ok(!first.includes('data-build='));
  assert.ok(!first.includes('id="promptList"'));
  assert.ok(html.includes('Fall aus Praxisphase 1 übernehmen'));
  assert.ok(html.includes('Neue Aufgabe / neuen Fall wählen'));
  assert.equal(html.includes('Gesicherter Fall'), false, 'Gespeicherter Fall statt vermeintlich diagnostisch gesicherter Fall');
});

test('HTML IDs are unique; local assets and new Word downloads exist', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);
  for (const ref of refs) {
    if (/^(?:#|https?:|mailto:)/.test(ref)) continue;
    const relative = decodeURIComponent(ref.split(/[?#]/)[0]);
    assert.ok(fs.existsSync(path.join(ROOT, relative)), relative);
  }
  for (const name of ['Handout 1 - Hypothesenbildung.docx','Handout 2 - Foerderbaustein entwickeln.docx','Handout 3 - Tool- und Promptbibliothek.docx']) assert.ok(refs.includes(name), name);
});

test('legacy HTML entry stays compatible and preserves the same current content', () => {
  assert.equal(read('Digitale Handouts Mathematik.html'), html);
  for (const name of ['Handout 1 - Prompt-Bibliothek Mathematik.docx','Handout 2 - Fehleranalyse Uebungsblatt.docx','Handout 3 - Foerderbaustein-Arbeitsvorlage.docx']) assert.ok(fs.existsSync(path.join(ROOT, name)), name);
});

test('HTML provides local storage/export/import explanations and manual clipboard fallback', () => {
  for (const id of ['exportAll','importFile','saveAll','storageStatus','migrationNotice','copyFallback','fallbackText']) assert.ok(html.includes('id="' + id + '"'), id);
  assert.ok(html.includes('Browserbereinigung'));
  assert.ok(html.includes('kein GitHub-Backup'));
  assert.ok(html.includes('keine automatische Übermittlung'));
  assert.ok(html.includes('role="status"'));
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(scripts, ['handouts-core.js','library-data.js','handouts.js']);
  assert.ok(scripts.every(src => !/^https?:/i.test(src)));
});
