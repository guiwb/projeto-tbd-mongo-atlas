import { reservations } from "../models/reservations.model.js";
import { toObjectId, notFound } from "../utils.js";

export async function list(req, res) {
    const filter = {};
    
    if (req.query.status) filter.status = req.query.status;
    if (req.query.usuario_id) filter.usuario_id = toObjectId(req.query.usuario_id);
    if (req.query.livro_id) filter.livro_id = toObjectId(req.query.livro_id);
    
    res.json(await reservations().find(filter).limit(100).toArray());
}

export async function create(req, res) {
    const { usuario_id, livro_id } = req.body;
    
    if (!usuario_id || !livro_id) {
        return res.status(400).json({ erro: "usuario_id e livro_id são obrigatórios." });
    }
    
    const doc = {
        usuario_id: toObjectId(usuario_id),
        livro_id: toObjectId(livro_id),
        dataReserva: new Date(),
        status: "ativa"
    };
    
    const { insertedId } = await reservations().insertOne(doc);
    
    res.status(201).json({ _id: insertedId, ...doc });
}

export async function finalize(req, res) {
    const result = await reservations().updateOne(
        { _id: toObjectId(req.params.id), status: "ativa" },
        { $set: { status: "finalizada" } }
    );
    
    if (!result.matchedCount) {
        return res.status(409).json({ erro: "Reserva não encontrada ou já finalizada." });
    }
    
    res.json({ ok: true });
}

export async function remove(req, res) {
    const result = await reservations().deleteOne({ _id: toObjectId(req.params.id) });
    
    if (!result.deletedCount) throw notFound("Reserva");
    
    res.json({ ok: true });
}
