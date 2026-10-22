// Nível 1 — Módulo 4: Janelas e menu Iniciar. Módulo 5: Arquivos e pastas.
(function () {
  const { info, quiz, esperar, abrir, fechar, naJanela, garantirArquivo } = CE.L;

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
          esperar('O botão DIREITO abre um menu com opções extras. Clique com o botão direito num espaço vazio da área de trabalho (no fundo da tela).', 'menu-contexto:aberto', null, {
            mouse: 'direito', dica: 'Clique num lugar sem ícones e sem janelas.',
          }),
          esperar('Apareceu um menu! Clique em "Mudar o fundo de tela".', 'fundo:trocado', null, { destacar: '#menu-contexto', mouse: 'esquerdo' }),
          quiz('Onde fica o botão Iniciar?', ['No canto de baixo, à esquerda', 'No canto de cima, à direita', 'No meio da tela'], 0),
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
