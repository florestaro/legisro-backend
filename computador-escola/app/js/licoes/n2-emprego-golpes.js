// Nível 2 — Trabalho e golpes de agora.
// • Trabalho: o currículo de verdade, montado com as respostas da entrevista de emprego da Praça Escola, e a prova
//   prática (cronometrada) de um processo seletivo: e-mail para o RH, ficha em PDF, assinatura e devolução.
// • Golpes de agora: os golpes que mais aparecem hoje e que o curso ainda não mostrava (falso advogado, emprego de
//   "tarefas pagas", boleto falso e Pix "por engano"). Atualizado em novembro de 2026: revisar de tempos em tempos.
// Entram antes da prova do nível; para quem já tinha passado na prova antes, ficam opcionais.
(function () {
  const { info, quiz, esperar, abrir, naJanela, editorSalvar } = CE.L;
  const ed = (s) => naJanela('editor', s);
  const em = (s) => naJanela('email', s);
  const pdf = (s) => naJanela('leitor-pdf', s);
  const NOVO_EM = '2026-11-15';
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const campo = (t) => `<span class="campo-modelo">[${t}]</span>`;
  const semCampos = (d) => !/\[[^\]]*\]/.test(d.texto);

  // ---------- O currículo, com as respostas da entrevista da Praça Escola ----------
  async function curriculoDaEntrevista() {
    const e = await CE.api.chamar('praca:minha-entrevista').catch(() => null);
    const u = CE.sessao.usuario || {};
    const nome = esc((e && e.nome) || u.nome || 'Seu nome completo');
    const fortes = (e && e.fortes && e.fortes.length ? e.fortes : ['Pontual', 'Gosta de aprender', 'Trata bem as pessoas']).map(esc);
    const objetivo = e && e.motivo ? esc(e.motivo) : 'Trabalhar com atendimento e rotinas de escritório.';
    return `<div style="text-align: center;"><font size="6">${nome}</font></div>
      <div style="text-align: center;">${e && e.idade ? `${e.idade} anos · ` : ''}Porto Velho/RO · Telefone: ${campo('(69) 99999-1234')} · E-mail: ${campo('seu e-mail do Correio')}</div><hr>
      <div><b>OBJETIVO</b></div><div>${objetivo}</div><div><br></div>
      <div><b>EXPERIÊNCIA</b></div><div>${esc((e && e.experiencia) || 'O trabalho que você já fez (ou quer fazer).')}</div><div><br></div>
      <div><b>QUALIDADES</b></div><ul>${fortes.map((f) => `<li>${f}</li>`).join('')}</ul>
      <div><b>CURSOS</b></div><ul><li>Informática — Computador Escola (cursando)</li></ul>`;
  }

  // ---------- A ficha do processo seletivo (vem por e-mail, do RH da prefeitura de treino) ----------
  let comecouEm = 0;
  const minutos = () => Math.max(1, Math.round((Date.now() - comecouEm) / 60000));

  CE.adicionarModulo({
    id: 'n2-emprego', nivel: 'n2', titulo: 'Trabalho: currículo e processo seletivo', icone: '💼', antes: 'n2-prova', novoEm: NOVO_EM,
    licoes: [
      {
        id: 'n2-emp-curriculo', titulo: 'Meu currículo (com a entrevista da Praça)', icone: '📄',
        descricao: 'Transformar as respostas da entrevista de emprego num currículo, em PDF, e mandar para uma vaga.',
        passos: [
          info('Lembra da entrevista de emprego da Praça Escola? Com as suas respostas, já dá para montar um CURRÍCULO de verdade: o papel que apresenta você para a empresa. Clique em "Continuar".', { emoji: '💼' }),
          info('Abrimos no Editor o seu currículo, já com o seu nome, a experiência e as qualidades que você contou na entrevista. (Se ainda não fez a entrevista, vem um exemplo para você trocar.)', {
            emoji: '📄', preparar: async () => { const html = await curriculoDaEntrevista(); await CE.L.abrirExemplo('Meu currículo', 'documento', html, true); },
          }),
          esperar('Repare: as coisas que você QUER MELHORAR não vão no currículo. No currículo vão as qualidades. Agora selecione o seu NOME, na primeira linha, e clique no N (negrito).', 'editor:formatado', (d) => d.comando === 'bold' && d.ativo !== false, {
            destacar: ed('[data-comando="bold"]'), mouse: 'arrastar', dica: 'Passe o mouse em cima do nome segurando o botão esquerdo, solte e clique no botão N.',
          }),
          esperar('Agora os campos amarelos: clique no telefone e escreva um número de treino; depois no e-mail e escreva o seu e-mail do Correio. Quando trocar os dois, os colchetes somem.', 'editor:texto', semCampos, {
            destacar: ed('.campo-modelo'), dica: 'Clique em cima do [ ] amarelo e escreva por cima dele.',
          }),
          editorSalvar('Meu currículo'),
          esperar('Currículo se manda em PDF (fica igual em qualquer computador). Clique em "📕 PDF", deixe o nome "Meu currículo" e clique em OK.', 'editor:pdf', (d) => /curr[ií]culo/i.test(d.nome), { destacar: ed('[data-comando="pdf"]'), mouse: 'esquerdo' }),
          abrir('email', 'E-mail'),
          esperar('Mande o currículo para a vaga: escreva para  rh@empresaboa.com.br , assunto "Currículo", uma mensagem educada e ANEXE o "Meu currículo" (o PDF). Envie.', 'email:enviado',
            (d) => d.para === 'rh@empresaboa.com.br' && d.anexos >= 1 && (d.nomesAnexos || []).some((n) => /curr[ií]culo/i.test(n)), {
              destacar: [em('[data-acao="anexar"]'), em('[data-acao="escrever"]')], mouse: 'esquerdo', dica: 'Clique em "📎 Anexar arquivo" e escolha "Meu currículo" (o que tem o ícone de PDF).',
            }),
          quiz('O que NÃO vai no currículo?', ['As coisas que eu ainda quero melhorar', 'O meu nome e o telefone', 'As minhas qualidades e os cursos'], 0, 'O que você quer melhorar é conversa para a entrevista, se perguntarem. No currículo vão as qualidades.'),
          quiz('Por que mandar o currículo em PDF?', ['Fica igual em qualquer computador e não muda sem querer', 'Porque é mais colorido', 'Porque não precisa de nome'], 0),
        ],
        conclusao: 'Currículo pronto, em PDF, e enviado! Ele está em Meus Documentos para você usar nas próximas vagas. 💼',
      },
      {
        id: 'n2-emp-pratica', titulo: 'Prova prática: processo seletivo', icone: '⏱️', desafio: true,
        descricao: 'Tarefa de verdade, cronometrada: e-mail para o RH, ficha em PDF preenchida, assinada e devolvida.',
        passos: [
          info('PROVA PRÁTICA! A Prefeitura Escola (de treino) abriu um processo seletivo. Você vai fazer tudo sozinho, como na vida real, e o relógio está contando. A meta é terminar em 15 minutos. Clique em "Continuar".', { emoji: '⏱️', preparar: () => { comecouEm = Date.now(); } }),
          abrir('email', 'E-mail'),
          esperar('1) Mande um e-mail para  selecao@prefeituraescola.gov.br  pedindo a ficha de inscrição (assunto: "Inscrição").', 'email:enviado', (d) => d.para === 'selecao@prefeituraescola.gov.br'),
          esperar('2) Abra a resposta do RH e BAIXE a ficha em PDF que veio anexada.', 'email:anexo-baixado', (d) => /ficha/i.test(d.nome)),
          esperar('3) Abra a ficha no Leitor de PDF (está na pasta Downloads), preencha TODOS os campos e salve preenchida.', 'pdf:formulario-salvo', (d) => d.preenchidos >= 5, {
            dica: 'No Leitor de PDF: Abrir › Downloads › "Ficha do processo seletivo". Depois de preencher, clique em "💾 Salvar preenchido".',
          }),
          esperar('4) Assine a ficha preenchida pelo Cidadão Digital (✍️ Assinar no Leitor de PDF).', 'gov:assinado', null, {
            dica: 'Sua Conta Cidadão precisa ser prata (você fez isso na aula "Assinar documento pelo gov.br").',
          }),
          esperar('5) Responda o e-mail do RH com a ficha ASSINADA anexada.', 'email:enviado',
            (d) => d.para === 'selecao@prefeituraescola.gov.br' && d.anexos >= 1 && (d.nomesAnexos || []).some((n) => /assinad/i.test(n))),
          esperar('6) Abra a resposta do RH e confira se a inscrição foi confirmada.', 'email:aberto', (d) => {
            const certo = d.de === 'selecao@prefeituraescola.gov.br' && /confirmad/i.test(d.assunto || '');
            // O tempo da prova vai na conclusão (calculado na hora em que termina).
            const l = certo && comecouEm && CE.curso.licao('n2-emp-pratica');
            if (l) { const m = minutos(); l.conclusao = `Inscrição confirmada! Você fez a prova prática em ${m} minuto${m > 1 ? 's' : ''}${m <= 15 ? ' (dentro da meta de 15) 🏆' : ' (a meta era 15: com treino, fica mais rápido)'}. Isso é exatamente o que se faz num processo seletivo de verdade.`; }
            return certo;
          }),
        ],
        conclusao: 'Inscrição confirmada! Isso é exatamente o que se faz num processo seletivo de verdade. 🏆',
      },
    ],
  });

  // ---------- Golpes de agora ----------
  CE.adicionarModulo({
    id: 'n2-golpes-agora', nivel: 'n2', titulo: 'Golpes de agora (atualizado)', icone: '🛡️', antes: 'n2-prova', novoEm: NOVO_EM,
    licoes: [
      {
        id: 'n2-golpe-advogado', titulo: 'O falso advogado e o "dinheiro do processo"', icone: '⚖️',
        descricao: 'Mensagem dizendo que você ganhou um processo e precisa pagar uma taxa para receber.',
        passos: [
          info('Chega uma mensagem no Zap, com foto de advogado e o símbolo da Justiça: "Dona Maria, a senhora GANHOU o processo! Para liberar os R$ 18.400,00, pague hoje as custas de R$ 950,00 por Pix." Tem até o número de um processo de verdade.', { emoji: '⚖️' }),
          info('É o golpe do FALSO ADVOGADO, um dos que mais cresceram. Os golpistas copiam dados de processos que ficam públicos na internet e se passam pelo advogado ou pelo fórum.', { emoji: '🚨' }),
          quiz('O que denuncia o golpe?', ['Cobrar taxa por Pix para liberar o dinheiro', 'Ter o número do processo', 'Ter foto de advogado'], 0, 'Dinheiro de processo não se libera pagando Pix para ninguém: as custas, quando existem, são pagas por guia oficial.'),
          quiz('O certo é...', ['Ligar para o seu advogado no número que você já tinha, ou ir ao fórum', 'Pagar logo para não perder o prazo', 'Mandar os seus documentos para conferir'], 0),
          quiz('A mensagem diz "é URGENTE, só até hoje". Isso é...', ['Pressa: o truque de sempre dos golpistas', 'Sinal de que é verdade'], 0),
        ],
        conclusao: 'Agora você sabe: advogado de verdade não cobra Pix por mensagem para liberar dinheiro. Na dúvida, ligue você para o escritório. ⚖️',
      },
      {
        id: 'n2-golpe-tarefas', titulo: 'Emprego falso: "ganhe curtindo vídeos"', icone: '📱',
        descricao: 'Proposta de trabalho fácil que paga pouco no começo e depois pede dinheiro.',
        passos: [
          info('"Trabalhe de casa! Ganhe R$ 300 por dia só curtindo vídeos e dando nota a hotéis." No primeiro dia, pagam mesmo uns R$ 20. Depois pedem um "depósito" para liberar tarefas que pagam mais... e somem com tudo.', { emoji: '📱' }),
          quiz('Emprego que pede para VOCÊ pagar para trabalhar é...', ['Golpe', 'Normal, é um investimento'], 0, 'Empresa séria paga você; não cobra para você trabalhar.'),
          quiz('Pagaram R$ 20 no primeiro dia. Isso prova que é sério?', ['Não: é a isca para você confiar e depositar mais', 'Sim, já pagaram'], 0),
          quiz('Onde procurar emprego com segurança?', ['Sites e agências conhecidas, como o Sine e a Agência de Empregos', 'Grupos de Zap com "renda extra garantida"'], 0),
        ],
        conclusao: 'Trabalho fácil demais, que pede depósito, é golpe. Procure vaga em lugares conhecidos. 💼',
      },
      {
        id: 'n2-golpe-boleto', titulo: 'Boleto falso e conta com "desconto"', icone: '🧾',
        descricao: 'Conferir quem recebe o boleto antes de pagar.',
        passos: [
          info('Chega no Zap: "Conta de energia com 50% de DESCONTO, pague hoje!" O boleto parece de verdade, com logotipo e código de barras. Mas o dinheiro vai para o golpista.', { emoji: '🧾' }),
          info('Antes de pagar QUALQUER boleto, o app do banco mostra o NOME de quem vai receber. Se não for a empresa (a companhia de energia, de água, a loja), PARE. E prefira pegar a conta pelo app ou site oficial da empresa.', { emoji: '🔎' }),
          quiz('Na hora de pagar, o banco mostra: "Beneficiário: J. Silva Pagamentos". Era a conta de luz. E agora?', ['Não pago: quem recebe não é a companhia de energia', 'Pago, o código de barras é igual'], 0),
          quiz('Desconto de 50% na conta, só hoje, por mensagem...', ['É isca de golpe', 'É promoção do governo'], 0),
          quiz('Onde pegar a segunda via da conta com segurança?', ['No app ou site oficial da empresa, ou na loja dela', 'No link que chegou por mensagem'], 0),
        ],
        conclusao: 'Conferir o beneficiário é o hábito que salva o seu dinheiro. Treine na Praça Escola: lá chegam contas de verdade e boletos falsos! 🧾',
      },
      {
        id: 'n2-golpe-pix', titulo: 'Pix "por engano" e comprovante falso', icone: '💸',
        descricao: 'Quem pede para devolver um Pix para outra chave, e o comprovante que não é de verdade.',
        passos: [
          info('Cai um Pix de R$ 200 na sua conta e logo chega a mensagem: "Mandei por engano! Devolve, por favor, nesta OUTRA chave?" Se você devolver para a outra chave, o golpista pede ao banco o estorno do Pix original e você perde duas vezes.', { emoji: '💸' }),
          quiz('Recebeu um Pix por engano. O certo é...', ['Devolver pelo botão "Devolver" do próprio Pix, no app do banco', 'Mandar para a chave que a pessoa pedir'], 0, 'O botão "Devolver" manda o dinheiro de volta para quem pagou, do jeito certo.'),
          info('Outro golpe: na venda, o "comprador" manda a FOTO de um comprovante de Pix. A foto é falsa. Só entregue a mercadoria quando o dinheiro aparecer no SEU extrato.', { emoji: '📷' }),
          quiz('O comprador mandou o comprovante pelo Zap. Posso entregar?', ['Só depois de ver o dinheiro no meu extrato', 'Sim, o comprovante basta'], 0),
        ],
        conclusao: 'Pix devolve-se pelo botão "Devolver", e venda só se entrega com o dinheiro no extrato. 💸',
      },
      {
        id: 'n2-golpe-desafio', titulo: 'Desafio: golpe ou verdade?', icone: '🏅', desafio: true,
        descricao: 'Seis situações do dia a dia: golpe ou verdade?',
        passos: [
          info('Desafio! Seis situações: diga se é golpe ou verdade, sem ajuda. Clique em "Continuar".'),
          quiz('"Seu filho": "troquei de número, me faz um Pix urgente?"', ['Golpe', 'Verdade'], 0),
          quiz('O app OFICIAL do banco pede para você confirmar uma compra que você fez.', ['Verdade', 'Golpe'], 0),
          quiz('"Advogado": "ganhou o processo, pague as custas por Pix hoje".', ['Golpe', 'Verdade'], 0),
          quiz('Boleto da loja: o banco mostra o nome da loja como beneficiária.', ['Verdade', 'Golpe'], 0),
          quiz('"Ganhe R$ 300 por dia curtindo vídeos, só depositar R$ 100 para começar."', ['Golpe', 'Verdade'], 0),
          quiz('Pix "por engano", com pedido para devolver numa outra chave.', ['Golpe', 'Verdade'], 0),
        ],
        conclusao: 'Desafio vencido! Você reconhece os golpes de agora. Conte para a sua família! 🛡️',
      },
    ],
  });
})();
