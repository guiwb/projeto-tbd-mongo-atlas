# Plano de Execução: Sistema de biblioteca (MongoDB Atlas)

> Documento de planejamento autossuficiente. Um chat novo (sem o histórico desta
> conversa) deve conseguir executar o trabalho lendo **apenas este arquivo + o PDF
> de instruções + `data.js`**.

## Contexto

Trabalho de faculdade: "Sistema de biblioteca com MongoDB Atlas".
Rede de bibliotecas universitárias. 16 partes no PDF (`instructions.pdf`).

**Decisões já tomadas com o usuário:**

- Frontend (Parte 16): **HTML + JS puro** (sem React/build). `services/` = `fetch`.
- Atlas: usuário **já tem cluster (M0/free) e connection string**. Executar direto no Atlas.
- Queries das Partes 4–6: rodar via **mongosh** (scripts `.js` versionáveis).
- Backend: **Node.js + Express + driver mongodb**.
- Idioma: texto ao usuário/UI/docs em **pt-BR**; código e nomes em **inglês**.

## Escopo deste plano

Foco nas **partes codáveis**. Partes de UI/Atlas (prints) ficam como checklist no fim,
sem detalhamento, são tarefas manuais do usuário.

| Parte | O quê                                        | Tipo                                                 | Aqui?           |
| ----- | -------------------------------------------- | ---------------------------------------------------- | --------------- |
| 1     | Modelagem das coleções                       | código (schema/validators)                           | ✅              |
| 2     | Carga inicial (100/500/1000/300/1000)        | código (`data.js`)                                   | ✅              |
| 3     | CRUD backend (livros/usuários/empréstimos)   | código                                               | ✅              |
| 4     | Consultas intermediárias Q1–Q5               | código (mongosh)                                     | ✅              |
| 5     | Aggregation pipeline Q6–Q12                  | código (mongosh)                                     | ✅              |
| 6     | `$lookup` Q13–Q15                            | código (mongosh)                                     | ✅              |
| 7     | Índices + `explain()` antes/depois           | código + análise                                     | ✅              |
| 8     | Atlas Search Q16–Q18                         | índice na UI (print) + queries `$search`             | ✅ (só queries) |
| 9     | Atlas Triggers                               | UI (print) + código da function                      | ✅ (só código)  |
| 12    | Transação (empréstimo + baixa estoque + log) | código                                               | ✅              |
| 16    | App web completo                             | código                                               | ✅              |
| 10    | MongoDB Charts                               | UI (print)                                           | checklist       |
| 14    | Sharding/escalabilidade                      | texto/teoria                                         | checklist       |
| 15    | Auditoria/segurança (roles, IP list)         | UI (print) + logs                                    | checklist       |
| 11    | Data API                                     | **RISCADA no PDF, ignorar** (Data API descontinuada) | ❌              |

> Não existe "Parte 13" no PDF (pula 12 → 14). As "questões" são numeradas de Q1 a Q21,
> com repetição entre partes; o PDF de entrega pede "as 24 questões".

## ⚠️ Bug no `data.js` (corrigir na Parte 2)

`data.js` referencia `usuariosIds` e `livrosIds` (linhas ~93, 96, 122, 124, 159, 162)
que **nunca são definidos** → quebra na carga de empréstimos/reservas/avaliações.

Correção: capturar os IDs inseridos antes de usá-los, ex.:

```js
db.usuarios.insertMany(usuarios);
const usuariosIds = db.usuarios.find({}, { _id: 1 }).toArray();
db.livros.insertMany(livros);
const livrosIds = db.livros.find({}, { _id: 1 }).toArray();
```

Também falta a coleção **`logs`** (definida na modelagem do PDF, mas sem carga, ok,
nasce vazia e é populada pelos Triggers/transação).

## Estrutura de arquivos proposta

