import { reviews } from "../models/reviews.model.js";
import { toObjectId, notFound } from "../utils.js";

export async function list(req, res) {
    const filter = {};
    
    if (req.query.livro_id) filter.livro_id = toObjectId(req.query.livro_id);
    if (req.query.usuario_id) filter.usuario_id = toObjectId(req.query.usuario_id);
    
    res.json(await reviews().find(filter).limit(100).toArray());
}

export async function create(req, res) {
    const { usuario_id, livro_id, nota, comentario } = req.body;
    if (!usuario_id || !livro_id || nota == null) {
        return res.status(400).json({ erro: "usuario_id, livro_id e nota são obrigatórios." });
    }
    
    const numericNota = Number(nota);
    if (!Number.isInteger(numericNota) || numericNota < 1 || numericNota > 5) {
        return res.status(400).json({ erro: "nota deve ser um inteiro entre 1 e 5." });
    }
    
    const doc = {
        usuario_id: toObjectId(usuario_id),
        livro_id: toObjectId(livro_id),
        nota: numericNota,
        comentario: comentario || "",
        data: new Date()
    }
    
    const { insertedId } = await reviews().insertOne(doc);
    
    res.status(201).json({ _id: insertedId, ...doc });
}

export async function remove(req, res) {
    const result = await reviews().deleteOne({ _id: toObjectId(req.params.id) });

    if (!result.deletedCount) throw notFound("Avaliação");

    res.json({ ok: true });
}
