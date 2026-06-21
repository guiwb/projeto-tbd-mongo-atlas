db = db.getSiblingDB("biblioteca");

const cursos = [
    "Sistemas para Internet",
    "Ciência da Computação",
    "Engenharia de Software",
    "Análise e Desenvolvimento de Sistemas",
    "Engenharia Elétrica"
];

const cidades = ["Pelotas", "Porto Alegre", "Rio Grande", "Canguçu", "Bagé"];

let usuarios = [];
for (let i = 1; i <= 100; i++) {
    usuarios.push({
        nome: `Usuario ${i}`,
        email: `usuario${i}@email.com`,
        curso: cursos[Math.floor(Math.random() * cursos.length)],
        cidade: cidades[Math.floor(Math.random() * cidades.length)],
        dataCadastro: new Date(
            2024 + Math.floor(Math.random() * 3),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
        ),
        ativo: Math.random() > 0.1
    });
}
db.usuarios.insertMany(usuarios);
const usuariosIds = db.usuarios.find({}, { _id: 1 }).toArray();

const categorias = [
    "Computação", "Banco de Dados", "Redes", "Matemática",
    "Engenharia", "Inteligência Artificial", "Programação"
];

const editoras = ["Novatec", "Alta Books", "Pearson", "Campus", "Elsevier"];

let livros = [];
for (let i = 1; i <= 500; i++) {
    livros.push({
        isbn: `97885${100000000 + i}`,
        titulo: `Livro ${i}`,
        autor: `Autor ${Math.floor(Math.random() * 100) + 1}`,
        editora: editoras[Math.floor(Math.random() * editoras.length)],
        ano: 2000 + Math.floor(Math.random() * 27),
        categoria: categorias[Math.floor(Math.random() * categorias.length)],
        palavrasChave: ["programação", "algoritmos", "mongodb", "dados"],
        quantidade: Math.floor(Math.random() * 20) + 1
    });
}
db.livros.insertMany(livros);
const livrosIds = db.livros.find({}, { _id: 1 }).toArray();

let emprestimos = [];
for (let i = 0; i < 1000; i++) {
    let dataEmprestimo = new Date(
        2025,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
    );
    let devolvido = Math.random() > 0.3;
    emprestimos.push({
        usuario_id: usuariosIds[Math.floor(Math.random() * usuariosIds.length)]._id,
        livro_id: livrosIds[Math.floor(Math.random() * livrosIds.length)]._id,
        dataEmprestimo,
        dataPrevistaDevolucao: new Date(dataEmprestimo.getTime() + 15 * 24 * 60 * 60 * 1000),
        dataDevolucao: devolvido
            ? new Date(dataEmprestimo.getTime() + 10 * 24 * 60 * 60 * 1000)
            : null,
        status: devolvido ? "devolvido" : "emprestado"
    });
}
db.emprestimos.insertMany(emprestimos);

let reservas = [];
for (let i = 0; i < 300; i++) {
    reservas.push({
        usuario_id: usuariosIds[Math.floor(Math.random() * usuariosIds.length)]._id,
        livro_id: livrosIds[Math.floor(Math.random() * livrosIds.length)]._id,
        dataReserva: new Date(
            2025,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
        ),
        status: Math.random() > 0.5 ? "ativa" : "finalizada"
    });
}
db.reservas.insertMany(reservas);

const comentarios = [
    "Excelente livro", "Muito bom", "Recomendo", "Conteúdo avançado",
    "Boa introdução", "Poderia ser melhor", "Ótima referência"
];

let avaliacoes = [];
for (let i = 0; i < 1000; i++) {
    avaliacoes.push({
        usuario_id: usuariosIds[Math.floor(Math.random() * usuariosIds.length)]._id,
        livro_id: livrosIds[Math.floor(Math.random() * livrosIds.length)]._id,
        nota: Math.floor(Math.random() * 5) + 1,
        comentario: comentarios[Math.floor(Math.random() * comentarios.length)],
        data: new Date(
            2025,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1
        )
    });
}
db.avaliacoes.insertMany(avaliacoes);

print("usuarios:    " + db.usuarios.countDocuments());
print("livros:      " + db.livros.countDocuments());
print("emprestimos: " + db.emprestimos.countDocuments());
print("reservas:    " + db.reservas.countDocuments());
print("avaliacoes:  " + db.avaliacoes.countDocuments());
