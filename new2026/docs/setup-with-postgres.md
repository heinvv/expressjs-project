# new2026 — Setup with PostgreSQL

Yes, this is possible — but it's not a drop-in swap. Mongoose talks to
MongoDB (document store); Postgres is relational, so the model layer needs
to be rewritten with an ORM that speaks SQL. This doc uses **Sequelize**,
since its `Model.find()` / `Model.create()` style is the closest match to
the Mongoose code already in [`models/team.js`](../models/team.js) and
[`routes/teams.js`](../routes/teams.js).

Treat this as a separate branch of the exercise from [setup.md](setup.md)
(MongoDB) — pick one DB per run, don't try to wire both up at once.

## 1. Prerequisites

- Node.js >= 18 (`node -v`)
- Docker Desktop (or another Docker engine) running

## 2. Start PostgreSQL in Docker

From `new2026/`, [`docker-compose.yml`](../docker-compose.yml) defines a single
`postgres:16` service with the database, user, and password pre-created via
env vars — no manual `createdb`/`psql` step needed:

```yaml
services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: soccer_study
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Start it:

```bash
cd new2026
docker compose up -d
```

Confirm it's healthy:

```bash
docker compose ps
docker compose logs postgres   # look for "database system is ready to accept connections"
```

The named volume (`postgres_data`) persists data across `docker compose down`
/ `up` cycles. To wipe it and start fresh: `docker compose down -v`.

## 3. Create the database

Already done — `POSTGRES_DB: soccer_study` in the compose file creates it on
first container start. Skip ahead to installing dependencies.

## 4. Install dependencies

From `new2026/`:

```bash
cd new2026
npm install sequelize pg pg-hstore
```

- `sequelize` — the ORM
- `pg` — the Postgres driver Sequelize uses under the hood
- `pg-hstore` — serializes JS objects for Postgres's `hstore` type (a
  Sequelize peer dependency)

## 5. Environment variables

Add a Postgres connection string alongside (or instead of) the Mongo one in
`new2026/.env`:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/soccer_study
PORT=3001
```

`postgres:postgres` matches the `POSTGRES_USER`/`POSTGRES_PASSWORD` in
`docker-compose.yml`. If you change those, URL-encode any special characters
in the password, same caveat as the Mongo setup.

## 6. Connect with Sequelize

This replaces the `mongoose.connect(...)` block in `server.js`. Create
`new2026/db.js`:

```js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
});

module.exports = sequelize;
```

In `server.js`, swap the Mongoose connection block for:

```js
const sequelize = require('./db');

sequelize.authenticate()
    .then(() => console.log('Connected to Database'))
    .catch((error) => console.error('Database connection error:', error.message));
```

## 7. Rewrite the Team model

Sequelize models are defined against the shared `sequelize` instance instead
of `mongoose.Schema`. Replace `models/team.js`:

```js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Team = sequelize.define('Team', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

module.exports = Team;
```

Sync the model to create the `Teams` table (add this once, e.g. near the
`sequelize.authenticate()` call in `server.js`, or run it as a one-off
script):

```js
sequelize.sync();
```

## 8. Update the routes

Sequelize's query API differs from Mongoose's. In `routes/teams.js`:

```js
router.get('/', async (req, res) => {
    const teams = await Team.findAll();
    res.render('teams/index', { teams });
});

router.post('/', async (req, res) => {
    try {
        const newTeam = await Team.create({ name: req.body.name });
        res.redirect('/teams');
    } catch (err) {
        res.render('teams/index', {
            errorMessage: 'Error creating team',
        });
    }
});
```

Key differences from the Mongoose version:

| Mongoose | Sequelize |
|---|---|
| `Team.find()` | `Team.findAll()` |
| `new Team({...}); team.save()` | `Team.create({...})` |
| `_id` | `id` (auto-increment integer by default) |

`views/teams/index.ejs` references `team._id` if you built it against the
Mongo version — update those references to `team.id`.

## 9. Run it

```bash
npm run devStart
```

Watch the console for `Connected to Database`. If it fails, double check the
container is running (`docker compose ps`) and check its logs
(`docker compose logs postgres`).

## 10. Inspect data directly (optional)

```bash
docker compose exec postgres psql -U postgres -d soccer_study
```

```sql
SELECT * FROM "Teams";
```

## 11. Testing in Postman

Same requests as the MongoDB setup — the API surface doesn't change, only
what's behind it:

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

Response bodies will have an `id` field instead of `_id` — update any
Postman tests that assert on `_id` accordingly.
