// ===== Configuração =====
const API = "https://pokeapi.co/api/v2/pokemon";
const POR_PAGINA = 20;

const lista = document.getElementById("lista-cards");
const mensagem = document.getElementById("mensagem");
const btnMais = document.getElementById("btn-mais");
const form = document.getElementById("form-busca");
const campo = document.getElementById("campo-busca");
const btnFavoritos = document.getElementById("btn-favoritos");

let offset = 0;
let somenteFavoritos = false;
const cache = new Map(); // id -> dados do Pokémon

// Favoritos salvos no navegador
let favoritos = new Set(JSON.parse(localStorage.getItem("favoritos") || "[]"));
const salvarFavoritos = () => localStorage.setItem("favoritos", JSON.stringify([...favoritos]));

function avisar(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.className = erro ? "erro" : "";
}

// ===== Consumo da API com fetch =====
async function buscarJson(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
  return resposta.json();
}

// ===== Criação dinâmica do card (DOM) =====
function criarCard(p) {
  const card = document.createElement("article");
  card.className = "card";

  const fav = document.createElement("button");
  fav.className = "fav";
  const atualizarCoracao = () => {
    const ativo = favoritos.has(p.id);
    fav.textContent = ativo ? "♥" : "♡";
    fav.setAttribute("aria-label", `${ativo ? "Remover" : "Favoritar"} ${p.name}`);
  };
  atualizarCoracao();
  fav.addEventListener("click", () => {
    favoritos.has(p.id) ? favoritos.delete(p.id) : favoritos.add(p.id);
    salvarFavoritos();
    atualizarCoracao();
    if (somenteFavoritos) mostrarFavoritos();
  });

  const numero = document.createElement("span");
  numero.className = "numero";
  numero.textContent = `#${String(p.id).padStart(3, "0")}`;

  const nome = document.createElement("h2");
  nome.textContent = p.name;

  const img = document.createElement("img");
  img.src = p.sprites.other["official-artwork"].front_default || p.sprites.front_default;
  img.alt = `Imagem de ${p.name}`;
  img.loading = "lazy";

  const tipos = document.createElement("div");
  tipos.className = "tipos";
  p.types.forEach(t => {
    const tag = document.createElement("span");
    tag.className = `tipo ${t.type.name}`;
    tag.textContent = t.type.name;
    tipos.appendChild(tag);
  });

  const dados = document.createElement("p");
  dados.className = "dados";
  dados.textContent = `Altura: ${p.height / 10} m · Peso: ${p.weight / 10} kg · HP base: ${p.stats[0].base_stat}`;

  card.append(fav, numero, nome, img, tipos, dados);
  return card;
}

function exibir(pokemons, limpar = false) {
  if (limpar) lista.replaceChildren();
  pokemons.forEach(p => lista.appendChild(criarCard(p)));
}

// ===== Carregar página da lista =====
async function carregarMais() {
  btnMais.disabled = true;
  avisar("Carregando Pokémon...");
  try {
    const pagina = await buscarJson(`${API}?limit=${POR_PAGINA}&offset=${offset}`);
    const detalhes = await Promise.all(pagina.results.map(r => buscarJson(r.url)));
    detalhes.forEach(d => cache.set(d.id, d));
    exibir(detalhes);
    offset += POR_PAGINA;
    avisar("");
  } catch (e) {
    avisar("Não foi possível carregar os Pokémon. Verifique sua conexão e tente de novo.", true);
  } finally {
    btnMais.disabled = false;
  }
}

// ===== Busca por nome ou número =====
form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const termo = campo.value.trim().toLowerCase();
  if (!termo) return;
  somenteFavoritos = false;
  btnFavoritos.setAttribute("aria-pressed", "false");
  avisar("Buscando...");
  try {
    const p = await buscarJson(`${API}/${encodeURIComponent(termo)}`);
    cache.set(p.id, p);
    exibir([p], true);
    btnMais.hidden = true;
    avisar("");
  } catch (e) {
    avisar(`Nenhum Pokémon encontrado para "${termo}".`, true);
  }
});

// ===== Favoritos =====
async function mostrarFavoritos() {
  btnMais.hidden = true;
  if (favoritos.size === 0) {
    lista.replaceChildren();
    avisar("Você ainda não favoritou nenhum Pokémon. Toque no ♡ de um card.");
    return;
  }
  avisar("");
  const dados = await Promise.all([...favoritos].map(async id => {
    if (!cache.has(id)) cache.set(id, await buscarJson(`${API}/${id}`));
    return cache.get(id);
  }));
  exibir(dados, true);
}

btnFavoritos.addEventListener("click", () => {
  somenteFavoritos = !somenteFavoritos;
  btnFavoritos.setAttribute("aria-pressed", String(somenteFavoritos));
  if (somenteFavoritos) {
    mostrarFavoritos();
  } else {
    lista.replaceChildren();
    offset = 0;
    btnMais.hidden = false;
    carregarMais();
  }
});

btnMais.addEventListener("click", carregarMais);
campo.addEventListener("input", () => {
  if (campo.value === "" && !somenteFavoritos && offset > 0 && lista.children.length === 1) {
    lista.replaceChildren(); offset = 0; btnMais.hidden = false; carregarMais();
  }
});

carregarMais();
