// Nível 1 — Módulo 8: Segurança básica. Módulo 9: Prova do nível Iniciante.
(function () {
  const { info, quiz, esperar } = CE.L;

  CE.adicionarModulo({
    id: 'n1-seguranca', nivel: 'n1', titulo: 'Segurança básica', icone: '🛡️',
    licoes: [
      {
        id: 'seg-senhas', titulo: 'Senhas seguras', icone: '🔑',
        descricao: 'Criar e guardar senhas do jeito certo.',
        passos: [
          info('A senha é a chave da sua conta, como a chave da sua casa. Quem tem a senha consegue entrar no seu e-mail, no banco e nas redes sociais.', { emoji: '🔑' }),
          info('Uma senha FRACA é fácil de adivinhar: 123456, a sua data de nascimento, o seu nome ou "senha". Uma senha FORTE é comprida e mistura letras, números e símbolos. Ex.: Sol!Azul#2025', { emoji: '💪' }),
          quiz('Qual destas senhas é a mais FORTE?', ['123456', 'maria1980', 'Cafe!Quente#47'], 2, 'Ela é comprida e mistura letras maiúsculas, minúsculas, números e símbolos.'),
          info('Regras de ouro: não conte a sua senha para ninguém (nem para quem diz ser do banco), não use a mesma senha em tudo e não anote em papel colado no computador.', { emoji: '🤫' }),
          quiz('Alguém liga dizendo ser do banco e pede a sua senha. O que fazer?', ['Passar a senha, porque é do banco', 'Não passar. O banco NUNCA pede a senha', 'Passar só metade da senha'], 1),
          quiz('Onde NÃO devo guardar a minha senha?', ['Num papel colado no monitor', 'Na minha memória', 'Num lugar seguro, só meu'], 0),
          quiz('Usar a mesma senha em todos os sites é...', ['Perigoso: se descobrirem uma, entram em tudo', 'O mais seguro', 'Obrigatório'], 0),
        ],
        conclusao: 'Muito bem! Senha forte e guardada em segredo é a sua primeira proteção.',
      },
      {
        id: 'seg-golpes', titulo: 'Cuidado com golpes', icone: '🎣',
        descricao: 'Reconhecer mensagens falsas de prêmio, parentes e bancos.',
        passos: [
          info('Golpistas tentam enganar as pessoas por mensagens, ligações e e-mails. Eles usam PRESSA, MEDO ou PRÊMIOS para a gente agir sem pensar.', { emoji: '🎣' }),
          info('Mensagem: "PARABÉNS! Você ganhou um celular novo! Clique no link e pague só o frete de R$ 19,90." Isso é um golpe clássico: ninguém ganha prêmio de um sorteio do qual não participou.', { emoji: '🎁' }),
          quiz('Você recebe: "Você ganhou um prêmio! Clique no link para receber." O que fazer?', ['Clicar logo, antes que acabe', 'Não clicar e apagar a mensagem', 'Mandar para todos os amigos'], 1),
          info('Mensagem: "Oi mãe, troquei de número. Estou com um problema e preciso que você faça um Pix urgente." O golpista finge ser um parente. Antes de qualquer coisa, LIGUE para o número antigo da pessoa.', { emoji: '📱' }),
          quiz('Um "filho" manda mensagem de um número novo pedindo dinheiro com urgência. O que fazer primeiro?', ['Fazer o Pix rápido', 'Ligar para o número antigo e confirmar se é ele mesmo', 'Mandar a senha do banco'], 1),
          info('Mensagem: "Sua conta do banco foi bloqueada! Informe o código que chegou por SMS para desbloquear." O banco NUNCA pede códigos ou senhas por mensagem ou ligação.', { emoji: '🏦' }),
          quiz('Chegou um código por SMS e alguém pede para você falar esse código. Você deve...', ['Falar o código', 'Nunca passar códigos para ninguém', 'Passar só se a pessoa for educada'], 1),
          quiz('Qual destes é um SINAL de golpe?', ['Pressa: "responda agora ou vai perder"', 'Uma mensagem de um amigo dizendo bom dia', 'Uma conta de luz que você já conhece'], 0),
          quiz('Na dúvida se uma mensagem é golpe, o melhor é...', ['Clicar para ver o que acontece', 'Desconfiar, não clicar e perguntar para alguém de confiança', 'Responder com seus dados'], 1),
        ],
        conclusao: 'Parabéns! Agora fica bem mais difícil alguém te enganar. Desconfiar é proteger.',
      },
      {
        id: 'seg-cuidados', titulo: 'Cuidados no dia a dia', icone: '🧭',
        descricao: 'Dados pessoais, computador público e notícias falsas.',
        passos: [
          info('Seus dados pessoais (CPF, endereço, fotos dos documentos, número do cartão) são valiosos. Só informe em sites e lugares que você confia de verdade.', { emoji: '🪪' }),
          quiz('Um site desconhecido pede a foto do seu documento e o número do cartão para dar um "brinde". Você...', ['Manda, porque é brinde', 'Não manda: pode ser golpe', 'Manda só o cartão'], 1),
          info('Em computador público (escola, lan house, biblioteca), sempre clique em "Sair" da sua conta quando terminar. Senão, a próxima pessoa pode entrar no seu e-mail!', { emoji: '🚪' }),
          quiz('Terminei de usar meu e-mail num computador da escola. O que faço?', ['Clico em "Sair" da conta', 'Deixo aberto para a próxima vez', 'Desligo o monitor'], 0),
          info('Notícias falsas (fake news) espalham mentiras. Antes de compartilhar, desconfie de títulos assustadores, veja se outros sites conhecidos falam a mesma coisa e olhe a data.', { emoji: '📰' }),
          quiz('Recebi uma notícia muito assustadora num grupo. O que faço antes de compartilhar?', ['Compartilho logo para avisar todo mundo', 'Verifico se é verdade em fontes confiáveis', 'Mudo o texto e compartilho'], 1),
          quiz('Qual destes é um dado pessoal que devo proteger?', ['O número do meu CPF', 'A cor que eu mais gosto', 'O nome do meu time'], 0),
        ],
        conclusao: 'Excelente! Você está pronto para usar o computador e a internet com segurança.',
      },
    ],
  });

  CE.adicionarModulo({
    id: 'n1-prova', nivel: 'n1', titulo: 'Prova do nível Iniciante', icone: '🏆',
    licoes: [
      {
        id: 'prova-n1', titulo: 'Prova do nível Iniciante', icone: '🏆', prova: true, desafio: true,
        descricao: 'Tarefas práticas e perguntas sobre tudo o que você aprendeu. Precisa de 70% para passar.',
        passos: [
          info('Chegou a hora da prova do nível Iniciante! Você vai fazer algumas tarefas sozinho e responder perguntas. Precisa acertar pelo menos 70% das perguntas. Respire fundo e boa sorte! Clique em "Continuar".', { emoji: '🏆' }),
          esperar('Tarefa 1: abra a Calculadora e faça a conta 25 + 17.', 'calculadora:resultado', (d) => d.a === 25 && d.b === 17 && d.operacao === '+'),
          esperar('Tarefa 2: feche a Calculadora.', 'janela:fechada', (d) => d.app === 'calculadora'),
          esperar('Tarefa 3: abra o Editor de Texto, escreva o seu nome completo em NEGRITO e salve com o nome: Prova', 'arquivo:salvo',
            (d) => d.tipo === 'documento' && d.nome.trim().toLowerCase() === 'prova' && /<b>|<strong>|font-weight/i.test(d.conteudo)),
          esperar('Tarefa 4: abra o programa Arquivos e mude o nome do documento "Prova" para: Prova concluída', 'arquivo:renomeado', (d) => /prova conclu/i.test(d.nome)),
          esperar('Tarefa 5: abra o Navegador e pesquise: Floresta Amazônica', 'navegador:pesquisa', (d) => /amaz/i.test(d.termo.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))),
          quiz('Qual é o jeito certo de desligar o computador?', ['Puxar o fio da tomada', 'Botão Iniciar e depois "Desligar"', 'Apertar o botão do monitor'], 1),
          quiz('A impressora é um aparelho de...', ['Entrada', 'Saída', 'Armazenamento'], 1),
          quiz('Para abrir um programa pelo ícone, eu dou...', ['Um clique com o botão direito', 'Um clique duplo', 'Um giro na rodinha'], 1),
          quiz('Para fazer UMA letra maiúscula, eu...', ['Seguro o Shift e aperto a letra', 'Aperto o Caps Lock duas vezes', 'Aperto o Enter'], 0),
          quiz('O botão com um tracinho (–) no canto da janela serve para...', ['Fechar o programa', 'Minimizar (esconder na barra de tarefas)', 'Salvar'], 1),
          quiz('Excluí um arquivo sem querer. Onde posso recuperar?', ['Na Lixeira', 'Na Calculadora', 'Não tem como recuperar'], 0),
          quiz('Para deixar uma palavra em negrito, primeiro eu...', ['Seleciono a palavra', 'Salvo o documento', 'Fecho o Editor'], 0),
          quiz('Qual destas senhas é mais segura?', ['123456', 'Lua#Verde!82', 'joao'], 1),
          quiz('Alguém pede por mensagem o código que chegou no seu SMS. Você...', ['Passa o código', 'Não passa: é golpe', 'Passa só se for rápido'], 1),
          quiz('A tecla Backspace serve para...', ['Apagar a letra antes do cursor', 'Pular de linha', 'Deixar tudo em maiúsculas'], 0),
          quiz('Qual destes sinais mostra que um site é mais seguro?', ['O cadeado 🔒 na barra de endereço', 'Escrito "Não seguro"', 'Um anúncio piscando'], 0),
          quiz('Um site oferece celular por R$ 99 "só hoje". Isso provavelmente é...', ['Golpe', 'Uma ótima oferta', 'Um presente do governo'], 0),
          quiz('Para pesquisar algo na internet, eu uso...', ['Um buscador, como o Procura', 'A Calculadora', 'A Lixeira'], 0),
        ],
        conclusao: 'PARABÉNS! Você passou na prova e concluiu o nível Iniciante de informática! 🏆 Agora você usa o computador com confiança.',
      },
    ],
  });
})();
