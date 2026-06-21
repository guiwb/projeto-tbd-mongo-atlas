import { getDb } from "../db.js";

export const reservations = () => getDb().collection("reservas");
