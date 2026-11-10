/* ===================================================
   COMUM.JS - usado por TODAS as páginas
   Contém: armazenamento, receitas, contas (login/cadastro),
   favoritos e o cabeçalho que mostra o usuário logado.

   IMPORTANTE: tudo é salvo no navegador (localStorage).
   Serve para estudo/protótipo. Para um site de verdade,
   contas e senhas precisam de um servidor (backend).
   =================================================== */

/* ---------- Utilitários ---------- */
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; } // cheio ou bloqueado
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  }
};

const $ = (id) => document.getElementById(id);

function showToast(msg) {
  let t = $('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.append(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => t.classList.remove('show'), 2400);
}

function currentPage() {
  return (location.pathname.split('/').pop() || 'index.html') + location.search;
}


/* ===================================================
   AVATARES (foto real ou ícone comum)
   Se a pessoa tem foto, mostra a foto. Se não tem (ou a
   imagem não carrega), fica o ícone padrão.
   =================================================== */
function setAvatarPhoto(el, photo) {
  if (!photo) return;
  const img = new Image();
  img.alt = '';
  img.onload = () => el.replaceChildren(img); // só troca se a foto carregou
  img.src = photo;
}

function makeAvatar(photo, extraClass = '') {
  const span = document.createElement('span');
  span.className = ('avatar ' + extraClass).trim();
  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-circle-user';
  span.append(icon);
  setAvatarPhoto(span, photo);
  return span;
}

// Foto de uma conta
function getUserPhoto(userId) {
  const u = getUsers().find(x => x.id === userId);
  return u ? (u.photo || '') : '';
}

// Foto do autor de uma receita (contas usam a foto atual da conta)
function getAuthorPhoto(r) {
  if (r.authorId) return getUserPhoto(r.authorId);
  return r.authorPhoto || '';
}

// Salva (ou remove, com '') a foto de perfil de uma conta
function setUserPhoto(userId, photo) {
  const users = getUsers();
  const u = users.find(x => x.id === userId);
  if (!u) return false;
  if (photo) u.photo = photo; else delete u.photo;
  return store.set(USERS_KEY, users);
}

// Recorta no centro (quadrado) e reduz, para caber no armazenamento
function imageToSquareDataURL(file, size = 240) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Avatares escritos direto no HTML: <span class="avatar" data-photo="...">
function hydrateAvatars(root = document) {
  root.querySelectorAll('.avatar[data-photo]').forEach(el => setAvatarPhoto(el, el.dataset.photo));
}

const CATEGORIAS = [
  'Bolos & Tortas',
  'Brigadeiros & Docinhos',
  'Pavês & Mousse',
  'Pudins',
  'Sobremesas Geladas',
  'Biscoitos & Cookies',
  'Doces Tradicionais',
  'Saudáveis & Fit'
];

const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#FBCCD7"/>' +
  '<text x="200" y="175" font-size="90" text-anchor="middle">🧁</text></svg>'
);

/* ===================================================
   RECEITAS
   As receitas fixas ficam aqui. As publicadas pelos usuários
   ficam no navegador e são juntadas a elas.
   O link de cada receita é: receita.html?id=ID
   =================================================== */
