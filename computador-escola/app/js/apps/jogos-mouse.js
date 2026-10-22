// Jogos do Mouse: um jogo para cada habilidade (clique, clique duplo, arrastar, botão direito e rodinha).
// Cada jogo concluído avisa com o evento "jogo:concluido" { jogo }.
(function () {
  const JOGOS = [
    { id: 'baloes', icone: '🎈', nome: 'Estoure os balões', habilidade: 'Clique', descricao: 'Clique uma vez em cada balão para estourar. Estoure 10!' },
    { id: 'presentes', icone: '🎁', nome: 'Abra os presentes', habilidade: 'Clique duplo', descricao: 'Dê um clique duplo (dois cliques rápidos) em cada presente.' },
    { id: 'feira', icone: '🧺', nome: 'Feira da fruta', habilidade: 'Arrastar', descricao: 'Segure o botão do mouse em cima da fruta e arraste até a cesta.' },
    { id: 'caixas', icone: '📦', nome: 'Caixas secretas', habilidade: 'Botão direito', descricao: 'Clique com o botão DIREITO em cada caixa para ver o que tem dentro.' },
    { id: 'tesouro', icone: '🏴‍☠️', nome: 'Caça ao tesouro', habilidade: 'Rodinha', descricao: 'Gire a rodinha do mouse para descer até o fundo do mar e achar o tesouro.' },
  ];

  CE.JOGOS_MOUSE = JOGOS;

  CE.registrarApp({
    id: 'jogos-mouse',
    nome: 'Jogos do Mouse',
    icone: '🕹️',
    largura: 860,
    altura: 600,
    abrir(corpo, _janela, argumento) {
      corpo.classList.add('jogos-mouse');
      let limpar = () => {};

      function trocar(...conteudo) {
        limpar();
        limpar = () => {};
        corpo.replaceChildren(...conteudo);
      }

      async function menu() {
        const feitos = ((await CE.sessao.progresso()).jogosMouse) || {};
        trocar(CE.el('div', { class: 'jm-menu' },
          CE.el('h2', {}, '🕹️ Jogos do Mouse'),
          CE.el('p', {}, 'Escolha um jogo para treinar o mouse brincando.'),
          CE.el('div', { class: 'jm-lista' }, ...JOGOS.map((j) => CE.el('button', { class: 'jm-cartao', 'data-jogo': j.id, onclick: () => jogar(j.id) },
            CE.el('span', { class: 'jm-icone' }, j.icone),
            CE.el('strong', {}, j.nome),
            CE.el('span', { class: 'jm-habilidade' }, j.habilidade),
            CE.el('span', {}, j.descricao),
            feitos[j.id] ? CE.el('small', {}, `✅ Concluído · melhor tempo: ${feitos[j.id]}s`) : null))),
        ));
      }

      function moldura(jogo, palco, placar) {
        const j = JOGOS.find((x) => x.id === jogo);
        return CE.el('div', { class: 'jm-jogo' },
          CE.el('div', { class: 'jm-cabecalho' },
            CE.el('button', { class: 'botao secundario', onclick: menu }, '← Jogos'),
            CE.el('strong', {}, `${j.icone} ${j.nome}`),
            placar),
          CE.el('p', { class: 'jm-instrucao' }, j.descricao),
          palco);
      }

      async function vitoria(jogo, inicio, palco) {
        const segundos = Math.round((Date.now() - inicio) / 1000);
        await CE.sessao.atualizarProgresso((p) => {
          p.jogosMouse = p.jogosMouse || {};
          p.jogosMouse[jogo] = Math.min(p.jogosMouse[jogo] || Infinity, segundos);
        });
        CE.comemorar('pequena');
        CE.emitir('jogo:concluido', { jogo, segundos });
        // No tesouro o palco rola; a mensagem vai por cima do jogo inteiro.
        const alvo = palco.classList.contains('tesouro') ? palco.parentElement : palco;
        alvo.append(CE.el('div', { class: 'jm-vitoria' },
          CE.el('h2', {}, 'Parabéns! 🎉'),
          CE.el('p', {}, `Você completou em ${segundos} segundos.`),
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao secundario', onclick: menu }, 'Outros jogos'),
            CE.el('button', { class: 'botao', onclick: () => jogar(jogo) }, 'Jogar de novo'))));
      }

      function avisoNoPalco(palco, texto) {
        const aviso = CE.el('div', { class: 'jm-aviso' }, texto);
        palco.append(aviso);
        setTimeout(() => aviso.remove(), 1400);
      }

      // ---------- Balões: clique ----------
      function baloes() {
        const META = 10;
        let estourados = 0, timer;
        const inicio = Date.now();
        const palco = CE.el('div', { class: 'jm-palco ceu' });
        const placar = CE.el('span', { class: 'jm-placar' }, `0 de ${META}`);
        const cores = ['#e81123', '#ffb900', '#107c10', '#0067c0', '#8e44ad', '#ff8c00'];
        function soltar() {
          const b = CE.el('button', { class: 'jm-balao', 'aria-label': 'Balão' });
          b.style.left = 5 + Math.random() * 85 + '%';
          b.style.setProperty('--cor', cores[Math.floor(Math.random() * cores.length)]);
          b.style.animationDuration = 7 + Math.random() * 4 + 's';
          b.addEventListener('click', () => {
            if (b.classList.contains('estourou')) return;
            b.classList.add('estourou');
            setTimeout(() => b.remove(), 300);
            estourados++;
            placar.textContent = `${estourados} de ${META}`;
            if (estourados >= META) { clearInterval(timer); palco.querySelectorAll('.jm-balao').forEach((x) => x.remove()); vitoria('baloes', inicio, palco); }
          });
          b.addEventListener('animationend', () => b.remove());
          palco.append(b);
        }
        trocar(moldura('baloes', palco, placar));
        soltar();
        timer = setInterval(soltar, 1100);
        limpar = () => clearInterval(timer);
      }

      // ---------- Presentes: clique duplo ----------
      function presentes() {
        const PREMIOS = ['🧸', '⚽', '📚', '🎨', '🍫', '🚲', '🎧', '🌻'];
        let abertos = 0;
        const inicio = Date.now();
        const palco = CE.el('div', { class: 'jm-palco presentes' });
        const placar = CE.el('span', { class: 'jm-placar' }, `0 de ${PREMIOS.length}`);
        PREMIOS.forEach((premio) => {
          const caixa = CE.el('button', { class: 'jm-presente', 'aria-label': 'Presente' }, '🎁');
          caixa.addEventListener('click', () => {
            if (caixa.classList.contains('aberto')) return;
            caixa.classList.remove('tremer'); void caixa.offsetWidth; caixa.classList.add('tremer');
          });
          caixa.addEventListener('dblclick', () => {
            if (caixa.classList.contains('aberto')) return;
            caixa.classList.add('aberto');
            caixa.textContent = premio;
            abertos++;
            placar.textContent = `${abertos} de ${PREMIOS.length}`;
            if (abertos >= PREMIOS.length) vitoria('presentes', inicio, palco);
          });
          palco.append(caixa);
        });
        trocar(moldura('presentes', palco, placar));
      }

      // ---------- Feira: arrastar ----------
      function feira() {
        const FRUTAS = ['🍎', '🍌', '🍇', '🍊', '🍉', '🍍'];
        let guardadas = 0;
        const inicio = Date.now();
        const palco = CE.el('div', { class: 'jm-palco feira' });
        const cesta = CE.el('div', { class: 'jm-cesta' }, '🧺', CE.el('small', {}, 'Solte aqui'));
        const placar = CE.el('span', { class: 'jm-placar' }, `0 de ${FRUTAS.length}`);
        palco.append(cesta);
        FRUTAS.forEach((f, i) => {
          const fruta = CE.el('div', { class: 'jm-fruta' }, f);
          fruta.style.left = 4 + (i % 3) * 13 + '%';
          fruta.style.top = 14 + Math.floor(i / 3) * 40 + '%';
          fruta.addEventListener('pointerdown', (e) => {
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
              const c = cesta.getBoundingClientRect();
              if (ev.clientX >= c.left && ev.clientX <= c.right && ev.clientY >= c.top && ev.clientY <= c.bottom) {
                fruta.remove();
                guardadas++;
                placar.textContent = `${guardadas} de ${FRUTAS.length}`;
                cesta.classList.remove('pulou'); void cesta.offsetWidth; cesta.classList.add('pulou');
                if (guardadas >= FRUTAS.length) vitoria('feira', inicio, palco);
              }
            };
            fruta.addEventListener('pointermove', mover);
            fruta.addEventListener('pointerup', soltar);
          });
          palco.append(fruta);
        });
        trocar(moldura('feira', palco, placar));
      }

      // ---------- Caixas: botão direito ----------
      function caixas() {
        const SURPRESAS = ['⭐', '💎', '🍀', '🎉', '🦋'];
        let abertas = 0;
        const inicio = Date.now();
        const palco = CE.el('div', { class: 'jm-palco caixas' });
        const placar = CE.el('span', { class: 'jm-placar' }, `0 de ${SURPRESAS.length}`);
        SURPRESAS.forEach((s) => {
          const caixa = CE.el('button', { class: 'jm-caixa', 'aria-label': 'Caixa secreta' }, '📦');
          caixa.addEventListener('click', () => { if (!caixa.classList.contains('aberta')) avisoNoPalco(palco, 'Esse foi o botão ESQUERDO. Use o botão DIREITO do mouse!'); });
          caixa.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (caixa.classList.contains('aberta')) return;
            caixa.classList.add('aberta');
            caixa.textContent = s;
            abertas++;
            placar.textContent = `${abertas} de ${SURPRESAS.length}`;
            if (abertas >= SURPRESAS.length) vitoria('caixas', inicio, palco);
          });
          palco.append(caixa);
        });
        trocar(moldura('caixas', palco, placar));
      }

      // ---------- Tesouro: rodinha ----------
      function tesouro() {
        const inicio = Date.now();
        const placar = CE.el('span', { class: 'jm-placar' }, 'Profundidade: 0 m');
        const mar = CE.el('div', { class: 'jm-mar' },
          ...['🐠', '🐟', '🐡', '🦀', '🐙', '🐢', '🦑', '🐳', '🪸', '🐚'].map((bicho, i) => {
            const e = CE.el('span', { class: 'jm-bicho' }, bicho);
            e.style.top = 260 + i * 210 + 'px';
            e.style.left = 10 + ((i * 37) % 75) + '%';
            return e;
          }),
          CE.el('button', { class: 'jm-bau', 'aria-label': 'Baú do tesouro', onclick: (e) => {
            e.currentTarget.textContent = '👑💰';
            e.currentTarget.disabled = true;
            vitoria('tesouro', inicio, palco);
          } }, '🧰'),
        );
        const palco = CE.el('div', { class: 'jm-palco tesouro' }, mar);
        palco.addEventListener('scroll', () => {
          placar.textContent = `Profundidade: ${Math.round(palco.scrollTop / 10)} m`;
          if (palco.scrollTop + palco.clientHeight >= palco.scrollHeight - 40) CE.emitir('rolagem:fundo', { onde: 'tesouro' });
        });
        trocar(moldura('tesouro', palco, placar));
        const instrucao = corpo.querySelector('.jm-instrucao');
        instrucao.textContent += ' Quando achar o baú, clique nele!';
      }

      const JOGAR = { baloes, presentes, feira, caixas, tesouro };
      function jogar(id) {
        JOGAR[id]();
        CE.emitir('jogo:iniciado', { jogo: id });
      }

      if (argumento && JOGAR[argumento.jogo]) jogar(argumento.jogo); else menu();
      return {
        receber(arg) {
          if (arg && JOGAR[arg.jogo]) jogar(arg.jogo);
          else if (arg && arg.menu) menu();
        },
        aoFechar() { limpar(); return true; },
      };
    },
  });
})();
