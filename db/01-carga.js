db = db.getSiblingDB("biblioteca");

const courses = [
    "Sistemas para Internet",
    "Ciência da Computação",
    "Engenharia de Software",
    "Análise e Desenvolvimento de Sistemas",
    "Engenharia Elétrica"
];

const cities = ["Pelotas", "Porto Alegre", "Rio Grande", "Canguçu", "Bagé"];

let users = [];
for (let i = 1; i <= 100; i++) {
    users.push({
        nome: `Usuario ${i}`,
        email: `usuario${i}@email.com`,
        curso: courses[Math.floor(Math.random() * courses.length)],
        cidade: cities[Math.floor(Math.random() * cities.length)],
        dataCadastro: new Date(
            2024 + Math.floor(Math.random() * 3),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
        ),
        ativo: Math.random() > 0.1
    });
}
db.usuarios.insertMany(users);
const userIds = db.usuarios.find({}, { _id: 1 }).toArray();

const categories = [
    "Computação", "Banco de Dados", "Redes", "Matemática",
    "Engenharia", "Inteligência Artificial", "Programação"
];

const publishers = ["Novatec", "Alta Books", "Pearson", "Campus", "Elsevier"];

let books = [];
for (let i = 1; i <= 500; i++) {
    books.push({
        isbn: `97885${100000000 + i}`,
        titulo: `Livro ${i}`,
        autor: `Autor ${Math.floor(Math.random() * 100) + 1}`,
        editora: publishers[Math.floor(Math.random() * publishers.length)],
        ano: 2000 + Math.floor(Math.random() * 27),
        categoria: categories[Math.floor(Math.random() * categories.length)],
        palavrasChave: ["programação", "algoritmos", "mongodb", "dados"],
        quantidade: Math.floor(Math.random() * 20) + 1
    });
}
db.livros.insertMany(books);
const bookIds = db.livros.find({}, { _id: 1 }).toArray();

let loans = [];
for (let i = 0; i < 1000; i++) {
    let loanDate = new Date(
        2025,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
    );
    let returned = Math.random() > 0.3;
    loans.push({
        usuario_id: userIds[Math.floor(Math.random() * userIds.length)]._id,
        livro_id: bookIds[Math.floor(Math.random() * bookIds.length)]._id,
        dataEmprestimo: loanDate,
        dataPrevistaDevolucao: new Date(loanDate.getTime() + 15 * 24 * 60 * 60 * 1000),
        dataDevolucao: returned
            ? new Date(loanDate.getTime() + 10 * 24 * 60 * 60 * 1000)
            : null,
        status: returned ? "devolvido" : "emprestado"
    });
}
db.emprestimos.insertMany(loans);

let reservations = [];
for (let i = 0; i < 300; i++) {
    reservations.push({
        usuario_id: userIds[Math.floor(Math.random() * userIds.length)]._id,
        livro_id: bookIds[Math.floor(Math.random() * bookIds.length)]._id,
        dataReserva: new Date(
            2025,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
        ),
        status: Math.random() > 0.5 ? "ativa" : "finalizada"
    });
}
db.reservas.insertMany(reservations);

const comments = [
    "Excelente livro", "Muito bom", "Recomendo", "Conteúdo avançado",
    "Boa introdução", "Poderia ser melhor", "Ótima referência"
];

let reviews = [];
for (let i = 0; i < 1000; i++) {
    reviews.push({
        usuario_id: userIds[Math.floor(Math.random() * userIds.length)]._id,
        livro_id: bookIds[Math.floor(Math.random() * bookIds.length)]._id,
        nota: Math.floor(Math.random() * 5) + 1,
        comentario: comments[Math.floor(Math.random() * comments.length)],
        data: new Date(
            2025,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
        )
    });
}
db.avaliacoes.insertMany(reviews);

print("usuarios:    " + db.usuarios.countDocuments());
print("livros:      " + db.livros.countDocuments());
print("emprestimos: " + db.emprestimos.countDocuments());
print("reservas:    " + db.reservas.countDocuments());
print("avaliacoes:  " + db.avaliacoes.countDocuments());
