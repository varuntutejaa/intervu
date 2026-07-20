import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "../../../components/chrome/NavBar";
import { readFileAsDataUrl } from "../../../lib/files";
import { useChatMutation } from "../api";
import { ChatInput, type AttachedResume } from "../components/ChatInput";
import { ChatPanel, type ChatTurn } from "../components/ChatPanel";

// A mix of instantly-run chat prompts and direct links to the other pillars
// of the product — fills the space below the input and signals, right in
// the hero, that this isn't just a single-purpose chat tool. A fixed 2x2
// grid (not flex-wrap) so the layout is always deterministic, never an
// accidental-looking wrap.
type PromptChip = { label: string } & ({ kind: "prompt"; question: string } | { kind: "link"; to: string });

const CANDIDATE_CHIPS: PromptChip[] = [
  {
    kind: "prompt",
    label: "How can I improve my resume for a Backend Developer role?",
    question: "How can I improve my resume for a Backend Developer role?",
  },
  { kind: "prompt", label: "Is my resume ATS friendly?", question: "Is my resume ATS friendly?" },
  { kind: "prompt", label: "What backend skills am I missing?", question: "What backend skills am I missing?" },
  {
    kind: "prompt",
    label: "Why is my resume weak for cloud engineering roles?",
    question: "Why is my resume weak for cloud engineering roles?",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<"chat" | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  // Lifted out of ChatInput so a resume attached before a message is sent
  // is still there when the send comes from somewhere other than the
  // input's own submit button — e.g. clicking a suggested-question chip.
  const [attachedResume, setAttachedResume] = useState<AttachedResume | null>(null);
  const chatMutation = useChatMutation();

  const submitQuestion = async (text: string, resume: AttachedResume | null) => {
    setTurns((prev) => [...prev, { kind: "user", text, resume }]);
    setActivePanel("chat");
    // Deliberately NOT cleared here — the backend has no memory between
    // requests, so a resume attached once needs to keep riding along with
    // every follow-up in this conversation, not just the message that
    // introduced it. It only clears when the conversation itself ends
    // (closePanel) or the candidate explicitly removes it.
    try {
      const resumeData = resume ? (resume.kind === "file" ? await readFileAsDataUrl(resume.file) : resume.data) : undefined;
      // A file with no typed question is a valid submission (the UI allows
      // attach-only) — give the backend a real question to answer instead
      // of sending an empty one, which it correctly rejects.
      const question = text || (resume ? "Please review my resume and share feedback." : "");
      const result = await chatMutation.mutateAsync({ question, resumeData });
      setTurns((prev) => [...prev, { kind: "assistant", text: result.answer, citations: result.citations }]);
    } catch (err) {
      setTurns((prev) => [
        ...prev,
        { kind: "assistant-error", text: err instanceof Error ? err.message : "Something went wrong." },
      ]);
    }
  };

  const closePanel = () => {
    setActivePanel(null);
    setTurns([]);
    setAttachedResume(null);
  };

  return (
    <div className="relative min-h-screen w-full bg-white">
      <div className="fixed inset-x-0 top-0 z-20">
        <NavBar />
      </div>
      <div className="relative z-10 flex flex-col items-center px-6 pb-6 pt-32 sm:px-8 sm:pt-36 md:px-12 lg:px-20 xl:px-[120px]">
        {activePanel === "chat" ? (
          <ChatPanel
            turns={turns}
            isPending={chatMutation.isPending}
            resume={attachedResume}
            onResumeChange={setAttachedResume}
            onSend={submitQuestion}
            onClose={closePanel}
          />
        ) : (
          <CandidateHero
            resume={attachedResume}
            onResumeChange={setAttachedResume}
            onSubmit={submitQuestion}
            onChipPrompt={(question) => submitQuestion(question, attachedResume)}
            onChipLink={(to) => navigate(to)}
          />
        )}
      </div>
    </div>
  );
}

function ChipGrid({ chips, onChipPrompt, onChipLink }: {
  chips: PromptChip[];
  onChipPrompt?: (question: string) => void;
  onChipLink: (to: string) => void;
}) {
  return (
    <div className="mt-4 flex w-full max-w-[640px] flex-col gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => {
            if (chip.kind === "prompt") onChipPrompt?.(chip.question);
            else onChipLink(chip.to);
          }}
          className="flex items-center justify-between gap-2 rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-2.5 text-left font-grotesk text-xs text-black/60 transition-colors hover:border-accent/40 hover:text-black"
        >
          <span>{chip.label}</span>
          {chip.kind !== "prompt" && <ArrowRight className="h-3 w-3 shrink-0" />}
        </button>
      ))}
    </div>
  );
}

function CandidateHero({
  resume,
  onResumeChange,
  onSubmit,
  onChipPrompt,
  onChipLink,
}: {
  resume: AttachedResume | null;
  onResumeChange: (resume: AttachedResume | null) => void;
  onSubmit: (text: string, resume: AttachedResume | null) => void;
  onChipPrompt: (question: string) => void;
  onChipLink: (to: string) => void;
}) {
  return (
    <div className="flex w-full flex-col items-center">
      <h1 className="text-center font-fustat text-3xl leading-tight font-bold tracking-[-1px] text-black sm:text-4xl sm:tracking-[-1.5px]">
        What resume are we perfecting today?
      </h1>
      <p className="mt-3 max-w-md text-center text-sm text-black/50">
        Get AI-grounded resume feedback, then track every application from search to offer — all in one place.
      </p>

      <div className="mt-8 w-full">
        <ChatInput resume={resume} onResumeChange={onResumeChange} onSubmit={onSubmit} />
      </div>

      <ChipGrid chips={CANDIDATE_CHIPS} onChipPrompt={onChipPrompt} onChipLink={onChipLink} />
    </div>
  );
}
