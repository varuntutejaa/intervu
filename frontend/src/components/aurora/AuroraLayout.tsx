import { useRef } from "react";
import { motion } from "motion/react";
import { Briefcase, ChevronDown, ChevronRight, Eye, EyeOff, Upload, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Role } from "../../types";

export const AURORA_VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4";

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// Shared shell for the Aurora-styled pages (signup, login, profile setup,
// forgot password): a video hero on the left with a staggered reveal, and a
// fading-in form column on the right.
export function AuroraShell({
  brand,
  heroTitle,
  heroDescription,
  children,
}: {
  brand: string;
  heroTitle: string;
  heroDescription: string;
  children: ReactNode;
}) {
  return (
    <main className="font-aurora flex min-h-screen w-full bg-black p-2 selection:bg-white/30 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4">
      <div className="relative hidden h-full w-[52%] flex-col items-center justify-center overflow-hidden rounded-3xl px-12 shadow-2xl lg:flex">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src={AURORA_VIDEO_SRC} type="video/mp4" />
        </video>

        <motion.div
          className="relative z-10 w-full max-w-xs space-y-8"
          initial="hidden"
          animate="visible"
          variants={CONTAINER_VARIANTS}
        >
          <motion.div variants={ITEM_VARIANTS} className="text-center">
            <Link to="/" className="text-7xl font-bold tracking-tight text-white">
              {brand}
            </Link>
            <p className="mt-5 text-xl font-medium tracking-tight text-white">{heroTitle}</p>
            <p className="mt-3 px-4 text-sm leading-relaxed text-white/60">{heroDescription}</p>
          </motion.div>
        </motion.div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-12 sm:px-12 lg:overflow-hidden lg:px-16 lg:py-6 xl:px-24">
        <motion.div
          className="w-full max-w-xl space-y-8 sm:space-y-10 lg:space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </div>
    </main>
  );
}

// Shared first step for Aurora login/signup — asks which kind of account
// this is before showing role-specific content.
export function AuroraRoleQuestion({
  title,
  description,
  onSelect,
}: {
  title: string;
  description: string;
  onSelect: (role: Role) => void;
}) {
  return (
    <>
      <h2 className="text-3xl font-medium tracking-tight text-white">{title}</h2>
      <p className="mt-2 text-sm text-white/40">{description}</p>

      <div className="mt-2 flex flex-col gap-3">
        <AuroraRoleCard
          icon={User}
          title="I'm a candidate"
          description="Reviewing my resume and looking for a role"
          onClick={() => onSelect("candidate")}
        />
        <AuroraRoleCard
          icon={Briefcase}
          title="I'm a recruiter"
          description="Sourcing and evaluating candidates"
          onClick={() => onSelect("recruiter")}
        />
      </div>
    </>
  );
}

function AuroraRoleCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3.5 rounded-xl bg-brand-gray p-4 text-left transition-colors hover:bg-white/10"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="mt-0.5 block text-xs text-white/50">{description}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:text-white/50" />
    </button>
  );
}

type IconComponent = LucideIcon | ((props: { className?: string }) => ReactNode);

export function SocialButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  href,
}: {
  icon: IconComponent;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
}) {
  const className =
    "flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-black text-sm font-medium text-white transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50";

  if (href) {
    return (
      <a href={href} className={className}>
        <Icon className="h-4 w-4" />
        {label}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// Google/Github links plus the "Or" divider — these three always appear
// together, in this order, across every Aurora auth page. Cognito remains
// the system of record for email/password; these two are plain links to
// this server's OAuth kickoff routes, which redirect through the
// provider's own login page and back to a callback that creates the same
// kind of session cookie the Cognito login route does. Full page
// navigations, not a popup, so there's no client-side token handling here.
//
// `role` is only meaningful on the Login page — it's round-tripped through
// the OAuth `state` param so the callback can reject signing into an
// account that isn't actually set up as that role (see routes/oauth.ts).
// Signup leaves it unset, since adding a new role to an existing account is
// exactly what an unconstrained OAuth signup should allow.
export function SocialAuthOptions({ role }: { role?: Role | null }) {
  const suffix = role ? `?role=${role}` : "";
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <SocialButton icon={GoogleLogo} label="Google" href={`/api/auth/google/start${suffix}`} />
        <SocialButton icon={GithubLogo} label="Github" href={`/api/auth/github/start${suffix}`} />
      </div>

      <div className="flex items-center">
        <div className="h-px flex-1 bg-white/10" />
        <span className="bg-black px-4 text-xs font-medium tracking-widest text-white/40 uppercase">
          Or
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
    </>
  );
}

export function PasswordField({
  label = "Password",
  labelRight,
  value,
  onChange,
  showPassword,
  onToggleShowPassword,
  helperText,
  error,
  children,
}: {
  label?: string;
  labelRight?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShowPassword: (value: boolean) => void;
  helperText?: string;
  error?: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white">{label}</label>
        {labelRight}
      </div>
      <div className="relative mt-2">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-xl border-none bg-brand-gray px-4 pr-11 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
        <button
          type="button"
          onClick={() => onToggleShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      ) : (
        helperText && <p className="mt-1.5 text-xs text-white/30">{helperText}</p>
      )}
      {children}
    </div>
  );
}

export function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function GithubLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.16.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.67 0-1.25.44-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.73.8 1.18 1.83 1.18 3.08 0 4.4-2.69 5.37-5.25 5.66.42.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .3.2.66.79.55A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

export function InputGroup({
  label,
  placeholder,
  type,
  value,
  onChange,
  error,
}: {
  label: string;
  placeholder: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-white">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-11 w-full rounded-xl border-none bg-brand-gray px-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function TextAreaGroup({
  label,
  placeholder,
  value,
  onChange,
  rows = 3,
  error,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  error?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-white">{label}</label>
      <textarea
        placeholder={placeholder}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full resize-none rounded-xl border-none bg-brand-gray px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function SelectGroup({
  label,
  placeholder,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-white">{label}</label>
      <div className="relative mt-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full appearance-none rounded-xl border-none bg-brand-gray px-4 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function FileUploadGroup({
  label,
  file,
  onChange,
  accept,
  existingLabel,
  error,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  existingLabel?: string;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="text-sm font-medium text-white">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-2 flex h-11 w-full items-center gap-2 rounded-xl border-none bg-brand-gray px-4 text-left text-sm text-white/60 transition-colors hover:bg-white/10"
      >
        <Upload className="h-4 w-4 shrink-0 text-white/40" />
        <span className="truncate">{file ? file.name : (existingLabel ?? "Choose a file")}</span>
      </button>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
