// Desenho do mouse mostrando qual botão usar (aparece no cartão do Professor Virtual).
// Tipos: 'esquerdo', 'duplo', 'direito', 'arrastar', 'roda', 'mover'.
window.CE = window.CE || {};

(function () {
  const ROTULOS = {
    esquerdo: ['Botão ESQUERDO', '1 clique'],
    duplo: ['Botão ESQUERDO', '2 cliques rápidos'],
    direito: ['Botão DIREITO', '1 clique'],
    arrastar: ['Botão ESQUERDO', 'segure e arraste'],
    roda: ['RODINHA', 'gire para rolar'],
    mover: ['Mexa o mouse', 'em cima da mesa'],
  };

  // Posição (x) da seta em cima de cada parte do mouse.
  const ALVO = { esquerdo: 40, duplo: 40, direito: 80, arrastar: 40, roda: 60 };

  const SETA = 'M-9 0 H9 V16 H19 L0 36 L-19 16 H-9 Z';

  CE.figuraMouse = function (tipo) {
    if (!ROTULOS[tipo]) return null;
    const x = ALVO[tipo];
    const svg = `
      <svg viewBox="0 0 120 190" width="92" height="146" role="img" aria-label="${ROTULOS[tipo].join(', ')}">
        <g class="mouse-corpo" transform="translate(0 40)">
          <path class="mouse-base" d="M20 50 Q20 10 60 10 Q100 10 100 50 V105 Q100 145 60 145 Q20 145 20 105 Z"/>
          <path class="mouse-parte ${tipo === 'esquerdo' || tipo === 'duplo' || tipo === 'arrastar' ? 'ativa' : ''} ${tipo === 'duplo' ? 'duplo' : ''}" d="M20 62 V50 Q20 10 60 10 V62 Z"/>
          <path class="mouse-parte ${tipo === 'direito' ? 'ativa' : ''}" d="M60 10 Q100 10 100 50 V62 H60 Z"/>
          <rect class="mouse-parte roda ${tipo === 'roda' ? 'ativa' : ''}" x="53" y="22" width="14" height="28" rx="7"/>
        </g>
        ${x ? `<path class="mouse-seta" transform="translate(${x} 2)" d="${SETA}"/>` : ''}
        ${tipo === 'duplo' ? '<text class="mouse-vezes" x="64" y="30">2×</text>' : ''}
        ${tipo === 'arrastar' ? '<path class="mouse-movimento" d="M76 30 H112 M104 22 L112 30 L104 38" fill="none"/>' : ''}
        ${tipo === 'roda' ? '<path class="mouse-movimento" d="M96 22 V2 M90 8 L96 2 L102 8 M96 30 V50 M90 44 L96 50 L102 44" fill="none"/>' : ''}
      </svg>`;
    return CE.el('div', { class: `mouse-figura mouse-${tipo}` },
      CE.el('div', { class: 'mouse-desenho', html: svg }),
      CE.el('div', { class: 'mouse-rotulo' }, CE.el('strong', {}, ROTULOS[tipo][0]), CE.el('span', {}, ROTULOS[tipo][1])),
    );
  };
})();
