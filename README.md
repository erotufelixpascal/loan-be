# Loan Management System — Backend

A Node.js / Express REST API backed by PostgreSQL via TypeORM. See [`docs/SRS.md`](../docs/SRS.md) in the parent repo for the full requirements and target architecture.

## Project setup

```bash
npm install
```

Create a `.env` file (see `.env` for the expected keys): `PORT`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`.

## Run the project

```bash
# watch mode (development)
npm run start:dev

# build + run compiled output
npm run build
npm run start
```

The API listens on `PORT` (default `3000`). Swagger docs are served at `/api/docs`.

## Run tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# coverage
npm run test:cov
```

## Project structure

```
src/
  config/        env loading, TypeORM data source, Swagger setup
  middleware/    error handling, 404 handling, async route wrapper
  entities/      TypeORM entities
  modules/       one folder per resource: routes + service (+ schema)
  app.ts         Express app assembly
  server.ts      entrypoint — connects to the database, then listens
```
