import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Radio,
  Search,
  Sparkles,
} from "lucide-react";

import type { ArtifactProgress, ArtifactStatus } from "./types";
import { cn, formatProgressMessage } from "./utils";

interface ArtifactProgressBarProps {
  progress?: ArtifactProgress;
}

const statusTone: Record<ArtifactStatus, string> = {
  idle: "text-zinc-400",
  loading: "text-sky-300",
  searching: "text-cyan-300",
  generating: "text-violet-300",
  completed: "text-emerald-300",
  error: "text-rose-300",
};

function StatusIcon({ status }: { status: ArtifactStatus }) {
  const className = cn("h-4 w-4 shrink-0", statusTone[status]);

  if (status === "completed") return <CheckCircle2 className={className} />;
  if (status === "error") return <AlertCircle className={className} />;
  if (status === "searching") return <Search className={className} />;
  if (status === "generating") return <Sparkles className={className} />;
  if (status === "loading") return <Loader2 className={cn(className, "animate-spin")} />;

  return <Radio className={className} />;
}

export function ArtifactProgressBar({ progress }: ArtifactProgressBarProps) {
  const status = progress?.status ?? "idle";
  const percent =
    typeof progress?.percent === "number"
      ? Math.min(100, Math.max(0, progress.percent))
      : undefined;
  const isIndeterminate =
    percent === undefined &&
    (status === "loading" || status === "searching" || status === "generating");

  return (
    <section
      aria-live={status === "error" ? "assertive" : "polite"}
      className="border-b border-zinc-800/80 bg-zinc-950/70 px-4 py-3 sm:px-6"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <StatusIcon status={status} />
          <span className={cn("font-medium", statusTone[status])}>
            {formatProgressMessage(progress)}
          </span>
        </div>

        {(typeof percent === "number" || isIndeterminate) && (
          <div
            aria-label="Artifact progress"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={typeof percent === "number" ? percent : undefined}
            className="h-1.5 overflow-hidden rounded-full bg-zinc-800"
            role="progressbar"
          >
            <div
              className={cn(
                "h-full rounded-full bg-cyan-300 transition-all duration-500",
                isIndeterminate && "w-1/3 animate-pulse",
              )}
              style={typeof percent === "number" ? { width: `${percent}%` } : undefined}
            />
          </div>
        )}
      </div>
    </section>
  );
}
