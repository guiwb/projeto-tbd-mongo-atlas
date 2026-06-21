# Sistema de biblioteca inteligente no MongoDB Atlas

Solução para a rede de bibliotecas universitárias: gerenciamento de livros, empréstimos,
reservas, avaliações, recomendação, estatísticas e auditoria. Todo o armazenamento em
MongoDB Atlas.

## Stack

- MongoDB Atlas (cluster M0)
- mongosh — execução dos scripts de banco
- Node.js + Express — backend (Parte 16)
- HTML + JS puro — frontend (Parte 16)

## Configuração

Credenciais ficam em `backend/.env` (não versionado):

```
MONGODB_URI=mongodb+srv://<user>:<senha>@<cluster>/
DB_NAME=biblioteca
```

Pré-requisitos no Atlas:
- IP da máquina liberado em Network Access.
- Usuário de banco com permissão de leitura/escrita em Database Access.

## Estrutura

```
db/         scripts de banco (modelagem, carga, consultas, índices, transação, triggers)
backend/    API Node + Express
frontend/   páginas, componentes e serviços (HTML + JS)
```

## Como executar os scripts

Os scripts em `db/` rodam via mongosh apontando para o cluster. A partir da raiz do projeto:

```bash
set -a && . ./backend/.env && set +a
mongosh "$MONGODB_URI" --quiet db/<script>.js
```

Cada script seleciona o database com `db.getSiblingDB("biblioteca")`, então independem
do banco padrão da connection string.

## Execução por parte

### Parte 1: Modelagem (`db/00-modelagem.js`)

Cria as seis coleções (`usuarios`, `livros`, `emprestimos`, `reservas`, `avaliacoes`,
`logs`) com validação de schema via `$jsonSchema`. O script dropa e recria as coleções,
servindo como setup inicial idempotente.

```bash
mongosh "$MONGODB_URI" --quiet db/00-modelagem.js
```

### Parte 2: Carga inicial (`db/01-carga.js`)

Popula as coleções nos volumes exigidos: 100 usuários, 500 livros, 1000 empréstimos,
300 reservas e 1000 avaliações. Os IDs de usuários e livros são capturados após a
inserção e reaproveitados como referência nas demais coleções. Ao final imprime a
contagem de cada coleção para conferência.

```bash
mongosh "$MONGODB_URI" --quiet db/01-carga.js
```

Saída esperada:

```
usuarios:    100
livros:      500
emprestimos: 1000
reservas:    300
avaliacoes:  1000
```

### Parte 3: CRUD backend (`backend/`)

O CRUD é exposto como endpoints REST no backend (Express + driver mongodb), reaproveitados
pelo frontend. Para subir a API:

```bash
cd backend
npm install
npm start            # http://localhost:3000
```

Endpoints:

| Entidade | Operação | Rota |
|---|---|---|
| Livros | inserir | `POST /livros` |
| Livros | atualizar quantidade | `PATCH /livros/:id/quantidade` |
| Livros | alterar categoria | `PATCH /livros/:id/categoria` |
| Livros | remover | `DELETE /livros/:id` |
| Usuários | bloquear | `PATCH /usuarios/:id/bloquear` |
| Usuários | reativar | `PATCH /usuarios/:id/reativar` |
| Usuários | alterar curso | `PATCH /usuarios/:id/curso` |
| Empréstimos | realizar | `POST /emprestimos` |
| Empréstimos | registrar devolução | `PATCH /emprestimos/:id/devolucao` |
| Empréstimos | renovar | `PATCH /emprestimos/:id/renovar` |

Erros retornam status HTTP adequado (400 validação, 404 inexistente, 409 conflito de
estado) com corpo `{ "erro": "<mensagem>" }`.

### Parte 4: Consultas intermediárias (`db/03-consultas.js`)

- Q1: livros da categoria "Computação" publicados após 2020.
- Q2: usuários cadastrados nos últimos 30 dias (intervalo entre hoje e 30 dias atrás).
- Q3: empréstimos em atraso (`status: "emprestado"` com data prevista anterior a hoje).
- Q4: livros que nunca foram emprestados (`$lookup` em empréstimos filtrando vazios).
- Q5: dez usuários com maior número de empréstimos (`$group` + `$sort` + `$limit`).

```bash
mongosh "$MONGODB_URI" --quiet db/03-consultas.js
```

### Parte 5: Aggregation pipeline (`db/04-aggregations.js`)

