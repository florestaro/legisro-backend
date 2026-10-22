// Editor de Texto (parecido com o Word): escrever, formatar, tabelas, imagens, modelos prontos,
// corretor ortográfico, imprimir, salvar e abrir documentos.
// No nível avançado: estilos de título, sumário, quebra de página, cabeçalho e rodapé com número de página,
// colunas, localizar e substituir, exportar PDF e o modelo de trabalho escolar (ABNT).
(function () {
  const FONTES = ['Calibri', 'Arial', 'Times New Roman', 'Verdana', 'Comic Sans MS', 'Courier New'];
  const TAMANHOS = [['1', '8'], ['2', '10'], ['3', '12'], ['4', '14'], ['5', '18'], ['6', '24'], ['7', '36']];
  const ESPACAMENTOS = [['1', '1,0'], ['1.15', '1,15'], ['1.5', '1,5'], ['2', '2,0']];
  // ABNT: 3 cm em cima e à esquerda, 2 cm embaixo e à direita.
  const MARGENS = { estreita: '36px 40px', normal: '72px 80px', larga: '96px 120px', abnt: '113px 76px 76px 113px' };
  const ESTILOS = [['normal', 'Normal'], ['h1', 'Título 1'], ['h2', 'Título 2'], ['h3', 'Título 3'], ['blockquote', 'Citação'], ['abnt', 'Parágrafo ABNT']];
  const DOCUMENTO_PADRAO = { margem: 'normal', cabecalho: '', rodape: '', numerar: false };
  const NOMES_COMANDOS = {
    bold: 'negrito', italic: 'itálico', underline: 'sublinhado',
    justifyLeft: 'alinhar à esquerda', justifyCenter: 'centralizar', justifyRight: 'alinhar à direita', justifyFull: 'justificar',
    insertUnorderedList: 'lista com marcadores', insertOrderedList: 'lista numerada', indent: 'aumentar recuo', outdent: 'diminuir recuo',
    fontName: 'fonte', fontSize: 'tamanho da letra', foreColor: 'cor da letra', undo: 'desfazer', redo: 'refazer',
    lineHeight: 'espaçamento entre linhas', inserirTabela: 'tabela', inserirLinhaTabela: 'linha na tabela', inserirImagem: 'imagem',
    insertHorizontalRule: 'linha horizontal', margem: 'margens',
    estilo: 'estilo', colunas: 'colunas', quebraPagina: 'quebra de página', sumario: 'sumário', cabecalhoRodape: 'cabeçalho e rodapé',
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
  const abnt = (t) => `<div style="text-align: justify; text-indent: 47px; line-height: 1.5;">${t}</div>`;
  const centro = (t, extra = '') => `<div style="text-align: center;${extra}">${t}</div>`;
  MODELOS.trabalho = {
    nome: 'Trabalho escolar (ABNT)',
    documento: { margem: 'abnt', numerar: true },
    html: () => `${centro(`<b>${campo('NOME DA ESCOLA')}</b>`)}${centro(campo('Nome do curso ou da turma'))}<div><br></div><div><br></div>
      ${centro(`<b>${campo('SEU NOME COMPLETO')}</b>`)}<div><br></div><div><br></div><div><br></div><div><br></div>
      ${centro(`<b><font size="5">${campo('TÍTULO DO TRABALHO')}</font></b>`)}${centro(campo('Subtítulo, se tiver'))}<div><br></div><div><br></div><div><br></div><div><br></div>
      ${centro(campo('CIDADE'))}${centro(String(new Date().getFullYear()))}
      <div class="quebra-pagina" contenteditable="false"></div>
      <div class="sumario" contenteditable="false"><div class="sumario-titulo">SUMÁRIO</div><div class="sumario-vazio">Quando terminar o trabalho, clique em "📑 Sumário" para montar esta lista sozinha.</div></div>
      <div class="quebra-pagina" contenteditable="false"></div>
      <h1>1 INTRODUÇÃO</h1>${abnt(campo('Apresente o assunto do trabalho, o objetivo e como ele está organizado.'))}
      <div class="quebra-pagina" contenteditable="false"></div>
      <h1>2 DESENVOLVIMENTO</h1>${abnt(campo('Explique o assunto com as suas palavras. Use parágrafos curtos.'))}
      <h2>2.1 ${campo('Primeira parte do assunto')}</h2>${abnt(campo('Texto da primeira parte.'))}
      <div class="quebra-pagina" contenteditable="false"></div>
      <h1>3 CONCLUSÃO</h1>${abnt(campo('O que você aprendeu e a resposta ao objetivo da introdução.'))}
      <div class="quebra-pagina" contenteditable="false"></div>
      <h1>REFERÊNCIAS</h1><div>SOBRENOME, Nome. <b>Título do livro</b>. Cidade: Editora, ano.</div>
      <div>NOME DO SITE. <b>Título da página</b>. Disponível em: endereço do site. Acesso em: ${new Date().toLocaleDateString('pt-BR')}.</div>`,
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

  // Separa as configurações da página (margem, cabeçalho...) do texto do documento.
  CE.lerDocumento = function (conteudo = '') {
    const novo = conteudo.match(/^<!--ce:(\{.*?\})-->/);
    if (novo) { try { return { meta: JSON.parse(novo[1]), html: conteudo.slice(novo[0].length) }; } catch { /* segue */ } }
    const antigo = conteudo.match(/^<!--ce:margem=(\w+)-->/);
    if (antigo) return { meta: { margem: antigo[1] }, html: conteudo.slice(antigo[0].length) };
    return { meta: {}, html: conteudo };
  };

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
      let documento = { ...DOCUMENTO_PADRAO };

      const pagina = CE.el('div', { class: 'editor-pagina', contenteditable: 'true', spellcheck: 'false', 'aria-label': 'Página do documento' });
      const status = CE.el('div', { class: 'editor-status' });
      const cabecalhoEl = CE.el('div', { class: 'ed-cabecalho', 'aria-hidden': 'true' });
      const rodapeEl = CE.el('div', { class: 'ed-rodape', 'aria-hidden': 'true' });
      const folha = CE.el('div', { class: 'editor-folha' }, cabecalhoEl, pagina, rodapeEl);
      const totalPaginas = () => pagina.querySelectorAll('.quebra-pagina').length + 1;
      function mostrarCabecalhoRodape() {
        cabecalhoEl.textContent = documento.cabecalho;
        rodapeEl.textContent = [documento.rodape, documento.numerar ? `Página 1${totalPaginas() > 1 ? ` de ${totalPaginas()}` : ''}` : ''].filter(Boolean).join('   ·   ');
      }

      function atualizarStatus() {
        const texto = pagina.innerText.trim();
        const palavras = texto ? texto.split(/\s+/).length : 0;
        const paginas = totalPaginas();
        status.textContent = `${nomeArquivo || 'Documento sem nome'}${modificado ? ' (não salvo)' : ''} · ${palavras} palavra${palavras === 1 ? '' : 's'}${paginas > 1 ? ` · ${paginas} páginas` : ''}`;
        mostrarCabecalhoRodape();
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
        // Se a seleção ainda está na página, ela é a mais nova; senão, usa a última guardada.
        const sel = window.getSelection();
        const atual = sel.rangeCount && pagina.contains(sel.getRangeAt(0).commonAncestorContainer) ? sel.getRangeAt(0).cloneRange() : null;
        pagina.focus();
        const faixa = atual || ultimaFaixa;
        if (faixa) {
          sel.removeAllRanges();
          sel.addRange(faixa);
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

      // Os parágrafos que estão selecionados (ou o parágrafo onde está o cursor).
      function blocosSelecionados() {
        recuperarSelecao();
        const sel = window.getSelection();
        if (!sel.rangeCount) return [];
        const faixa = sel.getRangeAt(0);
        const achar = () => [...pagina.querySelectorAll('div, p, li, h1, h2, h3, blockquote')]
          .filter((b) => faixa.intersectsNode(b) && !b.querySelector('div, p, li, h1, h2, h3') && !b.closest('.sumario') && !b.classList.contains('quebra-pagina') && !b.classList.contains('colunas'));
        let blocos = achar();
        if (!blocos.length) { document.execCommand('formatBlock', false, 'div'); blocos = achar(); }
        return blocos;
      }

      // Espaçamento entre linhas: vale para os parágrafos que estão selecionados.
      function aplicarEspacamento(valor) {
        blocosSelecionados().forEach((b) => { b.style.lineHeight = valor; });
        avisarFormatacao('lineHeight', valor);
      }

      // ---------- Estilos (Título 1, Título 2...) ----------
      function aplicarEstilo(valor) {
        if (valor === 'abnt') {
          blocosSelecionados().forEach((b) => Object.assign(b.style, { textAlign: 'justify', textIndent: '47px', lineHeight: '1.5' }));
        } else {
          recuperarSelecao();
          document.execCommand('formatBlock', false, valor === 'normal' ? 'div' : valor);
        }
        avisarFormatacao('estilo', valor, { nomeEstilo: (ESTILOS.find(([v]) => v === valor) || [])[1] });
        seletorEstilo.value = estiloAtual();
      }
      function estiloAtual() {
        const sel = window.getSelection();
        if (!sel.rangeCount || !pagina.contains(sel.anchorNode)) return 'normal';
        const no = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement;
        const bloco = no.closest('h1, h2, h3, blockquote, div, p, li');
        if (!bloco || bloco === pagina) return 'normal';
        const tag = bloco.tagName.toLowerCase();
        if (['h1', 'h2', 'h3', 'blockquote'].includes(tag)) return tag;
        return bloco.style.textIndent ? 'abnt' : 'normal';
      }

      // ---------- Páginas: quebra, cabeçalho, rodapé e sumário ----------
      // A página nova começa no parágrafo onde está o cursor.
      function quebraDePagina() {
        recuperarSelecao();
        const sel = window.getSelection();
        let alvo = sel.rangeCount && pagina.contains(sel.anchorNode) ? sel.anchorNode : null;
        while (alvo && alvo.parentNode !== pagina) alvo = alvo.parentNode;
        const quebra = CE.el('div', { class: 'quebra-pagina', contenteditable: 'false' });
        if (alvo && alvo !== pagina.firstChild) alvo.before(quebra);
        else if (alvo) alvo.after(quebra, CE.el('div', {}, CE.el('br')));
        else pagina.append(quebra, CE.el('div', {}, CE.el('br')));
        modificado = true;
        atualizarStatus();
        avisarFormatacao('quebraPagina', totalPaginas(), { paginas: totalPaginas(), antesDe: alvo && alvo !== pagina.firstChild ? alvo.textContent.trim().slice(0, 60) : '' });
      }
      const paginaDe = (el) => 1 + [...pagina.querySelectorAll('.quebra-pagina')].filter((q) => q.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).length;
      function sumario() {
        const titulos = [...pagina.querySelectorAll('h1, h2')].filter((h) => h.textContent.trim());
        if (!titulos.length) { CE.avisar('Para fazer o sumário, primeiro use os estilos "Título 1" e "Título 2" nos títulos do texto.'); return; }
        const html = `<div class="sumario-titulo">SUMÁRIO</div>${titulos.map((h) => `<div class="sumario-item nivel-${h.tagName[1]}"><span>${CE.escapar(h.textContent.trim())}</span><span class="sumario-pontos"></span><span>${paginaDe(h)}</span></div>`).join('')}`;
        const existente = pagina.querySelector('.sumario');
        if (existente) existente.innerHTML = html;
        else {
          // Entra como um bloco inteiro antes do parágrafo onde está o cursor (nunca no meio de um título).
          const sel = window.getSelection();
          let alvo = ultimaFaixa ? ultimaFaixa.startContainer : sel.rangeCount && pagina.contains(sel.anchorNode) ? sel.anchorNode : null;
          while (alvo && alvo.parentNode !== pagina) alvo = alvo.parentNode;
          const caixa = CE.el('div', { class: 'sumario', contenteditable: 'false', html });
          if (alvo) alvo.before(caixa); else pagina.prepend(caixa);
          modificado = true;
          atualizarStatus();
        }
        avisarFormatacao('sumario', titulos.length, { itens: titulos.map((h) => h.textContent.trim()), acao: existente ? 'atualizar' : 'inserir' });
        CE.emitir('editor:sumario', { itens: titulos.length, acao: existente ? 'atualizar' : 'inserir' });
        CE.avisar(existente ? '📑 Sumário atualizado!' : '📑 Sumário criado! Se mudar os títulos, clique em "Sumário" de novo para atualizar.');
      }
      function dialogoCabecalhoRodape() {
        const cab = CE.el('input', { class: 'campo', 'data-campo': 'cabecalho', value: documento.cabecalho, placeholder: 'Ex.: Escola Estadual Esperança' });
        const rod = CE.el('input', { class: 'campo', 'data-campo': 'rodape', value: documento.rodape, placeholder: 'Ex.: Trabalho de Ciências' });
        const num = CE.el('input', { type: 'checkbox', 'data-campo': 'numerar', checked: documento.numerar });
        const fundo = CE.el('div', { class: 'dialogo-fundo' },
          CE.el('div', { class: 'dialogo' },
            CE.el('p', {}, '🔢 Cabeçalho e rodapé'),
            CE.el('p', { class: 'ed-dica' }, 'O cabeçalho aparece no alto de TODAS as páginas, e o rodapé embaixo.'),
            CE.el('label', { class: 'ed-rotulo' }, 'Cabeçalho (em cima)', cab),
            CE.el('label', { class: 'ed-rotulo' }, 'Rodapé (embaixo)', rod),
            CE.el('label', { class: 'ed-check' }, num, 'Numerar as páginas (o número vai no rodapé)'),
            CE.el('div', { class: 'dialogo-botoes' },
              CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'),
              CE.el('button', { class: 'botao', 'data-acao': 'confirmar-cabecalho', onclick: () => {
                documento = { ...documento, cabecalho: cab.value.trim(), rodape: rod.value.trim(), numerar: num.checked };
                fundo.remove();
                modificado = true;
                atualizarStatus();
                CE.emitir('editor:cabecalho', { cabecalho: documento.cabecalho, rodape: documento.rodape, numerar: documento.numerar });
              } }, 'OK'))));
        document.body.append(fundo);
        cab.focus();
      }

      // ---------- Colunas ----------
      function aplicarColunas(valor) {
        const n = Number(valor) || 1;
        const blocos = blocosSelecionados();
        if (!blocos.length) return;
        const topo = (b) => { let x = b; while (x.parentElement && x.parentElement !== pagina && !x.parentElement.classList.contains('colunas')) x = x.parentElement; return x; };
        const caixaAtual = blocos[0].closest('.colunas');
        if (caixaAtual && blocos.every((b) => caixaAtual.contains(b))) {
          if (n === 1) caixaAtual.replaceWith(...caixaAtual.childNodes);
          else caixaAtual.style.columnCount = n;
        } else if (n > 1) {
          const grupo = [...new Set(blocos.map(topo))];
          const caixa = CE.el('div', { class: 'colunas', style: `column-count: ${n}` });
          grupo[0].before(caixa);
          caixa.append(...grupo);
          // Mudar os parágrafos de lugar apaga a seleção: seleciona de novo o texto das colunas.
          const faixa = document.createRange();
          faixa.selectNodeContents(caixa);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(faixa);
          ultimaFaixa = faixa.cloneRange();
        }
        avisarFormatacao('colunas', n);
        seletorColunas.value = '';
      }

      // ---------- Localizar e substituir ----------
      const procurarRegex = (termo) => new RegExp(termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      function nosDeTexto() {
        const andar = document.createTreeWalker(pagina, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest('.sumario') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
        const nos = [];
        while (andar.nextNode()) nos.push(andar.currentNode);
        return nos;
      }
      function marcarAchados(termo) {
        removerMarcas(pagina, '.ed-achado');
        if (!termo) return 0;
        let total = 0;
        nosDeTexto().forEach((no) => {
          const re = procurarRegex(termo);
          if (!re.test(no.textContent)) return;
          const frag = document.createDocumentFragment();
          let ultimo = 0;
          no.textContent.replace(procurarRegex(termo), (achado, pos) => {
            frag.append(document.createTextNode(no.textContent.slice(ultimo, pos)), CE.el('mark', { class: 'ed-achado' }, achado));
            ultimo = pos + achado.length;
            total++;
          });
          frag.append(document.createTextNode(no.textContent.slice(ultimo)));
          no.replaceWith(frag);
        });
        return total;
      }
      function dialogoSubstituir() {
        const procurar = CE.el('input', { class: 'campo', 'data-campo': 'procurar', value: textoSelecionado().trim(), placeholder: 'Palavra que você procura' });
        const trocar = CE.el('input', { class: 'campo', 'data-campo': 'trocar', placeholder: 'Trocar por (opcional)' });
        const resultado = CE.el('p', { class: 'ed-dica', 'data-resultado': '' }, '');
        const fechar = () => { removerMarcas(pagina, '.ed-achado'); fundo.remove(); CE.emitir('editor:localizar-fechado'); };
        const fundo = CE.el('div', { class: 'dialogo-fundo transparente' },
          CE.el('div', { class: 'dialogo' },
            CE.el('p', {}, '🔎 Localizar e substituir'),
            CE.el('label', { class: 'ed-rotulo' }, 'Localizar', procurar),
            CE.el('label', { class: 'ed-rotulo' }, 'Substituir por', trocar),
            resultado,
            CE.el('div', { class: 'dialogo-botoes' },
              CE.el('button', { class: 'botao secundario', onclick: fechar }, 'Fechar'),
              CE.el('button', { class: 'botao secundario', 'data-acao': 'localizar', onclick: () => {
                const n = marcarAchados(procurar.value);
                resultado.textContent = n ? `Achei ${n} vez${n > 1 ? 'es' : ''} (marcado em amarelo).` : 'Não achei essa palavra no texto.';
                CE.emitir('editor:localizado', { termo: procurar.value, quantidade: n });
              } }, 'Localizar'),
              CE.el('button', { class: 'botao', 'data-acao': 'substituir-tudo', onclick: () => {
                const termo = procurar.value;
                if (!termo) { procurar.focus(); return; }
                removerMarcas(pagina, '.ed-achado');
                let n = 0;
                nosDeTexto().forEach((no) => { no.textContent = no.textContent.replace(procurarRegex(termo), () => { n++; return trocar.value; }); });
                modificado = true;
                atualizarStatus();
                resultado.textContent = n ? `Troquei ${n} vez${n > 1 ? 'es' : ''}.` : 'Não achei essa palavra no texto.';
                CE.emitir('editor:substituido', { procurar: termo, trocar: trocar.value, quantidade: n });
                CE.emitir('editor:texto', { texto: pagina.innerText, html: pagina.innerHTML });
              } }, 'Substituir tudo'))));
        document.body.append(fundo);
        procurar.focus();
      }

      // ---------- PDF ----------
      async function exportarPdf() {
        const nome = await CE.perguntar('Nome do PDF:', nomeArquivo || 'Meu documento');
        if (!nome) return;
        await CE.sessao.salvarArquivo({ nome, tipo: 'pdf', conteudo: htmlParaSalvar() });
        CE.emitir('editor:pdf', { nome, paginas: totalPaginas() });
        CE.avisar(`📕 PDF "${nome}" salvo em Meus Documentos. O PDF fica igualzinho em qualquer computador e não dá para mudar sem querer.`);
      }

      function aplicarMargem(valor, avisar = true) {
        margem = MARGENS[valor] ? valor : 'normal';
        documento.margem = margem;
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
        const vale = CE.sessao.marca();
        const desenhos = (await CE.sessao.arquivos()).filter((a) => a.tipo === 'imagem' && !a.naLixeira);
        if (!vale()) return;
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

      function removerMarcas(raiz, seletor = '.erro-ortografia, .ed-achado') {
        raiz.querySelectorAll(seletor).forEach((s) => s.replaceWith(document.createTextNode(s.textContent)));
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
        // As impressoras vêm das Configurações; a primeira é a padrão.
        const impressoras = CE.config ? CE.config.impressoras().map((i) => i.nome) : ['Impressora da sala (treino)'];
        const seletorImpressora = CE.el('select', { class: 'campo', 'data-campo': 'impressora' }, ...impressoras.map((n) => CE.el('option', { value: n }, n)), CE.el('option', { value: 'pdf' }, 'Salvar como PDF'));
        const fundo = CE.el('div', { class: 'dialogo-fundo' },
          CE.el('div', { class: 'dialogo largo' },
            CE.el('p', {}, '🖨️ Imprimir'),
            CE.el('div', { class: 'ed-imprimir' },
              previa,
              CE.el('div', { class: 'ed-imprimir-opcoes' },
                CE.el('label', {}, 'Impressora', seletorImpressora),
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
                if (seletorImpressora.value === 'pdf') { exportarPdf(); return; }
                CE.avisar(`🖨️ Imprimindo ${n} cópia${n > 1 ? 's' : ''} de "${nomeArquivo || 'Documento sem nome'}" na ${seletorImpressora.value}...`);
                CE.emitir('editor:impresso', { copias: n, nome: nomeArquivo, impressora: seletorImpressora.value });
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
        // As configurações da página vão num comentário no começo do arquivo.
        const meta = Object.fromEntries(Object.entries(documento).filter(([k, v]) => v !== DOCUMENTO_PADRAO[k]));
        return (Object.keys(meta).length ? `<!--ce:${JSON.stringify(meta)}-->` : '') + copia.innerHTML;
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
        documento = { ...DOCUMENTO_PADRAO, ...(MODELOS[modelo].documento || {}) };
        aplicarMargem(documento.margem, false);
        atualizarStatus();
        CE.emitir('editor:novo', { modelo });
        pagina.focus();
      }

      function carregar(arquivo) {
        const { meta, html } = CE.lerDocumento(arquivo.conteudo);
        documento = { ...DOCUMENTO_PADRAO, ...meta };
        aplicarMargem(documento.margem, false);
        pagina.innerHTML = html;
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
        CE.el('option', { value: 'estreita' }, 'Margem estreita'), CE.el('option', { value: 'normal', selected: true }, 'Margem normal'), CE.el('option', { value: 'larga' }, 'Margem larga'),
        CE.el('option', { value: 'abnt' }, 'Margem ABNT (3 e 2 cm)'));
      const seletorEstilo = CE.el('select', { class: 'ferramenta-select', 'data-comando': 'estilo', title: 'Estilo do parágrafo (Título 1, Título 2...)', onchange: (e) => aplicarEstilo(e.target.value) },
        ...ESTILOS.map(([v, r]) => CE.el('option', { value: v }, r)));
      const seletorColunas = CE.el('select', { class: 'ferramenta-select pequeno', 'data-comando': 'colunas', title: 'Dividir o texto selecionado em colunas (como jornal)', onchange: (e) => aplicarColunas(e.target.value) },
        CE.el('option', { value: '', disabled: true, selected: true }, '▥'), CE.el('option', { value: '1' }, '1 col.'), CE.el('option', { value: '2' }, '2 col.'), CE.el('option', { value: '3' }, '3 col.'));

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
        CE.el('div', { class: 'ferramentas-grupo' },
          seletorEstilo,
          seletorColunas,
          botao('quebraPagina', '📄 Quebra', 'Quebra de página: o texto continua na página seguinte', 'texto', quebraDePagina),
          botao('cabecalhoRodape', '🔢 Cabeçalho', 'Cabeçalho, rodapé e número das páginas', 'texto', dialogoCabecalhoRodape),
          botao('sumario', '📑 Sumário', 'Criar ou atualizar o sumário (usa os Títulos 1 e 2)', 'texto', sumario),
          botao('substituir', '🔎 Localizar', 'Localizar e substituir palavras (Ctrl+H)', 'texto', dialogoSubstituir),
          botao('pdf', '📕 PDF', 'Salvar uma cópia em PDF', 'texto', exportarPdf),
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
        if (s.rangeCount && pagina.contains(s.anchorNode)) seletorEstilo.value = estiloAtual();
        if (sel.trim()) CE.emitir('editor:selecao', { selecionado: sel });
      });
      // Atalhos de teclado: passam pelo mesmo caminho dos botões, para as lições perceberem.
      pagina.addEventListener('keydown', (e) => {
        if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
        const atalhos = { b: 'bold', i: 'italic', u: 'underline', z: 'undo', y: 'redo' };
        const tecla = e.key.toLowerCase();
        if (tecla === 's') { e.preventDefault(); salvar(); }
        else if (tecla === 'p') { e.preventDefault(); imprimir(); }
        else if (tecla === 'h') { e.preventDefault(); dialogoSubstituir(); }
        else if (atalhos[tecla]) { e.preventDefault(); executar(atalhos[tecla]); }
      });

      corpo.classList.add('editor');
      corpo.append(barraFerramentas, CE.el('div', { class: 'editor-fundo' }, folha), status);
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
        aoFechar(opcoes = {}) {
          if (!modificado || podeFechar || opcoes.forcado) return true;
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
