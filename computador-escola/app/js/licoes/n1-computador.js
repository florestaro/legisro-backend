// Nível 1 — Módulo 1: Conhecendo o computador.
(function () {
  const { info, quiz, esperar, abrir, fechar, naJanela } = CE.L;
  const peca = (id, texto) => esperar(texto, 'peca:clicada', (d) => d.peca === id, {
    destacar: naJanela('computador', `[data-peca="${id}"]`), mouse: 'esquerdo',
    dica: 'Passe a setinha por cima do desenho: a peça brilha quando a setinha está em cima dela.',
  });

  CE.adicionarModulo({
    id: 'n1-computador', nivel: 'n1', titulo: 'Conhecendo o computador', icone: '🖥️',
    licoes: [
      {
        id: 'pc-o-que-e', titulo: 'O que é um computador', icone: '🖥️',
        descricao: 'As partes principais: monitor, gabinete, teclado e mouse.',
        passos: [
          info('Olá! Eu sou o Professor Virtual. O computador é uma máquina que ajuda a escrever, fazer contas, guardar fotos, estudar, trabalhar e conversar com pessoas longe. Aqui é um computador de treino: pode errar à vontade, nada vai quebrar!', { emoji: '🖥️' }),
          abrir('computador', 'Conhecendo o Computador'),
          peca('monitor', 'Este é o desenho de um computador em cima da mesa. Clique na TELA grande, no meio do desenho.'),
          peca('gabinete', 'Agora clique na caixa preta alta, à direita. Ela se chama gabinete.'),
          peca('teclado', 'Clique no teclado, aquele cheio de teclinhas na frente da tela.'),
          peca('mouse', 'Por último, clique no mouse, ao lado do teclado.'),
          quiz('Qual parte do computador mostra as imagens e os textos?', ['O teclado', 'O monitor', 'O mouse'], 1, 'O monitor é a tela.'),
          quiz('Onde fica o "cérebro" do computador?', ['No gabinete', 'Na caixa de som', 'No monitor'], 0, 'O gabinete guarda o processador, que é o cérebro.'),
          quiz('Para que serve o teclado?', ['Para escrever letras e números', 'Para tocar música', 'Para imprimir'], 0),
          fechar('computador', 'Conhecendo o Computador'),
        ],
        conclusao: 'Parabéns! Agora você conhece as quatro partes principais: monitor, gabinete, teclado e mouse.',
      },
      {
        id: 'pc-ligar', titulo: 'Ligar, desligar e cuidar', icone: '⏻',
        descricao: 'O jeito certo de ligar e desligar, e os cuidados com o computador.',
        passos: [
          info('Para ligar o computador, apertamos o botão de ligar do gabinete. Ele tem este símbolo: ⏻. Às vezes o monitor também tem um botão.', { emoji: '⏻' }),
          abrir('computador', 'Conhecendo o Computador'),
          esperar('Encontre o botão redondo de ligar no gabinete e clique nele.', 'computador:ligado', null, {
            destacar: naJanela('computador', '[data-peca="botao-ligar"]'), mouse: 'esquerdo', dica: 'É o botão redondo com o símbolo ⏻, na frente do gabinete.',
          }),
          info('A tela acendeu! No computador de verdade, ele demora um pouquinho para ficar pronto. Tenha paciência.'),
          info('Para DESLIGAR, o certo é: botão Iniciar e depois Desligar. Assim o computador guarda tudo direitinho. Nunca desligue puxando o fio da tomada!', { emoji: '🔌' }),
          quiz('Qual é o jeito certo de desligar o computador?', ['Puxar o fio da tomada', 'Pelo botão Iniciar e depois "Desligar"', 'Apertando o botão do monitor'], 1),
          info('Cuidados importantes: não coma nem beba perto do teclado, limpe a tela com pano seco e macio, e deixe o computador num lugar arejado.', { emoji: '🧽' }),
          quiz('Qual destes é um cuidado com o computador?', ['Comer em cima do teclado', 'Manter longe de água e outros líquidos', 'Bater na tela quando trava'], 1),
          quiz('O computador ficou lento ou travou. O que fazer primeiro?', ['Ter paciência e esperar um pouco', 'Bater no gabinete', 'Puxar todos os fios'], 0, 'Muitas vezes ele só está ocupado. Espere um pouco antes de fazer qualquer coisa.'),
          fechar('computador', 'Conhecendo o Computador'),
        ],
        conclusao: 'Muito bem! Você sabe ligar, desligar do jeito certo e cuidar do computador.',
      },
      {
        id: 'pc-aparelhos', titulo: 'Entrada, saída e outros aparelhos', icone: '🖨️',
        descricao: 'Impressora, caixas de som, fone, webcam e pen drive.',
        passos: [
          info('Existem aparelhos de ENTRADA, que mandam informações para o computador (como o teclado e o mouse), e de SAÍDA, que mostram ou entregam alguma coisa (como o monitor).', { emoji: '🔁' }),
          abrir('computador', 'Conhecendo o Computador'),
          peca('impressora', 'Clique na impressora, à esquerda, com uma folha de papel.'),
          peca('caixa-som', 'Clique numa das caixas de som, ao lado da tela.'),
          peca('fone', 'Clique no fone de ouvido, que está em cima da mesa.'),
          peca('webcam', 'Clique na pequena câmera em cima da tela. Ela se chama webcam.'),
          peca('pendrive', 'Clique no pen drive vermelho, encaixado no gabinete.'),
          quiz('O mouse é um aparelho de...', ['Entrada: manda informações para o computador', 'Saída: o computador mostra algo por ele'], 0),
          quiz('A impressora é um aparelho de...', ['Entrada', 'Saída'], 1, 'Ela entrega no papel o que está no computador.'),
          quiz('Para levar um arquivo para outro computador, eu uso...', ['O pen drive', 'A caixa de som', 'A webcam'], 0),
          quiz('Para fazer uma chamada de vídeo, preciso de...', ['Webcam', 'Impressora', 'Pen drive'], 0),
          fechar('computador', 'Conhecendo o Computador'),
        ],
        conclusao: 'Excelente! Você já sabe para que serve cada aparelho ligado ao computador.',
      },
      {
        id: 'pc-desafio', titulo: 'Desafio: todas as peças', icone: '🏅', desafio: true,
        descricao: 'Descubra sozinho as 9 peças do computador.',
        passos: [
          info('Agora é com você! Neste desafio eu não vou mostrar onde clicar. Clique em "Continuar" para começar.'),
          esperar('Abra o programa "Conhecendo o Computador" e descubra as 9 peças do computador, clicando em cada uma.', 'peca:clicada', (d) => d.total >= 9),
          esperar('Agora ligue o computador do desenho. (Se ele já estiver ligado, desligue e ligue de novo.)', 'computador:ligado'),
          quiz('Qual destes é um aparelho de ARMAZENAMENTO (guarda arquivos)?', ['Pen drive', 'Mouse', 'Caixa de som'], 0),
        ],
        conclusao: 'Desafio vencido! Você conhece todas as peças do computador. Ganhou uma medalha!',
      },
    ],
  });
})();
