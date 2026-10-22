// Planilha (parecida com o Excel): células, fórmulas em português, AutoSoma, formatação de números,
// cores, alça de preenchimento (arrastar para copiar), largura de coluna, desfazer, salvar e abrir.
(function () {
  const F = CE.formulas;
  const COLUNAS = 26, LINHAS = 60, LARGURA = 96;
  const FUNCOES_MENU = [
    ['SOMA', 'Soma os números', '=SOMA('], ['MÉDIA', 'Média dos números', '=MÉDIA('], ['MÁXIMO', 'Maior número', '=MÁXIMO('],
    ['MÍNIMO', 'Menor número', '=MÍNIMO('], ['SE', 'Escolhe um resultado conforme uma condição', '=SE('], ['CONT.SE', 'Conta as células que atendem a uma condição', '=CONT.SE('],
  ];

  CE.registrarApp({
    id: 'planilha',
    nome: 'Planilha',
    icone: '📊',
    largura: 980,
    altura: 620,
    abrir(corpo, janela, argumento) {
      let dados = { celulas: {}, larguras: {} };
      let nomeArquivo = null, modificado = false, podeFechar = false, aviso = null;
      let ativa = 'A1', ancora = 'A1', fim = 'A1';
      let editando = null; // { ref, campo, origem }
      let calculo = { valores: {} };
      let desfazer = [], refazer = [];
      let areaCopia = null; // { celulas: {ref: celula}, de: 'A1' }

      const entradaDe = (ref) => (dados.celulas[ref] && dados.celulas[ref].v) || '';
      const formatoDe = (ref) => (dados.celulas[ref] && dados.celulas[ref].f) || {};
      const valorDe = (ref) => (ref in calculo.valores ? calculo.valores[ref] : '');
      const posicao = (ref) => F.lerEndereco(ref);
      const faixa = () => {
        const a = posicao(ancora), b = posicao(fim);
        return { c1: Math.min(a.col, b.col), c2: Math.max(a.col, b.col), l1: Math.min(a.lin, b.lin), l2: Math.max(a.lin, b.lin) };
      };
      const celulasDaSelecao = () => F.celulasDoIntervalo(ancora, fim);
      const nomeSelecao = () => (ancora === fim ? ancora : `${F.endereco(faixa().c1, faixa().l1)}:${F.endereco(faixa().c2, faixa().l2)}`);

      // ---------- Tela ----------
      const caixaNome = CE.el('input', { class: 'pl-nome', 'aria-label': 'Célula selecionada', value: 'A1' });
      const barraFormula = CE.el('input', { class: 'pl-formula', 'aria-label': 'Conteúdo da célula (barra de fórmulas)', spellcheck: 'false', autocomplete: 'off' });
      const status = CE.el('div', { class: 'editor-status pl-status' });
      const tabela = CE.el('table', { class: 'pl-tabela' });
      const grade = CE.el('div', { class: 'pl-grade', tabindex: '0', 'aria-label': 'Grade da planilha' }, tabela);
      const alca = CE.el('div', { class: 'pl-alca', title: 'Arraste para copiar para as células vizinhas' });
      grade.append(alca);

      const colgroup = CE.el('colgroup', {}, CE.el('col', { style: 'width:44px' }), ...Array.from({ length: COLUNAS }, (_, c) => CE.el('col', { 'data-col': c })));
      const cabecalho = CE.el('tr', {}, CE.el('th', { class: 'pl-canto' }),
        ...Array.from({ length: COLUNAS }, (_, c) => CE.el('th', { class: 'pl-cab-col', 'data-coluna': F.numeroParaLetra(c) }, F.numeroParaLetra(c), CE.el('span', { class: 'pl-redim', 'data-redim': c }))));
      const tds = {};
      const corpoTabela = CE.el('tbody', {}, ...Array.from({ length: LINHAS }, (_, l) => CE.el('tr', {},
        CE.el('th', { class: 'pl-cab-lin' }, String(l + 1)),
        ...Array.from({ length: COLUNAS }, (_, c) => {
          const ref = F.endereco(c, l);
          return (tds[ref] = CE.el('td', { 'data-celula': ref }));
        }))));
      tabela.append(colgroup, CE.el('thead', {}, cabecalho), corpoTabela);

      function aplicarLarguras() {
        let total = 44;
        colgroup.querySelectorAll('col[data-col]').forEach((col) => {
          const largura = dados.larguras[F.numeroParaLetra(Number(col.dataset.col))] || LARGURA;
          col.style.width = largura + 'px';
          total += largura;
        });
        tabela.style.width = total + 'px';
      }

      function recalcular() {
        const entradas = {};
        Object.entries(dados.celulas).forEach(([r, c]) => { if (c.v !== '' && c.v != null) entradas[r] = c.v; });
        calculo = F.calcularTudo(entradas);
        Object.entries(tds).forEach(([ref, td]) => {
          const c = dados.celulas[ref];
          const v = valorDe(ref);
          const f = (c && c.f) || {};
          td.textContent = F.textoDe(v, f.formato);
          td.className = (typeof v === 'number' ? 'numero' : '') + (F.ehErro(v) ? ' erro' : '');
          td.style.fontWeight = f.negrito ? '700' : '';
          td.style.fontStyle = f.italico ? 'italic' : '';
          td.style.color = f.cor || '';
          td.style.background = f.fundo || '';
          td.style.textAlign = f.alinhar || '';
        });
        pintarSelecao();
      }

      function pintarSelecao() {
        corpoTabela.querySelectorAll('.selecionada, .ativa').forEach((td) => td.classList.remove('selecionada', 'ativa'));
        cabecalho.querySelectorAll('.marcada').forEach((th) => th.classList.remove('marcada'));
        corpoTabela.querySelectorAll('th.marcada').forEach((th) => th.classList.remove('marcada'));
        const r = faixa();
        celulasDaSelecao().forEach((ref) => tds[ref].classList.add('selecionada'));
        tds[ativa].classList.add('ativa');
        for (let c = r.c1; c <= r.c2; c++) cabecalho.children[c + 1].classList.add('marcada');
        for (let l = r.l1; l <= r.l2; l++) corpoTabela.children[l].firstChild.classList.add('marcada');
        caixaNome.value = nomeSelecao();
        if (!editando || editando.origem !== 'barra') barraFormula.value = entradaDe(ativa);
        // Alça de preenchimento no canto de baixo à direita da seleção.
        const ultima = tds[F.endereco(r.c2, r.l2)];
        alca.style.left = ultima.offsetLeft + ultima.offsetWidth - 5 + 'px';
        alca.style.top = ultima.offsetTop + ultima.offsetHeight - 5 + 'px';
        const nums = celulasDaSelecao().map(valorDe).filter((v) => typeof v === 'number');
        status.textContent = `${nomeArquivo || 'Planilha sem nome'}${modificado ? ' (não salva)' : ''}` +
          (nums.length > 1 ? ` · Soma: ${F.textoDe(nums.reduce((a, b) => a + b, 0))} · Média: ${F.textoDe(nums.reduce((a, b) => a + b, 0) / nums.length)} · Contagem: ${nums.length}` : '');
        janela.definirTitulo(nomeArquivo || 'Planilha sem nome');
      }

      function mostrarCelula(ref) {
        const td = tds[ref];
        const g = grade;
        if (td.offsetLeft < g.scrollLeft + 44) g.scrollLeft = td.offsetLeft - 44;
        else if (td.offsetLeft + td.offsetWidth > g.scrollLeft + g.clientWidth) g.scrollLeft = td.offsetLeft + td.offsetWidth - g.clientWidth;
        if (td.offsetTop < g.scrollTop + 26) g.scrollTop = td.offsetTop - 26;
        else if (td.offsetTop + td.offsetHeight > g.scrollTop + g.clientHeight) g.scrollTop = td.offsetTop + td.offsetHeight - g.clientHeight;
      }

      function selecionar(ref, estender = false) {
        if (!tds[ref]) return;
        ativa = ref;
        fim = ref;
        if (!estender) ancora = ref;
        pintarSelecao();
        mostrarCelula(ref);
        CE.emitir('planilha:celula', { celula: ref });
      }

      function mover(dCol, dLin, estender = false) {
        const p = posicao(estender ? fim : ativa);
        const ref = F.endereco(Math.min(COLUNAS - 1, Math.max(0, p.col + dCol)), Math.min(LINHAS - 1, Math.max(0, p.lin + dLin)));
        if (estender) { fim = ref; pintarSelecao(); mostrarCelula(ref); } else selecionar(ref);
      }

      // ---------- Alterações (com desfazer) ----------
      function guardarParaDesfazer() {
        desfazer.push(JSON.stringify(dados));
        if (desfazer.length > 40) desfazer.shift();
        refazer = [];
      }

      function alterar(funcao) {
        guardarParaDesfazer();
        funcao();
        modificado = true;
        recalcular();
      }

      function definirEntrada(ref, texto) {
        const c = dados.celulas[ref] || (dados.celulas[ref] = { v: '', f: {} });
        c.v = texto;
        // Quem digita "R$ 10" ou "15%" já ganha o formato certo.
        if (/^\s*R\$/i.test(texto) && F.lerNumero(texto) != null) c.f.formato = 'moeda';
        else if (/%\s*$/.test(texto) && F.lerNumero(texto) != null) c.f.formato = 'porcentagem';
        if (!c.v && !Object.keys(c.f).length) delete dados.celulas[ref];
      }

      function confirmarEntrada(ref, texto) {
        alterar(() => definirEntrada(ref, texto));
        const v = valorDe(ref);
        CE.emitir('planilha:editada', { celula: ref, entrada: texto, valor: v, formula: texto.startsWith('='), texto: F.textoDe(v, formatoDe(ref).formato) });
      }

      // ---------- Edição ----------
      function comecarEdicao(valorInicial, origem = 'celula') {
        terminarEdicao(true);
        if (origem === 'barra') { editando = { ref: ativa, campo: barraFormula, origem }; return; }
        const td = tds[ativa];
        const campo = CE.el('input', { class: 'pl-edicao', 'aria-label': `Editando a célula ${ativa}`, spellcheck: 'false', autocomplete: 'off' });
        campo.value = valorInicial != null ? valorInicial : entradaDe(ativa);
        campo.style.left = td.offsetLeft + 'px';
        campo.style.top = td.offsetTop + 'px';
        campo.style.minWidth = td.offsetWidth + 'px';
        campo.style.height = td.offsetHeight + 'px';
        grade.append(campo);
        campo.addEventListener('input', () => { barraFormula.value = campo.value; });
        editando = { ref: ativa, campo, origem };
        campo.focus();
        campo.setSelectionRange(campo.value.length, campo.value.length);
        barraFormula.value = campo.value;
      }

      function terminarEdicao(confirmar) {
        if (!editando) return;
        const { ref, campo, origem } = editando;
        editando = null;
        if (origem === 'celula') campo.remove();
        if (confirmar && campo.value !== entradaDe(ref)) confirmarEntrada(ref, campo.value.trim() === '' ? '' : campo.value);
        else pintarSelecao();
        grade.focus({ preventScroll: true });
      }

      // Durante a digitação de uma fórmula, clicar numa célula coloca o endereço dela na fórmula.
      const esperandoReferencia = () => editando && editando.campo.value.startsWith('=') && /[=+\-*/^(;:&<>]$/.test(editando.campo.value.slice(0, editando.campo.selectionStart ?? undefined).trimEnd());
      let referenciaInicio = null, textoAntesReferencia = '';

      // ---------- Mouse ----------
      let arrastando = null; // 'selecao' | 'referencia' | 'alca'
      grade.addEventListener('pointerdown', (e) => {
        const redim = e.target.closest('[data-redim]');
        if (redim) { comecarRedimensionar(e, Number(redim.dataset.redim)); return; }
        if (e.target === alca) { e.preventDefault(); arrastando = 'alca'; destinoAlca = fim; return; }
        const td = e.target.closest('td[data-celula]');
        if (!td) return;
        const ref = td.dataset.celula;
        if (esperandoReferencia()) {
          e.preventDefault();
          referenciaInicio = ref;
          textoAntesReferencia = editando.campo.value;
          editando.campo.value = textoAntesReferencia + ref;
          barraFormula.value = editando.campo.value;
          arrastando = 'referencia';
          return;
        }
        if (editando) terminarEdicao(true);
        e.preventDefault();
        selecionar(ref, e.shiftKey);
        arrastando = 'selecao';
        grade.focus({ preventScroll: true });
      });
      let destinoAlca = null;
      grade.addEventListener('pointermove', (e) => {
        if (!arrastando) return;
        const alvo = document.elementFromPoint(e.clientX, e.clientY);
        const td = alvo && alvo.closest && alvo.closest('td[data-celula]');
        if (!td) return;
        const ref = td.dataset.celula;
        if (arrastando === 'selecao' && ref !== fim) { fim = ref; pintarSelecao(); }
        if (arrastando === 'referencia' && editando) {
          editando.campo.value = textoAntesReferencia + (ref === referenciaInicio ? ref : `${referenciaInicio}:${ref}`);
          barraFormula.value = editando.campo.value;
        }
        if (arrastando === 'alca') {
          destinoAlca = ref;
          const r = faixa(), p = posicao(ref);
          // Mostra até onde vai copiar (só para baixo ou para a direita).
          corpoTabela.querySelectorAll('.preencher').forEach((x) => x.classList.remove('preencher'));
          const vertical = p.lin - r.l2 >= p.col - r.c2;
          const ate = vertical ? F.endereco(r.c2, Math.max(r.l2, p.lin)) : F.endereco(Math.max(r.c2, p.col), r.l2);
          F.celulasDoIntervalo(F.endereco(r.c1, r.l1), ate).forEach((x) => tds[x].classList.add('preencher'));
        }
      });
      document.addEventListener('pointerup', aoSoltar);
      function aoSoltar() {
        if (!arrastando || !corpo.isConnected) return;
        const tipo = arrastando;
        arrastando = null;
        if (tipo === 'selecao' && ancora !== fim) CE.emitir('planilha:selecao', { de: ancora, ate: fim, intervalo: nomeSelecao(), celulas: celulasDaSelecao().length });
        if (tipo === 'referencia' && editando) editando.campo.focus();
        if (tipo === 'alca') { corpoTabela.querySelectorAll('.preencher').forEach((x) => x.classList.remove('preencher')); preencher(destinoAlca); }
      }
      grade.addEventListener('dblclick', (e) => {
        const td = e.target.closest('td[data-celula]');
        if (td) { selecionar(td.dataset.celula); comecarEdicao(); }
      });

      // Alça de preenchimento: copia a seleção para baixo (ou para a direita). Números em sequência continuam a sequência.
      function preencher(destino) {
        if (!destino) return;
        const r = faixa(), p = posicao(destino);
        const vertical = p.lin - r.l2 >= p.col - r.c2;
        const extra = vertical ? p.lin - r.l2 : p.col - r.c2;
        if (extra <= 0) return;
        alterar(() => {
          if (vertical) {
            for (let c = r.c1; c <= r.c2; c++) {
              const origem = []; for (let l = r.l1; l <= r.l2; l++) origem.push(F.endereco(c, l));
              preencherLinha(origem, (i) => F.endereco(c, r.l2 + 1 + i), extra, (i) => [r.l2 + 1 + i - (r.l1 + (i % origem.length)), 0]);
            }
            fim = F.endereco(r.c2, r.l2 + extra);
          } else {
            for (let l = r.l1; l <= r.l2; l++) {
              const origem = []; for (let c = r.c1; c <= r.c2; c++) origem.push(F.endereco(c, l));
              preencherLinha(origem, (i) => F.endereco(r.c2 + 1 + i, l), extra, (i) => [0, r.c2 + 1 + i - (r.c1 + (i % origem.length))]);
            }
            fim = F.endereco(r.c2 + extra, r.l2);
          }
        });
        CE.emitir('planilha:preenchida', { de: ancora, ate: fim, intervalo: nomeSelecao() });
      }
      function preencherLinha(origem, destinoDe, quantidade, deslocamento) {
        const numeros = origem.map((ref) => (entradaDe(ref).startsWith('=') ? null : F.lerNumero(entradaDe(ref))));
        const sequencia = origem.length >= 2 && numeros.every((n) => n != null);
        const passo = sequencia ? numeros[1] - numeros[0] : 0;
        for (let i = 0; i < quantidade; i++) {
          const ref = destinoDe(i), base = origem[i % origem.length];
          const celula = dados.celulas[base];
          const [dLin, dCol] = deslocamento(i);
          let v = celula ? celula.v : '';
          if (sequencia) v = F.textoDe(numeros[numeros.length - 1] + passo * (i + 1));
          else if (v.startsWith('=')) v = F.ajustarFormula(v, dLin, dCol);
          dados.celulas[ref] = { v, f: { ...((celula && celula.f) || {}) } };
        }
      }

      function comecarRedimensionar(e, col) {
        e.preventDefault();
        e.stopPropagation();
        const letra = F.numeroParaLetra(col);
        const inicioX = e.clientX, inicial = dados.larguras[letra] || LARGURA;
        const mover = (ev) => { dados.larguras[letra] = Math.max(40, Math.min(500, inicial + ev.clientX - inicioX)); aplicarLarguras(); pintarSelecao(); };
        const soltar = () => {
          document.removeEventListener('pointermove', mover);
          document.removeEventListener('pointerup', soltar);
          modificado = true;
          CE.emitir('planilha:largura', { coluna: letra, largura: dados.larguras[letra] });
        };
        document.addEventListener('pointermove', mover);
        document.addEventListener('pointerup', soltar);
      }

      // ---------- Teclado ----------
      grade.addEventListener('keydown', (e) => {
        const ctrl = e.ctrlKey || e.metaKey;
        if (editando && editando.origem === 'celula') {
          if (e.key === 'Enter') { e.preventDefault(); terminarEdicao(true); mover(0, e.shiftKey ? -1 : 1); }
          else if (e.key === 'Tab') { e.preventDefault(); terminarEdicao(true); mover(e.shiftKey ? -1 : 1, 0); }
          else if (e.key === 'Escape') { e.preventDefault(); terminarEdicao(false); }
          return;
        }
        const setas = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
        if (setas[e.key]) { e.preventDefault(); mover(...setas[e.key], e.shiftKey); return; }
        if (e.key === 'Enter') { e.preventDefault(); mover(0, e.shiftKey ? -1 : 1); return; }
        if (e.key === 'Tab') { e.preventDefault(); mover(e.shiftKey ? -1 : 1, 0); return; }
        if (e.key === 'F2') { e.preventDefault(); comecarEdicao(); return; }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          alterar(() => celulasDaSelecao().forEach((ref) => definirEntrada(ref, '')));
          CE.emitir('planilha:apagada', { intervalo: nomeSelecao() });
          return;
        }
        if (ctrl) {
          const t = e.key.toLowerCase();
          if (t === 'c') { e.preventDefault(); copiar(); }
          else if (t === 'x') { e.preventDefault(); copiar(true); }
          else if (t === 'v') { e.preventDefault(); colar(); }
          else if (t === 'z') { e.preventDefault(); voltar(); }
          else if (t === 'y') { e.preventDefault(); avancar(); }
          else if (t === 's') { e.preventDefault(); salvar(); }
          else if (t === 'b') { e.preventDefault(); formatar('negrito'); }
          else if (t === 'i') { e.preventDefault(); formatar('italico'); }
          return;
        }
        if (e.key.length === 1 && !e.altKey) { e.preventDefault(); comecarEdicao(e.key); }
        else if (e.key === 'Dead') comecarEdicao('');
      });

      barraFormula.addEventListener('focus', () => { if (!editando) comecarEdicao(null, 'barra'); });
      barraFormula.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); terminarEdicao(true); mover(0, 1); }
        if (e.key === 'Escape') { e.preventDefault(); barraFormula.value = entradaDe(ativa); terminarEdicao(false); }
      });
      barraFormula.addEventListener('blur', () => { if (editando && editando.origem === 'barra') terminarEdicao(true); });
      caixaNome.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const [a, b] = caixaNome.value.toUpperCase().split(':');
        if (F.lerEndereco(a)) { selecionar(a); if (b && F.lerEndereco(b)) { fim = b; pintarSelecao(); } grade.focus(); }
      });

      // ---------- Copiar, colar, desfazer ----------
      function copiar(recortar = false) {
        const r = faixa();
        const celulas = {};
        celulasDaSelecao().forEach((ref) => { if (dados.celulas[ref]) celulas[ref] = JSON.parse(JSON.stringify(dados.celulas[ref])); });
        areaCopia = { celulas, de: F.endereco(r.c1, r.l1), recortar, refs: celulasDaSelecao() };
        CE.avisar(recortar ? '✂️ Recortado. Clique na célula de destino e aperte Ctrl+V.' : '📋 Copiado. Clique na célula de destino e aperte Ctrl+V.');
        CE.emitir('planilha:copiada', { intervalo: nomeSelecao(), recortar });
      }
      function colar() {
        if (!areaCopia) return;
        const de = posicao(areaCopia.de), para = posicao(ativa);
        alterar(() => {
          if (areaCopia.recortar) areaCopia.refs.forEach((ref) => delete dados.celulas[ref]);
          Object.entries(areaCopia.celulas).forEach(([ref, c]) => {
            const p = posicao(ref);
            const destino = F.endereco(p.col - de.col + para.col, p.lin - de.lin + para.lin);
            if (!tds[destino]) return;
            dados.celulas[destino] = { v: areaCopia.recortar ? c.v : F.ajustarFormula(c.v, para.lin - de.lin, para.col - de.col), f: { ...c.f } };
          });
        });
        if (areaCopia.recortar) areaCopia = null;
        CE.emitir('planilha:colada', { celula: ativa });
      }
      function voltar() {
        if (!desfazer.length) return;
        refazer.push(JSON.stringify(dados));
        dados = JSON.parse(desfazer.pop());
        aplicarLarguras();
        recalcular();
        CE.emitir('planilha:desfeito');
      }
      function avancar() {
        if (!refazer.length) return;
        desfazer.push(JSON.stringify(dados));
        dados = JSON.parse(refazer.pop());
        aplicarLarguras();
        recalcular();
      }

      // ---------- Formatação ----------
      function formatar(comando, valor) {
        terminarEdicao(true);
        const celulas = celulasDaSelecao();
        const ligar = comando === 'negrito' || comando === 'italico' ? !formatoDe(ativa)[comando] : null;
        alterar(() => celulas.forEach((ref) => {
          const c = dados.celulas[ref] || (dados.celulas[ref] = { v: '', f: {} });
          if (ligar !== null) c.f[comando] = ligar;
          else if (comando === 'formato') c.f.formato = valor === 'geral' ? undefined : valor;
          else c.f[comando] = valor;
        }));
        CE.emitir('planilha:formatada', { comando, valor: ligar !== null ? ligar : valor, intervalo: nomeSelecao(), celulas: celulas.length });
        grade.focus({ preventScroll: true });
      }

      function autoSoma() {
        terminarEdicao(true);
        const r = faixa();
        let alvo, intervalo;
        if (ancora !== fim) {
          // Selecionou os números: a soma vai logo embaixo (ou à direita, se a seleção for uma linha).
          if (r.l2 > r.l1 || r.c1 === r.c2) { alvo = F.endereco(r.c1, r.l2 + 1); intervalo = `${F.endereco(r.c1, r.l1)}:${F.endereco(r.c1, r.l2)}`; }
          else { alvo = F.endereco(r.c2 + 1, r.l1); intervalo = `${F.endereco(r.c1, r.l1)}:${F.endereco(r.c2, r.l1)}`; }
        } else {
          const p = posicao(ativa);
          const ehNumero = (c, l) => l >= 0 && c >= 0 && typeof valorDe(F.endereco(c, l)) === 'number';
          let l = p.lin - 1; while (ehNumero(p.col, l)) l--;
          if (l < p.lin - 1) intervalo = `${F.endereco(p.col, l + 1)}:${F.endereco(p.col, p.lin - 1)}`;
          else { let c = p.col - 1; while (ehNumero(c, p.lin)) c--; if (c < p.col - 1) intervalo = `${F.endereco(c + 1, p.lin)}:${F.endereco(p.col - 1, p.lin)}`; }
          alvo = ativa;
        }
        if (!intervalo) { CE.avisar('Clique na célula logo embaixo dos números que você quer somar e aperte Σ de novo.'); return; }
        const formula = `=SOMA(${intervalo})`;
        selecionar(alvo);
        confirmarEntrada(alvo, formula);
        CE.emitir('planilha:autosoma', { celula: alvo, formula, valor: valorDe(alvo) });
      }

      // ---------- Arquivo ----------
      async function salvar() {
        terminarEdicao(true);
        let nome = nomeArquivo;
        if (!nome) {
          nome = await CE.perguntar('Qual o nome da planilha?', 'Minha planilha');
          if (!nome) return false;
        }
        await CE.sessao.salvarArquivo({ nome, tipo: 'planilha', conteudo: JSON.stringify(dados) });
        nomeArquivo = nome;
        modificado = false;
        pintarSelecao();
        CE.avisar(`Planilha "${nome}" salva!`);
        return true;
      }
      async function novo() {
        if (modificado && await CE.confirmar('Quer salvar a planilha atual antes de começar uma nova?')) { if (!await salvar()) return; }
        dados = { celulas: {}, larguras: {} };
        nomeArquivo = null; modificado = false; desfazer = []; refazer = [];
        aplicarLarguras(); selecionar('A1'); recalcular();
        CE.emitir('planilha:nova');
      }
      function carregar(arquivo) {
        try { dados = JSON.parse(arquivo.conteudo || '{}'); } catch { dados = {}; }
        dados.celulas = dados.celulas || {};
        dados.larguras = dados.larguras || {};
        nomeArquivo = arquivo.nome; modificado = false; desfazer = []; refazer = [];
        aplicarLarguras(); selecionar('A1'); recalcular();
        CE.emitir('arquivo:aberto', { nome: arquivo.nome, tipo: 'planilha' });
      }

      // ---------- Barra de ferramentas ----------
      const fb = (acao, rotulo, dica, funcao, classe = '') => CE.el('button', { class: 'ferramenta ' + classe, 'data-comando': acao, title: dica, onmousedown: (e) => e.preventDefault(), onclick: funcao }, rotulo);
      const corTexto = CE.el('input', { type: 'color', class: 'ferramenta-cor', 'data-comando': 'cor', value: '#000000', title: 'Cor da letra', onchange: (e) => formatar('cor', e.target.value) });
      const corFundo = CE.el('input', { type: 'color', class: 'ferramenta-cor', 'data-comando': 'fundo', value: '#fff2a8', title: 'Cor de fundo da célula', onchange: (e) => formatar('fundo', e.target.value) });
      const menuFuncoes = CE.el('div', { class: 'ed-menu', hidden: true }, ...FUNCOES_MENU.map(([nome, dica, texto]) => CE.el('button', {
        class: 'menu-item', 'data-funcao': nome, title: dica,
        onclick: () => { menuFuncoes.hidden = true; comecarEdicao(texto); CE.emitir('planilha:funcao', { funcao: nome }); },
      }, CE.el('b', {}, nome), ` — ${dica}`)));
      document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.pl-fx')) menuFuncoes.hidden = true; });

      corpo.classList.add('planilha');
      corpo.append(
        CE.el('div', { class: 'ferramentas' },
          CE.el('div', { class: 'ferramentas-grupo' },
            fb('novo', '📄 Nova', 'Começar uma planilha nova', novo, 'texto'),
            fb('abrir', '📂 Abrir', 'Abrir uma planilha salva', () => CE.janelas.abrir('arquivos'), 'texto'),
            fb('salvar', '💾 Salvar', 'Salvar a planilha (Ctrl+S)', salvar, 'texto')),
          CE.el('div', { class: 'ferramentas-grupo' }, fb('desfazer', '↶', 'Desfazer (Ctrl+Z)', voltar), fb('refazer', '↷', 'Refazer (Ctrl+Y)', avancar)),
          CE.el('div', { class: 'ferramentas-grupo' },
            fb('negrito', 'N', 'Negrito (Ctrl+B)', () => formatar('negrito'), 'negrito'),
            fb('italico', 'I', 'Itálico (Ctrl+I)', () => formatar('italico'), 'italico'),
            corTexto, corFundo,
            fb('alinhar-esquerda', '⇤', 'Alinhar à esquerda', () => formatar('alinhar', 'left')),
            fb('alinhar-centro', '≡', 'Centralizar', () => formatar('alinhar', 'center')),
            fb('alinhar-direita', '⇥', 'Alinhar à direita', () => formatar('alinhar', 'right'))),
          CE.el('div', { class: 'ferramentas-grupo' },
            fb('moeda', 'R$', 'Formato de dinheiro (R$ 1.234,56)', () => formatar('formato', 'moeda'), 'texto'),
            fb('porcentagem', '%', 'Formato de porcentagem', () => formatar('formato', 'porcentagem'), 'texto'),
            fb('decimal', ',00', 'Duas casas decimais', () => formatar('formato', 'decimal'), 'texto'),
            fb('geral', '123', 'Número comum', () => formatar('formato', 'geral'), 'texto')),
          CE.el('div', { class: 'ferramentas-grupo' },
            fb('autosoma', 'Σ AutoSoma', 'Soma automática dos números de cima', autoSoma, 'texto'),
            CE.el('div', { class: 'ed-novo pl-fx' }, fb('funcoes', 'fx Funções ▾', 'Escolher uma função', () => { menuFuncoes.hidden = !menuFuncoes.hidden; }, 'texto'), menuFuncoes)),
        ),
        CE.el('div', { class: 'pl-barra' }, caixaNome, CE.el('span', { class: 'pl-fx-rotulo' }, 'fx'), barraFormula),
        grade,
        status,
      );
      aplicarLarguras();
      recalcular();
      if (argumento && argumento.arquivo) carregar(argumento.arquivo);
      setTimeout(() => { grade.focus({ preventScroll: true }); pintarSelecao(); }, 50);

      // Para as lições conferirem o que tem na planilha.
      const api = {
        valor: (ref) => valorDe(String(ref).toUpperCase()),
        entrada: (ref) => entradaDe(String(ref).toUpperCase()),
        formato: (ref) => formatoDe(String(ref).toUpperCase()),
        texto: (ref) => F.textoDe(valorDe(String(ref).toUpperCase()), formatoDe(String(ref).toUpperCase()).formato),
        largura: (col) => dados.larguras[String(col).toUpperCase()] || LARGURA,
      };
      CE.planilhaAtiva = api;
      const pararAtivar = CE.ouvir('janela:ativada', (d) => { if (d.app === 'planilha') CE.planilhaAtiva = api; });

      return {
        receber(arg) {
          if (!arg || !arg.arquivo) return;
          if (modificado) CE.confirmar('A planilha atual não foi salva. Abrir outra mesmo assim?').then((sim) => sim && carregar(arg.arquivo));
          else carregar(arg.arquivo);
        },
        aoFechar() {
          if (modificado && !podeFechar) {
            if (!aviso) aviso = CE.confirmar('Você não salvou a planilha. Quer salvar antes de fechar?').then(async (sim) => {
              aviso = null;
              if (sim && !await salvar()) return;
              podeFechar = true;
              janela.fechar();
            });
            return false;
          }
          pararAtivar();
          document.removeEventListener('pointerup', aoSoltar);
          if (CE.planilhaAtiva === api) CE.planilhaAtiva = null;
          return true;
        },
      };
    },
  });
})();
