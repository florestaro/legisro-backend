// Nível 2 — Serviços públicos pela internet (Conta Cidadão, o treino da conta gov.br) e Inteligência artificial
// no dia a dia (perguntar bem, conferir, golpes com voz clonada e vídeo falso). Os dois módulos entram antes da
// prova do nível; para quem já tinha passado na prova antes deles existirem, ficam opcionais (veja "novoEm").
(function () {
  const { info, quiz, esperar, abrir, naJanela } = CE.L;
  const nav = (s) => naJanela('navegador', s);
  const DOMINIO = 'cidadaodigital.org.br';
  const NOVO_EM = '2026-10-27';
  const abrirEm = (url) => () => { if (CE.janelas.estaAberta('navegador')) CE.janelas.abrir('navegador', { url }); };
  const visitar = (texto, teste, extra = {}) => esperar(texto, 'navegador:visitou', teste, { mouse: 'esquerdo', ...extra });
  const conta = () => CE.contaCidadao.conta();
  const prata = () => !!(conta() && conta().nivel !== 'bronze');
  // Última página aberta no Navegador (para pular o passo quando o aluno já está nela).
  let ultima = {};
  CE.ouvir('navegador:visitou', (d) => { ultima = d || {}; });
  const naPagina = (caminho) => ultima.dominio === DOMINIO && ultima.caminho === caminho;

  const irAoSite = (caminho = '') => abrir('navegador', 'Navegador', { preparar: abrirEm(DOMINIO + caminho) });
  const criarSeNaoTiver = () => esperar('Você ainda não tem a Conta Cidadão. Clique em "👤 Entrar com a Conta Cidadão" e depois em "Criar conta". Use o CPF de treino 123.456.789-09, confirme o código do SMS e crie uma senha forte.', 'gov:conta-criada', null, {
    destacar: [nav('.cd-form'), nav('[data-gov="criar"]'), nav('[data-gov="entrar"]')], mouse: 'esquerdo', jaFeito: () => !!conta(),
  });
  const entrarNaConta = () => esperar('Entre na sua Conta Cidadão: clique em "👤 Entrar com a Conta Cidadão", digite o CPF de treino 123.456.789-09, clique em "Continuar" e digite a SUA senha. Esqueceu a senha? Clique em "Esqueci minha senha".', 'gov:login', null, {
    destacar: [nav('.cd-form'), nav('[data-gov="entrar"]')], mouse: 'esquerdo', jaFeito: () => CE.contaCidadao.logado(),
    dica: 'O CPF de treino está no quadro amarelo. A senha é a que você criou na aula "Conta Cidadão". Se esqueceu, clique em "Esqueci minha senha": o código chega no "celular" que aparece na tela.',
  });
  const sairDaConta = () => esperar('Terminou? Clique em "Sair 🚪" para sair da conta. Isso é muito importante em computador que outras pessoas usam!', 'gov:sair', null, {
    destacar: nav('[data-gov="sair"]'), mouse: 'esquerdo', jaFeito: () => !CE.contaCidadao.logado(),
  });

  CE.adicionarModulo({
    id: 'n2-gov', nivel: 'n2', titulo: 'Serviços públicos pela internet (gov.br)', icone: '🪪', antes: 'n2-prova', novoEm: NOVO_EM,
    licoes: [
      {
        id: 'n2-gov-conta', titulo: 'Conta Cidadão: a porta dos serviços do governo', icone: '🪪',
        descricao: 'Criar a conta com CPF, código por SMS e senha forte (o treino da conta gov.br).',
        passos: [
          info('Hoje quase todo serviço público é pela internet: Carteira de Trabalho, INSS, CPF, SUS, Bolsa Família, título de eleitor. Para entrar em todos eles você usa UMA conta só. Na vida real ela se chama conta gov.br. Aqui na escola treinamos no "Cidadão Digital", que funciona do mesmo jeito.', { emoji: '🪪' }),
          info('Atenção ao endereço: o site verdadeiro do governo SEMPRE termina com .gov.br (por exemplo, gov.br). No treino, o endereço é cidadaodigital.org.br. E nunca coloque seus documentos de verdade num site de treino!', { emoji: '🔒' }),
          irAoSite(),
          visitar('Na barra de endereço, digite  cidadaodigital.org.br  e aperte Enter.', (d) => d.dominio === DOMINIO, { destacar: nav('.nav-endereco-caixa'), jaFeito: () => ultima.dominio === DOMINIO }),
          visitar('Clique em "👤 Entrar com a Conta Cidadão".', (d) => d.dominio === DOMINIO && d.caminho === '/conta', { destacar: nav('[data-gov="entrar"]'), jaFeito: () => CE.contaCidadao.logado() }),
          visitar('Você ainda não tem conta. Clique em "Criar conta".', (d) => d.dominio === DOMINIO && d.caminho === '/criar', { destacar: nav('[data-gov="criar"]'), jaFeito: () => !!conta() }),
          esperar('Preencha: o CPF de TREINO 123.456.789-09 (está no quadro amarelo), o seu nome completo, a data de nascimento (dia/mês/ano) e o celular com DDD. Marque "Li e concordo" e clique em "Continuar".', 'gov:cadastro-iniciado', null, {
            destacar: nav('.cd-form'), mouse: 'esquerdo', jaFeito: () => !!conta(),
            dica: 'A data é assim: 25/12/1970. O celular é assim: (69) 99999-1234. Se algo estiver errado, o site mostra em vermelho o que corrigir.',
          }),
          esperar('Chegou um SMS no "celular" (o quadro escuro da tela) com um código de 6 números. Digite o código e clique em "Confirmar". Esse código é só seu: nunca passe para ninguém!', 'gov:codigo-confirmado', null, {
            destacar: [nav('.gv-sms'), nav('.cd-form')], mouse: 'esquerdo', jaFeito: () => !!conta(),
          }),
          esperar('Agora crie uma senha FORTE: pelo menos 8 caracteres, com letra MAIÚSCULA, letra minúscula e número (por exemplo: Rio2025Azul). Repita a senha e clique em "Criar conta". Guarde bem essa senha!', 'gov:conta-criada', null, {
            destacar: nav('.cd-form'), mouse: 'esquerdo', jaFeito: () => !!conta(),
            dica: 'Senha forte mistura letras maiúsculas, minúsculas e números. Não use a data de nascimento nem o nome.',
          }),
          entrarNaConta(),
          info('Pronto, você está na sua conta! Veja o NÍVEL dela: começa no 🥉 Bronze. Alguns serviços mais importantes pedem prata ou ouro: vamos aprender isso numa próxima aula.', { destacar: nav('.gv-nivel') }),
          quiz('O endereço verdadeiro dos sites do governo termina com...', ['.gov.br', '.com', '.net'], 0),
          quiz('O código que chega por SMS para confirmar a conta...', ['É só meu: não passo para ninguém', 'Posso passar para quem ligar pedindo'], 0),
          quiz('Com a conta gov.br eu entro...', ['Em vários serviços do governo, com uma conta só', 'Só no INSS'], 0),
          sairDaConta(),
        ],
        conclusao: 'Muito bem! Você criou a sua conta e já sabe como entrar nos serviços públicos pela internet.',
      },
      {
        id: 'n2-gov-carteira', titulo: 'Carteira de Trabalho Digital', icone: '💼',
        descricao: 'Ver os empregos com carteira assinada e baixar a carteira.',
        passos: [
          info('A Carteira de Trabalho agora é DIGITAL: os empregos com carteira assinada aparecem no site e no aplicativo do celular. Serve para conferir se a empresa registrou você direitinho e para mandar a carteira quando for contratado.', { emoji: '💼' }),
          irAoSite('/conta'),
          criarSeNaoTiver(),
          entrarNaConta(),
          visitar('Clique em "💼 Carteira de Trabalho Digital".', (d) => d.dominio === DOMINIO && d.caminho === '/carteira', { destacar: nav('[data-servico="carteira"]') }),
          info('Aqui aparecem os seus empregos: a EMPRESA, o CARGO, o dia de ENTRADA, o dia de SAÍDA e o salário. Confira se está tudo certo. Faltou algum emprego? Procure o RH da empresa.', { destacar: nav('.gv-contratos') }),
          quiz('Na Carteira de Trabalho Digital, o emprego ATUAL é aquele que...', ['Não tem data de saída', 'Tem a data de entrada mais antiga'], 0, 'Aqui, o emprego atual é na Padaria Pão Quente.'),
          esperar('Clique em "⬇️ Baixar a carteira" para guardar uma cópia no computador (ela vai para a pasta Downloads).', 'navegador:download', (d) => d.site === DOMINIO && d.nome === 'carteira', {
            destacar: nav('[data-site-acao="baixar-carteira"]'), mouse: 'esquerdo',
          }),
          quiz('A Carteira de Trabalho Digital serve para...', ['Conferir meus empregos com carteira assinada', 'Pagar boletos'], 0),
          sairDaConta(),
        ],
        conclusao: 'Excelente! Agora você confere e guarda a sua Carteira de Trabalho sem sair de casa.',
      },
      {
        id: 'n2-gov-inss', titulo: 'INSS: conta prata e extrato de contribuições', icone: '👵',
        descricao: 'Subir a conta para prata pelo banco e ver o tempo de contribuição.',
        passos: [
          info('Para os serviços mais importantes, como o INSS, o governo quer ter mais certeza de que é você mesmo. Por isso eles pedem conta PRATA ou OURO. Um jeito fácil de subir para prata é confirmar pelo seu banco.', { emoji: '👵' }),
          irAoSite('/conta'),
          criarSeNaoTiver(),
          entrarNaConta(),
          visitar('Clique em "👵 INSS: extrato de contribuições".', (d) => d.dominio === DOMINIO && d.caminho === '/inss', { destacar: nav('[data-servico="inss"]'), jaFeito: () => prata() && naPagina('/inss') }),
          info('Apareceu um cadeado: este serviço precisa de conta prata ou ouro, e a sua é bronze. Vamos subir o nível.', { destacar: nav('[data-precisa-prata]'), jaFeito: prata }),
          visitar('Clique em "⬆️ Aumentar o nível da conta".', (d) => d.dominio === DOMINIO && d.caminho === '/nivel', { destacar: nav('[data-gov="nivel"]'), jaFeito: prata }),
          info('Os níveis: 🥉 BRONZE é só o cadastro. 🥈 PRATA confirma pelo banco ou pelo rosto no aplicativo. 🥇 OURO usa o rosto com a foto da CNH ou um certificado digital.', { destacar: nav('.gv-niveis') }),
          visitar('Clique em "🏦 Validar pelo meu banco (Banco Escola)".', (d) => d.dominio === 'bancoescola.com.br' && d.caminho === '/autorizar', { destacar: nav('[data-gov="validar-banco"]'), jaFeito: prata }),
          info('Repare na barra de endereço: agora você está no SITE DO BANCO (bancoescola.com.br, com o cadeado 🔒). A senha do banco só se digita no site do banco, nunca em outro.', { destacar: nav('.nav-endereco-caixa'), jaFeito: prata }),
          esperar('Digite a agência 0001, a conta 12345-6 e a senha 1234 (a conta de treino do quadro amarelo) e clique em "Autorizar".', 'gov:nivel', (d) => d.nivel === 'prata', { destacar: nav('.bc-form'), mouse: 'esquerdo', jaFeito: prata }),
          visitar('Sua conta agora é PRATA! Clique de novo em "👵 INSS: extrato de contribuições".', (d) => d.dominio === DOMINIO && d.caminho === '/inss', { destacar: nav('[data-servico="inss"]'), jaFeito: () => naPagina('/inss') }),
          info('Este é o EXTRATO DE CONTRIBUIÇÕES (no INSS se chama CNIS): cada ano de trabalho com carteira assinada conta tempo para a aposentadoria. Confira se está tudo certo!', { destacar: nav('[data-tempo-contribuicao]') }),
          esperar('Clique em "📊 Simular aposentadoria".', 'gov:simulou', null, { destacar: nav('[data-site-acao="simular-aposentadoria"]'), mouse: 'esquerdo' }),
          quiz('Para ver o extrato do INSS, a conta precisa ser...', ['Prata ou ouro', 'Bronze'], 0),
          quiz('Para subir a conta para prata pelo banco, a senha do banco eu digito...', ['Só no site do banco', 'Em qualquer site que pedir'], 0),
          sairDaConta(),
        ],
        conclusao: 'Parabéns! Você subiu a conta para prata e consultou o INSS pela internet.',
      },
      {
        id: 'n2-gov-golpe', titulo: 'Golpe do falso gov.br e dos "valores esquecidos"', icone: '🎣',
        descricao: 'Reconhecer o site falso e conferir no site verdadeiro, sem pagar taxa.',
        passos: [
          info('Chegou este SMS: "CIDADÃO DIGITAL: você tem R$ 1.250,00 em VALORES ESQUECIDOS. Resgate HOJE: cidadaodigital-valores.com". Golpes assim são muito comuns na vida real, usando o nome do gov.br.', { emoji: '📱' }),
          irAoSite(),
          visitar('Vamos ver como é o site do golpe (este é de treino, sem perigo). Na barra de endereço, digite  cidadaodigital-valores.com  e aperte Enter.', (d) => d.dominio === 'cidadaodigital-valores.com', { destacar: nav('.nav-endereco-caixa') }),
          info('Olhe com atenção: a barra mostra ⚠️ "Não seguro", o endereço NÃO é cidadaodigital.org.br, tem PRESSA ("só até hoje"), promete dinheiro, pede a SENHA e uma TAXA para liberar. É golpe!', { destacar: [nav('.nav-cadeado'), nav('.gv-golpe')] }),
          quiz('Este site é do Cidadão Digital?', ['Não: o endereço é outro, tem pressa e cobra taxa', 'Sim: tem o nome Cidadão Digital'], 0),
          esperar('Não digite NADA aí! Saia do site: na barra de endereço, digite o endereço verdadeiro  cidadaodigital.org.br  e aperte Enter.', 'golpe:evitado', (d) => d.site === 'cidadaodigital-valores.com', {
            destacar: nav('.nav-endereco-caixa'), mouse: 'esquerdo',
          }),
          criarSeNaoTiver(),
          entrarNaConta(),
          visitar('No site verdadeiro, clique em "💰 Valores a receber".', (d) => d.dominio === DOMINIO && d.caminho === '/valores', { destacar: nav('[data-servico="valores"]') }),
          info('No site verdadeiro, o serviço é GRÁTIS e nunca pede taxa. Aqui aparece o valor de verdade (de treino): R$ 12,37. Bem diferente dos R$ 1.250 do golpe!', { destacar: nav('.gv-alerta') }),
          esperar('Peça o dinheiro: digite uma chave Pix SUA (pode ser o seu e-mail de treino) e clique em "Pedir por Pix".', 'gov:valores-pedido', null, {
            destacar: nav('.cd-form'), mouse: 'esquerdo', jaFeito: () => !!(conta() && conta().valoresPedidos),
          }),
          quiz('O governo cobra taxa para liberar valores a receber?', ['Não, nunca', 'Sim, sempre'], 0),
          quiz('Recebi um SMS com link para resgatar dinheiro. O certo é...', ['Não clicar e conferir digitando eu mesmo o endereço oficial', 'Clicar rápido antes que acabe o prazo'], 0),
          sairDaConta(),
        ],
        conclusao: 'Excelente! Você reconhece o golpe do falso gov.br e sabe conferir no site oficial.',
      },
      {
        id: 'n2-gov-desafio', titulo: 'Desafio dos serviços públicos', icone: '🏅', desafio: true,
        descricao: 'Entrar na conta, baixar a carteira e o comprovante do CPF.',
        passos: [
          info('Desafio! Resolva sozinho no Cidadão Digital. Clique em "Continuar".'),
          esperar('Entre na sua Conta Cidadão.', 'gov:login', null, { jaFeito: () => CE.contaCidadao.logado() }),
          esperar('Baixe a sua Carteira de Trabalho Digital.', 'navegador:download', (d) => d.site === DOMINIO && d.nome === 'carteira'),
          esperar('Consulte a situação do seu CPF e baixe o comprovante.', 'navegador:download', (d) => d.site === DOMINIO && d.nome === 'cpf'),
          esperar('Saia da conta.', 'gov:sair'),
        ],
        conclusao: 'Desafio vencido! Você resolve os serviços públicos pela internet. 🪪',
      },
    ],
  });

  // ---------- Inteligência artificial ----------
  // Ligação de treino com voz "clonada": o golpista imita a voz de um parente pedindo Pix.
  function ligacaoFalsa() {
    document.querySelectorAll('.ligacao-falsa').forEach((d) => d.remove());
    const fala = 'Mãe? Oi, sou eu! Bati o carro e preciso de oitocentos reais agora para resolver. Faz um Pix para esta chave, por favor. É urgente! E não conta para ninguém, tá?';
    const tela = CE.el('div', { class: 'ligacao-tela' });
    const fundo = CE.el('div', { class: 'dialogo-fundo ligacao-falsa', role: 'dialog', 'aria-label': 'Ligação de treino' }, tela);
    const escolher = (escolha) => {
      CE.voz.parar();
      CE.emitir('ia:ligacao', { escolha });
      if (escolha === 'pix') {
        tela.replaceChildren(CE.el('div', { class: 'ligacao-fim golpe' },
          CE.el('h2', {}, '⚠️ Era golpe!'),
          CE.el('p', {}, 'A voz era copiada por inteligência artificial. Repare: número desconhecido, PRESSA, pedido de SEGREDO e Pix para uma chave estranha.'),
          CE.el('button', { class: 'botao', onclick: () => ligacaoFalsa() }, 'Tentar de novo')));
        return;
      }
      tela.replaceChildren(CE.el('div', { class: 'ligacao-fim' },
        CE.el('h2', {}, '✅ Muito bem!'),
        CE.el('p', {}, escolha === 'pergunta'
          ? 'Você fez uma pergunta que só o seu filho saberia. O golpista não soube responder e desligou.'
          : 'Você desligou e ligou para o número de sempre do seu filho. Ele estava bem, em casa: era golpe!'),
        CE.el('button', { class: 'botao', 'data-acao': 'fechar-ligacao', onclick: () => fundo.remove() }, 'Fechar')));
    };
    tela.replaceChildren(
      CE.el('div', { class: 'ligacao-numero' }, '📞 Chamada recebida'),
      CE.el('div', { class: 'ligacao-quem' }, 'Número desconhecido', CE.el('small', {}, '(69) 9 8123-4567')),
      CE.el('button', { class: 'botao ligacao-atender', 'data-acao': 'atender', onclick: () => {
        tela.replaceChildren(
          CE.el('div', { class: 'ligacao-numero' }, '🔊 Em ligação...'),
          CE.el('p', { class: 'ligacao-fala', 'data-fala-ligacao': '' }, `"${fala}"`),
          CE.el('p', { class: 'ligacao-pergunta' }, 'A voz parece a do seu filho. O que você faz?'),
          CE.el('div', { class: 'ligacao-opcoes' },
            CE.el('button', { class: 'botao secundario', 'data-escolha': 'pix', onclick: () => escolher('pix') }, '💸 Faço o Pix agora'),
            CE.el('button', { class: 'botao secundario', 'data-escolha': 'pergunta', onclick: () => escolher('pergunta') }, '❓ Faço uma pergunta que só ele sabe responder'),
            CE.el('button', { class: 'botao secundario', 'data-escolha': 'desligar', onclick: () => escolher('desligar') }, '📵 Desligo e ligo para o número de sempre dele')));
        CE.voz.falar(fala, { velocidade: 1.15, tom: 0.75 });
        CE.emitir('ia:ligacao-atendida');
      } }, '📞 Atender'));
    document.body.append(fundo);
  }

  CE.adicionarModulo({
    id: 'n2-ia', nivel: 'n2', titulo: 'Inteligência artificial e golpes com IA', icone: '🤖', antes: 'n2-prova', novoEm: NOVO_EM,
    licoes: [
      {
        id: 'n2-ia-conversar', titulo: 'Conversando com uma inteligência artificial', icone: '🤖',
        descricao: 'Perguntar bem, conferir a resposta e proteger os seus dados.',
        passos: [
          info('INTELIGÊNCIA ARTIFICIAL (IA) é um programa que conversa e responde perguntas como uma pessoa. Exemplos: ChatGPT, Gemini, Copilot e a Meta AI do WhatsApp. O Professor Virtual daqui também é uma IA, que funciona até sem internet!', { emoji: '🤖' }),
          esperar('Vamos conversar com ele. Na caixa "Escreva sua dúvida aqui..." (embaixo, nesta janela do professor), escreva uma pergunta, por exemplo "Como salvo um documento?", e clique em "Perguntar".', 'professor:respondeu', null, {
            destacar: '#prof-campo', mouse: 'esquerdo',
          }),
          info('Para a IA ajudar de verdade, PERGUNTE COM DETALHES: diga o que você quer e para quê. Em vez de "bolo", pergunte "receita de bolo de fubá simples para 6 pessoas".', { emoji: '💬' }),
          esperar('Agora faça uma pergunta com detalhes, de pelo menos 6 palavras. Exemplo: "Como mando uma foto por e-mail para minha filha?"', 'professor:respondeu', (d) => String(d.pergunta || '').trim().split(/\s+/).length >= 6, {
            destacar: '#prof-campo', mouse: 'esquerdo', dica: 'Conte as palavras: "Como mando uma foto por e-mail para minha filha" tem 9.',
          }),
          info('Cuidado: a IA às vezes ERRA, e fala com toda a certeza do mundo. Uma IA respondeu que "15% de 80 é 15". Vamos conferir na Calculadora!', { emoji: '🧐' }),
          abrir('calculadora', 'Calculadora'),
          esperar('Calcule 15% de 80: faça 80 × 15 e aperte =. Depois ÷ 100 e aperte = de novo. (Ou faça 80 × 0,15 =.)', 'calculadora:resultado', (d) => Math.abs(d.resultado - 12) < 0.001, {
            destacar: naJanela('calculadora', '.calc-teclas'), mouse: 'esquerdo', dica: '80 × 15 = 1200. Depois 1200 ÷ 100 = 12.',
          }),
          quiz('A IA disse que 15% de 80 é 15. Na verdade é...', ['12', '15'], 0, 'A conta certa dá 12: a IA errou!'),
          quiz('Posso contar a minha senha, o número do cartão ou o código do SMS para uma IA?', ['Não, nunca', 'Sim, ela é de confiança'], 0),
          quiz('Para assuntos importantes (saúde, dinheiro, leis), a resposta da IA...', ['Deve ser conferida num site oficial ou com um profissional', 'Está sempre certa'], 0),
        ],
        conclusao: 'Muito bem! A IA ajuda muito, mas quem confere é você.',
      },
      {
        id: 'n2-ia-voz', titulo: 'Golpe da voz clonada', icone: '📞',
        descricao: 'Ligação com a voz de um parente pedindo Pix urgente.',
        passos: [
          info('Com poucos segundos da voz de alguém (tirados de um vídeo ou de um áudio), golpistas usam IA para COPIAR a voz. Depois ligam fingindo ser o seu filho, neto ou amigo, pedindo dinheiro com urgência.', { emoji: '📞' }),
          info('Vamos treinar. Daqui a pouco vai "tocar o telefone" na tela. Atenda e escute com atenção (ligue o som). Clique em "Continuar".'),
          esperar('O telefone está tocando! Clique em "📞 Atender", escute e escolha o que fazer.', 'ia:ligacao', (d) => d.escolha !== 'pix', {
            preparar: ligacaoFalsa, destacar: ['.ligacao-falsa [data-acao="atender"]', '.ligacao-opcoes'], mouse: 'esquerdo',
            dica: 'Desconfie de pressa, segredo e número desconhecido. Desligue e ligue para o número de sempre da pessoa, ou faça uma pergunta que só ela sabe.',
          }),
          info('Combine com a família uma PALAVRA-SECRETA (por exemplo, o nome do primeiro cachorro). Em qualquer pedido de dinheiro por telefone, pergunte a palavra. A IA copia a voz, mas não sabe os segredos da família.', { emoji: '🤫' }),
          quiz('Sinais do golpe da voz clonada:', ['Número desconhecido, pressa e pedido de segredo', 'Ligação no horário de sempre, sem pedir nada'], 0),
          quiz('A voz parece do meu neto pedindo Pix urgente. Eu...', ['Desligo e ligo para o número de sempre dele', 'Faço o Pix rápido para ajudar'], 0),
          quiz('Para dificultar a cópia da sua voz, é bom...', ['Não atender ligações estranhas só para "conversar" e não falar "sim" à toa', 'Mandar áudios para números desconhecidos'], 0),
        ],
        conclusao: 'Parabéns! A IA copia a voz, mas não engana quem confere antes de pagar.',
      },
      {
        id: 'n2-ia-video', titulo: 'Vídeo falso com famoso (deepfake)', icone: '🎭',
        descricao: 'Reconhecer e denunciar propaganda falsa feita com IA.',
        passos: [
          info('Com IA também dá para fazer VÍDEOS FALSOS (deepfake): parece uma pessoa famosa falando, mas é montagem. São usados para vender investimentos falsos, remédios milagrosos e "benefícios do governo".', { emoji: '🎭' }),
          abrir('navegador', 'Navegador', { preparar: abrirEm('vejaagora.com.br') }),
          visitar('Entre no site de vídeos: na barra de endereço, digite  vejaagora.com.br  e aperte Enter.', (d) => d.dominio === 'vejaagora.com.br', { destacar: nav('.nav-endereco-caixa'), jaFeito: () => ultima.dominio === 'vejaagora.com.br' }),
          esperar('Veja o vídeo "Patrocinado" do apresentador Carlos Mendes: clique em "▶ Assistir".', 'ia:video-assistido', null, { destacar: nav('[data-site-acao="assistir"]'), mouse: 'esquerdo' }),
          info('Sinais de vídeo falso: a BOCA não acompanha a fala, a voz é meio robótica, a pessoa quase não pisca, e a promessa é boa demais ("R$ 5.000 em 7 dias"). Famoso de verdade não pede para você investir pelo link de um anúncio!', { destacar: nav('.va-video') }),
          quiz('Esse vídeo é de confiança?', ['Não: promessa boa demais, boca fora da fala e link estranho', 'Sim: é de um apresentador famoso'], 0),
          esperar('Denuncie o anúncio: clique em "⚑ Denunciar" e escolha "Golpe ou fraude".', 'ia:denunciou', null, { destacar: nav('[data-site-acao="denunciar"]'), mouse: 'esquerdo' }),
          visitar('Nos comentários tem um link para uma notícia sobre esse vídeo. Clique em "Jornal do Bairro: é falso!" para conferir.', (d) => d.dominio === 'jornaldobairro.com.br' && d.caminho === '/noticia/video-falso', { destacar: nav('[data-noticia-video]') }),
          quiz('Antes de acreditar num vídeo surpreendente, eu...', ['Procuro a notícia em sites de confiança', 'Compartilho na hora com todo mundo'], 0),
          quiz('Um famoso aparece num anúncio pedindo Pix para um investimento. É...', ['Golpe', 'Oportunidade única'], 0),
        ],
        conclusao: 'Excelente! Você reconhece vídeo falso e não cai em promessa de dinheiro fácil.',
      },
      {
        id: 'n2-ia-desafio', titulo: 'Desafio: golpe ou não?', icone: '🏅', desafio: true,
        descricao: 'Situações com inteligência artificial: o que é golpe?',
        passos: [
          info('Desafio! Responda sozinho: é golpe ou não? Clique em "Continuar".'),
          quiz('Um áudio com a voz da sua filha pede o código que chegou por SMS. É...', ['Golpe', 'Normal'], 0),
          quiz('Você pede para uma IA uma receita de bolo e confere os ingredientes. É...', ['Uso seguro', 'Golpe'], 0),
          quiz('Vídeo de um ministro anuncia "benefício de R$ 2.000" com link para pagar uma taxa. É...', ['Golpe', 'Benefício de verdade'], 0),
          quiz('A IA respondeu uma dúvida de remédio. O melhor é...', ['Confirmar com o médico ou o farmacêutico', 'Tomar o remédio do jeito que ela falou'], 0),
          quiz('Alguém liga com a voz do seu neto e não sabe a palavra-secreta da família. É...', ['Golpe', 'Normal'], 0),
        ],
        conclusao: 'Desafio vencido! Você está protegido contra os golpes com inteligência artificial. 🤖',
      },
    ],
  });
})();
