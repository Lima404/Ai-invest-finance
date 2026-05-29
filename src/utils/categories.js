// Categorias padrao e auto-classificacao por palavras-chave

export const DEFAULT_CATEGORIES = {
  receita: [
    { nome: 'Salário', icon: 'payments', color: '#C6F806' },
    { nome: 'Pró-labore', icon: 'badge', color: '#A3E635' },
    { nome: 'Freelance', icon: 'work', color: '#84CC16' },
    { nome: 'Investimentos', icon: 'trending_up', color: '#22C55E' },
    { nome: 'Aluguel recebido', icon: 'home', color: '#10B981' },
    { nome: 'Reembolso', icon: 'undo', color: '#14B8A6' },
    { nome: 'Outras receitas', icon: 'add_circle', color: '#B7ACA3' }
  ],
  despesa: [
    { nome: 'Alimentação', icon: 'restaurant', color: '#FB923C' },
    { nome: 'Mercado', icon: 'shopping_cart', color: '#F59E0B' },
    { nome: 'Transporte', icon: 'directions_car', color: '#38BDF8' },
    { nome: 'Moradia', icon: 'house', color: '#A78BFA' },
    { nome: 'Saúde', icon: 'favorite', color: '#F472B6' },
    { nome: 'Educação', icon: 'school', color: '#60A5FA' },
    { nome: 'Lazer', icon: 'sports_esports', color: '#C084FC' },
    { nome: 'Assinaturas', icon: 'subscriptions', color: '#E879F9' },
    { nome: 'Cartão de crédito', icon: 'credit_card', color: '#FBBF24' },
    { nome: 'Impostos', icon: 'account_balance', color: '#94A3B8' },
    { nome: 'Outras despesas', icon: 'remove_circle', color: '#B7ACA3' }
  ]
}

// Mapa de palavras-chave -> categoria (para auto classificar importacoes)
const KEYWORDS = [
  { cat: 'Mercado', words: ['mercado', 'supermerc', 'atacad', 'carrefour', 'pao de acucar', 'assai', 'big', 'extra'] },
  { cat: 'Alimentação', words: ['ifood', 'restaurante', 'lanchonete', 'burger', 'pizza', 'food', 'bar ', 'cafe', 'padaria'] },
  { cat: 'Transporte', words: ['uber', '99 ', '99app', 'posto', 'combustivel', 'gasolina', 'shell', 'ipiranga', 'estacion', 'metro', 'onibus'] },
  { cat: 'Moradia', words: ['aluguel', 'condominio', 'energia', 'enel', 'cemig', 'light', 'sabesp', 'agua', 'gas '] },
  { cat: 'Saúde', words: ['farmacia', 'drogaria', 'droga', 'hospital', 'clinica', 'unimed', 'amil', 'medic', 'laborat'] },
  { cat: 'Educação', words: ['escola', 'faculdade', 'curso', 'udemy', 'alura', 'universidade', 'livro'] },
  { cat: 'Assinaturas', words: ['netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'youtube', 'apple.com', 'google', 'icloud'] },
  { cat: 'Lazer', words: ['cinema', 'show', 'ingresso', 'steam', 'playstation', 'xbox', 'viagem', 'hotel', 'airbnb'] },
  { cat: 'Cartão de crédito', words: ['pagamento fatura', 'fatura cartao', 'pag fatura'] },
  { cat: 'Impostos', words: ['darf', 'iptu', 'ipva', 'imposto', 'tributo', 'das ', 'inss'] },
  { cat: 'Salário', words: ['salario', 'remuneracao', 'pagamento de salario', 'vencimentos', 'liquido a receber', 'credito de salario'] },
  { cat: 'Pró-labore', words: ['pro labore', 'pro-labore', 'prolabore'] },
  { cat: 'Investimentos', words: ['rendimento', 'dividendo', 'jcp', 'tesouro', 'cdb', 'resgate'] }
]

export function autoCategoria (descricao, tipo = 'despesa') {
  const text = (descricao || '').toLowerCase()
  for (const { cat, words } of KEYWORDS) {
    if (words.some((w) => text.includes(w))) {
      // garante coerencia com o tipo
      const isReceitaCat = DEFAULT_CATEGORIES.receita.some((c) => c.nome === cat)
      if (tipo === 'receita' && isReceitaCat) return cat
      if (tipo === 'despesa' && !isReceitaCat) return cat
    }
  }
  return tipo === 'receita' ? 'Outras receitas' : 'Outras despesas'
}

export function categoryColor (nome) {
  const all = [...DEFAULT_CATEGORIES.receita, ...DEFAULT_CATEGORIES.despesa]
  return (all.find((c) => c.nome === nome) || {}).color || '#B7ACA3'
}

export function categoryIcon (nome) {
  const all = [...DEFAULT_CATEGORIES.receita, ...DEFAULT_CATEGORIES.despesa]
  return (all.find((c) => c.nome === nome) || {}).icon || 'label'
}
