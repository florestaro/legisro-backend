// Respostas prontas do Professor Virtual, usadas quando não há modelo de IA instalado.
// Este arquivo é usado tanto pelo programa principal (Node) quanto pela tela (navegador).
(function (raiz) {
  const RESPOSTAS = [
    { palavras: ['clique duplo', 'duplo clique', 'dois cliques', 'abrir programa', 'abrir o programa', 'como abro', 'como abrir'],
      resposta: 'Para abrir um programa, coloque a setinha do mouse em cima do ícone e aperte o botão esquerdo duas vezes, bem rápido. Isso se chama clique duplo. Se não der certo, tente de novo um pouco mais rápido!' },
    { palavras: ['mouse', 'setinha', 'cursor', 'botão esquerdo', 'botao esquerdo'],
      resposta: 'O mouse move a setinha na tela. O botão da esquerda serve para clicar e escolher as coisas. O botão da direita abre opções extras. A rodinha do meio serve para rolar a página para cima e para baixo.' },
    { palavras: ['negrito'],
      resposta: 'Para deixar em negrito: primeiro selecione o texto, segurando o botão esquerdo do mouse e arrastando por cima das palavras. Depois clique no botão "N" lá em cima no Editor de Texto.' },
    { palavras: ['itálico', 'italico', 'sublinhado', 'sublinhar'],
      resposta: 'Selecione o texto arrastando o mouse por cima dele. Depois clique no botão "I" para itálico (letra inclinada) ou no botão "S" para sublinhado (risco embaixo).' },
    { palavras: ['selecionar', 'selecione', 'seleção', 'selecao', 'marcar o texto'],
      resposta: 'Para selecionar um texto, coloque a setinha no começo da palavra, segure o botão esquerdo do mouse e arraste até o final. O texto vai ficar marcado em azul.' },
    { palavras: ['salvar', 'salvo', 'salva', 'guardar', 'gravar'],
      resposta: 'Para salvar seu documento, clique no botão "Salvar" no Editor de Texto e escreva um nome para o arquivo. Depois você encontra ele no programa "Arquivos".' },
    { palavras: ['apagar', 'apaguei', 'errei', 'backspace', 'corrigir'],
      resposta: 'Errou uma letra? Sem problema! A tecla Backspace (a setinha para a esquerda, em cima do Enter) apaga a letra antes do cursor. A tecla Delete apaga a letra depois do cursor.' },
    { palavras: ['maiúscula', 'maiuscula', 'letra grande', 'shift', 'caps'],
      resposta: 'Para fazer uma letra maiúscula, segure a tecla Shift (a setinha para cima) e aperte a letra. Se quiser escrever tudo em maiúsculas, aperte uma vez a tecla Caps Lock.' },
    { palavras: ['acento', 'acentuar', 'til', 'cedilha', 'ç'],
      resposta: 'Para colocar acento, aperte primeiro a tecla do acento e depois a letra. Por exemplo: aperte a tecla do acento agudo (´) e depois o "a" para fazer "á". O "ç" tem uma tecla própria, ao lado do "L".' },
    { palavras: ['espaço', 'espaco', 'barra de espaço'],
      resposta: 'A barra de espaço é a tecla mais comprida do teclado, lá embaixo. Ela coloca um espaço entre as palavras. Aperte com o polegar.' },
    { palavras: ['enter', 'pular linha', 'nova linha', 'próxima linha'],
      resposta: 'A tecla Enter serve para pular para a linha de baixo quando você está escrevendo. Ela também confirma escolhas, como um "OK".' },
    { palavras: ['fechar', 'x vermelho', 'sair do programa'],
      resposta: 'Para fechar uma janela, clique no "X" no canto de cima, à direita da janela.' },
    { palavras: ['minimizar', 'esconder', 'sumiu', 'desapareceu'],
      resposta: 'O botão com um tracinho (–) no canto de cima da janela esconde ela na barra de tarefas, lá embaixo da tela. Para trazer de volta, clique no nome do programa na barra de tarefas.' },
    { palavras: ['maximizar', 'tela cheia', 'aumentar a janela', 'janela grande'],
      resposta: 'O botão com um quadradinho (□) no canto de cima da janela deixa ela do tamanho da tela inteira. Clique de novo para ela voltar ao tamanho normal.' },
    { palavras: ['arrastar', 'mover a janela', 'mudar de lugar'],
      resposta: 'Para mudar uma janela de lugar, clique na barra de cima dela (onde está o nome), segure o botão do mouse e arraste. Solte o botão quando chegar onde você quer.' },
    { palavras: ['iniciar', 'menu'],
      resposta: 'O botão "Iniciar" fica no canto de baixo, à esquerda da tela. Clique nele para ver a lista de todos os programas.' },
    { palavras: ['digitar', 'digitação', 'digitacao', 'dedos', 'teclado'],
      resposta: 'Na digitação, deixe os dedos indicadores nas teclas F e J. Elas têm um risquinho em relevo para você achar sem olhar. Vá devagar: primeiro acertar, depois ganhar velocidade!' },
    { palavras: ['pasta', 'arquivo', 'documento', 'onde está', 'onde esta', 'achar'],
      resposta: 'Seus documentos salvos ficam no programa "Arquivos". Dê um clique duplo no ícone dele na área de trabalho e procure pelo nome que você deu ao arquivo.' },
    { palavras: ['internet', 'navegador', 'site', 'google'],
      resposta: 'A internet é uma rede que liga computadores do mundo todo. Para acessar sites usamos um programa chamado navegador. Em breve teremos aqui uma aula de navegador para você treinar com segurança!' },
    { palavras: ['senha'],
      resposta: 'Uma senha é como a chave da sua casa: não conte para ninguém! Use uma senha que você consiga lembrar, mas que outras pessoas não adivinhem facilmente.' },
    { palavras: ['calculadora', 'calcular', 'conta', 'somar'],
      resposta: 'Abra a Calculadora com clique duplo no ícone. Clique nos números e nas operações (+, −, ×, ÷) e depois no "=" para ver o resultado.' },
    { palavras: ['olá', 'ola', 'oi', 'bom dia', 'boa tarde', 'boa noite'],
      resposta: 'Olá! Que bom ter você aqui. Pode me perguntar qualquer coisa sobre o computador. Estou aqui para ajudar!' },
    { palavras: ['obrigado', 'obrigada', 'valeu'],
      resposta: 'De nada! Você está indo muito bem. Continue assim!' },
  ];

  function normalizar(texto) {
    return ' ' + String(texto || '').toLowerCase().replace(/[.,!?;:()"]/g, ' ').replace(/\s+/g, ' ') + ' ';
  }

  // Palavras curtas ("oi", "ola") só valem como palavra inteira, para "foi" não virar "oi".
  function contem(texto, palavra) {
    return palavra.length <= 4 ? texto.includes(' ' + palavra + ' ') : texto.includes(palavra);
  }

  function responderSemIA(pergunta, situacao = {}) {
    const texto = normalizar(pergunta);
    const encontrada = RESPOSTAS.find((r) => r.palavras.some((p) => contem(texto, p)));
    if (encontrada) return encontrada.resposta;
    if (situacao.passo) {
      return `Vamos com calma! A tarefa agora é: ${situacao.passo} Se tiver dúvida, clique no botão "Repetir" para ouvir de novo a explicação.`;
    }
    return 'Não entendi muito bem. Tente perguntar de outro jeito, usando palavras como "mouse", "salvar", "negrito", "fechar janela" ou "digitar".';
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { responderSemIA };
  } else {
    raiz.CE = raiz.CE || {};
    raiz.CE.responderSemIA = responderSemIA;
  }
})(typeof window !== 'undefined' ? window : globalThis);