const RECEITAS = {
  'bolo-chocolate-vulcao': {
    title: 'Bolo de Chocolate Vulcão',
    tag: 'Bolos & Tortas',
    image: 'https://www.receitasnestle.com.br/sites/default/files/srh_recipes/6cf1bb7359f2dca08445c83ff58bf3bf.jpg',
    time: '45 min',
    servings: '10 porções',
    author: 'Maria Silva',
    authorPhoto: 'imagens/autores/maria-silva.jpg',
    ingredients: [
      '200 g de chocolate meio amargo picado',
      '150 g de manteiga sem sal',
      '1 xícara (chá) de açúcar',
      '4 ovos',
      '1/2 xícara (chá) de farinha de trigo',
      '1 pitada de sal',
      'Manteiga e cacau em pó para untar a forma'
    ],
    steps: [
      'Preaqueça o forno a 200 °C. Unte a forma com manteiga e polvilhe cacau em pó.',
      'Derreta o chocolate com a manteiga em banho-maria, mexendo até ficar liso. Deixe amornar.',
      'Em uma tigela, misture os ovos com o açúcar e o sal até ficar homogêneo.',
      'Junte o chocolate derretido aos ovos e misture. Acrescente a farinha peneirada e mexa só até incorporar.',
      'Despeje na forma e asse por cerca de 20 minutos: as bordas devem firmar e o centro continuar molinho.',
      'Deixe descansar 2 minutos, desenforme com cuidado e sirva quente.'
    ]
  },

  'pudim-leite-condensado': {
    title: 'Pudim de Leite Condensado Clássico',
    tag: 'Pudins',
    image: 'https://www.oetker.com.br/assets/recipes/assets/17b2e781dcd84ff8808b72d9a10cd11a/1272x764/pudim-de-leite-condensado.webp',
    time: '60 min',
    servings: '8 porções',
    author: 'Chef Carlos',
    authorPhoto: 'imagens/autores/chef-carlos.jpg',
    ingredients: [
      '1 lata de leite condensado',
      '2 medidas (da lata) de leite',
      '3 ovos',
      '1 xícara (chá) de açúcar para o caramelo',
      '1/2 xícara (chá) de água quente'
    ],
    steps: [
      'Caramelo: derreta o açúcar em uma panela em fogo médio, sem mexer, até dourar. Adicione a água quente com cuidado e mexa até dissolver.',
      'Despeje o caramelo em uma forma de pudim com furo central, espalhando pelo fundo e pelas laterais.',
      'No liquidificador, bata o leite condensado, o leite e os ovos por cerca de 1 minuto.',
      'Coloque a mistura na forma e cubra com papel-alumínio.',
      'Leve ao forno a 180 °C, em banho-maria, por cerca de 50 minutos.',
      'Espere esfriar, leve à geladeira por pelo menos 4 horas e desenforme.'
    ]
  },

  'torta-limao-merengue': {
    title: 'Torta de Limão com Merengue',
    tag: 'Bolos & Tortas',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Torta_de_limao.jpg?utm_source=pt.wikipedia.org&utm_campaign=index&utm_content=original',
    time: '30 min',
    servings: '12 porções',
    author: 'Ana Souza',
    authorPhoto: 'imagens/autores/ana-souza.jpg',
    ingredients: [
      '200 g de biscoito maisena triturado',
      '100 g de manteiga derretida',
      '1 lata de leite condensado',
      '1/2 xícara (chá) de suco de limão',
      '1 caixinha de creme de leite',
      'Raspas de 1 limão',
      '3 claras',
      '6 colheres (sopa) de açúcar'
    ],
    steps: [
      'Misture o biscoito triturado com a manteiga derretida e forre o fundo e as laterais de uma forma de fundo removível. Leve à geladeira.',
      'Misture o leite condensado, o creme de leite, o suco e as raspas de limão até ficar cremoso.',
      'Despeje o recheio sobre a massa e leve à geladeira enquanto prepara o merengue.',
      'Bata as claras em neve e vá juntando o açúcar aos poucos, até formar picos firmes e brilhantes.',
      'Cubra a torta com o merengue e, se quiser, doure com um maçarico ou por poucos minutos no forno.',
      'Mantenha na geladeira até a hora de servir.'
    ]
  },

  /* ----- Receitas importadas do PDF (28) ----- */
  "bolo-de-cenoura-com-cobertura-de-chocolate": {
    title: "Bolo de Cenoura com Cobertura de Chocolate",
    tag: "Bolos & Tortas",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNsd7raVLlf4ot01TMCHeLP-VUXPaZIKWclyTBOsOzFznLg0Ud23Hyi5JD&s=10",
    time: "40 min",
    servings: "8 porções",
    author: "Andressa",
    ingredients: [
      "3 cenouras médias picadas",
      "3 ovos",
      "1 xícara de óleo",
      "2 xícaras de açúcar",
      "2 xícaras de farinha de trigo",
      "1 colher (sopa) de fermento em pó",
      "Cobertura: 1 colher (sopa) de manteiga, 3 colheres (sopa) de achocolatado, 1 xícara de açúcar e 1 xícara de leite"
    ],
    steps: [
      "No liquidificador, bata a cenoura, os ovos e o óleo até obter uma mistura homogênea.",
      "Despeje em uma tigela e adicione o açúcar e a farinha de trigo peneirada.",
      "Misture bem e adicione o fermento delicadamente.",
      "Despeje em forma untada e enfarinhada e asse em forno pré-aquecido a 180°C por 40 minutos.",
      "Para a cobertura, leve todos os ingredientes ao fogo até levantar fervura e despeje sobre o bolo quente."
    ]
  },
  "torta-de-limao-facil": {
    title: "Torta de Limão Fácil",
    tag: "Bolos & Tortas",
    image: "imagens/tortalimao.jpg.webp",
    time: "45 min (+ geladeira)",
    servings: "10 porções",
    author: "Giselle",
    ingredients: [
      "1 pacote de biscoito maizena triturado",
      "100g de manteiga derretida",
      "1 lata de leite condensado",
      "1 caixa de creme de leite",
      "Suco de 4 limões",
      "Raspas de limão para decorar"
    ],
    steps: [
      "Misture o biscoito triturado com a manteiga até formar uma farofa úmida.",
      "Forre o fundo e as laterais de uma forma de aro removível e asse por 10 minutos a 180°C. Reserve até esfriar.",
      "No liquidificador, bata o leite condensado, o creme de leite e o suco de limão até firmar.",
      "Despeje o recheio sobre a base assada.",
      "Decore com raspas de limão e leve à geladeira por 4 horas antes de servir."
    ]
  },
  "bolo-de-chocolate-fofinho": {
    title: "Bolo de Chocolate Fofinho",
    tag: "Bolos & Tortas",
    image: "https://cdn.casaeculinaria.com/wp-content/uploads/2022/10/04101905/Bolo-de-chocolate-2.webp",
    time: "45 min",
    servings: "10 porções",
    author: "Vovó Neide",
    ingredients: [
      "2 xícaras de farinha de trigo",
      "1 xícara de açúcar",
      "1 xícara de achocolatado em pó",
      "1 xícara de óleo",
      "1 xícara de água morna",
      "2 ovos",
      "1 colher (sopa) de fermento em pó"
    ],
    steps: [
      "Em uma tigela, misture os ovos, o açúcar e o óleo.",
      "Adicione o achocolatado e a farinha intercalando com a água morna.",
      "Adicione o fermento por último e misture suavemente.",
      "Despeje em forma unte e leve ao forno médio (180°C) por 40 minutos."
    ]
  },
  "torta-de-maca-tradicional": {
    title: "Torta de Maçã Tradicional",
    tag: "Bolos & Tortas",
    image: "https://s2-receitas.glbimg.com/hrjWfauBXlUglrC8KIXVq7MxwDg=/filters:format(jpeg)/https://i.s3.glbimg.com/v1/AUTH_1f540e0b94d8437dbbc39d567a1dee68/internal_photos/bs/2021/q/W/eTsNWhTeai02Y0at4Q0g/torta-de-maca-do-rodrigo-hilbert-e-crocante-por-fora-e-fofinha-por-dentro.jpg",
    time: "60 min",
    servings: "8 porções",
    author: "Danielle",
    ingredients: [
      "2 xícaras de farinha de trigo",
      "150g de manteiga gelada",
      "1/2 xícara de açúcar",
      "4 maçãs fatiadas sem casca",
      "1 colher (chá) de canela em pó",
      "Suco de 1/2 limão"
    ],
    steps: [
      "Misture a farinha, a manteiga e 2 colheres de açúcar com as pontas dos dedos até formar uma massa homogênea. Deixe gelar por 20 minutos.",
      "Em uma tigela, tempere as maçãs fatiadas com o suco de limão, a canela e o restante do açúcar.",
      "Abra metade da massa e forre uma assadeira de torta.",
      "Adicione as maçãs e cubra com o restante da massa abertas em tiras.",
      "Asse em forno médio por 40 minutos até dourar."
    ]
  },
  "brigadeiro-tradicional": {
    title: "Brigadeiro Tradicional",
    tag: "Brigadeiros & Docinhos",
    image: "imagens/brigadeiro.webp",
    time: "20 min",
    servings: "30 docinhos",
    author: "Vovó Neide",
    ingredients: [
      "1 lata de leite condensado",
      "1 colher (sopa) de manteiga",
      "4 colheres (sopa) de achocolatado ou cacau em pó",
      "Granulado para enrolar"
    ],
    steps: [
      "Em uma panela, coloque o leite condensado, a manteiga e o achocolatado.",
      "Cozinhe em fogo médio mexendo sem parar até descolar do fundo da panela.",
      "Despeje em um prato untado com manteiga e espere esfriar completamente.",
      "Unte as mãos, faça bolinhas e passe no granulado."
    ]
  },
  "beijinho-de-coco": {
    title: "Beijinho de Coco",
    tag: "Brigadeiros & Docinhos",
    image: "https://vovopalmirinha.com.br/wp-content/uploads/2019/04/beijinho-de-coco.png",
    time: "20 min",
    servings: "30 docinhos",
    author: "Madonna",
    ingredients: [
      "1 lata de leite condensado",
      "1 colher (sopa) de manteiga",
      "100g de coco ralado sem açúcar",
      "Coco ralado e cravos-da-índia para decorar"
    ],
    steps: [
      "Junte o leite condensado, a manteiga e o coco ralado em uma panela.",
      "Leve ao fogo baixo mexendo sempre até soltar do fundo da panela.",
      "Transfira para um prato e deixe esfriar.",
      "Modele as bolinhas, passe no coco ralado e finalize espetando um cravo em cada uma."
    ]
  },
  "cajuzinho-pratico": {
    title: "Cajuzinho Prático",
    tag: "Brigadeiros & Docinhos",
    image: "https://static.itdg.com.br/images/1200-630/a1ab9ad1c014dfaf484da773a105567a/cajuzinho.jpg",
    time: "15 min",
    servings: "25 docinhos",
    author: "Lula13",
    ingredients: [
      "1 lata de leite condensado",
      "1 xícara de amendoim torrado e moído sem pele",
      "2 colheres (sopa) de chocolate em pó",
      "Açúcar refinado e amendoins inteiros para decorar"
    ],
    steps: [
      "Misture o leite condensado, o amendoim moído e o chocolate em pó em uma panela.",
      "Leve ao fogo mexendo até soltar do fundo da panela.",
      "Deixe esfriar em prato untado.",
      "Modele no formato de cajuzinhos, passe no açúcar refinado e espete meio amendoim na ponta."
    ]
  },
  "bicho-de-pe-brigadeiro-de-morango": {
    title: "Bicho de Pé (Brigadeiro de Morango)",
    tag: "Brigadeiros & Docinhos",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKcsQN6YLSIAkHze3sdrwBhDbZbukoDg9z0nFCmK_HYrqNUa6SjSo2yMU&s=10",
    time: "20 min",
    servings: "30 docinhos",
    author: "Luz Marina",
    ingredients: [
      "1 lata de leite condensado",
      "1 colher (sopa) de manteiga",
      "4 colheres (sopa) de preparado em pó para leite sabor morango (Nesquik)",
      "Açúcar cristal para enrolar"
    ],
    steps: [
      "Em uma panela, misture o leite condensado, a manteiga e o pó sabor morango.",
      "Cozinhe em fogo brando mexendo sempre até dar o ponto de brigadeiro (desgrudando do fundo).",
      "Deixe esfriar em prato untado.",
      "Enrole no formato de bolinhas e passe no açúcar cristal."
    ]
  },
  "docinho-de-leite-em-po": {
    title: "Docinho de Leite em Pó",
    tag: "Brigadeiros & Docinhos",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSrjE9eh1Nv0wyJL7LVLPnVNQ9eE_e7-wA5ZmYF7aEchTpZpQh83xX0Nbw&s=10",
    time: "15 min (sem fogo)",
    servings: "25 docinhos",
    author: "Vovó Neide",
    ingredients: [
      "2 xícaras de leite em pó",
      "2 xícaras de açúcar de confeiteiro",
      "Leite de coco ou leite condensado até dar o ponto (cerca de 1/2 garrafinha)"
    ],
    steps: [
      "Em uma tigela, misture bem o leite em pó e o açúcar de confeiteiro.",
      "Adicione o leite de coco aos poucos, amassando com as mãos até obter uma massa lisa que não grude nas mãos.",
      "Faça bolinhas e passe no leite em pó extra para finalizar."
    ]
  },
  "pave-de-chocolate-tradicional": {
    title: "Pavê de Chocolate Tradicional",
    tag: "Pavês & Mousse",
    image: "https://static.itdg.com.br/images/640-400/543ffeb02eaaa8dfe47ab5042b65a908/253792-354452-original-1-.jpeg",
    time: "30 min (+ geladeira)",
    servings: "10 porções",
    author: "Matheus",
    ingredients: [
      "1 pacote de biscoito champagne ou maizena",
      "1 lata de leite condensado",
      "1 litro de leite",
      "3 colheres (sopa) de amido de milho",
      "3 gemas",
      "1 xícara de chocolate em pó",
      "1 lata de creme de leite"
    ],
    steps: [
      "Misture o leite condensado, o leite, o amido, as gemas e o chocolate em pó em uma panela.",
      "Cozinhe em fogo médio até virar um creme espesso. Desligue e incorpore o creme de leite.",
      "Umedeça os biscoitos em um pouco de leite.",
      "Em um refratário, intercale camadas de creme e biscoito. Leve à geladeira por 4 horas."
    ]
  },
  "pave-de-morango": {
    title: "Pavê de Morango",
    tag: "Pavês & Mousse",
    image: "https://static.itdg.com.br/images/1200-675/d853ecd62f9cb96e27190e93193dd363/pave-de-morango-sem-soltar-agua-ia.jpg",
    time: "30 min (+ geladeira)",
    servings: "8 porções",
    author: "GretchenDaCozinha",
    ingredients: [
      "2 caixas de morangos picados",
      "1 lata de leite condensado",
      "1 caixa de creme de leite",
      "1 colher (sopa) de manteiga",
      "1 pacote de biscoito maizena",
      "Leite para umedecer os biscoitos"
    ],
    steps: [
      "Em uma panela, cozinhe o leite condensado e a manteiga até ponto de brigadeiro mole. Adicione o creme de leite e misture até ficar homogêneo.",
      "Passe os biscoitos rapidamente no leite.",
      "Monte camadas em um refratário: creme, morangos picados e biscoitos.",
      "Finalize a última camada com creme e decore com morangos inteiros. Geladeira por 4 horas."
    ]
  },
  "mousse-de-maracuja-rapida": {
    title: "Mousse de Maracujá Rápida",
    tag: "Pavês & Mousse",
    image: "https://static.itdg.com.br/images/1200-630/8fed8f60d3c8e3990396e2478cbc7f2a/shutterstock-1905617575-1-.jpg",
    time: "10 min (+ geladeira)",
    servings: "6 porções",
    author: "Julia Amora",
    ingredients: [
      "1 lata de leite condensado",
      "1 caixa de creme de leite",
      "1 medida (da lata) de suco concentrado de maracujá",
      "Polpa de 1 maracujá fresco para decorar"
    ],
    steps: [
      "No liquidificador, bata o leite condensado, o creme de leite e o suco de maracujá por 3 minutos até ficar cremoso.",
      "Despeje em uma travessa ou taças individuais.",
      "Leve à geladeira por no mínimo 3 horas.",
      "Decore com a polpa de maracujá antes de servir."
    ]
  },
  "mousse-de-chocolate-cremosa": {
    title: "Mousse de Chocolate Cremosa",
    tag: "Pavês & Mousse",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQFcpVevRE--6NIRWXZZovI3VGs9BjSsU2H2F0hxWuU0VG7COR_nAy5EoAn&s=10",
    time: "20 min (+ geladeira)",
    servings: "6 porções",
    author: "Jujuba",
    ingredients: [
      "200g de chocolate meio amargo derretido",
      "1 caixa de creme de leite",
      "3 claras em neve",
      "2 colheres (sopa) de açúcar"
    ],
    steps: [
      "Misture o chocolate derretido com o creme de leite até formar um ganache liso.",
      "Bata as claras em neve firmes e adicione o açúcar aos poucos.",
      "Incorpore delicadamente as claras em neve ao ganache de chocolate.",
      "Distribua em taças e refrigere por 4 horas."
    ]
  },
  "pave-de-limao": {
    title: "Pavê de Limão",
    tag: "Pavês & Mousse",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPoMLcGAuQ0-DfbfT0yNMD-OOxXL-bAfTuqv8z6h-UsYFLDhvJLnJe8P8&s=10",
    time: "20 min (+ geladeira)",
    servings: "8 porções",
    author: "Luisinha",
    ingredients: [
      "1 lata de leite condensado",
      "1 caixa de creme de leite",
      "Suco de 3 limões",
      "1 pacote de biscoito maizena",
      "Raspas de limão"
    ],
    steps: [
      "Bata no liquidificador o leite condensado, creme de leite e o suco de limão até encorpar.",
      "Faça uma camada de biscoitos no refratário e cubra com o creme de limão.",
      "Repita as camadas finalizando com creme.",
      "Decore com raspas de limão e leve à geladeira por 3 horas."
    ]
  },
  "pudim-de-chocolate": {
    title: "Pudim de Chocolate",
    tag: "Pudins",
    image: "imagens/pudimchocolatewebp.webp",
    time: "50 min (+ geladeira)",
    servings: "8 porções",
    author: "Kylie Gui",
    ingredients: [
      "1 lata de leite condensado",
      "2 latas de leite",
      "1 xícara de chocolate em pó",
      "3 ovos",
      "Granulado para decorar"
    ],
    steps: [
      "Bata todos os ingredientes no liquidificador por cerca de 3 minutos.",
      "Despeje em forma de pudim caramelizada ou untada com manteiga e açúcar.",
      "Asse em banho-maria por 50 minutos a 180°C.",
      "Deixe gelar, desenforme e decore com granulado."
    ]
  },
  "pudim-de-pao-de-liquidificador": {
    title: "Pudim de Pão de Liquidificador",
    tag: "Pudins",
    image: "https://guiadacozinha.com.br/wp-content/uploads/2007/01/pudim-de-pao-chique-15236-683x1024-1.jpg",
    time: "50 min",
    servings: "8 porções",
    author: "Luana Coutto",
    ingredients: [
      "3 pães franceses dormidos picados",
      "1 lata de leite condensado",
      "3 xícaras de leite",
      "3 ovos",
      "1 colher (sopa) de manteiga",
      "Calda de caramelo"
    ],
    steps: [
      "Bata no liquidificador os ovos, o leite, a manteiga e o leite condensado.",
      "Adicione os pães picados e bata até obter uma mistura homogênea.",
      "Despeje em uma forma previamente caramelizada.",
      "Asse em banho-maria por cerca de 50 minutos."
    ]
  },
  "pudim-de-tapioca-com-coco-sem-forno": {
    title: "Pudim de Tapioca com Coco (Sem Forno)",
    tag: "Pudins",
    image: "imagens/pudimtapioca.jpg",
    time: "20 min (+ geladeira)",
    servings: "10 porções",
    author: "TudoGostoso",
    ingredients: [
      "1/2 xícara de tapioca granulada (não é a massa pronta de frigideira)",
      "500ml de leite morno",
      "1 vidro de leite de coco (200ml)",
      "1 lata de leite condensado",
      "1 caixa de creme de leite",
      "1 pacote de coco ralado (100g)",
      "1 envelope de gelatina em pó sem sabor (12g)",
      "Calda de caramelo prontas ou 1 xícara de açúcar derretido para untar a forma"
    ],
    steps: [
      "Em uma tigela, coloque a tapioca granulada e despeje o leite morno. Deixe hidratar por 15 a 20 minutos mexendo de vez em quando.",
      "Dissolva a gelatina sem sabor em 5 colheres de água e leve ao micro-ondas por 15 segundos.",
      "No liquidificador, bata o leite condensado, o leite de coco, o creme de leite, o coco ralado e a gelatina dissolvida até ficar cremoso.",
      "Misture o conteúdo do liquidificador com a tapioca já hidratada usando uma colher.",
      "Despeje em uma forma caramelizada e leve à geladeira por 4 horas até firmar bem antes de desenformar."
    ]
  },
  "pudim-de-queijo-com-calda-de-goiabada-romeu-e-julieta": {
    title: "Pudim de Queijo com Calda de Goiabada (Romeu e Julieta)",
    tag: "Pudins",
    image: "https://static.itdg.com.br/images/1200-675/3a65cf9fd76b6f429126fbb8c3f7d80e/queijogoiaba.jpg",
    time: "50 min (+ geladeira)",
    servings: "8 porções",
    author: "Malévola",
    ingredients: [
      "1 lata de leite condensado",
      "1 lata de leite (mesma medida)",
      "3 ovos",
      "50g de queijo parmesão ralado ou 100g de queijo minas padrão",
      "200g de goiabada picada (para a calda)",
      "1/2 xícara de água (para a calda)"
    ],
    steps: [
      "No liquidificador, bata o leite condensado, o leite, os ovos e o queijo ralado por 3 minutos até ficar homogêneo.",
      "Unte uma forma de pudim apenas com manteiga (sem açúcar) e despeje a mistura.",
      "Asse em banho-maria em forno pré-aquecido a 180°C por cerca de 50 minutos ou até firmar.",
      "Para a calda, leve a goiabada picada com a água ao fogo baixo mexendo até derreter completamente.",
      "Espere o pudim esfriar, desenforme e cubra com a calda de goiabada morna ou fria."
    ]
  },
  "gelado-de-abacaxi-facil": {
    title: "Gelado de Abacaxi Fácil",
    tag: "Sobremesas Geladas",
    image: "https://static.itdg.com.br/images/1200-675/02976a5243ca4ca5658e9de8a5bb1725/gelado-de-abacaxi-facil.jpg",
    time: "30 min (+ geladeira)",
    servings: "8 porções",
    author: "Vovózinha Odete",
    ingredients: [
      "1 abacaxi grande picado em cubos",
      "1/2 xícara de açúcar",
      "2 caixas de gelatina sabor abacaxi",
      "1 lata de leite condensado",
      "1 caixa de creme de leite"
    ],
    steps: [
      "Em uma panela, cozinhe o abacaxi picado com o açúcar por 15 minutos.",
      "Desligue o fogo e adicione as gelatinas em pó no abacaxi quente, misturando até dissolver.",
      "Adicione o leite condensado e o creme de leite, misturando bem.",
      "Coloque em um refratário e leve à geladeira por 4 horas."
    ]
  },
  "strogonoff-de-nozes": {
    title: "Strogonoff de Nozes",
    tag: "Sobremesas Geladas",
    image: "https://static.itdg.com.br/images/1200-675/d5474bc92c26a80682591be8e02cd6c1/128248-original.jpg",
    time: "25 min (+ geladeira)",
    servings: "8 porções",
    author: "Carminha",
    ingredients: [
      "1 lata de leite condensado cozido (doce de leite)",
      "1 caixa de creme de leite",
      "150g de nozes picadas",
      "3 claras em neve"
    ],
    steps: [
      "Em uma tigela, misture o doce de leite macio com o creme de leite e as nozes picadas.",
      "Incorpore delicadamente as claras em neve.",
      "Transfira para uma taça de sobremesa e leve para gelar bem por 3 a 4 horas."
    ]
  },
  "geladao-de-morango": {
    title: "Geladão de Morango",
    tag: "Sobremesas Geladas",
    image: "https://receitacerta.blog.br/wp-content/uploads/2025/10/Gelado-de-Morango-Sobremesa-Facil-para-o-Final-de-Semana-768x512.webp",
    time: "20 min (+ geladeira)",
    servings: "10 porções",
    author: "Agostinho Carrara",
    ingredients: [
      "2 caixas de gelatina de morango",
      "2 xícaras de água quente",
      "1 lata de leite condensado",
      "1 caixa de creme de leite",
      "1 caixa de morangos picados"
    ],
    steps: [
      "Dissolva a gelatina na água quente.",
      "Bata a gelatina no liquidificador junto com o leite condensado e o creme de leite.",
      "Em uma travessa, coloque os morangos picados no fundo e cubra com a mistura do liquidificador.",
      "Deixe na geladeira por 4 horas até ficar firme."
    ]
  },
  "delicia-de-abacaxi": {
    title: "Delícia de Abacaxi",
    tag: "Sobremesas Geladas",
    image: "https://static.itdg.com.br/images/640-400/6860a1fc7b3dbd03ef9cfdfce79c49bd/shutterstock-310374131-1-.jpg",
    time: "35 min (+ geladeira)",
    servings: "10 porções",
    author: "Chef Chico",
    ingredients: [
      "1 abacaxi picado com 1/2 xícara de açúcar (cozido por 10 min)",
      "1 lata de leite condensado",
      "2 xícaras de leite",
      "2 gemas",
      "2 colheres (sopa) de amido de milho",
      "2 claras em neve com 2 colheres de açúcar",
      "1 caixa de creme de leite"
    ],
    steps: [
      "Faça um creme amarelo cozinhando o leite condensado, leite, gemas e amido de milho. Espalhe no fundo de um refratário.",
      "Distribua o abacaxi cozido e escorrido sobre o creme.",
      "Misture as claras em neve com o creme de leite e cubra a sobremesa.",
      "Refrigere por 4 horas antes de servir."
    ]
  },
  "torta-de-morango-gelada": {
    title: "Torta de Morango Gelada",
    tag: "Sobremesas Geladas",
    image: "https://static.itdg.com.br/images/1200-630/e3e1c34a4ad2c63026fdc4da8aa36931/torta-de-morango.jpg",
    time: "40 min (+ geladeira)",
    servings: "8 porções",
    author: "Vovó Neide",
    ingredients: [
      "1 pacote de biscoito Maizena triturado com 100g de manteiga",
      "1 lata de leite condensado",
      "2 gemas",
      "1 colher de amido de milho",
      "1 xícara de leite",
      "1 caixa de morangos",
      "1 caixa de gelatina de morango"
    ],
    steps: [
      "Forre a forma com a massa de biscoito e manteiga e asse por 10 minutos.",
      "Cozinhe o leite condensado, gemas, leite e amido até virar creme; coloque sobre a massa.",
      "Arrume os morangos fatiados sobre o creme.",
      "Prepare a gelatina de morango com metade da água da receita, despeje fria por cima e refrigere até firmar."
    ]
  },
  "cookie-americano-com-gotas-de-chocolate": {
    title: "Cookie Americano com Gotas de Chocolate",
    tag: "Biscoitos & Cookies",
    image: "https://i.panelinha.com.br/i1/bk-3044-blog-ayu2251.webp",
    time: "30 min",
    servings: "20 cookies",
    author: "Chef Chico",
    ingredients: [
      "1/2 xícara de manteiga amolecida",
      "1/2 xícara de açúcar mascavo",
      "3 colheres (sopa) de açúcar refinado",
      "1 ovo",
      "1 e 1/2 xícara de farinha de trigo",
      "1 colher (chá) de fermento em pó",
      "1 xícara de gotas de chocolate"
    ],
    steps: [
      "Misture a manteiga, os açúcares e o ovo até ficar homogêneo.",
      "Adicione a farinha de trigo e o fermento, misturando bem.",
      "Incorpore as gotas de chocolate.",
      "Faça bolinhas, coloque em assadeira untada (espaçadas) e asse a 180°C por 15 a 20 minutos."
    ]
  },
  "biscoito-de-polvilho-assado": {
    title: "Biscoito de Polvilho Assado",
    tag: "Biscoitos & Cookies",
    image: "https://static.itdg.com.br/images/640-400/2b35001ed8c5d1ca2315871841ee4042/330465-original.jpg",
    time: "30 min",
    servings: "40 biscoitos",
    author: "Ana Maria Braga",
    ingredients: [
      "500g de polvilho azedo",
      "1/2 xícara de óleo",
      "1/2 xícara de água",
      "1/2 xícara de leite",
      "1 ovo",
      "1 colher (chá) de sal"
    ],
    steps: [
      "Ferva a água, o óleo e o sal e escalde o polvilho em uma tigela.",
      "Espere esfriar um pouco e adicione o ovo e o leite aos poucos, sovando até dar ponto de espremer.",
      "Coloque em um saco de confeitar e modele os biscoitos em uma assadeira.",
      "Asse em forno pré-aquecido a 200°C por 20 minutos até expandir e dourar levemente."
    ]
  },
  "cookies-de-aveia-e-mel": {
    title: "Cookies de Aveia e Mel",
    tag: "Biscoitos & Cookies",
    image: "https://guiadacozinha.com.br/wp-content/uploads/2019/05/Biscoito-de-aveia-e-mel-768x619.jpg",
    time: "25 min",
    servings: "15 cookies",
    author: "TudoGostoso",
    ingredients: [
      "1 xícara de aveia em flocos",
      "1/2 xícara de farinha de trigo",
      "3 colheres (sopa) de mel",
      "2 colheres (sopa) de manteiga",
      "1 ovo",
      "1 colher (chá) de fermento em pó"
    ],
    steps: [
      "Em uma tigela, bata a manteiga, o mel e o ovo.",
      "Misture a aveia, a farinha e o fermento até formar uma massa pegajosa.",
      "Modele os cookies com auxílio de duas colheres em assadeira untada.",
      "Asse a 180°C por 15 minutos."
    ]
  },
  "biscoito-amanteigado-que-derrete-na-boca": {
    title: "Biscoito Amanteigado que Derrete na Boca",
    tag: "Biscoitos & Cookies",
    image: "https://receitacerta.blog.br/wp-content/uploads/2025/04/biscoito-amanteigado-de-maizena-1-768x512.webp",
    time: "25 min",
    servings: "30 biscoitos",
    author: "Jacquin",
    ingredients: [
      "200g de manteiga sem sal em temperatura ambiente",
      "1/2 xícara de açúcar",
      "2 xícaras de amido de milho (maizena)",
      "1/2 xícara de farinha de trigo"
    ],
    steps: [
      "Misture todos os ingredientes em uma tigela amassando bem até formar uma massa lisa e uniforme.",
      "Faça pequenas bolinhas e acomode em uma assadeira.",
      "Pressione levemente cada bolinha com as costas de um garfo.",
      "Asse a 180°C por cerca de 15 minutos (sem deixar dourar demais por cima)."
    ]
  },
  "cookie-red-velvet": {
    title: "Cookie Red Velvet",
    tag: "Biscoitos & Cookies",
    image: "https://teamodoce.com.br/wp-content/uploads/2026/04/Cookie-Red-Velvet-com-Leite-Ninho.webp",
    time: "30 min",
    servings: "12 cookies",
    author: "Bob Esponja",
    ingredients: [
      "100g de manteiga",
      "1/2 xícara de açúcar",
      "1 ovo",
      "1 colher (sopa) de corante vermelho em gel",
      "1 e 1/2 xícara de farinha de trigo",
      "2 colheres (sopa) de cacau em pó",
      "1/2 xícara de gotas de chocolate branco"
    ],
    steps: [
      "Bata a manteiga com o açúcar e o ovo até virar um creme.",
      "Adicione o corante vermelho, o cacau e a farinha de trigo.",
      "Adicione as gotas de chocolate branco delicadamente.",
      "Modele disquinhos e asse a 180°C por 15 minutos em forma untada."
    ]
  },

  /* ----- Doces Tradicionais e Saudáveis & Fit ----- */
  "arroz-doce-cremoso": {
    title: "Arroz-Doce Cremoso",
    tag: "Doces Tradicionais",
    image: "https://static.itdg.com.br/images/1200-675/c70086104b0e012b3f8f03a825525270/arroz-doce-cremoso.jpg",
    time: "45 min",
    servings: "8 porções",
    author: "Marcos Santos",
    ingredients: [
      "1 xícara (chá) de arroz branco",
      "2 xícaras (chá) de água",
      "1 litro de leite",
      "1 lata de leite condensado",
      "1/2 xícara (chá) de açúcar",
      "1 pau de canela",
      "1 pitada de sal",
      "Canela em pó para polvilhar"
    ],
    steps: [
      "Em uma panela, cozinhe o arroz com a água, o pau de canela e o sal até a água secar quase por completo, por cerca de 15 minutos.",
      "Adicione o leite e cozinhe em fogo baixo, mexendo de vez em quando, por uns 20 minutos, até o arroz ficar macio.",
      "Junte o leite condensado e o açúcar e mexa por mais 5 minutos, até obter um creme espesso.",
      "Retire o pau de canela, despeje em uma travessa e polvilhe canela em pó. Sirva morno ou gelado."
    ]
  },
  "quindim-tradicional": {
    title: "Quindim Tradicional",
    tag: "Doces Tradicionais",
    image: "https://receitatodahora.com.br/wp-content/uploads/2023/12/como-fazer-quindim-1812.jpg",
    time: "60 min",
    servings: "12 unidades",
    author: "Mariela",
    ingredients: [
      "10 gemas peneiradas",
      "1 xícara (chá) de açúcar (cerca de 200 g)",
      "1 vidro de leite de coco (200 ml)",
      "100 g de coco ralado seco",
      "1 colher (sopa) de manteiga derretida",
      "Manteiga e açúcar para untar as forminhas"
    ],
    steps: [
      "Preaqueça o forno a 180 °C e unte as forminhas com manteiga e açúcar.",
      "Misture as gemas com o açúcar com uma colher, sem bater, para não formar espuma.",
      "Acrescente a manteiga derretida, o leite de coco e o coco ralado e misture até ficar homogêneo.",
      "Distribua nas forminhas e deixe descansar por 20 minutos, para o coco subir e formar a camada de cima.",
      "Leve ao forno em banho-maria por cerca de 40 minutos, até firmar e dourar.",
      "Espere esfriar por completo antes de desenformar."
    ]
  },
  "cocada-branca-de-fogao": {
    title: "Cocada Branca de Fogão",
    tag: "Doces Tradicionais",
    image: "https://i.panelinha.com.br/i1/bk-7265-cocada.webp",
    time: "30 min",
    servings: "20 unidades",
    author: "Tavyla",
    ingredients: [
      "300 g de coco fresco ralado",
      "1 xícara (chá) de açúcar",
      "1/2 xícara (chá) de água",
      "1/2 xícara (chá) de leite de coco",
      "Manteiga para untar"
    ],
    steps: [
      "Em uma panela, leve o açúcar e a água ao fogo médio, sem mexer, até formar uma calda rala (cerca de 10 minutos).",
      "Junte o coco ralado e o leite de coco e misture bem.",
      "Cozinhe em fogo baixo, mexendo sempre, até a massa começar a soltar do fundo da panela.",
      "Com a ajuda de duas colheres, modele porções sobre uma superfície untada com manteiga.",
      "Espere esfriar e firmar antes de servir."
    ]
  },
  "curau-de-milho-verde": {
    title: "Curau de Milho Verde",
    tag: "Doces Tradicionais",
    image: "https://www.sabornamesa.com.br/media/k2/items/cache/e791ab626e6785062374d45b25cc6e7f_XL.jpg",
    time: "45 min",
    servings: "10 porções",
    author: "Tia Neide",
    ingredients: [
      "5 espigas de milho verde",
      "1 litro de leite",
      "1 1/2 xícara (chá) de açúcar",
      "1 pitada de sal",
      "Canela em pó para servir"
    ],
    steps: [
      "Corte os grãos das espigas rente ao sabugo, sem pegar a parte branca, que amarga.",
      "Bata os grãos com o leite no liquidificador e passe a mistura por uma peneira, pressionando bem.",
      "Leve o líquido coado a uma panela com o açúcar e o sal e cozinhe em fogo médio, mexendo sem parar.",
      "Quando engrossar e ficar cremoso (cerca de 25 minutos), despeje em potinhos ou em um refratário.",
      "Deixe esfriar, polvilhe canela e leve à geladeira antes de servir."
    ]
  },
  "pe-de-moleque-de-rapadura": {
    title: "Pé de Moleque de Rapadura",
    tag: "Doces Tradicionais",
    image: "https://s2-receitas.glbimg.com/LeW6U2HAjQu9_9wQVXK3GRmsqL8=/0x0:847x554/984x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_1f540e0b94d8437dbbc39d567a1dee68/internal_photos/bs/2023/d/V/GQ1AnZT9aczzb4VGbqAw/receita-de-pe-de-moleque.jpg",
    time: "30 min",
    servings: "25 pedaços",
    author: "Dona Sonia",
    ingredients: [
      "500 g de rapadura picada",
      "1/2 xícara (chá) de água",
      "500 g de amendoim torrado e sem pele",
      "Manteiga para untar"
    ],
    steps: [
      "Unte uma superfície de mármore, uma assadeira ou uma forma com manteiga.",
      "Em uma panela grande, derreta a rapadura com a água em fogo médio, mexendo até virar uma calda grossa.",
      "Junte o amendoim e mexa sem parar até a mistura ficar mais clara e começar a soltar do fundo.",
      "Despeje sobre a superfície untada e espalhe com uma espátula.",
      "Corte em quadrados ainda morno e deixe endurecer antes de servir."
    ]
  },
  "bolo-de-banana-com-aveia": {
    title: "Bolo de Banana com Aveia",
    tag: "Saudáveis & Fit",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ28di0S-DY-ZVymB2vzfIDEiMQp_5kyzI7T8wqJgb-EJTKDfkkZiilO-U&s=10",
    time: "40 min",
    servings: "10 fatias",
    author: "Tia Fitness",
    ingredients: [
      "3 bananas maduras amassadas",
      "2 ovos",
      "1/4 xícara (chá) de óleo de coco derretido",
      "1/4 xícara (chá) de mel",
      "1 1/2 xícara (chá) de aveia em flocos finos",
      "1 colher (chá) de canela em pó",
      "1 colher (sopa) de fermento em pó"
    ],
    steps: [
      "Preaqueça o forno a 180 °C e unte uma forma pequena com óleo de coco.",
      "Bata as bananas, os ovos, o óleo de coco e o mel até ficar homogêneo.",
      "Acrescente a aveia e a canela e misture bem.",
      "Por último, adicione o fermento e misture delicadamente.",
      "Despeje na forma e asse por 30 a 35 minutos, até um palito sair limpo."
    ]
  },
  "mousse-de-abacate-com-cacau": {
    title: "Mousse de Abacate com Cacau",
    tag: "Saudáveis & Fit",
    image: "https://d1uz88p17r663j.cloudfront.net/original/6044851c0d88b583e35de7b3df617419_mousse-cacau-abacate-ultra-mousse-abacate-receitas-nestle.jpg",
    time: "10 min (+ geladeira)",
    servings: "4 porções",
    author: "Guilherme Fit",
    ingredients: [
      "1 abacate maduro grande",
      "3 colheres (sopa) de cacau em pó",
      "3 colheres (sopa) de mel",
      "1/2 xícara (chá) de leite ou bebida vegetal",
      "1 colher (chá) de extrato de baunilha",
      "1 pitada de sal",
      "Frutas vermelhas para decorar"
    ],
    steps: [
      "Retire a polpa do abacate e coloque no liquidificador ou processador.",
      "Adicione o cacau, o mel, o leite, a baunilha e o sal.",
      "Bata até obter um creme liso e brilhante. Prove e ajuste o doce, se quiser.",
      "Distribua em taças e leve à geladeira por pelo menos 2 horas.",
      "Decore com frutas vermelhas na hora de servir."
    ]
  },
  "Mousse-de-chia-com-coco": {
    title: "Mousse de Chia com Coco",
    tag: "Saudáveis & Fit",
    image: "https://static.itdg.com.br/images/1200-675/c7fb10fa622115b3a4e049f415e8b692/editorial-jdl-1280-x-720-px-2026-03-16t174131.973.png",
    time: "10 min (+ geladeira)",
    servings: "2 porções",
    author: "Pompompurin",
    ingredients: [
      "1/4 xícara (chá) de sementes de chia",
      "1 xícara (chá) de bebida de coco",
      "1 colher (sopa) de mel",
      "1/2 colher (chá) de extrato de baunilha",
      "Frutas picadas para servir (morango, manga ou banana)"
    ],
    steps: [
      "Em um pote, misture a chia, a bebida de coco, o mel e a baunilha.",
      "Espere 5 minutos e mexa novamente, para a chia não formar grumos.",
      "Tampe e leve à geladeira por pelo menos 4 horas, ou de um dia para o outro, até ficar com textura de pudim.",
      "Sirva em copinhos com as frutas picadas por cima."
    ]
  },
  "brownie-de-batata-doce": {
    title: "Brownie de Batata-Doce",
    tag: "Saudáveis & Fit",
    image: "https://d1uz88p17r663j.cloudfront.net/original/cef5ca504d2dbc205ba1ca88af6b430f_brownie-batata-doce-receitas-nestle.jpg",
    time: "50 min",
    servings: "12 pedaços",
    author: "Sandra Belissima",
    ingredients: [
      "2 batatas-doces médias cozidas e amassadas (cerca de 300 g)",
      "2 ovos",
      "1/3 xícara (chá) de cacau em pó",
      "1/3 xícara (chá) de açúcar de coco ou mascavo",
      "1/4 xícara (chá) de óleo de coco",
      "1/2 xícara (chá) de aveia em flocos finos",
      "1 colher (chá) de fermento em pó",
      "1 pitada de sal"
    ],
    steps: [
      "Preaqueça o forno a 180 °C e unte uma forma pequena.",
      "Bata a batata-doce com os ovos, o açúcar e o óleo de coco até virar uma massa lisa.",
      "Junte o cacau, a aveia e o sal e misture.",
      "Adicione o fermento por último e despeje a massa na forma.",
      "Asse por 25 a 30 minutos. Espere esfriar antes de cortar em quadrados."
    ]
  },
  "sorvete-cremoso-de-banana": {
    title: "Sorvete Cremoso de Banana",
    tag: "Saudáveis & Fit",
    image: "https://static.itdg.com.br/images/1200-675/be0fd84142aeb3a3bfaddfc368602f51/307153-original.jpg",
    time: "10 min (+ congelador)",
    servings: "4 porções",
    author: "Imola",
    ingredients: [
      "4 bananas maduras fatiadas e congeladas",
      "2 colheres (sopa) de pasta de amendoim (opcional)",
      "1 colher (sopa) de cacau em pó (opcional)",
      "2 colheres (sopa) de leite ou bebida vegetal, se precisar"
    ],
    steps: [
      "Congele as fatias de banana por pelo menos 4 horas.",
      "Bata no processador ou liquidificador, parando para raspar as laterais, até virar um creme liso.",
      "Se a máquina travar, junte um pouco de leite, uma colher por vez.",
      "Acrescente a pasta de amendoim ou o cacau, se desejar, e bata rapidamente.",
      "Sirva na hora, como sorvete mole, ou congele por 30 minutos para firmar."
    ]
  }
};

