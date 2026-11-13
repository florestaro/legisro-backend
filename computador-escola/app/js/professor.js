// Professor Virtual: conduz as lições passo a passo e conversa com o aluno (IA local ou respostas prontas).
window.CE = window.CE || {};

(function () {
  // Escada de ajuda numa tarefa (não vale para desafios e provas): clicou fora do lugar certo → "Quase!" na hora;
  // parado 10 s → dica específica; 22 s (ou "Não entendi") → "Mostrar como" (a setinha fantasma faz o movimento);
  // 45 s (ou o 2º "Não entendi") → avisa o instrutor e oferece "Pular esta tarefa".
  const TEMPO_PARA_DICA = 10000;
  const TEMPO_MOSTRAR_COMO = 22000;
  const TEMPO_TRAVADO = 45000;
  let timerMostrar = null;
  let timerTravado = null;
  let ajuda = { erros: 0, pedidos: 0, ultimoAviso: 0 };
  // Modo desafio (aluno 🚀, veja ritmo.js): pula a introdução, ajuda só quando o aluno pedir, meta de 85% de primeira.
  let modoDesafio = false;
  let inicioLicao = 0, ajudasNaAula = 0, certasDePrimeira = 0;
  const primeiraAcao = (l) => { const i = l.passos.findIndex((s) => s.espera || s.quiz); return i < 0 ? l.passos.length : i; };
  const textosDaIntroducao = (l) => l.passos.slice(0, primeiraAcao(l)).filter((s) => s.texto && !s.espera && !s.quiz).map((s) => s.texto);

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
        CE.el('span', { class: 'prof-avatar' }, '👨‍🏫'),
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

  const DUVIDA_DA_TAREFA = /n[aã]o entend|como (eu )?fa[cç]o|o que (eu )?fa[cç]o|n[aã]o sei|n[aã]o consig|n[aã]o acho|onde (eu )?clic|onde fica|onde est[aá]|travei|socorro|me ajud|^ajuda/i;

  async function enviarPergunta() {
    const campo = $('prof-campo');
    const pergunta = campo.value.trim();
    if (!pergunta || pensando) return;
    campo.value = '';
    falarNoChat(pergunta, 'do-aluno');
    // Dúvida sobre a tarefa de agora ("não entendi", "como faço?", "onde clico?"): responde com a dica desta
    // tarefa e mostra o movimento, em vez de uma resposta geral.
    const tarefa = passoAtual();
    if (licao && tarefa && tarefa.espera && !licao.desafio && DUVIDA_DA_TAREFA.test(pergunta) && !(CE.temRespostaPronta && CE.temRespostaPronta(pergunta))) {
      const resposta = `Na tarefa de agora: ${dicaDoPasso(tarefa)}`;
      falarNoChat(resposta);
      CE.voz.falar(resposta);
      setTimeout(() => mostrarComo(), 800);
      CE.emitir('professor:respondeu', { pergunta, daTarefa: true });
      return;
    }
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
        emReforco ? CE.el('span', { class: 'prof-selo reforco' }, 'Reforço (opcional)') : null,
        modoDesafio ? CE.el('span', { class: 'prof-selo desafio-auto', 'data-modo-desafio': '', title: 'Você está indo muito bem: menos ajuda e perguntas mais exigentes' }, '🚀 Desafio') : null),
      posicao ? CE.el('div', { class: 'prof-trilha', 'data-posicao-trilha': `${posicao.numero}/${posicao.total}` },
        `${posicao.nivel.icone} Aula ${posicao.numero} de ${posicao.total} do ${CE.curso.rotulo(posicao.nivel.id)}`) : null,
      CE.el('div', { class: 'prof-progresso' },
        CE.el('div', { class: 'prof-progresso-cheio', style: `width:${Math.round((indicePasso / licao.passos.length) * 100)}%` })),
      CE.el('div', { class: 'prof-passo-num' }, `Passo ${indicePasso + 1} de ${licao.passos.length}`),
      passo.emoji ? CE.el('div', { class: 'prof-emoji', 'aria-hidden': 'true' }, passo.emoji) : null,
    ];
  }

  function botoesFixos(passo, ...extras) {
    return CE.el('div', { class: 'prof-botoes' },
      CE.el('button', { class: 'botao secundario pequeno nao-entendi', 'data-acao': 'nao-entendi', title: 'Peça ajuda: o professor explica de novo e o instrutor fica sabendo', onclick: naoEntendi }, '🙋 Não entendi'),
      passo.espera && !licao.desafio ? CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'mostrar-como', title: 'A setinha do professor mostra onde e como fazer', onclick: () => mostrarComo() }, '👀 Mostrar como') : null,
      modoDesafio && textosDaIntroducao(licao).length ? CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'ver-explicacao', title: 'Ver a explicação do começo da aula', onclick: () => {
        escreverNaDica(`📖 ${textosDaIntroducao(licao).join(' ')}`);
        ajudasNaAula++;
      } }, '📖 Explicação') : null,
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
          quizPontos += errosNestaPergunta === 0 ? 1 : errosNestaPergunta === 1 && !licao.prova && !modoDesafio ? 0.5 : 0;
          if (errosNestaPergunta === 0) certasDePrimeira++;
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
    const texto = dicaDoPasso(passo);
    if (!escreverNaDica('💡 ' + texto)) return;
    ajudasNaAula++;
    CE.voz.falar(texto);
    CE.emitir('professor:dica', { licao: licao.id, passo: indicePasso + 1 });
    if (!licao.especial) CE.dificuldades.registrar(licao.id, indicePasso, 'dica');
  }

  // Escreve no quadro amarelo do cartão da tarefa (texto e, se tiver, um botão). Devolve false se não há quadro.
  function escreverNaDica(texto, ...extras) {
    const elemento = document.querySelector('#prof-licao .prof-dica');
    if (!elemento) return false;
    elemento.replaceChildren(texto, ...extras.filter(Boolean));
    elemento.hidden = false;
    return true;
  }

  function limparAjuda() {
    clearTimeout(timerDica); clearTimeout(timerMostrar); clearTimeout(timerTravado);
    document.querySelectorAll('.fantasma-mouse').forEach((e) => e.remove());
  }

  // ---------- Dica de cada tarefa ----------
  // A dica escrita na aula vem primeiro. Sem ela, o professor monta uma dica pela tarefa: atalho de teclado, tipo de
  // clique, escrever numa caixa, o nome do botão que está piscando e o programa que precisa estar aberto.
  const appDoPasso = (passo) => {
    const m = [].concat(passo.destacar || []).join(' ').match(/data-app="([^"]+)"/);
    return m ? m[1] : null;
  };
  const nomeDoApp = (id) => { const a = CE.listarApps().find((x) => x.id === id); return a ? a.nome : id; };
  function rotuloDoAlvo() {
    const alvo = [...document.querySelectorAll('.destaque')].find((e) => e.getClientRects().length);
    if (!alvo) return '';
    const t = (alvo.getAttribute('aria-label') || alvo.title || alvo.textContent || '').replace(/\s+/g, ' ').trim();
    return t.length >= 1 && t.length <= 40 ? t : '';
  }
  function dicaDoPasso(passo) {
    if (passo.dica) return passo.dica;
    const texto = String(passo.texto || '');
    const partes = [];
    const app = appDoPasso(passo);
    if (app && passo.espera !== 'app:aberto' && !CE.janelas.estaAberta(app)) partes.push(`Primeiro abra o programa "${nomeDoApp(app)}": clique duplo no ícone dele na área de trabalho.`);
    const atalho = texto.match(/Ctrl\s*\+\s*([A-Za-z0-9])/);
    if (atalho) partes.push(`Segure a tecla Ctrl (no canto de baixo, à esquerda do teclado) e, sem soltar, aperte a tecla ${atalho[1].toUpperCase()}. Depois solte as duas.`);
    else if (passo.mouse === 'duplo') partes.push('Coloque a setinha em cima e aperte o botão esquerdo do mouse duas vezes, bem rápido: clique-clique.');
    else if (passo.mouse === 'direito') partes.push('Aperte o botão DIREITO do mouse em cima do lugar. Vai abrir um menu: aí escolha a opção com o botão esquerdo.');
    else if (passo.mouse === 'arrastar' || /arraste|arrastando/i.test(texto)) partes.push('Aperte o botão esquerdo do mouse e SEGURE. Mova o mouse sem soltar e só solte no lugar certo.');
    else if (passo.mouse === 'rodinha' || /rodinha|role a/i.test(texto)) partes.push('Gire a rodinha do meio do mouse com o dedo, sem apertar.');
    if (/\b(escreva|digite|preencha)\b/i.test(texto)) partes.push('Antes de escrever, clique dentro da caixa (aparece um risquinho piscando). Errou? A tecla Backspace apaga.');
    const rotulo = !atalho && passo.mouse !== 'arrastar' ? rotuloDoAlvo() : '';
    if (rotulo) partes.push(`Clique em "${rotulo}": está piscando em vermelho, com a seta apontando.`);
    else if (passo.destacar) partes.push('O lugar certo está piscando em vermelho, com a seta apontando.');
    if (!partes.length) partes.push('Leia a tarefa de novo, com calma, e faça um pedacinho de cada vez.');
    return partes.join(' ');
  }

  // ---------- "Mostrar como": uma setinha fantasma vai até o lugar certo e faz o movimento ----------
  function mostrarComo(sozinho = false, avisouInstrutor = false) {
    const passo = passoAtual();
    if (!licao || !passo || !passo.espera || licao.desafio) return;
    // No modo desafio a seta fica escondida até o aluno pedir ajuda: aqui ela aparece.
    if (modoDesafio && passo.destacar && !document.querySelector('.destaque')) destacar(passo.destacar);
    ajudasNaAula++;
    const alvo = [...document.querySelectorAll('.destaque')].find((e) => e.getClientRects().length);
    const dica = dicaDoPasso(passo);
    escreverNaDica(`👀 ${dica}${avisouInstrutor ? ' Se ainda não der, o instrutor já foi avisado 🙋.' : ''}`);
    CE.voz.falar(`${sozinho ? 'Vou te mostrar. ' : 'Olha só. '}${dica}`);
    CE.emitir('professor:mostrou-como', { licao: licao.id, passo: indicePasso + 1, sozinho, alvo: !!alvo });
    if (!alvo) return;
    document.querySelectorAll('.fantasma-mouse').forEach((e) => e.remove());
    const r = alvo.getBoundingClientRect();
    const painel = $('professor').getBoundingClientRect();
    const fim = { x: r.left + Math.min(r.width / 2, 40), y: r.top + Math.min(r.height / 2, 24) };
    const fantasma = CE.el('div', { class: 'fantasma-mouse', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M3 2 L3 20 L8 15 L12 23 L15 21.5 L11 14 L18 14 Z"/></svg>' });
    fantasma.style.transform = `translate(${painel.left - 20}px, ${painel.top + 40}px)`;
    document.body.append(fantasma);
    const etiqueta = passo.mouse === 'duplo' ? '2 cliques' : passo.mouse === 'direito' ? 'botão direito' : passo.mouse === 'arrastar' ? 'segure e arraste' : 'clique';
    requestAnimationFrame(() => requestAnimationFrame(() => { fantasma.style.transform = `translate(${fim.x}px, ${fim.y}px)`; }));
    setTimeout(() => {
      if (!fantasma.isConnected) return;
      fantasma.append(CE.el('span', { class: 'fantasma-rotulo' }, etiqueta));
      fantasma.classList.add(passo.mouse === 'duplo' ? 'clica-duas' : 'clica');
      if (passo.mouse === 'arrastar') setTimeout(() => { fantasma.style.transform = `translate(${fim.x + 120}px, ${fim.y + 40}px)`; }, 500);
    }, 1300);
    setTimeout(() => fantasma.remove(), 4500);
  }

  // ---------- Travou: avisa o instrutor e deixa pular a tarefa ----------
  function oferecerPular() {
    const passo = passoAtual();
    if (!licao || !passo || !passo.espera || licao.desafio || licao.prova) return;
    if (CE.sala) CE.sala.pedirAjuda();
    const esta = { licao, indice: indicePasso };
    escreverNaDica('🙋 Está difícil? Já avisei o instrutor. Se quiser, pule esta tarefa e siga a aula: depois o instrutor te ajuda com ela. ',
      CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'pular-tarefa', onclick: () => {
        if (licao !== esta.licao || indicePasso !== esta.indice) return;
        if (!licao.especial) CE.dificuldades.registrar(licao.id, indicePasso, 'pulou');
        ajudasNaAula++;
        CE.emitir('licao:tarefa-pulada', { licao: licao.id, passo: indicePasso + 1 });
        avancar();
      } }, '⏭ Pular esta tarefa'));
    CE.voz.falar('Está difícil? Já avisei o instrutor. Se quiser, pode pular esta tarefa.');
    CE.emitir('professor:ofereceu-pular', { licao: licao.id, passo: indicePasso + 1 });
  }

  // ---------- Clique fora do lugar certo: o professor avisa na hora ----------
  // Vale clique dentro do que está piscando, dentro da mesma janela, no próprio professor, em menus, caixas de
  // diálogo, na barra de tarefas e na barra de título das janelas (para arrastar ou trazer uma janela).
  document.addEventListener('pointerdown', (e) => {
    const passo = passoAtual();
    if (!licao || !passo || !passo.espera || licao.desafio || modoDesafio || !passo.destacar || e.button > 2) return;
    const alvos = [...document.querySelectorAll('.destaque')].filter((x) => x.getClientRects().length);
    if (!alvos.length) return;
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (alvos.some((a) => a.contains(t))) return;
    if (t.closest('#professor, .mc-menu, .dialogo-fundo, #menu-iniciar, .barra-tarefas, .janela-titulo, .fantasma-mouse')) return;
    const janela = t.closest('.janela');
    if (janela && alvos.some((a) => janela.contains(a))) return;
    ajuda.erros++;
    const agora = Date.now();
    if (agora - ajuda.ultimoAviso < 2500) return;
    ajuda.ultimoAviso = agora;
    const rotulo = rotuloDoAlvo();
    escreverNaDica(`👆 Quase! ${rotulo ? `O lugar certo é "${rotulo}", que` : 'O lugar certo'} está piscando em vermelho, com a seta apontando.`);
    if (ajuda.erros === 1) CE.voz.falar('Quase! Procure o que está piscando em vermelho.');
    alvos.forEach((a) => { a.classList.remove('destaque-forte'); void a.offsetWidth; a.classList.add('destaque-forte'); setTimeout(() => a.classList.remove('destaque-forte'), 1600); });
    CE.emitir('professor:clique-errado', { licao: licao.id, passo: indicePasso + 1, vezes: ajuda.erros });
  }, true);

  // ---------- Fechou o programa da tarefa: o professor oferece abrir de novo ----------
  CE.ouvir('janela:fechada', (d) => {
    const passo = passoAtual();
    if (!licao || !passo || !passo.espera || licao.desafio || !d) return;
    const app = appDoPasso(passo);
    const esperaFechar = [].concat(passo.espera).includes('janela:fechada');
    if (!app || app !== d.app || esperaFechar) return;
    const nome = nomeDoApp(app);
    escreverNaDica(`⚠️ Você fechou o "${nome}", e a tarefa é nele. `,
      CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'reabrir-app', onclick: () => CE.janelas.abrir(app) }, `Abrir o ${nome} de novo`));
    CE.voz.falar(`Você fechou o ${nome}. Clique no botão para abrir de novo.`);
    CE.emitir('professor:app-fechado', { app });
  });

  // "🙋 Não entendi": o professor explica de novo, mais devagar, com a dica e a seta; o pedido fica guardado
  // (para o instrutor ver onde a turma trava) e aparece na Sala ao vivo.
  function naoEntendi() {
    const passo = passoAtual();
    if (!licao || !passo) return;
    ajuda.pedidos++;
    ajudasNaAula++;
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
    const explicacao = passo.quiz
      ? (passo.dica || 'Leia a pergunta e todas as respostas com calma. Pense no que você viu nesta aula.')
      : passo.espera ? dicaDoPasso(passo)
        : (passo.dica || 'Leia o texto com calma. Quando terminar, clique em Continuar.');
    clearTimeout(timerDica); // a dica já apareceu: o relógio da dica não conta outra vez
    if (elemento) { elemento.textContent = `💡 ${explicacao} Se ainda não der, o instrutor já foi avisado 🙋.`; elemento.hidden = false; }
    CE.voz.falar(`${textoFalado(passo)} ${explicacao}`, { velocidade: 1.1 });
    if (passo.destacar) destacar(passo.destacar);
    if (passo.espera) {
      clearTimeout(timerMostrar);
      setTimeout(() => { if (passoAtual() === passo) mostrarComo(false, true); }, 600);
      if (ajuda.pedidos >= 2) { clearTimeout(timerTravado); setTimeout(() => { if (passoAtual() === passo) oferecerPular(); }, 5000); }
    }
  }

  async function iniciarPasso() {
    if (pararDeOuvir) { pararDeOuvir(); pararDeOuvir = null; }
    limparAjuda();
    ajuda = { erros: 0, pedidos: 0, ultimoAviso: 0 };
    const passo = passoAtual();
    if (CE.sala) CE.sala.ajudaResolvida(); // passo novo: o pedido de ajuda do passo anterior sai da Sala ao vivo
    if (!passo) { concluirLicao(); return; }
    // Tira o foco do botão "Continuar", para as teclas apertadas a seguir não "clicarem" nele de novo.
    if (document.activeElement && $('professor').contains(document.activeElement)) document.activeElement.blur();
    if (passo.preparar) await passo.preparar();
    if (passo.jaFeito && passo.jaFeito()) { avancar('evento'); return; }
    // Modo desafio: a introdução que só explica fica guardada no botão "📖 Explicação".
    if (modoDesafio && !passo.espera && !passo.quiz && indicePasso < primeiraAcao(licao)) { avancar(); return; }
    if (passo.quiz) quizTotal++;
    desenharLicao();
    // No desafio (e no modo desafio do aluno 🚀) o aluno faz sozinho: sem seta e sem destaque até pedir ajuda.
    destacar(licao.desafio || modoDesafio ? null : passo.destacar);
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
      if (!modoDesafio) timerDica = setTimeout(mostrarDica, TEMPO_PARA_DICA);
      if (!licao.desafio && !modoDesafio) {
        const este = passo;
        timerMostrar = setTimeout(() => { if (passoAtual() === este) mostrarComo(true); }, TEMPO_MOSTRAR_COMO);
        timerTravado = setTimeout(() => { if (passoAtual() === este) oferecerPular(); }, TEMPO_TRAVADO);
      }
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
    const notaMinima = modoDesafio ? CE.ritmo.NOTA_DESAFIO : CE.curso.NOTA_MINIMA;
    const aprovada = nota == null || nota >= notaMinima;
    const comoFoi = { segundos: (performance.now() - inicioLicao) / 1000, primeira: quizTotal ? Math.round((certasDePrimeira / quizTotal) * 100) : null, ajudas: ajudasNaAula, desafio: modoDesafio };
    const eraDesafio = modoDesafio;
    const contaRitmo = CE.sessao.usuario && CE.sessao.usuario.papel !== 'instrutor' && !terminada.especial && !terminada.extra && !terminada.desafio;
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
    if (!salvou) return;
    const ritmo = contaRitmo ? await CE.ritmo.registrar(terminada, comoFoi).catch(() => null) : null;
    CE.revisao.lembrarProgresso(await CE.sessao.progresso().catch(() => null));
    if (licao) return; // o aluno começou outra aula nesse meio-tempo
    if (!aprovada) {
      const texto = eraDesafio
        ? `Sua nota foi ${nota}%. No modo desafio a meta é ${notaMinima}%, valendo só o acerto de primeira. Refaça a aula com atenção: você consegue!`
        : `Sua nota foi ${nota}%. Para passar, precisa de pelo menos ${CE.curso.NOTA_MINIMA}%. Vamos refazer a aula com calma? Você consegue!`;
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
        ? `Você terminou o ${CE.curso.rotulo(terminada.nivel)}! Peça ao instrutor o seu certificado. ${CE.curso.paralelo(terminada.nivel) ? 'Quando quiser, clique no botão verde para continuar o curso.' : 'Quando quiser, clique no botão verde para começar o próximo nível.'}`
        : 'Quando estiver pronto, clique no botão verde "Próxima aula".';
    // Virou 🚀: o professor avisa que vai exigir mais. (Se voltar ao normal, ele não comenta.)
    const subiu = ritmo && ritmo.depois === 'avancado' && ritmo.antes !== 'avancado' && CE.ritmo.modo(progresso) === 'auto';
    const avisoRitmo = subiu ? '🚀 Você está indo muito rápido e acertando quase tudo! A partir da próxima aula vou te dar menos explicação, ajuda só quando você pedir e perguntas mais exigentes.' : '';
    $('prof-licao').replaceChildren(CE.el('div', { class: 'prof-cartao concluida' },
      CE.el('div', { class: 'prof-titulo' }, terminada.prova ? '🏆 Prova aprovada!' : '🎉 Aula concluída!'),
      nota != null ? CE.el('div', { class: 'prof-nota' }, `${nota}%`) : null,
      CE.el('p', { class: 'prof-texto' }, terminada.conclusao),
      avisoRitmo ? CE.el('p', { class: 'prof-texto prof-ritmo', 'data-subiu-ritmo': '' }, avisoRitmo) : null,
      CE.el('p', { class: 'prof-texto prof-conducao', 'data-conducao': '' }, conducao),
      proxima ? CE.el('div', { class: 'prof-proxima', 'data-proxima': proxima.id },
        CE.el('small', {}, 'Próxima aula'),
        CE.el('strong', {}, `${proxima.icone} ${proxima.titulo}`),
        proxima.descricao ? CE.el('span', {}, proxima.descricao) : null) : null,
      CE.el('div', { class: 'prof-botoes' },
        eraDesafio && CE.revisao.montarBonus && CE.revisao.montarBonus(terminada) ? CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'bonus', title: 'Perguntas mais difíceis, de outras aulas: vale estrela de desafio', onclick: () => comecarLicao('bonus') }, '🏅 Perguntas bônus') : null,
        reforco ? CE.el('button', { class: 'botao secundario pequeno', 'data-acao': 'reforco', title: 'Aula a mais, para treinar (não é obrigatória)', onclick: () => comecarLicao(reforco.id) }, `💪 Treinar mais: ${reforco.titulo}`) : null,
        CE.el('button', { class: 'botao secundario pequeno', onclick: () => CE.janelas.abrir('aulas') }, 'Ver todas as aulas'),
        proxima ? CE.el('button', { class: 'botao conduzir', 'data-acao': 'proxima', onclick: () => comecarLicao(proxima.id) }, 'Próxima aula ▶') : null,
      ),
    ));
    CE.voz.falar(`${terminada.conclusao} ${avisoRitmo} ${conducao}`);
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
    limparAjuda();
    modoDesafio = false;
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
    modoDesafio = !instrutor && doCurso && !encontrada.desafio && !encontrada.prova && CE.ritmo.desafioAtivo(progresso);
    inicioLicao = performance.now(); ajudasNaAula = 0; certasDePrimeira = 0;
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
        CE.el('small', {}, pos ? `${pos.nivel.icone} Aula ${pos.numero} de ${pos.total} do ${CE.curso.rotulo(pos.nivel.id)}` : 'Aula de hoje'),
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
    dicaDoPasso, // a dica que o professor dá numa tarefa (a da aula ou a montada pela tarefa)
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
