import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ContractTable } from "./ContractTable";

const ADDR_1 = "0x1234567890abcdef1234567890abcdefabcdef12" as const;
const ADDR_2 = "0xabcdef1234567890abcdef1234567890abcdef12" as const;

describe("ContractTable", () => {
  it("renders one row per contract with truncated addresses", () => {
    render(
      <ContractTable
        chain="ethereum"
        contracts={[
          { name: "eUSD", address: ADDR_1 },
          { name: "Treasury", address: ADDR_2 },
        ]}
      />,
    );

    expect(screen.getByText("eUSD")).toBeInTheDocument();
    expect(screen.getByText("Treasury")).toBeInTheDocument();
    expect(screen.getByText("0x1234…ef12")).toBeInTheDocument();
    expect(screen.getByText("0xabcd…ef12")).toBeInTheDocument();

    // Caption + 3 column headers + sr-only "View on explorer" labels are all in the tree.
    expect(screen.getByRole("columnheader", { name: "Contract" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Address" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
  });

  it("renders the contract description inline beneath the name", () => {
    render(
      <ContractTable
        chain="ethereum"
        contracts={[{ name: "USDP", address: ADDR_1, description: "Main stablecoin" }]}
      />,
    );

    expect(screen.getByText("Main stablecoin")).toBeInTheDocument();
  });

  it("copies the full address on click and swaps the icon to Check", async () => {
    const user = userEvent.setup();
    // user-event installs its own clipboard stub on `navigator.clipboard` during setup;
    // spy on its writeText to assert what the component writes.
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    render(<ContractTable chain="ethereum" contracts={[{ name: "eUSD", address: ADDR_1 }]} />);

    const copyButton = screen.getByRole("button", { name: `Copy address ${ADDR_1}` });
    expect(copyButton).toHaveAttribute("data-copied", "false");

    await user.click(copyButton);

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(ADDR_1);

    expect(await screen.findByText("Copied")).toBeInTheDocument();
    expect(copyButton).toHaveAttribute("data-copied", "true");
  });

  it("renders the empty-state message when no contracts are provided", () => {
    render(<ContractTable chain="ethereum" contracts={[]} />);
    expect(screen.getByText("No contracts deployed on this chain yet.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(
      <ContractTable
        chain="ethereum"
        contracts={[
          { name: "eUSD", address: ADDR_1, description: "Main stablecoin" },
          { name: "Treasury", address: ADDR_2 },
        ]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders no TESTNET badge when the network prop is omitted", () => {
    render(
      <ContractTable chain="eden-mainnet" contracts={[{ name: "USDMO", address: ADDR_1 }]} />,
    );
    expect(screen.queryByText("TESTNET")).not.toBeInTheDocument();
  });

  it("renders no TESTNET badge when network='mainnet' is explicit", () => {
    render(
      <ContractTable
        chain="eden-mainnet"
        network="mainnet"
        contracts={[{ name: "USDMO", address: ADDR_1 }]}
      />,
    );
    expect(screen.queryByText("TESTNET")).not.toBeInTheDocument();
  });

  it("renders the TESTNET badge in the Contract column header when network='testnet'", () => {
    render(
      <ContractTable
        chain="eden-testnet"
        network="testnet"
        contracts={[{ name: "USDMO", address: ADDR_1 }]}
      />,
    );
    const badge = screen.getByText("TESTNET");
    expect(badge).toBeInTheDocument();
    // The badge sits inside the Contract column header.
    const contractHeader = screen.getByRole("columnheader", { name: /Contract/ });
    expect(contractHeader).toContainElement(badge);
    // It is decorative (the chain label in the caption already conveys testnet).
    expect(badge).toHaveAttribute("aria-hidden", "true");
  });

  it("has no detectable accessibility violations with the TESTNET badge", async () => {
    const { container } = render(
      <ContractTable
        chain="eden-testnet"
        network="testnet"
        contracts={[{ name: "USDMO", address: ADDR_1 }]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
