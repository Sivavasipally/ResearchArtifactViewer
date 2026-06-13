import {
  Download,
  FileText,
  Maximize2,
  Minimize2,
  PanelRightOpen,
  Share2,
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
  variant?: "card" | "fullscreen";
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
        "inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition",
        "hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25",
        "disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-zinc-300",
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
  variant = "card",
}: ArtifactToolbarProps) {
  if (variant === "fullscreen") {
    return (
      <>
        <div className="absolute left-3 top-3 z-40">
          <IconButton label="Exit fullscreen" onClick={onToggleFullscreen}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="absolute right-4 top-3 z-40 flex items-center gap-1">
          <IconButton
            disabled={!canDownload}
            label="Download artifact"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
          </IconButton>
          {showSourcesButton && (
            <IconButton label="Show sources" onClick={onToggleSources}>
              <Share2 className="h-4 w-4" />
            </IconButton>
          )}
          {showTocButton && (
            <IconButton label="Show table of contents" onClick={onToggleToc}>
              <PanelRightOpen className="h-4 w-4 rotate-180" />
            </IconButton>
          )}
        </div>
      </>
    );
  }

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-white/10 bg-[#171717] px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0d8bff] text-white">
          <FileText className="h-4 w-4" />
        </span>
        <h2 className="truncate text-sm font-semibold text-zinc-50 sm:text-[15px]">
          {title}
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-1">
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
