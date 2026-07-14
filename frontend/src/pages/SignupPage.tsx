import { useState } from "react";
import type { FormEvent } from "react";
import {
  AuroraRoleQuestion,
  AuroraShell,
  InputGroup,
  PasswordField,
  SocialAuthOptions,
  type Role,
} from "../components/AuroraLayout";

const STRENGTH_LABELS = ["Weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const strength = getPasswordStrength(password);

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i < strength ? STRENGTH_COLORS[strength] : "bg-white/10"}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-white/40">{STRENGTH_LABELS[strength]}</p>
    </div>
  );
}

type Step = "form" | "verify";

export default function SignupPage({
  onNavigateHome,
  onOpenLogin,
  role,
  onSelectRole,
  onSignupComplete,
}: {
  onNavigateHome: () => void;
  onOpenLogin: () => void;
  role: Role | null;
  onSelectRole: (role: Role | null) => void;
  onSignupComplete: () => void;
}) {
  const [step, setStep] = useState<Step>("form");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: fullName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't create your account. Try again.");
        return;
      }
      setStep("verify");
    } catch {
      setError("Couldn't reach the server. Is the API running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const confirmRes = await fetch("/api/auth/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) {
        setError(confirmData.error ?? "Couldn't verify that code. Try again.");
        return;
      }

      // Confirming doesn't return a session — log them straight in so they
      // don't have to re-enter their password right after signing up.
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!loginRes.ok) {
        onOpenLogin();
        return;
      }
      onSignupComplete();
    } catch {
      setError("Couldn't reach the server. Is the API running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    try {
      await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      setError("Couldn't reach the server. Is the API running?");
    }
  };

  return (
    <AuroraShell
      brand="Intervu"
      onNavigateHome={onNavigateHome}
      heroTitle="Join Intervu"
      heroDescription="AI-reviewed resumes, curated job matches, and one place to track every application."
    >
      {role === null ? (
        <AuroraRoleQuestion
          title="How will you use Intervu?"
          description="This just tailors what you see next — you can't get this wrong."
          onSelect={onSelectRole}
        />
      ) : step === "verify" ? (
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-white">Check your email</h2>
          <p className="mt-2 text-sm text-white/40">
            Enter the verification code we sent to <span className="text-white">{email}</span>.
          </p>

          <form onSubmit={handleVerify} className="mt-7 space-y-4">
            <InputGroup
              label="Verification code"
              placeholder="123456"
              type="text"
              value={code}
              onChange={setCode}
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-14 w-full rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? "Verifying…" : "Verify"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleResendCode}
            className="mt-4 text-xs font-medium text-white/40 underline underline-offset-2 transition-colors hover:text-white"
          >
            Resend code
          </button>
        </div>
      ) : (
        <>
          <div>
            <button
              type="button"
              onClick={() => onSelectRole(null)}
              className="text-xs font-medium text-white/40 underline underline-offset-2 transition-colors hover:text-white"
            >
              Change role
            </button>
            <h2 className="mt-3 text-3xl font-medium tracking-tight text-white">
              {role === "candidate" ? "Create your candidate account" : "Create your recruiter account"}
            </h2>
            <p className="mt-2 text-sm text-white/40">
              Input your basic details to begin the journey.
            </p>
          </div>

          <SocialAuthOptions />

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputGroup
              label="Full name"
              placeholder="Jordan Rivera"
              type="text"
              value={fullName}
              onChange={setFullName}
            />

            <InputGroup
              label="Email"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={setEmail}
            />

            <PasswordField
              value={password}
              onChange={setPassword}
              showPassword={showPassword}
              onToggleShowPassword={setShowPassword}
            >
              <PasswordStrengthBar password={password} />
            </PasswordField>

            <div>
              <label className="text-sm font-medium text-white">Confirm password</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border-none bg-brand-gray px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
              />
              {passwordsMismatch && (
                <p className="mt-1.5 text-xs text-red-400">Passwords don't match.</p>
              )}
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={passwordsMismatch || isSubmitting}
              className="mt-4 h-14 w-full rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-white/40">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onOpenLogin}
          className="font-medium text-white underline underline-offset-2"
        >
          Log in
        </button>
      </p>
    </AuroraShell>
  );
}
