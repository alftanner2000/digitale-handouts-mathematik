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
  incoming.library = {mode: 'sample'};
  const before = clone(incoming);
  const merged = C.mergeImport(C.empty(), incoming);
  for (const [actual, defaults] of [[merged.diagnostics.at(-1), C.diagnostic()], [merged.builders.at(-1), C.builder()]]) {
    for (const [key, value] of Object.entries(defaults)) assert.equal(typeof actual[key], typeof value, key);
    assert.doesNotThrow(() => actual.task.trim());
    assert.doesNotThrow(() => actual.goal.trim());
  }
  assert.equal(merged.library.mode, 'sample');
  assert.deepEqual(merged.library.drafts, {});
  for (const key of ['grade','task','goal','baseline']) assert.equal(merged.library[key], '');
  assert.deepEqual(incoming, before);
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
  current.library.goal = 'Vorhandener Kontext bleibt erhalten';
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

test('library results and teacher notes are optional text fields within storage version 2', () => {
  const state = C.empty();
  state.library.drafts = {
    old: {text: 'Bisher bearbeiteter Prompt', source: 'Alter Kontext'},
    resultOnly: {text: 'Prompt A', source: 'Kontext A', result: 'KI-Ergebnis\n' + unicode},
    notesOnly: {text: 'Prompt B', source: 'Kontext B', notes: 'Eigene fachliche Anmerkung\n' + unicode},
    empty: {text: 'Prompt C', source: 'Kontext C', result: '', notes: ''}
  };
  const before = clone(state);
  assert.equal(C.validate(state), state);
  assert.equal(state.version, 2);
  assert.deepEqual(state, before);
  const restored = C.validate(clone(state));
  assert.deepEqual(restored.library.drafts, before.library.drafts);
  assert.ok(!Object.hasOwn(restored.library.drafts.old, 'result'));
  assert.ok(!Object.hasOwn(restored.library.drafts.old, 'notes'));
  assert.ok(!Object.hasOwn(restored.library.drafts.resultOnly, 'notes'));
  assert.ok(!Object.hasOwn(restored.library.drafts.notesOnly, 'result'));
});

test('invalid library result or notes are rejected in current and imported libraries without mutation', () => {
  for (const archived of [false, true]) for (const field of ['result', 'notes']) for (const invalid of [null, 42, true, [], {}, ['text']]) {
    const incoming = C.empty();
    const lib = {mode: 'blank', drafts: {example: {text: 'Prompt', source: 'Kontext', [field]: invalid}}};
    if (archived) incoming.importedLibraries = [lib]; else incoming.library = lib;
    const current = C.empty(), beforeCurrent = clone(current), beforeIncoming = clone(incoming);
    assert.throws(() => C.validate(incoming), /Ungültiges Textfeld im Bibliothekseintrag/, field);
    assert.throws(() => C.mergeImport(current, incoming), field);
    assert.deepEqual(current, beforeCurrent);
    assert.deepEqual(incoming, beforeIncoming);
  }
  const arrayDraft = [];
  Object.assign(arrayDraft, {text: 'Prompt', source: 'Kontext', result: 'Ergebnis', notes: 'Anmerkung'});
  const state = C.empty();
  state.library.drafts.example = arrayDraft;
  assert.throws(() => C.validate(state), /Ungültiger Bibliothekseintrag/);
});

test('per-format results and notes survive repeated imports without overwriting current or archived work', () => {
  const current = C.empty(), incoming = C.empty();
  const id = 'handlung-bild-symbol';
  current.library.drafts[id] = {text: 'CURRENT PROMPT', source: 'current context', result: 'CURRENT RESULT\n' + unicode, notes: 'CURRENT NOTES\n' + unicode};
  current.library.drafts.fehlerdetektiv = {text: 'OTHER PROMPT', source: 'other context', result: 'OTHER RESULT', notes: 'OTHER NOTES'};
  incoming.library.drafts[id] = {text: 'INCOMING PROMPT', source: 'incoming context', result: 'INCOMING RESULT\n' + unicode, notes: 'INCOMING NOTES\n' + unicode};
  incoming.importedLibraries = [{mode: 'own', drafts: {[id]: {text: 'ARCHIVED PROMPT', source: 'archived context', result: 'ARCHIVED RESULT\n' + unicode, notes: 'ARCHIVED NOTES\n' + unicode}}}];
  const beforeCurrent = clone(current), beforeIncoming = clone(incoming);
  const first = C.mergeImport(current, incoming);
  assert.deepEqual(first.library, current.library);
  assert.deepEqual(first.importedLibraries[0], incoming.library);
  assert.deepEqual(first.importedLibraries[1], incoming.importedLibraries[0]);
  assert.deepEqual(current, beforeCurrent);
  assert.deepEqual(incoming, beforeIncoming);
  const second = C.mergeImport(C.empty(), clone(first));
  const third = C.mergeImport(C.empty(), clone(second));
  assert.equal(third.version, 2);
  const libraries = [third.library, ...third.importedLibraries];
  for (const expected of [current.library, incoming.library, incoming.importedLibraries[0]]) {
    assert.ok(libraries.some(actual => JSON.stringify(actual) === JSON.stringify(expected)));
  }
  assert.doesNotThrow(() => C.validate(clone(third)));
});

