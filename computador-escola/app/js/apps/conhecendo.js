// Conhecendo o Computador: um desenho da mesa com o computador. O aluno clica em cada peça para descobrir
// o nome e para que ela serve. O botão do gabinete liga e desliga o computador do desenho.
(function () {
  const PECAS = {
    monitor: { nome: 'Monitor (tela)', tipo: 'Saída', texto: 'É a tela onde aparece tudo o que o computador mostra: imagens, textos e vídeos. Parece uma televisão.' },
    gabinete: { nome: 'Gabinete (CPU)', tipo: 'Processamento', texto: 'É a caixa onde fica o "cérebro" do computador. Lá dentro estão o processador, a memória e o disco que guarda os arquivos. O botão de ligar fica nele.' },
    teclado: { nome: 'Teclado', tipo: 'Entrada', texto: 'Serve para escrever letras, números e dar comandos ao computador.' },
    mouse: { nome: 'Mouse', tipo: 'Entrada', texto: 'Move a setinha na tela. Com ele você clica, abre programas e escolhe as coisas.' },
    'caixa-som': { nome: 'Caixas de som', tipo: 'Saída', texto: 'Tocam os sons do computador: músicas, vídeos e a voz do professor.' },
    fone: { nome: 'Fone de ouvido', tipo: 'Saída', texto: 'Faz o mesmo que as caixas de som, mas só você escuta. Alguns fones também têm microfone.' },
    impressora: { nome: 'Impressora', tipo: 'Saída', texto: 'Passa para o papel o que está na tela: documentos, fotos e boletos.' },
    webcam: { nome: 'Webcam (câmera)', tipo: 'Entrada', texto: 'Uma pequena câmera, em cima da tela, usada para chamadas de vídeo e fotos.' },
    pendrive: { nome: 'Pen drive', tipo: 'Armazenamento', texto: 'Um "chaveirinho" que guarda arquivos. Serve para levar documentos de um computador para outro.' },
  };
  const TIPOS = {
    Entrada: 'Aparelho de ENTRADA: manda informações para o computador.',
    Saída: 'Aparelho de SAÍDA: o computador mostra ou entrega alguma coisa por ele.',
    Processamento: 'É onde o computador "pensa" e faz as contas.',
    Armazenamento: 'Aparelho de ARMAZENAMENTO: guarda arquivos.',
  };

  const DESENHO = `
  <svg viewBox="0 0 800 390" class="pc-cena" role="img" aria-label="Mesa com computador">
    <rect x="0" y="300" width="800" height="90" class="pc-mesa"/>
    <g data-peca="impressora" class="pc-peca" tabindex="0">
      <rect x="14" y="232" width="92" height="68" rx="8" class="pc-cinza"/>
      <rect x="28" y="214" width="64" height="22" class="pc-papel"/>
      <rect x="26" y="256" width="68" height="8" rx="2" class="pc-escuro"/>
      <circle cx="94" cy="246" r="4" class="pc-led"/>
    </g>
    <g data-peca="caixa-som" class="pc-peca" tabindex="0">
      <rect x="120" y="190" width="56" height="110" rx="8" class="pc-escuro"/>
      <circle cx="148" cy="222" r="12" class="pc-cinza"/><circle cx="148" cy="266" r="20" class="pc-cinza"/>
      <rect x="524" y="190" width="56" height="110" rx="8" class="pc-escuro"/>
      <circle cx="552" cy="222" r="12" class="pc-cinza"/><circle cx="552" cy="266" r="20" class="pc-cinza"/>
    </g>
    <g data-peca="monitor" class="pc-peca" tabindex="0">
      <rect x="198" y="42" width="308" height="196" rx="10" class="pc-escuro"/>
      <rect x="210" y="54" width="284" height="170" rx="3" class="pc-tela"/>
      <g class="pc-tela-ligada">
        <rect x="210" y="54" width="284" height="170" rx="3" class="pc-tela-fundo"/>
        <rect x="222" y="66" width="22" height="18" rx="3" class="pc-icone-tela"/><rect x="222" y="94" width="22" height="18" rx="3" class="pc-icone-tela"/>
        <rect x="270" y="90" width="150" height="90" rx="3" class="pc-janela-tela"/><rect x="270" y="90" width="150" height="12" class="pc-titulo-tela"/>
        <rect x="210" y="212" width="284" height="12" class="pc-barra-tela"/>
      </g>
      <rect x="334" y="238" width="36" height="40" class="pc-cinza"/>
      <rect x="300" y="276" width="104" height="12" rx="4" class="pc-cinza"/>
    </g>
    <g data-peca="webcam" class="pc-peca" tabindex="0">
      <rect x="330" y="24" width="44" height="20" rx="8" class="pc-cinza"/>
      <circle cx="352" cy="34" r="6" class="pc-lente"/>
    </g>
    <g data-peca="gabinete" class="pc-peca" tabindex="0">
      <rect x="612" y="74" width="124" height="226" rx="10" class="pc-escuro"/>
      <rect x="628" y="96" width="92" height="10" rx="3" class="pc-cinza"/>
      <rect x="628" y="114" width="92" height="10" rx="3" class="pc-cinza"/>
      <rect x="640" y="250" width="68" height="4" class="pc-cinza"/><rect x="640" y="260" width="68" height="4" class="pc-cinza"/><rect x="640" y="270" width="68" height="4" class="pc-cinza"/>
      <circle cx="702" cy="216" r="4" class="pc-led-gabinete"/>
    </g>
    <g data-peca="botao-ligar" class="pc-peca pc-botao" tabindex="0">
      <circle cx="674" cy="160" r="17" class="pc-botao-fundo"/>
      <path d="M674 150 V161 M665.5 154 A12 12 0 1 0 682.5 154" class="pc-simbolo"/>
    </g>
    <g data-peca="pendrive" class="pc-peca" tabindex="0">
      <rect x="664" y="190" width="20" height="10" class="pc-cinza"/>
      <rect x="658" y="196" width="32" height="44" rx="6" class="pc-pendrive"/>
    </g>
    <g data-peca="teclado" class="pc-peca" tabindex="0">
      <rect x="220" y="306" width="262" height="44" rx="6" class="pc-cinza"/>
      ${Array.from({ length: 3 }, (_, l) => Array.from({ length: 12 }, (_, c) => `<rect x="${230 + c * 20.5}" y="${312 + l * 11}" width="16" height="8" rx="1.5" class="pc-tecla"/>`).join('')).join('')}
    </g>
    <g data-peca="mouse" class="pc-peca" tabindex="0">
      <path d="M520 352 Q520 318 506 300" class="pc-fio"/>
      <ellipse cx="522" cy="338" rx="15" ry="22" class="pc-cinza"/>
      <path d="M522 316 V334" class="pc-linha-mouse"/>
    </g>
    <g data-peca="fone" class="pc-peca" tabindex="0">
      <path d="M44 350 Q70 302 96 350" class="pc-arco-fone"/>
      <rect x="34" y="342" width="18" height="26" rx="7" class="pc-escuro"/>
      <rect x="88" y="342" width="18" height="26" rx="7" class="pc-escuro"/>
    </g>
  </svg>`;

  CE.registrarApp({
    id: 'computador',
    nome: 'Conhecendo o Computador',
    icone: '🖥️',
    largura: 900,
    altura: 600,
    abrir(corpo) {
      let ligado = false;
      const vistas = new Set();
      const info = CE.el('div', { class: 'pc-info' });
      const contagem = CE.el('div', { class: 'pc-contagem' });

      function mostrar(id) {
        if (id === 'botao-ligar') {
          ligado = !ligado;
          cena.classList.toggle('ligado', ligado);
          info.replaceChildren(
            CE.el('h3', {}, ligado ? '⚡ Computador ligado!' : '⏻ Computador desligado'),
            CE.el('p', {}, ligado
              ? 'Você apertou o botão de ligar do gabinete. A tela acendeu! No computador de verdade, ele demora um pouquinho para ficar pronto.'
              : 'O computador do desenho desligou. Lembre: no computador de verdade, o certo é desligar pelo botão Iniciar, e não pelo botão do gabinete.'));
          CE.emitir(ligado ? 'computador:ligado' : 'computador:desligado');
          return;
        }
        const peca = PECAS[id];
        vistas.add(id);
        cena.querySelectorAll('.pc-peca').forEach((g) => g.classList.toggle('escolhida', g.dataset.peca === id));
        info.replaceChildren(
          CE.el('h3', {}, peca.nome),
          CE.el('span', { class: 'pc-tipo pc-tipo-' + peca.tipo.toLowerCase() }, peca.tipo),
          CE.el('p', {}, peca.texto),
          CE.el('p', { class: 'pc-tipo-explica' }, TIPOS[peca.tipo]),
        );
        contagem.textContent = `Peças descobertas: ${vistas.size} de ${Object.keys(PECAS).length}`;
        CE.voz.falar(`${peca.nome}. ${peca.texto}`);
        CE.emitir('peca:clicada', { peca: id, tipo: peca.tipo, total: vistas.size });
      }

      const cena = CE.el('div', { class: 'pc-desenho', html: DESENHO });
      cena.addEventListener('click', (e) => {
        const g = e.target.closest('[data-peca]');
        if (g) mostrar(g.dataset.peca);
      });
      cena.addEventListener('keydown', (e) => {
        const g = e.target.closest('[data-peca]');
        if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); mostrar(g.dataset.peca); }
      });

      info.append(CE.el('h3', {}, 'Clique numa parte do computador'), CE.el('p', {}, 'Passe a setinha do mouse por cima do desenho e clique em cada aparelho para saber o nome e para que ele serve. Tente achar o botão de ligar!'));
      contagem.textContent = `Peças descobertas: 0 de ${Object.keys(PECAS).length}`;
      corpo.classList.add('conhecendo');
      corpo.append(cena, CE.el('div', { class: 'pc-lado' }, info, contagem));
    },
  });
})();
