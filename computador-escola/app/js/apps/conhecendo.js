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

  // ---------- Por dentro do gabinete (Nível 4) ----------
  const INTERNAS = {
    'placa-mae': { nome: 'Placa-mãe', texto: 'A placa grande onde todas as outras peças se encaixam. Ela liga tudo com tudo, como as ruas de uma cidade.' },
    processador: { nome: 'Processador (CPU)', texto: 'O "cérebro": faz todas as contas. Quanto mais rápido, mais depressa os programas funcionam. Fica embaixo do cooler.' },
    cooler: { nome: 'Cooler (ventoinha)', texto: 'Um ventilador que esfria o processador. Se ele junta poeira, o computador esquenta, fica lento e pode desligar sozinho.' },
    memoria: { nome: 'Memória RAM', texto: 'A "mesa de trabalho": guarda o que está aberto AGORA. Com pouca memória, abrir muitos programas deixa tudo lento. Ela se apaga quando desliga.' },
    ssd: { nome: 'SSD / HD (armazenamento)', texto: 'O "armário": guarda os arquivos e programas, mesmo desligado. O SSD é bem mais rápido que o HD antigo.' },
    fonte: { nome: 'Fonte de energia', texto: 'Recebe a energia da tomada e entrega na medida certa para cada peça. Use estabilizador ou nobreak para proteger contra quedas de luz.' },
    video: { nome: 'Placa de vídeo', texto: 'Desenha as imagens na tela. Os jogos e programas de vídeo precisam de uma placa de vídeo mais forte.' },
  };
  const DENTRO = `
  <svg viewBox="0 0 800 390" class="pc-cena pc-dentro" role="img" aria-label="Gabinete aberto">
    <rect x="150" y="10" width="500" height="370" rx="14" class="pc-escuro"/>
    <rect x="166" y="26" width="468" height="338" rx="8" class="pc-interior"/>
    <g data-interna="placa-mae" class="pc-peca" tabindex="0"><rect x="186" y="40" width="330" height="250" rx="6" class="pc-placa"/>
      ${Array.from({ length: 6 }, (_, i) => `<path d="M200 ${70 + i * 34} H300" class="pc-trilha"/>`).join('')}</g>
    <g data-interna="processador" class="pc-peca" tabindex="0"><rect x="300" y="70" width="70" height="70" rx="4" class="pc-chip"/><text x="335" y="110" text-anchor="middle" class="pc-rotulo">CPU</text></g>
    <g data-interna="cooler" class="pc-peca" tabindex="0"><circle cx="240" cy="110" r="32" class="pc-cooler"/>
      ${[0, 72, 144, 216, 288].map((a) => `<path d="M240 110 L${240 + 27 * Math.cos(a * Math.PI / 180)} ${110 + 27 * Math.sin(a * Math.PI / 180)}" class="pc-helice"/>`).join('')}</g>
    <g data-interna="memoria" class="pc-peca" tabindex="0"><rect x="398" y="56" width="18" height="110" rx="2" class="pc-ram"/><rect x="416" y="56" width="18" height="110" rx="2" class="pc-ram"/></g>
    <g data-interna="video" class="pc-peca" tabindex="0"><rect x="206" y="190" width="250" height="40" rx="4" class="pc-video"/><circle cx="260" cy="210" r="14" class="pc-cooler"/><circle cx="320" cy="210" r="14" class="pc-cooler"/></g>
    <g data-interna="ssd" class="pc-peca" tabindex="0"><rect x="540" y="60" width="78" height="54" rx="4" class="pc-ssd"/><text x="579" y="92" text-anchor="middle" class="pc-rotulo">SSD</text></g>
    <g data-interna="fonte" class="pc-peca" tabindex="0"><rect x="186" y="300" width="160" height="56" rx="4" class="pc-fonte"/><circle cx="226" cy="328" r="18" class="pc-cooler"/><text x="300" y="333" text-anchor="middle" class="pc-rotulo">FONTE</text></g>
  </svg>`;
  // Manutenção básica: o que fazer para o computador durar (o aluno marca o que entendeu).
  const MANUTENCAO = [
    ['desligar', '⏻', 'Desligar e tirar da tomada antes de limpar.'],
    ['tela', '🖥️', 'Tela: só pano macio e seco (ou levemente úmido com água). Nada de álcool ou produto de limpeza.'],
    ['teclado', '⌨️', 'Teclado: virar de cabeça para baixo, bater de leve e passar um pincel entre as teclas.'],
    ['poeira', '🌬️', 'Poeira no gabinete: limpar as entradas de ar com pincel ou soprador. Poeira esquenta o computador.'],
    ['comida', '🥤', 'Não comer nem beber perto do computador: líquido no teclado estraga na hora.'],
    ['energia', '🔌', 'Usar estabilizador ou nobreak: protege contra queda e pico de energia.'],
    ['espaco', '🗑️', 'Esvaziar a Lixeira e apagar o que não usa: disco cheio deixa tudo lento.'],
    ['atualizar', '🔄', 'Fazer as atualizações e manter o antivírus ligado.'],
    ['backup', '💾', 'Fazer backup (pen drive ou nuvem): se o computador quebrar, os arquivos não se perdem.'],
  ];
  // Problemas comuns no trabalho: o aluno escolhe o que fazer primeiro.
  const PROBLEMAS = [
    { id: 'sem-imagem', icone: '🖥️', titulo: 'O computador liga (faz barulho), mas a tela fica preta.',
      opcoes: ['Conferir se o monitor está ligado e se o cabo está bem encaixado', 'Abrir o gabinete e trocar o processador', 'Chamar o técnico na hora'], certa: 0,
      explicacao: 'Comece pelo mais simples: o botão do monitor e o cabo de vídeo. Na maioria das vezes é isso!' },
    { id: 'travou', icone: '⏳', titulo: 'Um programa travou e aparece "Não está respondendo".',
      opcoes: ['Puxar o computador da tomada', 'Esperar um pouco e, se não voltar, finalizar pelo Gerenciador de Tarefas (Ctrl+Shift+Esc)', 'Clicar várias vezes no X'], certa: 1,
      explicacao: 'Desligar na tomada pode estragar arquivos. O Gerenciador de Tarefas fecha só o programa travado.' },
    { id: 'lento', icone: '🐢', titulo: 'O computador está muito lento.',
      opcoes: ['Fechar os programas que não está usando e reiniciar o computador', 'Instalar um "acelerador de PC" grátis da internet', 'Bater no gabinete'], certa: 0,
      explicacao: 'Programa aberto gasta memória. Reiniciar limpa a memória. "Aceleradores" grátis muitas vezes são vírus!' },
    { id: 'sem-internet', icone: '📶', titulo: 'A internet parou de funcionar.',
      opcoes: ['Formatar o computador', 'Conferir o Wi‑Fi (e o modo avião) e reiniciar o roteador', 'Trocar de navegador'], certa: 1,
      explicacao: 'Veja se o Wi‑Fi está ligado e conectado. Se o problema for de todos, desligue o roteador, espere 30 segundos e ligue de novo.' },
    { id: 'impressora', icone: '🖨️', titulo: 'Mandei imprimir e não saiu nada.',
      opcoes: ['Mandar imprimir mais 10 vezes', 'Conferir se a impressora está ligada, com papel e se é a impressora certa (padrão)', 'Desinstalar o Editor de Texto'], certa: 1,
      explicacao: 'Confira: ligada, com papel, sem papel enroscado e escolhida como impressora padrão nas Configurações.' },
    { id: 'barulho', icone: '🔥', titulo: 'O gabinete está fazendo muito barulho e esquentando.',
      opcoes: ['Tampar as entradas de ar para diminuir o barulho', 'Avisar o responsável: provavelmente o cooler precisa de limpeza', 'Jogar água para esfriar'], certa: 1,
      explicacao: 'Barulho e calor quase sempre são poeira no cooler. A limpeza interna é com o técnico ou o responsável.' },
  ];

  CE.registrarApp({
    id: 'computador',
    nome: 'Conhecendo o Computador',
    icone: '🖥️',
    largura: 900,
    altura: 600,
    abrir(corpo, janela, argumento) {
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

      // ---------- Por dentro ----------
      const vistasDentro = new Set();
      const infoDentro = CE.el('div', { class: 'pc-info' }, CE.el('h3', {}, 'Abrimos o gabinete!'), CE.el('p', {}, 'Clique em cada peça de dentro do computador para saber o que ela faz. (Num computador de verdade, só abra com ele desligado da tomada e com o responsável.)'));
      const contagemDentro = CE.el('div', { class: 'pc-contagem' }, `Peças descobertas: 0 de ${Object.keys(INTERNAS).length}`);
      const cenaDentro = CE.el('div', { class: 'pc-desenho', html: DENTRO });
      const mostrarInterna = (id) => {
        const peca = INTERNAS[id];
        vistasDentro.add(id);
        cenaDentro.querySelectorAll('[data-interna]').forEach((g) => g.classList.toggle('escolhida', g.dataset.interna === id));
        infoDentro.replaceChildren(CE.el('h3', {}, peca.nome), CE.el('p', {}, peca.texto));
        contagemDentro.textContent = `Peças descobertas: ${vistasDentro.size} de ${Object.keys(INTERNAS).length}`;
        CE.voz.falar(`${peca.nome}. ${peca.texto}`);
        CE.emitir('peca:interna', { peca: id, total: vistasDentro.size, todas: vistasDentro.size === Object.keys(INTERNAS).length });
      };
      cenaDentro.addEventListener('click', (e) => { const g = e.target.closest('[data-interna]'); if (g) mostrarInterna(g.dataset.interna); });

      // ---------- Manutenção ----------
      const feitos = new Set();
      const listaManutencao = CE.el('div', { class: 'pc-checklist' }, ...MANUTENCAO.map(([id, icone, texto]) => CE.el('label', { class: 'pc-check', 'data-manutencao': id },
        CE.el('input', { type: 'checkbox', onchange: (e) => {
          if (e.target.checked) feitos.add(id); else feitos.delete(id);
          CE.emitir('manutencao:item', { item: id, marcado: e.target.checked, total: feitos.size, todos: feitos.size === MANUTENCAO.length });
        } }), CE.el('span', {}, `${icone} ${texto}`))));

      // ---------- Problemas comuns ----------
      const resolvidos = new Set();
      const listaProblemas = CE.el('div', { class: 'pc-problemas' }, ...PROBLEMAS.map((pb) => {
        const resposta = CE.el('p', { class: 'pc-resposta', hidden: true });
        return CE.el('div', { class: 'pc-problema', 'data-problema': pb.id },
          CE.el('b', {}, `${pb.icone} ${pb.titulo}`),
          CE.el('div', { class: 'pc-opcoes' }, ...pb.opcoes.map((o, i) => CE.el('button', { class: 'botao secundario', 'data-opcao': String(i), onclick: (e) => {
            const certo = i === pb.certa;
            e.currentTarget.classList.add(certo ? 'certo' : 'errado');
            resposta.hidden = false;
            resposta.textContent = `${certo ? '✅ Isso mesmo!' : '❌ Melhor não.'} ${pb.explicacao}`;
            if (certo) resolvidos.add(pb.id);
            CE.emitir('problema:resposta', { problema: pb.id, certo, total: resolvidos.size, todos: resolvidos.size === PROBLEMAS.length });
          } }, o))), resposta);
      }));

      const telas = {
        fora: [cena, CE.el('div', { class: 'pc-lado' }, info, contagem)],
        dentro: [cenaDentro, CE.el('div', { class: 'pc-lado' }, infoDentro, contagemDentro)],
        manutencao: [CE.el('div', { class: 'pc-texto-largo' }, CE.el('h3', {}, '🧹 Manutenção básica: o que fazer para o computador durar'), CE.el('p', { class: 'cfg-sub' }, 'Leia cada cuidado e marque quando entender.'), listaManutencao)],
        problemas: [CE.el('div', { class: 'pc-texto-largo' }, CE.el('h3', {}, '🩺 Problemas comuns: o que fazer primeiro?'), CE.el('p', { class: 'cfg-sub' }, 'Antes de chamar o técnico, tente o mais simples. Escolha a melhor resposta para cada problema.'), listaProblemas)],
      };
      const area = CE.el('div', { class: 'pc-area' });
      const abas = CE.el('div', { class: 'gt-abas pc-abas' });
      let atualTela = (argumento && argumento.tela) || 'fora';
      function irTela(id) {
        atualTela = telas[id] ? id : 'fora';
        abas.replaceChildren(...[['fora', '🖥️ Por fora'], ['dentro', '🔧 Por dentro'], ['manutencao', '🧹 Manutenção'], ['problemas', '🩺 Problemas comuns']].map(([t, r]) => CE.el('button', {
          class: 'gt-aba' + (t === atualTela ? ' ativa' : ''), 'data-tela': t, onclick: () => { irTela(t); CE.emitir('computador:tela', { tela: t }); } }, r)));
        area.replaceChildren(...telas[atualTela]);
      }
      corpo.classList.add('conhecendo');
      corpo.append(abas, area);
      irTela(atualTela);
      return { receber(arg) { if (arg && arg.tela) irTela(arg.tela); } };
    },
  });
})();
