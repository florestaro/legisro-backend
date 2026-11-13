// Missão da semana: um desafio curto que vale para a semana toda (ex.: "mande um e-mail com anexo", "faça um
// gráfico"). O instrutor escolhe a missão no Painel (aba 🏁 Gincana, missão e jornal) ou deixa automática (muda
// sozinha toda segunda-feira). O computador confere sozinho quando o aluno cumpre, pelo que ele fez de verdade.
// Fica no progresso do aluno (no servidor da sala: vale em qualquer computador):
// p.missoes = { "2026-S46:grafico": { missao, semana, feita, contador } } — uma por semana e missão, para a missão já
// cumprida continuar valendo se o instrutor trocar a missão no meio da semana.
window.CE = window.CE || {};

(function () {
  // O banco de missões. "nivel": a partir de que parte do curso a missão faz sentido (a missão automática de cada
  // aluno vem do nível dele: um iniciante não recebe "pague o DAS do MEI"). "auto: false": só o instrutor escolhe.
  const m = (id, nivel, icone, titulo, dica, evento, extra = {}) => ({ id, nivel, icone, titulo, dica, evento, ...extra });
  const MISSOES = [
    // Iniciante
    m('aulas-3', 'n1', '🎓', 'Conclua 3 aulas nesta semana', 'Abra as Aulas e siga a sua trilha.', 'licao:concluida', { contar: 3 }),
    m('calculadora', 'n1', '🧮', 'Faça uma conta na Calculadora', 'Abra a Calculadora, faça uma conta e aperte "=".', 'calculadora:resultado'),
    m('cores', 'n1', '🎨', 'Pinte com 3 cores diferentes no Desenho', 'Abra o Desenho, escolha uma cor, desenhe; depois troque de cor.', 'desenho:cor', { contar: 3 }),
    m('nova-pasta', 'n1', '📁', 'Crie uma pasta nova no Arquivos', 'Abra o Arquivos e clique em "📁 Nova pasta" (ou botão direito › Novo › Pasta).', 'pasta:criada'),
    m('pasta', 'n1', '🗂️', 'Organize os arquivos: coloque um arquivo dentro de uma pasta', 'No Arquivos, arraste um arquivo para cima de uma pasta.', 'arquivo:movido'),
    m('salvar-texto', 'n1', '📝', 'Escreva e salve um texto no Editor', 'Abra o Editor de Texto, escreva algumas linhas e clique em 💾 Salvar.', 'arquivo:salvo', { se: (d) => d.tipo === 'documento' }),
    m('negrito', 'n1', '🅱️', 'Deixe uma palavra em negrito no Editor', 'Selecione a palavra (arrastando o mouse) e clique em N (ou Ctrl+N).', 'editor:formatado', { se: (d) => d.comando === 'bold' && d.ativo }),
    m('digitar-15', 'n1', '⌨️', 'Faça um exercício de digitação a 15 palavras por minuto', 'Abra a Digitação e faça um exercício com calma.', 'digitacao:concluida', { se: (d) => d.ppm >= 15 && !d.nivelamento }),
    m('jogo-mouse', 'n1', '🖱️', 'Vença um dos Jogos do Mouse', 'Abra os Jogos do Mouse e escolha um jogo.', 'jogo:concluido'),
    m('chuva', 'n1', '🌧️', 'Jogue a Chuva de palavras', 'Digitação › Jogos › Chuva de palavras.', 'digitacao:jogo'),
    m('fundo', 'n1', '🖼️', 'Troque o fundo da área de trabalho', 'Configurações › Personalizar, ou botão direito na área de trabalho › Personalizar.', 'config:fundo'),
    m('golpe', 'n1', '🕵️', 'Desmascare um golpe (no celular ou na internet)', 'No Celular, bloqueie um golpista; ou saia de um site falso sem digitar nada.', ['celular:golpe-evitado', 'golpe:evitado']),
    m('pesquisa', 'n1', '🔎', 'Pesquise um assunto no Procura', 'Abra o Navegador, escreva o que quer saber na caixa de pesquisa e aperte Enter.', 'navegador:pesquisa'),
    m('favorito', 'n1', '⭐', 'Coloque um site nos favoritos do Navegador', 'No site, clique na estrela ☆ ao lado da barra de endereço.', 'navegador:favorito'),
    m('lixeira', 'n1', '🗑️', 'Esvazie a Lixeira (depois de conferir o que tem nela)', 'Abra a Lixeira, confira se não tem nada importante e clique em "Esvaziar".', 'lixeira:esvaziada'),
    m('medalha', 'n1', '🏅', 'Ganhe uma medalha nova', 'Termine um módulo das aulas, bata uma meta de digitação ou vença um jogo.', 'medalha:ganha'),
    m('gincana', 'n1', '🏆', 'Participe de uma gincana da turma até o fim', 'Quando o professor abrir a gincana, entre e jogue até o pódio.', 'gincana:terminou', { auto: false }),
    // Intermediário
    m('email-anexo', 'n2', '📧', 'Mande um e-mail com um arquivo anexado', 'Abra o E-mail, clique em ✏️ Escrever, use o 📎 Anexar e envie (pode ser para professor@correio.escola).', 'email:enviado', { se: (d) => d.anexos >= 1 }),
    m('responder', 'n2', '↩️', 'Responda um e-mail', 'Abra uma mensagem da Caixa de entrada e clique em ↩️ Responder.', 'email:respondido'),
    m('autosoma', 'n2', '➕', 'Some uma coluna com a AutoSoma (Σ) na Planilha', 'Clique embaixo dos números e no botão Σ.', 'planilha:autosoma'),
    m('tabela', 'n2', '📋', 'Insira uma tabela num documento do Editor', 'Editor de Texto › botão da tabela: escolha as linhas e colunas.', 'editor:formatado', { se: (d) => d.comando === 'inserirTabela' }),
    m('pendrive', 'n2', '🔌', 'Copie um arquivo para o pen drive', 'No Arquivos, botão direito no arquivo › Enviar para › Pen drive.', 'arquivo:enviado', { se: (d) => d.para === 'pendrive' }),
    m('digitar-30', 'n2', '⌨️', 'Digite a 30 palavras por minuto (ou mais) num exercício', 'Abra a Digitação e faça um exercício com calma e ritmo.', 'digitacao:concluida', { se: (d) => d.ppm >= 30 && !d.nivelamento }),
    m('boleto', 'n2', '🧾', 'Pague um boleto no Banco Escola copiando e colando o código', 'Copie (Ctrl+C) o código do boleto e cole (Ctrl+V) em "🧾 Pagar boleto".', 'banco:boleto'),
    m('gov', 'n2', '🪪', 'Entre na sua Conta Cidadão (o treino do gov.br)', 'Navegador › cidadaodigital.org.br › Entrar com a Conta Cidadão.', 'gov:login'),
    m('pdf-form', 'n2', '📝', 'Preencha um formulário em PDF e salve preenchido', 'Abra um PDF com campos (ex.: Ficha de inscrição), escreva e clique em "💾 Salvar preenchido".', 'pdf:formulario-salvo'),
    m('juntar', 'n2', '➕', 'Junte dois PDFs num só', 'Leitor de PDF › "➕ Juntar PDFs".', 'pdf:juntado'),
    m('assinar', 'n2', '✍️', 'Assine um documento pelo Cidadão Digital', 'Abra o PDF no Leitor de PDF e clique em "✍️ Assinar".', 'gov:assinado'),
    m('escanear', 'n2', '📄', 'Digitalize um documento com o celular', 'Celular › Câmera › aponte para o Documento › "📄 Digitalizar documento".', 'celular:digitalizado'),
    m('jornal', 'n2', '📰', 'Mande uma matéria para o jornal da turma', 'Escreva no Editor de Texto (título e um parágrafo) e clique em 📰 Jornal.', 'jornal:enviada'),
    m('pix', 'cel', '💠', 'No Celular, faça um Pix conferindo o nome de quem recebe', 'Celular › Banco › Pix. Antes de pagar, confira o nome!', 'celular:pix', { se: (d) => !d.golpe }),
    m('pin', 'cel', '🔒', 'Proteja o celular com um PIN', 'Celular › Ajustes › Segurança › Criar PIN.', 'celular:pin'),
    m('duas-etapas', 'cel', '🛡️', 'Ative a verificação em duas etapas no celular', 'Celular › Zap › Ajustes › Verificação em duas etapas.', 'celular:duas-etapas'),
    m('bloquear', 'cel', '🚫', 'Bloqueie e denuncie um golpista no celular', 'Na conversa do golpista, toque no ⋮ › "Bloquear e denunciar".', 'celular:bloqueado', { se: (d) => d.denunciado }),
    // Avançado
    m('grafico', 'n3', '📊', 'Faça um gráfico na Planilha', 'Escreva uma tabelinha (nomes e números), selecione e clique em 📊 Gráfico.', 'planilha:grafico'),
    m('classificar', 'n3', '🔤', 'Coloque uma tabela em ordem alfabética (A→Z)', 'Na Planilha, clique numa célula da coluna e em "🔤 A→Z".', 'planilha:classificada'),
    m('filtro', 'n3', '🔽', 'Use o filtro numa planilha', 'Clique na tabela e em "🔽 Filtro"; escolha o que mostrar.', 'planilha:filtro'),
    m('moeda', 'n3', '💲', 'Mostre valores em dinheiro (R$) na Planilha', 'Selecione os números e clique no botão "R$".', 'planilha:formatada', { se: (d) => d.comando === 'formato' && d.valor === 'moeda' }),
    m('sumario', 'n3', '📑', 'Faça um sumário automático no Editor', 'Use os estilos Título 1 e Título 2 e clique em "📑 Sumário".', 'editor:sumario'),
    m('pdf', 'n3', '📕', 'Salve um documento em PDF', 'No Editor de Texto, clique em "📕 PDF".', 'editor:pdf'),
    m('apresentar', 'n3', '📽️', 'Apresente slides em tela cheia', 'Abra as Apresentações e clique em "▶ Apresentar".', 'apresentacao:iniciada'),
    m('transicao', 'n3', '✨', 'Coloque uma transição num slide', 'Apresentações › escolha um slide › Transição.', 'apresentacao:transicao'),
    m('backup', 'n3', '💾', 'Faça um backup dos seus arquivos no pen drive', 'Configurações › Backup no pen drive.', 'config:backup'),
    m('fatura', 'n3', '💳', 'Pague a fatura do cartão inteira (sem juros)', 'Banco Escola › 💳 Cartão › "Pagar o total".', 'banco:fatura', { se: (d) => d.opcao === 'total' }),
    m('emprestimo', 'n3', '💸', 'Simule um empréstimo e compare o CET', 'Banco Escola › 💸 Empréstimo › Simular.', 'banco:emprestimo-simulado'),
    m('anuncio', 'n3', '📢', 'Anuncie um produto com foto na Feira Online', 'Navegador › feiraonline.com.br › "📢 Anunciar".', 'feira:anuncio'),
    m('comprovante', 'n3', '🧾', 'Não caia no golpe do comprovante falso', 'Feira Online › 💬 Mensagens: só entregue depois que o dinheiro cair.', 'feira:golpe-evitado'),
    m('mei', 'n3', '🏪', 'Abra o MEI de treino no Portal do Empreendedor', 'Navegador › empreendedor.org.br › "📝 Formalize-se".', 'mei:aberto'),
    m('cartaz', 'cri', '🎨', 'Faça uma imagem: um cartaz no Desenho Vetorial ou uma foto editada', 'Use um modelo pronto do Desenho Vetorial e clique em 🖼️ Exportar PNG (ou salve uma foto no Editor de Fotos).', ['vetor:exportado', 'fotos:salva']),
    m('video', 'cri', '🎬', 'Exporte um vídeo no Editor de Vídeo', 'Monte uns clipes na linha do tempo e clique em "💾 Exportar o vídeo".', 'video:exportado'),
    // Profissional e Assistente Administrativo
    m('agenda', 'n4', '📅', 'Marque um compromisso na Agenda', 'Abra a Agenda, escolha o dia e clique em "＋ Compromisso".', 'agenda:compromisso'),
    m('nuvem', 'n4', '☁️', 'Compartilhe um arquivo pela Nuvem', 'Abra a Nuvem, escolha um arquivo e clique em "🔗 Compartilhar".', 'nuvem:compartilhado'),
    m('digitar-50', 'n4', '⚡', 'Digite a 50 palavras por minuto (ou mais) num exercício', 'Exercícios do nível Avançado ou Profissional da Digitação.', 'digitacao:concluida', { se: (d) => d.ppm >= 50 && !d.nivelamento }),
    m('gestao-cliente', 'n5', '🤝', 'Cadastre um cliente no Gestão Fácil', 'Abra o Gestão Fácil › Clientes › "＋ Novo cliente".', 'gestao:cliente'),
    m('gestao-venda', 'n5', '🧾', 'Registre uma venda no Gestão Fácil', 'Gestão Fácil › Vendas › "＋ Nova venda".', 'gestao:venda'),
  ];
  // Ordem dos níveis (os cursos livres contam a partir do nível que eles pedem).
  const ORDEM = { n1: 1, n2: 2, n3: 3, n4: 4, n5: 5, cel: 2, cri: 3 };
  const NOMES_NIVEL = { 1: 'Iniciante', 2: 'Intermediário', 3: 'Avançado', 4: 'Profissional', 5: 'Assistente Administrativo' };
  // Em que nível do curso principal o aluno está (a primeira aula ainda não aprovada da trilha).
  function nivelDe(p) {
    if (!p || !CE.curso || !CE.LICOES.length) return 1;
    try {
      const falta = CE.curso.aulasDaTrilha(p).find((l) => !CE.curso.paralelo(l.nivel) && !CE.curso.aprovada(l, p));
      return falta ? ORDEM[falta.nivel] || 1 : 5;
    } catch { return 1; }
  }

  // Semana do ano (a missão automática muda toda segunda-feira). Usa o relógio de verdade, não o relógio de treino das
  // Configurações (que o aluno pode mudar numa aula).
  function semana(data) {
    const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
    const dia = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dia);
    const inicio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const n = Math.ceil(((d - inicio) / 86400000 + 1) / 7);
    return { id: `${d.getUTCFullYear()}-S${String(n).padStart(2, '0')}`, numero: n };
  }
  const semanaAtual = () => semana(new Date());
  // A missão automática da semana para um nível: muda toda segunda, entre as missões que cabem no nível.
  const automatica = (nivel = 1) => { const lista = MISSOES.filter((x) => x.auto !== false && ORDEM[x.nivel] <= nivel); return lista[(semanaAtual().numero + (nivel - 1) * 7) % lista.length]; };
  const porId = (id) => MISSOES.find((m) => m.id === id) || null;

  let escolhida = null; // a missão que o instrutor escolheu (dados da escola)
  let registro = null; // o registro desta semana do aluno que está no computador
  let dono = null;
  let meuNivel = 1; // o nível de quem está no computador (para a missão automática)
  const escolhidaAgora = () => (escolhida && escolhida.id && (!escolhida.semana || escolhida.semana === semanaAtual().id) ? porId(escolhida.id) : null);
  const missaoPara = (nivel) => escolhidaAgora() || automatica(nivel);
  const missaoAtual = () => missaoPara(meuNivel);
  const chave = (m) => `${semanaAtual().id}:${m.id}`;
  const registroDe = (p, m) => (p && p.missoes && p.missoes[chave(m)]) || null;
  const aluno = () => CE.sessao.usuario && CE.sessao.usuario.papel !== 'instrutor';

  function desenharBandeja() {
    const b = document.getElementById('status-missao');
    if (!b) return;
    b.hidden = !aluno();
    const m = missaoAtual();
    const feita = !!(registro && registro.missao === m.id && registro.feita);
    b.classList.toggle('pendente', !feita);
    b.textContent = feita ? '🎯✅' : '🎯';
    b.title = `Missão da semana: ${m.titulo}${feita ? ' (cumprida!)' : ''}`;
  }
  async function cumprir(m) {
    const s = semanaAtual().id, k = chave(m);
    let nova = false;
    await CE.sessao.atualizarProgresso((p) => {
      p.missoes = p.missoes || {};
      const r = p.missoes[k] || { missao: m.id, semana: s, contador: 0 };
      if (r.feita) { registro = r; return; }
      r.contador = (r.contador || 0) + 1;
      if (r.contador >= (m.contar || 1)) { r.feita = Date.now(); nova = true; }
      p.missoes[k] = r;
      registro = { ...r };
    });
    desenharBandeja();
    if (nova) {
      CE.emitir('missao:cumprida', { missao: m.id, semana: s });
      CE.avisar(`🎯 MISSÃO DA SEMANA CUMPRIDA: ${m.titulo}! 🎉`);
      if (CE.comemorar) CE.comemorar('grande');
      if (CE.voz) CE.voz.falar('Parabéns! Você cumpriu a missão da semana!');
    } else if (registro && m.contar > 1 && !registro.feita) CE.avisar(`🎯 Missão da semana: ${registro.contador} de ${m.contar}.`);
  }

  // Cada evento que alguma missão usa: confere se é o da missão atual.
  const eventos = [...new Set(MISSOES.flatMap((m) => [].concat(m.evento)))];
  eventos.forEach((ev) => CE.ouvir(ev, (d) => {
    if (!aluno() || !dono || CE.sessao.usuario.id !== dono) return;
    const m = missaoAtual();
    if (![].concat(m.evento).includes(ev) || (m.se && !m.se(d || {}))) return;
    if (registro && registro.missao === m.id && registro.feita) return;
    cumprir(m).catch(() => {});
  }));

  // Lê a missão escolhida pelo instrutor e o registro do aluno (no servidor da sala).
  async function atualizar() {
    const quem = CE.sessao.usuario ? CE.sessao.usuario.id : null;
    try {
      const [e, p] = await Promise.all([CE.api.chamar('escola:ler'), quem ? CE.sessao.progresso() : null]);
      if (!CE.sessao.usuario || CE.sessao.usuario.id !== quem) return;
      escolhida = e && e.missao ? e.missao : null;
      meuNivel = nivelDe(p);
      registro = registroDe(p, missaoAtual());
    } catch { /* sem conexão: fica o que já tinha */ }
    desenharBandeja();
  }

  CE.MISSOES = MISSOES;
  CE.missao = {
    semana: semanaAtual,
    atual: missaoAtual,
    automatica,
    porId,
    async carregar() {
      registro = null; dono = CE.sessao.usuario ? CE.sessao.usuario.id : null;
      await atualizar();
      if (aluno() && !(registro && registro.feita)) setTimeout(() => { if (CE.sessao.usuario && CE.sessao.usuario.id === dono) CE.avisar(`🎯 Missão da semana: ${missaoAtual().titulo}`); }, 4000);
    },
    atualizar,
    reiniciar() { registro = null; dono = null; escolhida = null; meuNivel = 1; desenharBandeja(); },
    escolhida: escolhidaAgora, // a missão que o instrutor escolheu para todos (ou null: cada um tem a automática)
    nivelDe,
    NOMES_NIVEL,
    // Quantas missões o aluno já cumpriu (para as medalhas e o painel).
    cumpridas: (p) => Object.values((p && p.missoes) || {}).filter((r) => r && r.feita).length,
    // A missão desta semana de um aluno (para o painel do instrutor e o jornal).
    situacao(p) {
      const m = missaoPara(nivelDe(p));
      const r = registroDe(p, m);
      return { missao: m, feita: !!(r && r.feita), em: (r && r.feita) || null, contador: (r && r.contador) || 0 };
    },
    async mostrar() {
      await atualizar(); // a missão pode ter mudado no Painel do instrutor
      if (!CE.sessao.usuario) return;
      const m = missaoAtual();
      const feita = !!(registro && registro.missao === m.id && registro.feita);
      const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo missao-dialogo', 'data-missao': m.id },
        CE.el('h3', {}, '🎯 Missão da semana'),
        CE.el('p', { class: 'missao-titulo' }, `${m.icone} ${m.titulo}`),
        CE.el('p', { class: 'ft-dica' }, `💡 ${m.dica}`),
        CE.el('p', { 'data-missao-situacao': feita ? 'feita' : 'pendente' }, feita ? '✅ Missão cumprida! Na semana que vem tem outra.' : m.contar > 1 ? `Progresso: ${(registro && registro.contador) || 0} de ${m.contar}.` : '⏳ Ainda não cumprida. O computador confere sozinho quando você fizer.'),
        CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao', onclick: () => fundo.remove() }, 'OK'))));
      document.body.append(fundo);
      CE.emitir('missao:aberta', { missao: m.id });
    },
  };
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.getElementById('status-missao');
    if (b) b.addEventListener('click', () => CE.missao.mostrar());
  });
})();
