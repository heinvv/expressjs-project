# Claude review — 2026-07-03

Review of `new2026/` as it stood after teams GET/POST were built and manually
tested in Postman. Covers `server.js`, `routes/teams.js`, `routes/matches.js`,
`models/team.js`, and the views.

## What to focus on, in order

### 1. Edit/delete on teams

Right now [routes/teams.js:26-28](../routes/teams.js#L26-L28) is just
comments, and the view at
[views/teams/index.ejs:6](../views/teams/index.ejs#L6) renders
`[Edit] [Delete]` as static text, not wired to anything. `method-override` is
already installed and mounted ([server.js:9](../server.js#L9), line 20) but
unused — that's the standard Express pattern for `PUT`/`DELETE` from HTML
forms, so use it:

```js
router.put('/:id', async (req, res) => { ... })
router.delete('/:id', async (req, res) => { ... })
```

and in the view, a form per team with
`method="POST" action="/teams/:id?_method=DELETE"`.

### 2. Matches

Bigger gap than teams. There's no `Match` model at all, and
[routes/matches.js](../routes/matches.js) only renders a static form; the
`<select>` options in
[views/matches/index.ejs](../views/matches/index.ejs) are still hardcoded
(`FC Barcelona`/`Real Madrid`) instead of populated from `Team.find()`. This
is the natural next build after teams CRUD is solid — same
GET/POST/PUT/DELETE pattern, plus a schema with refs to `Team`.

### 3. Automated tests

Worth adding, and good interview material. Given Express + Mongoose, the
standard combo is `jest` + `supertest`, with `mongodb-memory-server` so tests
don't hit the real dev DB. Start with the two routes already manually
verified (teams GET/POST) since the expected behavior is already known —
easiest place to write correct assertions.

## Best practices worth adding

- **Centralized error handling**: no 404 handler or Express error-handling
  middleware (`(err, req, res, next) => ...`) in
  [server.js](../server.js). An unhandled rejection (e.g. bad Mongo query)
  will currently crash or hang a request silently.
- **Input handling**: [routes/teams.js:11-13](../routes/teams.js#L11-L13)
  trusts `req.body.name` as-is — add `.trim()` and consider a uniqueness
  constraint on the schema (`unique: true`) since two teams with the same
  name is presumably invalid.
- **Env validation**: `PORT`/`DATABASE_URL` are read directly with no check
  beyond the `if (process.env.DATABASE_URL)` guard in server.js — fine for a
  study project, just know real apps usually fail fast on missing required
  env vars rather than warning and limping on.
