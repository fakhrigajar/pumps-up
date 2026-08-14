import { Barcode } from "../ui/Barcode";
import { Logo } from "../Logo";
import { barcodeValue } from "../../lib/barcode";
import { formatAmount } from "../../lib/format";
import {
  boxStyle,
  canvasStyle,
  DEFAULT_TEMPLATE,
  LABEL_ELEMENTS,
} from "../../lib/labelTemplate";

/**
 * One label, drawn from a design template. Shared by the print sheet, the
 * print dialog's preview and the label designer, so what is on screen before
 * printing is the same markup that reaches the paper.
 *
 * `template.rotate` turns the design a quarter turn *inside* the page rather
 * than changing the page: the stock stays 40 × 58 because that is what is
 * loaded in the printer, and the design runs along the other axis. See the
 * label block in index.css for how the face is swapped and turned.
 */
export function Label({ product, template = DEFAULT_TEMPLATE }) {
  const code = barcodeValue(product.sku);

  return (
    <div
      className={`label${template.rotate ? " label--rotated" : ""}`}
      style={{
        "--label-w": `${template.width}mm`,
        "--label-h": `${template.height}mm`,
      }}
    >
      <div className="label-face">
        <div className="label-canvas" style={canvasStyle(template)}>
          {LABEL_ELEMENTS.map(({ id, kind }) => {
            const element = template.elements[id];
            if (!element.visible) return null;

            if (kind === "barcode" || kind === "logo") {
              return (
                <div
                  key={id}
                  className="label-el label-el--symbol"
                  style={boxStyle(element)}
                >
                  {kind === "barcode" ? (
                    <Barcode value={code} className="label-bars" color="#000" />
                  ) : (
                    <Logo
                      className="label-logo"
                      preserveAspectRatio={FIT[element.align]}
                    />
                  )}
                </div>
              );
            }

            return (
              <div key={id} className="label-el" style={boxStyle(element)}>
                <span className="label-text" style={textStyle(id, element)}>
                  {textOf(id, product, template, code)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Where the wordmark sits in a box that is not its own shape. It keeps its
 * proportions — a stretched logo is a wrong logo — so one axis usually has
 * room to spare, and the element's alignment says which end of it to take.
 */
const FIT = {
  left: "xMinYMid meet",
  center: "xMidYMid meet",
  right: "xMaxYMid meet",
};

/**
 * Digits under a symbol are set wide apart, which leaves a trailing gap after
 * the last one. Pulling the span's right edge back by that gap keeps the row
 * optically centred over the bars — and lined up with the box's right edge
 * when the row is set right.
 */
const CODE_TRACKING = 0.18;

function textStyle(id, element) {
  const style = {
    fontSize: `${element.fontSize}pt`,
    fontWeight: element.fontWeight,
    lineHeight: element.lineHeight,
    textAlign: element.align,
  };

  if (id !== "code") return style;
  return {
    ...style,
    letterSpacing: `${CODE_TRACKING}em`,
    marginRight: `-${CODE_TRACKING}em`,
  };
}

function textOf(id, product, template, code) {
  if (id === "store") return template.storeName;
  if (id === "name") return product.name;
  if (id === "code") return code;
  return `${formatAmount(product.sellingPrice)} AZN`;
}
