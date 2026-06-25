---
name: rbx-skill
description: API completa do RouterBox/RBX Soft ISP (v1 + v2). Use sempre que o usuário pedir features tocando RBX, RouterBox, atendimentos, OS (ordem de serviço), agendamento de técnico, clientes/contratos, autenticações PPPoE, faturas, 2ª via de boleto, linha digitável, PIX copia-cola, QR code PIX, NAS, QoS, planos, FailOver, fornecedores, estoque, mercados, dados de cobrança ou qualquer integração com o sistema do provedor (Jotazo Telecom). Cobre 134 endpoints reais (47 v1 + 87 v2) com payloads, campos de retorno e exemplos.
---

# RBX Soft — API completa (v1 + v2)

Documentação oficial: <https://www.developers.rbxsoft.com/>

Este projeto (Jotazo) **já usa** as duas versões via `supabase/functions/_shared/rbx.ts`
(`rbxFetchV1`, `rbxFetchV2`, `loadRbxConfig`, `fetchInvoicePayables`). Credenciais ficam em `rbx_config`
(`base_url`, `auth_key_v1`, `auth_key_v2`). Esta skill é a **fonte da verdade da API** — não substitui o shared.

## Quando usar esta skill

Disparar quando o usuário pedir qualquer coisa que toque o ERP do provedor:
- Atendimentos / OS / agendamentos / encerramento / pesquisa de satisfação
- Cadastro/alteração de clientes, contratos, contatos, dados adicionais
- Documentos financeiros (em aberto, baixados, NF, boleto, PIX)
- Autenticações de clientes (login, senha, NAS, IP, MAC)
- Equipamentos, estoque, planos, QoS, FailOver, fornecedores

## v1 vs v2 (elas se complementam, v2 NÃO substitui v1)

| | v1 | v2 |
|---|---|---|
| URL | `{base_url}/routerbox/ws/rbx_server_json.php` | `{base_url}/routerbox/ws_json/ws_json.php` |
| Auth | body `Autenticacao.ChaveIntegracao` | header `authentication_key` + body `authentication_key` |
| Foco | consultas amplas (com `Filtro` MySQL WHERE-like) + cadastros básicos | operações transacionais (alterar, encerrar, designar, agendar, gerar PIX/boleto/NF) |
| Total | 47 endpoints (7 grupos) | 87 endpoints (7 grupos) |

Ambiente (HML vs Produção) é determinado pela **chave**, não pela URL. Sempre **POST**, sempre **UTF-8**.

## Padrão de resposta

```json
{ "status": 1, "erro_code": "", "erro_inf": "", "erro_desc": "", "erro_detail": "", "result": ... }
```

`status: 1` = ok; `status: 0` = erro (ver `erro_code` + `erro_desc`). Veja `references/21-error-codes.md`.

## Como chamar (Edge Function Deno)

Use os helpers já existentes do projeto:

```ts
import { loadRbxConfig, rbxFetchV1, rbxFetchV2 } from "../_shared/rbx.ts";

const cfg = await loadRbxConfig();
if (!cfg) throw new Error("RBX não configurado");

// v1 — consulta com Filtro
const docs = await rbxFetchV1(cfg.endpoint, cfg.authKey,
  "ConsultaDocumentosEmAberto",
  "DocumentosEmAberto.Cliente = '10'");

// v2 — gerar boleto
const billet = await rbxFetchV2(cfg.endpointV2, cfg.authKeyV2!,
  "get_banking_billet", { document_id: 12345 });
```

Para casos fora do shared há um helper standalone em `scripts/rbx_call.ts`.

## Índice de referências

### Conceitos
- [Overview, ambientes e autenticação](references/00-overview-and-environments.md)
- [Filtros MySQL nos endpoints v1](references/20-filtros-mysql.md)
- [Códigos de erro mais comuns](references/21-error-codes.md)
- [Extractors — como achatar respostas v2 (boleto/PIX)](references/22-extractors.md)

### v1.0
- [Atendimentos (8 endpoints)](references/01-v1-atendimentos.md)
- [Autenticações (2 endpoints)](references/02-v1-autenticacoes.md)
- [Clientes (15 endpoints)](references/03-v1-clientes.md)
- [Contratos (4 endpoints)](references/04-v1-contratos.md)
- [Estoque (3 endpoints)](references/05-v1-estoque.md)
- [Financeiro (7 endpoints)](references/06-v1-financeiro.md)
- [Variados — planos, QoS, NAS, FailOver, etc. (8 endpoints)](references/07-v1-variados.md)

### v2.0
- [Atendimentos (14 endpoints)](references/10-v2-atendimentos.md)
- [Autenticações (3 endpoints)](references/11-v2-autenticacoes.md)
- [Clientes (14 endpoints)](references/12-v2-clientes.md)
- [Contratos (19 endpoints)](references/13-v2-contratos.md)
- [Estoque (7 endpoints)](references/14-v2-estoque.md)
- [Financeiro — boleto, PIX, NF (16 endpoints)](references/15-v2-financeiro.md)
- [Variados (14 endpoints)](references/16-v2-variados.md)

### Dump completo
- [`references/endpoints.json`](references/endpoints.json) — 134 endpoints achatados (método, URL, params, retorno, filtros) p/ consumo programático.

## Scripts

- [`scripts/rbx_call.ts`](scripts/rbx_call.ts) — helper Deno standalone (`rbxV1`, `rbxV2`) com timeout, parsing JSON-safe e tipagem.

## Gotchas reais do projeto

1. **`get_banking_billet` + `due_date`** → enviar `due_date` quebra com `erro_code: 7` ("Data de vencimento não permitida") quando o documento já tem a data atualizada. Padrão atual: **não enviar `due_date`**. Ver `supabase/functions/_shared/rbx.ts` → `fetchInvoicePayables`.
2. **`get_pix_qrcode`** → o base64 pode vir com prefixo `data:image/png;base64,...`. Use `extractPixQr` (já implementado) que faz o strip.
3. **`get_barcode`** → passar `return_type: "line"` para receber a linha digitável formatada em vez do código de barras puro.
4. **v1 `Filtro`** → é WHERE MySQL real (use os nomes de tabela documentados, ex.: `Atendimentos.Cliente`, `DocumentosEmAberto.Cliente`). Veja `references/20-filtros-mysql.md`.
5. **v2 auth** → SEMPRE incluir `authentication_key` no header **e** no body (`{ ...payload, authentication_key }`). O shared já faz isso.
