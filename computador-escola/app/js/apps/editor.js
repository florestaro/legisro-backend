// Editor de Texto (parecido com o Word): escrever, formatar, salvar e abrir documentos.
(function () {
  const FONTES = ['Calibri', 'Arial', 'Times New Roman', 'Verdana', 'Comic Sans MS', 'Courier New'];
  const TAMANHOS = [['1', '8'], ['2', '10'], ['3', '12'], ['4', '14'], ['5', '18'], ['6', '24'], ['7', '36']];
  const NOMES_COMANDOS = {
    bold: 'negrito', italic: 'itálico', underline: 'sublinhado',
    justifyLeft: 'alinhar à esquerda', justifyCenter: 'centralizar', justifyRight: 'alinhar à direita',
    insertUnorderedList: 'lista com marcadores', insertOrderedList: 'lista numerada',
    fontName: 'fonte', fontSize: 'tamanho da letra', foreColor: 'cor da letra', undo: 'desfazer', redo: 'refazer',
  };

  CE.registrarApp({
    id: 'editor',
    nome: 'Editor de Texto',
    icone: '📝',
    largura: 860,
    altura: 600,
    abrir(corpo, janela, argumento) {
      let nomeArquivo = null;
      let modificado = false;
      let podeFechar = false;
      let aviso = null;

      const pagina = CE.el('div', { class: 'editor-pagina', contenteditable: 'true', spellcheck: 'false', 'aria-label': 'Página do documento' });
      const status = CE.el('div', { class: 'editor-status' });

      function atualizarStatus() {
        const texto = pagina.innerText.trim();
        const palavras = texto ? texto.split(/\s+/).length : 0;
        status.textContent = `${nomeArquivo || 'Documento sem nome'}${modificado ? ' (não salvo)' : ''} · ${palavras} palavra${palavras === 1 ? '' : 's'}`;
        janela.definirTitulo(nomeArquivo || 'Documento sem nome');
      }

      function textoSelecionado() {
        const sel = window.getSelection();
        return sel && pagina.contains(sel.anchorNode) ? sel.toString() : '';
      }

      // Guarda a última seleção da página: ao clicar numa caixinha (fonte, tamanho, cor)
      // o foco sai do texto, e a seleção precisa voltar antes de aplicar a formatação.
      let ultimaFaixa = null;

      function executar(comando, valor) {
        pagina.focus();
        if (ultimaFaixa) {
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(ultimaFaixa);
        }
        document.execCommand(comando, false, valor);
        atualizarBotoes();
        modificado = true;
        atualizarStatus();
        CE.emitir('editor:formatado', {
          comando, nome: NOMES_COMANDOS[comando] || comando, valor,
          selecionado: textoSelecionado(),
          ativo: ['bold', 'italic', 'underline'].includes(comando) ? document.queryCommandState(comando) : true,
          html: pagina.innerHTML,
        });
      }

      const botao = (comando, rotulo, dica, classe = '') =>
        CE.el('button', {
          class: 'ferramenta ' + classe, 'data-comando': comando, title: dica,
          onmousedown: (e) => e.preventDefault(), // não perde a seleção do texto
          onclick: () => executar(comando),
        }, rotulo);

      const seletorFonte = CE.el('select', { class: 'ferramenta-select', 'data-comando': 'fontName', title: 'Fonte (tipo de letra)', onchange: (e) => executar('fontName', e.target.value) },
        ...FONTES.map((f) => CE.el('option', { value: f, style: `font-family:${f}` }, f)));
      const seletorTamanho = CE.el('select', { class: 'ferramenta-select pequeno', 'data-comando': 'fontSize', title: 'Tamanho da letra', onchange: (e) => executar('fontSize', e.target.value) },
        ...TAMANHOS.map(([v, r]) => CE.el('option', { value: v, selected: v === '3' }, r)));
      const seletorCor = CE.el('input', { type: 'color', class: 'ferramenta-cor', 'data-comando': 'foreColor', value: '#000000', title: 'Cor da letra', onchange: (e) => executar('foreColor', e.target.value) });

      function atualizarBotoes() {
        corpo.querySelectorAll('[data-comando="bold"],[data-comando="italic"],[data-comando="underline"]').forEach((b) => {
          b.classList.toggle('ligado', document.queryCommandState(b.dataset.comando));
        });
      }

      async function salvar(comoNovo = false) {
        let nome = nomeArquivo;
        if (!nome || comoNovo) {
          nome = await CE.perguntar('Qual o nome do documento?', nomeArquivo || 'Meu documento');
          if (!nome) return false;
        }
        await CE.sessao.salvarArquivo({ nome, tipo: 'documento', conteudo: pagina.innerHTML });
        nomeArquivo = nome;
        modificado = false;
        atualizarStatus();
        CE.avisar(`Documento "${nome}" salvo!`);
        return true;
      }

      async function novo() {
        if (modificado && await CE.confirmar('Quer salvar o documento atual antes de começar um novo?')) {
          if (!await salvar()) return;
        }
        pagina.innerHTML = '';
        ultimaFaixa = null;
        nomeArquivo = null;
        modificado = false;
        atualizarStatus();
        CE.emitir('editor:novo');
        pagina.focus();
      }

      async function carregar(arquivo) {
        pagina.innerHTML = arquivo.conteudo || '';
        ultimaFaixa = null;
        nomeArquivo = arquivo.nome;
        modificado = false;
        atualizarStatus();
        CE.emitir('arquivo:aberto', { nome: arquivo.nome, tipo: 'documento' });
      }

      const barraFerramentas = CE.el('div', { class: 'ferramentas' },
        CE.el('div', { class: 'ferramentas-grupo' },
          CE.el('button', { class: 'ferramenta texto', 'data-comando': 'novo', title: 'Começar um documento novo', onclick: novo }, '📄 Novo'),
          CE.el('button', { class: 'ferramenta texto', 'data-comando': 'abrir', title: 'Abrir um documento salvo', onclick: () => CE.janelas.abrir('arquivos') }, '📂 Abrir'),
          CE.el('button', { class: 'ferramenta texto', 'data-comando': 'salvar', title: 'Salvar o documento', onclick: () => salvar() }, '💾 Salvar'),
        ),
        CE.el('div', { class: 'ferramentas-grupo' }, botao('undo', '↶', 'Desfazer'), botao('redo', '↷', 'Refazer')),
        CE.el('div', { class: 'ferramentas-grupo' }, seletorFonte, seletorTamanho),
        CE.el('div', { class: 'ferramentas-grupo' },
          botao('bold', 'N', 'Negrito (letra mais grossa)', 'negrito'),
          botao('italic', 'I', 'Itálico (letra inclinada)', 'italico'),
          botao('underline', 'S', 'Sublinhado (risco embaixo)', 'sublinhado'),
          seletorCor,
        ),
        CE.el('div', { class: 'ferramentas-grupo' },
          botao('justifyLeft', '⇤', 'Alinhar à esquerda'),
          botao('justifyCenter', '≡', 'Centralizar'),
          botao('justifyRight', '⇥', 'Alinhar à direita'),
          botao('insertUnorderedList', '•', 'Lista com marcadores'),
          botao('insertOrderedList', '1.', 'Lista numerada'),
        ),
      );

      let esperaTexto = null;
      pagina.addEventListener('input', () => {
        modificado = true;
        atualizarStatus();
        clearTimeout(esperaTexto);
        esperaTexto = setTimeout(() => CE.emitir('editor:texto', { texto: pagina.innerText, html: pagina.innerHTML }), 400);
      });
      document.addEventListener('selectionchange', () => {
        if (!corpo.isConnected) return;
        const s = window.getSelection();
        if (s.rangeCount && pagina.contains(s.getRangeAt(0).commonAncestorContainer)) ultimaFaixa = s.getRangeAt(0).cloneRange();
        const sel = textoSelecionado();
        atualizarBotoes();
        if (sel.trim()) CE.emitir('editor:selecao', { selecionado: sel });
      });
      pagina.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); salvar(); }
      });

      corpo.classList.add('editor');
      corpo.append(barraFerramentas, CE.el('div', { class: 'editor-fundo' }, pagina), status);
      atualizarStatus();
      if (argumento && argumento.arquivo) carregar(argumento.arquivo);
      setTimeout(() => pagina.focus(), 50);

      return {
        receber(arg) {
          if (!arg || !arg.arquivo) return;
          if (modificado) {
            CE.confirmar('O documento atual não foi salvo. Abrir outro mesmo assim?').then((sim) => sim && carregar(arg.arquivo));
          } else carregar(arg.arquivo);
        },
        aoFechar() {
          if (!modificado || podeFechar) return true;
          if (aviso) return false;
          aviso = CE.confirmar('Você não salvou o documento. Quer salvar antes de fechar?').then(async (sim) => {
            aviso = null;
            if (sim && !await salvar()) return;
            podeFechar = true;
            janela.fechar();
          });
          return false;
        },
      };
    },
  });
})();
