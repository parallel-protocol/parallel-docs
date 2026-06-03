import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { LinkCard } from "./LinkCard";

describe("LinkCard", () => {
  it("renders an anchor with the given href, target=_blank and rel=noopener", () => {
    render(<LinkCard href="https://immunefi.com/bug-bounty/parallel/information/" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://immunefi.com/bug-bounty/parallel/information/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the favicon image when provided", () => {
    const { container } = render(
      <LinkCard
        href="https://immunefi.com/x"
        favicon="https://immunefi.com/apple-touch-icon.png"
        title="Test"
        hostname="immunefi"
      />,
    );
    // <img alt=""> is presentational — no implicit role="img" — query directly.
    const img = container.querySelector("img.cooper-lc-favicon");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", "https://immunefi.com/apple-touch-icon.png");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("width", "20");
  });

  it("does NOT render an img when favicon is absent", () => {
    const { container } = render(
      <LinkCard href="https://example.com/" title="Example" hostname="example" />,
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("uses the short hostname as title when no title is provided", () => {
    render(<LinkCard href="https://immunefi.com/bug-bounty/parallel/information/" />);
    expect(screen.getByText("immunefi")).toBeInTheDocument();
  });

  it("uses the explicit hostname prop over derivation from href", () => {
    render(<LinkCard href="https://www.foo.bar/" title="Hello" hostname="explicit-host" />);
    expect(screen.getByText("explicit-host")).toBeInTheDocument();
  });

  it("derives hostname (strip www. + TLD) from href when prop is absent", () => {
    render(<LinkCard href="https://www.example.com/foo" title="Anything" />);
    expect(screen.getByText("example")).toBeInTheDocument();
  });

  it("renders title + hostname line separately when both are present", () => {
    render(
      <LinkCard
        href="https://immunefi.com/bug-bounty/parallel/information/"
        title="Parallel Bug Bounties | Immunefi"
        hostname="immunefi"
      />,
    );
    expect(screen.getByText("Parallel Bug Bounties | Immunefi")).toBeInTheDocument();
    expect(screen.getByText("immunefi")).toBeInTheDocument();
  });

  it("renders the optional description when provided", () => {
    render(
      <LinkCard
        href="https://example.com"
        title="Example"
        description="Open the site in a new tab"
      />,
    );
    expect(screen.getByText("Open the site in a new tab")).toBeInTheDocument();
  });

  it("uses ChevronRight (lucide-chevron-right) — not an external-link icon", () => {
    const { container } = render(
      <LinkCard href="https://example.com" title="Example" hostname="example" />,
    );
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toMatch(/lucide-chevron-right/);
    expect(svg?.getAttribute("class")).not.toMatch(/external-link/);
  });

  it("falls back to the raw href when URL parsing throws", () => {
    render(<LinkCard href="not-a-url" />);
    expect(screen.getByText("not-a-url")).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <LinkCard
        href="https://example.com"
        title="Example site"
        favicon="https://example.com/favicon.ico"
        hostname="example"
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
