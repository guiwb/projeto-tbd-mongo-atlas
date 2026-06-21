import "dotenv/config";
import express from "express";
import cors from "cors";
import { connect } from "./db.js";
import booksRoutes from "./routes/books.routes.js";
import usersRoutes from "./routes/users.routes.js";
import loansRoutes from "./routes/loans.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/livros", booksRoutes);
app.use("/usuarios", usersRoutes);
app.use("/emprestimos", loansRoutes);

app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ erro: err.message || "Erro interno do servidor." });
});

const PORT = process.env.PORT || 3000;

connect()
    .then(() => app.listen(PORT, () => console.log(`API em http://localhost:${PORT}`)))
    .catch((err) => {
        console.error("Falha ao conectar no MongoDB:", err.message);
        process.exit(1);
    });
