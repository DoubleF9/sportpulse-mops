# SportPulse – Proiect MOPS

SportPulse este o aplicație web de tip livescore (în stilul Flashscore) pentru fotbal, baschet și hochei, cu date din [API-Sports](https://dashboard.api-football.com/). Arată programul, scorurile live, clasamentele, echipele și jucătorii, plus favorite, recomandări („Interest Score”) și export în calendar.

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
