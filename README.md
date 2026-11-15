# ⚡ Pokédex — Front-End

Aplicação web interativa desenvolvida como projeto acadêmico da disciplina **Web Development Front-End**, do curso de **Análise e Desenvolvimento de Sistemas — UniFECAF**.

O projeto utiliza a **PokéAPI** para consultar e apresentar informações sobre Pokémon de maneira dinâmica, com uma interface responsiva e intuitiva.

## 🌐 Acesse o projeto

**[Clique aqui para acessar a Pokédex](https://otavionactogarcia-lang.github.io/pokedex-front-end/)**

## 🚀 Funcionalidades

- Listagem de Pokémon com cards dinâmicos.
- Pesquisa por nome ou número.
- Visualização de detalhes e descrições ao clicar em um Pokémon.
- Sistema de favoritos.
- Paginação para carregar mais Pokémon.
- Cache de dados para otimizar as consultas.
- Interface responsiva para computadores e dispositivos móveis.
- Tratamento de erros nas requisições à API.

## 🛠️ Tecnologias utilizadas

- **HTML5:** estrutura da aplicação.
- **CSS3:** estilização e responsividade.
- **JavaScript:** interatividade, consumo da API e manipulação do DOM.
- **PokéAPI:** fornecimento dos dados dos Pokémon.
- **GitHub Pages:** hospedagem do site.

## 🔗 Integração com a API

A aplicação utiliza a API pública [PokéAPI](https://pokeapi.co/), realizando requisições HTTP com `fetch()`.

Principais endpoints:

- `/pokemon?limit=20&offset=0` — listagem paginada.
- `/pokemon/{id}` — informações detalhadas.
- `/pokemon-species/{id}` — descrições dos Pokémon.

Os cards são criados dinamicamente pelo JavaScript por meio de métodos como `createElement()` e `appendChild()`.

## 💻 Como executar

1. Faça o download ou clone este repositório.
2. Abra a pasta do projeto no Visual Studio Code.
3. Execute o arquivo `index.html` utilizando a extensão Live Server ou um servidor HTTP local.
4. Utilize a Pokédex normalmente, com conexão à internet para consultar a API.

## 📚 Informações acadêmicas

**Instituição:** UniFECAF

**Curso:** Análise e Desenvolvimento de Sistemas

**Disciplina:** Web Development Front-End

**Tutor:** Fernando Leonid

**Aluno:** Otávio Nascimento Garcia

**Ano:** 2026

## 👨‍💻 Autor

Desenvolvido por **Otávio Nascimento Garcia** como projeto acadêmico para aplicação prática de HTML, CSS, JavaScript e integração com APIs REST.
