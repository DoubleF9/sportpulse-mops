# Programul meciurilor de fotbal — increment 09.11.2026

Branch: `feature/football-match-schedule`.

## Funcționalitate

- Pagina principală încarcă meciuri reale de fotbal din API-Sports pentru ziua selectată.
- Bara ieri/azi/mâine și calendarul ±7 zile solicită programul zilei alese. Schimbarea zilei anulează cererea anterioară din browser.
- Backend-ul trimite data și fusul orar al browserului furnizorului; frontend-ul afișează ora locală din timestamp-ul meciului.
- Meciurile sunt grupate pe competiție și sortate cronologic în fiecare grup. Sunt afișate siglele, echipele, scorurile disponibile și statusurile (inclusiv amânat/anulat).
- Există stări distincte pentru încărcare, zi fără meciuri și eroare, cu buton de reîncercare.
- Cache MongoDB tipizat, separat pe dată și fus orar, cu valabilitate de o oră. O intrare expirată este păstrată pentru fallback la indisponibilitatea API-ului, cu avertisment și data ultimei actualizări.
- Erorile de cotă/abonament returnate de API-Sports cu HTTP 200 sunt tratate ca erori, fără a suprascrie cache-ul cu o listă goală.

## Contract API

`GET /api/fixtures?date=2026-11-09&timezone=Europe%2FBucharest`

Endpoint-ul este dedicat fotbalului. `date` este obligatoriu, în format ISO; `timezone` este opțional și implicit `UTC`. Datele și fusurile orare invalide primesc HTTP 400. Dacă furnizorul nu este disponibil și nu există date salvate, se întoarce HTTP 502. Răspunsul conține `competitions`, `updatedAt` și `stale`.

## Verificare

- Backend: `cd backend`, apoi `./mvnw test` (PowerShell: `.\mvnw.cmd test`).
- Frontend: `cd frontend`, apoi `npm test -- --watch=false` și `npm run build`.
- Testele noi verifică gruparea și sortarea, scorurile necunoscute, folosirea cache-ului, fallback-ul, erorile furnizorului, validarea parametrilor, selecția zilei, anularea cererilor vechi, reîncercarea, statusurile și delimitarea previzualizărilor de alte sporturi.

Rezultate verificate de Codex: 11 teste backend și 13 teste frontend trecute; build de producție reușit (avertisment de buget SCSS pe pagina principală, existent și înaintea incrementului). Verificarea prin proxy-ul frontend a returnat 107 meciuri pentru 09.11 și 1.241 pentru 08.11; cache-ul MongoDB a fost reutilizat inclusiv după repornirea backend-ului. Au fost verificate și răspunsurile pentru data restricționată (502 cu mesaj de plan) și fus orar invalid (400).

Verificare manuală de către un alt Developer (de completat de echipă):

1. Porniți backend-ul și frontend-ul conform `DEPENDENCIES.md`.
2. Selectați Fotbal; verificați echipele reale, siglele și orele locale.
3. Selectați ieri, mâine și o dată din calendar; comparați parametrul `date` din Network cu ziua afișată.
4. Verificați că repetarea cererii întoarce același `updatedAt` în perioada de cache.
5. Selectați Baschet/Hochei; acestea trebuie să fie marcate drept previzualizări.
6. Opriți backend-ul, selectați altă zi și verificați eroarea; reporniți backend-ul și apăsați Reîncearcă.

## Trasabilitate și limite

| Story | Contribuția acestui increment | Ce rămâne |
|---|---|---|
| US02 | Program real de fotbal, grupare, sortare, sigle, scoruri, statusuri, zi goală | Integrarea baschet/hochei; validare de către echipă |
| US03 | Navigare între zile și calendar ±7, conectate la date reale de fotbal | Verificare de acceptare și celelalte sporturi |
| US22 | Fus orar automat, interogare și afișare locală | Preferință manuală pentru utilizator autentificat |
| US20 | Cache pentru program, fallback și protejarea cheii pe server | Contor zilnic per sport și politica comună pentru toate endpoint-urile |

Nu există polling în acest increment. Scorurile sunt cele din ultimul răspuns și pot avea vechime de până la o oră; US04 nu este implementat. Butonul de reîncercare reia solicitarea aplicației, fără a ocoli cache-ul serverului. Disponibilitatea datelor depinde de planul API-Sports.

La verificarea din 09.11.2026, cheia echipei a permis accesul la datele 07–09.11.2026 și a refuzat data 10.11.2026 cu eroare de plan. Interfața afișează explicit această restricție; disponibilitatea intervalului ±7 zile depinde de abonament.

Acest increment nu declară stories acceptate și nu reprezintă dovadă de Planning Poker, Pair Programming sau TDD. Aceste activități și acceptarea trebuie realizate de echipă.

## Jurnal AI

| Câmp | Înregistrare |
|---|---|
| Instrument | OpenAI Codex |
| Scop | Implementarea unui increment pentru programul de fotbal și navigarea între zile, respectând structura existentă |
| Solicitare | Implementarea a două funcționalități utile pentru checkpoint, pe branch separat, cu convențiile proiectului; Jira este orientativ și nu trebuie modificat |
| Rezultat | Endpoint, DTO-uri, service, cache/repository MongoDB, integrare Angular, teste automate și această documentație |
| Verificare efectuată de instrument | Teste backend/frontend, build frontend și verificare API; rezultatele exacte sunt raportate în conversația de livrare |
| Modificări și validare de către echipă | De completat după code review și verificarea manuală de către un Developer diferit de implementator |
