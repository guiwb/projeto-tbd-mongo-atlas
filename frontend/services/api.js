const BASE_URL = "http://localhost:3000";

async function request(path) {
    let response;
    try {
        response = await fetch(BASE_URL + path);
    } catch (e) {
        throw new Error("Falha de conexão com o servidor. Verifique se a API está no ar.");
    }
    if (!response.ok) {
        let message = "Erro inesperado ao comunicar com a API.";
        try {
            const body = await response.json();
            if (body && body.erro) message = body.erro;
        } catch (e) {}
        throw new Error(message);
    }
    return response.json();
}

export const api = {
    dashboard: () => request("/relatorios/dashboard"),
    popularBooks: (limit = 10) => request(`/relatorios/livros-populares?limit=${limit}`),
    userReport: (id) => request(`/relatorios/usuario/${id}`),
    searchBooks: (q) => request(`/livros?q=${encodeURIComponent(q)}`),
    listUsers: () => request("/usuarios")
};
