import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { DiagramFigure } from "./DiagramFigure";

describe("DiagramFigure", () => {
  it("renders an image with src and alt", () => {
    render(<DiagramFigure src="/foo.png" alt="A diagram" zoomable={false} />);
    const img = screen.getByAltText("A diagram") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/foo.png");
  });

  it("renders a figcaption when caption is provided", () => {
    render(<DiagramFigure src="/foo.png" alt="alt" caption="Figure 1" zoomable={false} />);
    expect(screen.getByText("Figure 1").tagName.toLowerCase()).toBe("figcaption");
  });

  it("renders a <picture> with dark source when darkSrc is provided", () => {
    const { container } = render(
      <DiagramFigure src="/light.png" darkSrc="/dark.png" alt="alt" zoomable={false} />,
    );
    const source = container.querySelector("source");
    expect(source).not.toBeNull();
    expect(source?.getAttribute("media")).toBe("(prefers-color-scheme: dark)");
    expect(source?.getAttribute("srcset")).toBe("/dark.png");
  });

  it("opens lightbox when zoomable image is clicked", async () => {
    const user = userEvent.setup();
    render(<DiagramFigure src="/foo.png" alt="A diagram" />);
    await user.click(screen.getByRole("button", { name: /Zoom: A diagram/ }));
    // yet-another-react-lightbox renders a portal with role="presentation"
    expect(document.querySelector(".yarl__container")).not.toBeNull();
  });

  it("closes lightbox via close control and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<DiagramFigure src="/foo.png" alt="A diagram" />);
    const button = screen.getByRole("button", { name: /Zoom: A diagram/ });
    await user.click(button);
    expect(document.querySelector(".yarl__container")).not.toBeNull();
    // yarl renders a close button with aria-label="Close" in its toolbar.
    // Pressing Escape is yarl's documented behavior, but its keydown
    // listener is bound to the document in a way JSDOM does not exercise,
    // so we trigger close through the visible close control instead.
    const closeBtn = document.querySelector<HTMLButtonElement>(
      ".yarl__toolbar button[aria-label='Close']",
    );
    expect(closeBtn).not.toBeNull();
    await user.click(closeBtn as HTMLButtonElement);
    // yarl plays a fade-out animation before unmounting; wait for the
    // container to be removed from the DOM (and our component to focus
    // the trigger again via the close callback).
    await waitFor(
      () => {
        expect(document.querySelector(".yarl__container")).toBeNull();
      },
      { timeout: 2000 },
    );
    expect(document.activeElement).toBe(button);
  });

  describe("alt warning", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });
    afterEach(() => {
      warnSpy.mockRestore();
    });
    it("warns when alt is empty in non-production", () => {
      render(<DiagramFigure src="/foo.png" alt="" zoomable={false} />);
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  it("has no a11y violations", async () => {
    const { container } = render(
      <DiagramFigure src="/foo.png" alt="A diagram" caption="cap" zoomable={false} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
