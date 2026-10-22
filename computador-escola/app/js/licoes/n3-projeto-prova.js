// Nível 3 — Módulo 7: Projeto final (organizar um evento). Módulo 8: Prova do nível Avançado.
(function () {
  const { info, quiz, esperar, abrir, naJanela, abrirExemplo, planilhaDe, celula, perto, editorNovo, editorSalvar } = CE.L;
  const pl = (s) => naJanela('planilha', s);
  const td = (ref) => pl(`td[data-celula="${ref}"]`);
  const ap = (s) => naJanela('apresentacoes', s);
  const pag = () => document.querySelector('.janela[data-app="editor"] .editor-pagina');
  const slides = () => (CE.apresentacaoAtiva ? CE.apresentacaoAtiva.slides() : []);
  const editou = (texto, teste, extra = {}) => esperar(texto, ['planilha:editada', 'planilha:preenchida', 'planilha:autosoma'], () => teste(), { jaFeito: () => !!CE.planilhaAtiva && teste(), ...extra });
  const CUSTOS = [['Item', 'Quantidade', 'Preço', 'Total'], ['Bolo', '2', '80'], ['Salgados (cento)', '3', '45'], ['Refrigerante', '10', '8,50'], ['Decoração', '1', '120']];

  CE.adicionarModulo({
    id: 'n3-projeto', nivel: 'n3', titulo: 'Projeto final: organizar um evento', icone: '🎉',
    licoes: [
      {
        id: 'n3-pj-planilha', titulo: 'Projeto 1: planilha de custos', icone: '📊',
        descricao: 'Quanto vai custar a festa da turma.',
        passos: [
          info('PROJETO FINAL! Você vai organizar a festa de encerramento da turma usando tudo o que aprendeu: planilha de custos, convite, apresentação e e-mail. Começando pela planilha.', {
            emoji: '🎉', preparar: () => abrirExemplo('Custos do evento', 'planilha', planilhaDe(CUSTOS), true),
          }),
          editou('Calcule o TOTAL de cada item na coluna D (quantidade vezes preço), de D2 até D5.', () => perto(celula('D2'), 160) && perto(celula('D3'), 135) && perto(celula('D4'), 85) && perto(celula('D5'), 120), {
            destacar: td('D2'), dica: 'Em D2: =B2*C2. Depois arraste a alça até a D5.',
          }),
          editou('Em C6 escreva  Total geral  e em D6 some todos os totais.', () => perto(celula('D6'), 500), { destacar: td('D6'), dica: 'Use =SOMA(D2:D5) ou o botão Σ AutoSoma.' }),
          esperar('Selecione de C2 até D6 e clique em "R$".', 'planilha:formatada', (d) => d.comando === 'formato' && d.valor === 'moeda', { destacar: pl('[data-comando="moeda"]'), mouse: 'esquerdo' }),
          esperar('Agora o gráfico: selecione de A1 até D5, clique em "📊 Gráfico", escolha "Pizza", DESMARQUE "Quantidade" e "Preço" (deixe só "Total") e clique em "Inserir gráfico".', 'planilha:grafico', (d) => d.tipo === 'pizza' && d.series === 1 && /total/i.test((d.nomesSeries || [])[0] || ''), {
            destacar: pl('[data-comando="grafico"]'), mouse: 'esquerdo', dica: 'Na janela do gráfico, embaixo dos tipos, tem "Mostrar no gráfico" com uma caixinha para cada coluna.',
          }),
          esperar('Salve a planilha (o nome é "Custos do evento").', 'arquivo:salvo', (d) => d.tipo === 'planilha' && /custos do evento/i.test(d.nome), { destacar: pl('[data-comando="salvar"]'), mouse: 'esquerdo' }),
        ],
        conclusao: 'A festa vai custar R$ 500,00, e o gráfico mostra onde vai o dinheiro!',
      },
      {
        id: 'n3-pj-convite', titulo: 'Projeto 2: o convite', icone: '💌',
        descricao: 'Convite bonito no Editor, com imagem, salvo em PDF.',
        passos: [
          info('Agora o CONVITE no Editor de Texto. Ele precisa dizer: O QUÊ, QUANDO (dia e hora), ONDE e ter uma imagem alegre.', { emoji: '💌' }),
          abrir('editor', 'Editor de Texto'),
          editorNovo('branco', 'Documento em branco'),
          esperar('Escreva o título do convite (ex.: Festa de Encerramento da Turma), deixe em "Título 1" e centralizado.', 'editor:formatado', () => !!pag() && [...pag().querySelectorAll('h1')].some((h) => h.textContent.trim().length > 3 && (h.style.textAlign === 'center' || h.getAttribute('align') === 'center' || (h.closest('[style*="center"]')))), {
            destacar: naJanela('editor', '[data-comando="estilo"]'), dica: 'Escreva o título, escolha "Título 1" na caixa de estilos e clique no botão de centralizar (≡).',
          }),
          esperar('Escreva o dia, a hora e o local da festa (ex.: Sexta-feira, 12 de dezembro, às 19h, no salão da escola).', 'editor:texto', (d) => /\d/.test(d.texto) && /(h|hora)/i.test(d.texto) && d.texto.split(/\s+/).length >= 12),
          esperar('Coloque uma imagem: clique em "🖼️ Imagem" e escolha uma figura.', 'editor:formatado', (d) => d.comando === 'inserirImagem', { destacar: naJanela('editor', '[data-comando="inserirImagem"]'), mouse: 'esquerdo' }),
          editorSalvar('Convite'),
          esperar('Agora faça o PDF do convite (botão "📕 PDF", nome "Convite").', 'editor:pdf', (d) => /convite/i.test(d.nome), { destacar: naJanela('editor', '[data-comando="pdf"]'), mouse: 'esquerdo' }),
        ],
        conclusao: 'Convite pronto para mandar!',
      },
      {
        id: 'n3-pj-apresentacao', titulo: 'Projeto 3: a apresentação', icone: '📽️',
        descricao: 'Apresentar o plano da festa para a turma.',
        passos: [
          info('Hora de apresentar o plano da festa! Faça pelo menos 4 slides: 1) título, 2) o que vai ter, 3) quanto custa (com o gráfico da planilha) e 4) como ajudar.', { emoji: '📽️' }),
          abrir('apresentacoes', 'Apresentações'),
          esperar('Comece uma apresentação nova (📄 Nova) e escreva o título do primeiro slide.', 'apresentacao:texto', (d) => d.slide === 1 && d.campo === 'titulo' && d.texto.length >= 3, { destacar: ap('[data-comando="nova"]'), mouse: 'esquerdo' }),
          esperar('Crie o slide 2 com tópicos sobre o que vai ter na festa.', ['apresentacao:texto', 'apresentacao:slide-novo'], () => slides().length >= 2 && slides().some((s) => (s.texto || '').includes('<li>') && s.tituloTexto), { destacar: ap('[data-comando="novo-slide"]') }),
          esperar('Crie um slide com o gráfico da planilha "Custos do evento" (botão "📊 Gráfico").', 'apresentacao:grafico', (d) => /custos do evento/i.test(d.planilha), { destacar: ap('[data-comando="grafico"]'), mouse: 'esquerdo' }),
          esperar('Crie o último slide: "Como ajudar" (com tópicos). A apresentação precisa ter 4 slides ou mais, todos com título.', ['apresentacao:texto', 'apresentacao:slide-novo'], () => slides().length >= 4 && slides().every((s) => s.tituloTexto), { destacar: ap('[data-comando="novo-slide"]') }),
          esperar('Escolha um tema bonito.', 'apresentacao:tema', null, { destacar: ap('[data-comando="tema"]'), mouse: 'esquerdo' }),
          esperar('Salve com o nome:  Festa da turma', 'arquivo:salvo', (d) => d.tipo === 'apresentacao' && /festa/i.test(d.nome), { destacar: ap('[data-comando="salvar"]'), mouse: 'esquerdo' }),
          esperar('Apresente do começo ao fim (▶ Apresentar).', 'apresentacao:fim', (d) => d.completa, { destacar: ap('[data-comando="apresentar"]'), mouse: 'esquerdo' }),
        ],
        conclusao: 'Apresentação incrível!',
      },
      {
        id: 'n3-pj-email', titulo: 'Projeto 4: enviar tudo por e-mail', icone: '📤',
        descricao: 'Mandar a planilha, o convite e a apresentação para o professor.',
        passos: [
          info('Último passo: mandar o projeto para o professor. Um e-mail com os TRÊS arquivos anexados: a planilha "Custos do evento", o PDF "Convite" e a apresentação "Festa da turma".', { emoji: '📤' }),
          abrir('email', 'E-mail'),
          esperar('Escreva para professor@correio.escola, com o assunto "Projeto final", um texto educado e os 3 anexos (clique em "📎 Anexar" uma vez para cada arquivo). Depois clique em Enviar.', 'email:enviado',
            (d) => d.para === 'professor@correio.escola' && /projeto/i.test(d.assunto) && ['planilha', 'pdf', 'apresentacao'].every((t) => (d.tiposAnexos || []).includes(t)), {
              destacar: naJanela('email', '[data-acao="escrever"]'), mouse: 'esquerdo', dica: 'Se o e-mail ficar pesado, também dá para compactar os arquivos num ZIP (mas aqui mande os 3 anexos).',
            }),
          quiz('No projeto, qual programa você usou para calcular os custos?', ['Planilha', 'Desenho', 'Calculadora'], 0),
          quiz('E para mostrar o plano para a turma?', ['Apresentações', 'Bloco de Notas', 'Lixeira'], 0),
        ],
        conclusao: 'PROJETO FINAL CONCLUÍDO! 🎉 Você usou planilha, editor, apresentação e e-mail juntos, como no trabalho de verdade.',
      },
    ],
  });

  CE.adicionarModulo({
    id: 'n3-prova', nivel: 'n3', titulo: 'Prova do nível Avançado', icone: '🏆',
    licoes: [
      {
        id: 'prova-n3', titulo: 'Prova do nível Avançado', icone: '🏆', prova: true, desafio: true,
        descricao: 'Tarefas práticas e perguntas sobre todo o nível. Precisa de 70% para passar.',
        passos: [
          info('Chegou a PROVA FINAL do nível Avançado! Faça as tarefas sozinho e responda às perguntas. Precisa de 70% para passar. Boa sorte! Clique em "Continuar".', { emoji: '🏆' }),
          esperar('Tarefa 1: na Planilha, faça um gráfico com uma tabela de nomes e números (por exemplo, gastos do mês).', 'planilha:grafico'),
          esperar('Tarefa 2: no Editor, escreva um texto com pelo menos dois títulos em "Título 1" e monte o sumário.', 'editor:sumario', () => !!pag() && pag().querySelectorAll('h1').length >= 2),
          esperar('Tarefa 3: faça uma apresentação com pelo menos 2 slides e salve com o nome "Prova".', 'arquivo:salvo', (d) => d.tipo === 'apresentacao' && /prova/i.test(d.nome) && slides().length >= 2),
          esperar('Tarefa 4: nas Configurações, faça uma verificação de vírus.', 'config:verificacao'),
          quiz('No padrão ABNT, as margens de cima e da esquerda são de...', ['3 cm', '1 cm', '5 cm'], 0),
          quiz('Para o sumário pegar um título, ele precisa estar com o estilo...', ['Título 1 ou Título 2', 'Negrito', 'Itálico'], 0),
          quiz('Na planilha, qual função soma só os gastos de uma categoria?', ['SOMASE', 'MÉDIA', 'PROCV'], 0),
          quiz('O PROCV serve para...', ['Procurar um valor numa tabela e trazer a informação da linha', 'Somar uma coluna', 'Fazer gráficos'], 0),
          quiz('O filtro da planilha...', ['Esconde linhas sem apagar', 'Apaga as linhas'], 0),
          quiz('Para mudar de slide durante a apresentação, eu...', ['Clico ou aperto a seta →', 'Fecho o programa'], 0),
          quiz('Antes de instalar um programa, eu confiro...', ['Se a editora é confiável', 'Se o ícone é bonito'], 0),
          quiz('Alguém pede o código que chegou por SMS no meu celular. Eu...', ['Não passo', 'Passo'], 0),
          quiz('Uma vaga de emprego cobra taxa para eu me candidatar. É...', ['Golpe', 'Normal'], 0),
          quiz('Backup é...', ['Uma cópia dos arquivos em outro lugar', 'Um vírus'], 0),
          quiz('Para mandar o currículo, o melhor formato é...', ['PDF', 'Foto do celular'], 0),
          quiz('Para mandar muitos arquivos num e-mail só, eu posso...', ['Compactar num ZIP', 'Mandar um por um em 30 e-mails'], 0),
        ],
        conclusao: 'PARABÉNS! Você passou na prova e concluiu o nível Avançado! 🏆 Você agora usa o computador com autonomia, no estudo, no trabalho e na vida.',
      },
    ],
  });
})();
