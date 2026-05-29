// Parser de arquivos OFX (extratos bancarios e faturas de cartao)
// OFX e' um formato SGML/XML-like. Tratamos as duas variantes.

import { toISODate } from '../format'

function ofxDateToISO (raw) {
  if (!raw) return ''
  // formatos: AAAAMMDD ou AAAAMMDDHHMMSS[.xxx][TZ]
  const m = String(raw).match(/^(\d{4})(\d{2})(\d{2})/)
  if (!m) return ''
  return `${m[1]}-${m[2]}-${m[3]}`
}

// Le pares <TAG>valor (OFX SGML nem sempre fecha as tags)
function getTag (block, tag) {
  const re = new RegExp(`<${tag}>([^<\\r\\n]*)`, 'i')
  const m = block.match(re)
  return m ? m[1].trim() : ''
}

export function parseOFX (content) {
  const transactions = []

  // Detecta se e' fatura de cartao (CCSTMT) ou extrato (STMT)
  const isCreditCard = /CCSTMTRS|CCACCTFROM/i.test(content)
  const origem = isCreditCard ? 'Fatura de cartão (OFX)' : 'Extrato bancário (OFX)'

  // Captura cada bloco <STMTTRN>...</STMTTRN>
  const blocks = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ||
    // fallback para OFX sem tag de fechamento
    content.split(/<STMTTRN>/i).slice(1).map((b) => '<STMTTRN>' + b)

  for (const block of blocks) {
    const valorRaw = getTag(block, 'TRNAMT')
    if (valorRaw === '') continue
    const valor = parseFloat(valorRaw.replace(',', '.'))
    if (Number.isNaN(valor)) continue

    const dataISO = ofxDateToISO(getTag(block, 'DTPOSTED'))
    const memo = getTag(block, 'MEMO') || getTag(block, 'NAME') || 'Transação'
    const trnType = getTag(block, 'TRNTYPE')
    const fitid = getTag(block, 'FITID')

    // Em faturas de cartao, despesas costumam vir negativas; normalizamos:
    // valor < 0 => despesa (saida) ; valor > 0 => receita/credito (entrada)
    const tipo = valor < 0 ? 'despesa' : 'receita'

    transactions.push({
      data: dataISO || toISODate(new Date()),
      descricao: memo,
      valor: Math.abs(valor),
      tipo,
      origem,
      externalId: fitid,
      meta: { trnType }
    })
  }

  return {
    origem,
    isCreditCard,
    count: transactions.length,
    transactions
  }
}
