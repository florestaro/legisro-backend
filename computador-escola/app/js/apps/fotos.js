// Editor de Fotos (curso livre Criação digital): abrir uma foto (exemplos, fotos do celular ou desenhos), girar,
// espelhar, cortar no tamanho certo (1:1 para post, 16:9, 3:4), brilho, contraste, cor, filtros, texto por cima,
// mudar o tamanho (e ver quantos KB o arquivo vai ter) e salvar como imagem em Meus Documentos.
window.CE = window.CE || {};

(function () {
  const EXEMPLOS = [['escura', 'Foto escura (Rio Madeira ao entardecer)'], ['deitada', 'Foto deitada (cachorro)'], ['paisagem', 'Rio Madeira'], ['bolo', 'Bolo'], ['cachorro', 'Cachorro'], ['flor', 'Flor'], ['prato', 'Almoço']];
  const FILTROS = { nenhum: ['Sem filtro', ''], pb: ['Preto e branco', 'grayscale(1)'], sepia: ['Sépia (antigo)', 'sepia(0.85)'], vivido: ['Vívido', 'saturate(1.6) contrast(1.12)'], frio: ['Frio', 'hue-rotate(18deg) saturate(1.1)'] };
  const CORTES = [['1:1', '⬛ Quadrado 1:1 (post de rede social)'], ['16:9', '▬ Paisagem 16:9 (vídeo, capa)'], ['3:4', '▮ Retrato 3:4 (foto de documento)']];
  const LARGURAS = [[1080, '1080 px (rede social)'], [800, '800 px (para e-mail)'], [400, '400 px (pequena)']];
  const POSICOES = [['cima', 'Em cima'], ['meio', 'No meio'], ['baixo', 'Embaixo']];
  const carregar = (src) => new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => erro(new Error('Não consegui abrir essa imagem.')); i.src = src; });
  // Fotos de exemplo: as mesmas cenas da câmera do celular (e uma versão escura, para treinar o brilho).
  async function exemplo(id) {
    const base = CE.celular ? CE.celular.imagemDe({ cena: id === 'escura' ? 'paisagem' : id === 'deitada' ? 'cachorro' : id }) : '';
    if (id !== 'escura' && id !== 'deitada') return base;
    const img = await carregar(base);
    const c = document.createElement('canvas');
    const x = c.getContext('2d');
    if (id === 'escura') { c.width = img.width; c.height = img.height; x.filter = 'brightness(0.45) contrast(0.8)'; x.drawImage(img, 0, 0); }
    else { c.width = img.height; c.height = img.width; x.translate(0, c.height); x.rotate(-Math.PI / 2); x.drawImage(img, 0, 0); } // saiu de lado
    return c.toDataURL('image/jpeg', 0.85);
  }
  const ESTADO_INICIAL = () => ({ giro: 0, espelho: false, corte: null, brilho: 100, contraste: 100, saturacao: 100, filtro: 'nenhum', textos: [], largura: null });

  CE.registrarApp({
    id: 'fotos', nome: 'Editor de Fotos', icone: '🌅', largura: 980, altura: 640,
    abrir(corpo, janela, argumento) {
      let original = null, nome = null, estado = ESTADO_INICIAL(), historico = [], modificado = false;
      const palco = CE.el('div', { class: 'ft-palco' }, CE.el('p', { class: 'ft-vazio' }, '🌅 Clique em "📂 Abrir foto" para começar.'));
      const lateral = CE.el('div', { class: 'ft-lateral' });
      const status = CE.el('div', { class: 'editor-status' });
      const guardar = () => { historico.push(JSON.stringify(estado)); if (historico.length > 40) historico.shift(); modificado = true; };
      const filtroCss = () => `brightness(${estado.brilho / 100}) contrast(${estado.contraste / 100}) saturate(${estado.saturacao / 100}) ${FILTROS[estado.filtro][1]}`.trim();

      function renderizar() {
        const img = original;
        const vira = estado.giro % 180 !== 0;
        const r = document.createElement('canvas');
        r.width = vira ? img.height : img.width; r.height = vira ? img.width : img.height;
        const rc = r.getContext('2d');
        rc.translate(r.width / 2, r.height / 2); rc.rotate((estado.giro * Math.PI) / 180); if (estado.espelho) rc.scale(-1, 1);
        rc.drawImage(img, -img.width / 2, -img.height / 2);
        let sx = 0, sy = 0, sw = r.width, sh = r.height;
        if (estado.corte) {
          const [a, b] = estado.corte.split(':').map(Number);
          const alvo = a / b;
          if (sw / sh > alvo) { const nw = sh * alvo; sx = (sw - nw) / 2; sw = nw; } else { const nh = sw / alvo; sy = (sh - nh) / 2; sh = nh; }
        }
        const largura = estado.largura || Math.round(sw);
        const altura = Math.max(1, Math.round((largura * sh) / sw));
        const c = document.createElement('canvas'); c.width = largura; c.height = altura;
        const x = c.getContext('2d');
        x.filter = filtroCss() || 'none';
        x.drawImage(r, sx, sy, sw, sh, 0, 0, largura, altura);
        x.filter = 'none';
        estado.textos.forEach((t) => {
          const tam = Math.max(12, Math.round((altura * t.tamanho) / 100));
          x.font = `bold ${tam}px Arial, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
          const y = t.posicao === 'cima' ? altura * 0.14 : t.posicao === 'baixo' ? altura * 0.86 : altura * 0.5;
          x.lineWidth = Math.max(2, tam / 8); x.strokeStyle = 'rgba(0,0,0,.65)'; x.strokeText(t.texto, largura / 2, y, largura * 0.94);
          x.fillStyle = t.cor; x.fillText(t.texto, largura / 2, y, largura * 0.94);
        });
        return c;
      }
      const kb = (c) => Math.round((c.toDataURL('image/jpeg', 0.85).length * 0.75) / 1024);

      function desenhar() {
        lateral.replaceChildren(...painel());
        if (!original) { status.textContent = 'Nenhuma foto aberta'; return; }
        const c = renderizar();
        c.className = 'ft-imagem';
        c.dataset.fotoTamanho = `${c.width}x${c.height}`;
        palco.replaceChildren(c);
        status.textContent = `${nome || 'Foto sem nome'}${modificado ? ' (não salva)' : ''} · ${c.width} × ${c.height} pixels · cerca de ${kb(c)} KB`;
        janela.definirTitulo(nome || 'Foto sem nome');
      }
      // Os controles da direita.
      function painel() {
        if (!original) return [CE.el('p', { class: 'ft-dica' }, 'Abra uma foto para ver os ajustes.')];
        const deslizante = (tipo, rotulo, min, max) => CE.el('label', { class: 'ft-ajuste' }, `${rotulo}: ${estado[tipo]}%`,
          CE.el('input', { type: 'range', min: String(min), max: String(max), step: '5', value: String(estado[tipo]), 'data-ajuste': tipo,
            onchange: (e) => { guardar(); estado[tipo] = Number(e.target.value); desenhar(); CE.emitir('fotos:ajuste', { tipo, valor: estado[tipo] }); } }));
        return [CE.el('h4', {}, '☀️ Ajustes'), deslizante('brilho', 'Brilho', 30, 200), deslizante('contraste', 'Contraste', 30, 200), deslizante('saturacao', 'Cor (saturação)', 0, 200),
          CE.el('h4', {}, '🎨 Filtros'),
          CE.el('div', { class: 'ft-filtros' }, ...Object.entries(FILTROS).map(([id, [nomeF]]) => CE.el('button', { class: 'ft-filtro' + (estado.filtro === id ? ' ligado' : ''), 'data-filtro': id,
            onclick: () => { guardar(); estado.filtro = id; desenhar(); CE.emitir('fotos:filtro', { filtro: id }); } }, nomeF))),
          CE.el('h4', {}, '📐 Tamanho'),
          CE.el('select', { class: 'campo', 'data-comando': 'tamanho', onchange: (e) => {
            guardar(); estado.largura = Number(e.target.value) || null; desenhar();
            CE.emitir('fotos:tamanho', { largura: estado.largura, kb: kb(renderizar()) });
          } }, CE.el('option', { value: '' }, 'Tamanho original'), ...LARGURAS.map(([v, r]) => CE.el('option', { value: String(v), selected: estado.largura === v }, r))),
          CE.el('p', { class: 'ft-dica' }, 'Foto menor = arquivo mais leve: chega mais rápido no e-mail e não enche o celular.')];
      }

      async function abrirFoto() {
        const vale = CE.sessao.marca();
        const minhas = (await CE.sessao.arquivos()).filter((a) => a.tipo === 'imagem' && !a.naLixeira);
        if (!vale()) return;
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo largo' },
          CE.el('p', {}, '📂 Escolha a foto:'),
          CE.el('strong', {}, 'Fotos de exemplo'),
          CE.el('div', { class: 'ed-galeria' }, ...EXEMPLOS.map(([id, n]) => CE.el('button', { class: 'ed-galeria-item', 'data-exemplo': id, title: n, onclick: async () => { fundo.remove(); usar(await exemplo(id), n, true, id); } },
            CE.el('span', { class: 'ft-ex-icone' }, id === 'escura' ? '🌆' : id === 'deitada' ? '🔄' : '🖼️'), CE.el('small', {}, n)))),
          minhas.length ? CE.el('strong', {}, 'Minhas imagens (fotos do celular e desenhos)') : null,
          minhas.length ? CE.el('div', { class: 'ed-galeria' }, ...minhas.map((a) => CE.el('button', { class: 'ed-galeria-item', 'data-imagem': a.nome, onclick: () => { fundo.remove(); usar(a.conteudo, a.nome, false); } },
            CE.el('img', { src: a.conteudo, alt: a.nome }), CE.el('small', {}, a.nome)))) : null,
          CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'))));
        document.body.append(fundo);
      }
      async function usar(src, n, ehExemplo, idExemplo = null) {
        try { original = await carregar(src); } catch (e) { CE.avisar('⚠️ ' + e.message); return; }
        nome = ehExemplo ? null : n; estado = ESTADO_INICIAL(); historico = []; modificado = false;
        desenhar();
        CE.emitir('fotos:aberta', { nome: n, exemplo: ehExemplo ? idExemplo : null });
      }
      const precisaFoto = () => { if (original) return true; CE.avisar('Abra uma foto primeiro (📂 Abrir foto).'); return false; };
      function girar() { if (!precisaFoto()) return; guardar(); estado.giro = (estado.giro + 90) % 360; desenhar(); CE.emitir('fotos:girar', { giro: estado.giro }); }
      function espelhar() { if (!precisaFoto()) return; guardar(); estado.espelho = !estado.espelho; desenhar(); CE.emitir('fotos:espelhar', { espelho: estado.espelho }); }
      function menuCortar() {
        if (!precisaFoto()) return;
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo' },
          CE.el('p', {}, '✂️ Cortar a foto (o corte fica no meio da foto):'),
          CE.el('div', { class: 'pl-opcoes-coluna' }, ...CORTES.map(([v, r]) => CE.el('button', { class: 'botao secundario', 'data-corte': v, onclick: () => { fundo.remove(); guardar(); estado.corte = v; desenhar(); CE.emitir('fotos:cortar', { proporcao: v }); } }, r)),
            CE.el('button', { class: 'botao secundario', 'data-corte': 'original', onclick: () => { fundo.remove(); guardar(); estado.corte = null; desenhar(); CE.emitir('fotos:cortar', { proporcao: null }); } }, '↺ Voltar ao original')),
          CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'))));
        document.body.append(fundo);
      }
      function dialogoTexto() {
        if (!precisaFoto()) return;
        const texto = CE.el('input', { class: 'campo', 'data-campo': 'texto-foto', placeholder: 'Ex.: PROMOÇÃO DE INVERNO' });
        const posicao = CE.el('select', { class: 'campo', 'data-campo': 'posicao-texto' }, ...POSICOES.map(([v, r]) => CE.el('option', { value: v }, r)));
        const cor = CE.el('input', { type: 'color', class: 'campo', value: '#ffffff', 'data-campo': 'cor-texto' });
        const tamanho = CE.el('select', { class: 'campo', 'data-campo': 'tamanho-texto' }, CE.el('option', { value: '8' }, 'Pequeno'), CE.el('option', { value: '12', selected: true }, 'Médio'), CE.el('option', { value: '17' }, 'Grande'));
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo' },
          CE.el('p', {}, '🔤 Escrever na foto'), texto, CE.el('label', {}, 'Onde', posicao), CE.el('label', {}, 'Cor', cor), CE.el('label', {}, 'Tamanho', tamanho),
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'),
            CE.el('button', { class: 'botao', 'data-acao': 'confirmar-texto', onclick: () => {
              if (!texto.value.trim()) { CE.avisar('Escreva o texto.'); return; }
              fundo.remove(); guardar();
              const t = { texto: texto.value.trim(), posicao: posicao.value, cor: cor.value, tamanho: Number(tamanho.value) };
              estado.textos.push(t); desenhar(); CE.emitir('fotos:texto', t);
            } }, 'Colocar na foto'))));
        document.body.append(fundo);
        texto.focus();
      }
      function desfazer() { if (!historico.length) return; estado = JSON.parse(historico.pop()); desenhar(); CE.emitir('fotos:desfeito'); }
      async function salvar() {
        if (!precisaFoto()) return false;
        const n = await CE.perguntar('Qual o nome da foto?', nome || 'Minha foto');
        if (!n) return false;
        const c = renderizar();
        const conteudo = c.toDataURL('image/jpeg', 0.85);
        await CE.sessao.salvarArquivo({ nome: n, tipo: 'imagem', conteudo });
        nome = n; modificado = false; desenhar();
        CE.emitir('fotos:salva', { nome: n, largura: c.width, altura: c.height, kb: Math.round((conteudo.length * 0.75) / 1024), filtro: estado.filtro, textos: estado.textos.length, corte: estado.corte, brilho: estado.brilho });
        CE.avisar(`🌅 Foto "${n}" salva em Meus Documentos (${c.width} × ${c.height}).`);
        return true;
      }

      const fb = (cmd, rotulo, dica, f) => CE.el('button', { class: 'ferramenta texto', 'data-comando': cmd, title: dica, onclick: f }, rotulo);
      corpo.classList.add('fotos-app');
      corpo.append(
        CE.el('div', { class: 'ferramentas' },
          CE.el('div', { class: 'ferramentas-grupo' }, fb('abrir', '📂 Abrir foto', 'Abrir uma foto', abrirFoto), fb('salvar', '💾 Salvar', 'Salvar a foto editada (Ctrl+S)', () => salvar()), fb('desfazer', '↶', 'Desfazer (Ctrl+Z)', desfazer)),
          CE.el('div', { class: 'ferramentas-grupo' }, fb('girar', '⟳ Girar', 'Girar 90°', girar), fb('espelhar', '⇋ Espelhar', 'Espelhar (virar como no espelho)', espelhar), fb('cortar', '✂️ Cortar', 'Cortar no tamanho certo', menuCortar)),
          CE.el('div', { class: 'ferramentas-grupo' }, fb('texto', '🔤 Texto', 'Escrever por cima da foto', dialogoTexto))),
        CE.el('div', { class: 'ft-principal' }, palco, lateral), status);
      corpo.addEventListener('keydown', (e) => {
        if (!(e.ctrlKey || e.metaKey)) return;
        if (e.key.toLowerCase() === 'z') { e.preventDefault(); desfazer(); }
        if (e.key.toLowerCase() === 's') { e.preventDefault(); salvar(); }
      });
      desenhar();
      if (argumento && argumento.arquivo) usar(argumento.arquivo.conteudo, argumento.arquivo.nome, false);
      const api = { estado: () => JSON.parse(JSON.stringify(estado)), aberta: () => !!original, tamanho: () => { if (!original) return null; const c = renderizar(); return { largura: c.width, altura: c.height }; } };
      CE.fotosAtiva = api;
      return {
        receber(arg) { if (arg && arg.arquivo) usar(arg.arquivo.conteudo, arg.arquivo.nome, false); },
        aoFechar() { if (CE.fotosAtiva === api) CE.fotosAtiva = null; return true; },
      };
    },
  });
})();
