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
const variantRoutes = clone(sandbox.window.HANDOUT_VARIANT_ROUTES);
const variantSources = clone(sandbox.window.HANDOUT_VARIANT_SOURCES);
const moreExamples = clone(sandbox.window.HANDOUT_MORE_EXAMPLES);
const freeIdeas = clone(sandbox.window.HANDOUT_FREE_IDEAS);
const html = read('index.html');
const app = read('handouts.js');
const unicode = 'Äußere Größe: ½ + ⅓ = ⅚\n„Zähler“, € 3,50, <Bild> & Erklärung\nZweite Zeile – ohne Namen.';
const lookupFormat = id => [...formats, ...extras, freeIdeas].find(item => item.id === id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// Execute the actual application functions with isolated, in-memory DOM/storage doubles.
// This checks handler behavior, not browser rendering or external clipboard access.
function appFunction(name) {
  const start = app.indexOf('function ' + name + '(');
  assert.ok(start >= 0, name + ' exists');
  const lineStart = app.lastIndexOf('\n', start) + 1;
  const lineEnd = app.indexOf('\n', start);
  const firstLine = app.slice(lineStart, lineEnd);
  if (firstLine.trimEnd().endsWith('}')) return firstLine;
  const end = app.indexOf('\n  }', start);
  assert.ok(end >= 0, name + ' ends');
  return app.slice(lineStart, end + 4);
}

function runApp(names, context, expression) {
  return vm.runInNewContext('"use strict";\n' + names.map(appFunction).join('\n') + '\n' + expression, context);
}

const ideaFields = ['customFormat','formatIdeasPrompt','formatIdeasPromptSource','formatIdeasResult'];
function ownIdeaBuilder() {
  return Object.assign(C.builder(C.cases[4]), {
    format: 'custom', goal: 'Gleich große Bruchteile erklären.', customFormat: 'Eigene Aufgaben erfinden\n' + unicode,
    formatIdeasPrompt: 'Bearbeiteter Ideenprompt', formatIdeasPromptSource: 'Voriger Stand', formatIdeasResult: 'Noch nicht ausgewählter Vorschlag',
    draft: 'Vorhandenes Rohmaterial', final: 'Geprüftes Material', adjustments: 'Eigene Korrektur'
  });
}

function fakeNodes() {
  const nodes = {};
  return {nodes, $: id => nodes[id] ||= {value: '', innerHTML: '', textContent: '', hidden: false, open: false, focus() {}, select() {}, showModal() {this.open = true;}}};
}

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

test('500 diagnosis cases can be restored into a fresh state without counting its untouched starter', () => {
  const current = C.empty(), incoming = stateWithCount('diagnostics', 500);
  const originalStarterId = current.diagnostics[0].id;
  const beforeCurrent = clone(current), beforeIncoming = clone(incoming);
  const merged = C.mergeImport(current, incoming);
  assert.equal(merged.diagnostics.length, 500);
  assert.ok(!merged.diagnostics.some(d => d.id === originalStarterId));
  assert.deepEqual(current, beforeCurrent);
  assert.deepEqual(incoming, beforeIncoming);
  assert.equal(C.mergeImport(C.empty(), clone(merged)).diagnostics.length, 500);
});

test('any changed or unknown starter field preserves the case and enforces the real import limit', () => {
  const template = C.empty().diagnostics[0];
  const mutations = Object.keys(template).filter(key => key !== 'id').map(key => state => {state.diagnostics[0][key] += ' Eigene Eingabe';});
  mutations.push(state => {state.diagnostics[0].futureMaterial = 'Eigene zusätzliche Angabe';});
  mutations.push(state => {state.activeDiagnosticId = '';});
  mutations.push(state => {state.diagnostics.push(C.diagnostic(C.cases[0]));});
  for (const mutate of mutations) {
    const current = C.empty(); mutate(current);
    const before = clone(current);
    assert.throws(() => C.mergeImport(current, stateWithCount('diagnostics', 500)), /500/);
    assert.deepEqual(current, before);
    const merged = C.mergeImport(current, C.empty());
    assert.deepEqual(merged.diagnostics.slice(0, current.diagnostics.length), before.diagnostics);
  }
});

test('an untouched starter remains when the incoming file has no diagnosis cases', () => {
  const current = C.empty(), incoming = C.empty();
  incoming.diagnostics = []; incoming.activeDiagnosticId = '';
  incoming.builders.push(C.builder());
  const merged = C.mergeImport(current, incoming);
  assert.deepEqual(merged.diagnostics, current.diagnostics);
  assert.equal(merged.activeDiagnosticId, current.activeDiagnosticId);
  assert.equal(merged.builders.length, 1);
});

test('backup serialization uses the common byte limit and preserves recovery data and version 2', () => {
  const state = C.empty();
  state.library.drafts.example = {text: unicode, source: 'Kontext', result: 'Ergebnis\n' + unicode, notes: 'Anmerkung'};
  state.recoveryRaw = 'Unlesbarer ursprünglicher Text\n' + unicode;
  const before = clone(state);
  const text = C.serializeBackup(state);
  assert.equal(C.MAX_BACKUP_BYTES, 10000000);
  assert.deepEqual(JSON.parse(text), before);
  assert.equal(JSON.parse(text).version, 2);
  assert.deepEqual(state, before);
  assert.ok(Buffer.byteLength(text, 'utf8') <= C.MAX_BACKUP_BYTES);
});

test('backup export accepts the exact UTF-8 size boundary and rejects one extra byte without mutation', () => {
  const state = C.empty();
  state.library.drafts.example = {text: '', source: 'Kontext'};
  const overhead = Buffer.byteLength(JSON.stringify(state, null, 2), 'utf8');
  state.library.drafts.example.text = 'x'.repeat(C.MAX_BACKUP_BYTES - overhead);
  assert.equal(Buffer.byteLength(C.serializeBackup(state), 'utf8'), C.MAX_BACKUP_BYTES);
  state.library.drafts.example.text += 'x';
  const originalText = state.library.drafts.example.text;
  assert.throws(() => C.serializeBackup(state), /Export-\/Importgrenze von 10 MB/);
  assert.equal(state.library.drafts.example.text, originalText);
});

test('backup size measures UTF-8 bytes rather than JavaScript string length', () => {
  const state = C.empty();
  state.recoveryRaw = '😀'.repeat(2500000);
  assert.ok(JSON.stringify(state, null, 2).length < C.MAX_BACKUP_BYTES);
  assert.ok(Buffer.byteLength(JSON.stringify(state, null, 2), 'utf8') > C.MAX_BACKUP_BYTES);
  assert.throws(() => C.serializeBackup(state), /10 MB/);
});

test('the export handler never downloads an oversized backup and import uses the same limit', () => {
  const source = read('handouts.js');
  const exportFunction = source.slice(source.indexOf('  function exportAll()'), source.indexOf('  async function importFile('));
  const state = C.empty(), downloads = [], announcements = [];
  const context = {C, state, recoveryRaw: '', save: () => true, download: (...args) => downloads.push(args), announce: value => announcements.push(value)};
  vm.runInNewContext(exportFunction + '\nexportAll();', context);
  assert.equal(downloads.length, 1);
  assert.deepEqual(JSON.parse(downloads[0][1]), state);
  context.recoveryRaw = 'x'.repeat(C.MAX_BACKUP_BYTES);
  vm.runInNewContext('exportAll();', context);
  assert.equal(downloads.length, 1);
  assert.match(announcements.at(-1), /Keine Dateisicherung erstellt:.*10 MB/);
  assert.match(announcements.at(-1), /Arbeitsstände wurden nicht entfernt/);
  assert.match(source, /file\.size>C\.MAX_BACKUP_BYTES/);
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

test('example routes have unique IDs and valid links without limiting the available formats', () => {
  assert.ok(variantRoutes.length >= 6);
  assert.equal(new Set(variantRoutes.map(route => route.id)).size, variantRoutes.length);
  assert.equal(formats.length, 22);
  assert.equal(extras.length, 6);
  const ids = new Set([...formats, ...extras].map(format => format.id));
  assert.equal(ids.size, 28);
  for (const route of variantRoutes) {
    for (const key of ['id','title','phase','condition','purpose']) assert.ok(typeof route[key] === 'string' && route[key].trim(), route.id + ': ' + key);
    assert.ok(Array.isArray(route.formats) && route.formats.length, route.id);
    assert.equal(new Set(route.formats).size, route.formats.length, route.id);
    for (const id of route.formats) assert.ok(ids.has(id), route.id + ': ' + id);
  }
});

test('every variant example has a task, separate solution, criterion and limit', () => {
  for (const route of variantRoutes) {
    assert.ok(Array.isArray(route.examples) && route.examples.length, route.id);
    for (const example of route.examples) {
      assert.deepEqual(Object.keys(example).sort(), ['title','task','solution','criterion','limit'].sort(), route.id);
      for (const [key, value] of Object.entries(example)) assert.ok(typeof value === 'string' && value.trim(), route.id + ': ' + key);
    }
  }
  const diagnostic = variantRoutes.find(route => route.id === 'denkweg');
  assert.match(diagnostic.condition, /Denkweg ist unbekannt/);
  assert.match(diagnostic.condition, /Förderziel.*nicht nötig/);
  assert.match(diagnostic.purpose, /Noch keine Lösung/);
  assert.match(variantRoutes.find(route => route.id === 'bedeutung').condition, /tatsächliche Antwort|Arbeitsannahme/);
  assert.match(variantRoutes.find(route => route.id === 'uebertragen').examples[0].limit, /keine dauerhafte Beherrschung/);
});

test('all example source indexes resolve to titled HTTPS primary-source links', () => {
  assert.equal(variantSources.length, 10);
  const titles = new Set();
  for (const source of variantSources) {
    assert.ok(typeof source.title === 'string' && source.title.trim());
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(url.hostname === 'dzlm.de' || url.hostname.endsWith('.dzlm.de'), url.hostname);
    // A material overview may support different topics, so repeated URLs are valid.
    assert.ok(!titles.has(source.title), source.title);
    titles.add(source.title);
  }
  for (const route of [...variantRoutes, ...moreExamples]) {
    assert.ok(Array.isArray(route.sources) && route.sources.length, route.id);
    assert.equal(new Set(route.sources).size, route.sources.length, route.id);
    for (const index of route.sources) assert.ok(Number.isInteger(index) && index >= 0 && index < variantSources.length, route.id + ': ' + index);
  }
});

test('variant rendering separates fixed examples from selected-context prompts', () => {
  const source = read('handouts.js');
  const render = source.slice(source.indexOf('  function renderVariantRoutes()'), source.indexOf('  function openFormat('));
  const nodes = {variantRoutes: {innerHTML: ''}, variantSources: {innerHTML: ''}, moreExamples: {innerHTML: ''}};
  const state = C.empty(), before = clone(state);
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  vm.runInNewContext('"use strict";\n' + render + '\nrenderVariantRoutes();', {
    window: {HANDOUT_VARIANT_ROUTES: variantRoutes, HANDOUT_VARIANT_SOURCES: variantSources, HANDOUT_MORE_EXAMPLES: moreExamples},
    library: [...formats, ...extras], lookupFormat, state, $: id => nodes[id], esc
  });
  assert.equal((nodes.variantRoutes.innerHTML.match(/class="variant-route"/g) || []).length, variantRoutes.length);
  assert.equal((nodes.variantRoutes.innerHTML.match(/class="route-example"/g) || []).length, variantRoutes.reduce((sum, route) => sum + route.examples.length, 0));
  assert.equal((nodes.variantRoutes.innerHTML.match(/data-open-format=/g) || []).length, variantRoutes.reduce((sum, route) => sum + route.formats.length, 0));
  for (const route of variantRoutes) for (const id of route.formats) assert.ok(nodes.variantRoutes.innerHTML.includes('data-open-format="' + id + '"'));
  assert.match(nodes.variantRoutes.innerHTML, /das Beispiel oben wird nicht übernommen/);
  for (const item of variantSources) assert.ok(nodes.variantSources.innerHTML.includes(esc(item.url)));
  assert.equal((nodes.moreExamples.innerHTML.match(/class="route-example"/g) || []).length, moreExamples.length);
  for (const example of moreExamples) for (const id of example.formats) assert.ok(nodes.moreExamples.innerHTML.includes('data-open-format="' + id + '"'));
  assert.deepEqual(state, before);
});

test('opening a route format preserves selected context and an existing prompt, result and notes in every mode', () => {
  const source = read('handouts.js');
  const open = source.slice(source.indexOf('  function openFormat('), source.indexOf('  function renderLibrary()'));
  const ensure = source.slice(source.indexOf('  async function ensureLibrary('), source.indexOf('  function filterLibrary()'));
  assert.doesNotMatch(open, /state\s*(?:=|\.)|Object\.assign|\.mode\s*=|data-trial/);
  const id = formats[0].id;
  for (const mode of ['blank','own','sample','diagnostic','builder']) {
    const state = C.empty();
    Object.assign(state.library, {mode, grade: '7', task: 'Eigene Aufgabe', goal: 'Eigenes Ziel', baseline: unicode});
    state.library.drafts[id] = {text: 'Eigener Prompt', source: 'Voriger Kontext', result: 'Eigenes Ergebnis', notes: unicode};
    const before = clone(state);
    const nodes = {libraryFilter: {value: 'examples'}, promptSearch: {value: 'Suche'}};
    for (const prefix of ['library-','trial-result-','trial-notes-']) nodes[prefix + id] = {value: ''};
    let focusCount = 0, scrollCount = 0, filterCount = 0;
    const item = {dataset: {format: id}, open: false, querySelector: () => ({focus: () => focusCount++}), scrollIntoView: () => scrollCount++};
    const fail = () => {throw new Error('Opening must not regenerate or replace an existing draft');};
    vm.runInNewContext('"use strict";\n' + open + ensure + '\nopenFormat(' + JSON.stringify(id) + ');', {
      state, library: [...formats, ...extras], lookupFormat, all: () => [item], $: key => nodes[key],
      filterLibrary: () => filterCount++, announce: () => {}, updateLibraryContext: () => {}, renderImportedLibraries: () => {}, resizeOpenPrompts: () => {},
      C: {refillLibraryDraft: fail, fillTemplate: fail}, save: fail, ask: fail, libraryContext: fail, librarySource: fail
    });
    assert.deepEqual(state, before, mode);
    assert.equal(nodes['library-' + id].value, before.library.drafts[id].text);
    assert.equal(nodes['trial-result-' + id].value, before.library.drafts[id].result);
    assert.equal(nodes['trial-notes-' + id].value, before.library.drafts[id].notes);
    assert.equal(item.open, true);
    assert.equal(nodes.libraryFilter.value, 'all');
    assert.equal(nodes.promptSearch.value, '');
    assert.deepEqual([focusCount, scrollCount, filterCount], [1,1,1]);
  }
});

test('opening an unknown format is a no-op rather than a context change', () => {
  const source = read('handouts.js');
  const open = source.slice(source.indexOf('  function openFormat('), source.indexOf('  function renderLibrary()'));
  const fail = () => {throw new Error('Unknown format must not change UI or state');};
  vm.runInNewContext('"use strict";\n' + open + '\nopenFormat("unknown-format");', {
    all: () => [], $: fail, ensureLibrary: fail, filterLibrary: fail, announce: fail
  });
});

test('H1 visibly permits starting without a task goal before the optional AI proposal', () => {
  const first = html.slice(html.indexOf('id="hypothesen"'), html.indexOf('id="foerderbaustein"'));
  assert.match(first, /kann nach der KI-Antwort ergänzt werden/);
  assert.match(first, /Lassen Sie das Feld zunächst leer/);
  assert.match(first, /aufgabenbezogenen Zielvorschlag/);
  assert.doesNotMatch(first, /(?:darf|muss).*erst nach der KI-Arbeit ausgefüllt/);
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

test('four further examples are complete, distinct and link to available formats', () => {
  assert.equal(moreExamples.length, 4);
  assert.equal(new Set(moreExamples.map(example => example.id)).size, moreExamples.length);
  const allIds = new Set([...formats, ...extras].map(item => item.id));
  for (const example of moreExamples) {
    for (const key of ['id','title','condition','task','solution','criterion','limit']) assert.ok(typeof example[key] === 'string' && example[key].trim(), example.id + ': ' + key);
    assert.match(example.condition, /Anderer Beispielfall.*Arbeitsannahme/);
    assert.ok(example.formats.length);
    for (const id of example.formats) assert.ok(allIds.has(id), id);
  }
});

test('free ideas are an additional open helper, not a restriction or replacement for the 28 templates', () => {
  for (const key of ['id','title','purpose','when','output','check','prompt']) assert.ok(typeof freeIdeas[key] === 'string' && freeIdeas[key].trim(), key);
  assert.ok(![...formats, ...extras].some(item => item.id === freeIdeas.id));
  const p = C.fillTemplate(freeIdeas.prompt, {grade:'6',task:'2/3 + 1/4',goal:'Gemeinsame Teilgröße erklären',baseline:unicode});
  for (const phrase of ['nicht als Begrenzung','weitere Alternativen','Beschränke dich nicht','begründete Kombinationen','keine verpflichtende Reihenfolge','erst nach meiner fachlichen Prüfung','Ein vorgegebenes Format ist nicht erforderlich']) assert.ok(p.includes(phrase), phrase);
  assert.match(p, /Fehlen Ziel oder entscheidende Angaben/);
  assert.match(p, /Keine Diagnose aus einer einzelnen Fehllösung/);
  assert.doesNotMatch(p, /Arbeite nur am ausgewählten Format/);
  assert.ok(p.includes(unicode));
  assert.doesNotMatch(p, /\{\{(?:klasse|aufgabe|ziel|ausgangslage)\}\}/);
});

test('custom builder prompts use the chosen own idea rather than an unrelated template or unselected proposals', () => {
  const b = ownIdeaBuilder(), before = clone(b);
  const p = C.builderPrompt(b, formats[0]);
  assert.ok(p.includes(b.customFormat));
  assert.ok(p.includes(b.goal));
  assert.ok(p.includes(C.contextForBuilder(b)));
  assert.match(p, /begründete Kombination/);
  assert.match(p, /nicht auf einen vorgegebenen Formatkatalog/);
  assert.ok(!p.includes(formats[0].prompt.split('\n\n')[1]));
  assert.ok(!p.includes(b.formatIdeasResult));
  for (const phrase of ['genau ein Förderziel','Erfolgskontrolle ohne KI','keine Kinderantwort erfinden','belegt weder die Diagnose noch eine Lernwirkung']) assert.ok(p.includes(phrase), phrase);
  assert.deepEqual(b, before);
});

test('new optional idea fields retain version 2 and initialize in old imports and legacy migration', () => {
  for (const key of ideaFields) assert.equal(C.builder()[key], '');
  const old = C.empty(), b = C.builder(C.cases[4]);
  for (const key of ideaFields) delete b[key];
  b.format = formats[0].id; b.prompt = unicode; old.builders.push(b);
  assert.doesNotThrow(() => C.validate(old));
  const imported = C.mergeImport(C.empty(), old).builders.at(-1);
  assert.equal(imported.format, b.format); assert.equal(imported.prompt, unicode);
  for (const key of ideaFields) assert.equal(imported[key], '');
  const migrated = C.migrateLegacy(JSON.stringify({buildDraft:unicode, 'module-text-plan':'Alter Plan'}));
  for (const key of ideaFields) assert.equal(migrated.builders[0][key], '');
  assert.equal(migrated.builders[0].legacyOriginal['module-text-plan'], 'Alter Plan');
  assert.equal(migrated.version, 2); assert.equal(C.KEY, 'digitale-handouts-v2');
});

test('all new builder idea fields reject non-text values without changing the state', () => {
  for (const key of ideaFields) for (const value of [null, 0, false, [], {}]) {
    const state = C.empty(); state.builders.push(ownIdeaBuilder()); state.builders[0][key] = value;
    const before = clone(state);
    assert.throws(() => C.validate(state), /Ungültiges Textfeld/);
    assert.deepEqual(state, before);
  }
});

test('own ideas, proposed alternatives and free-helper drafts survive repeated export/import roundtrips', () => {
  const state = C.empty(); state.builders.push(ownIdeaBuilder());
  for (const key of ideaFields) state.builders[0][key] += '\n' + unicode;
  const draft = {text:'Freier Prompt\n' + unicode, source:'Kontext A', result:'Eigene Idee ohne KI', notes:unicode};
  state.library.drafts[freeIdeas.id] = draft;
  state.importedLibraries = [{mode:'own', drafts:{[freeIdeas.id]:{...draft, source:'Archivkontext'}}}];
  const once = C.mergeImport(C.empty(), JSON.parse(C.serializeBackup(state)));
  const twice = C.mergeImport(C.empty(), JSON.parse(C.serializeBackup(once)));
  for (const key of ['format', ...ideaFields, 'draft','final','adjustments']) assert.equal(twice.builders.at(-1)[key], state.builders[0][key]);
  assert.deepEqual(twice.library.drafts[freeIdeas.id], draft);
  assert.equal(twice.importedLibraries[0].drafts[freeIdeas.id].source, 'Archivkontext');
  assert.equal(twice.version, 2);
});

test('actual load and save retain free ideas and normalize old v2 builders in local storage', () => {
  const stored = C.empty(); stored.builders.push(ownIdeaBuilder(), C.builder());
  for (const key of ideaFields) delete stored.builders[1][key];
  stored.library.drafts[freeIdeas.id] = {text:'',source:'Eigener Fall',result:unicode,notes:'Eigene Prüfung'};
  const data = new Map([[C.KEY, JSON.stringify(stored)]]), dom = fakeNodes();
  const context = {C, state:C.empty(), lastSaved:'', recoveryRaw:'', storageBlocked:false,
    localStorage:{getItem:key => data.get(key) ?? null,setItem:(key,value) => data.set(key,value)},
    $:dom.$, notice:() => {}, syncPrintPage:() => {}, announce:() => {}};
  runApp(['load','save'], context, 'load(); save();');
  const saved = JSON.parse(data.get(C.KEY));
  for (const key of ideaFields) {assert.equal(saved.builders[0][key], stored.builders[0][key]);assert.equal(saved.builders[1][key], '');}
  assert.deepEqual(saved.library.drafts[freeIdeas.id], stored.library.drafts[freeIdeas.id]);
  assert.equal(context.storageBlocked, false);
});

test('source fingerprints preserve old-template compatibility and flag changed selected own ideas', () => {
  const b = ownIdeaBuilder(), context = {C, build:() => b};
  const first = runApp(['buildSource','formatIdeasSource'], context, '[buildSource(),formatIdeasSource()]');
  b.customFormat += '\nGeänderte Vorgehensweise';
  const changed = runApp(['buildSource','formatIdeasSource'], context, '[buildSource(),formatIdeasSource()]');
  assert.notEqual(changed[0], first[0]); assert.notEqual(changed[1], first[1]);
  b.format = formats[0].id;
  assert.equal(runApp(['buildSource'], context, 'buildSource()'), JSON.stringify([C.contextForBuilder(b),b.focus,b.format]));
  const templateSource = runApp(['buildSource'], context, 'buildSource()');
  b.customFormat += '\nNoch nicht ausgewählter Wunsch';
  assert.equal(runApp(['buildSource'], context, 'buildSource()'), templateSource);
  const before = clone(b); b.formatIdeasResult += '\nWeitere Antwort';
  assert.equal(runApp(['formatIdeasSource'], context, 'formatIdeasSource()'), runApp(['formatIdeasSource'], {C,build:() => before}, 'formatIdeasSource()'));
});

test('open idea generation needs no existing goal or format and never auto-selects a proposal', async () => {
  const b = ownIdeaBuilder(); b.goal = ''; b.format = ''; b.formatIdeasPrompt = '';
  const before = clone(b), dom = fakeNodes();
  await runApp(['formatIdeasSource','regenerateFormatIdeas'], {C, freeIdeas, build:() => b, $:dom.$, save:() => {}, promptStatus:() => {}, announce:() => {}, ask:async() => true}, 'regenerateFormatIdeas()');
  assert.ok(b.formatIdeasPrompt.includes(b.task)); assert.ok(b.formatIdeasPrompt.includes(b.customFormat));
  assert.match(b.formatIdeasPrompt, /Fehlen Ziel oder entscheidende Angaben/);
  assert.equal(dom.$('formatIdeasPrompt').value, b.formatIdeasPrompt);
  assert.ok(b.formatIdeasPromptSource);
  for (const key of Object.keys(before).filter(key => !['formatIdeasPrompt','formatIdeasPromptSource'].includes(key))) assert.deepEqual(b[key], before[key], key);
});

test('cancelled idea regeneration and incomplete evidence cannot overwrite saved work', async () => {
  for (const change of [b => {}, b => {b.task = '';}, b => {b.evidenceStatus = 'observed';b.evidence = '';}, b => {b.evidenceStatus = 'assumed';b.assumption = '';}]) {
    const b = ownIdeaBuilder(); change(b); const before = clone(b), dom = fakeNodes();
    await runApp(['formatIdeasSource','regenerateFormatIdeas'], {C, freeIdeas, build:() => b, $:dom.$, save:() => assert.fail('must not save'), promptStatus:() => {}, announce:() => {}, ask:async() => false}, 'regenerateFormatIdeas()');
    assert.deepEqual(b, before);
  }
});

test('choosing a custom idea is explicit, cancelable and preserves existing prompts and materials', async () => {
  const b = ownIdeaBuilder(); b.format = formats[0].id; const before = clone(b), dom = fakeNodes();
  const context = {build:() => b, $:dom.$, ask:async() => false, save:() => {}, renderFormat:() => {}, promptStatus:() => {}, announce:() => {}};
  await runApp(['chooseCustomFormat'], context, 'chooseCustomFormat()'); assert.deepEqual(b, before);
  context.ask = async() => true;
  await runApp(['chooseCustomFormat'], context, 'chooseCustomFormat()');
  assert.deepEqual(b, {...before,format:'custom'});
  b.customFormat = '   '; b.format = formats[0].id; const emptyBefore = clone(b);
  await runApp(['chooseCustomFormat'], context, 'chooseCustomFormat()'); assert.deepEqual(b, emptyBefore);
});

test('H2 format selection offers every template in all mode and always permits a custom idea', () => {
  const b = ownIdeaBuilder(), dom = fakeNodes();
  const context = {build:() => b,formats,$:dom.$,option:(value,label) => '<option value="' + value + '">' + label + '</option>'};
  for (const focus of ['all','A','B','C','D']) {
    b.focus = focus; const before = clone(b); runApp(['renderFormat'], context, 'renderFormat()');
    const markup = dom.$('build-format').innerHTML;
    assert.ok(markup.includes('value="custom"'));
    const expected = formats.filter(format => focus === 'all' || format.category === focus);
    for (const format of expected) assert.ok(markup.includes('value="' + format.id + '"'));
    assert.equal((markup.match(/<option /g) || []).length, expected.length + 2);
    assert.deepEqual(b, before);
  }
});

test('changing the H2 category never erases a custom choice or its saved ideas and material', () => {
  const binding = app.split('\n').find(line => line.trim().startsWith("all('[data-build]').forEach") && line.includes('addEventListener'));
  assert.ok(binding);
  const b = ownIdeaBuilder(), before = clone(b);
  let handler;
  const el = {dataset:{build:'focus'},value:'D',addEventListener:(name,callback) => {handler = callback;}};
  vm.runInNewContext(binding, {all:() => [el],build:() => b,formats,renderFormat:() => {},evidenceVisibility:() => {},selectors:() => {},save:() => {},promptStatus:() => {},updateLibraryContext:() => {}});
  handler(); assert.deepEqual(b, {...before,focus:'D'});
});

test('generating a custom material prompt requires an explicit idea and retains proposal results', async () => {
  const b = ownIdeaBuilder(); b.prompt = ''; b.customFormat = ''; const before = clone(b), dom = fakeNodes();
  const context = {C, formats,build:() => b,$:dom.$,save:() => {},promptStatus:() => {},announce:() => {},ask:async() => true};
  await runApp(['buildSource','regenerate'], context, 'regenerate("builder")'); assert.deepEqual(b, before);
  b.customFormat = 'Ein Spiel mit selbst erfundenen Aufgaben';
  await runApp(['buildSource','regenerate'], context, 'regenerate("builder")');
  assert.ok(b.prompt.includes(b.customFormat)); assert.equal(b.formatIdeasResult, before.formatIdeasResult);
  assert.equal(b.draft, before.draft); assert.equal(b.final, before.final);
});

test('H3 free-helper inputs save without AI and retain the original source after a context change', () => {
  const state = C.empty(), dom = fakeNodes(); let source = 'Kontext A', saves = 0;
  const context = {state,$:dom.$,librarySource:() => source,save:() => saves++,updateLibraryContext:() => {}};
  context.event = {target:{dataset:{libraryResult:freeIdeas.id},value:'Eigene Idee ohne KI\n' + unicode}};
  runApp(['saveLibraryInput'], context, 'saveLibraryInput(event)');
  source = 'Kontext B'; context.event = {target:{dataset:{libraryNotes:freeIdeas.id},value:'Eigene Prüfung'}};
  runApp(['saveLibraryInput'], context, 'saveLibraryInput(event)');
  assert.deepEqual(clone(state.library.drafts[freeIdeas.id]), {text:'',source:'Kontext A',result:'Eigene Idee ohne KI\n' + unicode,notes:'Eigene Prüfung'});
  assert.equal(saves, 2);
});

test('free-helper regeneration is cancelable and archives a changed-context result before replacement', async () => {
  const state = C.empty(), dom = fakeNodes();
  state.library.drafts[freeIdeas.id] = {text:'Eigener Prompt',source:'Alter Kontext',result:unicode,notes:'Prüfung'};
  const before = clone(state), context = {C,state,lookupFormat,$:dom.$,ask:async() => false,libraryContext:() => ({grade:'6',task:'2/3 + 1/4',goal:'Neues Ziel',baseline:'Neue Annahme'}),librarySource:() => 'Neuer Kontext',save:() => {},announce:() => {},updateLibraryContext:() => {},renderImportedLibraries:() => {},resizeOpenPrompts:() => {}};
  await runApp(['ensureLibrary'], context, 'ensureLibrary(' + JSON.stringify(freeIdeas.id) + ',true)');
  assert.deepEqual(context.state, before);
  context.ask = async() => true;
  await runApp(['ensureLibrary'], context, 'ensureLibrary(' + JSON.stringify(freeIdeas.id) + ',true)');
  assert.deepEqual(context.state.importedLibraries[0].drafts[freeIdeas.id], before.library.drafts[freeIdeas.id]);
  const active = context.state.library.drafts[freeIdeas.id];
  assert.equal(active.source, 'Neuer Kontext'); assert.equal(active.result, ''); assert.equal(active.notes, '');
  assert.ok(active.text.includes('2/3 + 1/4')); assert.equal(dom.$('library-' + freeIdeas.id).value, active.text);
  context.state.library.drafts[freeIdeas.id].result = 'Neuer eigener Entwurf';
  await runApp(['ensureLibrary'], context, 'ensureLibrary(' + JSON.stringify(freeIdeas.id) + ',true)');
  assert.equal(context.state.library.drafts[freeIdeas.id].result, 'Neuer eigener Entwurf');
  assert.equal(context.state.importedLibraries.length, 1);
});

test('archived free ideas render under their human-readable title with safely escaped notes and results', () => {
  const state = C.empty(), dom = fakeNodes();
  state.importedLibraries = [{drafts:{[freeIdeas.id]:{text:'Prompt <x>',source:'Kontext',result:unicode,notes:'</textarea><script>bad</script>'}}}];
  runApp(['renderImportedLibraries'], {state,lookupFormat,$:dom.$,esc:escapeHtml}, 'renderImportedLibraries()');
  const output = dom.$('importedLibraryList').innerHTML;
  assert.ok(output.includes(freeIdeas.title)); assert.ok(output.includes(escapeHtml(unicode)));
  assert.ok(output.includes('&lt;/textarea&gt;&lt;script&gt;'));
  assert.ok(!output.includes('<script>')); assert.equal(dom.$('importedLibraries').hidden, false);
});

test('copying stale H2 or H3 free-idea prompts requires confirmation and copies the exact edited text', async () => {
  for (const id of ['formatIdeasPrompt','library-' + freeIdeas.id]) {
    const b = ownIdeaBuilder(), state = C.empty(), dom = fakeNodes(), written = [], asked = [];
    state.library.drafts[freeIdeas.id] = {text:unicode,source:'Früherer Kontext'}; dom.$(id).value = unicode;
    const context = {state,build:() => b,$:dom.$,formatIdeasSource:() => 'Aktueller Kontext',librarySource:() => 'Aktueller Kontext',ask:async message => {asked.push(message);return false;},navigator:{clipboard:{writeText:async text => written.push(text)}},announce:() => {}};
    await runApp(['copy'], context, 'copy(' + JSON.stringify(id) + ')');
    assert.equal(written.length, 0); assert.match(asked[0], /früheren Kontext/);
    context.ask = async message => {asked.push(message);return true;};
    await runApp(['copy'], context, 'copy(' + JSON.stringify(id) + ')');
    assert.deepEqual(written, [unicode]);
  }
});

test('free-idea copy keeps placeholder confirmation and manual clipboard fallback', async () => {
  const state = C.empty(), dom = fakeNodes(), id = 'library-' + freeIdeas.id;
  state.library.drafts[freeIdeas.id] = {text:'Wunsch: [selbst ergänzen]',source:'A'}; dom.$(id).value = state.library.drafts[freeIdeas.id].text;
  const prompts = [], context = {state,$:dom.$,librarySource:() => 'A',navigator:{},announce:() => {},ask:async message => {prompts.push(message);return false;}};
  await runApp(['copy'], context, 'copy(' + JSON.stringify(id) + ')'); assert.equal(dom.$('copyFallback').open, false);
  context.ask = async message => {prompts.push(message);return true;};
  await runApp(['copy'], context, 'copy(' + JSON.stringify(id) + ')');
  assert.ok(prompts.every(message => message.includes('Platzhalter')));
  assert.equal(dom.$('copyFallback').open, true); assert.equal(dom.$('fallbackText').value, dom.$(id).value);
});

test('H2 text and print distinguish chosen custom ideas from unselected wishes and retain proposals', () => {
  const b = ownIdeaBuilder(), dom = fakeNodes(), context = {C,build:() => b,formats,checks:[],entry:(label,value) => label + '\n' + (value || '—') + '\n',$:dom.$,esc:escapeHtml};
  const text = runApp(['builderText'], context, 'builderText()');
  for (const value of [b.customFormat,b.formatIdeasPrompt,b.formatIdeasResult,b.draft,b.final]) assert.ok(text.includes(value), value);
  assert.ok(text.includes('Gewählte Vorgehensweise\n' + b.customFormat));
  b.format = formats[0].id;
  const other = runApp(['builderText'], context, 'builderText()');
  assert.ok(other.includes('Gewählte Vorgehensweise\n' + formats[0].title));
  assert.ok(other.includes('nicht automatisch ausgewählt\n' + b.customFormat));
  runApp(['builderText','preparePrint'], context, 'preparePrint("builder")');
  for (const value of [b.customFormat,b.formatIdeasPrompt,b.formatIdeasResult,b.draft,b.final]) assert.ok(dom.$('printSummary').innerHTML.includes(escapeHtml(value)));
});

test('explicit free-helper print preserves own non-AI results and notes without silently generating a prompt', async () => {
  const state = C.empty(), dom = fakeNodes();
  state.library.drafts[freeIdeas.id] = {text:'',source:'Kontext',result:unicode,notes:'Eigene Prüfung <wichtig>'};
  const before = clone(state); let printed = 0;
  const context = {state,lookupFormat,C,$:dom.$,esc:escapeHtml,entry:(label,value) => label + '\n' + (value || '—') + '\n',window:{print:() => printed++},libraryContext:() => {throw new Error('Existing empty prompt must stay empty');}};
  await runApp(['preparePrint','print'], context, 'print("library",' + JSON.stringify(freeIdeas.id) + ')');
  const output = dom.$('printSummary').innerHTML;
  assert.ok(output.includes(freeIdeas.title)); assert.ok(output.includes(escapeHtml(unicode))); assert.ok(output.includes('Eigene Prüfung &lt;wichtig&gt;'));
  assert.ok(!output.includes('Entwickle zunächst drei')); assert.equal(printed, 1); assert.deepEqual(state, before);
});

test('keyboard print preparation targets the open free-idea panel while explicit buttons retain their own target', () => {
  const dom = fakeNodes(), calls = []; dom.$('freeIdeasPanel').open = true;
  const context = {C,freeIdeas,$:dom.$,location:{hash:'#bibliothek'},all:() => [{dataset:{format:formats[0].id},hidden:false}],preparePrint:(...args) => calls.push(args)};
  runApp(['syncPrintPage'], context, 'syncPrintPage()'); assert.deepEqual(calls, [['library',freeIdeas.id]]);
  dom.$('freeIdeasPanel').open = false; calls.length = 0;
  runApp(['syncPrintPage'], context, 'syncPrintPage()'); assert.deepEqual(calls, [['library',formats[0].id]]);
  assert.match(app, /print\('library',pf\.dataset\.printFormat\)/);
});

test('HTML exposes independent own-idea inputs, explicit generation/copy/print and a nonexclusive guide', () => {
  for (const id of ['build-customFormat','generateFormatIdeas','formatIdeasPrompt','build-formatIdeasResult','chooseCustomFormat','freeIdeasPanel','generateFreeIdeas','library-' + freeIdeas.id,'trial-result-' + freeIdeas.id,'trial-notes-' + freeIdeas.id,'moreExamples']) assert.ok(html.includes('id="' + id + '"'), id);
  for (const key of ['customFormat','formatIdeasPrompt','formatIdeasResult']) assert.ok(html.includes('data-build="' + key + '"'));
  assert.match(html, /keine vollständige Liste, keine Pflichtauswahl/);
  assert.match(html, /ohne KI ausfüllbar/);
  assert.ok(html.includes('data-print-format="' + freeIdeas.id + '"'));
  assert.ok(app.includes("$('freeIdeasPanel').addEventListener('input',saveLibraryInput)"));
  assert.ok(app.includes("$('generateFreeIdeas').addEventListener('click',()=>ensureLibrary(freeIdeas.id,true))"));
  assert.ok(app.includes("$('moreExamples').addEventListener('click'"));
});

test('every generated prompt and the independent guide receive full-text and text-download controls', () => {
  const selector = app.match(/const promptSelector='([^']+)'/)[1];
  for (const id of ['diagnosisPrompt','hypothesisPrompt','goalPrompt','formatIdeasPrompt','builderPrompt','independentPrompt']) {
    assert.ok(selector.includes('#' + id), id);
    assert.ok(html.includes('id="' + id + '"'), id);
  }
  assert.ok(selector.includes('[data-library-prompt]'));
  assert.match(html, /Die Seite erstellt nur den Prompttext/);
  assert.match(html, /ruft keine KI auf und füllt Ergebnisfelder nicht automatisch/);
  assert.match(html, /Kopiert wird genau der angezeigte Text/);
  const independent = html.match(/<textarea id="independentPrompt" readonly>([\s\S]*?)<\/textarea>/)[1];
  for (const phrase of ['Tatsächlich vorliegende Lösung','Vermutungen','Ziel','Gewünschte Ausgabe','Erfinde keine Kinderantworten','Behaupte keine gesicherte Diagnose oder Lernwirkung']) assert.ok(independent.includes(phrase), phrase);
  assert.ok(html.includes('data-copy="independentPrompt"'));
});

test('prompt tools install once per textarea and never alter the full prompt value', () => {
  const rows = [], elements = ['formatIdeasPrompt','library-' + freeIdeas.id,'independentPrompt'].map(id => ({id,dataset:{},value:unicode,after:row => rows.push(row)}));
  const context = {promptSelector:'test-selector',all:() => elements,esc:escapeHtml,document:{createElement:() => ({})}};
  runApp(['installPromptTools'], context, 'installPromptTools(); installPromptTools();');
  assert.equal(rows.length, elements.length);
  elements.forEach((el,i) => {
    assert.equal(el.value, unicode); assert.equal(el.dataset.toolsReady, 'true');
    assert.ok(rows[i].innerHTML.includes('data-expand-prompt="' + el.id + '"'));
    assert.ok(rows[i].innerHTML.includes('data-save-prompt="' + el.id + '"'));
    assert.ok(rows[i].innerHTML.includes('aria-controls="' + el.id + '"'));
  });
});

test('expanded prompts resize to their whole text only when visible without changing content', () => {
  const elements = [
    {dataset:{expanded:'true'},getClientRects:() => [{}],scrollHeight:1900,style:{height:'200px'},value:unicode},
    {dataset:{expanded:'true'},getClientRects:() => [],scrollHeight:2200,style:{height:'300px'},value:unicode},
    {dataset:{expanded:'false'},getClientRects:() => [{}],scrollHeight:2400,style:{height:'400px'},value:unicode}
  ];
  runApp(['resizeOpenPrompts'], {promptSelector:'test-selector',all:() => elements}, 'resizeOpenPrompts()');
  assert.deepEqual(elements.map(el => el.style.height), ['1904px','300px','400px']);
  assert.ok(elements.every(el => el.value === unicode));
});

test('full-prompt toggle and TXT export use the displayed text without generating or selecting anything', () => {
  const binding = app.split('\n').find(line => line.includes("document.addEventListener('click'") && line.includes('[data-expand-prompt]'));
  assert.ok(binding); const dom = fakeNodes(), downloads = []; let handler, resized = 0;
  const el = dom.$('formatIdeasPrompt'); el.dataset = {}; el.style = {height:''}; el.value = unicode;
  const context = {$:dom.$,document:{addEventListener:(type,callback) => {handler = callback;}},resizeOpenPrompts:() => resized++,download:(...args) => downloads.push(args),announce:() => {}};
  vm.runInNewContext(binding, context);
  const button = {dataset:{expandPrompt:el.id = 'formatIdeasPrompt'},setAttribute(name,value) {this[name] = value;}};
  const toggleEvent = {target:{closest:selector => selector === '[data-expand-prompt]' ? button : null}};
  handler(toggleEvent); assert.equal(el.dataset.expanded, 'true'); assert.equal(button['aria-expanded'], 'true'); assert.equal(resized, 1);
  handler(toggleEvent); assert.equal(el.dataset.expanded, 'false'); assert.equal(button['aria-expanded'], 'false'); assert.equal(el.style.height, '');
  const downloadEvent = {target:{closest:selector => selector === '[data-save-prompt]' ? {dataset:{savePrompt:'formatIdeasPrompt'}} : null}};
  handler(downloadEvent); assert.deepEqual(downloads, [['Mathematik-formatIdeasPrompt-Prompt.txt',unicode]]);
  el.value = '   '; handler(downloadEvent); assert.equal(downloads.length, 1);
});

test('the independent prompt guide copies exactly its visible template after placeholder confirmation', async () => {
  const text = html.match(/<textarea id="independentPrompt" readonly>([\s\S]*?)<\/textarea>/)[1];
  const dom = fakeNodes(), copied = [], questions = []; dom.$('independentPrompt').value = text;
  await runApp(['copy'], {$:dom.$,ask:async question => {questions.push(question);return true;},navigator:{clipboard:{writeText:async value => copied.push(value)}},announce:() => {}}, 'copy("independentPrompt")');
  assert.deepEqual(copied, [text]); assert.equal(questions.length, 1); assert.match(questions[0], /Platzhalter/);
});

test('library rendering restores the free helper beside all 28 templates without truncating stored text', () => {
  const state = C.empty(), dom = fakeNodes(), long = unicode.repeat(100), ids = [freeIdeas.id,formats[0].id];
  for (const id of ids) state.library.drafts[id] = {text:long,source:'Alt',result:'Eigene Idee ' + id,notes:'Notiz ' + id};
  const elements = key => ids.map(id => {const el = dom.$(key + id);el.dataset = {[key === 'library-' ? 'libraryPrompt' : key === 'trial-result-' ? 'libraryResult' : 'libraryNotes']:id};return el;});
  const bySelector = {'[data-library-prompt]':elements('library-'),'[data-library-result]':elements('trial-result-'),'[data-library-notes]':elements('trial-notes-'),'.prompt-item':[]};
  let toolInstalls = 0;
  runApp(['renderLibrary'], {state,library:[...formats,...extras],formats,$:dom.$,all:selector => bySelector[selector] || [],esc:escapeHtml,exampleMarkup:() => '',filterLibrary:() => {},updateLibraryContext:() => {},renderImportedLibraries:() => {},installPromptTools:() => toolInstalls++}, 'renderLibrary()');
  assert.equal((dom.$('promptList').innerHTML.match(/class="prompt-item"/g) || []).length, 28);
  assert.equal(toolInstalls, 1);
  for (const id of ids) {
    assert.equal(dom.$('library-' + id).value, long);
    assert.equal(dom.$('trial-result-' + id).value, state.library.drafts[id].result);
    assert.equal(dom.$('trial-notes-' + id).value, state.library.drafts[id].notes);
  }
});
