import { describe, expect, it } from "vitest";

import { SECURITY_HEADERS, type VercelConfig, withDeliveryRoutes } from "../scripts/delivery-routes";

/** What the Vocs adapter writes, trimmed to what matters here. */
const adapterConfig: VercelConfig = {
  version: 3,
  routes: [
    { src: "^/assets/(.*)$", headers: { "cache-control": "public, immutable, max-age=31536000" } },
    { handle: "filesystem" },
    { src: "(.*)", dest: "/RSC/" },
  ],
};

describe("withDeliveryRoutes", () => {
  it("keeps the adapter's own routes, in order, after ours", () => {
    const out = withDeliveryRoutes(adapterConfig);
    const tail = out.routes?.slice(-3);
    expect(tail).toEqual(adapterConfig.routes);
    expect(out.version).toBe(3);
  });

  it("sets the security headers on every response without answering it", () => {
    const route = withDeliveryRoutes(adapterConfig).routes?.[0];
    expect(route?.src).toBe("^/(.*)$");
    expect(route?.headers).toEqual(SECURITY_HEADERS);
    // Without `continue`, this route would answer the request and serve nothing.
    expect(route?.continue).toBe(true);
  });

  it("caches the unhashed images without claiming they are immutable", () => {
    const route = withDeliveryRoutes(adapterConfig).routes?.[1];
    const cache = (route?.headers as Record<string, string>)["cache-control"];
    expect(cache).toContain("max-age=86400");
    expect(cache).not.toContain("immutable");
    for (const path of ["/logo-b.png", "/hero.jpg", "/og-image.png", "/images/a/b.png"]) {
      expect(new RegExp(route?.src as string).test(path)).toBe(true);
    }
    // Hashed assets keep the adapter's immutable rule.
    expect(new RegExp(route?.src as string).test("/assets/app-a1b2.js")).toBe(false);
  });

  it("redirects the bare developers hub, with and without a trailing slash", () => {
    const redirect = withDeliveryRoutes(adapterConfig).routes?.find((r) => r.status === 308);
    expect(redirect?.headers).toEqual({ Location: "/developers-hub/developers-guide" });
    for (const path of ["/developers-hub", "/developers-hub/"]) {
      expect(new RegExp(redirect?.src as string).test(path)).toBe(true);
    }
    // Must not swallow the pages under it.
    expect(new RegExp(redirect?.src as string).test("/developers-hub/developers-guide")).toBe(false);
  });


  it("adds no field Vercel does not know — an unknown key fails the whole deployment", () => {
    const allowed = new Set(["src", "dest", "headers", "status", "continue", "handle", "check", "methods", "has", "missing"]);
    for (const route of withDeliveryRoutes(adapterConfig).routes ?? []) {
      for (const key of Object.keys(route)) expect(allowed).toContain(key);
    }
  });


  it("sends AI crawlers to llms.txt on the root, and nobody else", () => {
    const route = withDeliveryRoutes(adapterConfig).routes?.find((r) => r.dest === "/llms.txt");
    expect(route?.src).toBe("^/$");
    const ua = (route?.has as { value: string }[])[0].value;
    const re = new RegExp(ua.replace("(?i)", ""), "i");
    for (const agent of ["ChatGPT-User/1.0", "ClaudeBot/1.0", "PerplexityBot", "GPTBot/1.2", "CCBot/2.0"]) {
      expect(re.test(agent)).toBe(true);
    }
    // Search engines keep the HTML, as upstream intends, and so do readers.
    for (const agent of ["Googlebot/2.1", "Bingbot/2.0", "Mozilla/5.0 (Macintosh) Safari/605"]) {
      expect(re.test(agent)).toBe(false);
    }
    // Only the root — every other path already works without us.
    expect(new RegExp(route?.src as string).test("/security/audits")).toBe(false);
  });

  it("is idempotent — a second merge does not stack duplicates", () => {
    const once = withDeliveryRoutes(adapterConfig);
    expect(withDeliveryRoutes(once)).toEqual(once);
  });

  it("copes with a config that has no routes yet", () => {
    expect(withDeliveryRoutes({ version: 3 }).routes).toHaveLength(4);
  });
});
