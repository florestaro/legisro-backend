// Abertura da Praça Escola: a maquete da cidade feita de pontos.
//
// É uma ilusão de 3D feita só com pontos num <canvas> 2D (sem three.js nem WebGL). Cada ponto tem uma posição
// (x, y, h) em quadrinhos do mapa. A câmera gira em volta da cidade e inclina, e cada ponto é projetado com
// perspectiva: tela = centro + (x, y) · escala · D / (D + z). O que está perto fica maior e mais forte, o que está
// longe fica menor e mais apagado, e tudo é desenhado do fundo para a frente (por baldes de profundidade, sem
// ordenar a lista inteira a cada quadro). Quem vende o 3D é o giro: pontos em alturas diferentes andam em
// velocidades diferentes na tela.
//
// Os pontos saem dos DADOS do mapa (app/js/praca-mapa.js): o chão de cada quadrinho, os prédios com a cor do telhado
// e da parede, as árvores, o rio, o trilho, a praça. As cores são as do desenho da cidade (app/js/apps/praca.js).
// Cada ponto guarda dois lugares: onde ele fica no mapa 2D do jogo e onde fica na maquete em 3D. A abertura leva os
// pontos de um lugar para o outro e, no fim, de volta. Por isso o último quadro cai exatamente em cima do mapa do
// jogo, no mesmo enquadramento, e a troca é só um crossfade. O jogo continua rodando por baixo, sem mudar nada.
//
// Roteiro (uns 5 segundos):
//   1. os pontos caem e formam a cidade, ainda plana, vista de cima;
//   2. a câmera inclina (de cima para ~55°) e gira devagar (~35°);
//   3. os prédios levantam do chão, um de cada vez (Escola e Prefeitura mais altas, casas baixas, árvores médias);
//      o rio desce um pouco e ondula, e o trem chega pelo trilho;
//   4. o chafariz da Praça da Turma pulsa e o "Você" aparece;
//   5. a câmera volta para cima, os pontos se juntam e a maquete some em cima do mapa 2D.
// Pular: o botão "Pular", um clique ou toque em qualquer lugar, ou uma tecla.
//
// Uso: const c = CE.abertura3d.iniciarAbertura(dadosDoMapa, aoTerminar)
//   dadosDoMapa = { alvo, mapa, cores, emObra(id), trem(), voce(), enquadramento(), pronto, aoComecar() }
//   aoTerminar(motivo): 'fim' | 'pulou' | 'parou' | 'cancelada' | 'erro'
//   c.pular(), c.parar(); c.pausarEm(segundos) e c.continuar() servem para os testes (e para fotografar um momento).
window.CE = window.CE || {};

