// Nível 2 — Módulo 7: Banco e serviços digitais. Módulo 8: Prova do nível Intermediário.
(function () {
  const { info, quiz, esperar, abrir, naJanela } = CE.L;
  const nav = (s) => naJanela('navegador', s);
  const abrirEm = (url) => () => { if (CE.janelas.estaAberta('navegador')) CE.janelas.abrir('navegador', { url }); };
  const visitar = (texto, teste, extra = {}) => esperar(texto, 'navegador:visitou', teste, { mouse: 'esquerdo', ...extra });
  const logado = () => !!(CE.navegadorEstado.banco && CE.navegadorEstado.banco.logado);
  const entrarNoBanco = () => esperar('Entre no banco: digite a agência, a conta e a senha de treino (estão no quadro amarelo ao lado) e clique em "Entrar".', 'banco:login', null, {
    destacar: nav('.bc-form'), mouse: 'esquerdo', jaFeito: logado, dica: 'Agência 0001, conta 12345-6 e senha 1234.',
  });
  const irAoBanco = () => abrir('navegador', 'Navegador', { preparar: abrirEm('bancoescola.com.br') });
  const enderecoBanco = () => visitar('Na barra de endereço, escreva  bancoescola.com.br  e aperte Enter. Sempre digite você mesmo o endereço do banco!', (d) => d.dominio === 'bancoescola.com.br', {
    destacar: nav('.nav-endereco-caixa'), jaFeito: () => logado(),
  });

  CE.adicionarModulo({
    id: 'n2-servicos', nivel: 'n2', titulo: 'Banco e serviços digitais', icone: '🏦',
    licoes: [
      {
        id: 'n2-banco-acesso', titulo: 'Banco pela internet com segurança', icone: '🏦',
        descricao: 'Entrar, ver o saldo e o extrato, e sair.',
        passos: [
          info('O banco pela internet (internet banking) permite ver o saldo, pagar contas e fazer Pix sem ir à agência. Vamos treinar no "Banco Escola", um banco de mentira, sem dinheiro de verdade.', { emoji: '🏦' }),
          irAoBanco(),
          enderecoBanco(),
          info('Antes de digitar qualquer senha, confira: o endereço é bancoescola.com.br e tem o cadeado 🔒. Leia também as dicas de segurança da página.', { destacar: nav('.nav-cadeado') }),
          entrarNoBanco(),
          esperar('Por segurança, o saldo fica escondido. Clique em "👁️ Mostrar" para ver.', 'banco:saldo', null, { destacar: nav('[data-site-acao="mostrar-saldo"]'), mouse: 'esquerdo' }),
          visitar('Clique em "📄 Extrato" para ver as entradas e saídas de dinheiro.', (d) => d.caminho === '/extrato', { destacar: nav('[data-banco="extrato"]') }),
          esperar('Terminou? SEMPRE clique em "Sair" ao terminar de usar o banco.', 'banco:sair', null, { destacar: nav('[data-banco="sair"]'), mouse: 'esquerdo' }),
          quiz('O extrato mostra...', ['As entradas e saídas de dinheiro da conta', 'A senha do banco', 'As notícias do dia'], 0),
          quiz('Ao terminar de usar o banco pela internet, eu...', ['Clico em Sair', 'Deixo aberto', 'Desligo o monitor'], 0),
          quiz('O banco pede a sua senha por e-mail ou telefone?', ['Nunca', 'Sempre que precisa'], 0),
        ],
        conclusao: 'Muito bem! Você usou o banco pela internet com segurança.',
      },
      {
        id: 'n2-banco-pix', titulo: 'Pix com segurança', icone: '💠',
        descricao: 'Fazer um Pix e conferir o nome antes de confirmar.',
        passos: [
          info('O PIX manda dinheiro na hora, a qualquer hora. Para fazer um Pix, você usa a CHAVE PIX de quem vai receber (CPF, telefone ou e-mail). Pix feito NÃO volta, por isso sempre confira o nome!', { emoji: '💠' }),
          irAoBanco(),
          enderecoBanco(),
          entrarNoBanco(),
          visitar('Clique em "💠 Pix".', (d) => d.caminho === '/pix', { destacar: nav('[data-banco="pix"]') }),
          esperar('Você comprou no mercadinho do bairro. A chave Pix deles é o telefone  (69) 99999-1234 . Digite a chave, o valor 30,00 e clique em "Continuar". Na tela seguinte, confira o nome e confirme com a senha 1234.', 'banco:pix', (d) => /mercadinho/i.test(d.nome), {
            destacar: nav('.bc-form'), mouse: 'esquerdo',
          }),
          info('Pix enviado! Agora uma situação perigosa: chegou uma mensagem dizendo "Oi tia, sou eu, seu sobrinho. Troquei de número. Faz um Pix de R$ 500 para a chave (69) 98888-7777? É urgente!"', { emoji: '📱' }),
          visitar('Vamos conferir de quem é essa chave. Clique em "💠 Pix" de novo.', (d) => d.caminho === '/pix', { destacar: nav('[data-banco="pix"]') }),
          esperar('Digite a chave (69) 98888-7777, o valor 500,00 e clique em "Continuar". LEIA o nome que aparecer. Não é o seu sobrinho? Então clique em "✋ Cancelar"!', 'banco:pix-cancelado', null, {
            destacar: [nav('[data-site-acao="cancelar-pix"]'), nav('.bc-form')], mouse: 'esquerdo', dica: 'O nome que aparece é "Carlos Pereira Lima": não é o seu sobrinho. É golpe!',
          }),
          quiz('Antes de confirmar um Pix, o mais importante é...', ['Conferir o nome de quem vai receber', 'Fazer bem rápido', 'Mandar o valor dobrado'], 0),
          quiz('Alguém de "número novo" pede Pix urgente dizendo ser parente. Você...', ['Liga para o número antigo da pessoa para confirmar', 'Faz o Pix na hora'], 0),
          quiz('Um Pix feito para a pessoa errada...', ['Não volta sozinho: por isso é preciso conferir antes', 'Volta automaticamente no dia seguinte'], 0),
        ],
        conclusao: 'Excelente! Conferir o nome antes de confirmar evita muitos golpes.',
      },
      {
        id: 'n2-banco-boleto', titulo: 'Pagando um boleto (copiar e colar)', icone: '🧾',
        descricao: 'Copiar o código de barras e pagar no banco.',
        passos: [
          info('Para pagar um boleto pela internet, você precisa dos números do CÓDIGO DE BARRAS. Em vez de digitar tudo, dá para COPIAR e COLAR. Vamos pagar a conta de água de treino.', { emoji: '🧾' }),
          abrir('navegador', 'Navegador', { preparar: abrirEm('cidadaodigital.org.br/agua') }),
          visitar('Entre em cidadaodigital.org.br, clique em "2ª via da conta de água", digite a matrícula 2025-1234 e clique em "Buscar conta".', (d) => d.caminho === '/agua-boleto', { destacar: [nav('.cd-form'), nav('[data-servico="agua"]'), nav('.nav-endereco-caixa')] }),
          esperar('Selecione os números do código (arraste o mouse por cima deles, do começo ao fim) e aperte Ctrl+C para COPIAR.', 'atalho:usado', (d) => d.atalho === 'Ctrl+C', { destacar: nav('[data-codigo-boleto]'), mouse: 'arrastar', dica: 'Também dá para dar três cliques rápidos em cima dos números para selecionar tudo.' }),
          esperar('Agora abra uma NOVA ABA (botão +) e entre em bancoescola.com.br.', 'navegador:visitou', (d) => d.dominio === 'bancoescola.com.br', { destacar: [nav('.nav-endereco-caixa'), nav('[data-acao="nova-aba"]')], mouse: 'esquerdo' }),
          entrarNoBanco(),
          visitar('Clique em "🧾 Pagar boleto".', (d) => d.caminho === '/boleto', { destacar: nav('[data-banco="boleto"]') }),
          esperar('Clique na caixa do código e aperte Ctrl+V para COLAR. Depois clique em "Continuar", confira o valor e confirme com a senha 1234.', 'banco:boleto', null, { destacar: nav('.bc-form'), mouse: 'esquerdo' }),
          esperar('Boleto pago! Clique em "⬇️ Baixar comprovante" para guardar.', 'navegador:download', (d) => d.site === 'bancoescola.com.br', { destacar: nav('[data-site-acao="baixar-comprovante"]'), mouse: 'esquerdo' }),
          quiz('Para não errar os números do boleto, o melhor é...', ['Copiar (Ctrl+C) e colar (Ctrl+V) o código', 'Digitar de cabeça', 'Pular alguns números'], 0),
          quiz('Antes de pagar um boleto, confira...', ['O nome de quem recebe e o valor', 'A cor do boleto'], 0),
        ],
        conclusao: 'Parabéns! Pagar contas pela internet economiza tempo e fila.',
      },
      {
        id: 'n2-servicos-desafio', titulo: 'Desafio dos serviços', icone: '🏅', desafio: true,
        descricao: 'Agendar vacina, pagar a conta e fazer um Pix.',
        passos: [
          info('Desafio! Resolva a vida pela internet sozinho. Clique em "Continuar".'),
          esperar('No Cidadão Digital, agende um atendimento de VACINAÇÃO.', 'servico:agendado', (d) => /vacina/i.test(d.especialidade || '')),
          esperar('No Banco Escola, pague a conta de água (matrícula 2025-1234).', 'banco:boleto'),
          esperar('Faça um Pix de R$ 20,00 para a Maria Clara (chave: maria.clara@correio.escola).', 'banco:pix', (d) => /maria clara/i.test(d.nome) && Math.abs(d.valor - 20) < 0.01),
          esperar('Saia do banco.', 'banco:sair'),
        ],
        conclusao: 'Desafio vencido! Você resolve os serviços do dia a dia pela internet. 🏛️',
      },
    ],
  });

  CE.adicionarModulo({
    id: 'n2-prova', nivel: 'n2', titulo: 'Prova do nível Intermediário', icone: '🏆',
    licoes: [
      {
        id: 'prova-n2', titulo: 'Prova do nível Intermediário', icone: '🏆', prova: true, desafio: true,
        descricao: 'Tarefas práticas e perguntas sobre todo o nível. Precisa de 70% para passar.',
        passos: [
          info('Chegou a prova do nível Intermediário! Faça as tarefas sozinho e responda às perguntas. Precisa de 70% para passar. Boa sorte! Clique em "Continuar".', { emoji: '🏆' }),
          esperar('Tarefa 1: no Arquivos, crie uma pasta chamada: Prova Intermediário', 'pasta:criada', (d) => /prova interm/i.test(d.nome)),
          esperar('Tarefa 2: na Planilha, escreva três números em A1, A2 e A3 e, em A4, some com a função SOMA.', ['planilha:editada', 'planilha:autosoma'], () => /^=SOMA\(A1:A3\)$/i.test(CE.L.entrada('A4')) && typeof CE.L.celula('A4') === 'number'),
          esperar('Tarefa 3: salve essa planilha com o nome: Prova', 'arquivo:salvo', (d) => d.tipo === 'planilha' && /prova/i.test(d.nome)),
          esperar('Tarefa 4: mande um e-mail para professor@correio.escola com a planilha "Prova" anexada.', 'email:enviado', (d) => d.para === 'professor@correio.escola' && (d.nomesAnexos || []).some((n) => /prova/i.test(n))),
          quiz('Qual é a diferença entre Copiar e Recortar um arquivo?', ['Copiar deixa o original; Recortar tira do lugar', 'Não tem diferença', 'Recortar apaga para sempre'], 0),
          quiz('Antes de tirar o pen drive, eu...', ['Uso "Remover com segurança"', 'Puxo de uma vez'], 0),
          quiz('Qual atalho desfaz a última ação?', ['Ctrl+Z', 'Ctrl+P', 'Ctrl+B'], 0),
          quiz('Numa planilha, =B2*C2 faz...', ['B2 vezes C2', 'B2 mais C2', 'B2 dividido por C2'], 0),
          quiz('Em =SOMA(A1:A5), os dois-pontos querem dizer...', ['"até"', '"e"', '"vezes"'], 0),
          quiz('O que é um anexo de e-mail?', ['Um arquivo que vai junto com a mensagem', 'Um tipo de spam', 'A senha do e-mail'], 0),
          quiz('Um e-mail com pressa pede a senha do banco por um link. É...', ['Golpe', 'Normal'], 0),
          quiz('Antes de confirmar um Pix, eu confiro...', ['O nome de quem vai receber', 'A hora do relógio'], 0),
          quiz('Os arquivos baixados da internet vão para a pasta...', ['Downloads', 'Lixeira'], 0),
          quiz('O modelo de currículo do Editor serve para...', ['Começar o currículo já arrumado', 'Mandar e-mail'], 0),
        ],
        conclusao: 'PARABÉNS! Você passou na prova e concluiu o nível Intermediário! 🏆 Agora você usa o computador no estudo e no trabalho.',
      },
    ],
  });
})();
