// Sursa unica pentru Product Backlog (folosita la generarea documentului .docx si a CSV-ului).
// Ordinea din array = ordinea din Product Backlog (stabilita de Product Owner).
// sp = estimare PROPUSA (punct de plecare); valoarea finala se stabileste prin Planning Poker.

module.exports = [
  {
    id: "US20", title: "Încărcare rapidă a datelor (cache server-side)", prio: "Must", sp: 8, fr: "FR16, NFR-01, NFR-02", deps: "—",
    story: "Ca vizitator, vreau ca paginile să se încarce rapid și să funcționeze chiar și când limita zilnică a API-ului este atinsă, pentru a avea o experiență fluidă.",
    notes: "Implementare: strat de cache pe server cu TTL diferențiat (live 60 s, program zilnic 1 h, clasamente 6 h, echipe/jucători 24 h). Este primul în backlog pentru că toate celelalte povești depind de el și reduce cel mai mare risc tehnic (limita de 100 cereri/zi).",
    ac: [
      "Cheia API nu apare în codul frontend și nici în repository (este citită dintr-o variabilă de mediu pe server).",
      "Dată fiind o cerere identică în perioada TTL, când este repetată, atunci nu se face nicio cerere nouă către API-Sports.",
      "Răspunsul backend-ului pentru date aflate în cache durează sub 500 ms.",
      "Dacă API-Sports întoarce eroare sau limita zilnică este atinsă, se returnează ultimele date salvate, marcate „actualizat la HH:MM”.",
      "Există un contor de cereri zilnice per sport (folosit de US26).",
    ],
  },
  {
    id: "US01", title: "Selectarea sportului", prio: "Must", sp: 2, fr: "FR1", deps: "—",
    story: "Ca vizitator, vreau să aleg sportul care mă interesează (fotbal, baschet, hochei) dintr-un meniu, pentru a vedea doar meciurile din acel sport.",
    ac: [
      "Meniul afișează toate sporturile active (minim fotbal, baschet, hochei).",
      "La selectarea unui sport, lista de meciuri se reîncarcă doar cu meciurile acelui sport, fără reîncărcarea întregii pagini.",
      "Sportul selectat este evidențiat și este păstrat la revenirea în aplicație (în același browser).",
      "La prima accesare este selectat implicit fotbalul.",
    ],
  },
  {
    id: "US02", title: "Programul meciurilor din ziua curentă", prio: "Must", sp: 5, fr: "FR2", deps: "US01, US20",
    story: "Ca vizitator, vreau să văd lista meciurilor de azi pentru sportul ales, grupate pe competiții, pentru a ști rapid ce meciuri se joacă.",
    ac: [
      "Meciurile sunt grupate pe țară + competiție, cu sigla competiției.",
      "Fiecare meci afișează ora de start, echipele cu sigle, scorul (dacă a început) și statusul: Programat / Live / Final / Amânat.",
      "În cadrul unei competiții, meciurile sunt sortate după ora de start.",
      "Dacă nu există meciuri, se afișează mesajul „Nu există meciuri pentru această zi”.",
    ],
  },
  {
    id: "US22", title: "Ore afișate în fusul orar local", prio: "Must", sp: 2, fr: "FR14", deps: "US02",
    story: "Ca vizitator, vreau ca orele meciurilor să fie afișate în fusul meu orar, pentru a nu calcula diferențe de oră.",
    ac: [
      "Fusul orar este detectat automat din browser.",
      "Toate orele din aplicație sunt afișate în acest fus orar.",
      "Un meci programat la 21:00 UTC apare la 00:00 în UTC+3 și este listat în ziua următoare.",
      "Utilizatorul autentificat poate seta manual un alt fus orar.",
    ],
  },
  {
    id: "US03", title: "Navigarea între zile", prio: "Must", sp: 3, fr: "FR2", deps: "US02",
    story: "Ca vizitator, vreau să navighez între zile (ieri, azi, mâine și un calendar de ±7 zile), pentru a vedea rezultatele trecute și meciurile care urmează.",
    ac: [
      "Există o bară cu zilele de la -3 la +3 față de azi și un buton de calendar.",
      "Selectarea unei zile încarcă meciurile acelei zile.",
      "Ziua curentă este marcată cu eticheta „Azi”.",
      "Zilele din afara intervalului suportat (±7 zile) sunt dezactivate în calendar.",
    ],
  },
  {
    id: "US06", title: "Pagina meciului – informații de bază", prio: "Must", sp: 3, fr: "FR5", deps: "US02",
    story: "Ca vizitator, vreau să deschid pagina unui meci și să văd informațiile principale, pentru a afla contextul meciului.",
    notes: "Story de referință pentru Planning Poker (3 SP).",
    ac: [
      "Click pe un meci deschide pagina dedicată, cu URL propriu (poate fi distribuit).",
      "Se afișează: echipe și sigle, scor (inclusiv la pauză), status/minut, competiție și etapă, data și ora locală, stadion, arbitru.",
      "Câmpurile care lipsesc din răspunsul API sunt afișate ca „—”, fără erori.",
    ],
  },
  {
    id: "US04", title: "Scoruri live actualizate automat", prio: "Must", sp: 5, fr: "FR3", deps: "US02, US20",
    story: "Ca vizitator, vreau ca scorurile meciurilor în desfășurare să se actualizeze automat, pentru a urmări meciurile fără să reîmprospătez pagina.",
    ac: [
      "Filtrul „Live” afișează doar meciurile în desfășurare.",
      "Scorul și minutul se actualizează la cel mult 60 s, fără refresh manual.",
      "Când scorul unui meci se schimbă, meciul este evidențiat vizual timp de 5 s.",
      "Când meciul se termină, statusul devine „Final” și meciul dispare din filtrul Live.",
    ],
  },
  {
    id: "US10", title: "Clasamentul competiției", prio: "Must", sp: 5, fr: "FR6", deps: "US01, US20",
    story: "Ca vizitator, vreau să văd clasamentul unei competiții, pentru a înțelege poziția echipelor.",
    ac: [
      "Coloane: poziție, echipă, meciuri jucate, V/E/Î, golaveraj, puncte, forma (ultimele 5 meciuri).",
      "Competițiile cu grupe afișează câte un tabel pentru fiecare grupă.",
      "Zonele de calificare/retrogradare sunt colorate conform descrierii din API.",
      "Clasamentul este accesibil din pagina meciului și din lista competiției.",
    ],
  },
  {
    id: "US05", title: "Filtrare după țară și competiție", prio: "Should", sp: 3, fr: "FR4", deps: "US02",
    story: "Ca vizitator, vreau să filtrez meciurile după țară și competiție, pentru a vedea doar ligile care mă interesează.",
    ac: [
      "Filtrul listează țările și competițiile care au meciuri în ziua selectată.",
      "Se pot selecta mai multe competiții simultan.",
      "Filtrul se combină cu ziua selectată și cu filtrul Live.",
      "Butonul „Resetează filtrele” revine la lista completă.",
    ],
  },
  {
    id: "US11", title: "Pagina echipei", prio: "Should", sp: 5, fr: "FR7", deps: "US06",
    story: "Ca vizitator, vreau să deschid pagina unei echipe, pentru a vedea informațiile ei, ultimele rezultate și următoarele meciuri.",
    ac: [
      "Se afișează nume, siglă, țară, an fondare, stadion.",
      "Ultimele 5 rezultate sunt afișate cu indicator colorat V/E/Î.",
      "Următoarele 5 meciuri sunt afișate cu dată și adversar.",
      "Pagina este accesibilă din pagina meciului, din clasament și din căutare.",
    ],
  },
  {
    id: "US12", title: "Lotul echipei", prio: "Should", sp: 3, fr: "FR7", deps: "US11",
    story: "Ca vizitator, vreau să văd lotul de jucători al unei echipe, grupat pe posturi, pentru a cunoaște jucătorii.",
    ac: [
      "Jucătorii sunt grupați pe posturi (ex. fotbal: portari, fundași, mijlocași, atacanți).",
      "Pentru fiecare jucător: fotografie, nume, număr, vârstă.",
      "Click pe un jucător deschide profilul acestuia (US13).",
    ],
  },
  {
    id: "US13", title: "Profilul jucătorului", prio: "Should", sp: 5, fr: "FR8", deps: "US12",
    story: "Ca vizitator, vreau să văd profilul unui jucător cu statisticile din sezon, pentru a-i evalua forma.",
    ac: [
      "Date personale: nume, vârstă, naționalitate, înălțime, poziție, fotografie.",
      "Statistici sezon (fotbal): meciuri, minute, goluri, pase decisive, cartonașe.",
      "Se poate alege sezonul dintre cele disponibile în planul API.",
      "Dacă statisticile lipsesc, se afișează un mesaj explicit, nu o pagină goală.",
    ],
  },
  {
    id: "US07", title: "Cronologia evenimentelor din meci", prio: "Should", sp: 5, fr: "FR5", deps: "US06, US04",
    story: "Ca vizitator, vreau să văd cronologia evenimentelor unui meci (goluri, cartonașe, schimbări), pentru a înțelege desfășurarea lui.",
    ac: [
      "Evenimentele sunt ordonate după minut și au iconiță de tip, jucător și echipă.",
      "Golurile afișează și autorul pasei decisive, dacă există.",
      "Pentru meciurile live, cronologia se actualizează odată cu scorul.",
      "Pentru sporturile la care API-ul nu oferă evenimente, secțiunea este ascunsă.",
    ],
  },
  {
    id: "US14", title: "Căutare echipe, jucători, competiții", prio: "Should", sp: 5, fr: "FR9", deps: "US11, US13",
    story: "Ca vizitator, vreau să caut o echipă, un jucător sau o competiție după nume, pentru a ajunge rapid la pagina dorită.",
    ac: [
      "Căutarea pornește de la minim 3 caractere.",
      "Rezultatele sunt grupate pe tip (echipe / jucători / competiții), maxim 10 per tip.",
      "Click pe un rezultat deschide pagina corespunzătoare.",
      "Fără rezultate se afișează „Niciun rezultat”; tastarea rapidă nu generează mai mult de o cerere API per termen (debounce 400 ms + cache).",
    ],
  },
  {
    id: "US15", title: "Înregistrare cont", prio: "Should", sp: 3, fr: "FR10", deps: "—",
    story: "Ca vizitator, vreau să îmi creez un cont cu email și parolă, pentru a-mi salva preferințele.",
    ac: [
      "Emailul trebuie să aibă format valid și să nu fie deja folosit.",
      "Parola are minim 8 caractere și cel puțin o cifră.",
      "Parola este stocată doar ca hash (bcrypt).",
      "După înregistrare, utilizatorul este autentificat automat.",
    ],
  },
  {
    id: "US16", title: "Autentificare și delogare", prio: "Should", sp: 3, fr: "FR10", deps: "US15",
    story: "Ca utilizator înregistrat, vreau să mă autentific și să mă deloghez, pentru a-mi accesa favoritele de pe orice dispozitiv.",
    ac: [
      "Autentificare cu email și parolă; la credențiale greșite se afișează un mesaj generic.",
      "Sesiunea (JWT) expiră după 7 zile.",
      "După delogare, paginile care necesită cont nu mai sunt accesibile.",
      "După 5 încercări eșuate consecutive, contul este blocat temporar 5 minute.",
    ],
  },
  {
    id: "US17", title: "Echipe și competiții favorite", prio: "Should", sp: 3, fr: "FR11", deps: "US16, US11",
    story: "Ca utilizator înregistrat, vreau să marchez echipe și competiții ca favorite, pentru a le urmări mai ușor.",
    ac: [
      "Butonul „stea” apare pe pagina echipei, a competiției și în lista de meciuri.",
      "Favoritele sunt salvate în cont și rămân după delogare/relogare.",
      "Există o listă de favorite din care se pot elimina elemente.",
      "Un vizitator neautentificat care apasă „stea” este invitat să se autentifice.",
    ],
  },
  {
    id: "US18", title: "Tab-ul „Meciurile mele”", prio: "Should", sp: 3, fr: "FR11", deps: "US17",
    story: "Ca utilizator înregistrat, vreau un tab „Meciurile mele” cu meciurile echipelor și competițiilor favorite, pentru a nu căuta prin toate meciurile.",
    ac: [
      "Tab-ul afișează meciurile din ziua selectată care implică favoritele, din toate sporturile.",
      "Meciurile sunt ordonate cronologic.",
      "Dacă nu există favorite, se afișează un mesaj cu link către adăugarea lor.",
    ],
  },
  {
    id: "US23", title: "Meciuri recomandate – Interest Score (inovare)", prio: "Should", sp: 8, fr: "FR17", deps: "US02, US10",
    story: "Ca vizitator, vreau ca aplicația să evidențieze „meciurile zilei” pe baza unui scor de interes, pentru a descoperi rapid cele mai importante meciuri.",
    notes: "Element de inovare al proiectului. Scorul 0–100 combină: diferența de poziții în clasament, importanța competiției, derby/istoric direct, prezența echipelor favorite și (pentru fotbal) predicțiile din API. Candidat bun pentru TDD (funcție pură, ușor de testat unitar).",
    ac: [
      "Fiecare meci programat primește un scor 0–100 calculat de o funcție documentată și acoperită de teste unitare.",
      "Secțiunea „Recomandate azi” afișează primele 5 meciuri după scor.",
      "Pentru utilizatorul autentificat, meciurile cu echipe favorite primesc un bonus de scor.",
      "Un tooltip explică motivul recomandării (ex. „Derby, locurile 1 vs 2”).",
    ],
  },
  {
    id: "US24", title: "Export meci în calendar (.ics) (inovare)", prio: "Should", sp: 3, fr: "FR18", deps: "US06",
    story: "Ca vizitator, vreau să adaug un meci în calendarul meu (Google / Outlook) printr-un fișier .ics, pentru a nu uita de el.",
    ac: [
      "Butonul „Adaugă în calendar” apare la meciurile programate.",
      "Fișierul .ics este valid (RFC 5545) și conține titlul „Echipa A vs Echipa B”, ora de start, o durată estimată per sport și competiția în descriere.",
      "Fișierul se importă corect în Google Calendar și Outlook.",
    ],
  },
  {
    id: "US08", title: "Statisticile meciului", prio: "Could", sp: 3, fr: "FR5", deps: "US06",
    story: "Ca vizitator, vreau să văd statisticile comparative ale meciului (posesie, șuturi, cornere), pentru a evalua cum a jucat fiecare echipă.",
    ac: [
      "Fiecare statistică este afișată ca bară comparativă gazde / oaspeți.",
      "Valorile corespund răspunsului API pentru meciul respectiv.",
      "Pentru meciurile neîncepute se afișează „Statistici indisponibile”.",
    ],
  },
  {
    id: "US21", title: "Istoric direct (head-to-head)", prio: "Could", sp: 3, fr: "FR13", deps: "US06",
    story: "Ca vizitator, vreau să văd istoricul meciurilor directe dintre cele două echipe, pentru a avea context înaintea meciului.",
    ac: [
      "Se afișează ultimele 10 întâlniri directe cu dată, competiție și scor.",
      "Se afișează un sumar V/E/Î pentru fiecare echipă.",
      "Informația este un tab în pagina meciului.",
    ],
  },
  {
    id: "US09", title: "Formațiile de start", prio: "Could", sp: 5, fr: "FR5", deps: "US06, US13",
    story: "Ca vizitator, vreau să văd formațiile de start și rezervele, pentru a ști ce jucători sunt pe teren.",
    ac: [
      "Se afișează sistemul de joc (ex. 4-3-3), titularii cu număr și poziție, rezervele și antrenorul.",
      "Click pe un jucător deschide profilul acestuia.",
      "Dacă API-ul nu a publicat încă formațiile, se afișează „Formațiile nu sunt disponibile încă”.",
    ],
  },
  {
    id: "US19", title: "Notificări pentru meciurile favorite", prio: "Could", sp: 8, fr: "FR12", deps: "US17, US04",
    story: "Ca utilizator înregistrat, vreau să primesc notificări în browser la începutul meciului, la gol și la final pentru echipele favorite, pentru a fi la curent fără să stau în aplicație.",
    ac: [
      "Utilizatorul poate activa/dezactiva fiecare tip de notificare (start, gol, final).",
      "Aplicația cere permisiunea browserului înainte de prima notificare.",
      "Notificarea apare în maxim 2 minute de la eveniment.",
      "Click pe notificare deschide pagina meciului.",
    ],
  },
  {
    id: "US25", title: "Administrare sporturi și competiții afișate", prio: "Could", sp: 5, fr: "FR15", deps: "US16, US20",
    story: "Ca administrator, vreau să configurez sporturile și competițiile populare afișate implicit, pentru a controla conținutul și consumul de cereri API.",
    ac: [
      "Pagina de administrare este accesibilă doar utilizatorilor cu rol ADMIN.",
      "Administratorul poate activa/dezactiva un sport.",
      "Administratorul poate marca competiții ca „populare” (afișate primele).",
      "Modificările sunt vizibile în aplicație fără redeploy.",
    ],
  },
  {
    id: "US26", title: "Monitorizarea consumului API", prio: "Could", sp: 3, fr: "FR15", deps: "US20, US25",
    story: "Ca administrator, vreau să văd consumul zilnic de cereri API per sport, pentru a preveni depășirea limitei planului.",
    ac: [
      "Pagina afișează cererile folosite / rămase per sport, pentru azi și ultimele 7 zile.",
      "La depășirea a 80% din limita zilnică apare un avertisment.",
      "Datele provin din contorul intern (US20) și sunt comparate cu endpoint-ul /status al API-ului.",
    ],
  },
  {
    id: "US27", title: "Temă întunecată / luminoasă", prio: "Won't", sp: 2, fr: "NFR-05", deps: "—",
    story: "Ca vizitator, vreau să comut între tema întunecată și cea luminoasă, pentru a folosi aplicația confortabil seara.",
    notes: "Nu este planificată în această versiune; păstrată în backlog pentru o versiune ulterioară.",
    ac: [
      "Un comutator în antet schimbă tema imediat.",
      "Tema aleasă este reținută în browser.",
    ],
  },
];
