# User Management API

[![CI](https://github.com/Bakhromov-02/basic-api-task/actions/workflows/ci.yml/badge.svg)](https://github.com/Bakhromov-02/basic-api-task/actions/workflows/ci.yml)

A REST API for user accounts: signup, login, JWT authentication with **refresh token rotation**, and self-service profile management.
Built with **NestJS 11, TypeORM and PostgreSQL**, and tested end-to-end against a real PostgreSQL container.

## Features

- **Auth:** signup and login (argon2 password hashing), short-lived access tokens and long-lived refresh tokens
- **Refresh token rotation with reuse detection:** every refresh returns a new pair; replaying an old refresh token revokes the session
- **Logout** revokes the refresh token; **changing the password** signs out all other sessions
- **Users:** list with search and pagination, get by id, `GET /users/me`, update your own profile, delete your own account
- **Soft delete:** deleted accounts disappear from the API, their tokens stop working immediately, and the email can be reused
- **Swagger** docs at `/docs`, **Docker Compose** setup, and **migrations** instead of schema sync

## Tech stack

| Area | Choice |
|---|---|
| Framework | NestJS 11 (TypeScript) |
| Database | PostgreSQL 17, TypeORM 0.3 with migrations |
| Auth | Passport JWT (access + refresh strategies), argon2 |
| Validation | class-validator / class-transformer (whitelist + forbid unknown fields) |
| Testing | Jest, Supertest, Testcontainers (real PostgreSQL in Docker) |
| Tooling | ESLint, Prettier, GitHub Actions |

## Getting started

### With Docker (recommended)

```bash
git clone https://github.com/Bakhromov-02/basic-api-task.git
cd basic-api-task
cp example.env .env          # adjust secrets if you like
docker compose up --build
```

The API is available at http://localhost:7001/api, and Swagger at http://localhost:7001/docs.
Migrations run automatically on startup.

### Locally

```bash
npm install
cp example.env .env
docker compose up -d db      # or point TYPEORM_* at your own PostgreSQL
npm run start:dev            # http://localhost:7000
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `API_PORT` | `3000` | HTTP port inside the container / process |
| `TYPEORM_HOST` | `localhost` | PostgreSQL host (`db` inside Docker Compose) |
| `TYPEORM_PORT` | `5432` | PostgreSQL port |
| `TYPEORM_USERNAME` / `TYPEORM_PASSWORD` / `TYPEORM_DATABASE` | – | Database credentials (required) |
| `TYPEORM_LOGGING` | `false` | Log SQL queries |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | – | Signing secrets, use different long random values (required) |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |

## API

All endpoints are prefixed with `/api`. Everything except signup, login and refresh requires `Authorization: Bearer <accessToken>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Create an account → `201` with `{ id, email, accessToken, refreshToken }` |
| POST | `/auth/login` | Log in → `200` with the same shape, `401` for invalid credentials |
| POST | `/auth/refresh` | Body `{ refreshToken }` → new token pair |
| POST | `/auth/logout` | Revoke the current refresh token |
| GET | `/users` | List users (`page`, `limit` ≤ 100, `email`, `name` partial search) |
| GET | `/users/me` | Current user |
| GET | `/users/:id` | User by id |
| PATCH | `/users/:id` | Update your own `name` and/or `password` (`403` for others) |
| DELETE | `/users/:id` | Soft-delete your own account (`403` for others) |

Successful responses use one envelope: `{ "statusCode": 200, "message": "Success", "data": { ... } }`.
Lists return `{ data, currentPage, limit, total, totalPages }`.

## Design decisions

- **Refresh tokens are stored only as a SHA-256 hash** (one active session per user). Refreshing compares the hash in constant time, rotates the token, and treats reuse of an old token as theft by revoking the session.
- **Access tokens are re-checked against the database** on each request, so deleted accounts are locked out immediately rather than when their token expires.
- **No account enumeration:** login returns the same `401` for an unknown email and for a wrong password, and runs a password-hash check in both cases so response times don't reveal which one it was.
- **Strict input handling:** unknown body fields are rejected (`forbidNonWhitelisted`), emails are normalized to lowercase, and `:id` params are parsed with `ParseIntPipe`. Search input is escaped before it's used in `ILIKE`.
- **Errors don't leak internals:** a global filter maps HTTP errors and unique-constraint violations (`409`). Anything unexpected is logged and returned as a generic `500`.
- **Schema changes go through migrations.** A test fails if the entities and migrations ever drift apart.

## Development

| Command | Description |
|---|---|
| `npm run start:dev` | Start in watch mode |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript checks (source and tests) |
| `npm test` | End-to-end tests (requires Docker) |
| `npm run test:cov` | Tests with coverage |
| `npm run migration:generate -- src/migrations/<Name>` | Generate a migration from entity changes, then register it in `src/migrations/index.ts` |
| `npm run migration:run` / `migration:revert` | Apply / roll back migrations |

### Tests

`npm test` starts a disposable PostgreSQL 17 container with Testcontainers and boots the real application with the same global pipes, guards and filters as production.
The suite covers signup and login, token rotation and reuse detection, logout, ownership rules (`403`), password changes, soft deletion, pagination and search, and migration consistency.

## Project structure

```
src/
├── main.ts / app.setup.ts     # bootstrap and global configuration shared with tests
├── app.module.ts
├── auth/                      # controller, service, DTOs, JWT strategies
├── users/                     # controller, service, DTOs, entity
├── database/                  # connection options shared by app and TypeORM CLI
├── migrations/
├── data-source.ts             # TypeORM CLI entry point
└── common/                    # guards, filters, decorators, helpers, pagination
test/                          # e2e tests + Testcontainers setup
```
