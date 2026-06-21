db = db.getSiblingDB("biblioteca");

print("== Q13: empréstimos com nome do usuário, título do livro e data (5 primeiros) ==");
printjson(db.emprestimos.aggregate([
    { $lookup: { from: "usuarios", localField: "usuario_id", foreignField: "_id", as: "usuario" } },
    { $lookup: { from: "livros", localField: "livro_id", foreignField: "_id", as: "livro" } },
    { $unwind: "$usuario" },
    { $unwind: "$livro" },
    { $project: { _id: 0, usuario: "$usuario.nome", livro: "$livro.titulo", dataEmprestimo: 1 } },
    { $limit: 5 }
]).toArray());

print("== Q14: avaliações com usuário, livro, nota e comentário (5 primeiros) ==");
printjson(db.avaliacoes.aggregate([
    { $lookup: { from: "usuarios", localField: "usuario_id", foreignField: "_id", as: "usuario" } },
    { $lookup: { from: "livros", localField: "livro_id", foreignField: "_id", as: "livro" } },
    { $unwind: "$usuario" },
    { $unwind: "$livro" },
    { $project: { _id: 0, usuario: "$usuario.nome", livro: "$livro.titulo", nota: 1, comentario: 1 } },
    { $limit: 5 }
]).toArray());

print("== Q15: relatório completo de um usuário ==");
const sampleUser = db.usuarios.findOne();
printjson(db.usuarios.aggregate([
    { $match: { _id: sampleUser._id } },
    { $lookup: { from: "emprestimos", localField: "_id", foreignField: "usuario_id", as: "emprestimos" } },
    { $lookup: { from: "reservas", localField: "_id", foreignField: "usuario_id", as: "reservas" } },
    { $lookup: { from: "avaliacoes", localField: "_id", foreignField: "usuario_id", as: "avaliacoes" } },
    {
        $project: {
            _id: 0,
            nome: 1, email: 1, curso: 1, cidade: 1,
            totalEmprestimos: { $size: "$emprestimos" },
            totalReservas: { $size: "$reservas" },
            totalAvaliacoes: { $size: "$avaliacoes" },
            emprestimos: 1, reservas: 1, avaliacoes: 1
        }
    }
]).toArray()[0]);
