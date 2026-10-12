// Genereaza docs/SportPulse_Etapa1_Requirements_Backlog.docx si docs/product_backlog_jira.csv
// Rulare: node tools/build_docs.js   (necesita pachetul npm "docx")
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  AlignmentType, HeadingLevel, WidthType, ShadingType, BorderStyle, LevelFormat,
  PageBreak, Footer, PageNumber, VerticalAlign,
} = require("docx");
const backlog = require("./backlog");

const ROOT = path.resolve(__dirname, "..");
const DOCS = path.join(ROOT, "docs");
const OUT_DOCX = path.join(DOCS, "SportPulse_Etapa1_Requirements_Backlog.docx");
const OUT_CSV = path.join(DOCS, "product_backlog_jira.csv");
const UC_PNG = path.join(DOCS, "diagrams", "use_case_diagram.png");

const APP = "SportPulse";
const PRIMARY = "1F3A5F";
const HEADER_FILL = "DCE6F2";
const ALT_FILL = "F5F8FC";
const CONTENT_W = 9638; // A4 cu margini de 2 cm

// ---------- helpers ----------
const border = { style: BorderStyle.SINGLE, size: 4, color: "B7C4D6" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 70, bottom: 70, left: 100, right: 100 };

function runs(text, opts = {}) {
  // suporta **bold** inline
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p) => p.startsWith("**")
    ? new TextRun({ text: p.slice(2, -2), bold: true, ...opts })
    : new TextRun({ text: p, ...opts }));
}
const P = (text, opts = {}) => new Paragraph({ children: runs(text, opts.run), spacing: { after: 120 }, ...opts.para });
const H1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const H2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const H3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
const bullet = (text, level = 0) => new Paragraph({ numbering: { reference: "bullets", level }, children: runs(text), spacing: { after: 60 } });
const numbered = (text, ref = "numbers") => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(text), spacing: { after: 60 } });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

function cell(content, width, { fill, bold = false, size = 19, align, keepNext = false } = {}) {
  const paras = (Array.isArray(content) ? content : [content]).map((c) =>
    c instanceof Paragraph ? c : new Paragraph({ alignment: align, keepNext, children: runs(c, { bold, size }), spacing: { after: 0 } }));
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, margins: cellMargins,
    verticalAlign: VerticalAlign.CENTER,
    shading: fill ? { fill, type: ShadingType.CLEAR, color: "auto" } : undefined,
    children: paras,
  });
}

function table(headers, rows, widths, { center = [] } = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const headRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => cell(h, widths[i], { fill: HEADER_FILL, bold: true })),
  });
  const bodyRows = rows.map((r, ri) => new TableRow({
    cantSplit: true,
    children: r.map((c, i) => cell(c, widths[i], {
      fill: ri % 2 ? ALT_FILL : undefined,
      align: center.includes(i) ? AlignmentType.CENTER : undefined,
    })),
  }));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: [headRow, ...bodyRows] });
}

function keyValueTable(pairs, widths = [2300, CONTENT_W - 2300]) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths,
    rows: pairs.map(([k, v]) => new TableRow({ children: [cell(k, widths[0], { fill: HEADER_FILL, bold: true }), cell(v, widths[1])] })),
  });
}

function calloutBox(title, text) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [CONTENT_W],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      margins: { top: 160, bottom: 160, left: 220, right: 220 },
      shading: { fill: "EAF2FB", type: ShadingType.CLEAR, color: "auto" },
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: PRIMARY }, bottom: { style: BorderStyle.SINGLE, size: 4, color: PRIMARY },
        left: { style: BorderStyle.SINGLE, size: 24, color: PRIMARY }, right: { style: BorderStyle.SINGLE, size: 4, color: PRIMARY } },
      children: [
        new Paragraph({ children: [new TextRun({ text: title, bold: true, color: PRIMARY, size: 22 })], spacing: { after: 80 } }),
        new Paragraph({ children: runs(text, { size: 23, italics: true }), spacing: { after: 0 } }),
      ],
    })] })],
  });
}

const spacer = () => new Paragraph({ children: [], spacing: { after: 60 } });

