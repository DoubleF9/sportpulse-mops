// Genereaza docs/SportPulse_Etapa1_Requirements_Backlog.md si docs/product_backlog_jira.csv
// Rulare: node tools/build_docs.js   (fara dependente externe)
const fs = require("fs");
const path = require("path");
const backlog = require("./backlog");

const ROOT = path.resolve(__dirname, "..");
const DOCS = path.join(ROOT, "docs");
const OUT_MD = path.join(DOCS, "SportPulse_Etapa1_Requirements_Backlog.md");
const OUT_CSV = path.join(DOCS, "product_backlog_jira.csv");

const APP = "SportPulse";

// ---------- helpers ----------
const esc = (v) => String(v).replace(/\|/g, "\\|");
function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `|${headers.map(() => "---").join("|")}|`,
    ...rows.map((r) => `| ${r.map(esc).join(" | ")} |`),
  ].join("\n");
}
const bullets = (items) => items.map((t) => `- ${t}`).join("\n");
const numbered = (items) => items.map((t, i) => `${i + 1}. ${t}`).join("\n");

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
const ids = (arr) => arr.map((s) => s.id).join(", ");
const committed = backlog.filter((s) => s.prio === "Must" || s.prio === "Should");
const third = Math.ceil(committed.length / 3);
const twoThirds = Math.ceil((committed.length * 2) / 3);

// ---------- continut ----------
const md = [];
const add = (...blocks) => md.push(...blocks);

add(
  `# ${APP} – Requirements Document și Product Backlog inițial`,
  `**Proiect de laborator MOPS – Etapa I (Săptămânile 3–4)**  \n` +
  `Aplicație web pentru urmărirea meciurilor din mai multe sporturi  \n` +
  `Echipa: [Numele echipei] · Grupa: [ ] · Cadru didactic: [ ]  \n` +
  `Versiunea 1.0 (draft pentru validare în echipă) – 12.10.2026`,
  `## Cuprins`,
  numbered([
    "[Constituirea echipei](#1-constituirea-echipei)",
    "[Tema proiectului](#2-tema-proiectului)",
    "[Descrierea problemei](#3-descrierea-problemei)",
    "[Utilizatori și categorii de utilizatori](#4-utilizatori-și-categorii-de-utilizatori)",
    "[Product Goal](#5-product-goal)",
    "[Cerințe funcționale](#6-cerințe-funcționale)",
    "[Cerințe nefuncționale](#7-cerințe-nefuncționale)",
    "[Sursa de date, constrângeri și riscuri](#8-sursa-de-date-constrângeri-și-riscuri)",
    "[Use Case Diagram](#9-use-case-diagram)",
    "[User Stories inițiale și refinement](#10-user-stories-inițiale-și-refinement)",
    "[Product Backlog inițial](#11-product-backlog-inițial)",
    "[Prioritizarea User Stories](#12-prioritizarea-user-stories)",
    "[Estimarea efortului – Planning Poker](#13-estimarea-efortului--planning-poker)",
    "[Arhitectură și tehnologii propuse](#14-arhitectură-și-tehnologii-propuse)",
    "[Jurnalul utilizării instrumentelor AI](#15-jurnalul-utilizării-instrumentelor-ai)",
  ]),
);

// 1. Echipa
add(
  "## 1. Constituirea echipei",
  "Echipa este formată din 4–5 studenți. Rolurile Scrum sunt alocate astfel (de completat cu numele membrilor):",
  table(["Membru", "Rol Scrum", "Responsabilități principale"], [
    ["[Nume Prenume 1]", "Product Owner", "Menține Requirements Document și Product Goal; ordonează Product Backlog; acceptă User Stories la Sprint Review."],
    ["[Nume Prenume 2]", "Developer + Scrum Master", "Facilitează evenimentele Scrum și Retrospective; elimină impedimentele; realizează diagrama de workflow."],
    ["[Nume Prenume 3]", "Developer", "Implementare backend (integrare API-Sports, cache), teste unitare."],
    ["[Nume Prenume 4]", "Developer", "Implementare frontend (liste meciuri, pagini detalii), teste."],
    ["[Nume Prenume 5] (opțional)", "Developer", "Autentificare, favorite, notificări, teste de acceptare."],
  ]),
  "**Instrumente de lucru:** Slack (comunicare, canal #sportpulse), GitHub (repository, branch-uri, Pull Requests), Jira sau GitHub Projects (backlog și board de Sprint), API-Sports (sursa de date).",
);