const USER_RECIPES_KEY = 'cd_receitas_usuarios';

function getUserRecipes() {
  return store.get(USER_RECIPES_KEY, []);
}

function getAllRecipes() {
  const all = { ...RECEITAS };
  getUserRecipes().forEach(r => { all[r.id] = r; });
  return all;
}

/* ===================================================
   CONTAS: cadastro, login e sessão
   =================================================== */
const USERS_KEY = 'cd_usuarios';
const SESSION_KEY = 'cd_sessao';

function getUsers() {
  return store.get(USERS_KEY, []);
}

function currentUser() {
  const id = store.get(SESSION_KEY, null);
  if (!id) return null;
  return getUsers().find(u => u.id === id) || null;
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

// A senha NUNCA é guardada em texto puro: guardamos só o "hash" (PBKDF2 + salt)
async function hashPassword(password, salt) {
  if (window.crypto && crypto.subtle) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
      key, 256
    );
    return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Plano B (navegadores sem crypto.subtle): bem mais fraco
  let h = 5381;
  const s = salt + password;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return 'f' + (h >>> 0).toString(16);
}

async function registerUser(name, email, password) {
  name = name.trim();
  email = email.trim().toLowerCase();

  if (name.length < 2) return { ok: false, error: 'Digite seu nome.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'E-mail inválido.' };
  if (password.length < 6) return { ok: false, error: 'A senha precisa ter pelo menos 6 caracteres.' };

  const users = getUsers();
  if (users.some(u => u.id === email)) return { ok: false, error: 'Já existe uma conta com esse e-mail.' };

  const salt = randomSalt();
  const hash = await hashPassword(password, salt);
  users.push({ id: email, name, email, salt, hash, created: new Date().toISOString() });

  if (!store.set(USERS_KEY, users)) return { ok: false, error: 'Não foi possível salvar a conta neste navegador.' };
  store.set(SESSION_KEY, email);
  return { ok: true };
}

async function loginUser(email, password) {
  email = email.trim().toLowerCase();
  const user = getUsers().find(u => u.id === email);
  // Mesma mensagem para e-mail ou senha errados (não revela qual existe)
  const fail = { ok: false, error: 'E-mail ou senha incorretos.' };
  if (!user) return fail;

  const hash = await hashPassword(password, user.salt);
  if (hash !== user.hash) return fail;

  store.set(SESSION_KEY, user.id);
  return { ok: true };
}

function logoutUser() {
  store.remove(SESSION_KEY);
}

// Exige login; se não houver, avisa e manda para a tela de entrar
function requireLogin(msg) {
  const user = currentUser();
  if (user) return user;
  showToast(msg || 'Entre na sua conta para continuar');
  setTimeout(() => {
    location.href = 'login.html?next=' + encodeURIComponent(currentPage());
  }, 1000);
  return null;
}

/* ===================================================
   FAVORITOS (cada conta tem os seus)
   =================================================== */
const favKey = (userId) => `cd_fav_${userId}`;

function getFavs() {
  const user = currentUser();
  return user ? store.get(favKey(user.id), []) : [];
}

// Retorna true se a receita ficou favoritada, false se saiu, null se não está logado
function toggleFavorite(id, btn) {
  const user = requireLogin('Entre na sua conta para favoritar receitas');
  if (!user) return null;

  const favs = getFavs();
  const i = favs.indexOf(id);
  if (i >= 0) favs.splice(i, 1); else favs.push(id);
  store.set(favKey(user.id), favs);

  const nowFav = i < 0;
  if (btn) btn.classList.toggle('liked', nowFav);
  return nowFav;
}

/* ===================================================
   AVALIAÇÕES (nota média) e TEMPO DE PREPARO
   =================================================== */
const RATING_KEY = 'cd_avaliacoes_v2';   // { idReceita: { idUsuario: nota } }

// Nota média e quantidade de avaliações de uma receita
function getRatingStats(id) {
  const notes = Object.values(store.get(RATING_KEY, {})[id] || {});
  const count = notes.length;
  return { count, avg: count ? notes.reduce((a, b) => a + b, 0) / count : 0 };
}

// "45 min (+ geladeira)" -> 45  (a geladeira não entra na conta)
function parseMinutes(text) {
  const m = String(text).match(/\d+/);
  return m ? parseInt(m[0], 10) : 99999;
}

/* ===================================================
   CARD DE RECEITA (usado na página inicial e no perfil)
   =================================================== */
function buildRecipeCard(id, r, opts = {}) {
  const card = document.createElement('article');
  card.className = 'recipe-card';
  card.dataset.id = id;
  card.dataset.bound = '1';
  card.dataset.minutes = parseMinutes(r.time);
  const stats = getRatingStats(id);
  card.dataset.rating = stats.avg;
  card.dataset.ratingCount = stats.count;
  card.tabIndex = 0;
  card.setAttribute('role', 'link');

  // Imagem + botão de curtir
  const imgBox = document.createElement('div');
  imgBox.className = 'recipe-image';
  const img = document.createElement('img');
  img.loading = 'lazy';
  img.onerror = () => { img.onerror = null; img.src = PLACEHOLDER_IMG; };
  img.src = r.image || PLACEHOLDER_IMG;
  img.alt = r.title;
  const like = document.createElement('button');
  like.type = 'button';
  like.className = 'like-btn';
  like.setAttribute('aria-label', 'Favoritar');
  like.innerHTML = '<i class="fa-regular fa-heart default-icon"></i><i class="fa-solid fa-cake-candles cupcake-icon"></i>';
  if (getFavs().includes(id)) like.classList.add('liked');
  like.addEventListener('click', (e) => {
    e.stopPropagation();
    const result = toggleFavorite(id, like);
    if (result !== null && opts.onFavChange) opts.onFavChange(id, result);
  });
  imgBox.append(img, like);

  // Conteúdo
  const content = document.createElement('div');
  content.className = 'recipe-content';

  const tag = document.createElement('span');
  tag.className = 'recipe-tag';
  tag.textContent = r.tag;

  const h3 = document.createElement('h3');
  h3.textContent = r.title;

  const info = document.createElement('p');
  info.className = 'recipe-info';
  const t = document.createElement('span');
  t.innerHTML = '<i class="fa-regular fa-clock"></i> ';
  t.append(r.time);
  const s = document.createElement('span');
  s.innerHTML = '<i class="fa-regular fa-user"></i> ';
  s.append(r.servings);
  info.append(t, s);
  if (stats.count) {
    const st = document.createElement('span');
    st.className = 'rating-chip';
    st.innerHTML = '<i class="fa-solid fa-star"></i> ';
    st.append(stats.avg.toFixed(1).replace('.', ','));
    info.append(st);
  }

  const author = document.createElement('div');
  author.className = 'recipe-author';
  const av = makeAvatar(getAuthorPhoto(r), 'author-avatar');
  const by = document.createElement('span');
  by.append('Por ');
  const strong = document.createElement('strong');
  strong.textContent = r.author;
  by.append(strong);
  author.append(av, by);

  content.append(tag, h3, info, author);
  card.append(imgBox, content);

  // Abrir a receita ao clicar
  const open = () => { location.href = `receita.html?id=${encodeURIComponent(id)}`; };
  card.addEventListener('click', open);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target === card) open();
  });

  return card;
}

