# Pumps Up — ERP Dashboard

An operations dashboard for the Pumps Up ERP. React (JavaScript, no TypeScript),
Vite, and Tailwind CSS 3.4, with a full light/dark theme.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle into dist/
npm run lint
```

## Theming

Two states — **light** and **dark** — from the switch in the top bar. The choice
persists in `localStorage` under `pumpsup.theme`, and an inline script in
[index.html](index.html) applies it before first paint so a dark-mode reload
never flashes white. Light is the default when nothing is stored; the OS setting
is not consulted.

Every color is a CSS custom property defined once in
[src/index.css](src/index.css): the light set on bare `:root`, the dark set under
`.dark`, which [ThemeProvider](src/theme/ThemeProvider.jsx) stamps on `<html>`.
Tailwind maps those variables to utility names (`bg-surface-1`, `text-ink-2`,
`border-line`) in [tailwind.config.js](tailwind.config.js), so no component holds
a literal color and nothing needs a re-render on theme change.

### The logo

The wordmark in [src/components/Logo.jsx](src/components/Logo.jsx) is filled with
`currentColor` and rendered inside `text-ink-1`, which is `#0b0b0b` in light mode
and `#ffffff` in dark — black on light, white on dark, with no duplicate asset.
`LogoMark` is the same path cropped to its leading "P" for the mobile bar and the
favicon.

## Charts

The charts are hand-drawn SVG (no charting dependency) in
[src/components/charts/](src/components/charts/), so mark specs are exact:

- **Validated palettes.** Categorical slots and the single-hue ordinal ramp were
  checked for lightness band, chroma, colorblind separation and surface contrast
  in *both* modes — the dark steps are chosen for the dark surface, not flipped.
- **One series, one color.** The revenue trend and the best-sellers bars each
  show a single nominal series, so there's nothing for a second hue to
  distinguish.
- **Marks:** ≤24px bars with a 4px rounded data-end square at the baseline, 2px
  lines, a 2px surface gap between stacked segments, a 2px surface ring on
  markers, hairline solid gridlines.
- **Every chart has a table twin** via the chart/table switch in each card
  header, so no value is reachable only by hovering. The line chart also responds
  to keyboard arrows when focused.

## Languages

A globe button in the top bar switches between **English**, **Русский** and
**Azərbaycanca**. The choice persists in `localStorage` under
`pumpsup.language` and sets `<html lang>`.

`t(key, vars)` comes from [useTranslation](src/i18n/context.js); strings live in
[src/i18n/translations.js](src/i18n/translations.js), one flat dictionary per
language, with English as the fallback for any missing key. Plural forms use a
`key_one` / `key_few` / `key_many` / `key_other` suffix resolved through
`Intl.PluralRules`, so Russian gets its three-way split without the call sites
knowing about it.

Numbers, currency, dates, months and relative times follow the language too —
`LanguageProvider` re-points the formatters in
[src/lib/format.js](src/lib/format.js) on every language change.

Proper nouns are never translated: product names, customer names, city names,
people and SKUs are data, not UI copy. The language menu lists endonyms, since
it is read by someone who may not read the current UI language.

### The Azerbaijani ICU gap

Browsers ship a reduced ICU dataset with no Azerbaijani date, relative-time or
compact-number data — Chrome renders `Intl.DateTimeFormat('az', {month:'short'})`
as `M08` and `RelativeTimeFormat` as `-18 min`. Node's full-ICU build gets these
right, so this cannot be caught from a test runner alone.
[src/i18n/azFormats.js](src/i18n/azFormats.js) supplies the missing month names,
relative-time phrasing and compact suffixes (`min` / `mln` / `mlrd`), and points
numeric formatting at `tr-TR`, whose grouping and decimal conventions match
Azerbaijani. Translations were produced without a native-speaker review — worth
a pass before this goes in front of users.

Chart y-axis gutters are sized from the rendered tick text rather than fixed,
because English `15K` and Russian `15 тыс.` are not the same width and a fixed
gutter clips the longer one.

## Dashboard

[src/pages/Dashboard.jsx](src/pages/Dashboard.jsx) reads only real state —
`products`, `sales` and the activity log, all lifted in
[App.jsx](src/App.jsx) — never generated data. The **Period** filter (last
3/6/12 months) scopes the KPI tiles and the best-sellers panel; the revenue
chart is the deliberate exception, always the current calendar month
regardless of that filter.

