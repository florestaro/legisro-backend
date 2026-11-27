// Restaurante do Digão: roda o jogo (um Flash, restaurante-do-digao.swf) com o Ruffle, sem internet.
// Esta página fica num quadro dentro da janela do programa (app/js/apps/restaurante.js) e avisa a janela quando o
// jogo abriu (ou se deu erro) com postMessage. O jogo não abre links nem acessa a rede.
(function () {
  const avisar = (estado, detalhe) => { try { window.parent.postMessage({ de: 'restaurante-do-digao', estado, detalhe: detalhe || '' }, '*'); } catch (erro) { /* sem janela em volta */ } };
  const aviso = document.getElementById('aviso');
  const mostrarErro = (texto) => { aviso.hidden = false; aviso.replaceChildren(Object.assign(document.createElement('span'), { textContent: '😕 O jogo não abriu.' }), Object.assign(document.createElement('small'), { textContent: texto })); };
  if (!window.RufflePlayer || typeof window.RufflePlayer.newest !== 'function') { mostrarErro('Faltou o arquivo do Ruffle (ruffle/ruffle.js).'); avisar('erro', 'sem ruffle'); return; }
  window.RufflePlayer.config = {
    publicPath: new URL('ruffle/', location.href).href,
    autoplay: 'on', unmuteOverlay: 'hidden', splashScreen: false, letterbox: 'on', backgroundColor: '#1b1b1b',
    contextMenu: 'off', showSwfDownload: false, warnOnUnsupportedContent: false, polyfills: false,
    openUrlMode: 'deny', allowNetworking: 'none', allowFullscreen: false, logLevel: 'error',
  };
  const player = window.RufflePlayer.newest().createPlayer();
  document.getElementById('jogo').appendChild(player);
  const api = typeof player.ruffle === 'function' ? player.ruffle(1) : player;
  let abriu = false;
  player.addEventListener('loadedmetadata', () => { abriu = true; aviso.hidden = true; avisar('carregou'); });
  player.addEventListener('loadeddata', () => { aviso.hidden = true; avisar('pronto'); });
  Promise.resolve(api.load({ url: new URL('restaurante-do-digao.swf', location.href).href }))
    .catch((erro) => { mostrarErro(String((erro && erro.message) || erro)); avisar('erro', String((erro && erro.message) || erro)); });
  // Se demorar demais (computador muito lento), avisa sem travar: o jogo continua tentando.
  setTimeout(() => { if (!abriu) avisar('demorando'); }, 45000);
  // A janela do programa pode pedir para pausar (minimizada) e continuar.
  window.addEventListener('message', (ev) => {
    if (ev.source !== window.parent || !ev.data || ev.data.para !== 'restaurante-do-digao') return;
    try {
      // a interface nova do Ruffle chama de suspend/resume; a antiga (o próprio elemento), de pause/play
      if (ev.data.comando === 'pausar') (api.suspend ? api.suspend() : api.pause());
      else if (ev.data.comando === 'continuar') (api.resume ? api.resume() : api.play());
    } catch (erro) { /* ainda carregando */ }
  });
})();
