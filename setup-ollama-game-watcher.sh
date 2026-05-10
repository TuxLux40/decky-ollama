#!/usr/bin/env bash
# Installs the ollama-game-watcher as a systemd system service.
# Requires root: sudo bash setup-ollama-game-watcher.sh
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
    echo "Run as root (sudo)." >&2
    exit 1
fi

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DEST="/usr/local/bin/ollama-game-watcher"
SERVICE_FILE="/etc/systemd/system/ollama-game-watcher.service"

# ── 1. Install script ─────────────────────────────────────────────────────────
install -m 755 "$REPO_DIR/ollama-game-watcher" "$BIN_DEST"
echo "Installed watcher to $BIN_DEST"

# ── 2. Write service unit ─────────────────────────────────────────────────────
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Evict Ollama models from VRAM when a Steam game starts
After=ollama.service

[Service]
Type=simple
ExecStart=$BIN_DEST
Restart=always
RestartSec=5
SyslogIdentifier=ollama-game-watcher

[Install]
WantedBy=multi-user.target
EOF
echo "Wrote $SERVICE_FILE"

# ── 3. Enable and start ───────────────────────────────────────────────────────
systemctl daemon-reload
systemctl enable --now ollama-game-watcher.service
echo "Service enabled and started."

echo ""
echo "Status:"
systemctl status ollama-game-watcher.service --no-pager -l || true
echo ""
echo "Follow logs with:"
echo "  journalctl -u ollama-game-watcher -f"
