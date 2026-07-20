import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { readFileAsDataUrl, MAX_RESUME_BYTES } from "../../../lib/files";
import { useResumesQuery, useUploadResumeMutation } from "../../resumes/api";

export function ResumePickerModal({
  onClose,
  onConfirm,
  isSubmitting,
}: {
  onClose: () => void;
  onConfirm: (resumeId: number) => void;
  isSubmitting: boolean;
}) {
  const resumesQuery = useResumesQuery(true);
  const uploadMutation = useUploadResumeMutation();
  const resumes = resumesQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const result = await uploadMutation.mutateAsync({ filename: file.name, data });
      setSelectedId(result.id);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Couldn't upload that resume.");
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 bg-black/70" />

      <div className="relative w-full max-w-md rounded-2xl border border-black/10 bg-[#f7f7f8] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/10 hover:text-black"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="pr-8 font-fustat text-xl font-bold text-black">Which resume should we send?</h2>
        <p className="mt-1 text-sm text-black/50">Pick one from your library, or upload a new one.</p>

        <div className="mt-5 max-h-64 space-y-2 overflow-y-auto">
          {resumesQuery.isPending && <p className="text-sm text-black/40">Loading your resumes…</p>}
          {resumesQuery.isError && (
            <p className="text-sm text-red-600">Couldn't load your resumes. Try again, or upload one below.</p>
          )}
          {resumesQuery.isSuccess && resumes.length === 0 && (
            <p className="text-sm text-black/40">You haven't uploaded a resume yet — upload one below.</p>
          )}
          {resumes.map((resume) => (
            <label
              key={resume.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                selectedId === resume.id ? "border-accent/50 bg-accent/5" : "border-black/10 hover:bg-black/5"
              }`}
            >
              <input
                type="radio"
                name="resume"
                checked={selectedId === resume.id}
                onChange={() => setSelectedId(resume.id)}
                className="h-4 w-4 shrink-0 accent-accent"
              />
              <FileText className="h-4 w-4 shrink-0 text-black/40" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-black">{resume.filename}</p>
                <p className="text-xs text-black/40">
                  Uploaded {new Date(resume.uploaded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
            </label>
          ))}
        </div>

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
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-black/20 py-3 text-sm font-medium text-black/60 transition-colors hover:border-black/30 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploadMutation.isPending ? "Uploading…" : "Upload a new resume"}
        </button>
        {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => selectedId !== null && onConfirm(selectedId)}
            disabled={isSubmitting || selectedId === null}
            className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? "Applying…" : "Confirm & apply"}
          </button>
        </div>
      </div>
    </div>
  );
}
