import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronRight, X } from "lucide-react";

import { ArtifactProgressBar } from "./ArtifactProgressBar";
import { ArtifactToolbar } from "./ArtifactToolbar";
import { CitationSourcePanel } from "./CitationSourcePanel";
import { DocxArtifactViewer } from "./DocxArtifactViewer";
import { MarkdownArticleViewer } from "./MarkdownArticleViewer";
import { PdfArtifactViewer } from "./PdfArtifactViewer";
import { PromptHistoryViewer } from "./PromptHistoryViewer";
import type { ResearchArtifactViewerProps, TocItem } from "./types";
import {
  cn,
  downloadFileObject,
  downloadTextFile,
  getDownloadFilename,
  triggerDownload,
} from "./utils";

function TableOfContents({
  items,
  onSelect,
}: {
  items: TocItem[];
  onSelect: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="p-5 text-sm text-zinc-500">
        Table of contents appears when markdown headings are available.
      </div>
    );
  }

  return (
    <nav aria-label="Table of contents" className="h-full overflow-y-auto p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
        Contents
      </h3>
      <ol className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              className={cn(
                "group flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm leading-5 text-zinc-400 transition",
                "hover:bg-zinc-900 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/70",
                item.level === 2 && "pl-5",
                item.level === 3 && "pl-8 text-xs",
                item.level >= 4 && "pl-10 text-xs",
              )}
              onClick={() => onSelect(item.id)}
              type="button"
            >
              <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600 transition group-hover:text-cyan-300" />
              <span>{item.text}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Drawer({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="xl:hidden">
      <button
        aria-label="Close drawer backdrop"
        className="fixed inset-0 z-[9998] bg-black/60"
        onClick={onClose}
        type="button"
      />
      <section
        aria-label={title}
        className="fixed inset-x-0 bottom-0 z-[9999] max-h-[78vh] overflow-hidden rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black"
      >
        <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          <button
            aria-label={`Close ${title}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[calc(78vh-3.75rem)] overflow-y-auto">{children}</div>
      </section>
    </div>
  );
}

export function ResearchArtifactViewer({
  title,
  artifactType,
  markdownContent,
  fileUrl,
  file,
  sources = [],
  promptHistory = [],
  progress,
  defaultFullscreen = false,
  showTableOfContents = true,
  showSourcesPanel = true,
  downloadable = true,
  onDownload,
  onClose,
  className,
}: ResearchArtifactViewerProps) {
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollTopBeforeFullscreen = useRef(0);
  const [isFullscreen, setIsFullscreen] = useState(defaultFullscreen);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [tocOpen, setTocOpen] = useState(true);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const [mobileDrawer, setMobileDrawer] = useState<"toc" | "sources" | null>(null);
  const [highlightedCitationNumber, setHighlightedCitationNumber] = useState<number | null>(
    null,
  );

  const hasToc = artifactType === "markdown" && showTableOfContents && tocItems.length > 0;
  const shouldShowSourcesPanel = showSourcesPanel && artifactType !== "citations";
  const canDownload = useMemo(() => {
    if (!downloadable) return false;
    if (onDownload) return true;
    if (artifactType === "markdown") return Boolean(markdownContent?.trim());
    if (artifactType === "prompt-history") return promptHistory.length > 0;
    if (artifactType === "citations") return sources.length > 0;
    return Boolean(fileUrl || file);
  }, [
    artifactType,
    downloadable,
    file,
    fileUrl,
    markdownContent,
    onDownload,
    promptHistory.length,
    sources.length,
  ]);

  const scrollToHeading = useCallback((id: string) => {
    const target = contentScrollRef.current?.querySelector<HTMLElement>(`[id="${id}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileDrawer(null);
  }, []);

  const selectCitation = useCallback((citationNumber: number) => {
    setHighlightedCitationNumber(citationNumber);
    setSourcesOpen(true);
    setMobileDrawer("sources");
  }, []);

  const toggleFullscreen = useCallback(() => {
    scrollTopBeforeFullscreen.current = contentScrollRef.current?.scrollTop ?? 0;
    setIsFullscreen((value) => !value);
  }, []);

  const handleDownload = useCallback(() => {
    if (!canDownload) return;
    if (onDownload) {
      onDownload();
      return;
    }

    if (artifactType === "markdown") {
      downloadTextFile(
        getDownloadFilename(title, "md"),
        markdownContent ?? "",
        "text/markdown;charset=utf-8",
      );
      return;
    }

    if (artifactType === "prompt-history") {
      downloadTextFile(
        getDownloadFilename(title, "prompt-history.json"),
        JSON.stringify(promptHistory, null, 2),
        "application/json;charset=utf-8",
      );
      return;
    }

    if (artifactType === "citations") {
      downloadTextFile(
        getDownloadFilename(title, "citations.json"),
        JSON.stringify(sources, null, 2),
        "application/json;charset=utf-8",
      );
      return;
    }

    if (file) {
      downloadFileObject(file);
      return;
    }

    if (fileUrl) {
      triggerDownload(fileUrl, getDownloadFilename(title, artifactType));
    }
  }, [
    artifactType,
    canDownload,
    file,
    fileUrl,
    markdownContent,
    onDownload,
    promptHistory,
    sources,
    title,
  ]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (mobileDrawer) {
        setMobileDrawer(null);
        return;
      }

      if (isFullscreen) setIsFullscreen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen, mobileDrawer]);

  useLayoutEffect(() => {
    window.requestAnimationFrame(() => {
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTop = scrollTopBeforeFullscreen.current;
      }
    });
  }, [isFullscreen]);

  const mainContent = (() => {
    if (artifactType === "pdf") {
      return <PdfArtifactViewer file={file} fileUrl={fileUrl} />;
    }

    if (artifactType === "docx") {
      return <DocxArtifactViewer file={file} fileUrl={fileUrl} />;
    }

    if (artifactType === "prompt-history") {
      return <PromptHistoryViewer items={promptHistory} />;
    }

    if (artifactType === "citations") {
      return (
        <div className="mx-auto h-full w-full max-w-5xl p-4 sm:p-6">
          <div className="h-full overflow-hidden rounded-xl border border-zinc-800">
            <CitationSourcePanel
              highlightedCitationNumber={highlightedCitationNumber}
              onCitationSelect={selectCitation}
              progress={progress}
              promptHistory={promptHistory}
              sources={sources}
            />
          </div>
        </div>
      );
    }

    return (
      <MarkdownArticleViewer
        highlightedCitationNumber={highlightedCitationNumber}
        markdownContent={markdownContent}
        onCitationSelect={selectCitation}
        onTocItemsChange={setTocItems}
      />
    );
  })();

  return (
    <section
      className={cn(
        "isolate flex min-h-[620px] flex-col overflow-hidden bg-zinc-950 text-zinc-100 shadow-2xl shadow-black/30",
        isFullscreen
          ? "fixed inset-0 z-[9997] h-screen w-screen rounded-none"
          : "relative rounded-2xl border border-zinc-800",
        className,
      )}
    >
      <ArtifactToolbar
        canDownload={canDownload}
        isFullscreen={isFullscreen}
        onClose={onClose}
        onDownload={handleDownload}
        onToggleFullscreen={toggleFullscreen}
        onToggleSources={() => {
          setSourcesOpen((value) => !value);
          setMobileDrawer((value) => (value === "sources" ? null : "sources"));
        }}
        onToggleToc={() => {
          setTocOpen((value) => !value);
          setMobileDrawer((value) => (value === "toc" ? null : "toc"));
        }}
        showSourcesButton={shouldShowSourcesPanel}
        showTocButton={hasToc}
        title={title}
      />

      <ArtifactProgressBar progress={progress} />

      <div
        className={cn(
          "grid min-h-0 flex-1 grid-cols-1",
          hasToc && tocOpen && shouldShowSourcesPanel && sourcesOpen
            ? "xl:grid-cols-[18rem_minmax(0,1fr)_22rem]"
            : "",
          hasToc && tocOpen && (!shouldShowSourcesPanel || !sourcesOpen)
            ? "xl:grid-cols-[18rem_minmax(0,1fr)]"
            : "",
          (!hasToc || !tocOpen) && shouldShowSourcesPanel && sourcesOpen
            ? "xl:grid-cols-[minmax(0,1fr)_22rem]"
            : "",
        )}
      >
        {hasToc && tocOpen && (
          <aside className="hidden min-h-0 border-r border-zinc-800 bg-zinc-950/90 xl:block">
            <TableOfContents items={tocItems} onSelect={scrollToHeading} />
          </aside>
        )}

        <main
          className="min-h-0 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.06),transparent_32rem)]"
          ref={contentScrollRef}
        >
          <div className="min-h-full rounded-none bg-zinc-950/35">{mainContent}</div>
        </main>

        {shouldShowSourcesPanel && sourcesOpen && (
          <div className="hidden min-h-0 xl:block">
            <CitationSourcePanel
              highlightedCitationNumber={highlightedCitationNumber}
              onCitationSelect={selectCitation}
              progress={progress}
              promptHistory={promptHistory}
              sources={sources}
            />
          </div>
        )}
      </div>

      {mobileDrawer === "toc" && hasToc && (
        <Drawer title="Table of contents" onClose={() => setMobileDrawer(null)}>
          <TableOfContents items={tocItems} onSelect={scrollToHeading} />
        </Drawer>
      )}

      {mobileDrawer === "sources" && shouldShowSourcesPanel && (
        <Drawer title="Sources" onClose={() => setMobileDrawer(null)}>
          <div className="h-[70vh]">
            <CitationSourcePanel
              highlightedCitationNumber={highlightedCitationNumber}
              onCitationSelect={selectCitation}
              progress={progress}
              promptHistory={promptHistory}
              sources={sources}
            />
          </div>
        </Drawer>
      )}
    </section>
  );
}
