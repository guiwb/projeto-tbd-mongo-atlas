db = db.getSiblingDB("biblioteca");

print("== Q16: livros contendo 'mongodb' ==");
printjson(db.livros.aggregate([
    { $search: { index: "default", text: { query: "mongodb", path: "palavrasChave" } } },
    { $limit: 5 },
    { $project: { _id: 0, titulo: 1, palavrasChave: 1, score: { $meta: "searchScore" } } }
]).toArray());

print("== Q17: busca fuzzy por termo semelhante a 'algoritmo' ==");
printjson(db.livros.aggregate([
    {
        $search: {
            index: "default",
            text: { query: "algoritmo", path: "palavrasChave", fuzzy: { maxEdits: 2 } }
        }
    },
    { $limit: 5 },
    { $project: { _id: 0, titulo: 1, palavrasChave: 1, score: { $meta: "searchScore" } } }
]).toArray());

print("== Q18: autocomplete de títulos para 'Livro 12' ==");
printjson(db.livros.aggregate([
    { $search: { index: "default", autocomplete: { query: "Livro 12", path: "titulo" } } },
    { $limit: 10 },
    { $project: { _id: 0, titulo: 1, score: { $meta: "searchScore" } } }
]).toArray());
