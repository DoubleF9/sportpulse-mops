# Fus orar și preferință locală — SCRUM-12 / US22

Branch: `feature/timezone-preference`, bazat pe `main` după integrarea PR #5.

## Comportament

- Selectorul „Fus orar” este disponibil deasupra conținutului paginilor. Implicit, „Automat” folosește zona IANA detectată de browser. O alegere manuală este validată cu `Intl.DateTimeFormat` și salvată în `localStorage` sub cheia `sportpulse.timezone`. Revenirea la „Automat” șterge alegerea manuală.
- Lista folosește zonele disponibile în browser și include explicit UTC, zona detectată și preferința salvată. Dacă enumerarea nu este disponibilă, există o listă de zone uzuale. Preferințele invalide sunt ignorate. Dacă salvarea este blocată, selecția funcționează în sesiunea curentă și pagina explică faptul că nu va fi păstrată la reîncărcare.
- Programul trimite către backend atât data calendaristică, cât și fusul ales. „Azi”, etichetele zilelor și limitele ±7 zile urmează ziua din acel fus. O dată aleasă explicit rămâne aceeași când se schimbă fusul, cât timp se află în interval; în afara intervalului se revine la ziua curentă.
- Datele calendaristice sunt reprezentate ca `YYYY-MM-DD`, separat de instantul unui meci. Navigarea folosește zile calendaristice, fără a presupune că ziua locală durează 24 de ore. Un verificator local, la 60 de secunde, actualizează „Azi” la trecerea miezului nopții. Nu face cereri periodice de scor: programul este reîncărcat numai dacă se schimbă ziua urmărită.
- Orele meciurilor, data/ora din pagina unui meci și toate marcajele de actualizare folosesc același fus. Conversia folosește regulile IANA pentru data meciului, inclusiv ora de vară/iarnă și zonele cu diferențe fracționare de oră.
- Schimbarea fusului în program poate genera o cerere pentru alt interval calendaristic, cu cache-ul existent separat pe fus. Schimbarea fusului în pagina unui meci sau în clasamente reformatează datele existente fără a le solicita din nou. Restricțiile abonamentului API privind zilele disponibile rămân aplicabile.

## Limita acceptată pentru Sprint 1

Utilizatorul a aprobat preferința salvată în browser și păstrarea criteriului de autentificare în așteptare. Acest increment implementează detectarea, conversia și schimbarea zilei (AC1–AC3), plus mecanismul local de alegere a fusului. **AC4, alegerea asociată unui utilizator autentificat, rămâne neîncheiat până la implementarea autentificării.** Preferința nu este sincronizată într-un cont. Criteriile Jira nu sunt eliminate sau declarate îndeplinite prin această simplificare.

## Verificare manuală

1. Deschideți pagina principală. Selectorul trebuie să fie pe „Automat”, cu fusul browserului. Alegeți `UTC` sau `America/New_York`: orele și fusul afișat trebuie să se actualizeze. Repetați pentru fotbal, baschet și hochei.
2. Reîncărcați pagina: alegerea trebuie păstrată. Deschideți un meci și modificați fusul: data și ora trebuie să se convertească. În Network nu trebuie să apară un nou apel `/api/matches/...` doar pentru conversie.
3. Când un fus precum `Pacific/Kiritimati` este deja în ziua următoare față de browser, apăsați „Azi”: calendarul trebuie să arate ziua acelui fus. Data din cererea `/api/fixtures` trebuie să coincidă cu calendarul, iar parametrul `timezone` cu selecția.
4. Alegeți o dată din calendar, apoi schimbați fusul: data explicită rămâne selectată dacă este în intervalul ±7 zile. Navigarea și butonul Calendar rămân funcționale.
5. Reveniți la „Automat” și reîncărcați: se revine la fusul detectat. Verificați selectorul și pe telefon.

## Validare și jurnal AI

58 de teste frontend trecute și build de producție reușit. Rămâne avertizarea SCSS preexistentă pentru pagina principală. Backend-ul nu necesită modificări în acest increment.

Testele verifică persistența, revenirea la detectare automată, stocarea blocată, preferințe invalide, lista de rezervă, exemplul 21:00 UTC → 00:00 în UTC+3 și ziua următoare, ambele schimbări sezoniere de oră, ani/luni bisecți, zone cu minute fracționare, anularea cererii anterioare pentru toate cele trei sporturi, păstrarea zilei explicite, navigarea ±7 zile peste DST, actualizarea zilei la miezul nopții și reformatarea detaliilor/clasamentelor fără alte cereri. Testele utilitare de dată au fost introduse înaintea implementării și observate eșuând deoarece implementarea lipsea.

Chrome izolat, cu API-Sports real: 91 meciuri de fotbal, 146 de baschet și 19 de hochei pentru 09.11.2026 în `America/New_York`; toate aveau kickoff-ul în ziua selectată în acel fus. Verificate: schimbarea orei în pagina meciului fără refetch, preferință păstrată la reîncărcarea unui URL direct, „Azi” = 10.11.2026 în `Pacific/Kiritimati`, revenire la fusul detectat și aspect mobil.

Instrument: OpenAI Codex. Solicitare: continuarea Sprintului în PR separat după acceptarea PR #5, cu preferință locală aprobată anterior. Rezultat: serviciu comun de fus orar, selector, integrare și teste. Validarea manuală și code review de către echipă rămân în așteptare; SCRUM-12 nu poate fi declarat integral Done cât timp partea de autentificare din AC4 este în așteptare.
