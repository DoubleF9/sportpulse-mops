# Filtrarea meciurilor — SCRUM-11 / US05

Branch: `feature/match-filters`, bazat pe `main` după integrarea PR #2.

## Comportament

- Țările și competițiile disponibile sunt derivate din meciurile zilei selectate, pentru sportul selectat. Competițiile fără meciuri sunt excluse.
- Selectarea unei țări restrânge lista competițiilor. Se pot bifa simultan mai multe competiții; fără selecție sunt afișate toate.
- Filtrul „Doar meciuri live” folosește statusurile specifice fiecărui sport, din ultima actualizare. Nu introduce polling sau apeluri suplimentare către API.
- „Resetează filtrele” elimină țara, competițiile selectate și opțiunea Live.
- La schimbarea zilei, selecțiile valide sunt păstrate. Selecțiile absente din noul program sunt eliminate. La schimbarea sportului, filtrele sunt resetate pentru a evita coliziuni între identificatorii competițiilor.
- Mesajul „Niciun meci nu corespunde filtrelor selectate” este distinct de ziua fără meciuri. Numărul de meciuri afișate este raportat la totalul programului.

## Verificare manuală

1. Deschideți pagina principală și așteptați încărcarea programului. Selectați o țară: lista trebuie să conțină numai competițiile acesteia.
2. Deschideți Competiții și bifați două opțiuni: ambele trebuie să fie afișate; celelalte competiții trebuie ascunse.
3. Activați „Doar meciuri live”: rămân numai meciurile cu status live din selecția curentă. Dacă nu există astfel de meciuri, apare mesajul specific filtrelor.
4. Apăsați „Resetează filtrele”: se revine la programul complet, iar opțiunea Live este debifată.
5. Schimbați ziua: opțiunile provin din noul program; selecțiile încă valabile rămân active. Schimbați sportul: selecțiile sunt eliminate.
6. În Network, modificarea filtrelor nu trebuie să adauge cereri `/api/fixtures`. Selectarea unei alte zile sau a altui sport solicită în continuare noul program.

## Validare și jurnal AI

Testele noi verifică țara, selecția multiplă, combinarea cu Live, resetarea, păstrarea/eliminarea selecțiilor la schimbarea zilei și resetarea la schimbarea sportului. Primele trei teste au fost observate eșuând înaintea implementării. O regresie suplimentară a identificat și verifică acum păstrarea valorii vizibile a țării atunci când opțiunile sunt reconstruite după încărcare.

Validare automată: 22 teste frontend trecute și build de producție. Verificare într-un Chrome izolat: țară, două competiții, Live, resetare, control mobil și zero cereri suplimentare de program la modificarea filtrelor. Backend-ul nu este modificat de acest PR.

Instrument: OpenAI Codex. Scop: implementarea SCRUM-11 într-un PR separat, cu teste și verificare manuală de către utilizator. Solicitare: continuarea Sprintului după integrarea PR #2, în schimbări mici și verificabile, cu actualizarea stărilor Jira. Rezultat: componentă Angular de filtrare, integrare cu programul existent și teste. Modificări/validare de către echipă: de completat după code review și verificarea manuală. SCRUM-11 rămâne în Testing până la acceptare.
