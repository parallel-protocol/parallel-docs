import { describe, expect, it } from "vitest";
import { steppers } from "../../scripts/crawler/transformers/steppers";
import type { ImageCache, TransformContext } from "../../scripts/crawler/types";

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

describe("steppers", () => {
  it("converts a stepper with H3 leading to a numbered list with bold titles", () => {
    const input = [
      "{% stepper %}",
      "{% step %}",
      "",
      "### Step One",
      "",
      "Body of step 1.",
      "{% endstep %}",
      "{% step %}",
      "",
      "### Step Two",
      "",
      "Body of step 2.",
      "{% endstep %}",
      "{% endstepper %}",
    ].join("\n");
    const out = steppers.apply(input, ctx) as string;

    expect(out).toContain("1. **Step One**");
    expect(out).toContain("   Body of step 1.");
    expect(out).toContain("2. **Step Two**");
    expect(out).toContain("   Body of step 2.");
    expect(out).not.toContain("{%");
  });

  it("preserves order across multiple steps", () => {
    const input = [
      "{% stepper %}",
      "{% step %}### A\n\nA body{% endstep %}",
      "{% step %}### B\n\nB body{% endstep %}",
      "{% step %}### C\n\nC body{% endstep %}",
      "{% endstepper %}",
    ].join("\n");
    const out = steppers.apply(input, ctx) as string;
    expect(out.indexOf("1. **A**")).toBeLessThan(out.indexOf("2. **B**"));
    expect(out.indexOf("2. **B**")).toBeLessThan(out.indexOf("3. **C**"));
  });

  it("indents body content with 3 spaces (markdown list continuation)", () => {
    const input = [
      "{% stepper %}",
      "{% step %}",
      "### Title",
      "",
      "Paragraph 1.",
      "",
      "Paragraph 2 with **bold** and `code`.",
      "{% endstep %}",
      "{% endstepper %}",
    ].join("\n");
    const out = steppers.apply(input, ctx) as string;
    expect(out).toContain("1. **Title**");
    expect(out).toContain("   Paragraph 1.");
    expect(out).toContain("   Paragraph 2 with **bold** and `code`.");
  });

  it("preserves bullet sub-lists inside steps (with 3-space indent)", () => {
    const input = [
      "{% stepper %}",
      "{% step %}",
      "### Step with list",
      "",
      "Intro line.",
      "",
      "* Bullet A",
      "* Bullet B",
      "{% endstep %}",
      "{% endstepper %}",
    ].join("\n");
    const out = steppers.apply(input, ctx) as string;
    expect(out).toContain("1. **Step with list**");
    expect(out).toContain("   Intro line.");
    expect(out).toContain("   * Bullet A");
    expect(out).toContain("   * Bullet B");
  });

  it("handles trailing whitespace before {% endstep %} (real GitBook quirk)", () => {
    // Source GitBook flashloan-module-integration step 3 a `  {% endstep %}`
    // (2 spaces leading). Le content capturé contient la trailing whitespace.
    const input = [
      "{% stepper %}",
      "{% step %}",
      "",
      "### Receiver",
      "",
      "Body.",
      "  {% endstep %}",
      "{% endstepper %}",
    ].join("\n");
    const out = steppers.apply(input, ctx) as string;
    expect(out).toContain("1. **Receiver**");
    expect(out).toContain("   Body.");
    expect(out).not.toContain("{%");
  });

  it("falls back when there is no leading H3 in the step", () => {
    const input = [
      "{% stepper %}",
      "{% step %}",
      "Just a plain paragraph.",
      "{% endstep %}",
      "{% endstepper %}",
    ].join("\n");
    const out = steppers.apply(input, ctx) as string;
    expect(out).toContain("1. Just a plain paragraph.");
    expect(out).not.toContain("**");
  });

  it("handles multiple steppers in one document independently", () => {
    const input = [
      "First stepper:",
      "",
      "{% stepper %}",
      "{% step %}### A1\n\nBody A1.{% endstep %}",
      "{% step %}### A2\n\nBody A2.{% endstep %}",
      "{% endstepper %}",
      "",
      "Middle text.",
      "",
      "Second stepper:",
      "",
      "{% stepper %}",
      "{% step %}### B1\n\nBody B1.{% endstep %}",
      "{% endstepper %}",
    ].join("\n");
    const out = steppers.apply(input, ctx) as string;
    expect(out).toContain("1. **A1**");
    expect(out).toContain("2. **A2**");
    // Second stepper restarts at 1
    expect(out.match(/1\. \*\*B1\*\*/)).toBeTruthy();
    expect(out).toContain("Middle text.");
  });

  it("returns source unchanged for content without steppers", () => {
    const input = "# Plain page\n\nNo steppers here.\n\n1. Existing list\n2. Item.";
    expect(steppers.apply(input, ctx)).toBe(input);
  });

  it("strips empty stepper block to its inner trimmed", () => {
    const input = "{% stepper %}\n\n{% endstepper %}";
    const out = steppers.apply(input, ctx) as string;
    expect(out).not.toContain("{%");
  });

  it("exposes its name", () => {
    expect(steppers.name).toBe("steppers");
  });
});
