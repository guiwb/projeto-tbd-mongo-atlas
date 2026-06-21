# Sistema de biblioteca com MongoDB Atlas: Resoluções

## Parte 1: Modelagem do banco de dados

Foram criadas seis coleções com validação de schema (`$jsonSchema`). Comandos:

```js
db.createCollection("usuarios", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["nome", "email", "curso", "cidade", "dataCadastro", "ativo"],
      properties: {
        nome: { bsonType: "string" },
        email: { bsonType: "string" },
        curso: { bsonType: "string" },
        cidade: { bsonType: "string" },
        dataCadastro: { bsonType: "date" },
        ativo: { bsonType: "bool" },
      },
    },
  },
});

db.createCollection("livros", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "isbn",
        "titulo",
        "autor",
        "editora",
        "ano",
        "categoria",
        "palavrasChave",
        "quantidade",
      ],
      properties: {
        isbn: { bsonType: "string" },
        titulo: { bsonType: "string" },
        autor: { bsonType: "string" },
        editora: { bsonType: "string" },
        ano: { bsonType: "number" },
        categoria: { bsonType: "string" },
        palavrasChave: { bsonType: "array", items: { bsonType: "string" } },
        quantidade: { bsonType: "number" },
      },
    },
  },
});

db.createCollection("emprestimos", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "usuario_id",
        "livro_id",
        "dataEmprestimo",
        "dataPrevistaDevolucao",
        "status",
      ],
      properties: {
        usuario_id: { bsonType: "objectId" },
        livro_id: { bsonType: "objectId" },
        dataEmprestimo: { bsonType: "date" },
        dataPrevistaDevolucao: { bsonType: "date" },
        dataDevolucao: { bsonType: ["date", "null"] },
        status: { enum: ["emprestado", "devolvido"] },
      },
    },
  },
});

db.createCollection("reservas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "livro_id", "dataReserva", "status"],
      properties: {
        usuario_id: { bsonType: "objectId" },
        livro_id: { bsonType: "objectId" },
        dataReserva: { bsonType: "date" },
        status: { enum: ["ativa", "finalizada"] },
      },
    },
  },
});

db.createCollection("avaliacoes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["usuario_id", "livro_id", "nota", "comentario", "data"],
      properties: {
        usuario_id: { bsonType: "objectId" },
        livro_id: { bsonType: "objectId" },
        nota: { bsonType: "number", minimum: 1, maximum: 5 },
        comentario: { bsonType: "string" },
        data: { bsonType: "date" },
      },
    },
  },
});

db.createCollection("logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["colecao", "operacao", "data", "dados"],
      properties: {
        colecao: { bsonType: "string" },
        operacao: { bsonType: "string" },
        data: { bsonType: "date" },
        dados: { bsonType: "object" },
      },
    },
  },
});
```

> Script completo no projeto: `db/00-modelagem.js`.

---

## Parte 2: Carga inicial

Carga gerada pelo script provisionado pelo professor, fiz apenas um ajuste em relação aos ids dos usuários.

> Script completo no projeto: `db/01-carga.js`.

---

## Parte 3: CRUD completo (backend)

Operações implementadas como endpoints REST no backend.
Código: `backend/controllers/` e `backend/routes/`.

| Entidade    | Operação             | Rota                               |
| ----------- | -------------------- | ---------------------------------- |
| Livros      | inserir              | `POST /livros`                     |
| Livros      | atualizar quantidade | `PATCH /livros/:id/quantidade`     |
| Livros      | alterar categoria    | `PATCH /livros/:id/categoria`      |
| Livros      | remover              | `DELETE /livros/:id`               |
| Usuários    | bloquear             | `PATCH /usuarios/:id/bloquear`     |
| Usuários    | reativar             | `PATCH /usuarios/:id/reativar`     |
| Usuários    | alterar curso        | `PATCH /usuarios/:id/curso`        |
| Empréstimos | realizar             | `POST /emprestimos`                |
| Empréstimos | registrar devolução  | `PATCH /emprestimos/:id/devolucao` |
| Empréstimos | renovar              | `PATCH /emprestimos/:id/renovar`   |

