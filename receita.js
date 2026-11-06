/* ===================================================
   PÁGINA DA RECEITA
   (dados, contas e favoritos vêm do comum.js)
   =================================================== */
const RATING_KEY = 'cd_avaliacoes_v2';   // { idReceita: { idUsuario: nota } }
const commentsKey = (id) => `cd_comentarios_${id}`;

const recipeId = new URLSearchParams(location.search).get('id');
const recipe = getAllRecipes()[recipeId];

if (!recipe) {
  $('recipePage').hidden = true;
  $('notFound').hidden = false;
  document.title = 'Receita não encontrada - Cantinho Doce';
} else {
  init();
}

function init() {
  document.title = `${recipe.title} - Cantinho Doce`;

  $('crumbTag').textContent = recipe.tag;
  $('crumbTitle').textContent = recipe.title;
  $('rTag').textContent = recipe.tag;
  $('rTitle').textContent = recipe.title;
  $('rTime').textContent = recipe.time;
  $('rServings').textContent = recipe.servings;
  $('rAuthor').textContent = recipe.author;
  setAvatarPhoto($('rAvatar'), getAuthorPhoto(recipe));
  $('rImage').onerror = () => { $('rImage').onerror = null; $('rImage').src = PLACEHOLDER_IMG; };
  $('rImage').src = recipe.image || PLACEHOLDER_IMG;
  $('rImage').alt = recipe.title;

  renderIngredients();
  renderSteps();
  renderRating();
  renderComments();
  renderCommentForm();
  renderFavorite();
  renderRelated();
}

/* ---------- Ingredientes e passos ---------- */
function renderIngredients() {
  const ul = $('ingredients');
  recipe.ingredients.forEach((text, i) => {
    const li = document.createElement('li');
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `ing-${i}`;
    const span = document.createElement('span');
    span.textContent = text;
    label.append(input, span);
    li.append(label);
    ul.append(li);
  });
}

function renderSteps() {
  const ol = $('steps');
  recipe.steps.forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    ol.append(li);
  });
}

/* ---------- Favoritar ---------- */
function renderFavorite() {
  const btn = $('favBtn');
  const isFav = getFavs().includes(recipeId);
  btn.classList.toggle('active', isFav);
  btn.querySelector('i').className = isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
  btn.querySelector('span').textContent = isFav ? 'Favoritada' : 'Favoritar';
}

$('favBtn').addEventListener('click', () => {
  const nowFav = toggleFavorite(recipeId);
  if (nowFav === null) return; // sem login: já foi avisado
  showToast(nowFav ? 'Receita adicionada aos favoritos!' : 'Removida dos favoritos');
  renderFavorite();
});

/* ---------- Compartilhar e imprimir ---------- */
$('shareBtn').addEventListener('click', async () => {
  const data = { title: recipe.title, text: `Olha essa receita: ${recipe.title}`, url: location.href };
  try {
    if (navigator.share) {
      await navigator.share(data);
    } else {
      await navigator.clipboard.writeText(location.href);
      showToast('Link copiado!');
    }
  } catch { /* usuário cancelou */ }
});

$('printBtn').addEventListener('click', () => window.print());

/* ---------- Avaliação (uma nota por conta) ---------- */
function starsHTML(value) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (value >= i - 0.25) html += '<i class="fa-solid fa-star"></i>';
    else if (value >= i - 0.75) html += '<i class="fa-solid fa-star-half-stroke"></i>';
    else html += '<i class="fa-regular fa-star"></i>';
  }
  return html;
}

function getRatings() {
  return store.get(RATING_KEY, {})[recipeId] || {};
}

function saveRating(userId, note) {
  const all = store.get(RATING_KEY, {});
  all[recipeId] = all[recipeId] || {};
  all[recipeId][userId] = note;
  store.set(RATING_KEY, all);
}

