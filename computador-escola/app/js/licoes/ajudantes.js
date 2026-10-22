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
      destacar: `.icone[data-icone="${id}"]`,
      jaFeito: () => CE.janelas.estaAberta(id),
      dica: 'O clique duplo precisa ser rápido: clique-clique! Se não abrir, tente de novo um pouco mais rápido.',
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

    // Garante que exista um arquivo de exemplo na pasta do aluno.
    garantirArquivo: async (nome, conteudo) => {
      const existe = (await CE.sessao.arquivos()).some((a) => a.nome === nome && !a.naLixeira);
      if (!existe) await CE.sessao.salvarArquivo({ nome, tipo: 'documento', conteudo });
    },
  };
})();
