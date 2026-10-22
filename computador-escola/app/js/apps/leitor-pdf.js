// Leitor de PDF: mostra o documento página por página, do jeito que vai sair na impressão. Não dá para editar.
(function () {
  const MARGENS = { estreita: '36px 40px', normal: '72px 80px', larga: '96px 120px', abnt: '113px 76px 76px 113px' };

  // Divide o documento nas quebras de página.
  function paginasDe(html) {
    const caixa = document.createElement('div');
    caixa.innerHTML = html;
    const paginas = [[]];
    [...caixa.childNodes].forEach((no) => {
      if (no.nodeType === 1 && no.classList.contains('quebra-pagina')) paginas.push([]);
      else paginas[paginas.length - 1].push(no);
    });
    return paginas;
  }

  CE.registrarApp({
    id: 'leitor-pdf',
    nome: 'Leitor de PDF',
    icone: '📕',
    semIcone: true,
    largura: 820,
    altura: 620,
    abrir(corpo, janela, argumento) {
      let zoom = 0.8;
      let arquivo = null;
      const folhas = CE.el('div', { class: 'pdf-folhas' });
      const indicador = CE.el('span', { class: 'pdf-indicador' }, '');
      const rotuloZoom = CE.el('span', { class: 'pdf-zoom' }, '80%');
      const fundo = CE.el('div', { class: 'pdf-fundo' }, folhas);

      function desenhar() {
        if (!arquivo) { folhas.replaceChildren(CE.el('p', { class: 'pdf-vazio' }, 'Abra um arquivo PDF pelo programa Arquivos.')); return; }
        const { meta, html } = CE.lerDocumento(arquivo.conteudo);
        const paginas = paginasDe(html);
        folhas.replaceChildren(...paginas.map((nos, i) => CE.el('div', { class: 'pdf-pagina', 'data-pagina': i + 1 },
          meta.cabecalho ? CE.el('div', { class: 'pdf-cabecalho' }, meta.cabecalho) : null,
          CE.el('div', { class: 'pdf-conteudo editor-pagina', style: `padding:${MARGENS[meta.margem] || MARGENS.normal}` }, ...nos),
          (meta.rodape || meta.numerar) ? CE.el('div', { class: 'pdf-rodape' }, [meta.rodape, meta.numerar ? `Página ${i + 1} de ${paginas.length}` : ''].filter(Boolean).join('   ·   ')) : null)));
        folhas.style.zoom = zoom;
        rotuloZoom.textContent = Math.round(zoom * 100) + '%';
        indicador.textContent = `Página 1 de ${paginas.length}`;
        janela.definirTitulo(`${arquivo.nome}.pdf`);
      }
      function mudarZoom(d) { zoom = Math.min(1.6, Math.max(0.4, Math.round((zoom + d) * 10) / 10)); desenhar(); CE.emitir('pdf:zoom', { zoom }); }
      fundo.addEventListener('scroll', () => {
        const total = folhas.children.length;
        const atual = [...folhas.children].findIndex((p) => p.getBoundingClientRect().bottom > fundo.getBoundingClientRect().top + 60) + 1;
        if (total) indicador.textContent = `Página ${Math.max(1, atual)} de ${total}`;
      });
      const b = (acao, rotulo, dica, f) => CE.el('button', { class: 'ferramenta texto', 'data-comando': acao, title: dica, onclick: f }, rotulo);
      corpo.classList.add('leitor-pdf');
      corpo.append(
        CE.el('div', { class: 'ferramentas' },
          CE.el('div', { class: 'ferramentas-grupo' }, b('menos', '➖', 'Diminuir', () => mudarZoom(-0.1)), rotuloZoom, b('mais', '➕', 'Aumentar', () => mudarZoom(0.1))),
          CE.el('div', { class: 'ferramentas-grupo' }, indicador),
          CE.el('div', { class: 'ferramentas-grupo' }, b('imprimir', '🖨️ Imprimir', 'Imprimir na impressora de treino', () => {
            CE.avisar(`🖨️ Imprimindo "${arquivo ? arquivo.nome : ''}.pdf"...`);
            CE.emitir('pdf:impresso', { nome: arquivo && arquivo.nome });
          })),
          CE.el('span', { class: 'pdf-aviso' }, '🔒 PDF: só para ler e imprimir')),
        fundo);
      const carregar = (a) => { arquivo = a; desenhar(); fundo.scrollTop = 0; CE.emitir('arquivo:aberto', { nome: a.nome, tipo: 'pdf' }); };
      if (argumento && argumento.arquivo) carregar(argumento.arquivo); else desenhar();
      return { receber(arg) { if (arg && arg.arquivo) carregar(arg.arquivo); } };
    },
  });
})();
