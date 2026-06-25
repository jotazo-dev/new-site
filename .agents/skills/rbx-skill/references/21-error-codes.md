# Códigos de erro RBX

Todas as respostas seguem o padrão:

```json
{ "status": 0, "erro_code": 7, "erro_desc": "Data de vencimento não permitida", ... }
```

`status: 1` = sucesso, `status: 0` = erro. Sempre cheque `status` antes de `result`.

## Códigos comuns

| `erro_code` | Significado | Como tratar |
|---|---|---|
| `1` | A consulta não retornou resultados | Trate como lista vazia (não é erro real). |
| `7` | Data de vencimento não permitida | Acontece em `get_banking_billet` quando enviamos `due_date` para um documento já com a data correta. **Não envie `due_date`** — o RBX gera com a data atual. |
| `223` | Estímulo de marketing só para atendimento Comercial | Validação de regra de negócio. Remova `Estimulo_Marketing` se o `Tipo` não for `C`. |
| `403` / 401 HTTP | Chave inválida | Reconfigurar `auth_key_v1`/`auth_key_v2` em `rbx_config`. |
| Sem JSON / HTML retornado | Geralmente página de login RBX ou erro 500 do PHP | O helper `rbxFetchV2` devolve `{status:0, error_description, body}` com os primeiros 500 chars do body — útil para debug. |

## Padrão de tratamento (TypeScript)

```ts
import { okStatus, errDesc } from "../_shared/rbx.ts";

const res = await rbxFetchV2(cfg.endpointV2, cfg.authKeyV2!, "get_banking_billet", { document_id });
if (!okStatus(res)) {
  if (res?.erro_code === 1) return []; // lista vazia
  throw new Error(`RBX falhou: ${errDesc(res)}`);
}
// res.result garantido
```

## Erros de rede

`rbxFetchV1`/`rbxFetchV2` usam `AbortSignal.timeout(20000)` (20s). Em timeout/DNS/etc.:
- v1 → retorna `null`
- v2 → retorna `{ status: 0, error_description: "<mensagem>" }`

Sempre tratar os dois casos.
