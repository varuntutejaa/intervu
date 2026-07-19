import { ChevronRight, Flame, Laptop, Sparkles } from "lucide-react";
import { CompanyLogo } from "../../../components/CompanyLogo";
import type { TrendingCompany } from "../api";

const PILL_STYLES = {
  purple: "bg-accent/10 text-accent-soft",
  green: "bg-emerald-100 text-emerald-700",
  pink: "bg-pink-100 text-pink-700",
};

// Every signal here is derived from real job rows (counts, work mode,
// recency) — there's no employer/company entity in the schema, so unlike
// Wellfound's reference design there's nothing to source funding status or
// headcount from, and inventing those numbers would just be lying to users.
function trendingSignals(company: TrendingCompany): { icon: typeof Flame; label: string; style: keyof typeof PILL_STYLES }[] {
  const signals: { icon: typeof Flame; label: string; style: keyof typeof PILL_STYLES }[] = [];
  if (company.open_positions >= 3) signals.push({ icon: Flame, label: "Actively hiring", style: "purple" });
  if (company.has_remote) signals.push({ icon: Laptop, label: "Remote friendly", style: "green" });
  const daysSincePosted = (Date.now() - new Date(company.latest_posted_at).getTime()) / 86_400_000;
  if (daysSincePosted <= 7) signals.push({ icon: Sparkles, label: "New listing", style: "pink" });
  return signals;
}

export function CompanyCard({ company, onOpen }: { company: TrendingCompany; onOpen: () => void }) {
  const signals = trendingSignals(company);
  const titles = company.titles.slice(0, 2).join(", ");
  const extra = company.titles.length > 2 ? ` +${company.titles.length - 2} more` : "";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      className="cursor-pointer rounded-xl border border-black/10 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-black/20 hover:shadow-lg"
    >
      <div className="flex items-start gap-3">
        <CompanyLogo src={company.company_logo_url} company={company.company} size={40} rounded="square" />
        <div className="min-w-0">
          <p className="truncate font-fustat text-base font-bold text-black">{company.company}</p>
          <p className="mt-0.5 text-xs text-black/40">
            {company.open_positions} open position{company.open_positions === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-black/60">
        Hiring for {titles}
        {extra}
      </p>

      {signals.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {signals.map((signal) => (
            <span
              key={signal.label}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${PILL_STYLES[signal.style]}`}
            >
              <signal.icon className="h-3 w-3" />
              {signal.label}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
        <span className="text-xs text-black/40">
          {company.open_positions} open position{company.open_positions === 1 ? "" : "s"}
        </span>
        <ChevronRight className="h-4 w-4 text-black/30" />
      </div>
    </div>
  );
}
