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

### Client/Server Responsibility (Phone vs Pi)

- Phone runs only the PWA client UI in a browser.
- Raspberry Pi runs the API server process and data storage.
- The phone must call the Pi API URL; the phone should never run the server.
- Never use `localhost` in the phone/PWA API URL.
  - On phone, `localhost` means the phone itself, not the Pi.

### PWA Connection Setup Checklist (Phone Uses Pi Server)

1. Start API on Pi and verify from Pi itself:
   - `curl http://127.0.0.1:3000/health`
2. Confirm the Pi reachable URL from your phone context:
   - Home Wi-Fi: `http://<pi-lan-ip>:3000`
   - Global (Funnel): `https://<device>.ts.net`
3. In `ui/mobile/.env`, set:
   - `EXPO_PUBLIC_USE_API=true`
   - `EXPO_PUBLIC_API_URL=<pi-url-from-step-2>`
   - `EXPO_PUBLIC_API_KEY=<same-key-as-server-API_KEY>`
4. Build/run web and open from phone browser.
5. Validate behavior:
   - Tasks load from server data.
   - Creating/editing tasks changes server state.
   - If Pi is offline, app shows offline read-cache banner (Phase 3f).

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

## Progress Status

| Phase | Status |
|---|---|
| Phase 1: API server | ✅ Done |
| Phase 2: CLI stable + tests | ✅ Done (32/32 passing) |
| Phase 3: Mobile migration to API | ✅ Done |
| Phase 3b: Full metadata (tags/notes/dueDate) | ✅ Done |
| Phase 3c: TaskContext alignment | ✅ Done |
| Phase 3d: Mobile env config (.env / .env.example) | ✅ Done |
| Phase 3e: PWA — export web fallback | ✅ Done |
| Phase 3f: PWA — offline read cache | ✅ Done |
| Phase 3g: PWA — webpack build + serve from Pi | ✅ Done |
| Phase 4: Raspberry Pi deployment | ✅ Done |
| Phase 4a: Manual LAN API validation | ✅ Done |
| Phase 4b: Direct-on-Pi API validation | ✅ Done |
| Phase 5: Tailscale Funnel global access | 🔄 In Progress |
| Phase 6: Security and operations | ⏳ Pending |
| Phase 7: Auth upgrade (later) | ⏳ Future |

---

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

### Phase 4 Completed So Far

1. Manual LAN connectivity test from laptop to Pi API completed.
2. `GET /health` reachable over `http://<pi-lan-ip>:3000`.
3. Auth route test performed and validated (`Unauthorized` on key mismatch confirms middleware enforcement).
4. Direct-on-Pi validation completed successfully.
5. Service checks passed (`active` + `enabled`).
6. API endpoint checks passed from Pi shell:
   - `GET /health`
   - `GET /tasks` with valid `X-API-Key`
   - `GET /tasks` with invalid key returns `Unauthorized`

### Phase 4 Execution Commands

1. Clone and install on Pi:
   - `git clone <your-repo-url> ~/my-first-pro`
   - `cd ~/my-first-pro`
   - `npm install`
2. Create service env file:
   - `sudo cp setup/task-api.env.example /etc/default/task-api`
   - `sudo nano /etc/default/task-api` (set a real `API_KEY`)
3. Install service unit:
   - `chmod +x setup/install-service.sh`
   - `./setup/install-service.sh ~/my-first-pro`
   - optional manual path:
     - `sudo cp setup/task-api.service /etc/systemd/system/task-api.service`
     - `sudo systemctl daemon-reload`
     - `sudo systemctl enable task-api.service`
     - `sudo systemctl start task-api.service`
4. Validate locally on Pi:
   - `curl http://127.0.0.1:3000/health`
   - `curl -H "X-API-Key: <your-key>" http://127.0.0.1:3000/tasks`

## Phase 5: Global Public Access (Free)

1. Install and authenticate Tailscale on Pi.
2. Enable Funnel for API port.
3. Verify external HTTPS access from mobile data (outside home Wi-Fi).

### Phase 5 Execution Commands (On Pi)

1. Install Tailscale:
   - `curl -fsSL https://tailscale.com/install.sh | sh`
2. Authenticate Pi into your tailnet:
   - `sudo tailscale up`
   - complete browser auth when prompted
3. Confirm node is connected:
   - `tailscale status`
   - `tailscale ip -4`
4. Verify API is healthy locally before exposing publicly:
   - `curl http://127.0.0.1:3000/health`
5. Enable Funnel on the API port:
   - `sudo tailscale funnel --bg --https=443 http://127.0.0.1:3000`
6. Retrieve the public Funnel URL:
   - `tailscale funnel status`
   - copy `https://<PI_FUNNEL_URL>`

### Phase 5 Validation Checklist

1. Check public health endpoint from an external network:
   - `curl https://<PI_FUNNEL_URL>/health`
2. Check authenticated API route with key:
   - `curl -H "X-API-Key: <API_KEY_SAMPLE>" https://<PI_FUNNEL_URL>/tasks`
3. Confirm unauthorized response on wrong key:
   - `curl -H "X-API-Key: WRONG" https://<PI_FUNNEL_URL>/tasks`
   - expected: `Unauthorized`
