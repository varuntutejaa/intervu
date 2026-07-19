import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Not using vitest's `globals: true`, so RTL's own afterEach-based auto
// cleanup never registers — without this, every test's rendered DOM stays
// mounted into the next test's document.
afterEach(cleanup);