test('importing older v2 library drafts preserves their prompts and existing new result fields separately', () => {
  const current = C.empty(), old = C.empty();
  current.library.drafts.fehlerdetektiv = {text: 'Heutiger Prompt', source: 'heutiger Kontext', result: 'Eigenes KI-Ergebnis', notes: 'Meine fachliche Prüfung'};
  old.library.drafts.fehlerdetektiv = {text: 'Alter bearbeiteter Prompt\n' + unicode, source: 'alter Kontext'};
  old.importedLibraries = [{drafts: {partnerdialog: {text: 'Früherer Archivprompt', source: 'früherer Kontext'}}}];
  const beforeCurrent = clone(current), beforeOld = clone(old);
  const merged = C.mergeImport(current, old);
  assert.equal(merged.version, 2);
  assert.deepEqual(merged.library, beforeCurrent.library);
  assert.deepEqual(merged.importedLibraries[0], beforeOld.library);
  assert.deepEqual(merged.importedLibraries[1], beforeOld.importedLibraries[0]);
  assert.deepEqual(current, beforeCurrent);
  assert.deepEqual(old, beforeOld);
  assert.deepEqual(C.validate(clone(merged)).importedLibraries, merged.importedLibraries);
});

test('refilling a new library format creates an independent v2 state with empty result and notes', () => {
  for (const library of [C.empty().library, {mode: 'blank'}]) {
    const current = C.empty();
    current.library = library;
    const before = clone(current);
    const next = C.refillLibraryDraft(current, 'fehlerdetektiv', 'Neuer Prompt\n' + unicode, 'Neuer Kontext');
    assert.equal(next.version, 2);
    assert.deepEqual(next.library.drafts.fehlerdetektiv, {text: 'Neuer Prompt\n' + unicode, source: 'Neuer Kontext', result: '', notes: ''});
    assert.deepEqual(current, before);
    assert.notEqual(next, current);
    assert.notEqual(next.library, current.library);
    assert.ok(!next.importedLibraries);
  }
});

test('refilling the same source updates the prompt but retains result and notes without an archive', () => {
  const current = C.empty();
  current.library.drafts.fehlerdetektiv = {text: 'Bisheriger Prompt', source: 'Gleicher Kontext', result: 'Ergebnis\n' + unicode, notes: 'Anmerkung\n' + unicode};
  current.importedLibraries = Array.from({length: 500}, () => ({drafts: {}}));
  const before = clone(current);
  const next = C.refillLibraryDraft(current, 'fehlerdetektiv', 'Bewusst neuer Prompt', 'Gleicher Kontext');
  assert.deepEqual(next.library.drafts.fehlerdetektiv, {...before.library.drafts.fehlerdetektiv, text: 'Bewusst neuer Prompt'});
  assert.equal(next.importedLibraries.length, 500);
  assert.deepEqual(current, before);
  assert.notEqual(next.library.drafts.fehlerdetektiv, current.library.drafts.fehlerdetektiv);
});

test('a changed source archives only the affected completed draft before clearing its active result and notes', () => {
  const current = C.empty();
  Object.assign(current.library, {mode: 'own', task: 'Bereits geänderter globaler Kontext'});
  const oldSource = JSON.stringify({task: 'Frühere Aufgabe', baseline: 'Frühere Ausgangslage'});
  current.library.drafts.fehlerdetektiv = {text: 'Früherer Prompt\n' + unicode, source: oldSource, result: 'Eigenes Ergebnis\n' + unicode, notes: 'Eigene Prüfung\n' + unicode};
  current.library.drafts.partnerdialog = {text: 'Anderer Prompt', source: 'anderer Kontext', result: 'Anderes Ergebnis', notes: 'Andere Prüfung'};
  current.importedLibraries = [{drafts: {existing: {text: 'Älteres Archiv', source: 'Archivkontext'}}}];
  const before = clone(current);
  const next = C.refillLibraryDraft(current, 'fehlerdetektiv', 'Neuer Prompt', 'Neuer Kontext');
  assert.deepEqual(next.library.drafts.fehlerdetektiv, {text: 'Neuer Prompt', source: 'Neuer Kontext', result: '', notes: ''});
  assert.deepEqual(next.library.drafts.partnerdialog, before.library.drafts.partnerdialog);
  assert.deepEqual(next.importedLibraries[0], before.importedLibraries[0]);
  assert.deepEqual(next.importedLibraries[1], {drafts: {fehlerdetektiv: before.library.drafts.fehlerdetektiv}});
  assert.deepEqual(current, before);
  const twice = C.mergeImport(C.empty(), clone(C.mergeImport(C.empty(), clone(next))));
  assert.ok(twice.importedLibraries.some(lib => JSON.stringify(lib) === JSON.stringify(next.importedLibraries[1])));
  assert.deepEqual(twice.library, next.library);
});

