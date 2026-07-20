import { useRef, useState } from "react";
import type { Ref } from "react";
import { ArrowRight, ChevronDown, ClipboardList, FileText, Sparkles, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "../../../components/chrome/NavBar";
import { readFileAsDataUrl } from "../../../lib/files";
import { useChatMutation } from "../api";
import { ChatInput } from "../components/ChatInput";
import { ChatPanel, type ChatTurn } from "../components/ChatPanel";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const CANDIDATE_FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "AI resume review",
    description: "Ask a question and get instant, AI-powered feedback grounded in real hiring guides.",
  },
  {
    icon: FileText,
    title: "Resume parsing & autofill",
    description: "Attach a PDF and we'll pull your skills, experience, and links straight into your profile.",
  },
  {
    icon: ClipboardList,
    title: "Application tracking",
    description: "Keep tabs on every application's status, from applied to offer, in one place.",
  },
];

// A mix of instantly-run chat prompts and direct links to the other pillars
// of the product — fills the space below the input and signals, right in
// the hero, that this isn't just a single-purpose chat tool. A fixed 2x2
// grid (not flex-wrap) so the layout is always deterministic, never an
// accidental-looking wrap.
type PromptChip = { label: string } & ({ kind: "prompt"; question: string } | { kind: "link"; to: string });

const CANDIDATE_CHIPS: PromptChip[] = [
  { kind: "prompt", label: "Is my resume ATS friendly?", question: "Is my resume ATS friendly?" },
  { kind: "prompt", label: "What skills am I missing?", question: "What skills am I missing for this role?" },
  { kind: "link", label: "Browse open roles", to: "/jobs" },
  { kind: "link", label: "Track my applications", to: "/applications" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<"chat" | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  // Lifted out of ChatInput so a resume attached before a message is sent
  // is still there when the send comes from somewhere other than the
  // input's own submit button — e.g. clicking a suggested-question chip.
  const [attachedResume, setAttachedResume] = useState<File | null>(null);
  const chatMutation = useChatMutation();
  const featuresRef = useRef<HTMLDivElement>(null);

  const submitQuestion = async (text: string, resume: File | null) => {
    setTurns((prev) => [...prev, { kind: "user", text, resume }]);
    setActivePanel("chat");
    setAttachedResume(null);
    try {
      const resumeData = resume ? await readFileAsDataUrl(resume) : undefined;
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
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
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

        {activePanel === null && (
          <button
            type="button"
            onClick={scrollToFeatures}
            aria-label="See what's included"
            className="mt-8 flex flex-col items-center gap-1 text-black/30 transition-colors hover:text-black/60"
          >
            <span className="font-grotesk text-xs">See what's included</span>
            <ChevronDown className="h-4 w-4 animate-bounce" />
          </button>
        )}
      </div>
      <FeaturesSection ref={featuresRef} />
    </div>
  );
}

function FeatureGrid({ eyebrow, features }: { eyebrow: string; features: Feature[] }) {
  return (
    <div>
      <p className="font-grotesk text-xs font-semibold uppercase tracking-wide text-accent-soft">{eyebrow}</p>
      <div className="mt-4 grid grid-cols-1 divide-y divide-black/10 border-t border-black/10 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
        {features.map((feature) => (
          <div key={feature.title} className="flex flex-col gap-2 px-1 py-6 sm:px-6">
            <feature.icon className="h-4 w-4 text-black/60" />
            <h3 className="font-grotesk text-sm font-semibold text-black">{feature.title}</h3>
            <p className="text-sm text-black/60">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturesSection({ ref }: { ref: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className="relative z-10 scroll-mt-24 px-6 pb-24 pt-10 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center font-fustat text-3xl font-bold tracking-[-1px] text-black sm:text-4xl">
          Everything you need, in one place
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-black/60">
          Intervu's AI resume assistant helps you put your best resume forward, then tracks every application from search to offer.
        </p>

        <div className="mt-12">
          <FeatureGrid eyebrow="AI resume assistant" features={CANDIDATE_FEATURES} />
        </div>
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
    <div className="mt-4 grid w-full max-w-[520px] grid-cols-2 gap-2">
      {chips.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => {
            if (chip.kind === "prompt") onChipPrompt?.(chip.question);
            else onChipLink(chip.to);
          }}
          className="flex items-center justify-center gap-1 rounded-full border border-black/10 bg-black/[0.03] px-3.5 py-1.5 text-center font-grotesk text-xs text-black/60 transition-colors hover:border-accent/40 hover:text-black"
        >
          <span className="truncate">{chip.label}</span>
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
  resume: File | null;
  onResumeChange: (resume: File | null) => void;
  onSubmit: (text: string, resume: File | null) => void;
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
