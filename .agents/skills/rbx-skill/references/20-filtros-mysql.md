# Filtros nos endpoints v1 de consulta

Todos os endpoints v1 do tipo "Consulta..." aceitam um campo `Filtro` no body, que é uma **cláusula WHERE de MySQL** aplicada diretamente à query interna do RBX.

## Sintaxe

```json
{
  "ConsultaAtendimentos": {
    "Autenticacao": { "ChaveIntegracao": "XXX" },
    "Filtro": "Atendimentos.Cliente = '10' AND Atendimentos.Situacao = 'A'"
  }
}
```

- Os **nomes de campo devem ser qualificados pelo nome da tabela** (`Atendimentos.Cliente`, `Clientes.Codigo`, `DocumentosEmAberto.Cliente`).
- Cada endpoint documenta sua tabela e os campos filtráveis na seção **"Filtros disponíveis"** (extraída em cada arquivo `01-v1-*.md`/etc.).
- Operadores aceitos: `=`, `!=`, `<`, `>`, `<=`, `>=`, `LIKE`, `IN (...)`, `BETWEEN`, `IS NULL`, `IS NOT NULL`, `AND`, `OR`, parênteses.
- Funções MySQL aceitas: `DATE(...)`, `YEAR(...)`, `MONTH(...)`, `DAY(...)`, `NOW()`, `CURDATE()`, `DATE_ADD`, `DATE_SUB`, `STR_TO_DATE`, `LOWER`, `UPPER`, `CONCAT`, etc.

## Exemplos práticos

```sql
-- Atendimentos abertos hoje
Atendimentos.Situacao = 'A' AND DATE(Atendimentos.Abertura) = CURDATE()

-- Documentos em aberto vencendo nos próximos 7 dias para um cliente
DocumentosEmAberto.Cliente = '1234'
  AND DocumentosEmAberto.Vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)

-- Clientes por CPF
Clientes.CPF_CNPJ = '12345678900'

-- Contratos ativos
Contratos.Situacao = 'A'
```

## Gotchas

- **Sem `WHERE`** no início — só a expressão.
- **Sempre escape aspas simples** se o valor tiver aspas (`O\\'Brien`).
- Filtro `""` (vazio) retorna **todos os registros** (cuidado com volume — algumas consultas têm limite implícito).
- Se a consulta não retornar nada, vem `status: 0, erro_code: 1, erro_desc: "A consulta nao retornou resultados"`. Trate isso como "lista vazia", **não** como erro de integração.
