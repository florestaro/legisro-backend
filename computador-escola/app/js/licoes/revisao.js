// Revisão rápida: com aula uma vez por semana, o aluno esquece de uma semana para a outra. No primeiro login do dia,
// o professor faz até 3 perguntas das últimas aulas que o aluno fez (uns 2 minutos). Errar não reprova nada: se o
// aluno esqueceu bastante, o professor sugere rever a aula antes de seguir. O instrutor pode desligar no Painel.
// Fica no progresso do aluno: revisao = { dia, em, nota, licoes, pulada }.
window.CE = window.CE || {};

(function () {
  const { info } = CE.L;
  const PERGUNTAS = 3;
  const AULAS_RECENTES = 3;

  CE.LICOES_ESPECIAIS = CE.LICOES_ESPECIAIS || {};
  let ligadaNaEscola = true;
  let origem = null;   // aula de onde veio a pergunta em andamento
  let erros = {};      // aula -> perguntas que o aluno não acertou de primeira
  let progressoCache = null; // progresso lido no fim da última aula (para escolher as perguntas bônus)

  const registro = (p, l) => (p.licoes && p.licoes[l.id]) || {};
  // As últimas aulas que o aluno fez de verdade (as dispensadas pelo nivelamento não contam) e que têm perguntas.
  const recentes = (p) => CE.LICOES
    .filter((l) => CE.curso.aprovada(l, p) && !registro(p, l).dispensada && l.passos.some((s) => s.quiz))
    .sort((a, b) => (registro(p, b).em || 0) - (registro(p, a).em || 0))
    .slice(0, AULAS_RECENTES);

  // Uma pergunta de cada aula recente (a mais recente primeiro) e, se faltar, mais da mais recente.
  function escolherPerguntas(aulas) {
    const sorteio = (lista) => lista.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
    const porAula = aulas.map((l) => sorteio(l.passos.filter((s) => s.quiz)).map((s) => ({ aula: l, quiz: s.quiz })));
    const escolhidas = [];
    for (let rodada = 0; escolhidas.length < PERGUNTAS && porAula.some((x) => x.length > rodada); rodada++) {
      porAula.forEach((x) => { if (x[rodada] && escolhidas.length < PERGUNTAS) escolhidas.push(x[rodada]); });
    }
    return escolhidas;
  }

  CE.ouvir('quiz:respondido', (d) => {
    if (origem && !d.primeira) erros[origem.id] = (erros[origem.id] || 0) + 1;
  });

  CE.revisao = {
    // Vem dos dados da escola (o instrutor liga e desliga em Painel › Progresso da turma).
    configurar(ligada) { ligadaNaEscola = ligada !== false; },
    ligada: () => ligadaNaEscola,
    // Oferecida uma vez por dia, a quem fez alguma aula com perguntas antes de hoje.
    deveOferecer(p) {
      if (!ligadaNaEscola || !CE.sessao.usuario || CE.sessao.usuario.papel === 'instrutor') return false;
      const hoje = CE.frequencia.hoje();
      if (p.revisao && p.revisao.dia === hoje) return false;
      const aulas = recentes(p);
      return aulas.length > 0 && CE.frequencia.diaDe(new Date(registro(p, aulas[0]).em || Date.now())) !== hoje;
    },
    // Monta a revisão do dia com as perguntas das últimas aulas.
    montar(p) {
      const aulas = recentes(p);
      const perguntas = escolherPerguntas(aulas);
      if (!perguntas.length) return null;
      erros = {};
      origem = null;
      const nomes = aulas.map((l) => `"${l.titulo}"`);
      const licao = {
        id: 'revisao', titulo: 'Revisão rápida', icone: '🔁', nivel: aulas[0].nivel, especial: true,
        descricao: 'Perguntas das últimas aulas, para não esquecer.',
        passos: [
          info(`Revisão rápida! Vamos lembrar o que você aprendeu ${nomes.length > 1 ? `nas aulas ${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}` : `na aula ${nomes[0]}`}. São só ${perguntas.length} pergunta${perguntas.length > 1 ? 's' : ''}. Se errar, tudo bem: é só tentar outra resposta. Clique em "Continuar".`, { emoji: '🔁' }),
          ...perguntas.map(({ aula, quiz }) => ({
            quiz: { ...quiz, explicacao: `${quiz.explicacao ? quiz.explicacao + ' ' : ''}(Da aula "${aula.titulo}".)` },
            preparar: () => { origem = aula; },
          })),
        ],
        async aoConcluir({ nota }) {
          origem = null;
          const esquecida = aulas.filter((l) => erros[l.id]).sort((a, b) => erros[b.id] - erros[a.id])[0] || null;
          await CE.sessao.atualizarProgresso((pr) => {
            pr.revisao = { dia: CE.frequencia.hoje(), em: Date.now(), nota, licoes: aulas.map((l) => l.id) };
          });
          CE.emitir('revisao:concluida', { nota, licoes: aulas.map((l) => l.id), rever: esquecida && esquecida.id });
          const precisaRever = nota < CE.curso.NOTA_MINIMA && esquecida;
          return precisaRever
            ? { titulo: '🔁 Revisão feita', texto: `Você acertou ${nota}% de primeira. É normal esquecer de uma semana para a outra! Se quiser, reveja a aula "${esquecida.titulo}" antes de seguir. Ou clique no botão verde para começar a aula de hoje.`, rever: esquecida, botaoProxima: 'Começar a aula de hoje ▶' }
            : { titulo: '🔁 Revisão feita!', texto: `Muito bem! Você acertou ${nota}% de primeira e lembrou do que aprendeu. Agora clique no botão verde para começar a aula de hoje.`, botaoProxima: 'Começar a aula de hoje ▶' };
        },
      };
      CE.LICOES_ESPECIAIS.revisao = licao;
      return licao;
    },
    // Perguntas bônus do modo desafio: 3 perguntas de OUTRAS aulas já feitas do mesmo nível (as do mesmo módulo
    // primeiro), sem ajuda. Não mudam nada no curso: acertar todas de primeira dá uma estrela de desafio.
    montarBonus(terminada) {
      const p = progressoCache;
      const feitas = CE.LICOES.filter((l) => l !== terminada && l.nivel === terminada.nivel && l.passos.some((s) => s.quiz)
        && (!p || CE.curso.aprovada(l, p)));
      const ordem = feitas.filter((l) => l.modulo === terminada.modulo).concat(feitas.filter((l) => l.modulo !== terminada.modulo));
      const perguntas = [];
      for (const l of ordem) {
        const qs = l.passos.filter((s) => s.quiz);
        const q = qs[(l.id.length + perguntas.length) % qs.length];
        perguntas.push({ aula: l, quiz: q.quiz });
        if (perguntas.length >= 3) break;
      }
      if (perguntas.length < 2) return null;
      CE.LICOES_ESPECIAIS.bonus = {
        id: 'bonus', titulo: 'Perguntas bônus', icone: '🏅', nivel: terminada.nivel, especial: true, desafio: true,
        descricao: 'Perguntas mais difíceis, de outras aulas, só para quem está no modo desafio.',
        passos: [
          info(`🏅 Perguntas bônus! São ${perguntas.length} perguntas de outras aulas do nível, sem ajuda. Para ganhar a estrela de desafio, acerte todas de primeira. Clique em "Continuar".`, { emoji: '🏅' }),
          ...perguntas.map(({ aula, quiz }) => ({ quiz: { ...quiz, explicacao: `${quiz.explicacao ? quiz.explicacao + ' ' : ''}(Da aula "${aula.titulo}".)` } })),
        ],
        async aoConcluir({ nota }) {
          await CE.sessao.atualizarProgresso((pr) => {
            pr.ritmo = pr.ritmo || {};
            pr.ritmo.bonus = (pr.ritmo.bonus || 0) + (nota === 100 ? 1 : 0);
          });
          CE.emitir('ritmo:bonus', { nota });
          return nota === 100
            ? { titulo: '🏅 Bônus completo!', texto: `Acertou tudo de primeira: ${nota}%. Você ganhou uma estrela de desafio!`, comemorar: true }
            : { titulo: '🏅 Bônus feito', texto: `Você acertou ${nota}% de primeira. Na próxima aula tem mais!` };
        },
      };
      return CE.LICOES_ESPECIAIS.bonus;
    },
    lembrarProgresso(p) { progressoCache = p; },
    // O aluno preferiu ir direto para a aula: não pergunta de novo hoje.
    pular() {
      return CE.sessao.atualizarProgresso((pr) => { pr.revisao = { dia: CE.frequencia.hoje(), em: Date.now(), pulada: true }; });
    },
  };
})();
