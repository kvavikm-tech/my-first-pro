# Raspberry Pi 5 Server Guide

This guide shows how to start the Raspberry Pi 5 API server, verify that it is healthy, and use it from another device.

## What Runs on the Pi

The Pi runs the Task API as a `systemd` service named `task-api.service`.

The service file is the unit definition at `setup/task-api.service` in this repo. It tells Linux how to start the API at boot, what user to run it as, and where the project files live.

The API listens on port `3000` by default and uses `API_KEY` for protected routes.

## Start the Server

1. Make sure the repo is on the Pi and dependencies are installed.
2. Set the service environment file:

```bash
sudo cp setup/task-api.env.example /etc/default/task-api
sudo nano /etc/default/task-api
```

Add a real API key in that file.

3. Install or refresh the service unit:

```bash
chmod +x setup/install-service.sh
./setup/install-service.sh "$PWD"
```

If you see `Service file not found`, it usually means one of these is true:

1. You are not in the repo root when you run the command.
2. The repo path passed to the script is wrong (for example `~/my-first-pro` vs `~/Documents/my-first-pro`).
3. The `setup/task-api.service` file is missing from the repo checkout.

If you are not sure whether you already have a service installed, that is okay. This command creates the `systemd` service for you.

If the service is already installed, you can restart it after config changes:

```bash
sudo systemctl restart task-api.service
```

4. Confirm the service is running:

```bash
systemctl is-active task-api.service
systemctl is-enabled task-api.service
```

## Check Health

Run this on the Pi first:

```bash
curl http://127.0.0.1:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "..."
}
```

## Use the API

Most routes require an `X-API-Key` header.

### List tasks

```bash
curl -H "X-API-Key: <your-api-key>" http://127.0.0.1:3000/tasks
```

### Create a task

```bash
curl -X POST http://127.0.0.1:3000/tasks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -d '{"text":"Buy milk"}'
```

### Mark a task done

```bash
curl -X PATCH http://127.0.0.1:3000/tasks/1/done \
  -H "X-API-Key: <your-api-key>"
```

### Delete a task

```bash
curl -X DELETE http://127.0.0.1:3000/tasks/1 \
  -H "X-API-Key: <your-api-key>"
```

## Use It From a Phone or PWA

If the phone is only running the UI, point it at the Pi API.

In `ui/mobile/.env`:

```dotenv
EXPO_PUBLIC_USE_API=true
EXPO_PUBLIC_API_URL=http://<pi-lan-ip>:3000
EXPO_PUBLIC_API_KEY=<your-api-key>
```

If you use Tailscale Funnel, set `EXPO_PUBLIC_API_URL` to the Funnel HTTPS address instead.

Important: do not use `localhost` on the phone. On a phone, `localhost` means the phone itself, not the Pi.

## Restart and Logs

```bash
sudo systemctl restart task-api.service
sudo journalctl -u task-api.service -f
```

If the service fails to start, check the most common causes first:

1. Missing or invalid `API_KEY` in `/etc/default/task-api`
2. Missing dependencies or a bad repo path in the service file
3. Port `3000` already in use

## Quick Troubleshooting

If `/health` works but protected routes return `401 Unauthorized`, the API key does not match.

If the service is enabled but not active, inspect the log output:

```bash
sudo systemctl status task-api.service
sudo journalctl -u task-api.service --no-pager -n 50
```