// 2. Tema
add(
  "## 2. Tema proiectului",
  `**${APP}** este o aplicație web de tip „livescore” (similară ca idee cu Flashscore) care afișează programul, rezultatele și scorurile live ale meciurilor din mai multe sporturi, împreună cu clasamente, pagini de echipe și profiluri de jucători. Datele provin din API-urile publice **API-Sports** (dashboard.api-football.com), accesate cu o cheie personală.`,
  "Elementele de inovare propuse față de aplicațiile existente:",
  bullets([
    "**Interest Score** – un scor calculat de aplicație (0–100) care recomandă „meciurile zilei” pe baza clasamentului, importanței competiției, istoricului direct și preferințelor utilizatorului, cu o explicație vizibilă a recomandării (US23).",
    "**Export în calendar (.ics)** – utilizatorul își adaugă meciurile dorite în Google Calendar / Outlook cu un click (US24).",
    "**Funcționare robustă pe un plan gratuit limitat** – cache inteligent cu TTL diferențiat pe tipul de date, astfel încât aplicația rămâne utilizabilă și la limita de cereri a API-ului (US20).",
  ]),
);

// 3. Problema
add(
  "## 3. Descrierea problemei",
  "Fanii sportului urmăresc de obicei mai multe competiții și chiar mai multe sporturi. Informația este însă împrăștiată: un site pentru scoruri live, altul pentru clasamente, altul pentru statistici de jucători. Aplicațiile mari existente sunt aglomerate cu reclame și pariuri, iar găsirea meciurilor relevante pentru un anumit utilizator cere mult timp.",
  "Probleme concrete identificate:",
  bullets([
    "Nu există un loc unic, simplu și rapid în care să vezi programul zilei pentru mai multe sporturi, în fusul tău orar.",
    "Utilizatorul trebuie să caute manual meciurile echipelor preferate printre sute de meciuri.",
    "Este greu de decis care meciuri merită urmărite într-o zi încărcată.",
    "Informațiile despre jucători și echipe (lot, statistici, formă) nu sunt legate direct de meciul urmărit.",
  ]),
  `${APP} rezolvă aceste probleme printr-o interfață curată, centrată pe meci, cu favorite, recomandări și export în calendar.`,
);

// 4. Utilizatori
add(
  "## 4. Utilizatori și categorii de utilizatori",
  table(["Categorie", "Descriere", "Nevoi principale"], [
    ["Vizitator (fan ocazional)", "Accesează aplicația fără cont, de pe telefon sau calculator, pentru a verifica rapid un rezultat.", "Program și scoruri live, detalii meci, clasamente, căutare rapidă."],
    ["Utilizator înregistrat (fan dedicat)", "Urmărește constant anumite echipe și competiții, din unul sau mai multe sporturi.", "Favorite, feed „Meciurile mele”, notificări, recomandări personalizate, export în calendar."],
    ["Fan interesat de statistici", "Vizitator sau utilizator înregistrat care analizează forma echipelor și a jucătorilor.", "Statistici meci, profil jucător, istoric direct, clasament cu formă."],
    ["Administrator", "Membru al echipei care administrează aplicația.", "Configurarea sporturilor/competițiilor afișate, monitorizarea consumului de cereri API."],
    ["Sisteme externe (actori secundari)", "API-Sports (furnizor de date) și planificatorul intern care declanșează sincronizarea.", "Cereri autentificate cu cheie API, respectarea limitelor de cereri."],
  ]),
);

// 5. Product Goal
add(
  "## 5. Product Goal",
  `> **Product Goal:** ${APP} le oferă fanilor de sport un singur loc, rapid și personalizat, în care pot urmări programul, scorurile live, clasamentele, echipele și jucătorii pentru fotbal, baschet și hochei, și pot descoperi ușor meciurile care contează pentru ei.`,
  "Product Goal este măsurabil prin: (1) utilizatorul ajunge la scorul unui meci în maxim 2 click-uri; (2) datele live au o întârziere de maxim 60 s; (3) un utilizator înregistrat își vede toate meciurile favorite din toate sporturile pe un singur ecran.",
);

