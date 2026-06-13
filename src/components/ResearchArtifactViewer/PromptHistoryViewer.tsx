import { useState } from "react";
import {
  Bot,
  Check,
  Clipboard,
  Shield,
  TerminalSquare,
  UserRound,
} from "lucide-react";

import type { PromptHistoryItem } from "./types";
import { cn, formatDate } from "./utils";

interface PromptHistoryViewerProps {
  items?: PromptHistoryItem[];
}

const roleStyles = {
  user: {
    label: "User",
    icon: UserRound,
    bubble: "border-cyan-400/20 bg-cyan-400/10",
    iconClass: "bg-cyan-300 text-zinc-950",
  },
  assistant: {
    label: "Assistant",
    icon: Bot,
    bubble: "border-emerald-400/20 bg-emerald-400/10",
    iconClass: "bg-emerald-300 text-zinc-950",
  },
  system: {
    label: "System",
    icon: Shield,
    bubble: "border-violet-400/20 bg-violet-400/10",
    iconClass: "bg-violet-300 text-zinc-950",
  },
  tool: {
    label: "Tool",
    icon: TerminalSquare,
    bubble: "border-amber-400/20 bg-amber-400/10",
    iconClass: "bg-amber-300 text-zinc-950",
  },
} as const;

export function PromptHistoryViewer({ items = [] }: PromptHistoryViewerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyPrompt(item: PromptHistoryItem) {
    await navigator.clipboard.writeText(item.content);
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(null), 1400);
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[420px] max-w-3xl items-center justify-center px-6 py-16">
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
          <TerminalSquare className="mx-auto h-8 w-8 text-zinc-500" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-100">
            No prompt history
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            Pass promptHistory items to render the timeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <ol className="relative space-y-5 before:absolute before:left-5 before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-zinc-800">
        {items.map((item) => {
          const style = roleStyles[item.role];
          const Icon = style.icon;
          const copied = copiedId === item.id;

          return (
            <li className="relative flex gap-4" key={item.id}>
              <div
                className={cn(
                  "z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  style.iconClass,
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <article
                className={cn(
                  "min-w-0 flex-1 rounded-xl border p-4 shadow-xl shadow-black/20",
                  style.bubble,
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-100">
                      {style.label}
                    </span>
                    {item.model && (
                      <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        {item.model}
                      </span>
                    )}
                    {item.tokenCount && (
                      <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                        {item.tokenCount.toLocaleString()} tokens
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.timestamp && (
                      <time
                        className="text-xs text-zinc-500"
                        dateTime={item.timestamp}
                      >
                        {formatDate(item.timestamp)}
                      </time>
                    )}
                    <button
                      aria-label={`Copy ${style.label.toLowerCase()} prompt`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/70"
                      onClick={() => void copyPrompt(item)}
                      type="button"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <pre className="mt-4 whitespace-pre-wrap break-words font-sans text-sm leading-7 text-zinc-200">
                  {item.content}
                </pre>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
