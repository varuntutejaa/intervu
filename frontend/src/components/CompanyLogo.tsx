import { useState } from "react";

// Falls back to the company's initial on a plain circle if there's no logo
// URL, or if the URL 404s/fails to load — never leaves a broken image icon
// in the layout.
export function CompanyLogo({
  src,
  company,
  size = 44,
  rounded = "circle",
}: {
  src: string | null;
  company: string;
  size?: number;
  rounded?: "circle" | "square";
}) {
  const [failed, setFailed] = useState(false);
  const dimension = { width: size, height: size };
  const shape = rounded === "circle" ? "rounded-full" : "rounded-lg";

  if (!src || failed) {
    return (
      <div
        style={dimension}
        className={`flex shrink-0 items-center justify-center ${shape} border border-black/10 bg-black/5 font-grotesk text-sm font-semibold text-black/50`}
      >
        {company.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${company} logo`}
      style={dimension}
      onError={() => setFailed(true)}
      className={`shrink-0 ${shape} border border-black/10 bg-white object-contain p-1.5`}
    />
  );
}
