import { useEffect, useRef, useState } from "react";
import type { Ref } from "react";
import { Briefcase, ClipboardList, FileText, MessageSquare, Sparkles, Mic, type LucideIcon } from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavBar } from "../../../components/chrome/NavBar";
import { useChatMutation } from "../api";
import { ChatInput } from "../components/ChatInput";
import { ChatPanel, type ChatTurn } from "../components/ChatPanel";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "AI resume review",
    description: "Ask a question and get instant, AI-powered feedback grounded in real hiring guides.",
  },
  {
    icon: FileText,
    title: "Resume parsing",
    description: "Attach a PDF or Word doc and we'll pull out what matters.",
  },
  {
    icon: Mic,
    title: "Voice input",
    description: "Speak your questions instead of typing them out.",
  },
  {
    icon: Briefcase,
    title: "Job matching",
    description: "Browse curated openings that match your profile.",
  },
  {
    icon: ClipboardList,
    title: "Application tracking",
    description: "Keep tabs on every application's status in one place.",
  },
  {
    icon: MessageSquare,
    title: "Follow-up chat",
    description: "Keep refining your resume with contextual follow-up questions.",
  },
];

type ActivePanel = "chat" | null;

export default function LandingPage() {
  const location = useLocation();
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const chatMutation = useChatMutation();
  const featuresRef = useRef<HTMLDivElement>(null);

  const submitQuestion = async (text: string, resume: File | null) => {
    setTurns((prev) => [...prev, { kind: "user", text, resume }]);
    setActivePanel("chat");
    try {
      const result = await chatMutation.mutateAsync(text);
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

  // NavBar's "Features" link points at "/#features" — pick up that hash on
  // arrival (or when clicked while already here) and finish the scroll once
  // the layout has settled.
  useEffect(() => {
    if (location.hash === "#features") {
      requestAnimationFrame(scrollToFeatures);
    }
  }, [location.hash]);

  return (
    <div className="relative min-h-screen w-full bg-[#141414]">
      <div className="fixed inset-x-0 top-0 z-20">
        <NavBar />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
        {activePanel === "chat" && (
          <ChatPanel
            turns={turns}
            isPending={chatMutation.isPending}
            onSend={submitQuestion}
            onClose={closePanel}
          />
        )}
        {activePanel === null && <InitialPrompt onSubmit={submitQuestion} />}
      </div>
      <FeaturesSection ref={featuresRef} />
    </div>
  );
}

function FeaturesSection({ ref }: { ref: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className="relative z-10 scroll-mt-24 px-6 py-24 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]"
    >
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-fustat text-3xl font-bold tracking-[-1px] text-white sm:text-4xl">
          Everything you need, in one place
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-white/60">
          Intervu pairs an AI resume reviewer with the tools to find and track your next role.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white">
                <feature.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 font-grotesk text-sm font-semibold text-white">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-white/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InitialPrompt({ onSubmit }: { onSubmit: (text: string, resume: File | null) => void }) {
  return (
    <div className="flex w-full flex-col items-center">
      <h1 className="text-center font-fustat text-3xl leading-tight font-bold tracking-[-1px] text-white sm:text-4xl sm:tracking-[-1.5px]">
        What resume are we perfecting today?
      </h1>

      <div className="mt-[28px] w-full">
        <ChatInput onSubmit={onSubmit} />
      </div>
    </div>
  );
}
