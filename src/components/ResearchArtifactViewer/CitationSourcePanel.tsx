import { useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ExternalLink,
  FileSearch,
  Link2,
  Search,
  X,
} from "lucide-react";

import type { ArtifactProgress, CitationSource, PromptHistoryItem } from "./types";
import {
  cn,
  formatDate,
  formatProgressMessage,
  getDomainLabel,
  groupSourcesByDomain,
} from "./utils";

type SourcePanelTab = "sources" | "citations" | "activity";

interface CitationSourcePanelProps {
  sources?: CitationSource[];
  promptHistory?: PromptHistoryItem[];
  progress?: ArtifactProgress;
  highlightedCitationNumber?: number | null;
  onCitationSelect?: (citationNumber: number) => void;
  onClose?: () => void;
}

const tabs: Array<{ id: SourcePanelTab; label: string }> = [
  { id: "sources", label: "Sources" },
  { id: "citations", label: "Citations" },
  { id: "activity", label: "Activity" },
];

function openSource(source: CitationSource) {
  if (!source.url) return;
  window.open(source.url, "_blank", "noopener,noreferrer");
}

function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (typeof confidence !== "number") return null;

  const percent = Math.round(confidence * 100);

  return (
    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
      {percent}% confidence
    </span>
  );
}

function SourceCard({
  source,
  highlighted,
  onCitationSelect,
}: {
  source: CitationSource;
  highlighted: boolean;
  onCitationSelect?: (citationNumber: number) => void;
}) {
  const domain = getDomainLabel(source);
  const retrievedAt = formatDate(source.retrievedAt);

  return (
    <article
      className={cn(
        "rounded-xl border border-transparent bg-transparent p-3 transition",
        highlighted
          ? "border-white/15 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
          : "hover:bg-white/[0.055]",
      )}
      id={`source-${source.citationNumber}`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          aria-label={`Select citation ${source.citationNumber}`}
          className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-cyan-300 text-xs font-bold text-zinc-950 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          onClick={() => onCitationSelect?.(source.citationNumber)}
          type="button"
        >
          {source.citationNumber}
        </button>

        <button
          aria-label={source.url ? `Open source ${source.title}` : `Source ${source.title}`}
          className="group min-w-0 flex-1 text-left focus:outline-none"
          disabled={!source.url}
          onClick={() => openSource(source)}
          type="button"
        >
          <h4 className="line-clamp-2 text-sm font-semibold leading-5 text-zinc-100 group-enabled:group-hover:text-cyan-200">
            {source.title}
          </h4>
        </button>

        {source.url && (
          <ExternalLink aria-hidden className="mt-1 h-4 w-4 shrink-0 text-zinc-500" />
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
        {source.faviconUrl ? (
          <img
            alt=""
            className="h-4 w-4 rounded-sm"
            loading="lazy"
            src={source.faviconUrl}
          />
        ) : (
          <Link2 className="h-3.5 w-3.5" />
        )}
        <span className="truncate">{domain}</span>
        {retrievedAt && (
          <>
            <span aria-hidden>·</span>
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{retrievedAt}</span>
          </>
        )}
      </div>

      {source.excerpt && (
        <p className="mt-3 line-clamp-4 text-sm leading-6 text-zinc-300">
          {source.excerpt}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ConfidenceBadge confidence={source.confidence} />
        {source.url && (
          <span className="max-w-full truncate rounded-full border border-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
            {source.url}
          </span>
        )}
      </div>
    </article>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center">
      <FileSearch className="mx-auto h-5 w-5 text-zinc-500" />
      <p className="mt-2 text-sm text-zinc-400">{label}</p>
    </div>
  );
}

export function CitationSourcePanel({
  sources = [],
  promptHistory = [],
  progress,
  highlightedCitationNumber,
  onCitationSelect,
  onClose,
}: CitationSourcePanelProps) {
  const [activeTab, setActiveTab] = useState<SourcePanelTab>("sources");
  const [query, setQuery] = useState("");

  const filteredSources = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sources;

    return sources.filter((source) =>
      [
        source.title,
        source.domain,
        source.url,
        source.excerpt,
        String(source.citationNumber),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    );
  }, [query, sources]);

  const groupedSources = useMemo(
    () => groupSourcesByDomain(filteredSources),
    [filteredSources],
  );

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-white/10 bg-[#171717]">
      <div className="border-b border-white/10 p-3">
        <div
          aria-label="Sources panel tabs"
          className="flex items-center gap-1"
          role="tablist"
        >
          <div className="flex flex-1 items-center gap-1">
            {tabs.map((tab) => (
              <button
                aria-selected={activeTab === tab.id}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/25",
                  activeTab === tab.id
                    ? "bg-white/10 text-zinc-50"
                    : "text-zinc-400 hover:bg-white/[0.055] hover:text-zinc-100",
                )}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                type="button"
              >
                {tab.id === "activity" && progress?.elapsedLabel
                  ? `${tab.label} - ${progress.elapsedLabel}`
                  : tab.label}
              </button>
            ))}
          </div>

          {onClose && (
            <button
              aria-label="Close sources panel"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <p className="mt-4 text-sm font-semibold text-zinc-300">
          Citations - {sources.length}
        </p>

        {activeTab !== "activity" && (
          <label className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-400 transition focus-within:border-white/25">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search sources</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sources"
              value={query}
            />
          </label>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {activeTab === "sources" && (
          <div className="space-y-5">
            {filteredSources.length === 0 && (
              <EmptyState label="No sources match this filter." />
            )}

            {Object.entries(groupedSources).map(([domain, domainSources]) => (
              <section key={domain}>
                <h4 className="mb-2 px-2 text-xs font-semibold text-zinc-400">
                  {domain}
                </h4>
                <div className="space-y-1">
                  {domainSources.map((source) => (
                    <SourceCard
                      highlighted={source.citationNumber === highlightedCitationNumber}
                      key={source.id}
                      onCitationSelect={onCitationSelect}
                      source={source}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {activeTab === "citations" && (
          <div className="space-y-3">
            {filteredSources.length === 0 && (
              <EmptyState label="No citations are available." />
            )}
            {[...filteredSources]
              .sort((a, b) => a.citationNumber - b.citationNumber)
              .map((source) => (
                <SourceCard
                  highlighted={source.citationNumber === highlightedCitationNumber}
                  key={source.id}
                  onCitationSelect={onCitationSelect}
                  source={source}
                />
              ))}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                <Activity className="h-4 w-4 text-cyan-300" />
                Artifact status
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {formatProgressMessage(progress)}
              </p>
            </div>

            {promptHistory.length === 0 ? (
              <EmptyState label="No prompt activity has been provided." />
            ) : (
              <ol className="space-y-3">
                {promptHistory.map((item, index) => (
                  <li
                    className="rounded-xl border border-white/10 bg-black/20 p-3"
                    key={item.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
                        {index + 1}. {item.role}
                      </span>
                      {item.tokenCount && (
                        <span className="text-xs text-zinc-500">
                          {item.tokenCount.toLocaleString()} tokens
                        </span>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-300">
                      {item.content}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
