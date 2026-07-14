import { useCallback, useEffect, useState } from "react";

// Minimal pathname-based router — pushState on navigate, popstate listener
// for the back/forward buttons. Two routes don't warrant a routing library.
export function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    window.history.pushState(null, "", to);
    setPath(to);
    window.scrollTo(0, 0);
  }, []);

  return { path, navigate };
}
