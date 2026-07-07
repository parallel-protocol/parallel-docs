import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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

afterEach(() => {
  // Restore the URL to a clean state after each test that may change it
  window.history.pushState(null, "", "/");
});

describe("ContractAddressesPage", () => {
  it("renders chain buttons for all keys in the chains prop", () => {
    render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);
    // "ethereum" → CHAIN_LABELS["ethereum"] = "Ethereum"
    expect(screen.getByRole("button", { name: "Ethereum" })).toBeInTheDocument();
    // "base" is not in CHAIN_LABELS → falls back to slug "base"
    expect(screen.getByRole("button", { name: "Base" })).toBeInTheDocument();
  });

  it("renders the first chain's contracts by default", () => {
    render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);
    expect(screen.getByText("Stabilizer")).toBeInTheDocument();
    expect(screen.getByText("Treasury")).toBeInTheDocument();
  });

  it("marks the initially selected chain button as pressed", () => {
    render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);
    expect(screen.getByRole("button", { name: "Ethereum" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Base" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("clicking a different chain switches the displayed contracts", async () => {
    const user = userEvent.setup();
    render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);

    await user.click(screen.getByRole("button", { name: "Base" }));

    expect(screen.getByRole("button", { name: "Base" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByText(/No contracts deployed yet on Base/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Stabilizer")).not.toBeInTheDocument();
  });

  it("updates the URL query param when a chain is selected", async () => {
    const user = userEvent.setup();
    const replaceSpy = vi.spyOn(window.history, "replaceState");

    render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);
    await user.click(screen.getByRole("button", { name: "Base" }));

    expect(replaceSpy).toHaveBeenCalledWith(null, "", "?chain=base");
    replaceSpy.mockRestore();
  });

  it("reads the initial chain from the ?chain= URL query param", () => {
    window.history.pushState(null, "", "?chain=base");
    render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);

    expect(screen.getByRole("button", { name: "Base" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByText(/No contracts deployed yet on Base/i),
    ).toBeInTheDocument();
  });

  it("ignores an unknown ?chain= value and falls back to the first chain", () => {
    window.history.pushState(null, "", "?chain=unknown-chain");
    render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);

    expect(screen.getByRole("button", { name: "Ethereum" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows the empty-state fallback for a chain with no contracts", async () => {
    const user = userEvent.setup();
    render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);

    await user.click(screen.getByRole("button", { name: "Base" }));

    expect(
      screen.getByText(/No contracts deployed yet on Base/i),
    ).toBeInTheDocument();
  });

  it("groups contracts under one heading per module, in data order", () => {
    render(<ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />);

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual([
      "Core Protocol",
      "Parallelizer Module",
    ]);
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

  it("has no detectable accessibility violations", async () => {
    const { container } = render(
      <ContractAddressesPage stablecoin="USDP" chains={MOCK_CHAINS} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
