# Sample Manager

A web app for organizing, browsing, and analyzing audio samples — upload samples, group them into collections/folders, stream playback, and get audio analysis (via a companion FastAPI + librosa service).

## Stack

- **App**: SvelteKit + TypeScript, TailwindCSS
- **Auth**: better-auth
- **Database**: PostgreSQL via Drizzle ORM
- **Audio analysis**: separate FastAPI (Python/librosa) service
- **Tooling**: pnpm, Prettier, ESLint, Vitest, Playwright, Docker Compose

## Prerequisites

- Node.js + [pnpm](https://pnpm.io)
- Docker (for Postgres and the FastAPI analysis service)

## Setup

1. Install dependencies:

   ```sh
   pnpm install
   ```

2. Copy the environment template and fill in values:

   ```sh
   cp .env.example .env
   ```

   Required variables:

   | Variable             | Purpose                                       |
   | -------------------- | ---------------------------------------------- |
   | `POSTGRES_URL`        | Postgres connection string (Drizzle)          |
   | `BETTER_AUTH_SECRET`  | Secret used by better-auth                    |
   | `BETTER_AUTH_URL`     | Base URL better-auth issues sessions against   |
   | `FASTAPI_URL`         | URL of the audio analysis service             |

3. Start Postgres and the FastAPI analysis service in Docker:

   ```sh
   pnpm dev:services
   ```

   This bind-mounts `./uploads` so both the native SvelteKit dev server and the FastAPI container see the same uploaded files. Use `pnpm dev:services:down` to stop them, or `pnpm dev:services:build` to force a rebuild.

4. Push the current schema to the database:

   ```sh
   pnpm db:push
   ```

   > This project uses `drizzle-kit push` as the standing dev workflow rather than tracked migrations — see `drizzle/` for the schema.

5. Start the SvelteKit dev server:

   ```sh
   pnpm dev

   # or start the server and open it in a new browser tab
   pnpm dev -- --open
   ```

## Project structure

```
src/routes/
  login/                  Sign in / sign up
  dashboard/
    samples/              Sample library
    collections/          Sample collections (folders)
    sample-types/         Sample type management
    profile/              User profile
  uploads/[userId]/       Uploaded sample files
  api/
    auth/                 better-auth handler
    samples/              Sample CRUD
    analysis/             Audio analysis endpoints
fast-api/                 Companion Python/librosa analysis service (own git repo)
drizzle/                  Drizzle schema & generated SQL
```

## Scripts

| Command                  | Description                                      |
| ------------------------- | ------------------------------------------------- |
| `pnpm dev`                 | Start the SvelteKit dev server                     |
| `pnpm dev:services`         | Start Postgres + FastAPI in Docker (detached)      |
| `pnpm dev:services:down`    | Stop the Docker services                           |
| `pnpm build` / `pnpm preview` | Build / preview a production build              |
| `pnpm check`                | Type-check with `svelte-check`                     |
| `pnpm lint` / `pnpm format`  | Lint / format with ESLint + Prettier              |
| `pnpm test:unit`            | Run Vitest unit/component tests                   |
| `pnpm test:e2e`             | Run Playwright end-to-end tests                    |
| `pnpm test`                 | Run the full test suite (unit then e2e)            |
| `pnpm db:push`              | Push the Drizzle schema to the database            |
| `pnpm db:generate`          | Generate a Drizzle migration                       |
| `pnpm db:migrate`           | Run Drizzle migrations                             |
| `pnpm db:studio`            | Open Drizzle Studio                                |

## Testing

```sh
pnpm test:unit   # Vitest
pnpm test:e2e    # Playwright
pnpm test        # both
```

## Building for production

```sh
pnpm build
pnpm preview
```

A `Dockerfile` and `docker-compose.yml` are included for building/running the SvelteKit app, Postgres, and the FastAPI service together in containers.
