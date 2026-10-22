// Gráficos em SVG para a Planilha (e para as Apresentações): colunas, barras, linhas e pizza.
// desenhar({ tipo, titulo, categorias, series: [{ nome, valores }], formato }, largura, altura) -> texto SVG
window.CE = window.CE || {};

(function () {
  const CORES = ['#2f6fdf', '#e8741e', '#2e9e5b', '#c23b5a', '#7b52c7', '#d4a017', '#1aa3b8', '#8a6a4f'];
  const TIPOS = {
    colunas: { nome: 'Colunas', icone: '📊' },
    barras: { nome: 'Barras', icone: '📶' },
    linhas: { nome: 'Linhas', icone: '📈' },
    pizza: { nome: 'Pizza', icone: '🥧' },
  };
  const e = (t) => CE.escapar(String(t));
  const texto = (v, formato) => (CE.formulas ? CE.formulas.textoDe(v, formato) : String(v));
  const curto = (t, n) => (String(t).length > n ? String(t).slice(0, n - 1) + '…' : String(t));

  // Arredonda o topo do eixo para um número "bonito" (10, 20, 50, 100...).
  function topoBonito(max) {
    if (max <= 0) return 1;
    const p = 10 ** Math.floor(Math.log10(max));
    return [1, 2, 2.5, 5, 10].map((m) => m * p).find((v) => v >= max);
  }

  function desenhar(g, W = 520, H = 320) {
    const series = g.series.filter((s) => s.valores.some((v) => typeof v === 'number'));
    const cats = g.categorias;
    const partes = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="grafico-svg" role="img" aria-label="${e(g.titulo || 'Gráfico')}">`,
      `<rect width="${W}" height="${H}" fill="#fff"/>`];
    if (g.titulo) partes.push(`<text x="${W / 2}" y="24" text-anchor="middle" font-size="16" font-weight="700" fill="#222">${e(curto(g.titulo, 50))}</text>`);
    if (!series.length || !cats.length) {
      partes.push(`<text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="14" fill="#888">Selecione os nomes e os números para fazer o gráfico</text></svg>`);
      return partes.join('');
    }
    const legenda = g.tipo === 'pizza' ? cats.map((c, i) => [c, CORES[i % CORES.length]]) : series.length > 1 ? series.map((s, i) => [s.nome, CORES[i % CORES.length]]) : [];
    const topo = g.titulo ? 40 : 16;
    const baseLegenda = legenda.length ? 26 : 0;

    if (g.tipo === 'pizza') {
      const valores = series[0].valores.map((v) => (typeof v === 'number' && v > 0 ? v : 0));
      const total = valores.reduce((a, b) => a + b, 0) || 1;
      const r = Math.min(W * 0.32, (H - topo - 16) / 2), cx = W * 0.36, cy = topo + (H - topo) / 2;
      let ang = -Math.PI / 2;
      valores.forEach((v, i) => {
        const fatia = (v / total) * Math.PI * 2;
        if (!fatia) return;
        const x1 = cx + r * Math.cos(ang), y1 = cy + r * Math.sin(ang);
        const x2 = cx + r * Math.cos(ang + fatia), y2 = cy + r * Math.sin(ang + fatia);
        const cor = CORES[i % CORES.length];
        partes.push(fatia >= Math.PI * 2 - 0.0001
          ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${cor}"/>`
          : `<path d="M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${fatia > Math.PI ? 1 : 0} 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="${cor}" stroke="#fff" stroke-width="2"/>`);
        const meio = ang + fatia / 2;
        if (v / total >= 0.04) partes.push(`<text x="${(cx + r * 0.62 * Math.cos(meio)).toFixed(1)}" y="${(cy + r * 0.62 * Math.sin(meio) + 5).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">${Math.round((v / total) * 100)}%</text>`);
        ang += fatia;
      });
      legenda.forEach(([nome, cor], i) => {
        const y = topo + 10 + i * 22;
        if (y > H - 10) return;
        partes.push(`<rect x="${W * 0.7}" y="${y}" width="14" height="14" fill="${cor}"/><text x="${W * 0.7 + 20}" y="${y + 12}" font-size="13" fill="#333">${e(curto(nome, 16))}</text>`);
      });
      partes.push('</svg>');
      return partes.join('');
    }

    const todos = series.flatMap((s) => s.valores.filter((v) => typeof v === 'number'));
    const maior = topoBonito(Math.max(0, ...todos)), menor = Math.min(0, ...todos);
    const horizontal = g.tipo === 'barras';
    const esq = horizontal ? 96 : 62, dir = 16, baixo = (horizontal ? 26 : 40) + baseLegenda;
    const x0 = esq, x1 = W - dir, y0 = topo, y1 = H - baixo;
    const escala = (v) => (v - menor) / (maior - menor || 1);
    // Linhas de grade e números do eixo
    for (let i = 0; i <= 4; i++) {
      const v = menor + ((maior - menor) * i) / 4;
      if (horizontal) {
        const x = x0 + (x1 - x0) * (i / 4);
        partes.push(`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="#e5e5e5"/><text x="${x}" y="${y1 + 16}" text-anchor="middle" font-size="11" fill="#666">${e(texto(v, g.formato))}</text>`);
      } else {
        const y = y1 - (y1 - y0) * (i / 4);
        partes.push(`<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#e5e5e5"/><text x="${x0 - 6}" y="${y + 4}" text-anchor="end" font-size="11" fill="#666">${e(texto(v, g.formato))}</text>`);
      }
    }
    const n = cats.length, faixa = (horizontal ? y1 - y0 : x1 - x0) / n;
    if (g.tipo === 'linhas') {
      series.forEach((s, si) => {
        const cor = CORES[si % CORES.length];
        const pts = s.valores.map((v, i) => (typeof v === 'number' ? [x0 + faixa * (i + 0.5), y1 - (y1 - y0) * escala(v)] : null)).filter(Boolean);
        partes.push(`<polyline points="${pts.map((p) => p.map((c) => c.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${cor}" stroke-width="3"/>`);
        pts.forEach(([x, y]) => partes.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${cor}"/>`));
        if (series.length === 1) s.valores.forEach((v, i) => { if (typeof v === 'number') partes.push(`<text x="${(x0 + faixa * (i + 0.5)).toFixed(1)}" y="${(y1 - (y1 - y0) * escala(v) - 9).toFixed(1)}" text-anchor="middle" font-size="11" fill="#333">${e(texto(v, g.formato))}</text>`); });
      });
    } else {
      const largura = (faixa * 0.7) / series.length;
      series.forEach((s, si) => {
        const cor = CORES[si % CORES.length];
        s.valores.forEach((v, i) => {
          if (typeof v !== 'number') return;
          const inicio = faixa * i + faixa * 0.15 + largura * si;
          const base = escala(0), alto = escala(v);
          if (horizontal) {
            const xa = x0 + (x1 - x0) * Math.min(base, alto), xb = x0 + (x1 - x0) * Math.max(base, alto), y = y0 + inicio;
            partes.push(`<rect x="${xa.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(1, xb - xa).toFixed(1)}" height="${largura.toFixed(1)}" fill="${cor}" rx="2"/>`);
            if (series.length === 1) partes.push(`<text x="${(xb + 4).toFixed(1)}" y="${(y + largura / 2 + 4).toFixed(1)}" font-size="11" fill="#333">${e(texto(v, g.formato))}</text>`);
          } else {
            const ya = y1 - (y1 - y0) * Math.max(base, alto), yb = y1 - (y1 - y0) * Math.min(base, alto), x = x0 + inicio;
            partes.push(`<rect x="${x.toFixed(1)}" y="${ya.toFixed(1)}" width="${largura.toFixed(1)}" height="${Math.max(1, yb - ya).toFixed(1)}" fill="${cor}" rx="2"/>`);
            if (series.length === 1) partes.push(`<text x="${(x + largura / 2).toFixed(1)}" y="${(ya - 5).toFixed(1)}" text-anchor="middle" font-size="11" fill="#333">${e(texto(v, g.formato))}</text>`);
          }
        });
      });
    }
    // Nomes das categorias
    cats.forEach((c, i) => {
      if (horizontal) partes.push(`<text x="${x0 - 6}" y="${(y0 + faixa * (i + 0.5) + 4).toFixed(1)}" text-anchor="end" font-size="12" fill="#333">${e(curto(c, 13))}</text>`);
      else partes.push(`<text x="${(x0 + faixa * (i + 0.5)).toFixed(1)}" y="${y1 + 16}" text-anchor="middle" font-size="12" fill="#333">${e(curto(c, Math.max(4, Math.floor(faixa / 7))))}</text>`);
    });
    partes.push(`<line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="#999"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="#999"/>`);
    legenda.forEach(([nome, cor], i) => {
      const x = x0 + i * 120;
      partes.push(`<rect x="${x}" y="${H - 20}" width="12" height="12" fill="${cor}"/><text x="${x + 17}" y="${H - 10}" font-size="12" fill="#333">${e(curto(nome, 14))}</text>`);
    });
    partes.push('</svg>');
    return partes.join('');
  }

  // Lê os dados de um gráfico da planilha: a 1ª coluna tem os nomes e as outras, os números.
  // Se a 1ª linha só tem textos, ela é o título de cada série.
  function extrair(g, valorDe, formatoDe) {
    const F = CE.formulas;
    const [a, b] = String(g.intervalo).split(':').map(F.lerEndereco);
    const z = b || a;
    const r = { c1: Math.min(a.col, z.col), c2: Math.max(a.col, z.col), l1: Math.min(a.lin, z.lin), l2: Math.max(a.lin, z.lin) };
    const textoCelula = (ref) => F.textoDe(valorDe(ref), (formatoDe(ref) || {}).formato);
    const comNomes = r.c2 > r.c1;
    let cab = r.l2 > r.l1;
    for (let c = comNomes ? r.c1 + 1 : r.c1; c <= r.c2 && cab; c++) { const v = valorDe(F.endereco(c, r.l1)); if (v === '' || typeof v !== 'string') cab = false; }
    const inicio = r.l1 + (cab ? 1 : 0);
    const categorias = [], series = [];
    for (let l = inicio; l <= r.l2; l++) categorias.push(comNomes ? textoCelula(F.endereco(r.c1, l)) : String(l - inicio + 1));
    for (let c = comNomes ? r.c1 + 1 : r.c1; c <= r.c2; c++) {
      // g.colunas: só as colunas que o aluno marcou para aparecer no gráfico.
      if (g.colunas && g.colunas.length && !g.colunas.includes(F.numeroParaLetra(c))) continue;
      const valores = [];
      for (let l = inicio; l <= r.l2; l++) { const v = valorDe(F.endereco(c, l)); valores.push(typeof v === 'number' ? v : ''); }
      series.push({ nome: cab ? String(valorDe(F.endereco(c, r.l1))) : `Série ${series.length + 1}`, valores });
    }
    const formato = (formatoDe(F.endereco(comNomes ? r.c1 + 1 : r.c1, inicio)) || {}).formato;
    return { tipo: g.tipo, titulo: g.titulo, categorias, series, formato };
  }

  // Os dados de um gráfico de uma planilha salva (usado nas Apresentações).
  CE.graficoDaPlanilha = function (dados, g) {
    const entradas = {};
    Object.entries(dados.celulas || {}).forEach(([ref, c]) => { if (c.v !== '' && c.v != null) entradas[ref] = c.v; });
    const { valores } = CE.formulas.calcularTudo(entradas);
    return extrair(g, (ref) => (ref in valores ? valores[ref] : ''), (ref) => (dados.celulas[ref] && dados.celulas[ref].f) || {});
  };

  CE.graficos = { desenhar, extrair, TIPOS, CORES };
})();
