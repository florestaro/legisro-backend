// Leitor de PDF: mostra o documento página por página, do jeito que vai sair na impressão. O texto não muda, mas dá
// para fazer o que se faz no dia a dia com PDF:
//  • preencher um FORMULÁRIO (os campos de uma ficha de inscrição, por exemplo) e salvar preenchido;
//  • JUNTAR vários PDFs num só (RG frente e verso + comprovante de residência);
//  • ORGANIZAR as páginas: girar a que veio deitada, tirar a página em branco, mudar a ordem;
//  • mandar para ASSINAR pelo Cidadão Digital (como a assinatura gov.br) e ver quem assinou.
// Formato: o mesmo dos documentos do Editor (as páginas separadas por <div class="quebra-pagina">). Um campo de
// formulário é <span class="pdf-campo" data-campo="nome" data-rotulo="Nome completo"></span> (data-tipo="marcar" para
// caixinha de marcar). O giro das páginas fica nas configurações do documento (meta.giros).
(function () {
  const MARGENS = { estreita: '36px 40px', normal: '72px 80px', larga: '96px 120px', abnt: '113px 76px 76px 113px' };
  const QUEBRA = '<div class="quebra-pagina"></div>';

  // As páginas como trechos de HTML (separadas nas quebras de página).
  function paginasDe(html) {
    const caixa = document.createElement('div');
    caixa.innerHTML = html;
    const paginas = [''];
    [...caixa.childNodes].forEach((no) => {
      if (no.nodeType === 1 && no.classList.contains('quebra-pagina')) paginas.push('');
      else paginas[paginas.length - 1] += no.nodeType === 1 ? no.outerHTML : no.nodeType === 3 ? CE.escapar(no.textContent) : '';
    });
    return paginas;
  }
  const montar = (meta, paginas) => {
    const m = Object.fromEntries(Object.entries(meta || {}).filter(([, v]) => v != null && !(typeof v === 'object' && !Object.keys(v).length)));
    return (Object.keys(m).length ? `<!--ce:${JSON.stringify(m)}-->` : '') + paginas.join(QUEBRA);
  };
  // Para os testes e as aulas: as partes de um PDF.
  CE.pdf = {
    paginas: (conteudo) => paginasDe(CE.lerDocumento(conteudo).html),
    montar,
    campos(conteudo) {
      const caixa = document.createElement('div');
      caixa.innerHTML = CE.lerDocumento(conteudo).html;
      return Object.fromEntries([...caixa.querySelectorAll('.pdf-campo')].map((s) => [s.dataset.campo, s.textContent.trim()]));
    },
  };

  CE.registrarApp({
    id: 'leitor-pdf',
    nome: 'Leitor de PDF',
    icone: '📕',
    semIcone: true,
    largura: 860,
    altura: 640,
    abrir(corpo, janela, argumento) {
      let zoom = 0.8;
      let arquivo = null;
      let valores = {}; // o que a pessoa escreveu nos campos (ainda não salvo)
      let alterado = false;
      let organizar = null; // { paginas: [{ html, giro, original }] } enquanto organiza as páginas
      let podeFechar = false, perguntando = null;
      const folhas = CE.el('div', { class: 'pdf-folhas' });
      const indicador = CE.el('span', { class: 'pdf-indicador' }, '');
      const rotuloZoom = CE.el('span', { class: 'pdf-zoom' }, '80%');
      const fundo = CE.el('div', { class: 'pdf-fundo' }, folhas);
      const aviso = CE.el('span', { class: 'pdf-aviso' }, '🔒 PDF: só para ler e imprimir');
      const barraForm = CE.el('div', { class: 'pdf-barra-form', hidden: true });

      const lido = () => CE.lerDocumento(arquivo.conteudo);
      const assinaturas = () => (CE.assinatura && arquivo ? CE.assinatura.ler(arquivo.conteudo) : []);

      function desenhar() {
        if (!arquivo) { folhas.replaceChildren(CE.el('p', { class: 'pdf-vazio' }, 'Abra um arquivo PDF pelo programa Arquivos, ou clique em "➕ Juntar PDFs".')); barraForm.hidden = true; return; }
        if (organizar) { desenharOrganizar(); return; }
        const { meta, html } = lido();
        const paginas = paginasDe(html);
        const giros = meta.giros || {};
        folhas.replaceChildren(...paginas.map((trecho, i) => CE.el('div', { class: 'pdf-pagina', 'data-pagina': i + 1, 'data-giro': String(giros[i] || 0) },
          meta.cabecalho ? CE.el('div', { class: 'pdf-cabecalho' }, meta.cabecalho) : null,
          CE.el('div', { class: 'pdf-conteudo editor-pagina', style: `padding:${MARGENS[meta.margem] || MARGENS.normal}`, html: trecho }),
          (meta.rodape || meta.numerar) ? CE.el('div', { class: 'pdf-rodape' }, [meta.rodape, meta.numerar ? `Página ${i + 1} de ${paginas.length}` : ''].filter(Boolean).join('   ·   ')) : null)));
        // Campos do formulário: viram caixinhas para escrever.
        const campos = [...folhas.querySelectorAll('.pdf-campo')];
        campos.forEach((s) => {
          const nome = s.dataset.campo, marcar = s.dataset.tipo === 'marcar';
          const valor = nome in valores ? valores[nome] : s.textContent.trim();
          const caixa = marcar
            ? CE.el('input', { type: 'checkbox', class: 'pdf-marcar', 'data-campo-pdf': nome, title: s.dataset.rotulo || '', checked: valor ? true : null })
            : CE.el('input', { class: 'pdf-input', 'data-campo-pdf': nome, value: valor, placeholder: s.dataset.rotulo || '', title: s.dataset.rotulo || '', style: `width:${Number(s.dataset.largura) || 260}px`, autocomplete: 'off' });
          caixa.addEventListener('change', () => {
            valores[nome] = marcar ? (caixa.checked ? 'X' : '') : caixa.value.trim();
            alterado = true; desenharBarraForm(campos.length);
            CE.emitir('pdf:campo', { campo: nome, valor: valores[nome], arquivo: arquivo.nome });
          });
          s.replaceWith(caixa);
        });
        desenharBarraForm(campos.length);
        folhas.style.zoom = zoom;
        rotuloZoom.textContent = Math.round(zoom * 100) + '%';
        indicador.textContent = `Página 1 de ${paginas.length}`;
        janela.definirTitulo(`${arquivo.nome}.pdf`);
        const ass = assinaturas();
        aviso.textContent = ass.length ? `🔏 Assinado por ${ass.map((a) => a.nome).join(', ')}` : campos.length ? '📝 Formulário: clique nos campos para preencher' : '🔒 PDF: só para ler e imprimir';
        aviso.classList.toggle('assinado', ass.length > 0);
      }
      function desenharBarraForm(total) {
        barraForm.hidden = !total;
        if (!total) return;
        barraForm.replaceChildren(
          CE.el('span', {}, alterado ? '✏️ Você mudou o formulário. Salve para não perder.' : `📝 Este PDF tem ${total} campo(s) para preencher.`),
          CE.el('button', { class: 'botao pequeno', 'data-comando': 'salvar-formulario', disabled: alterado ? null : true, onclick: salvarFormulario }, '💾 Salvar preenchido'));
      }

      // ---------- Formulário ----------
      async function salvarFormulario() {
        const nome = await CE.perguntar('Nome do PDF preenchido:', /preenchid/i.test(arquivo.nome) ? arquivo.nome : `${arquivo.nome} preenchido`);
        if (!nome || !arquivo) return;
        const { meta, html } = lido();
        const caixa = document.createElement('div');
        caixa.innerHTML = html;
        caixa.querySelectorAll('.pdf-campo').forEach((s) => { if (s.dataset.campo in valores) s.textContent = valores[s.dataset.campo]; });
        const conteudo = montar(meta, [caixa.innerHTML]);
        try {
          arquivo = await CE.sessao.salvarArquivo({ nome, tipo: 'pdf', conteudo, local: arquivo.local || 'pc', pasta: arquivo.pasta || '' });
        } catch (e) { CE.avisar('⚠️ ' + e.message); return; }
        const preenchidos = CE.pdf.campos(conteudo);
        valores = {}; alterado = false;
        CE.emitir('pdf:formulario-salvo', { nome, total: Object.keys(preenchidos).length, preenchidos: Object.values(preenchidos).filter(Boolean).length, valores: preenchidos });
        CE.avisar(`💾 Formulário salvo como "${nome}".`);
        desenhar();
      }

      // ---------- Organizar páginas ----------
      function comecarOrganizar() {
        if (!arquivo) { CE.avisar('Abra primeiro o PDF que vai organizar.'); return; }
        if (alterado) { CE.avisar('Salve o formulário preenchido antes de organizar as páginas.'); return; }
        const { meta, html } = lido();
        organizar = { paginas: paginasDe(html).map((h, i) => ({ html: h, giro: Number((meta.giros || {})[i]) || 0, original: i + 1 })), excluidas: 0 };
        CE.emitir('pdf:organizar', { nome: arquivo.nome, paginas: organizar.paginas.length });
        desenhar();
      }
      function desenharOrganizar() {
        const { meta } = lido();
        const ps = organizar.paginas;
        const mexer = (i, f) => () => { f(i); desenharOrganizar(); };
        folhas.replaceChildren(CE.el('div', { class: 'pdf-organizar' },
          CE.el('div', { class: 'pdf-organizar-topo' },
            CE.el('b', {}, `📑 Organizar páginas — ${ps.length} página(s)`),
            CE.el('span', { class: 'ft-dica' }, 'Gire a página que veio deitada, tire a que sobrou e mude a ordem. Depois clique em "💾 Salvar".'),
            CE.el('button', { class: 'botao secundario pequeno', 'data-comando': 'cancelar-organizar', onclick: () => { organizar = null; desenhar(); } }, 'Cancelar'),
            CE.el('button', { class: 'botao pequeno', 'data-comando': 'salvar-organizar', onclick: salvarOrganizar }, '💾 Salvar')),
          CE.el('div', { class: 'pdf-miniaturas' }, ...ps.map((p, i) => CE.el('div', { class: 'pdf-miniatura', 'data-miniatura': i + 1, 'data-original': p.original, 'data-giro': String(p.giro) },
            CE.el('div', { class: 'pdf-mini-folha' }, CE.el('div', { class: 'pdf-mini-conteudo editor-pagina', style: `padding:${MARGENS[meta.margem] || MARGENS.normal}`, html: p.html })),
            CE.el('span', { class: 'pdf-mini-numero' }, `Página ${i + 1}`),
            CE.el('div', { class: 'pdf-mini-botoes' },
              CE.el('button', { title: 'Mover para a esquerda (antes)', 'data-mini-acao': 'antes', disabled: i === 0 ? true : null, onclick: mexer(i, (k) => { [ps[k - 1], ps[k]] = [ps[k], ps[k - 1]]; CE.emitir('pdf:pagina-movida', { de: k + 1, para: k }); }) }, '◀'),
              CE.el('button', { title: 'Girar para a esquerda', 'data-mini-acao': 'girar-esquerda', onclick: mexer(i, (k) => { ps[k].giro = (ps[k].giro + 270) % 360; CE.emitir('pdf:pagina-girada', { pagina: k + 1, giro: ps[k].giro }); }) }, '↺'),
              CE.el('button', { title: 'Girar para a direita', 'data-mini-acao': 'girar-direita', onclick: mexer(i, (k) => { ps[k].giro = (ps[k].giro + 90) % 360; CE.emitir('pdf:pagina-girada', { pagina: k + 1, giro: ps[k].giro }); }) }, '↻'),
              CE.el('button', { title: 'Excluir esta página', 'data-mini-acao': 'excluir', disabled: ps.length < 2 ? true : null, onclick: mexer(i, (k) => { const [fora] = ps.splice(k, 1); organizar.excluidas++; CE.emitir('pdf:pagina-excluida', { pagina: k + 1, vazia: !fora.html.replace(/<[^>]*>/g, '').trim() && !/<img/i.test(fora.html) }); }) }, '🗑️'),
              CE.el('button', { title: 'Mover para a direita (depois)', 'data-mini-acao': 'depois', disabled: i === ps.length - 1 ? true : null, onclick: mexer(i, (k) => { [ps[k + 1], ps[k]] = [ps[k], ps[k + 1]]; CE.emitir('pdf:pagina-movida', { de: k + 1, para: k + 2 }); }) }, '▶')))))));
        folhas.style.zoom = 1;
        barraForm.hidden = true;
      }
      async function salvarOrganizar() {
        const nome = await CE.perguntar('Salvar o PDF organizado com o nome:', arquivo.nome);
        if (!nome || !organizar) return;
        const { meta } = lido();
        const ps = organizar.paginas;
        const giros = Object.fromEntries(ps.map((p, i) => [i, p.giro]).filter(([, g]) => g));
        const conteudo = montar({ ...meta, giros: Object.keys(giros).length ? giros : null }, ps.map((p) => p.html));
        try {
          arquivo = await CE.sessao.salvarArquivo({ nome, tipo: 'pdf', conteudo, local: arquivo.local || 'pc', pasta: arquivo.pasta || '' });
        } catch (e) { CE.avisar('⚠️ ' + e.message); return; }
        CE.emitir('pdf:organizado', { nome, paginas: ps.length, giros: Object.values(giros), ordem: ps.map((p) => p.original), excluidas: organizar.excluidas });
        CE.avisar(`💾 PDF "${nome}" salvo com ${ps.length} página(s).`);
        organizar = null;
        desenhar();
      }

      // ---------- Juntar PDFs ----------
      async function juntar() {
        CE.emitir('pdf:juntar', {});
        const escolhidos = await CE.escolherArquivo({ mensagem: '➕ Juntar PDFs: escolha os arquivos na ordem em que eles vão ficar.', filtro: (a) => a.tipo === 'pdf', varios: true, minimo: 2, botao: 'Juntar' });
        if (!escolhidos || escolhidos.length < 2) return;
        const nome = await CE.perguntar('Nome do PDF novo (com tudo junto):', 'Documentos juntos');
        if (!nome) return;
        const partes = escolhidos.map((a) => CE.lerDocumento(a.conteudo));
        const paginas = [], giros = {};
        partes.forEach((p) => paginasDe(p.html).forEach((h, i) => { const g = Number((p.meta.giros || {})[i]) || 0; if (g) giros[paginas.length] = g; paginas.push(h); }));
        const conteudo = montar({ margem: partes[0].meta.margem, giros: Object.keys(giros).length ? giros : null }, paginas);
        try {
          arquivo = await CE.sessao.salvarArquivo({ nome, tipo: 'pdf', conteudo, local: escolhidos[0].local || 'pc', pasta: escolhidos[0].pasta || '' });
        } catch (e) { CE.avisar('⚠️ ' + e.message); return; }
        valores = {}; alterado = false; organizar = null;
        CE.emitir('pdf:juntado', { nome, arquivos: escolhidos.map((a) => a.nome), paginas: paginas.length });
        CE.avisar(`➕ Pronto! "${nome}" tem ${paginas.length} página(s), de ${escolhidos.length} PDFs.`);
        desenhar();
        fundo.scrollTop = 0;
      }

      // ---------- Assinar (pelo Cidadão Digital) ----------
      function assinar() {
        if (!arquivo) { CE.avisar('Abra primeiro o PDF que vai assinar.'); return; }
        if (alterado) { CE.avisar('Salve o formulário preenchido antes de assinar.'); return; }
        if (CE.assinatura) CE.assinatura.pendente = arquivo;
        CE.emitir('pdf:assinar', { nome: arquivo.nome });
        CE.janelas.abrir('navegador', { url: 'cidadaodigital.org.br/assinar' });
      }

      function mudarZoom(d) { zoom = Math.min(1.6, Math.max(0.4, Math.round((zoom + d) * 10) / 10)); if (!organizar) desenhar(); CE.emitir('pdf:zoom', { zoom }); }
      fundo.addEventListener('scroll', () => {
        if (organizar) return;
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
          CE.el('div', { class: 'ferramentas-grupo' },
            b('imprimir', '🖨️ Imprimir', 'Imprimir na impressora de treino', () => {
              if (!arquivo) return;
              CE.avisar(`🖨️ Imprimindo "${arquivo.nome}.pdf"...`);
              CE.emitir('pdf:impresso', { nome: arquivo.nome });
            }),
            b('juntar', '➕ Juntar PDFs', 'Juntar vários PDFs num arquivo só (ex.: RG frente e verso + comprovante)', juntar),
            b('organizar', '📑 Organizar páginas', 'Girar, excluir ou mudar a ordem das páginas', comecarOrganizar),
            b('assinar', '✍️ Assinar', 'Assinar este PDF pelo Cidadão Digital (como a assinatura gov.br)', assinar)),
          aviso),
        barraForm,
        fundo);
      const carregar = (a) => {
        arquivo = a; valores = {}; alterado = false; organizar = null;
        desenhar(); fundo.scrollTop = 0;
        CE.emitir('arquivo:aberto', { nome: a.nome, tipo: 'pdf' });
        CE.emitir('pdf:aberto', { nome: a.nome, paginas: CE.pdf.paginas(a.conteudo).length, campos: Object.keys(CE.pdf.campos(a.conteudo)).length, assinaturas: assinaturas().length });
      };
      if (argumento && argumento.arquivo) carregar(argumento.arquivo); else desenhar();
      return {
        receber(arg) { if (arg && arg.arquivo) carregar(arg.arquivo); },
        aoFechar(opcoes = {}) {
          if (!alterado || podeFechar || opcoes.forcado) return true;
          if (perguntando) return false;
          perguntando = CE.confirmar('Você preencheu o formulário e não salvou. Fechar mesmo assim?').then((sim) => {
            perguntando = null;
            if (!sim) return;
            podeFechar = true;
            janela.fechar();
          });
          return false;
        },
      };
    },
  });
})();
