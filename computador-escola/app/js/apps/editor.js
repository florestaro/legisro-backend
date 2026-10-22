// Editor de Texto (parecido com o Word): escrever, formatar, tabelas, imagens, modelos prontos,
// corretor ortográfico, imprimir, salvar e abrir documentos.
(function () {
  const FONTES = ['Calibri', 'Arial', 'Times New Roman', 'Verdana', 'Comic Sans MS', 'Courier New'];
  const TAMANHOS = [['1', '8'], ['2', '10'], ['3', '12'], ['4', '14'], ['5', '18'], ['6', '24'], ['7', '36']];
  const ESPACAMENTOS = [['1', '1,0'], ['1.15', '1,15'], ['1.5', '1,5'], ['2', '2,0']];
  const MARGENS = { estreita: '36px 40px', normal: '72px 80px', larga: '96px 120px' };
  const NOMES_COMANDOS = {
    bold: 'negrito', italic: 'itálico', underline: 'sublinhado',
    justifyLeft: 'alinhar à esquerda', justifyCenter: 'centralizar', justifyRight: 'alinhar à direita', justifyFull: 'justificar',
    insertUnorderedList: 'lista com marcadores', insertOrderedList: 'lista numerada', indent: 'aumentar recuo', outdent: 'diminuir recuo',
    fontName: 'fonte', fontSize: 'tamanho da letra', foreColor: 'cor da letra', undo: 'desfazer', redo: 'refazer',
    lineHeight: 'espaçamento entre linhas', inserirTabela: 'tabela', inserirLinhaTabela: 'linha na tabela', inserirImagem: 'imagem',
    insertHorizontalRule: 'linha horizontal', margem: 'margens',
  };

  // Erros comuns de português -> forma certa (o corretor funciona sem internet).
  const CORRECOES = {
    concerteza: 'com certeza', derrepente: 'de repente', excessão: 'exceção', nescessário: 'necessário', nessesário: 'necessário',
    encino: 'ensino', previlégio: 'privilégio', mendingo: 'mendigo', cabeleleiro: 'cabeleireiro', beneficiente: 'beneficente',
    impecilho: 'empecilho', iorgute: 'iogurte', mortandela: 'mortadela', asterístico: 'asterisco', célebro: 'cérebro',
    poblema: 'problema', pobrema: 'problema', adevogado: 'advogado', trabesseiro: 'travesseiro', menas: 'menos', seje: 'seja',
    esteje: 'esteja', ezemplo: 'exemplo', sombrancelha: 'sobrancelha', bicicreta: 'bicicleta', largatixa: 'lagartixa', xuxu: 'chuchu',
    previnir: 'prevenir', cidadões: 'cidadãos', quizer: 'quiser', trousse: 'trouxe', trouse: 'trouxe', atravez: 'através',
    apartir: 'a partir', porisso: 'por isso', enchergar: 'enxergar', ancioso: 'ansioso', cançado: 'cansado', serto: 'certo',
    oje: 'hoje', tambem: 'também', voce: 'você', nao: 'não', entao: 'então', ate: 'até', tbm: 'também', vc: 'você',
    obrigada: null, agradesço: 'agradeço', concerto: null, socego: 'sossego', ascensor: null, exitar: 'hesitar', analizar: 'analisar',
    pesquizar: 'pesquisar', pesquiza: 'pesquisa', almoso: 'almoço', cosinha: 'cozinha', cozinhero: 'cozinheiro', presizo: 'preciso',
    precizo: 'preciso', rezolver: 'resolver', fassa: 'faça', faço: null, conciencia: 'consciência', excelente: null, excelênte: 'excelente',
  };
  Object.keys(CORRECOES).forEach((k) => { if (CORRECOES[k] === null) delete CORRECOES[k]; });

  const hoje = () => new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  const campo = (t) => `<span class="campo-modelo">[${t}]</span>`;
  const MODELOS = {
    branco: { nome: 'Documento em branco', html: () => '' },
    carta: {
      nome: 'Carta pessoal',
      html: () => `<div>${campo('Sua cidade')}, ${hoje()}.</div><div><br></div><div>${campo('Querido(a) nome da pessoa')},</div><div><br></div>
        <div>${campo('Escreva aqui a sua mensagem: como você está, as novidades e o que quiser contar.')}</div><div><br></div>
        <div>Um grande abraço,</div><div>${campo('Seu nome')}</div>`,
    },
    curriculo: {
      nome: 'Currículo',
      html: () => `<div style="text-align: center;"><b><font size="6">${campo('Seu nome completo')}</font></b></div>
        <div style="text-align: center;">${campo('Endereço')} · ${campo('Telefone')} · ${campo('E-mail')}</div><hr>
        <div><b>OBJETIVO</b></div><div>${campo('Ex.: Vaga de auxiliar administrativo')}</div><div><br></div>
        <div><b>FORMAÇÃO</b></div><ul><li>${campo('Ex.: Ensino médio completo — Escola Estadual ... (2015)')}</li><li>${campo('Ex.: Curso de Informática Básica — Computador Escola (2025)')}</li></ul>
        <div><b>EXPERIÊNCIA</b></div><ul><li>${campo('Empresa — cargo — de 2019 a 2023: o que você fazia')}</li></ul>
        <div><b>HABILIDADES</b></div><ul><li>${campo('Ex.: Digitação e Editor de Texto')}</li><li>${campo('Ex.: Atendimento ao público')}</li></ul>
        <div><b>INFORMAÇÕES ADICIONAIS</b></div><div>${campo('Ex.: Disponibilidade de horário')}</div>`,
    },
    requerimento: {
      nome: 'Requerimento',
      html: () => `<div><b>Ilmo(a). Sr(a). ${campo('cargo da pessoa, ex.: Diretor(a) da Escola Estadual ...')}</b></div><div><br></div>
        <div style="text-align: justify;">Eu, ${campo('seu nome completo')}, ${campo('nacionalidade')}, portador(a) do RG nº ${campo('número')}, residente à ${campo('endereço completo')}, venho respeitosamente requerer ${campo('o que você está pedindo, ex.: a minha declaração de matrícula')}, pelo seguinte motivo: ${campo('explique o motivo')}.</div><div><br></div>
        <div>Nestes termos, peço deferimento.</div><div><br></div>
        <div>${campo('Cidade')}, ${hoje()}.</div><div><br></div><div><br></div>
        <div style="text-align: center;">_______________________________________</div><div style="text-align: center;">${campo('Seu nome')}</div>`,
    },
    recibo: {
      nome: 'Recibo',
      html: () => `<div style="text-align: center;"><b><font size="6">RECIBO</font></b></div><div><br></div>
        <div style="text-align: right;"><b>Valor: R$ ${campo('valor')}</b></div><div><br></div>
        <div style="text-align: justify;">Recebi de ${campo('nome de quem pagou')} a quantia de R$ ${campo('valor')} (${campo('valor por extenso')}), referente a ${campo('motivo do pagamento')}.</div><div><br></div>
        <div>${campo('Cidade')}, ${hoje()}.</div><div><br></div><div style="text-align: center;">_______________________________________</div><div style="text-align: center;">${campo('Seu nome')}</div>`,
    },
  };
  const FIGURAS = ['🌻', '🎂', '🏠', '🐶', '🐱', '⭐', '❤️', '🎉', '🌳', '☀️', '⚽', '📚'];

  function emojiParaImagem(emoji) {
    const tela = document.createElement('canvas');
    tela.width = tela.height = 160;
    const ctx = tela.getContext('2d');
    ctx.font = '120px "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 80, 90);
    return tela.toDataURL('image/png');
  }

  CE.registrarApp({
    id: 'editor',
    nome: 'Editor de Texto',
    icone: '📝',
    largura: 900,
    altura: 620,
    abrir(corpo, janela, argumento) {
      let nomeArquivo = null;
      let modificado = false;
      let podeFechar = false;
      let aviso = null;
      let margem = 'normal';

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
      function recuperarSelecao() {
        pagina.focus();
        if (ultimaFaixa) {
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(ultimaFaixa);
        }
      }

      function avisarFormatacao(comando, valor, extra = {}) {
        atualizarBotoes();
        modificado = true;
        atualizarStatus();
        CE.emitir('editor:formatado', {
          comando, nome: NOMES_COMANDOS[comando] || comando, valor,
          selecionado: textoSelecionado(),
          ativo: ['bold', 'italic', 'underline'].includes(comando) ? document.queryCommandState(comando) : true,
          html: pagina.innerHTML, ...extra,
        });
      }

      function executar(comando, valor) {
        recuperarSelecao();
        document.execCommand(comando, false, valor);
        avisarFormatacao(comando, valor);
      }

      // Espaçamento entre linhas: vale para os parágrafos que estão selecionados.
      function aplicarEspacamento(valor) {
        recuperarSelecao();
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const faixa = sel.getRangeAt(0);
        let blocos = [...pagina.querySelectorAll('div, p, li, h1, h2, h3')].filter((b) => faixa.intersectsNode(b) && !b.querySelector('div, p, li'));
        if (!blocos.length) {
          document.execCommand('formatBlock', false, 'div');
          blocos = [...pagina.querySelectorAll('div, p, li')].filter((b) => faixa.intersectsNode(b) && !b.querySelector('div, p, li'));
        }
        blocos.forEach((b) => { b.style.lineHeight = valor; });
        avisarFormatacao('lineHeight', valor);
      }

      function aplicarMargem(valor, avisar = true) {
        margem = MARGENS[valor] ? valor : 'normal';
        pagina.style.padding = MARGENS[margem];
        seletorMargem.value = margem;
        if (avisar) avisarFormatacao('margem', margem);
      }

      // ---------- Tabela e imagem ----------

      async function inserirTabela() {
        const linhas = Number(await CE.perguntar('Quantas LINHAS a tabela vai ter?', '3'));
        if (!linhas) return;
        const colunas = Number(await CE.perguntar('E quantas COLUNAS?', '2'));
        if (!colunas) return;
        const l = Math.min(Math.max(linhas, 1), 30), c = Math.min(Math.max(colunas, 1), 8);
        const html = `<table class="tabela-doc"><tbody>${Array.from({ length: l }, () => `<tr>${'<td><br></td>'.repeat(c)}</tr>`).join('')}</tbody></table><div><br></div>`;
        recuperarSelecao();
        document.execCommand('insertHTML', false, html);
        avisarFormatacao('inserirTabela', `${l}x${c}`, { linhas: l, colunas: c });
      }

      function inserirLinhaTabela() {
        recuperarSelecao();
        const sel = window.getSelection();
        const celula = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement).closest('td');
        if (!celula || !pagina.contains(celula)) { CE.avisar('Clique dentro de uma tabela primeiro.'); return; }
        const linha = celula.parentElement;
        const nova = linha.cloneNode(true);
        nova.querySelectorAll('td').forEach((td) => { td.innerHTML = '<br>'; });
        linha.after(nova);
        avisarFormatacao('inserirLinhaTabela');
      }

      async function inserirImagem() {
        const desenhos = (await CE.sessao.arquivos()).filter((a) => a.tipo === 'imagem' && !a.naLixeira);
        const escolher = (src, origem) => {
          fundo.remove();
          recuperarSelecao();
          document.execCommand('insertHTML', false, `<img src="${src}" class="imagem-doc" alt="Imagem"><div><br></div>`);
          avisarFormatacao('inserirImagem', origem, { origem });
        };
        const fundo = CE.el('div', { class: 'dialogo-fundo' },
          CE.el('div', { class: 'dialogo largo' },
            CE.el('p', {}, '🖼️ Escolha uma imagem para colocar no documento:'),
            desenhos.length ? CE.el('strong', {}, 'Seus desenhos') : null,
            desenhos.length ? CE.el('div', { class: 'ed-galeria' }, ...desenhos.map((d) => CE.el('button', { class: 'ed-galeria-item', 'data-imagem': d.nome, title: d.nome, onclick: () => escolher(d.conteudo, 'desenho') },
              CE.el('img', { src: d.conteudo, alt: d.nome }), CE.el('small', {}, d.nome)))) : null,
            CE.el('strong', {}, 'Figuras'),
            CE.el('div', { class: 'ed-galeria' }, ...FIGURAS.map((f) => CE.el('button', { class: 'ed-galeria-item figura', 'data-figura': f, onclick: () => escolher(emojiParaImagem(f), 'figura') }, f))),
            CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar')),
          ));
        document.body.append(fundo);
      }

      // ---------- Corretor ortográfico ----------

      function verificarOrtografia() {
        removerMarcas(pagina);
        let encontrados = 0;
        const andar = document.createTreeWalker(pagina, NodeFilter.SHOW_TEXT);
        const nos = [];
        while (andar.nextNode()) nos.push(andar.currentNode);
        nos.forEach((no) => {
          const partes = no.textContent.split(/(\p{L}+)/u);
          if (!partes.some((p) => CORRECOES[p.toLowerCase()])) return;
          const frag = document.createDocumentFragment();
          partes.forEach((p) => {
            const certo = CORRECOES[p.toLowerCase()];
            if (certo) {
              encontrados++;
              frag.append(CE.el('span', { class: 'erro-ortografia', 'data-sugestao': p[0] === p[0].toUpperCase() ? certo[0].toUpperCase() + certo.slice(1) : certo, title: `Clique para trocar por "${certo}"` }, p));
            } else if (p) frag.append(document.createTextNode(p));
          });
          no.replaceWith(frag);
        });
        CE.emitir('editor:ortografia', { encontrados, restantes: encontrados, acao: 'verificar' });
        CE.avisar(encontrados ? `✏️ Encontrei ${encontrados} palavra${encontrados > 1 ? 's' : ''} com erro. Clique em cada palavra sublinhada de vermelho para corrigir.` : '✅ Não encontrei erros de ortografia!');
      }

      function removerMarcas(raiz) {
        raiz.querySelectorAll('.erro-ortografia').forEach((s) => s.replaceWith(document.createTextNode(s.textContent)));
        raiz.normalize();
      }

      pagina.addEventListener('click', (e) => {
        const erro = e.target.closest('.erro-ortografia');
        if (erro) {
          const errada = erro.textContent;
          erro.replaceWith(document.createTextNode(erro.dataset.sugestao));
          pagina.normalize();
          modificado = true;
          atualizarStatus();
          const restantes = pagina.querySelectorAll('.erro-ortografia').length;
          CE.emitir('editor:ortografia', { errada, certa: erro.dataset.sugestao, restantes, acao: 'corrigir' });
          CE.emitir('editor:texto', { texto: pagina.innerText, html: pagina.innerHTML });
          return;
        }
        // Clicar num campo [entre colchetes] de um modelo seleciona o campo inteiro: é só escrever por cima.
        const campoModelo = e.target.closest('.campo-modelo');
        if (campoModelo && /^\[.*\]$/.test(campoModelo.textContent.trim())) {
          const faixa = document.createRange();
          faixa.selectNodeContents(campoModelo);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(faixa);
        }
      });

      // ---------- Imprimir (de treino) ----------

      function imprimir() {
        const previa = CE.el('div', { class: 'ed-previa' });
        const copia = pagina.cloneNode(true);
        copia.removeAttribute('contenteditable');
        removerMarcas(copia);
        previa.append(copia);
        const copias = CE.el('input', { class: 'campo', type: 'number', min: '1', max: '20', value: '1', 'aria-label': 'Número de cópias', 'data-campo': 'copias' });
        const fundo = CE.el('div', { class: 'dialogo-fundo' },
          CE.el('div', { class: 'dialogo largo' },
            CE.el('p', {}, '🖨️ Imprimir'),
            CE.el('div', { class: 'ed-imprimir' },
              previa,
              CE.el('div', { class: 'ed-imprimir-opcoes' },
                CE.el('label', {}, 'Impressora', CE.el('select', { class: 'campo' }, CE.el('option', {}, 'Impressora da sala (treino)'), CE.el('option', {}, 'Salvar como PDF (treino)'))),
                CE.el('label', {}, 'Cópias', copias),
                CE.el('label', {}, 'Páginas', CE.el('select', { class: 'campo' }, CE.el('option', {}, 'Todas'), CE.el('option', {}, 'Só a página atual'))),
                CE.el('p', { class: 'ed-dica' }, 'Antes de imprimir, confira a prévia ao lado: assim você não gasta papel à toa.'),
              ),
            ),
            CE.el('div', { class: 'dialogo-botoes' },
              CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'),
              CE.el('button', { class: 'botao', 'data-acao': 'confirmar-impressao', onclick: () => {
                const n = Math.max(1, Number(copias.value) || 1);
                fundo.remove();
                CE.avisar(`🖨️ Imprimindo ${n} cópia${n > 1 ? 's' : ''} de "${nomeArquivo || 'Documento sem nome'}"...`);
                CE.emitir('editor:impresso', { copias: n, nome: nomeArquivo });
              } }, 'Imprimir'),
            ),
          ));
        document.body.append(fundo);
      }

      // ---------- Arquivo ----------

      function htmlParaSalvar() {
        const copia = pagina.cloneNode(true);
        removerMarcas(copia);
        // Campos de modelo já preenchidos deixam de ser campos.
        copia.querySelectorAll('.campo-modelo').forEach((c) => { if (!/^\[.*\]$/.test(c.textContent.trim())) c.replaceWith(...c.childNodes); });
        return (margem !== 'normal' ? `<!--ce:margem=${margem}-->` : '') + copia.innerHTML;
      }

      async function salvar() {
        let nome = nomeArquivo;
        if (!nome) {
          nome = await CE.perguntar('Qual o nome do documento?', 'Meu documento');
          if (!nome) return false;
        }
        await CE.sessao.salvarArquivo({ nome, tipo: 'documento', conteudo: htmlParaSalvar() });
        nomeArquivo = nome;
        modificado = false;
        atualizarStatus();
        CE.avisar(`Documento "${nome}" salvo!`);
        return true;
      }

      async function novo(modelo = 'branco') {
        if (modificado && await CE.confirmar('Quer salvar o documento atual antes de começar um novo?')) {
          if (!await salvar()) return;
        }
        pagina.innerHTML = MODELOS[modelo].html();
        ultimaFaixa = null;
        nomeArquivo = null;
        modificado = modelo !== 'branco';
        aplicarMargem('normal', false);
        atualizarStatus();
        CE.emitir('editor:novo', { modelo });
        pagina.focus();
      }

      function carregar(arquivo) {
        const conteudo = arquivo.conteudo || '';
        const m = conteudo.match(/^<!--ce:margem=(\w+)-->/);
        aplicarMargem(m ? m[1] : 'normal', false);
        pagina.innerHTML = m ? conteudo.slice(m[0].length) : conteudo;
        ultimaFaixa = null;
        nomeArquivo = arquivo.nome;
        modificado = false;
        atualizarStatus();
        CE.emitir('arquivo:aberto', { nome: arquivo.nome, tipo: 'documento' });
      }

      // ---------- Barra de ferramentas ----------

      const botao = (comando, rotulo, dica, classe = '', acao) =>
        CE.el('button', {
          class: 'ferramenta ' + classe, 'data-comando': comando, title: dica,
          onmousedown: (e) => e.preventDefault(), // não perde a seleção do texto
          onclick: acao || (() => executar(comando)),
        }, rotulo);

      const seletorFonte = CE.el('select', { class: 'ferramenta-select', 'data-comando': 'fontName', title: 'Fonte (tipo de letra)', onchange: (e) => executar('fontName', e.target.value) },
        ...FONTES.map((f) => CE.el('option', { value: f, style: `font-family:${f}` }, f)));
      const seletorTamanho = CE.el('select', { class: 'ferramenta-select pequeno', 'data-comando': 'fontSize', title: 'Tamanho da letra', onchange: (e) => executar('fontSize', e.target.value) },
        ...TAMANHOS.map(([v, r]) => CE.el('option', { value: v, selected: v === '3' }, r)));
      const seletorCor = CE.el('input', { type: 'color', class: 'ferramenta-cor', 'data-comando': 'foreColor', value: '#000000', title: 'Cor da letra', onchange: (e) => executar('foreColor', e.target.value) });
      const seletorEspacamento = CE.el('select', { class: 'ferramenta-select pequeno', 'data-comando': 'lineHeight', title: 'Espaçamento entre as linhas', onchange: (e) => aplicarEspacamento(e.target.value) },
        CE.el('option', { value: '', disabled: true, selected: true }, '↕'), ...ESPACAMENTOS.map(([v, r]) => CE.el('option', { value: v }, r)));
      const seletorMargem = CE.el('select', { class: 'ferramenta-select', 'data-comando': 'margem', title: 'Margens da página', onchange: (e) => aplicarMargem(e.target.value) },
        CE.el('option', { value: 'estreita' }, 'Margem estreita'), CE.el('option', { value: 'normal', selected: true }, 'Margem normal'), CE.el('option', { value: 'larga' }, 'Margem larga'));

      function atualizarBotoes() {
        corpo.querySelectorAll('[data-comando="bold"],[data-comando="italic"],[data-comando="underline"]').forEach((b) => {
          b.classList.toggle('ligado', document.queryCommandState(b.dataset.comando));
        });
      }

      const menuNovo = CE.el('div', { class: 'ed-menu', hidden: true },
        ...Object.entries(MODELOS).map(([id, m]) => CE.el('button', { class: 'menu-item', 'data-modelo': id, onclick: () => { menuNovo.hidden = true; novo(id); } },
          id === 'branco' ? '📄 ' : '📋 ', m.nome)));
      document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.ed-novo')) menuNovo.hidden = true; });

      const barraFerramentas = CE.el('div', { class: 'ferramentas' },
        CE.el('div', { class: 'ferramentas-grupo' },
          CE.el('div', { class: 'ed-novo' },
            CE.el('button', { class: 'ferramenta texto', 'data-comando': 'novo', title: 'Começar um documento novo (em branco ou a partir de um modelo)', onclick: () => { menuNovo.hidden = !menuNovo.hidden; } }, '📄 Novo ▾'),
            menuNovo),
          CE.el('button', { class: 'ferramenta texto', 'data-comando': 'abrir', title: 'Abrir um documento salvo', onclick: () => CE.janelas.abrir('arquivos') }, '📂 Abrir'),
          CE.el('button', { class: 'ferramenta texto', 'data-comando': 'salvar', title: 'Salvar o documento (Ctrl+S)', onclick: () => salvar() }, '💾 Salvar'),
          CE.el('button', { class: 'ferramenta texto', 'data-comando': 'imprimir', title: 'Imprimir (Ctrl+P)', onclick: imprimir }, '🖨️ Imprimir'),
        ),
        CE.el('div', { class: 'ferramentas-grupo' }, botao('undo', '↶', 'Desfazer (Ctrl+Z)'), botao('redo', '↷', 'Refazer (Ctrl+Y)')),
        CE.el('div', { class: 'ferramentas-grupo' }, seletorFonte, seletorTamanho),
        CE.el('div', { class: 'ferramentas-grupo' },
          botao('bold', 'N', 'Negrito (Ctrl+B)', 'negrito'),
          botao('italic', 'I', 'Itálico (Ctrl+I)', 'italico'),
          botao('underline', 'S', 'Sublinhado (Ctrl+U)', 'sublinhado'),
          seletorCor,
        ),
        CE.el('div', { class: 'ferramentas-grupo' },
          botao('justifyLeft', '⇤', 'Alinhar à esquerda'),
          botao('justifyCenter', '≡', 'Centralizar'),
          botao('justifyRight', '⇥', 'Alinhar à direita'),
          botao('justifyFull', '☰', 'Justificar (as linhas ficam alinhadas dos dois lados)'),
        ),
        CE.el('div', { class: 'ferramentas-grupo' },
          botao('insertUnorderedList', '•', 'Lista com marcadores'),
          botao('insertOrderedList', '1.', 'Lista numerada'),
          botao('outdent', '⇠', 'Diminuir recuo'),
          botao('indent', '⇢', 'Aumentar recuo (afastar o parágrafo da margem)'),
          seletorEspacamento,
        ),
        CE.el('div', { class: 'ferramentas-grupo' },
          botao('inserirTabela', '▦ Tabela', 'Inserir uma tabela', 'texto', inserirTabela),
          botao('inserirLinhaTabela', '➕ Linha', 'Acrescentar uma linha na tabela (clique dentro da tabela antes)', 'texto', inserirLinhaTabela),
          botao('inserirImagem', '🖼️ Imagem', 'Inserir uma imagem ou um dos seus desenhos', 'texto', inserirImagem),
          botao('insertHorizontalRule', '―', 'Inserir uma linha horizontal'),
        ),
        CE.el('div', { class: 'ferramentas-grupo' },
          seletorMargem,
          botao('ortografia', '✔️ Ortografia', 'Procurar erros de português', 'texto', verificarOrtografia),
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
      // Atalhos de teclado: passam pelo mesmo caminho dos botões, para as lições perceberem.
      pagina.addEventListener('keydown', (e) => {
        if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
        const atalhos = { b: 'bold', i: 'italic', u: 'underline', z: 'undo', y: 'redo' };
        const tecla = e.key.toLowerCase();
        if (tecla === 's') { e.preventDefault(); salvar(); }
        else if (tecla === 'p') { e.preventDefault(); imprimir(); }
        else if (atalhos[tecla]) { e.preventDefault(); executar(atalhos[tecla]); }
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
