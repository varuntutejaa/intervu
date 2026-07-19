async function parseBody(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body) {
    const message = (body as { error: unknown }).error;
    if (typeof message === "string") return message;
  }
  return fallback;
}

// Every backend response is wrapped as { success: true, data } (see
// backend's middleware/responseEnvelope.ts) — unwrap it here, once, so
// every feature's api.ts keeps consuming the plain resource/list shape it
// already expects instead of every call site unwrapping `.data` itself.
function extractData(body: unknown): unknown {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: unknown }).data;
  }
  return body;
}

const NETWORK_ERROR = "Couldn't reach the server. Is the API running?";

// Every page today hand-rolls this same fetch/parse/error-message dance —
// centralized here so every feature's api.ts stays a thin, consistent layer.
export async function apiFetch<T>(
  url: string,
  init: RequestInit & { fallbackError?: string } = {},
): Promise<T> {
  const { fallbackError = "Something went wrong. Try again.", ...requestInit } = init;

  let res: Response;
  try {
    res = await fetch(url, { credentials: "include", ...requestInit });
  } catch {
    throw new Error(NETWORK_ERROR);
  }

  const body = await parseBody(res);
  if (!res.ok) throw new Error(extractErrorMessage(body, fallbackError));
  return extractData(body) as T;
}

export function apiJson<T>(
  url: string,
  method: string,
  body?: unknown,
  fallbackError?: string,
): Promise<T> {
  return apiFetch<T>(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    fallbackError,
  });
}
