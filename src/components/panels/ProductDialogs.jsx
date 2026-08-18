import { useId, useState } from 'react'
import { Modal, ModalFooter } from '../ui/Modal'
import { Button } from '../ui/Button'
import { NumberStepper } from '../ui/NumberStepper'
import { IconAlert, IconPlus, IconTrash } from '../Icons'
import { Select } from '../ui/Select'
import { formatNumber, formatPrice } from '../../lib/format'
import {
  bagSkuStem,
  categories,
  colorCodePrefix,
  colorSkuStem,
  listingName,
  pickDigits,
  productCode,
  randomDigits4,
  SHOE_SIZES,
  sizedSku,
} from '../../data/erp'
import { useTranslation } from '../../i18n/context'

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-ink-2">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11.5px] text-ink-3">{hint}</span> : null}
    </label>
  )
}

function FieldGroup({ label, hint, children }) {
  const labelId = useId()
  return (
    <div role="group" aria-labelledby={labelId}>
      <span id={labelId} className="block text-[12.5px] font-medium text-ink-2">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11.5px] text-ink-3">{hint}</span> : null}
    </div>
  )
}

function StaticField({ label, value, hint }) {
  return (
    <div>
      <span className="block text-[12.5px] font-medium text-ink-2">{label}</span>
      <p className="mt-1 flex h-9 items-center rounded-lg border border-dashed border-line bg-surface-2 px-3 text-[13px] tabular-nums text-ink-2">
        {value}
      </p>
      {hint ? <span className="mt-1 block text-[11.5px] text-ink-3">{hint}</span> : null}
    </div>
  )
}

const inputClass =
  'mt-1 h-9 w-full rounded-lg border border-line bg-surface-2 px-3 text-[13px] text-ink-1 placeholder:text-ink-3 focus:bg-surface-1'

const cardInputClass =
  'mt-1 h-9 w-full rounded-lg border border-line bg-surface-1 px-3 text-[13px] text-ink-1 placeholder:text-ink-3'

let colorSerial = 0

function blankColor(focus = false) {
  colorSerial += 1
  return {
    key: colorSerial,
    focus,
    name: '',
    sizes: Object.fromEntries(SHOE_SIZES.map((size) => [size, ''])),
  }
}

const unitsIn = (color) =>
  SHOE_SIZES.reduce((sum, size) => sum + (Number(color.sizes[size]) || 0), 0)

