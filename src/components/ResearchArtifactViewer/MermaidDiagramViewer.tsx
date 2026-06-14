import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  Code2,
  Copy,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Minimize2,
  Play,
  X,
} from "lucide-react";

import { cn } from "./utils";

type MermaidViewMode = "image" | "code";
type CopyState = "idle" | "copied" | "failed";

interface MermaidDiagramViewerProps {
  chart: string;
}

const mermaidConfig = {
  startOnLoad: false,
  securityLevel: "strict",
  theme: "dark",
  themeVariables: {
    background: "#171717",
    primaryColor: "#262626",
    primaryTextColor: "#f4f4f5",
    primaryBorderColor: "#737373",
    lineColor: "#a1a1aa",
    secondaryColor: "#1f2937",
    tertiaryColor: "#111827",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
} as const;

let mermaidInitialized = false;

async function getMermaid() {
  const { default: mermaid } = await import("mermaid");

  if (!mermaidInitialized) {
    mermaid.initialize(mermaidConfig);
    mermaidInitialized = true;
  }

  return mermaid;
}

async function canWriteToClipboard() {
  if (!navigator.clipboard?.writeText) return false;

  try {
    if (!navigator.permissions?.query) return true;

    const permission = await navigator.permissions.query({
      name: "clipboard-write" as PermissionName,
    });

    return permission.state !== "denied";
  } catch {
    return true;
  }
}

function MermaidIcon() {
  return (
    <span className="relative inline-flex h-4 w-4 items-center justify-center">
      <span className="absolute h-3 w-3 rounded-sm border border-zinc-300" />
      <span className="absolute h-1.5 w-1.5 translate-x-1 translate-y-1 rounded-sm border border-zinc-300 bg-[#171717]" />
    </span>
  );
}

function IconButton({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ViewToggle({
  mode,
  onModeChange,
}: {
  mode: MermaidViewMode;
  onModeChange: (mode: MermaidViewMode) => void;
}) {
  return (
    <div
      aria-label="Mermaid view mode"
      className="flex items-center rounded-full border border-white/10 bg-black/20 p-0.5"
      role="tablist"
    >
      <button
        aria-selected={mode === "image"}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/25",
          mode === "image"
            ? "bg-white/12 text-white"
            : "text-zinc-400 hover:bg-white/[0.055] hover:text-zinc-100",
        )}
        onClick={() => onModeChange("image")}
        role="tab"
        type="button"
      >
        <ImageIcon className="h-3.5 w-3.5" />
        Image
      </button>
      <button
        aria-selected={mode === "code"}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/25",
          mode === "code"
            ? "bg-white/12 text-white"
            : "text-zinc-400 hover:bg-white/[0.055] hover:text-zinc-100",
        )}
        onClick={() => onModeChange("code")}
        role="tab"
        type="button"
      >
        <Code2 className="h-3.5 w-3.5" />
        Code
      </button>
    </div>
  );
}

export function MermaidDiagramViewer({ chart }: MermaidDiagramViewerProps) {
  const diagramId = useMemo(
    () => `research-mermaid-${Math.random().toString(36).slice(2)}`,
    [],
  );
  const source = chart.trim();
  const [mode, setMode] = useState<MermaidViewMode>("image");
  const [fullscreen, setFullscreen] = useState(false);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        setLoading(true);
        setError(null);

        const mermaid = await getMermaid();
        const renderId = `${diagramId}-${Date.now()}`;
        const result = await mermaid.render(renderId, source);

        if (!cancelled) {
          setSvg(result.svg);
        }
      } catch (renderError) {
        if (!cancelled) {
          setSvg("");
          setError(
            renderError instanceof Error
              ? renderError.message
              : "Unable to render this Mermaid diagram.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [diagramId, source]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setFullscreen(false);
    }

    if (!fullscreen) return undefined;

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  async function copyActiveView() {
    const textToCopy = mode === "image" && svg ? svg : source;

    try {
      if (!(await canWriteToClipboard())) {
        setCopyState("failed");
        window.setTimeout(() => setCopyState("idle"), 1400);
        return;
      }

      await navigator.clipboard.writeText(textToCopy);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }

    window.setTimeout(() => setCopyState("idle"), 1400);
  }

  function DiagramBody({ expanded }: { expanded?: boolean }) {
    if (loading) {
      return (
        <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Rendering Mermaid diagram
        </div>
      );
    }

    if (mode === "code") {
      return (
        <pre
          className={cn(
            "overflow-auto bg-[#101010] p-4 text-sm leading-7 text-zinc-100",
            expanded ? "min-h-0 flex-1" : "max-h-80",
          )}
        >
          <code>{source}</code>
        </pre>
      );
    }

    if (error) {
      return (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-rose-200">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-semibold">Mermaid render failed</p>
            <p className="mt-1 max-w-xl text-rose-100/75">{error}</p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex min-h-40 items-center overflow-auto bg-[#1b1b1b] p-4",
          expanded ? "min-h-0 flex-1 justify-center" : "justify-start",
          "[&_svg]:h-auto [&_svg]:max-w-none [&_svg]:shrink-0",
          expanded && "[&_svg]:max-h-full [&_svg]:max-w-full",
        )}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  function DiagramCard({ expanded = false }: { expanded?: boolean }) {
    return (
      <section
        className={cn(
          "overflow-hidden border border-white/10 bg-[#171717] shadow-2xl shadow-black/25",
          expanded
            ? "flex h-full min-h-0 flex-col rounded-none"
            : "my-6 rounded-[1.15rem]",
        )}
      >
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 bg-black/30 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <MermaidIcon />
            <span className="truncate text-sm font-semibold text-white">Mermaid</span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ViewToggle mode={mode} onModeChange={setMode} />
            <IconButton
              disabled={loading}
              label={mode === "image" ? "Copy Mermaid SVG" : "Copy Mermaid code"}
              onClick={() => void copyActiveView()}
            >
              {copyState === "copied" && <Check className="h-4 w-4" />}
              {copyState === "failed" && <AlertCircle className="h-4 w-4" />}
              {copyState === "idle" && <Copy className="h-4 w-4" />}
            </IconButton>
            <IconButton
              disabled={loading || Boolean(error)}
              label="Show Mermaid image"
              onClick={() => setMode("image")}
            >
              <Play className="h-4 w-4" />
            </IconButton>
            <IconButton
              label={expanded ? "Exit Mermaid fullscreen" : "Open Mermaid fullscreen"}
              onClick={() => setFullscreen((value) => !value)}
            >
              {expanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </IconButton>
            {expanded && (
              <IconButton
                label="Close Mermaid fullscreen"
                onClick={() => setFullscreen(false)}
              >
                <X className="h-4 w-4" />
              </IconButton>
            )}
          </div>
        </header>

        <DiagramBody expanded={expanded} />
      </section>
    );
  }

  return (
    <>
      <DiagramCard />

      {fullscreen && (
        <div className="fixed inset-0 z-[10000] bg-[#121212] text-zinc-100">
          <DiagramCard expanded />
        </div>
      )}
    </>
  );
}