// ---------- date ----------
const FR = [
  ["FR1", "Afișarea sporturilor disponibile (minim fotbal, baschet, hochei) și selectarea unuia dintre ele.", "Must"],
  ["FR2", "Afișarea programului de meciuri pe zile (ieri / azi / mâine, interval ±7 zile), grupat pe competiții.", "Must"],
  ["FR3", "Afișarea meciurilor în desfășurare cu scor și minut actualizate automat.", "Must"],
  ["FR4", "Filtrarea meciurilor după țară și competiție.", "Should"],
  ["FR5", "Pagina de detalii a meciului: informații de bază, cronologia evenimentelor, statistici, formații.", "Must (bază) / Should–Could (restul)"],
  ["FR6", "Afișarea clasamentului unei competiții.", "Must"],
  ["FR7", "Pagina echipei: informații generale, rezultate recente, meciuri viitoare, lot de jucători.", "Should"],
  ["FR8", "Profilul jucătorului cu date personale și statistici pe sezon.", "Should"],
  ["FR9", "Căutare după nume pentru echipe, jucători și competiții.", "Should"],
  ["FR10", "Crearea unui cont, autentificare și delogare.", "Should"],
  ["FR11", "Gestionarea echipelor/competițiilor favorite și afișarea feed-ului „Meciurile mele”.", "Should"],
  ["FR12", "Notificări în browser pentru evenimentele meciurilor favorite (start, gol, final).", "Could"],
  ["FR13", "Afișarea istoricului întâlnirilor directe (head-to-head).", "Could"],
  ["FR14", "Afișarea tuturor orelor în fusul orar al utilizatorului.", "Must"],
  ["FR15", "Administrare: configurarea sporturilor/competițiilor afișate și monitorizarea consumului API.", "Could"],
  ["FR16", "Sincronizarea periodică a datelor din API-Sports și păstrarea lor într-un cache pe server.", "Must"],
  ["FR17", "Calcularea unui „Interest Score” pentru meciuri și afișarea meciurilor recomandate (inovare).", "Should"],
  ["FR18", "Exportul unui meci (sau al meciurilor favorite) în calendar, în format .ics (inovare).", "Should"],
];

const NFR = [
  ["NFR-01", "Performanță", "Paginile principale se încarcă în sub 2 s (p95) când datele sunt în cache; răspunsul backend-ului din cache durează sub 500 ms."],
  ["NFR-02", "Limitele API", "Aplicația respectă limita planului gratuit API-Sports (100 cereri/zi pentru fiecare sport) prin cache cu TTL și contorizarea cererilor."],
  ["NFR-03", "Prospețimea datelor", "Scorurile live sunt actualizate la cel mult 60 s; programul zilnic la cel mult 1 h; clasamentele la cel mult 6 h."],
  ["NFR-04", "Securitate", "Cheia API este păstrată doar pe server (variabilă de mediu, niciodată în repository). Parole stocate cu bcrypt, autentificare cu JWT, comunicare prin HTTPS."],
  ["NFR-05", "Utilizabilitate", "Interfață responsive (de la 360 px lățime până la desktop), contrast conform WCAG 2.1 AA, maxim 2 click-uri de la pagina principală la detaliile unui meci."],
  ["NFR-06", "Robustețe", "La eroarea sau indisponibilitatea API-ului, aplicația afișează ultimele date salvate cu indicatorul de vechime, fără erori vizibile utilizatorului."],
  ["NFR-07", "Mentenabilitate", "Arhitectură pe straturi, cu câte un adaptor per sport; code coverage de minim 70% pe logica de business a backend-ului."],
  ["NFR-08", "Localizare", "Interfață în limba română; formatele de dată/oră respectă setările locale ale utilizatorului."],
  ["NFR-09", "Protecția datelor", "Se colectează doar emailul și preferințele; utilizatorul își poate șterge contul și toate datele asociate (GDPR)."],
  ["NFR-10", "Compatibilitate", "Funcționează în ultimele 2 versiuni de Chrome, Firefox și Edge."],
];

const USE_CASES = [
  ["UC1", "Selectare sport", "Vizitator", "FR1", "US01"],
  ["UC2", "Vizualizare program meciuri", "Vizitator", "FR2, FR14", "US02, US03, US22"],
  ["UC3", "Urmărire scoruri live", "Vizitator", "FR3", "US04"],
  ["UC4", "Filtrare după țară / competiție", "Vizitator", "FR4", "US05"],
  ["UC5", "Vizualizare detalii meci", "Vizitator", "FR5", "US06, US07, US08, US09"],
  ["UC6", "Comparare head-to-head", "Vizitator", "FR13", "US21"],
  ["UC7", "Vizualizare clasament", "Vizitator", "FR6", "US10"],
  ["UC8", "Vizualizare echipă și lot", "Vizitator", "FR7", "US11, US12"],
  ["UC9", "Vizualizare profil jucător", "Vizitator", "FR8", "US13"],
  ["UC10", "Căutare", "Vizitator", "FR9", "US14"],
  ["UC11", "Export meci în calendar", "Vizitator", "FR18", "US24"],
  ["UC12", "Înregistrare cont", "Vizitator", "FR10", "US15"],
  ["UC13", "Autentificare", "Utilizator înregistrat", "FR10", "US16"],
  ["UC14", "Gestionare favorite", "Utilizator înregistrat", "FR11", "US17"],
  ["UC15", "Vizualizare „Meciurile mele”", "Utilizator înregistrat", "FR11", "US18"],
  ["UC16", "Vizualizare meciuri recomandate", "Vizitator / Utilizator înregistrat", "FR17", "US23"],
  ["UC17", "Primire notificări", "Utilizator înregistrat", "FR12", "US19"],
  ["UC18", "Configurare sporturi / competiții", "Administrator", "FR15", "US25"],
  ["UC19", "Monitorizare consum API", "Administrator", "FR15", "US26"],
  ["UC20", "Sincronizare date sportive", "Planificator, API-Sports", "FR16", "US20"],
];