(function () {
  const CHAVE = 'ce-praca-maquete';         // sessionStorage: a abertura já passou nesta sessão
  const MAX_PONTOS = 12000, MAX_PIXELS = 4e6;
  const D = 42;                              // distância da câmera, em quadrinhos (a força da perspectiva)
  const INCLINA = 55 * Math.PI / 180;        // de cima (0°) até 55°
  const GIRA = 35 * Math.PI / 180;           // e gira 35° em volta da cidade
  const NB = 28, NA = 8;                     // baldes de profundidade e níveis de transparência
  const QUEDA = 0.55;                        // quanto tempo cada ponto leva para cair no lugar (s)
  // O roteiro, em segundos.
  const T_INCLINA = [0.8, 2.0], T_GIRA = [0.8, 3.45], T_SOBE = 1.2, PASSO = 0.11, DUR_SOBE = 0.75;
  const T_TREM = [1.55, 3.45], T_CHAFARIZ = [2.45, 3.8], T_VOCE = [2.8, 3.15];
  const T_VOLTA = [3.45, 4.35], T_JUNTA = [3.75, 4.35], T_SOME = [4.25, 4.85];
  // Altura de cada prédio (em quadrinhos). As casas são baixas; os prédios em obra, mais baixos ainda.
  const ALTURA = { escola: 3.2, prefeitura: 3.2, banco: 2.3, empregos: 2.2, correios: 2, posto: 2, estacao: 1.5 };
  const ALTURA_CASA = 1.25, ALTURA_OBRA = 0.45, FACHADA = 1.1; // no desenho 2D, a fachada tem 1,1 quadrinho
  // Tipos de ponto.
  const CHAO = 0, SOBE = 1, LADO = 2, AGUA = 3, TREM = 4, JATO = 5, ONDA = 6;

  const lim = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const fase = (t, [a, b]) => lim((t - a) / (b - a));
  const suave = (v) => v * v * (3 - 2 * v);
  const entraSai = (v) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2);
  const sai = (v) => 1 - (1 - v) * (1 - v) * (1 - v);
  const molinha = (v) => { const c = 1.5, u = v - 1; return 1 + (c + 1) * u * u * u + c * u * u; }; // passa um pouco e volta

  // ---------- Só na primeira entrada da sessão (e nunca para quem pediu menos movimento) ----------
  // Se o navegador não deixa gravar na sessão, a marca fica na memória (vale até fechar o programa).
  let vistaNaMemoria = false, gravouNaSessao = false;
  function deveMostrar() {
    try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false; } catch (e) { /* sem matchMedia */ }
    if (vistaNaMemoria && !gravouNaSessao) return false;
    try { return window.sessionStorage.getItem(CHAVE) !== '1'; } catch (e) { return !vistaNaMemoria; }
  }
  function marcarVista() {
    vistaNaMemoria = true;
    try { window.sessionStorage.setItem(CHAVE, '1'); gravouNaSessao = true; } catch (e) { gravouNaSessao = false; }
  }

  // ---------- Cores ----------
  function rgb(c) {
    if (Array.isArray(c)) return c;
    const s = String(c || '#000000').trim();
    if (s[0] === '#') {
      const h = s.length === 4 ? s.slice(1).split('').map((x) => x + x).join('') : s.slice(1, 7);
      const n = parseInt(h, 16);
      return [n >> 16, (n >> 8) & 255, n & 255];
    }
    const m = s.match(/\d+(\.\d+)?/g) || [0, 0, 0];
    return [Number(m[0]) || 0, Number(m[1]) || 0, Number(m[2]) || 0];
  }
  const tom = (c, q) => rgb(c).map((v) => Math.max(0, Math.min(255, Math.round(v + q))));
  const mistura = (a, b, q) => { const x = rgb(a), y = rgb(b); return x.map((v, i) => Math.round(v + (y[i] - v) * q)); };

  // ---------- Os pontos, a partir dos dados do mapa ----------
  function montar(dados) {
    const M = dados.mapa, W = M.W, H = M.H, chao = M.chao;
    const P = dados.cores || {};
    const COR = P.chao || {};
    const emObra = typeof dados.emObra === 'function' ? dados.emObra : () => false;
    let semente = 20251119;
    const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
    const N = MAX_PONTOS;
    const nv = {
      n: 0,
      fx: new Float32Array(N), fy: new Float32Array(N),                          // onde fica no mapa 2D
      tx: new Float32Array(N), ty: new Float32Array(N), th: new Float32Array(N),  // onde fica na maquete 3D
      ox: new Float32Array(N), oy: new Float32Array(N), oh: new Float32Array(N), atraso: new Float32Array(N), // a queda
      tam: new Float32Array(N), junto: new Float32Array(N), alfa: new Float32Array(N),
      grupo: new Uint16Array(N), tipo: new Uint8Array(N), cor: new Uint16Array(N),
      cores: [], grupos: [{ ini: null, dur: 1 }], gAgua: 0, trem: null,
    };
    const indice = new Map();
    const indiceCor = (c) => {
      const v = rgb(c), k = v.join(',');
      let i = indice.get(k);
      if (i === undefined) { i = nv.cores.length; nv.cores.push(v); indice.set(k, i); }
      return i;
    };
    const grupo = (ini, dur) => { nv.grupos.push({ ini, dur }); return nv.grupos.length - 1; };
    // fx, fy: no mapa 2D; tx, ty, th: na maquete. tam: o lado do ponto; junto: o lado no fim, quando se juntam.
    function ponto(fx, fy, tx, ty, th, cor, g, tipo, tam, junto, alfa) {
      if (nv.n >= N) return -1;
      const i = nv.n++;
      nv.fx[i] = fx; nv.fy[i] = fy; nv.tx[i] = tx; nv.ty[i] = ty; nv.th[i] = th;
      nv.cor[i] = indiceCor(cor); nv.grupo[i] = g; nv.tipo[i] = tipo;
      nv.tam[i] = tam; nv.junto[i] = junto; nv.alfa[i] = alfa == null ? 1 : alfa;
      // A queda do começo: cada ponto vem de cima, um pouco fora do lugar, numa onda do norte para o sul.
      nv.atraso[i] = 0.04 + 0.42 * lim(fy / H) + 0.12 * rnd();
      nv.ox[i] = (rnd() - 0.5) * 2.4; nv.oy[i] = (rnd() - 0.5) * 2.4; nv.oh[i] = 4 + rnd() * 5;
      return i;
    }
    // Um ponto que fica no mesmo lugar no 2D e na maquete (só sobe).
    const fixo = (x, y, h, cor, g, tam, junto, tipo, alfa) => ponto(x, y, x, y, h, cor, g, tipo == null ? SOBE : tipo, tam, junto, alfa);
    const disco = (n, r, f) => { for (let i = 0; i < n; i++) { const a = i * 2.39996, d = Math.sqrt((i + 0.5) / n) * r; f(Math.cos(a) * d, Math.sin(a) * d, d, i); } };

    // Cada lugar (prédio ou área) sobe na sua vez: de cima para baixo no mapa, um de cada vez.
    const grupoDe = {};
    [...M.LUGARES].sort((a, b) => a.r[1] - b.r[1] || a.r[0] - b.r[0])
      .forEach((L, k) => { grupoDe[L.id] = grupo(T_SOBE + k * PASSO, DUR_SOBE); });
    const gTrilho = grupo(1.35, 0.5);
    nv.gAgua = grupo(1.3, 0.9);

    // Os quadrinhos cobertos por prédio (ou por obra) não ganham pontos de chão.
    const coberto = new Uint8Array(W * H);
    for (const L of M.LUGARES) {
      if (!L.telhado && !emObra(L.id)) continue;
      const [x0, y0, w, h] = L.r;
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < W && y < H) coberto[y * W + x] = 1;
    }
    const livre = (id) => !emObra(id);

    // ---------- Chão: 4 pontos por quadrinho, com a cor do piso ----------
    const anel = P.pracaAneis || ['#E5D4AE', '#EFE3C6'];
    const corDaPraca = (px, py) => { const d = Math.hypot(px - 18, py - 14) * 40; return Math.floor((520 - d) / 18) % 2 ? anel[0] : anel[1]; };
    const ondaDoRio = mistura(COR.agua || '#8A6C45', [190, 160, 115], 0.55);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (coberto[y * W + x]) continue;
      const t = chao[y][x];
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
        let px = x + 0.25 + i * 0.5, py = y + 0.25 + j * 0.5, c, h = 0, g = 0, tp = CHAO, tam = 0.2, a = 1;
        if (t === 'grama') { px += (rnd() - 0.5) * 0.1; py += (rnd() - 0.5) * 0.1; c = tom(COR.grama || '#8DBE5A', (Math.floor(rnd() * 3) - 1) * 7); tam = 0.18; a = 0.85; }
        else if (t === 'calcada') c = tom(COR.calcada || '#D9D1C0', (x + y) % 2 ? -6 : 3);
        else if (t === 'praca') c = corDaPraca(px, py);
        else if (t === 'rua') {
          const borda = (i === 0 && x > 0 && chao[y][x - 1] !== 'rua') || (i === 1 && x < W - 1 && chao[y][x + 1] !== 'rua')
            || (j === 0 && y > 0 && chao[y - 1][x] !== 'rua') || (j === 1 && y < H - 1 && chao[y + 1][x] !== 'rua');
          c = borda ? (P.ruaBorda || '#4C5155') : COR.rua;
        } else if (t === 'agua') { c = j === 0 ? ondaDoRio : COR.agua; g = nv.gAgua; tp = AGUA; }
        else if (t === 'horta') c = (P.horta && P.horta[1]) || COR.horta;
        else if (t === 'plataforma') { c = COR.plataforma; h = 0.16; g = grupoDe.estacao || 0; tp = g ? SOBE : CHAO; }
        else if (t === 'pier') { c = COR.pier; h = 0.14; g = grupoDe.rio || 0; tp = g ? SOBE : CHAO; }
        else c = COR[t] || COR.grama || '#8DBE5A';
        ponto(px, py, px, py, h, c, g, tp, tam, 0.54, a);
      }
    }

    // ---------- Ruas: a faixa amarela do meio e as faixas de pedestre ----------
    const T = M.T || 40;
    const cruza =(p) => (p >= 9 * T && p < 11 * T) || (p >= 25 * T && p < 27 * T);
    for (const yy of [6, 20]) for (let x = 6; x < W * T; x += 26) if (!cruza(x) && !cruza(x + 14)) for (const d of [-0.09, 0.09]) fixo((x + 7) / T + d, yy, 0.02, P.faixa || '#F0CF57', 0, 0.12, 0.2);
    for (const xx of [10, 26]) for (let y = 7 * T + 6; y < 19 * T; y += 26) for (const d of [-0.09, 0.09]) fixo(xx, (y + 7) / T + d, 0.02, P.faixa || '#F0CF57', 0, 0.12, 0.2);
    for (const x0 of [9 * T, 25 * T]) for (let k = 0; k < 6; k++) for (const yy of [13.3, 13.7]) fixo((x0 + 9.5 + k * 12) / T, yy, 0.02, '#FFFFFF', 0, 0.13, 0.2, SOBE, 0.9);
    for (const y0 of [5 * T, 19 * T]) for (let k = 0; k < 6; k++) for (const xx of [17.4, 18, 18.6]) fixo(xx, (y0 + 9.5 + k * 12) / T, 0.02, '#FFFFFF', 0, 0.13, 0.2, SOBE, 0.9);
    // a borda da praça
    for (let x = 12.15; x < 24; x += 0.35) { fixo(x, 8.04, 0.02, P.pracaBorda || '#C2AE84', 0, 0.1, 0.13); fixo(x, 17.96, 0.02, P.pracaBorda || '#C2AE84', 0, 0.1, 0.13); }
    for (let y = 8.35; y < 18; y += 0.35) { fixo(12.04, y, 0.02, P.pracaBorda || '#C2AE84', 0, 0.1, 0.13); fixo(23.96, y, 0.02, P.pracaBorda || '#C2AE84', 0, 0.1, 0.13); }

    // ---------- Trilho da Madeira-Mamoré: dormentes, os dois trilhos e a beira da plataforma ----------
    for (let x = 0; x < W * T; x += 12) for (const yy of [25.3, 25.7]) fixo((x + 5) / T, yy, 0.03, P.dormente || '#6B4A33', gTrilho, 0.12, 0.16);
    for (let x = 0.125; x < W; x += 0.25) for (const yy of [25.3375, 25.6625]) fixo(x, yy, 0.07, P.trilho || '#C9CED3', gTrilho, 0.1, 0.27);
    for (let x = 18.15; x < 29; x += 0.3) fixo(x, 24.9125, 0.17, P.plataformaBeira || '#E3C23A', grupoDe.estacao || 0, 0.1, 0.15);

    // ---------- Prédios ----------
    for (const L of M.LUGARES) {
      if (!L.telhado || !livre(L.id)) continue;
      const [x0, y0, w, h] = L.r;
      const g = grupoDe[L.id];
      const Hb = L.casa ? ALTURA_CASA : (ALTURA[L.id] || 2);
      const bico = L.casa ? 0.45 : L.colunas ? 0 : 0.22;      // a cumeeira do telhado
      const zona = h - FACHADA;                                // no 2D, o telhado fica no alto e a fachada embaixo
      const nx = Math.round(w * 3), ny = Math.max(2, Math.round(zona * 3)), nf = 4;
      const tel = rgb(L.telhado), par = rgb(L.parede);
      const juntoT = Math.max(w / nx, zona / ny) * 1.1, juntoF = Math.max(w / nx, FACHADA / nf) * 1.1;
      // Telhado: no 2D ocupa a parte de cima; na maquete cobre o prédio todo, com a cumeeira no meio.
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const u = (i + 0.5) / nx, v = (j + 0.5) / ny;
        const fx = x0 + u * w, fy = y0 + v * zona;
        let c = v < 0.5 ? tom(tel, 16) : tom(tel, -12);
        if (Math.abs(v - 0.5) < 0.5 / ny) c = tom(tel, 40);  // a faixa clara da cumeeira
        if (j === ny - 1) c = tom(tel, -42);                 // a beirada (sombra do beiral)
        ponto(fx, fy, fx, y0 + v * h, Hb + bico * (1 - Math.abs(2 * v - 1)), c, g, SOBE, 0.17, juntoT, 1);
      }
      // Fachada (a parede da frente, com portas e janelas): no 2D fica embaixo do telhado; na maquete fica de pé.
      for (let j = 0; j < nf; j++) for (let i = 0; i < nx; i++) {
        const u = (i + 0.5) / nx, v = (j + 0.5) / nf;
        const fx = x0 + u * w, fy = y0 + zona + v * FACHADA;
        const meio = i % 3 === 1, porta = (L.portas || []).includes(x0 + Math.floor(u * w));
        let c = tom(par, -4 - 14 * v);
        if (L.colunas && i % 3 === 0) c = [255, 255, 255];
        else if (meio && porta && j >= 1) c = P.porta || '#5B3A22';
        else if (meio && !porta && (j === 1 || j === 2)) c = P.janela || '#7FB3CF';
        else if (j === nf - 1) c = tom(par, -45);            // o rodapé
        ponto(fx, fy, fx, y0 + h, Hb * (1 - v), c, g, SOBE, 0.16, juntoF, 1);
      }
      // Paredes do lado (só existem na maquete): uma versão mais escura da parede.
      const camadas = Math.max(2, Math.round(Hb * 2.2));
      for (const sx of [x0, x0 + w]) for (let j = 0; j < h * 3; j++) {
        const yy = y0 + (j + 0.5) / 3;
        for (let k = 0; k < camadas; k++) fixo(sx, yy, (k + 0.5) / camadas * Hb, tom(par, -38), g, 0.15, 0.2, LADO);
        if (bico) { const v = (j + 0.5) / (h * 3), topo = bico * (1 - Math.abs(2 * v - 1)); if (topo > 0.15) fixo(sx, yy, Hb + topo * 0.5, tom(par, -38), g, 0.15, 0.2, LADO); }
      }
      // Detalhes: a chaminé das casas e a cruz do Posto de Saúde.
      if (L.casa) for (let k = 0; k < 3; k++) ponto(x0 + w - 0.29, y0 + 0.22, x0 + w - 0.35, y0 + 0.45, Hb + 0.2 + k * 0.17, tom(par, -55), g, SOBE, 0.15, 0.2, 1);
      if (L.cruz) {
        const cx = x0 + w - 0.7, cy2 = y0 + zona / 2, cy3 = y0 + h / 2, hh = Hb + bico + 0.04;
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ponto(cx + Math.cos(a) * 0.26, cy2 + Math.sin(a) * 0.26, cx + Math.cos(a) * 0.26, cy3 + Math.sin(a) * 0.26, hh, '#FFFFFF', g, SOBE, 0.13, 0.17, 1); }
        for (const [dx, dy] of [[0, 0], [0.12, 0], [-0.12, 0], [0, 0.12], [0, -0.12]]) ponto(cx + dx, cy2 + dy, cx + dx, cy3 + dy, hh + 0.02, P.cruz || '#2E8B57', g, SOBE, 0.12, 0.14, 1);
      }
    }

    // ---------- Prédios e áreas em obra: baixos, esmaecidos e com a faixa listrada embaixo ----------
    for (const L of M.LUGARES) {
      if (livre(L.id)) continue;
      const [x0, y0, w, h] = L.r;
      const g = grupoDe[L.id];
      const alto = L.telhado || L.casa ? ALTURA_OBRA : 0.06;
      const nx = Math.round(w * 3), ny = Math.round(h * 3);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const fx = x0 + (i + 0.5) / 3, fy = y0 + (j + 0.5) / 3;
        if (j === ny - 1) { // a faixa listrada amarela e preta: na maquete, fica na parede da frente
          const c = (i + j) % 2 ? (P.obraFaixa || ['#F5B400', '#2B2B2B'])[1] : (P.obraFaixa || ['#F5B400', '#2B2B2B'])[0];
          ponto(fx, fy, fx, y0 + h, alto * 0.55, c, g, SOBE, 0.16, 0.37, 0.85);
          continue;
        }
        ponto(fx, fy, fx, fy, alto, (i + j) % 4 < 2 ? (P.obraClara || '#DCD5C6') : (P.obra || '#CEC5B2'), g, SOBE, 0.17, 0.37, 0.5);
      }
    }

    // ---------- Lote da turma: a borda tracejada e os montes de areia ----------
    if (livre('lote') && M.porLugar.lote) {
      const [x0, y0, w, h] = M.porLugar.lote.r, g = grupoDe.lote;
      const borda = [];
      for (let x = x0 + 0.1; x <= x0 + w - 0.1; x += 0.275) borda.push([x, y0 + 0.11], [x, y0 + h - 0.11]);
      for (let y = y0 + 0.375; y <= y0 + h - 0.3; y += 0.275) borda.push([x0 + 0.11, y], [x0 + w - 0.11, y]);
      borda.forEach(([x, y], k) => { if (k % 4 < 2) fixo(x, y, 0.03, P.loteBorda || '#7A4E2A', g, 0.11, 0.14); });
      for (const [cx, cy, r, c] of [[32.15, 2.75, 0.3, '#B07A4E'], [34.15, 3.1, 0.225, '#A86F44']]) disco(9, r, (dx, dy, d) => fixo(cx + dx, cy + dy, 0.38 * (1 - (d / r) * (d / r)), (P.montes && P.montes[c === '#B07A4E' ? 0 : 1]) || c, g, 0.13, 0.17));
    }

    // ---------- Horta: as plantas de cada canteiro ----------
    if (livre('horta') && M.porLugar.horta) {
      const g = grupoDe.horta, plantas = P.plantas || ['#6DBE45', '#F2C230', '#E04B3A'];
      for (let k = 0; k < 3; k++) for (let i = 0; i < 6; i++) {
        const x = 12.45 + i * 0.775, y = 22.5 + k;
        fixo(x - 0.08, y + 0.06, 0.16, '#4E9A43', g, 0.12, 0.16);
        fixo(x + 0.08, y - 0.04, 0.3, plantas[k], g, 0.14, 0.18);
      }
      for (let x = 12.15; x < 17; x += 0.35) { fixo(x, 22.04, 0.04, P.hortaBorda || '#A07848', g, 0.1, 0.13); fixo(x, 24.96, 0.04, P.hortaBorda || '#A07848', g, 0.1, 0.13); }
    }

    // ---------- Feira: as barracas listradas (toldo, balcão e as frutas) ----------
    if (livre('feira')) {
      const g = grupoDe.feira || 0, frutas = ['#E8B33A', '#F4D03F', '#F39C12', '#F2C230', '#7FB3D5'];
      (M.BARRACAS || []).forEach(([x, y, cor], b) => {
        for (let k = 0; k < 5; k++) {
          const px = x + (k * 8 + 4) / T, c = k % 2 ? '#FFFFFF' : cor;
          ponto(px, y + 0.15, px, y + 0.2, 1.02, c, g, SOBE, 0.15, 0.21, 1);
          ponto(px, y + 0.4, px, y + 0.55, 0.94, c, g, SOBE, 0.15, 0.21, 1);
          ponto(px, y + 0.7, px, y + 0.78, 0.45, P.balcao || '#8A5A35', g, SOBE, 0.15, 0.21, 1);
          ponto(px, y + 0.9, px, y + 0.98, 0.25, tom(P.balcao || '#8A5A35', -25), g, SOBE, 0.15, 0.21, 1);
        }
        ponto(x + 0.5, y + 0.78, x + 0.5, y + 0.72, 0.52, frutas[b % frutas.length], g, SOBE, 0.17, 0.17, 1);
        for (const px of [x + 0.08, x + 0.92]) for (let k = 0; k < 3; k++) fixo(px, y + 0.95, 0.15 + k * 0.28, P.balcao || '#8A5A35', g, 0.1, 0.1, LADO);
      });
    }

    // ---------- Árvores (médias), ipês e palmeiras: a copa vira uma bola em cima do tronco ----------
    const arvore = (x, y, cores, flor) => {
      const cx = x + 0.5, cy = y + 0.5, g = grupo(1.3 + (y / H) * 1.1 + rnd() * 0.12, 0.6), hc = 1.4 + rnd() * 0.25;
      disco(26, 0.45, (dx, dy, d, i) => {
        const casca = Math.sqrt(Math.max(0, 1 - (d / 0.5) * (d / 0.5))) * 0.5 * (i % 3 === 2 ? -0.7 : 1);
        const c = d > 0.38 ? cores[1] : tom(cores[0], -(dx + dy) / 0.45 * 24);
        fixo(cx + dx, cy + dy, hc + casca, c, g, 0.19, 0.2);
      });
      if (flor) disco(8, 0.38, (dx, dy) => fixo(cx + dx * 0.9 + 0.03, cy + dy * 0.9 - 0.04, hc + 0.42, flor, g, 0.12, 0.12));
      for (let k = 0; k < 4; k++) fixo(cx, cy, 0.12 + k * (hc - 0.45) / 3, P.tronco || '#6B4A2E', g, 0.13, 0.13, LADO);
    };
    for (const [x, y] of M.ARVORES || []) arvore(x, y, P.arvore || ['#4E9A43', '#2F6E2A']);
    for (const [x, y, c] of M.IPES || []) {
      const ipe = c === 'amarelo' ? (P.ipeAmarelo || ['#F2C12E', '#C5960F', '#FFE27A']) : (P.ipeRoxo || ['#C2569E', '#8C3A72', '#F0A6D6']);
      arvore(x, y, ipe, ipe[2]);
    }
    for (const [x, y] of M.PALMEIRAS || []) {
      const cx = x + 0.5, cy = y + 0.4, g = grupo(1.3 + (y / H) * 1.1, 0.6), ht = 1.65;
      for (let f = 0; f < 6; f++) for (let s = 1; s <= 4; s++) {
        const a = f * Math.PI / 3, d = s * 0.15, q = s / 4;
        fixo(cx + Math.cos(a) * d, cy + Math.sin(a) * d, ht + 0.12 * q - 0.5 * q * q, P.palmeira || '#3F8F3A', g, 0.13, 0.17);
      }
      fixo(cx, cy, ht + 0.05, P.coco || '#7A5A2E', g, 0.17, 0.2);
      for (let k = 0; k < 5; k++) fixo(cx, cy, 0.1 + k * (ht - 0.25) / 4, P.coco || '#7A5A2E', g, 0.13, 0.13, LADO);
    }

    // ---------- Na Praça da Turma: coreto, fonte (chafariz), bancos, mesas, mural, lixeiras e poste ----------
    const gCoreto = grupo(1.95, 0.6), gFonte = grupo(2.05, 0.6), gMoveis = grupo(2.15, 0.55), gMural = grupo(2.25, 0.55), gLixo = grupo(2.3, 0.55);
    // Coreto: palco octogonal de madeira com a beirada branca e as colunas da grade.
    const co = M.porLugar.coreto ? { x: 18, y: 9.5 } : null;
    if (co) {
      for (const [r, n] of [[0, 1], [0.32, 7], [0.62, 13], [0.92, 19], [1.18, 25]]) for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + r;
        fixo(co.x + Math.cos(a) * r, co.y + Math.sin(a) * r, 0.26, P.coretoPiso || '#C89A62', gCoreto, 0.15, 0.3);
      }
      for (let k = 0; k < 32; k++) { const a = (k / 32) * Math.PI * 2; fixo(co.x + Math.cos(a) * 1.38, co.y + Math.sin(a) * 1.38, 0.26, P.coretoBeira || '#F4EFE6', gCoreto, 0.13, 0.2); }
      for (let k = 0; k < 8; k++) {
        const a = Math.PI / 8 + (k * Math.PI) / 4, px = co.x + Math.cos(a) * 1.325, py = co.y + Math.sin(a) * 1.325;
        for (let s = 0; s < 4; s++) fixo(px, py, 0.3 + s * 0.22, '#FFFFFF', gCoreto, 0.13, 0.16, s ? LADO : SOBE);
      }
      for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; fixo(co.x + Math.cos(a) * 1.325, co.y + Math.sin(a) * 1.325, 0.95, '#FFFFFF', gCoreto, 0.11, 0.14, LADO); }
      for (const dx of [-0.25, 0, 0.25]) fixo(co.x + dx, co.y + 1.47, 0.1, P.coretoEscada || '#E8E0D2', gCoreto, 0.13, 0.2);
    }
    // Fonte: a borda de pedra, a água e o pedestal; os jatos e as ondinhas aparecem quando ela pulsa.
    const fo = M.porLugar.fonte ? { x: 18, y: 14 } : null;
    if (fo) {
      for (let k = 0; k < 26; k++) { const a = (k / 26) * Math.PI * 2; fixo(fo.x + Math.cos(a) * 0.86, fo.y + Math.sin(a) * 0.86, 0.24, P.fontePedra || '#CDBF9E', gFonte, 0.14, 0.2); }
      for (const [r, n, c] of [[0.2, 6, P.fonteAgua || '#7CC4E2'], [0.42, 12, '#BFE3F2'], [0.62, 18, P.fonteAgua || '#7CC4E2']]) for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2; fixo(fo.x + Math.cos(a) * r, fo.y + Math.sin(a) * r, 0.14, c, gFonte, 0.15, 0.24);
      }
      fixo(fo.x, fo.y, 0.22, P.fontePedra || '#CDBF9E', gFonte, 0.16, 0.2);
      fixo(fo.x, fo.y, 0.38, P.fontePedra || '#CDBF9E', gFonte, 0.14, 0.14, LADO);
      fixo(fo.x, fo.y, 0.52, '#FFFFFF', gFonte, 0.12, 0.1);
      for (let k = 0; k < 36; k++) { const i = ponto(fo.x, fo.y, (k / 36) * Math.PI * 2 + rnd() * 0.2, rnd(), 0.75 + rnd() * 0.35, '#E8F6FC', gFonte, JATO, 0.11, 0.11, 0.95); if (i < 0) break; }
      for (let r = 0; r < 2; r++) for (let k = 0; k < 24; k++) ponto(fo.x, fo.y, (k / 24) * Math.PI * 2, r * 0.5, 0, '#FFFFFF', gFonte, ONDA, 0.1, 0.1, 0.9);
    }
    // Bancos: o encosto e as tábuas do assento.
    for (const [x, y] of M.BANCOS || []) for (let k = 0; k < 6; k++) {
      const px = x + 0.18 + k * 0.33;
      ponto(px, y + 0.31, px, y + 0.3, 0.52, P.bancoEncosto || '#7A4E2A', gMoveis, SOBE, 0.13, 0.2, 1);
      ponto(px, y + 0.31, px, y + 0.3, 0.38, P.bancoEncosto || '#7A4E2A', gMoveis, LADO, 0.13, 0.2, 1);
      for (const v of [0.45, 0.575, 0.7]) fixo(px, y + v, 0.25, P.bancoAssento || '#A26C3D', gMoveis, 0.13, 0.2);
    }
    // Mesas do jogo da velha e do dominó, com os quatro banquinhos.
    for (const id of ['mesa-velha', 'mesa-domino']) {
      const L = M.porLugar[id];
      if (!L) continue;
      const cx = L.r[0] + 0.5, cy = L.r[1] + 0.5;
      disco(7, 0.28, (dx, dy) => fixo(cx + dx, cy + dy, 0.34, P.mesa || '#B7834A', gMoveis, 0.14, 0.2));
      fixo(cx, cy, 0.17, P.mesaPe || '#6E4B2E', gMoveis, 0.12, 0.12, LADO);
      for (const [dx, dy] of [[0, -0.425], [0, 0.425], [-0.425, 0], [0.425, 0]]) fixo(cx + dx, cy + dy, 0.2, P.mesaPe || '#6E4B2E', gMoveis, 0.14, 0.18);
    }
    // Mural de recados: no 2D, a tábua vista de cima; na maquete, em pé, virado para a praça.
    if (M.porLugar.mural) {
      const [mx, my] = M.porLugar.mural.r, notas = P.notas || ['#FFF39A', '#BFE2FF', '#FFC9D6', '#CFF2C7', '#FFF39A'];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
        const px = mx + 0.15 + c * 0.283, fy = my + 0.2 + r * 0.25;
        const cor = r === 1 ? (P.muralFundo || '#C9A06A') : (P.muralMoldura || '#8A5A35');
        ponto(px, fy, px, my + 0.8, 1.0 - r * 0.2, cor, gMural, SOBE, 0.14, 0.29, 1);
      }
      notas.forEach((c, i) => ponto(mx + 0.375 + i * 0.325, my + 0.4 + (i % 2) * 0.125, mx + 0.375 + i * 0.325, my + 0.83, 0.82 + (i % 2) * 0.06, c, gMural, SOBE, 0.13, 0.25, 1));
      for (const px of [mx + 0.2, mx + 1.8]) fixo(px, my + 0.8, 0.3, P.muralMoldura || '#8A5A35', gMural, 0.1, 0.1, LADO);
    }
    // Lixeiras da coleta seletiva: a tampa em cima e a cor de cada uma na frente.
    for (const L of M.OBJETOS || []) {
      if (!L.coleta) continue;
      const [x, y] = L.r;
      for (const px of [0.3, 0.5, 0.7]) ponto(x + px, y + 0.18, x + px, y + 0.45, 0.62, tom(L.cor, -40), gLixo, SOBE, 0.12, 0.24, 1);
      [0.4, 0.6, 0.8].forEach((v, k) => { for (const px of [0.3, 0.5, 0.7]) ponto(x + px, y + v, x + px, y + 0.88, 0.5 - k * 0.17, tom(L.cor, (0.5 - px) * 100), gLixo, SOBE, 0.12, 0.24, 1); });
    }
    // Poste de luz (perto da lata de lixo) e os lampiões das calçadas.
    if (M.POSTE) {
      const [x, y] = M.POSTE;
      fixo(x + 0.5, y + 0.5, 0.05, P.poste || '#5B6168', gLixo, 0.15, 0.2);
      for (let k = 1; k < 5; k++) fixo(x + 0.5, y + 0.5, k * 0.32, P.poste || '#5B6168', gLixo, 0.12, 0.12, LADO);
      ponto(x + 0.2, y + 0.25, x + 0.32, y + 0.42, 1.42, P.luz || '#F6E27A', gLixo, SOBE, 0.17, 0.17, 1);
    }
    const lampioes = [];
    for (const x of [2, 13, 21, 29, 34]) lampioes.push([x, 4], [x, 18]);
    for (const x of [3, 14, 23, 33]) lampioes.push([x, 21]);
    for (const [x, y] of lampioes) {
      const g = grupo(1.5 + (x / W) * 0.8, 0.5), bx = x + 0.15, by = y + 0.9;
      fixo(bx, by, 0.04, P.lampiao || '#4E5459', g, 0.12, 0.16);
      for (let k = 1; k < 4; k++) fixo(bx, by, k * 0.3, P.lampiao || '#4E5459', g, 0.1, 0.1, LADO);
      ponto(x, y + 0.725, bx - 0.08, by - 0.1, 1.05, P.lampiaoLuz || '#F6E58A', g, SOBE, 0.15, 0.15, 1);
    }

    // ---------- O trem: chega pelo trilho e para na estação (ou passa direto, se a estação está em obra) ----------
    const tremX = 21.7, tremY = 25.45;
    const vagoes = [[-1.05, -0.35, P.locomotiva || '#3B3B3B'], [-0.33, 0.37, (P.vagoes || ['#B83A2B', '#D9A441'])[0]], [0.39, 1.09, (P.vagoes || ['#B83A2B', '#D9A441'])[1]]];
    for (const [a, b, cor] of vagoes) for (let k = 0; k < 4; k++) {
      const x = tremX + a + (k + 0.5) * (b - a) / 4;
      for (const yy of [tremY - 0.17, tremY + 0.13]) ponto(x, yy, x, yy, 0.6, cor, 0, TREM, 0.15, 0.15, 1);
      ponto(x, tremY + 0.3, x, tremY + 0.3, 0.32, tom(cor, -35), 0, TREM, 0.15, 0.15, 1);
    }
    for (const hh of [0.8, 0.95]) ponto(tremX - 0.85, tremY - 0.02, tremX - 0.85, tremY - 0.02, hh, '#2B2B2B', 0, TREM, 0.13, 0.13, 1);
    nv.trem = { x: tremX };
    return nv;
  }

  // ---------- O desenho de cada quadro ----------
  function criarDesenho(tela, nv, dados) {
    const g = tela.getContext('2d');
    const n = nv.n, M = dados.mapa;
    const { fx, fy, tx, ty, th, ox, oy, oh, atraso, tam, junto, alfa, grupo, tipo, cor } = nv;
    const px = new Float32Array(n), py = new Float32Array(n), pz = new Float32Array(n), lado = new Float32Array(n);
    const nivel = new Uint8Array(n);
    const NS = nv.cores.length * NA, CHAVES = NB * NS;
    const estilos = [];
    for (const [r, gg, b] of nv.cores) for (let a = 0; a < NA; a++) estilos.push(`rgba(${r},${gg},${b},${((a + 1) / NA).toFixed(3)})`);
    const conta = new Int32Array(CHAVES + 1), chave = new Int32Array(n), ordem = new Int32Array(n);
    const subida = new Float32Array(nv.grupos.length);
    let fonte = 'sans-serif';
    try { fonte = getComputedStyle(dados.alvo).fontFamily || fonte; } catch (e) { /* fica a padrão */ }
    const temTrem = typeof dados.trem === 'function' ? !!dados.trem() : !!dados.trem;

    return desenhar;
    function desenhar(t, cw, ch, dpr) {
      // A câmera: inclina e gira; na volta, tudo isso se desfaz.
      const volta = entraSai(fase(t, T_VOLTA)), desce = 1 - volta;
      const inc = entraSai(fase(t, T_INCLINA)) * desce;
      const fi = INCLINA * inc, te = GIRA * suave(fase(t, T_GIRA)) * desce;
      const cf = Math.cos(fi), sf = Math.sin(fi), ct = Math.cos(te), st = Math.sin(te);
      // O enquadramento: da cidade inteira (começo) até o do jogo (fim), com um zoom que mira o ponto certo.
      const sO = Math.min(cw / (M.W + 6), ch / (M.H + 4)) * (1 - 0.06 * inc);
      const en = typeof dados.enquadramento === 'function' ? dados.enquadramento() : null;
      const sF = en && en.s > 0 ? M.T * en.s : sO;
      const cOx = M.W / 2, cOy = M.H / 2 + 2.4 * inc;
      const cFx = en ? (cw / 2 - en.x) / sF : cOx, cFy = en ? (ch / 2 - en.y) / sF : cOy;
      const s = Math.exp(Math.log(sO) + (Math.log(sF) - Math.log(sO)) * volta);
      let w = volta;
      if (Math.abs(1 / sF - 1 / sO) > 1e-9) w = lim((1 / s - 1 / sO) / (1 / sF - 1 / sO));
      const wcx = cOx + (cFx - cOx) * w, wcy = cOy + (cFy - cOy) * w, scx = cw / 2, scy = ch / 2;
      const projetar = (x, y, h) => {
        const rx = x - wcx, ry = y - wcy, x1 = rx * ct - ry * st, y1 = rx * st + ry * ct;
        const f = D / Math.max(2, D - y1 * sf - h * cf);
        return [scx + x1 * s * f, scy + (y1 * cf - h * sf) * s * f, f];
      };
      // Quanto cada grupo (prédio, árvore, objeto) já subiu.
      for (let k = 1; k < nv.grupos.length; k++) {
        const gr = nv.grupos[k];
        subida[k] = gr.ini == null || t <= gr.ini ? 0 : molinha(lim((t - gr.ini) / gr.dur)) * desce;
      }
      const rio = subida[nv.gAgua];
      const junta = entraSai(fase(t, T_JUNTA));
      const pulso = suave(fase(t, [T_CHAFARIZ[0], T_CHAFARIZ[0] + 0.3])) * (1 - suave(fase(t, [T_CHAFARIZ[1] - 0.35, T_CHAFARIZ[1]])));
      const destinoTrem = temTrem ? nv.trem.x : -6;
      const tremAgora = 40 + (destinoTrem - 40) * (temTrem ? sai(fase(t, T_TREM)) : fase(t, [T_TREM[0], T_TREM[1] + 0.5]));
      const dxTrem = tremAgora - nv.trem.x;
      const aTrem = suave(fase(t, [T_TREM[0], T_TREM[0] + 0.2])) * (1 - suave(fase(t, [T_VOLTA[0] + 0.15, T_VOLTA[1] - 0.1])));

      // 1) Onde cada ponto está e para onde vai na tela.
      let zmin = Infinity, zmax = -Infinity, vis = 0;
      for (let i = 0; i < n; i++) {
        const tp = tipo[i];
        let x, y, h, a = alfa[i];
        if (tp === JATO) {
          if (pulso <= 0) { nivel[i] = 0; continue; }
          const p = (t * 0.95 + ty[i]) % 1, R = 0.62 * th[i] * p;
          x = fx[i] + Math.cos(tx[i]) * R; y = fy[i] + Math.sin(tx[i]) * R;
          h = 0.5 + 1.3 * th[i] * 4 * p * (1 - p) * pulso;
          a *= pulso * (1 - 0.6 * p);
        } else if (tp === ONDA) {
          if (pulso <= 0) { nivel[i] = 0; continue; }
          const p = (t * 0.7 + ty[i]) % 1, R = 0.22 + 0.5 * p;
          x = fx[i] + Math.cos(tx[i]) * R; y = fy[i] + Math.sin(tx[i]) * R; h = 0.16;
          a *= pulso * (1 - p);
        } else {
          const r = subida[grupo[i]];
          x = fx[i] + (tx[i] - fx[i]) * r; y = fy[i] + (ty[i] - fy[i]) * r; h = th[i] * r;
          if (tp === LADO) a *= lim(r * 1.6);
          else if (tp === AGUA) h = rio * (-0.26 + 0.07 * Math.sin(1.25 * x + 0.8 * y - 2.6 * t));
          else if (tp === TREM) { x += dxTrem; h = th[i] * desce; a *= aTrem; }
          const q = (t - atraso[i]) / QUEDA;
          if (q < 1) {
            if (q <= 0) { nivel[i] = 0; continue; }
            const f = 1 - sai(q);
            x += ox[i] * f; y += oy[i] * f; h += oh[i] * f; a *= lim(q * 2);
          }
        }
        if (a < 0.5 / NA) { nivel[i] = 0; continue; }
        const rx = x - wcx, ry = y - wcy;
        const x1 = rx * ct - ry * st, y1 = rx * st + ry * ct;
        const z = -y1 * sf - h * cf, dz = D + z;
        if (dz < 2) { nivel[i] = 0; continue; }
        const f = D / dz, X = scx + x1 * s * f, Y = scy + (y1 * cf - h * sf) * s * f;
        let l = (tam[i] + (junto[i] - tam[i]) * junta) * s * f;
        if (l < 1.2) l = 1.2;
        if (X < -l || Y < -l || X > cw + l || Y > ch + l) { nivel[i] = 0; continue; }
        px[i] = X; py[i] = Y; pz[i] = z; lado[i] = l;
        nivel[i] = Math.max(1, Math.min(NA, Math.round(a * NA)));
        if (z < zmin) zmin = z;
        if (z > zmax) zmax = z;
        vis++;
      }

      // 2) Do fundo para a frente: um balde por faixa de profundidade e, dentro dele, por cor.
      const faixa = zmax - zmin || 1;
      conta.fill(0);
      for (let i = 0; i < n; i++) {
        if (!nivel[i]) continue;
        let b = Math.floor(((zmax - pz[i]) / faixa) * NB);
        if (b >= NB) b = NB - 1;
        const k = b * NS + cor[i] * NA + (nivel[i] - 1);
        chave[i] = k; conta[k + 1]++;
      }
      for (let k = 0; k < CHAVES; k++) conta[k + 1] += conta[k];
      for (let i = 0; i < n; i++) if (nivel[i]) ordem[conta[chave[i]]++] = i;

      // 3) Pinta: quadradinhos (fillRect), o fundo mais apagado quando a câmera está inclinada.
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, cw, ch);
      const fundo = fi / INCLINA;
      let bAt = -1, sAt = -1, trocas = 0;
      for (let j = 0; j < vis; j++) {
        const i = ordem[j], k = chave[i], b = (k / NS) | 0, e = k - b * NS;
        if (b !== bAt) { bAt = b; sAt = -1; g.globalAlpha = 1 - 0.5 * (1 - b / (NB - 1)) * fundo; }
        if (e !== sAt) { sAt = e; g.fillStyle = estilos[e]; trocas++; }
        const l = lado[i];
        g.fillRect(px[i] - l / 2, py[i] - l / 2, l, l);
      }
      g.globalAlpha = 1;
      desenhar.trocas = trocas; desenhar.cores = nv.cores.length;

      // 4) O "Você": um ponto destacado, um anel que pulsa e o crachá igual ao do jogo.
      const aV = suave(fase(t, T_VOCE));
      if (aV > 0 && typeof dados.voce === 'function') {
        const v = dados.voce();
        if (v && Number.isFinite(v.x) && Number.isFinite(v.y)) {
          const [X, Y, f] = projetar(v.x + 0.5, v.y + 0.45, 0);
          const p = 0.5 + 0.5 * Math.sin((t - T_VOCE[0]) * 8), raio = (0.42 + 0.25 * p) * s * f;
          g.globalAlpha = aV * (0.5 + 0.5 * (1 - p));
          g.lineWidth = 2.5; g.strokeStyle = '#FFFFFF';
          g.beginPath(); g.ellipse(X, Y, raio, raio * Math.max(0.35, cf), 0, 0, Math.PI * 2); g.stroke();
          g.globalAlpha = aV;
          g.beginPath(); g.arc(X, Y, Math.max(4, 0.16 * s * f), 0, Math.PI * 2);
          g.fillStyle = '#b4502c'; g.fill(); g.lineWidth = 2; g.stroke();
          const [LX, LY] = projetar(v.x + 0.5, v.y + 1, 0);
          g.font = `700 11.5px ${fonte}`;
          const lw = g.measureText('Você').width + 14, lh = 17.5;
          g.beginPath();
          if (g.roundRect) g.roundRect(LX - lw / 2, LY, lw, lh, lh / 2); else g.rect(LX - lw / 2, LY, lw, lh);
          g.fillStyle = '#b4502c'; g.fill();
          g.fillStyle = '#FFFFFF'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText('Você', LX, LY + lh / 2 + 0.5);
          g.globalAlpha = 1;
        }
      }
      return vis;
    }
  }

  // ---------- A abertura ----------
  function iniciarAbertura(dados, aoTerminar) {
    const alvo = dados && dados.alvo;
    if (!alvo || !dados.mapa) { if (aoTerminar) aoTerminar('erro'); return null; }
    const caixa = document.createElement('div');
    caixa.className = 'pr-maquete';
    caixa.setAttribute('role', 'region');
    caixa.setAttribute('aria-label', 'Abertura da Praça: a maquete da cidade da turma. Clique para pular.');
    const tela = document.createElement('canvas');
    tela.setAttribute('aria-hidden', 'true');
    const botao = document.createElement('button');
    botao.type = 'button'; botao.className = 'pr-maquete-pular'; botao.dataset.acao = 'pular-maquete';
    botao.textContent = 'Pular »';
    caixa.append(tela, botao);
    alvo.append(caixa);
    // Enquanto a maquete cobre tudo, o mapa do jogo por baixo não precisa ser pintado (o jogo continua rodando);
    // ele volta a aparecer no crossfade, no fim (ou na hora, se pular).
    alvo.classList.add('com-maquete');
    const revelar = () => alvo.classList.remove('com-maquete');
    try { botao.focus({ preventScroll: true }); } catch (e) { /* sem foco */ }

    let encerrada = false, saindo = false, raf = 0, t0 = 0, pausadoEm = null, desenhar = null, nv = null;
    let quadros = 0, msDesenho = 0, ultimoT = 0;
    // O tamanho da área: lido quando muda (ResizeObserver), não a cada quadro (o que obrigaria o navegador a
    // recalcular a página toda, porque o jogo continua mexendo nos bonecos por baixo).
    let largura = 0, altura = 0;
    const medir = () => { largura = caixa.clientWidth; altura = caixa.clientHeight; };
    const observador = typeof ResizeObserver === 'function' ? new ResizeObserver(medir) : null;
    if (observador) observador.observe(caixa);
    const ctrl = {};
    function encerrar(motivo) {
      if (encerrada) return;
      encerrada = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', tecla, true);
      if (observador) observador.disconnect();
      revelar();
      caixa.remove();
      if (CE.abertura3d.atual === ctrl) CE.abertura3d.atual = null;
      if (aoTerminar) aoTerminar(motivo);
    }
    function sair(motivo) {
      if (saindo || encerrada) return;
      saindo = true;
      revelar();
      caixa.classList.add('saindo');
      caixa.style.opacity = '0';
      setTimeout(() => encerrar(motivo), 260);
    }
    // Pular: um clique ou toque em qualquer lugar (o clique não chega no mapa: o boneco não sai andando) ou uma tecla.
    caixa.addEventListener('click', (e) => { e.stopPropagation(); sair('pulou'); });
    function tecla(e) {
      if (encerrada) return;
      const foco = document.activeElement;
      if (!foco || !(foco === alvo || alvo.contains(foco))) return;
      if (['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock', 'AltGraph'].includes(e.key)) return;
      e.preventDefault(); e.stopPropagation();
      sair('pulou');
    }
    window.addEventListener('keydown', tecla, true);

    function quadro(agora) {
      if (encerrada) return;
      const t = pausadoEm != null ? pausadoEm : (agora - t0) / 1000;
      if (pausadoEm == null && t >= T_SOME[1]) { encerrar('fim'); return; }
      if (!observador) medir();
      const cw = largura, ch = altura;
      if (cw > 0 && ch > 0) {
        // Densidade da tela, no máximo 2× (e já descontando a página encolhida num celular). Para não pesar,
        // o canvas fica com no máximo 4 milhões de pixels.
        const zoom = (window.visualViewport && window.visualViewport.scale) || 1;
        const dpr = Math.max(0.5, Math.min(2, Math.max(1, (window.devicePixelRatio || 1) * Math.min(1, zoom)), Math.sqrt(MAX_PIXELS / (cw * ch))));
        const W2 = Math.round(cw * dpr), H2 = Math.round(ch * dpr);
        if (tela.width !== W2 || tela.height !== H2) { tela.width = W2; tela.height = H2; }
        const ini = performance.now();
        desenhar(t, cw, ch, dpr);
        msDesenho += performance.now() - ini; quadros++;
      }
      ultimoT = t;
      if (t >= T_SOME[0] - 0.05) revelar(); else if (!saindo && pausadoEm != null) alvo.classList.add('com-maquete');
      if (!saindo) caixa.style.opacity = String(1 - suave(fase(t, T_SOME)));
      raf = requestAnimationFrame(quadro);
    }

    // Espera a cidade chegar do computador do instrutor (os prédios acesos, onde você está) — no máximo 1,5 s.
    const limite = new Promise((ok) => setTimeout(() => ok(true), 1500));
    Promise.race([Promise.resolve(dados.pronto === undefined ? true : dados.pronto), limite]).then((seguir) => {
      if (encerrada) return;
      if (seguir === false) { encerrar('cancelada'); return; }
      try {
        nv = montar(dados);
        desenhar = criarDesenho(tela, nv, dados);
      } catch (e) {
        if (window.console) console.error('Abertura da Praça:', e);
        encerrar('erro');
        return;
      }
      if (typeof dados.aoComecar === 'function') dados.aoComecar();
      medir();
      t0 = performance.now();
      raf = requestAnimationFrame(quadro);
    });

    Object.assign(ctrl, {
      pular: () => sair('pulou'),
      parar: () => encerrar('parou'),
      // Para os testes (e para fotografar um momento): congela a abertura no segundo t; continuar() segue dali.
      pausarEm: (t) => { pausadoEm = Math.max(0, Number(t) || 0); },
      continuar: () => { if (pausadoEm != null) { t0 = performance.now() - pausadoEm * 1000; pausadoEm = null; } },
      medidas: () => ({ quadros, msPorQuadro: quadros ? msDesenho / quadros : 0, pontos: nv ? nv.n : 0, t: ultimoT, comecou: !!desenhar,
        trocasDeCor: desenhar ? desenhar.trocas : 0, cores: desenhar ? desenhar.cores : 0 }),
      elemento: caixa,
    });
    CE.abertura3d.atual = ctrl;
    return ctrl;
  }

  CE.abertura3d = { iniciarAbertura, deveMostrar, marcarVista, CHAVE, DURACAO: T_SOME[1], atual: null };
})();
