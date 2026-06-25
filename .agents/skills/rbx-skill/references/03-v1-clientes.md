# RBX v1 — Clientes

Total: 15 endpoints

---

### Alteração de clientes

- **Versão:** v1
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [alteracao-de-clientes](https://www.developers.rbxsoft.com/index.html#alteracao-de-clientes)

**Request:**

```json
{
   "ClienteAlteracao": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "DadosCliente": {
         "Codigo": 41,
         "Nome": "João da Silva"
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
      "CodigoCliente": "41",
      "Mensagem": "Cliente alterado com sucesso"
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "erro_code": 4,
   "erro_inf": "",
   "erro_desc": "Codigo do inválido ",
   "erro_detail": "CodigoCliente",
   "result": ""
}
```

---

### Alteração de mercados

- **Versão:** v1
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [alteracao-de-mercados](https://www.developers.rbxsoft.com/index.html#alteracao-de-mercados)

**Request:**

```json
{
   "MercadoAlteracao": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "DadosMercado": {
         "Codigo": 1,
         "Nome": "João da Silva"
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
      "CodigoMercado": "1",
      "Mensagem": "Mercado alterado com sucesso"
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "erro_code": 4,
   "erro_inf": "",
   "erro_desc": "Codigo do inválido ",
   "erro_detail": "CodigoMercado",
   "result": ""
}
```

---

### Cadastro de clientes

- **Versão:** v1
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-clientes](https://www.developers.rbxsoft.com/index.html#cadastro-de-clientes)

**Request:**

```json
{
   "ClienteCadastro": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "DadosCliente": {
         "TipoPessoa": "F",
         "CPF": "607.942.320-00",
         "Nome": "João da Silva",
         "Endereco": "Rua Presidente Nereu Ramos",
         "EndNumero": "1001",
         "Bairro": "Centro",
         "CodMunicipio": "4114807",
         "UF": "PR",
         "CEP": "86990000",
         "TipoImpressao": "C",
         "Email": "joao.silva@provedor.com",
         "TipoAssinante": "3",
         "TipoConta": "POS",
         "DadosAdicionais": {
            "DadoAdicional": {
               "Codigo": "2",
               "Valor": "300"
            }
         },
         "Contatos": {
            "Contato": [
               {
                  "Nome": "Maria da Silva",
                  "Tipo": "G",
                  "Email": "maria.silva@provedor.com"
               },
               {
                  "Nome": "Carlos da Silva",
                  "Tipo": "G",
                  "Email": "carlos.silva@provedor.com"
               }
            ]
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
      "CodigoCliente": "330781",
      "Mensagem": "Cliente cadastrado com sucesso"
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "erro_code": 1,
   "erro_inf": "",
   "erro_desc": "Campo obrigatorio nao informado",
   "erro_detail": "TipoAssinante",
   "result": ""
}
```

---

### Cadastro de mercados

- **Versão:** v1
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-mercados](https://www.developers.rbxsoft.com/index.html#cadastro-de-mercados)

**Request:**

```json
{
   "MercadoCadastro": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "DadosMercado": {
         "TipoPessoa": "F",
         "CPF": "607.942.320-00",
         "Nome": "João da Silva",
         "Endereco": "Rua Presidente Nereu Ramos",
         "EndNumero": "1001",
         "Bairro": "Centro",
         "CodMunicipio": "4114807",
         "UF": "PR",
         "CEP": "86990000",
         "TipoImpressao": "C",
         "Email": "joao.silva@provedor.com",
         "TipoAssinante": "3",
         "TipoConta": "POS",
         "DadosAdicionais": {
            "DadoAdicional": {
               "Codigo": "2",
               "Valor": "300"
            }
         },
         "Contatos": {
            "Contato": [
               {
                  "Nome": "Maria da Silva",
                  "Tipo": "G",
                  "Email": "maria.silva@provedor.com"
               },
               {
                  "Nome": "Carlos da Silva",
                  "Tipo": "G",
                  "Email": "carlos.silva@provedor.com"
               }
            ]
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
      "CodigoMercado": "484",
      "Mensagem": "Mercado cadastrado com sucesso"
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "erro_code": 1,
   "erro_inf": "",
   "erro_desc": "Campo obrigatorio nao informado",
   "erro_detail": "TipoPessoa",
   "result": ""
}
```

---

### Consulta clientes

- **Versão:** v1
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-clientes](https://www.developers.rbxsoft.com/index.html#consulta-clientes)

**Request:**

```json
{
   "ConsultaClientes": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Codigo = '1'"
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
         "Tipo": "F",
         "CNPJ_CNPF": "71672194016",
         "Nome": "Cliente 01",
         "Endereco": "Rua Presidente Nereu Ramos",
         "Numero": "1001",
         "Complemento": "",
         "Bairro": "Centro",
         "Cidade": "Marialva",
         "Distrito": "",
         "UF": "PR",
         "CEP": "86990000",
         "TelComercial": "4432323232",
         "TelResidencial": "",
         "TelCelular": "44999998888",
         "BcoCobr": "9",
         "RG_IE": "",
         "Nascimento": "1990-01-01",
         "CodCobr": "",
         "Cobranca": "R",
         "TipoImpressao": "C",
         "DiaCobr": "0",
         "DiasProtesto": "0",
         "Sigla": "",
         "Cobr_Endereco": "",
         "Cobr_Complemento": "",
         "Cobr_Bairro": "",
         "Cobr_Cidade": "",
         "Cobr_UF": "",
         "Cobr_CEP": "",
         "Bloqueavel": "N",
         "Inclusao": "2023-12-01",
         "usuario": "joao.silva",
         "Observacoes": "Casa Azul.",
         "MapsMarkLat": "",
         "MapsMarkLng": "",
         "Grupo": "3",
         "Situacao": "A",
         "Email": "cliente01@email.com",
         "AvisoPagamento": "N"
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

### Consulta clientes bloqueados

- **Versão:** v1
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-clientes-bloqueados](https://www.developers.rbxsoft.com/index.html#consulta-clientes-bloqueados)

**Request:**

```json
{
   "ConsultaClientesBloqueados": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Nome = 'João da Silva'"
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
         "Codigo": "330593",
         "Nome": "João da Silva",
         "DataBloqueio": "2023-09-28 08:32:56",
         "DiasBloqueio": "68"
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

### Consulta clientes com redução de banda

- **Versão:** v1
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-clientes-com-reducao-de-banda](https://www.developers.rbxsoft.com/index.html#consulta-clientes-com-reducao-de-banda)

**Request:**

```json
{
   "ConsultaClientesReducao": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Cliente_Codigo = 1"
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
         "Regra": "3",
         "Cliente_Codigo": "1",
         "Cliente_Nome": "João da Silva",
         "Contrato_Numero": "123",
         "Contrato_Descricao": "Plano 500 MB"
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

### Consulta clientes on-line

- **Versão:** v1
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-clientes-on-line](https://www.developers.rbxsoft.com/index.html#consulta-clientes-on-line)

**Request:**

```json
{
   "ConsultaClienteOnline": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Codigo = '1'"
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
         "Nome": "João da Silva",
         "Online": "N",
         "NasConectados": ""
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

### Consulta complementos de contatos

- **Versão:** v1
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-complementos-de-contatos](https://www.developers.rbxsoft.com/index.html#consulta-complementos-de-contatos)

**Request:**

```json
{
   "ConsultaComplementoContatos": {
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
         "Tipo": "F",
         "Nome": "Filho(a)"
      },
      {
         "Codigo": "2",
         "Tipo": "J",
         "Nome": "Gerente"
      },
      {
         "Codigo": "3",
         "Tipo": "F",
         "Nome": "Esposo(a)"
      },
      {
         "Codigo": "4",
         "Tipo": "F",
         "Nome": "Mãe"
      },
      {
         "Codigo": "5",
         "Tipo": "F",
         "Nome": "Pai"
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

### Consulta contatos

- **Versão:** v1
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-contatos](https://www.developers.rbxsoft.com/index.html#consulta-contatos)

**Request:**

```json
{
   "ConsultaContatos": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Cliente = 1"
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
         "Id": "1",
         "Nome": "Contato Primário",
         "CPF": "",
         "Email": "",
         "Telefone1": "44999999999",
         "Telefone2": "",
         "Telefone3": "",
         "Aniversario": "",
         "Tipo": "G",
         "Situacao": "A",
         "Cliente": "1"
      },
      {
         "Id": "13",
         "Nome": "Contato Secundário",
         "CPF": "",
         "Email": "",
         "Telefone1": "44988888888",
         "Telefone2": "",
         "Telefone3": "",
         "Aniversario": "",
         "Tipo": "A",
         "Situacao": "A",
         "Cliente": "1"
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

### Consulta dados adicionais de clientes, contratos e atendimentos

- **Versão:** v1
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-dados-adicionais-de-clientes-contratos-e-atendimentos](https://www.developers.rbxsoft.com/index.html#consulta-dados-adicionais-de-clientes-contratos-e-atendimentos)

**Request:**

```json
{
   "ConsultarDadosAdicionais": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Tabela = 'Clientes' AND Chave = 9"
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
         "Id": "27",
         "Codigo": "1",
         "Descricao": "Clientes_Filial",
         "Tabela": "Clientes",
         "Chave": "9",
         "Valor": "201"
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

### Consulta dados de cobrança de clientes

- **Versão:** v1
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-dados-de-cobranca-de-clientes](https://www.developers.rbxsoft.com/index.html#consulta-dados-de-cobranca-de-clientes)

**Request:**

```json
{
      "ConsultaClientesCobranca": {
        "Autenticacao": {
          "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
        },
        "Filtro": "Nome = 'João da Silva'"
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
         "Codigo": "123",
         "Nome": "João da Silva",
         "BcoCobr": "748",
         "CodCobr": "",
         "Cobranca": "R",
         "TipoImpressao": "C",
         "DiaCobr": "10",
         "DiasProtesto": "0",
         "Cobr_Endereco": "",
         "Cobr_Complemento": "",
         "Cobr_Bairro": "",
         "Cobr_Cidade": "",
         "Cobr_UF": "",
         "Cobr_CEP": "",
         "Bloqueavel": "N"
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

### Consulta equipamentos on-line

- **Versão:** v1
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-equipamentos-on-line](https://www.developers.rbxsoft.com/index.html#consulta-equipamentos-on-line)

**Request:**

```json
{
   "ConsultaEquipamentosOnline": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Cliente_Codigo = '1'"
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
         "Cliente_Codigo": "1",
         "Cliente_Nome": "João da Silva",
         "Contrato_Numero": "123",
         "Contrato_Descricao": "PLANO 500 MB",
         "DataHora_UltimaColeta": "2024-01-20 12:00:00",
         "NAS_IP": "100.0.0.10",
         "NAS_Sigla": "NAS_PRINCIPAL",
         "NAS_Descricao": "NAS_PRINCIPAL",
         "NAS_Slot": "3",
         "NAS_Porta": "5",
         "Equipamento_Id": "1382",
         "Equipamento_Descricao": "COMPLEMENTO",
         "Equipamento_Serial": "1234567",
         "Equipamento_Sinal": "-29.00",
         "Equipamento_Txccq": "0",
         "Equipamento_MaxCpe": "0",
         "Equipamento_Temperatura": "46",
         "Equipamento_TempoConectadoMinutos": "10"
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

### Consulta grupos de clientes

- **Versão:** v1
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-grupos-de-clientes](https://www.developers.rbxsoft.com/index.html#consulta-grupos-de-clientes)

**Request:**

```json
{
   "ConsultaGruposCliente": {
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
         "Nome": "Grupo Residencial"
      },
      {
         "Codigo": "2",
         "Nome": "Grupo Corporativo"
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

### Consulta mercados

- **Versão:** v1
- **Grupo:** Clientes
- **HTTP:** `None None`
- **Anchor:** [consulta-mercados](https://www.developers.rbxsoft.com/index.html#consulta-mercados)

**Request:**

```json
{
   "ConsultaMercados": {
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
         "Tipo": "F",
         "CNPJ_CNPF": "43376452091",
         "Nome": "João da Silva",
         "Endereco": "",
         "Numero": "0",
         "Complemento": "",
         "Bairro": "",
         "Cidade": "Marialva",
         "Distrito": "",
         "UF": "PR",
         "CEP": "",
         "TelComercial": "",
         "TelResidencial": "",
         "TelCelular": "4499999999",
         "BcoCobr": "748",
         "RG_IE": "",
         "Nascimento": "",
         "CodCobr": "",
         "Cobranca": "R",
         "TipoImpressao": "B",
         "DiaCobr": "0",
         "DiasProtesto": "0",
         "Sigla": "",
         "Cobr_Endereco": "",
         "Cobr_Complemento": "",
         "Cobr_Bairro": "",
         "Cobr_Cidade": "",
         "Cobr_UF": "",
         "Cobr_CEP": "",
         "Bloqueavel": "N",
         "Inclusao": "2024-01-20",
         "usuario": "joao.silva",
         "Observacoes": "",
         "MapsMarkLat": "0.0000000000000",
         "MapsMarkLng": "0.0000000000000",
         "Grupo": "0"
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
