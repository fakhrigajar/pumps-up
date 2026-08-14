import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Barcode } from "../ui/Barcode";
import { barcodeValue } from "../../lib/barcode";
import { formatAmount } from "../../lib/format";
import { DEFAULT_LABEL_SIZE } from "../../lib/labels";

const STORE_NAME = "PUMPS UP BAKU";

/**
 * The labels themselves, rendered into `#print-root` — a container outside the
 * React root, hidden on screen and the only thing `@media print` shows. The
 * app's own shell is a fixed-height scrolling layout with nothing sensible to
 * say about paper, so printing swaps it out entirely rather than trying to
 * restyle it. See the print block in index.css.
 */
/** Marks the document while labels are mounted, so a plain Ctrl+P with nothing
 * to print still prints the page rather than an empty sheet. */
const PRINTING_CLASS = "printing-labels";

export function LabelSheet({ jobs, size = DEFAULT_LABEL_SIZE }) {
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
        The style element is inert on screen: @page only applies to print.
      */}
      <style>{`@page { size: ${size.width}mm ${size.height}mm; margin: 0; }`}</style>

      <div
        className="label-sheet"
        style={{
          "--label-w": `${size.width}mm`,
          "--label-h": `${size.height}mm`,
        }}
      >
        {jobs.flatMap(({ product, quantity }) =>
          Array.from({ length: quantity }, (_, index) => (
            <Label key={`${product.sku}-${index}`} product={product} />
          )),
        )}
      </div>
    </>,
    target,
  );
}

function Label({ product }) {
  const code = barcodeValue(product.sku);

  return (
    <div className="label">
      <p className="label-store">{STORE_NAME}</p>
      <p className="label-name">{product.name}</p>

      <div className="label-symbol">
        <Barcode value={code} className="label-bars" color="#000" />
        <p className="label-code">{code}</p>
      </div>

      <p className="label-price">{formatAmount(product.sellingPrice)} AZN</p>
    </div>
  );
}
