import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Tab, Tabs } from "./Tabs";

function renderTabs(defaultValue?: string) {
  return render(
    <Tabs defaultValue={defaultValue}>
      <Tab label="USDP">Content for USDP</Tab>
      <Tab label="PAR (legacy)">Content for PAR</Tab>
      <Tab label="sPRL">Content for sPRL</Tab>
    </Tabs>,
  );
}

describe("Tabs", () => {
  it("renders all tab triggers", () => {
    renderTabs();
    expect(screen.getByRole("tab", { name: "USDP" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "PAR (legacy)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "sPRL" })).toBeInTheDocument();
  });

  it("renders a tablist with role=tab children and at least one tabpanel", () => {
    renderTabs();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getAllByRole("tab").length).toBe(3);
    // Radix only mounts the active panel by default (hidden attribute on inactive)
    expect(screen.getAllByRole("tabpanel").length).toBeGreaterThanOrEqual(1);
  });

  it("activates the first tab by default when no defaultValue is provided", () => {
    renderTabs();
    const firstTab = screen.getByRole("tab", { name: "USDP" });
    expect(firstTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Content for USDP")).toBeVisible();
  });

  it("activates the correct tab when defaultValue matches a label", () => {
    renderTabs("PAR (legacy)");
    const secondTab = screen.getByRole("tab", { name: "PAR (legacy)" });
    expect(secondTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Content for PAR")).toBeVisible();
  });

  it("switches active tab and shows content on trigger click", async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByRole("tab", { name: "sPRL" }));

    expect(screen.getByRole("tab", { name: "sPRL" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Content for sPRL")).toBeVisible();
  });

  it("deactivates the previously active tab when another is clicked", async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByRole("tab", { name: "PAR (legacy)" }));

    expect(screen.getByRole("tab", { name: "USDP" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByRole("tab", { name: "PAR (legacy)" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(
      <Tabs>
        <Tab label="Tab One">Content one</Tab>
        <Tab label="Tab Two">Content two</Tab>
      </Tabs>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
