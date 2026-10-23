// Estrutura do curso de informática: níveis -> módulos -> aulas.
// As aulas ficam liberadas em sequência: o aluno só abre a próxima quando foi aprovado na anterior
// (aulas com perguntas exigem 70% de acertos). O instrutor tem tudo liberado e pode liberar aulas fora da
// sequência para os alunos (veja liberadaPeloInstrutor).
// Trilha essencial (o padrão): para turmas com pouco tempo (1 hora por semana, por exemplo). O aluno segue só as
// aulas essenciais; as outras viram "Reforço (opcional)": abrem junto com a aula essencial seguinte, mas não
// travam o curso nem o certificado. Na trilha completa, todas as aulas são obrigatórias.
window.CE = window.CE || {};

(function () {
  const NOTA_MINIMA = 70;

  CE.NIVEIS_CURSO = [
    { id: 'n1', nome: 'Iniciante', icone: '🌱', descricao: 'Usar o computador com confiança' },
    { id: 'n2', nome: 'Intermediário', icone: '🌿', descricao: 'Computador para estudo e trabalho' },
    { id: 'n3', nome: 'Avançado', icone: '🌳', descricao: 'Produtividade e autonomia' },
  ];

  // Aulas de reforço: treino a mais, desafios de módulo e assuntos que as provas não cobram.
  const REFORCO = new Set([
    // Iniciante
    'pc-aparelhos', 'pc-desafio', 'mouse-mira', 'mouse-desafio', 'teclado-digitacao', 'teclado-desafio',
    'janelas-varias', 'janelas-botao-direito', 'janelas-desafio', 'arquivos-desafio', 'editor-lista', 'editor-cartao',
    'editor-desafio', 'desenho-casa', 'desenho-desafio', 'net-abas', 'net-loja', 'net-desafio', 'seg-cuidados',
    // Intermediário
    'n2-pastas-pesquisar', 'n2-pastas-desafio', 'n2-atalhos-gerais', 'n2-editor-paragrafos', 'n2-editor-requerimento',
    'n2-editor-desafio', 'n2-pl-alca', 'n2-pl-formatar', 'n2-pl-notas', 'n2-pl-desafio', 'n2-email-desafio', 'n2-servicos-desafio',
    // Avançado
    'n3-ed-colunas', 'n3-ed-substituir', 'n3-ed-desafio', 'n3-pl-destacar', 'n3-pl-procv', 'n3-pl-desafio', 'n3-ap-desafio',
    'n3-cfg-hora-som', 'n3-cfg-atualizar', 'n3-cfg-impressora', 'n3-cfg-desafio', 'n3-seg-desafio', 'n3-tr-desafio',
  ]);
  const TRILHAS = { essencial: 'Trilha essencial', completa: 'Trilha completa' };

  CE.MODULOS = [];
  CE.LICOES = [];
  CE.LICOES_EXTRAS = []; // aulas criadas pelo instrutor (ficam fora da sequência do curso)

  // Usado pelos arquivos de lições: registra um módulo com as suas aulas, na ordem do curso.
  CE.adicionarModulo = function ({ id, nivel, titulo, icone, licoes }) {
    CE.MODULOS.push({ id, nivel, titulo, icone });
    licoes.forEach((l) => CE.LICOES.push({ ...l, modulo: id, nivel, reforco: REFORCO.has(l.id) }));
  };

  const ehInstrutor = () => CE.sessao.usuario && CE.sessao.usuario.papel === 'instrutor';

  // A trilha da escola vem dos dados da escola (no modo sala de aula, do computador do instrutor). Cada aluno
  // pode ter a sua (progresso.trilha), que o instrutor escolhe em "🔓 Liberar aulas".
  let trilhaDaEscola = 'essencial';
  let carregando = null;
  const valida = (t) => (TRILHAS[t] ? t : null);

  CE.curso = {
    NOTA_MINIMA,
    modulo: (id) => CE.MODULOS.find((m) => m.id === id),
    licao: (id) => CE.LICOES.find((l) => l.id === id) || CE.LICOES_EXTRAS.find((l) => l.id === id) || (CE.LICOES_ESPECIAIS && CE.LICOES_ESPECIAIS[id]),
    aprovada(licao, progresso) {
      const r = progresso.licoes && progresso.licoes[licao.id];
      return !!(r && r.concluida);
    },
    TRILHAS,
    // Lê de novo a trilha da escola e se a revisão rápida está ligada (no login e ao abrir as Aulas).
    // Sem conexão, fica a última conhecida.
    carregarTrilha() {
      carregando = CE.api.chamar('escola:ler').then((e) => {
        trilhaDaEscola = valida(e && e.trilha) || 'essencial';
        if (CE.revisao) CE.revisao.configurar(e && e.revisao);
      }).catch(() => {});
      return carregando;
    },
    trilhaPronta: () => carregando || CE.curso.carregarTrilha(),
    trilhaDaEscola: () => trilhaDaEscola,
    trilha: (progresso) => valida(progresso && progresso.trilha) || trilhaDaEscola,
    // A aula conta para o curso (e para o certificado) na trilha deste aluno?
    obrigatoria: (licao, progresso) => !licao.reforco || CE.curso.trilha(progresso) === 'completa',
    // Só as aulas que contam, de um nível ou módulo (ou do curso todo).
    aulasDaTrilha(progresso, filtro = {}) {
      return CE.LICOES.filter((l) => (!filtro.nivel || l.nivel === filtro.nivel) && (!filtro.modulo || l.modulo === filtro.modulo)
        && CE.curso.obrigatoria(l, progresso));
    },
    // A aula obrigatória que vem antes desta (as de reforço não travam ninguém).
    anteriorNaTrilha(licao, progresso) {
      for (let i = CE.LICOES.indexOf(licao) - 1; i >= 0; i--) if (CE.curso.obrigatoria(CE.LICOES[i], progresso)) return CE.LICOES[i];
      return null;
    },
    liberada(licao, progresso) {
      if (ehInstrutor() || licao.especial || licao.extra) return true;
      if (CE.curso.liberadaPeloInstrutor(licao, progresso)) return true;
      const anterior = CE.curso.anteriorNaTrilha(licao, progresso);
      return !anterior || CE.curso.aprovada(anterior, progresso);
    },
    // O instrutor pode liberar aulas fora da sequência para um aluno: um nível inteiro ("nivel:n2"), um módulo
    // ("modulo:<id>") ou aulas avulsas (o id da aula). Fica no progresso do aluno, em "liberadas".
    liberadaPeloInstrutor(licao, progresso) {
      const lib = (progresso && progresso.liberadas) || {};
      return !!(lib[licao.id] || lib[`modulo:${licao.modulo}`] || lib[`nivel:${licao.nivel}`]);
    },
    proxima(progresso) {
      return CE.curso.aulasDaTrilha(progresso).find((l) => !CE.curso.aprovada(l, progresso));
    },
    // Aula de reforço do mesmo módulo, já aberta e ainda não feita (para oferecer "Treinar mais" ao fim de uma aula).
    reforcoPendente(progresso, licao) {
      return CE.LICOES.find((l) => l.modulo === licao.modulo && l !== licao && !CE.curso.obrigatoria(l, progresso)
        && !CE.curso.aprovada(l, progresso) && CE.curso.liberada(l, progresso)) || null;
    },
    // Posição na trilha: "aula 5 de 29 do nível Iniciante".
    posicao(licao, progresso) {
      const lista = CE.curso.aulasDaTrilha(progresso, { nivel: licao.nivel });
      const i = lista.indexOf(licao);
      return i < 0 ? null : { numero: i + 1, total: lista.length, nivel: CE.NIVEIS_CURSO.find((n) => n.id === licao.nivel) };
    },
    // Resumo para o painel do instrutor (conta só as aulas da trilha do aluno).
    resumo(progresso) {
      const daTrilha = CE.curso.aulasDaTrilha(progresso);
      const aprovadas = daTrilha.filter((l) => CE.curso.aprovada(l, progresso));
      const notas = aprovadas.map((l) => progresso.licoes[l.id].nota).filter((n) => n != null);
      const proxima = CE.curso.proxima(progresso);
      return {
        aprovadas: aprovadas.length,
        total: daTrilha.length,
        reforcos: CE.LICOES.filter((l) => !CE.curso.obrigatoria(l, progresso) && CE.curso.aprovada(l, progresso)).length,
        trilha: CE.curso.trilha(progresso),
        media: notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : null,
        proxima,
        nivelAtual: proxima ? CE.NIVEIS_CURSO.find((n) => n.id === proxima.nivel) : CE.NIVEIS_CURSO[0],
      };
    },
  };
})();
