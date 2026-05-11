#!/usr/bin/env bash
set -euo pipefail

# Keep the newest N backup files and delete the rest.
# Usage: backup-prune.sh [project_dir] [keep_count]
PROJECT_DIR="${1:-/home/pi/my-first-pro}"
KEEP_COUNT="${2:-200}"
BACKUPS_DIR="$PROJECT_DIR/backups"

if [[ ! -d "$BACKUPS_DIR" ]]; then
  echo "Backups directory does not exist: $BACKUPS_DIR"
  exit 0
fi

if ! [[ "$KEEP_COUNT" =~ ^[0-9]+$ ]]; then
  echo "keep_count must be an integer"
  exit 1
fi

mapfile -t backup_files < <(find "$BACKUPS_DIR" -maxdepth 1 -type f -name 'backup-*.json' -printf '%f\n' | sort -r)

file_count="${#backup_files[@]}"
if (( file_count <= KEEP_COUNT )); then
  echo "No pruning needed. Found $file_count files, keep_count=$KEEP_COUNT"
  exit 0
fi

for (( i=KEEP_COUNT; i<file_count; i++ )); do
  rm -f "$BACKUPS_DIR/${backup_files[$i]}"
  echo "Deleted: ${backup_files[$i]}"
done

echo "Prune complete. Kept newest $KEEP_COUNT of $file_count backups."