// 6-7
add(
  "## 6. Cerințe funcționale",
  "Prioritatea indicată este cea inițială (MoSCoW) și este detaliată în Product Backlog.",
  table(["ID", "Cerință funcțională", "Prioritate"], FR),
  "## 7. Cerințe nefuncționale",
  table(["ID", "Categorie", "Cerință"], NFR),
);

// 8
add(
  "## 8. Sursa de date, constrângeri și riscuri",
  "### 8.1 API-Sports",
  "Fiecare sport are un API separat, cu aceeași cheie (header-ul `x-apisports-key`). Endpoint-urile principale folosite:",
  table(["Sport", "URL de bază", "Endpoint-uri folosite"], [
    ["Fotbal", "`v3.football.api-sports.io`", "/fixtures (pe dată, live=all, id), /fixtures/events, /fixtures/statistics, /fixtures/lineups, /fixtures/headtohead, /standings, /teams, /players, /players/squads, /predictions, /status"],
    ["Baschet", "`v1.basketball.api-sports.io`", "/games, /standings, /teams, /statistics (disponibilitatea datelor despre jucători se verifică în documentație)"],
    ["Hochei", "`v1.hockey.api-sports.io`", "/games, /games/events, /standings, /teams"],
  ]),
  "### 8.2 Constrângeri",
  bullets([
    "Planul gratuit permite aproximativ **100 de cereri pe zi pentru fiecare API (sport)** și un număr limitat de cereri pe minut, de aceea toate cererile trec prin cache-ul de pe server.",
    "Planul gratuit poate restricționa sezoanele accesibile. **De verificat în dashboard** ce sezoane sunt disponibile; dacă sezonul curent nu este inclus, demo-ul va folosi un sezon accesibil.",
    "Nivelul de detaliu diferă între sporturi (ex. evenimente și formații sunt complete doar la fotbal), deci interfața trebuie să ascundă secțiunile fără date.",
    "Durata proiectului: un Sprint de 5 zile de lucru (40 de ore), distribuit pe 5 săptămâni.",
  ]),
  "### 8.3 Riscuri inițiale",
  table(["Risc", "Impact", "Măsură de reducere"], [
    ["Depășirea limitei zilnice de cereri API", "Ridicat", "US20 este primul în backlog: cache cu TTL, contor de cereri, date de rezervă."],
    ["Sezonul curent nu este disponibil pe planul gratuit", "Mediu", "Verificare în prima săptămână; folosirea unui sezon disponibil pentru demo."],
    ["Structuri de date diferite între sporturi", "Mediu", "Model intern comun + câte un adaptor per sport; începem cu fotbalul."],
    ["Cheia API publicată accidental în repository", "Ridicat", "Fișier .env în .gitignore, cheia doar pe server, verificare în code review."],
    ["Capacitate redusă (Sprint de 40 h)", "Mediu", "Backlog ordonat pe valoare; Must livrate primele; Could negociabile."],
  ]),
);

// 9
add(
  "## 9. Use Case Diagram",
  "Diagrama prezintă actorii sistemului și cazurile de utilizare identificate. Utilizatorul înregistrat moștenește toate cazurile de utilizare ale vizitatorului, iar administratorul pe cele ale utilizatorului înregistrat. Sursa PlantUML: [diagrams/use_case_diagram.puml](diagrams/use_case_diagram.puml).",
  "![Use Case Diagram SportPulse](diagrams/use_case_diagram.png)",
  "*Figura 1 – Use Case Diagram SportPulse*",
  "### 9.1 Cazurile de utilizare și legătura cu cerințele",
  table(["UC", "Caz de utilizare", "Actor principal", "Cerințe", "User Stories"], USE_CASES),
);

