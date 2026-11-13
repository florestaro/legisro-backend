// Nível 5 — Assistente Administrativo (com base no curso de 160 h do Senac): rotinas de escritório no sistema da
// empresa (Gestão Fácil), junto com o Editor, a Planilha, o E-mail, a Agenda, o Arquivos e o Celular.
(function () {
  const { info, quiz, esperar, abrir, naJanela, abrirExemplo, planilhaDe, celula, perto, garantirArquivo, pularSe } = CE.L;
  const gf = (s) => naJanela('gestao', s);
  const em = (s) => naJanela('email', s);
  const td = (ref) => naJanela('planilha', `td[data-celula="${ref}"]`);
  const dlg = (campo) => `.dialogo [data-gf-campo="${campo}"]`;
  const confirmar = '.dialogo [data-gf-acao="confirmar"]';
  const abrirGF = (aba) => abrir('gestao', 'Gestão Fácil', { preparar: () => { if (CE.janelas.estaAberta('gestao') && aba) CE.janelas.abrir('gestao', { aba }); } });
  const irAba = (aba, nome) => esperar(`No menu da esquerda do Gestão Fácil, clique em "${nome}".`, 'gestao:aba', (d) => d.aba === aba, {
    destacar: gf(`[data-gf-aba="${aba}"]`), mouse: 'esquerdo', jaFeito: () => !!document.querySelector(`.janela[data-app="gestao"] [data-gf-aba="${aba}"].ativo`),
  });
  const naMesa = (...chaves) => () => CE.gestao.preparar((e) => {
    let mudou = false;
    chaves.forEach((k) => { const d = CE.gestao.DOCUMENTOS_MESA[k]; if (!e.entrada.some((x) => x.tipo === d.tipo && x.origem === d.origem)) { e.entrada.push({ ...d, id: d.id + Date.now().toString(36) }); mudou = true; } });
    return mudou;
  });
  const editou = (texto, teste, extra = {}) => esperar(texto, ['planilha:editada', 'planilha:preenchida', 'planilha:colada'], () => teste(), { jaFeito: () => !!CE.planilhaAtiva && teste(), ...extra });
  const hojeMais = (n) => { const d = new Date((CE.config ? CE.config.agora() : new Date()).getTime() + n * 86400000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  // ======================= 🤝 Atendimento =======================
  CE.adicionarModulo({
    id: 'n5-atendimento', nivel: 'n5', titulo: 'O assistente administrativo e o atendimento', icone: '🤝',
    licoes: [
      {
        id: 'n5-at-sistema', titulo: 'O sistema da empresa (ERP)', icone: '🗂️',
        descricao: 'Conhecer o Gestão Fácil: painel, clientes, estoque, financeiro e protocolo.',
        passos: [
          info('Bem-vindo ao NÍVEL 5: ASSISTENTE ADMINISTRATIVO! O assistente organiza o escritório: atende clientes, cuida dos documentos, das contas, do estoque e ajuda o RH. Quase toda empresa usa um SISTEMA (chamado ERP) para isso. O nosso se chama Gestão Fácil.', { emoji: '🗂️' }),
          abrirGF(),
          info('Este é o PAINEL: ele mostra o que precisa de atenção hoje (contas atrasadas, estoque baixo, documentos na mesa). É a primeira tela que se olha de manhã.'),
          irAba('clientes', '👥 Clientes'),
          irAba('estoque', '📦 Produtos e estoque'),
          irAba('financeiro', '💰 Financeiro'),
          irAba('protocolo', '📑 Protocolo'),
          quiz('O ERP (sistema da empresa) serve para...', ['Guardar e organizar clientes, vendas, estoque e contas num lugar só', 'Jogar no intervalo', 'Mandar mensagem para os amigos'], 0),
          quiz('No Painel, um quadro em vermelho quer dizer...', ['Algo que precisa de atenção (atrasado ou em falta)', 'Que está tudo ótimo'], 0),
        ],
        conclusao: 'Você já conhece o sistema da empresa! 🗂️',
      },
      {
        id: 'n5-at-cadastro', titulo: 'Cadastrar cliente (e a LGPD)', icone: '👥',
        descricao: 'Cadastro completo e correto, com respeito aos dados pessoais.',
        passos: [
          info('Chegou um cliente novo no balcão: José Ribamar Ferreira, CPF 345.678.912-30, celular (69) 98123-4567, e-mail jose.ribamar@correio.escola, de Ji-Paraná. Vamos cadastrar! A LGPD (Lei Geral de Proteção de Dados) diz: os dados das pessoas só podem ser usados para o atendimento.', { emoji: '👥' }),
          abrirGF('clientes'),
          irAba('clientes', '👥 Clientes'),
          esperar('Clique em "➕ Novo cliente", preencha os dados do José (nome, CPF, celular, e-mail e cidade) e clique em Salvar.', 'gestao:cliente', (d) => d.acao === 'novo' && /ribamar/i.test(d.nome), {
            destacar: [confirmar, gf('[data-gf-acao="novo-cliente"]')], mouse: 'esquerdo', dica: 'Se aparecer um erro em vermelho, ele diz o que está faltando ou errado (o CPF tem 11 números).',
          }),
          info('Repare: o sistema confere se o CPF tem 11 números e se o e-mail tem @. Dado errado no cadastro vira boleto que não chega e cliente perdido.'),
          quiz('Um desconhecido liga pedindo o telefone de um cliente. Eu...', ['Não passo: os dados são protegidos pela LGPD', 'Passo, se ele disser que é amigo'], 0),
          quiz('O CPF tem quantos números?', ['11', '14', '8'], 0),
        ],
        conclusao: 'Cliente cadastrado do jeito certo! 👥',
      },
      {
        id: 'n5-at-recado', titulo: 'Atender o telefone e anotar recado', icone: '☎️',
        descricao: 'Recado completo por e-mail e retorno na agenda.',
        passos: [
          info('O telefone tocou: "Aqui é o Sr. Marcos, da Distribuidora Norte. Preciso falar com o gerente sobre o pedido de compra. Meu telefone é (69) 3224-8899. Pode pedir para ele me retornar até as 16h?" O gerente não está. Vamos anotar o RECADO.', { emoji: '☎️' }),
          info('Um bom recado tem: QUEM ligou, de qual EMPRESA, o TELEFONE, o ASSUNTO, o HORÁRIO da ligação e o que a pessoa PEDIU.'),
          abrir('email', 'E-mail'),
          esperar('Escreva para o gerente (professor@correio.escola), assunto "Recado — Sr. Marcos", com todas as informações do recado (inclusive o telefone 3224-8899). Envie.', 'email:enviado',
            (d) => d.para === 'professor@correio.escola' && /3224.?8899/.test(d.texto) && /marcos/i.test(d.texto + d.assunto), { destacar: em('[data-acao="escrever"]'), mouse: 'esquerdo' }),
          abrir('agenda', 'Agenda'),
          esperar('Agora lembre o gerente na Agenda: marque "Retornar ligação — Sr. Marcos" para hoje, às 15:30, com lembrete.', 'agenda:compromisso', (d) => /marcos/i.test(d.titulo) && d.hora && d.lembrete, {
            destacar: naJanela('agenda', '[data-acao="novo-compromisso"]'), mouse: 'esquerdo',
          }),
          quiz('No recado, o que NÃO pode faltar?', ['Quem ligou, o telefone e o assunto', 'A cor da roupa da pessoa'], 0),
        ],
        conclusao: 'Recado perfeito: o gerente sabe tudo e não esquece de retornar! ☎️',
      },
      {
        id: 'n5-at-desafio', titulo: 'Desafio do atendimento', icone: '🏅', desafio: true,
        descricao: 'Cadastro de empresa e recado, sozinho.',
        passos: [
          info('Desafio! Faça sozinho. Clique em "Continuar".'),
          esperar('No Gestão Fácil, cadastre a empresa "Padaria Pão Quente Ltda", CNPJ 45.678.901/0001-34, telefone (69) 3225-1010, de Porto Velho.', 'gestao:cliente', (d) => d.acao === 'novo' && d.tipo === 'cnpj' && /padaria/i.test(d.nome)),
          esperar('Mande um recado por e-mail para professor@correio.escola: a Padaria ligou (69) 3225-1010 pedindo orçamento de 10 garrafas térmicas.', 'email:enviado', (d) => d.para === 'professor@correio.escola' && /3225.?1010/.test(d.texto)),
        ],
        conclusao: 'Desafio vencido! Atendimento nota 10. 🤝',
      },
    ],
  });

  // ======================= 📑 Documentos =======================
  CE.adicionarModulo({
    id: 'n5-documentos', nivel: 'n5', titulo: 'Documentos, protocolo e arquivo', icone: '📑',
    licoes: [
      {
        id: 'n5-doc-protocolo', titulo: 'Protocolo: registrar, encaminhar e arquivar', icone: '📑',
        descricao: 'O caminho de um documento dentro da empresa.',
        passos: [
          info('Chegou um OFÍCIO da Prefeitura. Para não se perder, todo documento que chega recebe um número de PROTOCOLO, vai para o setor certo e, no fim, é ARQUIVADO num lugar conhecido.', { emoji: '📑', preparar: naMesa('oficio') }),
          abrirGF('protocolo'),
          irAba('protocolo', '📑 Protocolo'),
          esperar('Na lista "Na mesa", clique em "📑 Registrar" na linha do Ofício da Prefeitura.', 'gestao:protocolo', (d) => d.acao === 'registrar' && d.tipo === 'Ofício', { destacar: gf('[data-gf-entrada="Ofício"] [data-gf-acao="registrar"]'), mouse: 'esquerdo' }),
          info('Ganhou um número (ano/sequência). Na vida real, escreve-se esse número no canto do papel.'),
          esperar('O convite é para a Diretoria decidir. No livro de protocolo, clique em "➡️ Encaminhar", escolha "Diretoria" e confirme.', 'gestao:protocolo', (d) => d.acao === 'encaminhar' && d.setor === 'Diretoria', { destacar: [confirmar, gf('[data-gf-tipo="Ofício"] [data-gf-acao="encaminhar"]')], mouse: 'esquerdo' }),
          esperar('A Diretoria respondeu e o assunto acabou. Clique em "🗄️ Arquivar" e escreva onde o papel ficou guardado (ex.: Caixa Ofícios 2025).', 'gestao:protocolo', (d) => d.acao === 'arquivar' && d.tipo === 'Ofício', { destacar: [confirmar, gf('[data-gf-tipo="Ofício"] [data-gf-acao="arquivar"]')], mouse: 'esquerdo' }),
          quiz('Para que serve o número de protocolo?', ['Para saber onde o documento está e provar que ele chegou', 'Para enfeitar o papel'], 0),
          quiz('Ao arquivar, eu anoto...', ['O lugar onde o documento ficou guardado', 'Nada, é só jogar na gaveta'], 0),
        ],
        conclusao: 'Nenhum papel se perde com você! 📑',
      },
      {
        id: 'n5-doc-nota', titulo: 'Nota fiscal: do protocolo ao financeiro', icone: '🧾',
        descricao: 'Registrar a nota e lançar a conta a pagar.',
        passos: [
          info('Chegou a NOTA FISCAL 4512 da Distribuidora Norte, no valor de R$ 3.250,00, para pagar daqui a 15 dias. Ela precisa ser registrada e virar uma CONTA A PAGAR, senão a empresa esquece de pagar e leva multa.', { emoji: '🧾', preparar: naMesa('nota') }),
          abrirGF('protocolo'),
          irAba('protocolo', '📑 Protocolo'),
          esperar('Registre a Nota fiscal (botão "📑 Registrar" na linha dela).', 'gestao:protocolo', (d) => d.acao === 'registrar' && d.tipo === 'Nota fiscal', { destacar: gf('[data-gf-entrada="Nota fiscal"] [data-gf-acao="registrar"]'), mouse: 'esquerdo' }),
          esperar('Encaminhe a nota para o setor "Financeiro".', 'gestao:protocolo', (d) => d.acao === 'encaminhar' && d.tipo === 'Nota fiscal' && d.setor === 'Financeiro', { destacar: [confirmar, gf('[data-gf-tipo="Nota fiscal"] [data-gf-acao="encaminhar"]')], mouse: 'esquerdo' }),
          irAba('financeiro', '💰 Financeiro'),
          esperar('Clique em "➕ Nova conta a pagar". Descrição: NF 4512 — mercadorias. Fornecedor: Distribuidora Norte. Vencimento: daqui a 15 dias. Valor: 3.250,00. Categoria: Fornecedores. Salvar.', 'gestao:conta', (d) => d.tipo === 'pagar' && perto(d.valor, 3250) && /4512/.test(d.descricao), {
            destacar: [confirmar, gf('[data-gf-acao="nova-pagar"]')], mouse: 'esquerdo', dica: 'Escreva o valor assim: 3250,00 ou 3.250,00.',
          }),
          quiz('Nota fiscal de compra que chega na empresa vira...', ['Uma conta a pagar', 'Uma conta a receber', 'Lixo'], 0),
        ],
        conclusao: 'Nota registrada e conta lançada: nada de multa! 🧾',
      },
      {
        id: 'n5-doc-arquivo', titulo: 'Arquivo digital organizado', icone: '🗄️',
        descricao: 'Pastas e nomes de arquivo que qualquer colega entende.',
        passos: [
          info('No computador da empresa, arquivo com nome "scan001" ou "documento final 2" ninguém acha. O padrão é: DATA (ano-mês-dia) + o QUE é + DE QUEM. Exemplo: 2025-11-13 NF 4512 Distribuidora Norte. Começando pela data, os arquivos ficam em ordem sozinhos!', {
            emoji: '🗄️', preparar: () => garantirArquivo('scan001', '<div><b>NOTA FISCAL 4512</b> — Distribuidora Norte — R$ 3.250,00</div>'),
          }),
          abrir('arquivos', 'Arquivos'),
          esperar('Crie uma pasta nova chamada  Notas fiscais  (botão direito num espaço vazio › Novo › Pasta, ou o botão "📁 Nova pasta").', 'pasta:criada', (d) => /notas fiscais/i.test(d.nome), {
            destacar: naJanela('arquivos', '[data-acao="nova-pasta"]'), mouse: 'esquerdo', ...pularSe(async () => (await CE.sessao.arquivos()).some((a) => a.tipo === 'pasta' && /notas fiscais/i.test(a.nome) && !a.naLixeira)),
          }),
          esperar('Agora renomeie o arquivo "scan001" (botão direito › Renomear) para o padrão: ano-mês-dia NF 4512 Distribuidora Norte (ex.: 2025-11-13 NF 4512 Distribuidora Norte).', 'arquivo:renomeado', (d) => /^\d{4}-\d{2}-\d{2} NF 4512/i.test(d.nome), { mouse: 'direito' }),
          esperar('Arraste o arquivo renomeado para dentro da pasta "Notas fiscais".', ['arquivo:movido', 'arquivo:arrastado'], (d) => /4512/.test(d.nome || '') && /notas fiscais/i.test(d.destino || d.pasta || ''), { mouse: 'arrastar' }),
          quiz('Qual nome de arquivo é melhor?', ['2025-11-13 NF 4512 Distribuidora Norte', 'scan001', 'documento final certo 2'], 0),
        ],
        conclusao: 'Arquivo digital que qualquer colega encontra! 🗄️',
      },
      {
        id: 'n5-doc-digitalizar', titulo: 'Digitalizar documento com o celular', icone: '📸',
        descricao: 'Foto do documento, para o computador e PDF.',
        passos: [
          info('O cliente trouxe o RG para o cadastro e a empresa precisa de uma CÓPIA DIGITAL em PDF. Sem scanner? Use o celular: foto bem reta, passa para o computador e vira PDF.', { emoji: '📸' }),
          abrir('celular', 'Celular'),
          esperar('No celular, desbloqueie (se pedir o PIN, é 7391), abra a Câmera, aponte para o "Documento" (use ◀ ▶) e tire a foto.', 'celular:foto', (d) => d.cena === 'documento', { mouse: 'esquerdo' }),
          esperar('Abra a Galeria, toque na foto do documento e em "💻 Para o computador".', 'celular:foto-computador', (d) => d.cena === 'documento', { mouse: 'esquerdo' }),
          abrir('editor', 'Editor de Texto'),
          esperar('No Editor, clique em "🖼️ Imagem" e escolha a foto do documento (em "Seus desenhos").', 'editor:formatado', (d) => d.comando === 'inserirImagem', { destacar: naJanela('editor', '[data-comando="inserirImagem"]'), mouse: 'esquerdo' }),
          esperar('Agora clique em "📕 PDF" e salve com o nome  RG digitalizado .', 'editor:pdf', (d) => /rg digitalizado/i.test(d.nome), { destacar: naJanela('editor', '[data-comando="pdf"]'), mouse: 'esquerdo' }),
          quiz('Cópia digital de documento pessoal deve ser guardada...', ['Em pasta protegida da empresa, só para quem precisa', 'No grupo da família'], 0),
        ],
        conclusao: 'Documento digitalizado sem scanner! 📸',
      },
      {
        id: 'n5-doc-desafio', titulo: 'Desafio dos documentos', icone: '🏅', desafio: true,
        descricao: 'O currículo que chegou: protocolo completo.',
        passos: [
          info('Desafio! Chegou um currículo. Faça o caminho completo sozinho. Clique em "Continuar".', { preparar: naMesa('curriculo') }),
          esperar('Registre o currículo no protocolo.', 'gestao:protocolo', (d) => d.acao === 'registrar' && d.tipo === 'Currículo'),
          esperar('Encaminhe para o setor de Recursos Humanos.', 'gestao:protocolo', (d) => d.acao === 'encaminhar' && d.tipo === 'Currículo' && d.setor === 'Recursos Humanos'),
          esperar('Arquive o currículo, dizendo onde ficou guardado.', 'gestao:protocolo', (d) => d.acao === 'arquivar' && d.tipo === 'Currículo'),
        ],
        conclusao: 'Desafio vencido! 📑',
      },
    ],
  });

  // ======================= 💰 Financeiro =======================
  const BOLETO = [['Conta', 'Valor', 'Vencimento', 'Pago em', 'Dias de atraso', 'Multa (2%)', 'Juros (0,033% ao dia)', 'Total a pagar'], ['Energia', '480,30', '10/03/2025', '25/03/2025']];
  CE.adicionarModulo({
    id: 'n5-financeiro', nivel: 'n5', titulo: 'Rotinas financeiras', icone: '💰',
    licoes: [
      {
        id: 'n5-fin-pagar', titulo: 'Contas a pagar: dar baixa', icone: '💸',
        descricao: 'Pagar em dia e registrar o pagamento.',
        passos: [
          info('No Financeiro ficam as CONTAS A PAGAR (o que a empresa deve) e as CONTAS A RECEBER (o que devem para a empresa). Quando uma conta é paga, a gente "DÁ BAIXA": registra que foi paga.', {
            emoji: '💸', preparar: () => CE.gestao.preparar((e) => { const c = e.contas.find((x) => /energia/i.test(x.descricao)); if (c && !c.paga) return false; e.contas.push({ id: 'k' + Date.now(), tipo: 'pagar', descricao: 'Conta de energia', pessoa: 'Energia Rondônia S.A.', vencimento: hojeMais(-2), valor: 480.3, categoria: 'Energia', paga: false }); return true; }),
          }),
          abrirGF('financeiro'),
          irAba('financeiro', '💰 Financeiro'),
          info('Veja a linha em VERMELHO: a conta de energia está ATRASADA. Atraso gera multa e juros, e pode até cortar a luz! O gerente já pagou hoje pelo banco.'),
          esperar('Na linha da "Conta de energia", clique em "💸 Pagar" e confirme.', 'gestao:baixa', (d) => d.tipo === 'pagar' && /energia/i.test(d.descricao), { destacar: [gf('[data-gf-conta="Conta de energia"] [data-gf-acao="baixa"]')], mouse: 'esquerdo' }),
          esperar('Clique em "📈 Fluxo de caixa" para ver como ficou o dinheiro da empresa.', 'gestao:fluxo', null, { destacar: gf('[data-gf-acao="fluxo"]'), mouse: 'esquerdo' }),
          quiz('"Dar baixa" numa conta é...', ['Registrar que ela foi paga', 'Apagar a conta', 'Cobrar o cliente'], 0),
          quiz('Pagar conta atrasada costuma ter...', ['Multa e juros', 'Desconto'], 0),
        ],
        conclusao: 'Contas em dia! 💸',
      },
      {
        id: 'n5-fin-receber', titulo: 'Contas a receber e cobrança educada', icone: '💰',
        descricao: 'Registrar o recebimento e cobrar quem atrasou.',
        passos: [
          info('A Clínica Bem Viver está com um boleto ATRASADO. A cobrança tem que ser EDUCADA: o cliente pode ter esquecido. Primeiro, vamos registrar um pagamento que chegou hoje.', {
            emoji: '💰', preparar: () => CE.gestao.preparar((e) => { if (e.contas.some((x) => x.tipo === 'receber' && /bem viver/i.test(x.pessoa) && !x.paga)) return false; e.contas.push({ id: 'k' + Date.now(), tipo: 'receber', descricao: 'Venda 0998 (boleto)', pessoa: 'Clínica Bem Viver', vencimento: hojeMais(-1), valor: 450, categoria: 'Vendas', paga: false }); return true; }),
          }),
          abrirGF('financeiro'),
          irAba('financeiro', '💰 Financeiro'),
          abrir('email', 'E-mail'),
          esperar('Escreva um e-mail de COBRANÇA educado para a Clínica (no treino, mande para professor@correio.escola): diga que o boleto da venda 0998, de R$ 450,00, venceu e pergunte se eles precisam da 2ª via.', 'email:enviado',
            (d) => d.para === 'professor@correio.escola' && /0998|450/.test(d.texto + d.assunto) && /venc|atras|pagamento|boleto/i.test(d.texto + d.assunto), { destacar: em('[data-acao="escrever"]'), mouse: 'esquerdo' }),
          info('A clínica respondeu e pagou! Agora é registrar o recebimento no sistema.'),
          esperar('No Gestão Fácil › Financeiro, na conta a receber da Clínica Bem Viver, clique em "💰 Receber" e confirme.', 'gestao:baixa', (d) => d.tipo === 'receber' && /bem viver/i.test(d.pessoa), { destacar: gf('[data-gf-acao="baixa"]'), mouse: 'esquerdo', preparar: () => CE.janelas.abrir('gestao', { aba: 'financeiro' }) }),
          quiz('Na cobrança, o tom certo é...', ['Educado: o cliente pode ter esquecido', 'Ameaçador'], 0),
        ],
        conclusao: 'Dinheiro recebido e cliente bem tratado! 💰',
      },
      {
        id: 'n5-fin-fluxo', titulo: 'Fluxo de caixa e relatório', icone: '📈',
        descricao: 'Exportar as contas para a Planilha e filtrar.',
        passos: [
          info('O FLUXO DE CAIXA mostra o dinheiro que entra e sai, e quanto vai sobrar. O gerente pediu um relatório das contas para analisar na Planilha.', { emoji: '📈' }),
          abrirGF('relatorios'),
          irAba('relatorios', '📤 Relatórios'),
          esperar('Em "Contas a pagar e a receber", clique em "📊 Exportar para a Planilha".', 'gestao:exportado', (d) => d.relatorio === 'contas', { destacar: gf('[data-gf-acao="exportar-contas"]'), mouse: 'esquerdo' }),
          esperar('A planilha abriu. Clique numa célula da tabela e ligue o "🔽 Filtro".', 'planilha:filtro', (d) => d.ligado, { destacar: naJanela('planilha', '[data-comando="filtro"]'), mouse: 'esquerdo' }),
          esperar('Na setinha do título "Situação", deixe marcado só "Em aberto" e clique em OK.', 'planilha:filtrada', (d) => d.coluna === 'F' && d.mostrando.length === 1 && /aberto/i.test(d.mostrando[0]), { destacar: naJanela('planilha', '.pl-filtro-botao[data-filtro="F"]'), mouse: 'esquerdo' }),
          quiz('O fluxo de caixa mostra...', ['O dinheiro que entra, o que sai e o que vai sobrar', 'O estoque'], 0),
        ],
        conclusao: 'Relatório pronto para o gerente! 📈',
      },
      {
        id: 'n5-fin-juros', titulo: 'Calcular multa e juros de atraso', icone: '🧮',
        descricao: 'Multa de 2% e juros por dia, na Planilha.',
        passos: [
          info('Boleto atrasado = multa (normalmente 2%) + juros por dia (por exemplo, 0,033% ao dia). Vamos calcular na Planilha quanto ficou a conta de energia paga com atraso.', { emoji: '🧮', preparar: () => abrirExemplo('Conta atrasada', 'planilha', planilhaDe(BOLETO), true) }),
          editou('Em E2, calcule os dias de atraso:  =DIAS(D2;C2)', () => celula('E2') === 15, { destacar: td('E2') }),
          editou('Em F2, a multa de 2%:  =B2*2%', () => perto(celula('F2'), 9.606), { destacar: td('F2') }),
          editou('Em G2, os juros:  =B2*0,033%*E2', () => perto(Math.round(celula('G2') * 100) / 100, 2.38), { destacar: td('G2') }),
          editou('Em H2, o total:  =B2+F2+G2', () => perto(Math.round(celula('H2') * 100) / 100, 492.28), { destacar: td('H2') }),
          quiz('Pagando com 15 dias de atraso, a conta de R$ 480,30 ficou em...', ['R$ 492,28', 'R$ 480,30', 'R$ 960,60'], 0),
        ],
        conclusao: 'Agora você sabe quanto custa atrasar! 🧮',
      },
      {
        id: 'n5-fin-desafio', titulo: 'Desafio do financeiro', icone: '🏅', desafio: true,
        descricao: 'Lançar, pagar e conferir sozinho.',
        passos: [
          info('Desafio! Clique em "Continuar".'),
          esperar('Lance uma conta a pagar: "Material de limpeza", Limpa Bem Ltda, vencendo daqui a 10 dias, R$ 145,00.', 'gestao:conta', (d) => d.tipo === 'pagar' && perto(d.valor, 145) && /limpeza/i.test(d.descricao)),
          esperar('Dê baixa (pague) no "Aluguel da loja".', 'gestao:baixa', (d) => d.tipo === 'pagar' && /aluguel/i.test(d.descricao)),
          esperar('Veja o fluxo de caixa.', 'gestao:fluxo'),
        ],
        conclusao: 'Desafio vencido! 💰',
      },
    ],
  });

  // ======================= 📦 Estoque e compras =======================
  const COTACAO = [['Produto', 'Qtd', 'Distribuidora Norte', 'Utilidades Brasil', 'Casa & Cia', 'Menor preço', 'Total da compra'],
    ['Panela de pressão', '9', '52', '48', '50,50'], ['Ferro de passar', '6', '55', '58,90', '54']];
  CE.adicionarModulo({
    id: 'n5-estoque', nivel: 'n5', titulo: 'Estoque e compras', icone: '📦',
    licoes: [
      {
        id: 'n5-est-entrada', titulo: 'Entrada de mercadoria com nota fiscal', icone: '📥',
        descricao: 'Conferir a nota e dar entrada no estoque.',
        passos: [
          info('Chegou o caminhão da Distribuidora Norte com a NF 4512: 10 ventiladores de mesa e 6 ferros de passar. Antes de assinar o recebimento, CONFIRA se as quantidades da nota batem com o que chegou. Depois, dê entrada no sistema.', { emoji: '📥' }),
          abrirGF('estoque'),
          irAba('estoque', '📦 Produtos e estoque'),
          esperar('Clique em "📥 Entrada de mercadoria": produto "Ventilador de mesa", quantidade 10, nota fiscal 4512. Salvar.', 'gestao:estoque', (d) => d.acao === 'entrada' && d.cod === 'P001' && d.quantidade === 10 && d.nota === '4512', {
            destacar: [confirmar, gf('[data-gf-acao="entrada-estoque"]')], mouse: 'esquerdo',
          }),
          esperar('Agora a entrada dos 6 ferros de passar (mesma nota 4512).', 'gestao:estoque', (d) => d.acao === 'entrada' && d.cod === 'P004' && d.quantidade === 6, { destacar: [confirmar, gf('[data-gf-acao="entrada-estoque"]')], mouse: 'esquerdo' }),
          info('Veja: o ferro de passar saiu do vermelho, porque agora o estoque passou do mínimo.'),
          quiz('Antes de dar entrada da mercadoria, eu...', ['Confiro se o que chegou bate com a nota fiscal', 'Dou entrada sem olhar'], 0),
        ],
        conclusao: 'Estoque atualizado! 📥',
      },
      {
        id: 'n5-est-pedido', titulo: 'Estoque mínimo e pedido de compra', icone: '🛒',
        descricao: 'Gerar o pedido e mandar para o fornecedor.',
        passos: [
          info('ESTOQUE MÍNIMO é a quantidade que nunca pode faltar. Quando um produto fica abaixo dele (em vermelho), é hora de comprar. O sistema monta o PEDIDO DE COMPRA.', {
            emoji: '🛒', preparar: () => CE.gestao.preparar((e) => { const p = e.produtos.find((x) => x.cod === 'P002'); if (p.estoque < p.minimo) return false; p.estoque = 3; return true; }),
          }),
          abrirGF('estoque'),
          irAba('estoque', '📦 Produtos e estoque'),
          esperar('A panela de pressão está em vermelho. Clique em "🛒 Pedido de compra", escolha o fornecedor "Utilidades Brasil" e clique em "Gerar pedido".', 'gestao:pedido', (d) => /utilidades/i.test(d.fornecedor), { destacar: [confirmar, gf('[data-gf-acao="pedido-compra"]')], mouse: 'esquerdo' }),
          abrir('email', 'E-mail'),
          esperar('Mande o pedido para o fornecedor (no treino: professor@correio.escola), com o assunto "Pedido de compra" e o documento do pedido ANEXADO (📎 › está na pasta Gestão Fácil).', 'email:enviado',
            (d) => d.para === 'professor@correio.escola' && (d.nomesAnexos || []).some((n) => /pedido de compra/i.test(n)), { destacar: em('[data-acao="escrever"]'), mouse: 'esquerdo' }),
          quiz('O estoque mínimo serve para...', ['Avisar a hora de comprar, antes de faltar', 'Enfeitar a tabela'], 0),
        ],
        conclusao: 'Pedido enviado: não vai faltar panela! 🛒',
      },
      {
        id: 'n5-est-cotacao', titulo: 'Cotação de preços com 3 fornecedores', icone: '⚖️',
        descricao: 'Comparar na Planilha e achar o menor preço.',
        passos: [
          info('Antes de comprar, o assistente faz uma COTAÇÃO: pede o preço para pelo menos 3 fornecedores e compara. Abri a planilha com os preços que chegaram.', { emoji: '⚖️', preparar: () => abrirExemplo('Cotação de compras', 'planilha', planilhaDe(COTACAO), true) }),
          editou('Em F2, ache o menor preço da panela:  =MÍNIMO(C2:E2)', () => perto(celula('F2'), 48), { destacar: td('F2') }),
          editou('Arraste a alça de F2 até F3 (o menor preço do ferro).', () => perto(celula('F3'), 54), { destacar: td('F2'), mouse: 'arrastar' }),
          editou('Em G2, o total da compra:  =B2*F2   e arraste até G3.', () => perto(celula('G2'), 432) && perto(celula('G3'), 324), { destacar: td('G2') }),
          quiz('Qual fornecedor tem a panela mais barata?', ['Utilidades Brasil (R$ 48,00)', 'Distribuidora Norte', 'Casa & Cia'], 0),
          quiz('Na cotação, além do preço, também vale comparar...', ['O prazo de entrega e a forma de pagamento', 'A cor do caminhão'], 0),
        ],
        conclusao: 'Compra inteligente: economia para a empresa! ⚖️',
      },
      {
        id: 'n5-est-desafio', titulo: 'Desafio do estoque', icone: '🏅', desafio: true,
        descricao: 'Produto novo, entrada e pedido sozinho.',
        passos: [
          info('Desafio! Clique em "Continuar".'),
          esperar('Cadastre o produto "Sanduicheira", preço R$ 99,90, custo R$ 60,00, estoque 0, mínimo 3.', 'gestao:produto', (d) => d.acao === 'novo' && /sanduicheira/i.test(d.nome)),
          esperar('Dê entrada de 5 sanduicheiras com a nota fiscal 4600.', 'gestao:estoque', (d) => d.acao === 'entrada' && /sanduicheira/i.test(d.nome) && d.quantidade === 5),
          esperar('Gere um pedido de compra para algum produto em falta.', 'gestao:pedido'),
        ],
        conclusao: 'Desafio vencido! 📦',
      },
    ],
  });

  // ======================= 🧾 Vendas =======================
  CE.adicionarModulo({
    id: 'n5-vendas', nivel: 'n5', titulo: 'Vendas e atendimento ao cliente', icone: '🧾',
    licoes: [
      {
        id: 'n5-ven-venda', titulo: 'Registrar venda e emitir recibo', icone: '🧾',
        descricao: 'Venda à vista, baixa no estoque e recibo.',
        passos: [
          info('A cliente Maria Aparecida comprou 1 liquidificador e 2 garrafas térmicas, pagando no Pix. Vamos registrar a venda: o sistema já tira do estoque e lança no caixa.', { emoji: '🧾' }),
          abrirGF('vendas'),
          irAba('vendas', '🧾 Vendas'),
          esperar('Escolha o produto "Liquidificador", quantidade 1, e clique em "➕ Adicionar".', 'gestao:item', (d) => d.cod === 'P003', { destacar: gf('[data-gf-acao="adicionar-item"]'), mouse: 'esquerdo' }),
          esperar('Agora "Garrafa térmica", quantidade 2, e "➕ Adicionar".', 'gestao:item', (d) => d.cod === 'P006' && d.qtd === 2, { destacar: gf('[data-gf-acao="adicionar-item"]'), mouse: 'esquerdo' }),
          esperar('Escolha a cliente "Maria Aparecida dos Santos", pagamento "Pix" e clique em "✅ Finalizar venda".', 'gestao:venda', (d) => /maria aparecida/i.test(d.cliente) && d.pagamento === 'pix', { destacar: gf('[data-gf-acao="finalizar-venda"]'), mouse: 'esquerdo' }),
          esperar('Na lista "Vendas registradas", clique em "🧾 Recibo" na venda da Maria. O recibo abre no Editor, pronto para imprimir.', 'gestao:recibo', (d) => /maria/i.test(d.cliente), { destacar: gf('[data-gf-acao="recibo"]'), mouse: 'esquerdo' }),
          quiz('Quando a venda é registrada no sistema, o estoque...', ['Diminui sozinho', 'Aumenta', 'Não muda'], 0),
        ],
        conclusao: 'Venda registrada e cliente com recibo na mão! 🧾',
      },
      {
        id: 'n5-ven-prazo', titulo: 'Venda a prazo (boleto)', icone: '📆',
        descricao: 'Venda para empresa cadastrada, com conta a receber.',
        passos: [
          info('O Mercadinho Boa Vista comprou 5 jogos de copos para pagar em 30 dias, no boleto. Venda A PRAZO só para cliente CADASTRADO: a empresa precisa saber de quem cobrar.', { emoji: '📆' }),
          abrirGF('vendas'),
          irAba('vendas', '🧾 Vendas'),
          esperar('Adicione 5 "Jogo de copos (6 peças)", escolha o cliente "Mercadinho Boa Vista", pagamento "Boleto (30 dias, a prazo)" e finalize.', 'gestao:venda', (d) => d.prazo && /boa vista/i.test(d.cliente), { destacar: gf('[data-gf-acao="finalizar-venda"]'), mouse: 'esquerdo' }),
          irAba('financeiro', '💰 Financeiro'),
          info('Olhe: a venda virou uma CONTA A RECEBER (🟢) para daqui a 30 dias. Quando o boleto for pago, é só dar baixa.'),
          quiz('Venda a prazo vira...', ['Conta a receber', 'Conta a pagar'], 0),
        ],
        conclusao: 'Venda a prazo bem controlada! 📆',
      },
      {
        id: 'n5-ven-relatorio', titulo: 'Relatório de vendas do mês', icone: '📊',
        descricao: 'Exportar e resumir por forma de pagamento.',
        passos: [
          info('Fim do mês: o gerente quer saber quanto entrou em cada forma de pagamento. Vamos exportar as vendas e usar a TABELA DINÂMICA (do Nível 4).', { emoji: '📊' }),
          abrirGF('relatorios'),
          irAba('relatorios', '📤 Relatórios'),
          esperar('Em "Vendas do mês", clique em "📊 Exportar para a Planilha".', 'gestao:exportado', (d) => d.relatorio === 'vendas', { destacar: gf('[data-gf-acao="exportar-vendas"]'), mouse: 'esquerdo' }),
          esperar('Na Planilha, clique numa venda e em "📋 Tabela dinâmica": separar por "Pagamento", calcular "Soma" de "Total".', 'planilha:dinamica', (d) => d.agrupar === 'E' && d.valores === 'F' && d.operacao === 'soma', {
            destacar: naJanela('planilha', '[data-comando="dinamica"]'), mouse: 'esquerdo', dica: 'Na janela da tabela dinâmica, troque "Separar por" para "Pagamento" e "De" para "Total".',
          }),
          esperar('Salve a planilha.', 'arquivo:salvo', (d) => d.tipo === 'planilha', { destacar: naJanela('planilha', '[data-comando="salvar"]'), mouse: 'esquerdo' }),
          quiz('A tabela dinâmica mostrou...', ['Quanto entrou em cada forma de pagamento', 'O endereço dos clientes'], 0),
        ],
        conclusao: 'Relatório de vendas na mão do gerente! 📊',
      },
    ],
  });

  // ======================= 👔 RH =======================
  CE.adicionarModulo({
    id: 'n5-rh', nivel: 'n5', titulo: 'Departamento pessoal (RH)', icone: '👔',
    licoes: [
      {
        id: 'n5-rh-ponto', titulo: 'Folha de ponto e horas extras', icone: '⏱️',
        descricao: 'Lançar o ponto da semana e conferir as horas extras.',
        passos: [
          info('A folha de ponto do Bruno (estoquista) desta semana: SEGUNDA 08:00 12:00 13:00 17:00 · TERÇA 08:00 12:00 13:00 18:30 · QUARTA 08:00 12:00 13:00 17:00 · QUINTA 07:30 12:00 13:00 17:00 · SEXTA 08:00 12:00 13:00 19:00. A jornada é de 8 horas por dia.', { emoji: '⏱️' }),
          abrirGF('rh'),
          irAba('rh', '👔 Funcionários (RH)'),
          esperar('Clique na aba "⏱️ Ponto da semana".', 'gestao:rh', (d) => d.aba === 'ponto', { destacar: gf('[data-gf-rh="ponto"]'), mouse: 'esquerdo', jaFeito: () => !!document.querySelector('.janela[data-app="gestao"] [data-gf-rh="ponto"].ativa') }),
          esperar('Confira que o funcionário é o Bruno Carvalho. Copie os horários da folha (dia por dia) e clique em "💾 Salvar ponto".', 'gestao:ponto', (d) => /bruno/i.test(d.funcionario) && d.horas === 44 && d.extras === 4, {
            destacar: gf('[data-gf-acao="salvar-ponto"]'), mouse: 'esquerdo', dica: 'Clique em cada caixinha de hora e digite, por exemplo, 0800 para 08:00. Repare nos dias com saída depois das 17h.',
          }),
          info('Total: 44 horas, sendo 4 horas extras (terça 1h30, quinta 30 min e sexta 2h). Hora extra vale 50% a mais!'),
          quiz('O Bruno trabalhou de 13:00 às 19:00 na sexta (depois de 4 horas de manhã). Quantas horas extras na sexta?', ['2 horas', '6 horas', 'Nenhuma'], 0),
        ],
        conclusao: 'Ponto lançado certinho! ⏱️',
      },
      {
        id: 'n5-rh-holerite', titulo: 'Entender o holerite', icone: '💵',
        descricao: 'Salário bruto, INSS, FGTS e salário líquido.',
        passos: [
          info('O HOLERITE (contracheque) mostra o salário e os descontos. BRUTO é o total; o INSS é DESCONTADO; LÍQUIDO é o que cai na conta. O FGTS a empresa deposita à parte: não sai do salário.', { emoji: '💵' }),
          abrirGF('rh'),
          irAba('rh', '👔 Funcionários (RH)'),
          esperar('Clique na aba "💵 Holerite", escolha o Bruno Carvalho e confira. Depois clique em "👁️ Conferi o holerite".', 'gestao:holerite', (d) => /bruno/i.test(d.funcionario), { destacar: [gf('[data-gf-acao="conferir-holerite"]'), gf('[data-gf-rh="holerite"]')], mouse: 'esquerdo' }),
          quiz('O salário LÍQUIDO é...', ['O que cai na conta, depois dos descontos', 'O salário antes dos descontos'], 0),
          quiz('O FGTS...', ['É depositado pela empresa e não é descontado do funcionário', 'É descontado do salário'], 0),
          quiz('As horas extras do Bruno...', ['Aumentaram o salário bruto dele', 'Diminuíram o salário'], 0),
        ],
        conclusao: 'Holerite sem mistério! 💵',
      },
      {
        id: 'n5-rh-admissao', titulo: 'Documentos da admissão', icone: '📋',
        descricao: 'Conferir tudo antes do primeiro dia.',
        passos: [
          info('A Carla começa semana que vem como auxiliar administrativa. Ela já entregou RG e CPF. Hoje trouxe o resto: Carteira de Trabalho Digital, comprovante de residência, PIS, dados do banco, foto e o exame admissional (ASO).', { emoji: '📋' }),
          abrirGF('rh'),
          irAba('rh', '👔 Funcionários (RH)'),
          esperar('Clique na aba "📋 Admissão", escolha a Carla Menezes e marque todos os documentos que ela entregou.', 'gestao:admissao', (d) => /carla/i.test(d.funcionario) && d.completo, { destacar: [gf('[data-gf-rh="admissao"]'), gf('[data-gf-doc] input:not(:checked)')], mouse: 'esquerdo' }),
          quiz('O exame admissional (ASO)...', ['É feito antes de começar a trabalhar', 'É feito só quando a pessoa sai da empresa'], 0),
        ],
        conclusao: 'Admissão completa: a Carla pode começar! 📋',
      },
    ],
  });

  // ======================= 🏆 Projeto e prova =======================
  CE.adicionarModulo({
    id: 'n5-projeto', nivel: 'n5', titulo: 'Projeto final: um dia no escritório', icone: '🏆',
    licoes: [
      {
        id: 'n5-pj-dia', titulo: 'Projeto: um dia de assistente administrativo', icone: '💼',
        descricao: 'Protocolo, venda, contas, compras e relatório no mesmo dia.',
        passos: [
          info('PROJETO FINAL! É segunda-feira na Loja Bom Preço e você é o(a) assistente administrativo(a). Faça as tarefas do dia, na ordem. Clique em "Continuar".', { emoji: '💼', preparar: naMesa('curriculo') }),
          esperar('1) Registre o currículo que chegou e encaminhe para o RH.', 'gestao:protocolo', (d) => d.acao === 'encaminhar' && d.tipo === 'Currículo' && d.setor === 'Recursos Humanos', { preparar: () => CE.janelas.abrir('gestao', { aba: 'protocolo' }) }),
          esperar('2) Registre uma venda a prazo (boleto) para a Clínica Bem Viver: 2 ventiladores.', 'gestao:venda', (d) => d.prazo && /bem viver/i.test(d.cliente)),
          esperar('3) Pague a conta de "Internet e telefone" (dar baixa).', 'gestao:baixa', (d) => d.tipo === 'pagar' && /internet/i.test(d.descricao)),
          esperar('4) Exporte a posição do estoque para a Planilha.', 'gestao:exportado', (d) => d.relatorio === 'estoque'),
          esperar('5) Mande o relatório do estoque para o gerente (professor@correio.escola), com a planilha "Posição do estoque" anexada.', 'email:enviado',
            (d) => d.para === 'professor@correio.escola' && (d.nomesAnexos || []).some((n) => /posi[çc][ãa]o do estoque/i.test(n))),
          quiz('Qual programa guarda as vendas, o estoque e as contas da empresa?', ['O sistema da empresa (Gestão Fácil / ERP)', 'O Desenho'], 0),
        ],
        conclusao: 'PROJETO CONCLUÍDO! 💼 Um dia de trabalho completo, do protocolo ao relatório.',
      },
      {
        id: 'prova-n5', titulo: 'Prova do nível Assistente Administrativo', icone: '🏆', prova: true, desafio: true,
        descricao: 'Tarefas e perguntas de todo o nível. Precisa de 70% para passar.',
        passos: [
          info('Chegou a PROVA do Nível 5! Faça as tarefas sozinho. Precisa de 70% para passar. Clique em "Continuar".', { emoji: '🏆', preparar: naMesa('oficio') }),
          esperar('Tarefa 1: registre o ofício que está na mesa no protocolo.', 'gestao:protocolo', (d) => d.acao === 'registrar' && d.tipo === 'Ofício'),
          esperar('Tarefa 2: cadastre um cliente novo (qualquer um, com CPF ou CNPJ válido no formato).', 'gestao:cliente', (d) => d.acao === 'novo'),
          esperar('Tarefa 3: registre uma venda à vista.', 'gestao:venda', (d) => !d.prazo),
          esperar('Tarefa 4: lance uma conta a pagar.', 'gestao:conta', (d) => d.tipo === 'pagar'),
          quiz('Nota fiscal de compra que chega vira...', ['Conta a pagar', 'Conta a receber'], 0),
          quiz('"Dar baixa" é...', ['Registrar que a conta foi paga', 'Apagar a conta'], 0),
          quiz('Venda a prazo (boleto) só para...', ['Cliente cadastrado', 'Qualquer pessoa sem cadastro'], 0),
          quiz('Produto abaixo do estoque mínimo pede...', ['Pedido de compra', 'Desconto'], 0),
          quiz('Pela LGPD, os dados dos clientes...', ['Só são usados para o atendimento', 'Podem ser passados para qualquer um'], 0),
          quiz('O salário líquido é...', ['O que cai na conta depois dos descontos', 'O salário sem descontos'], 0),
          quiz('Um bom recado tem...', ['Quem ligou, telefone e assunto', 'Só o nome'], 0),
          quiz('O melhor nome para o arquivo de uma nota fiscal é...', ['2025-11-13 NF 4512 Distribuidora Norte', 'scan001'], 0),
        ],
        conclusao: 'PARABÉNS! Você passou na prova do Nível 5 — Assistente Administrativo! 🏆 Pode colocar no currículo: rotinas de escritório com sistema (ERP), protocolo, financeiro, estoque e RH.',
      },
    ],
  });
})();
