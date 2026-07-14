export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Stored inline as a data: URL (no S3/object storage wired up yet), so caps
// stay conservative to keep profile payloads reasonable.
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const MAX_RESUME_BYTES = 4 * 1024 * 1024;
