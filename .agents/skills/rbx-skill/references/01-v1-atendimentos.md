# RBX v1 — Atendimentos

Total: 8 endpoints

---

### Cadastro de atendimentos

- **Versão:** v1
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-atendimentos](https://www.developers.rbxsoft.com/index.html#cadastro-de-atendimentos)

**Request:**

```json
{
   "AtendimentoCadastro": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "DadosAtendimento": {
         "Data_Abertura": "2023-12-01",
         "Hora_Abertura": "10:00:00",
         "Iniciativa": "C",
         "Modo": "T",
         "TipoCliente": "C",
         "Cliente": "1",
         "Contrato": "7480",
         "Contato": "",
         "Prioridade": "1",
         "Situacao": "A",
         "Tipo": "T",
         "Topico": "2",
         "Assunto": "Sem internet",
         "Usuario_Abertura": "joao.silva"
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
      "NumeroAtendimento": "2382854",
      "SLA": "600",
      "SLA_Tipo": "C",
      "Mensagem": "Atendimento cadastrado com sucesso"
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "erro_code": 223,
   "erro_inf": "",
   "erro_desc": "Campo Estimulo_Marketing so pode ser informado para atendimentos do tipo Comercial",
   "erro_detail": "",
   "result": ""
}
```

---

### Consulta atendimentos

- **Versão:** v1
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [consulta-atendimentos](https://www.developers.rbxsoft.com/index.html#consulta-atendimentos)

**Request:**

```json
{
   "ConsultaAtendimentos": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Atendimentos.Cliente = '10'"
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
         "Numero": "446",
         "Protocolo": "2023000000000446",
         "Abertura_DataHora": "2024-01-20 00:03:09",
         "Abertura_Usuario": "routerbox",
         "Designacao_Tipo": "usuario",
         "Designacao_Usuario": "joao.silva",
         "Designacao_Grupo_Id": "0",
         "Designacao_Grupo_Nome": "",
         "Situacao_OS": "",
         "Topico": "(Retirar Equipam) Retirar Equipamento",
         "Assunto": "Retirar equipamento do cliente.",
         "Solucao": "",
         "Encerramento_DataHora": "",
         "Causa": "",
         "Tipo": "T",
         "TipoCliente": "C",
         "CodigoCliente": "10"
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

### Consulta causas de atendimentos

- **Versão:** v1
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [consulta-causas-de-atendimentos](https://www.developers.rbxsoft.com/index.html#consulta-causas-de-atendimentos)

**Request:**

```json
{
   "ConsultaCausas": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Tipo = 'T'"
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
         "Codigo": "2",
         "Tipo": "T",
         "Nome": "Instalação OK",
         "Descricao": "Instalado com Sucesso",
         "Situacao": "A"
      },
      {
         "Codigo": "3",
         "Tipo": "T",
         "Nome": "Configuração OK",
         "Descricao": "Configurado com sucesso",
         "Situacao": "A"
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

### Consulta checklist de atendimentos

- **Versão:** v1
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [consulta-checklist-de-atendimentos](https://www.developers.rbxsoft.com/index.html#consulta-checklist-de-atendimentos)

**Request:**

```json
{
   "ConsultaChecklistAtendimentos": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Checklist_Descricao = 'Validação de cadastro'"
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
         "Atendimento_Numero": "405",
         "Checklist_Id": "1",
         "Checklist_Descricao": "Validação de cadastro",
         "Checklist_Obrigatorio": "N",
         "Checklist_Status": "S"
      },
      {
         "Atendimento_Numero": "407",
         "Checklist_Id": "2",
         "Checklist_Descricao": "Validação de cadastro",
         "Checklist_Obrigatorio": "N",
         "Checklist_Status": "N"
      },
      {
         "Atendimento_Numero": "415",
         "Checklist_Id": "3",
         "Checklist_Descricao": "Validação de cadastro",
         "Checklist_Obrigatorio": "N",
         "Checklist_Status": "N"
      },
      {
         "Atendimento_Numero": "457",
         "Checklist_Id": "4",
         "Checklist_Descricao": "Validação de cadastro",
         "Checklist_Obrigatorio": "N",
         "Checklist_Status": "N"
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

### Consulta fluxos de atendimentos

- **Versão:** v1
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [consulta-fluxos-de-atendimentos](https://www.developers.rbxsoft.com/index.html#consulta-fluxos-de-atendimentos)

**Request:**

```json
{
   "ConsultaFluxos": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Situacao = 'A'"
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
         "Descricao": "Atendimento ao Cliente",
         "Planos": "",
         "GruposClientes": "",
         "GruposUsuarios": "",
         "Situacao": "A"
      },
      {
         "Codigo": "2",
         "Descricao": "Pendências Financeiras",
         "Planos": "",
         "GruposClientes": "",
         "GruposUsuarios": "",
         "Situacao": "A"
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

### Consulta grupos de SLA

- **Versão:** v1
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [consulta-grupos-de-sla](https://www.developers.rbxsoft.com/index.html#consulta-grupos-de-sla)

**Request:**

```json
{
   "ConsultaGruposSLA": {
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
         "Codigo": "-1",
         "Descricao": "SLA Padrão",
         "Situacao": "A"
      },
      {
         "Codigo": "1",
         "Descricao": "SLA Avançado",
         "Situacao": "A"
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

### Consulta ocorrências de atendimentos

- **Versão:** v1
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [consulta-ocorrencias-de-atendimentos](https://www.developers.rbxsoft.com/index.html#consulta-ocorrencias-de-atendimentos)

**Request:**

```json
{
   "ConsultaOcorrenciasAtendimentos": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Atendimento = 2"
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
         "Id": "2",
         "Data": "2024-01-20 10:00:00",
         "Descricao": "Abertura de atendimento via central do assinante mobile",
         "Modo": "A",
         "Usuario": "routerbox",
         "Latitude": "",
         "Longitude": "",
         "Atendimento_Numero": "2"
      },
      {
         "Id": "5",
         "Data": "2024-01-20 10:01:00",
         "Descricao": "Inclusão de anexo",
         "Modo": "A",
         "Usuario": "joao.silva",
         "Latitude": "",
         "Longitude": "",
         "Atendimento_Numero": "2"
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

### Consulta tópicos de atendimentos

- **Versão:** v1
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [consulta-topicos-de-atendimentos](https://www.developers.rbxsoft.com/index.html#consulta-topicos-de-atendimentos)

**Request:**

```json
{
   "ConsultaTopicos": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Tipo = 'T'"
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
         "Codigo": "2",
         "Tipo": "T",
         "Nome": "Nova Instalação",
         "Descricao": "Nova Instalação",
         "Central": "N",
         "Abertura": "T",
         "Situacao": "A"
      },
      {
         "Codigo": "3",
         "Tipo": "T",
         "Nome": "Alterar Senha",
         "Descricao": "Solicitação de Alteração de Senha",
         "Central": "N",
         "Abertura": "T",
         "Situacao": "A"
      },
      {
         "Codigo": "4",
         "Tipo": "T",
         "Nome": "Dados Cadastrais",
         "Descricao": "Solicitação de Alteração Cadastral",
         "Central": "S",
         "Abertura": "T",
         "Situacao": "A"
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
