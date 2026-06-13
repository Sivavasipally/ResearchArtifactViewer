# ResearchArtifactViewer

Production-ready React 18, TypeScript, and Tailwind CSS component for viewing research artifacts in a dark, three-panel research-reader layout.

The component supports Markdown articles, PDFs, DOCX previews, prompt history timelines, citation/source browsing, download actions, fullscreen mode, and progress/status display. It has no backend dependency. All content is passed through props.

## Quick Start

This repository is now a runnable Vite React app using the `ResearchArtifactViewer` component as the first screen.

```bash
npm install
npm run dev
```

Open:

```txt
http://127.0.0.1:5173/
```

Build for production:

```bash
npm run build
```

## Folder Structure

```txt
index.html
package.json
postcss.config.js
tailwind.config.js
tsconfig.json
vite.config.ts
src/
  App.tsx
  index.css
  main.tsx
  components/
    ResearchArtifactViewer/
      ArtifactProgressBar.tsx
      ArtifactToolbar.tsx
      CitationSourcePanel.tsx
      DocxArtifactViewer.tsx
      MarkdownArticleViewer.tsx
      PdfArtifactViewer.tsx
      PromptHistoryViewer.tsx
      ResearchArtifactViewer.tsx
      index.ts
      types.ts
      utils.ts
  examples/
    ResearchArtifactViewerDemo.tsx
```

## Features

- Markdown article viewer with GitHub-flavored Markdown.
- Auto-generated table of contents from Markdown headings.
- Clickable inline citation badges such as `[1]`, `[2]`, `[3]`.
- Right-side sources, citations, and activity panel.
- PDF preview with page navigation, zoom, rotation, loading, and error states.
- DOCX preview with Mammoth conversion and sanitized HTML output.
- Prompt history viewer with user, assistant, system, and tool roles.
- Download support for Markdown, JSON, PDF, DOCX, or custom `onDownload`.
- Fullscreen mode with Escape key exit.
- Progress/status bar for idle, loading, searching, generating, completed, and error states.
- Responsive layout:
  - Desktop: left TOC, center reader, right sources.
  - Tablet and mobile: single-column reader with drawer panels.
- Accessible buttons with ARIA labels and keyboard-friendly controls.

## Install Dependencies

Dependencies are already declared in `package.json`. For a fresh checkout, run:

```bash
npm install
```

The equivalent manual install commands are:

```bash
npm install react@18 react-dom@18 lucide-react react-markdown remark-gfm pdfjs-dist mammoth dompurify
npm install -D @vitejs/plugin-react vite typescript @types/react @types/react-dom tailwindcss postcss autoprefixer
```

If your app does not already have Tailwind CSS installed:

```bash
npx tailwindcss init -p
```

## Tailwind Setup

Make sure your `tailwind.config.js` scans the component and example files:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Add Tailwind directives to your global CSS file, usually `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

The component uses Tailwind classes directly. No separate CSS file is required.

## How To Run This App

From the project root:

```bash
npm install
npm run dev
```

Then open the Vite dev server URL:

```txt
http://127.0.0.1:5173/
```

The app entry point is `src/App.tsx`:

```tsx
import { ResearchArtifactViewerDemo } from "./examples/ResearchArtifactViewerDemo";

export default function App() {
  return <ResearchArtifactViewerDemo />;
}
```

The demo page is `src/examples/ResearchArtifactViewerDemo.tsx`.

## How To Use In Another App

Copy the reusable component into any React 18 + TypeScript + Tailwind app.

### Option 1: Use An Existing React 18 App

1. Copy the `src/components/ResearchArtifactViewer` folder into your app.
2. Copy `src/examples/ResearchArtifactViewerDemo.tsx` if you want the sample page.
3. Install dependencies:

```bash
npm install lucide-react react-markdown remark-gfm pdfjs-dist mammoth dompurify
```

4. Render the demo:

```tsx
import { ResearchArtifactViewerDemo } from "./examples/ResearchArtifactViewerDemo";

export default function App() {
  return <ResearchArtifactViewerDemo />;
}
```

5. Start your app:

```bash
npm run dev
```

### Option 2: Create A Fresh Vite App

```bash
npm create vite@latest research-artifact-viewer-demo -- --template react-ts
cd research-artifact-viewer-demo
npm install
npm install lucide-react react-markdown remark-gfm pdfjs-dist mammoth dompurify
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Then copy this repository's `src/components/ResearchArtifactViewer` and `src/examples/ResearchArtifactViewerDemo.tsx` into the new Vite app.

Update `src/App.tsx`:

```tsx
import { ResearchArtifactViewerDemo } from "./examples/ResearchArtifactViewerDemo";

export default function App() {
  return <ResearchArtifactViewerDemo />;
}
```

