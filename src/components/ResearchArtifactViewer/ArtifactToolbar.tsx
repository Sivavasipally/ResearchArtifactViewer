import {
  Download,
  Maximize2,
  Minimize2,
  PanelLeftOpen,
  PanelRightOpen,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "./utils";

interface ArtifactToolbarProps {
  title: string;
  canDownload: boolean;
  isFullscreen: boolean;
  showTocButton: boolean;
  showSourcesButton: boolean;
  onDownload: () => void;
  onToggleFullscreen: () => void;
  onToggleToc: () => void;
  onToggleSources: () => void;
  onClose?: () => void;
}

function IconButton({
  label,
  children,
  disabled,
  onClick,
}: {
  label: string;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200 transition",
        "hover:border-zinc-700 hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-800 disabled:hover:bg-zinc-900",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function ArtifactToolbar({
  title,
  canDownload,
  isFullscreen,
  showTocButton,
  showSourcesButton,
  onDownload,
  onToggleFullscreen,
  onToggleToc,
  onToggleSources,
  onClose,
}: ArtifactToolbarProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-zinc-800/80 bg-zinc-950/95 px-4 py-3 sm:px-6">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">
          Research artifact
        </p>
        <h2 className="mt-1 truncate text-base font-semibold text-zinc-50 sm:text-lg">
          {title}
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {showTocButton && (
          <IconButton label="Open table of contents" onClick={onToggleToc}>
            <PanelLeftOpen className="h-4 w-4" />
          </IconButton>
        )}
        {showSourcesButton && (
          <IconButton label="Open sources panel" onClick={onToggleSources}>
            <PanelRightOpen className="h-4 w-4" />
          </IconButton>
        )}
        <IconButton
          disabled={!canDownload}
          label="Download artifact"
          onClick={onDownload}
        >
          <Download className="h-4 w-4" />
        </IconButton>
        <IconButton
          label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </IconButton>
        {onClose && (
          <IconButton label="Close artifact viewer" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        )}
      </div>
    </header>
  );
}
