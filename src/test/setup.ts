import "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
import type { AxeMatchers } from "vitest-axe";
import * as axeMatchers from "vitest-axe/matchers";

// vitest-axe ships an empty `extend-expect` entry, so register the matchers manually.
expect.extend(axeMatchers);

declare module "vitest" {
  interface Assertion<T> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

// JSDOM 26 lacks ResizeObserver; Radix Tooltip needs it via @radix-ui/react-use-size.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserverPolyfill {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
