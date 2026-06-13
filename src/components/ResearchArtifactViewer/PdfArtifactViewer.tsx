import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type RenderTask,
} from "pdfjs-dist";

import { cn } from "./utils";

GlobalWorkerOptions.workerSrc =
  GlobalWorkerOptions.workerSrc ||
  new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

interface PdfArtifactViewerProps {
  fileUrl?: string;
  file?: File;
}

function ToolbarButton({
  label,
  children,
  disabled,
  onClick,
}: {
  label: string;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function PdfArtifactViewer({ fileUrl, file }: PdfArtifactViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1.1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileUrl && !file) {
      setPdf(null);
      setPageCount(0);
      setError(null);
      return;
    }

    let cancelled = false;
    let loadingTask: ReturnType<typeof getDocument> | null = null;

    async function loadPdf() {
      try {
        setLoading(true);
        setError(null);

        const source = file
          ? { data: new Uint8Array(await file.arrayBuffer()) }
          : { url: fileUrl ?? "" };

        loadingTask = getDocument(source);
        const loadedPdf = await loadingTask.promise;

        if (cancelled) return;

        setPdf(loadedPdf);
        setPageCount(loadedPdf.numPages);
        setPageNumber(1);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load the PDF preview.",
          );
          setPdf(null);
          setPageCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPdf();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      void loadingTask?.destroy();
    };
  }, [file, fileUrl]);

  const renderPage = useCallback(async () => {
    if (!pdf || !canvasRef.current) return;

    renderTaskRef.current?.cancel();

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: zoom, rotation });
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, viewport.width, viewport.height);

    const renderTask = page.render({
      canvas,
      canvasContext: context,
      viewport,
    });

    renderTaskRef.current = renderTask;
    await renderTask.promise;
  }, [pageNumber, pdf, rotation, zoom]);

  useEffect(() => {
    renderPage().catch((renderError) => {
      if (renderError instanceof Error && renderError.name === "RenderingCancelledException") {
        return;
      }

      setError(
        renderError instanceof Error
          ? renderError.message
          : "Unable to render this PDF page.",
      );
    });
  }, [renderPage]);

  if (!fileUrl && !file) {
    return (
      <div className="mx-auto flex min-h-[420px] max-w-3xl items-center justify-center px-6 py-16">
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-zinc-500" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-100">No PDF selected</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Pass a fileUrl or File object to preview a PDF.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="flex h-full min-h-[520px] flex-col">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/95 px-4 py-3">
        <div className="flex items-center gap-2">
          <ToolbarButton
            disabled={!pdf || pageNumber <= 1}
            label="Previous page"
            onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </ToolbarButton>
          <span className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200">
            Page {pageNumber} of {pageCount || "?"}
          </span>
          <ToolbarButton
            disabled={!pdf || pageNumber >= pageCount}
            label="Next page"
            onClick={() => setPageNumber((page) => Math.min(pageCount, page + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-2">
          <ToolbarButton
            disabled={!pdf || zoom <= 0.6}
            label="Zoom out"
            onClick={() => setZoom((value) => Math.max(0.6, Number((value - 0.15).toFixed(2))))}
          >
            <ZoomOut className="h-4 w-4" />
          </ToolbarButton>
          <span className="w-16 text-center text-sm text-zinc-400">
            {Math.round(zoom * 100)}%
          </span>
          <ToolbarButton
            disabled={!pdf || zoom >= 2}
            label="Zoom in"
            onClick={() => setZoom((value) => Math.min(2, Number((value + 0.15).toFixed(2))))}
          >
            <ZoomIn className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!pdf}
            label="Rotate page"
            onClick={() => setRotation((value) => (value + 90) % 360)}
          >
            <RotateCw className="h-4 w-4" />
          </ToolbarButton>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto bg-zinc-950 px-4 py-8">
        {loading && (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
            Loading PDF preview
          </div>
        )}

        {error && (
          <div className="max-w-xl rounded-xl border border-rose-400/25 bg-rose-400/10 p-5 text-sm text-rose-100">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4" />
              PDF preview failed
            </div>
            <p className="mt-2 leading-6 text-rose-100/80">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <canvas
            aria-label={`PDF page ${pageNumber}`}
            className={cn(
              "max-w-none rounded-lg bg-white shadow-2xl shadow-black/40",
              !pdf && "hidden",
            )}
            ref={canvasRef}
          />
        )}
      </div>
    </section>
  );
}
