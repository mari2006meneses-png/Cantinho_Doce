/* ===================================================
   PÁGINA DE PERFIL
   =================================================== */
const user = currentUser();
if (!user) {
  // Não está logado: vai para a tela de entrar e volta aqui depois
  location.replace('login.html?next=perfil.html');
}

if (user) iniciar();

function iniciar() {
  $('pName').textContent = user.name;
  $('pEmail').textContent = user.email;
  $('pSince').textContent = 'Membro desde ' +
    new Date(user.created).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Categorias do formulário
  CATEGORIAS.forEach(c => {
    const o = document.createElement('option');
    o.value = c;
    o.textContent = c;
    $('fTag').append(o);
  });

  renderFoto();
  renderFavoritas();
  renderMinhas();

  // Abas (aceita link direto: perfil.html#publicar)
  document.querySelectorAll('.profile-tab').forEach(btn => {
    btn.addEventListener('click', () => abrirAba(btn.dataset.tab));
  });
  const inicial = location.hash.replace('#', '');
  abrirAba(['favoritas', 'minhas', 'publicar'].includes(inicial) ? inicial : 'favoritas');

  $('goPublish').addEventListener('click', () => abrirAba('publicar'));

  $('logoutBtn').addEventListener('click', () => {
    logoutUser();
    location.href = 'index.html';
  });
}

function abrirAba(nome) {
  document.querySelectorAll('.profile-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === nome));
  ['favoritas', 'minhas', 'publicar'].forEach(n => {
    $(`panel-${n}`).hidden = n !== nome;
  });
  history.replaceState(null, '', `#${nome}`);
}

/* ---------- Favoritas ---------- */
function renderFavoritas() {
  const todas = getAllRecipes();
  // Ignora favoritos de receitas que foram excluídas
  const ids = getFavs().filter(id => todas[id]);
  const grid = $('favGrid');
  grid.innerHTML = '';

  ids.forEach(id => {
    grid.append(buildRecipeCard(id, todas[id], {
      onFavChange: (_id, ficouFav) => { if (!ficouFav) renderFavoritas(); }
    }));
  });

  $('favCount').textContent = `(${ids.length})`;
  $('favEmpty').hidden = ids.length > 0;
}

/* ---------- Minhas receitas ---------- */
function renderMinhas() {
  const minhas = getUserRecipes().filter(r => r.authorId === user.id).reverse();
  const grid = $('mineGrid');
  grid.innerHTML = '';

  minhas.forEach(r => {
    const wrap = document.createElement('div');
    wrap.className = 'my-recipe';

    const card = buildRecipeCard(r.id, r, {
      onFavChange: () => renderFavoritas()
    });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn btn-danger';
    del.innerHTML = '<i class="fa-regular fa-trash-can"></i> Excluir';
    del.addEventListener('click', () => {
      if (!confirm(`Excluir a receita "${r.title}"? Isso não pode ser desfeito.`)) return;
      const restantes = getUserRecipes().filter(x => x.id !== r.id);
      store.set(USER_RECIPES_KEY, restantes);
      showToast('Receita excluída');
      renderMinhas();
      renderFavoritas();
    });

    wrap.append(card, del);
    grid.append(wrap);
  });

  $('mineCount').textContent = `(${minhas.length})`;
  $('mineEmpty').hidden = minhas.length > 0;
}

/* ---------- Publicar ---------- */
// Reduz a foto (máx. 800px) para caber no armazenamento do navegador
function fotoParaDataURL(file, maxW = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const escala = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

let fotoAtual = '';

$('fImage').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const prev = $('imgPreview');
  fotoAtual = '';
  prev.hidden = true;
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    $('publishError').textContent = 'Escolha um arquivo de imagem.';
    e.target.value = '';
    return;
  }
  try {
    fotoAtual = await fotoParaDataURL(file);
    prev.src = fotoAtual;
    prev.hidden = false;
    $('publishError').textContent = '';
  } catch {
    $('publishError').textContent = 'Não consegui ler essa imagem.';
  }
});

const linhas = (txt) => txt.split('\n').map(l => l.trim()).filter(Boolean);

$('publishForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const err = $('publishError');
  err.textContent = '';

  const title = $('fTitle').value.trim();
  const time = parseInt($('fTime').value, 10);
  const servings = parseInt($('fServings').value, 10);
  const ingredients = linhas($('fIngredients').value);
  const steps = linhas($('fSteps').value);

  if (title.length < 3) { err.textContent = 'Dê um nome para a receita.'; return; }
  if (!time || time < 1) { err.textContent = 'Informe o tempo de preparo em minutos.'; return; }
  if (!servings || servings < 1) { err.textContent = 'Informe quantas porções ela rende.'; return; }
  if (!ingredients.length) { err.textContent = 'Adicione pelo menos um ingrediente.'; return; }
  if (!steps.length) { err.textContent = 'Adicione pelo menos um passo do preparo.'; return; }

  const nova = {
    id: 'u-' + Date.now(),
    title,
    tag: $('fTag').value,
    image: fotoAtual,
    time: `${time} min`,
    servings: `${servings} ${servings === 1 ? 'porção' : 'porções'}`,
    author: user.name,
    authorId: user.id,
    ingredients,
    steps,
    created: new Date().toISOString()
  };

  const lista = getUserRecipes();
  lista.push(nova);
  if (!store.set(USER_RECIPES_KEY, lista)) {
    err.textContent = 'Não coube no armazenamento do navegador. Tente uma foto menor ou sem foto.';
    return;
  }

  $('publishForm').reset();
  fotoAtual = '';
  $('imgPreview').hidden = true;
  showToast('Receita publicada!');
  renderMinhas();
  abrirAba('minhas');
});

/* ---------- Foto de perfil ---------- */
function renderFoto() {
  const foto = currentUser().photo || '';
  const box = $('pAvatar');
  // volta ao ícone e, se houver foto, troca por ela
  box.innerHTML = '<i class="fa-solid fa-circle-user"></i>';
  setAvatarPhoto(box, foto);
  $('pPhotoLabel').textContent = foto ? 'Trocar foto' : 'Adicionar foto';
  $('pPhotoRemove').hidden = !foto;
}

$('pPhoto').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = ''; // permite escolher a mesma foto de novo depois
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Escolha um arquivo de imagem.');
    return;
  }
  try {
    const foto = await imageToSquareDataURL(file);
    if (!setUserPhoto(user.id, foto)) {
      showToast('Não coube no armazenamento do navegador.');
      return;
    }
    renderFoto();
    renderMinhas();
    renderFavoritas();
    showToast('Foto de perfil atualizada!');
  } catch {
    showToast('Não consegui ler essa imagem.');
  }
});

$('pPhotoRemove').addEventListener('click', () => {
  setUserPhoto(user.id, '');
  renderFoto();
  renderMinhas();
  renderFavoritas();
  showToast('Foto removida');
});