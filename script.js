// ---------- Curtir ----------
function toggleLike(btn) {
  // Favorito pertence à conta; sem login, manda para a tela de entrar
  toggleFavorite(btn.closest('.recipe-card').dataset.id, btn);
}

// ---------- Pesquisa + filtro por categoria ----------
const form        = document.getElementById('searchForm');
const input       = document.getElementById('searchInput');
const clearBtn    = document.getElementById('clearBtn');
const gridReceitas = document.getElementById('recipesGrid');
renderBuiltInRecipeCards(gridReceitas);
renderUserRecipeCards(gridReceitas);
const cards       = document.querySelectorAll('.recipe-card');
const noResults   = document.getElementById('noResults');
const resultsInfo = document.getElementById('resultsInfo');
const sectionTitle= document.getElementById('sectionTitle');
const catLinks    = document.querySelectorAll('.categories-nav a');

let currentCategory = '';

// Remove acentos e deixa minúsculo ("Limão" -> "limao")
const normalize = (text) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Guarda o título original de cada card para poder destacar e restaurar
cards.forEach(card => {
  const h3 = card.querySelector('h3');
  h3.dataset.original = h3.textContent;
});

function highlight(h3, term) {
  const original = h3.dataset.original;
  if (!term) { h3.textContent = original; return; }
  // Procura no texto normalizado e marca o trecho equivalente no original
  const norm = normalize(original);
  const idx = norm.indexOf(term);
  if (idx === -1) { h3.textContent = original; return; }
  const end = idx + term.length;
  h3.innerHTML = '';
  h3.append(original.slice(0, idx));
  const mark = document.createElement('mark');
  mark.textContent = original.slice(idx, end);
  h3.append(mark, original.slice(end));
}

function filterRecipes() {
  const term = normalize(input.value);
  const words = term.split(/\s+/).filter(Boolean);
  let visible = 0;

  cards.forEach(card => {
    const title  = card.querySelector('h3');
    const tag    = card.querySelector('.recipe-tag').textContent;
    const author = card.querySelector('.recipe-author strong').textContent;

    // Texto pesquisável: título + categoria + autor
    const haystack = normalize(`${title.dataset.original} ${tag} ${author}`);

    const matchesText = words.every(w => haystack.includes(w));
    const matchesCat  = !currentCategory || normalize(tag) === normalize(currentCategory);
    const show = matchesText && matchesCat;

    card.classList.toggle('hidden', !show);
    highlight(title, show && words.length === 1 ? term : '');
    if (show) visible++;
  });

  noResults.classList.toggle('show', visible === 0);
  form.classList.toggle('has-text', input.value.length > 0);

  // Textos informativos
  if (input.value.trim()) {
    sectionTitle.textContent = 'Resultados da busca';
    resultsInfo.textContent = visible === 1
      ? `1 receita encontrada para "${input.value.trim()}"`
      : `${visible} receitas encontradas para "${input.value.trim()}"`;
  } else {
    sectionTitle.textContent = currentCategory || 'Receitas Mais Amadas';
    resultsInfo.textContent = '';
  }
}

// Filtra enquanto digita
input.addEventListener('input', filterRecipes);

// Enter / clique na lupa
form.addEventListener('submit', (e) => {
  e.preventDefault();
  filterRecipes();
});

// Botão de limpar
clearBtn.addEventListener('click', () => {
  input.value = '';
  filterRecipes();
  input.focus();
});

// Categorias também filtram (e combinam com a busca)
catLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    catLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    currentCategory = link.dataset.category;
    filterRecipes();
  });
});

// ---------- Cards fixos: favoritos da conta + abrir a receita ----------
const favsSalvos = getFavs();
cards.forEach(card => {
  if (card.dataset.bound) return; // cards criados pelo comum.js já cuidam de si
  const id = card.dataset.id;

  if (favsSalvos.includes(id)) card.querySelector('.like-btn').classList.add('liked');

  const abrir = () => { location.href = `receita.html?id=${encodeURIComponent(id)}`; };
  card.addEventListener('click', (e) => {
    if (e.target.closest('.like-btn')) return; // o coração não abre a receita
    abrir();
  });
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target === card) abrir();
  });
});

// ---------- Busca vinda de outra página (index.html?q=bolo) ----------
const termoUrl = new URLSearchParams(location.search).get('q');
if (termoUrl) {
  input.value = termoUrl;
  filterRecipes();
}