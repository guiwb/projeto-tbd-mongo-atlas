import { getDb } from "../db.js";

export const books = () => getDb().collection("livros");
