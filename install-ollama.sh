#!/usr/bin/env bash
# Installs Ollama with AMD GPU acceleration, bound to all interfaces.
# Run as root: sudo bash install-ollama.sh
set -euo pipefail

OLLAMA_PORT="11434"
DROPIN_DIR="/etc/systemd/system/ollama.service.d"
DROPIN_FILE="$DROPIN_DIR/gaming-server.conf"

if [[ $EUID -ne 0 ]]; then
    echo "Run as root (sudo)." >&2
    exit 1
fi

# ── 1. Install ────────────────────────────────────────────────────────────────
echo "==> Installing ollama..."
pacman -S --noconfirm ollama

# ── 2. GPU group membership ───────────────────────────────────────────────────
# /dev/kfd and /dev/dri/renderD128 are both group 'render' on this system.
echo "==> Adding ollama user to render group (GPU access)..."
usermod -aG render ollama

# ── 3. Systemd drop-in ───────────────────────────────────────────────────────
# - OLLAMA_HOST=0.0.0.0: listen on all interfaces (LAN + Tailscale + loopback)
# - OLLAMA_KEEP_ALIVE=5m: keep model in VRAM for 5 min after last use;
#   ollama-game-watcher evicts immediately when a Steam game starts
echo "==> Writing systemd drop-in to $DROPIN_FILE..."
mkdir -p "$DROPIN_DIR"
cat > "$DROPIN_FILE" << EOF
[Service]
Environment="OLLAMA_HOST=0.0.0.0:${OLLAMA_PORT}"
Environment="OLLAMA_KEEP_ALIVE=5m"
EOF

# ── 4. Enable and start ───────────────────────────────────────────────────────
echo "==> Enabling and starting ollama.service..."
systemctl daemon-reload
systemctl enable --now ollama.service

echo ""
LAN_IP="$(hostname -I | awk '{print $1}')"
echo "Done. Ollama is listening on 0.0.0.0:${OLLAMA_PORT}"
echo "  LAN: http://${LAN_IP}:${OLLAMA_PORT}"
echo ""
echo "Point OpenWebUI's Ollama URL at whichever address reaches this machine."