test('older drafts or whitespace-only results retain replacement behavior without creating archives', () => {
  for (const extra of [{}, {result: '', notes: ''}, {result: ' \n\t', notes: '  '}]) {
    const current = C.empty();
    current.library.drafts.fehlerdetektiv = {text: 'Alte Vorlage', source: 'Alter Kontext', ...extra};
    current.importedLibraries = Array.from({length: 500}, () => ({drafts: {}}));
    const before = clone(current);
    const next = C.refillLibraryDraft(current, 'fehlerdetektiv', 'Neue Vorlage', 'Neuer Kontext');
    assert.equal(next.importedLibraries.length, 500);
    assert.deepEqual(next.library.drafts.fehlerdetektiv, {text: 'Neue Vorlage', source: 'Neuer Kontext', result: '', notes: ''});
    assert.deepEqual(current, before);
  }
});

test('either a result or notes trigger archiving and the 500-archive limit is checked before any change', () => {
  for (const field of ['result', 'notes']) {
    const current = C.empty();
    current.library.drafts.fehlerdetektiv = {text: 'Prompt', source: 'Alter Kontext', [field]: 'Erhaltenswerter Text'};
    current.importedLibraries = Array.from({length: 499}, () => ({drafts: {}}));
    const atLimit = C.refillLibraryDraft(current, 'fehlerdetektiv', 'Neuer Prompt', 'Neuer Kontext');
    assert.equal(atLimit.importedLibraries.length, 500);
    assert.equal(atLimit.importedLibraries.at(-1).drafts.fehlerdetektiv[field], 'Erhaltenswerter Text');
    atLimit.library.drafts.fehlerdetektiv[field] = 'Weitere Bearbeitung';
    const before = clone(atLimit);
    assert.throws(() => C.refillLibraryDraft(atLimit, 'fehlerdetektiv', 'Noch neuerer Prompt', 'Noch neuerer Kontext'), /500/);
    assert.deepEqual(atLimit, before);
  }
});

test('refilling rejects invalid input without mutating or polluting existing state', () => {
  const current = C.empty();
  current.library.drafts.fehlerdetektiv = {text: 'Prompt', source: 'Kontext', result: 'Ergebnis', notes: 'Anmerkung'};
  const before = clone(current);
  for (const id of [null, 42, '', '  ', '__proto__', 'constructor', 'prototype']) assert.throws(() => C.refillLibraryDraft(current, id, 'Neuer Prompt', 'Neuer Kontext'));
  for (const invalid of [null, 42, true, [], {}]) {
    assert.throws(() => C.refillLibraryDraft(current, 'fehlerdetektiv', invalid, 'Neuer Kontext'));
    assert.throws(() => C.refillLibraryDraft(current, 'fehlerdetektiv', 'Neuer Prompt', invalid));
  }
  assert.deepEqual(current, before);
  const damaged = clone(current);
  damaged.library.drafts.fehlerdetektiv.notes = 42;
  const beforeDamaged = clone(damaged);
  assert.throws(() => C.refillLibraryDraft(damaged, 'fehlerdetektiv', 'Neuer Prompt', 'Neuer Kontext'));
  assert.deepEqual(damaged, beforeDamaged);
  assert.equal(Object.prototype.result, undefined);
  assert.equal(Object.prototype.notes, undefined);
});

test('an export with 500 saved library archives can be restored into an untouched target', () => {
  const current = C.empty();
  current.library.drafts.fehlerdetektiv = {text: 'Alter Prompt', source: 'Alter Kontext', result: 'Ergebnis\n' + unicode, notes: 'Fachliche Prüfung'};
  current.importedLibraries = Array.from({length: 499}, (_, i) => ({drafts: {example: {text: 'Archiv ' + i, source: 'Kontext ' + i}}}));
  const full = C.refillLibraryDraft(current, 'fehlerdetektiv', 'Aktueller Prompt', 'Neuer Kontext');
  const exported = clone(full), before = clone(exported);
  const restored = C.mergeImport(C.empty(), exported);
  assert.equal(restored.importedLibraries.length, 500);
  assert.deepEqual(restored.library, full.library);
  assert.deepEqual(restored.importedLibraries, full.importedLibraries);
  assert.deepEqual(exported, before);
  const restoredAgain = C.mergeImport(C.empty(), clone(restored));
  assert.deepEqual(restoredAgain.library, full.library);
  assert.deepEqual(restoredAgain.importedLibraries, full.importedLibraries);
});

