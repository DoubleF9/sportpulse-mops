# Dependențe și configurarea mediului

Ce trebuie instalat pentru a rula SportPulse local.

## Ce trebuie instalat

| Unealtă                                                | Versiune                       | Verificare        | Observații                                                                                          |
| ------------------------------------------------------- | ------------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------- |
| [Git](https://git-scm.com/downloads)                     | orice versiune recentă        | `git --version` |                                                                                                      |
| [JDK](https://adoptium.net/temurin/releases/?version=21) | 21                             | `java -version` | `JAVA_HOME` trebuie să indice JDK 21, mai ales dacă aveți mai multe versiuni de Java instalate. |
| [Node.js](https://nodejs.org/)                           | 24 LTS (recomandat) sau 22.12+ | `node -v`       | Angular 21 acceptă Node `^20.19`, `^22.12` sau `>=24`.                                        |
| npm                                                     | vine cu Node.js                | `npm -v`        |                                                                                                      |

**Nu trebuie instalate separat:**

- **Maven:** backend-ul vine cu Maven Wrapper (`mvnw` / `mvnw.cmd`), care descarcă singur versiunea potrivită.
- **Angular CLI:** este instalat local prin `npm install`. Comenzile merg cu `npm start` sau `npx ng ...`.

**Baza de date** nu se instalează local: echipa folosește baza comună `SportsPulse` din MongoDB Atlas. Pentru vizualizarea datelor puteți instala opțional [MongoDB Compass](https://www.mongodb.com/products/tools/compass).

## Configurarea backend-ului

Backend-ul citește secretele din `backend/.env`, fișier care nu se pune în Git:

1. Copiați `backend/.env.example` în `backend/.env`.
2. Completați `MONGODB_URI` și `API_SPORTS_KEY` cu valorile primite pe canalul privat al echipei.

Fără `MONGODB_URI`, backend-ul nu pornește și afișează eroarea `The connection string is invalid`. `API_SPORTS_KEY` nu este folosită încă.

## Pornirea aplicației

Backend-ul și frontend-ul rulează în două terminale separate, ambele pornite din rădăcina repository-ului.

**Backend** ([http://localhost:8080](http://localhost:8080)):

```bash
cd backend                  # din acest director se citește fișierul .env
./mvnw spring-boot:run      # Windows (PowerShell): .\mvnw.cmd spring-boot:run
```

**Frontend** ([http://localhost:4200](http://localhost:4200)):

```bash
cd frontend
npm install                 # doar prima dată și când se schimbă package.json
npm start
```

Deschideți [http://localhost:4200](http://localhost:4200). Pagina principală trebuie să afișeze `Backend: UP`. Dacă afișează `Backend: indisponibil`, backend-ul nu rulează.

În dezvoltare, cererile către `/api` sunt redirecționate de la frontend la backend prin `frontend/proxy.conf.json`.

## Rularea testelor

```bash
cd backend  && ./mvnw test
cd frontend && npm test -- --watch=false
```

## Biblioteci folosite

Versiunile exacte sunt în `backend/pom.xml` și `frontend/package-lock.json`.

| Componentă | Biblioteci                                     |
| ----------- | ---------------------------------------------- |
| Backend     | Spring Boot 4.1 (Web MVC, Validation, Data MongoDB), JUnit 5 |
| Frontend    | Angular 21, RxJS, TypeScript 5.9, SCSS, Vitest |

## Extensii recomandate pentru editor (opțional)

- **VS Code:** Angular Language Service, Extension Pack for Java, Spring Boot Extension Pack.
- **IntelliJ IDEA:** suportul pentru Spring și Angular este inclus în ediția Ultimate. În Community, frontend-ul se editează mai comod în VS Code.
