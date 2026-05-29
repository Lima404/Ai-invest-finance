// Dispatcher de importacao: detecta o tipo de arquivo e chama o parser certo.

import { parseOFX } from './ofx'
import { parseCSV } from './csv'
import { parsePDF } from './pdf'

export { remapCSV } from './csv'

function readAsText (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file, 'utf-8')
  })
}

function readAsArrayBuffer (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export async function parseFile (file) {
  const name = (file.name || '').toLowerCase()

  if (name.endsWith('.ofx') || name.endsWith('.qfx')) {
    const text = await readAsText(file)
    return { ...parseOFX(text), formato: 'OFX', fileName: file.name }
  }

  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    const text = await readAsText(file)
    return { ...parseCSV(text), formato: 'CSV', fileName: file.name }
  }

  if (name.endsWith('.pdf')) {
    const buf = await readAsArrayBuffer(file)
    const res = await parsePDF(buf)
    return { ...res, formato: 'PDF', fileName: file.name }
  }

  // tenta detectar OFX por conteudo
  const text = await readAsText(file)
  if (/<OFX>|<STMTTRN>/i.test(text)) {
    return { ...parseOFX(text), formato: 'OFX', fileName: file.name }
  }
  return { ...parseCSV(text), formato: 'CSV', fileName: file.name }
}
