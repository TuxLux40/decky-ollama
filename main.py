import asyncio
import json
import os
import shutil
import subprocess
from pathlib import Path

import decky

def _find_ollama() -> Path:
    found = shutil.which("ollama")
    if found:
        return Path(found)
    # fallback to the path used by the official install script
    return Path("/usr/local/bin/ollama")

OLLAMA_BIN = _find_ollama()
OLLAMA_API = "http://localhost:11434"
INSTALL_SCRIPT = "https://ollama.ai/install.sh"


class Plugin:
    # ── Lifecycle ────────────────────────────────────────────────────────────

    async def _main(self):
        decky.logger.info("decky-ollama loaded")

    async def _unload(self):
        decky.logger.info("decky-ollama unloaded")

    async def _uninstall(self):
        decky.logger.info("decky-ollama uninstalled")

    async def _migration(self):
        decky.migrate_logs(
            os.path.join(decky.DECKY_PLUGIN_LOG_DIR, "decky-ollama.log")
        )
        decky.migrate_settings(
            os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "settings.json"),
            decky.DECKY_PLUGIN_SETTINGS_DIR,
        )
        decky.migrate_runtime(
            os.path.join(decky.DECKY_PLUGIN_RUNTIME_DIR, ""),
            decky.DECKY_PLUGIN_RUNTIME_DIR,
        )

    # ── Status ───────────────────────────────────────────────────────────────

    async def get_status(self) -> dict:
        installed = OLLAMA_BIN.exists()
        version = None
        running = False

        if installed:
            try:
                result = subprocess.run(
                    [str(OLLAMA_BIN), "version"],
                    capture_output=True, text=True, timeout=5
                )
                if result.returncode == 0:
                    version = result.stdout.strip()
            except Exception:
                pass

            try:
                import urllib.request
                with urllib.request.urlopen(f"{OLLAMA_API}/api/version", timeout=2) as r:
                    running = r.status == 200
            except Exception:
                running = False

        return {"installed": installed, "running": running, "version": version}

    # ── Service control ──────────────────────────────────────────────────────

    async def start_service(self) -> bool:
        try:
            subprocess.Popen(
                [str(OLLAMA_BIN), "serve"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            await asyncio.sleep(1.5)
            return True
        except Exception as e:
            decky.logger.error(f"start_service failed: {e}")
            return False

    async def stop_service(self) -> bool:
        try:
            subprocess.run(["pkill", "-f", "ollama serve"], check=False)
            return True
        except Exception as e:
            decky.logger.error(f"stop_service failed: {e}")
            return False

    # ── Install ──────────────────────────────────────────────────────────────

    async def install_ollama(self) -> bool:
        try:
            decky.logger.info("Installing Ollama…")
            result = subprocess.run(
                ["sh", "-c", f"curl -fsSL {INSTALL_SCRIPT} | sh"],
                capture_output=True, text=True, timeout=300
            )
            if result.returncode != 0:
                decky.logger.error(f"Install failed: {result.stderr}")
                return False
            decky.logger.info("Ollama installed successfully")
            return True
        except Exception as e:
            decky.logger.error(f"install_ollama failed: {e}")
            return False

    # ── Models ───────────────────────────────────────────────────────────────

    async def list_models(self) -> list:
        try:
            import urllib.request
            with urllib.request.urlopen(f"{OLLAMA_API}/api/tags", timeout=5) as r:
                data = json.loads(r.read())
                return data.get("models", [])
        except Exception as e:
            decky.logger.error(f"list_models failed: {e}")
            return []

