import { useEffect, useRef, useState } from "react";
import { SearchX, X } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Pager } from "../../../components/Pager";
import { NavBar } from "../../../components/chrome/NavBar";
import { useSessionQuery } from "../../auth/api";
import { useAppliedJobIdsQuery, useApplyToJobMutation } from "../../applications/api";
import { useJobsQuery, useTrendingCompaniesQuery } from "../api";
import { CompanyCard } from "../components/CompanyCard";
import { FaqSection } from "../components/FaqSection";
import { JobCard } from "../components/JobCard";
import { JobCardSkeleton } from "../components/JobCardSkeleton";
import { EMPTY_FACETS, JobFiltersSidebar, type JobFacetState } from "../components/JobFiltersSidebar";
import { JobListRow } from "../components/JobListRow";
import { JobSearchBar } from "../components/JobSearchBar";
import { ResumePickerModal } from "../components/ResumePickerModal";
import { useSavedJobs } from "../hooks/useSavedJobs";

function facetsFromParams(params: URLSearchParams): JobFacetState {
  const split = (key: string) => (params.get(key) ? params.get(key)!.split(",") : []);
  return {
    experience: split("experience"),
    workMode: split("workMode"),
    jobType: split("jobType"),
    minSalary: params.get("minSalary") ?? "",
    maxSalary: params.get("maxSalary") ?? "",
  };
}

