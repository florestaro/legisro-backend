// Desenho (parecido com o Paint): lápis, borracha, formas, balde de tinta, cores, desfazer, salvar e abrir.
(function () {
  const CORES = ['#000000', '#7f7f7f', '#ffffff', '#e81123', '#ff8c00', '#ffb900', '#107c10', '#00b7c3', '#0067c0', '#5c2d91', '#e3008c', '#8e562e'];
  const FERRAMENTAS = [
    ['lapis', '✏️', 'Lápis'], ['borracha', '🧽', 'Borracha'], ['linha', '📏', 'Linha'],
    ['retangulo', '⬛', 'Retângulo'], ['circulo', '⚪', 'Círculo'], ['balde', '🪣', 'Balde de tinta (pinta uma área)'],
  ];
  const NOMES_CORES = { '#000000': 'preto', '#7f7f7f': 'cinza', '#ffffff': 'branco', '#e81123': 'vermelho', '#ff8c00': 'laranja', '#ffb900': 'amarelo', '#107c10': 'verde', '#00b7c3': 'azul-claro', '#0067c0': 'azul', '#5c2d91': 'roxo', '#e3008c': 'rosa', '#8e562e': 'marrom' };

  CE.registrarApp({
    id: 'desenho',
    nome: 'Desenho',
    icone: '🎨',
    largura: 920,
    altura: 640,
    abrir(corpo, janela, argumento) {
      // Como no Paint: o botão esquerdo pinta com a Cor 1 e o botão direito com a Cor 2.
      let ferramenta = 'lapis', cor = '#000000', cor2 = '#ffffff', corDoTraco = cor, espessura = 4, nomeArquivo = null, modificado = false;
      const historico = [];
      let amostras = null; // as duas cores atuais (Cor 1 e Cor 2), na barra de ferramentas
      const tela = CE.el('canvas', { class: 'ds-tela', width: 820, height: 470, 'aria-label': 'Área de desenho' });
      const ctx = tela.getContext('2d', { willReadFrequently: true });
      const status = CE.el('div', { class: 'editor-status' });

      function limparTela() { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, tela.width, tela.height); }
      limparTela();

      function atualizarStatus() {
        status.textContent = `${nomeArquivo || 'Desenho sem nome'}${modificado ? ' (não salvo)' : ''} · Ferramenta: ${FERRAMENTAS.find((f) => f[0] === ferramenta)[2]} · Cor 1: ${NOMES_CORES[cor] || cor} · Cor 2: ${NOMES_CORES[cor2] || cor2}`;
        if (amostras) { amostras.c1.style.background = cor; amostras.c2.style.background = cor2; }
        janela.definirTitulo(nomeArquivo || 'Desenho sem nome');
      }

      function guardarEstado() {
        historico.push(ctx.getImageData(0, 0, tela.width, tela.height));
        if (historico.length > 25) historico.shift();
      }

      function ponto(e) {
        const r = tela.getBoundingClientRect();
        return { x: ((e.clientX - r.left) * tela.width) / r.width, y: ((e.clientY - r.top) * tela.height) / r.height };
      }

      function pintarArea(x, y) {
        const imagem = ctx.getImageData(0, 0, tela.width, tela.height);
        const d = imagem.data, L = tela.width, A = tela.height;
        const i0 = (Math.floor(y) * L + Math.floor(x)) * 4;
        const alvo = [d[i0], d[i0 + 1], d[i0 + 2]];
        const nova = [parseInt(corDoTraco.slice(1, 3), 16), parseInt(corDoTraco.slice(3, 5), 16), parseInt(corDoTraco.slice(5, 7), 16)];
        if (alvo.every((v, k) => Math.abs(v - nova[k]) < 8)) return;
        const parecido = (i) => Math.abs(d[i] - alvo[0]) < 40 && Math.abs(d[i + 1] - alvo[1]) < 40 && Math.abs(d[i + 2] - alvo[2]) < 40;
        const pilha = [[Math.floor(x), Math.floor(y)]];
        while (pilha.length) {
          const [px, py] = pilha.pop();
          let xi = px;
          while (xi >= 0 && parecido((py * L + xi) * 4)) xi--;
          xi++;
          let acima = false, abaixo = false;
          for (; xi < L && parecido((py * L + xi) * 4); xi++) {
            const i = (py * L + xi) * 4;
            d[i] = nova[0]; d[i + 1] = nova[1]; d[i + 2] = nova[2]; d[i + 3] = 255;
            if (py > 0) { const s = parecido(((py - 1) * L + xi) * 4); if (s && !acima) pilha.push([xi, py - 1]); acima = s; }
            if (py < A - 1) { const s = parecido(((py + 1) * L + xi) * 4); if (s && !abaixo) pilha.push([xi, py + 1]); abaixo = s; }
          }
        }
        ctx.putImageData(imagem, 0, 0);
      }

      let inicio = null, antes = null, distancia = 0;
      let botaoDoTraco = 'esquerdo';
      tela.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.button !== 2) return;
        tela.setPointerCapture(e.pointerId);
        guardarEstado();
        botaoDoTraco = e.button === 2 ? 'direito' : 'esquerdo';
        corDoTraco = e.button === 2 ? cor2 : cor;
        inicio = ponto(e);
        distancia = 0;
        if (ferramenta === 'balde') {
          pintarArea(inicio.x, inicio.y);
          modificado = true; atualizarStatus();
          CE.emitir('desenho:balde', { cor: NOMES_CORES[corDoTraco], botao: botaoDoTraco });
          inicio = null;
          return;
        }
        antes = ctx.getImageData(0, 0, tela.width, tela.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(inicio.x, inicio.y);
      });
      tela.addEventListener('pointermove', (e) => {
        if (!inicio) return;
        const p = ponto(e);
        ctx.strokeStyle = ferramenta === 'borracha' ? '#ffffff' : corDoTraco;
        ctx.lineWidth = ferramenta === 'borracha' ? espessura * 4 : espessura;
        if (ferramenta === 'lapis' || ferramenta === 'borracha') {
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          distancia += 1;
          return;
        }
        ctx.putImageData(antes, 0, 0);
        ctx.beginPath();
        if (ferramenta === 'linha') { ctx.moveTo(inicio.x, inicio.y); ctx.lineTo(p.x, p.y); }
        if (ferramenta === 'retangulo') ctx.rect(inicio.x, inicio.y, p.x - inicio.x, p.y - inicio.y);
        if (ferramenta === 'circulo') ctx.ellipse((inicio.x + p.x) / 2, (inicio.y + p.y) / 2, Math.abs(p.x - inicio.x) / 2, Math.abs(p.y - inicio.y) / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        distancia = Math.hypot(p.x - inicio.x, p.y - inicio.y);
      });
      tela.addEventListener('pointerup', () => {
        if (!inicio) return;
        inicio = null;
        if (distancia < 3) { historico.pop(); return; }
        modificado = true;
        atualizarStatus();
        if (ferramenta === 'lapis' || ferramenta === 'borracha') CE.emitir('desenho:traco', { ferramenta, cor: NOMES_CORES[corDoTraco], botao: botaoDoTraco });
        else CE.emitir('desenho:forma', { forma: ferramenta, cor: NOMES_CORES[corDoTraco], botao: botaoDoTraco });
      });

      async function salvar() {
        let nome = nomeArquivo;
        if (!nome) {
          nome = await CE.perguntar('Qual o nome do desenho?', 'Meu desenho');
          if (!nome) return false;
        }
        await CE.sessao.salvarArquivo({ nome, tipo: 'imagem', conteudo: tela.toDataURL('image/png') });
        nomeArquivo = nome;
        modificado = false;
        atualizarStatus();
        CE.avisar(`Desenho "${nome}" salvo!`);
        return true;
      }

      function carregar(arquivo) {
        const img = new Image();
        img.onload = () => { limparTela(); ctx.drawImage(img, 0, 0); historico.length = 0; };
        img.src = arquivo.conteudo;
        nomeArquivo = arquivo.nome;
        modificado = false;
        atualizarStatus();
        CE.emitir('arquivo:aberto', { nome: arquivo.nome, tipo: 'imagem' });
      }

      const botoesFerramenta = FERRAMENTAS.map(([id, icone, nome]) => CE.el('button', {
        class: 'ferramenta ds-ferramenta' + (id === ferramenta ? ' ligado' : ''), 'data-ferramenta': id, title: nome,
        onclick: () => {
          ferramenta = id;
          botoesFerramenta.forEach((b) => b.classList.toggle('ligado', b.dataset.ferramenta === id));
          atualizarStatus();
          CE.emitir('desenho:ferramenta', { ferramenta: id });
        },
      }, icone));
      const paleta = CORES.map((c) => CE.el('button', {
        class: 'ds-cor' + (c === cor ? ' ligado' : ''), 'data-cor': NOMES_CORES[c], title: `${NOMES_CORES[c]} (clique: Cor 1 · botão direito: Cor 2)`, style: `background:${c}`,
        onclick: () => {
          cor = c;
          paleta.forEach((b) => b.classList.toggle('ligado', b.dataset.cor === NOMES_CORES[c]));
          atualizarStatus();
          CE.emitir('desenho:cor', { cor: NOMES_CORES[c] });
        },
        oncontextmenu: (e) => {
          e.preventDefault();
          cor2 = c;
          atualizarStatus();
          CE.emitir('desenho:cor2', { cor: NOMES_CORES[c] });
        },
      }));
      amostras = { c1: CE.el('span', { class: 'ds-amostra', 'data-amostra': '1' }), c2: CE.el('span', { class: 'ds-amostra', 'data-amostra': '2' }) };
      const caixaCores = CE.el('div', { class: 'ds-cores-atuais', title: 'Cor 1 (botão esquerdo) e Cor 2 (botão direito)' },
        CE.el('label', {}, amostras.c1, 'Cor 1'), CE.el('label', {}, amostras.c2, 'Cor 2'));
      const tamanho = CE.el('select', { class: 'ferramenta-select pequeno', 'data-comando': 'espessura', title: 'Grossura do traço', onchange: (e) => { espessura = Number(e.target.value); CE.emitir('desenho:espessura', { espessura }); } },
        ...[['2', 'Fino'], ['4', 'Médio'], ['10', 'Grosso'], ['20', 'Muito grosso']].map(([v, r]) => CE.el('option', { value: v, selected: v === '4' }, r)));
      tamanho.style.width = '120px';

      corpo.classList.add('desenho');
      corpo.append(
        CE.el('div', { class: 'ferramentas' },
          CE.el('div', { class: 'ferramentas-grupo' },
            CE.el('button', { class: 'ferramenta texto', 'data-comando': 'novo', onclick: async () => {
              if (modificado && !await CE.confirmar('Começar um desenho novo? O atual não foi salvo.')) return;
              guardarEstado(); limparTela(); nomeArquivo = null; modificado = false; atualizarStatus(); CE.emitir('desenho:limpo');
            } }, '📄 Novo'),
            CE.el('button', { class: 'ferramenta texto', 'data-comando': 'abrir', onclick: () => CE.janelas.abrir('arquivos') }, '📂 Abrir'),
            CE.el('button', { class: 'ferramenta texto', 'data-comando': 'salvar', onclick: salvar }, '💾 Salvar'),
            CE.el('button', { class: 'ferramenta', 'data-comando': 'desfazer', title: 'Desfazer', onclick: () => {
              const estado = historico.pop();
              if (estado) { ctx.putImageData(estado, 0, 0); CE.emitir('desenho:desfeito'); }
            } }, '↶'),
          ),
          CE.el('div', { class: 'ferramentas-grupo' }, ...botoesFerramenta),
          CE.el('div', { class: 'ferramentas-grupo' }, tamanho),
          CE.el('div', { class: 'ferramentas-grupo' }, caixaCores),
          CE.el('div', { class: 'ferramentas-grupo ds-paleta' }, ...paleta),
        ),
        CE.el('div', { class: 'ds-fundo' }, tela),
        status,
      );
      atualizarStatus();
      if (argumento && argumento.arquivo) carregar(argumento.arquivo);
      return {
        receber(arg) { if (arg && arg.arquivo) carregar(arg.arquivo); },
      };
    },
  });
})();