```
projeto-tbd-mongo-atlas/
├── PLANO_EXECUCAO.md          # este arquivo
├── instructions.pdf
├── README.md
├── db/                        # scripts mongosh (Partes 1-9,12)
│   ├── 00-modelagem.js        # createCollection + $jsonSchema validators (Parte 1)
│   ├── 01-carga.js            # data.js corrigido (Parte 2)
│   ├── 02-crud.js             # Parte 3
│   ├── 03-consultas.js        # Parte 4 (Q1-Q5)
│   ├── 04-aggregations.js     # Parte 5 (Q6-Q12)
│   ├── 05-lookup.js           # Parte 6 (Q13-Q15)
│   ├── 06-indices.js          # Parte 7 (createIndex + explain antes/depois)
│   ├── 07-transacao.js        # Parte 12
│   ├── 08-atlas-search.js     # Parte 8 (queries $search Q16-Q18)
│   └── 09-triggers/           # Parte 9 (código das functions p/ colar na UI)
│       ├── trigger1-log-emprestimo.js
│       ├── trigger2-log-devolucao.js
│       └── trigger3-notificacao-sem-estoque.js
├── backend/                   # Parte 16
│   ├── app.js
│   ├── routes/
│   ├── controllers/
│   ├── models/                # (sem Mongoose: helpers de acesso às coleções)
│   └── .env.example           # MONGODB_URI=...
└── frontend/                  # Parte 16 (HTML+JS puro)
    ├── pages/
    ├── components/
    └── services/              # wrappers fetch p/ a API
```

## Detalhamento das questões (estratégia por item)

### Parte 1: Modelagem (`db/00-modelagem.js`)

Criar 6 coleções: `usuarios`, `livros`, `emprestimos`, `reservas`, `avaliacoes`, `logs`,
com os campos mínimos do PDF. Usar `$jsonSchema` validators (bom para nota).

### Parte 2: Carga (`db/01-carga.js`)

`data.js` corrigido (ver bug acima). Volumes: usuarios 100, livros 500, emprestimos 1000,
reservas 300, avaliacoes 1000. Conferir com `countDocuments()` no fim.

### Parte 3: CRUD (`db/02-crud.js` + reusar no backend)

- Livros: inserir, atualizar `quantidade`, alterar `categoria`, remover.
- Usuários: bloquear (`ativo:false`), reativar (`ativo:true`), alterar `curso`.
- Empréstimos: realizar (insert + `status:"emprestado"`), registrar devolução
  (`dataDevolucao`, `status:"devolvido"`), renovar (somar dias em `dataPrevistaDevolucao`).

### Parte 4: Consultas (`db/03-consultas.js`)

- **Q1** Livros categoria "Computação" e `ano > 2020`.
- **Q2** Usuários com `dataCadastro` nos últimos 30 dias (`{$gte: new Date(Date.now()-30*864e5)}`).
- **Q3** Empréstimos em atraso: `status:"emprestado"` e `dataPrevistaDevolucao < hoje`.
- **Q4** Livros nunca emprestados: `$lookup` emprestimos por `livro_id` + filtrar vazio
  (ou `distinct` em emprestimos.livro_id e `$nin`).
- **Q5** Top 10 usuários por nº de empréstimos: `$group` por `usuario_id` + `$sort` + `$limit 10`.

### Parte 5: Aggregation (`db/04-aggregations.js`)

- **Q6** Livros por categoria: `$group categoria $sum 1`.
- **Q7** Média de avaliações por livro: `$group livro_id $avg nota`.
- **Q8** Top 10 livros mais emprestados: `$group livro_id` em emprestimos + `$sort` + `$limit`.
- **Q9** Cursos que mais usam a biblioteca: join emprestimos→usuarios, `$group curso`.
- **Q10** Taxa de devolução por mês: `$group` por mês de `dataEmprestimo`,
  razão devolvidos/total (`$cond` no status).
- **Q11** Ranking autores mais lidos: join emprestimos→livros, `$group autor`.
- **Q12** Livros com nota média < 3: `$group livro_id $avg nota` + `$match <3`.

### Parte 6: `$lookup` (`db/05-lookup.js`)

- **Q13** nome do usuário + título do livro + data de empréstimo (2 lookups + `$project`).
- **Q14** avaliações com usuário, livro, nota, comentário (2 lookups).
- **Q15** relatório completo de 1 usuário: dados pessoais + empréstimos + reservas + avaliações
  (`$lookup` múltiplos a partir de `usuarios`, filtrando 1 `_id`).

