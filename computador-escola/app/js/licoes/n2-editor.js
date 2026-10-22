// Nível 2 — Módulo 3: Editor de Texto intermediário.
(function () {
  const { info, quiz, esperar, abrir, fechar, naJanela, editorBotao, editorNovo, editorSalvar, abrirExemplo } = CE.L;
  const ed = (s) => naJanela('editor', s);
  const semCampos = (d) => !/\[[^\]]*\]/.test(d.texto);
  const celulasPreenchidas = (html) => { const div = document.createElement('div'); div.innerHTML = html; return [...div.querySelectorAll('td')].filter((td) => td.textContent.trim()).length; };
  const temNegrito = (html) => /<b>|<strong>|font-weight:\s*(bold|[6-9]00)/i.test(html);

  const TEXTO_FORMATAR = '<div>A água é essencial para a vida. Sem ela, plantas, animais e pessoas não sobrevivem. Por isso, precisamos economizar e cuidar dos rios e das nascentes.</div><div>Em casa, podemos fechar a torneira ao escovar os dentes, tomar banhos mais curtos e reaproveitar a água da máquina de lavar para limpar o quintal.</div>';
  const BILHETE_ERROS = '<div>Oje eu vou no mercado. Voce quer alguma coisa? Concerteza vou comprar xuxu e iorgute.</div><div>Tambem preciso passar no correio, porisso vou chegar tarde.</div>';

  CE.adicionarModulo({
    id: 'n2-editor', nivel: 'n2', titulo: 'Editor de Texto intermediário', icone: '📝',
    licoes: [
      {
        id: 'n2-editor-carta', titulo: 'Carta pessoal com modelo', icone: '💌',
        descricao: 'Usar um modelo pronto e preencher os campos.',
        passos: [
          info('O Editor tem MODELOS prontos: carta, currículo, requerimento e recibo. Os campos em amarelo, entre [colchetes], são para você trocar pelos seus dados.', { emoji: '💌' }),
          abrir('editor', 'Editor de Texto'),
          editorNovo('carta', 'Carta pessoal'),
          esperar('Clique em cada campo amarelo e escreva por cima: a sua cidade, o nome de quem vai receber, a mensagem e o seu nome. Quando trocar todos, os colchetes somem.', 'editor:texto', semCampos, {
            destacar: ed('.campo-modelo'), mouse: 'esquerdo', dica: 'Um clique no campo amarelo seleciona ele inteiro. Aí é só escrever.',
          }),
          editorSalvar('Carta'),
          quiz('Para que servem os modelos do Editor?', ['Para começar um documento já arrumado, só trocando os dados', 'Para apagar documentos', 'Para imprimir mais rápido'], 0),
        ],
        conclusao: 'Que carta bonita! Os modelos economizam muito tempo.',
      },
      {
        id: 'n2-editor-paragrafos', titulo: 'Parágrafos: justificar, recuo e espaçamento', icone: '📐',
        descricao: 'Deixar o texto com cara de trabalho caprichado.',
        passos: [
          info('Abri um texto para você arrumar. Vamos deixar os parágrafos alinhados dos dois lados, com recuo e espaço entre as linhas, como nos trabalhos da escola.', {
            emoji: '📐', preparar: () => abrirExemplo('Texto para formatar', 'documento', TEXTO_FORMATAR, true),
          }),
          esperar('Primeiro selecione todo o texto: clique na folha e aperte Ctrl+A.', 'atalho:usado', (d) => d.atalho === 'Ctrl+A', { destacar: ed('.editor-pagina') }),
          editorBotao('Clique no botão "Justificar" (☰): as linhas ficam retinhas dos dois lados.', 'justifyFull'),
          editorBotao('Clique em "Aumentar recuo" (⇢): o texto se afasta um pouco da margem.', 'indent'),
          editorBotao('Na caixinha do espaçamento (↕), escolha 1,5.', 'lineHeight', (d) => Number(d.valor) >= 1.5),
          editorBotao('Na caixa "Margem normal", escolha "Margem larga".', 'margem', (d) => d.valor === 'larga'),
          esperar('Ficou com cara de trabalho caprichado! Salve com Ctrl+S.', 'arquivo:salvo', (d) => d.tipo === 'documento'),
          quiz('Justificar um texto deixa as linhas...', ['Alinhadas dos dois lados', 'Todas no meio da folha', 'Em negrito'], 0),
          quiz('Espaçamento 1,5 entre linhas serve para...', ['Deixar o texto mais fácil de ler', 'Apagar as linhas', 'Mudar a cor'], 0),
        ],
        conclusao: 'Muito bem! Agora seus textos ficam bem organizados.',
      },
      {
        id: 'n2-editor-ortografia', titulo: 'Corrigindo erros com o corretor', icone: '✔️',
        descricao: 'Usar o botão Ortografia para achar e corrigir palavras erradas.',
        passos: [
          info('Abri um bilhete escrito com pressa, cheio de erros. O corretor ortográfico ajuda a encontrar as palavras erradas.', { emoji: '✔️', preparar: () => abrirExemplo('Bilhete com erros', 'documento', BILHETE_ERROS, true) }),
          esperar('Clique no botão "✔️ Ortografia".', 'editor:ortografia', (d) => d.acao === 'verificar' && d.encontrados > 0, { destacar: ed('[data-comando="ortografia"]'), mouse: 'esquerdo' }),
          esperar('As palavras erradas ficaram sublinhadas de vermelho. Clique em cada uma para trocar pela forma certa.', 'editor:ortografia', (d) => d.acao === 'corrigir' && d.restantes === 0, { destacar: ed('.erro-ortografia'), mouse: 'esquerdo' }),
          esperar('Tudo corrigido! Salve o bilhete (Ctrl+S).', 'arquivo:salvo', (d) => d.tipo === 'documento'),
          quiz('O corretor ortográfico...', ['Ajuda a achar palavras escritas errado', 'Escreve o texto sozinho', 'Muda a fonte'], 0),
          quiz('Qual é a forma certa?', ['Com certeza', 'Concerteza', 'Com serteza'], 0),
        ],
        conclusao: 'Ótimo! Revisar o texto antes de mandar faz toda a diferença.',
      },
      {
        id: 'n2-editor-tabela', titulo: 'Tabelas: horário dos remédios', icone: '▦',
        descricao: 'Criar uma tabela e acrescentar linhas.',
        passos: [
          info('TABELAS organizam informações em linhas e colunas. Vamos fazer um horário de remédios: remédio, horário e quantidade.', { emoji: '💊' }),
          abrir('editor', 'Editor de Texto'),
          editorNovo(),
          esperar('Escreva o título: Horário dos remédios   e aperte Enter.', 'editor:texto', (d) => /rem[eé]dios/i.test(d.texto), { destacar: ed('.editor-pagina') }),
          editorBotao('Clique no botão "▦ Tabela". Ele vai perguntar: escolha 3 linhas e 3 colunas.', 'inserirTabela'),
          esperar('Clique nas caixinhas da tabela e preencha. Na primeira linha: Remédio, Horário, Quantidade. Nas outras, invente dois remédios.', 'editor:texto', (d) => celulasPreenchidas(d.html) >= 6, {
            destacar: ed('.editor-pagina td'), mouse: 'esquerdo', dica: 'Clique numa caixinha, escreva, e clique na próxima. A tecla Tab também pula para a próxima caixinha.',
          }),
          editorBotao('Precisa de mais um remédio? Clique dentro da última linha da tabela e depois em "➕ Linha".', 'inserirLinhaTabela'),
          editorSalvar('Horário dos remédios'),
          quiz('Numa tabela, as informações ficam organizadas em...', ['Linhas e colunas', 'Pastas e arquivos', 'Abas'], 0),
        ],
        conclusao: 'Muito bem! Tabelas são ótimas para horários, listas e contatos.',
      },
      {
        id: 'n2-editor-imagem', titulo: 'Colocando imagens no documento', icone: '🖼️',
        descricao: 'Inserir figuras e desenhos seus.',
        passos: [
          info('Um documento fica mais bonito com imagens. Você pode usar uma figura pronta ou um dos seus desenhos do programa Desenho.', { emoji: '🖼️' }),
          abrir('editor', 'Editor de Texto'),
          editorNovo(),
          esperar('Escreva: Convite para o churrasco   (ou outro convite que você quiser).', 'editor:texto', (d) => d.texto.trim().length >= 6, { destacar: ed('.editor-pagina') }),
          editorBotao('Aperte Enter para ir para a linha de baixo e clique em "🖼️ Imagem". Escolha uma figura ou um desenho seu.', 'inserirImagem'),
          editorSalvar('Convite com imagem'),
          quiz('Posso colocar no documento um desenho que eu fiz no programa Desenho?', ['Sim, pelo botão Imagem', 'Não, nunca'], 0),
        ],
        conclusao: 'Ficou lindo! Imagens deixam o documento mais atraente.',
      },
      {
        id: 'n2-editor-curriculo', titulo: 'Montando o seu currículo', icone: '👔',
        descricao: 'Usar o modelo de currículo para procurar emprego.',
        passos: [
          info('O CURRÍCULO conta para a empresa quem você é: seus dados, estudos, experiências e habilidades. Vamos montar o seu com o modelo pronto.', { emoji: '👔' }),
          abrir('editor', 'Editor de Texto'),
          editorNovo('curriculo', 'Currículo'),
          esperar('Troque TODOS os campos amarelos pelos seus dados. Se não tiver alguma informação (por exemplo, experiência), apague a linha inteira.', 'editor:texto', semCampos, {
            destacar: ed('.campo-modelo'), mouse: 'esquerdo', dica: 'Para apagar uma linha: selecione a linha arrastando o mouse e aperte Delete.',
          }),
          editorSalvar('Meu currículo'),
          quiz('No currículo eu coloco...', ['Meus dados, estudos, experiências e habilidades', 'Minha senha do banco', 'Fofocas do bairro'], 0),
          quiz('Antes de enviar o currículo, o mais importante é...', ['Revisar se não tem erros', 'Mudar todas as cores', 'Colocar muitas figuras'], 0),
        ],
        conclusao: 'Parabéns! Seu currículo está pronto para ajudar você a conseguir um emprego.',
      },
      {
        id: 'n2-editor-requerimento', titulo: 'Requerimento e documentos formais', icone: '📜',
        descricao: 'Escrever um pedido formal para escola, prefeitura ou empresa.',
        passos: [
          info('REQUERIMENTO é um pedido formal, por escrito: pedir uma declaração na escola, um documento na prefeitura, férias na empresa. Usa linguagem educada e respeitosa.', { emoji: '📜' }),
          abrir('editor', 'Editor de Texto'),
          editorNovo('requerimento', 'Requerimento'),
          esperar('Preencha todos os campos amarelos. Exemplo: peça a "declaração de matrícula" para a escola.', 'editor:texto', semCampos, { destacar: ed('.campo-modelo'), mouse: 'esquerdo' }),
          editorSalvar('Requerimento'),
          quiz('Num documento formal, a linguagem deve ser...', ['Educada e respeitosa', 'Cheia de gírias', 'Com muitos emojis'], 0),
          quiz('"Nestes termos, peço deferimento" quer dizer...', ['Que você espera que o pedido seja aceito', 'Que você desiste do pedido', 'Que é uma reclamação'], 0),
        ],
        conclusao: 'Muito bem! Você já sabe escrever documentos formais.',
      },
      {
        id: 'n2-editor-imprimir', titulo: 'Imprimindo um documento', icone: '🖨️',
        descricao: 'Conferir a prévia e escolher o número de cópias.',
        passos: [
          info('Vamos imprimir o seu currículo. Antes de imprimir, sempre olhe a PRÉVIA, para não gastar papel com erro.', {
            emoji: '🖨️', preparar: () => abrirExemplo('Meu currículo', 'documento', '<div style="text-align: center;"><b><font size="6">Meu currículo</font></b></div><div>Escreva aqui os seus dados.</div>'),
          }),
          esperar('Clique no botão "🖨️ Imprimir" (ou aperte Ctrl+P). Na janela que abrir, veja a prévia, coloque 2 cópias e clique em "Imprimir".', 'editor:impresso', (d) => d.copias >= 2, {
            destacar: ['[data-campo="copias"]', ed('[data-comando="imprimir"]')], mouse: 'esquerdo',
          }),
          quiz('Antes de imprimir, é bom...', ['Olhar a prévia para ver se está tudo certo', 'Desligar a impressora', 'Apagar o documento'], 0),
        ],
        conclusao: 'Documento impresso (de treino)! Na impressora de verdade, é igualzinho.',
      },
      {
        id: 'n2-editor-desafio', titulo: 'Desafio: lista de contatos', icone: '🏅', desafio: true,
        descricao: 'Título formatado, tabela e sem erros de português.',
        passos: [
          info('Desafio! Faça sozinho um documento caprichado. Clique em "Continuar".'),
          esperar('Crie um documento com: o título "Lista de contatos" em NEGRITO e CENTRALIZADO, uma TABELA com nomes e telefones (pelo menos 3 linhas preenchidas) e salve com o nome: Lista de contatos', 'arquivo:salvo',
            (d) => d.tipo === 'documento' && /lista de contatos/i.test(d.nome) && /<table/i.test(d.conteudo) && temNegrito(d.conteudo) && /text-align:\s*center/i.test(d.conteudo) && celulasPreenchidas(d.conteudo) >= 6),
          quiz('Para conferir se o texto tem erros, uso o botão...', ['Ortografia', 'Imprimir', 'Tabela'], 0),
        ],
        conclusao: 'Desafio vencido! Seus documentos estão profissionais. 📝',
      },
    ],
  });
})();
