import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductSearch } from "../components/panels/ProductSearch";
import { ProductTable } from "../components/panels/ProductTable";
import { Button } from "../components/ui/Button";
import { IconEdit, IconPlus, IconPrint } from "../components/Icons";
import {
  DeleteProductDialog,
  ProductFormDialog,
} from "../components/panels/ProductDialogs";
import { PrintLabelsDialog } from "../components/panels/PrintLabelsDialog";
import { LabelSheet } from "../components/panels/LabelSheet";
import { filterProducts } from "../data/erp";
import { useLabelTemplate } from "../labels/context";
import { useTranslation } from "../i18n/context";
import { useToast } from "../toast/context";
import { mapApiError } from "../api/errors";

export function Inventory({ products, onAdd, onUpdate, onDelete }) {
  const { t } = useTranslation();
  const { notify } = useToast();
  // The design saved in Tools → label designer, which is what every label
  // printed from this page is drawn with. Nothing here has to be set up first:
  // until somebody designs one, this is the default template.
  const { template } = useLabelTemplate();
  const [query, setQuery] = useState("");
  const [selectedSku, setSelectedSku] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [editingSku, setEditingSku] = useState(null);
  const [checkedSkus, setCheckedSkus] = useState(() => new Set());
  // What is being printed, and the template it is being printed with: the
  // saved design, on whatever stock the dialog was told is in the printer.
  const [printRun, setPrintRun] = useState(null);

  const filtered = useMemo(
    () => filterProducts(products, query),
    [products, query],
  );

  const selected = filtered.find((product) => product.sku === selectedSku) ?? null;
  const editing = products.find((product) => product.sku === editingSku) ?? null;
  const hasSelection = Boolean(selected);

  // Ticks survive a search — narrowing the list to find the next product to
  // tag should not quietly drop what is already ticked — so what gets printed
  // is read from the catalogue, not from the filtered view. A product deleted
  // while ticked simply stops resolving.
  const checkedProducts = useMemo(
    () => products.filter((product) => checkedSkus.has(product.sku)),
    [products, checkedSkus],
  );

  const checkedInView = filtered.filter((product) =>
    checkedSkus.has(product.sku),
  ).length;

  // How many are ticked is what the toolbar is built from, so it is named
  // once here rather than recounted at each of the three buttons.
  const checkedCount = checkedProducts.length;

  // The ticked set is keyed by sku, so it has to keep up when an edit changes
  // one underneath it: without this, renaming a ticked product's sku drops it
  // from the print run silently — the row still shows ticked while the count
  // on the button goes down by one. Passing no `to` drops the tick instead,
  // which is what a deletion wants.
  const retagChecked = useCallback((from, to) => {
    setCheckedSkus((current) => {
      if (!current.has(from)) return current;
      const next = new Set(current);
      next.delete(from);
      if (to) next.add(to);
      return next;
    });
  }, []);

  const toggleChecked = useCallback((product) => {
    setCheckedSkus((current) => {
      const next = new Set(current);
      if (next.has(product.sku)) next.delete(product.sku);
      else next.add(product.sku);
      return next;
    });
  }, []);

  // Select-all works on what is on screen: with a search active it ticks the
  // matches, and unticks them again without disturbing anything ticked outside
  // the current view.
  const toggleAll = useCallback(() => {
    setCheckedSkus((current) => {
      const next = new Set(current);
      const all = filtered.every((product) => next.has(product.sku));
      filtered.forEach((product) => {
        if (all) next.delete(product.sku);
        else next.add(product.sku);
      });
      return next;
    });
  }, [filtered]);

  useEffect(() => {
    if (!printRun) return undefined;

    const done = () => setPrintRun(null);
    window.addEventListener("afterprint", done);
    // One frame, so the labels are laid out before the print dialog samples
    // the page. The cleanup cancels it, which is also what keeps StrictMode's
    // double-invoked effect from printing twice in development.
    const frame = requestAnimationFrame(() => window.print());

    return () => {
      window.removeEventListener("afterprint", done);
      cancelAnimationFrame(frame);
    };
  }, [printRun]);

  function closeDialog() {
    setDialog(null);
    setEditingSku(null);
  }

  function openEditor() {
    if (!selected) return;
    setEditingSku(selected.sku);
    setDialog("edit");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ProductSearch
        query={query}
        onQueryChange={setQuery}
        resultCount={filtered.length}
        totalCount={products.length}
      />

      <ProductTable
        products={filtered}
        title={t("inv.products")}
        hint={t("inv.hint")}
        isSelected={(product) => product.sku === selected?.sku}
        onSelect={(product) =>
          setSelectedSku(product.sku === selected?.sku ? null : product.sku)
        }
        filtering={query.trim().length > 0}
        showBarcode
        selection={{
          isChecked: (product) => checkedSkus.has(product.sku),
          onToggle: toggleChecked,
          onToggleAll: toggleAll,
          allChecked:
            filtered.length > 0 && checkedInView === filtered.length,
          someChecked: checkedInView > 0,
        }}
        actions={
          /* Each button is offered only where it can act, so none of them
             needs a disabled state or a tooltip explaining why it is greyed
             out. The two selections gate different buttons because they
             answer different questions: the clicked row is *which* product,
             which is what editing one needs, and the ticks are *how many*,
             which is what printing a run of labels needs. */
          <>
            {/* With nothing ticked the page is a catalogue and the thing to
                do to it is add to it. Tick something and it is a selection
                instead, so Add stands down in favour of what acts on it. */}
            {checkedCount === 0 ? (
              <Button variant="primary" onClick={() => setDialog("add")}>
                <IconPlus className="h-4 w-4" />
                {t("inv.add")}
              </Button>
            ) : null}

            {hasSelection ? (
              <Button onClick={openEditor}>
                <IconEdit className="h-4 w-4" />
                {t("inv.edit")}
              </Button>
            ) : null}

            {checkedCount > 0 ? (
              <Button variant="primary" onClick={() => setDialog("print")}>
                <IconPrint className="h-4 w-4" />
                {t("inv.printCount", { count: checkedCount })}
              </Button>
            ) : null}
          </>
        }
      />

      {dialog === "add" ? (
        <ProductFormDialog
          existingSkus={products.map((product) => product.sku)}
          onCancel={closeDialog}
          onSubmit={async (rows) => {
            const created = await onAdd(rows);
            setSelectedSku(created?.[0]?.sku ?? rows[0]?.sku ?? null);
            setQuery("");
            closeDialog();
          }}
        />
      ) : null}

      {dialog === "edit" && editing ? (
        <ProductFormDialog
          product={editing}
          existingSkus={products.map((product) => product.sku)}
          onCancel={closeDialog}
          onRequestDelete={() => setDialog("confirmDelete")}
          onSubmit={async ([changes]) => {
            const updated = await onUpdate(editing.sku, changes);
            const sku = updated?.sku ?? changes.sku;
            setSelectedSku(sku);
            retagChecked(editing.sku, sku);
            closeDialog();
          }}
        />
      ) : null}

      {dialog === "confirmDelete" && editing ? (
        <DeleteProductDialog
          product={editing}
          onCancel={() => setDialog("edit")}
          onConfirm={async () => {
            try {
              await onDelete(editing.sku);
              setSelectedSku(null);
              retagChecked(editing.sku);
              closeDialog();
            } catch (error) {
              notify(mapApiError(error, t), "error");
            }
          }}
        />
      ) : null}

      {dialog === "print" && checkedProducts.length > 0 ? (
        <PrintLabelsDialog
          products={checkedProducts}
          template={template}
          onCancel={closeDialog}
          onPrint={(run) => {
            setPrintRun(run);
            closeDialog();
          }}
        />
      ) : null}

      <LabelSheet jobs={printRun?.jobs} template={printRun?.template} />
    </div>
  );
}
