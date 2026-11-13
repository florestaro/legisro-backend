// Nível 4 — Informática Profissional (como os cursos de Operador de Computador e Informática para o trabalho):
// Windows avançado, Word profissional, Excel profissional, Apresentação profissional, E-mail e agenda,
// Hardware e manutenção, Projeto final e Prova.
(function () {
  const { info, quiz, esperar, abrir, naJanela, abrirExemplo, planilhaDe, celula, perto, editorNovo, editorSalvar, garantirArquivo, pularSe } = CE.L;
  const pl = (s) => naJanela('planilha', s);
  const td = (ref) => pl(`td[data-celula="${ref}"]`);
  const ed = (s) => naJanela('editor', s);
  const ap = (s) => naJanela('apresentacoes', s);
  const gt = (s) => naJanela('tarefas', s);
  const cfg = (s) => naJanela('configuracoes', s);
  const nv = (s) => naJanela('nuvem', s);
  const ag = (s) => naJanela('agenda', s);
  const em = (s) => naJanela('email', s);
  const pc = (s) => naJanela('computador', s);
  const pag = () => document.querySelector('.janela[data-app="editor"] .editor-pagina');
  const slides = () => (CE.apresentacaoAtiva ? CE.apresentacaoAtiva.slides() : []);
  const editou = (texto, teste, extra = {}) => esperar(texto, ['planilha:editada', 'planilha:preenchida', 'planilha:colada', 'planilha:lista-escolhida'], () => teste(), { jaFeito: () => !!CE.planilhaAtiva && teste(), ...extra });
  const salvarPl = (nome) => esperar(`Salve a planilha: clique em "💾 Salvar"${nome ? ` (o nome é "${nome}")` : ''}.`, 'arquivo:salvo', (d) => d.tipo === 'planilha', { destacar: pl('[data-comando="salvar"]'), mouse: 'esquerdo' });
  const salvarAp = (nome) => esperar(`Salve a apresentação: clique em "💾 Salvar"${nome ? ` e use o nome "${nome}"` : ''}.`, 'arquivo:salvo', (d) => d.tipo === 'apresentacao' && (!nome || d.nome.toLowerCase() === nome.toLowerCase()), { destacar: ap('[data-comando="salvar"]'), mouse: 'esquerdo' });
  const abrirConfig = (secao) => abrir('configuracoes', 'Configurações', { preparar: () => { if (CE.janelas.estaAberta('configuracoes')) CE.janelas.abrir('configuracoes', { secao }); } });
  const irSecao = (secao, nome) => esperar(`No menu da esquerda das Configurações, clique em "${nome}".`, 'config:secao', (d) => d.secao === secao, {
    destacar: cfg(`[data-secao="${secao}"]`), mouse: 'esquerdo', jaFeito: () => !!document.querySelector(`.janela[data-app="configuracoes"] [data-secao="${secao}"].ativo`),
  });
  const abrirComputador = (tela) => abrir('computador', 'Conhecendo o Computador', { preparar: () => { if (CE.janelas.estaAberta('computador')) CE.janelas.abrir('computador', { tela }); } });
  const irTela = (tela, nome) => esperar(`Lá em cima, clique na aba "${nome}".`, 'computador:tela', (d) => d.tela === tela, {
    destacar: pc(`[data-tela="${tela}"]`), mouse: 'esquerdo', jaFeito: () => !!document.querySelector(`.janela[data-app="computador"] [data-tela="${tela}"].ativa`),
  });
  // Deixa um programa "Não está respondendo" (para treinar o Gerenciador de Tarefas).
  const travar = (app) => { if (CE.janelas.estaTravada(app)) return; CE.janelas.abrir(app); setTimeout(() => CE.janelas.travar(app), 400); };
  const abrirGerenciador = (extra = {}) => esperar('Abra o GERENCIADOR DE TAREFAS: aperte junto as teclas Ctrl + Shift + Esc. (Ou clique com o botão DIREITO num espaço vazio da barra de tarefas, lá embaixo, e escolha "Gerenciador de Tarefas".)', 'app:aberto', (d) => d.app === 'tarefas', {
    destacar: '#barra-tarefas', mouse: 'direito', jaFeito: () => CE.janelas.estaAberta('tarefas'),
    dica: 'Segure Ctrl e Shift com a mão esquerda e aperte Esc. Ou: botão direito na barra de tarefas › Gerenciador de Tarefas.', ...extra,
  });
  const apresentacaoDe = (lista) => JSON.stringify({ tema: 'azul', transicao: 'aparecer', slides: lista.map(([layout, titulo, texto, notas], i) => ({ id: `s${i + 1}`, layout, titulo, texto, texto2: '', imagem: null, grafico: null, notas: notas || '' })) });
  const topicos = (...t) => `<ul>${t.map((x) => `<li>${x}</li>`).join('')}</ul>`;

  // ---------- Dados de exemplo ----------
  const NOMES = ['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Diego Rocha', 'Elisa Melo', 'Fábio Nunes', 'Gisele Prado', 'Hugo Alves', 'Iara Costa', 'João Pires'];
  const CIDADES = ['Porto Velho', 'Ariquemes', 'Ji-Paraná', 'Cacoal', 'Vilhena'];
  const CLIENTES = [['Código', 'Nome', 'Cidade', 'Telefone', 'Compras']].concat(Array.from({ length: 40 }, (_, i) => [
    String(1001 + i), NOMES[i % NOMES.length] + (i >= 10 ? ` ${Math.floor(i / 10) + 1}` : ''), CIDADES[i % CIDADES.length], `(69) 9${String(8100 + i * 37).padStart(4, '0')}-${String(1000 + i * 53).slice(-4)}`, String(3 + ((i * 7) % 11)),
  ]));
  const CONTAS = [['Conta', 'Vencimento', 'Valor', 'Situação'], ['Aluguel', '05/05/2025', '1200'], ['Luz', '10/05/2025', '320,50'], ['Água', '12/05/2025', '98,40'],
    ['Internet', '15/05/2025', '119,90'], ['Telefone', '20/05/2025', '79,90'], ['Material de limpeza', '25/05/2025', '145']];
  const VENDAS = [['Data', 'Vendedor', 'Produto', 'Valor'], ['01/04', 'Ana', 'Ventilador', '150'], ['01/04', 'Bruno', 'Panela', '80'], ['02/04', 'Carla', 'Ventilador', '150'],
    ['02/04', 'Ana', 'Liquidificador', '120'], ['03/04', 'Bruno', 'Ventilador', '150'], ['03/04', 'Ana', 'Panela', '80'], ['04/04', 'Carla', 'Liquidificador', '120'],
    ['04/04', 'Carla', 'Panela', '80'], ['05/04', 'Bruno', 'Liquidificador', '120'], ['05/04', 'Ana', 'Ventilador', '150']];
  const somaVendedor = (v) => VENDAS.slice(1).filter((l) => l[1] === v).reduce((s, l) => s + Number(l[3]), 0);
  const BOLETOS = [['Conta', 'Vencimento', 'Pago em', 'Dias de atraso', 'Próximo vencimento'], ['Luz', '10/03/2025', '18/03/2025'], ['Água', '15/03/2025', '15/03/2025'], ['Internet', '20/03/2025', '02/04/2025']];
  const ORCAMENTO = [['Item', 'Quantidade', 'Preço', 'Total'], ['Resma de papel', '4', '28,90'], ['Caneta (caixa)', '2', '19,90'], ['Grampeador', '1', '35'], ['Pasta arquivo', '10', '6,50']];
  const orcamentoFormulas = { D2: '=B2*C2', D3: '=B3*C3', D4: '=B4*C4', D5: '=B5*C5', C6: 'Total', D6: '=SOMA(D2:D5)' };
  const MESES_PL = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set'];
  const LARGA = [['Produto', ...MESES_PL]].concat(['Arroz', 'Feijão', 'Café', 'Açúcar', 'Óleo', 'Leite', 'Farinha', 'Macarrão', 'Sal', 'Sabão', 'Detergente', 'Papel higiênico', 'Biscoito', 'Margarina', 'Molho de tomate', 'Sardinha', 'Milho', 'Ervilha', 'Fubá', 'Vinagre']
    .map((p, i) => [p, ...MESES_PL.map((_, m) => String(20 + ((i * 13 + m * 7) % 60)))]));
  const RELATORIO_CHEFE = `<h1>Relatório de vendas de abril</h1><div>Em abril a loja <span class="ed-comentario" data-comentario="Está escrito errado: o certo é &quot;vendemos&quot;. Corrija e depois resolva este comentário." title="💬 Está escrito errado: o certo é &quot;vendemos&quot;.">vendemo</span> mais do que em março. Os produtos mais vendidos foram ventiladores e panelas.</div><div><br></div><div>O setor de entregas atendeu 120 clientes e não houve reclamações.</div>`;
  const TEXTO_RIO = '<h1>O Rio Madeira</h1><div>O Rio Madeira é um dos maiores rios do Brasil e passa por Porto Velho. Ele é importante para o transporte de cargas e para a pesca.</div><div><br></div><div>A Estrada de Ferro Madeira-Mamoré foi construída no começo do século XX e hoje é um ponto turístico da cidade.</div>';
  const CARTA_CLIENTES = '<div>Prezado(a) cliente ,</div><div><br></div><div>A Loja Bom Preço tem uma novidade para quem mora em : a partir deste mês, a entrega é grátis para compras acima de R$ 100,00!</div><div><br></div><div>Atenciosamente,</div><div>Loja Bom Preço</div>';
  const LISTA_CLIENTES = planilhaDe([['Nome', 'Cidade'], ['Maria Oliveira', 'Porto Velho'], ['Pedro Santos', 'Ariquemes'], ['Rosa Lima', 'Cacoal']]);
  const TREINAMENTO = apresentacaoDe([
    ['titulo', 'Treinamento de atendimento', 'Loja Bom Preço'],
    ['conteudo', 'Os 3 passos do bom atendimento', topicos('Cumprimentar com educação', 'Ouvir o cliente com atenção', 'Confirmar se o cliente foi ajudado')],
    ['conteudo', 'O que NÃO fazer', topicos('Ficar no celular', 'Prometer o que não pode cumprir', 'Discutir com o cliente')],
  ]);

  // ======================= 🪟 Windows avançado e operador =======================
  CE.adicionarModulo({
    id: 'n4-windows', nivel: 'n4', titulo: 'Windows avançado (operador de computador)', icone: '🪟',
    licoes: [
      {
        id: 'n4-win-tarefas', titulo: 'Programa travou? Gerenciador de Tarefas', icone: '📊',
        descricao: 'Fechar um programa que "não está respondendo" sem desligar o computador.',
        passos: [
          info('Bem-vindo ao NÍVEL 4: Informática Profissional! Aqui você aprende o que pedem nas vagas de escritório. Começando por um problema comum: o programa TRAVA e não fecha. Vou abrir a Calculadora e ela vai travar de propósito. Clique em "Continuar".', {
            emoji: '💼', preparar: () => travar('calculadora'),
          }),
          esperar('Veja: no título apareceu "(Não está respondendo)" e a janela ficou esbranquiçada. Tente fechar clicando no X da Calculadora.', 'janela:travada-fechar', (d) => d.app === 'calculadora', {
            destacar: naJanela('calculadora', '[data-acao="fechar"]'), mouse: 'esquerdo', preparar: () => travar('calculadora'),
            jaFeito: () => !CE.janelas.estaAberta('calculadora'),
          }),
          info('Não fechou, né? Quando um programa trava, o X não funciona. NUNCA desligue o computador na tomada: isso pode estragar arquivos. Use o GERENCIADOR DE TAREFAS.'),
          abrirGerenciador(),
          esperar('Na aba "Processos", clique em "Calculadora" (ela está escrita "Não está respondendo") e depois no botão "Finalizar tarefa".', 'tarefa:finalizada', (d) => d.app === 'calculadora', {
            destacar: [gt('[data-processo="calculadora"]:not(.selecionada)'), gt('[data-acao="finalizar-tarefa"]')], mouse: 'esquerdo',
            jaFeito: () => !CE.janelas.estaAberta('calculadora'),
          }),
          esperar('Pronto, fechou! Agora clique na aba "📈 Desempenho" para ver como o computador está trabalhando.', 'tarefas:aba', (d) => d.aba === 'desempenho', { destacar: gt('[data-aba="desempenho"]'), mouse: 'esquerdo' }),
          info('CPU é o processador (o "cérebro"). Memória (RAM) é a "mesa de trabalho": quanto mais programas abertos, mais cheia. Se as barras ficam perto de 100%, o computador fica lento: feche o que não está usando.'),
          quiz('Um programa travou ("Não está respondendo"). O que fazer?', ['Esperar um pouco e, se não voltar, Finalizar tarefa no Gerenciador', 'Puxar o computador da tomada', 'Clicar 50 vezes no X'], 0),
          quiz('Qual atalho abre o Gerenciador de Tarefas?', ['Ctrl + Shift + Esc', 'Ctrl + C', 'Alt + F4'], 0),
        ],
        conclusao: 'Agora você resolve programa travado como um operador de computador! 💪',
      },
      {
        id: 'n4-win-inicializar', titulo: 'Computador lento para ligar', icone: '🚀',
        descricao: 'Tirar programas que abrem sozinhos quando o computador liga.',
        passos: [
          info('Muitos programas se colocam para abrir SOZINHOS quando o computador liga. Cada um deixa a inicialização mais lenta. No Gerenciador de Tarefas, a aba "Inicializar" mostra quais são.', { emoji: '🚀' }),
          abrirGerenciador(),
          esperar('Clique na aba "🚀 Inicializar".', 'tarefas:aba', (d) => d.aba === 'inicializacao', { destacar: gt('[data-aba="inicializacao"]'), mouse: 'esquerdo', jaFeito: () => !!document.querySelector('.janela[data-app="tarefas"] [data-aba="inicializacao"].ativa') }),
          esperar('O "Programa de bate-papo" tem impacto ALTO e não precisa abrir sozinho. Clique em "Desabilitar" nele.', 'tarefas:inicializacao', (d) => d.programa === 'chat' && !d.ativo, {
            destacar: gt('[data-alternar-inicio="chat"]'), mouse: 'esquerdo', ...pularSe(async () => CE.config && CE.config.atual.inicializacao && CE.config.atual.inicializacao.chat === false),
          }),
          info('Desabilitar NÃO desinstala: o programa continua no computador, só não abre sozinho. Quando precisar, é só abrir pelo Iniciar. Mas o ANTIVÍRUS deve continuar ligado!'),
          quiz('Qual programa deve continuar abrindo junto com o computador?', ['O antivírus', 'O bate-papo', 'O atualizador da impressora'], 0),
          quiz('Desabilitar um programa na inicialização...', ['Só impede que ele abra sozinho', 'Apaga o programa', 'Apaga os meus arquivos'], 0),
        ],
        conclusao: 'Menos programas no começo = computador ligando mais rápido.',
      },
      {
        id: 'n4-win-contas', titulo: 'Contas de usuário', icone: '👤',
        descricao: 'Cada pessoa com a sua conta: administrador e padrão.',
        passos: [
          info('No trabalho, o mesmo computador pode ser usado por várias pessoas. Cada uma deve ter a SUA conta, com senha. Existem dois tipos: ADMINISTRADOR (pode instalar programas e mudar tudo) e PADRÃO (só usa).', { emoji: '👤' }),
          abrirConfig('contas'),
          irSecao('contas', 'Contas de usuário'),
          esperar('Crie uma conta para a colega "Joana", do tipo "Padrão", com a senha  joana123  (clique em "➕ Adicionar outra pessoa").', 'config:conta-criada', (d) => /joana/i.test(d.nome) && d.tipo === 'padrao', {
            destacar: cfg('[data-acao="nova-conta"]'), mouse: 'esquerdo', ...pularSe(async () => (CE.config.atual.contas || []).some((c) => /joana/i.test(c.nome) && c.tipo === 'padrao')),
            dica: 'Escreva o nome, a senha (6 letras ou números ou mais) e deixe o tipo "Padrão". Depois clique em "Criar conta".',
          }),
          info('Por que "Padrão"? Porque assim, se a Joana clicar sem querer num programa perigoso, ele não consegue se instalar sozinho. Só dê conta de administrador para quem cuida do computador.'),
          quiz('Quem deve ter conta de ADMINISTRADOR?', ['Só quem cuida do computador', 'Todo mundo', 'Os visitantes'], 0),
          quiz('Ao sair de perto do computador do trabalho, eu...', ['Saio da minha conta ou bloqueio a tela', 'Deixo tudo aberto'], 0),
        ],
        conclusao: 'Cada um na sua conta: mais segurança e organização.',
      },
      {
        id: 'n4-win-rede', titulo: 'Rede e Wi‑Fi', icone: '📶',
        descricao: 'Conectar no Wi-Fi com senha, modo avião e cuidado com rede aberta.',
        passos: [
          info('Para ter internet, o computador precisa estar numa REDE: com fio ou Wi‑Fi. Redes com 🔒 pedem senha e são mais seguras. Redes abertas 🔓 (de lanchonete, rodoviária) qualquer um usa: nelas, nada de banco nem senhas!', { emoji: '📶' }),
          abrirConfig('rede'),
          irSecao('rede', 'Rede e Internet'),
          esperar('Ligue o "✈️ Modo avião" e veja: o Wi‑Fi desliga.', 'config:aviao', (d) => d.ligado, { destacar: cfg('[data-campo="aviao"]'), mouse: 'esquerdo', ...pularSe(async () => !!CE.config.atual.aviao) }),
          esperar('Agora DESLIGUE o modo avião, para o Wi‑Fi voltar.', 'config:aviao', (d) => !d.ligado, { destacar: cfg('[data-campo="aviao"]'), mouse: 'esquerdo', ...pularSe(async () => !CE.config.atual.aviao) }),
          esperar('Conecte na rede da escola, "ESCOLA_SALA_INFO" 🔒. A senha é:  aprender2025', 'config:wifi', (d) => d.rede === 'ESCOLA_SALA_INFO' && d.conectado, {
            destacar: cfg('[data-conectar="ESCOLA_SALA_INFO"]'), mouse: 'esquerdo', ...pularSe(async () => CE.config.atual.wifi === 'ESCOLA_SALA_INFO' && !CE.config.atual.aviao),
            dica: 'Clique em "Conectar" e digite a senha certinho: tudo minúsculo, aprender2025.',
          }),
          quiz('Estou numa rede Wi‑Fi aberta (sem senha) da lanchonete. Posso entrar no banco?', ['Não: em rede aberta, nada de banco nem senhas', 'Sim, sem problema'], 0),
          quiz('O "modo avião"...', ['Desliga o Wi‑Fi e as conexões sem fio', 'Deixa a internet mais rápida'], 0),
        ],
        conclusao: 'Conectado com segurança! 📶',
      },
      {
        id: 'n4-win-nuvem', titulo: 'Salvar na nuvem e compartilhar', icone: '☁️',
        descricao: 'Guardar arquivos na internet e mandar um link.',
        passos: [
          info('NUVEM é guardar os arquivos na internet (como Google Drive e OneDrive). Vantagens: se o computador quebrar, o arquivo não se perde, e dá para abrir em outro lugar. E dá para COMPARTILHAR mandando só um link.', {
            emoji: '☁️', preparar: () => garantirArquivo('Relatório de vendas', '<h1>Relatório de vendas</h1><div>Vendas de abril: R$ 128.450,00.</div>'),
          }),
          abrir('nuvem', 'Nuvem'),
          esperar('Clique em "⬆️ Enviar arquivo" e escolha o "Relatório de vendas".', 'nuvem:enviado', (d) => /relat[óo]rio de vendas/i.test(d.nome), { destacar: nv('[data-acao="enviar-nuvem"]'), mouse: 'esquerdo' }),
          esperar('Agora compartilhe com o chefe: clique em "🔗 Compartilhar" no relatório, escreva  chefe@empresaboa.com.br , deixe "Só pode ver" e confirme.', 'nuvem:compartilhado', (d) => /relat/i.test(d.nome) && d.permissao === 'ver' && /@/.test(d.pessoa), {
            destacar: nv('[data-compartilhar]'), mouse: 'esquerdo',
          }),
          info('Pronto: o link foi copiado. É só colar num e-mail ou mensagem. Como é "Só pode ver", o chefe lê, mas não muda nada. Os arquivos da nuvem também ficam na pasta "Nuvem" de Meus Documentos.'),
          quiz('Uma vantagem da nuvem é...', ['Não perder o arquivo se o computador quebrar', 'Deixar o computador mais rápido', 'Não precisar de internet nunca'], 0),
          quiz('Vou mandar a cópia do meu RG para a empresa. Escolho...', ['"Só pode ver", só para quem precisa', '"Pode editar" para qualquer um com o link'], 0),
        ],
        conclusao: 'Seus arquivos agora vivem na nuvem! ☁️',
      },
      {
        id: 'n4-win-desafio', titulo: 'Desafio do operador', icone: '🏅', desafio: true,
        descricao: 'Resolver sozinho: programa travado, inicialização e nuvem.',
        passos: [
          info('Desafio! O Desenho travou. Resolva sozinho as tarefas. Clique em "Continuar".', { preparar: () => travar('desenho') }),
          esperar('Feche o Desenho, que está "Não está respondendo".', 'tarefa:finalizada', (d) => d.app === 'desenho', { preparar: () => travar('desenho') }),
          esperar('Desabilite o "Atualizador de impressora" na inicialização.', 'tarefas:inicializacao', (d) => d.programa === 'atualizador' && !d.ativo, { ...pularSe(async () => CE.config && CE.config.atual.inicializacao && CE.config.atual.inicializacao.atualizador === false) }),
          esperar('Mande qualquer arquivo para a nuvem.', 'nuvem:enviado'),
        ],
        conclusao: 'Desafio vencido! Você cuida do computador do escritório. 🪟',
      },
    ],
  });

  // ======================= 📝 Word profissional =======================
  CE.adicionarModulo({
    id: 'n4-word', nivel: 'n4', titulo: 'Editor de Texto profissional', icone: '📝',
    licoes: [
      {
        id: 'n4-ed-oficio', titulo: 'Documentos do escritório: ofício e memorando', icone: '🏢',
        descricao: 'Usar os modelos de ofício e memorando.',
        passos: [
          info('No escritório, alguns documentos têm forma certa. OFÍCIO: comunicação oficial para fora da empresa (prefeitura, escola). MEMORANDO: recado interno, entre setores. O Editor tem modelos prontos.', { emoji: '🏢' }),
          abrir('editor', 'Editor de Texto'),
          editorNovo('oficio', 'Ofício'),
          esperar('Os campos entre [colchetes] são para trocar. Clique em [número] e escreva  015 . Depois troque [Nome da pessoa] por  Diretor Paulo Mendes .', 'editor:texto', (d) => /015/.test(d.texto) && /paulo mendes/i.test(d.texto), {
            jaFeito: () => !!pag() && /015/.test(pag().innerText) && /paulo mendes/i.test(pag().innerText), dica: 'Clique em cima do texto entre colchetes: ele fica todo selecionado. Aí é só escrever por cima.',
          }),
          esperar('Troque também o [resumo do assunto...] por  Pedido de uso do auditório .', 'editor:texto', (d) => /audit[óo]rio/i.test(d.texto), { jaFeito: () => !!pag() && /audit[óo]rio/i.test(pag().innerText) }),
          editorSalvar('Ofício auditório'),
          quiz('Para mandar um pedido para a Prefeitura, uso...', ['Ofício', 'Memorando', 'Bilhete'], 0),
          quiz('O MEMORANDO é usado para...', ['Comunicação dentro da empresa, entre setores', 'Cobrar um cliente', 'Fazer um currículo'], 0),
        ],
        conclusao: 'Documento oficial pronto, com a forma certa!',
      },
      {
        id: 'n4-ed-notas', titulo: 'Notas de rodapé', icone: '¹',
        descricao: 'Explicar uma palavra sem atrapalhar o texto.',
        passos: [
          info('A NOTA DE RODAPÉ é um número pequenino no texto que leva a uma explicação no fim da página. Serve para citar de onde veio a informação ou explicar uma palavra. Abri um texto para você.', {
            emoji: '¹', preparar: () => abrirExemplo('O Rio Madeira', 'documento', TEXTO_RIO, true),
          }),
          esperar('Clique logo depois da palavra "Madeira-Mamoré" e clique em "¹ Nota". Escreva:  Ferrovia construída entre 1907 e 1912.  e OK.', 'editor:formatado', (d) => d.comando === 'notaRodape' && d.notas >= 1, {
            destacar: ed('[data-comando="notaRodape"]'), mouse: 'esquerdo', jaFeito: () => !!pag() && pag().querySelectorAll('sup.nota-ref').length >= 1,
          }),
          info('Viu? Apareceu o número 1 no texto e a explicação lá embaixo, depois de uma linha. Se você puser outra nota ANTES dessa, os números se arrumam sozinhos.'),
          esperar('Agora coloque uma nota depois de "Porto Velho" (na primeira frase), dizendo:  Capital de Rondônia.', 'editor:formatado', (d) => d.comando === 'notaRodape' && d.notas >= 2, {
            destacar: ed('[data-comando="notaRodape"]'), mouse: 'esquerdo', jaFeito: () => !!pag() && pag().querySelectorAll('sup.nota-ref').length >= 2,
          }),
          editorSalvar('O Rio Madeira'),
          quiz('A nota de rodapé fica...', ['No fim da página, com um número', 'No meio do texto, em vermelho', 'No título'], 0),
        ],
        conclusao: 'Texto com cara de trabalho profissional! 📚',
      },
      {
        id: 'n4-ed-comentarios', titulo: 'Comentários e revisão', icone: '💬',
        descricao: 'Ler e responder os comentários do chefe e comentar um texto.',
        passos: [
          info('No trabalho, um colega REVISA o seu texto e deixa COMENTÁRIOS (balões amarelos), em vez de mudar tudo sozinho. Seu chefe revisou o relatório. Abri para você.', {
            emoji: '💬', preparar: () => abrirExemplo('Relatório para revisar', 'documento', RELATORIO_CHEFE, true),
          }),
          esperar('A palavra "vendemo" está pintada de amarelo: é o comentário do chefe. Corrija a palavra para  vendemos .', 'editor:texto', (d) => /vendemos/i.test(d.texto), {
            destacar: ed('.ed-comentario'), jaFeito: () => !!pag() && /vendemos/i.test(pag().innerText),
            dica: 'Clique no fim da palavra "vendemo" (antes do 💬) e escreva a letra s.',
          }),
          esperar('Agora clique em cima da palavra amarela para ler o comentário e clique em "Sim" para RESOLVER (o comentário some, o texto fica).', 'editor:comentario-resolvido', (d) => /vendemos/i.test(d.comentario), { destacar: ed('.ed-comentario'), mouse: 'esquerdo' }),
          esperar('Sua vez de revisar: selecione (pinte) as palavras "120 clientes", clique em "💬 Comentário" e escreva:  Conferir esse número com o setor de entregas.', 'editor:formatado', (d) => d.comando === 'comentario' && /120/.test(d.trecho), {
            destacar: ed('[data-comando="comentario"]'), mouse: 'esquerdo',
          }),
          info('Comentários não aparecem quando o documento é impresso: eles servem só para conversar sobre o texto.'),
          editorSalvar('Relatório para revisar'),
          quiz('Para sugerir uma mudança no texto de um colega sem apagar nada, eu...', ['Faço um comentário', 'Apago o texto dele', 'Mudo a fonte'], 0),
        ],
        conclusao: 'Revisão em equipe, como nos escritórios! 💬',
      },
      {
        id: 'n4-ed-formas', titulo: 'Formas: setas, caixas e balões', icone: '🔷',
        descricao: 'Desenhos simples para avisos e cartazes.',
        passos: [
          info('As FORMAS (retângulo, seta, estrela, balão) ajudam a chamar a atenção em avisos e cartazes. Vamos fazer um aviso.', { emoji: '🔷' }),
          abrir('editor', 'Editor de Texto'),
          editorNovo('branco', 'Documento em branco'),
          esperar('Clique em "🔷 Forma". Na caixa, escreva o texto  ENTRADA , escolha a cor verde e clique na SETA.', 'editor:formatado', (d) => d.comando === 'forma' && d.forma === 'seta' && /entrada/i.test(d.texto), {
            destacar: ed('[data-comando="forma"]'), mouse: 'esquerdo',
          }),
          esperar('Agora coloque uma ESTRELA com o texto  Promoção .', 'editor:formatado', (d) => d.comando === 'forma' && d.forma === 'estrela' && d.texto, { destacar: ed('[data-comando="forma"]'), mouse: 'esquerdo' }),
          editorSalvar('Aviso com formas'),
          quiz('As formas servem para...', ['Chamar a atenção em avisos e cartazes', 'Corrigir a ortografia'], 0),
        ],
        conclusao: 'Avisos que ninguém deixa de ver! 🔷',
      },
      {
        id: 'n4-ed-mala', titulo: 'Mala direta: uma carta para cada cliente', icone: '✉️',
        descricao: 'O mesmo documento com o nome de cada pessoa, a partir de uma planilha.',
        passos: [
          info('MALA DIRETA: você escreve a carta UMA vez e o computador faz uma cópia para cada pessoa de uma lista, trocando o nome, a cidade... Muito usado em empresas! Já preparei a planilha "Lista de clientes" (Nome e Cidade) e a carta.', {
            emoji: '✉️', preparar: async () => { await garantirArquivo('Lista de clientes', LISTA_CLIENTES, 'planilha'); await abrirExemplo('Carta para clientes', 'documento', CARTA_CLIENTES, true); },
          }),
          esperar('Clique em "✉️ Mala direta" e escolha a planilha "Lista de clientes".', 'editor:mala-direta', (d) => d.acao === 'planilha' && /lista de clientes/i.test(d.planilha), {
            destacar: [`.dialogo [data-mala-planilha="Lista de clientes"]`, ed('[data-comando="malaDireta"]')], mouse: 'esquerdo',
          }),
          esperar('Agora clique no texto logo depois de "cliente" (na primeira linha) e clique no campo «Nome».', 'editor:mala-direta', (d) => d.acao === 'campo' && d.campo === 'Nome', {
            destacar: '.dialogo [data-mala-campo="Nome"]', mouse: 'esquerdo', dica: 'A janela da mala direta pode ficar aberta: clique no texto da carta e depois no botão «Nome».',
          }),
          esperar('Clique no texto logo depois de "quem mora em" e clique no campo «Cidade».', 'editor:mala-direta', (d) => d.acao === 'campo' && d.campo === 'Cidade', { destacar: '.dialogo [data-mala-campo="Cidade"]', mouse: 'esquerdo' }),
          esperar('Agora clique em "✉️ Gerar 3 documentos".', 'editor:mala-direta', (d) => d.acao === 'gerar' && d.copias === 3, {
            destacar: '.dialogo [data-mala-gerar]', mouse: 'esquerdo', dica: 'Se perguntar se quer salvar o modelo antes, pode clicar em "Não".',
          }),
          info('Veja: 3 cartas, uma em cada página, cada uma com o nome e a cidade da pessoa! Com 300 clientes, seria o mesmo trabalho.'),
          editorSalvar('Cartas para os clientes'),
          quiz('Na mala direta, os nomes das pessoas vêm de...', ['Uma planilha (lista)', 'Do corretor ortográfico', 'Da internet'], 0),
        ],
        conclusao: 'Agora você faz 300 cartas no tempo de uma! ✉️',
      },
      {
        id: 'n4-ed-desafio', titulo: 'Desafio do Editor profissional', icone: '🏅', desafio: true,
        descricao: 'Memorando com nota de rodapé e forma.',
        passos: [
          info('Desafio! Faça um memorando completo sozinho. Clique em "Continuar".'),
          abrir('editor', 'Editor de Texto'),
          esperar('Comece um documento novo usando o modelo "Memorando".', 'editor:novo', (d) => d.modelo === 'memorando'),
          esperar('Preencha o assunto com  Horário de férias .', 'editor:texto', (d) => /f[ée]rias/i.test(d.texto), { jaFeito: () => !!pag() && /f[ée]rias/i.test(pag().innerText) }),
          esperar('Coloque uma nota de rodapé em qualquer lugar.', 'editor:formatado', (d) => d.comando === 'notaRodape'),
          esperar('Coloque uma forma (qualquer uma).', 'editor:formatado', (d) => d.comando === 'forma'),
          esperar('Salve o documento.', 'arquivo:salvo', (d) => d.tipo === 'documento'),
        ],
        conclusao: 'Desafio vencido! Documento de escritório nota 10. 📝',
      },
    ],
  });

  // ======================= 📊 Excel profissional =======================
  CE.adicionarModulo({
    id: 'n4-excel', nivel: 'n4', titulo: 'Planilha profissional', icone: '📊',
    licoes: [
      {
        id: 'n4-pl-congelar', titulo: 'Congelar painéis', icone: '🧊',
        descricao: 'Os títulos ficam parados quando a lista é grande.',
        passos: [
          info('Numa lista grande, quando você rola para baixo, os títulos (Código, Nome...) somem e fica difícil saber o que é cada coluna. CONGELAR PAINÉIS deixa os títulos parados. Abri um cadastro de 40 clientes.', {
            emoji: '🧊', preparar: () => abrirExemplo('Cadastro de clientes', 'planilha', planilhaDe(CLIENTES), true),
          }),
          esperar('Role a planilha para baixo (com a rodinha do mouse) e veja os títulos sumirem. Depois clique em "🧊 Congelar" e escolha "Congelar a 1ª linha".', 'planilha:congelada', (d) => d.linhas === 1, {
            destacar: [`.dialogo [data-congelar="linha"]`, pl('[data-comando="congelar"]')], mouse: 'esquerdo', jaFeito: () => !!CE.planilhaAtiva && !!CE.planilhaAtiva.congelar() && CE.planilhaAtiva.congelar().linhas === 1,
          }),
          esperar('Agora role para baixo de novo: os títulos ficam parados no alto! Para terminar, congele também a coluna do código: clique na célula B2, em "🧊 Congelar" e "Congelar acima e à esquerda de B2".', 'planilha:congelada', (d) => d.linhas === 1 && d.colunas === 1, {
            destacar: [`.dialogo [data-congelar="celula"]`, td('B2')], mouse: 'esquerdo',
          }),
          quiz('Congelar painéis serve para...', ['Deixar os títulos parados ao rolar a planilha', 'Proteger contra vírus', 'Apagar linhas'], 0),
          salvarPl('Cadastro de clientes'),
        ],
        conclusao: 'Listas enormes ficaram fáceis de ler! 🧊',
      },
      {
        id: 'n4-pl-validacao', titulo: 'Validação de dados (lista de opções)', icone: '✅',
        descricao: 'A célula só aceita o que pode: evita erro de digitação.',
        passos: [
          info('Se cada pessoa escreve de um jeito ("pago", "PG", "quitado"), a planilha vira bagunça. A VALIDAÇÃO DE DADOS deixa a célula aceitar só algumas opções. Abri as "Contas a pagar".', {
            emoji: '✅', preparar: () => abrirExemplo('Contas a pagar', 'planilha', planilhaDe(CONTAS), true),
          }),
          esperar('Selecione a coluna Situação: arraste de D2 até D7.', 'planilha:selecao', (d) => d.intervalo === 'D2:D7', { destacar: td('D2'), mouse: 'arrastar' }),
          esperar('Clique em "✅ Validação". Deixe "Lista de opções", escreva  Pago; Pendente  e clique em Aplicar.', 'planilha:validacao', (d) => d.tipo === 'lista' && /^D2/.test(d.intervalo) && (d.opcoes || []).length >= 2, {
            destacar: pl('[data-comando="validacao"]'), mouse: 'esquerdo',
          }),
          editou('Clique na célula D2: apareceu uma setinha ▾ do lado. Clique nela e escolha "Pago".', () => CE.L.entrada('D2').toLowerCase() === 'pago', { destacar: pl('[data-lista-botao]'), mouse: 'esquerdo' }),
          esperar('Agora tente escrever  quitado  na célula D3 e aperte Enter.', 'planilha:invalida', (d) => d.celula === 'D3', { destacar: td('D3') }),
          info('A planilha recusou! Só aceita "Pago" ou "Pendente". Assim, todo mundo preenche igual e os filtros e somas funcionam.'),
          editou('Escolha "Pendente" para a D3 (pela setinha ▾ ou escrevendo certinho).', () => CE.L.entrada('D3').toLowerCase() === 'pendente', { destacar: td('D3') }),
          quiz('A validação de dados serve para...', ['Aceitar só valores permitidos na célula', 'Deixar a letra maior', 'Fazer gráficos'], 0),
          salvarPl('Contas a pagar'),
        ],
        conclusao: 'Planilha à prova de erros de digitação! ✅',
      },
      {
        id: 'n4-pl-dinamica', titulo: 'Tabela dinâmica (resumo)', icone: '📋',
        descricao: 'Quanto cada vendedor vendeu, em poucos cliques.',
        passos: [
          info('Quanto cada vendedor vendeu no mês? Com muitas linhas, somar na mão é demorado. A TABELA DINÂMICA faz um RESUMO por categoria em segundos. Abri as "Vendas do mês".', {
            emoji: '📋', preparar: () => abrirExemplo('Vendas do mês', 'planilha', planilhaDe(VENDAS), true),
          }),
          esperar('Clique em qualquer célula da tabela e depois em "📋 Tabela dinâmica". Deixe: Separar por "Vendedor", Calcular "Soma", De "Valor". Clique em "Criar resumo".', 'planilha:dinamica', (d) => d.agrupar === 'B' && d.valores === 'D' && d.operacao === 'soma', {
            destacar: pl('[data-comando="dinamica"]'), mouse: 'esquerdo',
          }),
          info(`Pronto! O resumo apareceu ao lado: Ana vendeu R$ ${somaVendedor('Ana')}, Bruno R$ ${somaVendedor('Bruno')} e Carla R$ ${somaVendedor('Carla')}. E ele é feito com fórmulas (SOMASE): se a tabela mudar, o resumo muda junto.`),
          editou('Teste: mude o valor da venda da linha 3 (Bruno, Panela, D3) para  300  e veja o resumo do Bruno mudar.', () => perto(celula('D3'), 300), { destacar: td('D3') }),
          esperar('Agora um resumo de QUANTAS vendas de cada produto: Tabela dinâmica, Separar por "Produto", Calcular "Contagem".', 'planilha:dinamica', (d) => d.agrupar === 'C' && d.operacao === 'contagem', {
            destacar: pl('[data-comando="dinamica"]'), mouse: 'esquerdo', dica: 'Clique antes numa célula da tabela original (colunas A a D).',
          }),
          quiz('A tabela dinâmica serve para...', ['Fazer um resumo da tabela por categoria', 'Deixar a tabela colorida', 'Apagar os dados'], 0),
          salvarPl('Vendas do mês'),
        ],
        conclusao: 'Relatório de vendas em segundos! 📋',
      },
      {
        id: 'n4-pl-datas', titulo: 'Contas com datas', icone: '📆',
        descricao: 'Dias de atraso e próximo vencimento.',
        passos: [
          info('A planilha também faz contas com DATAS. =DIAS(fim; início) diz quantos dias há entre duas datas. =DATA.SOMAR(data; 30) dá a data de 30 dias depois. =HOJE() mostra a data de hoje.', {
            emoji: '📆', preparar: () => abrirExemplo('Boletos', 'planilha', planilhaDe(BOLETOS), true),
          }),
          editou('Quantos dias a conta de luz atrasou? Em D2 escreva:  =DIAS(C2;B2)', () => celula('D2') === 8, { destacar: td('D2'), dica: 'Primeiro a data do pagamento (C2), depois a do vencimento (B2), separadas por ponto e vírgula.' }),
          editou('Arraste a alça de D2 até a D4 para calcular as outras contas.', () => celula('D3') === 0 && celula('D4') === 13, { destacar: td('D2'), mouse: 'arrastar' }),
          editou('O próximo vencimento é 30 dias depois. Em E2 escreva:  =DATA.SOMAR(B2;30)', () => celula('E2') === '09/04/2025', { destacar: td('E2') }),
          editou('Em G1 escreva  =HOJE()  para mostrar a data de hoje.', () => /^\d{2}\/\d{2}\/\d{4}$/.test(String(celula('G1'))), { destacar: td('G1') }),
          quiz('Paguei no dia 18 uma conta que vencia no dia 10. =DIAS(...) dá...', ['8 dias de atraso', '28', '10'], 0),
          salvarPl('Boletos'),
        ],
        conclusao: 'Agora as datas trabalham por você! 📆',
      },
      {
        id: 'n4-pl-proteger', titulo: 'Proteger a planilha', icone: '🔒',
        descricao: 'Ninguém apaga uma fórmula sem querer.',
        passos: [
          info('Uma planilha com fórmulas pode ser estragada quando alguém escreve por cima de uma conta. PROTEGER a planilha trava as células. Você escolhe quais ficam LIBERADAS para escrever. Abri um orçamento.', {
            emoji: '🔒', preparar: () => abrirExemplo('Orçamento de material', 'planilha', planilhaDe(ORCAMENTO, orcamentoFormulas), true),
          }),
          esperar('Só as QUANTIDADES devem poder mudar. Selecione de B2 até B5.', 'planilha:selecao', (d) => d.intervalo === 'B2:B5', { destacar: td('B2'), mouse: 'arrastar' }),
          esperar('Clique em "🔓 Liberar células".', 'planilha:liberadas', (d) => d.liberar && /B2:B5/.test(d.intervalo), { destacar: pl('[data-comando="liberar"]'), mouse: 'esquerdo' }),
          esperar('Agora clique em "🔒 Proteger". Use a senha  1234  e OK.', 'planilha:protecao', (d) => d.ligado, { destacar: pl('[data-comando="proteger"]'), mouse: 'esquerdo', jaFeito: () => !!CE.planilhaAtiva && !!CE.planilhaAtiva.protecao() }),
          esperar('Teste: tente escrever  0  na célula D2 (a do total, que tem fórmula) e aperte Enter.', 'planilha:bloqueada', (d) => /^D/.test(d.celula), { destacar: td('D2') }),
          editou('A planilha não deixou! Agora mude a quantidade de resmas (B2) para  6 : essa pode, porque foi liberada.', () => celula('B2') === 6, { destacar: td('B2') }),
          quiz('Na planilha protegida, quais células podem ser mudadas?', ['Só as que eu liberei antes de proteger', 'Todas', 'Nenhuma, nunca mais'], 0),
          salvarPl('Orçamento de material'),
        ],
        conclusao: 'Fórmulas protegidas contra acidentes! 🔒',
      },
      {
        id: 'n4-pl-imprimir', titulo: 'Imprimir planilha sem desperdício', icone: '🖨️',
        descricao: 'Área de impressão, paisagem e ajustar em 1 página.',
        passos: [
          info('Imprimir planilha sem cuidado gasta MUITO papel: as colunas que não cabem vão para outras folhas. Vamos imprimir certinho. Abri uma tabela larga, de vendas por mês.', {
            emoji: '🖨️', preparar: () => abrirExemplo('Vendas por mês', 'planilha', planilhaDe(LARGA), true),
          }),
          esperar('Clique em "🖨️ Imprimir" (ou Ctrl+P) e veja embaixo quantas folhas iam sair. Mude a Orientação para "Paisagem", marque "Ajustar tudo em 1 página" e clique em Imprimir.', 'planilha:impressa', (d) => d.orientacao === 'paisagem' && d.ajustar, {
            destacar: ['.dialogo [data-imprimir-orientacao]', pl('[data-comando="imprimir"]')], mouse: 'esquerdo',
            dica: 'Na janela de impressão, mude a Orientação para "Paisagem", marque "Ajustar tudo em 1 página" e clique em Imprimir.',
          }),
          info('Paisagem (folha deitada) cabe mais colunas, e "Ajustar em 1 página" diminui um pouco tudo para caber numa folha só. Economia de papel!'),
          esperar('Agora imprima SÓ um pedaço: selecione de A1 até D11 (os 10 primeiros produtos, de Jan a Mar), abra o Imprimir e escolha "Só a seleção".', 'planilha:impressa', (d) => d.area === 'selecao', {
            destacar: pl('[data-comando="imprimir"]'), mouse: 'esquerdo',
          }),
          quiz('A tabela é larga, com muitas colunas. Para caber melhor, imprimo...', ['Em paisagem (deitada)', 'Em retrato e 3 cópias'], 0),
          quiz('Antes de imprimir uma planilha, eu...', ['Confiro a prévia e quantas folhas vão sair', 'Mando imprimir sem olhar'], 0),
        ],
        conclusao: 'Impressão certa, papel economizado! 🌳',
      },
      {
        id: 'n4-pl-desafio', titulo: 'Desafio da planilha profissional', icone: '🏅', desafio: true,
        descricao: 'Congelar, validar e resumir sozinho.',
        passos: [
          info('Desafio! Abri as "Vendas do mês". Faça tudo sozinho. Clique em "Continuar".', { preparar: () => abrirExemplo('Vendas do mês', 'planilha', planilhaDe(VENDAS), true) }),
          esperar('Congele a 1ª linha.', 'planilha:congelada', (d) => d.linhas >= 1),
          esperar('Coloque uma validação de LISTA na coluna Vendedor (B2 até B11) com as opções Ana; Bruno; Carla.', 'planilha:validacao', (d) => d.tipo === 'lista' && /^B2/.test(d.intervalo)),
          esperar('Faça uma tabela dinâmica com a SOMA de valores por PRODUTO.', 'planilha:dinamica', (d) => d.agrupar === 'C' && d.operacao === 'soma'),
          salvarPl(),
        ],
        conclusao: 'Desafio vencido! Você domina a planilha do escritório. 📊',
      },
    ],
  });

  // ======================= 📽️ Apresentação profissional =======================
  CE.adicionarModulo({
    id: 'n4-apresentacao', nivel: 'n4', titulo: 'Apresentação profissional', icone: '📽️',
    licoes: [
      {
        id: 'n4-ap-animacao', titulo: 'Animação: um tópico de cada vez', icone: '🎬',
        descricao: 'Os tópicos aparecem a cada clique, enquanto você fala.',
        passos: [
          info('Quando todos os tópicos aparecem de uma vez, o público lê tudo e para de prestar atenção em você. Com ANIMAÇÃO, cada tópico aparece num clique, na hora em que você fala dele. Abri o "Treinamento de atendimento".', {
            emoji: '🎬', preparar: () => abrirExemplo('Treinamento de atendimento', 'apresentacao', TREINAMENTO, true),
          }),
          esperar('Clique no slide 2 (na lista da esquerda).', 'apresentacao:selecionado', (d) => d.slide === 2, { destacar: ap('[data-miniatura="2"]'), mouse: 'esquerdo', jaFeito: () => !!CE.apresentacaoAtiva && CE.apresentacaoAtiva.atual() === 2 }),
          esperar('Na caixa "🎬 Sem animação" (lá em cima), escolha "Surgir (de baixo)".', 'apresentacao:animacao', (d) => d.slide === 2 && d.animacao !== 'nenhuma', { destacar: ap('[data-comando="animacao"]'), mouse: 'esquerdo' }),
          esperar('Agora apresente (▶ Apresentar) e vá clicando: no slide 2, cada clique mostra um tópico. Veja até o último tópico aparecer.', 'apresentacao:animou', (d) => d.slide === 2 && d.item >= 3, {
            destacar: ap('[data-comando="apresentar"]'), mouse: 'esquerdo', dica: 'Depois, aperte Esc para sair da apresentação.',
          }),
          quiz('Para que serve a animação dos tópicos?', ['Mostrar cada tópico na hora em que eu falo dele', 'Deixar a apresentação mais lenta', 'Trocar as cores'], 0),
          quiz('Numa apresentação de trabalho, é melhor...', ['Poucas animações, simples', 'Muitas animações girando e piscando'], 0),
          salvarAp('Treinamento de atendimento'),
        ],
        conclusao: 'O público agora acompanha você, tópico por tópico! 🎬',
      },
      {
        id: 'n4-ap-apresentador', titulo: 'Anotações e modo do apresentador', icone: '🗒️',
        descricao: 'Ver as suas anotações e o relógio enquanto apresenta.',
        passos: [
          info('Nervoso para apresentar? As ANOTAÇÕES DO APRESENTADOR são uma "cola" que só você vê. No MODO DO APRESENTADOR, a tela mostra o slide, as suas anotações, o próximo slide e o relógio.', {
            emoji: '🗒️', preparar: () => abrirExemplo('Treinamento de atendimento', 'apresentacao', TREINAMENTO),
          }),
          esperar('Clique no slide 1 e, na caixa embaixo do slide ("🗒️ Anotações do apresentador"), escreva:  Bom dia a todos! Hoje vamos falar de atendimento.', 'apresentacao:notas', (d) => d.slide === 1 && d.texto.trim().length >= 10, {
            destacar: ap('[data-campo="notas"]'), mouse: 'esquerdo', dica: 'Escreva e depois clique fora da caixa (por exemplo, no slide) para guardar.',
          }),
          esperar('Agora clique em "🗒️ Modo apresentador" (do lado do ▶ Apresentar).', 'apresentacao:iniciada', (d) => d.apresentador, { destacar: ap('[data-comando="apresentador"]'), mouse: 'esquerdo' }),
          esperar('Veja à direita: suas anotações, o próximo slide e o relógio. Vá clicando até o fim e aperte Esc.', 'apresentacao:fim', null, { dica: 'Clique na tela ou aperte a seta → para avançar. Esc para sair.' }),
          quiz('As anotações do apresentador...', ['Só eu vejo; o público não', 'Aparecem grandes para o público', 'Apagam o slide'], 0),
          salvarAp('Treinamento de atendimento'),
        ],
        conclusao: 'Agora você apresenta com segurança, com a sua "cola" escondida! 🗒️',
      },
      {
        id: 'n4-ap-mestre', titulo: 'Slide mestre: a marca da empresa', icone: '🧩',
        descricao: 'Rodapé, número e logotipo em todos os slides de uma vez.',
        passos: [
          info('Apresentação de empresa tem o NOME e o LOGOTIPO em todos os slides. Em vez de pôr um por um, use o SLIDE MESTRE: o que vai nele aparece em TODOS.', {
            emoji: '🧩', preparar: () => abrirExemplo('Treinamento de atendimento', 'apresentacao', TREINAMENTO),
          }),
          esperar('Clique em "🧩 Slide mestre". Escreva no rodapé  Loja Bom Preço — Treinamento , marque "Mostrar o número do slide", escolha o logotipo 🛒 e clique em "Aplicar em todos".', 'apresentacao:mestre', (d) => d.rodape && d.numerar && d.logo, {
            destacar: ap('[data-comando="mestre"]'), mouse: 'esquerdo',
          }),
          info('Olhe as miniaturas: todos os slides ganharam o rodapé, o número e o logotipo de uma vez só!'),
          salvarAp('Treinamento de atendimento'),
          quiz('O slide mestre serve para...', ['Colocar algo em todos os slides de uma vez', 'Apagar todos os slides', 'Apresentar mais rápido'], 0),
        ],
        conclusao: 'Apresentação com a cara da empresa! 🧩',
      },
      {
        id: 'n4-ap-desafio', titulo: 'Desafio: apresentação de reunião', icone: '🏅', desafio: true,
        descricao: 'Apresentação profissional completa, sozinho.',
        passos: [
          info('Desafio! Faça uma apresentação para a reunião da equipe. Clique em "Continuar".'),
          abrir('apresentacoes', 'Apresentações'),
          esperar('Comece uma apresentação NOVA com pelo menos 3 slides, todos com título.', ['apresentacao:texto', 'apresentacao:slide-novo'], () => slides().length >= 3 && slides().every((s) => s.tituloTexto)),
          esperar('Coloque animação em algum slide.', 'apresentacao:animacao', (d) => d.animacao !== 'nenhuma'),
          esperar('Escreva anotações do apresentador em algum slide.', 'apresentacao:notas', (d) => d.texto.trim().length >= 5),
          esperar('Use o slide mestre com um rodapé.', 'apresentacao:mestre', (d) => d.rodape),
          salvarAp('Reunião da equipe'),
        ],
        conclusao: 'Desafio vencido! Apresentação de profissional. 🎤',
      },
    ],
  });

  // ======================= 📅 E-mail e agenda de trabalho =======================
  CE.adicionarModulo({
    id: 'n4-agenda', nivel: 'n4', titulo: 'E-mail e agenda de trabalho', icone: '📅',
    licoes: [
      {
        id: 'n4-ag-compromisso', titulo: 'Agenda: marcar compromissos', icone: '📅',
        descricao: 'Reunião com dia, hora, local e lembrete.',
        passos: [
          info('No trabalho, ninguém guarda tudo de cabeça. A AGENDA anota os compromissos e LEMBRA antes da hora (como no Outlook e no Google Agenda).', { emoji: '📅' }),
          abrir('agenda', 'Agenda'),
          esperar('Clique em um dia da semana que vem no calendário.', 'agenda:dia', null, { destacar: ag('.ag-dia:not(.vazio)'), mouse: 'esquerdo' }),
          esperar('Clique em "➕ Novo compromisso". Escreva  Reunião com o fornecedor , hora  14:00 , local  Sala 2 , lembrete "15 minutos antes" e Salvar.', 'agenda:compromisso', (d) => /reuni/i.test(d.titulo) && d.hora && d.lembrete, {
            destacar: ag('[data-acao="novo-compromisso"]'), mouse: 'esquerdo',
          }),
          info('Pronto! O dia ganhou uma marquinha laranja e o compromisso aparece em "Próximos compromissos". No dia, a agenda avisa 15 minutos antes.'),
          quiz('Para não esquecer uma reunião, eu...', ['Marco na agenda com lembrete', 'Tento lembrar de cabeça'], 0),
        ],
        conclusao: 'Nunca mais perca um compromisso! 📅',
      },
      {
        id: 'n4-ag-contatos', titulo: 'Contatos', icone: '👥',
        descricao: 'Guardar nome, telefone e e-mail das pessoas do trabalho.',
        passos: [
          info('Os CONTATOS guardam o nome, o telefone e o e-mail de clientes e fornecedores. Assim, você acha qualquer pessoa em segundos.', { emoji: '👥' }),
          abrir('agenda', 'Agenda'),
          esperar('Clique na aba "👥 Contatos".', 'agenda:aba', (d) => d.aba === 'contatos', { destacar: ag('[data-aba="contatos"]'), mouse: 'esquerdo', jaFeito: () => !!document.querySelector('.janela[data-app="agenda"] [data-aba="contatos"].ativa') }),
          esperar('Clique em "➕ Novo contato" e cadastre: nome  Professor Virtual , telefone  (69) 3222-0000 , e-mail  professor@correio.escola . Salvar.', 'agenda:contato', (d) => d.email === 'professor@correio.escola', {
            destacar: ag('[data-acao="novo-contato"]'), mouse: 'esquerdo',
          }),
          esperar('Agora clique em "✉️ E-mail" no contato do Professor: o programa de e-mail abre com o endereço já preenchido.', 'agenda:escrever', (d) => d.email === 'professor@correio.escola', { destacar: ag('[data-escrever-contato="Professor Virtual"]'), mouse: 'esquerdo' }),
          quiz('Nos contatos eu guardo...', ['Nome, telefone e e-mail das pessoas', 'As minhas senhas'], 0),
        ],
        conclusao: 'Sua lista de contatos de trabalho está começando! 👥',
      },
      {
        id: 'n4-em-assinatura', titulo: 'Assinatura de e-mail', icone: '✍️',
        descricao: 'Nome, cargo e telefone no fim de cada e-mail, sozinhos.',
        passos: [
          info('Todo e-mail de trabalho termina com a ASSINATURA: nome, cargo, empresa e telefone. Você configura uma vez e ela entra sozinha em todos os e-mails.', { emoji: '✍️' }),
          abrir('email', 'E-mail'),
          esperar('Clique em "✍️ Assinatura" (no menu da esquerda) e escreva em 3 linhas: o seu nome, um cargo (ex.: Auxiliar administrativo) e um telefone. Salvar.', 'email:assinatura', (d) => d.linhas >= 2, {
            destacar: em('[data-acao="assinatura"]'), mouse: 'esquerdo', dica: 'Use Enter para mudar de linha dentro da caixa.',
          }),
          esperar('Agora clique em "✏️ Escrever": a assinatura já está lá embaixo! Mande um e-mail para  professor@correio.escola  com o assunto  Teste de assinatura .', 'email:enviado', (d) => d.para === 'professor@correio.escola' && d.assinatura, {
            destacar: em('[data-acao="escrever"]'), mouse: 'esquerdo', dica: 'Escreva a mensagem ANTES da assinatura (no começo da caixa).',
          }),
          quiz('A assinatura de e-mail de trabalho tem...', ['Nome, cargo, empresa e telefone', 'Um desenho grande e colorido', 'A minha senha'], 0),
        ],
        conclusao: 'E-mails com cara de profissional! ✍️',
      },
      {
        id: 'n4-em-pastas', titulo: 'Organizar o e-mail em pastas', icone: '📁',
        descricao: 'Criar pastas e mover mensagens.',
        passos: [
          info('Caixa de entrada com 500 mensagens? Ninguém acha nada! Crie PASTAS (Trabalho, Clientes, Contas) e guarde cada mensagem no lugar certo.', { emoji: '📁' }),
          abrir('email', 'E-mail'),
          esperar('Clique em "➕ Nova pasta" e crie a pasta  Trabalho .', 'email:pasta-criada', (d) => /trabalho/i.test(d.nome), { destacar: em('[data-acao="nova-pasta"]'), mouse: 'esquerdo' }),
          esperar('Agora abra uma mensagem da Caixa de entrada e use "📁 Mover para..." para colocar ela na pasta Trabalho. (Ou clique com o botão direito na mensagem › Mover para.)', 'email:movido-pasta', (d) => /trabalho/i.test(d.pasta), {
            destacar: [em('[data-acao="mover-para"]'), em('[data-pasta="entrada"]')], mouse: 'esquerdo',
          }),
          quiz('Pastas no e-mail servem para...', ['Organizar as mensagens por assunto', 'Mandar e-mail mais rápido'], 0),
        ],
        conclusao: 'Caixa de entrada organizada! 📁',
      },
      {
        id: 'n4-ag-desafio', titulo: 'Desafio: secretário(a) do escritório', icone: '🏅', desafio: true,
        descricao: 'Agenda, contato e e-mail sozinho.',
        passos: [
          info('Desafio! Você é o(a) secretário(a) do escritório. Clique em "Continuar".'),
          esperar('Na Agenda, cadastre o contato  Fornecedor ABC  com o e-mail  vendas@abc.com.br .', 'agenda:contato', (d) => /abc/i.test(d.nome) && /@/.test(d.email)),
          esperar('Marque o compromisso  Entrega de material , com hora e lembrete, convidando o Fornecedor ABC.', 'agenda:compromisso', (d) => d.hora && d.lembrete && /abc/i.test(d.convidado)),
          esperar('Mande um e-mail (com a sua assinatura) para o professor@correio.escola avisando da entrega.', 'email:enviado', (d) => d.para === 'professor@correio.escola' && d.assinatura),
        ],
        conclusao: 'Desafio vencido! Escritório organizado. 📅',
      },
    ],
  });

  // ======================= 🔧 Hardware e manutenção básica =======================
  CE.adicionarModulo({
    id: 'n4-hardware', nivel: 'n4', titulo: 'Hardware e manutenção básica', icone: '🔧',
    licoes: [
      {
        id: 'n4-hw-dentro', titulo: 'O computador por dentro', icone: '🔧',
        descricao: 'Placa-mãe, processador, memória, SSD e fonte.',
        passos: [
          info('Lá no começo do curso você conheceu o computador POR FORA. Agora vamos abrir o gabinete e ver as peças de DENTRO. (No computador de verdade, só com ele desligado da tomada e com o responsável.)', { emoji: '🔧' }),
          abrirComputador('dentro'),
          irTela('dentro', '🔧 Por dentro'),
          esperar('Clique em cada uma das 7 peças de dentro para descobrir o que ela faz.', 'peca:interna', (d) => d.todas, { destacar: pc('[data-interna]:not(.escolhida)'), mouse: 'esquerdo' }),
          quiz('Qual peça guarda os arquivos mesmo com o computador desligado?', ['O SSD (ou HD)', 'A memória RAM', 'O cooler'], 0),
          quiz('O computador fica lento com muitos programas abertos porque falta...', ['Memória RAM', 'Papel na impressora', 'Cooler'], 0),
          quiz('O "cérebro" que faz as contas é o...', ['Processador', 'Monitor', 'Mouse'], 0),
        ],
        conclusao: 'Agora você sabe o que tem dentro da caixa! 🔧',
      },
      {
        id: 'n4-hw-limpeza', titulo: 'Manutenção e limpeza', icone: '🧹',
        descricao: 'Cuidados para o computador durar muitos anos.',
        passos: [
          info('Um computador bem cuidado dura muitos anos. Poeira, líquido e queda de energia são os maiores inimigos. Vamos ver os cuidados do dia a dia.', { emoji: '🧹' }),
          abrirComputador('manutencao'),
          irTela('manutencao', '🧹 Manutenção'),
          esperar('Leia cada cuidado e marque a caixinha quando entender. Marque todos os 9.', 'manutencao:item', (d) => d.todos, { destacar: pc('.pc-check input:not(:checked)'), mouse: 'esquerdo' }),
          quiz('Para limpar a tela, eu uso...', ['Pano macio e seco', 'Álcool e esponja', 'Água com sabão escorrendo'], 0),
          quiz('Antes de limpar o computador, eu...', ['Desligo e tiro da tomada', 'Deixo ligado para ver se limpou'], 0),
          quiz('O estabilizador ou nobreak protege contra...', ['Queda e pico de energia', 'Vírus', 'Poeira'], 0),
        ],
        conclusao: 'Computador limpo e protegido dura muito mais! 🧹',
      },
      {
        id: 'n4-hw-problemas', titulo: 'Resolver problemas comuns', icone: '🩺',
        descricao: 'O que fazer antes de chamar o técnico.',
        passos: [
          info('Muitos "defeitos" se resolvem em 1 minuto: um cabo solto, um programa travado, o modo avião ligado. Vamos treinar o que fazer PRIMEIRO.', { emoji: '🩺' }),
          abrirComputador('problemas'),
          irTela('problemas', '🩺 Problemas comuns'),
          esperar('Para cada problema, escolha a melhor resposta. Acerte os 6.', 'problema:resposta', (d) => d.todos, { destacar: pc('.pc-problema'), dica: 'Comece sempre pelo mais simples: cabos, botões, reiniciar.' }),
          quiz('Antes de chamar o técnico, eu...', ['Tento o mais simples: cabos, botões e reiniciar', 'Abro o gabinete e troco as peças'], 0),
        ],
        conclusao: 'Você é o "técnico de primeira ajuda" do escritório! 🩺',
      },
      {
        id: 'n4-hw-desafio', titulo: 'Desafio do hardware', icone: '🏅', desafio: true,
        descricao: 'Perguntas sobre peças, manutenção e problemas.',
        passos: [
          info('Desafio! Responda sem ajuda. Clique em "Continuar".'),
          quiz('A memória RAM...', ['Guarda o que está aberto agora e se apaga ao desligar', 'Guarda os arquivos para sempre'], 0),
          quiz('O cooler serve para...', ['Esfriar o processador', 'Guardar arquivos'], 0),
          quiz('O computador desliga sozinho e está muito quente. Provável causa:', ['Poeira no cooler', 'Pouca tinta na impressora'], 0),
          quiz('A internet caiu para todos do escritório. Primeiro eu...', ['Reinicio o roteador (desligo, espero 30 segundos e ligo)', 'Formato o computador'], 0),
          quiz('Derrubei café no teclado. Eu...', ['Desligo, viro o teclado e aviso o responsável', 'Continuo digitando'], 0),
        ],
        conclusao: 'Desafio vencido! 🔧',
      },
    ],
  });

  // ======================= 🏆 Projeto final e prova =======================
  CE.adicionarModulo({
    id: 'n4-projeto', nivel: 'n4', titulo: 'Projeto final: um dia no escritório', icone: '💼',
    licoes: [
      {
        id: 'n4-pj-escritorio', titulo: 'Projeto: um dia no escritório', icone: '💼',
        descricao: 'Resumo de vendas, reunião, apresentação e nuvem.',
        passos: [
          info('PROJETO FINAL! Hoje você é o(a) assistente administrativo(a) da Loja Bom Preço. O chefe pediu: 1) o resumo das vendas, 2) marcar a reunião, 3) a apresentação dos resultados e 4) mandar tudo pela nuvem. Vamos lá!', {
            emoji: '💼', preparar: () => abrirExemplo('Vendas da semana', 'planilha', planilhaDe(VENDAS), true),
          }),
          esperar('1) Na planilha "Vendas da semana", faça uma tabela dinâmica com a SOMA dos valores por VENDEDOR.', 'planilha:dinamica', (d) => d.agrupar === 'B' && d.operacao === 'soma', { destacar: pl('[data-comando="dinamica"]') }),
          salvarPl('Vendas da semana'),
          esperar('2) Na Agenda, marque  Reunião de resultados  para amanhã, com hora e lembrete.', 'agenda:compromisso', (d) => /resultado/i.test(d.titulo) && d.hora && d.lembrete, { preparar: () => CE.janelas.abrir('agenda') }),
          esperar('3) Nas Apresentações, faça uma apresentação NOVA com 2 slides ou mais (título e os resultados), com anotações em algum slide.', ['apresentacao:notas', 'apresentacao:texto', 'apresentacao:slide-novo'], () => slides().length >= 2 && slides().every((s) => s.tituloTexto) && slides().some((s) => (s.notas || '').trim().length >= 5), {
            preparar: () => CE.janelas.abrir('apresentacoes'), dica: 'As anotações ficam na caixa embaixo do slide.',
          }),
          esperar('Coloque o rodapé  Loja Bom Preço  pelo Slide mestre.', 'apresentacao:mestre', (d) => /bom pre/i.test(d.rodape || ''), { destacar: ap('[data-comando="mestre"]') }),
          salvarAp('Resultados da semana'),
          esperar('4) Abra a Nuvem, envie a apresentação "Resultados da semana" e compartilhe com  chefe@empresaboa.com.br  (só pode ver).', 'nuvem:compartilhado', (d) => /resultados/i.test(d.nome) && d.permissao === 'ver', { preparar: () => CE.janelas.abrir('nuvem') }),
          quiz('No projeto, onde você fez o resumo das vendas por vendedor?', ['Tabela dinâmica na Planilha', 'No Desenho', 'Na Calculadora'], 0),
        ],
        conclusao: 'PROJETO CONCLUÍDO! 💼 Planilha, agenda, apresentação e nuvem juntos: um dia de trabalho de verdade.',
      },
    ],
  });

  CE.adicionarModulo({
    id: 'n4-prova', nivel: 'n4', titulo: 'Prova do nível Profissional', icone: '🏆',
    licoes: [
      {
        id: 'prova-n4', titulo: 'Prova do nível Profissional', icone: '🏆', prova: true, desafio: true,
        descricao: 'Tarefas práticas e perguntas de todo o nível. Precisa de 70% para passar.',
        passos: [
          info('Chegou a PROVA do nível Profissional! Faça as tarefas sozinho e responda às perguntas. Precisa de 70% para passar. Boa sorte! Clique em "Continuar".', { emoji: '🏆', preparar: () => travar('calculadora') }),
          esperar('Tarefa 1: a Calculadora travou. Feche ela do jeito certo.', 'tarefa:finalizada', (d) => d.app === 'calculadora', { preparar: () => travar('calculadora') }),
          esperar('Tarefa 2: abra qualquer planilha e congele a 1ª linha.', 'planilha:congelada', (d) => d.linhas >= 1),
          esperar('Tarefa 3: no Editor, coloque uma nota de rodapé num texto.', 'editor:formatado', (d) => d.comando === 'notaRodape'),
          esperar('Tarefa 4: na Agenda, marque um compromisso com lembrete.', 'agenda:compromisso', (d) => d.lembrete),
          esperar('Tarefa 5: compartilhe um arquivo da Nuvem.', 'nuvem:compartilhado'),
          quiz('Qual atalho abre o Gerenciador de Tarefas?', ['Ctrl + Shift + Esc', 'Ctrl + P', 'Alt + Tab'], 0),
          quiz('Conta de usuário que pode instalar programas é a...', ['Administrador', 'Padrão', 'Visitante'], 0),
          quiz('Em Wi‑Fi aberto (sem senha), eu...', ['Não acesso banco nem digito senhas', 'Faço tudo normalmente'], 0),
          quiz('Para mandar a mesma carta com o nome de cada cliente, uso...', ['Mala direta', 'Nota de rodapé', 'Sumário'], 0),
          quiz('Para fazer um resumo da tabela por categoria, uso...', ['Tabela dinâmica', 'Congelar painéis', 'Formas'], 0),
          quiz('Para a célula aceitar só "Pago" ou "Pendente", uso...', ['Validação de dados', 'Proteger planilha', 'Gráfico'], 0),
          quiz('O que aparece em TODOS os slides vai no...', ['Slide mestre', 'Modo apresentador', 'Slide 1'], 0),
          quiz('As anotações do apresentador...', ['Só eu vejo', 'O público vê'], 0),
          quiz('Qual peça guarda os arquivos com o computador desligado?', ['SSD ou HD', 'Memória RAM'], 0),
          quiz('Para limpar a tela do computador, uso...', ['Pano macio e seco', 'Álcool'], 0),
        ],
        conclusao: 'PARABÉNS! Você passou na prova do nível Profissional! 🏆 Agora você tem a informática que as empresas pedem: pode colocar no currículo com orgulho.',
      },
    ],
  });
})();
