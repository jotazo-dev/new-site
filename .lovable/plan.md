## Problema identificado

As páginas do painel **foram criadas**, mas as rotas em `src/App.tsx` estão trocadas/erradas:

- Linha 187 (`/conta/faturas` — dentro do **site**, `ContaLayout`) → renderiza `PainelFaturas` (errado, mostra painel dentro do site).
- Linha 193 (`/conta/painel/faturas` — dentro do **painel**) → renderiza `ContaFaturas` (a versão antiga do site, sem layout de painel).
- Linhas 194–196 (`/conta/painel/pedidos`, `/pedidos/:id`, `/perfil`) → reutilizam `ContaPedidos`, `ContaPedidoDetalhe`, `ContaPerfil`, violando a regra de isolamento `mem://features/painel/isolamento-do-site`.

Por isso, quando você abre `/conta/painel/faturas`, vê a página antiga em vez do `PainelFaturas` novo.

## Correções

### 1. Corrigir o swap em `src/App.tsx`
- `/conta/faturas` (site) → voltar para `ContaFaturas`.
- `/conta/painel/faturas` (painel) → usar `PainelFaturas`.

### 2. Criar páginas isoladas do painel (sem `SiteLayout`/`ContaLayout`)
Criar em `src/pages/conta/painel/`:
- `PainelPedidos.tsx` — lista de pedidos no estilo dashboard (KPIs + tabela, similar ao `PainelFaturas`), reaproveitando o hook usado por `ContaPedidos`.
- `PainelPedidoDetalhe.tsx` — detalhe do pedido dentro do painel, com "Voltar" para `/conta/painel/pedidos` (nunca para `/conta`).
- `PainelPerfil.tsx` — perfil/dados da conta no padrão do painel (cards, mesma tipografia do `PainelHome`).

Cada uma terá `<Helmet>` com `noindex,nofollow` e título "… — Painel Jotazo", seguindo o padrão de `PainelFaturas`.

### 3. Atualizar rotas em `src/App.tsx`
Trocar as referências do bloco `/conta/painel`:
- `faturas` → `PainelFaturas`
- `pedidos` → `PainelPedidos`
- `pedidos/:id` → `PainelPedidoDetalhe`
- `perfil` → `PainelPerfil`

### 4. Validar
- Abrir `/conta/painel/faturas` → deve carregar dentro de `PainelLayout` (sidebar + topbar, sem header/footer do site).
- Abrir `/conta/faturas` → continua funcionando na versão antiga do site (sem regressão para quem usa o menu antigo).

## Observação
Não vou alterar o conteúdo visual do `PainelFaturas` que já existe — o problema é puramente de roteamento + 3 páginas faltando. Após o fix, o painel fica 100% isolado conforme a regra salva.