Run:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Basic Usage

```tsx
import {
  ResearchArtifactViewer,
  type CitationSource,
} from "./components/ResearchArtifactViewer";

const sources: CitationSource[] = [
  {
    id: "source-1",
    citationNumber: 1,
    title: "OpenAI documentation",
    domain: "platform.openai.com",
    url: "https://platform.openai.com/docs",
    excerpt: "Official documentation for building with OpenAI APIs.",
    retrievedAt: "2026-06-13T09:15:00.000Z",
    confidence: 0.94,
  },
];

const markdownContent = `
# Research Summary

This is a sourced research claim [1].

## Findings

- Markdown is rendered with tables, lists, links, blockquotes, and code.
- Inline citation markers are clickable.
`;

export function Example() {
  return (
    <main className="min-h-screen bg-black p-6">
      <ResearchArtifactViewer
        title="Research Summary"
        artifactType="markdown"
        markdownContent={markdownContent}
        sources={sources}
        progress={{
          status: "completed",
          message: "Research completed in 21m - 16 citations - 490 searches",
          percent: 100,
          elapsedLabel: "21m",
          citationCount: 16,
          searchCount: 490,
        }}
      />
    </main>
  );
}
```

## Component API

```ts
type ArtifactType =
  | "markdown"
  | "pdf"
  | "docx"
  | "prompt-history"
  | "citations";

type ArtifactStatus =
  | "idle"
  | "loading"
  | "searching"
  | "generating"
  | "completed"
  | "error";

interface CitationSource {
  id: string;
  citationNumber: number;
  title: string;
  domain?: string;
  url?: string;
  excerpt?: string;
  retrievedAt?: string;
  confidence?: number;
  faviconUrl?: string;
}

interface PromptHistoryItem {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp?: string;
  model?: string;
  tokenCount?: number;
}

interface ArtifactProgress {
  status: ArtifactStatus;
  message?: string;
  percent?: number;
  elapsedLabel?: string;
  citationCount?: number;
  searchCount?: number;
}

interface ResearchArtifactViewerProps {
  title: string;
  artifactType: ArtifactType;
  markdownContent?: string;
  fileUrl?: string;
  file?: File;
  sources?: CitationSource[];
  promptHistory?: PromptHistoryItem[];
  progress?: ArtifactProgress;
  defaultFullscreen?: boolean;
  showTableOfContents?: boolean;
  showSourcesPanel?: boolean;
  downloadable?: boolean;
  onDownload?: () => void;
  onClose?: () => void;
  className?: string;
}
```

## Artifact Type Examples

### Markdown Article

```tsx
<ResearchArtifactViewer
  title="Agentic Pattern Expansion Blueprint"
  artifactType="markdown"
  markdownContent={markdownContent}
  sources={sources}
  showTableOfContents
  showSourcesPanel
/>
```

Markdown headings create the left table of contents. Text citations like `[1]` become clickable badges and highlight the matching source in the right panel.

### PDF

```tsx
<ResearchArtifactViewer
  title="Research Report PDF"
  artifactType="pdf"
  fileUrl="/files/report.pdf"
  sources={sources}
/>
```

You can also pass a browser `File` object:

```tsx
<ResearchArtifactViewer
  title={file.name}
  artifactType="pdf"
  file={file}
/>
```

The PDF viewer uses `pdfjs-dist`, renders into a canvas, and supports page navigation, zoom, rotation, loading, and error states.

### DOCX

```tsx
<ResearchArtifactViewer
  title="Word Document Preview"
  artifactType="docx"
  fileUrl="/files/document.docx"
/>
```

You can also pass a browser `File` object:

```tsx
<ResearchArtifactViewer
  title={file.name}
  artifactType="docx"
  file={file}
/>
```

The DOCX viewer uses `mammoth` to convert DOCX content to HTML and `dompurify` to sanitize the rendered preview.

### Prompt History

```tsx
<ResearchArtifactViewer
  title="Prompt History"
  artifactType="prompt-history"
  promptHistory={[
    {
      id: "prompt-1",
      role: "user",
      content: "Create a sourced research plan.",
      timestamp: "2026-06-13T09:01:00.000Z",
      model: "gpt-5",
      tokenCount: 64,
    },
  ]}
/>
```

Prompt history renders as a timeline with role icons, timestamps, model labels, token counts, and copy buttons.

### Citations Only

```tsx
<ResearchArtifactViewer
  title="Citation Library"
  artifactType="citations"
  sources={sources}
/>
```

This mode makes the source browser the primary content area.

## Download Behavior

By default, the component downloads the active artifact when possible:

