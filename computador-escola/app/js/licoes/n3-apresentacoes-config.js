// Nível 3 — Módulo 3: Apresentações. Módulo 4: Configurações do computador.
(function () {
  const { info, quiz, esperar, abrir, naJanela, abrirExemplo, pularSe } = CE.L;
  const ap = (s) => naJanela('apresentacoes', s);
  const cfg = (s) => naJanela('configuracoes', s);
  const slides = () => (CE.apresentacaoAtiva ? CE.apresentacaoAtiva.slides() : []);
  const slideAtual = () => slides()[(CE.apresentacaoAtiva ? CE.apresentacaoAtiva.atual() : 1) - 1] || {};
  const novoSlide = (layout, nome) => esperar(`Clique em "➕ Novo slide ▾" e escolha "${nome}".`, 'apresentacao:slide-novo', (d) => d.layout === layout, {
    destacar: [ap(`[data-layout="${layout}"]`), ap('[data-comando="novo-slide"]')], mouse: 'esquerdo',
  });
  const escreverSlide = (texto, campo, teste) => esperar(texto, 'apresentacao:texto', (d) => d.campo === campo && teste(d), { destacar: ap(`.ap-moldura [data-campo="${campo}"]`), mouse: 'esquerdo' });
  const salvarAp = (nome) => esperar(`Salve: clique em "💾 Salvar"${nome ? ` e use o nome "${nome}"` : ''}.`, 'arquivo:salvo', (d) => d.tipo === 'apresentacao' && (!nome || d.nome.toLowerCase() === nome.toLowerCase()), { destacar: ap('[data-comando="salvar"]'), mouse: 'esquerdo' });
  const MINHA_CIDADE = JSON.stringify({ tema: 'claro', transicao: 'nenhuma', slides: [{ id: 's1', layout: 'titulo', titulo: 'Minha cidade', texto: 'Apresentação de treino', texto2: '', imagem: null, grafico: null, notas: '' }] });
  const abrirMinhaCidade = () => abrirExemplo('Minha cidade', 'apresentacao', MINHA_CIDADE);
  // O gráfico do slide vem de uma planilha salva que já tenha gráfico.
  async function garantirPlanilhaComGrafico() {
    const lista = await CE.sessao.arquivos();
    const tem = lista.some((a) => a.tipo === 'planilha' && !a.naLixeira && /"graficos":\[\{/.test(a.conteudo || ''));
    if (tem) return;
    const celulas = { A1: { v: 'Categoria', f: { negrito: true } }, B1: { v: 'Valor', f: { negrito: true } }, A2: { v: 'Mercado', f: {} }, B2: { v: '650', f: {} }, A3: { v: 'Contas', f: {} }, B3: { v: '420', f: {} }, A4: { v: 'Transporte', f: {} }, B4: { v: '180', f: {} }, A5: { v: 'Lazer', f: {} }, B5: { v: '150', f: {} } };
    await CE.sessao.salvarArquivo({ nome: 'Gastos por categoria', tipo: 'planilha', conteudo: JSON.stringify({ celulas, larguras: {}, graficos: [{ id: 'g1', tipo: 'pizza', intervalo: 'A1:B5', titulo: 'Gastos por categoria', x: 300, y: 30 }], condicionais: [] }) });
  }
  const irSecao = (secao, nome, extra = {}) => esperar(`No menu da esquerda das Configurações, clique em "${nome}".`, 'config:secao', (d) => d.secao === secao, {
    destacar: cfg(`[data-secao="${secao}"]`), mouse: 'esquerdo',
    jaFeito: () => !!document.querySelector(`.janela[data-app="configuracoes"] [data-secao="${secao}"].ativo`), ...extra,
  });
  const abrirConfig = (secao) => abrir('configuracoes', 'Configurações', { preparar: () => { if (CE.janelas.estaAberta('configuracoes')) CE.janelas.abrir('configuracoes', { secao }); } });
  const imagemDe = (emoji) => {
    const c = document.createElement('canvas'); c.width = c.height = 160;
    const x = c.getContext('2d'); x.font = '120px "Segoe UI Emoji", "Noto Color Emoji", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(emoji, 80, 90);
    return c.toDataURL('image/png');
  };

  CE.adicionarModulo({
    id: 'n3-apresentacoes', nivel: 'n3', titulo: 'Apresentações', icone: '📽️',
    licoes: [
      {
        id: 'n3-ap-conhecer', titulo: 'Conhecendo as Apresentações', icone: '📽️',
        descricao: 'Slides, o slide de título e a lista de slides.',
        passos: [
          info('O programa APRESENTAÇÕES (parecido com o PowerPoint) faz SLIDES: telas com pouco texto e figuras, para mostrar numa reunião, na escola ou num trabalho. À esquerda fica a lista dos slides; no meio, o slide que você está montando.', { emoji: '📽️' }),
          abrir('apresentacoes', 'Apresentações'),
          escreverSlide('Clique onde está escrito "Clique para escrever o título" e escreva:  Minha cidade', 'titulo', (d) => /minha cidade/i.test(d.texto)),
          escreverSlide('Agora clique no subtítulo e escreva o seu nome.', 'texto', (d) => d.slide === 1 && d.texto.length >= 2),
          info('Veja a miniatura do slide na lista da esquerda: ela muda junto.', { destacar: ap('.ap-miniatura') }),
          quiz('Um slide bom tem...', ['Pouco texto, letras grandes e figuras', 'Muito texto, letra pequena', 'Só números'], 0),
          salvarAp('Minha cidade'),
        ],
        conclusao: 'Seu primeiro slide está pronto!',
      },
      {
        id: 'n3-ap-slides', titulo: 'Novos slides com tópicos', icone: '📝',
        descricao: 'Acrescentar slides e escrever em tópicos.',
        passos: [
          info('Cada assunto vai num slide. Os TÓPICOS são frases curtas, uma em cada linha, com uma bolinha na frente.', { emoji: '📝', preparar: abrirMinhaCidade }),
          novoSlide('conteudo', 'Título e tópicos'),
          escreverSlide('Escreva o título:  O que tem de bom', 'titulo', (d) => /tem de bom/i.test(d.texto)),
          esperar('Clique na caixa de tópicos e escreva três coisas boas da sua cidade, apertando Enter depois de cada uma.', 'apresentacao:texto', (d) => d.campo === 'texto' && ((slideAtual().texto || '').match(/<li>(?!<br>)/g) || []).length >= 3, {
            destacar: ap('.ap-moldura [data-campo="texto"]'), mouse: 'esquerdo', dica: 'Exemplo: Comida boa (Enter) Rio Madeira (Enter) Gente acolhedora',
          }),
          esperar('Clique em "📑 Duplicar" para fazer uma cópia deste slide.', 'apresentacao:slide-duplicado', null, { destacar: ap('[data-comando="duplicar"]'), mouse: 'esquerdo' }),
          esperar('Não precisava da cópia: clique na lixeira 🗑️ e confirme para excluir este slide.', 'apresentacao:slide-excluido', null, { destacar: ap('[data-comando="excluir-slide"]'), mouse: 'esquerdo' }),
          quiz('Cada tópico deve ser...', ['Uma frase curta', 'Um parágrafo bem grande', 'Uma página inteira'], 0),
          salvarAp(),
        ],
        conclusao: 'Muito bem! Sua apresentação já tem conteúdo.',
      },
      {
        id: 'n3-ap-imagem', titulo: 'Imagens e gráficos nos slides', icone: '🖼️',
        descricao: 'Pôr figura e gráfico da planilha num slide.',
        passos: [
          info('Uma imagem vale mais que mil palavras! E um gráfico deixa os números fáceis de entender.', { emoji: '🖼️', preparar: async () => { await garantirPlanilhaComGrafico(); await abrirMinhaCidade(); } }),
          novoSlide('imagem', 'Título, texto e imagem'),
          escreverSlide('Escreva o título:  Um lugar especial', 'titulo', (d) => /lugar especial/i.test(d.texto)),
          esperar('Clique no quadro "🖼️ Clique para pôr uma imagem" e escolha uma figura.', 'apresentacao:imagem', null, { destacar: ap('.ap-moldura [data-acao="escolher-imagem"]'), mouse: 'esquerdo' }),
          novoSlide('conteudo', 'Título e tópicos'),
          esperar('Clique em "📊 Gráfico" e escolha o gráfico da planilha.', 'apresentacao:grafico', null, { destacar: ap('[data-comando="grafico"]'), mouse: 'esquerdo' }),
          info('O gráfico veio da planilha com os números de agora. Se a planilha mudar depois, é só pôr o gráfico de novo.'),
          quiz('Para pôr um gráfico no slide, ele precisa estar...', ['Numa planilha salva', 'No e-mail', 'Na Lixeira'], 0),
          salvarAp(),
        ],
        conclusao: 'Seus slides ficaram bem mais interessantes!',
      },
      {
        id: 'n3-ap-tema', titulo: 'Temas, transições e ordem dos slides', icone: '🎨',
        descricao: 'Deixar bonito e organizar os slides.',
        passos: [
          info('O TEMA muda as cores de TODOS os slides de uma vez. A TRANSIÇÃO é o efeito na hora de passar de um slide para o outro.', { emoji: '🎨', preparar: abrirMinhaCidade }),
          esperar('Na caixa de temas (🎨), escolha "Azul".', 'apresentacao:tema', (d) => d.tema === 'azul', { destacar: ap('[data-comando="tema"]'), mouse: 'esquerdo' }),
          esperar('Experimente outro tema que você goste.', 'apresentacao:tema', (d) => d.tema !== 'azul', { destacar: ap('[data-comando="tema"]') }),
          esperar('Na caixa de transição (✨), escolha "Deslizar".', 'apresentacao:transicao', (d) => d.transicao === 'deslizar', { destacar: ap('[data-comando="transicao"]'), mouse: 'esquerdo' }),
          esperar('Agora mude a ORDEM: na lista da esquerda, arraste o último slide para cima, até a posição 2.', 'apresentacao:slide-movido', (d) => d.para === 2, {
            destacar: ap('.ap-miniatura:last-child'), mouse: 'arrastar', dica: 'Também dá para usar as setas ⬆️ e ⬇️ da barra de ferramentas.',
            jaFeito: () => slides().length < 3,
          }),
          quiz('O tema muda...', ['As cores de todos os slides', 'Só o primeiro slide', 'O nome do arquivo'], 0),
          salvarAp(),
        ],
        conclusao: 'Ficou com cara de apresentação profissional!',
      },
      {
        id: 'n3-ap-apresentar', titulo: 'Apresentando', icone: '🎤',
        descricao: 'Anotações, tela cheia e dicas para falar em público.',
        passos: [
          info('Hora de apresentar! Embaixo do slide tem as ANOTAÇÕES: um lembrete do que você vai falar. Só você vê.', { emoji: '🎤', preparar: abrirMinhaCidade }),
          esperar('Clique na caixa de anotações e escreva um lembrete, por exemplo:  Falar do Rio Madeira. Depois clique no slide.', 'apresentacao:notas', (d) => d.texto.trim().length >= 3, { destacar: ap('.ap-notas'), mouse: 'esquerdo' }),
          info('No modo APRESENTAR, o slide ocupa a tela toda. Para passar: clique, ou aperte a seta → ou Enter. Para voltar: seta ←. Para sair: Esc.'),
          esperar('Clique em "▶ Apresentar".', 'apresentacao:iniciada', null, { destacar: ap('[data-comando="apresentar"]'), mouse: 'esquerdo' }),
          esperar('Passe todos os slides até o fim (seta → ou clique) e aperte Esc para sair.', 'apresentacao:fim', (d) => d.completa, { dica: 'Se saiu antes do fim, clique em "▶ Apresentar" de novo.' }),
          info('Dicas para apresentar: olhe para as pessoas (não para a tela), fale devagar, não leia o slide inteiro e treine antes!', { emoji: '💡' }),
          quiz('Durante a apresentação, para passar para o próximo slide eu...', ['Clico ou aperto a seta →', 'Fecho o programa', 'Aperto Ctrl+P'], 0),
          quiz('Para sair do modo apresentação, aperto...', ['Esc', 'Enter', 'Espaço'], 0),
        ],
        conclusao: 'Parabéns, apresentador! 🎤',
      },
      {
        id: 'n3-ap-desafio', titulo: 'Desafio das Apresentações', icone: '🏅', desafio: true,
        descricao: 'Uma apresentação sobre você, sem ajuda.',
        passos: [
          info('Desafio! Faça uma apresentação sobre VOCÊ sozinho. Clique em "Continuar".'),
          esperar('Comece uma apresentação nova.', 'apresentacao:nova', null, { jaFeito: () => CE.janelas.estaAberta('apresentacoes') && slides().length === 1 && !slides()[0].tituloTexto && !CE.apresentacaoAtiva.nome() }),
          esperar('Monte pelo menos 3 slides: um de título, um com tópicos e um com imagem. Todos com título.', ['apresentacao:texto', 'apresentacao:imagem', 'apresentacao:slide-novo'],
            () => slides().length >= 3 && slides().every((s) => s.tituloTexto) && slides().some((s) => s.imagem) && slides().some((s) => (s.texto || '').includes('<li>'))),
          esperar('Escolha um tema.', 'apresentacao:tema'),
          esperar('Salve com o nome:  Sobre mim', 'arquivo:salvo', (d) => d.tipo === 'apresentacao' && /sobre mim/i.test(d.nome)),
          esperar('Apresente do começo ao fim.', 'apresentacao:fim', (d) => d.completa),
        ],
        conclusao: 'Desafio vencido! Você sabe montar e fazer uma apresentação. 📽️',
      },
    ],
  });

  CE.adicionarModulo({
    id: 'n3-config', nivel: 'n3', titulo: 'Configurações do computador', icone: '⚙️',
    licoes: [
      {
        id: 'n3-cfg-personalizar', titulo: 'Personalizar e acessibilidade', icone: '🎨',
        descricao: 'Fundo de tela e deixar tudo maior para enxergar melhor.',
        passos: [
          info('As CONFIGURAÇÕES deixam o computador do seu jeito: fundo de tela, tamanho das letras, som, programas e segurança.', { emoji: '⚙️' }),
          abrirConfig('personalizar'),
          esperar('Em "Personalizar", clique num fundo de tela que você goste.', 'config:fundo', null, { destacar: cfg('.cfg-fundo:not(.escolhido)'), mouse: 'esquerdo' }),
          irSecao('acessibilidade', 'Acessibilidade'),
          esperar('Para enxergar melhor, clique em "130% (maior)". Tudo fica maior!', 'config:zoom', (d) => d.zoom === 1.3, { destacar: cfg('[data-zoom="1.3"]'), mouse: 'esquerdo' }),
          esperar('Agora volte para "100% (normal)" (ou deixe no tamanho que for melhor para você e clique de novo nele).', 'config:zoom', null, { destacar: cfg('[data-zoom="1"]') }),
          esperar('Ligue "Setinha do mouse grande" e mexa o mouse para ver.', 'config:cursor', (d) => d.grande, { destacar: cfg('.cfg-interruptor:has([data-campo="cursor"])'), mouse: 'esquerdo' }),
          esperar('Se preferir a setinha normal, desligue de novo. (Se gostou da grande, clique duas vezes: desliga e liga.)', 'config:cursor', null, { destacar: cfg('.cfg-interruptor:has([data-campo="cursor"])') }),
          quiz('Quem tem dificuldade para ler a tela pode...', ['Aumentar o tamanho em Acessibilidade', 'Desligar o monitor', 'Usar só o teclado'], 0),
        ],
        conclusao: 'O computador agora está do seu jeito!',
      },
      {
        id: 'n3-cfg-hora-som', titulo: 'Data, hora e som', icone: '🕒',
        descricao: 'Fuso horário de Rondônia, volume e teste de som.',
        passos: [
          info('Rondônia tem UMA HORA A MENOS que Brasília. Se o relógio do computador estiver no horário de Brasília, ele fica adiantado!', { emoji: '🕒' }),
          abrirConfig('data-hora'),
          irSecao('data-hora', 'Data e hora'),
          esperar('Na caixa "Fuso horário", escolha "Porto Velho, Manaus, Cuiabá (UTC−4)".', 'config:fuso', (d) => d.fuso === -4, { destacar: cfg('[data-campo="fuso"]'), mouse: 'esquerdo' }),
          info('Veja o relógio da barra de tarefas, lá embaixo à direita: ele mostra a hora do fuso escolhido.', { destacar: '#relogio' }),
          irSecao('som', 'Som'),
          esperar('Arraste o controle do volume para o meio (50%).', 'config:volume', (d) => d.volume >= 30 && d.volume <= 70, { destacar: cfg('[data-campo="volume"]'), mouse: 'arrastar' }),
          esperar('Clique em "🔔 Testar o som". Está ouvindo? (Com fone, confira se ele está bem encaixado.)', 'config:som-testado', null, { destacar: cfg('[data-acao="testar-som"]'), mouse: 'esquerdo' }),
          quiz('Porto Velho, em relação a Brasília, tem...', ['Uma hora a menos', 'Uma hora a mais', 'O mesmo horário'], 0),
          quiz('O som não sai. A primeira coisa a conferir é...', ['Se está no mudo e se o volume está alto', 'Formatar o computador', 'Comprar outro fone'], 0),
        ],
        conclusao: 'Hora certa e som funcionando!',
      },
      {
        id: 'n3-cfg-instalar', titulo: 'Instalar e desinstalar programas', icone: '📦',
        descricao: 'Pôr um programa novo e tirar quando não precisar mais.',
        passos: [
          info('INSTALAR é colocar um programa novo no computador. DESINSTALAR é tirar. Regra de ouro: só instale programa de quem você CONFIA (editora verificada ✔️).', {
            emoji: '📦', preparar: async () => { if (CE.config.instalado('jogo-memoria')) await CE.config.guardar({ instalados: CE.config.atual.instalados.filter((x) => x !== 'jogo-memoria') }); CE.areaTrabalho.atualizar(); },
          }),
          abrirConfig('aplicativos'),
          irSecao('aplicativos', 'Aplicativos'),
          esperar('Na Central de programas, ache o "Jogo da Memória" (editora verificada ✔️) e clique em Instalar.', 'config:instalado', (d) => d.app === 'jogo-memoria', { destacar: cfg('[data-instalar="jogo-memoria"]'), mouse: 'esquerdo' }),
          esperar('O ícone apareceu na área de trabalho! Abra o Jogo da Memória com um clique duplo.', 'app:aberto', (d) => d.app === 'jogo-memoria', { destacar: '.icone[data-icone="jogo-memoria"]', mouse: 'duplo' }),
          esperar('Jogue: clique em duas cartas para virar e ache todos os pares.', 'jogo:memoria', null, { destacar: naJanela('jogo-memoria', '.mem-grade'), mouse: 'esquerdo', dica: 'Tente lembrar onde estava cada figura!' }),
          esperar('Agora vamos desinstalar: volte nas Configurações > Aplicativos e clique em "Desinstalar" no Jogo da Memória. Confirme com "Sim".', 'config:desinstalado', (d) => d.app === 'jogo-memoria', {
            destacar: cfg('[data-desinstalar="jogo-memoria"]'), mouse: 'esquerdo', preparar: () => CE.janelas.abrir('configuracoes', { secao: 'aplicativos' }),
          }),
          quiz('Antes de instalar um programa, eu confiro se...', ['A editora é conhecida e confiável', 'O ícone é bonito', 'É grátis, então pode tudo'], 0),
          quiz('Desinstalar um programa serve para...', ['Tirar o programa do computador', 'Atualizar o programa', 'Fazer backup'], 0),
        ],
        conclusao: 'Agora você instala e desinstala programas com segurança!',
      },
      {
        id: 'n3-cfg-antivirus', titulo: 'Antivírus e programa suspeito', icone: '🛡️',
        descricao: 'Verificar o computador e ver o antivírus bloquear um programa perigoso.',
        passos: [
          info('O ANTIVÍRUS vigia o computador contra vírus e programas que roubam dados ou enchem a tela de propaganda. Ele precisa estar LIGADO e ATUALIZADO.', {
            emoji: '🛡️', preparar: () => CE.config.guardar({ protecao: true, antivirusEm: Date.now() - 4 * 86400000 }),
          }),
          abrirConfig('seguranca'),
          irSecao('seguranca', 'Antivírus e segurança'),
          esperar('O aviso diz que o antivírus está desatualizado. Clique em "🔄 Atualizar o antivírus".', 'config:antivirus-atualizado', null, { destacar: cfg('[data-acao="atualizar-antivirus"]'), mouse: 'esquerdo' }),
          esperar('Agora clique em "🔍 Verificação rápida" e espere terminar.', 'config:verificacao', null, { destacar: cfg('[data-acao="verificar"]'), mouse: 'esquerdo' }),
          irSecao('aplicativos', 'Aplicativos'),
          info('Olhe o "Acelerador de PC TURBO 3000 — GRÁTIS!!!": editora DESCONHECIDA, promete milagre, muitos pontos de exclamação... Tudo sinal de programa perigoso!', { destacar: cfg('[data-loja="acelerador"]') }),
          esperar('Para ver o antivírus funcionando, clique em Instalar nele e responda "Sim" no aviso.', 'config:bloqueado', (d) => d.app === 'acelerador', { destacar: cfg('[data-instalar="acelerador"]'), mouse: 'esquerdo' }),
          info('O antivírus BLOQUEOU! Por isso a "Proteção em tempo real" deve ficar sempre ligada. No computador de verdade, nem chegue a clicar em Instalar num programa assim.'),
          quiz('Um programa promete deixar o computador "1000% mais rápido" e é de editora desconhecida. Eu...', ['Não instalo', 'Instalo correndo', 'Desligo o antivírus para instalar'], 0),
          quiz('O antivírus precisa estar...', ['Ligado e atualizado', 'Desligado para não atrapalhar', 'Instalado duas vezes'], 0),
        ],
        conclusao: 'Computador protegido! 🛡️',
      },
      {
        id: 'n3-cfg-atualizar', titulo: 'Atualizações do sistema', icone: '🔄',
        descricao: 'Procurar, instalar e reiniciar.',
        passos: [
          info('As ATUALIZAÇÕES corrigem falhas de segurança e problemas. Computador desatualizado é porta aberta para vírus!', { emoji: '🔄', preparar: () => CE.config.guardar({ atualizacoesFeitas: false }) }),
          abrirConfig('atualizacoes'),
          irSecao('atualizacoes', 'Atualizações'),
          esperar('Clique em "🔎 Procurar atualizações".', 'config:atualizacoes', (d) => d.acao === 'procurou', { destacar: cfg('[data-acao="procurar-atualizacoes"]'), mouse: 'esquerdo' }),
          esperar('Achou atualizações! Clique em "⬇️ Instalar agora" e espere.', 'config:atualizacoes', (d) => d.acao === 'instalou', { destacar: cfg('[data-acao="instalar-atualizacoes"]'), mouse: 'esquerdo' }),
          info('Para terminar, o computador precisa REINICIAR (desligar e ligar sozinho). Antes de reiniciar, sempre salve o que estiver fazendo!'),
          esperar('Clique em "🔁 Reiniciar agora".', 'config:reiniciado', null, { destacar: cfg('[data-acao="reiniciar"]'), mouse: 'esquerdo' }),
          quiz('Antes de reiniciar para atualizar, eu...', ['Salvo os meus arquivos', 'Puxo o cabo da tomada', 'Apago os documentos'], 0),
        ],
        conclusao: 'Sistema atualizado e seguro!',
      },
      {
        id: 'n3-cfg-impressora', titulo: 'Impressoras', icone: '🖨️',
        descricao: 'Adicionar a impressora da rede e escolher a padrão.',
        passos: [
          info('Numa escola ou escritório, várias pessoas usam a mesma impressora pela REDE. Primeiro você ADICIONA a impressora; depois escolhe a PADRÃO (a que já vem marcada na hora de imprimir).', {
            emoji: '🖨️', preparar: () => CE.config.guardar({ impressoras: [{ nome: 'Impressora da sala (treino)', padrao: true }] }),
          }),
          abrirConfig('impressoras'),
          irSecao('impressoras', 'Impressoras'),
          esperar('Clique em "➕ Adicionar impressora", espere a busca e clique em "Impressora Sala 2 (rede)".', 'config:impressora', (d) => d.acao === 'adicionada', { destacar: [cfg('[data-impressora-encontrada]'), cfg('[data-acao="adicionar-impressora"]')], mouse: 'esquerdo' }),
          esperar('Agora clique em "Tornar padrão" na impressora nova.', 'config:impressora', (d) => d.acao === 'padrao', { destacar: cfg('[data-padrao]'), mouse: 'esquerdo' }),
          esperar('Clique em "Página de teste" para ver se ela está funcionando.', 'config:impressora', (d) => d.acao === 'teste', { destacar: cfg('[data-teste]'), mouse: 'esquerdo' }),
          abrir('editor', 'Editor de Texto'),
          esperar('Escreva qualquer coisa, aperte Ctrl+P e veja: a impressora padrão já vem escolhida. Clique em Imprimir.', 'editor:impresso', (d) => /sala 2/i.test(d.impressora || ''), { destacar: naJanela('editor', '[data-comando="imprimir"]'), mouse: 'esquerdo' }),
          quiz('A impressora PADRÃO é...', ['A que já vem escolhida na hora de imprimir', 'A mais cara', 'A que está desligada'], 0),
        ],
        conclusao: 'Pronto! Você configura impressoras como um técnico.',
      },
      {
        id: 'n3-cfg-zip', titulo: 'Compactar arquivos (ZIP)', icone: '🗜️',
        descricao: 'Juntar vários arquivos num só para mandar por e-mail.',
        passos: [
          info('COMPACTAR junta vários arquivos (ou uma pasta inteira) num arquivo só, o ZIP 🗜️, que fica menor. É ótimo para mandar muitas fotos por e-mail. Para usar, é preciso EXTRAIR.', {
            emoji: '🗜️',
            preparar: async () => {
              const lista = await CE.sessao.arquivos();
              if (!lista.some((a) => !a.naLixeira && a.tipo === 'pasta' && a.nome === 'Fotos do passeio' && (a.local || 'pc') === 'pc' && !a.pasta)) await CE.sessao.criarPasta('Fotos do passeio');
              for (const [nome, emoji] of [['Cachoeira', '🏞️'], ['Piquenique', '🧺'], ['Turma reunida', '👨‍👩‍👧']]) {
                if (!lista.some((a) => !a.naLixeira && a.nome === nome && a.pasta === 'Fotos do passeio')) await CE.sessao.salvarArquivo({ nome, tipo: 'imagem', conteudo: imagemDe(emoji), pasta: 'Fotos do passeio' });
              }
            },
          }),
          abrir('arquivos', 'Arquivos'),
          esperar('Clique UMA vez na pasta "Fotos do passeio" (para selecionar) e depois em "🗜️ Compactar".', 'arquivo:compactado', (d) => /fotos do passeio/i.test(d.origem), { destacar: [naJanela('arquivos', '.arq-item[data-arquivo="Fotos do passeio"]'), naJanela('arquivos', '[data-acao="compactar"]')], mouse: 'esquerdo' }),
          esperar('Apareceu o arquivo 🗜️ "Fotos do passeio". Dê um clique duplo nele para ver o que tem dentro.', 'arquivo:zip-aberto', null, { destacar: naJanela('arquivos', '.arq-item[data-tipo="zip"]'), mouse: 'duplo' }),
          esperar('Clique em "📂 Extrair tudo". Os arquivos vão para uma pasta nova.', 'arquivo:extraido', null, { destacar: '.dialogo [data-acao="extrair-tudo"]', mouse: 'esquerdo' }),
          abrir('email', 'E-mail'),
          esperar('Mande o ZIP para professor@correio.escola: clique em Escrever, preencha, clique em "📎 Anexar", escolha o arquivo 🗜️ "Fotos do passeio" e clique em Enviar.', 'email:enviado', (d) => d.para === 'professor@correio.escola' && (d.tiposAnexos || []).includes('zip'), {
            destacar: naJanela('email', '[data-acao="escrever"]'), mouse: 'esquerdo',
          }),
          quiz('Para mandar 30 fotos por e-mail de uma vez, o melhor é...', ['Compactar num ZIP e mandar um arquivo só', 'Mandar 30 e-mails', 'Imprimir as fotos'], 0),
          quiz('Recebi um ZIP. Para usar os arquivos, eu...', ['Extraio', 'Apago', 'Renomeio'], 0),
        ],
        conclusao: 'Muito bem! Arquivos compactados viajam mais fácil.',
      },
      {
        id: 'n3-cfg-desafio', titulo: 'Desafio das Configurações', icone: '🏅', desafio: true,
        descricao: 'Configurar o computador sozinho.',
        passos: [
          info('Desafio! Configure o computador sozinho. Clique em "Continuar".', { preparar: async () => { if (CE.config.instalado('cronometro')) await CE.config.guardar({ instalados: CE.config.atual.instalados.filter((x) => x !== 'cronometro') }); } }),
          esperar('Troque o fundo de tela.', 'config:fundo'),
          esperar('Acerte o fuso horário para o de Rondônia.', 'config:fuso', (d) => d.fuso === -4, { ...pularSe(async () => CE.config.fuso() === -4) }),
          esperar('Instale o programa "Relógio e Cronômetro".', 'config:instalado', (d) => d.app === 'cronometro'),
          esperar('Faça uma verificação de vírus.', 'config:verificacao'),
        ],
        conclusao: 'Desafio vencido! Você é o técnico do seu computador. ⚙️',
      },
    ],
  });
})();
