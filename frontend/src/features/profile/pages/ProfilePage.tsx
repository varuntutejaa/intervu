import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { NavBar } from "../../../components/chrome/NavBar";
import { readFileAsDataUrl } from "../../../lib/files";
import {
  useDeleteResumeMutation,
  useParseResumeMutation,
  useProfileQuery,
  useSaveProfileMutation,
} from "../api";
import { AvatarPicker } from "../components/AvatarPicker";
import { CandidateProfileFields } from "../components/CandidateProfileFields";
import { RecruiterProfileFields } from "../components/RecruiterProfileFields";
import { ResumeLibrarySection } from "../components/ResumeLibrarySection";
import {
  candidateProfileSchema,
  mergeParsedResumeFields,
  recruiterProfileSchema,
  EMPTY_CANDIDATE_VALUES,
  EMPTY_RECRUITER_VALUES,
  type CandidateProfileFormValues,
  type RecruiterProfileFormValues,
} from "../schema";

export default function ProfilePage() {
  const profileQuery = useProfileQuery();
  const saveProfileMutation = useSaveProfileMutation();
  const deleteResumeMutation = useDeleteResumeMutation();
  const parseResumeMutation = useParseResumeMutation();

  const profile = profileQuery.data?.profile ?? null;
  const role = profile?.role ?? "candidate";

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const candidateForm = useForm<CandidateProfileFormValues>({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: EMPTY_CANDIDATE_VALUES,
  });
  const recruiterForm = useForm<RecruiterProfileFormValues>({
    resolver: zodResolver(recruiterProfileSchema),
    defaultValues: EMPTY_RECRUITER_VALUES,
  });

  useEffect(() => {
    if (!profile) return;
    setAvatarUrl(profile.avatar_url);
    candidateForm.reset({
      fullName: profile.full_name ?? "",
      phoneNumber: profile.phone_number ?? "",
      location: profile.location ?? "",
      desiredRole: profile.desired_role ?? "",
      experience: profile.experience ?? "",
      currentStatus: profile.current_status ?? "",
      bio: profile.bio ?? "",
      technicalSkills: profile.technical_skills ?? [],
      softSkills: profile.soft_skills ?? [],
      linkedinUrl: profile.linkedin_url ?? "",
      githubUrl: profile.github_url ?? "",
      portfolioUrl: profile.portfolio_url ?? "",
      resume: null,
    });
    recruiterForm.reset({
      companyName: profile.company_name ?? "",
      jobTitle: profile.job_title ?? "",
      companyWebsite: profile.company_website ?? "",
      companySize: profile.company_size ?? "",
      industry: profile.industry ?? "",
      companyBio: profile.company_bio ?? "",
      companyLogo: null,
    });
    // candidateForm/recruiterForm are stable across renders (react-hook-form
    // memoizes them internally) — only re-run this when the fetched profile changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleDeleteResume = async () => {
    try {
      await deleteResumeMutation.mutateAsync();
      candidateForm.setValue("resume", null);
    } catch {
      // surfaced via deleteResumeMutation.error below
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

  const handleSave = async () => {
    setSaved(false);

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
        resumeFilename: values.resume?.name ?? profile?.resume_filename ?? undefined,
        resumeData: values.resume
          ? await readFileAsDataUrl(values.resume)
          : (profile?.resume_data ?? undefined),
        // Only bump the upload date when a genuinely new file was picked —
        // otherwise every save would reset it even when the resume is untouched.
        resumeUploadedAt: values.resume
          ? new Date().toISOString()
          : (profile?.resume_uploaded_at ?? undefined),
        avatarUrl,
      };
      try {
        await saveProfileMutation.mutateAsync({ role, fields });
        setSaved(true);
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
      companyLogoFilename: values.companyLogo?.name ?? profile?.company_logo_filename ?? undefined,
      avatarUrl,
    };
    try {
      await saveProfileMutation.mutateAsync({ role, fields });
      setSaved(true);
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
        <div>
          <h1 className="font-fustat text-3xl font-bold text-black">Your profile</h1>
          <p className="mt-2 text-sm text-black/40">
            Keep this up to date so your matches stay accurate.
          </p>
        </div>

        {profileQuery.isPending && <p className="text-sm text-black/50">Loading your profile…</p>}

        {profileQuery.isError && (
          <div>
            <p className="text-sm text-red-600">Couldn't load your profile. Is the API running?</p>
            <button
              type="button"
              onClick={() => profileQuery.refetch()}
              className="mt-3 text-xs font-medium text-black/60 underline underline-offset-2 hover:text-black"
            >
              Try again
            </button>
          </div>
        )}

        {profileQuery.isSuccess && profile === null && (
          <div>
            <h2 className="text-xl font-medium tracking-tight text-black">No profile yet</h2>
            <p className="mt-2 text-sm text-black/40">You haven't set up your profile yet.</p>
            <Link
              to="/profile-setup"
              className="mt-4 inline-flex h-11 items-center rounded-xl bg-black px-5 font-semibold text-white transition-all hover:bg-black/90 active:scale-[0.98]"
            >
              Complete your profile
            </Link>
          </div>
        )}

        {profile && (
          <>
            <AvatarPicker email={profile.email} avatarUrl={avatarUrl} onChange={setAvatarUrl} />
            <p className="-mt-4 text-xs text-black/40">
              {role === "candidate" ? "Candidate" : "Recruiter"}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="space-y-6"
            >
              {role === "candidate" ? (
                <CandidateProfileFields
                  control={candidateForm.control}
                  errors={candidateForm.formState.errors}
                  existingResumeFilename={profile.resume_filename ?? undefined}
                  existingResumeData={profile.resume_data ?? undefined}
                  existingResumeUploadedAt={profile.resume_uploaded_at}
                  onDeleteResume={handleDeleteResume}
                  isDeletingResume={deleteResumeMutation.isPending}
                  deleteResumeError={deleteResumeMutation.error?.message}
                  onAutofillFromResume={handleAutofillFromResume}
                  isAutofilling={parseResumeMutation.isPending}
                  autofillError={parseResumeMutation.error?.message}
                />
              ) : (
                <RecruiterProfileFields
                  control={recruiterForm.control}
                  errors={recruiterForm.formState.errors}
                  existingCompanyLogoFilename={profile.company_logo_filename ?? undefined}
                />
              )}

              {saveProfileMutation.error && (
                <p className="text-sm text-red-600">{saveProfileMutation.error.message}</p>
              )}
              {saved && <p className="text-sm text-emerald-600">Saved.</p>}

              <button
                type="submit"
                disabled={saveProfileMutation.isPending}
                className="h-14 w-full rounded-xl bg-black font-semibold text-white transition-all hover:bg-black/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saveProfileMutation.isPending ? "Saving…" : "Save changes"}
              </button>
            </form>

            {role === "candidate" && <ResumeLibrarySection />}
          </>
        )}
      </div>
    </div>
  );
}
