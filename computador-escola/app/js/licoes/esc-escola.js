// Curso livre "Trabalhos da escola" (para as crianças, e para quem ajuda os filhos): o professor pede um trabalho e o
// Professor Virtual conduz o caminho todo, como na vida real. Pesquisar na internet (no Procura), ler no site sem cair
// nas propagandas que piscam (o site Mundo Escolar, em navegador/sites-escola.js), escrever no Editor de Texto com as
// próprias palavras, dizer a fonte, salvar e imprimir para entregar.
(function () {
  const { info, quiz, esperar, abrir, naJanela, editorBotao, editorSalvar } = CE.L;
  const nav = (s) => naJanela('navegador', s);
  const ed = (s) => naJanela('editor', s);
  const palavras = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).length;
  const bilhete = (texto) => info(`📝 Bilhete da professora: “${texto}” Vamos fazer juntos!`, { emoji: '📝' });

  // Os passos de pesquisa: buscar no Procura, abrir o Mundo Escolar, fechar o aviso falso e ler até o fim.
  const pesquisar = (termo, tema, titulo) => [
    abrir('navegador', 'Navegador'),
    esperar(`Na página do Procura, clique no campo de pesquisa, escreva  ${termo}  e aperte Enter.`, 'navegador:pesquisa', (d) => new RegExp(termo.split(' ')[0].slice(0, 6), 'i').test(d.termo), {
      destacar: nav('.pr-campo'), dica: 'Se não aparecer o Procura, clique na casinha (página inicial) lá em cima.',
    }),
    esperar(`Clique no resultado do Mundo Escolar: “${titulo}”.`, 'navegador:visitou', (d) => d.url.includes('mundoescolar.com.br/pesquisa/' + tema), {
      destacar: nav(`[data-resultado="mundoescolar.com.br/pesquisa/${tema}"]`), mouse: 'esquerdo',
    }),
  ];
  const lerSemCair = (tema) => [
    esperar('Apareceu um aviso dizendo que o computador está com VÍRUS. É mentira, é propaganda! Feche o aviso pelo X pequenininho, no canto de cima dele.', 'escola:popup-fechado', null, {
      destacar: nav('.me-popup-x'), mouse: 'esquerdo', jaFeito: () => !document.querySelector('.janela[data-app="navegador"] .me-popup'),
      dica: 'O X é bem pequeno e cinza, no canto de cima à direita do aviso vermelho. NÃO clique em "LIMPAR AGORA".',
    }),
    esperar('Agora leia o texto com calma (use a rodinha do mouse para descer). Não clique em nada que pisca! No fim do texto, clique em “✅ Terminei de ler”.', 'escola:texto-lido', (d) => d.tema === tema, {
      destacar: nav('.me-li'), mouse: 'roda',
      dica: 'Se você clicou numa propaganda e apareceu a caveira, calma: é de mentira. Clique em “⬅️ Voltar para o texto”.',
    }),
  ];

  CE.adicionarModulo({
    id: 'esc-trabalhos', nivel: 'esc', titulo: 'Trabalhos da escola', icone: '🎒',
    licoes: [
      {
        id: 'esc-resumo', titulo: 'Resumo: dinossauros voadores', icone: '🦖',
        descricao: 'Pesquisar na internet, ler sem cair nas propagandas e escrever um resumo no Editor de Texto.',
        passos: [
          bilhete('Para sexta-feira: faça um RESUMO sobre os DINOSSAUROS VOADORES. Pesquise na internet e escreva no computador, com as suas palavras.'),
          ...pesquisar('dinossauros voadores', 'dinossauros-voadores', 'Dinossauros voadores: os pterossauros'),
          info('Olha quanta coisa piscando em volta do texto! São PROPAGANDAS: elas querem que você clique. Regra de ouro: o que pisca, promete prêmio ou diz “clique aqui”, a gente NÃO clica.', {
            emoji: '🚫', destacar: nav('.me-anuncio'),
          }),
          ...lerSemCair('dinossauros-voadores'),
          quiz('Os pterossauros eram dinossauros?', ['Não: eram répteis voadores, primos dos dinossauros', 'Sim, eram dinossauros'], 0, 'O apelido é “dinossauros voadores”, mas eles eram outro grupo de répteis.'),
          quiz('As asas dos pterossauros eram feitas de...', ['Pele, presa a um dedo comprido', 'Penas, como as do passarinho', 'Folhas de árvore'], 0),
          info('Agora vamos escrever o resumo. Resumo é contar com as SUAS palavras o mais importante do texto, bem curtinho.', { emoji: '✍️' }),
          abrir('editor', 'Editor de Texto'),
          esperar('Escreva o título:  Dinossauros voadores  e aperte Enter.', 'editor:texto', (d) => /dinossauros voadores/i.test(d.texto), { destacar: ed('.editor-pagina') }),
          esperar('Deixe o título em negrito: selecione o título (passe o mouse em cima dele segurando o botão) e clique no N.', 'editor:formatado', (d) => d.comando === 'bold', {
            destacar: ed('[data-comando="bold"]'), mouse: 'arrastar',
          }),
          esperar('Agora, embaixo do título, escreva o resumo com as SUAS palavras: pelo menos 3 frases. Conte o que eles eram, como eram as asas e o que comiam.', 'editor:texto', (d) => palavras(d.texto) >= 28, {
            destacar: ed('.editor-pagina'), dica: 'Exemplo de começo: “Os pterossauros eram répteis que voavam...”. Continue com as suas palavras.',
          }),
          esperar('No fim, escreva de onde você tirou a pesquisa:  Fonte: Mundo Escolar', 'editor:texto', (d) => /fonte/i.test(d.texto), { destacar: ed('.editor-pagina') }),
          editorSalvar('Resumo dinossauros voadores'),
          esperar('Para entregar à professora, imprima: clique no botão “🖨️ Imprimir” e, na janela, clique em “Imprimir”.', 'editor:impresso', null, {
            destacar: ['[data-acao="confirmar-impressao"]', ed('[data-comando="imprimir"]')], mouse: 'esquerdo',
          }),
          quiz('Copiar o texto inteiro do site e entregar como se fosse seu é...', ['Errado: o resumo é com as suas palavras, e a gente diz a fonte', 'Certo, ninguém vai saber'], 0),
        ],
        conclusao: 'Trabalho pronto e impresso! Você pesquisou, não caiu nas propagandas e escreveu com as suas palavras. 🦖✨',
      },
      {
        id: 'esc-propagandas', titulo: 'Propagandas que piscam e vírus', icone: '🚫',
        descricao: 'Reconhecer propaganda enganosa e pesquisar num site sem propaganda.',
        passos: [
          info('Em muitos sites de pesquisa aparecem propagandas: jogos grátis, prêmios, testes, botões gigantes de BAIXAR. Algumas trazem vírus, que estragam o computador ou roubam dados.', { emoji: '🦠' }),
          quiz('Apareceu: “SEU COMPUTADOR ESTÁ COM VÍRUS! Clique para limpar”. O que você faz?', ['Fecho pelo X e chamo um adulto', 'Clico em LIMPAR AGORA'], 0, 'Site nenhum consegue saber se o seu computador tem vírus. É só propaganda para você clicar.'),
          quiz('No meio do texto tem um botão verde gigante: “BAIXAR O TRABALHO PRONTO”. É...', ['Propaganda: não clico', 'Uma ajuda boa: clico e copio'], 0),
          quiz('“GANHE 10.000 MOEDAS NO SEU JOGO, é grátis!” Isso é...', ['Isca: não existe moeda grátis assim', 'Verdade: vou clicar logo'], 0),
          abrir('navegador', 'Navegador'),
          esperar('Agora um site SEM propaganda: na barra de endereço lá em cima, escreva  saberlivre.org/artigo/pterossauros  e aperte Enter.', 'navegador:visitou', (d) => d.url.includes('saberlivre.org/artigo/pterossauros'), {
            destacar: nav('.nav-endereco'), dica: 'Clique na barra branca lá em cima, apague o que estiver escrito e digite o endereço.',
          }),
          info('Viu a diferença? Na enciclopédia Saber Livre o texto é o mesmo assunto, sem nada piscando. Para trabalho da escola, prefira sites assim.', { emoji: '📚' }),
          quiz('Onde é melhor pesquisar para a escola?', ['Numa enciclopédia ou site sério, sem propaganda piscando', 'No site que tem mais coisas piscando'], 0),
          quiz('Se clicar sem querer numa propaganda e aparecer algo estranho, você...', ['Fecha e conta para um adulto', 'Esconde e continua clicando'], 0),
        ],
        conclusao: 'Agora você sabe: o que pisca e promete prêmio, a gente não clica. 🚫🦠',
      },
      {
        id: 'esc-cartaz', titulo: 'Cartaz: combata a dengue', icone: '🦟',
        descricao: 'Pesquisar e fazer um cartaz no Editor: título grande, colorido e uma lista de dicas.',
        passos: [
          bilhete('Trabalho em cartaz: COMBATA A DENGUE. Pesquise como evitar o mosquito e faça um cartaz com 3 dicas.'),
          ...pesquisar('dengue mosquito', 'dengue', 'Dengue: como combater o mosquito'),
          ...lerSemCair('dengue'),
          quiz('Onde o mosquito da dengue coloca os ovos?', ['Na água parada', 'Na areia seca', 'No ar condicionado'], 0),
          abrir('editor', 'Editor de Texto'),
          esperar('Escreva o título do cartaz:  COMBATA A DENGUE  e aperte Enter.', 'editor:texto', (d) => /combata a dengue/i.test(d.texto), { destacar: ed('.editor-pagina') }),
          editorBotao('Selecione o título e deixe a letra bem GRANDE: clique na caixinha do número e escolha 36.', 'fontSize', (d) => Number(d.valor) >= 6, { mouse: 'arrastar' }),
          editorBotao('Agora pinte o título: clique no quadradinho de cor e escolha vermelho.', 'foreColor', null, { dica: 'Depois de escolher a cor, clique fora da janelinha de cores.' }),
          editorBotao('Centralize o título: clique no botão Centralizar (≡).', 'justifyCenter'),
          esperar('Clique no fim do título, aperte Enter e clique no botão “Lista com marcadores” (•).', 'editor:formatado', (d) => d.comando === 'insertUnorderedList', {
            destacar: ed('[data-comando="insertUnorderedList"]'), mouse: 'esquerdo',
          }),
          esperar('Escreva 3 dicas, uma em cada linha (aperte Enter entre elas). Por exemplo: Não deixe água parada.', 'editor:texto', (d) => (d.html.match(/<li/gi) || []).length >= 3 && palavras(d.texto) >= 12, {
            destacar: ed('.editor-pagina'), dica: 'Outras dicas: vire as garrafas de boca para baixo; tampe a caixa-d’água; ponha areia nos pratinhos das plantas.',
          }),
          editorSalvar('Cartaz dengue'),
          esperar('Imprima o cartaz: clique em “🖨️ Imprimir” e depois em “Imprimir”.', 'editor:impresso', null, { destacar: ['[data-acao="confirmar-impressao"]', ed('[data-comando="imprimir"]')], mouse: 'esquerdo' }),
        ],
        conclusao: 'Cartaz pronto! Pendure na escola e ajude a combater a dengue. 🦟🚫',
      },
      {
        id: 'esc-capa', titulo: 'Capa do trabalho', icone: '📘',
        descricao: 'Fazer a capa: nome da escola, título no meio, seu nome, turma e a data.',
        passos: [
          bilhete('Todo trabalho precisa de CAPA: nome da escola, título, seu nome, sua turma e a data.'),
          abrir('editor', 'Editor de Texto'),
          esperar('Escreva o nome da sua escola e aperte Enter duas vezes.', 'editor:texto', (d) => palavras(d.texto) >= 2, { destacar: ed('.editor-pagina') }),
          esperar('Escreva o título do trabalho:  Dinossauros voadores  e aperte Enter duas vezes.', 'editor:texto', (d) => /dinossauros voadores/i.test(d.texto), { destacar: ed('.editor-pagina') }),
          esperar('Agora escreva: Aluno(a): e o seu nome. Na linha de baixo: Turma: e a sua turma. Na outra: a data de hoje.', 'editor:texto', (d) => /aluno/i.test(d.texto) && /turma/i.test(d.texto), { destacar: ed('.editor-pagina') }),
          esperar('Selecione TUDO (aperte Ctrl e a letra A juntos) e clique em Centralizar (≡).', 'editor:formatado', (d) => d.comando === 'justifyCenter', { destacar: ed('[data-comando="justifyCenter"]') }),
          editorBotao('Com tudo ainda selecionado, deixe em negrito (N).', 'bold'),
          editorSalvar('Capa do trabalho'),
          quiz('O que NÃO pode faltar na capa?', ['O seu nome e o título do trabalho', 'Um desenho de propaganda'], 0),
        ],
        conclusao: 'Capa caprichada! Ela vai na frente do trabalho, antes do resumo. 📘',
      },
      {
        id: 'esc-desafio', titulo: 'Desafio: trabalho sobre a Floresta Amazônica', icone: '🏅', desafio: true,
        descricao: 'Fazer sozinho: pesquisar, ler, escrever o resumo com a fonte, salvar e imprimir.',
        passos: [
          bilhete('DESAFIO: pesquise sobre a FLORESTA AMAZÔNICA e faça um resumo de 3 frases, com título em negrito e a fonte. Salve e imprima. Agora é com você!'),
          esperar('Pesquise “floresta amazonica” no Procura e abra um texto sobre ela (Mundo Escolar ou Saber Livre).', 'navegador:visitou', (d) => /mundoescolar\.com\.br\/pesquisa\/amazonia|saberlivre\.org\/artigo\/amazonia/.test(d.url)),
          esperar('Escreva o resumo no Editor: título “Floresta Amazônica”, pelo menos 3 frases com as suas palavras e a fonte no fim.', 'editor:texto', (d) => /floresta amaz/i.test(d.texto) && /fonte/i.test(d.texto) && palavras(d.texto) >= 30),
          esperar('Deixe o título em negrito.', 'editor:formatado', (d) => d.comando === 'bold'),
          esperar('Salve com o nome  Trabalho Amazônia .', 'arquivo:salvo', (d) => /amaz/i.test(d.nome) && d.tipo === 'documento'),
          esperar('Imprima o trabalho.', 'editor:impresso'),
        ],
        conclusao: 'Desafio vencido! Você fez um trabalho da escola inteirinho sozinho(a), sem cair em propaganda. 🏅🌳',
      },
    ],
  });
})();
