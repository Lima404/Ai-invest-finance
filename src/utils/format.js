// Utilitarios de formatacao (pt-BR)

export function formatBRL (value) {
  const n = Number(value || 0)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatNumber (value, digits = 2) {
  return Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })
}

// Recebe Date ou string ISO (yyyy-mm-dd) e devolve dd/mm/aaaa
export function formatDate (value) {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value + (value.length === 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('pt-BR')
}

// yyyy-mm para "mai/2026"
export function formatMonthLabel (ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-').map(Number)
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${meses[(m || 1) - 1]}/${y}`
}

// Date/string -> yyyy-mm-dd
export function toISODate (value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// yyyy-mm-dd -> yyyy-mm
export function monthKey (isoDate) {
  return (isoDate || '').slice(0, 7)
}

// Converte texto monetario "R$ 1.234,56" / "-1234.56" em Number
export function parseAmount (raw) {
  if (typeof raw === 'number') return raw
  if (!raw) return 0
  let s = String(raw).trim()
  const neg = /^-/.test(s) || /\(.*\)/.test(s) || /\bD\b$/i.test(s)
  s = s.replace(/[^\d,.-]/g, '')
  // formato brasileiro: ponto separa milhar, virgula separa decimal
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (s.includes(',')) {
    s = s.replace(',', '.')
  }
  let n = parseFloat(s)
  if (Number.isNaN(n)) n = 0
  return neg ? -Math.abs(n) : n
}
