// Jogos do Mouse: um jogo para cada habilidade (clique, clique duplo, arrastar, botão direito, rodinha, mira e mover),
// cada um com três níveis: Fácil, Médio e Difícil. O nível seguinte libera quando o aluno vence o anterior.
// Eventos: "jogo:iniciado" { jogo, nivel }, "jogo:concluido" { jogo, nivel, segundos } e "jogo:perdido" { jogo, nivel, motivo }.
(function () {
  const JOGOS = [
    { id: 'baloes', icone: '🎈', nome: 'Estoure os balões', habilidade: 'Clique', descricao: 'Clique uma vez em cada balão para estourar.' },
    { id: 'presentes', icone: '🎁', nome: 'Abra os presentes', habilidade: 'Clique duplo', descricao: 'Dê um clique duplo (dois cliques rápidos) em cada presente.' },
    { id: 'feira', icone: '🧺', nome: 'Feira da fruta', habilidade: 'Arrastar', descricao: 'Segure o botão do mouse em cima da fruta e arraste até a cesta.' },
    { id: 'caixas', icone: '📦', nome: 'Caixas secretas', habilidade: 'Botão direito', descricao: 'Clique com o botão DIREITO em cada caixa para ver o que tem dentro.' },
    { id: 'tesouro', icone: '🏴‍☠️', nome: 'Caça ao tesouro', habilidade: 'Rodinha', descricao: 'Gire a rodinha do mouse para descer até o fundo do mar e achar o tesouro.' },
    { id: 'pontaria', icone: '🎯', nome: 'Pontaria', habilidade: 'Mira', descricao: 'Clique bem no meio dos alvos que aparecem na tela.' },
    { id: 'labirinto', icone: '🐭', nome: 'Labirinto do ratinho', habilidade: 'Mover com cuidado', descricao: 'Clique no ratinho e leve o mouse pelo caminho até o queijo, sem encostar na parede.' },
  ];

  const NIVEIS = [
    { id: 'facil', nome: 'Fácil', cor: '🟢' },
    { id: 'medio', nome: 'Médio', cor: '🟡' },
    { id: 'dificil', nome: 'Difícil', cor: '🔴' },
  ];

  // O que muda em cada nível. "tempo" é o limite em segundos (sem limite quando não tem).
  const REGRAS = {
    baloes: {
      facil: { meta: 10, tamanho: 70, duracao: [7, 11], intervalo: 1100, bombas: 0 },
      medio: { meta: 15, tamanho: 56, duracao: [5, 7.5], intervalo: 900, bombas: 0.2, texto: 'Cuidado: NÃO estoure as bombas 💣!' },
      dificil: { meta: 20, tamanho: 44, duracao: [3.5, 5.5], intervalo: 650, bombas: 0.25, balancar: true, tempo: 60, texto: 'Balões rápidos e com bombas 💣. Você tem 60 segundos!' },
    },
    presentes: {
      facil: { quantos: 8, tamanho: 120 },
      medio: { quantos: 12, tamanho: 90 },
      dificil: { quantos: 16, tamanho: 72, flutuar: true, tempo: 60, texto: 'Os presentes se mexem! Você tem 60 segundos.' },
    },
    feira: {
      facil: { grupos: ['frutas'], porGrupo: 6 },
      medio: { grupos: ['frutas', 'legumes'], porGrupo: 4, texto: 'Cada coisa na cesta certa: frutas numa, legumes na outra.' },
      dificil: { grupos: ['frutas', 'legumes', 'bebidas'], porGrupo: 4, cestaPequena: true, tempo: 90, texto: 'Três cestas e 90 segundos: frutas, legumes e bebidas!' },
    },
    caixas: {
      facil: { quantos: 5 },
      medio: { quantos: 8, menu: true, texto: 'O botão direito abre um MENU. Escolha "Abrir" no menu.' },
      dificil: { quantos: 12, menu: true, lixo: true, tempo: 90, texto: 'Caixas com 🎁 você ABRE. Caixas com 🗑️ você EXCLUI. Use o menu do botão direito. 90 segundos!' },
    },
    tesouro: {
      facil: { altura: 2600, perolas: 0 },
      medio: { altura: 4000, perolas: 5, texto: 'Pegue as 5 pérolas 🦪 no caminho (clique nelas) antes de abrir o baú.' },
      dificil: { altura: 6000, perolas: 8, voltar: true, tempo: 120, texto: 'Pegue as 8 pérolas, abra o baú e VOLTE para o barco ⛵ lá em cima. 2 minutos!' },
    },
    pontaria: {
      facil: { alvos: 10, tamanho: 90, some: 0, minimo: 10 },
      medio: { alvos: 15, tamanho: 60, some: 2.5, minimo: 12, texto: 'Os alvos somem em 2 segundos e meio. Acerte pelo menos 12 de 15.' },
      dificil: { alvos: 20, tamanho: 38, some: 1.6, minimo: 16, texto: 'Alvos pequenos e rápidos! Acerte pelo menos 16 de 20.' },
    },
    labirinto: {
      facil: { largura: 90, pontos: [[60, 80], [400, 80], [400, 330], [720, 330]] },
      medio: { largura: 60, pontos: [[50, 60], [300, 60], [300, 200], [120, 200], [120, 360], [500, 360], [500, 120], [730, 120], [730, 360]] },
      dificil: { largura: 40, tempo: 60, texto: 'Caminho estreito e 60 segundos!',
        pontos: [[40, 40], [740, 40], [740, 130], [40, 130], [40, 220], [740, 220], [740, 310], [40, 310], [40, 390], [400, 390]] },
    },
  };

  const FEIRA = {
    frutas: { nome: 'Frutas', cesta: '🧺', itens: ['🍎', '🍌', '🍇', '🍊', '🍉', '🍍'] },
    legumes: { nome: 'Legumes', cesta: '🥕', itens: ['🥕', '🥦', '🍅', '🥔', '🌽', '🧅'] },
    bebidas: { nome: 'Bebidas', cesta: '🥤', itens: ['🥛', '🧃', '☕', '🥤', '🧉', '🍵'] },
  };

  CE.JOGOS_MOUSE = JOGOS;
  CE.NIVEIS_JOGOS_MOUSE = NIVEIS;

  // Recordes: { baloes: { facil: 12, medio: 30 } }. Versões antigas guardavam só um número (o Fácil).
  const recordes = (p, jogo) => {
    const r = (p.jogosMouse || {})[jogo];
    return typeof r === 'number' ? { facil: r } : (r || {});
  };
  CE.jogosMouse = {
    recordes,
    venceuTodos: (p, nivel) => JOGOS.every((j) => recordes(p, j.id)[nivel] != null),
  };

  const ehInstrutor = () => CE.sessao.usuario && CE.sessao.usuario.papel === 'instrutor';
  const sortear = (min, max) => min + Math.random() * (max - min);
  const embaralhar = (lista) => lista.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

  CE.registrarApp({
    id: 'jogos-mouse',
    nome: 'Jogos do Mouse',
    icone: '🕹️',
    largura: 900,
    altura: 620,
    abrir(corpo, _janela, argumento) {
      corpo.classList.add('jogos-mouse');
      // Tudo o que um jogo liga (relógios, animações) é desligado quando troca de tela.
      let limpezas = [];
      let atual = null; // a partida que está na tela
      const aoTrocar = (f) => limpezas.push(f);
      const desligarTudo = () => { limpezas.forEach((f) => f()); limpezas = []; };

      function trocar(...conteudo) {
        desligarTudo();
        // A partida que saiu da tela não pode mais terminar sozinha (nem contar vitória).
        if (atual) { atual.acabou = true; atual = null; }
        corpo.replaceChildren(...conteudo);
      }

      async function menu() {
        const p = await CE.sessao.progresso();
        trocar(CE.el('div', { class: 'jm-menu' },
          CE.el('h2', {}, '🕹️ Jogos do Mouse'),
          CE.el('p', {}, 'Escolha um jogo. Cada jogo tem 3 níveis: vença o Fácil para liberar o Médio, e o Médio para liberar o Difícil.'),
          CE.el('div', { class: 'jm-lista' }, ...JOGOS.map((j) => {
            const r = recordes(p, j.id);
            return CE.el('div', { class: 'jm-cartao-caixa' },
              CE.el('button', { class: 'jm-cartao', 'data-jogo': j.id, onclick: () => jogar(j.id, 'facil') },
                CE.el('span', { class: 'jm-icone' }, j.icone),
                CE.el('strong', {}, j.nome),
                CE.el('span', { class: 'jm-habilidade' }, j.habilidade),
                CE.el('span', {}, j.descricao)),
              CE.el('div', { class: 'jm-niveis' }, ...NIVEIS.map((n, i) => {
                const liberado = i === 0 || ehInstrutor() || r[NIVEIS[i - 1].id] != null;
                return CE.el('button', {
                  class: `jm-nivel ${r[n.id] != null ? 'vencido' : ''}`, 'data-jogo-nivel': `${j.id}:${n.id}`, disabled: !liberado,
                  title: liberado ? `Jogar no nível ${n.nome}` : `Vença o nível ${NIVEIS[i - 1].nome} para liberar`,
                  onclick: () => jogar(j.id, n.id),
                }, `${liberado ? n.cor : '🔒'} ${n.nome}`, r[n.id] != null ? CE.el('small', {}, `✅ ${r[n.id]}s`) : null);
              })));
          })),
        ));
      }

      // Cada partida tem um "placar" de tempo e só termina uma vez (vitória OU derrota).
      function partida(jogo, nivel) {
        const j = JOGOS.find((x) => x.id === jogo);
        const regra = REGRAS[jogo][nivel];
        const n = NIVEIS.find((x) => x.id === nivel);
        const placar = CE.el('span', { class: 'jm-placar' });
        const relogio = CE.el('span', { class: 'jm-relogio' });
        const palco = CE.el('div', { class: `jm-palco ${jogo}` });
        const quadro = CE.el('div', { class: 'jm-jogo', 'data-nivel': nivel },
          CE.el('div', { class: 'jm-cabecalho' },
            CE.el('button', { class: 'botao secundario', onclick: menu }, '← Jogos'),
            CE.el('strong', {}, `${j.icone} ${j.nome}`),
            CE.el('span', { class: `jm-selo ${nivel}` }, `${n.cor} ${n.nome}`),
            relogio,
            placar),
          CE.el('p', { class: 'jm-instrucao' }, j.descricao + (regra.texto ? ' ' + regra.texto : '')),
          palco);
        const ctx = {
          regra, palco, placar, inicio: Date.now(), acabou: false,
          mostrar: (texto) => { placar.textContent = texto; },
          async vencer() {
            if (ctx.acabou) return;
            ctx.acabou = true;
            desligarTudo();
            const segundos = Math.round((Date.now() - ctx.inicio) / 1000);
            await CE.sessao.atualizarProgresso((p) => {
              const r = recordes(p, jogo);
              r[nivel] = Math.min(r[nivel] != null ? r[nivel] : Infinity, segundos);
              p.jogosMouse = p.jogosMouse || {};
              p.jogosMouse[jogo] = r;
            });
            CE.comemorar(nivel === 'dificil' ? 'grande' : 'pequena');
            CE.emitir('jogo:concluido', { jogo, nivel, segundos, ...(ctx.extra || {}) });
            const proximo = NIVEIS[NIVEIS.findIndex((x) => x.id === nivel) + 1];
            quadro.append(CE.el('div', { class: 'jm-vitoria' },
              CE.el('h2', {}, nivel === 'dificil' ? 'Campeão! 🏆' : 'Parabéns! 🎉'),
              CE.el('p', {}, `Você venceu o nível ${n.nome} em ${segundos} segundos.`),
              ctx.resumo ? CE.el('p', { class: 'jm-resumo' }, ctx.resumo) : null,
              proximo ? CE.el('p', {}, `O nível ${proximo.nome} foi liberado!`) : null,
              CE.el('div', { class: 'dialogo-botoes' },
                CE.el('button', { class: 'botao secundario', onclick: menu }, 'Outros jogos'),
                CE.el('button', { class: 'botao secundario', onclick: () => jogar(jogo, nivel) }, 'Jogar de novo'),
                proximo ? CE.el('button', { class: 'botao', 'data-acao': 'proximo-nivel', onclick: () => jogar(jogo, proximo.id) }, `Nível ${proximo.nome} ▶`) : null)));
          },
          perder(motivo) {
            if (ctx.acabou) return;
            ctx.acabou = true;
            desligarTudo();
            CE.emitir('jogo:perdido', { jogo, nivel, motivo, ...(ctx.extra || {}) });
            quadro.append(CE.el('div', { class: 'jm-vitoria jm-derrota' },
              CE.el('h2', {}, 'Quase! 😅'),
              CE.el('p', {}, motivo),
              ctx.resumo ? CE.el('p', { class: 'jm-resumo' }, ctx.resumo) : null,
              CE.el('p', {}, 'Treinar faz o mouse ficar cada vez mais fácil. Tente de novo!'),
              CE.el('div', { class: 'dialogo-botoes' },
                CE.el('button', { class: 'botao secundario', onclick: menu }, 'Outros jogos'),
                CE.el('button', { class: 'botao', 'data-acao': 'tentar-de-novo', onclick: () => jogar(jogo, nivel) }, 'Tentar de novo'))));
          },
          aviso(texto) {
            const a = CE.el('div', { class: 'jm-aviso' }, texto);
            quadro.append(a);
            setTimeout(() => a.remove(), 1500);
          },
          // Chama depois do trocar(): os relógios precisam ser desligados na próxima troca de tela.
          repetir(f, ms) { const t = setInterval(f, ms); aoTrocar(() => clearInterval(t)); return t; },
          depois(f, ms) { const t = setTimeout(() => { if (!ctx.acabou) f(); }, ms); aoTrocar(() => clearTimeout(t)); return t; },
          comecarRelogio() {
            if (!regra.tempo) return;
            const fim = Date.now() + regra.tempo * 1000;
            const tic = () => {
              const resta = Math.max(0, Math.ceil((fim - Date.now()) / 1000));
              relogio.textContent = `⏱️ ${resta}s`;
              relogio.classList.toggle('acabando', resta <= 10);
              if (resta <= 0) ctx.perder('O tempo acabou!');
            };
            tic();
            ctx.repetir(tic, 250);
          },
        };
        trocar(quadro);
        atual = ctx;
        ctx.comecarRelogio();
        return ctx;
      }

      // ---------- Balões: clique ----------
      function baloes(ctx) {
        const { regra, palco } = ctx;
        let estourados = 0;
        ctx.mostrar(`0 de ${regra.meta}`);
        palco.classList.add('ceu');
        const cores = ['#e81123', '#ffb900', '#107c10', '#0067c0', '#8e44ad', '#ff8c00'];
        function soltar() {
          const bomba = Math.random() < regra.bombas;
          const b = CE.el('button', { class: `jm-balao ${bomba ? 'bomba' : ''} ${regra.balancar ? 'balancar' : ''}`, 'aria-label': bomba ? 'Bomba' : 'Balão' }, bomba ? '💣' : '');
          b.style.left = 5 + Math.random() * 85 + '%';
          b.style.width = regra.tamanho + 'px';
          b.style.height = Math.round(regra.tamanho * 1.23) + 'px';
          if (!bomba) b.style.setProperty('--cor', cores[Math.floor(Math.random() * cores.length)]);
          const subida = sortear(...regra.duracao) + 's';
          b.style.animationDuration = regra.balancar ? `${subida}, 1.2s` : subida;
          b.addEventListener('click', () => {
            if (b.classList.contains('estourou') || ctx.acabou) return;
            b.classList.add('estourou');
            setTimeout(() => b.remove(), 300);
            if (bomba) {
              estourados = Math.max(0, estourados - 2);
              ctx.aviso('💥 Era uma bomba! Perdeu 2 pontos.');
            } else estourados++;
            ctx.mostrar(`${estourados} de ${regra.meta}`);
            if (estourados >= regra.meta) { palco.querySelectorAll('.jm-balao').forEach((x) => x.remove()); ctx.vencer(); }
          });
          b.addEventListener('animationend', (e) => { if (e.animationName === 'subir') b.remove(); });
          palco.append(b);
        }
        soltar();
        ctx.repetir(soltar, regra.intervalo);
      }

      // ---------- Presentes: clique duplo ----------
      function presentes(ctx) {
        const { regra, palco } = ctx;
        const PREMIOS = ['🧸', '⚽', '📚', '🎨', '🍫', '🚲', '🎧', '🌻', '🪁', '🎹', '🧩', '🏀', '🎮', '🦖', '🍰', '🛼'];
        let abertos = 0;
        ctx.mostrar(`0 de ${regra.quantos}`);
        PREMIOS.slice(0, regra.quantos).forEach((premio, i) => {
          const caixa = CE.el('button', { class: `jm-presente ${regra.flutuar ? 'flutuar' : ''}`, 'aria-label': 'Presente' }, '🎁');
          caixa.style.width = caixa.style.height = regra.tamanho + 'px';
          caixa.style.fontSize = Math.round(regra.tamanho * 0.53) + 'px';
          if (regra.flutuar) caixa.style.animationDelay = `-${(i * 0.37) % 3}s`;
          caixa.addEventListener('click', () => {
            if (caixa.classList.contains('aberto')) return;
            caixa.classList.remove('tremer'); void caixa.offsetWidth; caixa.classList.add('tremer');
          });
          caixa.addEventListener('dblclick', () => {
            if (caixa.classList.contains('aberto') || ctx.acabou) return;
            caixa.classList.add('aberto');
            caixa.textContent = premio;
            abertos++;
            ctx.mostrar(`${abertos} de ${regra.quantos}`);
            if (abertos >= regra.quantos) ctx.vencer();
          });
          palco.append(caixa);
        });
      }

      // ---------- Feira: arrastar (e separar nas cestas certas) ----------
      function feira(ctx) {
        const { regra, palco } = ctx;
        const itens = embaralhar(regra.grupos.flatMap((g) => FEIRA[g].itens.slice(0, regra.porGrupo).map((emoji) => ({ emoji, grupo: g }))));
        let guardadas = 0;
        ctx.mostrar(`0 de ${itens.length}`);
        const cestas = regra.grupos.map((g, i) => {
          const c = CE.el('div', { class: `jm-cesta ${regra.cestaPequena ? 'pequena' : ''}`, 'data-cesta': g },
            FEIRA[g].cesta, CE.el('small', {}, regra.grupos.length > 1 ? FEIRA[g].nome : 'Solte aqui'));
          if (regra.grupos.length > 1) { c.style.top = `${(100 / regra.grupos.length) * (i + 0.5)}%`; }
          palco.append(c);
          return c;
        });
        const colunas = itens.length > 8 ? 4 : 3;
        itens.forEach((item, i) => {
          const fruta = CE.el('div', { class: 'jm-fruta', 'data-grupo': item.grupo }, item.emoji);
          const inicial = { left: 3 + (i % colunas) * 12 + '%', top: 6 + Math.floor(i / colunas) * (88 / Math.ceil(itens.length / colunas)) + '%' };
          Object.assign(fruta.style, inicial);
          fruta.addEventListener('pointerdown', (e) => {
            if (ctx.acabou) return;
            e.preventDefault();
            fruta.setPointerCapture(e.pointerId);
            fruta.classList.add('segurando');
            const caixa = palco.getBoundingClientRect();
            const mover = (ev) => {
              fruta.style.left = ev.clientX - caixa.left - 32 + 'px';
              fruta.style.top = ev.clientY - caixa.top - 32 + 'px';
            };
            const soltar = (ev) => {
              fruta.removeEventListener('pointermove', mover);
              fruta.removeEventListener('pointerup', soltar);
              fruta.classList.remove('segurando');
              const cesta = cestas.find((c) => { const r = c.getBoundingClientRect(); return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom; });
              if (!cesta) return;
              if (cesta.dataset.cesta !== item.grupo) {
                ctx.aviso(`Ops! ${item.emoji} vai na cesta de ${FEIRA[item.grupo].nome}.`);
                Object.assign(fruta.style, inicial);
                return;
              }
              fruta.remove();
              guardadas++;
              ctx.mostrar(`${guardadas} de ${itens.length}`);
              cesta.classList.remove('pulou'); void cesta.offsetWidth; cesta.classList.add('pulou');
              if (guardadas >= itens.length) ctx.vencer();
            };
            fruta.addEventListener('pointermove', mover);
            fruta.addEventListener('pointerup', soltar);
          });
          palco.append(fruta);
        });
      }

      // ---------- Caixas: botão direito (e o menu do botão direito) ----------
      function caixas(ctx) {
        const { regra, palco } = ctx;
        const SURPRESAS = ['⭐', '💎', '🍀', '🎉', '🦋', '🌈', '🍭', '🐞', '🎵', '🌟', '🐣', '🍓'];
        const total = regra.quantos;
        let feitas = 0;
        let menuAberto = null;
        ctx.mostrar(`0 de ${total}`);
        const fecharMenu = () => { if (menuAberto) { menuAberto.remove(); menuAberto = null; } };
        palco.addEventListener('pointerdown', (e) => { if (menuAberto && !menuAberto.contains(e.target)) fecharMenu(); });
        // Nas caixas de lixo (Difícil), a resposta certa é "Excluir"; nas outras, "Abrir".
        const lixo = new Set(regra.lixo ? embaralhar([...Array(total).keys()]).slice(0, Math.floor(total / 3)) : []);
        const concluir = (caixa, conteudo) => {
          caixa.classList.add('aberta');
          caixa.textContent = conteudo;
          feitas++;
          ctx.mostrar(`${feitas} de ${total}`);
          if (feitas >= total) ctx.vencer();
        };
        SURPRESAS.slice(0, total).forEach((s, i) => {
          const ehLixo = lixo.has(i);
          const caixa = CE.el('button', { class: `jm-caixa ${regra.quantos > 8 ? 'pequena' : ''}`, 'aria-label': ehLixo ? 'Caixa de lixo' : 'Caixa secreta', 'data-tipo': ehLixo ? 'lixo' : 'presente' },
            '📦', regra.lixo ? CE.el('span', { class: 'jm-etiqueta' }, ehLixo ? '🗑️' : '🎁') : null);
          caixa.addEventListener('click', () => { if (!caixa.classList.contains('aberta') && !ctx.acabou) ctx.aviso('Esse foi o botão ESQUERDO. Use o botão DIREITO do mouse!'); });
          caixa.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (caixa.classList.contains('aberta') || ctx.acabou) return;
            if (!regra.menu) { concluir(caixa, s); return; }
            fecharMenu();
            const caixaPalco = palco.getBoundingClientRect();
            const opcoes = [['abrir', '📂 Abrir'], ['renomear', '✏️ Renomear'], ['copiar', '📄 Copiar'], ['excluir', '🗑️ Excluir']];
            menuAberto = CE.el('div', { class: 'jm-menu-direito' }, ...opcoes.map(([acao, rotulo]) => CE.el('button', { 'data-opcao': acao, onclick: () => {
              fecharMenu();
              const certa = ehLixo ? 'excluir' : 'abrir';
              if (acao === certa) concluir(caixa, ehLixo ? '✨' : s);
              else ctx.aviso(ehLixo ? 'Caixa de lixo 🗑️: escolha "Excluir" no menu.' : 'Para ver o que tem dentro, escolha "Abrir".');
            } }, rotulo)));
            menuAberto.style.left = Math.min(e.clientX - caixaPalco.left, caixaPalco.width - 170) + 'px';
            menuAberto.style.top = Math.min(e.clientY - caixaPalco.top, caixaPalco.height - 170) + 'px';
            palco.append(menuAberto);
          });
          palco.append(caixa);
        });
      }

      // ---------- Tesouro: rodinha ----------
      function tesouro(ctx) {
        const { regra, palco } = ctx;
        let perolas = 0, abriu = false;
        const profundidade = () => `Profundidade: ${Math.round(palco.scrollTop / 10)} m` + (regra.perolas ? ` · Pérolas: ${perolas} de ${regra.perolas}` : '');
        const bichos = ['🐠', '🐟', '🐡', '🦀', '🐙', '🐢', '🦑', '🐳', '🪸', '🐚', '🦈', '🐬', '🦐', '🐋'];
        const quantosBichos = Math.round(regra.altura / 230);
        const mar = CE.el('div', { class: 'jm-mar' });
        mar.style.height = regra.altura + 'px';
        const barco = CE.el('button', { class: 'jm-barco', 'aria-label': 'Barco', onclick: () => {
          if (!regra.voltar || ctx.acabou) return;
          if (!abriu) ctx.aviso('Primeiro desça e pegue o tesouro!'); else ctx.vencer();
        } }, '⛵');
        mar.append(barco);
        for (let i = 0; i < quantosBichos; i++) {
          const e = CE.el('span', { class: 'jm-bicho' }, bichos[i % bichos.length]);
          e.style.top = 260 + i * 220 + 'px';
          e.style.left = 10 + ((i * 37) % 75) + '%';
          mar.append(e);
        }
        for (let i = 0; i < regra.perolas; i++) {
          const perola = CE.el('button', { class: 'jm-perola', 'aria-label': 'Pérola', onclick: () => {
            perola.remove(); perolas++; ctx.mostrar(profundidade());
          } }, '🦪');
          perola.style.top = 400 + ((regra.altura - 700) / regra.perolas) * (i + 0.5) + 'px';
          perola.style.left = 15 + ((i * 53) % 70) + '%';
          mar.append(perola);
        }
        const bau = CE.el('button', { class: 'jm-bau', 'aria-label': 'Baú do tesouro', onclick: (e) => {
          if (ctx.acabou || abriu) return;
          if (perolas < regra.perolas) { ctx.aviso(`Faltam ${regra.perolas - perolas} pérolas! Suba com a rodinha e procure.`); return; }
          e.currentTarget.textContent = '👑💰';
          abriu = true;
          if (regra.voltar) ctx.aviso('Tesouro pego! Agora gire a rodinha para CIMA e clique no barco ⛵.');
          else ctx.vencer();
        } }, '🧰');
        mar.append(bau);
        palco.append(mar);
        ctx.mostrar(profundidade());
        palco.addEventListener('scroll', () => {
          ctx.mostrar(profundidade());
          if (palco.scrollTop + palco.clientHeight >= palco.scrollHeight - 40) CE.emitir('rolagem:fundo', { onde: 'tesouro' });
          if (abriu && palco.scrollTop < 20) CE.emitir('rolagem:topo', { onde: 'tesouro' });
        });
        const instrucao = palco.parentElement.querySelector('.jm-instrucao');
        if (!regra.perolas) instrucao.textContent += ' Quando achar o baú, clique nele!';
      }

      // ---------- Pontaria: mira (mover e clicar no lugar certo) ----------
      function pontaria(ctx) {
        const { regra, palco } = ctx;
        let acertos = 0, mostrados = 0;
        const precisoes = [];
        const media = () => (precisoes.length ? Math.round(precisoes.reduce((a, b) => a + b, 0) / precisoes.length) : null);
        const atualizar = () => {
          ctx.mostrar(`Acertos: ${acertos} · Alvos: ${mostrados} de ${regra.alvos}${media() != null ? ` · Precisão média: ${media()}%` : ''}`);
          ctx.resumo = media() != null ? `Precisão média: ${media()}% (100% é bem no centro).` : '';
          ctx.extra = { precisao: media() };
        };
        atualizar();
        // Mostra a precisão bem onde o aluno clicou: aparece rápido e some sozinha, sem tapar o próximo alvo.
        const mostrarPrecisao = (x, y, texto, classe) => {
          const caixa = palco.getBoundingClientRect();
          const marca = CE.el('div', { class: `jm-precisao ${classe}`, 'aria-hidden': 'true' }, texto);
          marca.style.left = x - caixa.left + 'px';
          marca.style.top = y - caixa.top + 'px';
          palco.append(marca);
          setTimeout(() => marca.remove(), 700);
        };
        palco.addEventListener('click', (e) => {
          if (ctx.acabou || e.target.closest('.jm-alvo') || !e.detail) return;
          mostrarPrecisao(e.clientX, e.clientY, 'Fora · 0%', 'fora');
        });
        function proximo() {
          if (ctx.acabou) return;
          if (mostrados >= regra.alvos) {
            if (acertos >= regra.minimo) ctx.vencer();
            else ctx.perder(`Você acertou ${acertos} de ${regra.alvos}. Precisa de pelo menos ${regra.minimo}.`);
            return;
          }
          mostrados++;
          atualizar();
          const caixa = palco.getBoundingClientRect();
          const alvo = CE.el('button', { class: 'jm-alvo', 'aria-label': 'Alvo' });
          alvo.style.width = alvo.style.height = regra.tamanho + 'px';
          alvo.style.left = sortear(10, Math.max(12, caixa.width - regra.tamanho - 10)) + 'px';
          alvo.style.top = sortear(10, Math.max(12, caixa.height - regra.tamanho - 10)) + 'px';
          let foi = false;
          alvo.addEventListener('click', (e) => {
            if (foi || ctx.acabou) return;
            foi = true; acertos++;
            // 100% no miolo do alvo, diminuindo até a borda.
            if (e.detail) {
              const r = alvo.getBoundingClientRect();
              const raio = r.width / 2, miolo = raio * 0.15;
              const distancia = Math.hypot(e.clientX - (r.left + raio), e.clientY - (r.top + raio));
              const precisao = distancia <= miolo ? 100 : Math.max(1, Math.min(99, Math.round(100 * (1 - (distancia - miolo) / (raio - miolo)))));
              precisoes.push(precisao);
              mostrarPrecisao(e.clientX, e.clientY, `${precisao}%`, precisao >= 85 ? 'otima' : precisao >= 55 ? 'boa' : 'fraca');
              CE.emitir('jogo:precisao', { jogo: 'pontaria', precisao });
            }
            alvo.classList.add('acertou');
            atualizar();
            setTimeout(() => { alvo.remove(); proximo(); }, 180);
          });
          if (regra.some) ctx.depois(() => { if (foi) return; foi = true; alvo.classList.add('sumiu'); setTimeout(() => { alvo.remove(); proximo(); }, 200); }, regra.some * 1000);
          palco.append(alvo);
        }
        ctx.depois(proximo, 400);
      }

      // ---------- Labirinto: mover o mouse com cuidado ----------
      function labirinto(ctx) {
        const { regra, palco } = ctx;
        const L = regra.largura;
        const pts = regra.pontos;
        let andando = false, batidas = 0;
        const mapa = CE.el('div', { class: 'jm-mapa' });
        // Cada trecho do caminho é um retângulo; ele passa um pouco das pontas para as curvas ficarem fechadas.
        for (let i = 0; i < pts.length - 1; i++) {
          const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
          const t = CE.el('div', { class: 'jm-caminho' });
          Object.assign(t.style, {
            left: Math.min(x1, x2) - L / 2 + 'px', top: Math.min(y1, y2) - L / 2 + 'px',
            width: Math.abs(x2 - x1) + L + 'px', height: Math.abs(y2 - y1) + L + 'px',
          });
          mapa.append(t);
        }
        const posicionar = (el, [x, y]) => Object.assign(el.style, { left: x - L / 2 + 'px', top: y - L / 2 + 'px', width: L + 'px', height: L + 'px', fontSize: Math.round(L * 0.7) + 'px' });
        const rato = CE.el('button', { class: 'jm-rato', 'aria-label': 'Ratinho (comece aqui)' }, '🐭');
        const queijo = CE.el('div', { class: 'jm-queijo', 'aria-label': 'Queijo (chegada)' }, '🧀');
        posicionar(rato, pts[0]);
        posicionar(queijo, pts[pts.length - 1]);
        mapa.append(rato, queijo);
        palco.append(mapa);
        // O labirinto tem tamanho fixo e encolhe para caber na janela.
        const ajustar = () => {
          const escala = Math.min(1, (palco.clientWidth - 16) / 780, (palco.clientHeight - 16) / 420);
          mapa.style.transform = `translate(-50%, -50%) scale(${escala})`;
        };
        ajustar();
        const observador = new ResizeObserver(ajustar);
        observador.observe(palco);
        aoTrocar(() => observador.disconnect());
        const mostrar = () => ctx.mostrar(andando ? '🐭 Andando… não encoste na parede!' : `Clique no ratinho para começar${batidas ? ` · batidas: ${batidas}` : ''}`);
        mostrar();
        // Enquanto anda, o ratinho vai junto com a setinha do mouse (o labirinto pode estar encolhido: desfaz a escala).
        const levarRato = (e) => {
          const r = mapa.getBoundingClientRect();
          const escala = r.width / 780;
          rato.style.left = (e.clientX - r.left) / escala - L / 2 + 'px';
          rato.style.top = (e.clientY - r.top) / escala - L / 2 + 'px';
        };
        rato.addEventListener('pointerdown', (e) => {
          if (ctx.acabou) return;
          e.preventDefault();
          if (rato.hasPointerCapture && rato.hasPointerCapture(e.pointerId)) rato.releasePointerCapture(e.pointerId); // na tela de toque
          andando = true; mapa.classList.add('andando'); levarRato(e); mostrar();
        });
        const bateu = () => {
          if (!andando || ctx.acabou) return;
          andando = false; batidas++;
          mapa.classList.remove('andando');
          mapa.classList.remove('bateu'); void mapa.offsetWidth; mapa.classList.add('bateu');
          posicionar(rato, pts[0]); // volta para o começo
          ctx.aviso('💥 Encostou na parede! Clique no ratinho para começar de novo.');
          mostrar();
        };
        mapa.addEventListener('pointermove', (e) => {
          if (!andando) return;
          levarRato(e);
          // O ratinho não "pega" o mouse (pointer-events: none): o que está embaixo dele é o caminho, a parede ou o queijo.
          const embaixo = document.elementFromPoint(e.clientX, e.clientY);
          if (embaixo === queijo || (embaixo && queijo.contains(embaixo))) { andando = false; mapa.classList.remove('andando'); posicionar(rato, pts[pts.length - 1]); ctx.vencer(); return; }
          if (embaixo === mapa || !mapa.contains(embaixo)) bateu();
        });
        mapa.addEventListener('pointerleave', bateu);
      }

      const JOGAR = { baloes, presentes, feira, caixas, tesouro, pontaria, labirinto };
      async function jogar(id, nivel = 'facil') {
        if (!REGRAS[id][nivel]) nivel = 'facil';
        if (nivel !== 'facil' && !ehInstrutor()) {
          const r = recordes(await CE.sessao.progresso(), id);
          const pedido = nivel;
          // Desce até o nível que o aluno já pode jogar.
          for (let i = NIVEIS.findIndex((x) => x.id === nivel); i > 0 && r[NIVEIS[i - 1].id] == null; i--) nivel = NIVEIS[i - 1].id;
          if (nivel !== pedido) CE.avisar(`O nível ${NIVEIS.find((x) => x.id === pedido).nome} ainda está trancado. Vença o nível ${NIVEIS.find((x) => x.id === nivel).nome} primeiro.`);
        }
        JOGAR[id](partida(id, nivel));
        CE.emitir('jogo:iniciado', { jogo: id, nivel });
      }

      if (argumento && JOGAR[argumento.jogo]) jogar(argumento.jogo, argumento.nivel); else menu();
      return {
        receber(arg) {
          if (arg && JOGAR[arg.jogo]) jogar(arg.jogo, arg.nivel);
          else if (arg && arg.menu) menu();
        },
        aoFechar() { desligarTudo(); return true; },
      };
    },
  });
})();
