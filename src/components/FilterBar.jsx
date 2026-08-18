import { Select } from "./ui/Select";
import { dateRanges } from "../data/erp";
import { useTranslation } from "../i18n/context";

export function FilterBar({ range, onRangeChange }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        variant="pill"
        label={t("filter.period")}
        caption={t("filter.period")}
        value={range}
        onChange={onRangeChange}
        options={dateRanges.map((item) => ({
          value: item.id,
          label: t(item.labelKey),
        }))}
      />
    </div>
  );
}
