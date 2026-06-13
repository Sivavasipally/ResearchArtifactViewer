export type ArtifactType =
  | "markdown"
  | "pdf"
  | "docx"
  | "prompt-history"
  | "citations";

export type ArtifactStatus =
  | "idle"
  | "loading"
  | "searching"
  | "generating"
  | "completed"
  | "error";

export interface CitationSource {
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

export interface PromptHistoryItem {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp?: string;
  model?: string;
  tokenCount?: number;
}

export interface ArtifactProgress {
  status: ArtifactStatus;
  message?: string;
  percent?: number;
  elapsedLabel?: string;
  citationCount?: number;
  searchCount?: number;
}

export interface ResearchArtifactViewerProps {
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

export interface TocItem {
  id: string;
  text: string;
  level: number;
}
