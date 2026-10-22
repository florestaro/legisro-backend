// Avisa quando o aluno usa um atalho de teclado com Ctrl (ex.: Ctrl+C), para as lições de atalhos.
window.CE = window.CE || {};

(function () {
  const NOMES = { c: 'Ctrl+C', v: 'Ctrl+V', x: 'Ctrl+X', z: 'Ctrl+Z', y: 'Ctrl+Y', a: 'Ctrl+A', s: 'Ctrl+S', b: 'Ctrl+B', i: 'Ctrl+I', u: 'Ctrl+U', n: 'Ctrl+N', p: 'Ctrl+P' };
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const nome = NOMES[e.key.toLowerCase()];
    if (!nome) return;
    // O Explorador de Arquivos avisa os próprios atalhos (ele precisa impedir o comportamento normal antes).
    if (e.target.closest && e.target.closest('.janela[data-app="arquivos"], .janela[data-app="lixeira"]')) return;
    const janela = CE.janelas.ativa();
    CE.emitir('atalho:usado', { atalho: nome, app: janela ? janela.id : null });
  }, true);
})();
