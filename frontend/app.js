import { api } from "./services/api.js";

function renderTable(headers, rows) {
    const thead = `<tr>${headers.map((h) => `<th>${h.label}</th>`).join("")}</tr>`;
    const tbody = rows.map((row) =>
        `<tr>${headers.map((h) => `<td>${h.value(row)}</td>`).join("")}</tr>`
    ).join("");
    return `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
}

function showError(el, message) {
    el.className = "erro";
    el.textContent = message;
}

function formatDate(value) {
    return value ? new Date(value).toLocaleDateString("pt-BR") : "-";
}

async function loadDashboard() {
    const el = document.getElementById("dashboard-conteudo");
    try {
        const data = await api.dashboard();
        const t = data.totais;
        const categorias = data.livrosPorCategoria
            .map((c) => `${c._id}: ${c.total}`)
            .join(" · ");
        el.className = "";
        el.innerHTML = `
            <ul class="stats">
                <li><strong>Usuários:</strong> ${t.totalUsuarios}</li>
                <li><strong>Livros:</strong> ${t.totalLivros}</li>
                <li><strong>Empréstimos:</strong> ${t.totalEmprestimos}</li>
                <li><strong>Reservas:</strong> ${t.totalReservas}</li>
                <li><strong>Avaliações:</strong> ${t.totalAvaliacoes}</li>
            </ul>
            <p><strong>Livros por categoria:</strong> ${categorias}</p>`;
    } catch (e) {
        showError(el, e.message);
    }
}

async function runSearch() {
    const el = document.getElementById("busca-resultado");
    const q = document.getElementById("busca-input").value.trim();
    el.className = "muted";
    el.textContent = "Buscando...";
    try {
        const books = await api.searchBooks(q);
        if (!books.length) {
            el.textContent = "Nenhum livro encontrado.";
            return;
        }
        el.className = "";
        el.innerHTML = renderTable([
            { label: "Título", value: (b) => b.titulo },
            { label: "Autor", value: (b) => b.autor },
            { label: "Categoria", value: (b) => b.categoria },
            { label: "Ano", value: (b) => b.ano },
            { label: "Qtd.", value: (b) => b.quantidade }
        ], books);
    } catch (e) {
        showError(el, e.message);
    }
}

async function loadUsers() {
    const select = document.getElementById("historico-select");
    try {
        const users = await api.listUsers();
        select.innerHTML = users
            .map((u) => `<option value="${u._id}">${u.nome} (${u.email})</option>`)
            .join("");
        loadHistory();
    } catch (e) {
        select.innerHTML = "";
        showError(document.getElementById("historico-resultado"), e.message);
    }
}

async function loadHistory() {
    const el = document.getElementById("historico-resultado");
    const id = document.getElementById("historico-select").value;
    if (!id) return;
    el.className = "muted";
    el.textContent = "Carregando...";
    try {
        const report = await api.userReport(id);
        el.className = "";
        const resumo = `<p><strong>${report.nome}</strong> — ${report.curso || "-"} · `
            + `${report.totalEmprestimos} empréstimos, ${report.totalReservas} reservas, `
            + `${report.totalAvaliacoes} avaliações</p>`;
        const tabela = report.emprestimos.length
            ? renderTable([
                { label: "Livro", value: (l) => l.livro_id },
                { label: "Empréstimo", value: (l) => formatDate(l.dataEmprestimo) },
                { label: "Prev. devolução", value: (l) => formatDate(l.dataPrevistaDevolucao) },
                { label: "Devolvido em", value: (l) => formatDate(l.dataDevolucao) },
                { label: "Status", value: (l) => l.status }
            ], report.emprestimos)
            : `<p class="muted">Nenhum empréstimo registrado.</p>`;
        el.innerHTML = resumo + tabela;
    } catch (e) {
        showError(el, e.message);
    }
}

async function loadRanking() {
    const el = document.getElementById("ranking-resultado");
    try {
        const books = await api.popularBooks(10);
        el.className = "";
        el.innerHTML = renderTable([
            { label: "#", value: (b) => books.indexOf(b) + 1 },
            { label: "Título", value: (b) => b.titulo },
            { label: "Autor", value: (b) => b.autor },
            { label: "Empréstimos", value: (b) => b.totalEmprestimos }
        ], books);
    } catch (e) {
        showError(el, e.message);
    }
}

document.querySelectorAll("nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll("nav button").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll("main section").forEach((s) => s.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");
    });
});

document.getElementById("busca-btn").addEventListener("click", runSearch);
document.getElementById("busca-input").addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") runSearch();
});
document.getElementById("historico-select").addEventListener("change", loadHistory);

loadDashboard();
loadUsers();
loadRanking();
