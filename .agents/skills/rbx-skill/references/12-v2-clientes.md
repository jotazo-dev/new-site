# RBX v2 — Clientes

Total: 14 endpoints

---

### Alteração de contatos

- **Versão:** v2
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [alteracao-de-contatos](https://www.developers.rbxsoft.com/v2/#alteracao-de-contatos)

**Request:**

```json
{
   "contact_update": {
      "contact_id": 221,
      "name": "João da Silva",
      "email": "joao.silva@provedor.com"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Contato atualizado com sucesso!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 9,
   "error_description": "Não foi encontrado um cliente vinculado ao contact_id informado!",
   "result": ""
}
```

---

### Alteração de grupo de clientes

- **Versão:** v2
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [alteracao-de-grupo-de-clientes](https://www.developers.rbxsoft.com/v2/#alteracao-de-grupo-de-clientes)

**Request:**

```json
{
    "client_group_update": {
        "group_id": 151,
        "name": "Grupo VIP",
        "description": "Clientes de alta prioridade",
        "priority": 1,
        "status": "A"
    }
}
```

**Response (ok):**

```json
{
    "status": 1,
    "error_code": 0,
    "error_description": "",
    "result": "Grupo de clientes alterado com sucesso"
}
```

**Response (erro):**

```json
{
    "status": 0,
    "error_code": 13,
    "error_description": "Não existe ClienteGrupo com o id informado",
    "result": []
}
```

---

### Cadastro de contatos

- **Versão:** v2
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-contatos](https://www.developers.rbxsoft.com/v2/#cadastro-de-contatos)

**Request:**

```json
{
   "contact_create": {
      "person_type": "C",
      "person_id": 330531,
      "name": "João da Silva",
      "document_number": "94983655042",
      "complement": 1,
      "email": "joao.silva@provedor.com",
      "phone_1": "4433221155",
      "phone_2": "",
      "phone_3": "",
      "birthday": "1989-12-20",
      "type": "G",
      "status": "A"
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
      "id": "231"
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 12,
   "error_description": "The field email is invalid!",
   "result": []
}
```

---

### Cadastro de grupo de clientes

- **Versão:** v2
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-grupo-de-clientes](https://www.developers.rbxsoft.com/v2/#cadastro-de-grupo-de-clientes)

**Request:**

```json
{
    "client_group_insert": {
        "name": "Grupo VIP",
        "description": "Clientes de alta prioridade",
        "priority": 1,
        "status": "A"
    }
}
```

**Response (ok):**

```json
{
    "status": 1,
    "error_code": 0,
    "error_description": "",
    "result": "Grupo de clientes cadastrado com sucesso"
}
```

**Response (erro):**

```json
{
    "status": 0,
    "error_code": 9,
    "error_description": "O campo 'status' é obrigatório e deve conter apenas os valores 'A' (Ativo) ou 'I' (Inativo)!",
    "result": []
}
```

---

### Cadastro de IP

- **Versão:** v2
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-ip](https://www.developers.rbxsoft.com/v2/#cadastro-de-ip)

**Request:**

```json
{
   "ip_insert": {
      "customer_id": 330593,
      "contract_id": 9121,
      "ipv4": {
         "ip_address": "10.10.10.20",
         "mask": "255.255.255.0",
         "gateway": "10.10.10.1"
      },
      "ipv6": {
         "ip_address_wan": "2023:2023:0:4::/64",
         "ip_address_delegated": "2023:db9:0:4::/64"
      },
      "mac": "1D:1D:1D:1D:1D:1D",
      "remote_mac": "1D:1D:1D:1D:1D:1D",
      "comments": "Texto livre",
      "status": "A"
   }
}
```

**Response (ok):**

```json
{
   "status": "1",
   "error_code": "",
   "error_description": "",
   "result": {
      "ip_id": "433"
   }
}
```

**Response (erro):**

```json
{
   "status": "0",
   "error_code": 16,
   "error_description": "O IP informado já existe para este contrato!",
   "result": {
      "ip_id": ""
   }
}
```

---

### Consulta assinante da Tip MVNO

- **Versão:** v2
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-assinante-da-tip-mvno](https://www.developers.rbxsoft.com/v2/#consulta-assinante-da-tip-mvno)

**Request:**

```json
{
    "tipmvno_get_customer": {
        "customer_id": 142
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
        "subscriber": [
            {
                "id": 13,
                "tip_customer_code": 33293,
                "tip_person_type": "F",
                "tip_person_name": "João da Silva",
                "tip_document_number": "94983655042",
                "insert_date": "2025-01-11 16:46:13",
                "contract_line": {
                    "id": 19,
                    "contract_id": 598,
                    "tip_contract_code": 724400041011093,
                    "tip_plan_code": 344,
                    "iccid": "xxxxxx89554000000410",
                    "msisdn": "55936185421",
                    "status": "C",
                    "insert_date": "2025-01-11 16:46:13",
                    "last_update": "2025-02-10 08:26:01",
                    "portability": [],
                    "recharge_avaliable": []
                },
                "recharge_purchase": []
            }
        ]
    }
}
```

**Response (erro):**

```json
{
    "status": 0,
    "error_code": 8,
    "error_description": "Unidentified client!",
    "result": []
}
```

---

### Consulta clientes enquadrados no Cobrador Virtual

- **Versão:** v2
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-clientes-enquadrados-no-cobrador-virtual](https://www.developers.rbxsoft.com/v2/#consulta-clientes-enquadrados-no-cobrador-virtual)

**Request:**

```json
{
   "virtual_collector_costumer_list": {
      "regra": [
         58
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
         "Regra": "58",
         "Prioridade": "3",
         "Atraso_Max": "155",
         "Atraso_Min": "1",
         "Clientes": [
            {
               "Codigo": 1,
               "Nome": "João da Silva",
               "Endereco": "Rua Presidente Nereu Ramos",
               "Numero": 102,
               "Bairro": "Centro",
               "Complemento": "",
               "Distrito": "",
               "Cidade": "Marialva",
               "UF": "PR",
               "TelComercial": "",
               "TelResidencial": "",
               "TelCelular": "",
               "Bloqueavel": "N",
               "Acessos": 44,
               "ContratoNumero": 75285,
               "Contrato": "75285-Plano 500MB"
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
   "error_code": 8,
   "error_description": "A regra informada não existe!",
   "result": []
}
```

---

### Consulta clientes on-line

- **Versão:** v2
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-clientes-on-line](https://www.developers.rbxsoft.com/v2/#consulta-clientes-on-line)

**Request:**

```json
{
   "get_online_customer": {
      "customer_id": 330074
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
         "session_id": "0106ab3f71AAABe7",
         "customer_id": "330074",
         "customer_name": "João da Silva",
         "contract_id": "5767",
         "plan_id": "1000942",
         "plan_description": "Ativo",
         "authentication_username": "joao.silva",
         "framed_ipv4_address": "100.76.32.32",
         "framed_ipv6_address": "2804:66ac:a1e6::/64",
         "delegated_ipv6_prefix": "2804:66ac:a169:4900::/56",
         "session_start_time": "2023-04-01 12:00:00",
         "session_up_time": "12:00:00",
         "nas_port_id": "3179109",
         "calling_station_id": "10:72:23:91:e1:19",
         "input_octets": 0,
         "output_octets": 0,
         "server": "1",
         "nas_ip_address": "100.100.100.100"
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 3,
   "error_description": "The field customer_id is invalid!",
   "result": ""
}
```

---

### Consulta dados adicionais

- **Versão:** v2
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-dados-adicionais](https://www.developers.rbxsoft.com/v2/#consulta-dados-adicionais)

**Request:**

```json
{
   "consult_additional_data": {
      "type": [
         "customer_market"
      ]
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
         "id": "3",
         "table": "Clientes",
         "complement": "Clientes_Filial",
         "complement_value": "201",
         "market_id": "1",
         "customer": "João da Silva"
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 4,
   "error_description": "type error - valores válidos de type são: customer_market, contracts, services, verifique o valor do campo",
   "result": ""
}
```

---

### Consulta equipamentos cadastrados nos clientes

- **Versão:** v2
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-equipamentos-cadastrados-nos-clientes](https://www.developers.rbxsoft.com/v2/#consulta-equipamentos-cadastrados-nos-clientes)

**Request:**

```json
{
   "get_equipment_customer": {
      "customer_id": 330531,
      "equipment_status": "active"
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
         "id": "1021",
         "customer_id": "330593",
         "customer_name": "João da Silva",
         "contract_id": "9122",
         "source": "C",
         "serial": "2020",
         "product_code": "010101",
         "activate_date": "2023-04-17",
         "deactivation_date": "",
         "deactivation_reason": "",
         "quantity": 1,
         "unit_price": 200,
         "total_price": 200,
         "controller_ip": "",
         "controller_port": "",
         "status": "active",
         "additional_data": []
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 8,
   "error_description": "The field equipment_status is invalid!",
   "result": ""
}
```

---

### Consulta saldo de dados da Tip MVNO

- **Versão:** v2
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-saldo-de-dados-da-tip-mvno](https://www.developers.rbxsoft.com/v2/#consulta-saldo-de-dados-da-tip-mvno)

**Request:**

```json
{
    "tipmvno_get_simcard_balance": {
        "customer_id": 142,
        "contract_line_id": 21
    }
}
```

**Response (ok):**

```json
{
    "balance": 3
}
```

**Response (erro):**

```json
{
    "status": 0,
    "error_code": 13,
    "error_description": "Unidentified Contract Line!",
    "result": []
}
```

---

### Desconectar clientes on-line

- **Versão:** v2
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [desconectar-clientes-on-line](https://www.developers.rbxsoft.com/v2/#desconectar-clientes-on-line)

**Request:**

```json
{
    "disconnect_online_customer": {
        "customer_id": 3,
        "server_id": 1,
        "nas_ip_address": "100.100.100.100",
        "session_id": "P002004010010358"
    }
}
```

**Response (ok):**

```json
{
    "status": 1,
    "error_code": "0",
    "error_description": "",
    "result": "Cliente desconectado com sucesso!"
}
```

**Response (erro):**

```json
{
    "status": 1,
    "error_code": "0",
    "error_description": "",
    "result": "Nenhuma conexão ativa foi encontrada com os dados fornecidos!"
}
```

---

### Exclusão de contatos

- **Versão:** v2
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [exclusao-de-contatos](https://www.developers.rbxsoft.com/v2/#exclusao-de-contatos)

**Request:**

```json
{
   "contact_delete": {
      "contact_id": 232
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Contato deletado com sucesso!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 9,
   "error_description": "Não existe um contato com o contact_id informado!",
   "result": ""
}
```

---

### Inserir recarga Tip MVNO

- **Versão:** v2
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [inserir-recarga-tip-mvno](https://www.developers.rbxsoft.com/v2/#inserir-recarga-tip-mvno)

**Request:**

```json
{
    "tipmvno_insert_recharge": {
        "customer_id": 142,
        "contract_line_id": 21,
        "recharge_id": 1
    }
}
```

**Response (ok):**

```json
{
    "recharge_purchase": {
        "id": 10,
        "banking_billet_id": 20,
        "value": 50.00,
        "due_date": "2025/11/10",
        "barcode": "12345678901234567890123456789012345678901234",
        "pix": "00020126580014br.gov.bcb.pix0136d4b5f1e3-5c7e-4c2e-8e3a-2f4b5c6d7e8f5204000053039865802BR5925João Testes6009Sao Paulo61080540900062070503***6304B14F"
    }
}
```

**Response (erro):**

```json
{
    "status": 0,
    "error_code": 13,
    "error_description": "Unidentified Contract Line!",
    "result": []
}
```

---
