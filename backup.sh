#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# backup.sh — Daily PostgreSQL backup for savean_db
#
# Usage:
#   ./backup.sh            run a backup now
#   ./backup.sh --restore  list available backups and prompt to restore one
#
# Backups are stored in  ./dbbackup/savean_db_YYYYMMDD_HHMMSS.dump
# Backups older than KEEP_DAYS days are pruned automatically.
# All output is also appended to ./dbbackup/backup.log
# ---------------------------------------------------------------------------

set -euo pipefail

# ── Config ──────────────────────────────────────────────────────────────────
CONTAINER="savean_db"
DB_USER="postgres"
DB_NAME="savean_db"
KEEP_DAYS=7

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/dbbackup"
LOG_FILE="$BACKUP_DIR/backup.log"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"

# ── Helpers ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; RESET='\033[0m'

log()  { local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"; echo -e "$msg"; echo "$msg" >> "$LOG_FILE"; }
ok()   { log "${GREEN}✔ $*${RESET}"; }
err()  { log "${RED}✘ $*${RESET}"; exit 1; }
warn() { log "${YELLOW}⚠ $*${RESET}"; }

mkdir -p "$BACKUP_DIR"

# ── Restore mode ─────────────────────────────────────────────────────────────
if [[ "${1:-}" == "--restore" ]]; then
  echo ""
  echo "Available backups:"
  echo "------------------"
  mapfile -t files < <(ls -1t "$BACKUP_DIR"/*.dump 2>/dev/null || true)
  if [[ ${#files[@]} -eq 0 ]]; then
    echo "No backups found in $BACKUP_DIR"; exit 1
  fi
  for i in "${!files[@]}"; do
    size=$(du -sh "${files[$i]}" | cut -f1)
    printf "  [%d] %s  (%s)\n" "$((i+1))" "$(basename "${files[$i]}")" "$size"
  done
  echo ""
  read -rp "Enter number to restore (or q to quit): " choice
  [[ "$choice" == "q" ]] && exit 0
  idx=$((choice - 1))
  selected="${files[$idx]}"
  echo ""
  warn "This will OVERWRITE the current database '$DB_NAME'. Press Ctrl+C to cancel."
  sleep 3
  log "Restoring from $(basename "$selected") ..."
  docker exec -i "$CONTAINER" pg_restore \
    -U "$DB_USER" -d "$DB_NAME" --clean --if-exists \
    < "$selected"
  ok "Restore complete."
  exit 0
fi

# ── Backup ───────────────────────────────────────────────────────────────────
log "Starting backup of '$DB_NAME' ..."

# Check container is running
if ! docker inspect "$CONTAINER" --format '{{.State.Running}}' 2>/dev/null | grep -q "true"; then
  err "Container '$CONTAINER' is not running. Start the app first (docker compose up -d)."
fi

# Run pg_dump (custom compressed format)
if docker exec "$CONTAINER" pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$BACKUP_FILE"; then
  SIZE="$(du -sh "$BACKUP_FILE" | cut -f1)"
  ok "Backup saved: $(basename "$BACKUP_FILE")  ($SIZE)"
else
  rm -f "$BACKUP_FILE"
  err "pg_dump failed — backup aborted."
fi

# Prune backups older than KEEP_DAYS
PRUNED=0
while IFS= read -r old_file; do
  rm -f "$old_file"
  PRUNED=$((PRUNED + 1))
done < <(find "$BACKUP_DIR" -name "${DB_NAME}_*.dump" -mtime "+${KEEP_DAYS}" 2>/dev/null)

if [[ $PRUNED -gt 0 ]]; then
  ok "Pruned $PRUNED backup(s) older than $KEEP_DAYS days."
fi

TOTAL="$(find "$BACKUP_DIR" -name "${DB_NAME}_*.dump" | wc -l | tr -d ' ')"
ok "Done. $TOTAL backup(s) stored in $BACKUP_DIR"
