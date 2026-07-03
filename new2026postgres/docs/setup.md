# new2026 — Setup

A standalone Express.js + MongoDB study project (separate from the
`authors`/`books` app at the repo root). Static HTML/CSS interface is done
(`new2026/assets/`); the Express app, routes, and MongoDB models are yours to
build as interview practice.

## What's here so far

```
new2026/
  assets/
    index.html       # landing page, links to teams.html / matches.html
    teams.html        # Register a Team form
    matches.html      # Register a Match form (team dropdowns + goals)
    css/style.css
  docs/
    setup.md          # this file
```

Open `assets/index.html` directly in a browser to see the interface. The
forms don't submit anywhere yet, and the team `<select>` options in
`matches.html` are hardcoded placeholders — populating them from your
`GET /teams` route (and wiring the form submits) is part of the exercise.

## Suggested project structure to build

```
new2026/
  server.js
  routes/
    teams.js
    matches.js
  models/
    Team.js
    Match.js
  .env
```

---

## 1. Prerequisites

- Node.js >= 18 (`node -v`)
- MongoDB running locally (or a remote connection string)

## 2. Initialize the project

From `new2026/`:

```bash
cd new2026
npm init -y
npm install express mongoose dotenv
npm install --save-dev nodemon
```

Add these scripts to `new2026/package.json`:

```json
"scripts": {
  "start": "node server.js",
  "devStart": "nodemon server.js"
}
```

Run it:

```bash
npm run devStart   # dev, auto-restart on file changes
npm start          # plain node
```

## 3. Environment variables

Create `new2026/.env`:

```
DATABASE_URL=mongodb://localhost:27017/soccer_study
PORT=3000
```

Load it in `server.js` the same way the root project does:

```js
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
```

Serve the static interface with:

```js
app.use(express.static('assets'));
```

---

## 4. Create the MongoDB database

MongoDB creates a database lazily — it only actually appears once you insert
the first document. On macOS:

```bash
# one-time install
brew tap mongodb/brew
brew install mongodb-community@7.0

# start the server (either approach — pick one)
brew services start mongodb-community@7.0
# — or, matching the root project's pattern —
mongod --dbpath=/Users/heinvv/data/db
```

Then create the `soccer_study` database:

```bash
mongosh
```

```js
use soccer_study
db.teams.insertOne({ name: "seed" })   // forces the DB to actually be created
show dbs                                // confirm soccer_study is listed
db.teams.deleteMany({})                 // clear the seed doc
exit
```

You can reuse the same `mongod` process/dbpath as the root project — the
database name in `DATABASE_URL` (`soccer_study` vs `fullstack`) is what keeps
the data separate.

---

## 5. Testing in Postman

Once you've built `POST /teams` and `POST /matches` routes:

1. Open Postman → **New Collection** → name it `soccer-study`.
2. **New Environment** → add variable `baseUrl` = `http://localhost:3000`.
   Select this environment (top-right dropdown).
3. Create requests inside the collection:

**Register a team**
- Method: `POST`
- URL: `{{baseUrl}}/teams`
- Headers: `Content-Type: application/json`
- Body → raw → JSON:
  ```json
  { "name": "FC Barcelona" }
  ```

**List teams**
- Method: `GET`
- URL: `{{baseUrl}}/teams`

**Register a match**
- Method: `POST`
- URL: `{{baseUrl}}/matches`
- Headers: `Content-Type: application/json`
- Body → raw → JSON:
  ```json
  {
    "teamA": "FC Barcelona",
    "goalsA": 3,
    "teamB": "Real Madrid",
    "goalsB": 1
  }
  ```

**List matches**
- Method: `GET`
- URL: `{{baseUrl}}/matches`

4. Send each request and check the response status (`201 Created` for the
   `POST`s, `200 OK` for the `GET`s) and body.
5. Optional: use Postman's **Tests** tab to assert
   `pm.response.to.have.status(201)` so you can re-run the collection as a
   quick regression check while you iterate on the routes.
