import React, { useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { TocItem } from "./types";
import {
  cn,
  createHeadingId,
  extractTableOfContents,
  textFromReactChildren,
} from "./utils";

interface MarkdownArticleViewerProps {
  markdownContent?: string;
  highlightedCitationNumber?: number | null;
  onCitationSelect?: (citationNumber: number) => void;
  onTocItemsChange?: (items: TocItem[]) => void;
}

function CitationButton({
  citationNumber,
  highlighted,
  onCitationSelect,
}: {
  citationNumber: number;
  highlighted: boolean;
  onCitationSelect?: (citationNumber: number) => void;
}) {
  return (
    <button
      aria-label={`View citation ${citationNumber}`}
      className={cn(
        "mx-0.5 inline-flex translate-y-[-1px] items-center rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none transition focus:outline-none focus:ring-2 focus:ring-cyan-300/70",
        highlighted
          ? "bg-cyan-200 text-zinc-950"
          : "bg-cyan-400/15 text-cyan-200 hover:bg-cyan-300 hover:text-zinc-950",
      )}
      onClick={() => onCitationSelect?.(citationNumber)}
      type="button"
    >
      [{citationNumber}]
    </button>
  );
}

function renderTextWithCitations(
  value: string,
  onCitationSelect?: (citationNumber: number) => void,
  highlightedCitationNumber?: number | null,
) {
  const parts = value.split(/(\[\d+\])/g);

  return parts
    .map((part, index) => {
      const citationMatch = /^\[(\d+)\]$/.exec(part);
      if (!citationMatch) return part;

      const citationNumber = Number(citationMatch[1]);

      return (
        <CitationButton
          citationNumber={citationNumber}
          highlighted={citationNumber === highlightedCitationNumber}
          key={`${citationNumber}-${index}`}
          onCitationSelect={onCitationSelect}
        />
      );
    })
    .filter((part) => part !== "");
}

function renderCitationChildren(
  children: React.ReactNode,
  onCitationSelect?: (citationNumber: number) => void,
  highlightedCitationNumber?: number | null,
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return renderTextWithCitations(child, onCitationSelect, highlightedCitationNumber);
    }

    if (typeof child === "number") return child;

    if (React.isValidElement(child)) {
      if (child.type === "code") return child;

      const element = child as React.ReactElement<{ children?: React.ReactNode }>;
      if (!element.props.children) return child;

      return React.cloneElement(element, {
        children: renderCitationChildren(
          element.props.children,
          onCitationSelect,
          highlightedCitationNumber,
        ),
      });
    }

    return child;
  });
}

export function MarkdownArticleViewer({
  markdownContent = "",
  highlightedCitationNumber,
  onCitationSelect,
  onTocItemsChange,
}: MarkdownArticleViewerProps) {
  const tocItems = useMemo(
    () => extractTableOfContents(markdownContent),
    [markdownContent],
  );

  useEffect(() => {
    onTocItemsChange?.(tocItems);
  }, [onTocItemsChange, tocItems]);

  if (!markdownContent.trim()) {
    return (
      <div className="mx-auto flex min-h-[420px] max-w-3xl items-center justify-center px-6 py-16">
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
          <h3 className="text-lg font-semibold text-zinc-100">No article content</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Pass markdownContent to render a research article.
          </p>
        </div>
      </div>
    );
  }

  function Heading({
    level,
    children,
    node,
  }: {
    level: 1 | 2 | 3 | 4;
    children: React.ReactNode;
    node?: { position?: { start?: { line?: number } } };
  }) {
    const text = textFromReactChildren(children);
    const id = createHeadingId(text, node?.position?.start?.line);
    const className = cn(
      "scroll-mt-28 font-bold tracking-normal text-zinc-50",
      level === 1 && "mb-5 mt-0 text-3xl leading-tight sm:text-4xl",
      level === 2 && "mb-4 mt-12 border-t border-zinc-800 pt-8 text-2xl",
      level === 3 && "mb-3 mt-8 text-xl",
      level === 4 && "mb-2 mt-6 text-lg",
    );

    if (level === 1) {
      return (
        <h1 className={className} id={id}>
          {children}
        </h1>
      );
    }

    if (level === 2) {
      return (
        <h2 className={className} id={id}>
          {children}
        </h2>
      );
    }

    if (level === 3) {
      return (
        <h3 className={className} id={id}>
          {children}
        </h3>
      );
    }

    return (
      <h4 className={className} id={id}>
        {children}
      </h4>
    );
  }

  const citationChildren = (children: React.ReactNode) =>
    renderCitationChildren(children, onCitationSelect, highlightedCitationNumber);

  return (
    <article className="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:px-10">
      <ReactMarkdown
        components={{
          h1: ({ children, node }) => (
            <Heading level={1} node={node}>
              {children}
            </Heading>
          ),
          h2: ({ children, node }) => (
            <Heading level={2} node={node}>
              {children}
            </Heading>
          ),
          h3: ({ children, node }) => (
            <Heading level={3} node={node}>
              {children}
            </Heading>
          ),
          h4: ({ children, node }) => (
            <Heading level={4} node={node}>
              {children}
            </Heading>
          ),
          p: ({ children }) => (
            <p className="my-5 text-base leading-8 text-zinc-200">
              {citationChildren(children)}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-5 list-disc space-y-2 pl-6 text-zinc-200">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-5 list-decimal space-y-2 pl-6 text-zinc-200">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-1 leading-8">{citationChildren(children)}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-4 border-cyan-300/60 bg-cyan-300/10 px-5 py-3 text-zinc-200">
              {citationChildren(children)}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              className="font-medium text-cyan-200 underline decoration-cyan-300/40 underline-offset-4 hover:text-cyan-100"
              href={href}
              rel="noopener noreferrer"
              target={href?.startsWith("#") ? undefined : "_blank"}
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="my-7 overflow-x-auto rounded-lg border border-zinc-800">
              <table className="min-w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-zinc-900">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-zinc-800 px-4 py-3 text-left font-semibold text-zinc-100">
              {citationChildren(children)}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-zinc-900 px-4 py-3 align-top text-zinc-300">
              {citationChildren(children)}
            </td>
          ),
          code: ({ inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="rounded bg-zinc-800 px-1.5 py-0.5 text-sm text-cyan-100"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <pre className="my-6 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm leading-7 text-zinc-100">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          hr: () => <hr className="my-10 border-zinc-800" />,
        }}
        remarkPlugins={[remarkGfm]}
      >
        {markdownContent}
      </ReactMarkdown>
    </article>
  );
}