### Parte 7: Índices (`db/06-indices.js`)

Criar índices: `livros.titulo`, `livros.autor`, `livros.isbn` (unique), `livros.categoria`,
`usuarios.email` (unique), `usuarios.curso`.
Para cada: rodar uma consulta relevante com `.explain("executionStats")` **antes** e
**depois** do índice; comparar `totalDocsExamined` / `executionTimeMillis`. Registrar prints.

### Parte 8: Atlas Search (`db/08-atlas-search.js`)

Índice Search criado na UI do Atlas (print do usuário). Queries:

- **Q16** `$search` text por "mongodb".
- **Q17** `$search` fuzzy (`fuzzy:{maxEdits:2}`) para "algoritmo".
- **Q18** autocomplete de títulos (mapping `autocomplete` + operador `autocomplete`).

### Parte 9: Triggers (`db/09-triggers/`)

Código das functions (colar na UI do Atlas, prints do usuário):

- **T1** on insert em `emprestimos` → grava em `logs`.
- **T2** on update `status:"devolvido"` → grava em `logs`.
- **T3** on update de `livros.quantidade` para 0 → notificação (log/email stub).

### Parte 12: Transação (`db/07-transacao.js`)

`session.withTransaction`: (1) insert empréstimo, (2) `$inc quantidade -1` no livro,
(3) insert log. Rollback automático se qualquer passo falhar. **Requer driver Node**
(transações multi-doc não rodam bem em script mongosh solto) → implementar no backend.

### Parte 16: App web

- **Backend**: Express + driver mongodb nativo. Rotas CRUD livros/usuários + empréstimos
  - reservas + avaliações. `.env` com `MONGODB_URI`. Reusar queries das Partes 3–6.
- **Frontend** (HTML+JS puro): dashboard administrativo, busca de livros,
  histórico do usuário, ranking dos livros mais populares. `services/` = fetch p/ API.
- **Tratamento de erros** (regra global): nada de `catch` silencioso, toast/alert visível
  no front; no back, responder status + mensagem descritiva em pt-BR.

## Ordem de execução sugerida

1. `00-modelagem.js` → `01-carga.js` (validar counts).
2. `02-crud.js` (testar isolado).
3. `03/04/05` consultas+aggregations+lookup (gerar saídas p/ o PDF).
4. `06-indices.js` (explain antes/depois → prints).
5. `07-transacao.js` (no backend, precisa de session).
6. Backend → Frontend (Parte 16).
7. Atlas UI: Search (P8), Triggers (P9), Charts (P10), Segurança (P15) → prints do usuário.

## Checklist de partes manuais (Atlas UI: prints do usuário, fora do escopo de código)

- [ ] **P8** Criar índice Atlas Search (mapping `titulo`/`palavrasChave`, autocomplete).
- [ ] **P9** Ativar os 3 Triggers e colar o código das functions.
- [ ] **P10 Charts**, Gráficos: livros/categoria, empréstimos/mês, top 10 livros, avaliação média/categoria.
- [ ] **P14 Escalabilidade** (texto): quais coleções shardar (`emprestimos`/`avaliacoes`),
      shard key (ex.: `usuario_id` hashed ou `{livro_id,dataEmprestimo}`), justificativa,
      impacto de 10M empréstimos. → te ajudo a redigir.
- [ ] **P15 Segurança**: 3 roles (admin/bibliotecário/consulta), IP Access List, auditoria via logs.

## Entrega final (do PDF)

1. **PDF** com a resolução das 24 questões (queries + saídas + prints das partes de UI).
2. **ZIP** com `backend/` + `frontend/` + `README.md`.

## Dúvidas em aberto (confirmar antes/durante execução)

- [ ] Confirmar a connection string e o nome do database no Atlas.
- [ ] Versão do Node disponível na máquina (para o backend).
- [ ] Trabalho em dupla? (PDF permite), só impacta autoria, não o código.
