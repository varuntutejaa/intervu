import { FileText, X } from "lucide-react";
import { useResumesQuery, useFetchResumeDetail } from "../../resumes/api";

export function ResumeLibraryPickerModal({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (resume: { id: number; name: string; data: string }) => void;
}) {
  const resumesQuery = useResumesQuery(true);
  const resumeDetailMutation = useFetchResumeDetail();
  const resumes = resumesQuery.data ?? [];

  const handlePick = async (id: number, filename: string) => {
    const detail = await resumeDetailMutation.mutateAsync(id);
    onPick({ id, name: filename, data: detail.data });
    onClose();
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

        <h2 className="pr-8 font-fustat text-xl font-bold text-black">Attach from your library</h2>
        <p className="mt-1 text-sm text-black/50">Pick a resume you've already uploaded.</p>

        <div className="mt-5 max-h-72 space-y-2 overflow-y-auto">
          {resumesQuery.isPending && <p className="text-sm text-black/40">Loading your resumes…</p>}
          {resumesQuery.isError && (
            <p className="text-sm text-red-600">Couldn't load your resumes. Is the API running?</p>
          )}
          {resumeDetailMutation.isError && (
            <p className="text-sm text-red-600">Couldn't open that resume. Try again.</p>
          )}
          {resumesQuery.isSuccess && resumes.length === 0 && (
            <p className="text-sm text-black/40">
              You haven't uploaded a resume yet — attach a file instead, or add one from your profile.
            </p>
          )}
          {resumes.map((resume) => (
            <button
              key={resume.id}
              type="button"
              disabled={resumeDetailMutation.isPending}
              onClick={() => handlePick(resume.id, resume.filename)}
              className="flex w-full items-center gap-3 rounded-xl border border-black/10 p-3 text-left transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText className="h-4 w-4 shrink-0 text-black/40" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-black">{resume.filename}</p>
                <p className="text-xs text-black/40">
                  Uploaded{" "}
                  {new Date(resume.uploaded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
