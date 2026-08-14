import { Barcode } from "../ui/Barcode";
import { barcodeValue } from "../../lib/barcode";
import { formatAmount } from "../../lib/format";

const STORE_NAME = "PUMPS UP BAKU";

/**
 * One label, at whatever `--label-w` / `--label-h` the surrounding element
 * sets. Shared by the print sheet and the dialog's preview, so what is on
 * screen before printing is the same markup that reaches the paper.
 *
 * `rotated` turns the design a quarter turn *inside* the page rather than
 * changing the page: the stock stays 40 × 58 because that is what is loaded in
 * the printer, and the design runs along the other axis. See the label block
 * in index.css for how the face is swapped and turned.
 */
export function Label({ product, rotated = false }) {
  const code = barcodeValue(product.sku);

  return (
    <div className={`label${rotated ? " label--rotated" : ""}`}>
      <div className="label-face">
        <p className="label-store">{STORE_NAME}</p>
        <p className="label-name">{product.name}</p>

        <div className="label-symbol">
          <Barcode value={code} className="label-bars" color="#000" />
          <p className="label-code">{code}</p>
        </div>

        <p className="label-price">{formatAmount(product.sellingPrice)} AZN</p>
      </div>
    </div>
  );
}
