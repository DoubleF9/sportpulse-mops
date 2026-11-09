# SportPulse – Proiect MOPS

SportPulse este o aplicație web de tip livescore (în stilul Flashscore) pentru fotbal, baschet și hochei, cu date din [API-Sports](https://dashboard.api-football.com/). Arată programul, scorurile live, clasamentele, echipele și jucătorii, plus favorite, recomandări („Interest Score”) și export în calendar.

Sportul poate fi selectat din meniul de navigare, iar selecția este păstrată în browser.
Pagina principală afișează meciuri reale de fotbal, baschet și hochei din API-Sports pentru ziua selectată (calendar ±7 zile), grupate pe competiții și cu ore locale. Răspunsurile sunt păstrate într-un cache MongoDB de o oră, separat pe sport, dată și fus orar; la indisponibilitatea furnizorului se pot afișa ultimele date salvate, marcate explicit. Disponibilitatea datelor pentru o anumită zi depinde de abonamentul API-Sports.

Detaliile incrementului, verificările și limitările sunt în [docs/Football_Schedule_Increment.md](docs/Football_Schedule_Increment.md).

Pagina fiecărui meci are un URL direct, cu detalii pentru toate cele trei sporturi. Clasamentele de fotbal folosesc un cache de șase ore și afișează ultima actualizare sau datele salvate când furnizorul este indisponibil. Backend-ul înregistrează cererile externe pe sport și zi UTC în MongoDB, fără a număra citirile din cache. Vezi [detalii meci](docs/Match_Details.md) și [cache și consum API](docs/API_Cache_Usage.md) pentru verificări și limitele implementării.

Selectorul „Fus orar” folosește implicit zona browserului și poate salva o preferință locală. Programul, zilele calendaristice, detaliile meciurilor și marcajele de actualizare urmează fusul ales. Domeniul implementat și criteriul de autentificare rămas în așteptare sunt explicate în [docs/Timezone_Preference.md](docs/Timezone_Preference.md).

## Rulare locală

Aplicația are două proiecte: [backend/](backend/) (Spring Boot) și [frontend/](frontend/) (Angular). Pentru cerințe și comenzi de pornire, vezi [DEPENDENCIES.md](DEPENDENCIES.md).

## Etapa I (săptămânile 3–4) – livrabile

| Cerință din enunț | Unde se găsește |
|---|---|
| Constituirea echipei, alegerea temei | [docs/SportPulse_Etapa1_Requirements_Backlog.md](docs/SportPulse_Etapa1_Requirements_Backlog.md) – secțiunile 1–2 |
| Requirements Document (problemă, utilizatori, FR, NFR) | secțiunile 3, 4, 6, 7, 8 |
| Product Goal | secțiunea 5 |
| Use Case Diagram | secțiunea 9 + `docs/diagrams/use_case_diagram.png` / `.puml` |
| User Stories inițiale (≥ 15) + refinement INVEST | secțiunea 10 (27 de povești) |
| Product Backlog inițial (criterii de acceptare, dependențe) | secțiunea 11 + `docs/product_backlog_jira.csv` |
| Prioritizare (MoSCoW) și estimare (Planning Poker) | secțiunile 12–13 |
| Jurnal utilizare AI | secțiunea 15 |

## Ce mai are de făcut echipa

- [ ] Completați numele membrilor, rolurile, grupa și numele echipei (coperta + secțiunea 1).
- [ ] Faceți ședința de **refinement**: citiți poveștile împreună și eliminați, adăugați sau reformulați ce nu vă convine.
- [ ] Faceți ședința de **Planning Poker** și completați tabelul 13.2 (voturile D1–D4, coloana „Final”, justificările pentru diferențe). Dacă valorile finale diferă de cele propuse, actualizați `sp` în `tools/backlog.js` și regenerați documentul.
- [ ] Creați contul API-Sports și verificați în dashboard ce **sezoane** sunt disponibile pe planul gratuit (secțiunea 8.2).
- [ ] Importați `docs/product_backlog_jira.csv` în Jira (*System → External System Import → CSV*) sau creați manual issue-urile în GitHub Projects.
- [ ] Creați workspace-ul de Slack și repository-ul GitHub.
- [ ] Completați jurnalul AI (secțiunea 15): ce ați modificat și cum ați validat.
- [ ] Prezentați tema și Product Backlog-ul cadrului didactic pentru aprobare.

## Regenerarea documentelor

```bash
pip install matplotlib
python tools/use_case_diagram.py      # -> docs/diagrams/use_case_diagram.png
node tools/build_docs.js              # -> docs/*.md + docs/product_backlog_jira.csv
```

Backlog-ul are o singură sursă, `tools/backlog.js`. Modificați poveștile acolo, nu direct în .md, ca documentul și CSV-ul să rămână sincronizate.
