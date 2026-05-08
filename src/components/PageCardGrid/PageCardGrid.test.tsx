import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { PageCardGrid } from "./PageCardGrid";

const ITEMS = [
  { title: "Classic Vaults", href: "/products/parallel-v2/how-it-works/vaults" },
  {
    title: "Bridging Module",
    href: "/products/parallel-v2/how-it-works/bridging-module",
  },
  {
    title: "Super Vaults (SV)",
    href: "/products/parallel-v2/how-it-works/super-vaults-sv",
  },
];

describe("PageCardGrid", () => {
  it("renders one anchor per item with the correct title and href", () => {
    render(<PageCardGrid items={ITEMS} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(ITEMS.length);

    for (const item of ITEMS) {
      const titleEl = screen.getByText(item.title);
      const link = titleEl.closest("a");
      expect(link).toHaveAttribute("href", item.href);
    }
  });

  it("uses a labelled list for screen readers", () => {
    render(<PageCardGrid items={ITEMS} />);
    expect(screen.getByRole("list", { name: /Sections/i })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(ITEMS.length);
  });

  it("renders nothing when items is empty", () => {
    const { container } = render(<PageCardGrid items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("has no a11y violations", async () => {
    const { container } = render(<PageCardGrid items={ITEMS} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