const REFINEMENT = [
  ["„Ca utilizator, vreau să văd meciurile.”", "Ambiguă (ce sport? ce zi? ce înseamnă „să văd”?) și netestabilă.", "Împărțită în US01 (selectare sport), US02 (program azi), US03 (navigare zile), US22 (fus orar)."],
  ["„Ca utilizator, vreau să văd tot despre un meci.”", "Prea mare (nu este Small/Estimable): include info, evenimente, statistici, formații, istoric.", "Împărțită în US06, US07, US08, US09, US21, fiecare livrabilă independent."],
  ["„Ca developer, vreau să implementez caching pentru API.”", "Formulată din perspectiva echipei, nu a utilizatorului (valoarea nu este vizibilă).", "Reformulată ca US20, cu valoare pentru utilizator (viteză + funcționare la limita API) și criterii măsurabile."],
  ["„Aplicația trebuie să fie rapidă.”", "Este o cerință nefuncțională, nu o User Story; nu are criteriu de verificare.", "Mutată în NFR-01 (sub 2 s / sub 500 ms) și reflectată în criteriile US20."],
  ["„Ca utilizator, vreau cont și favorite.”", "Două valori diferite într-o singură poveste; dependență ascunsă.", "Împărțită în US15 (înregistrare), US16 (autentificare), US17 (favorite), US18 („Meciurile mele”)."],
  ["„Ca utilizator, vreau notificări.”", "Netestabilă: nu spune ce evenimente, pe ce canal și cât de repede.", "US19: notificări browser pentru start / gol / final, în maxim 2 minute, configurabile per tip."],
  ["„Ca fan, vreau să știu ce meci merită urmărit.”", "Vagă; „merită” este subiectiv.", "US23: Interest Score 0–100 cu formulă documentată, top 5 și explicație vizibilă — testabil unitar."],
  ["„Ca vizitator, vreau statistici despre jucători.”", "Neclar ce statistici și de unde se ajunge la ele.", "US12 (lot echipă) + US13 (profil jucător cu statistici pe sezon, selector de sezon)."],
];

// ---------- calcule backlog ----------
const prioOrder = ["Must", "Should", "Could", "Won't"];
const byPrio = Object.fromEntries(prioOrder.map((p) => [p, backlog.filter((s) => s.prio === p)]));
const sum = (arr) => arr.reduce((a, s) => a + s.sp, 0);
const committed = backlog.filter((s) => s.prio === "Must" || s.prio === "Should");
const third = Math.ceil(committed.length / 3);
const twoThirds = Math.ceil((committed.length * 2) / 3);

// ---------- continut ----------
const children = [];

