// Curso livre 📱 Celular no dia a dia (abre depois do nível Iniciante): usar o smartphone com segurança.
// O celular é o programa "Celular" (app/js/apps/celular.js). As aulas disparam cenários: mensagens, SMS e ligações
// chegam como na vida real (CE.celular.cenario(...)).
(function () {
  const { info, quiz, esperar, abrir, naJanela, pularSe } = CE.L;
  const cel = (s) => naJanela('celular', s);
  const PIN = '7391', SENHA_BANCO = '4826';
  const telaAtual = () => { const t = document.querySelector('.janela[data-app="celular"] .cel-tela'); return t ? t.dataset.tela : ''; };
  const est = () => CE.celular.estado() || {};
  const cenario = (nome, opcoes) => () => CE.celular.cenario(nome, opcoes);

  // Passos que se repetem em quase todas as aulas.
  const abrirCel = (extra = {}) => abrir('celular', 'Celular', extra);
  const desbloquear = () => esperar(`Desbloqueie o celular: toque na tela. Se ele pedir o PIN, digite ${PIN}.`, 'celular:desbloqueado', null, {
    destacar: [cel('[data-acao="cel-desbloquear"]'), cel('[data-tecla]')], mouse: 'esquerdo', jaFeito: () => CE.janelas.estaAberta('celular') && !CE.celular.bloqueado(),
    dica: `No celular, tocar na tela é o mesmo que clicar. O PIN de treino deste curso é ${PIN}.`,
  });
  const irApp = (app, nome) => esperar(`Toque no ícone "${nome}". Se não estiver na tela inicial, toque antes no botão redondo ⬤, embaixo do celular.`, 'celular:app', (d) => d.app === app, {
    destacar: [cel(`[data-cel-app="${app}"]`), cel('[data-acao="cel-inicio"]')], mouse: 'esquerdo', jaFeito: () => telaAtual() === app,
  });
  const irConversa = (id, nome) => esperar(`Toque na conversa "${nome}".`, 'celular:conversa', (d) => d.conversa === id, {
    destacar: [cel(`[data-conversa="${id}"]`), cel('[data-notificacao]'), cel('[data-cel-app="mensagens"]'), cel('[data-acao="cel-inicio"]')], mouse: 'esquerdo',
    jaFeito: () => telaAtual() === 'conversa' && !!document.querySelector(`.janela[data-app="celular"] .cel-app-topo b`) && document.querySelector('.janela[data-app="celular"] .cel-app-topo b').textContent.includes(CE.celular.CONTATOS[id].nome),
  });
  const ajuste = (parte, nome) => esperar(`Nos Ajustes ⚙️, toque em "${nome}".`, 'celular:ajuste', (d) => d.parte === parte, {
    destacar: [cel(`[data-ajuste="${parte}"]`), cel('[data-cel-app="ajustes"]'), cel('[data-acao="cel-inicio"]')], mouse: 'esquerdo',
  });
  const banco = (parte, nome) => esperar(`No app do banco, toque em "${nome}".`, 'celular:banco', (d) => d.parte === parte, {
    destacar: [cel(`[data-banco="${parte}"]`), cel('[data-acao="banco-entrar"]'), cel('[data-cel-app="banco"]'), cel('[data-acao="cel-inicio"]')], mouse: 'esquerdo',
    dica: `Se o banco pedir a senha do app, ela é ${SENHA_BANCO}.`,
  });
  const entrarBanco = () => esperar(`Entre no app do banco com a senha ${SENHA_BANCO} (se for a primeira vez, crie essa senha).`, ['celular:banco-entrou', 'celular:banco-senha'], (d) => d.ok !== false, {
    destacar: [cel('[data-campo="banco-senha"]'), cel('[data-campo="banco-senha-nova"]')], jaFeito: () => !!document.querySelector('.janela[data-app="celular"] [data-banco]'),
  });

  CE.adicionarModulo({
    id: 'cel-basico', nivel: 'cel', titulo: 'Conhecendo o celular', icone: '📱',
    licoes: [
      {
        id: 'cel-conhecer', titulo: 'Ligar a tela, desbloquear e abrir apps', icone: '📱',
        descricao: 'A tela de toque, os botões e os aplicativos.',
        passos: [
          info('Bem-vindo ao curso livre CELULAR NO DIA A DIA! O celular é um computador de bolso. Aqui no treino, o celular aparece numa janela e, onde no celular você TOCA com o dedo, aqui você CLICA com o mouse. Clique em "Continuar".', { emoji: '📱' }),
          abrirCel(),
          desbloquear(),
          info('Esta é a TELA INICIAL. Cada quadradinho é um aplicativo (app): Zap (mensagens), Telefone, Banco, Câmera... Embaixo ficam 3 botões: ◀ volta, ⬤ vai para a tela inicial e ⏻ bloqueia a tela.'),
          irApp('mensagens', 'Zap'),
          esperar('Você está no Zap, o app de mensagens. Agora toque no botão redondo ⬤, embaixo do celular, para voltar à tela inicial.', 'celular:inicio', null, { destacar: cel('[data-acao="cel-inicio"]'), mouse: 'esquerdo' }),
          irApp('camera', 'Câmera'),
          esperar('Toque no ◀ (embaixo, à esquerda) para voltar.', 'celular:voltar', null, { destacar: cel('[data-acao="cel-voltar"]'), mouse: 'esquerdo' }),
          quiz('No celular, para voltar à tela inicial de qualquer lugar, eu toco em...', ['⬤ (botão do meio)', '⏻ (desligar)', 'Na câmera'], 0),
          quiz('Tocar com o dedo na tela do celular é como...', ['Clicar com o mouse', 'Apertar o Enter', 'Desligar'], 0),
        ],
        conclusao: 'Você já sabe andar pelo celular! 📱',
      },
      {
        id: 'cel-ajustes', titulo: 'Letra maior, brilho e modo avião', icone: '🔤',
        descricao: 'Deixar o celular mais fácil de ler e usar.',
        passos: [
          info('Letra pequena demais? Dá para AUMENTAR a letra do celular inteiro. E o modo avião desliga as conexões (bom no avião, no hospital ou para economizar bateria).', { emoji: '🔤' }),
          abrirCel(), desbloquear(),
          irApp('ajustes', 'Ajustes'),
          ajuste('tela', 'Tela e letra'),
          esperar('Toque no "A" maior (letra grande). Veja a letra do celular crescer!', 'celular:letra', (d) => d.tamanho === 'grande', { destacar: cel('[data-letra="grande"]'), mouse: 'esquerdo', ...pularSe(async () => (await CE.celular.garantir()) && est().letra === 'grande') }),
          esperar('Agora volte (◀) e entre em "Wi‑Fi e rede". Ligue o "✈️ Modo avião".', 'celular:aviao', (d) => d.ligado, { destacar: [cel('[data-campo="cel-aviao"]'), cel('[data-ajuste="rede"]'), cel('[data-acao="cel-voltar"]')], mouse: 'esquerdo' }),
          esperar('Veja no alto da tela: apareceu o aviãozinho ✈️ e o Wi‑Fi sumiu. Desligue o modo avião de novo.', 'celular:aviao', (d) => !d.ligado, { destacar: cel('[data-campo="cel-aviao"]'), mouse: 'esquerdo' }),
          quiz('No modo avião, o celular...', ['Fica sem Wi‑Fi e sem ligações', 'Fica mais rápido na internet', 'Apaga as fotos'], 0),
        ],
        conclusao: 'Celular do jeito que é melhor para você!',
      },
      {
        id: 'cel-bloqueio', titulo: 'Senha de bloqueio (PIN)', icone: '🔒',
        descricao: 'Ninguém mexe no seu celular sem a senha.',
        passos: [
          info(`Celular sem senha de bloqueio é como casa sem tranca: quem pegar entra no Zap, no banco, nas fotos... Vamos criar um PIN (senha de números). No treino, use ${PIN}.`, { emoji: '🔒' }),
          abrirCel(), desbloquear(),
          irApp('ajustes', 'Ajustes'),
          ajuste('seguranca', 'Bloqueio de tela'),
          esperar(`Escreva o PIN ${PIN} e toque em "Criar PIN".`, 'celular:pin', (d) => d.definido, { destacar: cel('[data-campo="pin-novo"]'), ...pularSe(async () => !!(await CE.celular.garantir()).pin) }),
          esperar('Agora teste: toque em "⏻ Bloquear agora para testar" (ou no ⏻ embaixo do celular).', 'celular:bloqueou', null, { destacar: [cel('[data-acao="bloquear-agora"]'), cel('[data-acao="cel-energia"]')], mouse: 'esquerdo' }),
          esperar(`Desbloqueie digitando o PIN ${PIN}.`, 'celular:desbloqueado', (d) => d.comPin, { destacar: [cel('[data-acao="cel-desbloquear"]'), cel('[data-tecla]')], mouse: 'esquerdo' }),
          quiz('Um bom PIN é...', ['Números que só eu sei, sem sequência', '1234', 'O ano do meu nascimento'], 0),
          quiz('Vou deixar o celular carregando no trabalho. Antes, eu...', ['Bloqueio a tela', 'Deixo desbloqueado para não esquecer a senha'], 0),
        ],
        conclusao: 'Celular trancado! 🔒',
      },
    ],
  });

  CE.adicionarModulo({
    id: 'cel-mensagens', nivel: 'cel', titulo: 'Mensagens e fotos', icone: '💬',
    licoes: [
      {
        id: 'cel-zap', titulo: 'Conversar no Zap: texto e áudio', icone: '💬',
        descricao: 'Mandar mensagem escrita e de voz.',
        passos: [
          info('O Zap (parecido com o WhatsApp) manda mensagens escritas, de voz (áudio), fotos... A sua filha Maria mandou um "oi". Vamos responder!', { emoji: '💬', preparar: cenario('boas-vindas') }),
          abrirCel(), desbloquear(),
          irApp('mensagens', 'Zap'),
          irConversa('maria', 'Maria (filha)'),
          esperar('Toque na caixa "Mensagem", escreva uma resposta (ex.: Oi, filha! Tudo bem, e você?) e toque na setinha verde ➤ para enviar.', 'celular:mensagem-enviada', (d) => d.conversa === 'maria' && d.texto.length >= 2, { destacar: cel('[data-campo="cel-mensagem"]'), mouse: 'esquerdo' }),
          esperar('Agora mande um ÁUDIO: toque no microfone 🎤.', 'celular:mensagem-enviada', (d) => d.conversa === 'maria' && d.audio, { destacar: cel('[data-acao="cel-audio"]'), mouse: 'esquerdo' }),
          info('Os dois tracinhos ✓✓ do lado da hora mostram que a mensagem chegou. Repare: a Maria respondeu!'),
          quiz('Para enviar a mensagem escrita, eu toco em...', ['➤ (a setinha verde)', '📎 (o clipe)', '⏻'], 0),
        ],
        conclusao: 'Conversa em dia! 💬',
      },
      {
        id: 'cel-foto', titulo: 'Tirar foto e mandar (e passar para o computador)', icone: '📷',
        descricao: 'Câmera, galeria, compartilhar e enviar para o computador.',
        passos: [
          info('A Maria pediu uma foto do bolo! Vamos usar a Câmera, achar a foto na Galeria e mandar pelo Zap.', { emoji: '📷', preparar: cenario('foto') }),
          abrirCel(), desbloquear(),
          irApp('camera', 'Câmera'),
          esperar('A câmera está apontando para o bolo 🎂 (se não estiver, use ◀ ▶). Toque no botão redondo branco para tirar a foto.', 'celular:foto', (d) => d.cena === 'bolo', { destacar: cel('[data-acao="cel-fotografar"]'), mouse: 'esquerdo', dica: 'As setinhas ◀ ▶ do lado do botão apontam a câmera para outras coisas.' }),
          irApp('galeria', 'Galeria'),
          esperar('Toque na foto do bolo (a primeira da Galeria).', 'celular:foto-aberta', (d) => d.cena === 'bolo', {
            destacar: cel('[data-foto="bolo"]'), mouse: 'esquerdo', jaFeito: () => telaAtual() === 'foto',
          }),
          esperar('Toque em "➤ Compartilhar" e escolha "Maria (filha)".', 'celular:mensagem-enviada', (d) => d.conversa === 'maria' && d.foto === 'bolo', { destacar: [cel('[data-folha="compartilhar-maria"]'), cel('[data-acao="foto-compartilhar"]'), cel('[data-foto="bolo"]')], mouse: 'esquerdo' }),
          info('Foto enviada! E para guardar a foto no COMPUTADOR (para imprimir ou mandar por e-mail)? Volte para a Galeria e abra a foto de novo.'),
          esperar('Na Galeria, abra a foto do bolo e toque em "💻 Para o computador".', 'celular:foto-computador', (d) => d.cena === 'bolo', { destacar: [cel('[data-acao="foto-computador"]'), cel('[data-foto="bolo"]'), cel('[data-cel-app="galeria"]'), cel('[data-acao="cel-inicio"]')], mouse: 'esquerdo' }),
          info('A foto foi para Meus Documentos › "Fotos do celular". No celular de verdade, você liga o cabo USB no computador (ou manda pela nuvem) para fazer isso.'),
          quiz('As fotos que eu tiro ficam guardadas na...', ['Galeria', 'Calculadora', 'Loja'], 0),
        ],
        conclusao: 'Foto tirada, enviada e guardada no computador! 📸',
      },
      {
        id: 'cel-boato', titulo: 'Corrente e notícia falsa no grupo', icone: '🔎',
        descricao: 'Checar antes de encaminhar.',
        passos: [
          info('Chegou uma mensagem ALARMANTE no grupo da Família. Antes de encaminhar qualquer corrente, a gente CHECA se é verdade.', { emoji: '🔎', preparar: cenario('boato') }),
          abrirCel(), desbloquear(),
          irApp('mensagens', 'Zap'),
          irConversa('familia', 'Família'),
          esperar('Toque na mensagem da Tia Rosa (a que fala que o Zap vai cobrar) e escolha "🔎 Pesquisar se é verdade".', 'celular:checou', (d) => d.boato, { destacar: [cel('[data-folha="checar"]'), cel('.cel-balao[data-msg-texto^="URGENTE"]')], mouse: 'esquerdo' }),
          esperar('A agência de checagem diz que é FALSO. Toque em "✅ Não encaminhar".', 'celular:nao-encaminhou', null, { destacar: cel('[data-folha="nao-encaminhar"]'), mouse: 'esquerdo' }),
          info('Agora, se quiser, responda no grupo com carinho, por exemplo: "Tia, pesquisei e isso é falso 😉". Assim ninguém mais cai.'),
          quiz('Mensagem com "URGENTE!!! Compartilhe com 10 grupos"...', ['Costuma ser falsa: pesquiso antes', 'Encaminho para todo mundo'], 0),
        ],
        conclusao: 'Você parou uma notícia falsa! 🔎',
      },
    ],
  });

  CE.adicionarModulo({
    id: 'cel-dinheiro', nivel: 'cel', titulo: 'Banco e Pix no celular', icone: '💰',
    licoes: [
      {
        id: 'cel-banco', titulo: 'O app do banco com segurança', icone: '🏦',
        descricao: 'Senha do app, saldo, extrato e limite do Pix à noite.',
        passos: [
          info(`O app do banco faz quase tudo: ver o saldo, o extrato, pagar e fazer Pix. Primeiro, crie a senha do app. No treino, use ${SENHA_BANCO}. (Nunca 1234, 0000 ou a data do aniversário!)`, { emoji: '🏦' }),
          abrirCel(), desbloquear(),
          irApp('banco', 'Banco'),
          entrarBanco(),
          banco('extrato', '📄 Extrato'),
          info('O EXTRATO mostra tudo o que entrou e saiu da conta. Confira sempre: se tiver algo que você não fez, avise o banco na hora.'),
          esperar('Volte (←) e toque em "🛡️ Limites". Escolha "Até R$ 200,00 à noite".', 'celular:limite', (d) => d.valor === 200, {
            destacar: [cel('[data-limite="200"]'), cel('[data-banco="limites"]'), cel('[data-acao="cel-voltar-topo"]')], mouse: 'esquerdo', ...pularSe(async () => (await CE.celular.garantir()).banco.limiteNoite === 200),
          }),
          quiz('Por que deixar o limite do Pix BAIXO à noite?', ['Se o celular for roubado ou eu cair num golpe, perco menos', 'Para o banco cobrar menos', 'Não faz diferença'], 0),
          quiz('A senha do app do banco...', ['Não conto para ninguém, nem para o "funcionário do banco"', 'Posso passar se o banco ligar'], 0),
        ],
        conclusao: 'App do banco protegido! 🏦',
      },
      {
        id: 'cel-pix', titulo: 'Fazer um Pix conferindo o nome', icone: '💠',
        descricao: 'Chave, valor, conferir quem recebe e comprovante.',
        passos: [
          info('Vamos mandar R$ 50,00 de Pix para a Maria. A REGRA DE OURO do Pix: antes de pagar, CONFIRA O NOME de quem vai receber.', { emoji: '💠' }),
          abrirCel(), desbloquear(),
          irApp('banco', 'Banco'),
          entrarBanco(),
          banco('pix', '💠 Pix'),
          esperar('Na chave Pix, escreva o celular da Maria: (69) 99876-5432. No valor, escreva 50. Toque em "Continuar".', 'celular:pix-chave', (d) => /maria/i.test(d.nome), { destacar: cel('[data-campo="pix-chave"]') }),
          esperar(`Confira: "Para: Maria Clara Souza". É ela! Digite a senha do app (${SENHA_BANCO}) e toque em "Pagar".`, 'celular:pix', (d) => /maria/i.test(d.nome) && d.valor === 50, { destacar: cel('[data-acao="pix-confirmar"]'), mouse: 'esquerdo' }),
          esperar('Pix feito! Toque em "🧾 Salvar o comprovante na galeria".', 'celular:comprovante', null, { destacar: cel('[data-acao="salvar-comprovante"]'), mouse: 'esquerdo' }),
          info('O comprovante é a prova do pagamento: guarde! Se precisar, mande a foto dele para a pessoa (pela Galeria › Compartilhar).'),
          quiz('Na tela de conferir o Pix, aparece um nome diferente de quem eu queria pagar. Eu...', ['Cancelo', 'Pago assim mesmo'], 0),
          quiz('O comprovante do Pix serve para...', ['Provar que eu paguei', 'Nada'], 0),
        ],
        conclusao: 'Pix feito do jeito certo! 💠',
      },
      {
        id: 'cel-qrcode', titulo: 'Pagar com QR Code', icone: '▚',
        descricao: 'Apontar a câmera para o QR Code e pagar.',
        passos: [
          info('Em muitas lojas, o Pix vem num QR CODE (aquele quadrado de pontinhos). O celular lê o código e já preenche a chave e o valor. Você só confere e paga.', { emoji: '▚' }),
          abrirCel(), desbloquear(),
          irApp('banco', 'Banco'),
          entrarBanco(),
          banco('qr', 'Pagar QR Code'),
          esperar('"Aponte" para o QR Code da Padaria Pão Quente (toque nele).', 'celular:qr-lido', (d) => d.qr === 'padaria', { destacar: cel('[data-qr="padaria"]'), mouse: 'esquerdo' }),
          esperar(`Confira: Padaria Pão Quente, R$ 23,50. Digite a senha (${SENHA_BANCO}) e pague.`, 'celular:pix', (d) => /padaria/i.test(d.nome), { destacar: cel('[data-acao="pix-confirmar"]'), mouse: 'esquerdo' }),
          quiz('Mesmo com QR Code, antes de pagar eu confiro...', ['O nome e o valor', 'Nada, o QR Code nunca erra'], 0),
        ],
        conclusao: 'Pagou sem digitar nada! ▚',
      },
    ],
  });

  CE.adicionarModulo({
    id: 'cel-golpes', nivel: 'cel', titulo: 'Golpes no celular', icone: '🕵️',
    licoes: [
      {
        id: 'cel-golpe-parente', titulo: 'Golpe do "troquei de número"', icone: '🎭',
        descricao: 'Alguém finge ser da família e pede dinheiro.',
        passos: [
          info('Um número desconhecido diz que é a sua filha, que trocou de número, e pede um Pix urgente. É o golpe mais comum do Brasil! Vamos ver como se proteger.', { emoji: '🎭', preparar: cenario('falso-parente', { repetir: true }) }),
          abrirCel(), desbloquear(),
          irApp('mensagens', 'Zap'),
          irConversa('golpista', '+55 11 98888-1234'),
          info('Repare nos sinais: número desconhecido, PRESSA ("urgente") e pedido de DINHEIRO. A regra é: antes de qualquer coisa, ligue para o número ANTIGO da pessoa.'),
          esperar('Vá para a tela inicial (⬤), abra o Telefone, toque em "👥 Contatos" e ligue para "Maria (filha)".', 'celular:ligou', (d) => d.contato === 'maria', {
            destacar: [cel('[data-contato-tel="maria"]'), cel('[data-aba-tel="contatos"]'), cel('[data-cel-app="telefone"]'), cel('[data-acao="cel-inicio"]')], mouse: 'esquerdo',
          }),
          esperar('Ouça a Maria e toque em "📵 Desligar".', 'celular:ligacao', (d) => d.roteiro === 'maria', { destacar: cel('[data-opcao-ligacao="desligar"]'), mouse: 'esquerdo' }),
          esperar('Era golpe! Volte ao Zap, abra a conversa do número desconhecido e toque em "🚫 Bloquear e denunciar".', 'celular:golpe-evitado', (d) => d.tipo === 'falso-parente' && d.bloqueou, {
            destacar: [cel('[data-acao="cel-bloquear"]'), cel('[data-conversa="golpista"]'), cel('[data-cel-app="mensagens"]'), cel('[data-acao="cel-inicio"]')], mouse: 'esquerdo',
          }),
          quiz('Se eu tivesse ido fazer o Pix, na tela de conferir apareceria o nome "Pedro Henrique Lima". Isso mostra que...', ['O dinheiro ia para outra pessoa: é golpe', 'A Maria mudou de nome'], 0),
          quiz('Mensagem de número novo dizendo ser da família e pedindo dinheiro. Primeiro eu...', ['Ligo para o número antigo da pessoa', 'Faço o Pix rápido'], 0),
        ],
        conclusao: 'Golpe desmascarado! 🎭 Avise a família sobre esse golpe.',
      },
      {
        id: 'cel-golpe-central', titulo: 'Golpe da falsa central do banco', icone: '☎️',
        descricao: 'SMS de compra falsa e ligação pedindo a senha.',
        passos: [
          info('Agora vai chegar um SMS dizendo que houve uma compra no seu cartão... e logo depois uma LIGAÇÃO. Preste atenção! Clique em "Continuar".', { emoji: '☎️' }),
          abrirCel(), desbloquear(),
          esperar('Chegou o SMS e o celular está tocando! Toque em "📞" (verde) para atender.', 'celular:ligacao', (d) => d.roteiro === 'central-falsa' && d.acao === 'atendeu', {
            preparar: cenario('central-falsa', { repetir: true }), destacar: cel('[data-acao="cel-atender"]'), mouse: 'esquerdo', dica: 'A ligação chega uns 5 segundos depois do SMS.',
          }),
          esperar('Ele pede a SENHA e o CÓDIGO. O banco NUNCA pede isso! Toque em "📵 Desligar e ligar para o banco".', 'celular:ligacao', (d) => d.roteiro === 'central-falsa' && d.acao === 'desligou', { destacar: cel('[data-opcao-ligacao="desligar"]'), mouse: 'esquerdo' }),
          esperar('O número certo do banco está no VERSO do cartão. Abra o Banco › 💳 Cartão e veja o número da central.', 'celular:banco', (d) => d.parte === 'cartao', {
            destacar: [cel('[data-banco="cartao"]'), cel('[data-acao="banco-entrar"]'), cel('[data-cel-app="banco"]'), cel('[data-acao="cel-inicio"]')], mouse: 'esquerdo', dica: `A senha do app é ${SENHA_BANCO}.`,
          }),
          esperar(`Agora ligue VOCÊ para o banco: abra o Telefone e disque ${CE.celular.CENTRAL_OFICIAL} (ou Contatos › Banco Escola).`, 'celular:ligou', (d) => d.oficial, {
            destacar: [cel('[data-contato-tel="banco"]'), cel('[data-acao="cel-ligar"]'), cel('[data-cel-app="telefone"]'), cel('[data-acao="cel-inicio"]')], mouse: 'esquerdo',
          }),
          esperar('Ouça a central oficial e desligue.', 'celular:ligacao', (d) => d.roteiro === 'oficial', { destacar: cel('[data-opcao-ligacao="desligar"]'), mouse: 'esquerdo' }),
          quiz('Ligaram dizendo ser do banco e pediram a senha. Eu...', ['Desligo e ligo para o número do verso do cartão', 'Passo a senha para cancelar a compra'], 0),
          quiz('O número para ligar no banco eu pego...', ['No verso do cartão ou no app oficial', 'No SMS que chegou'], 0),
        ],
        conclusao: 'Você não caiu na falsa central! ☎️',
      },
      {
        id: 'cel-golpe-link', titulo: 'Links de prêmio e taxa falsa', icone: '🎁',
        descricao: 'Não clicar, bloquear e apagar.',
        passos: [
          info('"Você ganhou uma Air Fryer!", "Sua encomenda está retida, pague a taxa"... São links que levam a sites FALSOS que roubam os dados do cartão.', { emoji: '🎁', preparar: cenario('promocao', { repetir: true }) }),
          abrirCel(), desbloquear(),
          irApp('mensagens', 'Zap'),
          irConversa('promo', '+55 21 97777-0000'),
          esperar('NÃO toque no link! Toque em "🚫 Bloquear e denunciar".', 'celular:golpe-evitado', (d) => d.tipo === 'link' && d.bloqueou, { destacar: cel('[data-acao="cel-bloquear"]'), mouse: 'esquerdo' }),
          esperar('Chegou também um SMS dos "Correios". Abra o app SMS ✉️ e toque em "🗑️ Apagar (golpe)" nessa mensagem.', 'celular:sms-apagado', (d) => d.golpe === 'link', {
            destacar: [cel('[data-sms-de="Correios"] [data-acao="cel-apagar-sms"]'), cel('[data-cel-app="sms"]'), cel('[data-acao="cel-inicio"]')], mouse: 'esquerdo',
          }),
          quiz('Se eu tocar num link desses sem querer, eu...', ['Fecho a página e NÃO digito nada', 'Preencho os dados para ver o prêmio'], 0),
          quiz('Os Correios cobram taxa por SMS com link?', ['Não: é golpe', 'Sim'], 0),
        ],
        conclusao: 'Link falso bloqueado! 🎁',
      },
      {
        id: 'cel-codigo', titulo: 'Golpe do código e verificação em duas etapas', icone: '🔢',
        descricao: 'Nunca passar o código do SMS e proteger o Zap.',
        passos: [
          info('Os golpistas querem o CÓDIGO de 6 números que chega por SMS: com ele, eles roubam a sua conta do Zap e pedem dinheiro para os seus contatos. Atenção ao que vai chegar!', { emoji: '🔢', preparar: cenario('codigo', { repetir: true }) }),
          abrirCel(), desbloquear(),
          irApp('mensagens', 'Zap'),
          irConversa('rosa', 'Tia Rosa'),
          info('A "Tia Rosa" pediu o código. Mas será que é ela mesmo? A conta dela pode ter sido roubada. NÃO passe o código: ligue para ela.'),
          esperar('Abra o Telefone › 👥 Contatos e ligue para a Tia Rosa.', 'celular:ligou', (d) => d.contato === 'rosa', {
            destacar: [cel('[data-contato-tel="rosa"]'), cel('[data-aba-tel="contatos"]'), cel('[data-cel-app="telefone"]'), cel('[data-acao="cel-inicio"]')], mouse: 'esquerdo',
          }),
          esperar('Ouça a Tia Rosa e desligue.', 'celular:ligacao', (d) => d.roteiro === 'rosa', { destacar: cel('[data-opcao-ligacao="desligar"]'), mouse: 'esquerdo' }),
          esperar('Proteja o SEU Zap: Ajustes ⚙️ › "Zap: verificação em duas etapas". Crie um PIN de 6 números e toque em "Ativar".', 'celular:duas-etapas', (d) => d.ativada, {
            destacar: [cel('[data-campo="pin-zap"]'), cel('[data-ajuste="zap"]'), cel('[data-cel-app="ajustes"]'), cel('[data-acao="cel-inicio"]')], mouse: 'esquerdo', ...pularSe(async () => !!(await CE.celular.garantir()).duasEtapas),
          }),
          quiz('Alguém pede o código que chegou por SMS no meu celular. Eu...', ['Não passo para ninguém', 'Passo se for da família'], 0),
          quiz('A verificação em duas etapas do Zap...', ['Pede um PIN meu, além do código do SMS', 'Deixa o Zap mais lento'], 0),
        ],
        conclusao: 'Conta do Zap protegida! 🔢',
      },
    ],
  });

  CE.adicionarModulo({
    id: 'cel-apps', nivel: 'cel', titulo: 'Apps, permissões e atualizações', icone: '🛍️',
    licoes: [
      {
        id: 'cel-apps-seguros', titulo: 'Instalar apps com segurança', icone: '🛍️',
        descricao: 'Loja oficial, permissões e atualizações.',
        passos: [
          info('Instale apps só pela LOJA oficial. E olhe: quem fez, a nota, quantas pessoas baixaram e o que o app quer acessar. Uma lanterna NÃO precisa dos seus contatos!', { emoji: '🛍️' }),
          abrirCel(), desbloquear(),
          irApp('loja', 'Loja'),
          esperar('Toque em "Instalar" na "LANTERNA SUPER TURBO 2000" e leia o que ela quer acessar.', 'celular:instalar-pedido', (d) => d.app === 'lanterna-super', {
            destacar: cel('[data-loja-app="lanterna-super"] [data-acao="instalar"]'), mouse: 'esquerdo', jaFeito: () => !!document.querySelector('.janela[data-app="celular"] [data-instalar="lanterna-super"]'),
          }),
          esperar('Contatos, SMS, localização e microfone para uma lanterna?! Toque em "Cancelar".', 'celular:instalacao-cancelada', (d) => d.app === 'lanterna-super', { destacar: cel('[data-acao="cancelar-instalacao"]'), mouse: 'esquerdo' }),
          esperar('Agora instale a "Lanterna" do sistema (nota 4,6, só usa o flash): toque em "Instalar" e depois em "Instalar" de novo.', 'celular:instalado', (d) => d.app === 'lanterna', {
            destacar: [cel('[data-acao="confirmar-instalacao"]'), cel('[data-loja-app="lanterna"] [data-acao="instalar"]')], mouse: 'esquerdo', ...pularSe(async () => (await CE.celular.garantir()).apps.includes('lanterna')),
          }),
          esperar('Instale também o jogo "Fazendinha Feliz".', 'celular:instalado', (d) => d.app === 'jogo', {
            destacar: [cel('[data-acao="confirmar-instalacao"]'), cel('[data-loja-app="jogo"] [data-acao="instalar"]')], mouse: 'esquerdo', ...pularSe(async () => (await CE.celular.garantir()).apps.includes('jogo')),
          }),
          esperar('Abra o jogo pela tela inicial (⬤ e depois o ícone 🐔). Ele vai pedir acesso aos contatos e ao microfone: toque em "Não permitir" nos dois.', 'celular:permissao', (d) => d.app === 'jogo' && d.permissao === 'microfone' && !d.permitido, {
            destacar: [cel('[data-acao="cel-negar"]'), cel('[data-cel-app="jogo"]'), cel('[data-acao="cel-inicio"]')], mouse: 'esquerdo',
          }),
          esperar('Por último, mantenha o celular ATUALIZADO: Ajustes ⚙️ › "Atualização do sistema" › "Baixar e instalar".', 'celular:atualizado', null, {
            destacar: [cel('[data-acao="atualizar-celular"]'), cel('[data-ajuste="atualizacao"]'), cel('[data-cel-app="ajustes"]'), cel('[data-acao="cel-inicio"]')], mouse: 'esquerdo', ...pularSe(async () => !!(await CE.celular.garantir()).atualizado),
          }),
          quiz('Um app pede acesso a coisas que não têm nada a ver com ele. Eu...', ['Não permito (ou nem instalo)', 'Permito tudo para ele funcionar'], 0),
          quiz('Atualizar o celular serve para...', ['Corrigir falhas de segurança', 'Apagar as fotos'], 0),
        ],
        conclusao: 'Celular limpo e atualizado! 🛍️',
      },
      {
        id: 'cel-mapa', titulo: 'Mapas e localização', icone: '🗺️',
        descricao: 'Permitir a localização só enquanto usa.',
        passos: [
          info('Alguns apps PRECISAM da localização, como o Mapas, para mostrar o caminho. Para esses, escolha "Só enquanto usa o app".', { emoji: '🗺️' }),
          abrirCel(), desbloquear(),
          irApp('loja', 'Loja'),
          esperar('Instale o app "Mapas".', 'celular:instalado', (d) => d.app === 'mapas', {
            destacar: [cel('[data-acao="confirmar-instalacao"]'), cel('[data-loja-app="mapas"] [data-acao="instalar"]')], mouse: 'esquerdo', ...pularSe(async () => (await CE.celular.garantir()).apps.includes('mapas')),
          }),
          esperar('Abra o Mapas na tela inicial e, no pedido de localização, escolha "Só enquanto usa o app".', 'celular:permissao', (d) => d.app === 'mapas' && d.permitido, {
            destacar: [cel('[data-acao="cel-permitir"]'), cel('[data-cel-app="mapas"]'), cel('[data-acao="cel-inicio"]')], mouse: 'esquerdo',
          }),
          quiz('Para o Mapas, a localização é...', ['Necessária, só enquanto uso', 'Perigosa sempre'], 0),
        ],
        conclusao: 'Agora o mapa sabe onde você está, só quando você usa! 🗺️',
      },
    ],
  });

  CE.adicionarModulo({
    id: 'cel-final', nivel: 'cel', titulo: 'Desafio e prova do celular', icone: '🏆',
    licoes: [
      {
        id: 'cel-desafio', titulo: 'Desafio do celular', icone: '🏅', desafio: true,
        descricao: 'Usar o celular sozinho, do começo ao fim.',
        passos: [
          info('Desafio! Faça tudo sozinho no celular. Clique em "Continuar".', { preparar: cenario('chefe') }),
          esperar('Responda a mensagem do Sr. Carlos (trabalho), confirmando a reunião.', 'celular:mensagem-enviada', (d) => d.conversa === 'carlos' && d.texto.length >= 2),
          esperar('Tire uma foto da flor 🌻 e mande para o grupo da Família.', 'celular:mensagem-enviada', (d) => d.conversa === 'familia' && d.foto === 'flor'),
          esperar('Faça um Pix de R$ 10,00 para a Maria (chave: o celular dela).', 'celular:pix', (d) => /maria/i.test(d.nome) && d.valor === 10),
          esperar('Bloqueie a tela e desbloqueie com o PIN.', 'celular:desbloqueado', (d) => d.comPin),
        ],
        conclusao: 'Desafio vencido! Você domina o celular. 📱',
      },
      {
        id: 'prova-cel', titulo: 'Prova do curso Celular no dia a dia', icone: '🏆', prova: true, desafio: true,
        descricao: 'Tarefas e perguntas sobre o celular. Precisa de 70% para passar.',
        passos: [
          info('Chegou a PROVA do curso Celular no dia a dia! Faça as tarefas sozinho. Precisa de 70% para passar. Clique em "Continuar".', { emoji: '🏆', preparar: cenario('falso-parente', { repetir: true }) }),
          esperar('Tarefa 1: chegou de novo a mensagem do "troquei de número". Bloqueie e denuncie esse número.', 'celular:golpe-evitado', (d) => d.tipo === 'falso-parente'),
          esperar('Tarefa 2: deixe o limite do Pix à noite em R$ 200,00 (ou confirme que já está).', 'celular:limite', (d) => d.valor === 200, { ...pularSe(async () => (await CE.celular.garantir()).banco.limiteNoite === 200) }),
          esperar('Tarefa 3: mande um áudio para a Maria.', 'celular:mensagem-enviada', (d) => d.conversa === 'maria' && d.audio),
          quiz('O banco liga pedindo a senha para "cancelar uma compra". É...', ['Golpe', 'Normal'], 0),
          quiz('Antes de confirmar um Pix, eu confiro...', ['O nome de quem vai receber', 'A cor do app'], 0),
          quiz('O código de 6 números que chega por SMS...', ['Não passo para ninguém', 'Passo para quem pedir'], 0),
          quiz('Mensagem: "Você ganhou um prêmio, clique no link". Eu...', ['Não clico, bloqueio e apago', 'Clico para ver'], 0),
          quiz('Celular sem senha de bloqueio...', ['É perigoso: qualquer um entra em tudo', 'É mais prático e seguro'], 0),
          quiz('Antes de encaminhar uma corrente, eu...', ['Pesquiso se é verdade', 'Encaminho rápido'], 0),
          quiz('Para passar uma foto do celular para o computador, eu posso...', ['Usar o cabo USB ou a nuvem', 'Imprimir a tela do celular'], 0),
          quiz('Uma lanterna pede acesso aos meus contatos e SMS. Eu...', ['Não instalo', 'Instalo'], 0),
        ],
        conclusao: 'PARABÉNS! Você passou na prova do curso Celular no dia a dia! 🏆 Peça ao instrutor o seu certificado.',
      },
    ],
  });
})();