---

## Parte 4: Consultas intermediárias

### Questão 1: Livros da categoria "Computação" publicados após 2020

```js
db.livros.find({ categoria: "Computação", ano: { $gt: 2020 } });
```

### Questão 2: Usuários cadastrados nos últimos 30 dias

```js
const now = new Date();
const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
db.usuarios.find({ dataCadastro: { $gte: cutoff, $lte: now } });
```

### Questão 3: Empréstimos em atraso

```js
db.emprestimos.find({
  status: "emprestado",
  dataPrevistaDevolucao: { $lt: new Date() },
});
```

### Questão 4: Livros que nunca foram emprestados

```js
db.livros.aggregate([
  {
    $lookup: {
      from: "emprestimos",
      localField: "_id",
      foreignField: "livro_id",
      as: "emprestimos",
    },
  },
  { $match: { emprestimos: { $size: 0 } } },
  { $project: { titulo: 1, autor: 1, categoria: 1 } },
]);
```

### Questão 5: Dez usuários com maior número de empréstimos

```js
db.emprestimos.aggregate([
  { $group: { _id: "$usuario_id", totalEmprestimos: { $sum: 1 } } },
  { $sort: { totalEmprestimos: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "usuarios",
      localField: "_id",
      foreignField: "_id",
      as: "usuario",
    },
  },
  { $unwind: "$usuario" },
  {
    $project: {
      _id: 0,
      nome: "$usuario.nome",
      email: "$usuario.email",
      totalEmprestimos: 1,
    },
  },
]);
```

---

## Parte 5: Aggregation pipeline avançado

### Questão 6: Quantidade de livros por categoria

```js
db.livros.aggregate([
  { $group: { _id: "$categoria", total: { $sum: 1 } } },
  { $sort: { total: -1 } },
]);
```

### Questão 7: Média de avaliações por livro

```js
db.avaliacoes.aggregate([
  {
    $group: {
      _id: "$livro_id",
      mediaNota: { $avg: "$nota" },
      totalAvaliacoes: { $sum: 1 },
    },
  },
  {
    $lookup: {
      from: "livros",
      localField: "_id",
      foreignField: "_id",
      as: "livro",
    },
  },
  { $unwind: "$livro" },
  {
    $project: {
      _id: 0,
      titulo: "$livro.titulo",
      mediaNota: { $round: ["$mediaNota", 2] },
      totalAvaliacoes: 1,
    },
  },
  { $sort: { mediaNota: -1 } },
]);
```

### Questão 8: Dez livros mais emprestados

```js
db.emprestimos.aggregate([
  { $group: { _id: "$livro_id", totalEmprestimos: { $sum: 1 } } },
  { $sort: { totalEmprestimos: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "livros",
      localField: "_id",
      foreignField: "_id",
      as: "livro",
    },
  },
  { $unwind: "$livro" },
  {
    $project: {
      _id: 0,
      titulo: "$livro.titulo",
      autor: "$livro.autor",
      totalEmprestimos: 1,
    },
  },
]);
```

### Questão 9: Cursos que mais utilizam a biblioteca

```js
db.emprestimos.aggregate([
  {
    $lookup: {
      from: "usuarios",
      localField: "usuario_id",
      foreignField: "_id",
      as: "usuario",
    },
  },
  { $unwind: "$usuario" },
  { $group: { _id: "$usuario.curso", totalEmprestimos: { $sum: 1 } } },
  { $sort: { totalEmprestimos: -1 } },
]);
```

### Questão 10: Taxa de devolução por mês

