import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { AuroraShell, InputGroup } from "../../../components/aurora/AuroraLayout";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schema";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  // No backend password-reset endpoint exists yet (see README known
  // limitations) — this stays a client-side-only confirmation screen.
  const onSubmit = () => setSent(true);

  return (
    <AuroraShell
      brand="Intervu"
      heroTitle="Forgot something?"
      heroDescription="It happens. Reset your password and get right back to it."
    >
      {sent ? (
        <div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
            <MailCheck className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-3xl font-medium tracking-tight text-black">Check your email</h2>
          <p className="mt-2 text-sm text-black/40">
            If an account exists for <span className="text-black">{getValues("email")}</span>, we've
            sent a link to reset your password.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-3xl font-medium tracking-tight text-black">Reset your password</h2>
          <p className="mt-2 text-sm text-black/40">
            Enter your email and we'll send you a reset link.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <InputGroup
                  label="Email"
                  placeholder="you@example.com"
                  type="email"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.email?.message}
                />
              )}
            />

            <button
              type="submit"
              className="mt-4 h-14 w-full rounded-xl bg-black font-semibold text-white transition-all hover:bg-black/90 active:scale-[0.98]"
            >
              Send reset link
            </button>
          </form>
        </div>
      )}

      <p className="text-center text-sm text-black/40">
        <Link to="/login" className="font-medium text-black underline underline-offset-2">
          Back to log in
        </Link>
      </p>
    </AuroraShell>
  );
}
