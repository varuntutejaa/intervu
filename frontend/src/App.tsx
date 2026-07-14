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
  // The logged-in account's actual role, from their saved profile — distinct
  // from `role` above, which only exists during the pre-auth signup/login flow.
  const [accountRole, setAccountRole] = useState<Role | null>(null);

  const refreshUser = async () => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setAccountRole(data.role);
    } else {
      setUser(null);
      setAccountRole(null);
    }
  };

  // Pick up an existing session on first load (e.g. the tab was reopened).
  useEffect(() => {
    refreshUser();
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
    await refreshUser();
    onNavigateHome();
  };

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    onNavigateHome();
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
    role: accountRole,
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
        onComplete={onNavigateHome}
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
