import { getDb } from "../db.js";

export const logs = () => getDb().collection("logs");
