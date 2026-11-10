# 🧁 Cantinho Doce

Site de receitas de doces, feito com HTML, CSS e JavaScript puros, para a disciplina de **Programação Web I** (Engenharia de Software – UEPA).

🔗 **Site publicado:** (https://mari2006meneses-png.github.io/Cantinho_Doce/)

---

## Descrição e objetivo

O **Cantinho Doce** reúne receitas de doces em um só lugar. Qualquer pessoa pode buscar receitas, ver ingredientes e modo de preparo e, depois de criar uma conta, favoritar, avaliar, comentar e publicar as próprias receitas.

O projeto aplica o que foi estudado na disciplina: integração de HTML, CSS e JavaScript, boas práticas de código, acessibilidade, validação de padrões, otimização e publicação de uma aplicação estática.

> **Aplicação estática:** não há servidor nem banco de dados. Os dados criados pelos usuários (contas, favoritos, notas, comentários e receitas publicadas) ficam salvos no navegador, por meio do `localStorage`.

---

## Tecnologias utilizadas

| Tecnologia | Uso |
|---|---|
| **HTML5** | Estrutura semântica das páginas |
| **CSS3** | Visual, layout em grid e flexbox, responsividade, animações e variáveis de cor |
| **JavaScript** | Busca, filtros, contas, favoritos, avaliações, comentários e publicação de receitas |
| **Font Awesome 6.4.0** | Ícones (carregado por CDN) |

Também usamos recursos do próprio navegador, sem instalar nada: `localStorage`, Web Crypto (hash da senha), Web Speech (leitura da receita em voz alta), Canvas e FileReader (redimensionar fotos).

Não foram usados frameworks (React, Vue, Bootstrap etc.).

---

## ▶Como executar localmente

1. Baixe ou clone o repositório.
2. Mantenha a estrutura de pastas como está (veja abaixo).
3. Abra o arquivo `index.html` no navegador.

Opcional: no VS Code, use a extensão **Live Server** para abrir o projeto em `localhost`.

**Observações**
- É preciso ter internet para os ícones do Font Awesome aparecerem.
- Os dados ficam salvos no navegador. Cada endereço (por exemplo, `file://`, `localhost` e o site publicado) tem os seus próprios dados, e o site recém-publicado começa vazio.
- Para limpar os dados de teste, abra o Console (F12) e execute:
  ```js
  Object.keys(localStorage).filter(k => k.startsWith('cd_')).forEach(k => localStorage.removeItem(k))
  ```

---

## Estrutura dos arquivos

```
cantinho-doce/
├── index.html        # Página inicial: lista de receitas, busca e filtros
├── receita.html      # Página de uma receita (serve para todas)
├── login.html        # Entrar e criar conta
├── perfil.html       # Perfil: favoritas, minhas receitas e publicar receita
├── css/
│   └── style.css     # Todo o visual do site
├── js/
│   ├── comum.js      # Código compartilhado: dados das receitas, contas, favoritos, cards
│   ├── script.js     # Lógica da página inicial (busca, filtros, ordenação)
│   ├── receita.js    # Lógica da página da receita
│   ├── login.js      # Lógica de entrar e cadastrar
│   └── perfil.js     # Lógica do perfil
├── imagens/          # Logo, fotos das receitas e fotos de autores
└── README.md
```

A página de receita é **uma só** para todas as receitas: o link tem o formato `receita.html?id=nome-da-receita`, e o `receita.js` lê esse `id` e preenche a tela com os dados.

---

## Funcionalidades implementadas

**Página inicial**
- Cabeçalho fixo com logo, busca e acesso ao perfil
- Busca em tempo real (ignora acentos e maiúsculas; procura em título, categoria e autor)
- Filtro por 8 categorias
- Ordenação por mais bem avaliadas, menor tempo de preparo e A–Z
- Filtro por tempo de preparo
- Botão "Me surpreenda" (abre uma receita aleatória)
- Curtir receitas com animação

**Página da receita**
- Foto, categoria, nota média, tempo, porções e autor
- Ingredientes que podem ser marcados e modo de preparo numerado
- Favoritar, compartilhar e imprimir
- Avaliação por estrelas e comentários
- Sugestões de receitas parecidas

**Contas e perfil**
- Cadastro e login (a senha é guardada como hash PBKDF2 com sal, nunca em texto puro)
- Foto de perfil (ou ícone padrão)
- Favoritas, minhas receitas, publicar, editar e excluir receitas

**Acessibilidade**
- Ouvir a receita em voz alta
- Tamanho da letra ajustável (A- A A+), com a escolha salva
- Textos alternativos, rótulos em botões de ícone, navegação por teclado e impressão limpa

**Categorias:** Bolos & Tortas, Brigadeiros & Docinhos, Pavês & Mousse, Pudins, Sobremesas Geladas, Biscoitos & Cookies, Doces Tradicionais e Saudáveis & Fit.

---

## Validação

Ferramentas utilizadas:
- Validador HTML do W3C: <https://validator.w3.org/>
- Validador CSS do W3C: <https://jigsaw.w3.org/css-validator/>

Os resultados e as correções realizadas estão registrados no relatório técnico do projeto.

---

## Desempenho

**Melhorias aplicadas durante o desenvolvimento**
- Imagens dos cards com carregamento tardio (`loading="lazy"`).
- Fotos enviadas pelos usuários são redimensionadas antes de salvar (até 800 px nas receitas e 240 px nas fotos de perfil).
- Uma única dependência externa (Font Awesome) e fonte do sistema, sem baixar fontes da internet.
- Variáveis CSS e funções reutilizadas, evitando repetição de código.
- Imagem substituta quando um link de foto falha.

Ferramenta de auditoria utilizada: Lighthouse (ferramentas de desenvolvedor do navegador). Os valores medidos estão no relatório técnico.

---

## Limitações

- Os dados ficam só no navegador de cada pessoa: contas, favoritos, notas, comentários e receitas publicadas **não aparecem para outros visitantes** nem em outros aparelhos.
- O armazenamento do navegador é limitado (cerca de 5 MB), o que restringe a quantidade de fotos enviadas.
- A proteção de senha é adequada para um projeto de estudo. Um site real precisa de servidor e banco de dados para cuidar de contas.

**Próximos passos possíveis:** usar Firebase ou Supabase para contas e receitas compartilhadas entre todos, salvar as fotos em um serviço de armazenamento e adicionar mais filtros.

---

## Créditos

Parte das receitas e das imagens foi reunida pelo grupo a partir de sites de culinária. As imagens pertencem aos respectivos autores. Ícones: [Font Awesome](https://fontawesome.com/).

---

## Integrantes

- Mariana Conceição Meneses
- Távyla Vitória Dos Santos Lima
- Talita Gabriely Mendes de Lima
- Guilherme Santos Souza

**Disciplina:** Programação Web I – Engenharia de Software – UEPA
**Professora:** Jacqueline Teixeira
