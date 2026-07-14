import { useEffect, useState } from "react";
import type { NavUser } from "./components/LandingChrome";
import type { Role } from "./components/AuroraLayout";
import { useRoute } from "./lib/router";
import ApplicationsPage from "./pages/ApplicationsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import JobsPage from "./pages/JobsPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import PostJobPage from "./pages/PostJobPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import RecruiterDashboardPage from "./pages/RecruiterDashboardPage";
import SignupPage from "./pages/SignupPage";
import ViewCandidatesPage from "./pages/ViewCandidatesPage";

export default function App() {
  const { path, navigate } = useRoute();

  // Shared across login/signup so picking a role once doesn't ask again
  // when the person switches between the two flows.
  const [role, setRole] = useState<Role | null>(null);

  const [user, setUser] = useState<NavUser | null>(null);
  // The logged-in account's currently active profile — distinct from `role`
  // above, which only exists during the pre-auth signup/login flow. One
  // account can have both a candidate and a recruiter profile at once
  // (accountRoles lists which ones actually exist); accountRole is just
  // whichever one is "in view" right now.
  const [accountRole, setAccountRole] = useState<Role | null>(null);
  const [accountRoles, setAccountRoles] = useState<Role[]>([]);

  const refreshUser = async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setAccountRole(data.role);
      setAccountRoles(data.roles ?? []);
      return data;
    } else {
      setUser(null);
      setAccountRole(null);
      setAccountRoles([]);
      return null;
    }
  };

  // Pick up an existing session on first load (e.g. the tab was reopened).
  // Also covers landing back from an OAuth redirect: if the role picked at
  // login has no saved profile yet, send them to set one up instead of
  // showing the wrong dashboard (or LandingPage) for an incomplete account.
  useEffect(() => {
    refreshUser().then((data) => {
      if (data?.role && !data.roles?.includes(data.role)) {
        setRole(data.role);
        navigate("/profile-setup");
      }
    });
  }, []);

  const onNavigateHome = () => navigate("/");
  const onOpenLogin = () => navigate("/login");
  const onOpenSignup = () => navigate("/signup");
  const onOpenForgotPassword = () => navigate("/forgot-password");

  const onSignupComplete = async () => {
    await refreshUser();
    navigate("/profile-setup");
  };

  const onLoginSuccess = async () => {
    // `role` (picked on the login screen) is already set in state here —
    // if this account has no profile for it yet, authentication still
    // succeeded, so send them to set it up instead of refusing to log in.
    const data = await refreshUser();
    if (data?.role && !data.roles?.includes(data.role)) {
      navigate("/profile-setup");
    } else {
      onNavigateHome();
    }
  };

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    onNavigateHome();
  };

  // Switches which profile is active for an account that may hold both. If
  // the target role doesn't have a saved profile yet, this is how an
  // existing account adds it — send them to set one up instead of home.
  const onSwitchRole = async (targetRole: Role) => {
    await fetch("/api/auth/switch-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role: targetRole }),
    });
    const data = await refreshUser();
    setRole(targetRole);
    if (data?.roles?.includes(targetRole)) {
      onNavigateHome();
    } else {
      navigate("/profile-setup");
    }
  };

  // The navbar's "Log in / Sign up" is a fresh top-level entry point — it
  // should always ask candidate-or-recruiter, even if a role was picked
  // earlier in this session. Internal cross-links between the login and
  // signup pages themselves intentionally keep sharing `role` so switching
  // between them mid-flow doesn't ask twice.
  const onOpenAuthFresh = () => {
    setRole(null);
    navigate("/login");
  };

  const navProps = {
    onNavigateHome,
    onOpenJobs: () => navigate("/jobs"),
    onOpenApplications: () => navigate("/applications"),
    onScrollToFeatures: () => navigate("/#features"),
    onOpenAuth: onOpenAuthFresh,
    onOpenProfile: () => navigate("/profile"),
    onOpenProfileSetup: () => navigate("/profile-setup"),
    onOpenPostJob: () => navigate("/recruiter/post-job"),
    onOpenViewCandidates: () => navigate("/recruiter/candidates"),
    onSwitchRole,
    role: accountRole,
    roles: accountRoles,
    user,
    onLogout,
  };

  if (path === "/jobs") return <JobsPage {...navProps} />;
  if (path === "/applications") return <ApplicationsPage {...navProps} />;
  if (path === "/profile") return <ProfilePage {...navProps} />;
  if (path === "/recruiter/post-job") return <PostJobPage {...navProps} />;
  if (path === "/recruiter/candidates") return <ViewCandidatesPage {...navProps} />;
  if (path === "/signup") {
    return (
      <SignupPage
        onNavigateHome={onNavigateHome}
        onOpenLogin={onOpenLogin}
        role={role}
        onSelectRole={setRole}
        onSignupComplete={onSignupComplete}
      />
    );
  }
  if (path === "/profile-setup") {
    return (
      <ProfileSetupPage
        onNavigateHome={onNavigateHome}
        onComplete={async () => {
          // The profile that was just saved is what makes accountRole
          // correct — without this, completing setup for a role that
          // wasn't already active would land back on the wrong page (e.g.
          // a newly-added recruiter profile still routing to LandingPage).
          await refreshUser();
          onNavigateHome();
        }}
        role={role}
        onSelectRole={setRole}
      />
    );
  }
  if (path === "/forgot-password") {
    return (
      <ForgotPasswordPage onNavigateHome={onNavigateHome} onOpenLogin={onOpenLogin} />
    );
  }
  if (path === "/login") {
    return (
      <LoginPage
        onNavigateHome={onNavigateHome}
        onOpenSignup={onOpenSignup}
        onOpenForgotPassword={onOpenForgotPassword}
        onLoginSuccess={onLoginSuccess}
        role={role}
        onSelectRole={setRole}
      />
    );
  }

  if (user && accountRole === "recruiter") {
    return <RecruiterDashboardPage {...navProps} />;
  }

  return <LandingPage {...navProps} />;
}
