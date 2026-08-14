import { createZip } from './zip'

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function save(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function columnLetter(index) {
  let letter = ''
  let n = index
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter
    n = Math.floor(n / 26) - 1
  }
  return letter
}

const STYLE_PLAIN = 0
const STYLE_BOLD = 1
const STYLE_MONEY = 2

function sheetCell(reference, cell) {
  if (cell.number) {
    return `<c r="${reference}" s="${cell.style}"><v>${cell.value}</v></c>`
  }
  return `<c r="${reference}" s="${cell.style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(
    cell.value,
  )}</t></is></c>`
}

function sheetXml(doc) {
  const grid = []

  grid.push([{ value: doc.title, style: STYLE_BOLD }])
  grid.push([{ value: doc.subtitle, style: STYLE_PLAIN }])
  grid.push([])

  grid.push(doc.columns.map((column) => ({ value: column.label, style: STYLE_BOLD })))

  for (const row of doc.rows) {
    grid.push(
      doc.columns.map((column) =>
        column.numeric
          ? { value: column.value(row), number: true, style: STYLE_MONEY }
          : { value: column.text(row), style: STYLE_PLAIN },
      ),
    )
  }

  grid.push([])
  for (const total of doc.totals) {
    grid.push([
      { value: total.label, style: STYLE_BOLD },
      { value: total.value, number: true, style: STYLE_MONEY },
    ])
  }

  const rows = grid
    .map((cells, rowIndex) => {
      const reference = rowIndex + 1
      const body = cells
        .map((cell, columnIndex) => sheetCell(`${columnLetter(columnIndex)}${reference}`, cell))
        .join('')
      return `<row r="${reference}">${body}</row>`
    })
    .join('')

  const cols = doc.columns
    .map(
      (column, index) =>
        `<col min="${index + 1}" max="${index + 1}" width="${column.width ?? 16}" customWidth="1"/>`,
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${cols}</cols><sheetData>${rows}</sheetData></worksheet>`
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`

export function exportXlsx(doc) {
  const blob = createZip(
    [
      {
        name: '[Content_Types].xml',
        text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
      },
      {
        name: '_rels/.rels',
        text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      },
      {
        name: 'xl/workbook.xml',
        text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(
          doc.sheetName ?? 'Sales',
        )}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      },
      {
        name: 'xl/_rels/workbook.xml.rels',
        text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      },
      { name: 'xl/styles.xml', text: STYLES_XML },
      { name: 'xl/worksheets/sheet1.xml', text: sheetXml(doc) },
    ],
    XLSX_TYPE,
  )
  save(blob, `${doc.fileBase}.xlsx`)
}

export function exportPdf(doc) {
  const win = window.open('', '_blank')
  if (!win) return false

  const header = doc.columns
    .map((column) => `<th class="${column.numeric ? 'right' : ''}">${escapeXml(column.label)}</th>`)
    .join('')

  const body = doc.rows
    .map(
      (row) =>
        `<tr>${doc.columns
          .map(
            (column) =>
              `<td class="${column.numeric ? 'right' : ''}">${escapeXml(column.text(row))}</td>`,
          )
          .join('')}</tr>`,
    )
    .join('')

  const totals = doc.totals
    .map(
      (total) =>
        `<div class="total"><span>${escapeXml(total.label)}</span><strong>${escapeXml(
          total.display,
        )}</strong></div>`,
    )
    .join('')

  win.document.write(`<!doctype html>
<html lang="${escapeXml(doc.lang ?? 'en')}"><head><meta charset="utf-8"><title>${escapeXml(
    doc.fileBase,
  )}</title><style>
  @page { size: A4 landscape; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 12px/1.45 system-ui, -apple-system, 'Segoe UI', sans-serif; color: #111; }
  h1 { margin: 0; font-size: 19px; }
  .sub { margin: 2px 0 16px; color: #666; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #ddd; text-align: left; vertical-align: top; }
  th { border-bottom: 1.5px solid #999; font-size: 11px; text-transform: uppercase; letter-spacing: .02em; color: #444; }
  .right { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .sku { display: block; color: #777; font-size: 10.5px; }
  /* Repeat the head on every page and never split a row across a page break. */
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  .totals { margin-top: 18px; display: flex; gap: 32px; break-inside: avoid; }
  .total { border-top: 2px solid #111; padding-top: 6px; min-width: 190px; }
  .total span { display: block; color: #555; font-size: 11px; }
  .total strong { font-size: 17px; font-variant-numeric: tabular-nums; }
</style></head><body>
  <h1>${escapeXml(doc.title)}</h1>
  <p class="sub">${escapeXml(doc.subtitle)}</p>
  <table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>
  <div class="totals">${totals}</div>
</body></html>`)
  win.document.close()
  win.focus()

  win.onafterprint = () => win.close()
  setTimeout(() => win.print(), 250)
  return true
}
