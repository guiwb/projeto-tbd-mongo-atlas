import { getDb } from "../db.js";

export const users = () => getDb().collection("usuarios");
