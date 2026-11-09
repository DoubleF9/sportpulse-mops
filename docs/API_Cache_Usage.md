# Cache și contabilizarea cererilor — SCRUM-7 / US20

Branch: `feature/api-cache-monitoring`, bazat pe `main` după integrarea PR #4.

## Comportament

- Toate cererile externe implementate (program, detalii de meci și clasamente de fotbal) trec prin `ApiSportsClient`. Cheia rămâne exclusiv în backend.
- `api_request_usage` păstrează un document pentru fiecare combinație zi UTC/sport: `_id: "2026-11-09:football"`, `date`, `sport`, `requests`, `lastRequestedAt`. Incrementarea folosește un singur upsert MongoDB cu `$inc`, fără citire-modificare-scriere în memorie. Identificatorul unic separă sporturile și zilele și permite folosirea mai multor instanțe backend.
- Se numără tentativele de apel către furnizor, inclusiv erorile HTTP, de rețea și erorile de cotă returnate cu HTTP 200. Datele existente în cache și cererile respinse înaintea transportului nu sunt numărate. Nu există retry automat în client.
- Contoarele încep de la instalarea acestui increment; nu reprezintă istoricul complet sau soldul abonamentului. Dacă MongoDB nu poate înregistra un apel, backend-ul scrie un avertisment și continuă cererea; în acest caz contorul poate subestima consumul. Nu se introduce dashboard-ul US26 sau un endpoint public de administrare.
- Clasamentele folosesc un cache tipizat cu cheia sport/ligă/sezon, valabil șase ore. Datele expirate sunt păstrate pentru fallback. Erorile API nu mai devin clasamente goale salvate în cache. Răspunsurile valide fără rezultate sunt distincte de erori.
- Colecția nouă `cached_standings_responses` evită indexul TTL al vechiului model, care ar putea șterge datele necesare pentru fallback. Colecția veche `cached_standings` nu este modificată. Prima cerere după actualizare reîncarcă aceste clasamente din furnizor; dacă furnizorul este indisponibil la primul apel, nu există încă fallback în noul cache.
- Pagina Clasamente afișează încărcare, ultima actualizare, avertizare pentru date salvate și eroare cu reîncercare. Etichetele demonstrative au fost eliminate. Se păstrează liga și sezonul implicite existente (Liga I, 2023), acum etichetate în pagină. Clasamentele de baschet și hochei nu sunt implementate și au un mesaj explicit, fără apel extern.
- Programul rămâne valabil o oră, detaliile live 60 de secunde, iar celelalte detalii o oră. Nu se adaugă polling automat.

## Verificare manuală

1. Deschideți `/standings`, selectați Fotbal: trebuie să apară grupele reale Liga I, sezonul 2023, cu „Actualizat la …”, fără etichete DEMO. Reîncărcarea în șase ore trebuie să reutilizeze datele salvate.
2. Selectați Baschet sau Hochei: trebuie să apară mesajul de indisponibilitate a funcționalității, fără tabel gol prezentat ca rezultat real. Revenirea la Fotbal reafișează grupele.
3. Verificați programul și paginile de meci pentru toate cele trei sporturi; comportamentul lor trebuie să rămână funcțional.
4. Opțional, în MongoDB Compass, deschideți `SportsPulse.api_request_usage` și filtrați după ziua UTC: `{ "date": "YYYY-MM-DD" }`. Pentru cereri către aceeași resursă încă valabilă în cache, `requests` nu trebuie să crească. Un apel extern nou trebuie să crească numai contorul sportului respectiv. Interogare echivalentă în mongosh:

```javascript
db.api_request_usage.find({ date: "2026-11-09" }, { _id: 0 }).sort({ sport: 1 })
```

Erorile de cotă și fallback-ul sunt verificate automat; nu este necesară epuizarea cotei reale pentru verificarea manuală.

## Validare și jurnal AI

Validare automată: 55 de teste backend și 38 de teste frontend trecute, plus build de producție. Sunt acoperite separarea sporturilor, incrementarea atomică, schimbarea zilei, erorile de contabilizare, HTTP 200 cu eroare de cotă, HTTP 429, eroarea de rețea, cache-ul de șase ore, fallback-ul cu timestamp-ul original, date incomplete, parametri invalizi și stările paginii. Rămâne avertizarea preexistentă de buget SCSS pentru pagina principală.

Verificări cu API-Sports și MongoDB reale: câte un apel nou pentru fiecare sport a crescut contorul corespunzător cu unu; trei repetări în cache pentru fiecare sport nu au schimbat contoarele. Cele nouă cereri repetate prin proxy-ul frontend, pe aceeași mașină și o conexiune MongoDB deja inițializată, au durat între 46 și 160 ms. Aceste valori descriu condițiile locale de testare, nu garantează aceeași latență pe orice rețea. Clasamentul real a returnat trei grupe.

Chrome izolat: clasamente reale, mesaje de date salvate și eroare simulate la nivelul răspunsului HTTP, reîncercare cu revenire la date reale, schimbarea sportului și aspect mobil. Fallback-ul backend este verificat cu teste care simulează furnizorul și repository-ul; nu s-au modificat datele partajate pentru a simula o pană.

Instrument: OpenAI Codex. Solicitare: continuarea Sprintului în PR-uri separate după acceptarea PR #4, cu actualizarea Jira. Rezultat: contabilizarea cererilor și corectarea cache-ului de clasamente pentru SCRUM-7. Code review și validarea manuală de către echipă rămân de completat; tichetul rămâne în Testing până la acceptare.