// 10
add(
  "## 10. User Stories inițiale și refinement",
  `Pornind de la cerințe și de la Use Case Diagram, echipa a identificat un set inițial de User Stories, care a fost rafinat folosind principiile INVEST. Rezultatul este un set de **${backlog.length} User Stories** (cerința minimă este 15), prezentate în secțiunea 11.`,
  "### 10.1 Cum au fost aplicate principiile INVEST",
  table(["Principiu", "Ce am verificat"], [
    ["Independent", "Dependențele au fost reduse prin împărțire pe straturi de valoare; cele rămase sunt documentate explicit în coloana „Dependențe”."],
    ["Negotiable", "Povestea descrie nevoia, nu soluția tehnică; detaliile de implementare apar doar în note."],
    ["Valuable", "Fiecare poveste este formulată din perspectiva unui actor (vizitator, utilizator, administrator) și are o clauză „pentru a…”."],
    ["Estimable", "Poveștile vagi au fost clarificate cu criterii de acceptare concrete înainte de estimare."],
    ["Small", "Nicio poveste nu depășește 8 SP; cele mai mari au fost împărțite (vezi 10.2)."],
    ["Testable", "Fiecare poveste are 2–5 criterii de acceptare verificabile (valori numerice, mesaje exacte, comportament observabil)."],
  ]),
  "### 10.2 Exemple de refinement",
  table(["Formulare inițială", "Problemă identificată", "Rezultat după refinement"], REFINEMENT),
);

// 11
add(
  "## 11. Product Backlog inițial",
  "Ordinea din tabel este ordinea Product Backlog-ului stabilită de Product Owner (cel mai important element primul). SP = Story Points (estimare propusă, confirmată prin Planning Poker – secțiunea 13).",
  table(["#", "ID", "User Story", "Prioritate", "SP", "Dependențe"],
    backlog.map((s, i) => [i + 1, s.id, s.title, s.prio, s.sp, s.deps])),
  `**Total:** ${backlog.length} User Stories, ${sum(backlog)} SP – Must: ${byPrio.Must.length} (${sum(byPrio.Must)} SP), Should: ${byPrio.Should.length} (${sum(byPrio.Should)} SP), Could: ${byPrio.Could.length} (${sum(byPrio.Could)} SP), Won't: ${byPrio["Won't"].length} (${sum(byPrio["Won't"])} SP).`,
  "### 11.1 Detalierea User Stories (criterii de acceptare)",
);
backlog.forEach((s, i) => {
  add(
    `#### ${i + 1}. ${s.id} – ${s.title}`,
    `> ${s.story}`,
    "**Criterii de acceptare:**",
    s.ac.map((a, k) => `- **AC${k + 1}.** ${a}`).join("\n"),
    `**Prioritate:** ${s.prio} · **SP (propus):** ${s.sp} · **Depinde de:** ${s.deps} · **Acoperă:** ${s.fr}` +
      (s.notes ? `\n\n*Note:* ${s.notes}` : ""),
  );
});

// 12
add(
  "## 12. Prioritizarea User Stories",
  "Prioritizarea a folosit metoda **MoSCoW**, iar ordinea în cadrul fiecărei categorii a fost stabilită după următoarele criterii, în această ordine:",
  numbered([
    "**Valoarea pentru utilizator** – funcțiile de bază ale unei aplicații de scoruri (program, live, detalii meci, clasament) sunt Must.",
    "**Dependențele** – o poveste nu poate fi înaintea celor de care depinde (ex. US20 → US02 → US04).",
    "**Riscul** – US20 (cache) este prima, deoarece validează cât mai devreme integrarea cu API-Sports și limita de cereri.",
    "**Efortul** – la valoare egală, poveștile mai mici sunt plasate mai sus pentru a livra un increment funcțional rapid.",
  ]),
  table(["Categorie", "Semnificație", "User Stories"], [
    ["Must", "Fără ele aplicația nu își atinge scopul de bază (MVP).", ids(byPrio.Must)],
    ["Should", "Importante pentru Product Goal (personalizare, echipe, jucători, inovare); asumate pentru implementare.", ids(byPrio.Should)],
    ["Could", "Utile, dar pot fi amânate fără a afecta Product Goal.", ids(byPrio.Could)],
    ["Won't (acum)", "Nu sunt planificate în această versiune.", ids(byPrio["Won't"])],
  ]),
  "### 12.1 Scope asumat pentru implementare și etape",
  `Echipa își asumă pentru implementare poveștile **Must + Should: ${committed.length} User Stories (${sum(committed)} SP)**. Poveștile Could rămân în backlog și vor fi implementate doar dacă rămâne capacitate.`,
  table(["Etapă", "Țintă", "User Stories vizate"], [
    ["Săptămânile 7–8", `≥ 1/3 din cele asumate (${third} povești)`, ids(committed.slice(0, Math.max(third, byPrio.Must.length)))],
    ["Săptămânile 11–12", `≥ 2/3 din cele asumate (${twoThirds} povești)`, ids(committed.slice(0, twoThirds))],
    ["Săptămânile 13–14", "Toate cele asumate + prezentare finală", ids(committed)],
  ]),
);

