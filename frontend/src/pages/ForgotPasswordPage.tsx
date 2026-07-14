import { useState } from "react";
import type { FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { AuroraShell, InputGroup } from "../components/AuroraLayout";

export default function ForgotPasswordPage({
  onNavigateHome,
  onOpenLogin,
}: {
  onNavigateHome: () => void;
  onOpenLogin: () => void;
}) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <AuroraShell
      brand="Intervu"
      onNavigateHome={onNavigateHome}
      heroTitle="Forgot something?"
      heroDescription="It happens. Reset your password and get right back to it."
    >
      {sent ? (
        <div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black">
            <MailCheck className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-3xl font-medium tracking-tight text-white">Check your email</h2>
          <p className="mt-2 text-sm text-white/40">
            If an account exists for <span className="text-white">{email}</span>, we've sent a
            link to reset your password.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-white">Reset your password</h2>
          <p className="mt-2 text-sm text-white/40">
            Enter your email and we'll send you a reset link.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <InputGroup
              label="Email"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={setEmail}
            />

            <button
              type="submit"
              className="mt-4 h-14 w-full rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              Send reset link
            </button>
          </form>
        </div>
      )}

      <p className="text-center text-sm text-white/40">
        <button
          type="button"
          onClick={onOpenLogin}
          className="font-medium text-white underline underline-offset-2"
        >
          Back to log in
        </button>
      </p>
    </AuroraShell>
  );
}
