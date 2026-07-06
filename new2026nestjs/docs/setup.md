# new2026nestjs — Setup

A NestJS + Next.js rebuild of the [`new2026`](../../new2026) study project
(Express + EJS + Mongoose, soccer teams/matches app). Same MongoDB database
and feature set, different backend/frontend stack — good for comparing
Express's "wire it up yourself" style against Nest's decorators/DI/modules,
and EJS server-rendering against a separate Next.js frontend calling a JSON
API.

Two sibling apps live in this folder, each with its own `package.json`, run
independently:

```
new2026nestjs/
  backend/    # NestJS API (port 3001, same as new2026)
  frontend/   # Next.js UI (port 3000)
  docs/
    setup.md  # this file
```

## What's being converted

| new2026 (Express) | new2026nestjs equivalent |
|---|---|
| `server.js` | `backend/src/main.ts` + `backend/src/app.module.ts` |
| `routes/teams.js` | `backend/src/teams/teams.controller.ts` + `teams.service.ts` |
| `models/team.js` | `backend/src/teams/schemas/team.schema.ts` |
| `routes/matches.js` (stub) | `backend/src/matches/` (stub — same "yours to build" exercise) |
| `views/index.ejs`, `views/teams/index.ejs`, `views/matches/index.ejs` | `frontend/src/app/page.tsx`, `frontend/src/app/teams/page.tsx`, `frontend/src/app/matches/page.tsx` |
| `views/layouts/layout.ejs` + partials | `frontend/src/app/layout.tsx` |
| `public/assets/css/style.css` | `frontend/src/app/globals.css` |

Teams `GET`/`POST` are the only routes actually implemented in `new2026`, so
that's the parity bar here too. Matches CRUD, edit/delete on teams, and tests
are left as the next exercises, same as in the original project's
[claude-feedback-1.md](../../new2026/docs/claude-feedback-1.md).

---

## 1. Prerequisites

- Node.js >= 20 (`node -v`) — required by current Nest and Next major versions
- MongoDB running — reuse whatever `new2026` uses (`brew services start
  mongodb-community@7.0` or `mongod --dbpath=...`). You can point at the same
  `soccer_study` database or use a fresh one (e.g. `soccer_study_nest`) to
  keep the two study projects' data separate.

---

## 2. Scaffold the NestJS backend

From `new2026nestjs/`:

```bash
cd new2026nestjs
npx @nestjs/cli new backend
```

When prompted, pick `npm` as the package manager. This creates
`new2026nestjs/backend` with a default `AppModule`, `main.ts`, etc.

```bash
cd backend
```

## 3. Install backend dependencies

```bash
npm install @nestjs/mongoose mongoose
npm install @nestjs/config
npm install class-validator class-transformer
```

- `@nestjs/mongoose` + `mongoose` — same Mongoose you already know, wrapped
  in Nest's DI so schemas/models are injectable
- `@nestjs/config` — typed `.env` loading (Nest's equivalent of the
  `require('dotenv').config()` line in `server.js`)
- `class-validator` / `class-transformer` — request-body validation via DTOs
  and Nest's `ValidationPipe` (there's no equivalent in the current Express
  app — this closes the "input handling" gap called out in
  `claude-feedback-1.md`)

## 4. Environment variables

Create `backend/.env`:

```
DATABASE_URL=mongodb://localhost:27017/soccer_study
PORT=3001
```

Nest's default `.gitignore` doesn't exclude `.env` — add it:

```bash
echo ".env" >> .gitignore
```

## 5. Wire up ConfigModule + MongooseModule

Replace `backend/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamsModule } from './teams/teams.module';
import { MatchesModule } from './matches/matches.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('DATABASE_URL'),
      }),
    }),
    TeamsModule,
    MatchesModule,
  ],
})
export class AppModule {}
```

(`TeamsModule`/`MatchesModule` don't exist yet — created in the next steps.
Comment those two lines out until then if you want to run the app sooner.)

## 6. Enable CORS + global validation

Replace `backend/src/main.ts`:

```ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

`enableCors` is necessary here because, unlike `new2026` (Express serving the
EJS views itself), the frontend is now a separate origin (`localhost:3000`)
making `fetch` calls to the API.

## 7. Generate the Teams module

```bash
npx nest generate module teams
npx nest generate controller teams --no-spec
npx nest generate service teams --no-spec
```

This scaffolds `backend/src/teams/teams.module.ts`, `teams.controller.ts`,
`teams.service.ts` and wires the controller/service into the module
automatically.

## 8. Define the Team schema

Create `backend/src/teams/schemas/team.schema.ts`:

```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TeamDocument = HydratedDocument<Team>;

