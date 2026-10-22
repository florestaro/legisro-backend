// Lições guiadas pelo Professor Virtual.
//
// Como criar uma lição nova: copie uma das lições abaixo e mude os textos.
// Cada passo tem:
//   texto    - o que o professor fala e mostra na tela
//   espera   - o evento que conclui o passo (veja a lista em LEIA-ME-LICOES.md). Sem "espera", aparece o botão "Continuar".
//   se       - (opcional) condição extra sobre o evento, ex.: só vale se o programa aberto for a Calculadora
//   destacar - (opcional) o que piscar na tela para ajudar o aluno
//   dica     - (opcional) ajuda extra se o aluno demorar
//   mouse    - (opcional) mostra o desenho do mouse: 'esquerdo', 'duplo', 'direito', 'arrastar', 'roda' ou 'mover'
//   jaFeito  - (opcional) se já estiver feito ao chegar no passo, pula sozinho
//   preparar - (opcional) algo para fazer antes do passo começar
window.CE = window.CE || {};

(function () {
  const passoAbrir = (id, nome) => ({
    texto: `Agora abra o programa "${nome}": coloque a setinha em cima do ícone dele e dê um clique duplo (dois cliques rápidos).`,
    mouse: 'duplo',
    espera: 'app:aberto',
    se: (d) => d.app === id,
    destacar: `.icone[data-icone="${id}"]`,
    jaFeito: () => CE.janelas.estaAberta(id),
    dica: 'O clique duplo precisa ser rápido: clique-clique! Se a janela não abrir, tente de novo um pouco mais rápido.',
  });

  const passoFechar = (id, nome) => ({
    texto: `Muito bem! Agora feche o programa "${nome}" clicando no X, no canto de cima à direita da janela.`,
    mouse: 'esquerdo',
    espera: 'janela:fechada',
    se: (d) => d.app === id,
    destacar: `.janela[data-app="${id}"] [data-acao="fechar"]`,
    jaFeito: () => !CE.janelas.estaAberta(id),
  });

  CE.LICOES = [
    // ---------------- Módulo 1: Primeiros passos ----------------
    {
      id: 'mouse',
      modulo: 'Primeiros passos',
      titulo: 'Conhecendo o mouse',
      icone: '🖱️',
      descricao: 'Mover a setinha, clicar e dar clique duplo.',
      passos: [
        { texto: 'Olá! Eu sou o Professor Virtual e vou te ensinar a usar o computador. Este é um computador de treino: aqui você pode errar à vontade, nada vai quebrar! Quando estiver pronto, clique no botão "Continuar".' },
        { texto: 'Pegue o mouse com a mão e mexa devagar em cima da mesa. Viu a setinha andando na tela? Ela segue o movimento da sua mão. Clique em "Continuar" quando tiver experimentado.', mouse: 'mover' },
        {
          texto: 'Agora vamos clicar. Coloque a setinha em cima do ícone "Calculadora" e aperte UMA vez o botão esquerdo do mouse. O ícone vai ficar marcado.',
          mouse: 'esquerdo',
          espera: 'icone:selecionado', se: (d) => d.app === 'calculadora',
          destacar: '.icone[data-icone="calculadora"]',
          dica: 'O botão esquerdo é o que fica embaixo do seu dedo indicador.',
        },
        {
          texto: 'Isso! Agora, para ABRIR o programa, damos um clique duplo: aperte duas vezes bem rápido no ícone da Calculadora.',
          mouse: 'duplo',
          espera: 'app:aberto', se: (d) => d.app === 'calculadora',
          destacar: '.icone[data-icone="calculadora"]',
          jaFeito: () => CE.janelas.estaAberta('calculadora'),
          dica: 'Clique-clique, bem rápido, sem mexer o mouse no meio.',
        },
        {
          texto: 'A Calculadora abriu! Vamos fazer uma conta: clique no 2, depois no +, depois no 3 e por fim no =.',
          mouse: 'esquerdo',
          espera: 'calculadora:resultado', se: (d) => d.a === 2 && d.b === 3 && d.operacao === '+',
          destacar: '.janela[data-app="calculadora"] .calc-teclas',
          dica: 'Se errar, clique no botão C para começar de novo.',
        },
        passoFechar('calculadora', 'Calculadora'),
      ],
      conclusao: 'Parabéns! Você aprendeu a clicar, a dar clique duplo e a fechar um programa. Isso é a base de tudo no computador!',
    },
    {
      id: 'janelas',
      modulo: 'Primeiros passos',
      titulo: 'Trabalhando com janelas',
      icone: '🪟',
      descricao: 'Mover, aumentar, esconder e trazer de volta uma janela.',
      passos: [
        { texto: 'Cada programa abre dentro de uma "janela". Vamos aprender a mexer nelas. Clique em "Continuar".' },
        passoAbrir('arquivos', 'Arquivos'),
        {
          texto: 'Vamos mudar a janela de lugar. Clique na barra azul de cima da janela (onde está escrito "Arquivos"), SEGURE o botão do mouse e arraste. Solte quando quiser.',
          mouse: 'arrastar',
          espera: 'janela:movida', se: (d) => d.app === 'arquivos',
          destacar: '.janela[data-app="arquivos"] .janela-titulo',
          dica: 'Não solte o botão enquanto estiver arrastando. Só solte no final.',
        },
        {
          texto: 'Ótimo! Agora deixe a janela do tamanho da tela inteira: clique no botão com um quadradinho (□), no canto de cima.',
          mouse: 'esquerdo',
          espera: 'janela:maximizada', se: (d) => d.app === 'arquivos',
          destacar: '.janela[data-app="arquivos"] [data-acao="maximizar"]',
        },
        {
          texto: 'Viu como ficou grande? Clique no mesmo quadradinho de novo para ela voltar ao tamanho normal.',
          mouse: 'esquerdo',
          espera: 'janela:normal', se: (d) => d.app === 'arquivos',
          destacar: '.janela[data-app="arquivos"] [data-acao="maximizar"]',
        },
        {
          texto: 'Agora vamos esconder a janela sem fechar. Clique no botão com um tracinho (–). Isso se chama minimizar.',
          mouse: 'esquerdo',
          espera: 'janela:minimizada', se: (d) => d.app === 'arquivos',
          destacar: '.janela[data-app="arquivos"] [data-acao="minimizar"]',
        },
        {
          texto: 'A janela sumiu, mas não fechou! Ela está guardada lá embaixo, na barra de tarefas. Clique no botão "Arquivos" na barra de baixo para ela voltar.',
          mouse: 'esquerdo',
          espera: 'janela:restaurada', se: (d) => d.app === 'arquivos',
          destacar: '.tarefa[data-app="arquivos"]',
        },
        passoFechar('arquivos', 'Arquivos'),
      ],
      conclusao: 'Excelente! Agora você sabe mover, maximizar, minimizar e fechar janelas. Esses botões são iguais em quase todos os programas do Windows.',
    },
    {
      id: 'menu-iniciar',
      modulo: 'Primeiros passos',
      titulo: 'Botão Iniciar e botão direito',
      icone: '🏁',
      descricao: 'Abrir programas pelo menu Iniciar e usar o botão direito do mouse.',
      passos: [
        {
          texto: 'Lá no canto de baixo, à esquerda, tem o botão "Iniciar". Ele mostra todos os programas do computador. Clique nele uma vez.',
          mouse: 'esquerdo',
          espera: 'menu-iniciar:aberto',
          destacar: '#botao-iniciar',
        },
        {
          texto: 'Abriu o menu! Agora clique em "Editor de Texto" na lista. No menu basta UM clique.',
          mouse: 'esquerdo',
          espera: 'app:aberto', se: (d) => d.app === 'editor',
          destacar: '#menu-iniciar .menu-item[data-app="editor"]',
          jaFeito: () => CE.janelas.estaAberta('editor'),
          dica: 'Se o menu fechou, clique de novo no botão Iniciar.',
        },
        passoFechar('editor', 'Editor de Texto'),
        {
          texto: 'O mouse também tem o botão DIREITO. Ele abre um menu com opções extras. Clique com o botão direito num espaço vazio da área de trabalho (no fundo da tela).',
          mouse: 'direito',
          espera: 'menu-contexto:aberto',
          dica: 'O botão direito fica embaixo do seu dedo médio. Clique num lugar sem ícones e sem janelas.',
        },
        {
          texto: 'Apareceu um menu! Clique em "Mudar o fundo de tela" para trocar a imagem de fundo.',
          mouse: 'esquerdo',
          espera: 'fundo:trocado',
          destacar: '#menu-contexto',
        },
      ],
      conclusao: 'Muito bem! Você usou o botão Iniciar e o botão direito do mouse. Quando estiver perdido, o botão Iniciar é sempre um bom lugar para começar.',
    },

    // ---------------- Módulo 2: Digitação ----------------
    {
      id: 'digitacao-maos',
      modulo: 'Digitação',
      titulo: 'Posição das mãos no teclado',
      icone: '⌨️',
      descricao: 'Sentar direito e colocar os dedos no lugar certo.',
      passos: [
        { texto: 'Antes de digitar: sente com as costas retas, os pés no chão e a tela na altura dos olhos. Os braços ficam relaxados. Clique em "Continuar".' },
        { texto: 'Olhe o teclado: as teclas F e J têm um risquinho em relevo. Coloque o dedo indicador da mão esquerda no F e o da mão direita no J. Os outros dedos ficam do lado, na mesma fileira. Clique em "Continuar".' },
        passoAbrir('digitacao', 'Digitação'),
        {
          texto: 'Clique no primeiro exercício, "Teclas F e J", e digite as letras que aparecem. A tecla que você precisa apertar fica acesa no teclado da tela.',
          mouse: 'esquerdo',
          espera: 'digitacao:concluida', se: (d) => d.exercicio === 'meio-1',
          destacar: '[data-exercicio="meio-1"]',
          dica: 'Não precisa ter pressa! Olhe para a tela e tente não olhar para o teclado.',
        },
        { texto: 'Você completou seu primeiro exercício de digitação! Treine um pouco todo dia: faça os próximos exercícios na ordem, sempre devagar no começo. Clique em "Continuar".' },
      ],
      conclusao: 'Parabéns! Com treino, seus dedos vão achar as teclas sozinhos. Volte ao programa Digitação sempre que puder.',
    },

    // ---------------- Módulo 3: Editor de Texto ----------------
    {
      id: 'editor-primeiro',
      modulo: 'Editor de Texto',
      titulo: 'Meu primeiro documento',
      icone: '📝',
      descricao: 'Escrever, deixar em negrito, mudar o tamanho e salvar.',
      passos: [
        { texto: 'O Editor de Texto serve para escrever cartas, currículos, trabalhos da escola e muito mais. É parecido com o Word. Clique em "Continuar".' },
        passoAbrir('editor', 'Editor de Texto'),
        {
          texto: 'Clique na folha branca e escreva o seu nome completo. Para letra maiúscula, segure a tecla Shift e aperte a letra.',
          mouse: 'esquerdo',
          espera: 'editor:texto', se: (d) => d.texto.trim().length >= 3,
          destacar: '.janela[data-app="editor"] .editor-pagina',
        },
        {
          texto: 'Agora aperte a tecla Enter para ir para a linha de baixo e escreva: Estou aprendendo a usar o computador.',
          espera: 'editor:texto', se: (d) => /computador/i.test(d.texto),
          dica: 'A tecla Enter é a tecla grande do lado direito do teclado, com uma setinha dobrada.',
        },
        {
          texto: 'Vamos destacar o seu nome. Primeiro selecione o nome: coloque a setinha no começo dele, segure o botão do mouse e arraste até o fim. Ele vai ficar marcado em azul.',
          mouse: 'arrastar',
          espera: 'editor:selecao', se: (d) => d.selecionado.trim().length >= 3,
          dica: 'Outra forma de selecionar: dê um clique duplo em cima de uma palavra.',
        },
        {
          texto: 'Com o nome selecionado, clique no botão "N" lá em cima. Ele deixa a letra em negrito (mais grossa).',
          mouse: 'esquerdo',
          espera: 'editor:formatado', se: (d) => d.comando === 'bold' && d.ativo,
          destacar: '.janela[data-app="editor"] [data-comando="bold"]',
        },
        {
          texto: 'Agora, com o nome ainda selecionado, aumente a letra: clique na caixinha com o número 12 e escolha um número maior, como 24.',
          mouse: 'esquerdo',
          espera: 'editor:formatado', se: (d) => d.comando === 'fontSize' && Number(d.valor) > 3,
          destacar: '.janela[data-app="editor"] [data-comando="fontSize"]',
          dica: 'Se a seleção sumiu, selecione o nome de novo antes de mudar o tamanho.',
        },
        {
          texto: 'Para deixar o nome no meio da folha, clique no botão "Centralizar" (≡).',
          mouse: 'esquerdo',
          espera: 'editor:formatado', se: (d) => d.comando === 'justifyCenter',
          destacar: '.janela[data-app="editor"] [data-comando="justifyCenter"]',
        },
        {
          texto: 'Está ficando lindo! Agora vamos guardar o documento: clique em "Salvar", escreva o nome "Meu primeiro documento" e clique em OK.',
          mouse: 'esquerdo',
          espera: 'arquivo:salvo', se: (d) => d.tipo === 'documento',
          destacar: '.janela[data-app="editor"] [data-comando="salvar"]',
          dica: 'Sempre salve o que você faz! Se o computador desligar, o que não foi salvo se perde.',
        },
      ],
      conclusao: 'Parabéns! Você criou, formatou e salvou seu primeiro documento. Ele está guardado no programa "Arquivos".',
    },
    {
      id: 'arquivos-encontrar',
      modulo: 'Editor de Texto',
      titulo: 'Encontrando seus documentos',
      icone: '📁',
      descricao: 'Achar, renomear e abrir um documento salvo.',
      passos: [
        {
          texto: 'Tudo o que você salva fica guardado em pastas. Eu deixei um documento chamado "Lista de compras" na sua pasta. Vamos encontrá-lo! Clique em "Continuar".',
          preparar: async () => {
            const existe = (await CE.sessao.arquivos()).some((a) => a.nome === 'Lista de compras');
            if (!existe) {
              await CE.sessao.salvarArquivo({
                nome: 'Lista de compras', tipo: 'documento',
                conteudo: '<b>Lista de compras</b><ul><li>Arroz</li><li>Feijão</li><li>Leite</li><li>Pão</li></ul>',
              });
            }
          },
        },
        passoAbrir('arquivos', 'Arquivos'),
        {
          texto: 'Esta é a sua pasta "Meus Documentos". Clique UMA vez em "Lista de compras" para selecionar.',
          mouse: 'esquerdo',
          espera: 'arquivo:selecionado', se: (d) => d.nome === 'Lista de compras',
          destacar: '.janela[data-app="arquivos"] [data-arquivo="Lista de compras"]',
        },
        {
          texto: 'Vamos mudar o nome do arquivo. Clique no botão "Renomear", escreva "Compras do mês" e clique em OK.',
          mouse: 'esquerdo',
          espera: 'arquivo:renomeado',
          destacar: '.janela[data-app="arquivos"] [data-acao="renomear"]',
        },
        {
          texto: 'O nome mudou! Agora dê um clique duplo no documento para abrir ele no Editor de Texto.',
          mouse: 'duplo',
          espera: 'arquivo:aberto',
          destacar: '.janela[data-app="arquivos"] .arq-item',
        },
        { texto: 'O documento abriu no Editor de Texto. Você pode continuar escrevendo nele e salvar de novo. Clique em "Continuar".' },
      ],
      conclusao: 'Ótimo trabalho! Agora você sabe onde ficam os seus documentos e como encontrá-los.',
    },
  ];
})();
