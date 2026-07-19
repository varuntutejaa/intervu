import { useRef, useState } from "react";
import { Eye, FileText, RefreshCw, Trash2, Upload } from "lucide-react";
import { MAX_RESUME_BYTES, readFileAsDataUrl } from "../../../lib/files";
import {
  useDeleteResumeMutation,
  useFetchResumeDetail,
  useReplaceResumeMutation,
  useResumesQuery,
  useUploadResumeMutation,
} from "../../resumes/api";

// A candidate's resume library — separate from the single resume field
// above (used for AI autofill) — this is what the "which resume should we
// send?" picker at apply-time draws from, so a candidate can keep several
// tailored resumes and choose per application.
export function ResumeLibrarySection() {
  const resumesQuery = useResumesQuery(true);
  const uploadMutation = useUploadResumeMutation();
  const deleteMutation = useDeleteResumeMutation();
  const fetchDetail = useFetchResumeDetail();
  const replaceMutation = useReplaceResumeMutation();
  const resumes = resumesQuery.data ?? [];
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [replaceError, setReplaceError] = useState<string | null>(null);
  const [replacingId, setReplacingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploadError(null);
    if (file.type !== "application/pdf") {
      setUploadError("Resume must be a PDF.");
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setUploadError("Resume must be under 4MB.");
      return;
    }
    try {
      const data = await readFileAsDataUrl(file);
      await uploadMutation.mutateAsync({ filename: file.name, data });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Couldn't upload that resume.");
    }
  };

  const handleView = async (id: number) => {
    setViewError(null);
    try {
      const resume = await fetchDetail.mutateAsync(id);
      window.open(resume.data, "_blank");
    } catch (err) {
      setViewError(err instanceof Error ? err.message : "Couldn't open that resume.");
    }
  };

  const startReplace = (id: number) => {
    setReplacingId(id);
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = async (file: File) => {
    if (replacingId === null) return;
    setReplaceError(null);
    if (file.type !== "application/pdf") {
      setReplaceError("Resume must be a PDF.");
      setReplacingId(null);
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setReplaceError("Resume must be under 4MB.");
      setReplacingId(null);
      return;
    }
    try {
      const data = await readFileAsDataUrl(file);
      await replaceMutation.mutateAsync({ id: replacingId, filename: file.name, data });
    } catch (err) {
      setReplaceError(err instanceof Error ? err.message : "Couldn't replace that resume.");
    } finally {
      setReplacingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-black/5 p-5">
      <p className="font-fustat text-base font-semibold text-black">Resume library</p>
      <p className="mt-1 text-sm text-black/50">
        Keep multiple resumes here — you'll pick which one to send each time you apply.
      </p>

      <div className="mt-4 space-y-2">
        {resumesQuery.isPending && <p className="text-sm text-black/40">Loading…</p>}
        {resumesQuery.isError && (
          <p className="text-sm text-red-600">Couldn't load your resumes. Is the API running?</p>
        )}
        {resumesQuery.isSuccess && resumes.length === 0 && (
          <p className="text-sm text-black/40">No resumes uploaded yet.</p>
        )}
        {resumes.map((resume) => (
          <div
            key={resume.id}
            className="flex items-center gap-3 rounded-xl border border-black/10 bg-white/50 p-3"
          >
            <FileText className="h-4 w-4 shrink-0 text-black/40" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-black">{resume.filename}</p>
              <p className="text-xs text-black/40">
                Uploaded{" "}
                {new Date(resume.uploaded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
            </div>
            <button
              type="button"
              aria-label="View resume"
              onClick={() => handleView(resume.id)}
              disabled={fetchDetail.isPending && fetchDetail.variables === resume.id}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/10 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Replace resume"
              onClick={() => startReplace(resume.id)}
              disabled={replaceMutation.isPending && replacingId === resume.id}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/10 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Delete resume"
              onClick={() => deleteMutation.mutate(resume.id)}
              disabled={deleteMutation.isPending}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {viewError && <p className="mt-2 text-xs text-red-600">{viewError}</p>}
      {replaceError && <p className="mt-2 text-xs text-red-600">{replaceError}</p>}

      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReplaceFile(file);
          e.target.value = "";
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadMutation.isPending}
        className="mt-3 flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3.5 py-2 text-xs font-medium text-black/70 transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Upload className="h-3.5 w-3.5" />
        {uploadMutation.isPending ? "Uploading…" : "Upload a resume"}
      </button>
      {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
      {deleteMutation.isError && <p className="mt-2 text-xs text-red-600">{deleteMutation.error.message}</p>}
    </div>
  );
}