export default function JobsPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [searchParams] = useSearchParams();
  const { data: session } = useSessionQuery();
  const role = session?.role ?? null;
  const savedJobs = useSavedJobs();

  // Seeds from a nav-search redirect (/jobs?q=...) — read once on mount,
  // not kept in sync afterward, since the search bar above is what owns
  // this value from then on.
  const [searchInput, setSearchInput] = useState(() => searchParams.get("q") ?? "");
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [locationInput, setLocationInput] = useState(() => searchParams.get("location") ?? "");
  const [location, setLocation] = useState(() => searchParams.get("location") ?? "");
  const [facets, setFacets] = useState<JobFacetState>(() => facetsFromParams(searchParams));
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounce the search bar's live typing so every keystroke doesn't fire a
  // request — facet checkboxes apply immediately since those only change on
  // deliberate selection. Pressing Enter/Search skips the wait.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    const id = setTimeout(() => setLocation(locationInput), 300);
    return () => clearTimeout(id);
  }, [locationInput]);

  // Clicking "FAQ" in the nav links here with a #faq hash — same-route
  // navigations don't trigger the browser's native hash-scroll, so this
  // does it manually on both initial load and later hash-only navigations.
  useEffect(() => {
    if (routerLocation.hash === "#faq") {
      document.getElementById("faq")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [routerLocation.hash]);

  // Any filter change starts back at page 1 — staying on page 4 of a
  // filtered-down result set would just show an empty page.
  useEffect(() => {
    setPage(1);
  }, [search, location, facets]);

  const jobsQuery = useJobsQuery({
    q: search,
    location,
    jobType: facets.jobType,
    workMode: facets.workMode,
    experience: facets.experience,
    minSalary: facets.minSalary ? Number(facets.minSalary) : undefined,
    maxSalary: facets.maxSalary ? Number(facets.maxSalary) : undefined,
    page,
    pageSize: 6,
  });
  const appliedJobIdsQuery = useAppliedJobIdsQuery(role === "candidate");
  const applyMutation = useApplyToJobMutation();
  const [pendingApplyJobId, setPendingApplyJobId] = useState<number | null>(null);

  // Independent of the sidebar filters — these are page-level spotlights,
  // not a view of the current search, so they're fetched unfiltered.
  const trendingCompaniesQuery = useTrendingCompaniesQuery(4);
  const trendingRolesQuery = useJobsQuery({ page: 1, pageSize: 5 });

  const jobs = jobsQuery.data?.items ?? [];
  const trendingCompanies = trendingCompaniesQuery.data ?? [];
  const trendingRoles = trendingRolesQuery.data?.items ?? [];
  const appliedJobIds = appliedJobIdsQuery.data ?? new Set<number>();

  const clearAllFilters = () => {
    setSearchInput("");
    setSearch("");
    setLocationInput("");
    setLocation("");
    setFacets(EMPTY_FACETS);
  };

  // Filtering "All open roles" by company happens in-place (setting the
  // search state directly) rather than via navigate() — we're already
  // mounted on /jobs, so a navigate() to the same route with a new ?q=
  // wouldn't re-run the useState initializer that seeds the search box.
  const handleCompanyClick = (company: string) => {
    setSearchInput(company);
    setSearch(company);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleConfirmApply = (resumeId: number | null) => {
    if (pendingApplyJobId === null) return;
    applyMutation.mutate(
      { jobId: pendingApplyJobId, resumeId },
      { onSuccess: () => setPendingApplyJobId(null) },
    );
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="fixed inset-x-0 top-0 z-20">
        <NavBar />
      </div>

      <JobSearchBar
        query={searchInput}
        location={locationInput}
        onQueryChange={setSearchInput}
        onLocationChange={setLocationInput}
        onSubmit={() => {
          setSearch(searchInput);
          setLocation(locationInput);
        }}
        onQuickSearch={(q, loc) => {
          setSearchInput(q);
          setSearch(q);
          setLocationInput(loc);
          setLocation(loc);
        }}
        onToggleFilters={() => setMobileFiltersOpen(true)}
      />

      <div className="mx-auto flex w-full max-w-[1400px] items-start gap-8 px-6 pb-16 sm:px-10 lg:px-16 xl:px-24">
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div className="sticky top-28">
            <JobFiltersSidebar facets={facets} onChange={setFacets} onClearAll={clearAllFilters} />
          </div>
        </aside>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black/40"
            />
            <div className="fixed inset-y-0 right-0 z-40 w-[85vw] max-w-sm overflow-y-auto bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="font-fustat text-lg font-semibold text-black">Filters</h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-black/50 transition-colors hover:bg-black/5 hover:text-black"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6">
                <JobFiltersSidebar facets={facets} onChange={setFacets} onClearAll={clearAllFilters} />
              </div>
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1 pt-10">
          {trendingCompanies.length > 0 && (
            <div className="mb-10">
              <h2 className="font-fustat text-lg font-bold text-black">Trending companies hiring now</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {trendingCompanies.map((company) => (
                  <CompanyCard
                    key={company.company}
                    company={company}
                    onOpen={() => handleCompanyClick(company.company)}
                  />
                ))}
              </div>
            </div>
          )}

          <h2 ref={resultsRef} className="scroll-mt-28 font-fustat text-lg font-bold text-black">
            All open roles
          </h2>

          {jobsQuery.isPending && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          )}

          {jobsQuery.isError && (
            <p className="mt-4 text-sm text-red-600">Couldn't load jobs. Is the API running?</p>
          )}

          {jobsQuery.isSuccess && jobs.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/5 text-black/30">
                <SearchX className="h-6 w-6" />
              </div>
              <p className="font-fustat text-base font-semibold text-black">No roles match your filters</p>
              <p className="max-w-xs text-sm text-black/50">Try widening your search or clearing a few filters.</p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-1 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-soft"
              >
                Clear filters
              </button>
            </div>
          )}

          {jobs.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isCandidate={role === "candidate"}
                  isApplied={appliedJobIds.has(job.id)}
                  isApplying={applyMutation.isPending && applyMutation.variables?.jobId === job.id}
                  onApply={() => setPendingApplyJobId(job.id)}
                  isSaved={savedJobs.isSaved(job.id)}
                  onToggleSave={() => savedJobs.toggle(job.id)}
                  onOpen={() => navigate(`/jobs/${job.id}`)}
                />
              ))}
            </div>
          )}

          {jobsQuery.data && (
            <Pager page={jobsQuery.data.page} totalPages={jobsQuery.data.totalPages} onPageChange={setPage} />
          )}

          {trendingRoles.length > 0 && (
            <div className="mt-14">
              <h2 className="font-fustat text-lg font-bold text-black">Trending roles</h2>
              <div className="mt-2 divide-y divide-black/10 border-t border-black/10">
                {trendingRoles.map((job) => (
                  <JobListRow
                    key={job.id}
                    job={job}
                    isCandidate={role === "candidate"}
                    isApplied={appliedJobIds.has(job.id)}
                    isApplying={applyMutation.isPending && applyMutation.variables?.jobId === job.id}
                    onApply={() => setPendingApplyJobId(job.id)}
                    isSaved={savedJobs.isSaved(job.id)}
                    onToggleSave={() => savedJobs.toggle(job.id)}
                    onOpen={() => navigate(`/jobs/${job.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <FaqSection />

      {pendingApplyJobId !== null && (
        <ResumePickerModal
          onClose={() => setPendingApplyJobId(null)}
          onConfirm={handleConfirmApply}
          isSubmitting={applyMutation.isPending}
        />
      )}
    </div>
  );
}