- Q6: quantidade de livros por categoria (`$group` + `$sum`).
- Q7: média de avaliações por livro (`$avg` da nota + `$lookup` no título).
- Q8: dez livros mais emprestados (`$group` por `livro_id` + `$lookup`).
- Q9: cursos que mais utilizam a biblioteca (join empréstimo→usuário, `$group` por curso).
- Q10: taxa de devolução por mês (`$year`/`$month` + razão devolvidos/total com `$cond`).
- Q11: ranking dos autores mais lidos (join empréstimo→livro, `$group` por autor).
- Q12: livros com nota média inferior a 3 (`$avg` + `$match`).

```bash
mongosh "$MONGODB_URI" --quiet db/04-aggregations.js
```

### Parte 6: Uso de `$lookup` (`db/05-lookup.js`)

- Q13: empréstimos com nome do usuário, título do livro e data (dois `$lookup`).
- Q14: avaliações com usuário, livro, nota e comentário (dois `$lookup`).
- Q15: relatório completo de um usuário — dados pessoais, empréstimos, reservas e
  avaliações reunidos via `$lookup` múltiplo a partir de `usuarios`.

```bash
mongosh "$MONGODB_URI" --quiet db/05-lookup.js
```

### Parte 7: Índices (`db/06-indices.js`)

Cria índices em `livros` (`titulo`, `autor`, `isbn` único, `categoria`) e `usuarios`
(`email` único, `curso`). Para cada um, o script mede a mesma consulta com
`explain("executionStats")` antes e depois da criação, comparando estágio do plano e
documentos examinados.

```bash
mongosh "$MONGODB_URI" --quiet db/06-indices.js
```

Resultado: sem índice o plano é `COLLSCAN` (examina toda a coleção); com índice passa a
`IXSCAN`, examinando apenas os documentos que casam (ex.: `titulo` 500 → 1, `categoria`
500 → 76, `email` 100 → 1). Em volume pequeno o tempo é desprezível, então a métrica
relevante é a redução de documentos examinados.

### Parte 12: Transação (`backend/services/loans.service.js`)

O endpoint `POST /emprestimos` realiza o empréstimo dentro de uma transação
(`session.withTransaction`) com três operações atômicas:

1. inserir o empréstimo;
2. decrementar a quantidade do livro (`$inc: -1`);
3. registrar o log da operação.

Se qualquer passo falhar — por exemplo, livro sem exemplares disponíveis — toda a
transação é revertida e nada é persistido. Validado: ao emprestar um livro com
`quantidade: 1`, a segunda tentativa retorna `409` e a quantidade permanece `0`, sem
empréstimo nem log órfãos. Requer replica set (atendido pelo Atlas).

### Parte 8: Atlas Search (`db/07-atlas-search.js`)

Depende de um índice Atlas Search chamado `default` na coleção `livros`, criado pela
interface do Atlas com `titulo` mapeado como `string` + `autocomplete` e
`autor`/`categoria`/`palavrasChave` como `string`.

- Q16: busca por livros contendo "mongodb" (operador `text` em `palavrasChave`).
- Q17: busca tolerante a erros por termo semelhante a "algoritmo" (`text` com `fuzzy`).
- Q18: autocomplete de títulos (operador `autocomplete` em `titulo`).

```bash
mongosh "$MONGODB_URI" --quiet db/07-atlas-search.js
```

Cada resultado traz o `searchScore` via `$meta`. Como o seed usa as mesmas palavras-chave
em todos os livros, Q16 e Q17 retornam o catálogo inteiro com score uniforme; o
autocomplete (Q18) ordena por relevância do prefixo do título.

### Parte 16: Aplicação web (`backend/` + `frontend/`)

Backend Express com CRUD de livros, usuários, empréstimos, reservas e avaliações, além de
endpoints de relatório consumidos pelo frontend:

- `GET /relatorios/dashboard` — totais por coleção, livros por categoria, empréstimos por mês.
- `GET /relatorios/livros-populares?limit=N` — ranking dos livros mais emprestados.
- `GET /relatorios/usuario/:id` — relatório completo do usuário (empréstimos, reservas, avaliações).

Frontend em HTML + JS puro (sem build), com quatro telas: dashboard administrativo (dados
em texto), busca de livros, histórico do usuário e ranking de livros mais populares. O
acesso à API é centralizado em `frontend/services/api.js`, com erros exibidos na própria
tela.

Para rodar localmente (duas etapas):

```bash
# 1. API
cd backend && npm install && npm start          # http://localhost:3000

# 2. Frontend (qualquer servidor estático)
cd frontend && python3 -m http.server 5500       # http://localhost:5500
```
