// Nível 1 — Módulo 2: Mouse. Módulo 3: Teclado.
(function () {
  const { info, quiz, esperar, abrir, fechar, naJanela } = CE.L;

  const escolherJogo = (jogo, nome, mouse = 'esquerdo') => esperar(`No menu de jogos, clique em "${nome}".`, 'jogo:iniciado', (d) => d.jogo === jogo, {
    destacar: naJanela('jogos-mouse', `[data-jogo="${jogo}"]`), mouse: 'esquerdo',
    // Se os jogos já estiverem abertos (de outra aula), volta para o menu.
    preparar: () => { if (CE.janelas.estaAberta('jogos-mouse')) CE.janelas.abrir('jogos-mouse', { menu: true }); },
    dica: mouse === 'esquerdo' ? 'Um clique com o botão esquerdo no cartão do jogo.' : undefined,
  });
  const terminarJogo = (jogo, texto, mouse, dica) => esperar(texto, 'jogo:concluido', (d) => d.jogo === jogo, {
    mouse, destacar: naJanela('jogos-mouse', '.jm-palco'), dica,
  });

  const tecla = (nome, codigo, rotulo) => esperar(`Aperte a tecla ${rotulo} no teclado de verdade.`, 'tecla:apertada', (d) => d.tecla === codigo, {
    destacar: naJanela('teclas', `.tc-tecla[data-tecla="${codigo.toLowerCase()}"]`),
    dica: `Procure no teclado a tecla ${rotulo}. No desenho da tela ela está piscando em vermelho.`,
  });
  const escrever = (texto, teste, dica) => esperar(texto, 'teclas:texto', teste, { destacar: naJanela('teclas', '.tc-caixa'), dica });

  CE.adicionarModulo({
    id: 'n1-mouse', nivel: 'n1', titulo: 'Mouse', icone: '🖱️',
    licoes: [
      {
        id: 'mouse', titulo: 'Conhecendo o mouse', icone: '🖱️',
        descricao: 'Mover a setinha, clicar e dar clique duplo.',
        passos: [
          info('O mouse tem dois botões e uma rodinha no meio. O botão ESQUERDO é o mais usado: fica embaixo do dedo indicador. Clique em "Continuar".', { mouse: 'esquerdo' }),
          info('Pegue o mouse com a mão e mexa devagar em cima da mesa. Viu a setinha andando na tela? Ela segue o movimento da sua mão. Clique em "Continuar" quando tiver experimentado.', { mouse: 'mover' }),
          esperar('Coloque a setinha em cima do ícone "Calculadora" e aperte UMA vez o botão esquerdo. O ícone vai ficar marcado.', 'icone:selecionado', (d) => d.app === 'calculadora', {
            destacar: '.icone[data-icone="calculadora"]', mouse: 'esquerdo', dica: 'O botão esquerdo é o que fica embaixo do seu dedo indicador.',
          }),
          esperar('Isso! Para ABRIR um programa, damos um clique duplo: aperte duas vezes bem rápido no ícone da Calculadora.', 'app:aberto', (d) => d.app === 'calculadora', {
            destacar: '.icone[data-icone="calculadora"]', mouse: 'duplo', jaFeito: () => CE.janelas.estaAberta('calculadora'), dica: 'Clique-clique, bem rápido, sem mexer o mouse no meio.',
          }),
          esperar('A Calculadora abriu! Faça uma conta: clique no 2, depois no +, depois no 3 e por fim no =.', 'calculadora:resultado', (d) => d.a === 2 && d.b === 3 && d.operacao === '+', {
            destacar: naJanela('calculadora', '.calc-teclas'), mouse: 'esquerdo', dica: 'Se errar, clique no botão C para começar de novo.',
          }),
          fechar('calculadora', 'Calculadora'),
          quiz('Para ABRIR um programa pelo ícone, eu dou...', ['Um clique', 'Um clique duplo', 'Um clique com o botão direito'], 1),
        ],
        conclusao: 'Parabéns! Você aprendeu a clicar, a dar clique duplo e a fechar um programa.',
      },
      {
        id: 'mouse-baloes', titulo: 'Clique: estoure os balões', icone: '🎈',
        descricao: 'Treinar a pontaria do clique.',
        passos: [
          info('Vamos treinar o clique brincando! Quanto mais você pratica, mais certeira fica a sua mão.', { emoji: '🎈' }),
          abrir('jogos-mouse', 'Jogos do Mouse'),
          escolherJogo('baloes', 'Estoure os balões'),
          terminarJogo('baloes', 'Clique UMA vez em cada balão para estourar. Estoure 10 balões!', 'esquerdo', 'Coloque a setinha em cima do balão e clique. Não precisa correr!'),
          quiz('No clique simples, eu aperto o botão esquerdo...', ['Uma vez', 'Duas vezes rápido', 'E seguro apertado'], 0),
        ],
        conclusao: 'Que pontaria! Você estourou todos os balões.',
      },
      {
        id: 'mouse-presentes', titulo: 'Clique duplo: abra os presentes', icone: '🎁',
        descricao: 'Treinar o clique duplo.',
        passos: [
          info('O clique duplo são dois cliques bem rápidos, sem mexer o mouse. Ele serve para ABRIR coisas: programas, pastas e arquivos.', { mouse: 'duplo' }),
          abrir('jogos-mouse', 'Jogos do Mouse'),
          escolherJogo('presentes', 'Abra os presentes'),
          terminarJogo('presentes', 'Dê um clique duplo em cada presente para abrir. Se ele só tremer, foi um clique só: tente mais rápido!', 'duplo'),
          quiz('O clique duplo serve principalmente para...', ['Abrir programas e arquivos', 'Apagar arquivos', 'Desligar o computador'], 0),
        ],
        conclusao: 'Muito bem! Seu clique duplo está ótimo.',
      },
      {
        id: 'mouse-feira', titulo: 'Arrastar: a feira da fruta', icone: '🧺',
        descricao: 'Segurar o botão e arrastar coisas.',
        passos: [
          info('Arrastar é: apertar o botão esquerdo, CONTINUAR SEGURANDO, mover o mouse e só soltar no lugar certo. Usamos para mudar coisas de lugar.', { mouse: 'arrastar' }),
          abrir('jogos-mouse', 'Jogos do Mouse'),
          escolherJogo('feira', 'Feira da fruta'),
          terminarJogo('feira', 'Arraste cada fruta até a cesta: segure o botão em cima da fruta, leve até a cesta e solte.', 'arrastar', 'Não solte o botão no meio do caminho!'),
          quiz('Para arrastar, eu...', ['Clico duas vezes', 'Seguro o botão, movo o mouse e solto', 'Uso o botão direito'], 1),
        ],
        conclusao: 'Ótimo! Você aprendeu a arrastar. Isso vai servir para mover janelas e arquivos.',
      },
      {
        id: 'mouse-direito', titulo: 'Botão direito: caixas secretas', icone: '📦',
        descricao: 'Usar o botão direito do mouse.',
        passos: [
          info('O botão DIREITO do mouse abre um menu com opções extras. Ele fica embaixo do dedo médio.', { mouse: 'direito' }),
          abrir('jogos-mouse', 'Jogos do Mouse'),
          escolherJogo('caixas', 'Caixas secretas'),
          terminarJogo('caixas', 'Clique com o botão DIREITO em cada caixa para ver o que tem dentro.', 'direito', 'Use o dedo médio, no botão da direita.'),
          quiz('O botão direito do mouse serve para...', ['Abrir um menu com mais opções', 'Escrever letras', 'Fechar o computador'], 0),
        ],
        conclusao: 'Você descobriu todas as surpresas com o botão direito!',
      },
      {
        id: 'mouse-rodinha', titulo: 'Rodinha: caça ao tesouro', icone: '🏴‍☠️',
        descricao: 'Rolar a tela com a rodinha.',
        passos: [
          info('A rodinha do mouse serve para ROLAR: subir e descer em páginas compridas, sem precisar clicar. Gire com o dedo indicador.', { mouse: 'roda' }),
          abrir('jogos-mouse', 'Jogos do Mouse'),
          escolherJogo('tesouro', 'Caça ao tesouro'),
          esperar('Gire a rodinha do mouse para baixo e desça até o fundo do mar.', 'rolagem:fundo', null, { mouse: 'roda', destacar: naJanela('jogos-mouse', '.jm-palco') }),
          terminarJogo('tesouro', 'Achou o baú? Clique nele para pegar o tesouro!', 'esquerdo'),
          quiz('Para descer numa página comprida, eu uso...', ['A rodinha do mouse', 'O botão direito', 'O clique duplo'], 0),
        ],
        conclusao: 'Tesouro encontrado! Agora você sabe usar todos os botões do mouse.',
      },
      {
        id: 'mouse-mira', titulo: 'Mira e controle: pontaria e labirinto', icone: '🎯',
        descricao: 'Levar a setinha exatamente aonde você quer.',
        passos: [
          info('Para usar bem o computador, a setinha precisa ir EXATAMENTE aonde você quer. Mexa o mouse devagar e com calma: a precisão vem antes da pressa.', { mouse: 'mover' }),
          abrir('jogos-mouse', 'Jogos do Mouse'),
          escolherJogo('pontaria', 'Pontaria'),
          terminarJogo('pontaria', 'Clique bem no meio de cada alvo que aparecer.', 'esquerdo', 'Leve a setinha até o centro vermelho e só então clique.'),
          info('Muito bem! Agora o labirinto: clique no ratinho e, SEM APERTAR NADA, leve a setinha pelo caminho claro até o queijo. Se encostar na parede, volta para o começo.', { mouse: 'mover' }),
          esperar('Clique em "← Jogos" para voltar ao menu e escolha "Labirinto do ratinho".', 'jogo:iniciado', (d) => d.jogo === 'labirinto', {
            destacar: [naJanela('jogos-mouse', '[data-jogo="labirinto"]'), naJanela('jogos-mouse', '.jm-cabecalho .botao')], mouse: 'esquerdo',
          }),
          terminarJogo('labirinto', 'Leve o ratinho até o queijo sem encostar na parede.', 'mover', 'Vá devagar! Pode apoiar o pulso na mesa.'),
          info('Cada jogo tem os níveis Médio e Difícil. Quando quiser treinar mais, volte aos Jogos do Mouse e vá subindo de nível. Tem até medalha para quem vencer todos!', { emoji: '🏅' }),
          quiz('Para acertar um botão pequeno, o melhor é...', ['Mexer o mouse com calma e clicar quando a setinha estiver em cima', 'Clicar várias vezes bem rápido', 'Fechar os olhos'], 0),
        ],
        conclusao: 'Excelente! Sua mira está ótima.',
      },
      {
        id: 'mouse-desafio', titulo: 'Desafio do mouse', icone: '🏅', desafio: true,
        descricao: 'Três jogos seguidos, sem ajuda.',
        passos: [
          info('Desafio! Abra os Jogos do Mouse e complete três jogos sozinho. Clique em "Continuar" para começar.'),
          esperar('Complete o jogo "Abra os presentes".', 'jogo:concluido', (d) => d.jogo === 'presentes'),
          esperar('Agora complete o jogo "Feira da fruta". (Clique em "Outros jogos" para voltar ao menu.)', 'jogo:concluido', (d) => d.jogo === 'feira'),
          esperar('Por último, complete o jogo "Caixas secretas".', 'jogo:concluido', (d) => d.jogo === 'caixas'),
        ],
        conclusao: 'Você é um mestre do mouse! 🖱️',
      },
    ],
  });

  CE.adicionarModulo({
    id: 'n1-teclado', nivel: 'n1', titulo: 'Teclado', icone: '⌨️',
    licoes: [
      {
        id: 'teclado-conhecer', titulo: 'As teclas mais importantes', icone: '⌨️',
        descricao: 'Espaço, Enter e Backspace.',
        passos: [
          info('O teclado tem letras, números e algumas teclas especiais. Vamos conhecer as mais usadas. O programa "Treino do Teclado" diz o nome de cada tecla que você apertar.', { emoji: '⌨️' }),
          abrir('teclas', 'Treino do Teclado'),
          tecla('espaco', ' ', 'BARRA DE ESPAÇO (a mais comprida, lá embaixo)'),
          tecla('enter', 'Enter', 'ENTER (a grande, à direita, com uma setinha dobrada)'),
          tecla('backspace', 'Backspace', 'BACKSPACE (em cima do Enter, com uma seta para a esquerda)'),
          escrever('Clique na caixa branca de baixo e escreva a palavra: casa', (d) => /casa/i.test(d.texto), 'Clique dentro da caixa antes de escrever.'),
          escrever('Agora apague a palavra inteira com a tecla Backspace.', (d) => d.texto.trim() === ''),
          quiz('Qual tecla apaga a letra que está ANTES do cursor?', ['Enter', 'Backspace', 'Barra de espaço'], 1),
          quiz('Qual tecla pula para a linha de baixo?', ['Enter', 'Shift', 'Esc'], 0),
          fechar('teclas', 'Treino do Teclado'),
        ],
        conclusao: 'Muito bem! Espaço, Enter e Backspace são as teclas que você mais vai usar.',
      },
      {
        id: 'teclado-maiusculas', titulo: 'Letras maiúsculas e Caps Lock', icone: '🔠',
        descricao: 'Shift para uma maiúscula, Caps Lock para todas.',
        passos: [
          info('Para fazer UMA letra maiúscula, segure a tecla Shift (a setinha para cima ⇧) e aperte a letra. Para escrever TUDO em maiúsculas, aperte uma vez o Caps Lock.', { emoji: '🔠' }),
          abrir('teclas', 'Treino do Teclado'),
          escrever('Clique na caixa e escreva o seu nome com a primeira letra maiúscula. Ex.: Maria', (d) => /(^|\s)[A-ZÀ-Ý][a-zà-ÿ]{2,}/.test(d.texto), 'Segure o Shift com uma mão e aperte a letra com a outra.'),
          tecla('caps', 'CapsLock', 'CAPS LOCK (à esquerda, em cima do Shift)'),
          escrever('Com o Caps Lock ligado, escreva: SOL', (d) => d.texto.includes('SOL')),
          tecla('caps', 'CapsLock', 'CAPS LOCK de novo, para desligar'),
          quiz('Para fazer UMA letra maiúscula, eu...', ['Seguro o Shift e aperto a letra', 'Aperto o Enter', 'Aperto a barra de espaço'], 0),
          quiz('Com o Caps Lock ligado, as letras saem...', ['Todas maiúsculas', 'Todas apagadas', 'Em outra cor'], 0),
          fechar('teclas', 'Treino do Teclado'),
        ],
        conclusao: 'Ótimo! Agora você escreve nomes e frases com letra maiúscula.',
      },
      {
        id: 'teclado-acentos', titulo: 'Acentos e cedilha', icone: '✍️',
        descricao: 'Escrever á, ã, ê e ç.',
        passos: [
          info('Para escrever uma letra com acento, aperte PRIMEIRO a tecla do acento e DEPOIS a letra. A tecla do acento não mostra nada sozinha: ela espera a letra. O ç tem uma tecla própria, ao lado do L.', { emoji: 'á' }),
          abrir('teclas', 'Treino do Teclado'),
          escrever('Clique na caixa e escreva: café   (acento ´ e depois a letra e)', (d) => d.texto.includes('café'), 'A tecla do acento agudo ´ fica perto do Enter.'),
          escrever('Agora escreva: mãe   (acento ~ e depois a letra a)', (d) => d.texto.includes('mãe'), 'A tecla do til ~ fica ao lado do ç.'),
          escrever('Agora escreva: você   (segure Shift e aperte a tecla do ~ para fazer o ^, depois a letra e)', (d) => d.texto.includes('você')),
          escrever('Agora escreva: maçã', (d) => d.texto.includes('maçã')),
          quiz('Para escrever "á", eu aperto...', ['Primeiro o acento ´ e depois o a', 'Primeiro o a e depois o acento', 'Só o a, duas vezes'], 0),
          fechar('teclas', 'Treino do Teclado'),
        ],
        conclusao: 'Parabéns! Escrever com acentos é muito importante no português.',
      },
      {
        id: 'teclado-setas', titulo: 'Setas, Delete e Esc', icone: '⬅️',
        descricao: 'Andar pelo texto e corrigir.',
        passos: [
          info('As setas movem o cursor (a barrinha que pisca) pelo texto. O Delete apaga a letra DEPOIS do cursor. O Esc cancela ou fecha coisas.', { emoji: '⬅️➡️' }),
          abrir('teclas', 'Treino do Teclado'),
          tecla('esquerda', 'ArrowLeft', 'SETA PARA A ESQUERDA (←)'),
          tecla('direita', 'ArrowRight', 'SETA PARA A DIREITA (→)'),
          tecla('delete', 'Delete', 'DELETE (Del)'),
          tecla('esc', 'Escape', 'ESC (no canto de cima, à esquerda)'),
          quiz('A tecla Delete apaga a letra que está...', ['Antes do cursor', 'Depois do cursor'], 1),
          quiz('Para mover o cursor uma letra para trás, uso...', ['A seta para a esquerda', 'O Enter', 'O Caps Lock'], 0),
          fechar('teclas', 'Treino do Teclado'),
        ],
        conclusao: 'Muito bem! Com as setas e o Delete fica fácil corrigir o que você escreve.',
      },
      {
        id: 'teclado-digitacao', titulo: 'Posição das mãos e primeiro exercício', icone: '🖐️',
        descricao: 'Sentar direito e começar o curso de digitação.',
        passos: [
          info('Antes de digitar: sente com as costas retas, os pés no chão e a tela na altura dos olhos. Os braços ficam relaxados.', { emoji: '🪑' }),
          info('Olhe o teclado: as teclas F e J têm um risquinho em relevo. Coloque o indicador esquerdo no F e o direito no J. Os outros dedos ficam do lado, na mesma fileira.', { emoji: '🖐️' }),
          abrir('digitacao', 'Digitação'),
          esperar('Clique no primeiro exercício, "Teclas F J", e digite as letras até bater a meta. A tecla certa acende no teclado da tela.', 'digitacao:concluida', (d) => d.exercicio === 'i-meio-1' && d.aprovado, {
            destacar: naJanela('digitacao', '[data-exercicio="i-meio-1"]'), mouse: 'esquerdo',
            dica: 'Não precisa ter pressa! Se não bater a meta, clique em "Tentar de novo".',
          }),
          info('Você bateu a meta do primeiro exercício! O curso de digitação tem mais de 100 exercícios. Treine um pouco em toda aula, sempre na ordem.'),
        ],
        conclusao: 'Parabéns! Com treino, seus dedos vão achar as teclas sozinhos.',
      },
      {
        id: 'teclado-desafio', titulo: 'Desafio do teclado', icone: '🏅', desafio: true,
        descricao: 'Escrever uma frase com maiúscula, acento e ponto.',
        passos: [
          info('Desafio! Use o Treino do Teclado para escrever uma frase sozinho. Clique em "Continuar".'),
          esperar('Abra o "Treino do Teclado" e escreva na caixa, exatamente assim: Eu moro no Brasil e adoro café.', 'teclas:texto', (d) => d.texto.includes('Eu moro no Brasil e adoro café.')),
          quiz('Qual tecla deixa só UMA letra maiúscula?', ['Shift', 'Caps Lock', 'Tab'], 0),
        ],
        conclusao: 'Desafio vencido! Você é amigo do teclado. ⌨️',
      },
    ],
  });
})();
