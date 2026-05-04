# Raspberry Pi Global Deployment Plan (Project-Fit)

## Goal

Deploy this project on a Raspberry Pi with:
- Free hosting
- Public global access
- 24/7 operation
- API key protection
- Mobile app using server data (not local-only)

## Current Project Reality (Important)

### Backend today
- `app.js` is a CLI entrypoint, not an HTTP server.
- Core task logic is in `lib/taskManager.js`.
- Database and persistence are in `lib/database.js` using `sql.js` and `db/tasks.db`.
- Backups are written to `backups/` on write operations.

### Mobile today
- Mobile app uses local storage through `ui/mobile/src/utils/taskAdapter.js`.
- App state is managed in `ui/mobile/src/context/TaskContext.js`.
- Mobile data model includes fields like `title`, `notes`, `dueDate`, `tags`.
- Backend task model currently stores basic fields (`text`, `done`, timestamps).

This means we must add an API layer and a compatibility mapping between mobile model and backend model.

## Final Architecture

- Keep CLI mode unchanged for local command usage.
- Add API mode for Raspberry Pi server usage.
- Deploy API as a systemd service on Pi.
- Expose API globally using Tailscale Funnel (free HTTPS).
- Require `X-API-Key` on all non-health routes.
- Migrate mobile app adapter from local file storage to API calls.

## Scope

### In scope (MVP)
- API server and task routes
- API key auth
- Pi deployment with systemd
- Tailscale Funnel public endpoint
- Mobile migration to API mode
- Backup/restore verification

### Out of scope (later)
- User accounts/OAuth/JWT
- Rate limiting and advanced abuse controls
- Multi-node/high-availability
- Paid cloud failover

## Implementation Plan

## Phase 1: API Server on Existing Logic

1. Create `api/server.js` and initialize DB once on startup (`initDatabase`).
2. Reuse `lib/taskManager.js` functions in HTTP handlers.
3. Add routes:
   - `GET /health`
   - `GET /tasks`
   - `POST /tasks`
   - `PATCH /tasks/:id`
   - `PATCH /tasks/:id/done`
   - `DELETE /tasks/:id`
   - `GET /backups`
   - `POST /backups/:filename/restore`
4. Add API key middleware (`X-API-Key`) for all routes except `/health`.
5. Add error mapping:
   - validation/required input -> 400
   - missing task/backup/file -> 404
   - unexpected -> 500

## Phase 2: Keep CLI Stable + Add Tests

1. Keep `npm start` behavior for CLI untouched.
2. Add new script for API mode in `package.json` (for example `npm run api`).
3. Add API test suite (`__tests__/api.test.js`) with auth and route checks.
4. Keep existing tests in `__tests__/taskManager.test.js` green.

## Phase 3: Mobile Migration to API (Chosen Path)

1. Refactor `ui/mobile/src/utils/taskAdapter.js` to support API mode.
2. Keep local mode as fallback for development if needed.
3. Add model mapping in adapter:
   - mobile `title` <-> backend `text`
   - mobile `completed` <-> backend `done`
   - keep mobile-only fields (`notes`, `dueDate`, `tags`) in local metadata until backend is extended.
4. Update `ui/mobile/src/context/TaskContext.js` flows to call API-backed adapter.
5. Add config for API URL and API key in Expo environment variables.

## Phase 4: Raspberry Pi Deployment

1. Install Raspberry Pi OS + Node LTS + git.
2. Clone repo and install dependencies.
3. Run API locally on Pi and validate with curl.
4. Add systemd service for boot/start/restart.
5. Verify data persistence in `db/tasks.db` and backups in `backups/`.

## Phase 5: Global Public Access (Free)

1. Install and authenticate Tailscale on Pi.
2. Enable Funnel for API port.
3. Verify external HTTPS access from mobile data (outside home Wi-Fi).

## Phase 6: Security and Operations

1. Enforce API key on non-health routes.
2. Harden Pi SSH and firewall baseline.
3. Add scheduled backup pruning (avoid unlimited backup file growth).
4. Run restore drill monthly.

## Phase 7: Auth Upgrade After MVP (Planned)

1. Keep API key auth for MVP while validating full app flow.
2. Add user auth endpoints later (`register`, `login`, `refresh`, `logout`).
3. Hash passwords on backend and issue short-lived access tokens.
4. Store session token securely on mobile for auto-login experience.
5. Move API key usage to admin/maintenance operations only.
6. Remove API key requirement from normal user task routes after migration.

## File-Level Work Plan

### Create
- `api/server.js`
- `api/auth.js`
- `__tests__/api.test.js`
- `setup/task-api.service`
- `setup/backup-prune.sh`

### Update
- `package.json`
- `README.md`
- `guides/Testing app with Expo Go.md`
- `ui/mobile/src/utils/taskAdapter.js`
- `ui/mobile/src/context/TaskContext.js`

## Risks Specific to This Repo

1. `sql.js` + sync filesystem writes can become slow under higher concurrency.
2. Automatic backup on each write can grow `backups/` quickly.
3. Mobile model is richer than current backend model; mapping is required to avoid data loss.
4. 100% uptime is not guaranteed on home power/internet, even with 24/7 intent.

## Acceptance Criteria

1. CLI commands still work exactly as before.
2. API passes automated tests and manual checks.
3. Mobile app reads/writes tasks through API in production mode.
4. Pi service auto-starts after reboot.
5. Public HTTPS endpoint works globally through Funnel.
6. Backup restore successfully recovers known dataset.

## Runbook Checklist (Operational)

1. Start service
   - `sudo systemctl start task-api.service`
2. Check status
   - `sudo systemctl status task-api.service`
3. Read logs
   - `sudo journalctl -u task-api.service -f`
4. Validate health
   - `curl https://<funnel-url>/health`
5. Validate authenticated route
   - `curl -H "X-API-Key: <key>" https://<funnel-url>/tasks`

## Decision Log

- Hosting path: free + public via Tailscale Funnel.
- Security baseline: API key first for MVP.
- Auth roadmap: migrate to email/password after core flow is stable.
- Mobile direction: migrate to API now (selected).
- Stability policy: preserve existing CLI behavior while adding API mode.