// Coloca na página inicial as receitas fixas (do RECEITAS acima)
function renderBuiltInRecipeCards(grid) {
  if (!grid) return;
  Object.entries(RECEITAS).forEach(([id, r]) => grid.append(buildRecipeCard(id, r)));
}

// Coloca na página inicial as receitas publicadas pelos usuários
function renderUserRecipeCards(grid) {
  if (!grid) return;
  [...getUserRecipes()].reverse().forEach(r => grid.append(buildRecipeCard(r.id, r)));
}

/* ===================================================
   CABEÇALHO: mostra o nome de quem está logado
   =================================================== */
(function updateHeaderProfile() {
  const link = document.querySelector('.profile-link');
  if (!link) return;
  const label = link.querySelector('span');
  const user = currentUser();
  if (user) {
    link.href = 'perfil.html';
    label.textContent = user.name.split(' ')[0];
    if (user.photo) {
      const icon = link.querySelector('.profile-icon');
      if (icon) icon.replaceWith(makeAvatar(user.photo, 'avatar-header'));
    }
  } else {
    link.href = 'login.html';
    label.textContent = 'Entrar / Cadastrar';
  }
})();

// Fotos dos autores escritos direto no HTML (cards da página inicial)
hydrateAvatars();

/* ===================================================
   TAMANHO DA LETRA (A- A A+)
   Muda o tamanho do <html>; como o texto do CSS está em rem,
   o site inteiro acompanha. A escolha fica salva no navegador.
   =================================================== */
