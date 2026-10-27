// Área de trabalho: ícones, botão Iniciar, barra de tarefas e relógio.
window.CE = window.CE || {};

(function () {
  let relogioTimer = null;

  const $ = (id) => document.getElementById(id);

  function appsDoUsuario() {
    const instrutor = CE.sessao.usuario.papel === 'instrutor';
    // Programas "instaláveis" só aparecem depois que o aluno instala pelas Configurações (o instrutor vê todos).
    return CE.listarApps().filter((a) => (!a.soInstrutor || instrutor) && (!a.instalavel || instrutor || (CE.config && CE.config.instalado(a.id))));
  }

  function montarIcones() {
    const lista = $('icones');
    // Exibir › Ícones grandes, médios ou pequenos (menu do botão direito da área de trabalho).
    const tamanho = (CE.config && CE.config.atual.icones) || 'medios';
    ['grandes', 'medios', 'pequenos'].forEach((t) => lista.classList.toggle('icones-' + t, t === tamanho));
    lista.replaceChildren(...appsDoUsuario().filter((a) => !a.semIcone).map((app) => {
      const icone = CE.el('button', { class: 'icone', 'data-icone': app.id, title: app.nome },
        CE.el('span', { class: 'icone-imagem' }, app.icone),
        CE.el('span', { class: 'icone-nome' }, app.nome),
      );
      const selecionar = () => {
        lista.querySelectorAll('.icone').forEach((i) => i.classList.remove('selecionado'));
        icone.classList.add('selecionado');
        CE.emitir('icone:selecionado', { app: app.id });
      };
      icone.addEventListener('click', selecionar);
      // Botão direito no ícone: seleciona e mostra o menu dele (como no Windows).
      icone.addEventListener('contextmenu', (e) => { selecionar(); menuDoIcone(e, app); });
      icone.addEventListener('dblclick', () => CE.janelas.abrir(app.id));
      icone.addEventListener('keydown', (e) => e.key === 'Enter' && CE.janelas.abrir(app.id));
      return icone;
    }));
  }

  function montarMenuIniciar() {
    const menu = $('menu-iniciar');
    const u = CE.sessao.usuario;
    menu.replaceChildren(
      CE.el('div', { class: 'menu-usuario' }, CE.el('span', { class: 'login-avatar' }, u.avatar), CE.el('strong', {}, u.nome)),
      CE.el('div', { class: 'menu-lista' }, ...appsDoUsuario().map((app) => {
        const item = CE.el('button', {
          class: 'menu-item', 'data-app': app.id,
          onclick: () => { fecharMenu(); CE.janelas.abrir(app.id); },
        }, CE.el('span', {}, app.icone), app.nome);
        item.addEventListener('contextmenu', (e) => CE.menuContexto.abrir(e, 'menu-iniciar', [
          { id: 'abrir', rotulo: 'Abrir', negrito: true, icone: app.icone, acao: () => { fecharMenu(); CE.janelas.abrir(app.id); } },
          app.instalavel ? '-' : null,
          app.instalavel ? { id: 'desinstalar', rotulo: 'Desinstalar', icone: '🗑️', acao: () => { fecharMenu(); CE.janelas.abrir('configuracoes', { secao: 'aplicativos' }); } } : null,
        ].filter(Boolean), app.id));
        return item;
      })),
      CE.el('div', { class: 'menu-rodape' },
        CE.el('button', { class: 'menu-item', 'data-acao': 'sair', onclick: () => { fecharMenu(); CE.sairDoSistema(); } }, CE.el('span', {}, '🚪'), 'Sair (trocar de usuário)'),
        CE.el('button', { class: 'menu-item', 'data-acao': 'desligar', onclick: async () => { fecharMenu(); await CE.sairDoSistema(); CE.api.chamar('app:sair'); } }, CE.el('span', {}, '⏻'), 'Desligar'),
      ),
    );
  }

  function abrirMenu() {
    $('menu-iniciar').hidden = false;
    $('botao-iniciar').classList.add('ativo');
    CE.emitir('menu-iniciar:aberto');
  }
  function fecharMenu() {
    $('menu-iniciar').hidden = true;
    $('botao-iniciar').classList.remove('ativo');
  }

  function atualizarRelogio() {
    const agora = CE.config ? CE.config.agora() : new Date();
    $('relogio').replaceChildren(
      CE.el('div', {}, agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })),
      CE.el('div', {}, agora.toLocaleDateString('pt-BR')),
    );
  }

  async function atualizarStatusIA() {
    const s = await CE.api.chamar('ia:status');
    const indicador = $('status-ia');
    const textos = {
      pronta: ['🧠', 'Professor com IA ligada'],
      carregando: ['⏳', 'Carregando a IA do professor...'],
      'sem-modelo': ['💬', 'Professor com respostas prontas (sem modelo de IA instalado)'],
      erro: ['⚠️', 'A IA não carregou: ' + s.detalhe],
      desligada: ['💬', 'Professor com respostas prontas'],
    };
    const [simbolo, dica] = textos[s.estado] || textos.desligada;
    indicador.textContent = simbolo;
    indicador.title = dica;
    if (s.estado === 'carregando') setTimeout(atualizarStatusIA, 3000);
  }

  // ---------- Botão direito na área de trabalho, nos ícones e na barra de tarefas ----------
  function menuDaAreaDeTrabalho(e) {
    if (e.defaultPrevented || e.target.closest('.janela, #barra-tarefas, #professor, #menu-iniciar, .icone')) return;
    const tamanho = (CE.config && CE.config.atual.icones) || 'medios';
    const opcao = (id, rotulo) => ({ id: 'icones-' + id, rotulo, marcado: tamanho === id, acao: () => tamanhoDosIcones(id) });
    CE.menuContexto.abrir(e, 'area-de-trabalho', [
      { id: 'exibir', rotulo: 'Exibir', icone: '👁️', submenu: [opcao('grandes', 'Ícones grandes'), opcao('medios', 'Ícones médios'), opcao('pequenos', 'Ícones pequenos')] },
      { id: 'atualizar', rotulo: 'Atualizar', icone: '🔄', acao: () => { montarIcones(); CE.emitir('area:atualizada'); } },
      '-',
      { id: 'personalizar', rotulo: 'Personalizar', icone: '🎨', acao: () => CE.janelas.abrir('configuracoes', { secao: 'personalizar' }) },
      { id: 'configuracoes-exibicao', rotulo: 'Configurações de exibição', icone: '🖥️', acao: () => CE.janelas.abrir('configuracoes', { secao: 'acessibilidade' }) },
    ]);
  }

  function tamanhoDosIcones(tamanho) {
    if (CE.config) CE.config.guardar({ icones: tamanho });
    montarIcones();
    CE.emitir('area:icones', { tamanho });
  }

  function menuDoIcone(e, app) {
    CE.menuContexto.abrir(e, 'icone', [
      { id: 'abrir', rotulo: 'Abrir', negrito: true, icone: app.icone, acao: () => CE.janelas.abrir(app.id) },
      app.id === 'lixeira' ? { id: 'esvaziar-lixeira', rotulo: 'Esvaziar Lixeira', icone: '🧹', acao: esvaziarLixeira } : null,
      '-',
      app.instalavel ? { id: 'desinstalar', rotulo: 'Desinstalar', icone: '🗑️', acao: () => CE.janelas.abrir('configuracoes', { secao: 'aplicativos' }) } : null,
      '-',
      { id: 'propriedades', rotulo: 'Propriedades', icone: 'ℹ️', acao: () => CE.mostrarPropriedades(app.nome, app.icone, [
        ['Tipo', app.instalavel ? 'Programa instalado pelas Configurações' : 'Programa do computador'],
        ['Abrir', 'Clique duplo no ícone, Enter, ou botão direito › Abrir'],
        ['Local', 'Área de trabalho e menu Iniciar'],
      ], 'programa') },
    ].filter(Boolean), app.id);
  }

  async function esvaziarLixeira() {
    const itens = (await CE.sessao.arquivos()).filter((a) => a.naLixeira && (!a.grupoLixeira || a.grupoLixeira === a.id));
    if (!itens.length) { CE.avisar('A Lixeira já está vazia.'); return; }
    if (!await CE.confirmar(`Tem certeza de que deseja excluir permanentemente ${itens.length === 1 ? `"${itens[0].nome}"` : `estes ${itens.length} itens`}? Não dá para desfazer.`)) return;
    await CE.sessao.esvaziarLixeira();
    CE.avisar('🧹 A Lixeira foi esvaziada.');
  }

  function menuDaBarraDeTarefas(e) {
    if (e.defaultPrevented) return;
    if (e.target.closest('#botao-iniciar')) {
      CE.menuContexto.abrir(e, 'botao-iniciar', [
        { id: 'configuracoes', rotulo: 'Configurações', icone: '⚙️', acao: () => CE.janelas.abrir('configuracoes') },
        { id: 'explorador', rotulo: 'Explorador de Arquivos', icone: '📁', acao: () => CE.janelas.abrir('arquivos') },
        '-',
        { id: 'area-de-trabalho', rotulo: 'Área de trabalho', icone: '🖥️', acao: () => CE.janelas.minimizarTodas() },
        '-',
        { id: 'desligar-ou-sair', rotulo: 'Desligar ou sair', icone: '⏻', submenu: [
          { id: 'sair', rotulo: 'Sair (trocar de usuário)', icone: '🚪', acao: () => CE.sairDoSistema() },
          { id: 'desligar', rotulo: 'Desligar', icone: '⏻', acao: async () => { await CE.sairDoSistema(); CE.api.chamar('app:sair'); } },
        ] },
      ]);
      return;
    }
    if (e.target.closest('.tarefa, .bandeja')) return;
    CE.menuContexto.abrir(e, 'barra-tarefas', [
      { id: 'mostrar-area-de-trabalho', rotulo: 'Mostrar a área de trabalho', icone: '🖥️', acao: () => CE.janelas.minimizarTodas() },
    ]);
  }
  function definirFundo(fundo) {
    const area = $('area-de-trabalho');
    CE.FUNDOS_TELA.forEach((f) => area.classList.remove(f.id));
    area.classList.add(fundo);
    if (CE.config) CE.config.guardar({ fundo });
  }

  CE.FUNDOS_TELA = [
    { id: 'fundo-azul', nome: 'Azul' }, { id: 'fundo-verde', nome: 'Floresta' }, { id: 'fundo-por-do-sol', nome: 'Pôr do sol' },
    { id: 'fundo-noite', nome: 'Noite' }, { id: 'fundo-rio', nome: 'Rio Madeira' }, { id: 'fundo-cafe', nome: 'Café' },
  ];
  CE.areaTrabalho = {
    definirFundo,
    atualizar() { if (CE.sessao.usuario) { montarIcones(); montarMenuIniciar(); atualizarRelogio(); } },
  };

  function ligarEventosFixos() {
    $('botao-iniciar').addEventListener('click', (e) => {
      e.stopPropagation();
      $('menu-iniciar').hidden ? abrirMenu() : fecharMenu();
    });
    document.addEventListener('pointerdown', (e) => {
      if (!e.target.closest('#menu-iniciar, #botao-iniciar')) fecharMenu();
      if (!e.target.closest('.icone')) document.querySelectorAll('.icone.selecionado').forEach((i) => i.classList.remove('selecionado'));
    });
    // Esc fecha o menu Iniciar, como no Windows.
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('menu-iniciar').hidden) { fecharMenu(); $('botao-iniciar').focus(); } });
    $('area-de-trabalho').addEventListener('contextmenu', menuDaAreaDeTrabalho);
    $('barra-tarefas').addEventListener('contextmenu', menuDaBarraDeTarefas);
    $('botao-voz').addEventListener('click', () => {
      const ligada = CE.voz.alternar();
      $('botao-voz').textContent = ligada ? '🔊' : '🔇';
      $('botao-voz').title = ligada ? 'Voz do professor ligada (clique para desligar)' : 'Voz do professor desligada (clique para ligar)';
    });
  }

  CE.entrarNoSistema = function (usuario) {
    CE.sessao.usuario = usuario;
    CE.sessao.geracao++;
    $('tela-login').hidden = true;
    $('area-de-trabalho').hidden = false;
    montarIcones();
    montarMenuIniciar();
    atualizarRelogio();
    clearInterval(relogioTimer);
    relogioTimer = setInterval(atualizarRelogio, 15000);
    if (CE.config) CE.config.carregar();
    if (CE.sala) CE.sala.iniciar();
    if (CE.frequencia) CE.frequencia.iniciar();
    if (CE.aulasProfessor) CE.aulasProfessor.carregar();
    if (CE.contaCidadao) CE.contaCidadao.carregar();
    atualizarStatusIA();
    CE.professor.iniciar();
  };

  // Uma saída de cada vez: quem chamar durante a saída espera a mesma.
  let saida = null;
  CE.sairDoSistema = function () {
    if (saida) return saida;
    // Enquanto as últimas gravações terminam, nada mais pode ser aberto na conta de quem está saindo.
    const tela = CE.el('div', { class: 'tela-saindo', 'data-saindo': '' }, CE.el('p', {}, '💾 Salvando e saindo…'));
    document.body.append(tela);
    CE.sessao.saindo = true; // nenhuma janela nova abre durante a saída
    saida = sair().finally(() => { tela.remove(); CE.sessao.saindo = false; saida = null; });
    return saida;
  };
  // Caixas abertas pelos programas (Localizar, Anexar, perguntas...) não ficam na tela de entrada.
  function fecharDialogos() {
    CE.fecharDialogos();
    document.querySelectorAll('.dialogo-fundo:not([data-sessao-perdida]), .tela-reiniciando, #area-impressao').forEach((d) => d.remove());
  }
  async function sair() {
    CE.janelas.fecharTodas();
    fecharDialogos();
    if (CE.frequencia) CE.frequencia.parar(); // os minutos que faltam entram na fila de gravação
    await CE.sessao.aguardarGravacoes();
    CE.janelas.fecharTodas();
    fecharDialogos();
    CE.sessao.geracao++;
    if (CE.config) CE.config.reiniciar();
    if (CE.sala) CE.sala.parar();
    CE.pendrive.reiniciar();
    CE.areaTransferenciaArquivos = null;
    CE.professor.parar();
    // Sem conexão com o computador do instrutor, a saída continua: volta para a tela de entrada do mesmo jeito.
    await CE.api.chamar('sessao:sair').catch(() => {});
    CE.sessao.usuario = null;
    CE.mostrarLogin();
  }

  // A conta foi aberta em outro computador (ou removida pelo instrutor): este computador sai dela e explica o porquê.
  let saindoPorPerda = false;
  CE.ouvir('sessao:perdida', async ({ motivo }) => {
    if (saindoPorPerda || !CE.sessao.usuario) return;
    saindoPorPerda = true;
    try {
      await CE.sairDoSistema();
      if (document.querySelector('[data-sessao-perdida]')) return;
      const fundo = CE.el('div', { class: 'dialogo-fundo', 'data-sessao-perdida': '' },
        CE.el('div', { class: 'dialogo' },
          CE.el('p', {}, `🔒 ${motivo}`),
          CE.el('p', {}, 'Para continuar, é só entrar de novo.'),
          CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao', onclick: () => fundo.remove() }, 'OK'))));
      document.body.append(fundo);
    } finally { saindoPorPerda = false; }
  });

  document.addEventListener('DOMContentLoaded', ligarEventosFixos);
})();
