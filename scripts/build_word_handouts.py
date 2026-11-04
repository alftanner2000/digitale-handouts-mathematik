"""Build three new handouts from retained DOCX packages; originals are read-only."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from copy import deepcopy
from hashlib import sha256
import json
import re
import subprocess
from lxml import etree as E

ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / '.qa-word'
NODE = '/Users/arneabel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W = '{' + NS['w'] + '}'
XML = '{http://www.w3.org/XML/1998/namespace}'
REFERENCES = {
    1: ('Handout 2 - Fehleranalyse Uebungsblatt.docx', '8dd6cd67eafcf1f36c547b419081b4fdc74b2fbfc3c3070e762860d7bfdde148'),
    2: ('Handout 3 - Foerderbaustein-Arbeitsvorlage.docx', '6c857f2457128f0a459a0eb329adf3f5492677c01ae6087e7903914b35c097b9'),
    3: ('Handout 1 - Prompt-Bibliothek Mathematik.docx', '84725867b1d351950ccb5bcef01e0433fd9312849b0bee5d0c1cb99bb3602514'),
}
OUTPUTS = {1:'Handout 1 - Hypothesenbildung.docx', 2:'Handout 2 - Foerderbaustein entwickeln.docx', 3:'Handout 3 - Tool- und Promptbibliothek.docx'}
EDITABLE = {'word/document.xml','word/styles.xml','word/header1.xml','word/footer1.xml','word/settings.xml','docProps/core.xml'}

def node(tag, attrs=None, text=None):
    el = E.Element(W + tag)
    for k,v in (attrs or {}).items(): el.set(W+k,str(v))
    if text is not None: el.text=text
    return el

def set_child(parent, tag, attrs):
    for old in parent.findall(W+tag): parent.remove(old)
    el=node(tag,attrs); parent.append(el); return el

def xml_bytes(el):
    return E.tostring(el,xml_declaration=True,encoding='UTF-8',standalone=True)

def heading_text(text):
    return re.sub(r'\s+', ' ', re.sub(r'[^\w\sÄÖÜäöüß]', ' ', text)).strip()

class Handout:
    def __init__(self, number):
        self.number=number
        name, expected=REFERENCES[number]
        self.source=ROOT/name
        assert sha256(self.source.read_bytes()).hexdigest()==expected, name
        with ZipFile(self.source) as z:
            self.parts={n:z.read(n) for n in z.namelist()}
        self.original=dict(self.parts)
        self.tree=E.fromstring(self.parts['word/document.xml'])
        self.body=self.tree.find(W+'body')
        self.section=deepcopy(self.body.find(W+'sectPr'))
        for child in list(self.body): self.body.remove(child)
        self.font='Arial' if number==2 else 'Calibri'
        self.size=21 if number==3 else 22
        self.styles=E.fromstring(self.parts['word/styles.xml'])
        for s in self.styles.findall(W+'style'):
            sid=s.get(W+'styleId')
            if sid in ['Normal','Title','Subtitle','Heading1','Heading2','Header','FieldLabel']:
                r=s.find(W+'rPr')
                if r is None:r=node('rPr');s.append(r)
                set_child(r,'color',{'val':'000000'})
                set_child(r,'rFonts',{'ascii':self.font,'hAnsi':self.font,'eastAsia':self.font})
                for k in ['pBdr']:
                    for el in s.findall('w:pPr/w:'+k,NS):el.getparent().remove(el)
                if sid=='Normal':set_child(r,'sz',{'val':self.size})
                if sid=='Title':
                    set_child(r,'sz',{'val':40 if number!=2 else 48});set_child(r,'b',{})
        self.records=[]

    def p(self,text='',style=None,bold=False,size=None,before=0,after=100,keep=False,page=False,italic=False,color='000000',lines=None):
        p=node('p');pr=node('pPr');p.append(pr)
        if style:pr.append(node('pStyle',{'val':style}))
        pr.append(node('spacing',{'before':before,'after':after,'line':260,'lineRule':'auto'}))
        pr.append(node('widowControl'))
        if keep:pr.append(node('keepNext'))
        if page:pr.append(node('pageBreakBefore'))
        for i,line in enumerate(text.split('\n')):
            r=node('r');rpr=node('rPr');r.append(rpr)
            rpr.append(node('rFonts',{'ascii':self.font,'hAnsi':self.font}))
            rpr.append(node('sz',{'val':size or self.size}));rpr.append(node('color',{'val':color}))
            if bold:rpr.append(node('b'))
            if italic:rpr.append(node('i'))
            if i:r.append(node('br'))
            t=node('t',text=line);t.set(XML+'space','preserve');r.append(t);p.append(r)
        self.body.append(p);return p

    def title(self,text,sub):
        self.p('DEEPDIVEKI  LEHRKRÄFTEFORTBILDUNG',size=17,bold=True,after=70,keep=True)
        self.p(heading_text(text),'Title',bold=True,size=40 if self.number!=2 else 48,after=150,keep=True)
        self.p(sub,bold=True,size=23,after=180,keep=True)

    def h(self,text,page=False):
        return self.p(heading_text(text),'Heading1',bold=True,size=28,before=160,after=100,keep=True,page=page)

    def field(self,label,hint='Hier eintragen …',space=220):
        self.p(label,bold=True,after=40,keep=True)
        self.p(hint,italic=True,color='545B66',after=space)

    def table(self, rows, widths):
        tbl=node('tbl');pr=node('tblPr');tbl.append(pr)
        pr.append(node('tblW',{'w':sum(widths),'type':'dxa'}))
        pr.append(node('tblLayout',{'type':'fixed'}))
        borders=node('tblBorders')
        for side in ['top','left','bottom','right','insideH','insideV']:borders.append(node(side,{'val':'single','sz':4,'color':'D9D9D9'}))
        pr.append(borders)
        margins=node('tblCellMar')
        for side,w in [('top',70),('bottom',70),('left',90),('right',90)]:margins.append(node(side,{'w':w,'type':'dxa'}))
        pr.append(margins)
        grid=node('tblGrid')
        for w in widths:grid.append(node('gridCol',{'w':w}))
        tbl.append(grid)
        for ri,row in enumerate(rows):
            tr=node('tr');trpr=node('trPr');trpr.append(node('cantSplit'))
            if ri==0:trpr.append(node('tblHeader'))
            tr.append(trpr)
            for ci,text in enumerate(row):
                tc=node('tc');tcp=node('tcPr');tcp.append(node('tcW',{'w':widths[ci],'type':'dxa'}));tcp.append(node('vAlign',{'val':'center'}))
                if ri==0:tcp.append(node('shd',{'fill':'E8F0FD','val':'clear'}))
                tc.append(tcp)
                p=self.p(str(text),bold=ri==0,after=0,size=20 if self.number==3 else 21)
                self.body.remove(p);tc.append(p);tr.append(tc)
            tbl.append(tr)
        self.body.append(tbl);self.p('',size=4,after=60)

    def save(self):
        self.body.append(self.section)
        self.parts['word/document.xml']=xml_bytes(self.tree)
        self.parts['word/styles.xml']=xml_bytes(self.styles)
        settings=E.fromstring(self.parts['word/settings.xml']);set_child(settings,'updateFields',{'val':'true'});self.parts['word/settings.xml']=xml_bytes(settings)
        header=E.fromstring(self.parts['word/header1.xml'])
        for color in header.findall('.//w:color',NS):
            color.attrib.clear();color.set(W+'val','000000')
        self.parts['word/header1.xml']=xml_bytes(header)
        if self.number==2:
            f=E.fromstring(self.parts['word/footer1.xml'])
            for t in f.findall('.//w:t',NS):
                if 'Förderbaustein-Arbeitsvorlage' in (t.text or ''):t.text='Handout 2 Förderbaustein entwickeln  ·  Seite '
            self.parts['word/footer1.xml']=xml_bytes(f)
        core=E.fromstring(self.parts['docProps/core.xml'])
        for el in core:
            if E.QName(el).localname in ['title','subject']:el.text=OUTPUTS[self.number][:-5]
            if E.QName(el).localname in ['creator','lastModifiedBy']:el.text=''
        self.parts['docProps/core.xml']=xml_bytes(core)
        target=ROOT/OUTPUTS[self.number]
        with ZipFile(target,'w',ZIP_DEFLATED) as z:
            for name,data in self.parts.items():z.writestr(name,data)
        assert all(self.parts[n]==self.original[n] for n in self.original if n not in EDITABLE)
        assert E.tostring(self.section)==E.tostring(E.fromstring(self.original['word/document.xml']).find('w:body/w:sectPr',NS))
        assert sha256(self.source.read_bytes()).hexdigest()==REFERENCES[self.number][1]
        inventory={n:{'bytes':len(data),'sha256':sha256(data).hexdigest(),'classification':'editable' if n in EDITABLE else 'preserve-only','changed':data!=self.original[n]} for n,data in self.parts.items()}
        (QA/f'package-inventory-{self.number}.json').write_text(json.dumps(inventory,indent=2),encoding='utf8')
        print(target)

def make_h1():
    d=Handout(1)
    d.title('Handout 1 Hypothesenbildung','Praxisphase 1')
    d.p('Sie sichern höchstens zwei vorläufige Hypothesen und einen geplanten Prüfschritt zu einer konkreten Aufgabe. Ohne weitere tatsächliche Antwort bleibt die Hypothese offen. Förderübungen und Förderplanung gehören erst in Praxisphase 2.')
    d.h('Arbeitsweg')
    for t in ['1. Einen vorbereiteten Fall wählen oder einen fiktiven beziehungsweise vollständig anonymisierten eigenen Fall notieren.', '2. Das Aufgabenziel festhalten: Was soll das Kind hier können oder erklären?', '3. Den Prompt auf Seite 2 anpassen und die KI-Antwort fachlich prüfen. Beobachtung und Deutung getrennt halten.', '4. Höchstens zwei Hypothesen, eine ausgewählte Prüffrage oder Kontrastaufgabe und offene Informationen sichern.']:
        d.p(t,after=70)
    d.h('Vorbereitete Fälle')
    d.p('Wählen Sie genau einen Fall. Die notierten Ergebnisse sind fiktiv und erlauben noch keinen sicheren Schluss auf den Denkweg.',after=90)
    d.table([['Fall','Klasse','Aufgabe','Notierte Lösung'],['1','1','15 − 7','15 − 7 = 12'],['2','2','Zahlwort sechzehn notieren','61'],['3','3','503 − 78','503 − 78 = 575'],['4','4','6 · 7','6 · 7 = 13'],['5','6','½ + ⅓','½ + ⅓ = ⅖'],['6','5','3,5 + 12','3,5 + 12 = 4,7']],[550,800,3600,4688])
    d.field('Mein Fall oder eigene Aufgabe und Lösung','Fallnummer oder fiktive Aufgabe samt notierter Lösung …',180)
    d.field('Konkretes Aufgabenziel','Das Kind soll bei dieser Aufgabe …',140)
    d.p('Eine Zuordnung zu basalen Kompetenzen oder Grundvorstellungen ist hier keine Voraussetzung. Alltagssprachlich begründete Vermutungen sind zulässig.',size=20)
    d.h('Bearbeitbarer Prompt',page=True)
    d.p('Unterstütze mich bei der Vorbereitung einer förderorientierten mathematischen Diagnose. Aufgabe: [Aufgabe]. Aufgabenziel: [Ziel]. Vorliegende Schülerlösung beziehungsweise Äußerung: [Lösung]. Weitere tatsächlich bekannte Informationen: [Informationen oder „keine“].')
    d.p('Beschreibe zunächst ausschließlich, was an der vorliegenden Lösung beobachtbar ist. Formuliere danach höchstens zwei unterschiedliche, vorsichtige Diagnosehypothesen. Begründe ihre Plausibilität anhand der vorhandenen Hinweise, ohne einen Denkweg oder eine Äußerung des Kindes zu erfinden. Nenne zu jeder Hypothese eine offene Rückfrage oder eine kurze Kontrastaufgabe, mit der sie geprüft werden könnte. Beschreibe knapp, welche mögliche Antwort die Vermutung stützen beziehungsweise infrage stellen würde; kennzeichne diese Antworten ausdrücklich als hypothetisch. Benenne fehlende Informationen. Stelle keine gesicherte Diagnose und leite keine dauerhafte Eigenschaft des Kindes aus einem Einzelfehler ab. Erstelle jetzt keine Förderübungen, keinen Förderplan und keine Unterrichtsreihe.')
    d.h('Geprüfter Arbeitsstand')
    d.field('Beobachtung','Was steht tatsächlich in der Lösung oder wurde tatsächlich geäußert?',160)
    d.field('Hypothese 1 und gegebenenfalls Hypothese 2','Vorläufige Vermutung(en) und konkrete Hinweise aus der Lösung …',180)
    d.field('Ausgewählte Prüffrage oder Kontrastaufgabe','Welche zusätzliche Antwort könnte zwischen den Deutungen unterscheiden?',180)
    d.field('Offene Informationen','Was ist noch unbekannt? Erwartete Antworten ausdrücklich als hypothetisch markieren.',140)
    d.p('Prüfung: Sind Beobachtung und Vermutung getrennt? Gibt es höchstens zwei Hypothesen? Bleibt der Prüfschritt offen, solange keine tatsächliche weitere Antwort vorliegt?',bold=True,size=20)
    d.p('Sichern Sie diesen Arbeitsstand für Handout 2. Dort klären Sie später den Stand der Ausgangslage, bevor Sie einen Förderbaustein entwickeln. Dieser Übergang bestätigt noch keine Hypothese.',size=20)
    d.save()

def make_h2():
    d=Handout(2)
    d.title('Handout 2 Förderbaustein entwickeln','Praxisphase 2')
    d.p('Entwickeln Sie einen kleinen fachlich geprüften Förderbaustein zu genau einem beobachtbaren Ziel. Diese Word-Vorlage ist ein gleichwertiges Arbeitsmittel zur Eingabemaske auf der Website. Sichern Sie neue Entwürfe unter einem eigenen Namen.')
    d.h('Zwei gleichwertige Einstiege')
    d.p('A  Fall aus Praxisphase 1 übernehmen: Aufgabe, Ziel, Beobachtung, offene Hypothesen und geplanten Prüfschritt kopieren. Neue tatsächliche Antworten gesondert ergänzen.')
    d.p('B  Neue Aufgabe oder neuen Fall wählen: einen vorbereiteten oder eigenen fiktiven beziehungsweise vollständig anonymisierten Fall verwenden. Handout 1 muss dafür nicht bearbeitet worden sein.')
    d.field('Mein Einstieg und Entwurfsname','A oder B; kurzer Name für diesen Entwurf …',120)
    d.field('Klasse und Aufgabe','Klasse beziehungsweise Stufe; mathematische Aufgabe …',160)
    d.field('Tatsächlich beobachtet','Notierte Lösung oder Äußerung; tatsächlich vorliegende Antwort auf eine Prüffrage …',200)
    d.field('Noch offen oder ausdrücklich angenommen','Offene Vermutung(en). Bei einem fiktiven Fall: Unter der Annahme, dass …',200)
    d.field('Ein beobachtbares Förderziel','Das Kind erklärt oder bearbeitet anschließend selbstständig …',160)
    d.field('Genau ein Schwerpunkt','Zum Beispiel Handlung Bild Symbol, gestufte Hilfen, strukturierte Rechenpäckchen oder verständnisorientierte Rückmeldung …',120)
    d.p('Optional: Ordnen Sie das Ziel fachlich über eine Grundvorstellung oder basale Kompetenz ein, wenn Sie den Bezug begründen können. Eine fehlende Zuordnung verhindert die Arbeit nicht.',size=20)
    d.h('Prompt für einen Förderbaustein',page=True)
    for t in [
        'Unterstütze mich beim Entwurf eines kleinen Förderbausteins. Klasse: [Klasse]. Aufgabe: [Aufgabe]. Ein beobachtbares Lernziel: [Ziel]. Tatsächliche Beobachtungen: [Beobachtungen]. Weitere tatsächlich vorliegende Antworten: [Antworten oder „keine“]. Offene Hypothesen: [Hypothesen oder „keine“]. Ausdrücklich gesetzte Arbeitsannahme: [Annahme oder „keine“]. Gewählter Schwerpunkt: [genau ein Schwerpunkt].',
        'Trenne Beobachtungen, offene Deutungen und Annahmen. Erfinde keine Antworten des Kindes. Benenne fehlende Angaben. Bei ungesicherter Ausgangslage plane ausdrücklich bedingt: „Unter der Annahme, dass …“. Wenn eine verantwortbare Planung ohne weitere Angabe nicht möglich ist, stelle eine gezielte Rückfrage.',
        'Entwirf zu genau diesem Ziel eine kurze fachlich korrekte Erklärung oder Darstellung und eine überschaubare Folge von drei bis fünf passenden Aufgaben. Zeige mindestens eine gestufte Hilfe: offene Orientierungsfrage, Darstellungshinweis und bei Bedarf konkreterer Teilimpuls. Lass einen wesentlichen Denkschritt beim Kind. Füge eine neue Aufgabe zur selbstständigen Erfolgskontrolle ohne KI hinzu.',
        'Gib die fachlich geprüften Lösungen und kurze Beobachtungskriterien für die Lehrkraft getrennt aus. Prüfe Zahlen, Einheiten, gleich große Teile und das gemeinsame Ganze, soweit sie zur Aufgabe gehören. Erkläre knapp, wie Aufgaben und Hilfe zum Ziel passen. Variiere Unterstützung statt ausschließlich die Zahlengröße. Benenne, was vor dem Einsatz noch geprüft werden muss. Der Entwurf ist weder eine Bestätigung der Diagnose noch ein Nachweis der Lernwirkung.'
    ]:d.p(t)
    d.h('Entwurf prüfen und überarbeiten')
    d.p('Übernehmen Sie die KI-Antwort zunächst als Entwurf. Prüfen Sie die Rechnungen unabhängig, lesen Sie jede Darstellung und testen Sie, ob die neue Kontrollaufgabe wirklich ohne die gleiche Hilfe bearbeitet werden kann.')
    d.field('Meine fachlichen Korrekturen','Welche Rechnung, Darstellung, Formulierung oder Hilfe ändere ich und warum?',240)
    d.field('Verwendeter Prompt oder Ablage des vollständigen Entwurfs','Angepassten Prompt und KI-Entwurf in dieser Datei ergänzen oder ihren Speicherort notieren …',200)
    d.h('Geprüfte Fassung für den Einsatz',page=True)
    d.p('Hier steht die überarbeitete Fassung, mit der Sie weiterarbeiten. Erweitern Sie die Felder bei Bedarf. Der Baustein bleibt auf ein Ziel und einen Schwerpunkt begrenzt.')
    d.field('Kurze Erklärung oder Darstellung','Fachlich geprüften Text, Handlung oder genaue Bildbeschreibung einfügen …',340)
    d.h('Überschaubare Aufgabenfolge')
    d.table([['Nr','Aufgabe und gegebenenfalls Begründungsauftrag'],['1','Hier eintragen …'],['2','Hier eintragen …'],['3','Hier eintragen …'],['4','Optional'],['5','Optional']],[650,8988])
    d.h('Gestufte Hilfe')
    d.field('Hilfe 1 Offene Orientierungsfrage','Eine Frage, die an Bedeutung oder bekannte Informationen anknüpft …',150)
    d.field('Hilfe 2 Darstellung oder Struktur','Hinweis auf eine passende Darstellung oder Beziehung …',150)
    d.field('Hilfe 3 Konkreter Teilimpuls','Nur wenn nötig; welcher wesentliche Schritt bleibt beim Kind?',150)
    d.h('Lösungen und selbstständige Kontrolle',page=True)
    d.field('Geprüfte Lösungen zu den Aufgaben','Lösungen und fachliche Begründungen getrennt vom Material für das Kind …',360)
    d.field('Neue Kontrollaufgabe ohne KI','Neue passende Aufgabe mit eigenständiger Erklärung oder Darstellung …',220)
    d.field('Lösung und Beobachtungskriterien der Kontrolle','Woran erkennen Sie die zum Ziel gehörende Leistung? Was bleibt bei einer richtigen Zahl noch offen?',260)
    d.h('Prüfung vor dem Einsatz')
    for t in ['[ ] Ausgangslage ist belegt oder als Annahme gekennzeichnet.', '[ ] Ein Ziel verbindet Erklärung, drei bis fünf Aufgaben und Hilfe.', '[ ] Rechnungen und Darstellungen stimmen; Lösungen liegen getrennt vor.', '[ ] Eine neue Kontrollaufgabe wird ohne KI und ohne dieselbe Hilfe bearbeitet.', '[ ] Sprache, Material und Hilfen passen zur Lerngruppe; persönliche Daten fehlen.']:
        d.p(t,after=50,size=20)
    d.field('Einsatz und Beobachtung danach','Sozialform, Material, Zeitpunkt; danach tatsächliche Beobachtung und nötige Anpassung …',140)
    d.p('Die fachliche Endkontrolle und die didaktische Verantwortung bleiben bei der Lehrkraft. Ein Materialentwurf belegt noch keine Lernwirkung.',bold=True,size=20)
    d.save()

def library_data():
    script="const fs=require('fs'),vm=require('vm');const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync(process.argv[1],'utf8'),c);process.stdout.write(JSON.stringify({formats:c.window.HANDOUT_FORMATS,extras:c.window.HANDOUT_EXTRAS}));"
    return json.loads(subprocess.check_output([NODE,'-e',script,str(ROOT/'library-data.js')],text=True))

def make_h3(data):
    d=Handout(3)
    d.title('Handout 3 Tool und Promptbibliothek','Offene Vertiefung')
    d.p('Wählen Sie ein Format nach seinem didaktischen Zweck. Die Bibliothek ist unabhängig von Praxisphase 1 und 2 nutzbar. Sie enthält 22 Aufgabenformate und sechs ergänzende Vorlagen. Für die begrenzte Hypothesenbildung nutzen Sie Handout 1, für einen zusammenhängenden Förderbaustein Handout 2.')
    d.h('So verwenden Sie die Vorlagen')
    d.p('Ein vollständiger Prompt besteht aus dem gemeinsamen Rahmen auf dieser Seite und genau einem formatspezifischen Auftrag. Kopieren Sie beides zusammen und ersetzen Sie die Platzhalter. Die digitale Bibliothek setzt beide Teile automatisch zusammen und lässt sie vor dem Kopieren bearbeiten. Ein neuer Fall benötigt neue Angaben; alte Falltexte nicht unbemerkt übernehmen.')
    d.h('Gemeinsamer Rahmen für jeden Prompt')
    first=data['formats'][0]['prompt'];context,instruction,safeguards=first.split('\n\n',2)
    d.p(context)
    d.p(safeguards)
    d.h('Werkzeuge passend zum Zweck')
    d.p('Für Textentwürfe oder dialogische Hinweise können Sie ein im eigenen Arbeitskontext freigegebenes KI-Werkzeug nutzen. Die vorhandenen Links zu ChatGPT, Claude, Gemini und Copilot finden Sie in der digitalen Tool-Übersicht. Kosten, Zugangsvoraussetzungen und schulische Freigaben müssen vor dem Einsatz geprüft werden; aus einem Link folgt keine Freigabe.')
    d.p('Für mathematische Prüfung: Rechnungen, Einheiten und Darstellungen unabhängig kontrollieren. Ein Rechenwerkzeug kann eine Rechnung prüfen, ersetzt aber keine Prüfung der Aufgabenbedeutung. Für Lernende: eigenen Versuch, begrenzte Hilfe und eine neue eigene Leistung vereinbaren.')
    d.p('Digitale Einstiege im Projekt: index.html#bibliothek · tools.html. Die Seite individualisierung.html ist eine optionale fächerübergreifende Vertiefung mit getrennten Lehrkraft- und Lernendenperspektiven.',size=20)
    d.h('Formate im Überblick',page=True)
    entries=data['formats']+data['extras']
    rows=[['Nr','Format','Seite']]
    for i,c in enumerate(entries):rows.append([str(i+1),c['title'],str(3+i//2)])
    d.table(rows,[500,8538,600])
    d.p('1–5 Verstehen und Darstellungen verbinden · 6–12 Üben und differenzieren · 13–18 Begründen, prüfen und übertragen · 19–22 Rückmeldung und Lernfortschritt · 23–28 Ergänzende Vorlagen.',size=20)
    for i,c in enumerate(entries):
        d.h(f'{i+1} {c["title"]}',page=i%2==0)
        d.p('Zweck: '+c['purpose'],after=50)
        d.p('Geeigneter Einsatz: '+c['when'],after=65)
        parts=c['prompt'].split('\n\n',2)
        assert parts[0]==context and parts[2]==safeguards, c['id']
        d.p('Formatspezifischer Auftrag',bold=True,after=40,keep=True)
        d.p(parts[1],after=65)
        d.p('Gewünschte Ausgabe: '+c['output'],after=50)
        d.p('Prüffrage: '+c['check'],bold=True,after=100)
    d.save()

if __name__=='__main__':
    QA.mkdir(exist_ok=True)
    data=library_data()
    assert len(data['formats'])==22 and len(data['extras'])==6
    make_h1();make_h2();make_h3(data)
    print('Created 3 new outputs; legacy files and preserve-only package parts unchanged.')
