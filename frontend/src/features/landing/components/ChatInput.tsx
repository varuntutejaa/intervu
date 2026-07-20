import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ComponentType, SVGProps } from "react";
import { ArrowUp, FileText, Paperclip, Sparkles, X, type LucideIcon } from "lucide-react";

const RESUME_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_MESSAGE_LENGTH = 3000;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatInput({
  compact = false,
  resume,
  onResumeChange,
  onSubmit,
}: {
  compact?: boolean;
  // Controlled by the parent (not local state) so a resume attached here
  // is still there when the parent sends a message some other way — e.g.
  // clicking a suggested-question chip instead of pressing submit.
  resume: File | null;
  onResumeChange: (resume: File | null) => void;
  onSubmit: (text: string, resume: File | null) => void;
}) {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = message.trim().length > 0 || resume !== null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(message.trim(), resume);
    setMessage("");
    onResumeChange(null);
  };

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept={RESUME_ACCEPT}
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onResumeChange(file);
        e.target.value = "";
      }}
    />
  );

  const resumeChip = resume && (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-black/10 bg-black/5 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2 text-xs text-black">
        <FileText className="h-3.5 w-3.5 shrink-0 text-black/60" />
        <span className="truncate">{resume.name}</span>
        <span className="shrink-0 text-black/40">{formatFileSize(resume.size)}</span>
      </div>
      <button
        type="button"
        aria-label="Remove resume"
        onClick={() => onResumeChange(null)}
        className="shrink-0 text-black/40 transition-colors hover:text-black"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {resumeChip}
        <div className="flex items-center gap-2">
          {fileInput}
          <IconButton icon={Paperclip} label="Attach resume" onClick={() => fileInputRef.current?.click()} />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            placeholder="Ask a follow-up..."
            maxLength={MAX_MESSAGE_LENGTH}
            className="min-w-0 flex-1 rounded-xl border border-black/10 bg-black/5 px-4 py-2.5 text-base text-black placeholder:text-black/35 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Submit"
            disabled={!canSubmit}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white transition-transform enabled:hover:bg-black/80 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>
    );
  }

  return (
    // The gradient ring (not a shadow, not a solid accent fill) is the one
    // place in the app that isn't monochrome — reserved for this input
    // specifically so it reads as the AI-forward surface, distinct from
    // every plain rounded-gray box elsewhere (nav search included).
    <div className="mx-auto w-full max-w-[640px] rounded-2xl bg-gradient-to-r from-accent/50 via-accent-soft/25 to-accent/50 p-px shadow-[0_0_40px_-12px_var(--color-accent)]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-[15px] bg-[#f7f7f8] p-3">
        <div className="flex items-center justify-between px-1 font-grotesk text-xs font-medium text-black/60">
          <span>Ask about your resume</span>
          <div className="flex items-center gap-1.5 text-accent-soft">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Grounded in real hiring guides</span>
          </div>
        </div>

        {resumeChip}

        <div className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-black/10 px-4 py-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            placeholder="Paste your resume or ask a question..."
            maxLength={MAX_MESSAGE_LENGTH}
            className="min-w-0 flex-1 bg-transparent text-base text-black placeholder:text-black/35 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Submit"
            disabled={!canSubmit}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-white transition-transform enabled:hover:bg-black/80 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {fileInput}
            <ActionButton
              icon={Paperclip}
              label={resume ? "Change Resume" : "Attach Resume"}
              onClick={() => fileInputRef.current?.click()}
            />
          </div>
          <span className="font-grotesk text-xs text-black/40">{message.length}/3,000</span>
        </div>
      </form>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-[6px] border border-black/10 bg-black/5 px-2.5 py-1.5 font-grotesk text-xs font-medium text-black/70 transition-colors hover:bg-black/10"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function IconButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon | ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 text-black/60 transition-colors hover:bg-black/10"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
