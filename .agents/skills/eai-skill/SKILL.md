---
name: eai-skill
description: Documentação completa da API EAÍ (MVNO Zion ERP) — autenticação OAuth2, ambientes HML/Prod, e referência total dos 42 endpoints (customers, carts de ativação/recarga, linhas e consumo, planos, portabilidade, SIM/MSISDN, webhooks NFCom). Use sempre que o usuário pedir uma feature envolvendo MVNO, EAÍ, ativação de chip/eSIM, portabilidade, linha móvel, recarga, consumo, plano móvel, NFCom Cobilling, ou integração Zion ERP.
---

# EAÍ Skill — API MVNO Zion ERP

Esta skill cobre **100% dos 42 endpoints** públicos da EAÍ ERP (`zion-erp v1`), agrupados por domínio.

## Ambientes

| Ambiente | Base URL | OAuth URL |
|---|---|---|
| Produção | `https://api.eai.net.br` | `https://api.eai.net.br/oauth2/token` |
| Homologação | `https://hml-mvno.eai.net.br` | `https://hml-mvno.eai.net.br/oauth2/token` |

BasePath REST: **`/api/`** — todo path desta skill já vem com `/api/...` na frente. Ex.: `GET /api/rest/service_eai/companies`.

## Autenticação

OAuth2 `client_credentials` + cabeçalho da empresa em cada chamada. Detalhes completos em [`references/00-auth-and-environments.md`](references/00-auth-and-environments.md).

```http
POST /oauth2/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```

Use o `access_token` como `Authorization: Bearer ...` e envie sempre `X-Company-Token: <company_token>` (ou `X-Person-Token`, dependendo do escopo da credencial).

## Índice

| Arquivo | Conteúdo |
|---|---|
| [00-auth-and-environments.md](references/00-auth-and-environments.md) | OAuth, headers obrigatórios, ambientes, paginação, filtros |
| [01-customers.md](references/01-customers.md) | Companies + Customers (CRUD, check_already_exists) |
| [02-mvno-carts.md](references/02-mvno-carts.md) | Carrinhos de ativação / recarga / SpecificMsisdn + bind NFCom |
| [03-mvno-lines.md](references/03-mvno-lines.md) | Linhas, consumo, detalhado, pós-pago, recorrência, troca de SIM |
| [04-catalog-plans-products.md](references/04-catalog-plans-products.md) | Produtos e planos: list, valid, possible_activation / possible_line, CRUD reseller |
| [05-portability.md](references/05-portability.md) | Portabilidade: criar, listar, status por linha, histórico |
| [06-sim-msisdn.md](references/06-sim-msisdn.md) | SIM cards e reserva de MSISDNs |
| [07-webhooks-nfcom.md](references/07-webhooks-nfcom.md) | Webhooks NFCom Cobilling (padrão + Voalle) |
| [08-shared-geo.md](references/08-shared-geo.md) | Cidades, estados, países (sem auth EAÍ específica) |
| [09-enums.md](references/09-enums.md) | Todos os enums (status linha/cart/portabilidade, finalidades, tipos, etc.) |
| [10-error-handling.md](references/10-error-handling.md) | `googlerpc.Status`, retries, idempotência |
| [endpoints.json](references/endpoints.json) | Dump bruto dos 42 endpoints com parâmetros e schemas (consumo programático) |

## Helper para Edge Functions

`scripts/eai_call.ts` é um cliente Deno standalone com cache de token e retry. Copie para `/tmp/eai_call.ts` (`code--copy`) ou use de modelo dentro de uma `supabase/function/<nome>/index.ts`.

Variáveis de ambiente esperadas:

- `EAI_BASE_URL` (default `https://api.eai.net.br`)
- `EAI_OAUTH_URL` (default `https://api.eai.net.br/oauth2/token`)
- `EAI_CLIENT_ID`, `EAI_CLIENT_SECRET` (obrigatórios)
- `EAI_COMPANY_TOKEN` (obrigatório; envia como `X-Company-Token`)

```ts
import { eaiFetch } from "./eai_call.ts";

const plans = await eaiFetch("/api/rest/service_eai/mvno_plans");
if (!plans.ok) throw new Error(`EAI ${plans.status}`);
console.log(plans.json);
```

## Contexto deste projeto (Jotazo)

- Já existe `supabase/functions/eai-proxy` que faz proxy genérico autenticado para a EAÍ e loga em `eai_logs`. **Use ele** para chamadas a partir do `/admin/mvno`. Configuração fica em `eai_config` (tabela).
- Cliente do frontend admin: `src/components/admin/esim/eai/eaiClient.ts` (função `eaiCall(path, opts)`).
- Esta skill é a **fonte da verdade da API**. Quando precisar adicionar uma feature MVNO nova, comece consultando o arquivo de referência correspondente ao domínio e o `09-enums.md`.

## Convenções importantes

- **MSISDN** sempre em formato E.164 brasileiro de 13 dígitos: `55DD9XXXXXXXX`.
- **CPF/CNPJ** apenas dígitos (sem máscara).
- **Datas** em ISO 8601 UTC (`2026-06-03T15:30:00Z`).
- **Valores monetários** em centavos (inteiro) na maioria dos schemas.
- **Paginação** usa `commonPaginatedResponseMetadata` (`page`, `pageSize`, `total`).
- **Filtros** usam `commonFilterData` / `commonGroupedFilterData` (`field`, `operator`, `value`) no query param `filter` (JSON serializado).
