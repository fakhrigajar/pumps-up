import { useState } from "react";
import { Card } from "../components/ui/Card";
import { IconChevronRight, IconTag } from "../components/Icons";
import { LabelDesigner } from "../components/panels/LabelDesigner";
import { useTranslation } from "../i18n/context";

/**
 * The back office's workshop: settings that shape what the operational pages
 * produce, rather than the day's numbers.
 *
 * Each tool opens in place instead of on its own route — the app navigates by
 * page id, and a tool is a screen within this one.
 */
const TOOLS = [
  {
    id: "labelDesigner",
    Icon: IconTag,
    titleKey: "tools.labelDesigner",
    descKey: "tools.labelDesigner.desc",
  },
];

/** Something to draw the label with when the catalogue is empty, so the
 * designer always has a product to lay out. */
const SAMPLE_PRODUCT = {
  sku: "PUSAMPLE0001",
  name: "Sample product",
  sellingPrice: 129,
};

export function Tools({ products }) {
  const { t } = useTranslation();
  const [openTool, setOpenTool] = useState(null);

  const product = products[0] ?? { ...SAMPLE_PRODUCT, name: t("lbl.sample") };

  if (openTool === "labelDesigner") {
    return (
      <LabelDesigner product={product} onBack={() => setOpenTool(null)} />
    );
  }

  return (
    <div>
      <p className="mb-3 text-[13px] text-ink-2">{t("tools.desc")}</p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map(({ id, Icon, titleKey, descKey }) => (
          <Card key={id}>
            <button
              type="button"
              onClick={() => setOpenTool(id)}
              className="flex w-full items-start gap-3 rounded-card p-4 text-left transition-colors hover:bg-surface-2"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-2">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-ink-1">
                  {t(titleKey)}
                </span>
                <span className="mt-0.5 block text-[12.5px] text-ink-3">
                  {t(descKey)}
                </span>
              </span>
              <IconChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
