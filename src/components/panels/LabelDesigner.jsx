import { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";
import { LabelCanvas } from "./LabelCanvas";
import {
  IconAlignBottom,
  IconAlignCenter,
  IconAlignLeft,
  IconAlignMiddle,
  IconAlignRight,
  IconAlignTop,
  IconChevronLeft,
} from "../Icons";
import { Select } from "../ui/Select";
import { useLabelTemplate } from "../../labels/context";
import {
  alignBox,
  ALIGNMENTS,
  DEFAULT_TEMPLATE,
  FONT_MAX_PT,
  FONT_MIN_PT,
  FONT_WEIGHTS,
  LABEL_ELEMENTS,
  LINE_MAX,
  LINE_MIN,
  MARGIN_MAX_MM,
  MIN_ELEMENT_H,
  MIN_ELEMENT_W,
  STORE_NAME_MAX,
  clamp,
  isSameTemplate,
  normalizeTemplate,
  withElement,
} from "../../lib/labelTemplate";
import { LABEL_MAX_MM, LABEL_MIN_MM } from "../../lib/labels";
import { useTranslation } from "../../i18n/context";
import { usePending } from "../../lib/usePending";

const ALIGN_ICONS = {
  left: IconAlignLeft,
  center: IconAlignCenter,
  right: IconAlignRight,
};

const SNAP_POSITIONS = [
  { axis: "x", position: "start", labelKey: "lbl.align.left", Icon: IconAlignLeft },
  { axis: "x", position: "center", labelKey: "lbl.align.center", Icon: IconAlignCenter },
  { axis: "x", position: "end", labelKey: "lbl.align.right", Icon: IconAlignRight },
  { axis: "y", position: "start", labelKey: "lbl.align.top", Icon: IconAlignTop },
  { axis: "y", position: "center", labelKey: "lbl.align.middle", Icon: IconAlignMiddle },
  { axis: "y", position: "end", labelKey: "lbl.align.bottom", Icon: IconAlignBottom },
];

export function LabelDesigner({ product, onBack }) {
  const { t } = useTranslation();
  const { template: saved, save } = useLabelTemplate();
  const [saving, runSave] = usePending();
  const [draft, setDraft] = useState(saved);
  const [selectedId, setSelectedId] = useState("name");

  const dirty = !isSameTemplate(draft, saved);
  const selected = LABEL_ELEMENTS.find((item) => item.id === selectedId);
  const element = draft.elements[selectedId];

  const setLabelField = (key) => (value) =>
    setDraft((current) => normalizeTemplate({ ...current, [key]: value }));

  const setElementField = (key) => (value) =>
    setDraft((current) => withElement(current, selectedId, { [key]: value }));

  const setGeometry = (id, box) =>
    setDraft((current) => withElement(current, id, box));

  return (
    <div className="flex flex-col gap-4 lg:h-full lg:min-h-0">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onBack}>
          <IconChevronLeft className="h-4 w-4" />
          {t("tools.back")}
        </Button>

        <p className="mr-auto text-[13px] text-ink-3" aria-live="polite">
          {dirty ? t("lbl.unsaved") : t("lbl.saved")}
        </p>

        <Button onClick={() => setDraft(DEFAULT_TEMPLATE)}>
          {t("lbl.reset")}
        </Button>
        {dirty ? (
          <Button onClick={() => setDraft(saved)}>{t("lbl.discard")}</Button>
        ) : null}
        <Button
          variant="primary"
          onClick={() => runSave(() => save(draft))}
          disabled={!dirty}
          pending={saving}
        >
          {t("lbl.save")}
        </Button>
      </div>

      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[minmax(0,1fr)]">
        <Card className="flex min-h-[340px] flex-col overflow-hidden">
          <LabelCanvas
            template={draft}
            product={product}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChange={setGeometry}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5">
            <p className="text-[11.5px] text-ink-3">{t("lbl.dragHint")}</p>
            <p className="text-[11.5px] tabular-nums text-ink-3">
              {t("prn.preview", { width: draft.width, height: draft.height })}
            </p>
          </div>
        </Card>

        <Card className="lg:min-h-0 lg:overflow-y-auto">
          <Section title={t("lbl.section.label")}>
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label={t("prn.width")}
                value={draft.width}
                onChange={setLabelField("width")}
                min={LABEL_MIN_MM}
                max={LABEL_MAX_MM}
              />
              <NumberField
                label={t("prn.height")}
                value={draft.height}
                onChange={setLabelField("height")}
                min={LABEL_MIN_MM}
                max={LABEL_MAX_MM}
              />
              <NumberField
                label={t("lbl.margin")}
                value={draft.margin}
                onChange={setLabelField("margin")}
                min={0}
                max={MARGIN_MAX_MM}
                step={0.5}
              />
              <div className="flex items-end">
                <label className="flex h-8 cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={draft.rotate}
                    onChange={() => setLabelField("rotate")(!draft.rotate)}
                  />
                  <span className="text-[12.5px] text-ink-2">
                    {t("prn.rotate")}
                  </span>
                </label>
              </div>
            </div>

            <label className="mt-2 block">
              <span className="text-[12px] font-medium text-ink-2">
                {t("lbl.storeName")}
              </span>
              <input
                type="text"
                value={draft.storeName}
                maxLength={STORE_NAME_MAX}
                onChange={(event) =>
                  setLabelField("storeName")(event.target.value)
                }
                className="mt-1 h-8 w-full rounded-lg border border-line bg-surface-2 px-2 text-[13px] text-ink-1 focus:bg-surface-1"
              />
            </label>
          </Section>

          <Section title={t("lbl.section.elements")}>
            <ul className="space-y-1">
              {LABEL_ELEMENTS.map(({ id, labelKey }) => {
                const item = draft.elements[id];
                const name = t(labelKey);

                return (
                  <li
                    key={id}
                    className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                      id === selectedId
                        ? "border-accent bg-accent-soft"
                        : "border-line bg-surface-2"
                    }`}
                  >
                    <Checkbox
                      checked={item.visible}
                      onChange={() =>
                        setDraft((current) =>
                          withElement(current, id, { visible: !item.visible }),
                        )
                      }
                      label={t("lbl.show", { name })}
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedId(id)}
                      className={`flex-1 text-left text-[13px] ${
                        item.visible ? "text-ink-1" : "text-ink-3 line-through"
                      }`}
                    >
                      {name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Section>

          <Section title={t(selected.labelKey)} last>
            {element.visible ? null : (
              <p className="mb-2 text-[11.5px] text-ink-3">{t("lbl.hidden")}</p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label={t("lbl.x")}
                value={element.x}
                onChange={setElementField("x")}
                min={0}
                max={100 - element.w}
                step={0.5}
              />
              <NumberField
                label={t("lbl.y")}
                value={element.y}
                onChange={setElementField("y")}
                min={0}
                max={100 - element.h}
                step={0.5}
              />
              <NumberField
                label={t("lbl.w")}
                value={element.w}
                onChange={setElementField("w")}
                min={MIN_ELEMENT_W}
                max={100 - element.x}
                step={0.5}
              />
              <NumberField
                label={t("lbl.h")}
                value={element.h}
                onChange={setElementField("h")}
                min={MIN_ELEMENT_H}
                max={100 - element.y}
                step={0.5}
              />
            </div>

            <Control label={t("lbl.snap")}>
              <div className="flex gap-1">
                {SNAP_POSITIONS.map(({ axis, position, labelKey, Icon }, index) => (
                  <button
                    key={labelKey}
                    type="button"
                    onClick={() =>
                      setDraft((current) =>
                        withElement(
                          current,
                          selectedId,
                          alignBox(element, axis, position),
                        ),
                      )
                    }
                    title={t(labelKey)}
                    className={`flex h-8 flex-1 items-center justify-center rounded-lg border border-line bg-surface-2 text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink-1 ${
                      index === 3 ? "ml-1.5" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="sr-only">{t(labelKey)}</span>
                  </button>
                ))}
              </div>
            </Control>

            {selected.kind === "text" || selected.kind === "logo" ? (
              <Control label={t("lbl.align")}>
                <div className="flex gap-1">
                  {ALIGNMENTS.map((align) => {
                    const Icon = ALIGN_ICONS[align];
                    const active = element.align === align;
                    const name = t(`lbl.align.${align}`);

                    return (
                      <button
                        key={align}
                        type="button"
                        onClick={() => setElementField("align")(align)}
                        aria-pressed={active}
                        title={name}
                        className={`flex h-8 flex-1 items-center justify-center rounded-lg border transition-colors ${
                          active
                            ? "border-accent bg-accent-soft text-ink-1"
                            : "border-line bg-surface-2 text-ink-2 hover:text-ink-1"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="sr-only">{name}</span>
                      </button>
                    );
                  })}
                </div>
              </Control>
            ) : null}

            {selected.kind === "text" ? (
              <>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <NumberField
                    label={t("lbl.fontSize")}
                    value={element.fontSize}
                    onChange={setElementField("fontSize")}
                    min={FONT_MIN_PT}
                    max={FONT_MAX_PT}
                    step={0.5}
                  />
                  <NumberField
                    label={t("lbl.lineHeight")}
                    value={element.lineHeight}
                    onChange={setElementField("lineHeight")}
                    min={LINE_MIN}
                    max={LINE_MAX}
                    step={0.05}
                  />
                </div>

                <Control label={t("lbl.fontWeight")}>
                  <Select
                    size="sm"
                    label={t("lbl.fontWeight")}
                    value={element.fontWeight}
                    onChange={setElementField("fontWeight")}
                    options={FONT_WEIGHTS.map((weight) => ({
                      value: weight,
                      label: t(`lbl.weight.${weight}`),
                    }))}
                  />
                </Control>
              </>
            ) : (
              <p className="mt-2 text-[11.5px] text-ink-3">
                {t(selected.kind === "logo" ? "lbl.logoHint" : "lbl.barcodeHint")}
              </p>
            )}
          </Section>
        </Card>
      </div>
    </div>
  );
}

function Control({ label, children }) {
  return (
    <div className="mt-2">
      <span className="block text-[12px] font-medium text-ink-2">{label}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Section({ title, last = false, children }) {
  return (
    <section
      className={`px-4 py-3.5 ${last ? "" : "border-b border-line"}`}
    >
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-3">
        {title}
      </h3>
      {children}
    </section>
  );
}

function NumberField({ label, value, onChange, min, max, step = 1 }) {
  const [text, setText] = useState(String(value));

  useEffect(() => setText(String(value)), [value]);

  return (
    <label className="block">
      <span className="text-[12px] font-medium text-ink-2">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={text}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          const parsed = Number(next);
          if (next !== "" && Number.isFinite(parsed) && parsed >= min && parsed <= max) {
            onChange(parsed);
          }
        }}
        onBlur={() => {
          const parsed = Number(text);
          const settled =
            text === "" || !Number.isFinite(parsed)
              ? value
              : clamp(parsed, min, max);
          setText(String(settled));
          if (settled !== value) onChange(settled);
        }}
        className="mt-1 h-8 w-full rounded-lg border border-line bg-surface-2 px-2 text-[13px] tabular-nums text-ink-1 focus:bg-surface-1"
      />
    </label>
  );
}
