// ===== Configuração =====
const API = "https://pokeapi.co/api/v2/pokemon";
const POR_PAGINA = 24;

const lista = document.getElementById("lista-cards");
const mensagem = document.getElementById("mensagem");
const total = document.getElementById("total");
const btnMais = document.getElementById("btn-mais");
const campo = document.getElementById("campo-busca");
const selectGeracao = document.getElementById("geracao");
const btnFavoritos = document.getElementById("btn-favoritos");
const form = document.getElementById("form-busca");

let todos = [];            // lista completa: { id, name }
let filtrados = [];        // resultado dos filtros atuais
let mostrados = 0;         // quantos já viraram card
let versao = 0;            // evita que respostas antigas apareçam depois de um novo filtro
let somenteFavoritos = false;
const detalhes = new Map(); // cache: id -> dados completos

let favoritos = new Set(JSON.parse(localStorage.getItem("favoritos") || "[]"));
const salvarFavoritos = () => localStorage.setItem("favoritos", JSON.stringify([...favoritos]));

function avisar(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.className = erro ? "erro" : "";
}

// ===== fetch =====
async function buscarJson(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Erro ${resposta.status}`);
  return resposta.json();
}

async function obterDetalhe(id) {
  if (!detalhes.has(id)) detalhes.set(id, await buscarJson(`${API}/${id}`));
  return detalhes.get(id);
}

// 1 requisição traz o nome e o número de TODOS os Pokémon
async function carregarLista() {
  try {
    const dados = await buscarJson(`${API}?limit=2000`);
    todos = dados.results
      .map(r => ({ name: r.name, id: Number(r.url.split("/").filter(Boolean).pop()) }))
      .filter(p => p.id < 10000); // ignora formas alternativas
    total.textContent = `Pokédex Nacional · ${todos.length} Pokémon`;
    aplicarFiltros();
  } catch (e) {
    total.textContent = "Sem conexão com a PokéAPI";
    avisar("Não foi possível carregar a lista. Verifique sua conexão e recarregue a página.", true);
  }
}

// ===== Criação dinâmica do card (DOM) =====
function criarCard(p) {
  const card = document.createElement("article");
  card.className = "card";

  const fav = document.createElement("button");
  fav.type = "button";
  fav.className = "fav";
  const atualizarCoracao = () => {
    const ativo = favoritos.has(p.id);
    fav.textContent = ativo ? "♥" : "♡";
    fav.setAttribute("aria-label", `${ativo ? "Remover" : "Favoritar"} ${p.name}`);
  };
  atualizarCoracao();
  fav.addEventListener("click", () => {
    if (favoritos.has(p.id)) favoritos.delete(p.id); else favoritos.add(p.id);
    salvarFavoritos();
    atualizarCoracao();
    if (somenteFavoritos && !favoritos.has(p.id)) {
      card.remove();
      filtrados = filtrados.filter(x => x.id !== p.id);
      mostrados--;
      avisar(`${filtrados.length} Pokémon`);
    }
  });

  const numero = document.createElement("div");
  numero.className = "numero";
  numero.textContent = `#${String(p.id).padStart(4, "0")}`;

  const nome = document.createElement("h2");
  nome.textContent = p.name.replace(/-/g, " ");

  const img = document.createElement("img");
  img.src = p.sprites.front_default || p.sprites.other["official-artwork"].front_default || "";
  img.alt = `Sprite de ${p.name}`;
  img.loading = "lazy";

  const tipos = document.createElement("div");
  tipos.className = "tipos";
  p.types.forEach(t => {
    const tag = document.createElement("span");
    tag.className = "tipo";
    tag.textContent = t.type.name;
    tipos.appendChild(tag);
  });

  const dados = document.createElement("p");
  dados.className = "dados";
  dados.textContent = `${p.height / 10} m · ${p.weight / 10} kg · HP ${p.stats[0].base_stat}`;

  const ver = document.createElement("button");
  ver.type = "button";
  ver.className = "ver";
  ver.textContent = "Ver detalhes";

  card.append(fav, numero, nome, img, tipos, dados, ver);
  // clicar em qualquer parte do card (menos no coração) abre os detalhes
  card.addEventListener("click", ev => { if (!ev.target.closest(".fav")) abrirDetalhe(p); });
  return card;
}

// ===== Janela de detalhes (com descrição) =====
const dialogo = document.getElementById("detalhe");
const conteudo = document.getElementById("detalhe-conteudo");
const especies = new Map(); // cache: id -> dados da espécie (descrição)
const NOMES_STATS = { "hp": "HP", "attack": "Ataque", "defense": "Defesa", "special-attack": "Atq. Esp.", "special-defense": "Def. Esp.", "speed": "Velocidade" };

// A descrição fica em outro endpoint: /pokemon-species/{id}
async function obterEspecie(id) {
  if (!especies.has(id)) especies.set(id, await buscarJson(`https://pokeapi.co/api/v2/pokemon-species/${id}`));
  return especies.get(id);
}

function linha(classe, texto) {
  const el = document.createElement("p");
  el.className = classe;
  el.textContent = texto;
  return el;
}

