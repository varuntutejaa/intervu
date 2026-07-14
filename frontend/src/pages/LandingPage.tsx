import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode, Ref } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  ArrowUp,
  Briefcase,
  ClipboardList,
  FileText,
  MessageSquare,
  Sparkles,
  Paperclip,
  Mic,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "../components/AuroraLayout";
import { NavBar } from "../components/LandingChrome";
import type { NavUser } from "../components/LandingChrome";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "AI resume review",
    description:
      "Paste your resume or ask a question and get instant, GPT-4o powered feedback.",
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

const RESUME_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_MESSAGE_LENGTH = 3000;

type ChatMessage = {
  text: string;
  resume: File | null;
};

type ActivePanel = "chat" | null;

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LandingPage({
  onNavigateHome,
  onOpenJobs,
  onOpenApplications,
  onOpenAuth,
  onOpenProfile,
  onOpenPostJob,
  onOpenViewCandidates,
  role,
  user,
  onLogout,
}: {
  onNavigateHome: () => void;
  onOpenJobs: () => void;
  onOpenApplications: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenPostJob: () => void;
  onOpenViewCandidates: () => void;
  role: Role | null;
  user: NavUser | null;
  onLogout: () => void;
}) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const featuresRef = useRef<HTMLDivElement>(null);

  const startChat = (text: string, resume: File | null) => {
    setMessages([{ text, resume }]);
    setActivePanel("chat");
  };

  const sendFollowUp = (text: string, resume: File | null) => {
    setMessages((prev) => [...prev, { text, resume }]);
  };

  const closePanel = () => {
    setActivePanel(null);
    setMessages([]);
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Jobs/Applications navigate to "/#features" to reach this section, since
  // it only exists on this page — pick up that hash on arrival and finish
  // the scroll once the layout has settled.
  useEffect(() => {
    if (window.location.hash === "#features") {
      requestAnimationFrame(scrollToFeatures);
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-[#141414]">
      <div className="fixed inset-x-0 top-0 z-20">
        <NavBar
          onNavigateHome={onNavigateHome}
          onOpenJobs={onOpenJobs}
          onOpenApplications={onOpenApplications}
          onScrollToFeatures={scrollToFeatures}
          onOpenAuth={onOpenAuth}
          onOpenProfile={onOpenProfile}
          onOpenPostJob={onOpenPostJob}
          onOpenViewCandidates={onOpenViewCandidates}
          role={role}
          user={user}
          onLogout={onLogout}
        />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
        {activePanel === "chat" && (
          <ChatPanel messages={messages} onSend={sendFollowUp} onClose={closePanel} />
        )}
        {activePanel === null && <InitialPrompt onSubmit={startChat} />}
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
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white">
                <feature.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 font-grotesk text-sm font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm text-white/60">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InitialPrompt({
  onSubmit,
}: {
  onSubmit: (text: string, resume: File | null) => void;
}) {
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

// Shared dark "window" shell — same size and macOS-style traffic-light
// header for every panel (chat, jobs, applications), so they all open at
// the exact same size and only the content underneath differs.
function PanelShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex h-[min(90vh,calc(100vh-9rem))] w-[90vw] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#1c1c1e] shadow-2xl">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-5 py-3">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="group flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ff5f57] transition-transform hover:scale-110"
        >
          <X className="h-2 w-2 text-[#4d0000] opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={3.5} />
        </button>
        <span className="h-3.5 w-3.5 rounded-full bg-[#febc2e]" />
        <span className="h-3.5 w-3.5 rounded-full bg-[#28c840]" />
      </div>

      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

// The panel only exists once a message has actually been sent — this
// is the chat surface itself, with history scrolling above a bottom-pinned
// input, the way an actual chat window behaves.
function ChatPanel({
  messages,
  onSend,
  onClose,
}: {
  messages: ChatMessage[];
  onSend: (text: string, resume: File | null) => void;
  onClose: () => void;
}) {
  return (
    <PanelShell onClose={onClose}>
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto p-6 sm:p-8">
          {messages.map((message, i) => (
            <div key={i} className="ml-auto flex max-w-[75%] flex-col items-end gap-2">
              {message.resume && (
                <div className="flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-white/60" />
                  <span className="truncate">{message.resume.name}</span>
                  <span className="shrink-0 text-white/40">
                    {formatFileSize(message.resume.size)}
                  </span>
                </div>
              )}
              {message.text && (
                <div className="w-fit rounded-2xl rounded-br-md bg-white px-4 py-2.5 text-sm text-black">
                  {message.text}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 p-4">
          <ChatInput compact onSubmit={onSend} />
        </div>
      </div>
    </PanelShell>
  );
}

function ChatInput({
  compact = false,
  onSubmit,
}: {
  compact?: boolean;
  onSubmit: (text: string, resume: File | null) => void;
}) {
  const [message, setMessage] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = message.trim().length > 0 || resume !== null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(message.trim(), resume);
    setMessage("");
    setResume(null);
  };

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept={RESUME_ACCEPT}
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) setResume(file);
        e.target.value = "";
      }}
    />
  );

  const resumeChip = resume && (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2 text-xs text-white">
        <FileText className="h-3.5 w-3.5 shrink-0 text-white/60" />
        <span className="truncate">{resume.name}</span>
        <span className="shrink-0 text-white/40">{formatFileSize(resume.size)}</span>
      </div>
      <button
        type="button"
        aria-label="Remove resume"
        onClick={() => setResume(null)}
        className="shrink-0 text-white/40 transition-colors hover:text-white"
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
          <IconButton
            icon={Paperclip}
            label="Attach resume"
            onClick={() => fileInputRef.current?.click()}
          />
          <IconButton icon={Mic} label="Voice" />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            placeholder="Ask a follow-up..."
            maxLength={MAX_MESSAGE_LENGTH}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base text-white placeholder:text-white/35 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Submit"
            disabled={!canSubmit}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform enabled:hover:bg-white/80 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-[640px] flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
    >
      <div className="flex items-center justify-between px-1 font-grotesk text-xs font-medium text-white/60">
        <span>12/50 reviews</span>
        <div className="flex items-center gap-1.5 text-white/50">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Powered by GPT-4o</span>
        </div>
      </div>

      {resumeChip}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
          placeholder="Paste your resume or ask a question..."
          maxLength={MAX_MESSAGE_LENGTH}
          className="min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-white/35 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Submit"
          disabled={!canSubmit}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition-transform enabled:hover:bg-white/80 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
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
          <ActionButton icon={Mic} label="Voice" />
        </div>
        <span className="font-grotesk text-xs text-white/40">{message.length}/3,000</span>
      </div>
    </form>
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
      className="flex items-center gap-1.5 rounded-[6px] border border-white/10 bg-white/5 px-2.5 py-1.5 font-grotesk text-xs font-medium text-white/70 transition-colors hover:bg-white/10"
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
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
