import {
  ButtonItem,
  definePlugin,
  PanelSection,
  PanelSectionRow,
  Router,
  staticClasses,
} from "@decky/ui";
import { callable, addEventListener, removeEventListener } from "@decky/api";
import { useEffect, useState } from "react";
import { FaRobot } from "react-icons/fa";
import type { OllamaStatus, OllamaModel, PullProgress } from "./types";

// ── Backend callables ────────────────────────────────────────────────────────

const getStatus = callable<[], OllamaStatus>("get_status");
const startService = callable<[], boolean>("start_service");
const stopService = callable<[], boolean>("stop_service");
const installOllama = callable<[], boolean>("install_ollama");
const listModels = callable<[], OllamaModel[]>("list_models");
const pullModel = callable<[name: string], boolean>("pull_model");
const deleteModel = callable<[name: string], boolean>("delete_model");

// Models suggested in the pull UI — small enough to run comfortably on Deck hardware
const SUGGESTED_MODELS = [
  "llama3.2:1b",
  "llama3.2:3b",
  "phi3.5:3.8b",
  "gemma3:1b",
  "gemma3:4b",
  "qwen2.5:3b",
  "mistral:7b",
];

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

function ModelList({
  models,
  onDelete,
}: {
  models: OllamaModel[];
  onDelete: (name: string) => void;
}) {
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
          <ButtonItem
            layout="below"
            description={formatBytes(m.size)}
            onClick={() => onDelete(m.name)}
          >
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
  const [pullProgress, setPullProgress] = useState<PullProgress | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const s = await getStatus();
    setStatus(s);
    if (s.running) setModels(await listModels());
  }

  useEffect(() => {
    refresh();

    const onPullProgress = (progress: PullProgress) => setPullProgress(progress);
    const onPullDone = () => {
      setPullProgress(null);
      setBusy(false);
      refresh();
    };

    addEventListener<[PullProgress]>("pull_progress", onPullProgress);
    addEventListener<[]>("pull_done", onPullDone);

    return () => {
      removeEventListener("pull_progress", onPullProgress);
      removeEventListener("pull_done", onPullDone);
    };
  }, []);

  async function handleToggleService() {
    setBusy(true);
    if (status?.running) await stopService();
    else await startService();
    await refresh();
    setBusy(false);
  }

  async function handleInstall() {
    setBusy(true);
    await installOllama();
    await refresh();
    setBusy(false);
  }

  async function handlePull(name: string) {
    setBusy(true);
    pullModel(name); // fire-and-forget; progress arrives via pull_progress events
  }

  async function handleDelete(name: string) {
    setBusy(true);
    await deleteModel(name);
    await refresh();
    setBusy(false);
  }

  return (
    <>
      <PanelSection title="Status">
        <StatusRow status={status} />

        {!status?.installed && (
          <PanelSectionRow>
            <ButtonItem layout="below" onClick={handleInstall} disabled={busy}>
              Install Ollama
            </ButtonItem>
          </PanelSectionRow>
        )}

        {status?.installed && (
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={handleToggleService}
              disabled={busy}
            >
              {status.running ? "Stop service" : "Start service"}
            </ButtonItem>
          </PanelSectionRow>
        )}
      </PanelSection>

      {status?.running && (
        <>
          <PanelSection title="Installed models">
            <ModelList models={models} onDelete={handleDelete} />

            {pullProgress && (
              <PanelSectionRow>
                <ButtonItem layout="below" description={pullProgress.status}>
                  {pullProgress.total
                    ? `${Math.round(((pullProgress.completed ?? 0) / pullProgress.total) * 100)}%`
                    : "Pulling…"}
                </ButtonItem>
              </PanelSectionRow>
            )}
          </PanelSection>

          <PanelSection title="Pull a model">
            {SUGGESTED_MODELS.map((name) => (
              <PanelSectionRow key={name}>
                <ButtonItem
                  layout="below"
                  onClick={() => handlePull(name)}
                  disabled={busy}
                >
                  {name}
                </ButtonItem>
              </PanelSectionRow>
            ))}
          </PanelSection>

          <PanelSection title="Links">
            <PanelSectionRow>
              <ButtonItem
                layout="below"
                onClick={() => Router.NavigateToExternalWeb("http://localhost:11434")}
              >
                Open Ollama API
              </ButtonItem>
            </PanelSectionRow>
            <PanelSectionRow>
              <ButtonItem
                layout="below"
                onClick={() => Router.NavigateToExternalWeb("https://ollama.com/library")}
              >
                Browse model library
              </ButtonItem>
            </PanelSectionRow>
          </PanelSection>
        </>
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
  onDismount() {},
}));
