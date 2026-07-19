import { useState } from "react";
import { LogOut, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLogoutMutation, useSessionQuery } from "../../features/auth/api";
import type { NavUser } from "../../types";
import { NotificationBell } from "./NotificationBell";

const NAV_LINK_CLASS =
  "after:content-[''] group relative flex h-10 shrink-0 items-center rounded-full bg-transparent px-5 font-grotesk text-sm font-medium text-black/70 transition-colors hover:text-black after:absolute after:bottom-1.5 after:left-5 after:right-5 after:h-px after:origin-left after:scale-x-0 after:bg-black after:transition-transform after:duration-300 hover:after:scale-x-100";

export function NavBar() {
  const navigate = useNavigate();
  const { data: session } = useSessionQuery();
  const logoutMutation = useLogoutMutation();

  const role = session?.role ?? null;
  const user = session?.user ?? null;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/");
  };

  return (
    <nav className="relative flex items-center justify-between gap-4 bg-transparent px-6 py-4 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
      <Link
        to="/"
        className="shrink-0 font-grotesk text-2xl font-semibold tracking-[-1.44px] text-black"
      >
        Intervu
      </Link>

      {/* Centered on the nav itself (not a grid column) so it stays truly
          centered regardless of how wide the logo vs. the auth button are. */}
      <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-3 lg:flex">
        {role === "recruiter" ? (
          <>
            <Link to="/recruiter/post-job" className={NAV_LINK_CLASS}>
              Post Job
            </Link>

            <Link to="/recruiter/candidates" className={NAV_LINK_CLASS}>
              View Candidates
            </Link>
          </>
        ) : (
          <>
            <Link to="/jobs" className={NAV_LINK_CLASS}>
              Jobs
            </Link>

            <Link to="/assistant" className={NAV_LINK_CLASS}>
              AI Assistant
            </Link>

            <Link to="/applications" className={NAV_LINK_CLASS}>
              Applications
            </Link>
          </>
        )}

        <Link to="/jobs#faq" className={NAV_LINK_CLASS}>
          FAQ
        </Link>

        {role === "candidate" && <NotificationBell />}
      </div>

      {user ? (
        <ProfileMenu user={user} onLogout={handleLogout} />
      ) : (
        <Link
          to="/login"
          className="flex h-10 shrink-0 items-center rounded-full bg-black px-5 font-grotesk text-sm font-medium text-white transition-colors hover:bg-black/80"
        >
          Log in / Sign up
        </Link>
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
  onLogout,
}: {
  user: NavUser;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0 justify-self-end">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 transition-colors hover:bg-black/5"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-black/10 font-grotesk text-xs font-semibold text-black">
          {initials(user)}
        </span>
        <span className="hidden font-grotesk text-sm font-medium text-black/90 sm:inline">
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
          <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-black/10 bg-[#f7f7f8] p-1.5 shadow-2xl">
            <div className="truncate px-3 py-2 text-xs text-black/40">{user.email}</div>
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-black transition-colors hover:bg-black/10"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-black transition-colors hover:bg-black/10"
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
