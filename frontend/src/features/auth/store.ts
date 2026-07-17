import { create } from "zustand";
import type { Role } from "../../types";

// The only genuinely global client-only state left once TanStack Query owns
// the session: which role (candidate/recruiter) someone picked before an
// account/session exists to hang it off of — shared across /login, /signup,
// and /profile-setup. See README "Global state management" for why this is
// a Zustand store rather than a bigger tool or plain Context.
type AuthFlowState = {
  pendingRole: Role | null;
  setPendingRole: (role: Role | null) => void;
};

export const useAuthFlowStore = create<AuthFlowState>((set) => ({
  pendingRole: null,
  setPendingRole: (role) => set({ pendingRole: role }),
}));
