import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { APPLICATION_STATUSES, useCreateApplicationMutation } from "../api";
import { addApplicationSchema, type AddApplicationFormValues } from "../schema";

export function AddApplicationModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const createMutation = useCreateApplicationMutation();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddApplicationFormValues>({
    resolver: zodResolver(addApplicationSchema),
    defaultValues: {
      company: "",
      position: "",
      appliedOn: new Date().toISOString().slice(0, 10),
      status: "Applied",
    },
  });

  const onSubmit = async (values: AddApplicationFormValues) => {
    try {
      await createMutation.mutateAsync(values);
      onAdded();
    } catch {
      // surfaced via createMutation.error below
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="fixed inset-0 bg-black/70" />

      <div className="relative w-[90vw] max-w-md rounded-2xl border border-white/10 bg-[#1c1c1e] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="pr-8 font-fustat text-xl font-bold text-white">Log an application</h2>
        <p className="mt-1 text-sm text-white/50">Track an application you made outside Intervu.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-white/50">Company</label>
            <Controller
              name="company"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Acme Inc."
                  className="mt-1.5 h-10 w-full rounded-lg border-none bg-brand-gray px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              )}
            />
            {errors.company && <p className="mt-1 text-xs text-red-400">{errors.company.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50">Position</label>
            <Controller
              name="position"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Frontend Engineer"
                  className="mt-1.5 h-10 w-full rounded-lg border-none bg-brand-gray px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              )}
            />
            {errors.position && <p className="mt-1 text-xs text-red-400">{errors.position.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/50">Applied on</label>
              <Controller
                name="appliedOn"
                control={control}
                render={({ field }) => (
                  <input
                    type="date"
                    value={field.value}
                    onChange={field.onChange}
                    className="mt-1.5 h-10 w-full rounded-lg border-none bg-brand-gray px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50">Status</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <select
                    value={field.value}
                    onChange={field.onChange}
                    className="mt-1.5 h-10 w-full rounded-lg border-none bg-brand-gray px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>

          {createMutation.error && <p className="text-sm text-red-400">{createMutation.error.message}</p>}

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="mt-3 h-12 w-full rounded-xl bg-white font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {createMutation.isPending ? "Saving…" : "Add application"}
          </button>
        </form>
      </div>
    </div>
  );
}
