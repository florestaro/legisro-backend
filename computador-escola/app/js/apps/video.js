// Editor de Vídeo (curso livre Criação digital): montar um vídeo curto na linha do tempo com clipes de treino e
// fotos, cortar o começo e o fim, dividir, mudar a ordem, título, legenda, transição, música de fundo, assistir e
// exportar. O vídeo exportado fica em Meus Documentos (tipo "vídeo") e abre de novo aqui para assistir ou mudar.
window.CE = window.CE || {};

(function () {
  const CLIPES = {
    abertura: { nome: 'Abertura colorida', emoji: '✨', duracao: 4, cores: ['#6a3fb5', '#3a7bd5'] },
    loja: { nome: 'Fachada da loja', emoji: '🏪', duracao: 5, cores: ['#ffd38a', '#f4a261'] },
    produtos: { nome: 'Produtos na prateleira', emoji: '🎁', duracao: 5, cores: ['#c9f0d3', '#7cc88f'] },
    cliente: { nome: 'Cliente feliz', emoji: '😊', duracao: 5, cores: ['#ffe2c6', '#f4b58a'] },
    cidade: { nome: 'Cidade ao entardecer', emoji: '🌆', duracao: 6, cores: ['#f6a5c0', '#5b2a86'] },
  };
  const TRANSICOES = { corte: 'Corte seco', esmaecer: 'Esmaecer (aparece aos poucos)', deslizar: 'Deslizar' };
  const MUSICAS = { nenhuma: 'Sem música', alegre: '🎵 Alegre', calma: '🎶 Calma' };
  const QUALIDADES = { '480p': ['480p (leve, para celular)', 5], '720p': ['720p HD (o mais usado)', 10], '1080p': ['1080p Full HD (pesado)', 20] };
  const W = 480, H = 270, PX = 46; // tamanho da prévia e pixels por segundo na linha do tempo
  let contador = 0;
  const novoId = () => 'c' + Date.now().toString(36) + (contador++);
  const dur = (it) => Math.max(0.5, Math.round((it.tipo === 'clipe' ? it.fim - it.inicio : it.duracao) * 10) / 10);
  const tempoTexto = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function desenharClipe(x, clipe, t) {
    const c = CLIPES[clipe] || CLIPES.abertura;
    const g = x.createLinearGradient(0, 0, W, H);
    const mov = (Math.sin(t * 0.8) + 1) / 2;
    g.addColorStop(0, c.cores[0]); g.addColorStop(0.5 + mov * 0.3, c.cores[1]); g.addColorStop(1, c.cores[0]);
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,.18)';
    for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(((i * 97 + t * 40) % (W + 60)) - 30, 40 + ((i * 53) % (H - 80)), 10 + (i % 3) * 8, 0, Math.PI * 2); x.fill(); }
    const tamanho = H * (0.42 + 0.04 * Math.sin(t * 2));
    x.font = `${tamanho}px "Segoe UI Emoji", "Noto Color Emoji", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(c.emoji, W * (0.25 + 0.5 * Math.min(1, t / c.duracao)), H * 0.52 + Math.sin(t * 2.2) * H * 0.04);
  }

  CE.registrarApp({
    id: 'video', nome: 'Editor de Vídeo', icone: '🎬', largura: 1040, altura: 660,
    abrir(corpo, janela, argumento) {
      let projeto = { itens: [], musica: 'nenhuma', volume: 60 }, nomeArquivo = null, modificado = false;
      let selecionado = -1, tempo = 0, tocando = false, quadroPedido = null, ultimoQuadro = 0, audio = null;
      const imagens = {};
      const tela = CE.el('canvas', { class: 'vd-tela', width: String(W), height: String(H) });
      const ctx = tela.getContext('2d');
      const rotuloTempo = CE.el('span', { class: 'vd-tempo', 'data-video-tempo': '' });
      const barraTempo = CE.el('input', { type: 'range', class: 'vd-barra', min: '0', max: '0', step: '0.1', value: '0', 'data-campo': 'video-cursor' });
      const botaoPlay = CE.el('button', { class: 'botao', 'data-comando': 'play', onclick: () => (tocando ? pausar() : tocar()) }, '▶ Assistir');
      const midia = CE.el('div', { class: 'vd-midia' });
      const props = CE.el('div', { class: 'vd-props' });
      const linha = CE.el('div', { class: 'vd-linha', 'data-linha-tempo': '' });
      const status = CE.el('div', { class: 'editor-status' });
      const total = () => Math.round(projeto.itens.reduce((s, it) => s + dur(it), 0) * 10) / 10;
      const marcar = () => { modificado = true; };

      // ---------- Quadro do vídeo no tempo t ----------
      function quadro(t) {
        let inicio = 0;
        const i = projeto.itens.findIndex((it) => { const d = dur(it); if (t < inicio + d) return true; inicio += d; return false; });
        ctx.save();
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        if (i < 0) {
          ctx.fillStyle = '#ccc'; ctx.font = '18px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(projeto.itens.length ? 'Fim do vídeo' : 'Adicione clipes da coluna "Mídia"', W / 2, H / 2);
          ctx.restore(); return;
        }
        const it = projeto.itens[i], local = t - inicio;
        if (it.transicao === 'esmaecer' && local < 0.6) ctx.globalAlpha = Math.max(0.05, local / 0.6);
        if (it.transicao === 'deslizar' && local < 0.6) ctx.translate((1 - local / 0.6) * W, 0);
        if (it.tipo === 'clipe') desenharClipe(ctx, it.fonte, it.inicio + local);
        else if (it.tipo === 'imagem') {
          const img = imagens[it.id] || (imagens[it.id] = Object.assign(new Image(), { src: it.src }));
          ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
          if (img.complete && img.naturalWidth) {
            const zoom = 1 + 0.08 * (local / dur(it)); // efeito de aproximar devagar
            const esc = Math.max(W / img.naturalWidth, H / img.naturalHeight) * zoom;
            ctx.drawImage(img, (W - img.naturalWidth * esc) / 2, (H - img.naturalHeight * esc) / 2, img.naturalWidth * esc, img.naturalHeight * esc);
          }
        } else {
          ctx.fillStyle = it.cor || '#1f3a5f'; ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#fff'; ctx.font = 'bold 34px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(it.texto || '', W / 2, H / 2, W - 30);
        }
        ctx.restore();
        if (it.legenda) {
          ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const larg = Math.min(W - 20, ctx.measureText(it.legenda).width + 24);
          ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect((W - larg) / 2, H - 46, larg, 30);
          ctx.fillStyle = '#fff'; ctx.fillText(it.legenda, W / 2, H - 31, W - 30);
        }
      }
      function atualizarTempo() {
        barraTempo.max = String(total()); barraTempo.value = String(Math.min(tempo, total()));
        rotuloTempo.textContent = `${tempoTexto(tempo)} / ${tempoTexto(total())}`;
        quadro(tempo);
      }

      // ---------- Assistir (com música) ----------
      function tocarMusica() {
        pararMusica();
        if (projeto.musica === 'nenhuma' || (CE.config && (CE.config.atual.mudo || !CE.config.atual.volume))) return;
        try {
          const ac = new (window.AudioContext || window.webkitAudioContext)();
          const notas = projeto.musica === 'alegre' ? [523, 659, 784, 659, 587, 698, 880, 698] : [262, 330, 392, 330];
          const passo = projeto.musica === 'alegre' ? 0.25 : 0.7;
          const vol = (projeto.volume / 100) * 0.06;
          for (let k = 0, t0 = ac.currentTime; k * passo < total() - tempo; k++) {
            const o = ac.createOscillator(), g = ac.createGain();
            o.type = projeto.musica === 'alegre' ? 'triangle' : 'sine'; o.frequency.value = notas[k % notas.length];
            g.gain.setValueAtTime(vol, t0 + k * passo); g.gain.exponentialRampToValueAtTime(0.0001, t0 + k * passo + passo * 0.95);
            o.connect(g); g.connect(ac.destination); o.start(t0 + k * passo); o.stop(t0 + k * passo + passo);
          }
          audio = ac;
        } catch { audio = null; }
      }
      function pararMusica() { if (audio) { try { audio.close(); } catch { /* já fechado */ } audio = null; } }
      function tocar() {
        if (!projeto.itens.length) { CE.avisar('Adicione clipes antes de assistir.'); return; }
        if (tempo >= total()) tempo = 0;
        tocando = true; ultimoQuadro = performance.now(); botaoPlay.textContent = '⏸ Pausar';
        tocarMusica();
        CE.emitir('video:play', { total: total(), musica: projeto.musica });
        const passo = (agora) => {
          if (!tocando) return;
          tempo += (agora - ultimoQuadro) / 1000; ultimoQuadro = agora;
          if (tempo >= total()) { tempo = total(); pausar(); atualizarTempo(); CE.emitir('video:fim', { total: total() }); return; }
          atualizarTempo();
          quadroPedido = requestAnimationFrame(passo);
        };
        quadroPedido = requestAnimationFrame(passo);
      }
      function pausar() { tocando = false; cancelAnimationFrame(quadroPedido); pararMusica(); botaoPlay.textContent = '▶ Assistir'; }
      barraTempo.addEventListener('input', () => { pausar(); tempo = Number(barraTempo.value); atualizarTempo(); });

      // ---------- Linha do tempo ----------
      function desenhar() {
        let acumulado = 0;
        linha.replaceChildren(...(projeto.itens.length ? projeto.itens.map((it, i) => {
          const d = dur(it); const inicio = acumulado; acumulado += d;
          const rotulo = it.tipo === 'clipe' ? `${CLIPES[it.fonte].emoji} ${CLIPES[it.fonte].nome}` : it.tipo === 'imagem' ? `🖼️ ${it.nome}` : `🔤 ${it.texto}`;
          return CE.el('button', { class: `vd-item ${it.tipo}` + (i === selecionado ? ' selecionado' : ''), style: `width:${Math.max(60, d * PX)}px`, 'data-item': String(i), 'data-item-tipo': it.tipo, title: `${rotulo} (${d}s)`,
            onclick: () => { selecionado = i; pausar(); tempo = inicio + 0.01; desenhar(); CE.emitir('video:selecionado', { indice: i, tipo: it.tipo }); } },
          CE.el('span', {}, rotulo), CE.el('small', {}, `${d}s${it.legenda ? ' · 💬' : ''}${it.transicao && it.transicao !== 'corte' ? ' · ✨' : ''}`));
        }) : [CE.el('p', { class: 'vd-vazio' }, 'A linha do tempo está vazia. Clique em "＋" num clipe da coluna "Mídia".')]));
        midiaPainel();
        props.replaceChildren(...painel());
        atualizarTempo();
        status.textContent = `${nomeArquivo || 'Vídeo sem nome'}${modificado ? ' (não exportado)' : ''} · ${projeto.itens.length} parte(s) · ${tempoTexto(total())} · ${MUSICAS[projeto.musica]}`;
        janela.definirTitulo(nomeArquivo || 'Vídeo sem nome');
      }
      async function midiaPainel() {
        const fotos = CE.sessao.usuario ? (await CE.sessao.arquivos().catch(() => [])).filter((a) => a.tipo === 'imagem' && !a.naLixeira) : [];
        midia.replaceChildren(CE.el('h4', {}, '🎞️ Clipes de treino'),
          ...Object.entries(CLIPES).map(([k, c]) => CE.el('div', { class: 'vd-midia-item' }, CE.el('span', {}, `${c.emoji} ${c.nome} (${c.duracao}s)`),
            CE.el('button', { class: 'botao pequeno', 'data-midia': k, title: 'Pôr no fim da linha do tempo', onclick: () => adicionar({ tipo: 'clipe', fonte: k, inicio: 0, fim: c.duracao }) }, '＋'))),
          CE.el('h4', {}, '🖼️ Minhas fotos'),
          ...(fotos.length ? fotos.slice(0, 12).map((a) => CE.el('div', { class: 'vd-midia-item' }, CE.el('span', {}, `🖼️ ${a.nome}`),
            CE.el('button', { class: 'botao pequeno', 'data-midia-imagem': a.nome, onclick: () => adicionar({ tipo: 'imagem', nome: a.nome, src: a.conteudo, duracao: 3 }) }, '＋'))) : [CE.el('small', {}, 'Nenhuma foto ainda (tire no Celular ou faça no Editor de Fotos).')]),
          CE.el('h4', {}, '🔤 Título'),
          CE.el('button', { class: 'botao secundario', 'data-acao': 'adicionar-titulo', onclick: async () => {
            const texto = await CE.perguntar('Texto do título (ex.: Loja Bom Preço apresenta):', '');
            if (!texto) return;
            adicionar({ tipo: 'titulo', texto, cor: '#1f3a5f', duracao: 3 }, { inicio: true });
            CE.emitir('video:titulo', { texto });
          } }, '＋ Título no começo'),
          CE.el('h4', {}, '🎵 Música de fundo'),
          CE.el('select', { class: 'campo', 'data-comando': 'musica', onchange: (e) => { projeto.musica = e.target.value; marcar(); desenhar(); CE.emitir('video:musica', { faixa: projeto.musica }); } },
            ...Object.entries(MUSICAS).map(([k, n]) => CE.el('option', { value: k, selected: projeto.musica === k }, n))));
      }
      function adicionar(item, { inicio = false } = {}) {
        pausar();
        const it = { id: novoId(), legenda: '', transicao: 'corte', ...item };
        if (inicio) projeto.itens.unshift(it); else projeto.itens.push(it);
        selecionado = inicio ? 0 : projeto.itens.length - 1;
        marcar(); desenhar();
        CE.emitir('video:adicionado', { tipo: it.tipo, fonte: it.fonte || it.nome || it.texto, total: total(), itens: projeto.itens.length });
      }
      function painel() {
        const it = projeto.itens[selecionado];
        if (!it) return [CE.el('h4', {}, 'Propriedades'), CE.el('p', { class: 'ft-dica' }, 'Clique numa parte da linha do tempo (embaixo) para cortar, mover, pôr legenda ou transição.')];
        const campoNum = (rotulo, valor, attr, min, max, aoMudar) => CE.el('label', { class: 'ft-ajuste' }, rotulo, CE.el('input', { type: 'number', class: 'campo pequeno', step: '0.5', min: String(min), max: String(max), value: String(valor), [attr]: '', onchange: (e) => aoMudar(Number(e.target.value)) }));
        const partes = [CE.el('h4', {}, `Parte ${selecionado + 1}: ${it.tipo === 'clipe' ? CLIPES[it.fonte].nome : it.tipo === 'imagem' ? it.nome : 'Título'}`)];
        if (it.tipo === 'clipe') {
          const natural = CLIPES[it.fonte].duracao;
          partes.push(CE.el('p', { class: 'ft-dica' }, `O clipe original tem ${natural} segundos. Para CORTAR, mude onde ele começa e onde termina.`),
            campoNum('Começa no segundo', it.inicio, 'data-video-inicio', 0, natural - 0.5, (v) => { it.inicio = Math.min(Math.max(0, v), it.fim - 0.5); marcar(); desenhar(); CE.emitir('video:cortado', { indice: selecionado, inicio: it.inicio, fim: it.fim, duracao: dur(it) }); }),
            campoNum('Termina no segundo', it.fim, 'data-video-fim', 0.5, natural, (v) => { it.fim = Math.max(Math.min(natural, v), it.inicio + 0.5); marcar(); desenhar(); CE.emitir('video:cortado', { indice: selecionado, inicio: it.inicio, fim: it.fim, duracao: dur(it) }); }));
        } else {
          partes.push(campoNum('Duração (segundos)', it.duracao, 'data-video-duracao', 1, 15, (v) => { it.duracao = Math.min(15, Math.max(1, v)); marcar(); desenhar(); CE.emitir('video:duracao', { indice: selecionado, duracao: it.duracao }); }));
          if (it.tipo === 'titulo') partes.push(CE.el('label', { class: 'ft-ajuste' }, 'Texto do título', CE.el('input', { class: 'campo', value: it.texto, 'data-video-texto': '', onchange: (e) => { it.texto = e.target.value; marcar(); desenhar(); CE.emitir('video:titulo', { texto: it.texto }); } })),
            CE.el('label', { class: 'ft-ajuste' }, 'Cor do fundo', CE.el('input', { type: 'color', value: it.cor, onchange: (e) => { it.cor = e.target.value; marcar(); desenhar(); } })));
        }
        partes.push(CE.el('label', { class: 'ft-ajuste' }, '💬 Legenda (texto embaixo)', CE.el('input', { class: 'campo', value: it.legenda, placeholder: 'Ex.: Visite a nossa loja!', 'data-video-legenda': '',
          onchange: (e) => { it.legenda = e.target.value.trim(); marcar(); desenhar(); CE.emitir('video:legenda', { indice: selecionado, texto: it.legenda }); } })),
        CE.el('label', { class: 'ft-ajuste' }, '✨ Transição (como esta parte começa)', CE.el('select', { class: 'campo', 'data-video-transicao': '',
          onchange: (e) => { it.transicao = e.target.value; marcar(); desenhar(); CE.emitir('video:transicao', { indice: selecionado, transicao: it.transicao }); } }, ...Object.entries(TRANSICOES).map(([k, n]) => CE.el('option', { value: k, selected: it.transicao === k }, n)))));
        const acao = (cmd, rotulo, dica, fn) => CE.el('button', { class: 'botao secundario pequeno', 'data-vd-acao': cmd, title: dica, onclick: fn }, rotulo);
        partes.push(CE.el('div', { class: 'vt-acoes' },
          acao('esquerda', '◀ Antes', 'Mover para antes', () => mover(-1)), acao('direita', 'Depois ▶', 'Mover para depois', () => mover(1)),
          acao('dividir', '✂️ Dividir', 'Dividir em duas partes no ponto onde está o cursor de tempo', dividir), acao('apagar', '🗑️ Apagar', 'Tirar do vídeo', apagar)));
        return partes;
      }
      function mover(d) {
        const i = selecionado, j = i + d;
        if (i < 0 || j < 0 || j >= projeto.itens.length) return;
        const [it] = projeto.itens.splice(i, 1); projeto.itens.splice(j, 0, it); selecionado = j;
        marcar(); desenhar(); CE.emitir('video:movido', { de: i, para: j, tipo: it.tipo, fonte: it.fonte || it.nome });
      }
      function apagar() {
        if (selecionado < 0) return;
        projeto.itens.splice(selecionado, 1); selecionado = -1; tempo = Math.min(tempo, total());
        marcar(); desenhar(); CE.emitir('video:apagado', { itens: projeto.itens.length, total: total() });
      }
      // Divide a parte selecionada no ponto do cursor de tempo.
      function dividir() {
        const it = projeto.itens[selecionado];
        if (!it || it.tipo === 'titulo') { CE.avisar('Selecione um clipe ou uma foto para dividir.'); return; }
        const inicio = projeto.itens.slice(0, selecionado).reduce((s, x) => s + dur(x), 0);
        const local = Math.round((tempo - inicio) * 10) / 10;
        if (local < 0.5 || local > dur(it) - 0.5) { CE.avisar('Coloque o cursor de tempo (a barrinha embaixo do vídeo) no meio desta parte, onde quer cortar.'); return; }
        const segunda = { ...JSON.parse(JSON.stringify(it)), id: novoId() };
        if (it.tipo === 'clipe') { segunda.inicio = it.inicio + local; it.fim = it.inicio + local; } else { segunda.duracao = Math.round((it.duracao - local) * 10) / 10; it.duracao = local; }
        projeto.itens.splice(selecionado + 1, 0, segunda);
        marcar(); desenhar(); CE.emitir('video:dividido', { indice: selecionado, itens: projeto.itens.length });
      }

      // ---------- Arquivo ----------
      function exportar() {
        if (!projeto.itens.length) { CE.avisar('O vídeo está vazio.'); return; }
        pausar();
        const nome = CE.el('input', { class: 'campo', 'data-campo': 'nome-video', value: nomeArquivo || 'Meu vídeo' });
        const qualidade = CE.el('select', { class: 'campo', 'data-campo': 'qualidade-video' }, ...Object.entries(QUALIDADES).map(([k, [n]]) => CE.el('option', { value: k, selected: k === '720p' }, n)));
        const tamanho = CE.el('p', { class: 'ft-dica', 'data-video-mb': '' });
        const calcular = () => { const mb = Math.max(0.5, Math.round((QUALIDADES[qualidade.value][1] * total()) / 60 * 10) / 10); tamanho.textContent = `Tamanho aproximado do arquivo: ${String(mb).replace('.', ',')} MB (${tempoTexto(total())} de vídeo).`; tamanho.dataset.videoMb = String(mb); return mb; };
        qualidade.addEventListener('change', calcular);
        const barra = CE.el('div', { class: 'cfg-progresso', hidden: true }, CE.el('div', { style: 'width:0%' }));
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo' },
          CE.el('p', {}, '💾 Exportar o vídeo'), CE.el('label', {}, 'Nome', nome), CE.el('label', {}, 'Qualidade', qualidade), tamanho, barra,
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'),
            CE.el('button', { class: 'botao', 'data-acao': 'confirmar-exportar', onclick: async (e) => {
              const n = nome.value.trim();
              if (!n) { CE.avisar('Escreva o nome do vídeo.'); return; }
              e.currentTarget.disabled = true; barra.hidden = false;
              for (let p = 25; p <= 100; p += 25) { barra.firstChild.style.width = p + '%'; await new Promise((r) => setTimeout(r, 220)); }
              const mb = calcular();
              await CE.sessao.salvarArquivo({ nome: n, tipo: 'video', conteudo: JSON.stringify({ ...projeto, qualidade: qualidade.value, exportadoEm: Date.now() }) });
              nomeArquivo = n; modificado = false; fundo.remove(); desenhar();
              CE.emitir('video:exportado', { nome: n, duracao: total(), itens: projeto.itens.length, qualidade: qualidade.value, mb, musica: projeto.musica, legendas: projeto.itens.filter((x) => x.legenda).length, titulos: projeto.itens.filter((x) => x.tipo === 'titulo').length });
              CE.avisar(`🎬 Vídeo "${n}" exportado em ${qualidade.value} (${String(mb).replace('.', ',')} MB). Está em Meus Documentos.`);
            } }, 'Exportar'))));
        document.body.append(fundo);
        calcular();
      }
      function carregar(arquivo) {
        try { projeto = JSON.parse(arquivo.conteudo || '{}'); } catch { projeto = {}; }
        projeto = { musica: 'nenhuma', volume: 60, ...projeto, itens: Array.isArray(projeto.itens) ? projeto.itens : [] };
        nomeArquivo = arquivo.nome; modificado = false; selecionado = -1; tempo = 0;
        desenhar();
        CE.emitir('arquivo:aberto', { nome: arquivo.nome, tipo: 'video' });
      }
      async function abrirVideo() {
        const vale = CE.sessao.marca();
        const meus = (await CE.sessao.arquivos()).filter((a) => a.tipo === 'video' && !a.naLixeira);
        if (!vale()) return;
        if (!meus.length) { CE.avisar('Você ainda não exportou nenhum vídeo.'); return; }
        const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo' }, CE.el('p', {}, '📂 Abrir vídeo:'),
          CE.el('div', { class: 'pl-opcoes-coluna' }, ...meus.map((a) => CE.el('button', { class: 'botao secundario', 'data-abrir-video': a.nome, onclick: () => { fundo.remove(); carregar(a); } }, `🎬 ${a.nome}`))),
          CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao secundario', onclick: () => fundo.remove() }, 'Cancelar'))));
        document.body.append(fundo);
      }
      async function novo() {
        if (modificado && projeto.itens.length && !await CE.confirmar('Começar um vídeo novo? O que não foi exportado vai ser perdido.')) return;
        pausar(); projeto = { itens: [], musica: 'nenhuma', volume: 60 }; nomeArquivo = null; modificado = false; selecionado = -1; tempo = 0;
        desenhar(); CE.emitir('video:novo');
      }
      const fb = (cmd, rotulo, dica, f) => CE.el('button', { class: 'ferramenta texto', 'data-comando': cmd, title: dica, onclick: f }, rotulo);
      corpo.classList.add('video-app');
      corpo.append(
        CE.el('div', { class: 'ferramentas' },
          CE.el('div', { class: 'ferramentas-grupo' }, fb('novo', '📄 Novo', 'Começar um vídeo novo', novo), fb('abrir', '📂 Abrir', 'Abrir um vídeo exportado', abrirVideo), fb('exportar', '💾 Exportar vídeo', 'Salvar o vídeo pronto', exportar))),
        CE.el('div', { class: 'vd-principal' }, midia,
          CE.el('div', { class: 'vd-centro' }, tela, CE.el('div', { class: 'vd-controles' }, botaoPlay, CE.el('button', { class: 'botao secundario', 'data-comando': 'inicio', title: 'Voltar ao começo', onclick: () => { pausar(); tempo = 0; atualizarTempo(); } }, '⏮'), barraTempo, rotuloTempo)),
          props),
        CE.el('div', { class: 'vd-linha-caixa' }, CE.el('small', {}, '🎞️ Linha do tempo (o vídeo passa da esquerda para a direita)'), linha),
        status);
      if (argumento && argumento.arquivo) carregar(argumento.arquivo); else desenhar();
      const api = {
        itens: () => projeto.itens.map((it) => ({ ...it, src: undefined, duracao: dur(it) })), total, musica: () => projeto.musica, tempo: () => tempo,
        irPara: (t) => { pausar(); tempo = Math.max(0, Math.min(total(), t)); atualizarTempo(); },
      };
      CE.videoAtivo = api;
      return {
        receber(arg) { if (arg && arg.arquivo) carregar(arg.arquivo); },
        aoFechar() { pausar(); if (CE.videoAtivo === api) CE.videoAtivo = null; return true; },
      };
    },
  });
})();
