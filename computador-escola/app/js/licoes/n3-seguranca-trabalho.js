// Nível 3 — Módulo 5: Segurança digital avançada. Módulo 6: Computador e trabalho.
(function () {
  const { info, quiz, esperar, abrir, naJanela, editorNovo, editorSalvar, garantirArquivo, pularSe } = CE.L;
  const nav = (s) => naJanela('navegador', s);
  const em = (s) => naJanela('email', s);
  const abrirEm = (url) => () => { if (CE.janelas.estaAberta('navegador')) CE.janelas.abrir('navegador', { url }); };
  const visitar = (texto, teste, extra = {}) => esperar(texto, 'navegador:visitou', teste, { mouse: 'esquerdo', ...extra });
  const irPara = (endereco, caminho = '/') => [
    abrir('navegador', 'Navegador', { preparar: abrirEm(endereco + (caminho === '/' ? '' : caminho)) }),
    visitar(`Na barra de endereço, escreva  ${endereco}${caminho === '/' ? '' : caminho}  e aperte Enter.`, (d) => d.dominio === endereco && d.caminho === caminho, {
      destacar: nav('.nav-endereco-caixa'),
      // Já está na página certa (o passo anterior pode ter aberto o Navegador direto nela).
      jaFeito: () => !!document.querySelector(`.janela[data-app="navegador"] .nav-pagina[data-site="${endereco}"]`) && ((document.querySelector('.janela[data-app="navegador"] .nav-endereco') || {}).value || '').includes(endereco + (caminho === '/' ? '' : caminho)),
    }),
  ];
  const pag = () => document.querySelector('.janela[data-app="editor"] .editor-pagina');
  const texto = () => (pag() ? pag().innerText : '');
  // Confere o texto da página; se o aluno já tiver feito antes de o passo aparecer, o passo é pulado.
  const confere = (fala, teste, extra = {}) => esperar(fala, 'editor:texto', teste, { jaFeito: () => !!pag() && teste(), ...extra });
  const contaEmail = async () => !!(await CE.api.chamar('dados:ler', `email:${CE.sessao.usuario.id}`, {})).conta;
  const criarContaSePrecisar = () => esperar('Você ainda não tem e-mail aqui. Crie a sua conta: preencha os campos e clique em "Criar conta".', 'email:conta-criada', null, {
    destacar: em('[data-acao="criar-conta"]'), mouse: 'esquerdo', ...pularSe(contaEmail),
  });
  const CURRICULO_PDF = '<div style="text-align: center;"><b><font size="6">Aluno de Treino</font></b></div><div style="text-align: center;">Porto Velho – RO · (69) 99999-0000 · aluno@correio.escola</div><hr><div><b>OBJETIVO</b></div><div>Auxiliar administrativo</div><div><br></div><div><b>FORMAÇÃO</b></div><ul><li>Ensino médio completo</li><li>Curso de Informática — Computador Escola</li></ul><div><b>HABILIDADES</b></div><ul><li>Editor de Texto, Planilha, Apresentações e e-mail</li><li>Atendimento ao público</li></ul>';

  CE.adicionarModulo({
    id: 'n3-seguranca', nivel: 'n3', titulo: 'Segurança digital avançada', icone: '🔐',
    licoes: [
      {
        id: 'n3-seg-senhas', titulo: 'Senhas fortes', icone: '🔑',
        descricao: 'Criar uma senha difícil de adivinhar e fácil de lembrar.',
        passos: [
          info('Senha fraca é como deixar a porta de casa aberta. Os bandidos usam programas que testam MILHÕES de senhas por segundo, começando pelas mais comuns: 123456, datas e nomes.', { emoji: '🔑' }),
          ...irPara('escudodigital.org.br', '/senha'),
          esperar('Teste uma senha FRACA: escreva  123456  e clique em "Testar a senha".', 'seguranca:senha', (d) => d.forca === 'fraca', { destacar: nav('input[name="senha"]'), mouse: 'esquerdo' }),
          info('Viu? Descobriria em menos de 1 segundo! Uma boa ideia é a FRASE-SENHA: uma frase que só você conhece, com maiúsculas, números e símbolos. Exemplo: MinhaGata#Come3Vezes'),
          esperar('Agora invente uma frase-senha (não use a sua senha de verdade!) e teste até ficar FORTE 🟢.', 'seguranca:senha', (d) => d.forca === 'forte', {
            destacar: nav('input[name="senha"]'), dica: 'Use 12 letras ou mais, misture MAIÚSCULAS e minúsculas e coloque números e símbolos (! @ # $).',
          }),
          quiz('Qual é a senha mais forte?', ['Sol#Nasce2VezesNaSerra', 'maria1980', '123456'], 0),
          quiz('Posso usar a MESMA senha no e-mail, no banco e na rede social?', ['Não: se descobrirem uma, entram em todas', 'Sim, é mais fácil de lembrar'], 0),
          quiz('Alguém liga dizendo ser do banco e pede a sua senha. Eu...', ['Não falo e desligo', 'Falo, porque é do banco'], 0),
        ],
        conclusao: 'Agora você sabe criar senhas de verdade fortes! 🔑',
      },
      {
        id: 'n3-seg-2etapas', titulo: 'Verificação em duas etapas', icone: '📲',
        descricao: 'Senha + código no celular: proteção dupla.',
        passos: [
          info('Mesmo uma senha forte pode vazar. Com a VERIFICAÇÃO EM DUAS ETAPAS, para entrar é preciso a senha E um código que chega no SEU celular. Sem o celular, o ladrão não entra.', { emoji: '📲' }),
          ...irPara('escudodigital.org.br', '/duas-etapas'),
          esperar('Clique em "Ativar a verificação em duas etapas", confira o celular e clique em "Enviar código por SMS".', 'seguranca:codigo-enviado', null, { destacar: [nav('[data-acao="enviar-codigo"]'), nav('[data-acao="ativar-duas-etapas"]')], mouse: 'esquerdo' }),
          esperar('O código chegou no celular (lá em cima, à direita). Digite o código e clique em Confirmar.', 'seguranca:2etapas', null, { destacar: nav('[data-campo="codigo"]'), mouse: 'esquerdo' }),
          esperar('Agora faça o teste: clique em "Fazer o teste: entrar na conta", digite uma senha qualquer, e use o código novo que chegar.', 'seguranca:login-2etapas', null, { destacar: [nav('[data-acao="testar-login"]'), nav('[data-acao="entrar"]'), nav('[data-campo="codigo"]')], mouse: 'esquerdo' }),
          info('ATENÇÃO: o código é como uma chave. O golpe do WhatsApp clonado acontece quando alguém liga ou manda mensagem pedindo "o código que chegou aí". NUNCA passe o código para ninguém!', { emoji: '🚨' }),
          quiz('Alguém do "suporte" pede o código de 6 números que chegou no seu celular. Eu...', ['Não passo de jeito nenhum', 'Passo, porque é do suporte'], 0),
          quiz('Onde vale a pena ligar a verificação em duas etapas?', ['E-mail, banco, WhatsApp e redes sociais', 'Em nenhum lugar', 'Só na calculadora'], 0),
        ],
        conclusao: 'Suas contas ficaram muito mais seguras! 📲',
      },
      {
        id: 'n3-seg-golpes', titulo: 'Golpe ou não?', icone: '🕵️',
        descricao: 'Treinar o olho para reconhecer mensagens falsas.',
        passos: [
          info('Os golpes mais comuns chegam por SMS, WhatsApp e e-mail. Sinais de alerta: PRESSA ("urgente"), AMEAÇA ("será bloqueado"), PRÊMIO que você não pediu, LINK estranho e pedido de DINHEIRO ou CÓDIGO.', { emoji: '🕵️' }),
          ...irPara('escudodigital.org.br', '/golpe-ou-nao'),
          esperar('Leia cada mensagem e responda "É golpe" ou "É confiável". Acerte pelo menos 6 das 8.', 'seguranca:quiz-golpe', (d) => d.acertos >= 6, { destacar: nav('.es-respostas'), mouse: 'esquerdo', dica: 'Se acertar menos de 6, clique em "Jogar de novo" e preste atenção nas explicações.' }),
          quiz('O "parente com número novo" pede um Pix urgente. Antes de tudo, eu...', ['Ligo para o número antigo e confirmo', 'Faço o Pix', 'Mando a senha'], 0),
          quiz('Endereços do governo terminam com...', ['.gov.br', '.net', '.com.ru'], 0),
        ],
        conclusao: 'Detetive de golpes! 🕵️',
      },
      {
        id: 'n3-seg-backup', titulo: 'Backup: cópia de segurança', icone: '💾',
        descricao: 'Guardar uma cópia dos seus arquivos no pen drive.',
        passos: [
          info('Computador pode quebrar, ser roubado ou pegar vírus. Quem tem BACKUP (uma cópia dos arquivos em outro lugar) não perde nada. Vamos fazer no pen drive.', { emoji: '💾' }),
          esperar('Conecte o pen drive: clique no ícone 🔌 na barra de tarefas, lá embaixo à direita.', 'pendrive:conectado', null, { destacar: '#status-pendrive', mouse: 'esquerdo', jaFeito: () => CE.pendrive.conectado }),
          abrir('configuracoes', 'Configurações', { preparar: () => { if (CE.janelas.estaAberta('configuracoes')) CE.janelas.abrir('configuracoes', { secao: 'backup' }); } }),
          esperar('Nas Configurações, clique em "Backup" e depois em "💾 Fazer backup no pen drive".', 'config:backup', null, { destacar: [naJanela('configuracoes', '[data-acao="backup"]'), naJanela('configuracoes', '[data-secao="backup"]')], mouse: 'esquerdo' }),
          abrir('arquivos', 'Arquivos'),
          esperar('No Arquivos, clique em "💾 Pen drive (E:)" e veja a pasta do backup.', 'pasta:aberta', (d) => d.local === 'pendrive', { destacar: naJanela('arquivos', '[data-pasta="pendrive"]'), mouse: 'esquerdo' }),
          info('Dica: além do pen drive, dá para guardar backup "na nuvem" (na internet, com senha forte). E faça backup sempre, não só uma vez!'),
          quiz('Backup é...', ['Uma cópia dos arquivos guardada em outro lugar', 'Um tipo de vírus', 'Apagar arquivos velhos'], 0),
          quiz('O melhor é fazer backup...', ['Sempre, de tempos em tempos', 'Só quando o computador quebrar', 'Nunca'], 0),
        ],
        conclusao: 'Seus arquivos estão garantidos! 💾',
      },
      {
        id: 'n3-seg-privacidade', titulo: 'Privacidade nas redes sociais', icone: '🔐',
        descricao: 'Escolher quem vê as suas fotos e informações.',
        passos: [
          info('Nas redes sociais, cuidado com o que fica aberto para TODO MUNDO: telefone, endereço, aniversário, foto dizendo que a casa está vazia... Bandido também usa rede social!', { emoji: '🔐' }),
          ...irPara('escudodigital.org.br', '/privacidade'),
          esperar('Proteja o perfil: publicações só para amigos, aniversário só para amigos, esconda o telefone e a localização. Depois clique em "Salvar configurações".', 'seguranca:privacidade', (d) => d.seguro, {
            destacar: nav('.es-config'), mouse: 'esquerdo', dica: 'Olhe a prévia ao lado: ela mostra o que um desconhecido vê.',
          }),
          quiz('Posso publicar "Saindo de férias, casa vazia por 15 dias"?', ['Melhor não: avisa os ladrões', 'Pode, todo mundo faz'], 0),
          quiz('Quem deve ver as minhas publicações?', ['Só os amigos', 'Qualquer pessoa do mundo'], 0),
        ],
        conclusao: 'Perfil protegido! 🔐',
      },
      {
        id: 'n3-seg-boatos', titulo: 'Fake news: boato ou verdade?', icone: '📰',
        descricao: 'Conferir antes de acreditar e de compartilhar.',
        passos: [
          info('FAKE NEWS são notícias falsas feitas para assustar, enganar ou fazer você compartilhar. Antes de repassar: confira a FONTE, a DATA e procure a notícia em outros sites.', { emoji: '📰' }),
          ...irPara('escudodigital.org.br', '/boato'),
          esperar('Leia cada notícia e decida: boato ou verdade? Acerte pelo menos 4 das 6.', 'seguranca:boato', (d) => d.acertos >= 4, { destacar: nav('.es-respostas'), mouse: 'esquerdo' }),
          esperar('Agora confira uma notícia de verdade: pesquise no Procura (procura.com.br):  vacina', 'navegador:pesquisa', (d) => /vacina/i.test(d.termo), { destacar: nav('.nav-endereco-caixa'), dica: 'Pode escrever "vacina" direto na barra de endereço e apertar Enter.' }),
          quiz('Uma mensagem diz "URGENTE! COMPARTILHE COM TODOS!". Isso é sinal de...', ['Boato', 'Notícia confiável'], 0),
          quiz('Antes de compartilhar uma notícia, eu...', ['Confiro em sites confiáveis', 'Compartilho logo para ajudar'], 0),
        ],
        conclusao: 'Caçador de boatos! Você ajuda a parar as fake news. 📰',
      },
      {
        id: 'n3-seg-desafio', titulo: 'Desafio da segurança digital', icone: '🏅', desafio: true,
        descricao: 'Mostre que você está protegido, sem ajuda.',
        passos: [
          info('Desafio! Use o site escudodigital.org.br. Clique em "Continuar".'),
          esperar('Teste uma senha FORTE.', 'seguranca:senha', (d) => d.forca === 'forte'),
          esperar('Ative a verificação em duas etapas.', 'seguranca:2etapas', null, { ...pularSe(async () => !!(CE.navegadorEstado.duasEtapas && CE.navegadorEstado.duasEtapas.ativada)) }),
          esperar('No "Golpe ou não?", acerte pelo menos 7 das 8.', 'seguranca:quiz-golpe', (d) => d.acertos >= 7),
          esperar('Deixe o perfil da rede social protegido.', 'seguranca:privacidade', (d) => d.seguro),
        ],
        conclusao: 'Desafio vencido! Você é um guardião digital. 🛡️',
      },
    ],
  });

  CE.adicionarModulo({
    id: 'n3-trabalho', nivel: 'n3', titulo: 'Computador e trabalho', icone: '💼',
    licoes: [
      {
        id: 'n3-tr-curriculo', titulo: 'Currículo completo em PDF', icone: '📄',
        descricao: 'Montar o currículo e salvar em PDF.',
        passos: [
          info('O CURRÍCULO é o seu cartão de visitas para o emprego. Regras: uma ou duas páginas, informações verdadeiras, sem erros de português, e um e-mail sério (nada de "gatinha123").', { emoji: '📄' }),
          abrir('editor', 'Editor de Texto'),
          editorNovo('curriculo', 'Currículo'),
          confere('Troque [Seu nome completo] pelo seu nome.', () => !/\[Seu nome completo\]/.test(texto()), { destacar: naJanela('editor', '.campo-modelo'), mouse: 'esquerdo' }),
          confere('Preencha o endereço, o telefone e o e-mail.', () => !/\[Endereço\]|\[Telefone\]|\[E-mail\]/.test(texto())),
          confere('No OBJETIVO, escreva a vaga que você quer (ex.: Auxiliar administrativo).', () => !/\[Ex\.: Vaga de/.test(texto())),
          confere('Preencha a FORMAÇÃO, a EXPERIÊNCIA e as HABILIDADES (troque todos os campos entre colchetes). Em habilidades, não esqueça: informática!', () => !/\[[^\]]+\]/.test(texto()), {
            dica: 'Se não tiver experiência, escreva trabalhos voluntários, bicos ou cursos.',
          }),
          esperar('Passe o corretor: clique em "✔️ Ortografia" e corrija o que aparecer (botão direito em cada palavra sublinhada).', 'editor:ortografia', (d) => d.restantes === 0, { destacar: naJanela('editor', '[data-comando="ortografia"]'), mouse: 'esquerdo' }),
          editorSalvar('Meu currículo'),
          esperar('Agora clique em "📕 PDF" e salve o PDF com o nome "Meu currículo".', 'editor:pdf', (d) => /curr[ií]culo/i.test(d.nome), { destacar: naJanela('editor', '[data-comando="pdf"]'), mouse: 'esquerdo' }),
          quiz('O currículo deve ter...', ['Informações verdadeiras e sem erros', 'Muitas cores e desenhos', 'Dez páginas'], 0),
          quiz('Para mandar o currículo, o melhor formato é...', ['PDF', 'Foto tirada do celular', 'Desenho'], 0),
        ],
        conclusao: 'Currículo pronto! Agora é procurar a vaga. 💼',
      },
      {
        id: 'n3-tr-email', titulo: 'E-mail profissional', icone: '📧',
        descricao: 'Mandar o currículo do jeito certo.',
        passos: [
          info('E-mail para empresa é diferente de mensagem para amigo. Tem: ASSUNTO claro, SAUDAÇÃO ("Prezados", "Bom dia"), texto curto e educado, DESPEDIDA ("Atenciosamente") e o seu NOME. E o currículo vai ANEXADO em PDF.', {
            emoji: '📧', preparar: () => garantirArquivo('Meu currículo', CURRICULO_PDF, 'pdf'),
          }),
          abrir('email', 'E-mail'),
          criarContaSePrecisar(),
          esperar('Clique em "Escrever". Para: rh@empresaboa.com.br · Assunto: Currículo – Auxiliar administrativo. No texto, comece com "Prezados," e termine com "Atenciosamente," e o seu nome. Anexe o PDF "Meu currículo" e envie.', 'email:enviado',
            (d) => d.para === 'rh@empresaboa.com.br' && /curr[ií]culo/i.test(d.assunto) && (d.tiposAnexos || []).includes('pdf') && /prezad|bom dia|boa tarde|ol[aá]/i.test(d.texto) && /atenciosamente|obrigad|grato|grata/i.test(d.texto), {
              destacar: em('[data-acao="escrever"]'), mouse: 'esquerdo', dica: 'Exemplo de texto: Prezados, bom dia! Envio em anexo o meu currículo para a vaga de auxiliar administrativo. Fico à disposição. Atenciosamente, (seu nome)',
            }),
          esperar('Espere a resposta do RH chegar na Caixa de entrada e abra a mensagem.', 'email:aberto', (d) => /rh@empresaboa/.test(d.de || '') || /^Re:/i.test(d.assunto || ''), { destacar: em('[data-pasta="entrada"]'), mouse: 'esquerdo' }),
          quiz('Qual assunto é melhor para mandar o currículo?', ['Currículo – Auxiliar administrativo', 'oi', '(sem assunto)'], 0),
          quiz('Qual e-mail é melhor para o currículo?', ['maria.souza@correio.escola', 'gatinha_123@correio.escola'], 0),
        ],
        conclusao: 'Seu e-mail ficou profissional! 📧',
      },
      {
        id: 'n3-tr-vagas', titulo: 'Procurar vagas na internet', icone: '🔎',
        descricao: 'Filtrar vagas, se candidatar e fugir de golpes.',
        passos: [
          info('Sites de emprego mostram vagas e deixam você se candidatar mandando o currículo. Mas cuidado: também tem vaga FALSA!', { emoji: '🔎', preparar: () => garantirArquivo('Meu currículo', CURRICULO_PDF, 'pdf') }),
          ...irPara('empregaja.com.br'),
          esperar('Use o filtro: escolha a cidade "Porto Velho" e clique em "🔍 Filtrar".', 'vagas:filtro', (d) => d.cidade === 'Porto Velho', { destacar: nav('[data-campo="cidade"]'), mouse: 'esquerdo' }),
          visitar('Clique na vaga "Auxiliar administrativo" para ver os detalhes.', (d) => d.caminho === '/vaga', { destacar: nav('[data-vaga="aux-adm"]') }),
          esperar('Leia os requisitos e clique em "📨 Candidatar-se". Preencha nome, e-mail, escolha o arquivo "Meu currículo" e clique em "Enviar candidatura".', 'vagas:candidatura', (d) => /curr[ií]culo/i.test(d.curriculo), { destacar: [nav('.vg-form'), nav('[data-candidatar]')], mouse: 'esquerdo' }),
          visitar('Agora volte para a lista de vagas e abra a vaga "💰 Trabalhe em casa: ganhe R$ 5.000 por semana!!!".', (d) => d.caminho === '/vaga' && /golpe/.test(d.url), { destacar: [nav('[data-vaga="golpe"]'), nav('.vg-pagina a[data-link="empregaja.com.br"]')] }),
          info('Repare nos sinais de golpe: salário alto demais, "sem experiência", pressa ("restam 3 vagas") e, principalmente, COBRAR TAXA. Emprego de verdade NUNCA cobra para você trabalhar!', { emoji: '🚨' }),
          quiz('Uma vaga pede R$ 49,90 de "taxa de inscrição". É...', ['Golpe', 'Normal'], 0),
          quiz('Antes de se candidatar, é bom...', ['Ler os requisitos da vaga', 'Mandar para todas sem ler'], 0),
        ],
        conclusao: 'Agora você procura emprego pela internet com segurança! 💼',
      },
      {
        id: 'n3-tr-entrevista', titulo: 'Entrevista por vídeo', icone: '🎥',
        descricao: 'Câmera, microfone e etiqueta numa videochamada.',
        passos: [
          info('Muitas entrevistas são por VÍDEO. Antes: escolha um lugar silencioso, com luz de FRENTE para o rosto, fundo arrumado, roupa adequada, e entre 5 minutos antes.', { emoji: '🎥' }),
          ...irPara('reuniao.escola'),
          esperar('Antes de entrar, ligue a câmera e o microfone nos botões.', ['reuniao:camera', 'reuniao:microfone'], () => { const r = CE.navegadorEstado.reuniao; return !!(r && r.camera && r.microfone); }, { destacar: [nav('[data-alternar="camera"]:not(.ligado)'), nav('[data-alternar="microfone"]:not(.ligado)')], mouse: 'esquerdo' }),
          esperar('Clique em "Entrar na reunião".', 'reuniao:entrou', null, { destacar: nav('[data-acao="entrar-reuniao"]'), mouse: 'esquerdo' }),
          esperar('Quando quiser falar numa reunião com muita gente, "levante a mão": clique em "✋ Levantar a mão".', 'reuniao:mao', (d) => d.ligado, { destacar: nav('[data-alternar="mao"]'), mouse: 'esquerdo' }),
          esperar('No chat, escreva uma mensagem educada agradecendo a oportunidade e aperte Enter.', 'reuniao:chat', (d) => /obrigad|agrade/i.test(d.texto), { destacar: nav('[data-campo="chat"]'), mouse: 'esquerdo' }),
          esperar('Quando não estiver falando, desligue o microfone (assim o barulho de casa não atrapalha).', 'reuniao:microfone', (d) => !d.ligado, { destacar: nav('.rn-barra [data-alternar="microfone"]'), mouse: 'esquerdo' }),
          esperar('A entrevista acabou: clique em "📞 Sair".', 'reuniao:saiu', null, { destacar: nav('[data-acao="sair-reuniao"]'), mouse: 'esquerdo' }),
          quiz('Numa entrevista por vídeo, a luz deve ficar...', ['De frente para o rosto', 'Atrás da cabeça', 'Apagada'], 0),
          quiz('Quando não estou falando numa reunião com várias pessoas, eu...', ['Deixo o microfone desligado', 'Deixo a TV ligada alta'], 0),
        ],
        conclusao: 'Pronto para a entrevista! Boa sorte! 🍀',
      },
      {
        id: 'n3-tr-desafio', titulo: 'Desafio do trabalho', icone: '🏅', desafio: true,
        descricao: 'Candidatura completa, sem ajuda.',
        passos: [
          info('Desafio! Faça a candidatura completa sozinho. Clique em "Continuar".', { preparar: () => garantirArquivo('Meu currículo', CURRICULO_PDF, 'pdf') }),
          esperar('No site empregaja.com.br, candidate-se à vaga de RECEPCIONISTA em Ji-Paraná, com o seu currículo.', 'vagas:candidatura', (d) => d.vaga === 'recepcao' && d.curriculo),
          esperar('Mande um e-mail profissional para rh@empresaboa.com.br com o currículo em PDF anexado.', 'email:enviado', (d) => d.para === 'rh@empresaboa.com.br' && (d.tiposAnexos || []).includes('pdf') && /atenciosamente|obrigad/i.test(d.texto)),
          esperar('Entre na entrevista em reuniao.escola com a câmera e o microfone ligados.', 'reuniao:entrou', (d) => d.camera && d.microfone),
        ],
        conclusao: 'Desafio vencido! Você está pronto para o mercado de trabalho. 💼',
      },
    ],
  });
})();