// Coperta
children.push(
  new Paragraph({ spacing: { before: 2400, after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Proiect de laborator MOPS", size: 28, color: "555555" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [new TextRun({ text: APP, size: 72, bold: true, color: PRIMARY })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 },
    children: [new TextRun({ text: "Aplicație web pentru urmărirea meciurilor din mai multe sporturi", size: 28, italics: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 },
    children: [new TextRun({ text: "Requirements Document și Product Backlog inițial", size: 32, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1600 },
    children: [new TextRun({ text: "Etapa I – Săptămânile 3–4", size: 26 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Echipa: [Numele echipei]", size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Grupa: [ ]     Cadru didactic: [ ]", size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Versiunea 1.0 (draft pentru validare în echipă) – 12.10.2026", size: 22, color: "555555" })] }),
  pageBreak(),
);

// 1. Echipa
children.push(
  H1("1. Constituirea echipei"),
  P("Echipa este formată din 4–5 studenți. Rolurile Scrum sunt alocate astfel (de completat cu numele membrilor):"),
  table(["Membru", "Rol Scrum", "Responsabilități principale"], [
    ["[Nume Prenume 1]", "Product Owner", "Menține Requirements Document și Product Goal; ordonează Product Backlog; acceptă User Stories la Sprint Review."],
    ["[Nume Prenume 2]", "Developer + Scrum Master", "Facilitează evenimentele Scrum și Retrospective; elimină impedimentele; realizează diagrama de workflow."],
    ["[Nume Prenume 3]", "Developer", "Implementare backend (integrare API-Sports, cache), teste unitare."],
    ["[Nume Prenume 4]", "Developer", "Implementare frontend (liste meciuri, pagini detalii), teste."],
    ["[Nume Prenume 5] (opțional)", "Developer", "Autentificare, favorite, notificări, teste de acceptare."],
  ], [2400, 2300, 4938]),
  spacer(),
  P("**Instrumente de lucru:** Slack (comunicare, canal #sportpulse), GitHub (repository, branch-uri, Pull Requests), Jira sau GitHub Projects (backlog și board de Sprint), API-Sports (sursa de date)."),
);

// 2. Tema
children.push(
  H1("2. Tema proiectului"),
  P(`**${APP}** este o aplicație web de tip „livescore” (similară ca idee cu Flashscore) care afișează programul, rezultatele și scorurile live ale meciurilor din mai multe sporturi, împreună cu clasamente, pagini de echipe și profiluri de jucători. Datele provin din API-urile publice **API-Sports** (dashboard.api-football.com), accesate cu o cheie personală.`),
  P("Elementele de inovare propuse față de aplicațiile existente:"),
  bullet("**Interest Score** – un scor calculat de aplicație (0–100) care recomandă „meciurile zilei” pe baza clasamentului, importanței competiției, istoricului direct și preferințelor utilizatorului, cu o explicație vizibilă a recomandării (US23)."),
  bullet("**Export în calendar (.ics)** – utilizatorul își adaugă meciurile dorite în Google Calendar / Outlook cu un click (US24)."),
  bullet("**Funcționare robustă pe un plan gratuit limitat** – cache inteligent cu TTL diferențiat pe tipul de date, astfel încât aplicația rămâne utilizabilă și la limita de cereri a API-ului (US20)."),
);

// 3. Problema
children.push(
  H1("3. Descrierea problemei"),
  P("Fanii sportului urmăresc de obicei mai multe competiții și chiar mai multe sporturi. Informația este însă împrăștiată: un site pentru scoruri live, altul pentru clasamente, altul pentru statistici de jucători. Aplicațiile mari existente sunt aglomerate cu reclame și pariuri, iar găsirea meciurilor relevante pentru un anumit utilizator cere mult timp."),
  P("Probleme concrete identificate:"),
  bullet("Nu există un loc unic, simplu și rapid în care să vezi programul zilei pentru mai multe sporturi, în fusul tău orar."),
  bullet("Utilizatorul trebuie să caute manual meciurile echipelor preferate printre sute de meciuri."),
  bullet("Este greu de decis care meciuri merită urmărite într-o zi încărcată."),
  bullet("Informațiile despre jucători și echipe (lot, statistici, formă) nu sunt legate direct de meciul urmărit."),
  P(`${APP} rezolvă aceste probleme printr-o interfață curată, centrată pe meci, cu favorite, recomandări și export în calendar.`),
);

// 4. Utilizatori
children.push(
  H1("4. Utilizatori și categorii de utilizatori"),
  table(["Categorie", "Descriere", "Nevoi principale"], [
    ["Vizitator (fan ocazional)", "Accesează aplicația fără cont, de pe telefon sau calculator, pentru a verifica rapid un rezultat.", "Program și scoruri live, detalii meci, clasamente, căutare rapidă."],
    ["Utilizator înregistrat (fan dedicat)", "Urmărește constant anumite echipe și competiții, din unul sau mai multe sporturi.", "Favorite, feed „Meciurile mele”, notificări, recomandări personalizate, export în calendar."],
    ["Fan interesat de statistici", "Vizitator sau utilizator înregistrat care analizează forma echipelor și a jucătorilor.", "Statistici meci, profil jucător, istoric direct, clasament cu formă."],
    ["Administrator", "Membru al echipei care administrează aplicația.", "Configurarea sporturilor/competițiilor afișate, monitorizarea consumului de cereri API."],
    ["Sisteme externe (actori secundari)", "API-Sports (furnizor de date) și planificatorul intern care declanșează sincronizarea.", "Cereri autentificate cu cheie API, respectarea limitelor de cereri."],
  ], [2300, 3800, 3538]),
);

// 5. Product Goal
children.push(
  H1("5. Product Goal"),
  calloutBox("Product Goal", `${APP} le oferă fanilor de sport un singur loc, rapid și personalizat, în care pot urmări programul, scorurile live, clasamentele, echipele și jucătorii pentru fotbal, baschet și hochei, și pot descoperi ușor meciurile care contează pentru ei.`),
  spacer(),
  P("Product Goal este măsurabil prin: (1) utilizatorul ajunge la scorul unui meci în maxim 2 click-uri; (2) datele live au o întârziere de maxim 60 s; (3) un utilizator înregistrat își vede toate meciurile favorite din toate sporturile pe un singur ecran."),
);

// 6. FR
children.push(
  H1("6. Cerințe funcționale"),
  P("Prioritatea indicată este cea inițială (MoSCoW) și este detaliată în Product Backlog."),
  table(["ID", "Cerință funcțională", "Prioritate"], FR, [900, 6838, 1900]),
);

// 7. NFR
children.push(
  H1("7. Cerințe nefuncționale"),
  table(["ID", "Categorie", "Cerință"], NFR, [1000, 1900, 6738]),
);

// 8. Surse de date, constrangeri, riscuri
children.push(
  H1("8. Sursa de date, constrângeri și riscuri"),
  H2("8.1 API-Sports"),
  P("Fiecare sport are un API separat, cu aceeași cheie (header-ul **x-apisports-key**). Endpoint-urile principale folosite:"),
  table(["Sport", "URL de bază", "Endpoint-uri folosite"], [
    ["Fotbal", "v3.football.api-sports.io", "/fixtures (pe dată, live=all, id), /fixtures/events, /fixtures/statistics, /fixtures/lineups, /fixtures/headtohead, /standings, /teams, /players, /players/squads, /predictions, /status"],
    ["Baschet", "v1.basketball.api-sports.io", "/games, /standings, /teams, /statistics (disponibilitatea datelor despre jucători se verifică în documentație)"],
    ["Hochei", "v1.hockey.api-sports.io", "/games, /games/events, /standings, /teams"],
  ], [1300, 2800, 5538]),
  spacer(),
  H2("8.2 Constrângeri"),
  bullet("Planul gratuit permite aproximativ **100 de cereri pe zi pentru fiecare API (sport)** și un număr limitat de cereri pe minut, de aceea toate cererile trec prin cache-ul de pe server."),
  bullet("Planul gratuit poate restricționa sezoanele accesibile. **De verificat în dashboard** ce sezoane sunt disponibile; dacă sezonul curent nu este inclus, demo-ul va folosi un sezon accesibil."),
  bullet("Nivelul de detaliu diferă între sporturi (ex. evenimente și formații sunt complete doar la fotbal), deci interfața trebuie să ascundă secțiunile fără date."),
  bullet("Durata proiectului: un Sprint de 5 zile de lucru (40 de ore), distribuit pe 5 săptămâni."),
  H2("8.3 Riscuri inițiale"),
  table(["Risc", "Impact", "Măsură de reducere"], [
    ["Depășirea limitei zilnice de cereri API", "Ridicat", "US20 este primul în backlog: cache cu TTL, contor de cereri, date de rezervă."],
    ["Sezonul curent nu este disponibil pe planul gratuit", "Mediu", "Verificare în prima săptămână; folosirea unui sezon disponibil pentru demo."],
    ["Structuri de date diferite între sporturi", "Mediu", "Model intern comun + câte un adaptor per sport; începem cu fotbalul."],
    ["Cheia API publicată accidental în repository", "Ridicat", "Fișier .env în .gitignore, cheia doar pe server, verificare în code review."],
    ["Capacitate redusă (Sprint de 40 h)", "Mediu", "Backlog ordonat pe valoare; Must livrate primele; Could negociabile."],
  ], [3600, 1100, 4938]),
);

// 9. Use case
const ucImg = fs.readFileSync(UC_PNG);
children.push(
  pageBreak(),
  H1("9. Use Case Diagram"),
  P("Diagrama prezintă actorii sistemului și cazurile de utilizare identificate. Utilizatorul înregistrat moștenește toate cazurile de utilizare ale vizitatorului, iar administratorul pe cele ale utilizatorului înregistrat. Sursa PlantUML se află în docs/diagrams/use_case_diagram.puml."),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({
    type: "png", data: ucImg, transformation: { width: 600, height: 593 },
    altText: { title: "Use Case Diagram", description: "Use Case Diagram SportPulse", name: "use-case" },
  })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Figura 1 – Use Case Diagram SportPulse", italics: true, size: 18 })] }),
  H2("9.1 Cazurile de utilizare și legătura cu cerințele"),
  table(["UC", "Caz de utilizare", "Actor principal", "Cerințe", "User Stories"], USE_CASES, [800, 3000, 2200, 1500, 2138]),
);

// 10. User stories initiale si refinement
children.push(
  pageBreak(),
  H1("10. User Stories inițiale și refinement"),
  P(`Pornind de la cerințe și de la Use Case Diagram, echipa a identificat un set inițial de User Stories, care a fost rafinat folosind principiile INVEST. Rezultatul este un set de **${backlog.length} User Stories** (cerința minimă este 15), prezentate în secțiunea 11.`),
  H2("10.1 Cum au fost aplicate principiile INVEST"),
  table(["Principiu", "Ce am verificat"], [
    ["Independent", "Dependențele au fost reduse prin împărțire pe straturi de valoare; cele rămase sunt documentate explicit în coloana „Dependențe”."],
    ["Negotiable", "Povestea descrie nevoia, nu soluția tehnică; detaliile de implementare apar doar în note."],
    ["Valuable", "Fiecare poveste este formulată din perspectiva unui actor (vizitator, utilizator, administrator) și are o clauză „pentru a…”."],
    ["Estimable", "Poveștile vagi au fost clarificate cu criterii de acceptare concrete înainte de estimare."],
    ["Small", "Nicio poveste nu depășește 8 SP; cele mai mari au fost împărțite (vezi 10.2)."],
    ["Testable", "Fiecare poveste are 2–5 criterii de acceptare verificabile (valori numerice, mesaje exacte, comportament observabil)."],
  ], [1800, 7838]),
  spacer(),
  H2("10.2 Exemple de refinement"),
  table(["Formulare inițială", "Problemă identificată", "Rezultat după refinement"], REFINEMENT, [2800, 3200, 3638]),
);

// 11. Product backlog
children.push(
  pageBreak(),
  H1("11. Product Backlog inițial"),
  P("Ordinea din tabel este ordinea Product Backlog-ului stabilită de Product Owner (cel mai important element primul). SP = Story Points (estimare propusă, confirmată prin Planning Poker – secțiunea 13)."),
  table(["#", "ID", "User Story", "Prioritate", "SP", "Dependențe"],
    backlog.map((s, i) => [String(i + 1), s.id, s.title, s.prio, String(s.sp), s.deps]),
    [500, 800, 4538, 1100, 600, 2100], { center: [0, 1, 3, 4] }),
  spacer(),
  P(`**Total:** ${backlog.length} User Stories, ${sum(backlog)} SP – Must: ${byPrio.Must.length} (${sum(byPrio.Must)} SP), Should: ${byPrio.Should.length} (${sum(byPrio.Should)} SP), Could: ${byPrio.Could.length} (${sum(byPrio.Could)} SP), Won't: ${byPrio["Won't"].length} (${sum(byPrio["Won't"])} SP).`),
  H2("11.1 Detalierea User Stories (criterii de acceptare)"),
);

backlog.forEach((s, i) => {
  const W = [2000, CONTENT_W - 2000];
  // keepNext pe toate randurile in afara ultimului => cardul nu se rupe intre pagini
  const lines = [
    ["User Story", s.story],
    ["Criterii de acceptare", null],
    ["Prioritate / SP", `${s.prio}  |  ${s.sp} SP (propus)`],
    ["Dependențe / Cerințe", `Depinde de: ${s.deps}   |   Acoperă: ${s.fr}`],
  ];
  if (s.notes) lines.push(["Note", s.notes]);
  const rows = [new TableRow({ cantSplit: true, children: [new TableCell({
    columnSpan: 2, borders, margins: cellMargins, width: { size: CONTENT_W, type: WidthType.DXA },
    shading: { fill: PRIMARY, type: ShadingType.CLEAR, color: "auto" },
    children: [new Paragraph({ keepNext: true, children: [new TextRun({ text: `${i + 1}. ${s.id} – ${s.title}`, bold: true, color: "FFFFFF", size: 21 })] })],
  })] })];
  lines.forEach(([k, v], li) => {
    const keepNext = li < lines.length - 1;
    const value = v !== null ? cell(v, W[1], { keepNext }) : cell(s.ac.map((a) => new Paragraph({
      keepNext, numbering: { reference: "ac", level: 0, instance: i + 1 }, children: runs(a, { size: 19 }), spacing: { after: 40 },
    })), W[1]);
    rows.push(new TableRow({ cantSplit: true, children: [cell(k, W[0], { fill: HEADER_FILL, bold: true, keepNext }), value] }));
  });
  children.push(new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: W, rows }), spacer());
});

// 12. Prioritizare
children.push(
  pageBreak(),
  H1("12. Prioritizarea User Stories"),
  P("Prioritizarea a folosit metoda **MoSCoW**, iar ordinea în cadrul fiecărei categorii a fost stabilită după următoarele criterii, în această ordine:"),
  numbered("**Valoarea pentru utilizator** – funcțiile de bază ale unei aplicații de scoruri (program, live, detalii meci, clasament) sunt Must."),
  numbered("**Dependențele** – o poveste nu poate fi înaintea celor de care depinde (ex. US20 → US02 → US04)."),
  numbered("**Riscul** – US20 (cache) este prima, deoarece validează cât mai devreme integrarea cu API-Sports și limita de cereri."),
  numbered("**Efortul** – la valoare egală, poveștile mai mici sunt plasate mai sus pentru a livra un increment funcțional rapid."),
  table(["Categorie", "Semnificație", "User Stories"], [
    ["Must", "Fără ele aplicația nu își atinge scopul de bază (MVP).", byPrio.Must.map((s) => s.id).join(", ")],
    ["Should", "Importante pentru Product Goal (personalizare, echipe, jucători, inovare); asumate pentru implementare.", byPrio.Should.map((s) => s.id).join(", ")],
    ["Could", "Utile, dar pot fi amânate fără a afecta Product Goal.", byPrio.Could.map((s) => s.id).join(", ")],
    ["Won't (acum)", "Nu sunt planificate în această versiune.", byPrio["Won't"].map((s) => s.id).join(", ")],
  ], [1500, 4300, 3838]),
  spacer(),
  H2("12.1 Scope asumat pentru implementare și etape"),
  P(`Echipa își asumă pentru implementare poveștile **Must + Should: ${committed.length} User Stories (${sum(committed)} SP)**. Poveștile Could rămân în backlog și vor fi implementate doar dacă rămâne capacitate.`),
  table(["Etapă", "Țintă", "User Stories vizate"], [
    ["Săptămânile 7–8", `≥ 1/3 din cele asumate (${third} povești)`, committed.slice(0, Math.max(third, byPrio.Must.length)).map((s) => s.id).join(", ")],
    ["Săptămânile 11–12", `≥ 2/3 din cele asumate (${twoThirds} povești)`, committed.slice(0, twoThirds).map((s) => s.id).join(", ")],
    ["Săptămânile 13–14", "Toate cele asumate + prezentare finală", committed.map((s) => s.id).join(", ")],
  ], [1900, 2700, 5038]),
);

// 13. Estimare
children.push(
  H1("13. Estimarea efortului – Planning Poker"),
  H2("13.1 Procesul de estimare"),
  numbered("Scala folosită: șirul Fibonacci modificat – **1, 2, 3, 5, 8, 13, 21, ?** (cărți fizice sau aplicație online, ex. planningpokeronline.com).", "steps"),
  numbered("**Povestea de referință:** US06 (pagina meciului – informații de bază) = **3 SP**. Toate celelalte povești sunt estimate relativ la ea.", "steps"),
  numbered("Product Owner-ul citește povestea și criteriile de acceptare; Developers pun întrebări de clarificare.", "steps"),
  numbered("Fiecare Developer alege o carte în secret; toate cărțile sunt întoarse simultan.", "steps"),
  numbered("Dacă estimările diferă cu mai mult de o treaptă pe scală, cei cu valoarea minimă și maximă își explică raționamentul, apoi se votează din nou (maxim 3 runde).", "steps"),
  numbered("Valoarea finală este cea pe care o acceptă toată echipa după discuție; dacă nu se ajunge la consens după 3 runde, se alege valoarea mai mare (abordare prudentă) și se notează motivul.", "steps"),
  numbered("Poveștile estimate la 13 SP sau mai mult sunt considerate prea mari și se împart înainte de Sprint Planning.", "steps"),
  H2("13.2 Rezultatele estimării"),
  P("Coloana „SP propus” este punctul de plecare pregătit înainte de ședință. Coloanele cu voturi și coloana „Final” se completează **în timpul ședinței de Planning Poker** (D1–D4 = Developers)."),
  table(["ID", "User Story", "SP propus", "D1", "D2", "D3", "D4", "Final", "Observații / justificare diferențe"],
    backlog.map((s) => [s.id, s.title, String(s.sp), "", "", "", "", "", ""]),
    [700, 2900, 800, 500, 500, 500, 500, 700, 2538], { center: [0, 2, 3, 4, 5, 6, 7] }),
  spacer(),
  H2("13.3 Factori care influențează efortul (de discutat la estimare)"),
  bullet("Diferențele de format între API-urile pentru fotbal, baschet și hochei (US02, US04, US10)."),
  bullet("Actualizarea automată (polling) și sincronizarea cu cache-ul (US04, US07, US19)."),
  bullet("Logica de calcul a Interest Score și testarea ei (US23) – complexitate algoritmică, fără incertitudine de UI."),
  bullet("Securitatea autentificării (US15, US16) – hash parole, JWT, blocare la încercări repetate."),
  bullet("Notificările în browser (US19) – tehnologie nouă pentru echipă (Notifications API / service worker), deci incertitudine mai mare."),
);

// 14. Arhitectura
children.push(
  H1("14. Arhitectură și tehnologii propuse"),
  P("Propunere inițială, de confirmat de echipă înainte de Sprint Planning:"),
  table(["Componentă", "Tehnologie propusă", "Motiv"], [
    ["Frontend", "React + TypeScript (Vite)", "Componente reutilizabile pentru liste de meciuri și pagini de detalii; testare cu Vitest."],
    ["Backend", "Java 21 + Spring Boot 3 (REST)", "Ascunde cheia API, face cache și agregare; teste cu JUnit 5 + Mockito."],
    ["Bază de date", "PostgreSQL", "Utilizatori, favorite, configurare, cache persistent, contor cereri API."],
    ["Code coverage", "JaCoCo (backend), Vitest coverage (frontend)", "Cerința de măsurare a code coverage."],
    ["Versionare și CI", "Git + GitHub, GitHub Actions", "Branch-uri, Pull Requests, rulare automată a testelor."],
    ["Management", "Jira sau GitHub Projects", "Backlog, board de Sprint (To Do → In Progress → Code Review → Testing → Done)."],
  ], [1800, 3300, 4538]),
  spacer(),
  P("Fluxul de date: Frontend → Backend SportPulse → (cache / bază de date) → API-Sports. Frontend-ul nu comunică niciodată direct cu API-Sports."),
);

// 15. AI
children.push(
  H1("15. Jurnalul utilizării instrumentelor AI"),
  P("Conform cerințelor proiectului, fiecare utilizare semnificativă a AI este documentată. Câmpurile marcate cu [ ] se completează de echipă după validare."),
  keyValueTable([
    ["Nr.", "AI-01"],
    ["Instrument", "Claude (Claude Code, Anthropic)"],
    ["Scopul utilizării", "Generarea unui draft inițial pentru Requirements Document, Use Case Diagram, User Stories cu criterii de acceptare, ordinea backlog-ului și estimări propuse."],
    ["Prompt / solicitare", "„Uită-te pe documentul de cerințe al proiectului MOPS și fă tot ce trebuie pentru termenul din săptămânile 3–4. Proiectul este o aplicație care arată meciuri din diverse sporturi, ca Flashscore, folosind API-Sports (dashboard.api-football.com): meciurile care urmează, jucători etc., pe sporturile disponibile.”"],
    ["Rezultatul obținut", "Draftul acestui document, diagrama Use Case (PNG + PlantUML), fișierul CSV cu Product Backlog-ul pentru import în Jira."],
    ["Modificări efectuate de echipă", "[ de completat – ex. povești eliminate / adăugate / reformulate, priorități schimbate, criterii de acceptare ajustate ]"],
    ["Verificare și validare", "[ de completat – ex. ședința de refinement din data …, Planning Poker din data …, verificarea endpoint-urilor în documentația API-Sports ]"],
  ]),
);

// Anexa
children.push(
  H1("Anexa A – Glosar"),
  table(["Termen", "Explicație"], [
    ["API-Sports", "Furnizor de date sportive (api-sports.io); API-Football este API-ul pentru fotbal."],
    ["Fixture / Game", "Un meci programat sau jucat (fotbal: fixture; baschet/hochei: game)."],
    ["Live", "Meci în desfășurare."],
    ["Head-to-head (H2H)", "Istoricul întâlnirilor directe dintre două echipe."],
    ["Interest Score", "Scor 0–100 calculat de SportPulse care indică cât de interesant este un meci."],
    ["TTL", "Time To Live – cât timp o informație din cache este considerată validă."],
    ["MoSCoW", "Metodă de prioritizare: Must / Should / Could / Won't have."],
    ["SP", "Story Points – unitate relativă de estimare a efortului."],
  ], [2200, 7438]),
);

// ---------- document ----------
const doc = new Document({
  creator: "Echipa SportPulse",
  title: "SportPulse – Requirements Document și Product Backlog",
  styles: {
    default: { document: { run: { font: "Calibri", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: PRIMARY, font: "Calibri" },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "B7C4D6", space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: PRIMARY, font: "Calibri" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, font: "Calibri" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ] },
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ] },
      { reference: "steps", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ] },
      { reference: "ac", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "AC%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 560 } } } },
      ] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `${APP} – Etapa I   |   pagina `, size: 16, color: "777777" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "777777" })] })] }) },
    children,
  }],
});

