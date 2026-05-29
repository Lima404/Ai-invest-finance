// Parser de CSV (extratos / faturas exportados em planilha)
// Usa papaparse e tenta detectar automaticamente as colunas de
// data, descricao e valor.

import Papa from 'papaparse'
import { parseAmount, toISODate } from '../format'

const DATE_KEYS = ['data', 'date', 'dt', 'lancamento', 'lançamento', 'data lançamento', 'data da compra', 'competencia']
const DESC_KEYS = ['descri', 'historico', 'histórico', 'lançamento', 'lancamento', 'memo', 'estabelecimento', 'titulo', 'título', 'detalhe']
const VALUE_KEYS = ['valor', 'value', 'amount', 'montante', 'quantia']
const CREDIT_KEYS = ['credito', 'crédito', 'entrada', 'receita']
const DEBIT_KEYS = ['debito', 'débito', 'saida', 'saída', 'despesa']

function findKey (headers, candidates) {
  const lower = headers.map((h) => (h || '').toString().toLowerCase().trim())
  for (let i = 0; i < lower.length; i++) {
    if (candidates.some((c) => lower[i].includes(c))) return headers[i]
  }
  return null
}

function parseCsvDate (raw) {
  if (!raw) return ''
  const s = String(raw).trim()
  // dd/mm/aaaa ou dd-mm-aaaa
  let m = s.match(/^(\d{2})[/-](\d{2})[/-](\d{2,4})/)
  if (m) {
    const ano = m[3].length === 2 ? '20' + m[3] : m[3]
    return `${ano}-${m[2]}-${m[1]}`
  }
  // aaaa-mm-dd
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? '' : toISODate(d)
}

export function parseCSV (content) {
  const result = Papa.parse(content.trim(), {
    header: true,
    skipEmptyLines: true,
    delimiter: '' // auto-detect (papaparse adivinha , ; \t)
  })

  const headers = result.meta.fields || []
  const dateKey = findKey(headers, DATE_KEYS)
  const descKey = findKey(headers, DESC_KEYS)
  const valueKey = findKey(headers, VALUE_KEYS)
  const creditKey = findKey(headers, CREDIT_KEYS)
  const debitKey = findKey(headers, DEBIT_KEYS)

  const transactions = []

  for (const row of result.data) {
    const dataISO = parseCsvDate(dateKey ? row[dateKey] : '')
    const descricao = (descKey ? row[descKey] : '') || 'Transação'

    let valor = 0
    if (valueKey && row[valueKey] !== undefined && row[valueKey] !== '') {
      valor = parseAmount(row[valueKey])
    } else if (creditKey || debitKey) {
      const c = creditKey ? parseAmount(row[creditKey]) : 0
      const d = debitKey ? parseAmount(row[debitKey]) : 0
      valor = (Math.abs(c) || 0) - (Math.abs(d) || 0)
    }

    if (valor === 0 && !descKey) continue

    transactions.push({
      data: dataISO || '',
      descricao: String(descricao).trim(),
      valor: Math.abs(valor),
      tipo: valor < 0 ? 'despesa' : 'receita',
      origem: 'Planilha CSV',
      externalId: '',
      meta: {}
    })
  }

  return {
    origem: 'Planilha CSV',
    headers,
    detected: { dateKey, descKey, valueKey, creditKey, debitKey },
    rawRows: result.data,
    count: transactions.length,
    transactions
  }
}

// Re-parse usando mapeamento manual do usuario (quando a deteccao falha)
export function remapCSV (rawRows, mapping) {
  const { dateKey, descKey, valueKey, creditKey, debitKey, sinalInvertido } = mapping
  const transactions = []
  for (const row of rawRows) {
    const dataISO = parseCsvDate(dateKey ? row[dateKey] : '')
    const descricao = (descKey ? row[descKey] : '') || 'Transação'
    let valor = 0
    if (valueKey) valor = parseAmount(row[valueKey])
    else {
      const c = creditKey ? Math.abs(parseAmount(row[creditKey])) : 0
      const d = debitKey ? Math.abs(parseAmount(row[debitKey])) : 0
      valor = c - d
    }
    if (sinalInvertido) valor = -valor
    transactions.push({
      data: dataISO || '',
      descricao: String(descricao).trim(),
      valor: Math.abs(valor),
      tipo: valor < 0 ? 'despesa' : 'receita',
      origem: 'Planilha CSV',
      externalId: '',
      meta: {}
    })
  }
  return transactions
}
