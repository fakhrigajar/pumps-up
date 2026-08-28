import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Label } from "./Label";
import { DEFAULT_TEMPLATE } from "../../lib/labelTemplate";

const PRINTING_CLASS = "printing-labels";

export function LabelSheet({ jobs, template = DEFAULT_TEMPLATE }) {
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
      <style>{`@page { size: ${template.width}mm ${template.height}mm; margin: 0; }`}</style>

      <div className="label-sheet">
        {jobs.flatMap(({ product, quantity }) =>
          Array.from({ length: quantity }, (_, index) => (
            <Label
              key={`${product.sku}-${index}`}
              product={product}
              template={template}
            />
          )),
        )}
      </div>
    </>,
    target,
  );
}
