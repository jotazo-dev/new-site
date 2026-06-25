---
name: algar-skill
description: Conhecimento completo da API Algar Telecom Enabler (RMS) para integração de serviços de telecomunicações, eSIM e portabilidade.
version: 1.0.0
---
# Algar Telecom Enabler Skill

Este skill fornece conhecimento completo sobre a API da Algar Telecom Enabler (RMS - Resource Management System), permitindo a integração de serviços de telecomunicações como ativação de linhas móveis, eSIM, portabilidade e gestão de assinantes.

## 🚀 Visão Geral

A API Telecom Enabler do RMS é uma interface padronizada para gerenciamento de recursos de Telecom. Ela suporta uma ampla gama de serviços e utiliza autenticação OAuth2.

## 🔐 Autenticação e Ambientes

### Ambientes
- **Sandbox:** `https://sandbox-api.example.com` (Uso para testes e desenvolvimento)
- **Produção:** `https://api.example.com` (Uso real)

### Fluxo de Autenticação
Todas as requisições requerem um `access_token` do tipo Bearer.

**Endpoint de Token:**
`POST {URL_BASE}/auth/token`

**Corpo da Requisição:**
```json
{
  "client_id": "seu_client_id",
  "client_secret": "seu_client_secret"
}
```

**Resposta (200 OK):**
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Uso:**
Incluir no cabeçalho: `Authorization: Bearer {access_token}`

## 📋 Mapeamento de Recursos e Endpoints

### 1. Assinantes (Subscribers)
Gerencia o cadastro de pessoas físicas ou jurídicas.

- `POST /v2/subscribers`: Cria um novo assinante.
    - **Campos Principais:** `type` (individual/company), `document` (CPF/CNPJ), `name`, `email`, `birthdate`, `address`.
- `GET /v2/subscribers`: Lista assinantes.
- `GET /v2/subscribers/{id}`: Busca por ID.
- `GET /v2/subscribers/document/{document}`: Busca por CPF/CNPJ.
- `GET /v2/subscribers/ref/{external_id}`: Busca por ID externo.
- `PATCH /v2/subscribers/{id}`: Atualiza dados do assinante.

### 2. Produtos (Products)
Consulta o catálogo de produtos disponíveis para o tenant.

- `GET /v2/products`: Lista todos os produtos disponíveis (planos, pacotes de dados, etc).

### 3. Serviços (Services)
Representa a habilitação de um produto para um assinante.

- `POST /v2/services`: Ativa um novo serviço.
    - **Campos:** `subscriber_id`, `product_id`, `terminal` (número), `ref`.
- `GET /v2/services/{id}`: Detalhes do serviço.
- `PATCH /v2/services/{id}/subscriber`: Altera o assinante vinculado ao serviço.
- `PATCH /v2/services/{id}/restrictions`: Define restrições de uso.
- `DELETE /v2/services/{id}`: Cancela o serviço.

### 4. Linhas Móveis (Mobile Lines) - Foco eSIM/SIM
Gerenciamento específico de linhas de telefonia móvel.

- `POST /v2/mobilelines`: Cria uma nova linha móvel vinculando um ICCID.
    - **Campos:** `iccid`, `product_id`, `subscriber_id`, `terminal`, `ref`.
- `POST /v2/mobilelines/{id}/activate`: Ativa a linha na rede.
- `GET /v2/mobilelines/{id}`: Detalhes da linha.
- `DELETE /v2/mobilelines/{id}`: Cancela a linha.
- `GET /v2/mobilelines/iccid/{iccid}`: Busca linha pelo ICCID.
- `GET /v2/mobilelines/terminal/{number}`: Busca linha pelo número de telefone.

### 5. Portabilidade (Portability)
Gerencia pedidos de transferência de operadora.

- `POST /v2/portability`: Solicita portabilidade numérica.
    - **Campos:** `terminal`, `document`, `operator_id`, `window_id`.
- `GET /v2/portability/terminal/{number}`: Consulta status da portabilidade.
- `GET /v2/portability/windows`: Lista janelas disponíveis para agendamento.

### 6. Numeração (Numbering)
Gestão de estoque de números (DIDs).

- `GET /v2/numbering/available`: Lista números disponíveis para ativação.
- `GET /v2/numbering/coverage`: Lista localidades atendidas.
- `POST /v2/numbering/request`: Solicita nova carga de numeração.

### 7. SIM Cards / ICCIDs
- `GET /v2/simcards/available`: Lista ICCIDs (eSIM/Physical) disponíveis no estoque.
- `GET /v2/simcards/{iccid}`: Detalhes de um SIM Card específico.

## 📱 eSIM e QR Code (LPA)

A Algar não fornece uma imagem de QR Code pronta. O sistema deve gerar o QR Code localmente a partir da string LPA.

### Fluxo de Ativação eSIM
1. **Requisição:** Ao criar ou ativar uma linha (`POST /v2/mobilelines`), definir `card.type = "esim"`.
2. **Resposta:** A API retorna um objeto `card` contendo `activationData` (ex: `LPA:1$smdp.algar.com.br$ABCD-1234`).
3. **Geração:** Utilize uma biblioteca de QR Code (ex: `qrcode.react`) para transformar a string `activationData` em um código escaneável.
4. **Polling:** Se `activationData` for `null` mas o status for "PROCESSING", realize polling em `GET /v2/mobilelines/{id}` até que o dado esteja disponível.

### Estrutura do SIMCardResponse
```json
{
  "type": "esim",
  "iccid": "8955...",
  "imsi": "724...",
  "activationData": "LPA:1$smdp.algar.com.br$...",
  "status": "active"
}
```


## 🛠️ Padrões de Implementação

### Formato de Endereço
```json
{
  "zipcode": "38400000",
  "street": "Av. Floriano Peixoto",
  "number": "1000",
  "complement": "Bloco A",
  "neighborhood": "Centro",
  "city": "Uberlândia",
  "state": "MG"
}
```

### Tratamento de Erros
A API utiliza códigos HTTP padrão:
- `400 Bad Request`: Erro de validação nos campos.
- `401 Unauthorized`: Token inválido ou expirado.
- `403 Forbidden`: Tenant sem permissão para o recurso.
- `404 Not Found`: Recurso não encontrado.
- `422 Unprocessable Entity`: Regra de negócio impedindo a operação (ex: documento já cadastrado).

## 💡 Dicas de Integração
1. **Cache de Token:** Armazene o `access_token` e verifique a expiração antes de solicitar um novo.
2. **Idempotência:** Utilize o campo `ref` para evitar duplicidade em operações de criação.
3. **Webhook:** A Algar envia notificações via Webhook para mudanças de status em portabilidade e ativação (configurar no painel do tenant).