```js
db.emprestimos.aggregate([
  {
    $group: {
      _id: {
        ano: { $year: "$dataEmprestimo" },
        mes: { $month: "$dataEmprestimo" },
      },
      total: { $sum: 1 },
      devolvidos: {
        $sum: { $cond: [{ $eq: ["$status", "devolvido"] }, 1, 0] },
      },
    },
  },
  {
    $project: {
      _id: 0,
      ano: "$_id.ano",
      mes: "$_id.mes",
      total: 1,
      devolvidos: 1,
      taxaDevolucao: {
        $round: [
          { $multiply: [{ $divide: ["$devolvidos", "$total"] }, 100] },
          1,
        ],
      },
    },
  },
  { $sort: { ano: 1, mes: 1 } },
]);
```

### Questão 11: Ranking dos autores mais lidos

```js
db.emprestimos.aggregate([
  {
    $lookup: {
      from: "livros",
      localField: "livro_id",
      foreignField: "_id",
      as: "livro",
    },
  },
  { $unwind: "$livro" },
  { $group: { _id: "$livro.autor", totalEmprestimos: { $sum: 1 } } },
  { $sort: { totalEmprestimos: -1 } },
  { $limit: 10 },
]);
```

### Questão 12: Livros com nota média inferior a 3

```js
db.avaliacoes.aggregate([
  {
    $group: {
      _id: "$livro_id",
      mediaNota: { $avg: "$nota" },
      totalAvaliacoes: { $sum: 1 },
    },
  },
  { $match: { mediaNota: { $lt: 3 } } },
  {
    $lookup: {
      from: "livros",
      localField: "_id",
      foreignField: "_id",
      as: "livro",
    },
  },
  { $unwind: "$livro" },
  {
    $project: {
      _id: 0,
      titulo: "$livro.titulo",
      mediaNota: { $round: ["$mediaNota", 2] },
      totalAvaliacoes: 1,
    },
  },
  { $sort: { mediaNota: 1 } },
]);
```

---

## Parte 6: Uso de `$lookup`

### Questão 13: Empréstimos com nome do usuário, título do livro e data

```js
db.emprestimos.aggregate([
  {
    $lookup: {
      from: "usuarios",
      localField: "usuario_id",
      foreignField: "_id",
      as: "usuario",
    },
  },
  {
    $lookup: {
      from: "livros",
      localField: "livro_id",
      foreignField: "_id",
      as: "livro",
    },
  },
  { $unwind: "$usuario" },
  { $unwind: "$livro" },
  {
    $project: {
      _id: 0,
      usuario: "$usuario.nome",
      livro: "$livro.titulo",
      dataEmprestimo: 1,
    },
  },
]);
```

### Questão 14: Avaliações com usuário, livro, nota e comentário

```js
db.avaliacoes.aggregate([
  {
    $lookup: {
      from: "usuarios",
      localField: "usuario_id",
      foreignField: "_id",
      as: "usuario",
    },
  },
  {
    $lookup: {
      from: "livros",
      localField: "livro_id",
      foreignField: "_id",
      as: "livro",
    },
  },
  { $unwind: "$usuario" },
  { $unwind: "$livro" },
  {
    $project: {
      _id: 0,
      usuario: "$usuario.nome",
      livro: "$livro.titulo",
      nota: 1,
      comentario: 1,
    },
  },
]);
```

### Questão 15: Relatório completo de um usuário

```js
db.usuarios.aggregate([
  { $match: { _id: ObjectId("6a381c88e3f1dcf0b99df8a3") } },
  {
    $lookup: {
      from: "emprestimos",
      localField: "_id",
      foreignField: "usuario_id",
      as: "emprestimos",
    },
  },
  {
    $lookup: {
      from: "reservas",
      localField: "_id",
      foreignField: "usuario_id",
      as: "reservas",
    },
  },
  {
    $lookup: {
      from: "avaliacoes",
      localField: "_id",
      foreignField: "usuario_id",
      as: "avaliacoes",
    },
  },
  {
    $project: {
      _id: 0,
      nome: 1,
      email: 1,
      curso: 1,
      cidade: 1,
      totalEmprestimos: { $size: "$emprestimos" },
      totalReservas: { $size: "$reservas" },
      totalAvaliacoes: { $size: "$avaliacoes" },
      emprestimos: 1,
      reservas: 1,
      avaliacoes: 1,
    },
  },
]);
```

