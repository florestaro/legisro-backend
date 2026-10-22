// Menu do botão direito, parecido com o do Windows: aparece onde o mouse está, com ícones, atalhos de teclado
// à direita, separadores, opções apagadas quando não dá para usar e submenus (▸). Fecha ao clicar fora, com Esc
// ou ao escolher uma opção. Também funciona pelo teclado (setas, Enter, Esc e a tecla de menu / Shift+F10).
//
//   CE.menuContexto.abrir(evento, 'arquivos', [
//     { id: 'abrir', rotulo: 'Abrir', negrito: true, acao: () => ... },
//     '-',                                                    // separador
//     { id: 'copiar', rotulo: 'Copiar', icone: '📋', atalho: 'Ctrl+C', desativado: !selecionado, acao },
//     { id: 'novo', rotulo: 'Novo', icone: '✨', submenu: [ { id: 'nova-pasta', rotulo: 'Pasta', acao } ] },
//   ]);
//
// Eventos para as lições: "menu-contexto:aberto" { onde, alvo } e "menu-contexto:opcao" { onde, opcao, alvo }.
window.CE = window.CE || {};

(function () {
  let raiz = null;         // o menu aberto (com os submenus dentro de "camadas")
  let camadas = [];        // [menu principal, submenu, sub-submenu...]
  let contexto = null;     // { onde, alvo }
  let timerSub = null;

  const visiveis = (lista) => lista.filter((i) => i && (i === '-' || !i.oculto));
  // Tira separadores repetidos, do começo e do fim (como o Windows faz quando uma opção não se aplica).
  function limpar(lista) {
    const r = [];
    visiveis(lista).forEach((i) => { if (i === '-' && (!r.length || r[r.length - 1] === '-')) return; r.push(i); });
    while (r[r.length - 1] === '-') r.pop();
    return r;
  }

  function posicionar(el, x, y, lado) {
    el.style.left = '0px'; el.style.top = '0px';
    const w = el.offsetWidth, h = el.offsetHeight;
    let esquerda = x, topo = y;
    if (lado) { // submenu: ao lado do item; se não couber à direita, abre à esquerda
      esquerda = lado.right - 2 + w > innerWidth ? lado.left - w + 2 : lado.right - 2;
      topo = lado.top - 5;
    } else if (esquerda + w > innerWidth) esquerda = Math.max(0, x - w);
    if (topo + h > innerHeight) topo = Math.max(0, lado ? innerHeight - h - 4 : y - h);
    el.style.left = Math.max(0, esquerda) + 'px';
    el.style.top = Math.max(0, topo) + 'px';
  }

  function itensDe(el) { return [...el.querySelectorAll(':scope > .mc-item:not([disabled])')]; }

  function fecharDesde(nivel) {
    camadas.slice(nivel).forEach((c) => c.remove());
    camadas = camadas.slice(0, nivel);
    if (camadas.length) camadas[camadas.length - 1].querySelectorAll('.mc-item.aberto').forEach((i) => i.classList.remove('aberto'));
  }

  function montar(lista, nivel) {
    const el = CE.el('div', { class: 'mc-menu', role: 'menu', 'data-nivel': nivel, 'data-onde': contexto.onde });
    limpar(lista).forEach((item) => {
      if (item === '-') { el.append(CE.el('div', { class: 'mc-separador', role: 'separator' })); return; }
      const temSub = item.submenu && limpar(item.submenu).length;
      const botao = CE.el('button', {
        class: 'mc-item' + (item.negrito ? ' negrito' : '') + (temSub ? ' tem-sub' : ''), role: 'menuitem', type: 'button',
        'data-opcao': item.id || '', disabled: item.desativado ? true : null, title: item.dica || null,
      },
      CE.el('span', { class: 'mc-icone' }, item.marcado ? '✓' : item.icone || ''),
      CE.el('span', { class: 'mc-rotulo' }, item.rotulo),
      CE.el('span', { class: 'mc-atalho' }, temSub ? '›' : item.atalho || ''));
      // Não tira o foco nem a seleção de onde o aluno estava (o Editor precisa da seleção para copiar ou colar).
      botao.addEventListener('pointerdown', (e) => e.preventDefault());
      botao.addEventListener('mousedown', (e) => e.preventDefault());
      const abrirSub = () => {
        clearTimeout(timerSub);
        fecharDesde(nivel + 1);
        botao.classList.add('aberto');
        const sub = montar(item.submenu, nivel + 1);
        document.body.append(sub);
        camadas.push(sub);
        posicionar(sub, 0, 0, botao.getBoundingClientRect());
      };
      botao.addEventListener('pointerenter', () => {
        clearTimeout(timerSub);
        if (temSub && !item.desativado) timerSub = setTimeout(abrirSub, 250);
        else if (camadas.length > nivel + 1) timerSub = setTimeout(() => fecharDesde(nivel + 1), 250);
        el.querySelectorAll('.mc-item.foco').forEach((i) => i.classList.remove('foco'));
      });
      botao.addEventListener('click', (e) => {
        e.stopPropagation();
        if (item.desativado) return;
        if (temSub) { abrirSub(); return; }
        escolher(item);
      });
      botao._abrirSub = temSub ? abrirSub : null;
      el.append(botao);
    });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    return el;
  }

  function escolher(item) {
    const { onde, alvo } = contexto || {};
    fechar();
    CE.emitir('menu-contexto:opcao', { onde, opcao: item.id, alvo });
    if (item.acao) {
      try {
        const r = item.acao();
        if (r && r.catch) r.catch((e) => CE.avisar('⚠️ ' + e.message));
      } catch (e) { CE.avisar('⚠️ ' + e.message); }
    }
  }

  function fechar() {
    clearTimeout(timerSub);
    camadas.forEach((c) => c.remove());
    camadas = [];
    raiz = null;
    contexto = null;
  }

  // evento: o "contextmenu" do navegador (para saber onde o mouse está) ou { x, y }.
  function abrir(evento, onde, lista, alvo = '') {
    if (evento && evento.preventDefault) evento.preventDefault();
    fechar();
    if (!limpar(lista).length) return null;
    let x = evento ? evento.clientX : 0, y = evento ? evento.clientY : 0;
    // Pela tecla de menu (ou Shift+F10) o navegador manda a posição 0,0: o menu aparece junto do elemento.
    if (evento && evento.target && evento.target.getBoundingClientRect && !x && !y) {
      const r = evento.target.getBoundingClientRect();
      x = r.left + Math.min(24, r.width / 2); y = r.top + Math.min(r.height, 24);
    }
    contexto = { onde, alvo };
    raiz = montar(lista, 0);
    document.body.append(raiz);
    camadas = [raiz];
    posicionar(raiz, x, y);
    CE.emitir('menu-contexto:aberto', { onde, alvo });
    return raiz;
  }

  // Teclado com o menu aberto (sem tirar o foco de onde o aluno estava).
  document.addEventListener('keydown', (e) => {
    if (!raiz) return;
    const menu = camadas[camadas.length - 1];
    const itens = itensDe(menu);
    const atual = itens.findIndex((i) => i.classList.contains('foco'));
    const focar = (n) => { itens.forEach((i) => i.classList.remove('foco')); if (itens[n]) itens[n].classList.add('foco'); };
    const parar = () => { e.preventDefault(); e.stopPropagation(); };
    if (e.key === 'Escape') { parar(); if (camadas.length > 1) fecharDesde(camadas.length - 1); else fechar(); }
    else if (e.key === 'ArrowDown') { parar(); focar(atual < 0 ? 0 : (atual + 1) % itens.length); }
    else if (e.key === 'ArrowUp') { parar(); focar(atual <= 0 ? itens.length - 1 : atual - 1); }
    else if (e.key === 'ArrowRight' && atual >= 0 && itens[atual]._abrirSub) {
      parar(); itens[atual]._abrirSub();
      const novo = camadas[camadas.length - 1]; const primeiro = itensDe(novo)[0]; if (primeiro) primeiro.classList.add('foco');
    } else if (e.key === 'ArrowLeft' && camadas.length > 1) { parar(); fecharDesde(camadas.length - 1); }
    else if (e.key === 'Enter' && atual >= 0) { parar(); itens[atual].click(); }
    else if (e.key === 'Tab') parar();
  }, true);

  // Clicar fora fecha (o clique direito em outro lugar fecha este e abre o novo).
  document.addEventListener('pointerdown', (e) => { if (raiz && !e.target.closest('.mc-menu')) fechar(); }, true);
  window.addEventListener('blur', () => { if (raiz) fechar(); });
  window.addEventListener('resize', () => { if (raiz) fechar(); });
  // Girar a rodinha fora do menu fecha (a rolagem feita pelo próprio programa, como a planilha mostrando a célula, não).
  document.addEventListener('wheel', (e) => { if (raiz && !e.target.closest('.mc-menu')) fechar(); }, { capture: true, passive: true });

  // ---------- Área de transferência de texto ----------
  // Copiar e recortar pelo menu usam a área de transferência de verdade. Colar: no programa instalado, o
  // Windows cola (igual ao Ctrl+V); no navegador, cola o último texto copiado aqui dentro (quando o navegador não
  // deixa a página ler a área de transferência).
  let copiado = null; // { texto, html }
  function guardarCopia() {
    const ativo = document.activeElement;
    if (ativo && (ativo.tagName === 'INPUT' || ativo.tagName === 'TEXTAREA') && ativo.selectionStart != null) {
      copiado = { texto: ativo.value.slice(ativo.selectionStart, ativo.selectionEnd), html: null };
      return;
    }
    const s = window.getSelection();
    if (!s || !s.rangeCount || s.isCollapsed) return;
    const caixa = document.createElement('div');
    caixa.append(s.getRangeAt(0).cloneContents());
    copiado = { texto: s.toString(), html: caixa.innerHTML };
  }
  document.addEventListener('copy', guardarCopia, true);
  document.addEventListener('cut', guardarCopia, true);

  const texto = {
    temSelecao() {
      const a = document.activeElement;
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return a.selectionStart !== a.selectionEnd;
      const s = window.getSelection();
      return !!(s && s.rangeCount && !s.isCollapsed);
    },
    copiar() { document.execCommand('copy'); CE.emitir('texto:copiado', { pelo: 'menu' }); },
    recortar() { document.execCommand('cut'); CE.emitir('texto:recortado', { pelo: 'menu' }); },
    async colar() {
      if (window.api) { await CE.api.chamar('janela:colar'); CE.emitir('texto:colado', { pelo: 'menu' }); return; }
      let t = null;
      try { t = await navigator.clipboard.readText(); } catch { t = null; }
      const editavel = document.activeElement && document.activeElement.isContentEditable;
      if (t != null && !(copiado && copiado.texto === t && copiado.html && editavel)) document.execCommand('insertText', false, t);
      else if (copiado && copiado.html && editavel) document.execCommand('insertHTML', false, copiado.html);
      else if (copiado) document.execCommand('insertText', false, copiado.texto);
      else { CE.avisar('Nada para colar. Primeiro copie alguma coisa.'); return; }
      CE.emitir('texto:colado', { pelo: 'menu' });
    },
    excluir() { document.execCommand('delete'); },
    // Copia um texto pronto (ex.: o endereço de um link).
    copiarTexto(t) {
      copiado = { texto: String(t), html: null };
      try { const p = navigator.clipboard && navigator.clipboard.writeText(String(t)); if (p && p.catch) p.catch(() => {}); } catch { /* fica só a cópia daqui */ }
      CE.emitir('texto:copiado', { pelo: 'menu', texto: String(t) });
    },
    selecionarTudo() {
      const a = document.activeElement;
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) a.select(); else document.execCommand('selectAll');
    },
    // Itens padrão de um lugar onde se escreve: Recortar, Copiar, Colar...
    itens({ desfazer = true, selecionarTudo = true } = {}) {
      const sel = texto.temSelecao();
      return [
        desfazer ? { id: 'desfazer', rotulo: 'Desfazer', icone: '↶', atalho: 'Ctrl+Z', acao: () => document.execCommand('undo') } : null,
        desfazer ? '-' : null,
        { id: 'recortar', rotulo: 'Recortar', icone: '✂️', atalho: 'Ctrl+X', desativado: !sel, acao: texto.recortar },
        { id: 'copiar', rotulo: 'Copiar', icone: '📋', atalho: 'Ctrl+C', desativado: !sel, acao: texto.copiar },
        { id: 'colar', rotulo: 'Colar', icone: '📌', atalho: 'Ctrl+V', acao: texto.colar },
        { id: 'excluir', rotulo: 'Excluir', icone: '🗑️', desativado: !sel, acao: texto.excluir },
        selecionarTudo ? '-' : null,
        selecionarTudo ? { id: 'selecionar-tudo', rotulo: 'Selecionar tudo', icone: '▦', atalho: 'Ctrl+A', acao: texto.selecionarTudo } : null,
      ].filter(Boolean);
    },
  };

  // Onde nenhum programa preparou um menu: campos de texto ganham o menu de texto; no resto, nada aparece
  // (o menu do navegador nunca aparece dentro do computador de treino).
  document.addEventListener('contextmenu', (e) => {
    if (e.defaultPrevented) return;
    e.preventDefault();
    const campo = e.target.closest && e.target.closest('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=button]), textarea, [contenteditable="true"]');
    if (campo && !campo.readOnly && !campo.disabled) {
      if (document.activeElement !== campo) campo.focus();
      abrir(e, 'texto', texto.itens());
    }
  });

  // Janela "Propriedades" (botão direito › Propriedades), com a aba Geral do Windows.
  CE.mostrarPropriedades = function (nome, icone, linhas, de = '') {
    const fundo = CE.el('div', { class: 'dialogo-fundo' }, CE.el('div', { class: 'dialogo propriedades', 'data-propriedades': nome },
      CE.el('div', { class: 'prop-titulo' }, `Propriedades de ${nome}`),
      CE.el('div', { class: 'prop-aba' }, 'Geral'),
      CE.el('div', { class: 'prop-cabeca' }, CE.el('span', { class: 'prop-icone' }, icone), CE.el('b', {}, nome)),
      CE.el('dl', { class: 'prop-linhas' }, ...linhas.filter(Boolean).flatMap(([r, v]) => [CE.el('dt', {}, r + ':'), CE.el('dd', {}, v)])),
      CE.el('div', { class: 'dialogo-botoes' }, CE.el('button', { class: 'botao', 'data-acao': 'ok-propriedades', onclick: () => fundo.remove() }, 'OK'))));
    document.body.append(fundo);
    fundo.querySelector('.botao').focus();
    CE.emitir('propriedades:abertas', { nome, de });
  };

  CE.menuContexto = { abrir, fechar, aberto: () => !!raiz, texto };
})();
