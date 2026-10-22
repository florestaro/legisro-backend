// Curso de Digitação: 3 níveis com metas de velocidade e acertos, provas cronometradas, ditado e jogos.
// O aluno só libera o próximo exercício quando bate a meta do atual. O instrutor tem tudo liberado.
(function () {
  // Teclado ABNT2 (o padrão no Brasil). Cada tecla: [caractere, dedo].
  // Dedos: 1 mínimo esq., 2 anelar esq., 3 médio esq., 4 indicador esq., 5 polegares,
  //        6 indicador dir., 7 médio dir., 8 anelar dir., 9 mínimo dir.
  const FILEIRAS = [
    [["'", 1], ['1', 1], ['2', 2], ['3', 3], ['4', 4], ['5', 4], ['6', 6], ['7', 6], ['8', 7], ['9', 8], ['0', 9], ['-', 9], ['=', 9]],
    [['q', 1], ['w', 2], ['e', 3], ['r', 4], ['t', 4], ['y', 6], ['u', 6], ['i', 7], ['o', 8], ['p', 9], ['´', 9], ['[', 9]],
    [['a', 1], ['s', 2], ['d', 3], ['f', 4], ['g', 4], ['h', 6], ['j', 6], ['k', 7], ['l', 8], ['ç', 9], ['~', 9], [']', 9]],
    [['\\', 1], ['z', 1], ['x', 2], ['c', 3], ['v', 4], ['b', 4], ['n', 6], ['m', 6], [',', 7], ['.', 8], [';', 9], ['/', 9]],
  ];
  const NOMES_DEDOS = {
    1: 'dedo mínimo da mão esquerda', 2: 'dedo anelar da mão esquerda', 3: 'dedo médio da mão esquerda',
    4: 'dedo indicador da mão esquerda', 5: 'polegar', 6: 'dedo indicador da mão direita',
    7: 'dedo médio da mão direita', 8: 'dedo anelar da mão direita', 9: 'dedo mínimo da mão direita',
  };
  const DEDO = { ' ': 5 };
  FILEIRAS.flat().forEach(([c, d]) => { DEDO[c] = d; });

  // Caracteres feitos com Shift -> tecla onde ficam.
  const COM_SHIFT = {
    '!': '1', '@': '2', '#': '3', $: '4', '%': '5', '&': '7', '*': '8', '(': '9', ')': '0', _: '-', '+': '=',
    '"': "'", ':': ';', '?': '/', '<': ',', '>': '.', '{': '[', '}': ']', '|': '\\',
  };
  // Letras acentuadas -> [tecla do acento, usa Shift no acento?, letra, nome do acento].
  const ACENTOS = {
    á: ['´', false, 'a', 'agudo (´)'], é: ['´', false, 'e', 'agudo (´)'], í: ['´', false, 'i', 'agudo (´)'], ó: ['´', false, 'o', 'agudo (´)'], ú: ['´', false, 'u', 'agudo (´)'],
    à: ['´', true, 'a', 'grave (`), com Shift'],
    ã: ['~', false, 'a', 'til (~)'], õ: ['~', false, 'o', 'til (~)'],
    â: ['~', true, 'a', 'circunflexo (^), com Shift'], ê: ['~', true, 'e', 'circunflexo (^), com Shift'], ô: ['~', true, 'o', 'circunflexo (^), com Shift'],
  };

  // Como fazer o caractere c: teclas a acender, se precisa de Shift e o texto da dica.
  function comoDigitar(c) {
    const minuscula = c.toLowerCase();
    const acento = ACENTOS[minuscula];
    if (acento) {
      const [teclaAcento, shiftAcento, letra, nome] = acento;
      return {
        teclas: [teclaAcento, letra], shift: shiftAcento || c !== minuscula,
        dica: `Primeiro aperte o acento ${nome} e depois a letra "${c !== minuscula ? letra.toUpperCase() : letra}".`,
      };
    }
    if (COM_SHIFT[c]) {
      const tecla = COM_SHIFT[c];
      return { teclas: [tecla], shift: true, dica: `Segure o Shift e aperte a tecla "${tecla}" com o ${NOMES_DEDOS[DEDO[tecla]]}.` };
    }
    const shift = c !== minuscula;
    const qual = c === ' ' ? 'a barra de espaço' : `a tecla "${minuscula}"`;
    return {
      teclas: [minuscula], shift,
      dica: `Aperte ${qual} com o ${NOMES_DEDOS[DEDO[minuscula]] || 'dedo mais perto'}${shift ? ', segurando o Shift com a outra mão' : ''}.`,
    };
  }

  function estrelasDe(resultado, meta, tipo) {
    if (!resultado.aprovado) return 0;
    if (tipo === 'ditado') return resultado.precisao >= 100 ? 3 : resultado.precisao >= 96 ? 2 : 1;
    const ppmBase = Math.max(meta.ppm, 1);
    if (resultado.ppm >= ppmBase * 1.5 && resultado.precisao >= 98) return 3;
    if (resultado.ppm >= ppmBase * 1.25 && resultado.precisao >= meta.precisao + 2) return 2;
    return 1;
  }

  // Distância entre dois textos (quantas letras precisam mudar), usada no ditado.
  function distancia(a, b) {
    const linha = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let anterior = linha[0];
      linha[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const guardado = linha[j];
        linha[j] = Math.min(linha[j] + 1, linha[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1));
        anterior = guardado;
      }
    }
    return linha[b.length];
  }

  const ehInstrutor = () => CE.sessao.usuario.papel === 'instrutor';

  // Um exercício está liberado quando o anterior (na ordem do curso) foi aprovado.
  CE.digitacaoLiberado = function (exercicio, resultados) {
    if (ehInstrutor()) return true;
    const i = CE.DIGITACAO.lista.indexOf(exercicio);
    if (i <= 0) return true;
    const anterior = CE.DIGITACAO.lista[i - 1];
    return !!(resultados[anterior.id] && resultados[anterior.id].aprovado);
  };

  async function guardarResultado(exercicio, resultado, errosPorTecla) {
    let salvo;
    await CE.sessao.atualizarProgresso((p) => {
      p.digitacao = p.digitacao || {};
      const d = p.digitacao;
      const anterior = d[exercicio.id];
      const tentativas = (anterior ? anterior.tentativas || 1 : 0) + 1;
      const melhor = !anterior || (resultado.aprovado && !anterior.aprovado) || resultado.estrelas > (anterior.estrelas || 0) ||
        (resultado.estrelas === anterior.estrelas && resultado.ppm > anterior.ppm);
      d[exercicio.id] = melhor ? { ...resultado, tentativas, em: Date.now() } : { ...anterior, tentativas };
      d._historico = (d._historico || []).concat({ id: exercicio.id, ppm: resultado.ppm, precisao: resultado.precisao, em: Date.now() }).slice(-200);
      d._teclas = d._teclas || {};
      Object.entries(errosPorTecla || {}).forEach(([c, n]) => { d._teclas[c] = (d._teclas[c] || 0) + n; });
      salvo = d[exercicio.id];
    });
    CE.emitir('digitacao:concluida', { exercicio: exercicio.id, ...resultado, nivel: exercicio.nivel, prova: !!exercicio.prova });
    return salvo;
  }

  CE.registrarApp({
    id: 'digitacao',
    nome: 'Digitação',
    icone: '⌨️',
    largura: 960,
    altura: 640,
    abrir(corpo, _janela, argumento) {
      corpo.classList.add('digitacao');
      let abaAtual = 'iniciante';
      let encerrarAtual = () => {};

      function trocarTela(...conteudo) {
        encerrarAtual();
        encerrarAtual = () => {};
        corpo.replaceChildren(...conteudo);
      }

      // ---------- Lista de exercícios ----------

      async function mostrarLista(aba = abaAtual) {
        abaAtual = aba;
        const resultados = (await CE.sessao.progresso()).digitacao || {};
        const abas = CE.el('div', { class: 'dig-abas' },
          ...CE.DIGITACAO.niveis.map((n) => {
            const liberado = CE.digitacaoLiberado(n.modulos[0].exercicios[0], resultados);
            const feitos = n.modulos.flatMap((m) => m.exercicios).filter((e) => resultados[e.id] && resultados[e.id].aprovado).length;
            const total = n.modulos.reduce((s, m) => s + m.exercicios.length, 0);
            return CE.el('button', { class: 'chip' + (aba === n.id ? ' ativo' : ''), 'data-nivel': n.id, onclick: () => mostrarLista(n.id) },
              `${liberado ? n.icone : '🔒'} ${n.nome} · ${feitos}/${total}`);
          }),
          CE.el('button', { class: 'chip' + (aba === 'jogos' ? ' ativo' : ''), 'data-nivel': 'jogos', onclick: () => mostrarLista('jogos') }, '🎮 Jogos e treinos'),
        );
        if (aba === 'jogos') { trocarTela(CE.el('div', { class: 'dig-lista' }, abas, telaJogos(resultados))); return; }

        const nivel = CE.DIGITACAO.niveis.find((n) => n.id === aba);
        const itens = (exercicios) => exercicios.map((ex) => {
          const r = resultados[ex.id];
          const liberado = CE.digitacaoLiberado(ex, resultados);
          const meta = CE.metaDigitacao(ex, CE.sessao.usuario);
          const textoMeta = ex.tipo === 'ditado' ? `Meta: ${meta.precisao}% de acertos` : `Meta: ${meta.ppm} ppm · ${meta.precisao}%${ex.duracao ? ` · ${ex.duracao / 60} min` : ''}`;
          return CE.el('button', {
            class: 'dig-exercicio' + (r && r.aprovado ? ' aprovado' : '') + (!liberado ? ' bloqueado' : '') + (ex.prova ? ' prova' : ''),
            'data-exercicio': ex.id, disabled: !liberado,
            title: liberado ? '' : 'Complete o exercício anterior para liberar este.',
            onclick: () => praticar(ex),
          },
            CE.el('span', { class: 'dig-ex-icone' }, !liberado ? '🔒' : r && r.aprovado ? '✅' : ex.prova ? '🏁' : ex.tipo === 'ditado' ? '🎧' : ex.tipo === 'tempo' ? '⏱️' : '▶'),
            CE.el('span', { class: 'dig-ex-nome' }, ex.titulo, CE.el('small', {}, textoMeta)),
            CE.el('span', { class: 'dig-estrelas', title: r ? `Melhor: ${r.ppm} ppm, ${r.precisao}% de acertos` : 'Ainda não feito' },
              r && r.dispensado ? 'dispensado' : r && r.aprovado ? '★'.repeat(r.estrelas) + '☆'.repeat(3 - r.estrelas) : r ? `${r.ppm} ppm · ${r.precisao}%` : ''),
          );
        });

        trocarTela(CE.el('div', { class: 'dig-lista' },
          abas,
          CE.el('button', { class: 'dig-nivelamento', 'data-acao': 'nivelamento-digitacao', onclick: () => praticar(CE.DIGITACAO.nivelamento) },
            CE.el('span', { class: 'dig-ex-icone' }, '🧭'),
            CE.el('span', { class: 'dig-ex-nome' }, 'Teste de nivelamento (1 minuto)', CE.el('small', {}, 'Já sabe digitar? Faça o teste: os níveis em que você já bate a meta da prova ficam dispensados.'))),
          CE.el('p', { class: 'dig-intro' }, ehInstrutor()
            ? 'Você é instrutor: todos os exercícios estão liberados.'
            : 'Faça os exercícios na ordem. Para liberar o próximo, bata a meta de velocidade (ppm = palavras por minuto) e de acertos.'),
          ...nivel.modulos.map((m) => CE.el('section', { class: 'dig-modulo' }, CE.el('h3', { class: 'dig-nivel' }, m.titulo), ...itens(m.exercicios))),
          CE.el('section', { class: 'dig-modulo' }, CE.el('h3', { class: 'dig-nivel' }, 'Prova do nível'), ...itens([nivel.prova])),
        ));
      }

      // ---------- Treino (texto e tempo) ----------

      function praticar(ex) {
        if (ex.tipo === 'ditado') { praticarDitado(ex); return; }
        const meta = CE.metaDigitacao(ex, CE.sessao.usuario);
        let posicao = 0, erros = 0, inicio = null, errouAgora = false, terminou = false, relogio = null;
        const errosPorTecla = {};
        const textoLongo = ex.texto.length > 160;
        const letras = [...ex.texto].map((c) => CE.el('span', { class: 'dig-letra' + (c === ' ' ? ' espaco' : '') }, c));
        const areaTexto = CE.el('div', { class: 'dig-texto' + (textoLongo ? ' longo' : ''), tabindex: '0', 'aria-label': 'Texto para digitar' }, ...letras);
        const dica = CE.el('div', { class: 'dig-dica' });
        const placar = CE.el('div', { class: 'dig-placar' });
        const cronometro = CE.el('div', { class: 'dig-cronometro' }, ex.duracao ? formatarTempo(ex.duracao) : '');
        const teclado = desenharTeclado();

        function resultadoAtual() {
          const minutos = inicio ? Math.max((Date.now() - inicio) / 60000, 1 / 60) : 1;
          const ppm = Math.round((posicao / 5) / minutos);
          const precisao = posicao + erros ? Math.round((posicao / (posicao + erros)) * 100) : 100;
          return { ppm, precisao };
        }

        function atualizar() {
          letras.forEach((l, i) => l.classList.toggle('atual', i === posicao));
          if (letras[posicao]) letras[posicao].scrollIntoView({ block: 'nearest' });
          teclado.querySelectorAll('.tecla').forEach((t) => t.classList.remove('proxima'));
          if (posicao >= letras.length) return;
          const como = comoDigitar(ex.texto[posicao]);
          como.teclas.forEach((t) => teclado.querySelectorAll(`.tecla[data-tecla="${CSS.escape(t)}"]`).forEach((e) => e.classList.add('proxima')));
          if (como.shift) teclado.querySelectorAll('.tecla.shift').forEach((t) => t.classList.add('proxima'));
          dica.textContent = como.dica;
          const r = resultadoAtual();
          placar.replaceChildren(
            CE.el('span', { class: inicio && meta.ppm && r.ppm >= meta.ppm ? 'ok' : '' }, `Velocidade: ${inicio ? r.ppm : 0} ppm${meta.ppm ? ` (meta ${meta.ppm})` : ''}`),
            CE.el('span', { class: !meta.precisao ? '' : r.precisao >= meta.precisao ? 'ok' : 'abaixo' }, `Acertos: ${r.precisao}%${meta.precisao ? ` (meta ${meta.precisao}%)` : ''}`),
            CE.el('span', {}, `Erros: ${erros}`),
          );
        }

        async function terminar() {
          if (terminou) return;
          terminou = true;
          clearInterval(relogio);
          const r = resultadoAtual();
          if (ex.nivelamento) { await aplicarNivelamento(r, errosPorTecla); return; }
          const resultado = { ...r, aprovado: r.ppm >= meta.ppm && r.precisao >= meta.precisao };
          resultado.estrelas = estrelasDe(resultado, meta, ex.tipo);
          await guardarResultado(ex, resultado, errosPorTecla);
          mostrarResultado(ex, resultado, meta, erros);
        }

        // O aluno digita num campo invisível. Lemos o caractere já pronto (e não a tecla apertada), assim os acentos
        // funcionam em qualquer teclado: ´ seguido de e chega como "é".
        const captura = CE.el('textarea', { class: 'dig-captura', 'aria-label': 'Digite aqui', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
        areaTexto.append(captura);
        areaTexto.addEventListener('focus', () => captura.focus());
        areaTexto.addEventListener('mousedown', (e) => { e.preventDefault(); captura.focus(); });
        captura.addEventListener('beforeinput', (e) => {
          if (e.inputType === 'insertText' && e.data) { e.preventDefault(); [...e.data].forEach(processar); }
          else if (e.inputType === 'insertLineBreak' || e.inputType.startsWith('delete') || e.inputType === 'insertFromPaste') e.preventDefault();
        });
        captura.addEventListener('compositionend', (e) => { [...(e.data || '')].forEach(processar); captura.value = ''; });

        function processar(caractere) {
          if (terminou) return;
          if (!inicio) {
            inicio = Date.now();
            if (ex.duracao) {
              relogio = setInterval(() => {
                const resta = ex.duracao - Math.floor((Date.now() - inicio) / 1000);
                cronometro.textContent = formatarTempo(Math.max(0, resta));
                cronometro.classList.toggle('acabando', resta <= 10);
                if (resta <= 0) terminar();
              }, 250);
            }
          }
          const esperado = ex.texto[posicao];
          if (caractere === esperado) {
            letras[posicao].classList.add(errouAgora ? 'corrigida' : 'certa');
            letras[posicao].classList.remove('errada');
            errouAgora = false;
            posicao++;
            if (posicao >= letras.length) { terminar(); return; }
          } else {
            erros++;
            errouAgora = true;
            const chave = esperado.toLowerCase();
            if (chave.trim()) errosPorTecla[chave] = (errosPorTecla[chave] || 0) + 1;
            letras[posicao].classList.add('errada');
            areaTexto.classList.remove('tremer');
            void areaTexto.offsetWidth;
            areaTexto.classList.add('tremer');
          }
          atualizar();
        }

        trocarTela(CE.el('div', { class: 'dig-pratica' },
          CE.el('div', { class: 'dig-cabecalho' },
            CE.el('button', { class: 'botao secundario', onclick: () => mostrarLista(ex.nivel) }, '← Exercícios'),
            CE.el('strong', {}, `${ex.modulo}: ${ex.titulo}`),
            cronometro,
          ),
          ex.prova ? CE.el('p', { class: 'dig-aviso-prova' }, `Prova: digite o máximo que conseguir em ${ex.duracao / 60} minutos. Meta: ${meta.ppm} ppm e ${meta.precisao}% de acertos. O tempo começa na primeira tecla.`) : null,
          areaTexto, dica, placar, teclado,
          CE.el('p', { class: 'dig-rodape' }, ex.dica || 'Clique no texto acima e comece a digitar. Olhe para a tela, não para o teclado.'),
        ));
        encerrarAtual = () => clearInterval(relogio);
        atualizar();
        captura.focus();
        CE.emitir('digitacao:iniciada', { exercicio: ex.id });
      }

      // ---------- Nivelamento ----------

      // Dispensa, em ordem, cada nível cuja meta da prova o aluno bateu no teste.
      async function aplicarNivelamento(r, errosPorTecla) {
        const dispensados = [];
        for (const nivel of CE.DIGITACAO.niveis) {
          const meta = CE.metaDigitacao(nivel.prova, CE.sessao.usuario);
          if (r.ppm >= meta.ppm && r.precisao >= meta.precisao) dispensados.push(nivel); else break;
        }
        await CE.sessao.atualizarProgresso((p) => {
          p.digitacao = p.digitacao || {};
          const d = p.digitacao;
          d._nivelamento = { ppm: r.ppm, precisao: r.precisao, niveis: dispensados.map((n) => n.id), em: Date.now() };
          d._teclas = d._teclas || {};
          Object.entries(errosPorTecla).forEach(([c, n]) => { d._teclas[c] = (d._teclas[c] || 0) + n; });
          dispensados.forEach((nivel) => {
            CE.DIGITACAO.lista.filter((e) => e.nivel === nivel.id).forEach((e) => {
              if (!(d[e.id] && d[e.id].aprovado)) d[e.id] = { ppm: r.ppm, precisao: r.precisao, aprovado: true, estrelas: 1, dispensado: true, em: Date.now() };
            });
          });
        });
        CE.emitir('digitacao:nivelamento', { ppm: r.ppm, precisao: r.precisao, niveis: dispensados.map((n) => n.id) });
        CE.emitir('digitacao:concluida', { exercicio: 'nivelamento-digitacao', ppm: r.ppm, precisao: r.precisao, aprovado: true, nivelamento: true });
        if (dispensados.length) CE.comemorar('grande');
        const proximo = CE.DIGITACAO.niveis[dispensados.length];
        corpo.replaceChildren(CE.el('div', { class: 'dig-resultado' },
          CE.el('h2', {}, '🧭 Resultado do nivelamento'),
          CE.el('p', {}, `Você digitou a ${r.ppm} palavras por minuto, com ${r.precisao}% de acertos.`),
          CE.el('p', { class: 'dig-conselho' }, dispensados.length
            ? `Muito bem! ${dispensados.length > 1
              ? `Os níveis ${dispensados.map((n) => n.nome).join(dispensados.length > 2 ? ', ' : ' e ').replace(/, ([^,]*)$/, ' e $1')} foram dispensados`
              : `O nível ${dispensados[0].nome} foi dispensado`}. ${proximo ? `Você começa no nível ${proximo.nome}.` : 'Você já digita como um profissional!'}`
            : `Você começa no nível Iniciante. Para dispensar um nível, é preciso bater a meta da prova dele (Iniciante: ${CE.metaDigitacao(CE.DIGITACAO.niveis[0].prova, CE.sessao.usuario).ppm} ppm e ${CE.metaDigitacao(CE.DIGITACAO.niveis[0].prova, CE.sessao.usuario).precisao}%).`),
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao', onclick: () => mostrarLista(proximo ? proximo.id : 'avancado') }, 'Ver os exercícios →')),
        ));
      }

      // ---------- Ditado ----------

      function praticarDitado(ex) {
        const meta = CE.metaDigitacao(ex, CE.sessao.usuario);
        let indice = 0;
        const respostas = [];
        const area = CE.el('div', { class: 'dig-ditado' });

        function ouvir() {
          const frase = ex.frases[indice];
          if (CE.voz.disponivel()) {
            CE.voz.falar(frase, { velocidade: 0.85, forcar: true });
          } else {
            // Sem voz instalada no computador: mostra a frase por alguns segundos.
            const mostra = area.querySelector('.dig-ditado-mostra');
            mostra.textContent = frase;
            mostra.hidden = false;
            setTimeout(() => { mostra.hidden = true; }, 4000);
          }
        }

        function desenhar() {
          const campo = CE.el('input', { class: 'campo grande', 'aria-label': 'Digite a frase que você ouviu', autocomplete: 'off', spellcheck: 'false' });
          campo.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' || !campo.value.trim()) return;
            respostas.push(campo.value.trim());
            indice++;
            if (indice < ex.frases.length) desenhar(); else terminar();
          });
          area.replaceChildren(
            CE.el('p', { class: 'dig-ditado-num' }, `Frase ${indice + 1} de ${ex.frases.length}`),
            CE.el('button', { class: 'botao grande', onclick: () => { ouvir(); campo.focus(); } }, '🔊 Ouvir a frase'),
            CE.el('p', { class: 'dig-ditado-mostra', hidden: true }),
            campo,
            CE.el('p', { class: 'dig-rodape' }, 'Escute a frase e digite exatamente o que ouviu, com letras maiúsculas, acentos e pontuação. Aperte Enter para a próxima.'),
          );
          setTimeout(() => { ouvir(); campo.focus(); }, 300);
        }

        async function terminar() {
          let total = 0, certos = 0;
          const comparacao = ex.frases.map((frase, i) => {
            const dist = distancia(frase, respostas[i] || '');
            total += frase.length;
            certos += Math.max(0, frase.length - dist);
            return CE.el('div', { class: 'dig-ditado-linha' + (dist === 0 ? ' certa' : '') },
              CE.el('div', {}, CE.el('small', {}, 'Frase: '), frase),
              CE.el('div', {}, CE.el('small', {}, 'Você digitou: '), respostas[i] || ''));
          });
          const precisao = Math.round((certos / total) * 100);
          const resultado = { ppm: 0, precisao, aprovado: precisao >= meta.precisao };
          resultado.estrelas = estrelasDe(resultado, meta, 'ditado');
          await guardarResultado(ex, resultado);
          mostrarResultado(ex, resultado, meta, null, comparacao);
        }

        trocarTela(CE.el('div', { class: 'dig-pratica' },
          CE.el('div', { class: 'dig-cabecalho' },
            CE.el('button', { class: 'botao secundario', onclick: () => mostrarLista(ex.nivel) }, '← Exercícios'),
            CE.el('strong', {}, ex.titulo),
          ),
          area,
        ));
        desenhar();
      }

      // ---------- Resultado ----------

      async function mostrarResultado(ex, resultado, meta, erros, detalhes) {
        const lista = CE.DIGITACAO.lista;
        const proximo = lista[lista.indexOf(ex) + 1];
        const resultados = (await CE.sessao.progresso()).digitacao || {};
        const podeSeguir = proximo && CE.digitacaoLiberado(proximo, resultados);
        const faltou = [];
        if (ex.tipo !== 'ditado' && resultado.ppm < meta.ppm) faltou.push(`velocidade (você fez ${resultado.ppm} ppm, a meta é ${meta.ppm})`);
        if (resultado.precisao < meta.precisao) faltou.push(`acertos (você fez ${resultado.precisao}%, a meta é ${meta.precisao}%)`);
        if (resultado.aprovado) CE.comemorar && CE.comemorar(ex.prova ? 'grande' : 'pequena');

        corpo.replaceChildren(CE.el('div', { class: 'dig-resultado' },
          CE.el('h2', {}, resultado.aprovado ? (ex.prova ? `Você passou na ${ex.titulo}! 🏆` : 'Meta batida! 🎉') : 'Quase lá! Vamos tentar de novo?'),
          CE.el('div', { class: 'dig-estrelas grande' }, '★'.repeat(resultado.estrelas) + '☆'.repeat(3 - resultado.estrelas)),
          ex.tipo !== 'ditado' ? CE.el('p', { class: resultado.ppm >= meta.ppm ? 'ok' : 'abaixo' }, `Velocidade: ${resultado.ppm} palavras por minuto (meta ${meta.ppm})`) : null,
          CE.el('p', { class: resultado.precisao >= meta.precisao ? 'ok' : 'abaixo' }, `Acertos: ${resultado.precisao}% (meta ${meta.precisao}%)${erros != null ? ` · ${erros} erro${erros === 1 ? '' : 's'}` : ''}`),
          faltou.length ? CE.el('p', { class: 'dig-conselho' }, `Faltou: ${faltou.join(' e ')}. ${resultado.precisao < meta.precisao ? 'Vá mais devagar e com atenção: acertar vem antes de correr.' : 'Você está acertando bem! Agora tente um pouco mais rápido.'}`) : null,
          detalhes ? CE.el('div', { class: 'dig-ditado-comparacao' }, ...detalhes) : null,
          CE.el('div', { class: 'dialogo-botoes' },
            CE.el('button', { class: 'botao secundario', onclick: () => mostrarLista(ex.nivel) }, 'Lista de exercícios'),
            CE.el('button', { class: 'botao' + (resultado.aprovado ? ' secundario' : ''), onclick: () => praticar(ex) }, 'Tentar de novo'),
            podeSeguir ? CE.el('button', { class: 'botao', 'data-acao': 'proximo', onclick: () => praticar(proximo) }, 'Próximo exercício →') : null,
          ),
        ));
      }

      // ---------- Jogos e treinos ----------

      function telaJogos(resultados) {
        const recordes = resultados._jogos || {};
        return CE.el('div', { class: 'dig-jogos' },
          CE.el('button', { class: 'dig-jogo', 'data-jogo': 'chuva', onclick: () => chuvaDePalavras() },
            CE.el('span', { class: 'dig-jogo-icone' }, '🌧️'),
            CE.el('strong', {}, 'Chuva de palavras'),
            CE.el('span', {}, 'Digite as palavras antes que elas caiam no chão!'),
            CE.el('small', {}, `Recorde: ${recordes.chuva || 0} pontos`)),
          CE.el('button', { class: 'dig-jogo', 'data-jogo': 'teclas', onclick: () => treinoTeclasDificeis(resultados) },
            CE.el('span', { class: 'dig-jogo-icone' }, '🎯'),
            CE.el('strong', {}, 'Treino das teclas difíceis'),
            CE.el('span', {}, 'Um exercício feito para você, com as teclas em que você mais erra.')),
          CE.el('div', { class: 'dig-evolucao' }, CE.el('strong', {}, 'Sua evolução'), graficoEvolucao(resultados._historico || [])),
        );
      }

      function graficoEvolucao(historico) {
        const pontos = historico.filter((h) => h.ppm > 0).slice(-30);
        if (pontos.length < 2) return CE.el('p', { class: 'dig-rodape' }, 'Faça alguns exercícios para ver o gráfico da sua velocidade.');
        const L = 520, A = 140, max = Math.max(20, ...pontos.map((p) => p.ppm));
        const x = (i) => 30 + (i * (L - 40)) / (pontos.length - 1);
        const y = (v) => A - 20 - (v / max) * (A - 40);
        const caminho = pontos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.ppm).toFixed(1)}`).join(' ');
        return CE.el('div', {
          class: 'dig-grafico',
          html: `<svg viewBox="0 0 ${L} ${A}" width="100%" role="img" aria-label="Velocidade nos últimos exercícios">
            <line x1="30" y1="${A - 20}" x2="${L - 10}" y2="${A - 20}" class="eixo"/>
            <text x="2" y="${y(max) + 4}" class="rotulo">${max}</text><text x="2" y="${A - 16}" class="rotulo">0</text>
            <path d="${caminho} L${x(pontos.length - 1)} ${A - 20} L30 ${A - 20} Z" class="area"/>
            <path d="${caminho}" class="linha"/>
            <circle cx="${x(pontos.length - 1)}" cy="${y(pontos[pontos.length - 1].ppm)}" r="5" class="ponto"/>
            <text x="${x(pontos.length - 1) - 8}" y="${y(pontos[pontos.length - 1].ppm) - 10}" class="rotulo forte">${pontos[pontos.length - 1].ppm} ppm</text>
          </svg>`,
        });
      }

      function treinoTeclasDificeis(resultados) {
        const teclas = Object.entries(resultados._teclas || {}).filter(([c]) => /\p{L}/u.test(c)).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c]) => c);
        if (!teclas.length) { CE.avisar('Você ainda não errou teclas suficientes. Faça alguns exercícios primeiro!'); return; }
        const palavras = CE.palavrasDigitacao.todas.filter((p) => teclas.some((t) => p.includes(t)));
        const embaralhadas = palavras.sort(() => Math.random() - 0.5).slice(0, 16);
        const texto = teclas.map((t) => `${t}${t}${t}`).join(' ') + ' ' + embaralhadas.join(' ');
        praticar({ id: 'treino-teclas', titulo: `Teclas: ${teclas.join(' ').toUpperCase()}`, modulo: 'Treino', nivel: 'jogos', tipo: 'texto', texto, meta: { ppm: 0, precisao: 0 }, dica: 'Este treino não conta para liberar exercícios. Pratique quantas vezes quiser!' });
      }

      function chuvaDePalavras() {
        const palco = CE.el('div', { class: 'chuva-palco' });
        const campo = CE.el('input', { class: 'campo grande', placeholder: 'Digite a palavra e aperte Espaço', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Digite a palavra' });
        const placar = CE.el('div', { class: 'dig-placar' });
        let pontos = 0, vidas = 3, velocidade = 0.35, ativo = true, ultimoSurgimento = 0, quadro;
        const caindo = [];
        const lista = CE.palavrasDigitacao.comuns.filter((p) => p.length <= 8);

        function atualizarPlacar() { placar.textContent = `Pontos: ${pontos} · Vidas: ${'❤️'.repeat(vidas)}`; }

        function passo(tempo) {
          if (!ativo) return;
          if (tempo - ultimoSurgimento > Math.max(900, 2600 - pontos * 25)) {
            ultimoSurgimento = tempo;
            const palavra = lista[Math.floor(Math.random() * lista.length)];
            const el = CE.el('span', { class: 'chuva-palavra' }, palavra);
            el.style.left = 5 + Math.random() * 75 + '%';
            palco.append(el);
            caindo.push({ palavra, el, y: 0 });
          }
          const altura = palco.clientHeight - 30;
          for (let i = caindo.length - 1; i >= 0; i--) {
            const p = caindo[i];
            p.y += velocidade + pontos * 0.004;
            p.el.style.top = p.y + 'px';
            if (p.y > altura) {
              p.el.remove();
              caindo.splice(i, 1);
              vidas--;
              atualizarPlacar();
              if (vidas <= 0) { fim(); return; }
            }
          }
          quadro = requestAnimationFrame(passo);
        }

        async function fim() {
          ativo = false;
          cancelAnimationFrame(quadro);
          await CE.sessao.atualizarProgresso((p) => {
            p.digitacao = p.digitacao || {};
            p.digitacao._jogos = p.digitacao._jogos || {};
            p.digitacao._jogos.chuva = Math.max(p.digitacao._jogos.chuva || 0, pontos);
          });
          CE.emitir('digitacao:jogo', { jogo: 'chuva', pontos });
          palco.append(CE.el('div', { class: 'chuva-fim' },
            CE.el('h2', {}, 'Fim de jogo!'), CE.el('p', {}, `Você fez ${pontos} pontos.`),
            CE.el('div', { class: 'dialogo-botoes' },
              CE.el('button', { class: 'botao secundario', onclick: () => mostrarLista('jogos') }, 'Voltar'),
              CE.el('button', { class: 'botao', onclick: chuvaDePalavras }, 'Jogar de novo'))));
        }

        campo.addEventListener('keydown', (e) => {
          if (e.key !== ' ' && e.key !== 'Enter') return;
          e.preventDefault();
          const digitada = campo.value.trim();
          campo.value = '';
          const i = caindo.findIndex((p) => p.palavra === digitada);
          if (i >= 0) {
            caindo[i].el.classList.add('acertou');
            const el = caindo[i].el;
            setTimeout(() => el.remove(), 250);
            caindo.splice(i, 1);
            pontos += digitada.length;
            atualizarPlacar();
          }
        });

        trocarTela(CE.el('div', { class: 'dig-pratica' },
          CE.el('div', { class: 'dig-cabecalho' },
            CE.el('button', { class: 'botao secundario', onclick: () => mostrarLista('jogos') }, '← Voltar'),
            CE.el('strong', {}, '🌧️ Chuva de palavras'), placar),
          palco, campo,
        ));
        encerrarAtual = () => { ativo = false; cancelAnimationFrame(quadro); };
        atualizarPlacar();
        campo.focus();
        quadro = requestAnimationFrame(passo);
      }

      // ---------- Teclado na tela ----------

      function desenharTeclado() {
        return CE.el('div', { class: 'teclado' },
          ...FILEIRAS.map((fileira, i) => CE.el('div', { class: 'teclado-fileira f' + i },
            ...fileira.map(([c, d]) => CE.el('span', { class: `tecla dedo${d}${c === 'f' || c === 'j' ? ' relevo' : ''}`, 'data-tecla': c }, c.toUpperCase())))),
          CE.el('div', { class: 'teclado-fileira' },
            CE.el('span', { class: 'tecla shift', 'data-tecla': 'shift' }, 'Shift'),
            CE.el('span', { class: 'tecla espaco dedo5', 'data-tecla': ' ' }, 'Espaço'),
            CE.el('span', { class: 'tecla shift', 'data-tecla': 'shift' }, 'Shift')),
        );
      }

      function formatarTempo(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

      async function abrirExercicio(id) {
        const ex = CE.DIGITACAO.lista.find((e) => e.id === id);
        if (!ex) { mostrarLista(); return; }
        const resultados = (await CE.sessao.progresso()).digitacao || {};
        abaAtual = ex.nivel;
        if (CE.digitacaoLiberado(ex, resultados)) praticar(ex); else mostrarLista(ex.nivel);
      }

      if (argumento && argumento.nivelamento) praticar(CE.DIGITACAO.nivelamento);
      else if (argumento && argumento.exercicio) abrirExercicio(argumento.exercicio);
      else mostrarLista();
      return {
        receber(arg) {
          if (arg && arg.nivelamento) praticar(CE.DIGITACAO.nivelamento);
          else if (arg && arg.exercicio) abrirExercicio(arg.exercicio);
        },
        aoFechar() { encerrarAtual(); return true; },
      };
    },
  });
})();
