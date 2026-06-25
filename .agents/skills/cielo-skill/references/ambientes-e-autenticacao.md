# Ambientes, URLs e autenticação

## URLs base

| Ambiente | Transacional (POST/PUT) | Consulta (GET) |
|---|---|---|
| Sandbox | `https://apisandbox.braspag.com.br` | `https://apiquerysandbox.braspag.com.br` |
| Produção | `https://api.braspag.com.br` | `https://apiquery.braspag.com.br` |

Endpoint comum: `/v2/sales/` (acrescentar `{PaymentId}`, `/capture`, `/void`, `/RecurrentPayment`).

## Credenciais

| Credencial | Formato | Onde obter |
|---|---|---|
| `MerchantId` | GUID 36 | Sandbox: cadastro em https://docs.cielo.com.br/gateway/page/sandbox-gateway . Produção: e-mail de boas-vindas Cielo. Em geral o mesmo nos dois ambientes. |
| `MerchantKey` | string 40 (alfanumérico) | Sandbox: cadastro sandbox. Produção: criar/desativar no Portal E-commerce. **Diferente** entre sandbox e produção. |

Cielo nunca pede `MerchantKey` por telefone/e-mail. Tratar como segredo (Lovable: `add_secret`, ex.: `CIELO_MERCHANT_KEY_SANDBOX`, `CIELO_MERCHANT_KEY_PROD`, `CIELO_MERCHANT_ID`).

## Headers obrigatórios

```http
Content-Type: application/json
MerchantId:  <GUID>
MerchantKey: <string>
RequestId:   <GUID opcional, recomendado>
```

`RequestId` ajuda em rastreabilidade quando vários servidores fazem POST/PUT/GET ao mesmo recurso.

## Exemplo de chamada mínima (curl)

```bash
curl -X POST "https://apisandbox.braspag.com.br/v2/sales/" \
  -H "Content-Type: application/json" \
  -H "MerchantId: e3c24810-18bb-4bd7-88a0-a36d6b4a0731" \
  -H "MerchantKey: GQUAIWVDKUINZRHDQPLHUVHAIIFEIXFEXWPOYGHY" \
  -H "RequestId: $(uuidgen)" \
  -d @payload.json
```

## Arquitetura

- 100% REST/JSON, sem DLL, sem SDK obrigatório, sem plug-in no front da loja.
- Servidor da loja ↔ servidor Braspag (browser do comprador **não** participa, exceto em 3DS/Pix QR/redirect Débito).
- O Gateway abstrai múltiplas adquirentes (Cielo, Rede, Getnet, FirstData, SafraPay) via campo `Payment.Provider`. Serviços de Retentativa/Load Balance trocam de adquirente automaticamente quando habilitados.

## Resposta padrão

- HTTP `201 Created` para POST `/v2/sales/`.
- HTTP `200 OK` para PUT/GET.
- HTTP `400/422` para validação; corpo `[{ "Code": int, "Message": "..." }]`.
- Sempre conferir `Payment.Status` para saber se foi autorizado.
