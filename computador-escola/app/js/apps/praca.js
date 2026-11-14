// Praça Escola: o encontro virtual da turma pela rede da sala. Cada aluno anda com o seu boneco pela cidade,
// conversa com quem está perto, joga na praça e entra nos prédios, que levam às partes do curso. O instrutor
// abre e fecha a praça, fala no megafone e chama todos para perto da fonte.
// A cidade cresce com a turma: começa só com a praça e a escola, e cada prédio acende quando metade da turma
// conclui o módulo ligado a ele (praca-mapa.js: CIDADE). Cada aluno tem a sua casa na Rua da Turma, que fica
// pronta no primeiro módulo e ganha um enfeite por nível ou curso concluído.
// Tela limpa: o mapa ocupa a janela toda e o resto só aparece por cima dele quando importa.
// Eventos urgentes: o instrutor dispara uma emergência (incêndio, rio transbordando, chuva forte) e a turma ajuda junta.
// Moedas: o que o aluno faz aqui (tarefa do dia, pistas, final da novela, eventos) também paga moedas (carteira.js).
// Eventos especiais: a turma junta moedas numa vaquinha e o Professor Virtual conduz o evento (festa, caça ao tesouro,
// bingo, treino de brigada). Hora da Praça: 15 minutos antes de a aula acabar, todo mundo é chamado para a praça.
// As regras ficam em app/js/praca-regras.js (o computador do instrutor guarda tudo) e o mapa em app/js/praca-mapa.js.
window.CE = window.CE || {};

