// Aulas criadas pelo instrutor no "Criar aulas" do Painel do Instrutor, sem programar.
// Cada aula tem passos de três tipos: explicação, pergunta e tarefa (escolhida de uma lista de ações prontas).
window.CE = window.CE || {};

(function () {
  const { info, quiz, esperar, abrir, naJanela, editorBotao } = CE.L;
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const nomeApp = (id) => (CE.listarApps().find((a) => a.id === id) || { nome: id }).nome;

  // As ações que o instrutor pode pedir numa tarefa.
  const TAREFAS = {
    abrir: { nome: 'Abrir um programa', campo: 'Qual programa?', opcoes: () => CE.listarApps().filter((a) => !a.soInstrutor && !a.semIcone && !a.instalavel).map((a) => [a.id, `${a.icone} ${a.nome}`]),
      montar: (p, t) => abrir(p, nomeApp(p), t ? { texto: t } : {}) },
    salvar: { nome: 'Salvar um arquivo com um nome', campo: 'Nome do arquivo', montar: (p, t) => esperar(t || `Salve o arquivo com o nome: ${p}`, 'arquivo:salvo', (d) => norm(d.nome) === norm(p)) },
    escrever: { nome: 'Escrever no Editor de Texto', campo: 'Palavra ou frase que precisa aparecer no texto', montar: (p, t) => esperar(t || `No Editor de Texto, escreva: ${p}`, 'editor:texto', (d) => norm(d.texto).includes(norm(p)), { destacar: naJanela('editor', '.editor-pagina') }) },
    formatar: { nome: 'Formatar um texto no Editor', campo: 'Qual formatação?', opcoes: () => [['bold', 'Negrito'], ['italic', 'Itálico'], ['underline', 'Sublinhado'], ['justifyCenter', 'Centralizar'], ['insertUnorderedList', 'Lista com marcadores']],
      montar: (p, t) => editorBotao(t || 'Selecione um pedaço do texto e clique no botão de formatação.', p) },
    pasta: { nome: 'Criar uma pasta', campo: 'Nome da pasta', montar: (p, t) => esperar(t || `No programa Arquivos, crie uma pasta chamada: ${p}`, 'pasta:criada', (d) => norm(d.nome) === norm(p), { destacar: naJanela('arquivos', '[data-acao="nova-pasta"]') }) },
    celula: { nome: 'Escrever numa célula da Planilha', campo: 'Qual célula? (ex.: B2)', montar: (p, t) => esperar(t || `Na Planilha, escreva alguma coisa na célula ${String(p).toUpperCase()}.`, 'planilha:editada', (d) => d.celula === String(p).toUpperCase().trim(), { destacar: naJanela('planilha', `td[data-celula="${String(p).toUpperCase().trim()}"]`) }) },
    site: { nome: 'Entrar num site', campo: 'Qual site?', opcoes: () => Object.values(CE.SITES).filter((s) => !s.golpe).map((s) => [s.dominio, `${s.icone} ${s.dominio}`]),
      montar: (p, t) => esperar(t || `No Navegador, escreva ${p} na barra de endereço e aperte Enter.`, 'navegador:visitou', (d) => d.dominio === p, { destacar: naJanela('navegador', '.nav-endereco-caixa') }) },
    pesquisar: { nome: 'Pesquisar na internet', campo: 'Palavra da pesquisa', montar: (p, t) => esperar(t || `Pesquise no Procura: ${p}`, 'navegador:pesquisa', (d) => norm(d.termo).includes(norm(p))) },
    email: { nome: 'Mandar um e-mail', campo: 'Para quem? (endereço, ex.: professor@correio.escola)', montar: (p, t) => esperar(t || `Mande um e-mail para ${p}.`, 'email:enviado', (d) => norm(d.para) === norm(p), { destacar: naJanela('email', '[data-acao="escrever"]') }) },
    digitacao: { nome: 'Fazer um exercício de digitação (batendo a meta)', montar: (_p, t) => esperar(t || 'No programa Digitação, faça um exercício e bata a meta.', 'digitacao:concluida', (d) => d.aprovado) },
    jogo: { nome: 'Vencer um Jogo do Mouse', campo: 'Qual jogo?', opcoes: () => CE.JOGOS_MOUSE.map((j) => [j.id, `${j.icone} ${j.nome}`]),
      montar: (p, t) => esperar(t || `Nos Jogos do Mouse, vença o jogo "${(CE.JOGOS_MOUSE.find((j) => j.id === p) || {}).nome || p}".`, 'jogo:concluido', (d) => d.jogo === p) },
    desenho: { nome: 'Fazer e salvar um desenho', montar: (_p, t) => esperar(t || 'No programa Desenho, faça um desenho e salve.', 'arquivo:salvo', (d) => d.tipo === 'imagem') },
    apresentar: { nome: 'Apresentar os slides até o fim', montar: (_p, t) => esperar(t || 'Nas Apresentações, clique em "▶ Apresentar" e passe todos os slides.', 'apresentacao:fim', (d) => d.completa) },
  };

  // Transforma a aula escrita no Painel nos passos que o Professor Virtual entende.
  function montarLicao(a) {
    const passos = (a.passos || []).map((p) => {
      if (p.tipo === 'quiz') return quiz(p.pergunta, p.opcoes.filter((o) => String(o).trim()), Number(p.correta) || 0);
      if (p.tipo === 'tarefa' && TAREFAS[p.acao]) return TAREFAS[p.acao].montar(p.parametro, p.texto);
      return info(p.texto || '');
    });
    return {
      id: a.id, titulo: a.titulo, icone: a.icone || '📌', descricao: a.descricao || '', conclusao: a.conclusao || 'Muito bem! Aula concluída.',
      passos, extra: true, nivel: 'professor', modulo: 'professor', autor: a.autor || '',
    };
  }

  let lista = [];
  CE.aulasProfessor = {
    TAREFAS,
    montarLicao,
    lista: () => lista,
    async carregar() {
      try { lista = await CE.api.chamar('aulas:listar'); } catch { lista = []; }
      CE.LICOES_EXTRAS = lista.filter((a) => a && a.id && a.titulo && Array.isArray(a.passos) && a.passos.length).map(montarLicao);
      CE.emitir('aulas-professor:carregadas', { total: CE.LICOES_EXTRAS.length });
      return lista;
    },
    async salvar(nova) {
      await CE.api.chamar('aulas:salvar', nova);
      return CE.aulasProfessor.carregar();
    },
    async gravar(aula) {
      await CE.api.chamar('aulas:gravar', aula);
      return CE.aulasProfessor.carregar();
    },
    async apagar(id) {
      await CE.api.chamar('aulas:apagar', id);
      return CE.aulasProfessor.carregar();
    },
  };
})();
