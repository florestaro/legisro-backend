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
    lanchonete: { texto: 'O Restaurante do Digão! Aqui você comanda uma rede de lanchonetes inteira: o pasto e a plantação, o abatedouro, as lojas e a sede da marca. Cada decisão tem consequência: o lucro, as pessoas e a natureza.' },
    arena: { texto: 'A arena das bolinhas! Aqui é o Agar da Turma: cada um é uma bolinha que segue o mouse, come as bolinhas do chão para crescer e foge de quem é maior.' },
    cobrinha: { texto: 'A arena das cobrinhas! Aqui é a Cobrinha da Turma: cada um é uma cobrinha que segue o mouse, come as bolinhas para ficar comprida e quem bate a cabeça no corpo de outra perde.' },
    lote: { texto: 'Terreno da turma. Todos votam no que construir aqui; as moedas vêm das aulas concluídas.' },
    banco: { texto: 'O banco de treino: Pix, boleto, cartão e empréstimo, sem dinheiro de verdade.', botao: 'Entrar no Banco Escola', abrir: navegar('https://bancoescola.com.br') },
    correios: { texto: 'Mande uma carta para um colega: ela chega no E-mail dele.', botao: 'Escrever uma carta (E-mail)', abrir: () => CE.janelas.abrir('email') },
    prefeitura: { texto: 'Serviços públicos de treino: CPF, Carteira de Trabalho, documentos e assinatura.', botao: 'Entrar no Cidadão Digital', abrir: navegar('https://cidadaodigital.org.br') },
    posto: { texto: 'Agendar consulta (de treino, como no aplicativo da saúde) e aprender a reconhecer mensagem falsa de saúde.' },
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
  // Cada lixo separado na lixeira certa conta para a medalha ♻️ Cidade limpa (10).
  async function contarReciclagem() {
    if (!CE.sessao.usuario) return;
    let total = 0;
    await CE.sessao.atualizarProgresso((p) => { p.praca = p.praca || {}; p.praca.reciclou = total = (Number(p.praca.reciclou) || 0) + 1; }).catch(() => {});
    if (total >= 10) CE.emitir('praca:conquista', { id: 'reciclou' });
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

  // As cores do chão da cidade: o desenho abaixo e a abertura em pontos (a maquete) usam as mesmas.
  const COR_DO_CHAO = { grama: '#8DBE5A', rua: '#5E6468', calcada: '#D9D1C0', praca: '#ECDFC0', terra: '#C47A48', horta: '#6E4B2E', lote: '#C98E5E', plataforma: '#C8C0B0', trilho: '#9D9285', areia: '#E9D49F', agua: '#8A6C45', pier: '#9C6E44' };
  // As cores dos detalhes, tiradas do mesmo desenho, para a maquete da abertura (app/js/praca-abertura3d.js).
  // Os prédios usam o telhado e a parede de cada um, que ficam no mapa (app/js/praca-mapa.js).
  const CORES_DA_MAQUETE = {
    chao: COR_DO_CHAO, ruaBorda: '#4C5155', faixa: '#F0CF57', pracaAneis: ['#E5D4AE', '#EFE3C6'], pracaBorda: '#C2AE84',
    dormente: '#6B4A33', trilho: '#C9CED3', plataformaBeira: '#E3C23A', horta: ['#5A3A22', '#7A5233'], hortaBorda: '#A07848',
    loteBorda: '#7A4E2A', montes: ['#B07A4E', '#A86F44'], balcao: '#8A5A35', porta: '#5B3A22', janela: '#7FB3CF', cruz: '#2E8B57',
    arvore: ['#4E9A43', '#2F6E2A'], ipeAmarelo: ['#F2C12E', '#C5960F', '#FFE27A'], ipeRoxo: ['#C2569E', '#8C3A72', '#F0A6D6'],
    palmeira: '#3F8F3A', coco: '#7A5A2E', coretoPiso: '#C89A62', coretoBeira: '#F4EFE6', coretoEscada: '#E8E0D2',
    fontePedra: '#CDBF9E', fonteAgua: '#7CC4E2', bancoEncosto: '#7A4E2A', bancoAssento: '#A26C3D', mesa: '#B7834A', mesaPe: '#6E4B2E',
    muralMoldura: '#8A5A35', muralFundo: '#C9A06A', notas: ['#FFF39A', '#BFE2FF', '#FFC9D6', '#CFF2C7', '#FFF39A'],
    poste: '#5B6168', luz: '#F6E27A', lampiao: '#4E5459', lampiaoLuz: '#F6E58A', obra: '#CEC5B2', obraFaixa: ['#F5B400', '#2B2B2B'],
  };

  // ================= Desenho da cidade (uma vez, num canvas com o dobro de pontos) =================
  // iso: a Praça em 3D (isométrica, app/js/praca-iso.js). Aí o chão é o mesmo, mas o que fica em pé (prédios,
  // árvores, bancos, lixeiras, barracas, postes, mural e as plantas da horta) sai daqui e é desenhado em pé.
  function desenharCidade(tela, iso) {
    const Q = Math.min(3, Math.max(2, Math.ceil((window.devicePixelRatio || 1) * 2)));
    tela.width = W * T * Q; tela.height = H * T * Q;
    const g = tela.getContext('2d');
    g.scale(Q, Q);
    g.imageSmoothingQuality = 'high';
    let semente = 20251113;
    const acaso = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
    const tom = (hex, q) => {
      const n = parseInt(hex.slice(1), 16); const f = (c) => Math.max(0, Math.min(255, Math.round(c + q)));
      return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
    };
    const COR = COR_DO_CHAO;
    const circulo = (x, y, r, cor) => { g.fillStyle = cor; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
    const emoji = (txt, x, y, tam) => { g.font = `${tam}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, x, y); };
    const ret = (x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
    const { chao } = M;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = chao[y][x];
      g.fillStyle = t === 'grama' ? tom(COR.grama, (acaso() - 0.5) * 12) : t === 'calcada' ? tom(COR.calcada, (x + y) % 2 ? -6 : 3) : COR[t];
      g.fillRect(x * T, y * T, T, T);
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = chao[y][x], X = x * T, Y = y * T;
      if (t === 'grama') {
        for (let k = 0; k < 2; k++) { g.fillStyle = acaso() < 0.5 ? 'rgba(70, 120, 40, .13)' : 'rgba(190, 225, 130, .16)'; g.beginPath(); g.ellipse(X + acaso() * T, Y + acaso() * T, 6 + acaso() * 9, 4 + acaso() * 6, acaso() * 3, 0, Math.PI * 2); g.fill(); }
        g.lineWidth = 1.2; g.lineCap = 'round';
        for (let k = 0; k < 7; k++) {
          const tx = X + 3 + acaso() * 34, ty = Y + 5 + acaso() * 32;
          g.strokeStyle = acaso() < 0.5 ? '#6E9F42' : '#A9D272';
          g.beginPath(); g.moveTo(tx - 2, ty - 3); g.lineTo(tx, ty); g.lineTo(tx + 2, ty - 4); g.stroke();
        }
        if (acaso() < 0.08) { const fx = X + 8 + acaso() * 24, fy = Y + 8 + acaso() * 24, cor = ['#FFFFFF', '#FFE45C', '#F49AC1'][Math.floor(acaso() * 3)]; for (const [dx, dy] of [[0, 0], [5, 3], [-4, 4]]) { circulo(fx + dx, fy + dy, 2, cor); circulo(fx + dx, fy + dy, 0.9, '#E8A21A'); } }
      }
      if (t === 'calcada') {
        g.strokeStyle = 'rgba(90, 76, 50, .18)'; g.lineWidth = 1; g.strokeRect(X + 0.5, Y + 0.5, T - 1, T - 1);
        g.beginPath(); g.moveTo(X + T / 2, Y); g.lineTo(X + T / 2, Y + T); g.moveTo(X, Y + T / 2); g.lineTo(X + T, Y + T / 2); g.stroke();
        g.strokeStyle = 'rgba(255, 255, 255, .35)'; g.beginPath(); g.moveTo(X + 1.5, Y + T / 2 - 1); g.lineTo(X + 1.5, Y + 1.5); g.lineTo(X + T / 2 - 1, Y + 1.5); g.moveTo(X + T / 2 + 1.5, Y + T - 1); g.lineTo(X + T / 2 + 1.5, Y + T / 2 + 1.5); g.lineTo(X + T - 1, Y + T / 2 + 1.5); g.stroke();
      }
      if (t === 'terra' || t === 'lote') for (let k = 0; k < 10; k++) { g.fillStyle = acaso() < 0.5 ? 'rgba(120, 50, 20, .25)' : 'rgba(255, 220, 180, .25)'; g.fillRect(X + acaso() * 37, Y + acaso() * 37, 2 + acaso() * 2, 2 + acaso() * 2); }
      if (t === 'areia') {
        for (let k = 0; k < 8; k++) { g.fillStyle = 'rgba(160, 120, 60, .25)'; g.fillRect(X + acaso() * 37, Y + acaso() * 37, 2, 2); }
        g.strokeStyle = 'rgba(175, 140, 80, .35)'; g.lineWidth = 1;
        for (const yy of [Y + 13, Y + 28]) { g.beginPath(); for (let k = 0; k <= T; k += 4) { const py = yy + Math.sin((X + k) / 6) * 1.6; if (k) g.lineTo(X + k, py); else g.moveTo(X + k, py); } g.stroke(); }
      }
      if (t === 'plataforma') {
        g.strokeStyle = 'rgba(0, 0, 0, .13)'; g.lineWidth = 1;
        for (let k = 0; k < 4; k++) { const yy = Y + k * 10 + 0.5; g.beginPath(); g.moveTo(X, yy); g.lineTo(X + T, yy); g.stroke(); const off = k % 2 ? 10 : 0; for (let bx = X + off; bx < X + T; bx += 20) { g.beginPath(); g.moveTo(bx + 0.5, yy); g.lineTo(bx + 0.5, yy + 10); g.stroke(); } }
      }
      if (t === 'rua') {
        for (let k = 0; k < 26; k++) { g.fillStyle = acaso() < 0.5 ? 'rgba(255, 255, 255, .07)' : 'rgba(0, 0, 0, .1)'; g.fillRect(X + acaso() * 39, Y + acaso() * 39, 1.5, 1.5); }
        if (acaso() < 0.06) { g.strokeStyle = 'rgba(0, 0, 0, .22)'; g.lineWidth = 1; g.beginPath(); let cx = X + 6 + acaso() * 20, cy = Y + 6 + acaso() * 20; g.moveTo(cx, cy); for (let k = 0; k < 4; k++) { cx += 3 + acaso() * 5; cy += (acaso() - 0.5) * 8; g.lineTo(cx, cy); } g.stroke(); }
      }
      if (t === 'rua') {
        g.fillStyle = '#4C5155';
        if (y > 0 && chao[y - 1][x] !== 'rua') g.fillRect(X, Y, T, 3);
        if (y < H - 1 && chao[y + 1][x] !== 'rua') g.fillRect(X, Y + T - 3, T, 3);
        if (x > 0 && chao[y][x - 1] !== 'rua') g.fillRect(X, Y, 3, T);
        if (x < W - 1 && chao[y][x + 1] !== 'rua') g.fillRect(X + T - 3, Y, 3, T);
      }
    }
    for (const [x, y] of [[3, 5], [21, 5], [33, 6], [9, 12], [26, 9], [6, 19], [21, 20], [30, 19]]) {
      const cx = x * T + T / 2, cy = y * T + T / 2;
      circulo(cx, cy, 8, '#3F4448'); circulo(cx, cy, 6.5, '#555B60');
      g.strokeStyle = '#3F4448'; g.lineWidth = 1; for (let k = -4; k <= 4; k += 2.6) { g.beginPath(); g.moveTo(cx - 5, cy + k); g.lineTo(cx + 5, cy + k); g.stroke(); }
    }
    const lampiao = (px, py) => {
      g.fillStyle = 'rgba(0, 0, 0, .2)'; g.beginPath(); g.ellipse(px + 3, py + 4, 5, 3, 0, 0, Math.PI * 2); g.fill();
      circulo(px, py, 3.2, '#4E5459');
      const brilho = g.createRadialGradient(px - 6, py - 7, 0, px - 6, py - 7, 9); brilho.addColorStop(0, 'rgba(255, 240, 170, .55)'); brilho.addColorStop(1, 'rgba(255, 240, 170, 0)');
      g.fillStyle = brilho; g.fillRect(px - 15, py - 16, 18, 18);
      g.strokeStyle = '#4E5459'; g.lineWidth = 2; g.beginPath(); g.moveTo(px, py); g.lineTo(px - 6, py - 7); g.stroke();
      circulo(px - 6, py - 7, 3, '#F6E58A');
    };
    if (!iso) {
      for (const x of [2, 13, 21, 29, 34]) lampiao(x * T + 6, 4 * T + T - 4);
      for (const x of [2, 13, 21, 29, 34]) lampiao(x * T + 6, 18 * T + T - 4);
      for (const x of [3, 14, 23, 33]) lampiao(x * T + 6, 21 * T + T - 4);
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
    if (!iso) ['🥬', '🌽', '🍅'].forEach((planta, k) => { for (let i = 0; i < 6; i++) emoji(planta, 12 * T + 18 + i * 31, 22 * T + 20 + k * T, 18); });
    g.setLineDash([6, 5]); g.strokeStyle = '#7A4E2A'; g.lineWidth = 3; g.strokeRect(31 * T + 3, 1 * T + 3, 4 * T - 6, 3 * T - 6); g.setLineDash([]);
    circulo(32 * T + 6, 2 * T + 30, 12, '#B07A4E'); circulo(34 * T + 6, 3 * T + 4, 9, '#A86F44');
    // Feira
    if (!iso) for (const [x, y, cor] of M.BARRACAS) {
      const X = x * T, Y = y * T;
      g.fillStyle = 'rgba(0, 0, 0, .2)'; g.fillRect(X + 4, Y + 6, T, T);
      for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? '#FFFFFF' : cor; g.fillRect(X + k * 8, Y, 8, 22); }
      g.fillStyle = '#8A5A35'; g.fillRect(X, Y + 22, T, 18);
    }
    if (!iso) ['🍍', '🍌', '🥭', '🌽', '🐟'].forEach((f, i) => emoji(f, M.BARRACAS[i][0] * T + T / 2, 22 * T + 31, 15));
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
    if (!iso) for (const [x, y] of M.BANCOS) {
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
    // Coleta seletiva: cinco lixeiras coloridas com tampa e o símbolo da reciclagem
    if (!iso) for (const L of M.OBJETOS.filter((o) => o.coleta)) {
      const X = L.r[0] * T, Y = L.r[1] * T;
      g.fillStyle = 'rgba(0, 0, 0, .22)'; g.fillRect(X + 9, Y + 12, 26, 26);
      const gb = g.createLinearGradient(X + 6, 0, X + 34, 0); gb.addColorStop(0, tom(L.cor, 25)); gb.addColorStop(1, tom(L.cor, -25));
      g.fillStyle = gb; ret(X + 7, Y + 8, 26, 27, 4); g.fill();
      g.fillStyle = tom(L.cor, -40); ret(X + 5, Y + 4, 30, 7, 3); g.fill();
      g.fillStyle = 'rgba(255, 255, 255, .35)'; g.fillRect(X + 9, Y + 12, 3, 20);
      emoji('♻️', X + 20, Y + 23, 14);
    }
    // Poste de luz (na calçada da praça, perto da lata de lixo)
    if (!iso) {
      const cx = M.POSTE[0] * T + T / 2, cy = M.POSTE[1] * T + T / 2;
      g.fillStyle = 'rgba(0, 0, 0, .22)'; g.beginPath(); g.ellipse(cx + 4, cy + 6, 9, 5, 0, 0, Math.PI * 2); g.fill();
      circulo(cx, cy, 7, '#5B6168'); circulo(cx, cy, 4, '#8A9199');
      g.strokeStyle = '#5B6168'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - 11, cy - 9); g.stroke();
      circulo(cx - 12, cy - 10, 6, '#F6E27A'); circulo(cx - 12, cy - 10, 2.5, '#FFFBE0');
    }
    const mx = 21 * T, my = 8 * T;
    if (!iso) {
    g.fillStyle = 'rgba(0, 0, 0, .2)'; g.fillRect(mx + 7, my + 9, 2 * T - 10, 26);
    g.fillStyle = '#8A5A35'; g.fillRect(mx + 4, my + 5, 2 * T - 8, 26);
    g.fillStyle = '#C9A06A'; g.fillRect(mx + 7, my + 8, 2 * T - 14, 20);
    ['#FFF39A', '#BFE2FF', '#FFC9D6', '#CFF2C7', '#FFF39A'].forEach((c, i) => { g.fillStyle = c; g.fillRect(mx + 10 + i * 13, my + 11 + (i % 2) * 5, 10, 10); });
    }
    // Prédios
    if (!iso) for (const L of M.LUGARES) {
      if (!L.telhado) continue;
      const [x, y, w, h] = L.r;
      const X = x * T, Y = y * T, PW = w * T, PH = h * T;
      const paredeH = Math.round(T * 1.1), telhadoH = PH - paredeH, topo = Y + telhadoH;
      g.save(); g.shadowColor = 'rgba(15, 25, 15, .35)'; g.shadowBlur = 12; g.shadowOffsetX = 6; g.shadowOffsetY = 8;
      g.fillStyle = L.parede; g.fillRect(X, Y, PW, PH); g.restore();
      const gt = g.createLinearGradient(0, Y, 0, Y + telhadoH);
      gt.addColorStop(0, tom(L.telhado, 30)); gt.addColorStop(0.5, tom(L.telhado, 8)); gt.addColorStop(0.51, L.telhado); gt.addColorStop(1, tom(L.telhado, -18));
      g.fillStyle = gt; g.fillRect(X, Y, PW, telhadoH);
      // telhas: fileiras de meia-lua, uma fileira deslocada da outra
      g.strokeStyle = tom(L.telhado, -30); g.lineWidth = 1;
      for (let k = Y + 6, f = 0; k < Y + telhadoH - 4; k += 7, f++) {
        g.beginPath(); g.moveTo(X, k + 0.5); g.lineTo(X + PW, k + 0.5); g.stroke();
        g.beginPath(); for (let sx = X + (f % 2 ? 4 : 0); sx < X + PW; sx += 8) { g.moveTo(sx + 8, k + 0.5); g.arc(sx + 4, k + 0.5, 4, 0, Math.PI); } g.stroke();
      }
      if (L.casa) { const cx = X + PW - 16; g.fillStyle = tom(L.parede, -55); g.fillRect(cx, Y + 3, 9, 12); g.fillStyle = tom(L.parede, -75); g.fillRect(cx - 1, Y + 2, 11, 3); }
      g.fillStyle = tom(L.telhado, 40); g.fillRect(X, Y + telhadoH / 2 - 2, PW, 3);
      g.fillStyle = tom(L.telhado, -42); g.fillRect(X - 2, Y + telhadoH - 4, PW + 4, 5);
      const gp = g.createLinearGradient(0, topo, 0, topo + paredeH); gp.addColorStop(0, tom(L.parede, -4)); gp.addColorStop(1, tom(L.parede, -18));
      g.fillStyle = gp; g.fillRect(X, topo, PW, paredeH);
      g.fillStyle = tom(L.parede, -45); g.fillRect(X, Y + PH - 5, PW, 5);
      g.fillStyle = 'rgba(255, 255, 255, .25)'; g.fillRect(X, topo, PW, 1.5);
      for (let i = 0; i < w; i++) {
        const cx = X + i * T + T / 2;
        if (L.colunas) { g.fillStyle = '#FFFFFF'; g.fillRect(X + i * T, topo, 5, paredeH); g.fillStyle = 'rgba(0, 0, 0, .08)'; g.fillRect(X + i * T + 5, topo, 2, paredeH); }
        if (L.portas.includes(x + i)) {
          g.fillStyle = tom(L.parede, -60); g.fillRect(cx - 13, topo + 5, 26, paredeH - 5);
          g.fillStyle = '#5B3A22'; g.fillRect(cx - 11, topo + 7, 22, paredeH - 7);
          g.fillStyle = '#8B5B36'; g.fillRect(cx - 9, topo + 9, 8, paredeH - 11); g.fillRect(cx + 1, topo + 9, 8, paredeH - 11);
          g.fillStyle = 'rgba(255, 255, 255, .18)'; g.fillRect(cx - 9, topo + 9, 2, paredeH - 11); g.fillRect(cx + 1, topo + 9, 2, paredeH - 11);
          g.fillStyle = '#E8C35A'; g.fillRect(cx - 3, topo + paredeH / 2 + 3, 2, 3); g.fillRect(cx + 2, topo + paredeH / 2 + 3, 2, 3);
          g.fillStyle = '#B9B2A4'; g.fillRect(cx - 14, Y + PH - 1, 28, 4);
        } else {
          g.fillStyle = '#F5F1E8'; g.fillRect(cx - 11, topo + 8, 22, 21);
          const gv = g.createLinearGradient(0, topo + 10, 0, topo + 27); gv.addColorStop(0, '#CDE9F6'); gv.addColorStop(1, '#7FB3CF');
          g.fillStyle = gv; g.fillRect(cx - 9, topo + 10, 18, 17);
          g.fillStyle = 'rgba(255, 255, 255, .55)'; g.beginPath(); g.moveTo(cx - 9, topo + 10); g.lineTo(cx - 2, topo + 10); g.lineTo(cx - 9, topo + 20); g.closePath(); g.fill();
          g.fillStyle = '#F5F1E8'; g.fillRect(cx - 0.75, topo + 10, 1.5, 17); g.fillRect(cx - 9, topo + 17.5, 18, 1.5);
          const cortina = ['#E57373', '#7FA7E0', '#F2C14E', '#8CC084'][(x + i) % 4];
          g.fillStyle = cortina; g.beginPath(); g.moveTo(cx - 9, topo + 10); g.lineTo(cx - 4, topo + 10); g.lineTo(cx - 9, topo + 16); g.closePath(); g.fill();
          g.beginPath(); g.moveTo(cx + 9, topo + 10); g.lineTo(cx + 4, topo + 10); g.lineTo(cx + 9, topo + 16); g.closePath(); g.fill();
          g.fillStyle = tom(L.parede, -50); g.fillRect(cx - 12, topo + 29, 24, 2.5);
        }
      }
      // A lanchonete e a arena: o toldo em cima da fachada e o letreiro redondo no telhado (o fundo dele é vermelho,
      // menos onde o lugar escolhe outro: a arena é azul).
      if (L.faixa) { g.fillStyle = L.faixa; g.fillRect(X - 2, topo, PW + 4, 6); g.fillStyle = 'rgba(0, 0, 0, .15)'; g.fillRect(X - 2, topo + 6, PW + 4, 2); }
      if (L.placa) { const cx = X + PW / 2, cy = Y + telhadoH / 2; circulo(cx, cy, 16, L.faixa || '#F2B705'); circulo(cx, cy, 13, L.placaFundo || '#C62828'); emoji(L.placa, cx, cy + 1, 17); }
      if (L.cruz) { const cx = X + PW - 28, cy = Y + telhadoH / 2; circulo(cx, cy, 14, '#FFFFFF'); g.fillStyle = '#2E8B57'; g.fillRect(cx - 3, cy - 9, 6, 18); g.fillRect(cx - 9, cy - 3, 18, 6); }
    }
    // Árvores, ipês e palmeiras (na Praça em 3D, elas ficam em pé; aqui no chão fica só a sombra)
    if (iso) {
      for (const [x, y] of [...M.ARVORES, ...M.IPES, ...M.PALMEIRAS]) { g.save(); g.filter = 'blur(2px)'; g.fillStyle = 'rgba(0, 0, 0, .22)'; g.beginPath(); g.ellipse(x * T + T / 2 + 4, y * T + T / 2 + 4, 17, 17, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
      for (const L of M.LUGARES) if (L.telhado) { const [x, y, w, h] = L.r; g.fillStyle = 'rgba(0, 0, 0, .16)'; g.fillRect(x * T - 3, y * T - 3, w * T + 10, h * T + 10); }
      return;
    }
    const arvore = (x, y, cor, escura, flor) => {
      const cx = x * T + T / 2, cy = y * T + T / 2;
      g.save(); g.filter = 'blur(2px)'; g.fillStyle = 'rgba(0, 0, 0, .28)'; g.beginPath(); g.ellipse(cx + 6, cy + 10, 19, 12, 0, 0, Math.PI * 2); g.fill(); g.restore();
      circulo(cx, cy, 19, escura);
      for (const [dx, dy, r] of [[-8, -5, 12], [7, -7, 12], [-6, 7, 11], [8, 6, 11], [0, 0, 13]]) {
        const gc = g.createRadialGradient(cx + dx - r * 0.35, cy + dy - 2 - r * 0.45, r * 0.15, cx + dx, cy + dy - 2, r);
        gc.addColorStop(0, tom(cor, 38)); gc.addColorStop(0.6, cor); gc.addColorStop(1, tom(cor, -22));
        g.fillStyle = gc; g.beginPath(); g.arc(cx + dx, cy + dy - 2, r, 0, Math.PI * 2); g.fill();
      }
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
      // Na Praça em 3D (isométrica): os prédios, as árvores e o que fica em pé (app/js/praca-iso.js).
      const camadaIso = CE.el('div', { class: 'pr-camada pr-camada-iso' });
      const camadaObjetos = CE.el('div', { class: 'pr-camada', 'aria-hidden': 'true' });
      const camadaRotulos = CE.el('div', { class: 'pr-camada', 'aria-hidden': 'true' });
      const camadaGente = CE.el('div', { class: 'pr-camada' });
      const mundo = CE.el('div', { class: 'pr-mundo' }, tela, camadaIso, camadaObjetos, camadaRotulos, camadaGente);

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
      // O relógio do dia da cidade (8h às 18h em 15 minutos) e o quadro de vagas de emprego.
      const botaoRelogio = CE.el('button', { class: 'pr-pilula relogio', type: 'button', 'data-acao': 'relogio', title: 'O dia na cidade: das 8h às 18h' }, '🕗 8:00');
      const botaoVagas = CE.el('button', { class: 'pr-pilula vagas', type: 'button', 'data-acao': 'vagas', title: 'Vagas de emprego da cidade' }, '💼 Vagas');
      const topoEsq = CE.el('div', { class: 'pr-hud pr-topo-esq' }, botaoGente, botaoRelogio, botaoCidade, botaoNovela, botaoMoedas, botaoVagas, botaoHora, popGente);

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
      // 🧊 / 🗺️ A Praça da turma em 3D (isométrica) ou 2D (de cima); também no Painel do Instrutor.
      const btVisual = comando('visual', '🗺️', 'Praça em 2D (de cima)', () => chamar('praca:configurar', { visual: visao === 'iso' ? '2d' : 'iso' }).then(sincronizar));
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
      const comandos = souInstrutor ? CE.el('div', { class: 'pr-comandos', 'data-pr': 'instrutor' }, btMegafone, btChamar, btAbrir, btFrases, btVisual, btEmerg, btHora, popMegafone, popEmerg, popHora) : null;
      const botaoGiroEsq = CE.el('button', { class: 'pr-pilula escura pr-giro', type: 'button', 'data-acao': 'girar-esq', title: 'Girar a cidade', 'aria-label': 'Girar a cidade para a esquerda' }, '↺');
      const botaoGiroDir = CE.el('button', { class: 'pr-pilula escura pr-giro', type: 'button', 'data-acao': 'girar-dir', title: 'Girar a cidade', 'aria-label': 'Girar a cidade para a direita' }, '↻');
      const giros = CE.el('div', { class: 'pr-giros' }, botaoGiroEsq, botaoGiroDir);
      // De perto, só aparece o nome do que está perto do boneco ou embaixo do mouse; este botão mostra todos.
      const botaoNomes = CE.el('button', { class: 'pr-pilula escura pr-giro', type: 'button', 'data-acao': 'todos-nomes', title: 'Mostrar o nome de tudo', 'aria-label': 'Mostrar o nome de tudo', 'aria-pressed': 'false' }, '🏷️');
      const topoDir = CE.el('div', { class: 'pr-hud pr-topo-dir' }, CE.el('div', { class: 'pr-topo-dir-linha' }, giros, botaoNomes, botaoMapa), comandos);

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
      const luzEl = CE.el('div', { class: 'pr-luz', 'aria-hidden': 'true' });
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
        mundo, luzEl, chuvaEl, fogosEl, acao, topoEsq, topoDir, centro, avisoRede, chat, baixo, bingoEl, dica, dialogo, finalEl, fechadaEl);
      // Clique nos botões e janelinhas não é clique no chão (um botão que redesenha a janelinha some antes de o
      // clique chegar ao mapa, e aí o boneco sairia andando).
      for (const camada of [topoEsq, topoDir, centro, avisoRede, chat, baixo, bingoEl, acao, dialogo, finalEl, fechadaEl]) camada.addEventListener('click', (e) => e.stopPropagation());
      corpo.replaceChildren(CE.el('div', { class: 'pr-caixa' }, mapa));
      // ---------- Praça em 3D (isométrica) ou 2D (de cima): o instrutor escolhe para a turma (Painel do Instrutor);
      // este computador lembra a última escolha e o giro da cidade. ----------
      const lerLocal = (k, padrao) => { try { const v = localStorage.getItem(k); return v == null ? padrao : v; } catch (e) { return padrao; } };
      const gravarLocal = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem localStorage */ } };
      let visao = lerLocal('ce-praca-visual', 'iso') === '2d' ? '2d' : 'iso';
      let iso = visao === 'iso' && !!CE.pracaIso;
      let giro = Number(lerLocal('ce-praca-giro', '0')) || 0;
      let cena = null;
      desenharCidade(tela, iso);

      // ---------- Rótulos e objetos do mapa ----------
      const rotuloDe = {};
      const rotulo = (texto, x, y, classe) => { const r = CE.el('div', { class: 'pr-rotulo' + (classe ? ' ' + classe : ''), style: `left:${x}px;top:${y}px`, 'data-x': String(x), 'data-y': String(y) }, texto); camadaRotulos.append(r); return r; };
      const nomeNoRotulo = (L) => (L.id === 'rio' ? 'Rio Madeira' : L.casa ? (L.id === 'sua-casa' && !souInstrutor ? 'Sua casa' : 'Casa') : L.nome);
      for (const L of M.LUGARES) {
        const [x, y, w, h] = L.r;
        const pos = { feira: [5.5 * T, 24.6 * T], rio: [18 * T, 28.5 * T], lote: [33 * T, 1.3 * T] }[L.id]
          || [(x + w / 2 + (L.rotuloDx || 0)) * T, L.telhado ? y * T + (h * T - Math.round(T * 1.1)) / 2 : (y + h / 2) * T];
        rotuloDe[L.id] = rotulo(`${L.emoji} ${nomeNoRotulo(L)}`, pos[0], pos[1], L.casa ? 'pequeno' : '');
        rotuloDe[L.id].dataset.lugar = L.id;
      }
      rotuloDe.praca = rotulo('⛲ Praça da Turma', 18 * T, 7.5 * T);
      rotuloDe['mesa-velha'] = rotulo('❌ Jogo da velha', 14.5 * T, 12.9 * T, 'pequeno so-perto');
      rotuloDe['mesa-domino'] = rotulo('🎲 Dominó', 21.5 * T, 12.9 * T, 'pequeno so-perto');
      rotuloDe.mural = rotulo('📌 Mural de recados', 22 * T, 8.1 * T, 'pequeno so-perto');
      rotuloDe.coreto = rotulo('🎭 Coreto', 18 * T, 11.4 * T, 'pequeno so-perto');
      rotulo('♻️ Coleta seletiva', 18 * T, 18.15 * T, 'pequeno so-perto');
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
      function posicionar(p) {
        if (iso && cena) {
          // Em pé no centro do quadrinho, de frente para a tela (o primeiro translate continua sendo o lugar no mapa).
          p.el.style.transform = `translate(${p.x * T}px, ${p.y * T}px) translate(${T / 2}px, ${T / 2}px) var(--anti) translate(${-T / 2}px, ${-T}px)`;
          p.el.style.zIndex = String(cena.zDe(cena.prof(p.x + 0.5, p.y + 0.5)) + 40);
          return;
        }
        p.el.style.transform = `translate(${p.x * T}px, ${p.y * T}px)`; p.el.style.zIndex = String(10 + Math.round(p.y * 10));
      }
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
        // A cidade inteira cabe entre os botões de cima e os de baixo (nada fica escondido atrás deles) e, num
        // evento, abaixo do alarme (a parte de cima da cidade, com o Lote da turma, não fica escondida).
        const faixaLivre = () => {
          const topoMapa = mapa.getBoundingClientRect().top;
          const faixa = [emergEl, especialEl].filter((el) => !el.hidden).reduce((m, el) => Math.max(m, el.getBoundingClientRect().bottom - topoMapa + 8), 0);
          const cima = Math.max(Math.min(58, ch * 0.1), Math.min(faixa, ch * 0.45)), baixo = Math.min(62, ch * 0.1);
          return { cima, livre: Math.max(80, ch - cima - baixo) };
        };
        if (iso && cena) {
          if (!perto) {
            // os quatro cantos do mapa na tela, com espaço em cima para o prédio mais alto
            const cantos = [[0, 0], [W, 0], [W, H], [0, H]].map(([x, y]) => cena.tela(x, y, 0));
            const xs = cantos.map((c) => c[0]), ys = cantos.map((c) => c[1]);
            const x1 = Math.min(...xs), x2 = Math.max(...xs), y1 = Math.min(...ys) - 3.4 * cena.HZ * T, y2 = Math.max(...ys);
            const { cima, livre } = faixaLivre();
            cam.s = Math.min(cw / (x2 - x1), livre / (y2 - y1)) * 0.98;
            cam.x = (cw - (x2 - x1) * cam.s) / 2 - x1 * cam.s; cam.y = cima + (livre - (y2 - y1) * cam.s) / 2 - y1 * cam.s;
          } else {
            cam.s = Math.max(0.75, Math.min(1.3, Math.min(cw / 880, ch / 600)));
            const [X, Y] = cena.tela(eu.x + 0.5, eu.y + 0.5, 0);
            cam.x = cw / 2 - X * cam.s; cam.y = ch / 2 - (Y - T * 0.6) * cam.s;
          }
          mundo.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.s}) ${cena.G.css}`;
          mundo.style.setProperty('--inv', String(1 / cam.s));
          return;
        }
        if (!perto) {
          const { cima, livre } = faixaLivre();
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
      // A seta do teclado: no 2D, o passo é o da seta; no 3D, o passo vai para onde a tela mostra (a diagonal do mapa)
      // e, se ali não dá, para um dos lados dela.
      function passosDaSeta([sx, sy]) {
        if (!iso || !cena) return [[sx, sy]];
        const { c, s } = cena.G, px = c * sx + 2 * s * sy, py = -s * sx + 2 * c * sy;
        const dx = Math.abs(px) > 0.3 ? Math.sign(px) : 0, dy = Math.abs(py) > 0.3 ? Math.sign(py) : 0;
        return dx && dy ? [[dx, dy], [dx, 0], [0, dy]] : [[dx, dy]];
      }
      function mover(dt) {
        if (!eu.caminho.length && seta && !bloqueado()) {
          const [x, y] = M.maisPerto(eu.x, eu.y);
          for (const [dx, dy] of passosDaSeta(seta)) {
            const nx = x + dx, ny = y + dy;
            if (!M.andavel(nx, ny) || (dx && dy && (!M.andavel(x + dx, y) || !M.andavel(x, y + dy)))) continue; // não corta quina
            eu.caminho.push([nx, ny]); if (!andouUmaVez) { andouUmaVez = true; mostrarDica(); }
            break;
          }
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
      // A abertura (a maquete em pontos) espera a primeira resposta: os prédios acesos e onde você chegou.
      let avisarChegada = null;
      const chegouCidade = new Promise((ok) => { avisarChegada = ok; });
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
          // (no 3D, a obra de um prédio é o tapume em pé, desenhado pela cena; a de uma área continua no chão)
          obras[id] = CE.el('div', { class: 'pr-obra' + (L.telhado || L.casa ? ' predio' : ''), 'data-obra': id, style: `left:${x * T}px;top:${y * T}px;width:${w * T}px;height:${h * T}px` },
            CE.el('span', { class: 'placa' }, '🏗️'));
          camadaObjetos.append(obras[id]);
          if (cena) cena.atualizar(id, false);
        } else if (!sim && obras[id]) {
          const o = obras[id];
          delete obras[id];
          if (animar) { o.classList.add('abrindo'); setTimeout(() => o.remove(), 1000); } else o.remove();
          if (cena) cena.atualizar(id, !!animar);
        }
      }
      function mostrarPredio(id, ligado, animar) {
        const L = M.porLugar[id];
        obra(id, !ligado, animar);
        atualizarRotulo(id);
        if (iso && cena) posicionarRotulos();
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
        if (iso && cena) posicionarRotulos();
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
        const toco = CE.el('div', { class: 'pr-toco', 'data-arvore': `${ax},${ay}`, style: `left:${ax * T}px;top:${ay * T}px;background:${chao}` });
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
        andarDia();
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
        cargaPropria();
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
          const eu0 = { x: arred(eu.x), y: arred(eu.y), esq: !!eu.esq, andando: !!eu.andando, cracha: meuCracha };
          if (finResumo) eu0.fin = finResumo;
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
        if (r.coleta !== undefined) aplicarColeta(r.coleta);
        if (r.dia) aplicarDia(r.dia);
        if (r.retorno) verRetorno(r.retorno);
        if (r.vendas && r.vendas.length) receberVendas(r.vendas);
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
          marcarCracha(o, x.cracha || null);
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
        if ((r.visual === '2d' || r.visual === 'iso') && r.visual !== visao) aplicarVisual(r.visual);
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
        if (primeira) { primeira = false; conquista('visitou'); CE.emitir('praca:entrou', {}); if (!souInstrutor) conferirEntrevista(); }
        if (avisarChegada) { avisarChegada(!bloqueado()); avisarChegada = null; }
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
        } else if (ev.tipo === 'coleta') {
          if (pertinho) registrar({ classe: 'sistema', texto: ev.texto });
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
      botaoRelogio.addEventListener('click', () => { fecharPopups(); const v = vagaDaHora(); avisarNoMapa(`${botaoRelogio.textContent}: dia ${diaAtual ? diaAtual.numero : 1} na cidade. O dia vai das 8h às 18h.${v ? ` Agora: ${v.emoji} ${v.titulo} contratando (vale 50% a mais)!` : ''}`); });
      botaoVagas.addEventListener('click', () => { fecharPopups(); abrirVagas(); });
      botaoHora.addEventListener('click', () => { fecharPopups(); avisarNoMapa('⏰ Hora da Praça: aproveite para fazer a tarefa do dia, achar as pistas da novela e juntar moedas para um evento especial!'); });
      const mostrarMoedas = (saldo) => { botaoMoedas.textContent = `💰 ${saldo}`; };
      if (!souInstrutor) CE.carteira.saldo().then(mostrarMoedas);
      const pararGanho = CE.ouvir('carteira:ganhou', (d) => { mostrarMoedas(d.saldo); botaoMoedas.classList.remove('ganhou'); void botaoMoedas.offsetWidth; botaoMoedas.classList.add('ganhou'); });
      const pararGasto = CE.ouvir('carteira:gastou', (d) => mostrarMoedas(d.saldo));
      // O resumo do dinheiro (conta, poupança, dívida, nome) vai junto na sincronização, para o painel do professor.
      let finResumo = null;
      const resumirDinheiro = () => { if (souInstrutor) return; CE.carteira.banco.ver().then((b) => { finResumo = { conta: b.conta, poupanca: b.poupanca + b.aplicacoes.reduce((s, a) => s + a.atual, 0), divida: b.emprestimo ? b.emprestimo.devendo : 0, score: b.score, sujo: !!b.sujo, atrasadas: b.contas.filter((x) => x.atraso > 0).length }; }).catch(() => {}); };
      resumirDinheiro();
      const pararBanco = CE.ouvir('banco:mudou', resumirDinheiro);
      const pararMoedas = () => { pararGanho(); pararGasto(); pararBanco(); };
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
        const rotuloVisual = visao === 'iso' ? 'Praça em 2D (de cima)' : 'Praça em 3D (isométrica)';
        btVisual.querySelector('.icone').textContent = visao === 'iso' ? '🗺️' : '🧊';
        btVisual.querySelector('.rotulo').textContent = rotuloVisual;
        btVisual.setAttribute('aria-label', rotuloVisual);
      }

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
          extra: [seletor, abas, ...conteudo].filter(Boolean), foco: `[data-aba="${abaCidade}"]`,
          opcoes: [{ rotulo: '🎬 Ver maquete', id: 'ver-maquete', acao: () => verMaquete(false) }, { rotulo: 'Fechar' }],
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
          opcoes: [
            // A feira da turma funciona mesmo com o barracão em obra (as barracas ficam na calçada).
            ...(L.id === 'feira' ? [{ rotulo: '🧺 Feira da turma (comprar e vender)', principal: true, id: 'feira', fica: true, acao: () => abrirFeira() }] : []),
            ...(souInstrutor
              ? [{ rotulo: 'Ver a cidade da turma', principal: L.id !== 'feira', fica: true, acao: () => abrirCidade('predios') }, { rotulo: 'Fechar' }]
              : [{ rotulo: 'Ir para as Aulas', principal: L.id !== 'feira', id: 'aulas', acao: () => CE.janelas.abrir('aulas') }, { rotulo: 'Ver a cidade', fica: true, acao: () => abrirCidade('predios') }, { rotulo: 'Fechar' }])],
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
          inicio: { fala: 'Bom dia! Aqui no posto você agenda consulta, como no aplicativo da saúde. Lembrete: o posto nunca pede senha nem cobra taxa por mensagem, viu?',
            opcoes: [['📅 Agendar uma consulta (treino)', null, true, () => setTimeout(() => abrirAgendamento(), 0)], ['Obrigado, Cida!', null]] },
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
        if (L.coleta) return abrirLixeira(L);
        if (L.id === 'mesa-velha') return abrirMesa();
        if (L.id === 'mural') return abrirMural();
        if (L.id === 'lote') return abrirCidade('lote');
        if (RUA.includes(L.id) || (L.id === 'sua-casa' && souInstrutor)) return abrirCidade('rua');
        if (L.id === 'sua-casa') return abrirCasa();
        if (L.id === 'coreto') return abrirNovela();
        if (L.id === 'lanchonete') {
          // O Restaurante do Digão: cada aluno joga no seu computador (um jogo pronto, em Flash, rodando com o Ruffle).
          return abrirDialogo({ tipo: 'lugar', rosto: '🍔', titulo: 'Restaurante do Digão', subtitulo: 'O jogo de gerenciar a rede de lanchonetes', fala: info.texto,
            nota: 'Baseado em "The McDonald\'s Videogame", de Molleindustria (licença CC BY-NC-SA 3.0, uso sem fins comerciais). Comece pelo Tutorial.',
            opcoes: [{ rotulo: '🍔 Jogar', principal: true, id: 'entrar-restaurante', acao: () => { CE.janelas.abrir('restaurante'); CE.emitir('praca:entrou-lugar', { lugar: L.id }); } }, { rotulo: 'Fechar' }] });
        }
        if (L.id === 'arena') {
          // O Agar da Turma: cada turma tem a sua arena; com pouca gente, robôs completam. O professor abre ou fecha.
          return abrirDialogo({ tipo: 'lugar', rosto: '🟢', titulo: 'Agar da Turma', subtitulo: 'A arena das bolinhas', fala: info.texto,
            nota: souInstrutor ? 'Lá dentro você abre ou fecha a arena para os alunos, liga os robôs e pode assistir à arena inteira de uma turma.' : 'Mova o mouse para guiar a sua bolinha. Espaço divide; W solta massa.',
            opcoes: [{ rotulo: '🟢 Entrar na arena', principal: true, id: 'entrar-agar', acao: () => { CE.janelas.abrir('agar'); CE.emitir('praca:entrou-lugar', { lugar: L.id }); } }, { rotulo: 'Fechar' }] });
        }
        if (L.id === 'cobrinha') {
          // A Cobrinha da Turma: igual à arena do Agar (cada turma tem a sua; robôs completam; o professor abre ou fecha).
          return abrirDialogo({ tipo: 'lugar', rosto: '🐍', titulo: 'Cobrinha da Turma', subtitulo: 'A arena das cobrinhas', fala: info.texto,
            nota: souInstrutor ? 'Lá dentro você abre ou fecha a arena para os alunos, liga os robôs e pode assistir à arena inteira de uma turma.' : 'Mova o mouse para guiar a sua cobrinha. Segure o Espaço para acelerar.',
            opcoes: [{ rotulo: '🐍 Entrar na arena', principal: true, id: 'entrar-cobrinha', acao: () => { CE.janelas.abrir('cobrinha'); CE.emitir('praca:entrou-lugar', { lugar: L.id }); } }, { rotulo: 'Fechar' }] });
        }
        if (L.id === 'fonte') {
          return abrirDialogo({ tipo: 'lugar', rosto: '⛲', titulo: 'Fonte', subtitulo: 'No meio da praça', fala: info.texto,
            opcoes: [{ rotulo: 'Jogar uma moedinha e fazer um pedido', principal: true, acao: () => falar('✨ Fiz um pedido na fonte!') }, { rotulo: 'Fechar' }] });
        }
        const opcoes = [];
        if (info.botao) opcoes.push({ rotulo: info.botao, principal: true, id: 'entrar', acao: () => { info.abrir(); CE.emitir('praca:entrou-lugar', { lugar: L.id }); } });
        if (L.id === 'banco') opcoes.push({ rotulo: '🏧 Caixa eletrônico (treino)', id: 'caixa', fica: true, acao: () => abrirCaixa() });
        if (L.id === 'banco' && !souInstrutor) opcoes.push({ rotulo: '🏦 Minha conta de moedas', id: 'minha-conta', acao: () => { CE.carteira.aba = 'banco'; CE.janelas.abrir('carteira'); } });
        if (L.id === 'empregos') opcoes.push({ rotulo: '💼 Ver as vagas da cidade', principal: true, id: 'vagas', fica: true, acao: () => abrirVagas() });
        if (L.id === 'feira') opcoes.push({ rotulo: '🧺 Feira da turma (comprar e vender)', principal: true, id: 'feira', fica: true, acao: () => abrirFeira() });
        if (L.id === 'banco' && souInstrutor) opcoes.push({ rotulo: '📊 Dinheiro da turma', id: 'financas', fica: true, acao: () => abrirFinancas() });
        if (L.id === 'posto') opcoes.push({ rotulo: '📅 Agendar consulta (treino)', principal: true, id: 'agendar', fica: true, acao: () => abrirAgendamento() });
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

      // ---------- Coleta seletiva: lixo no chão, cinco lixeiras coloridas ----------
      const lixosEl = {};
      let coletaAtual = null;
      const COR_LIXEIRA = NOV.COLETA.lixeiras;
      function cargaPropria() {
        const e = emergAtiva() && emerg.carregando ? EMERG[emerg.tipo].levar.levando : null;
        marcarCarga(eu, e || (coletaAtual && coletaAtual.carregando ? coletaAtual.carregando.emoji : null));
      }
      function aplicarColeta(c) {
        coletaAtual = c;
        const vistos = new Set();
        for (const i of c.itens || []) {
          vistos.add(i.id);
          if (!lixosEl[i.id]) {
            lixosEl[i.id] = CE.el('div', { class: 'pr-lixo', 'data-lixo': i.id, title: i.nome, style: `left:${(i.x + 0.5) * T}px;top:${(i.y + 0.5) * T}px` }, i.emoji);
            camadaObjetos.append(lixosEl[i.id]);
          }
        }
        for (const id of Object.keys(lixosEl)) if (!vistos.has(id)) { lixosEl[id].remove(); delete lixosEl[id]; }
        cargaPropria();
        verPerto(true);
      }
      const lixoPerto = (x, y, raio = 1.05) => (coletaAtual && !coletaAtual.carregando ? (coletaAtual.itens || []).filter((i) => Math.hypot(i.x - x, i.y - y) <= raio).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0] : null) || null;
      async function pegarLixo(i) {
        const r = await chamar('praca:coleta', 'pegar', { item: i.id, x: arred(eu.x), y: arred(eu.y) });
        if (!r || fechouJanela) return;
        aplicarColeta(r);
        balao(eu, `${i.emoji} Peguei ${i.nome}! Em qual lixeira vai? ♻️`);
      }
      async function jogarLixo(L) {
        const r = await chamar('praca:coleta', 'jogar', { lixeira: L.id, x: arred(eu.x), y: arred(eu.y) });
        if (!r || fechouJanela) return;
        aplicarColeta(r);
        if (r.certo) {
          balao(eu, `♻️ Isso! ${r.explica}`);
          CE.comemorar('pequena');
          CE.carteira.ganhar('coleta', `Separou ${r.item.nome} na lixeira certa`, `coleta:${r.item.id}`);
          contarReciclagem();
        } else balao(eu, `🤔 Hum, não é aqui. ${r.explica}`);
      }
      function abrirLixeira(L) {
        if (coletaAtual && coletaAtual.carregando) return jogarLixo(L);
        const exemplos = NOV.COLETA.itens.filter((i) => i.tipo === L.coleta).map((i) => `${i.emoji} ${i.nome}`);
        abrirDialogo({ tipo: 'lugar', rosto: '♻️', titulo: L.nome, subtitulo: 'Coleta seletiva', fala: NOV.COLETA.explica[L.coleta],
          lista: exemplos, nota: 'Ache o lixo no chão da praça e das calçadas, pegue (clicando nele) e traga para a lixeira da cor certa. Cada acerto vale 2 moedas.',
          opcoes: [{ rotulo: 'Entendi!', principal: true }] });
      }

      // ---------- Caixa eletrônico de treino (no Banco Escola) ----------
      function abrirCaixa(passo = 'inicio', erro = '') {
        const base = { tipo: 'caixa', rosto: '🏧', titulo: 'Caixa eletrônico 24h', subtitulo: 'Banco Escola · treino (o dinheiro é de mentira)' };
        const vai = (p) => () => abrirCaixa(p);
        const menu = { rotulo: '↩ Voltar ao menu', fica: true, id: 'menu', acao: vai('menu') };
        if (passo === 'inicio') return abrirDialogo({ ...base, fala: 'Missão: sacar R$ 50,00 com segurança. Primeiro, coloque o cartão na máquina.',
          opcoes: [{ rotulo: '💳 Colocar o cartão', principal: true, fica: true, id: 'cartao', acao: vai('estranho') }, { rotulo: 'Sair' }] });
        if (passo === 'estranho') return abrirDialogo({ ...base, rosto: '🕴️', papelCor: 'golpista', fala: 'Um moço chega por trás: "Esse caixa está difícil hoje, né? Me fala sua senha que eu faço o saque para você."',
          opcoes: [{ rotulo: 'Falar a senha para ele', fica: true, id: 'falar-senha', acao: vai('golpe') },
            { rotulo: 'Não, obrigado. Cubro o teclado e, se precisar, chamo o funcionário do banco', principal: true, fica: true, id: 'recusar', acao: vai('senha') }] });
        if (passo === 'golpe') return abrirDialogo({ ...base, rosto: '😱', fala: 'Ele decorou a senha, trocou o seu cartão por outro igual e sumiu.',
          nota: 'Golpe da troca de cartão: nunca fale a senha nem aceite ajuda de desconhecido no caixa. Ajuda, só do funcionário do banco, lá dentro.',
          opcoes: [{ rotulo: 'Tentar de novo, do jeito certo', principal: true, fica: true, id: 'de-novo', acao: vai('estranho') }] });
        if (passo === 'senha') {
          const campo = CE.el('label', { class: 'pr-campo', for: 'pr-campo-senha' }, 'Senha do cartão (4 números)',
            CE.el('input', { id: 'pr-campo-senha', type: 'password', inputmode: 'numeric', maxlength: '4', autocomplete: 'off' }));
          const conferir = () => { const v = String(dialogo.querySelector('#pr-campo-senha').value).replace(/\D/g, ''); abrirCaixa(v === '1234' ? 'menu' : 'senha', v === '1234' ? '' : 'Senha errada. Confira número por número.'); };
          abrirDialogo({ ...base, fala: erro || 'Digite a senha. Dica: cubra o teclado com a outra mão, para ninguém ver.', campo, nota: 'A senha de treino é 1 2 3 4.',
            opcoes: [{ rotulo: 'Confirmar', principal: true, fica: true, id: 'confirmar-senha', acao: conferir }] });
          dialogo.querySelector('#pr-campo-senha').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); conferir(); } });
          return;
        }
        if (passo === 'menu') return abrirDialogo({ ...base, fala: erro || 'O que você quer fazer?', opcoes: [
          { rotulo: '💵 Saque', principal: true, fica: true, id: 'saque', acao: vai('saque') }, { rotulo: '💰 Saldo', fica: true, id: 'saldo', acao: vai('saldo') },
          { rotulo: '📄 Extrato', fica: true, id: 'extrato', acao: vai('extrato') }, { rotulo: 'Cancelar e tirar o cartão' }] });
        if (passo === 'saldo') return abrirDialogo({ ...base, fala: 'Saldo disponível: R$ 230,00.', opcoes: [menu] });
        if (passo === 'extrato') return abrirDialogo({ ...base, fala: 'Últimos lançamentos:', lista: ['05/11 · Salário · + R$ 1.412,00', '06/11 · Conta de luz · − R$ 98,40', '08/11 · Mercado · − R$ 183,60', '10/11 · Pix para Dona Rosa · − R$ 50,00'],
          nota: 'Confira o extrato de vez em quando: se aparecer um lançamento que você não fez, avise o banco na hora.', opcoes: [menu] });
        if (passo === 'saque') {
          const valor = (v) => ({ rotulo: `R$ ${v},00`, principal: v === 50, fica: true, id: 'valor-' + v, acao: () => (v === 50 ? abrirCaixa('retirar') : abrirCaixa('saque', `A missão é sacar R$ 50,00 (não R$ ${v},00).`)) });
          return abrirDialogo({ ...base, fala: erro || 'Quanto você quer sacar?', opcoes: [valor(20), valor(50), valor(100), menu] });
        }
        if (passo === 'retirar') return abrirDialogo({ ...base, rosto: '💵', fala: 'Saque feito! Pegue o dinheiro e o cartão. Guarde o dinheiro antes de sair do caixa.',
          lista: ['Comprovante: SAQUE R$ 50,00', 'Saldo depois do saque: R$ 180,00'], opcoes: [{ rotulo: '💳 Pegar o dinheiro e o cartão', principal: true, fica: true, id: 'pegar', acao: vai('fim') }] });
        if (passo === 'fim') {
          CE.carteira.ganhar('caixa', 'Treinou no caixa eletrônico', `caixa:${NOV.dia(Date.now())}`);
          return abrirDialogo({ ...base, rosto: '✅', fala: 'Missão cumprida: R$ 50,00 sacados com segurança!',
            lista: ['Senha é só sua: cubra o teclado e nunca fale para ninguém.', 'Ajuda no caixa, só do funcionário do banco.', 'Pegue o cartão e guarde o dinheiro antes de sair.'],
            opcoes: [{ rotulo: 'Fechar', principal: true }] });
        }
      }

      // ---------- Agendamento de consulta de treino (no Posto de Saúde, com a Enfermeira Cida) ----------
      const SUS = '898001234567890';
      function proximosDias(n) {
        const lista = [], d = new Date();
        while (lista.length < n) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) lista.push(new Date(d)); }
        return lista;
      }
      const agenda = {};
      function abrirAgendamento(passo = 'inicio', erro = '') {
        const base = { tipo: 'agenda', rosto: '👩‍⚕️', titulo: 'Agendar consulta', subtitulo: 'Posto de Saúde · treino, como no aplicativo da saúde' };
        const vai = (p) => () => abrirAgendamento(p);
        if (passo === 'inicio') {
          const esp = (nome, emoji) => ({ rotulo: `${emoji} ${nome}`, principal: nome === 'Clínico geral', fica: true, id: 'esp-' + nome.split(' ')[0].toLowerCase(), acao: () => { agenda.esp = nome; abrirAgendamento('sus'); } });
          return abrirDialogo({ ...base, fala: 'Oi! Vamos agendar uma consulta de treino, passo a passo. Qual atendimento você precisa?',
            opcoes: [esp('Clínico geral', '🩺'), esp('Dentista', '🦷'), esp('Vacina da gripe', '💉'), { rotulo: 'Agora não' }] });
        }
        if (passo === 'sus') {
          const campo = CE.el('label', { class: 'pr-campo', for: 'pr-campo-sus' }, 'Número do Cartão SUS (15 números)',
            CE.el('input', { id: 'pr-campo-sus', inputmode: 'numeric', autocomplete: 'off', maxlength: '20', placeholder: '000 0000 0000 0000' }));
          const conferir = () => { const v = String(dialogo.querySelector('#pr-campo-sus').value).replace(/\D/g, ''); if (v === SUS) abrirAgendamento('dia'); else abrirAgendamento('sus', 'O número não confere. Digite com calma, olhando o cartão (os espaços não importam).'); };
          abrirDialogo({ ...base, fala: erro || 'Digite o número do seu Cartão SUS. O cartão de treino é este:', lista: ['💳 Cartão Nacional de Saúde: 898 0012 3456 7890'], campo,
            opcoes: [{ rotulo: 'Continuar', principal: true, fica: true, id: 'continuar-sus', acao: conferir }] });
          dialogo.querySelector('#pr-campo-sus').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); conferir(); } });
          return;
        }
        if (passo === 'dia') {
          const horas = ['8h', '10h30', '14h'];
          const opcoes = proximosDias(3).map((d, k) => {
            const texto = `${d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })} às ${horas[k]}`;
            return { rotulo: '📅 ' + texto, principal: k === 0, fica: true, id: 'dia-' + k, acao: () => { agenda.dia = texto; abrirAgendamento('confirmar'); } };
          });
          return abrirDialogo({ ...base, fala: `Horários livres para ${agenda.esp}:`, opcoes });
        }
        if (passo === 'confirmar') return abrirDialogo({ ...base, fala: 'Confira antes de confirmar:', lista: [`Atendimento: ${agenda.esp}`, `Dia: ${agenda.dia}`, 'Local: Posto de Saúde da Praça'],
          opcoes: [{ rotulo: '✅ Confirmar agendamento', principal: true, fica: true, id: 'confirmar', acao: vai('sms') }, { rotulo: 'Escolher outro dia', fica: true, id: 'outro-dia', acao: vai('dia') }] });
        if (passo === 'sms') return abrirDialogo({ ...base, rosto: '📱', titulo: 'Chegou uma mensagem', fala: '"POSTO DE SAÚDE: sua consulta foi CANCELADA. Para remarcar, pague a taxa de R$ 25,00 em: posto-agenda-online.com/pagar"',
          opcoes: [{ rotulo: 'Clicar no link e pagar a taxa', fica: true, id: 'pagar', acao: vai('golpe') },
            { rotulo: 'Não clico: ligo para o posto ou confiro no aplicativo oficial', principal: true, fica: true, id: 'conferir', acao: vai('fim') }] });
        if (passo === 'golpe') return abrirDialogo({ ...base, rosto: '😱', fala: 'Era golpe! O dinheiro foi para o golpista e a consulta nunca foi cancelada.',
          nota: 'O SUS é de graça: o posto não cobra taxa e não manda link para pagar. Na dúvida, ligue para o posto ou vá até lá.',
          opcoes: [{ rotulo: 'Voltar para a mensagem', principal: true, fica: true, id: 'voltar-sms', acao: vai('sms') }] });
        if (passo === 'fim') {
          CE.carteira.ganhar('agenda', 'Agendou uma consulta no Posto (treino)', `agenda:${NOV.dia(Date.now())}`);
          return abrirDialogo({ ...base, rosto: '✅', fala: 'Muito bem! A consulta está marcada e você não caiu no golpe. Anote no caderno:',
            lista: [`${agenda.esp}: ${agenda.dia}`, 'Leve o Cartão SUS e um documento com foto.', 'Chegue 15 minutos antes.', 'Mensagem pedindo pagamento ou senha: é golpe.'],
            opcoes: [{ rotulo: 'Fechar', principal: true }] });
        }
      }

      // ---------- O dia da cidade (8h às 18h em 15 minutos) ----------
      let diaAtual = null, relogioDia = 0, vagaAnunciada = undefined;
      const LUZ = [[8, [255, 236, 190, 0.12]], [10, [255, 250, 230, 0.04]], [12, [255, 255, 255, 0]], [15, [255, 220, 150, 0.06]], [16.5, [255, 170, 80, 0.13]], [17.5, [255, 120, 60, 0.2]], [18, [110, 70, 140, 0.26]]];
      function horaDoDia() {
        if (!diaAtual) return 8;
        const passou = (diaAtual.agora + (performance.now() - relogioDia)) - diaAtual.inicio;
        return 8 + 10 * Math.max(0, Math.min(1, passou / diaAtual.duracao));
      }
      const vagaDaHora = (h = horaDoDia()) => NOV.VAGAS.find((v) => h >= v.de && h < v.ate) || null;
      let diaDoBanco = 0, golpeDoDia = 0, entrevistaOk = false;
      function aplicarDia(d) {
        diaAtual = d; relogioDia = performance.now(); andarDia();
        // Dia novo na cidade: chega a conta do dia (o banco confere os atrasos e o nome).
        if (!souInstrutor && d.numero && d.numero !== diaDoBanco) {
          diaDoBanco = d.numero;
          CE.carteira.banco.diaDaCidade(d.numero).then((r) => {
            for (const x of (r && r.novas) || []) avisarNoMapa(x.falso ? `📱 Chegou pelo WhatsApp um boleto de ${x.nome} (${CE.carteira.banco.moeda(x.valor)}). Confira antes de pagar! (💰 › 🏦 Banco)` : `📬 Chegou a ${x.nome.toLowerCase()}: ${CE.carteira.banco.moeda(x.valor)}, vence amanhã. Pague no 🏦 Banco.`, 'cidade');
          }).catch(() => {});
        }
      }
      function andarDia() {
        if (!diaAtual) return;
        const h = horaDoDia(), hh = Math.floor(h), mm = Math.floor((h - hh) * 60 / 10) * 10;
        const icone = h < 9 ? '🕗' : h < 11 ? '🕙' : h < 13 ? '☀️' : h < 16 ? '🕒' : h < 17.5 ? '🕔' : '🌇';
        botaoRelogio.textContent = `${icone} ${hh}:${String(mm).padStart(2, '0')}`;
        let a = LUZ[0], b = LUZ[LUZ.length - 1];
        for (let k = 0; k < LUZ.length - 1; k++) if (h >= LUZ[k][0] && h <= LUZ[k + 1][0]) { a = LUZ[k]; b = LUZ[k + 1]; break; }
        const f = b[0] === a[0] ? 0 : (h - a[0]) / (b[0] - a[0]);
        const c = a[1].map((v, k) => v + (b[1][k] - v) * f);
        luzEl.style.background = `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${c[3].toFixed(3)})`;
        // A vaga em destaque muda com a hora (os alunos ficam sabendo).
        const v = vagaDaHora(h);
        const id = v ? v.id : (h >= 18 ? 'fim' : null);
        if (id !== vagaAnunciada) {
          const primeiraVez = vagaAnunciada === undefined;
          vagaAnunciada = id;
          if (!primeiraVez && !souInstrutor && v) { avisarNoMapa(`💼 ${v.emoji} Agora: ${v.titulo} está contratando! Vale 50% a mais (💼 Vagas).`, 'cidade'); if (CE.voz) CE.voz.falar(`Atenção: ${v.titulo} está contratando!`); }
          if (!primeiraVez && id === 'fim') avisarNoMapa('🌇 Seis da tarde: fim do expediente na cidade. Amanhã tem mais vagas!', 'cidade');
        }
        if (!souInstrutor && entrevistaOk && h >= 13 && h < 17.5 && diaAtual.numero && golpeDoDia !== diaAtual.numero && dialogo.hidden && !fechouJanela) {
          golpeDoDia = diaAtual.numero;
          mostrarGolpe(diaAtual.numero);
        }
      }

      // ---------- Golpes do banco (um por dia da cidade): SMS do empréstimo e o falso gerente ----------
      const GOLPES = [
        { id: 'sms', rosto: '📱', titulo: 'Chegou um SMS', valor: 20, motivo: 'taxa do falso empréstimo aprovado',
          fala: '"BANCO ESCOLA: Parabéns! Seu empréstimo de 500 moedas foi APROVADO. Para liberar hoje, pague a taxa de 20 moedas em: bancoescola-libera.com"',
          caiu: 'Pagar a taxa e receber os 500', certo: 'Não pago: banco de verdade não cobra taxa adiantada para liberar empréstimo',
          licao: ['Banco nenhum cobra taxa ANTES de liberar empréstimo.', 'Empréstimo que você não pediu, aprovado por SMS: é golpe.', 'Na dúvida, entre no aplicativo oficial ou vá até a agência.'] },
        { id: 'gerente', rosto: '📞', titulo: 'Ligação do "gerente"', valor: 30, motivo: 'transferência para a "conta segura" do falso gerente',
          fala: '"Alô, aqui é o gerente do Banco Escola. Sua conta foi invadida! Para proteger o seu dinheiro, transfira agora o saldo para a nossa conta segura, a 12345-6. É urgente!"',
          caiu: 'Transferir para a conta segura', certo: 'Desligo e ligo eu mesmo para o banco, no número do cartão',
          licao: ['Não existe "conta segura": banco nenhum pede para você transferir dinheiro.', 'Desligue e ligue VOCÊ para o número que está atrás do cartão.', 'Banco nunca pede senha nem código por telefone.'] },
      ];
      function mostrarGolpe(n) {
        const g = GOLPES[n % GOLPES.length];
        if (CE.voz) CE.voz.falar(g.titulo);
        abrirDialogo({ tipo: 'golpe', rosto: g.rosto, titulo: g.titulo, subtitulo: 'O que você faz?', fala: g.fala,
          opcoes: [
            { rotulo: g.caiu, fica: true, id: 'golpe-caiu', acao: async () => {
              const r = await CE.carteira.banco.golpe(true, g.valor, g.motivo).catch(() => ({ perdeu: 0 }));
              abrirDialogo({ tipo: 'golpe', rosto: '😱', titulo: 'Era golpe!', fala: `O golpista levou ${CE.carteira.banco.moeda(r.perdeu)} moedas e o seu nome no banco piorou.`, lista: g.licao, opcoes: [{ rotulo: 'Entendi', principal: true }] });
            } },
            { rotulo: g.certo, principal: true, fica: true, id: 'golpe-certo', acao: async () => {
              await CE.carteira.banco.golpe(false, 0, g.titulo).catch(() => {});
              await CE.carteira.ganhar('golpe', `Não caiu no golpe: ${g.titulo}`, `golpe:${g.id}:${n}`);
              CE.comemorar('pequena');
              abrirDialogo({ tipo: 'golpe', rosto: '🛡️', titulo: 'Muito bem: era golpe!', fala: 'Você não caiu. Ganhou 5 moedas e o seu nome no banco melhorou.', lista: g.licao, opcoes: [{ rotulo: 'Fechar', principal: true }] });
            } }] });
      }

      // ---------- Crachá de quem foi contratado ----------
      let meuCracha = null;
      function marcarCracha(p, emoji) {
        if (emoji && !p.crachaEl) { p.crachaEl = CE.el('span', { class: 'pr-cracha', title: 'Contratado(a)', 'aria-label': 'crachá' }, emoji); p.el.append(p.crachaEl); }
        else if (emoji && p.crachaEl) p.crachaEl.textContent = emoji;
        else if (!emoji && p.crachaEl) { p.crachaEl.remove(); p.crachaEl = null; }
      }
      if (!souInstrutor) CE.sessao.progresso().then((pr) => { meuCracha = (pr && pr.praca && pr.praca.cracha) || null; marcarCracha(eu, meuCracha); }).catch(() => {});

      // ---------- Entrevista de emprego (primeira vez na praça; o recrutador é o Professor Virtual) ----------
      const respostas = {};
      async function conferirEntrevista() {
        const pr = await CE.sessao.progresso().catch(() => null);
        if (pr && pr.praca && pr.praca.entrevista) { entrevistaOk = true; return; }
        setTimeout(async () => {
          // Confere de novo (a entrevista pode ter sido feita nesse meio-tempo, em outra janela).
          const agora = await CE.sessao.progresso().catch(() => null);
          if (agora && agora.praca && agora.praca.entrevista) return;
          if (!fechouJanela && dialogo.hidden) abrirEntrevista(0);
        }, 1200);
      }
      function abrirEntrevista(k) {
        const perguntas = NOV.ENTREVISTA, q = perguntas[k];
        if (!q) return terminarEntrevista();
        if (CE.voz) CE.voz.falar(q.pergunta);
        const campos = q.tres ? [0, 1, 2].map((i) => CE.el('input', { class: 'pr-entrevista-campo', 'data-campo': `${q.id}-${i}`, maxlength: '120', autocomplete: 'off', placeholder: `${i + 1}.`, value: ((respostas[q.id] || [])[i]) || '' }))
          : [CE.el('input', { class: 'pr-entrevista-campo', 'data-campo': q.id, maxlength: q.numero ? '3' : '200', inputmode: q.numero ? 'numeric' : 'text', autocomplete: 'off', value: respostas[q.id] || (q.id === 'nome' ? usuario.nome : '') })];
        const erro = CE.el('p', { class: 'pr-erro', role: 'alert' }); erro.hidden = true;
        const seguir = () => {
          const vals = campos.map((c) => c.value.trim());
          if (!q.opcional && !vals.some(Boolean)) { erro.textContent = 'Responda para continuar 🙂'; erro.hidden = false; return; }
          respostas[q.id] = q.tres ? vals.filter(Boolean) : vals[0];
          abrirEntrevista(k + 1);
        };
        abrirDialogo({ tipo: 'entrevista', rosto: '👨‍💼', papelCor: 'professor', titulo: 'Entrevista de emprego', subtitulo: `Recrutador da cidade · pergunta ${k + 1} de ${perguntas.length}`,
          fala: q.pergunta, campo: CE.el('label', { class: 'pr-campo' }, q.rotulo, ...campos), extra: erro,
          nota: k === 0 ? 'Toda pessoa nova na cidade passa por uma entrevista. Responda com calma: não existe resposta errada.' : null,
          opcoes: [{ rotulo: k === perguntas.length - 1 ? 'Terminar a entrevista ✅' : 'Responder ▶', principal: true, fica: true, id: 'responder', acao: seguir },
            ...(k > 0 ? [{ rotulo: '◀ Voltar', fica: true, id: 'voltar', acao: () => abrirEntrevista(k - 1) }] : [{ rotulo: 'Fazer depois' }])] });
        for (const c of campos) c.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); seguir(); } });
      }
      async function terminarEntrevista() {
        const r = await chamar('praca:entrevista', respostas);
        if (!r) return;
        await CE.sessao.atualizarProgresso((p) => { p.praca = p.praca || {}; p.praca.entrevista = Date.now(); }).catch(() => {});
        entrevistaOk = true;
        CE.carteira.ganhar('entrevista', 'Fez a entrevista de emprego', 'entrevista');
        CE.comemorar('grande');
        if (CE.voz) CE.voz.falar(`Parabéns, ${r.nome}! Você foi aprovado na entrevista. Bem-vindo à cidade!`);
        abrirDialogo({ tipo: 'entrevista', rosto: '🤝', titulo: 'Aprovado(a) na entrevista!', subtitulo: 'Bem-vindo(a) à cidade',
          fala: `Parabéns, ${r.nome}! Seu currículo já está na Agência de Empregos. Agora candidate-se às vagas: cada prova vale salário, que cai na sua conta no banco.`,
          lista: [`Pontos fortes: ${r.fortes.join(', ')}`, `Quer melhorar: ${r.melhorar.join(', ')}`],
          opcoes: [{ rotulo: '💼 Ver as vagas', principal: true, fica: true, id: 'ver-vagas', acao: () => abrirVagas() }, { rotulo: 'Fechar' }] });
      }

      // ---------- Feira da turma: barraca de cada aluno; os colegas compram com Pix ----------
      const recebendo = new Set();
      async function receberVendas(vendas) {
        const novas = vendas.filter((v) => !recebendo.has(v.id));
        if (!novas.length || souInstrutor) return;
        novas.forEach((v) => recebendo.add(v.id));
        for (const v of novas) {
          const pago = await CE.carteira.ganhar('feira-venda', `Feira: vendeu ${v.emoji} ${v.produto} para ${v.de} (Pix)`, 'feira:' + v.id, v.valor);
          if (pago) avisarNoMapa(`🧺 ${v.de} comprou ${v.emoji} ${v.produto} na sua barraca: +${v.valor} moedas por Pix!`, 'cidade');
        }
        await CE.api.chamar('praca:feira-recebido', novas.map((v) => v.id)).catch(() => {});
      }
      async function abrirFeira(erro = '') {
        const f = await chamar('praca:feira');
        if (!f || fechouJanela) return;
        const cartao = (b) => {
          const minha = b.id === usuario.id;
          return CE.el('li', { class: 'pr-barraca' + (minha ? ' minha' : ''), 'data-barraca': b.id },
            CE.el('span', { class: 'ic', 'aria-hidden': 'true' }, b.emoji),
            CE.el('div', { class: 'txt' }, CE.el('strong', {}, b.produto), CE.el('span', { class: 'pr-suave' }, `Barraca de ${minha ? 'você' : b.dono} · ${b.estoque > 0 ? `${b.estoque} no estoque` : 'acabou'}${b.vendas ? ` · ${b.vendas} vendido${b.vendas > 1 ? 's' : ''}` : ''}`)),
            CE.el('strong', { class: 'preco' }, `${b.preco} 💰`),
            souInstrutor || minha ? null : CE.el('button', { class: 'botao', type: 'button', 'data-comprar': b.id, disabled: b.estoque <= 0, onclick: () => pagarPix(b) }, 'Comprar'));
        };
        let form = null;
        if (!souInstrutor) {
          const m = f.minha || {};
          const produto = CE.el('input', { id: 'feira-produto', maxlength: '40', placeholder: 'Ex.: Bolo de macaxeira', value: m.produto || '' });
          const emoji = CE.el('select', { id: 'feira-emoji', 'aria-label': 'Figura do produto' }, f.produtos.map((e) => { const o = CE.el('option', { value: e }, e); if (e === m.emoji) o.selected = true; return o; }));
          const preco = CE.el('input', { id: 'feira-preco', type: 'number', min: '1', max: '30', value: String(m.preco || 5) });
          const estoque = CE.el('input', { id: 'feira-estoque', type: 'number', min: '1', max: '20', value: String(m.estoque || 5) });
          const salvar = async () => { try { await CE.api.chamar('praca:feira-abrir', { produto: produto.value, emoji: emoji.value, preco: preco.value, estoque: estoque.value }); abrirFeira(); } catch (e) { abrirFeira(e.message); } };
          form = CE.el('div', { class: 'pr-form-barraca' }, CE.el('h4', {}, f.minha ? '🧺 Minha barraca' : '🧺 Abrir a minha barraca'),
            CE.el('div', { class: 'linha' }, emoji, produto), CE.el('div', { class: 'linha' }, CE.el('label', { for: 'feira-preco' }, 'Preço', preco), CE.el('label', { for: 'feira-estoque' }, 'Estoque', estoque)),
            CE.el('div', { class: 'pr-botoes' }, CE.el('button', { class: 'botao', type: 'button', 'data-acao-feira': 'abrir-barraca', onclick: salvar }, f.minha ? 'Atualizar a barraca' : 'Abrir a barraca'),
              f.minha ? CE.el('button', { class: 'botao secundario', type: 'button', 'data-acao-feira': 'fechar-barraca', onclick: async () => { await chamar('praca:feira-fechar'); abrirFeira(); } }, 'Fechar a barraca') : null));
        }
        abrirDialogo({ tipo: 'feira', rosto: '🧺', titulo: 'Feira da turma', subtitulo: `${f.barracas.length} barraca${f.barracas.length === 1 ? '' : 's'} aberta${f.barracas.length === 1 ? '' : 's'}`,
          fala: erro || (souInstrutor ? 'As barracas da turma. Os alunos vendem uns para os outros e pagam com Pix (as moedas saem da carteira de quem compra e entram na de quem vende).' : 'Compre dos colegas com Pix (sai da sua carteira 💰) ou abra a sua barraca: escolha o produto, o preço e quantos tem.'),
          extra: CE.el('div', {}, f.barracas.length ? CE.el('ul', { class: 'pr-barracas' }, f.barracas.map(cartao)) : CE.el('p', { class: 'pr-suave' }, 'Nenhuma barraca aberta ainda.'), form),
          opcoes: [{ rotulo: 'Fechar' }] });
      }
      // O Pix: confere o nome de quem vai receber, paga e mostra o comprovante.
      async function pagarPix(b) {
        abrirDialogo({ tipo: 'pix', rosto: '📱', titulo: 'Pix', subtitulo: 'Confira antes de confirmar',
          fala: `Você vai pagar ${b.preco} moedas.`,
          lista: [`Para: ${b.dono}`, `Pelo quê: ${b.emoji} ${b.produto}`, 'Instituição: Banco Escola'],
          nota: 'O Pix cai na hora e não tem como desfazer. Sempre confira o NOME de quem vai receber.',
          opcoes: [{ rotulo: `Confirmar o Pix para ${b.dono}`, principal: true, fica: true, id: 'confirmar-pix', acao: async () => {
            if ((await CE.carteira.saldo()) < b.preco) return abrirDialogo({ tipo: 'pix', rosto: '💸', titulo: 'Saldo insuficiente', fala: `Você não tem ${b.preco} moedas na carteira. Saque do banco (💰 › 🏦 Banco) ou trabalhe numa vaga.`, opcoes: [{ rotulo: 'Voltar à feira', principal: true, fica: true, id: 'voltar-feira', acao: () => abrirFeira() }] });
            let r = null;
            try { r = await CE.api.chamar('praca:feira-comprar', { barraca: b.id, preco: b.preco }); } catch (e) { return abrirFeira(e.message); }
            try { await CE.carteira.gastar(b.preco, `Feira: ${b.emoji} ${b.produto} de ${b.dono} (Pix)`); } catch (e) { await CE.api.chamar('praca:feira-desfazer', { barraca: b.id, venda: r.venda.id }).catch(() => {}); return abrirFeira(e.message); }
            await CE.sessao.atualizarProgresso((p) => { p.praca = p.praca || {}; p.praca.compras = (Number(p.praca.compras) || 0) + 1; }).catch(() => {});
            CE.comemorar('pequena');
            const agora = new Date();
            abrirDialogo({ tipo: 'pix', rosto: '✅', titulo: 'Pix enviado', subtitulo: 'Comprovante',
              lista: [`Valor: ${b.preco} moedas`, `Para: ${b.dono}`, `Produto: ${b.emoji} ${b.produto}`, `Data: ${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, `Código: ${r.venda.id.toUpperCase()}`],
              nota: 'Guarde o comprovante: é a prova de que você pagou.',
              opcoes: [{ rotulo: 'Voltar à feira', principal: true, fica: true, id: 'voltar-feira', acao: () => abrirFeira() }, { rotulo: 'Fechar' }] });
          } }, { rotulo: 'Cancelar', fica: true, id: 'cancelar-pix', acao: () => abrirFeira() }] });
      }
      // ---------- Dinheiro da turma (só o professor) ----------
      async function abrirFinancas() {
        const lista = await chamar('praca:financas');
        if (!lista || fechouJanela) return;
        const m = (v) => CE.carteira.banco.moeda(v);
        const atencao = (f) => (f.sujo ? 0 : f.divida > 0 ? 1 : f.poupanca > 0 ? 3 : 2);
        const ord = lista.slice().sort((a, b) => atencao(a) - atencao(b) || a.nome.localeCompare(b.nome));
        const sujos = lista.filter((f) => f.sujo).length, devendo = lista.filter((f) => f.divida > 0).length, poupam = lista.filter((f) => f.poupanca > 0).length;
        abrirDialogo({ tipo: 'financas', rosto: '📊', titulo: 'Dinheiro da turma', subtitulo: 'Só você vê: use para puxar a conversa sem expor ninguém',
          fala: lista.length ? `🔴 ${sujos} com nome sujo · 🟡 ${devendo} com empréstimo · 🟢 ${poupam} guardando dinheiro` : 'Os alunos aparecem aqui quando entram na praça.',
          extra: lista.length ? CE.el('table', { class: 'pr-financas' }, CE.el('thead', {}, CE.el('tr', {}, ...['Aluno', 'Conta', 'Guardado', 'Dívida', 'Nome'].map((t) => CE.el('th', {}, t)))),
            CE.el('tbody', {}, ord.map((f) => CE.el('tr', { class: f.sujo ? 'sujo' : f.divida > 0 ? 'devendo' : '', 'data-aluno': f.nome },
              CE.el('td', {}, `${f.sujo ? '🔴' : f.divida > 0 ? '🟡' : '🟢'} ${f.nome}`), CE.el('td', {}, m(f.conta)), CE.el('td', {}, m(f.poupanca)), CE.el('td', {}, f.divida ? m(f.divida) : '—'),
              CE.el('td', {}, `${f.score}${f.sujo ? ' · sujo' : ''}${f.atrasadas ? ` · ${f.atrasadas} atrasada${f.atrasadas > 1 ? 's' : ''}` : ''}`))))) : null,
          nota: 'Ideias para a conversa: por que o nome sujou? Quanto custa o empréstimo em 30 dias? Quem guardou, ganhou quanto?',
          opcoes: [{ rotulo: 'Fechar' }] });
      }

      // ---------- Retorno do recrutador (o professor comenta a entrevista; o aluno vê na praça) ----------
      let retornoVisto = null, buscandoRetorno = false;
      async function verRetorno(em) {
        if (souInstrutor || !em || buscandoRetorno || fechouJanela) return;
        if (retornoVisto === null) {
          buscandoRetorno = true;
          const pr = await CE.sessao.progresso().catch(() => null);
          buscandoRetorno = false;
          retornoVisto = (pr && pr.praca && pr.praca.retornoVisto) || 0;
        }
        if (em <= retornoVisto || !dialogo.hidden) return;
        buscandoRetorno = true;
        const e = await CE.api.chamar('praca:minha-entrevista').catch(() => null);
        buscandoRetorno = false;
        if (!e || !e.comentario || !dialogo.hidden || fechouJanela) return;
        retornoVisto = e.comentario.em;
        await CE.sessao.atualizarProgresso((p) => { p.praca = p.praca || {}; p.praca.retornoVisto = e.comentario.em; }).catch(() => {});
        if (CE.voz) CE.voz.falar('Chegou o retorno do recrutador sobre a sua entrevista.');
        abrirMinhaEntrevista(e, true);
      }
      async function abrirMinhaEntrevista(e0, novo) {
        const e = e0 || await chamar('praca:minha-entrevista');
        if (fechouJanela) return;
        if (!e) return abrirDialogo({ tipo: 'vagas', rosto: '👨‍💼', papelCor: 'professor', titulo: 'Minha entrevista', fala: 'Você ainda não fez a entrevista de emprego.',
          opcoes: [{ rotulo: 'Fazer a entrevista agora', principal: true, fica: true, id: 'fazer-entrevista', acao: () => abrirEntrevista(0) }, { rotulo: 'Fechar' }] });
        const c = e.comentario;
        abrirDialogo({ tipo: 'retorno', rosto: '👨‍💼', papelCor: 'professor', titulo: novo ? '📨 Retorno do recrutador' : 'Minha entrevista',
          subtitulo: c ? `${c.por} · ${new Date(c.em).toLocaleDateString('pt-BR')}` : 'Agência de Empregos',
          fala: c ? `“${c.texto}”` : 'O recrutador ainda não deixou um retorno sobre a sua entrevista. Quando ele deixar, aparece aqui.',
          lista: [`Trabalho: ${e.experiencia}`, `💪 Pontos fortes: ${e.fortes.join(', ')}`, `🎯 Quer melhorar: ${e.melhorar.join(', ')}`],
          nota: c && novo ? 'Leia com atenção: o retorno ajuda a melhorar na próxima entrevista de verdade.' : null,
          opcoes: [{ rotulo: '💼 Ver as vagas', principal: true, fica: true, id: 'ver-vagas', acao: () => abrirVagas() }, { rotulo: 'Fechar' }] });
      }

      // ---------- Vagas de emprego e as provas (contratações) ----------
      const dinheiro = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
      let vagasConhecidas = NOV.VAGAS.slice();
      const nomeDaVaga = (id) => ((vagasConhecidas.find((x) => x.id === id) || {}).titulo || 'a vaga de antes').replace(/ \(promoção\)$/, '');
      const textoRequer = (v) => (v.requer === 'contratado' ? 'em qualquer vaga' : `como ${nomeDaVaga(v.requer)}`);
      async function meusCargos() {
        const pr = souInstrutor ? null : await CE.sessao.progresso().catch(() => null);
        const pp = (pr && pr.praca) || {};
        return { cargos: pp.cargos || {}, total: Number(pp.contratacoes) || 0 };
      }
      async function abrirVagas() {
        const r = await chamar('praca:vagas');
        if (!r || fechouJanela) return;
        vagasConhecidas = [...r.padrao, ...r.extras];
        const destaque = vagaDaHora();
        const pagos = souInstrutor ? {} : ((await CE.carteira.extrato()).chaves || {});
        const meus = await meusCargos();
        const hojeDia = NOV.dia(Date.now());
        const cartao = (v) => {
          const pago = pagos[`salario:${v.id}:${hojeDia}`];
          const em = destaque && destaque.id === v.id;
          const livre = souInstrutor || NOV.liberada(v, meus.cargos, meus.total);
          return CE.el('li', { class: 'pr-vaga' + (em ? ' destaque' : '') + (v.requer ? ' promocao' : '') + (livre ? '' : ' bloqueada'), 'data-vaga': v.id },
            CE.el('span', { class: 'ic', 'aria-hidden': 'true' }, v.emoji),
            CE.el('div', { class: 'txt' }, CE.el('strong', {}, v.titulo), CE.el('span', { class: 'pr-suave' }, `${v.lugar} · prova: ${NOV.PROVAS[v.prova]}`),
              v.requer ? CE.el('span', { class: 'pr-requer' }, livre && !souInstrutor ? `🔓 Promoção liberada para você (já foi contratado(a) ${textoRequer(v)})` : `🔒 Promoção: só para quem já foi contratado(a) ${textoRequer(v)}`) : null,
              CE.el('span', { class: 'pr-suave' }, `Salário: até ${Math.round(v.salario * (em ? 1.5 : 1)) + 10} moedas${em ? ' · ⭐ em destaque agora (+50%)' : ''}${pago ? ' · ✅ já recebeu hoje (pode treinar)' : ''}`)),
            CE.el('div', { class: 'pr-botoes' },
              souInstrutor ? null : livre ? CE.el('button', { class: 'botao' + (em ? '' : ' secundario'), type: 'button', 'data-candidatar': v.id, onclick: () => abrirProva(v) }, 'Candidatar-se')
                : CE.el('button', { class: 'botao secundario', type: 'button', 'data-candidatar': v.id, disabled: true, title: `Primeiro seja contratado(a) ${textoRequer(v)}` }, '🔒 Bloqueada'),
              souInstrutor && v.extra ? CE.el('button', { class: 'botao secundario', type: 'button', 'data-apagar-vaga': v.id, onclick: async () => { await chamar('praca:remover-vaga', v.id); abrirVagas(); } }, '🗑 Apagar') : null));
        };
        abrirDialogo({ tipo: 'vagas', rosto: '💼', titulo: 'Vagas de emprego', subtitulo: `Agência de Empregos · ${botaoRelogio.textContent}`,
          fala: souInstrutor ? 'As vagas da cidade. Crie vagas novas (com o seu texto de ditado, por exemplo) e leia as entrevistas da turma.' : 'Todos podem se candidatar. Cada vaga tem uma prova rápida; quem tira 60 ou mais é contratado e recebe o salário na conta do banco (uma vez por dia em cada vaga).',
          extra: CE.el('ul', { class: 'pr-vagas' }, [...r.padrao, ...r.extras].map(cartao)),
          opcoes: souInstrutor
            ? [{ rotulo: '➕ Criar vaga', principal: true, fica: true, id: 'criar-vaga', acao: () => abrirCriarVaga() }, { rotulo: '📋 Entrevistas da turma', fica: true, id: 'entrevistas', acao: () => abrirEntrevistas() }, { rotulo: '📊 Dinheiro da turma', fica: true, id: 'financas', acao: () => abrirFinancas() }, { rotulo: 'Fechar' }]
            : [{ rotulo: '🏦 Minha conta no banco', id: 'minha-conta', acao: () => { CE.carteira.aba = 'banco'; CE.janelas.abrir('carteira'); } }, { rotulo: '📄 Minha entrevista', fica: true, id: 'minha-entrevista', acao: () => abrirMinhaEntrevista() }, { rotulo: 'Fechar' }] });
      }
      function abrirCriarVaga(erro = '') {
        const campo = (id, rotulo, el) => CE.el('label', { class: 'pr-campo', for: id }, rotulo, el);
        const titulo = CE.el('input', { id: 'vaga-titulo', maxlength: '60', placeholder: 'Ex.: Digitador(a) da Câmara' });
        const lugar = CE.el('input', { id: 'vaga-lugar', maxlength: '60', placeholder: 'Ex.: Câmara de Vereadores' });
        const prova = CE.el('select', { id: 'vaga-prova' }, Object.entries(NOV.PROVAS).map(([id, nome]) => CE.el('option', { value: id }, nome)));
        const textoDit = CE.el('textarea', { id: 'vaga-texto', rows: '3', maxlength: '300', placeholder: 'O texto que o Professor Virtual vai ditar (só para a prova de ditado)' });
        const salario = CE.el('input', { id: 'vaga-salario', type: 'number', min: '5', max: '100', value: '30' });
        const requer = CE.el('select', { id: 'vaga-requer' }, CE.el('option', { value: '' }, 'Todos podem se candidatar'),
          CE.el('option', { value: 'contratado' }, 'Promoção: só quem já foi contratado(a) em alguma vaga'),
          ...vagasConhecidas.map((x) => CE.el('option', { value: x.id }, `Promoção: só quem já foi contratado(a) como ${nomeDaVaga(x.id)}`)));
        abrirDialogo({ tipo: 'vagas', rosto: '➕', titulo: 'Criar vaga', subtitulo: 'A vaga aparece para a turma toda', fala: erro || 'Preencha e crie. A prova pode ser ditado (com o seu texto), contas, memória ou cadastro.',
          extra: CE.el('div', { class: 'pr-form-vaga' }, campo('vaga-titulo', 'Nome da vaga', titulo), campo('vaga-lugar', 'Lugar', lugar), campo('vaga-prova', 'Prova', prova), campo('vaga-texto', 'Texto do ditado', textoDit), campo('vaga-salario', 'Salário (moedas)', salario), campo('vaga-requer', 'Quem pode se candidatar', requer)),
          opcoes: [{ rotulo: 'Criar a vaga', principal: true, fica: true, id: 'salvar-vaga', acao: async () => {
            try { await CE.api.chamar('praca:criar-vaga', { titulo: titulo.value, lugar: lugar.value, prova: prova.value, texto: textoDit.value, salario: salario.value, requer: requer.value }); abrirVagas(); } catch (e) { abrirCriarVaga(e.message); }
          } }, { rotulo: 'Voltar', fica: true, id: 'voltar', acao: () => abrirVagas() }] });
      }
      function retornoDoProfessor(e) {
        const caixa = CE.el('textarea', { rows: '2', maxlength: '300', 'data-retorno': e.id, 'aria-label': `Retorno para ${e.nome}`, placeholder: 'Seu retorno de recrutador (o aluno vê na praça). Ex.: Gostei da sua vontade de aprender! Treine a digitação.' });
        caixa.value = e.comentario ? e.comentario.texto : '';
        const aviso = CE.el('span', { class: 'pr-suave', 'data-retorno-ok': e.id, role: 'status' }, e.comentario ? '✅ Retorno enviado' : '');
        const enviar = async () => {
          const r = await chamar('praca:comentar-entrevista', { id: e.id, texto: caixa.value });
          if (r) aviso.textContent = r.comentario ? '✅ Retorno enviado: o aluno vê na praça.' : 'Retorno apagado.';
        };
        return CE.el('div', { class: 'pr-retorno' }, caixa, CE.el('div', { class: 'pr-botoes' }, CE.el('button', { class: 'botao secundario', type: 'button', 'data-salvar-retorno': e.id, onclick: enviar }, '📨 Enviar retorno'), aviso));
      }
      async function abrirEntrevistas() {
        const lista = await chamar('praca:entrevistas');
        if (!lista) return;
        abrirDialogo({ tipo: 'vagas', rosto: '📋', titulo: 'Entrevistas da turma', subtitulo: `${lista.length} entrevista${lista.length === 1 ? '' : 's'}`,
          extra: lista.length ? CE.el('ul', { class: 'pr-entrevistas' }, lista.map((e) => CE.el('li', {},
            CE.el('strong', {}, `${e.nome}${e.idade ? `, ${e.idade} anos` : ''}${e.turma ? ` · turma ${e.turma}` : ''}`),
            CE.el('span', {}, `Trabalho: ${e.experiencia}`), CE.el('span', {}, `💪 Pontos fortes: ${e.fortes.join(', ')}`), CE.el('span', {}, `🎯 Quer melhorar: ${e.melhorar.join(', ')}`),
            e.motivo ? CE.el('span', {}, `💬 ${e.motivo}`) : null, retornoDoProfessor(e)))) : CE.el('p', { class: 'pr-suave' }, 'Nenhum aluno fez a entrevista ainda. Ela aparece sozinha na primeira vez que o aluno entra na praça.'),
          opcoes: [{ rotulo: 'Voltar às vagas', fica: true, id: 'voltar', acao: () => abrirVagas() }, { rotulo: 'Fechar' }] });
      }
      // As provas: cada uma devolve a nota (0 a 100) para resultadoDaProva.
      let provaId = 0;
      const sorteio = (l) => l[Math.floor(Math.random() * l.length)];
      const semAcento = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
      const palavras = (s) => String(s).toLowerCase().replace(/[.,;:!?"“”]/g, ' ').split(/\s+/).filter(Boolean);
      async function abrirProva(v) {
        if (!souInstrutor && v.requer) {
          const meus = await meusCargos();
          if (!NOV.liberada(v, meus.cargos, meus.total)) return abrirDialogo({ tipo: 'vagas', rosto: '🔒', titulo: v.titulo, fala: `Esta vaga é uma promoção: primeiro seja contratado(a) ${textoRequer(v)}.`, opcoes: [{ rotulo: '💼 Outras vagas', principal: true, fica: true, id: 'outras-vagas', acao: () => abrirVagas() }] });
        }
        abrirDialogo({ tipo: 'prova', rosto: v.emoji, titulo: v.titulo, subtitulo: `${v.lugar} · ${NOV.PROVAS[v.prova]}`, fala: v.explica,
          lista: { ditado: ['O tabelião fala o texto (e ele aparece aos poucos).', 'Digite junto, no mesmo ritmo.', 'Quando acabar, aperte "Terminei". O relógio corre!'],
            contas: ['Quatro clientes no caixa.', 'Some a compra ou calcule o troco e digite o valor (ex.: 12,50).', 'Rápido e sem errar: o relógio corre!'],
            memoria: ['Uma sequência de números aparece por alguns segundos.', 'Depois ela some e você digita de cabeça.', 'São três rodadas, cada uma um número maior.'],
            ficha: ['Uma ficha de paciente aparece na tela.', 'Copie os dados nos campos do computador, sem errar.', 'O relógio corre!'] }[v.prova],
          opcoes: [{ rotulo: 'Começar a prova ▶', principal: true, fica: true, id: 'comecar-prova', acao: () => ({ ditado: provaDitado, contas: provaContas, memoria: provaMemoria, ficha: provaFicha })[v.prova](v) }, { rotulo: 'Voltar às vagas', fica: true, id: 'voltar', acao: () => abrirVagas() }] });
      }
      // Relógio da prova; para sozinho se a pessoa fechar a janelinha.
      function cronometro(segundos, el, aoAcabar) {
        const id = ++provaId, fim = performance.now() + segundos * 1000;
        const tique = () => {
          if (id !== provaId || dialogo.hidden || dialogo.dataset.tipo !== 'prova') return;
          const resta = Math.max(0, Math.ceil((fim - performance.now()) / 1000));
          el.textContent = `⏱ ${resta}s`; el.classList.toggle('acabando', resta <= 10);
          if (resta <= 0) { provaId++; aoAcabar(); return; }
          setTimeout(tique, 250);
        };
        tique();
        return { parar: () => { if (id === provaId) provaId++; }, vivo: () => id === provaId };
      }
      function provaDitado(v) {
        const texto = sorteio(v.textos && v.textos.length ? v.textos : NOV.VAGAS[0].textos);
        const ps = texto.split(' ');
        const mostra = CE.el('p', { class: 'pr-ditado' });
        const relogio = CE.el('strong', { class: 'pr-prova-relogio' });
        const area = CE.el('textarea', { id: 'pr-campo-ditado', rows: '3', autocomplete: 'off', spellcheck: 'false', placeholder: 'Digite aqui o que o tabelião fala...' });
        const terminar = () => {
          relo.parar();
          const certo = palavras(texto), meu = palavras(area.value);
          let pontos = 0;
          certo.forEach((w, k) => { const m = meu[k]; if (m === w) pontos += 1; else if (m && semAcento(m) === semAcento(w)) pontos += 0.5; });
          resultadoDaProva(v, Math.round((pontos / certo.length) * 100), `Você acertou ${Math.round(pontos)} de ${certo.length} palavras.`, texto);
        };
        abrirDialogo({ tipo: 'prova', rosto: '📝', titulo: v.titulo, subtitulo: 'Ditado: digite junto com o tabelião', extra: CE.el('div', { class: 'pr-prova' }, relogio, mostra, area),
          opcoes: [{ rotulo: 'Terminei ✅', principal: true, fica: true, id: 'terminei', acao: terminar }] });
        const relo = cronometro(Math.ceil(ps.length * 1.3) + 12, relogio, terminar);
        if (CE.voz) CE.voz.falar(texto, { velocidade: 0.85, forcar: true });
        ps.forEach((w, k) => setTimeout(() => { if (relo.vivo()) mostra.textContent = ps.slice(0, k + 1).join(' '); }, 700 * k));
        area.focus();
      }
      function provaContas(v) {
        const P = [['açaí', 12], ['farinha d’água', 8.5], ['tucumã', 2], ['castanha', 15], ['banana', 1.5], ['peixe', 22]];
        const perguntas = [0, 1, 2, 3].map((k) => {
          const [a, pa] = sorteio(P), [b, pb] = sorteio(P.filter((x) => x[0] !== a)), qa = 1 + Math.floor(Math.random() * 3);
          const total = qa * pa + pb;
          if (k % 2) { const pagou = Math.ceil(total / 10) * 10 + (total % 10 === 0 ? 10 : 0); return { texto: `${qa} ${a} (R$ ${dinheiro(pa).slice(3)} cada) e 1 ${b} (${dinheiro(pb)}). A cliente pagou com ${dinheiro(pagou)}. Qual é o troco?`, resposta: pagou - total }; }
          return { texto: `${qa} ${a} (${dinheiro(pa)} cada) e 1 ${b} (${dinheiro(pb)}). Quanto dá a compra?`, resposta: total };
        });
        let k = 0, acertos = 0;
        const relogio = CE.el('strong', { class: 'pr-prova-relogio' });
        const enunciado = CE.el('p', { class: 'pr-ditado' });
        const campo = CE.el('input', { id: 'pr-campo-conta', inputmode: 'decimal', autocomplete: 'off', placeholder: 'Ex.: 12,50' });
        const fim = () => { relo.parar(); resultadoDaProva(v, Math.round((acertos / perguntas.length) * 100), `Você acertou ${acertos} de ${perguntas.length} contas.`); };
        const mostrar = () => { enunciado.textContent = `Cliente ${k + 1} de ${perguntas.length}: ${perguntas[k].texto}`; campo.value = ''; campo.focus(); };
        const responder = () => {
          const n = parseFloat(String(campo.value).replace(/[^\d,.]/g, '').replace(',', '.'));
          if (Math.abs(n - perguntas[k].resposta) < 0.001) acertos++;
          k++;
          if (k >= perguntas.length) fim(); else mostrar();
        };
        abrirDialogo({ tipo: 'prova', rosto: '🛒', titulo: v.titulo, subtitulo: 'Caixa do mercado', extra: CE.el('div', { class: 'pr-prova' }, relogio, enunciado, campo),
          opcoes: [{ rotulo: 'Confirmar ▶', principal: true, fica: true, id: 'confirmar-conta', acao: responder }] });
        campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); responder(); } });
        const relo = cronometro(90, relogio, fim);
        mostrar();
      }
      function provaMemoria(v) {
        const tamanhos = [5, 6, 7];
        let rodada = 0, total = 0;
        const fim = () => resultadoDaProva(v, Math.round((total / tamanhos.length) * 100), `Você guardou ${Math.round(total * 10) / 10} de ${tamanhos.length} sequências.`);
        const rodar = () => {
          if (rodada >= tamanhos.length) return fim();
          const seq = Array.from({ length: tamanhos[rodada] }, () => Math.floor(Math.random() * 10)).join('');
          const relogio = CE.el('strong', { class: 'pr-prova-relogio' });
          abrirDialogo({ tipo: 'prova', rosto: '📞', titulo: v.titulo, subtitulo: `Rodada ${rodada + 1} de ${tamanhos.length}: guarde de cabeça`,
            extra: CE.el('div', { class: 'pr-prova' }, relogio, CE.el('p', { class: 'pr-sequencia', 'data-sequencia': seq }, seq.split('').join(' '))), opcoes: [] });
          const relo = cronometro(4 + rodada, relogio, () => {
            const campo = CE.el('input', { id: 'pr-campo-memoria', inputmode: 'numeric', autocomplete: 'off', maxlength: '12' });
            const conferir = () => {
              const meu = campo.value.replace(/\D/g, '');
              let certos = 0; for (let i = 0; i < seq.length; i++) if (meu[i] === seq[i]) certos++;
              total += certos / seq.length; rodada++; rodar();
            };
            abrirDialogo({ tipo: 'prova', rosto: '📞', titulo: v.titulo, subtitulo: `Rodada ${rodada + 1} de ${tamanhos.length}`, fala: 'Qual era a sequência? Digite de cabeça.',
              campo: CE.el('label', { class: 'pr-campo', for: 'pr-campo-memoria' }, 'Sequência', campo), opcoes: [{ rotulo: 'Confirmar ▶', principal: true, fica: true, id: 'confirmar-memoria', acao: conferir }] });
            campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); conferir(); } });
          });
          if (!relo) return;
        };
        rodar();
      }
      function provaFicha(v) {
        const nomes = ['Maria José da Silva', 'Raimundo Nonato Souza', 'Francisca das Chagas Lima', 'José Ribamar Oliveira', 'Antônia Ferreira Costa'];
        const num = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
        const cpf = num(11), tel = '69' + '9' + num(8), cep = '768' + num(5);
        const dados = { nome: sorteio(nomes), cpf: `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`, telefone: `(${tel.slice(0, 2)}) ${tel.slice(2, 7)}-${tel.slice(7)}`, cep: `${cep.slice(0, 5)}-${cep.slice(5)}` };
        const relogio = CE.el('strong', { class: 'pr-prova-relogio' });
        const rot = { nome: 'Nome completo', cpf: 'CPF', telefone: 'Telefone', cep: 'CEP' };
        const campos = Object.fromEntries(Object.keys(dados).map((k) => [k, CE.el('input', { id: 'pr-ficha-' + k, autocomplete: 'off', 'data-ficha': k })]));
        const terminar = () => {
          relo.parar();
          let certos = 0;
          for (const k of Object.keys(dados)) {
            const a = campos[k].value.trim(), b = dados[k];
            if (k === 'nome' ? semAcento(a).toLowerCase().replace(/\s+/g, ' ') === semAcento(b).toLowerCase() : a.replace(/\D/g, '') === b.replace(/\D/g, '')) certos++;
          }
          resultadoDaProva(v, Math.round((certos / 4) * 100), `Você acertou ${certos} de 4 campos.`);
        };
        abrirDialogo({ tipo: 'prova', rosto: '🗂️', titulo: v.titulo, subtitulo: 'Cadastro: copie a ficha no computador',
          extra: CE.el('div', { class: 'pr-prova' }, relogio,
            CE.el('div', { class: 'pr-ficha-papel' }, CE.el('strong', {}, '📄 Ficha do paciente'), ...Object.keys(dados).map((k) => CE.el('span', { 'data-papel': k }, `${rot[k]}: ${dados[k]}`))),
            CE.el('div', { class: 'pr-ficha-campos' }, ...Object.keys(dados).map((k) => CE.el('label', { class: 'pr-campo', for: 'pr-ficha-' + k }, rot[k], campos[k])))),
          opcoes: [{ rotulo: 'Salvar o cadastro ✅', principal: true, fica: true, id: 'salvar-ficha', acao: terminar }] });
        const relo = cronometro(90, relogio, terminar);
        campos.nome.focus();
      }
      async function resultadoDaProva(v, nota, detalhe, textoCerto) {
        provaId++;
        const passou = nota >= 60;
        const destaque = (vagaDaHora() || {}).id === v.id;
        const salario = passou ? Math.round(v.salario * (nota / 100) * (destaque ? 1.5 : 1)) + (nota >= 90 ? 10 : 0) : 0;
        let pago = null, primeiraVez = false, primeiroEmprego = false;
        if (passou && !souInstrutor) {
          pago = await CE.carteira.banco.receberSalario(salario, `${v.titulo} (nota ${nota})`, `salario:${v.id}:${NOV.dia(Date.now())}`);
          meuCracha = v.emoji; marcarCracha(eu, meuCracha);
          await CE.sessao.atualizarProgresso((p) => {
            p.praca = p.praca || {}; p.praca.cracha = v.emoji;
            primeiraVez = !(p.praca.cargos && p.praca.cargos[v.id]);
            primeiroEmprego = !(Number(p.praca.contratacoes) > 0);
            p.praca.contratacoes = (Number(p.praca.contratacoes) || 0) + 1;
            p.praca.cargos = { ...(p.praca.cargos || {}), [v.id]: Math.max(nota, Number((p.praca.cargos || {})[v.id]) || 0) };
          }).catch(() => {});
          conquista('contratado');
          if (v.requer) conquista('promovido');
          CE.comemorar(nota >= 90 ? 'grande' : 'pequena');
        }
        const cargo = nota >= 90 ? 'Supervisor(a)' : 'Contratado(a)';
        const lista = [detalhe, ...(textoCerto ? [`Texto: “${textoCerto}”`] : [])];
        if (passou && pago) lista.push(`💰 Salário: ${pago.valor} moedas${destaque ? ' (vaga em destaque: +50%)' : ''}${nota >= 90 ? ' (+10 de bônus)' : ''}.`, pago.desconto ? `📉 ${CE.carteira.banco.moeda(pago.desconto)} foram para pagar o empréstimo; caíram ${CE.carteira.banco.moeda(pago.liquido)} na conta.` : '🏦 O salário caiu na sua conta no banco.');
        if (passou && !pago && !souInstrutor) lista.push('✅ Você já recebeu por esta vaga hoje: esta prova valeu como treino.');
        const promocoes = primeiraVez ? vagasConhecidas.filter((x) => x.requer === v.id || (x.requer === 'contratado' && primeiroEmprego)) : [];
        for (const x of promocoes) lista.push(`🔓 Promoção liberada: ${x.titulo.replace(/ \(promoção\)$/, '')} (paga até ${x.salario + 10} moedas). Veja em 💼 Vagas!`);
        if (CE.voz) CE.voz.falar(passou ? `Parabéns! Você foi contratado. Nota ${nota}.` : `Nota ${nota}. Ainda não foi desta vez. Treine e tente de novo!`);
        abrirDialogo({ tipo: 'vagas', rosto: passou ? '🤝' : '💪', titulo: passou ? `${cargo}! Nota ${nota}` : `Nota ${nota}: ainda não foi desta vez`, subtitulo: v.titulo,
          fala: passou ? `Parabéns! Você ganhou o crachá ${v.emoji}, que todo mundo vê no seu boneco.` : 'Para ser contratado, precisa de nota 60. Treine e tente de novo: você pode se candidatar quantas vezes quiser.',
          lista, opcoes: [{ rotulo: 'Tentar de novo', fica: true, id: 'de-novo', acao: () => abrirProva(v) }, { rotulo: '💼 Outras vagas', principal: true, fica: true, id: 'outras-vagas', acao: () => abrirVagas() }, ...(passou && !souInstrutor ? [{ rotulo: '🏦 Ver a conta', id: 'ver-conta', acao: () => { CE.carteira.aba = 'banco'; CE.janelas.abrir('carteira'); } }] : [])] });
      }

      // ---------- Perto de quê? ----------
      function oQueEstaPerto() {
        const lixo = lixoPerto(eu.x, eu.y);
        if (lixo) return { lixo };
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
        if (a.lixo) return pegarLixo(a.lixo);
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
        if (a.lixo) return `♻️ Pegar ${a.lixo.nome} ${a.lixo.emoji}`;
        if (a.morador) return `💬 Conversar com ${a.morador.nome}`;
        if (a.pessoa) return `💬 Falar com ${a.pessoa.nomeReal}`;
        return textoDoLugar(a.lugar) + (pistaAqui(a.lugar.id) ? ' · 🔎 pista' : '');
      }
      function textoDoLugar(L) {
        if (NA_CIDADE[L.id] && !aceso(L.id)) return `🚧 Ver a obra: ${nomeDoLugar(L.id)}`;
        if (L.coleta) return coletaAtual && coletaAtual.carregando ? `${L.emoji} Jogar na lixeira ${COR_LIXEIRA[L.coleta]}` : `${L.emoji} Lixeira ${COR_LIXEIRA[L.coleta]}: ${NOV.COLETA.explica[L.coleta].split(' vai')[0].split(' vão')[0].toLowerCase()}`;
        const fixo = { 'mesa-velha': '❌ Jogar jogo da velha', 'mesa-domino': '🎲 Ver a mesa de dominó', mural: '📌 Ler o mural', coreto: '🎭 Ver a novela no coreto', fonte: '⛲ Ver a fonte', lote: '🚧 Ver o Lote da turma', 'casa-ana': '🏠 Ver a Rua da Turma', 'casa-bruno': '🏠 Ver a Rua da Turma' }[L.id];
        if (fixo) return fixo;
        if (L.id === 'sua-casa') return souInstrutor ? '🏠 Ver a Rua da Turma' : minhaCasa && minhaCasa.casa ? '🏠 Entrar na sua casa' : '🏗️ Ver o seu terreno';
        return `${L.emoji} ${L.telhado ? 'Entrar: ' : 'Ver: '}${nomeDoLugar(L.id)}`;
      }
      let pertoAtual = null, pertoAlvo = null;
      function verPerto(forcar) {
        const z = zonaDaAcao();
        const a = z || oQueEstaPerto();
        const chave = a ? (a.emergencia ? 'e' + a.emergencia + emerg.tipo + (a.foco ? a.foco.id : '') + (a.queda ? a.queda.id : '') : a.lixo ? 'x' + a.lixo.id : a.morador ? 'm' + a.morador.id : a.pessoa ? 'p' + a.pessoa.id : 'l' + a.lugar.id) : '';
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
        // onde o boneco está na tela: o meio, o alto da cabeça e o pé
        let meio, cabeca, pe;
        if (iso && cena) { const [X, Y] = cena.tela(eu.x + 0.5, eu.y + 0.5, 0); meio = cam.x + X * cam.s; pe = cam.y + Y * cam.s; cabeca = pe - (T + 8) * cam.s; }
        else { meio = cam.x + (eu.x + 0.5) * T * cam.s; cabeca = cam.y + (eu.y * T - 8) * cam.s; pe = cam.y + (eu.y + 1) * T * cam.s; }
        const x = Math.max(meia + 8, Math.min(cw - meia - 8, meio));
        let y = cabeca - (eu.balaoEl ? eu.balaoEl.offsetHeight + 12 : 0);
        const embaixo = y - alto < 58;
        if (embaixo) y = pe + 24 * cam.s;
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
        const [mx, my] = planoDaTela(e.clientX - r.left, e.clientY - r.top);
        const x = Math.floor(mx), y = Math.floor(my);
        const dentro = (a, b) => a >= 0 && b >= 0 && a < W && b < H;
        // No 3D, o fogo, o lixo e o que mais fica em pé aparecem um pouco acima do chão: o clique nessa altura também vale.
        const [ax, ay] = iso && cena ? planoDaTela(e.clientX - r.left, e.clientY - r.top + 0.55 * cena.HZ * T * cam.s).map(Math.floor) : [x, y];
        // No evento urgente, o lugar do evento vale mesmo atrás de um prédio em pé (a placa dele fica por cima de tudo).
        if (emergAtiva() && ((dentro(x, y) && cliqueNoEvento(x, y)) || ((ax !== x || ay !== y) && dentro(ax, ay) && cliqueNoEvento(ax, ay)))) return;
        if (iso && cena) {
          // um prédio em pé: o clique vai para ele (se acertou o desenho, e não o vazio em volta)
          const predio = e.target.closest && e.target.closest('.pr-iso[data-lugar]');
          if (predio && pontoOpaco(predio, e)) {
            const P = M.porLugar[predio.dataset.lugar];
            if (P) {
              if (!perto) { for (const rt of Object.values(rotuloDe)) rt.classList.remove('destaque'); if (rotuloDe[P.id]) rotuloDe[P.id].classList.add('destaque'); }
              return chegarAoLugar(P);
            }
          }
        }
        if (!dentro(x, y)) return;
        const lixo = coletaAtual && (coletaAtual.itens || []).find((i) => (i.x === x && i.y === y) || (i.x === ax && i.y === ay));
        if (lixo) {
          if (coletaAtual.carregando) { balao(eu, `Primeiro jogo ${coletaAtual.carregando.nome} na lixeira certa! ♻️`); return; }
          irPara([[lixo.x, lixo.y], ...M.vizinhos(lixo.x, lixo.y)], () => { const ainda = coletaAtual && (coletaAtual.itens || []).find((i) => i.id === lixo.id); if (ainda) pegarLixo(ainda); });
          return;
        }
        // No 3D, a pessoa fica em pé em cima do quadrinho: clicar no chão onde ela pisa também vale (como no 2D; o lixo
        // no chão vem antes).
        if (iso) {
          const pisando = [...moradores.filter(presente), ...outros.values()].find((q) => q.el && Math.round(q.x) === x && Math.round(q.y) === y);
          if (pisando) return chegarPerto(pisando);
        }
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

      // ---------- Praça em 3D (isométrica): trocar 2D ↔ 3D, girar, rótulos em cima dos prédios, profundidade ----------
      function planoDaTela(sx, sy) {
        if (iso && cena) return cena.chao((sx - cam.x) / cam.s, (sy - cam.y) / cam.s);
        return [(sx - cam.x) / cam.s / T, (sy - cam.y) / cam.s / T];
      }
      function pontoOpaco(el, e) {
        try {
          const k = el.width / (el.clientWidth || 1);
          return el.getContext('2d').getImageData(Math.floor(e.offsetX * k), Math.floor(e.offsetY * k), 1, 1).data[3] > 24;
        } catch (erro) { return true; }
      }
      function posicionarRotulos() {
        for (const r of camadaRotulos.querySelectorAll('.pr-rotulo[data-x]')) {
          const L = r.dataset.lugar && M.porLugar[r.dataset.lugar];
          if (iso && cena && L && (L.telhado || L.casa)) {
            const [x, y, w, h] = L.r, alto = obras[L.id] ? 1.2 : M.alturaDe(L) + M.bicoDe(L) + (L.placa ? 1.25 : 0);
            r.style.left = `${(x + w / 2 + (L.rotuloDx || 0)) * T}px`; r.style.top = `${(y + h / 2) * T}px`;
            r.style.setProperty('--sobe', `${-Math.round(alto * cena.HZ * T + 18)}px`);
          } else {
            r.style.left = `${r.dataset.x}px`; r.style.top = `${r.dataset.y}px`;
            r.style.setProperty('--sobe', iso ? '-6px' : '0px');
          }
        }
        for (const [id, m] of Object.entries(marcas)) {
          const r = rotuloDe[id];
          if (!r) continue;
          m.style.left = r.style.left;
          m.style.top = iso ? r.style.top : `calc(${r.style.top} - 30px)`;
          m.style.setProperty('--sobe', iso ? `calc(${r.style.getPropertyValue('--sobe') || '0px'} - 42px)` : '0px');
        }
      }
      // As coisas do evento e os objetos ficam em pé no 3D: cada um com a profundidade do lugar onde está.
      const DEITADOS = ['pr-obra', 'pr-enchente', 'pr-sacos', 'pr-arvore-caida', 'pr-toco', 'pr-jato'];
      function profundidadesIso() {
        if (!iso || !cena) return;
        for (const el of camadaObjetos.children) {
          if (DEITADOS.some((c) => el.classList.contains(c))) continue;
          const x = parseFloat(el.style.left), y = parseFloat(el.style.top);
          if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
          const z = String(cena.zDe(cena.prof(x / T, y / T)) + 30);
          if (el.style.zIndex !== z) el.style.zIndex = z;
        }
        cena.arvoresCaidas([...camadaObjetos.querySelectorAll('.pr-toco[data-arvore]')].map((t) => t.dataset.arvore));
        // Atrás de um prédio alto (ou de uma árvore), o boneco de quem joga não some: o que está na frente fica transparente.
        const [X, Y] = cena.tela(eu.x + 0.5, eu.y + 0.5);
        cena.vazar({ x: X, y: Y, z: cena.zDe(cena.prof(eu.x + 0.5, eu.y + 0.5)) + 40 });
      }
      function aplicarVisual(modo, inicio) {
        visao = modo === '2d' ? '2d' : 'iso';
        gravarLocal('ce-praca-visual', visao);
        desenharInstrutor();
        const novo = visao === 'iso' && !!CE.pracaIso;
        if (!inicio && novo === iso) return;
        const mudou = novo !== iso;
        iso = novo;
        mapa.classList.toggle('iso', iso);
        giros.hidden = !iso;
        if (mudou) desenharCidade(tela, iso);
        if (iso && !cena) cena = CE.pracaIso.criarCena({ mapa: M, T, camada: camadaIso, cores: CORES_DA_MAQUETE, emObra: (id) => !!obras[id], giro, chao: tela });
        else if (!iso && cena) { cena.destruir(); cena = null; }
        if (cena) mundo.style.setProperty('--anti', cena.G.anti);
        if (!iso) for (const el of camadaObjetos.children) el.style.zIndex = '';
        posicionarRotulos();
        for (const p of [eu, ...moradores, professorEl, ...outros.values()]) posicionar(p);
        profundidadesIso();
        enquadrar();
      }
      function girar(passo) {
        if (!iso || !cena || mapa.classList.contains('girando')) return;
        mapa.classList.add('girando');
        setTimeout(() => {
          if (cena) {
            giro = (cena.giro + passo + 4) % 4;
            gravarLocal('ce-praca-giro', String(giro));
            cena.girar(giro);
            mundo.style.setProperty('--anti', cena.G.anti);
            for (const p of [eu, ...moradores, professorEl, ...outros.values()]) posicionar(p);
            profundidadesIso();
            enquadrar();
          }
          requestAnimationFrame(() => requestAnimationFrame(() => mapa.classList.remove('girando')));
        }, 170);
      }
      botaoGiroEsq.addEventListener('click', () => girar(-1));
      botaoGiroDir.addEventListener('click', () => girar(1));

      // ---------- Nomes limpos: de perto, aparece só o nome do que está perto do boneco ou embaixo do mouse ----------
      let mouseChao = null, mouseLugar = null, todosNomes = false;
      const PERTO_DO_NOME = 4.5;
      mapa.addEventListener('mousemove', (e) => {
        const r = mapa.getBoundingClientRect(); mouseChao = planoDaTela(e.clientX - r.left, e.clientY - r.top);
        // no 3D, o mouse em cima do desenho do prédio (telhado, parede) mostra o nome dele
        const predio = iso && cena && e.target.closest && e.target.closest('.pr-iso[data-lugar]');
        const antes = mouseLugar; mouseLugar = predio && pontoOpaco(predio, e) ? predio.dataset.lugar : null;
        if (mouseLugar !== antes) atualizarNomes();
      });
      mapa.addEventListener('mouseleave', () => { mouseChao = null; mouseLugar = null; atualizarNomes(); });
      botaoNomes.addEventListener('click', () => { todosNomes = !todosNomes; botaoNomes.setAttribute('aria-pressed', String(todosNomes)); botaoNomes.classList.toggle('ligado', todosNomes); atualizarNomes(); });
      function atualizarNomes() {
        const limpo = perto && !todosNomes;
        mapa.classList.toggle('nomes-limpos', limpo);
        if (!limpo) return;
        const [mx, my] = mouseChao || [-99, -99];
        for (const r of camadaRotulos.querySelectorAll('.pr-rotulo')) {
          if (r.classList.contains('rua')) continue;
          const L = r.dataset.lugar && M.porLugar[r.dataset.lugar];
          let ver;
          if (L) {
            const [x, y, w, h] = L.r, dx = Math.max(x - eu.x, 0, eu.x - (x + w - 1)), dy = Math.max(y - eu.y, 0, eu.y - (y + h - 1));
            ver = L.id === mouseLugar || Math.hypot(dx, dy) <= 2.5 || (mx >= x - 0.5 && mx <= x + w + 0.5 && my >= y - 0.5 && my <= y + h + 0.5);
          } else {
            const ax = Number(r.dataset.x) / T, ay = Number(r.dataset.y) / T;
            ver = Math.hypot(ax - eu.x - 0.5, ay - eu.y - 0.5) <= PERTO_DO_NOME || Math.hypot(ax - mx, ay - my) <= 1.6;
          }
          r.classList.toggle('visto', !!ver);
        }
        for (const p of [...moradores, professorEl, ...outros.values()]) if (p && p.el) p.el.classList.toggle('visto', Math.hypot(p.x - eu.x, p.y - eu.y) <= PERTO_DO_NOME || Math.hypot(p.x + 0.5 - mx, p.y + 0.5 - my) <= 1.2);
      }

      // ---------- Laço ----------
      let antes = performance.now(), ultimoPerto = 0, ultimaSincronia = 0, quadroId = 0;
      function quadro(agora) {
        if (fechouJanela) return;
        const dt = Math.min(0.05, (agora - antes) / 1000); antes = agora;
        if (!bloqueado()) mover(dt);
        moverOutros(dt);
        if (perto) enquadrar();
        if (agora - ultimoPerto > 200) { ultimoPerto = agora; verPerto(); andarRelogio(); profundidadesIso(); atualizarNomes(); }
        posicionarAcao();
        const minimizada = janela.elemento ? janela.elemento.classList.contains('minimizada') : corpo.closest('.janela') && corpo.closest('.janela').classList.contains('minimizada');
        if (agora - ultimaSincronia > (minimizada ? SINCRONIA_LONGE : SINCRONIA)) { ultimaSincronia = agora; sincronizar(); }
        quadroId = requestAnimationFrame(quadro);
      }
      sistema('Você chegou na Praça Escola. Clique no chão para andar e chegue perto das pessoas para conversar.');
      verPerto(true);
      mostrarDica();
      aplicarVisual(visao, true);
      enquadrar();
      sincronizar();
      CE.praca.informar();
      quadroId = requestAnimationFrame(quadro);

      // ---------- Abertura: a maquete da cidade em pontos (app/js/praca-abertura3d.js) ----------
      // Só na primeira entrada da sessão; dá para rever no 🏙️ Cidade (🎬 Ver maquete). Ela fica por cima do mapa e
      // some num crossfade no mesmo enquadramento: o jogo por baixo continua igual (só os cliques e teclas da
      // abertura não chegam nele).
      let maquete = null;
      function verMaquete(primeiraVez) {
        if (maquete || fechouJanela || !CE.abertura3d) return;
        maquete = CE.abertura3d.iniciarAbertura({
          alvo: mapa, mapa: M, cores: CORES_DA_MAQUETE,
          pronto: primeiraVez ? chegouCidade : true,
          emObra: (id) => !!obras[id],
          trem: () => !enfeiteDe.estacao[0].hidden,
          voce: () => ({ x: eu.x, y: eu.y }),
          enquadramento: () => ({ x: cam.x, y: cam.y, s: cam.s }),
          final: () => (iso && cena ? { yaw: cena.G.th, pitch: Math.PI / 3, ergue: true } : null), // termina no 3D (ou de cima, no 2D)
          aoComecar: () => { if (primeiraVez) CE.abertura3d.marcarVista(); },
        }, () => {
          maquete = null;
          const foco = document.activeElement;
          if (fechouJanela || (foco && foco !== document.body && !mapa.contains(foco))) return; // o foco está em outro lugar: fica lá
          const noDialogo = !dialogo.hidden && dialogo.querySelector('input:not([type="checkbox"]), button');
          (noDialogo || mapa).focus({ preventScroll: true });
        });
      }
      if (CE.abertura3d && CE.abertura3d.deveMostrar()) verMaquete(true);

      return {
        receber() { mudarZoom(true); },
        aoFechar() {
          fechouJanela = true;
          if (maquete) maquete.parar();
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
