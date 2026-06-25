# RBX v1 — Variados

Total: 8 endpoints

---

### Cadastro de pedidos

- **Versão:** v1
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-pedidos](https://www.developers.rbxsoft.com/index.html#cadastro-de-pedidos)

**Request:**

```json
{
   "PedidoCadastro": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "DadosPedido": {
         "Geral": {
            "Cliente": "6",
            "TipoCliente": "C",
            "CicloFat": "1",
            "Assinatura": "2023-12-01",
            "Vendedor": "joao.silva",
            "Usuario": "joao.silva"
         },
         "EnderecoInstalacao": {
            "Endereco": "Rua Presidente Nereu Ramos",
            "Numero": "1001",
            "Complemento": "",
            "Bairro": "Centro",
            "CodMunicipio": "4114807",
            "UF": "PR",
            "CEP": "86990000"
         },
         "EnderecoCobranca": {
            "Endereco": "Rua Presidente Nereu Ramos",
            "Numero": "1002",
            "Complemento": "",
            "Bairro": "Centro",
            "CodMunicipio": "4114807",
            "UF": "PR",
            "CEP": "86990000"
         },
         "Adesao": {
            "TipoPlano": "",
            "CodigoPlano": "1",
            "NroParcelas": "2",
            "FormaPagto": "",
            "Cobranca": "",
            "Conta": "3",
            "Historico": "1",
            "Banco": "104",
            "Convenio": "123456",
            "PreLancamentoContabil": "",
            "Parcelas": {
               "Parcela": [
                  {
                     "Descricao": "Parcelas Pedido 001",
                     "Vencimento": "2023-12-10",
                     "Valor": "50.00"
                  },
                  {
                     "Descricao": "Parcelas Pedido 001",
                     "Vencimento": "2024-01-10",
                     "Valor": "50.00"
                  }
               ]
            }
         },
         "Itens": {
            "ItemP": {
               "Tipo": "P",
               "Codigo": "1",
               "InicioCobranca": "2023-12-01",
               "AgruparCobranca": "S",
               "DescPromoPrazo": "12",
               "DescPromoValor": -20,
               "DescPromoDesc": "DESCONTO PROMOCIONAL"
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
   "erro_code": "",
   "erro_inf": "",
   "erro_desc": "",
   "erro_detail": "",
   "result": {
      "NumeroPedido": "1576",
      "Mensagem": "Pedido cadastrado com sucesso"
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "erro_code": 135,
   "erro_inf": "",
   "erro_desc": "Adesao - nenhuma parcela informada",
   "erro_detail": "",
   "result": ""
}
```

---

### Consulta dados adicionais

- **Versão:** v1
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [consulta-dados-adicionais](https://www.developers.rbxsoft.com/index.html#consulta-dados-adicionais)

**Request:**

```json
{
   "ConsultaDadosAdicionais": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      }
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "erro_code": "",
   "erro_inf": "",
   "erro_desc": "",
   "erro_detail": "",
   "result": [
      {
         "Codigo": "1",
         "Tabela": "Contratos",
         "Nome": "Número de Controle do VSC"
      },
      {
         "Codigo": "2",
         "Tabela": "Clientes",
         "Nome": "Clientes_Filial"
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "erro_code": 97,
   "erro_inf": "",
   "erro_desc": "Erro de integracao",
   "erro_detail": "Chave de integracao invalida ou inativa",
   "result": ""
}
```

---

### Consulta eventos do FailOver

- **Versão:** v1
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [consulta-eventos-do-failover](https://www.developers.rbxsoft.com/index.html#consulta-eventos-do-failover)

**Request:**

```json
{
   "FailOverEvents": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Type = 'LINK'"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "erro_code": "",
   "erro_inf": "",
   "erro_desc": "",
   "erro_detail": "",
   "result": [
      {
         "Id": "151",
         "Host": "100.0.0.1",
         "Type": "LINK",
         "Server": "1",
         "AffectedCustomers": "-1",
         "DownTime": "2023-08-10 10:03:03",
         "UpTime": "2023-08-10 10:04:01",
         "Status": "C",
         "Source": "A",
         "Description": "Teste do failover",
         "Duration": "",
         "Cause": "",
         "Solution": ""
      },
      {
         "Id": "152",
         "Host": "100.0.0.2",
         "Type": "LINK",
         "Server": "1",
         "AffectedCustomers": "-1",
         "DownTime": "2023-08-14 14:29:04",
         "UpTime": "2023-08-14 14:30:01",
         "Status": "C",
         "Source": "A",
         "Description": "Teste do failover",
         "Duration": "",
         "Cause": "",
         "Solution": ""
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "erro_code": 1,
   "erro_inf": "",
   "erro_desc": "A consulta nao retornou resultados",
   "erro_detail": "",
   "result": ""
}
```

---

### Consulta fornecedores

- **Versão:** v1
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [consulta-fornecedores](https://www.developers.rbxsoft.com/index.html#consulta-fornecedores)

**Request:**

```json
{
   "ConsutaFornecedores": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Codigo = 1"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "erro_code": "",
   "erro_inf": "",
   "erro_desc": "",
   "erro_detail": "",
   "result": [
      {
         "Codigo": "1",
         "Tipo": "J",
         "CNPJ_CNPF": "08064005000190",
         "Nome": "CIELO S.A.",
         "Endereco": "Alameda Xingu",
         "Numero": "512",
         "Complemento": "ANDAR 21 AO 31",
         "Bairro": "Alphaville Centro Industrial e Empresarial/Alphaville.",
         "Cidade": "Barueri",
         "UF": "SP",
         "CEP": "06455030",
         "Telefone1": "11999999999",
         "Telefone2": "",
         "TelFax": "",
         "RG_IE": "",
         "Sigla": "",
         "Inclusao": "2020-07-04",
         "Usuario": "usuario",
         "Situacao": "A",
         "Observacoes": ""
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "erro_code": 1,
   "erro_inf": "",
   "erro_desc": "A consulta nao retornou resultados",
   "erro_detail": "",
   "result": ""
}
```

---

### Consulta planos

- **Versão:** v1
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [consulta-planos](https://www.developers.rbxsoft.com/index.html#consulta-planos)

**Request:**

```json
{
   "ConsultaPlanos": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      }
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "erro_code": "",
   "erro_inf": "",
   "erro_desc": "",
   "erro_detail": "",
   "result": [
      {
         "Codigo": "1",
         "Descricao": "Plano 100MB",
         "Grupo": "0"
      },
      {
         "Codigo": "2",
         "Descricao": "Plano 200MB",
         "Grupo": "0"
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "erro_code": 97,
   "erro_inf": "",
   "erro_desc": "Erro de integracao",
   "erro_detail": "Chave de integracao invalida ou inativa",
   "result": ""
}
```

---

### Consulta QoS

- **Versão:** v1
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [consulta-qos](https://www.developers.rbxsoft.com/index.html#consulta-qos)

**Request:**

```json
{
   "ConsultaQoS": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      }
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "erro_code": "",
   "erro_inf": "",
   "erro_desc": "",
   "erro_detail": "",
   "result": [
      {
         "Codigo": "1",
         "Descricao": "Limitação Padrão"
      },
      {
         "Codigo": "2",
         "Descricao": "RBX Acelerado - 200%"
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "erro_code": 97,
   "erro_inf": "",
   "erro_desc": "Erro de integracao",
   "erro_detail": "Chave de integracao invalida ou inativa",
   "result": ""
}
```

---

### Consulta status do NAS

- **Versão:** v1
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [consulta-status-do-nas](https://www.developers.rbxsoft.com/index.html#consulta-status-do-nas)

**Request:**

```json
{
   "ConsultaStatusNAS": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Online = 'N'"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "erro_code": "",
   "erro_inf": "",
   "erro_desc": "",
   "erro_detail": "",
   "result": [
      {
         "IPInterno": "100.0.0.10",
         "Online": "N"
      },
      {
         "IPInterno": "100.0.0.11",
         "Online": "N"
      },
      {
         "IPInterno": "100.0.0.12",
         "Online": "N"
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "erro_code": 1,
   "erro_inf": "",
   "erro_desc": "A consulta nao retornou resultados",
   "erro_detail": "",
   "result": ""
}
```

---

### Consulta usuários do sistema

- **Versão:** v1
- **Grupo:** Variados
- **HTTP:** `None None`
- **Anchor:** [consulta-usuarios-do-sistema](https://www.developers.rbxsoft.com/index.html#consulta-usuarios-do-sistema)

**Request:**

```json
{
   "ConsultaUsuarios": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      }
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "erro_code": "",
   "erro_inf": "",
   "erro_desc": "",
   "erro_detail": "",
   "result": [
      {
         "Usuario": "user01",
         "Situacao": "A",
         "Email": "user01@email.com"
      },
      {
         "Usuario": "user02",
         "Situacao": "A",
         "Email": ""
      },
      {
         "Usuario": "user03",
         "Situacao": "A",
         "Email": ""
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "erro_code": 97,
   "erro_inf": "",
   "erro_desc": "Erro de integracao",
   "erro_detail": "Chave de integracao invalida ou inativa",
   "result": ""
}
```

---
