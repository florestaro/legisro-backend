// As cenas animadas do "Do Campo ao Balcão": a roça (o milho cresce, chove ou faz sol), o pasto (as vacas andam e
// comem o capim), o mapa da cadeia (o caminhão corre pela BR-364), o frigorífico (a esteira leva os hambúrgueres para
// a câmara fria), a lanchonete (os clientes entram, fazem fila e saem felizes ou bravos) e o escritório.
// O dia escurece à noite. Tudo se joga clicando nas coisas da cena: aparece um menu com o que dá para fazer ali.
// Os números vêm das regras (negocio-regras.js); aqui é só o desenho e os cliques.
window.CE = window.CE || {};

(function () {
  const LW = 800, LH = 360; // tamanho "lógico" de toda cena (a tela escala)
  const FONTE = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  const TEXTO = '"Segoe UI", system-ui, sans-serif';
  const lim = (v, a, b) => Math.max(a, Math.min(b, v));
  const hex = (c) => { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const mistura = (a, b, k) => { const x = hex(a), y = hex(b); k = lim(k, 0, 1); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`; };
  const sorte = (i) => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); }; // "acaso" fixo por índice
  const GENTE = ['🧑', '👩', '👨', '👧', '👵', '🧒', '👴', '🧔', '👱'];

  // ctx: { acao(funcao, tipo, dados) → Promise, pode(funcao), quem(funcao), irPara(funcao), avisar(msg), aoMudar() }
  function criar(tipo, ctx) {
    const caixa = CE.el('div', { class: 'ng-cena', 'data-cena': tipo });
    const tela = CE.el('canvas', { class: 'ng-cena-tela', 'aria-label': 'Cena do jogo: clique nas coisas para agir' });
    const dica = CE.el('div', { class: 'ng-cena-dica' }); dica.hidden = true;
    const menuEl = CE.el('div', { class: 'ng-cena-menu', role: 'menu' }); menuEl.hidden = true;
    caixa.append(tela, dica, menuEl);
    const g = tela.getContext('2d');
    let est = null, emp = null, alvos = [], vivo = true, escala = 1, antes = 0, horasBase = 0, recebido = 0;
    const L = { vacas: [], clientes: [], efeitos: [], ultimo: null, ativo: -1, gotas: [] };

    // ---------- Relógio do jogo, suave entre uma atualização e outra ----------
    function horasAgora() {
      if (!est) return 0;
      if (est.estado !== 'rodando') return horasBase;
      const porMs = 24 / Math.max(1000, est.msPorDia || 100000);
      return horasBase + Math.min(1.2, (performance.now() - recebido) * porMs);
    }
    const horaDoDia = () => horasAgora() % 24;

    // ---------- Desenho básico ----------
    const em = (t, x, y, s, alfa, virar) => {
      g.save(); g.font = `${s}px ${FONTE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      if (alfa != null) g.globalAlpha = alfa;
      if (virar) { g.translate(x, y); g.scale(-1, 1); g.fillText(t, 0, 0); } else g.fillText(t, x, y);
      g.restore();
    };
    const ret = (x, y, w, h, cor, r = 0) => { g.fillStyle = cor; g.beginPath(); if (r && g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); g.fill(); };
    const linha = (pts, cor, larg, tracejado) => { g.save(); g.strokeStyle = cor; g.lineWidth = larg; g.lineCap = 'round'; g.lineJoin = 'round'; if (tracejado) g.setLineDash(tracejado); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore(); };
    function etiqueta(t, x, y, { cor = '#222', fundo = 'rgba(255,255,255,.92)', tam = 12, borda } = {}) {
      g.save(); g.font = `700 ${tam}px ${TEXTO}`; const w = g.measureText(t).width + 14, h = tam + 9;
      ret(x - w / 2, y - h / 2, w, h, fundo, h / 2);
      if (borda) { g.strokeStyle = borda; g.lineWidth = 2; g.beginPath(); if (g.roundRect) g.roundRect(x - w / 2, y - h / 2, w, h, h / 2); g.stroke(); }
      g.fillStyle = cor; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y + 0.5); g.restore();
    }
    const alvo = (x, y, w, h, id, info, dados) => alvos.push({ x, y, w, h, id, info, dados });
    // O céu: azul de dia, laranja no fim da tarde, escuro à noite; nuvens e chuva no tempo de chuva, sol forte na seca.
    function ceu(alto) {
      const h = horaDoDia(), seca = est && est.estacao === 'seca';
      const dia = h >= 6 && h < 18, tarde = h >= 17 && h < 19.5;
      const topo = dia ? (seca ? '#8EC9EE' : '#9DB8CC') : tarde ? '#F2A65A' : '#1B2A4A';
      const baixo = dia ? (seca ? '#E8F4FB' : '#D6E1EA') : tarde ? '#FBD9A6' : '#3A4A6E';
      const gr = g.createLinearGradient(0, 0, 0, alto); gr.addColorStop(0, topo); gr.addColorStop(1, baixo);
      g.fillStyle = gr; g.fillRect(0, 0, LW, alto);
      const t = performance.now() / 1000;
      if (dia || tarde) {
        const sx = 60 + ((h - 6) / 13) * 680, sy = alto - Math.sin(lim((h - 6) / 13, 0, 1) * Math.PI) * (alto - 22) + 6;
        if (seca || h < 9 || tarde) { g.save(); g.globalAlpha = 0.25; em('☀️', sx, sy, 44); g.restore(); }
        em('☀️', sx, sy, 26);
      } else {
        em('🌙', 680, 26, 22);
        for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(t * 2 + i)})`; g.fillRect(sorte(i) * LW, sorte(i + 50) * (alto - 10), 2, 2); }
      }
      if (!seca) for (let i = 0; i < 4; i++) { const x = ((t * 8 + i * 230) % (LW + 160)) - 80; em('☁️', x, 18 + (i % 2) * 18, 34, 0.9); }
    }
    function chuva() {
      if (!est || est.estacao === 'seca') return;
      const t = performance.now() / 1000;
      g.save(); g.strokeStyle = 'rgba(160,190,230,.55)'; g.lineWidth = 1.2;
      for (let i = 0; i < 70; i++) { const x = (sorte(i) * LW + t * 60) % LW, y = (sorte(i + 7) * LH + t * 420) % LH; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + 11); g.stroke(); }
      g.restore();
    }
    function noite(forca = 1) {
      const h = horaDoDia();
      let a = 0;
      if (h >= 19 || h < 5) a = 0.42; else if (h >= 17.5) a = ((h - 17.5) / 1.5) * 0.42; else if (h < 6.5) a = ((6.5 - h) / 1.5) * 0.42;
      if (a > 0) { g.fillStyle = `rgba(12,20,55,${a * forca})`; g.fillRect(0, 0, LW, LH); }
    }
    const fogo = (x, y, s = 1) => { const t = performance.now() / 1000; for (let i = 0; i < 3; i++) em('🔥', x + (i - 1) * 16 * s, y - Math.abs(Math.sin(t * 6 + i)) * 5, (18 + 6 * Math.sin(t * 9 + i)) * s); g.fillStyle = 'rgba(80,80,80,.25)'; for (let i = 0; i < 4; i++) { const k = (t * 0.6 + i / 4) % 1; g.beginPath(); g.arc(x + Math.sin(k * 6 + i) * 8, y - 20 - k * 50, 6 + k * 10, 0, 7); g.fill(); } };
    const semAcesso = (x, y, t) => etiqueta(t || '❓ Você não vê este setor', x, y, { fundo: 'rgba(60,60,60,.75)', cor: '#fff', tam: 11 });

    // ---------- ROÇA ----------
    function roca() {
      ceu(90);
      const seca = est.estacao === 'seca';
      ret(0, 90, LW, LH - 90, seca ? '#C9B47A' : '#7DB55A');
      const r = emp.roca;
      if (!r) { semAcesso(LW / 2, 200, '❓ A roça é com o(a) Agricultor(a)'); return; }
      const t = performance.now() / 1000;
      r.talhoes.forEach((tl, i) => {
        const x0 = 30 + (i % 2) * 275, y0 = 104 + Math.floor(i / 2) * 124, w = 250, h = 104;
        ret(x0 - 3, y0 - 3, w + 6, h + 6, 'rgba(0,0,0,.12)', 8);
        ret(x0, y0, w, h, tl.estado === 'vazio' ? '#8B5A2B' : '#7A5130', 6);
        for (let k = 1; k < 5; k++) linha([[x0 + 6, y0 + k * (h / 5)], [x0 + w - 6, y0 + k * (h / 5)]], 'rgba(60,35,15,.45)', 2);
        const st = tl.estado === 'pronto' ? 1 : tl.cresc / 100;
        if (tl.estado !== 'vazio') for (let k = 1; k < 5; k++) for (let c = 0; c < 10; c++) {
          const px = x0 + 14 + c * 23.5, py = y0 + k * (h / 5) - 2, alto = 5 + 26 * st, balanco = Math.sin(t * 2 + c * 0.7 + k) * 2.5 * st;
          const cor = tl.passou ? '#9A8A4A' : seca && !r.irrigacao && tl.estado === 'crescendo' ? '#8FAE4B' : '#3F8F3A';
          linha([[px, py], [px + balanco, py - alto]], cor, 2.4);
          if (st > 0.35) { linha([[px + balanco * 0.6, py - alto * 0.6], [px + balanco * 0.6 + 6, py - alto * 0.75]], cor, 2); linha([[px + balanco * 0.5, py - alto * 0.45], [px + balanco * 0.5 - 6, py - alto * 0.6]], cor, 2); }
          if (tl.estado === 'pronto' && !tl.passou) { g.fillStyle = '#F2C230'; g.beginPath(); g.ellipse(px + balanco + 3, py - alto * 0.7, 2.6, 6, 0.3, 0, 7); g.fill(); }
        }
        if (tl.foco) fogo(x0 + w / 2, y0 + h / 2 + 10);
        const rot = tl.foco ? '🔥 Pegando fogo!' : tl.estado === 'vazio' ? '🟫 Vazio: clique para plantar' : tl.estado === 'pronto' ? (tl.passou ? '⚠️ Passou do ponto: colha já!' : '🌽 Pronto! Clique para colher') : `🌱 Talhão ${i + 1}: ${tl.cresc}%`;
        etiqueta(rot, x0 + w / 2, y0 + h - 12, { borda: tl.estado === 'pronto' ? '#E2A72E' : null });
        alvo(x0, y0, w, h, 'talhao', `Talhão ${i + 1}`, { i, tl });
      });
      // efeitos: trator colhendo e sementes caindo
      for (const f of L.efeitos) {
        if (f.tipo === 'trator') { const x0 = 30 + (f.i % 2) * 275, y0 = 104 + Math.floor(f.i / 2) * 124; const k = (t - f.ini) / 1.6; if (k < 1) em('🚜', x0 + 250 * k, y0 + 50, 34, 1, true); }
        if (f.tipo === 'semente') { const x0 = 30 + (f.i % 2) * 275, y0 = 104 + Math.floor(f.i / 2) * 124; const k = (t - f.ini) / 1.2; if (k < 1) for (let j = 0; j < 12; j++) { g.fillStyle = '#F2C230'; g.fillRect(x0 + sorte(j) * 250, y0 + k * 90 * sorte(j + 3), 3, 3); } }
      }
      // silo e irrigação
      const sx = 600, sy = 112;
      ret(sx, sy + 22, 120, 170, '#C9CCD1', 10); g.fillStyle = '#B4B8BE'; g.beginPath(); g.ellipse(sx + 60, sy + 22, 60, 18, 0, 0, 7); g.fill();
      const nivel = lim(r.silagem / 150, 0, 1);
      ret(sx + 8, sy + 184 - 150 * nivel, 104, 150 * nivel, '#D8B44A', 6);
      etiqueta(`🌽 Silagem: ${r.silagem} t`, sx + 60, sy + 120);
      alvo(sx, sy, 120, 192, 'silo', 'Silagem guardada');
      em('🚰', 760, 322, 30); etiqueta(r.irrigacao ? '💧 Irrigação ligada' : 'Irrigação desligada', 690, 322, { tam: 11, fundo: r.irrigacao ? '#D9EEFB' : 'rgba(255,255,255,.9)' });
      alvo(620, 305, 170, 36, 'irrigacao', 'Ligar ou desligar a irrigação');
      if (r.irrigacao) for (let i = 0; i < 4; i++) { const x0 = 30 + (i % 2) * 275, y0 = 104 + Math.floor(i / 2) * 124; for (let j = 0; j < 14; j++) { const k = (t * 0.9 + j / 14) % 1; g.fillStyle = 'rgba(120,180,240,.7)'; g.beginPath(); g.arc(x0 + 20 + k * 210, y0 + 20 + Math.sin(k * Math.PI) * -20 + 30, 2.2, 0, 7); g.fill(); } }
      chuva(); noite();
    }

    // ---------- PASTO ----------
    function areaPiquete(i, n) {
      const cols = n <= 4 ? 2 : 3, w = (556 - (cols - 1) * 14) / cols, h = 118;
      return { x: 24 + (i % cols) * (w + 14), y: 96 + Math.floor(i / cols) * (h + 14), w, h };
    }
    function pasto() {
      ceu(84);
      const seca = est.estacao === 'seca';
      ret(0, 84, LW, LH - 84, seca ? '#BFA96E' : '#6FA84E');
      const p = emp.pasto;
      if (!p) { semAcesso(LW / 2, 200, '❓ O pasto é com o(a) Pecuarista'); return; }
      const t = performance.now() / 1000, n = p.piquetes.length;
      p.piquetes.forEach((q, i) => {
        const a = areaPiquete(i, n);
        ret(a.x, a.y, a.w, a.h, mistura('#C9B27A', '#4E9A43', q.capim / 100), 6);
        for (let k = 0; k < Math.round(q.capim / 4); k++) { const x = a.x + 8 + sorte(i * 100 + k) * (a.w - 16), y = a.y + 10 + sorte(i * 100 + k + 50) * (a.h - 20); linha([[x - 3, y], [x, y - 6], [x + 3, y]], mistura('#8A9A4A', '#2F7A2A', q.capim / 100), 1.6); }
        g.save(); g.strokeStyle = i === p.ativo ? '#FFF3B0' : '#7A4E2A'; g.lineWidth = i === p.ativo ? 4 : 3; g.strokeRect(a.x, a.y, a.w, a.h); g.restore();
        for (let k = 0; k <= a.w; k += 30) ret(a.x + k - 2, a.y - 4, 4, 10, '#6B4423');
        if (q.foco) fogo(a.x + a.w / 2, a.y + a.h / 2);
        etiqueta(`${i === p.ativo ? '🐄 ' : ''}Piquete ${i + 1}${q.novo ? ' (mata derrubada)' : ''}: capim ${q.capim}%`, a.x + a.w / 2, a.y + 12, { tam: 11, borda: q.capim < 20 ? '#D9483B' : null });
        alvo(a.x, a.y, a.w, a.h, 'piquete', `Piquete ${i + 1}`, { i, q });
      });
      const at = areaPiquete(p.ativo, n);
      // cocho
      const cx = at.x + at.w - 60, cy = at.y + at.h - 18;
      ret(cx, cy, 50, 12, '#8B5A2B', 3); if (p.cocho) ret(cx + 3, cy + 1, 44, 6, '#D8B44A', 2);
      alvo(cx - 4, cy - 8, 58, 26, 'cocho', p.cocho ? 'Cocho com silagem (ligado)' : 'Cocho vazio');
      // as vacas: cada boi do rebanho é uma vaca andando no piquete ativo
      const reb = p.rebanho || [];
      while (L.vacas.length < reb.length) L.vacas.push({ x: 690, y: 120, tx: at.x + at.w / 2, ty: at.y + at.h / 2, espera: 0 });
      if (L.vacas.length > reb.length) L.vacas.length = reb.length;
      if (L.ativo !== p.ativo) { L.ativo = p.ativo; L.vacas.forEach((v) => { v.tx = at.x + 20 + Math.random() * (at.w - 40); v.ty = at.y + 30 + Math.random() * (at.h - 45); v.espera = 0; }); }
      const dt = L.dt;
      L.vacas.forEach((v, i) => {
        const b = reb[i];
        const vel = b.doente ? 10 : 34;
        const dx = v.tx - v.x, dy = v.ty - v.y, d = Math.hypot(dx, dy);
        if (d > 2) { v.x += (dx / d) * Math.min(d, vel * dt); v.y += (dy / d) * Math.min(d, vel * dt); v.dir = dx; }
        else if ((v.espera -= dt) < 0) {
          const comCocho = p.cocho && p.piquetes[p.ativo].capim < 20 && Math.random() < 0.6;
          v.tx = comCocho ? cx + 10 + Math.random() * 30 : at.x + 20 + Math.random() * (at.w - 40);
          v.ty = comCocho ? cy - 10 : at.y + 30 + Math.random() * (at.h - 45);
          v.espera = 1 + Math.random() * 4;
        }
      });
      [...L.vacas.keys()].sort((a, b2) => L.vacas[a].y - L.vacas[b2].y).forEach((i) => {
        const v = L.vacas[i], b = reb[i], s = 15 + (lim(b.peso, 12, 20) - 12) * 1.4;
        em(b.peso >= 18 ? '🐂' : '🐄', v.x, v.y, s, 1, (v.dir || -1) > 0);
        if (b.doente) { em('🤒', v.x + 8, v.y - s * 0.6, 12); alvo(v.x - 12, v.y - 14, 24, 26, 'doente', 'Boi doente: clique para tratar'); }
      });
      // o curral e os itens do lado
      ret(596, 96, 196, 252, 'rgba(255,255,255,.55)', 10);
      const lado = [
        ['🚚', 'Comprar bezerros', 'bezerros', `${p.bois} bois no pasto`],
        ['💉', 'Vacinas e remédios', 'vacina', `${p.semVacina} sem vacina · ${p.doentes} doente(s)`],
        ['📄', 'Guia (GTA)', 'gta', `${p.prontos} pronto(s) · ${p.gta} com guia`],
        ['🌽', 'Ração de fora', 'racao', emp.roca ? `Silagem: ${emp.roca.silagem} t` : 'Comprar ração'],
      ];
      lado.forEach(([ic, nome, id, info], k) => {
        const y = 104 + k * 61;
        ret(604, y, 180, 54, '#FFFFFF', 8); em(ic, 626, y + 27, 26);
        g.fillStyle = '#222'; g.font = `700 12px ${TEXTO}`; g.textAlign = 'left'; g.fillText(nome, 646, y + 20);
        g.fillStyle = '#555'; g.font = `10.5px ${TEXTO}`; g.fillText(info.slice(0, 26), 646, y + 37);
        alvo(604, y, 180, 54, id, nome);
      });
      if (p.embargo) etiqueta('⛔ Pasto embargado pelo IBAMA', 320, 344, { fundo: '#FDECEB', cor: '#9B1C12' });
      chuva(); noite();
    }

    // ---------- MUNDO (o mapa da cadeia, com o caminhão) ----------
    const PONTOS = { fazenda: [120, 262], frig: [400, 196], loja: [688, 262] };
    function mundo() {
      ceu(70);
      const seca = est.estacao === 'seca';
      ret(0, 70, LW, LH - 70, seca ? '#C7B477' : '#78B158');
      const t = performance.now() / 1000;
      // estrada
      const rota = [PONTOS.fazenda, [250, 240], PONTOS.frig, [560, 238], PONTOS.loja];
      linha(rota, '#5C6066', 22); linha(rota, '#F2CF57', 2, [12, 12]);
      etiqueta('BR-364', 255, 222, { fundo: '#2E7D32', cor: '#fff', tam: 11 });
      const cam = emp.caminhao;
      if (cam && cam.br364) em('🚧', 255, 246, 26);
      // posto
      em('⛽', 400, 300, 28); etiqueta(cam ? `Posto · tanque ${cam.combustivel}%` : 'Posto', 400, 328, { tam: 11 });
      alvo(375, 282, 50, 56, 'posto', 'Posto de combustível');
      // fazenda: roça + pasto
      ret(20, 110, 210, 120, seca ? '#B39C5C' : '#5E9C45', 8);
      if (emp.roca) emp.roca.talhoes.forEach((tl, i) => { ret(30 + i * 30, 120, 26, 40, tl.estado === 'vazio' ? '#8B5A2B' : tl.estado === 'pronto' ? '#D8B44A' : '#4E8A3A', 3); if (tl.foco) fogo(43 + i * 30, 140, 0.6); });
      g.fillStyle = '#B23B2E'; ret(160, 128, 56, 40, '#B23B2E', 3); g.beginPath(); g.moveTo(154, 130); g.lineTo(188, 108); g.lineTo(222, 130); g.fill();
      if (emp.pasto) {
        for (let i = 0; i < Math.min(7, emp.pasto.bois); i++) em(i < emp.pasto.prontos ? '🐂' : '🐄', 40 + i * 24 + Math.sin(t + i) * 3, 196 + (i % 2) * 14, 18, 1, Math.sin(t * 0.3 + i) > 0);
        emp.pasto.piquetes.forEach((q, i) => { if (q.foco) fogo(60 + i * 40, 200, 0.6); });
        etiqueta(`🐂 ${emp.pasto.prontos} pronto(s) · ${emp.pasto.gta} com guia`, 125, 244, { tam: 11 });
      } else etiqueta('🌾 Fazenda (❓)', 125, 244, { tam: 11 });
      alvo(20, 104, 210, 150, 'fazenda', 'A fazenda (roça e pasto)');
      (emp.queimadas || []).forEach((q) => alvo(20, 104, 210, 130, 'queimada', 'Foco de queimada: apagar!', q));
      // frigorífico
      ret(330, 96, 140, 80, '#B9C2CC', 6); ret(340, 112, 40, 30, '#8EC3DE', 3); ret(395, 132, 30, 44, '#6B7480', 2);
      ret(440, 70, 14, 30, '#8A929C'); for (let i = 0; i < 3; i++) { const k = (t * 0.4 + i / 3) % 1; g.fillStyle = `rgba(230,230,230,${0.7 - k * 0.7})`; g.beginPath(); g.arc(447 + k * 14, 64 - k * 40, 6 + k * 10, 0, 7); g.fill(); }
      etiqueta(emp.frig ? `🏭 ${emp.frig.estoque} hambúrgueres` : '🏭 Frigorífico (❓)', 400, 90, { tam: 11 });
      alvo(330, 80, 140, 100, 'frigorifico', 'O frigorífico');
      // lanchonete e escritório
      ret(620, 192, 136, 64, '#FFF3D6', 4); ret(612, 180, 152, 16, '#C62828', 3); ret(620, 196, 136, 6, '#F2B705');
      ret(676, 222, 26, 34, '#5B3A22', 2); em('🍔', 688, 168, 24);
      etiqueta(emp.loja ? `🍔 ${emp.loja.estoque} · fila ${emp.loja.fila}` : '🍔 Lanchonete (❓)', 688, 280, { tam: 11 });
      if (emp.loja) for (let i = 0; i < Math.min(8, emp.loja.fila); i++) em(GENTE[i % GENTE.length], 640 - i * 14, 300, 14);
      alvo(612, 160, 152, 130, 'lanchonete', 'A lanchonete');
      ret(600, 100, 100, 54, '#DDE6F0', 4); for (let i = 0; i < 4; i++) ret(608 + i * 23, 110, 16, 14, '#8EC3DE', 2);
      etiqueta(emp.escritorio ? `🏢 ${emp.escritorio.contas.length} conta(s)` : '🏢 Escritório (❓)', 650, 92, { tam: 11 });
      alvo(600, 84, 100, 72, 'escritorio', 'O escritório');
      // o caminhão
      const H = horasAgora();
      let pos = [440, 232], virar = false, carga = null;
      if (cam && cam.viagem) {
        const k = lim((H - cam.viagem.sai) / Math.max(0.1, cam.viagem.chega - cam.viagem.sai), 0, 1);
        const trecho = cam.viagem.rota === 'pasto_frig' ? [PONTOS.fazenda, [250, 240], PONTOS.frig] : [PONTOS.frig, [560, 238], PONTOS.loja];
        const seg = k < 0.5 ? 0 : 1, kk = k < 0.5 ? k * 2 : (k - 0.5) * 2, [a, b] = [trecho[seg], trecho[seg + 1]];
        pos = [a[0] + (b[0] - a[0]) * kk, a[1] + (b[1] - a[1]) * kk - 8]; virar = true; carga = cam.viagem.rota === 'pasto_frig' ? '🐂' : '🍔';
      }
      if (cam || !emp.caminhao) {
        em('🚚', pos[0], pos[1], 34, 1, virar);
        if (carga) em(carga, pos[0] + (virar ? 4 : -4), pos[1] - 22, 16);
        if (cam) { ret(pos[0] - 18, pos[1] + 16, 36, 5, '#ddd', 2); ret(pos[0] - 18, pos[1] + 16, 36 * cam.combustivel / 100, 5, cam.combustivel < 30 ? '#D9483B' : '#3B9A57', 2); }
        alvo(pos[0] - 22, pos[1] - 20, 44, 40, 'caminhao', cam && cam.viagem ? `Caminhão: ${cam.viagem.nome}` : 'Caminhão parado');
      }
      chuva(); noite();
    }

    // ---------- FRIGORÍFICO ----------
    function frigorifico() {
      ret(0, 0, LW, LH, '#DCE3EA'); ret(0, 270, LW, 90, '#9AA5B1');
      for (let i = 0; i < 20; i++) ret(i * 40, 270, 2, 90, 'rgba(0,0,0,.08)');
      const f = emp.frig;
      if (!f) { semAcesso(LW / 2, 180, '❓ O frigorífico é com o setor Frigorífico'); return; }
      const t = performance.now() / 1000;
      // janela com o céu
      g.save(); g.beginPath(); g.rect(30, 22, 120, 70); g.clip(); ceu(92); chuva(); g.restore(); g.strokeStyle = '#6B7480'; g.lineWidth = 4; g.strokeRect(30, 22, 120, 70);
      // bois esperando
      ret(20, 150, 170, 116, '#C8B48A', 8); for (let k = 0; k < 170; k += 24) ret(20 + k, 146, 4, 18, '#7A4E2A');
      for (let i = 0; i < Math.min(8, f.bois); i++) em('🐂', 44 + (i % 4) * 38, 190 + Math.floor(i / 4) * 40, 26, 1, true);
      etiqueta(f.bois ? `🐂 ${f.bois} boi(s): clique para processar` : 'Nenhum boi esperando', 105, 250, { tam: 11, borda: f.bois ? '#E2A72E' : null });
      alvo(20, 146, 170, 120, 'bois', 'Bois que chegaram');
      // a máquina (moedor) com engrenagens
      const ligada = f.carne > 0 && f.producao > 0;
      ret(210, 140, 120, 128, '#7D8793', 8); ret(222, 152, 96, 50, '#5D6772', 6);
      for (const [gx, gy, r0] of [[248, 176, 16], [290, 178, 12]]) {
        g.save(); g.translate(gx, gy); g.rotate((ligada ? t * 2.5 : 0) * (r0 === 12 ? -1.3 : 1)); g.fillStyle = '#C9CED4';
        for (let k = 0; k < 8; k++) { g.rotate(Math.PI / 4); g.fillRect(-3, -r0 - 4, 6, 8); }
        g.beginPath(); g.arc(0, 0, r0, 0, 7); g.fill(); g.fillStyle = '#5D6772'; g.beginPath(); g.arc(0, 0, 4, 0, 7); g.fill(); g.restore();
      }
      // mostrador da produção
      g.save(); g.translate(270, 236); g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 20, Math.PI, 2 * Math.PI); g.stroke();
      g.strokeStyle = '#F2B705'; g.beginPath(); g.arc(0, 0, 20, Math.PI, Math.PI + Math.PI * lim(f.producao / 1200, 0, 1)); g.stroke(); g.restore();
      etiqueta(`⚙️ ${f.producao}/dia`, 270, 258, { tam: 10 });
      alvo(210, 140, 120, 128, 'maquina', 'O moedor: quantos hambúrgueres por dia');
      etiqueta(`🥩 Carne: ${f.carne} porções`, 270, 128, { tam: 11 });
      // esteira
      ret(330, 226, 260, 16, '#4A525C', 4);
      for (let k = 0; k < 13; k++) { g.fillStyle = '#2F353C'; g.beginPath(); g.arc(340 + k * 20, 248, 5, 0, 7); g.fill(); }
      if (ligada) { const vel = 20 + f.producao / 20; for (let k = 0; k < 10; k++) { const x = 334 + ((t * vel + k * 26) % 252); g.fillStyle = '#7A3E1D'; g.beginPath(); g.ellipse(x, 222, 10, 4, 0, 0, 7); g.fill(); } }
      // câmara fria
      ret(600, 60, 180, 210, '#BFE0F2', 8); ret(608, 68, 164, 194, '#E6F4FB', 6);
      g.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 12; i++) g.fillRect(610 + sorte(i) * 160, 70 + sorte(i + 9) * 190, 3, 3);
      etiqueta(`❄️ Câmara fria: ${f.estoque}`, 690, 54, { tam: 11 });
      f.lotes.slice(0, 9).forEach((l, i) => {
        const x = 616 + (i % 3) * 52, y = 82 + Math.floor(i / 3) * 60, h = lim(14 + l.qtd / 25, 14, 50);
        const cor = l.vencido ? '#E57373' : l.vence === est.dia ? '#F2C14E' : '#8FB8DE';
        ret(x, y + 50 - h, 46, h, cor, 4);
        g.fillStyle = '#1E2A35'; g.font = `700 10px ${TEXTO}`; g.textAlign = 'center'; g.fillText(l.vence > 90 ? `${l.qtd}` : `${l.qtd} · d${l.vence}`, x + 23, y + 46);
        if (l.vencido) { em('❗', x + 38, y + 50 - h, 14); alvo(x, y, 46, 52, 'vencido', 'Lote vencido: jogar fora'); }
      });
      alvo(600, 60, 180, 210, 'camara', 'Câmara fria');
      // higiene
      em('🧼', 210, 314, 28); etiqueta(f.higiene ? '✨ Limpeza em dia' : '⚠️ Sem limpeza!', 280, 314, { tam: 11, fundo: f.higiene ? '#E3F3DC' : '#FDECEB' });
      alvo(190, 296, 150, 36, 'higiene', 'Ligar ou desligar a limpeza');
      if (!f.higiene) for (let i = 0; i < 7; i++) { g.fillStyle = '#222'; g.beginPath(); g.arc(270 + Math.sin(t * 3 + i * 2) * 50, 170 + Math.cos(t * 4 + i) * 30, 2, 0, 7); g.fill(); }
      else if (Math.sin(t * 2) > 0.7) em('✨', 300, 150, 16);
    }

    // ---------- LANCHONETE ----------
    function lanchonete() {
      const l = emp.loja;
      ret(0, 0, LW, LH, '#FFF3D6');
      for (let x = 0; x < LW; x += 40) for (let y = 290; y < LH; y += 35) ret(x, y, 40, 35, ((x / 40 + y / 35) % 2) ? '#E9D9B4' : '#F6EBCF');
      // janela
      g.save(); g.beginPath(); g.rect(110, 30, 150, 90); g.clip(); ceu(120); chuva(); g.restore(); g.strokeStyle = '#B23B2E'; g.lineWidth = 6; g.strokeRect(110, 30, 150, 90);
      if (!l) { semAcesso(LW / 2, 200, '❓ A lanchonete é com o Gerente'); noite(0.6); return; }
      const t = performance.now() / 1000, fechada = l.fechada || !l.aberta;
      // porta e placa
      ret(20, 130, 70, 160, '#8B5A2B', 4); ret(28, 140, 54, 70, '#BFE0F2', 3);
      etiqueta(fechada ? 'FECHADO' : 'ABERTO', 55, 118, { fundo: fechada ? '#C62828' : '#2E7D32', cor: '#fff', tam: 11 });
      alvo(14, 104, 84, 190, 'porta', fechada ? 'Loja fechada' : 'Loja aberta');
      // quadro do cardápio
      ret(300, 20, 230, 86, '#2B2B2B', 8);
      g.fillStyle = '#F2B705'; g.font = `800 16px ${TEXTO}`; g.textAlign = 'center'; g.fillText('🍔 X-Burguer', 415, 48);
      g.fillStyle = '#fff'; g.font = `800 22px ${TEXTO}`; g.fillText(`R$ ${l.preco.toFixed(2).replace('.', ',')}`, 415, 80);
      if (l.promocao) { g.save(); g.translate(512, 30); g.rotate(0.3); etiqueta('PROMO -15%', 0, 0, { fundo: '#D9483B', cor: '#fff', tam: 11 }); g.restore(); }
      alvo(300, 20, 230, 86, 'preco', 'O preço do lanche');
      // prateleira de estoque
      ret(600, 30, 180, 100, '#C69C6D', 6);
      const barras = [['🍔', l.estoque, 1000], ['🍞', l.pao, 1000], ['🧀', l.queijo, 1000], ['📦', l.embalagem, 1000]];
      barras.forEach(([ic, v, max], i) => { const x = 612 + i * 42; em(ic, x + 14, 48, 18); ret(x + 4, 62, 20, 60, 'rgba(0,0,0,.2)', 3); const h = 60 * lim(v / max, 0, 1); ret(x + 4, 122 - h, 20, h, v < 150 ? '#D9483B' : '#3B9A57', 3); });
      alvo(600, 30, 180, 100, 'prateleira', 'Estoque: pão, queijo, embalagem e hambúrguer');
      // balcão e atendentes
      ret(430, 178, 350, 18, '#7A4E2A', 3); ret(440, 196, 330, 80, '#A0703F', 4);
      for (let i = 0; i < l.atendentes; i++) { const x = 470 + i * (300 / Math.max(1, l.atendentes)); em(i % 2 ? '👩' : '👨', x, 160 + Math.sin(t * 3 + i) * (fechada ? 0 : 2), 30); }
      if (l.horaExtra) etiqueta('⏰ Hora extra', 600, 140, { tam: 10, fundo: '#FFF3C4' });
      alvo(430, 130, 350, 66, 'equipe', `${l.atendentes} atendente(s)`);
      // chapa com fumaça
      if (!fechada && l.fila > 0) for (let i = 0; i < 3; i++) { const k = (t * 0.7 + i / 3) % 1; g.fillStyle = `rgba(200,200,200,${0.6 - k * 0.6})`; g.beginPath(); g.arc(740 + Math.sin(k * 5) * 6, 172 - k * 50, 6 + k * 8, 0, 7); g.fill(); }
      // a fila
      const fila = fechada ? 0 : Math.min(15, l.fila);
      for (let i = 0; i < fila; i++) { const x = 400 - i * 22, y = 266 + (i % 2) * 6; em(GENTE[(i + 3) % GENTE.length], x, y + Math.sin(t * 2 + i) * 1.5, 26); }
      if (fila) alvo(400 - fila * 22, 240, fila * 22 + 20, 50, 'fila', `Fila: ${l.fila} pessoa(s)`);
      if (fila >= 10) em('😤', 400 - (fila - 1) * 22, 238, 16);
      // quem entra e quem sai (das vendas e desistências desde a última atualização)
      const dt = L.dt;
      L.clientes = L.clientes.filter((c) => (c.k += dt / c.dur) < 1);
      for (const c of L.clientes) { const x = c.de + (c.para - c.de) * c.k; em(c.quem, x, 300, 26, 1, c.para < c.de); em(c.mao, x + (c.para < c.de ? -14 : 14), 288, 14); }
      etiqueta(`Hoje: ${l.hoje.clientes} vendidos · ${l.hoje.perdidos} foram embora`, 230, 340, { tam: 11 });
      noite(fechada ? 0.8 : 0.35);
    }
    function novosClientes() {
      const l = emp && emp.loja;
      if (!l) return;
      const agora = { dia: est.dia, c: l.hoje.clientes, p: l.hoje.perdidos };
      const u = L.ultimo; L.ultimo = agora;
      if (!u || u.dia !== agora.dia) return;
      const vendeu = Math.min(5, agora.c - u.c), foi = Math.min(4, agora.p - u.p);
      for (let i = 0; i < vendeu; i++) L.clientes.push({ quem: GENTE[Math.floor(Math.random() * GENTE.length)], mao: '🍔', de: 420, para: 40, k: -i * 0.15, dur: 2.2 });
      for (let i = 0; i < foi; i++) L.clientes.push({ quem: '😠', mao: '💢', de: 300, para: 40, k: -i * 0.2, dur: 1.8 });
      if (l.aberta && !l.fechada) for (let i = 0; i < Math.min(3, vendeu + foi); i++) L.clientes.push({ quem: GENTE[Math.floor(Math.random() * GENTE.length)], mao: '', de: 40, para: 380 - Math.min(14, l.fila) * 22, k: -0.3 - i * 0.3, dur: 2 });
    }

    // ---------- ESCRITÓRIO ----------
    function escritorio() {
      ret(0, 0, LW, LH, '#DCE4EE'); ret(0, 280, LW, 80, '#B7A58A');
      const e = emp.escritorio;
      g.save(); g.beginPath(); g.rect(320, 24, 160, 90); g.clip(); ceu(114); chuva(); g.restore(); g.strokeStyle = '#7A8796'; g.lineWidth = 5; g.strokeRect(320, 24, 160, 90);
      if (!e) { semAcesso(LW / 2, 200, '❓ O escritório é com o Financeiro, Compras, Marketing, RH e Qualidade'); noite(0.5); return; }
      // mesa, computador com o gráfico, contas
      ret(230, 230, 340, 18, '#7A4E2A', 3); ret(250, 248, 12, 40, '#6B4423'); ret(538, 248, 12, 40, '#6B4423');
      ret(330, 150, 140, 80, '#2B2B2B', 6); ret(338, 158, 124, 62, '#F4F8FB', 3);
      const dias = (emp.dias || []).slice(-7), max = Math.max(1, ...dias.map((d) => Math.abs(d.lucro)));
      dias.forEach((d, i) => { const h = 26 * Math.abs(d.lucro) / max; ret(346 + i * 16, d.lucro >= 0 ? 190 - h : 190, 10, h, d.lucro >= 0 ? '#3B9A57' : '#D9483B', 2); });
      linha([[342, 190], [458, 190]], '#999', 1);
      alvo(330, 150, 140, 80, 'computador', 'Lucro dos últimos dias');
      const n = e.contas.length;
      for (let i = 0; i < Math.min(6, n); i++) ret(250 + i * 2, 214 - i * 4, 54, 16, i === n - 1 && e.contas.some((c) => c.suspeita) ? '#FFE0B2' : '#FFFFFF', 2);
      etiqueta(n ? `🧾 ${n} conta(s)` : '🧾 Nada a pagar', 278, 196, { tam: 11, borda: e.contas.some((c) => c.vence < est.dia) ? '#D9483B' : null });
      alvo(240, 180, 80, 50, 'contas', 'Contas a pagar');
      em('☎️', 520, 214, 26);
      // banco, outdoor, avaliações, alvará
      ret(30, 40, 120, 90, '#FFFFFF', 8); em('🏦', 90, 74, 34); etiqueta(emp.emprestimo ? `Dívida ${Math.round(emp.emprestimo / 1000)} mil` : 'Banco', 90, 112, { tam: 11 });
      alvo(30, 40, 120, 90, 'banco', 'Banco: empréstimo');
      ret(560, 30, 210, 90, '#FFFFFF', 6); g.strokeStyle = '#2B2B2B'; g.lineWidth = 3; g.strokeRect(560, 30, 210, 90);
      const m = e.marketing;
      g.fillStyle = m ? (m.tipo === 'honesta' ? '#2E7D32' : '#C62828') : '#888'; g.font = `800 14px ${TEXTO}`; g.textAlign = 'center';
      g.fillText(m ? (m.tipo === 'honesta' ? 'Fresquinho da fazenda!' : '100% natural!!! 🌿') : 'Sem propaganda', 665, 70);
      g.fillStyle = '#555'; g.font = `11px ${TEXTO}`; g.fillText(m ? 'no ar' : 'clique para anunciar', 665, 92);
      alvo(560, 30, 210, 90, 'outdoor', 'Propaganda');
      ret(600, 150, 170, 110, '#C69C6D', 6);
      const av = e.avaliacoes || [];
      for (let i = 0; i < Math.min(4, av.length || 2); i++) { ret(612 + (i % 2) * 78, 160 + Math.floor(i / 2) * 48, 70, 40, av[i] ? '#FFE082' : '#FFF8DC', 2); g.fillStyle = '#333'; g.font = `10px ${TEXTO}`; g.textAlign = 'center'; g.fillText(av[i] ? '⭐ ' + av[i].estrelas + ' estrela' : '⭐⭐⭐⭐', 647 + (i % 2) * 78, 184 + Math.floor(i / 2) * 48); }
      if (av.length) etiqueta(`${av.length} avaliação(ões) sem resposta`, 685, 270, { tam: 10, borda: '#D9483B' });
      alvo(600, 150, 170, 110, 'avaliacoes', 'Avaliações dos clientes');
      ret(40, 160, 110, 80, '#FFFDF5', 4); g.strokeStyle = '#C69C6D'; g.lineWidth = 5; g.strokeRect(40, 160, 110, 80);
      g.fillStyle = '#333'; g.font = `700 11px ${TEXTO}`; g.textAlign = 'center'; g.fillText('ALVARÁ', 95, 190); g.font = `11px ${TEXTO}`; g.fillText(`vale até o dia ${e.alvara || 8}`, 95, 210);
      alvo(40, 160, 110, 80, 'alvara', 'Alvará de funcionamento');
      em('🌿', 180, 262, 34);
      noite(0.5);
    }

    const CENAS = { roca, pasto, mundo, frigorifico, lanchonete, escritorio };

    // ---------- Laço da animação ----------
    function medir() {
      const w = caixa.clientWidth || 600, dpr = Math.min(2, window.devicePixelRatio || 1);
      const W2 = Math.round(w * dpr), H2 = Math.round((w * LH / LW) * dpr);
      if (tela.width !== W2 || tela.height !== H2) { tela.width = W2; tela.height = H2; tela.style.height = `${Math.round(w * LH / LW)}px`; }
      escala = W2 / LW;
    }
    function quadro(agora) {
      if (!vivo) return;
      if (!caixa.isConnected || !est || !emp) { setTimeout(() => { raf = requestAnimationFrame(quadro); }, 400); return; }
      L.dt = Math.min(0.1, (agora - (antes || agora)) / 1000); antes = agora;
      L.efeitos = L.efeitos.filter((f) => performance.now() / 1000 - f.ini < 3);
      medir();
      g.setTransform(escala, 0, 0, escala, 0, 0);
      alvos = [];
      try { CENAS[tipo](); } catch (erro) { if (window.console) console.error('Cena', tipo, erro); }
      raf = requestAnimationFrame(quadro);
    }
    raf = requestAnimationFrame(quadro);

    // ---------- Cliques: um menu com o que dá para fazer ali ----------
    function pontoLogico(ev) { const r = tela.getBoundingClientRect(); return [(ev.clientX - r.left) * LW / r.width, (ev.clientY - r.top) * LH / r.height]; }
    const achar = (x, y) => { for (let i = alvos.length - 1; i >= 0; i--) { const a = alvos[i]; if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) return a; } return null; };
    tela.addEventListener('mousemove', (ev) => {
      const [x, y] = pontoLogico(ev), a = achar(x, y);
      tela.style.cursor = a ? 'pointer' : 'default';
      if (a && menuEl.hidden) { dica.textContent = a.info; dica.hidden = false; const r = tela.getBoundingClientRect(); dica.style.left = `${ev.clientX - r.left + 12}px`; dica.style.top = `${ev.clientY - r.top + 12}px`; } else dica.hidden = true;
    });
    tela.addEventListener('mouseleave', () => { dica.hidden = true; });
    tela.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const [x, y] = pontoLogico(ev), a = achar(x, y);
      fecharMenu();
      if (!a) return;
      const r = tela.getBoundingClientRect();
      const itens = MENUS[a.id] ? MENUS[a.id](a) : null;
      if (!itens) return;
      abrirMenu(ev.clientX - r.left, ev.clientY - r.top, itens.titulo || a.info, itens.lista || []);
    });
    function fecharMenu() { menuEl.hidden = true; menuEl.replaceChildren(); }
    document.addEventListener('click', (ev) => { if (!caixa.contains(ev.target)) fecharMenu(); });
    function abrirMenu(x, y, titulo, lista) {
      menuEl.replaceChildren(CE.el('strong', {}, titulo), ...lista.map((it) => (it.texto
        ? CE.el('p', {}, it.texto)
        : CE.el('button', { class: 'botao secundario', type: 'button', 'data-menu': it.id || '', disabled: !!it.desligado, onclick: (ev) => { ev.stopPropagation(); fecharMenu(); Promise.resolve(it.f()).catch(() => {}); } }, it.rotulo))));
      menuEl.hidden = false; dica.hidden = true;
      const largura = caixa.clientWidth;
      menuEl.style.left = `${Math.min(x, largura - 250)}px`; menuEl.style.top = `${Math.max(4, y - 10)}px`;
    }
    // quem não tem a função vê de quem é
    function deQuem(funcao, lista) { return ctx.pode(funcao) ? lista : [{ texto: `Isso é com ${ctx.quem(funcao)}. Peça pela 💬 Conversa ou pelos 📋 Pedidos!` }]; }
    const fazer = (funcao, tipoAcao, dados, efeito) => () => ctx.acao(funcao, tipoAcao, dados).then(() => { if (efeito) L.efeitos.push({ ...efeito, ini: performance.now() / 1000 }); });
    const MENUS = {
      talhao: (a) => ({ titulo: `🌾 Talhão ${a.dados.i + 1}`, lista: deQuem('agricultor',
        a.dados.tl.foco ? [{ texto: '🔥 Pegando fogo! Quem apaga é a Qualidade (o caminhão-pipa).' }]
          : a.dados.tl.estado === 'vazio' ? [{ rotulo: '🌱 Plantar milho (R$ 600)', id: 'plantar', f: fazer('agricultor', 'plantar', { talhao: a.dados.i }, { tipo: 'semente', i: a.dados.i }) }]
            : a.dados.tl.estado === 'pronto' ? [{ rotulo: '🚜 Colher e guardar a silagem', id: 'colher', f: fazer('agricultor', 'colher', { talhao: a.dados.i }, { tipo: 'trator', i: a.dados.i }) }]
              : [{ texto: `Crescendo: ${a.dados.tl.cresc}%. ${est.estacao === 'seca' && !emp.roca.irrigacao ? 'Na seca, sem irrigação, cresce bem devagar.' : 'Com chuva, cresce rápido.'}` }]) }),
      silo: () => ({ titulo: '🌽 Silagem', lista: [{ texto: `${emp.roca.silagem} toneladas guardadas. O gado come no cocho quando o capim acaba (na seca!).` }] }),
      irrigacao: () => ({ titulo: '💧 Irrigação', lista: deQuem('agricultor', [{ rotulo: emp.roca.irrigacao ? 'Desligar a irrigação' : 'Ligar a irrigação (R$ 8 por hora)', id: 'irrigar', f: fazer('agricultor', 'irrigar', { ligar: !emp.roca.irrigacao }) }]) }),
      piquete: (a) => ({ titulo: `🌿 Piquete ${a.dados.i + 1}: capim ${a.dados.q.capim}%`, lista: a.dados.i === emp.pasto.ativo ? [{ texto: 'O rebanho está aqui. Quando o capim baixar, leve para outro piquete (o rodízio deixa este descansar).' }]
        : deQuem('pecuarista', [{ rotulo: '🐄 Levar o rebanho para cá', id: 'levar', f: fazer('pecuarista', 'piquete', { i: a.dados.i }) }]) }),
      cocho: () => ({ titulo: '🥣 Cocho', lista: deQuem('pecuarista', [{ rotulo: emp.pasto.cocho ? 'Tirar a silagem do cocho' : 'Pôr silagem no cocho', id: 'cocho', f: fazer('pecuarista', 'cocho', { ligar: !emp.pasto.cocho }) }]) }),
      doente: () => ({ titulo: '🤒 Boi doente', lista: deQuem('veterinario', [{ rotulo: `🩺 Tratar os ${emp.pasto.doentes} doente(s) (R$ 150 cada)`, id: 'tratar', f: fazer('veterinario', 'tratar') }]) }),
      bezerros: () => ({ titulo: '🚚 Comprar bezerros (R$ 2.200 cada)', lista: deQuem('pecuarista', [1, 3, 5].map((n) => ({ rotulo: `Comprar ${n}`, id: `bezerros-${n}`, f: fazer('pecuarista', 'comprar', { qtd: n }) }))) }),
      vacina: () => ({ titulo: '💉 Vacinas e remédios', lista: deQuem('veterinario', [
        { rotulo: `💉 Vacinar todos (${emp.pasto.semVacina} sem vacina, R$ 40 cada)`, id: 'vacinar', desligado: !emp.pasto.semVacina, f: fazer('veterinario', 'vacinar') },
        { rotulo: `🩺 Tratar os doentes (${emp.pasto.doentes})`, id: 'tratar', desligado: !emp.pasto.doentes, f: fazer('veterinario', 'tratar') }]) }),
      gta: () => ({ titulo: '📄 Guia de transporte (GTA)', lista: deQuem('veterinario', [{ rotulo: `Fazer a guia dos prontos (${Math.max(0, emp.pasto.prontos - emp.pasto.gta)} sem guia, R$ 20 cada)`, id: 'gta', desligado: emp.pasto.prontos <= emp.pasto.gta, f: fazer('veterinario', 'gta') }, { texto: 'Sem a guia, o boi pronto não pode viajar no caminhão.' }]) }),
      racao: () => ({ titulo: '🌽 Ração de fora', lista: deQuem('pecuarista', [{ rotulo: 'Ver as ofertas de ração', id: 'racao', f: fazer('pecuarista', 'racao') }]) }),
      fazenda: () => ({ titulo: '🌾 Fazenda', lista: ctx.pode('logistica') && emp.pasto ? [1, 2, 4, 6].filter((n) => n <= Math.max(1, emp.pasto.gta)).map((n) => ({ rotulo: `🚚 Levar ${n} boi(s) ao frigorífico`, id: `levar-bois-${n}`, desligado: !emp.pasto.gta || !!emp.caminhao.viagem, f: fazer('logistica', 'viajar', { rota: 'pasto_frig', qtd: n }) })).concat(emp.pasto.gta ? [] : [{ texto: 'Nenhum boi pronto com guia agora.' }])
        : [{ texto: 'A roça e o pasto. Para levar os bois, é com a Logística.' }, ...irPara(['agricultor', 'pecuarista', 'veterinario'])] }),
      frigorifico: () => ({ titulo: '🏭 Frigorífico', lista: ctx.pode('logistica') && emp.frig ? [300, 600, 1000, 1500].map((n) => ({ rotulo: `🚚 Levar ${n} hambúrgueres à lanchonete`, id: `levar-hamb-${n}`, desligado: !emp.frig.estoque || !!emp.caminhao.viagem, f: fazer('logistica', 'viajar', { rota: 'frig_loja', qtd: Math.min(n, emp.frig.estoque) }) }))
        : [{ texto: 'Onde o boi vira hambúrguer.' }, ...irPara(['frigorifico'])] }),
      posto: () => ({ titulo: '⛽ Posto', lista: deQuem('logistica', [{ rotulo: `Encher o tanque (está em ${emp.caminhao ? emp.caminhao.combustivel : '?'}%)`, id: 'abastecer', f: fazer('logistica', 'abastecer') }]) }),
      caminhao: () => ({ titulo: '🚚 Caminhão', lista: [{ texto: emp.caminhao && emp.caminhao.viagem ? `${emp.caminhao.viagem.nome}, levando ${emp.caminhao.viagem.carga}.` : 'Parado. Clique na fazenda ou no frigorífico para mandar uma viagem.' }] }),
      queimada: (a) => ({ titulo: '🔥 Foco de queimada!', lista: deQuem('qualidade', [{ rotulo: '🚒 Apagar o foco (R$ 300)', id: 'apagar', f: fazer('qualidade', 'combater', { id: a.dados.id }) }]) }),
      lanchonete: () => ({ titulo: '🍔 Lanchonete', lista: [{ texto: emp.loja ? `${emp.loja.estoque} hambúrgueres, fila de ${emp.loja.fila}.` : 'Onde a turma vende.' }, ...irPara(['gerente', 'caixa', 'chapeiro'])] }),
      escritorio: () => ({ titulo: '🏢 Escritório', lista: [{ texto: 'Contas, compras, propaganda, equipe e meio ambiente.' }, ...irPara(['financeiro', 'compras', 'marketing', 'rh', 'qualidade'])] }),
      bois: () => ({ titulo: '🐂 Bois que chegaram', lista: deQuem('frigorifico', [{ rotulo: `⚙️ Processar ${emp.frig.bois} boi(s) (R$ 150 cada)`, id: 'processar', desligado: !emp.frig.bois, f: fazer('frigorifico', 'abater', { qtd: emp.frig.bois }) }]) }),
      maquina: () => ({ titulo: `⚙️ Produção: ${emp.frig.producao} por dia`, lista: deQuem('frigorifico', [0, 200, 400, 600, 800, 1000].map((n) => ({ rotulo: `${n} hambúrgueres por dia`, id: `producao-${n}`, f: fazer('frigorifico', 'producao', { qtd: n }) }))) }),
      vencido: () => ({ titulo: '❗ Lote vencido', lista: deQuem('frigorifico', [{ rotulo: '🗑️ Jogar fora os vencidos', id: 'descartar', f: fazer('frigorifico', 'descartar') }, { texto: 'Hambúrguer vencido não pode ir para o cliente.' }]) }),
      camara: () => ({ titulo: '❄️ Câmara fria', lista: [{ texto: `${emp.frig.estoque} hambúrgueres guardados. Amarelo: vence hoje; vermelho: vencido.` }] }),
      higiene: () => ({ titulo: '🧼 Limpeza', lista: deQuem('frigorifico', [{ rotulo: emp.frig.higiene ? 'Desligar a limpeza (a fiscalização reprova!)' : 'Ligar a limpeza diária', id: 'higiene', f: fazer('frigorifico', 'higiene', { ligar: !emp.frig.higiene }) }]) }),
      porta: () => ({ titulo: '🚪 Porta da lanchonete', lista: deQuem('gerente', [{ rotulo: emp.loja.aberta ? 'Fechar a loja' : 'Abrir a loja', id: 'abrir-loja', f: fazer('gerente', 'abrir', { aberta: !emp.loja.aberta }) }]) }),
      preco: () => ({ titulo: `💲 Preço: R$ ${emp.loja.preco}`, lista: deQuem('gerente', [14, 16, 18, 20, 22, 25].map((v) => ({ rotulo: `R$ ${v}${v === emp.loja.preco ? ' (atual)' : ''}`, id: `preco-${v}`, f: fazer('gerente', 'preco', { valor: v }) }))
        .concat([{ rotulo: emp.loja.promocao ? 'Tirar a promoção' : '🏷️ Promoção (15% mais barato)', id: 'promocao', f: fazer('gerente', 'promocao', { ligar: !emp.loja.promocao }) }])) }),
      prateleira: () => ({ titulo: '🍞 Pão, queijo e embalagem', lista: deQuem('compras', [300, 600, 1000, 2000].map((n) => ({ rotulo: `Comprar ${n} de cada (R$ ${(n * 3).toLocaleString('pt-BR')})`, id: `comprar-${n}`, f: fazer('compras', 'comprar', { qtd: n }) }))
        .concat([{ texto: 'O fornecedor entrega em 14 horas.' }])) }),
      equipe: () => ({ titulo: `👷 ${emp.loja.atendentes} atendente(s)`, lista: deQuem('rh', [
        { rotulo: '➕ Contratar (R$ 400)', id: 'contratar', f: fazer('rh', 'contratar') }, { rotulo: '🎓 Treinar (R$ 700)', id: 'treinar', f: fazer('rh', 'treinar') },
        { rotulo: '⏰ Hora extra paga (2 h, R$ 300)', id: 'hora-extra', f: fazer('rh', 'horaExtra') }, { rotulo: '🏖️ Folga (R$ 500)', id: 'folga', f: fazer('rh', 'folga') },
        { rotulo: '➖ Demitir (R$ 800)', id: 'demitir', f: fazer('rh', 'demitir') }]) }),
      fila: () => ({ titulo: `🧍 Fila: ${emp.loja.fila}`, lista: [{ texto: ctx.pode('caixa') || ctx.pode('chapeiro') ? 'Atenda na mão logo abaixo: cada pedido digitado (caixa) ou lanche montado (chapeiro) atende um cliente!' : 'Fila grande? O RH contrata, o Caixa e o Chapeiro atendem na mão.' }] }),
      computador: () => ({ titulo: '📊 Lucro', lista: [{ texto: (emp.dias || []).slice(-3).map((d) => `Dia ${d.dia}: R$ ${d.lucro.toLocaleString('pt-BR')}`).join(' · ') || 'Aparece no fim do primeiro dia.' }] }),
      contas: () => ({ titulo: '🧾 Contas', lista: emp.escritorio.contas.length ? emp.escritorio.contas.flatMap((c) => [
        ...(ctx.pode('financeiro') ? [{ rotulo: `Pagar: ${c.nome.slice(0, 40)} (R$ ${c.valor.toLocaleString('pt-BR')}, vence dia ${c.vence})`, id: `pagar-${c.id}`, f: fazer('financeiro', 'pagar', { id: c.id }) }] : []),
        ...(ctx.pode('compras') ? [{ rotulo: `🛡️ Recusar: ${c.nome.slice(0, 40)}`, id: `recusar-${c.id}`, f: fazer('compras', 'recusar', { id: c.id }) }] : []),
      ]).concat(ctx.pode('financeiro') || ctx.pode('compras') ? [{ texto: 'Boleto com CNPJ diferente ou urgência demais pode ser golpe!' }] : [{ texto: `As contas são com ${ctx.quem('financeiro')}.` }]) : [{ texto: 'Nenhuma conta para pagar agora.' }] }),
      banco: () => ({ titulo: '🏦 Banco', lista: deQuem('financeiro', [{ rotulo: 'Pegar R$ 10.000 emprestado (juros de 1% ao dia)', id: 'emprestimo', f: fazer('financeiro', 'emprestimo', { valor: 10000 }) },
        { rotulo: `Pagar o empréstimo (R$ ${emp.emprestimo.toLocaleString('pt-BR')})`, id: 'quitar', desligado: !emp.emprestimo, f: fazer('financeiro', 'quitar', { valor: emp.emprestimo }) }]) }),
      outdoor: () => ({ titulo: '📣 Propaganda (3 dias)', lista: deQuem('marketing', [{ rotulo: '✅ Honesta: "Fresquinho da fazenda!" (R$ 1.200, +25% clientes)', id: 'campanha-honesta', f: fazer('marketing', 'campanha', { tipo: 'honesta' }) },
        { rotulo: '⚠️ Enganosa: "100% natural!!!" (R$ 600, +40%, mas o PROCON...)', id: 'campanha-enganosa', f: fazer('marketing', 'campanha', { tipo: 'enganosa' }) }]) }),
      avaliacoes: () => { const a = (emp.escritorio.avaliacoes || [])[0]; return { titulo: '⭐ Avaliações', lista: a ? deQuem('marketing', [{ texto: `"${a.texto}"` }, { rotulo: '🙂 Responder com educação e oferecer outro lanche', id: 'responder-educada', f: fazer('marketing', 'responder', { id: a.id, resposta: 'educada' }) }, { rotulo: '😠 Responder brigando', id: 'responder-grossa', f: fazer('marketing', 'responder', { id: a.id, resposta: 'grossa' }) }]) : [{ texto: 'Nenhuma avaliação esperando resposta.' }] }; },
      alvara: () => ({ titulo: '📄 Alvará', lista: deQuem('qualidade', [{ rotulo: 'Renovar pelo gov.br (R$ 800)', id: 'alvara', f: fazer('qualidade', 'alvara') }]) }),
    };
    function irPara(funcoes) { return funcoes.filter((f) => ctx.pode(f)).map((f) => ({ rotulo: `Ir para ${ctx.nome(f)}`, id: `ir-${f}`, f: () => ctx.irPara(f) })); }

    return {
      el: caixa,
      atualizar(estado, empresa) {
        est = estado; emp = empresa;
        horasBase = estado.horas || 0; recebido = performance.now();
        if (tipo === 'lanchonete') novosClientes();
      },
      destruir() { vivo = false; cancelAnimationFrame(raf); },
    };
  }

  // Qual cena cada função vê
  const CENA_DA_FUNCAO = { agricultor: 'roca', pecuarista: 'pasto', veterinario: 'pasto', logistica: 'mundo', frigorifico: 'frigorifico', compras: 'lanchonete', chapeiro: 'lanchonete',
    caixa: 'lanchonete', gerente: 'lanchonete', marketing: 'escritorio', rh: 'lanchonete', qualidade: 'mundo', financeiro: 'escritorio', diretor: 'mundo' };
  CE.negocioCenas = { criar, CENA_DA_FUNCAO };
})();
