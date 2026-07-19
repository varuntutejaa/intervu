const RATING_OPTIONS = [1, 2, 3, 4, 5];

export function RatingSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-black/50">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="mt-1.5 h-9 w-full rounded-lg border-none bg-brand-gray px-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
      >
        <option value="">Not rated</option>
        {RATING_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n} / 5
          </option>
        ))}
      </select>
    </div>
  );
}
