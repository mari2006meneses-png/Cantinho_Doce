/* ===================================================
   TELA DE ENTRAR / CRIAR CONTA
   =================================================== */

// Para onde ir depois de entrar (só aceita páginas do próprio site)
function destinoDepois() {
  const next = new URLSearchParams(location.search).get('next');
  if (next && /^[\w\-.]+\.html(\?[\w=&%\-.]*)?$/.test(next)) return next;
  return 'perfil.html';
}

// Já está logado? Vai direto
if (currentUser()) location.replace(destinoDepois());

const loginForm = $('loginForm');
const registerForm = $('registerForm');

function mostrar(aba) {
  const isLogin = aba === 'login';
  loginForm.hidden = !isLogin;
  registerForm.hidden = isLogin;
  $('tabLogin').classList.toggle('active', isLogin);
  $('tabRegister').classList.toggle('active', !isLogin);
  $('loginError').textContent = '';
  $('registerError').textContent = '';
  document.title = isLogin ? 'Entrar - Cantinho Doce' : 'Criar conta - Cantinho Doce';
}

$('tabLogin').addEventListener('click', () => mostrar('login'));
$('tabRegister').addEventListener('click', () => mostrar('register'));
$('goRegister').addEventListener('click', (e) => { e.preventDefault(); mostrar('register'); });
$('goLogin').addEventListener('click', (e) => { e.preventDefault(); mostrar('login'); });

if (location.hash === '#cadastro') mostrar('register');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = loginForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  const res = await loginUser($('loginEmail').value, $('loginPassword').value);
  btn.disabled = false;

  if (!res.ok) { $('loginError').textContent = res.error; return; }
  location.href = destinoDepois();
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('registerError');

  if ($('regPassword').value !== $('regPassword2').value) {
    err.textContent = 'As senhas não são iguais.';
    return;
  }

  const btn = registerForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  const res = await registerUser($('regName').value, $('regEmail').value, $('regPassword').value);
  btn.disabled = false;

  if (!res.ok) { err.textContent = res.error; return; }
  location.href = destinoDepois();
});