// 13
add(
  "## 13. Estimarea efortului – Planning Poker",
  "### 13.1 Procesul de estimare",
  numbered([
    "Scala folosită: șirul Fibonacci modificat – **1, 2, 3, 5, 8, 13, 21, ?** (cărți fizice sau aplicație online, ex. planningpokeronline.com).",
    "**Povestea de referință:** US06 (pagina meciului – informații de bază) = **3 SP**. Toate celelalte povești sunt estimate relativ la ea.",
    "Product Owner-ul citește povestea și criteriile de acceptare; Developers pun întrebări de clarificare.",
    "Fiecare Developer alege o carte în secret; toate cărțile sunt întoarse simultan.",
    "Dacă estimările diferă cu mai mult de o treaptă pe scală, cei cu valoarea minimă și maximă își explică raționamentul, apoi se votează din nou (maxim 3 runde).",
    "Valoarea finală este cea pe care o acceptă toată echipa după discuție; dacă nu se ajunge la consens după 3 runde, se alege valoarea mai mare (abordare prudentă) și se notează motivul.",
    "Poveștile estimate la 13 SP sau mai mult sunt considerate prea mari și se împart înainte de Sprint Planning.",
  ]),
  "### 13.2 Rezultatele estimării",
  "Coloana „SP propus” este punctul de plecare pregătit înainte de ședință. Coloanele cu voturi și coloana „Final” se completează **în timpul ședinței de Planning Poker** (D1–D4 = Developers).",
  table(["ID", "User Story", "SP propus", "D1", "D2", "D3", "D4", "Final", "Observații / justificare diferențe"],
    backlog.map((s) => [s.id, s.title, s.sp, " ", " ", " ", " ", " ", " "])),
  "### 13.3 Factori care influențează efortul (de discutat la estimare)",
  bullets([
    "Diferențele de format între API-urile pentru fotbal, baschet și hochei (US02, US04, US10).",
    "Actualizarea automată (polling) și sincronizarea cu cache-ul (US04, US07, US19).",
    "Logica de calcul a Interest Score și testarea ei (US23) – complexitate algoritmică, fără incertitudine de UI.",
    "Securitatea autentificării (US15, US16) – hash parole, JWT, blocare la încercări repetate.",
    "Notificările în browser (US19) – tehnologie nouă pentru echipă (Notifications API / service worker), deci incertitudine mai mare.",
  ]),
);

// 14
add(
  "## 14. Arhitectură și tehnologii propuse",
  "Propunere inițială, de confirmat de echipă înainte de Sprint Planning:",
  table(["Componentă", "Tehnologie propusă", "Motiv"], [
    ["Frontend", "React + TypeScript (Vite)", "Componente reutilizabile pentru liste de meciuri și pagini de detalii; testare cu Vitest."],
    ["Backend", "Java 21 + Spring Boot 3 (REST)", "Ascunde cheia API, face cache și agregare; teste cu JUnit 5 + Mockito."],
    ["Bază de date", "PostgreSQL", "Utilizatori, favorite, configurare, cache persistent, contor cereri API."],
    ["Code coverage", "JaCoCo (backend), Vitest coverage (frontend)", "Cerința de măsurare a code coverage."],
    ["Versionare și CI", "Git + GitHub, GitHub Actions", "Branch-uri, Pull Requests, rulare automată a testelor."],
    ["Management", "Jira sau GitHub Projects", "Backlog, board de Sprint (To Do → In Progress → Code Review → Testing → Done)."],
  ]),
  "Fluxul de date: Frontend → Backend SportPulse → (cache / bază de date) → API-Sports. Frontend-ul nu comunică niciodată direct cu API-Sports.",
);

