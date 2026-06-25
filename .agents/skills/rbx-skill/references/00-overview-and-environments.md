# Overview, ambientes e autenticação

## URLs

A URL base é configurável (multi-tenant — cada provedor tem a sua). No Jotazo fica em `rbx_config.base_url`.

| Versão | Endpoint |
|---|---|
| v1.0 | `{base_url}/routerbox/ws/rbx_server_json.php` |
| v2.0 | `{base_url}/routerbox/ws_json/ws_json.php` |

Os helpers `loadRbxConfig()` em `supabase/functions/_shared/rbx.ts` já montam isso (`cfg.endpoint` e `cfg.endpointV2`).

## Ambientes

Existem dois ambientes: **Homologação** e **Produção**. **A mesma URL atende os dois** — quem define é a `ChaveIntegracao` / `authentication_key` configurada na interface do RBX em
*Empresa > Parâmetros > Web Services*.

- **HML**: valida tudo, **não persiste**. Retorna dados fictícios. Use para integração inicial.
- **Produção**: cadastros reais.

## Autenticação

### v1
Chave no corpo da requisição:
```json
{ "NomeDoServico": { "Autenticacao": { "ChaveIntegracao": "XXX" }, "Filtro": "..." } }
```

### v2
Chave em **dois lugares** (header + body):
```http
POST /routerbox/ws_json/ws_json.php
Content-Type: application/json
Accept: application/json
authentication_key: XXX

{ "get_banking_billet": { "document_id": 123, "authentication_key": "XXX" } }
```

O helper `rbxFetchV2` já replica a chave no body automaticamente.

## Requisitos técnicos

- Sempre **HTTPS** (SSL obrigatório).
- Sempre **POST**.
- Codificação **UTF-8**.
- Content-Type: `application/json`.
- Versão mínima do RBX: **7.0.010**.

## Estrutura de resposta

Todos os serviços retornam:

```json
{
  "status": 1,           // 1 = ok, 0 = erro
  "erro_code": "",       // código do erro (quando status=0)
  "erro_inf": "",        // info adicional
  "erro_desc": "",       // descrição humana do erro
  "erro_detail": "",     // detalhe técnico (quando aplicável)
  "result": { ... }      // payload (objeto, array ou string vazia em erro)
}
```

Para consultas, `result` é sempre um **array** (mesmo com 1 item). Para cadastros/operações, é um objeto.

## Por que v1 + v2 coexistem

O RBX evoluiu mantendo retrocompatibilidade. v2 é **adição**, não substituição:
- v1 mantém todas as consultas históricas (com `Filtro` SQL-like).
- v2 adiciona operações transacionais finas (alterar OS, encerrar atendimento, gerar PIX, etc.).

Cada projeto consome **as duas em paralelo** — exatamente o padrão usado em `supabase/functions/_shared/rbx.ts`.
