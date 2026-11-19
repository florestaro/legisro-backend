// Mapa da Praça Escola: a cidade em quadrinhos de 40 px (36 de largura por 30 de altura).
// Fica num lugar só porque o programa (app/js/apps/praca.js) desenha a partir dele e os colegas de
// demonstração (só no modo de teste no navegador) andam por ele sem atravessar prédios.
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else { raiz.CE = raiz.CE || {}; raiz.CE.pracaMapa = fabrica(); }
})(typeof self !== 'undefined' ? self : this, function () {
  const T = 40, W = 36, H = 30;
  const chao = Array.from({ length: H }, () => Array(W).fill('grama'));
  const bloq = Array.from({ length: H }, () => Array(W).fill(false));
  const dono = Array.from({ length: H }, () => Array(W).fill(null));
  const pinta = (x0, y0, x1, y1, t) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) chao[y][x] = t; };
  pinta(0, 4, 35, 4, 'calcada'); pinta(0, 7, 35, 7, 'calcada'); pinta(0, 18, 35, 18, 'calcada'); pinta(0, 21, 35, 21, 'calcada');
  pinta(0, 5, 35, 6, 'rua'); pinta(0, 19, 35, 20, 'rua');
  pinta(8, 8, 8, 17, 'calcada'); pinta(11, 8, 11, 17, 'calcada'); pinta(24, 8, 24, 17, 'calcada'); pinta(27, 8, 27, 17, 'calcada');
  pinta(0, 13, 7, 13, 'calcada'); pinta(28, 13, 35, 13, 'calcada');
  pinta(9, 7, 10, 18, 'rua'); pinta(25, 7, 26, 18, 'rua');
  pinta(12, 8, 23, 17, 'praca');
  pinta(0, 22, 10, 24, 'terra'); pinta(31, 22, 32, 24, 'terra');
  pinta(12, 22, 16, 24, 'horta'); pinta(31, 1, 34, 3, 'lote');
  pinta(18, 24, 28, 24, 'plataforma');
  pinta(0, 25, 35, 25, 'trilho'); pinta(0, 26, 35, 26, 'areia'); pinta(0, 27, 35, 29, 'agua'); pinta(31, 26, 32, 28, 'pier');
  const bloqueia = (x0, y0, w, h, id) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { bloq[y][x] = true; if (id) dono[y][x] = id; }
  };

  // Prédios (com telhado e portas) e áreas (sem prédio). As portas ficam na parede da frente, embaixo.
  const LUGARES = [
    { id: 'escola', nome: 'Escola', emoji: '🏫', r: [13, 0, 10, 4], portas: [17, 18], telhado: '#C4543A', parede: '#F1DDAA' },
    { id: 'casa-ana', nome: 'Casa', emoji: '🏠', casa: true, r: [1, 1, 3, 3], portas: [2], telhado: '#3B8C88', parede: '#F4E4C1' },
    { id: 'sua-casa', nome: 'Sua casa', emoji: '🏠', casa: true, r: [5, 1, 3, 3], portas: [6], telhado: '#C8653A', parede: '#F4E4C1' },
    { id: 'casa-bruno', nome: 'Casa', emoji: '🏠', casa: true, r: [9, 1, 3, 3], portas: [10], telhado: '#B4485A', parede: '#F4E4C1' },
    { id: 'empregos', nome: 'Agência de Empregos', emoji: '💼', r: [24, 1, 6, 3], portas: [26, 27], telhado: '#5A5EA6', parede: '#ECE9F5' },
    { id: 'lote', nome: 'Lote da turma', emoji: '🚧', area: true, r: [31, 1, 4, 3], entradas: [[31, 4], [32, 4], [33, 4], [34, 4]] },
    { id: 'banco', nome: 'Banco Escola', emoji: '🏦', r: [1, 8, 7, 5], portas: [4], telhado: '#3D6C8C', parede: '#E3EBF0', morador: 'lucia' },
    { id: 'correios', nome: 'Correios', emoji: '📮', r: [1, 14, 7, 4], portas: [4], telhado: '#D49A34', parede: '#F3E8D0' },
    { id: 'prefeitura', nome: 'Prefeitura', emoji: '🏛️', r: [28, 8, 7, 5], portas: [31], telhado: '#8D4937', parede: '#F4EFE2', colunas: true },
    { id: 'posto', nome: 'Posto de Saúde', emoji: '🏥', r: [28, 14, 7, 4], portas: [31], telhado: '#3A9874', parede: '#FAFAF6', cruz: true, morador: 'cida' },
    { id: 'feira', nome: 'Feira', emoji: '🧺', area: true, r: [0, 22, 11, 3], morador: 'raimundo' },
    { id: 'horta', nome: 'Horta comunitária', emoji: '🥬', area: true, r: [12, 22, 5, 3], entradas: [[13, 21], [14, 21], [15, 21]] },
    { id: 'estacao', nome: 'Estação Madeira-Mamoré', emoji: '🚂', r: [19, 22, 9, 2], portas: [23], telhado: '#A13A2C', parede: '#E7C26A' },
    // A hamburgueria da turma: clicando nela, o jogo "Do Campo ao Balcão" (app/js/apps/negocio.js).
    { id: 'lanchonete', nome: 'Do Campo ao Balcão', emoji: '🍔', r: [33, 22, 3, 2], portas: [34], telhado: '#C62828', parede: '#FFF3D6', faixa: '#F2B705', placa: '🍔' },
    { id: 'rio', nome: 'Cais do Rio Madeira', emoji: '⛵', area: true, r: [29, 26, 7, 4], morador: 'bene', entradas: [[31, 26], [32, 26], [31, 27], [32, 27], [31, 28]] },
  ];
  // Coisas da praça.
  const OBJETOS = [
    { id: 'coreto', nome: 'Coreto', emoji: '🎭', r: [16, 8, 4, 3], entradas: [[16, 11], [17, 11], [18, 11], [19, 11]] },
    { id: 'fonte', nome: 'Fonte', emoji: '⛲', r: [17, 13, 2, 2], entradas: [[16, 13], [16, 14], [19, 13], [19, 14], [17, 12], [18, 12], [17, 15], [18, 15]] },
    { id: 'mesa-velha', nome: 'Jogo da velha', emoji: '❌', r: [14, 13, 1, 1], entradas: [[13, 13], [14, 12], [14, 14], [15, 13]] },
    { id: 'mesa-domino', nome: 'Dominó', emoji: '🎲', r: [21, 13, 1, 1], entradas: [[21, 12], [21, 14]] },
    { id: 'mural', nome: 'Mural de recados', emoji: '📌', r: [21, 8, 2, 1], entradas: [[21, 9], [22, 9]] },
    { id: 'lixeira', nome: 'Lata de lixo', emoji: '🗑️', r: [22, 15, 1, 1], entradas: [[21, 15], [23, 15], [22, 14], [22, 16]] },
    // Coleta seletiva: cinco lixeiras coloridas na beira da praça (as entradas são calculadas mais abaixo).
    { id: 'coleta-azul', nome: 'Lixeira azul (papel)', emoji: '🟦', r: [15, 17, 1, 1], coleta: 'papel', cor: '#2F6FD6' },
    { id: 'coleta-vermelha', nome: 'Lixeira vermelha (plástico)', emoji: '🟥', r: [16, 17, 1, 1], coleta: 'plastico', cor: '#D63B30' },
    { id: 'coleta-verde', nome: 'Lixeira verde (vidro)', emoji: '🟩', r: [19, 17, 1, 1], coleta: 'vidro', cor: '#2E9B4F' },
    { id: 'coleta-amarela', nome: 'Lixeira amarela (metal)', emoji: '🟨', r: [20, 17, 1, 1], coleta: 'metal', cor: '#E8B423' },
    { id: 'coleta-marrom', nome: 'Lixeira marrom (orgânico)', emoji: '🟫', r: [21, 17, 1, 1], coleta: 'organico', cor: '#8A5A35' },
  ];
  // Moradores: personagens do computador, sempre no mesmo lugar (o mesmo para todos os alunos).
  const MORADORES = [
    { id: 'rosa', nome: 'Dona Rosa', emoji: '👵', x: 15, y: 11 },
    { id: 'lucia', nome: 'Dona Lúcia', emoji: '👩‍💼', x: 3, y: 13, lugar: 'banco' },
    { id: 'raimundo', nome: 'Seu Raimundo', emoji: '👨‍🌾', x: 5, y: 23, lugar: 'feira' },
    { id: 'cida', nome: 'Enfermeira Cida', emoji: '👩‍⚕️', x: 32, y: 18, lugar: 'posto' },
    { id: 'bene', nome: 'Seu Bené', emoji: '👴', x: 32, y: 28, lugar: 'rio' },
    { id: 'oferta', nome: 'Moço da Oferta', emoji: '🕴️', x: 24, y: 17 },
  ];
  // A cidade cresce com a turma: cada prédio acende quando metade da turma conclui o módulo ligado a ele.
  // ("artigo" serve para as frases: "a turma acendeu os Correios".)
  // A Escola e a praça ficam abertas desde o começo.
  const CIDADE = [
    { lugar: 'horta', artigo: 'a', modulo: 'n1-computador', titulo: 'Conhecendo o computador' },
    { lugar: 'estacao', artigo: 'a', modulo: 'n1-teclado', titulo: 'Teclado' },
    { lugar: 'rio', artigo: 'o', modulo: 'n1-internet', titulo: 'Internet' },
    { lugar: 'posto', artigo: 'o', modulo: 'n1-seguranca', titulo: 'Segurança básica' },
    { lugar: 'correios', artigo: 'os', modulo: 'n2-email', titulo: 'E-mail' },
    { lugar: 'banco', artigo: 'o', modulo: 'n2-servicos', titulo: 'Banco e serviços digitais' },
    { lugar: 'prefeitura', artigo: 'a', modulo: 'n2-gov', titulo: 'Serviços públicos pela internet (gov.br)' },
    { lugar: 'feira', artigo: 'a', modulo: 'n3-vendas', titulo: 'Vender pela internet e MEI' },
    { lugar: 'empregos', artigo: 'a', modulo: 'n3-trabalho', titulo: 'Computador e trabalho' },
  ];
  // A casa de cada aluno: fica pronta no primeiro módulo e ganha um enfeite por nível ou curso concluído.
  const CASA_PRONTA = 'n1-computador';
  const ENFEITES = [
    { modulo: 'n1-prova', emoji: '🌻', nome: 'jardim (Iniciante)' },
    { modulo: 'n2-prova', emoji: '📮', nome: 'caixa de correio (Intermediário)' },
    { modulo: 'n3-prova', emoji: '🏪', nome: 'lojinha (Avançado)' },
    { modulo: 'n4-prova', emoji: '💼', nome: 'escritório (Profissional)' },
    { modulo: 'n5-projeto', emoji: '🗂️', nome: 'arquivo (Assistente Administrativo)' },
    { modulo: 'cel-final', emoji: '📱', nome: 'antena (Celular)' },
    { modulo: 'cri-final', emoji: '🎨', nome: 'ateliê (Criação digital)' },
  ];
  const MODULOS_DA_CIDADE = [...new Set([...CIDADE.map((c) => c.modulo), CASA_PRONTA, ...ENFEITES.map((e) => e.modulo)])];
  const BANCOS = [[14, 11], [20, 11], [14, 16], [20, 16]];
  const BARRACAS = [[1, 22, '#D9483B'], [3, 22, '#2F7DC0'], [5, 22, '#3B9A57'], [7, 22, '#E2A02A'], [9, 22, '#B65AA8']];
  const IPES = [[12, 8, 'amarelo'], [23, 8, 'roxo'], [12, 17, 'roxo'], [23, 17, 'amarelo']];
  const ARVORES = [[0, 0], [7, 0], [11, 0], [24, 0], [29, 0], [35, 0], [4, 2], [8, 2], [12, 2], [23, 2], [30, 2], [35, 2],
    [0, 9], [0, 16], [35, 10], [35, 16], [11, 23], [17, 23], [29, 23]];
  const PALMEIRAS = [[3, 26], [15, 26], [26, 26]];
  // O poste de luz na calçada da praça, perto da lata de lixo (no incêndio, o fogo pode chegar nele: água, não!).
  const POSTE = [24, 14];

  // A altura de cada prédio (em quadrinhos) na Praça em 3D (isométrica) e na abertura (a maquete): a Escola e a
  // Prefeitura são as mais altas, as casas baixas. "bico" é o telhado de duas águas (casas e estação).
  const ALTURAS = { escola: 3, prefeitura: 3, banco: 2.3, empregos: 2.1, correios: 2, posto: 2, estacao: 1.5, lanchonete: 1.4 };
  const alturaDe = (L) => (L.casa ? 1.25 : ALTURAS[L.id] || 2);
  const bicoDe = (L) => (L.casa || L.id === 'estacao' ? 0.45 : 0);

  const porLugar = {};
  for (const L of [...LUGARES, ...OBJETOS]) {
    porLugar[L.id] = L;
    const [x, y, w, h] = L.r;
    if (L.portas) L.entradas = L.portas.map((px) => [px, y + h]);
    if (!L.area) bloqueia(x, y, w, h, L.id);
  }
  bloqueia(12, 22, 5, 3, 'horta'); bloqueia(31, 1, 4, 3, 'lote');
  for (const [x, y] of BANCOS) bloqueia(x, y, 2, 1, null);
  for (const [x, y] of BARRACAS) bloqueia(x, y, 1, 1, 'feira');
  for (const [x, y] of [...IPES, ...ARVORES, ...PALMEIRAS]) bloqueia(x, y, 1, 1, null);
  bloqueia(POSTE[0], POSTE[1], 1, 1, null);
  for (const m of MORADORES) bloq[m.y][m.x] = true;
  for (let y = 27; y < H; y++) for (let x = 0; x < W; x++) if (chao[y][x] === 'agua') dono[y][x] = 'rio';
  // A feira se usa por dentro: qualquer chão de terra dela serve de entrada.
  porLugar.feira.entradas = [];
  for (let y = 22; y <= 24; y++) for (let x = 0; x <= 10; x++) if (!bloq[y][x]) porLugar.feira.entradas.push([x, y]);
  // O monte de areia da obra, no Lote da turma (na enchente, a praia alaga primeiro).
  porLugar.lote.entradas = porLugar.lote.entradas.slice();

  const andavelFixo = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !bloq[y][x] && chao[y][x] !== 'agua';
  for (const L of OBJETOS) if (L.coleta) { const [x, y] = L.r; L.entradas = [[x, y + 1], [x, y - 1], [x - 1, y], [x + 1, y]].filter(([a, b]) => andavelFixo(a, b)); }
  // Onde o lixo da coleta seletiva pode aparecer: no chão da praça e nas calçadas (nunca na entrada de um lugar).
  const LUGARES_DO_LIXO = [];
  // Nos eventos urgentes o mapa muda: árvore caída e fio no chão fecham a rua, e a enchente cobre as fileiras de baixo.
  let fechados = new Set(), aguaDesde = H;
  const livre = (x, y) => y < aguaDesde && !fechados.has(y * W + x);
  const andavel = (x, y) => andavelFixo(x, y) && livre(x, y);
  // tiles: [[x, y], ...] que ficam fechados; linhaAgua: da fileira linhaAgua para baixo está alagado (H = nada).
  function definirBloqueios(tiles, linhaAgua) {
    fechados = new Set((tiles || []).filter((c) => Array.isArray(c)).map(([x, y]) => y * W + x));
    aguaDesde = Number.isFinite(linhaAgua) ? Math.max(0, Math.min(H, Math.ceil(linhaAgua))) : H;
  }
  // Os lugares dos eventos urgentes: onde se pega a ajuda (água, areia, mercadoria) e onde se leva.
  // O caminhão da Defesa Civil para na Avenida do Rio com a areia (quando alguém liga 199 na enchente) e o dos
  // Bombeiros para na rua do lado da praça (quando alguém liga 193 no incêndio).
  const CAMINHAO_AREIA = [[14, 19], [15, 19]], CAMINHAO_BOMBEIROS = [[26, 14], [26, 15]];
  const ZONAS = {
    fonte: porLugar.fonte.entradas, lixeira: porLugar.lixeira.entradas,
    areia: [], barreira: [], obra: porLugar.lote.entradas, caminhao: [],
    feira: porLugar.feira.entradas, estacao: porLugar.estacao.entradas,
  };
  for (let x = 0; x < W; x++) {
    if (chao[26][x] === 'areia' && andavelFixo(x, 26)) ZONAS.areia.push([x, 26]);
    if (x >= 11 && x <= 30 && andavelFixo(x, 21)) ZONAS.barreira.push([x, 21]);
  }
  for (const [x, y] of [[13, 19], [16, 19], [14, 18], [15, 18], [14, 20], [15, 20]]) if (andavelFixo(x, y)) ZONAS.caminhao.push([x, y]);
  const pertoDaZona = (zona, x, y, raio = 1.3) => (Object.prototype.hasOwnProperty.call(ZONAS, zona) ? ZONAS[zona] : []).some(([a, b]) => Math.hypot(a - x, b - y) <= raio);

  // Incêndio: o que pode pegar fogo na praça (x, y: o meio da coisa, em quadrinhos). O fogo começa na lata de lixo
  // e vai pulando para o que está perto; o poste de luz é elétrico (água, não: só os Bombeiros).
  const INFLAMAVEIS = [
    { id: 'lixeira', nome: 'a lata de lixo', x: 22, y: 15 },
    { id: 'poste', nome: 'o poste de luz', x: POSTE[0], y: POSTE[1], eletrico: true },
    { id: 'banco-se', nome: 'o banco', x: 20.5, y: 16 }, { id: 'banco-ne', nome: 'o banco', x: 20.5, y: 11 },
    { id: 'banco-so', nome: 'o banco', x: 14.5, y: 16 }, { id: 'banco-no', nome: 'o banco', x: 14.5, y: 11 },
    { id: 'mesa-domino', nome: 'a mesa de dominó', x: 21, y: 13 }, { id: 'mesa-velha', nome: 'a mesa do jogo da velha', x: 14, y: 13 },
    { id: 'mural', nome: 'o mural de recados', x: 21.5, y: 8 },
    { id: 'ipe-se', nome: 'o ipê', x: 23, y: 17 }, { id: 'ipe-ne', nome: 'o ipê', x: 23, y: 8 },
    { id: 'ipe-so', nome: 'o ipê', x: 12, y: 17 }, { id: 'ipe-no', nome: 'o ipê', x: 12, y: 8 },
    { id: 'coreto-e', nome: 'o coreto', x: 16.5, y: 10 }, { id: 'coreto-d', nome: 'o coreto', x: 18.5, y: 10 },
  ];
  // De onde se joga água (ou se avisa): um quadrinho andável a até 1,8 quadrinho da coisa.
  const PERTO_DO_FOCO = 1.8;
  const pertoDoPonto = (px, py, raio = PERTO_DO_FOCO) => {
    const lista = [];
    for (let y = Math.floor(py - raio); y <= Math.ceil(py + raio); y++) for (let x = Math.floor(px - raio); x <= Math.ceil(px + raio); x++) {
      if (andavel(x, y) && Math.hypot(x - px, y - py) <= raio) lista.push([x, y]);
    }
    return lista;
  };

  // Chuva forte: as árvores que podem cair e para que lado (o tronco ocupa os 2 quadrinhos andáveis daquele lado).
  // Não cai em porta de prédio nem em entrada de lugar.
  const entradaDeLugar = new Set();
  for (const L of [...LUGARES, ...OBJETOS]) for (const [x, y] of L.entradas || []) entradaDeLugar.add(y * W + x);
  const QUEDAS = [];
  for (const [x, y] of [...ARVORES, ...IPES, ...PALMEIRAS]) {
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const tiles = [[x + dx, y + dy], [x + 2 * dx, y + 2 * dy]];
      if (!tiles.every(([a, b]) => andavelFixo(a, b) && !entradaDeLugar.has(b * W + a))) continue;
      const fio = [x + 3 * dx, y + 3 * dy];
      const naRua = tiles.filter(([a, b]) => chao[b][a] === 'rua' || chao[b][a] === 'calcada').length;
      QUEDAS.push({ id: `${x}-${y}-${dx}${dy}`, arvore: [x, y], ipe: IPES.some(([a, b]) => a === x && b === y), palmeira: PALMEIRAS.some(([a, b]) => a === x && b === y),
        tiles, fio: andavelFixo(fio[0], fio[1]) && !entradaDeLugar.has(fio[1] * W + fio[0]) ? fio : null, naRua });
    }
  }
  // Caminho mais curto (pelos quadrinhos, sem diagonal) até um dos destinos. [] = já está lá; null = não dá.
  // extra: quadrinhos fechados a mais (para conferir, antes de uma árvore cair, se ainda dá para chegar em tudo).
  function caminho(de, metas, extra) {
    const pode = extra ? (x, y) => andavel(x, y) && !extra.has(y * W + x) : andavel;
    const alvos = new Set(metas.filter(([x, y]) => pode(x, y)).map(([x, y]) => y * W + x));
    if (!alvos.size || !pode(de[0], de[1])) return null;
    const ini = de[1] * W + de[0];
    if (alvos.has(ini)) return [];
    const veio = new Int32Array(W * H).fill(-2); veio[ini] = -1;
    const fila = [ini];
    for (let i = 0; i < fila.length; i++) {
      const c = fila[i], cx = c % W, cy = (c / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (!pode(nx, ny)) continue;
        const n = ny * W + nx;
        if (veio[n] !== -2) continue;
        veio[n] = c;
        if (alvos.has(n)) { const p = []; for (let k = n; k !== ini; k = veio[k]) p.push([k % W, (k / W) | 0]); return p.reverse(); }
        fila.push(n);
      }
    }
    return null;
  }
  const vizinhos = (x, y) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1], [x + 1, y + 1], [x - 1, y - 1], [x + 1, y - 1], [x - 1, y + 1]]
    .filter(([a, b]) => andavel(a, b));
  // O quadrinho andável mais perto de (x, y), para quem estiver num lugar estranho (mapa mudou, por exemplo).
  function maisPerto(x, y) {
    const cx = Math.round(x), cy = Math.round(y);
    if (andavel(cx, cy)) return [cx, cy];
    for (let r = 1; r < Math.max(W, H); r++) {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === r && andavel(cx + dx, cy + dy)) return [cx + dx, cy + dy];
      }
    }
    return [18, 15];
  }

  // Todos os lugares continuam alcançáveis (a partir da praça) com estes quadrinhos fechados a mais?
  function tudoAlcancavel(extra) {
    const ini = [18, 16];
    const visto = new Uint8Array(W * H);
    const pode = (x, y) => andavel(x, y) && !extra.has(y * W + x);
    if (!pode(ini[0], ini[1])) return false;
    const fila = [ini[1] * W + ini[0]]; visto[fila[0]] = 1;
    for (let i = 0; i < fila.length; i++) {
      const c = fila[i], cx = c % W, cy = (c / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (!pode(nx, ny) || visto[ny * W + nx]) continue;
        visto[ny * W + nx] = 1; fila.push(ny * W + nx);
      }
    }
    return [...LUGARES, ...OBJETOS].every((L) => !(L.entradas || []).some(([x, y]) => andavel(x, y)) || L.entradas.some(([x, y]) => visto[y * W + x]));
  }

  const PRACA = [], RUAS = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!andavelFixo(x, y)) continue;
    if (!entradaDeLugar.has(y * W + x) && ((x >= 12 && x <= 23 && y >= 8 && y <= 17) || chao[y][x] === 'calcada')) LUGARES_DO_LIXO.push([x, y]);
    if (x >= 11 && x <= 24 && y >= 7 && y <= 18) PRACA.push([x, y]);
    if (chao[y][x] === 'calcada' || chao[y][x] === 'rua') RUAS.push([x, y]);
  }
  // Em volta da fonte: para onde vai a turma quando o instrutor chama todos.
  const RODA = [[16, 12], [17, 12], [18, 12], [19, 12], [16, 13], [19, 13], [16, 14], [19, 14], [16, 15], [17, 15], [18, 15], [19, 15],
    [15, 12], [20, 12], [15, 14], [20, 14], [15, 15], [20, 15], [16, 16], [17, 16], [18, 16], [19, 16]];
  // Onde a pessoa aparece ao entrar na praça (perto da fonte, cada uma num quadrinho).
  const CHEGADA = [[18, 15], [17, 15], [19, 15], [16, 15], [18, 16], [17, 16], [19, 16], [16, 16], [15, 15], [20, 15], [15, 14], [20, 14]];

  return { T, W, H, chao, bloq, dono, LUGARES, OBJETOS, MORADORES, CIDADE, CASA_PRONTA, ENFEITES, MODULOS_DA_CIDADE, BANCOS, BARRACAS, IPES, ARVORES, PALMEIRAS, POSTE, porLugar,
    ALTURAS, alturaDe, bicoDe,
    andavel, andavelFixo, definirBloqueios, caminho, vizinhos, maisPerto, tudoAlcancavel, PRACA, RUAS, RODA, CHEGADA, ZONAS, pertoDaZona,
    INFLAMAVEIS, PERTO_DO_FOCO, pertoDoPonto, QUEDAS, CAMINHAO_AREIA, CAMINHAO_BOMBEIROS, LUGARES_DO_LIXO };
});
