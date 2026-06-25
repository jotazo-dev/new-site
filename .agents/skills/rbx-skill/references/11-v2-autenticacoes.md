# RBX v2 — Autenticações

Total: 3 endpoints

---

### Alteração de autenticação

- **Versão:** v2
- **Grupo:** Autenticações
- **HTTP:** `None None`
- **Anchor:** [alteracao-de-autenticacao](https://www.developers.rbxsoft.com/v2/#alteracao-de-autenticacao)

**Request:**

```json
{
   "authentication_update": {
      "id": 1665,
      "password": "s6c5e87s8s5s"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Authentication updated successfully!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 12,
   "error_description": "The field status is invalid!",
   "result": ""
}
```

---

### Cadastro de autenticação

- **Versão:** v2
- **Grupo:** Autenticações
- **HTTP:** `None None`
- **Anchor:** [cadastro-de-autenticacao](https://www.developers.rbxsoft.com/v2/#cadastro-de-autenticacao)

**Request:**

```json
{
   "authentication_insert": {
      "customer_id": 22563,
      "contract_id": 65874,
      "nas": "-2",
      "port": "-1",
      "user": "joaozinho",
      "password": "s6c5e87s8s5s",
      "mac": "",
      "allow_access_subscriber_center": true,
      "allow_update_password": false,
      "force_password_update": false,
      "profile_id": 0,
      "comments": "Texto livre",
      "status": "A"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "",
   "error_description": "",
   "result": {
      "id": 1286
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 19,
   "error_description": "User already registered in a customer!",
   "result": []
}
```

---

### Exclusão de autenticação

- **Versão:** v2
- **Grupo:** Autenticações
- **HTTP:** `None None`
- **Anchor:** [exclusao-de-autenticacao](https://www.developers.rbxsoft.com/v2/#exclusao-de-autenticacao)

**Request:**

```json
{
   "authentication_delete": {
      "id": 1286
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "",
   "error_description": "",
   "result": [
      "Authentication deleted successfully."
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 9,
   "error_description": "Authentication not found!",
   "result": []
}
```

---
