// Nível 1 — Módulo 6: Editor de Texto básico. Módulo 7: Calculadora e Desenho.
(function () {
  const { info, quiz, esperar, abrir, fechar, naJanela, editorBotao, editorNovo, editorSalvar } = CE.L;

  const escrever = (texto, teste, dica) => esperar(texto, 'editor:texto', teste, { destacar: naJanela('editor', '.editor-pagina'), dica });
  const selecionar = (texto, minimo = 3) => esperar(texto, 'editor:selecao', (d) => d.selecionado.trim().length >= minimo, {
    mouse: 'arrastar', dica: 'Outra forma de selecionar uma palavra: dê um clique duplo em cima dela.',
  });
  const temNegrito = (html) => /<b>|<strong>|font-weight:\s*(bold|[6-9]00)/i.test(html);
  const centralizado = (html) => /text-align:\s*center/i.test(html);

  const conta = (texto, a, operacao, b) => esperar(texto, 'calculadora:resultado', (d) => d.a === a && d.b === b && d.operacao === operacao, {
    destacar: naJanela('calculadora', '.calc-teclas'), mouse: 'esquerdo', dica: 'Se errar, clique em C para começar de novo.',
  });
  const ferramentaDesenho = (id, texto) => esperar(texto, 'desenho:ferramenta', (d) => d.ferramenta === id, {
    destacar: naJanela('desenho', `[data-ferramenta="${id}"]`), mouse: 'esquerdo',
  });
  const corDesenho = (cor, texto) => esperar(texto, 'desenho:cor', (d) => d.cor === cor, {
    destacar: naJanela('desenho', `[data-cor="${cor}"]`), mouse: 'esquerdo',
  });

  CE.adicionarModulo({
    id: 'n1-editor', nivel: 'n1', titulo: 'Editor de Texto', icone: '📝',
    licoes: [
      {
        id: 'editor-primeiro', titulo: 'Meu primeiro documento', icone: '📝',
        descricao: 'Escrever, deixar em negrito, mudar o tamanho e salvar.',
        passos: [
          info('O Editor de Texto serve para escrever cartas, currículos, trabalhos da escola e muito mais. Ele é parecido com o Word.', { emoji: '📝' }),
          abrir('editor', 'Editor de Texto'),
          escrever('Clique na folha branca e escreva o seu nome completo. Para letra maiúscula, segure Shift e aperte a letra.', (d) => d.texto.trim().length >= 3),
          escrever('Agora aperte Enter para ir para a linha de baixo e escreva: Estou aprendendo a usar o computador.', (d) => /computador/i.test(d.texto),
            'A tecla Enter é a grande, do lado direito do teclado.'),
          selecionar('Vamos destacar o seu nome. Selecione o nome: coloque a setinha no começo, segure o botão do mouse e arraste até o fim. Ele vai ficar marcado em azul.'),
          editorBotao('Com o nome selecionado, clique no botão "N" lá em cima. Ele deixa a letra em negrito (mais grossa).', 'bold', (d) => d.ativo),
          editorBotao('Agora, com o nome ainda selecionado, aumente a letra: clique na caixinha com o número 12 e escolha 24.', 'fontSize', (d) => Number(d.valor) > 3,
            { dica: 'Se a seleção sumiu, selecione o nome de novo antes de mudar o tamanho.' }),
          editorBotao('Para deixar o nome no meio da folha, clique no botão "Centralizar" (≡).', 'justifyCenter'),
          editorSalvar('Meu primeiro documento'),
          quiz('Antes de deixar uma palavra em negrito, eu preciso...', ['Selecionar a palavra', 'Fechar o Editor', 'Apertar Enter'], 0),
        ],
        conclusao: 'Parabéns! Você criou, formatou e salvou seu primeiro documento.',
      },
      {
        id: 'editor-corrigir', titulo: 'Corrigindo erros', icone: '🩹',
        descricao: 'Apagar, trocar palavras e desfazer.',
        passos: [
          info('Todo mundo erra quando escreve! O computador facilita: dá para apagar, trocar palavras e até desfazer o que você fez.', { emoji: '🩹' }),
          abrir('editor', 'Editor de Texto'),
          editorNovo(),
          escrever('Escreva exatamente assim, com o erro no final: O gato bebeu leitee', (d) => /leitee/.test(d.texto)),
          escrever('Ops, tem um "e" a mais! Aperte o Backspace UMA vez para apagar a última letra.', (d) => /bebeu leite\s*$/.test(d.texto)),
          escrever('Agora vamos trocar "gato" por "cachorro". Dê um clique duplo em "gato" para selecionar e escreva "cachorro" por cima.', (d) => /cachorro bebeu leite/.test(d.texto),
            'Quando uma palavra está selecionada, o que você escrever substitui ela.'),
          editorBotao('Arrependeu? Clique no botão "Desfazer" (↶) para voltar ao "gato".', 'undo', null, { mouse: 'esquerdo' }),
          editorBotao('E o "Refazer" (↷) traz de volta o "cachorro". Clique nele.', 'redo', null, { mouse: 'esquerdo' }),
          quiz('Para trocar uma palavra por outra, eu...', ['Seleciono a palavra e escrevo a nova', 'Desligo o computador', 'Aperto o Caps Lock'], 0),
          quiz('O botão Desfazer (↶) serve para...', ['Voltar o que eu acabei de fazer', 'Salvar o documento', 'Imprimir'], 0),
        ],
        conclusao: 'Muito bem! Errar não é problema: agora você sabe corrigir.',
      },
      {
        id: 'editor-lista', titulo: 'Lista de compras', icone: '🛒',
        descricao: 'Fazer uma lista com marcadores e salvar.',
        passos: [
          info('Vamos fazer uma lista de compras de verdade, com marcadores (as bolinhas na frente de cada item).', { emoji: '🛒' }),
          abrir('editor', 'Editor de Texto'),
          editorNovo(),
          escrever('Escreva o título: Lista de compras   e aperte Enter.', (d) => /lista de compras/i.test(d.texto)),
          editorBotao('Clique no botão "Lista com marcadores" (•) para começar a lista.', 'insertUnorderedList'),
          escrever('Escreva 3 itens, apertando Enter depois de cada um. Ex.: arroz (Enter) feijão (Enter) leite', (d) => (d.html.match(/<li>/g) || []).length >= 3 && d.texto.trim().split(/\n+/).length >= 4,
            'Cada Enter cria uma bolinha nova.'),
          editorSalvar('Compras', (d) => /<li>/.test(d.conteudo)),
          quiz('Para criar um item novo na lista, aperto...', ['Enter', 'Backspace', 'Esc'], 0),
        ],
        conclusao: 'Sua lista está pronta e salva. Agora é só ir ao mercado! 🛒',
      },
      {
        id: 'editor-bilhete', titulo: 'Bilhete com estilo', icone: '💌',
        descricao: 'Itálico, sublinhado e cor da letra.',
        passos: [
          info('Vamos escrever um bilhete e deixar ele bonito com itálico (letra inclinada), sublinhado e cores.', { emoji: '💌' }),
          abrir('editor', 'Editor de Texto'),
          editorNovo(),
          escrever('Escreva um bilhete curto. Ex.: Fui ao mercado e volto logo. Beijos!', (d) => d.texto.trim().split(/\s+/).length >= 4),
          selecionar('Selecione o bilhete inteiro (arraste o mouse do começo ao fim).', 8),
          editorBotao('Clique no botão "I" para deixar a letra inclinada (itálico).', 'italic', (d) => d.ativo),
          editorBotao('Agora clique no botão "S" para sublinhar.', 'underline', (d) => d.ativo),
          editorBotao('Por último, clique no quadradinho de cor (ao lado do S) e escolha uma cor que você gosta.', 'foreColor', null, { dica: 'Depois de escolher a cor, clique fora da janelinha de cores.' }),
          editorSalvar('Bilhete'),
          quiz('O botão "I" deixa a letra...', ['Inclinada (itálico)', 'Mais grossa (negrito)', 'Com um risco embaixo'], 0),
        ],
        conclusao: 'Que bilhete bonito! 💌',
      },
      {
        id: 'editor-cartao', titulo: 'Cartão de aniversário', icone: '🎂',
        descricao: 'Fonte diferente, letra grande e centralizada.',
        passos: [
          info('Vamos fazer um cartão de aniversário com letra grande, diferente e centralizada.', { emoji: '🎂' }),
          abrir('editor', 'Editor de Texto'),
          editorNovo(),
          escrever('Escreva: Feliz aniversário!', (d) => /feliz anivers/i.test(d.texto)),
          selecionar('Selecione a frase inteira.', 8),
          editorBotao('Clique na caixinha da fonte (onde está escrito Calibri) e escolha "Comic Sans MS".', 'fontName'),
          editorBotao('Agora escolha o tamanho 36 na caixinha do número.', 'fontSize', (d) => Number(d.valor) >= 6),
          editorBotao('Mude a cor da letra para a cor que quiser.', 'foreColor'),
          editorBotao('Clique em "Centralizar" (≡).', 'justifyCenter'),
          editorSalvar('Cartão'),
        ],
        conclusao: 'Ficou lindo! Você já pode fazer cartões para a família. 🎂',
      },
      {
        id: 'editor-desafio', titulo: 'Desafio: convite', icone: '🏅', desafio: true,
        descricao: 'Fazer um convite com título em negrito e centralizado.',
        passos: [
          info('Desafio! Faça um convite sozinho. Clique em "Continuar".'),
          esperar('Abra o Editor de Texto e escreva um convite (ex.: Festa junina no sábado, às 19h). O título deve estar em NEGRITO e CENTRALIZADO. Salve com o nome: Convite', 'arquivo:salvo',
            (d) => d.tipo === 'documento' && d.nome.trim().toLowerCase() === 'convite' && temNegrito(d.conteudo) && centralizado(d.conteudo)),
          quiz('Para centralizar um texto, uso o botão...', ['Centralizar (≡)', 'Negrito (N)', 'Salvar'], 0),
        ],
        conclusao: 'Desafio vencido! Você é um escritor no computador. 📝',
      },
    ],
  });

  CE.adicionarModulo({
    id: 'n1-desenho', nivel: 'n1', titulo: 'Calculadora e Desenho', icone: '🎨',
    licoes: [
      {
        id: 'calc-dia-a-dia', titulo: 'Contas do dia a dia', icone: '🧮',
        descricao: 'Troco, compras e divisão de contas.',
        passos: [
          info('A Calculadora ajuda nas contas do dia a dia. Os sinais são: + somar, − diminuir, × multiplicar e ÷ dividir. O = mostra o resultado e o C limpa tudo.', { emoji: '🧮' }),
          abrir('calculadora', 'Calculadora'),
          conta('Uma compra deu R$ 37 e você pagou com R$ 50. Qual é o troco? Faça: 50 − 37 =', 50, '−', 37),
          conta('Você comprou 3 pacotes de arroz de R$ 12 cada. Quanto gastou? Faça: 3 × 12 =', 3, '×', 12),
          conta('Uma conta de R$ 100 vai ser dividida entre 4 pessoas. Quanto cada uma paga? Faça: 100 ÷ 4 =', 100, '÷', 4),
          quiz('Qual botão limpa a conta para começar de novo?', ['C', '=', '+'], 0),
          quiz('Para saber o troco, eu faço uma conta de...', ['Diminuir (−)', 'Multiplicar (×)', 'Dividir (÷)'], 0),
          fechar('calculadora', 'Calculadora'),
        ],
        conclusao: 'Muito bem! A Calculadora vai te ajudar no mercado e nas contas de casa.',
      },
      {
        id: 'desenho-primeiro', titulo: 'Meu primeiro desenho', icone: '🎨',
        descricao: 'Lápis, cores, círculo e balde de tinta.',
        passos: [
          info('No programa Desenho você pode criar desenhos com o mouse. É um ótimo jeito de treinar o arrastar!', { emoji: '🎨' }),
          abrir('desenho', 'Desenho'),
          esperar('Segure o botão do mouse em cima da folha branca e arraste para desenhar um risco.', 'desenho:traco', null, { mouse: 'arrastar', destacar: naJanela('desenho', '.ds-tela') }),
          corDesenho('vermelho', 'Agora clique na cor VERMELHA, lá em cima.'),
          esperar('Desenhe mais um pouco com o vermelho.', 'desenho:traco', (d) => d.cor === 'vermelho', { mouse: 'arrastar' }),
          ferramentaDesenho('circulo', 'Clique na ferramenta "Círculo" (⚪).'),
          esperar('Arraste na folha para desenhar um círculo grande, como um sol.', 'desenho:forma', (d) => d.forma === 'circulo', { mouse: 'arrastar' }),
          corDesenho('amarelo', 'Escolha a cor AMARELA.'),
          ferramentaDesenho('balde', 'Clique no "Balde de tinta" (🪣).'),
          esperar('Clique DENTRO do círculo para pintar o sol de amarelo.', 'desenho:balde', null, { mouse: 'esquerdo' }),
          ferramentaDesenho('lapis', 'Agora um truque do Paint de verdade. Escolha o "Lápis" (✏️).'),
          esperar('Clique com o botão DIREITO na cor AZUL da paleta: ela vira a "Cor 2" (veja a caixinha "Cor 2" mudar).', 'desenho:cor2', (d) => d.cor === 'azul', {
            destacar: naJanela('desenho', '[data-cor="azul"]'), mouse: 'direito',
          }),
          esperar('Agora desenhe SEGURANDO o botão DIREITO do mouse: o risco sai azul. Com o botão esquerdo, sai a Cor 1.', 'desenho:traco', (d) => d.botao === 'direito', { destacar: naJanela('desenho', '.ds-tela'), mouse: 'direito' }),
          esperar('Que lindo! Clique em "Salvar" e dê o nome "Meu desenho".', 'arquivo:salvo', (d) => d.tipo === 'imagem', {
            destacar: naJanela('desenho', '[data-comando="salvar"]'), mouse: 'esquerdo',
          }),
          quiz('Para desenhar com o mouse, eu...', ['Seguro o botão e arrasto', 'Dou clique duplo', 'Aperto o Enter'], 0),
        ],
        conclusao: 'Você é um artista! Seu desenho está salvo na pasta Meus Documentos.',
      },
      {
        id: 'desenho-casa', titulo: 'Desenhando uma casa', icone: '🏠',
        descricao: 'Retângulo, linha, borracha e desfazer.',
        passos: [
          info('Vamos desenhar uma casinha usando as formas prontas.', { emoji: '🏠' }),
          abrir('desenho', 'Desenho'),
          esperar('Clique em "Novo" para começar uma folha em branco. Se perguntar algo, clique em "Sim".', 'desenho:limpo', null, { destacar: naJanela('desenho', '[data-comando="novo"]'), mouse: 'esquerdo' }),
          ferramentaDesenho('retangulo', 'Clique na ferramenta "Retângulo" (⬛).'),
          esperar('Arraste na folha para desenhar a parede da casa.', 'desenho:forma', (d) => d.forma === 'retangulo', { mouse: 'arrastar' }),
          esperar('Desenhe mais um retângulo pequeno para ser a porta.', 'desenho:forma', (d) => d.forma === 'retangulo', { mouse: 'arrastar' }),
          ferramentaDesenho('linha', 'Agora escolha a ferramenta "Linha" (📏).'),
          esperar('Desenhe o telhado com duas linhas, formando um triângulo em cima da parede.', 'desenho:forma', (d) => d.forma === 'linha', { mouse: 'arrastar' }),
          ferramentaDesenho('borracha', 'Errou alguma coisa? Escolha a "Borracha" (🧽).'),
          esperar('Passe a borracha (arrastando) em algum risco que você queira apagar.', 'desenho:traco', (d) => d.ferramenta === 'borracha', { mouse: 'arrastar' }),
          esperar('Agora clique em "Desfazer" (↶) para trazer de volta o que a borracha apagou.', 'desenho:desfeito', null, { destacar: naJanela('desenho', '[data-comando="desfazer"]'), mouse: 'esquerdo' }),
          esperar('Pinte a casa com o balde de tinta, se quiser, e salve com o nome "Casa".', 'arquivo:salvo', (d) => d.tipo === 'imagem', { destacar: naJanela('desenho', '[data-comando="salvar"]') }),
        ],
        conclusao: 'Que casa bonita! 🏠',
      },
      {
        id: 'desenho-desafio', titulo: 'Desafio: a árvore', icone: '🏅', desafio: true,
        descricao: 'Desenhar uma árvore com tronco marrom e copa verde.',
        passos: [
          info('Desafio! Faça um desenho sozinho. Clique em "Continuar".'),
          esperar('Abra o Desenho e faça o tronco de uma árvore: um RETÂNGULO na cor MARROM.', 'desenho:forma', (d) => d.forma === 'retangulo' && d.cor === 'marrom'),
          esperar('Agora faça a copa da árvore: um CÍRCULO na cor VERDE.', 'desenho:forma', (d) => d.forma === 'circulo' && d.cor === 'verde'),
          esperar('Salve o desenho com o nome: Árvore', 'arquivo:salvo', (d) => d.tipo === 'imagem' && /rvore/i.test(d.nome)),
        ],
        conclusao: 'Desafio vencido! Você é um artista do computador. 🎨',
      },
    ],
  });
})();
