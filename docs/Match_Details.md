# Pagina meciului — SCRUM-16 / US06

Branch: `feature/match-details`, bazat pe `main` după integrarea PR #3.

## Comportament

- Meciurile din program sunt linkuri către `/matches/{sport}/{id}`. Sportul face parte din URL deoarece identificatorii API-urilor pot coincide. Ruta veche `/matches/{id}` redirecționează către fotbal.
- Endpoint-ul `GET /api/matches/{sport}/{id}` validează sportul și identificatorul, apoi normalizează răspunsurile API-Sports pentru fotbal, baschet și hochei.
- Pagina afișează echipele, siglele, scorul, statusul și cronometrul live disponibil, competiția, țara, etapa, ora locală, stadionul/sala și arbitrul. Informațiile absente sunt reprezentate prin „—”, fără a înlocui scorul zero cu un placeholder.
- Scorul la pauză provine din API pentru fotbal; pentru baschet este suma primelor două sferturi, numai dacă ambele valori există. Hocheiul nu afișează un scor la pauză.
- Cache-ul MongoDB este separat pe sport și ID (`cached_match_details`). Datele live sunt reutilizate 60 de secunde, celelalte 60 de minute. Cache-ul expirat poate fi afișat cu avertizare și data actualizării dacă furnizorul nu răspunde. Un rezultat definitiv „meci inexistent” nu este mascat de cache-ul expirat.
- Răspunsurile API cu erori de plan/cotă nu sunt salvate ca date valide. Clientul API comun este folosit de program și detalii. Un eșec al cache-ului nu blochează răspunsul valid al furnizorului.
- Încărcarea, eroarea cu reîncercare și linkul înapoi sunt disponibile. Schimbarea sportului din antet pe pagina unui meci deschide programul sportului ales.

## Verificare manuală

1. Deschideți programul și apăsați un meci de fotbal: pagina trebuie să afișeze aceleași echipe și scor, plus informațiile disponibile.
2. Copiați URL-ul și deschideți-l direct sau reîncărcați pagina: același meci trebuie să apară.
3. Repetați pentru baschet și hochei. Pentru hochei nu trebuie să apară „Scor la pauză”. Valorile lipsă precum stadionul sau arbitrul trebuie să fie „—”.
4. Folosiți „Înapoi la meciuri”, apoi schimbați sportul din antet de pe o pagină de detalii: trebuie să apară programul sportului ales.
5. Deschideți `/matches/hockey/0`: trebuie să apară un mesaj de identificator invalid. Verificați și aspectul pe ecran de telefon.

## Validare și jurnal AI

Validare automată: 31 de teste backend și 32 de teste frontend trecute; build de producție reușit, cu avertizarea existentă de buget SCSS pentru pagina principală. Testele acoperă normalizarea celor trei sporturi, scorul zero, date lipsă, cache separat, fallback, răspuns 404, identificator neașteptat, durata cache-ului live, validarea rutelor, reîncercarea, anularea cererilor anterioare și accesul direct. Testul linkului din program a fost observat eșuând înaintea implementării.

Verificări locale cu furnizorul real: scoruri și reutilizarea cache-ului pentru toate cele trei sporturi. Verificare într-un Chrome izolat: navigare din program, reîncărcarea URL-ului direct, întoarcere, schimbarea sportului, identificator invalid și aspect mobil.

Instrument: OpenAI Codex. Solicitare: continuarea Sprintului după acceptarea și integrarea PR #3, într-un PR separat și verificabil. Rezultat: endpoint, cache, pagină Angular și teste pentru SCRUM-16. Validarea manuală de către echipă și code review rămân de completat; tichetul rămâne în Testing până la acceptare. Nu se introduce polling automat sau autentificare în acest PR.
