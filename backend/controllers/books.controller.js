import { books } from "../models/books.model.js";
import { toObjectId, notFound } from "../utils.js";

export async function list(req, res) {
    const { categoria, q } = req.query;

    const filter = {};
    if (categoria) filter.categoria = categoria;
    if (q) filter.titulo = { $regex: q, $options: "i" };

    res.json(await books().find(filter).limit(100).toArray());
}

export async function get(req, res) {
    const book = await books().findOne({ _id: toObjectId(req.params.id) });

    if (!book) throw notFound("Livro");

    res.json(book);
}

export async function create(req, res) {
    const { isbn, titulo, autor, editora, ano, categoria, palavrasChave, quantidade } = req.body;

    if (!isbn || !titulo || !autor) {
        return res.status(400).json({ erro: "isbn, titulo e autor são obrigatórios." });
    }

    const doc = {
        isbn, titulo, autor, editora,
        ano: Number(ano),
        categoria,
        palavrasChave: palavrasChave || [],
        quantidade: Number(quantidade) || 0
    }

    const { insertedId } = await books().insertOne(doc);
    res.status(201).json({ _id: insertedId, ...doc });
}

export async function updateQuantity(req, res) {
    const { quantidade } = req.body;
    if (quantidade == null) return res.status(400).json({ erro: "quantidade é obrigatória." });

    const result = await books().updateOne(
        { _id: toObjectId(req.params.id) },
        { $set: { quantidade: Number(quantidade) } }
    );
    if (!result.matchedCount) throw notFound("Livro");

    res.json({ ok: true });
}

export async function updateCategory(req, res) {
    const { categoria } = req.body;
    if (!categoria) return res.status(400).json({ erro: "categoria é obrigatória." });

    const result = await books().updateOne(
        { _id: toObjectId(req.params.id) },
        { $set: { categoria } }
    );
    if (!result.matchedCount) throw notFound("Livro");

    res.json({ ok: true });
}

export async function remove(req, res) {
    const result = await books().deleteOne({ _id: toObjectId(req.params.id) });
    if (!result.deletedCount) throw notFound("Livro");

    res.json({ ok: true });
}
