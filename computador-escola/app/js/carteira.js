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
    { tipo: 'tesouro', icone: '🎁', texto: 'Achar um baú na caça ao tesouro', valor: 5 },
    { tipo: 'bingo', icone: '🎱', texto: 'Ganhar o bingo do coreto', valor: 30 },
    { tipo: 'coleta', icone: '♻️', texto: 'Separar o lixo na lixeira certa (coleta seletiva da praça)', valor: 2 },
    { tipo: 'caixa', icone: '🏧', texto: 'Treinar no caixa eletrônico do Banco (uma vez por dia)', valor: 5 },
    { tipo: 'agenda', icone: '📅', texto: 'Agendar consulta no Posto sem cair no golpe (uma vez por dia)', valor: 5 },
    { tipo: 'entrevista', icone: '💼', texto: 'Fazer a entrevista de emprego (primeira vez na praça)', valor: 20 },
    { tipo: 'golpe', icone: '🛡️', texto: 'Não cair num golpe do banco (SMS, falso gerente ou boleto falso)', valor: 5 },
  ];
  const VALOR = Object.fromEntries(PREMIOS.map((p) => [p.tipo, p.valor]));
  const ICONE = { ...Object.fromEntries(PREMIOS.map((p) => [p.tipo, p.icone])), gasto: '🎟️', estorno: '↩️', saque: '🏦', deposito: '🏦', feira: '🧺', 'feira-venda': '🧺' };
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

  // Gasta moedas (a vaquinha dos eventos especiais). Sem saldo, não gasta nada e avisa.
  async function gastar(valor, motivo) {
    valor = Math.floor(Number(valor));
    if (!ehAluno() || !(valor > 0)) throw new Error('Só os alunos gastam moedas.');
    let saldo = 0;
    await CE.sessao.atualizarProgresso((p) => {
      const c = ler(p);
      if (c.saldo < valor) throw new Error(`Você tem ${c.saldo} moedas: não dá para dar ${valor}.`);
      c.saldo -= valor;
      c.extrato = [{ em: Date.now(), valor: -valor, motivo, tipo: 'gasto' }, ...c.extrato].slice(0, MAX_EXTRATO);
      p.carteira = c;
      saldo = c.saldo;
    });
    mostrarSaldo(saldo);
    CE.emitir('carteira:gastou', { valor, saldo, motivo });
    return saldo;
  }

  // ---------- O banco das moedas: conta, poupança, aplicação e empréstimo ----------
  // O salário das vagas da Praça Escola cai na conta. Da conta, o aluno saca para a carteira (para gastar) ou deixa
  // rendendo: a poupança rende 0,5% ao dia e pode sair quando quiser; a aplicação rende 1% ao dia, mas só sai depois
  // de 3 dias. O empréstimo vem na hora, mas cobra 2% ao dia (o dobro da aplicação e 4 vezes a poupança, como na vida
  // real: o banco ganha na diferença), e metade de cada salário vai para pagar a dívida (o salário futuro fica
  // comprometido). "Dia" é dia de verdade (de calendário): os juros entram quando o aluno volta.
  const TAXA = { poupanca: 0.005, aplicacao: 0.01, emprestimo: 0.02 };
  const pct = (t) => `${(t * 100).toLocaleString('pt-BR')}%`;
  const PRAZO_APLICACAO = 3, LIMITE_EMPRESTIMO = 150, PARTE_DO_SALARIO = 0.5, MAX_EXTRATO_BANCO = 40;
  const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const diasEntre = (a, b) => Math.max(0, Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000));
  const c2 = (v) => Math.round(v * 100) / 100;
  const moeda = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function lerBanco(p) {
    const b = (p && p.banco) || {};
    return {
      conta: Number(b.conta) || 0, poupanca: Number(b.poupanca) || 0,
      aplicacoes: Array.isArray(b.aplicacoes) ? b.aplicacoes.filter((a) => a && Number(a.valor) > 0) : [],
      emprestimo: b.emprestimo && Number(b.emprestimo.devendo) > 0.004 ? b.emprestimo : null,
      dia: typeof b.dia === 'string' ? b.dia : hoje(), extrato: Array.isArray(b.extrato) ? b.extrato : [],
      // Contas do mês, nome (score de crédito) e o dia da cidade (da Praça Escola) em que o aluno está.
      contas: Array.isArray(b.contas) ? b.contas.filter((x) => x && x.id).slice(-12) : [],
      score: Number.isFinite(Number(b.score)) ? Number(b.score) : SCORE_INICIAL,
      scoreLog: Array.isArray(b.scoreLog) ? b.scoreLog.slice(0, 8) : [],
      diaCidade: Number(b.diaCidade) || 0,
    };
  }
  // ---------- Contas do mês e o nome (score de crédito) ----------
  // A cada dia da cidade (15 minutos na Praça Escola) chega uma conta, em rodízio: luz, água e aluguel. Ela vence no
  // dia seguinte. Paga em dia, o nome melhora; atrasou, paga multa de 10% e o nome piora; 2 dias de atraso: nome sujo
  // (o banco não empresta). A cada 3 dias chega também um boleto falso (pelo WhatsApp): quem paga perde o dinheiro.
  const SCORE_INICIAL = 500, MULTA = 0.1, SUJA_COM = 2;
  const CONTAS = [
    { tipo: 'luz', icone: '💡', nome: 'Conta de luz', benef: 'Luz da Cidade S.A.', valores: [6, 7, 8, 9] },
    { tipo: 'agua', icone: '🚰', nome: 'Conta de água', benef: 'Águas da Cidade', valores: [4, 5, 6] },
    { tipo: 'aluguel', icone: '🏠', nome: 'Aluguel', benef: 'Imobiliária da Praça', valores: [15] },
  ];
  function faixa(score) {
    if (score >= 700) return { id: 'bom', nome: 'Bom pagador', limite: 250, taxa: 0.015 };
    if (score >= 400) return { id: 'regular', nome: 'Regular', limite: LIMITE_EMPRESTIMO, taxa: TAXA.emprestimo };
    return { id: 'baixo', nome: 'Baixo', limite: 60, taxa: 0.03 };
  }
  const atrasoDe = (b, x) => (x.paga || x.falso || x.recusada ? 0 : Math.max(0, b.diaCidade - x.vence));
  const nomeSujo = (b) => b.contas.some((x) => atrasoDe(b, x) >= SUJA_COM);
  function mudarScore(b, d, motivo) {
    b.score = Math.max(0, Math.min(1000, Math.round(b.score + d)));
    b.scoreLog = [{ em: Date.now(), d, motivo }, ...b.scoreLog].slice(0, 8);
  }
  const codigoDeBarras = (n, k) => { let s = String(2379 + k) + String(n).padStart(4, '0'); while (s.length < 20) s += String((s.length * 7 + n * 3 + k) % 10); return `${s.slice(0, 5)}.${s.slice(5, 10)} ${s.slice(10, 15)}.${s.slice(15, 20)}`; };
  const linhaBanco = (b, motivo, valor, tipo) => { b.extrato = [{ em: Date.now(), motivo, valor: c2(valor), tipo }, ...b.extrato].slice(0, MAX_EXTRATO_BANCO); };
  // Os dias que passaram desde a última visita: rendimento da poupança e juros do empréstimo (juros compostos).
  function passarDias(b) {
    const dias = Math.min(60, diasEntre(b.dia, hoje()));
    b.dia = hoje();
    if (!dias) return b;
    if (b.poupanca > 0) { const r = c2(b.poupanca * (Math.pow(1 + TAXA.poupanca, dias) - 1)); if (r > 0) { b.poupanca = c2(b.poupanca + r); linhaBanco(b, `Rendimento da poupança (${dias} dia${dias > 1 ? 's' : ''})`, r, 'rende'); } }
    if (b.emprestimo) { const j = c2(b.emprestimo.devendo * (Math.pow(1 + (Number(b.emprestimo.taxa) || TAXA.emprestimo), dias) - 1)); if (j > 0) { b.emprestimo.devendo = c2(b.emprestimo.devendo + j); linhaBanco(b, `Juros do empréstimo (${dias} dia${dias > 1 ? 's' : ''})`, -j, 'juros'); } }
    return b;
  }
  const valorDaAplicacao = (a) => c2(a.valor * Math.pow(1 + TAXA.aplicacao, Math.min(60, diasEntre(a.desde, hoje()))));
  const liberaEm = (a) => Math.max(0, PRAZO_APLICACAO - diasEntre(a.desde, hoje()));
  // Uma operação no banco (e na carteira, junto): tudo ou nada.
  async function noBanco(fazer, soLer) {
    if (!ehAluno()) throw new Error('O banco das moedas é dos alunos.');
    let resultado = null, saldo = 0;
    await CE.sessao.atualizarProgresso((p) => {
      const c = ler(p), b = passarDias(lerBanco(p));
      resultado = fazer(b, c);
      p.banco = b; p.carteira = c; saldo = c.saldo;
    });
    mostrarSaldo(saldo);
    if (!soLer) CE.emitir('banco:mudou', {}); // só ler (a janela redesenhando) não avisa, senão vira um laço
    return resultado;
  }
  const quanto = (v, max, oQue) => {
    const n = c2(Number(String(v).replace(',', '.')));
    if (!(n > 0)) throw new Error('Digite um valor maior que zero.');
    if (n > c2(max) + 1e-9) throw new Error(`Não dá: ${oQue} tem ${moeda(max)}.`);
    return n;
  };
  const banco = {
    TAXA, PRAZO_APLICACAO, LIMITE_EMPRESTIMO, PARTE_DO_SALARIO, moeda, pct,
    SCORE_INICIAL, MULTA, faixa,
    async ver() {
      if (!ehAluno()) return lerBanco(null);
      let r = null;
      await noBanco((b) => { r = JSON.parse(JSON.stringify(b)); r.sujo = nomeSujo(b); r.contas = b.contas.map((x) => ({ ...x, atraso: atrasoDe(b, x) })); }, true);
      r.aplicacoes = r.aplicacoes.map((a) => ({ ...a, atual: valorDaAplicacao(a), faltam: liberaEm(a) }));
      r.faixa = faixa(r.score);
      return r;
    },
    // Um dia novo na cidade: confere os atrasos e manda a conta do dia (e, de 3 em 3 dias, um boleto falso).
    async diaDaCidade(n) {
      n = Math.floor(Number(n));
      if (!ehAluno() || !(n > 0)) return null;
      let novas = [];
      await noBanco((b) => {
        if (n <= b.diaCidade) return;
        b.diaCidade = n;
        for (const x of b.contas) if (!x.paga && !x.falso && !x.recusada && n > x.vence && !x.atrasou) { x.atrasou = true; mudarScore(b, -40, `${x.nome} atrasou`); }
        const pendentes = b.contas.filter((x) => !x.paga && !x.recusada).length;
        if (pendentes >= 6) return;
        const k = n % CONTAS.length, t = CONTAS[k];
        const valor = t.valores[n % t.valores.length];
        const conta = { id: `ct-${n}-${t.tipo}`, tipo: t.tipo, icone: t.icone, nome: t.nome, benef: t.benef, valor, emitida: n, vence: n + 1, codigo: codigoDeBarras(n, k), canal: 'Chegou pelo aplicativo da empresa' };
        novas.push(conta);
        if (n % 3 === 0) {
          const f = CONTAS[(k + 1) % CONTAS.length];
          novas.push({ id: `ct-${n}-falso`, tipo: f.tipo, icone: f.icone, nome: `${f.nome} (2ª via)`, benef: `${f.benef.split(' ')[0]} Pagamentos Rápidos (CPF 123.456.789-00)`, valor: f.valores[0] * 3, emitida: n, vence: n,
            codigo: codigoDeBarras(n, 9), canal: 'Chegou pelo WhatsApp, de um número desconhecido: "Pague HOJE ou cortamos o serviço!"', falso: true });
        }
        b.contas = [...b.contas, ...novas].slice(-12);
      });
      return { novas };
    },
    pagarConta: (id) => noBanco((b) => {
      const x = b.contas.find((c) => c.id === id);
      if (!x || x.paga || x.recusada) throw new Error('Essa conta já foi resolvida.');
      if (x.falso) {
        const perdeu = c2(Math.min(b.conta, x.valor));
        if (perdeu < x.valor - 1e-9) throw new Error(`Saldo insuficiente na conta: tem ${moeda(b.conta)}.`);
        b.conta = c2(b.conta - perdeu); x.paga = b.diaCidade || 1; x.caiu = true;
        linhaBanco(b, `Pagou um boleto FALSO (${x.benef}): o dinheiro foi para o golpista`, -perdeu, 'golpe');
        mudarScore(b, -30, 'Pagou boleto falso');
        return { falso: true, perdeu };
      }
      const multa = atrasoDe(b, x) > 0 ? c2(x.valor * MULTA) : 0;
      const total = c2(x.valor + multa);
      if (b.conta + 1e-9 < total) throw new Error(`Saldo insuficiente na conta: a conta é ${moeda(total)} e você tem ${moeda(b.conta)}. Tire da poupança ou trabalhe numa vaga.`);
      b.conta = c2(b.conta - total); x.paga = b.diaCidade || 1;
      linhaBanco(b, `${x.icone} ${x.nome}${multa ? ' (com multa de 10% por atraso)' : ''}`, -total, 'conta');
      mudarScore(b, multa ? 10 : 25, multa ? `${x.nome} paga com atraso` : `${x.nome} paga em dia`);
      return { falso: false, total, multa };
    }),
    recusarConta: (id) => noBanco((b) => {
      const x = b.contas.find((c) => c.id === id);
      if (!x || x.paga || x.recusada) throw new Error('Essa conta já foi resolvida.');
      if (!x.falso) throw new Error(`Esta conta é de verdade: veio pelo aplicativo da empresa e quem recebe é a ${x.benef}. Pague para não atrasar.`);
      x.recusada = b.diaCidade || 1;
      mudarScore(b, 15, 'Desconfiou do boleto falso');
      linhaBanco(b, `🛡️ Não pagou o boleto falso de ${x.benef}`, 0, 'golpe');
      return { acertou: true };
    }),
    // Golpe do banco (SMS do empréstimo, falso gerente): quem cai perde o dinheiro e o nome piora.
    golpe: (caiu, valor, motivo) => noBanco((b, c) => {
      if (!caiu) { mudarScore(b, 10, `Não caiu: ${motivo}`); return { perdeu: 0 }; }
      let falta = Math.max(0, Math.floor(Number(valor) || 0)), perdeu = 0;
      const daConta = c2(Math.min(b.conta, falta)); b.conta = c2(b.conta - daConta); falta = c2(falta - daConta); perdeu += daConta;
      const daCarteira = Math.min(c.saldo, Math.ceil(falta)); c.saldo -= daCarteira; perdeu += daCarteira;
      if (daCarteira) c.extrato = [{ em: Date.now(), valor: -daCarteira, motivo: `Golpe: ${motivo}`, tipo: 'gasto' }, ...c.extrato].slice(0, MAX_EXTRATO);
      if (daConta) linhaBanco(b, `Golpe: ${motivo}`, -daConta, 'golpe');
      mudarScore(b, -40, `Caiu no golpe: ${motivo}`);
      return { perdeu: c2(perdeu) };
    }),
    depositar: (v) => noBanco((b, c) => { const n = Math.floor(quanto(v, c.saldo, 'a carteira')); if (n < 1) throw new Error('Deposite moedas inteiras.'); c.saldo -= n; c.extrato = [{ em: Date.now(), valor: -n, motivo: 'Depósito no banco', tipo: 'deposito' }, ...c.extrato].slice(0, MAX_EXTRATO); b.conta = c2(b.conta + n); linhaBanco(b, 'Depósito (da carteira)', n, 'deposito'); }),
    sacar: (v) => noBanco((b, c) => { const n = Math.floor(quanto(v, b.conta, 'a conta')); if (n < 1) throw new Error('Saque moedas inteiras.'); b.conta = c2(b.conta - n); c.saldo += n; c.extrato = [{ em: Date.now(), valor: n, motivo: 'Saque no banco', tipo: 'saque' }, ...c.extrato].slice(0, MAX_EXTRATO); linhaBanco(b, 'Saque (para a carteira)', -n, 'saque'); }),
    guardar: (v) => noBanco((b) => { const n = quanto(v, b.conta, 'a conta'); b.conta = c2(b.conta - n); b.poupanca = c2(b.poupanca + n); linhaBanco(b, 'Guardou na poupança', -n, 'poupanca'); }),
    tirar: (v) => noBanco((b) => { const n = quanto(v, b.poupanca, 'a poupança'); b.poupanca = c2(b.poupanca - n); b.conta = c2(b.conta + n); linhaBanco(b, 'Tirou da poupança', n, 'poupanca'); }),
    aplicar: (v) => noBanco((b) => { const n = quanto(v, b.conta, 'a conta'); b.conta = c2(b.conta - n); b.aplicacoes.push({ id: 'ap-' + Date.now(), valor: n, desde: hoje() }); linhaBanco(b, `Aplicação (sai em ${PRAZO_APLICACAO} dias)`, -n, 'aplicacao'); }),
    resgatar: (id) => noBanco((b) => {
      const a = b.aplicacoes.find((x) => x.id === id);
      if (!a) throw new Error('Aplicação não encontrada.');
      if (liberaEm(a) > 0) throw new Error(`Ainda não: essa aplicação só sai daqui a ${liberaEm(a)} dia${liberaEm(a) > 1 ? 's' : ''}.`);
      const v = valorDaAplicacao(a);
      b.aplicacoes = b.aplicacoes.filter((x) => x !== a); b.conta = c2(b.conta + v);
      linhaBanco(b, `Resgate da aplicação (rendeu ${moeda(v - a.valor)})`, v, 'aplicacao');
    }),
    // Quanto vai dever depois de N dias, para mostrar antes de pegar.
    simular: (v, dias, taxa = TAXA.emprestimo) => c2(Number(v) * Math.pow(1 + taxa, dias)),
    emprestar: (v) => noBanco((b) => {
      if (b.emprestimo) throw new Error('Você já tem um empréstimo. Pague esse antes de pegar outro.');
      if (nomeSujo(b)) throw new Error('Nome sujo: você tem conta atrasada há 2 dias ou mais, e o banco não empresta. Pague as contas atrasadas primeiro.');
      const f = faixa(b.score);
      const n = quanto(v, f.limite, `o seu limite (nome ${f.nome.toLowerCase()})`);
      b.emprestimo = { pego: n, devendo: n, desde: hoje(), taxa: f.taxa }; b.conta = c2(b.conta + n);
      linhaBanco(b, `Empréstimo (juros de ${pct(f.taxa)} ao dia)`, n, 'emprestimo');
    }),
    pagar: (v) => noBanco((b) => {
      if (!b.emprestimo) throw new Error('Você não tem empréstimo.');
      const n = quanto(Math.min(Number(String(v).replace(',', '.')) || 0, b.emprestimo.devendo), b.conta, 'a conta');
      b.conta = c2(b.conta - n); b.emprestimo.devendo = c2(b.emprestimo.devendo - n);
      linhaBanco(b, 'Pagou parte do empréstimo', -n, 'emprestimo');
      if (b.emprestimo.devendo <= 0.004) { b.emprestimo = null; linhaBanco(b, '🎉 Empréstimo quitado!', 0, 'emprestimo'); mudarScore(b, 50, 'Quitou o empréstimo'); }
    }),
    // O salário das vagas: cai na conta; com empréstimo, metade vai direto para a dívida. Uma vez por chave.
    async receberSalario(valor, motivo, chave) {
      if (!ehAluno() || !(valor > 0)) return null;
      let r = null;
      await noBanco((b, c) => {
        if (chave && c.chaves[chave]) return;
        if (chave) c.chaves[chave] = Date.now();
        let desconto = 0;
        if (b.emprestimo) { desconto = c2(Math.min(b.emprestimo.devendo, valor * PARTE_DO_SALARIO)); b.emprestimo.devendo = c2(b.emprestimo.devendo - desconto); }
        b.conta = c2(b.conta + valor - desconto);
        linhaBanco(b, `Salário: ${motivo}`, valor, 'salario');
        if (desconto) linhaBanco(b, 'Parcela do empréstimo (descontada do salário)', -desconto, 'emprestimo');
        if (b.emprestimo && b.emprestimo.devendo <= 0.004) { b.emprestimo = null; linhaBanco(b, '🎉 Empréstimo quitado!', 0, 'emprestimo'); mudarScore(b, 50, 'Quitou o empréstimo'); }
        r = { valor, desconto, liquido: c2(valor - desconto) };
      });
      if (r) CE.emitir('banco:salario', r);
      return r;
    },
  };

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
    PREMIOS, VALOR, ganhar, gastar, carregar, banco, aba: null,
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
    id: 'carteira', nome: 'Minhas moedas', icone: '💰', semIcone: true, largura: 540, altura: 620,
    abrir(corpo) {
      corpo.classList.add('cart-corpo');
      let aba = CE.carteira.aba || 'carteira';
      CE.carteira.aba = null;
      async function desenhar() {
        if (ehAluno() && aba === 'banco') return desenharBanco();
        if (!ehAluno()) {
          corpo.replaceChildren(CE.el('div', { class: 'cart' }, CE.el('h2', {}, '💰 Moedas da turma'),
            CE.el('p', {}, 'Cada aluno começa com zero e ganha moedas com as aulas, as missões e as atividades da Praça Escola. O instrutor vê o saldo de cada um na Praça Escola, em 🏙️ Cidade › Rua da Turma.'),
            lista()));
          return;
        }
        const c = await CE.carteira.extrato();
        corpo.replaceChildren(CE.el('div', { class: 'cart' }, abas(),
          CE.el('div', { class: 'cart-saldo', 'data-saldo': String(c.saldo) }, CE.el('span', { class: 'rotulo' }, 'Meu saldo'), CE.el('strong', {}, `💰 ${c.saldo}`), CE.el('span', { class: 'rotulo' }, c.saldo === 1 ? 'moeda' : 'moedas')),
          CE.el('h3', {}, 'Extrato'),
          c.extrato.length
            ? CE.el('ul', { class: 'cart-extrato' }, c.extrato.map((x) => CE.el('li', {},
              CE.el('span', { class: 'ic', 'aria-hidden': 'true' }, ICONE[x.tipo] || '💰'),
              CE.el('span', { class: 'txt' }, CE.el('span', {}, x.motivo), CE.el('small', {}, quando(x.em))),
              CE.el('strong', { class: 'valor' + (x.valor < 0 ? ' gasto' : '') }, x.valor < 0 ? `${x.valor}` : `+${x.valor}`))))
            : CE.el('p', { class: 'cart-vazio' }, 'Ainda não entrou nenhuma moeda. Conclua uma aula ou faça a tarefa do dia na Praça Escola!'),
          CE.el('p', { class: 'cart-dica' }, '🎟️ Para que servem: na Praça Escola, a turma junta moedas para comprar eventos especiais (festa, caça ao tesouro, bingo), que o Professor Virtual conduz.'),
          CE.el('h3', {}, 'Como ganhar'), lista()));
      }
      const abas = () => CE.el('div', { class: 'cart-abas', role: 'tablist' },
        CE.el('button', { type: 'button', role: 'tab', 'data-aba': 'carteira', 'aria-selected': String(aba === 'carteira'), onclick: () => { aba = 'carteira'; desenhar(); } }, '💰 Carteira'),
        CE.el('button', { type: 'button', role: 'tab', 'data-aba': 'banco', 'aria-selected': String(aba === 'banco'), onclick: () => { aba = 'banco'; desenhar(); } }, '🏦 Banco'));
      let aviso = '';
      async function operar(f) {
        try { await f(); aviso = ''; } catch (e) { aviso = e.message; }
        desenhar();
      }
      async function desenharBanco() {
        const b = await banco.ver();
        const c = await CE.carteira.extrato();
        const campo = CE.el('input', { id: 'cart-valor', inputmode: 'decimal', autocomplete: 'off', placeholder: 'Ex.: 20', 'aria-label': 'Valor em moedas' });
        const v = () => campo.value;
        const botao = (rotulo, acao, id, sec = true) => CE.el('button', { class: 'botao' + (sec ? ' secundario' : ''), type: 'button', 'data-banco': id, onclick: () => operar(() => acao(v())) }, rotulo);
        const e = b.emprestimo, f = b.faixa;
        const simula = [1, 7, 30].map((d) => `${d} dia${d > 1 ? 's' : ''}: ${moeda(banco.simular(100, d, f.taxa))}`).join(' · ');
        const abertas = b.contas.filter((x) => !x.paga && !x.recusada);
        const venceTxt = (x) => (x.atraso ? `⚠️ Atrasada há ${x.atraso} dia${x.atraso > 1 ? 's' : ''} da cidade (multa de 10%)` : x.vence <= b.diaCidade ? 'Vence HOJE (até as 18h da cidade)' : 'Vence amanhã (no dia da cidade)');
        const contaLi = (x) => CE.el('li', { class: 'banco-conta' + (x.atraso ? ' atrasada' : ''), 'data-conta-id': x.id },
          CE.el('span', { class: 'ic', 'aria-hidden': 'true' }, x.icone),
          CE.el('span', { class: 'txt' }, CE.el('strong', {}, `${x.nome}: ${moeda(x.valor)}`), CE.el('small', {}, `Quem recebe: ${x.benef}`), CE.el('small', {}, x.canal),
            CE.el('small', { class: 'codigo' }, `Código: ${x.codigo}`), CE.el('small', {}, venceTxt(x))),
          CE.el('span', { class: 'banco-conta-botoes' },
            CE.el('button', { class: 'botao', type: 'button', 'data-pagar-conta': x.id, onclick: () => operar(async () => { const r = await banco.pagarConta(x.id); if (r && r.falso) throw new Error(`😱 Era golpe! O boleto era falso: ${moeda(r.perdeu)} foram para o golpista. Confira sempre quem recebe e por onde a conta chegou.`); }) }, 'Pagar'),
            CE.el('button', { class: 'botao secundario', type: 'button', 'data-golpe-conta': x.id, onclick: () => operar(async () => { await banco.recusarConta(x.id); await ganhar('golpe', 'Desconfiou do boleto falso', `golpe:${x.id}`); }) }, '🚫 É golpe')));
        corpo.replaceChildren(CE.el('div', { class: 'cart banco' }, abas(),
          CE.el('div', { class: 'banco-cartoes' },
            CE.el('div', { class: 'banco-cartao', 'data-conta': String(b.conta) }, CE.el('span', {}, '🏦 Conta'), CE.el('strong', {}, moeda(b.conta)), CE.el('small', {}, 'O salário das vagas cai aqui')),
            CE.el('div', { class: 'banco-cartao' }, CE.el('span', {}, '🐷 Poupança'), CE.el('strong', {}, moeda(b.poupanca)), CE.el('small', {}, `Rende ${pct(TAXA.poupanca)} ao dia · sai quando quiser`)),
            CE.el('div', { class: 'banco-cartao' }, CE.el('span', {}, '💰 Carteira'), CE.el('strong', {}, String(c.saldo)), CE.el('small', {}, 'Para gastar na praça (vaquinha e feira)')),
            CE.el('div', { class: 'banco-cartao' + (e ? ' divida' : '') }, CE.el('span', {}, '📉 Empréstimo'), CE.el('strong', {}, e ? moeda(e.devendo) : '—'),
              CE.el('small', {}, e ? `Juros de ${pct(Number(e.taxa) || TAXA.emprestimo)} ao dia · ${pct(PARTE_DO_SALARIO)} do salário paga a dívida` : b.sujo ? 'Nome sujo: o banco não empresta' : `Limite: ${f.limite} moedas · juros de ${pct(f.taxa)} ao dia`)),
            CE.el('div', { class: 'banco-cartao score ' + (b.sujo ? 'sujo' : f.id), 'data-score': String(b.score) }, CE.el('span', {}, '📊 Meu nome'), CE.el('strong', {}, `${b.score} pontos`),
              CE.el('small', {}, b.sujo ? '⚠️ NOME SUJO: conta atrasada há 2 dias ou mais' : `${f.nome}: pague as contas em dia para subir`))),
          abertas.length ? CE.el('div', {}, CE.el('h3', {}, `🧾 Contas a pagar (${abertas.length})`), CE.el('ul', { class: 'banco-contas' }, abertas.map(contaLi)),
            CE.el('p', { class: 'cart-dica' }, '🔎 Antes de pagar, confira: quem recebe é a empresa certa? A conta chegou pelo aplicativo ou pelo correio (e não por WhatsApp de número desconhecido)? O valor parece com o dos outros meses?')) : null,
          CE.el('div', { class: 'banco-operar' }, CE.el('label', { for: 'cart-valor' }, 'Valor'), campo),
          aviso ? CE.el('p', { class: 'banco-aviso', role: 'alert' }, aviso) : null,
          CE.el('div', { class: 'banco-botoes' },
            botao('⬇ Depositar (da carteira)', banco.depositar, 'depositar', false), botao('⬆ Sacar (para a carteira)', banco.sacar, 'sacar'),
            botao('🐷 Guardar na poupança', banco.guardar, 'guardar'), botao('Tirar da poupança', banco.tirar, 'tirar'),
            botao(`📈 Aplicar (${pct(TAXA.aplicacao)} ao dia, ${PRAZO_APLICACAO} dias)`, banco.aplicar, 'aplicar'),
            e ? botao('Pagar o empréstimo', banco.pagar, 'pagar') : botao('📉 Pegar empréstimo', banco.emprestar, 'emprestar')),
          b.aplicacoes.length ? CE.el('div', {}, CE.el('h3', {}, '📈 Aplicações'), CE.el('ul', { class: 'cart-extrato' }, b.aplicacoes.map((a) => CE.el('li', {},
            CE.el('span', { class: 'txt' }, CE.el('span', {}, `Aplicou ${moeda(a.valor)} · hoje vale ${moeda(a.atual)}`), CE.el('small', {}, a.faltam ? `Sai daqui a ${a.faltam} dia${a.faltam > 1 ? 's' : ''}` : 'Já pode resgatar')),
            CE.el('button', { class: 'botao secundario', type: 'button', 'data-resgatar': a.id, disabled: a.faltam > 0, onclick: () => operar(() => banco.resgatar(a.id)) }, 'Resgatar'))))) : null,
          b.scoreLog.length ? CE.el('details', { class: 'banco-score-log' }, CE.el('summary', {}, '📊 Por que meu nome mudou'), CE.el('ul', {}, b.scoreLog.map((s) => CE.el('li', {}, `${s.d > 0 ? '+' : ''}${s.d} · ${s.motivo}`)))) : null,
          CE.el('p', { class: 'cart-dica' }, `💡 Juros trabalham a seu favor na poupança e na aplicação, e contra você no empréstimo. Exemplo: pegando 100 moedas emprestadas, a dívida vira ${simula}. Quem paga as contas em dia tem limite maior e juros menores; com nome sujo, o banco não empresta. Repare: o banco cobra no empréstimo o dobro do que paga na aplicação (é assim que ele lucra). Enquanto deve, metade de cada salário vai para o banco.`),
          CE.el('h3', {}, 'Extrato do banco'),
          b.extrato.length ? CE.el('ul', { class: 'cart-extrato' }, b.extrato.map((x) => CE.el('li', {},
            CE.el('span', { class: 'txt' }, CE.el('span', {}, x.motivo), CE.el('small', {}, quando(x.em))),
            CE.el('strong', { class: 'valor' + (x.valor < 0 ? ' gasto' : '') }, x.valor < 0 ? `−${moeda(-x.valor)}` : `+${moeda(x.valor)}`))))
            : CE.el('p', { class: 'cart-vazio' }, 'Nenhum movimento ainda. Candidate-se a uma vaga na Praça Escola (💼 Vagas): o salário cai aqui.')));
      }
      const lista = () => CE.el('ul', { class: 'cart-premios' }, PREMIOS.map((p) => CE.el('li', {},
        CE.el('span', { 'aria-hidden': 'true' }, p.icone), CE.el('span', { class: 'txt' }, p.texto), CE.el('strong', {}, `+${p.valor}`))));
      desenhar();
      const parar = [CE.ouvir('carteira:ganhou', desenhar), CE.ouvir('carteira:gastou', desenhar), CE.ouvir('banco:mudou', desenhar)];
      return { aoFechar() { parar.forEach((f) => f()); return true; } };
    },
  });

  document.addEventListener('DOMContentLoaded', () => {
    const b = document.getElementById('status-moedas');
    if (b) b.addEventListener('click', () => CE.carteira.abrir());
  });
})();
