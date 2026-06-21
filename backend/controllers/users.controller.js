import { users } from "../models/users.model.js";
import { toObjectId, notFound } from "../utils.js";

export async function list(req, res) {
    res.json(await users().find().limit(100).toArray());
}

export async function get(req, res) {
    const user = await users().findOne({ _id: toObjectId(req.params.id) });
    if (!user) throw notFound("Usuário");

    res.json(user);
}

export async function create(req, res) {
    const { nome, email, curso, cidade } = req.body;
    if (!nome || !email) return res.status(400).json({ erro: "nome e email são obrigatórios." });

    const doc = { nome, email, curso, cidade, dataCadastro: new Date(), ativo: true };
    const { insertedId } = await users().insertOne(doc);

    res.status(201).json({ _id: insertedId, ...doc });
}

async function updateById(id, fields) {
    const result = await users().updateOne({ _id: toObjectId(id) }, { $set: fields });

    if (!result.matchedCount) throw notFound("Usuário");
}

export async function block(req, res) {
    await updateById(req.params.id, { ativo: false });

    res.json({ ok: true });
}

export async function reactivate(req, res) {
    await updateById(req.params.id, { ativo: true });

    res.json({ ok: true });
}

export async function updateCourse(req, res) {
    const { curso } = req.body;
    if (!curso) return res.status(400).json({ erro: "curso é obrigatório." });

    await updateById(req.params.id, { curso });

    res.json({ ok: true });
}
