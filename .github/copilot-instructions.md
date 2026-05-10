# Copilot Instructions

## Commands

```sh
pnpm install       # install dependencies
pnpm run build     # compile frontend → dist/index.js
pnpm run watch     # rebuild on changes
pnpm run typecheck # TypeScript type check without emit
pnpm run lint      # ESLint on src/
```

There is no test suite. To iterate on the Python backend without a full rebuild, edit `main.py` and restart Decky Loader on the Deck.

Deploy to the Steam Deck:
```sh
rsync -av --exclude node_modules --exclude .git . deck@<deck-ip>:~/homebrew/plugins/decky-ollama/
```

## Architecture

This is a [Decky Loader](https://decky.xyz) plugin with two distinct layers:

```
QAM panel (React/TypeScript)   src/index.tsx
        │  callable() / addEventListener()
        ▼
Decky Loader IPC
        ▼
main.py  (Python, runs as root — see plugin.json "flags": ["_root"])
        │
   ┌────┴──────────────┐
   │                   │
ollama binary    Ollama REST API  (http://localhost:11434)
```

**Frontend** (`src/index.tsx`) — A single React component rendered in the Steam QAM. All state lives here; there are no pages/routes.

**Backend** (`main.py`) — A `Plugin` class whose public `async` methods are automatically exposed to the frontend as RPC endpoints.

**Game watcher** (`ollama-game-watcher`) — A standalone bash script installed as a systemd user service. It polls for active Steam games and evicts loaded Ollama models from VRAM when a game starts, so the GPU is free for gaming.

## Key Conventions

### Frontend ↔ Backend communication

- **RPC (frontend → backend):** Declare callables at module level with `callable<[ArgTypes], ReturnType>("python_method_name")`. Call them like normal async functions.
- **Events (backend → frontend):** The backend pushes events with `decky.emit("event_name", payload)`. The frontend subscribes with `addEventListener` / `removeEventListener` in a `useEffect` cleanup pair.
- `pullModel` is intentionally **fire-and-forget** on the frontend — progress arrives via `pull_progress` events; completion via `pull_done`.

### Adding a new backend method

1. Add a public `async def method_name(self, ...)` to the `Plugin` class in `main.py`.
2. Declare and use it in `src/index.tsx` with `callable<[ArgTypes], ReturnType>("method_name")`.
3. Add corresponding types to `src/types.d.ts` if needed.

### TypeScript

- Strict mode is enabled (`strict`, `noUnusedLocals`, `noUnusedParameters`).
- All shared types are in `src/types.d.ts` — add new interfaces there, not inline.
- The build uses `@decky/rollup` (wraps Rollup); config is a one-liner in `rollup.config.js`.

### Python backend

- Use `decky.logger.info/error(...)` for all logging (not `print`).
- HTTP calls to the Ollama API use `urllib.request` (stdlib only — no third-party HTTP libs available in the plugin sandbox).
- `OLLAMA_BIN`, `OLLAMA_API`, and `INSTALL_SCRIPT` are module-level constants — update them there, not inline.
