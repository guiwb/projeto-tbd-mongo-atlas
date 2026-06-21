db = db.getSiblingDB("biblioteca");

print("== Q6: quantidade de livros por categoria ==");
printjson(db.livros.aggregate([
    { $group: { _id: "$categoria", total: { $sum: 1 } } },
    { $sort: { total: -1 } }
]).toArray());

print("== Q7: média de avaliações por livro (top 5) ==");
printjson(db.avaliacoes.aggregate([
    { $group: { _id: "$livro_id", mediaNota: { $avg: "$nota" }, totalAvaliacoes: { $sum: 1 } } },
    {
        $lookup: {
            from: "livros",
            localField: "_id",
            foreignField: "_id",
            as: "livro"
        }
    },
    { $unwind: "$livro" },
    { $project: { _id: 0, titulo: "$livro.titulo", mediaNota: { $round: ["$mediaNota", 2] }, totalAvaliacoes: 1 } },
    { $sort: { mediaNota: -1 } },
    { $limit: 5 }
]).toArray());

print("== Q8: 10 livros mais emprestados ==");
printjson(db.emprestimos.aggregate([
    { $group: { _id: "$livro_id", totalEmprestimos: { $sum: 1 } } },
    { $sort: { totalEmprestimos: -1 } },
    { $limit: 10 },
    {
        $lookup: {
            from: "livros",
            localField: "_id",
            foreignField: "_id",
            as: "livro"
        }
    },
    { $unwind: "$livro" },
    { $project: { _id: 0, titulo: "$livro.titulo", autor: "$livro.autor", totalEmprestimos: 1 } }
]).toArray());

print("== Q9: cursos que mais utilizam a biblioteca ==");
printjson(db.emprestimos.aggregate([
    {
        $lookup: {
            from: "usuarios",
            localField: "usuario_id",
            foreignField: "_id",
            as: "usuario"
        }
    },
    { $unwind: "$usuario" },
    { $group: { _id: "$usuario.curso", totalEmprestimos: { $sum: 1 } } },
    { $sort: { totalEmprestimos: -1 } }
]).toArray());

print("== Q10: taxa de devolução por mês ==");
printjson(db.emprestimos.aggregate([
    {
        $group: {
            _id: { ano: { $year: "$dataEmprestimo" }, mes: { $month: "$dataEmprestimo" } },
            total: { $sum: 1 },
            devolvidos: { $sum: { $cond: [{ $eq: ["$status", "devolvido"] }, 1, 0] } }
        }
    },
    { $project: { _id: 0, ano: "$_id.ano", mes: "$_id.mes", total: 1, devolvidos: 1, taxaDevolucao: { $round: [{ $multiply: [{ $divide: ["$devolvidos", "$total"] }, 100] }, 1] } } },
    { $sort: { ano: 1, mes: 1 } }
]).toArray());

print("== Q11: ranking dos autores mais lidos (top 10) ==");
printjson(db.emprestimos.aggregate([
    {
        $lookup: {
            from: "livros",
            localField: "livro_id",
            foreignField: "_id",
            as: "livro"
        }
    },
    { $unwind: "$livro" },
    { $group: { _id: "$livro.autor", totalEmprestimos: { $sum: 1 } } },
    { $sort: { totalEmprestimos: -1 } },
    { $limit: 10 }
]).toArray());

print("== Q12: livros com nota média inferior a 3 ==");
const lowRated = db.avaliacoes.aggregate([
    { $group: { _id: "$livro_id", mediaNota: { $avg: "$nota" }, totalAvaliacoes: { $sum: 1 } } },
    { $match: { mediaNota: { $lt: 3 } } },
    {
        $lookup: {
            from: "livros",
            localField: "_id",
            foreignField: "_id",
            as: "livro"
        }
    },
    { $unwind: "$livro" },
    { $project: { _id: 0, titulo: "$livro.titulo", mediaNota: { $round: ["$mediaNota", 2] }, totalAvaliacoes: 1 } },
    { $sort: { mediaNota: 1 } }
]).toArray();
print("total: " + lowRated.length);
printjson(lowRated.slice(0, 5));
