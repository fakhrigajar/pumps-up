import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductSearch } from "../components/panels/ProductSearch";
import { ProductTable } from "../components/panels/ProductTable";
import { Button } from "../components/ui/Button";
import { IconEdit, IconPlus, IconPrint, IconReturn } from "../components/Icons";
import {
  DeleteProductDialog,
  ProductFormDialog,
  ReturnProductDialog,
} from "../components/panels/ProductDialogs";
import { PrintLabelsDialog } from "../components/panels/PrintLabelsDialog";
import { LabelSheet } from "../components/panels/LabelSheet";
import { filterProducts } from "../data/erp";
import { useLabelTemplate } from "../labels/context";
import { useTranslation } from "../i18n/context";

export function Inventory({ products, onAdd, onUpdate, onDelete, onReturn }) {
  const { t } = useTranslation();
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
          <>
            <Button variant="primary" onClick={() => setDialog("add")}>
              <IconPlus className="h-4 w-4" />
              {t("inv.add")}
            </Button>
            <Button
              onClick={openEditor}
              disabled={!hasSelection}
              title={hasSelection ? undefined : t("inv.selectFirst")}
            >
              <IconEdit className="h-4 w-4" />
              {t("inv.edit")}
            </Button>
            <Button
              onClick={() => setDialog("return")}
              disabled={!hasSelection}
              title={hasSelection ? undefined : t("inv.selectFirst")}
            >
              <IconReturn className="h-4 w-4" />
              {t("inv.return")}
            </Button>
            <Button
              onClick={() => setDialog("print")}
              disabled={checkedProducts.length === 0}
              title={
                checkedProducts.length === 0 ? t("inv.checkFirst") : undefined
              }
            >
              <IconPrint className="h-4 w-4" />
              {checkedProducts.length === 0
                ? t("inv.print")
                : t("inv.printCount", { count: checkedProducts.length })}
            </Button>
          </>
        }
      />

      {dialog === "add" ? (
        <ProductFormDialog
          existingSkus={products.map((product) => product.sku)}
          onCancel={closeDialog}
          onSubmit={(rows) => {
            onAdd(rows);
            setSelectedSku(rows[0]?.sku ?? null);
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
          onSubmit={([changes]) => {
            onUpdate(editing.sku, changes);
            setSelectedSku(changes.sku);
            closeDialog();
          }}
        />
      ) : null}

      {dialog === "confirmDelete" && editing ? (
        <DeleteProductDialog
          product={editing}
          onCancel={() => setDialog("edit")}
          onConfirm={() => {
            onDelete(editing.sku);
            setSelectedSku(null);
            closeDialog();
          }}
        />
      ) : null}

      {dialog === "return" && selected ? (
        <ReturnProductDialog
          product={selected}
          onCancel={closeDialog}
          onConfirm={(units, reason) => {
            onReturn(selected.sku, units, reason);
            closeDialog();
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
