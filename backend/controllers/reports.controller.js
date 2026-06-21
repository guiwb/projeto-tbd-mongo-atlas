import { books } from "../models/books.model.js";
import { users } from "../models/users.model.js";
import { loans } from "../models/loans.model.js";
import { reservations } from "../models/reservations.model.js";
import { reviews } from "../models/reviews.model.js";
import { toObjectId, notFound } from "../utils.js";

export async function popularBooks(req, res) {
    const limit = Number(req.query.limit) || 10;
    const result = await loans().aggregate([
        { $group: { _id: "$livro_id", totalEmprestimos: { $sum: 1 } } },
        { $sort: { totalEmprestimos: -1 } },
        { $limit: limit },
        { $lookup: { from: "livros", localField: "_id", foreignField: "_id", as: "livro" } },
        { $unwind: "$livro" },
        { $project: { _id: "$livro._id", titulo: "$livro.titulo", autor: "$livro.autor", totalEmprestimos: 1 } }
    ]).toArray();
    res.json(result);
}

export async function userReport(req, res) {
    const id = toObjectId(req.params.id);
    const result = await users().aggregate([
        { $match: { _id: id } },
        { $lookup: { from: "emprestimos", localField: "_id", foreignField: "usuario_id", as: "emprestimos" } },
        { $lookup: { from: "reservas", localField: "_id", foreignField: "usuario_id", as: "reservas" } },
        { $lookup: { from: "avaliacoes", localField: "_id", foreignField: "usuario_id", as: "avaliacoes" } },
        {
            $project: {
                nome: 1, email: 1, curso: 1, cidade: 1, ativo: 1,
                totalEmprestimos: { $size: "$emprestimos" },
                totalReservas: { $size: "$reservas" },
                totalAvaliacoes: { $size: "$avaliacoes" },
                emprestimos: 1, reservas: 1, avaliacoes: 1
            }
        }
    ]).toArray();
    if (!result.length) throw notFound("Usuário");
    res.json(result[0]);
}

export async function dashboard(req, res) {
    const [totalUsuarios, totalLivros, totalEmprestimos, totalReservas, totalAvaliacoes] = await Promise.all([
        users().countDocuments(),
        books().countDocuments(),
        loans().countDocuments(),
        reservations().countDocuments(),
        reviews().countDocuments()
    ]);

    const livrosPorCategoria = await books().aggregate([
        { $group: { _id: "$categoria", total: { $sum: 1 } } },
        { $sort: { total: -1 } }
    ]).toArray();

    const emprestimosPorMes = await loans().aggregate([
        { $group: { _id: { $month: "$dataEmprestimo" }, total: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, mes: "$_id", total: 1 } }
    ]).toArray();

    res.json({
        totais: { totalUsuarios, totalLivros, totalEmprestimos, totalReservas, totalAvaliacoes },
        livrosPorCategoria,
        emprestimosPorMes
    });
}
