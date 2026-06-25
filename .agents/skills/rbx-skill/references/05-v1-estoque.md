# RBX v1 — Estoque

Total: 3 endpoints

---

### Consulta modelos de produtos

- **Versão:** v1
- **Grupo:** Estoque
- **HTTP:** `None None`
- **Anchor:** [consulta-modelos-de-produtos](https://www.developers.rbxsoft.com/index.html#consulta-modelos-de-produtos)

**Request:**

```json
{
   "ConsultaModelosProduto": {
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
         "Tipo_Descricao": "Rádio",
         "Tipo_Id": "1",
         "Descricao": "Rádio",
         "Marca": ""
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

### Consulta tipos de produtos

- **Versão:** v1
- **Grupo:** Estoque
- **HTTP:** `None None`
- **Anchor:** [consulta-tipos-de-produtos](https://www.developers.rbxsoft.com/index.html#consulta-tipos-de-produtos)

**Request:**

```json
{
   "ConsultaTiposProduto": {
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
         "Descricao": "Rádio"
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

### Consulta unidades de produtos

- **Versão:** v1
- **Grupo:** Estoque
- **HTTP:** `None None`
- **Anchor:** [consulta-unidades-de-produtos](https://www.developers.rbxsoft.com/index.html#consulta-unidades-de-produtos)

**Request:**

```json
{
   "ConsultaUnidadesProduto": {
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
         "Sigla": "UN",
         "Descricao": "Unidade"
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
