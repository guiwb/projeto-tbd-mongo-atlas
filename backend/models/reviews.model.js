import { getDb } from "../db.js";

export const reviews = () => getDb().collection("avaliacoes");
