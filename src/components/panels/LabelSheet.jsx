import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Label } from "./Label";
import { DEFAULT_LABEL_LAYOUT } from "../../lib/labels";

/** Marks the document while labels are mounted, so a plain Ctrl+P with nothing
 * to print still prints the page rather than an empty sheet. */
const PRINTING_CLASS = "printing-labels";

/**
 * The labels themselves, rendered into `#print-root` — a container outside the
 * React root, hidden on screen and the only thing `@media print` shows. The
 * app's own shell is a fixed-height scrolling layout with nothing sensible to
 * say about paper, so printing swaps it out entirely rather than trying to
 * restyle it. See the print block in index.css.
 */
export function LabelSheet({ jobs, layout = DEFAULT_LABEL_LAYOUT }) {
  const active = Boolean(jobs && jobs.length > 0);

  useEffect(() => {
    if (!active) return undefined;
    document.body.classList.add(PRINTING_CLASS);
    return () => document.body.classList.remove(PRINTING_CLASS);
  }, [active]);

  const target = document.getElementById("print-root");
  if (!active || !target) return null;

  return createPortal(
    <>
      {/*
        One label per page, at exactly the size asked for. `@page` cannot read
        a custom property, so the rule is written out here from the same two
        numbers that size the label itself — which is what makes the sheet come
        out of a label printer as whole labels rather than as a grid to cut up.
        The numbers are the physical stock, never swapped: turning the design
        is `rotate`'s job, because the paper in the printer cannot turn.
        The style element is inert on screen: @page only applies to print.
      */}
      <style>{`@page { size: ${layout.width}mm ${layout.height}mm; margin: 0; }`}</style>

      <div
        className="label-sheet"
        style={{
          "--label-w": `${layout.width}mm`,
          "--label-h": `${layout.height}mm`,
        }}
      >
        {jobs.flatMap(({ product, quantity }) =>
          Array.from({ length: quantity }, (_, index) => (
            <Label
              key={`${product.sku}-${index}`}
              product={product}
              rotated={layout.rotate}
            />
          )),
        )}
      </div>
    </>,
    target,
  );
}
