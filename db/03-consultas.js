db = db.getSiblingDB("biblioteca");

print("== Q1: livros de Computação publicados após 2020 ==");
const q1Filter = { categoria: "Computação", ano: { $gt: 2020 } };
print("total: " + db.livros.countDocuments(q1Filter));
printjson(db.livros.find(q1Filter).limit(3).toArray());

print("== Q2: usuários cadastrados nos últimos 30 dias ==");
const now = new Date();
const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const recentFilter = { dataCadastro: { $gte: cutoff, $lte: now } };
print("total: " + db.usuarios.countDocuments(recentFilter));
printjson(db.usuarios.find(recentFilter).limit(3).toArray());

print("== Q3: empréstimos em atraso ==");
const overdueFilter = { status: "emprestado", dataPrevistaDevolucao: { $lt: new Date() } };
print("total: " + db.emprestimos.countDocuments(overdueFilter));
printjson(db.emprestimos.find(overdueFilter).limit(3).toArray());

print("== Q4: livros que nunca foram emprestados ==");
const neverLoaned = db.livros.aggregate([
    {
        $lookup: {
            from: "emprestimos",
            localField: "_id",
            foreignField: "livro_id",
            as: "emprestimos"
        }
    },
    { $match: { emprestimos: { $size: 0 } } },
    { $project: { titulo: 1, autor: 1, categoria: 1 } }
]).toArray();
print("total: " + neverLoaned.length);
printjson(neverLoaned.slice(0, 3));

print("== Q5: 10 usuários com maior número de empréstimos ==");
const topBorrowers = db.emprestimos.aggregate([
    { $group: { _id: "$usuario_id", totalEmprestimos: { $sum: 1 } } },
    { $sort: { totalEmprestimos: -1 } },
    { $limit: 10 },
    {
        $lookup: {
            from: "usuarios",
            localField: "_id",
            foreignField: "_id",
            as: "usuario"
        }
    },
    { $unwind: "$usuario" },
    { $project: { _id: 0, nome: "$usuario.nome", email: "$usuario.email", totalEmprestimos: 1 } }
]).toArray();
printjson(topBorrowers);
