// Estrutura do curso de informática: níveis -> módulos -> aulas.
// As aulas ficam liberadas em sequência: o aluno só abre a próxima quando foi aprovado na anterior
// (aulas com perguntas exigem 70% de acertos). O instrutor tem tudo liberado.
window.CE = window.CE || {};

(function () {
  const NOTA_MINIMA = 70;

  CE.NIVEIS_CURSO = [
    { id: 'n1', nome: 'Iniciante', icone: '🌱', descricao: 'Usar o computador com confiança' },
    { id: 'n2', nome: 'Intermediário', icone: '🌿', descricao: 'Computador para estudo e trabalho' },
    { id: 'n3', nome: 'Avançado', icone: '🌳', descricao: 'Produtividade e autonomia' },
  ];

  CE.MODULOS = [];
  CE.LICOES = [];
  CE.LICOES_EXTRAS = []; // aulas criadas pelo instrutor (ficam fora da sequência do curso)

  // Usado pelos arquivos de lições: registra um módulo com as suas aulas, na ordem do curso.
  CE.adicionarModulo = function ({ id, nivel, titulo, icone, licoes }) {
    CE.MODULOS.push({ id, nivel, titulo, icone });
    licoes.forEach((l) => CE.LICOES.push({ ...l, modulo: id, nivel }));
  };

  const ehInstrutor = () => CE.sessao.usuario && CE.sessao.usuario.papel === 'instrutor';

  CE.curso = {
    NOTA_MINIMA,
    modulo: (id) => CE.MODULOS.find((m) => m.id === id),
    licao: (id) => CE.LICOES.find((l) => l.id === id) || CE.LICOES_EXTRAS.find((l) => l.id === id) || (CE.LICOES_ESPECIAIS && CE.LICOES_ESPECIAIS[id]),
    aprovada(licao, progresso) {
      const r = progresso.licoes && progresso.licoes[licao.id];
      return !!(r && r.concluida);
    },
    liberada(licao, progresso) {
      if (ehInstrutor() || licao.especial || licao.extra) return true;
      const i = CE.LICOES.indexOf(licao);
      return i <= 0 || CE.curso.aprovada(CE.LICOES[i - 1], progresso);
    },
    proxima(progresso) {
      return CE.LICOES.find((l) => !CE.curso.aprovada(l, progresso));
    },
    // Resumo para o painel do instrutor.
    resumo(progresso) {
      const aprovadas = CE.LICOES.filter((l) => CE.curso.aprovada(l, progresso));
      const notas = aprovadas.map((l) => progresso.licoes[l.id].nota).filter((n) => n != null);
      const proxima = CE.curso.proxima(progresso);
      return {
        aprovadas: aprovadas.length,
        total: CE.LICOES.length,
        media: notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : null,
        proxima,
        nivelAtual: proxima ? CE.NIVEIS_CURSO.find((n) => n.id === proxima.nivel) : CE.NIVEIS_CURSO[0],
      };
    },
  };
})();
