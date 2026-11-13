// Nível 2 — Documentos e formulários: preencher formulário em PDF, juntar documentos num PDF só, organizar as páginas
// (girar a deitada, tirar a página em branco), digitalizar com o celular e assinar pelo Cidadão Digital (como a
// assinatura gov.br). Entra antes da prova do nível; para quem já tinha passado na prova antes, fica opcional.
(function () {
  const { info, quiz, esperar, abrir, naJanela } = CE.L;
  const pdf = (s) => naJanela('leitor-pdf', s);
  const nav = (s) => naJanela('navegador', s);
  const cel = (s) => naJanela('celular', s);
  const NOVO_EM = '2026-11-13';
  const CPF = '123.456.789-09';
  const montar = (paginas, meta = {}) => CE.pdf.montar(meta, paginas);

  // ---------- Os PDFs de treino ----------
  const campo = (nome, rotulo, largura = 300) => `<span class="pdf-campo" data-campo="${nome}" data-rotulo="${rotulo}" data-largura="${largura}"></span>`;
  const FICHA = () => montar([`<h1 style="text-align: center;">Ficha de inscrição</h1><p style="text-align: center;">Escola de Treino · Cursos gratuitos · 2º semestre</p><p><br></p>
    <p><b>Nome completo:</b> ${campo('nome', 'Nome completo', 440)}</p>
    <p><b>CPF:</b> ${campo('cpf', '000.000.000-00', 200)}</p>
    <p><b>Telefone (com DDD):</b> ${campo('telefone', '(69) 99999-1234', 200)}</p>
    <p><b>Endereço:</b> ${campo('endereco', 'Rua, número e bairro', 440)}</p>
    <p><b>Curso:</b> ${campo('curso', 'Nome do curso', 300)}</p><p><br></p>
    <p>${campo('aceito', 'Declaro que as informações são verdadeiras').replace('data-largura', 'data-tipo="marcar" data-largura')} Declaro que as informações acima são verdadeiras.</p>
    <p><br></p><p style="font-size: 13px; color: #555;">Documento de TREINO. Não use os seus dados de verdade.</p>`]);
  const rg = (lado) => `<div style="text-align: center;"><img src="${CE.celular.scanDe(lado)}" style="width: 92%;" alt="RG"></div>`;
  const COMPROVANTE = `<h2>Energia Rondônia (treino) — Conta de energia</h2><p><b>Titular:</b> FULANO DE TAL</p><p><b>Endereço:</b> Rua das Flores, 123 — Bairro Centro — Porto Velho/RO</p>
    <p><b>Referência:</b> 10/2025 · <b>Vencimento:</b> 10/11/2025</p><p><b>Valor:</b> R$ 132,40</p><p style="color: #b00;"><b>COMPROVANTE DE RESIDÊNCIA DE TREINO</b></p>`;
  const BRANCO = '<p><br></p>';
  const AUTORIZACAO = () => montar([`<h1 style="text-align: center;">Autorização de matrícula</h1><p><br></p>
    <p>Eu, responsável pelo aluno, autorizo a matrícula no Curso de Informática da Escola de Treino, nas aulas de sábado, das 8h às 10h.</p>
    <p>Estou ciente das regras da escola e do calendário de aulas.</p><p><br></p><p>Porto Velho, ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
    <p><br></p><p style="font-size: 13px; color: #555;">Documento de TREINO, para assinar pelo Cidadão Digital.</p>`]);
  const garantir = (nome, conteudo, recriar) => (recriar ? CE.sessao.salvarArquivo({ nome, tipo: 'pdf', conteudo }) : CE.L.garantirArquivo(nome, conteudo, 'pdf'));
  // Os arquivos de treino ficam prontos (e o Leitor de PDF aberto).
  async function prepararRG(recriar = false) {
    const vale = CE.sessao.marca();
    await garantir('RG frente', montar([rg('documento')]), recriar);
    await garantir('RG verso', montar([rg('documento-verso')], { giros: { 0: 90 } }), recriar);
    await garantir('Comprovante de residência', montar([COMPROVANTE]), recriar);
    if (vale() && !CE.janelas.estaAberta('leitor-pdf')) CE.janelas.abrir('leitor-pdf');
  }
  const abrirFicha = () => CE.L.abrirExemplo('Ficha de inscrição', 'pdf', FICHA, true);
  const ESCANEADOS = () => montar([rg('documento'), rg('documento-verso'), BRANCO, COMPROVANTE], { giros: { 1: 90 } });

  // ---------- Conta Cidadão (para assinar) ----------
  const conta = () => CE.contaCidadao.conta();
  const prata = () => !!(conta() && conta().nivel !== 'bronze');
  const passosDaConta = () => [
    esperar('Você ainda não tem a Conta Cidadão. Clique em "👤 Entrar com a Conta Cidadão" e em "Criar conta". Use o CPF de treino 123.456.789-09, confirme o código do SMS e crie uma senha forte.', 'gov:conta-criada', null, {
      destacar: [nav('.cd-form'), nav('[data-gov="criar"]'), nav('[data-gov="entrar"]')], mouse: 'esquerdo', jaFeito: () => !!conta(),
    }),
    esperar('Entre na sua Conta Cidadão: CPF de treino 123.456.789-09 e a SUA senha. (Esqueceu? Clique em "Esqueci minha senha".)', 'gov:login', null, {
      destacar: [nav('.cd-form'), nav('[data-gov="entrar"]')], mouse: 'esquerdo', jaFeito: () => CE.contaCidadao.logado(),
      dica: 'O CPF de treino está no quadro amarelo. A senha é a que você criou na aula "Conta Cidadão".',
    }),
    esperar('Para assinar, a conta precisa ser PRATA. Clique em "⬆️ Aumentar o nível da conta", depois em "🏦 Validar pelo meu banco" e autorize no site do banco (agência 0001, conta 12345-6, senha 1234).', 'gov:nivel', (d) => d.nivel === 'prata', {
      destacar: [nav('[data-gov="nivel"]'), nav('[data-gov="validar-banco"]'), nav('.bc-form')], mouse: 'esquerdo', jaFeito: prata,
    }),
  ];

  CE.adicionarModulo({
    id: 'n2-documentos', nivel: 'n2', titulo: 'Documentos e formulários em PDF', icone: '📄', antes: 'n2-prova', novoEm: NOVO_EM,
    licoes: [
      {
        id: 'n2-doc-formulario', titulo: 'Preencher um formulário em PDF', icone: '📝',
        descricao: 'Ficha de inscrição: escrever nos campos e salvar preenchida.',
        passos: [
          info('Muita inscrição chega como PDF: matrícula, curso, cadastro, vaga de emprego. Dá para preencher no computador, sem imprimir e sem caneta. Abrimos uma ficha de inscrição de treino para você.', { emoji: '📝', preparar: abrirFicha }),
          esperar('Clique no campo "Nome completo", escreva o seu nome e aperte a tecla Tab (ela pula para o próximo campo).', 'pdf:campo', (d) => d.campo === 'nome' && d.valor.trim().split(/\s+/).length >= 2, {
            destacar: pdf('[data-campo-pdf="nome"]'), mouse: 'esquerdo', dica: 'Nome e sobrenome. A tecla Tab fica acima do Caps Lock, do lado esquerdo do teclado.',
          }),
          esperar(`No CPF, use o CPF de treino  ${CPF}  e aperte Tab.`, 'pdf:campo', (d) => d.campo === 'cpf' && d.valor.replace(/\D/g, '') === '12345678909', { destacar: pdf('[data-campo-pdf="cpf"]'), mouse: 'esquerdo' }),
          esperar('Escreva um telefone com DDD, por exemplo  (69) 99999-1234 , e aperte Tab.', 'pdf:campo', (d) => d.campo === 'telefone' && d.valor.replace(/\D/g, '').length >= 10, { destacar: pdf('[data-campo-pdf="telefone"]'), mouse: 'esquerdo' }),
          esperar('No endereço, escreva rua, número e bairro (pode ser um endereço de treino) e aperte Tab.', 'pdf:campo', (d) => d.campo === 'endereco' && d.valor.length >= 8, { destacar: pdf('[data-campo-pdf="endereco"]'), mouse: 'esquerdo' }),
          esperar('No campo "Curso", escreva  Informática  e aperte Tab.', 'pdf:campo', (d) => d.campo === 'curso' && /inform/i.test(d.valor), { destacar: pdf('[data-campo-pdf="curso"]'), mouse: 'esquerdo' }),
          esperar('Marque a caixinha da declaração: clique no quadradinho.', 'pdf:campo', (d) => d.campo === 'aceito' && d.valor === 'X', { destacar: pdf('[data-campo-pdf="aceito"]'), mouse: 'esquerdo' }),
          esperar('Agora clique em "💾 Salvar preenchido" e em OK (o nome sugerido já está bom).', 'pdf:formulario-salvo', (d) => d.preenchidos >= 6, { destacar: pdf('[data-comando="salvar-formulario"]'), mouse: 'esquerdo' }),
          quiz('Preenchi um formulário em PDF. Para não perder o que escrevi, eu...', ['Salvo o PDF preenchido antes de fechar', 'Só fecho: o PDF guarda sozinho', 'Imprimo e escrevo de caneta por cima'], 0),
        ],
        conclusao: 'Formulário preenchido e salvo, sem papel e sem caneta! 📝',
      },
      {
        id: 'n2-doc-juntar', titulo: 'Juntar documentos num PDF só', icone: '➕',
        descricao: 'RG frente e verso + comprovante de residência, num arquivo só.',
        passos: [
          info('A escola pediu: "mande o RG (frente e verso) e o comprovante de residência, TUDO NUM PDF SÓ". Os três já estão em Meus Documentos, cada um num PDF separado. Vamos juntar.', { emoji: '➕', preparar: () => prepararRG(true) }),
          esperar('No Leitor de PDF, clique em "➕ Juntar PDFs".', 'pdf:juntar', null, { destacar: pdf('[data-comando="juntar"]'), mouse: 'esquerdo' }),
          esperar('Clique nos arquivos NA ORDEM: 1º "RG frente", 2º "RG verso", 3º "Comprovante de residência" (aparecem os números 1, 2 e 3). Clique em "Juntar" e dê o nome  Documentos para matrícula .', 'pdf:juntado',
            (d) => d.arquivos.length === 3 && d.arquivos[0] === 'RG frente' && d.arquivos[1] === 'RG verso' && /comprovante/i.test(d.arquivos[2]) && /matr[ií]cula/i.test(d.nome), {
              destacar: ['.escolher-arquivo [data-escolher="RG frente"]', '.escolher-arquivo [data-escolher="RG verso"]', '.escolher-arquivo [data-escolher="Comprovante de residência"]', '[data-acao="confirmar-escolha"]', pdf('[data-comando="juntar"]')],
              mouse: 'esquerdo', dica: 'Errou a ordem? Clique de novo no arquivo para desmarcar. Fechou a janela? Clique de novo em "➕ Juntar PDFs".',
            }),
          info('Pronto: as 3 páginas ficaram num arquivo só, na ordem certa. Repare que a página do RG verso veio DEITADA: na próxima aula você aprende a girar.', { emoji: '✅' }),
          quiz('Para mandar vários documentos para a escola ou para o banco, o melhor é...', ['Juntar tudo num PDF só, na ordem certa', 'Mandar 15 fotos tortas no WhatsApp', 'Mandar só o RG e esperar pedirem o resto'], 0),
        ],
        conclusao: 'Três documentos num PDF só! ➕',
      },
      {
        id: 'n2-doc-organizar', titulo: 'Organizar páginas: girar e tirar a que sobra', icone: '📑',
        descricao: 'Girar a página deitada e excluir a página em branco.',
        passos: [
          info('Às vezes o PDF chega com uma página deitada ou uma página em branco no meio. Dá para arrumar sem imprimir nem escanear de novo. Abrimos "Documentos escaneados" para você.', { emoji: '📑', preparar: () => CE.L.abrirExemplo('Documentos escaneados', 'pdf', ESCANEADOS, true) }),
          esperar('Clique em "📑 Organizar páginas".', 'pdf:organizar', null, { destacar: pdf('[data-comando="organizar"]'), mouse: 'esquerdo' }),
          esperar('A página 2 (o verso do RG) está deitada. Clique em "↺" (girar para a esquerda), embaixo dela.', 'pdf:pagina-girada', (d) => d.pagina === 2 && d.giro === 0, {
            destacar: pdf('.pdf-miniatura[data-miniatura="2"] [data-mini-acao="girar-esquerda"]'), mouse: 'esquerdo', dica: 'Girou para o lado errado? Clique mais vezes até o documento ficar em pé.',
          }),
          esperar('A página 3 está em branco. Clique na lixeira 🗑️ embaixo dela para tirar.', 'pdf:pagina-excluida', (d) => d.vazia, { destacar: pdf('.pdf-miniatura[data-miniatura="3"] [data-mini-acao="excluir"]'), mouse: 'esquerdo' }),
          esperar('Clique em "💾 Salvar" e em OK.', 'pdf:organizado', (d) => d.paginas === 3 && !d.giros.length, { destacar: pdf('[data-comando="salvar-organizar"]'), mouse: 'esquerdo', dica: 'O PDF salvo precisa ter 3 páginas, todas em pé.' }),
          quiz('Excluí uma página do PDF sem querer, antes de salvar. O que faço?', ['Clico em "Cancelar" e começo de novo', 'Não tem jeito', 'Desligo o computador'], 0),
        ],
        conclusao: 'Páginas em pé e na ordem! 📑',
      },
      {
        id: 'n2-doc-escanear', titulo: 'Escanear documento com o celular', icone: '📄',
        descricao: 'Frente e verso do RG viram um PDF no computador.',
        passos: [
          info('Sem scanner? O celular resolve. Os apps de digitalizar (o do Google Drive, o próprio WhatsApp, a câmera de muitos celulares) cortam o documento, deixam reto e salvam em PDF: fica bem melhor que uma foto torta. Vamos digitalizar o RG de treino, frente e verso.', { emoji: '📄' }),
          abrir('celular', 'Celular'),
          esperar('Desbloqueie o celular (se pedir o PIN, use o que você criou) e abra a 📷 Câmera.', 'celular:app', (d) => d.app === 'camera', { destacar: [cel('[data-acao="cel-desbloquear"]'), cel('[data-cel-app="camera"]')], mouse: 'esquerdo' }),
          esperar('Use ◀ ▶ até aparecer o "Documento" e toque em "📄 Digitalizar documento (PDF)".', 'celular:pagina-digitalizada', (d) => d.cena === 'documento', {
            destacar: [cel('[data-acao="cena-seguinte"]'), cel('[data-acao="cel-digitalizar"]')], mouse: 'esquerdo',
          }),
          esperar('Agora o verso: toque em "➕ Digitalizar mais uma página", use ▶ até "Documento (verso)" e toque em "📄 Digitalizar documento" de novo.', 'celular:pagina-digitalizada', (d) => d.cena === 'documento-verso' && d.paginas >= 2, {
            destacar: [cel('[data-folha="scan-mais"]'), cel('[data-acao="cena-seguinte"]'), cel('[data-acao="cel-digitalizar"]')], mouse: 'esquerdo',
          }),
          esperar('Toque em "💾 Salvar como PDF no computador" e dê o nome  RG digitalizado .', 'celular:digitalizado', (d) => d.paginas >= 2 && d.verso && /rg/i.test(d.nome), { destacar: cel('[data-folha="scan-salvar"]'), mouse: 'esquerdo' }),
          quiz('Para mandar o RG para a escola, o melhor é...', ['Digitalizar frente e verso num PDF', 'Uma foto torta, com a mesa e o dedo aparecendo', 'Mandar o RG de verdade pelo correio'], 0),
        ],
        conclusao: 'Documento digitalizado pelo celular! Ele está em Meus Documentos › Documentos digitalizados. 📄',
      },
      {
        id: 'n2-doc-assinar', titulo: 'Assinar documento pelo gov.br', icone: '✍️',
        descricao: 'Assinatura eletrônica com a Conta Cidadão e conferir se é válida.',
        passos: [
          info('Assinatura sem papel: com a conta gov.br prata ou ouro, você assina documentos pelo celular ou computador, de graça. Vale como a assinatura de caneta em muitos documentos (requerimento, autorização, contrato simples). Aqui treinamos no Cidadão Digital.', { emoji: '✍️' }),
          info('Abrimos uma autorização de treino no Leitor de PDF. Confira o texto antes: depois de assinado, o documento não pode mudar.', { emoji: '📕', preparar: () => CE.L.abrirExemplo('Autorização de matrícula', 'pdf', AUTORIZACAO, true) }),
          esperar('No Leitor de PDF, clique em "✍️ Assinar". O Navegador abre o Cidadão Digital.', 'pdf:assinar', null, { destacar: pdf('[data-comando="assinar"]'), mouse: 'esquerdo' }),
          ...passosDaConta(),
          esperar('Em "Meus serviços", clique em "✍️ Assinar documento digital" e depois em "✍️ Assinar este documento".', 'gov:assinar-codigo', (d) => /autoriza/i.test(d.nome), {
            destacar: [nav('[data-servico="assinar"]'), nav('[data-site-acao="assinar-codigo"]')], mouse: 'esquerdo',
            dica: 'Se aparecer "Escolher o documento", clique e escolha "Autorização de matrícula".',
          }),
          esperar('Digite o código que chegou no "celular" (o quadro na página) e clique em "Assinar".', 'gov:assinado', null, { destacar: nav('.cd-form'), mouse: 'esquerdo' }),
          info('Pronto: o PDF assinado foi para a pasta Downloads, com o nome "Autorização de matrícula assinado". É ESTE arquivo que se manda para a escola.', { emoji: '✅' }),
          esperar('Agora confira, como faria a escola: clique em "🔍 Validar uma assinatura", depois em "📎 Escolher o PDF para validar" e escolha "Autorização de matrícula assinado".', 'gov:validado', (d) => d.valida && /assinado/i.test(d.nome), {
            destacar: [nav('[data-site-acao="validar-escolher"]'), '.escolher-arquivo [data-escolher="Autorização de matrícula assinado"]'], mouse: 'esquerdo',
          }),
          quiz('Se alguém mudar o documento depois de assinado...', ['A validação mostra que a assinatura não vale mais', 'Nada acontece', 'A assinatura muda junto e continua valendo'], 0),
          esperar('Terminou? Clique em "Sair 🚪" para sair da conta.', 'gov:sair', null, { destacar: nav('[data-gov="sair"]'), mouse: 'esquerdo', jaFeito: () => !CE.contaCidadao.logado() }),
        ],
        conclusao: 'Documento assinado e validado, sem imprimir nada! ✍️',
      },
      {
        id: 'n2-doc-desafio', titulo: 'Desafio: matrícula completa', icone: '🏅', desafio: true,
        descricao: 'Ficha preenchida + RG, num PDF só, organizado e assinado.',
        passos: [
          info('Desafio! Faça a matrícula completa sozinho: preencher a ficha, juntar com o RG, desvirar a página e assinar. Clique em "Continuar".', { preparar: async () => { await prepararRG(true); await abrirFicha(); } }),
          esperar(`Preencha a ficha inteira (nome, CPF de treino ${CPF}, telefone, endereço, curso e a caixinha) e salve preenchida.`, 'pdf:formulario-salvo', (d) => d.preenchidos >= 6),
          esperar('Junte num PDF só, nesta ordem: a ficha preenchida, o "RG frente" e o "RG verso".', 'pdf:juntado', (d) => d.arquivos.length === 3 && /preenchid/i.test(d.arquivos[0]) && d.arquivos[1] === 'RG frente' && d.arquivos[2] === 'RG verso'),
          esperar('Organize: deixe a página do RG verso em pé e salve.', 'pdf:organizado', (d) => d.paginas === 3 && !d.giros.length),
          esperar('Assine esse PDF pelo Cidadão Digital (✍️ Assinar).', 'gov:assinado'),
        ],
        conclusao: 'Desafio vencido: matrícula completa, toda pelo computador! 🏅',
      },
    ],
  });
})();
