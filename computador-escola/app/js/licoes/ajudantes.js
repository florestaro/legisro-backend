// Atalhos para escrever lições com menos repetição. Veja LEIA-ME-LICOES.md.
window.CE = window.CE || {};

(function () {
  const naJanela = (app, seletor) => `.janela[data-app="${app}"] ${seletor}`;

  CE.L = {
    naJanela,

    // Passo informativo (aparece o botão "Continuar").
    info: (texto, extra = {}) => ({ texto, ...extra }),

    // Pergunta de múltipla escolha. "correta" é a posição da resposta certa (0 = primeira).
    quiz: (pergunta, opcoes, correta, explicacao) => ({ quiz: { pergunta, opcoes, correta, explicacao } }),

    // Passo que espera um evento. Ex.: CE.L.esperar('Clique no monitor.', 'peca:clicada', (d) => d.peca === 'monitor', { destacar, mouse })
    esperar: (texto, espera, se, extra = {}) => ({ texto, espera, se, ...extra }),

    abrir: (id, nome, extra = {}) => ({
      texto: `Agora abra o programa "${nome}": coloque a setinha em cima do ícone dele e dê um clique duplo (dois cliques rápidos).`,
      mouse: 'duplo',
      espera: 'app:aberto',
      se: (d) => d.app === id,
      // Se o ícone estiver escondido atrás de uma janela, a seta vai para o botão Iniciar e depois para o programa no menu.
      destacar: [`#menu-iniciar:not([hidden]) .menu-item[data-app="${id}"]`, `.icone[data-icone="${id}"]`, '#botao-iniciar'],
      jaFeito: () => CE.janelas.estaAberta(id),
      dica: 'O clique duplo precisa ser rápido: clique-clique! Se o ícone estiver escondido atrás de uma janela, clique em "Iniciar" (lá embaixo, à esquerda) e escolha o programa na lista.',
      ...extra,
    }),

    fechar: (id, nome, extra = {}) => ({
      texto: `Muito bem! Agora feche o programa "${nome}" clicando no X, no canto de cima à direita da janela.`,
      mouse: 'esquerdo',
      espera: 'janela:fechada',
      se: (d) => d.app === id,
      destacar: naJanela(id, '[data-acao="fechar"]'),
      jaFeito: () => !CE.janelas.estaAberta(id),
      ...extra,
    }),

    // Clicar num botão da barra de ferramentas do Editor de Texto.
    editorBotao: (texto, comando, se, extra = {}) => ({
      texto, mouse: 'esquerdo', espera: 'editor:formatado',
      se: (d) => d.comando === comando && (!se || se(d)),
      destacar: naJanela('editor', `[data-comando="${comando}"]`),
      ...extra,
    }),

    // Começar um documento novo no Editor: em branco ou a partir de um modelo (carta, curriculo, requerimento, recibo).
    editorNovo: (modelo = 'branco', nomeModelo = 'Documento em branco') => ({
      texto: `Clique no botão "Novo", lá em cima no Editor, e depois em "${nomeModelo}". Se ele perguntar se quer salvar o documento anterior, clique em "Não".`,
      mouse: 'esquerdo', espera: 'editor:novo', se: (d) => d.modelo === modelo,
      destacar: [naJanela('editor', `[data-modelo="${modelo}"]`), naJanela('editor', '[data-comando="novo"]')],
    }),

    editorSalvar: (nome, se) => ({
      texto: `Agora salve: clique em "Salvar", escreva o nome "${nome}" e clique em OK.`,
      mouse: 'esquerdo', espera: 'arquivo:salvo',
      se: (d) => d.tipo === 'documento' && (!se || se(d)),
      destacar: naJanela('editor', '[data-comando="salvar"]'),
      dica: 'Se o documento já tinha um nome, ele salva direto, sem perguntar.',
    }),

    // Garante que exista um arquivo de exemplo na pasta do aluno (na raiz de Meus Documentos, se não existir em lugar nenhum).
    garantirArquivo: async (nome, conteudo, tipo = 'documento') => {
      const lista = await CE.sessao.arquivos();
      const existente = lista.find((a) => a.nome === nome && a.tipo === tipo && !a.naLixeira);
      return existente || CE.sessao.salvarArquivo({ nome, tipo, conteudo });
    },

    // Cria (se preciso) um arquivo de exemplo e abre no programa certo. Útil no "preparar" de um passo.
    // Com recriar = true, o arquivo volta ao conteúdo original (para o exercício começar sempre do mesmo jeito).
    abrirExemplo: async (nome, tipo, conteudo, recriar = false) => {
      const texto = typeof conteudo === 'function' ? conteudo() : conteudo;
      const arquivo = recriar ? await CE.sessao.salvarArquivo({ nome, tipo, conteudo: texto }) : await CE.L.garantirArquivo(nome, texto, tipo);
      CE.janelas.abrir(CE.TIPOS_ARQUIVO[tipo].app, { arquivo });
    },

    // Para pular um passo que já está feito, quando a conferência precisa ler os dados (assíncrona):
    // ...CE.L.pularSe(async () => condição)  ->  { preparar, jaFeito }
    pularSe: (teste) => {
      let feito = false;
      return { preparar: async () => { feito = !!(await teste()); }, jaFeito: () => feito };
    },

    // Planilha de exemplo a partir de uma tabela simples: [['Produto', 'Qtd'], ['Arroz', '2'], ...] (começa em A1).
    planilhaDe: (linhas, extras = {}) => {
      const celulas = {};
      linhas.forEach((linha, l) => linha.forEach((v, c) => {
        if (v !== '' && v != null) celulas[CE.formulas.endereco(c, l)] = { v: String(v), f: l === 0 ? { negrito: true } : {} };
      }));
      Object.entries(extras).forEach(([ref, v]) => { celulas[ref] = { v: String(v), f: {} }; });
      return JSON.stringify({ celulas, larguras: {} });
    },

    // Confere valores da planilha aberta (ex.: CE.L.celula('D2') === 51.8).
    celula: (ref) => (CE.planilhaAtiva ? CE.planilhaAtiva.valor(ref) : undefined),
    entrada: (ref) => (CE.planilhaAtiva ? CE.planilhaAtiva.entrada(ref) : ''),
    perto: (a, b) => typeof a === 'number' && Math.abs(a - b) < 0.005,
  };
})();
