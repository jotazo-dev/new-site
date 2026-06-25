---
name: cpf-skill
description: Integração com a API CPF.CNPJ (cpfcnpj.com.br) para consulta de CPF nos pacotes CPF A (id=1, apenas nome) e CPF B (id=7, nome + data de nascimento). Use quando precisar enriquecer cadastros com nome/data de nascimento a partir do CPF, validar pré-cadastro, ou implementar busca automática de CPF em formulários do projeto.
---

# CPF.CNPJ — Consulta CPF (Pacotes A e B)

API REST HTTPS da CPF.CNPJ (`https://api.cpfcnpj.com.br`) para retornar dados oficiais do CPF a partir da Receita Federal, sem captcha e sem data de nascimento. Resposta em JSON, tempo médio < 2s.

## Quando usar cada pacote

| ID | Pacote | Retorna | Custo (BRL) |
|----|--------|---------|-------------|
| `1` | **CPF A** | `nome` completo | R$ 0,17 |
| `7` | **CPF B** | `nome` completo + `nascimento` (DD/MM/AAAA) | R$ 0,25 |

Regra prática:
- Precisa **só do nome** (ex.: confirmar titularidade) → **Pacote 1 (CPF A)**.
- Precisa **nome + data de nascimento** (ex.: ativação de linha MVNO, KYC básico, responsável de CNPJ) → **Pacote 7 (CPF B)**.
- Para dados adicionais (mãe, gênero, endereço, situação RF, óbito) usar pacotes C/D/E/F — fora do escopo desta skill, mas mesma autenticação/endpoint.

## Autenticação

- Token obtido no painel `https://www.cpfcnpj.com.br/admin/tokens.html`.
- **Token de testes (dados fictícios):** `5ae973d7a997af13f0aaf2bf60e65803`.
- Token é vinculado ao IP de origem; chamar a partir de **Edge Function** (servidor) — nunca do frontend. Guardar como segredo `CPFCNPJ_TOKEN` (Lovable Cloud secret).
- Após 3 chamadas consecutivas com token inválido → bloqueio de 5 min.

## Endpoint

```
GET https://api.cpfcnpj.com.br/{token}/{pacote}/{cpf}
```

- `token`: string (32 hex).
- `pacote`: `1` (CPF A) ou `7` (CPF B).
- `cpf`: **11 dígitos numéricos, sem máscara** (sem pontos/traço).
- Sem body, sem headers obrigatórios além dos padrão. `Content-Type` da resposta: `application/json`.
- Timeout recomendado: **60s** (usar menos consome créditos sem retorno em instabilidade).
- Limite: **20 req/s** por token; passou disso, espere 1s e tente de novo.

### Exemplo de URL

```
https://api.cpfcnpj.com.br/5ae973d7a997af13f0aaf2bf60e65803/1/00000000000
https://api.cpfcnpj.com.br/5ae973d7a997af13f0aaf2bf60e65803/7/00000000000
```

## Resposta de sucesso

`status: 1` indica sucesso. Campos não pertinentes ao pacote vêm ausentes ou `null`.

### CPF A (pacote 1)
```json
{
  "status": 1,
  "cpf": "111.444.777-35",
  "nome": "Test Token",
  "pacoteUsado": 1,
  "saldo": 123,
  "consultaID": "11bb22cc33dd44ee",
  "delay": 0.30
}
```

### CPF B (pacote 7)
```json
{
  "status": 1,
  "cpf": "111.444.777-35",
  "nome": "Test Token",
  "nascimento": "31/12/1900",
  "pacoteUsado": 7,
  "saldo": 122,
  "consultaID": "11bb22cc33dd44ef",
  "delay": 0.42
}
```

Campos relevantes:
- `status` (bool/int): `1` sucesso, `0` falha (ver `erro`/`erroCodigo`).
- `cpf` (string): CPF formatado `000.000.000-00`.
- `nome` (string): nome completo **sem acentos**.
- `nascimento` (string, só pacote 7): `DD/MM/AAAA`.
- `pacoteUsado` (int): eco do pacote.
- `saldo` (int): saldo restante no pacote após a consulta.
- `consultaID` (string, 16): id da consulta para auditoria.
- `delay` (float): tempo total em segundos.

## Resposta de erro

`status: 0` + `erroCodigo` + `erro` (mensagem). HTTP code costuma ser 200 mesmo em erro lógico — **sempre cheque `status`**.

| `erroCodigo` | Mensagem (`erro`) | O que fazer |
|---|---|---|
| 100 | `CPF inválido!` | DV não confere — não reenviar, validar no client. |
| 101 | `Informe um CPF com 11 dígitos!` | Faltam dígitos — validar no client. |
| 102 | `O CPF informado não existe (...)` | CPF válido porém não consta na RF — tratar como "não encontrado". |
| 400 | `Incorrect parameters.` | URL malformada — revisar montagem. |
| 1000 | `Token inválido!` | Token errado ou IP fora da allowlist. Não tente em loop (blacklist após 3). |
| 1001 | `Créditos insuficientes!` | Comprar saldo no pacote. Bloqueio de 5 min após 3 falhas seguidas. |
| 1002 | `Conta suspensa e/ou inativa!` | Contatar suporte. |
| 1003 | `Blacklist até *DATA*` | IP+token bloqueados — respeitar a data. |
| 1004 | `Pacote indisponível para consultas!` | ID de pacote errado/desativado. |
| 1005 | `Não é possível consultar *CPF/CNPJ* neste pacote!` | Falha no fornecedor/interno — retry com backoff. |
| 1006 | `Supplier 2 offline. Contact us!` | Provedor offline — retry depois. |
| 1007 | `Limite de requisições (20) por segundo excedido` | Throttle no cliente, esperar 1s. |

