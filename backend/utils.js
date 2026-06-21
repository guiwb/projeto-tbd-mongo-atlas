import { ObjectId } from "mongodb";

export const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export function toObjectId(id) {
    if (!ObjectId.isValid(id)) {
        const error = new Error("ID inválido.");
        error.status = 400;
        throw error;
    }

    return new ObjectId(id);
}

export function notFound(resource) {
    const error = new Error(`${resource} não encontrado.`);
    error.status = 404;
    return error;
}
