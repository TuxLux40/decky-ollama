# Copilot Instructions

This repo is a [Decky Loader](https://decky.xyz) plugin for managing Ollama on Steam Deck. Keep changes small, explicit, and aligned with the existing split between the React frontend and the Python backend. For product and setup context, link to [README.md](README.md) instead of repeating it here.

## Commands

```sh
pnpm install       # install dependencies
pnpm run build     # compile frontend → dist/index.js
pnpm run watch     # rebuild on changes
pnpm run typecheck # TypeScript type check without emit
pnpm run lint      # ESLint on src/
```

There is no test suite in this repo. For backend-only iteration, edit [main.py](main.py) and restart Decky Loader on the Deck.

## What Lives Where

- [src/index.tsx](src/index.tsx): single React QAM panel, all frontend state and Decky API callables live here.
- [main.py](main.py): Python `Plugin` class; public async methods are exposed to the frontend as RPC endpoints.
- [src/types.d.ts](src/types.d.ts): shared TypeScript contracts; add new frontend/backend types here.
- [plugin.json](plugin.json): plugin metadata and the `_root` flag.
- [ollama-game-watcher](ollama-game-watcher) and [setup-ollama-game-watcher.sh](setup-ollama-game-watcher.sh): separate watcher/service flow; keep the script and setup path in sync if you touch this area.

## Conventions

- Use `callable<Args, Return>("method_name")` at module scope for frontend-to-backend calls.
- Use `decky.emit("event_name", payload)` for backend-to-frontend events and pair listeners with `addEventListener` / `removeEventListener` cleanup.
- Keep new backend methods as public `async def` methods on `Plugin` so Decky exposes them automatically.
- Keep shared interfaces in [src/types.d.ts](src/types.d.ts); avoid duplicating contracts inline.
- Use `decky.logger.info/error(...)` for backend logging, not `print`.
- Use stdlib networking in the backend (`urllib.request`); do not introduce extra HTTP dependencies.
- Treat `OLLAMA_BIN`, `OLLAMA_API`, and `INSTALL_SCRIPT` as module-level configuration in [main.py](main.py).

## Useful References

- [README.md](README.md): architecture overview, install flow, and backend method/event tables.
- [rollup.config.js](rollup.config.js): build setup is intentionally minimal.
