// Área de trabalho: ícones, botão Iniciar, barra de tarefas e relógio.
window.CE = window.CE || {};

(function () {
  let relogioTimer = null;

  const $ = (id) => document.getElementById(id);

  function appsDoUsuario() {
    const instrutor = CE.sessao.usuario.papel === 'instrutor';
    // Programas "instaláveis" só aparecem depois que o aluno instala pelas Configurações.
    return CE.listarApps().filter((a) => (!a.soInstrutor || instrutor) && (!a.instalavel || (CE.config && CE.config.instalado(a.id))));
  }

  function montarIcones() {
    const lista = $('icones');
    lista.replaceChildren(...appsDoUsuario().filter((a) => !a.semIcone).map((app) => {
      const icone = CE.el('button', { class: 'icone', 'data-icone': app.id, title: app.nome },
        CE.el('span', { class: 'icone-imagem' }, app.icone),
        CE.el('span', { class: 'icone-nome' }, app.nome),
      );
      icone.addEventListener('click', () => {
        lista.querySelectorAll('.icone').forEach((i) => i.classList.remove('selecionado'));
        icone.classList.add('selecionado');
        CE.emitir('icone:selecionado', { app: app.id });
      });
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
      CE.el('div', { class: 'menu-lista' }, ...appsDoUsuario().map((app) => CE.el('button', {
        class: 'menu-item', 'data-app': app.id,
        onclick: () => { fecharMenu(); CE.janelas.abrir(app.id); },
      }, CE.el('span', {}, app.icone), app.nome))),
      CE.el('div', { class: 'menu-rodape' },
        CE.el('button', { class: 'menu-item', 'data-acao': 'sair', onclick: () => { fecharMenu(); CE.sairDoSistema(); } }, CE.el('span', {}, '🚪'), 'Sair (trocar de usuário)'),
        CE.el('button', { class: 'menu-item', 'data-acao': 'desligar', onclick: () => CE.api.chamar('app:sair') }, CE.el('span', {}, '⏻'), 'Desligar'),
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

  function menuDeContexto(e) {
    if (e.target.closest('.janela, #barra-tarefas, #professor, #menu-iniciar')) return;
    e.preventDefault();
    const menu = $('menu-contexto');
    menu.replaceChildren(
      CE.el('button', { class: 'menu-item', onclick: () => { trocarFundo(); menu.hidden = true; } }, '🖼️ Mudar o fundo de tela'),
      CE.el('button', { class: 'menu-item', onclick: () => { montarIcones(); menu.hidden = true; } }, '🔄 Atualizar'),
    );
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.hidden = false;
    CE.emitir('menu-contexto:aberto');
  }

  function trocarFundo() {
    const lista = CE.FUNDOS_TELA.map((f) => f.id);
    const atual = lista.findIndex((f) => $('area-de-trabalho').classList.contains(f));
    definirFundo(lista[(atual + 1) % lista.length]);
    CE.emitir('fundo:trocado', { fundo: lista[(atual + 1) % lista.length] });
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
      if (!e.target.closest('#menu-contexto')) $('menu-contexto').hidden = true;
      if (!e.target.closest('.icone')) document.querySelectorAll('.icone.selecionado').forEach((i) => i.classList.remove('selecionado'));
    });
    $('area-de-trabalho').addEventListener('contextmenu', menuDeContexto);
    $('botao-voz').addEventListener('click', () => {
      const ligada = CE.voz.alternar();
      $('botao-voz').textContent = ligada ? '🔊' : '🔇';
      $('botao-voz').title = ligada ? 'Voz do professor ligada (clique para desligar)' : 'Voz do professor desligada (clique para ligar)';
    });
  }

  CE.entrarNoSistema = function (usuario) {
    CE.sessao.usuario = usuario;
    $('tela-login').hidden = true;
    $('area-de-trabalho').hidden = false;
    montarIcones();
    montarMenuIniciar();
    atualizarRelogio();
    clearInterval(relogioTimer);
    relogioTimer = setInterval(atualizarRelogio, 15000);
    if (CE.config) CE.config.carregar();
    if (CE.sala) CE.sala.iniciar();
    if (CE.aulasProfessor) CE.aulasProfessor.carregar();
    atualizarStatusIA();
    CE.professor.iniciar();
  };

  CE.sairDoSistema = async function () {
    CE.janelas.fecharTodas();
    if (CE.config) CE.config.reiniciar();
    if (CE.sala) CE.sala.parar();
    CE.pendrive.reiniciar();
    CE.areaTransferenciaArquivos = null;
    CE.professor.parar();
    // Sem conexão com o computador do instrutor, a saída continua: volta para a tela de entrada do mesmo jeito.
    await CE.api.chamar('sessao:sair').catch(() => {});
    CE.sessao.usuario = null;
    CE.mostrarLogin();
  };

  document.addEventListener('DOMContentLoaded', ligarEventosFixos);
})();
