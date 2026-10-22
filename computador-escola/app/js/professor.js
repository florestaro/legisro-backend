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
        passo: passo ? passo.texto : '',
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
    const aplicar = () => {
      document.querySelectorAll('.destaque').forEach((e) => { if (!e.matches(seletor)) e.classList.remove('destaque'); });
      const alvos = [...document.querySelectorAll(seletor)];
      alvos.forEach((e) => e.classList.add('destaque'));
      posicionarSeta(alvos.find((e) => e.getClientRects().length));
    };
    aplicar();
    timerDestaque = setInterval(aplicar, 150);
  }

  // ---------- Lições ----------

  function desenharLicao() {
    const area = $('prof-licao');
    const passo = passoAtual();
    if (!licao || !passo) { area.replaceChildren(); return; }
    area.replaceChildren(CE.el('div', { class: 'prof-cartao' },
      CE.el('div', { class: 'prof-titulo' }, `${licao.icone} ${licao.titulo}`),
      CE.el('div', { class: 'prof-progresso' },
        CE.el('div', { class: 'prof-progresso-cheio', style: `width:${Math.round((indicePasso / licao.passos.length) * 100)}%` })),
      CE.el('div', { class: 'prof-passo-num' }, `Passo ${indicePasso + 1} de ${licao.passos.length}`),
      CE.el('p', { class: 'prof-texto' }, passo.texto),
      CE.el('p', { class: 'prof-dica', hidden: true }),
      CE.el('div', { class: 'prof-botoes' },
        CE.el('button', { class: 'botao secundario pequeno', title: 'Ouvir de novo', onclick: () => CE.voz.falar(passo.texto) }, '🔊 Repetir'),
        CE.el('button', { class: 'botao secundario pequeno', onclick: sairDaLicao }, 'Sair da aula'),
        passo.espera ? null : CE.el('button', { class: 'botao', 'data-acao': 'continuar', onclick: avancar }, 'Continuar ▶'),
      ),
    ));
  }

  function mostrarDica() {
    const passo = passoAtual();
    const texto = passo && (passo.dica || 'Tem alguma dúvida? Escreva ali embaixo que eu te ajudo!');
    const elemento = document.querySelector('#prof-licao .prof-dica');
    if (!elemento || !texto) return;
    elemento.textContent = '💡 ' + texto;
    elemento.hidden = false;
    CE.voz.falar(texto);
  }

  async function iniciarPasso() {
    if (pararDeOuvir) { pararDeOuvir(); pararDeOuvir = null; }
    clearTimeout(timerDica);
    const passo = passoAtual();
    if (!passo) { concluirLicao(); return; }
    if (passo.preparar) await passo.preparar();
    if (passo.jaFeito && passo.jaFeito()) { avancar(); return; }
    desenharLicao();
    destacar(passo.destacar);
    CE.voz.falar(passo.texto);
    if (passo.espera) {
      const estaLicao = licao, esteIndice = indicePasso;
      pararDeOuvir = CE.ouvir(passo.espera, (dados) => {
        if (!passo.se || passo.se(dados)) {
          if (pararDeOuvir) { pararDeOuvir(); pararDeOuvir = null; }
          // Um pequeno intervalo deixa o aluno ver o resultado do que fez antes do próximo passo.
          setTimeout(() => { if (licao === estaLicao && indicePasso === esteIndice) avancar(); }, 600);
        }
      });
      timerDica = setTimeout(mostrarDica, TEMPO_PARA_DICA);
    }
  }

  function avancar() {
    if (!licao) return;
    indicePasso++;
    iniciarPasso();
  }

  async function concluirLicao() {
    const terminada = licao;
    encerrar();
    await CE.sessao.atualizarProgresso((p) => {
      p.licoes = p.licoes || {};
      const antes = p.licoes[terminada.id] || { vezes: 0 };
      p.licoes[terminada.id] = { concluida: true, vezes: antes.vezes + 1, em: Date.now() };
    });
    CE.emitir('licao:concluida', { licao: terminada.id });
    const proxima = await proximaLicao();
    $('prof-licao').replaceChildren(CE.el('div', { class: 'prof-cartao concluida' },
      CE.el('div', { class: 'prof-titulo' }, '🎉 Aula concluída!'),
      CE.el('p', { class: 'prof-texto' }, terminada.conclusao),
      CE.el('div', { class: 'prof-botoes' },
        proxima ? CE.el('button', { class: 'botao', onclick: () => comecarLicao(proxima.id) }, `Próxima: ${proxima.titulo} ▶`) : null,
        CE.el('button', { class: 'botao secundario pequeno', onclick: () => CE.janelas.abrir('aulas') }, 'Ver todas as aulas'),
      ),
    ));
    CE.voz.falar(terminada.conclusao);
  }

  function encerrar() {
    if (pararDeOuvir) { pararDeOuvir(); pararDeOuvir = null; }
    clearTimeout(timerDica);
    limparDestaque();
    licao = null;
    indicePasso = 0;
  }

  async function sairDaLicao() {
    encerrar();
    CE.voz.parar();
    await boasVindas(false);
  }

  async function proximaLicao() {
    const feitas = (await CE.sessao.progresso()).licoes || {};
    return CE.LICOES.find((l) => !(feitas[l.id] && feitas[l.id].concluida));
  }

  function comecarLicao(id) {
    const encontrada = CE.LICOES.find((l) => l.id === id);
    if (!encontrada) return;
    encerrar();
    licao = encontrada;
    indicePasso = 0;
    $('professor').classList.remove('recolhido');
    CE.emitir('licao:iniciada', { licao: id });
    iniciarPasso();
  }

  async function boasVindas(falar = true) {
    const u = CE.sessao.usuario;
    const primeiroNome = u.nome.split(' ')[0];
    const proxima = await proximaLicao();
    const texto = proxima
      ? `Olá, ${primeiroNome}! Que bom te ver. Vamos aprender? Sua próxima aula é "${proxima.titulo}".`
      : `Olá, ${primeiroNome}! Você já fez todas as aulas. Que tal treinar no programa Digitação ou escrever um documento?`;
    $('prof-licao').replaceChildren(CE.el('div', { class: 'prof-cartao' },
      CE.el('p', { class: 'prof-texto' }, texto),
      CE.el('div', { class: 'prof-botoes' },
        proxima ? CE.el('button', { class: 'botao', 'data-acao': 'comecar', onclick: () => comecarLicao(proxima.id) }, 'Começar aula ▶') : null,
        CE.el('button', { class: 'botao secundario pequeno', onclick: () => CE.janelas.abrir('aulas') }, 'Ver todas as aulas'),
      ),
    ));
    if (falar) CE.voz.falar(texto);
  }

  CE.professor = {
    iniciar() {
      montarPainel();
      boasVindas();
    },
    parar() {
      encerrar();
      CE.voz.parar();
      $('professor').hidden = true;
    },
    comecarLicao,
  };
})();
