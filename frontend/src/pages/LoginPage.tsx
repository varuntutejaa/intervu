import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  AuroraRoleQuestion,
  AuroraShell,
  InputGroup,
  PasswordField,
  SocialAuthOptions,
  type Role,
} from "../components/AuroraLayout";

export default function LoginPage({
  onNavigateHome,
  onOpenSignup,
  onOpenForgotPassword,
  onLoginSuccess,
  role,
  onSelectRole,
}: {
  onNavigateHome: () => void;
  onOpenSignup: () => void;
  onOpenForgotPassword: () => void;
  onLoginSuccess: () => void;
  role: Role | null;
  onSelectRole: (role: Role | null) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google/GitHub sign-in is a full-page redirect through the provider and
  // back to a backend callback, which lands here with ?error=... if it
  // failed — there's no JS-level success/failure to handle directly.
  useEffect(() => {
    const message = new URLSearchParams(window.location.search).get("error");
    if (message) setError(message);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't log in. Try again.");
        return;
      }
      onLoginSuccess();
    } catch {
      setError("Couldn't reach the server. Is the API running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuroraShell
      brand="Intervu"
      onNavigateHome={onNavigateHome}
      heroTitle="Welcome back"
      heroDescription="Sign in to pick up right where you left off."
    >
      {role === null ? (
        <AuroraRoleQuestion
          title="Log in as..."
          description="So we can take you to the right place."
          onSelect={onSelectRole}
        />
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
              {role === "candidate" ? "Welcome back, candidate" : "Welcome back, recruiter"}
            </h2>
            <p className="mt-2 text-sm text-white/40">
              {role === "candidate"
                ? "Log in to keep working on your resume."
                : "Log in to keep sourcing great candidates."}
            </p>
          </div>

          <SocialAuthOptions role={role} />

          <form onSubmit={handleSubmit} className="space-y-4">
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
              labelRight={
                <button
                  type="button"
                  onClick={onOpenForgotPassword}
                  className="text-xs font-medium text-white/40 underline underline-offset-2 transition-colors hover:text-white"
                >
                  Forgot password?
                </button>
              }
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 h-14 w-full rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? "Logging in…" : "Log in"}
            </button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-white/40">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onOpenSignup}
          className="font-medium text-white underline underline-offset-2"
        >
          Sign up
        </button>
      </p>
    </AuroraShell>
  );
}