4. Verify from phone on mobile data (Wi-Fi OFF):
   - open `https://<PI_FUNNEL_URL>/health`
   - use same URL in `EXPO_PUBLIC_API_URL`

### Phase 5 Rollback / Stop

1. Disable Funnel if needed:
   - `sudo tailscale funnel --https=443 off`
2. Keep private tailnet access only:
   - `tailscale status`

### Phase 5 Notes

- Keep all examples sanitized with placeholders, never real secrets.
- Funnel exposes your Pi endpoint publicly; API key protection remains mandatory.
- If your ISP/router changes and external checks fail, first re-run `tailscale funnel status` and service health checks.

## Phase 6: Security and Operations

1. Enforce API key on non-health routes.
2. Harden Pi SSH and firewall baseline.
3. Add scheduled backup pruning (avoid unlimited backup file growth).
4. Run restore drill monthly.

### Phase 6 Execution Commands

1. Install prune script and make executable:
   - `sudo cp setup/backup-prune.sh /usr/local/bin/task-backup-prune.sh`
   - `sudo chmod +x /usr/local/bin/task-backup-prune.sh`
2. Add cron job (daily at 03:15, keep newest 200 backups):
   - `sudo crontab -e`
   - `15 3 * * * /usr/local/bin/task-backup-prune.sh /home/pi/my-first-pro 200 >> /var/log/task-backup-prune.log 2>&1`

## Phase 3e: PWA — Export Web Fallback

The app has an export/share button that uses `expo-sharing` (native only — does not work in a browser).

In API mode on the web, replace the native share sheet with a browser file download:
1. Fetch tasks from API.
2. Create a Blob with JSON content.
3. Trigger `<a download>` in the browser — standard browser download dialog.
4. Keep native share behavior on iOS/Android builds.

## Phase 3f: PWA — Offline Read Cache

When the phone cannot reach the Pi, the app currently shows an error and breaks.

Fix: cache the last successful task list in `localStorage` so the app shows your tasks even offline.
1. On successful `getTasks()` API response, write result to `localStorage` as `task_cache`.
2. On API failure, read `task_cache` from `localStorage` and return it with an `offline: true` flag.
3. Show a "You are offline — showing last saved data" banner in the UI when offline.
4. Writes (add/edit/delete) show a clear error when offline rather than silently failing.

## Phase 3g: PWA — Webpack Build + Serve from Pi

1. Add `@expo/webpack-config` to mobile devDependencies (enables PWA manifest + service worker).
2. Update `app.json` with PWA metadata: `bundler: webpack`, theme color, short name, description.
3. Add `npm run web:build` script → `expo export --platform web` → outputs to `ui/mobile/web-build/`.
4. Serve `web-build/` as static files from the Express API server (or separate nginx).
5. App becomes installable from the browser via "Add to Home Screen" on both Android and iPhone.

## Phase 7: Auth Upgrade After MVP (Planned)

1. Keep API key auth for MVP while validating full app flow.
2. Add user auth endpoints later (`register`, `login`, `refresh`, `logout`).
3. Hash passwords on backend and issue short-lived access tokens.
4. Store session token securely on mobile for auto-login experience.
5. Move API key usage to admin/maintenance operations only.
6. Remove API key requirement from normal user task routes after migration.

## File-Level Work Plan

### Create
- `api/server.js` ✅
- `api/app.js` ✅
- `api/auth.js` ✅
- `__tests__/api.test.js` ✅
- `ui/mobile/.env` ✅
- `ui/mobile/.env.example` ✅
- `setup/task-api.service` ✅
- `setup/backup-prune.sh` ✅
- `setup/task-api.env.example` ✅
- `setup/install-service.sh` ✅

### Update
- `package.json` ✅
- `lib/database.js` ✅ (metadata columns + migration)
- `lib/taskManager.js` ✅ (metadata passthrough)
- `ui/mobile/src/utils/taskAdapter.js` ✅ (API mode + metadata)
- `ui/mobile/src/context/TaskContext.js` ✅ (merge fix + completeTask fix)
- `README.md` ⏳
- `guides/Testing app with Expo Go.md` ⏳

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

## Testing Hygiene (Secrets and IPs)

1. Never paste or commit real API keys in docs, chat examples, screenshots, or commands.
2. Use placeholders in all examples:
   - API key: `<API_KEY_SAMPLE>`
   - LAN IP: `<PI_LAN_IP>`
   - Funnel URL: `<PI_FUNNEL_URL>`
3. If a real key was shared during troubleshooting, rotate it immediately in `/etc/default/task-api` and restart service.
4. Keep all public-facing instructions sanitized, even for local/LAN-only tests.
5. Prefer command templates like:
   - `curl -H "X-API-Key: <API_KEY_SAMPLE>" http://<PI_LAN_IP>:3000/tasks`

## Decision Log

- Hosting path: free + public via Tailscale Funnel.
- Security baseline: API key first for MVP.
- Auth roadmap: migrate to email/password after core flow is stable.
- Mobile direction: migrate to API now (selected).
- Stability policy: preserve existing CLI behavior while adding API mode.