function montarDetalhe(p, esp) {
  const caixa = document.createElement("div");
  caixa.className = "det";

  const nome = document.createElement("h2");
  nome.textContent = `#${String(p.id).padStart(4, "0")} ${p.name.replace(/-/g, " ")}`;

  const img = document.createElement("img");
  img.src = p.sprites.other["official-artwork"].front_default || p.sprites.front_default || "";
  img.alt = `Imagem de ${p.name}`;

  const tipos = document.createElement("div");
  tipos.className = "tipos";
  p.types.forEach(t => {
    const tag = document.createElement("span");
    tag.className = "tipo";
    tag.textContent = t.type.name;
    tipos.appendChild(tag);
  });

  caixa.append(nome, img);

  // descrição vinda da API (a PokéAPI traz esse texto em inglês)
  const genero = esp && esp.genera.find(g => g.language.name === "en");
  if (genero) caixa.appendChild(linha("genero", genero.genus));
  caixa.appendChild(tipos);

  const textos = esp ? esp.flavor_text_entries.filter(e => e.language.name === "en") : [];
  const texto = textos.length ? textos[textos.length - 1].flavor_text.replace(/[\n\f\r]+/g, " ") : "Descrição indisponível.";
  caixa.appendChild(linha("descricao", texto));
  if (textos.length) caixa.appendChild(linha("nota", "Texto original da PokéAPI, em inglês."));

  caixa.appendChild(linha("info", `Altura: ${p.height / 10} m · Peso: ${p.weight / 10} kg`));
  caixa.appendChild(linha("info", `Habilidades: ${p.abilities.map(a => a.ability.name.replace(/-/g, " ")).join(", ")}`));

  p.stats.forEach(s => {
    const linhaStat = document.createElement("div");
    linhaStat.className = "stat";
    const rotulo = document.createElement("span");
    rotulo.textContent = NOMES_STATS[s.stat.name] || s.stat.name;
    const valor = document.createElement("span");
    valor.textContent = s.base_stat;
    const barra = document.createElement("div");
    barra.className = "barra";
    const preenchido = document.createElement("i");
    preenchido.style.width = `${Math.min(100, (s.base_stat / 255) * 100)}%`;
    barra.appendChild(preenchido);
    linhaStat.append(rotulo, valor, barra);
    caixa.appendChild(linhaStat);
  });
  return caixa;
}

async function abrirDetalhe(p) {
  conteudo.replaceChildren(linha("info", "Carregando..."));
  dialogo.showModal();
  let esp = null;
  try { esp = await obterEspecie(p.id); } catch (e) { /* mostra sem descrição */ }
  conteudo.replaceChildren(montarDetalhe(p, esp));
}

document.getElementById("fechar-detalhe").addEventListener("click", () => dialogo.close());
dialogo.addEventListener("click", ev => { if (ev.target === dialogo) dialogo.close(); }); // clique fora fecha

// ===== Filtros e paginação =====
function aplicarFiltros() {
  const [min, max] = selectGeracao.value.split("-").map(Number);
  const termo = campo.value.trim().toLowerCase().replace(/^#/, "");
  filtrados = todos.filter(p =>
    p.id >= min && p.id <= max &&
    (!somenteFavoritos || favoritos.has(p.id)) &&
    (!termo || p.name.includes(termo) || String(p.id) === termo)
  );
  versao++;
  mostrados = 0;
  lista.replaceChildren();
  carregarMais();
}

async function carregarMais() {
  const minhaVersao = versao;
  const fatia = filtrados.slice(mostrados, mostrados + POR_PAGINA);
  if (fatia.length === 0) {
    btnMais.hidden = true;
    avisar(somenteFavoritos ? "Nenhum favorito ainda. Toque no ♡ de um card." : "Nenhum Pokémon encontrado.", false);
    return;
  }
  btnMais.disabled = true;
  avisar("Carregando...");
  try {
    const dados = await Promise.all(fatia.map(p => obterDetalhe(p.id)));
    if (minhaVersao !== versao) return; // o usuário mudou o filtro enquanto carregava
    dados.forEach(d => lista.appendChild(criarCard(d)));
    mostrados += fatia.length;
    btnMais.hidden = mostrados >= filtrados.length;
    avisar(`${filtrados.length} Pokémon`);
  } catch (e) {
    if (minhaVersao === versao) avisar("Erro ao carregar os Pokémon. Toque em Carregar mais para tentar de novo.", true);
    btnMais.hidden = false;
  } finally {
    if (minhaVersao === versao) btnMais.disabled = false;
  }
}

// ===== Eventos =====
let espera;
campo.addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(aplicarFiltros, 300); });
form.addEventListener("submit", ev => { ev.preventDefault(); clearTimeout(espera); aplicarFiltros(); });
selectGeracao.addEventListener("change", aplicarFiltros);
btnMais.addEventListener("click", carregarMais);
btnFavoritos.addEventListener("click", () => {
  somenteFavoritos = !somenteFavoritos;
  btnFavoritos.setAttribute("aria-pressed", String(somenteFavoritos));
  aplicarFiltros();
});

carregarLista();
