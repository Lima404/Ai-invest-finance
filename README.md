# AI Invest — Gestão Financeira

Módulo de gestão financeira construído em **Vue 3 + Reka UI (Radix Vue) + Tailwind CSS v4**, seguindo a identidade visual **AI Invest** (preto / branco / verde-limão neon, dark mode).

Controla **receitas (entradas)** e **despesas (saídas)** com:

- Cadastro **manual** de entradas e saídas.
- **Importação de arquivos bancários**: extratos e faturas de cartão de crédito.
- **Importação de contracheques** (holerite) para lançar o salário automaticamente.
- Dashboard com KPIs, evolução mensal e gasto por categoria.
- **Metas de orçamento mensais por categoria** com barras de progresso e alertas (80% / estouro).
- Classificação automática por categoria (palavras-chave).
- Detecção de duplicatas na importação.
- Persistência **local no navegador** (LocalStorage) — não precisa de servidor.

## Formatos de importação suportados

| Tipo                | Formatos        | Observação |
|---------------------|-----------------|------------|
| Extrato bancário    | OFX, CSV, PDF   | OFX é o mais confiável |
| Fatura de cartão    | OFX, CSV, PDF   | Detecta crédito/débito |
| Contracheque        | PDF             | Lê proventos, descontos e líquido |

> CSV: o sistema tenta detectar as colunas (data / descrição / valor) automaticamente.
> Se o layout for incomum, use o painel **Mapeamento de colunas** para apontar manualmente.
> PDF: a extração é por heurística e os valores **sempre passam por uma tela de revisão** antes de salvar.

## Como rodar

```bash
npm install      # instala dependências
npm run dev      # ambiente Vite (http://localhost:9000)
npm run build    # build de produção (pasta dist/)
npm run preview  # serve o build de produção
```

> Requer Node 18+ (testado em Node 24). Projeto Vite puro — sem CLI global.

## Stack

- **Vue 3** (`<script setup>`) + **Vite**
- **Reka UI** (Radix Vue) — primitivos acessíveis e headless (Dialog, Select, Switch, Progress, ToggleGroup, AlertDialog)
- **Tailwind CSS v4** — estilização e tokens de tema
- **Pinia** — estado + persistência em `localStorage`
- **shadcn-vue + unovis** (`@unovis/vue`) — gráficos (barras e donut) do dashboard
- **@iconify/vue** (Material Symbols) — ícones
- **pdfjs-dist** / **papaparse** — parsing de PDF e CSV

## Estrutura

```
src/
├── main.js                    # createApp + Pinia + Router
├── assets/styles/main.css     # Tailwind v4 + tokens/tema AI Invest
├── composables/               # useToast, useConfirm, useLoading
├── components/
│   ├── ui/                    # primitivos Reka UI estilizados
│   │   ├── Modal.vue          # Dialog
│   │   ├── Select.vue         # Select
│   │   ├── Switch.vue         # Switch
│   │   ├── ProgressBar.vue    # Progress
│   │   ├── SegmentedControl.vue  # ToggleGroup
│   │   ├── ConfirmDialog.vue  # AlertDialog (host global)
│   │   ├── ToastContainer.vue # toasts (host global)
│   │   ├── LoadingOverlay.vue # overlay de loading
│   │   ├── AppIcon.vue        # ícones (Iconify / Material Symbols)
│   │   ├── chart-bar/BarChart.vue    # gráfico de barras (shadcn-vue + unovis)
│   │   └── chart-donut/DonutChart.vue # rosca (shadcn-vue + unovis)
│   ├── BrandLogo.vue          # logo "AI Invest" em SVG
│   ├── KpiCard.vue            # cartão de indicador
│   ├── TransactionsTable.vue  # tabela de lançamentos (busca/sort/paginação)
│   └── TransactionDialog.vue  # criar/editar lançamento manual
├── layouts/MainLayout.vue     # sidebar + header + filtro de período
├── pages/
│   ├── DashboardPage.vue
│   ├── ReceitasPage.vue
│   ├── DespesasPage.vue
│   ├── OrcamentoPage.vue      # metas de orçamento por categoria
│   ├── ImportacaoPage.vue     # upload + parsing + revisão
│   └── CategoriasPage.vue
├── stores/finance.js          # estado + getters + persistência local
└── utils/
    ├── format.js              # formatação BRL/datas + parse de valores
    ├── categories.js          # categorias padrão + auto-classificação
    └── parsers/
        ├── index.js           # dispatcher por tipo de arquivo
        ├── ofx.js             # parser OFX (extrato/cartão)
        ├── csv.js             # parser CSV + remapeamento de colunas
        └── pdf.js             # parser PDF (extrato/fatura/contracheque)
```

## Identidade visual

- **Destaque:** verde-limão neon `#C6F806`
- **Base:** preto `#000000`, superfícies `#0A0A0A`
- **Apoio:** branco `#FFFFFF`, taupe `#B7ACA3`, areia `#DAB078`
- **Tipografia:** *Saira* (display, aprox. da Barques Heavy) + *Inter* (corpo, aprox. da SF Pro)

Os tokens ficam em [src/assets/styles/main.css](src/assets/styles/main.css) (bloco `@theme` do Tailwind v4),
gerando utilitários como `bg-lime`, `text-taupe`, `border-line`, `font-display`.

## Dados de exemplo

No menu lateral, o botão **"Carregar dados de exemplo"** popula 3 meses de
receitas e despesas fictícias para você visualizar o dashboard rapidamente.
