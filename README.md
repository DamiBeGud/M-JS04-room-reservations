# room-reservations

TypeScript-compiled Express with ordinary JavaScript domain modules application. Native setup `npm ci`; tests `npm test`.
Build `npm run build`; Start `npm start`; PORT defaults to3204, all-interface listener.
Liveness `/health/live`; declared health/readiness `/health/ready`.
Authenticated POST /rooms {id,capacity}; POST /rooms/:id/reservations {id,seats}; POST /reservations/:id/cancel; GET /rooms/:id. Room row locks serialize capacity changes. Duplicate/overflow/repeated cancellation409.

Requires DATABASE_URL pointing to an assigned empty logical PostgreSQL database on the shared study server. Run `npm run migrate` to apply source versioned migrations. No CREATE DATABASE, drop/reset or startup auto-migration.
Requires API_TOKEN from an approved private reference. Send Authorization: Bearer … for protected business routes.
Tests use in-process domain fixtures and ephemeral loopback HTTP. DB repositories are replaced by test doubles; this is not PostgreSQL integration evidence.
AI-assisted researcher-authored application; shared scaffolding is disclosed outside this app. No deployment configuration is supplied.
