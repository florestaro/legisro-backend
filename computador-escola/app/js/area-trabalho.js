// Área de trabalho: ícones, botão Iniciar, barra de tarefas e relógio.
window.CE = window.CE || {};

(function () {
  const FUNDOS = ['fundo-azul', 'fundo-verde', 'fundo-por-do-sol', 'fundo-noite'];
  let indiceFundo = 0;
  let relogioTimer = null;

  const $ = (id) => document.getElementById(id);

  function appsDoUsuario() {
    const instrutor = CE.sessao.usuario.papel === 'instrutor';
    return CE.listarApps().filter((a) => !a.soInstrutor || instrutor);
  }

  function montarIcones() {
    const lista = $('icones');
    lista.replaceChildren(...appsDoUsuario().map((app) => {
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
    const agora = new Date();
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
    const area = $('area-de-trabalho');
    area.classList.remove(FUNDOS[indiceFundo]);
    indiceFundo = (indiceFundo + 1) % FUNDOS.length;
    area.classList.add(FUNDOS[indiceFundo]);
    CE.emitir('fundo:trocado', { fundo: FUNDOS[indiceFundo] });
  }

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
    atualizarStatusIA();
    CE.professor.iniciar();
  };

  CE.sairDoSistema = async function () {
    CE.janelas.fecharTodas();
    CE.professor.parar();
    await CE.api.chamar('sessao:sair');
    CE.sessao.usuario = null;
    CE.mostrarLogin();
  };

  document.addEventListener('DOMContentLoaded', ligarEventosFixos);
})();
