# Sistema de biblioteca no MongoDB Atlas

## Stack

- MongoDB Atlas (cluster M0)
- mongosh (execução dos scripts de banco)
- Node.js + Express (backend)
- HTML + JS puro, sem build (frontend)

## Estrutura

```
db/         scripts de banco (modelagem e carga inicial)
backend/    API Node + Express
frontend/   página, app e serviço de acesso à API (HTML + JS)
```

```
backend/
  app.js            bootstrap do Express e registro das rotas
  db.js             conexão com o Atlas
  routes/           definição das rotas por entidade
  controllers/      handlers HTTP
  models/           acesso às coleções
  services/         regra de negócio (transação de empréstimo)
  utils.js          helpers compartilhados
frontend/
  index.html        telas (dashboard, busca, histórico, ranking)
  app.js            lógica das telas
  services/api.js   acesso centralizado à API
```

## Pré-requisitos

- Node.js 18+ (para `node --watch` e ESM nativo).
- mongosh instalado para rodar os scripts em `db/`.
- Conta no MongoDB Atlas com um cluster ativo.

No Atlas:

- IP da máquina liberado em Network Access.
- Usuário de banco com permissão de leitura/escrita em Database Access.

## Configuração

Copie `backend/.env.example` para `backend/.env` (não versionado) e preencha:

```
MONGODB_URI=mongodb+srv://<user>:<senha>@<cluster>/
DB_NAME=biblioteca
PORT=3000
```

## Banco de dados (`db/`)

Os scripts rodam via mongosh apontando para o cluster. A partir da raiz do projeto,
exporte as variáveis do `.env` e execute:

```bash
set -a && . ./backend/.env && set +a

mongosh "$MONGODB_URI" --quiet db/00-modelagem.js   # cria as coleções com validação de schema
mongosh "$MONGODB_URI" --quiet db/01-carga.js       # popula os dados iniciais
```

Cada script seleciona o database com `db.getSiblingDB("biblioteca")`, então independem do
banco padrão da connection string.

- `00-modelagem.js`: cria as seis coleções (`usuarios`, `livros`, `emprestimos`,
  `reservas`, `avaliacoes`, `logs`) com `$jsonSchema`. Dropa e recria, servindo como setup
  idempotente.
- `01-carga.js`: popula 100 usuários, 500 livros, 1000 empréstimos, 300 reservas e 1000
  avaliações, reaproveitando os IDs gerados como referência. Ao final imprime a contagem
  de cada coleção.

## Backend (`backend/`)

API Express com CRUD de livros, usuários, empréstimos, reservas e avaliações, além de
endpoints de relatório consumidos pelo frontend. O empréstimo (`POST /emprestimos`) roda
dentro de uma transação atômica (inserir empréstimo, decrementar a quantidade do livro e
registrar o log); requer replica set (atendido pelo Atlas).

```bash
cd backend
npm install
npm start        # http://localhost:3000
npm run dev      # mesmo, com reload (node --watch)
```

Erros retornam status HTTP adequado (400 validação, 404 inexistente, 409 conflito de
estado) com corpo `{ "erro": "<mensagem>" }`.

### Endpoints

| Entidade    | Operação             | Rota                                       |
| ----------- | -------------------- | ------------------------------------------ |
| Livros      | inserir              | `POST /livros`                             |
| Livros      | atualizar quantidade | `PATCH /livros/:id/quantidade`             |
| Livros      | alterar categoria    | `PATCH /livros/:id/categoria`              |
| Livros      | remover              | `DELETE /livros/:id`                       |
| Usuários    | bloquear             | `PATCH /usuarios/:id/bloquear`             |
| Usuários    | reativar             | `PATCH /usuarios/:id/reativar`             |
| Usuários    | alterar curso        | `PATCH /usuarios/:id/curso`                |
| Empréstimos | realizar             | `POST /emprestimos`                        |
| Empréstimos | registrar devolução  | `PATCH /emprestimos/:id/devolucao`         |
| Empréstimos | renovar              | `PATCH /emprestimos/:id/renovar`           |
| Reservas    | listar               | `GET /reservas`                            |
| Reservas    | criar                | `POST /reservas`                           |
| Reservas    | finalizar            | `PATCH /reservas/:id/finalizar`            |
| Reservas    | remover              | `DELETE /reservas/:id`                     |
| Avaliações  | listar               | `GET /avaliacoes`                          |
| Avaliações  | criar                | `POST /avaliacoes`                         |
| Avaliações  | remover              | `DELETE /avaliacoes/:id`                   |
| Relatórios  | dashboard            | `GET /relatorios/dashboard`                |
| Relatórios  | livros populares     | `GET /relatorios/livros-populares?limit=N` |
| Relatórios  | relatório do usuário | `GET /relatorios/usuario/:id`              |

## Frontend (`frontend/`)

HTML + JS puro, sem etapa de build, com quatro telas: dashboard administrativo, busca de
livros, histórico do usuário e ranking de livros mais populares. O acesso à API é
centralizado em `frontend/services/api.js`, com erros exibidos na própria tela.

Sirva os arquivos estáticos por qualquer servidor (a API precisa estar no ar):

```bash
cd frontend
python3 -m http.server 5500      # http://localhost:5500
```

## Execução completa (resumo)

```bash
# 1. configurar credenciais
cp backend/.env.example backend/.env   # e preencher MONGODB_URI

# 2. preparar o banco
set -a && . ./backend/.env && set +a
mongosh "$MONGODB_URI" --quiet db/00-modelagem.js
mongosh "$MONGODB_URI" --quiet db/01-carga.js

# 3. subir a API
cd backend && npm install && npm start        # http://localhost:3000

# 4. servir o frontend (em outro terminal)
cd frontend && python3 -m http.server 5500     # http://localhost:5500
```
