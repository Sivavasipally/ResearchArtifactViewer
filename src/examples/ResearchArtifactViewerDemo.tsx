import {
  ResearchArtifactViewer,
  type CitationSource,
  type PromptHistoryItem,
} from "../components/ResearchArtifactViewer";

const sources: CitationSource[] = [
  {
    id: "source-1",
    citationNumber: 1,
    title: "OpenAI documentation: prompt engineering and tool calling",
    domain: "platform.openai.com",
    url: "https://platform.openai.com/docs",
    excerpt:
      "Current guidance emphasizes clear task framing, explicit tool boundaries, and structured outputs for reliable agent workflows.",
    retrievedAt: "2026-06-13T09:15:00.000Z",
    confidence: 0.94,
    faviconUrl: "https://www.google.com/s2/favicons?domain=platform.openai.com&sz=32",
  },
  {
    id: "source-2",
    citationNumber: 2,
    title: "Microsoft Word JavaScript API concepts",
    domain: "learn.microsoft.com",
    url: "https://learn.microsoft.com/office/dev/add-ins/word/word-add-ins-programming-overview",
    excerpt:
      "Word add-ins expose document structure, ranges, content controls, and tracked changes through a JavaScript API surface.",
    retrievedAt: "2026-06-13T09:24:00.000Z",
    confidence: 0.9,
    faviconUrl: "https://www.google.com/s2/favicons?domain=learn.microsoft.com&sz=32",
  },
  {
    id: "source-3",
    citationNumber: 3,
    title: "React accessibility patterns for composite layouts",
    domain: "react.dev",
    url: "https://react.dev/learn/accessibility",
    excerpt:
      "Accessible interactive regions should remain keyboard reachable, announce state changes, and preserve meaningful document structure.",
    retrievedAt: "2026-06-13T09:42:00.000Z",
    confidence: 0.88,
    faviconUrl: "https://www.google.com/s2/favicons?domain=react.dev&sz=32",
  },
  {
    id: "source-4",
    citationNumber: 4,
    title: "Tailwind CSS responsive design",
    domain: "tailwindcss.com",
    url: "https://tailwindcss.com/docs/responsive-design",
    excerpt:
      "Responsive variants let component layouts adapt from single-column mobile flows to dense desktop panels.",
    retrievedAt: "2026-06-13T10:03:00.000Z",
    confidence: 0.86,
    faviconUrl: "https://www.google.com/s2/favicons?domain=tailwindcss.com&sz=32",
  },
];

const promptHistory: PromptHistoryItem[] = [
  {
    id: "prompt-1",
    role: "system",
    content:
      "You are a senior research assistant. Build an evidence-backed blueprint for a Word document update workflow.",
    timestamp: "2026-06-13T08:59:00.000Z",
    model: "gpt-5",
    tokenCount: 182,
  },
  {
    id: "prompt-2",
    role: "user",
    content:
      "Map the agentic patterns needed to inspect, plan, edit, validate, and summarize Word document changes.",
    timestamp: "2026-06-13T09:01:00.000Z",
    tokenCount: 64,
  },
  {
    id: "prompt-3",
    role: "assistant",
    content:
      "I will structure the artifact around retrieval, document modeling, edit orchestration, verification, and human review.",
    timestamp: "2026-06-13T09:04:00.000Z",
    model: "gpt-5",
    tokenCount: 96,
  },
  {
    id: "prompt-4",
    role: "tool",
    content:
      "Searched official documentation and extracted references for Word APIs, React accessibility, and responsive reader layouts.",
    timestamp: "2026-06-13T09:17:00.000Z",
    tokenCount: 248,
  },
];

const markdownContent = `# Agentic Pattern Expansion Blueprint for the Word Document Update

The update workflow should behave like a research-grade editing system: it reads the source document, identifies intent, proposes edits, applies changes, validates the result, and leaves a compact audit trail. The strongest pattern is a planner-executor loop supported by explicit evidence capture [1].

## Executive Summary

The blueprint separates the document update into five coordinated phases. Each phase has a narrow responsibility, observable status, and recoverable output. This keeps the agent useful for long document sessions where users need confidence, not just speed [2].

| Phase | Responsibility | Output |
| --- | --- | --- |
| Intake | Parse the task and document scope | Change brief |
| Grounding | Retrieve relevant document ranges and sources | Evidence bundle |
| Planning | Convert intent into ordered edits | Edit plan |
| Execution | Apply edits with checkpoints | Updated draft |
| Verification | Compare before and after states | Review summary |

## Architecture Principles

### Preserve Document Intent

The agent should keep the user's requested outcome visible through every step. When ambiguity appears, it should prefer small reversible edits and expose assumptions in the review summary [1].

### Use Structured Edit Plans

Structured plans prevent the system from mixing retrieval, reasoning, and mutation in one opaque step. A production implementation should represent each planned change with a target range, operation type, rationale, and validation rule [2].

### Keep the Interface Inspectable

The reader should make evidence easy to inspect. Inline citation badges connect claims to the right source card, while the right panel gives users domain, excerpt, retrieval date, and confidence metadata [3].

## Interaction Model

Desktop users benefit from the three-panel research layout: table of contents on the left, article in the center, and citations on the right. On smaller screens, the same information should collapse into drawers without losing keyboard access [4].

> The core experience should feel like a focused research desk: quiet, dense, readable, and fast to scan.

## Validation Checklist

- Confirm every material claim has a citation.
- Confirm generated edits can be traced back to the original user request.
- Confirm status copy distinguishes searching, generation, completion, and error states.
- Confirm fullscreen mode preserves scroll position and exits with Escape.

## Implementation Notes

\`\`\`ts
type EditPlanStep = {
  id: string;
  targetRange: string;
  operation: "insert" | "replace" | "delete";
  rationale: string;
  validationRule: string;
};
\`\`\`

The component receives all data through props, so it can be used with local files, server-rendered data, browser uploads, or static research artifacts without adding backend coupling [1].
`;

export function ResearchArtifactViewerDemo() {
  return (
    <main className="min-h-screen bg-black p-4 text-zinc-100 sm:p-6 lg:p-10">
      <ResearchArtifactViewer
        artifactType="markdown"
        markdownContent={markdownContent}
        progress={{
          status: "completed",
          message: "Research completed in 21m · 16 citations · 490 searches",
          percent: 100,
          elapsedLabel: "21m",
          citationCount: 16,
          searchCount: 490,
        }}
        promptHistory={promptHistory}
        showSourcesPanel
        showTableOfContents
        sources={sources}
        title="Agentic Pattern Expansion Blueprint for the Word Document Update"
      />
    </main>
  );
}
