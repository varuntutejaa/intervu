import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { NavBar } from "../../../components/chrome/NavBar";
import { AuroraRoleQuestion } from "../../../components/aurora/AuroraLayout";
import { useAuthFlowStore } from "../../auth/store";
import { useSessionQuery } from "../../auth/api";
import type { Role } from "../../../types";
import { useParseResumeMutation, useSaveProfileMutation } from "../api";
import {
  candidateProfileSchema,
  mergeParsedResumeFields,
  recruiterProfileSchema,
  EMPTY_CANDIDATE_VALUES,
  EMPTY_RECRUITER_VALUES,
  type CandidateProfileFormValues,
  type RecruiterProfileFormValues,
} from "../schema";
import { AvatarPicker } from "../components/AvatarPicker";
import { CandidateProfileFields } from "../components/CandidateProfileFields";
import { RecruiterProfileFields } from "../components/RecruiterProfileFields";
import { readFileAsDataUrl } from "../../../lib/files";

function isRole(value: string | null): value is Role {
  return value === "candidate" || value === "recruiter";
}

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pendingRole, setPendingRole } = useAuthFlowStore();
  const { data: session } = useSessionQuery();
  const roleFromQuery = searchParams.get("role");
  const role = isRole(roleFromQuery) ? roleFromQuery : pendingRole;

  const saveProfileMutation = useSaveProfileMutation();
  const parseResumeMutation = useParseResumeMutation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const candidateForm = useForm<CandidateProfileFormValues>({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: EMPTY_CANDIDATE_VALUES,
  });
  const recruiterForm = useForm<RecruiterProfileFormValues>({
    resolver: zodResolver(recruiterProfileSchema),
    defaultValues: EMPTY_RECRUITER_VALUES,
  });

  const handleSubmit = async () => {
    if (!role) return;

    if (role === "candidate") {
      const isValid = await candidateForm.trigger();
      if (!isValid) return;
      const values = candidateForm.getValues();
      const fields = {
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        location: values.location,
        desiredRole: values.desiredRole,
        experience: values.experience,
        currentStatus: values.currentStatus,
        bio: values.bio,
        technicalSkills: values.technicalSkills,
        softSkills: values.softSkills,
        linkedinUrl: values.linkedinUrl,
        githubUrl: values.githubUrl,
        portfolioUrl: values.portfolioUrl,
        resumeFilename: values.resume?.name,
        resumeData: values.resume ? await readFileAsDataUrl(values.resume) : undefined,
        resumeUploadedAt: values.resume ? new Date().toISOString() : undefined,
        avatarUrl: avatarUrl ?? undefined,
      };
      try {
        await saveProfileMutation.mutateAsync({ role, fields });
        navigate("/");
      } catch {
        // surfaced via saveProfileMutation.error below
      }
      return;
    }

    const isValid = await recruiterForm.trigger();
    if (!isValid) return;
    const values = recruiterForm.getValues();
    const fields = {
      companyName: values.companyName,
      jobTitle: values.jobTitle,
      companyWebsite: values.companyWebsite,
      companySize: values.companySize,
      industry: values.industry,
      companyBio: values.companyBio,
      companyLogoFilename: values.companyLogo?.name,
      avatarUrl: avatarUrl ?? undefined,
    };
    try {
      await saveProfileMutation.mutateAsync({ role, fields });
      navigate("/");
    } catch {
      // surfaced via saveProfileMutation.error below
    }
  };

  const handleAutofillFromResume = async (file: File) => {
    try {
      const resumeData = await readFileAsDataUrl(file);
      const { fields } = await parseResumeMutation.mutateAsync(resumeData);
      candidateForm.reset(mergeParsedResumeFields(candidateForm.getValues(), fields));
    } catch {
      // surfaced via parseResumeMutation.error below
    }
  };

  const handleSkip = async () => {
    if (!role) return;
    try {
      await saveProfileMutation.mutateAsync({ role, fields: {} });
      navigate("/");
    } catch {
      // surfaced via saveProfileMutation.error below
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="fixed inset-x-0 top-0 z-20">
        <NavBar />
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-6 pb-10 pt-28 sm:px-8 md:px-12 lg:px-16 xl:px-24">
        {role === null ? (
          <AuroraRoleQuestion
            title="How will you use Intervu?"
            description="This just tailors what you see next — you can't get this wrong."
            onSelect={setPendingRole}
          />
        ) : (
          <>
            <div>
              <h1 className="font-fustat text-3xl font-bold text-black">Set up your profile</h1>
              <p className="mt-2 text-sm text-black/40">
                {role === "candidate"
                  ? "Tell us a bit about your experience so we can find the right roles."
                  : "Tell us a bit about your company so we can find the right candidates."}
              </p>
            </div>

            {session?.user && (
              <AvatarPicker email={session.user.email} avatarUrl={avatarUrl} onChange={setAvatarUrl} />
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-6"
            >
              {role === "candidate" ? (
                <CandidateProfileFields
                  control={candidateForm.control}
                  errors={candidateForm.formState.errors}
                  onAutofillFromResume={handleAutofillFromResume}
                  isAutofilling={parseResumeMutation.isPending}
                  autofillError={parseResumeMutation.error?.message}
                />
              ) : (
                <RecruiterProfileFields
                  control={recruiterForm.control}
                  errors={recruiterForm.formState.errors}
                />
              )}

              {saveProfileMutation.error && (
                <p className="text-sm text-red-600">{saveProfileMutation.error.message}</p>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={saveProfileMutation.isPending}
                  className="h-14 flex-1 rounded-xl border border-black/10 font-semibold text-black/60 transition-colors hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Skip for now
                </button>
                <button
                  type="submit"
                  disabled={saveProfileMutation.isPending}
                  className="h-14 flex-1 rounded-xl bg-black font-semibold text-white transition-all hover:bg-black/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saveProfileMutation.isPending ? "Saving…" : "Save & Continue"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
