# Program real pentru fotbal, baschet și hochei

Branch: `feature/multisport-schedules`, bazat pe `main` după integrarea programului de fotbal.

## Schimbare

`GET /api/fixtures` acceptă parametrul `sport=football|basketball|hockey` (implicit `football`). Sporturile invalide primesc HTTP 400. Fiecare furnizor este convertit la același model de meciuri, păstrând scorurile necunoscute ca `null`. Ceasul și statusurile sunt interpretate în funcție de sport: minute la fotbal, sferturi la baschet, reprize la hochei.

Cache-ul existent și fallback-ul sunt separate pe sport, dată și fus orar. Schimbarea sportului sau zilei anulează solicitarea precedentă din browser. Nu se adaugă polling; scorurile reprezintă ultima actualizare din cache (valabilitate de o oră).

Contribuie la SCRUM-8 (selecția sportului), SCRUM-9 (program zilnic) și SCRUM-10 (navigare între zile). Acceptarea de către un alt Developer rămâne de efectuat. Restricția de abonament asupra datelor calendaristice nu este eliminată de acest PR.

## Verificare manuală cerută utilizatorului

1. Deschideți aplicația și selectați pe rând Fotbal, Baschet și Hochei. Așteptat: echipe și competiții reale, fără etichete DEMO sau previzualizări.
2. La fiecare sport, selectați Ieri și Azi. Așteptat: cererea `/api/fixtures` conține sportul și data selectate; programul se schimbă corespunzător.
3. Schimbați rapid sportul și ziua. Așteptat: rezultatul final corespunde ultimei selecții, fără amestecarea sporturilor.
4. Verificați ordinea cronologică, scorurile și lipsa scorului la meciurile neîncepute. Sferturile/reprizele nu trebuie afișate ca minute de fotbal.
5. Reîncărcați pagina. Așteptat: sportul ales este păstrat; solicitarea poate reutiliza datele din cache.
6. Selectați o zi nepermisă de planul API. Așteptat: mesaj explicit de restricție, fără meciuri demonstrative sau rezultate rămase din ziua precedentă.

## Verificări automate și utilizarea AI

Testele acoperă scorurile și ceasurile diferite între furnizori, validarea sportului, separarea cache-urilor, schimbarea sportului/datei și statusurile specifice. Înaintea implementării, cele două teste de integrare Angular pentru încărcarea baschetului și hocheiului au eșuat deoarece aplicația nu solicita date reale pentru aceste sporturi; după implementare trec.

Instrument: OpenAI Codex. Scop: extinderea programului real la toate cele trei sporturi, cu PR separat și verificare manuală. Solicitare: implementarea funcționalităților Sprintului în PR-uri mici, dependente unde este necesar, cu actualizarea stărilor Jira și corectarea referințelor tehnice minore. Rezultat: adaptoare backend, selecție de sport în endpoint, prezentare comună în Angular și teste. Validare de către instrument: teste, build și verificări asupra API-urilor reale. Modificări și validare de către echipă: de completat după code review și verificarea de mai sus.
