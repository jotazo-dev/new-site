# RBX v1 — Contratos

Total: 4 endpoints

---

### Consulta concorrência

- **Versão:** v1
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [consulta-concorrencia](https://www.developers.rbxsoft.com/index.html#consulta-concorrencia)

**Request:**

```json
{
   "ConsultaConcorrencia": {
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
         "Nome": "VIVO"
      },
      {
         "id": "2",
         "Nome": "Claro"
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

### Consulta contratos

- **Versão:** v1
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [consulta-contratos](https://www.developers.rbxsoft.com/index.html#consulta-contratos)

**Request:**

```json
{
   "ConsultaContratos": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Plano_Codigo = '1'"
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
         "Numero": "292",
         "Plano_Codigo": "1",
         "Plano_Descricao": "Plano 200 MB",
         "Pacote_Codigo": "0",
         "Pacote_Descricao": "",
         "Pacote_PacoteID": "",
         "Situacao_Codigo": "A",
         "Situacao_Descricao": "Ativo",
         "Modelos_Contrato": "",
         "Assinatura": "2023-01-24",
         "Inicio": "2023-05-12",
         "DataUltimaOperacao": "",
         "CicloFaturamento_DiaBase": "1",
         "CicloFaturamento_Vencimento": "10",
         "ValorBruto": "25.00",
         "DescontoFixo": "0.00",
         "ValorLiquido": "25.00",
         "DescontoPromocional_Valor": "0.00",
         "DescontoPromocional_Prazo": "0",
         "Vigencia": "0",
         "Agrupamento": "Nao",
         "Assinado": "Nao",
         "EnderecoCobranca_Logradouro": "",
         "EnderecoCobranca_Numero": "",
         "EnderecoCobranca_Complemento": "",
         "EnderecoCobranca_Bairro": "",
         "EnderecoCobranca_Cidade": "",
         "EnderecoCobranca_UF": "",
         "EnderecoCobranca_CEP": "",
         "EnderecoCobranca_Pais": "",
         "EnderecoCobranca_LocalidadeId": "",
         "EnderecoCobranca_BairroId": "",
         "EnderecoCobranca_LogradouroId": "",
         "EnderecoCobranca_GoogleMapsPlaceId": "",
         "EnderecoCobranca_Latitude": "",
         "EnderecoCobranca_Longitude": "",
         "EnderecoInstalacao_UsadoParaCobranca": "",
         "EnderecoInstalacao_Logradouro": "",
         "EnderecoInstalacao_Numero": "",
         "EnderecoInstalacao_Complemento": "",
         "EnderecoInstalacao_Bairro": "",
         "EnderecoInstalacao_Cidade": "",
         "EnderecoInstalacao_UF": "",
         "EnderecoInstalacao_CEP": "",
         "EnderecoInstalacao_Pais": "",
         "EnderecoInstalacao_LocalidadeId": "",
         "EnderecoInstalacao_BairroId": "",
         "EnderecoInstalacao_LogradouroId": "",
         "EnderecoInstalacao_GoogleMapsPlaceId": "",
         "EnderecoInstalacao_Latitude": "",
         "EnderecoInstalacao_Longitude": "",
         "Vendedor": "Maria",
         "Adesao_Valor": "0.00",
         "Cliente_Tipo": "F",
         "Cliente_CPF_CNPJ": "43376452091",
         "Cliente_Tel_Comercial": "",
         "Cliente_Tel_Residencial": "",
         "Cliente_Tel_Celular": "",
         "Cliente_RG_IE": "",
         "Cliente_Sigla": "",
         "Cliente_Bloqueavel": "N",
         "Aceite_Eletronico": "N",
         "Aceite_Eletronico_Data": "",
         "Aceite_Eletronico_IP": "",
         "Aceite_Eletronico_Origem": "",
         "Plano_Valor": "25.00",
         "Plano_Tipo": "T",
         "Cliente_Email": "joao.silva@provedor.com",
         "Cliente_Grupo": "(SEM GRUPO)",
         "Cancelamento_Motivo": "",
         "Cancelamento_Concorrencia": "",
         "Ultima_Operacao_Usuario": "",
         "Data_Validade": "2023-01-24",
         "Vigencia_Situacao": "Vencido",
         "Qtde_Dias_Vencido": "354",
         "Cancelamento_Agendado_Data": "",
         "Cancelamento_Agendado_Registro": "",
         "Cancelamento_Agendado_Usuario": "",
         "SLA": "",
         "QoS": "",
         "Tecnologia": ""
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

### Consulta contratos bloqueados

- **Versão:** v1
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [consulta-contratos-bloqueados](https://www.developers.rbxsoft.com/index.html#consulta-contratos-bloqueados)

**Request:**

```json
{
   "ConsultaContratosBloqueados": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Cliente_Nome = 'João da Silva'"
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
         "Contrato_Numero": "123",
         "Contrato_Descricao": "Plano 500MB",
         "Contrato_Bloqueio": "2024-01-10",
         "Contrato_Bloqueio_Usuario": "usuario",
         "Cliente_Codigo": "1",
         "Cliente_Nome": "João da Silva"
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

### Consulta motivos de cancelamento

- **Versão:** v1
- **Grupo:** Contratos
- **HTTP:** `None None`
- **Anchor:** [consulta-motivos-de-cancelamento](https://www.developers.rbxsoft.com/index.html#consulta-motivos-de-cancelamento)

**Request:**

```json
{
   "ConsultaMotivosCancelamento": {
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
         "Nome": "Cobrador Virtual"
      },
      {
         "id": "2",
         "Nome": "Insatisfação"
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
