// Praça Escola: o encontro virtual da turma pela rede da sala. Cada aluno anda com o seu boneco pela cidade,
// conversa com quem está perto, joga na praça e entra nos prédios, que levam às partes do curso. O instrutor
// abre e fecha a praça, fala no megafone e chama todos para perto da fonte.
// As regras ficam em app/js/praca-regras.js (o computador do instrutor guarda tudo) e o mapa em app/js/praca-mapa.js.
window.CE = window.CE || {};

(function () {
  const M = CE.pracaMapa;
  const { T, W, H } = M;
  const SINCRONIA = 450;        // conversa com o computador do instrutor duas vezes por segundo
  const SINCRONIA_LONGE = 2000; // janela minimizada: devagar, só para continuar na praça
  const RAIO = 7;               // no registro da conversa entra o que foi dito a até 7 quadrinhos
  const VELOCIDADE = 5;         // quadrinhos por segundo do próprio boneco
  const sortear = (l) => l[Math.floor(Math.random() * l.length)];
  const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const navegar = (url) => () => CE.janelas.abrir('navegador', { url });
  const arred = (v) => Math.round(v * 100) / 100;

  // O que tem em cada lugar e para onde o botão leva.
  const LUGAR = {
    escola: { texto: 'A escola da cidade, com a biblioteca. Daqui saem as aulas do curso.', botao: 'Entrar nas Aulas', abrir: () => CE.janelas.abrir('aulas') },
    'casa-ana': { texto: 'A casa de um colega da turma.', embreve: 'Em breve dá para visitar a casa dos colegas que deixarem a porta aberta.' },
    'casa-bruno': { texto: 'A casa de um colega da turma.', embreve: 'Em breve dá para visitar a casa dos colegas que deixarem a porta aberta.' },
    'sua-casa': { texto: 'A sua casinha na cidade, com as medalhas que você ganhou na parede.' },
    empregos: { texto: 'Vagas de emprego de treino, currículo e entrevista.', botao: 'Ver as vagas (Emprega Já)', abrir: navegar('https://empregaja.com.br') },
    lote: { texto: 'Terreno da turma. Todos votam no que construir aqui; as moedas vêm das aulas concluídas.' },
    banco: { texto: 'O banco de treino: Pix, boleto, cartão e empréstimo, sem dinheiro de verdade.', botao: 'Entrar no Banco Escola', abrir: navegar('https://bancoescola.com.br') },
    correios: { texto: 'Mande uma carta para um colega: ela chega no E-mail dele.', botao: 'Escrever uma carta (E-mail)', abrir: () => CE.janelas.abrir('email') },
    prefeitura: { texto: 'Serviços públicos de treino: CPF, Carteira de Trabalho, documentos e assinatura.', botao: 'Entrar no Cidadão Digital', abrir: navegar('https://cidadaodigital.org.br') },
    posto: { texto: 'Agendar consulta e ver a carteira de vacinação.', embreve: 'Em breve: o agendamento de consulta de treino, com a Enfermeira Cida explicando cada passo.' },
    feira: { texto: 'Barracas com açaí, farinha d’água, tucumã e castanha.', botao: 'Vender pela internet (Feira Online)', abrir: navegar('https://feiraonline.com.br') },
    horta: { texto: 'A horta da turma. Ela cresce com as aulas que vocês concluem.' },
    estacao: { texto: 'A estação da estrada de ferro que ligava Porto Velho a Guajará-Mirim.', botao: 'Digitar textos da nossa terra', abrir: () => CE.janelas.abrir('digitacao') },
    rio: { texto: 'O cais do Rio Madeira, com o Seu Bené pescando.', embreve: 'Em breve: a pescaria de palavras, onde cada peixe é uma palavra para digitar antes que ele fuja.' },
    coreto: { texto: 'O palco da praça: daqui o instrutor conduz o bingo, o quiz e a gincana.' },
    fonte: { texto: 'O ponto de encontro da turma. Quando o instrutor chama todos, a turma se junta aqui.' },
    'mesa-velha': { texto: 'Mesa do jogo da velha: dois colegas jogam, cada um no seu computador.' },
    'mesa-domino': { texto: 'Mesa de dominó.', embreve: 'Em breve: dominó para até 4 colegas, cada um no seu computador.' },
    mural: { texto: 'Recados da turma, guardados no computador do instrutor.' },
  };
  // Moradores: personagens do computador. Cada conversa ensina uma coisa do curso.
  const FICHA = {
    rosa: { papel: 'Moradora · no banco da praça', faz: 'Pede ajuda para mandar uma foto ao neto: quem ensina, aprende ensinando.' },
    lucia: { papel: 'Atendente do Banco Escola', faz: 'Explica Pix, boleto e cartão e leva até o banco de treino.' },
    raimundo: { papel: 'Feirante', faz: 'Desafia no caixa da feira: somar a compra e dar o troco certo.' },
    cida: { papel: 'Enfermeira do Posto de Saúde', faz: 'Dá dicas de saúde e de cuidado com golpes por mensagem.' },
    bene: { papel: 'Pescador · no cais do Rio Madeira', faz: 'Conta histórias de Rondônia, que viram textos de digitação.' },
    oferta: { papel: 'Golpista de treino', faz: 'Oferece “vantagens” com cara de golpe. Quem percebe ganha medalha.' },
  };

  // Conquistas da praça (viram medalhas em app/js/medalhas.js).
  async function conquista(id) {
    if (!CE.sessao.usuario) return;
    let nova = false;
    await CE.sessao.atualizarProgresso((p) => { p.praca = p.praca || {}; if (!p.praca[id]) { p.praca[id] = Date.now(); nova = true; } }).catch(() => {});
    if (nova) CE.emitir('praca:conquista', { id });
  }

  // ================= Desenho da cidade (uma vez, num canvas com o dobro de pontos) =================
  function desenharCidade(tela) {
    const Q = 2;
    tela.width = W * T * Q; tela.height = H * T * Q;
    const g = tela.getContext('2d');
    g.scale(Q, Q);
    let semente = 20251113;
    const acaso = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
    const tom = (hex, q) => {
      const n = parseInt(hex.slice(1), 16); const f = (c) => Math.max(0, Math.min(255, Math.round(c + q)));
      return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
    };
    const COR = { grama: '#8DBE5A', rua: '#5E6468', calcada: '#D9D1C0', praca: '#ECDFC0', terra: '#C47A48', horta: '#6E4B2E', lote: '#C98E5E', plataforma: '#C8C0B0', trilho: '#9D9285', areia: '#E9D49F', agua: '#8A6C45', pier: '#9C6E44' };
    const circulo = (x, y, r, cor) => { g.fillStyle = cor; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
    const emoji = (txt, x, y, tam) => { g.font = `${tam}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, x, y); };
    const ret = (x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
    const { chao } = M;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { g.fillStyle = COR[chao[y][x]]; g.fillRect(x * T, y * T, T, T); }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = chao[y][x], X = x * T, Y = y * T;
      if (t === 'grama') for (let k = 0; k < 5; k++) { g.fillStyle = acaso() < 0.5 ? '#7EB04D' : '#A2CD6C'; g.fillRect(X + acaso() * 36, Y + acaso() * 36, 3, 2); }
      if (t === 'calcada') { g.strokeStyle = 'rgba(90, 76, 50, .16)'; g.lineWidth = 1; g.strokeRect(X + 0.5, Y + 0.5, T - 1, T - 1); g.beginPath(); g.moveTo(X + T / 2, Y); g.lineTo(X + T / 2, Y + T); g.moveTo(X, Y + T / 2); g.lineTo(X + T, Y + T / 2); g.stroke(); }
      if (t === 'terra' || t === 'lote') for (let k = 0; k < 7; k++) { g.fillStyle = acaso() < 0.5 ? 'rgba(120, 50, 20, .25)' : 'rgba(255, 220, 180, .25)'; g.fillRect(X + acaso() * 37, Y + acaso() * 37, 3, 3); }
      if (t === 'areia') for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(160, 120, 60, .25)'; g.fillRect(X + acaso() * 37, Y + acaso() * 37, 2, 2); }
      if (t === 'plataforma') { g.strokeStyle = 'rgba(0, 0, 0, .12)'; g.strokeRect(X + 0.5, Y + 0.5, T - 1, T - 1); }
      if (t === 'rua') {
        g.fillStyle = '#4C5155';
        if (y > 0 && chao[y - 1][x] !== 'rua') g.fillRect(X, Y, T, 3);
        if (y < H - 1 && chao[y + 1][x] !== 'rua') g.fillRect(X, Y + T - 3, T, 3);
        if (x > 0 && chao[y][x - 1] !== 'rua') g.fillRect(X, Y, 3, T);
        if (x < W - 1 && chao[y][x + 1] !== 'rua') g.fillRect(X + T - 3, Y, 3, T);
      }
    }
    // Faixas do meio das ruas e faixas de pedestre
    g.fillStyle = '#F0CF57';
    const cruz = (x) => (x >= 9 * T && x < 11 * T) || (x >= 25 * T && x < 27 * T);
    for (const yy of [6 * T, 20 * T]) for (let x = 6; x < W * T; x += 26) if (!cruz(x) && !cruz(x + 14)) g.fillRect(x, yy - 1.5, 14, 3);
    for (const xx of [10 * T, 26 * T]) for (let y = 7 * T + 6; y < 19 * T; y += 26) g.fillRect(xx - 1.5, y, 3, 14);
    g.fillStyle = 'rgba(255, 255, 255, .9)';
    for (const x0 of [9 * T, 25 * T]) for (let k = 0; k < 6; k++) g.fillRect(x0 + 6 + k * 12, 13 * T + 4, 7, T - 8);
    for (const y0 of [5 * T, 19 * T]) for (let k = 0; k < 6; k++) g.fillRect(17 * T + 4, y0 + 6 + k * 12, 2 * T - 8, 7);
    // Praça: piso em anéis em volta da fonte
    g.save(); g.beginPath(); g.rect(12 * T, 8 * T, 12 * T, 10 * T); g.clip();
    for (let r = 520, k = 0; r > 0; r -= 18, k++) circulo(18 * T, 14 * T, r, k % 2 ? '#E5D4AE' : '#EFE3C6');
    g.restore();
    g.strokeStyle = '#C2AE84'; g.lineWidth = 3; g.strokeRect(12 * T + 1.5, 8 * T + 1.5, 12 * T - 3, 10 * T - 3);
    for (const [x, y] of M.IPES) { g.fillStyle = '#7DB050'; ret(x * T + 2, y * T + 2, T - 4, T - 4, 10); g.fill(); }
    // Trilhos da Madeira-Mamoré, rio e cais
    for (let x = 0; x < W * T; x += 12) { g.fillStyle = '#6B4A33'; g.fillRect(x + 2, 25 * T + 6, 6, T - 12); }
    g.fillStyle = '#C9CED3'; g.fillRect(0, 25 * T + 12, W * T, 3); g.fillRect(0, 25 * T + 25, W * T, 3);
    g.fillStyle = '#E3C23A'; g.fillRect(18 * T, 25 * T - 5, 11 * T, 3);
    g.strokeStyle = 'rgba(190, 160, 115, .55)'; g.lineWidth = 2;
    for (let y = 27 * T + 10; y < H * T; y += 16) {
      g.beginPath();
      for (let x = 0; x <= W * T; x += 8) { const yy = y + Math.sin((x + y * 3) / 22) * 2.5; if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); }
      g.stroke();
    }
    g.fillStyle = 'rgba(255, 255, 255, .25)'; g.fillRect(0, 27 * T, W * T, 3);
    for (let y = 26; y <= 28; y++) for (let x = 31; x <= 32; x++) {
      g.fillStyle = '#9C6E44'; g.fillRect(x * T, y * T, T, T);
      g.strokeStyle = 'rgba(60, 35, 15, .45)'; g.lineWidth = 1;
      for (let k = 8; k < T; k += 8) { g.beginPath(); g.moveTo(x * T, y * T + k + 0.5); g.lineTo(x * T + T, y * T + k + 0.5); g.stroke(); }
    }
    for (const [x, y] of [[31, 28], [33, 28], [31, 27], [33, 27]]) circulo(x * T + (x === 33 ? -3 : 3), y * T + T - 3, 4, '#5A3A1F');
    // Horta e lote
    g.fillStyle = '#5A3A22'; g.fillRect(12 * T, 22 * T, 5 * T, 3 * T);
    g.fillStyle = '#7A5233'; for (let k = 0; k < 3; k++) g.fillRect(12 * T + 6, 22 * T + 8 + k * T, 5 * T - 12, T - 16);
    g.strokeStyle = '#A07848'; g.lineWidth = 3; g.strokeRect(12 * T + 1.5, 22 * T + 1.5, 5 * T - 3, 3 * T - 3);
    ['🥬', '🌽', '🍅'].forEach((planta, k) => { for (let i = 0; i < 6; i++) emoji(planta, 12 * T + 18 + i * 31, 22 * T + 20 + k * T, 18); });
    g.setLineDash([6, 5]); g.strokeStyle = '#7A4E2A'; g.lineWidth = 3; g.strokeRect(31 * T + 3, 1 * T + 3, 4 * T - 6, 3 * T - 6); g.setLineDash([]);
    circulo(32 * T + 6, 2 * T + 30, 12, '#B07A4E'); circulo(34 * T + 6, 3 * T + 4, 9, '#A86F44');
    // Feira
    for (const [x, y, cor] of M.BARRACAS) {
      const X = x * T, Y = y * T;
      g.fillStyle = 'rgba(0, 0, 0, .2)'; g.fillRect(X + 4, Y + 6, T, T);
      for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? '#FFFFFF' : cor; g.fillRect(X + k * 8, Y, 8, 22); }
      g.fillStyle = '#8A5A35'; g.fillRect(X, Y + 22, T, 18);
    }
    ['🍍', '🍌', '🥭', '🌽', '🐟'].forEach((f, i) => emoji(f, M.BARRACAS[i][0] * T + T / 2, 22 * T + 31, 15));
    // Coreto (palco octogonal, sem telhado, para ver quem está lá)
    const oct = (cx, cy, r) => { g.beginPath(); for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * Math.PI / 4; const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; if (k) g.lineTo(px, py); else g.moveTo(px, py); } g.closePath(); };
    const ccx = 18 * T, ccy = 9.5 * T;
    g.fillStyle = 'rgba(0, 0, 0, .18)'; oct(ccx + 4, ccy + 6, 58); g.fill();
    g.fillStyle = '#F4EFE6'; oct(ccx, ccy, 58); g.fill();
    g.fillStyle = '#C89A62'; oct(ccx, ccy, 49); g.fill();
    g.strokeStyle = 'rgba(90, 55, 25, .35)'; g.lineWidth = 1;
    for (let k = -44; k < 48; k += 9) { g.beginPath(); g.moveTo(ccx - 46, ccy + k); g.lineTo(ccx + 46, ccy + k); g.stroke(); }
    g.strokeStyle = '#FFFFFF'; g.lineWidth = 3; oct(ccx, ccy, 53); g.stroke();
    for (let k = 0; k < 8; k++) { const a = Math.PI / 8 + k * Math.PI / 4; circulo(ccx + Math.cos(a) * 53, ccy + Math.sin(a) * 53, 4.5, '#FFFFFF'); }
    g.fillStyle = '#E8E0D2'; g.fillRect(ccx - 16, ccy + 54, 32, 8);
    // Fonte
    circulo(18 * T + 3, 14 * T + 5, 39, 'rgba(0, 0, 0, .18)');
    circulo(18 * T, 14 * T, 38, '#CDBF9E'); circulo(18 * T, 14 * T, 31, '#7CC4E2');
    g.strokeStyle = 'rgba(255, 255, 255, .7)'; g.lineWidth = 2;
    for (const r of [16, 24]) { g.beginPath(); g.arc(18 * T, 14 * T, r, 0, Math.PI * 2); g.stroke(); }
    circulo(18 * T, 14 * T, 9, '#CDBF9E'); circulo(18 * T, 14 * T, 4, '#FFFFFF');
    // Bancos, mesas e mural
    for (const [x, y] of M.BANCOS) {
      const X = x * T, Y = y * T;
      g.fillStyle = 'rgba(0, 0, 0, .18)'; g.fillRect(X + 7, Y + 15, 2 * T - 10, 16);
      g.fillStyle = '#7A4E2A'; g.fillRect(X + 4, Y + 10, 2 * T - 8, 5);
      g.fillStyle = '#A26C3D'; for (let k = 0; k < 3; k++) g.fillRect(X + 4, Y + 16 + k * 5, 2 * T - 8, 4);
    }
    for (const [x, y, tipo] of [[14, 13, 'velha'], [21, 13, 'domino']]) {
      const cx = x * T + T / 2, cy = y * T + T / 2;
      for (const [dx, dy] of [[0, -17], [0, 17], [-17, 0], [17, 0]]) circulo(cx + dx, cy + dy, 5, '#6E4B2E');
      circulo(cx + 2, cy + 3, 14, 'rgba(0, 0, 0, .2)'); circulo(cx, cy, 13, '#B7834A');
      g.strokeStyle = '#FFFFFF'; g.lineWidth = 1.5;
      if (tipo === 'velha') { g.beginPath(); g.moveTo(cx - 3, cy - 8); g.lineTo(cx - 3, cy + 8); g.moveTo(cx + 3, cy - 8); g.lineTo(cx + 3, cy + 8); g.moveTo(cx - 8, cy - 3); g.lineTo(cx + 8, cy - 3); g.moveTo(cx - 8, cy + 3); g.lineTo(cx + 8, cy + 3); g.stroke(); }
      else { g.fillStyle = '#FFFFFF'; g.fillRect(cx - 9, cy - 3, 8, 5); g.fillRect(cx, cy - 3, 8, 5); g.fillRect(cx - 4, cy + 3, 5, 8); }
    }
    const mx = 21 * T, my = 8 * T;
    g.fillStyle = 'rgba(0, 0, 0, .2)'; g.fillRect(mx + 7, my + 9, 2 * T - 10, 26);
    g.fillStyle = '#8A5A35'; g.fillRect(mx + 4, my + 5, 2 * T - 8, 26);
    g.fillStyle = '#C9A06A'; g.fillRect(mx + 7, my + 8, 2 * T - 14, 20);
    ['#FFF39A', '#BFE2FF', '#FFC9D6', '#CFF2C7', '#FFF39A'].forEach((c, i) => { g.fillStyle = c; g.fillRect(mx + 10 + i * 13, my + 11 + (i % 2) * 5, 10, 10); });
    // Prédios
    for (const L of M.LUGARES) {
      if (!L.telhado) continue;
      const [x, y, w, h] = L.r;
      const X = x * T, Y = y * T, PW = w * T, PH = h * T;
      const paredeH = Math.round(T * 1.1), telhadoH = PH - paredeH, topo = Y + telhadoH;
      g.fillStyle = 'rgba(20, 30, 20, .22)'; g.fillRect(X + 5, Y + 7, PW, PH);
      g.fillStyle = tom(L.telhado, 16); g.fillRect(X, Y, PW, telhadoH / 2);
      g.fillStyle = L.telhado; g.fillRect(X, Y + telhadoH / 2, PW, telhadoH / 2);
      g.strokeStyle = tom(L.telhado, -24); g.lineWidth = 1;
      for (let k = Y + 6; k < Y + telhadoH - 4; k += 7) { g.beginPath(); g.moveTo(X, k + 0.5); g.lineTo(X + PW, k + 0.5); g.stroke(); }
      g.fillStyle = tom(L.telhado, 40); g.fillRect(X, Y + telhadoH / 2 - 2, PW, 3);
      g.fillStyle = tom(L.telhado, -42); g.fillRect(X - 2, Y + telhadoH - 4, PW + 4, 5);
      g.fillStyle = L.parede; g.fillRect(X, topo, PW, paredeH);
      g.fillStyle = 'rgba(0, 0, 0, .1)'; g.fillRect(X, Y + PH - 4, PW, 4);
      for (let i = 0; i < w; i++) {
        const cx = X + i * T + T / 2;
        if (L.colunas) { g.fillStyle = '#FFFFFF'; g.fillRect(X + i * T, topo, 5, paredeH); g.fillStyle = 'rgba(0, 0, 0, .08)'; g.fillRect(X + i * T + 5, topo, 2, paredeH); }
        if (L.portas.includes(x + i)) {
          g.fillStyle = '#5B3A22'; g.fillRect(cx - 11, topo + 7, 22, paredeH - 7);
          g.fillStyle = '#8B5B36'; g.fillRect(cx - 9, topo + 9, 8, paredeH - 11); g.fillRect(cx + 1, topo + 9, 8, paredeH - 11);
          g.fillStyle = '#E8C35A'; g.fillRect(cx - 3, topo + paredeH / 2 + 3, 2, 3);
        } else {
          g.fillStyle = '#5C7887'; g.fillRect(cx - 9, topo + 10, 18, 17);
          g.fillStyle = '#A8D2E6'; g.fillRect(cx - 7, topo + 12, 14, 13);
          g.fillStyle = 'rgba(255, 255, 255, .6)'; g.fillRect(cx - 7, topo + 12, 5, 13);
        }
      }
      if (L.cruz) { const cx = X + PW - 28, cy = Y + telhadoH / 2; circulo(cx, cy, 14, '#FFFFFF'); g.fillStyle = '#2E8B57'; g.fillRect(cx - 3, cy - 9, 6, 18); g.fillRect(cx - 9, cy - 3, 18, 6); }
    }
    // Árvores, ipês e palmeiras
    const arvore = (x, y, cor, escura, flor) => {
      const cx = x * T + T / 2, cy = y * T + T / 2;
      g.fillStyle = 'rgba(0, 0, 0, .22)'; g.beginPath(); g.ellipse(cx + 5, cy + 9, 18, 11, 0, 0, Math.PI * 2); g.fill();
      circulo(cx, cy, 19, escura);
      for (const [dx, dy, r] of [[-8, -5, 12], [7, -7, 12], [-6, 7, 11], [8, 6, 11], [0, 0, 13]]) circulo(cx + dx, cy + dy - 2, r, cor);
      if (flor) for (let k = 0; k < 9; k++) circulo(cx - 13 + acaso() * 26, cy - 14 + acaso() * 24, 2.2, flor);
      else circulo(cx - 6, cy - 9, 4, 'rgba(255, 255, 255, .22)');
    };
    for (const [x, y] of M.ARVORES) arvore(x, y, '#4E9A43', '#2F6E2A');
    for (const [x, y, cor] of M.IPES) if (cor === 'amarelo') arvore(x, y, '#F2C12E', '#C5960F', '#FFE27A'); else arvore(x, y, '#C2569E', '#8C3A72', '#F0A6D6');
    for (const [x, y] of M.PALMEIRAS) {
      const cx = x * T + T / 2, cy = y * T + T / 2;
      g.fillStyle = 'rgba(0, 0, 0, .2)'; g.beginPath(); g.ellipse(cx + 6, cy + 10, 15, 7, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3F8F3A';
      for (let k = 0; k < 6; k++) { g.save(); g.translate(cx, cy - 4); g.rotate(k * Math.PI / 3); g.beginPath(); g.ellipse(11, 0, 13, 4.5, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
      circulo(cx, cy - 4, 5, '#7A5A2E'); circulo(cx + 3, cy - 1, 2.5, '#5C3F1E');
    }
  }

  CE.registrarApp({
    id: 'praca',
    nome: 'Praça Escola',
    icone: '⛲',
    largura: 1120,
    altura: 700,
    abrir(corpo, janela) {
      corpo.classList.add('pr-corpo');
      const usuario = CE.sessao.usuario;
      const souInstrutor = usuario.papel === 'instrutor';

      // ---------- Montagem da tela ----------
      const tela = CE.el('canvas', { 'aria-hidden': 'true' });
      const camadaObjetos = CE.el('div', { class: 'pr-camada', 'aria-hidden': 'true' });
      const camadaRotulos = CE.el('div', { class: 'pr-camada', 'aria-hidden': 'true' });
      const camadaGente = CE.el('div', { class: 'pr-camada' });
      const mundo = CE.el('div', { class: 'pr-mundo' }, tela, camadaObjetos, camadaRotulos, camadaGente);
      const megafoneEl = CE.el('div', { class: 'pr-megafone', role: 'status' }); megafoneEl.hidden = true;
      const avisoRede = CE.el('div', { class: 'pr-aviso-rede', role: 'status' }); avisoRede.hidden = true;
      const botaoMapa = CE.el('button', { class: 'pr-botao-mapa', type: 'button', 'data-acao': 'cidade-inteira' }, 'Ver a cidade inteira');
      const dica = CE.el('div', { class: 'pr-dica' }, 'Clique no chão para andar · setas do teclado · Enter conversa');
      const dialogo = CE.el('div', { class: 'pr-dialogo', role: 'dialog', 'aria-labelledby': 'pr-dialogo-titulo' }); dialogo.hidden = true;
      const fechadaEl = CE.el('div', { class: 'pr-fechada' },
        CE.el('div', { class: 'pr-fechada-cartao' }, CE.el('span', { style: 'font-size: 34px', 'aria-hidden': 'true' }, '🔒'),
          CE.el('h3', {}, 'A praça está fechada agora'), CE.el('p', {}, 'O instrutor abre no recreio, no fim da aula.')));
      fechadaEl.hidden = true;
      const mapa = CE.el('div', { class: 'pr-mapa', tabindex: '0', 'aria-label': 'Mapa da Praça Escola. Clique no chão para andar ou use as setas do teclado; Enter conversa com quem está perto.' },
        mundo, megafoneEl, avisoRede, botaoMapa, dica, dialogo, fechadaEl);
      // Clique dentro das janelinhas não é clique no chão (um botão que redesenha a janelinha some antes de o clique
      // chegar ao mapa, e aí o boneco sairia andando).
      for (const camada of [dialogo, fechadaEl, megafoneEl, avisoRede]) camada.addEventListener('click', (e) => e.stopPropagation());

      const campoConversa = CE.el('input', { id: 'pr-campo-conversa', maxlength: '80', autocomplete: 'off', placeholder: 'Escreva para quem está perto', 'aria-label': 'Mensagem para quem está perto' });
      const formConversa = CE.el('form', { class: 'pr-digitar' }, campoConversa, CE.el('button', { class: 'botao', type: 'submit' }, 'Enviar'));
      const notaConversa = CE.el('p', { class: 'pr-nota' }); notaConversa.hidden = true;
      const botaoMao = CE.el('button', { class: 'pr-gesto', type: 'button', 'data-gesto': 'ajuda', title: 'Pedir ajuda (levantar a mão)', 'aria-label': 'Pedir ajuda' }, '🙋');
      const barra = CE.el('div', { class: 'pr-barra' },
        CE.el('div', { class: 'pr-frases', 'aria-label': 'Frases prontas' }, CE.pracaRegras.FRASES.map((f) => CE.el('button', { class: 'pr-chip', type: 'button', 'data-frase': f, onclick: () => falar(f) }, f))),
        formConversa, notaConversa,
        CE.el('div', { class: 'pr-gestos', 'aria-label': 'Gestos' },
          CE.el('button', { class: 'pr-gesto', type: 'button', 'data-gesto': 'acenar', title: 'Acenar', 'aria-label': 'Acenar', onclick: () => gesto('acenar') }, '👋'),
          CE.el('button', { class: 'pr-gesto', type: 'button', 'data-gesto': 'aplaudir', title: 'Aplaudir', 'aria-label': 'Aplaudir', onclick: () => gesto('aplaudir') }, '👏'),
          botaoMao));

      const cartaoInstrutor = CE.el('section', { class: 'pr-cartao instrutor', 'data-pr': 'instrutor' });
      const cartaoPerto = CE.el('section', { class: 'pr-cartao', 'data-pr': 'perto', 'aria-live': 'polite' }, CE.el('h3', {}, 'Aqui perto'), CE.el('div', {}));
      const listaGente = CE.el('ul', { class: 'pr-gente' });
      const cartaoGente = CE.el('section', { class: 'pr-cartao', 'data-pr': 'gente' }, CE.el('h3', {}, 'Na praça agora'), listaGente);
      const log = CE.el('ol', { class: 'pr-log' });
      const cartaoConversa = CE.el('section', { class: 'pr-cartao', 'data-pr': 'conversa' }, CE.el('h3', {}, 'Conversa'), CE.el('p', { class: 'pr-suave' }, 'Aparece só o que foi dito perto de você.'), log);
      const cartaoCofre = CE.el('section', { class: 'pr-cartao', 'data-pr': 'cofre' }, CE.el('h3', {}, 'Cofre da turma'), CE.el('p', { class: 'pr-suave' }, 'Carregando…'));
      const lado = CE.el('aside', { class: 'pr-lado', 'aria-label': 'Painel da praça' }, souInstrutor ? cartaoInstrutor : null, cartaoPerto, cartaoGente, cartaoConversa, cartaoCofre);
      corpo.replaceChildren(CE.el('div', { class: 'pr-caixa' }, CE.el('div', { class: 'pr' }, mapa, barra, lado)));
      desenharCidade(tela);

      // ---------- Rótulos e objetos do mapa ----------
      const rotuloDe = {};
      const rotulo = (texto, x, y, classe) => { const r = CE.el('div', { class: 'pr-rotulo' + (classe ? ' ' + classe : ''), style: `left:${x}px;top:${y}px` }, texto); camadaRotulos.append(r); return r; };
      for (const L of M.LUGARES) {
        const [x, y, w, h] = L.r;
        const pos = { feira: [5.5 * T, 24.6 * T], rio: [18 * T, 28.5 * T], lote: [33 * T, 1.3 * T] }[L.id]
          || [(x + w / 2) * T, L.telhado ? y * T + (h * T - Math.round(T * 1.1)) / 2 : (y + h / 2) * T];
        rotuloDe[L.id] = rotulo(`${L.emoji} ${L.id === 'rio' ? 'Rio Madeira' : L.nome}`, pos[0], pos[1], L.casa ? 'pequeno' : '');
      }
      rotuloDe.praca = rotulo('⛲ Praça da Turma', 18 * T, 7.5 * T);
      rotuloDe['mesa-velha'] = rotulo('❌ Jogo da velha', 14.5 * T, 12.9 * T, 'pequeno so-perto');
      rotuloDe['mesa-domino'] = rotulo('🎲 Dominó', 21.5 * T, 12.9 * T, 'pequeno so-perto');
      rotuloDe.mural = rotulo('📌 Mural de recados', 22 * T, 8.1 * T, 'pequeno so-perto');
      rotuloDe.coreto = rotulo('🎭 Coreto', 18 * T, 11.4 * T, 'pequeno so-perto');
      rotulo('Cais', 32 * T, 26.5 * T, 'pequeno so-perto');
      rotulo('RUA DA ESCOLA', 4 * T, 6 * T, 'rua'); rotulo('RUA DA ESCOLA', 31 * T, 6 * T, 'rua'); rotulo('AVENIDA DO RIO', 5 * T, 20 * T, 'rua');
      const objeto = (txt, x, y, classe) => camadaObjetos.append(CE.el('div', { class: 'pr-obj' + (classe ? ' ' + classe : ''), style: `left:${x}px;top:${y}px` }, txt));
      objeto('⛵', 27.5 * T, 28.3 * T, 'barco'); objeto('🛶', 8.5 * T, 28 * T, 'barco'); objeto('🚂🚃🚃', 21.7 * T, 25.45 * T, 'trem');
      objeto('🎣', 33.1 * T, 28.2 * T); objeto('🚧', 32.8 * T, 2.7 * T);

      // ---------- Bonecos ----------
      function boneco(p, classe) {
        p.rostoEl = CE.el('span', { class: 'rosto' }, p.emoji);
        p.nomeEl = CE.el('span', { class: 'nome' }, p.nome);
        p.el = CE.el('div', { class: `pr-p ${classe}`, 'data-pessoa': p.id, title: p.nome }, CE.el('div', { class: 'sombra' }), CE.el('div', { class: 'corpo' }, p.rostoEl), p.nomeEl);
        camadaGente.append(p.el);
        posicionar(p);
        return p;
      }
      function posicionar(p) { p.el.style.transform = `translate(${p.x * T}px, ${p.y * T}px)`; p.el.style.zIndex = String(10 + Math.round(p.y * 10)); }
      function balao(p, texto, classe) {
        if (!p || !p.el) return;
        if (p.balaoEl) p.balaoEl.remove();
        clearTimeout(p.balaoTimer);
        p.balaoEl = CE.el('div', { class: 'pr-balao' + (classe ? ' ' + classe : '') }, texto);
        p.el.append(p.balaoEl);
        p.balaoTimer = setTimeout(() => { if (p.balaoEl) { p.balaoEl.remove(); p.balaoEl = null; } }, 4500);
      }
      const classeDe = (x) => (x.papel === 'instrutor' ? 'instrutor' : x.monitor ? 'monitor' : 'colega');
      const nomeDe = (x) => (x.papel === 'instrutor' ? `${x.nome} · instrutor` : x.monitor ? `${x.nome} · monitor(a)` : x.nome);

      // Eu: quem anda é este computador; o do instrutor só fica sabendo onde estou.
      const eu = boneco({ id: usuario.id, nome: usuario.nome, emoji: usuario.avatar || '🙂', x: 18, y: 15, caminho: [] }, 'eu' + (souInstrutor ? ' instrutor' : ''));
      eu.nomeEl.textContent = 'Você';
      // Moradores (iguais em todos os computadores)
      const moradores = M.MORADORES.map((m) => boneco({ ...m, caminho: [] }, m.id === 'oferta' ? 'golpista' : 'morador'));
      const porMorador = Object.fromEntries(moradores.map((m) => [m.id, m]));
      // Os outros: vêm do computador do instrutor
      const outros = new Map();

      // ---------- Câmera ----------
      let perto = true;
      const cam = { x: 0, y: 0, s: 1 };
      function enquadrar() {
        const cw = mapa.clientWidth, ch = mapa.clientHeight;
        if (!cw || !ch) return;
        const MW = W * T, MH = H * T;
        if (!perto) { cam.s = Math.min(cw / MW, ch / MH); cam.x = (cw - MW * cam.s) / 2; cam.y = (ch - MH * cam.s) / 2; }
        else {
          cam.s = Math.max(0.7, Math.min(1.15, Math.min(cw / (15 * T), ch / (11 * T))));
          const px = (eu.x + 0.5) * T * cam.s, py = (eu.y + 0.5) * T * cam.s;
          cam.x = MW * cam.s <= cw ? (cw - MW * cam.s) / 2 : Math.min(0, Math.max(cw - MW * cam.s, cw / 2 - px));
          cam.y = MH * cam.s <= ch ? (ch - MH * cam.s) / 2 : Math.min(0, Math.max(ch - MH * cam.s, ch / 2 - py));
        }
        mundo.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`;
        mundo.style.setProperty('--inv', String(1 / cam.s));
      }
      function mudarZoom(paraPerto) {
        perto = paraPerto;
        mapa.classList.toggle('longe', !perto);
        botaoMapa.textContent = perto ? 'Ver a cidade inteira' : 'Voltar para perto';
        dica.textContent = perto ? 'Clique no chão para andar · setas do teclado · Enter conversa' : 'Clique num prédio para ir até ele.';
        mundo.classList.add('suave'); setTimeout(() => mundo.classList.remove('suave'), 520);
        enquadrar();
      }
      botaoMapa.addEventListener('click', (e) => { e.stopPropagation(); mudarZoom(!perto); });

      // ---------- Andar ----------
      let seta = null;
      function irPara(metas, aoChegar) {
        const de = M.maisPerto(eu.x, eu.y);
        const c = M.caminho(de, metas);
        if (c == null) { CE.avisar('Por ali não dá para passar.'); return false; }
        eu.caminho = c; eu.aoChegar = aoChegar || null;
        if (!c.length && aoChegar) { eu.aoChegar = null; aoChegar(); }
        return true;
      }
      function mover(dt) {
        if (!eu.caminho.length && seta && !bloqueado()) {
          const [x, y] = M.maisPerto(eu.x, eu.y), nx = x + seta[0], ny = y + seta[1];
          if (M.andavel(nx, ny)) eu.caminho.push([nx, ny]);
        }
        if (!eu.caminho.length) {
          if (eu.andando) { eu.andando = false; eu.el.classList.remove('andando'); const f = eu.aoChegar; eu.aoChegar = null; if (f) f(); }
          return;
        }
        const [tx, ty] = eu.caminho[0];
        const dx = tx - eu.x, dy = ty - eu.y, d = Math.hypot(dx, dy), passo = VELOCIDADE * dt;
        if (!eu.andando) { eu.andando = true; eu.el.classList.add('andando'); }
        if (dx < -0.01) eu.esq = true; else if (dx > 0.01) eu.esq = false;
        eu.el.classList.toggle('esq', !!eu.esq);
        if (d <= passo) { eu.x = tx; eu.y = ty; eu.caminho.shift(); } else { eu.x += (dx / d) * passo; eu.y += (dy / d) * passo; }
        posicionar(eu);
      }
      // Os outros andam macio até a última posição que chegou pela rede.
      function moverOutros(dt) {
        for (const o of outros.values()) {
          const dx = o.alvoX - o.x, dy = o.alvoY - o.y, d = Math.hypot(dx, dy);
          if (d > 6) { o.x = o.alvoX; o.y = o.alvoY; }
          else if (d > 0.01) { const passo = Math.max(2.6, d * 4) * dt; if (d <= passo) { o.x = o.alvoX; o.y = o.alvoY; } else { o.x += (dx / d) * passo; o.y += (dy / d) * passo; } }
          const andando = d > 0.05 || o.andandoRede;
          o.el.classList.toggle('andando', andando);
          if (Math.abs(dx) > 0.02) o.el.classList.toggle('esq', dx < 0); else if (!andando) o.el.classList.toggle('esq', !!o.esqRede);
          posicionar(o);
        }
      }

      // ---------- Estado que vem do computador do instrutor ----------
      let desde = 0, versaoVista = -1, chamadaVista = undefined, primeira = true, emCurso = false, fechouJanela = false;
      let estado = { aberta: true, soFrases: false, silenciado: false, silenciados: [] };
      let mesa = null, votacao = null, mural = null;
      const conversa = [];
      function registrar(item) {
        conversa.push(item); if (conversa.length > 40) conversa.shift();
        log.replaceChildren(...conversa.map((c) => CE.el('li', { class: c.classe || '' }, c.quem ? CE.el('strong', {}, `${c.emoji || ''} ${c.quem}: `) : null, c.texto)));
        log.scrollTop = log.scrollHeight;
      }
      const sistema = (texto) => registrar({ classe: 'sistema', texto });
      const bloqueado = () => !estado.aberta && !souInstrutor;

      async function sincronizar() {
        if (emCurso || fechouJanela) return;
        emCurso = true;
        try {
          const r = await CE.api.chamar('praca:sincronizar', { x: arred(eu.x), y: arred(eu.y), esq: !!eu.esq, andando: !!eu.andando }, desde);
          if (fechouJanela) return;
          avisoRede.hidden = true;
          receber(r);
        } catch (e) {
          avisoRede.textContent = '⚠️ ' + (e.message || 'Sem conexão com o computador do instrutor.');
          avisoRede.hidden = false;
        } finally { emCurso = false; }
      }
      function receber(r) {
        if (r.novo) { eu.x = r.eu.x; eu.y = r.eu.y; eu.caminho = []; posicionar(eu); enquadrar(); }
        // Pessoas
        const vistos = new Set();
        for (const x of r.pessoas) {
          if (x.id === usuario.id) continue;
          vistos.add(x.id);
          let o = outros.get(x.id);
          if (!o) { o = boneco({ id: x.id, nome: nomeDe(x), emoji: x.avatar, x: x.x, y: x.y }, classeDe(x)); outros.set(x.id, o); }
          Object.assign(o, { alvoX: x.x, alvoY: x.y, esqRede: x.esq, andandoRede: x.andando, papel: x.papel, monitor: x.monitor, bot: x.bot, mao: x.mao, nomeReal: x.nome, turma: x.turma });
          if (o.rostoEl.textContent !== x.avatar) o.rostoEl.textContent = x.avatar;
          if (o.nomeEl.textContent !== nomeDe(x)) { o.nomeEl.textContent = nomeDe(x); o.el.title = x.nome; }
          o.el.className = `pr-p ${classeDe(x)}` + (o.el.classList.contains('andando') ? ' andando' : '') + (o.el.classList.contains('esq') ? ' esq' : '');
          marcarMao(o, x.mao);
        }
        for (const [id, o] of outros) if (!vistos.has(id)) { o.el.remove(); outros.delete(id); }
        const minha = r.pessoas.find((x) => x.id === usuario.id);
        marcarMao(eu, minha && minha.mao);
        botaoMao.classList.toggle('ligado', !!(minha && minha.mao));
        botaoMao.textContent = minha && minha.mao ? '🙋 Baixar a mão' : '🙋';
        // Conversa e avisos
        for (const ev of r.eventos) tratarEvento(ev, r.agora - ev.em > 10000);
        desde = r.ultimo;
        // Escolhas do instrutor
        const mudouConfig = estado.aberta !== r.aberta || estado.soFrases !== r.soFrases || estado.silenciado !== r.silenciado;
        estado = { aberta: r.aberta, soFrases: r.soFrases, silenciado: r.silenciado, silenciados: r.silenciados || [] };
        fechadaEl.hidden = !bloqueado();
        if (bloqueado()) { eu.caminho = []; fecharDialogo(); }
        formConversa.hidden = estado.soFrases && !souInstrutor || estado.silenciado;
        notaConversa.hidden = !formConversa.hidden;
        notaConversa.textContent = estado.silenciado ? 'O instrutor pediu para você ficar só ouvindo por enquanto.' : 'Agora a conversa é só com as frases prontas (o instrutor escolheu).';
        barra.querySelectorAll('.pr-chip, .pr-gesto').forEach((b) => { b.disabled = estado.silenciado || bloqueado(); });
        if (mudouConfig && souInstrutor) desenharInstrutor();
        // "Todo mundo para a praça": cada um vai para um lugar em volta da fonte.
        if (r.chamada && r.chamada.id !== chamadaVista && (chamadaVista !== undefined || r.agora - r.chamada.em < 15000)) {
          const ids = r.pessoas.filter((x) => !x.bot).map((x) => x.id).sort();
          const vaga = M.RODA[Math.max(0, ids.indexOf(usuario.id)) % M.RODA.length];
          irPara([vaga]);
          if (!perto) mudarZoom(true);
        }
        chamadaVista = r.chamada ? r.chamada.id : (chamadaVista === undefined ? null : chamadaVista);
        // Mesa do jogo da velha
        const novaMesa = JSON.stringify(r.mesa);
        if (novaMesa !== JSON.stringify(mesa)) { mesa = r.mesa; if (dialogo.dataset.tipo === 'mesa' && !dialogo.hidden && modoMesa === 'rede') desenharMesa(); }
        if (r.versao !== versaoVista) {
          versaoVista = r.versao;
          carregarCofre();
          if (dialogo.dataset.tipo === 'mural' && !dialogo.hidden) abrirMural();
        }
        desenharGente();
        if (primeira) { primeira = false; conquista('visitou'); CE.emitir('praca:entrou', {}); }
      }
      function marcarMao(p, ligada) {
        if (ligada && !p.maoEl) { p.maoEl = CE.el('span', { class: 'pr-mao', 'aria-label': 'pediu ajuda' }, '🙋'); p.el.append(p.maoEl); }
        if (!ligada && p.maoEl) { p.maoEl.remove(); p.maoEl = null; }
      }
      function pessoaDoEvento(de) { return de.id === usuario.id ? eu : outros.get(de.id); }
      function tratarEvento(ev, velho) {
        const p = ev.de ? pessoaDoEvento(ev.de) : null;
        const perto = ev.de && (ev.de.id === usuario.id || souInstrutor || ev.x == null || Math.hypot(ev.x - eu.x, ev.y - eu.y) <= RAIO);
        if (ev.tipo === 'fala') {
          if (!velho) balao(p, ev.texto);
          if (perto) registrar({ quem: ev.de.id === usuario.id ? 'Você' : ev.de.nome, emoji: ev.de.avatar, texto: ev.texto, classe: ev.de.id === usuario.id ? 'eu' : '' });
        } else if (ev.tipo === 'gesto') {
          const emoji = { acenar: '👋', aplaudir: '👏👏👏', ajuda: '🙋 Preciso de ajuda!' }[ev.gesto] || '';
          if (!velho) balao(p, emoji);
          if (ev.gesto === 'ajuda' && ev.de.id !== usuario.id && (perto || souInstrutor)) registrar({ classe: 'sistema', texto: `🙋 ${ev.de.nome} pediu ajuda.` });
        } else if (ev.tipo === 'megafone') {
          registrar({ classe: 'megafone', quem: `📣 ${ev.de.nome}`, texto: ev.texto });
          if (!velho) {
            megafoneEl.textContent = `📣 ${ev.de.nome}: ${ev.texto}`; megafoneEl.hidden = false;
            clearTimeout(megafoneEl.timer); megafoneEl.timer = setTimeout(() => { megafoneEl.hidden = true; }, 6500);
            if (p) balao(p, ev.texto, 'megafone');
            if (CE.voz && ev.de.id !== usuario.id) CE.voz.falar(ev.texto);
          }
        } else if (ev.tipo === 'recado') {
          if (perto) registrar({ classe: 'sistema', texto: `📌 ${ev.de.id === usuario.id ? 'Você' : ev.de.nome} pregou no mural: “${ev.texto}”` });
        } else if (ev.tipo === 'sistema') {
          sistema(ev.texto);
          if (!velho && ev.vitoria === usuario.id) conquista('velha');
        }
      }

      // ---------- Falar, gestos e ações do instrutor ----------
      async function chamar(canal, ...args) {
        try { return await CE.api.chamar(canal, ...args); } catch (e) { CE.avisar(e.message); return null; }
      }
      async function falar(texto) {
        const t = String(texto || '').trim();
        if (!t) return;
        const r = await chamar('praca:falar', t);
        if (r) { CE.emitir('praca:falou', { texto: r.texto }); sincronizar(); }
      }
      formConversa.addEventListener('submit', (e) => { e.preventDefault(); const t = campoConversa.value; campoConversa.value = ''; falar(t); });
      async function gesto(tipo) {
        const r = await chamar('praca:gesto', tipo);
        if (r) sincronizar();
      }
      botaoMao.addEventListener('click', () => gesto(botaoMao.classList.contains('ligado') ? 'baixar' : 'ajuda'));

      function desenharInstrutor() {
        if (!souInstrutor) return;
        const megafone = CE.el('input', { id: 'pr-campo-megafone', maxlength: '120', autocomplete: 'off', placeholder: 'Ex.: Bingo em 5 minutos!', 'aria-label': 'Recado do megafone' });
        const soFrases = CE.el('input', { type: 'checkbox', id: 'pr-so-frases' }); soFrases.checked = estado.soFrases;
        soFrases.addEventListener('change', () => chamar('praca:configurar', { soFrases: soFrases.checked }).then(sincronizar));
        cartaoInstrutor.replaceChildren(
          CE.el('h3', {}, '👨‍🏫 Comandos do instrutor'),
          CE.el('div', { class: 'pr-botoes' },
            CE.el('button', { class: 'botao', type: 'button', 'data-acao': 'chamar-todos', onclick: () => chamar('praca:chamar').then(sincronizar) }, 'Chamar todos para a praça'),
            CE.el('button', { class: 'botao secundario', type: 'button', 'data-acao': 'abrir-fechar', onclick: () => chamar('praca:configurar', { aberta: !estado.aberta }).then(sincronizar) }, estado.aberta ? 'Fechar a praça' : 'Abrir a praça')),
          CE.el('form', { class: 'pr-digitar', onsubmit: (e) => { e.preventDefault(); const t = megafone.value.trim(); if (!t) return; megafone.value = ''; chamar('praca:megafone', t).then(sincronizar); } },
            megafone, CE.el('button', { class: 'botao', type: 'submit' }, '📣 Falar')),
          CE.el('label', { class: 'pr-chave', for: 'pr-so-frases' }, soFrases, 'Só frases prontas na conversa'),
          CE.el('p', { class: 'pr-suave' }, estado.aberta ? 'A praça está aberta para a turma.' : 'A praça está fechada para os alunos.'));
      }
      desenharInstrutor();

      function desenharGente() {
        const lista = [...outros.values()].sort((a, b) => (b.mao ? 1 : 0) - (a.mao ? 1 : 0) || String(a.nomeReal).localeCompare(String(b.nomeReal)));
        if (!lista.length) { listaGente.replaceChildren(CE.el('li', { class: 'pr-suave' }, 'Só você por enquanto. Quando os colegas abrirem a Praça Escola, eles aparecem aqui.')); return; }
        listaGente.replaceChildren(...lista.map((o) => CE.el('li', { 'data-gente': o.id },
          CE.el('button', { class: 'ir', type: 'button', title: 'Ir até ' + o.nomeReal, onclick: () => chegarPerto(o) }, `${o.mao ? '🙋 ' : ''}${o.rostoEl.textContent} ${o.nomeEl.textContent}`),
          souInstrutor && o.papel !== 'instrutor' && !o.bot
            ? CE.el('button', { class: 'mini', type: 'button', 'data-silenciar': o.id, onclick: () => chamar('praca:silenciar', o.id, !estado.silenciados.includes(o.id)).then(sincronizar) }, estado.silenciados.includes(o.id) ? 'Deixar falar' : 'Silenciar')
            : null)));
      }

      // ---------- Cofre da turma e votação ----------
      async function carregarCofre() {
        const r = await CE.api.chamar('praca:votacao').catch(() => null);
        if (r) { votacao = r; desenharCofre(); }
      }
      function desenharCofre() {
        const v = votacao;
        const c = v.cofre || { aulas: 0, moedas: 0, meta: 1500 };
        const total = v.total || 1;
        const vencedor = v.vencedor && v.opcoes.find((o) => o.id === v.vencedor);
        if (rotuloDe.lote) rotuloDe.lote.textContent = vencedor ? `🚧 Obra: ${vencedor.nome}` : '🚧 Lote da turma';
        cartaoCofre.replaceChildren(
          CE.el('h3', {}, 'Cofre da turma'),
          CE.el('p', { class: 'pr-cofre' }, CE.el('span', {}, c.moedas.toLocaleString('pt-BR')), ' moedas'),
          CE.el('div', { class: 'pr-progresso', role: 'progressbar', 'aria-label': 'Cofre da turma', 'aria-valuemin': '0', 'aria-valuemax': String(c.meta), 'aria-valuenow': String(Math.min(c.moedas, c.meta)) },
            CE.el('span', { style: `width:${Math.min(100, (c.moedas / c.meta) * 100).toFixed(1)}%` })),
          CE.el('p', { class: 'pr-suave' }, `Cada aula concluída rende 4 moedas (${c.aulas} aulas da turma até agora). A obra escolhida custa ${c.meta.toLocaleString('pt-BR')}.`),
          CE.el('h3', {}, vencedor ? 'A turma escolheu' : 'O que construir no Lote da turma?'),
          CE.el('div', { class: 'pr-votos' }, v.opcoes.map((o) => CE.el('button', {
            class: 'pr-voto' + (v.meu === o.id ? ' meu' : '') + (v.vencedor === o.id ? ' venceu' : ''), type: 'button', 'data-voto': o.id,
            'aria-pressed': String(v.meu === o.id), disabled: v.encerrada,
            onclick: async () => { const r = await chamar('praca:votar', v.meu === o.id ? null : o.id); if (r) { votacao = r; desenharCofre(); CE.emitir('praca:votou', { opcao: r.meu }); } },
          }, CE.el('span', {}, `${o.emoji} ${o.nome}`), CE.el('span', { class: 'n' }, `${o.votos} voto${o.votos === 1 ? '' : 's'}`), CE.el('span', { class: 'barra', style: `--p:${Math.round((o.votos / total) * 100)}%` })))),
          souInstrutor ? CE.el('div', { class: 'pr-botoes' }, v.encerrada
            ? CE.el('button', { class: 'botao secundario', type: 'button', 'data-acao': 'nova-votacao', onclick: async () => { const r = await chamar('praca:nova-votacao'); if (r) { votacao = r; desenharCofre(); } } }, 'Nova votação')
            : CE.el('button', { class: 'botao secundario', type: 'button', 'data-acao': 'encerrar-votacao', onclick: async () => { const r = await chamar('praca:encerrar-votacao'); if (r) { votacao = r; desenharCofre(); } } }, 'Encerrar a votação')) : null);
      }
      function mostrarCofre() { cartaoCofre.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); cartaoCofre.animate([{ boxShadow: '0 0 0 3px #b4502c' }, { boxShadow: '0 0 0 0 transparent' }], 1600); }

      // ---------- Diálogos ----------
      function abrirDialogo({ tipo, rosto, papelCor, titulo, subtitulo, fala, lista, nota, campo, extra, opcoes }) {
        const botoes = (opcoes || [{ rotulo: 'Fechar' }]).map((op) => CE.el('button', {
          class: 'botao' + (op.principal ? '' : ' secundario'), type: 'button', 'data-opcao': op.id || null,
          onclick: () => { if (op.acao) op.acao(); if (!op.fica) fecharDialogo(); },
        }, op.rotulo));
        dialogo.dataset.tipo = tipo || '';
        dialogo.replaceChildren(...[
          CE.el('div', { class: 'pr-dlg-topo' },
            CE.el('span', { class: 'pr-rosto ' + (papelCor || ''), 'aria-hidden': 'true' }, rosto),
            CE.el('div', {}, CE.el('h3', { id: 'pr-dialogo-titulo' }, titulo), subtitulo ? CE.el('p', {}, subtitulo) : null),
            CE.el('button', { class: 'pr-dlg-fechar', type: 'button', 'aria-label': 'Fechar', onclick: fecharDialogo }, '×')),
          fala ? CE.el('p', { class: 'pr-dlg-fala' }, fala) : null,
          lista ? CE.el('ol', { class: 'pr-dlg-lista' }, lista.map((i) => CE.el('li', {}, i))) : null,
          campo ? CE.el('div', { class: 'pr-dlg-extra' }, campo) : null,
          extra ? CE.el('div', { class: 'pr-dlg-extra' }, extra) : null,
          nota ? CE.el('p', { class: 'pr-dlg-nota' }, nota) : null,
          CE.el('div', { class: 'pr-dlg-opcoes' }, botoes),
        ].filter(Boolean));
        dialogo.hidden = false;
        const foco = dialogo.querySelector('input:not([type="checkbox"])') || botoes[0];
        if (foco) foco.focus({ preventScroll: true });
      }
      function fecharDialogo() { if (dialogo.hidden) return; dialogo.hidden = true; dialogo.dataset.tipo = ''; mapa.focus({ preventScroll: true }); }

      // Conversas dos moradores: cada passo é [rótulo, próximo passo ou null, principal?, ação].
      const DIALOGOS = {
        rosa: {
          inicio: { fala: 'Bom dia, meu bem! Meu neto Pedro mora em Ji-Paraná e eu queria mandar para ele uma foto do meu jardim. Você me ensina?', opcoes: [['Ensino, sim!', 'ensinar', true], ['Agora não, Dona Rosa', null]] },
          ensinar: { fala: 'Que bom! Me mostra devagarinho, que eu anoto:', lista: ['Abrir o aplicativo de mensagens no celular', 'Tocar na conversa do Pedro', 'Tocar no clipe 📎 e escolher a foto do jardim', 'Apertar em Enviar'],
            nota: 'Quer treinar de verdade? O Celular do Computador Escola tem o aplicativo de mensagens.',
            opcoes: [['Pronto, Dona Rosa!', null, true, () => { setTimeout(() => balao(porMorador.rosa, 'Chegou! O Pedro mandou um coração ❤️'), 500); conquista('ensinou'); }], ['Abrir o Celular', null, false, () => CE.janelas.abrir('celular')]] },
        },
        lucia: {
          inicio: { fala: 'Bem-vindo ao Banco Escola! Aqui você treina Pix, boleto e cartão sem gastar dinheiro de verdade. Quer saber como o Pix funciona?', opcoes: [['Quero saber', 'pix', true], ['Agora não', null]] },
          pix: { fala: 'O Pix manda dinheiro na hora, a qualquer dia e hora. Antes de confirmar, confira sempre o NOME de quem vai receber. Se o nome não for o esperado, cancele!',
            opcoes: [['Entrar no Banco Escola', null, true, navegar('https://bancoescola.com.br')], ['Obrigado, Dona Lúcia!', null]] },
        },
        raimundo: {
          inicio: { fala: 'Olha o açaí, a farinha d’água e o tucumã fresquinho! Me ajuda no caixa? Uma freguesa levou 1 kg de farinha d’água, que custa R$ 8,50, e pagou com uma nota de R$ 20. Quanto eu devolvo de troco?',
            campo: 'Troco em reais', opcoes: [['Conferir o troco', 'conferir', true], ['Depois eu ajudo', null]] },
          certo: { fala: 'Isso mesmo: R$ 11,50! Você tem jeito para o caixa. Quer treinar mais? A Digitação tem o caixa de supermercado, com o teclado numérico. 🧺',
            opcoes: [['Combinado!', null, true, () => conquista('caixa')], ['Treinar o caixa (Digitação)', null, false, () => { conquista('caixa'); CE.janelas.abrir('digitacao'); }]] },
          errado: { fala: 'Hum, quase! Faça 20 menos 8,50. Tenta de novo?', opcoes: [['Tentar de novo', 'inicio', true], ['Depois eu volto', null]] },
        },
        cida: {
          inicio: { fala: 'Bom dia! Aqui no posto você agenda consulta e vê a carteira de vacinação. Lembrete: o posto nunca pede senha de banco por mensagem, viu?',
            nota: 'Em breve: o agendamento de consulta de treino, com a Enfermeira Cida explicando cada passo.', opcoes: [['Obrigado, Cida!', null, true]] },
        },
        bene: {
          inicio: { fala: 'Pescando no Madeira desde menino… Sabia que a Estrada de Ferro Madeira-Mamoré foi construída entre 1907 e 1912, ligando Porto Velho a Guajará-Mirim?', opcoes: [['Conta mais!', 'mais', true], ['Boa pescaria!', null]] },
          mais: { fala: 'O trem passava beirando o rio, cortando a mata. Hoje a estação virou lugar de passeio, logo ali do lado.',
            nota: 'Os textos da nossa terra, na Digitação, contam essas histórias. Em breve: a pescaria de palavras aqui no cais.',
            opcoes: [['Digitar textos da nossa terra', null, true, () => CE.janelas.abrir('digitacao')], ['Que legal!', null]] },
        },
        oferta: {
          inicio: { fala: 'Psiu! Parabéns, você foi sorteado: empréstimo de R$ 5.000 na hora, sem consultar o nome! É só fazer agora um Pix de R$ 150 da “taxa de liberação”. Vai querer?', opcoes: [['Fazer o Pix da taxa', 'caiu'], ['Isso é golpe!', 'pegou', true]] },
          caiu: { fala: 'Opa… o dinheiro foi embora e o empréstimo nunca chegou.', nota: 'Era golpe: empréstimo de verdade nunca cobra taxa antes de liberar o dinheiro. Na dúvida, pergunte ao Professor Virtual ou ao instrutor.', opcoes: [['Entendi, vou ficar esperto', null, true]] },
          pegou: { fala: '…Ih, fui descoberto! (o Moço da Oferta sai de fininho)', nota: 'Isso mesmo: taxa adiantada para liberar empréstimo é golpe.', opcoes: [['Olho vivo!', null, true, () => { conquista('olhoVivo'); sumirOferta(); }]] },
        },
      };
      function abrirNo(id, passo) {
        const m = porMorador[id], d = DIALOGOS[id][passo];
        const campo = d.campo ? CE.el('label', { class: 'pr-campo', for: 'pr-campo-dialogo' }, d.campo, CE.el('input', { id: 'pr-campo-dialogo', inputmode: 'decimal', autocomplete: 'off', placeholder: 'Ex.: 5,00' })) : null;
        abrirDialogo({
          tipo: 'morador', rosto: m.emoji, papelCor: id === 'oferta' ? 'golpista' : 'morador', titulo: m.nome, subtitulo: FICHA[id].papel,
          fala: d.fala, lista: d.lista, nota: d.nota, campo,
          opcoes: d.opcoes.map(([rotulo, prox, principal, acao]) => ({
            rotulo, principal, fica: !!prox, id: prox || null,
            acao: () => {
              if (acao) acao();
              if (prox === 'conferir') {
                const v = parseFloat(String(dialogo.querySelector('#pr-campo-dialogo').value).replace(/[^\d,.]/g, '').replace(',', '.'));
                return abrirNo(id, Math.abs(v - 11.5) < 0.001 ? 'certo' : 'errado');
              }
              if (prox) abrirNo(id, prox);
            },
          })),
        });
        if (campo) campo.querySelector('input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); dialogo.querySelector('[data-opcao="conferir"]').click(); } });
      }
      function sumirOferta() {
        const o = porMorador.oferta;
        setTimeout(() => o.el.classList.add('sumiu'), 900);
        setTimeout(() => { o.el.classList.remove('sumiu'); balao(o, 'Psiu! Tenho uma oferta imperdível…'); }, 60000);
      }
      function abrirPessoa(o) {
        const tipo = classeDe(o);
        abrirDialogo({
          tipo: 'pessoa', rosto: o.rostoEl.textContent, papelCor: tipo, titulo: o.nomeReal,
          subtitulo: o.papel === 'instrutor' ? 'Instrutor da turma' : o.monitor ? 'Monitor(a) da turma' : `Colega da turma${o.turma ? ' · ' + o.turma : ''}${o.bot ? ' (de demonstração)' : ''}`,
          fala: o.mao ? `${o.nomeReal} levantou a mão: pediu ajuda.` : 'Diga alguma coisa: quem está perto vê no balão e na conversa.',
          opcoes: [
            { rotulo: `Dizer oi para ${o.nomeReal}`, principal: true, acao: () => falar(`Oi, ${o.nomeReal}! 👋`) },
            { rotulo: 'Chamar para jogar', acao: () => falar(`${o.nomeReal}, vamos jogar jogo da velha?`) },
            { rotulo: 'Fechar' },
          ],
        });
      }

      // ---------- Lugares ----------
      function abrirLugar(L) {
        const info = LUGAR[L.id] || {};
        if (L.id === 'mesa-velha') return abrirMesa();
        if (L.id === 'mural') return abrirMural();
        if (L.id === 'coreto') {
          return abrirDialogo({ tipo: 'lugar', rosto: '🎭', titulo: 'Coreto', subtitulo: 'O palco da praça', fala: info.texto,
            nota: souInstrutor ? null : 'Quando o instrutor abre uma gincana ou uma corrida de digitação, o convite aparece na sua tela.',
            opcoes: souInstrutor
              ? [{ rotulo: 'Abrir a gincana', principal: true, acao: () => CE.janelas.abrir('gincana') }, { rotulo: 'Abrir a corrida de digitação', acao: () => CE.janelas.abrir('corrida') }, { rotulo: 'Fechar' }]
              : [{ rotulo: 'Fechar' }] });
        }
        if (L.id === 'fonte') {
          return abrirDialogo({ tipo: 'lugar', rosto: '⛲', titulo: 'Fonte', subtitulo: 'No meio da praça', fala: info.texto,
            opcoes: [{ rotulo: 'Jogar uma moedinha e fazer um pedido', principal: true, acao: () => falar('✨ Fiz um pedido na fonte!') }, { rotulo: 'Fechar' }] });
        }
        if (L.id === 'sua-casa') {
          CE.sessao.progresso().catch(() => ({})).then((p) => {
            const minhas = (CE.MEDALHAS || []).filter((m) => p.medalhas && p.medalhas[m.id]);
            abrirDialogo({ tipo: 'lugar', rosto: '🏠', papelCor: 'eu', titulo: 'Sua casa', subtitulo: 'Na Rua da Escola', fala: info.texto,
              extra: minhas.length ? CE.el('p', { 'data-parede': String(minhas.length) }, `Na parede: ${minhas.slice(-12).map((m) => `${m.icone} ${m.nome}`).join(' · ')}${minhas.length > 12 ? ` e mais ${minhas.length - 12}` : ''}.`) : CE.el('p', { 'data-parede': '0' }, 'A parede ainda está vazia: as medalhas aparecem aqui conforme você ganha.'),
              nota: 'Em breve: arrumar os móveis arrastando com o mouse.',
              opcoes: [{ rotulo: 'Ver todas as medalhas (Aulas)', principal: true, acao: () => CE.janelas.abrir('aulas') }, { rotulo: 'Fechar' }] });
          });
          return;
        }
        if (L.id === 'lote' || L.id === 'horta') {
          return abrirDialogo({ tipo: 'lugar', rosto: L.emoji, titulo: L.nome, subtitulo: 'Lugar da turma', fala: info.texto,
            opcoes: [{ rotulo: 'Ver o cofre e a votação', principal: true, acao: mostrarCofre }, { rotulo: 'Fechar' }] });
        }
        const opcoes = [];
        if (info.botao) opcoes.push({ rotulo: info.botao, principal: true, id: 'entrar', acao: () => { info.abrir(); CE.emitir('praca:entrou-lugar', { lugar: L.id }); } });
        if (L.morador) opcoes.push({ rotulo: `Falar com ${porMorador[L.morador].nome}`, principal: !info.botao, acao: () => chegarPerto(porMorador[L.morador]) });
        opcoes.push({ rotulo: 'Fechar' });
        abrirDialogo({ tipo: 'lugar', rosto: L.emoji, titulo: L.nome, subtitulo: L.area ? 'Lugar da cidade' : L.casa ? 'Casa' : 'Prédio da cidade', fala: info.texto, nota: info.embreve || null, opcoes });
      }

      // ---------- Mesa do jogo da velha ----------
      let modoMesa = 'rede', local = null;
      function abrirMesa() { modoMesa = 'rede'; dialogo.dataset.tipo = 'mesa'; desenharMesa(); }
      function desenharMesa() {
        if (modoMesa === 'computador') return desenharLocal();
        const m = mesa || { X: null, O: null, tab: Array(9).fill(null), vez: 'X' };
        const meuLado = m.X && m.X.id === usuario.id ? 'X' : m.O && m.O.id === usuario.id ? 'O' : null;
        const nome = (j) => (j ? (j.id === usuario.id ? 'Você' : j.nome) : 'lugar livre');
        const lados = CE.el('div', { class: 'pr-mesa-lados' },
          CE.el('span', { class: 'pr-mesa-lado' + (m.X && m.O && !m.vencedor && m.vez === 'X' ? ' vez' : '') }, `❌ ${nome(m.X)}`),
          CE.el('span', { class: 'pr-mesa-lado' + (m.X && m.O && !m.vencedor && m.vez === 'O' ? ' vez' : '') }, `⭕ ${nome(m.O)}`));
        const jogando = !!(m.X && m.O);
        let status;
        if (!meuLado) status = jogando ? `${m.X.nome} e ${m.O.nome} estão jogando.` : 'Sente na mesa para jogar com um colega.';
        else if (!jogando) status = 'Esperando alguém sentar do outro lado…';
        else if (m.vencedor === 'velha') status = 'Deu velha: ninguém ganhou.';
        else if (m.vencedor) status = m.vencedor === meuLado ? 'Você ganhou! 🎉' : `${nome(m[m.vencedor])} ganhou desta vez.`;
        else status = m.vez === meuLado ? 'Sua vez!' : `Vez de ${nome(m[m.vez])}…`;
        const casas = m.tab.map((v, i) => CE.el('button', {
          class: 'pr-casa' + (m.linha && m.linha.includes(i) ? ' linha' : ''), type: 'button', 'aria-label': `Casa ${i + 1}`, 'data-casa': String(i),
          disabled: !meuLado || !jogando || !!m.vencedor || m.vez !== meuLado || !!v,
          onclick: async () => { const r = await chamar('praca:mesa', 'jogar', i); if (r) { mesa = r; desenharMesa(); } },
        }, v === 'X' ? '❌' : v === 'O' ? '⭕' : ''));
        const opcoes = [];
        if (!meuLado && (!m.X || !m.O)) opcoes.push({ rotulo: 'Sentar na mesa', principal: true, fica: true, id: 'sentar', acao: async () => { const r = await chamar('praca:mesa', 'sentar'); if (r) { mesa = r; desenharMesa(); } } });
        if (meuLado && m.vencedor) opcoes.push({ rotulo: 'Jogar de novo', principal: true, fica: true, id: 'nova', acao: async () => { const r = await chamar('praca:mesa', 'nova'); if (r) { mesa = r; desenharMesa(); } } });
        if (!jogando || !meuLado) opcoes.push({ rotulo: 'Jogar com o computador', fica: true, id: 'computador', acao: () => { modoMesa = 'computador'; local = null; desenharLocal(); } });
        if (meuLado) opcoes.push({ rotulo: 'Levantar da mesa', fica: true, id: 'levantar', acao: async () => { const r = await chamar('praca:mesa', 'levantar'); if (r) { mesa = r; desenharMesa(); } } });
        opcoes.push({ rotulo: 'Fechar' });
        abrirDialogo({ tipo: 'mesa', rosto: '❌', titulo: 'Jogo da velha', subtitulo: 'Mesa da praça', extra: [lados, CE.el('p', { class: 'pr-velha-status', 'aria-live': 'polite' }, status), CE.el('div', { class: 'pr-velha' }, casas)], opcoes });
      }
      // Contra o computador (só neste computador, enquanto não tem colega na mesa).
      function desenharLocal() {
        const regras = CE.pracaRegras;
        if (!local) local = { tab: Array(9).fill(null), vez: 'X', fim: null, linha: null };
        const g = local;
        const checar = () => {
          for (const s of ['X', 'O']) { const l = regras.venceu(g.tab, s); if (l) { g.fim = s; g.linha = l; if (s === 'X') conquista('velha'); return; } }
          if (g.tab.every(Boolean)) g.fim = 'velha';
        };
        const jogar = (i) => {
          if (g.fim || g.vez !== 'X' || g.tab[i]) return;
          g.tab[i] = 'X'; checar(); g.vez = 'O'; desenharLocal();
          if (!g.fim) setTimeout(() => { if (local !== g) return; g.tab[regras.jogadaDoComputador(g.tab, 'O')] = 'O'; checar(); g.vez = 'X'; if (dialogo.dataset.tipo === 'mesa' && modoMesa === 'computador') desenharLocal(); }, 600);
        };
        const status = g.fim === 'X' ? 'Você ganhou! 🎉' : g.fim === 'O' ? 'O computador ganhou desta vez.' : g.fim === 'velha' ? 'Deu velha: ninguém ganhou.' : g.vez === 'X' ? 'Você joga com ❌. Sua vez!' : 'O computador está pensando…';
        const casas = g.tab.map((v, i) => CE.el('button', { class: 'pr-casa' + (g.linha && g.linha.includes(i) ? ' linha' : ''), type: 'button', 'aria-label': `Casa ${i + 1}`, 'data-casa': String(i), disabled: !!g.fim || g.vez !== 'X' || !!v, onclick: () => jogar(i) }, v === 'X' ? '❌' : v === 'O' ? '⭕' : ''));
        abrirDialogo({ tipo: 'mesa', rosto: '🤖', titulo: 'Jogo da velha com o computador', subtitulo: 'Enquanto nenhum colega senta na mesa',
          extra: [CE.el('p', { class: 'pr-velha-status', 'aria-live': 'polite' }, status), CE.el('div', { class: 'pr-velha' }, casas)],
          opcoes: [{ rotulo: 'Jogar de novo', principal: true, fica: true, id: 'nova', acao: () => { local = null; desenharLocal(); } },
            { rotulo: 'Voltar para a mesa da turma', fica: true, id: 'mesa-turma', acao: () => { modoMesa = 'rede'; desenharMesa(); } }, { rotulo: 'Fechar' }] });
      }

      // ---------- Mural ----------
      async function abrirMural() {
        const r = await CE.api.chamar('praca:mural').catch((e) => { CE.avisar(e.message); return null; });
        if (!r) return;
        mural = r;
        const lista = r.recados.length
          ? CE.el('ul', { class: 'pr-recados' }, r.recados.map((x) => CE.el('li', { 'data-recado': String(x.id) },
            CE.el('span', { class: 'quem' }, `${x.de.avatar} ${x.de.nome}`),
            souInstrutor ? CE.el('button', { class: 'apagar', type: 'button', title: 'Tirar do mural', 'aria-label': `Tirar o recado de ${x.de.nome}`, onclick: async () => { if (await chamar('praca:apagar-recado', x.id)) abrirMural(); } }, '🗑️') : null,
            CE.el('span', { class: 'texto' }, x.texto))))
          : CE.el('p', { class: 'pr-suave' }, 'O mural ainda está vazio. Que tal pregar o primeiro recado?');
        let embaixo;
        if ((estado.soFrases && !souInstrutor) || estado.silenciado) embaixo = CE.el('p', { class: 'pr-suave' }, 'Agora o mural está só para leitura (o instrutor escolheu).');
        else {
          const campo = CE.el('input', { id: 'pr-campo-recado', maxlength: '100', autocomplete: 'off', placeholder: 'Escreva um recado para a turma', 'aria-label': 'Recado para a turma' });
          embaixo = CE.el('form', { class: 'pr-digitar', onsubmit: async (e) => { e.preventDefault(); const t = campo.value.trim(); if (!t) return; if (await chamar('praca:recado', t)) { CE.emitir('praca:recado', {}); abrirMural(); } } },
            campo, CE.el('button', { class: 'botao', type: 'submit' }, 'Pregar no mural'));
        }
        abrirDialogo({ tipo: 'mural', rosto: '📌', titulo: 'Mural de recados', subtitulo: 'Na praça, ao lado do coreto', extra: [lista, embaixo], nota: LUGAR.mural.texto, opcoes: [{ rotulo: 'Fechar' }] });
      }

      // ---------- Perto de quê? ----------
      function oQueEstaPerto() {
        let achado = null, menor = 1.6;
        for (const m of moradores) { if (m.el.classList.contains('sumiu')) continue; const d = distancia(m, eu); if (d < menor) { menor = d; achado = { morador: m }; } }
        for (const o of outros.values()) { const d = distancia(o, eu); if (d < menor) { menor = d; achado = { pessoa: o }; } }
        if (achado) return achado;
        const [x, y] = M.maisPerto(eu.x, eu.y);
        if (Math.hypot(x - eu.x, y - eu.y) > 0.2) return null;
        for (const L of [...M.OBJETOS, ...M.LUGARES]) if (L.entradas && L.entradas.some(([a, b]) => a === x && b === y)) return { lugar: L };
        return null;
      }
      function interagir(a) {
        if (a.morador) return abrirNo(a.morador.id, 'inicio');
        if (a.pessoa) return abrirPessoa(a.pessoa);
        if (a.lugar) return abrirLugar(a.lugar);
      }
      let pertoAtual = null;
      function verPerto(forcar) {
        const a = oQueEstaPerto();
        const chave = a ? (a.morador ? 'm' + a.morador.id : a.pessoa ? 'p' + a.pessoa.id : 'l' + a.lugar.id) : '';
        if (chave === pertoAtual && !forcar) return;
        pertoAtual = chave;
        const alvo = cartaoPerto.lastElementChild;
        if (!a) { alvo.replaceChildren(CE.el('p', { class: 'pr-suave' }, 'Chegue perto de alguém, de uma mesa ou da porta de um prédio para ver o que dá para fazer.')); return; }
        if (a.morador) {
          const m = a.morador;
          alvo.replaceChildren(CE.el('div', { class: 'pr-perto-topo' }, CE.el('span', { class: 'pr-rosto ' + (m.id === 'oferta' ? 'golpista' : 'morador'), 'aria-hidden': 'true' }, m.emoji), CE.el('div', {}, CE.el('strong', {}, m.nome), CE.el('span', { class: 'pr-suave' }, FICHA[m.id].papel))),
            CE.el('p', {}, FICHA[m.id].faz), CE.el('button', { class: 'botao', type: 'button', 'data-acao': 'conversar', onclick: () => interagir(a) }, 'Conversar'));
        } else if (a.pessoa) {
          const o = a.pessoa;
          alvo.replaceChildren(CE.el('div', { class: 'pr-perto-topo' }, CE.el('span', { class: 'pr-rosto ' + classeDe(o), 'aria-hidden': 'true' }, o.rostoEl.textContent), CE.el('div', {}, CE.el('strong', {}, o.nomeReal), CE.el('span', { class: 'pr-suave' }, o.papel === 'instrutor' ? 'Instrutor da turma' : o.monitor ? 'Monitor(a) da turma' : 'Colega da turma'))),
            CE.el('button', { class: 'botao', type: 'button', 'data-acao': 'conversar', onclick: () => interagir(a) }, 'Conversar'));
        } else {
          const L = a.lugar, info = LUGAR[L.id] || {};
          alvo.replaceChildren(CE.el('div', { class: 'pr-perto-topo' }, CE.el('span', { class: 'pr-rosto', 'aria-hidden': 'true' }, L.emoji), CE.el('div', {}, CE.el('strong', {}, L.nome), CE.el('span', { class: 'pr-suave' }, info.texto || ''))),
            CE.el('button', { class: 'botao', type: 'button', 'data-acao': 'ver-lugar', onclick: () => interagir(a) }, L.id === 'mesa-velha' ? 'Jogar' : L.telhado ? 'Entrar' : 'Ver'));
        }
      }
      function chegarPerto(alvo) {
        if (bloqueado()) return;
        if (!perto) mudarZoom(true);
        if (distancia(alvo, eu) < 1.6) return interagir(alvo.el.classList.contains('morador') || alvo.el.classList.contains('golpista') ? { morador: alvo } : { pessoa: alvo });
        const [x, y] = M.maisPerto(alvo.x, alvo.y);
        const metas = M.vizinhos(Math.round(alvo.x), Math.round(alvo.y));
        irPara(metas.length ? metas : [[x, y]], () => {
          if (distancia(alvo, eu) < 1.9) interagir(outros.get(alvo.id) === alvo ? { pessoa: alvo } : { morador: alvo });
        });
      }
      function chegarAoLugar(L) {
        if (bloqueado()) return;
        irPara(L.entradas, () => abrirLugar(L));
      }

      // ---------- Clique e teclado ----------
      mapa.addEventListener('click', (e) => {
        if (bloqueado() || e.target.closest('.pr-dialogo, .pr-fechada, .pr-botao-mapa, .pr-megafone')) return;
        const pessoaEl = e.target.closest('.pr-p');
        if (pessoaEl && pessoaEl.dataset.pessoa !== usuario.id) {
          const alvo = porMorador[pessoaEl.dataset.pessoa] || outros.get(pessoaEl.dataset.pessoa);
          if (alvo) return chegarPerto(alvo);
        }
        const r = mapa.getBoundingClientRect();
        const x = Math.floor((e.clientX - r.left - cam.x) / cam.s / T), y = Math.floor((e.clientY - r.top - cam.y) / cam.s / T);
        if (x < 0 || y < 0 || x >= W || y >= H) return;
        const L = M.dono[y][x] && M.porLugar[M.dono[y][x]];
        if (L) { if (!perto) { for (const rt of Object.values(rotuloDe)) rt.classList.remove('destaque'); if (rotuloDe[L.id]) rotuloDe[L.id].classList.add('destaque'); } return chegarAoLugar(L); }
        if (M.andavel(x, y)) irPara([[x, y]]);
        else { const v = M.vizinhos(x, y); if (v.length) irPara(v); }
      });
      const SETAS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      const teclaDesce = (e) => {
        if (!janela.estaAtiva || !janela.estaAtiva()) { if (!mapa.contains(document.activeElement) && document.activeElement !== mapa) return; }
        if (e.key === 'Escape' && !dialogo.hidden) { fecharDialogo(); return; }
        if (e.target.closest('input, textarea, select') || !dialogo.hidden || bloqueado()) return;
        if (!mapa.contains(document.activeElement) && document.activeElement !== mapa) return;
        if (SETAS[e.key]) { e.preventDefault(); seta = SETAS[e.key]; eu.aoChegar = null; if (eu.caminho.length > 1) eu.caminho.length = 1; return; }
        if (e.key === 'Enter' || e.key === 'e' || e.key === 'E') { const a = oQueEstaPerto(); if (a) { e.preventDefault(); interagir(a); } }
      };
      const teclaSobe = (e) => { if (SETAS[e.key] && seta === SETAS[e.key]) seta = null; };
      document.addEventListener('keydown', teclaDesce);
      document.addEventListener('keyup', teclaSobe);
      mapa.addEventListener('blur', () => { seta = null; });
      const aoRedimensionar = new ResizeObserver(() => enquadrar());
      aoRedimensionar.observe(mapa);

      // ---------- Laço ----------
      let antes = performance.now(), ultimoPerto = 0, ultimaSincronia = 0, quadroId = 0;
      function quadro(agora) {
        if (fechouJanela) return;
        const dt = Math.min(0.05, (agora - antes) / 1000); antes = agora;
        if (!bloqueado()) mover(dt);
        moverOutros(dt);
        if (perto) enquadrar();
        if (agora - ultimoPerto > 200) { ultimoPerto = agora; verPerto(); }
        const minimizada = janela.elemento ? janela.elemento.classList.contains('minimizada') : corpo.closest('.janela') && corpo.closest('.janela').classList.contains('minimizada');
        if (agora - ultimaSincronia > (minimizada ? SINCRONIA_LONGE : SINCRONIA)) { ultimaSincronia = agora; sincronizar(); }
        quadroId = requestAnimationFrame(quadro);
      }
      sistema('Você chegou na Praça Escola. Clique no chão para andar e chegue perto das pessoas para conversar.');
      verPerto(true);
      enquadrar();
      sincronizar();
      quadroId = requestAnimationFrame(quadro);

      return {
        receber() { mudarZoom(true); },
        aoFechar() {
          fechouJanela = true;
          cancelAnimationFrame(quadroId);
          aoRedimensionar.disconnect();
          document.removeEventListener('keydown', teclaDesce);
          document.removeEventListener('keyup', teclaSobe);
          CE.api.chamar('praca:sair').catch(() => {});
          return true;
        },
      };
    },
  });
})();
