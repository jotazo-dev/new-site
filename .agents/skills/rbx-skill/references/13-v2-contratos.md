# RBX v2 — Contratos

Total: 19 endpoints

---

### Alteração de contrato em degustação

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [alteracao-de-contrato-em-degustacao](https://www.developers.rbxsoft.com/v2/#alteracao-de-contrato-em-degustacao)

**Request:**

```json
{
   "temporary_plan_update": {
      "id": 110,
      "temporary_plan_id": 16,
      "start_period": "2023-04-01 00:00:00",
      "finish_period": "2023-04-30 23:59:59"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Registry successfully updated"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 5,
   "error_description": "The id does not exist!",
   "result": ""
}
```

---

### Alteração de contrato

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [alteracao-de-contrato](https://www.developers.rbxsoft.com/v2/#alteracao-de-contrato)

**Request:**

```json
{
   "contract_update":{
      "customer_id": 123,
      "contract_id": 456,
      "quantity": 1,
      "adhesion_value": 50.0,
      "discount_value": 10.0,
      "due_date_id": 5,
      "signature_date": "2025-01-01",
      "start_date": "2025-01-05",
      "bank_billing": 1,
      "bank_agreement": "123456",
      "group_contract": "S",
      "signature": true,
      "text": "Atualização de contrato via API.",
      "seller_name": "João da Silva",
      "sla_id": 2,
      "qos_id": 3,
      "online_signature":{
         "option": "required",
         "templates":[
            "1",
            "2"
         ]
      },
      "by_dealer_id": 4,
      "from_dealer_id": 6
   }
}
```

**Response (ok):**

```json
{
  "status": 1,
  "error_code": 0,
  "error_description": "",
  "result": "Contrato alterado com sucesso!"
}
```

**Response (erro):**

```json
{
  "status": 0,
  "error_code": 26,
  "error_description": "O cliente não foi encontrado.",
  "result": ""
}
```

---

### Alteração do desconto promocional do contrato

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [alteracao-do-desconto-promocional-do-contrato](https://www.developers.rbxsoft.com/v2/#alteracao-do-desconto-promocional-do-contrato)

**Request:**

```json
{
   "promotional_contract_discount_update": {
      "customer": 330624,
      "contract_number": 9626,
      "discount_period": 12,
      "discount_value": 15.00,
      "discount_description ": "Desconto de 12 Meses"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "",
   "error_description": "",
   "result": "Desconto promocional alterado com sucesso!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 21,
   "error_description": "Valor do desconto é maior do que o valor do contrato!",
   "result": ""
}
```

---

### Assinatura de contrato

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [assinatura-de-contrato](https://www.developers.rbxsoft.com/v2/#assinatura-de-contrato)

**Request:**

```json
{
   "contract_signature": {
      "customer_id": 22563,
      "contract_id": 65874,
      "update_start_date": true
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Contract signed successfully"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 11,
   "error_description": "Contract already signed!",
   "result": ""
}
```

---

### Ativação de contrato

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [ativacao-de-contrato](https://www.developers.rbxsoft.com/v2/#ativacao-de-contrato)

**Request:**

```json
{
   "contract_activate": {
      "customer_id": 22563,
      "contract_id": 65874
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Successfully activated contract"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 10,
   "error_description": "Invalid contract_id status. Must be one of the following: Waiting for Installation, On Installation or Suspended!",
   "result": ""
}
```

---

### Bloqueio de contrato

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [bloqueio-de-contrato](https://www.developers.rbxsoft.com/v2/#bloqueio-de-contrato)

**Request:**

```json
{
   "contract_block": {
      "customer_id": 22563,
      "contract_id": 65874
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Successfully blocked contract"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 10,
   "error_description": "Invalid contract_id status. Must be Active!",
   "result": ""
}
```

---

### Cadastro de contrato de degustação

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-contrato-de-degustacao](https://www.developers.rbxsoft.com/v2/#cadastro-de-contrato-de-degustacao)

**Request:**

```json
{
   "temporary_plan_insert": {
      "customer_id": 2563,
      "contract_id": 26552,
      "temporary_plan_id": 15,
      "start_period": "2023-04-01 00:00:00",
      "finish_period": "2023-04-30 23:59:59"
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
      "id": "8"
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 13,
   "error_description": "There is already a temporary plan for this contract!",
   "result": []
}
```

---

### Cancelamento de contrato

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [cancelamento-de-contrato](https://www.developers.rbxsoft.com/v2/#cancelamento-de-contrato)

**Request:**

```json
{
   "contract_cancel": {
      "customer_id": 330531,
      "contract_id": 9009,
      "reason_id": 1,
      "cancel_competition_id": 1,
      "billing": {
         "future_cancel": true,
         "cancellation_period_action": "block",
         "reason_id": 3
      },
      "pre_billing": {
         "cancel": true,
         "cancellation_period_action": "cancel"
      },
      "fine": {
         "account_id": 3,
         "historic_id": 1
      },
      "os": {
         "open": true,
         "target_type": "topic",
         "target_id": 5
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
   "result": "Successfully cancelled contract"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 38,
   "error_description": "The current status of the contract does not allow it to be canceled!",
   "result": ""
}
```

---

### Cancelamento de suspensão temporária de contrato

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [cancelamento-de-suspensao-temporaria-de-contrato](https://www.developers.rbxsoft.com/v2/#cancelamento-de-suspensao-temporaria-de-contrato)

**Request:**

```json
{
   "contract_suspend_temporary_cancel": {
      "customer_id": 5248,
      "contract_id": 6254,
      "user": "joao"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Temporary suspension successfully canceled"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 12,
   "error_description": "No temporary suspension was found for this contract_id!",
   "result": ""
}
```

---

### Desativação de contrato em degustação

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [desativacao-de-contrato-em-degustacao](https://www.developers.rbxsoft.com/v2/#desativacao-de-contrato-em-degustacao)

**Request:**

```json
{
   "temporary_plan_disable": {
      "id": 110
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Registry successfully disabled"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 6,
   "error_description": "The status of this record does not allow it to be disabled!",
   "result": ""
}
```

---

### Desbloqueio de contrato

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [desbloqueio-de-contrato](https://www.developers.rbxsoft.com/v2/#desbloqueio-de-contrato)

**Request:**

```json
{
   "contract_unblock": {
      "customer_id": 330593,
      "contract_id": 9121
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Successfully blocked uncontract"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 10,
   "error_description": "Invalid contract_id status. Must be Blocked!",
   "result": ""
}
```

---

### Exclusão do desconto promocional do contrato

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [exclusao-do-desconto-promocional-do-contrato](https://www.developers.rbxsoft.com/v2/#exclusao-do-desconto-promocional-do-contrato)

**Request:**

```json
{
   "promotional_contract_discount_delete": {
      "customer": 330624,
      "contract_number": 9626
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "",
   "error_description": "",
   "result": "Desconto promocional excluído com sucesso!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 12,
   "error_description": "Contrato não encontrado!",
   "result": ""
}
```

---

### Geração de contrato em html

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [geracao-de-contrato-em-html](https://www.developers.rbxsoft.com/v2/#geracao-de-contrato-em-html)

**Request:**

```json
{
   "contract_generate_html": {
      "customer_id": 330531,
      "contract_id": 9009,
      "contract_model_id": [
         14,
         17
      ],
      "generate_link": true
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
            "contract_model_id": 14,
            "contract_model_html": "PHA+PHN0cm9uZz5Gb3JtYXRh5+NvPC9zdHJvbmc+PGJyIC8+",
            "contract_link_download": "https://meurbx.com/routerbox/tmp/ctr_330531_9009_14_01042023120000_T73XZ80A.pdf"
        },
        {
            "contract_model_id": 17,
            "contract_model_html": "PHA+PHN0cm9uZz5Gb3JtYXRh5+NvPC9zdHJvbmc+PGJyIC8+",
            "contract_link_download": "https://meurbx.com/routerbox/tmp/ctr_330531_9009_17_01042023120000_T73XZ80F.pdf"
        }
    ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 14,
   "error_description": "The contract_id does not exists or not belongs to the customer_id!",
   "result": []
}
```

---

### Gestão de endereços dos contratos

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [gestao-de-enderecos-dos-contratos](https://www.developers.rbxsoft.com/v2/#gestao-de-enderecos-dos-contratos)

**Request:**

```json
{
   "contract_address": {
      "customer_id": 330624,
      "contract_id": 9626,
      "address": "Rua Presidente Nereu Ramos",
      "number": 102,
      "neighborhood": "Centro",
      "complement": "RBXSoft",
      "city_id": 4114807,
      "state": "PR",
      "zip_code": 86990000
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Addresses successfully included!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 27,
   "error_description": "The contract_id does not exist or not belongs to the customer_id!",
   "result": ""
}
```

---

### Inclusão de contrato

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [inclusao-de-contrato](https://www.developers.rbxsoft.com/v2/#inclusao-de-contrato)

**Request:**

```json
{
    "contract_insert": {
        "customer_id": 1023,
        "seller_name": "João da Silva",
        "type": "Plan",
        "plan_data": {
            "id": 45,
            "quantity": 2,
            "attach_package_id": "12",
            "qos_id": 3,
            "sla_id": 7,
            "group_contract": "yes",
            "bank_billing": 341,
            "bank_agreement": "123456",
            "additional_data": [
                {
                    "code": 10,
                    "content": "Instalação prioritária"
                },
                {
                    "code": 11,
                    "content": "Cliente VIP"
                }
            ],
            "online_signature": {
                "option": "required",
                "templates": "1,2,5"
            },
            "by_dealer_id": 58,
            "from_dealer_id": 12
        },
        "discount_value": 50.00,
        "duration": 12,
        "due_date_id": 3,
        "signature_date": "2025-10-29",
        "start_date": "2025-11-01",
        "signature": "yes",
        "generate_adhesion": {
            "installments": [
                {
                    "value": 100.00,
                    "due_date": "2025-11-10"
                },
                {
                    "value": 100.00,
                    "due_date": "2025-12-10"
                }
            ],
            "billet": "single_billet",
            "charge": "registered",
            "account_id": 1234,
            "historic_id": 56,
            "bank": 341,
            "bank_agreement": "123456",
            "accounting_launch": 789
        },
        "installation_address": {
            "country": "Brasil",
            "zipcode": "86990000",
            "street": "Rua das Flores",
            "number": 123,
            "neighborhood": "Centro",
            "additional_details": "Casa 2, portão azul",
            "state": "PR",
            "city": "101010",
            "maps_lat": -23.4842,
            "maps_lng": -51.7921,
            "billing_address": "no"
        },
        "billing_address": {
            "country": "Brasil",
            "zipcode": "86990001",
            "street": "Av. Brasil",
            "number": 500,
            "neighborhood": "Zona 1",
            "additional_details": "Apartamento 101",
            "state": "PR",
            "city": "101010",
            "maps_lat": -23.4850,
            "maps_lng": -51.7900
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
        "new_contracts": [
            {
                "id": 1014,
                "plan": 45
            }
        ]
    }
}
```

**Response (erro):**

```json
{
    "status": 0,
    "error_code": 1,
    "error_description": "Unidentified Package.",
    "result": ""
}
```

---

### Listagem de contratos em degustação

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [listagem-de-contratos-em-degustacao](https://www.developers.rbxsoft.com/v2/#listagem-de-contratos-em-degustacao)

**Request:**

```json
{
   "temporary_plan_list": {
      "start_period": "2023-04-01 12:00:00"
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
         "id": "8",
         "customer_id": "330531",
         "contract_id": "9009",
         "temporary_plan_id": "1",
         "start_period": "2023-04-01 12:00:00",
         "finish_period": "2023-04-30 23:59:59",
         "status": "scheduled"
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 5,
   "error_description": "You must inform one of the following fields: id or start_period!",
   "result": ""
}
```

---

### Motivos de transferência de contratos

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [motivos-de-transferencia-de-contratos](https://www.developers.rbxsoft.com/v2/#motivos-de-transferencia-de-contratos)

**Request:**

```json
{
   "reasons_for_transfer": {}
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
         "id": "1",
         "name": "Atualização do Contrato",
         "description": "Contrato será atualizado",
         "status": "A"
      },
      {
         "id": "2",
         "name": "Troca por Pacote",
         "description": "Cliente quer trocar um plano por um pacote",
         "status": "A"
      },
      {
         "id": "3",
         "name": "Redução de Custo",
         "description": "Cliente quer um plano mais barato",
         "status": "I"
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 12,
   "error_description": "Internal Server Error!",
   "result": ""
}
```

---

### Suspensão temporária de contrato

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [suspensao-temporaria-de-contrato](https://www.developers.rbxsoft.com/v2/#suspensao-temporaria-de-contrato)

**Request:**

```json
{
   "contract_suspend_temporary": {
      "customer_id": 5248,
      "contract_id": 6254,
      "duration": 30,
      "start_date": "2023-04-01",
      "user": "usuario",
      "ticket_id": 3265
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "The contract will be suspended on the date informed!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 20,
   "error_description": "This contract_id already has a temporary suspension scheduled!",
   "result": ""
}
```

---

### Transferência de contratos

- **Versão:** v2
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [transferencia-de-contratos](https://www.developers.rbxsoft.com/v2/#transferencia-de-contratos)

**Request:**

```json
{
   "contract_transfer": {
      "customer_id": "330593",
      "contract_id": "9141",
      "type": "plan",
      "new": {
         "seller_name": "João da Silva",
         "type": "plan",
         "plan_data": {
            "id": "1000946",
            "status": "active",
            "qos_id": "1",
            "sla_id": "1",
            "due_date_id": "1",
            "discount_vale": 9.99,
            "duration": 12,
            "promotional_discount_option": "keep",
            "online_signature": {
               "option": "required",
               "templates": [
                  "14"
               ]
            },
            "billing": {
               "keep": false,
               "future_cancel": true,
               "cancellation_period_action": "cancel"
            },
            "by_dealer_id": "10",
            "from_dealer_id": "10"
         }
      },
      "fine": {
         "account_id": "3",
         "historic_id": "1",
         "due_date": "2023-04-30"
      }
   }
}
```

**Response (ok):**

```json
{
   "contract_transfer": {
      "customer_id": "330593",
      "contract_id": "9142",
      "type": "plan",
      "new": {
         "seller_name": "João da Silva",
         "type": "package",
         "package_data": {
            "id": "2071",
            "qos_id": "1",
            "due_date_id": "1",
            "discount_vale": 10.99,
            "duration": 6,
            "promotional_discount_option": "new",
            "billing": {
               "keep": false,
               "future_cancel": true,
               "cancellation_period_action": "cancel"
            }
         }
      },
      "fine": {
         "account_id": "3",
         "historic_id": "1",
         "due_date": "2023-04-30"
      }
   }
}
```

**Response (erro):**

```json
{
   "contract_transfer": {
      "customer_id": "330593",
      "contract_id": "9121",
      "type": "package",
      "new": {
         "seller_name": "João da Silva",
         "type": "plan",
         "plan_data": {
            "id": "1000946",
            "qos_id": "1",
            "sla_id": "1",
            "due_date_id": "1",
            "discount_vale": 9.99,
            "duration": 12,
            "promotional_discount_option": "cancel",
            "billing": {
               "keep": false,
               "future_cancel": true,
               "cancellation_period_action": "cancel"
            }
         }
      },
      "fine": {
         "account_id": "3",
         "historic_id": "1",
         "due_date": "2023-04-30"
      }
   }
}
```

---