test('adopting an incoming active library retains target archives and checks actual archive growth', () => {
  const current = C.empty(), incoming = C.empty();
  current.importedLibraries = [{drafts: {example: {text: 'Vorhandenes Archiv', source: 'Alter Kontext'}}}];
  incoming.library.drafts.fehlerdetektiv = {text: 'Importierter Prompt', source: 'Kontext', result: 'Ergebnis', notes: 'Anmerkung'};
  incoming.importedLibraries = Array.from({length: 499}, () => ({drafts: {}}));
  const before = clone(current);
  const merged = C.mergeImport(current, incoming);
  assert.equal(merged.importedLibraries.length, 500);
  assert.deepEqual(merged.importedLibraries[0], current.importedLibraries[0]);
  assert.deepEqual(merged.library, incoming.library);
  assert.deepEqual(current, before);
  incoming.importedLibraries.push({drafts: {}});
  assert.throws(() => C.mergeImport(current, incoming), /Bibliotheksarchive/);
  assert.deepEqual(current, before);
});

test('any existing library context, draft, nonblank mode or unknown field prevents replacement', () => {
  const mutations = [
    ...['grade','task','goal','baseline'].map(key => lib => {lib[key] = ' ';}),
    lib => {lib.mode = 'own';},
    lib => {lib.mode = 'sample';},
    lib => {delete lib.mode;},
    lib => {lib.drafts.example = {text: '', source: ''};},
    lib => {lib.futureMaterial = '';},
    lib => {lib.futureMaterial = {result: 'Unbekanntes Material erhalten'};}
  ];
  for (const mutate of mutations) {
    const current = C.empty(), incoming = C.empty();
    mutate(current.library);
    incoming.library.drafts.fehlerdetektiv = {text: 'Importiert', source: 'Importkontext'};
    const before = clone(current);
    const merged = C.mergeImport(current, incoming);
    assert.deepEqual(merged.library, before.library);
    assert.deepEqual(merged.importedLibraries[0], incoming.library);
    assert.deepEqual(current, before);
  }
});

test('a minimal explicitly blank library is untouched but a nonblank destination still respects the archive limit', () => {
  const current = C.empty(), incoming = C.empty();
  current.library = {mode: 'blank'};
  incoming.library.drafts.fehlerdetektiv = {text: 'Importiert', source: 'Importkontext', result: 'Ergebnis'};
  incoming.importedLibraries = Array.from({length: 500}, () => ({drafts: {}}));
  assert.deepEqual(C.mergeImport(current, incoming).library, incoming.library);
  current.library.futureMaterial = 'Nicht überschreiben';
  const before = clone(current);
  assert.throws(() => C.mergeImport(current, incoming), /Bibliotheksarchive/);
  assert.deepEqual(current, before);
});

test('exactly eight library formats provide complete concrete examples with separate solutions and limits', () => {
  const examples = [...formats, ...extras].filter(f => f.example);
  assert.deepEqual(examples.map(f => f.id), ['handlung-bild-symbol','darstellungen-zuordnen','gestufte-hilfekarten','differenzierung-gemeinsames-lernziel','strukturierte-rechenpaeckchen','fehlerdetektiv','exit-ticket-ohne-ki','hypothesenbildung']);
  for (const f of examples) {
    assert.deepEqual(Object.keys(f.example).sort(), ['context','task','solution','criterion','limit'].sort(), f.id);
    for (const value of Object.values(f.example)) assert.ok(typeof value === 'string' && value.trim(), f.id);
    assert.match(f.example.context, /Fiktiver Ausgangsfall/);
    assert.match(f.example.context, /Denkweg ist unbekannt/);
  }
});

test('the common trial context is explicitly fictitious and fills each example prompt without inventing evidence', () => {
  const trial = clone(sandbox.window.HANDOUT_TRIAL_EXAMPLE);
  assert.deepEqual(Object.keys(trial).sort(), ['grade','task','goal','baseline'].sort());
  for (const value of Object.values(trial)) assert.ok(typeof value === 'string' && value.trim());
  assert.equal(trial.task, '1/2 + 1/3 = ?');
  assert.match(trial.baseline, /Fiktive notierte Lösung/);
  assert.match(trial.baseline, /Offene Vermutung/);
  assert.match(trial.baseline, /Ausdrücklich gewählte Arbeitsannahme/);
  assert.match(trial.baseline, /Keine weitere Kinderantwort bekannt/);
  for (const f of [...formats, ...extras].filter(f => f.example)) {
    const filled = C.fillTemplate(f.prompt, trial);
    assert.ok(filled.includes(trial.task), f.id);
    assert.ok(filled.includes(trial.goal), f.id);
    assert.ok(filled.includes(trial.baseline), f.id);
    assert.doesNotMatch(filled, /\{\{[^}]+\}\}/, f.id);
  }
});

