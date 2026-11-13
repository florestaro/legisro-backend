// Desenho Vetorial (como o Canva e o Inkscape): cartazes, posts e logotipos com formas, texto e cores que podem
// ser mudadas a qualquer hora. Ao contrário do Desenho (pixels), o vetor não "quadricula" quando aumenta.
// Formas: retângulo, elipse, linha/seta, estrela e texto. Selecionar, mover, aumentar, cores, contorno, camadas
// (frente/trás), duplicar, centralizar, modelos prontos, zoom, salvar o projeto e exportar como imagem (PNG).
window.CE = window.CE || {};

(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const PAGINAS = { post: [1080, 1080, 'Post quadrado (1080 × 1080)'], cartaz: [794, 1123, 'Cartaz A4 em pé'], banner: [1200, 400, 'Banner (1200 × 400)'] };
  const FERRAMENTAS = [['selecionar', '➚', 'Selecionar e mover (clique na forma)'], ['ret', '▭', 'Retângulo (arraste na página)'], ['elipse', '◯', 'Elipse / círculo (arraste)'],
    ['linha', '╱', 'Linha (arraste)'], ['seta', '➝', 'Seta (arraste)'], ['estrela', '★', 'Estrela (arraste)'], ['texto', 'T', 'Texto (clique onde quer escrever)']];
  const FONTES = ['Arial', 'Georgia', 'Verdana', 'Impact', 'Comic Sans MS'];
  let contador = 0;
  const id = () => 'v' + Date.now().toString(36) + (contador++);
  const MODELOS = {
    cartaz: { nome: '🎉 Cartaz de evento', pagina: 'cartaz', formas: () => [
      { tipo: 'ret', x: 0, y: 0, w: 794, h: 1123, preenchimento: '#fff3c4', contorno: '#fff3c4', espessura: 0 },
      { tipo: 'ret', x: 0, y: 0, w: 794, h: 260, preenchimento: '#c0392b', contorno: '#c0392b', espessura: 0 },
      { tipo: 'texto', x: 397, y: 80, texto: 'FESTA JUNINA', tamanho: 84, fonte: 'Impact', preenchimento: '#ffffff', alinhar: 'meio' },
      { tipo: 'estrela', x: 60, y: 330, w: 120, h: 120, preenchimento: '#f1c40f', contorno: '#b7950b', espessura: 4 },
      { tipo: 'estrela', x: 614, y: 330, w: 120, h: 120, preenchimento: '#f1c40f', contorno: '#b7950b', espessura: 4 },
      { tipo: 'texto', x: 397, y: 520, texto: 'Sábado, 20 de junho, às 18h', tamanho: 44, fonte: 'Arial', preenchimento: '#2c3e50', alinhar: 'meio', negrito: true },
      { tipo: 'texto', x: 397, y: 620, texto: 'Local: Escola Estadual Rio Madeira', tamanho: 36, fonte: 'Arial', preenchimento: '#2c3e50', alinhar: 'meio' },
      { tipo: 'ret', x: 147, y: 820, w: 500, h: 120, preenchimento: '#27ae60', contorno: '#1e8449', espessura: 4, raio: 30 },
      { tipo: 'texto', x: 397, y: 852, texto: 'Entrada grátis!', tamanho: 48, fonte: 'Arial', preenchimento: '#ffffff', alinhar: 'meio', negrito: true },
    ] },
    logotipo: { nome: '🏷️ Logotipo', pagina: 'post', formas: () => [
      { tipo: 'elipse', x: 290, y: 190, w: 500, h: 500, preenchimento: '#1f5fa8', contorno: '#0b3a6e', espessura: 12 },
      { tipo: 'texto', x: 540, y: 330, texto: 'BP', tamanho: 220, fonte: 'Georgia', preenchimento: '#ffffff', alinhar: 'meio', negrito: true },
      { tipo: 'texto', x: 540, y: 760, texto: 'Loja Bom Preço', tamanho: 80, fonte: 'Arial', preenchimento: '#1f5fa8', alinhar: 'meio', negrito: true },
    ] },
    promocao: { nome: '🔥 Post de promoção', pagina: 'post', formas: () => [
      { tipo: 'ret', x: 0, y: 0, w: 1080, h: 1080, preenchimento: '#ffe1d6', contorno: '#ffe1d6', espessura: 0 },
      { tipo: 'texto', x: 540, y: 110, texto: 'PROMOÇÃO', tamanho: 140, fonte: 'Impact', preenchimento: '#c0392b', alinhar: 'meio' },
      { tipo: 'estrela', x: 720, y: 360, w: 280, h: 280, preenchimento: '#f1c40f', contorno: '#b7950b', espessura: 6 },
      { tipo: 'texto', x: 860, y: 465, texto: '-15%', tamanho: 70, fonte: 'Impact', preenchimento: '#c0392b', alinhar: 'meio' },
      { tipo: 'texto', x: 360, y: 470, texto: 'Ventilador', tamanho: 90, fonte: 'Arial', preenchimento: '#2c3e50', alinhar: 'meio', negrito: true },
      { tipo: 'texto', x: 360, y: 600, texto: 'R$ 129,90', tamanho: 110, fonte: 'Arial', preenchimento: '#27ae60', alinhar: 'meio', negrito: true },
      { tipo: 'texto', x: 540, y: 930, texto: 'Loja Bom Preço — só nesta semana!', tamanho: 46, fonte: 'Arial', preenchimento: '#2c3e50', alinhar: 'meio' },
    ] },
  };
  const PADRAO = { preenchimento: '#4a90d9', contorno: '#1f3a5f', espessura: 4, opacidade: 1 };

  CE.registrarApp({
    id: 'vetorial', nome: 'Desenho Vetorial', icone: '✒️', largura: 1040, altura: 660,
    abrir(corpo, janela, argumento) {
      let doc = { pagina: 'post', formas: [] }, nomeArquivo = null, modificado = false;
      let ferramenta = 'selecionar', selecionada = null, zoom = 1, historico = [];
      const larg =() => PAGINAS[doc.pagina][0], alt = () => PAGINAS[doc.pagina][1];
      const svg = document.createElementNS(NS, 'svg');
      svg.classList.add('vt-svg');
      const area = CE.el('div', { class: 'vt-area' }, svg);
      const propriedades = CE.el('div', { class: 'vt-propriedades' });
      const status = CE.el('div', { class: 'editor-status' });
      const barraFerr = CE.el('div', { class: 'vt-ferramentas' });
      const guardar = () => { historico.push(JSON.stringify(doc)); if (historico.length > 50) historico.shift(); modificado = true; };
      const forma = () => doc.formas.find((f) => f.id === selecionada) || null;
      const el = (tag, attrs) => { const e = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => { if (v != null) e.setAttribute(k, v); }); return e; };
      const pontosEstrela = (f) => {
        const cx = f.x + f.w / 2, cy = f.y + f.h / 2, R = Math.min(f.w, f.h) / 2, r = R * 0.45;
        return Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5; const raio = i % 2 ? r : R; return `${(cx + raio * Math.cos(a)).toFixed(1)},${(cy + raio * Math.sin(a)).toFixed(1)}`; }).join(' ');
      };
      // Desenha uma forma em SVG (também usado para exportar).
      function elementoDe(f) {
        const comum = { 'data-forma': f.id, 'data-tipo': f.tipo, fill: f.preenchimento, stroke: f.contorno, 'stroke-width': f.espessura, opacity: f.opacidade == null ? 1 : f.opacidade };
        if (f.tipo === 'ret') return el('rect', { ...comum, x: f.x, y: f.y, width: f.w, height: f.h, rx: f.raio || 0 });
        if (f.tipo === 'elipse') return el('ellipse', { ...comum, cx: f.x + f.w / 2, cy: f.y + f.h / 2, rx: Math.abs(f.w / 2), ry: Math.abs(f.h / 2) });
        if (f.tipo === 'estrela') return el('polygon', { ...comum, points: pontosEstrela(f) });
        if (f.tipo === 'linha' || f.tipo === 'seta') {
          const g = el('g', { 'data-forma': f.id, 'data-tipo': f.tipo, opacity: comum.opacity });
          g.append(el('line', { x1: f.x, y1: f.y, x2: f.x + f.w, y2: f.y + f.h, stroke: f.contorno, 'stroke-width': f.espessura, 'stroke-linecap': 'round' }));
          if (f.tipo === 'seta') {
            const ang = Math.atan2(f.h, f.w), tam = 14 + f.espessura * 3, x2 = f.x + f.w, y2 = f.y + f.h;
            const p = [[x2, y2], [x2 - tam * Math.cos(ang - 0.45), y2 - tam * Math.sin(ang - 0.45)], [x2 - tam * Math.cos(ang + 0.45), y2 - tam * Math.sin(ang + 0.45)]];
            g.append(el('polygon', { points: p.map((q) => q.join(',')).join(' '), fill: f.contorno }));
          }
          // Faixa invisível mais grossa para facilitar o clique na linha.
          g.append(el('line', { x1: f.x, y1: f.y, x2: f.x + f.w, y2: f.y + f.h, stroke: 'transparent', 'stroke-width': Math.max(18, f.espessura + 12) }));
          return g;
        }
        const t = el('text', { ...comum, stroke: null, 'stroke-width': null, x: f.x, y: f.y, 'font-size': f.tamanho, 'font-family': f.fonte || 'Arial', 'font-weight': f.negrito ? 'bold' : 'normal',
          'text-anchor': f.alinhar === 'meio' ? 'middle' : 'start', 'dominant-baseline': 'hanging' });
        t.textContent = f.texto;
        return t;
      }
      function desenhar() {
        svg.setAttribute('viewBox', `0 0 ${larg()} ${alt()}`);
        const escala = Math.min((area.clientWidth - 30) / larg(), (area.clientHeight - 30) / alt()) || 0.5;
        svg.style.width = Math.round(larg() * escala * zoom) + 'px';
        svg.style.height = Math.round(alt() * escala * zoom) + 'px';
        svg.replaceChildren(el('rect', { x: 0, y: 0, width: larg(), height: alt(), fill: '#ffffff', 'data-fundo': '' }), ...doc.formas.map(elementoDe));
        const f = forma();
        if (f) {
          const alvo = svg.querySelector(`[data-forma="${f.id}"]`);
          const b = alvo.getBBox();
          svg.append(el('rect', { x: b.x - 6, y: b.y - 6, width: b.width + 12, height: b.height + 12, fill: 'none', stroke: '#0b84ff', 'stroke-width': 3 / escala / zoom, 'stroke-dasharray': `${8 / escala / zoom}`, 'pointer-events': 'none', 'data-selecao': '' }));
          if (f.tipo !== 'texto') { const h = 14 / escala / zoom; svg.append(el('rect', { x: b.x + b.width + 6 - h / 2, y: b.y + b.height + 6 - h / 2, width: h, height: h, fill: '#0b84ff', 'data-alca': '', style: 'cursor:nwse-resize' })); }
        }
        barraFerr.replaceChildren(...FERRAMENTAS.map(([idF, icone, dica]) => CE.el('button', { class: 'vt-ferramenta' + (ferramenta === idF ? ' ligada' : ''), 'data-ferramenta': idF, title: dica,
          onclick: () => { ferramenta = idF; desenhar(); CE.emitir('vetor:ferramenta', { ferramenta: idF }); } }, icone)));
        propriedades.replaceChildren(...painel());
        status.textContent = `${nomeArquivo || 'Desenho sem nome'}${modificado ? ' (não salvo)' : ''} · ${PAGINAS[doc.pagina][2]} · ${doc.formas.length} forma(s) · zoom ${Math.round(zoom * 100)}%`;
        janela.definirTitulo(nomeArquivo || 'Desenho sem nome');
      }
      function painel() {
        const f = forma();
        if (!f) return [CE.el('h4', {}, 'Propriedades'), CE.el('p', { class: 'ft-dica' }, 'Escolha uma ferramenta à esquerda e arraste na página para desenhar. Para mudar uma forma, use a seta ➚ e clique nela.')];
        const mudar = (prop, valor, evento = true) => { guardar(); f[prop] = valor; desenhar(); if (evento) CE.emitir('vetor:propriedade', { prop, valor, tipo: f.tipo }); };
        const cor = (prop, rotulo) => CE.el('label', { class: 'ft-ajuste' }, rotulo, CE.el('input', { type: 'color', value: f[prop] || '#000000', 'data-prop': prop, onchange: (e) => mudar(prop, e.target.value) }));
        const numero = (prop, rotulo, min, max) => CE.el('label', { class: 'ft-ajuste' }, rotulo, CE.el('input', { type: 'number', class: 'campo pequeno', min: String(min), max: String(max), value: String(Math.round(f[prop] || 0)), 'data-prop': prop, onchange: (e) => mudar(prop, Number(e.target.value)) }));
        const partes = [CE.el('h4', {}, `Propriedades: ${{ ret: 'retângulo', elipse: 'elipse', estrela: 'estrela', linha: 'linha', seta: 'seta', texto: 'texto' }[f.tipo]}`)];
        if (f.tipo === 'texto') {
          partes.push(CE.el('label', { class: 'ft-ajuste' }, 'Texto', CE.el('input', { class: 'campo', value: f.texto, 'data-prop': 'texto', onchange: (e) => mudar('texto', e.target.value) })),
            numero('tamanho', 'Tamanho da letra', 8, 400), cor('preenchimento', 'Cor da letra'),
            CE.el('label', { class: 'ft-ajuste' }, 'Fonte', CE.el('select', { class: 'campo', 'data-prop': 'fonte', onchange: (e) => mudar('fonte', e.target.value) }, ...FONTES.map((n) => CE.el('option', { value: n, selected: f.fonte === n }, n)))),
            CE.el('label', { class: 'ft-ajuste linha' }, CE.el('input', { type: 'checkbox', checked: !!f.negrito, 'data-prop': 'negrito', onchange: (e) => mudar('negrito', e.target.checked) }), ' Negrito'));
        } else {
          if (f.tipo !== 'linha' && f.tipo !== 'seta') partes.push(cor('preenchimento', 'Cor de dentro (preenchimento)'));
          partes.push(cor('contorno', f.tipo === 'linha' || f.tipo === 'seta' ? 'Cor da linha' : 'Cor da borda (contorno)'), numero('espessura', 'Espessura da borda', 0, 60), numero('w', 'Largura', 1, 3000), numero('h', 'Altura', 1, 3000));
        }
        partes.push(CE.el('label', { class: 'ft-ajuste' }, `Transparência: ${Math.round((1 - (f.opacidade == null ? 1 : f.opacidade)) * 100)}%`,
          CE.el('input', { type: 'range', min: '0.1', max: '1', step: '0.1', value: String(f.opacidade == null ? 1 : f.opacidade), 'data-prop': 'opacidade', onchange: (e) => mudar('opacidade', Number(e.target.value)) })));
        const acao = (cmd, rotulo, dica, fn) => CE.el('button', { class: 'botao secundario pequeno', 'data-vt-acao': cmd, title: dica, onclick: fn }, rotulo);
        partes.push(CE.el('h4', {}, 'Organizar'), CE.el('div', { class: 'vt-acoes' },
          acao('frente', '⬆️ Para a frente', 'Trazer para a frente (fica por cima das outras)', () => ordem('frente')),
          acao('tras', '⬇️ Para trás', 'Enviar para trás (fica embaixo das outras)', () => ordem('tras')),
          acao('centralizar', '↔️ Centralizar', 'Centralizar na página (na horizontal)', centralizar),
          acao('duplicar', '🗐 Duplicar', 'Fazer uma cópia (Ctrl+D)', duplicar),
          acao('apagar', '🗑️ Apagar', 'Apagar (Delete)', apagar)));
        return partes;
      }

      // ---------- Ações ----------
      function ordem(acao) {
        const f = forma(); if (!f) return;
        guardar();
        doc.formas = doc.formas.filter((x) => x !== f);
        if (acao === 'frente') doc.formas.push(f); else doc.formas.unshift(f);
        desenhar(); CE.emitir('vetor:ordem', { acao, tipo: f.tipo, posicao: doc.formas.indexOf(f), total: doc.formas.length });
      }
      function centralizar() {
        const f = forma(); if (!f) return;
        guardar();
        if (f.tipo === 'texto') { f.alinhar = 'meio'; f.x = larg() / 2; } else f.x = Math.round((larg() - f.w) / 2);
        desenhar(); CE.emitir('vetor:alinhado', { tipo: f.tipo });
      }
      function duplicar() {
        const f = forma(); if (!f) return;
        guardar();
        const copia = { ...JSON.parse(JSON.stringify(f)), id: id(), x: f.x + 30, y: f.y + 30 };
        doc.formas.push(copia); selecionada = copia.id;
        desenhar(); CE.emitir('vetor:duplicado', { tipo: f.tipo, total: doc.formas.length });
      }
      function apagar() {
        const f = forma(); if (!f) return;
        guardar();
        doc.formas = doc.formas.filter((x) => x !== f); selecionada = null;
        desenhar(); CE.emitir('vetor:apagado', { tipo: f.tipo, total: doc.formas.length });
      }
      function desfazer() { if (!historico.length) return; doc = JSON.parse(historico.pop()); if (!forma()) selecionada = null; desenhar(); CE.emitir('vetor:desfeito'); }

      // ---------- Mouse na página ----------
      const ponto = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const r = p.matrixTransform(svg.getScreenCTM().inverse()); return { x: Math.round(r.x), y: Math.round(r.y) }; };
      let arrasto = null;
      svg.addEventListener('pointerdown', async (e) => {
        if (e.button !== 0) return;
        const p = ponto(e);
        if (ferramenta === 'texto') {
          const texto = await CE.perguntar('🔤 Escreva o texto:', '');
          if (!texto) return;
          guardar();
          const f = { id: id(), tipo: 'texto', x: p.x, y: p.y, texto, tamanho: Math.round(alt() / 14), fonte: 'Arial', preenchimento: '#1f3a5f', negrito: true, opacidade: 1 };
          doc.formas.push(f); selecionada = f.id; ferramenta = 'selecionar';
          desenhar(); CE.emitir('vetor:forma', { tipo: 'texto', texto, total: doc.formas.length });
          return;
        }
        if (ferramenta === 'selecionar') {
          if (e.target.closest('[data-alca]')) { const f = forma(); guardar(); arrasto = { tipo: 'alca', inicio: p, w: f.w, h: f.h }; svg.setPointerCapture(e.pointerId); return; }
          const alvo = e.target.closest('[data-forma]');
          selecionada = alvo ? alvo.dataset.forma : null;
          if (alvo) { const f = forma(); guardar(); arrasto = { tipo: 'mover', inicio: p, x: f.x, y: f.y, moveu: false }; svg.setPointerCapture(e.pointerId); CE.emitir('vetor:selecionado', { tipo: f.tipo }); }
          desenhar();
          return;
        }
        guardar();
        const f = { id: id(), tipo: ferramenta, x: p.x, y: p.y, w: 1, h: 1, ...PADRAO, preenchimento: ferramenta === 'estrela' ? '#f1c40f' : PADRAO.preenchimento };
        doc.formas.push(f); selecionada = f.id;
        arrasto = { tipo: 'nova', inicio: p, forma: f };
        svg.setPointerCapture(e.pointerId);
        desenhar();
      });
      svg.addEventListener('pointermove', (e) => {
        if (!arrasto) return;
        const p = ponto(e), dx = p.x - arrasto.inicio.x, dy = p.y - arrasto.inicio.y;
        const f = arrasto.tipo === 'nova' ? arrasto.forma : forma();
        if (!f) return;
        if (arrasto.tipo === 'mover') { f.x = arrasto.x + dx; f.y = arrasto.y + dy; arrasto.moveu = arrasto.moveu || Math.abs(dx) + Math.abs(dy) > 3; }
        else if (arrasto.tipo === 'alca') { f.w = Math.max(10, arrasto.w + dx); f.h = Math.max(10, arrasto.h + dy); arrasto.moveu = true; }
        else if (f.tipo === 'linha' || f.tipo === 'seta') { f.w = dx; f.h = dy; }
        else { f.x = Math.min(arrasto.inicio.x, p.x); f.y = Math.min(arrasto.inicio.y, p.y); f.w = Math.abs(dx); f.h = Math.abs(dy); }
        desenhar();
      });
      svg.addEventListener('pointerup', () => {
        if (!arrasto) return;
        const a = arrasto; arrasto = null;
        const f = a.tipo === 'nova' ? a.forma : forma();
        if (a.tipo === 'nova') {
          if (Math.abs(f.w) < 8 && Math.abs(f.h) < 8) { const t = Math.round(Math.min(larg(), alt()) / 5); f.w = f.tipo === 'linha' || f.tipo === 'seta' ? t : t; f.h = f.tipo === 'linha' || f.tipo === 'seta' ? 0 : t * (f.tipo === 'ret' ? 0.6 : 1); }
          ferramenta = 'selecionar';
          desenhar();
          CE.emitir('vetor:forma', { tipo: f.tipo, total: doc.formas.length });
        } else if (a.tipo === 'mover' && a.moveu) CE.emitir('vetor:movido', { tipo: f.tipo, x: f.x, y: f.y });
        else if (a.tipo === 'mover') historico.pop(); // só clicou: não mudou nada
        else if (a.tipo === 'alca') CE.emitir('vetor:redimensionado', { tipo: f.tipo, w: f.w, h: f.h });
      });
      corpo.addEventListener('keydown', (e) => {
        if (e.target.closest('input, select, textarea')) return;
        const ctrl = e.ctrlKey || e.metaKey;
        if (e.key === 'Delete') { e.preventDefault(); apagar(); }
        else if (ctrl && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicar(); }
        else if (ctrl && e.key.toLowerCase() === 'z') { e.preventDefault(); desfazer(); }
        else if (ctrl && e.key.toLowerCase() === 's') { e.preventDefault(); salvar(); }
        else if (forma() && e.key.startsWith('Arrow')) {
          e.preventDefault(); guardar();
          const f = forma(), passo = e.shiftKey ? 20 : 5;
          if (e.key === 'ArrowLeft') f.x -= passo; if (e.key === 'ArrowRight') f.x += passo; if (e.key === 'ArrowUp') f.y -= passo; if (e.key === 'ArrowDown') f.y += passo;
          desenhar(); CE.emitir('vetor:movido', { tipo: f.tipo, teclado: true });
        }
      });

      // ---------- Arquivo ----------
      async function novo(pagina = 'post', modelo = null) {
        if (modificado && doc.formas.length && !await CE.confirmar('Começar um desenho novo? O que não foi salvo vai ser perdido.')) return;
        const m = modelo ? MODELOS[modelo] : null;
        doc = { pagina: m ? m.pagina : pagina, formas: m ? m.formas().map((f) => ({ opacidade: 1, ...f, id: id() })) : [] };
        nomeArquivo = null; modificado = false; historico = []; selecionada = null; zoom = 1;
        desenhar();
        CE.emitir(modelo ? 'vetor:modelo' : 'vetor:pagina', { modelo, pagina: doc.pagina, tamanho: PAGINAS[doc.pagina][2] });
      }
      function menuNovo() {
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo' },
          CE.el('p', {}, '📄 Desenho novo: escolha o tamanho da página ou um modelo pronto.'),
          CE.el('strong', {}, 'Página em branco'),
          CE.el('div', { class: 'pl-opcoes-coluna' }, ...Object.entries(PAGINAS).map(([k, [, , n]]) => CE.el('button', { class: 'botao secundario', 'data-pagina': k, onclick: () => { fundo.remove(); novo(k); } }, n))),
          CE.el('strong', {}, 'Modelos prontos (é só trocar os textos)'),
          CE.el('div', { class: 'pl-opcoes-coluna' }, ...Object.entries(MODELOS).map(([k, m]) => CE.el('button', { class: 'botao secundario', 'data-modelo-vetor': k, onclick: () => { fundo.remove(); novo(null, k); } }, m.nome))),
          CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'))));
        document.body.append(fundo);
      }
      async function salvar() {
        let n = nomeArquivo;
        if (!n) { n = await CE.perguntar('Nome do desenho:', 'Meu cartaz'); if (!n) return false; }
        await CE.sessao.salvarArquivo({ nome: n, tipo: 'vetor', conteudo: JSON.stringify(doc) });
        nomeArquivo = n; modificado = false; desenhar();
        CE.avisar(`✒️ Desenho "${n}" salvo. Dá para abrir de novo e mudar qualquer coisa.`);
        return true;
      }
      // Exportar: vira uma imagem comum (PNG), para pôr no Editor, na Apresentação, no e-mail ou imprimir.
      async function exportar() {
        const n = await CE.perguntar('Nome da imagem (PNG):', nomeArquivo || 'Meu cartaz');
        if (!n) return;
        const limpo = document.createElementNS(NS, 'svg');
        limpo.setAttribute('xmlns', NS); limpo.setAttribute('viewBox', `0 0 ${larg()} ${alt()}`); limpo.setAttribute('width', larg()); limpo.setAttribute('height', alt());
        limpo.append(el('rect', { x: 0, y: 0, width: larg(), height: alt(), fill: '#ffffff' }), ...doc.formas.map(elementoDe));
        const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(limpo));
        try {
          const img = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => erro(new Error('Não consegui exportar.')); i.src = src; });
          const fator = Math.min(1, 1200 / Math.max(larg(), alt()));
          const c = document.createElement('canvas'); c.width = Math.round(larg() * fator); c.height = Math.round(alt() * fator);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          await CE.sessao.salvarArquivo({ nome: n, tipo: 'imagem', conteudo: c.toDataURL('image/png') });
          CE.emitir('vetor:exportado', { nome: n, largura: c.width, altura: c.height, formas: doc.formas.length });
          CE.avisar(`🖼️ Imagem "${n}" salva em Meus Documentos. Ela pode ir para o Editor, a Apresentação ou o e-mail.`);
        } catch (e) { CE.avisar('⚠️ ' + e.message); }
      }
      function carregar(arquivo) {
        try { doc = JSON.parse(arquivo.conteudo || '{}'); } catch { doc = {}; }
        doc = { pagina: PAGINAS[doc.pagina] ? doc.pagina : 'post', formas: Array.isArray(doc.formas) ? doc.formas : [] };
        nomeArquivo = arquivo.nome; modificado = false; historico = []; selecionada = null; zoom = 1;
        desenhar();
        CE.emitir('arquivo:aberto', { nome: arquivo.nome, tipo: 'vetor' });
      }
      async function abrirDesenho() {
        const vale = CE.sessao.marca();
        const meus = (await CE.sessao.arquivos()).filter((a) => a.tipo === 'vetor' && !a.naLixeira);
        if (!vale()) return;
        if (!meus.length) { CE.avisar('Você ainda não salvou nenhum desenho vetorial.'); return; }
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo' }, CE.el('p', {}, '📂 Abrir desenho:'),
          CE.el('div', { class: 'pl-opcoes-coluna' }, ...meus.map((a) => CE.el('button', { class: 'botao secundario', 'data-abrir-vetor': a.nome, onclick: () => { fundo.remove(); carregar(a); } }, `✒️ ${a.nome}`))),
          CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'))));
        document.body.append(fundo);
      }
      const seletorZoom = CE.el('select', { class: 'ferramenta-select', 'data-comando': 'zoom', title: 'Zoom (aproximar)', onchange: (e) => { zoom = Number(e.target.value); desenhar(); CE.emitir('vetor:zoom', { zoom }); } },
        ...[[1, '🔍 100%'], [2, '🔍 200%'], [4, '🔍 400%']].map(([v, r]) => CE.el('option', { value: String(v) }, r)));
      const fb = (cmd, rotulo, dica, f) => CE.el('button', { class: 'ferramenta texto', 'data-comando': cmd, title: dica, onclick: f }, rotulo);
      corpo.classList.add('vetorial-app');
      corpo.tabIndex = 0;
      corpo.append(
        CE.el('div', { class: 'ferramentas' },
          CE.el('div', { class: 'ferramentas-grupo' }, fb('novo', '📄 Novo ▾', 'Página nova ou modelo pronto', menuNovo), fb('abrir', '📂 Abrir', 'Abrir um desenho salvo', abrirDesenho),
            fb('salvar', '💾 Salvar', 'Salvar o desenho (dá para mudar depois)', () => salvar()), fb('exportar', '🖼️ Exportar PNG', 'Salvar como imagem (para imprimir ou mandar)', exportar)),
          CE.el('div', { class: 'ferramentas-grupo' }, fb('desfazer', '↶', 'Desfazer (Ctrl+Z)', desfazer), seletorZoom)),
        CE.el('div', { class: 'vt-principal' }, barraFerr, area, propriedades), status);
      const observador = new ResizeObserver(() => desenhar());
      observador.observe(area);
      if (argumento && argumento.arquivo) carregar(argumento.arquivo); else desenhar();
      const api = { formas: () => JSON.parse(JSON.stringify(doc.formas)), pagina: () => doc.pagina, zoom: () => zoom, selecionada: () => (forma() ? { ...forma() } : null), nome: () => nomeArquivo };
      CE.vetorAtivo = api;
      return {
        receber(arg) { if (arg && arg.arquivo) carregar(arg.arquivo); },
        aoFechar() { observador.disconnect(); if (CE.vetorAtivo === api) CE.vetorAtivo = null; return true; },
      };
    },
  });
})();
