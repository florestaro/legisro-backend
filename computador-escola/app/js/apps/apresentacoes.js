// Apresentações (parecido com o PowerPoint): slides com layouts, temas, imagens, gráficos da Planilha,
// anotações do apresentador, transições e o modo "Apresentar" em tela cheia.
(function () {
  const LAYOUTS = {
    titulo: { nome: 'Slide de título', icone: '🅰️' },
    conteudo: { nome: 'Título e tópicos', icone: '📝' },
    imagem: { nome: 'Título, texto e imagem', icone: '🖼️' },
    comparacao: { nome: 'Duas colunas', icone: '◫' },
  };
  const TEMAS = { claro: 'Claro', azul: 'Azul', verde: 'Verde', sol: 'Pôr do sol', quadro: 'Quadro-negro' };
  const TRANSICOES = { nenhuma: 'Sem transição', aparecer: 'Aparecer', deslizar: 'Deslizar', zoom: 'Zoom' };
  // Animação dos tópicos: na apresentação, cada clique mostra o próximo tópico.
  const ANIMACOES = { nenhuma: 'Sem animação', aparecer: 'Aparecer', surgir: 'Surgir (de baixo)', voar: 'Voar (da esquerda)' };
  const LOGOS = ['', '🏢', '🏫', '🏥', '🛒', '🌳', '⭐', '💼', '🔧'];
  const DICAS = {
    titulo: 'Clique para escrever o título', subtitulo: 'Clique para escrever o subtítulo',
    texto: 'Clique para escrever os tópicos', texto2: 'Clique para escrever a outra coluna',
  };
  const FIGURAS = ['🌻', '🎂', '🏠', '🐶', '🐱', '⭐', '❤️', '🎉', '🌳', '☀️', '⚽', '📚', '💻', '📈', '🎈', '🍰'];
  let contador = 0;
  const novoSlide = (layout = 'conteudo') => ({ id: 's' + Date.now().toString(36) + (contador++), layout, titulo: '', texto: '', texto2: '', imagem: null, grafico: null, notas: '' });
  const textoPuro = (html) => { const d = document.createElement('div'); d.innerHTML = html || ''; return d.innerText.trim(); };

  // Monta um slide (editável no programa, ou só para ver nas miniaturas e na apresentação).
  function montarSlide(slide, tema, editavel, aoEditar, mestre = null, numero = 0) {
    const caixa = (campo, classe) => {
      const el = CE.el('div', { class: classe, 'data-campo': campo, 'data-dica': DICAS[campo === 'texto' && slide.layout === 'titulo' ? 'subtitulo' : campo], html: slide[campo] || '' });
      if (editavel) {
        el.contentEditable = 'true';
        el.spellcheck = false;
        el.addEventListener('input', () => aoEditar(campo, el.innerHTML));
        el.addEventListener('focus', () => { if (campo !== 'titulo' && slide.layout !== 'titulo' && !el.innerHTML.trim()) { el.innerHTML = '<ul><li><br></li></ul>'; } });
      }
      return el;
    };
    const midia = slide.grafico ? CE.el('div', { class: 'ap-midia', html: CE.graficos.desenhar(slide.grafico, 520, 340) })
      : slide.imagem ? CE.el('div', { class: 'ap-midia' }, CE.el('img', { src: slide.imagem, alt: 'Imagem do slide' }))
        : editavel ? CE.el('button', { class: 'ap-midia vazia', 'data-acao': 'escolher-imagem' }, '🖼️ Clique para pôr uma imagem') : CE.el('div', { class: 'ap-midia' });
    const partes = { titulo: [caixa('titulo', 'ap-titulo'), caixa('texto', 'ap-subtitulo')],
      conteudo: [caixa('titulo', 'ap-titulo'), caixa('texto', 'ap-texto')],
      imagem: [caixa('titulo', 'ap-titulo'), CE.el('div', { class: 'ap-colunas' }, caixa('texto', 'ap-texto'), midia)],
      comparacao: [caixa('titulo', 'ap-titulo'), CE.el('div', { class: 'ap-colunas' }, caixa('texto', 'ap-texto'), caixa('texto2', 'ap-texto'))] };
    // Slide mestre: rodapé, número e logotipo iguais em todos os slides.
    const m = mestre || {};
    const extras = m.rodape || m.numerar || m.logo ? [CE.el('div', { class: 'ap-mestre', 'data-mestre': '' },
      CE.el('span', { class: 'ap-mestre-logo' }, m.logo || ''), CE.el('span', { class: 'ap-mestre-rodape' }, m.rodape || ''), CE.el('span', { class: 'ap-mestre-numero' }, m.numerar && numero ? String(numero) : ''))] : [];
    return CE.el('div', { class: `ap-slide tema-${tema} layout-${slide.layout}${m.fonte ? ' fonte-' + m.fonte : ''}`, 'data-slide': slide.id, 'data-animacao': slide.animacao || 'nenhuma' }, ...(partes[slide.layout] || partes.conteudo), ...extras);
  }

  CE.registrarApp({
    id: 'apresentacoes',
    nome: 'Apresentações',
    icone: '📽️',
    largura: 1000,
    altura: 640,
    abrir(corpo, janela, argumento) {
      let doc = { tema: 'claro', transicao: 'nenhuma', slides: [novoSlide('titulo')] };
      let atual = 0, nomeArquivo = null, modificado = false, podeFechar = false, aviso = null;
      const esperaTexto = {}; // um temporizador para cada campo do slide

      const miniaturas = CE.el('div', { class: 'ap-miniaturas', 'aria-label': 'Slides' });
      const palco = CE.el('div', { class: 'ap-palco' });
      const moldura = CE.el('div', { class: 'ap-moldura' });
      palco.append(moldura);
      const notas = CE.el('textarea', { class: 'ap-notas', 'data-campo': 'notas', placeholder: '🗒️ Anotações do apresentador (só você vê): escreva aqui o que vai falar neste slide.' });
      const status = CE.el('div', { class: 'editor-status' });

      const slideAtual = () => doc.slides[atual];
      function marcar() { modificado = true; atualizarStatus(); }
      function atualizarStatus() {
        status.textContent = `${nomeArquivo || 'Apresentação sem nome'}${modificado ? ' (não salva)' : ''} · Slide ${atual + 1} de ${doc.slides.length}`;
        janela.definirTitulo(nomeArquivo || 'Apresentação sem nome');
      }
      // O slide é desenhado em 960x540 e encolhe para caber no espaço da janela.
      function ajustarEscala() {
        const l = palco.clientWidth - 24, a = palco.clientHeight - 24;
        const e = Math.max(0.2, Math.min(l / 960, a / 540));
        moldura.style.transform = `scale(${e})`;
        moldura.style.width = '960px';
        moldura.style.height = '540px';
        moldura.style.marginLeft = Math.max(0, (l - 960 * e) / 2) + 'px';
      }
      const observador = new ResizeObserver(ajustarEscala);
      observador.observe(palco);

      function desenharMiniaturas() {
        miniaturas.replaceChildren(...doc.slides.map((s, i) => {
          const m = CE.el('button', { class: 'ap-miniatura' + (i === atual ? ' ativa' : ''), 'data-miniatura': i + 1, draggable: 'true', title: `Slide ${i + 1}` },
            CE.el('span', { class: 'ap-numero' }, String(i + 1)),
            CE.el('div', { class: 'ap-mini-slide' }, montarSlide(s, doc.tema, false, null, doc.mestre, i + 1)), s.animacao && s.animacao !== 'nenhuma' ? CE.el('span', { class: 'ap-mini-animacao', title: 'Este slide tem animação' }, '🎬') : '');
          m.addEventListener('click', () => irPara(i));
          m.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', String(i)); });
          m.addEventListener('dragover', (e) => { e.preventDefault(); m.classList.add('soltar-aqui'); });
          m.addEventListener('dragleave', () => m.classList.remove('soltar-aqui'));
          m.addEventListener('drop', (e) => { e.preventDefault(); m.classList.remove('soltar-aqui'); mover(Number(e.dataTransfer.getData('text/plain')), i); });
          return m;
        }));
      }
      function desenharSlide() {
        const s = slideAtual();
        moldura.replaceChildren(montarSlide(s, doc.tema, true, (campo, html) => {
          s[campo] = html;
          marcar();
          clearTimeout(esperaTexto[campo]);
          esperaTexto[campo] = setTimeout(() => {
            desenharMiniaturas();
            CE.emitir('apresentacao:texto', { slide: atual + 1, campo, texto: textoPuro(html) });
          }, 350);
        }, doc.mestre, atual + 1));
        seletorAnimacao.value = s.animacao || 'nenhuma';
        const botaoImagem = moldura.querySelector('[data-acao="escolher-imagem"]');
        if (botaoImagem) botaoImagem.addEventListener('click', escolherImagem);
        notas.value = s.notas || '';
        seletorTema.value = doc.tema;
        seletorTransicao.value = doc.transicao;
        ajustarEscala();
      }
      function desenhar() { desenharMiniaturas(); desenharSlide(); atualizarStatus(); }
      function irPara(i) { atual = Math.max(0, Math.min(doc.slides.length - 1, i)); desenhar(); CE.emitir('apresentacao:selecionado', { slide: atual + 1 }); }

      // ---------- Slides ----------
      function adicionar(layout) {
        menuNovo.hidden = true;
        doc.slides.splice(atual + 1, 0, novoSlide(layout));
        atual++;
        marcar(); desenhar();
        CE.emitir('apresentacao:slide-novo', { layout, total: doc.slides.length, posicao: atual + 1 });
        setTimeout(() => { const t = moldura.querySelector('.ap-titulo'); if (t) t.focus(); }, 30);
      }
      function duplicar() {
        doc.slides.splice(atual + 1, 0, { ...JSON.parse(JSON.stringify(slideAtual())), id: novoSlide().id });
        atual++; marcar(); desenhar();
        CE.emitir('apresentacao:slide-duplicado', { total: doc.slides.length });
      }
      async function excluirSlide() {
        if (doc.slides.length === 1) { CE.avisar('A apresentação precisa ter pelo menos um slide.'); return; }
        if (!await CE.confirmar(`Excluir o slide ${atual + 1}?`)) return;
        doc.slides.splice(atual, 1);
        atual = Math.min(atual, doc.slides.length - 1);
        marcar(); desenhar();
        CE.emitir('apresentacao:slide-excluido', { total: doc.slides.length });
      }
      function mover(de, para) {
        if (de === para || de < 0 || para < 0 || de >= doc.slides.length || para >= doc.slides.length) return;
        const [s] = doc.slides.splice(de, 1);
        doc.slides.splice(para, 0, s);
        atual = para;
        marcar(); desenhar();
        CE.emitir('apresentacao:slide-movido', { de: de + 1, para: para + 1, titulo: textoPuro(s.titulo) });
      }
      async function escolherImagem() {
        const vale = CE.sessao.marca();
        const desenhos = (await CE.sessao.arquivos()).filter((a) => a.tipo === 'imagem' && !a.naLixeira);
        if (!vale()) return;
        const usar = (src, origem) => {
          fundo.remove();
          const s = slideAtual();
          s.imagem = src; s.grafico = null;
          if (s.layout !== 'imagem') s.layout = 'imagem';
          marcar(); desenhar();
          CE.emitir('apresentacao:imagem', { slide: atual + 1, origem });
        };
        const emoji = (f) => { const c = document.createElement('canvas'); c.width = c.height = 400; const x = c.getContext('2d'); x.font = '310px "Segoe UI Emoji", "Noto Color Emoji", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(f, 200, 222); return c.toDataURL('image/png'); };
        const fundo = CE.el('div', { class: 'dialogo-fundo' },
          CE.el('div', { class: 'dialogo largo' },
            CE.el('p', {}, '🖼️ Escolha uma imagem para o slide:'),
            desenhos.length ? CE.el('strong', {}, 'Seus desenhos') : null,
            desenhos.length ? CE.el('div', { class: 'ed-galeria' }, ...desenhos.map((d) => CE.el('button', { class: 'ed-galeria-item', 'data-imagem': d.nome, onclick: () => usar(d.conteudo, 'desenho') }, CE.el('img', { src: d.conteudo, alt: d.nome }), CE.el('small', {}, d.nome)))) : null,
            CE.el('strong', {}, 'Figuras'),
            CE.el('div', { class: 'ed-galeria' }, ...FIGURAS.map((f) => CE.el('button', { class: 'ed-galeria-item figura', 'data-figura': f, onclick: () => usar(emoji(f), 'figura') }, f))),
            CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'))));
        document.body.append(fundo);
      }
      // Gráfico: copia um gráfico de uma planilha salva (os números do momento).
      async function escolherGrafico() {
        const vale = CE.sessao.marca();
        const planilhas = (await CE.sessao.arquivos()).filter((a) => a.tipo === 'planilha' && !a.naLixeira);
        if (!vale()) return;
        const opcoes = [];
        planilhas.forEach((a) => {
          let dados = {};
          try { dados = JSON.parse(a.conteudo || '{}'); } catch { /* ignora */ }
          (dados.graficos || []).forEach((g) => opcoes.push({ arquivo: a.nome, g, dados }));
        });
        if (!opcoes.length) { CE.avisar('📊 Nenhuma planilha salva tem gráfico. Faça um gráfico na Planilha, salve e volte aqui.'); return; }
        const usar = (o) => {
          fundo.remove();
          const s = slideAtual();
          s.grafico = CE.graficoDaPlanilha(o.dados, o.g);
          s.imagem = null;
          if (s.layout !== 'imagem') s.layout = 'imagem';
          if (!textoPuro(s.titulo) && o.g.titulo) s.titulo = CE.escapar(o.g.titulo);
          marcar(); desenhar();
          CE.emitir('apresentacao:grafico', { slide: atual + 1, planilha: o.arquivo, tipo: o.g.tipo });
        };
        const fundo = CE.el('div', { class: 'dialogo-fundo' },
          CE.el('div', { class: 'dialogo largo' },
            CE.el('p', {}, '📊 Escolha o gráfico (das suas planilhas salvas):'),
            CE.el('div', { class: 'ap-graficos' }, ...opcoes.map((o) => CE.el('button', { class: 'ap-grafico-opcao', 'data-grafico-planilha': o.arquivo, onclick: () => usar(o) },
              CE.el('div', { html: CE.graficos.desenhar(CE.graficoDaPlanilha(o.dados, o.g), 300, 190) }), CE.el('small', {}, `📊 ${o.arquivo}`)))),
            CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'))));
        document.body.append(fundo);
      }

      // ---------- Apresentar (tela cheia) ----------
      let sairApresentacao = null; // fecha a tela cheia aberta (o programa fechando, ou o aluno saindo do sistema)
      function apresentar(inicio = 0, opcoes = {}) {
        if (sairApresentacao) sairApresentacao({ calado: true });
        const apresentador = !!opcoes.apresentador;
        let i = inicio, fim = false, mostrados = 0; // mostrados: quantos tópicos animados já apareceram
        const comecou = Date.now();
        const topicos = (k) => (doc.slides[k].animacao && doc.slides[k].animacao !== 'nenhuma' ? (doc.slides[k].texto.match(/<li/gi) || []).length + (doc.slides[k].layout === 'comparacao' ? (doc.slides[k].texto2.match(/<li/gi) || []).length : 0) : 0);
        const vistos = new Set([i]);
        const tela = CE.el('div', { class: 'ap-apresentacao', tabindex: '0', 'data-transicao': doc.transicao });
        const contador = CE.el('div', { class: 'ap-contador' });
        const mostrar = () => {
          const escala = Math.min(window.innerWidth / 960, window.innerHeight / 540);
          if (fim) {
            tela.replaceChildren(CE.el('div', { class: 'ap-fim' }, 'Fim da apresentação. Clique ou aperte Esc para sair.'), contador);
            contador.textContent = '';
            return;
          }
          const area = apresentador ? 0.68 : 1;
          const esc = apresentador ? Math.min((window.innerWidth * area) / 960, (window.innerHeight * 0.8) / 540) : escala;
          const s = montarSlide(doc.slides[i], doc.tema, false, null, doc.mestre, i + 1);
          const anim = doc.slides[i].animacao || 'nenhuma';
          if (anim !== 'nenhuma') s.querySelectorAll('li').forEach((li, k) => { li.classList.add('ap-anima', 'anima-' + anim); if (k < mostrados) li.classList.add('mostrado'); });
          const caixa = CE.el('div', { class: `ap-tela-slide transicao-${doc.transicao}${apresentador ? ' com-apresentador' : ''}`, style: `transform: translate(-50%, -50%) scale(${esc})` }, s);
          const partes = [caixa, contador];
          if (apresentador) {
            const prox = doc.slides[i + 1];
            const minutos = Math.floor((Date.now() - comecou) / 60000), segundos = Math.floor((Date.now() - comecou) / 1000) % 60;
            partes.push(CE.el('div', { class: 'ap-painel-apresentador', 'data-apresentador': '' },
              CE.el('div', { class: 'ap-relogio' }, `⏱️ ${minutos}:${String(segundos).padStart(2, '0')}`),
              CE.el('strong', {}, '🗒️ Suas anotações (o público não vê):'),
              CE.el('div', { class: 'ap-painel-notas', 'data-notas-apresentador': '' }, doc.slides[i].notas || '(sem anotações neste slide)'),
              CE.el('strong', {}, 'Próximo slide:'),
              CE.el('div', { class: 'ap-painel-proximo' }, prox ? `${i + 2}. ${textoPuro(prox.titulo) || '(sem título)'}` : 'É o último slide.')));
          }
          tela.replaceChildren(...partes);
          contador.textContent = `${i + 1} / ${doc.slides.length}`;
          CE.emitir('apresentacao:slide', { numero: i + 1, total: doc.slides.length, apresentador, notas: apresentador ? doc.slides[i].notas || '' : undefined });
        };
        const sair = (opcoes = {}) => {
          tela.remove();
          document.removeEventListener('keydown', teclas, true);
          sairApresentacao = null;
          if (!opcoes.calado) CE.emitir('apresentacao:fim', { vistos: vistos.size, total: doc.slides.length, completa: vistos.size === doc.slides.length });
        };
        sairApresentacao = sair;
        const avancar = () => {
          if (fim) { sair(); return; }
          // Slide com animação: cada clique mostra o próximo tópico antes de trocar de slide.
          if (mostrados < topicos(i)) {
            mostrados++;
            const li = tela.querySelectorAll('.ap-anima')[mostrados - 1];
            if (li) li.classList.add('mostrado');
            CE.emitir('apresentacao:animou', { slide: i + 1, item: mostrados, total: topicos(i), animacao: doc.slides[i].animacao });
            return;
          }
          mostrados = 0;
          if (i < doc.slides.length - 1) { i++; vistos.add(i); } else fim = true;
          mostrar();
        };
        const voltar = () => { mostrados = 0; if (fim) fim = false; else if (i > 0) i--; mostrar(); };
        const teclas = (e) => {
          const k = e.key;
          if (['ArrowRight', 'ArrowDown', ' ', 'Enter', 'PageDown'].includes(k)) { e.preventDefault(); e.stopPropagation(); avancar(); }
          else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) { e.preventDefault(); e.stopPropagation(); voltar(); }
          else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); sair(); }
        };
        tela.addEventListener('click', avancar);
        tela.addEventListener('contextmenu', (e) => { e.preventDefault(); voltar(); });
        document.addEventListener('keydown', teclas, true);
        document.body.append(tela);
        tela.focus();
        CE.emitir('apresentacao:iniciada', { total: doc.slides.length, inicio: inicio + 1, apresentador });
        mostrar();
      }

      // ---------- Arquivo ----------
      async function salvar() {
        let nome = nomeArquivo;
        if (!nome) { nome = await CE.perguntar('Qual o nome da apresentação?', 'Minha apresentação'); if (!nome) return false; }
        await CE.sessao.salvarArquivo({ nome, tipo: 'apresentacao', conteudo: JSON.stringify(doc) });
        nomeArquivo = nome; modificado = false; atualizarStatus();
        CE.avisar(`Apresentação "${nome}" salva!`);
        return true;
      }
      async function nova() {
        if (modificado && await CE.confirmar('Quer salvar a apresentação atual antes de começar uma nova?')) { if (!await salvar()) return; }
        doc = { tema: 'claro', transicao: 'nenhuma', slides: [novoSlide('titulo')] };
        atual = 0; nomeArquivo = null; modificado = false;
        desenhar();
        CE.emitir('apresentacao:nova');
      }
      function carregar(arquivo) {
        try { doc = JSON.parse(arquivo.conteudo || '{}'); } catch { doc = {}; }
        doc = { tema: 'claro', transicao: 'nenhuma', ...doc };
        if (!Array.isArray(doc.slides) || !doc.slides.length) doc.slides = [novoSlide('titulo')];
        atual = 0; nomeArquivo = arquivo.nome; modificado = false;
        desenhar();
        CE.emitir('arquivo:aberto', { nome: arquivo.nome, tipo: 'apresentacao' });
      }

      // ---------- Barra de ferramentas ----------
      const fb = (comando, rotulo, dica, f, classe = 'texto') => CE.el('button', { class: 'ferramenta ' + classe, 'data-comando': comando, title: dica, onmousedown: (e) => e.preventDefault(), onclick: f }, rotulo);
      const formatar = (cmd) => { document.execCommand(cmd); CE.emitir('apresentacao:formatado', { comando: cmd, slide: atual + 1 }); };
      const menuNovo = CE.el('div', { class: 'ed-menu', hidden: true }, ...Object.entries(LAYOUTS).map(([id, l]) => CE.el('button', { class: 'menu-item', 'data-layout': id, onclick: () => adicionar(id) }, `${l.icone} ${l.nome}`)));
      document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.ap-novo')) menuNovo.hidden = true; });
      const seletorTema = CE.el('select', { class: 'ferramenta-select', 'data-comando': 'tema', title: 'Tema (cores de todos os slides)', onchange: (e) => {
        doc.tema = e.target.value; marcar(); desenhar(); CE.emitir('apresentacao:tema', { tema: doc.tema, nome: TEMAS[doc.tema] });
      } }, ...Object.entries(TEMAS).map(([id, n]) => CE.el('option', { value: id }, `🎨 ${n}`)));
      const seletorTransicao = CE.el('select', { class: 'ferramenta-select', 'data-comando': 'transicao', title: 'Transição: o efeito ao passar de um slide para o outro', onchange: (e) => {
        doc.transicao = e.target.value; marcar(); CE.emitir('apresentacao:transicao', { transicao: doc.transicao });
      } }, ...Object.entries(TRANSICOES).map(([id, n]) => CE.el('option', { value: id }, `✨ ${n}`)));
      const seletorAnimacao = CE.el('select', { class: 'ferramenta-select', 'data-comando': 'animacao', title: 'Animação deste slide: na apresentação, os tópicos aparecem um de cada vez, a cada clique', onchange: (e) => {
        slideAtual().animacao = e.target.value; marcar(); desenharMiniaturas();
        CE.emitir('apresentacao:animacao', { slide: atual + 1, animacao: e.target.value, nome: ANIMACOES[e.target.value] });
      } }, ...Object.entries(ANIMACOES).map(([id, n]) => CE.el('option', { value: id }, `🎬 ${n}`)));
      // Slide mestre: o que se repete em todos os slides (rodapé, número, logotipo e fonte).
      function dialogoMestre() {
        const m = { rodape: '', numerar: false, logo: '', fonte: '', ...(doc.mestre || {}) };
        const rodape = CE.el('input', { class: 'campo', value: m.rodape, placeholder: 'Ex.: Empresa Bom Preço — Reunião de novembro', 'data-mestre-rodape': '' });
        const numerar = CE.el('input', { type: 'checkbox', checked: !!m.numerar, 'data-mestre-numerar': '' });
        const fonte = CE.el('select', { class: 'campo', 'data-mestre-fonte': '' }, ...[['', 'A fonte do tema'], ['arial', 'Arial'], ['georgia', 'Georgia (com serifa)'], ['verdana', 'Verdana']].map(([v, n]) => CE.el('option', { value: v, selected: v === m.fonte }, n)));
        let logo = m.logo;
        const logos = CE.el('div', { class: 'ed-galeria' }, ...LOGOS.map((l) => CE.el('button', { class: 'ed-galeria-item figura' + (l === logo ? ' ligado' : ''), 'data-mestre-logo': l || 'nenhum', onclick: (e) => { logo = l; logos.querySelectorAll('button').forEach((b) => b.classList.toggle('ligado', b === e.currentTarget)); } }, l || '∅')));
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo largo' },
          CE.el('p', {}, '🧩 Slide mestre: o que você puser aqui aparece em TODOS os slides de uma vez.'),
          CE.el('label', {}, 'Rodapé', rodape),
          CE.el('label', { class: 'pl-check' }, numerar, ' Mostrar o número do slide'),
          CE.el('label', {}, 'Fonte de todos os slides', fonte),
          CE.el('strong', {}, 'Logotipo (no canto):'), logos,
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'),
            CE.el('button', { class: 'botao', 'data-mestre-ok': '', onclick: () => {
              fundo.remove();
              doc.mestre = { rodape: rodape.value.trim(), numerar: numerar.checked, logo, fonte: fonte.value };
              marcar(); desenhar();
              CE.emitir('apresentacao:mestre', { ...doc.mestre, slides: doc.slides.length });
            } }, 'Aplicar em todos'))));
        document.body.append(fundo);
        rodape.focus();
      }
      notas.addEventListener('input', () => { slideAtual().notas = notas.value; marcar(); });
      notas.addEventListener('change', () => CE.emitir('apresentacao:notas', { slide: atual + 1, texto: notas.value }));

      corpo.classList.add('apresentacoes');
      corpo.append(
        CE.el('div', { class: 'ferramentas' },
          CE.el('div', { class: 'ferramentas-grupo' }, fb('nova', '📄 Nova', 'Começar uma apresentação nova', nova), fb('abrir', '📂 Abrir', 'Abrir uma apresentação salva', () => CE.janelas.abrir('arquivos')), fb('salvar', '💾 Salvar', 'Salvar (Ctrl+S)', () => salvar())),
          CE.el('div', { class: 'ferramentas-grupo' },
            CE.el('div', { class: 'ed-novo ap-novo' }, fb('novo-slide', '➕ Novo slide ▾', 'Acrescentar um slide depois deste', () => { menuNovo.hidden = !menuNovo.hidden; }), menuNovo),
            fb('duplicar', '📑 Duplicar', 'Fazer uma cópia deste slide', duplicar),
            fb('excluir-slide', '🗑️', 'Excluir este slide', excluirSlide, ''),
            fb('subir', '⬆️', 'Mover o slide para cima', () => mover(atual, atual - 1), ''),
            fb('descer', '⬇️', 'Mover o slide para baixo', () => mover(atual, atual + 1), '')),
          CE.el('div', { class: 'ferramentas-grupo' },
            fb('negrito', 'N', 'Negrito (Ctrl+B)', () => formatar('bold'), 'negrito'), fb('italico', 'I', 'Itálico (Ctrl+I)', () => formatar('italic'), 'italico'),
            fb('sublinhado', 'S', 'Sublinhado (Ctrl+U)', () => formatar('underline'), 'sublinhado'), fb('topicos', '•', 'Tópicos (lista com marcadores)', () => formatar('insertUnorderedList'), ''),
            fb('aumentar', 'A+', 'Letra maior', () => formatar('increaseFontSize'), ''), fb('diminuir', 'A−', 'Letra menor', () => formatar('decreaseFontSize'), '')),
          CE.el('div', { class: 'ferramentas-grupo' }, fb('imagem', '🖼️ Imagem', 'Pôr uma imagem no slide', escolherImagem), fb('grafico', '📊 Gráfico', 'Pôr um gráfico de uma planilha', escolherGrafico)),
          CE.el('div', { class: 'ferramentas-grupo' }, seletorTema, seletorTransicao, seletorAnimacao, fb('mestre', '🧩 Slide mestre', 'Slide mestre: rodapé, número e logotipo em todos os slides', dialogoMestre)),
          CE.el('div', { class: 'ferramentas-grupo' },
            CE.el('button', { class: 'botao ap-apresentar', 'data-comando': 'apresentar', title: 'Apresentar em tela cheia (F5)', onclick: () => apresentar(0) }, '▶ Apresentar'),
            fb('apresentador', '🗒️ Modo apresentador', 'Apresentar vendo as suas anotações, o próximo slide e o relógio (Alt+F5)', () => apresentar(0, { apresentador: true })))),
        CE.el('div', { class: 'ap-principal' }, miniaturas, CE.el('div', { class: 'ap-centro' }, palco, notas)),
        status);
      corpo.addEventListener('keydown', (e) => {
        if (e.key === 'F5') { e.preventDefault(); apresentar(e.shiftKey ? atual : 0, { apresentador: e.altKey }); }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); salvar(); }
      });
      if (argumento && argumento.arquivo) carregar(argumento.arquivo); else desenhar();

      const api = {
        slides: () => doc.slides.map((s) => ({ ...s, tituloTexto: textoPuro(s.titulo), textoTexto: textoPuro(s.texto) })),
        atual: () => atual + 1,
        tema: () => doc.tema,
        transicao: () => doc.transicao,
        mestre: () => doc.mestre || null,
        nome: () => nomeArquivo,
      };
      CE.apresentacaoAtiva = api;
      const pararAtivar = CE.ouvir('janela:ativada', (d) => { if (d.app === 'apresentacoes') CE.apresentacaoAtiva = api; });
      return {
        receber(arg) {
          if (!arg || !arg.arquivo) return;
          if (modificado) CE.confirmar('A apresentação atual não foi salva. Abrir outra mesmo assim?').then((sim) => sim && carregar(arg.arquivo));
          else carregar(arg.arquivo);
        },
        aoFechar(opcoes = {}) {
          if (modificado && !podeFechar && !opcoes.forcado) {
            if (!aviso) aviso = CE.confirmar('Você não salvou a apresentação. Quer salvar antes de fechar?').then(async (sim) => {
              aviso = null;
              if (sim && !await salvar()) return;
              podeFechar = true;
              janela.fechar();
            });
            return false;
          }
          if (sairApresentacao) sairApresentacao({ calado: !!opcoes.forcado });
          observador.disconnect();
          pararAtivar();
          if (CE.apresentacaoAtiva === api) CE.apresentacaoAtiva = null;
          return true;
        },
      };
    },
  });
})();
