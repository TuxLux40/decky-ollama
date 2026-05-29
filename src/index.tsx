import {
  ButtonItem,
  definePlugin,
  PanelSection,
  PanelSectionRow,
  staticClasses,
} from "@decky/ui";
import { callable } from "@decky/api";
import { useEffect, useState } from "react";
import { FaRobot } from "react-icons/fa";
import type { OllamaStatus, OllamaModel } from "./types";

// ── Backend callables ────────────────────────────────────────────────────────

const getStatus = callable<[], OllamaStatus>("get_status");
const startService = callable<[], boolean>("start_service");
const stopService = callable<[], boolean>("stop_service");
const listModels = callable<[], OllamaModel[]>("list_models");

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  const gb = bytes / 1_000_000_000;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1_000_000).toFixed(0)} MB`;
}

// ── Components ───────────────────────────────────────────────────────────────

function StatusRow({ status }: { status: OllamaStatus | null }) {
  if (!status) return <PanelSectionRow><ButtonItem layout="below">Loading…</ButtonItem></PanelSectionRow>;

  const dot = status.running ? "🟢" : status.installed ? "🟡" : "🔴";
  const label = status.running
    ? `Running ${status.version ?? ""}`
    : status.installed
    ? "Stopped"
    : "Not installed";

  return (
    <PanelSectionRow>
      <ButtonItem layout="below" description={label}>
        {dot} Ollama
      </ButtonItem>
    </PanelSectionRow>
  );
}

function ModelList({ models }: { models: OllamaModel[] }) {
  if (models.length === 0)
    return (
      <PanelSectionRow>
        <ButtonItem layout="below">No models installed</ButtonItem>
      </PanelSectionRow>
    );

  return (
    <>
      {models.map((m) => (
        <PanelSectionRow key={m.name}>
          <ButtonItem layout="below" description={formatBytes(m.size)}>
            {m.name}
          </ButtonItem>
        </PanelSectionRow>
      ))}
    </>
  );
}

// ── Main plugin panel ────────────────────────────────────────────────────────

function Content() {
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const s = await getStatus();
      setStatus(s);
      if (s?.running) setModels(await listModels());
      else setModels([]);
    } catch {
      setStatus({ installed: false, running: false, version: null });
      setModels([]);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function handleToggleService() {
    setBusy(true);
    try {
      if (status?.running) await stopService();
      else await startService();
      await refresh();
    } catch {
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PanelSection title="Status">
        <StatusRow status={status} />

        {status?.installed && (
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={handleToggleService} disabled={busy}>
              {status.running ? "Stop service" : "Start service"}
            </ButtonItem>
          </PanelSectionRow>
        )}
      </PanelSection>

      {status?.running && (
        <PanelSection title="Installed models">
          <ModelList models={models} />
        </PanelSection>
      )}
    </>
  );
}

// ── Plugin definition ────────────────────────────────────────────────────────

export default definePlugin(() => ({
  name: "decky-ollama",
  titleView: <div className={staticClasses.Title}>Ollama</div>,
  content: <Content />,
  icon: <FaRobot />,
  alwaysRender: false,
  onDismount() {},
}));
