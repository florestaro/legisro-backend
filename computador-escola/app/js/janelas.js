// Gerenciador de janelas do computador simulado: abrir, mover, minimizar, maximizar e fechar.
window.CE = window.CE || {};

(function () {
  const apps = {};
  const abertas = {}; // id do app -> { elemento, botaoTarefa, controle, instancia }
  let camadaZ = 10;
  let deslocamento = 0;

  CE.registrarApp = function (definicao) {
    apps[definicao.id] = definicao;
  };
  CE.listarApps = () => Object.values(apps);
  CE.app = (id) => apps[id];

  function area() { return document.getElementById('area-janelas'); }
  function barra() { return document.getElementById('tarefas-programas'); }

  function focar(id) {
    Object.values(abertas).forEach((j) => {
      j.elemento.classList.remove('ativa');
      j.botaoTarefa.classList.remove('ativa');
    });
    const j = abertas[id];
    if (!j) return;
    j.elemento.style.zIndex = ++camadaZ;
    j.elemento.classList.add('ativa');
    j.botaoTarefa.classList.add('ativa');
  }

  function minimizar(id) {
    const j = abertas[id];
    j.elemento.classList.add('minimizada');
    j.botaoTarefa.classList.remove('ativa');
    CE.emitir('janela:minimizada', { app: id });
  }

  function restaurar(id) {
    const j = abertas[id];
    const estava = j.elemento.classList.contains('minimizada');
    j.elemento.classList.remove('minimizada');
    focar(id);
    if (estava) CE.emitir('janela:restaurada', { app: id });
  }

  function alternarMaximizar(id) {
    const j = abertas[id];
    const maximizada = j.elemento.classList.toggle('maximizada');
    CE.emitir(maximizada ? 'janela:maximizada' : 'janela:normal', { app: id });
  }

  function fechar(id) {
    const j = abertas[id];
    if (!j) return;
    if (j.instancia && j.instancia.aoFechar && j.instancia.aoFechar() === false) return;
    j.elemento.remove();
    j.botaoTarefa.remove();
    delete abertas[id];
    CE.emitir('janela:fechada', { app: id });
  }

  function permitirArrastar(janela, id) {
    const titulo = janela.querySelector('.janela-titulo');
    titulo.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || janela.classList.contains('maximizada')) return;
      focar(id);
      const inicioX = e.clientX, inicioY = e.clientY;
      const esquerda = janela.offsetLeft, topo = janela.offsetTop;
      titulo.setPointerCapture(e.pointerId);
      const mover = (ev) => {
        const limite = area().getBoundingClientRect();
        janela.style.left = Math.min(Math.max(esquerda + ev.clientX - inicioX, -janela.offsetWidth + 80), limite.width - 80) + 'px';
        janela.style.top = Math.min(Math.max(topo + ev.clientY - inicioY, 0), limite.height - 40) + 'px';
      };
      const soltar = (ev) => {
        titulo.removeEventListener('pointermove', mover);
        titulo.removeEventListener('pointerup', soltar);
        const distancia = Math.hypot(ev.clientX - inicioX, ev.clientY - inicioY);
        if (distancia > 30) CE.emitir('janela:movida', { app: id, distancia });
      };
      titulo.addEventListener('pointermove', mover);
      titulo.addEventListener('pointerup', soltar);
    });
    titulo.addEventListener('dblclick', (e) => { if (!e.target.closest('button')) alternarMaximizar(id); });
  }

  CE.janelas = {
    abrir(id, argumento) {
      const app = apps[id];
      if (!app) return;
      if (abertas[id]) {
        restaurar(id);
        if (argumento !== undefined && abertas[id].instancia && abertas[id].instancia.receber) {
          abertas[id].instancia.receber(argumento);
        }
        return;
      }
      const largura = app.largura || 640, altura = app.altura || 460;
      const limite = area().getBoundingClientRect();
      deslocamento = (deslocamento + 28) % 168;
      const janela = CE.el('div', { class: 'janela', 'data-app': id, role: 'dialog', 'aria-label': app.nome },
        CE.el('div', { class: 'janela-titulo' },
          CE.el('span', { class: 'janela-icone' }, app.icone),
          CE.el('span', { class: 'janela-nome' }, app.nome),
          CE.el('button', { class: 'janela-botao', 'data-acao': 'minimizar', title: 'Minimizar', onclick: () => minimizar(id) }, '–'),
          CE.el('button', { class: 'janela-botao', 'data-acao': 'maximizar', title: 'Maximizar', onclick: () => alternarMaximizar(id) }, '□'),
          CE.el('button', { class: 'janela-botao fechar', 'data-acao': 'fechar', title: 'Fechar', onclick: () => fechar(id) }, '✕'),
        ),
        CE.el('div', { class: 'janela-corpo' }),
      );
      janela.style.width = Math.min(largura, limite.width - 20) + 'px';
      janela.style.height = Math.min(altura, limite.height - 20) + 'px';
      janela.style.left = Math.max(10, (limite.width - largura) / 2 - 84 + deslocamento) + 'px';
      janela.style.top = Math.max(10, (limite.height - altura) / 2 - 84 + deslocamento) + 'px';
      janela.addEventListener('pointerdown', () => focar(id));

      const botaoTarefa = CE.el('button', {
        class: 'tarefa', 'data-app': id, title: app.nome,
        onclick: () => {
          const j = abertas[id];
          if (j.elemento.classList.contains('minimizada') || !j.elemento.classList.contains('ativa')) restaurar(id);
          else minimizar(id);
        },
      }, CE.el('span', {}, app.icone), CE.el('span', { class: 'tarefa-nome' }, app.nome));

      area().append(janela);
      barra().append(botaoTarefa);
      permitirArrastar(janela, id);

      const controle = {
        fechar: () => fechar(id),
        definirTitulo: (t) => { janela.querySelector('.janela-nome').textContent = t ? `${t} — ${app.nome}` : app.nome; },
      };
      abertas[id] = { elemento: janela, botaoTarefa, controle, instancia: null };
      focar(id);
      abertas[id].instancia = app.abrir(janela.querySelector('.janela-corpo'), controle, argumento) || null;
      CE.emitir('app:aberto', { app: id });
    },
    fechar,
    fecharTodas() { Object.keys(abertas).forEach((id) => { abertas[id].instancia = null; fechar(id); }); },
    estaAberta: (id) => !!abertas[id],
    // Programa em primeiro plano (para o professor saber onde o aluno está).
    ativa() {
      const id = Object.keys(abertas).find((k) => abertas[k].elemento.classList.contains('ativa') && !abertas[k].elemento.classList.contains('minimizada'));
      return id ? apps[id] : null;
    },
  };
})();
