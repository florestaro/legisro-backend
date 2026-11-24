// A Praça Escola em 3D isométrico: o "2D que parece 3D" (como SimCity e Habbo).
//
// O mapa continua o mesmo plano de sempre (quadrinhos de 40 px, app/js/praca-mapa.js); quem faz o 3D é a câmera:
// o plano inteiro é girado 45° (ou 135°, 225° e 315°, com os botões de girar) e achatado pela metade na vertical.
// Tudo o que fica deitado no chão (ruas, praça, rio, a água da enchente, a árvore caída) continua no plano. O que
// fica em pé (prédios, árvores, postes, pessoas, nomes) desfaz a transformação do plano ("--anti") e fica de frente
// para a tela, ancorado no ponto do chão onde está.
//
// Prédios e caixas (bancos, lixeiras, barracas, mural) são desenhados aqui, já em isométrico, e cortados em fatias
// verticais de meio quadrinho da tela. Cada fatia ganha a profundidade do ponto mais à frente do prédio naquela
// faixa: assim quem passa atrás de um prédio some atrás dele e quem passa na frente aparece na frente, mesmo nos
// prédios compridos. Profundidade (z-index) = 10000 + 100 × (sen θ · x + cos θ · y): quanto mais perto da tela, maior.
window.CE = window.CE || {};

