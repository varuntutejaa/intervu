export function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-black/10 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 shrink-0 rounded-full bg-black/10" />
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <div className="h-4 w-2/3 rounded bg-black/10" />
          <div className="h-3 w-1/2 rounded bg-black/10" />
        </div>
      </div>
      <div className="mt-4 flex gap-1.5">
        <div className="h-5 w-16 rounded-full bg-black/10" />
        <div className="h-5 w-14 rounded-full bg-black/10" />
        <div className="h-5 w-20 rounded-full bg-black/10" />
      </div>
      <div className="mt-3 h-3 w-full rounded bg-black/10" />
      <div className="mt-4 flex justify-end">
        <div className="h-8 w-20 rounded-full bg-black/10" />
      </div>
    </div>
  );
}
