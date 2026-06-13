import type { ReactElement, ReactNode } from "react";

import type { ArtifactProgress, CitationSource, TocItem } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[`*_~:[\](){}<>]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createHeadingSlugger() {
  const counts = new Map<string, number>();

  return (value: string) => {
    const base = slugify(value) || "section";
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

export function createHeadingId(value: string, lineNumber?: number) {
  const base = slugify(value) || "section";
  return typeof lineNumber === "number" && Number.isFinite(lineNumber)
    ? `${base}-${lineNumber}`
    : base;
}

export function extractTableOfContents(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  let insideFence = false;

  markdown.split(/\r?\n/).forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      insideFence = !insideFence;
      return;
    }

    if (insideFence) return;

    const match = /^(#{1,4})\s+(.+)$/.exec(line);
    if (!match) return;

    const text = stripMarkdown(match[2]);
    const lineNumber = index + 1;

    items.push({
      id: createHeadingId(text, lineNumber),
      text,
      level: match[1].length,
    });
  });

  return items;
}

export function stripMarkdown(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~>#]/g, "")
    .trim();
}

export function textFromReactChildren(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(textFromReactChildren).join("");
  }

  if (children && typeof children === "object" && "props" in children) {
    const element = children as ReactElement<{ children?: ReactNode }>;
    return textFromReactChildren(element.props.children);
  }

  return "";
}

export function formatProgressMessage(progress?: ArtifactProgress) {
  if (!progress) return "Ready to view artifact";
  if (progress.message) return progress.message;

  const parts: string[] = [];

  if (progress.status === "completed") {
    parts.push("Research completed");
  } else if (progress.status === "searching") {
    parts.push("Searching sources");
  } else if (progress.status === "generating") {
    parts.push("Generating article");
  } else if (progress.status === "loading") {
    parts.push("Loading artifact");
  } else if (progress.status === "error") {
    parts.push("Artifact failed");
  } else {
    parts.push("Ready");
  }

  if (progress.elapsedLabel) parts.push(`in ${progress.elapsedLabel}`);
  const summary = [
    typeof progress.citationCount === "number"
      ? `${progress.citationCount} citations`
      : undefined,
    typeof progress.searchCount === "number"
      ? `${progress.searchCount} searches`
      : undefined,
  ].filter(Boolean);

  return summary.length ? `${parts.join(" ")} · ${summary.join(" · ")}` : parts.join(" ");
}

export function groupSourcesByDomain(sources: CitationSource[]) {
  return sources.reduce<Record<string, CitationSource[]>>((groups, source) => {
    const domain = source.domain || source.url ? getDomainLabel(source) : "Other sources";
    groups[domain] = groups[domain] ? [...groups[domain], source] : [source];
    return groups;
  }, {});
}

export function getDomainLabel(source: CitationSource) {
  if (source.domain) return source.domain;
  if (!source.url) return "Unknown domain";

  try {
    return new URL(source.url).hostname.replace(/^www\./, "");
  } catch {
    return "Unknown domain";
  }
}

export function formatDate(value?: string) {
  if (!value) return undefined;

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

export function downloadFileObject(file: File) {
  const url = URL.createObjectURL(file);
  triggerDownload(url, file.name);
  URL.revokeObjectURL(url);
}

export function triggerDownload(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function getDownloadFilename(title: string, extension: string) {
  const safeTitle = slugify(title).slice(0, 80) || "research-artifact";
  return `${safeTitle}.${extension}`;
}
