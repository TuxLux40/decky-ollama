# decky-ollama

<p align="center">
        <img src="assets/logo.png" alt="decky-ollama logo" width="160" />
</p>

<p align="center">
        <strong>Run and monitor Ollama from the Steam Deck Quick Access Menu (QAM).</strong>
</p>

<p align="center">
        <img src="https://img.shields.io/badge/Decky%20Loader-compatible-0f766e?style=for-the-badge" alt="Decky Loader compatible" />
        <img src="https://img.shields.io/badge/Steam%20Deck-ready-111827?style=for-the-badge" alt="Steam Deck ready" />
        <img src="https://img.shields.io/badge/TypeScript-frontend-3178c6?style=for-the-badge" alt="TypeScript frontend" />
        <img src="https://img.shields.io/badge/Python-backend-f59e0b?style=for-the-badge" alt="Python backend" />
</p>

A [Decky Loader](https://decky.xyz) plugin that brings [Ollama](https://ollama.ai) to Gaming Mode. Start and stop the service from the QAM and see what models are loaded. A companion system service automatically evicts models from VRAM when a game launches.

## What It Does

- **Service control** — start and stop `ollama serve` from the QAM without leaving Gaming Mode
- **One-click install** — download and install Ollama via the official installer if not already present
- **Model info** — lists installed models and their disk size at a glance
- **VRAM eviction** — the `ollama-game-watcher` system service unloads models from VRAM the moment a game starts

## Whats the point?
I wanted to let my PC run as a game streaming server to play over tailscale and sunshine/moonlight when I'm away from home, but I also wanted my Ollama models to still be available in OpenWebUI. Since user services don't persist into Gaming Mode, I had Claude create this plugin for me to turn it into a system service that would and also check the status. Future features could include some form of assist features for games or errors or whatever else could be useful.

## Quick Start

### Requirements

- Steam Deck / SteamOS 3.x or an Arch-based distro (tested on CachyOS)
- [Decky Loader](https://decky.xyz) installed

### Option A — sideload a pre-built release (no build tools required)

1. Download `decky-ollama.zip` from the [latest release](https://github.com/TuxLux40/decky-ollama/releases/latest)
2. In Decky Loader, open Settings → Developer → Install plugin from zip
3. Point it at the downloaded zip

### Option B — build from source

Requires Node.js 20+ and pnpm (`npm install -g pnpm`).

```sh
git clone https://github.com/TuxLux40/decky-ollama.git
cd decky-ollama
bash install.sh
```

Then restart Decky Loader from the QAM.

## How It Works

```text
QAM panel (React/TypeScript)
                                │  callable()
                                ▼
Decky Loader IPC
                                │
                                ▼
main.py  (Python, runs as root)
                                │
         ┌──────────┴──────────────┐
         │                         │
ollama binary          Ollama REST API
                       http://localhost:11434
```

The game watcher is a separate bash process under systemd. It polls `pgrep -f "SteamLaunch AppId"` every 2 seconds and calls the Ollama API to evict loaded models when a game starts.

- [src/index.tsx](src/index.tsx) — React panel shown in the QAM
- [main.py](main.py) — backend `Plugin` class; public async methods become RPC endpoints automatically
- [src/types.d.ts](src/types.d.ts) — shared TypeScript types between frontend and backend
- [ollama-game-watcher](ollama-game-watcher) — VRAM eviction script
- [setup-ollama-game-watcher.sh](setup-ollama-game-watcher.sh) — installs the watcher as a system service

### Backend API

| Method             | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `get_status()`     | Returns `{ installed, running, version }`    |
| `start_service()`  | Starts `ollama serve`                        |
| `stop_service()`   | Stops the running `ollama serve` process     |
| `install_ollama()` | Runs the official install script             |
| `list_models()`    | Returns installed models from the Ollama API |

## Development

Prerequisites: Node.js 20+, pnpm 10+.

```sh
pnpm install       # install dependencies
pnpm build         # compile frontend → dist/index.js
pnpm run watch     # rebuild on changes
pnpm run typecheck # TypeScript type check without emit
pnpm run lint      # ESLint on src/
```

For backend-only changes, edit [main.py](main.py) and restart Decky Loader on the Deck.

## Contributing

PRs are welcome. Open an issue first for anything beyond small fixes.

## License

See [LICENSE](LICENSE).
