#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-$HOME/my-first-pro}"
SERVICE_NAME="task-api.service"
SERVICE_SRC="$PROJECT_DIR/setup/$SERVICE_NAME"
SERVICE_DEST="/etc/systemd/system/$SERVICE_NAME"
ENV_SRC="$PROJECT_DIR/setup/task-api.env.example"
ENV_DEST="/etc/default/task-api"

if [[ ! -f "$SERVICE_SRC" ]]; then
  echo "Service file not found: $SERVICE_SRC"
  exit 1
fi

if [[ ! -f "$ENV_SRC" ]]; then
  echo "Env template not found: $ENV_SRC"
  exit 1
fi

echo "Installing service unit..."
sudo cp "$SERVICE_SRC" "$SERVICE_DEST"

if [[ ! -f "$ENV_DEST" ]]; then
  echo "Creating $ENV_DEST from template..."
  sudo cp "$ENV_SRC" "$ENV_DEST"
  echo "Edit $ENV_DEST and set API_KEY before exposing the service publicly."
else
  echo "$ENV_DEST already exists, leaving as-is."
fi

echo "Reloading systemd and enabling service..."
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

echo "Done. Current service status:"
sudo systemctl --no-pager --full status "$SERVICE_NAME" | sed -n '1,15p'
