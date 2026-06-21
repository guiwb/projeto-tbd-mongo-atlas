# Sistema de Biblioteca Inteligente — MongoDB Atlas

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

### Parte 1 — Modelagem (`db/00-modelagem.js`)

Cria as seis coleções (`usuarios`, `livros`, `emprestimos`, `reservas`, `avaliacoes`,
`logs`) com validação de schema via `$jsonSchema`. O script dropa e recria as coleções,
servindo como setup inicial idempotente.

```bash
mongosh "$MONGODB_URI" --quiet db/00-modelagem.js
```

### Parte 2 — Carga inicial (`db/01-carga.js`)

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
