import { getDb } from "../db.js";

export const loans = () => getDb().collection("emprestimos");
