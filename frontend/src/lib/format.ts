// Indian digit grouping (e.g. 800000 -> "8,00,000") via the en-IN locale —
// every job salary in this app is quoted in rupees, per annum.
export function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const range = min && max ? `${fmt(min)} – ${fmt(max)}` : fmt((min ?? max) as number);
  return `${range} per annum`;
}