Bloqueios automáticos do servidor:
- 3 consultas seguidas do **mesmo CPF no mesmo pacote em < 1 min** → bloqueio de 3 min.
- 3 consultas com **token inválido** → 5 min.
- 3 consultas **sem créditos em < 1 min** → 5 min.

## Endpoint auxiliar: saldo (sem custo)

```
GET https://api.cpfcnpj.com.br/{token}/saldo/{pacote}
```

Resposta:
```json
{ "pacote": { "id": 1, "nome": "CPF A", "saldo": 123 } }
```

Útil para mostrar saldo no admin antes de ativar a integração.

## Boas práticas de integração no projeto

1. **Sempre via Edge Function** (`supabase/functions/cpfcnpj-lookup/index.ts`); nunca expor o token.
2. **Secret**: `CPFCNPJ_TOKEN` (runtime). Pacote default configurável (`CPFCNPJ_DEFAULT_PACKAGE=7`).
3. **Sanitizar entrada**: `cpf.replace(/\D/g,'')` e validar com 11 dígitos + DV antes de chamar a API (economiza créditos).
4. **Validar CPF localmente** (algoritmo módulo 11) para evitar `erroCodigo=100/101`.
5. **Normalizar saída** para o app:
   ```ts
   { found: boolean, name?: string, birthDate?: string /* YYYY-MM-DD */, raw }
   ```
   Converter `nascimento` `DD/MM/AAAA` → `YYYY-MM-DD` ao consumir.
6. **Cache curto** (ex.: 24h em tabela `cpf_lookup_cache`) por `cpf + pacote` para evitar dupla cobrança quando o usuário edita o formulário.
7. **Tratamento de erro padronizado**: mapear `erroCodigo` para `{ kind: 'invalid' | 'not_found' | 'auth' | 'no_credits' | 'rate_limit' | 'provider' | 'unknown' }`.
8. **Retry** apenas em `1005/1006/1007` com backoff exponencial (até 3x). Nunca em `100/101/102/1000/1001/1002/1003`.
9. **Logar** `consultaID`, `pacoteUsado`, `saldo`, `delay` em tabela de auditoria (`cpf_lookup_logs`) — útil para conciliação financeira.
10. **Substituir** o stub atual em `supabase/functions/search-cpf/index.ts` (hoje retorna `found:false` por falta de provedor) pelo client real desta API quando `CPFCNPJ_TOKEN` estiver configurado; manter fallback `found:false` se o secret não existir.

## Esqueleto da Edge Function

```ts
// supabase/functions/search-cpf/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE = "https://api.cpfcnpj.com.br";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { cpf, pacote = 7 } = await req.json();
    const digits = String(cpf || "").replace(/\D/g, "");
    if (digits.length !== 11) {
      return json({ found: false, error: "invalid", message: "CPF deve ter 11 dígitos" });
    }
    const token = Deno.env.get("CPFCNPJ_TOKEN");
    if (!token) return json({ found: false, error: "no_provider" });

    const r = await fetch(`${BASE}/${token}/${pacote}/${digits}`, {
      signal: AbortSignal.timeout(60_000),
    });
    const data = await r.json();

    if (data?.status !== 1) {
      const map: Record<number, string> = {
        100: "invalid", 101: "invalid", 102: "not_found",
        1000: "auth", 1001: "no_credits", 1002: "auth",
        1003: "auth", 1004: "config", 1005: "provider",
        1006: "provider", 1007: "rate_limit",
      };
      return json({
        found: false,
        error: map[data?.erroCodigo] ?? "unknown",
        code: data?.erroCodigo,
        message: data?.erro,
      });
    }

    let birthDate: string | undefined;
    if (data.nascimento && /^\d{2}\/\d{2}\/\d{4}$/.test(data.nascimento)) {
      const [d, m, y] = data.nascimento.split("/");
      birthDate = `${y}-${m}-${d}`;
    }

    return json({
      found: true,
      name: data.nome,
      birthDate,
      pacoteUsado: data.pacoteUsado,
      saldo: data.saldo,
      consultaID: data.consultaID,
    });
  } catch (e) {
    return json({ found: false, error: "exception", message: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
```

## Checklist de produção

- [ ] Secret `CPFCNPJ_TOKEN` adicionado (runtime).
- [ ] IP do projeto autorizado no painel CPF.CNPJ (token vincula IP).
- [ ] Validação DV de CPF no client antes de enviar.
- [ ] Mapeamento de `erroCodigo` para UX clara.
- [ ] Cache + log de auditoria.
- [ ] Throttle no client para respeitar 20 req/s.
- [ ] Pacote 7 (CPF B) escolhido como default sempre que precisar de data de nascimento.

## Referências

- Documentação oficial: <https://www.cpfcnpj.com.br/dev/>
- Tabela de pacotes/preços: <https://www.cpfcnpj.com.br/precos/>
- Painel/tokens: <https://www.cpfcnpj.com.br/admin/tokens.html>
- Token de testes: `5ae973d7a997af13f0aaf2bf60e65803` (somente dados fictícios)
