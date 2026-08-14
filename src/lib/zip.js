
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let value = i
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }
    table[i] = value >>> 0
  }
  return table
})()

function crc32(bytes) {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const DOS_DATE = 0x21
const DOS_TIME = 0

const LOCAL_HEADER = 30
const CENTRAL_HEADER = 46
const END_RECORD = 22
const FLAG_UTF8 = 0x0800

export function createZip(files, type = 'application/zip') {
  const encoder = new TextEncoder()
  const parts = []
  const directory = []
  let offset = 0

  for (const file of files) {
    const name = encoder.encode(file.name)
    const data = encoder.encode(file.text)
    const crc = crc32(data)

    const local = new Uint8Array(LOCAL_HEADER + name.length)
    const localView = new DataView(local.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true)
    localView.setUint16(6, FLAG_UTF8, true)
    localView.setUint16(8, 0, true)
    localView.setUint16(10, DOS_TIME, true)
    localView.setUint16(12, DOS_DATE, true)
    localView.setUint32(14, crc, true)
    localView.setUint32(18, data.length, true)
    localView.setUint32(22, data.length, true)
    localView.setUint16(26, name.length, true)
    localView.setUint16(28, 0, true)
    local.set(name, LOCAL_HEADER)

    parts.push(local, data)

    const entry = new Uint8Array(CENTRAL_HEADER + name.length)
    const entryView = new DataView(entry.buffer)
    entryView.setUint32(0, 0x02014b50, true)
    entryView.setUint16(4, 20, true)
    entryView.setUint16(6, 20, true)
    entryView.setUint16(8, FLAG_UTF8, true)
    entryView.setUint16(10, 0, true)
    entryView.setUint16(12, DOS_TIME, true)
    entryView.setUint16(14, DOS_DATE, true)
    entryView.setUint32(16, crc, true)
    entryView.setUint32(20, data.length, true)
    entryView.setUint32(24, data.length, true)
    entryView.setUint16(28, name.length, true)
    entryView.setUint32(42, offset, true)
    entry.set(name, CENTRAL_HEADER)
    directory.push(entry)

    offset += local.length + data.length
  }

  const directorySize = directory.reduce((sum, entry) => sum + entry.length, 0)

  const end = new Uint8Array(END_RECORD)
  const endView = new DataView(end.buffer)
  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(8, files.length, true)
  endView.setUint16(10, files.length, true)
  endView.setUint32(12, directorySize, true)
  endView.setUint32(16, offset, true)

  return new Blob([...parts, ...directory, end], { type })
}
