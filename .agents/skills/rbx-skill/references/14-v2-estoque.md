# RBX v2 — Estoque

Total: 7 endpoints

---

### Alocação de equipamento em comodato

- **Versão:** v2
- **Grupo:** Estoque
- **HTTP:** `None None`
- **Anchor:** [alocacao-de-equipamento-em-comodato](https://www.developers.rbxsoft.com/v2/#alocacao-de-equipamento-em-comodato)

**Request:**

```json
{
   "equipment_lending": {
      "product_id": 122,
      "customer_id": 658,
      "contract_id": 1548,
      "activation_date": "2023-04-01",
      "quantity": 1,
      "location_id": 5,
      "serial_number": "XTS5487",
      "complementary_fields": [
         {
            "name": "modelo",
            "value": "21"
         },
         {
            "name": "cor",
            "value": "preto"
         }
      ],
      "provisioning": {
         "controller_id": 17,
         "controller_port_id": 18,
         "onu_id": 8,
         "scripts": [
            12,
            15,
            17
         ],
         "authentication_id": 2,
         "ip_id": 7
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
      "equipament_id": 1254,
      "produt_movement_id": 62457
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 15,
   "error_description": "There is no balance available on the informed lease",
   "result": ""
}
```

---

### Cadastro de produtos

- **Versão:** v2
- **Grupo:** Estoque
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-produtos](https://www.developers.rbxsoft.com/v2/#cadastro-de-produtos)

**Request:**

```json
{
   "inventory_insert": {
      "company_id": 5,
      "code": 1,
      "description": "Monitor LED",
      "model_id": 10,
      "serial_controlled": true,
      "unit_id": 5,
      "sale_price": 500.25,
      "text": "",
      "allow_discount": true,
      "accounting_number": "",
      "minimum_quantity": 10.5,
      "quantity_per_lot": 100.25,
      "operation_type_workforce": "consumption",
      "ncm": 85282100,
      "ean": "",
      "ean_trib": "",
      "ex_tipi": "",
      "efd_icms_ipi_item": "",
      "allows_movement": true,
      "status": "A",
      "tax_group_id": null,
      "invoice": {
         "nfe_oper_venda": {
            "id_nat_oper": 3,
            "cod_benef_fiscal": "PR000001",
            "cest": "",
            "cfop": 5949,
            "tipo_valor_item": "B",
            "informacoes_adicionais": "",
            "icms": {
               "cst": "00",
               "csosn": "100",
               "origem": "0",
               "mod_base_calc": "0",
               "perc_red_base_calc": 10.21,
               "valor_base_calc": 100,
               "aliquota": 10.15,
               "valor": 10,
               "aliquota_calculo_credito": 1.25,
               "valor_credito": 100.25,
               "st": {
                  "mod_base_calc": "0",
                  "perc_margem_valor_adic": 15.15,
                  "perc_reducao_base_calc": 10.21,
                  "valor_base_calc": 100,
                  "aliquota": 10.15,
                  "valor": 10.15
               }
            },
            "ipi": {
               "sit_trib": "00",
               "cod_enq": "aaa",
               "cod_selo": "",
               "qtde_selo": 1,
               "tipo_calculo": "P",
               "valor_base_calc": 100,
               "aliquota": 10.15,
               "quantidade": null,
               "valor_unitario": null
            },
            "pis": {
               "sit_trib": "01",
               "tipo_calculo": "P",
               "valor_base_calc": 100,
               "aliquota": 10.15,
               "quantidade": null,
               "valor": null,
               "st": {
                  "tipo_calculo": "P",
                  "valor_base_calc": 100,
                  "aliquota": 10.15,
                  "quantidade": null,
                  "valor": null
               }
            },
            "cofins": {
               "sit_trib": "01",
               "tipo_calculo": "P",
               "valor_base_calc": 100,
               "aliquota": 10.15,
               "quantidade": null,
               "valor": null,
               "st": {
                  "tipo_calculo": "P",
                  "valor_base_calc": 100,
                  "aliquota": 10.15,
                  "quantidade": null,
                  "valor": null
               }
            }
         }
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
      "id": 280
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 90,
   "error_description": "There is already a inventory registered with this code!",
   "result": ""
}
```

---

### Cadastro de locações de estoque

- **Versão:** v2
- **Grupo:** Estoque
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-locacoes-de-estoque](https://www.developers.rbxsoft.com/v2/#cadastro-de-locacoes-de-estoque)

**Request:**

```json
{
   "inventory_location_insert": {
      "id": 1,
      "description": "Prédio Azul",
      "linked_person": {
         "type": "customer",
         "id": 1
      },
      "status": "A",
      "linked_user": "joaosilva"
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
      "id": 999
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 23,
   "error_description": "This user has already been linked to another location. Only one is allowed per user!",
   "result": ""
}
```

---

### Cadastro de modelos de produto

- **Versão:** v2
- **Grupo:** Estoque
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-modelos-de-produto](https://www.developers.rbxsoft.com/v2/#cadastro-de-modelos-de-produto)

**Request:**

```json
{
   "inventory_product_model_insert": {
      "description": "Monitor LCD",
      "type_id": 1,
      "brand": "LG",
      "image": {
         "name": "imagem.png",
         "content": "RXhlbXBsbyBkZSBjb250ZcO6ZG8gY29udmVydGlkbyBlbSBiYXNlNjQ="
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
      "model_id": 275,
      "created_file_name": ""
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 18,
   "error_description": "There is already a model of product registered with this description!",
   "result": ""
}
```

---

### Cadastro de tipos de produto

- **Versão:** v2
- **Grupo:** Estoque
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-tipos-de-produto](https://www.developers.rbxsoft.com/v2/#cadastro-de-tipos-de-produto)

**Request:**

```json
{
   "inventory_product_type_insert": {
      "description": "monitores",
      "accept_provisioning_scripts": true,
      "complementary_fields": [
         {
            "name": "cor",
            "required": true
         },
         {
            "name": "tamanho",
            "required": true
         }
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
   "result": {
      "type_id": 8
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 14,
   "error_description": "There is already a type of product registered with this description!",
   "result": ""
}
```

---

### Desativação de equipamento em comodato

- **Versão:** v2
- **Grupo:** Estoque
- **HTTP:** `None None`
- **Anchor:** [desativacao-de-equipamento-em-comodato](https://www.developers.rbxsoft.com/v2/#desativacao-de-equipamento-em-comodato)

**Request:**

```json
{
   "equipment_lending_disable": {
      "equipment_id": 1254,
      "customer_id": 658,
      "contract_id": 1548,
      "disable_date": "2023-04-01",
      "reason": "cancellation",
      "location_id": 5,
      "open_ticket_to_remove_from_network": false,
      "user_stock_request": "usuario"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Equipment successfully disabled!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 24,
   "error_description": "Required field not informed: Stock Requisition User",
   "result": ""
}
```

---

### Movimentação avulsa de estoque

- **Versão:** v2
- **Grupo:** Estoque
- **HTTP:** `None None`
- **Anchor:** [movimentacao-avulsa-de-estoque](https://www.developers.rbxsoft.com/v2/#movimentacao-avulsa-de-estoque)

**Request:**

```json
{
   "inventory_movement": {
      "product_id": 1254,
      "operation_type": "input",
      "location_id_source": 10,
      "quantity": 2,
      "unit_cost": 10.5,
      "invoice_series": 157,
      "invoice_number": 12546587,
      "serial": [
         {
            "value": "CFD21458",
            "complementary_fields": [
               {
                  "name": "modelo",
                  "value": "B1"
               },
               {
                  "name": "cor",
                  "value": "azul"
               }
            ]
         },
         {
            "value": "CFD31648",
            "complementary_fields": [
               {
                  "name": "modelo",
                  "value": "B1"
               },
               {
                  "name": "cor",
                  "value": "preto"
               }
            ]
         }
      ],
      "datetime": "2023-04-01 12:00:00"
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
      "Successfully included move"
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 3,
   "error_description": "The reported product does not exist or is not active",
   "result": []
}
```

---