// 15
add(
  "## 15. Jurnalul utilizării instrumentelor AI",
  "Conform cerințelor proiectului, fiecare utilizare semnificativă a AI este documentată. Câmpurile marcate cu [ ] se completează de echipă după validare.",
  table(["Câmp", "AI-01"], [
    ["Instrument", "Claude (Claude Code, Anthropic)"],
    ["Scopul utilizării", "Generarea unui draft inițial pentru Requirements Document, Use Case Diagram, User Stories cu criterii de acceptare, ordinea backlog-ului și estimări propuse."],
    ["Prompt / solicitare", "„Uită-te pe documentul de cerințe al proiectului MOPS și fă tot ce trebuie pentru termenul din săptămânile 3–4. Proiectul este o aplicație care arată meciuri din diverse sporturi, ca Flashscore, folosind API-Sports (dashboard.api-football.com): meciurile care urmează, jucători etc., pe sporturile disponibile.”"],
    ["Rezultatul obținut", "Draftul acestui document, diagrama Use Case (PNG + PlantUML), fișierul CSV cu Product Backlog-ul pentru import în Jira."],
    ["Modificări efectuate de echipă", "[ de completat – ex. povești eliminate / adăugate / reformulate, priorități schimbate, criterii de acceptare ajustate ]"],
    ["Verificare și validare", "[ de completat – ex. ședința de refinement din data …, Planning Poker din data …, verificarea endpoint-urilor în documentația API-Sports ]"],
  ]),
);

// Anexa
add(
  "## Anexa A – Glosar",
  table(["Termen", "Explicație"], [
    ["API-Sports", "Furnizor de date sportive (api-sports.io); API-Football este API-ul pentru fotbal."],
    ["Fixture / Game", "Un meci programat sau jucat (fotbal: fixture; baschet/hochei: game)."],
    ["Live", "Meci în desfășurare."],
    ["Head-to-head (H2H)", "Istoricul întâlnirilor directe dintre două echipe."],
    ["Interest Score", "Scor 0–100 calculat de SportPulse care indică cât de interesant este un meci."],
    ["TTL", "Time To Live – cât timp o informație din cache este considerată validă."],
    ["MoSCoW", "Metodă de prioritizare: Must / Should / Could / Won't have."],
    ["SP", "Story Points – unitate relativă de estimare a efortului."],
  ]),
);

fs.writeFileSync(OUT_MD, md.join("\n\n") + "\n", "utf8");

// ---------- CSV pentru Jira ----------
function csvEscape(v) { return `"${String(v).replace(/"/g, '""')}"`; }
const csvRows = [["Issue Type", "Summary", "Description", "Priority", "Story Points", "Labels", "Backlog Rank"]];
const jiraPrio = { Must: "Highest", Should: "High", Could: "Medium", "Won't": "Low" };
backlog.forEach((s, i) => {
  const desc = [s.story, "", "Criterii de acceptare:", ...s.ac.map((a, k) => `AC${k + 1}. ${a}`), "",
    `Dependente: ${s.deps}`, `Cerinte: ${s.fr}`, s.notes ? `Note: ${s.notes}` : ""].join("\n");
  csvRows.push(["Story", `${s.id} - ${s.title}`, desc, jiraPrio[s.prio], s.sp, `MoSCoW-${s.prio.replace("'", "")}`, i + 1]);
});
fs.writeFileSync(OUT_CSV, "﻿" + csvRows.map((r) => r.map(csvEscape).join(",")).join("\r\n"), "utf8");

console.log("Scris:", OUT_MD);
console.log("Scris:", OUT_CSV);
console.log(`US: ${backlog.length}, SP total: ${sum(backlog)}, asumate: ${committed.length} (${sum(committed)} SP)`);
