// Indian digit grouping (e.g. 800000 -> "8,00,000") via the en-IN locale —
// every job salary in this app is quoted in rupees, per annum.
export function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const range = min && max ? `${fmt(min)} – ${fmt(max)}` : fmt((min ?? max) as number);
  return `${range} per annum`;
}

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
const WEEK = DAY * 7;
const MONTH = DAY * 30;

export function formatRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  if (diffMs < HOUR) {
    const mins = Math.max(1, Math.round(diffMs / MINUTE));
    return mins === 1 ? "1 min ago" : `${mins} mins ago`;
  }
  if (diffMs < DAY) {
    const hrs = Math.round(diffMs / HOUR);
    return hrs === 1 ? "1 hour ago" : `${hrs} hours ago`;
  }
  if (diffMs < WEEK) {
    const days = Math.round(diffMs / DAY);
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }
  if (diffMs < MONTH) {
    const weeks = Math.round(diffMs / WEEK);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  const months = Math.max(1, Math.round(diffMs / MONTH));
  return months === 1 ? "1 month ago" : `${months} months ago`;
}
