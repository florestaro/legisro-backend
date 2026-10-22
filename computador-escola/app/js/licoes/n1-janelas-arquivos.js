// Nível 1 — Módulo 4: Janelas e menu Iniciar. Módulo 5: Arquivos e pastas.
(function () {
  const { info, quiz, esperar, abrir, fechar, naJanela, garantirArquivo, pularSe } = CE.L;
  const igual = (a, b) => String(a || '').trim().toLowerCase() === String(b).toLowerCase();
  // Uma opção do menu do botão direito (a seta aponta para ela quando o menu estiver aberto).
  const noMenu = (opcao, ...antes) => [`.mc-menu [data-opcao="${opcao}"]`, ...antes.map((o) => `.mc-menu [data-opcao="${o}"]`)];

  const botaoJanela = (app, acao, evento, texto, mouse = 'esquerdo') => esperar(texto, evento, (d) => d.app === app, {
    destacar: naJanela(app, `[data-acao="${acao}"]`), mouse,
  });
  const naBarra = (app, nome, evento = 'janela:restaurada') => esperar(`Clique no botão "${nome}" na barra de tarefas, lá embaixo da tela.`, evento, (d) => d.app === app, {
    destacar: `.tarefa[data-app="${app}"]`, mouse: 'esquerdo',
  });
  const selecionarArquivo = (nome, texto) => esperar(texto || `Clique UMA vez em "${nome}" para selecionar.`, 'arquivo:selecionado', (d) => d.nome === nome, {
    destacar: naJanela('arquivos', `[data-arquivo="${nome}"]`), mouse: 'esquerdo',
  });
  const DOC_EXEMPLO = '<b>Lista de compras</b><ul><li>Arroz</li><li>Feijão</li><li>Leite</li><li>Pão</li></ul>';

  CE.adicionarModulo({
    id: 'n1-janelas', nivel: 'n1', titulo: 'Janelas e menu Iniciar', icone: '🪟',
    licoes: [
      {
        id: 'janelas', titulo: 'Trabalhando com janelas', icone: '🪟',
        descricao: 'Mover, aumentar, esconder e trazer de volta uma janela.',
        passos: [
          info('Cada programa abre dentro de uma "janela". Os três botões do canto de cima são iguais em quase todos os programas do Windows: – (minimizar), □ (maximizar) e X (fechar).', { emoji: '🪟' }),
          abrir('arquivos', 'Arquivos'),
          esperar('Vamos mudar a janela de lugar. Clique na barra azul de cima da janela (onde está escrito o nome), SEGURE o botão e arraste. Solte quando quiser.', 'janela:movida', (d) => d.app === 'arquivos', {
            destacar: naJanela('arquivos', '.janela-titulo'), mouse: 'arrastar', dica: 'Não solte o botão enquanto estiver arrastando. Só solte no final.',
          }),
          botaoJanela('arquivos', 'maximizar', 'janela:maximizada', 'Ótimo! Agora deixe a janela do tamanho da tela inteira: clique no quadradinho (□), no canto de cima.'),
          botaoJanela('arquivos', 'maximizar', 'janela:normal', 'Viu como ficou grande? Clique no mesmo quadradinho de novo para ela voltar ao tamanho normal.'),
          botaoJanela('arquivos', 'minimizar', 'janela:minimizada', 'Agora vamos esconder a janela sem fechar: clique no tracinho (–). Isso se chama minimizar.'),
          naBarra('arquivos', 'Arquivos'),
          fechar('arquivos', 'Arquivos'),
          quiz('O botão com um tracinho (–) serve para...', ['Fechar o programa', 'Esconder a janela na barra de tarefas', 'Aumentar a janela'], 1),
          quiz('Depois de minimizar, como trago a janela de volta?', ['Clicando no nome dela na barra de tarefas', 'Desligando o computador', 'Não dá para trazer de volta'], 0),
        ],
        conclusao: 'Excelente! Agora você sabe mover, maximizar, minimizar e fechar janelas.',
      },
      {
        id: 'menu-iniciar', titulo: 'Botão Iniciar e botão direito', icone: '🏁',
        descricao: 'Abrir programas pelo menu Iniciar e usar o menu do botão direito.',
        passos: [
          esperar('Lá no canto de baixo, à esquerda, tem o botão "Iniciar". Ele mostra todos os programas do computador. Clique nele uma vez.', 'menu-iniciar:aberto', null, { destacar: '#botao-iniciar', mouse: 'esquerdo' }),
          esperar('Abriu o menu! Agora clique em "Editor de Texto" na lista. No menu basta UM clique.', 'app:aberto', (d) => d.app === 'editor', {
            destacar: '#menu-iniciar .menu-item[data-app="editor"]', mouse: 'esquerdo', jaFeito: () => CE.janelas.estaAberta('editor'),
            dica: 'Se o menu fechou, clique de novo no botão Iniciar.',
          }),
          fechar('editor', 'Editor de Texto'),
          esperar('Agora o botão DIREITO. Ele abre um menu com as opções do lugar onde você clicou. Clique com o botão direito num espaço vazio da área de trabalho (no fundo da tela, longe dos ícones).', 'menu-contexto:aberto', (d) => d.onde === 'area-de-trabalho', {
            mouse: 'direito', dica: 'Clique com o botão da DIREITA num lugar sem ícones e sem janelas.',
          }),
          esperar('Apareceu o menu! Pare a setinha em cima de "Exibir" (sem clicar): abre um menu do lado. Clique em "Ícones grandes".', 'area:icones', (d) => d.tamanho === 'grandes', {
            destacar: noMenu('icones-grandes', 'exibir'), mouse: 'esquerdo', dica: 'Se o menu sumiu, clique de novo com o botão direito no fundo da tela.',
          }),
          info('Os ícones ficaram maiores: bom para quem enxerga pouco. Para voltar ao normal é o mesmo caminho.'),
          esperar('Faça de novo: botão direito no fundo da tela › Exibir › "Ícones médios".', 'area:icones', (d) => d.tamanho === 'medios', { destacar: noMenu('icones-medios', 'exibir'), mouse: 'direito' }),
          esperar('Mais um: clique com o botão direito no fundo da tela e escolha "Personalizar".', 'app:aberto', (d) => d.app === 'configuracoes', { destacar: noMenu('personalizar'), mouse: 'direito' }),
          esperar('Abriu as Configurações, na parte de Personalizar. Clique numa imagem de fundo de que você goste.', 'config:fundo', null, { destacar: naJanela('configuracoes', '.cfg-fundo'), mouse: 'esquerdo' }),
          fechar('configuracoes', 'Configurações'),
          quiz('Onde fica o botão Iniciar?', ['No canto de baixo, à esquerda', 'No canto de cima, à direita', 'No meio da tela'], 0),
          quiz('Para ver as opções de um lugar ou de um ícone, eu clico com...', ['O botão direito do mouse', 'O botão esquerdo, três vezes', 'A rodinha'], 0),
        ],
        conclusao: 'Muito bem! Quando estiver perdido, o botão Iniciar é sempre um bom lugar para começar.',
      },
      {
        id: 'janelas-varias', titulo: 'Várias janelas ao mesmo tempo', icone: '🗂️',
        descricao: 'Trocar de um programa para outro pela barra de tarefas.',
        passos: [
          info('Podemos deixar vários programas abertos e trocar entre eles pela barra de tarefas, lá embaixo. Cada programa aberto tem um botão nela.', { emoji: '🗂️' }),
          abrir('calculadora', 'Calculadora'),
          abrir('editor', 'Editor de Texto'),
          esperar('Agora as duas janelas estão abertas. Clique em "Calculadora" na barra de tarefas para trazê-la para a frente.', 'janela:ativada', (d) => d.app === 'calculadora', { destacar: '.tarefa[data-app="calculadora"]', mouse: 'esquerdo' }),
          esperar('Agora volte para o Editor de Texto clicando no nome dele na barra de tarefas.', 'janela:ativada', (d) => d.app === 'editor', { destacar: '.tarefa[data-app="editor"]', mouse: 'esquerdo' }),
          fechar('editor', 'Editor de Texto'),
          fechar('calculadora', 'Calculadora'),
          quiz('Para trocar de um programa aberto para outro, eu clico...', ['No nome dele na barra de tarefas', 'No relógio', 'No fundo da tela'], 0),
        ],
        conclusao: 'Ótimo! Você já consegue trabalhar com vários programas ao mesmo tempo.',
      },
      {
        id: 'janelas-botao-direito', titulo: 'Botão direito nas janelas', icone: '🖱️',
        descricao: 'Maximizar e fechar pelo menu da janela e da barra de tarefas.',
        passos: [
          info('No Windows, o botão direito também funciona na barra de cima de uma janela e nos programas da barra de tarefas. Às vezes é o jeito mais fácil de fechar um programa que travou ou ficou escondido.', { emoji: '🖱️' }),
          abrir('editor', 'Editor de Texto'),
          esperar('Clique com o botão DIREITO na barra azul de cima da janela do Editor (onde está escrito o nome dele).', 'menu-contexto:aberto', (d) => d.onde === 'barra-titulo' && d.alvo === 'editor', {
            destacar: naJanela('editor', '.janela-titulo'), mouse: 'direito',
          }),
          esperar('Apareceu o menu da janela. Clique em "Maximizar" para ela ocupar a tela toda.', 'janela:maximizada', (d) => d.app === 'editor', {
            destacar: noMenu('maximizar'), mouse: 'esquerdo', dica: 'Se o menu sumiu, clique de novo com o botão direito na barra azul de cima.',
          }),
          esperar('Agora devolva ao tamanho de antes: botão direito na barra azul › "Restaurar".', 'janela:normal', (d) => d.app === 'editor', { destacar: [...noMenu('restaurar'), naJanela('editor', '.janela-titulo')], mouse: 'direito' }),
          esperar('Agora clique com o botão DIREITO no botão do Editor de Texto na barra de tarefas, lá embaixo da tela.', 'menu-contexto:aberto', (d) => d.onde === 'barra-tarefas' && d.alvo === 'editor', {
            destacar: '.tarefa[data-app="editor"]', mouse: 'direito',
          }),
          esperar('Clique em "Fechar janela". Se ele perguntar se quer salvar, clique em "Não".', 'janela:fechada', (d) => d.app === 'editor', { destacar: noMenu('fechar-janela'), mouse: 'esquerdo' }),
          quiz('Para fechar um programa pela barra de tarefas, eu...', ['Clico nele com o botão direito e escolho "Fechar janela"', 'Desligo o computador', 'Dou clique duplo no relógio'], 0),
        ],
        conclusao: 'Muito bem! O botão direito mostra as opções de cada coisa na tela.',
      },
      {
        id: 'janelas-desafio', titulo: 'Desafio das janelas', icone: '🏅', desafio: true,
        descricao: 'Abrir pelo Iniciar, maximizar, minimizar, trazer de volta e fechar.',
        passos: [
          info('Desafio! Faça tudo sozinho, com a Calculadora. Clique em "Continuar".'),
          esperar('Abra a Calculadora pelo botão Iniciar.', 'app:aberto', (d) => d.app === 'calculadora'),
          esperar('Maximize a janela da Calculadora.', 'janela:maximizada', (d) => d.app === 'calculadora'),
          esperar('Agora minimize a Calculadora.', 'janela:minimizada', (d) => d.app === 'calculadora'),
          esperar('Traga a Calculadora de volta.', 'janela:restaurada', (d) => d.app === 'calculadora'),
          esperar('Por último, feche a Calculadora.', 'janela:fechada', (d) => d.app === 'calculadora'),
        ],
        conclusao: 'Desafio vencido! Você domina as janelas. 🪟',
      },
    ],
  });

  CE.adicionarModulo({
    id: 'n1-arquivos', nivel: 'n1', titulo: 'Arquivos e pastas', icone: '📁',
    licoes: [
      {
        id: 'arquivos-encontrar', titulo: 'Encontrando seus documentos', icone: '📁',
        descricao: 'Achar, renomear e abrir um documento salvo.',
        passos: [
          info('Tudo o que você salva fica guardado em pastas, como numa gaveta. Eu deixei um documento chamado "Lista de compras" na sua pasta. Vamos encontrá-lo!', {
            emoji: '🗄️', preparar: () => garantirArquivo('Lista de compras', DOC_EXEMPLO),
          }),
          abrir('arquivos', 'Arquivos'),
          selecionarArquivo('Lista de compras', 'Esta é a sua pasta "Meus Documentos". Clique UMA vez em "Lista de compras" para selecionar.'),
          esperar('Vamos mudar o nome do arquivo. Clique no botão "Renomear", escreva "Compras do mês" e clique em OK.', 'arquivo:renomeado', null, {
            destacar: naJanela('arquivos', '[data-acao="renomear"]'), mouse: 'esquerdo',
          }),
          esperar('O nome mudou! Agora dê um clique duplo no documento para abrir ele no Editor de Texto.', 'arquivo:aberto', null, {
            destacar: naJanela('arquivos', '.arq-item'), mouse: 'duplo',
          }),
          info('O documento abriu no Editor de Texto. Você pode continuar escrevendo nele e salvar de novo.'),
          quiz('Onde ficam os documentos que eu salvo?', ['Na pasta Meus Documentos, no programa Arquivos', 'Na Calculadora', 'Eles somem quando fecho'], 0),
        ],
        conclusao: 'Ótimo trabalho! Agora você sabe onde ficam os seus documentos e como encontrá-los.',
      },
      {
        id: 'arquivos-lixeira', titulo: 'Excluir e a Lixeira', icone: '🗑️',
        descricao: 'Mandar para a lixeira e restaurar um arquivo.',
        passos: [
          info('Quando excluímos um arquivo, ele não some na hora: vai para a Lixeira. De lá, dá para trazer de volta (restaurar) ou apagar de vez. Deixei um arquivo "Rascunho" para treinarmos.', {
            emoji: '🗑️', preparar: () => garantirArquivo('Rascunho', 'Este é um rascunho para treinar a lixeira.'),
          }),
          abrir('arquivos', 'Arquivos'),
          selecionarArquivo('Rascunho'),
          esperar('Clique no botão "Excluir". Quando perguntar se quer mandar para a lixeira, clique em "Sim".', 'arquivo:removido', (d) => d.nome === 'Rascunho', {
            destacar: naJanela('arquivos', '[data-acao="excluir"]'), mouse: 'esquerdo',
          }),
          esperar('O arquivo sumiu da pasta! Agora clique em "Lixeira", no lado esquerdo da janela.', 'pasta:aberta', (d) => d.pasta === 'lixeira', {
            destacar: naJanela('arquivos', '[data-pasta="lixeira"]'), mouse: 'esquerdo',
          }),
          selecionarArquivo('Rascunho', 'Olha ele aqui! Clique uma vez em "Rascunho".'),
          esperar('Clique em "Restaurar" para ele voltar para Meus Documentos.', 'arquivo:restaurado', (d) => d.nome === 'Rascunho', {
            destacar: naJanela('arquivos', '[data-acao="restaurar"]'), mouse: 'esquerdo',
          }),
          fechar('arquivos', 'Arquivos'),
          quiz('Quando excluo um arquivo, ele vai para...', ['A Lixeira', 'A impressora', 'Some para sempre na hora'], 0),
          quiz('Para trazer de volta um arquivo da Lixeira, eu uso...', ['Restaurar', 'Esvaziar lixeira', 'Desligar'], 0),
        ],
        conclusao: 'Muito bem! A Lixeira te salva quando você apaga algo sem querer.',
      },
      {
        id: 'arquivos-botao-direito', titulo: 'Botão direito nos arquivos', icone: '🖱️',
        descricao: 'Criar pasta, recortar, colar, renomear e ver as propriedades pelo menu do botão direito.',
        passos: [
          info('No computador de verdade, quase tudo o que se faz com um arquivo aparece clicando nele com o botão DIREITO: abrir, copiar, renomear, excluir... Deixei um arquivo "Receita de bolo" para treinarmos.', {
            emoji: '🖱️', preparar: () => garantirArquivo('Receita de bolo', '<b>Bolo de cenoura</b><div>3 cenouras, 3 ovos, 2 xícaras de farinha, 1 xícara de açúcar.</div>'),
          }),
          abrir('arquivos', 'Arquivos', { preparar: () => { if (CE.janelas.estaAberta('arquivos')) CE.janelas.abrir('arquivos', { local: 'pc', caminho: '' }); } }),
          esperar('Clique com o botão DIREITO num espaço vazio da janela, embaixo dos arquivos.', 'menu-contexto:aberto', (d) => d.onde === 'arquivos-vazio', {
            destacar: naJanela('arquivos', '.arq-lista'), mouse: 'direito', dica: 'Clique num lugar branco da lista, sem nenhum arquivo em cima.',
            ...pularSe(async () => (await CE.sessao.arquivos()).some((a) => !a.naLixeira && a.tipo === 'pasta' && igual(a.nome, 'Receitas') && (a.local || 'pc') === 'pc' && !a.pasta)),
          }),
          esperar('Pare a setinha em "Novo" e clique em "Pasta". Escreva o nome Receitas e clique em OK.', 'pasta:criada', (d) => igual(d.nome, 'Receitas'), {
            destacar: noMenu('nova-pasta', 'novo'), mouse: 'esquerdo', dica: 'Se o menu sumiu, clique de novo com o botão direito no espaço vazio.',
            ...pularSe(async () => (await CE.sessao.arquivos()).some((a) => !a.naLixeira && a.tipo === 'pasta' && igual(a.nome, 'Receitas') && (a.local || 'pc') === 'pc' && !a.pasta)),
          }),
          esperar('Agora clique com o botão DIREITO no arquivo "Receita de bolo" e escolha "Recortar".', 'arquivo:recortado', (d) => igual(d.nome, 'Receita de bolo'), {
            destacar: [...noMenu('recortar'), naJanela('arquivos', '[data-arquivo="Receita de bolo"]')], mouse: 'direito',
          }),
          esperar('Clique com o botão DIREITO na pasta "Receitas" e escolha "Colar". O arquivo vai para dentro dela.', 'arquivo:colado', (d) => igual(d.nome, 'Receita de bolo') && igual(d.pasta, 'Receitas'), {
            destacar: [...noMenu('colar-na-pasta'), naJanela('arquivos', '[data-arquivo="Receitas"]')], mouse: 'direito',
          }),
          esperar('Dê um clique duplo na pasta "Receitas" para entrar nela.', 'pasta:aberta', (d) => igual(d.caminho, 'Receitas'), { destacar: naJanela('arquivos', '[data-arquivo="Receitas"]'), mouse: 'duplo' }),
          esperar('Olha o arquivo aqui dentro! Clique nele com o botão DIREITO e escolha "Renomear". Escreva Bolo de cenoura e clique em OK.', 'arquivo:renomeado', (d) => igual(d.nome, 'Bolo de cenoura'), {
            destacar: [...noMenu('renomear'), naJanela('arquivos', '.arq-item')], mouse: 'direito',
          }),
          esperar('Por último: botão direito no arquivo › "Propriedades". Ela mostra o tipo, onde ele está, o tamanho e quando foi criado.', 'propriedades:abertas', (d) => d.de === 'arquivo', {
            destacar: [...noMenu('propriedades'), naJanela('arquivos', '.arq-item')], mouse: 'direito',
          }),
          info('Leia as propriedades e clique em OK para fechar. Depois clique em Continuar.', { destacar: '[data-acao="ok-propriedades"]' }),
          quiz('Para ver todas as opções de um arquivo (abrir, renomear, excluir...), eu clico nele com...', ['O botão direito do mouse', 'A rodinha', 'O botão esquerdo, três vezes'], 0),
          fechar('arquivos', 'Arquivos'),
        ],
        conclusao: 'Ótimo! Agora você usa o botão direito igual no Windows de verdade.',
      },
      {
        id: 'arquivos-desafio', titulo: 'Desafio dos arquivos', icone: '🏅', desafio: true,
        descricao: 'Criar, salvar, excluir e esvaziar a lixeira.',
        passos: [
          info('Desafio! Faça tudo sozinho. Clique em "Continuar".'),
          esperar('Abra o Editor de Texto, escreva qualquer coisa e salve o documento com o nome: Teste', 'arquivo:salvo', (d) => d.nome.trim().toLowerCase() === 'teste'),
          esperar('Agora abra o programa Arquivos e mande o documento "Teste" para a lixeira.', 'arquivo:removido', (d) => d.nome.trim().toLowerCase() === 'teste'),
          esperar('Por último, vá até a Lixeira e esvazie a lixeira.', 'lixeira:esvaziada'),
        ],
        conclusao: 'Desafio vencido! Você sabe cuidar dos seus arquivos. 📁',
      },
    ],
  });
})();
