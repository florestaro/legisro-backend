// Nível 2 — Módulo 5: Internet intermediária. Módulo 6: E-mail.
(function () {
  const { info, quiz, esperar, abrir, fechar, naJanela, pularSe } = CE.L;
  const nav = (s) => naJanela('navegador', s);
  const em = (s) => naJanela('email', s);
  const abrirEm = (url) => () => { if (CE.janelas.estaAberta('navegador')) CE.janelas.abrir('navegador', { url }); };
  const navegadorEm = (url) => abrir('navegador', 'Navegador', { preparar: abrirEm(url) });
  const visitar = (texto, teste, extra = {}) => esperar(texto, 'navegador:visitou', teste, { mouse: 'esquerdo', ...extra });
  const digitar = (endereco) => visitar(`Clique na barra de endereço, escreva ${endereco} e aperte Enter.`, (d) => d.dominio === endereco, { destacar: nav('.nav-endereco-caixa') });
  const caixaDeEmail = () => CE.api.chamar('dados:ler', `email:${CE.sessao.usuario.id}`, { conta: null, mensagens: [] });

  CE.adicionarModulo({
    id: 'n2-internet', nivel: 'n2', titulo: 'Internet no dia a dia', icone: '🌐',
    licoes: [
      {
        id: 'n2-net-confiavel', titulo: 'Pesquisa eficiente e sites confiáveis', icone: '🔎',
        descricao: 'Pesquisar com as palavras certas e saber em quem confiar.',
        passos: [
          info('Para pesquisar bem: use poucas palavras importantes ("sintomas dengue" em vez de "quais são os sintomas que a pessoa sente quando pega dengue") e confira de onde vem a informação.', { emoji: '🔎' }),
          navegadorEm('procura.com.br'),
          esperar('Pesquise:  sintomas dengue', 'navegador:pesquisa', (d) => /dengue/i.test(d.termo), { destacar: [nav('.pr-campo'), nav('.nav-endereco-caixa')], mouse: 'esquerdo' }),
          visitar('Abra o resultado do Saber Livre, uma enciclopédia conhecida.', (d) => d.caminho === '/artigo/dengue', { destacar: nav('[data-resultado="saberlivre.org/artigo/dengue"]') }),
          info('Para saber se uma informação é confiável, pergunte: o site é conhecido? Outros sites sérios dizem a mesma coisa? A data é recente? Tem autor ou responsável? Para saúde, confie também no posto de saúde e no médico.', { emoji: '✅' }),
          quiz('Qual pesquisa é mais eficiente?', ['sintomas dengue', 'oi tudo bem eu queria saber uma coisa sobre a dengue por favor', 'd'], 0),
          quiz('Uma notícia de saúde muito assustadora chegou pelo celular. O que fazer?', ['Conferir em sites confiáveis antes de acreditar ou repassar', 'Repassar para todos na hora', 'Acreditar porque veio de um amigo'], 0),
          quiz('Qual destes é um sinal de site confiável?', ['Site conhecido, com data e responsável', 'Muitos anúncios piscando', 'Pede seus dados logo de cara'], 0),
          fechar('navegador', 'Navegador'),
        ],
        conclusao: 'Muito bem! Pesquisar bem e desconfiar do que é duvidoso é uma habilidade muito importante.',
      },
      {
        id: 'n2-net-formulario', titulo: 'Formulários: agendando uma consulta', icone: '🩺',
        descricao: 'Preencher um formulário de serviço público.',
        passos: [
          info('Muitos serviços hoje são feitos pela internet, preenchendo FORMULÁRIOS: caixas para escrever, listas para escolher e bolinhas para marcar. Vamos agendar uma consulta no site de treino "Cidadão Digital".', { emoji: '🩺' }),
          navegadorEm('cidadaodigital.org.br'),
          digitar('cidadaodigital.org.br'),
          visitar('Clique em "Agendar consulta".', (d) => d.caminho === '/agendar', { destacar: nav('[data-servico="agendar"]') }),
          esperar('Preencha o formulário: nome (invente um), número do cartão (invente), escolha o posto, o atendimento e o dia nas listas, marque um horário e clique em "Agendar".', 'servico:agendado', null, {
            destacar: nav('.cd-form'), mouse: 'esquerdo', dica: 'As listas abrem com um clique. Para escolher o horário, clique na bolinha.',
          }),
          info('Pronto! Anote ou guarde o NÚMERO DO PROTOCOLO: ele é o comprovante de que você fez o pedido.', { destacar: nav('[data-protocolo]') }),
          quiz('O número de protocolo serve para...', ['Comprovar e acompanhar o seu pedido', 'Entrar no e-mail', 'Ligar o computador'], 0),
          quiz('Sites de serviços públicos verdadeiros terminam com...', ['.gov.br', '.barato.net', '.com.premio'], 0),
        ],
        conclusao: 'Parabéns! Você agendou uma consulta sem precisar enfrentar fila.',
      },
      {
        id: 'n2-net-downloads', titulo: 'Baixando arquivos (downloads)', icone: '⬇️',
        descricao: 'Baixar um boleto e encontrá-lo na pasta Downloads.',
        passos: [
          info('BAIXAR (fazer download) é trazer um arquivo da internet para o seu computador. Ele vai para a pasta DOWNLOADS. Vamos baixar a 2ª via da conta de água.', { emoji: '⬇️' }),
          navegadorEm('cidadaodigital.org.br/agua'),
          visitar('Entre em cidadaodigital.org.br e clique em "2ª via da conta de água".', (d) => d.caminho === '/agua', { destacar: [nav('[data-servico="agua"]'), nav('.nav-endereco-caixa')] }),
          esperar('Escreva a matrícula  2025-1234  e clique em "Buscar conta".', 'servico:segunda-via', null, { destacar: nav('.cd-form'), mouse: 'esquerdo' }),
          esperar('Clique em "⬇️ Baixar boleto".', 'navegador:download', null, { destacar: nav('[data-site-acao="baixar-boleto"]'), mouse: 'esquerdo' }),
          abrir('arquivos', 'Arquivos'),
          esperar('No Arquivos, abra a pasta "Downloads".', 'pasta:aberta', (d) => /downloads/i.test(d.caminho || ''), { destacar: [naJanela('arquivos', '.arq-item[data-arquivo="Downloads"]'), naJanela('arquivos', '[data-pasta="pc:Downloads"]')], mouse: 'duplo' }),
          esperar('Lá está o boleto! Dê um clique duplo nele para abrir.', 'arquivo:aberto', (d) => /conta de [aá]gua/i.test(d.nome), { destacar: naJanela('arquivos', '[data-arquivo^="Conta de"]'), mouse: 'duplo' }),
          quiz('Os arquivos que eu baixo da internet vão, normalmente, para a pasta...', ['Downloads', 'Lixeira', 'Pen drive'], 0),
          quiz('Posso baixar qualquer arquivo de qualquer site?', ['Não: só de sites confiáveis, porque pode ter vírus', 'Sim, sempre'], 0),
        ],
        conclusao: 'Ótimo! Agora você sabe baixar e encontrar arquivos.',
      },
    ],
  });

  CE.adicionarModulo({
    id: 'n2-email', nivel: 'n2', titulo: 'E-mail', icone: '📧',
    licoes: [
      {
        id: 'n2-email-conta', titulo: 'Criando a sua conta de e-mail', icone: '📧',
        descricao: 'Escolher o endereço e a senha.',
        passos: [
          info('O E-MAIL é como uma caixa de correio na internet. Todo endereço tem três partes: o NOME DE USUÁRIO, a arroba (@) e o PROVEDOR. Exemplo: maria.silva@correio.escola', { emoji: '📧' }),
          abrir('email', 'E-mail'),
          esperar('Preencha o seu nome, escolha o nome de usuário, crie uma senha (pelo menos 6 letras ou números), repita a senha e clique em "Criar minha conta".', 'email:conta-criada', null, {
            destacar: em('[data-acao="criar-conta"]'), mouse: 'esquerdo', ...pularSe(async () => !!(await caixaDeEmail()).conta),
          }),
          info('Sua conta está pronta! Do lado esquerdo ficam as pastas: Caixa de entrada (o que chega), Enviados (o que você mandou), Spam (propaganda e golpe) e Lixeira.', { destacar: em('.em-lateral') }),
          quiz('No endereço joao.lima@correio.escola, o nome de usuário é...', ['joao.lima', 'correio.escola', '@'], 0),
          quiz('Todo endereço de e-mail tem...', ['Uma arroba (@)', 'Um espaço no meio', 'Um acento'], 0),
        ],
        conclusao: 'Parabéns! Agora você tem um endereço de e-mail.',
      },
      {
        id: 'n2-email-ler', titulo: 'Lendo e respondendo mensagens', icone: '↩️',
        descricao: 'Abrir uma mensagem e responder.',
        passos: [
          abrir('email', 'E-mail'),
          esperar('As mensagens novas aparecem em negrito. Clique na mensagem "Responda esta mensagem", do Professor Virtual.', 'email:aberto', (d) => /responda/i.test(d.assunto), { destacar: em('[data-mensagem^="Responda"]'), mouse: 'esquerdo' }),
          esperar('Clique em "↩️ Responder". O endereço e o assunto já vêm preenchidos.', 'email:respondido', (d) => d.para === 'professor@correio.escola', {
            destacar: [em('[data-acao="enviar"]'), em('[data-acao="responder"]')], mouse: 'esquerdo', dica: 'Depois de escrever a resposta, clique em "📤 Enviar".',
          }),
          esperar('Mensagem enviada! Espere um pouquinho: o professor vai responder...', 'email:recebido', (d) => d.de === 'professor@correio.escola'),
          esperar('Chegou a resposta! Clique na pasta "Caixa de entrada" e abra a mensagem do professor.', 'email:aberto', (d) => d.de === 'professor@correio.escola' && /^re:/i.test(d.assunto), { destacar: [em('[data-mensagem^="Re:"]'), em('[data-pasta="entrada"]')], mouse: 'esquerdo' }),
          quiz('O botão "Responder" serve para...', ['Mandar uma resposta para quem escreveu', 'Apagar a mensagem', 'Imprimir'], 0),
          quiz('As mensagens que eu mando ficam guardadas na pasta...', ['Enviados', 'Spam', 'Lixeira'], 0),
        ],
        conclusao: 'Muito bem! Você leu e respondeu o seu primeiro e-mail.',
      },
      {
        id: 'n2-email-escrever', titulo: 'Escrevendo uma mensagem nova', icone: '✏️',
        descricao: 'Endereço, assunto e mensagem.',
        passos: [
          info('Para escrever uma mensagem nova, você precisa do ENDEREÇO de quem vai receber, um ASSUNTO curto que diga do que se trata, e a MENSAGEM.', { emoji: '✏️' }),
          abrir('email', 'E-mail'),
          esperar('Clique em "✏️ Escrever". Em "Para", escreva  tio.ze@correio.escola . No assunto, escreva "Saudades" e, na mensagem, conte uma novidade. Depois clique em Enviar.', 'email:enviado', (d) => d.para === 'tio.ze@correio.escola' && d.assunto.length > 0, {
            destacar: [em('[data-acao="enviar"]'), em('[data-acao="escrever"]')], mouse: 'esquerdo', dica: 'O endereço precisa estar certinho, letra por letra.',
          }),
          info('Dica: se você tiver colegas com e-mail neste computador, pode escrever para eles também. Comece a digitar no campo "Para" e os endereços aparecem.'),
          esperar('E se o endereço estiver errado? Escreva uma mensagem para  tio.zee@correio.escola  (com dois "e") e envie.', 'email:recebido', (d) => d.devolvida, { destacar: em('[data-acao="escrever"]') }),
          info('Voltou uma mensagem "Mensagem não entregue": o endereço não existe. Sempre confira o endereço antes de enviar!'),
          quiz('O assunto da mensagem deve ser...', ['Curto e dizer do que se trata', 'Vazio', 'Um texto enorme'], 0),
          quiz('Uma mensagem voltou dizendo "não entregue". O que aconteceu?', ['O endereço estava errado', 'O computador quebrou', 'A pessoa leu'], 0),
        ],
        conclusao: 'Parabéns! Você já escreve e-mails como gente grande.',
      },
      {
        id: 'n2-email-anexos', titulo: 'Anexos: mandando e baixando arquivos', icone: '📎',
        descricao: 'Baixar um anexo e mandar um arquivo junto com a mensagem.',
        passos: [
          info('ANEXO é um arquivo que vai junto com o e-mail: documento, foto, planilha, currículo. O clipe 📎 mostra que a mensagem tem anexo.', { emoji: '📎' }),
          abrir('email', 'E-mail'),
          esperar('Abra a mensagem "A receita que te falei", da Maria Clara.', 'email:aberto', (d) => /receita/i.test(d.assunto), { destacar: em('[data-mensagem="A receita que te falei"]'), mouse: 'esquerdo' }),
          esperar('Embaixo da mensagem está o anexo. Clique em "⬇️ Baixar". Ele vai para a pasta Downloads.', 'email:anexo-baixado', null, { destacar: em('[data-acao="baixar-anexo"]'), mouse: 'esquerdo' }),
          esperar('Agora mande um arquivo seu: clique em "✏️ Escrever", escreva para  maria.clara@correio.escola , coloque um assunto, clique em "📎 Anexar arquivo", escolha um arquivo seu e envie.', 'email:enviado', (d) => d.para === 'maria.clara@correio.escola' && d.anexos >= 1, {
            destacar: [em('[data-acao="anexar"]'), em('[data-acao="escrever"]')], mouse: 'esquerdo',
          }),
          quiz('Para mandar um arquivo junto com o e-mail, eu uso...', ['O botão Anexar (📎)', 'O botão Excluir', 'A pasta Spam'], 0),
          quiz('Abrir anexo de alguém desconhecido é...', ['Perigoso: pode ter vírus', 'Sempre seguro'], 0),
        ],
        conclusao: 'Muito bem! Anexos são muito usados no trabalho e na escola.',
      },
      {
        id: 'n2-email-golpes', titulo: 'Spam e e-mails falsos', icone: '🚫',
        descricao: 'Reconhecer e-mails de golpe e mandar para o Spam.',
        passos: [
          info('SPAM é propaganda que você não pediu. E existem e-mails FALSOS, que fingem ser do banco ou de uma loja para roubar sua senha. Vamos aprender a reconhecer.', { emoji: '🎣' }),
          abrir('email', 'E-mail'),
          esperar('Abra a mensagem "URGENTE: sua conta será BLOQUEADA". (Se não achar na Caixa de entrada, procure na pasta Spam.)', 'email:aberto', (d) => d.golpe && /urgente/i.test(d.assunto), { destacar: [em('[data-mensagem^="URGENTE"]'), em('[data-pasta="spam"]')], mouse: 'esquerdo' }),
          info('Olhe o REMETENTE: seguranca@bancoescola-seguranca.net. O site de verdade do banco é bancoescola.com.br. Tem pressa ("24 horas") e pede senha e código. É GOLPE!', { destacar: em('.em-endereco') }),
          quiz('Este e-mail é do banco de verdade?', ['Não: o endereço é estranho, tem pressa e pede senha', 'Sim, tem o nome do banco'], 0),
          esperar('Clique em "🚫 É spam / golpe" para tirar essa mensagem da sua caixa.', ['email:spam'], (d) => d.golpe, {
            destacar: em('[data-acao="spam"]'), mouse: 'esquerdo',
            ...pularSe(async () => (await caixaDeEmail()).mensagens.some((m) => m.golpe && /urgente/i.test(m.assunto) && m.pasta === 'spam')),
          }),
          esperar('Agora abra a pasta "Spam" para ver o que tem lá.', 'email:pasta', (d) => d.pasta === 'spam', { destacar: em('[data-pasta="spam"]'), mouse: 'esquerdo' }),
          quiz('Um e-mail pede para clicar num link e digitar sua senha do banco. O certo é...', ['Não clicar e marcar como spam', 'Clicar e digitar a senha', 'Responder com a senha'], 0),
          quiz('Para entrar no site do banco com segurança, eu...', ['Digito eu mesmo o endereço oficial', 'Uso o link de qualquer e-mail'], 0),
        ],
        conclusao: 'Excelente! Você está protegido contra os golpes por e-mail.',
      },
      {
        id: 'n2-email-desafio', titulo: 'Desafio: mandar o currículo', icone: '🏅', desafio: true,
        descricao: 'Enviar o currículo anexado para uma vaga de emprego.',
        passos: [
          info('Desafio! A "Empresa Boa" está com vaga aberta e pediu o currículo por e-mail. Clique em "Continuar".'),
          esperar('Mande um e-mail para  rh@empresaboa.com.br  com o assunto "Currículo", uma mensagem educada e o seu currículo ANEXADO.', 'email:enviado', (d) => d.para === 'rh@empresaboa.com.br' && d.anexos >= 1 && d.assunto.trim().length > 0),
          esperar('Espere a resposta da empresa e abra a mensagem.', 'email:aberto', (d) => d.de === 'rh@empresaboa.com.br'),
          quiz('Ao mandar um currículo por e-mail, o mais importante é...', ['Não esquecer de anexar o arquivo', 'Deixar o assunto vazio', 'Escrever tudo em maiúsculas'], 0),
        ],
        conclusao: 'Desafio vencido! Você está pronto para procurar emprego pela internet. 👔',
      },
    ],
  });
})();
