# decky-ollama

A [Decky Loader](https://decky.xyz) plugin that brings [Ollama](https://ollama.ai) to the Steam Deck Quick Access Menu. Install, start/stop the Ollama service, manage models, and monitor pull progress — without leaving Gaming Mode.

## Features

- **Service control** — start and stop `ollama serve` from the QAM
- **Install** — downloads and installs Ollama via the official install script
- **Model management** — lists installed models with size, lets you pull new ones with live progress, and delete ones you no longer need
- **Status indicator** — shows whether Ollama is installed, stopped, or running with its version

## Requirements

- Steam Deck running SteamOS 3.x
- [Decky Loader](https://decky.xyz) installed

## Installation

### Via Decky plugin store (once published)

Open the Decky store from the QAM and search for **Ollama**.

### Manual (development)

```sh
# on your development machine
git clone https://github.com/TuxLux40/decky-ollama.git
cd decky-ollama
pnpm install
pnpm run build

# deploy to Steam Deck (replace <deck-ip>)
rsync -av --exclude node_modules --exclude .git . deck@<deck-ip>:~/homebrew/plugins/decky-ollama/
```

Then restart Decky Loader from the QAM.

## Architecture

```
QAM panel (React/TypeScript)
        │  callable() / addEventListener()
        ▼
Decky Loader IPC
        │
        ▼
main.py  (Python, runs as root)
        │
   ┌────┴──────────────┐
   │                   │
ollama binary    Ollama REST API
                 http://localhost:11434
```

**Frontend** (`src/index.tsx`) — React component rendered in the QAM. Calls Python methods via `callable<Args, Return>("method_name")` and receives streaming updates via `addEventListener("event_name", cb)`.

**Backend** (`main.py`) — Python `Plugin` class. Public async methods are automatically exposed to the frontend. Streaming pull progress is pushed to the frontend with `decky.emit("pull_progress", {...})`.

### Backend methods

| Method | Description |
|---|---|
| `get_status()` | Returns `{ installed, running, version }` |
| `start_service()` | Spawns `ollama serve` |
| `stop_service()` | Kills the `ollama serve` process |
| `install_ollama()` | Runs the official install script |
| `list_models()` | Returns all installed models from the Ollama API |
| `pull_model(name)` | Pulls a model, emitting `pull_progress` events |
| `delete_model(name)` | Deletes a model via the Ollama API |

### Backend events

| Event | Payload | Description |
|---|---|---|
| `pull_progress` | `{ status, completed, total }` | Progress of an active model pull |
| `pull_done` | — | Pull finished (success or error) |

## Development

**Prerequisites:** Node.js 20+, pnpm 9+.

```sh
pnpm install       # install dependencies
pnpm run build     # compile frontend → dist/index.js
pnpm run watch     # rebuild on changes
pnpm run typecheck # TypeScript type check without emit
```

To iterate on the backend without a full rebuild, edit `main.py` and restart Decky Loader on the Deck.

## Contributing

PRs are welcome. Please open an issue first for anything beyond small fixes.

## License

MIT
