import { Barcode } from "../ui/Barcode";
import { Logo } from "../Logo";
import { barcodeValue } from "../../lib/barcode";
import { baseName } from "../../data/erp";
import { currencyCode, formatAmount } from "../../lib/format";
import {
  boxStyle,
  canvasStyle,
  DEFAULT_TEMPLATE,
  LABEL_ELEMENTS,
} from "../../lib/labelTemplate";

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

const FIT = {
  left: "xMinYMid meet",
  center: "xMidYMid meet",
  right: "xMaxYMid meet",
};

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
  if (id === "name") return baseName(product);
  if (id === "color") return product.color ?? "";
  if (id === "size") return product.size == null ? "" : String(product.size);
  if (id === "code") return code;
  return `${formatAmount(product.sellingPrice)} ${currencyCode()}`;
}
