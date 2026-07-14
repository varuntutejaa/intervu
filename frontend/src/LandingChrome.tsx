import { useState } from "react";
import { Bell, LogOut, Search, User } from "lucide-react";
import type { Role } from "./AuroraLayout";

const NAV_LINK_CLASS =
  "after:content-[''] group relative h-10 shrink-0 rounded-full bg-transparent px-5 font-grotesk text-sm font-medium text-white/70 transition-colors hover:text-white after:absolute after:bottom-1.5 after:left-5 after:right-5 after:h-px after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:after:scale-x-100";

export type NavUser = { email: string; name?: string };

export function NavBar({
  onNavigateHome,
  onOpenJobs,
  onOpenApplications,
  onScrollToFeatures,
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
  onScrollToFeatures: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenPostJob: () => void;
  onOpenViewCandidates: () => void;
  role: Role | null;
  user: NavUser | null;
  onLogout: () => void;
}) {
  return (
    <nav className="grid grid-cols-[auto_1fr_auto] items-center gap-4 bg-transparent px-6 py-4 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
      <button
        type="button"
        onClick={onNavigateHome}
        className="shrink-0 justify-self-start font-grotesk text-2xl font-semibold tracking-[-1.44px] text-white"
      >
        Intervu
      </button>

      <div className="flex min-w-0 flex-wrap items-center justify-center gap-3">
        <div className="hidden h-10 min-w-0 max-w-md flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-white/60 lg:flex">
          <Search className="h-4 w-4 shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
          />
        </div>

        {role === "recruiter" ? (
          <>
            <button type="button" onClick={onOpenPostJob} className={NAV_LINK_CLASS}>
              Post Job
            </button>

            <button type="button" onClick={onOpenViewCandidates} className={NAV_LINK_CLASS}>
              View Candidates
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onScrollToFeatures} className={NAV_LINK_CLASS}>
              Features
            </button>

            <button type="button" onClick={onOpenJobs} className={NAV_LINK_CLASS}>
              Jobs
            </button>

            <button type="button" onClick={onOpenApplications} className={NAV_LINK_CLASS}>
              Applications
            </button>
          </>
        )}

        <button
          type="button"
          aria-label="Notifications"
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white sm:flex"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>

      {user ? (
        <ProfileMenu user={user} onOpenProfile={onOpenProfile} onLogout={onLogout} />
      ) : (
        <button
          type="button"
          onClick={onOpenAuth}
          className="h-10 shrink-0 justify-self-end rounded-full bg-white px-5 font-grotesk text-sm font-medium text-black transition-colors hover:bg-white/80"
        >
          Log in / Sign up
        </button>
      )}
    </nav>
  );
}

function initials(user: NavUser) {
  if (user.name) {
    const parts = user.name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return user.email.slice(0, 2).toUpperCase();
}

function ProfileMenu({
  user,
  onOpenProfile,
  onLogout,
}: {
  user: NavUser;
  onOpenProfile: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0 justify-self-end">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-white/5"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 font-grotesk text-xs font-semibold text-white">
          {initials(user)}
        </span>
        <span className="hidden font-grotesk text-sm font-medium text-white/90 sm:inline">
          {user.name ?? user.email}
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-white/10 bg-[#1c1c1e] p-1.5 shadow-2xl">
            <div className="truncate px-3 py-2 text-xs text-white/40">{user.email}</div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenProfile();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              <User className="h-4 w-4" />
              Profile
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