- **KPI tiles** — Revenue, Products sold, Gross margin, Average order
  value — compare the current half of the selected period against the half
  before it (`selectRealKpis` in [src/data/erp.js](src/data/erp.js), built on
  `splitRangeInHalf` in [src/lib/dates.js](src/lib/dates.js)). "Products sold"
  counts sale lines: the catalogue has no notion of a multi-line order, so one
  sold product is what "an order" now means.
- **Revenue** charts daily revenue for the current month, day 1 through
  today, with a month-to-date total in the footer.
- **Best-selling products** ranks by units actually sold in the selected
  period (`selectBestSellers`), not a shipped-volume estimate.
- **Out of stock** lists every catalogue listing with `stock === 0` — a
  snapshot, not scoped to the period.
- **Recent sales** is the newest entries in `sales`, one row per product
  sold (not a multi-line order): product, its current stock, sale value, and
  cash/card via the shared [PaymentTag](src/components/ui/PaymentTag.jsx).
- **Activity log** records one entry per product-level action, this session
  only, newest first — add, edit, delete, return, sell — each a plain
  statement ("Product was sold.") plus which product and when. It is
  in-memory session state seeded empty, deliberately: an audit log that opens
  with invented history would defeat its own purpose. The panel shows the
  newest eight; [Activity](#activity) under Back office is the full list.

## The product list

[ProductSearch](src/components/panels/ProductSearch.jsx) and
[ProductTable](src/components/panels/ProductTable.jsx) are shared by Inventory
and Sales, so both pages read identically. The pages supply the header actions
and what a row click does; the columns, styling and sticky behaviour are common.
Two columns are optional and travel together with the page that asks for them —
Inventory passes `selection` and `showBarcode` and gets a checkbox in front of
every row and the label number behind it, Sales passes neither and gets the
plain three-column list.

The search itself is one function, `filterProducts` in
[src/data/erp.js](src/data/erp.js), so the placeholder over the box tells the
truth on both pages. It matches a substring of the name, the id **or the label
number** — the last so a scanner pointed at the search box, which types the
digits and presses Enter, lands on the right row.

Three layers pin as the page scrolls — search below the app bar, the card header
below search, the column headers below that. Each offset is measured from the
element above rather than hard-coded, so a wrapped button row or a longer
translation never leaves a gap.

## Inventory

[src/pages/Inventory.jsx](src/pages/Inventory.jsx) lists the product catalogue —
name, selling price, stock — from `products` in
[src/data/erp.js](src/data/erp.js), where each record carries a unique `sku`,
`name`, `category`, `stock`, `purchasePrice` and `sellingPrice`; a Shoe record
also carries `color` and `size`. The table carries **Add product**, **Edit
product** and **Return product** in its header:

- **Add** opens a form for the product's *general* information — name,
  category, purchase price, selling price — which every listing created from
  it shares. It defaults to the **Shoe** category and rejects a blank name and
  negative or non-integer stock.
- Choosing **Shoe** replaces the stock field with a **Colors** section. Each
  color added there has a name and its own five stock boxes, one per size
  (`SHOE_SIZES`: 36–40), and submitting creates one catalogue row per color
  and size that got a quantity — a color in a given size is a separate
  listing with its own stock, not a property of one. Black at 36:5 37:8 38:10
  39:6 40:3 plus White at 36:4 37:7 38:9 39:5 40:2 lists as ten rows, so the
  two colors' stock moves independently. Choosing **Bag** hides the section
  and restores the plain stock field for a single row, since bags come in
  neither colors nor sizes here.
- **Ids are generated, never typed.** The format is `PU` + the first 3
  letters of the product name + a 3-letter color code + a random 4-digit
  number, with the stocked size appended for a Shoe: "Nike Air Force", Blue,
  size 37 → `PUNIKBLU192337` (`colorSkuStem` + `sizedSku` in
  [src/data/erp.js](src/data/erp.js)). **The digits are drawn per variant** —
  one fresh number for every color *and* size — so size 38 of that same
  colour is `PUNIKBLU850438`, not `192338`. Every variant is its own listing
  with its own stock and its own label, so no id is reachable by doing
  arithmetic on another one. A Bag has no color or size, so its id stops
  after the digits (`productCode` + `randomDigits4` via `bagSkuStem`:
  `PUEVE4821`). Adding a Shoe, the form shows how far the id is decided — the
  shared `PUNIKBLU` prefix, with the number per size still to come; a Bag's
  whole id is shown, since nothing about it is left to draw. `pickDigits`
  redraws on collision against both the catalogue and the ids minted earlier
  in the same submit — two colors *can* share a code ("Grey" and "Gray" are
  both GRY), and from there only the digits keep them apart. The color code is
  a standard 3-letter
  abbreviation for common names (`COLOR_ABBREVIATIONS`: Black → `BLK`, Blue →
  `BLU`) or, for anything not in that table, its first 3 letters —
  transliterated from Azerbaijani or Cyrillic where it has to be. A collision
  against the catalogue (astronomically unlikely, given the random digits) is
  resolved by picking new digits and trying again, silently — there's no id
  field left for the user to fix by hand.
- A color must be named and stocked in at least one size, and no two colors
  may share a name — a color with nothing on hand creates no rows and would
  otherwise vanish silently on save.
- **Edit** opens the same form pre-filled, always with the plain stock field
  and no color section: it changes one existing listing rather than creating
  new ones. The id is shown but not editable, since color and size are baked
  into it — to restock one color in one size, select that row and edit it.
- **Edit** and **Return** act on the selected row and stay disabled until one is
  picked. A row click, Enter and Space all just select, so mouse and keyboard
  behave identically; a selection hidden by the current search counts as no
  selection.
- **Return** books units back into stock and previews the resulting figure.
- **Ticking rows** is a second, separate axis: the checkbox column feeds
  **Print selected**, while clicking the row still drives the single selection
  Edit and Return work from. Space inside a checkbox belongs to the checkbox,
  so the row's own key handler ignores anything that did not start on the row
  itself. The header box ticks everything *currently listed* — with a search
  active it ticks the matches and unticks them again without disturbing
  anything ticked outside the view — and shows a dash when the page is only
  partly ticked. Ticks survive a search, so narrowing the list to find the next
  product to tag never quietly drops what is already ticked.

Deleting lives inside the edit dialog — **Remove product**, set apart from Save,
opens a confirmation that names the record, states what is lost, and labels both
buttons with their outcome ("Keep product" / "Yes, delete") rather than
OK/Cancel. It replaces the edit dialog rather than stacking on it, and backing
out returns to the form.

Quantity fields (stock, units returned) use a `−` / `+` stepper. Native number
spinners are switched off globally in [src/index.css](src/index.css) — they are a
~10px hit target — so every number input relies on typing or a stepper.

The catalogue is React state held in [App.jsx](src/App.jsx) so edits survive
navigating between modules. There is no backend, so they do not survive a reload.

## Barcode labels

Every listing carries a barcode — one per color *and* size, since that is the
grain a listing exists at, and the point of the label is to tell size 37 from
size 38 at the till. The **Barcode** column closes the Inventory table: the
symbol, with its number underneath.

**The number is derived, not stored.** `barcodeValue` in
[src/lib/barcode.js](src/lib/barcode.js) folds the product id through two
seeded FNV-1a passes into 13 digits. Derived because it is then a pure function
of the id — a product created today and the same product after a reload carry
the same number with no field to keep in sync, and a label printed months ago
still points at the row it came from. It has to be digits at all because
**Code 11 encodes only 0–9 and the dash**, and a product id like
`PUNIKBLU192337` is mostly letters. Two hash passes rather than one: a single
32-bit pass is about 9 digits of spread, and 13 digits of label deserve 13
digits of room.

[src/lib/barcode.js](src/lib/barcode.js) also holds the symbology itself. Code
11 gives every character five elements — bar, space, bar, space, bar — each
narrow (1 unit) or wide (2), separates characters with a one-unit space, and
wraps the lot in a start/stop character. `code11Bars` returns the black bars in
symbol units and [Barcode](src/components/ui/Barcode.jsx) lays them into an SVG
whose viewBox is those same units, so CSS can size the symbol freely: with
`preserveAspectRatio="none"` the bars get taller or shorter without the
narrow-to-wide ratio a scanner reads ever changing. The optional C and K check
digits of the spec are left off, so the digits printed under the bars are
exactly the digits encoded in them. Code 11 is an uncommon symbology — a
scanner generally has to have it switched on explicitly.

**Printing.** Ticked rows feed
[PrintLabelsDialog](src/components/panels/PrintLabelsDialog.jsx), which lists
each product with its color, size, stock and a label count.

- **The count opens at stock** — a delivery lands and every unit of it needs a
  tag — but nothing holds it there: 5 on hand and 20 labels wanted is a
  legitimate job, and a count of 0 skips that product.
- **Label width and height** are set in millimetres on the same dialog, and
  carry over to the next print, since a shop buys one size of label stock and
  stays on it. They describe the *stock*, and are never swapped behind the
  user's back: a 40 × 58 label is 40 × 58 whichever way the artwork runs.
- **Rotate 90°** turns the design a quarter turn on that unchanged stock, for
  a printer that feeds the label one way round and will not be argued with.
  Next to it sits a **preview** of the actual `Label` component at the actual
  proportions, scaled down — the design coming out sideways is then something
  seen before a roll of stock is spent finding out.
- A whole job is capped at `MAX_LABELS_PER_JOB` (1000) and a single product at
  999. Every label is an SVG symbol on a page of its own, so a five-figure job
  would lock the browser up long before it reached the printer. The running
  total sits in the footer and turns red past the job cap.
- The form is `noValidate`: left on, native validation blocks submit on `max`
  or a fractional step before the dialog's own checks run, and answers in
  whatever language the browser happens to be set to.

[LabelSheet](src/components/panels/LabelSheet.jsx) renders the labels into
`#print-root`, a container in [index.html](index.html) that sits *outside* the
React root — printing hides `#root` and shows that instead, rather than trying
to restyle a fixed-height, scrolling, themed app shell onto paper. Only a live
job does that swap, though: the sheet marks the document with a
`printing-labels` class while it is mounted, so Ctrl+P with nothing to print
still prints the page rather than an empty sheet. Print then runs itself: the
sheet mounts, one animation frame later `window.print()` opens the browser's
dialog, and `afterprint` unmounts it. The frame is also what keeps StrictMode's
double-invoked effect from printing twice, since the cleanup cancels the first
one.

**One label per page** — never a grid to cut up. The page *is* the label:
`LabelSheet` writes an `@page { size: <w>mm <h>mm; margin: 0 }` rule from the
two numbers the dialog collected, since `@page` cannot read a custom property,
and every label after the first opens a new page. A 10-label job is 10 pages,
each exactly the label's size, which is what a label printer expects to be fed.

`.label` is that page and `.label-face` is the design on it, which is what
makes rotation a property of the artwork rather than of the paper: on a rotated
label the face's width and height swap and it takes a quarter turn about its
top left corner, walked back into place with a translate. The face is
positioned out of flow to do it, so its pre-rotation box — taller than the page
on a landscape label — cannot push a blank page out behind it. Whether the
driver and the browser agree on the paper is out of the app's hands: the stock
still has to be set up in the printer driver, and picked in the print dialog.

The label carries store name, product name, symbol, number and price in AZN, in
the order of the reference design. Its type is sized from the label's own
height rather than in fixed points (`font-size: calc(var(--label-h) / 14)`,
children in `em`), so a 25 mm label is the same design scaled down instead of
the same design overflowing. The rules live in the print block of
[src/index.css](src/index.css), in millimetres, because a label is a physical
object; the limits on what may be typed are in
[src/lib/labels.js](src/lib/labels.js).

## Sales

[src/pages/Sales.jsx](src/pages/Sales.jsx) shows the same product list with the
same search. Clicking a row adds it to the sale, or increments it if already
there — never past the units actually in stock. Products at zero stock are
marked and cannot be added.

[SalePanel](src/components/panels/SalePanel.jsx) is pinned to the bottom of the
viewport, clear of the sidebar on desktop. It lists the selected products with a
quantity stepper each, the running total, a **Cash / Card** choice on the right,
and **Sell**. The page reserves the panel's *measured* height as bottom padding,
so the last rows never hide behind it however many lines the panel wraps to.

**Sell** opens [SellDialog](src/components/panels/SellDialog.jsx): every line
shows its catalogue selling price and an editable **Sold for**. A single
**Discount (%)** field recomputes each line from *its own selling price* — 100 at
15% gives 85 — rather than from the current sold-for value, so raising and
lowering the discount is lossless instead of compounding. A line edited by hand
keeps its value until the discount changes again. Confirming draws the units down
from stock and empties the panel.

A blank "sold for" is rejected rather than treated as zero: `Number("")` is 0,
which would otherwise confirm a sale at no charge.

Confirming a sale also records it — see below.

## Sales report

[src/pages/Reports.jsx](src/pages/Reports.jsx) (the **Reports** module) lists
what was sold over a chosen period: product, purchase cost, selling price,
**sold for**, quantity, and cash/card. Below the list, **Total sales** and
**Total profit** cards total exactly the rows shown — sales from `soldFor`
(what was actually charged, not the list price), profit against purchase cost.

It opens on **today**, the figure a till is asked for most. The date button
opens [CalendarPicker](src/components/ui/CalendarPicker.jsx), which selects a
single **day**, a whole **month**, a whole **year**, or a custom **range**
(click the first day, then the last — the span previews as you hover). Every
mode resolves to the same closed `{ start, end }` (see
[src/lib/dates.js](src/lib/dates.js)), so the list filters on one comparison
regardless of how the period was chosen, and only the button label cares which
mode produced it.

Sales live in `App.jsx` state alongside the catalogue, seeded from ~3 months of
generated history in [src/data/erp.js](src/data/erp.js) so the calendar has a
past to page through. A sale completed in the app prepends to it and shows up
under today immediately.

A record **copies** the prices it was made at rather than pointing at the
product, because it states what happened on a given day: repricing a product
later must not rewrite last month's takings.

Dates are passed around as `"YYYY-MM-DD"` strings, never `Date` objects — a
sale happened on a calendar day, not an instant, and a string carries no
timezone to shift it across midnight. Being zero-padded and big-endian, they
also compare chronologically as plain strings, so a range test needs no parsing.

### Export

**Export** on the right of the filter row saves the current period as **PDF**
or **Excel**, and is disabled when the period has no sales. Both read one
document model built at click time, so the files always agree with the
screen — and with each other.

There is no export library. `.xlsx` is a ZIP of XML parts, so
[src/lib/zip.js](src/lib/zip.js) is a ~100-line ZIP writer (CRC32, STORE — the
parts are a few KB, so deflating them would only cost a deflate implementation)
and [src/lib/exporters.js](src/lib/exporters.js) writes the OOXML. It's a real
file, not a renamed HTML or CSV one, so Excel doesn't warn that the contents
don't match the extension.

Excel gets the **raw numbers** with a `#,##0.00` cell format, so a column of
prices still sums in a spreadsheet; PDF gets the formatted strings, because
that's read rather than calculated with.

PDF goes through the browser's own print-to-PDF, for two reasons. A hand-written
PDF is limited to the standard 14 fonts, which have no glyph for ₼, Cyrillic or
`ə` — it would silently mangle every non-English report. And the browser
paginates the table for free. It prints a purpose-built window rather than the
app page, so the output is the report alone and *every* row is in it: the
on-screen table scrolls inside its own box, and printing that would stop at the
visible rows.

## Activity

[src/pages/Activity.jsx](src/pages/Activity.jsx) (the **Activity** module, under
Back office) is the whole activity log: every product-level action taken this
session — added, updated, sold, returned, deleted — newest first, with the
product it touched, the clock time, and how long ago that was. Rows name the
product, not its id: the id is what the Inventory table is for, and repeating it
on every line here only crowds out what the entry is actually saying.

- **An edit spells out what it changed**, one line per field, before → after:
  "Stock ~~36~~ → 99", "Selling price ~~₼64.99~~ → ₼54.99". `describeChanges`
  in [App.jsx](src/App.jsx) records every field that moved, raw and unformatted
  — the log is read long after the fact and possibly in another language, and
  a formatted string would freeze the entry in whichever language and currency
  it was written in. The page labels the fields it knows and ignores the rest,
  so a `size` dropped by a category switch never surfaces as a raw key. Saving
  a form untouched still logs, with no detail line to show.
- **A return** shows the reason typed into its dialog.
- **The Action filter** narrows to one kind of action and the count beside it
  re-reads. Each row's dot is colored by action — sold green, updated blue,
  returned amber, deleted red, added orange — but every row also names its
  action in words, so nothing is carried by hue alone.

The dashboard panel and the topbar bell show the newest few of the same
`activityLog` state; this is the full list, not a second one.

Relative times tick once a minute while the page is open — a log left on screen
would otherwise keep insisting an hour-old entry was "1 minute ago". The empty
state says outright that the log is session-only, rather than implying a history
it never had: like the panel, it starts empty on purpose, since an audit log
that opens with invented entries would defeat its own purpose.

One entry is recorded per *listing* affected, so a Shoe added across colors and
sizes logs one line per row it created. Each entry's id is assigned before the
state updater runs, not inside it — a batch that logs several entries at once
would otherwise read the serial after it had already reached its final value and
give every entry in the batch the same id.

## Users

[src/pages/Users.jsx](src/pages/Users.jsx) (the **Users** module, under Back
office) is who can sign in. A record is a `login`, a `password`, a `role` and
the date it was added — [src/data/users.js](src/data/users.js) holds the seed
accounts and the rules. There are two roles for now: **Admin**, which reaches
every screen including this one, and **Cashier**, which is the till — sales and
the product list. The role a row holds is shown as a badge and picked, with its
description next to it, when the account is created.

- **Add user** takes the login, the password and the role. The login is what
  gets typed at sign-in, so it is held to lowercase letters, digits, dot, dash
  and underscore, 3–20 characters. Capitals are folded down rather than
  rejected — typing "Aysel" saves `aysel` — which is also what makes the
  uniqueness check meaningful: two rows that differ only in case would be one
  account to whoever signs in and two rows to whoever reads the list. A
  password is at least 6 characters, with a reveal toggle beside the field,
  since an admin typing a password *for someone else* has to be able to read
  back what they are about to hand over.
- **Delete user** acts on the selected row, the way Inventory's actions do, and
  opens the same style of confirmation — the account named, both buttons
  labelled with their outcome.
- **The last admin cannot be deleted.** With one admin left the button stays
  disabled and says why: there is no backend and no recovery path, so deleting
  the only account that can reach this screen would leave nobody able to create
  another one. Deleting the last *cashier* is fine.

There is no edit — a record is created or removed. Passwords sit in plain memory
exactly as the catalogue does, and the seeded ones are placeholders: this is
session state in the browser, so nothing here survives a reload. Real sign-in
needs a backend that stores a hash, never the password, and the sign-in screen
itself is not built yet — this screen creates the accounts it will check against.

## Layout

```
src/
  App.jsx                 shell: sidebar + topbar + page, product + sales state
  navigation.js           nav model
  theme/                  ThemeProvider + useTheme
  i18n/                   LanguageProvider, dictionaries, az format overrides
  data/erp.js             seeded demo dataset, sales history and selectors
  data/users.js           accounts, roles and the rules a login must satisfy
  lib/                    formatting, calendar dates, axis ticks, zip/exporters
  lib/barcode.js          Code 11 encoding + the label number derived from an id
  lib/labels.js           label size and print-run limits
  components/
    charts/               SVG charts, legend, tooltip, card shell
    panels/               recent sales, out of stock, activity log, product list, sale, users, labels
    ui/                   Card, Button, Modal, StatusPill, Calendar, Export, Barcode, Checkbox
  pages/                  Dashboard, Inventory, Sales, Reports, Activity, Users, placeholder
```

The Dashboard's Period filter sits above everything it scopes; see
[Dashboard](#dashboard) above for which panels follow it and which don't.

## Notes

`src/data/erp.js` is demo data generated from a fixed seed, so figures stay
stable across renders and theme changes — including each seeded product's id,
built by the same generator the Add form uses but fed a seeded random source
instead of `Math.random`, so the catalogue's ids don't reshuffle on reload.
Each seeded shoe is stocked in two colors, so the catalogue that opens already
reads at the color-and-size grain the Add form creates. Swap it for API calls
and nothing above it changes. The one exception is the seeded sales history,
which is generated
relative to *today* rather than a fixed month, so the report always opens on a
day that has something in it. Dashboard, Inventory, Sales and Reports are built
out; the remaining nav modules render a placeholder that says so.

Money is formatted as **AZN** (₼) throughout, from the single `currency: 'AZN'`
in [src/lib/format.js](src/lib/format.js) — `currencyDisplay: 'narrowSymbol'`
is what gets the ₼ glyph instead of the "AZN" code in locales whose default
currency style falls back to it. Switching the app to another currency is a
change to that one field.
