# RBX v2 — Variados

Total: 14 endpoints

---

### Alteração de campo complementar

- **Versão:** v2
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [alteracao-de-campo-complementar](https://www.developers.rbxsoft.com/v2/#alteracao-de-campo-complementar)

**Request:**

```json
{
   "additional_data_update": {
      "additional_data_id": 1374,
      "code": 21,
      "target_type": "contract",
      "target_id": 9121,
      "content": "02468"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Additional data changed successfully"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 16,
   "error_description": "Additional data not found!",
   "result": ""
}
```

---

### Consulta extrato de radius

- **Versão:** v2
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [consulta-extrato-de-radius](https://www.developers.rbxsoft.com/v2/#consulta-extrato-de-radius)

**Request:**

```json
{
   "radius_extract": {
      "customer_id": 5
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "0",
   "error_description": "",
   "result": [
      {
         "customer_id": "5",
         "username": "joao.silva",
         "start_time": "2023-03-04 13:00:00",
         "stop_time": "2023-03-05 12:59:19",
         "session_time": "86400",
         "octets_input": "1024000000000",
         "octets_output": "1024000000000",
         "nas": "(100.0.0.1)",
         "ipaddress": "100.0.0.2",
         "ipv6address": "2804:66ac:a1e6::/64",
         "delegatedipv6prefix": "2804:66ac:a169:4900::/56",
         "mac": "10:72:23:91:e1:19",
         "terminatecause": ""
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 4,
   "error_description": "Cliente inexistente no sistema",
   "result": ""
}
```

---

### Consulta provisionamento

- **Versão:** v2
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [consulta-provisionamento](https://www.developers.rbxsoft.com/v2/#consulta-provisionamento)

**Request:**

```json
{
   "provisioning_check": {
      "nas": "192.168.0.13"
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
         "NAS": "192.168.0.13",
         "Slot": [
            {
               "Porta": {
                  "1": {
                     "OnuID": [
                        "R",
                        "R"
                     ]
                  },
                  "2": {
                     "OnuID": [
                        "I",
                        "I"
                     ]
                  }
               }
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
   "error_description": "Não foram encontrados dados de provisionamento com os dados informados!",
   "result": ""
}
```

---

### Encerramento de pedido

- **Versão:** v2
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [encerramento-de-pedido](https://www.developers.rbxsoft.com/v2/#encerramento-de-pedido)

**Request:**

```json
{
   "order_finish": {
      "order_id": 1091
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "",
   "error_description": "",
   "result": "Order successfully finished!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 6,
   "error_description": "This order is already finished!",
   "result": ""
}
```

---

### Envio de SMS avulso

- **Versão:** v2
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [envio-de-sms-avulso](https://www.developers.rbxsoft.com/v2/#envio-de-sms-avulso)

**Request:**

```json
{
   "send_sms": {
      "gateway_sms_id": 2,
      "customer_id": 2658,
      "cellphone_number": "44999887766",
      "sms_content": "Olá, venha participar da nossa promoção!"
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
      "message": "SMS sent successfully!",
      "message_id": 55159
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 9,
   "error_description": "The cellphone number is invalid!",
   "result": []
}
```

---

### Exclusão de campo complementar

- **Versão:** v2
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [exclusao-de-campo-complementar](https://www.developers.rbxsoft.com/v2/#exclusao-de-campo-complementar)

**Request:**

```json
{
   "additional_data_delete": {
      "additional_data_id": 1374,
      "code": 21,
      "target_type": "contract",
      "target_id": 9121
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "",
   "error_description": "",
   "result": "Additional data deleted successfully"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 15,
   "error_description": "Additional data not found!",
   "result": ""
}
```

---

### Geração de contratos de pedido

- **Versão:** v2
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [geracao-de-contratos-de-pedido](https://www.developers.rbxsoft.com/v2/#geracao-de-contratos-de-pedido)

**Request:**

```json
{
   "order_generate_contracts": {
      "order_id": 1091
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "",
   "error_description": "",
   "result": "Contracts generated successfully"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 12,
   "error_description": "",
   "result": "Order was not found or contract is already generated!"
}
```

---

### Inclusão de campo complementar

- **Versão:** v2
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [inclusao-de-campo-complementar](https://www.developers.rbxsoft.com/v2/#inclusao-de-campo-complementar)

**Request:**

```json
{
   "additional_data_insert": {
      "code": 21,
      "target_type": "contract",
      "target_id": 9121,
      "content": "13579"
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
      "additional_data_id": "1374"
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 24,
   "error_description": "This field already exists in this register and cannot be added again!",
   "result": ""
}
```

---

### Listagem de pacotes

- **Versão:** v2
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [listagem-de-pacotes](https://www.developers.rbxsoft.com/v2/#listagem-de-pacotes)

**Request:**

```json
{
   "list_packages": {
      "enterprise": 1,
      "package_code": 3
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
         "enterprise_id": 1,
         "enterprise_description": "EMPRESA PRINCIPAL",
         "package_id": 3,
         "package_description": "PACOTE 500 MB",
         "validity": null,
         "operation_nature_accession": "(Proc. Outro Sistema)",
         "group": "(SEM GRUPO)",
         "effective_dates": "",
         "default_validity": 0,
         "status": "A",
         "allow_transfer": "S",
         "plan_data": [
            {
               "plan_id": 6,
               "description": "PLANO 500 MB",
               "accession": 0,
               "qos_id": 0,
               "discount": 0,
               "value": 10,
               "duration": 0,
               "discount_value": 0,
               "discount_period": 0
            },
            {
               "plan_id": 11,
               "description": "PLANO SVA",
               "accession": 0,
               "qos_id": 0,
               "discount": 0,
               "value": 36.9,
               "duration": 0,
               "discount_value": 0,
               "discount_period": 0
            },
            {
               "plan_id": 12,
               "description": "PLANO SVA",
               "accession": 0,
               "qos_id": 0,
               "discount": 0,
               "value": 100,
               "duration": 0,
               "discount_value": 0,
               "discount_period": 0
            }
         ],
         "value": 146.9
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 8,
   "error_description": "the 'package_code' field has an invalid value!",
   "result": ""
}
```

---

### TIP - Alteração de conta

- **Versão:** v2
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [tip-alteracao-de-conta](https://www.developers.rbxsoft.com/v2/#tip-alteracao-de-conta)

**Request:**

```json
{
   "tip_account_update": {
      "customer_id": 123,
      "contract_id": 165,
      "password": "x6s52c1s6",
      "email": "email@provedor.com",
      "activate_date": "2020-10-25",
      "credit_limit": 125.99,
      "due_date": 10,
      "tech_prefix": "44",
      "block_collect_call": true,
      "block_vc1": true,
      "block_ldn": true,
      "block_ldi": true,
      "do_not_disturb": true,
      "transfer_busy": true,
      "transfer_always": true,
      "transfer_no_answer": true
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
      "Subscriber updated successfully!",
      "Subscriber profile updated successfully!"
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 27,
   "error_description": "Customer_id/Contract_id not found!",
   "result": []
}
```

---

### TIP - Exclusão de conta

- **Versão:** v2
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [tip-exclusao-de-conta](https://www.developers.rbxsoft.com/v2/#tip-exclusao-de-conta)

**Request:**

```json
{
   "tip_account_delete": {
      "customer_id": 123,
      "contract_id": 165
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Account deleted successfully!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 12,
   "error_description": "Customer_id/Contract_id not found!",
   "result": ""
}
```

---

### TIP - Inclusão de conta

- **Versão:** v2
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [tip-inclusao-de-conta](https://www.developers.rbxsoft.com/v2/#tip-inclusao-de-conta)

**Request:**

```json
{
   "tip_account_insert": {
      "customer_id": 123,
      "contract_id": 165,
      "username": 2731910101,
      "password": "x6s52c1s6",
      "email": "email@provedor.com",
      "activate_date": "2024-04-01",
      "credit_limit": 125.99,
      "due_date": 10,
      "tech_prefix": "44",
      "block_collect_call": true,
      "block_vc1": true,
      "block_ldn": true,
      "block_ldi": true,
      "do_not_disturb": true,
      "transfer_busy": true,
      "transfer_always": true,
      "transfer_no_answer": true
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
      "tip_customer_id": 1526,
      "tip_profile_id": 100202
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 31,
   "error_description": "Customer_id/Contract_id not found!",
   "result": ""
}
```

---

### Upload de arquivos

- **Versão:** v2
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [upload-de-arquivos](https://www.developers.rbxsoft.com/v2/#upload-de-arquivos)

**Request:**

```json
{
   "files_upload": [
      {
         "type": "customer",
         "code": 1,
         "filename": "meu_arquivo.pdf",
         "file": "TWFuIGlzIGRpc3Rpbmd1aXNoZWQsIG5vdCBvbmx5IGJ5IGhpcyByZWFzb24sIGJ1dCBieSB0aGlzIHNpbmd1bGFyIHBhc3Npb24gZnJvbSBvdGhlciBhbmltYWxzLCB3aGljaCBpcyBhIGx1c3Qgb2YgdGhlIG1pbmQsIHRoYXQgYnkgYSBwZXJzZXZlcmFuY2Ugb2YgZGVsaWdodCBpbiB0aGUgY29udGludWVkIGFuZCBpbmRlZmF0aWdhYmxlIGdlbmVyYXRpb24gb2Yga25vd2xlZGdlLCBleGNlZWRzIHRoZSBzaG9ydCB2ZWhlbWVuY2Ugb2YgYW55IGNhcm5hbCBwbGVhc3VyZS4=",
         "visible": "no",
         "description": "Planilha de ações"
      },
      {
         "type": "user",
         "user": "usuario",
         "filename": "meu_arquivo2.pdf",
         "file": "TWFuIGlzIGRpc3Rpbmd1aXNoZWQsIG5vdCBvbmx5IGJ5IGhpcyByZWFzb24sIGJ1dCBieSB0aGlzIHNpbmd1bGFyIHBhc3Npb24gZnJvbSBvdGhlciBhbmltYWxzLCB3aGljaCBpcyBhIGx1c3Qgb2YgdGhlIG1pbmQsIHRoYXQgYnkgYSBwZXJzZXZlcmFuY2Ugb2YgZGVsaWdodCBpbiB0aGUgY29udGludWVkIGFuZCBpbmRlZmF0aWdhYmxlIGdlbmVyYXRpb24gb2Yga25vd2xlZGdlLCBleGNlZWRzIHRoZSBzaG9ydCB2ZWhlbWVuY2Ugb2YgYW55IGNhcm5hbCBwbGVhc3VyZS4",
         "visible": "no",
         "description": "Planilha de ações"
      }
   ]
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
         "id": 1244,
         "type": "customer",
         "code": 1,
         "filename": "meu_arquivo.pdf",
         "description": "Planilha de ações",
         "file": "TWFuIGlzIGRpc3Rpbmd1aXNoZWQsIG5vdCBvbmx5IGJ5IGhpcyByZWFzb24sIGJ1dCBieSB0aGlzIHNpbmd1bGFyIHBhc3Npb24gZnJvbSBvdGhlciBhbmltYWxzLCB3aGljaCBpcyBhIGx1c3Qgb2YgdGhlIG1pbmQsIHRoYXQgYnkgYSBwZXJzZXZlcmFuY2Ugb2YgZGVsaWdodCBpbiB0aGUgY29udGludWVkIGFuZCBpbmRlZmF0aWdhYmxlIGdlbmVyYXRpb24gb2Yga25vd2xlZGdlLCBleGNlZWRzIHRoZSBzaG9ydCB2ZWhlbWVuY2Ugb2YgYW55IGNhcm5hbCBwbGVhc3VyZS4=",
         "visible": "no"
      },
      {
         "id": 1245,
         "type": "user",
         "user": "usuario",
         "filename": "meu_arquivo2.pdf",
         "description": "Planilha de ações",
         "file": "TWFuIGlzIGRpc3Rpbmd1aXNoZWQsIG5vdCBvbmx5IGJ5IGhpcyByZWFzb24sIGJ1dCBieSB0aGlzIHNpbmd1bGFyIHBhc3Npb24gZnJvbSBvdGhlciBhbmltYWxzLCB3aGljaCBpcyBhIGx1c3Qgb2YgdGhlIG1pbmQsIHRoYXQgYnkgYSBwZXJzZXZlcmFuY2Ugb2YgZGVsaWdodCBpbiB0aGUgY29udGludWVkIGFuZCBpbmRlZmF0aWdhYmxlIGdlbmVyYXRpb24gb2Yga25vd2xlZGdlLCBleGNlZWRzIHRoZSBzaG9ydCB2ZWhlbWVuY2Ugb2YgYW55IGNhcm5hbCBwbGVhc3VyZS4",
         "visible": "no"
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 7,
   "error_description": "The user: usuario informed does not exist!",
   "result": ""
}
```

---

### Validação de acesso à Central do Assinante

- **Versão:** v2
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [validacao-de-acesso-a-central-do-assinante](https://www.developers.rbxsoft.com/v2/#validacao-de-acesso-a-central-do-assinante)

**Request:**

```json
{
   "authentication_validation": {
      "user": "joao",
      "password": "xs8f5s4x7s8"
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
      "customer_id": 65487,
      "customer_name": "João da Silva",
      "contract_status": "active"
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 10,
   "error_description": "User/Password incorrect!",
   "result": []
}
```

---