(function () {
  const HZ = Math.sin(Math.PI / 3);       // um quadrinho de altura vira 0,866 quadrinho na tela (câmera a 60°)
  const Q = 2;                            // os desenhos têm o dobro de pontos (ficam nítidos com zoom)
  const LUZ = (() => { const v = [-0.45, 0.75, 1.1]; const n = Math.hypot(...v); return v.map((x) => x / n); })();
  const brilho = (n) => Math.min(1.06, 0.72 + 0.34 * Math.max(0, n[0] * LUZ[0] + n[1] * LUZ[1] + n[2] * LUZ[2]));
  const zDe = (q) => 10000 + Math.round(q * 100);

  function rgb(c) {
    if (Array.isArray(c)) return c;
    const s = String(c || '#000000').trim();
    if (s[0] === '#') { const n = parseInt(s.slice(1, 7), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    const m = s.match(/\d+(\.\d+)?/g) || [0, 0, 0];
    return [Number(m[0]) || 0, Number(m[1]) || 0, Number(m[2]) || 0];
  }
  const tinta = (c, k, a) => { const [r, g, b] = rgb(c); const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return a == null ? `rgb(${f(r)},${f(g)},${f(b)})` : `rgba(${f(r)},${f(g)},${f(b)},${a})`; };

  // ---------- O giro: a matriz do plano (girar e achatar), a inversa e a profundidade ----------
  function giroDe(k) {
    const kk = ((Math.round(k) % 4) + 4) % 4;
    const th = Math.PI / 4 + kk * Math.PI / 2;
    const c = Math.abs(Math.cos(th)) < 1e-9 ? 0 : Math.cos(th), s = Math.abs(Math.sin(th)) < 1e-9 ? 0 : Math.sin(th);
    return {
      k: kk, th, c, s,
      css: `matrix(${c}, ${0.5 * s}, ${-s}, ${0.5 * c}, 0, 0)`,          // plano → tela
      anti: `matrix(${c}, ${-s}, ${2 * s}, ${2 * c}, 0, 0)`,            // desfaz o giro e o achatamento
      // ponto (x, y) do chão a h quadrinhos de altura → tela (em quadrinhos; × T para pixels, com zoom 1)
      tela: (x, y, h = 0) => [c * x - s * y, 0.5 * (s * x + c * y) - HZ * h],
      // tela (em quadrinhos) → ponto do chão
      chao: (X, Y) => [c * X + s * 2 * Y, -s * X + c * 2 * Y],
      prof: (x, y) => s * x + c * y,
      // > 0: a face (com esta normal) está virada para a câmera
      frente: (n) => n[0] * s * HZ + n[1] * c * HZ + n[2] * 0.5,
      // o quanto um ponto está perto da câmera (para desenhar do fundo para a frente)
      perto: (p) => (s * p[0] + c * p[1]) * HZ + p[2] * 0.5,
    };
  }

  // ---------- Prédios e caixas: os polígonos em 3D (em quadrinhos) ----------
  // estilo: { parede, teto, h, bico, platibanda, janelas, portas, colunas, cruz, chamine, obra, listrasTeto, frente }
  function poligonosDaCaixa(x0, y0, w, d, e) {
    const x1 = x0 + w, y1 = y0 + d, h = e.h, ps = [];
    const parede = (nome, n, pts, ao) => ps.push({ n, pts, cor: e.parede, borda: true, parede: nome, ao });
    parede('sul', [0, 1, 0], [[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]], (a, z) => [x0 + a, y1, z]);
    parede('norte', [0, -1, 0], [[x1, y0, 0], [x0, y0, 0], [x0, y0, h], [x1, y0, h]], (a, z) => [x1 - a, y0, z]);
    parede('leste', [1, 0, 0], [[x1, y1, 0], [x1, y0, 0], [x1, y0, h], [x1, y1, h]], (a, z) => [x1, y1 - a, z]);
    parede('oeste', [-1, 0, 0], [[x0, y0, 0], [x0, y1, 0], [x0, y1, h], [x0, y0, h]], (a, z) => [x0, y0 + a, z]);
    const b = e.bico || 0, ym = (y0 + y1) / 2;
    if (b > 0) {
      const al = Math.atan2(b, d / 2), sn = Math.sin(al), cs = Math.cos(al);
      ps.push({ n: [0, -sn, cs], pts: [[x0, y0, h], [x1, y0, h], [x1, ym, h + b], [x0, ym, h + b]], cor: e.teto, borda: true, teto: true });
      ps.push({ n: [0, sn, cs], pts: [[x1, y1, h], [x0, y1, h], [x0, ym, h + b], [x1, ym, h + b]], cor: e.teto, borda: true, teto: true });
      ps.push({ n: [1, 0, 0], pts: [[x1, y1, h], [x1, y0, h], [x1, ym, h + b]], cor: e.parede, borda: true });
      ps.push({ n: [-1, 0, 0], pts: [[x0, y0, h], [x0, y1, h], [x0, ym, h + b]], cor: e.parede, borda: true });
    } else {
      ps.push({ n: [0, 0, 1], pts: [[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]], cor: e.teto, borda: true, teto: true });
      if (e.platibanda) {
        const m = Math.min(0.16, w / 6, d / 6);
        ps.push({ n: [0, 0, 1], pts: [[x0 + m, y0 + m, h], [x1 - m, y0 + m, h], [x1 - m, y1 - m, h], [x0 + m, y1 - m, h]], cor: tinta(e.teto, 0.86), sobre: true });
      }
    }
    return ps;
  }

  function desenharCaixa(g, G, T, ox, oy, x0, y0, w, d, e) {
    const h = e.h;
    const P = (p) => { const [X, Y] = G.tela(p[0], p[1], p[2]); return [X * T - ox, Y * T - oy]; };
    const poli = (pts, cor, borda) => {
      g.beginPath(); pts.forEach((p, i) => { const [X, Y] = P(p); if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.closePath();
      g.fillStyle = cor; g.fill();
      if (borda) { g.strokeStyle = borda; g.lineWidth = 1; g.stroke(); }
    };
    const ps = poligonosDaCaixa(x0, y0, w, d, e).filter((p) => p.sobre || G.frente(p.n) > 0.001);
    const centro = (p) => p.pts.reduce((a, q) => a + G.perto(q), 0) / p.pts.length;
    ps.sort((a, b) => (a.sobre ? 1 : 0) - (b.sobre ? 1 : 0) || centro(a) - centro(b));
    for (const p of ps) {
      const k = brilho(p.n);
      poli(p.pts, tinta(p.cor, k), p.borda ? tinta(p.cor, k * 0.62) : null);
      if (p.parede && p.ao) detalhesDaParede(p, k);
    }
    // Detalhes de cima: a cruz do Posto de Saúde, a chaminé, a placa da obra
    if (e.cruz && !e.bico) {
      const cx = x0 + w - 0.75, cy = y0 + d / 2, pts = [];
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; pts.push([cx + Math.cos(a) * 0.32, cy + Math.sin(a) * 0.32, h + 0.01]); }
      poli(pts, '#FFFFFF', 'rgba(0,0,0,.2)');
      poli([[cx - 0.06, cy - 0.22, h + 0.02], [cx + 0.06, cy - 0.22, h + 0.02], [cx + 0.06, cy + 0.22, h + 0.02], [cx - 0.06, cy + 0.22, h + 0.02]], '#2E8B57');
      poli([[cx - 0.22, cy - 0.06, h + 0.02], [cx + 0.22, cy - 0.06, h + 0.02], [cx + 0.22, cy + 0.06, h + 0.02], [cx - 0.22, cy + 0.06, h + 0.02]], '#2E8B57');
    }
    if (e.chamine) {
      const cx = x0 + w - 0.5, cy = y0 + 0.42, base = h + (e.bico || 0) * Math.min(1, (cy - y0) / (d / 2)), topo = h + (e.bico || 0) + 0.28;
      const mini = poligonosDaCaixa(cx - 0.11, cy - 0.11, 0.22, 0.22, { h: topo, parede: tinta(e.parede, 0.62), teto: tinta(e.parede, 0.45) })
        .filter((p) => G.frente(p.n) > 0.001).map((p) => ({ ...p, pts: p.pts.map(([a, bb, z]) => [a, bb, Math.max(base - 0.05, z)]) }));
      mini.sort((a, b) => centro(a) - centro(b));
      for (const p of mini) poli(p.pts, tinta(p.cor, brilho(p.n)), tinta(p.cor, 0.5));
    }
    if (e.listrasTeto) {
      // toldo listrado (barracas da feira)
      const n = 5;
      for (let i = 0; i < n; i++) if (i % 2) poli([[x0 + (i / n) * w, y0, h + 0.005], [x0 + ((i + 1) / n) * w, y0, h + 0.005], [x0 + ((i + 1) / n) * w, y0 + d, h + 0.005], [x0 + (i / n) * w, y0 + d, h + 0.005]], '#FFFFFF');
    }
    if (e.placa && !e.obra) {
      // a placa da lanchonete (e da arena) em cima do telhado: um poste e o letreiro redondo com o emoji
      const cx = x0 + w / 2, cy = y0 + d / 2;
      const [Xb, Yb] = P([cx, cy, h]), [Xt, Yt] = P([cx, cy, h + 0.55]);
      g.strokeStyle = '#6B6B6B'; g.lineWidth = Math.max(2, T * 0.08); g.beginPath(); g.moveTo(Xb, Yb); g.lineTo(Xt, Yt); g.stroke();
      const r = T * 0.42;
      g.fillStyle = e.placaFundo || '#C62828'; g.beginPath(); g.arc(Xt, Yt - r * 0.6, r, 0, Math.PI * 2); g.fill();
      g.lineWidth = Math.max(2, T * 0.07); g.strokeStyle = e.placaBorda || '#F2B705'; g.stroke();
      g.font = `${Math.round(r * 1.15)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000';
      g.fillText(e.placa, Xt, Yt - r * 0.55);
    }
    if (e.obra) {
      // placa da obra em cima do tapume
      const [X, Y] = P([x0 + w / 2, y0 + d / 2, h]);
      g.font = `${Math.round(T * 0.62)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillStyle = '#000';
      g.fillText('🏗️', X, Y + T * 0.08);
    }

    function detalhesDaParede(p, k) {
      const comp = p.parede === 'sul' || p.parede === 'norte' ? w : d;
      if (e.obra) {
        // a faixa listrada amarela e preta embaixo do tapume
        const passos = Math.max(2, Math.round(comp * 3));
        for (let i = 0; i < passos; i++) {
          const a0 = (i / passos) * comp, a1 = ((i + 1) / passos) * comp;
          poli([p.ao(a0, 0), p.ao(a1, 0), p.ao(a1, Math.min(0.2, h)), p.ao(a0, Math.min(0.2, h))], i % 2 ? '#2B2B2B' : tinta('#F5B400', k));
        }
        return;
      }
      if (e.listras) {
        // listras verticais (mural, barracas)
        for (let i = 0; i < e.listras.length; i++) {
          const [a0, a1, z0, z1, cor] = e.listras[i];
          if (e.listrasParede && !e.listrasParede.includes(p.parede)) continue;
          poli([p.ao(a0 * comp, z0), p.ao(a1 * comp, z0), p.ao(a1 * comp, z1), p.ao(a0 * comp, z1)], tinta(cor, k));
        }
      }
      if (!e.janelas) return;
      const andares = Math.max(1, Math.floor(h / 1.02));
      for (let i = 0; i < comp; i++) for (let f = 0; f < andares; f++) {
        const xi = p.parede === 'sul' ? x0 + i : p.parede === 'norte' ? x0 + w - 1 - i : null;
        const porta = p.parede === 'sul' && f === 0 && (e.portas || []).includes(xi);
        const [z0, z1] = porta ? [0, 0.78] : [0.36 + f * 1.02, 0.8 + f * 1.02];
        if (z1 > h - 0.1) continue;
        const [a0, a1] = porta ? [i + 0.3, i + 0.7] : [i + 0.24, i + 0.76];
        poli([p.ao(a0, z0), p.ao(a1, z0), p.ao(a1, z1), p.ao(a0, z1)], porta ? tinta('#5B3A22', k) : tinta('#8EC3DE', k), porta ? null : 'rgba(255,255,255,.75)');
      }
      if (e.colunas && p.parede === 'sul') for (let i = 0; i <= comp; i++) {
        const a = Math.min(comp - 0.12, Math.max(0, i - 0.06));
        poli([p.ao(a, 0), p.ao(a + 0.12, 0), p.ao(a + 0.12, h), p.ao(a, h)], tinta('#FFFFFF', k), 'rgba(0,0,0,.12)');
      }
    }
  }

  // Desenha a caixa num canvas e corta em fatias (cada fatia com a profundidade do ponto mais à frente nela).
  function fatiarCaixa(G, T, x0, y0, w, d, e, base) {
    const alto = e.h + (e.bico || 0) + (e.chamine ? 0.3 : 0) + (e.obra ? 0.7 : 0) + (e.placa ? 1.1 : 0);
    const cantos = [[x0, y0], [x0 + w, y0], [x0 + w, y0 + d], [x0, y0 + d]];
    const tela = cantos.flatMap(([x, y]) => [G.tela(x, y, 0), G.tela(x, y, alto)]).map(([X, Y]) => [X * T, Y * T]);
    const bx1 = Math.floor(Math.min(...tela.map((p) => p[0])) - 3), bx2 = Math.ceil(Math.max(...tela.map((p) => p[0])) + 3);
    const by1 = Math.floor(Math.min(...tela.map((p) => p[1])) - 3), by2 = Math.ceil(Math.max(...tela.map((p) => p[1])) + 3);
    const cv = document.createElement('canvas');
    cv.width = (bx2 - bx1) * Q; cv.height = (by2 - by1) * Q;
    const g = cv.getContext('2d');
    g.setTransform(Q, 0, 0, Q, 0, 0);
    g.lineJoin = 'round';
    desenharCaixa(g, G, T, bx1, by1, x0, y0, w, d, e);
    // As faixas: de meio em meio quadrinho na tela, alinhadas com os cantos dos quadrinhos.
    const passo = T * Math.SQRT1_2;
    const pq = cantos.map(([x, y]) => [G.tela(x, y)[0] * T, G.prof(x, y)]);
    const Xmin = Math.min(...pq.map((p) => p[0])), Xmax = Math.max(...pq.map((p) => p[0]));
    const fatias = [];
    for (let m = Math.floor(Xmin / passo + 1e-6); m * passo < Xmax - 1e-6; m++) {
      const X1 = m * passo, X2 = (m + 1) * passo;
      let q = -Infinity;
      for (let i = 0; i < 4; i++) {
        const [Xa, qa] = pq[i], [Xb, qb] = pq[(i + 1) % 4];
        if (Xa >= X1 - 1e-6 && Xa <= X2 + 1e-6) q = Math.max(q, qa);
        for (const Xc of [X1, X2]) if ((Xa - Xc) * (Xb - Xc) < 0) q = Math.max(q, qa + ((qb - qa) * (Xc - Xa)) / (Xb - Xa));
      }
      // a primeira e a última fatia levam também as sobras da borda do desenho
      const a = m * passo === Math.floor(Xmin / passo + 1e-6) * passo ? bx1 : X1, b2 = (m + 1) * passo >= Xmax - 1e-6 ? bx2 : X2;
      fatias.push({ X1: a, X2: b2, q });
    }
    // Cada fatia leva só a altura onde há desenho (o vazio em cima e embaixo do prédio também custa para a tela).
    const alfa = g.getImageData(0, 0, cv.width, cv.height).data;
    const pintada = (y, c1, c2) => { for (let x = c1, i = (y * cv.width + c1) * 4 + 3; x < c2; x++, i += 4) if (alfa[i]) return true; return false; };
    const els = [];
    for (const f of fatias) {
      const sx = Math.round((f.X1 - bx1) * Q), larg = Math.max(1, Math.min(cv.width - sx, Math.round((f.X2 - f.X1 + 0.8) * Q)));
      let topo = 0, fim = cv.height;
      while (topo < fim && !pintada(topo, sx, sx + larg)) topo++;
      while (fim > topo && !pintada(fim - 1, sx, sx + larg)) fim--;
      if (fim <= topo) continue; // fatia vazia
      topo = Math.floor(topo / Q) * Q; fim = Math.min(cv.height, Math.ceil(fim / Q) * Q);
      const el = document.createElement('canvas');
      el.width = larg; el.height = fim - topo;
      el.getContext('2d').drawImage(cv, sx, topo, larg, el.height, 0, 0, larg, el.height);
      el.className = 'pr-iso';
      el.style.width = `${larg / Q}px`; el.style.height = `${el.height / Q}px`;
      el._tela = [sx / Q + bx1, by1 + topo / Q]; // canto da fatia na tela (px, zoom 1)
      el.style.transform = `var(--anti) translate(${el._tela[0].toFixed(2)}px, ${el._tela[1]}px)`;
      el.style.zIndex = String(zDe(f.q) + (base || 0));
      els.push(el);
    }
    return els;
  }

  // ---------- Coisas em pé que não mudam com o giro (árvores, postes, plantas): um desenho só ----------
  function desenharArvore(tipo, cores) {
    const cv = document.createElement('canvas'), W = 52, H = tipo === 'palmeira' ? 96 : 86;
    cv.width = W * Q; cv.height = H * Q;
    const g = cv.getContext('2d'); g.setTransform(Q, 0, 0, Q, 0, 0);
    const pe = H - 6, cx = W / 2;
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(cx + 2, pe, 15, 6, 0, 0, Math.PI * 2); g.fill();
    if (tipo === 'palmeira') {
      g.strokeStyle = '#7A5A2E'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(cx, pe); g.quadraticCurveTo(cx + 6, pe - 40, cx + 2, pe - 70); g.stroke();
      g.fillStyle = cores.palmeira || '#3F8F3A';
      for (let k = 0; k < 6; k++) { g.save(); g.translate(cx + 2, pe - 70); g.rotate(-Math.PI / 2 + (k - 2.5) * 0.55); g.beginPath(); g.ellipse(14, 0, 16, 4.5, 0.25, 0, Math.PI * 2); g.fill(); g.restore(); }
      g.fillStyle = '#5C3F1E'; g.beginPath(); g.arc(cx + 2, pe - 69, 3.5, 0, Math.PI * 2); g.fill();
      return cv;
    }
    const [cor, escura, flor] = cores;
    g.strokeStyle = '#6B4A2E'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx, pe); g.lineTo(cx, pe - 34); g.stroke();
    const cy = pe - 52, r = 21;
    g.fillStyle = escura; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    const gr = g.createRadialGradient(cx - 7, cy - 8, 2, cx - 3, cy - 4, r);
    gr.addColorStop(0, tinta(cor, 1.25)); gr.addColorStop(0.65, cor); gr.addColorStop(1, tinta(cor, 0.85));
    g.fillStyle = gr; g.beginPath(); g.arc(cx - 2, cy - 2, r * 0.86, 0, Math.PI * 2); g.fill();
    if (flor) for (let k = 0; k < 10; k++) { const a = k * 2.4, d = 4 + (k * 7) % 13; g.fillStyle = flor; g.beginPath(); g.arc(cx - 2 + Math.cos(a) * d, cy - 2 + Math.sin(a) * d, 2.4, 0, Math.PI * 2); g.fill(); }
    else { g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.arc(cx - 8, cy - 10, 5, 0, Math.PI * 2); g.fill(); }
    return cv;
  }
  function desenharPoste(alto, luz, cor) {
    const W = 22, H = Math.round(alto * 34.64) + 18;
    const cv = document.createElement('canvas'); cv.width = W * Q; cv.height = H * Q;
    const g = cv.getContext('2d'); g.setTransform(Q, 0, 0, Q, 0, 0);
    const pe = H - 3;
    g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(W / 2, pe, 7, 3, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = cor; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(W / 2, pe); g.lineTo(W / 2, 9); g.stroke();
    if (luz) {
      const gr = g.createRadialGradient(W / 2, 8, 0, W / 2, 8, 10); gr.addColorStop(0, 'rgba(255,240,170,.9)'); gr.addColorStop(1, 'rgba(255,240,170,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, 20);
      g.fillStyle = luz; g.beginPath(); g.arc(W / 2, 8, 4.5, 0, Math.PI * 2); g.fill();
    }
    return cv;
  }
  function desenharTexto(txt, tam) {
    const W = Math.round(tam * 1.4), H = Math.round(tam * 1.3);
    const cv = document.createElement('canvas'); cv.width = W * Q; cv.height = H * Q;
    const g = cv.getContext('2d'); g.setTransform(Q, 0, 0, Q, 0, 0);
    g.font = `${tam}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillStyle = '#000';
    g.fillText(txt, W / 2, H);
    return cv;
  }
  function desenharJato() {
    const W = 26, H = 40;
    const cv = document.createElement('canvas'); cv.width = W * Q; cv.height = H * Q;
    const g = cv.getContext('2d'); g.setTransform(Q, 0, 0, Q, 0, 0);
    g.strokeStyle = 'rgba(235, 248, 255, .95)'; g.lineWidth = 3; g.lineCap = 'round';
    for (const dx of [-7, 0, 7]) { g.beginPath(); g.moveTo(W / 2, H - 2); g.quadraticCurveTo(W / 2 + dx * 0.4, 2, W / 2 + dx, H * 0.45); g.stroke(); }
    return cv;
  }

  // ---------- A cena ----------
  // opcoes: { mapa, T, camada, cores, emObra(id), giro, chao (o canvas do chão visto de cima) }
  function criarCena(opcoes) {
    const M = opcoes.mapa, T = opcoes.T || M.T || 40, camada = opcoes.camada, P = opcoes.cores || {};
    const emObra = typeof opcoes.emObra === 'function' ? opcoes.emObra : () => false;
    let G = giroDe(opcoes.giro || 0);
    const predios = {};       // id → [fatias]
    const caixas = [];        // bancos, lixeiras, barracas, mural: [fatias]
    const emPe = [];          // { el, x, y, larg, alt, base } árvores, postes, plantas, jato da fonte
    const caidas = new Set(); // árvores caídas (no temporal): "x,y"

    function estiloDoPredio(L) {
      if (emObra(L.id)) return { h: 0.45, parede: '#CEC5B2', teto: '#DCD5C6', obra: true };
      return {
        h: M.alturaDe(L), bico: M.bicoDe(L), parede: L.parede, teto: L.telhado, platibanda: !M.bicoDe(L),
        janelas: true, portas: L.portas || [], colunas: !!L.colunas, cruz: !!L.cruz, chamine: !!L.casa,
        placa: L.placa || null, placaFundo: L.placaFundo || null, placaBorda: L.faixa || null,
        listras: L.faixa ? [[0, 1, M.alturaDe(L) - 0.4, M.alturaDe(L) - 0.1, L.faixa]] : null,
      };
    }
    function montarPredio(L, subir) {
      for (const el of predios[L.id] || []) el.remove();
      const [x0, y0, w, d] = L.r;
      const els = fatiarCaixa(G, T, x0, y0, w, d, estiloDoPredio(L));
      for (const el of els) {
        el.dataset.lugar = L.id;
        el.title = L.nome || '';
        if (subir) el.classList.add('subindo');
        camada.append(el);
      }
      predios[L.id] = els;
    }
    function montarCaixas() {
      for (const lista of caixas) for (const el of lista) el.remove();
      caixas.length = 0;
      const junta = (els) => { for (const el of els) camada.append(el); caixas.push(els); };
      for (const [x, y] of M.BANCOS || []) junta(fatiarCaixa(G, T, x + 0.15, y + 0.3, 1.7, 0.45, { h: 0.32, parede: P.bancoEncosto || '#7A4E2A', teto: P.bancoAssento || '#A26C3D' }));
      for (const L of M.OBJETOS || []) if (L.coleta) junta(fatiarCaixa(G, T, L.r[0] + 0.2, L.r[1] + 0.22, 0.6, 0.6, { h: 0.62, parede: L.cor, teto: tinta(L.cor, 0.62) }));
      if (!emObra('feira')) for (const [x, y, cor] of M.BARRACAS || []) junta(fatiarCaixa(G, T, x + 0.06, y + 0.1, 0.88, 0.8, { h: 0.85, parede: P.balcao || '#8A5A35', teto: cor, listrasTeto: true }));
      const mural = M.porLugar && M.porLugar.mural;
      if (mural) {
        const notas = P.notas || ['#FFF39A', '#BFE2FF', '#FFC9D6', '#CFF2C7', '#FFF39A'];
        junta(fatiarCaixa(G, T, mural.r[0] + 0.1, mural.r[1] + 0.55, 1.8, 0.22, {
          h: 1.0, parede: P.muralMoldura || '#8A5A35', teto: P.muralMoldura || '#8A5A35',
          listras: [[0.05, 0.95, 0.22, 0.92, P.muralFundo || '#C9A06A'], ...notas.map((c, i) => [0.1 + i * 0.17, 0.22 + i * 0.17, 0.45 + (i % 2) * 0.15, 0.68 + (i % 2) * 0.15, c])],
          listrasParede: ['sul', 'norte'],
        }));
      }
    }
    function colocarEmPe(el, x, y, larg, alt, base) {
      el.className = 'pr-iso';
      el.style.width = `${larg}px`; el.style.height = `${alt}px`;
      const p = { el, x, y, larg, alt, base: base || 0 };
      emPe.push(p);
      camada.append(el);
      return p;
    }
    // As plantas da horta só aparecem com a horta pronta (e voltam quando ela acende).
    function montarHorta() {
      for (let i = emPe.length - 1; i >= 0; i--) if (emPe[i].horta) { emPe[i].el.remove(); emPe.splice(i, 1); }
      if (emObra('horta')) return;
      ['🥬', '🌽', '🍅'].forEach((planta, k) => {
        for (let i = 0; i < 6; i++) { const el = desenharTexto(planta, 15); colocarEmPe(el, 12.45 + i * 0.775, 22.62 + k, el.width / Q, el.height / Q, 1).horta = true; }
      });
    }
    function montarEmPe() {
      const arv = (x, y, cores, tipo) => { const el = desenharArvore(tipo, cores); el.dataset.arvore = `${x},${y}`; colocarEmPe(el, x + 0.5, y + 0.5, el.width / Q, el.height / Q, 6); };
      for (const [x, y] of M.ARVORES || []) arv(x, y, P.arvore || ['#4E9A43', '#2F6E2A']);
      for (const [x, y, c] of M.IPES || []) arv(x, y, c === 'amarelo' ? (P.ipeAmarelo || ['#F2C12E', '#C5960F', '#FFE27A']) : (P.ipeRoxo || ['#C2569E', '#8C3A72', '#F0A6D6']));
      for (const [x, y] of M.PALMEIRAS || []) arv(x, y, P, 'palmeira');
      if (M.POSTE) { const el = desenharPoste(1.45, P.luz || '#F6E27A', P.poste || '#5B6168'); colocarEmPe(el, M.POSTE[0] + 0.5, M.POSTE[1] + 0.5, el.width / Q, el.height / Q, 3); }
      const lampioes = [];
      for (const x of [2, 13, 21, 29, 34]) lampioes.push([x, 4], [x, 18]);
      for (const x of [3, 14, 23, 33]) lampioes.push([x, 21]);
      for (const [x, y] of lampioes) { const el = desenharPoste(1.05, P.lampiaoLuz || '#F6E58A', P.lampiao || '#4E5459'); colocarEmPe(el, x + 0.15, y + 0.9, el.width / Q, el.height / Q, 3); }
      // As colunas brancas do coreto e o jato da fonte
      for (let k = 0; k < 8; k++) {
        const a = Math.PI / 8 + (k * Math.PI) / 4, el = desenharPoste(0.85, null, '#FFFFFF');
        colocarEmPe(el, 18 + Math.cos(a) * 1.325, 9.5 + Math.sin(a) * 1.325, el.width / Q, el.height / Q, 2);
      }
      { const el = desenharJato(); colocarEmPe(el, 18, 14, el.width / Q, el.height / Q, 8); }
      montarHorta();
    }
    function posicionarEmPe() {
      for (const p of emPe) {
        const [X, Y] = G.tela(p.x, p.y);
        p.el._tela = [X * T - p.larg / 2, Y * T - p.alt + p.base];
        p.el.style.transform = `var(--anti) translate(${p.el._tela[0].toFixed(2)}px, ${p.el._tela[1].toFixed(2)}px)`;
        p.el.style.zIndex = String(zDe(G.prof(p.x, p.y)) + 2);
        if (p.el.dataset.arvore) p.el.hidden = caidas.has(p.el.dataset.arvore);
      }
    }
    // Um ponto da tela (px, zoom 1) cai num pedaço pintado deste desenho?
    function opacoEm(el, X, Y) {
      const o = el._tela; if (!o) return false;
      const lx = Math.floor((X - o[0]) * Q), ly = Math.floor((Y - o[1]) * Q);
      if (lx < 0 || ly < 0 || lx >= el.width || ly >= el.height) return false;
      try { return el.getContext('2d').getImageData(lx, ly, 1, 1).data[3] > 60; } catch (e) { return false; }
    }
    // Quem anda atrás de um prédio ou de uma árvore não some: o que está na frente dele fica transparente.
    let vazados = new Set();
    function vazar(alvo) {
      const novos = new Set();
      if (alvo) {
        const pontos = [];
        for (const dy of [-34, -21, -8]) for (const dx of [-9, 0, 9]) pontos.push([alvo.x + dx, alvo.y + dy]);
        const cobre = (el) => Number(el.style.zIndex) > alvo.z && pontos.some(([X, Y]) => opacoEm(el, X, Y));
        for (const id in predios) if (predios[id].some(cobre)) for (const el of predios[id]) novos.add(el);
        for (const p of emPe) if (p.el.dataset.arvore && !p.el.hidden && cobre(p.el)) novos.add(p.el);
      }
      for (const el of vazados) if (!novos.has(el)) el.classList.remove('vazado');
      for (const el of novos) if (!vazados.has(el)) el.classList.add('vazado');
      vazados = novos;
    }
    // O chão: o desenho de cima (o mesmo do 2D), deitado do jeito da vista uma vez por giro. Assim a tela só copia o
    // chão a cada quadro, em vez de entortar o chão inteiro (é o que mais pesa nos computadores sem placa de vídeo).
    let chaoEl = null;
    function montarChao() {
      const fonte = opcoes.chao;
      if (!fonte || !fonte.width) return;
      const L = M.W * T, A = M.H * T, qf = fonte.width / L;
      const cantos = [[0, 0], [L, 0], [L, A], [0, A]].map(([x, y]) => G.tela(x / T, y / T).map((v) => v * T));
      const x1 = Math.floor(Math.min(...cantos.map((c) => c[0]))), x2 = Math.ceil(Math.max(...cantos.map((c) => c[0])));
      const y1 = Math.floor(Math.min(...cantos.map((c) => c[1]))), y2 = Math.ceil(Math.max(...cantos.map((c) => c[1])));
      const q = Math.min(2, Math.max(1.25, (window.devicePixelRatio || 1) * 1.25));
      if (!chaoEl) { chaoEl = document.createElement('canvas'); chaoEl.className = 'pr-iso pr-iso-chao'; chaoEl.setAttribute('aria-hidden', 'true'); camada.prepend(chaoEl); }
      chaoEl.width = Math.round((x2 - x1) * q); chaoEl.height = Math.round((y2 - y1) * q);
      chaoEl.style.width = `${chaoEl.width / q}px`; chaoEl.style.height = `${chaoEl.height / q}px`;
      chaoEl.style.transform = `var(--anti) translate(${x1}px, ${y1}px)`;
      const g = chaoEl.getContext('2d'), k = q / qf;
      g.imageSmoothingQuality = 'high';
      // (px do desenho de cima) → (px da tela): X = c·x − s·y, Y = (s·x + c·y) / 2
      g.setTransform(k * G.c, k * 0.5 * G.s, -k * G.s, k * 0.5 * G.c, -x1 * q, -y1 * q);
      g.drawImage(fonte, 0, 0);
    }
    function montarPredios() { for (const L of M.LUGARES) if (L.telhado || L.casa) montarPredio(L); }
    function montarTudo() { montarChao(); montarPredios(); montarCaixas(); posicionarEmPe(); }

    montarEmPe();
    montarTudo();

    return {
      get giro() { return G.k; },
      get G() { return G; },
      HZ,
      girar(k) { G = giroDe(k); vazados = new Set(); montarTudo(); },
      // um prédio mudou (acendeu, entrou em obra, a casa ficou pronta): desenha de novo (subindo, se acendeu)
      atualizar(id, subir) {
        const L = M.porLugar[id];
        if (L && (L.telhado || L.casa)) montarPredio(L, subir);
        if (id === 'feira') montarCaixas();
        if (id === 'horta') { montarHorta(); posicionarEmPe(); }
      },
      // o boneco de quem joga: { x, y } = pé na tela (px, zoom 1), z = profundidade dele (null: ninguém)
      vazar,
      arvoresCaidas(lista) {
        const nova = new Set(lista);
        if (nova.size === caidas.size && [...nova].every((x) => caidas.has(x))) return;
        caidas.clear(); for (const x of nova) caidas.add(x);
        posicionarEmPe();
      },
      zDe,
      // ponto do chão (em quadrinhos) → posição na tela (px, zoom 1) e profundidade
      tela: (x, y, h) => { const [X, Y] = G.tela(x, y, h); return [X * T, Y * T]; },
      chao: (X, Y) => G.chao(X / T, Y / T),
      prof: (x, y) => G.prof(x, y),
      destruir() { for (const el of [...camada.querySelectorAll('.pr-iso')]) el.remove(); chaoEl = null; },
    };
  }

  CE.pracaIso = { criarCena, giroDe, HZ };
})();
