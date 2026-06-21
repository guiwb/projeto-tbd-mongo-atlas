import { loans } from "../models/loans.model.js";
import { toObjectId, notFound } from "../utils.js";

const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000;

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

    const loanDate = new Date();
    const doc = {
        usuario_id: toObjectId(usuario_id),
        livro_id: toObjectId(livro_id),
        dataEmprestimo: loanDate,
        dataPrevistaDevolucao: new Date(loanDate.getTime() + FIFTEEN_DAYS),
        dataDevolucao: null,
        status: "emprestado"
    }

    const { insertedId } = await loans().insertOne(doc);
    res.status(201).json({ _id: insertedId, ...doc });
}

export async function registerReturn(req, res) {
    const result = await loans().updateOne(
        { _id: toObjectId(req.params.id), status: "emprestado" },
        { $set: { dataDevolucao: new Date(), status: "devolvido" } }
    );
    if (!result.matchedCount) {
        return res.status(409).json({ erro: "Empréstimo não encontrado ou já devolvido." });
    }

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
