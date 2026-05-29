import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { monthKey } from '@/utils/format'
import { autoCategoria, DEFAULT_CATEGORIES } from '@/utils/categories'
import { useToast } from '@/composables/useToast'

// mes de referencia para orcamento: filtro selecionado ou mes atual
function currentMonth () {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// tabela do Supabase conforme o tipo
const tabela = (tipo) => (tipo === 'receita' ? 'receitas' : 'despesas')

// row do banco -> objeto usado no app
function rowToTx (row, tipo) {
  return {
    id: row.id,
    data: row.data,
    descricao: row.descricao,
    valor: Number(row.valor),
    tipo,
    categoria: row.categoria,
    origem: row.origem,
    externalId: row.external_id || '',
    observacao: row.observacao || '',
    criadoEm: row.created_at
  }
}

// objeto do app -> colunas do banco (sem id; user_id vem do auth)
function txToRow (tx, uid) {
  return {
    user_id: uid,
    data: tx.data,
    descricao: tx.descricao || 'Transação',
    valor: Math.abs(Number(tx.valor || 0)),
    categoria: tx.categoria || autoCategoria(tx.descricao, tx.tipo),
    origem: tx.origem || 'Manual',
    observacao: tx.observacao || null,
    external_id: tx.externalId || null
  }
}

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    transactions: [],
    // metas de orcamento mensais por categoria de despesa: { [categoria]: limiteMensal }
    budgets: {},
    // mes selecionado no dashboard (yyyy-mm) ; '' = todos
    filtroMes: '',
    loading: false,
    loaded: false
  }),

  getters: {
    receitas: (s) => s.transactions.filter((t) => t.tipo === 'receita'),
    despesas: (s) => s.transactions.filter((t) => t.tipo === 'despesa'),

    meses: (s) => {
      const set = new Set(s.transactions.map((t) => monthKey(t.data)).filter(Boolean))
      return [...set].sort().reverse()
    },

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

    mesOrcamento: (s) => s.filtroMes || currentMonth(),

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
          return { categoria, limite: lim, gasto: g, restante: lim - g, pct, status }
        })
        .sort((a, b) => b.pct - a.pct)
    },

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
    _uid () {
      return useAuthStore().user?.id || null
    },

    _erro (e, contexto) {
      const toast = useToast()
      const msg = e?.message || String(e)
      console.error('[finance]', contexto, e)
      if (/Could not find the table|schema cache|does not exist/i.test(msg)) {
        toast.error('Tabelas não encontradas no Supabase. Rode a migration (supabase/migrations).')
      } else if (/JWT|auth|permission|row-level security|RLS/i.test(msg)) {
        toast.error('Sem permissão para salvar. Faça login novamente.')
      } else {
        toast.error('Erro ao salvar no Supabase: ' + msg)
      }
    },

    // Carrega receitas, despesas e orcamentos do usuario logado.
    async loadAll () {
      if (!this._uid()) return
      this.loading = true
      try {
        const [r, d, o] = await Promise.all([
          supabase.from('receitas').select('*').order('data', { ascending: false }),
          supabase.from('despesas').select('*').order('data', { ascending: false }),
          supabase.from('orcamentos').select('*')
        ])
        if (r.error) throw r.error
        if (d.error) throw d.error
        if (o.error) throw o.error

        this.transactions = [
          ...(r.data || []).map((row) => rowToTx(row, 'receita')),
          ...(d.data || []).map((row) => rowToTx(row, 'despesa'))
        ]
        const b = {}
        for (const row of o.data || []) b[row.categoria] = Number(row.limite_mensal)
        this.budgets = b
        this.loaded = true
      } catch (e) {
        this._erro(e, 'loadAll')
      } finally {
        this.loading = false
      }
    },

    // limpa o estado local (usado no logout)
    reset () {
      this.transactions = []
      this.budgets = {}
      this.loaded = false
      this.filtroMes = ''
    },

    async add (tx) {
      const uid = this._uid()
      if (!uid) return null
      const tipo = tx.tipo === 'receita' ? 'receita' : 'despesa'
      try {
        const { data, error } = await supabase
          .from(tabela(tipo))
          .insert(txToRow({ ...tx, tipo }, uid))
          .select()
          .single()
        if (error) throw error
        const novo = rowToTx(data, tipo)
        this.transactions.push(novo)
        return novo
      } catch (e) {
        this._erro(e, 'add')
        return null
      }
    },

    async addMany (list) {
      const uid = this._uid()
      if (!uid) return []
      const grupos = { receita: [], despesa: [] }
      for (const tx of list) {
        const tipo = tx.tipo === 'receita' ? 'receita' : 'despesa'
        grupos[tipo].push(txToRow({ ...tx, tipo }, uid))
      }
      const inseridos = []
      try {
        for (const tipo of ['receita', 'despesa']) {
          if (!grupos[tipo].length) continue
          const { data, error } = await supabase.from(tabela(tipo)).insert(grupos[tipo]).select()
          if (error) throw error
          for (const row of data) {
            const novo = rowToTx(row, tipo)
            this.transactions.push(novo)
            inseridos.push(novo)
          }
        }
      } catch (e) {
        this._erro(e, 'addMany')
      }
      return inseridos
    },

    async update (id, patch) {
      const i = this.transactions.findIndex((t) => t.id === id)
      if (i === -1) return
      const cur = this.transactions[i]
      const uid = this._uid()
      if (!uid) return

      const novoTipo = patch.tipo || cur.tipo

      try {
        // mudou de tipo => move entre tabelas (delete + insert, novo id)
        if (novoTipo !== cur.tipo) {
          const { error: delErr } = await supabase.from(tabela(cur.tipo)).delete().eq('id', id)
          if (delErr) throw delErr
          const merged = { ...cur, ...patch, tipo: novoTipo }
          const { data, error } = await supabase
            .from(tabela(novoTipo))
            .insert(txToRow(merged, uid))
            .select()
            .single()
          if (error) throw error
          this.transactions[i] = rowToTx(data, novoTipo)
          return true
        }

        const merged = { ...cur, ...patch }
        const { data, error } = await supabase
          .from(tabela(cur.tipo))
          .update({
            data: merged.data,
            descricao: merged.descricao,
            valor: Math.abs(Number(merged.valor || 0)),
            categoria: merged.categoria,
            origem: merged.origem,
            observacao: merged.observacao || null,
            external_id: merged.externalId || null
          })
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        this.transactions[i] = rowToTx(data, cur.tipo)
        return true
      } catch (e) {
        this._erro(e, 'update')
        return false
      }
    },

    async remove (id) {
      const cur = this.transactions.find((t) => t.id === id)
      if (!cur) return false
      try {
        const { error } = await supabase.from(tabela(cur.tipo)).delete().eq('id', id)
        if (error) throw error
        this.transactions = this.transactions.filter((t) => t.id !== id)
        return true
      } catch (e) {
        this._erro(e, 'remove')
        return false
      }
    },

    async clearAll () {
      const uid = this._uid()
      if (!uid) return false
      try {
        const [r, d] = await Promise.all([
          supabase.from('receitas').delete().eq('user_id', uid),
          supabase.from('despesas').delete().eq('user_id', uid)
        ])
        if (r.error) throw r.error
        if (d.error) throw d.error
        this.transactions = []
        return true
      } catch (e) {
        this._erro(e, 'clearAll')
        return false
      }
    },

    // define (ou atualiza) a meta mensal de uma categoria; valor 0/null remove
    async setBudget (categoria, limite) {
      const uid = this._uid()
      if (!uid || !categoria) return
      const v = Number(limite)
      try {
        if (!v || v <= 0) {
          await this.removeBudget(categoria)
          return
        }
        const { error } = await supabase
          .from('orcamentos')
          .upsert({ user_id: uid, categoria, limite_mensal: v }, { onConflict: 'user_id,categoria' })
        if (error) throw error
        this.budgets = { ...this.budgets, [categoria]: v }
        return true
      } catch (e) {
        this._erro(e, 'setBudget')
        return false
      }
    },

    async removeBudget (categoria) {
      const uid = this._uid()
      if (!uid) return
      try {
        const { error } = await supabase
          .from('orcamentos')
          .delete()
          .eq('user_id', uid)
          .eq('categoria', categoria)
        if (error) throw error
        const b = { ...this.budgets }
        delete b[categoria]
        this.budgets = b
        return true
      } catch (e) {
        this._erro(e, 'removeBudget')
        return false
      }
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

    async seedDemo () {
      if (this.transactions.length) return
      const hoje = new Date()
      const ym = (offset) => new Date(hoje.getFullYear(), hoje.getMonth() - offset, 1)
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
      await this.addMany(demo)

      if (!Object.keys(this.budgets).length) {
        const metas = { Moradia: 2500, Mercado: 900, Alimentação: 300, Transporte: 250, Assinaturas: 100, Saúde: 200 }
        await Promise.all(Object.entries(metas).map(([cat, v]) => this.setBudget(cat, v)))
      }
    }
  }
})