- Markdown: `.md`
- Prompt history: `.json`
- Citations: `.json`
- PDF or DOCX with `file`: original uploaded file
- PDF or DOCX with `fileUrl`: direct URL download

Override this behavior with `onDownload`:

```tsx
<ResearchArtifactViewer
  title="Custom Download"
  artifactType="markdown"
  markdownContent={markdownContent}
  onDownload={() => {
    console.log("Run custom download logic");
  }}
/>
```

Disable downloads:

```tsx
<ResearchArtifactViewer
  title="Read Only Artifact"
  artifactType="markdown"
  markdownContent={markdownContent}
  downloadable={false}
/>
```

## Progress And Status Display

```tsx
<ResearchArtifactViewer
  title="Generating Report"
  artifactType="markdown"
  markdownContent=""
  progress={{
    status: "generating",
    message: "Generating article from retrieved sources",
    percent: 68,
    elapsedLabel: "14m",
    citationCount: 12,
    searchCount: 340,
  }}
/>
```

Supported statuses:

- `idle`
- `loading`
- `searching`
- `generating`
- `completed`
- `error`

When `percent` is provided, the progress bar shows a determinate value. For active statuses without `percent`, it shows an indeterminate visual state.

## Layout Explanation

`ResearchArtifactViewer.tsx` is the orchestration layer. It owns fullscreen state, drawer state, citation highlighting, table-of-contents state, download behavior, and Escape key handling.

`MarkdownArticleViewer.tsx` renders Markdown with `react-markdown` and `remark-gfm`. It extracts headings for the table of contents and converts citation text markers into accessible buttons.

`CitationSourcePanel.tsx` renders the right evidence panel. It provides Sources, Citations, and Activity tabs, source filtering, grouping by domain, source cards, and citation highlighting.

`PdfArtifactViewer.tsx` uses `pdfjs-dist` to load and render a PDF into a canvas. It supports page navigation, zoom, and rotation.

`DocxArtifactViewer.tsx` uses `mammoth` to convert Word documents into HTML and `dompurify` to sanitize the output before rendering.

`PromptHistoryViewer.tsx` renders prompt history as a chat-like timeline with role-aware visual treatment and copy actions.

`ArtifactToolbar.tsx` contains the top action buttons for panel toggles, download, fullscreen, and close.

`ArtifactProgressBar.tsx` renders the status message, status icon, and progress bar.

`types.ts` contains the public TypeScript interfaces.

`utils.ts` contains shared helpers for class composition, Markdown heading extraction, file downloads, source grouping, and progress text.

## PDF Integration Notes

- `PdfArtifactViewer` configures the PDF.js worker with:

```ts
GlobalWorkerOptions.workerSrc =
  GlobalWorkerOptions.workerSrc ||
  new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
```

- This works well in Vite and modern bundlers that support `import.meta.url`.
- If your bundler handles PDF workers differently, replace that line with your app's worker path.
- Remote PDF URLs must allow browser access through CORS.
- For private PDFs, pass a browser `File` object instead of a remote URL.

## DOCX Integration Notes

- DOCX preview is client-side only.
- Remote DOCX URLs must allow CORS.
- Mammoth focuses on semantic document conversion. It preserves headings, paragraphs, tables, lists, and links where possible, but it does not reproduce every Word layout detail.
- If preview fails, the component shows an error state and the user can still use the download action.

## Accessibility Notes

- Icon buttons include `aria-label`.
- Progress updates use `aria-live`.
- Progress bars use `role="progressbar"`.
- Escape closes fullscreen and mobile drawers.
- Source cards and citation badges are keyboard reachable.
- Links open with `rel="noopener noreferrer"` when targeting a new tab.

## Styling Notes

The visual design is intentionally dark and research-focused:

- Near-black shell with zinc borders.
- Rounded artifact card.
- Centered readable article width.
- Left table of contents for scanning.
- Right evidence panel for citations and activity.
- Cyan accents for active research affordances.
- Responsive drawer behavior on smaller screens.

The component does not require a design system. You can override outer spacing or sizing with the `className` prop:

```tsx
<ResearchArtifactViewer
  className="h-[calc(100vh-2rem)]"
  title="Research Artifact"
  artifactType="markdown"
  markdownContent={markdownContent}
/>
```

## Extending The Component

Useful future extensions:

- Add source annotations inside PDF pages.
- Add active-heading highlighting in the table of contents.
- Add virtualized rendering for very large prompt histories.
- Add export to HTML or PDF for Markdown artifacts.
- Add source credibility scoring rules.
- Add a controlled fullscreen prop for parent-managed state.
- Add theming tokens if integrating into a larger design system.

## Verification

The current component source was validated with a strict TypeScript compile in a temporary React 18 harness using the required dependencies.