@Schema()
export class Team {
  @Prop({ required: true, trim: true })
  name: string;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
```

`trim: true` picks up the input-handling suggestion from
`claude-feedback-1.md` that `models/team.js` doesn't currently have.

## 9. Define the create-team DTO

Create `backend/src/teams/dto/create-team.dto.ts`:

```ts
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

## 10. Implement TeamsService

Replace `backend/src/teams/teams.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Team, TeamDocument } from './schemas/team.schema';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(@InjectModel(Team.name) private teamModel: Model<TeamDocument>) {}

  findAll() {
    return this.teamModel.find();
  }

  create(dto: CreateTeamDto) {
    return this.teamModel.create(dto);
  }
}
```

## 11. Implement TeamsController

Replace `backend/src/teams/teams.controller.ts`:

```ts
import { Body, Controller, Get, Post } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }
}
```

This is the JSON-API equivalent of `routes/teams.js` — no `res.render(...)`
because the views now live in the Next.js frontend, not the backend.

## 12. Register the schema in TeamsModule

Replace `backend/src/teams/teams.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { Team, TeamSchema } from './schemas/team.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Team.name, schema: TeamSchema }])],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
```

Now uncomment `TeamsModule` in `app.module.ts` if you commented it out
earlier.

## 13. Stub the Matches module

Matches isn't implemented in `new2026` either (just a static form) — keep
parity by scaffolding the module without building it out yet:

```bash
npx nest generate module matches
npx nest generate controller matches --no-spec
```

Building it out for real — a `Match` schema with `Team` references, plus
`GET`/`POST`/`PUT`/`DELETE` — is the same next-exercise called out in
[claude-feedback-1.md](../../new2026/docs/claude-feedback-1.md), just done
with Nest's DI/decorator style instead of raw Express routes.

## 14. Run the backend

```bash
npm run start:dev
```

Look for `Nest application successfully started` in the console. If Mongo
connection fails, check the same things as in `new2026`: is `mongod`
running, is `DATABASE_URL` correct.

## 15. Test the API

Same requests as the original project's Postman setup
([new2026/docs/setup.md](../../new2026/docs/setup.md#5-testing-in-postman)),
just against port 3001:

```bash
curl -X POST http://localhost:3001/teams \
  -H "Content-Type: application/json" \
  -d '{"name":"FC Barcelona"}'

curl http://localhost:3001/teams
```

---

## 16. Scaffold the Next.js frontend

From `new2026nestjs/`:

```bash
cd new2026nestjs
npx create-next-app@latest frontend --typescript --eslint --app --src-dir --import-alias "@/*"
```

(Answer the Tailwind/Turbopack prompts however you prefer — nothing below
depends on it. Skip `--tailwind` if you'd rather hand-port
`new2026`'s plain CSS as-is.)

```bash
cd frontend
```

## 17. Environment variables

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

`NEXT_PUBLIC_` is required for the variable to be readable from client
components (the team/match forms need it for `fetch` calls).

## 18. Port the layout

Replace `frontend/src/app/layout.tsx`:

```tsx
import './globals.css';
import type { ReactNode } from 'react';

export const metadata = { title: 'Soccer League' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>{/* port views/partials/header.ejs here */}</header>
        <main className="container">{children}</main>
        <footer>{/* port views/partials/footer.ejs here */}</footer>
      </body>
    </html>
  );
}
```

Copy `new2026/public/assets/css/style.css` into
`frontend/src/app/globals.css` (append to or replace what
`create-next-app` generated there) so the existing look carries over
unchanged.

## 19. Port the home page

Replace `frontend/src/app/page.tsx` with the two link-cards from
`views/index.ejs` (`Register a Team` → `/teams`, `Register a Match` →
`/matches`), using Next's `<Link>` instead of plain `<a>`.

## 20. Build the teams page

Create `frontend/src/app/teams/page.tsx` as a Server Component that fetches
the list server-side (no loading spinner needed, mirrors what
`res.render('teams/index', { teams })` did in Express):

```tsx
async function getTeams() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, { cache: 'no-store' });
  return res.json();
}

export default async function TeamsPage() {
  const teams = await getTeams();
  return (
    <section className="card">
      <h2>Current teams</h2>
      <ul>
        {teams.map((team: { _id: string; name: string }) => (
          <li key={team._id}>{team.name} [Edit] [Delete]</li>
        ))}
      </ul>
      <TeamForm />
    </section>
  );
}
```

Note `team._id`, not `team.id` — Mongoose keeps the same field name Nest
uses here, unlike the Postgres/Sequelize variant.

Create `frontend/src/app/teams/TeamForm.tsx` as a Client Component for the
`POST` (Server Components can't handle form `onSubmit`/client state):

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TeamForm() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      setError('Error creating team');
      return;
    }
    setName('');
    router.refresh();
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="team-name">Team Name</label>
        <input
          id="team-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. FC Barcelona"
          required
        />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit">Register Team</button>
    </form>
  );
}
```

`router.refresh()` re-runs the Server Component's `fetch` above, which is
the Next equivalent of Express's `res.redirect('/teams')` after a
successful `POST`.

## 21. Port the matches page

Create `frontend/src/app/matches/page.tsx` porting
`views/matches/index.ejs`, but — since the backend `matches` module is
still a stub — fetch teams from `GET /teams` to populate the two
`<select>` dropdowns instead of the hardcoded `FC Barcelona`/`Real Madrid`
options currently in the EJS view. Wiring the form's actual submit is
blocked on building out the backend Matches module first (step 13).

---

## 22. Run both apps

Two terminals:

```bash
# terminal 1
cd new2026nestjs/backend
npm run start:dev
```

```bash
# terminal 2
cd new2026nestjs/frontend
npm run dev
```

Visit `http://localhost:3000`.

---

## 23. Next exercises

Same list as `new2026`'s [claude-feedback-1.md](../../new2026/docs/claude-feedback-1.md),
adapted to the new stack:

- **Teams edit/delete** — add `@Put(':id')`/`@Delete(':id')` to
  `TeamsController`, call them from the frontend with `fetch` (no
  `method-override` needed — `fetch` sends real HTTP verbs).
- **Matches** — `Match` schema referencing `Team` via `mongoose.Schema.Types.ObjectId`,
  full CRUD, and the matches page's real form submission.
- **Automated tests** — Nest ships Jest + `@nestjs/testing` out of the box
  (`backend/test/`); add `mongodb-memory-server` for the same isolated-DB
  approach `claude-feedback-1.md` suggested for the Express version. On the
  frontend, React Testing Library is the equivalent for component tests.
- **Centralized error handling** — a Nest exception filter
  (`@Catch()`) is the equivalent of the Express error-handling middleware
  that's currently missing from `server.js`.
- **Uniqueness constraint** — add `unique: true` to the `name` prop in
  `team.schema.ts`, same suggestion as for the Mongoose version in
  `new2026`.
