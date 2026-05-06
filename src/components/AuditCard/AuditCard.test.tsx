import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { AuditCard } from "./AuditCard";

const REPORT_URL = "https://example.com/audit-report.pdf";

describe("AuditCard", () => {
  it("renders the CTA inside an anchor pointing at the report URL", () => {
    render(<AuditCard auditor="Trail of Bits" date="2025-11-20" report={REPORT_URL} />);

    const link = screen.getByRole("link", {
      name: /Read Trail of Bits audit report from Nov 20, 2025/i,
    });
    expect(link).toHaveAttribute("href", REPORT_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("View Report")).toBeInTheDocument();
  });

  it("renders the logo image, scope list, and formatted date when all props are provided", () => {
    render(
      <AuditCard
        auditor="Trail of Bits"
        auditorLogo="https://example.com/tob.png"
        date="2025-11-20"
        scope={["Stabilizer", "Treasury"]}
        report={REPORT_URL}
      />,
    );

    const logo = screen.getByAltText("Trail of Bits");
    expect(logo).toHaveAttribute("src", "https://example.com/tob.png");

    expect(screen.getByText("Stabilizer")).toBeInTheDocument();
    expect(screen.getByText("Treasury")).toBeInTheDocument();
    expect(screen.getByText("Nov 20, 2025")).toBeInTheDocument();
  });

  it('falls back to initials ("ToB") when no auditorLogo is provided', () => {
    const { container } = render(
      <AuditCard auditor="Trail of Bits" date="2025-11-20" report={REPORT_URL} />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector(".cooper-ac-initials")).toHaveTextContent("ToB");
  });

  it('renders the "In progress" badge instead of the date when status="ongoing"', () => {
    render(
      <AuditCard auditor="Trail of Bits" date="2025-11-20" report={REPORT_URL} status="ongoing" />,
    );

    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.queryByText("Nov 20, 2025")).not.toBeInTheDocument();
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(
      <AuditCard
        auditor="Trail of Bits"
        auditorLogo="https://example.com/tob.png"
        date="2025-11-20"
        scope={["Stabilizer", "Treasury"]}
        report={REPORT_URL}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
