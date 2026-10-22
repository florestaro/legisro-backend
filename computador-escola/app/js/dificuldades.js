// Onde a turma trava: cada aluno guarda no próprio progresso, para cada passo de aula, quantas vezes
//   naoEntendi — apertou "🙋 Não entendi"
//   dica       — ficou parado até o Professor Virtual mostrar a dica sozinho
//   erro       — errou uma pergunta
//   desistiu   — saiu da aula no meio
// O Painel do Instrutor soma isso para a turma e mostra os passos mais difíceis.
window.CE = window.CE || {};

(function () {
  const PESOS = { naoEntendi: 3, desistiu: 3, erro: 1, dica: 1 };

  CE.dificuldades = {
    TIPOS: [
      ['naoEntendi', '🙋', 'Não entendi'],
      ['dica', '💡', 'Precisou de dica'],
      ['erro', '❌', 'Erros nas perguntas'],
      ['desistiu', '🚪', 'Saiu da aula'],
    ],

    // Só conta para alunos (o instrutor testando uma aula não entra na conta).
    registrar(idLicao, passo, tipo) {
      const u = CE.sessao.usuario;
      if (!u || u.papel === 'instrutor' || !PESOS[tipo]) return Promise.resolve();
      return CE.sessao.atualizarProgresso((p) => {
        p.dificuldades = p.dificuldades || {};
        const daAula = (p.dificuldades[idLicao] = p.dificuldades[idLicao] || {});
        const doPasso = (daAula[passo] = daAula[passo] || {});
        doPasso[tipo] = (doPasso[tipo] || 0) + 1;
        doPasso.em = Date.now();
      }).catch(() => {});
    },

    // Total de pedidos de ajuda de um aluno (para o relatório).
    pedidosDeAjuda(progresso) {
      return Object.values(progresso.dificuldades || {}).reduce((s, aula) => s + Object.values(aula).reduce((t, c) => t + (c.naoEntendi || 0), 0), 0);
    },

    // Junta os alunos: [{ licao, passo, texto, alunos: [nomes], totais: {naoEntendi, dica, erro, desistiu}, peso }],
    // do passo mais difícil para o mais fácil. "alunos" é a lista [{ usuario, progresso }].
    somar(alunos) {
      const passos = new Map();
      for (const { usuario, progresso } of alunos) {
        for (const [idLicao, daAula] of Object.entries(progresso.dificuldades || {})) {
          const licao = CE.curso.licao(idLicao);
          if (!licao) continue;
          for (const [passo, contagem] of Object.entries(daAula)) {
            const n = Number(passo);
            const chave = `${idLicao}|${n}`;
            let item = passos.get(chave);
            if (!item) {
              const p = licao.passos[n];
              const texto = p ? (p.quiz ? `❓ ${p.quiz.pergunta}` : p.texto || '') : '';
              const limpo = String(texto).replace(/\s+/g, ' ').trim();
              item = { licao, passo: n, texto: limpo.length > 140 ? limpo.slice(0, 139) + '…' : limpo, alunos: [], totais: { naoEntendi: 0, dica: 0, erro: 0, desistiu: 0 }, peso: 0 };
              passos.set(chave, item);
            }
            let deste = 0;
            for (const tipo of Object.keys(PESOS)) {
              const v = Number(contagem[tipo]) || 0;
              item.totais[tipo] += v;
              deste += v * PESOS[tipo];
            }
            if (deste > 0) { item.alunos.push(usuario.nome); item.peso += deste; }
          }
        }
      }
      return [...passos.values()].filter((i) => i.peso > 0).sort((a, b) => b.alunos.length - a.alunos.length || b.peso - a.peso);
    },
  };
})();