test('sample mode remains v2-compatible in active and archived libraries across imports', () => {
  const incoming = C.empty();
  incoming.library.mode = 'sample';
  incoming.library.drafts.fehlerdetektiv = {text: 'Beispielprompt', source: JSON.stringify(sandbox.window.HANDOUT_TRIAL_EXAMPLE), result: 'Erprobung', notes: 'Prüfung'};
  incoming.importedLibraries = [{mode: 'sample', drafts: {}}];
  assert.equal(C.validate(incoming).version, 2);
  const merged = C.mergeImport(C.empty(), clone(incoming));
  assert.deepEqual(merged.library, incoming.library);
  assert.equal(merged.importedLibraries[0].mode, 'sample');
  assert.doesNotThrow(() => C.validate(clone(merged)));
});

test('HTML exposes the sample context and eight-example filter without changing the neutral default', () => {
  const mode = html.match(/<select\b[^>]*id="libraryMode"[^>]*>([\s\S]*?)<\/select>/)[1];
  assert.match(mode, /^<option value="blank">/);
  assert.match(mode, /<option value="sample">Fiktive Bruchauswertung/);
  assert.match(html, /<option value="examples">Acht konkrete Erprobungsbeispiele<\/option>/);
  assert.match(html, /id="trialFromExample"/);
  assert.match(html, /id="trialFromBuilder"/);
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

test('optional goal help adds empty fields without changing storage version or chosen goal', () => {
  const b = C.builder();
  for (const key of ['goalPrompt', 'goalPromptSource', 'goalCandidate']) assert.equal(b[key], '');
  assert.equal(b.goal, '');
  assert.equal(C.empty().version, 2);
  assert.equal(C.KEY, 'digitale-handouts-v2');
  assert.equal(typeof C.goalPrompt, 'function');
});

test('goal prompt needs neither an existing goal nor a selected format', () => {
  const b = C.builder(C.cases[4]);
  assert.equal(b.goal, '');
  assert.equal(b.format, '');
  const p = C.goalPrompt(b);
  assert.ok(p.includes(b.task));
  assert.ok(p.includes(b.taskGoal));
  assert.ok(p.includes(C.contextForBuilder(b)));
  assert.match(p, /vorhandenes Förderziel oder gewähltes Aufgabenformat ist dafür nicht erforderlich/);
  assert.doesNotMatch(p, /Genau ein Format auswählen|Formatspezifischer Auftrag/);
  assert.doesNotThrow(() => C.goalPrompt(C.builder()));
});

test('goal prompt carries the complete context and distinguishes all three evidence states', () => {
  const b = C.builder(populatedDiagnostic());
  b.topic = 'Bruchverständnis';
  b.conception = 'Vorläufiger Bezug zu gleich großen Teilen';
  b.assumption = 'ANNAHME: Die Teilgröße bleibt beim Addieren unbeachtet.';
  b.evidence = 'TATSÄCHLICH: Das Kind zeigt gleich große Hälften am Streifen.';
  for (const status of ['open', 'assumed', 'observed']) {
    b.evidenceStatus = status;
    const p = C.goalPrompt(b);
    assert.ok(p.includes(C.contextForBuilder(b)), status);
    for (const value of [b.task, b.taskGoal, b.known, b.observation, b.hypotheses, b.plannedCheck, b.missing, b.conception]) assert.ok(p.includes(value), status + ': ' + value);
    if (status === 'observed') {
      assert.ok(p.includes(b.evidence));
      assert.ok(!p.includes(b.assumption));
      assert.match(p, /Tatsächlich beobachtete weitere Antwort/);
    } else {
      assert.ok(p.includes(b.assumption));
      assert.ok(!p.includes(b.evidence));
      assert.match(p, /Unter der Annahme, dass/);
    }
  }
});

test('goal help limits alternatives and requires an observable, conditional, teacher-selected goal', () => {
  const p = C.goalPrompt(C.builder());
  for (const text of ['höchstens zwei alternative Förderziele', 'beobachtbaren mathematischen Handlung, Darstellung oder Erklärung', 'Hilfsmittel oder Unterstützung', 'Prüfaufgabe ohne KI', 'konkretes fachliches Prüfkriterium', 'Keine willkürlichen Prozentwerte oder Erfolgsquoten', 'gezielte Rückfrage', 'Keine gesicherte Diagnose', 'keine Förderübungen und keinen vollständigen Förderbaustein', 'wählt genau ein Ziel aus', 'übernimmt es bewusst', 'Kein Vorschlag gilt automatisch als bestätigt oder übernommen']) assert.ok(p.includes(text), text);
  assert.match(p, /Unter der Annahme, dass/);
  assert.match(p, /kein Versprechen einer Lernwirkung/);
});

test('generating goal help does not mutate an existing goal, candidate or other builder fields', () => {
  const b = Object.assign(C.builder(populatedDiagnostic()), {
    goal: 'Mein vorhandenes Ziel\n' + unicode,
    goalPrompt: 'Mein zuvor bearbeiteter Zielprompt',
    goalPromptSource: 'Mein voriger Kontext',
    goalCandidate: 'Mein noch nicht übernommener Kandidat',
    draft: 'Vorhandenes Material',
    checks: ['1']
  });
  const before = clone(b);
  Object.freeze(b.checks);
  Object.freeze(b);
  const p = C.goalPrompt(b);
  assert.ok(p.includes(b.goal));
  assert.match(p, /vorhandenes Ziel darfst du bei Bedarf präzisieren/);
  assert.deepEqual(b, before);
});

test('older v2 imports and legacy migration safely initialize the new optional goal-help fields', () => {
  const incoming = C.empty();
  const oldBuilder = Object.assign(C.builder(), {goal: 'Vorhandenes Ziel bleibt', draft: unicode});
  for (const key of ['goalPrompt', 'goalPromptSource', 'goalCandidate']) delete oldBuilder[key];
  incoming.builders.push(oldBuilder);
  C.validate(incoming);
  const imported = C.mergeImport(C.empty(), incoming).builders.at(-1);
  assert.equal(imported.goal, oldBuilder.goal);
  assert.equal(imported.draft, unicode);
  for (const key of ['goalPrompt', 'goalPromptSource', 'goalCandidate']) assert.equal(imported[key], '');
  const legacy = C.migrateLegacy(JSON.stringify({buildGoal1: 'Altes Ziel', buildDraft: unicode})).builders[0];
  assert.equal(legacy.goal, 'Altes Ziel');
  for (const key of ['goalPrompt', 'goalPromptSource', 'goalCandidate']) assert.equal(legacy[key], '');
});

test('new goal-help fields survive repeated JSON/import roundtrips and reject non-text input', () => {
  const incoming = C.empty();
  const b = Object.assign(C.builder(), {
    goal: 'Ausgewähltes Ziel unverändert',
    goalPrompt: 'Bearbeiteter Zielprompt\n' + unicode,
    goalPromptSource: 'Kontext\n' + unicode,
    goalCandidate: 'Noch zu prüfender Kandidat\n' + unicode
  });
  incoming.builders.push(b);
  const once = C.mergeImport(C.empty(), clone(incoming));
  const twice = C.mergeImport(C.empty(), clone(once));
  const result = twice.builders.at(-1);
  for (const key of ['goal', 'goalPrompt', 'goalPromptSource', 'goalCandidate']) assert.equal(result[key], b[key]);
  C.validate(twice);
  for (const key of ['goalPrompt', 'goalPromptSource', 'goalCandidate']) {
    const invalid = clone(incoming);
    invalid.builders[0][key] = {not: 'text'};
    assert.throws(() => C.validate(invalid), key);
  }
});

test('H1 permits a missing task goal and requests a proposed requirement, not an invented learning state', () => {
  const d = C.diagnostic(C.cases[4]);
  d.goal = '';
  const before = clone(d);
  const p = C.diagnosticPrompt(d);
  assert.ok(p.includes(d.task));
  assert.ok(p.includes(d.solution));
  assert.match(p, /Ein Aufgabenziel ist keine Voraussetzung/);
  assert.match(p, /aufgabenbezogenes Ziel ausdrücklich als Vorschlag/);
  assert.match(p, /keinen beobachteten Lernstand und keine Annahme über das Kind/);
  assert.match(p, /Erfinde weder eine Schülerlösung noch eine fallbezogene Hypothese/);
  assert.deepEqual(d, before);
});

test('H1 keeps an existing goal available for optional refinement without mutating it', () => {
  const d = populatedDiagnostic();
  d.goal = 'Eigenes Aufgabenziel\n' + unicode;
  const before = clone(d);
  Object.freeze(d);
  const p = C.diagnosticPrompt(d);
  assert.ok(p.includes(d.goal));
  assert.match(p, /Behalte ein passendes vorhandenes Aufgabenziel bei oder präzisiere es bei Bedarf/);
  assert.deepEqual(d, before);
});

test('H2 hypothesis help adds two empty v2 fields and requires no prior hypotheses, goal or format', () => {
  const b = C.builder(C.cases[4]);
  b.taskGoal = '';
  for (const key of ['hypothesisPrompt', 'hypothesisPromptSource', 'hypotheses', 'goal', 'format']) assert.equal(b[key], '');
  assert.equal(C.empty().version, 2);
  assert.equal(typeof C.builderHypothesisPrompt, 'function');
  const p = C.builderHypothesisPrompt(b);
  assert.ok(p.includes(b.task));
  assert.ok(p.includes(b.observation));
  assert.match(p, /Eigene Hypothesen, Fachbegriffe, ein Aufgabenziel oder ein Förderziel sind keine Voraussetzung/);
  assert.match(p, /Fehlt das konkrete Aufgabenziel/);
  assert.match(p, /kennzeichne es als Vorschlag/);
  assert.doesNotMatch(p, /Genau ein Format auswählen|Formatspezifischer Auftrag/);
  assert.doesNotThrow(() => C.builderHypothesisPrompt(C.builder()));
});

test('H2 hypothesis prompt carries all known inputs and keeps evidence, assumptions and uncertainty distinct', () => {
  const b = C.builder(populatedDiagnostic());
  b.topic = 'Bruchverständnis';
  b.conception = 'Nur vorläufiger Bezug zur gemeinsamen Einheit';
  b.assumption = 'FIKTIVE ARBEITSANNAHME: Teilgrößen bleiben unbeachtet.';
  b.evidence = 'WEITERE TATSÄCHLICHE ANTWORT: Ein Viertel wird richtig gezeigt.';
  for (const status of ['open', 'assumed', 'observed']) {
    b.evidenceStatus = status;
    const p = C.builderHypothesisPrompt(b);
    assert.ok(p.includes(C.contextForBuilder(b)), status);
    for (const value of [b.grade, b.task, b.observation, b.known, b.taskGoal, b.hypotheses, b.plannedCheck, b.missing, b.conception]) assert.ok(p.includes(value), status + ': ' + value);
    if (status === 'observed') {
      assert.ok(p.includes(b.evidence));
      assert.ok(!p.includes(b.assumption));
    } else {
      assert.ok(p.includes(b.assumption));
      assert.ok(!p.includes(b.evidence));
    }
    assert.match(p, /Eine Arbeitsannahme ist keine tatsächlich beobachtete Antwort/);
  }
});

test('H2 hypothesis help uses exactly five output headings and no promotion products', () => {
  const p = C.builderHypothesisPrompt(C.builder());
  assert.deepEqual(p.split('\n').filter(line => /^[A-ZÄÖÜß ]+$/.test(line)), ['KONKRETES AUFGABENZIEL', 'BEOBACHTUNG', 'OFFENE HYPOTHESEN', 'GEPLANTER PRÜFSCHRITT', 'NOCH FEHLENDE INFORMATIONEN']);
  for (const phrase of ['insgesamt höchstens zwei', 'aus vorhandenen Hinweisen', 'Erfinde keinen Denkweg und keine Kinderäußerung', 'gezielte offene Rückfrage oder kurze Kontrastaufgabe', 'stützende und widersprechende Antworten, ausdrücklich als hypothetisch', 'keine gesicherte Diagnose', 'keine Förderübungen, keinen Förderplan und keinen vollständigen Förderbaustein', 'Ohne tatsächliche weitere Antworten bleiben die Hypothesen offen', 'Kein Vorschlag wird automatisch bestätigt']) assert.ok(p.includes(phrase), phrase);
  assert.match(p, /Fehlt die Aufgabe oder eine vorliegende beziehungsweise vorgegebene fiktive Lösung oder Äußerung, frage gezielt danach/);
  assert.match(p, /Erfinde in diesem Fall keine fallbezogene Hypothese und keine Schülerlösung/);
  assert.match(p, /vorgegebene fiktive Lösung ist als fiktiv zu kennzeichnen/);
});

test('generating H2 hypothesis help cannot change current observations, hypotheses, checks, goals or prompts', () => {
  const b = Object.assign(C.builder(populatedDiagnostic()), {
    goal: 'Mein bisheriges Förderziel',
    hypothesisPrompt: 'Bereits bearbeiteter Hilfeprompt\n' + unicode,
    hypothesisPromptSource: 'Vorheriger Kontext',
    goalPrompt: 'Zielhilfe unverändert',
    goalCandidate: 'Noch nicht übernommener Zielvorschlag',
    draft: 'Bestehendes Material',
    checks: ['0', '2']
  });
  const before = clone(b);
  Object.freeze(b.checks);
  Object.freeze(b);
  C.builderHypothesisPrompt(b);
  assert.deepEqual(b, before);
});

test('new hypothesis fields preserve old-v2 and legacy compatibility and survive repeated imports', () => {
  const old = C.empty();
  const oldBuilder = Object.assign(C.builder(), {hypotheses: 'Vorläufige Vermutung', goal: 'Vorhandenes Förderziel'});
  delete oldBuilder.hypothesisPrompt;
  delete oldBuilder.hypothesisPromptSource;
  old.builders.push(oldBuilder);
  C.validate(old);
  const upgraded = C.mergeImport(C.empty(), old).builders.at(-1);
  for (const key of ['hypothesisPrompt', 'hypothesisPromptSource']) assert.equal(upgraded[key], '');
  assert.equal(upgraded.hypotheses, oldBuilder.hypotheses);
  assert.equal(upgraded.goal, oldBuilder.goal);
  const legacy = C.migrateLegacy(JSON.stringify({buildError: 'Alte offene Deutung', buildDraft: unicode})).builders[0];
  for (const key of ['hypothesisPrompt', 'hypothesisPromptSource']) assert.equal(legacy[key], '');
  const incoming = C.empty();
  const b = Object.assign(C.builder(), {hypothesisPrompt: 'Bearbeitet\n' + unicode, hypothesisPromptSource: 'Kontext\n' + unicode, hypotheses: 'Unbestätigte Hypothese', goal: 'Separates Förderziel'});
  incoming.builders.push(b);
  const once = C.mergeImport(C.empty(), clone(incoming));
  const twice = C.mergeImport(C.empty(), clone(once));
  const result = twice.builders.at(-1);
  for (const key of ['hypothesisPrompt', 'hypothesisPromptSource', 'hypotheses', 'goal']) assert.equal(result[key], b[key]);
  for (const key of ['hypothesisPrompt', 'hypothesisPromptSource']) {
    const invalid = clone(incoming);
    invalid.builders[0][key] = {not: 'text'};
    assert.throws(() => C.validate(invalid), key);
  }
});

test('H1 transfer keeps the raw solution separate from the recorded observation', () => {
  const d = populatedDiagnostic();
  d.solution = 'Fiktive Schülerlösung\n½ + ⅓ = ⅖';
  d.observation = 'Festgehalten ist eine falsche Gleichung.\nDer Denkweg ist noch unbekannt.';
  const before = clone(d);
  const b = C.builder(d);
  assert.equal(b.observation, d.solution);
  assert.equal(b.noticed, d.observation);
  assert.equal(C.builder().noticed, '');
  assert.deepEqual(d, before);
  const context = C.contextForBuilder(b);
  assert.ok(context.includes(b.observation));
  assert.ok(context.includes(b.noticed));
  assert.match(context, /Festgehaltene Beobachtung an der Lösung/);
  assert.ok(C.builderHypothesisPrompt(b).includes(context));
  assert.ok(C.goalPrompt(b).includes(context));
  assert.ok(C.builderPrompt(b, formats[0]).includes(context));
});

test('older combined observation fields stay byte-for-byte unchanged on v2 import and legacy migration', () => {
  const combined = 'Ursprüngliche Lösung: ½ + ⅓ = ⅖\nFrühere ergänzte Beobachtung\n' + unicode;
  const old = C.empty();
  const b = Object.assign(C.builder(), {observation: combined});
  delete b.noticed;
  old.builders.push(b);
  C.validate(old);
  const imported = C.mergeImport(C.empty(), old).builders.at(-1);
  assert.equal(imported.observation, combined);
  assert.equal(imported.noticed, '');
  const migrated = C.migrateLegacy(JSON.stringify({buildObservation: combined})).builders[0];
  assert.equal(migrated.observation, combined);
  assert.equal(migrated.noticed, '');
  assert.equal(migrated.legacyOriginal.buildObservation, combined);
});

test('new separate observation survives roundtrips without replacing the raw solution', () => {
  const incoming = C.empty();
  const b = Object.assign(C.builder(), {observation: 'Unveränderte Roh-Lösung\n' + unicode, noticed: 'Nach Prüfung festgehaltene Beobachtung\n' + unicode});
  incoming.builders.push(b);
  const once = C.mergeImport(C.empty(), clone(incoming));
  const twice = C.mergeImport(C.empty(), clone(once));
  assert.equal(twice.builders.at(-1).observation, b.observation);
  assert.equal(twice.builders.at(-1).noticed, b.noticed);
  const invalid = clone(incoming);
  invalid.builders[0].noticed = {not: 'text'};
  assert.throws(() => C.validate(invalid));
});
