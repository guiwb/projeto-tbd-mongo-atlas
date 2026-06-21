import { getClient, getDb } from "../db.js";

const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000;

export async function createLoanTransactional(userId, bookId) {
    const client = getClient();
    const db = getDb();
    const session = client.startSession();

    try {
        let loan;
        await session.withTransaction(async () => {
            const book = await db.collection("livros").findOne({ _id: bookId }, { session });
            if (!book) {
                const error = new Error("Livro não encontrado.");
                error.status = 404;
                throw error;
            }
            if (book.quantidade <= 0) {
                const error = new Error("Livro sem exemplares disponíveis.");
                error.status = 409;
                throw error;
            }

            const loanDate = new Date();
            loan = {
                usuario_id: userId,
                livro_id: bookId,
                dataEmprestimo: loanDate,
                dataPrevistaDevolucao: new Date(loanDate.getTime() + FIFTEEN_DAYS),
                dataDevolucao: null,
                status: "emprestado"
            };
            const { insertedId } = await db.collection("emprestimos").insertOne(loan, { session });
            loan._id = insertedId;

            await db.collection("livros").updateOne(
                { _id: bookId },
                { $inc: { quantidade: -1 } },
                { session }
            );

            await db.collection("logs").insertOne({
                colecao: "emprestimos",
                operacao: "insert",
                data: new Date(),
                dados: { emprestimo_id: insertedId, usuario_id: userId, livro_id: bookId }
            }, { session });
        });

        return loan;
    } finally {
        await session.endSession();
    }
}
