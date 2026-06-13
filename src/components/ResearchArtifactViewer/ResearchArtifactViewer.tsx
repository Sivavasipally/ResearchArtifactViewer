import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
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

function FullscreenRail({
  label,
  side,
  onOpen,
  scrollProgress,
  onScrollSeek,
}: {
  label: string;
  side: "left" | "right";
  onOpen: () => void;
  scrollProgress?: number;
  onScrollSeek?: (progress: number) => void;
}) {
  const segmentCount = side === "left" ? 28 : 18;
  const normalizedProgress =
    typeof scrollProgress === "number"
      ? Math.min(1, Math.max(0, scrollProgress))
      : undefined;
  const activeIndex =
    typeof normalizedProgress === "number"
      ? Math.round(normalizedProgress * (segmentCount - 1))
      : -1;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onOpen();

    if (!onScrollSeek) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const progress = Math.min(
      1,
      Math.max(0, (event.clientY - rect.top) / Math.max(1, rect.height)),
    );
    onScrollSeek(progress);
  }

  return (
    <button
      aria-label={label}
      className={cn(
        "absolute inset-y-0 z-20 hidden w-12 flex-col items-center justify-center gap-2 text-zinc-500 transition hover:text-zinc-200 focus:outline-none xl:flex",
        side === "left" ? "left-0" : "right-0",
      )}
      onClick={handleClick}
      onFocus={onOpen}
      type="button"
    >
      {Array.from({ length: segmentCount }).map((_, index) => {
        const segmentProgress = index / Math.max(1, segmentCount - 1);
        const isActive = index === activeIndex;
        const isRead =
          typeof normalizedProgress === "number" &&
          segmentProgress <= normalizedProgress;

        return (
          <span
            className={cn(
              "h-0.5 rounded-full bg-current transition-all duration-150",
              side === "right" && "w-4 opacity-60",
              side === "left" && !isActive && !isRead && "w-4 opacity-55",
              side === "left" && isRead && !isActive && "w-5 text-zinc-300 opacity-80",
              side === "left" && isActive && "w-7 text-zinc-50 opacity-100",
            )}
            key={index}
          />
        );
      })}
    </button>
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
  const [tocOpen, setTocOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState<"toc" | "sources" | null>(null);
  const [highlightedCitationNumber, setHighlightedCitationNumber] = useState<number | null>(
    null,
  );
  const [scrollProgress, setScrollProgress] = useState(0);

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

  const scrollToHeading = useCallback(
    (id: string) => {
      const scrollContainer = contentScrollRef.current;
      const target = Array.from(
        scrollContainer?.querySelectorAll<HTMLElement>("[id]") ?? [],
      ).find((element) => element.id === id);

      if (!scrollContainer || !target) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const offsetTop =
        scrollContainer.scrollTop + targetRect.top - containerRect.top - 24;
      const maxScrollTop = Math.max(
        0,
        scrollContainer.scrollHeight - scrollContainer.clientHeight,
      );
      const nextScrollTop = Math.min(maxScrollTop, Math.max(0, offsetTop));

      scrollContainer.scrollTo({
        top: nextScrollTop,
        behavior: "smooth",
      });
      setScrollProgress(maxScrollTop === 0 ? 0 : nextScrollTop / maxScrollTop);
      setMobileDrawer(null);
      setTocOpen(false);
    },
    [],
  );

  const updateScrollProgress = useCallback(() => {
    const scrollContainer = contentScrollRef.current;
    if (!scrollContainer) {
      setScrollProgress(0);
      return;
    }

    const maxScrollTop = Math.max(
      0,
      scrollContainer.scrollHeight - scrollContainer.clientHeight,
    );

    setScrollProgress(
      maxScrollTop === 0 ? 0 : scrollContainer.scrollTop / maxScrollTop,
    );
  }, []);

  const scrollToProgress = useCallback((progress: number) => {
    const scrollContainer = contentScrollRef.current;
    if (!scrollContainer) return;

    const maxScrollTop = Math.max(
      0,
      scrollContainer.scrollHeight - scrollContainer.clientHeight,
    );
    const nextScrollTop = Math.min(1, Math.max(0, progress)) * maxScrollTop;

    scrollContainer.scrollTo({
      top: nextScrollTop,
      behavior: "smooth",
    });
    setScrollProgress(maxScrollTop === 0 ? 0 : nextScrollTop / maxScrollTop);
  }, []);

  const selectCitation = useCallback((citationNumber: number) => {
    setHighlightedCitationNumber(citationNumber);
    setSourcesOpen(true);
    setMobileDrawer("sources");
  }, []);

  const toggleFullscreen = useCallback(() => {
    scrollTopBeforeFullscreen.current = contentScrollRef.current?.scrollTop ?? 0;
    setIsFullscreen((value) => {
      const nextValue = !value;
      if (nextValue) {
        setTocOpen(false);
        setSourcesOpen(false);
      }
      return nextValue;
    });
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
      updateScrollProgress();
    });
  }, [isFullscreen, updateScrollProgress]);

  useLayoutEffect(() => {
    window.requestAnimationFrame(updateScrollProgress);
  }, [artifactType, markdownContent, updateScrollProgress]);

  useEffect(() => {
    const scrollContainer = contentScrollRef.current;
    if (!scrollContainer) return undefined;

    const handleResize = () => updateScrollProgress();
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(handleResize);

    window.addEventListener("resize", handleResize);
    resizeObserver?.observe(scrollContainer);

    if (scrollContainer.firstElementChild) {
      resizeObserver?.observe(scrollContainer.firstElementChild);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver?.disconnect();
    };
  }, [isFullscreen, updateScrollProgress]);

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

  const viewer = (
    <section
      className={cn(
        "isolate flex min-h-[620px] flex-col overflow-hidden text-zinc-100 shadow-2xl shadow-black/30",
        isFullscreen
          ? "fixed inset-0 z-[9997] h-screen w-screen rounded-none bg-[#121212]"
          : "relative rounded-[1.15rem] border border-white/15 bg-[#171717]",
        isFullscreen && className,
      )}
    >
      <ArtifactToolbar
        canDownload={canDownload}
        isFullscreen={isFullscreen}
        onClose={onClose}
        onDownload={handleDownload}
        onToggleFullscreen={toggleFullscreen}
        onToggleSources={() => {
          if (isFullscreen) {
            setSourcesOpen((value) => !value);
          } else {
            setMobileDrawer((value) => (value === "sources" ? null : "sources"));
          }
        }}
        onToggleToc={() => {
          if (isFullscreen) {
            setTocOpen((value) => !value);
          } else {
            setMobileDrawer((value) => (value === "toc" ? null : "toc"));
          }
        }}
        showSourcesButton={shouldShowSourcesPanel}
        showTocButton={hasToc}
        title={title}
        variant={isFullscreen ? "fullscreen" : "card"}
      />

      <div
        className={cn(
          "grid min-h-0 flex-1 grid-cols-1",
          !isFullscreen && hasToc && tocOpen && shouldShowSourcesPanel && sourcesOpen
            ? "xl:grid-cols-[18rem_minmax(0,1fr)_22rem]"
            : "",
          !isFullscreen && hasToc && tocOpen && (!shouldShowSourcesPanel || !sourcesOpen)
            ? "xl:grid-cols-[18rem_minmax(0,1fr)]"
            : "",
          !isFullscreen && (!hasToc || !tocOpen) && shouldShowSourcesPanel && sourcesOpen
            ? "xl:grid-cols-[minmax(0,1fr)_22rem]"
            : "",
        )}
      >
        {!isFullscreen && hasToc && tocOpen && (
          <aside className="hidden min-h-0 border-r border-zinc-800 bg-zinc-950/90 xl:block">
            <TableOfContents items={tocItems} onSelect={scrollToHeading} />
          </aside>
        )}

        <main
          className={cn(
            "min-h-0 overflow-y-auto",
            isFullscreen
              ? "bg-[#121212] pt-12"
              : "bg-[#171717] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.025),transparent_30rem)]",
          )}
          onScroll={updateScrollProgress}
          ref={contentScrollRef}
        >
          <div className={cn("min-h-full", isFullscreen ? "bg-[#121212]" : "bg-[#171717]")}>
            {mainContent}
          </div>
        </main>

        {!isFullscreen && shouldShowSourcesPanel && sourcesOpen && (
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

      {isFullscreen && hasToc && (
        <div className="group/toc absolute bottom-10 left-0 top-20 z-30 hidden w-[22rem] xl:block">
          <FullscreenRail
            label="Show table of contents"
            onOpen={() => setTocOpen(true)}
            onScrollSeek={scrollToProgress}
            scrollProgress={scrollProgress}
            side="left"
          />
          <aside
            className={cn(
              "pointer-events-none absolute bottom-10 left-12 top-8 w-72 overflow-hidden rounded-2xl border border-white/15 bg-[#171717]/95 opacity-0 shadow-2xl shadow-black/50 backdrop-blur transition duration-150 group-hover/toc:pointer-events-auto group-hover/toc:opacity-100 group-focus-within/toc:pointer-events-auto group-focus-within/toc:opacity-100",
              tocOpen && "pointer-events-auto opacity-100",
            )}
            onMouseLeave={() => setTocOpen(false)}
          >
            <TableOfContents items={tocItems} onSelect={scrollToHeading} />
          </aside>
        </div>
      )}

      {isFullscreen && shouldShowSourcesPanel && (
        <div className="group/sources absolute bottom-0 right-0 top-0 z-30 hidden w-[27rem] xl:block">
          <FullscreenRail
            label="Show sources"
            onOpen={() => setSourcesOpen(true)}
            side="right"
          />
          <aside
            className={cn(
              "pointer-events-none absolute bottom-0 right-0 top-0 w-[24rem] translate-x-3 border-l border-white/10 bg-[#171717] opacity-0 shadow-2xl shadow-black/50 transition duration-150 group-hover/sources:pointer-events-auto group-hover/sources:translate-x-0 group-hover/sources:opacity-100 group-focus-within/sources:pointer-events-auto group-focus-within/sources:translate-x-0 group-focus-within/sources:opacity-100",
              sourcesOpen && "pointer-events-auto translate-x-0 opacity-100",
            )}
            onMouseLeave={() => setSourcesOpen(false)}
          >
            <CitationSourcePanel
              highlightedCitationNumber={highlightedCitationNumber}
              onCitationSelect={selectCitation}
              onClose={() => setSourcesOpen(false)}
              progress={progress}
              promptHistory={promptHistory}
              sources={sources}
            />
          </aside>
        </div>
      )}

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

  if (isFullscreen) return viewer;

  return (
    <div className={cn("w-full", className)}>
      <ArtifactProgressBar progress={progress} variant="compact" />
      {viewer}
    </div>
  );
}