const FONT_KEY = 'cd_fonte';
const FONT_LEVELS = [90, 100, 115, 130, 150];   // % do tamanho normal
const FONT_DEFAULT = 1;                          // posição do 100%

(function initFontControls() {
  let level = store.get(FONT_KEY, FONT_DEFAULT);
  if (!Number.isInteger(level) || level < 0 || level >= FONT_LEVELS.length) level = FONT_DEFAULT;
  document.documentElement.style.fontSize = FONT_LEVELS[level] + '%';

  const bar = document.querySelector('.header-top');
  if (!bar) return;

  const box = document.createElement('div');
  box.className = 'font-controls';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', 'Tamanho da letra');

  const make = (text, label, cls, change) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.className = cls;
    b.title = label;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => {
      level = change(level);
      store.set(FONT_KEY, level);
      document.documentElement.style.fontSize = FONT_LEVELS[level] + '%';
      showToast(`Tamanho da letra: ${FONT_LEVELS[level]}%`);
      update();
    });
    return b;
  };

  const down = make('A-', 'Diminuir a letra', 'fc-down', l => Math.max(0, l - 1));
  const reset = make('A', 'Tamanho normal da letra', 'fc-reset', () => FONT_DEFAULT);
  const up = make('A+', 'Aumentar a letra', 'fc-up', l => Math.min(FONT_LEVELS.length - 1, l + 1));

  function update() {
    down.disabled = level === 0;
    up.disabled = level === FONT_LEVELS.length - 1;
    reset.setAttribute('aria-pressed', String(level === FONT_DEFAULT));
  }
  update();

  box.append(down, reset, up);
  bar.insertBefore(box, bar.querySelector('.user-profile'));
})();