---

## Parte 7: Índices

Criei os índices usando os seguintes comandos:

```js
db.livros.createIndex({ titulo: 1 });
db.livros.createIndex({ autor: 1 });
db.livros.createIndex({ isbn: 1 }, { unique: true });
db.livros.createIndex({ categoria: 1 });
db.usuarios.createIndex({ email: 1 }, { unique: true });
db.usuarios.createIndex({ curso: 1 });
```

Comparei o desempenho com `explain("executionStats")` antes e depois, por exemplo:

```js
db.livros.find({ titulo: "Livro 250" }).explain("executionStats");
```

Resultado observado:

| Consulta                                    | Sem índice (COLLSCAN) | Com índice (IXSCAN) |
| ------------------------------------------- | --------------------- | ------------------- |
| `livros.titulo = "Livro 250"`               | 500                   | 1                   |
| `livros.autor = "Autor 50"`                 | 500                   | 4                   |
| `livros.isbn = "97885100000250"`            | 500                   | 1                   |
| `livros.categoria = "Computação"`           | 500                   | 76                  |
| `usuarios.email = "usuario50@email.com"`    | 100                   | 1                   |
| `usuarios.curso = "Engenharia de Software"` | 100                   | 24                  |

Sem índice o plano vencedor é `COLLSCAN` (varre toda a coleção) já com o índice passa a usar o `IXSCAN`, examinando apenas os documentos que casam. Notei que como o banco de dados tem um volume pequeno o tempo é praticamente igual, então a métrica relevante aqui é mais a redução de documentos examinados, o que em larga escala ficaria mais perceptível em relação ao tempo de execução.

---

## Parte 8: Atlas Search

