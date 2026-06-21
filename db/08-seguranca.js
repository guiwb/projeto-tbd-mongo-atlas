db = db.getSiblingDB("biblioteca");

print("== Q19: criacao de usuarios com permissoes diferentes ==");
print("NOTA: em Atlas M0/compartilhado o createUser e bloqueado; use o Database Access (UI).");

db.createUser({
    user: "admin_biblioteca",
    pwd: "trocar_senha_admin",
    roles: [{ role: "dbOwner", db: "biblioteca" }]
});

db.createUser({
    user: "bibliotecario",
    pwd: "trocar_senha_bib",
    roles: [{ role: "readWrite", db: "biblioteca" }]
});

db.createUser({
    user: "consulta",
    pwd: "trocar_senha_consulta",
    roles: [{ role: "read", db: "biblioteca" }]
});

print("== usuarios do banco ==");
printjson(db.getUsers());

print("== Q21: auditoria pelos logs da aplicacao ==");
printjson(db.logs.find().sort({ data: -1 }).limit(20).toArray());
