import { defineStore } from 'pinia'
import { monthKey } from '@/utils/format'
import { autoCategoria, DEFAULT_CATEGORIES } from '@/utils/categories'

const STORAGE_KEY = 'ai-invest:transactions'
const BUDGET_KEY = 'ai-invest:budgets'

function uid () {
  return 't_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function readJSON (key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON (key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* armazenamento indisponivel */
  }
}

function load () {
  const raw = readJSON(STORAGE_KEY, [])
  return Array.isArray(raw) ? raw : []
}

function loadBudgets () {
  const raw = readJSON(BUDGET_KEY, {})
  return raw && typeof raw === 'object' ? raw : {}
}

// mes de referencia para orcamento: filtro selecionado ou mes atual
function currentMonth () {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    transactions: load(),
    // metas de orcamento mensais por categoria de despesa: { [categoria]: limiteMensal }
    budgets: loadBudgets(),
    // mes selecionado no dashboard (yyyy-mm) ; '' = todos
    filtroMes: ''
  }),

  getters: {
    receitas: (s) => s.transactions.filter((t) => t.tipo === 'receita'),
    despesas: (s) => s.transactions.filter((t) => t.tipo === 'despesa'),

    // lista de meses presentes nos dados (desc)
    meses: (s) => {
      const set = new Set(s.transactions.map((t) => monthKey(t.data)).filter(Boolean))
      return [...set].sort().reverse()
    },

    // aplica filtro de mes
    filtradas: (s) => {
      if (!s.filtroMes) return s.transactions
      return s.transactions.filter((t) => monthKey(t.data) === s.filtroMes)
    },

    totalReceitas () {
      return this.filtradas.filter((t) => t.tipo === 'receita').reduce((a, t) => a + Number(t.valor || 0), 0)
    },
    totalDespesas () {
      return this.filtradas.filter((t) => t.tipo === 'despesa').reduce((a, t) => a + Number(t.valor || 0), 0)
    },
    saldo () {
      return this.totalReceitas - this.totalDespesas
    },

    // gasto por categoria (despesas do filtro)
    porCategoria () {
      const map = {}
      for (const t of this.filtradas) {
        if (t.tipo !== 'despesa') continue
        map[t.categoria] = (map[t.categoria] || 0) + Number(t.valor || 0)
      }
      return Object.entries(map)
        .map(([categoria, total]) => ({ categoria, total }))
        .sort((a, b) => b.total - a.total)
    },

    // serie mensal (todos os meses) -> { mes, receitas, despesas, saldo }
    serieMensal: (s) => {
      const map = {}
      for (const t of s.transactions) {
        const m = monthKey(t.data)
        if (!m) continue
        if (!map[m]) map[m] = { mes: m, receitas: 0, despesas: 0 }
        if (t.tipo === 'receita') map[m].receitas += Number(t.valor || 0)
        else map[m].despesas += Number(t.valor || 0)
      }
      return Object.values(map)
        .map((r) => ({ ...r, saldo: r.receitas - r.despesas }))
        .sort((a, b) => a.mes.localeCompare(b.mes))
    },

    categoriasReceita: () => DEFAULT_CATEGORIES.receita,
    categoriasDespesa: () => DEFAULT_CATEGORIES.despesa,

    // mes usado como referencia para as metas (filtro ou mes atual)
    mesOrcamento: (s) => s.filtroMes || currentMonth(),

    // gasto por categoria no mes de referencia das metas
    gastoMesOrcamento () {
      const mes = this.mesOrcamento
      const map = {}
      for (const t of this.transactions) {
        if (t.tipo !== 'despesa') continue
        if (monthKey(t.data) !== mes) continue
        map[t.categoria] = (map[t.categoria] || 0) + Number(t.valor || 0)
      }
      return map
    },

    // status de cada meta definida -> { categoria, limite, gasto, restante, pct, status }
    statusOrcamento () {
      const gasto = this.gastoMesOrcamento
      return Object.entries(this.budgets)
        .filter(([, limite]) => Number(limite) > 0)
        .map(([categoria, limite]) => {
          const g = gasto[categoria] || 0
          const lim = Number(limite)
          const pct = lim > 0 ? (g / lim) * 100 : 0
          let status = 'ok'
          if (pct >= 100) status = 'estourou'
          else if (pct >= 80) status = 'alerta'
          return {
            categoria,
            limite: lim,
            gasto: g,
            restante: lim - g,
            pct,
            status
          }
        })
        .sort((a, b) => b.pct - a.pct)
    },

    // totais agregados das metas
    resumoOrcamento () {
      const itens = this.statusOrcamento
      const limiteTotal = itens.reduce((a, i) => a + i.limite, 0)
      const gastoTotal = itens.reduce((a, i) => a + i.gasto, 0)
      return {
        limiteTotal,
        gastoTotal,
        restante: limiteTotal - gastoTotal,
        pct: limiteTotal > 0 ? (gastoTotal / limiteTotal) * 100 : 0,
        estouradas: itens.filter((i) => i.status === 'estourou').length,
        emAlerta: itens.filter((i) => i.status === 'alerta').length,
        totalMetas: itens.length
      }
    }
  },

  actions: {
    persist () {
      writeJSON(STORAGE_KEY, this.transactions)
    },

    persistBudgets () {
      writeJSON(BUDGET_KEY, this.budgets)
    },

    // define (ou atualiza) a meta mensal de uma categoria; valor 0/null remove
    setBudget (categoria, limite) {
      const v = Number(limite)
      if (!categoria) return
      if (!v || v <= 0) {
        delete this.budgets[categoria]
      } else {
        this.budgets[categoria] = v
      }
      this.persistBudgets()
    },

    removeBudget (categoria) {
      delete this.budgets[categoria]
      this.persistBudgets()
    },

    clearBudgets () {
      this.budgets = {}
      this.persistBudgets()
    },

    add (tx) {
      const t = {
        id: uid(),
        data: tx.data,
        descricao: tx.descricao || 'Transação',
        valor: Math.abs(Number(tx.valor || 0)),
        tipo: tx.tipo === 'receita' ? 'receita' : 'despesa',
        categoria: tx.categoria || autoCategoria(tx.descricao, tx.tipo),
        origem: tx.origem || 'Manual',
        externalId: tx.externalId || '',
        observacao: tx.observacao || '',
        criadoEm: new Date().toISOString()
      }
      this.transactions.push(t)
      this.persist()
      return t
    },

    addMany (list) {
      const novos = []
      for (const tx of list) {
        novos.push(this.add(tx))
      }
      return novos
    },

    update (id, patch) {
      const i = this.transactions.findIndex((t) => t.id === id)
      if (i === -1) return
      const cur = this.transactions[i]
      this.transactions[i] = {
        ...cur,
        ...patch,
        valor: patch.valor !== undefined ? Math.abs(Number(patch.valor)) : cur.valor
      }
      this.persist()
    },

    remove (id) {
      this.transactions = this.transactions.filter((t) => t.id !== id)
      this.persist()
    },

    clearAll () {
      this.transactions = []
      this.persist()
    },

    // Detecta possiveis duplicatas (mesmo externalId, ou mesma data+valor+desc)
    isDuplicate (tx) {
      return this.transactions.some((t) => {
        if (tx.externalId && t.externalId && t.externalId === tx.externalId) return true
        return t.data === tx.data &&
          Number(t.valor) === Math.abs(Number(tx.valor)) &&
          t.tipo === tx.tipo &&
          (t.descricao || '').slice(0, 24) === (tx.descricao || '').slice(0, 24)
      })
    },

    seedDemo () {
      if (this.transactions.length) return
      const hoje = new Date()
      const ym = (offset) => {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - offset, 1)
        return d
      }
      const iso = (d, day) => {
        const dd = new Date(d.getFullYear(), d.getMonth(), day)
        const pad = (n) => String(n).padStart(2, '0')
        return `${dd.getFullYear()}-${pad(dd.getMonth() + 1)}-${pad(dd.getDate())}`
      }
      const demo = []
      for (let m = 2; m >= 0; m--) {
        const base = ym(m)
        demo.push({ data: iso(base, 5), descricao: 'Salário mensal', valor: 8500, tipo: 'receita', categoria: 'Salário', origem: 'Contracheque (PDF)' })
        demo.push({ data: iso(base, 12), descricao: 'Freelance projeto web', valor: 2200, tipo: 'receita', categoria: 'Freelance', origem: 'Manual' })
        demo.push({ data: iso(base, 6), descricao: 'Aluguel apartamento', valor: 2300, tipo: 'despesa', categoria: 'Moradia', origem: 'Manual' })
        demo.push({ data: iso(base, 8), descricao: 'Supermercado Pão de Açúcar', valor: 980, tipo: 'despesa', categoria: 'Mercado', origem: 'Extrato bancário (OFX)' })
        demo.push({ data: iso(base, 10), descricao: 'iFood', valor: 340, tipo: 'despesa', categoria: 'Alimentação', origem: 'Fatura de cartão (OFX)' })
        demo.push({ data: iso(base, 15), descricao: 'Uber', valor: 210, tipo: 'despesa', categoria: 'Transporte', origem: 'Fatura de cartão (OFX)' })
        demo.push({ data: iso(base, 18), descricao: 'Netflix + Spotify', valor: 89, tipo: 'despesa', categoria: 'Assinaturas', origem: 'Fatura de cartão (OFX)' })
        demo.push({ data: iso(base, 20), descricao: 'Farmácia', valor: 150, tipo: 'despesa', categoria: 'Saúde', origem: 'Manual' })
      }
      this.addMany(demo)

      // metas de exemplo (algumas propositalmente apertadas p/ demonstrar alertas)
      if (!Object.keys(this.budgets).length) {
        this.budgets = {
          Moradia: 2500,
          Mercado: 900,
          Alimentação: 300,
          Transporte: 250,
          Assinaturas: 100,
          Saúde: 200
        }
        this.persistBudgets()
      }
    }
  }
})