Criei o índice de busca criado pela interface do Atlas na coleção `livros` com o nome `default`, usei o seguinte json:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "titulo": [{ "type": "string" }, { "type": "autocomplete" }],
      "autor": { "type": "string" },
      "categoria": { "type": "string" },
      "palavrasChave": { "type": "string" }
    }
  }
}
```

**[INSERIR PRINT: índice Atlas Search criado e com status Active]**

### Questão 16: Pesquisar livros contendo "mongodb"

```js
db.livros.aggregate([
  {
    $search: {
      index: "default",
      text: { query: "mongodb", path: "palavrasChave" },
    },
  },
  { $limit: 5 },
  {
    $project: {
      _id: 0,
      titulo: 1,
      palavrasChave: 1,
      score: { $meta: "searchScore" },
    },
  },
]);
```

### Questão 17: Pesquisar termos semelhantes a "algoritmo"

```js
db.livros.aggregate([
  {
    $search: {
      index: "default",
      text: {
        query: "algoritmo",
        path: "palavrasChave",
        fuzzy: { maxEdits: 2 },
      },
    },
  },
  { $limit: 5 },
  {
    $project: {
      _id: 0,
      titulo: 1,
      palavrasChave: 1,
      score: { $meta: "searchScore" },
    },
  },
]);
```

### Questão 18: Autocomplete para títulos

```js
db.livros.aggregate([
  {
    $search: {
      index: "default",
      autocomplete: { query: "Livro 12", path: "titulo" },
    },
  },
  { $limit: 10 },
  { $project: { _id: 0, titulo: 1, score: { $meta: "searchScore" } } },
]);
```

---

## Parte 9: Atlas Triggers

Três gatilhos criados na interface (Atlas → Triggers). Tipo: Database Trigger.

### Trigger 1: Registrar em logs toda inserção de empréstimo

Coleção `emprestimos`, evento `Insert`. Function:

```js
exports = async function (changeEvent) {
  const db = context.services.get("mongodb-atlas").db("biblioteca");
  const doc = changeEvent.fullDocument;
  await db.collection("logs").insertOne({
    colecao: "emprestimos",
    operacao: "insert",
    data: new Date(),
    dados: {
      emprestimo_id: doc._id,
      usuario_id: doc.usuario_id,
      livro_id: doc.livro_id,
    },
  });
};
```

**[INSERIR PRINT: configuração do Trigger 1]**

### Trigger 2: Registrar devoluções

Coleção `emprestimos`, evento `Update`. Function:

```js
exports = async function (changeEvent) {
  const doc = changeEvent.fullDocument;
  if (!doc || doc.status !== "devolvido") return;
  const db = context.services.get("mongodb-atlas").db("biblioteca");
  await db.collection("logs").insertOne({
    colecao: "emprestimos",
    operacao: "devolucao",
    data: new Date(),
    dados: {
      emprestimo_id: doc._id,
      usuario_id: doc.usuario_id,
      livro_id: doc.livro_id,
    },
  });
};
```

**[INSERIR PRINT: configuração do Trigger 2]**

### Trigger 3: Notificar quando um livro fica sem exemplares

Coleção `livros`, evento `Update`. Function:

```js
exports = async function (changeEvent) {
  const doc = changeEvent.fullDocument;
  if (!doc || doc.quantidade > 0) return;
  const db = context.services.get("mongodb-atlas").db("biblioteca");
  await db.collection("logs").insertOne({
    colecao: "livros",
    operacao: "sem_estoque",
    data: new Date(),
    dados: { livro_id: doc._id, titulo: doc.titulo },
  });
};
```

**[INSERIR PRINT: configuração do Trigger 3]**

---

## Parte 10: MongoDB Charts

Dashboard criado no MongoDB Charts sobre o banco `biblioteca`.

- **Gráfico 1 (Livros por categoria):** coleção `livros`, agrupado por `categoria` (contagem).
- **Gráfico 2 (Empréstimos por mês):** coleção `emprestimos`, eixo X por mês de `dataEmprestimo`.
- **Gráfico 3 (Top 10 livros):** coleção `emprestimos`, contagem por `livro_id` (limitado a 10).
- **Gráfico 4 (Avaliação média por categoria):** `avaliacoes` + `livros`, média de `nota` por categoria.

**[INSERIR PRINT: dashboard com os 4 gráficos]**

---

## Parte 12: Transações

A criação de empréstimo é executada em uma transação (`session.withTransaction`) com três
operações atômicas: inserir o empréstimo, decrementar a quantidade do livro e registrar o
log. Se qualquer passo falhar, tudo é revertido. Código: `backend/services/loans.service.js`.

```js
const session = client.startSession();
await session.withTransaction(async () => {
  const book = await db
    .collection("livros")
    .findOne({ _id: bookId }, { session });
  if (!book || book.quantidade <= 0)
    throw new Error("Livro sem exemplares disponíveis.");

  const { insertedId } = await db
    .collection("emprestimos")
    .insertOne(loan, { session });
  await db
    .collection("livros")
    .updateOne({ _id: bookId }, { $inc: { quantidade: -1 } }, { session });
  await db.collection("logs").insertOne(
    {
      colecao: "emprestimos",
      operacao: "insert",
      data: new Date(),
      dados: {
        emprestimo_id: insertedId,
        usuario_id: userId,
        livro_id: bookId,
      },
    },
    { session },
  );
});
```

Teste: emprestando um livro com `quantidade: 1`, a segunda tentativa retorna erro e a
quantidade permanece `0`, sem empréstimo nem log órfãos (rollback confirmado).

---

## Parte 14: Modelagem e escalabilidade

**1. Quais coleções devem ser shardadas?**
As coleções que crescem de forma ilimitada com o uso: `emprestimos` e `avaliacoes`
(e, em menor grau, `reservas`). As coleções `usuarios` e `livros` são pequenas e estáveis
(centenas/milhares de documentos), então permanecem não shardadas.

**2. Qual shard key seria utilizada?**

- `emprestimos`: chave composta `{ usuario_id: 1, dataEmprestimo: 1 }` ou `usuario_id`
  com hashing (`{ usuario_id: "hashed" }`).
- `avaliacoes`: `{ livro_id: "hashed" }`.

**3. Justificativa.**
A shard key precisa ter alta cardinalidade, boa distribuição e aparecer nas consultas mais
frequentes. `usuario_id` em `emprestimos` distribui bem a carga (cada usuário gera vários
empréstimos) e atende às consultas por histórico do usuário. A forma _hashed_ evita
"hot shards" quando a inserção é sequencial no tempo; a chave composta com `dataEmprestimo`
favorece consultas por período mantendo localidade. Para `avaliacoes`, `livro_id` hashed
distribui as avaliações uniformemente e serve às consultas de média por livro.

**4. Como o crescimento para 10 milhões de empréstimos afetaria o projeto?**
Com 10M de documentos, índices e sharding tornam-se obrigatórios. Sem índice, consultas
viram varredura completa (COLLSCAN) e degradam linearmente. Com a shard key adequada, leitura
e escrita são distribuídas entre os shards, mantendo desempenho horizontalmente escalável.
Pontos de atenção: consultas que não usam a shard key viram _scatter-gather_ (consultam
todos os shards); agregações pesadas (rankings globais) ficam mais caras e podem exigir
pré-agregação/coleções de resumo; o balanceador precisa distribuir os chunks de forma
homogênea para evitar shards sobrecarregados.

---

## Parte 15: Auditoria e segurança

### Questão 19: Usuários com permissões diferentes

Três usuários com roles distintas no banco `biblioteca`:

- **Administrador:** role `dbOwner` (leitura, escrita e administração do banco).
- **Bibliotecário:** role `readWrite`.
- **Consulta:** role `read`.

O script `db/08-seguranca.js` cria os usuários via `db.createUser()` (equivalente ao que
o Atlas faz no Database Access). Observação: em cluster Atlas M0 (compartilhado) o
`createUser` via mongosh é bloqueado, então no M0 a criação é feita pela UI (Atlas →
Database Access) com as mesmas roles.

```js
db.createUser({
    user: "bibliotecario",
    pwd: "...",
    roles: [{ role: "readWrite", db: "biblioteca" }]
});
```

**[INSERIR PRINT: os três usuários e suas roles (Database Access ou `db.getUsers()`)]**

### Questão 20: IP Access List

Configurada em Atlas → Network Access, liberando apenas os IPs autorizados.

**[INSERIR PRINT: IP Access List]**

### Questão 21: Auditoria pelos logs da aplicação

A aplicação registra operações sensíveis na coleção `logs` (empréstimos, devoluções e
livros sem estoque), gravadas tanto pela transação (Parte 12) quanto pelos Triggers
(Parte 9). Consulta de auditoria:

```js
db.logs.find().sort({ data: -1 }).limit(20);
```

**[INSERIR PRINT: registros da coleção logs]**

---

## Parte 16: Projeto integrado

Aplicação web completa.

**Backend** (`backend/`): Node.js + Express + driver mongodb. CRUD de livros, usuários,
empréstimos, reservas e avaliações, mais endpoints de relatório
(`/relatorios/dashboard`, `/relatorios/livros-populares`, `/relatorios/usuario/:id`).

**Frontend** (`frontend/`): HTML + JS puro, com dashboard administrativo, busca de livros,
histórico do usuário e ranking dos livros mais populares. Consumo da API isolado em
`frontend/services/api.js`.

Execução:

```bash
cd backend && npm install && npm start          # API em http://localhost:3000
cd frontend && python3 -m http.server 5500       # site em http://localhost:5500
```

**[INSERIR PRINT: telas do site em funcionamento]**