(function () {
  const M = CE.pracaMapa;
  const NOV = CE.pracaNovela;
  const { T, W, H } = M;
  const SINCRONIA = 450;        // conversa com o computador do instrutor duas vezes por segundo
  const SINCRONIA_LONGE = 2000; // janela minimizada: devagar, só para continuar na praça
  const RAIO = 7;               // no registro da conversa entra o que foi dito a até 7 quadrinhos
  const VELOCIDADE = 5;         // quadrinhos por segundo do próprio boneco
  const AVISO = 6500;           // quanto tempo um aviso fica no alto do mapa
  const sortear = (l) => l[Math.floor(Math.random() * l.length)];
  const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const navegar = (url) => () => CE.janelas.abrir('navegador', { url });
  const arred = (v) => Math.round(v * 100) / 100;
  const NA_CIDADE = Object.fromEntries(M.CIDADE.map((c) => [c.lugar, c]));
  const nomeDoLugar = (id) => (id === 'rio' ? 'Cais do Rio Madeira' : (M.porLugar[id] || {}).nome || id);
  const comArtigo = (id) => `${(M.CIDADE.find((c) => c.lugar === id) || { artigo: 'o' }).artigo} ${nomeDoLugar(id)}`;
  const RUA = ['casa-ana', 'casa-bruno'];

  // O que tem em cada lugar e para onde o botão leva.
  const LUGAR = {
    escola: { texto: 'A escola da cidade, com a biblioteca. Daqui saem as aulas do curso.', botao: 'Entrar nas Aulas', abrir: () => CE.janelas.abrir('aulas') },
    'casa-ana': { texto: 'Uma casa da Rua da Turma: cada aluno tem a sua.' },
    'casa-bruno': { texto: 'Uma casa da Rua da Turma: cada aluno tem a sua.' },
    'sua-casa': { texto: 'A sua casa na Rua da Turma, com as medalhas que você ganhou na parede.' },
    empregos: { texto: 'Vagas de emprego de treino, currículo e entrevista.', botao: 'Ver as vagas (Emprega Já)', abrir: navegar('https://empregaja.com.br') },
    lote: { texto: 'Terreno da turma. Todos votam no que construir aqui; as moedas vêm das aulas concluídas.' },
    banco: { texto: 'O banco de treino: Pix, boleto, cartão e empréstimo, sem dinheiro de verdade.', botao: 'Entrar no Banco Escola', abrir: navegar('https://bancoescola.com.br') },
    correios: { texto: 'Mande uma carta para um colega: ela chega no E-mail dele.', botao: 'Escrever uma carta (E-mail)', abrir: () => CE.janelas.abrir('email') },
    prefeitura: { texto: 'Serviços públicos de treino: CPF, Carteira de Trabalho, documentos e assinatura.', botao: 'Entrar no Cidadão Digital', abrir: navegar('https://cidadaodigital.org.br') },
    posto: { texto: 'Agendar consulta, ver a carteira de vacinação e aprender a reconhecer mensagem falsa de saúde.' },
    feira: { texto: 'Barracas com açaí, farinha d’água, tucumã e castanha.', botao: 'Vender pela internet (Feira Online)', abrir: navegar('https://feiraonline.com.br') },
    horta: { texto: 'A horta da turma: foi o primeiro lugar que a turma acendeu, com o módulo Conhecendo o computador.' },
    estacao: { texto: 'A estação da estrada de ferro que ligava Porto Velho a Guajará-Mirim.', botao: 'Digitar textos da nossa terra', abrir: () => CE.janelas.abrir('digitacao') },
    rio: { texto: 'O cais do Rio Madeira, com o Seu Bené pescando. Aqui tem a pescaria de palavras: o peixe só fica com quem digita o nome certinho.' },
    coreto: { texto: 'O palco da praça: aqui sai a novela da cidade, e daqui o instrutor conduz a gincana e a corrida de digitação.' },
    fonte: { texto: 'O ponto de encontro da turma. Quando o instrutor chama todos, a turma se junta aqui.' },
    'mesa-velha': { texto: 'Mesa do jogo da velha: dois colegas jogam, cada um no seu computador.' },
    'mesa-domino': { texto: 'Mesa de dominó.', embreve: 'Em breve: dominó para até 4 colegas, cada um no seu computador.' },
    mural: { texto: 'Recados da turma, guardados no computador do instrutor.' },
    lixeira: { texto: 'A lata de lixo da praça. Lixo no lixo deixa a praça bonita!' },
  };
  const EMERG = NOV.EMERGENCIAS;
  const ESP = NOV.ESPECIAIS;
  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
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
  // Cada tarefa do dia feita conta para a medalha 🧰 Mão na massa (10 tarefas).
  async function contarTarefa() {
    if (!CE.sessao.usuario) return;
    let total = 0;
    await CE.sessao.atualizarProgresso((p) => { p.praca = p.praca || {}; p.praca.tarefas = total = (Number(p.praca.tarefas) || 0) + 1; }).catch(() => {});
    if (total >= 10) CE.emitir('praca:conquista', { id: 'tarefas' });
  }

  // ================= A cidade cresce com a turma =================
  // No login e a cada aula concluída, o computador do aluno conta ao do instrutor quais módulos ele já terminou
  // (só os que acendem prédios ou enfeitam a casa). Quem não está com a praça aberta recebe um aviso quando a
  // turma acende um prédio novo.
  let pracaNaTela = false;
  let acesosAvisados = null; // { usuario, lista }
  CE.praca = {
    modulosConcluidos(progresso) {
      return M.MODULOS_DA_CIDADE.filter((id) => {
        const aulas = CE.curso.aulasDaTrilha(progresso, { modulo: id });
        return aulas.length > 0 && aulas.every((l) => CE.curso.aprovada(l, progresso));
      });
    },
    async informar() {
      const u = CE.sessao.usuario;
      if (!u || u.papel === 'instrutor' || !CE.curso) return null;
      try {
        await CE.curso.trilhaPronta();
        const progresso = await CE.sessao.progresso();
        const r = await CE.api.chamar('praca:modulos', CE.praca.modulosConcluidos(progresso));
        if (!r || !Array.isArray(r.lugares) || CE.sessao.usuario !== u) return r;
        const acesos = r.lugares.filter((l) => l.aberto).map((l) => l.lugar);
        if (acesosAvisados && acesosAvisados.usuario === u.id && !pracaNaTela) {
          for (const l of acesos.filter((x) => !acesosAvisados.lista.includes(x))) CE.avisar(`🎉 A turma acendeu ${comArtigo(l)} na Praça Escola!`);
        }
        acesosAvisados = { usuario: u.id, lista: acesos };
        return r;
      } catch { return null; }
    },
  };
  CE.ouvir('licao:concluida', () => { CE.praca.informar(); });

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
    // Poste de luz (na calçada da praça, perto da lata de lixo)
    {
      const cx = M.POSTE[0] * T + T / 2, cy = M.POSTE[1] * T + T / 2;
      g.fillStyle = 'rgba(0, 0, 0, .22)'; g.beginPath(); g.ellipse(cx + 4, cy + 6, 9, 5, 0, 0, Math.PI * 2); g.fill();
      circulo(cx, cy, 7, '#5B6168'); circulo(cx, cy, 4, '#8A9199');
      g.strokeStyle = '#5B6168'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - 11, cy - 9); g.stroke();
      circulo(cx - 12, cy - 10, 6, '#F6E27A'); circulo(cx - 12, cy - 10, 2.5, '#FFFBE0');
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
      document.querySelectorAll('.praca-convite').forEach((d) => d.remove()); // já está na praça: o convite não faz mais sentido
      const usuario = CE.sessao.usuario;
      const souInstrutor = usuario.papel === 'instrutor';
      pracaNaTela = true;

      // ---------- Montagem da tela: o mapa ocupa tudo; o resto aparece por cima, só quando importa ----------
      const tela = CE.el('canvas', { 'aria-hidden': 'true' });
      const camadaObjetos = CE.el('div', { class: 'pr-camada', 'aria-hidden': 'true' });
      const camadaRotulos = CE.el('div', { class: 'pr-camada', 'aria-hidden': 'true' });
      const camadaGente = CE.el('div', { class: 'pr-camada' });
      const mundo = CE.el('div', { class: 'pr-mundo' }, tela, camadaObjetos, camadaRotulos, camadaGente);

      // No alto, à esquerda: quantos estão na praça (tocando, aparecem os rostos) e como está a cidade.
      const botaoGente = CE.el('button', { class: 'pr-pilula', type: 'button', 'data-acao': 'gente', 'aria-expanded': 'false', title: 'Quem está na praça agora' }, '👥 1 aqui');
      const botaoCidade = CE.el('button', { class: 'pr-pilula', type: 'button', 'data-acao': 'cidade', title: 'Como está a cidade da turma' }, `🏙️ Cidade 0/${M.CIDADE.length}`);
      const botaoNovela = CE.el('button', { class: 'pr-pilula novela', type: 'button', 'data-acao': 'novela', title: 'A novela da cidade: as pistas e o final' }, '🔎 Novela');
      botaoNovela.hidden = true;
      const botaoMoedas = CE.el('button', { class: 'pr-pilula moedas', type: 'button', 'data-acao': 'moedas', title: 'Minhas moedas e os eventos especiais da turma' }, '💰 0');
      botaoMoedas.hidden = souInstrutor;
      const botaoHora = CE.el('button', { class: 'pr-pilula hora', type: 'button', 'data-acao': 'hora', title: 'Hora da Praça: quanto falta para a aula acabar' }, '⏰');
      botaoHora.hidden = true;
      const listaGente = CE.el('ul', { class: 'pr-gente' });
      const popGente = CE.el('div', { class: 'pr-pop gente', role: 'dialog', 'aria-label': 'Quem está na praça agora' }, CE.el('h3', {}, 'Na praça agora'), listaGente);
      popGente.hidden = true;
      const topoEsq = CE.el('div', { class: 'pr-hud pr-topo-esq' }, botaoGente, botaoCidade, botaoNovela, botaoMoedas, botaoHora, popGente);

      // No alto, à direita: ver a cidade inteira e, para o instrutor, quatro botões pequenos.
      const mapaIcone = CE.el('span', { 'aria-hidden': 'true' }, '🗺️');
      const mapaTexto = CE.el('span', { class: 'txt' }, ' Ver a cidade inteira');
      const botaoMapa = CE.el('button', { class: 'pr-pilula escura', type: 'button', 'data-acao': 'cidade-inteira', 'aria-label': 'Ver a cidade inteira' }, mapaIcone, mapaTexto);
      const comando = (id, icone, rotulo, onclick) => CE.el('button', { class: 'pr-comando', type: 'button', 'data-acao': id, 'aria-label': rotulo, onclick },
        CE.el('span', { class: 'icone', 'aria-hidden': 'true' }, icone), CE.el('span', { class: 'rotulo', 'aria-hidden': 'true' }, rotulo));
      const campoMegafone = CE.el('input', { id: 'pr-campo-megafone', maxlength: '120', autocomplete: 'off', placeholder: 'Ex.: Bingo em 5 minutos!', 'aria-label': 'Recado do megafone' });
      const popMegafone = CE.el('form', { class: 'pr-pop megafone', onsubmit: (e) => {
        e.preventDefault();
        const t = campoMegafone.value.trim();
        if (!t) return;
        campoMegafone.value = '';
        abrirMegafone(false);
        chamar('praca:megafone', t).then(sincronizar);
      } }, CE.el('h3', {}, '📣 Megafone'), CE.el('p', { class: 'pr-suave' }, 'Todo mundo na praça vê e ouve o recado.'),
      CE.el('div', { class: 'pr-digitar' }, campoMegafone, CE.el('button', { class: 'botao', type: 'submit' }, 'Falar')));
      popMegafone.hidden = true;
      const btMegafone = comando('megafone', '📣', 'Megafone', () => abrirMegafone(popMegafone.hidden));
      btMegafone.setAttribute('aria-expanded', 'false');
      const btChamar = comando('chamar-todos', '⛲', 'Chamar todos para a fonte', () => chamar('praca:chamar').then(sincronizar));
      const btAbrir = comando('abrir-fechar', '🔒', 'Fechar a praça', () => chamar('praca:configurar', { aberta: !estado.aberta }).then(sincronizar));
      const btFrases = comando('so-frases', '🔤', 'Só frases prontas', () => chamar('praca:configurar', { soFrases: !estado.soFrases }).then(sincronizar));
      btFrases.setAttribute('aria-pressed', 'false');
      // 🚨 Evento urgente: o instrutor escolhe a emergência e a turma inteira ajuda junta.
      const popEmerg = CE.el('div', { class: 'pr-pop emergencia', role: 'dialog', 'aria-label': 'Evento urgente' });
      popEmerg.hidden = true;
      const btEmerg = comando('emergencia', '🚨', 'Evento urgente', () => abrirPopEmerg(popEmerg.hidden));
      btEmerg.setAttribute('aria-expanded', 'false');
      // ⏰ O horário das aulas: 15 minutos antes de cada uma acabar, o Professor Virtual chama todo mundo para a praça.
      const popHora = CE.el('div', { class: 'pr-pop horario', role: 'dialog', 'aria-label': 'Hora da Praça' });
      popHora.hidden = true;
      const btHora = comando('horario', '⏰', 'Hora da Praça (horário das aulas)', () => abrirPopHora(popHora.hidden));
      btHora.setAttribute('aria-expanded', 'false');
      const comandos = souInstrutor ? CE.el('div', { class: 'pr-comandos', 'data-pr': 'instrutor' }, btMegafone, btChamar, btAbrir, btFrases, btEmerg, btHora, popMegafone, popEmerg, popHora) : null;
      const topoDir = CE.el('div', { class: 'pr-hud pr-topo-dir' }, botaoMapa, comandos);

      // No meio, no alto: o megafone e os avisos da praça (somem sozinhos).
      const megafoneEl = CE.el('div', { class: 'pr-megafone', role: 'status' }); megafoneEl.hidden = true;
      const avisos = CE.el('ol', { class: 'pr-avisos', 'aria-live': 'polite' });
      // O alarme do evento urgente: o que aconteceu, o relógio, o perigo e como ajudar.
      const emergEl = CE.el('div', { class: 'pr-emerg', role: 'status', 'aria-live': 'polite' }); emergEl.hidden = true;
      // O evento especial (conduzido pelo Professor Virtual): o que é, o relógio e o placar.
      const especialEl = CE.el('div', { class: 'pr-especial', role: 'status', 'aria-live': 'polite' }); especialEl.hidden = true;
      const centro = CE.el('div', { class: 'pr-centro' }, emergEl, especialEl, megafoneEl, avisos);
      const fogosEl = CE.el('div', { class: 'pr-fogos', 'aria-hidden': 'true' }, ...['🎆', '🎇', '✨', '🎆', '🎇', '✨', '🎆', '🎇'].map((f, k) => CE.el('span', { style: `left:${8 + k * 11.5}%;top:${12 + ((k * 37) % 50)}%;animation-delay:${(k * 0.37).toFixed(2)}s` }, f)));
      fogosEl.hidden = true;
      // A cartela do bingo (cada um marca os números que o Professor Virtual sorteia).
      const bingoEl = CE.el('div', { class: 'pr-bingo', role: 'region', 'aria-label': 'Cartela do bingo' }); bingoEl.hidden = true;
      const chuvaEl = CE.el('div', { class: 'pr-chuva', 'aria-hidden': 'true' }); chuvaEl.hidden = true;
      const avisoRede = CE.el('div', { class: 'pr-aviso-rede', role: 'status' }); avisoRede.hidden = true;

      // Embaixo, à esquerda: a conversa (fechada; a fala aparece no balão) e os gestos.
      const log = CE.el('ol', { class: 'pr-log' });
      const campoConversa = CE.el('input', { id: 'pr-campo-conversa', maxlength: '80', autocomplete: 'off', placeholder: 'Escreva para quem está perto', 'aria-label': 'Mensagem para quem está perto' });
      const formConversa = CE.el('form', { class: 'pr-digitar' }, campoConversa, CE.el('button', { class: 'botao', type: 'submit' }, 'Enviar'));
      const notaConversa = CE.el('p', { class: 'pr-nota' }); notaConversa.hidden = true;
      const frases = CE.el('div', { class: 'pr-frases', 'aria-label': 'Frases prontas' },
        CE.pracaRegras.FRASES.map((f) => CE.el('button', { class: 'pr-chip', type: 'button', 'data-frase': f, onclick: () => falar(f) }, f)));
      const chat = CE.el('div', { class: 'pr-chat', role: 'dialog', 'aria-label': 'Conversa' },
        CE.el('div', { class: 'pr-chat-topo' }, CE.el('strong', {}, '💬 Conversa'), CE.el('span', { class: 'pr-suave' }, 'Só o que foi dito perto de você'),
          CE.el('button', { class: 'pr-x', type: 'button', 'aria-label': 'Fechar a conversa', onclick: () => abrirConversa(false) }, '×')),
        log, frases, formConversa, notaConversa);
      chat.hidden = true;
      const naoLidas = CE.el('span', { class: 'pr-nao-lidas', 'aria-hidden': 'true' }); naoLidas.hidden = true;
      const botaoConversa = CE.el('button', { class: 'pr-redondo', type: 'button', 'data-acao': 'conversa', 'aria-expanded': 'false', 'aria-label': 'Conversa: histórico, frases prontas e escrever', title: 'Conversa' },
        CE.el('span', { 'aria-hidden': 'true' }, '💬'), naoLidas);
      const botaoMao = CE.el('button', { class: 'pr-gesto pr-redondo', type: 'button', 'data-gesto': 'ajuda', title: 'Pedir ajuda (levantar a mão)', 'aria-label': 'Pedir ajuda' }, '🙋');
      const baixo = CE.el('div', { class: 'pr-hud pr-baixo' }, botaoConversa,
        CE.el('button', { class: 'pr-gesto pr-redondo', type: 'button', 'data-gesto': 'acenar', title: 'Acenar', 'aria-label': 'Acenar', onclick: () => gesto('acenar') }, '👋'),
        CE.el('button', { class: 'pr-gesto pr-redondo', type: 'button', 'data-gesto': 'aplaudir', title: 'Aplaudir', 'aria-label': 'Aplaudir', onclick: () => gesto('aplaudir') }, '👏'),
        botaoMao);

      // O que dá para fazer aqui: aparece em cima do boneco quando ele chega perto de alguém, de uma mesa ou de uma porta.
      const acao = CE.el('button', { class: 'pr-acao', type: 'button', 'data-acao': 'interagir' }); acao.hidden = true;
      const dica = CE.el('div', { class: 'pr-dica' }, 'Clique no chão para andar · setas do teclado · Enter conversa');
      const dialogo = CE.el('div', { class: 'pr-dialogo', role: 'dialog', 'aria-labelledby': 'pr-dialogo-titulo' }); dialogo.hidden = true;
      const fechadaEl = CE.el('div', { class: 'pr-fechada' },
        CE.el('div', { class: 'pr-fechada-cartao' }, CE.el('span', { style: 'font-size: 34px', 'aria-hidden': 'true' }, '🔒'),
          CE.el('h3', {}, 'A praça está fechada agora'), CE.el('p', {}, 'O instrutor abre no recreio, no fim da aula.')));
      fechadaEl.hidden = true;
      // O final do capítulo da novela, revelado pelo instrutor no coreto: aparece para todos ao mesmo tempo.
      const finalEl = CE.el('div', { class: 'pr-final', role: 'dialog', 'aria-label': 'O final do capítulo' }); finalEl.hidden = true;
      const mapa = CE.el('div', { class: 'pr-mapa', tabindex: '0', 'aria-label': 'Mapa da Praça Escola. Clique no chão para andar ou use as setas do teclado; Enter conversa com quem está perto.' },
        mundo, chuvaEl, fogosEl, acao, topoEsq, topoDir, centro, avisoRede, chat, baixo, bingoEl, dica, dialogo, finalEl, fechadaEl);
      // Clique nos botões e janelinhas não é clique no chão (um botão que redesenha a janelinha some antes de o
      // clique chegar ao mapa, e aí o boneco sairia andando).
      for (const camada of [topoEsq, topoDir, centro, avisoRede, chat, baixo, bingoEl, acao, dialogo, finalEl, fechadaEl]) camada.addEventListener('click', (e) => e.stopPropagation());
      corpo.replaceChildren(CE.el('div', { class: 'pr-caixa' }, mapa));
      desenharCidade(tela);

      // ---------- Rótulos e objetos do mapa ----------
      const rotuloDe = {};
      const rotulo = (texto, x, y, classe) => { const r = CE.el('div', { class: 'pr-rotulo' + (classe ? ' ' + classe : ''), style: `left:${x}px;top:${y}px` }, texto); camadaRotulos.append(r); return r; };
      const nomeNoRotulo = (L) => (L.id === 'rio' ? 'Rio Madeira' : L.casa ? (L.id === 'sua-casa' && !souInstrutor ? 'Sua casa' : 'Casa') : L.nome);
      for (const L of M.LUGARES) {
        const [x, y, w, h] = L.r;
        const pos = { feira: [5.5 * T, 24.6 * T], rio: [18 * T, 28.5 * T], lote: [33 * T, 1.3 * T] }[L.id]
          || [(x + w / 2) * T, L.telhado ? y * T + (h * T - Math.round(T * 1.1)) / 2 : (y + h / 2) * T];
        rotuloDe[L.id] = rotulo(`${L.emoji} ${nomeNoRotulo(L)}`, pos[0], pos[1], L.casa ? 'pequeno' : '');
      }
      rotuloDe.praca = rotulo('⛲ Praça da Turma', 18 * T, 7.5 * T);
      rotuloDe['mesa-velha'] = rotulo('❌ Jogo da velha', 14.5 * T, 12.9 * T, 'pequeno so-perto');
      rotuloDe['mesa-domino'] = rotulo('🎲 Dominó', 21.5 * T, 12.9 * T, 'pequeno so-perto');
      rotuloDe.mural = rotulo('📌 Mural de recados', 22 * T, 8.1 * T, 'pequeno so-perto');
      rotuloDe.coreto = rotulo('🎭 Coreto', 18 * T, 11.4 * T, 'pequeno so-perto');
      rotulo('Cais', 32 * T, 26.5 * T, 'pequeno so-perto');
      rotulo('RUA DA TURMA', 4 * T, 6 * T, 'rua'); rotulo('RUA DA ESCOLA', 31 * T, 6 * T, 'rua'); rotulo('AVENIDA DO RIO', 5 * T, 20 * T, 'rua');
      const objeto = (txt, x, y, classe) => { const o = CE.el('div', { class: 'pr-obj' + (classe ? ' ' + classe : ''), style: `left:${x}px;top:${y}px` }, txt); camadaObjetos.append(o); return o; };
      objeto('⛵', 27.5 * T, 28.3 * T, 'barco'); objeto('🛶', 8.5 * T, 28 * T, 'barco');
      const enfeiteDe = { estacao: [objeto('🚂🚃🚃', 21.7 * T, 25.45 * T, 'trem')], rio: [objeto('🎣', 33.1 * T, 28.2 * T)] };
      objeto('🚧', 32.8 * T, 2.7 * T);
      objeto('🗑️', 22.5 * T, 15.45 * T, 'lixeira');

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
      // Moradores (iguais em todos os computadores). Os que trabalham num prédio só aparecem com ele aceso.
      const moradores = M.MORADORES.map((m) => boneco({ ...m, caminho: [] }, m.id === 'oferta' ? 'golpista' : 'morador'));
      const professorEl = boneco({ id: 'professor-virtual', nome: 'Professor Virtual', emoji: '👨‍🏫', x: 18, y: 11.1, caminho: [] }, 'professor fora');
      const porMorador = Object.fromEntries(moradores.map((m) => [m.id, m]));
      const presente = (m) => !m.el.classList.contains('sumiu') && !m.el.classList.contains('fora');
      // Os outros: vêm do computador do instrutor
      const outros = new Map();

      // ---------- Câmera ----------
      let perto = true;
      const cam = { x: 0, y: 0, s: 1 };
      function enquadrar() {
        const cw = mapa.clientWidth, ch = mapa.clientHeight;
        if (!cw || !ch) return;
        const MW = W * T, MH = H * T;
        if (!perto) {
          // A cidade inteira cabe entre os botões de cima e os de baixo (nada fica escondido atrás deles) e, num
          // evento, abaixo do alarme (a parte de cima da cidade, com o Lote da turma, não fica escondida).
          const topoMapa = mapa.getBoundingClientRect().top;
          const faixa = [emergEl, especialEl].filter((el) => !el.hidden).reduce((m, el) => Math.max(m, el.getBoundingClientRect().bottom - topoMapa + 8), 0);
          const cima = Math.max(Math.min(58, ch * 0.1), Math.min(faixa, ch * 0.45)), baixo = Math.min(62, ch * 0.1), livre = Math.max(80, ch - cima - baixo);
          cam.s = Math.min(cw / MW, livre / MH); cam.x = (cw - MW * cam.s) / 2; cam.y = cima + (livre - MH * cam.s) / 2;
        }
        else {
          cam.s = Math.max(0.7, Math.min(1.15, Math.min(cw / (15 * T), ch / (11 * T))));
          const px = (eu.x + 0.5) * T * cam.s, py = (eu.y + 0.5) * T * cam.s;
          cam.x = MW * cam.s <= cw ? (cw - MW * cam.s) / 2 : Math.min(0, Math.max(cw - MW * cam.s, cw / 2 - px));
          cam.y = MH * cam.s <= ch ? (ch - MH * cam.s) / 2 : Math.min(0, Math.max(ch - MH * cam.s, ch / 2 - py));
        }
        mundo.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})`;
        mundo.style.setProperty('--inv', String(1 / cam.s));
      }
      let andouUmaVez = false;
      function mostrarDica() {
        dica.textContent = perto ? 'Clique no chão para andar · setas do teclado · Enter conversa' : 'Clique num prédio para ir até ele.';
        dica.hidden = perto && andouUmaVez;
      }
      function mudarZoom(paraPerto) {
        perto = paraPerto;
        mapa.classList.toggle('longe', !perto);
        mapaIcone.textContent = perto ? '🗺️' : '🔍';
        mapaTexto.textContent = perto ? ' Ver a cidade inteira' : ' Voltar para perto';
        botaoMapa.setAttribute('aria-label', mapaTexto.textContent.trim());
        mostrarDica();
        mundo.classList.add('suave'); setTimeout(() => mundo.classList.remove('suave'), 520);
        enquadrar();
      }
      botaoMapa.addEventListener('click', () => mudarZoom(!perto));

      // ---------- Andar ----------
      let seta = null;
      function irPara(metas, aoChegar) {
        const de = M.maisPerto(eu.x, eu.y);
        const c = M.caminho(de, metas);
        if (c == null) { CE.avisar('Por ali não dá para passar.'); return false; }
        eu.caminho = c; eu.aoChegar = aoChegar || null;
        if (c.length && !andouUmaVez) { andouUmaVez = true; mostrarDica(); }
        if (!c.length && aoChegar) { eu.aoChegar = null; aoChegar(); }
        return true;
      }
      function mover(dt) {
        if (!eu.caminho.length && seta && !bloqueado()) {
          const [x, y] = M.maisPerto(eu.x, eu.y), nx = x + seta[0], ny = y + seta[1];
          if (M.andavel(nx, ny)) { eu.caminho.push([nx, ny]); if (!andouUmaVez) { andouUmaVez = true; mostrarDica(); } }
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
      let mesa = null, votacao = null;
      const conversa = [];
      let semLer = 0;
      function registrar(item, conta) {
        conversa.push(item); if (conversa.length > 40) conversa.shift();
        log.replaceChildren(...conversa.map((c) => CE.el('li', { class: c.classe || '' }, c.quem ? CE.el('strong', {}, `${c.emoji || ''} ${c.quem}: `) : null, c.texto)));
        log.scrollTop = log.scrollHeight;
        if (conta && chat.hidden) { semLer++; naoLidas.textContent = semLer > 9 ? '9+' : String(semLer); naoLidas.hidden = false; }
      }
      const sistema = (texto) => registrar({ classe: 'sistema', texto });
      const bloqueado = () => !estado.aberta && !souInstrutor;
      // Os avisos do alto do mapa: no máximo três, e cada um some sozinho.
      function avisarNoMapa(texto, classe) {
        const item = CE.el('li', { class: classe || '' }, texto);
        avisos.append(item);
        while (avisos.children.length > 3) avisos.firstElementChild.remove();
        setTimeout(() => { item.classList.add('saindo'); setTimeout(() => item.remove(), 600); }, AVISO);
      }

      // ---------- A cidade da turma: prédios em obra, acesos e a casa de cada um ----------
      let turmaEscolhida;            // o instrutor pode olhar a cidade de outra turma
      let turmaDaCidade = null, acesos = null, minhaCasa = null, infoCidade = null, abaCidade = 'predios';
      const aceso = (id) => !!acesos && acesos.has(id);
      let selos = new Set();
      function atualizarRotulo(id) {
        const L = M.porLugar[id], r = rotuloDe[id];
        if (!L || !r || L.casa || id === 'lote') return;
        const ligado = !NA_CIDADE[id] || aceso(id);
        r.textContent = `${ligado ? L.emoji : '🚧'} ${nomeNoRotulo(L)}${selos.has(id) ? ' ⭐' : ''}`;
        r.classList.toggle('obra', !ligado);
      }
      const obras = {};
      function obra(id, sim, animar) {
        const L = M.porLugar[id];
        if (sim && !obras[id]) {
          const [x, y, w, h] = L.r;
          obras[id] = CE.el('div', { class: 'pr-obra', 'data-obra': id, style: `left:${x * T}px;top:${y * T}px;width:${w * T}px;height:${h * T}px` },
            CE.el('span', { class: 'placa' }, '🏗️'));
          camadaObjetos.append(obras[id]);
        } else if (!sim && obras[id]) {
          const o = obras[id];
          delete obras[id];
          if (animar) { o.classList.add('abrindo'); setTimeout(() => o.remove(), 1000); } else o.remove();
        }
      }
      function mostrarPredio(id, ligado, animar) {
        const L = M.porLugar[id];
        obra(id, !ligado, animar);
        atualizarRotulo(id);
        for (const m of moradores) if (m.lugar === id) m.el.classList.toggle('fora', !ligado);
        for (const o of enfeiteDe[id] || []) o.hidden = !ligado;
      }
      // Até a primeira resposta do instrutor, a cidade começa pequena (só a praça e a escola).
      for (const c of M.CIDADE) mostrarPredio(c.lugar, false, false);
      function aplicarCidade(c) {
        // A ⭐ dos lugares em que a turma completou o desafio da semana.
        const novosSelos = new Set(c.selos || []);
        if ([...novosSelos].sort().join() !== [...selos].sort().join()) {
          const todos = new Set([...selos, ...novosSelos]);
          selos = novosSelos;
          for (const id of todos) atualizarRotulo(id);
        }
        const lista = new Set(c.abertos || []);
        const mesma = turmaDaCidade === c.turma && !!acesos;
        const novos = mesma ? [...lista].filter((l) => !acesos.has(l)) : [];
        const mudou = !mesma || novos.length || [...acesos].some((l) => !lista.has(l));
        turmaDaCidade = c.turma; acesos = lista;
        if (!mudou) return;
        for (const C of M.CIDADE) mostrarPredio(C.lugar, lista.has(C.lugar), novos.includes(C.lugar));
        botaoCidade.textContent = `🏙️ Cidade ${M.CIDADE.filter((C) => lista.has(C.lugar)).length}/${M.CIDADE.length}`;
        if (novos.length) CE.comemorar('grande');
        if (!dialogo.hidden && dialogo.dataset.tipo === 'cidade') abrirCidade();
        verPerto(true);
      }
      // A casa: terreno até o primeiro módulo; depois, casa com um enfeite por nível ou curso concluído.
      function aplicarCasa(x) {
        if (souInstrutor) return;
        const nova = { casa: !!x.casa, enfeites: x.enfeites || '' };
        const antes = minhaCasa;
        if (antes && antes.casa === nova.casa && antes.enfeites === nova.enfeites) return;
        minhaCasa = nova;
        rotuloDe['sua-casa'].textContent = nova.casa ? `🏠 Sua casa${nova.enfeites ? ' ' + nova.enfeites : ''}` : '🏗️ Seu terreno';
        obra('sua-casa', !nova.casa, !!antes);
        if (antes && !antes.casa && nova.casa) { CE.comemorar('pequena'); avisarNoMapa('🏠 A sua casa ficou pronta na Rua da Turma!', 'cidade'); }
        else if (antes && nova.enfeites.length > antes.enfeites.length) avisarNoMapa('✨ A sua casa ganhou um enfeite novo!', 'cidade');
        verPerto(true);
      }

      // A novela: a pílula com as pistas da turma, a 🔎 em cima dos lugares com pista que eu ainda não achei e a
      // medalha de quem ajudou (também para quem não estava na praça quando o final saiu).
      let novela = null, chaveNovela = '', infoNovela = null, detetiveDado = false;
      const marcas = {};
      function aplicarNovela(n) {
        novela = n;
        const chave = n ? [n.id, n.total, n.meta, n.resolvido, n.revelado, n.faltam.map((p) => p.id).join('.')].join('|') : '';
        if (chave === chaveNovela) return;
        chaveNovela = chave;
        botaoNovela.hidden = !n;
        if (n) botaoNovela.textContent = n.revelado ? '📖 Novela: o final saiu' : n.resolvido ? '🎉 Novela: pistas completas' : `🔎 Novela ${Math.min(n.total, n.meta)}/${n.meta}`;
        const lugares = new Set(n && !n.revelado ? n.faltam.map((p) => p.lugar) : []);
        for (const id of Object.keys(marcas)) if (!lugares.has(id)) { marcas[id].remove(); delete marcas[id]; }
        for (const id of lugares) {
          if (marcas[id] || !rotuloDe[id]) continue;
          const r = rotuloDe[id];
          marcas[id] = CE.el('div', { class: 'pr-marca-pista', 'data-marca': id, style: `left:${r.style.left};top:calc(${r.style.top} - 30px)` }, '🔎');
          camadaRotulos.append(marcas[id]);
        }
        if (n && n.revelado && n.participei && !detetiveDado && !souInstrutor) { detetiveDado = true; conquista('detetive'); CE.carteira.ganhar('final', `Desvendou “${n.titulo}”`, `final:${n.id}:${n.aberto}`); }
        if (!dialogo.hidden && dialogo.dataset.tipo === 'novela') abrirNovela();
        verPerto(true);
      }
      const pistaAqui = (lugar) => (novela && !novela.revelado ? novela.faltam.find((p) => p.lugar === lugar) : null);

      // ---------- Evento urgente ----------
      let emerg = null, chaveEmerg = '', relogioEmerg = 0, chaveBloqueios = '', relampago = null;
      const emergAtiva = () => !!(emerg && emerg.status === 'ativo');
      const defEmerg = () => (emerg ? EMERG[emerg.tipo] : null);
      const visual = {};   // elementos do mapa do evento (marcas de onde pegar e levar, água, sacos, caminhões)
      const focosEl = {};  // incêndio: um elemento por foco de fogo
      const quedasEl = {}; // chuva forte: as árvores caídas (tronco, toco, placa e fio)
      const CENTRO_ZONA = { fonte: [18, 12.2], lixeira: [22.5, 14.4], areia: [18.5, 26.5], barreira: [20.5, 21.5], feira: [5.5, 23.2], estacao: [23.5, 24.6], obra: [32.9, 4.4], caminhao: [15, 18.3] };
      const emNome = (nome) => nome.replace(/^o /, 'no ').replace(/^a /, 'na ').replace(/^os /, 'nos ').replace(/^as /, 'nas ');
      const agoraEmerg = () => (emerg ? emerg.agora + (performance.now() - relogioEmerg) : 0);
      const fontesDoEvento = () => (emerg.tipo === 'rio' ? emerg.fontes || ['obra'] : [defEmerg().levar.pegar]);
      const focosAcesos = () => (emerg && emerg.focos ? emerg.focos.filter((f) => f.forca > 0) : []);
      // O foco de fogo ao alcance do boneco (o que não é o poste vem primeiro).
      function focoPerto(x, y, raio = M.PERTO_DO_FOCO + 0.2) {
        const d = (f) => Math.hypot(f.x - x, f.y - y);
        return focosAcesos().filter((f) => d(f) <= raio).sort((a, b) => (a.eletrico - b.eletrico) || d(a) - d(b))[0] || null;
      }
      const distQueda = (q, x, y) => Math.min(...[...q.tiles, q.arvore].map(([a, b]) => Math.hypot(a - x, b - y)));
      function quedaPerto(x, y, raio = 2.6) {
        return ((emerg && emerg.quedas) || []).filter((q) => distQueda(q, x, y) <= raio).sort((a, b) => (a.avisada - b.avisada) || distQueda(a, x, y) - distQueda(b, x, y))[0] || null;
      }
      function marcaAjuda(zona, emoji, texto) {
        const [x, y] = CENTRO_ZONA[zona];
        return CE.el('div', { class: 'pr-marca-ajuda', 'data-zona': zona, style: `left:${x * T}px;top:${y * T}px` }, CE.el('span', { class: 'ic' }, emoji), CE.el('span', { class: 'txt' }, texto));
      }
      function tirarQueda(id, animar) {
        const q = quedasEl[id];
        if (!q) return;
        delete quedasEl[id];
        q.toco.remove(); q.placa.remove(); if (q.fio) q.fio.remove();
        if (animar) { q.arvore.classList.add('saindo'); setTimeout(() => q.arvore.remove(), 700); } else q.arvore.remove();
      }
      function limparVisual() {
        for (const k of Object.keys(visual)) { visual[k].remove(); delete visual[k]; }
        for (const k of Object.keys(focosEl)) { focosEl[k].remove(); delete focosEl[k]; }
        for (const k of Object.keys(quedasEl)) tirarQueda(k, false);
        if (relampago) { clearInterval(relampago); relampago = null; }
        chuvaEl.hidden = true;
        mapa.classList.remove('emergencia', 'relampago');
        delete mapa.dataset.evento;
      }
      // O mapa muda com o evento (árvore caída, fio no chão, caminhão, água): quem estava ali sai, e o caminho desvia.
      function conferirMeuLugar() {
        if (!M.andavel(Math.round(eu.x), Math.round(eu.y))) {
          [eu.x, eu.y] = M.maisPerto(eu.x, eu.y);
          eu.caminho = []; eu.aoChegar = null;
          posicionar(eu);
          balao(eu, emerg && emerg.tipo === 'rio' ? '🌊 Ufa! Saí da água a tempo.' : '😮 Ufa! Essa foi por pouco.');
          return;
        }
        if (eu.caminho.length && eu.caminho.some(([x, y]) => !M.andavel(x, y))) {
          const c = M.caminho(M.maisPerto(eu.x, eu.y), [eu.caminho[eu.caminho.length - 1]]);
          if (c) eu.caminho = c;
          else { eu.caminho = []; eu.aoChegar = null; balao(eu, 'Por ali fechou! Vou por outro lado.'); }
        }
      }
      function desenharVisual() {
        const e = emerg, d = defEmerg();
        if (!e || e.status !== 'ativo') {
          // A enchente acabou: a água volta devagar para o rio.
          if (visual.agua) { const ag = visual.agua; delete visual.agua; ag.classList.add('baixando'); ag.style.top = `${27 * T}px`; ag.style.height = `${0.3 * T}px`; setTimeout(() => ag.remove(), 1400); }
          limparVisual();
          return;
        }
        mapa.classList.add('emergencia');
        mapa.dataset.evento = e.tipo;
        // Onde pegar a ajuda (e, fora do incêndio, onde levar): plaquinhas no mapa.
        const fontes = fontesDoEvento();
        for (const z of ['fonte', 'areia', 'obra', 'caminhao', 'feira']) {
          const k = 'pegar-' + z, quer = fontes.includes(z);
          const texto = { obra: 'Areia da obra', caminhao: 'Areia da Defesa Civil', areia: 'Areia da praia' }[z] || d.levar.pegarTexto.replace(/^\S+\s/, '');
          if (quer && !visual[k]) { visual[k] = marcaAjuda(z, d.levar.levando, texto); camadaRotulos.append(visual[k]); }
          if (!quer && visual[k]) { visual[k].remove(); delete visual[k]; }
        }
        if (e.tipo !== 'incendio' && !visual.entregar) {
          visual.entregar = marcaAjuda(d.levar.entregar, e.tipo === 'rio' ? '🧱' : '🏠', d.levar.entregarTexto.replace(/^\S+\s/, ''));
          camadaRotulos.append(visual.entregar);
        }
        if (e.tipo === 'incendio') desenharFogo(e);
        if (e.tipo === 'rio') desenharEnchente(e);
        if (e.tipo === 'chuva') desenharTemporal(e);
      }
      // Incêndio: cada foco cresce (ou diminui) com a força; o apagado fica com fumaça e a marca do queimado.
      function desenharFogo(e) {
        const vistos = new Set();
        for (const f of e.focos || []) {
          vistos.add(f.id);
          let el = focosEl[f.id];
          if (!el) {
            el = CE.el('div', { class: 'pr-foco' + (f.eletrico ? ' eletrico' : ''), 'data-foco': f.id, title: f.nome, style: `left:${(f.x + 0.5) * T}px;top:${(f.y + 0.5) * T}px` },
              CE.el('span', { class: 'queimado', 'aria-hidden': 'true' }), CE.el('span', { class: 'chama', 'aria-hidden': 'true' }, '🔥'),
              f.eletrico ? CE.el('span', { class: 'faisca', 'aria-hidden': 'true' }, '⚡') : null, CE.el('span', { class: 'fumaca', 'aria-hidden': 'true' }, '💨'));
            focosEl[f.id] = el;
            camadaObjetos.append(el);
          }
          el.classList.toggle('apagado', f.forca <= 0);
          el.style.setProperty('--forca', String(Math.max(0, Math.min(3, f.forca))));
        }
        for (const id of Object.keys(focosEl)) if (!vistos.has(id)) { focosEl[id].remove(); delete focosEl[id]; }
        // O caminhão dos Bombeiros desce a rua até a praça; chegando, joga água no foco da vez.
        const b = e.bombeiros;
        if (b && !visual.bombeiros) {
          const falta = Math.max(0, b.chega - e.agora);
          visual.bombeiros = CE.el('div', { class: 'pr-veiculo bombeiros', style: `left:${26.5 * T}px;top:${(b.chegou ? 15 : 5.5) * T}px` }, CE.el('span', { 'aria-hidden': 'true' }, '🚒'));
          camadaObjetos.append(visual.bombeiros);
          if (!b.chegou) requestAnimationFrame(() => requestAnimationFrame(() => { if (visual.bombeiros) { visual.bombeiros.style.transition = `top ${falta}ms linear`; visual.bombeiros.style.top = `${15 * T}px`; } }));
        }
        if (visual.bombeiros) visual.bombeiros.classList.toggle('chegou', !!(b && b.chegou));
        const alvo = b && b.chegou && b.alvo ? (e.focos || []).find((f) => f.id === b.alvo && f.forca > 0) : null;
        if (!alvo) { if (visual.jato) { visual.jato.remove(); delete visual.jato; } return; }
        const x0 = 26.5 * T, y0 = 15 * T, x1 = (alvo.x + 0.5) * T, y1 = (alvo.y + 0.5) * T;
        if (!visual.jato) { visual.jato = CE.el('div', { class: 'pr-jato', 'aria-hidden': 'true' }); camadaObjetos.append(visual.jato); }
        visual.jato.style.cssText = `left:${x0}px;top:${y0}px;width:${Math.hypot(x1 - x0, y1 - y0)}px;transform:rotate(${Math.atan2(y1 - y0, x1 - x0)}rad)`;
      }
      // Enchente: a água sobe (e desce) fileira por fileira; os sacos aparecem na barreira; o caminhão vem pela avenida.
      function desenharEnchente(e) {
        if (!visual.agua) {
          visual.agua = CE.el('div', { class: 'pr-enchente', 'aria-hidden': 'true' }, CE.el('span', { class: 'onda' }));
          visual.sacos = CE.el('div', { class: 'pr-sacos', 'aria-hidden': 'true', style: `left:${11 * T}px;top:${21 * T}px;width:${20 * T}px` });
          camadaObjetos.append(visual.agua, visual.sacos);
        }
        const topo = Number.isFinite(e.agua) ? e.agua : 27;
        visual.agua.style.top = `${topo * T}px`;
        visual.agua.style.height = `${(27.3 - topo) * T}px`;
        visual.agua.classList.toggle('passou', topo < 21.5);
        const n = Math.max(0, e.sacos || 0);
        visual.sacos.replaceChildren(...[CE.el('span', { class: 'fileira' }, '🟫'.repeat(Math.min(20, n))),
          n > 20 ? CE.el('span', { class: 'fileira de-cima' }, '🟫'.repeat(Math.min(20, n - 20))) : null].filter(Boolean));
        const c = e.caminhao;
        if (c && !visual.caminhao) {
          const falta = Math.max(0, c.chega - e.agora);
          visual.caminhao = CE.el('div', { class: 'pr-veiculo defesa', style: `left:${(c.chegou ? 15 : -1) * T}px;top:${19.5 * T}px` },
            CE.el('span', { class: 'monte', 'aria-hidden': 'true' }), CE.el('span', { class: 'carro', 'aria-hidden': 'true' }, '🚚'));
          camadaObjetos.append(visual.caminhao);
          if (!c.chegou) requestAnimationFrame(() => requestAnimationFrame(() => { if (visual.caminhao) { visual.caminhao.style.transition = `left ${falta}ms linear`; visual.caminhao.style.left = `${15 * T}px`; } }));
        }
        if (visual.caminhao) visual.caminhao.classList.toggle('chegou', !!(c && c.chegou));
      }
      // Chuva forte: a chuva engrossa, relâmpagos e as árvores caídas (com a placa do aviso e a equipe da Defesa Civil).
      function desenharTemporal(e) {
        chuvaEl.hidden = false;
        chuvaEl.style.opacity = String(0.35 + e.perigo / 160);
        if (!relampago) {
          relampago = setInterval(() => {
            if (!emergAtiva() || emerg.tipo !== 'chuva' || Math.random() > 0.5) return;
            mapa.classList.remove('relampago'); void mapa.offsetWidth; mapa.classList.add('relampago');
          }, 5000);
        }
        const vistas = new Set();
        for (const q of e.quedas || []) {
          vistas.add(q.id);
          if (!quedasEl[q.id]) quedasEl[q.id] = criarArvoreCaida(q);
          const el = quedasEl[q.id];
          el.arvore.classList.toggle('avisada', !!q.avisada);
          el.arvore.classList.toggle('equipe', !!q.equipe);
          el.placa.classList.toggle('avisada', !!q.avisada);
          el.placa.textContent = q.equipe ? '👷 A Defesa Civil está tirando' : q.avisada ? `📞 Defesa Civil avisada${q.por ? ' por ' + q.por : ''}` : '⚠️ Avise a Defesa Civil (199)';
        }
        for (const id of Object.keys(quedasEl)) if (!vistas.has(id)) tirarQueda(id, true);
      }
      function criarArvoreCaida(q) {
        const [ax, ay] = q.arvore, [x2, y2] = q.tiles[1];
        const ang = Math.atan2(y2 - ay, x2 - ax);
        const cx = (ax + x2) / 2 + 0.5, cy = (ay + y2) / 2 + 0.5;
        const chao = q.ipe ? '#7DB050' : ({ grama: '#8DBE5A', areia: '#E9D49F', calcada: '#D9D1C0', terra: '#C47A48', praca: '#ECDFC0' }[M.chao[ay][ax]] || '#8DBE5A');
        const arvore = CE.el('div', { class: 'pr-arvore-caida' + (q.palmeira ? ' palmeira' : ''), 'data-queda': q.id, style: `left:${cx * T}px;top:${cy * T}px;--ang:${ang}rad` },
          CE.el('span', { class: 'tronco' }), CE.el('span', { class: 'folhas', 'aria-hidden': 'true' }, '🍃🍂🍃'), CE.el('span', { class: 'copa', 'aria-hidden': 'true' }, q.palmeira ? '🌴' : '🌳'),
          CE.el('span', { class: 'equipe', 'aria-hidden': 'true' }, '👷'));
        const toco = CE.el('div', { class: 'pr-toco', style: `left:${ax * T}px;top:${ay * T}px;background:${chao}` });
        const placa = CE.el('div', { class: 'pr-placa-queda', style: `left:${cx * T}px;top:${(cy - 0.55) * T}px` });
        const fio = q.fio ? CE.el('div', { class: 'pr-fio', 'data-fio': q.id, style: `left:${(q.fio[0] + 0.5) * T}px;top:${(q.fio[1] + 0.5) * T}px` }, CE.el('span', { 'aria-hidden': 'true' }, '⚡')) : null;
        camadaObjetos.append(toco, arvore, ...(fio ? [fio] : []));
        camadaRotulos.append(placa);
        return { arvore, toco, placa, fio };
      }
      function desenharAlarme() {
        const e = emerg, d = defEmerg();
        if (!e) { emergEl.hidden = true; return; }
        emergEl.hidden = false;
        emergEl.classList.toggle('fim', e.status !== 'ativo');
        if (e.status !== 'ativo') {
          const texto = e.status === 'salvo' ? d.salvo : e.status === 'perdido' ? d.perdido : 'O instrutor encerrou o evento.';
          emergEl.replaceChildren(CE.el('strong', {}, `${e.status === 'salvo' ? '🎉' : d.emoji} ${texto}`), CE.el('span', { class: 'licao' }, d.licao));
          return;
        }
        const resta = Math.max(0, Math.ceil((e.fim - (e.agora + (performance.now() - relogioEmerg))) / 1000));
        const relogioTxt = `${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}`;
        emergEl.replaceChildren(...[
          CE.el('div', { class: 'topo' }, CE.el('strong', {}, `🚨 ${d.titulo}`), CE.el('span', { class: 'relogio', 'data-relogio': '' }, `⏱ ${relogioTxt}`)),
          CE.el('div', { class: 'perigo' }, CE.el('span', {}, `${d.emoji} ${d.perigo}`),
            CE.el('span', { class: 'barra', role: 'progressbar', 'aria-label': d.perigo, 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(e.perigo) }, CE.el('span', { style: `width:${e.perigo}%` })),
            CE.el('strong', {}, `${e.perigo}%`)),
          infoDoMapa(e),
          CE.el('div', { class: 'botoes' },
            CE.el('button', { class: 'pr-emerg-botao' + (e.ligou ? ' feito' : ''), type: 'button', 'data-emerg': 'ligar', onclick: () => abrirLigar() }, `${e.ligou ? '✅' : '📞'} ${d.ligar.titulo}`),
            CE.el('button', { class: 'pr-emerg-botao' + (e.respondeu ? ' feito' : ''), type: 'button', 'data-emerg': 'pergunta', onclick: () => abrirPergunta() }, `${e.respondeu ? '✅' : '❓'} ${d.pergunta.titulo}`),
            CE.el('button', { class: 'pr-emerg-botao', type: 'button', 'data-emerg': 'como', onclick: () => comoAjudar() }, 'ℹ️ Como ajudar')),
          e.carregando ? CE.el('p', { class: 'carregando' }, `Você está levando ${d.levar.levando}: ${d.levar.entregarTexto.replace(/^\S+\s/, '').toLowerCase()}!`) : null,
        ].filter(Boolean));
      }
      // O que está acontecendo no mapa, em poucas palavras (focos, água, sacos, árvores, socorro chegando).
      function infoDoMapa(e) {
        const chips = [];
        const relogio = (chega) => CE.el('strong', { 'data-relogio-socorro': String(chega) }, mmss(chega - agoraEmerg()));
        if (e.tipo === 'incendio') {
          const acesos = (e.focos || []).filter((f) => f.forca > 0);
          chips.push([`🔥 ${acesos.length} foco${acesos.length === 1 ? '' : 's'} de fogo`]);
          if (acesos.some((f) => f.eletrico)) chips.push(['⚡ Poste: só os Bombeiros (193)']);
          if (e.bombeiros) chips.push(e.bombeiros.chegou ? ['🚒 Bombeiros na praça'] : ['🚒 Bombeiros chegam em ', relogio(e.bombeiros.chega)]);
        } else if (e.tipo === 'rio') {
          const a = Number.isFinite(e.agua) ? e.agua : 27;
          chips.push([a >= 26.5 ? '🌊 O rio voltou ao normal' : a >= 24.5 ? '🌊 Água na praia e nos trilhos' : a >= 21.8 ? '🌊 Água na feira e na estação' : a >= 20.8 ? '🌊 Água na barreira!' : '🌊 Água na avenida!']);
          chips.push([`🧱 ${e.sacos || 0} saco${e.sacos === 1 ? '' : 's'} na barreira`]);
          if (e.caminhao) chips.push(e.caminhao.chegou ? ['🚚 Areia da Defesa Civil na avenida'] : ['🚚 Defesa Civil chega em ', relogio(e.caminhao.chega)]);
        } else if (e.tipo === 'chuva') {
          const q = e.quedas || [];
          const sem = q.filter((x) => !x.avisada).length;
          chips.push([q.length ? `🌳 ${q.length} árvore${q.length === 1 ? '' : 's'} na rua${sem ? ` (${sem} sem aviso)` : ''}` : '🌳 Cuidado com as árvores']);
          if (q.some((x) => x.fio)) chips.push(['⚡ Fio caído: longe!']);
        }
        return CE.el('div', { class: 'mapa' }, chips.map((c) => CE.el('span', { class: 'chip' }, ...c)));
      }
      // Só o relógio anda a cada segundo (o resto muda quando chega notícia do instrutor).
      // ---------- Evento especial (conduzido pelo Professor Virtual) ----------
      let esp = null, chaveEsp = '', relogioEsp = 0, marcados = new Set(), hora = null, relogioHora = 0;
      const baus = {};
      const restaEsp = () => (esp ? (esp.status === 'contagem' ? esp.comeca : esp.fim) - (esp.agora + (performance.now() - relogioEsp)) : 0);
      function aplicarEspecial(e) {
        esp = e;
        relogioEsp = performance.now();
        const chave = e ? [e.id, e.status, e.palmas, e.achados, (e.sorteados || []).length, e.vencedor ? e.vencedor.id : '', e.esperando ? 1 : 0].join('|') : '';
        if (chave === chaveEsp) return;
        const mudouId = !e || !chaveEsp.startsWith(String(e.id) + '|');
        chaveEsp = chave;
        if (mudouId) marcados = new Set();
        professorEl.el.classList.toggle('fora', !e || e.status === 'fim');
        fogosEl.hidden = !(e && e.tipo === 'festa' && e.status === 'ativo');
        desenharBaus();
        desenharBingo();
        desenharEspecial();
      }
      function desenharEspecial() {
        const e = esp;
        if (!e) { especialEl.hidden = true; return; }
        const d = ESP[e.tipo];
        especialEl.hidden = false;
        especialEl.classList.toggle('fim', e.status === 'fim');
        let linha;
        if (e.status === 'contagem' && e.esperando) linha = CE.el('span', {}, 'Começa logo depois do evento urgente. Primeiro, todo mundo ajudando!');
        else if (e.status === 'contagem') linha = CE.el('span', {}, 'Começa em ', CE.el('strong', { 'data-relogio-esp': '' }, mmss(restaEsp())), '. Vá para o coreto!');
        else if (e.status === 'fim') linha = CE.el('span', {}, e.tipo === 'bingo' && e.vencedor ? `🎉 ${e.vencedor.id === usuario.id ? 'Você' : e.vencedor.nome} ganhou o bingo!` : 'Terminou. Obrigado, turma!');
        else if (e.tipo === 'festa') linha = CE.el('span', {}, `👏 ${e.palmas || 0} palmas · aperte o 👏 lá embaixo! · ⏱ `, CE.el('strong', { 'data-relogio-esp': '' }, mmss(restaEsp())));
        else if (e.tipo === 'tesouro') linha = CE.el('span', {}, `🎁 ${e.achados || 0} de ${(e.baus || []).length} baús achados · ande pelas ruas · ⏱ `, CE.el('strong', { 'data-relogio-esp': '' }, mmss(restaEsp())));
        else if (e.tipo === 'bingo') linha = CE.el('span', {}, `Saíram ${(e.sorteados || []).length} de ${d.numeros} números · marque na sua cartela`);
        else linha = CE.el('span', {}, '');
        especialEl.replaceChildren(CE.el('strong', { class: 'titulo' }, `👨‍🏫 ${d.emoji} ${d.nome}`), linha);
      }
      function andarRelogioEspecial() {
        if (!esp || esp.status === 'fim') return;
        const r = especialEl.querySelector('[data-relogio-esp]');
        if (r) r.textContent = mmss(restaEsp());
        if (hora && !botaoHora.hidden) botaoHora.textContent = `⏰ Faltam ${Math.max(1, Math.ceil((hora.fimEm - (hora.agora + (performance.now() - relogioHora))) / 60000))} min`;
      }
      function desenharBaus() {
        const lista = esp && esp.tipo === 'tesouro' && esp.status === 'ativo' ? esp.baus || [] : [];
        lista.forEach((b, k) => {
          if (b.achado || !lista.length) { if (baus[k]) { baus[k].classList.add('aberto'); const el = baus[k]; delete baus[k]; setTimeout(() => el.remove(), 900); } return; }
          if (!baus[k]) { baus[k] = CE.el('div', { class: 'pr-bau', 'data-bau': String(k), style: `left:${(b.x + 0.5) * T}px;top:${(b.y + 0.5) * T}px` }, '🎁'); camadaObjetos.append(baus[k]); }
        });
        if (!lista.length) for (const k of Object.keys(baus)) { baus[k].remove(); delete baus[k]; }
      }
      function desenharBingo() {
        const e = esp;
        const cartela = e && e.tipo === 'bingo' && e.cartela;
        bingoEl.hidden = !(cartela && e.status !== 'contagem');
        if (bingoEl.hidden) return;
        const sorteados = new Set(e.sorteados || []);
        const ultimo = (e.sorteados || []).slice(-1)[0];
        const cheia = cartela.every((n) => marcados.has(n));
        bingoEl.replaceChildren(...[
          CE.el('div', { class: 'topo' }, CE.el('strong', {}, '🎱 Sua cartela'), ultimo ? CE.el('span', { class: 'ultimo', 'aria-label': `Último número: ${ultimo}` }, String(ultimo)) : null),
          CE.el('div', { class: 'cartela' }, cartela.map((n) => CE.el('button', {
            class: 'pr-bingo-num' + (marcados.has(n) ? ' marcado' : ''), type: 'button', 'data-numero': String(n), 'aria-pressed': String(marcados.has(n)),
            onclick: (ev) => {
              if (!sorteados.has(n)) { ev.currentTarget.classList.remove('ainda'); void ev.currentTarget.offsetWidth; ev.currentTarget.classList.add('ainda'); balao(eu, `O ${n} ainda não saiu!`); return; }
              if (marcados.has(n)) marcados.delete(n); else marcados.add(n);
              desenharBingo();
            },
          }, String(n)))),
          CE.el('div', { class: 'saidos' }, `Saíram: ${(e.sorteados || []).join(', ') || 'ainda nenhum'}`),
          e.status === 'ativo' ? CE.el('button', { class: 'botao pr-bingo-grito', type: 'button', 'data-acao': 'bingo', disabled: !cheia, onclick: gritarBingo }, 'BINGO!') : null,
        ].filter(Boolean));
      }
      async function gritarBingo() {
        const r = await chamar('praca:bingo');
        if (r) { aplicarEspecial(r); sincronizar(); }
      }
      // A Hora da Praça: uma pílula mostra quanto falta para a aula acabar.
      function aplicarHora(h) {
        hora = h;
        relogioHora = performance.now();
        botaoHora.hidden = !h;
        if (h) botaoHora.textContent = `⏰ Faltam ${Math.max(1, Math.ceil((h.fimEm - h.agora) / 60000))} min`;
      }
      // ---------- A loja de eventos especiais (a vaquinha da turma) ----------
      let infoLoja = null;
      async function abrirLoja() {
        const r = await chamar('praca:loja');
        if (!r || fechouJanela) return;
        infoLoja = r;
        desenharLoja(souInstrutor ? 0 : await CE.carteira.saldo());
      }
      function desenharLoja(saldo) {
        const r = infoLoja;
        const agora = r.especial && r.especial.status !== 'fim' ? ESP[r.especial.tipo] : null;
        const cartoes = r.eventos.map((ev) => CE.el('li', { class: 'pr-loja-item', 'data-especial': ev.id },
          CE.el('span', { class: 'ic', 'aria-hidden': 'true' }, ev.emoji),
          CE.el('div', { class: 'txt' },
            CE.el('strong', {}, `${ev.nome} · ${ev.preco} moedas`),
            CE.el('span', { class: 'pr-suave' }, ev.descricao),
            CE.el('span', { class: 'pr-suave linha' }, barrinha(ev.juntado, ev.preco), `${ev.juntado} de ${ev.preco}${ev.meu ? ` · você deu ${ev.meu}` : ''}`),
            CE.el('div', { class: 'pr-botoes' }, souInstrutor
              ? [CE.el('button', { class: 'botao secundario', type: 'button', 'data-comecar': ev.id, onclick: async () => { const x = await chamar('praca:especial-iniciar', ev.id); if (x) { infoLoja = x; fecharDialogo(); sincronizar(); } } }, '▶ Começar agora (grátis)')]
              : [10, 20, 50].map((v) => CE.el('button', { class: 'botao secundario', type: 'button', 'data-doar': `${ev.id}:${v}`, disabled: saldo < v, onclick: () => doar(ev, v) }, `+${v} 💰`))))));
        abrirDialogo({
          tipo: 'loja', rosto: '🎟️', titulo: 'Eventos especiais', subtitulo: souInstrutor ? 'O instrutor começa de graça; os alunos compram com as moedas' : `Você tem 💰 ${saldo} moedas`,
          fala: 'A turma junta moedas numa vaquinha: quando o valor chega, o Professor Virtual conduz o evento aqui na praça.',
          extra: [agora ? CE.el('p', { class: 'pr-pronto' }, `Agora: ${agora.emoji} ${agora.nome}`) : null, CE.el('ul', { class: 'pr-loja' }, cartoes)].filter(Boolean),
          opcoes: [souInstrutor && agora ? { rotulo: '⏹ Encerrar o evento especial', id: 'encerrar-especial', acao: async () => { await chamar('praca:especial-encerrar'); sincronizar(); } } : null,
            souInstrutor ? null : { rotulo: 'Ver meu extrato', id: 'extrato', acao: () => CE.carteira.abrir() }, { rotulo: 'Fechar' }].filter(Boolean),
        });
      }
      async function doar(ev, valor) {
        try { await CE.carteira.gastar(valor, `Vaquinha: ${ev.emoji} ${ev.nome}`); } catch (e) { CE.avisar(e.message); return; }
        const r = await chamar('praca:doar', ev.id, valor);
        if (!r) { await CE.carteira.ganhar('estorno', 'Devolução da vaquinha (não deu certo)', null, valor); return; }
        infoLoja = r;
        if (r.comprou) { CE.comemorar('grande'); fecharDialogo(); sincronizar(); return; }
        desenharLoja(await CE.carteira.saldo());
        balao(eu, `Dei ${valor} moedas para ${ev.nome}!`);
      }
      // ⏰ O horário das aulas (só o instrutor mexe).
      async function abrirPopHora(abrir) {
        if (!souInstrutor) return;
        popHora.hidden = !abrir;
        btHora.setAttribute('aria-expanded', String(abrir));
        btHora.classList.toggle('ligado', abrir);
        if (!abrir) return;
        abrirGente(false); abrirMegafone(false); abrirPopEmerg(false);
        const h = await chamar('praca:horario');
        if (h && !popHora.hidden) desenharPopHora(h);
      }
      function desenharPopHora(h) {
        const fins = h.fins.slice();
        const ativo = CE.el('input', { type: 'checkbox', id: 'pr-hora-ativa' }); ativo.checked = h.ativo;
        const lista = CE.el('div', { class: 'pr-hora-fins' });
        const desenharFins = () => lista.replaceChildren(...fins.map((f, k) => CE.el('span', { class: 'pr-hora-fim' }, `🕒 ${f}`, CE.el('button', { class: 'pr-x', type: 'button', 'aria-label': `Tirar ${f}`, onclick: () => { fins.splice(k, 1); desenharFins(); } }, '×'))), ...(fins.length ? [] : [CE.el('span', { class: 'pr-suave' }, 'Nenhum horário ainda.')]));
        desenharFins();
        const novo = CE.el('input', { type: 'time', id: 'pr-hora-nova', 'aria-label': 'Horário em que a aula termina' });
        const dias = DIAS.map((nome, k) => { const c = CE.el('input', { type: 'checkbox', 'data-dia': String(k) }); c.checked = h.dias.includes(k); return CE.el('label', { class: 'pr-dia' }, c, nome); });
        const proxima = h.proxima ? new Date(h.proxima).toLocaleString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' }) : null;
        popHora.replaceChildren(...[
          CE.el('h3', {}, '⏰ Hora da Praça'),
          CE.el('p', { class: 'pr-suave' }, '15 minutos antes de a aula acabar, a praça abre e o Professor Virtual chama todo mundo.'),
          CE.el('label', { class: 'pr-chave' }, ativo, 'Chamar a turma automaticamente'),
          CE.el('strong', {}, 'A aula termina às:'), lista,
          CE.el('div', { class: 'pr-digitar' }, novo, CE.el('button', { class: 'botao secundario', type: 'button', 'data-acao': 'adicionar-hora', onclick: () => { if (novo.value && !fins.includes(novo.value)) { fins.push(novo.value); fins.sort(); novo.value = ''; desenharFins(); } } }, 'Adicionar')),
          CE.el('div', { class: 'pr-dias' }, dias),
          proxima ? CE.el('p', { class: 'pr-suave' }, `Próxima: ${proxima}`) : null,
          CE.el('div', { class: 'pr-botoes' },
            CE.el('button', { class: 'botao', type: 'button', 'data-acao': 'salvar-horario', onclick: async () => {
              if (novo.value && !fins.includes(novo.value)) fins.push(novo.value);
              const x = await chamar('praca:configurar-horario', { ativo: ativo.checked, fins, dias: dias.map((l, k) => (l.querySelector('input').checked ? k : null)).filter((k) => k != null) });
              if (x) { desenharPopHora(x); CE.avisar('⏰ Horário da Hora da Praça guardado.'); }
            } }, 'Salvar'),
            CE.el('button', { class: 'botao secundario', type: 'button', 'data-acao': 'testar-hora', onclick: async () => { const x = await chamar('praca:testar-hora'); if (x) { abrirPopHora(false); sincronizar(); } } }, 'Testar agora')),
        ].filter(Boolean));
      }

      function andarRelogio() {
        andarRelogioEspecial();
        if (!emergAtiva()) return;
        for (const s of emergEl.querySelectorAll('[data-relogio-socorro]')) s.textContent = mmss(Number(s.dataset.relogioSocorro) - agoraEmerg());
        const r = emergEl.querySelector('[data-relogio]');
        if (!r) return;
        const resta = Math.max(0, Math.ceil((emerg.fim - (emerg.agora + (performance.now() - relogioEmerg))) / 1000));
        r.textContent = `⏱ ${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}`;
      }
      function aplicarEmergencia(e) {
        const antes = emerg;
        emerg = e;
        relogioEmerg = performance.now();
        const bl = e && e.status === 'ativo' && e.bloqueios ? e.bloqueios : null;
        const chaveBl = bl ? JSON.stringify(bl) : '';
        if (chaveBl !== chaveBloqueios) { chaveBloqueios = chaveBl; M.definirBloqueios(bl ? bl.tiles : [], bl ? bl.agua : null); conferirMeuLugar(); }
        const chave = e ? [e.id, e.status, e.perigo, e.carregando, e.ligou, e.respondeu, (e.focos || []).map((f) => f.id + ':' + f.forca).join(','),
          e.bombeiros ? `${e.bombeiros.chegou}${e.bombeiros.alvo}` : '', e.agua, e.sacos, e.caminhao ? e.caminhao.chegou : '', (e.fontes || []).join(),
          (e.quedas || []).map((q) => q.id + (q.avisada ? 'a' : '') + (q.equipe ? 'e' : '')).join(',')].join('|') : '';
        if (chave === chaveEmerg) return;
        chaveEmerg = chave;
        if (!e && antes) limparVisual();
        desenharAlarme();
        desenharVisual();
        marcarCarga(eu, e && e.status === 'ativo' && e.carregando ? EMERG[e.tipo].levar.levando : null);
        if (souInstrutor && !popEmerg.hidden) desenharPopEmerg();
        verPerto(true);
      }
      function marcarCarga(p, emoji) {
        if (emoji && !p.cargaEl) { p.cargaEl = CE.el('span', { class: 'pr-carga', 'aria-hidden': 'true' }, emoji); p.el.append(p.cargaEl); }
        else if (emoji && p.cargaEl) p.cargaEl.textContent = emoji;
        else if (!emoji && p.cargaEl) { p.cargaEl.remove(); p.cargaEl = null; }
      }
      // Pegar e entregar: andando até o lugar certo (o botão em cima do boneco avisa).
      async function acaoEmerg(acao, extra) {
        const r = await chamar('praca:emergencia-acao', acao, { x: arred(eu.x), y: arred(eu.y), ...(extra || {}) });
        if (!r || fechouJanela) return null;
        aplicarEmergencia(r.emergencia);
        const d = r.emergencia ? EMERG[r.emergencia.tipo] : null;
        if (d && acao === 'pegar') balao(eu, `${d.levar.levando} Peguei! Agora: ${r.emergencia.tipo === 'incendio' ? 'jogar no fogo' : d.levar.entregarTexto.replace(/^\S+\s/, '').toLowerCase()}.`);
        if (d && acao === 'entregar') balao(eu, `${d.levar.entregarTexto.split(' ')[0]} Feito!`);
        if (d && acao === 'avisar') balao(eu, '📞 Avisei a Defesa Civil! A equipe já vem.');
        return r;
      }
      // O que dá para fazer no evento onde o boneco está (o botão em cima dele).
      function zonaDaAcao() {
        if (!emergAtiva()) return null;
        const d = defEmerg(), x = eu.x, y = eu.y;
        if (emerg.tipo === 'chuva') { const q = quedaPerto(x, y); if (q && !q.avisada) return { emergencia: 'avisar', queda: q }; }
        if (!emerg.carregando && fontesDoEvento().some((z) => M.pertoDaZona(z, x, y, 1.3))) return { emergencia: 'pegar' };
        if (emerg.tipo === 'incendio') {
          const f = focoPerto(x, y);
          if (f) return { emergencia: f.eletrico ? 'poste' : emerg.carregando ? 'entregar' : 'balde', foco: f };
          return null;
        }
        if (emerg.carregando && M.pertoDaZona(d.levar.entregar, x, y, emerg.tipo === 'rio' ? 2 : 1.3)) return { emergencia: 'entregar' };
        return null;
      }
      // Clique no mapa durante o evento: no fogo, na árvore caída, no fio, na água, no caminhão, na barreira.
      function cliqueNoEvento(x, y) {
        const e = emerg;
        if (e.tipo === 'incendio') {
          const d = (f) => Math.hypot(f.x - x, f.y - y);
          const f = focosAcesos().filter((g) => d(g) <= 1.1).sort((a, b) => d(a) - d(b))[0];
          if (!f) return false;
          if (f.eletrico) { balao(eu, '⚡ Fogo no poste: água, não! Isso é com os Bombeiros (193).'); return true; }
          irPara(M.pertoDoPonto(f.x, f.y), () => { if (!emergAtiva()) return; if (emerg.carregando) acaoEmerg('entregar', { foco: f.id }); else balao(eu, 'Primeiro, encho o balde na fonte! 💧'); });
          return true;
        }
        if (e.tipo === 'chuva') {
          const quedas = e.quedas || [];
          if (quedas.some((q) => q.fio && q.fio[0] === x && q.fio[1] === y)) { balao(eu, '⚡ Fio caído! Não chego perto: a Defesa Civil resolve.'); return true; }
          const q = quedas.find((g) => [...g.tiles, g.arvore].some(([a, b]) => a === x && b === y));
          if (!q) return false;
          const alvos = q.tiles.flatMap(([a, b]) => M.pertoDoPonto(a, b, 2.4)).filter(([a, b]) => !(q.fio && Math.hypot(a - q.fio[0], b - q.fio[1]) < 1.5));
          irPara(alvos, () => {
            const v = emergAtiva() && (emerg.quedas || []).find((g) => g.id === q.id);
            if (v && !v.avisada) acaoEmerg('avisar', { queda: q.id }); else if (v) balao(eu, 'A Defesa Civil já está vindo! 👷');
          });
          return true;
        }
        if (e.tipo === 'rio') {
          if (Number.isFinite(e.agua) && y >= Math.ceil(e.agua) && y < 27 && M.andavelFixo(x, y)) { balao(eu, '🌊 Na água da enchente, não! A correnteza arrasta.'); return true; }
          if (e.caminhao && e.caminhao.chegou && M.CAMINHAO_AREIA.some(([a, b]) => a === x && b === y)) {
            irPara(M.ZONAS.caminhao, () => { if (emergAtiva() && !emerg.carregando) acaoEmerg('pegar'); });
            return true;
          }
          if (e.carregando && y >= 19 && y <= 22 && x >= 11 && x <= 30) {
            irPara(M.ZONAS.barreira.flatMap(([a, b]) => [[a, b], [a, b - 1], [a, b - 2]]), () => { if (emergAtiva() && emerg.carregando) acaoEmerg('entregar'); });
            return true;
          }
        }
        return false;
      }
      // Ligar (ou mandar o CEP) e a pergunta: do jeito das tarefas, de qualquer lugar do mapa.
      function abrirLigar() {
        if (!emergAtiva()) return;
        const d = defEmerg();
        const sms = emerg.tipo === 'chuva';
        mostrarTarefa({
          tipo: 'emergencia', rosto: sms ? '📱' : '📞', titulo: d.ligar.titulo, subtitulo: `🚨 ${d.titulo}`,
          t: { tipo: 'digitar', numero: true, pergunta: d.ligar.pergunta, dica: sms ? 'Ex.: 76800-000' : 'Digite o número', botao: sms ? 'Enviar' : 'Ligar', erro: sms ? 'Ainda não: confira o CEP, número por número.' : 'Esse não é o número certo. Pense de novo!' },
          enviar: (resposta) => chamar('praca:emergencia-acao', 'ligar', { resposta }),
          depois: (r) => { aplicarEmergencia(r.emergencia); mostrarAcerto({ tipo: 'emergencia', titulo: sms ? 'Mensagem enviada!' : 'Ligação feita!', subtitulo: `🚨 ${d.titulo}`, explica: r.explica, nota: 'Agora ajude a turma do outro jeito também.' }); },
        });
      }
      function abrirPergunta() {
        if (!emergAtiva()) return;
        const d = defEmerg();
        mostrarTarefa({
          tipo: 'emergencia', rosto: '❓', titulo: d.pergunta.titulo, subtitulo: `🚨 ${d.titulo}`,
          t: { tipo: 'escolha', pergunta: d.pergunta.pergunta, opcoes: d.pergunta.opcoes },
          enviar: (resposta) => chamar('praca:emergencia-acao', 'pergunta', { resposta }),
          depois: (r) => { aplicarEmergencia(r.emergencia); mostrarAcerto({ tipo: 'emergencia', titulo: 'Isso mesmo!', subtitulo: `🚨 ${d.titulo}`, explica: r.explica, nota: 'Cada ajuda baixa o perigo. Continue!' }); },
        });
      }
      function comoAjudar() {
        if (!emergAtiva()) return;
        const d = defEmerg();
        abrirDialogo({ tipo: 'emergencia', rosto: d.emoji, titulo: 'Como ajudar', subtitulo: `🚨 ${d.titulo}`, fala: d.alerta,
          lista: [...(d.como || [`${d.levar.pegarTexto} (vá até lá: o lugar está marcado no mapa).`, `${d.levar.entregarTexto} (leve até o lugar marcado e aperte o botão em cima do boneco).`]), `${d.ligar.titulo}: o botão 📞 no alarme.`, `${d.pergunta.titulo}: o botão ❓ no alarme.`],
          nota: 'Cada ajuda baixa o perigo. Se chegar a zero antes do tempo acabar, a turma vence e todo mundo que ajudou ganha moedas.',
          opcoes: [{ rotulo: 'Entendi!', principal: true }] });
      }
      // O instrutor escolhe a emergência.
      function abrirPopEmerg(abrir) {
        if (!souInstrutor) return;
        popEmerg.hidden = !abrir;
        btEmerg.setAttribute('aria-expanded', String(abrir));
        btEmerg.classList.toggle('ligado', abrir);
        if (abrir) { abrirGente(false); abrirMegafone(false); desenharPopEmerg(); }
      }
      function desenharPopEmerg() {
        const ativo = emergAtiva();
        popEmerg.replaceChildren(CE.el('h3', {}, '🚨 Evento urgente'),
          CE.el('p', { class: 'pr-suave' }, ativo ? 'Tem um evento acontecendo agora.' : 'A turma toda ajuda junta, cada um do seu jeito. Dura até 3 minutos e abre a praça para todos.'),
          ...(ativo
            ? [CE.el('button', { class: 'botao secundario', type: 'button', 'data-acao': 'encerrar-emergencia', onclick: async () => { const r = await chamar('praca:emergencia-encerrar'); if (r !== null) { abrirPopEmerg(false); sincronizar(); } } }, '⏹ Encerrar o evento')]
            : Object.values(EMERG).map((d) => CE.el('button', { class: 'pr-emerg-opcao', type: 'button', 'data-emergencia': d.id, onclick: async () => {
              const r = await chamar('praca:emergencia-iniciar', d.id);
              if (r) { abrirPopEmerg(false); aplicarEmergencia(r); sincronizar(); }
            } }, CE.el('span', { class: 'ic', 'aria-hidden': 'true' }, d.emoji), CE.el('span', {}, d.titulo)))));
      }
      function mostrarFinal(ev) {
        finalEl.replaceChildren(CE.el('div', { class: 'pr-fechada-cartao pr-final-cartao' },
          CE.el('span', { class: 'pr-final-emoji', 'aria-hidden': 'true' }, ev.emoji || '📖'),
          CE.el('h3', {}, `O final de “${ev.titulo}”`), CE.el('p', {}, ev.texto),
          ev.moral ? CE.el('p', { class: 'pr-suave' }, `Moral da história: ${ev.moral}`) : null,
          CE.el('button', { class: 'botao', type: 'button', 'data-acao': 'fechar-final', onclick: () => { finalEl.hidden = true; mapa.focus({ preventScroll: true }); } }, 'Que história!')));
        finalEl.hidden = false;
        CE.comemorar('grande');
        if (CE.voz) CE.voz.falar(`${ev.texto} ${ev.moral || ''}`);
        if ((ev.participantes || []).includes(usuario.id)) { detetiveDado = true; conquista('detetive'); CE.carteira.ganhar('final', `Desvendou “${ev.titulo}”`, `final:${ev.capitulo}:${ev.aberto}`); }
      }

      async function sincronizar() {
        if (emCurso || fechouJanela) return;
        emCurso = true;
        try {
          const eu0 = { x: arred(eu.x), y: arred(eu.y), esq: !!eu.esq, andando: !!eu.andando };
          if (souInstrutor && typeof turmaEscolhida === 'string') eu0.turma = turmaEscolhida;
          const r = await CE.api.chamar('praca:sincronizar', eu0, desde);
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
        if (r.cidade) aplicarCidade(r.cidade);
        if (r.novela !== undefined) aplicarNovela(r.novela);
        if (r.emergencia !== undefined) aplicarEmergencia(r.emergencia);
        if (r.especial !== undefined) aplicarEspecial(r.especial);
        if (r.hora !== undefined) aplicarHora(r.hora);
        // Pessoas
        const vistos = new Set();
        for (const x of r.pessoas) {
          if (x.id === usuario.id) continue;
          vistos.add(x.id);
          let o = outros.get(x.id);
          if (!o) { o = boneco({ id: x.id, nome: nomeDe(x), emoji: x.avatar, x: x.x, y: x.y }, classeDe(x)); outros.set(x.id, o); }
          Object.assign(o, { alvoX: x.x, alvoY: x.y, esqRede: x.esq, andandoRede: x.andando, papel: x.papel, monitor: x.monitor, bot: x.bot, mao: x.mao, nomeReal: x.nome, turma: x.turma, casa: x.casa, enfeites: x.enfeites });
          if (o.rostoEl.textContent !== x.avatar) o.rostoEl.textContent = x.avatar;
          if (o.nomeEl.textContent !== nomeDe(x)) { o.nomeEl.textContent = nomeDe(x); o.el.title = x.nome; }
          o.el.className = `pr-p ${classeDe(x)}` + (o.el.classList.contains('andando') ? ' andando' : '') + (o.el.classList.contains('esq') ? ' esq' : '');
          marcarMao(o, x.mao);
          marcarCarga(o, x.carga || null);
        }
        for (const [id, o] of outros) if (!vistos.has(id)) { o.el.remove(); outros.delete(id); }
        const minha = r.pessoas.find((x) => x.id === usuario.id);
        marcarMao(eu, minha && minha.mao);
        botaoMao.classList.toggle('ligado', !!(minha && minha.mao));
        botaoMao.title = minha && minha.mao ? 'Baixar a mão' : 'Pedir ajuda (levantar a mão)';
        botaoMao.setAttribute('aria-label', botaoMao.title);
        if (minha) aplicarCasa(minha);
        // Conversa e avisos
        for (const ev of r.eventos) tratarEvento(ev, r.agora - ev.em > 10000);
        desde = r.ultimo;
        // Escolhas do instrutor
        const mudouConfig = estado.aberta !== r.aberta || estado.soFrases !== r.soFrases || estado.silenciado !== r.silenciado;
        estado = { aberta: r.aberta, soFrases: r.soFrases, silenciado: r.silenciado, silenciados: r.silenciados || [] };
        fechadaEl.hidden = !bloqueado();
        if (bloqueado()) { eu.caminho = []; fecharDialogo(); abrirConversa(false); }
        formConversa.hidden = (estado.soFrases && !souInstrutor) || estado.silenciado;
        notaConversa.hidden = !formConversa.hidden;
        notaConversa.textContent = estado.silenciado ? 'O instrutor pediu para você ficar só ouvindo por enquanto.' : 'Agora a conversa é só com as frases prontas (o instrutor escolheu).';
        for (const b of mapa.querySelectorAll('.pr-chip, .pr-gesto')) b.disabled = estado.silenciado || bloqueado();
        if (mudouConfig) desenharInstrutor();
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
        const pertinho = ev.de && (ev.de.id === usuario.id || souInstrutor || ev.x == null || Math.hypot(ev.x - eu.x, ev.y - eu.y) <= RAIO);
        if (ev.tipo === 'fala') {
          if (!velho) balao(p, ev.texto);
          if (pertinho) registrar({ quem: ev.de.id === usuario.id ? 'Você' : ev.de.nome, emoji: ev.de.avatar, texto: ev.texto, classe: ev.de.id === usuario.id ? 'eu' : '' }, ev.de.id !== usuario.id && !velho);
        } else if (ev.tipo === 'gesto') {
          const emoji = { acenar: '👋', aplaudir: '👏👏👏', ajuda: '🙋 Preciso de ajuda!' }[ev.gesto] || '';
          if (!velho) balao(p, emoji);
          if (ev.gesto === 'ajuda' && ev.de.id !== usuario.id && (pertinho || souInstrutor)) {
            registrar({ classe: 'sistema', texto: `🙋 ${ev.de.nome} pediu ajuda.` });
            if (!velho) avisarNoMapa(`🙋 ${ev.de.nome} pediu ajuda.`);
          }
        } else if (ev.tipo === 'megafone') {
          registrar({ classe: 'megafone', quem: `📣 ${ev.de.nome}`, texto: ev.texto });
          if (!velho) {
            megafoneEl.textContent = `📣 ${ev.de.nome}: ${ev.texto}`; megafoneEl.hidden = false;
            clearTimeout(megafoneEl.timer); megafoneEl.timer = setTimeout(() => { megafoneEl.hidden = true; }, AVISO);
            if (p) balao(p, ev.texto, 'megafone');
            if (CE.voz && ev.de.id !== usuario.id) CE.voz.falar(ev.texto);
          }
        } else if (ev.tipo === 'recado') {
          if (pertinho) registrar({ classe: 'sistema', texto: `📌 ${ev.de.id === usuario.id ? 'Você' : ev.de.nome} pregou no mural: “${ev.texto}”` });
        } else if (ev.tipo === 'sistema') {
          sistema(ev.texto);
          if (!velho) avisarNoMapa(ev.texto);
          if (!velho && ev.vitoria === usuario.id) conquista('velha');
        } else if (ev.tipo === 'cidade' || ev.tipo === 'desafio' || ev.tipo === 'novela') {
          // Cada turma tem a sua cidade e a sua novela: o aviso vale para quem é da turma (e para o instrutor).
          if (souInstrutor || ev.turma === turmaDaCidade) {
            registrar({ classe: 'cidade', texto: ev.texto });
            if (!velho) avisarNoMapa(ev.texto, 'cidade');
          }
        } else if (ev.tipo === 'emergencia') {
          const d = EMERG[ev.emergencia];
          registrar({ classe: 'megafone', texto: ev.texto });
          if (!velho && d) {
            mapa.classList.remove('alarme'); void mapa.offsetWidth; mapa.classList.add('alarme');
            if (CE.voz) CE.voz.falar(`Atenção! ${d.titulo} Todo mundo ajudando!`);
            if (!perto) mudarZoom(true);
          }
        } else if (ev.tipo === 'professor') {
          // O Professor Virtual conduz: o recado aparece no alto (menos os números do bingo, que ficam na cartela).
          registrar({ classe: 'megafone', quem: '👨‍🏫 Professor Virtual', texto: ev.texto });
          if (!velho) {
            if (!ev.bingo) {
              megafoneEl.textContent = `👨‍🏫 Professor Virtual: ${ev.texto}`; megafoneEl.hidden = false;
              clearTimeout(megafoneEl.timer); megafoneEl.timer = setTimeout(() => { megafoneEl.hidden = true; }, AVISO + 2000);
              balao(professorEl, ev.texto.length > 70 ? ev.texto.slice(0, 68) + '…' : ev.texto, 'megafone');
            }
            if (CE.voz) CE.voz.falar(ev.bingo ? `Número ${ev.bingo}` : ev.texto.replace(/[^\p{L}\p{N}\s.,!?:;'"()%-]/gu, ''));
            if (ev.especial && !ev.comecou && !perto) mudarZoom(true);
          }
        } else if (ev.tipo === 'tesouro') {
          registrar({ classe: 'cidade', texto: ev.texto });
          if (!velho) avisarNoMapa(ev.texto, 'cidade');
          if (ev.de && ev.de.id === usuario.id) { CE.carteira.ganhar('tesouro', 'Achou um baú na caça ao tesouro', `tesouro:${ev.idEspecial}:${ev.bau}`); if (!velho) { CE.comemorar('pequena'); balao(eu, '🎁 Achei! +5 moedas'); } }
        } else if (ev.tipo === 'bingo-ganhou') {
          if (ev.de && ev.de.id === usuario.id) CE.carteira.ganhar('bingo', 'Ganhou o bingo do coreto!', `bingo:${ev.idEspecial}`);
          if (!velho) CE.comemorar('grande');
        } else if (ev.tipo === 'emergencia-mapa') {
          registrar({ classe: 'sistema', texto: ev.texto });
          if (!velho) avisarNoMapa(ev.texto, 'urgente');
        } else if (ev.tipo === 'emergencia-ajuda') {
          registrar({ classe: 'sistema', texto: ev.texto });
        } else if (ev.tipo === 'emergencia-fim') {
          const d = EMERG[ev.emergencia];
          registrar({ classe: 'cidade', texto: ev.texto });
          if (!velho && d) {
            avisarNoMapa(ev.texto, 'cidade');
            if (ev.salvo) CE.comemorar('grande');
            if (CE.voz) CE.voz.falar(ev.salvo ? `${d.salvo} ${d.licao}` : `${d.perdido} ${d.licao}`);
          }
          if ((ev.participantes || []).includes(usuario.id)) {
            CE.carteira.ganhar(ev.salvo ? 'evento' : 'evento-tentativa', `${d ? d.emoji + ' ' : ''}${ev.salvo ? 'Venceu' : 'Ajudou'}: ${d ? d.titulo : 'evento urgente'}`, 'emergencia:' + ev.idEmergencia);
            if (ev.salvo) conquista('brigada');
          }
        } else if (ev.tipo === 'final') {
          if (souInstrutor || ev.turma === turmaDaCidade) {
            registrar({ classe: 'cidade', texto: `📖 O final de “${ev.titulo}”: ${ev.texto}` });
            if (!velho) mostrarFinal(ev);
          }
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
      function abrirConversa(abrir) {
        if (abrir && bloqueado()) return;
        chat.hidden = !abrir;
        botaoConversa.setAttribute('aria-expanded', String(abrir));
        botaoConversa.classList.toggle('ligado', abrir);
        if (abrir) {
          semLer = 0; naoLidas.hidden = true;
          log.scrollTop = log.scrollHeight;
          if (!formConversa.hidden) campoConversa.focus({ preventScroll: true });
        }
      }
      botaoConversa.addEventListener('click', () => abrirConversa(chat.hidden));
      function abrirGente(abrir) {
        popGente.hidden = !abrir;
        botaoGente.setAttribute('aria-expanded', String(abrir));
        if (abrir) { chaveGente = ''; desenharGente(); }
      }
      botaoGente.addEventListener('click', () => { abrirMegafone(false); abrirGente(popGente.hidden); });
      botaoCidade.addEventListener('click', () => { fecharPopups(); abrirCidade('predios'); });
      botaoNovela.addEventListener('click', () => { fecharPopups(); abrirNovela(); });
      botaoMoedas.addEventListener('click', () => { fecharPopups(); abrirLoja(); });
      botaoHora.addEventListener('click', () => { fecharPopups(); avisarNoMapa('⏰ Hora da Praça: aproveite para fazer a tarefa do dia, achar as pistas da novela e juntar moedas para um evento especial!'); });
      const mostrarMoedas = (saldo) => { botaoMoedas.textContent = `💰 ${saldo}`; };
      if (!souInstrutor) CE.carteira.saldo().then(mostrarMoedas);
      const pararGanho = CE.ouvir('carteira:ganhou', (d) => { mostrarMoedas(d.saldo); botaoMoedas.classList.remove('ganhou'); void botaoMoedas.offsetWidth; botaoMoedas.classList.add('ganhou'); });
      const pararGasto = CE.ouvir('carteira:gastou', (d) => mostrarMoedas(d.saldo));
      const pararMoedas = () => { pararGanho(); pararGasto(); };
      function abrirMegafone(abrir) {
        if (!souInstrutor) return;
        popMegafone.hidden = !abrir;
        btMegafone.setAttribute('aria-expanded', String(abrir));
        btMegafone.classList.toggle('ligado', abrir);
        if (abrir) { abrirGente(false); campoMegafone.focus({ preventScroll: true }); }
      }
      function fecharPopups() { abrirGente(false); abrirMegafone(false); if (souInstrutor && !popEmerg.hidden) abrirPopEmerg(false); if (souInstrutor && !popHora.hidden) abrirPopHora(false); }

      // Os botões do instrutor mostram o que está valendo agora.
      function desenharInstrutor() {
        if (!souInstrutor) return;
        const rotuloAbrir = estado.aberta ? 'Fechar a praça' : 'Abrir a praça';
        btAbrir.querySelector('.icone').textContent = estado.aberta ? '🔒' : '🔓';
        btAbrir.querySelector('.rotulo').textContent = rotuloAbrir;
        btAbrir.setAttribute('aria-label', rotuloAbrir);
        btAbrir.classList.toggle('ligado', !estado.aberta);
        const rotuloFrases = estado.soFrases ? 'Liberar a conversa' : 'Só frases prontas';
        btFrases.querySelector('.rotulo').textContent = rotuloFrases;
        btFrases.setAttribute('aria-label', rotuloFrases);
        btFrases.setAttribute('aria-pressed', String(!!estado.soFrases));
        btFrases.classList.toggle('ligado', !!estado.soFrases);
      }
      desenharInstrutor();

      // Quem está na praça: um número no canto; tocando nele, aparecem os rostos.
      let chaveGente = '';
      function desenharGente() {
        const lista = [...outros.values()].sort((a, b) => (b.mao ? 1 : 0) - (a.mao ? 1 : 0) || String(a.nomeReal).localeCompare(String(b.nomeReal)));
        const maos = lista.filter((o) => o.mao).length;
        botaoGente.textContent = `👥 ${lista.length + 1} aqui${maos ? ` · 🙋 ${maos}` : ''}`;
        botaoGente.classList.toggle('alerta', maos > 0);
        const chave = lista.map((o) => [o.id, o.mao ? 1 : 0, o.nomeEl.textContent, o.rostoEl.textContent, estado.silenciados.includes(o.id) ? 1 : 0].join(':')).join('|');
        if (chave === chaveGente) return;
        chaveGente = chave;
        if (!lista.length) { listaGente.replaceChildren(CE.el('li', { class: 'pr-suave' }, 'Só você por enquanto. Quando os colegas abrirem a Praça Escola, eles aparecem aqui.')); return; }
        listaGente.replaceChildren(...lista.map((o) => CE.el('li', { 'data-gente': o.id },
          CE.el('button', { class: 'ir', type: 'button', title: 'Ir até ' + o.nomeReal, onclick: () => { abrirGente(false); chegarPerto(o); } },
            CE.el('span', { class: 'pr-rosto mini ' + classeDe(o), 'aria-hidden': 'true' }, o.rostoEl.textContent),
            CE.el('span', { class: 'quem' }, `${o.mao ? '🙋 ' : ''}${o.nomeEl.textContent}`)),
          souInstrutor && o.papel !== 'instrutor' && !o.bot
            ? CE.el('button', { class: 'mini', type: 'button', 'data-silenciar': o.id, onclick: () => chamar('praca:silenciar', o.id, !estado.silenciados.includes(o.id)).then(sincronizar) }, estado.silenciados.includes(o.id) ? 'Deixar falar' : 'Silenciar')
            : null)));
      }

      // ---------- Cofre da turma e votação (no Lote da turma) ----------
      async function carregarCofre() {
        const r = await CE.api.chamar('praca:votacao').catch(() => null);
        if (r) { votacao = r; desenharCofre(); }
        return r;
      }
      function desenharCofre() {
        const v = votacao;
        const vencedor = v.vencedor && v.opcoes.find((o) => o.id === v.vencedor);
        if (rotuloDe.lote) rotuloDe.lote.textContent = vencedor ? `🚧 Obra: ${vencedor.nome}` : '🚧 Lote da turma';
        if (!dialogo.hidden && dialogo.dataset.tipo === 'cidade' && abaCidade === 'lote') desenharCidadeDialogo();
      }
      function conteudoLote() {
        const v = votacao;
        if (!v) return [CE.el('p', { class: 'pr-suave' }, 'Carregando…')];
        const c = v.cofre || { aulas: 0, moedas: 0, meta: 1500 };
        const total = v.total || 1;
        const vencedor = v.vencedor && v.opcoes.find((o) => o.id === v.vencedor);
        return [
          CE.el('p', { class: 'pr-cofre' }, '💰 ', CE.el('span', {}, c.moedas.toLocaleString('pt-BR')), ` de ${c.meta.toLocaleString('pt-BR')} moedas no cofre`),
          CE.el('div', { class: 'pr-progresso', role: 'progressbar', 'aria-label': 'Cofre da turma', 'aria-valuemin': '0', 'aria-valuemax': String(c.meta), 'aria-valuenow': String(Math.min(c.moedas, c.meta)) },
            CE.el('span', { style: `width:${Math.min(100, (c.moedas / c.meta) * 100).toFixed(1)}%` })),
          CE.el('p', { class: 'pr-suave' }, `Cada aula concluída rende 4 moedas (${c.aulas} aulas da turma até agora).`),
          CE.el('h4', {}, vencedor ? 'A turma escolheu' : 'O que construir no Lote da turma?'),
          CE.el('div', { class: 'pr-votos' }, v.opcoes.map((o) => CE.el('button', {
            class: 'pr-voto' + (v.meu === o.id ? ' meu' : '') + (v.vencedor === o.id ? ' venceu' : ''), type: 'button', 'data-voto': o.id,
            'aria-pressed': String(v.meu === o.id), disabled: v.encerrada,
            onclick: async () => { const r = await chamar('praca:votar', v.meu === o.id ? null : o.id); if (r) { votacao = r; desenharCofre(); CE.emitir('praca:votou', { opcao: r.meu }); } },
          }, CE.el('span', {}, `${o.emoji} ${o.nome}`), CE.el('span', { class: 'n' }, `${o.votos} voto${o.votos === 1 ? '' : 's'}`), CE.el('span', { class: 'barra', style: `--p:${Math.round((o.votos / total) * 100)}%` })))),
          souInstrutor ? CE.el('div', { class: 'pr-botoes' }, v.encerrada
            ? CE.el('button', { class: 'botao secundario', type: 'button', 'data-acao': 'nova-votacao', onclick: async () => { const r = await chamar('praca:nova-votacao'); if (r) { votacao = r; desenharCofre(); } } }, 'Nova votação')
            : CE.el('button', { class: 'botao secundario', type: 'button', 'data-acao': 'encerrar-votacao', onclick: async () => { const r = await chamar('praca:encerrar-votacao'); if (r) { votacao = r; desenharCofre(); } } }, 'Encerrar a votação')) : null,
        ];
      }

      // ---------- A cidade da turma (prédios, Rua da Turma e Lote) ----------
      async function abrirCidade(aba) {
        if (aba) abaCidade = aba;
        const r = await chamar('praca:cidade', souInstrutor ? turmaEscolhida : undefined);
        if (!r || fechouJanela) return;
        infoCidade = r;
        if (abaCidade === 'lote' && !votacao) await carregarCofre();
        desenharCidadeDialogo();
      }
      function barrinha(feitos, precisa) {
        return CE.el('span', { class: 'pr-mini-barra', 'aria-hidden': 'true' }, CE.el('span', { style: `width:${Math.min(100, (feitos / Math.max(1, precisa)) * 100).toFixed(0)}%` }));
      }
      function desenharCidadeDialogo() {
        const r = infoCidade;
        if (!r) return;
        const acesas = r.lugares.filter((l) => l.aberto).length;
        const abas = CE.el('div', { class: 'pr-abas', role: 'tablist', 'aria-label': 'Partes da cidade' },
          [['predios', `🏗️ Prédios ${acesas}/${r.lugares.length}`], ['rua', '🏠 Rua da Turma'], ['lote', '🚧 Lote da turma']].map(([id, texto]) => CE.el('button', {
            class: 'pr-aba', type: 'button', role: 'tab', 'data-aba': id, 'aria-selected': String(abaCidade === id),
            onclick: () => { abaCidade = id; if (id === 'lote' && !votacao) carregarCofre().then(desenharCidadeDialogo); else desenharCidadeDialogo(); },
          }, texto)));
        let conteudo;
        if (abaCidade === 'rua') {
          const prontas = r.rua.filter((a) => a.casa).length;
          conteudo = [
            CE.el('p', { class: 'pr-suave' }, r.rua.length ? `${prontas} de ${r.rua.length} casas prontas. A casa fica pronta no primeiro módulo e ganha um enfeite por nível ou curso concluído.` : 'Ainda não há alunos nesta turma.'),
            CE.el('div', { class: 'pr-rua' }, r.rua.map((a) => CE.el('div', { class: 'pr-morada' + (a.id === usuario.id ? ' eu' : ''), 'data-morada': a.id },
              CE.el('span', { class: 'casa', 'aria-hidden': 'true' }, a.casa ? '🏠' : '🏗️'),
              CE.el('strong', {}, `${a.avatar || '🙂'} ${a.id === usuario.id ? 'Você' : a.nome}`),
              CE.el('span', { class: 'enfeites' }, a.casa ? (a.enfeites || 'casa pronta') : 'terreno'),
              a.moedas != null ? CE.el('span', { class: 'moedas', 'data-moedas': String(a.moedas) }, `💰 ${a.moedas}`) : null))),
            CE.el('p', { class: 'pr-suave pr-legenda' }, M.ENFEITES.map((e) => `${e.emoji} ${e.nome}`).join(' · ')),
          ];
        } else if (abaCidade === 'lote') conteudo = conteudoLote();
        else {
          conteudo = [CE.el('ul', { class: 'pr-predios' }, r.lugares.map((l) => {
            const L = M.porLugar[l.lugar];
            const falta = Math.max(0, r.precisa - l.feitos);
            return CE.el('li', {}, CE.el('button', {
              class: 'pr-predio' + (l.aberto ? '' : ' obra'), type: 'button', 'data-predio': l.lugar, title: 'Ir até ' + L.nome,
              onclick: () => { fecharDialogo(); if (!perto) mudarZoom(true); chegarAoLugar(L); },
            },
            CE.el('span', { class: 'ic', 'aria-hidden': 'true' }, l.aberto ? L.emoji : '🚧'),
            CE.el('span', { class: 'nome' }, nomeDoLugar(l.lugar)),
            CE.el('span', { class: 'estado' }, l.aberto ? '✅ Aceso' : `${l.feitos} de ${r.precisa}`),
            CE.el('span', { class: 'sub' }, l.aberto ? `Módulo ${l.titulo}` : [barrinha(l.feitos, r.precisa), `${l.titulo}: falta${falta === 1 ? '' : 'm'} ${falta}`],
              !souInstrutor && l.euFiz ? CE.el('span', { class: 'pr-fiz' }, ' · ✓ você já fez') : null)));
          }))];
        }
        let seletor = null;
        if (souInstrutor && r.turmas && r.turmas.length > 1) {
          const sel = CE.el('select', { 'aria-label': 'Turma', onchange: () => { turmaEscolhida = sel.value; abrirCidade(); sincronizar(); } },
            r.turmas.map((t) => CE.el('option', { value: t }, t || 'Sem turma')));
          sel.value = r.turma;
          seletor = CE.el('label', { class: 'pr-campo linha' }, 'Ver a turma', sel);
        }
        abrirDialogo({
          tipo: 'cidade', rosto: '🏙️', titulo: 'A cidade da turma',
          subtitulo: `${r.turma ? 'Turma ' + r.turma : 'Sem turma'} · ${r.alunos} aluno${r.alunos === 1 ? '' : 's'} · cada prédio acende quando ${r.precisa} concluírem o módulo dele`,
          extra: [seletor, abas, ...conteudo].filter(Boolean), opcoes: [{ rotulo: 'Fechar' }], foco: `[data-aba="${abaCidade}"]`,
        });
      }
      // Prédio em obra: quanto falta e o que cada um pode fazer.
      async function abrirObra(L) {
        const C = NA_CIDADE[L.id];
        const r = await chamar('praca:cidade', souInstrutor ? turmaEscolhida : undefined);
        if (!r || fechouJanela) return;
        infoCidade = r;
        const l = r.lugares.find((x) => x.lugar === L.id) || { feitos: 0 };
        if (l.aberto) { aplicarCidade({ turma: r.turma, abertos: r.lugares.filter((x) => x.aberto).map((x) => x.lugar) }); return abrirLugar(L); }
        const falta = Math.max(0, r.precisa - l.feitos);
        abrirDialogo({
          tipo: 'obra', rosto: '🚧', titulo: `${nomeDoLugar(L.id)}: em obra`, subtitulo: 'A cidade cresce com a turma',
          fala: `Este lugar acende quando metade da turma (${r.precisa} ${r.precisa === 1 ? 'aluno' : 'alunos'}) concluir o módulo “${C.titulo}”.`,
          extra: [
            CE.el('div', { class: 'pr-obra-conta' }, barrinha(l.feitos, r.precisa), CE.el('strong', {}, `${l.feitos} de ${r.precisa}`), CE.el('span', { class: 'pr-suave' }, falta ? `falta${falta === 1 ? '' : 'm'} ${falta}` : 'quase lá!')),
            souInstrutor ? null : CE.el('p', { class: 'pr-suave' }, l.euFiz ? '✓ Você já concluiu este módulo. Agora é ajudar os colegas!' : 'Você ainda não concluiu este módulo: cada aula sua ajuda a acender o prédio.'),
            pistaAqui(L.id) ? linhaPista(pistaAqui(L.id), 'Uma pista da novela está pregada no tapume da obra.') : null,
          ].filter(Boolean),
          opcoes: souInstrutor
            ? [{ rotulo: 'Ver a cidade da turma', principal: true, fica: true, acao: () => abrirCidade('predios') }, { rotulo: 'Fechar' }]
            : [{ rotulo: 'Ir para as Aulas', principal: true, id: 'aulas', acao: () => CE.janelas.abrir('aulas') }, { rotulo: 'Ver a cidade', fica: true, acao: () => abrirCidade('predios') }, { rotulo: 'Fechar' }],
        });
      }
      // Sua casa: o terreno, a casa pronta, os enfeites e as medalhas na parede.
      function abrirCasa() {
        CE.sessao.progresso().catch(() => ({})).then((p) => {
          const casa = minhaCasa || { casa: false, enfeites: '' };
          if (!casa.casa) {
            return abrirDialogo({ tipo: 'lugar', rosto: '🏗️', papelCor: 'eu', titulo: 'Seu terreno', subtitulo: 'Na Rua da Turma',
              fala: 'Aqui vai ser a sua casa! Ela fica pronta quando você concluir o módulo “Conhecendo o computador”.',
              opcoes: [{ rotulo: 'Ir para as Aulas', principal: true, id: 'aulas', acao: () => CE.janelas.abrir('aulas') }, { rotulo: 'Ver a Rua da Turma', fica: true, acao: () => abrirCidade('rua') }, { rotulo: 'Fechar' }] });
          }
          const minhas = (CE.MEDALHAS || []).filter((m) => p.medalhas && p.medalhas[m.id]);
          abrirDialogo({ tipo: 'lugar', rosto: '🏠', papelCor: 'eu', titulo: 'Sua casa', subtitulo: 'Na Rua da Turma', fala: LUGAR['sua-casa'].texto,
            extra: [
              minhas.length ? CE.el('p', { 'data-parede': String(minhas.length) }, `Na parede: ${minhas.slice(-12).map((m) => `${m.icone} ${m.nome}`).join(' · ')}${minhas.length > 12 ? ` e mais ${minhas.length - 12}` : ''}.`) : CE.el('p', { 'data-parede': '0' }, 'A parede ainda está vazia: as medalhas aparecem aqui conforme você ganha.'),
              CE.el('ul', { class: 'pr-enfeites' }, M.ENFEITES.map((e) => CE.el('li', { class: casa.enfeites.includes(e.emoji) ? 'tem' : '' }, `${e.emoji} ${e.nome}`, CE.el('span', {}, casa.enfeites.includes(e.emoji) ? ' ✓' : ''))))],
            nota: 'Cada nível ou curso que você termina dá um enfeite novo para a casa.',
            opcoes: [{ rotulo: 'Ver todas as medalhas (Aulas)', principal: true, acao: () => CE.janelas.abrir('aulas') }, { rotulo: 'Ver a Rua da Turma', fica: true, acao: () => abrirCidade('rua') }, { rotulo: 'Fechar' }] });
        });
      }

      // ---------- Diálogos ----------
      function abrirDialogo({ tipo, rosto, papelCor, titulo, subtitulo, fala, lista, nota, campo, extra, opcoes, foco }) {
        const botoes = (opcoes || [{ rotulo: 'Fechar' }]).map((op) => CE.el('button', {
          class: 'botao' + (op.principal ? '' : ' secundario'), type: 'button', 'data-opcao': op.id || null, disabled: !!op.desligado,
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
        mapa.classList.add('com-dialogo');
        fecharPopups();
        const alvo = (foco && dialogo.querySelector(foco)) || dialogo.querySelector('input:not([type="checkbox"])') || botoes[0];
        if (alvo) alvo.focus({ preventScroll: true });
      }
      function fecharDialogo() {
        if (dialogo.hidden) return;
        dialogo.hidden = true; dialogo.dataset.tipo = '';
        mapa.classList.remove('com-dialogo');
        mapa.focus({ preventScroll: true });
      }

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
        const casa = o.papel === 'instrutor' ? '' : o.casa ? ` · 🏠${o.enfeites ? ' ' + o.enfeites : ''}` : ' · 🏗️ terreno';
        abrirDialogo({
          tipo: 'pessoa', rosto: o.rostoEl.textContent, papelCor: tipo, titulo: o.nomeReal,
          subtitulo: (o.papel === 'instrutor' ? 'Instrutor da turma' : o.monitor ? 'Monitor(a) da turma' : `Colega da turma${o.turma ? ' · ' + o.turma : ''}${o.bot ? ' (de demonstração)' : ''}`) + casa,
          fala: o.mao ? `${o.nomeReal} levantou a mão: pediu ajuda.` : 'Diga alguma coisa: quem está perto vê no balão.',
          opcoes: [
            { rotulo: `Dizer oi para ${o.nomeReal}`, principal: true, acao: () => falar(`Oi, ${o.nomeReal}! 👋`) },
            { rotulo: 'Chamar para jogar', acao: () => falar(`${o.nomeReal}, vamos jogar jogo da velha?`) },
            { rotulo: 'Fechar' },
          ],
        });
      }

      // ---------- Lugares ----------
      function abrirLugar(L) {
        if (emergAtiva()) {
          const d = defEmerg();
          if (emerg.tipo === 'rio' && L.id === 'lote') return emerg.carregando ? balao(eu, 'Já estou com o saco! Agora: pôr na barreira.') : acaoEmerg('pegar');
          if (d.levar.pegar === L.id) return emerg.carregando ? balao(eu, `Já peguei! Agora: ${d.levar.entregarTexto.replace(/^\S+\s/, '').toLowerCase()}.`) : acaoEmerg('pegar');
          if (d.levar.entregar === L.id) return emerg.carregando ? acaoEmerg('entregar') : balao(eu, `Primeiro: ${d.levar.pegarTexto.replace(/^\S+\s/, '').toLowerCase()}!`);
        }
        const info = LUGAR[L.id] || {};
        if (NA_CIDADE[L.id] && !aceso(L.id)) return abrirObra(L);
        if (L.id === 'mesa-velha') return abrirMesa();
        if (L.id === 'mural') return abrirMural();
        if (L.id === 'lote') return abrirCidade('lote');
        if (RUA.includes(L.id) || (L.id === 'sua-casa' && souInstrutor)) return abrirCidade('rua');
        if (L.id === 'sua-casa') return abrirCasa();
        if (L.id === 'coreto') return abrirNovela();
        if (L.id === 'fonte') {
          return abrirDialogo({ tipo: 'lugar', rosto: '⛲', titulo: 'Fonte', subtitulo: 'No meio da praça', fala: info.texto,
            opcoes: [{ rotulo: 'Jogar uma moedinha e fazer um pedido', principal: true, acao: () => falar('✨ Fiz um pedido na fonte!') }, { rotulo: 'Fechar' }] });
        }
        const opcoes = [];
        if (info.botao) opcoes.push({ rotulo: info.botao, principal: true, id: 'entrar', acao: () => { info.abrir(); CE.emitir('praca:entrou-lugar', { lugar: L.id }); } });
        if (L.morador && presente(porMorador[L.morador])) opcoes.push({ rotulo: `Falar com ${porMorador[L.morador].nome}`, principal: !info.botao, acao: () => chegarPerto(porMorador[L.morador]) });
        opcoes.push({ rotulo: 'Fechar' });
        const mostrar = (funcoes) => abrirDialogo({ tipo: 'lugar', rosto: L.emoji, titulo: L.nome + (selos.has(L.id) ? ' ⭐' : ''), subtitulo: L.area ? 'Lugar da cidade' : 'Prédio da cidade', fala: info.texto, nota: info.embreve || null, extra: funcoes, opcoes });
        if (!NOV.temTarefa(L.id)) return mostrar(pistaAqui(L.id) ? [linhaPista(pistaAqui(L.id))] : null);
        // O que o lugar faz: a tarefa do dia, o desafio da turma na semana e, se tiver, a pista da novela.
        chamar('praca:tarefa', L.id).then((t) => {
          if (!t || fechouJanela) return;
          mostrar([linhaTarefa(L, t), linhaDesafio(t), pistaAqui(L.id) ? linhaPista(pistaAqui(L.id)) : null].filter(Boolean));
        });
      }
      function linhaTarefa(L, t) {
        return CE.el('div', { class: 'pr-funcao', 'data-funcao': 'tarefa' },
          CE.el('span', { class: 'ic', 'aria-hidden': 'true' }, '📝'),
          CE.el('div', { class: 'txt' }, CE.el('strong', {}, `Tarefa do dia: ${t.titulo}`),
            CE.el('span', { class: 'pr-suave' }, souInstrutor ? 'Veja como é a tarefa que a turma faz aqui hoje.' : t.feitaHoje ? '✓ Você já fez hoje. Amanhã tem outra.' : 'Rapidinha, ligada ao curso. Vale para o desafio da turma.')),
          CE.el('button', { class: 'botao' + (t.feitaHoje || souInstrutor ? ' secundario' : ''), type: 'button', 'data-opcao': 'tarefa', onclick: () => abrirTarefa(L) }, t.feitaHoje || souInstrutor ? 'Ver' : 'Fazer'));
      }
      function linhaDesafio(t) {
        const { feitas, meta, selo } = t.semana;
        return CE.el('div', { class: 'pr-funcao', 'data-funcao': 'desafio' },
          CE.el('span', { class: 'ic', 'aria-hidden': 'true' }, '⭐'),
          CE.el('div', { class: 'txt' }, CE.el('strong', {}, 'Desafio da turma nesta semana'),
            CE.el('span', { class: 'pr-suave linha' }, barrinha(Math.min(feitas, meta), meta), selo ? `Completo! A turma ganhou a ⭐ e ${40} moedas no cofre.` : `${feitas} de ${meta} tarefas feitas pela turma`)));
      }
      function linhaPista(p, texto) {
        return CE.el('div', { class: 'pr-funcao pista', 'data-funcao': 'pista' },
          CE.el('span', { class: 'ic', 'aria-hidden': 'true' }, '🔎'),
          CE.el('div', { class: 'txt' }, CE.el('strong', {}, `Pista da novela: ${p.titulo}`), CE.el('span', { class: 'pr-suave' }, texto || 'Uma pista do capítulo está aqui.')),
          CE.el('button', { class: 'botao', type: 'button', 'data-opcao': 'pista', onclick: () => abrirPista(p.id) }, 'Investigar'));
      }

      // ---------- Tarefas (do dia e pistas da novela): escolher, achar no papel ou digitar ----------
      function mostrarTarefa({ tipo, rosto, titulo, subtitulo, t, enviar, depois }) {
        const aviso = CE.el('p', { class: 'pr-erro', role: 'status' }); aviso.hidden = true;
        let enviando = false;
        async function responder(resposta, botao) {
          if (enviando) return;
          enviando = true;
          const r = await enviar(resposta).finally(() => { enviando = false; });
          if (!r || fechouJanela) return;
          if (!r.certo) {
            aviso.textContent = t.erro || (t.tipo === 'digitar' ? (t.numero ? 'Ainda não. Faça a conta de novo, com calma.' : 'Ainda não. Confira letra por letra: maiúsculas, acentos e pontuação.') : 'Ainda não. Leia de novo com calma e tente outra resposta.');
            aviso.hidden = false;
            if (botao) { botao.disabled = true; botao.classList.add('errada'); }
            const campo = dialogo.querySelector('#pr-campo-resposta');
            if (campo) campo.focus();
            return;
          }
          depois(r);
        }
        let corpo;
        if (t.tipo === 'escolha') corpo = [CE.el('div', { class: 'pr-respostas' }, t.opcoes.map((o, i) => { const b = CE.el('button', { class: 'pr-resposta', type: 'button', 'data-resposta': String(i), onclick: () => responder(i, b) }, o); return b; }))];
        else if (t.tipo === 'lista') corpo = [CE.el('ol', { class: 'pr-papel' }, t.itens.map((o, i) => { const b = CE.el('button', { type: 'button', 'data-resposta': String(i), onclick: () => responder(i, b) }, o); return CE.el('li', {}, b); }))];
        else {
          const campo = CE.el('input', { id: 'pr-campo-resposta', autocomplete: 'off', spellcheck: 'false', inputmode: t.numero ? 'decimal' : 'text', placeholder: t.dica || (t.numero ? 'Ex.: 5,00' : 'Digite aqui'), 'aria-label': 'Sua resposta' });
          corpo = [t.numero ? null : CE.el('p', { class: 'pr-modelo' }, t.modelo),
            CE.el('form', { class: 'pr-digitar', onsubmit: (e) => { e.preventDefault(); if (campo.value.trim()) responder(campo.value); } }, campo, CE.el('button', { class: 'botao', type: 'submit', 'data-opcao': 'conferir' }, t.botao || 'Conferir'))].filter(Boolean);
        }
        abrirDialogo({ tipo, rosto, titulo, subtitulo, fala: t.pergunta, extra: [...corpo, aviso], opcoes: [{ rotulo: 'Fechar' }] });
      }
      function mostrarAcerto({ tipo, titulo, subtitulo, explica, nota, voltar }) {
        abrirDialogo({ tipo, rosto: '✅', papelCor: 'certo', titulo, subtitulo, fala: explica, nota,
          opcoes: [voltar ? { rotulo: voltar.rotulo, principal: true, fica: true, id: 'continuar', acao: voltar.acao } : null, { rotulo: 'Fechar', principal: !voltar }].filter(Boolean) });
      }
      async function abrirTarefa(L) {
        const info = await chamar('praca:tarefa', L.id);
        if (!info || fechouJanela) return;
        mostrarTarefa({
          tipo: 'tarefa', rosto: '📝', titulo: `Tarefa do dia: ${info.titulo}`, subtitulo: nomeDoLugar(L.id), t: info.tarefa,
          enviar: (resposta) => chamar('praca:fazer-tarefa', L.id, resposta),
          depois: (r) => {
            if (r.contou) { contarTarefa(); CE.carteira.ganhar('tarefa', `Tarefa do dia: ${info.titulo}`, `tarefa:${L.id}:${r.dia}`); }
            mostrarAcerto({ tipo: 'tarefa', titulo: 'Certo!', subtitulo: `Tarefa do dia: ${info.titulo}`, explica: r.explica,
              nota: souInstrutor ? 'Instrutor: a resposta não conta para a turma.' : r.contou ? `+${CE.carteira.VALOR.tarefa} moedas 💰. Valeu para o desafio da turma: ${r.semana.feitas} de ${r.semana.meta} nesta semana.` : 'Você já tinha feito esta tarefa hoje: esta foi só de treino.',
              voltar: { rotulo: `Voltar para ${nomeDoLugar(L.id)}`, acao: () => abrirLugar(L) } });
            if (r.contou) sincronizar();
          },
        });
      }
      async function abrirPista(id) {
        const n = await chamar('praca:novela', souInstrutor ? turmaEscolhida : undefined);
        const p = n && n.atual && n.atual.pistas.find((x) => x.id === id);
        if (!p || fechouJanela) return;
        mostrarTarefa({
          tipo: 'pista', rosto: '🔎', titulo: `Pista: ${p.titulo}`, subtitulo: `${n.atual.emoji} ${n.atual.titulo} · ${nomeDoLugar(p.lugar)}`, t: p.tarefa,
          enviar: (resposta) => chamar('praca:resolver-pista', id, resposta),
          depois: (r) => {
            const a = r.novela.atual;
            if (r.contou) CE.carteira.ganhar('pista', `Pista da novela: ${p.titulo}`, `pista:${a.aberto}:${id}`);
            mostrarAcerto({ tipo: 'pista', titulo: 'Pista guardada!', subtitulo: `${a.emoji} ${a.titulo}`, explica: r.explica,
              nota: souInstrutor ? 'Instrutor: a resposta não conta para a turma.' : r.contou ? `+${CE.carteira.VALOR.pista} moedas 💰. A turma já juntou ${Math.min(a.total, a.meta)} de ${a.meta} pistas.${a.resolvido ? ' Todas as pistas foram achadas: o final sai no coreto!' : ''}` : 'Você já tinha achado esta pista.',
              voltar: { rotulo: 'Ver a novela', acao: () => abrirNovela() } });
            sincronizar();
          },
        });
      }

      // ---------- O coreto: a novela da cidade ----------
      async function abrirNovela() {
        const r = await chamar('praca:novela', souInstrutor ? turmaEscolhida : undefined);
        if (!r || fechouJanela) return;
        infoNovela = r;
        desenharNovela();
      }
      function desenharNovela() {
        const r = infoNovela, a = r.atual;
        const partes = [];
        if (!a) partes.push(CE.el('p', {}, souInstrutor ? 'Abra o primeiro capítulo: as pistas aparecem nos lugares do mapa (com 🔎) e a turma investiga junta. Um capítulo por semana funciona bem.' : 'A novela ainda não começou. O instrutor abre o capítulo aqui no coreto.'));
        else {
          partes.push(CE.el('h4', {}, `${a.emoji} ${a.titulo}`), CE.el('p', {}, a.abertura));
          partes.push(CE.el('ul', { class: 'pr-pistas' }, a.pistas.map((p) => CE.el('li', { class: p.euAchei ? 'achei' : '', 'data-pista': p.id },
            CE.el('span', { class: 'ic', 'aria-hidden': 'true' }, p.euAchei ? '✅' : '🔎'),
            CE.el('div', { class: 'txt' }, CE.el('strong', {}, p.titulo), CE.el('span', { class: 'pr-suave' }, `${nomeDoLugar(p.lugar)} · achada por ${p.achados} ${p.achados === 1 ? 'pessoa' : 'pessoas'}${p.euAchei ? ' (você também)' : ''}`)),
            a.revelado ? null : CE.el('button', { class: 'botao secundario', type: 'button', 'data-ir-pista': p.id, onclick: () => { fecharDialogo(); if (!perto) mudarZoom(true); chegarAoLugar(M.porLugar[p.lugar]); } }, 'Ir até lá')))));
          partes.push(CE.el('div', { class: 'pr-obra-conta' }, barrinha(Math.min(a.total, a.meta), a.meta), CE.el('strong', {}, `${Math.min(a.total, a.meta)} de ${a.meta} pistas`), CE.el('span', { class: 'pr-suave' }, 'juntadas pela turma')));
          if (a.revelado) partes.push(CE.el('div', { class: 'pr-final-texto' }, CE.el('strong', {}, '📖 O final'), CE.el('p', {}, a.final), CE.el('p', { class: 'pr-suave' }, `Moral da história: ${a.moral}`)));
          else if (a.resolvido) partes.push(CE.el('p', { class: 'pr-pronto' }, souInstrutor ? '🎉 A turma juntou as pistas! Revele o final para todos.' : '🎉 A turma juntou as pistas! O instrutor revela o final aqui no coreto.'));
        }
        if (souInstrutor) {
          partes.push(CE.el('h4', {}, 'Capítulos'), CE.el('ul', { class: 'pr-capitulos' }, r.capitulos.map((c) => CE.el('li', {},
            CE.el('span', {}, `${c.emoji} ${c.titulo}${c.feito ? ' ✓' : ''}${c.atual ? ' (aberto agora)' : ''}`),
            c.atual && !(a && a.revelado) ? null : CE.el('button', { class: 'botao secundario', type: 'button', 'data-capitulo': c.id, onclick: async () => {
              const x = await chamar('praca:abrir-capitulo', c.id, turmaEscolhida);
              if (x) { infoNovela = x; desenharNovela(); sincronizar(); }
            } }, 'Abrir')))));
        }
        const opcoes = [];
        if (souInstrutor && a && !a.revelado) opcoes.push({ rotulo: '📖 Revelar o final', principal: true, fica: true, id: 'revelar-final', desligado: !a.resolvido, acao: async () => {
          const x = await chamar('praca:revelar-final', turmaEscolhida);
          if (x) { infoNovela = x; fecharDialogo(); sincronizar(); }
        } });
        opcoes.push({ rotulo: '🎟️ Eventos especiais', id: 'loja', fica: true, acao: () => abrirLoja() });
        if (souInstrutor) opcoes.push({ rotulo: 'Abrir a gincana', id: 'gincana', acao: () => CE.janelas.abrir('gincana') }, { rotulo: 'Corrida de digitação', id: 'corrida', acao: () => CE.janelas.abrir('corrida') });
        opcoes.push({ rotulo: 'Fechar' });
        abrirDialogo({ tipo: 'novela', rosto: '🎭', titulo: 'A novela da cidade', subtitulo: `No coreto da praça${r.turma ? ' · turma ' + r.turma : ''}`, extra: partes,
          nota: souInstrutor ? null : 'Quando o instrutor abre uma gincana ou uma corrida de digitação, o convite também aparece na sua tela.', opcoes });
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
        for (const m of moradores) { if (!presente(m)) continue; const d = distancia(m, eu); if (d < menor) { menor = d; achado = { morador: m }; } }
        for (const o of outros.values()) { const d = distancia(o, eu); if (d < menor) { menor = d; achado = { pessoa: o }; } }
        if (achado) return achado;
        const [x, y] = M.maisPerto(eu.x, eu.y);
        if (Math.hypot(x - eu.x, y - eu.y) > 0.2) return null;
        for (const L of [...M.OBJETOS, ...M.LUGARES]) if (L.entradas && L.entradas.some(([a, b]) => a === x && b === y)) return { lugar: L };
        return null;
      }
      function interagir(a) {
        if (a.emergencia === 'poste') return balao(eu, '⚡ Água no poste, não! Água conduz eletricidade. Liguem 193: os Bombeiros desligam a energia.');
        if (a.emergencia === 'balde') return balao(eu, 'Primeiro, encho o balde na fonte! 💧');
        if (a.emergencia) return acaoEmerg(a.emergencia, { ...(a.foco ? { foco: a.foco.id } : {}), ...(a.queda ? { queda: a.queda.id } : {}) });
        if (a.morador) return abrirNo(a.morador.id, 'inicio');
        if (a.pessoa) return abrirPessoa(a.pessoa);
        if (a.lugar) return abrirLugar(a.lugar);
      }
      // O texto do botão que aparece em cima do boneco.
      function textoDaAcao(a) {
        if (a.emergencia) {
          const d = defEmerg();
          if (a.emergencia === 'pegar') return d.levar.pegarTexto;
          if (a.emergencia === 'entregar') return a.foco ? `💦 Jogar água ${emNome(a.foco.nome)}` : d.levar.entregarTexto;
          return { poste: '⚡ Fogo no poste: água, não!', balde: '💧 Primeiro, encha o balde na fonte', avisar: '📞 Avisar a Defesa Civil (199)' }[a.emergencia];
        }
        if (a.morador) return `💬 Conversar com ${a.morador.nome}`;
        if (a.pessoa) return `💬 Falar com ${a.pessoa.nomeReal}`;
        return textoDoLugar(a.lugar) + (pistaAqui(a.lugar.id) ? ' · 🔎 pista' : '');
      }
      function textoDoLugar(L) {
        if (NA_CIDADE[L.id] && !aceso(L.id)) return `🚧 Ver a obra: ${nomeDoLugar(L.id)}`;
        const fixo = { 'mesa-velha': '❌ Jogar jogo da velha', 'mesa-domino': '🎲 Ver a mesa de dominó', mural: '📌 Ler o mural', coreto: '🎭 Ver a novela no coreto', fonte: '⛲ Ver a fonte', lote: '🚧 Ver o Lote da turma', 'casa-ana': '🏠 Ver a Rua da Turma', 'casa-bruno': '🏠 Ver a Rua da Turma' }[L.id];
        if (fixo) return fixo;
        if (L.id === 'sua-casa') return souInstrutor ? '🏠 Ver a Rua da Turma' : minhaCasa && minhaCasa.casa ? '🏠 Entrar na sua casa' : '🏗️ Ver o seu terreno';
        return `${L.emoji} ${L.telhado ? 'Entrar: ' : 'Ver: '}${nomeDoLugar(L.id)}`;
      }
      let pertoAtual = null, pertoAlvo = null;
      function verPerto(forcar) {
        const z = zonaDaAcao();
        const a = z || oQueEstaPerto();
        const chave = a ? (a.emergencia ? 'e' + a.emergencia + emerg.tipo + (a.foco ? a.foco.id : '') + (a.queda ? a.queda.id : '') : a.morador ? 'm' + a.morador.id : a.pessoa ? 'p' + a.pessoa.id : 'l' + a.lugar.id) : '';
        if (chave === pertoAtual && !forcar) return;
        pertoAtual = chave; pertoAlvo = a;
        acao.hidden = !a;
        acao.classList.toggle('urgente', !!(a && a.emergencia));
        if (a) { acao.replaceChildren(CE.el('span', {}, textoDaAcao(a)), CE.el('kbd', {}, 'Enter')); posicionarAcao(); }
      }
      acao.addEventListener('click', () => { if (pertoAlvo) interagir(pertoAlvo); });
      // Em cima da cabeça (acima do balão, se o boneco estiver falando); perto da beirada de cima, vai para baixo.
      function posicionarAcao() {
        if (acao.hidden) return;
        const mostrar = perto && dialogo.hidden && !bloqueado();
        acao.classList.toggle('escondida', !mostrar);
        if (!mostrar) return;
        const cw = mapa.clientWidth, meia = acao.offsetWidth / 2, alto = acao.offsetHeight;
        const x = Math.max(meia + 8, Math.min(cw - meia - 8, cam.x + (eu.x + 0.5) * T * cam.s));
        let y = cam.y + (eu.y * T - 8) * cam.s - (eu.balaoEl ? eu.balaoEl.offsetHeight + 12 : 0);
        const embaixo = y - alto < 58;
        if (embaixo) y = cam.y + ((eu.y + 1) * T + 24) * cam.s;
        acao.classList.toggle('embaixo', embaixo);
        acao.style.transform = `translate(${Math.round(x - meia)}px, ${Math.round(embaixo ? y : y - alto)}px)`;
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
        fecharPopups();
        if (bloqueado()) return;
        const pessoaEl = e.target.closest('.pr-p');
        if (pessoaEl && pessoaEl.dataset.pessoa !== usuario.id) {
          const alvo = porMorador[pessoaEl.dataset.pessoa] || outros.get(pessoaEl.dataset.pessoa);
          if (alvo) return chegarPerto(alvo);
        }
        const r = mapa.getBoundingClientRect();
        const x = Math.floor((e.clientX - r.left - cam.x) / cam.s / T), y = Math.floor((e.clientY - r.top - cam.y) / cam.s / T);
        if (x < 0 || y < 0 || x >= W || y >= H) return;
        if (emergAtiva() && cliqueNoEvento(x, y)) return;
        const L = M.dono[y][x] && M.porLugar[M.dono[y][x]];
        if (L) { if (!perto) { for (const rt of Object.values(rotuloDe)) rt.classList.remove('destaque'); if (rotuloDe[L.id]) rotuloDe[L.id].classList.add('destaque'); } return chegarAoLugar(L); }
        if (M.andavel(x, y)) irPara([[x, y]]);
        else { const v = M.vizinhos(x, y); if (v.length) irPara(v); }
      });
      const SETAS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      const teclaDesce = (e) => {
        if (!janela.estaAtiva || !janela.estaAtiva()) { if (!mapa.contains(document.activeElement) && document.activeElement !== mapa) return; }
        if (e.key === 'Escape') {
          if (!finalEl.hidden) { finalEl.hidden = true; mapa.focus({ preventScroll: true }); return; }
          if (!dialogo.hidden) { fecharDialogo(); return; }
          if (!popGente.hidden || !popMegafone.hidden || !popEmerg.hidden || !popHora.hidden) { fecharPopups(); mapa.focus({ preventScroll: true }); return; }
          if (!chat.hidden) { abrirConversa(false); mapa.focus({ preventScroll: true }); return; }
        }
        if (e.target.closest('input, textarea, select') || !dialogo.hidden || bloqueado()) return;
        if (!mapa.contains(document.activeElement) && document.activeElement !== mapa) return;
        if (SETAS[e.key]) { e.preventDefault(); seta = SETAS[e.key]; eu.aoChegar = null; if (eu.caminho.length > 1) eu.caminho.length = 1; return; }
        if ((e.key === 'Enter' || e.key === 'e' || e.key === 'E') && e.target === mapa) { const a = oQueEstaPerto(); if (a) { e.preventDefault(); interagir(a); } }
      };
      const teclaSobe = (e) => { if (SETAS[e.key] && seta === SETAS[e.key]) seta = null; };
      document.addEventListener('keydown', teclaDesce);
      document.addEventListener('keyup', teclaSobe);
      mapa.addEventListener('blur', () => { seta = null; });
      const aoRedimensionar = new ResizeObserver(() => enquadrar());
      // O alarme do evento (e a faixa do evento especial) muda de tamanho: a cidade inteira se ajusta embaixo dele.
      aoRedimensionar.observe(emergEl); aoRedimensionar.observe(especialEl);
      aoRedimensionar.observe(mapa);

      // ---------- Laço ----------
      let antes = performance.now(), ultimoPerto = 0, ultimaSincronia = 0, quadroId = 0;
      function quadro(agora) {
        if (fechouJanela) return;
        const dt = Math.min(0.05, (agora - antes) / 1000); antes = agora;
        if (!bloqueado()) mover(dt);
        moverOutros(dt);
        if (perto) enquadrar();
        if (agora - ultimoPerto > 200) { ultimoPerto = agora; verPerto(); andarRelogio(); }
        posicionarAcao();
        const minimizada = janela.elemento ? janela.elemento.classList.contains('minimizada') : corpo.closest('.janela') && corpo.closest('.janela').classList.contains('minimizada');
        if (agora - ultimaSincronia > (minimizada ? SINCRONIA_LONGE : SINCRONIA)) { ultimaSincronia = agora; sincronizar(); }
        quadroId = requestAnimationFrame(quadro);
      }
      sistema('Você chegou na Praça Escola. Clique no chão para andar e chegue perto das pessoas para conversar.');
      verPerto(true);
      mostrarDica();
      enquadrar();
      sincronizar();
      CE.praca.informar();
      quadroId = requestAnimationFrame(quadro);

      return {
        receber() { mudarZoom(true); },
        aoFechar() {
          fechouJanela = true;
          limparVisual();
          M.definirBloqueios([], null);
          pracaNaTela = false;
          pararMoedas();
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
