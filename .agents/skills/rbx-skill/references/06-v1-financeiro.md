# RBX v1 — Financeiro

Total: 7 endpoints

---

### Cadastro de notas fiscais

- **Versão:** v1
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-notas-fiscais](https://www.developers.rbxsoft.com/index.html#cadastro-de-notas-fiscais)

**Request:**

```json
{
   "NotasFiscaisCadastro": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "DadosNota": {
         "Nota": {
            "Cabecalho": {
               "CodigoCliente": "9",
               "Modelo": "21",
               "DataEmissao": "2023-12-01",
               "TipoUtilizacao": "4",
               "NaturezaOperacao": "Prestacao de Servicos de Comunicacao",
               "InformacoesAdicionais": "Informações adicionais da nota",
               "Situacao": "N"
            },
            "Itens": {
               "Item": {
                  "Codigo": "RBX2023",
                  "Descricao": "Descrição do item 1",
                  "CFOP": "5301",
                  "Unidade": "UN",
                  "Valor": "150.00",
                  "ICMSValorBaseCalculo": "100.00",
                  "ICMSValorAliquota": "10.00",
                  "ICMSCodigoReducaoBaseCalculo": "01",
                  "CodigoClassificacaoItem": "104"
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
   "erro_code": "",
   "erro_inf": "",
   "erro_desc": "",
   "erro_detail": "",
   "result": {
      "QuantidadeNotas": 1
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "erro_code": 98,
   "erro_inf": "Nota 1",
   "erro_desc": "Data de emissão menor que o permitido",
   "erro_detail": "",
   "result": ""
}
```

---

### Consulta cartões cadastrados

- **Versão:** v1
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [consulta-cartoes-cadastrados](https://www.developers.rbxsoft.com/index.html#consulta-cartoes-cadastrados)

**Request:**

```json
{
   "ConsultaCartoesCadastrados": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "TipoPessoa = 'C' AND CodigoPessoa = 1"
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
         "Id": "10",
         "TipoPessoa": "C",
         "CodigoPessoa": "1",
         "UltimosDigitos": "3180",
         "Bandeira": "M",
         "TipoCartao": "A",
         "CartaoPadrao": "N"
      },
      {
         "Id": "11",
         "TipoPessoa": "C",
         "CodigoPessoa": "1",
         "UltimosDigitos": "4876",
         "Bandeira": "M",
         "TipoCartao": "C",
         "CartaoPadrao": "N"
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

### Consulta ciclos de faturamento

- **Versão:** v1
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [consulta-ciclos-de-faturamento](https://www.developers.rbxsoft.com/index.html#consulta-ciclos-de-faturamento)

**Request:**

```json
{
   "ConsultaCiclosFaturamento": {
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
         "id": "1",
         "Dia": "1",
         "Vencimento": "1",
         "Situacao": "A",
         "Descricao": "01 a 31 / 01"
      },
      {
         "id": "2",
         "Dia": "1",
         "Vencimento": "5",
         "Situacao": "I",
         "Descricao": "01 a 31 / 05"
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

### Consulta documentos baixados

- **Versão:** v1
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [consulta-documentos-baixados](https://www.developers.rbxsoft.com/index.html#consulta-documentos-baixados)

**Request:**

```json
{
   "ConsultaDocumentosBaixados": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Movimento.Tipo = 'C' AND Movimento.Cliente = 10"
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
         "Sequencia": "138",
         "Tipo": "C",
         "Cobranca": "R",
         "CodigoPessoa": "10",
         "DocumentoPessoa": "43376452091",
         "NomePessoa": "João da Silva",
         "Conta": "3",
         "Historico": "Documento a Receber",
         "HistoricoBaixa": "",
         "ContaContrapartida": "0",
         "Documento": "106",
         "NossoNumero": "21200003",
         "Origem": "FAT",
         "Banco": "748",
         "Convenio": "2237",
         "Complemento": "Carnê 1",
         "DataLancamento": "2024-01-01",
         "DataVencimento": "2024-01-20",
         "DataBaixa": "2024-01-20",
         "Motivo": "PAGTO",
         "FormaPagto": "N",
         "ValorOriginal": "100.00",
         "ValorJuros": "0.00",
         "ValorMulta": "0.00",
         "ValorDesconto": "100.00",
         "ValorBaixado": "0.00",
         "UsuarioBaixa": "routerbox",
         "DataHoraExecucaoBaixa": "2024-01-20 12:00:00"
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

### Consulta documentos em aberto

- **Versão:** v1
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [consulta-documentos-em-aberto](https://www.developers.rbxsoft.com/index.html#consulta-documentos-em-aberto)

**Request:**

```json
{
   "ConsultaDocumentosAbertos": {
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
         "Conta": "3",
         "Vencimento": "2024-15-01",
         "Documento": "1000",
         "Historico": "Documento a Receber",
         "Complemento": "",
         "Origem": "FAT",
         "Valor": "100.00",
         "Tipo": "C",
         "CliFor": "1",
         "Nome": "João da Silva",
         "CPF_CNPJ": "60794232000",
         "Telefone1": "",
         "Telefone2": "",
         "Telefone3": "",
         "Convenio": "",
         "Banco": "748",
         "NossoNumero": "1000",
         "ContratosVinculados": "",
         "Sequencia": "12345",
         "RegistradoNoBanco": "N"
      },
      {
         "Conta": "3",
         "Vencimento": "2024-15-02",
         "Documento": "1001",
         "Historico": "Documento a Receber",
         "Complemento": "",
         "Origem": "FAT",
         "Valor": "100.00",
         "Tipo": "C",
         "CliFor": "1",
         "Nome": "João da Silva",
         "CPF_CNPJ": "60794232000",
         "Telefone1": "",
         "Telefone2": "",
         "Telefone3": "",
         "Convenio": "",
         "Banco": "748",
         "NossoNumero": "1001",
         "ContratosVinculados": "",
         "Sequencia": "12346",
         "RegistradoNoBanco": "N"
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

### Consulta grupos de cobrança

- **Versão:** v1
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [consulta-grupos-de-cobranca](https://www.developers.rbxsoft.com/index.html#consulta-grupos-de-cobranca)

**Request:**

```json
{
   "ConsultaGruposCobranca": {
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
         "Nome": "Grupo de Cobrança I"
      },
      {
         "Codigo": "2",
         "Nome": "Grupo de Cobrança II"
      },
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

### Consulta linha digitável do boleto

- **Versão:** v1
- **Grupo:** Financeiro
- **HTTP:** `None None`
- **Anchor:** [consulta-linha-digitavel-do-boleto](https://www.developers.rbxsoft.com/index.html#consulta-linha-digitavel-do-boleto)

**Request:**

```json
{
   "ConsultaLinhaDigitavelBoleto": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "DadosLinhaDigitavelEntrada": {
         "Tipo": "C",
         "CliFor": 1,
         "Documento": 12345
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
         "LinhaDigitavel": "74891.12347 02320.907239 21132.371060 1 95430000020000"
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
   "erro_desc": "Documento nao localizado",
   "erro_detail": "",
   "result": ""
}
```

---
