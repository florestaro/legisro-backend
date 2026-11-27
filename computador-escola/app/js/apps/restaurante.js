// "Restaurante do Digão": o jogo de gerenciar a rede de lanchonetes (o pasto, o abatedouro, as lojas e a sede da marca).
// É a adaptação em português de "The McDonald's Videogame", de Molleindustria (2005/06), licença CC BY-NC-SA 3.0
// (uso sem fins comerciais; veja app/jogos/restaurante-do-digao/LICENCA.txt). O jogo é um Flash e roda com o Ruffle
// num quadro separado (app/jogos/restaurante-do-digao/index.html), que tem a sua própria regra de segurança: só ali o
// WebAssembly do Ruffle é liberado. Abre pelo prédio da lanchonete na Praça Escola; cada aluno joga no seu computador,
// sem internet. Minimizada, a janela pausa o jogo; fechada, o jogo some.
window.CE = window.CE || {};

(function () {
  const PASTA = 'jogos/restaurante-do-digao/';
  CE.registrarApp({
    id: 'restaurante', nome: 'Restaurante do Digão', icone: '🍔', semIcone: true, largura: 1000, altura: 680,
    abrir(corpo) {
      corpo.classList.add('rd-app');
      corpo.dataset.estado = 'abrindo';
      const quadro = CE.el('iframe', { class: 'rd-quadro', src: PASTA + 'index.html', title: 'Restaurante do Digão', allow: 'autoplay' });
      const recado = CE.el('p', { class: 'rd-recado', hidden: true });
      const creditos = CE.el('p', { class: 'rd-creditos' },
        'Baseado em "The McDonald\'s Videogame" (Molleindustria, 2005/06) · licença CC BY-NC-SA 3.0, sem fins comerciais · roda com o Ruffle');
      corpo.append(quadro, recado, creditos);
      const mandar = (comando) => { try { quadro.contentWindow.postMessage({ para: 'restaurante-do-digao', comando }, '*'); } catch (erro) { /* o quadro ainda não abriu */ } };
      function ouvir(ev) {
        if (ev.source !== quadro.contentWindow || !ev.data || ev.data.de !== 'restaurante-do-digao') return;
        corpo.dataset.estado = ev.data.estado;
        recado.hidden = ev.data.estado !== 'erro' && ev.data.estado !== 'demorando';
        if (ev.data.estado === 'erro') recado.textContent = '😕 O jogo não abriu neste computador. Feche a janela e tente de novo; se continuar, avise o instrutor.';
        else if (ev.data.estado === 'demorando') recado.textContent = '⏳ O jogo está demorando para abrir (computador ocupado). Espere mais um pouco.';
      }
      window.addEventListener('message', ouvir);
      // Minimizou: pausa o jogo (o tempo do jogo não corre escondido); voltou: continua.
      let observador = null;
      requestAnimationFrame(() => {
        const janela = corpo.closest('.janela');
        if (!janela || typeof MutationObserver === 'undefined') return;
        let minimizada = janela.classList.contains('minimizada');
        observador = new MutationObserver(() => {
          const agora = janela.classList.contains('minimizada');
          if (agora !== minimizada) { minimizada = agora; mandar(agora ? 'pausar' : 'continuar'); }
        });
        observador.observe(janela, { attributes: true, attributeFilter: ['class'] });
      });
      return {
        aoFechar() {
          window.removeEventListener('message', ouvir);
          if (observador) observador.disconnect();
          quadro.remove(); // para o jogo e o som na hora
          return true;
        },
      };
    },
  });
})();
