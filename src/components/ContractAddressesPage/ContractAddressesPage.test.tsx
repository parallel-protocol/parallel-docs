import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { ContractAddressesPage } from "./ContractAddressesPage";

// "ethereum" → CHAIN_LABELS["ethereum"] = "Ethereum"
// "base" → CHAIN_LABELS["base"] = "Base" (also a known Parallel chain).
// "base" has empty contracts → exercises the empty-state fallback.
const MOCK_CHAINS = {
  ethereum: [
    {
      name: "Stabilizer",
      address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      description: "Core Protocol",
    },
    {
      name: "Swapper",
      address: "0xcccccccccccccccccccccccccccccccccccccccc",
      description: "Parallelizer Module",
    },
    {
      name: "Redeemer",
      address: "0xdddddddddddddddddddddddddddddddddddddddd",
      description: "Parallelizer Module",
    },
    {
      name: "Treasury",
      address: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    },
  ],
  base: [],
};

describe("ContractAddressesPage", () => {
  it("renders a jump link for every chain in the chains prop", () => {
    render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);
    expect(screen.getByRole("link", { name: "Ethereum" })).toHaveAttribute(
      "href",
      "#chain-ethereum",
    );
    expect(screen.getByRole("link", { name: "Base" })).toHaveAttribute("href", "#chain-base");
  });

  // The point of the component: no chain's addresses may depend on hydration.
  it("renders every chain's contracts without any interaction", () => {
    render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);
    expect(screen.getByText("Stabilizer")).toBeInTheDocument();
    expect(screen.getByText("Treasury")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Ethereum" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Base" })).toBeInTheDocument();
  });

  it("gives each chain section a linkable anchor id", () => {
    const { container } = render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);
    expect(container.querySelector("#chain-ethereum")).not.toBeNull();
    expect(container.querySelector("#chain-base")).not.toBeNull();
  });

  it("shows the empty-state fallback for a chain with no contracts", () => {
    render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);
    expect(screen.getByText(/No contracts deployed yet on Base/i)).toBeInTheDocument();
  });

  it("groups contracts under one heading per module, in data order", () => {
    render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(["Core Protocol", "Parallelizer Module"]);
  });

  it("renders contracts of the same module in a single table", () => {
    render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);
    const tables = screen.getAllByRole("table");
    // Core Protocol, Parallelizer Module, and ungrouped (Treasury)
    expect(tables).toHaveLength(3);
    expect(tables[1]).toHaveTextContent("Swapper");
    expect(tables[1]).toHaveTextContent("Redeemer");
  });

  it("does not repeat the module name under each contract row", () => {
    render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);
    // "Parallelizer Module" appears only as the section heading, not once per row.
    expect(screen.getAllByText("Parallelizer Module")).toHaveLength(1);
  });

  it("scopes each chain's contracts to that chain's section", () => {
    const { container } = render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);
    const ethereum = container.querySelector("#chain-ethereum") as HTMLElement;
    expect(within(ethereum).getByText("Stabilizer")).toBeInTheDocument();
    const base = container.querySelector("#chain-base") as HTMLElement;
    expect(within(base).queryByText("Stabilizer")).not.toBeInTheDocument();
  });

  // The page lists a few hundred contracts; inlining two full SVGs per row was
  // most of the HTML. The geometry is defined once and referenced with `<use>`.
  it("defines each icon symbol exactly once for the whole page", () => {
    const { container } = render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);

    expect(container.querySelectorAll("symbol#cooper-icon-copy")).toHaveLength(1);
    expect(container.querySelectorAll("symbol#cooper-icon-check")).toHaveLength(1);
    expect(container.querySelectorAll("symbol#cooper-icon-external-link")).toHaveLength(1);
  });

  it("points every row icon at the page sprite", () => {
    const { container } = render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);

    // 4 contracts on Ethereum, none on Base → one copy + one external link each.
    expect(container.querySelectorAll('use[href="#cooper-icon-copy"]')).toHaveLength(4);
    expect(container.querySelectorAll('use[href="#cooper-icon-external-link"]')).toHaveLength(4);

    // No `<use>` may dangle: every referenced id must exist in the sprite.
    for (const use of container.querySelectorAll("use")) {
      const id = use.getAttribute("href") ?? "";
      expect(container.querySelector(id)).not.toBeNull();
    }
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
