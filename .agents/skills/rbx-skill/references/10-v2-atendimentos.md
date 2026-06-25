# RBX v2 — Atendimentos

Total: 14 endpoints

---

### Alteração de agendamento no atendimento

- **Versão:** v2
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [alteracao-de-agendamento-no-atendimento](https://www.developers.rbxsoft.com/v2/#alteracao-de-agendamento-no-atendimento)

**Request:**

```json
{
   "ticket_appointment_update": {
      "ticket_id": 660,
      "appointment_date": "2024-09-01",
      "appointment_time": "08:00",
      "duration": "01:30"
   }
}
```

**Response (ok):**

```json
{
   "status": true,
   "error_code": "",
   "error_description": "",
   "result": "Agendamento alterado com sucesso!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 15,
   "error_description": "Erro ao buscar informações do atendimento",
   "result": []
}
```

---

### Alteração de atendimentos

- **Versão:** v2
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [alteracao-de-atendimentos](https://www.developers.rbxsoft.com/v2/#alteracao-de-atendimentos)

**Request:**

```json
{
  "ticket_update":
  {
    "ticket_id": 2381544,
    "priority": 10,
    "status": "on_hold"
  }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Atendimento atualizado com sucesso!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 13,
   "error_description": "Não é permitido alterar um atendimento encerrado!",
   "result": ""
}
```

---

### Alteração de checklist de atendimentos

- **Versão:** v2
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [alteracao-de-checklist-de-atendimentos](https://www.developers.rbxsoft.com/v2/#alteracao-de-checklist-de-atendimentos)

**Request:**

```json
{
   "ticket_checklist_update": {
      "ticket_id": 101010,
      "checklist_id": 2023,
      "checklist_set": "D",
      "user": "usuario"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "Alteração Realizada"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 1,
   "error_description": "O campo ticket_id é obrigatório",
   "result": ""
}
```

---

### Alteração de situação da OS

- **Versão:** v2
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [alteracao-de-situacao-da-os](https://www.developers.rbxsoft.com/v2/#alteracao-de-situacao-da-os)

**Request:**

```json
{
   "ticket_os_status_update": {
      "ticket_id": "2381265",
      "new_status": "running",
      "coordinates": {
         "latitude": -23.49147466131137,
         "longitude": -51.78737744243203
      },
      "user": "usuario"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "OS status changed successfully"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 15,
   "error_description": "OS status is invalid. Allowed statuses: on_the_way|aborted|completed",
   "result": ""
}
```

---

### Consulta horários disponíveis para agendamento

- **Versão:** v2
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [consulta-horarios-disponiveis-para-agendamento](https://www.developers.rbxsoft.com/v2/#consulta-horarios-disponiveis-para-agendamento)

**Request:**

```json
{
   "consult_appointments": {
      "user": "usuario",
      "appointment_date": "2024-08-30"
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
         "start_time": "2024-08-30 00:00:00",
         "end_time": "2024-08-30 23:59:00"
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 8,
   "error_description": "O usuário informado não foi encontrado!",
   "result": ""
}
```

---

### Consulta modos de atendimento

- **Versão:** v2
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [consulta-modos-de-atendimento](https://www.developers.rbxsoft.com/v2/#consulta-modos-de-atendimento)

**Request:**

```json
{
   "get_tickets_mode": {}
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "",
   "error_description": "",
   "result": [
      {
         "code": "T",
         "description": "Telefone"
      },
      {
         "code": "V",
         "description": "Visita"
      },
      {
         "code": "E",
         "description": "Eletrônico"
      },
      {
         "code": "M",
         "description": "E-mail"
      },
      {
         "code": "C",
         "description": "Chat"
      },
      {
         "code": "F",
         "description": "Facebook"
      },
      {
         "code": "W",
         "description": "WhatsApp"
      },
      {
         "code": "S",
         "description": "Skype"
      },
      {
         "code": "G",
         "description": "Telegram"
      },
      {
         "code": "I",
         "description": "Twitter"
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 12,
   "error_description": "Internal Server Error!",
   "result": ""
}
```

---

### Designação de atendimento

- **Versão:** v2
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [designacao-de-atendimento](https://www.developers.rbxsoft.com/v2/#designacao-de-atendimento)

**Request:**

```json
{
   "ticket_assign": {
      "ticket_id": 2381852,
      "mode_assign": "E",
      "target_type": "user",
      "target_id": "usuario"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": 0,
   "error_description": "",
   "result": "ticket assigned successfully"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 14,
   "error_description": "The target_id is invalid!",
   "result": ""
}
```

---

### Encerramento de atendimento

- **Versão:** v2
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [encerramento-de-atendimento](https://www.developers.rbxsoft.com/v2/#encerramento-de-atendimento)

**Request:**

```json
{
   "ticket_finish": {
      "ticket_id": 2381852,
      "cause_id": 65874,
      "solution": "Solução do atendimento.",
      "datetime": "2023-04-01 12:00:00",
      "user": "usuario"
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
      "messages": [
         {
            "message": "Ticket closed!"
         }
      ],
      "new_tickets": [
         {
            "ticket_id": "2381855"
         }
      ]
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 7,
   "error_description": "The user informed does not exist!",
   "result": {
      "messages": [],
      "new_tickets": []
   }
}
```

---

### Geração de link para pesquisa de satisfação

- **Versão:** v2
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [geracao-de-link-para-pesquisa-de-satisfacao](https://www.developers.rbxsoft.com/v2/#geracao-de-link-para-pesquisa-de-satisfacao)

**Request:**

```json
{
   "generate_questionare_link": {
      "ticket": 1
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
         "Description": "Pesquisa automática",
         "generate_questionare_link": "https://meurbx.com/app_search_email/app_search_email.php?Key=FV2FVNYH52DFNJXVCTBC"
      }
   ]
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 11,
   "error_description": "O atendimento não possui pesquisas!",
   "result": []
}
```

---

### Inclusão de agendamento avulso

- **Versão:** v2
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [inclusao-de-agendamento-avulso](https://www.developers.rbxsoft.com/v2/#inclusao-de-agendamento-avulso)

**Request:**

```json
{
   "appointment_insert": {
      "description": "Agendamento Avulso",
      "appointment_date": "2024-09-01",
      "appointment_time": "08:00",
      "duration": "01:00",
      "user": "usuario",
      "recurrence": "no",
      "reminder": "none",
      "status": "to_confirm"
   }
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "",
   "error_description": "",
   "result": "Agendamento avulso realizado com sucesso!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 16,
   "error_description": "O usuário informado não foi encontrado!",
   "result": []
}
```

---

### Inclusão de agendamento no atendimento

- **Versão:** v2
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [inclusao-de-agendamento-no-atendimento](https://www.developers.rbxsoft.com/v2/#inclusao-de-agendamento-no-atendimento)

**Request:**

```json
{
   "ticket_appointment_insert": {
      "ticket_id": 2382219,
      "appointment_date": "2023-07-25",
      "appointment_time": "08:00",
      "duration": "01:30"
   }
}
```

**Response (ok):**

```json
{
   "status": true,
   "error_code": "",
   "error_description": "",
   "result": "Agendamento realizado com sucesso!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 18,
   "error_description": "Este atendimento já possui um agendamento informado!",
   "result": []
}
```

---

### Inclusão de item em atendimento

- **Versão:** v2
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [inclusao-de-item-em-atendimento](https://www.developers.rbxsoft.com/v2/#inclusao-de-item-em-atendimento)

**Request:**

```json
{
   "ticket_item_insert": {
      "ticket_id": 5248,
      "customer_id": 125,
      "type": "product",
      "operation": "sale",
      "contract_id": 1658,
      "item_id": 1588,
      "serial_number": "A6587548",
      "location_id": 1,
      "quantity": 1,
      "discount_amount": 0,
      "installments_quantity": 2,
      "installments_detail": [
         {
            "description": "Parcela 1",
            "amount": 10.5,
            "reference_period": "2023-04-01"
         },
         {
            "description": "Parcela 2",
            "amount": 10.5,
            "reference_period": "2023-05-01"
         }
      ],
      "dealer_id": 15
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
      "item_id": 65487
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 6,
   "error_description": "The field ticket_id is invalid (not found)",
   "result": ""
}
```

---

### Inclusão de mensagens no atendimento

- **Versão:** v2
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [inclusao-de-mensagens-no-atendimento](https://www.developers.rbxsoft.com/v2/#inclusao-de-mensagens-no-atendimento)

**Request:**

```json
{
   "chat_messages": [
      {
         "record": "2024-02-01 14:00:00",
         "customer": "1",
         "ticket_id": "1",
         "attendant": "joao.silva",
         "origin": "C",
         "content": "Boa tarde, gostaria de tirar algumas dúvidas.",
         "contact": "2"
      },
      {
         "record": "2024-02-01 14:00:10",
         "customer": "1",
         "ticket_id": "1",
         "attendant": "joao.silva",
         "origin": "A",
         "content": "Boa tarde. Como posso lhe ajudar?",
         "contact": "2"
      }
   ]
}
```

**Response (ok):**

```json
{
   "status": 1,
   "error_code": "",
   "error_description": "",
   "result": "Messages added successfully!"
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 16,
   "error_description": "ticket_id not found.",
   "result": []
}
```

---

### Inclusão de ocorrência em atendimento

- **Versão:** v2
- **Grupo:** Atendimentos
- **HTTP:** `None None`
- **Anchor:** [inclusao-de-ocorrencia-em-atendimento](https://www.developers.rbxsoft.com/v2/#inclusao-de-ocorrencia-em-atendimento)

**Request:**

```json
{
   "ticket_occurrence_insert": {
      "ticket_id": 5248,
      "protocol_id": 2020100000005248,
      "user": "usuario",
      "description": "Ocorrência Avulsa.",
      "latitude": -23.491506,
      "longitude": -51.7872292
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
      "occurrence_id": 35211
   }
}
```

**Response (erro):**

```json
{
   "status": 0,
   "error_code": 18,
   "error_description": "User not found!",
   "result": ""
}
```

---
