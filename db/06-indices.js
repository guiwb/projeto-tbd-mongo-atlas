db = db.getSiblingDB("biblioteca");

function indexName(spec) {
    return Object.entries(spec).map(([k, v]) => `${k}_${v}`).join("_");
}

function metrics(explain) {
    const es = explain.executionStats;
    const plan = JSON.stringify(explain.queryPlanner.winningPlan);
    return {
        stage: plan.includes("IXSCAN") ? "IXSCAN" : "COLLSCAN",
        docsExamined: es.totalDocsExamined,
        returned: es.nReturned,
        timeMs: es.executionTimeMillis
    };
}

function compare(collection, spec, query, options = {}) {
    const coll = db.getCollection(collection);
    const name = indexName(spec);

    try { coll.dropIndex(name); } catch (e) {}

    const before = metrics(coll.find(query).explain("executionStats"));
    coll.createIndex(spec, options);
    const after = metrics(coll.find(query).explain("executionStats"));

    print(`-- ${collection}.${name} | query ${JSON.stringify(query)}`);
    print(`   antes:  ${before.stage} docsExaminados=${before.docsExamined} tempo=${before.timeMs}ms`);
    print(`   depois: ${after.stage} docsExaminados=${after.docsExamined} tempo=${after.timeMs}ms`);
}

print("== Parte 7: índices e comparação de desempenho ==");
compare("livros", { titulo: 1 }, { titulo: "Livro 250" });
compare("livros", { autor: 1 }, { autor: "Autor 50" });
compare("livros", { isbn: 1 }, { isbn: "97885100000250" }, { unique: true });
compare("livros", { categoria: 1 }, { categoria: "Computação" });
compare("usuarios", { email: 1 }, { email: "usuario50@email.com" }, { unique: true });
compare("usuarios", { curso: 1 }, { curso: "Engenharia de Software" });

print("\nÍndices em livros:");
printjson(db.livros.getIndexes().map((i) => i.name));
print("Índices em usuarios:");
printjson(db.usuarios.getIndexes().map((i) => i.name));
