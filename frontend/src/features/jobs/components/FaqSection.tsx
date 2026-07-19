import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    question: "Is it free to apply to jobs on Intervu?",
    answer:
      "Yes — browsing and applying to jobs is completely free for candidates. There's no subscription or fee at any point in the application process.",
  },
  {
    question: "How do I know if a recruiter has seen my application?",
    answer:
      "Every application shows a live status — Applied, Interview Scheduled, Technical Round, HR Round, Offer Received, or Rejected — that updates the moment a recruiter changes it. You'll also see it in your notifications and on your Applications page.",
  },
  {
    question: "Can I apply to a job more than once?",
    answer:
      "No — Intervu allows one application per candidate per job posting, so recruiters see a single, up-to-date status for you instead of duplicate entries.",
  },
  {
    question: "How do I switch between a candidate and recruiter account?",
    answer:
      "Each email is either a candidate account or a recruiter account, not both — this keeps a recruiter's postings and a candidate's applications cleanly separate. If you need both, use a different email for the second account.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-black/10 py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="font-fustat text-sm font-semibold text-black sm:text-base">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-black/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="mt-3 text-sm leading-relaxed text-black/60">{answer}</p>}
    </div>
  );
}

export function FaqSection() {
  return (
    <div id="faq" className="mx-auto w-full max-w-3xl scroll-mt-24 px-6 pb-24 pt-16 sm:px-8">
      <h2 className="text-center font-fustat text-2xl font-bold text-black sm:text-3xl">
        Frequently asked questions
      </h2>
      <div className="mt-8 border-t border-black/10">
        {FAQS.map((faq) => (
          <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  );
}