function ColorCard({ color, codePrefix, canRemove, onName, onSize, onRemove }) {
  const { t } = useTranslation()
  const total = unitsIn(color)

  return (
    <div className="rounded-lg border border-line bg-surface-2 p-3">
      <div className="flex items-end gap-2">
        <label className="min-w-0 flex-1">
          <span className="text-[11.5px] font-medium text-ink-3">{t('dlg.colorName')}</span>
          <input
            className={cardInputClass}
            value={color.name}
            onChange={onName}
            placeholder={t('dlg.colorPlaceholder')}
            autoFocus={color.focus}
          />
        </label>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          title={t('dlg.removeColor')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-1 text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink-1 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface-1"
        >
          <IconTrash className="h-4 w-4" />
          <span className="sr-only">{t('dlg.removeColor')}</span>
        </button>
      </div>

      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {SHOE_SIZES.map((size) => (
          <label key={size} className="block text-center">
            <span className="block text-[11.5px] font-medium text-ink-3">{size}</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              className="mt-1 h-9 w-full rounded-lg border border-line bg-surface-1 px-1 text-center text-[13px] tabular-nums text-ink-1 placeholder:text-ink-3"
              value={color.sizes[size]}
              onChange={onSize(size)}
              placeholder="0"
              aria-label={t('dlg.colorSizeLabel', {
                color: color.name.trim() || t('dlg.colorName'),
                size,
              })}
            />
          </label>
        ))}
      </div>

      <p className="mt-2 flex items-center justify-between gap-3 text-[11.5px] text-ink-3">
        <span className="truncate tabular-nums">
          {codePrefix ? t('dlg.colorPrefix', { prefix: codePrefix }) : t('dlg.colorPending')}
        </span>
        <span className="shrink-0">{t('dlg.onHand', { count: formatNumber(total) })}</span>
      </p>
    </div>
  )
}

export function ProductFormDialog({
  product,
  existingSkus,
  onCancel,
  onSubmit,
  onRequestDelete,
}) {
  const { t } = useTranslation()
  const editing = Boolean(product)

  const [form, setForm] = useState(() => ({
    name: product?.name ?? '',
    category: product?.category ?? 'Shoe',
    stock: product ? String(product.stock) : '',
    purchasePrice: product ? String(product.purchasePrice) : '',
    sellingPrice: product ? String(product.sellingPrice) : '',
  }))
  const [colors, setColors] = useState(() => [blankColor()])
  // A Bag has no color card of its own to carry its digits, so the dialog
  // holds one directly — picked once, up front, for the same reason a
  // color's is: a stable preview instead of one that reshuffles as the
  // fields fill in. Unused, and harmless, when editing or adding a Shoe.
  const [bagDigits] = useState(() => randomDigits4())
  const [error, setError] = useState(null)

  const set = (key) => (event) => {
    setForm({ ...form, [key]: event.target.value })
    setError(null)
  }

  const editColors = (update) => {
    setColors(update)
    setError(null)
  }

  const setColorName = (key) => (event) =>
    editColors((list) =>
      list.map((color) => (color.key === key ? { ...color, name: event.target.value } : color)),
    )

  const setColorSize = (key) => (size) => (event) =>
    editColors((list) =>
      list.map((color) =>
        color.key === key
          ? { ...color, sizes: { ...color.sizes, [size]: event.target.value } }
          : color,
      ),
    )

  const isShoe = form.category === 'Shoe'
  const showColors = !editing && isShoe

  // Editing: the record's own, unchangeable id. Adding a Shoe: just the
  // shared "PU" + name-code stem — each color's own card shows the rest,
  // since the color and its random digits aren't decided at this level.
  // Adding a Bag: the actual id it will be saved under, since a Bag has
  // nothing left to append.
  const baseSku = editing
    ? product.sku
    : showColors
      ? `PU${productCode(form.name)}`
      : bagSkuStem(form.name, bagDigits)
  const rowCount = colors.reduce(
    (total, color) => total + SHOE_SIZES.filter((size) => Number(color.sizes[size]) > 0).length,
    0,
  )
  const idHintKey = editing ? 'dlg.idFixed' : showColors ? 'dlg.idAutoColors' : 'dlg.idAuto'

  function handleSubmit(event) {
    event.preventDefault()

    const name = form.name.trim()
    const category = form.category
    const purchasePrice = Number(form.purchasePrice)
    const sellingPrice = Number(form.sellingPrice)

    if (!name) return setError(t('err.name'))
    if (!Number.isFinite(purchasePrice) || purchasePrice < 0) return setError(t('err.purchase'))
    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) return setError(t('err.selling'))

    const idTaken = (candidate) =>
      existingSkus.some(
        (value) =>
          value.toUpperCase() === candidate.toUpperCase() &&
          value.toUpperCase() !== product?.sku.toUpperCase(),
      )

    if (showColors) {
      const names = colors.map((color) => color.name.trim())
      if (names.some((colorName) => !colorName)) return setError(t('err.colorName'))

      const seen = new Set()
      for (const colorName of names) {
        const key = colorName.toLowerCase()
        if (seen.has(key)) return setError(t('err.colorDup', { name: colorName }))
        seen.add(key)
      }

      const rows = []
      // The catalogue's ids plus every id minted by this submit, so two rows
      // created together cannot land on the same one either — two colors can
      // share a code ("Grey" and "Gray" are both GRY), and from there it is
      // only the digits keeping them apart. Uppercased, because a catalogue id
      // is compared without regard to case.
      const taken = new Set(existingSkus.map((sku) => sku.toUpperCase()))

      for (const [index, color] of colors.entries()) {
        const colorName = names[index]
        const sizeQty = {}

        for (const size of SHOE_SIZES) {
          const raw = color.sizes[size]
          const qty = raw === '' ? 0 : Number(raw)
          if (!Number.isInteger(qty) || qty < 0) return setError(t('err.sizes'))
          if (qty > 0) sizeQty[size] = qty
        }

        const stockedSizes = Object.keys(sizeQty).map(Number)
        if (stockedSizes.length === 0) return setError(t('err.colorEmpty', { name: colorName }))

        for (const size of stockedSizes) {
          // One draw per size, not per color: each variant is its own listing
          // and gets its own random number. The digits are the system's to
          // pick, so a collision is resolved by drawing again rather than by
          // asking the user to fix an id field that no longer exists.
          const idFor = (d) => sizedSku(colorSkuStem(name, colorName, d), size)
          const digits = pickDigits(idFor, taken)

          rows.push({
            name: listingName(name, colorName, size),
            sku: idFor(digits),
            category,
            color: colorName,
            size,
            stock: sizeQty[size],
            purchasePrice,
            sellingPrice,
          })
        }
      }

      if (rows.length === 0) return setError(t('err.colorsEmpty'))
      return onSubmit(rows)
    }

    // Editing keeps the record's own, already-assigned id untouched — the
    // check below only guards against it somehow no longer being unique.
    // Adding a Bag generates one the same way a color does: pick, and only
    // re-pick if it collides.
    let finalSku = baseSku
    if (!editing) {
      let digits = bagDigits
      finalSku = bagSkuStem(name, digits)
      let attempts = 0
      while (idTaken(finalSku) && attempts < 20) {
        digits = randomDigits4()
        finalSku = bagSkuStem(name, digits)
        attempts += 1
      }
    } else if (idTaken(finalSku)) {
      return setError(t('err.idDup', { id: finalSku }))
    }

    const stock = Number(form.stock)
    if (!Number.isInteger(stock) || stock < 0) return setError(t('err.stock'))

    return onSubmit([
      {
        name,
        sku: finalSku,
        category,
        color: category === 'Shoe' ? product?.color : undefined,
        size: category === 'Shoe' ? product?.size : undefined,
        stock,
        purchasePrice,
        sellingPrice,
      },
    ])
  }

  return (
    <Modal
      title={t(editing ? 'dlg.editTitle' : 'dlg.addTitle')}
      description={t(editing ? 'dlg.editDesc' : 'dlg.addDesc')}
      onClose={onCancel}
    >
      <form onSubmit={handleSubmit}>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-5 py-4">
          <Field label={t('dlg.name')}>
            <input
              className={inputClass}
              value={form.name}
              onChange={set('name')}
              placeholder="Classic Court Sneaker"
              autoFocus
            />
          </Field>

          <Field label={t('dlg.category')}>
            <span className="mt-1 block">
              <Select
                label={t('dlg.category')}
                value={form.category}
                onChange={(value) => {
                  setForm({ ...form, category: value })
                  setError(null)
                }}
                options={categories.map((id) => ({
                  value: id,
                  label: t(`category.${id}`),
                }))}
              />
            </span>
          </Field>

          <StaticField label={t('dlg.id')} value={baseSku} hint={t(idHintKey)} />

          {showColors ? (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <span className="text-[12.5px] font-medium text-ink-2">{t('dlg.colors')}</span>
                <Button size="sm" onClick={() => editColors((list) => [...list, blankColor(true)])}>
                  <IconPlus className="h-3.5 w-3.5" />
                  {t('dlg.addColor')}
                </Button>
              </div>
              <p className="text-[11.5px] text-ink-3">{t('dlg.colorsHint')}</p>

              {colors.map((color) => (
                <ColorCard
                  key={color.key}
                  color={color}
                  codePrefix={
                    color.name.trim()
                      ? colorCodePrefix(form.name, color.name)
                      : null
                  }
                  canRemove={colors.length > 1}
                  onName={setColorName(color.key)}
                  onSize={setColorSize(color.key)}
                  onRemove={() =>
                    editColors((list) => list.filter((entry) => entry.key !== color.key))
                  }
                />
              ))}

              {rowCount > 0 ? (
                <p className="text-[11.5px] text-ink-3">
                  {t('dlg.willCreate', { count: rowCount })}
                </p>
              ) : null}
            </div>
          ) : (
            <FieldGroup label={t('dlg.stock')}>
              <NumberStepper
                className="mt-1"
                value={form.stock}
                onChange={(value) => {
                  setForm({ ...form, stock: value })
                  setError(null)
                }}
                decreaseLabel={t('dlg.decrease')}
                increaseLabel={t('dlg.increase')}
                inputProps={{ placeholder: '0', 'aria-label': t('dlg.stock') }}
              />
            </FieldGroup>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label={t('dlg.purchase')}>
              <input
                className={`${inputClass} tabular-nums`}
                type="number"
                min="0"
                step="0.01"
                value={form.purchasePrice}
                onChange={set('purchasePrice')}
                placeholder="0.00"
              />
            </Field>
            <Field label={t('dlg.selling')}>
              <input
                className={`${inputClass} tabular-nums`}
                type="number"
                min="0"
                step="0.01"
                value={form.sellingPrice}
                onChange={set('sellingPrice')}
                placeholder="0.00"
              />
            </Field>
          </div>

          {error ? (
            <p role="alert" className="text-[12.5px]" style={{ color: 'var(--status-critical)' }}>
              {error}
            </p>
          ) : null}
        </div>

        <ModalFooter>
          {editing ? (
            <Button variant="dangerText" onClick={onRequestDelete} className="mr-auto">
              <IconTrash className="h-4 w-4" />
              {t('dlg.remove')}
            </Button>
          ) : null}
          <Button onClick={onCancel}>{t('dlg.cancel')}</Button>
          <Button variant="primary" type="submit">
            {t(editing ? 'dlg.save' : 'dlg.addTitle')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export function DeleteProductDialog({ product, onCancel, onConfirm }) {
  const { t } = useTranslation()

  return (
    <Modal ariaLabel={t('dlg.confirmTitle')} onClose={onCancel}>
      <div className="px-6 pb-2 pt-6 text-center">
        <span className="relative mx-auto flex h-12 w-12 items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: 'var(--status-critical)', opacity: 0.14 }}
          />
          <IconAlert className="relative h-6 w-6" style={{ color: 'var(--status-critical)' }} />
        </span>

        <h2 className="mt-3 text-[16px] font-semibold text-ink-1">{t('dlg.confirmTitle')}</h2>

        <div className="mt-3 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-left">
          <p className="truncate text-[13px] font-medium text-ink-1">{product.name}</p>
          <p className="text-[11.5px] tabular-nums text-ink-3">
            {product.sku} · {t('dlg.onHand', { count: formatNumber(product.stock) })}
          </p>
        </div>

        <p className="mt-3 text-[13px] text-ink-2">
          {t('dlg.confirmBody', { stock: formatNumber(product.stock) })}
        </p>
        <p className="mt-1.5 text-[12.5px] font-medium" style={{ color: 'var(--status-critical)' }}>
          {t('dlg.confirmWarn')}
        </p>
      </div>

      <ModalFooter>
        <Button onClick={onCancel}>{t('dlg.confirmKeep')}</Button>
        <Button variant="destructive" onClick={onConfirm}>
          <IconTrash className="h-4 w-4" />
          {t('dlg.confirmDelete')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export function ReturnProductDialog({ product, onCancel, onConfirm }) {
  const { t } = useTranslation()
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()
    const units = Number(quantity)
    if (!Number.isInteger(units) || units < 1) return setError(t('err.units'))
    const trimmedReason = reason.trim()
    if (!trimmedReason) return setError(t('err.reason'))
    return onConfirm(units, trimmedReason)
  }

  const units = Number(quantity)
  const preview = Number.isInteger(units) && units > 0 ? product.stock + units : null

  return (
    <Modal title={t('dlg.retTitle')} description={t('dlg.retDesc')} onClose={onCancel}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-3 px-5 py-4">
          <div className="rounded-lg border border-line bg-surface-2 px-3 py-2.5">
            <p className="text-[13px] font-medium text-ink-1">{product.name}</p>
            <p className="text-[11.5px] tabular-nums text-ink-3">
              {product.sku} · {t('dlg.onHand', { count: formatNumber(product.stock) })} ·{' '}
              {formatPrice(product.sellingPrice)}
            </p>
          </div>

          <FieldGroup
            label={t('dlg.retUnits')}
            hint={
              preview === null
                ? undefined
                : t('dlg.retPreview', { value: formatNumber(preview) })
            }
          >
            <NumberStepper
              className="mt-1"
              value={quantity}
              min={1}
              onChange={(value) => {
                setQuantity(value)
                setError(null)
              }}
              decreaseLabel={t('dlg.decrease')}
              increaseLabel={t('dlg.increase')}
              inputProps={{ autoFocus: true, 'aria-label': t('dlg.retUnits') }}
            />
          </FieldGroup>

          <Field label={t('dlg.retReason')}>
            <textarea
              className={`${inputClass} h-auto resize-none`}
              rows={2}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value)
                setError(null)
              }}
              placeholder={t('dlg.retReasonPlaceholder')}
            />
          </Field>

          {error ? (
            <p role="alert" className="text-[12.5px]" style={{ color: 'var(--status-critical)' }}>
              {error}
            </p>
          ) : null}
        </div>

        <ModalFooter>
          <Button onClick={onCancel}>{t('dlg.cancel')}</Button>
          <Button variant="primary" type="submit">
            {t('dlg.retConfirm')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
