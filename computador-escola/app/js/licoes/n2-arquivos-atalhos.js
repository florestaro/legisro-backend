// Nível 2 — Módulo 1: Organização de arquivos e pen drive. Módulo 2: Atalhos de teclado.
(function () {
  const { info, quiz, esperar, abrir, fechar, naJanela, garantirArquivo, pularSe, editorNovo, abrirExemplo } = CE.L;
  const noMenu = (opcao, ...antes) => [`.mc-menu [data-opcao="${opcao}"]`, ...antes.map((o) => `.mc-menu [data-opcao="${o}"]`)];
  const arq = (s) => naJanela('arquivos', s);
  const igual = (a, b) => String(a || '').trim().toLowerCase() === String(b).toLowerCase();
  const existePasta = async (nome, local = 'pc', pasta = '') => (await CE.sessao.arquivos())
    .some((a) => !a.naLixeira && a.tipo === 'pasta' && igual(a.nome, nome) && (a.local || 'pc') === local && (a.pasta || '') === pasta);
  const ondeEsta = async (nome) => { const a = (await CE.sessao.arquivos()).find((x) => !x.naLixeira && igual(x.nome, nome) && x.tipo !== 'pasta'); return a ? (a.pasta || '') : null; };

  // Os arquivos usados no módulo de organização (criados na raiz de Meus Documentos, se não existirem).
  const arquivosDeTreino = async () => {
    await garantirArquivo('Trabalho de Ciências', '<div><b>O ciclo da água</b></div><div>A água evapora, forma nuvens e volta como chuva.</div>');
    await garantirArquivo('Lista do mercado', '<ul><li>Arroz</li><li>Feijão</li><li>Café</li></ul>');
    await garantirArquivo('Carta para a vovó', '<div>Querida vovó, estou com saudade!</div>');
  };
  const irParaRaiz = () => { if (CE.janelas.estaAberta('arquivos')) CE.janelas.abrir('arquivos', { local: 'pc', caminho: '' }); };
  const abrirArquivos = (extra = {}) => abrir('arquivos', 'Arquivos', { preparar: irParaRaiz, ...extra });

  const criarPasta = (nome, pai = '') => ({
    texto: `Clique em "Nova pasta", escreva o nome ${nome} e clique em OK.`,
    espera: 'pasta:criada', se: (d) => igual(d.nome, nome), destacar: arq('[data-acao="nova-pasta"]'), mouse: 'esquerdo',
    ...pularSe(() => existePasta(nome, 'pc', pai)),
  });
  const moverPara = (arquivo, pasta, texto, mouse = 'arrastar') => ({
    texto, espera: 'arquivo:movido', se: (d) => igual(d.nome, arquivo) && igual(d.destino, pasta),
    destacar: [arq(`[data-arquivo="${arquivo}"]`)], mouse,
    ...pularSe(async () => igual(await ondeEsta(arquivo), pasta)),
    dica: 'Segure o botão do mouse em cima do arquivo, leve até o nome da pasta na lista da esquerda e solte.',
  });

  CE.adicionarModulo({
    id: 'n2-pastas', nivel: 'n2', titulo: 'Organizando arquivos e pen drive', icone: '🗂️',
    licoes: [
      {
        id: 'n2-pastas-criar', titulo: 'Criando pastas', icone: '📁',
        descricao: 'Criar pastas e entrar e sair delas.',
        passos: [
          info('Quando temos muitos arquivos, fica difícil achar as coisas. As PASTAS funcionam como gavetas: guardamos cada assunto numa pasta. Deixei três arquivos soltos em Meus Documentos para organizarmos.', { emoji: '🗂️', preparar: arquivosDeTreino }),
          abrirArquivos(),
          criarPasta('Escola'),
          criarPasta('Casa'),
          esperar('As pastas apareceram na lista e também do lado esquerdo. Dê um clique duplo na pasta "Escola" para entrar nela.', 'pasta:aberta', (d) => d.local === 'pc' && igual(d.caminho, 'Escola'), {
            destacar: [arq('.arq-item[data-arquivo="Escola"]'), arq('[data-pasta="pc:Escola"]')], mouse: 'duplo',
          }),
          info('Você está DENTRO da pasta Escola. Veja o caminho em cima da lista: Este Computador › Meus Documentos › Escola. Ela ainda está vazia.', { destacar: arq('.arq-caminho') }),
          esperar('Para voltar para a pasta de antes, clique na setinha ⬆️ ao lado do caminho.', 'pasta:aberta', (d) => d.local === 'pc' && d.caminho === '', { destacar: arq('[data-acao="subir"]'), mouse: 'esquerdo' }),
          quiz('Para que servem as pastas?', ['Para organizar os arquivos por assunto', 'Para apagar arquivos', 'Para deixar o computador mais rápido'], 0),
          quiz('Para entrar numa pasta, eu dou...', ['Um clique duplo nela', 'Um clique com o botão direito', 'Um Enter no Editor'], 0),
        ],
        conclusao: 'Muito bem! Você criou as suas primeiras pastas.',
      },
      {
        id: 'n2-pastas-mover', titulo: 'Guardando arquivos nas pastas', icone: '📥',
        descricao: 'Arrastar arquivos para pastas e usar Recortar e Colar.',
        passos: [
          info('Agora vamos guardar cada arquivo na pasta certa. Há dois jeitos: ARRASTAR o arquivo até a pasta, ou RECORTAR e COLAR.', { emoji: '📥', preparar: async () => { await arquivosDeTreino(); if (!await existePasta('Escola')) await CE.sessao.criarPasta('Escola'); if (!await existePasta('Casa')) await CE.sessao.criarPasta('Casa'); } }),
          abrirArquivos(),
          moverPara('Trabalho de Ciências', 'Escola', 'Arraste o "Trabalho de Ciências" até a pasta "Escola", na lista do lado esquerdo: segure o botão em cima do arquivo, leve até a pasta e solte.'),
          moverPara('Lista do mercado', 'Casa', 'Muito bem! Agora arraste a "Lista do mercado" até a pasta "Casa".'),
          esperar('Agora o outro jeito. Clique UMA vez na "Carta para a vovó" e depois no botão "Recortar" (✂️).', 'arquivo:recortado', (d) => igual(d.nome, 'Carta para a vovó'), {
            destacar: [arq('[data-acao="recortar"]:not(:disabled)'), arq('[data-arquivo="Carta para a vovó"]')], mouse: 'esquerdo',
            ...pularSe(async () => igual(await ondeEsta('Carta para a vovó'), 'Casa')),
          }),
          esperar('Agora clique na pasta "Casa", do lado esquerdo, e depois no botão "Colar".', 'arquivo:colado', (d) => igual(d.nome, 'Carta para a vovó') && igual(d.pasta, 'Casa'), {
            destacar: [arq('[data-acao="colar"]:not(:disabled)'), arq('[data-pasta="pc:Casa"]')], mouse: 'esquerdo',
            ...pularSe(async () => igual(await ondeEsta('Carta para a vovó'), 'Casa')),
          }),
          quiz('Recortar e Colar um arquivo serve para...', ['Mudar o arquivo de lugar', 'Apagar o arquivo para sempre', 'Imprimir o arquivo'], 0),
          fechar('arquivos', 'Arquivos'),
        ],
        conclusao: 'Seus arquivos estão organizados! Cada coisa no seu lugar.',
      },
      {
        id: 'n2-pastas-copiar', titulo: 'Copiar e colar arquivos', icone: '📋',
        descricao: 'Fazer uma cópia de um arquivo em outro lugar.',
        passos: [
          info('COPIAR é diferente de RECORTAR: o arquivo continua onde estava e aparece uma cópia no lugar novo. Bom para ter o mesmo arquivo em dois lugares.', { emoji: '📋' }),
          abrirArquivos({ preparar: async () => { await garantirArquivo('Lista do mercado', '<ul><li>Arroz</li></ul>'); irParaRaiz(); } }),
          esperar('Clique UMA vez em um arquivo e depois no botão "Copiar" (📋).', 'arquivo:copiado-area', null, { destacar: [arq('[data-acao="copiar"]:not(:disabled)'), arq('.arq-item:not([data-tipo="pasta"])'), arq('[data-pasta^="pc:"]')], mouse: 'esquerdo', dica: 'Se o arquivo estiver dentro de uma pasta, clique na pasta do lado esquerdo para encontrá-lo.' }),
          esperar('Agora vá para outra pasta (clique nela do lado esquerdo) e clique em "Colar".', 'arquivo:colado', (d) => d.modo === 'copiar', { destacar: [arq('[data-acao="colar"]:not(:disabled)')], mouse: 'esquerdo' }),
          info('Pronto! Agora o arquivo está nos dois lugares. Se colar na mesma pasta, o computador coloca um número no nome, como "(2)".'),
          quiz('Depois de COPIAR e COLAR, o arquivo original...', ['Continua no lugar dele', 'Some', 'Vai para a lixeira'], 0),
          quiz('Qual é a diferença entre Copiar e Recortar?', ['Copiar deixa o original; Recortar tira do lugar', 'Não tem diferença', 'Recortar apaga o arquivo'], 0),
          fechar('arquivos', 'Arquivos'),
        ],
        conclusao: 'Ótimo! Agora você sabe copiar e mover arquivos.',
      },
      {
        id: 'n2-pastas-pesquisar', titulo: 'Achando arquivos com a pesquisa', icone: '🔍',
        descricao: 'Usar a caixa de pesquisa do Arquivos.',
        passos: [
          info('Esqueceu em qual pasta guardou um arquivo? Use a PESQUISA: escreva parte do nome e o computador procura em todas as pastas.', { emoji: '🔍', preparar: arquivosDeTreino }),
          abrirArquivos(),
          esperar('Clique na caixa "🔍 Pesquisar arquivos" (lá em cima, à direita) e escreva: carta', 'arquivos:pesquisa', (d) => /carta/i.test(d.termo), { destacar: arq('.arq-busca'), mouse: 'esquerdo' }),
          info('Apareceu o arquivo e, do lado do nome, em que pasta ele está.', { destacar: arq('.arq-item') }),
          esperar('Dê um clique duplo no resultado para abrir a carta.', 'arquivo:aberto', (d) => /carta/i.test(d.nome), { destacar: arq('.arq-item'), mouse: 'duplo' }),
          quiz('Para achar um arquivo sem saber a pasta, eu...', ['Escrevo parte do nome na pesquisa', 'Abro todas as pastas uma por uma', 'Desisto'], 0),
          fechar('editor', 'Editor de Texto'),
        ],
        conclusao: 'Muito bem! A pesquisa economiza muito tempo.',
      },
      {
        id: 'n2-pendrive', titulo: 'Usando o pen drive', icone: '💾',
        descricao: 'Conectar, copiar arquivos para o pen drive e remover com segurança.',
        passos: [
          info('O pen drive leva arquivos de um computador para outro. Neste computador de treino, o pen drive é ligado pelo ícone 🔌 na barra de tarefas, perto do relógio. No computador de verdade, você encaixa ele na entrada USB.', { emoji: '💾', preparar: arquivosDeTreino }),
          abrirArquivos(),
          esperar('Clique no ícone 🔌 perto do relógio para "encaixar" o pen drive.', 'pendrive:conectado', null, { destacar: '#status-pendrive', mouse: 'esquerdo', jaFeito: () => CE.pendrive.conectado }),
          esperar('Apareceu o "Pen drive (E:)" do lado esquerdo do Arquivos. Clique nele para ver o que tem dentro.', 'pasta:aberta', (d) => d.local === 'pendrive', { destacar: arq('[data-pasta="pendrive"]'), mouse: 'esquerdo' }),
          esperar('Agora volte para "Meus Documentos" (do lado esquerdo), escolha um arquivo e ARRASTE até o "Pen drive (E:)". Do computador para o pen drive, arrastar faz uma CÓPIA.', 'arquivo:copiado', (d) => d.destinoLocal === 'pendrive', {
            destacar: [arq('[data-pasta="pendrive"]')], mouse: 'arrastar', dica: 'Também dá para usar Copiar e depois Colar dentro do pen drive.',
          }),
          info('O arquivo foi copiado: ele está no pen drive e continua no computador.'),
          esperar('Tem um jeito ainda mais fácil, muito usado no Windows: em "Meus Documentos", clique com o botão DIREITO em outro arquivo, pare a setinha em "Enviar para" e clique em "Pen drive (E:)".', 'arquivo:enviado', (d) => d.para === 'pendrive', {
            destacar: [...noMenu('enviar-pendrive', 'enviar-para'), arq('[data-pasta="documentos"]')], mouse: 'direito', dica: 'Primeiro volte para "Meus Documentos", do lado esquerdo. Depois botão direito num arquivo › Enviar para › Pen drive (E:).',
          }),
          info('Antes de tirar o pen drive, sempre use "Remover com segurança" (ou botão direito no pen drive › Ejetar), para não estragar os arquivos.'),
          esperar('Clique em "⏏️ Remover com segurança", embaixo do pen drive.', 'pendrive:removido', null, { destacar: arq('[data-acao="remover-pendrive"]'), mouse: 'esquerdo' }),
          quiz('Antes de tirar o pen drive do computador, eu...', ['Clico em "Remover com segurança"', 'Puxo de qualquer jeito', 'Desligo o monitor'], 0),
          quiz('Arrastar um arquivo do computador para o pen drive...', ['Faz uma cópia', 'Apaga o arquivo do computador', 'Não faz nada'], 0),
          fechar('arquivos', 'Arquivos'),
        ],
        conclusao: 'Parabéns! Agora você leva seus arquivos para onde quiser.',
      },
      {
        id: 'n2-pastas-desafio', titulo: 'Desafio da organização', icone: '🏅', desafio: true,
        descricao: 'Criar pasta, salvar, mover e levar no pen drive.',
        passos: [
          info('Desafio! Faça tudo sozinho. Clique em "Continuar".'),
          esperar('No Arquivos, crie uma pasta chamada: Receitas', 'pasta:criada', (d) => igual(d.nome, 'Receitas'), pularSe(() => existePasta('Receitas'))),
          esperar('No Editor de Texto, escreva uma receita e salve com o nome: Bolo', 'arquivo:salvo', (d) => d.tipo === 'documento' && igual(d.nome, 'Bolo')),
          esperar('Coloque o documento "Bolo" dentro da pasta "Receitas".', 'arquivo:movido', (d) => igual(d.nome, 'Bolo') && igual(d.destino, 'Receitas')),
          esperar('Conecte o pen drive e copie a pasta "Receitas" inteira para ele.', 'arquivo:copiado', (d) => igual(d.nome, 'Receitas') && d.destinoLocal === 'pendrive'),
          esperar('Remova o pen drive com segurança.', 'pendrive:removido'),
        ],
        conclusao: 'Desafio vencido! Você é organizado como um profissional. 🗂️',
      },
    ],
  });

  const atalho = (nome, texto, extra = {}) => esperar(texto, 'atalho:usado', (d) => d.atalho === nome, extra);

  CE.adicionarModulo({
    id: 'n2-atalhos', nivel: 'n2', titulo: 'Atalhos de teclado', icone: '⚡',
    licoes: [
      {
        id: 'n2-atalhos-texto', titulo: 'Atalhos para escrever mais rápido', icone: '⚡',
        descricao: 'Ctrl+A, Ctrl+B, Ctrl+C, Ctrl+V, Ctrl+Z e Ctrl+S.',
        passos: [
          info('ATALHOS são combinações de teclas que fazem as coisas sem precisar do mouse. A maioria usa a tecla Ctrl (no canto de baixo do teclado): segure o Ctrl e aperte a outra tecla.', { emoji: '⚡' }),
          abrir('editor', 'Editor de Texto'),
          editorNovo(),
          esperar('Clique na folha e escreva: Bom dia a todos!', 'editor:texto', (d) => /bom dia a todos/i.test(d.texto), { destacar: naJanela('editor', '.editor-pagina') }),
          atalho('Ctrl+A', 'Segure Ctrl e aperte A (Ctrl+A). Isso seleciona TUDO.'),
          esperar('Agora Ctrl+B: deixa o que está selecionado em negrito.', 'editor:formatado', (d) => d.comando === 'bold'),
          atalho('Ctrl+C', 'Ctrl+C COPIA o que está selecionado.'),
          esperar('Clique no fim da frase, aperte Enter e depois Ctrl+V para COLAR. A frase vai aparecer de novo!', 'editor:texto', (d) => (d.texto.match(/bom dia a todos/gi) || []).length >= 2),
          atalho('Ctrl+Z', 'Errou? Ctrl+Z DESFAZ a última coisa. Aperte Ctrl+Z.'),
          esperar('Por último, Ctrl+S SALVA o documento. Aperte Ctrl+S e dê o nome "Atalhos".', 'arquivo:salvo', (d) => d.tipo === 'documento'),
          quiz('Qual atalho COPIA o que está selecionado?', ['Ctrl+C', 'Ctrl+V', 'Ctrl+Z'], 0),
          quiz('Qual atalho DESFAZ a última ação?', ['Ctrl+S', 'Ctrl+Z', 'Ctrl+A'], 1),
          quiz('Ctrl+V serve para...', ['Colar', 'Salvar', 'Selecionar tudo'], 0),
        ],
        conclusao: 'Muito bem! Com os atalhos você trabalha bem mais rápido.',
      },
      {
        id: 'n2-botao-direito', titulo: 'Copiar, colar e formatar com o botão direito', icone: '🖱️',
        descricao: 'O menu do botão direito no Editor: Copiar, Colar e Fonte.',
        passos: [
          info('Não lembra do Ctrl+C e do Ctrl+V? O botão DIREITO do mouse mostra as mesmas opções num menu. Abri um recado para treinarmos.', {
            emoji: '🖱️', preparar: () => abrirExemplo('Recado da escola', 'documento', '<div>Reunião de pais amanhã às 19h.</div>', true),
          }),
          esperar('Dê um clique duplo na palavra "Reunião" para selecionar.', 'editor:selecao', (d) => /reuni/i.test(d.selecionado), { destacar: naJanela('editor', '.editor-pagina'), mouse: 'duplo' }),
          esperar('Agora clique com o botão DIREITO em cima da palavra selecionada e escolha "Copiar".', 'menu-contexto:opcao', (d) => d.onde === 'editor' && d.opcao === 'copiar', {
            destacar: [...noMenu('copiar'), naJanela('editor', '.editor-pagina')], mouse: 'direito', dica: 'Se o "Copiar" estiver apagado, a palavra não está selecionada: dê o clique duplo nela de novo.',
          }),
          esperar('Clique no fim do texto (depois de "19h."), aperte Enter para ir para a linha de baixo e clique com o botão DIREITO ali. Escolha "Colar".', 'editor:texto', (d) => (d.texto.match(/reuni/gi) || []).length >= 2, {
            destacar: [...noMenu('colar'), naJanela('editor', '.editor-pagina')], mouse: 'direito',
          }),
          esperar('Agora selecione a primeira linha inteira (segure o botão e arraste por cima dela), clique com o botão DIREITO e escolha "Fonte...". Escolha o estilo "Negrito", o tamanho 18 e clique em OK.', 'editor:fonte', (d) => d.bold && d.tamanho === '5', {
            destacar: [...noMenu('fonte'), naJanela('editor', '.editor-pagina')], mouse: 'direito', dica: 'Na janela "Fonte": em Estilo escolha Negrito; em Tamanho escolha 18.',
          }),
          quiz('No menu do botão direito de um texto aparecem...', ['Recortar, Copiar e Colar', 'Desligar e Reiniciar', 'Só a Lixeira'], 0),
          quiz('Para colar com o mouse, eu...', ['Clico com o botão direito onde quero e escolho "Colar"', 'Dou clique duplo na Lixeira', 'Arrasto o relógio'], 0),
        ],
        conclusao: 'Muito bem! Com o botão direito você não precisa decorar os atalhos.',
      },
      {
        id: 'n2-atalhos-gerais', titulo: 'Atalhos no Arquivos e no Windows', icone: '⌨️',
        descricao: 'F2, Delete, Ctrl+C e Ctrl+V nos arquivos; Alt+Tab e outros.',
        passos: [
          info('Os atalhos também funcionam no Arquivos e em quase todos os programas do Windows.', { emoji: '⌨️', preparar: () => garantirArquivo('Rascunho do atalho', 'Treino de atalhos.') }),
          abrir('arquivos', 'Arquivos', { preparar: irParaRaiz }),
          esperar('Clique UMA vez no arquivo "Rascunho do atalho".', 'arquivo:selecionado', (d) => igual(d.nome, 'Rascunho do atalho'), { destacar: arq('[data-arquivo="Rascunho do atalho"]'), mouse: 'esquerdo' }),
          atalho('F2', 'Aperte a tecla F2 (na fileira de cima do teclado). Ela serve para RENOMEAR.'),
          esperar('Abriu a caixa para mudar o nome. Escreva: Atalho renomeado   e clique em OK.', 'arquivo:renomeado'),
          atalho('Delete', 'Agora, com o arquivo selecionado, aperte a tecla Delete. Ela manda para a lixeira. Confirme com "Sim".'),
          info('Outros atalhos muito usados no Windows de verdade: Alt+Tab troca de janela; a tecla Windows (⊞) abre o menu Iniciar; Windows+D mostra a área de trabalho; Ctrl+P imprime.', { emoji: '🪟' }),
          quiz('Qual tecla renomeia um arquivo selecionado?', ['F2', 'F5', 'Esc'], 0),
          quiz('Qual atalho troca de uma janela para outra no Windows?', ['Alt+Tab', 'Ctrl+B', 'Shift+A'], 0),
          quiz('A tecla Delete, com um arquivo selecionado...', ['Manda o arquivo para a lixeira', 'Abre o arquivo', 'Imprime o arquivo'], 0),
          fechar('arquivos', 'Arquivos'),
        ],
        conclusao: 'Parabéns! Você conhece os atalhos mais usados do Windows.',
      },
    ],
  });
})();
