// Curso de Digitação: exercícios em níveis, teclado na tela mostrando a próxima tecla e o dedo certo.
(function () {
  const EXERCICIOS = [
    { id: 'meio-1', nivel: 'Fileira do meio', titulo: 'Teclas F e J', texto: 'fff jjj fj fj jf jf fjfj jfjf ff jj fj' },
    { id: 'meio-2', nivel: 'Fileira do meio', titulo: 'A S D F  J K L Ç', texto: 'asdf jklç asdf jklç fdsa çlkj sala dada lala' },
    { id: 'meio-3', nivel: 'Fileira do meio', titulo: 'Palavras da fileira do meio', texto: 'sala fada dada asa lado salsa falsa alfafa' },
    { id: 'cima-1', nivel: 'Fileira de cima', titulo: 'Q W E R T  Y U I O P', texto: 'quero pote rio tiro porta perto roupa time' },
    { id: 'baixo-1', nivel: 'Fileira de baixo', titulo: 'Z X C V B  N M', texto: 'cava bom navio vez cama nuvem boca xale' },
    { id: 'palavras-1', nivel: 'Palavras', titulo: 'Palavras do dia a dia', texto: 'casa escola amigo comida trabalho familia computador teclado' },
    { id: 'acentos-1', nivel: 'Acentos', titulo: 'Acentos e cedilha', texto: 'café avó você mãe pão ação maçã está até lição' },
    { id: 'frases-1', nivel: 'Frases', titulo: 'Frases curtas', texto: 'Eu gosto de aprender. O computador ajuda no trabalho. Hoje é um bom dia.' },
    { id: 'frases-2', nivel: 'Frases', titulo: 'Frases com números', texto: 'Comprei 3 pães e 2 litros de leite. Minha casa fica na rua 15, número 230.' },
  ];

  // Teclado ABNT2 (o padrão no Brasil). Cada tecla: [caractere, dedo].
  // Dedos: 1 mínimo esq., 2 anelar esq., 3 médio esq., 4 indicador esq., 5 polegares,
  //        6 indicador dir., 7 médio dir., 8 anelar dir., 9 mínimo dir.
  const FILEIRAS = [
    [['1', 1], ['2', 2], ['3', 3], ['4', 4], ['5', 4], ['6', 6], ['7', 6], ['8', 7], ['9', 8], ['0', 9], ['-', 9]],
    [['q', 1], ['w', 2], ['e', 3], ['r', 4], ['t', 4], ['y', 6], ['u', 6], ['i', 7], ['o', 8], ['p', 9], ['´', 9]],
    [['a', 1], ['s', 2], ['d', 3], ['f', 4], ['g', 4], ['h', 6], ['j', 6], ['k', 7], ['l', 8], ['ç', 9], ['~', 9]],
    [['z', 1], ['x', 2], ['c', 3], ['v', 4], ['b', 4], ['n', 6], ['m', 6], [',', 7], ['.', 8], [';', 9]],
  ];
  const NOMES_DEDOS = {
    1: 'dedo mínimo da mão esquerda', 2: 'dedo anelar da mão esquerda', 3: 'dedo médio da mão esquerda',
    4: 'dedo indicador da mão esquerda', 5: 'polegar', 6: 'dedo indicador da mão direita',
    7: 'dedo médio da mão direita', 8: 'dedo anelar da mão direita', 9: 'dedo mínimo da mão direita',
  };
  const DEDO = {};
  FILEIRAS.flat().forEach(([c, d]) => { DEDO[c] = d; });
  DEDO[' '] = 5;

  // Letra acentuada -> tecla base (para acender a tecla certa no teclado da tela).
  const BASE = { á: 'a', à: 'a', â: 'a', ã: 'a', é: 'e', ê: 'e', í: 'i', ó: 'o', ô: 'o', õ: 'o', ú: 'u', ':': ';', '?': '/', '!': '1' };

  function teclaBase(c) {
    const minuscula = c.toLowerCase();
    return BASE[minuscula] || minuscula;
  }

  function estrelas(ppm, precisao) {
    if (precisao >= 95 && ppm >= 20) return 3;
    if (precisao >= 90 && ppm >= 10) return 2;
    return precisao >= 80 ? 1 : 0;
  }

  CE.exerciciosDigitacao = EXERCICIOS;

  CE.registrarApp({
    id: 'digitacao',
    nome: 'Digitação',
    icone: '⌨️',
    largura: 900,
    altura: 620,
    abrir(corpo, _janela, argumento) {
      corpo.classList.add('digitacao');

      async function mostrarLista() {
        const progresso = (await CE.sessao.progresso()).digitacao || {};
        let nivelAtual = '';
        const itens = [];
        EXERCICIOS.forEach((ex) => {
          if (ex.nivel !== nivelAtual) { nivelAtual = ex.nivel; itens.push(CE.el('h3', { class: 'dig-nivel' }, ex.nivel)); }
          const feito = progresso[ex.id];
          itens.push(CE.el('button', { class: 'dig-exercicio', 'data-exercicio': ex.id, onclick: () => praticar(ex) },
            CE.el('span', {}, ex.titulo),
            CE.el('span', { class: 'dig-estrelas', title: feito ? `${feito.ppm} palavras por minuto, ${feito.precisao}% de acerto` : 'Ainda não feito' },
              feito ? '★'.repeat(feito.estrelas) + '☆'.repeat(3 - feito.estrelas) : '☆☆☆'),
          ));
        });
        corpo.replaceChildren(CE.el('div', { class: 'dig-lista' },
          CE.el('h2', {}, 'Curso de Digitação'),
          CE.el('p', {}, 'Escolha um exercício. Comece pelo primeiro e vá seguindo a ordem!'),
          ...itens,
        ));
      }

      function praticar(ex) {
        let posicao = 0, erros = 0, inicio = null, errouAgora = false;
        const letras = [...ex.texto].map((c) => CE.el('span', { class: 'dig-letra' + (c === ' ' ? ' espaco' : '') }, c));
        const areaTexto = CE.el('div', { class: 'dig-texto', tabindex: '0', 'aria-label': 'Texto para digitar' }, ...letras);
        const dica = CE.el('div', { class: 'dig-dica' });
        const placar = CE.el('div', { class: 'dig-placar' });
        const teclado = CE.el('div', { class: 'teclado' },
          ...FILEIRAS.map((fileira, i) => CE.el('div', { class: 'teclado-fileira f' + i },
            ...fileira.map(([c, d]) => CE.el('span', { class: `tecla dedo${d}${c === 'f' || c === 'j' ? ' relevo' : ''}`, 'data-tecla': c }, c.toUpperCase())))),
          CE.el('div', { class: 'teclado-fileira' },
            CE.el('span', { class: 'tecla shift', 'data-tecla': 'shift' }, 'Shift'),
            CE.el('span', { class: 'tecla espaco dedo5', 'data-tecla': ' ' }, 'Espaço'),
            CE.el('span', { class: 'tecla shift', 'data-tecla': 'shift' }, 'Shift')),
        );

        function atualizar() {
          letras.forEach((l, i) => l.classList.toggle('atual', i === posicao));
          teclado.querySelectorAll('.tecla').forEach((t) => t.classList.remove('proxima'));
          if (posicao >= letras.length) return;
          const c = ex.texto[posicao];
          const base = teclaBase(c);
          teclado.querySelectorAll(`.tecla[data-tecla="${CSS.escape(base)}"]`).forEach((t) => t.classList.add('proxima'));
          const precisaShift = c !== c.toLowerCase() || ':?!'.includes(c);
          if (precisaShift) teclado.querySelectorAll('.tecla.shift').forEach((t) => t.classList.add('proxima'));
          const acento = { á: '´', é: '´', í: '´', ó: '´', ú: '´', ã: '~', õ: '~', â: 'circunflexo (^)', ê: 'circunflexo (^)', ô: 'circunflexo (^)' }[c.toLowerCase()];
          const qual = c === ' ' ? 'a barra de espaço' : `a tecla "${c}"`;
          dica.textContent = `Aperte ${qual} com o ${NOMES_DEDOS[DEDO[base]] || 'dedo mais perto'}` +
            (acento ? `. Primeiro aperte o acento ${acento}, depois a letra.` : '') +
            (precisaShift ? '. Segure o Shift junto!' : '.');
          const segundos = inicio ? (Date.now() - inicio) / 1000 : 0;
          const ppm = segundos > 2 ? Math.round((posicao / 5) / (segundos / 60)) : 0;
          const precisao = posicao + erros ? Math.round((posicao / (posicao + erros)) * 100) : 100;
          placar.textContent = `Velocidade: ${ppm} palavras/min · Acertos: ${precisao}% · Erros: ${erros}`;
        }

        async function terminar() {
          const minutos = (Date.now() - inicio) / 60000;
          const ppm = Math.round((ex.texto.length / 5) / Math.max(minutos, 0.01));
          const precisao = Math.round((ex.texto.length / (ex.texto.length + erros)) * 100);
          const nota = estrelas(ppm, precisao);
          await CE.sessao.atualizarProgresso((p) => {
            p.digitacao = p.digitacao || {};
            const anterior = p.digitacao[ex.id];
            if (!anterior || nota > anterior.estrelas || (nota === anterior.estrelas && ppm > anterior.ppm)) {
              p.digitacao[ex.id] = { ppm, precisao, estrelas: nota, em: Date.now() };
            }
          });
          CE.emitir('digitacao:concluida', { exercicio: ex.id, ppm, precisao, estrelas: nota });
          const indice = EXERCICIOS.indexOf(ex);
          corpo.replaceChildren(CE.el('div', { class: 'dig-resultado' },
            CE.el('h2', {}, nota >= 2 ? 'Muito bem! 🎉' : 'Exercício concluído!'),
            CE.el('div', { class: 'dig-estrelas grande' }, '★'.repeat(nota) + '☆'.repeat(3 - nota)),
            CE.el('p', {}, `Velocidade: ${ppm} palavras por minuto`),
            CE.el('p', {}, `Acertos: ${precisao}% (${erros} erro${erros === 1 ? '' : 's'})`),
            CE.el('p', { class: 'dig-conselho' }, precisao < 90 ? 'Dica: vá mais devagar e olhe para a tela, não para o teclado. Acertar é mais importante que correr!' : 'Ótima precisão! Agora tente ir um pouquinho mais rápido.'),
            CE.el('div', { class: 'dialogo-botoes' },
              CE.el('button', { class: 'botao secundario', onclick: mostrarLista }, 'Lista de exercícios'),
              CE.el('button', { class: 'botao secundario', onclick: () => praticar(ex) }, 'Tentar de novo'),
              EXERCICIOS[indice + 1] ? CE.el('button', { class: 'botao', onclick: () => praticar(EXERCICIOS[indice + 1]) }, 'Próximo exercício →') : null,
            ),
          ));
        }

        areaTexto.addEventListener('keydown', (e) => {
          if (e.key === 'Dead' || e.key === 'Shift' || e.key === 'CapsLock' || e.ctrlKey || e.altKey) return;
          if (e.key.length !== 1) return;
          e.preventDefault();
          if (!inicio) inicio = Date.now();
          const esperado = ex.texto[posicao];
          if (e.key === esperado) {
            letras[posicao].classList.add(errouAgora ? 'corrigida' : 'certa');
            letras[posicao].classList.remove('errada');
            errouAgora = false;
            posicao++;
            if (posicao >= letras.length) { terminar(); return; }
          } else {
            erros++;
            errouAgora = true;
            letras[posicao].classList.add('errada');
            areaTexto.classList.remove('tremer');
            void areaTexto.offsetWidth;
            areaTexto.classList.add('tremer');
          }
          atualizar();
        });

        corpo.replaceChildren(CE.el('div', { class: 'dig-pratica' },
          CE.el('div', { class: 'dig-cabecalho' },
            CE.el('button', { class: 'botao secundario', onclick: mostrarLista }, '← Exercícios'),
            CE.el('strong', {}, `${ex.nivel}: ${ex.titulo}`),
          ),
          areaTexto, dica, placar, teclado,
          CE.el('p', { class: 'dig-rodape' }, 'Clique no texto acima e comece a digitar. Deixe os indicadores nas teclas F e J (elas têm um risquinho).'),
        ));
        atualizar();
        areaTexto.focus();
        CE.emitir('digitacao:iniciada', { exercicio: ex.id });
      }

      const inicial = argumento && EXERCICIOS.find((e) => e.id === argumento.exercicio);
      if (inicial) praticar(inicial); else mostrarLista();
      return {
        receber(arg) {
          const ex = arg && EXERCICIOS.find((e) => e.id === arg.exercicio);
          if (ex) praticar(ex);
        },
      };
    },
  });
})();
