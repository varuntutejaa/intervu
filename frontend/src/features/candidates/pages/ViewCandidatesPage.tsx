import { NavBar } from "../../../components/chrome/NavBar";
import { useCandidatesQuery, type Candidate } from "../api";

function initials(candidate: Candidate) {
  return candidate.email.slice(0, 2).toUpperCase();
}

function formatUploadDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ViewCandidatesPage() {
  const candidatesQuery = useCandidatesQuery();
  const candidates = candidatesQuery.data ?? [];

  return (
    <div className="min-h-screen w-full bg-[#141414]">
      <div className="fixed inset-x-0 top-0 z-20">
        <NavBar />
      </div>

      <div className="mx-auto max-w-4xl px-6 pb-10 pt-28 sm:px-8 md:px-12 lg:px-20 xl:px-[120px]">
        <h1 className="font-fustat text-3xl font-bold text-white">Candidates</h1>
        <p className="mt-2 text-sm text-white/40">Everyone who's set up a candidate profile.</p>

        {candidatesQuery.isPending && (
          <p className="mt-6 text-sm text-white/50">Loading candidates…</p>
        )}
        {candidatesQuery.isError && (
          <p className="mt-6 text-sm text-red-400">Couldn't load candidates. Is the API running?</p>
        )}
        {candidatesQuery.isSuccess && candidates.length === 0 && (
          <p className="mt-6 text-sm text-white/40">No candidate profiles yet.</p>
        )}

        {candidates.length > 0 && (
          <div className="mt-6 space-y-4">
            {candidates.map((candidate) => (
              <div key={candidate.auth_sub} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start gap-4">
                  {candidate.avatar_url ? (
                    <img
                      src={candidate.avatar_url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-brand-gray font-grotesk text-sm font-semibold text-white">
                      {initials(candidate)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="font-fustat text-lg font-semibold text-white">
                        {candidate.full_name || candidate.desired_role || "Candidate"}
                      </p>
                      <p className="text-xs text-white/40">{candidate.email}</p>
                    </div>
                    <p className="text-sm text-white/40">
                      {[
                        candidate.desired_role,
                        candidate.location,
                        candidate.experience && `${candidate.experience} experience`,
                        candidate.current_status,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {candidate.phone_number && (
                      <p className="mt-0.5 text-xs text-white/40">{candidate.phone_number}</p>
                    )}

                    {candidate.bio && <p className="mt-2 text-sm text-white/70">{candidate.bio}</p>}

                    {candidate.technical_skills && candidate.technical_skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {candidate.technical_skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/60"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    {candidate.soft_skills && candidate.soft_skills.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {candidate.soft_skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/40"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      {candidate.linkedin_url && (
                        <a
                          href={candidate.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-white underline underline-offset-2"
                        >
                          LinkedIn
                        </a>
                      )}
                      {candidate.github_url && (
                        <a
                          href={candidate.github_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-white underline underline-offset-2"
                        >
                          GitHub
                        </a>
                      )}
                      {candidate.portfolio_url && (
                        <a
                          href={candidate.portfolio_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-white underline underline-offset-2"
                        >
                          Portfolio
                        </a>
                      )}
                      {candidate.resume_data ? (
                        <a
                          href={candidate.resume_data}
                          download={candidate.resume_filename ?? "resume"}
                          className="font-medium text-white underline underline-offset-2"
                        >
                          Resume: {candidate.resume_filename ?? "download"}
                        </a>
                      ) : (
                        candidate.resume_filename && (
                          <span className="text-white/40">Resume: {candidate.resume_filename}</span>
                        )
                      )}
                      {candidate.resume_uploaded_at && (
                        <span className="text-white/30">
                          Uploaded {formatUploadDate(candidate.resume_uploaded_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
