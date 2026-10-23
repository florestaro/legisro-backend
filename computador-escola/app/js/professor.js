// Professor Virtual: conduz as lições passo a passo e conversa com o aluno (IA local ou respostas prontas).
window.CE = window.CE || {};

(function () {
  const TEMPO_PARA_DICA = 40000;

  let licao = null;      // lição em andamento
  let indicePasso = 0;
  let pararDeOuvir = null;
  let timerDica = null;
  let timerDestaque = null;
  let pensando = false;
  let posicao = null;    // "aula 5 de 29 do nível Iniciante" (na trilha do aluno), para o cabeçalho
  let emReforco = false; // a aula em andamento é de reforço (opcional) para este aluno

  const $ = (id) => document.getElementById(id);
  const passoAtual = () => (licao ? licao.passos[indicePasso] : null);

  // ---------- Painel ----------

  function montarPainel() {
    const painel = $('professor');
    painel.replaceChildren(
      CE.el('div', { class: 'prof-cabecalho', onclick: () => painel.classList.toggle('recolhido') },
        CE.el('span', { class: 'prof-avatar' }, '🧑‍🏫'),
        CE.el('strong', {}, 'Professor Virtual'),
        CE.el('span', { class: 'prof-recolher', title: 'Esconder/mostrar o professor' }, '▾'),
      ),
      CE.el('div', { class: 'prof-corpo' },
        CE.el('div', { id: 'prof-licao' }),
        CE.el('div', { id: 'prof-conversa', 'aria-live': 'polite' }),
        CE.el('form', { class: 'prof-pergunta', onsubmit: (e) => { e.preventDefault(); enviarPergunta(); } },
          CE.el('input', { id: 'prof-campo', class: 'campo', placeholder: 'Escreva sua dúvida aqui...', autocomplete: 'off', maxlength: '300' }),
          CE.el('button', { class: 'botao', type: 'submit', title: 'Perguntar' }, 'Perguntar'),
        ),
      ),
    );
    painel.hidden = false;
    painel.classList.remove('recolhido');
  }

  function falarNoChat(texto, quem = 'do-professor') {
    const conversa = $('prof-conversa');
    const balao = CE.el('div', { class: 'balao ' + quem }, texto);
    conversa.append(balao);
    while (conversa.children.length > 30) conversa.firstChild.remove();
    conversa.scrollTop = conversa.scrollHeight;
    return balao;
  }

  async function enviarPergunta() {
    const campo = $('prof-campo');
    const pergunta = campo.value.trim();
    if (!pergunta || pensando) return;
    campo.value = '';
    falarNoChat(pergunta, 'do-aluno');
    const balao = falarNoChat('...', 'do-professor pensando');
    pensando = true;
    const app = CE.janelas.ativa();
    const passo = passoAtual();
    let recebido = '';
    try {
      const resposta = await CE.api.perguntarIA(pergunta, {
        app: app ? app.nome : 'nenhum (área de trabalho)',
        licao: licao ? licao.titulo : '',
        passo: passo ? (passo.quiz ? `Responder a pergunta: ${passo.quiz.pergunta}` : passo.texto) : '',
      }, (trecho) => {
        recebido += trecho;
        balao.textContent = recebido;
        balao.classList.remove('pensando');
        $('prof-conversa').scrollTop = $('prof-conversa').scrollHeight;
      });
      balao.textContent = String(resposta).trim();
      balao.classList.remove('pensando');
      CE.voz.falar(balao.textContent);
      CE.emitir('professor:respondeu', { pergunta });
    } catch {
      balao.textContent = 'Desculpe, não consegui responder agora. Tente de novo.';
      balao.classList.remove('pensando');
    } finally {
      pensando = false;
    }
  }

  // ---------- Destaque na tela ----------

  function limparDestaque() {
    clearInterval(timerDestaque);
    document.querySelectorAll('.destaque').forEach((e) => e.classList.remove('destaque'));
    const seta = document.getElementById('seta-guia');
    if (seta) seta.hidden = true;
  }

  // Seta vermelha que pisca apontando para onde o aluno deve clicar.
  function seta() {
    let s = document.getElementById('seta-guia');
    if (!s) {
      s = CE.el('div', {
        id: 'seta-guia', class: 'seta-guia', 'aria-hidden': 'true',
        html: '<svg viewBox="0 0 64 64" width="64" height="64"><path d="M32 60 L6 30 H22 V4 H42 V30 H58 Z" /></svg>',
      });
      document.body.append(s);
    }
    return s;
  }

  // Escolhe o lado: ícones da coluna da esquerda recebem a seta à direita (apontando para a esquerda);
  // o resto recebe a seta em cima (apontando para baixo) ou, sem espaço em cima, embaixo (apontando para cima).
  function posicionarSeta(alvo) {
    const s = seta();
    const r = alvo && alvo.getBoundingClientRect();
    if (!r || (!r.width && !r.height)) { s.hidden = true; return; }
    const TAM = 64, FOLGA = 6;
    let x, y, direcao;
    if (r.width <= 140 && r.left < 160) {
      direcao = 'esquerda'; x = r.right + FOLGA; y = r.top + r.height / 2 - TAM / 2;
    } else if (r.top > TAM + FOLGA + 10) {
      direcao = 'baixo'; x = r.left + Math.min(r.width / 2, 120) - TAM / 2; y = r.top - TAM - FOLGA;
    } else {
      direcao = 'cima'; x = r.left + Math.min(r.width / 2, 120) - TAM / 2; y = r.bottom + FOLGA;
    }
    s.style.left = Math.max(0, Math.min(x, innerWidth - TAM)) + 'px';
    s.style.top = Math.max(0, Math.min(y, innerHeight - TAM)) + 'px';
    s.dataset.direcao = direcao;
    s.hidden = false;
  }

  function destacar(seletor) {
    limparDestaque();
    if (!seletor) return;
    // O elemento pode aparecer depois (ex.: botão dentro de uma janela que ainda vai abrir)
    // ou mudar de lugar (janela arrastada), então a seta é reposicionada a todo momento.
    // "seletor" também pode ser uma lista em ordem de preferência: vale o primeiro que estiver visível na tela
    // (ex.: primeiro o item do menu, se o menu já abriu; senão, o botão que abre o menu).
    const opcoes = [].concat(seletor);
    // Na lista, prefere o que está na tela e não está escondido atrás de uma janela.
    const descoberto = (e) => {
      const r = e.getBoundingClientRect();
      const topo = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!topo && (topo === e || e.contains(topo));
    };
    const aplicar = () => {
      const visiveis = (s) => [...document.querySelectorAll(s)].filter((e) => e.getClientRects().length);
      const escolhido = (opcoes.length > 1 && opcoes.find((s) => visiveis(s).some(descoberto))) || opcoes.find((s) => visiveis(s).length) || opcoes[opcoes.length - 1];
      document.querySelectorAll('.destaque').forEach((e) => { if (!e.matches(escolhido)) e.classList.remove('destaque'); });
      const alvos = [...document.querySelectorAll(escolhido)];
      alvos.forEach((e) => e.classList.add('destaque'));
      posicionarSeta(alvos.find((e) => e.getClientRects().length));
    };
    aplicar();
    timerDestaque = setInterval(aplicar, 150);
  }

  // ---------- Lições ----------

  // Pontos das perguntas: acertar de primeira vale 1, na segunda tentativa vale 0,5 (na prova, só de primeira).
  let quizPontos = 0;
  let quizTotal = 0;
  let pulados = 0;       // tarefas puladas com "Não sei fazer" (só no teste de nivelamento)
  let errosNestaPergunta = 0;

  function cabecalhoDoCartao(passo) {
    return [
      CE.el('div', { class: 'prof-titulo' }, `${licao.icone} ${licao.titulo}`,
        licao.desafio ? CE.el('span', { class: 'prof-selo desafio' }, 'Desafio: sem ajuda') : null,
        licao.prova ? CE.el('span', { class: 'prof-selo prova' }, 'Prova') : null,
        emReforco ? CE.el('span', { class: 'prof-selo reforco' }, 'Reforço (opcional)') : null),
      posicao ? CE.el('div', { class: 'prof-trilha', 'data-posicao-trilha': `${posicao.numero}/${posicao.total}` },
        `${posicao.nivel.icone} Aula ${posicao.numero} de ${posicao.total} do nível ${posicao.nivel.nome}`) : null,
      CE.el('div', { class: 'prof-progresso' },
        CE.el('div', { class: 'prof-progresso-cheio', style: `width:${Math.round((indicePasso / licao.passos.length) * 100)}%` })),
      CE.el('div', { class: 'prof-passo-num' }, `Passo ${indicePasso + 1} de ${licao.passos.length}`),
      passo.emoji ? CE.el('div', { class: 'prof-emoji', 'aria-hidden': 'true' }, passo.emoji) : null,
    ];
  }

  function botoesFixos(passo, ...extras) {
    return CE.el('div', { class: 'prof-botoes' },
      CE.el('button', { class: 'botao secundario pequeno nao-entendi', 'data-acao': 'nao-entendi', title: 'Peça ajuda: o professor explica de novo e o instrutor fica sabendo', onclick: naoEntendi }, '🙋 Não entendi'),
      CE.el('button', { class: 'botao secundario pequeno', title: 'Ouvir de novo', onclick: () => CE.voz.falar(textoFalado(passo)) }, '🔊 Repetir'),
      CE.el('button', { class: 'botao secundario pequeno', onclick: sairDaLicao }, 'Sair da aula'),
      ...extras,
    );
  }

  function textoFalado(passo) {
    if (!passo.quiz) return passo.texto;
    return `${passo.quiz.pergunta} ${passo.quiz.opcoes.map((o, i) => `Opção ${i + 1}: ${o}.`).join(' ')}`;
  }

  function desenharLicao() {
    const area = $('prof-licao');
    const passo = passoAtual();
    if (!licao || !passo) { area.replaceChildren(); return; }
    if (passo.quiz) { desenharPergunta(passo); return; }
    const mostrarMouse = passo.mouse && !licao.desafio;
    area.replaceChildren(CE.el('div', { class: 'prof-cartao' },
      ...cabecalhoDoCartao(passo),
      mostrarMouse
        ? CE.el('div', { class: 'prof-com-mouse' }, CE.figuraMouse(passo.mouse), CE.el('p', { class: 'prof-texto' }, passo.texto))
        : CE.el('p', { class: 'prof-texto' }, passo.texto),
      CE.el('p', { class: 'prof-dica', hidden: true }),
      botoesFixos(passo,
        passo.espera && licao.permitePular ? CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'pular', onclick: () => { pulados++; avancar(); } }, 'Não sei fazer ⏭') : null,
        passo.espera ? null : CE.el('button', { class: 'botao', 'data-acao': 'continuar', onclick: avancar }, 'Continuar ▶')),
    ));
  }

  // Pergunta de múltipla escolha.
  function desenharPergunta(passo) {
    const { pergunta, opcoes, correta, explicacao } = passo.quiz;
    errosNestaPergunta = 0;
    const retorno = CE.el('p', { class: 'prof-retorno', hidden: true });
    const continuar = CE.el('button', { class: 'botao', 'data-acao': 'continuar', hidden: true, onclick: avancar }, 'Continuar ▶');
    const botoes = opcoes.map((texto, i) => CE.el('button', {
      class: 'prof-opcao', 'data-opcao': i,
      onclick: (e) => {
        if (!continuar.hidden) return;
        if (i === correta) {
          e.currentTarget.classList.add('certa');
          quizPontos += errosNestaPergunta === 0 ? 1 : errosNestaPergunta === 1 && !licao.prova ? 0.5 : 0;
          retorno.textContent = '✅ Isso mesmo! ' + (explicacao || '');
          retorno.className = 'prof-retorno certo';
          continuar.hidden = false;
          CE.voz.falar('Isso mesmo! ' + (explicacao || ''));
          CE.emitir('quiz:respondido', { certo: true, primeira: errosNestaPergunta === 0 });
        } else {
          errosNestaPergunta++;
          e.currentTarget.classList.add('errada');
          e.currentTarget.disabled = true;
          retorno.textContent = '❌ Ainda não. Leia de novo e tente outra opção.';
          retorno.className = 'prof-retorno errado';
          CE.voz.falar('Ainda não. Tente outra opção.');
          if (!licao.especial) CE.dificuldades.registrar(licao.id, indicePasso, 'erro');
          CE.emitir('quiz:respondido', { certo: false });
        }
        retorno.hidden = false;
      },
    }, CE.el('span', { class: 'prof-opcao-letra' }, 'ABCDE'[i]), texto));
    $('prof-licao').replaceChildren(CE.el('div', { class: 'prof-cartao' },
      ...cabecalhoDoCartao(passo),
      CE.el('p', { class: 'prof-texto' }, '❓ ' + pergunta),
      CE.el('div', { class: 'prof-opcoes' }, ...botoes),
      retorno,
      CE.el('p', { class: 'prof-dica', hidden: true }),
      botoesFixos(passo, continuar),
    ));
  }

  function mostrarDica() {
    const passo = passoAtual();
    if (!passo || licao.desafio) return;
    const texto = passo.dica || 'Tem alguma dúvida? Escreva ali embaixo que eu te ajudo!';
    const elemento = document.querySelector('#prof-licao .prof-dica');
    if (!elemento) return;
    elemento.textContent = '💡 ' + texto;
    elemento.hidden = false;
    CE.voz.falar(texto);
    if (!licao.especial) CE.dificuldades.registrar(licao.id, indicePasso, 'dica');
  }

  // "🙋 Não entendi": o professor explica de novo, mais devagar, com a dica e a seta; o pedido fica guardado
  // (para o instrutor ver onde a turma trava) e aparece na Sala ao vivo.
  function naoEntendi() {
    const passo = passoAtual();
    if (!licao || !passo) return;
    if (!licao.especial) CE.dificuldades.registrar(licao.id, indicePasso, 'naoEntendi');
    CE.emitir('licao:nao-entendi', { licao: licao.id, passo: indicePasso + 1 });
    if (CE.sala) CE.sala.pedirAjuda();
    const elemento = document.querySelector('#prof-licao .prof-dica');
    if (licao.desafio || licao.prova) {
      const texto = licao.prova
        ? 'Na prova o Professor Virtual não pode ajudar. Leia com calma; se precisar, levante a mão: o instrutor já foi avisado.'
        : 'Este é um desafio para fazer sozinho, mas o instrutor já foi avisado e pode te ajudar.';
      if (elemento) { elemento.textContent = '🙋 ' + texto; elemento.hidden = false; }
      CE.voz.falar(texto, { velocidade: 1.1 });
      return;
    }
    const ajuda = passo.dica || (passo.quiz
      ? 'Leia a pergunta e todas as respostas com calma. Pense no que você viu nesta aula.'
      : passo.espera
        ? 'Faça o que está escrito acima, um pedacinho de cada vez. A seta vermelha piscando mostra onde clicar.'
        : 'Leia o texto com calma. Quando terminar, clique em Continuar.');
    clearTimeout(timerDica); // a dica já apareceu: o relógio da dica não conta outra vez
    if (elemento) { elemento.textContent = `💡 ${ajuda} Se ainda não der, o instrutor já foi avisado 🙋.`; elemento.hidden = false; }
    CE.voz.falar(`${textoFalado(passo)} ${ajuda}`, { velocidade: 1.1 });
    if (passo.destacar) destacar(passo.destacar);
  }

  async function iniciarPasso() {
    if (pararDeOuvir) { pararDeOuvir(); pararDeOuvir = null; }
    clearTimeout(timerDica);
    const passo = passoAtual();
    if (CE.sala) CE.sala.ajudaResolvida(); // passo novo: o pedido de ajuda do passo anterior sai da Sala ao vivo
    if (!passo) { concluirLicao(); return; }
    // Tira o foco do botão "Continuar", para as teclas apertadas a seguir não "clicarem" nele de novo.
    if (document.activeElement && $('professor').contains(document.activeElement)) document.activeElement.blur();
    if (passo.preparar) await passo.preparar();
    if (passo.jaFeito && passo.jaFeito()) { avancar('evento'); return; }
    if (passo.quiz) quizTotal++;
    desenharLicao();
    // No desafio o aluno faz sozinho: sem seta e sem destaque.
    destacar(licao.desafio ? null : passo.destacar);
    CE.voz.falar(textoFalado(passo));
    if (passo.espera) {
      const estaLicao = licao, esteIndice = indicePasso;
      const eventos = [].concat(passo.espera);
      let cumprido = false;
      // "quando" é a hora em que o aluno fez a ação (no caso das ações guardadas, é a hora delas, não a de agora:
      // assim uma segunda ação rápida, feita logo depois, ainda vale para o passo seguinte).
      const cumprir = (dados, evento, quando = performance.now()) => {
        if (cumprido || (passo.se && !passo.se(dados, evento))) return;
        cumprido = true;
        desde = quando;
        if (pararDeOuvir) { pararDeOuvir(); pararDeOuvir = null; }
        if (passo.aoCumprir) passo.aoCumprir(dados, evento);
        // Um pequeno intervalo deixa o aluno ver o resultado do que fez antes do próximo passo.
        setTimeout(() => { if (licao === estaLicao && indicePasso === esteIndice) avancar('evento'); }, 600);
      };
      // "espera" pode ser um evento ou uma lista de eventos (vale o primeiro que acontecer).
      const desligar = eventos.map((evento) => CE.ouvir(evento, (dados) => cumprir(dados, evento)));
      pararDeOuvir = () => desligar.forEach((f) => f());
      // O aluno pode ter feito a tarefa antes de o passo aparecer (durante a troca de passo): vale também.
      recentes.filter((r) => r.t > desde && eventos.includes(r.nome)).forEach((r) => cumprir(r.dados, r.nome, r.t));
      timerDica = setTimeout(mostrarDica, TEMPO_PARA_DICA);
    }
  }

  // Ações recentes do aluno (para não perder uma tarefa feita no meio da troca de passo).
  const recentes = [];
  let desde = 0;
  CE.ouvir('*', (dados, nome) => {
    const agora = performance.now();
    recentes.push({ nome, dados, t: agora });
    while (recentes.length && (recentes.length > 40 || agora - recentes[0].t > 5000)) recentes.shift();
  });

  // origem 'evento': o passo anterior foi cumprido por uma ação (vale o que veio depois dela).
  // Sem origem: o aluno clicou em "Continuar" ou respondeu (vale só o que vier a partir de agora).
  function avancar(origem) {
    if (!licao) return;
    if (origem !== 'evento') desde = performance.now();
    indicePasso++;
    iniciarPasso();
  }

  async function concluirLicao() {
    const terminada = licao;
    const nota = quizTotal ? Math.round((quizPontos / quizTotal) * 100) : null;
    const aprovada = nota == null || nota >= CE.curso.NOTA_MINIMA;
    encerrar();
    if (terminada.especial) { await concluirEspecial(terminada, nota); return; }
    const salvou = await gravarComNovaTentativa(terminada, () => CE.sessao.atualizarProgresso((p) => {
      p.licoes = p.licoes || {};
      const antes = p.licoes[terminada.id] || { vezes: 0 };
      const jaAprovada = antes.concluida;
      p.licoes[terminada.id] = {
        concluida: jaAprovada || aprovada,
        nota: jaAprovada && antes.nota != null && (nota == null || antes.nota > nota) ? antes.nota : nota,
        vezes: antes.vezes + 1,
        em: Date.now(),
        // Data da primeira aprovação (a do certificado): refazer a aula depois não muda.
        aprovadaEm: antes.aprovadaEm || (jaAprovada ? antes.em : aprovada ? Date.now() : undefined),
      };
    }));
    if (!salvou || licao) return; // o aluno começou outra aula nesse meio-tempo
    if (!aprovada) {
      const texto = `Sua nota foi ${nota}%. Para passar, precisa de pelo menos ${CE.curso.NOTA_MINIMA}%. Vamos refazer a aula com calma? Você consegue!`;
      $('prof-licao').replaceChildren(CE.el('div', { class: 'prof-cartao reprovada' },
        CE.el('div', { class: 'prof-titulo' }, `${terminada.icone} ${terminada.titulo}`),
        CE.el('div', { class: 'prof-nota baixa' }, `${nota}%`),
        CE.el('p', { class: 'prof-texto' }, texto),
        CE.el('div', { class: 'prof-botoes' },
          CE.el('button', { class: 'botao', 'data-acao': 'refazer', onclick: () => comecarLicao(terminada.id) }, 'Refazer a aula ↻'),
          CE.el('button', { class: 'botao secundario pequeno', onclick: () => CE.janelas.abrir('aulas') }, 'Ver todas as aulas'),
        ),
      ));
      CE.voz.falar(texto);
      CE.emitir('licao:reprovada', { licao: terminada.id, nota });
      return;
    }
    CE.emitir('licao:concluida', { licao: terminada.id, nota });
    CE.comemorar(terminada.prova ? 'grande' : 'pequena');
    const progresso = await CE.sessao.progresso().catch(() => null);
    if (licao) return;
    const proxima = progresso && CE.curso.proxima(progresso);
    const reforco = progresso && CE.LICOES.includes(terminada) && CE.curso.reforcoPendente(progresso, terminada);
    // Terminou o nível quando todas as aulas do nível (na trilha do aluno) estão aprovadas e a próxima é de outro nível.
    const mudouDeNivel = proxima && CE.LICOES.includes(terminada) && proxima.nivel !== terminada.nivel
      && CE.curso.aulasDaTrilha(progresso, { nivel: terminada.nivel }).every((l) => CE.curso.aprovada(l, progresso));
    // O professor conduz: diz qual é a próxima aula e onde clicar (o botão verde pisca de leve).
    const conducao = !proxima
      ? 'Você terminou todas as aulas do curso. Parabéns! Peça ao instrutor o seu certificado.'
      : mudouDeNivel
        ? `Você terminou o nível ${CE.NIVEIS_CURSO.find((n) => n.id === terminada.nivel).nome}! Peça ao instrutor o seu certificado. Quando quiser, clique no botão verde para começar o próximo nível.`
        : 'Quando estiver pronto, clique no botão verde "Próxima aula".';
    $('prof-licao').replaceChildren(CE.el('div', { class: 'prof-cartao concluida' },
      CE.el('div', { class: 'prof-titulo' }, terminada.prova ? '🏆 Prova aprovada!' : '🎉 Aula concluída!'),
      nota != null ? CE.el('div', { class: 'prof-nota' }, `${nota}%`) : null,
      CE.el('p', { class: 'prof-texto' }, terminada.conclusao),
      CE.el('p', { class: 'prof-texto prof-conducao', 'data-conducao': '' }, conducao),
      proxima ? CE.el('div', { class: 'prof-proxima', 'data-proxima': proxima.id },
        CE.el('small', {}, 'Próxima aula'),
        CE.el('strong', {}, `${proxima.icone} ${proxima.titulo}`),
        proxima.descricao ? CE.el('span', {}, proxima.descricao) : null) : null,
      CE.el('div', { class: 'prof-botoes' },
        reforco ? CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'reforco', title: 'Aula a mais, para treinar (não é obrigatória)', onclick: () => comecarLicao(reforco.id) }, `💪 Treinar mais: ${reforco.titulo}`) : null,
        CE.el('button', { class: 'botao secundario pequeno', onclick: () => CE.janelas.abrir('aulas') }, 'Ver todas as aulas'),
        proxima ? CE.el('button', { class: 'botao conduzir', 'data-acao': 'proxima', onclick: () => comecarLicao(proxima.id) }, 'Próxima aula ▶') : null,
      ),
    ));
    CE.voz.falar(`${terminada.conclusao} ${conducao}`);
  }

  // Grava o resultado da aula. Se falhar (sem conexão com o instrutor, por exemplo), a aula não se perde: aparece
  // "Tentar de novo" até conseguir. Devolve false se o aluno começou outra aula nesse meio-tempo.
  async function gravarComNovaTentativa(terminada, gravar) {
    const dono = CE.sessao.usuario && CE.sessao.usuario.id;
    const outroAluno = () => !CE.sessao.usuario || CE.sessao.usuario.id !== dono;
    for (;;) {
      try {
        await gravar();
        return !outroAluno();
      } catch (erro) {
        if (outroAluno()) return false; // quem fez a aula já saiu: nada aparece (nem grava) para o próximo aluno
        if (licao) { CE.avisar(`⚠️ Não consegui salvar a aula "${terminada.titulo}": ${erro.message}`); return false; }
        await new Promise((tentar) => {
          const botao = CE.el('button', { class: 'botao', 'data-acao': 'tentar-salvar-aula', onclick: () => { botao.disabled = true; botao.textContent = 'Salvando…'; tentar(); } }, 'Tentar de novo');
          $('prof-licao').replaceChildren(CE.el('div', { class: 'prof-cartao reprovada' },
            CE.el('div', { class: 'prof-titulo' }, `${terminada.icone} ${terminada.titulo}`),
            CE.el('p', { class: 'prof-texto' }, `Você terminou a aula, mas não consegui salvar: ${erro.message}`),
            CE.el('div', { class: 'prof-botoes' }, botao)));
        });
        if (licao || outroAluno()) return false;
      }
    }
  }

  // Lições especiais (como o teste de nivelamento) decidem sozinhas o que fazer com o resultado.
  async function concluirEspecial(terminada, nota) {
    let r = null;
    const salvou = await gravarComNovaTentativa(terminada, async () => { r = await terminada.aoConcluir({ nota: nota || 0, pulados }); });
    if (!salvou || licao) return;
    if (r.comemorar) CE.comemorar('grande');
    const proxima = await proximaLicao().catch(() => null);
    if (licao) return;
    $('prof-licao').replaceChildren(CE.el('div', { class: 'prof-cartao concluida' },
      CE.el('div', { class: 'prof-titulo' }, r.titulo),
      CE.el('p', { class: 'prof-texto' }, r.texto),
      CE.el('div', { class: 'prof-botoes' },
        r.digitacao ? CE.el('button', { class: 'botao', 'data-acao': 'nivelamento-digitacao', onclick: () => CE.janelas.abrir('digitacao', { nivelamento: true }) }, 'Nivelamento de digitação ⌨️') : null,
        r.rever ? CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'rever', onclick: () => comecarLicao(r.rever.id) }, `↻ Rever: ${r.rever.titulo}`) : null,
        CE.el('button', { class: 'botao secundario pequeno', onclick: () => CE.janelas.abrir('aulas') }, 'Ver todas as aulas'),
        proxima && !r.digitacao ? CE.el('button', { class: r.botaoProxima ? 'botao conduzir' : 'botao', 'data-acao': 'proxima', onclick: () => comecarLicao(proxima.id) }, r.botaoProxima || `Começar: ${proxima.titulo} ▶`) : null,
      ),
    ));
    CE.voz.falar(r.texto);
  }

  function encerrar() {
    if (pararDeOuvir) { pararDeOuvir(); pararDeOuvir = null; }
    clearTimeout(timerDica);
    limparDestaque();
    licao = null;
    indicePasso = 0;
  }

  async function sairDaLicao() {
    if (licao && !licao.especial && passoAtual()) CE.dificuldades.registrar(licao.id, indicePasso, 'desistiu');
    encerrar();
    CE.voz.parar();
    await boasVindas(false);
  }

  async function proximaLicao() {
    return CE.curso.proxima(await CE.sessao.progresso());
  }

  async function comecarLicao(id, opcoes = {}) {
    const encontrada = CE.curso.licao(id);
    if (!encontrada) return;
    const instrutor = CE.sessao.usuario && CE.sessao.usuario.papel === 'instrutor';
    await CE.curso.trilhaPronta();
    const progresso = await CE.sessao.progresso();
    if (!CE.curso.liberada(encontrada, progresso)) {
      const anterior = CE.curso.anteriorNaTrilha(encontrada, progresso);
      CE.avisar(`🔒 Esta aula ainda está bloqueada. Termine primeiro a aula "${anterior ? anterior.titulo : 'anterior'}".`);
      return;
    }
    encerrar();
    const doCurso = CE.LICOES.includes(encontrada);
    emReforco = doCurso && !CE.curso.obrigatoria(encontrada, progresso);
    posicao = doCurso && !emReforco ? CE.curso.posicao(encontrada, progresso) : null;
    licao = encontrada;
    indicePasso = instrutor && opcoes.passo > 0 ? Math.min(opcoes.passo, encontrada.passos.length - 1) : 0;
    quizPontos = 0;
    quizTotal = 0;
    pulados = 0;
    desde = performance.now();
    $('professor').classList.remove('recolhido');
    CE.emitir('licao:iniciada', { licao: id });
    iniciarPasso();
  }

  async function boasVindas(falar = true) {
    const u = CE.sessao.usuario;
    const primeiroNome = u.nome.split(' ')[0];
    await CE.curso.trilhaPronta();
    const progresso = await CE.sessao.progresso();
    const proxima = CE.curso.proxima(progresso);
    const novato = u.papel !== 'instrutor' && !progresso.nivelamento && !Object.keys(progresso.licoes || {}).length;
    if (novato) {
      const texto = `Olá, ${primeiroNome}! Seja bem-vindo ao curso. É a sua primeira vez aqui? Se você já sabe usar o computador, faça o teste de nivelamento: se for bem, pula as aulas do começo. Se está começando agora, é só começar a primeira aula!`;
      // A aula começa na hora; a escolha é gravada em seguida (pela rede, no modo sala de aula, pode demorar um pouco).
      const pularNivelamento = () => {
        comecarLicao(proxima.id);
        CE.sessao.atualizarProgresso((p) => { p.nivelamento = { em: Date.now(), resultado: 'pulado' }; }).catch((e) => CE.avisar(e.message));
      };
      $('prof-licao').replaceChildren(CE.el('div', { class: 'prof-cartao' },
        CE.el('div', { class: 'prof-emoji', 'aria-hidden': 'true' }, '👋'),
        CE.el('p', { class: 'prof-texto' }, texto),
        CE.el('div', { class: 'prof-botoes' },
          CE.el('button', { class: 'botao secundario', 'data-acao': 'fazer-nivelamento', onclick: () => comecarLicao('nivelamento') }, 'Já sei usar: fazer o teste 🧭'),
          CE.el('button', { class: 'botao', 'data-acao': 'comecar', onclick: pularNivelamento }, 'Estou começando: 1ª aula ▶'),
        ),
      ));
      if (falar) CE.voz.falar(texto);
      return;
    }
    // Com aula uma vez por semana, ajuda lembrar o que foi feito da última vez.
    const r = (l) => (progresso.licoes && progresso.licoes[l.id]) || {};
    const ultima = CE.LICOES.filter((l) => CE.curso.aprovada(l, progresso) && !r(l).dispensada).sort((a, b) => (r(b).em || 0) - (r(a).em || 0))[0];
    const pos = proxima && CE.curso.posicao(proxima, progresso);
    // No primeiro login do dia, antes da aula: revisão rápida das últimas aulas.
    if (CE.revisao.deveOferecer(progresso) && CE.revisao.montar(progresso)) {
      const texto = `Olá, ${primeiroNome}! Que bom te ver.${ultima ? ` Da última vez você fez a aula "${ultima.titulo}".` : ''} Antes da aula de hoje, vamos fazer uma revisão rápida: são só ${CE.LICOES_ESPECIAIS.revisao.passos.length - 1} perguntas, uns 2 minutos. Clique no botão verde.`;
      $('prof-licao').replaceChildren(CE.el('div', { class: 'prof-cartao' },
        CE.el('p', { class: 'prof-texto' }, texto),
        CE.el('div', { class: 'prof-botoes' },
          CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'pular-revisao', title: 'Ir direto para a aula de hoje', onclick: async () => {
            await CE.revisao.pular().catch((e) => CE.avisar(e.message));
            boasVindas();
          } }, 'Pular a revisão'),
          CE.el('button', { class: 'botao conduzir', 'data-acao': 'revisao', onclick: () => comecarLicao('revisao') }, '🔁 Fazer a revisão ▶'),
        ),
      ));
      if (falar) CE.voz.falar(texto);
      return;
    }
    const texto = proxima
      ? `Olá, ${primeiroNome}! Que bom te ver.${ultima ? ` Da última vez você fez a aula "${ultima.titulo}".` : ''} Hoje a sua aula é "${proxima.titulo}". Clique no botão verde "Começar aula" que eu te ensino passo a passo.`
      : `Olá, ${primeiroNome}! Você já fez todas as aulas do curso. Que tal treinar no programa Digitação?`;
    $('prof-licao').replaceChildren(CE.el('div', { class: 'prof-cartao' },
      CE.el('p', { class: 'prof-texto' }, texto),
      proxima ? CE.el('div', { class: 'prof-proxima', 'data-proxima': proxima.id },
        CE.el('small', {}, pos ? `${pos.nivel.icone} Aula ${pos.numero} de ${pos.total} do nível ${pos.nivel.nome}` : 'Aula de hoje'),
        CE.el('strong', {}, `${proxima.icone} ${proxima.titulo}`),
        proxima.descricao ? CE.el('span', {}, proxima.descricao) : null) : null,
      CE.el('div', { class: 'prof-botoes' },
        CE.el('button', { class: 'botao secundario pequeno', onclick: () => CE.janelas.abrir('aulas') }, 'Ver todas as aulas'),
        proxima ? CE.el('button', { class: 'botao conduzir', 'data-acao': 'comecar', onclick: () => comecarLicao(proxima.id) }, 'Começar aula ▶') : null,
      ),
    ));
    if (falar) CE.voz.falar(texto);
  }

  CE.professor = {
    iniciar() {
      CE.curso.carregarTrilha();
      montarPainel();
      boasVindas();
    },
    parar() {
      encerrar();
      CE.voz.parar();
      $('professor').hidden = true;
    },
    comecarLicao,
    // Para o painel da sala ao vivo: em que aula e passo o aluno está.
    situacao: () => (licao ? { id: licao.id, titulo: licao.titulo, passo: `${Math.min(indicePasso + 1, licao.passos.length)} de ${licao.passos.length}` } : null),
  };
})();
