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
    { id: 'n4', nome: 'Profissional', icone: '💼', descricao: 'Informática para o trabalho (como os cursos de Operador de Computador)' },
    { id: 'n5', nome: 'Assistente Administrativo', icone: '🗂️', descricao: 'Rotinas de escritório com o sistema da empresa (como o curso do Senac)',
      certificado: { curso: 'Assistente Administrativo', nivel: 'Nível 5 — Informática aplicada às rotinas de escritório' } },
    // Cursos livres: correm em paralelo ao curso principal. Abrem quando o aluno termina o nível pedido em "requer"
    // e não travam o curso principal (nem são travados por ele).
    { id: 'cel', nome: 'Celular no dia a dia', icone: '📱', paralelo: true, requer: 'n1', descricao: 'Usar o celular com segurança: mensagens, Pix, golpes e configurações',
      certificado: { curso: 'Celular no Dia a Dia', nivel: 'Curso livre — uso seguro do smartphone' } },
    { id: 'cri', nome: 'Criação digital', icone: '🎨', paralelo: true, requer: 'n2', descricao: 'Fotos, vídeos e desenho vetorial: cartazes, posts e vídeos curtos',
      certificado: { curso: 'Criação Digital', nivel: 'Curso livre — fotos, vídeos e desenho vetorial' } },
    // Sem "requer": abre desde o começo (as crianças fazem junto com o Iniciante).
    { id: 'esc', nome: 'Trabalhos da escola', icone: '🎒', paralelo: true, descricao: 'Pesquisar na internet sem cair em propaganda e fazer trabalhos no Editor: resumo, cartaz e capa',
      certificado: { curso: 'Trabalhos Escolares no Computador', nivel: 'Curso livre — pesquisa segura e trabalhos no Editor de Texto' } },
  ];
  const nivelDe = (id) => CE.NIVEIS_CURSO.find((n) => n.id === id) || {};
  // Cada aula pertence a uma "cadeia": a do curso principal (n1 a n5) ou a de um curso livre.
  const cadeia = (l) => (nivelDe(l.nivel).paralelo ? l.nivel : 'principal');

  // Aulas de reforço: treino a mais, desafios de módulo e assuntos que as provas não cobram.
  const REFORCO = new Set([
    // Iniciante
    'pc-aparelhos', 'pc-desafio', 'mouse-mira', 'mouse-desafio', 'teclado-digitacao', 'teclado-desafio',
    'janelas-varias', 'janelas-botao-direito', 'janelas-desafio', 'arquivos-desafio', 'editor-lista', 'editor-cartao',
    'editor-desafio', 'desenho-casa', 'desenho-desafio', 'net-abas', 'net-loja', 'net-desafio', 'seg-cuidados',
    // Intermediário
    'n2-pastas-pesquisar', 'n2-pastas-desafio', 'n2-atalhos-gerais', 'n2-editor-paragrafos', 'n2-editor-requerimento',
    'n2-editor-desafio', 'n2-pl-alca', 'n2-pl-formatar', 'n2-pl-notas', 'n2-pl-desafio', 'n2-email-desafio', 'n2-servicos-desafio',
    'n2-gov-desafio', 'n2-ia-desafio', 'n2-doc-desafio', 'n2-golpe-tarefas', 'n2-golpe-pix', 'n2-golpe-desafio',
    // Avançado
    'n3-ed-colunas', 'n3-ed-substituir', 'n3-ed-desafio', 'n3-pl-destacar', 'n3-pl-procv', 'n3-pl-desafio', 'n3-ap-desafio',
    'n3-cfg-hora-som', 'n3-cfg-atualizar', 'n3-cfg-impressora', 'n3-cfg-desafio', 'n3-seg-desafio', 'n3-tr-desafio',
    'n3-din-parcelado', 'n3-din-desafio', 'n3-ven-desafio',
    // Profissional
    'n4-win-inicializar', 'n4-win-desafio', 'n4-ed-formas', 'n4-ed-desafio', 'n4-pl-imprimir', 'n4-pl-desafio', 'n4-ap-desafio',
    'n4-em-pastas', 'n4-ag-desafio', 'n4-hw-desafio',
    // Assistente Administrativo
    'n5-at-desafio', 'n5-doc-digitalizar', 'n5-doc-desafio', 'n5-fin-juros', 'n5-fin-desafio', 'n5-est-desafio', 'n5-rh-admissao',
    // Curso livre Celular
    'cel-ajustes', 'cel-boato', 'cel-qrcode', 'cel-mapa', 'cel-desafio',
    // Curso livre Criação digital
    'cri-foto-tamanho', 'cri-foto-direitos', 'cri-vet-pixel', 'cri-vid-titulo', 'cri-desafio',
    // Curso livre Trabalhos da escola
    'esc-capa', 'esc-desafio', 'esc-cartaz',
  ]);
  const TRILHAS = { essencial: 'Trilha essencial', completa: 'Trilha completa' };

  // Trilhas por objetivo: o aluno escolhe o que quer conseguir e o curso monta o caminho com as aulas que já existem
  // (as essenciais desses módulos, nesta ordem). As aulas do objetivo abrem uma depois da outra, mesmo fora da ordem
  // do curso, e viram a "próxima aula". O certificado continua sendo o do nível (o objetivo só muda o caminho).
  CE.OBJETIVOS = [
    { id: 'emprego', icone: '💼', nome: 'Arrumar emprego', texto: 'Currículo, e-mail com anexo, documentos em PDF e a prova prática de um processo seletivo.',
      modulos: ['n1-computador', 'n1-mouse', 'n1-teclado', 'n1-janelas', 'n1-arquivos', 'n1-editor', 'n1-internet', 'n2-email', 'n2-editor', 'n2-documentos', 'n2-emprego', 'n3-trabalho'] },
    { id: 'govbr', icone: '🏛️', nome: 'Resolver as coisas no gov.br', texto: 'Conta gov.br, serviços públicos pela internet, documentos em PDF e assinatura digital.',
      modulos: ['n1-computador', 'n1-mouse', 'n1-teclado', 'n1-janelas', 'n1-internet', 'n1-seguranca', 'n2-email', 'n2-gov', 'n2-documentos', 'n2-servicos'] },
    { id: 'vender', icone: '🛒', nome: 'Vender pelo celular e pela internet', texto: 'Celular, Zap, Pix, golpes, anúncios, dinheiro e MEI.',
      modulos: ['n1-computador', 'n1-mouse', 'n1-internet', 'n1-seguranca', 'cel-basico', 'cel-mensagens', 'cel-dinheiro', 'cel-golpes', 'n3-dinheiro', 'n3-vendas'] },
    { id: 'escola', icone: '🎒', nome: 'Fazer os trabalhos da escola', texto: 'Mouse, teclado, pesquisar na internet sem cair em propaganda e fazer o trabalho no Editor.',
      modulos: ['n1-computador', 'n1-mouse', 'n1-teclado', 'esc-trabalhos', 'n1-editor', 'n1-internet'] },
    { id: 'golpes', icone: '🛡️', nome: 'Me proteger dos golpes', texto: 'Senhas, golpes por mensagem, ligação, boleto, Pix e inteligência artificial.',
      modulos: ['n1-computador', 'n1-mouse', 'n1-internet', 'n1-seguranca', 'n2-golpes-agora', 'n2-ia', 'cel-golpes', 'n3-seguranca'] },
  ];
  const objetivoDe = (p) => CE.OBJETIVOS.find((o) => o.id === (p && p.objetivo)) || null;

  CE.MODULOS = [];
  CE.LICOES = [];
  CE.LICOES_EXTRAS = []; // aulas criadas pelo instrutor (ficam fora da sequência do curso)

  // Usado pelos arquivos de lições: registra um módulo com as suas aulas, na ordem do curso.
  // "antes": o módulo entra antes de outro (ex.: antes da prova do nível). "novoEm": data em que o módulo entrou no
  // curso; para quem já tinha passado na prova do nível antes dessa data, as aulas dele ficam opcionais.
  CE.adicionarModulo = function ({ id, nivel, titulo, icone, licoes, antes, novoEm }) {
    const modulo = { id, nivel, titulo, icone };
    const novas = licoes.map((l) => ({ ...l, modulo: id, nivel, reforco: REFORCO.has(l.id), novoEm: novoEm || l.novoEm }));
    const posicao = antes ? CE.MODULOS.findIndex((m) => m.id === antes) : -1;
    if (posicao < 0) { CE.MODULOS.push(modulo); CE.LICOES.push(...novas); return; }
    CE.MODULOS.splice(posicao, 0, modulo);
    CE.LICOES.splice(CE.LICOES.findIndex((l) => l.modulo === antes), 0, ...novas);
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
    objetivo: objetivoDe,
    // As aulas do objetivo do aluno, na ordem do caminho (sem as provas de nível e sem as de reforço da trilha).
    aulasDoObjetivo(progresso, obj = objetivoDe(progresso)) {
      if (!obj) return [];
      const lista = [];
      for (const m of obj.modulos) lista.push(...CE.LICOES.filter((l) => l.modulo === m && !l.prova && CE.curso.obrigatoria(l, progresso)));
      return lista;
    },
    // A aula está no caminho do objetivo e a anterior do caminho já foi feita?
    liberadaPeloObjetivo(licao, progresso) {
      const lista = CE.curso.aulasDoObjetivo(progresso);
      const i = lista.indexOf(licao);
      return i === 0 || (i > 0 && CE.curso.aprovada(lista[i - 1], progresso));
    },
    // A aula conta para o curso (e para o certificado) na trilha deste aluno?
    obrigatoria(licao, progresso) {
      if (licao.reforco && CE.curso.trilha(progresso) !== 'completa') return false;
      return !(licao.novoEm && CE.curso.provaAntesDe(licao.nivel, progresso, licao.novoEm));
    },
    // O aluno passou na prova do nível antes da data? (As aulas que entraram no curso depois não travam quem já
    // tinha terminado o nível, nem tiram o certificado dele.)
    provaAntesDe(nivel, progresso, data) {
      const prova = CE.LICOES.find((l) => l.nivel === nivel && l.prova);
      const r = prova && progresso && progresso.licoes && progresso.licoes[prova.id];
      return !!(r && r.concluida && (r.aprovadaEm || r.em || 0) < Date.parse(data));
    },
    // Só as aulas que contam, de um nível ou módulo (ou do curso todo).
    aulasDaTrilha(progresso, filtro = {}) {
      return CE.LICOES.filter((l) => (!filtro.nivel || l.nivel === filtro.nivel) && (!filtro.modulo || l.modulo === filtro.modulo)
        && CE.curso.obrigatoria(l, progresso));
    },
    // A aula obrigatória que vem antes desta (as de reforço não travam ninguém).
    // Nos cursos livres, a primeira aula depende da última aula do nível pedido (a prova dele).
    anteriorNaTrilha(licao, progresso) {
      const c = cadeia(licao);
      for (let i = CE.LICOES.indexOf(licao) - 1; i >= 0; i--) {
        const x = CE.LICOES[i];
        if (cadeia(x) === c && CE.curso.obrigatoria(x, progresso)) return x;
      }
      const req = c !== 'principal' && nivelDe(licao.nivel).requer;
      if (!req) return null;
      const lista = CE.curso.aulasDaTrilha(progresso, { nivel: req });
      return lista[lista.length - 1] || null;
    },
    nivel: nivelDe,
    paralelo: (id) => !!nivelDe(id).paralelo,
    // "nível Iniciante" ou "curso Celular no dia a dia" (para as frases do professor).
    rotulo: (id) => { const n = nivelDe(id); return n.paralelo ? `curso ${n.nome}` : `nível ${n.nome}`; },
    liberada(licao, progresso) {
      if (ehInstrutor() || licao.especial || licao.extra) return true;
      if (CE.curso.liberadaPeloInstrutor(licao, progresso)) return true;
      if (CE.curso.liberadaPeloObjetivo(licao, progresso)) return true;
      const anterior = CE.curso.anteriorNaTrilha(licao, progresso);
      return !anterior || CE.curso.aprovada(anterior, progresso);
    },
    // O instrutor pode liberar aulas fora da sequência para um aluno: um nível inteiro ("nivel:n2"), um módulo
    // ("modulo:<id>") ou aulas avulsas (o id da aula). Fica no progresso do aluno, em "liberadas".
    liberadaPeloInstrutor(licao, progresso) {
      const lib = (progresso && progresso.liberadas) || {};
      return !!(lib[licao.id] || lib[`modulo:${licao.modulo}`] || lib[`nivel:${licao.nivel}`]);
    },
    // A próxima aula: quem está no meio de um curso livre continua nele; senão, segue o curso principal; com o
    // principal terminado, o primeiro curso livre que já abriu.
    proxima(progresso) {
      const falta = (l) => !CE.curso.aprovada(l, progresso);
      // Com um objetivo escolhido, a próxima aula é a do caminho dele (até terminar o caminho).
      const doObjetivo = CE.curso.aulasDoObjetivo(progresso).find(falta);
      if (doObjetivo) return doObjetivo;
      const lista = CE.curso.aulasDaTrilha(progresso);
      const r = (l) => (progresso.licoes && progresso.licoes[l.id]) || {};
      const ultima = CE.LICOES.filter((l) => r(l).em && !r(l).dispensada).sort((a, b) => r(b).em - r(a).em)[0];
      if (ultima && CE.curso.paralelo(ultima.nivel)) {
        const seguir = lista.find((l) => l.nivel === ultima.nivel && falta(l));
        if (seguir && CE.curso.liberada(seguir, progresso)) return seguir;
      }
      return lista.find((l) => cadeia(l) === 'principal' && falta(l))
        || lista.find((l) => falta(l) && CE.curso.liberada(l, progresso));
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
        nivelAtual: proxima ? nivelDe(proxima.nivel) : CE.NIVEIS_CURSO[0],
      };
    },
  };
})();