function renderRating() {
  const ratings = getRatings();
  const notes = Object.values(ratings);
  const count = notes.length;
  const avg = count ? notes.reduce((a, b) => a + b, 0) / count : 0;
  const user = currentUser();
  const mine = user ? (ratings[user.id] || 0) : 0;

  $('avgStars').innerHTML = starsHTML(avg);
  $('ratingText').textContent = count
    ? `${avg.toFixed(1).replace('.', ',')} / 5 (${count} ${count === 1 ? 'avaliação' : 'avaliações'})`
    : 'Ainda sem avaliações';

  const box = $('rateStars');
  box.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-label', `${i} ${i === 1 ? 'estrela' : 'estrelas'}`);
    b.innerHTML = '<i class="fa-solid fa-star"></i>';
    b.classList.toggle('on', i <= mine);
    b.addEventListener('mouseenter', () => paintStars(i));
    b.addEventListener('focus', () => paintStars(i));
    b.addEventListener('click', () => {
      const u = requireLogin('Entre na sua conta para avaliar');
      if (!u) return;
      saveRating(u.id, i);
      renderRating();
      showToast('Obrigado pela sua avaliação!');
    });
    box.append(b);
  }
  box.onmouseleave = () => paintStars(mine);

  $('rateMsg').textContent = !user
    ? 'Entre na sua conta para avaliar esta receita.'
    : mine
      ? `Sua nota: ${mine} de 5. Clique para alterar.`
      : 'Clique nas estrelas para dar sua nota.';
}

function paintStars(n) {
  document.querySelectorAll('#rateStars button').forEach((b, idx) => {
    b.classList.toggle('on', idx < n);
  });
}

/* ---------- Comentários ---------- */
function renderCommentForm() {
  const user = currentUser();
  $('commentForm').hidden = !user;
  $('commentLogin').hidden = !!user;
  if (!user) {
    $('commentLoginLink').href = 'login.html?next=' + encodeURIComponent(currentPage());
  }
}

function renderComments() {
  const list = store.get(commentsKey(recipeId), []);
  const user = currentUser();
  const box = $('commentsList');
  box.innerHTML = '';

  $('commentCount').textContent = `(${list.length})`;
  $('commentLink').textContent = list.length
    ? `Ver ${list.length === 1 ? 'o comentário' : `os ${list.length} comentários`}`
    : 'Seja o primeiro a comentar';

  if (!list.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'Ainda não há comentários. Conte como ficou sua receita!';
    box.append(p);
    return;
  }

  // Mais recentes primeiro (guardamos o índice real para poder excluir)
  list.map((c, index) => ({ c, index })).reverse().forEach(({ c, index }) => {
    const item = document.createElement('div');
    item.className = 'comment';

    const icon = makeAvatar(getUserPhoto(c.userId), 'comment-avatar');

    const body = document.createElement('div');
    body.className = 'comment-body';
    const head = document.createElement('div');
    head.className = 'comment-head';
    const name = document.createElement('strong');
    name.textContent = c.name;
    const date = document.createElement('span');
    date.textContent = new Date(c.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    head.append(name, date);

    const text = document.createElement('p');
    text.textContent = c.text;
    body.append(head, text);

    // Só o dono do comentário vê o botão de excluir
    if (user && c.userId === user.id) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'link-btn';
      del.textContent = 'Excluir';
      del.addEventListener('click', () => {
        const all = store.get(commentsKey(recipeId), []);
        all.splice(index, 1);
        store.set(commentsKey(recipeId), all);
        renderComments();
      });
      body.append(del);
    }

    item.append(icon, body);
    box.append(item);
  });
}

$('commentForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const user = requireLogin('Entre na sua conta para comentar');
  if (!user) return;

  const text = $('commentText').value.trim();
  if (!text) return;

  const list = store.get(commentsKey(recipeId), []);
  list.push({ userId: user.id, name: user.name, text, date: new Date().toISOString() });
  store.set(commentsKey(recipeId), list);

  $('commentText').value = '';
  renderComments();
  showToast('Comentário publicado!');
});

/* ---------- Veja também ---------- */
function renderRelated() {
  const grid = $('relatedGrid');
  // Mesma categoria primeiro, depois as outras
  Object.entries(getAllRecipes())
    .filter(([id]) => id !== recipeId)
    .sort((a, b) => (a[1].tag === recipe.tag ? 0 : 1) - (b[1].tag === recipe.tag ? 0 : 1))
    .slice(0, 3)
    .forEach(([id, r]) => {
      const a = document.createElement('a');
      a.className = 'recipe-card related-card';
      a.href = `receita.html?id=${encodeURIComponent(id)}`;

      const imgBox = document.createElement('div');
      imgBox.className = 'recipe-image';
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.onerror = () => { img.onerror = null; img.src = PLACEHOLDER_IMG; };
      img.src = r.image || PLACEHOLDER_IMG;
      img.alt = r.title;
      imgBox.append(img);

      const content = document.createElement('div');
      content.className = 'recipe-content';
      const tag = document.createElement('span');
      tag.className = 'recipe-tag';
      tag.textContent = r.tag;
      const h3 = document.createElement('h3');
      h3.textContent = r.title;
      content.append(tag, h3);

      a.append(imgBox, content);
      grid.append(a);
    });
}