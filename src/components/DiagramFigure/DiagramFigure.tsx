import { useRef, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import "./DiagramFigure.css";

/**
 * Image figure with optional caption and zoom-to-lightbox interaction.
 * Supports CSS-only dark-mode swap via `darkSrc`.
 */
export interface DiagramFigureProps {
  src: string;
  alt: string;
  caption?: string;
  variant?: "default" | "bordered" | "plain";
  zoomable?: boolean;
  darkSrc?: string;
}

export function DiagramFigure({
  src,
  alt,
  caption,
  variant = "default",
  zoomable = true,
  darkSrc,
}: DiagramFigureProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (alt === "" && process.env.NODE_ENV !== "production") {
    console.warn("DiagramFigure: alt prop is required for accessibility.");
  }

  const image = darkSrc ? (
    <picture>
      <source media="(prefers-color-scheme: dark)" srcSet={darkSrc} />
      <img src={src} alt={alt} />
    </picture>
  ) : (
    <img src={src} alt={alt} />
  );

  return (
    <figure className={`cooper-df-figure cooper-df-${variant}`}>
      {zoomable ? (
        <button
          ref={buttonRef}
          type="button"
          className="cooper-df-zoomable"
          onClick={() => setOpen(true)}
          aria-label={`Zoom: ${alt}`}
        >
          {image}
        </button>
      ) : (
        image
      )}
      {caption ? <figcaption className="cooper-df-caption">{caption}</figcaption> : null}
      {zoomable ? (
        <Lightbox
          open={open}
          close={() => {
            setOpen(false);
            buttonRef.current?.focus();
          }}
          slides={[{ src: darkSrc ?? src }]}
        />
      ) : null}
    </figure>
  );
}

export default DiagramFigure;
