// Medalhas: conquistas que o aluno ganha ao longo do curso.
window.CE = window.CE || {};

(function () {
  // Medalha é para aula feita de verdade: aulas dispensadas pelo nivelamento não contam.
  const feita = (l, p) => CE.curso.aprovada(l, p) && !p.licoes[l.id].dispensada;
  const moduloAprovado = (p, modulo) => {
    const aulas = CE.LICOES.filter((l) => l.modulo === modulo);
    return aulas.length > 0 && aulas.every((l) => feita(l, p));
  };
  const digAprovado = (p, id) => !!(p.digitacao && p.digitacao[id] && p.digitacao[id].aprovado && !p.digitacao[id].dispensado);
  const melhorPpm = (p) => Math.max(0, ...Object.entries(p.digitacao || {}).filter(([k]) => !k.startsWith('_')).map(([, r]) => r.ppm || 0));
  const exerciciosAprovados = (p) => Object.entries(p.digitacao || {}).filter(([k, r]) => !k.startsWith('_') && r.aprovado && !r.dispensado).length;

  CE.MEDALHAS = [
    { id: 'primeira-aula', icone: '🎓', nome: 'Primeira aula', descricao: 'Concluiu a primeira aula.', ganhou: (p) => CE.LICOES.some((l) => feita(l, p)) },
    { id: 'computador', icone: '🖥️', nome: 'Conhece o computador', descricao: 'Terminou o módulo "Conhecendo o computador".', ganhou: (p) => moduloAprovado(p, 'n1-computador') },
    { id: 'mouse', icone: '🖱️', nome: 'Mestre do mouse', descricao: 'Terminou todas as aulas e jogos do mouse.', ganhou: (p) => moduloAprovado(p, 'n1-mouse') },
    { id: 'teclado', icone: '⌨️', nome: 'Amigo do teclado', descricao: 'Terminou o módulo do teclado.', ganhou: (p) => moduloAprovado(p, 'n1-teclado') },
    { id: 'janelas', icone: '🪟', nome: 'Domador de janelas', descricao: 'Terminou o módulo de janelas e menu Iniciar.', ganhou: (p) => moduloAprovado(p, 'n1-janelas') },
    { id: 'arquivos', icone: '📁', nome: 'Organizado', descricao: 'Terminou o módulo de arquivos e pastas.', ganhou: (p) => moduloAprovado(p, 'n1-arquivos') },
    { id: 'escritor', icone: '📝', nome: 'Escritor', descricao: 'Terminou o módulo do Editor de Texto.', ganhou: (p) => moduloAprovado(p, 'n1-editor') },
    { id: 'artista', icone: '🎨', nome: 'Artista', descricao: 'Terminou o módulo de Calculadora e Desenho.', ganhou: (p) => moduloAprovado(p, 'n1-desenho') },
    { id: 'internet', icone: '🌐', nome: 'Navegante', descricao: 'Terminou o módulo de Internet.', ganhou: (p) => moduloAprovado(p, 'n1-internet') },
    { id: 'antigolpe', icone: '🕵️', nome: 'Detetive de golpes', descricao: 'Saiu de um site falso sem cair no golpe.', ganhou: (p) => !!(p.navegador && p.navegador.golpesEvitados) },
    { id: 'seguranca', icone: '🛡️', nome: 'Esperto contra golpes', descricao: 'Terminou o módulo de segurança.', ganhou: (p) => moduloAprovado(p, 'n1-seguranca') },
    { id: 'formado-n1', icone: '🏆', nome: 'Formado no Iniciante', descricao: 'Passou na prova do nível Iniciante de informática.', ganhou: (p) => moduloAprovado(p, 'n1-prova') },
    { id: 'n2-pastas', icone: '🗂️', nome: 'Organizador', descricao: 'Terminou o módulo de organização de arquivos e pen drive.', ganhou: (p) => moduloAprovado(p, 'n2-pastas') },
    { id: 'n2-atalhos', icone: '⚡', nome: 'Rápido no teclado', descricao: 'Terminou o módulo de atalhos de teclado.', ganhou: (p) => moduloAprovado(p, 'n2-atalhos') },
    { id: 'n2-editor', icone: '✒️', nome: 'Redator', descricao: 'Terminou o Editor de Texto intermediário.', ganhou: (p) => moduloAprovado(p, 'n2-editor') },
    { id: 'n2-planilha', icone: '📊', nome: 'Rei da planilha', descricao: 'Terminou o módulo de Planilha.', ganhou: (p) => moduloAprovado(p, 'n2-planilha') },
    { id: 'n2-email', icone: '📧', nome: 'Carteiro digital', descricao: 'Terminou o módulo de e-mail.', ganhou: (p) => moduloAprovado(p, 'n2-email') },
    { id: 'n2-servicos', icone: '🏛️', nome: 'Cidadão digital', descricao: 'Terminou o módulo de banco e serviços digitais.', ganhou: (p) => moduloAprovado(p, 'n2-servicos') },
    { id: 'formado-n2', icone: '🏆', nome: 'Formado no Intermediário', descricao: 'Passou na prova do nível Intermediário de informática.', ganhou: (p) => moduloAprovado(p, 'n2-prova') },
    { id: 'n3-editor', icone: '🎓', nome: 'Escritor avançado', descricao: 'Terminou o Editor de Texto avançado (trabalho escolar).', ganhou: (p) => moduloAprovado(p, 'n3-editor') },
    { id: 'n3-planilha', icone: '📈', nome: 'Mestre das planilhas', descricao: 'Terminou a Planilha avançada.', ganhou: (p) => moduloAprovado(p, 'n3-planilha') },
    { id: 'n3-apresentacoes', icone: '🎤', nome: 'Apresentador', descricao: 'Terminou o módulo de Apresentações.', ganhou: (p) => moduloAprovado(p, 'n3-apresentacoes') },
    { id: 'n3-config', icone: '🧰', nome: 'Técnico do computador', descricao: 'Terminou o módulo de Configurações.', ganhou: (p) => moduloAprovado(p, 'n3-config') },
    { id: 'n3-seguranca', icone: '🛡️', nome: 'Guardião digital', descricao: 'Terminou a Segurança digital avançada.', ganhou: (p) => moduloAprovado(p, 'n3-seguranca') },
    { id: 'n3-trabalho', icone: '💼', nome: 'Pronto para o trabalho', descricao: 'Terminou o módulo Computador e trabalho.', ganhou: (p) => moduloAprovado(p, 'n3-trabalho') },
    { id: 'n3-projeto', icone: '🎉', nome: 'Organizador de eventos', descricao: 'Concluiu o Projeto final.', ganhou: (p) => moduloAprovado(p, 'n3-projeto') },
    { id: 'formado-n3', icone: '🏆', nome: 'Formado no Avançado', descricao: 'Passou na prova do nível Avançado de informática.', ganhou: (p) => moduloAprovado(p, 'n3-prova') },
    { id: 'curso-completo', icone: '👑', nome: 'Curso completo', descricao: 'Passou nas provas dos três níveis de informática e na prova de digitação Avançada.', ganhou: (p) => CE.curso.aprovada(CE.curso.licao('prova-n3'), p) && CE.curso.aprovada(CE.curso.licao('prova-n2'), p) && digAprovado(p, 'prova-avancado') },
    { id: 'mouse-medio', icone: '🎯', nome: 'Mouse afiado', descricao: 'Venceu todos os Jogos do Mouse no nível Médio.', ganhou: (p) => CE.jogosMouse.venceuTodos(p, 'medio') },
    { id: 'mouse-dificil', icone: '🏅', nome: 'Campeão do mouse', descricao: 'Venceu todos os Jogos do Mouse no nível Difícil.', ganhou: (p) => CE.jogosMouse.venceuTodos(p, 'dificil') },
    { id: 'ppm-10', icone: '🐢', nome: '10 palavras por minuto', descricao: 'Digitou a 10 ppm batendo a meta.', ganhou: (p) => melhorPpm(p) >= 10 },
    { id: 'ppm-20', icone: '🐇', nome: '20 palavras por minuto', descricao: 'Digitou a 20 ppm.', ganhou: (p) => melhorPpm(p) >= 20 },
    { id: 'ppm-35', icone: '🐎', nome: '35 palavras por minuto', descricao: 'Digitou a 35 ppm.', ganhou: (p) => melhorPpm(p) >= 35 },
    { id: 'ppm-50', icone: '⚡', nome: 'Raio no teclado', descricao: 'Digitou a 50 ppm.', ganhou: (p) => melhorPpm(p) >= 50 },
    { id: 'persistente', icone: '💪', nome: 'Persistente', descricao: 'Bateu a meta em 25 exercícios de digitação.', ganhou: (p) => exerciciosAprovados(p) >= 25 },
    { id: 'dig-iniciante', icone: '🥉', nome: 'Digitador Iniciante', descricao: 'Passou na prova de digitação do nível Iniciante.', ganhou: (p) => digAprovado(p, 'prova-iniciante') },
    { id: 'dig-intermediario', icone: '🥈', nome: 'Digitador Intermediário', descricao: 'Passou na prova de digitação do nível Intermediário.', ganhou: (p) => digAprovado(p, 'prova-intermediario') },
    { id: 'dig-avancado', icone: '🥇', nome: 'Digitador Avançado', descricao: 'Passou na prova de digitação do nível Avançado.', ganhou: (p) => digAprovado(p, 'prova-avancado') },
    { id: 'chuva', icone: '🌧️', nome: 'Rei da chuva', descricao: 'Fez 100 pontos na Chuva de palavras.', ganhou: (p) => ((p.digitacao && p.digitacao._jogos && p.digitacao._jogos.chuva) || 0) >= 100 },
  ];

  CE.medalhas = {
    // Confere se o aluno ganhou medalhas novas e comemora cada uma.
    async verificar() {
      if (!CE.sessao.usuario) return;
      const novas = [];
      await CE.sessao.atualizarProgresso((p) => {
        p.medalhas = p.medalhas || {};
        CE.MEDALHAS.forEach((m) => {
          if (!p.medalhas[m.id] && m.ganhou(p)) { p.medalhas[m.id] = Date.now(); novas.push(m); }
        });
      });
      novas.forEach((m, i) => setTimeout(() => {
        CE.avisar(`🏅 Nova medalha: ${m.icone} ${m.nome}!`);
        CE.emitir('medalha:ganha', { medalha: m.id });
      }, 1200 + i * 3200));
      return novas;
    },
  };

  ['licao:concluida', 'digitacao:concluida', 'digitacao:jogo', 'jogo:concluido'].forEach((evento) => CE.ouvir(evento, () => CE.medalhas.verificar()));
  CE.ouvir('golpe:evitado', async () => {
    if (!CE.sessao.usuario) return;
    await CE.sessao.atualizarProgresso((p) => { p.navegador = p.navegador || {}; p.navegador.golpesEvitados = (p.navegador.golpesEvitados || 0) + 1; });
    CE.medalhas.verificar();
  });
})();
