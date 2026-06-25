# RBX v1 — Autenticações

Total: 2 endpoints

---

### Consulta autenticações de clientes

- **Versão:** v1
- **Grupo:** Autenticações
- **HTTP:** `None None`
- **Anchor:** [consulta-autenticacoes-de-clientes](https://www.developers.rbxsoft.com/index.html#consulta-autenticacoes-de-clientes)

**Request:**

```json
{
      "ConsultaAutenticacao": {
        "Autenticacao": {
          "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
        },
        "Filtro": "Cliente = '1'"
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
         "Cliente": "1",
         "Contrato": "1",
         "NAS": "(CENTRAL ASSINANTE)",
         "Porta": "(TODAS)",
         "Usuario": "cliente01",
         "MAC": "",
         "Observacao": ""
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

### Consulta autenticações de clientes (Com senha)

- **Versão:** v1
- **Grupo:** Autenticações
- **HTTP:** `None None`
- **Anchor:** [consulta-autenticacoes-de-clientes-com-senha](https://www.developers.rbxsoft.com/index.html#consulta-autenticacoes-de-clientes-com-senha)

**Request:**

```json
{
   "ConsultaAutenticacaoSenha": {
      "Autenticacao": {
         "ChaveIntegracao": "UAHS531AUSHUQ727182HNUHE18H37H"
      },
      "Filtro": "Cliente = '1'"
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
         "Cliente": "1",
         "Contrato": "1",
         "NAS": "(CENTRAL ASSINANTE)",
         "Porta": "(TODAS)",
         "Usuario": "joao.silva",
         "Senha": "mudar123",
         "MAC": "",
         "Observacao": ""
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
