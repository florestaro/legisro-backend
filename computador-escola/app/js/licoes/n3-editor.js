// Nível 3 — Módulo 1: Editor de Texto avançado (trabalho escolar).
(function () {
  const { info, quiz, esperar, abrir, naJanela, editorNovo, editorSalvar, abrirExemplo } = CE.L;
  const ed = (s) => naJanela('editor', s);
  const pag = () => document.querySelector('.janela[data-app="editor"] .editor-pagina');
  const texto = () => (pag() ? pag().innerText : '');
  const temTitulo = (tag, re) => !!pag() && [...pag().querySelectorAll(tag)].some((h) => re.test(h.textContent));
  const paginas = () => (pag() ? pag().querySelectorAll('.quebra-pagina').length + 1 : 0);
  const estilo = (texto, valor, teste, extra = {}) => esperar(texto, 'editor:formatado', (d) => d.comando === 'estilo' && d.valor === valor && (!teste || teste()), {
    destacar: ed('[data-comando="estilo"]'), mouse: 'esquerdo', ...extra,
  });
  const p = (t) => `<div>${t}</div>`;

  const RONDONIA = p('Rondônia') + p('Rondônia é um estado da Região Norte do Brasil. A capital é Porto Velho, às margens do Rio Madeira.') +
    p('História') + p('O território recebeu o nome em homenagem ao Marechal Rondon, que levou o telégrafo para a região no começo do século XX.') +
    p('Economia') + p('A economia tem agricultura, pecuária, produção de energia nas usinas do Rio Madeira e comércio.') +
    p('Turismo') + p('Entre os passeios estão a Estrada de Ferro Madeira-Mamoré, as cachoeiras e a culinária regional.');
  const ABNT = '<!--ce:{"margem":"abnt","numerar":true}-->';
  const TRABALHO = ABNT + '<div style="text-align: center;"><b>ESCOLA ESTADUAL ESPERANÇA</b></div><div><br></div><div style="text-align: center;"><b>ALUNO DE TREINO</b></div><div><br></div><div><br></div><div style="text-align: center;"><b><font size="5">O COMPUTADOR NO DIA A DIA</font></b></div><div><br></div><div style="text-align: center;">PORTO VELHO</div><div style="text-align: center;">2026</div>' +
    '<div class="quebra-pagina" contenteditable="false"></div><h1>1 INTRODUÇÃO</h1><div style="text-align: justify; text-indent: 47px; line-height: 1.5;">Este trabalho mostra como o computador ajuda nas tarefas de casa, da escola e do trabalho.</div>' +
    '<div class="quebra-pagina" contenteditable="false"></div><h1>2 DESENVOLVIMENTO</h1><div style="text-align: justify; text-indent: 47px; line-height: 1.5;">Hoje usamos o computador para estudar, pagar contas, conversar com a família e procurar emprego.</div>' +
    '<div class="quebra-pagina" contenteditable="false"></div><h1>3 CONCLUSÃO</h1><div style="text-align: justify; text-indent: 47px; line-height: 1.5;">Aprender informática abre portas e dá mais independência.</div>' +
    '<div class="quebra-pagina" contenteditable="false"></div><h1>REFERÊNCIAS</h1><div>SABER LIVRE. <b>Computador</b>. Disponível em: saberlivre.org. Acesso em: 2026.</div>';
  const RECEITAS = '<h1>Receitas da Família</h1>' + p('Três receitas que passam de geração em geração.') +
    '<h2>Bolo de cenoura</h2>' + p('3 cenouras, 4 ovos, 1 xícara de óleo, 2 xícaras de açúcar e 2 de farinha. Bata, asse por 40 minutos.') +
    '<h2>Pão de queijo</h2>' + p('500 g de polvilho, 1 copo de leite, meio copo de óleo, 2 ovos e queijo ralado. Faça bolinhas e asse.') +
    '<h2>Suco de cupuaçu</h2>' + p('Bata a polpa de cupuaçu com água gelada e açúcar a gosto.');
  const INFORMATIVO = '<h1 style="text-align: center;">Informativo do Bairro</h1>' +
    p('<b>Mutirão de limpeza:</b> no sábado, às 8h, os moradores vão limpar a praça. Leve luvas e sacos de lixo. Haverá café da manhã para todos os voluntários.') +
    p('<b>Feira de artesanato:</b> todo domingo, na rua da escola, com bolos, crochê, plantas e muito mais. Venha prestigiar quem faz com as próprias mãos.') +
    p('<b>Curso de informática:</b> as inscrições estão abertas no centro comunitário. As aulas são de manhã e à noite, para jovens e adultos.');
  const CONVITE = '<h1 style="text-align: center;">Convite</h1>' + p('Convidamos todos os moradores para a reunião da associação, no sábado, às 19h.') +
    p('No sábado vamos falar sobre a festa junina e a reforma da quadra.') + p('Não falte! Até sábado.');

  CE.adicionarModulo({
    id: 'n3-editor', nivel: 'n3', titulo: 'Editor de Texto avançado', icone: '✍️',
    licoes: [
      {
        id: 'n3-ed-estilos', titulo: 'Estilos de título', icone: '🔠',
        descricao: 'Usar Título 1 e Título 2 para organizar o texto.',
        passos: [
          info('Num texto grande, os ESTILOS deixam todos os títulos iguais com um clique: "Título 1" para os títulos principais e "Título 2" para as partes menores. E tem mais: eles servem para o Editor montar o SUMÁRIO sozinho.', { emoji: '🔠' }),
          info('Abri um texto sobre Rondônia. Os títulos ainda estão iguais ao texto comum.', { preparar: () => abrirExemplo('Texto sobre Rondônia', 'documento', RONDONIA, true) }),
          estilo('Clique na primeira linha, "Rondônia", e escolha "Título 1" na caixa de estilos (onde está escrito "Normal").', 'h1', () => temTitulo('h1', /^Rondônia$/), {
            dica: 'Primeiro clique na palavra "Rondônia" no texto. Depois abra a caixa de estilos e escolha "Título 1".',
          }),
          estilo('Agora clique na linha "História" e escolha "Título 2".', 'h2', () => temTitulo('h2', /^História$/)),
          esperar('Faça o mesmo com "Economia" e "Turismo": os dois em "Título 2".', 'editor:formatado', () => temTitulo('h2', /^Economia$/) && temTitulo('h2', /^Turismo$/), { destacar: ed('[data-comando="estilo"]') }),
          info('Veja como o texto ficou organizado! Quando o cursor está num título, a caixa de estilos mostra qual estilo ele tem.'),
          quiz('Para que servem os estilos de título?', ['Deixar os títulos iguais e montar o sumário sozinho', 'Corrigir os erros de português', 'Imprimir mais rápido'], 0),
          quiz('Um título de uma parte menor, dentro de outra, usa...', ['Título 2', 'Título 1', 'Citação'], 0),
          editorSalvar('Texto sobre Rondônia'),
        ],
        conclusao: 'Ótimo! Agora os seus textos têm títulos organizados como os de um livro.',
      },
      {
        id: 'n3-ed-abnt', titulo: 'Trabalho escolar no padrão ABNT', icone: '🎓',
        descricao: 'Capa, margens e parágrafos do jeito que a escola pede.',
        passos: [
          info('Trabalho de escola e de faculdade costuma seguir a ABNT: margens de 3 cm em cima e à esquerda e 2 cm embaixo e à direita, letra tamanho 12, espaço de 1,5 entre as linhas e recuo no começo de cada parágrafo. O Editor tem um modelo pronto!', { emoji: '🎓' }),
          abrir('editor', 'Editor de Texto'),
          editorNovo('trabalho', 'Trabalho escolar (ABNT)'),
          info('O modelo já vem com CAPA, SUMÁRIO, INTRODUÇÃO, DESENVOLVIMENTO, CONCLUSÃO e REFERÊNCIAS, cada parte numa página. Os textos entre [colchetes] são para você trocar.'),
          esperar('Clique em [NOME DA ESCOLA] e escreva o nome da sua escola.', 'editor:texto', () => !/\[NOME DA ESCOLA\]/.test(texto()), { destacar: ed('.campo-modelo'), mouse: 'esquerdo', dica: 'Um clique no campo seleciona tudo. É só escrever por cima.' }),
          esperar('Agora troque [SEU NOME COMPLETO] pelo seu nome.', 'editor:texto', () => !/\[SEU NOME COMPLETO\]/.test(texto())),
          esperar('Troque [TÍTULO DO TRABALHO] por:  O computador no dia a dia', 'editor:texto', () => /computador no dia a dia/i.test(texto())),
          esperar('Desça até a INTRODUÇÃO e troque o texto entre colchetes por uma frase sua sobre o assunto.', 'editor:texto', () => !/\[Apresente o assunto/.test(texto()), { dica: 'Use a rodinha do mouse para descer.' }),
          info('Repare: a caixa de margens mostra "Margem ABNT" e o parágrafo da introdução tem recuo e fica justificado. É o estilo "Parágrafo ABNT".', { destacar: ed('[data-comando="margem"]') }),
          quiz('No padrão ABNT, as margens de cima e da esquerda têm...', ['3 cm', '1 cm', '10 cm'], 0),
          quiz('O espaço entre as linhas no corpo do trabalho é de...', ['1,5', '3', '0,5'], 0),
          editorSalvar('Trabalho de informática'),
        ],
        conclusao: 'Parabéns! Seu trabalho já tem cara de trabalho profissional.',
      },
      {
        id: 'n3-ed-sumario', titulo: 'Sumário automático', icone: '📑',
        descricao: 'O Editor monta o sumário com os títulos e as páginas.',
        passos: [
          info('O SUMÁRIO é a lista dos títulos com o número da página de cada um. Fazer à mão dá trabalho e sai errado. Com os estilos de título, o Editor faz sozinho!', {
            emoji: '📑', preparar: () => abrirExemplo('Trabalho de informática', 'documento', TRABALHO),
          }),
          esperar('Clique no botão "📑 Sumário" lá em cima.', 'editor:sumario', null, { destacar: ed('[data-comando="sumario"]'), mouse: 'esquerdo' }),
          info('Pronto! O sumário pegou cada Título 1 e Título 2 e a página onde ele está. Use a rodinha para ver.', { destacar: ed('.sumario') }),
          esperar('Agora vamos acrescentar um título: clique no fim do texto do DESENVOLVIMENTO, aperte Enter, escolha "Título 2" e escreva:  2.1 O computador na escola', 'editor:texto', () => temTitulo('h2', /computador na escola/i), {
            destacar: ed('[data-comando="estilo"]'), dica: 'A ordem é: Enter, escolher "Título 2" na caixa de estilos e depois escrever.',
          }),
          esperar('O sumário não muda sozinho. Clique em "📑 Sumário" de novo para ATUALIZAR.', 'editor:sumario', (d) => d.acao === 'atualizar' && !!pag() && /computador na escola/i.test((pag().querySelector('.sumario') || {}).textContent || ''), { destacar: ed('[data-comando="sumario"]'), mouse: 'esquerdo' }),
          quiz('Depois de mudar os títulos, para o sumário ficar certo eu...', ['Clico em Sumário de novo para atualizar', 'Apago o trabalho', 'Escrevo o sumário à mão'], 0),
          editorSalvar('Trabalho de informática'),
        ],
        conclusao: 'Excelente! Sumário automático é coisa de quem sabe usar o computador de verdade.',
      },
      {
        id: 'n3-ed-paginas', titulo: 'Quebra de página, cabeçalho e número', icone: '🔢',
        descricao: 'Começar cada parte numa página nova e numerar as páginas.',
        passos: [
          info('Para começar uma parte numa página NOVA, não aperte Enter várias vezes: use a QUEBRA DE PÁGINA. Se o texto mudar, as páginas continuam certinhas.', {
            emoji: '📄', preparar: () => abrirExemplo('Receitas da família', 'documento', RECEITAS, true),
          }),
          esperar('Clique no título "Pão de queijo" e depois no botão "📄 Quebra". A receita vai começar numa página nova.', 'editor:formatado', (d) => d.comando === 'quebraPagina' && /p[aã]o de queijo/i.test(d.antesDe || ''), {
            destacar: ed('[data-comando="quebraPagina"]'), mouse: 'esquerdo', dica: 'Primeiro um clique na linha "Pão de queijo", depois o botão Quebra.',
          }),
          esperar('Agora faça o mesmo com "Suco de cupuaçu".', 'editor:formatado', (d) => d.comando === 'quebraPagina' && /cupua/i.test(d.antesDe || ''), { destacar: ed('[data-comando="quebraPagina"]') }),
          esperar('Clique em "🔢 Cabeçalho". No cabeçalho escreva:  Receitas da Família , marque "Numerar as páginas" e clique em OK.', 'editor:cabecalho', (d) => /receitas/i.test(d.cabecalho) && d.numerar, {
            destacar: [`.dialogo [data-campo="cabecalho"]`, ed('[data-comando="cabecalhoRodape"]')], mouse: 'esquerdo',
          }),
          info('Veja: o cabeçalho aparece no alto da folha e o número da página no rodapé. Na impressão e no PDF, ele aparece em TODAS as páginas.', { destacar: ed('.ed-rodape') }),
          quiz('Para uma parte começar na página seguinte, o certo é...', ['Usar a Quebra de página', 'Apertar Enter até mudar de página', 'Diminuir a letra'], 0),
          quiz('O que vai no rodapé, em todas as páginas?', ['O número da página', 'O título de cada receita', 'Nada'], 0),
          editorSalvar('Receitas da família'),
        ],
        conclusao: 'Muito bem! Documento longo agora fica organizado e numerado.',
      },
      {
        id: 'n3-ed-colunas', titulo: 'Colunas: o jornalzinho', icone: '📰',
        descricao: 'Dividir o texto em colunas, como num jornal.',
        passos: [
          info('Jornal, folheto e informativo usam COLUNAS: o texto fica em faixas estreitas, mais fáceis de ler. Abri o "Informativo do Bairro".', {
            emoji: '📰', preparar: () => abrirExemplo('Informativo do bairro', 'documento', INFORMATIVO, true),
          }),
          esperar('Selecione as três notícias: arraste o mouse do começo de "Mutirão" até o fim de "...jovens e adultos."', 'editor:selecao', (d) => /mutir/i.test(d.selecionado) && /adultos/i.test(d.selecionado), { destacar: ed('.editor-pagina'), mouse: 'arrastar' }),
          esperar('Na caixa de colunas (▥), escolha "2 col.".', 'editor:formatado', (d) => d.comando === 'colunas' && d.valor === 2, { destacar: ed('[data-comando="colunas"]'), mouse: 'esquerdo' }),
          esperar('Ficou com cara de jornal! Agora experimente "3 col.".', 'editor:formatado', (d) => d.comando === 'colunas' && d.valor === 3, { destacar: ed('[data-comando="colunas"]') }),
          quiz('As colunas servem para...', ['Deixar o texto em faixas, como num jornal', 'Fazer contas', 'Mudar a cor da letra'], 0),
          editorSalvar('Informativo do bairro'),
        ],
        conclusao: 'Seu informativo ficou profissional!',
      },
      {
        id: 'n3-ed-substituir', titulo: 'Localizar e substituir', icone: '🔎',
        descricao: 'Achar uma palavra e trocar todas de uma vez.',
        passos: [
          info('Num texto grande, achar uma palavra com os olhos é difícil. O LOCALIZAR acha para você, e o SUBSTITUIR troca todas de uma vez. Abri um convite com um erro: a reunião é no DOMINGO, não no sábado!', {
            emoji: '🔎', preparar: () => abrirExemplo('Convite da reunião', 'documento', CONVITE, true),
          }),
          esperar('Aperte Ctrl+H (ou clique em "🔎 Localizar"). Escreva  sábado  em "Localizar" e clique no botão Localizar.', 'editor:localizado', (d) => /s[aá]bado/i.test(d.termo) && d.quantidade === 3, {
            destacar: ['.dialogo [data-campo="procurar"]', ed('[data-comando="substituir"]')], mouse: 'esquerdo', dica: 'Escreva com acento: sábado.',
          }),
          info('Achou 3 vezes, marcadas em amarelo no texto.'),
          esperar('Agora em "Substituir por" escreva  domingo  e clique em "Substituir tudo".', 'editor:substituido', (d) => /domingo/i.test(d.trocar) && d.quantidade === 3, { destacar: '.dialogo [data-campo="trocar"]', mouse: 'esquerdo' }),
          esperar('Feche a janelinha de Localizar no botão "Fechar".', 'editor:localizar-fechado', null, { jaFeito: () => !document.querySelector('.dialogo [data-campo="procurar"]'), destacar: '.dialogo .botao.secundario', mouse: 'esquerdo' }),
          quiz('Qual atalho abre o Localizar e substituir?', ['Ctrl+H', 'Ctrl+P', 'Ctrl+N'], 0),
          editorSalvar('Convite da reunião'),
        ],
        conclusao: 'Pronto: três trocas com um clique, sem esquecer nenhuma!',
      },
      {
        id: 'n3-ed-pdf', titulo: 'Salvar em PDF', icone: '📕',
        descricao: 'Fazer um PDF para enviar e imprimir sem estragar.',
        passos: [
          info('O PDF é um arquivo que fica IGUALZINHO em qualquer computador ou celular e ninguém muda sem querer. É o melhor jeito de mandar currículo, trabalho e documentos.', {
            emoji: '📕', preparar: () => abrirExemplo('Trabalho de informática', 'documento', TRABALHO),
          }),
          esperar('Clique no botão "📕 PDF". Deixe o nome "Trabalho de informática" e clique em OK.', 'editor:pdf', null, { destacar: ed('[data-comando="pdf"]'), mouse: 'esquerdo' }),
          abrir('arquivos', 'Arquivos'),
          esperar('Ache o arquivo com o ícone 📕 (Documento PDF) e dê um clique duplo para abrir.', 'arquivo:aberto', (d) => d.tipo === 'pdf', { destacar: naJanela('arquivos', '.arq-item[data-tipo="pdf"]'), mouse: 'duplo' }),
          esperar('O PDF mostra as páginas como vão sair na impressão, com o número embaixo. Clique em ➕ para aumentar o tamanho.', 'pdf:zoom', (d) => d.zoom > 0.8, { destacar: naJanela('leitor-pdf', '[data-comando="mais"]'), mouse: 'esquerdo' }),
          quiz('Por que mandar o currículo em PDF?', ['Ele fica igual em qualquer computador e não desmancha', 'Porque o PDF é mais colorido', 'Porque o PDF faz contas'], 0),
          quiz('Para mudar o texto de um trabalho que virou PDF, eu...', ['Mudo o documento original no Editor e faço o PDF de novo', 'Escrevo direto no PDF', 'Não dá nunca'], 0),
        ],
        conclusao: 'Muito bem! Agora você sabe fazer PDF como os profissionais.',
      },
      {
        id: 'n3-ed-desafio', titulo: 'Desafio do Editor avançado', icone: '🏅', desafio: true,
        descricao: 'Um trabalho escolar completo, sem ajuda.',
        passos: [
          info('Desafio! Faça um trabalho escolar completo sozinho. Clique em "Continuar".'),
          esperar('Abra o Editor e comece um "Trabalho escolar (ABNT)".', 'editor:novo', (d) => d.modelo === 'trabalho'),
          esperar('Coloque o título do trabalho:  A internet', 'editor:texto', () => /a internet/i.test(texto()) && !/\[TÍTULO DO TRABALHO\]/.test(texto())),
          esperar('Coloque o nome da escola no cabeçalho e numere as páginas.', 'editor:cabecalho', (d) => d.cabecalho && d.numerar),
          esperar('Monte o sumário.', 'editor:sumario'),
          esperar('Salve o documento com o nome:  A internet', 'arquivo:salvo', (d) => d.tipo === 'documento' && /internet/i.test(d.nome)),
          esperar('Faça um PDF do trabalho.', 'editor:pdf'),
        ],
        conclusao: 'Desafio vencido! Você faz trabalhos escolares completos e organizados. ✍️',
      },
    ],
  });
})();
