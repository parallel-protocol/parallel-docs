import { describe, expect, it, vi } from "vitest";
import { runPipeline } from "../scripts/crawler/pipeline";
import type { ImageCache, TransformContext, Transformer } from "../scripts/crawler/types";

const noopCache: ImageCache = {
  has: () => false,
  get: () => undefined,
  set: () => undefined,
};

const ctx: TransformContext = {
  url: "https://docs.eusd.xyz/test",
  outputPath: "docs/pages/test.mdx",
  imagesDir: "docs/public/images",
  cache: noopCache,
};

describe("runPipeline", () => {
  it("applies sync transformers in order", async () => {
    const upper: Transformer = { name: "upper", apply: (s) => s.toUpperCase() };
    const exclaim: Transformer = { name: "exclaim", apply: (s) => `${s}!` };

    const out = await runPipeline("hello", ctx, [upper, exclaim]);
    expect(out).toBe("HELLO!");
  });

  it("awaits async transformers", async () => {
    const asyncReverse: Transformer = {
      name: "asyncReverse",
      apply: async (s) => s.split("").reverse().join(""),
    };

    const out = await runPipeline("abc", ctx, [asyncReverse]);
    expect(out).toBe("cba");
  });

  it("preserves transformer ordering (mix sync/async)", async () => {
    const calls: string[] = [];
    const t1: Transformer = {
      name: "t1",
      apply: (s) => {
        calls.push("t1");
        return `${s}-1`;
      },
    };
    const t2: Transformer = {
      name: "t2",
      apply: async (s) => {
        calls.push("t2");
        return `${s}-2`;
      },
    };
    const t3: Transformer = {
      name: "t3",
      apply: (s) => {
        calls.push("t3");
        return `${s}-3`;
      },
    };

    const out = await runPipeline("X", ctx, [t1, t2, t3]);
    expect(out).toBe("X-1-2-3");
    expect(calls).toEqual(["t1", "t2", "t3"]);
  });

  it("returns the source unchanged when no transformers are provided", async () => {
    const input = "# Title\n\nBody.";
    const out = await runPipeline(input, ctx, []);
    expect(out).toBe(input);
  });

  it("propagates errors from transformers", async () => {
    const failing: Transformer = {
      name: "failing",
      apply: () => {
        throw new Error("boom");
      },
    };

    await expect(runPipeline("input", ctx, [failing])).rejects.toThrow("boom");
  });
});
