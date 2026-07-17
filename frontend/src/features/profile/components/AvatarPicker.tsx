import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { MAX_AVATAR_BYTES, readFileAsDataUrl } from "../../../lib/files";

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function AvatarPicker({
  email,
  avatarUrl,
  onChange,
}: {
  email: string;
  avatarUrl: string | null;
  onChange: (dataUrl: string) => void;
}) {
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = async (file: File | null) => {
    setError("");
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Please choose an image under 2MB.");
      return;
    }
    onChange(await readFileAsDataUrl(file));
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handlePick(e.target.files?.[0] ?? null)}
        />
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className="h-16 w-16 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-brand-gray font-grotesk text-lg font-semibold text-white">
            {initials(email)}
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Change profile picture"
          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white text-black transition-colors hover:bg-white/80"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">{email}</p>
        <p className="text-xs text-white/40">Profile picture (optional)</p>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
