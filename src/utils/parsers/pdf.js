// Parser de PDF para extratos, faturas e contracheques.
// Extrai o texto com pdfjs-dist e aplica heuristicas.
//
// PDF e' um formato visual; a extracao por heuristica funciona para a
// maioria dos layouts, mas o usuario sempre revisa antes de salvar.

import * as pdfjsLib from 'pdfjs-dist'
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { parseAmount, toISODate } from '../format'

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker

// Reconstroi linhas de texto a partir dos itens posicionados do PDF
async function extractLines (arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const lines = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    const rows = {}
    for (const item of content.items) {
      if (!item.str || !item.str.trim()) continue
      const y = Math.round(item.transform[5])
      const key = Math.round(y / 3) * 3 // agrupa por linha (tolerancia)
      if (!rows[key]) rows[key] = []
      rows[key].push({ x: item.transform[4], str: item.str })
    }
    Object.keys(rows)
      .sort((a, b) => b - a) // y decrescente = de cima para baixo
      .forEach((k) => {
        const line = rows[k].sort((a, b) => a.x - b.x).map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim()
        if (line) lines.push(line)
      })
  }
  return lines
}

const RE_DATE = /(\d{2})[/.-](\d{2})[/.-](\d{2,4})/
const RE_MONEY = /-?\(?\s*R?\$?\s*\d{1,3}(?:\.\d{3})*,\d{2}\)?/g

function lineToISODate (line) {
  const m = line.match(RE_DATE)
  if (!m) return ''
  const ano = m[3].length === 2 ? '20' + m[3] : m[3]
  return `${ano}-${m[2]}-${m[1]}`
}

// ---- Deteccao de contracheque (holerite) ----
const CONTRACHEQUE_HINTS = ['contracheque', 'holerite', 'demonstrativo de pagamento', 'recibo de pagamento', 'liquido a receber', 'líquido a receber', 'total de vencimentos', 'total proventos', 'total de proventos']

function isContracheque (lines) {
  const text = lines.join(' ').toLowerCase()
  return CONTRACHEQUE_HINTS.some((h) => text.includes(h))
}

function parseContracheque (lines) {
  const transactions = []
  const text = lines.join('\n')
  const lower = text.toLowerCase()

  const find = (labels) => {
    for (const line of lines) {
      const ll = line.toLowerCase()
      if (labels.some((l) => ll.includes(l))) {
        const matches = line.match(RE_MONEY)
        if (matches && matches.length) {
          return parseAmount(matches[matches.length - 1])
        }
      }
    }
    return null
  }

  // Data de referencia: tenta "mm/aaaa" ou competencia
  let dataRef = ''
  const compMatch = lower.match(/(0[1-9]|1[0-2])\s*\/\s*(20\d{2})/)
  if (compMatch) dataRef = `${compMatch[2]}-${compMatch[1]}-05`
  if (!dataRef) {
    const d = lineToISODate(lines.find((l) => RE_DATE.test(l)) || '')
    dataRef = d || toISODate(new Date())
  }

  const liquido = find(['liquido a receber', 'líquido a receber', 'valor liquido', 'valor líquido', 'liquido'])
  const proventos = find(['total de vencimentos', 'total proventos', 'total de proventos', 'total vencimentos', 'total de proventos'])
  const descontos = find(['total de descontos', 'total descontos'])

  if (proventos) {
    transactions.push({
      data: dataRef,
      descricao: 'Salário (proventos) - contracheque',
      valor: Math.abs(proventos),
      tipo: 'receita',
      origem: 'Contracheque (PDF)',
      sugestaoCategoria: 'Salário',
      externalId: '',
      meta: { campo: 'proventos' }
    })
  }
  if (descontos) {
    transactions.push({
      data: dataRef,
      descricao: 'Descontos folha (INSS/IR/etc) - contracheque',
      valor: Math.abs(descontos),
      tipo: 'despesa',
      origem: 'Contracheque (PDF)',
      sugestaoCategoria: 'Impostos',
      externalId: '',
      meta: { campo: 'descontos' }
    })
  }
  // Se nao achou proventos mas achou liquido, registra o liquido como receita
  if (!proventos && liquido) {
    transactions.push({
      data: dataRef,
      descricao: 'Salário líquido - contracheque',
      valor: Math.abs(liquido),
      tipo: 'receita',
      origem: 'Contracheque (PDF)',
      sugestaoCategoria: 'Salário',
      externalId: '',
      meta: { campo: 'liquido' }
    })
  }

  return {
    tipoDoc: 'contracheque',
    origem: 'Contracheque (PDF)',
    resumo: { liquido, proventos, descontos, dataRef },
    count: transactions.length,
    transactions
  }
}

// ---- Deteccao generica de lancamentos (extrato/fatura) ----
function parseStatement (lines) {
  const isCreditCard = lines.join(' ').toLowerCase().match(/fatura|cart[aã]o de cr[eé]dito|limite/) !== null
  const origem = isCreditCard ? 'Fatura de cartão (PDF)' : 'Extrato bancário (PDF)'
  const transactions = []

  for (const line of lines) {
    const dateMatch = line.match(RE_DATE)
    if (!dateMatch) continue
    const moneys = line.match(RE_MONEY)
    if (!moneys || !moneys.length) continue

    // O ultimo valor monetario da linha costuma ser o valor do lancamento
    const valorTxt = moneys[moneys.length - 1]
    const valor = parseAmount(valorTxt)
    if (valor === 0) continue

    // Descricao = linha sem a data e sem os valores
    let descricao = line
      .replace(RE_DATE, '')
      .replace(RE_MONEY, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!descricao) descricao = 'Lançamento'

    const negativo = /-|\(/.test(valorTxt) || (isCreditCard && !/pagamento|estorno|credito|crédito/i.test(line))
    transactions.push({
      data: lineToISODate(line),
      descricao,
      valor: Math.abs(valor),
      tipo: negativo ? 'despesa' : 'receita',
      origem,
      externalId: '',
      meta: {}
    })
  }

  return {
    tipoDoc: isCreditCard ? 'fatura' : 'extrato',
    origem,
    count: transactions.length,
    transactions
  }
}

export async function parsePDF (arrayBuffer) {
  const lines = await extractLines(arrayBuffer)
  if (isContracheque(lines)) {
    return { ...parseContracheque(lines), lines }
  }
  return { ...parseStatement(lines), lines }
}
