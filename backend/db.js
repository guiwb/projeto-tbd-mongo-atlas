import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
let db;

export async function connect() {
    if (db) return db;
    await client.connect();
    db = client.db(process.env.DB_NAME || "biblioteca");
    return db;
}

export function getDb() {
    if (!db) throw new Error("Banco não conectado.");
    return db;
}

export function getClient() {
    return client;
}
