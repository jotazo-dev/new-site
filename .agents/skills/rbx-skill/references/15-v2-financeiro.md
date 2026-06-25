# RBX v2 — Financeiro

Total: 16 endpoints

---

### Baixa de documento

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [baixa-de-documento](https://www.developers.rbxsoft.com/v2/#baixa-de-documento)

**Request:**

```json
{
   "document_payment": {
      "payment_type": "money",
      "document_id": 22563,
      "document_historic_id": 65874,
      "payment_account_id": 1,
      "payment_historic_id": 20,
      "payment_date": "2023-04-01",
      "payment_credit_date": "2023-04-01",
      "payment_discount_type": "V",
      "payment_discount_amount": 10.5,
      "payment_interest_type": "P",
      "payment_interest_amount": 0,
      "payment_fine_type": "P",
      "payment_fine_amount": 0,
      "rate_amount": 1.25,
      "rate_historic_id": 13,
      "rate_currency_id": 1,
      "payment_comment": "Baixa avulsa",
      "unblock_customer": true
   }
}
```

**Response (ok):**

```json
{
   "document_payment": {
      "payment_type": "credit_card_machine",
      "document_id": 22563,
      "document_historic_id": 65874,
      "payment_date": "2023-04-01",
      "payment_discount_type": "V",
      "payment_discount_amount": 10.5,
      "payment_interest_type": "P",
      "payment_interest_amount": 0,
      "payment_fine_type": "P",
      "payment_fine_amount": 0,
      "payment_comment": "Baixa com cartão de crédito",
      "unblock_customer": true,
      "payment_installments": 3,
      "card_brand": "visa",
      "payment_receipt": {
         "document_number": 123456,
         "authorization_number": "ABCDE123"
      }
   }
}
```

**Response (erro):**

```json
{
   "document_payment": {
      "payment_type": "debit_card_machine",
      "document_id": 22563,
      "document_historic_id": 65874,
      "payment_date": "2023-04-01",
      "payment_discount_type": "V",
      "payment_discount_amount": 10.5,
      "payment_interest_type": "P",
      "payment_interest_amount": 0,
      "payment_fine_type": "P",
      "payment_fine_amount": 0,
      "payment_comment": "Baixa com cartão de débito",
      "unblock_customer": true,
      "card_brand": "master",
      "payment_receipt": {
         "document_number": 123456,
         "authorization_number": "ABCDE123"
      }
   }
}
```

---

### Cadastro de cartão de crédito/débito

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-cartao-de-credito-debito](https://www.developers.rbxsoft.com/v2/#cadastro-de-cartao-de-credito-debito)

**Request:**

```json
{
   "payment_card_insert": {
      "person": {
         "type": "customer",
         "id": 15
      },
      "card": {
         "number": "6548654825149256",
         "holder": "Jose Bonifacio da Silva",
         "expiration_date": "12/2024",
         "brand": "visa",
         "type": "credit",
         "default": true,
         "generate_token": true,
         "security_code": "123"
      }
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": {
      "card_id": 477,
      "generated_token": true
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 21,
   "error_description": "The field card/expiration_date is invalid! This card is expired!",
   "result": ""
}
```

---

### Cadastro de pré-faturamento

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-pre-faturamento](https://www.developers.rbxsoft.com/v2/#cadastro-de-pre-faturamento)

**Request:**

```json
{
   "pre_billing_insert": {
      "customer_id": 2563,
      "contract_id": 26552,
      "period": "202304",
      "type": "increase",
      "description": "Adicional",
      "value": 100.2
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": {
      "id": "69049",
      "comments": ""
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 16,
   "error_description": "Customer or contract does not exist!",
   "result": ""
}
```

---

### Consulta documentos em aberto de clientes

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [consulta-documentos-em-aberto-de-clientes](https://www.developers.rbxsoft.com/v2/#consulta-documentos-em-aberto-de-clientes)

**Request:**

```json
{
   "get_unpaid_document": {
      "customer_id": 330531,
      "account_list": [
         3,
         6,
         9
      ]
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "",
   "error_description": "",
   "result": [
      {
         "id": 11313347,
         "account_number": 3,
         "due_date": "2023-03-13",
         "document_number": 22934,
         "bank_number": 2255878,
         "charge_type": "with registry",
         "historic": "Documento a Receber",
         "comments": "",
         "source": "Billing",
         "bank": 1,
         "value_init": 110.86,
         "value_interest": 1.56,
         "value_fine": 2.21,
         "value_discount": 0,
         "value_up": 114.63,
         "address": {
            "street": "Rua Presidente Nereu Ramos",
            "number": 1001,
            "complement": "",
            "neighborhood": "Centro",
            "city": "Marialva",
            "state": "PR",
            "district": "",
            "zipcode": "86990000",
            "country": "Brasil"
         },
         "contracts": [
            12345
         ]
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 3,
   "error_description": "The field customer_id is required!",
   "result": ""
}
```

---

### Consulta link de notas fiscais emitidas

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [consulta-link-de-notas-fiscais-emitidas](https://www.developers.rbxsoft.com/v2/#consulta-link-de-notas-fiscais-emitidas)

**Request:**

```json
{
   "invoices_issued_pdf": {
      "id": [
         300
      ]
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": [
      {
         "id": "300",
         "url": "https://meurbx.com/routerbox/tmp/notafiscal_x_xxxxxxx.pdf",
         "error_code": 0,
         "error_description": ""
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 0,
   "error_description": "",
   "result": [
      {
         "id": 100,
         "url": "",
         "error_code": 9,
         "error_description": "Nota não existe ou não está nas situações (Digitada, Autorizada, Emitida)"
      }
   ]
}
```

---

### Consulta notas fiscais emitidas

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [consulta-notas-fiscais-emitidas](https://www.developers.rbxsoft.com/v2/#consulta-notas-fiscais-emitidas)

**Request:**

```json
{
   "invoices_issued": {
      "model": "21",
      "issue": "2023-04-01",
      "customer_id": 330570
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": [
      {
         "id": "272324",
         "model": "21",
         "serial": "1",
         "number": "123",
         "access_key": "0927a2aed75c4a6c858avbf772ee1e5d",
         "issue": "2023-04-01",
         "customer_id": "330570",
         "nature_of_operation": "Nota Fiscal Modelo 21",
         "value": "5.00",
         "status": "0",
         "items": [
            {
               "item": "1",
               "code": "PLA-1",
               "description": "Item 1",
               "cfop": "5301",
               "unit": "1",
               "quantity": "1.00",
               "unit_value": "5.00",
               "gross_value": "5.00",
               "discount": "0.00",
               "other_expenses": "0.00",
               "net_value": "5.00"
            }
         ],
         "document": [
            {
               "document_number": "23016",
               "due_date": "2023-04-15",
               "document_value": "5.00",
               "document_status": "A"
            }
         ]
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 10,
   "error_description": "O campo issue é inválido!",
   "result": []
}
```

---

### Envio de aviso de pagamento

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [envio-de-aviso-de-pagamento](https://www.developers.rbxsoft.com/v2/#envio-de-aviso-de-pagamento)

**Request:**

```json
{
   "send_payment_notification": {
      "document_id": 11313439,
      "payment_date": "2023-04-01",
      "customer_id": 330570,
      "file": {
         "name": "comprovante.pdf",
         "data": "TWFuIGlzIGRpc3Rpbmd1aXNoZWQsIG5vdCBvbmx5IGJ5IGhpcyByZWFzb24sIGJ1dCBieSB0aGlzIHNpbmd1bGFyIHBhc3Npb24gZnJvbSBvdGhlciBhbmltYWxzLCB3aGljaCBpcyBhIGx1c3Qgb2YgdGhlIG1pbmQsIHRoYXQgYnkgYSBwZXJzZXZlcmFuY2Ugb2YgZGVsaWdodCBpbiB0aGUgY29udGludWVkIGFuZCBpbmRlZmF0aWdhYmxlIGdlbmVyYXRpb24gb2Yga25vd2xlZGdlLCBleGNlZWRzIHRoZSBzaG9ydCB2ZWhlbWVuY2Ugb2YgYW55IGNhcm5hbCBwbGVhc3VyZS4=="
      }
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "",
   "error_description": "",
   "result": {
      "message": "Payment notification sent succesfuly!",
      "ticket_id": "2381860"
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 21,
   "error_description": "Payment notification already informed",
   "result": []
}
```

---

### Envio de boleto por e-mail

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [envio-de-boleto-por-e-mail](https://www.developers.rbxsoft.com/v2/#envio-de-boleto-por-e-mail)

**Request:**

```json
{
   "send_banking_billet": {
      "document_id": 11313439,
      "due_date": "2023-04-01",
      "customer_id": 330570,
      "customer_email": "cliente@provedor.com.br",
      "email_subject": "Solicitação de segunda via do boleto",
      "email_body": "Caro cliente, conforme solicitado, segue a segunda via do seu boleto com vencimento em 01/04/2023.",
      "email_gateway_id": 1
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "0",
   "error_description": "",
   "result": "Banking billet sent successfully"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 25,
   "error_description": "The due date must be greater than or equal to today",
   "result": ""
}
```

---

### Estorno de documentos em aberto

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [estorno-de-documentos-em-aberto](https://www.developers.rbxsoft.com/v2/#estorno-de-documentos-em-aberto)

**Request:**

```json
{
   "document_delete": {
      "document_id": 9136,
      "reason_id": 1,
      "comments": "Documento estornado via Web Service!",
      "user": "usuario",
      "invoices_typed": "cancel",
      "invoices_issued": "cancel",
      "invoices_pre_typed": "delete",
      "service_invoice_generated": "cancel",
      "service_invoice_issued": "cancel"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": [
      "Documento estornado com sucesso!"
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 29,
   "error_description": "O documento informado já se encontra estornado!",
   "result": []
}
```

---

### Geração de linha digitável de boleto

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [geracao-de-linha-digitavel-de-boleto](https://www.developers.rbxsoft.com/v2/#geracao-de-linha-digitavel-de-boleto)

**Request:**

```json
{
   "get_barcode": {
      "banking_billet_id": 254875,
      "banking_billet_due_date": "2023-04-01",
      "send_barcode": true,
      "cell_phone_number": "44999887766",
      "send_content": "Sua linha digitável para pagamento é: |BARCODE|"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "",
   "error_description": "",
   "result": "00000.00000 00000.000000 00000.000000 0 00000000000000"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 6,
   "error_description": "The field banking_billet_due_date can not be past due!",
   "result": ""
}
```

---

### Geração de link para download da fatura de serviços em PDF

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [geracao-de-link-para-download-da-fatura-de-servicos-em-pdf](https://www.developers.rbxsoft.com/v2/#geracao-de-link-para-download-da-fatura-de-servicos-em-pdf)

**Request:**

```json
{
   "get_service_invoice": {
      "service_invoice_id": 1052,
      "document_id": null
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": {
      "service_invoice_link": "https://meurbx.com/routerbox/tmp/fatura_xxxxxxx.pdf",
      "service_invoice_available": 15
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 7,
   "error_description": "Service invoice not found!",
   "result": ""
}
```

---

### Geração de link para download do boleto em PDF

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [geracao-de-link-para-download-do-boleto-em-pdf](https://www.developers.rbxsoft.com/v2/#geracao-de-link-para-download-do-boleto-em-pdf)

**Request:**

```json
{
   "get_banking_billet": {
      "document_id": 22563
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": {
      "banking_billet_link": "https://meurbx.com/routerbox/tmp/boleto_xxxxxxx.pdf",
      "banking_billet_available": 15,
      "banking_billet_base64": "JVBERi0xLjcKJeLjz9..."
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 5,
   "error_description": "Não foi encontrado um documento em aberto com o document_id informado!",
   "result": ""
}
```

---

### Inclusão de lançamento financeiro

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [inclusao-de-lancamento-financeiro](https://www.developers.rbxsoft.com/v2/#inclusao-de-lancamento-financeiro)

**Request:**

```json
{
   "document_insert": {
      "type": "customer",
      "id": 1,
      "account_id": 3,
      "historic_id": 1,
      "origin": "others",
      "bank": 1,
      "bank_agreement": 123,
      "billing_type": "registered",
      "days_of_protest": 10,
      "classifier": 1,
      "contract_id": [
         1,
         3,
         4
      ],
      "installments": [
         {
            "complement": "Adesão 01/03",
            "due_date": "2024-10-10",
            "punctuality_discount": {
               "discount_type": "value",
               "discount_value": 10
            },
            "items": [
               {
                  "description": "Adesão Parcela 01/03",
                  "value": 100
               },
               {
                  "description": "Roteador Parcela 01/03",
                  "value": 100
               }
            ]
         },
         {
            "complement": "Adesão 02/03",
            "due_date": "2024-11-10",
            "punctuality_discount": {
               "discount_type": "percentage",
               "discount_value": 10
            },
            "items": [
               {
                  "description": "Adesão Parcela 02/03",
                  "value": 100
               },
               {
                  "description": "Roteador Parcela 02/03",
                  "value": 100
               }
            ]
         },
         {
            "complement": "Adesão 03/03",
            "due_date": "2024-12-10",
            "items": [
               {
                  "description": "Adesão Parcela 03/03",
                  "value": 100
               },
               {
                  "description": "Roteador Parcela 03/03",
                  "value": 100
               }
            ]
         }
      ]
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "",
   "error_description": "",
   "result": "Documento incluído com sucesso!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 7,
   "error_description": "O cliente informado não foi encontrado!",
   "result": []
}
```

---

### Obter informação do Pix Copia e Cola

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [obter-informacao-do-pix-copia-e-cola](https://www.developers.rbxsoft.com/v2/#obter-informacao-do-pix-copia-e-cola)

**Request:**

```json
{
   "get_pix_copia_cola": {
      "banking_billet_id": 254875,
      "send_pix_copia_cola": true,
      "cell_phone_number": "44999999999",
      "send_content": "Seu codigo Pix para pagamento é: |PIX_COPIA_E_COLA|"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "000000000000000000banco.gov.bcb.pix0000qrcodepix-h.banco.com.br/pix/v2/cobv/b940a0c6-c41c-4d6a-bd0d-a32655cb65c25204000053039865802BR5925XXX XXXXXXX 6008XXXXXXXX2070503***630417E5"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 16,
   "error_description": "O boleto bancário não tem a informação Pix Copia e Cola!",
   "result": ""
}
```

---

### Obter informação do QR Code do Pix

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [obter-informacao-do-qr-code-do-pix](https://www.developers.rbxsoft.com/v2/#obter-informacao-do-qr-code-do-pix)

**Request:**

```json
{
   "get_pix_qrcode": {
      "banking_billet_id": 254875
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "iVBORw0KGgoAAAANSUhEUgAAA/8AAAP/AQAAAAC+eUH7AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAAAGAAAABgAPBrQs8AAAAHdElNRQfmDA8MNDrlZnxJAAAERElEQVR42u3dQXLaMBQGYGWy6JIjcBSOBkfjKByBJYtMXNyg8CQ/mSRtJ53p929IeNbTl2VkyS7T9+a1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/CuAlzLMU1LeXb87XD+70Zuu/bhp2QMAAAAAAAAAAAAAAAAAACSAH9MyA0Dim0efr5/b6+fxNsOt3OcIAAAAAAAAAAAAAAAAAACwAjiH1vslYHP9+VQW6wM1FbDC3wIAAAAAAAAAAAAAAAAAAHwNEBMBtzxff72U++37Y84HAAAAAAAAAAAAAAAAAAD4TUCdoQKmabF9vpYLAAAAAAAAAAAAAAAAAADA1wF9uhY9IIyu5WR0HwAAAAAAAAAAAAAAAAAAgBFgkA+cbl8pjwIAAAAAAAAAAAAAAAAAANADHqRfPjje2vxqsczuY10BAAAAAAAAAAAAAAAAAAAywDm02U/p/vg4Q2nXB2IO96ufB80BAAAAAAAAAAAAAAAAAAB6QHa6fZBjWaS/fZ9kE0YDAAAAAAAAAAAAAAAAAAD0gLg/vku2AFBbJDNU/uH+dVwf2LZ/CQAAAAAAAAAAAAAAAAAAwMNn04Vcbu22y9JLWU188Vv1AQAAAAAAAAAAAAAAAAAA9IApXDPnWJoFgOcAqNnXFm+JqwvzDIfyfjZ+dTQAAAAAAAAAAAAAAAAAAEAHmLOd7vvjuxnmnMri8HvMqZ0oey8cAAAAAAAAAAAAAAAAAADAI0AJ15R2d/15WZ7zPOV5UAYAAAAAAAAAAAAAAAAAAIiAuD9+O91v34fy4PB7tj6wa7+K6wNT2xwAAAAAAAAAAAAAAAAAACA9/F5bHN6G1RlWdtfH0+11hjkBccn/OgAAAAAAAAAAAAAAAAAAgHR9oJTmP/w6w5T4utGbcNmt/Bqabqbx7noAAAAAAAAAAAAAAAAAAIDs/nxIXAA4jX3n0i4AhNGDAAAAAAAAAAAAAAAAAAAAPASEcs22LWeAmrL+2nYAAAAAAAAAAAAAAAAAAIAMcO5muCXbPv/eok0yuoTmc3Z3CwAAAAAAAAAAAAAAAAAAQPPo+JXU9YEeUNpn053DjPt89KktAwAAAAAAAAAAAAAAAAAADA+/hzwNUIeSHn6PM5T89n0IAAAAAAAAAAAAAAAAAADAcHd9zQqgy6WkCwC9b86x5OsDAAAAAAAAAAAAAAAAAAAAcQN8bVGW/+Gf2nLNypPt+uzuVwIAAAAAAAAAAAAAAAAAAHwGMGzRPpsuJpTji9cnAAAAAAAAAAAAAAAAAACAPwqYknKSzzwcDwAAAAAAAAAAAAAAAADg/wb0KeuH37ts8tFxd/0JAAAAAAAAAAAAAAAAAABgBTBIBVy6GQ73cj9DNzouPmxbIgAAAAAAAAAAAAAAAAAAwEff7PbXAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8P2Any2QZOot87dDAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIyLTEyLTE1VDEyOjUyOjU4KzAwOjAwPR7s0QAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyMi0xMi0xNVQxMjo1Mjo1OCswMDowMExDVG0AAAAASUVORK5CYII="
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 16,
   "error_description": "O boleto bancário não tem a informação Pix QRcode!",
   "result": ""
}
```

---

### Reversão de baixa

- **Versão:** v2
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [reversao-de-baixa](https://www.developers.rbxsoft.com/v2/#reversao-de-baixa)

**Request:**

```json
{
   "document_payment_reversal": {
      "document_id": 32658,
      "reason_id": 10,
      "user": "usuario",
      "comments": "Baixa indevida"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": [
      "Payment successfully reversed"
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 15,
   "error_description": "The document_id is unpaid!",
   "result": ""
}
```

---
