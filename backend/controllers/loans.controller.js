import { loans } from "../models/loans.model.js";
import { logs } from "../models/logs.model.js";
import { toObjectId, notFound } from "../utils.js";
import { createLoanTransactional } from "../services/loans.service.js";

export async function list(req, res) {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    res.json(await loans().find(filter).limit(100).toArray());
}

export async function create(req, res) {
    const { usuario_id, livro_id } = req.body;
    if (!usuario_id || !livro_id) {
        return res.status(400).json({ erro: "usuario_id e livro_id são obrigatórios." });
    }

    const loan = await createLoanTransactional(toObjectId(usuario_id), toObjectId(livro_id));
    res.status(201).json(loan);
}

export async function registerReturn(req, res) {
    const result = await loans().updateOne(
        { _id: toObjectId(req.params.id), status: "emprestado" },
        { $set: { dataDevolucao: new Date(), status: "devolvido" } }
    );
    if (!result.matchedCount) {
        return res.status(409).json({ erro: "Empréstimo não encontrado ou já devolvido." });
    }

    await logs().insertOne({
        colecao: "emprestimos",
        operacao: "devolucao",
        data: new Date(),
        dados: { emprestimo_id: toObjectId(req.params.id) }
    });

    res.json({ ok: true });
}

export async function renew(req, res) {
    const days = Number(req.body?.dias) || 15;

    const loan = await loans().findOne({ _id: toObjectId(req.params.id) });
    if (!loan) throw notFound("Empréstimo");

    if (loan.status !== "emprestado") {
        return res.status(409).json({ erro: "Só é possível renovar empréstimo ativo." });
    }

    const newDueDate = new Date(loan.dataPrevistaDevolucao.getTime() + days * 24 * 60 * 60 * 1000);
    await loans().updateOne(
        { _id: loan._id },
        { $set: { dataPrevistaDevolucao: newDueDate } }
    );

    res.json({ ok: true, dataPrevistaDevolucao: newDueDate });
}
