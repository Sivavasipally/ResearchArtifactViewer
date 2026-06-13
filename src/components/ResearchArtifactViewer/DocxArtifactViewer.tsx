import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import * as mammoth from "mammoth";
import { AlertCircle, FileText, Loader2 } from "lucide-react";

interface DocxArtifactViewerProps {
  fileUrl?: string;
  file?: File;
}

export function DocxArtifactViewer({ fileUrl, file }: DocxArtifactViewerProps) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileUrl && !file) {
      setHtml("");
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadDocx() {
      try {
        setLoading(true);
        setError(null);

        const arrayBuffer = file
          ? await file.arrayBuffer()
          : await fetch(fileUrl ?? "").then((response) => {
              if (!response.ok) {
                throw new Error(`Unable to fetch DOCX file (${response.status}).`);
              }
              return response.arrayBuffer();
            });

        const result = await mammoth.convertToHtml({ arrayBuffer });
        const cleanHtml = DOMPurify.sanitize(result.value, {
          ADD_ATTR: ["target", "rel"],
        });

        if (!cancelled) setHtml(cleanHtml);
      } catch (docxError) {
        if (!cancelled) {
          setError(
            docxError instanceof Error
              ? docxError.message
              : "Unable to preview this DOCX document.",
          );
          setHtml("");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDocx();

    return () => {
      cancelled = true;
    };
  }, [file, fileUrl]);

  if (!fileUrl && !file) {
    return (
      <div className="mx-auto flex min-h-[420px] max-w-3xl items-center justify-center px-6 py-16">
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-zinc-500" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-100">No DOCX selected</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Pass a fileUrl or File object to preview a Word document.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center px-6 py-16">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
          Preparing DOCX preview
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[420px] max-w-2xl items-center justify-center px-6 py-16">
        <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-5 text-sm text-rose-100">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            DOCX preview failed
          </div>
          <p className="mt-2 leading-6 text-rose-100/80">{error}</p>
          <p className="mt-3 text-rose-100/70">
            Use the download action to open the original file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <article
      className="mx-auto max-w-3xl px-5 py-8 text-zinc-200 sm:px-8 lg:px-10 [&_a]:text-cyan-200 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-300/60 [&_blockquote]:bg-cyan-300/10 [&_blockquote]:px-5 [&_blockquote]:py-3 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-zinc-50 [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:border-t [&_h2]:border-zinc-800 [&_h2]:pt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-zinc-50 [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-5 [&_p]:leading-8 [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-zinc-800 [&_td]:p-3 [&_th]:border [&_th]:border-zinc-800 [&_th]:bg-zinc-900 [&_th]:p-3 [&_th]:text-left [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
