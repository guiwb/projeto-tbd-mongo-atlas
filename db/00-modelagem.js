db = db.getSiblingDB("biblioteca");

const collections = ["usuarios", "livros", "emprestimos", "reservas", "avaliacoes", "logs"];
collections.forEach((name) => db.getCollection(name).drop());

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
                ativo: { bsonType: "bool" }
            }
        }
    }
});

db.createCollection("livros", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["isbn", "titulo", "autor", "editora", "ano", "categoria", "palavrasChave", "quantidade"],
            properties: {
                isbn: { bsonType: "string" },
                titulo: { bsonType: "string" },
                autor: { bsonType: "string" },
                editora: { bsonType: "string" },
                ano: { bsonType: "number" },
                categoria: { bsonType: "string" },
                palavrasChave: { bsonType: "array", items: { bsonType: "string" } },
                quantidade: { bsonType: "number" }
            }
        }
    }
});

db.createCollection("emprestimos", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["usuario_id", "livro_id", "dataEmprestimo", "dataPrevistaDevolucao", "status"],
            properties: {
                usuario_id: { bsonType: "objectId" },
                livro_id: { bsonType: "objectId" },
                dataEmprestimo: { bsonType: "date" },
                dataPrevistaDevolucao: { bsonType: "date" },
                dataDevolucao: { bsonType: ["date", "null"] },
                status: { enum: ["emprestado", "devolvido"] }
            }
        }
    }
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
                status: { enum: ["ativa", "finalizada"] }
            }
        }
    }
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
                data: { bsonType: "date" }
            }
        }
    }
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
                dados: { bsonType: "object" }
            }
        }
    }
});

print("Colecoes criadas: " + db.getCollectionNames().join(", "));
