// Planilha (parecida com o Excel): células, fórmulas em português, AutoSoma, formatação de números,
// cores, alça de preenchimento (arrastar para copiar), largura de coluna, desfazer, salvar e abrir.
// No nível avançado: classificar, filtro, gráficos e destaque automático (formatação condicional).
(function () {
  const F = CE.formulas;
  const COLUNAS = 26, LINHAS = 60, LARGURA = 96;
  const FUNCOES_MENU = [
    ['SOMA', 'Soma os números', '=SOMA('], ['MÉDIA', 'Média dos números', '=MÉDIA('], ['MÁXIMO', 'Maior número', '=MÁXIMO('],
    ['MÍNIMO', 'Menor número', '=MÍNIMO('], ['SE', 'Escolhe um resultado conforme uma condição', '=SE('], ['CONT.SE', 'Conta as células que atendem a uma condição', '=CONT.SE('],
    ['SOMASE', 'Soma só o que atende a uma condição', '=SOMASE('], ['MÉDIASE', 'Média só do que atende a uma condição', '=MÉDIASE('],
    ['PROCV', 'Procura um valor numa tabela', '=PROCV('], ['CONCATENAR', 'Junta textos', '=CONCATENAR('],
    ['HOJE', 'A data de hoje', '=HOJE()'], ['DIAS', 'Quantos dias entre duas datas (fim; início)', '=DIAS('],
    ['DATA', 'Monta uma data (ano; mês; dia)', '=DATA('], ['MÊS', 'O mês de uma data', '=MÊS('], ['ANO', 'O ano de uma data', '=ANO('],
  ];
  const CORES_DESTAQUE = {
    vermelho: { nome: 'Vermelho', fundo: '#ffc7ce', texto: '#9c0006' },
    verde: { nome: 'Verde', fundo: '#c6efce', texto: '#006100' },
    amarelo: { nome: 'Amarelo', fundo: '#ffeb9c', texto: '#9c5700' },
  };
  const REGRAS_DESTAQUE = { maior: 'é maior que', menor: 'é menor que', igual: 'é igual a', contem: 'contém o texto' };
  const planilhaVazia = () => ({ celulas: {}, larguras: {}, graficos: [], condicionais: [], filtro: null, validacoes: [], congelar: null, protecao: null, liberadas: [] });

  CE.registrarApp({
    id: 'planilha',
    nome: 'Planilha',
    icone: '📊',
    largura: 980,
    altura: 620,
    abrir(corpo, janela, argumento) {
      let dados = planilhaVazia();
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
      const camadaGraficos = CE.el('div', { class: 'pl-graficos' });
      grade.append(alca, camadaGraficos);

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
        aplicarDestaques();
        aplicarFiltro();
        desenharGraficos();
        aplicarCongelar();
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
        const lista = regraDe(ativa);
        botaoLista.hidden = !(lista && lista.tipo === 'lista');
        if (!botaoLista.hidden) { botaoLista.style.left = tds[ativa].offsetLeft + tds[ativa].offsetWidth + 'px'; botaoLista.style.top = tds[ativa].offsetTop + 'px'; }
        menuLista.hidden = true;
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
        const antes = JSON.stringify(dados);
        guardarParaDesfazer();
        funcao();
        // Planilha protegida: só as células liberadas podem mudar. Se mexeu em outra, volta tudo.
        if (dados.protecao) {
          const velhas = JSON.parse(antes).celulas || {};
          const refs = new Set([...Object.keys(velhas), ...Object.keys(dados.celulas)]);
          const mexidas = [...refs].filter((r) => JSON.stringify(velhas[r] || null) !== JSON.stringify(dados.celulas[r] || null));
          const proibidas = mexidas.filter((r) => !(dados.liberadas || []).includes(r));
          if (proibidas.length) {
            dados = JSON.parse(antes);
            desfazer.pop();
            recalcular();
            CE.avisar('🔒 Esta planilha está protegida: essa célula não pode ser mudada. Para mudar, clique em "🔓 Desproteger".');
            CE.emitir('planilha:bloqueada', { celula: proibidas[0], celulas: proibidas.length });
            return false;
          }
        }
        modificado = true;
        recalcular();
        return true;
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
        const erroValidacao = validar(ref, texto);
        if (erroValidacao) {
          CE.avisar(`⛔ Valor não permitido em ${ref}. ${erroValidacao}`);
          CE.emitir('planilha:invalida', { celula: ref, entrada: texto, motivo: erroValidacao });
          pintarSelecao();
          return;
        }
        if (alterar(() => definirEntrada(ref, texto)) === false) return;
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
        // Cabeçalho de linha (1, 2, 3...) ou de coluna (A, B, C...): seleciona a linha ou a coluna inteira.
        const cabLinha = e.target.closest('th.pl-cab-lin'), cabColuna = e.target.closest('th.pl-cab-col');
        if ((cabLinha || cabColuna) && !e.target.closest('[data-redim]')) {
          if (editando) terminarEdicao(true);
          e.preventDefault();
          const l = cabLinha ? Number(cabLinha.textContent) - 1 : null, c = cabColuna ? F.letraParaNumero(cabColuna.dataset.coluna) : null;
          const dentro = e.button === 2 && (cabLinha ? linhaInteira(l) : colunaInteira(c));
          if (!dentro) selecionarFaixa(cabLinha ? F.endereco(0, l) : F.endereco(c, 0), cabLinha ? F.endereco(COLUNAS - 1, l) : F.endereco(c, LINHAS - 1));
          grade.focus({ preventScroll: true });
          return;
        }
        // Botão direito numa célula: se ela está fora da seleção, seleciona só ela (como no Excel); o menu aparece no "contextmenu".
        if (e.button === 2) {
          const tdDireito = e.target.closest('td[data-celula]');
          if (tdDireito && !celulasDaSelecao().includes(tdDireito.dataset.celula)) { if (editando) terminarEdicao(true); selecionar(tdDireito.dataset.celula); }
          e.preventDefault();
          grade.focus({ preventScroll: true });
          return;
        }
        const botaoFiltro = e.target.closest('.pl-filtro-botao');
        if (botaoFiltro) { e.preventDefault(); e.stopPropagation(); abrirMenuFiltro(botaoFiltro.dataset.filtro); return; }
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
          else if (t === 'p') { e.preventDefault(); dialogoImprimir(); }
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
      function colarCelulas() { colar(); }
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


      // ---------- Nível avançado: região da tabela ----------
      const nomeFaixa = (r) => `${F.endereco(r.c1, r.l1)}:${F.endereco(r.c2, r.l2)}`;
      const lerFaixa = (texto) => {
        const [a, b] = String(texto).split(':').map(posicao);
        const z = b || a;
        return { c1: Math.min(a.col, z.col), c2: Math.max(a.col, z.col), l1: Math.min(a.lin, z.lin), l2: Math.max(a.lin, z.lin) };
      };
      // Com uma célula só selecionada, pega a tabela inteira em volta dela (como o Excel faz).
      function regiaoAtual() {
        if (ancora !== fim) return faixa();
        const temDado = (c, l) => c >= 0 && l >= 0 && c < COLUNAS && l < LINHAS && entradaDe(F.endereco(c, l)) !== '';
        const p = posicao(ativa);
        const r = { c1: p.col, c2: p.col, l1: p.lin, l2: p.lin };
        const linhaTem = (l) => { for (let c = r.c1 - 1; c <= r.c2 + 1; c++) if (temDado(c, l)) return true; return false; };
        const colunaTem = (c) => { for (let l = r.l1 - 1; l <= r.l2 + 1; l++) if (temDado(c, l)) return true; return false; };
        for (let mudou = true; mudou;) {
          mudou = false;
          if (r.l1 > 0 && linhaTem(r.l1 - 1)) { r.l1--; mudou = true; }
          if (r.l2 < LINHAS - 1 && linhaTem(r.l2 + 1)) { r.l2++; mudou = true; }
          if (r.c1 > 0 && colunaTem(r.c1 - 1)) { r.c1--; mudou = true; }
          if (r.c2 < COLUNAS - 1 && colunaTem(r.c2 + 1)) { r.c2++; mudou = true; }
        }
        return r;
      }
      // A primeira linha é de títulos quando só tem texto e embaixo tem números (ou quando está em negrito).
      function temCabecalho(r) {
        if (r.l2 <= r.l1) return false;
        let textos = true, negrito = true, numeros = false;
        for (let c = r.c1; c <= r.c2; c++) {
          const ref = F.endereco(c, r.l1), v = valorDe(ref);
          if (v !== '' && typeof v !== 'string') textos = false;
          if (v !== '' && !formatoDe(ref).negrito) negrito = false;
          for (let l = r.l1 + 1; l <= r.l2; l++) if (typeof valorDe(F.endereco(c, l)) === 'number') numeros = true;
        }
        return textos && (numeros || negrito);
      }

      // ---------- Linhas e colunas inteiras (cabeçalhos e botão direito) ----------
      function selecionarFaixa(de, ate) {
        ancora = de; ativa = de; fim = ate;
        pintarSelecao();
        CE.emitir('planilha:selecao', { de, ate, intervalo: nomeSelecao(), celulas: celulasDaSelecao().length });
      }
      const linhaInteira = (l) => { const r = faixa(); return r.c1 === 0 && r.c2 === COLUNAS - 1 && l >= r.l1 && l <= r.l2; };
      const colunaInteira = (c) => { const r = faixa(); return r.l1 === 0 && r.l2 === LINHAS - 1 && c >= r.c1 && c <= r.c2; };

      // Inserir ou excluir uma linha ou coluna: as células andam e as fórmulas continuam apontando para os mesmos
      // dados (=SOMA(B2:B5) vira =SOMA(B2:B6) quando entra uma linha no meio), como no Excel.
      function deslocar(texto, tipo, k, delta) {
        const num = (letras) => F.letraParaNumero(letras.toUpperCase());
        const mover = (fixaC, col, fixaL, lin, papel) => {
          let c = num(col), l = Number(lin) - 1;
          let p = tipo === 'lin' ? l : c;
          if (delta > 0) { if (p >= k) p += delta; } else if (papel === 'fim' ? p >= k : p > k) p += delta;
          if (p < 0) return null;
          if (tipo === 'lin') l = p; else c = p;
          return `${fixaC}${F.numeroParaLetra(c)}${fixaL}${l + 1}`;
        };
        const removida = (col, lin) => (tipo === 'lin' ? Number(lin) - 1 : num(col)) === k;
        return texto.replace(/("[^"]*")|(\$?)([A-Z]{1,2})(\$?)(\d+)(?::(\$?)([A-Z]{1,2})(\$?)(\d+))?(?![\w(.])/gi, (tudo, aspas, fc1, c1, fl1, l1, fc2, c2, fl2, l2) => {
          if (aspas) return aspas;
          if (c2 == null) { // uma célula só
            if (delta < 0 && removida(c1, l1)) return F.ERRO.REF;
            return mover(fc1, c1, fl1, l1, 'inicio') || F.ERRO.REF;
          }
          // intervalo: se a linha (ou coluna) apagada era o intervalo inteiro, vira #REF!
          if (delta < 0 && removida(c1, l1) && removida(c2, l2)) return F.ERRO.REF;
          const a = mover(fc1, c1, fl1, l1, 'inicio'), b = mover(fc2, c2, fl2, l2, 'fim');
          return a && b ? `${a}:${b}` : F.ERRO.REF;
        });
      }
      function inserirOuExcluir(tipo, delta) {
        terminarEdicao(true);
        const r = faixa();
        const k = tipo === 'lin' ? r.l1 : r.c1;
        const ultimo = tipo === 'lin' ? LINHAS - 1 : COLUNAS - 1;
        const temNaUltima = Object.keys(dados.celulas).some((ref) => { const p = posicao(ref); return (tipo === 'lin' ? p.lin : p.col) === ultimo && dados.celulas[ref].v !== ''; });
        if (delta > 0 && temNaUltima) { CE.avisar(`Não dá para inserir: a última ${tipo === 'lin' ? 'linha' : 'coluna'} da planilha tem dados.`); return; }
        alterar(() => {
          const novas = {};
          Object.entries(dados.celulas).forEach(([ref, c]) => {
            const p = posicao(ref);
            let { col, lin } = p;
            const pos = tipo === 'lin' ? lin : col;
            if (delta < 0 && pos === k) return; // a linha (ou coluna) que saiu
            if (pos >= k + (delta < 0 ? 1 : 0)) { if (tipo === 'lin') lin += delta; else col += delta; }
            if (lin < 0 || col < 0 || lin >= LINHAS || col >= COLUNAS) return;
            novas[F.endereco(col, lin)] = { v: String(c.v || '').startsWith('=') ? deslocar(c.v, tipo, k, delta) : c.v, f: c.f || {} };
          });
          dados.celulas = novas;
          const faixaTexto = (t) => deslocar(t, tipo, k, delta);
          (dados.graficos || []).forEach((g) => { if (g.intervalo) g.intervalo = faixaTexto(g.intervalo); });
          dados.condicionais = (dados.condicionais || []).map((x) => ({ ...x, intervalo: faixaTexto(x.intervalo) })).filter((x) => !String(x.intervalo).startsWith('#'));
          dados.graficos = (dados.graficos || []).filter((g) => !String(g.intervalo || '').startsWith('#'));
          if (dados.filtro) dados.filtro = null; // o filtro precisa ser ligado de novo depois de mudar as linhas
          if (tipo === 'col') {
            const larguras = {};
            Object.entries(dados.larguras || {}).forEach(([letra, w]) => {
              const c = F.letraParaNumero(letra);
              if (delta < 0 && c === k) return;
              const n = c >= k + (delta < 0 ? 1 : 0) ? c + delta : c;
              if (n >= 0 && n < COLUNAS) larguras[F.numeroParaLetra(n)] = w;
            });
            dados.larguras = larguras;
            aplicarLarguras();
          }
        });
        const nome = tipo === 'lin' ? `linha ${k + 1}` : `coluna ${F.numeroParaLetra(k)}`;
        CE.emitir(delta > 0 ? 'planilha:inserida' : 'planilha:excluida', { tipo: tipo === 'lin' ? 'linha' : 'coluna', [tipo === 'lin' ? 'linha' : 'coluna']: tipo === 'lin' ? k + 1 : F.numeroParaLetra(k) });
        CE.avisar(delta > 0 ? `➕ Nova ${tipo === 'lin' ? 'linha inserida acima da' : 'coluna inserida à esquerda da'} ${nome} antiga.` : `➖ ${nome[0].toUpperCase() + nome.slice(1)} excluída.`);
        grade.focus({ preventScroll: true });
      }
      function limparConteudo() {
        alterar(() => celulasDaSelecao().forEach((ref) => definirEntrada(ref, '')));
        CE.emitir('planilha:apagada', { intervalo: nomeSelecao(), pelo: 'menu' });
      }

      // ---------- Botão direito na planilha ----------
      grade.addEventListener('contextmenu', (e) => {
        const naCelula = e.target.closest('td[data-celula]'), cabLinha = e.target.closest('th.pl-cab-lin'), cabColuna = e.target.closest('th.pl-cab-col');
        if (!naCelula && !cabLinha && !cabColuna) return;
        if (editando && naCelula) return; // escrevendo dentro da célula: fica o menu de texto
        const op = (id, rotulo, icone, acao, extra = {}) => ({ id, rotulo, icone, acao, ...extra });
        const r = faixa();
        const colar = op('colar', 'Colar', '📌', colarCelulas, { atalho: 'Ctrl+V', desativado: !areaCopia });
        const basicos = [op('recortar', 'Recortar', '✂️', () => copiar(true), { atalho: 'Ctrl+X' }), op('copiar', 'Copiar', '📋', () => copiar(), { atalho: 'Ctrl+C' }), colar, '-'];
        if (cabLinha || cabColuna) {
          const linha = !!cabLinha;
          CE.menuContexto.abrir(e, linha ? 'planilha-linha' : 'planilha-coluna', [...basicos,
            op('inserir', 'Inserir', '➕', () => inserirOuExcluir(linha ? 'lin' : 'col', 1)),
            op('excluir', 'Excluir', '➖', () => inserirOuExcluir(linha ? 'lin' : 'col', -1)),
            op('limpar', 'Limpar conteúdo', '🧽', limparConteudo),
            '-',
            op('formatar', 'Formatar células', '🎨', null, { submenu: submenuFormatar() }),
          ], linha ? String(r.l1 + 1) : F.numeroParaLetra(r.c1));
          return;
        }
        CE.menuContexto.abrir(e, 'planilha', [...basicos,
          op('inserir', 'Inserir', '➕', null, { submenu: [
            op('inserir-linha', 'Linha inteira acima', '⬆️', () => inserirOuExcluir('lin', 1)),
            op('inserir-coluna', 'Coluna inteira à esquerda', '⬅️', () => inserirOuExcluir('col', 1)),
          ] }),
          op('excluir', 'Excluir', '➖', null, { submenu: [
            op('excluir-linha', `Linha inteira (linha ${r.l1 + 1})`, '↕️', () => inserirOuExcluir('lin', -1)),
            op('excluir-coluna', `Coluna inteira (coluna ${F.numeroParaLetra(r.c1)})`, '↔️', () => inserirOuExcluir('col', -1)),
          ] }),
          op('limpar', 'Limpar conteúdo', '🧽', limparConteudo, { atalho: 'Delete' }),
          '-',
          op('classificar', 'Classificar', '🔤', null, { submenu: [
            op('classificar-az', 'Do menor para o maior (A → Z)', '', () => classificar('az')),
            op('classificar-za', 'Do maior para o menor (Z → A)', '', () => classificar('za')),
          ] }),
          op('filtrar', dados.filtro ? 'Tirar o filtro' : 'Filtrar', '⏷', alternarFiltro),
          '-',
          op('formatar', 'Formatar células', '🎨', null, { submenu: submenuFormatar() }),
        ], ativa);
      });
      function submenuFormatar() {
        const op = (id, rotulo, icone, acao) => ({ id, rotulo, icone, acao });
        return [
          op('formatar-negrito', 'Negrito', '𝐍', () => formatar('negrito')),
          '-',
          op('formatar-moeda', 'Moeda (R$ 1.234,56)', 'R$', () => formatar('formato', 'moeda')),
          op('formatar-porcentagem', 'Porcentagem (15%)', '%', () => formatar('formato', 'porcentagem')),
          op('formatar-decimal', 'Número com 2 casas (1,50)', ',00', () => formatar('formato', 'decimal')),
          op('formatar-geral', 'Geral (sem formato)', '123', () => formatar('formato', 'geral')),
        ];
      }

      // ---------- Classificar ----------
      function classificar(ordem, colunaLetra) {
        terminarEdicao(true);
        const r = regiaoAtual();
        if (r.l1 === r.l2) { CE.avisar('Clique numa célula dentro da tabela que você quer organizar.'); return; }
        const cab = temCabecalho(r);
        const inicio = r.l1 + (cab ? 1 : 0);
        const col = colunaLetra ? F.letraParaNumero(colunaLetra) : Math.min(r.c2, Math.max(r.c1, posicao(ativa).col));
        const linhas = [];
        for (let l = inicio; l <= r.l2; l++) {
          const celulas = [];
          for (let c = r.c1; c <= r.c2; c++) { const x = dados.celulas[F.endereco(c, l)]; celulas.push(x ? JSON.parse(JSON.stringify(x)) : null); }
          linhas.push({ l, celulas, chave: valorDe(F.endereco(col, l)) });
        }
        const peso = (v) => (v === '' ? 3 : typeof v === 'number' ? 0 : typeof v === 'boolean' ? 2 : 1);
        linhas.sort((a, b) => {
          const pa = peso(a.chave), pb = peso(b.chave);
          if (pa === 3 || pb === 3) return pa - pb; // células vazias sempre no fim
          const d = pa - pb || (pa === 0 ? a.chave - b.chave : String(a.chave).localeCompare(String(b.chave), 'pt-BR', { sensitivity: 'base' }));
          return ordem === 'za' ? -d : d;
        });
        alterar(() => linhas.forEach((linha, i) => {
          const destino = inicio + i;
          linha.celulas.forEach((c, j) => {
            const ref = F.endereco(r.c1 + j, destino);
            if (!c) delete dados.celulas[ref];
            else dados.celulas[ref] = { v: String(c.v || '').startsWith('=') ? F.ajustarFormula(c.v, destino - linha.l, 0) : c.v, f: c.f || {} };
          });
        }));
        CE.emitir('planilha:classificada', { coluna: F.numeroParaLetra(col), ordem, intervalo: nomeFaixa(r), cabecalho: cab, primeiro: valorDe(F.endereco(col, inicio)) });
        CE.avisar(`${ordem === 'az' ? '🔤 Organizado do menor para o maior (A→Z)' : '🔤 Organizado do maior para o menor (Z→A)'} pela coluna ${F.numeroParaLetra(col)}.`);
        grade.focus({ preventScroll: true });
      }

      // ---------- Filtro ----------
      function fimDoFiltro() {
        const f = dados.filtro;
        const tem = (l) => { for (let c = f.c1; c <= f.c2; c++) if (entradaDe(F.endereco(c, l)) !== '') return true; return false; };
        let l = f.l;
        while (l + 1 < LINHAS && tem(l + 1)) l++;
        return l;
      }
      const textoCelula = (ref) => F.textoDe(valorDe(ref), formatoDe(ref).formato);
      function aplicarFiltro() {
        corpoTabela.querySelectorAll('tr.pl-oculta').forEach((tr) => tr.classList.remove('pl-oculta'));
        const f = dados.filtro;
        if (!f) return;
        for (let c = f.c1; c <= f.c2; c++) {
          const letra = F.numeroParaLetra(c), ativo = (f.ocultos[letra] || []).length > 0;
          tds[F.endereco(c, f.l)].append(CE.el('span', { class: 'pl-filtro-botao' + (ativo ? ' ativo' : ''), 'data-filtro': letra, title: ativo ? 'Esta coluna está filtrada. Clique para mudar.' : 'Filtrar esta coluna' }, ativo ? '⏷' : '▾'));
        }
        const l2 = fimDoFiltro();
        for (let l = f.l + 1; l <= l2; l++) {
          const esconder = Object.entries(f.ocultos).some(([letra, lista]) => lista.length && lista.includes(textoCelula(letra + (l + 1))));
          if (esconder) corpoTabela.children[l].classList.add('pl-oculta');
        }
      }
      function alternarFiltro() {
        terminarEdicao(true);
        if (dados.filtro) {
          alterar(() => { dados.filtro = null; });
          CE.emitir('planilha:filtro', { ligado: false });
          CE.avisar('Filtro desligado: todas as linhas aparecem de novo.');
          return;
        }
        const r = regiaoAtual();
        if (r.l1 === r.l2) { CE.avisar('Clique dentro de uma tabela que tenha os títulos na primeira linha.'); return; }
        alterar(() => { dados.filtro = { l: r.l1, c1: r.c1, c2: r.c2, ocultos: {} }; });
        CE.emitir('planilha:filtro', { ligado: true, intervalo: nomeFaixa(r) });
        CE.avisar('🔽 Filtro ligado! Clique na setinha ▾ do título de uma coluna para escolher o que aparece.');
      }
      let menuFiltro = null;
      const fecharMenuFiltro = () => { if (menuFiltro) { menuFiltro.remove(); menuFiltro = null; } };
      document.addEventListener('pointerdown', (e) => { if (menuFiltro && !menuFiltro.contains(e.target) && !e.target.closest('.pl-filtro-botao')) fecharMenuFiltro(); });
      function abrirMenuFiltro(letra) {
        terminarEdicao(true);
        fecharMenuFiltro();
        const f = dados.filtro;
        if (!f) return;
        const l2 = fimDoFiltro();
        const valores = [];
        for (let l = f.l + 1; l <= l2; l++) valores.push(textoCelula(letra + (l + 1)));
        const unicos = [...new Set(valores)].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
        const ocultos = new Set(f.ocultos[letra] || []);
        const itens = unicos.map((v) => CE.el('label', { class: 'pl-filtro-item', 'data-valor': v }, CE.el('input', { type: 'checkbox', checked: !ocultos.has(v) }), v === '' ? '(Vazias)' : v));
        const todos = CE.el('input', { type: 'checkbox', checked: !ocultos.size, onchange: (ev) => itens.forEach((i) => { i.firstChild.checked = ev.target.checked; }) });
        const ordenar = (ordem) => { fecharMenuFiltro(); ativa = ancora = fim = F.endereco(F.letraParaNumero(letra), f.l); classificar(ordem, letra); };
        const td = tds[letra + (f.l + 1)];
        menuFiltro = CE.el('div', { class: 'pl-filtro-menu', 'data-coluna': letra },
          CE.el('button', { class: 'menu-item', 'data-acao': 'filtro-az', onclick: () => ordenar('az') }, '🔤 Classificar de A a Z'),
          CE.el('button', { class: 'menu-item', 'data-acao': 'filtro-za', onclick: () => ordenar('za') }, '🔤 Classificar de Z a A'),
          CE.el('hr'),
          CE.el('label', { class: 'pl-filtro-item' }, todos, CE.el('b', {}, '(Selecionar tudo)')),
          CE.el('div', { class: 'pl-filtro-lista' }, ...itens),
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao secundario', onclick: fecharMenuFiltro }, 'Cancelar'),
            CE.el('button', { class: 'botao', 'data-acao': 'filtrar', onclick: () => {
              const escondidos = itens.filter((i) => !i.firstChild.checked).map((i) => i.dataset.valor);
              fecharMenuFiltro();
              alterar(() => { f.ocultos[letra] = escondidos; });
              const visiveis = [...Array(l2 - f.l).keys()].filter((i) => !corpoTabela.children[f.l + 1 + i].classList.contains('pl-oculta')).length;
              CE.emitir('planilha:filtrada', { coluna: letra, escondidos, mostrando: unicos.filter((v) => !escondidos.includes(v)), visiveis });
            } }, 'OK')));
        menuFiltro.style.left = Math.max(0, td.offsetLeft) + 'px';
        menuFiltro.style.top = td.offsetTop + td.offsetHeight + 'px';
        grade.append(menuFiltro);
        CE.emitir('planilha:menu-filtro', { coluna: letra });
      }

      // ---------- Destaque automático (formatação condicional) ----------
      function regraCumprida(regra, v) {
        const n = F.lerNumero(regra.valor);
        if (regra.regra === 'contem') return String(F.textoDe(v)).toLowerCase().includes(String(regra.valor).toLowerCase());
        if (regra.regra === 'igual') return n != null && typeof v === 'number' ? v === n : String(v).toLowerCase() === String(regra.valor).toLowerCase();
        if (typeof v !== 'number' || n == null) return false;
        return regra.regra === 'maior' ? v > n : v < n;
      }
      function aplicarDestaques() {
        (dados.condicionais || []).forEach((regra) => {
          const r = lerFaixa(regra.intervalo), cor = CORES_DESTAQUE[regra.cor] || CORES_DESTAQUE.vermelho;
          F.celulasDoIntervalo(F.endereco(r.c1, r.l1), F.endereco(r.c2, r.l2)).forEach((ref) => {
            const v = valorDe(ref);
            if (v !== '' && regraCumprida(regra, v)) { tds[ref].style.background = cor.fundo; tds[ref].style.color = cor.texto; tds[ref].classList.add('destacada'); }
          });
        });
      }
      function dialogoDestacar() {
        terminarEdicao(true);
        const r = ancora !== fim ? faixa() : regiaoAtual();
        const intervalo = nomeFaixa(r);
        const regra = CE.el('select', { class: 'campo', 'data-campo': 'regra' }, ...Object.entries(REGRAS_DESTAQUE).map(([id, t]) => CE.el('option', { value: id }, t)));
        const valor = CE.el('input', { class: 'campo', 'data-campo': 'valor', placeholder: 'Ex.: 6' });
        const cor = CE.el('select', { class: 'campo', 'data-campo': 'cor' }, ...Object.entries(CORES_DESTAQUE).map(([id, c]) => CE.el('option', { value: id }, c.nome)));
        const fundo = CE.el('div', { class: 'dialogo-fundo' },
          CE.el('div', { class: 'dialogo' },
            CE.el('p', {}, '🎨 Destacar células automaticamente'),
            CE.el('p', { class: 'ed-dica' }, `Nas células ${intervalo}, pintar quando o valor...`),
            regra, valor,
            CE.el('label', {}, 'Cor do destaque ', cor),
            CE.el('div', { class: 'dialogo-botoes' },
              (dados.condicionais || []).length ? CE.el('button', { class: 'botao secundario', 'data-acao': 'limpar-destaques', onclick: () => {
                fundo.remove(); alterar(() => { dados.condicionais = []; }); CE.emitir('planilha:condicional', { limpar: true });
              } }, 'Limpar destaques') : null,
              CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'),
              CE.el('button', { class: 'botao', 'data-acao': 'aplicar-destaque', onclick: () => {
                if (!valor.value.trim()) { valor.focus(); return; }
                const nova = { intervalo, regra: regra.value, valor: valor.value.trim(), cor: cor.value };
                fundo.remove();
                alterar(() => { dados.condicionais.push(nova); });
                const celulas = F.celulasDoIntervalo(F.endereco(r.c1, r.l1), F.endereco(r.c2, r.l2)).filter((ref) => valorDe(ref) !== '' && regraCumprida(nova, valorDe(ref))).length;
                CE.emitir('planilha:condicional', { ...nova, celulas });
                CE.avisar(`🎨 ${celulas} célula${celulas === 1 ? '' : 's'} destacada${celulas === 1 ? '' : 's'}. Se os valores mudarem, o destaque muda sozinho!`);
              } }, 'Aplicar'))));
        document.body.append(fundo);
        valor.focus();
      }

      // ---------- Gráficos ----------
      let graficoSelecionado = null;
      const dadosDoGrafico = (g) => CE.graficos.extrair(g, valorDe, formatoDe);
      function desenharGraficos() {
        camadaGraficos.replaceChildren(...(dados.graficos || []).map((g) => CE.el('div', {
          class: 'pl-grafico' + (graficoSelecionado === g.id ? ' selecionado' : ''), 'data-grafico': g.id, style: `left:${g.x}px;top:${g.y}px`,
        },
          CE.el('div', { class: 'pl-grafico-barra', title: 'Segure aqui e arraste para mudar o gráfico de lugar' },
            CE.el('span', {}, '✥'),
            CE.el('select', { 'data-grafico-tipo': g.id, title: 'Trocar o tipo do gráfico', onchange: (e) => {
              alterar(() => { g.tipo = e.target.value; });
              CE.emitir('planilha:grafico-tipo', { id: g.id, tipo: g.tipo });
            } }, ...Object.entries(CE.graficos.TIPOS).map(([id, t]) => CE.el('option', { value: id, selected: id === g.tipo }, `${t.icone} ${t.nome}`))),
            CE.el('button', { 'data-acao': 'remover-grafico', title: 'Apagar este gráfico', onclick: () => {
              alterar(() => { dados.graficos = dados.graficos.filter((x) => x.id !== g.id); });
              CE.emitir('planilha:grafico-removido', { id: g.id });
            } }, '✕')),
          CE.el('div', { class: 'pl-grafico-area', html: CE.graficos.desenhar(dadosDoGrafico(g), 440, 270) }))));
      }
      camadaGraficos.addEventListener('pointerdown', (e) => {
        const caixa = e.target.closest('.pl-grafico');
        if (!caixa) return;
        e.stopPropagation();
        terminarEdicao(true);
        graficoSelecionado = caixa.dataset.grafico;
        camadaGraficos.querySelectorAll('.pl-grafico').forEach((x) => x.classList.toggle('selecionado', x === caixa));
        if (!e.target.closest('.pl-grafico-barra') || e.target.closest('select, button')) return;
        e.preventDefault();
        const g = dados.graficos.find((x) => x.id === caixa.dataset.grafico);
        const ix = e.clientX, iy = e.clientY, gx = g.x, gy = g.y;
        const mover = (ev) => {
          g.x = Math.max(44, gx + ev.clientX - ix); g.y = Math.max(24, gy + ev.clientY - iy);
          caixa.style.left = g.x + 'px'; caixa.style.top = g.y + 'px';
        };
        const soltar = () => {
          document.removeEventListener('pointermove', mover);
          document.removeEventListener('pointerup', soltar);
          modificado = true; pintarSelecao();
          CE.emitir('planilha:grafico-movido', { id: g.id, x: g.x, y: g.y });
        };
        document.addEventListener('pointermove', mover);
        document.addEventListener('pointerup', soltar);
      });
      function dialogoGrafico() {
        terminarEdicao(true);
        const r = regiaoAtual();
        if (r.c1 === r.c2 && r.l1 === r.l2) { CE.avisar('Primeiro selecione os dados do gráfico: a coluna dos nomes e a dos números.'); return; }
        const g = { id: 'g' + Date.now().toString(36), tipo: 'colunas', intervalo: nomeFaixa(r), titulo: '' };
        const inicial = dadosDoGrafico(g);
        if (inicial.series.length === 1 && !/^Série/.test(inicial.series[0].nome)) g.titulo = inicial.series[0].nome;
        const previa = CE.el('div', { class: 'pl-previa-grafico' });
        // Quando tem mais de uma coluna de números, o aluno escolhe quais entram no gráfico.
        const numericas = [];
        for (let c = r.c2 > r.c1 ? r.c1 + 1 : r.c1; c <= r.c2; c++) {
          let tem = false;
          for (let l = r.l1; l <= r.l2; l++) if (typeof valorDe(F.endereco(c, l)) === 'number') tem = true;
          if (tem) numericas.push({ letra: F.numeroParaLetra(c), nome: temCabecalho(r) ? String(valorDe(F.endereco(c, r.l1))) : `Coluna ${F.numeroParaLetra(c)}` });
        }
        const escolhaSeries = numericas.length > 1 ? CE.el('div', { class: 'pl-series' }, CE.el('span', {}, 'Mostrar no gráfico:'),
          ...numericas.map((s) => CE.el('label', { 'data-serie': s.letra }, CE.el('input', { type: 'checkbox', checked: true, onchange: () => {
            g.colunas = [...escolhaSeries.querySelectorAll('input')].map((i, k) => (i.checked ? numericas[k].letra : null)).filter(Boolean);
            mostrar();
          } }), ` ${s.nome}`))) : null;
        const botoes = Object.entries(CE.graficos.TIPOS).map(([id, t]) => CE.el('button', { class: 'pl-tipo-grafico', 'data-tipo-grafico': id, onclick: () => { g.tipo = id; mostrar(); } }, CE.el('span', {}, t.icone), t.nome));
        const titulo = CE.el('input', { class: 'campo', 'data-campo': 'titulo-grafico', value: g.titulo, placeholder: 'Título do gráfico', oninput: () => { g.titulo = titulo.value; mostrar(); } });
        function mostrar() {
          previa.innerHTML = CE.graficos.desenhar(dadosDoGrafico(g), 440, 260);
          botoes.forEach((b) => b.classList.toggle('ligado', b.dataset.tipoGrafico === g.tipo));
        }
        const fundo = CE.el('div', { class: 'dialogo-fundo' },
          CE.el('div', { class: 'dialogo largo' },
            CE.el('p', {}, `📊 Inserir gráfico com os dados ${g.intervalo}`),
            CE.el('div', { class: 'pl-tipos-grafico' }, ...botoes),
            escolhaSeries,
            CE.el('label', {}, 'Título ', titulo),
            previa,
            CE.el('div', { class: 'dialogo-botoes' },
              CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'),
              CE.el('button', { class: 'botao', 'data-acao': 'inserir-grafico', onclick: () => {
                fundo.remove();
                const ref = tds[F.endereco(Math.min(COLUNAS - 1, r.c2 + 2), r.l1)];
                g.x = ref.offsetLeft; g.y = ref.offsetTop;
                graficoSelecionado = g.id;
                alterar(() => { dados.graficos.push(g); });
                const d = dadosDoGrafico(g);
                CE.emitir('planilha:grafico', { id: g.id, tipo: g.tipo, intervalo: g.intervalo, titulo: g.titulo, categorias: d.categorias.length, series: d.series.length, nomesSeries: d.series.map((x) => x.nome) });
              } }, 'Inserir gráfico'))));
        document.body.append(fundo);
        mostrar();
      }


      // ---------- Validação de dados (só aceita o que a regra deixa) ----------
      const botaoLista = CE.el('button', { class: 'pl-lista-botao', hidden: true, title: 'Escolher da lista', 'data-lista-botao': '', onmousedown: (e) => e.preventDefault() }, '▾');
      const menuLista = CE.el('div', { class: 'pl-lista-menu', hidden: true });
      grade.append(botaoLista, menuLista);
      const dentro = (ref, intervalo) => { const p = posicao(ref), r = lerFaixa(intervalo); return p.col >= r.c1 && p.col <= r.c2 && p.lin >= r.l1 && p.lin <= r.l2; };
      const regraDe = (ref) => (dados.validacoes || []).slice().reverse().find((v) => dentro(ref, v.intervalo)) || null;
      function validar(ref, texto) {
        const regra = regraDe(ref);
        if (!regra || texto === '' || String(texto).startsWith('=')) return '';
        if (regra.tipo === 'lista') {
          return regra.opcoes.some((o) => o.toLowerCase() === String(texto).trim().toLowerCase()) ? '' : `Escolha uma destas opções: ${regra.opcoes.join(', ')}.`;
        }
        const n = F.lerNumero(texto);
        if (n == null) return 'Aqui só pode número.';
        if (regra.min !== '' && regra.min != null && n < Number(regra.min)) return `O número precisa ser de ${regra.min} até ${regra.max}.`;
        if (regra.max !== '' && regra.max != null && n > Number(regra.max)) return `O número precisa ser de ${regra.min} até ${regra.max}.`;
        return '';
      }
      botaoLista.addEventListener('click', () => {
        const regra = regraDe(ativa);
        if (!regra) return;
        menuLista.replaceChildren(...regra.opcoes.map((o) => CE.el('button', { class: 'menu-item', 'data-opcao-lista': o, onmousedown: (e) => e.preventDefault(), onclick: () => {
          menuLista.hidden = true;
          confirmarEntrada(ativa, o);
          CE.emitir('planilha:lista-escolhida', { celula: ativa, valor: o });
          grade.focus({ preventScroll: true });
        } }, o)));
        menuLista.style.left = tds[ativa].offsetLeft + 'px';
        menuLista.style.top = tds[ativa].offsetTop + tds[ativa].offsetHeight + 'px';
        menuLista.hidden = !menuLista.hidden;
      });
      function dialogoValidacao() {
        terminarEdicao(true);
        const intervalo = nomeSelecao();
        const tipo = CE.el('select', { class: 'campo', 'data-validacao-tipo': '' }, CE.el('option', { value: 'lista' }, 'Lista de opções'), CE.el('option', { value: 'numero' }, 'Número entre dois valores'));
        const opcoes = CE.el('input', { class: 'campo', 'data-validacao-opcoes': '', placeholder: 'Ex.: Pago; Pendente; Atrasado' });
        const min = CE.el('input', { class: 'campo pequeno', 'data-validacao-min': '', placeholder: 'de' });
        const max = CE.el('input', { class: 'campo pequeno', 'data-validacao-max': '', placeholder: 'até' });
        const caixaLista = CE.el('label', {}, 'Opções (separe com ponto e vírgula ;)', opcoes);
        const caixaNumero = CE.el('label', { hidden: true }, 'Número de ', min, ' até ', max);
        tipo.addEventListener('change', () => { caixaLista.hidden = tipo.value !== 'lista'; caixaNumero.hidden = tipo.value === 'lista'; });
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo' },
          CE.el('p', {}, `✅ Validação de dados em ${intervalo}: a célula só vai aceitar o que você permitir.`),
          CE.el('label', {}, 'Permitir', tipo), caixaLista, caixaNumero,
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao secundario', 'data-validacao-limpar': '', onclick: () => {
              fundo.remove();
              alterar(() => { dados.validacoes = (dados.validacoes || []).filter((v) => v.intervalo !== intervalo); });
              CE.emitir('planilha:validacao', { intervalo, limpar: true });
            } }, 'Tirar a regra'),
            CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'),
            CE.el('button', { class: 'botao', 'data-validacao-ok': '', onclick: () => {
              const regra = tipo.value === 'lista'
                ? { intervalo, tipo: 'lista', opcoes: opcoes.value.split(/[;,]/).map((o) => o.trim()).filter(Boolean) }
                : { intervalo, tipo: 'numero', min: min.value.trim(), max: max.value.trim() };
              if (regra.tipo === 'lista' && regra.opcoes.length < 2) { CE.avisar('Escreva pelo menos duas opções, separadas por ponto e vírgula.'); return; }
              if (regra.tipo === 'numero' && (F.lerNumero(regra.min) == null || F.lerNumero(regra.max) == null)) { CE.avisar('Escreva os dois números: de quanto até quanto.'); return; }
              fundo.remove();
              alterar(() => { dados.validacoes = (dados.validacoes || []).filter((v) => v.intervalo !== intervalo).concat(regra); });
              CE.emitir('planilha:validacao', regra);
              CE.avisar(regra.tipo === 'lista' ? '✅ Pronto! Clique numa dessas células e use a setinha ▾ para escolher.' : '✅ Pronto! Agora essas células só aceitam números dentro do limite.');
              grade.focus({ preventScroll: true });
            } }, 'Aplicar'))));
        document.body.append(fundo);
        opcoes.focus();
      }

      // ---------- Congelar painéis (os títulos ficam parados quando rola a planilha) ----------
      function aplicarCongelar() {
        tabela.querySelectorAll('.pl-congelada, .pl-congelada-fim, .pl-congelada-col, .pl-congelada-col-fim').forEach((el) => {
          el.classList.remove('pl-congelada', 'pl-congelada-fim', 'pl-congelada-col', 'pl-congelada-col-fim');
          el.style.position = ''; el.style.top = ''; el.style.left = ''; el.style.zIndex = '';
        });
        const cg = dados.congelar;
        if (!cg) return;
        const linhas = [...corpoTabela.children];
        let topo = cabecalho.offsetHeight || 25;
        for (let l = 0; l < (cg.linhas || 0); l++) {
          const tr = linhas[l];
          [...tr.children].forEach((cel) => { cel.classList.add('pl-congelada'); if (l === cg.linhas - 1) cel.classList.add('pl-congelada-fim'); cel.style.position = 'sticky'; cel.style.top = topo + 'px'; cel.style.zIndex = cel.tagName === 'TH' ? '4' : '2'; });
          topo += tr.offsetHeight;
        }
        if (cg.colunas) {
          linhas.forEach((tr, l) => {
            let esquerda = 44;
            for (let c = 0; c < cg.colunas; c++) {
              const td = tr.children[c + 1];
              td.classList.add('pl-congelada-col'); if (c === cg.colunas - 1) td.classList.add('pl-congelada-col-fim');
              td.style.position = 'sticky'; td.style.left = esquerda + 'px'; td.style.zIndex = l < (cg.linhas || 0) ? '3' : '2';
              esquerda += dados.larguras[F.numeroParaLetra(c)] || LARGURA;
            }
          });
        }
      }
      function congelar(linhas, colunas) {
        terminarEdicao(true);
        dados.congelar = linhas || colunas ? { linhas, colunas } : null;
        modificado = true;
        recalcular();
        CE.emitir('planilha:congelada', { linhas, colunas, ligado: !!dados.congelar });
        CE.avisar(dados.congelar ? `🧊 Congelado! Role a planilha para baixo${colunas ? ' e para o lado' : ''}: ${linhas ? `a${linhas > 1 ? 's' : ''} ${linhas} primeira${linhas > 1 ? 's' : ''} linha${linhas > 1 ? 's' : ''}` : ''}${linhas && colunas ? ' e ' : ''}${colunas ? `a${colunas > 1 ? 's' : ''} ${colunas} primeira${colunas > 1 ? 's' : ''} coluna${colunas > 1 ? 's' : ''}` : ''} fica${(linhas || 0) + (colunas || 0) > 1 ? 'm' : ''} parada${(linhas || 0) + (colunas || 0) > 1 ? 's' : ''}.` : '🧊 Descongelado.');
        grade.focus({ preventScroll: true });
      }
      function dialogoCongelar() {
        const p = posicao(ativa);
        const op = (id, texto, acao) => CE.el('button', { class: 'botao secundario', 'data-congelar': id, onclick: () => { fundo.remove(); acao(); } }, texto);
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo' },
          CE.el('p', {}, '🧊 Congelar painéis: o que fica parado na tela quando você rolar a planilha?'),
          CE.el('div', { class: 'pl-opcoes-coluna' },
            op('linha', 'Congelar a 1ª linha (os títulos)', () => congelar(1, 0)),
            op('coluna', 'Congelar a 1ª coluna', () => congelar(0, 1)),
            op('celula', `Congelar acima e à esquerda de ${ativa}`, () => congelar(p.lin, p.col)),
            op('descongelar', 'Descongelar tudo', () => congelar(0, 0))),
          CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'))));
        document.body.append(fundo);
      }

      // ---------- Tabela dinâmica (resumo por categoria, com fórmulas que se atualizam) ----------
      function dialogoDinamica() {
        terminarEdicao(true);
        const r = regiaoAtual();
        if (r.l2 <= r.l1 || !temCabecalho(r)) { CE.avisar('Clique dentro de uma tabela com títulos na 1ª linha (ex.: Data, Categoria, Valor) antes.'); return; }
        const cols = []; for (let c = r.c1; c <= r.c2; c++) cols.push({ c, letra: F.numeroParaLetra(c), titulo: String(valorDe(F.endereco(c, r.l1))) });
        const sel = (attr, padrao) => CE.el('select', { class: 'campo', [attr]: '' }, ...cols.map((x, i) => CE.el('option', { value: x.letra, selected: i === padrao }, x.titulo)));
        const numericas = cols.filter((x) => typeof valorDe(F.endereco(x.c, r.l1 + 1)) === 'number');
        const agrupar = sel('data-dinamica-linhas', cols.findIndex((x) => typeof valorDe(F.endereco(x.c, r.l1 + 1)) === 'string' && x !== cols[0]) === -1 ? 0 : cols.findIndex((x) => typeof valorDe(F.endereco(x.c, r.l1 + 1)) === 'string' && x !== cols[0]));
        const valores = sel('data-dinamica-valores', numericas.length ? cols.indexOf(numericas[numericas.length - 1]) : cols.length - 1);
        const operacao = CE.el('select', { class: 'campo', 'data-dinamica-operacao': '' }, CE.el('option', { value: 'soma' }, 'Soma'), CE.el('option', { value: 'contagem' }, 'Contagem (quantas vezes)'), CE.el('option', { value: 'media' }, 'Média'));
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo' },
          CE.el('p', {}, `📋 Tabela dinâmica de ${nomeFaixa(r)}: um resumo da tabela, separado por categoria.`),
          CE.el('label', {}, 'Separar por (linhas)', agrupar),
          CE.el('label', {}, 'Calcular', operacao),
          CE.el('label', {}, 'De (valores)', valores),
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'),
            CE.el('button', { class: 'botao', 'data-dinamica-ok': '', onclick: () => { fundo.remove(); criarDinamica(r, agrupar.value, valores.value, operacao.value); } }, 'Criar resumo'))));
        document.body.append(fundo);
      }
      function criarDinamica(r, letraGrupo, letraValor, operacao) {
        const cg = F.letraParaNumero(letraGrupo);
        const grupos = [];
        for (let l = r.l1 + 1; l <= r.l2; l++) { const v = valorDe(F.endereco(cg, l)); if (v !== '' && !grupos.some((g) => String(g).toLowerCase() === String(v).toLowerCase())) grupos.push(v); }
        grupos.sort((a, b) => String(a).localeCompare(String(b), 'pt-BR', { numeric: true }));
        const destino = r.c2 + 2;
        if (destino + 1 >= COLUNAS || r.l1 + grupos.length + 1 >= LINHAS) { CE.avisar('Não tem espaço ao lado da tabela para o resumo.'); return; }
        const faixaG = `${letraGrupo}${r.l1 + 2}:${letraGrupo}${r.l2 + 1}`, faixaV = `${letraValor}${r.l1 + 2}:${letraValor}${r.l2 + 1}`;
        const tituloV = String(valorDe(F.endereco(F.letraParaNumero(letraValor), r.l1)));
        const nomeOp = { soma: 'Soma', contagem: 'Contagem', media: 'Média' }[operacao];
        const L1 = F.numeroParaLetra(destino), L2 = F.numeroParaLetra(destino + 1);
        const formula = (ref) => (operacao === 'soma' ? `=SOMASE(${faixaG};${ref};${faixaV})` : operacao === 'contagem' ? `=CONT.SE(${faixaG};${ref})` : `=MÉDIASE(${faixaG};${ref};${faixaV})`);
        const ok = alterar(() => {
          const pos = (c, l) => F.endereco(c, l);
          const por = (ref, v, f = {}) => { dados.celulas[ref] = { v: String(v), f }; };
          por(pos(destino, r.l1), String(valorDe(F.endereco(cg, r.l1))), { negrito: true, fundo: '#dbe8fb' });
          por(pos(destino + 1, r.l1), `${nomeOp} de ${tituloV}`, { negrito: true, fundo: '#dbe8fb' });
          const formatoV = formatoDe(F.endereco(F.letraParaNumero(letraValor), r.l1 + 1)).formato;
          grupos.forEach((g, i) => {
            const l = r.l1 + 1 + i;
            por(pos(destino, l), String(g));
            por(pos(destino + 1, l), formula(`${L1}${l + 1}`), operacao === 'contagem' ? {} : (formatoV ? { formato: formatoV } : {}));
          });
          const lt = r.l1 + 1 + grupos.length;
          por(pos(destino, lt), 'Total geral', { negrito: true });
          por(pos(destino + 1, lt), operacao === 'media' ? `=MÉDIA(${faixaV})` : operacao === 'contagem' ? `=SOMA(${L2}${r.l1 + 2}:${L2}${lt})` : `=SOMA(${L2}${r.l1 + 2}:${L2}${lt})`, { negrito: true, ...(operacao !== 'contagem' && formatoDe(F.endereco(F.letraParaNumero(letraValor), r.l1 + 1)).formato ? { formato: formatoDe(F.endereco(F.letraParaNumero(letraValor), r.l1 + 1)).formato } : {}) });
          if (!dados.larguras[L2]) dados.larguras[L2] = 150;
        });
        if (ok === false) return;
        aplicarLarguras();
        recalcular();
        selecionarFaixa(F.endereco(destino, r.l1), F.endereco(destino + 1, r.l1 + 1 + grupos.length));
        CE.emitir('planilha:dinamica', { agrupar: letraGrupo, valores: letraValor, operacao, destino: F.endereco(destino, r.l1), grupos: grupos.map(String), total: valorDe(F.endereco(destino + 1, r.l1 + 1 + grupos.length)) });
        CE.avisar(`📋 Resumo pronto em ${L1}${r.l1 + 1}! Se você mudar a tabela, o resumo muda junto.`);
      }

      // ---------- Proteger planilha ----------
      async function alternarProtecao() {
        terminarEdicao(true);
        if (dados.protecao) {
          if (dados.protecao.senha) {
            const senha = await CE.perguntar('🔓 Para desproteger, digite a senha da planilha:');
            if (senha == null) return;
            if (senha !== dados.protecao.senha) { CE.avisar('Senha errada. A planilha continua protegida.'); CE.emitir('planilha:protecao', { ligado: true, senhaErrada: true }); return; }
          }
          dados.protecao = null;
        } else {
          const senha = await CE.perguntar('🔒 Proteger a planilha: escolha uma senha para tirar a proteção depois (ou deixe vazio para não usar senha).', '');
          dados.protecao = { senha: senha || '' };
        }
        modificado = true;
        atualizarBotaoProtecao();
        recalcular();
        CE.emitir('planilha:protecao', { ligado: !!dados.protecao, senha: !!(dados.protecao && dados.protecao.senha), liberadas: (dados.liberadas || []).length });
        CE.avisar(dados.protecao ? `🔒 Planilha protegida. ${(dados.liberadas || []).length ? 'Só as células liberadas podem ser mudadas.' : 'Nenhuma célula pode ser mudada.'}` : '🔓 Planilha desprotegida.');
      }
      function liberarCelulas() {
        if (dados.protecao) { CE.avisar('Desproteja a planilha antes de liberar células.'); return; }
        const refs = celulasDaSelecao();
        const todas = refs.every((r) => (dados.liberadas || []).includes(r));
        dados.liberadas = todas ? (dados.liberadas || []).filter((r) => !refs.includes(r)) : [...new Set([...(dados.liberadas || []), ...refs])];
        modificado = true;
        recalcular();
        CE.emitir('planilha:liberadas', { intervalo: nomeSelecao(), liberadas: dados.liberadas.length, liberar: !todas });
        CE.avisar(todas ? `As células ${nomeSelecao()} voltaram a ser travadas.` : `🔓 ${nomeSelecao()} liberada${refs.length > 1 ? 's' : ''}: quando proteger, ainda dá para escrever ali.`);
      }

      // ---------- Imprimir (área de impressão, orientação e ajuste) ----------
      function areaUsada() {
        let c2 = -1, l2 = -1;
        Object.keys(dados.celulas).forEach((ref) => { if (entradaDe(ref) === '') return; const p = posicao(ref); c2 = Math.max(c2, p.col); l2 = Math.max(l2, p.lin); });
        return c2 < 0 ? null : { c1: 0, l1: 0, c2, l2 };
      }
      function dialogoImprimir() {
        terminarEdicao(true);
        const usada = areaUsada();
        if (!usada) { CE.avisar('A planilha está vazia: não tem nada para imprimir.'); return; }
        const temSelecao = ancora !== fim;
        const area = CE.el('select', { class: 'campo', 'data-imprimir-area': '' }, CE.el('option', { value: 'tudo' }, `Toda a planilha (${nomeFaixa(usada)})`), CE.el('option', { value: 'selecao', disabled: !temSelecao, selected: temSelecao }, `Só a seleção (${nomeSelecao()})`));
        const orientacao = CE.el('select', { class: 'campo', 'data-imprimir-orientacao': '' }, CE.el('option', { value: 'retrato' }, '📄 Retrato (em pé)'), CE.el('option', { value: 'paisagem' }, '📃 Paisagem (deitada)'));
        const ajustar = CE.el('input', { type: 'checkbox', 'data-imprimir-ajustar': '' });
        const grades = CE.el('input', { type: 'checkbox', checked: true, 'data-imprimir-grade': '' });
        const previa = CE.el('div', { class: 'pl-previa' });
        const resumo = CE.el('p', { class: 'ed-dica', 'data-imprimir-paginas': '' });
        const calcular = () => {
          const r = area.value === 'selecao' ? faixa() : usada;
          const cols = r.c2 - r.c1 + 1, lins = r.l2 - r.l1 + 1;
          const [porCol, porLin] = orientacao.value === 'paisagem' ? [12, 28] : [7, 42];
          const paginas = ajustar.checked ? 1 : Math.ceil(cols / porCol) * Math.ceil(lins / porLin);
          const linhas = [];
          for (let l = r.l1; l <= Math.min(r.l2, r.l1 + 14); l++) {
            const cel = []; for (let c = r.c1; c <= Math.min(r.c2, r.c1 + 9); c++) { const ref = F.endereco(c, l); cel.push(`<td>${CE.escapar(F.textoDe(valorDe(ref), formatoDe(ref).formato))}</td>`); }
            linhas.push(`<tr>${cel.join('')}</tr>`);
          }
          previa.className = `pl-previa ${orientacao.value}${grades.checked ? ' com-grade' : ''}`;
          previa.innerHTML = `<table>${linhas.join('')}</table>`;
          resumo.textContent = `Vai sair em ${paginas} folha${paginas > 1 ? 's' : ''}.${paginas > 1 && !ajustar.checked ? ' Dica: "Ajustar tudo em 1 página" ou a orientação Paisagem economizam papel.' : ''}`;
          resumo.dataset.imprimirPaginas = String(paginas);
          return { r, paginas };
        };
        [area, orientacao, ajustar, grades].forEach((x) => x.addEventListener('change', calcular));
        const impressoras = CE.config ? CE.config.impressoras().map((i) => i.nome) : ['Impressora da sala (treino)'];
        const seletorImpressora = CE.el('select', { class: 'campo' }, ...impressoras.map((n) => CE.el('option', { value: n }, n)));
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo largo' },
          CE.el('p', {}, '🖨️ Imprimir planilha'),
          CE.el('div', { class: 'ed-imprimir' }, previa, CE.el('div', { class: 'ed-imprimir-opcoes' },
            CE.el('label', {}, 'Impressora', seletorImpressora),
            CE.el('label', {}, 'O que imprimir', area),
            CE.el('label', {}, 'Orientação', orientacao),
            CE.el('label', { class: 'pl-check' }, ajustar, ' Ajustar tudo em 1 página'),
            CE.el('label', { class: 'pl-check' }, grades, ' Imprimir as linhas de grade'),
            resumo)),
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'),
            CE.el('button', { class: 'botao', 'data-acao': 'confirmar-impressao', onclick: () => {
              const { r, paginas } = calcular();
              fundo.remove();
              CE.avisar(`🖨️ Imprimindo ${paginas} folha${paginas > 1 ? 's' : ''} de "${nomeArquivo || 'Planilha sem nome'}"...`);
              CE.emitir('planilha:impressa', { area: area.value, intervalo: nomeFaixa(r), orientacao: orientacao.value, ajustar: ajustar.checked, grade: grades.checked, paginas, impressora: seletorImpressora.value });
            } }, 'Imprimir'))));
        document.body.append(fundo);
        calcular();
      }
      const botaoProtecao = CE.el('button', { class: 'ferramenta texto', 'data-comando': 'proteger', title: 'Proteger a planilha para ninguém mudar sem querer', onmousedown: (e) => e.preventDefault(), onclick: () => alternarProtecao() }, '🔒 Proteger');
      function atualizarBotaoProtecao() { botaoProtecao.textContent = dados.protecao ? '🔓 Desproteger' : '🔒 Proteger'; botaoProtecao.classList.toggle('ligado', !!dados.protecao); }

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
        dados = planilhaVazia();
        nomeArquivo = null; modificado = false; desfazer = []; refazer = [];
        aplicarLarguras(); selecionar('A1'); recalcular(); atualizarBotaoProtecao();
        CE.emitir('planilha:nova');
      }
      function carregar(arquivo) {
        try { dados = JSON.parse(arquivo.conteudo || '{}'); } catch { dados = {}; }
        dados = { ...planilhaVazia(), ...dados };
        nomeArquivo = arquivo.nome; modificado = false; desfazer = []; refazer = [];
        aplicarLarguras(); selecionar('A1'); recalcular(); atualizarBotaoProtecao();
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
          CE.el('div', { class: 'ferramentas-grupo' },
            fb('classificar-az', '🔤 A→Z', 'Classificar em ordem crescente (de A a Z, do menor para o maior)', () => classificar('az'), 'texto'),
            fb('classificar-za', 'Z→A', 'Classificar em ordem decrescente (de Z a A, do maior para o menor)', () => classificar('za'), 'texto'),
            fb('filtro', '🔽 Filtro', 'Ligar ou desligar o filtro (mostrar só algumas linhas)', alternarFiltro, 'texto'),
            fb('grafico', '📊 Gráfico', 'Fazer um gráfico com os dados selecionados', dialogoGrafico, 'texto'),
            fb('destacar', '🎨 Destacar', 'Pintar sozinho as células que seguem uma regra (formatação condicional)', dialogoDestacar, 'texto')),
          CE.el('div', { class: 'ferramentas-grupo' },
            fb('congelar', '🧊 Congelar', 'Congelar painéis: os títulos ficam parados quando você rola a planilha', dialogoCongelar, 'texto'),
            fb('validacao', '✅ Validação', 'Validação de dados: a célula só aceita o que você permitir (lista de opções ou números)', dialogoValidacao, 'texto'),
            fb('dinamica', '📋 Tabela dinâmica', 'Resumo da tabela por categoria (soma, contagem ou média)', dialogoDinamica, 'texto'),
            fb('liberar', '🔓 Liberar células', 'Deixar as células selecionadas livres para escrever mesmo com a planilha protegida', liberarCelulas, 'texto'),
            botaoProtecao,
            fb('imprimir', '🖨️ Imprimir', 'Imprimir a planilha (escolher a área, deitada ou em pé)', dialogoImprimir, 'texto')),
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
        graficos: () => (dados.graficos || []).map((g) => ({ ...g, dados: dadosDoGrafico(g) })),
        filtro: () => dados.filtro,
        condicionais: () => dados.condicionais || [],
        linhaVisivel: (n) => !corpoTabela.children[n - 1].classList.contains('pl-oculta'),
        destacada: (ref) => tds[String(ref).toUpperCase()].classList.contains('destacada'),
        congelar: () => dados.congelar,
        validacoes: () => dados.validacoes || [],
        protecao: () => dados.protecao,
        liberadas: () => dados.liberadas || [],
      };
      CE.planilhaAtiva = api;
      const pararAtivar = CE.ouvir('janela:ativada', (d) => { if (d.app === 'planilha') CE.planilhaAtiva = api; });

      return {
        receber(arg) {
          if (!arg || !arg.arquivo) return;
          if (modificado) CE.confirmar('A planilha atual não foi salva. Abrir outra mesmo assim?').then((sim) => sim && carregar(arg.arquivo));
          else carregar(arg.arquivo);
        },
        aoFechar(opcoes = {}) {
          if (modificado && !podeFechar && !opcoes.forcado) {
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
          fecharMenuFiltro();
          if (CE.planilhaAtiva === api) CE.planilhaAtiva = null;
          return true;
        },
      };
    },
  });
})();
