// Moedas de cada aluno: todo mundo começa com zero e ganha moedas com o que faz no Computador Escola (aulas,
// provas, missão da semana, digitação, medalhas, monitoria, gincana) e na Praça Escola (tarefa do dia, pistas da
// novela e eventos urgentes da cidade). As moedas ficam no progresso do aluno (no modo sala de aula, no computador
// do instrutor), com um extrato das últimas. Cada coisa paga uma vez só: a "chave" evita, por exemplo, pagar duas
// vezes a mesma aula refeita. O saldo aparece na barra de tarefas (💰) e na janela "Minhas moedas".
window.CE = window.CE || {};

(function () {
  // Quanto vale cada coisa (a janela "Minhas moedas" mostra esta lista em "Como ganhar").
  const PREMIOS = [
    { tipo: 'aula', icone: '🎓', texto: 'Concluir uma aula', valor: 10 },
    { tipo: 'prova', icone: '🏆', texto: 'Passar na prova de um nível', valor: 50 },
    { tipo: 'missao', icone: '🎯', texto: 'Cumprir a missão da semana', valor: 30 },
    { tipo: 'digitacao', icone: '⌨️', texto: 'Passar num exercício de digitação', valor: 5 },
    { tipo: 'medalha', icone: '🏅', texto: 'Ganhar uma medalha', valor: 10 },
    { tipo: 'monitor', icone: '💁', texto: 'Ajudar um colega como monitor', valor: 15 },
    { tipo: 'gincana', icone: '🏁', texto: 'Jogar a gincana (o pódio ganha mais)', valor: 10 },
    { tipo: 'tarefa', icone: '📝', texto: 'Tarefa do dia num prédio da Praça Escola', valor: 5 },
    { tipo: 'pista', icone: '🔎', texto: 'Achar uma pista da novela da cidade', valor: 10 },
    { tipo: 'final', icone: '📖', texto: 'Ajudar a turma a desvendar um capítulo', valor: 20 },
    { tipo: 'evento', icone: '🚨', texto: 'Ajudar num evento urgente que a turma venceu', valor: 15 },
    { tipo: 'evento-tentativa', icone: '🚨', texto: 'Ajudar num evento urgente (mesmo sem vencer)', valor: 5 },
  ];
  const VALOR = Object.fromEntries(PREMIOS.map((p) => [p.tipo, p.valor]));
  const ICONE = Object.fromEntries(PREMIOS.map((p) => [p.tipo, p.icone]));
  const MAX_EXTRATO = 60;
  const ehAluno = () => !!(CE.sessao.usuario && CE.sessao.usuario.papel !== 'instrutor');
  const vazia = () => ({ saldo: 0, desde: Date.now(), chaves: {}, extrato: [] });
  const ler = (p) => {
    const c = (p && p.carteira) || vazia();
    return { saldo: Number(c.saldo) || 0, desde: c.desde || null, chaves: c.chaves || {}, extrato: Array.isArray(c.extrato) ? c.extrato : [] };
  };

  // Paga o prêmio (uma vez por chave). Devolve quanto pagou (0 se já tinha pago ou se não é aluno).
  async function ganhar(tipo, motivo, chave, valor = VALOR[tipo]) {
    if (!ehAluno() || !valor) return 0;
    let pago = 0, saldo = 0;
    await CE.sessao.atualizarProgresso((p) => {
      const c = ler(p);
      if (chave && c.chaves[chave]) { saldo = c.saldo; return; }
      if (chave) c.chaves[chave] = Date.now();
      c.saldo += valor;
      c.extrato = [{ em: Date.now(), valor, motivo, tipo }, ...c.extrato].slice(0, MAX_EXTRATO);
      p.carteira = c;
      pago = valor; saldo = c.saldo;
    }).catch(() => {});
    if (pago) {
      mostrarSaldo(saldo, pago);
      CE.emitir('carteira:ganhou', { valor: pago, saldo, tipo, motivo });
    }
    return pago;
  }

  // A moedinha da barra de tarefas (só para alunos), com um "+10" subindo quando entra dinheiro.
  function mostrarSaldo(saldo, ganho) {
    const b = document.getElementById('status-moedas');
    if (!b) return;
    b.hidden = !ehAluno();
    b.textContent = `💰 ${saldo}`;
    b.title = `Minhas moedas: ${saldo}. Clique para ver o extrato.`;
    if (ganho) {
      b.dataset.ganho = `+${ganho}`;
      b.classList.remove('ganhou');
      void b.offsetWidth; // recomeça a animação
      b.classList.add('ganhou');
    }
  }
  async function carregar() {
    const b = document.getElementById('status-moedas');
    if (b) b.hidden = !ehAluno();
    if (!ehAluno()) return;
    const p = await CE.sessao.progresso().catch(() => null);
    if (p) mostrarSaldo(ler(p).saldo);
  }

  CE.carteira = {
    PREMIOS, VALOR, ganhar, carregar,
    async saldo() { return ehAluno() ? ler(await CE.sessao.progresso().catch(() => null)).saldo : 0; },
    async extrato() { return ler(await CE.sessao.progresso().catch(() => null)); },
    abrir() { CE.janelas.abrir('carteira'); },
  };

  // ---------- O que paga, no Computador Escola ----------
  CE.ouvir('licao:concluida', (d) => {
    const l = d && CE.curso && CE.curso.licao(d.licao);
    if (!l) return;
    ganhar(l.prova ? 'prova' : 'aula', `${l.prova ? 'Prova' : 'Aula'}: ${l.titulo}`, 'aula:' + l.id);
  });
  CE.ouvir('missao:cumprida', (d) => ganhar('missao', 'Missão da semana cumprida', `missao:${d && d.semana}:${d && d.missao}`));
  CE.ouvir('digitacao:concluida', (d) => {
    if (d && d.aprovado && !d.nivelamento && d.exercicio) ganhar('digitacao', 'Digitação: exercício aprovado', 'digitacao:' + d.exercicio);
  });
  CE.ouvir('medalha:ganha', (d) => {
    const m = d && (CE.MEDALHAS || []).find((x) => x.id === d.medalha);
    if (m) ganhar('medalha', `Medalha ${m.icone} ${m.nome}`, 'medalha:' + m.id);
  });
  CE.ouvir('monitor:ajudou', (d) => ganhar('monitor', `Ajudou ${(d && d.colega) || 'um colega'} (monitoria)`, `monitor:${d && d.colega}:${d && d.ajudas}`));
  CE.ouvir('gincana:terminou', (d) => {
    const lugar = Number(d && d.lugar) || 0;
    const extra = lugar === 1 ? 20 : lugar === 2 ? 10 : lugar === 3 ? 5 : 0;
    ganhar('gincana', lugar >= 1 && lugar <= 3 ? `Gincana: ${lugar}º lugar` : 'Jogou a gincana', `gincana:${Math.floor(Date.now() / 60000)}`, VALOR.gincana + extra);
  });

  // ---------- A janela "Minhas moedas" ----------
  const quando = (t) => new Date(t).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  CE.registrarApp({
    id: 'carteira', nome: 'Minhas moedas', icone: '💰', semIcone: true, largura: 480, altura: 560,
    abrir(corpo) {
      corpo.classList.add('cart-corpo');
      async function desenhar() {
        if (!ehAluno()) {
          corpo.replaceChildren(CE.el('div', { class: 'cart' }, CE.el('h2', {}, '💰 Moedas da turma'),
            CE.el('p', {}, 'Cada aluno começa com zero e ganha moedas com as aulas, as missões e as atividades da Praça Escola. O instrutor vê o saldo de cada um na Praça Escola, em 🏙️ Cidade › Rua da Turma.'),
            lista()));
          return;
        }
        const c = await CE.carteira.extrato();
        corpo.replaceChildren(CE.el('div', { class: 'cart' },
          CE.el('div', { class: 'cart-saldo', 'data-saldo': String(c.saldo) }, CE.el('span', { class: 'rotulo' }, 'Meu saldo'), CE.el('strong', {}, `💰 ${c.saldo}`), CE.el('span', { class: 'rotulo' }, c.saldo === 1 ? 'moeda' : 'moedas')),
          CE.el('h3', {}, 'Extrato'),
          c.extrato.length
            ? CE.el('ul', { class: 'cart-extrato' }, c.extrato.map((x) => CE.el('li', {},
              CE.el('span', { class: 'ic', 'aria-hidden': 'true' }, ICONE[x.tipo] || '💰'),
              CE.el('span', { class: 'txt' }, CE.el('span', {}, x.motivo), CE.el('small', {}, quando(x.em))),
              CE.el('strong', { class: 'valor' }, `+${x.valor}`))))
            : CE.el('p', { class: 'cart-vazio' }, 'Ainda não entrou nenhuma moeda. Conclua uma aula ou faça a tarefa do dia na Praça Escola!'),
          CE.el('h3', {}, 'Como ganhar'), lista()));
      }
      const lista = () => CE.el('ul', { class: 'cart-premios' }, PREMIOS.map((p) => CE.el('li', {},
        CE.el('span', { 'aria-hidden': 'true' }, p.icone), CE.el('span', { class: 'txt' }, p.texto), CE.el('strong', {}, `+${p.valor}`))));
      desenhar();
      const parar = CE.ouvir('carteira:ganhou', desenhar);
      return { aoFechar() { parar(); return true; } };
    },
  });

  document.addEventListener('DOMContentLoaded', () => {
    const b = document.getElementById('status-moedas');
    if (b) b.addEventListener('click', () => CE.carteira.abrir());
  });
})();