// ---------- CSV pentru Jira ----------
function csvEscape(v) { return `"${String(v).replace(/"/g, '""')}"`; }
const csvRows = [["Issue Type", "Summary", "Description", "Priority", "Story Points", "Labels", "Backlog Rank"]];
const jiraPrio = { Must: "Highest", Should: "High", Could: "Medium", "Won't": "Low" };
backlog.forEach((s, i) => {
  const desc = [s.story, "", "Criterii de acceptare:", ...s.ac.map((a, k) => `AC${k + 1}. ${a}`), "",
    `Dependente: ${s.deps}`, `Cerinte: ${s.fr}`, s.notes ? `Note: ${s.notes}` : ""].filter((x) => x !== undefined).join("\n");
  csvRows.push(["Story", `${s.id} - ${s.title}`, desc, jiraPrio[s.prio], s.sp, `MoSCoW-${s.prio.replace("'", "")}`, i + 1]);
});
fs.writeFileSync(OUT_CSV, "﻿" + csvRows.map((r) => r.map(csvEscape).join(",")).join("\r\n"), "utf8");

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT_DOCX, buf);
  console.log("Scris:", OUT_DOCX);
  console.log("Scris:", OUT_CSV);
  console.log(`US: ${backlog.length}, SP total: ${sum(backlog)}, asumate: ${committed.length} (${sum(committed)} SP)`);
});
